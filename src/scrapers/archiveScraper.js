const axios = require('axios');
const { parseQuality, formatBytes } = require('../utils/parser');

const ARCHIVE_URL = 'https://archive.org';

async function scrapeArchive(meta) {
  const results = [];
  // Only query archive.org if we have a title and it's a movie or special release
  if (!meta.title) return results;

  try {
    const query = encodeURIComponent(`title:("${meta.title}") AND mediatype:(movies)`);
    const searchUrl = `${ARCHIVE_URL}/advancedsearch.php?q=${query}&fl[]=identifier,title,downloads&sort[]=downloads+desc&rows=3&output=json`;

    const res = await axios.get(searchUrl, {
      timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0 StreamFlow/1.0' }
    });

    const docs = res.data?.response?.docs || [];
    for (const doc of docs) {
      if (!doc.identifier) continue;

      // Query files metadata for the identifier
      const metaRes = await axios.get(`${ARCHIVE_URL}/metadata/${doc.identifier}/files`, {
        timeout: 3000
      }).catch(() => null);

      if (!metaRes || !Array.isArray(metaRes.data?.result)) continue;

      // Find video files (mp4)
      const videoFiles = metaRes.data.result.filter(f => 
        f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.mkv')) &&
        (f.format?.includes('MPEG4') || f.format?.includes('h.264'))
      );

      for (const f of videoFiles.slice(0, 2)) {
        const fileUrl = `${ARCHIVE_URL}/download/${doc.identifier}/${encodeURIComponent(f.name)}`;
        const sizeBytes = parseInt(f.size, 10) || 0;

        results.push({
          provider: 'Internet Archive (Public)',
          name: `${meta.title} (Archive.org)`,
          title: `${doc.title || meta.title} [Archive.org]\n⚡ Direct MP4 HTTP Stream\n💾 ${formatBytes(sizeBytes) || 'Direct'}`,
          url: fileUrl,
          quality: parseQuality(f.name) || '720p',
          sizeFormatted: formatBytes(sizeBytes),
          type: 'direct'
        });
      }
    }
  } catch (err) {
    // Graceful error ignore
  }

  return results;
}

module.exports = {
  name: 'archive',
  scrape: scrapeArchive
};
