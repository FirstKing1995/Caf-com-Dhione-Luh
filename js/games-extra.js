/* =====================================================================
   GAMES-EXTRA — 3 minijogos do convite "Um café com Dhione & Luh"
   catcher (Chuva de Cuscuz / Tentação) · memory (Memória dos Arcanos)
   garrafa (Gira a Garrafa)
   Contrato: window.GAMES.<id> = { mount(root, api) -> cleanup }
   ===================================================================== */
(function () {
  'use strict';
  const E = window.E;
  window.GAMES = window.GAMES || {};

  const PIX = '"Pixelify Sans", "Courier New", monospace';
  const DISP = '"IM Fell English SC", Georgia, serif';
  const BODY = 'Spectral, Georgia, serif';

  /* ---------------------------------------------------------------- CSS */
  const CSS = `
.gx-wrap{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6px;overflow:hidden;position:relative}
.gx-cv{border-radius:12px;box-shadow:0 0 0 1px var(--line2),0 6px 22px rgba(0,0,0,.35);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.gx-done{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%;min-height:180px;text-align:center;color:var(--gold2)}
.gx-done b{font:400 44px/1 var(--display,${DISP});color:var(--gold);text-shadow:0 0 18px var(--golddim)}
.gx-done span{font:400 20px/1.2 var(--display,${DISP});letter-spacing:.08em}
.gx-done small{font:400 13px/1.3 var(--body,${BODY});color:var(--dim);font-style:italic}
.gx-hud{display:flex;justify-content:space-between;align-items:center;width:100%;padding:2px 4px;font:500 14px/1 'Pixelify Sans',${PIX};color:var(--gold2);letter-spacing:.05em}
.gx-hud i{font-style:normal;color:var(--dim);font-size:11px;margin-right:4px}
.gx-hud em{font-style:normal;color:var(--ember)}
.gx-grid{display:grid;justify-content:center;align-content:center;flex:1;min-height:0}
.gx-c{position:relative;perspective:700px;padding:0;margin:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none;font:inherit}
.gx-c:focus-visible .gx-b{box-shadow:0 0 0 2px var(--gold2)}
.gx-ci{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.3,1.35,.5,1)}
.gx-c.gx-up .gx-ci{transform:rotateY(180deg)}
.gx-f{position:absolute;inset:0;border-radius:9px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center;overflow:hidden}
.gx-b{background:linear-gradient(150deg,var(--card1),var(--card2));border:1.5px solid var(--gold);box-shadow:inset 0 0 0 3px var(--card2),inset 0 0 0 4px var(--golddim),0 3px 8px rgba(0,0,0,.4);color:var(--gold)}
.gx-b::before{content:"";position:absolute;inset:7px;border-radius:5px;opacity:.55;background:repeating-linear-gradient(45deg,transparent 0 5px,var(--wash) 5px 6px),repeating-linear-gradient(-45deg,transparent 0 5px,var(--wash) 5px 6px)}
.gx-b span{position:relative;font-size:var(--gx-sym,22px);line-height:1;text-shadow:0 0 10px var(--golddim)}
.gx-b span::before{content:"";position:absolute;left:50%;top:50%;width:1.9em;height:1.9em;margin:-.95em 0 0 -.95em;border:1px solid var(--golddim);border-radius:50%}
.gx-fr{transform:rotateY(180deg);background:radial-gradient(circle at 50% 38%,var(--card1),var(--card2) 85%);border:1.5px solid var(--gold2);box-shadow:inset 0 0 0 3px var(--card2),inset 0 0 0 4px var(--golddim),0 3px 8px rgba(0,0,0,.4)}
.gx-fr img{position:relative;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.gx-c.gx-ok .gx-fr{border-color:var(--gold2);box-shadow:inset 0 0 0 3px var(--card2),inset 0 0 0 4px var(--gold),0 0 16px var(--gold),0 0 4px var(--gold2);animation:gx-glow 1.8s ease-in-out infinite}
.gx-c.gx-ok .gx-fr::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);transform:translateX(-120%);animation:gx-shine 2.4s ease-in-out infinite}
@keyframes gx-glow{50%{box-shadow:inset 0 0 0 3px var(--card2),inset 0 0 0 4px var(--gold),0 0 24px var(--gold2),0 0 6px var(--gold2)}}
@keyframes gx-shine{60%,100%{transform:translateX(120%)}}
.gx-btns{display:flex;gap:8px;justify-content:center;align-items:center;width:100%;min-height:38px;flex:none}
.gx-btns{flex-wrap:nowrap}.gx-narrow .gx-btn{font-size:12px;padding:9px 10px}.gx-btn{flex:0 1 auto;min-width:0;appearance:none;border:1.5px solid var(--gold);background:linear-gradient(180deg,var(--card1),var(--card2));color:var(--gold2);font:500 14px/1 'Pixelify Sans',${PIX};letter-spacing:.04em;padding:10px 14px;border-radius:999px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 0 var(--golddim),0 6px 14px rgba(0,0,0,.3);transition:transform .08s,box-shadow .08s;white-space:nowrap}
.gx-btn:active{transform:translateY(3px);box-shadow:0 0 0 var(--golddim)}
.gx-btn.gx-pri{background:linear-gradient(180deg,var(--gold2),var(--gold));color:var(--ink);border-color:var(--gold2)}
.gx-btn[disabled]{opacity:.45;pointer-events:none}
.gx-pill{font:500 14px/1 'Pixelify Sans',${PIX};color:var(--gold2);padding:9px 16px;border:1.5px solid var(--gold);border-radius:999px;background:var(--wash);text-align:center}
@media (prefers-reduced-motion:reduce){.gx-ci{transition-duration:.01s}.gx-c.gx-ok .gx-fr,.gx-c.gx-ok .gx-fr::after{animation:none}}
`;
  function injectCSS() {
    if (document.getElementById('gx-style')) return;
    const s = document.createElement('style'); s.id = 'gx-style'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ----------------------------------------------------------- helpers */
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const text = (ctx, s, x, y, font, color, align = 'center', stroke) => {
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  };
  const sparkle = (ctx, x, y, r, color) => {
    ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, d = i % 2 ? r * .22 : r; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    ctx.closePath(); ctx.fill();
  };
  const initAudio = () => { try { E.audio && E.audio.init(); } catch (_) {} };
  const rivalLine = (api, mine, kind, spicy) => {
    if (!api.rival) return '';
    const r = api.rival, d = Math.round(mine - r.score);
    if (d > 0) return `Ganhou de ${r.name} por ${d}! 🏆`;
    if (d < 0) return kind === 'catcher' ? (spicy ? `${r.name} segue reinando na tentação 😅` : `${r.name} segue reinando no cuscuz 😅`) : `${r.name} ainda guarda melhor os arcanos 😅`;
    return `Empate com ${r.name}! Ninguém merece perder 🤝`;
  };
  function replayView(root, api) {
    root.innerHTML = '<div class="gx-done"><b>✦</b><span>Já jogado ✦</span><small>Esse a gente já zerou.</small></div>';
    try { api.msg && api.msg('Já jogado ✦'); } catch (_) {}
    return () => { root.innerHTML = ''; };
  }
  function clientPos(cv, W, H, x, y) { const r = cv.getBoundingClientRect(); return [r.left + x * (r.width / W), r.top + y * (r.height / H)]; }

  /* =================================================================
     1) CATCHER — Chuva de Cuscuz / Chuva de Tentação
     ================================================================= */
  window.GAMES.catcher = {
    mount(root, api) {
      injectCSS(); root.innerHTML = '';
      if (api.replay) return replayView(root, api);
      const spicy = !!api.spicy, T = E.theme();
      const rw = root.clientWidth || 340, rh = root.clientHeight || 340;
      const W = Math.round(Math.min(rw, 380)), H = Math.round(E.clamp(rh, 240, 440));
      const S = E.clamp(W / 340, .8, 1.15);
      const wrap = document.createElement('div'); wrap.className = 'gx-wrap'; root.appendChild(wrap);
      const { cv, ctx } = E.canvas(wrap, W, H); cv.classList.add('gx-cv'); cv.tabIndex = 0;
      cv.setAttribute('aria-label', spicy ? 'Chuva de Tentação' : 'Chuva de Cuscuz');

      const GOOD = spicy
        ? [{ n: '🍑', p: 10 }, { n: '🍒', p: 10 }, { n: '💋', p: 15 }, { n: 'pimenta', p: 10 }, { n: '🔥', p: 5 }]
        : [{ n: 'tapioca', p: 10 }, { n: 'cuscuz', p: 10 }, { n: 'ovo', p: 15 }, { n: 'grao', p: 5 }];
      const BAD = spicy
        ? [{ n: 'gelo', p: -15, t: 'Climão! 🧊' }, { n: '⏰', p: -10, t: 'Hora de ir embora?! Nunca.' }, { n: '🧦', p: -10, t: 'Meia na hora H 😩' }]
        : [{ n: 'leite', p: -15, t: 'Leite NÃO! 🥛🚫' }, { n: 'boleto', p: -10, t: 'Boleto não!' }];
      const GOLD = spicy ? { n: '😈', p: 30, t: 'DIABINHO! 😈', gold: true } : { n: 'tapioca', p: 30, t: 'TAPIOCA DOURADA ✨', gold: true };
      const DUR = 20;

      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, T.card1); bg.addColorStop(1, T.card2);
      const dust = Array.from({ length: 26 }, () => ({ x: E.rand(0, W), y: E.rand(0, H), s: E.rand(.6, 1.8), v: E.rand(8, 26), ph: E.rand(0, 6) }));

      let state = 'idle', stateT = 0, timeLeft = DUR, elapsed = 0;
      let score = 0, shown = 0, streak = 0, mult = 1, bestMult = 1, badCount = 0, goodCount = 0;
      let px = W / 2, tx = W / 2, pvx = 0, tilt = 0, sq = 0, sqV = 0, wob = 0;
      let red = 0, comboT = 0, comboTxt = '', spawnT = .5, goldCd = 6, kdir = 0, over = false, doneCalled = false, finalInfo = null;
      const items = [];
      const pw = E.clamp(78 * S, 62, 90), surfY = H - 40 * S, plateY = H - 38 * S;
      const isz = Math.round(36 * S);

      const cp = (x, y) => clientPos(cv, W, H, x, y);
      const float = (x, y, s, o) => { const [cx, cy] = cp(x, y); E.fx.text(cx, cy, s, o); };
      const burst = (x, y, o) => { const [cx, cy] = cp(x, y); E.fx.burst(cx, cy, o); };

      function setTarget(e) { const r = cv.getBoundingClientRect(); tx = E.clamp((e.clientX - r.left) * (W / r.width), pw / 2, W - pw / 2); }
      function startCount() { if (state !== 'idle') return; initAudio(); state = 'count'; stateT = 0; lastTick = -1; api.msg(spicy ? 'Pega o que é bom. Desvia do climão.' : 'Pega o que é bom. Desvia do leite!'); }
      let lastTick = -1;
      const onDown = e => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); setTarget(e); if (state === 'idle') startCount(); };
      const onMove = e => { if (e.pointerType === 'mouse' || e.buttons || e.pressure > 0) setTarget(e); };
      const keys = {};
      const onKey = e => {
        const d = e.type === 'keydown';
        if (e.key === 'ArrowLeft' || e.key === 'a') { keys.l = d; } else if (e.key === 'ArrowRight' || e.key === 'd') { keys.r = d; }
        else if (d && (e.key === ' ' || e.key === 'Enter') && state === 'idle') { startCount(); } else return;
        kdir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); if (e.key !== 'Enter') e.preventDefault();
      };
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
      window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

      function spawn() {
        const p = E.clamp(elapsed / DUR, 0, 1);
        let def;
        const r = Math.random();
        if (goldCd <= 0 && r < .07 && elapsed > 5) { def = GOLD; goldCd = 6; }
        else if (r < E.lerp(.2, .34, p)) def = E.pick(BAD);
        else def = E.pick(GOOD);
        const sz = isz * (def.gold ? 1.15 : 1);
        items.push({ def, spr: E.sprites.get(def.n, 64), sz, x: E.rand(sz * .6, W - sz * .6), y: -sz, vy: E.lerp(115, 235, p) * (H / 360) * E.rand(.9, 1.18), rot: E.rand(-.3, .3), vr: E.rand(-1.4, 1.4), ph: E.rand(0, 6), dr: E.rand(4, 14), bad: def.p < 0, gold: !!def.gold });
        spawnT = E.lerp(.82, .4, p) * E.rand(.8, 1.2);
      }

      function onCatch(it) {
        const d = it.def; it.dead = true;
        sqV = 0; sq = .3;
        if (it.bad) {
          score = Math.max(0, score + d.p); badCount++; streak = 0; mult = 1; red = 1; wob = 1;
          E.shake(8); E.sfx('buzz'); E.vibe([30, 40, 30]);
          float(it.x, surfY - 24, d.t, { color: T.ember, size: 20, dur: 1.2 });
          burst(it.x, surfY, { n: 12, colors: [T.ember, T.bone], shapes: ['circle'], speed: [60, 220], gravity: 500 });
          return;
        }
        goodCount++; streak++;
        const prev = mult;
        mult = streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
        const pts = d.p * mult; score += pts;
        if (mult > bestMult) bestMult = mult;
        E.sfx('combo', streak); E.vibe(10);
        if (it.gold) {
          E.sfx('power'); E.vibe([20, 30, 40]);
          float(it.x, surfY - 30, d.t, { color: T.gold2, size: 24, dur: 1.4 });
          burst(it.x, surfY, { n: 44, speed: [120, 420] });
        } else {
          float(it.x, surfY - 26, `+${pts}`, { size: 22 });
          burst(it.x, surfY - 6, { n: 9, angle: -Math.PI / 2, spread: 1, speed: [90, 260] });
        }
        if (mult > prev) {
          comboT = 1.1; comboTxt = `COMBO x${mult}`;
          float(W / 2, 90 * S, comboTxt, { size: 30, color: T.ember, dur: 1.3 });
          if (mult === 3) E.achieve('catch-combo', '🔥', 'Combo x3', api.who);
        }
      }

      function finish() {
        if (doneCalled) return; doneCalled = true;
        const pts = E.clamp(Math.round(score / 2), 20, 150);
        let m;
        if (spicy) m = score >= 260 ? 'Que mãos rápidas… anotado 😏' : score >= 130 ? 'Tem talento, mas falta pegada 😉' : 'Faltou jogo de cintura… e de mão 🙈';
        else m = score >= 260 ? 'Pegou tudo! Tá contratado(a) pra servir a mesa.' : score >= 130 ? 'Quase garçom de cafeteria. Só não derruba o leite.' : 'O cuscuz agradece o esforço. O chão também, ficou bem servido.';
        const rv = rivalLine(api, score, 'catcher', spicy);
        if (rv) m += ' ' + rv;
        if (badCount === 0 && score > 0) E.achieve('catch-nomilk', '🥛', 'Fugiu do leite', api.who);
        finalInfo = { pts, rv };
        api.done(pts, m, { score, bestMult });
      }

      /* ------------------------------ desenho */
      function drawPlate(x, y, w, ang, sqv) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1 + sqv * .3, 1 - sqv * .55);
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 14 * S, w * .5, 6 * S, 0, 0, 6.283); ctx.fill();
        if (spicy) {
          const hw = w * .56, hh = w * .4;
          const path = () => { ctx.beginPath(); ctx.moveTo(0, hh * .95); ctx.bezierCurveTo(-hw * 1.35, hh * .1, -hw * .85, -hh * 1.1, 0, -hh * .35); ctx.bezierCurveTo(hw * .85, -hh * 1.1, hw * 1.35, hh * .1, 0, hh * .95); ctx.closePath(); };
          ctx.save(); ctx.translate(0, 2 * S); ctx.scale(1, .9); path();
          const g = ctx.createLinearGradient(0, -hh, 0, hh); g.addColorStop(0, T.ember); g.addColorStop(1, T.card2);
          ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = T.gold2; ctx.stroke();
          ctx.scale(.78, .74); ctx.translate(0, -hh * .06); path(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = T.gold; ctx.stroke();
          ctx.restore();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-w * .26, -hh * .3, w * .09, 3 * S, -.4, 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = '#8f7f63'; ctx.beginPath(); ctx.ellipse(0, 9 * S, w * .5, 13 * S, 0, 0, 6.283); ctx.fill();
          const g = ctx.createLinearGradient(0, -6 * S, 0, 16 * S); g.addColorStop(0, T.bone); g.addColorStop(1, '#b9a88a');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 6 * S, w * .5, 13 * S, 0, 0, 6.283); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = T.gold; ctx.stroke();
          const g2 = ctx.createLinearGradient(0, -4 * S, 0, 14 * S); g2.addColorStop(0, '#8d7d62'); g2.addColorStop(1, T.bone);
          ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0, 5 * S, w * .36, 8 * S, 0, 0, 6.283); ctx.fill();
          ctx.strokeStyle = T.golddim; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 6 * S, w * .44, 10.5 * S, 0, 0, 6.283); ctx.stroke();
          ctx.fillStyle = T.gold; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; ctx.beginPath(); ctx.arc(Math.cos(a) * w * .44, 6 * S + Math.sin(a) * 10.5 * S, 1.2, 0, 6.283); ctx.fill(); }
        }
        ctx.restore();
      }
      function drawItem(it, t) {
        ctx.save(); ctx.translate(it.x, it.y); ctx.globalAlpha = it.y > H - 10 ? Math.max(0, 1 - (it.y - (H - 10)) / it.sz) : 1;
        if (it.gold) {
          const k = .55 + .25 * Math.sin(t * 6);
          const g = ctx.createRadialGradient(0, 0, 2, 0, 0, it.sz * .95); g.addColorStop(0, `rgba(255,236,160,${k})`); g.addColorStop(1, 'rgba(255,215,100,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, it.sz * .95, 0, 6.283); ctx.fill();
          for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; sparkle(ctx, Math.cos(a) * it.sz * .62, Math.sin(a) * it.sz * .62, 4.5, '#FFF3C4'); }
        } else if (it.bad) {
          const g = ctx.createRadialGradient(0, 0, 2, 0, 0, it.sz * .78); g.addColorStop(0, 'rgba(255,60,60,.0)'); g.addColorStop(.7, `rgba(255,60,60,${.18 + .1 * Math.sin(t * 8 + it.ph)})`); g.addColorStop(1, 'rgba(255,60,60,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, it.sz * .78, 0, 6.283); ctx.fill();
        }
        ctx.rotate(it.rot); ctx.drawImage(it.spr, -it.sz / 2, -it.sz / 2, it.sz, it.sz);
        if (it.gold) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .22 + .1 * Math.sin(t * 6); ctx.drawImage(it.spr, -it.sz / 2, -it.sz / 2, it.sz, it.sz); }
        ctx.restore();
      }
      function panel(h) {
        ctx.fillStyle = 'rgba(8,3,12,.62)'; ctx.fillRect(0, 0, W, H);
        const w = W - 44, x = 22, y = H / 2 - h / 2;
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, T.card1); g.addColorStop(1, T.card2);
        rr(ctx, x, y, w, h, 14); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = T.gold; ctx.stroke();
        rr(ctx, x + 4, y + 4, w - 8, h - 8, 11); ctx.lineWidth = 1; ctx.strokeStyle = T.golddim; ctx.stroke();
        return y;
      }

      function update(dt, t) {
        stateT += dt;
        /* prato */
        if (kdir) tx = E.clamp(tx + kdir * 560 * dt, pw / 2, W - pw / 2);
        const old = px; px += (tx - px) * (1 - Math.exp(-15 * dt));
        pvx = (px - old) / Math.max(dt, .001); tilt += (E.clamp(pvx / 1100, -.22, .22) - tilt) * (1 - Math.exp(-12 * dt));
        sqV += (-sq * 320 - sqV * 13) * dt; sq += sqV * dt;
        wob *= Math.exp(-4.5 * dt); red *= Math.exp(-3.2 * dt);
        comboT = Math.max(0, comboT - dt);
        shown += (score - shown) * (1 - Math.exp(-14 * dt));
        dust.forEach(d => { d.y += d.v * dt; if (d.y > H) { d.y = -4; d.x = E.rand(0, W); } });

        if (state === 'count') {
          const n = 3 - Math.floor(stateT / .75);
          if (n !== lastTick && n >= 1) { lastTick = n; E.sfx('tick'); E.vibe(8); }
          if (stateT >= 2.25) { state = 'play'; stateT = 0; E.sfx('tick', true); E.sfx('whoosh'); }
        }
        if (state === 'play') {
          elapsed += dt; timeLeft = Math.max(0, DUR - elapsed); goldCd -= dt;
          spawnT -= dt; if (spawnT <= 0) spawn();
          if (timeLeft <= 0) { state = 'over'; stateT = 0; E.sfx('win'); items.forEach(i => i.fade = true); }
        }
        if (state === 'over' && stateT > .9 && !over) { over = true; finish(); }

        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt; it.x += Math.sin(it.ph + t * 2) * it.dr * dt; it.rot += it.vr * dt;
          if (!it.dead && !it.fade && state === 'play' && it.y + it.sz * .36 >= surfY && it.y < surfY + 8 && Math.abs(it.x - px) < pw / 2 + it.sz * .08) onCatch(it);
          if (it.dead || it.y > H + it.sz || (it.fade && it.y > H - 40)) items.splice(i, 1);
        }
        if (state === 'over') items.length = 0;
      }

      function draw(t) {
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        dust.forEach(d => { ctx.globalAlpha = .25 + .2 * Math.sin(t * 2 + d.ph); ctx.fillStyle = T.gold2; ctx.fillRect(d.x, d.y, d.s, d.s * 2.4); });
        ctx.globalAlpha = 1;
        /* chão */
        const fg = ctx.createLinearGradient(0, H - 22, 0, H); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = fg; ctx.fillRect(0, H - 22, W, 22);
        ctx.strokeStyle = T.golddim; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(10, H - 12); ctx.lineTo(W - 10, H - 12); ctx.stroke(); ctx.globalAlpha = 1;
        items.forEach(it => drawItem(it, t));
        drawPlate(px, plateY, pw, tilt + Math.sin(t * 32) * wob * .22 * (E.calm ? 0 : 1), sq);
        if (red > .02) { ctx.fillStyle = `rgba(220,30,50,${red * .38})`; ctx.fillRect(0, 0, W, H); }

        /* HUD */
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.fillRect(0, 0, W, 34);
        text(ctx, 'PTS', 12, 18, `400 10px ${PIX}`, T.dim, 'left');
        text(ctx, String(Math.round(shown)).padStart(3, '0'), 38, 17, `600 18px ${PIX}`, T.gold2, 'left');
        const secs = Math.ceil(timeLeft);
        text(ctx, `0:${String(secs).padStart(2, '0')}`, W - 12, 17, `600 18px ${PIX}`, secs <= 5 && state === 'play' ? T.ember : T.gold2, 'right');
        if (mult > 1) { rr(ctx, W / 2 - 38, 7, 76, 20, 10); ctx.fillStyle = T.ember; ctx.fill(); text(ctx, `COMBO x${mult}`, W / 2, 17.5, `600 12px ${PIX}`, '#fff'); }
        else if (streak > 1 && state === 'play') text(ctx, `${streak} seguidas`, W / 2, 17.5, `400 11px ${PIX}`, T.dim);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 34, W, 3);
        ctx.fillStyle = T.gold; ctx.fillRect(0, 34, W * (elapsed / DUR), 3);
        if (comboT > 0) { const k = comboT / 1.1, sc = 1 + (k > .85 ? (k - .85) * 4 : 0); ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); ctx.translate(W / 2, 64 * S); ctx.scale(sc, sc); text(ctx, comboTxt, 0, 0, `600 ${22 * S}px ${PIX}`, T.gold2, 'center', 'rgba(0,0,0,.6)'); ctx.restore(); }

        /* overlays */
        if (state === 'idle') {
          const h = api.rival ? 168 : 146, y = panel(h);
          text(ctx, spicy ? 'Chuva de Tentação' : 'Chuva de Cuscuz', W / 2, y + 34, `400 ${Math.min(30, W / 11.5)}px ${DISP}`, T.gold2);
          text(ctx, spicy ? 'Pega o que é bom. Foge do climão.' : 'Pega o que é bom. Foge do leite.', W / 2, y + 62, `400 13px ${BODY}`, T.dim);
          text(ctx, 'arraste pra mover o prato · 20s', W / 2, y + 82, `400 11px ${PIX}`, T.golddim);
          const pulse = .65 + .35 * Math.sin(t * 5);
          ctx.globalAlpha = pulse; text(ctx, 'Toque pra começar', W / 2, y + 112, `600 17px ${PIX}`, T.gold2); ctx.globalAlpha = 1;
          if (api.rival) text(ctx, `Recorde a bater: ${api.rival.name} · ${api.rival.score}`, W / 2, y + 142, `500 12px ${PIX}`, T.ember);
        } else if (state === 'count') {
          const n = 3 - Math.floor(stateT / .75), k = (stateT % .75) / .75;
          ctx.fillStyle = 'rgba(8,3,12,.35)'; ctx.fillRect(0, 37, W, H - 37);
          ctx.save(); ctx.translate(W / 2, H * .42); const sc = 1.5 - .5 * E.ease.outBack(Math.min(1, k * 2)); ctx.scale(sc, sc); ctx.globalAlpha = 1 - Math.pow(k, 4);
          text(ctx, String(Math.max(1, n)), 0, 0, `600 96px ${PIX}`, T.gold2, 'center', 'rgba(0,0,0,.55)'); ctx.restore();
        } else if (state === 'play' && stateT < .7) {
          const k = stateT / .7; ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(W / 2, H * .42); ctx.scale(1 + k * .5, 1 + k * .5);
          text(ctx, 'VAI!', 0, 0, `600 56px ${PIX}`, T.ember, 'center', 'rgba(0,0,0,.55)'); ctx.restore();
        } else if (state === 'over') {
          if (!over) { ctx.fillStyle = 'rgba(8,3,12,.4)'; ctx.fillRect(0, 37, W, H - 37); const sc = 1 + Math.max(0, .5 - stateT * 1.6); ctx.save(); ctx.translate(W / 2, H * .42); ctx.scale(sc, sc); text(ctx, 'TEMPO!', 0, 0, `600 52px ${PIX}`, T.gold2, 'center', 'rgba(0,0,0,.55)'); ctx.restore(); }
          else if (finalInfo) {
            const h = finalInfo.rv ? 180 : 154, y = panel(h);
            text(ctx, 'Fim de jogo', W / 2, y + 28, `400 22px ${DISP}`, T.gold2);
            text(ctx, String(Math.round(shown)), W / 2, y + 74, `600 52px ${PIX}`, T.gold, 'center', 'rgba(0,0,0,.4)');
            text(ctx, `+${finalInfo.pts} pontos pro placar`, W / 2, y + 110, `500 14px ${PIX}`, T.gold2);
            text(ctx, badCount === 0 ? (spicy ? 'Zero climão. Perfeito.' : 'Zero leite. Respeito.') : `${goodCount} pegos · ${badCount} escorregões`, W / 2, y + 132, `400 12px ${PIX}`, T.dim);
            if (finalInfo.rv) text(ctx, finalInfo.rv, W / 2, y + 158, `500 13px ${PIX}`, T.ember);
          }
        }
      }

      const stop = E.loop((dt, t) => { update(dt, t); draw(t); });
      return function cleanup() {
        stop(); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
        root.innerHTML = '';
      };
    }
  };

  /* =================================================================
     2) MEMORY — Memória dos Arcanos
     ================================================================= */
  window.GAMES.memory = {
    mount(root, api) {
      injectCSS(); root.innerHTML = '';
      if (api.replay) return replayView(root, api);
      const spicy = !!api.spicy;
      const W = Math.round(Math.min(root.clientWidth || 340, 380)), H = Math.max(240, root.clientHeight || 340);
      const faces = spicy ? ['💋', '🍑', 'pimenta', '🔥', '😈', '🍒'] : ['tapioca', 'cuscuz', 'ovo', 'xicara', '🎲', '🌙'];
      const hudH = 22, gap = Math.round(E.clamp(W / 50, 5, 9));
      const availH = H - hudH - 6;
      let cw = (W - gap * 3) / 4, ch = (availH - gap * 2) / 3;
      if (ch > cw * 1.45) ch = cw * 1.45;
      if (cw > ch * .98) cw = ch * .98;
      cw = Math.floor(cw); ch = Math.floor(ch);

      const wrap = document.createElement('div'); wrap.className = 'gx-wrap';
      const hud = document.createElement('div'); hud.className = 'gx-hud';
      const grid = document.createElement('div'); grid.className = 'gx-grid';
      grid.style.cssText = `grid-template-columns:repeat(4,${cw}px);grid-template-rows:repeat(3,${ch}px);gap:${gap}px;`;
      wrap.append(hud, grid); root.appendChild(wrap);

      const deck = E.shuffle(faces.concat(faces));
      const sprSize = Math.round(Math.min(cw, ch) * .66);
      const cards = deck.map((f, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'gx-c'; b.dataset.face = f; b.dataset.idx = i;
        b.style.setProperty('--gx-sym', Math.round(cw * .34) + 'px');
        b.setAttribute('aria-label', 'Carta ' + (i + 1));
        b.innerHTML = '<div class="gx-ci"><div class="gx-f gx-b"><span>✦</span></div><div class="gx-f gx-fr"></div></div>';
        b.querySelector('.gx-fr').appendChild(E.sprites.img(f, sprSize * 2).cloneNode(true));
        const im = b.querySelector('img'); im.style.width = im.style.height = sprSize + 'px';
        grid.appendChild(b); return { el: b, face: f, up: false, matched: false };
      });

      const timers = new Set(); let tickInt = null;
      const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
      let moves = 0, secs = 0, matched = 0, streak = 0, first = null, lock = true, started = false, finished = false;
      const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const renderHud = (txt) => { hud.innerHTML = `<span><i>JOGADAS</i>${moves}</span><span>${txt || ''}</span><span><i>TEMPO</i>${fmt(secs)}</span>`; };
      renderHud('<em>decora!</em>');
      const setUp = (c, up) => { c.up = up; c.el.classList.toggle('gx-up', up); };

      function finish() {
        if (finished) return; finished = true; clearInterval(tickInt);
        const pts = E.clamp(150 - moves * 6, 30, 150);
        let m = moves <= 8 ? 'Memória de elefante! 🐘' : moves <= 12 ? 'Mandou bem! ✨' : 'Pelo menos o café você não esquece ☕';
        const rv = rivalLine(api, pts, 'memory'); if (rv) m += ' ' + rv;
        if (moves <= 7) E.achieve('mem-perfect', '🧠', 'Memória perfeita', api.who);
        renderHud('<em>fim!</em>');
        api.done(pts, m, { moves, secs });
      }

      function click(c) {
        if (lock || finished || c.up || c.matched) return;
        initAudio();
        if (!started) { started = true; tickInt = setInterval(() => { secs++; renderHud(); }, 1000); }
        E.sfx('flip'); E.vibe(6); setUp(c, true);
        if (!first) { first = c; return; }
        const a = first, b = c; first = null; lock = true; moves++; renderHud();
        if (a.face === b.face) {
          streak++;
          later(() => {
            a.matched = b.matched = true; matched++;
            [a, b].forEach(x => { x.el.classList.add('gx-ok'); E.pop(x.el); E.fx.at(x.el, { n: 18, speed: [80, 300] }); });
            E.sfx('combo', streak + 1); E.sfx('coin'); E.vibe([10, 20, 10]);
            const r = b.el.getBoundingClientRect(); E.fx.text(r.left + r.width / 2, r.top, streak > 1 ? `PAR x${streak}!` : 'Par!', { size: 20 });
            lock = false;
            if (matched === faces.length) later(finish, 900);
          }, 380);
        } else {
          streak = 0;
          later(() => { E.sfx('boing'); E.vibe(20); E.wobble(a.el); E.wobble(b.el); }, 420);
          later(() => { setUp(a, false); setUp(b, false); E.sfx('swipe'); later(() => { lock = false; }, 300); }, 1000);
        }
      }
      cards.forEach(c => c.el.addEventListener('click', () => click(c)));

      /* espiadinha inicial */
      api.msg(spicy ? 'Decora os arcanos… vão virar já 👀' : 'Decora os arcanos… vão virar já 👀');
      later(() => { cards.forEach((c, i) => later(() => { setUp(c, true); }, i * 35)); E.sfx('whoosh'); }, 350);
      later(() => {
        cards.forEach((c, i) => later(() => setUp(c, false), i * 30));
        later(() => { lock = false; renderHud('<em>vai!</em>'); api.msg('Encontre os 6 pares.'); E.sfx('tick', true); }, 450);
      }, 350 + 12 * 35 + 1300);

      return function cleanup() { timers.forEach(clearTimeout); timers.clear(); clearInterval(tickInt); finished = true; root.innerHTML = ''; };
    }
  };

  /* =================================================================
     3) GARRAFA — Gira a Garrafa
     ================================================================= */
  window.GAMES.garrafa = {
    mount(root, api) {
      injectCSS(); root.innerHTML = '';
      if (api.replay) return replayView(root, api);
      const spicy = !!api.spicy, T = E.theme();
      const SEG = spicy
        ? [['Verdade', 'Saiu VERDADE. Respira fundo: no dia do café você responde tudinho 😏'],
           ['Desafio', 'Saiu DESAFIO. Fica anotado… no dia do café ele é seu 😈'],
           ['Beijo 💋', 'Saiu BEIJO 💋. Escolhe bem o alvo. O casal finge que não vê. Quase.'],
           ['Elogio safado', 'Saiu ELOGIO SAFADO. Vai treinando o olhar e o vocabulário 🔥'],
           ['Conta um segredo', 'Saiu SEGREDO. Guarda o melhor pro cafezinho… a gente guarda o seu 🤫'],
           ['Passa a vez', 'Passa a vez?! Sortudo(a)… ou fujão(ona). Só dessa vez 😅'],
           ['Shot de café ☕', 'Shot de café ☕ O único shot garantido da tarde. Sem careta!'],
           ['O casal escolhe 😏', 'O casal escolhe 😏 Reza. Reza muito.']]
        : [['Conta um mico', 'Saiu MICO. Vai separando aquele bem vergonhoso, hein 🙈'],
           ['Melhor viagem', 'Saiu MELHOR VIAGEM. Já vai ensaiando, queremos fotos ✈️'],
           ['Música do coração', 'Saiu MÚSICA DO CORAÇÃO. Pode cantar. Sim, desafinado vale 🎶'],
           ['Pior comida que já comeu', 'Saiu PIOR COMIDA. Respeitamos a coragem. Só o café é garantido ☕'],
           ['Uma história engraçada', 'Saiu HISTÓRIA ENGRAÇADA. Capricha no final, a plateia é exigente 😄'],
           ['Passa a vez', 'Passa a vez! Hoje você escapou… hoje 😌'],
           ['Escolhe a próxima música', 'Saiu a PLAYLIST! Cuidado: o dono da playlist é julgado 🎧'],
           ['Pergunta pro casal', 'Saiu PERGUNTA PRO CASAL. Pode ir com tudo, a gente aguenta 😎']];
      const N = SEG.length, STEP = Math.PI * 2 / N;
      const W = Math.round(Math.min(root.clientWidth || 340, 380)), rh = root.clientHeight || 340;
      const S = Math.round(E.clamp(Math.min(W, rh - 46), 200, 360));
      const R = S / 2 - 3, cx = S / 2, cy = S / 2;

      const wrap = document.createElement('div'); wrap.className = 'gx-wrap';
      const { cv, ctx } = E.canvas(wrap, S, S); cv.classList.add('gx-cv'); cv.style.borderRadius = '50%'; cv.style.boxShadow = 'none';
      const btns = document.createElement('div'); btns.className = 'gx-btns';
      wrap.append(cv, btns); root.appendChild(wrap); if (W < 330) wrap.classList.add('gx-narrow');

      /* rótulos: até 3 linhas, fonte ajustada (medida real) à faixa do anel */
      const bandLen = (R * .38 - 5) * .94, rmid = R * .73, arcW = STEP * rmid * .92;
      const labels = SEG.map(([l]) => {
        const words = l.split(' '); let best = null;
        const parts = [];
        const rec = (i, cur) => { if (i === words.length) { parts.push(cur); return; } for (let k = i + 1; k <= words.length; k++) if (cur.length < 3) rec(k, cur.concat(words.slice(i, k).join(' '))); };
        rec(0, []);
        ctx.font = `600 10px ${BODY}`;
        parts.forEach(lines => {
          const wmax = Math.max(...lines.map(x => ctx.measureText(x).width));
          const fs = Math.min(13 * (S / 300) + 1, bandLen / wmax * 10, arcW / (lines.length * 1.12));
          if (!best || fs > best.fs + .05) best = { lines, fs };
        });
        best.fs = Math.max(7, best.fs);
        return best;
      });

      let theta = 0, omega = 0, state = 'ready', spins = 0, chosen = -1, resultT = 0, target = 0, snapV = 0, settleT = 0;
      let lastIdx = Math.floor((theta + STEP / 2) / STEP), lastTick = 0, curIdx = 0, flashIdx = -1, flashT = 0, dragging = false, last = 0, hist = [], dragTotal = 0, doneCalled = false;
      const timers = new Set(); const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

      const mkBtn = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'gx-btn ' + (cls || ''); b.textContent = label; b.addEventListener('click', fn); return b; };
      function setButtons() {
        btns.innerHTML = '';
        if (state === 'ready') btns.appendChild(mkBtn(spins === 0 ? 'Girar ✦' : 'Girar de novo (1x)', 'gx-pri', () => spin()));
        else if (state === 'spin') btns.appendChild(mkBtn('Girando…', '', () => {})).disabled = true;
        else if (state === 'choose') { btns.appendChild(mkBtn('Girar de novo (1x)', 'gx-pri', () => spin())); btns.appendChild(mkBtn('Fica com essa', '', () => accept())); }
        else if (state === 'final') { const p = document.createElement('div'); p.className = 'gx-pill'; p.textContent = 'Prenda: ' + SEG[chosen][0]; btns.appendChild(p); }
      }
      setButtons();
      api.msg(spicy ? 'Dê um peteleco na garrafa (ou toque em Girar) 🍾' : 'Dê um peteleco na garrafa (ou toque em Girar) 🍾');

      const clientC = () => { const r = cv.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
      function spin(w) {
        if (state !== 'ready' && state !== 'choose') return;
        initAudio();
        omega = w || (Math.random() < .5 ? -1 : 1) * E.rand(15, 24);
        state = 'spin'; chosen = -1; spins++; setButtons(); E.sfx('whoosh'); E.vibe(15);
        api.msg(spins === 1 ? 'Rodando… 🌀' : 'Última chance… 🌀');
      }
      function accept() { if (state !== 'choose') return; finalize(); }
      function finalize() {
        state = 'final'; setButtons();
        const [label, line] = SEG[chosen];
        if (doneCalled) return; doneCalled = true;
        later(() => { api.done(40, 'Prenda selada ✦ ' + line, { prenda: label }); }, 700);
      }
      function onStop() {
        chosen = ((Math.round(theta / STEP) % N) + N) % N; target = Math.round(theta / STEP) * STEP;
        state = 'settle'; settleT = 0; snapV = 0;
      }
      function onResult() {
        const [label, line] = SEG[chosen];
        resultT = 0; E.sfx('win'); E.vibe([20, 30, 40]); api.msg(line);
        const [x, y] = clientC();
        E.fx.burst(x, y, { n: 40, shapes: spicy ? ['heart'] : ['heart', 'star'], colors: [T.ember, T.gold2, '#FF8FA3', T.gold], speed: [120, 380], gravity: 300, lift: 120 });
        if (spins >= 2) { state = 'final-wait'; finalize(); }
        else { state = 'choose'; setButtons(); }
      }

      const ang = e => { const r = cv.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); return { a: Math.atan2(dy, dx), d: Math.hypot(dx, dy) / (r.width / 2) }; };
      const wrapPi = d => { while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return d; };
      const onDown = e => {
        if (state !== 'ready' && state !== 'choose') return;
        const p = ang(e); if (p.d < .12) return;
        initAudio(); dragging = true; last = p.a; hist = []; dragTotal = 0; cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      };
      const onMove = e => {
        if (!dragging) return; const p = ang(e); if (p.d < .1) return;
        const d = wrapPi(p.a - last); last = p.a; theta += d; dragTotal += Math.abs(d); omega = 0;
        hist.push({ t: performance.now(), d }); while (hist.length && performance.now() - hist[0].t > 140) hist.shift();
      };
      const onUp = () => {
        if (!dragging) return; dragging = false;
        const now = performance.now(); hist = hist.filter(h => now - h.t < 140);
        const sum = hist.reduce((s, h) => s + h.d, 0), span = hist.length ? Math.max(.03, (now - hist[0].t) / 1000) : 1;
        let w = sum / span;
        if (dragTotal < .12 || Math.abs(w) < 3) { spin(); return; }
        w = Math.sign(w) * E.clamp(Math.abs(w), 9, 28); spin(w);
      };
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);

      /* ---------- desenho ---------- */
      function bottle(t) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(theta); ctx.scale(.9, .9);
        const bw = .125 * R, nk = .045 * R, g = ctx.createLinearGradient(-bw, 0, bw, 0);
        const cols = spicy ? ['#5a2a0c', '#e0912e', '#f3b758', '#a85c1a', '#4a200a'] : ['#0b3d24', '#2f9a5e', '#6fd596', '#1f7a47', '#08331d'];
        g.addColorStop(0, cols[0]); g.addColorStop(.3, cols[1]); g.addColorStop(.45, cols[2]); g.addColorStop(.75, cols[3]); g.addColorStop(1, cols[4]);
        ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.beginPath(); ctx.moveTo(-bw, .3 * R); ctx.quadraticCurveTo(-bw, .43 * R, -bw + .06 * R, .43 * R); ctx.lineTo(bw - .06 * R, .43 * R); ctx.quadraticCurveTo(bw, .43 * R, bw, .3 * R);
        ctx.lineTo(bw, -.06 * R); ctx.bezierCurveTo(bw, -.2 * R, nk, -.2 * R, nk, -.32 * R); ctx.lineTo(nk, -.5 * R); ctx.lineTo(nk * 1.4, -.5 * R); ctx.lineTo(nk * 1.4, -.55 * R); ctx.lineTo(-nk * 1.4, -.55 * R); ctx.lineTo(-nk * 1.4, -.5 * R); ctx.lineTo(-nk, -.5 * R); ctx.lineTo(-nk, -.32 * R);
        ctx.bezierCurveTo(-nk, -.2 * R, -bw, -.2 * R, -bw, -.06 * R); ctx.closePath();
        ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
        /* rolha/cápsula */
        ctx.fillStyle = T.gold; rr(ctx, -nk * 1.5, -.575 * R, nk * 3, .06 * R, 2); ctx.fill();
        /* brilho */
        ctx.fillStyle = 'rgba(255,255,255,.42)'; rr(ctx, -bw * .72, -.04 * R, bw * .22, .32 * R, 3); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.32)'; rr(ctx, -nk * .55, -.46 * R, nk * .35, .22 * R, 2); ctx.fill();
        /* rótulo */
        ctx.fillStyle = T.bone; rr(ctx, -bw * .9, .02 * R, bw * 1.8, .24 * R, 3); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = T.golddim; ctx.stroke();
        text(ctx, '♡', 0, .145 * R, `700 ${Math.round(.17 * R)}px ${BODY}`, T.ember);
        ctx.restore();
      }
      function draw(t) {
        ctx.clearRect(0, 0, S, S);
        /* base */
        const bgG = ctx.createRadialGradient(cx, cy, R * .1, cx, cy, R); bgG.addColorStop(0, T.card3 || T.card2); bgG.addColorStop(1, T.card2);
        ctx.fillStyle = bgG; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
        const r0 = R * .5, r1 = R * .93;
        const lblR = rmid;
        const under = ((Math.round(theta / STEP) % N) + N) % N;
        const hot = (state === 'choose' || state === 'final' || state === 'final-wait' || state === 'settle') ? chosen : -1;
        for (let i = 0; i < N; i++) {
          const a0 = i * STEP - STEP / 2 - Math.PI / 2, a1 = a0 + STEP, am = a0 + STEP / 2;
          ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath();
          ctx.fillStyle = i % 2 ? T.card2 : T.card1; ctx.fill();
          const live = (state === 'spin' && i === under) ? .16 : 0;
          const fl = i === flashIdx ? Math.max(0, flashT) * .3 : 0;
          if (live + fl > 0) { ctx.fillStyle = `rgba(255,230,170,${live + fl})`; ctx.fill(); }
          ctx.lineWidth = 1; ctx.strokeStyle = T.golddim; ctx.stroke();
          const isHot = i === hot && hot >= 0 && state !== 'settle';
          if (isHot) {
            const k = .5 + .5 * Math.sin(resultT * 5);
            ctx.save(); ctx.globalAlpha = .6 + .25 * k; ctx.fillStyle = T.gold; ctx.fill(); ctx.restore(); ctx.lineWidth = 2.5; ctx.strokeStyle = T.gold2; ctx.shadowColor = T.gold2; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
          }
          /* rótulo */
          ctx.save(); const rm = lblR; ctx.translate(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm);
          const cs = Math.cos(am); ctx.rotate(am + (cs < -.001 ? Math.PI : 0));
          const L = labels[i], fs = L.fs * (isHot ? 1.04 : 1);
          const col = isHot ? T.ink : T.bone;
          L.lines.forEach((ln, k) => { const dy = (k - (L.lines.length - 1) / 2) * fs * 1.12; text(ctx, ln, 0, dy, `${isHot ? 700 : 600} ${fs}px ${BODY}`, col); });
          ctx.restore();
        }
        /* aro com lâmpadas */
        ctx.lineWidth = R * .07; ctx.strokeStyle = T.golddim; ctx.beginPath(); ctx.arc(cx, cy, R * .965, 0, 6.283); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = T.gold; ctx.beginPath(); ctx.arc(cx, cy, R * .93, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
        const bulbs = 24, run = state === 'spin' ? t * 14 : state === 'final' || state === 'final-wait' || state === 'choose' ? t * 3 : t * 1.2;
        for (let i = 0; i < bulbs; i++) {
          const a = i / bulbs * 6.283, on = (Math.floor(run) + i) % 3 === 0;
          ctx.fillStyle = on ? T.gold2 : T.golddim; if (on) { ctx.shadowColor = T.gold2; ctx.shadowBlur = 6; }
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * .965, cy + Math.sin(a) * R * .965, R * .017, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        }
        /* miolo */
        const hg = ctx.createRadialGradient(cx, cy, 2, cx, cy, r0); hg.addColorStop(0, T.card1); hg.addColorStop(1, T.card2);
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, r0, 0, 6.283); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = T.gold; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = T.golddim; ctx.beginPath(); ctx.arc(cx, cy, r0 - 5, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = .35; for (let i = 0; i < N; i++) { const a = i * STEP - Math.PI / 2; ctx.strokeStyle = T.gold; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * .12, cy + Math.sin(a) * R * .12); ctx.lineTo(cx + Math.cos(a) * (r0 - 8), cy + Math.sin(a) * (r0 - 8)); ctx.stroke(); } ctx.globalAlpha = 1;
        bottle(t);
        ctx.fillStyle = T.gold; ctx.beginPath(); ctx.arc(cx, cy, R * .028, 0, 6.283); ctx.fill();
      }

      function update(dt, t) {
        flashT = Math.max(0, flashT - dt * 5); resultT += dt;
        if (state === 'spin') {
          omega *= Math.exp(-.95 * dt); const sgn = Math.sign(omega); omega -= sgn * Math.min(Math.abs(omega), .55 * dt);
          theta += omega * dt;
          const idx = Math.floor((theta + STEP / 2) / STEP);
          if (idx !== lastIdx) {
            lastIdx = idx;
            const now = performance.now();
            if (now - lastTick > 32) { lastTick = now; E.sfx('tick', idx % 2 === 0); if (Math.abs(omega) < 8) E.vibe(4); }
            flashIdx = ((idx % N) + N) % N; flashT = 1;
          }
          if (Math.abs(omega) < .6) { omega = 0; onStop(); }
        } else if (state === 'settle') {
          settleT += dt;
          const acc = (target - theta) * 200 - snapV * 8.5; snapV += acc * dt; theta += snapV * dt;
          if (settleT > .9 && Math.abs(snapV) < .06 && Math.abs(target - theta) < .01) { theta = target; onResult(); }
          else if (settleT > 1.6) { theta = target; onResult(); }
        }
      }
      const stop = E.loop((dt, t) => { update(dt, t); draw(t); });

      return function cleanup() {
        stop(); timers.forEach(clearTimeout); timers.clear();
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
        root.innerHTML = '';
      };
    }
  };
})();
