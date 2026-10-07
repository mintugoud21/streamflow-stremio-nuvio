const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Proxy stream requests to bypass CORS and header restrictions for web streams
 */
router.get('/stream', async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer || targetUrl;

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': referer,
      'Accept': '*/*'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers,
      responseType: 'stream',
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 400
    });

    // Pass through relevant headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
      res.status(206);
    } else {
      res.status(response.status);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    response.data.pipe(res);
  } catch (err) {
    console.error('Proxy stream error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Error streaming media: ' + err.message);
    }
  }
});

module.exports = router;
