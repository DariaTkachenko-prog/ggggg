(function () {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const bgMusic = document.getElementById('bg-music');
  const openSound = document.getElementById('open-sound');
  const clickSound = document.getElementById('click-sound');

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function playClickSound() {
    try {
      if (!clickSound) return;
      clickSound.currentTime = 0;
      const p = clickSound.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }
  window.playClickSound = playClickSound;

  const CONFETTI_COLORS = ["#FF7A59", "#FFCC00", "#3FC764", "#1E78FF", "#B623FF"];
  let confetti = [];
  let confettiRunning = false;
  let confettiStart = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createConfetti(count) {
    if (!canvas) return;
    confetti = [];
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: rand(0, canvas.width),
        y: rand(-canvas.height, 0),
        w: rand(6, 12),
        h: rand(10, 18),
        vx: rand(-1.6, 1.6),
        vy: rand(2.2, 4.8),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.12, 0.12),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        alpha: rand(0.85, 1)
      });
    }
  }

  function drawConfettiPiece(p, fade) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = p.alpha * fade;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  function updateConfettiPiece(p) {
    if (!canvas) return;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    if (p.x < -40) p.x = canvas.width + 40;
    if (p.x > canvas.width + 40) p.x = -40;
  }

  const CONFETTI_TIME = 4500;
  const CONFETTI_FADE = 1800;

  function animateConfetti(ts) {
    if (!canvas || !ctx) return;
    if (!confettiRunning) return;
    if (!confettiStart) confettiStart = ts;
    const elapsed = ts - confettiStart;

    let fade = 1;
    if (elapsed > CONFETTI_TIME) {
      const fe = elapsed - CONFETTI_TIME;
      fade = 1 - fe / CONFETTI_FADE;
      if (fade < 0) fade = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of confetti) {
      updateConfettiPiece(p);
      drawConfettiPiece(p, fade);
    }

    if (elapsed < CONFETTI_TIME + CONFETTI_FADE && fade > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function startConfetti() {
    if (!canvas) return;
    createConfetti(Math.min(160, Math.floor(canvas.width / 6)));
    confettiRunning = true;
    confettiStart = 0;
    requestAnimationFrame(animateConfetti);
  }

  function playOpenSound() {
    try {
      if (!openSound) return;
      openSound.currentTime = 0;
      const p = openSound.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  // Експорт для можливих майбутніх ефектів
  window.startConfetti = startConfetti;
  window.playOpenSound = playOpenSound;
})();


// ===== New Year Tree Game (start: choose tree + gift, then 9 toys) =====
(function () {
  const startChoice = document.getElementById('startChoice');
  const treeChoice = document.getElementById('treeChoice');
  const giftChoice = document.getElementById('giftChoice');
  const continueBtn = document.getElementById('continueBtn');

  const gameArea = document.getElementById('gameArea');
  const playfield = document.getElementById('playfield');
  const treeZone = document.getElementById('treeZone');
  const treeImg = document.getElementById('treeImg');
  const gameHint = document.getElementById('gameHint');

  const resetBtn = document.getElementById('resetBtn');
  const lightsBtn = document.getElementById('lightsBtn');
  const saveBtn = document.getElementById('saveBtn');

    if (!startChoice || !treeChoice || !giftChoice || !continueBtn || !gameArea || !playfield || !treeZone || !treeImg || !resetBtn || !lightsBtn || !saveBtn || !gameHint) return;

  // Імена файлів мають збігатися 1-в-1 з вашими PNG
  const ASSETS = {
    // Choice images (buttons on the start screen)
    treesChoice: {
      1: 'tree_1_choice.png',
      2: 'tree_2_choice.png',
      3: 'tree_3_choice.png'
    },
    // Tree images in the game (where the toys are placed)
    treesGame: {
      1: 'tree_1_game.png',
      2: 'tree_2_game.png',
      3: 'tree_3_game.png'
    },
    // Gift / toy-set images (start screen)
    gifts: {
      1: 'gift_1.png',
      2: 'gift_2.png',
      3: 'gift_3.png'
    },
    // Toys (9 per set) — ASCII filenames to avoid GitHub Pages URL issues
    toys: {
      1: Array.from({ length: 9 }, (_, i) => `toy_1_${i + 1}.png`),
      2: Array.from({ length: 9 }, (_, i) => `toy_2_${i + 1}.png`),
      3: Array.from({ length: 9 }, (_, i) => `toy_3_${i + 1}.png`)
    }
  };

  let selectedTree = null;
  let selectedGift = null;

  const toyElements = new Set();
  let totalToys = 0;
  let lightsOn = false;

  // Move the “lights” button into the playfield so we can position it above the tree.
  // (Keeps existing layout intact and does not require HTML changes.)
  if (lightsBtn && playfield && lightsBtn.parentElement !== playfield) {
    playfield.appendChild(lightsBtn);
    lightsBtn.classList.add('floating-lights-btn');
  }

  // Move the “save” button into the playfield as well (it should appear above the tree).
  if (saveBtn && playfield && saveBtn.parentElement !== playfield) {
    playfield.appendChild(saveBtn);
    saveBtn.classList.add('floating-save-btn');
  }

  function playClick() {
    if (window.playClickSound) window.playClickSound();
  }

  function setSelected(container, btn) {
    container.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
  }

  function updateContinueState() {
    continueBtn.disabled = !(selectedTree && selectedGift);
  }

  // ---- Lights ----
  function removeLights() {
    const layer = treeZone.querySelector('.lights-layer');
    if (layer) layer.remove();
    lightsOn = false;
    // Keep the same label; we do not offer an explicit "off" control in the UI.
    lightsBtn.textContent = 'Увімкнути гірлянду';

    // Remove any post-lights decoration
    treeZone.classList.remove('lights-on');

    // Save button should be available only when the garland is ON
    saveBtn.classList.add('hidden');
  }

  function createLights() {
    if (treeZone.querySelector('.lights-layer')) return;

    const layer = document.createElement('div');
    layer.className = 'lights-layer';

    const count = 18;
    for (let i = 0; i < count; i++) {
      const light = document.createElement('div');
      light.className = 'light';

      const y = 12 + Math.random() * 76; // 12..88
      const w = 0.18 + 0.82 * (y / 100);
      const half = 46 * w;
      let x = 50 + (Math.random() * 2 - 1) * half;
      x = Math.max(6, Math.min(94, x));

      light.style.left = x.toFixed(2) + '%';
      light.style.top = y.toFixed(2) + '%';
      light.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      light.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + 's';

      layer.appendChild(light);
    }

    treeZone.appendChild(layer);
    lightsOn = true;

    // Add a subtle, non-destructive glow BEHIND the tree (does not wash out the artwork)
    treeZone.classList.add('lights-on');

    // UI rules from the request:
    // - No "turn off" button
    // - After turning on the garland, show the save button instead
    lightsBtn.classList.add('hidden');
    lightsBtn.classList.remove('btn-blink');
    saveBtn.classList.remove('hidden');
  }

  function updateCompletion() {
    if (!totalToys) {
      lightsBtn.classList.add('hidden');
      saveBtn.classList.add('hidden');
      return;
    }
    let onTree = 0;
    for (const el of toyElements) {
      if (el.dataset.onTree === '1') onTree++;
    }
    const done = onTree === totalToys;
    if (done) {
      lightsBtn.classList.remove('hidden');
      lightsBtn.classList.add('btn-blink');
      lightsBtn.textContent = 'Увімкнути гірлянду';
    } else {
      if (lightsOn) removeLights();
      lightsBtn.classList.add('hidden');
      lightsBtn.classList.remove('btn-blink');
      saveBtn.classList.add('hidden');
    }
  }

  // ---- Toys ----
  function clearToys() {
    for (const el of toyElements) el.remove();
    toyElements.clear();
    totalToys = 0;
    lightsBtn.classList.add('hidden');
    lightsBtn.classList.remove('btn-blink');
    removeLights();
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getToySize() {
    const probe = document.createElement('div');
    probe.className = 'toy';
    probe.style.visibility = 'hidden';
    probe.style.position = 'absolute';
    playfield.appendChild(probe);
    const w = Math.round(probe.getBoundingClientRect().width) || 56;
    probe.remove();
    return w;
  }

  // --- Keep toy positions stable on resize / browser zoom ---
  // We store positions as relative fractions within the available area (container size - toy size).
  function saveRelPos(toy, container) {
    if (!toy || !container) return;
    const c = container.getBoundingClientRect();
    const size = getToySize();
    const maxX = Math.max(1, c.width - size);
    const maxY = Math.max(1, c.height - size);

    const left = parseFloat(toy.style.left) || 0;
    const top = parseFloat(toy.style.top) || 0;

    toy.dataset.relX = (left / maxX).toFixed(5);
    toy.dataset.relY = (top / maxY).toFixed(5);
  }

  function applyRelPos(toy, container) {
    if (!toy || !container) return;
    if (toy.classList.contains('dragging')) return;

    const rx = parseFloat(toy.dataset.relX);
    const ry = parseFloat(toy.dataset.relY);
    if (Number.isNaN(rx) || Number.isNaN(ry)) return;

    const c = container.getBoundingClientRect();
    const size = getToySize();
    const maxX = Math.max(0, c.width - size);
    const maxY = Math.max(0, c.height - size);

    const left = clamp(rx * maxX, 0, maxX);
    const top = clamp(ry * maxY, 0, maxY);

    toy.style.left = Math.round(left) + 'px';
    toy.style.top = Math.round(top) + 'px';
  }

  function repositionAllToys() {
    for (const el of toyElements) {
      const parent = el.parentElement;
      if (parent === playfield || parent === treeZone) {
        applyRelPos(el, parent);
      }
    }
  }

  // Observe layout changes (works better than only window.resize for zoom)
  const ro = (window.ResizeObserver) ? new ResizeObserver(() => repositionAllToys()) : null;
  if (ro) {
    ro.observe(playfield);
    ro.observe(treeZone);
  } else {
    window.addEventListener('resize', repositionAllToys);
  }

  function scatterToys(toyFiles) {
    clearToys();

    totalToys = Array.isArray(toyFiles) ? toyFiles.length : 0;

    const pfRect = playfield.getBoundingClientRect();
    const treeRect = treeZone.getBoundingClientRect();
    const maxAttempts = 60;
    const size = getToySize();

    toyFiles.forEach((src, idx) => {
      const toy = document.createElement('img');
      toy.className = 'toy';
      toy.src = src;
      toy.alt = 'Іграшка';
      toy.draggable = false;
      toy.dataset.onTree = '0';
      // --- Initial layout: much higher and on the sides of the tree ---
      // Side zones are computed in playfield coordinates to keep toys away from the tree.
      const treeLeft = treeRect.left - pfRect.left;
      const treeRight = treeRect.right - pfRect.left;

      const TREE_GAP = 90; // px gap from tree edge (increase to push further out)

      const leftMinX = 10;
      const leftMaxX = treeLeft - TREE_GAP - size;
      const rightMinX = treeRight + TREE_GAP;
      const rightMaxX = pfRect.width - size - 10;

      // Pick a side zone (fallback to full width if the screen is too narrow)
      let useLeft = Math.random() < 0.5;
      let minX = useLeft ? leftMinX : rightMinX;
      let maxX = useLeft ? leftMaxX : rightMaxX;

      if (maxX <= minX) {
        // fallback: use the widest available zone
        if (leftMaxX > leftMinX) {
          minX = leftMinX; maxX = leftMaxX;
        } else if (rightMaxX > rightMinX) {
          minX = rightMinX; maxX = rightMaxX;
        } else {
          minX = 10; maxX = pfRect.width - size - 10;
        }
      }

      // X: random within the chosen side zone
      let x = Math.random() * (maxX - minX) + minX;

      // Y: scatter within the vertical span of the tree so toys stay visible (left/right of the tree)
      const treeTopInPf = treeRect.top - pfRect.top;
      const treeBottomInPf = treeRect.bottom - pfRect.top;

      const bandTop = clamp(treeTopInPf + 20, 10, pfRect.height - size - 10);
      const bandBottom = clamp(treeBottomInPf - size - 10, bandTop + 10, pfRect.height - size - 10);

      // Slight bias toward upper part of the tree for a nicer "ready to hang" look
      const rY = Math.random();
      let y = bandTop + (bandBottom - bandTop) * (rY * 0.65);

      // Extra safety: avoid the tree rectangle if fallback used full width
      for (let a = 0; a < maxAttempts; a++) {
        const pageX = pfRect.left + x + size / 2;
        const pageY = pfRect.top + y + size / 2;
        const insideTree = pageX >= treeRect.left && pageX <= treeRect.right && pageY >= treeRect.top && pageY <= treeRect.bottom;
        if (!insideTree) break;

        // try the other side
        useLeft = !useLeft;
        minX = useLeft ? leftMinX : rightMinX;
        maxX = useLeft ? leftMaxX : rightMaxX;
        if (maxX <= minX) { minX = 10; maxX = pfRect.width - size - 10; }

        x = Math.random() * (maxX - minX) + minX;

        const rY2 = Math.random();
        y = bandTop + (bandBottom - bandTop) * (rY2 * 0.65);
      }

      toy.style.left = Math.round(x) + 'px';
      toy.style.top = Math.round(y) + 'px';

      enableDrag(toy);
      playfield.appendChild(toy);
      saveRelPos(toy, playfield);
      toyElements.add(toy);
    });

    updateCompletion();
  }

  // Pointer drag (desktop + mobile)
  function enableDrag(toy) {
    // Toys and tree live in ONE container: playfield.
    // We never move the toy into another parent; we only track whether it is inside the tree-zone.
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseLeft = 0;
    let baseTop = 0;

    toy.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      playClick();

      dragging = true;
      toy.classList.add('dragging');

      const pf = playfield.getBoundingClientRect();
      const r = toy.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      baseLeft = r.left - pf.left;
      baseTop = r.top - pf.top;

      toy.setPointerCapture?.(e.pointerId);
    });

    toy.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const pfRect = playfield.getBoundingClientRect();
      const size = getToySize();

      const newLeft = clamp(baseLeft + dx, 0, pfRect.width - size);
      const newTop = clamp(baseTop + dy, 0, pfRect.height - size);

      toy.style.left = Math.round(newLeft) + 'px';
      toy.style.top = Math.round(newTop) + 'px';
    });

    toy.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      e.preventDefault();

      dragging = false;
      toy.classList.remove('dragging');

      const treeRect = treeZone.getBoundingClientRect();
      const pfRect = playfield.getBoundingClientRect();
      const size = getToySize();

      const centerX = e.clientX;
      const centerY = e.clientY;

      const insideTree = centerX >= treeRect.left && centerX <= treeRect.right && centerY >= treeRect.top && centerY <= treeRect.bottom;

      if (insideTree) {
        // Clamp the toy within the visible tree-zone rectangle (still in playfield coordinates)
        const treeLeft = treeRect.left - pfRect.left;
        const treeTop = treeRect.top - pfRect.top;

        const leftInTree = clamp(centerX - pfRect.left - size / 2, treeLeft, treeLeft + treeRect.width - size);
        const topInTree = clamp(centerY - pfRect.top - size / 2, treeTop, treeTop + treeRect.height - size);

        toy.style.left = Math.round(leftInTree) + 'px';
        toy.style.top = Math.round(topInTree) + 'px';
        toy.dataset.onTree = '1';
      } else {
        toy.dataset.onTree = '0';
      }

      // Persist final position for future resize/zoom recalculation
      saveRelPos(toy, playfield);
      updateCompletion();
    });
  }

  // ---- Start selection handlers ----
  treeChoice.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    const id = btn.dataset.tree;
    if (!id || !ASSETS.treesChoice[id] || !ASSETS.treesGame[id]) return;

    playClick();
    selectedTree = id;
    setSelected(treeChoice, btn);
    updateContinueState();
  });

  giftChoice.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    const id = btn.dataset.gift;
    if (!id || !ASSETS.gifts[id]) return;

    playClick();
    selectedGift = id;
    setSelected(giftChoice, btn);
    updateContinueState();
  });

  // ---- Continue -> start game ----
  continueBtn.addEventListener('click', () => {
    if (!(selectedTree && selectedGift)) return;
    playClick();

    // Layout mode: make tree slightly larger while decorating
    document.body.classList.add('decorating');

    // show selected tree
    treeImg.src = ASSETS.treesGame[selectedTree];

    // swap screens
    startChoice.classList.add('hidden');
    gameArea.classList.remove('hidden');

    // Update hint for the decorating stage (UA)
    gameHint.textContent = 'Прикрась свою ялинку — розвішай іграшки';

    // Update the helper text for the decorating stage
    gameHint.textContent = 'Прикрась свою ялинку — розвішай іграшки';

    // Save button should appear ONLY after garland is turned on
    saveBtn.classList.add('hidden');

    // Ensure lights button is ready (floating + blinking will be applied once toys are complete)
    lightsBtn.classList.add('hidden');
    lightsBtn.classList.remove('btn-blink');

    // build toys (9)
    scatterToys(ASSETS.toys[selectedGift]);
  });

  // Lights appear only when all toys are on the tree
  lightsBtn.addEventListener('click', () => {
    playClick();
    if (!lightsOn) createLights();
  });


  // ---- Save as PNG (export the playfield: tree + toys + lights) ----
  async function exportPNG() {
    try {
      const pfRect = playfield.getBoundingClientRect();
      if (pfRect.width < 2 || pfRect.height < 2) return;

      // Slightly higher cap for crisper exports on modern screens
      const dpr = Math.max(1, Math.min(4, window.devicePixelRatio || 1));

      // Helper: ensure images are decoded (prevents blank exports on some browsers)
      async function ensureDecoded(img) {
        if (!img) return;
        if (img.complete && img.naturalWidth > 0) {
          if (typeof img.decode === 'function') {
            try { await img.decode(); } catch (_) {}
          }
          return;
        }
        await new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
        if (typeof img.decode === 'function') {
          try { await img.decode(); } catch (_) {}
        }
      }

      // ===== Background for export (so the saved PNG matches the prepared card) =====
      // 1) Try a dedicated template background (recommended): card-bg.png
      // 2) Fallback to current CSS body background image (bg.png / bg-mobile.png)
      async function getExportBackgroundURL() {
        const preferred = 'card-bg.png';

        // Try preferred first
        try {
          const test = new Image();
          test.src = preferred;
          await ensureDecoded(test);
          if (test.naturalWidth > 0) return preferred;
        } catch (_) {}

        // Fallback: read CSS background-image from <body>
        try {
          const bg = window.getComputedStyle(document.body).backgroundImage || '';
          const m = bg.match(/url\((['"]?)(.*?)\1\)/i);
          if (m && m[2]) return m[2];
        } catch (_) {}

        return null;
      }

      const bgUrl = await getExportBackgroundURL();
      let bgImg = null;

      if (bgUrl) {
        bgImg = new Image();
        // If you ever host assets on another domain, this helps avoid a tainted canvas.
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = bgUrl;
        await ensureDecoded(bgImg);
        if (!(bgImg.naturalWidth > 0 && bgImg.naturalHeight > 0)) bgImg = null;
      }

      // Template mode:
      // If you provide a postcard template image (card-bg.png) that already contains the logo/text/border,
      // we export the FULL template so nothing gets cropped.
      const isTemplate = !!(bgImg && /(^|\/)card-bg\.png(\?|#|$)/i.test(bgUrl || ''));

      // Compute output size:
      // - Template: use template image aspect (fit to ~1080px on the longest side for reasonable file size)
      // - Non-template: keep the old "smart crop" around the scene
      let minX = 0, minY = 0, outW = 0, outH = 0;

      const tRect = treeImg.getBoundingClientRect();

      if (isTemplate) {
        const iw = bgImg.naturalWidth;
        const ih = bgImg.naturalHeight;

        // Scale template down if it's very large (keeps files lightweight)
        const maxSide = 1400; // safe quality/size balance
        const scale = Math.min(1, maxSide / Math.max(iw, ih));

        outW = Math.max(2, Math.round(iw * scale));
        outH = Math.max(2, Math.round(ih * scale));

        minX = 0;
        minY = 0;
      } else {
        // --- Old behavior: crop to the actual composed scene (tree + toys + lights), with padding ---
        const pad = 14;

        minX = tRect.left - pfRect.left;
        minY = tRect.top - pfRect.top;
        let maxX = tRect.right - pfRect.left;
        let maxY = tRect.bottom - pfRect.top;

        for (const toy of toyElements) {
          const r = toy.getBoundingClientRect();
          minX = Math.min(minX, r.left - pfRect.left);
          minY = Math.min(minY, r.top - pfRect.top);
          maxX = Math.max(maxX, r.right - pfRect.left);
          maxY = Math.max(maxY, r.bottom - pfRect.top);
        }

        if (lightsOn) {
          const lights = treeZone.querySelectorAll('.light');
          for (const l of lights) {
            const r = l.getBoundingClientRect();
            const rad = Math.max(r.width, r.height) * 2.0; // include stronger glow
            const cx = (r.left - pfRect.left) + r.width / 2;
            const cy = (r.top - pfRect.top) + r.height / 2;
            minX = Math.min(minX, cx - rad);
            minY = Math.min(minY, cy - rad);
            maxX = Math.max(maxX, cx + rad);
            maxY = Math.max(maxY, cy + rad);
          }
        }

        minX = clamp(minX - pad, 0, pfRect.width);
        minY = clamp(minY - pad, 0, pfRect.height);
        maxX = clamp(maxX + pad, 0, pfRect.width);
        maxY = clamp(maxY + pad, 0, pfRect.height);

        outW = Math.max(2, Math.round(maxX - minX));
        outH = Math.max(2, Math.round(maxY - minY));
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(outW * dpr);
      canvas.height = Math.round(outH * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // ----- Draw background -----
      if (bgImg) {
        // IMPORTANT: use "contain" to avoid cropping away the top (logo/text)
        const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
        const scale = Math.min(outW / iw, outH / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (outW - dw) / 2;
        const dy = (outH - dh) / 2;

        // Optional: fill behind in case of letterboxing
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);

        ctx.drawImage(bgImg, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }

      // Coordinate mapping:
      // - Template: map playfield coordinates proportionally into the template canvas
      // - Non-template: use the cropped coordinate system (old behavior)
      const scaleX = isTemplate ? (outW / pfRect.width) : 1;
      const scaleY = isTemplate ? (outH / pfRect.height) : 1;

      function mapX(x) { return (isTemplate ? x * scaleX : x); }
      function mapY(y) { return (isTemplate ? y * scaleY : y); }
      function mapW(w) { return (isTemplate ? w * scaleX : w); }
      function mapH(h) { return (isTemplate ? h * scaleY : h); }

      // Draw the tree
      await ensureDecoded(treeImg);
      ctx.drawImage(
        treeImg,
        mapX((tRect.left - pfRect.left) - minX),
        mapY((tRect.top - pfRect.top) - minY),
        mapW(tRect.width),
        mapH(tRect.height)
      );

      // Draw toys
      const toys = Array.from(toyElements);
      for (const toy of toys) {
        await ensureDecoded(toy);
        const r = toy.getBoundingClientRect();
        const x = (r.left - pfRect.left) - minX;
        const y = (r.top - pfRect.top) - minY;
        ctx.drawImage(toy, mapX(x), mapY(y), mapW(r.width), mapH(r.height));
      }

      // Draw lights (stronger than before)
      if (lightsOn) {
        const lights = treeZone.querySelectorAll('.light');
        for (const l of lights) {
          const r = l.getBoundingClientRect();
          const cx = ((r.left - pfRect.left) + r.width / 2) - minX;
          const cy = ((r.top - pfRect.top) + r.height / 2) - minY;

          const base = Math.max(r.width, r.height);
          const rad = base * 2.4;

          const mx = mapX(cx);
          const my = mapY(cy);
          const mrad = (isTemplate ? rad * ((scaleX + scaleY) / 2) : rad);

          const g = ctx.createRadialGradient(mx, my, 0, mx, my, mrad);
          g.addColorStop(0, 'rgba(255, 250, 210, 1)');
          g.addColorStop(0.35, 'rgba(255, 190, 95, 0.70)');
          g.addColorStop(1, 'rgba(255, 160, 90, 0)');

          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(mx, my, mrad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle sparkles overlay
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.60;

        const rnd = (min, max) => Math.random() * (max - min) + min;
        const sparkCount = 18;
        for (let i = 0; i < sparkCount; i++) {
          const sx = rnd(0, outW);
          const sy = rnd(0, outH);
          const sr = rnd(18, 52);
          const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
          g2.addColorStop(0, 'rgba(255,255,255,0.85)');
          g2.addColorStop(0.35, 'rgba(255,235,190,0.45)');
          g2.addColorStop(1, 'rgba(255,235,190,0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Download
      const fileName = 'листівка.png';
      const blob = await new Promise((resolve) => {
        try { canvas.toBlob((b) => resolve(b), 'image/png'); }
        catch (_) { resolve(null); }
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 800);
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      // silent fail
    }
  }
saveBtn.addEventListener('click', () => {
    playClick();
    exportPNG();
  });

  // Reset is ALWAYS available
  resetBtn.addEventListener('click', () => {
    playClick();

    document.body.classList.remove('decorating');

    // Clear game state
    clearToys();
    treeImg.src = '';

    // Reset selections
    selectedTree = null;
    selectedGift = null;
    setSelected(treeChoice, null);
    setSelected(giftChoice, null);
    updateContinueState();

    // Back to start screen
    gameArea.classList.add('hidden');
    startChoice.classList.remove('hidden');

    saveBtn.classList.add('hidden');
  });

  // Initial state
  document.body.classList.remove('decorating');
  updateContinueState();
})();
