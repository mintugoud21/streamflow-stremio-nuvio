const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getNuvioPluginManifest } = require('../manifest');
const { parseUserConfig } = require('../utils/parser');

// Nuvio Plugin Manifest (JSON format)
router.get('/nuvio-plugin.json', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const plugin = getNuvioPluginManifest(baseUrl);
  res.setHeader('Cache-Control', 'max-age=86400, public');
  res.json(plugin);
});

// Configured Nuvio Plugin
router.get('/:config/nuvio-plugin.json', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const userConfig = parseUserConfig(req.params.config);
  const plugin = getNuvioPluginManifest(baseUrl, userConfig);
  res.setHeader('Cache-Control', 'max-age=86400, public');
  res.json(plugin);
});

// Export/download nuvio-plugin.json file
router.get('/api/nuvio/export', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const configParam = req.query.config;
  const userConfig = configParam ? parseUserConfig(configParam) : null;
  const plugin = getNuvioPluginManifest(baseUrl, userConfig);

  res.setHeader('Content-Disposition', 'attachment; filename="nuvio-streamflow-plugin.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(plugin, null, 2));
});

// Serve native Nuvio repository manifest
router.get('/nuvio-manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, '..', '..', 'nuvio-manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(manifestPath);
  }
  res.status(404).json({ error: 'Manifest not found' });
});

// Serve native Nuvio bundled provider
router.get('/providers/streamflow.js', (req, res) => {
  const providerPath = path.join(__dirname, '..', '..', 'providers', 'streamflow.js');
  if (fs.existsSync(providerPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.sendFile(providerPath);
  }
  res.status(404).send('Provider not found');
});

// Direct download for streamflow.js
router.get('/api/nuvio/download-provider', (req, res) => {
  const providerPath = path.join(__dirname, '..', '..', 'providers', 'streamflow.js');
  if (fs.existsSync(providerPath)) {
    return res.download(providerPath, 'streamflow.js');
  }
  res.status(404).send('File not found');
});

module.exports = router;
