const { createServer } = require('./server');
const config = require('./config');

const app = createServer();

app.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ${config.addonName} v${config.addonVersion}`);
  console.log(`📡 Server running at http://${config.host}:${config.port}`);
  console.log(`🌐 Web UI / Dashboard: http://localhost:${config.port}/`);
  console.log(`🎬 Stremio Manifest:   http://localhost:${config.port}/manifest.json`);
  console.log(`🧩 Nuvio Plugin JSON:  http://localhost:${config.port}/nuvio-plugin.json`);
  console.log(`=======================================================`);
});
