document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const serverStatusBadge = document.getElementById('serverStatusBadge');
  const uptimeBadge = document.getElementById('uptimeBadge');
  const cacheBadge = document.getElementById('cacheBadge');
  
  // Install URLs
  const stremioInstallBtn = document.getElementById('stremioInstallBtn');
  const stremioUrlInput = document.getElementById('stremioUrlInput');
  const copyStremioBtn = document.getElementById('copyStremioBtn');
  const nuvioUrlInput = document.getElementById('nuvioUrlInput');
  const copyNuvioBtn = document.getElementById('copyNuvioBtn');
  const downloadNuvioBtn = document.getElementById('downloadNuvioBtn');

  // Config Inputs
  const providerCheckboxes = document.querySelectorAll('input[name="provider"]');
  const qualityCheckboxes = document.querySelectorAll('input[name="quality"]');
  const maxResultsInput = document.getElementById('maxResultsInput');
  const maxResultsVal = document.getElementById('maxResultsVal');
  const torrentsToggle = document.getElementById('includeTorrentsToggle');
  const directStreamsToggle = document.getElementById('includeDirectStreamsToggle');

  // Tester
  const mediaTypeSelect = document.getElementById('mediaTypeSelect');
  const mediaIdInput = document.getElementById('mediaIdInput');
  const seasonInput = document.getElementById('seasonInput');
  const episodeInput = document.getElementById('episodeInput');
  const testStreamBtn = document.getElementById('testStreamBtn');
  const testerStatus = document.getElementById('testerStatus');
  const streamResultsList = document.getElementById('streamResultsList');
  const seriesInputsWrapper = document.getElementById('seriesInputsWrapper');

  // Modal
  const playerModal = document.getElementById('playerModal');
  const modalClose = document.getElementById('modalClose');
  const modalPlayerTitle = document.getElementById('modalPlayerTitle');
  const playerFrame = document.getElementById('playerFrame');
  const playerVideo = document.getElementById('playerVideo');

  // Toast
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Copy helper
  async function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg);
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg);
    }
  }

  // 1. Fetch Server Health
  async function fetchHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'online') {
        serverStatusBadge.innerHTML = `<span class="status-dot"></span> Server Active (v${data.version})`;
        uptimeBadge.textContent = `⏱️ Uptime: ${Math.floor(data.uptimeSeconds / 60)}m`;
        cacheBadge.textContent = `💾 Cache: ${data.cache.streamEntries} queries`;
      }
    } catch (e) {
      serverStatusBadge.innerHTML = `<span class="status-dot" style="background: #ef4444; box-shadow: 0 0 10px #ef4444;"></span> Offline`;
    }
  }

  // 2. Compute Current Configuration
  function getCurrentConfig() {
    const providers = Array.from(providerCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const qualities = Array.from(qualityCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const maxResults = parseInt(maxResultsInput.value, 10) || 20;
    const includeTorrents = torrentsToggle.checked;
    const includeDirectStreams = directStreamsToggle.checked;

    return {
      providers,
      qualities,
      maxResults,
      includeTorrents,
      includeDirectStreams
    };
  }

  // 3. Update URLs dynamically
  async function updateGeneratedUrls() {
    const config = getCurrentConfig();
    try {
      const res = await fetch('/api/config/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();

      stremioInstallBtn.href = data.stremioUrl;
      stremioUrlInput.value = data.manifestUrl;
      nuvioUrlInput.value = data.nuvioPluginUrl;
      downloadNuvioBtn.href = data.nuvioDownloadUrl;
    } catch (err) {
      console.error('Error generating URLs:', err);
    }
  }

  // Event listeners for config changes
  [...providerCheckboxes, ...qualityCheckboxes, torrentsToggle, directStreamsToggle].forEach(cb => {
    cb.addEventListener('change', updateGeneratedUrls);
  });

  maxResultsInput.addEventListener('input', () => {
    maxResultsVal.textContent = maxResultsInput.value;
    updateGeneratedUrls();
  });

  copyStremioBtn.addEventListener('click', () => {
    copyToClipboard(stremioUrlInput.value, 'Stremio Manifest URL copied!');
  });

  copyNuvioBtn.addEventListener('click', () => {
    copyToClipboard(nuvioUrlInput.value, 'Nuvio Plugin URL copied!');
  });

  // Type change (Movie vs Series)
  mediaTypeSelect.addEventListener('change', () => {
    if (mediaTypeSelect.value === 'series') {
      seriesInputsWrapper.style.display = 'grid';
    } else {
      seriesInputsWrapper.style.display = 'none';
    }
  });

  // Preset chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type;
      const id = chip.dataset.id;
      const s = chip.dataset.season;
      const e = chip.dataset.episode;

      mediaTypeSelect.value = type;
      mediaIdInput.value = id;
      if (type === 'series') {
        seriesInputsWrapper.style.display = 'grid';
        seasonInput.value = s || '1';
        episodeInput.value = e || '1';
      } else {
        seriesInputsWrapper.style.display = 'none';
      }

      runStreamTest();
    });
  });

  // Stream Tester execution
  async function runStreamTest() {
    const type = mediaTypeSelect.value;
    let id = mediaIdInput.value.trim();

    if (!id) {
      showToast('Please enter an IMDb ID');
      return;
    }

    if (type === 'series') {
      const s = seasonInput.value || '1';
      const e = episodeInput.value || '1';
      id = `${id}:${s}:${e}`;
    }

    testerStatus.style.display = 'block';
    testerStatus.textContent = '🔍 Querying multi-source internet scrapers...';
    streamResultsList.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">Fetching streams in real-time...</div>';

    try {
      const cfg = getCurrentConfig();
      const cfgParam = btoa(JSON.stringify(cfg));
      const res = await fetch(`/api/test-stream?type=${type}&id=${encodeURIComponent(id)}&config=${encodeURIComponent(cfgParam)}`);
      const data = await res.json();

      if (!data.success) {
        testerStatus.textContent = `❌ Error: ${data.error || 'Failed to fetch streams'}`;
        streamResultsList.innerHTML = '';
        return;
      }

      testerStatus.innerHTML = `✅ Found <strong>${data.count}</strong> streams in <strong>${data.durationMs}ms</strong> for <em>${data.metadata.title || id}</em> (${data.metadata.year || ''})`;

      if (!data.streams || data.streams.length === 0) {
        streamResultsList.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No streams found matching current filters.</div>';
        return;
      }

      renderStreams(data.streams, data.metadata);
    } catch (err) {
      testerStatus.textContent = '❌ Failed to communicate with server.';
      streamResultsList.innerHTML = '';
    }
  }

  testStreamBtn.addEventListener('click', runStreamTest);

  // Render streams
  function renderStreams(streams, meta) {
    streamResultsList.innerHTML = '';

    streams.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'stream-card';

      // Parse details
      const lines = (s.title || '').split('\n');
      const titleLine = lines[0] || 'Stream';
      const detailsLine = lines.slice(1).join(' • ') || '';

      // Quality tag
      const nameParts = (s.name || '').split('\n');
      const qualityTag = nameParts[1] || 'HD';

      let actionHtml = '';
      if (s.url) {
        actionHtml = `<button class="btn btn-primary btn-sm play-btn" data-url="${encodeURIComponent(s.url)}" data-title="${encodeURIComponent(titleLine)}">▶ Play Web</button>`;
      } else if (s.infoHash) {
        const magnet = `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(meta.title || 'video')}`;
        actionHtml = `
          <button class="btn btn-secondary btn-sm copy-magnet-btn" data-magnet="${encodeURIComponent(magnet)}">🧲 Magnet</button>
          <a href="stremio:///detail/${meta.type || 'movie'}/${meta.imdbId}" class="btn btn-primary btn-sm">▶ Stremio</a>
        `;
      }

      card.innerHTML = `
        <div class="stream-info">
          <div class="stream-meta-row">
            <span class="stream-quality-tag">${qualityTag}</span>
            <span class="stream-provider-tag">${s.url ? '🌐 Web Stream' : '⚡ P2P Torrent'}</span>
          </div>
          <div class="stream-title-text">${titleLine}</div>
          <div class="stream-details-text">${detailsLine}</div>
        </div>
        <div class="stream-actions">
          ${actionHtml}
        </div>
      `;

      streamResultsList.appendChild(card);
    });

    // Attach play event listeners
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.dataset.url);
        const title = decodeURIComponent(btn.dataset.title);
        openPlayerModal(url, title);
      });
    });

    // Attach copy magnet listeners
    document.querySelectorAll('.copy-magnet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const magnet = decodeURIComponent(btn.dataset.magnet);
        copyToClipboard(magnet, 'Magnet URI copied to clipboard!');
      });
    });
  }

  // Modal Player
  function openPlayerModal(url, title) {
    modalPlayerTitle.textContent = title;
    playerModal.style.display = 'flex';

    if (url.includes('.mp4') || url.includes('.mkv')) {
      playerFrame.style.display = 'none';
      playerVideo.style.display = 'block';
      playerVideo.src = url;
      playerVideo.play().catch(() => {});
    } else {
      playerVideo.style.display = 'none';
      playerVideo.pause();
      playerFrame.style.display = 'block';
      playerFrame.src = url;
    }
  }

  function closePlayerModal() {
    playerModal.style.display = 'none';
    playerFrame.src = 'about:blank';
    playerVideo.pause();
    playerVideo.src = '';
  }

  modalClose.addEventListener('click', closePlayerModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closePlayerModal();
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.target);
      if (pane) pane.classList.add('active');
    });
  });

  // Initialize
  fetchHealth();
  updateGeneratedUrls();
});
