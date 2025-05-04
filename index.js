require('dotenv').config();
const express = require('express');
const app = express();
const dns = require('dns');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Url = require('./models/url'); // Assuming you have a Url model defined in models/url.js

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", async (req, res) => {
  const original_url = req.body.url;

  // Validate the URL
  try {
    const urlObj = new URL(original_url); // Will throw if invalid

    //dns lookup to validate host 
    dns.lookup(urlObj.hostname, async (err) => {
      if (err) return res.json({ error: "invalid url" });

      try {
        // Check if already exists
        let found = await Url.findOne({ original_url });
        if (found) {
          return res.json({
            original_url: found.original_url,
            short_url: found.short_url
          });
        }

        // Get next short_url number
        const last = await Url.findOne().sort({ short_url: -1 });
        const nextShortUrl = last ? last.short_url + 1 : 1;

        // Create new
        const newUrl = new Url({
          original_url,
          short_url: nextShortUrl
        });

        await newUrl.save();
        res.json({
          original_url: newUrl.original_url,
          short_url: newUrl.short_url
        });
      } catch (err) {
        return res.json({ error: "Server error" });
      }
    });
  } catch (err) {
    return res.json({ error: "invalid url" });
  }
});

//GET - Redirect to original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = parseInt(req.params.short_url);

  try {
    const found = await Url.findOne({ short_url });
    if (found) return res.redirect(found.original_url);
    else return res.status(404).json({ error: 'No short URL found' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 3000;
// Start the server
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



/*
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return res.json({ error: "invalid url" });
    }
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  try {
    // Check if URL already exists
    let existingUrl = await Url.findOne({ original_url });
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // Find the highest short_url number
    const lastUrl = await Url.findOne().sort({ short_url: -1 });
    const nextShortUrl = lastUrl ? lastUrl.short_url + 1 : 1;

    // Create and save new short URL
    const newUrl = new Url({
      original_url,
      short_url: nextShortUrl
    });

    await newUrl.save();

    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
*/

/*
//API endpoint to handle URL shortening
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

//API endpoint to handle redirection
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const urlData = await Url.findOne({ short_url: short });
  if (urlData) return res.redirect(urlData.original_url);
  res.json({ error: 'No short URL found for the given input' });
});
*/

/*
//API endpoint to handle URL deletion
app.delete('/api/shorturl/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const urlData = await Url.findOneAndDelete({ short_url: short });
  if (urlData) return res.json({ message: 'URL deleted successfully' });
  res.json({ error: 'No short URL found for the given input' });
}); 

//API endpoint to handle URL update
app.put('/api/shorturl/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const newUrl = req.body.url;
  try {
    const urlObj = new URL(newUrl);
    dns.lookup(urlObj.hostname, async (err) => {
      if (err) return res.json({ error: 'invalid url' });

      const updatedUrl = await Url.findOneAndUpdate(
        { short_url: short },
        { original_url: newUrl },
        { new: true }
      );
      if (updatedUrl) return res.json({ message: 'URL updated successfully' });
      res.json({ error: 'No short URL found for the given input' });
    });
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }
});
//API endpoint to handle URL listing
app.get('/api/shorturl', async (req, res) => {
  const urls = await Url.find({});
  res.json(urls);
});

//API endpoint to handle URL search
app.get('/api/shorturl/search', async (req, res) => {
  const searchTerm = req.query.q;
  const urls = await Url.find({ original_url: { $regex: searchTerm, $options: 'i' } });
  res.json(urls);
});

//API endpoint to handle URL statistics
app.get('/api/shorturl/stats/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const urlData = await Url.findOne({ short_url: short });
  if (urlData) {
    const stats = {
      original_url: urlData.original_url,
      short_url: urlData.short_url,
      created_at: urlData.created_at,
      updated_at: urlData.updated_at
    };
    return res.json(stats);
  } else {  
    res.json({ error: 'No short URL found for the given input' });
  }
});
//API endpoint to handle URL expiration
app.get('/api/shorturl/expire/:short_url', async (req, res) => {
  const short = parseInt(req.params.short_url);
  const urlData = await Url.findOne({ short_url: short });
  if (urlData) {
    const expirationDate = new Date(urlData.created_at);
    expirationDate.setDate(expirationDate.getDate() + 30); // Set expiration to 30 days from creation
    if (new Date() > expirationDate) {
      await Url.deleteOne({ short_url: short });
      return res.json({ message: 'URL expired and deleted' });
    } else {
      return res.json({ message: 'URL is still valid' });
    }
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
})

//Basic Configuration
const cors = require('cors');
const app = express(),  // Initialize express app
        mongoose = require('mongoose'), // MongoDB connection
        bodyParser = require('body-parser'), // Middleware for parsing request bodies
        dns = require('dns'), // DNS lookup
        Url = require('./models/url'); // URL model

// Basic Configuration
const port = process.env.PORT || 3000;
app 

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
*/