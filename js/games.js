/* =====================================================================
   GAMES — Xícara (pour) · Frigideira (tapioca) · Termômetro (rub) · Constelação (stars)
   Contrato: window.GAMES.<id> = { mount(root, api) -> cleanup }
   api = { spicy, who, rival:{name,score}|null, replay, done(pts,msg,data), msg(text) }
   ===================================================================== */
(function () {
  const E = window.E;
  const G = window.GAMES = window.GAMES || {};
  const PIX = '"Pixelify Sans", "Courier New", monospace';

  const CSS = `
.g-wrap{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;gap:10px;position:relative}
.g-cv{border-radius:14px;touch-action:none;user-select:none;-webkit-user-select:none}
.g-row{display:flex;gap:10px;justify-content:center;width:100%}
.g-btn{font-family:'Pixelify Sans',monospace;font-size:1.05rem;letter-spacing:.06em;color:var(--ink);background:linear-gradient(180deg,var(--gold2),var(--gold));border-radius:14px;padding:13px 22px;min-width:190px;min-height:52px;
  box-shadow:0 5px 0 var(--golddim),0 10px 22px -8px rgba(0,0,0,.6);transition:transform .08s,box-shadow .08s;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.g-btn:active,.g-btn.on{transform:translateY(4px);box-shadow:0 1px 0 var(--golddim),0 4px 10px -6px rgba(0,0,0,.6)}
.g-btn[disabled]{opacity:.45;transform:none}
.g-done{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%;min-height:180px;text-align:center}
.g-done b{font:400 46px/1 'IM Fell English SC',Georgia,serif;color:var(--gold);text-shadow:0 0 18px var(--golddim)}
.g-done span{font:400 1.1rem/1.2 'Pixelify Sans',monospace;color:var(--gold2);letter-spacing:.08em}
`;
  if (!document.getElementById('g-style')) { const s = document.createElement('style'); s.id = 'g-style'; s.textContent = CSS; document.head.appendChild(s); }

  function replayView(root, api, glyph = '✦') {
    root.innerHTML = `<div class="g-done"><b>${glyph}</b><span>Já jogado</span></div>`;
    api.msg('Já jogado ✦');
    return () => {};
  }
  const rivalTxt = (api, mine) => {
    if (!api.rival) return '';
    const d = Math.round(mine - api.rival.score);
    return d > 0 ? ` Ganhou de ${api.rival.name} por ${d}! 🏆` : d === 0 ? ` Empatou com ${api.rival.name}!` : ` ${api.rival.name} ainda tá na frente por ${-d} 😅`;
  };
  function dims(root, maxH = 330, minH = 200) {
    const W = Math.min(root.clientWidth || 320, 380);
    const H = E.clamp((root.clientHeight || 360) - 72, minH, maxH);
    return { W, H };
  }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function hud(x, W, left, right, T) {
    x.font = `500 13px ${PIX}`; x.textBaseline = 'top';
    x.fillStyle = T.gold2; x.textAlign = 'left'; x.fillText(left, 10, 9);
    x.textAlign = 'right'; x.fillText(right, W - 10, 9);
  }

  /* =================================================================
     1) A XÍCARA — segure pra servir até a linha dourada
     ================================================================= */
  G.pour = {
    mount(root, api) {
      if (api.replay) return replayView(root, api, '☕');
      const T = E.theme(), sp = api.spicy;
      const { W, H } = dims(root, 320, 220);
      root.innerHTML = `<div class="g-wrap"></div>`;
      const wrap = root.firstChild;
      const { cv, ctx: x } = E.canvas(wrap, W, H); cv.className = 'g-cv';
      const row = document.createElement('div'); row.className = 'g-row';
      row.innerHTML = `<button class="g-btn">Segure pra servir</button>`; wrap.appendChild(row);
      const btn = row.firstChild;

      const cupW = Math.min(W * .5, 170), cupH = Math.min(H * .52, 150);
      const cx = W * .46, cupTop = H - cupH - 34, cupBot = H - 34;
      const target = E.rand(.62, .8), tol = .07;
      const color = { preto: '#2B1608', leite: '#A0673A', cha: '#B5651D', agua: '#7FB8C9' }[api.drink] || '#3A1E0C';
      let L = 0, rate = 0, pouring = false, done = false, busy = false, wave = 0, settle = 0, judged = true, tilt = 0, t = 0, overflowT = 0;
      const bubbles = [];
      const best = api.rival ? `Recorde: ${api.rival.name} ${api.rival.score}` : '';
      api.msg(sp ? 'Devagar… segura firme 😏' : 'Nem mais, nem menos. Linha dourada.');

      const down = e => { if (done || busy) return; e.preventDefault(); E.audio.init(); pouring = true; judged = false; btn.classList.add('on'); E.audio.loopStart('pour'); };
      const up = () => { if (!pouring) return; pouring = false; btn.classList.remove('on'); E.audio.loopStop('pour'); settle = .45; };
      btn.addEventListener('pointerdown', down); cv.addEventListener('pointerdown', down);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => { btn.addEventListener(ev, up); cv.addEventListener(ev, up); });
      btn.addEventListener('contextmenu', e => e.preventDefault());
      const key = e => { if (e.code === 'Space') { e.type === 'keydown' ? down(e) : up(); } };
      addEventListener('keydown', key); addEventListener('keyup', key);

      function judge() {
        const d = L - target;
        if (d < -tol) { api.msg(E.pick(['Faltou um tiquinho. Segura mais um pouco.', 'Quase lá! Mais um gole.', 'Tá pela metade da metade… bora!'])); E.sfx('tick', false); return; }
        let pts, m;
        if (Math.abs(d) <= tol) {
          const p = 1 - Math.abs(d) / tol; pts = 50 + Math.round(50 * p);
          if (p > .7) { E.banner('PERFEITO!', 'na linha dourada'); E.achieve('pour-perfect', '☕', 'Barista de mão firme', api.who); m = sp ? 'Na medida certa. Gosto de quem tem controle 😏' : 'Na medida exata! Contratado(a) ✦'; }
          else m = sp ? 'Quase perfeito… mas eu gosto de quase 😏' : 'Boa! Pertinho da linha.';
        } else { pts = 30; m = sp ? 'Passou um pouquinho… a gente gosta de exagero 😏' : 'Passou da linha, mas café a mais ninguém recusa.'; }
        done = true; btn.disabled = true; btn.textContent = `+${pts}`;
        api.done(pts, m + rivalTxt(api, pts), { pts });
      }
      function spill() {
        busy = true; E.audio.loopStop('pour'); pouring = false; btn.classList.remove('on');
        E.sfx('hit'); E.shake(10); E.vibe(70); overflowT = 1;
        const r = cv.getBoundingClientRect();
        E.fx.burst(r.left + cx * (r.width / W), r.top + cupTop * (r.height / H), { n: 40, colors: [color, '#6B3A1A', T.bone], shapes: ['circle'], angle: -Math.PI / 2, spread: 1.4, speed: [120, 320], gravity: 700 });
        api.msg(sp ? 'Transbordou… calma, é só o começo 😏' : E.pick(['Transbordou! 😅 Bora de novo.', 'Eita, molhou a toalha da Luh! De novo.']));
        setTimeout(() => { E.tween({ v: L }, { v: 0 }, { dur: 500, onUpdate: o => L = o.v }).then(() => { busy = false; }); }, 650);
      }
      const stop = E.loop((dt, now) => {
        t += dt;
        if (pouring && !busy) {
          rate = Math.min(rate + dt * .55, .5); L += dt * (.16 + rate);
          wave = Math.min(1, wave + dt * 3);
          if (Math.random() < .5) bubbles.push({ x: cx + E.rand(-cupW * .3, cupW * .3), y: 0, s: E.rand(1, 3), v: E.rand(20, 50), life: 1 });
          if (L > 1.03) spill();
        } else rate = Math.max(0, rate - dt * 2);
        tilt += ((pouring && !busy ? 1 : 0) - tilt) * Math.min(1, dt * 10);
        wave = Math.max(0, wave - dt * .9);
        if (!pouring && !judged && !busy && !done) { settle -= dt; if (settle <= 0) { judged = true; judge(); } }
        if (done && Math.random() < .25) { const r = cv.getBoundingClientRect(); E.fx.steam(r.left + cx * r.width / W, r.top + (cupTop + 6) * r.height / H); }
        overflowT = Math.max(0, overflowT - dt * 2);
        draw();
      });
      function cupPath() {
        const l = cx - cupW / 2, r = cx + cupW / 2;
        x.beginPath(); x.moveTo(l, cupTop); x.lineTo(r, cupTop); x.lineTo(r - cupW * .08, cupBot - 14);
        x.quadraticCurveTo(r - cupW * .1, cupBot, r - cupW * .2, cupBot); x.lineTo(l + cupW * .2, cupBot);
        x.quadraticCurveTo(l + cupW * .1, cupBot, l + cupW * .08, cupBot - 14); x.closePath();
      }
      function draw() {
        x.clearRect(0, 0, W, H);
        const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, 'rgba(0,0,0,.18)'); bg.addColorStop(1, 'rgba(0,0,0,.35)');
        x.fillStyle = bg; roundRect(x, 0, 0, W, H, 14); x.fill();
        hud(x, W, best, `${Math.round(Math.min(L, 1) * 100)}%`, T);
        // pires
        x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx, cupBot + 10, cupW * .78, 12, 0, 0, 6.283); x.fill();
        x.fillStyle = T.bone; x.beginPath(); x.ellipse(cx, cupBot + 4, cupW * .72, 11, 0, 0, 6.283); x.fill();
        x.strokeStyle = T.gold; x.lineWidth = 2; x.stroke();
        // alça
        x.strokeStyle = T.bone; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.ellipse(cx + cupW / 2 + 4, cupTop + cupH * .42, cupW * .16, cupH * .2, 0, -1.4, 1.4); x.stroke();
        // corpo
        cupPath(); x.fillStyle = T.bone; x.fill();
        // líquido
        x.save(); cupPath(); x.clip();
        const lv = cupBot - Math.min(L, 1.03) * (cupBot - cupTop);
        x.fillStyle = color; x.beginPath(); x.moveTo(cx - cupW, cupBot + 4);
        for (let i = 0; i <= 30; i++) { const px = cx - cupW / 2 + i / 30 * cupW; x.lineTo(px, lv + Math.sin(i * .7 + t * 9) * 3.5 * (wave + .15) + Math.sin(i * .3 - t * 5) * 1.5 * wave); }
        x.lineTo(cx + cupW, cupBot + 4); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,220,170,.25)'; x.fillRect(cx - cupW / 2, lv - 1, cupW, 3);
        for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y += b.v * (1 / 60); b.life -= .02; if (b.life <= 0) { bubbles.splice(i, 1); continue; } x.globalAlpha = b.life * .6; x.fillStyle = '#F6D9B0'; x.beginPath(); x.arc(b.x, lv + 8 + b.y * .4, b.s, 0, 6.283); x.fill(); }
        x.globalAlpha = 1;
        x.restore();
        // brilho e aro
        cupPath(); x.strokeStyle = T.gold; x.lineWidth = 2.5; x.stroke();
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(cx - cupW / 2 + 10, cupTop + 10, 6, cupH * .55);
        // linha alvo
        const ty = cupBot - target * (cupBot - cupTop), band = tol * (cupBot - cupTop);
        x.fillStyle = 'rgba(240,215,154,.13)'; x.fillRect(cx - cupW / 2 - 14, ty - band, cupW + 28, band * 2);
        x.setLineDash([7, 5]); x.lineDashOffset = -t * 20; x.strokeStyle = T.gold2; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - cupW / 2 - 18, ty); x.lineTo(cx + cupW / 2 + 18, ty); x.stroke(); x.setLineDash([]);
        x.fillStyle = T.gold2; x.font = `500 11px ${PIX}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('◄ aqui', cx + cupW / 2 + 22, ty);
        // bule
        const px = cx + cupW * .55, py = cupTop - 46;
        x.save(); x.translate(px, py); x.rotate(-.15 - tilt * .55);
        x.fillStyle = T.golddim; x.beginPath(); x.ellipse(0, 0, 34, 26, 0, 0, 6.283); x.fill();
        x.fillStyle = T.gold; x.beginPath(); x.ellipse(0, -4, 34, 22, 0, 0, 6.283); x.fill();
        x.strokeStyle = T.gold; x.lineWidth = 8; x.beginPath(); x.moveTo(-28, 0); x.quadraticCurveTo(-52, -2, -60, -18); x.stroke();
        x.lineWidth = 6; x.beginPath(); x.arc(32, -2, 14, -1.2, 1.2); x.stroke();
        x.fillStyle = T.gold2; x.beginPath(); x.ellipse(0, -24, 12, 5, 0, 0, 6.283); x.fill();
        x.restore();
        // fio de café
        if (tilt > .3 && !busy) {
          const sx = px - 56, sy = py + 2;
          x.strokeStyle = color; x.lineCap = 'round'; x.lineWidth = 2 + tilt * 4 + Math.sin(t * 40);
          x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx - 6, (sy + lv) / 2, cx + 4, lv); x.stroke();
        }
        if (overflowT > 0) { x.fillStyle = `rgba(224,49,75,${overflowT * .25})`; roundRect(x, 0, 0, W, H, 14); x.fill(); }
      }
      draw();
      return () => { stop(); E.audio.loopStop('pour'); removeEventListener('keydown', key); removeEventListener('keyup', key); };
    }
  };

  /* =================================================================
     2) A FRIGIDEIRA — vire a tapioca no tempo certo
     ================================================================= */
  G.tapioca = {
    mount(root, api) {
      if (api.replay) return replayView(root, api, '◯');
      const T = E.theme(), sp = api.spicy;
      const { W, H } = dims(root, 320, 220);
      root.innerHTML = `<div class="g-wrap"></div>`;
      const wrap = root.firstChild;
      const { cv, ctx: x } = E.canvas(wrap, W, H); cv.className = 'g-cv';
      const row = document.createElement('div'); row.className = 'g-row';
      row.innerHTML = `<button class="g-btn">Virar!</button>`; wrap.appendChild(row);
      const btn = row.firstChild;
      const tap = E.sprites.get('tapioca', 160);
      const panR = Math.min(W * .3, (H - 70) * .46), pcx = W * .44, pcy = (H - 46) * .5 + 8;
      const barY = H - 30, barX = 24, barW = W - 48;
      let pos = 0, dir = 1, tries = 0, z0, zw, state = 'play', flip = 0, golden = 0, squash = 0, t = 0, shakePan = 0;
      const bubbles = [];
      function newZone() { zw = Math.max(.12, .24 - tries * .04); z0 = E.rand(.1, .9 - zw); }
      newZone();
      api.msg(sp ? 'Tem que ter mão boa pra virar 😏' : 'Espera dourar… e vira na faixa!');
      function hit() {
        if (state !== 'play') return; E.audio.init();
        const c = z0 + zw / 2, d = Math.abs(pos - c);
        if (pos >= z0 && pos <= z0 + zw) {
          const perfect = d < zw * .18;
          const pts = perfect ? 100 : 70 - tries * 10;
          go(pts, perfect ? (sp ? 'No ponto. Gosto assim 😏' : 'NO PONTO! Tapioca de vitrine ✦') : (sp ? 'Que mão, hein? Sabe virar direitinho 😏' : 'Virou bonito! Tá contratado(a) ✦'), perfect);
        } else {
          tries++; E.sfx('boing'); E.vibe(50); shakePan = 1;
          const r = cv.getBoundingClientRect(); E.fx.burst(r.left + pcx * r.width / W, r.top + pcy * r.height / H, { n: 14, shapes: ['smoke'], colors: [T.bone], speed: [20, 70], gravity: -60, size: [4, 8] });
          if (tries >= 3) go(20, sp ? 'Deixa que a gente vira você… digo, a tapioca 😏' : 'Deixa que a Luh vira pra você 😄', false);
          else { api.msg(['Grudou! 😬 Tenta de novo.', 'Quase! Mais uma, agora mais rápido.'][tries - 1]); newZone(); }
        }
      }
      function go(pts, m, perfect) {
        state = 'flip'; flip = 0; btn.disabled = true; E.sfx('jump');
        setTimeout(() => {
          state = 'done'; golden = 1; squash = 1; E.sfx('pop'); E.vibe([20, 30, 40]);
          const r = cv.getBoundingClientRect(); E.fx.burst(r.left + pcx * r.width / W, r.top + pcy * r.height / H, { n: 30, shapes: ['circle'], colors: ['#FFF6E0', T.gold2], speed: [60, 200], size: [1.5, 3.5] });
          if (perfect) { E.banner('NO PONTO!', 'tapioca de vitrine'); E.achieve('tap-perfect', '🫓', 'Tapioqueiro(a) raiz', api.who); }
          btn.textContent = `+${pts}`;
          api.done(pts, m + rivalTxt(api, pts), { pts });
        }, 900);
      }
      btn.addEventListener('click', hit);
      const key = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); hit(); } };
      addEventListener('keydown', key);
      const stop = E.loop(dt => {
        t += dt;
        if (state === 'play') { pos += dir * dt * (.8 + tries * .28); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } }
        if (state === 'flip') flip = Math.min(1, flip + dt / .9);
        squash = Math.max(0, squash - dt * 2.5); shakePan = Math.max(0, shakePan - dt * 3);
        if (Math.random() < .35) bubbles.push({ a: Math.random() * 6.28, d: Math.random() * panR * .75, r: 0, life: 1 });
        draw();
      });
      function draw() {
        x.clearRect(0, 0, W, H);
        x.fillStyle = 'rgba(0,0,0,.25)'; roundRect(x, 0, 0, W, H, 14); x.fill();
        hud(x, W, api.rival ? `Recorde: ${api.rival.name} ${api.rival.score}` : '', `tentativa ${Math.min(tries + 1, 3)}/3`, T);
        const sx = shakePan ? E.rand(-1, 1) * 6 * shakePan : 0;
        x.save(); x.translate(pcx + sx, pcy);
        // fogo
        for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; x.fillStyle = `rgba(80,140,255,${.25 + .2 * Math.sin(t * 20 + i)})`; x.beginPath(); x.ellipse(Math.cos(a) * panR * .7, panR * .95, 6, 10 + Math.sin(t * 25 + i) * 3, 0, 0, 6.283); x.fill(); }
        // cabo
        x.fillStyle = '#2A1B12'; roundRect(x, panR * .9, -10, panR * .95, 20, 10); x.fill();
        x.fillStyle = T.golddim; x.fillRect(panR * 1.6, -6, 8, 12);
        // frigideira
        const pg = x.createRadialGradient(-panR * .3, -panR * .3, 4, 0, 0, panR); pg.addColorStop(0, '#55555E'); pg.addColorStop(1, '#17171C');
        x.fillStyle = pg; x.beginPath(); x.arc(0, 0, panR, 0, 6.283); x.fill();
        x.strokeStyle = '#33333A'; x.lineWidth = 7; x.stroke();
        // bolhinhas da chapa
        for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.r += .25; b.life -= .03; if (b.life <= 0) { bubbles.splice(i, 1); continue; } x.globalAlpha = b.life * .5; x.strokeStyle = '#fff'; x.lineWidth = 1; x.beginPath(); x.arc(Math.cos(b.a) * b.d, Math.sin(b.a) * b.d, b.r, 0, 6.283); x.stroke(); }
        x.globalAlpha = 1;
        // tapioca
        let ty = 0, sy = 1, sxs = 1, rot = 0;
        if (state === 'flip') { const k = flip; ty = -Math.sin(k * Math.PI) * (panR * 1.6); sy = Math.cos(k * Math.PI * 2); rot = k * .6; }
        if (squash) { sxs = 1 + squash * .18; sy = 1 - squash * .15; }
        x.save(); x.translate(0, ty); x.rotate(rot); x.scale(sxs, Math.abs(sy) < .08 ? .08 : sy);
        const s = panR * 1.62; x.drawImage(tap, -s / 2, -s / 2, s, s);
        if (golden || (state === 'flip' && sy < 0)) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(214,150,60,.45)'; x.beginPath(); x.arc(0, 0, s * .48, 0, 6.283); x.fill(); x.globalCompositeOperation = 'source-over';
          x.fillStyle = 'rgba(140,80,20,.35)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(Math.cos(i * 2.1) * s * .3, Math.sin(i * 1.7) * s * .25, 3, 0, 6.283); x.fill(); } }
        x.restore(); x.restore();
        // barra de tempo
        roundRect(x, barX, barY - 9, barW, 18, 9); x.fillStyle = 'rgba(0,0,0,.4)'; x.fill(); x.strokeStyle = T.golddim; x.lineWidth = 1.5; x.stroke();
        const zg = x.createLinearGradient(barX + z0 * barW, 0, barX + (z0 + zw) * barW, 0); zg.addColorStop(0, T.gold); zg.addColorStop(.5, T.gold2); zg.addColorStop(1, T.gold);
        x.fillStyle = zg; roundRect(x, barX + z0 * barW, barY - 7, zw * barW, 14, 7); x.fill();
        x.fillStyle = '#fff'; x.fillRect(barX + (z0 + zw / 2) * barW - 1.5, barY - 7, 3, 14);
        const nx = barX + pos * barW; x.fillStyle = T.bone; x.shadowColor = '#fff'; x.shadowBlur = 10; roundRect(x, nx - 3, barY - 13, 6, 26, 3); x.fill(); x.shadowBlur = 0;
      }
      return () => { stop(); removeEventListener('keydown', key); };
    }
  };

  /* =================================================================
     3) O TERMÔMETRO — esfregue pra esquentar (fluxo quente)
     ================================================================= */
  G.rub = {
    mount(root, api) {
      if (api.replay) return replayView(root, api, '🔥');
      const T = E.theme();
      const { W, H } = dims(root, 300, 210);
      root.innerHTML = `<div class="g-wrap"></div>`;
      const wrap = root.firstChild;
      const { cv, ctx: x } = E.canvas(wrap, W, H); cv.className = 'g-cv';
      const tw = 46, tx = 14, padX = tx + tw + 14, padW = W - padX - 10, padY = 30, padH = H - 42;
      let heat = 0, down = false, lx = 0, ly = 0, step = 0, done = false, t = 0, t0 = null, broke = 0;
      const trail = [];
      const LV = ['Devagar ou rápido… você que sabe 😏', 'Hmm, esquentando…', 'Tá ficando bom…', 'Não para agora 🔥', 'Quase lá…'];
      api.msg(LV[0]);
      const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
      cv.addEventListener('pointerdown', e => { E.audio.init(); down = true; [lx, ly] = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} if (t0 === null) t0 = t; });
      cv.addEventListener('pointermove', e => {
        if (!down || done) return; const [nx, ny] = pt(e); const d = Math.hypot(nx - lx, ny - ly);
        heat = Math.min(1, heat + d / 2000); trail.push({ x: nx, y: ny, life: 1 }); lx = nx; ly = ny;
        const s = Math.floor(heat * 5);
        if (s > step) { step = s; E.sfx('sizzle', s); E.vibe(s * 6); api.msg(LV[Math.min(s, 4)]); const r = cv.getBoundingClientRect(); E.fx.burst(e.clientX, e.clientY, { n: 10 + s * 4, shapes: ['heart', 'circle'], speed: [60, 200] }); }
        if (heat >= 1) finish();
      });
      ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => down = false));
      function finish() {
        done = true; broke = 1; down = false;
        const secs = Math.max(1, t - (t0 ?? t)); const pts = E.clamp(Math.round(110 - secs * 8), 50, 100);
        E.flash('radial-gradient(circle,rgba(255,120,140,.9),rgba(224,49,75,.5) 35%,transparent 75%)'); E.sfx('sexy'); E.shake(14);
        const r = cv.getBoundingClientRect(); E.fx.burst(r.left + (tx + tw / 2) * r.width / W, r.top + 40, { n: 60, shapes: ['spark', 'circle'], colors: ['#E8F7FF', '#FFFFFF', T.ember], speed: [150, 420] });
        E.banner('PELANDO!', `${secs.toFixed(1)}s de pura dedicação`, { cls: 'hot' });
        if (secs < 3) E.achieve('rub-fast', '🔥', 'Mão quente', api.who);
        api.done(pts, 'Tá quente, hein? Agora sim, as perguntas de verdade 😈' + rivalTxt(api, pts), { secs: +secs.toFixed(1) });
      }
      const stop = E.loop(dt => {
        t += dt;
        if (!done && !down) { heat = Math.max(0, heat - dt * .05); step = Math.floor(heat * 5); }
        broke = Math.max(0, broke - dt * .4);
        draw();
      });
      function draw() {
        x.clearRect(0, 0, W, H);
        x.fillStyle = 'rgba(0,0,0,.22)'; roundRect(x, 0, 0, W, H, 14); x.fill();
        hud(x, W, api.rival ? `Recorde: ${api.rival.name} ${api.rival.score}` : '', `${Math.round(heat * 100)}°`, T);
        // pad
        const g = x.createRadialGradient(padX + padW / 2, padY + padH / 2, 10, padX + padW / 2, padY + padH / 2, padW * .8);
        g.addColorStop(0, `rgba(224,49,75,${.15 + heat * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; roundRect(x, padX, padY, padW, padH, 16); x.fill();
        x.setLineDash([6, 6]); x.strokeStyle = T.gold; x.lineWidth = 1.5; x.stroke(); x.setLineDash([]);
        if (heat < .05 && !done) { x.fillStyle = T.gold2; x.font = `italic 18px "IM Fell English", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Esfregue aqui ✋', padX + padW / 2, padY + padH / 2 + Math.sin(t * 3) * 4); }
        for (let i = trail.length - 1; i >= 0; i--) { const p = trail[i]; p.life -= .04; if (p.life <= 0) { trail.splice(i, 1); continue; }
          x.globalAlpha = p.life; const tg = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22); tg.addColorStop(0, T.gold2); tg.addColorStop(.4, T.ember); tg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = tg; x.beginPath(); x.arc(p.x, p.y, 22, 0, 6.283); x.fill(); }
        x.globalAlpha = 1;
        if (done) { x.font = '54px system-ui, "Apple Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🔥', padX + padW / 2, padY + padH / 2 + Math.sin(t * 6) * 4); }
        // termômetro
        const top = padY, bot = H - 36;
        roundRect(x, tx + tw / 2 - 11, top, 22, bot - top, 11); x.fillStyle = 'rgba(0,0,0,.4)'; x.fill(); x.strokeStyle = T.gold; x.lineWidth = 2; x.stroke();
        const mh = (bot - top - 8) * heat;
        const mg = x.createLinearGradient(0, bot, 0, top); mg.addColorStop(0, T.ember); mg.addColorStop(1, '#FF8FA3');
        x.fillStyle = mg; roundRect(x, tx + tw / 2 - 6, bot - mh - 4, 12, mh + 8, 6); x.fill();
        x.beginPath(); x.arc(tx + tw / 2, bot + 6, 17, 0, 6.283); x.fillStyle = T.ember; x.fill(); x.strokeStyle = T.gold; x.stroke();
        for (let i = 1; i < 5; i++) { const y = bot - (bot - top) * i / 5; x.strokeStyle = T.gold; x.lineWidth = 1.5; x.beginPath(); x.moveTo(tx + tw / 2 + 13, y); x.lineTo(tx + tw / 2 + 20, y); x.stroke(); }
        if (broke) { x.strokeStyle = `rgba(255,255,255,${broke})`; x.lineWidth = 2; x.beginPath(); x.moveTo(tx + tw / 2 - 8, top + 6); x.lineTo(tx + tw / 2 + 4, top + 22); x.lineTo(tx + tw / 2 - 5, top + 34); x.stroke(); }
      }
      return () => stop();
    }
  };

  /* =================================================================
     4) A CONSTELAÇÃO — ligue as estrelas (rápido vale bônus)
     ================================================================= */
  G.stars = {
    mount(root, api) {
      if (api.replay) return replayView(root, api, '✦');
      const T = E.theme(), sp = api.spicy;
      const { W, H } = dims(root, 300, 220);
      root.innerHTML = `<div class="g-wrap"></div>`;
      const wrap = root.firstChild;
      const { cv, ctx: x } = E.canvas(wrap, W, H); cv.className = 'g-cv';
      const base = sp ? [[.5, .9], [.24, .64], [.15, .36], [.3, .14], [.5, .3], [.7, .14], [.85, .36], [.76, .64]] : [[.1, .3], [.3, .78], [.5, .4], [.7, .82], [.9, .22]];
      const P = base.map(([a, b]) => [24 + a * (W - 48), 40 + b * (H - 66)]);
      const name = sp ? 'Coração' : 'Cassiopeia';
      let n = 0, t = 0, t0 = null, done = false, lines = [], shoot = null, wrong = 0;
      const bg = Array.from({ length: 70 }, () => [Math.random() * W, Math.random() * H, Math.random() * 1.3 + .3, Math.random() * 6]);
      api.msg('Toque na estrela que pulsa ✦');
      cv.addEventListener('pointerdown', e => {
        if (done) return; E.audio.init(); if (t0 === null) t0 = t;
        const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height;
        const i = P.findIndex(p => Math.hypot(p[0] - px, p[1] - py) < 30);
        if (i !== n) { E.sfx('tick', false); wrong = 1; return; }
        if (n > 0) lines.push({ a: n - 1, b: n, k: 0 });
        E.sfx('note', n); E.vibe(8); E.fx.burst(e.clientX, e.clientY, { n: 12, shapes: ['star'], speed: [40, 140], size: [1.5, 3] });
        n++;
        if (n === P.length) finish();
      });
      function finish() {
        done = true; if (sp) lines.push({ a: P.length - 1, b: 0, k: 0 });
        const secs = t - t0; const pts = 50 + E.clamp(Math.round(50 - secs * 6), 0, 50);
        shoot = { x: -20, y: E.rand(10, H * .4), k: 0 };
        setTimeout(() => {
          E.sfx('win');
          if (secs < 4) E.achieve('stars-fast', '🌠', 'Astrônomo(a) relâmpago', api.who);
          api.done(pts, (sp ? 'Um coração no céu. Os astros entenderam o recado 😏' : 'Cassiopeia acendeu. A agenda dos astros está aberta ✦') + ` (${secs.toFixed(1)}s)`, { secs: +secs.toFixed(1) });
        }, 450);
      }
      const stop = E.loop(dt => { t += dt; lines.forEach(l => l.k = Math.min(1, l.k + dt * 4)); wrong = Math.max(0, wrong - dt * 3); if (shoot) shoot.k += dt; draw(); });
      function star(cx, cy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .42 : r, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
      function draw() {
        x.clearRect(0, 0, W, H);
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(5,5,20,.55)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
        x.fillStyle = g; roundRect(x, 0, 0, W, H, 14); x.fill();
        bg.forEach(s => { x.globalAlpha = .25 + .3 * Math.sin(t * 2 + s[3]); x.fillStyle = T.bone; x.fillRect(s[0], s[1], s[2], s[2]); }); x.globalAlpha = 1;
        hud(x, W, done ? name : `${n}/${P.length}`, t0 !== null && !done ? `${(t - t0).toFixed(1)}s` : '', T);
        x.strokeStyle = T.gold2; x.lineWidth = 2.5; x.lineCap = 'round'; x.shadowColor = T.gold; x.shadowBlur = 10;
        lines.forEach(l => { const a = P[l.a], b = P[l.b]; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(E.lerp(a[0], b[0], l.k), E.lerp(a[1], b[1], l.k)); x.stroke(); });
        x.shadowBlur = 0;
        P.forEach((p, i) => {
          const lit = i < n, nxt = i === n && !done;
          if (nxt) { const k = (Math.sin(t * 6) + 1) / 2; x.fillStyle = `rgba(240,215,154,${.15 + k * .3})`; x.beginPath(); x.arc(p[0], p[1], 16 + k * 8, 0, 6.283); x.fill(); }
          x.fillStyle = lit ? T.gold2 : T.golddim; star(p[0], p[1], lit ? 9 : 7);
          if (lit || done) { x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(p[0], p[1], 2, 0, 6.283); x.fill(); }
        });
        if (wrong) { x.fillStyle = `rgba(224,49,75,${wrong * .18})`; roundRect(x, 0, 0, W, H, 14); x.fill(); }
        if (shoot && shoot.k < 1.4) { const sx = -20 + shoot.k * (W + 80), sy = shoot.y + shoot.k * 60; const tg = x.createLinearGradient(sx - 70, sy - 30, sx, sy); tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(1, '#fff'); x.strokeStyle = tg; x.lineWidth = 2; x.beginPath(); x.moveTo(sx - 70, sy - 30); x.lineTo(sx, sy); x.stroke(); }
        if (done) { x.fillStyle = T.gold2; x.font = `italic 20px "IM Fell English", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(name, W / 2, H - 8); }
      }
      return () => stop();
    }
  };
})();
