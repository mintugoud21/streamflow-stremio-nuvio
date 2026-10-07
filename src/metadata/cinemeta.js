const axios = require('axios');
const { metaCache } = require('../utils/cache');

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

/**
 * Parses Stremio/Nuvio media identifier.
 * Examples:
 * - tt0111161 (movie)
 * - tt0903747:1:1 (series season 1 episode 1)
 */
function parseMediaId(type, id) {
  const parts = id.split(':');
  const imdbId = parts[0];
  const season = parts[1] ? parseInt(parts[1], 10) : null;
  const episode = parts[2] ? parseInt(parts[2], 10) : null;

  return {
    rawId: id,
    type,
    imdbId,
    season,
    episode,
    isSeries: Boolean(season !== null && episode !== null)
  };
}

/**
 * Resolves media metadata using Cinemeta API with in-memory LRU caching.
 */
async function resolveMetadata(type, id) {
  const parsed = parseMediaId(type, id);
  const cacheKey = `meta:${type}:${parsed.imdbId}`;

  const cached = metaCache.get(cacheKey);
  if (cached) {
    return {
      ...parsed,
      ...cached,
      // Keep requested season & episode
      season: parsed.season,
      episode: parsed.episode
    };
  }

  try {
    const metaType = type === 'series' ? 'series' : 'movie';
    const res = await axios.get(`${CINEMETA_URL}/meta/${metaType}/${parsed.imdbId}.json`, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamFlow/1.0'
      }
    });

    const meta = res.data?.meta;
    if (!meta) {
      return parsed;
    }

    let episodeTitle = null;
    if (parsed.isSeries && Array.isArray(meta.videos)) {
      const epVideo = meta.videos.find(v => v.season === parsed.season && v.number === parsed.episode);
      if (epVideo) {
        episodeTitle = epVideo.title || null;
      }
    }

    const metadata = {
      title: meta.name,
      year: meta.year ? parseInt(meta.year, 10) : null,
      description: meta.description,
      poster: meta.poster,
      background: meta.background,
      genres: meta.genres || [],
      imdbRating: meta.imdbRating || null,
      episodeTitle
    };

    metaCache.set(cacheKey, metadata);

    return {
      ...parsed,
      ...metadata,
      season: parsed.season,
      episode: parsed.episode
    };
  } catch (error) {
    // Return parsed identifiers even if Cinemeta lookup fails
    return parsed;
  }
}

module.exports = {
  parseMediaId,
  resolveMetadata
};
