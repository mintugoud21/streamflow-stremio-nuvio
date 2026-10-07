const path = require('path');
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '7000', 10),
  host: process.env.HOST || '0.0.0.0',
  addonId: 'community.nuvio.streamflow',
  addonName: 'StreamFlow Multi-Scraper',
  addonVersion: '1.0.0',
  addonDescription: 'High-speed internet scraping video streams for Movies & Series. Fully compatible with Stremio and Nuvio.',
  
  // Scraper defaults
  defaultProviders: ['apibay', 'torrentio', 'embeds', 'archive'],
  scraperTimeoutMs: parseInt(process.env.SCRAPER_TIMEOUT_MS || '6500', 10),
  
  // Cache TTLs in milliseconds
  cache: {
    streamTTL: 1000 * 60 * 30, // 30 minutes
    metadataTTL: 1000 * 60 * 60 * 24, // 24 hours
    maxItems: 1000
  },

  // Base URL resolution helper
  getBaseUrl(req) {
    if (process.env.PUBLIC_URL) {
      return process.env.PUBLIC_URL.replace(/\/$/, '');
    }
    if (req) {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${this.port}`;
      return `${proto}://${host}`;
    }
    return `http://localhost:${this.port}`;
  }
};

module.exports = config;
