const { LRUCache } = require('lru-cache');
const config = require('../config');

const streamCache = new LRUCache({
  max: config.cache.maxItems,
  ttl: config.cache.streamTTL
});

const metaCache = new LRUCache({
  max: config.cache.maxItems,
  ttl: config.cache.metadataTTL
});

module.exports = {
  streamCache,
  metaCache
};
