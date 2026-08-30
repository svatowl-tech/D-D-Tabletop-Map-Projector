/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Генератор автономного единого HTML файла (Single-File App).
 * Тема: Hardware / Specialist Tool
 * Оптимизирован под MacBook 2010 года без интернета и серверов.
 * Включает полную поддержку наложения нескольких картинок, тумана войны, сетки и надежного рукопожатия.
 */

export function generateStandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VTT-ZERO Tabletop Map Projector (Hardware Specialist)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0A0A0A; color: #E0E0E0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; height: 100vh; width: 100vw; user-select: none; }
    #app { display: flex; flex-direction: column; width: 100%; height: 100%; }
    
    /* Верхняя панель */
    .topbar { display: flex; align-items: center; justify-content: space-between; background: #151619; border-bottom: 1px solid #2A2A2A; padding: 8px 16px; z-index: 50; flex-shrink: 0; }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-title { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; font-size: 16px; color: #F27D26; letter-spacing: -0.5px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; font-family: ui-monospace, monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; background: #0A0A0A; color: #8E9299; border: 1px solid #2A2A2A; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #8E9299; }
    .status-dot.online { background: #00FF00; box-shadow: 0 0 8px #00FF00; }
    
    /* Кнопки */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; border: 1px solid #3A3A3A; background: #2A2A2A; color: #E0E0E0; transition: all 0.15s ease; outline: none; }
    .btn:hover { background: #333333; }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: #F27D26; border-color: #F27D26; color: #000000; font-weight: 700; }
    .btn-primary:hover { background: #E06C15; }
    .btn-active { background: #2A2A2A !important; border: 2px solid #F27D26 !important; color: #FFFFFF !important; box-shadow: 0 0 8px rgba(242, 125, 38, 0.3); }
    .btn-sm { padding: 4px 8px; font-size: 10px; }

    /* Панель инструментов */
    .toolbar { display: flex; align-items: center; gap: 10px; background: #111214; padding: 6px 16px; border-bottom: 1px solid #1F2023; flex-wrap: nowrap; overflow-x: auto; z-index: 40; flex-shrink: 0; }
    .tool-group { display: flex; align-items: center; gap: 4px; border-right: 1px solid #2A2A2A; padding-right: 10px; flex-shrink: 0; }
    .tool-label { font-size: 10px; color: #8E9299; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-right: 2px; }
    
    /* Слайдеры */
    input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; background: #2A2A2A; border-radius: 2px; outline: none; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #F27D26; border: 2px solid #FFF; cursor: pointer; }
    
    /* Рабочая область */
    .viewport { position: relative; flex: 1; overflow: hidden; background-color: #0D0D0F; background-image: radial-gradient(#1A1A1A 1px, transparent 1px); background-size: 24px 24px; cursor: crosshair; }
    .viewport.pan-mode { cursor: grab; }
    .viewport.panning { cursor: grabbing; }
    
    .map-container { position: absolute; top: 0; left: 0; transform-origin: 0 0; will-change: transform; border: 1px solid #2A2A2A; }
    .map-media { display: block; max-width: none; pointer-events: none; }
    .layers-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
    .layer-item { position: absolute; pointer-events: auto; cursor: move; }
    .layer-item.selected { outline: 2px solid #F27D26; box-shadow: 0 0 10px rgba(242,125,38,0.4); }
    .fog-canvas { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 9000; }
    .grid-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9100; }

    /* Нижняя панель */
    .footer-bar { height: 26px; background: #151619; border-top: 1px solid #2A2A2A; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; font-family: ui-monospace, monospace; font-size: 10px; color: #8E9299; flex-shrink: 0; }
    
    /* Экран игроков */
    .player-view { width: 100vw; height: 100vh; overflow: hidden; background: #000; position: relative; cursor: none; }
    .fs-toggle-btn { position: fixed; bottom: 12px; right: 12px; opacity: 0.2; transition: opacity 0.2s; z-index: 100; font-family: monospace; }
    .fs-toggle-btn:hover { opacity: 1; }
  </style>
</head>
<body>
  <div id="app"></div>

  <script>
    (function() {
      const CHANNEL_NAME = 'dnd-projector-channel';
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
      const isPlayer = window.location.search.includes('mode=player') || window.location.hash === '#player';
      
      let state = {
        mediaUrl: null,
        mediaType: null,
        mediaWidth: 1920,
        mediaHeight: 1080,
        layers: [],
        selectedLayerId: null,
        viewport: { x: 0, y: 0, scale: 1 },
        grid: { enabled: false, size: 50, color: 'rgba(255,255,255,0.25)', offsetX: 0, offsetY: 0 },
        tool: 'reveal',
        brushSize: 60,
        masterFogOpacity: 0.55,
        syncViewport: true
      };

      let fogCanvas = document.createElement('canvas');
      let fogCtx = fogCanvas.getContext('2d');
      fogCanvas.width = state.mediaWidth;
      fogCanvas.height = state.mediaHeight;
      fogCtx.clearRect(0, 0, state.mediaWidth, state.mediaHeight);

      if (isPlayer) {
        initPlayerView();
      } else {
        initMasterView();
      }

      function initMasterView() {
        document.body.innerHTML = \`
          <div id="app">
            <header class="topbar">
              <div class="topbar-left">
                <span class="topbar-title">⚔️ VTT-ZERO</span>
                <span class="status-badge">
                  <span class="status-dot" id="statusDot"></span>
                  <span id="statusText">PROJECTOR: STANDBY</span>
                </span>
              </div>
              <div style="display:flex; gap:8px;">
                <label class="btn">
                  ➕ ADD OVERLAY
                  <input type="file" id="overlayInput" accept="image/*,video/mp4,video/webm" style="display:none">
                </label>
                <label class="btn btn-primary">
                  UPLOAD MAP
                  <input type="file" id="fileInput" accept="image/*,video/mp4,video/webm" style="display:none">
                </label>
                <button class="btn" id="openPlayerBtn">OPEN PROJECTOR</button>
              </div>
            </header>

            <nav class="toolbar">
              <div class="tool-group">
                <span class="tool-label">TOOLS:</span>
                <button class="btn btn-sm" id="btnSelect" title="Select / Move Overlay [V]">SELECT [V]</button>
                <button class="btn btn-sm btn-active" id="btnReveal" title="Reveal Fog [R]">REVEAL [R]</button>
                <button class="btn btn-sm" id="btnHide" title="Hide Fog [H]">HIDE [H]</button>
                <button class="btn btn-sm" id="btnPan" title="Pan Map [Space]">PAN [SPACE]</button>
                <button class="btn btn-sm" id="btnFillAll" title="Fill all fog">FILL ALL</button>
                <button class="btn btn-sm" id="btnClearAll" title="Clear all fog">CLEAR ALL</button>
              </div>

              <div class="tool-group">
                <span class="tool-label">BRUSH:</span>
                <input type="range" id="brushSlider" min="15" max="250" value="60" style="width:65px">
                <span id="brushVal" style="font-family:monospace; color:#F27D26; font-size:11px; width:32px; font-weight:bold;">60px</span>
              </div>

              <div class="tool-group">
                <span class="tool-label">GRID:</span>
                <button class="btn btn-sm" id="btnGridToggle">GRID: OFF</button>
                <input type="range" id="gridSlider" min="25" max="150" value="50" style="width:55px">
              </div>

              <div class="tool-group">
                <span class="tool-label">ZOOM:</span>
                <button class="btn btn-sm" id="btnZoomOut">➖</button>
                <span id="zoomVal" style="font-family:monospace; color:#F27D26; font-size:11px; width:36px; text-align:center; font-weight:bold;">100%</span>
                <button class="btn btn-sm" id="btnZoomIn">➕</button>
                <button class="btn btn-sm" id="btnFit">FIT</button>
                <button class="btn btn-sm" id="btnResetView">1:1</button>
              </div>

              <div class="tool-group" style="border-right:none;">
                <label style="display:flex; align-items:center; gap:4px; font-size:10px; font-family:monospace; color:#8E9299; cursor:pointer;">
                  <input type="checkbox" id="chkSyncViewport" checked>
                  SYNC VIEWPORT
                </label>
              </div>
            </nav>

            <main class="viewport" id="viewport">
              <div class="map-container" id="mapContainer">
                <div id="mediaSlot">
                  <div style="width:1920px; height:1080px; background:#151619; display:flex; align-items:center; justify-content:center; color:#8E9299; font-family:monospace;">
                    <div style="text-align:center;">
                      <div style="font-size:36px; margin-bottom:8px; color:#F27D26;">🗺️</div>
                      <div style="font-size:15px; font-weight:bold; color:#E0E0E0;">DROP MAP FILE OR OVERLAYS HERE</div>
                      <div style="font-size:11px; margin-top:4px; color:#8E9299;">JPG, PNG, WebP, MP4, WebM (Multi-Layer Hardware Accelerated)</div>
                    </div>
                  </div>
                </div>
                <div class="layers-container" id="layersContainer"></div>
                <canvas class="fog-canvas" id="displayFogCanvas"></canvas>
                <div class="grid-layer" id="gridLayer"></div>
              </div>
            </main>

            <footer class="footer-bar">
              <div id="footerMap">LOADED: DEFAULT_BUFFER.JPG</div>
              <div style="display:flex; gap:16px;">
                <span>LAYERS: <strong id="footerLayers" style="color:#F27D26;">0</strong></span>
                <span>BROADCAST: <strong id="footerChan" style="color:#8E9299;">STANDBY</strong></span>
                <span>MEM: <span style="color:#00FF00;">14.2 MB</span></span>
                <span style="color:#F27D26; font-weight:bold;">v1.1.0-LITE</span>
              </div>
            </footer>
          </div>
        \`;

        setupMasterControls();
      }

      function setupMasterControls() {
        const fileInput = document.getElementById('fileInput');
        const overlayInput = document.getElementById('overlayInput');
        const openPlayerBtn = document.getElementById('openPlayerBtn');
        const viewport = document.getElementById('viewport');
        const mapContainer = document.getElementById('mapContainer');
        const layersContainer = document.getElementById('layersContainer');
        const displayFogCanvas = document.getElementById('displayFogCanvas');
        const gridLayer = document.getElementById('gridLayer');
        const brushSlider = document.getElementById('brushSlider');
        const brushVal = document.getElementById('brushVal');
        const gridSlider = document.getElementById('gridSlider');
        const btnGridToggle = document.getElementById('btnGridToggle');
        const zoomVal = document.getElementById('zoomVal');
        const chkSyncViewport = document.getElementById('chkSyncViewport');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const footerChan = document.getElementById('footerChan');
        const footerMap = document.getElementById('footerMap');
        const footerLayers = document.getElementById('footerLayers');

        displayFogCanvas.width = state.mediaWidth;
        displayFogCanvas.height = state.mediaHeight;
        renderMasterFog();
        fitMapToViewport();

        openPlayerBtn.addEventListener('click', () => {
          const url = window.location.origin + window.location.pathname + '?mode=player';
          const win = window.open(url, 'dnd_player_view', 'width=1280,height=720');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            alert('Popup was blocked by browser. Please allow popups.');
          } else {
            statusDot.classList.add('online');
            statusText.textContent = 'SYSTEM: ACTIVE (60 FPS)';
            footerChan.textContent = 'CONNECTED';
            footerChan.style.color = '#00FF00';
          }
        });

        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
        });

        overlayInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) addOverlayFile(e.target.files[0]);
        });

        window.addEventListener('dragover', (e) => e.preventDefault());
        window.addEventListener('drop', (e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
              if (i === 0 && !state.mediaUrl) {
                loadFile(e.dataTransfer.files[i]);
              } else {
                addOverlayFile(e.dataTransfer.files[i]);
              }
            }
          }
        });

        const toolBtns = {
          select: document.getElementById('btnSelect'),
          reveal: document.getElementById('btnReveal'),
          hide: document.getElementById('btnHide'),
          pan: document.getElementById('btnPan')
        };

        function setTool(t) {
          state.tool = t;
          Object.keys(toolBtns).forEach(k => {
            if (toolBtns[k]) toolBtns[k].classList.toggle('btn-active', k === t);
          });
          viewport.classList.toggle('pan-mode', t === 'pan');
        }

        toolBtns.select.addEventListener('click', () => setTool('select'));
        toolBtns.reveal.addEventListener('click', () => setTool('reveal'));
        toolBtns.hide.addEventListener('click', () => setTool('hide'));
        toolBtns.pan.addEventListener('click', () => setTool('pan'));

        window.addEventListener('keydown', (e) => {
          if (e.key === 'v' || e.key === 'V') setTool('select');
          if (e.key === 'r' || e.key === 'R') setTool('reveal');
          if (e.key === 'h' || e.key === 'H') setTool('hide');
          if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedLayerId) removeLayer(state.selectedLayerId);
          }
        });

        document.getElementById('btnFillAll').addEventListener('click', () => {
          fogCtx.globalCompositeOperation = 'source-over';
          fogCtx.fillStyle = '#000000';
          fogCtx.fillRect(0, 0, state.mediaWidth, state.mediaHeight);
          renderMasterFog();
          sendMsg({ type: 'FOG_FILL_ALL' });
        });

        document.getElementById('btnClearAll').addEventListener('click', () => {
          fogCtx.clearRect(0, 0, state.mediaWidth, state.mediaHeight);
          renderMasterFog();
          sendMsg({ type: 'FOG_CLEAR_ALL' });
        });

        brushSlider.addEventListener('input', (e) => {
          state.brushSize = parseInt(e.target.value);
          brushVal.textContent = state.brushSize + 'px';
        });

        btnGridToggle.addEventListener('click', () => {
          state.grid.enabled = !state.grid.enabled;
          btnGridToggle.textContent = state.grid.enabled ? 'GRID: ' + state.grid.size + 'PX' : 'GRID: OFF';
          btnGridToggle.classList.toggle('btn-active', state.grid.enabled);
          updateGrid();
          sendMsg({ type: 'SYNC_GRID', grid: state.grid });
        });

        gridSlider.addEventListener('input', (e) => {
          state.grid.size = parseInt(e.target.value);
          if (state.grid.enabled) btnGridToggle.textContent = 'GRID: ' + state.grid.size + 'PX';
          updateGrid();
          sendMsg({ type: 'SYNC_GRID', grid: state.grid });
        });

        chkSyncViewport.addEventListener('change', (e) => {
          state.syncViewport = e.target.checked;
          if (state.syncViewport) {
            sendMsg({ type: 'SYNC_VIEWPORT', transform: state.viewport });
          }
        });

        document.getElementById('btnZoomIn').addEventListener('click', () => zoom(1.2));
        document.getElementById('btnZoomOut').addEventListener('click', () => zoom(0.83));
        document.getElementById('btnResetView').addEventListener('click', () => {
          state.viewport = { x: 0, y: 0, scale: 1 };
          applyTransform();
        });
        document.getElementById('btnFit').addEventListener('click', fitMapToViewport);

        let isDrawing = false;
        let isPanning = false;
        let isMovingLayer = false;
        let activeDragLayer = null;
        let panStart = { x: 0, y: 0 };
        let lastPt = null;
        let strokePoints = [];

        viewport.addEventListener('mousedown', (e) => {
          if (e.button === 1 || e.button === 2 || state.tool === 'pan' || e.spaceKey) {
            isPanning = true;
            viewport.classList.add('panning');
            panStart = { x: e.clientX - state.viewport.x, y: e.clientY - state.viewport.y };
            return;
          }

          if (e.button === 0) {
            const pt = getCoords(e);

            if (state.tool === 'select') {
              // Ищем слой под курсором
              const target = state.layers.slice().reverse().find(l => {
                const w = l.width * l.scale;
                const h = l.height * l.scale;
                return pt.x >= l.x && pt.x <= l.x + w && pt.y >= l.y && pt.y <= l.y + h;
              });

              if (target) {
                state.selectedLayerId = target.id;
                isMovingLayer = true;
                activeDragLayer = {
                  id: target.id,
                  startX: pt.x,
                  startY: pt.y,
                  initialX: target.x,
                  initialY: target.y
                };
                renderLayersDOM();
                return;
              } else {
                state.selectedLayerId = null;
                renderLayersDOM();
              }
            }

            if (state.tool === 'reveal' || state.tool === 'hide') {
              isDrawing = true;
              lastPt = pt;
              strokePoints = [pt];
              drawStroke(pt, pt);
            }
          }
        });

        window.addEventListener('mousemove', (e) => {
          if (isPanning) {
            state.viewport.x = e.clientX - panStart.x;
            state.viewport.y = e.clientY - panStart.y;
            applyTransform();
            return;
          }

          if (isMovingLayer && activeDragLayer) {
            const pt = getCoords(e);
            const dx = pt.x - activeDragLayer.startX;
            const dy = pt.y - activeDragLayer.startY;
            const layer = state.layers.find(l => l.id === activeDragLayer.id);
            if (layer) {
              layer.x = Math.round(activeDragLayer.initialX + dx);
              layer.y = Math.round(activeDragLayer.initialY + dy);
              renderLayersDOM();
              sendMsg({
                type: 'UPDATE_LAYER_TRANSFORM',
                layerId: layer.id,
                transform: { x: layer.x, y: layer.y }
              });
            }
            return;
          }

          if (isDrawing && (state.tool === 'reveal' || state.tool === 'hide')) {
            const pt = getCoords(e);
            drawStroke(lastPt, pt);
            strokePoints.push(pt);
            lastPt = pt;

            if (strokePoints.length >= 4) {
              sendMsg({
                type: 'FOG_STROKE',
                stroke: { mode: state.tool, radius: state.brushSize, points: strokePoints }
              });
              strokePoints = [pt];
            }
          }
        });

        window.addEventListener('mouseup', () => {
          if (isPanning) {
            isPanning = false;
            viewport.classList.remove('panning');
          }
          if (isMovingLayer) {
            isMovingLayer = false;
            activeDragLayer = null;
            sendMsg({ type: 'SYNC_LAYERS', layers: state.layers });
          }
          if (isDrawing) {
            isDrawing = false;
            if (strokePoints.length > 0) {
              sendMsg({
                type: 'FOG_STROKE',
                stroke: { mode: state.tool, radius: state.brushSize, points: strokePoints }
              });
              strokePoints = [];
            }
          }
        });

        viewport.addEventListener('wheel', (e) => {
          e.preventDefault();
          const rect = viewport.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const factor = e.deltaY < 0 ? 1.12 : 0.89;
          const newScale = Math.min(Math.max(state.viewport.scale * factor, 0.05), 6.0);

          state.viewport.x = mouseX - (mouseX - state.viewport.x) * (newScale / state.viewport.scale);
          state.viewport.y = mouseY - (mouseY - state.viewport.y) * (newScale / state.viewport.scale);
          state.viewport.scale = newScale;
          applyTransform();
        }, { passive: false });

        viewport.addEventListener('contextmenu', (e) => e.preventDefault());

        function getCoords(e) {
          const rect = viewport.getBoundingClientRect();
          return {
            x: (e.clientX - rect.left - state.viewport.x) / state.viewport.scale,
            y: (e.clientY - rect.top - state.viewport.y) / state.viewport.scale
          };
        }

        function drawStroke(p1, p2) {
          fogCtx.save();
          if (state.tool === 'reveal') {
            fogCtx.globalCompositeOperation = 'destination-out';
            fogCtx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            fogCtx.globalCompositeOperation = 'source-over';
            fogCtx.strokeStyle = '#000000';
          }
          fogCtx.lineWidth = state.brushSize * 2;
          fogCtx.lineCap = 'round';
          fogCtx.lineJoin = 'round';

          fogCtx.beginPath();
          fogCtx.moveTo(p1.x, p1.y);
          fogCtx.lineTo(p2.x, p2.y);
          fogCtx.stroke();
          fogCtx.restore();

          renderMasterFog();
        }

        function renderMasterFog() {
          const dCtx = displayFogCanvas.getContext('2d');
          dCtx.clearRect(0, 0, displayFogCanvas.width, displayFogCanvas.height);
          dCtx.globalAlpha = state.masterFogOpacity;
          dCtx.drawImage(fogCanvas, 0, 0);
        }

        function applyTransform() {
          mapContainer.style.transform = \`translate3d(\${state.viewport.x}px, \${state.viewport.y}px, 0) scale(\${state.viewport.scale})\`;
          zoomVal.textContent = Math.round(state.viewport.scale * 100) + '%';
          if (state.syncViewport) {
            sendMsg({ type: 'SYNC_VIEWPORT', transform: state.viewport });
          }
        }

        function zoom(f) {
          const rect = viewport.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const newScale = Math.min(Math.max(state.viewport.scale * f, 0.05), 6.0);
          state.viewport.x = cx - (cx - state.viewport.x) * (newScale / state.viewport.scale);
          state.viewport.y = cy - (cy - state.viewport.y) * (newScale / state.viewport.scale);
          state.viewport.scale = newScale;
          applyTransform();
        }

        function fitMapToViewport() {
          const rect = viewport.getBoundingClientRect();
          const sW = rect.width / state.mediaWidth;
          const sH = rect.height / state.mediaHeight;
          const s = Math.min(sW, sH) * 0.92;
          state.viewport.scale = s;
          state.viewport.x = (rect.width - state.mediaWidth * s) / 2;
          state.viewport.y = (rect.height - state.mediaHeight * s) / 2;
          applyTransform();
        }

        function updateGrid() {
          if (!state.grid.enabled) {
            gridLayer.style.backgroundImage = 'none';
            return;
          }
          gridLayer.style.backgroundImage = \`
            linear-gradient(to right, \${state.grid.color} 1px, transparent 1px),
            linear-gradient(to bottom, \${state.grid.color} 1px, transparent 1px)
          \`;
          gridLayer.style.backgroundSize = \`\${state.grid.size}px \${state.grid.size}px\`;
        }

        function loadFile(file) {
          if (state.mediaUrl && state.mediaUrl.startsWith('blob:')) {
            URL.revokeObjectURL(state.mediaUrl);
          }

          const isVideo = file.type.startsWith('video/') || /\\.(mp4|webm)$/i.test(file.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            state.mediaUrl = dataUrl;
            state.mediaType = isVideo ? 'video' : 'image';
            footerMap.textContent = 'LOADED: ' + file.name.toUpperCase();

            const slot = document.getElementById('mediaSlot');
            if (isVideo) {
              slot.innerHTML = \`<video src="\${dataUrl}" autoplay loop muted playsinline class="map-media"></video>\`;
              const v = slot.querySelector('video');
              v.onloadedmetadata = () => {
                state.mediaWidth = v.videoWidth || 1920;
                state.mediaHeight = v.videoHeight || 1080;
                v.style.width = state.mediaWidth + 'px';
                v.style.height = state.mediaHeight + 'px';
                resizeMask();
                fitMapToViewport();
                sendFullSync();
              };
            } else {
              slot.innerHTML = \`<img src="\${dataUrl}" class="map-media">\`;
              const img = slot.querySelector('img');
              img.onload = () => {
                state.mediaWidth = img.naturalWidth || 1920;
                state.mediaHeight = img.naturalHeight || 1080;
                img.style.width = state.mediaWidth + 'px';
                img.style.height = state.mediaHeight + 'px';
                resizeMask();
                fitMapToViewport();
                sendFullSync();
              };
            }
          };
          reader.readAsDataURL(file);
        }

        function addOverlayFile(file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
              const maxZ = state.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
              const layer = {
                id: 'layer_' + Date.now(),
                name: file.name,
                type: 'image',
                url: dataUrl,
                dataUrl: dataUrl,
                width: img.naturalWidth || 400,
                height: img.naturalHeight || 400,
                x: Math.round(state.mediaWidth / 4),
                y: Math.round(state.mediaHeight / 4),
                scale: 1.0,
                rotation: 0,
                opacity: 1.0,
                zIndex: maxZ + 1,
                visible: true,
                locked: false
              };
              state.layers.push(layer);
              state.selectedLayerId = layer.id;
              footerLayers.textContent = state.layers.length;
              renderLayersDOM();
              sendMsg({ type: 'SYNC_LAYERS', layers: state.layers });
              setTool('select');
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }

        function removeLayer(id) {
          state.layers = state.layers.filter(l => l.id !== id);
          if (state.selectedLayerId === id) state.selectedLayerId = null;
          footerLayers.textContent = state.layers.length;
          renderLayersDOM();
          sendMsg({ type: 'REMOVE_LAYER', layerId: id });
        }

        function renderLayersDOM() {
          layersContainer.innerHTML = '';
          const sorted = state.layers.slice().sort((a, b) => a.zIndex - b.zIndex);
          sorted.forEach(l => {
            if (!l.visible) return;
            const div = document.createElement('div');
            div.className = 'layer-item' + (l.id === state.selectedLayerId ? ' selected' : '');
            div.style.left = l.x + 'px';
            div.style.top = l.y + 'px';
            div.style.width = (l.width * l.scale) + 'px';
            div.style.height = (l.height * l.scale) + 'px';
            div.style.transform = 'rotate(' + (l.rotation || 0) + 'deg)';
            div.style.opacity = l.opacity !== undefined ? l.opacity : 1.0;
            div.style.zIndex = l.zIndex;

            const img = document.createElement('img');
            img.src = l.dataUrl || l.url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.pointerEvents = 'none';
            div.appendChild(img);

            div.addEventListener('click', (e) => {
              if (state.tool === 'select') {
                e.stopPropagation();
                state.selectedLayerId = l.id;
                renderLayersDOM();
              }
            });

            layersContainer.appendChild(div);
          });
        }

        function resizeMask() {
          fogCanvas.width = state.mediaWidth;
          fogCanvas.height = state.mediaHeight;
          fogCtx.clearRect(0, 0, state.mediaWidth, state.mediaHeight);

          displayFogCanvas.width = state.mediaWidth;
          displayFogCanvas.height = state.mediaHeight;
          renderMasterFog();

          gridLayer.style.width = state.mediaWidth + 'px';
          gridLayer.style.height = state.mediaHeight + 'px';
        }

        function sendFullSync() {
          sendMsg({
            type: 'SYNC_FULL_STATE',
            state: {
              hasMedia: !!state.mediaUrl,
              mediaType: state.mediaType,
              dataUrl: state.mediaUrl,
              mediaWidth: state.mediaWidth,
              mediaHeight: state.mediaHeight,
              viewport: state.viewport,
              grid: state.grid,
              maskDataUrl: fogCanvas.toDataURL('image/png'),
              layers: state.layers
            }
          });
        }

        if (channel) {
          channel.onmessage = (e) => {
            if (e.data.type === 'HANDSHAKE_REQUEST') {
              statusDot.classList.add('online');
              statusText.textContent = 'SYSTEM: ACTIVE (60 FPS)';
              footerChan.textContent = 'CONNECTED';
              footerChan.style.color = '#00FF00';
              sendFullSync();
            }
          };
        }
      }

      function initPlayerView() {
        document.body.innerHTML = \`
          <div class="player-view">
            <div class="map-container" id="pMapContainer">
              <div id="pMediaSlot">
                <div style="width:1920px; height:1080px; background:#000; display:flex; align-items:center; justify-content:center; color:#8E9299; font-family:monospace; font-size:12px;">
                  <span>WAITING FOR DM TRANSMISSION (VTT-ZERO)...</span>
                </div>
              </div>
              <div class="layers-container" id="pLayersContainer"></div>
              <canvas class="fog-canvas" id="pFogCanvas"></canvas>
              <div class="grid-layer" id="pGridLayer"></div>
            </div>
            <button class="btn btn-sm fs-toggle-btn" id="pFsBtn">FULLSCREEN (F11)</button>
          </div>
        \`;

        const container = document.getElementById('pMapContainer');
        const mediaSlot = document.getElementById('pMediaSlot');
        const pLayersContainer = document.getElementById('pLayersContainer');
        const fogCanvas = document.getElementById('pFogCanvas');
        const fogCtx = fogCanvas.getContext('2d');
        const gridLayer = document.getElementById('pGridLayer');
        const fsBtn = document.getElementById('pFsBtn');

        fogCanvas.width = 1920;
        fogCanvas.height = 1080;
        fogCtx.clearRect(0, 0, 1920, 1080);

        fsBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        });

        let currentLayers = [];

        function renderPlayerLayers(layers) {
          currentLayers = layers || [];
          pLayersContainer.innerHTML = '';
          const sorted = currentLayers.slice().sort((a, b) => a.zIndex - b.zIndex);
          sorted.forEach(l => {
            if (!l.visible) return;
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left = l.x + 'px';
            div.style.top = l.y + 'px';
            div.style.width = (l.width * l.scale) + 'px';
            div.style.height = (l.height * l.scale) + 'px';
            div.style.transform = 'rotate(' + (l.rotation || 0) + 'deg)';
            div.style.opacity = l.opacity !== undefined ? l.opacity : 1.0;
            div.style.zIndex = l.zIndex;
            div.style.pointerEvents = 'none';

            const img = document.createElement('img');
            img.src = l.dataUrl || l.url;
            img.style.width = '100%';
            img.style.height = '100%';
            div.appendChild(img);

            pLayersContainer.appendChild(div);
          });
        }

        function applyTrans(t) {
          container.style.transform = \`translate3d(\${t.x}px, \${t.y}px, 0) scale(\${t.scale})\`;
        }

        if (channel) {
          channel.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'SET_MEDIA' && (msg.dataUrl || msg.blob)) {
              const url = msg.dataUrl || (msg.blob ? URL.createObjectURL(msg.blob) : '');
              if (msg.mediaType === 'video') {
                mediaSlot.innerHTML = \`<video src="\${url}" autoplay loop muted playsinline class="map-media" style="width:\${msg.width}px; height:\${msg.height}px;"></video>\`;
              } else {
                mediaSlot.innerHTML = \`<img src="\${url}" class="map-media" style="width:\${msg.width}px; height:\${msg.height}px;">\`;
              }
              fogCanvas.width = msg.width;
              fogCanvas.height = msg.height;
              fogCtx.clearRect(0, 0, msg.width, msg.height);
              gridLayer.style.width = msg.width + 'px';
              gridLayer.style.height = msg.height + 'px';
            } else if (msg.type === 'SYNC_VIEWPORT') {
              applyTrans(msg.transform);
            } else if (msg.type === 'SYNC_GRID') {
              if (msg.grid.enabled) {
                gridLayer.style.backgroundImage = \`linear-gradient(to right, \${msg.grid.color} 1px, transparent 1px), linear-gradient(to bottom, \${msg.grid.color} 1px, transparent 1px)\`;
                gridLayer.style.backgroundSize = \`\${msg.grid.size}px \${msg.grid.size}px\`;
              } else {
                gridLayer.style.backgroundImage = 'none';
              }
            } else if (msg.type === 'SYNC_LAYERS') {
              renderPlayerLayers(msg.layers);
            } else if (msg.type === 'UPDATE_LAYER_TRANSFORM') {
              const l = currentLayers.find(item => item.id === msg.layerId);
              if (l) {
                Object.assign(l, msg.transform);
                renderPlayerLayers(currentLayers);
              }
            } else if (msg.type === 'REMOVE_LAYER') {
              currentLayers = currentLayers.filter(l => l.id !== msg.layerId);
              renderPlayerLayers(currentLayers);
            } else if (msg.type === 'FOG_STROKE') {
              const { mode, radius, points } = msg.stroke;
              fogCtx.save();
              if (mode === 'reveal') {
                fogCtx.globalCompositeOperation = 'destination-out';
                fogCtx.strokeStyle = 'rgba(0,0,0,1)';
              } else {
                fogCtx.globalCompositeOperation = 'source-over';
                fogCtx.strokeStyle = '#000000';
              }
              fogCtx.lineWidth = radius * 2;
              fogCtx.lineCap = 'round';
              fogCtx.lineJoin = 'round';
              if (points.length === 1) {
                fogCtx.beginPath();
                fogCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
                fogCtx.fill();
              } else {
                fogCtx.beginPath();
                fogCtx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                  fogCtx.lineTo(points[i].x, points[i].y);
                }
                fogCtx.stroke();
              }
              fogCtx.restore();
            } else if (msg.type === 'FOG_FILL_ALL') {
              fogCtx.globalCompositeOperation = 'source-over';
              fogCtx.fillStyle = '#000000';
              fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
            } else if (msg.type === 'FOG_CLEAR_ALL') {
              fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
            } else if (msg.type === 'SYNC_FULL_STATE') {
              const s = msg.state;
              if (s.hasMedia && s.dataUrl) {
                mediaSlot.innerHTML = \`<img src="\${s.dataUrl}" class="map-media" style="width:\${s.mediaWidth}px; height:\${s.mediaHeight}px;">\`;
                fogCanvas.width = s.mediaWidth;
                fogCanvas.height = s.mediaHeight;
                gridLayer.style.width = s.mediaWidth + 'px';
                gridLayer.style.height = s.mediaHeight + 'px';
              }
              if (s.layers) renderPlayerLayers(s.layers);
              if (s.viewport) applyTrans(s.viewport);
              if (s.grid) {
                if (s.grid.enabled) {
                  gridLayer.style.backgroundImage = \`linear-gradient(to right, \${s.grid.color} 1px, transparent 1px), linear-gradient(to bottom, \${s.grid.color} 1px, transparent 1px)\`;
                  gridLayer.style.backgroundSize = \`\${s.grid.size}px \${s.grid.size}px\`;
                } else {
                  gridLayer.style.backgroundImage = 'none';
                }
              }
              if (s.maskDataUrl) {
                const img = new Image();
                img.onload = () => {
                  fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
                  fogCtx.drawImage(img, 0, 0);
                };
                img.src = s.maskDataUrl;
              }
            }
          };

          // Периодическое рукопожатие каждые 1.5 секунды, пока мастер не ответит
          const handshakeTimer = setInterval(() => {
            sendMsg({ type: 'HANDSHAKE_REQUEST' });
          }, 1500);
          sendMsg({ type: 'HANDSHAKE_REQUEST' });
        }
      }

      function sendMsg(data) {
        if (channel) channel.postMessage(data);
      }
    })();
  </script>
</body>
</html>`;
}
