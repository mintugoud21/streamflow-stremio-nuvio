const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const stremioRoutes = require('./routes/stremio');
const nuvioRoutes = require('./routes/nuvio');
const proxyRoutes = require('./routes/proxy');
const apiRoutes = require('./routes/api');

function createServer() {
  const app = express();

  // Trust reverse proxy / Cloudflare tunnel for HTTPS detection
  app.set('trust proxy', true);

  // Enable CORS for all routes (crucial for Stremio Web and Nuvio)
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With']
  }));

  // Parse JSON and URL encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static assets from public/
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // Mount API & Proxy routes
  app.use('/api', apiRoutes);
  app.use('/proxy', proxyRoutes);

  // Mount Nuvio routes
  app.use('/', nuvioRoutes);

  // Mount Stremio routes
  app.use('/', stremioRoutes);

  // Catch-all fallback for web app SPA
  app.use((req, res) => {
    // If request asks for JSON, don't serve HTML
    if (req.accepts('json') && !req.accepts('html')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

module.exports = { createServer };
