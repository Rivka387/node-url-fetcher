const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Welcome to your Node.js server!');
});

app.get('/fetch', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing "url" parameter.');

  try {
    const response = await axios.get(url);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Error fetching page: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
