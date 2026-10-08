/**
 * StreamFlow - Native Nuvio Provider
 * Runs inside Nuvio's Hermes JS runtime without needing an external server.
 */

const TMDB_API_KEY = '1865f43a0549ca50d341dd9ab8b29f49';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*'
};

/**
 * Resolves TMDB ID to IMDb ID and Title
 */
async function getMediaDetails(tmdbId, mediaType) {
  try {
    const isTv = mediaType === 'tv' || mediaType === 'series';
    const typePath = isTv ? 'tv' : 'movie';
    const url = `https://api.themoviedb.org/3/${typePath}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
    
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) return { imdbId: String(tmdbId), title: '' };
    
    const data = await res.json();
    const imdbId = data.external_ids?.imdb_id || String(tmdbId);
    const title = data.title || data.name || '';
    return { imdbId, title, year: data.release_date?.slice(0, 4) || data.first_air_date?.slice(0, 4) };
  } catch (err) {
    return { imdbId: String(tmdbId), title: '' };
  }
}

/**
 * Query Apibay (The Pirate Bay) for torrent streams
 */
async function getApibayStreams(imdbId, title, isTv, season, episode) {
  const streams = [];
  try {
    let query = imdbId;
    if (isTv) {
      const s = String(season || 1).padStart(2, '0');
      const e = String(episode || 1).padStart(2, '0');
      query = title ? `${title} S${s}E${e}` : `${imdbId} S${s}E${e}`;
    }

    const res = await fetch(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`, {
      headers: DEFAULT_HEADERS
    });
    if (!res.ok) return streams;

    const items = await res.json();
    if (!Array.isArray(items)) return streams;

    for (const item of items.slice(0, 8)) {
      if (!item.info_hash || item.id === '0') continue;
      const seeders = parseInt(item.seeders, 10) || 0;
      const sizeBytes = parseInt(item.size, 10) || 0;
      const sizeGB = (sizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      const name = item.name || 'Stream';

      let quality = '1080p';
      if (/4k|2160p/i.test(name)) quality = '4K';
      else if (/720p/i.test(name)) quality = '720p';
      else if (/480p/i.test(name)) quality = '480p';

      streams.push({
        name: `StreamFlow (TPB ${quality})`,
        title: `${name} | 👥 ${seeders} seeds | 💾 ${sizeGB}`,
        url: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(name)}`,
        quality,
        size: sizeGB,
        provider: 'streamflow'
      });
    }
  } catch (e) {
    // Ignore network failures gracefully
  }
  return streams;
}

/**
 * Main Nuvio Provider Entry Point
 * @param {string|number} tmdbId 
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} [season] 
 * @param {number} [episode] 
 * @returns {Promise<Array>} List of stream objects
 */
async function getStreams(tmdbId, mediaType, season, episode) {
  const streams = [];
  try {
    const isTv = mediaType === 'tv' || mediaType === 'series';
    const { imdbId, title } = await getMediaDetails(tmdbId, mediaType);

    // 1. Direct Web Embed Sources (Cloud Fast Streams)
    if (isTv) {
      const s = season || 1;
      const ep = episode || 1;

      // AutoEmbed TV
      streams.push({
        name: 'StreamFlow (AutoEmbed 1080p)',
        title: `${title || 'TV'} S${s}E${ep} - AutoEmbed Cloud Server`,
        url: `https://player.autoembed.co/embed/tv/${imdbId || tmdbId}/${s}/${ep}`,
        quality: '1080p',
        size: 'Cloud Stream',
        headers: { 'Referer': 'https://player.autoembed.co/' },
        provider: 'streamflow'
      });

      // VidLink TV
      streams.push({
        name: 'StreamFlow (VidLink HD)',
        title: `${title || 'TV'} S${s}E${ep} - VidLink Fast Player`,
        url: `https://vidlink.pro/tv/${imdbId || tmdbId}/${s}/${ep}`,
        quality: '1080p',
        size: 'Cloud Stream',
        headers: { 'Referer': 'https://vidlink.pro/' },
        provider: 'streamflow'
      });

      // 2Embed TV
      if (imdbId && imdbId.startsWith('tt')) {
        streams.push({
          name: 'StreamFlow (2Embed Multi)',
          title: `${title || 'TV'} S${s}E${ep} - 2Embed Multi-Server`,
          url: `https://2embed.cc/embedtv/${imdbId}&s=${s}&e=${ep}`,
          quality: '1080p',
          size: 'Cloud Stream',
          headers: { 'Referer': 'https://2embed.cc/' },
          provider: 'streamflow'
        });
      }

      // SmashyStream TV
      if (imdbId) {
        streams.push({
          name: 'StreamFlow (SmashyStream)',
          title: `${title || 'TV'} S${s}E${ep} - SmashyStream Server`,
          url: `https://embed.smashystream.com/playere.php?imdb=${imdbId}&season=${s}&episode=${ep}`,
          quality: '720p',
          size: 'Cloud Stream',
          headers: { 'Referer': 'https://embed.smashystream.com/' },
          provider: 'streamflow'
        });
      }
    } else {
      // AutoEmbed Movie
      streams.push({
        name: 'StreamFlow (AutoEmbed 1080p)',
        title: `${title || 'Movie'} - AutoEmbed Cloud Server`,
        url: `https://player.autoembed.co/embed/movie/${imdbId || tmdbId}`,
        quality: '1080p',
        size: 'Cloud Stream',
        headers: { 'Referer': 'https://player.autoembed.co/' },
        provider: 'streamflow'
      });

      // VidLink Movie
      streams.push({
        name: 'StreamFlow (VidLink HD)',
        title: `${title || 'Movie'} - VidLink Fast Player`,
        url: `https://vidlink.pro/movie/${imdbId || tmdbId}`,
        quality: '1080p',
        size: 'Cloud Stream',
        headers: { 'Referer': 'https://vidlink.pro/' },
        provider: 'streamflow'
      });

      // 2Embed Movie
      if (imdbId && imdbId.startsWith('tt')) {
        streams.push({
          name: 'StreamFlow (2Embed Multi)',
          title: `${title || 'Movie'} - 2Embed Multi-Server`,
          url: `https://2embed.cc/embed/${imdbId}`,
          quality: '1080p',
          size: 'Cloud Stream',
          headers: { 'Referer': 'https://2embed.cc/' },
          provider: 'streamflow'
        });
      }

      // SmashyStream Movie
      if (imdbId) {
        streams.push({
          name: 'StreamFlow (SmashyStream)',
          title: `${title || 'Movie'} - SmashyStream Server`,
          url: `https://embed.smashystream.com/playere.php?imdb=${imdbId}`,
          quality: '720p',
          size: 'Cloud Stream',
          headers: { 'Referer': 'https://embed.smashystream.com/' },
          provider: 'streamflow'
        });
      }
    }

    // 2. High-Seed P2P Torrent Streams (if IMDb ID available)
    if (imdbId && imdbId.startsWith('tt')) {
      const torrents = await getApibayStreams(imdbId, title, isTv, season, episode);
      streams.push(...torrents);
    }
  } catch (error) {
    console.error('StreamFlow provider error:', error);
  }

  return streams;
}

module.exports = {
  getStreams
};
