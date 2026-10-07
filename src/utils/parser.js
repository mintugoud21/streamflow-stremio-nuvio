/**
 * Utility parser for torrent and stream video titles, quality, and configurations.
 */

function parseQuality(title = '') {
  const t = title.toUpperCase();
  if (/\b(4K|2160P|UHD)\b/i.test(t)) return '4K';
  if (/\b(1080P|FHD)\b/i.test(t)) return '1080p';
  if (/\b(720P|HD)\b/i.test(t)) return '720p';
  if (/\b(480P|SD)\b/i.test(t)) return '480p';
  if (/\b(CAM|HDCAM|CAMRIP|TS|TELESYNC)\b/i.test(t)) return 'CAM';
  return 'Unknown';
}

function parseCodec(title = '') {
  if (/\b(HEVC|H\.?265|x265)\b/i.test(title)) return 'HEVC/x265';
  if (/\b(AVC|H\.?264|x264)\b/i.test(title)) return 'x264';
  if (/\b(AV1)\b/i.test(title)) return 'AV1';
  return null;
}

function parseAudio(title = '') {
  const audio = [];
  if (/\b(ATMOS)\b/i.test(title)) audio.push('Atmos');
  if (/\b(5\.1|DD5\.1|AC3)\b/i.test(title)) audio.push('5.1');
  if (/\b(7\.1)\b/i.test(title)) audio.push('7.1');
  if (/\b(DUAL\s*AUDIO|MULTI)\b/i.test(title)) audio.push('Multi-Audio');
  return audio.length > 0 ? audio.join(' | ') : null;
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return null;
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = num;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

/**
 * Parses user config string from route path (can be JSON, base64 or key=value query format)
 */
function parseUserConfig(configParam) {
  const defaults = {
    providers: ['apibay', 'torrentio', 'embeds', 'archive'],
    qualities: ['4K', '1080p', '720p', '480p'],
    maxResults: 15,
    includeTorrents: true,
    includeDirectStreams: true
  };

  if (!configParam) return defaults;

  try {
    let raw = configParam;
    // Check if it's base64 encoded
    if (!configParam.includes('=') && !configParam.includes('{') && /^[A-Za-z0-9+/=]+$/.test(configParam)) {
      try {
        raw = Buffer.from(configParam, 'base64').toString('utf8');
      } catch (e) {
        // Not valid base64, use raw
      }
    }

    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }

    // Parse URL parameter style: providers=apibay,torrentio|maxResults=10
    const parts = raw.split('|');
    const result = { ...defaults };

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        if (key === 'providers') {
          result.providers = value.split(',').map(s => s.trim().toLowerCase());
        } else if (key === 'qualities') {
          result.qualities = value.split(',').map(s => s.trim());
        } else if (key === 'maxResults') {
          result.maxResults = parseInt(value, 10) || 15;
        } else if (key === 'includeTorrents') {
          result.includeTorrents = value === 'true' || value === '1';
        } else if (key === 'includeDirectStreams') {
          result.includeDirectStreams = value === 'true' || value === '1';
        }
      }
    });

    return result;
  } catch (err) {
    return defaults;
  }
}

/**
 * Serializes user config into a URL safe string
 */
function serializeUserConfig(config) {
  const providers = (config.providers || []).join(',');
  const qualities = (config.qualities || []).join(',');
  const max = config.maxResults || 15;
  const torrents = config.includeTorrents !== false;
  const direct = config.includeDirectStreams !== false;

  const raw = `providers=${providers}|qualities=${qualities}|maxResults=${max}|includeTorrents=${torrents}|includeDirectStreams=${direct}`;
  return Buffer.from(raw).toString('base64url');
}

module.exports = {
  parseQuality,
  parseCodec,
  parseAudio,
  formatBytes,
  parseUserConfig,
  serializeUserConfig
};
