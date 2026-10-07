const assert = require('assert');
const { createServer } = require('../src/server');
const { resolveMetadata } = require('../src/metadata/cinemeta');
const { getStreams } = require('../src/scrapers');
const config = require('../src/config');
const http = require('http');

async function runTests() {
  console.log('🧪 Starting StreamFlow Verification Suite...\n');

  // Test 1: Cinemeta metadata resolution
  console.log('1. Testing Cinemeta metadata resolution...');
  const movieMeta = await resolveMetadata('movie', 'tt0111161');
  assert(movieMeta.title.includes('Shawshank'), 'Movie title should contain Shawshank');
  console.log(`   ✅ Movie resolved: "${movieMeta.title}" (${movieMeta.year})`);

  const seriesMeta = await resolveMetadata('series', 'tt0903747:1:1');
  assert(seriesMeta.title.includes('Breaking Bad'), 'Series title should contain Breaking Bad');
  assert.strictEqual(seriesMeta.season, 1, 'Season should be 1');
  assert.strictEqual(seriesMeta.episode, 1, 'Episode should be 1');
  console.log(`   ✅ Series resolved: "${seriesMeta.title}" S${seriesMeta.season}E${seriesMeta.episode} ("${seriesMeta.episodeTitle}")\n`);

  // Test 2: Scraper engine
  console.log('2. Testing Scraper engine with fallback redundancy...');
  const streams = await getStreams(movieMeta, {
    providers: ['apibay', 'torrentio', 'embeds'],
    qualities: ['4K', '1080p', '720p', '480p'],
    maxResults: 10
  });

  assert(Array.isArray(streams), 'Streams should be an array');
  assert(streams.length > 0, 'Streams should return results');
  console.log(`   ✅ Successfully retrieved ${streams.length} streams for "${movieMeta.title}"`);
  console.log(`   Sample stream:`, streams[0].name.replace('\n', ' '), '-', streams[0].title.split('\n')[0]);

  // Test 3: HTTP Server endpoints
  console.log('\n3. Testing Express Server endpoints (Stremio & Nuvio)...');
  const app = createServer();
  const testPort = 7099;
  const server = http.createServer(app);

  await new Promise(resolve => server.listen(testPort, resolve));
  const baseUrl = `http://localhost:${testPort}`;

  try {
    const axios = require('axios');

    // /manifest.json
    const manifestRes = await axios.get(`${baseUrl}/manifest.json`);
    assert.strictEqual(manifestRes.status, 200);
    assert.strictEqual(manifestRes.data.id, config.addonId);
    assert(manifestRes.data.resources.some(r => r.name === 'stream' || r === 'stream'));
    console.log('   ✅ /manifest.json conforms to Stremio Addon Protocol v3');

    // /nuvio-plugin.json
    const nuvioRes = await axios.get(`${baseUrl}/nuvio-plugin.json`);
    assert.strictEqual(nuvioRes.status, 200);
    assert.strictEqual(nuvioRes.data.category, 'stream_provider');
    console.log('   ✅ /nuvio-plugin.json conforms to Nuvio Plugin Schema');

    // /stream/movie/tt0111161.json
    const streamRes = await axios.get(`${baseUrl}/stream/movie/tt0111161.json`);
    assert.strictEqual(streamRes.status, 200);
    assert(Array.isArray(streamRes.data.streams));
    assert(streamRes.data.streams.length > 0);
    console.log(`   ✅ /stream/movie/tt0111161.json returned ${streamRes.data.streams.length} streams`);

    // /api/health
    const healthRes = await axios.get(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.data.status, 'online');
    console.log('   ✅ /api/health returned online status');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
