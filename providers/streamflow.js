/**
 * StreamFlow Nuvio Provider
 * Universal Scraper for Nuvio (Movies & TV)
 */

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/nuvio-provider/index.js
var TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
var DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "*/*"
};
function getMediaDetails(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var _a, _b, _c;
    try {
      const isTv = mediaType === "tv" || mediaType === "series";
      const typePath = isTv ? "tv" : "movie";
      const url = `https://api.themoviedb.org/3/${typePath}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
      const res = yield fetch(url, { headers: DEFAULT_HEADERS });
      if (!res.ok) return { imdbId: String(tmdbId), title: "" };
      const data = yield res.json();
      const imdbId = ((_a = data.external_ids) == null ? void 0 : _a.imdb_id) || String(tmdbId);
      const title = data.title || data.name || "";
      return { imdbId, title, year: ((_b = data.release_date) == null ? void 0 : _b.slice(0, 4)) || ((_c = data.first_air_date) == null ? void 0 : _c.slice(0, 4)) };
    } catch (err) {
      return { imdbId: String(tmdbId), title: "" };
    }
  });
}
function getApibayStreams(imdbId, title, isTv, season, episode) {
  return __async(this, null, function* () {
    const streams = [];
    try {
      let query = imdbId;
      if (isTv) {
        const s = String(season || 1).padStart(2, "0");
        const e = String(episode || 1).padStart(2, "0");
        query = title ? `${title} S${s}E${e}` : `${imdbId} S${s}E${e}`;
      }
      const res = yield fetch(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`, {
        headers: DEFAULT_HEADERS
      });
      if (!res.ok) return streams;
      const items = yield res.json();
      if (!Array.isArray(items)) return streams;
      for (const item of items.slice(0, 8)) {
        if (!item.info_hash || item.id === "0") continue;
        const seeders = parseInt(item.seeders, 10) || 0;
        const sizeBytes = parseInt(item.size, 10) || 0;
        const sizeGB = (sizeBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        const name = item.name || "Stream";
        let quality = "1080p";
        if (/4k|2160p/i.test(name)) quality = "4K";
        else if (/720p/i.test(name)) quality = "720p";
        else if (/480p/i.test(name)) quality = "480p";
        streams.push({
          name: `StreamFlow (TPB ${quality})`,
          title: `${name} | \u{1F465} ${seeders} seeds | \u{1F4BE} ${sizeGB}`,
          url: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(name)}`,
          quality,
          size: sizeGB,
          provider: "streamflow"
        });
      }
    } catch (e) {
    }
    return streams;
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const streams = [];
    try {
      const isTv = mediaType === "tv" || mediaType === "series";
      const { imdbId, title } = yield getMediaDetails(tmdbId, mediaType);
      if (isTv) {
        const s = season || 1;
        const ep = episode || 1;
        streams.push({
          name: "StreamFlow (AutoEmbed 1080p)",
          title: `${title || "TV"} S${s}E${ep} - AutoEmbed Cloud Server`,
          url: `https://player.autoembed.co/embed/tv/${imdbId || tmdbId}/${s}/${ep}`,
          quality: "1080p",
          size: "Cloud Stream",
          headers: { "Referer": "https://player.autoembed.co/" },
          provider: "streamflow"
        });
        streams.push({
          name: "StreamFlow (VidLink HD)",
          title: `${title || "TV"} S${s}E${ep} - VidLink Fast Player`,
          url: `https://vidlink.pro/tv/${imdbId || tmdbId}/${s}/${ep}`,
          quality: "1080p",
          size: "Cloud Stream",
          headers: { "Referer": "https://vidlink.pro/" },
          provider: "streamflow"
        });
        if (imdbId && imdbId.startsWith("tt")) {
          streams.push({
            name: "StreamFlow (2Embed Multi)",
            title: `${title || "TV"} S${s}E${ep} - 2Embed Multi-Server`,
            url: `https://2embed.cc/embedtv/${imdbId}&s=${s}&e=${ep}`,
            quality: "1080p",
            size: "Cloud Stream",
            headers: { "Referer": "https://2embed.cc/" },
            provider: "streamflow"
          });
        }
        if (imdbId) {
          streams.push({
            name: "StreamFlow (SmashyStream)",
            title: `${title || "TV"} S${s}E${ep} - SmashyStream Server`,
            url: `https://embed.smashystream.com/playere.php?imdb=${imdbId}&season=${s}&episode=${ep}`,
            quality: "720p",
            size: "Cloud Stream",
            headers: { "Referer": "https://embed.smashystream.com/" },
            provider: "streamflow"
          });
        }
      } else {
        streams.push({
          name: "StreamFlow (AutoEmbed 1080p)",
          title: `${title || "Movie"} - AutoEmbed Cloud Server`,
          url: `https://player.autoembed.co/embed/movie/${imdbId || tmdbId}`,
          quality: "1080p",
          size: "Cloud Stream",
          headers: { "Referer": "https://player.autoembed.co/" },
          provider: "streamflow"
        });
        streams.push({
          name: "StreamFlow (VidLink HD)",
          title: `${title || "Movie"} - VidLink Fast Player`,
          url: `https://vidlink.pro/movie/${imdbId || tmdbId}`,
          quality: "1080p",
          size: "Cloud Stream",
          headers: { "Referer": "https://vidlink.pro/" },
          provider: "streamflow"
        });
        if (imdbId && imdbId.startsWith("tt")) {
          streams.push({
            name: "StreamFlow (2Embed Multi)",
            title: `${title || "Movie"} - 2Embed Multi-Server`,
            url: `https://2embed.cc/embed/${imdbId}`,
            quality: "1080p",
            size: "Cloud Stream",
            headers: { "Referer": "https://2embed.cc/" },
            provider: "streamflow"
          });
        }
        if (imdbId) {
          streams.push({
            name: "StreamFlow (SmashyStream)",
            title: `${title || "Movie"} - SmashyStream Server`,
            url: `https://embed.smashystream.com/playere.php?imdb=${imdbId}`,
            quality: "720p",
            size: "Cloud Stream",
            headers: { "Referer": "https://embed.smashystream.com/" },
            provider: "streamflow"
          });
        }
      }
      if (imdbId && imdbId.startsWith("tt")) {
        const torrents = yield getApibayStreams(imdbId, title, isTv, season, episode);
        streams.push(...torrents);
      }
    } catch (error) {
      console.error("StreamFlow provider error:", error);
    }
    return streams;
  });
}
module.exports = {
  getStreams
};
