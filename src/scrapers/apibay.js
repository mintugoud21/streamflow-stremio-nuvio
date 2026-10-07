const axios = require('axios');
const { parseQuality, parseCodec, parseAudio, formatBytes } = require('../utils/parser');

const APIBAY_HOST = 'https://apibay.org';

async function scrapeApibay(meta) {
  const results = [];
  try {
    let query = '';
    if (meta.isSeries) {
      const s = String(meta.season).padStart(2, '0');
      const e = String(meta.episode).padStart(2, '0');
      // Search with Title S01E01
      query = `${meta.title || meta.imdbId} S${s}E${e}`;
    } else {
      query = meta.imdbId;
    }

    const res = await axios.get(`${APIBAY_HOST}/q.php`, {
      params: { q: query },
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!Array.isArray(res.data)) {
      return results;
    }

    for (const item of res.data) {
      // apibay returns [{ id: "0", name: "No results found" }] when nothing is found
      if (item.id === '0' || !item.info_hash || item.info_hash === '0000000000000000000000000000000000000000') {
        continue;
      }

      const seeders = parseInt(item.seeders, 10) || 0;
      const sizeBytes = parseInt(item.size, 10) || 0;
      const title = item.name || '';

      // If series, ensure the torrent title matches the requested season & episode
      if (meta.isSeries) {
        const s = String(meta.season).padStart(2, '0');
        const e = String(meta.episode).padStart(2, '0');
        const pattern = new RegExp(`[sS]${s}[eE]${e}|${meta.season}x${meta.episode}`, 'i');
        if (!pattern.test(title)) {
          // Check if it's a full season pack
          const seasonPackPattern = new RegExp(`[sS]${s}(?!\\s*[eE])|Season\\s*${meta.season}`, 'i');
          if (!seasonPackPattern.test(title)) {
            continue;
          }
        }
      }

      results.push({
        provider: 'TPB / Apibay',
        name: title,
        title: title,
        infoHash: item.info_hash,
        seeders,
        size: sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        quality: parseQuality(title),
        codec: parseCodec(title),
        audio: parseAudio(title),
        type: 'torrent'
      });
    }
  } catch (err) {
    // Graceful error logging
    // console.error('Apibay scrape error:', err.message);
  }

  return results;
}

module.exports = {
  name: 'apibay',
  scrape: scrapeApibay
};
