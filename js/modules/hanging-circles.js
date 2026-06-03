;// ═══════════ HANGING CIRCLES ═══════════
(function() {
  let canvas = document.getElementById('framesCanvas');
  if (!canvas) return;
  if (getComputedStyle(canvas).display === 'none') return;
  if ('ontouchstart' in window) { canvas.style.display = 'none'; return; }
  let ctx = canvas.getContext('2d');

  let knobColors = ['#e85570', '#444444', '#bbbbbb', '#3ccda0'];
  let ringImages = [null, null, null, null];
  let ringLoaded = [false, false, false, false];

  (function preloadImages() {
    let cards = document.querySelectorAll('.work-card');
    cards.forEach(function(card, i) {
      if (i >= 4) return;
      (function(idx) {
        let img = new Image();
        img.src = card.dataset.image;
        img.onload = function() {
          ringImages[idx] = img;
          ringLoaded[idx] = true;
        };
        img.onerror = function() { ringLoaded[idx] = true; };
      })(i);
    });
  })();

  let springK = 0.05;
  let damping = 0.98;
  let gravity = 0.35;

  let thumbs = [];
  let draggedIdx = -1;
  let hoveredIdx = -1;
  let latchedIdx = -1; // index of the disc locked to its anchor
  let dragOffX = 0, dragOffY = 0;
  let dragStartX = 0, dragStartY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let mouseCanvasX = 0, mouseCanvasY = 0;
  let frameCount = 0;
  let canvasOffX = 0; // canvas CSS offset for latch clip positioning
  let canvasOffY = 0; // canvas CSS Y offset
  let navBottomPx = 0; // nav bottom position relative to hero

  // === WIND SYSTEM ===
  let windDir = 0;       // 0=none, 1=right, -1=left
  let windPower = 0;     // 1~7
  let windFrame = 0;     // current frame in wind cycle
  let windDuration = 0;  // total frames for this gust
  let windNext = 0;      // frame count until next gust
  function scheduleWind() {
    windDir = Math.random() < 0.5 ? -1 : 1;
    windPower = 1 + Math.random() * 6;
    windDuration = 80 + Math.floor(Math.random() * 60);
    windFrame = 0;
    windNext = 150 + Math.floor(Math.random() * 510);
  }
  scheduleWind();

  // --- audio players for each disc ---
  let audios = [
    new Audio('sound/01.mp3'),
    new Audio('sound/02.mp3'),
    new Audio('sound/03.mp3'),
    new Audio('sound/04.mp3')
  ];
  let prevHoveredIdx = -1;
  audios.forEach(function(a) { a.loop = true; a.volume = 0.6; });

  function handleAudioHover(newIdx) {
    // If a disc is latched, don't override with hover
    if (latchedIdx >= 0) {
      window.__audioPlaying = true;
      return;
    }
    if (newIdx === prevHoveredIdx) return;
    // Stop previous
    if (prevHoveredIdx >= 0 && prevHoveredIdx < 4) {
      audios[prevHoveredIdx].pause();
      audios[prevHoveredIdx].currentTime = 0;
    }
    // Play new
    if (newIdx >= 0 && newIdx < 4) {
      audios[newIdx].currentTime = 0;
      audios[newIdx].play().catch(function(){});
      window.__audioPlaying = true;
    } else {
      window.__audioPlaying = false;
    }
    prevHoveredIdx = newIdx;
  }

  // Force play for latched disc (called from mouseup)
  window.__navWaveForcePlay = function(idx) {
    for (let i = 0; i < audios.length; i++) {
      if (i !== idx) { audios[i].pause(); audios[i].currentTime = 0; }
    }
    audios[idx].currentTime = 0;
    audios[idx].play().catch(function(){});
    window.__audioPlaying = true;
    prevHoveredIdx = idx;
  };

  function getCircleSz(screenW) {
    if (screenW >= 1800) return 156;
    if (screenW >= 1400) return 140;
    if (screenW >= 1024) return 120;
    if (screenW >= 768) return 104;
    return 88;
  }

  function resize() {
    let hero = document.getElementById('home');
    if (!hero) return;
    let rect = hero.getBoundingClientRect();
    let dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let w = rect.width, h = rect.height;

    let sz = getCircleSz(w);
    let gap = sz * 1.1;
    let xOff = w < 1200 ? w * 0.52 : w * 0.58;
    let yOffsets = [0, sz * 0.12, sz * 0.24, sz * 0.36];
    let anchorY = 0;
    let anchorXs = [xOff, xOff + gap, xOff + gap * 2, xOff + gap * 3];
    let bottomY = h * 0.33;
    let anchors = [];
    for (let ai = 0; ai < 4; ai++) {
      anchors.push({
        x: anchorXs[ai],
        y: anchorY,
        restOffX: 0,
        stringLen: (bottomY + yOffsets[ai]) - anchorY
      });
    }

    if (thumbs.length === 0) {
      let loadDelay = 0.45;
      for (let i = 0; i < 4; i++) {
        let a = anchors[i];
        let cs = getCircleSz(w);
        let restX = a.x + a.restOffX;
        let restY = a.y + a.stringLen + (yOffsets[i] || 0);
        let startY = restY;
        let startX = restX;
        thumbs.push({
          x: startX, y: startY, vx: 0, vy: 0,
          anchorX: a.x, anchorY: a.y,
          restX: restX, restY: restY,
          dispW: cs, dispH: cs,
          color: knobColors[i],
          entering: false,
          restOffX: 0,
          hoverAlpha: 0
        });
      }
    } else {
      let cs2 = getCircleSz(w);
      for (let j = 0; j < 4; j++) {
        let b = anchors[j];
        thumbs[j].anchorX = b.x;
        thumbs[j].anchorY = b.y;
        thumbs[j].restX = b.x + b.restOffX;
        thumbs[j].restY = b.y + b.stringLen;
        thumbs[j].dispW = cs2;
        thumbs[j].dispH = cs2;
      }
    }

    // Position latch clips: flat edge at nav bottom, centered on disc rest position
    let heroEl = document.getElementById('home');
    let canvasRect = canvas.getBoundingClientRect();
    let heroRect = heroEl.getBoundingClientRect();
    canvasOffX = canvasRect.left - heroRect.left;
    canvasOffY = canvasRect.top - heroRect.top;
    let nav = document.querySelector('nav');
    // Use stable position: nav bottom relative to hero, ignoring scroll
    navBottomPx = nav ? (nav.offsetHeight + parseInt(getComputedStyle(nav).top || '0', 10)) : 80;
    let clips = document.querySelectorAll('.latch-clip');
    // Size latch clips proportional to disc size
    let sampleDisc = thumbs[0];
    let clipSize = sampleDisc ? Math.round(sampleDisc.dispW * 0.7) : 70;
    let clipH = Math.round(clipSize / 2);
    for (let k = 0; k < clips.length && k < thumbs.length; k++) {
      clips[k].style.left = (thumbs[k].restX + canvasOffX) + 'px';
      clips[k].style.top = navBottomPx + 'px';
      clips[k].style.width = clipSize + 'px';
      clips[k].style.height = clipH + 'px';
      let circle = clips[k].querySelector('.latch-circle');
      if (circle) { circle.style.width = clipSize + 'px'; circle.style.height = clipSize + 'px'; circle.style.marginTop = -clipH + 'px'; }
    }
    // Click on HTML clip to unlatch
    clips.forEach(function(clip, ci) {
      clip.onclick = function() {
        if (latchedIdx === ci) {
          let tl = thumbs[latchedIdx];
          tl.vy = -8;
          tl.vx = (Math.random() - 0.5) * 3;
          tl.entering = false;
          latchedIdx = -1;
          document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
          if (window.__navWaveStop) window.__navWaveStop(ci);
        }
      };
    });
  }

  let startTime = 0;

  function update(ts) {
    frameCount++;
    if (!startTime) startTime = ts;
    let elapsed = (ts - startTime) / 1000;

    if (draggedIdx < 0) {
      hoveredIdx = getThumbAt(mouseCanvasX, mouseCanvasY);
    }

    // Wind scheduling
    if (windNext > 0) {
      windNext--;
    } else {
      windFrame++;
      if (windFrame > windDuration) {
        scheduleWind();
      }
    }

    for (let i = 0; i < thumbs.length; i++) {
      let t = thumbs[i];

      // Wind force (staggered by disc index)
      if (windNext <= 0 && windFrame > 0) {
        let stagger = i * 6;
        let localFrame = windFrame - stagger;
        if (localFrame > 0 && localFrame < windDuration) {
          let progress = localFrame / windDuration;
          let envelope = Math.sin(progress * Math.PI);
          let f = windDir * windPower * envelope;
          t.vx += f * 0.04;
        }
      }

      // Latched disc: smooth lock to HTML latch clip position
      if (i === latchedIdx) {
        if (i !== draggedIdx) {
          let heroRect2 = document.getElementById('home').getBoundingClientRect();
          let cRect2 = canvas.getBoundingClientRect();
          let targetX = t.anchorX;
          let targetY = navBottomPx - (cRect2.top - heroRect2.top);
          // Smooth lerp toward latch position
          t.x += (targetX - t.x) * 0.3;
          t.y += (targetY - t.y) * 0.3;
          t.vx = 0; t.vy = 0;
          t.entering = false;
          t.hoverAlpha += (1 - t.hoverAlpha) * 0.05;
          continue;
        }
      }
      let targetHA = (i === hoveredIdx && draggedIdx < 0) ? 1 : 0;
      let speed = targetHA > t.hoverAlpha ? 0.04 : 0.05;
      t.hoverAlpha += (targetHA - t.hoverAlpha) * speed;

      if (i === draggedIdx) continue;

      // Rope constraint variables
      let ax = t.anchorX, ay = t.anchorY;
      let dx = t.x - ax;
      let dy = t.y - ay;
      let dist = Math.sqrt(dx * dx + dy * dy);
      let ropeLen = t.restY - t.anchorY + t.dispH * 0.5;

      // Normal physics: gravity + rope constraint
      t.vy += gravity;
      t.vx *= damping;
      t.vy *= damping;
      t.x += t.vx;
      t.y += t.vy;

      // Enforce rope length constraint
      dx = t.x - ax;
      dy = t.y - ay;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > ropeLen && dist > 0.01) {
        let nx = dx / dist, ny = dy / dist;
        t.x = ax + nx * ropeLen;
        t.y = ay + ny * ropeLen;
        // Remove outward radial velocity (rope can't push, only pull)
        let vradial = t.vx * nx + t.vy * ny;
        if (vradial > 0) {
          t.vx -= vradial * nx * 0.4;
          t.vy -= vradial * ny * 0.4;
        }
      }

      // Sway for rope curve
      if (t._sway === undefined) t._sway = 0;
      let windSway = 0;
      if (windNext <= 0 && windFrame > 0) {
        let stagger = i * 6;
        let localFrame = windFrame - stagger;
        if (localFrame > 0 && localFrame < windDuration) {
          let progress = localFrame / windDuration;
          let envelope = Math.sin(progress * Math.PI);
          windSway = windDir * windPower * envelope * 0.5;
        }
      }
      t._sway += (t.vx * 0.02 + windSway - t._sway) * 0.08;
    }
  }

  function drawString(ax, ay, bx, by, sway) {
    let dx = bx - ax, dy = by - ay;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    let segments = Math.floor(len * 2);
    if (segments < 40) segments = 40;
    let coils = Math.floor(len / 24);
    if (coils < 2) coils = 2;
    let amp = 12;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    let perpX = -dy / len;
    let perpY = dx / len;
    let subSegs = Math.floor(segments / 6);
    if (subSegs < 8) subSegs = 8;
    for (let g = 0; g < subSegs; g++) {
      let t0 = g / subSegs;
      let t1 = (g + 1) / subSegs;
      let alpha = 0.28 * (t0 + t1) / 2;
      let sc0 = sway * Math.sin(t0 * Math.PI) * len * 0.06;
      let sc1 = sway * Math.sin(t1 * Math.PI) * len * 0.06;
      ctx.beginPath();
      let x0 = ax + dx * t0 + perpX * (Math.sin(t0 * coils * Math.PI * 2) * amp + sc0);
      let y0 = ay + dy * t0 + perpY * (Math.sin(t0 * coils * Math.PI * 2) * amp + sc0);
      ctx.moveTo(x0, y0);
      let steps = Math.floor((t1 - t0) * segments);
      if (steps < 4) steps = 4;
      for (let s = 1; s <= steps; s++) {
        let tt = t0 + (s / steps) * (t1 - t0);
        let sc = sway * Math.sin(tt * Math.PI) * len * 0.06;
        let x = ax + dx * tt + perpX * (Math.sin(tt * coils * Math.PI * 2) * amp + sc);
        let y = ay + dy * tt + perpY * (Math.sin(tt * coils * Math.PI * 2) * amp + sc);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(232,124,80,' + (0.6 + alpha * 1.4) + ')';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
  }

  function drawThumb(t, idx) {
    if (t.y + t.dispH < -20) return;

    let r = t.dispW / 2;
    let ha = t.hoverAlpha || 0;

    let spinning = (idx === hoveredIdx || idx === draggedIdx || idx === latchedIdx) ? 1 : 0;
    if (t._spin === undefined) t._spin = 0;
    if (t._spinSpeed === undefined) t._spinSpeed = 0;
    if (t._spinTimer === undefined) t._spinTimer = 0;
    if (spinning) {
      t._spinTimer += 1 / 60;
    } else {
      t._spinTimer = 0;
    }
    let active = t._spinTimer > 0.2 ? 1 : 0;
    t._spinSpeed += (active * 0.015 - t._spinSpeed) * 0.04;
    // When not active, slowly return spin to nearest multiple of 2π (reset position)
    if (!active) {
      let mod = t._spin % (Math.PI * 2);
      if (mod < 0) mod += Math.PI * 2;
      // snap to nearest 0 or π (pick the closer one)
      let target = mod < Math.PI ? 0 : Math.PI * 2;
      t._spin += (target - mod) * 0.03;
    }
    t._spin += t._spinSpeed;

    let eased = ha < 0.01 ? 0 : 1 - Math.pow(1 - ha, 3);
    let scaleBoost = 0.09;
    let scale = 1 + eased * scaleBoost;

    // 常亮白色雾状外发光
    let softGlow = ctx.createRadialGradient(t.x, t.y, r * 0.8, t.x, t.y, r * 1.8);
    softGlow.addColorStop(0, 'rgba(255,255,255,0.10)');
    softGlow.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    softGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = softGlow;
    ctx.fillRect(t.x - r * 3, t.y - r * 3, r * 6, r * 6);

    // hover 增强发光 — 统一白色
    if (ha > 0.01) {
      let glowR = r * 3;
      let grad = ctx.createRadialGradient(t.x, t.y, r * 0.3, t.x, t.y, glowR);
      grad.addColorStop(0, 'rgba(255,255,255,' + (eased * 0.25) + ')');
      grad.addColorStop(0.5, 'rgba(255,255,255,' + (eased * 0.08) + ')');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(t.x - glowR, t.y - glowR, glowR * 2, glowR * 2);
    }

    // Latch clips handled via HTML overlay, not canvas

    // Draw rope from anchor, stopping short of disc edge
    let rdx = t.x - t.anchorX, rdy = t.y - t.anchorY;
    let rDist = Math.sqrt(rdx * rdx + rdy * rdy);
    let hideTop = r * 0.3;      // hide near anchor
    let hideBot = r * 0.75;     // stop before disc edge
    let visLen = rDist - hideTop - hideBot;
    if (visLen > 2) {
      let sx = t.anchorX + rdx * (hideTop / rDist);
      let sy = t.anchorY + rdy * (hideTop / rDist);
      let ex = t.x - rdx * (hideBot / rDist);
      let ey = t.y - rdy * (hideBot / rDist);
      let sway = t._sway || 0;
      drawString(sx, sy, ex, ey, sway);
    }

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t._spin || 0);
    ctx.scale(scale, scale);

    // 图片贴到圆环区域（环形 clip，填满裁切，像唱片）
    if (ringLoaded[idx] && ringImages[idx]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2, true);
      ctx.save();
      ctx.clip('evenodd');
      let img = ringImages[idx];
      let iw = img.width, ih = img.height;
      // 按内径填满环形外圈，确保圆环完全被图片覆盖
      let scaleImg = Math.max(r * 2 / iw, r * 2 / ih) * 1.3;
      let dw = iw * scaleImg, dh = ih * scaleImg;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    // 纯色圆环（图片未加载时用）
    if (!ringLoaded[idx] || !ringImages[idx]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2, true);
      ctx.fillStyle = t.color;
      ctx.fill('evenodd');
    }

    // 圆环外圈深灰描边
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20,20,20,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 唱片内圈深灰描边
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20,20,20,0.8)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // 外发光 - 统一黑白
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 6 + eased * 8;

    ctx.restore();
  }

  let isVisible = true;
  new IntersectionObserver(function(e) { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  function render(ts) {
    if (!isVisible) { requestAnimationFrame(render); return; }
    update(ts);
    let cw = canvas.width / (window.devicePixelRatio || 1);
    let ch = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < thumbs.length; i++) {
      drawThumb(thumbs[i], i);
    }
    requestAnimationFrame(render);
  }

  function getThumbAt(mx, my) {
    for (let i = 0; i < thumbs.length; i++) {
      let t = thumbs[i];
      let r = t.dispW / 2;
      let dx = mx - t.x, dy = my - t.y;
      if (dx * dx + dy * dy <= r * r * 1.44) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener('mousedown', function(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let idx = getThumbAt(mx, my);
    if (idx !== -1) {
      draggedIdx = idx;
      let t = thumbs[idx];
      dragOffX = t.x - mx;
      dragOffY = t.y - my;
      dragStartX = mx;
      dragStartY = my;
      prevMouseX = mx;
      prevMouseY = my;
      t.vx = 0; t.vy = 0;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  // Canvas mousemove: hover only (drag handled globally)
  canvas.addEventListener('mousemove', function(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    mouseCanvasX = mx;
    mouseCanvasY = my;
    if (draggedIdx < 0) {
      canvas.style.cursor = getThumbAt(mx, my) >= 0 ? 'grab' : '';
      handleAudioHover(getThumbAt(mx, my));
    }
  });

  canvas.addEventListener('mouseleave', function() {
    // Don't interrupt drag when mouse leaves canvas
    if (draggedIdx >= 0) return;
    hoveredIdx = -1;
    handleAudioHover(-1);
    canvas.style.cursor = '';
  });

  // Global mouseup/mousemove so drag survives leaving canvas
  window.addEventListener('mousemove', function(e) {
    if (draggedIdx < 0) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    mouseCanvasX = mx;
    mouseCanvasY = my;
    let t = thumbs[draggedIdx];
    t.x = mx + dragOffX;
    t.y = my + dragOffY;
    // Rope constraint on drag — can't pull beyond rope length
    let rdx = t.x - t.anchorX;
    let rdy = t.y - t.anchorY;
    let rdist = Math.sqrt(rdx * rdx + rdy * rdy);
    let ropeLen = t.restY - t.anchorY + t.dispH * 0.5;
    if (rdist > ropeLen && rdist > 0.01) {
      let rnx = rdx / rdist;
      let rny = rdy / rdist;
      t.x = t.anchorX + rnx * ropeLen;
      t.y = t.anchorY + rny * ropeLen;
    }
    // If dragging a latched disc far enough, unlatch it
    if (latchedIdx === draggedIdx) {
      let heroRect3 = document.getElementById('home').getBoundingClientRect();
      let cRect3 = canvas.getBoundingClientRect();
      let latchCY = navBottomPx - canvasOffY;
      let pullDist = Math.sqrt(Math.pow(t.x - t.anchorX, 2) + Math.pow(t.y - latchCY, 2));
      if (pullDist > t.dispW * 0.6) {
        latchedIdx = -1;
        document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
        if (window.__navWaveStop) window.__navWaveStop(draggedIdx);
      } else {
        t.x = t.anchorX; t.y = latchCY;
      }
    } else {
      // Snap magnetism
      let latchSY2 = navBottomPx - canvasOffY;
      let discSX = t.x;
      let discSY = t.y;
      let latchSX = t.anchorX;
      let snapDx = discSX - latchSX;
      let snapDy = discSY - latchSY2;
      let snapDist = Math.sqrt(snapDx * snapDx + snapDy * snapDy);
      let snapZone = t.dispW * 0.3;
      if (snapDist < snapZone && snapDist > 3) {
        let pull = (snapZone - snapDist) / snapZone;
        pull = pull * pull * pull * 0.06;
        t.x -= (snapDx / snapDist) * snapDist * pull;
        t.y -= (snapDy / snapDist) * snapDist * pull;
      }
    }
    t.vx = (mx - prevMouseX) * 0.28;
    t.vy = (my - prevMouseY) * 0.28;
    prevMouseX = mx;
    prevMouseY = my;
  });

  window.addEventListener('mouseup', function(e) {
    if (draggedIdx < 0) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let dist = Math.sqrt(Math.pow(mx - dragStartX, 2) + Math.pow(my - dragStartY, 2));
    if (dist < 3) {
      // Short click: unlatch or open work detail
      if (latchedIdx === draggedIdx) {
        let tl = thumbs[latchedIdx];
        tl.vy = -8;
        tl.vx = (Math.random() - 0.5) * 3;
        tl.entering = false;
        latchedIdx = -1;
        document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
        if (window.__navWaveStop) window.__navWaveStop(draggedIdx);
      } else {
        let works = document.querySelectorAll('.work-card');
        if (works[draggedIdx]) {
          let card = works[draggedIdx];
          let key = card.dataset.work;
          let hero = card.dataset.hero;
          if (key && workData && workData[key]) {
            let data = Object.assign({ slug: key }, workData[key]);
            openDetail(data, hero);
          }
        }
      }
    } else {
      // Drag release: check if near latch clip
      let t = thumbs[draggedIdx];
      let canvasRect = canvas.getBoundingClientRect();
      let latchCY = navBottomPx - canvasOffY;
      let discCX = t.x;
      let discCY = t.y;
      let latchCX = t.anchorX;
      let dx2 = discCX - latchCX;
      let dy2 = discCY - latchCY;
      let latchDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      let latchThreshold = t.dispW * 0.45;
      if (latchDist < latchThreshold) {
        if (latchedIdx >= 0 && latchedIdx !== draggedIdx) {
          let ejected = thumbs[latchedIdx];
          ejected.vy = -6;
          ejected.vx = (Math.random() - 0.5) * 2;
          ejected.entering = false;
        }
        latchedIdx = draggedIdx;
        t.x = t.anchorX;
        t.y = navBottomPx - canvasOffY;
        t.vx = 0; t.vy = 0;
        document.querySelectorAll('.latch-clip').forEach(function(c, ci){
          c.classList.toggle('latched', ci === latchedIdx);
        });
        if (window.__navWaveForcePlay) window.__navWaveForcePlay(draggedIdx);
      }
    }
    draggedIdx = -1;
    hoveredIdx = -1;
    canvas.style.cursor = '';
  });

  canvas.addEventListener('touchstart', function(e) {}, { passive: true });
  canvas.addEventListener('touchmove', function(e) {}, { passive: true });
  canvas.addEventListener('touchend', function(e) {}, { passive: true });

  resize();
  requestAnimationFrame(render);
  window.addEventListener('resize', function() { resize(); });

})();
