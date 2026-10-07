const axios = require('axios');
const { parseQuality, parseCodec, parseAudio } = require('../utils/parser');

const TORRENTIO_HOST = 'https://torrentio.strem.fun';

async function scrapeTorrentio(meta) {
  const results = [];
  try {
    const streamType = meta.type === 'series' ? 'series' : 'movie';
    const streamId = meta.rawId;

    const res = await axios.get(`${TORRENTIO_HOST}/stream/${streamType}/${streamId}.json`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamFlow/1.0'
      }
    });

    if (!Array.isArray(res.data?.streams)) {
      return results;
    }

    for (const stream of res.data.streams) {
      if (!stream.infoHash && !stream.url) continue;

      const title = stream.title || stream.name || '';
      
      // Extract seeders from text e.g. "👤 163" or "👥 163"
      let seeders = 0;
      const seedMatch = title.match(/[👤👥]\s*(\d+)/);
      if (seedMatch) {
        seeders = parseInt(seedMatch[1], 10);
      }

      // Extract size e.g. "💾 6.91 GB"
      let sizeFormatted = null;
      const sizeMatch = title.match(/💾\s*([0-9.]+\s*[KMGT]B)/i);
      if (sizeMatch) {
        sizeFormatted = sizeMatch[1];
      }

      // Parse provider / tracker name
      let provider = 'Torrentio Open';
      const provMatch = title.match(/⚙️\s*([^\n\r]+)/);
      if (provMatch) {
        provider = `Torrentio (${provMatch[1].trim()})`;
      }

      results.push({
        provider,
        name: stream.title?.split('\n')[0] || title,
        title: stream.title || title,
        infoHash: stream.infoHash,
        fileIdx: stream.fileIdx,
        url: stream.url,
        seeders,
        sizeFormatted,
        quality: parseQuality(stream.name + ' ' + title),
        codec: parseCodec(title),
        audio: parseAudio(title),
        type: stream.url ? 'direct' : 'torrent'
      });
    }
  } catch (err) {
    // console.error('Torrentio scrape error:', err.message);
  }

  return results;
}

module.exports = {
  name: 'torrentio',
  scrape: scrapeTorrentio
};
