const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const outDir = path.join(__dirname, 'providers');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'streamflow.js');

  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'nuvio-provider', 'index.js')],
    bundle: true,
    outfile: outFile,
    platform: 'neutral',
    target: ['es2016'],
    format: 'cjs',
    minify: false,
    banner: {
      js: '/**\n * StreamFlow Nuvio Provider\n * Universal Scraper for Nuvio (Movies & TV)\n */\n'
    }
  });

  console.log(`✅ Built bundled Nuvio provider at: ${outFile}`);

  // Create nuvio-manifest.json for repository import
  const manifest = {
    name: 'StreamFlow Repository',
    version: '1.0.0',
    description: 'Multi-source online stream scrapers for Nuvio',
    author: 'StreamFlow',
    scrapers: [
      {
        id: 'streamflow',
        name: 'StreamFlow',
        description: 'Multi-source scraper with AutoEmbed, VidLink, 2Embed, SmashyStream and Torrents',
        version: '1.0.0',
        author: 'StreamFlow Team',
        supportedTypes: ['movie', 'tv'],
        filename: 'providers/streamflow.js',
        enabled: true,
        formats: ['m3u8', 'mp4', 'mkv'],
        logo: 'https://raw.githubusercontent.com/tapframe/nuvio-providers/main/assets/icon.png',
        contentLanguage: ['en']
      }
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, 'nuvio-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`✅ Created nuvio-manifest.json`);
}

build().catch(err => {
  console.error('Build error:', err);
  process.exit(1);
});
