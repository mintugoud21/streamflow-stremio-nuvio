# StreamFlow — Multi-Scraper Addon & Plugin for Stremio & Nuvio

StreamFlow is an internet scraper addon and plugin built for **Stremio** and **Nuvio**. It fetches high-quality video streams for movies and TV series using internet scraping with zero subscription or API key requirements.

---

## 🌟 Key Features

- 🎬 **Dual Client Compatibility**:
  - Full support for **Stremio Addon Protocol v3** (`/manifest.json`, `/stream/:type/:id.json`).
  - Native support for **Nuvio Plugin Schema** (`/nuvio-plugin.json` and downloadable `.json` file).
- 🌐 **Multi-Source Internet Scraping**:
  - **TPB / Apibay**: High-speed P2P tracker querying with seeders, leechers, and size indicators.
  - **Torrentio Open**: Multi-indexer torrent fallback.
  - **Web Embed Scrapers**: Direct cloud streams (AutoEmbed, 2Embed, VidLink, SmashyStream).
  - **Internet Archive**: Public domain direct HTTP video streams.
- ⚡ **High Performance & Low Latency**:
  - Asynchronous parallel scraper execution with strict timeouts.
  - In-memory **LRU cache** for instant responses on frequent requests.
  - Cinemeta metadata resolution for IMDb movie & TV series titles.
- 🎛️ **Full-Featured Web Dashboard & Configurator**:
  - Modern, dark-mode glassmorphism web interface at `http://localhost:7000/`.
  - Live configuration generator (filter resolutions: 4K, 1080p, 720p; toggle providers).
  - Real-time Stream Sandbox & In-Browser Player preview.
  - One-click Stremio installation (`stremio://`) and Nuvio `.json` plugin exporter.

---

## 📁 Project Architecture

```
├── public/
│   ├── index.html            # Web dashboard, configurator & documentation
│   ├── css/styles.css        # Responsive dark glassmorphism styling
│   ├── js/app.js             # Config generator, stream tester & player logic
│   └── assets/               # Logos and icons
├── src/
│   ├── index.js              # Server entry point
│   ├── server.js             # Express app setup and middleware
│   ├── config.js             # Configuration, timeouts & caching rules
│   ├── manifest.js           # Stremio & Nuvio manifest definitions
│   ├── metadata/
│   │   └── cinemeta.js       # Resolves IMDb ID into movie/series metadata
│   ├── scrapers/
│   │   ├── index.js          # Coordinator running scrapers in parallel
│   │   ├── apibay.js         # The Pirate Bay scraper
│   │   ├── torrentio.js      # Torrentio open scraper adapter
│   │   ├── embedScraper.js   # Cloud embed scraper (AutoEmbed, 2Embed, VidLink)
│   │   └── archiveScraper.js # Public domain video scraper
│   ├── utils/
│   │   ├── parser.js         # Video quality, codec, audio & config parser
│   │   ├── formatter.js      # Stremio & Nuvio stream object formatter
│   │   └── cache.js          # High-performance LRU cache
│   └── routes/
│       ├── stremio.js        # Stremio addon routes (/manifest.json, /stream/...)
│       ├── nuvio.js          # Nuvio routes (/nuvio-plugin.json, /api/nuvio/export)
│       ├── proxy.js          # Stream proxy for web player CORS bypass
│       └── api.js            # Health check, config generator, live tester
├── Dockerfile                # Production Docker container
├── docker-compose.yml        # Multi-container orchestration
└── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v20 / v24)
- **npm**: v9 or higher

### 2. Installation
```bash
git clone <repo-url>
cd addon-and-plugins-for-stremio-nuvio
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```
The server will start on `http://localhost:7000`.

### 5. Run Verification Tests
```bash
npm test
```

---

## 🐳 Docker Deployment

To run with Docker:
```bash
docker build -t streamflow .
docker run -d -p 7000:7000 --name streamflow streamflow
```
Or using Docker Compose:
```bash
docker compose up -d
```

---

## 📱 How to Use & Install

### Option A: Install in Stremio
1. Open the web interface at `http://localhost:7000` (or your public domain).
2. Click **"⚡ Install to Stremio"** to launch Stremio directly.
3. Or copy the manifest URL (`http://<host>:7000/manifest.json`) and paste it into Stremio's Addon search bar.

### Option B: Install in Nuvio
1. **Via URL**:
   - Copy the Nuvio plugin URL (`http://<host>:7000/nuvio-plugin.json`) and add it under Nuvio Settings > Plugins > Add URL.
2. **Via `.json` File**:
   - In the web interface, click **"⬇️ Download .JSON Plugin"**.
   - In Nuvio, select **Import Plugin from File** and upload the downloaded file.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web dashboard & interactive configurator |
| `GET` | `/manifest.json` | Stremio Addon Protocol v3 Manifest |
| `GET` | `/:config/manifest.json` | Personalized Stremio Manifest with custom settings |
| `GET` | `/stream/:type/:id.json` | Movie or Series streams (`tt...` or `tt...:season:ep`) |
| `GET` | `/:config/stream/:type/:id.json` | Filtered streams matching user configuration |
| `GET` | `/nuvio-plugin.json` | Nuvio Plugin Schema specification |
| `GET` | `/api/nuvio/export` | Downloadable `nuvio-streamflow-plugin.json` |
| `GET` | `/api/health` | Addon health, uptime, and scraper statistics |
| `GET` | `/api/test-stream` | Sandbox endpoint for instant stream lookup |
| `GET` | `/proxy/stream` | Stream proxy with header/CORS forwarding |

---

## 🛠️ Extending with Future Scrapers

To add a new scraper:
1. Create a new file in [src/scrapers/](file:///workspace/addon-and-plugins-for-stremio-nuvio/src/scrapers/) (e.g., `src/scrapers/myScraper.js`).
2. Export an object matching the scraper contract:
   ```javascript
   module.exports = {
     name: 'myscraper',
     async scrape(meta, baseUrl) {
       // meta: { title, year, imdbId, season, episode, isSeries }
       return [
         {
           provider: 'MyScraper',
           name: 'Movie Title',
           url: 'https://...', // or infoHash for torrents
           quality: '1080p',
           type: 'direct' // or 'torrent'
         }
       ];
     }
   };
   ```
3. Register the new scraper in [src/scrapers/index.js](file:///workspace/addon-and-plugins-for-stremio-nuvio/src/scrapers/index.js).

---

## 📜 License
MIT License. Created for educational and personal media streaming integration.
