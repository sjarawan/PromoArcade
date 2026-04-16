/* ============================================================
   PromoArcade FX — shared sound + effects library for mini-games
   - Procedural Web Audio (no asset files)
   - Auto-injects a floating mute button
   - Particle bursts, screen shake, score popups, screen flash
   Usage:  <script src="fx.js"></script>
           PAfx.play('score');
           PAfx.burst(x, y, '#FFC107');
           PAfx.shake(400);
           PAfx.popup(x, y, '+1', '#fff');
   ============================================================ */
(function (global) {
  const PAfx = {};
  let ctx = null;
  let muted = false;
  let masterGain = null;
  let musicNodes = null;
  let musicOn = false;

  try { muted = localStorage.getItem('pafx-muted') === '1'; } catch (e) {}

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.6;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  // Generic tone helper
  function tone(freq, dur, type, vol, attack, slideTo) {
    if (!ensureCtx() || muted) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.25, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Short white-noise burst (for thuds, whooshes, crashes)
  function noise(dur, vol, filterFreq, q) {
    if (!ensureCtx() || muted) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = now();
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = filterFreq || 1200;
    bp.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.value = vol || 0.35;
    src.connect(bp); bp.connect(g); g.connect(masterGain);
    src.start(t); src.stop(t + dur);
  }

  // ===== Sound bank =====
  const sounds = {
    click:    () => tone(880, 0.08, 'square', 0.15),
    start:    () => { tone(523, 0.12, 'square', 0.2); setTimeout(() => tone(784, 0.18, 'square', 0.2), 100); setTimeout(() => tone(1047, 0.22, 'square', 0.22), 220); },
    score:    () => { tone(880, 0.08, 'square', 0.18); setTimeout(() => tone(1320, 0.12, 'square', 0.2), 60); },
    coin:     () => { tone(1568, 0.06, 'square', 0.2); setTimeout(() => tone(2093, 0.18, 'square', 0.22), 50); },
    combo:    (n) => { const base = 660 + Math.min(12, n || 0) * 80; tone(base, 0.06, 'square', 0.2); setTimeout(() => tone(base * 1.5, 0.1, 'square', 0.22), 50); },
    miss:     () => tone(220, 0.22, 'sawtooth', 0.2, 0.01, 90),
    bad:      () => { tone(180, 0.15, 'square', 0.25, 0.005, 80); noise(0.2, 0.2, 400, 1); },
    hit:      () => { tone(440, 0.05, 'square', 0.2, 0.005, 880); },
    pop:      () => tone(660, 0.1, 'sine', 0.25, 0.005, 1320),
    bounce:   () => tone(520, 0.1, 'sine', 0.22, 0.005, 780),
    whoosh:   () => noise(0.2, 0.25, 800, 0.5),
    thud:     () => noise(0.18, 0.4, 140, 3),
    clang:    () => { tone(1200, 0.15, 'square', 0.2, 0.005, 600); noise(0.12, 0.2, 2500, 2); },
    powerup:  () => { tone(440, 0.08, 'square', 0.2); setTimeout(() => tone(660, 0.08, 'square', 0.2), 70); setTimeout(() => tone(880, 0.12, 'square', 0.22), 140); setTimeout(() => tone(1320, 0.2, 'square', 0.24), 210); },
    gameover: () => { tone(523, 0.2, 'square', 0.22, 0.005, 330); setTimeout(() => tone(330, 0.2, 'square', 0.22, 0.005, 220), 180); setTimeout(() => tone(196, 0.35, 'square', 0.22, 0.005, 120), 360); },
    win:      () => { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'square', 0.24), i * 100)); },
    tick:     () => tone(1760, 0.04, 'square', 0.12),
    charge:   () => tone(300, 0.3, 'sawtooth', 0.18, 0.02, 900),
    release:  () => { tone(900, 0.08, 'square', 0.22, 0.005, 1600); noise(0.15, 0.2, 1500, 1); },
    splat:    () => { noise(0.2, 0.35, 300, 2); tone(160, 0.18, 'sawtooth', 0.22, 0.005, 60); },
    fire:     () => { noise(0.25, 0.4, 900, 1.5); tone(180, 0.3, 'sawtooth', 0.2, 0.005, 80); },
    level:    () => { tone(784, 0.1, 'square', 0.22); setTimeout(() => tone(1047, 0.1, 'square', 0.22), 80); setTimeout(() => tone(1568, 0.2, 'square', 0.26), 160); },
  };

  PAfx.play = function (name) {
    const fn = sounds[name];
    if (fn) try { fn(); } catch (e) {}
  };

  // Allow games to register custom sounds
  PAfx.register = function (name, fn) { sounds[name] = fn; };
  PAfx.tone = tone;
  PAfx.noise = noise;

  // ===== Background music (simple arpeggio loop) =====
  PAfx.music = {
    start: function (scale, bpm, wave) {
      if (musicOn) return;
      if (!ensureCtx()) return;
      musicOn = true;
      scale = scale || [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63];
      bpm = bpm || 180;
      wave = wave || 'triangle';
      const interval = 60000 / bpm / 2;
      let i = 0;
      const g = ctx.createGain();
      g.gain.value = 0.06;
      g.connect(masterGain);
      musicNodes = { g, timer: null };
      musicNodes.timer = setInterval(() => {
        if (muted || !musicOn) return;
        const t = now();
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(scale[i % scale.length], t);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.7, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.connect(env); env.connect(g);
        osc.start(t); osc.stop(t + 0.3);
        i++;
      }, interval);
    },
    stop: function () {
      musicOn = false;
      if (musicNodes) {
        clearInterval(musicNodes.timer);
        try { musicNodes.g.disconnect(); } catch (e) {}
        musicNodes = null;
      }
    }
  };

  // ===== Mute control =====
  PAfx.setMuted = function (m) {
    muted = !!m;
    try { localStorage.setItem('pafx-muted', muted ? '1' : '0'); } catch (e) {}
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.6;
    updateMuteBtn();
  };
  PAfx.isMuted = function () { return muted; };
  PAfx.toggleMute = function () { PAfx.setMuted(!muted); };

  function updateMuteBtn() {
    const b = document.getElementById('pafx-mute');
    if (b) b.textContent = muted ? '🔇' : '🔊';
  }

  // ===== Visual effects =====
  function ensureFxLayer() {
    let layer = document.getElementById('pafx-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'pafx-layer';
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;';
      document.body.appendChild(layer);
    }
    return layer;
  }

  PAfx.burst = function (x, y, color, count) {
    const layer = ensureFxLayer();
    count = count || 10;
    color = color || '#FFD93D';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = 6 + Math.random() * 6;
      p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};border-radius:50%;pointer-events:none;will-change:transform,opacity;box-shadow:0 0 8px ${color};`;
      layer.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      const dx = Math.cos(ang) * spd;
      const dy = Math.sin(ang) * spd - 30;
      const rot = (Math.random() - 0.5) * 360;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy + 120}px) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.6,.4,1)' })
      .onfinish = () => p.remove();
    }
  };

  PAfx.popup = function (x, y, text, color) {
    const layer = ensureFxLayer();
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);color:${color || '#fff'};font-weight:800;font-size:26px;text-shadow:0 2px 8px rgba(0,0,0,.5),0 0 12px rgba(255,255,255,.3);pointer-events:none;will-change:transform,opacity;white-space:nowrap;`;
    layer.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%,-130%) scale(1.2)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-50%,-220%) scale(1)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' }).onfinish = () => el.remove();
  };

  PAfx.shake = function (ms, intensity) {
    const body = document.body;
    ms = ms || 300;
    intensity = intensity || 6;
    const end = performance.now() + ms;
    function step() {
      const left = end - performance.now();
      if (left <= 0) { body.style.transform = ''; return; }
      const amp = intensity * (left / ms);
      const x = (Math.random() * 2 - 1) * amp;
      const y = (Math.random() * 2 - 1) * amp;
      body.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(step);
    }
    step();
  };

  PAfx.flash = function (color, ms) {
    const layer = ensureFxLayer();
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;inset:0;background:${color || '#fff'};opacity:.5;pointer-events:none;`;
    layer.appendChild(el);
    el.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: ms || 220, easing: 'ease-out' })
      .onfinish = () => el.remove();
  };

  // ===== Mute button auto-injection =====
  function injectMuteButton() {
    if (document.getElementById('pafx-mute')) return;
    const b = document.createElement('button');
    b.id = 'pafx-mute';
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle sound');
    b.textContent = muted ? '🔇' : '🔊';
    b.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer;backdrop-filter:blur(6px);box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;padding:0;';
    b.addEventListener('click', (e) => { e.stopPropagation(); PAfx.toggleMute(); });
    document.body.appendChild(b);
  }

  // Unlock audio on first user interaction (iOS/Safari)
  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev =>
    window.addEventListener(ev, unlock, { once: false, passive: true })
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMuteButton);
  } else {
    injectMuteButton();
  }

  global.PAfx = PAfx;
})(window);
