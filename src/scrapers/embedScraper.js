/**
 * Web Embed Scraper
 * Sources direct web stream embeds for movies and TV series
 */

async function scrapeEmbeds(meta, baseUrl = '') {
  const results = [];
  const { imdbId, season, episode, isSeries, title } = meta;

  if (!imdbId) return results;

  const streamTitle = isSeries 
    ? `${title || 'Series'} S${season}E${episode}` 
    : `${title || 'Movie'}`;

  // 1. AutoEmbed Stream
  const autoembedUrl = isSeries
    ? `https://player.autoembed.co/embed/tv/${imdbId}/${season}/${episode}`
    : `https://player.autoembed.co/embed/movie/${imdbId}`;

  results.push({
    provider: 'AutoEmbed Web',
    name: `${streamTitle} (AutoEmbed Direct)`,
    title: `${streamTitle}\n⚡ Server: AutoEmbed Cloud Stream\n🌐 Quality: 1080p Web Stream`,
    url: autoembedUrl,
    quality: '1080p',
    type: 'direct'
  });

  // 2. 2Embed Stream
  const twoEmbedUrl = isSeries
    ? `https://2embed.cc/embedtv/${imdbId}&s=${season}&e=${episode}`
    : `https://2embed.cc/embed/${imdbId}`;

  results.push({
    provider: '2Embed Web',
    name: `${streamTitle} (2Embed Fast)`,
    title: `${streamTitle}\n⚡ Server: 2Embed Multi-Server\n🌐 Quality: 1080p / 720p Multi-Audio`,
    url: twoEmbedUrl,
    quality: '1080p',
    type: 'direct'
  });

  // 3. VidLink Stream
  const vidlinkUrl = isSeries
    ? `https://vidlink.pro/tv/${imdbId}/${season}/${episode}`
    : `https://vidlink.pro/movie/${imdbId}`;

  results.push({
    provider: 'VidLink Web',
    name: `${streamTitle} (VidLink HD)`,
    title: `${streamTitle}\n⚡ Server: VidLink Ultra Stream\n🌐 Quality: Auto / 1080p Adaptive`,
    url: vidlinkUrl,
    quality: '1080p',
    type: 'direct'
  });

  // 4. SmashyStream
  const smashyUrl = isSeries
    ? `https://embed.smashystream.com/playere.php?imdb=${imdbId}&season=${season}&episode=${episode}`
    : `https://embed.smashystream.com/playere.php?imdb=${imdbId}`;

  results.push({
    provider: 'SmashyStream',
    name: `${streamTitle} (SmashyStream)`,
    title: `${streamTitle}\n⚡ Server: SmashyStream Mirrors\n🌐 Quality: 720p / 1080p Fast`,
    url: smashyUrl,
    quality: '720p',
    type: 'direct'
  });

  return results;
}

module.exports = {
  name: 'embeds',
  scrape: scrapeEmbeds
};
