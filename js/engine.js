/* =====================================================================
   ENGINE — mini motor de jogo do convite
   tweens · loop · partículas · tremor · banners · sons 8-bit · música
   sprites procedurais · pontuação e conquistas
   Tudo exposto em window.E
   ===================================================================== */
(function () {
  const E = window.E = {};
  const calm = E.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- matemática ---------------- */
  E.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.rand = (a, b) => a + Math.random() * (b - a);
  E.irand = (a, b) => Math.floor(E.rand(a, b + 1));
  E.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  E.shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  E.wait = ms => new Promise(r => setTimeout(r, ms));
  E.vibe = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };

  E.ease = {
    linear: t => t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inOutQuad: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inCubic: t => t * t * t,
    outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
    outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
  };

  /* tween de números num objeto qualquer */
  E.tween = (obj, to, { dur = 400, ease = 'outCubic', delay = 0, onUpdate } = {}) => new Promise(res => {
    const from = {}; for (const k in to) from[k] = obj[k];
    const fn = typeof ease === 'function' ? ease : E.ease[ease];
    const t0 = performance.now() + delay;
    const step = now => {
      const t = E.clamp((now - t0) / dur, 0, 1);
      if (now >= t0) { for (const k in to) obj[k] = E.lerp(from[k], to[k], fn(t)); onUpdate && onUpdate(obj, t); }
      if (t < 1) requestAnimationFrame(step); else res(obj);
    };
    requestAnimationFrame(step);
  });

  /* animação de elemento (Web Animations API) que devolve promise */
  E.anim = (el, frames, opts = {}) => {
    if (!el || !el.animate) return Promise.resolve();
    const a = el.animate(frames, { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none', ...opts });
    return a.finished.catch(() => {});
  };
  E.pop = el => E.anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 380 });
  E.squash = el => E.anim(el, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.15,.85)' }, { transform: 'scale(.92,1.08)' }, { transform: 'scale(1,1)' }], { duration: 420 });
  E.wobble = el => E.anim(el, [{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 480 });

  /* loop de jogo com delta-time; devolve função para parar */
  E.loop = fn => {
    let raf, last = performance.now(), on = true;
    const step = now => { if (!on) return; const dt = Math.min(.05, (now - last) / 1000); last = now; fn(dt, now / 1000); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => { on = false; cancelAnimationFrame(raf); };
  };

  /* canvas HiDPI dentro de um elemento */
  E.canvas = (parent, w, h) => {
    const cv = document.createElement('canvas');
    const dpr = Math.min(2.5, devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.style.display = 'block'; cv.style.maxWidth = '100%'; cv.style.touchAction = 'none';
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    parent.appendChild(cv);
    return { cv, ctx, w, h, dpr };
  };

  /* cores do tema atual (lidas do CSS) */
  E.theme = () => {
    const cs = getComputedStyle(document.body), v = n => cs.getPropertyValue(n).trim();
    return {
      spicy: document.body.classList.contains('spicy'),
      ink: v('--ink'), bg: v('--bg'), card1: v('--card1'), card2: v('--card2'), card3: v('--card3'),
      gold: v('--gold'), gold2: v('--gold2'), golddim: v('--golddim'), ember: v('--ember'), bone: v('--bone'), dim: v('--dim')
    };
  };

  /* ===================================================================
     FX — camada de partículas por cima de tudo
     =================================================================== */
  const FX = E.fx = (() => {
    let cv, x, W = 0, H = 0, parts = [], texts = [], rafOn = false;
    function setup() {
      cv = document.createElement('canvas'); cv.id = 'fx'; cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { position: 'fixed', inset: '0', zIndex: 26, pointerEvents: 'none' });
      document.body.appendChild(cv); x = cv.getContext('2d'); size(); addEventListener('resize', size);
    }
    function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; x.setTransform(d, 0, 0, d, 0, 0); }
    function shape(p) {
      const r = p.r;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      x.fillStyle = p.c;
      switch (p.sh) {
        case 'star': x.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .42 : r, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); break;
        case 'heart': x.beginPath(); x.moveTo(0, r * .9); x.bezierCurveTo(-r * 1.6, -r * .2, -r * .6, -r * 1.4, 0, -r * .45); x.bezierCurveTo(r * .6, -r * 1.4, r * 1.6, -r * .2, 0, r * .9); x.fill(); break;
        case 'confetti': x.fillRect(-r, -r * .45, r * 2, r * .9); break;
        case 'coin': x.scale(Math.abs(Math.cos(p.t * 9)) + .15, 1); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = r * .25; x.stroke(); break;
        case 'spark': x.strokeStyle = p.c; x.lineWidth = Math.max(1, r * .4); x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 2, 0); x.lineTo(r * 2, 0); x.stroke(); break;
        case 'smoke': x.globalAlpha *= .35; x.beginPath(); x.arc(0, 0, r * (2.2 - p.life), 0, 6.283); x.fill(); break;
        case 'emoji': x.font = `${r * 3}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.e, 0, 0); break;
        default: x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
      }
      x.restore();
    }
    function frame(now) {
      if (!parts.length && !texts.length) { rafOn = false; x.clearRect(0, 0, W, H); return; }
      const dt = 1 / 60; x.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.t += dt; p.life -= p.decay * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        shape(p);
      }
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]; t.t += dt; const k = t.t / t.dur;
        if (k >= 1) { texts.splice(i, 1); continue; }
        const sc = k < .18 ? E.ease.outBack(k / .18) : 1;
        x.save(); x.translate(t.x, t.y - E.ease.outCubic(k) * t.rise); x.scale(sc, sc); x.globalAlpha = k > .7 ? 1 - (k - .7) / .3 : 1;
        x.font = t.font; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineJoin = 'round'; x.strokeText(t.s, 0, 0);
        x.fillStyle = t.c; x.fillText(t.s, 0, 0); x.restore();
      }
      requestAnimationFrame(frame);
    }
    function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(frame); } }
    function burst(px, py, o = {}) {
      if (!cv) return;
      const th = E.theme();
      let n = o.n ?? 60; if (calm) n = Math.min(n, 12);
      const cols = o.colors || (th.spicy ? [th.gold2, th.ember, th.gold, '#FF8FA3'] : [th.gold2, th.gold, th.ember, th.bone]);
      const shapes = o.shapes || (th.spicy ? ['heart', 'circle', 'star'] : ['star', 'circle', 'spark']);
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + E.rand(-(o.spread ?? .6), o.spread ?? .6) : Math.random() * 6.283;
        const v = E.rand(o.speed?.[0] ?? 80, o.speed?.[1] ?? 380);
        parts.push({
          x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.lift ?? 80), g: o.gravity ?? 420, drag: o.drag ?? .985,
          r: E.rand(o.size?.[0] ?? 1.6, o.size?.[1] ?? 4.2), rot: Math.random() * 6, vr: E.rand(-8, 8), t: 0,
          life: 1, decay: E.rand(o.decay?.[0] ?? .5, o.decay?.[1] ?? 1), c: E.pick(cols), sh: E.pick(shapes), e: o.emoji ? E.pick(o.emoji) : null
        });
        if (o.emoji) parts[parts.length - 1].sh = 'emoji';
      }
      kick();
    }
    function at(el, o) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, o); }
    function confetti(o = {}) { const th = E.theme(); for (let k = 0; k < 2; k++) burst(k ? W + 10 : -10, H * .55, { n: 70, angle: k ? -2.3 : -.85, spread: .5, speed: [450, 900], gravity: 600, lift: 0, shapes: ['confetti', 'confetti', th.spicy ? 'heart' : 'star'], size: [3, 6], decay: [.3, .55], ...o }); }
    function text(px, py, s, o = {}) {
      if (!cv) return; const th = E.theme();
      texts.push({ x: px, y: py, s, c: o.color || th.gold2, font: o.font || `400 ${o.size || 26}px "Pixelify Sans", "IM Fell English SC", monospace`, t: 0, dur: o.dur || 1.1, rise: o.rise ?? 60 });
      kick();
    }
    function textAt(el, s, o) { if (!el) return; const r = el.getBoundingClientRect(); text(r.left + r.width / 2, r.top + r.height / 2, s, o); }
    function steam(px, py, n = 1) { const th = E.theme(); for (let i = 0; i < n; i++) parts.push({ x: px + E.rand(-14, 14), y: py, vx: E.rand(-8, 8), vy: E.rand(-60, -30), g: -10, drag: .99, r: E.rand(5, 9), rot: 0, vr: 0, t: 0, life: 1, decay: .7, c: th.bone, sh: 'smoke' }); kick(); }
    return { setup, burst, at, confetti, text, textAt, steam };
  })();

  /* tremor de tela (aplica no elemento #shake) */
  let shakeAmt = 0, shakeOn = false;
  E.shake = (amt = 8) => {
    if (calm) return; shakeAmt = Math.max(shakeAmt, amt);
    if (shakeOn) return; shakeOn = true;
    const el = document.getElementById('shake');
    const step = () => {
      shakeAmt *= .86;
      if (el) el.style.transform = shakeAmt > .3 ? `translate(${E.rand(-1, 1) * shakeAmt}px,${E.rand(-1, 1) * shakeAmt}px) rotate(${E.rand(-1, 1) * shakeAmt * .08}deg)` : '';
      if (shakeAmt > .3) requestAnimationFrame(step); else { shakeOn = false; if (el) el.style.transform = ''; }
    };
    requestAnimationFrame(step);
  };

  /* clarão de cor na tela inteira */
  E.flash = (color, ms = 650) => {
    const f = document.createElement('div');
    Object.assign(f.style, { position: 'fixed', inset: 0, zIndex: 24, pointerEvents: 'none', background: color || 'radial-gradient(circle at 50% 45%, #FFF3D6, rgba(240,215,154,.5) 30%, transparent 70%)' });
    document.body.appendChild(f);
    E.anim(f, [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' }).then(() => f.remove());
  };

  /* banner gigante estilo arcade: "PLAYER 2", "PERFEITO!", "COMBO x3" */
  E.banner = (big, small = '', o = {}) => new Promise(res => {
    const b = document.createElement('div'); b.className = 'banner' + (o.cls ? ' ' + o.cls : '');
    b.innerHTML = `<b>${big}</b>${small ? `<span>${small}</span>` : ''}`;
    document.body.appendChild(b);
    E.shake(o.shake ?? 10);
    E.anim(b, [
      { opacity: 0, transform: 'translate(-50%,-50%) scale(2.6) rotate(-8deg)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(.92) rotate(-3deg)', offset: .14 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(-3deg)', offset: .22 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1.04) rotate(-3deg)', offset: .8 },
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.6) rotate(4deg)' }
    ], { duration: o.dur || 1500, easing: 'ease-out' }).then(() => { b.remove(); res(); });
  });

  /* ===================================================================
     ÁUDIO — sons 8-bit sintetizados + música (mp3 em loop, fallback sintetizado)
     =================================================================== */
  const A = E.audio = (() => {
    let ctx, master, sfx, musicBus, wet, noiseBuf;
    let muted = (() => { try { return localStorage.getItem('cafe_som') === '0'; } catch (_) { return false; } })();
    function init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = .55; sfx.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = .85; musicBus.connect(master);
      const d = ctx.createDelay(1); d.delayTime.value = .33; const fb = ctx.createGain(); fb.gain.value = .32;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      wet = ctx.createGain(); wet.gain.value = .4; wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      return ctx;
    }
    /* oscilador com envelope e slide de frequência — o "sfxr" do pobre */
    function blip({ f = 440, f1 = null, t = 0, dur = .12, type = 'square', vol = .12, a = .004, send = .15, slide = 'exp', dest = null, vib = 0 } = {}) {
      const now = ctx.currentTime + t, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, now);
      if (f1) slide === 'lin' ? o.frequency.linearRampToValueAtTime(f1, now + dur) : o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
      if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 7; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(now); l.stop(now + dur + .1); }
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + a); g.gain.exponentialRampToValueAtTime(.0001, now + dur);
      o.connect(g); g.connect(dest || sfx);
      if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(wet); }
      o.start(now); o.stop(now + dur + .05);
    }
    function noise({ t = 0, dur = .2, f0 = 2000, f1 = 600, vol = .2, q = 1, type = 'bandpass', dest = null } = {}) {
      const now = ctx.currentTime + t, s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, now); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), now + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.0001, now + dur);
      s.connect(f); f.connect(g); g.connect(dest || sfx); s.start(now, Math.random()); s.stop(now + dur + .05);
    }
    const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.51, G6: 1567.98 };
    const LIB = {
      select: () => { blip({ f: 659.25, type: 'sine', dur: .5, vol: .1, send: .35 }); blip({ f: 987.77, t: .06, type: 'sine', dur: .6, vol: .08, send: .35 }); },
      tick: up => blip({ f: up ? 1174.66 : 587.33, type: 'triangle', dur: .18, vol: .09 }),
      tap: () => blip({ f: 880, f1: 1320, type: 'square', dur: .05, vol: .05, send: 0 }),
      coin: () => { blip({ f: N.B5, dur: .07, vol: .07, send: .1 }); blip({ f: N.E6, t: .07, dur: .32, vol: .07, send: .2 }); },
      jump: () => blip({ f: 260, f1: 720, dur: .16, vol: .08 }),
      pop: () => blip({ f: 900, f1: 260, type: 'sine', dur: .12, vol: .14, send: .05 }),
      boing: () => blip({ f: 520, f1: 180, type: 'sine', dur: .45, vol: .14, vib: 40, send: 0 }),
      buzz: () => { blip({ f: 150, type: 'square', dur: .28, vol: .08, send: 0 }); blip({ f: 142, type: 'sawtooth', dur: .28, vol: .05, send: 0 }); },
      hit: () => { blip({ f: 300, f1: 70, dur: .2, vol: .1, send: 0 }); noise({ dur: .12, f0: 1200, f1: 300, vol: .15 }); },
      power: () => [0, 1, 2, 3, 4, 5].forEach(i => blip({ f: 330 * Math.pow(1.26, i), t: i * .045, dur: .12, vol: .06 })),
      combo: n => { const f = 523.25 * Math.pow(1.122, Math.min(n, 14)); blip({ f, dur: .09, vol: .07 }); blip({ f: f * 1.5, t: .05, dur: .16, vol: .06, send: .2 }); },
      win: () => [[N.C5, N.E5, N.G5], [N.D5, N.G5, N.B5], [N.E5, N.A5, N.C6, N.E6]].forEach((ch, i) => ch.forEach(f => blip({ f, t: i * .14, dur: i === 2 ? .9 : .16, vol: .045, type: i === 2 ? 'triangle' : 'square', send: .3 }))),
      lose: () => [392, 349.23, 311.13, 233.08].forEach((f, i) => blip({ f, t: i * .16, dur: .22, type: 'triangle', vol: .1, send: 0 })),
      whoosh: () => { noise({ dur: .55, f0: 300, f1: 5000, vol: .22, q: .6 }); },
      flip: () => noise({ dur: .22, f0: 2600, f1: 500, vol: .16, q: .8 }),
      swipe: () => noise({ dur: .18, f0: 900, f1: 4000, vol: .14, q: .7 }),
      dice: () => noise({ dur: .045, f0: 3200, f1: 1800, vol: .25, q: 5 }),
      scratch: () => noise({ dur: .06, f0: 5000, f1: 3000, vol: .05, q: 2 }),
      sizzle: n => { noise({ dur: .2 + n * .1, f0: 2500 + n * 700, f1: 7000, vol: .05 + n * .025, q: .5 }); blip({ f: 260 + n * 110, type: 'triangle', dur: .3, vol: .05 }); },
      heart: () => [N.E5, N.G5, N.C6].forEach((f, i) => blip({ f, t: i * .07, type: 'sine', dur: .5, vol: .08, send: .5 })),
      kiss: () => { blip({ f: 1400, f1: 500, type: 'sine', dur: .09, vol: .14, send: .1 }); noise({ t: .02, dur: .05, f0: 3000, f1: 1500, vol: .12, q: 3 }); },
      sexy: () => { [220, 261.63, 329.63, 392, 493.88].forEach((f, i) => blip({ f, t: i * .07, type: 'triangle', dur: 1.8, vol: .05, send: .7 })); },
      ignite: () => { [293.66, 440, 587.33, 739.99, 880, 1174.66].forEach((f, i) => blip({ f, t: i * .06, type: 'sine', dur: 2.4, vol: .07, send: .7 })); noise({ dur: 1.2, f0: 200, f1: 8000, vol: .2, q: .4 }); blip({ f: 55, type: 'sine', dur: 1.3, vol: .3, send: 0 }); },
      crit: n => { const seq = n === 1 ? [392, 349.23, 311.13, 261.63] : n >= 15 ? [587.33, 739.99, 880, 1174.66, 1479.98] : [587.33, 698.46, 880]; seq.forEach((f, i) => blip({ f, t: i * .1, type: n === 1 ? 'triangle' : 'square', dur: .3, vol: .07, send: .4 })); },
      level: () => { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => blip({ f: 392 * Math.pow(2, s / 12), t: i * .05, dur: .14, vol: .05 })); },
      note: i => blip({ f: [N.D5, N.E5, N.G5, N.A5, N.B5, 1174.66, N.E6, N.G6][i % 8], type: 'sine', dur: 1.2, vol: .11, send: .6 }),
      error: () => { blip({ f: 220, type: 'triangle', dur: .2, vol: .1, send: 0 }); blip({ f: 196, t: .1, type: 'triangle', dur: .25, vol: .1, send: 0 }); }
    };
    function play(name, ...a) { if (!ctx || muted || !LIB[name]) return; try { LIB[name](...a); } catch (_) {} }

    /* sons contínuos (servir café, riser do sol) */
    const loops = {};
    function loopStart(name) {
      if (!ctx || muted || loops[name]) return;
      if (name === 'pour') {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2.5;
        const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(sfx); s.start(); g.gain.setTargetAtTime(.22, ctx.currentTime, .05);
        loops[name] = { s, g, f };
      } else if (name === 'riser') {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = ctx.createGain(); g.gain.value = 0; o.connect(f); f.connect(g); g.connect(sfx); o.start();
        loops[name] = { s: o, g, f };
      }
    }
    function loopSet(name, k) { const l = loops[name]; if (!l) return; const now = ctx.currentTime;
      if (name === 'riser') { l.s.frequency.setTargetAtTime(70 + k * 330, now, .05); l.g.gain.setTargetAtTime(k > .01 ? .02 + k * .06 : 0, now, .08); }
      if (name === 'pour') l.f.frequency.setTargetAtTime(700 + k * 900, now, .1);
    }
    function loopStop(name) { const l = loops[name]; if (!l) return; l.g.gain.setTargetAtTime(0, ctx.currentTime, .05); const s = l.s; setTimeout(() => { try { s.stop(); } catch (_) {} }, 350); delete loops[name]; }

    function setMuted(m) {
      muted = m; try { localStorage.setItem('cafe_som', m ? '0' : '1'); } catch (_) {}
      if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, .1);
      if (m) Object.keys(loops).forEach(loopStop);
      Music.onMute(m);
    }
    return {
      init, play, loopStart, loopSet, loopStop, blip, noise,
      get ctx() { return ctx; }, get musicBus() { return musicBus; }, get wet() { return wet; },
      get muted() { return muted; }, setMuted, toggle() { setMuted(!muted); return !muted; }
    };
  })();
  E.sfx = (name, ...a) => A.play(name, ...a);

  /* ---------------- MÚSICA ---------------- */
  const Music = E.music = (() => {
    const els = {}, gains = {}, failed = {};
    let cur = null, target = 0, synth = null, routed = {};
    const src = flow => (window.CAFE && window.CAFE.MUSICA && window.CAFE.MUSICA[flow]) || '';
    function el(flow) {
      if (els[flow]) return els[flow];
      const a = new Audio(); a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline', '');
      a.src = src(flow) || ''; if (!a.src || !src(flow)) failed[flow] = true;
      a.addEventListener('error', () => { failed[flow] = true; if (cur === flow && target > 0) Synth.start(flow); });
      els[flow] = a;
      const ctx = A.ctx;
      if (ctx) {
        try { const s = ctx.createMediaElementSource(a); const g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(A.musicBus); gains[flow] = g; routed[flow] = true; }
        catch (_) { a.volume = 0; }
      } else a.volume = 0;
      return a;
    }
    function fade(flow, to, sec) {
      const g = gains[flow], a = els[flow]; if (!a) return;
      if (g) g.gain.setTargetAtTime(to, A.ctx.currentTime, sec / 3);
      else { const from = a.volume; E.tween({ v: from }, { v: to }, { dur: sec * 1000, onUpdate: o => { a.volume = E.clamp(o.v, 0, 1); } }); }
    }
    /* chamar dentro de um toque: libera os áudios no iOS */
    function prime() {
      A.init();
      ['mono', 'spicy'].forEach(f => { const a = el(f); if (failed[f]) return; const p = a.play(); if (p && p.then) p.then(() => { if (cur !== f) a.pause(); }).catch(() => {}); });
    }
    function play(flow, level = 1) {
      A.init(); target = level;
      if (cur && cur !== flow) { const old = cur; fade(old, 0, 1.2); Synth.stop(old); setTimeout(() => { if (cur !== old) els[old] && els[old].pause(); }, 1600); }
      cur = flow;
      if (failed[flow]) { Synth.start(flow); return; }
      const a = el(flow); const p = a.play(); if (p && p.catch) p.catch(() => { failed[flow] = true; Synth.start(flow); });
      fade(flow, A.muted ? 0 : level, 1.4);
    }
    function level(l) { target = l; if (cur && !failed[cur]) fade(cur, A.muted ? 0 : l, .8); Synth.level(l); }
    function stop(ms = 2500) { if (!cur) return; const c = cur; fade(c, 0, ms / 1000); Synth.fadeOut(ms); setTimeout(() => { els[c] && els[c].pause(); }, ms + 200); cur = null; }
    function onMute(m) { if (cur && !failed[cur] && !gains[cur] && els[cur]) els[cur].muted = m; }
    document.addEventListener('visibilitychange', () => {
      if (!cur) return;
      if (document.hidden) { els[cur] && els[cur].pause(); A.ctx && A.ctx.suspend && A.ctx.suspend(); }
      else { A.ctx && A.ctx.resume && A.ctx.resume(); if (!failed[cur] && els[cur]) els[cur].play().catch(() => {}); }
    });
    return { prime, play, stop, level, onMute, get current() { return cur; }, get usingFallback() { return cur ? !!failed[cur] : false; } };
  })();

  /* música sintetizada de reserva (toca se o mp3 não existir ou falhar) */
  const Synth = (() => {
    let timer = null, mood = null, gain = null, bar = 0;
    const CH = [[146.83, 220, 261.63, 329.63], [116.54, 174.61, 233.08, 293.66], [174.61, 220, 261.63, 349.23], [130.81, 196, 246.94, 329.63]];
    const PENTA = [587.33, 659.25, 698.46, 880, 987.77, 1174.66, 1318.51];
    const SCH = [{ b: 110, n: [196, 246.94, 261.63, 329.63] }, { b: 87.31, n: [164.81, 196, 220, 261.63] }, { b: 73.42, n: [174.61, 220, 261.63, 329.63] }, { b: 82.41, n: [146.83, 207.65, 293.66, 392] }];
    const SLEAD = [440, 523.25, 587.33, 659.25, 783.99, 880];
    function pad(ctx, freqs, t, dur) {
      freqs.forEach(f => [-7, 7].forEach(det => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; const g = ctx.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.02, t + 2.2); g.gain.setValueAtTime(.02, t + dur - 2); g.gain.linearRampToValueAtTime(0, t + dur + .6);
        o.connect(lp); lp.connect(g); g.connect(gain); o.start(t); o.stop(t + dur + .7);
      }));
    }
    function kick(ctx, t, v = .5) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .16); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(g); g.connect(gain); o.start(t); o.stop(t + .4); }
    function tone(ctx, f, t, dur, type, vol, send) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(gain); if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(A.wet); } o.start(t); o.stop(t + dur + .05); }
    function barMono(ctx, t) {
      const c = CH[bar % 4], root = c[0] / 2; pad(ctx, c, t, 7.5);
      [0, 1.75, 2.625, 3.5, 5.25, 6.125].forEach((o, k) => tone(ctx, k % 2 ? root * 1.5 : root, t + o, .9, 'triangle', .08, 0));
      for (let k = 0; k < 4; k++) if (Math.random() < .7) tone(ctx, E.pick(PENTA), t + k * 1.75 + Math.random() * .4, 2.4, 'sine', .04, .7);
      return 7;
    }
    function barSpicy(ctx, t) {
      const B = 3.4, bt = B / 4, c = SCH[bar % 4];
      c.n.forEach((f, i) => tone(ctx, f, t + i * .02, B * .95, 'sine', .045, .35));
      tone(ctx, c.b, t, bt * 1.3, 'triangle', .16, 0); tone(ctx, c.b, t + bt * 1.5, bt * .5, 'triangle', .12, 0); tone(ctx, c.b * 1.5, t + bt * 2.75, bt * .9, 'triangle', .12, 0);
      kick(ctx, t); kick(ctx, t + bt * 2); kick(ctx, t + bt * 2.5, .3);
      if (Math.random() < .55) tone(ctx, E.pick(SLEAD), t + bt * (1 + Math.floor(Math.random() * 2)), 1.6, 'triangle', .045, .6);
      return B;
    }
    function schedule() { const ctx = A.ctx; if (!ctx || !mood) return; const t = ctx.currentTime + .05; const len = mood === 'spicy' ? barSpicy(ctx, t) : barMono(ctx, t); bar++; timer = setTimeout(schedule, len * 1000); }
    return {
      start(m) { const ctx = A.init(); if (!ctx) return; if (!gain) { gain = ctx.createGain(); gain.gain.value = 0; gain.connect(A.musicBus); }
        if (mood === m && timer) return; clearTimeout(timer); mood = m; gain.gain.setTargetAtTime(.9, ctx.currentTime, 1); schedule(); },
      stop(m) { if (!m || m === mood) { clearTimeout(timer); timer = null; mood = null; } },
      level(l) { if (gain && A.ctx) gain.gain.setTargetAtTime(.9 * l, A.ctx.currentTime, .4); },
      fadeOut(ms) { if (gain && A.ctx) gain.gain.setTargetAtTime(0, A.ctx.currentTime, ms / 3000); setTimeout(() => { clearTimeout(timer); timer = null; mood = null; }, ms); }
    };
  })();

  /* ===================================================================
     SPRITES — arte procedural cacheada em canvas (o "atlas" do jogo)
     =================================================================== */
  E.sprites = (() => {
    const cache = {};
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); const d = 2; c.width = w * d; c.height = h * d; const x = c.getContext('2d'); x.scale(d, d); draw(x, w, h); c.w = w; c.h = h; return c; };
    const ART = {
      tapioca: (x, w) => { const r = w / 2 - 2; x.translate(w / 2, w / 2);
        const g = x.createRadialGradient(-r * .2, -r * .25, 2, 0, 0, r); g.addColorStop(0, '#FFFDF6'); g.addColorStop(.75, '#F2E7CF'); g.addColorStop(1, '#D9C49A');
        x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, r, r * .92, 0, 0, 6.283); x.fill();
        x.fillStyle = 'rgba(160,110,50,.25)'; for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, d = Math.random() * r * .85; x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, Math.random() * 1.6 + .5, 0, 6.283); x.fill(); }
        x.strokeStyle = 'rgba(120,80,30,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-r * .9, 0); x.quadraticCurveTo(0, r * .25, r * .9, 0); x.stroke(); },
      cuscuz: (x, w) => { x.translate(w / 2, w * .58); const r = w * .44;
        const g = x.createLinearGradient(0, -r, 0, r * .5); g.addColorStop(0, '#FFE27A'); g.addColorStop(1, '#E6A928');
        x.fillStyle = g; x.beginPath(); x.moveTo(-r, r * .35); x.quadraticCurveTo(-r, -r * .9, 0, -r * .95); x.quadraticCurveTo(r, -r * .9, r, r * .35); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 40; i++) { x.fillRect(E.rand(-r * .8, r * .8), E.rand(-r * .75, r * .25), 1.4, 1.4); }
        x.fillStyle = 'rgba(160,90,10,.35)'; for (let i = 0; i < 30; i++) { x.fillRect(E.rand(-r * .8, r * .8), E.rand(-r * .6, r * .3), 1.2, 1.2); }
        x.fillStyle = '#FFF6D0'; x.beginPath(); x.ellipse(r * .2, -r * .55, r * .22, r * .12, -.3, 0, 6.283); x.fill(); },
      ovo: (x, w) => { x.translate(w / 2, w / 2); const r = w * .44;
        x.fillStyle = '#FFFFFF'; x.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, rr = r * (.82 + Math.sin(i * 2.3) * .14); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * .9); } x.closePath(); x.fill();
        x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; x.stroke();
        const g = x.createRadialGradient(-r * .12, -r * .14, 1, 0, 0, r * .38); g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#F2A51E');
        x.fillStyle = g; x.beginPath(); x.arc(r * .05, r * .02, r * .36, 0, 6.283); x.fill();
        x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(-r * .08, -r * .1, r * .09, 0, 6.283); x.fill(); },
      grao: (x, w) => { x.translate(w / 2, w / 2); x.rotate(.5); const r = w * .4;
        const g = x.createRadialGradient(-r * .3, -r * .3, 1, 0, 0, r); g.addColorStop(0, '#8A5A34'); g.addColorStop(1, '#3B2010');
        x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, r * .72, r, 0, 0, 6.283); x.fill();
        x.strokeStyle = '#2A150A'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -r * .85); x.bezierCurveTo(-r * .3, -r * .3, r * .3, r * .3, 0, r * .85); x.stroke(); },
      xicara: (x, w) => { const s = w / 64; x.scale(s, s);
        x.fillStyle = '#F1E6CF'; x.beginPath(); x.moveTo(10, 22); x.lineTo(46, 22); x.lineTo(42, 52); x.quadraticCurveTo(41, 56, 36, 56); x.lineTo(20, 56); x.quadraticCurveTo(15, 56, 14, 52); x.closePath(); x.fill();
        x.strokeStyle = '#F1E6CF'; x.lineWidth = 5; x.beginPath(); x.arc(48, 34, 8, -1.3, 1.3); x.stroke();
        x.fillStyle = '#4A2A14'; x.beginPath(); x.ellipse(28, 23, 17, 3.5, 0, 0, 6.283); x.fill();
        x.fillStyle = '#C9A15E'; x.fillRect(12, 40, 32, 3); },
      leite: (x, w) => { const s = w / 64; x.scale(s, s);
        x.fillStyle = '#FFFFFF'; x.fillRect(16, 20, 32, 38); x.beginPath(); x.moveTo(16, 20); x.lineTo(24, 8); x.lineTo(40, 8); x.lineTo(48, 20); x.closePath(); x.fill();
        x.fillStyle = '#4A90D9'; x.fillRect(16, 30, 32, 16); x.fillStyle = '#FFFFFF'; x.font = 'bold 10px sans-serif'; x.textAlign = 'center'; x.fillText('LEITE', 32, 42);
        x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 1.5; x.strokeRect(16, 20, 32, 38); },
      boleto: (x, w) => { const s = w / 64; x.scale(s, s); x.rotate(-.12);
        x.fillStyle = '#F7F4EA'; x.fillRect(8, 16, 46, 32); x.fillStyle = '#222'; for (let i = 0; i < 18; i++) x.fillRect(12 + i * 2.2, 36, i % 3 ? 1 : 1.6, 9);
        x.fillStyle = '#D23B3B'; x.font = 'bold 9px sans-serif'; x.fillText('BOLETO', 14, 28); },
      pimenta: (x, w) => { const s = w / 64; x.scale(s, s);
        const g = x.createLinearGradient(10, 20, 50, 50); g.addColorStop(0, '#FF4D3A'); g.addColorStop(1, '#B3121F');
        x.fillStyle = g; x.beginPath(); x.moveTo(18, 20); x.quadraticCurveTo(52, 18, 50, 54); x.quadraticCurveTo(40, 34, 14, 28); x.closePath(); x.fill();
        x.fillStyle = '#3C8D2F'; x.beginPath(); x.ellipse(16, 22, 7, 5, -.4, 0, 6.283); x.fill(); x.strokeStyle = '#3C8D2F'; x.lineWidth = 3; x.beginPath(); x.moveTo(12, 20); x.quadraticCurveTo(6, 12, 12, 6); x.stroke(); },
      gelo: (x, w) => { const s = w / 64; x.scale(s, s);
        x.fillStyle = 'rgba(190,230,255,.85)'; x.strokeStyle = '#E8F7FF'; x.lineWidth = 2; x.beginPath(); x.roundRect ? x.roundRect(12, 12, 40, 40, 8) : x.rect(12, 12, 40, 40); x.fill(); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(18, 18, 10, 4); x.font = '20px sans-serif'; x.textAlign = 'center'; x.fillText('😒', 32, 42); }
    };
    function get(name, size = 48) {
      const k = name + size; if (cache[k]) return cache[k];
      if (ART[name]) return (cache[k] = mk(size, size, (x, w, h) => ART[name](x, w, h)));
      return emoji(name, size);
    }
    function emoji(e, size = 48) {
      const k = 'e' + e + size; if (cache[k]) return cache[k];
      return (cache[k] = mk(size, size, x => { x.font = `${size * .8}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, size / 2, size * .55); }));
    }
    /* devolve um <img> (dataURL) para usar no DOM */
    function img(name, size = 48) { const c = get(name, size); const i = new Image(); i.src = c.toDataURL(); i.width = size; i.height = size; i.alt = ''; i.draggable = false; return i; }
    return { get, emoji, img, names: () => Object.keys(ART) };
  })();

  /* ===================================================================
     PLACAR — pontos, combos, conquistas
     =================================================================== */
  E.score = (() => {
    let total = 0, shown = 0, el = null, raf = null;
    const listeners = [];
    function bind(node) { el = node; render(); }
    function render() { if (el) el.textContent = String(Math.round(shown)).padStart(3, '0'); }
    function roll() { cancelAnimationFrame(raf); const step = () => { shown += (total - shown) * .18; if (Math.abs(total - shown) < .5) shown = total; render(); if (shown !== total) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
    function add(n, x, y, label) {
      if (!n) return; total = Math.max(0, total + n); roll();
      if (el) { E.pop(el.parentElement || el); }
      const r = el ? el.getBoundingClientRect() : { left: innerWidth - 60, top: 20, width: 40, height: 20 };
      FX.text(x ?? r.left + r.width / 2, y ?? r.top + r.height + 18, label || (n > 0 ? `+${n}` : `${n}`), { size: n >= 50 ? 32 : 24 });
      if (n > 0) E.sfx('coin');
      listeners.forEach(f => f(total, n));
    }
    return { bind, add, on: f => listeners.push(f), get total() { return total; }, set(v) { total = shown = v; render(); } };
  })();

  E.achievements = [];
  E.achieve = (id, emoji, title, who = '') => {
    const key = who + ':' + id;
    if (E.achievements.find(a => a.key === key)) return false;
    E.achievements.push({ key, id, emoji, title, who });
    const t = document.createElement('div'); t.className = 'achv';
    t.innerHTML = `<i>${emoji}</i><div><small>Conquista desbloqueada</small><b>${title}</b></div>`;
    document.body.appendChild(t);
    E.sfx('level'); E.vibe([15, 30, 15]);
    E.anim(t, [{ transform: 'translate(-50%,-140%)', opacity: 0 }, { transform: 'translate(-50%,0)', opacity: 1, offset: .12 }, { transform: 'translate(-50%,0)', opacity: 1, offset: .85 }, { transform: 'translate(-50%,-140%)', opacity: 0 }], { duration: 2800, easing: 'cubic-bezier(.2,.9,.3,1.2)' }).then(() => t.remove());
    return true;
  };

  /* inicia a camada de FX quando o DOM existir */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', FX.setup); else FX.setup();
})();
