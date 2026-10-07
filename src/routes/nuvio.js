const express = require('express');
const router = express.Router();
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

module.exports = router;
