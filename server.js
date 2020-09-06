require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const moment = require("moment");
const ShortUrl = require("./models/shortUrl");
const mongoose = require("mongoose");
const favicon = require("serve-favicon");
const path = require("path");
const rootFolder = process.env.BASE_FOLDER;

mongoose.connect(process.env.MONGOOSE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(morgan("tiny"));
app.use(favicon(path.join(__dirname, "public", "favicon.png")));
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.post("/shortUrls", async (req, res) => {
  await ShortUrl.findOne({ full: req.body.fullURL }, (err, duplicate) => {
    if (err) console.log(err);
    if (duplicate) {
      res.render("already_exists", { url: req.body.fullURL });
    } else {
      ShortUrl.create({ full: req.body.fullURL }, (err, data) => {
        if (err) console.log(err);
        if (data) res.render("new_url", { url: data });
      });
    }
  });
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.full);
});

app.get("/", async (req, res) => {
  const shortUrls = await ShortUrl.find().limit(5).sort({ createdAt: -1 });
  res.render("index", { shortUrls: shortUrls, moment: moment });
});

const port = process.env.PORT;

app.listen(port || 5000);
console.log(`Server started! Connected on port: ${port}`);
