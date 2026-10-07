const express = require('express');
const router = express.Router();
const config = require('../config');
const { streamCache, metaCache } = require('../utils/cache');
const { resolveMetadata } = require('../metadata/cinemeta');
const { getStreams, ALL_SCRAPERS } = require('../scrapers');
const { serializeUserConfig, parseUserConfig } = require('../utils/parser');

// Health and Status
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    addon: config.addonName,
    version: config.addonVersion,
    uptimeSeconds: Math.floor(process.uptime()),
    cache: {
      streamEntries: streamCache.size,
      metaEntries: metaCache.size
    },
    availableScrapers: Object.keys(ALL_SCRAPERS)
  });
});

// Live Stream Tester endpoint for the web dashboard
router.get('/test-stream', async (req, res) => {
  const startTime = Date.now();
  const type = req.query.type || 'movie';
  const id = req.query.id || 'tt0111161';
  const configParam = req.query.config;
  const baseUrl = config.getBaseUrl(req);

  const userConfig = configParam ? parseUserConfig(configParam) : {};

  try {
    const meta = await resolveMetadata(type, id);
    const streams = await getStreams(meta, userConfig, baseUrl);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      query: { type, id },
      durationMs,
      metadata: {
        title: meta.title,
        year: meta.year,
        imdbId: meta.imdbId,
        season: meta.season,
        episode: meta.episode,
        poster: meta.poster
      },
      count: streams.length,
      streams
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      durationMs: Date.now() - startTime
    });
  }
});

// Config URL generator
router.post('/config/generate', (req, res) => {
  const baseUrl = config.getBaseUrl(req);
  const userSettings = req.body || {};

  const encodedConfig = serializeUserConfig(userSettings);
  const manifestPath = `/${encodedConfig}/manifest.json`;
  const nuvioPath = `/${encodedConfig}/nuvio-plugin.json`;

  const webUrl = `${baseUrl}${manifestPath}`;
  const stremioUrl = webUrl.replace(/^https?:\/\//, 'stremio://');
  const nuvioUrl = `${baseUrl}${nuvioPath}`;
  const nuvioDownloadUrl = `${baseUrl}/api/nuvio/export?config=${encodedConfig}`;

  res.json({
    encodedConfig,
    manifestUrl: webUrl,
    stremioUrl,
    nuvioPluginUrl: nuvioUrl,
    nuvioDownloadUrl
  });
});

module.exports = router;
