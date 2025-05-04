const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const bodyParser = require('body-parser');
const Url = require('./models/url');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST URL
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  try {
    const urlObj = new URL(url);
    dns.lookup(urlObj.hostname, async (err) => {
      if (err) return res.json({ error: 'invalid url' });

      let count = await Url.countDocuments({});
      const newUrl = new Url({ original_url: url, short_url: count + 1 });
      await newUrl.save();
      res.json({ original_url: url, short_url: count + 1 });
    });
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }
});

// GET Redirect
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const urlData = await Url.findOne({ short_url: short });

  if (urlData) {
    res.redirect(urlData.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});