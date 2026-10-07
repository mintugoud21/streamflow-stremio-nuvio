const apibay = require('./apibay');
const torrentio = require('./torrentio');
const embeds = require('./embedScraper');
const archive = require('./archiveScraper');
const { streamCache } = require('../utils/cache');
const { formatStreamItem } = require('../utils/formatter');
const config = require('../config');

const ALL_SCRAPERS = {
  apibay,
  torrentio,
  embeds,
  archive
};

const QUALITY_PRIORITY = {
  '4K': 4,
  '1080p': 3,
  '720p': 2,
  '480p': 1,
  'CAM': 0,
  'Unknown': 1,
  'Auto': 2
};

async function getStreams(meta, userConfig = {}, baseUrl = '') {
  const cfg = userConfig || {};
  const enabledProviders = cfg.providers || config.defaultProviders;
  const qualities = cfg.qualities || ['4K', '1080p', '720p', '480p'];
  const maxResults = cfg.maxResults || 25;
  const includeTorrents = cfg.includeTorrents !== false;
  const includeDirect = cfg.includeDirectStreams !== false;

  const cacheKey = `streams:${meta.type}:${meta.rawId}:${enabledProviders.sort().join(',')}:${includeTorrents}:${includeDirect}`;
  const cached = streamCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Determine active scrapers
  const activeScrapers = [];
  if (includeTorrents) {
    if (enabledProviders.includes('apibay')) activeScrapers.push(apibay);
    if (enabledProviders.includes('torrentio')) activeScrapers.push(torrentio);
  }
  if (includeDirect) {
    if (enabledProviders.includes('embeds')) activeScrapers.push(embeds);
    if (enabledProviders.includes('archive')) activeScrapers.push(archive);
  }

  // Run all active scrapers in parallel with timeout
  const timeoutPromise = new Promise(resolve => 
    setTimeout(() => resolve([]), config.scraperTimeoutMs)
  );

  const scrapePromises = activeScrapers.map(async scraper => {
    try {
      const results = await Promise.race([
        scraper.scrape(meta, baseUrl),
        timeoutPromise
      ]);
      return Array.isArray(results) ? results : [];
    } catch (e) {
      return [];
    }
  });

  const settled = await Promise.allSettled(scrapePromises);
  let allRawStreams = [];

  settled.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allRawStreams.push(...res.value);
    }
  });

  // Deduplicate by infoHash or URL
  const seenHashes = new Set();
  const seenUrls = new Set();
  const deduped = [];

  for (const stream of allRawStreams) {
    if (stream.infoHash) {
      const h = stream.infoHash.toLowerCase();
      if (seenHashes.has(h)) continue;
      seenHashes.add(h);
      deduped.push(stream);
    } else if (stream.url) {
      if (seenUrls.has(stream.url)) continue;
      seenUrls.add(stream.url);
      deduped.push(stream);
    }
  }

  // Quality filtering
  const filtered = deduped.filter(s => {
    if (!s.quality) return true;
    if (s.quality === 'Auto') return true;
    return qualities.includes(s.quality);
  });

  // Intelligent Sorting:
  // 1. Direct fast web streams & high-seed torrents
  // 2. Highest quality first
  // 3. Highest seeds for torrents
  filtered.sort((a, b) => {
    // If one is direct and one is torrent, direct streams placed conveniently
    const qA = QUALITY_PRIORITY[a.quality] || 1;
    const qB = QUALITY_PRIORITY[b.quality] || 1;

    if (qA !== qB) {
      return qB - qA; // Higher resolution first
    }

    const seedsA = a.seeders || 0;
    const seedsB = b.seeders || 0;
    return seedsB - seedsA;
  });

  const sliced = filtered.slice(0, maxResults);
  const formatted = sliced.map(s => formatStreamItem(s, config.addonName)).filter(Boolean);

  streamCache.set(cacheKey, formatted);
  return formatted;
}

module.exports = {
  getStreams,
  ALL_SCRAPERS
};
