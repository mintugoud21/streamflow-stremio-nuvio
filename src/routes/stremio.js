const express = require('express');
const router = express.Router();
const config = require('../config');
const { getStremioManifest } = require('../manifest');
const { resolveMetadata } = require('../metadata/cinemeta');
const { getStreams } = require('../scrapers');
const { parseUserConfig } = require('../utils/parser');

// Unconfigured manifest
router.get('/manifest.json', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const manifest = getStremioManifest(baseUrl);
  res.setHeader('Cache-Control', 'max-age=86400, public');
  res.json(manifest);
});

// Configured manifest
router.get('/:config/manifest.json', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const userConfig = parseUserConfig(req.params.config);
  const manifest = getStremioManifest(baseUrl, userConfig);
  res.setHeader('Cache-Control', 'max-age=86400, public');
  res.json(manifest);
});

// Stream handler logic
async function handleStream(req, res, userConfig = null) {
  const { type, id } = req.params;
  const baseUrl = config.getBaseUrl(req);

  // Strip .json suffix if present in id
  const cleanId = id.replace(/\.json$/, '');

  try {
    // 1. Resolve media details from Cinemeta
    const meta = await resolveMetadata(type, cleanId);

    // 2. Query scrapers
    const streams = await getStreams(meta, userConfig, baseUrl);

    // Send cache headers (cache stream results for 30 minutes in clients/CDNs)
    res.setHeader('Cache-Control', 'max-age=1800, public');
    return res.json({ streams: streams || [] });
  } catch (err) {
    console.error(`Error resolving streams for ${type}/${cleanId}:`, err);
    return res.json({ streams: [] });
  }
}

// Unconfigured stream endpoint
router.get('/stream/:type/:id', (req, res) => {
  handleStream(req, res, null);
});

// Configured stream endpoint
router.get('/:config/stream/:type/:id', (req, res) => {
  const userConfig = parseUserConfig(req.params.config);
  handleStream(req, res, userConfig);
});

module.exports = router;
