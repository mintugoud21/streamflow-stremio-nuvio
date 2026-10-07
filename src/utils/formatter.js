/**
 * Formats scraped items into Stremio & Nuvio compliant stream objects.
 */

function formatStreamItem(item, addonName = 'StreamFlow') {
  if (!item) return null;

  const quality = item.quality || 'Auto';
  const provider = item.provider || 'Web';

  // Format header name (appears on the left badge in Stremio)
  const streamName = `[${addonName}]\n${quality}`;

  // Direct HTTP/HLS URL Stream
  if (item.url) {
    const details = [
      item.title || item.name || 'Direct Stream',
      `🌐 Source: ${provider}${item.codec ? ' | ' + item.codec : ''}`,
      item.size ? `💾 ${item.size}` : null
    ].filter(Boolean).join('\n');

    return {
      name: streamName,
      title: details,
      url: item.url,
      behaviorHints: {
        notWebReady: false,
        bingeGroup: `${addonName.toLowerCase()}-${quality.toLowerCase()}`,
        ...(item.headers ? { proxyHeaders: { request: item.headers } } : {})
      }
    };
  }

  // P2P / Torrent infoHash Stream
  if (item.infoHash) {
    const details = [
      item.title || item.name || 'Torrent Stream',
      `👥 ${item.seeders ?? 0} seeds 💾 ${item.sizeFormatted || item.size || 'N/A'} ⚡ ${provider}`,
      item.codec || item.audio ? `🎧 ${[item.codec, item.audio].filter(Boolean).join(' | ')}` : null
    ].filter(Boolean).join('\n');

    const stream = {
      name: streamName,
      title: details,
      infoHash: item.infoHash.toLowerCase()
    };

    if (typeof item.fileIdx === 'number') {
      stream.fileIdx = item.fileIdx;
    }

    stream.behaviorHints = {
      bingeGroup: `${addonName.toLowerCase()}-${item.infoHash.slice(0, 8)}`
    };

    return stream;
  }

  return null;
}

module.exports = {
  formatStreamItem
};
