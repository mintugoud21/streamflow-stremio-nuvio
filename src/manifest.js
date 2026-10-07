const config = require('./config');

function getStremioManifest(baseUrl, userConfig = null) {
  let name = config.addonName;
  if (userConfig && userConfig.qualities && userConfig.qualities.length < 4) {
    name += ` (${userConfig.qualities.join('/')})`;
  }

  return {
    id: config.addonId,
    version: config.addonVersion,
    name,
    description: config.addonDescription,
    logo: `${baseUrl}/assets/icon.png`,
    background: `${baseUrl}/assets/background.jpg`,
    resources: [
      {
        name: 'stream',
        types: ['movie', 'series', 'anime'],
        idPrefixes: ['tt', 'kitsu']
      }
    ],
    types: ['movie', 'series', 'anime'],
    catalogs: [],
    idPrefixes: ['tt', 'kitsu'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    }
  };
}

function getNuvioPluginManifest(baseUrl, userConfig = null) {
  const stremioManifest = getStremioManifest(baseUrl, userConfig);

  return {
    schemaVersion: 1,
    id: 'nuvio.plugin.streamflow',
    name: 'StreamFlow Multi-Scraper',
    version: config.addonVersion,
    author: 'StreamFlow Community',
    description: config.addonDescription,
    icon: `${baseUrl}/assets/icon.png`,
    banner: `${baseUrl}/assets/background.jpg`,
    category: 'stream_provider',
    type: 'scraper',
    protocols: ['stremio-v3', 'nuvio-v1'],
    stremioManifestUrl: `${baseUrl}/manifest.json`,
    capabilities: {
      movies: true,
      series: true,
      anime: true,
      directHttp: true,
      hls: true,
      torrentEngine: true
    },
    endpoints: {
      manifest: `${baseUrl}/manifest.json`,
      stream: `${baseUrl}/stream/{type}/{id}.json`,
      nuvioPlugin: `${baseUrl}/nuvio-plugin.json`,
      configure: `${baseUrl}/`
    },
    stremioManifest
  };
}

module.exports = {
  getStremioManifest,
  getNuvioPluginManifest
};
