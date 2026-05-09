(function () {
  'use strict';

  const root = document.getElementById('root');
  const status = document.getElementById('status');
  const body = document.body;

  let zoom = 1;
  let lastContent = '';

  function applyZoom() {
    root.style.transform = zoom === 1 ? '' : 'scale(' + zoom + ')';
    status.textContent = Math.round(zoom * 100) + '%';
  }

  function setContent(svgText) {
    if (svgText === lastContent) return;
    lastContent = svgText;
    // Strip script tags defensively. Webview CSP already blocks them but
    // removing keeps the DOM clean and avoids parser errors.
    const cleaned = svgText.replace(/<script[\s\S]*?<\/script>/gi, '');
    try {
      root.classList.remove('error');
      root.innerHTML = cleaned;
      const svg = root.querySelector('svg');
      if (!svg) {
        root.classList.add('error');
        root.textContent = 'No <svg> element found in document.';
      }
    } catch (err) {
      root.classList.add('error');
      root.textContent = 'Failed to render SVG: ' + (err && err.message ? err.message : String(err));
    }
  }

  document.getElementById('toolbar').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'zoom-in') {
      zoom = Math.min(zoom * 1.25, 64);
      root.classList.remove('fit');
      applyZoom();
    } else if (action === 'zoom-out') {
      zoom = Math.max(zoom / 1.25, 0.05);
      root.classList.remove('fit');
      applyZoom();
    } else if (action === 'zoom-reset') {
      zoom = 1;
      root.classList.remove('fit');
      applyZoom();
    } else if (action === 'fit') {
      zoom = 1;
      root.classList.add('fit');
      applyZoom();
    }
  });

  // Ctrl/Cmd + wheel zoom
  document.getElementById('viewport').addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom = Math.max(0.05, Math.min(64, zoom * factor));
    root.classList.remove('fit');
    applyZoom();
  }, { passive: false });

  window.addEventListener('message', function (event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'update' && typeof msg.content === 'string') {
      setContent(msg.content);
    } else if (msg.type === 'config' && typeof msg.background === 'string') {
      body.setAttribute('data-bg', msg.background);
    }
  });

  applyZoom();

  // Tell the extension we're ready to receive content (covers reload cases).
  const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
  if (vscode) vscode.postMessage({ type: 'ready' });
})();
