/* =====================================================================
   APP — fluxo do convite
   sol → identidade → companhia → encruzilhada → perfil (P1) → [P2] → visita
   → dado → selar → raspadinha → spoiler do casal → final
   ===================================================================== */
(() => {
  const C = window.CAFE, K = window.CONTENT, GAMES = window.GAMES;

  /* ---------------- utilitários ---------------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmtLong = s => { const d = pd(s); return `${WD[d.getDay()]}, ${d.getDate()} de ${MO[d.getMonth()]}`; };
  const normEmail = s => String(s || '').trim().toLowerCase();
  const normTel = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length > 11 && d.startsWith('55')) d = d.slice(2); return d; };
  const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'][n] || n;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const first = n => String(n || '').trim().split(/\s+/)[0] || '';
  const okEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    $('#hud').classList.toggle('off', id === 's-seal');
    Mascot.visible(id === 's-deck');
    if (id !== 's-deck') $('#pips').innerHTML = '';
  }
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600); }
  function loader(on, txt) { $('#loader').classList.toggle('on', on); if (txt) $('#loadTxt').textContent = txt; }
  function fail(msg) { E.sfx('error'); E.vibe(40); toast(msg); }
  function fmtTel(v) { const d = normTel(v).slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : ''; if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`; }

  /* ---------------- estado ---------------- */
  const newP = () => ({ nome: '', email: '', telefone: '', ans: {}, mode: 'full', scores: {}, adult: false });
  const P = { guest: newP(), par: newP() };
  let stored = { par: null }, found = false, parMode = 'none', musicOn = false;
  const vis = { companhia: { par: false, parNome: '', criancas: 0, idades: '', outro: false, outroNome: '' } };
  let flow = 'mono';
  /* agenda: vem do servidor (aba Agenda da sala); config.js é só reserva */
  let agenda = { dias: C.DIAS || [1, 2, 3, 4, 5, 6], horas: C.HORAS, bloqueios: [], diasAFrente: C.DIAS_A_FRENTE || 35, umPorDia: true };
  let bookedFull = [];
  const DSHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function applySlots(r) {
    bookedFull = (r && r.booked) || [];
    if (r && r.config && Array.isArray(r.config.horas) && r.config.horas.length) agenda = { ...agenda, ...r.config };
    if (vis.data && !dayOk(vis.data)) { vis.data = null; vis.hora = null; }
    if (vis.hora && !horaOk(vis.data, vis.hora)) vis.hora = null;
  }
  const takenHoras = d => bookedFull.filter(b => b.data === d).map(b => b.hora);
  function horaOk(d, h) { return agenda.horas.includes(h) && !(d && !agenda.umPorDia && takenHoras(d).includes(h)); }
  function dayOk(d) {
    const dt = pd(d), first = new Date(); first.setHours(12, 0, 0, 0); first.setDate(first.getDate() + 1);
    const end = new Date(first); end.setDate(end.getDate() + agenda.diasAFrente);
    if (dt < first || dt > end || !agenda.dias.includes(dt.getDay()) || agenda.bloqueios.includes(d)) return false;
    return agenda.umPorDia ? !takenHoras(d).length : agenda.horas.some(h => !takenHoras(d).includes(h));
  }
  function diasTxt() {
    const ds = agenda.dias.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const seq = ds.map(d => (d + 6) % 7), cont = seq.every((v, i) => !i || v === seq[i - 1] + 1);
    return cont && ds.length > 2 ? `De ${DSHORT[ds[0]]} a ${DSHORT[ds[ds.length - 1]]}` : ds.map(d => DSHORT[d]).join(', ');
  }
  const addMin = (h, m) => { const [a, b] = h.split(':').map(Number), t = a * 60 + b + m; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const S = () => flow === 'spicy';
  const tx = v => K.tx(v, S());
  const flowOf = p => (K.FLUXOS[p.ans.fluxoTipo] || K.FLUXOS.nd).flow;
  const fluxoK = p => (K.FLUXOS[p.ans.fluxoTipo] || K.FLUXOS.nd).k;
  /* no fim, o tom é o do mais conservador: só fica quente se todo mundo que respondeu for do fluxo quente */
  const visitFlow = () => flowOf(P.guest) === 'spicy' && (['none', 'skip', 'copy'].includes(parMode) || flowOf(P.par) === 'spicy') ? 'spicy' : 'mono';
  const names = () => parMode !== 'none' ? `${first(P.guest.nome)} & ${first(P.par.nome)}` : first(P.guest.nome);

  function setFlow(f, fx = false) {
    const nf = f === 'spicy' ? 'spicy' : 'mono', changed = nf !== flow; flow = nf;
    document.body.classList.toggle('spicy', S());
    $('#themeColor').setAttribute('content', S() ? '#3A0E18' : '#1E1228');
    Sky.mood(flow);
    if (musicOn) E.music.play(flow);
    if (fx && changed) { if (S()) { E.sfx('sexy'); E.flash('radial-gradient(circle at 50% 50%,rgba(255,120,140,.9),rgba(224,49,75,.5) 35%,transparent 75%)'); } else E.sfx('whoosh'); }
  }

  /* ---------------- céu ambiente ---------------- */
  const Sky = (() => {
    const c = $('#sky'), x = c.getContext('2d');
    let W, H, stars = [], motes = [], mood = 'mono';
    const COL = { mono: { mote: '#D4AF6A', star: '#F1E6CF' }, spicy: { mote: '#E9A383', star: '#FCECE4' } };
    function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px'; x.setTransform(d, 0, 0, d, 0, 0); }
    const mote = any => ({ x: Math.random() * W, y: any ? Math.random() * H : H + 10, vy: -(5 + Math.random() * 14), r: Math.random() * 1.6 + .4, a: Math.random() * .5 + .15, w: Math.random() * 6.28 });
    size(); addEventListener('resize', size);
    for (let i = 0; i < 110; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + .2, p: Math.random() * 6.28, s: .4 + Math.random() * 1.4 });
    if (!E.calm) for (let i = 0; i < 26; i++) motes.push(mote(true));
    const heart = (cx, cy, r) => { x.beginPath(); x.moveTo(cx, cy + r * .9); x.bezierCurveTo(cx - r * 1.6, cy - r * .2, cx - r * .6, cy - r * 1.4, cx, cy - r * .45); x.bezierCurveTo(cx + r * .6, cy - r * 1.4, cx + r * 1.6, cy - r * .2, cx, cy + r * .9); x.fill(); };
    E.loop((dt, t) => {
      x.clearRect(0, 0, W, H); x.fillStyle = COL[mood].star;
      for (const s of stars) { x.globalAlpha = Math.max(0, .22 + .33 * Math.sin(t * s.s + s.p)); x.beginPath(); x.arc(s.x * W, s.y * H, s.r, 0, 6.283); x.fill(); }
      x.fillStyle = COL[mood].mote;
      for (const m of motes) { m.y += m.vy * dt; m.w += dt; m.x += Math.sin(m.w) * .25; if (m.y < -10) Object.assign(m, mote(false)); x.globalAlpha = m.a;
        if (mood === 'spicy' && m.r > 1.4) heart(m.x, m.y, m.r * 1.6); else { x.beginPath(); x.arc(m.x, m.y, m.r, 0, 6.283); x.fill(); } }
      x.globalAlpha = 1;
    });
    return { mood(m) { mood = m; } };
  })();

  /* ---------------- mascote ---------------- */
  const Mascot = (() => {
    const el = $('#mascot'), bub = $('#say'); let t;
    el.addEventListener('click', () => say(E.pick(K.SAY.nag)));
    function say(text, ms = 3600) {
      if (!text) return; bub.textContent = text; bub.classList.add('on');
      el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
      clearTimeout(t); t = setTimeout(() => bub.classList.remove('on'), ms);
    }
    return { say, visible(on) { el.classList.toggle('off', !on); if (!on) bub.classList.remove('on'); } };
  })();

  /* ---------------- HUD ---------------- */
  E.score.bind($('#score'));
  function setWho(key) {
    const el = $('#who');
    if (key === 'par') { el.textContent = `P2 · ${first(P.par.nome)}`; el.classList.add('p2'); }
    else { el.textContent = key === 'visit' ? `☉ ${names()}` : `P1 · ${first(P.guest.nome) || 'você'}`; el.classList.remove('p2'); }
  }
  $('#snd').classList.toggle('off', E.audio.muted);
  $('#snd').onclick = () => {
    E.audio.init(); const on = E.audio.toggle(); $('#snd').classList.toggle('off', !on);
    if (on && !musicOn) { E.music.prime(); E.music.play(flow); musicOn = true; }
  };

  /* ---------------- API (Apps Script ou demonstração) ---------------- */
  async function api(action, payload = {}) { return C.API_URL ? window.cafeApi(action, payload) : mock(action, payload); }
  function mockCfg(db) {
    const c = { dias: [1, 2, 3, 4, 5, 6], horaIni: '17:00', horaFim: '18:30', intervalo: 15, bloqueios: [], diasAFrente: 35, umPorDia: true, ...(db.config || {}) };
    const hs = []; for (let t = c.horaIni; t <= c.horaFim; t = addMin(t, c.intervalo)) { hs.push(t); if (hs.length > 60) break; }
    return { ...c, horas: hs };
  }
  function mock(action, b) {
    const db = store.get('cafe_mock') || { g: [], v: [] };
    const hoje = ymd(new Date()); let out;
    if (action === 'lookup') {
      const g = db.g.find(x => x.email === normEmail(b.email));
      if (!g) out = { ok: true, found: false };
      else if (g.telefone !== normTel(b.telefone)) out = { ok: true, found: false, mismatch: true };
      else { const p = db.v.filter(v => v.convidadoId === g.id && v.data >= hoje && v.status !== 'cancelada').sort((a, c) => (a.data + a.hora).localeCompare(c.data + c.hora))[0];
        out = { ok: true, found: true, guest: { nome: g.nome, email: g.email, telefone: g.telefone }, perfil: g.perfil, par: g.par && g.par.perfil ? { nome: g.par.nome, fluxo: g.par.fluxo, perfil: g.par.perfil } : null, proxima: p ? { data: p.data, hora: p.hora } : null }; }
    } else if (action === 'slots') {
      out = { ok: true, booked: db.v.filter(v => v.status !== 'cancelada' && v.data >= hoje).map(v => ({ data: v.data, hora: v.hora })), config: mockCfg(db) };
    } else if (action === 'save') {
      if (db.v.some(v => v.id === b.visita.id)) return Promise.resolve({ ok: true });
      const cfg = mockCfg(db);
      if (db.v.some(v => v.data === b.visita.data && v.status !== 'cancelada' && (cfg.umPorDia || v.hora === b.visita.hora))) return Promise.resolve({ ok: false, error: cfg.umPorDia ? 'Esse dia acabou de ser ocupado. Escolha outro.' : 'Esse horário acabou de ser ocupado. Escolha outro.' });
      const e = normEmail(b.guest.email), t = normTel(b.guest.telefone), agora = new Date().toISOString().slice(0, 16).replace('T', ' ');
      let g = db.g.find(x => x.email === e);
      if (!g) { g = { id: uid(), criadoEm: agora, email: e, telefone: t }; db.g.push(g); }
      g.nome = b.guest.nome; g.atualizadoEm = agora;
      if (b.perfil) { g.perfil = b.perfil; g.leitura = b.leitura; g.fluxo = b.fluxo; }
      if (b.par && b.par.perfil && b.par.modo !== 'pulou') g.par = { nome: b.par.nome, fluxo: b.par.fluxo, perfil: b.par.perfil, leitura: b.par.leitura };
      const par = b.par || (b.parKeep ? g.par : null);
      db.v.push({ criadoEm: agora, status: 'marcado', convidadoId: g.id, nome: g.nome, email: e, telefone: t, fluxo: g.fluxo, ...b.visita,
        parFluxo: par ? par.fluxo : '', parLeitura: par ? par.leitura : [] });
      store.set('cafe_mock', db); out = { ok: true };
    }
    return new Promise(res => setTimeout(() => res(out), 500));
  }

  /* =================================================================
     1. O SOL
     ================================================================= */
  const params = new URLSearchParams(location.search);
  const para = (params.get('para') || '').trim();
  if (para) $('#paraTxt').textContent = `Um chamado chegou para ${para}`;
  (function buildSun() {
    let rays = '';
    for (let i = 0; i < 28; i++) { const L = i % 2 ? 118 : 158, w = i % 2 ? 9 : 13, bend = i % 2 ? -12 : 14;
      rays += `<path d="M0,-${L} Q${bend},-${L - 42} ${w},-66 L-${w},-66 Q${-bend * .6},-${L - 50} 0,-${L}Z" transform="rotate(${i * (360 / 28)})"/>`; }
    $('#sunwrap').innerHTML = `<svg viewBox="-170 -170 340 340" aria-hidden="true"><defs>
      <radialGradient id="rg"><stop offset=".35" stop-color="#F0D79A"/><stop offset=".7" stop-color="#E8602C"/><stop offset="1" stop-color="#8A2E1A"/></radialGradient>
      <radialGradient id="cg" cx=".42" cy=".38"><stop offset="0" stop-color="#FFF1CF"/><stop offset=".6" stop-color="#F0C46A"/><stop offset="1" stop-color="#C88A36"/></radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <circle id="halo" r="90" fill="#E8602C" opacity="0" filter="url(#glow)"/><g id="rays" fill="url(#rg)">${rays}</g>
      <circle r="66" fill="none" stroke="#F0D79A" stroke-width=".8" opacity=".6"/><circle r="58" fill="url(#cg)"/>
      <circle r="46" fill="none" stroke="#8C5A26" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>
      <text x="0" y="12" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="34" fill="#5A2E14">D✦L</text></svg>`;
  })();
  let charge = 0, holding = false, lit = false, rot = 0;
  const sunwrap = $('#sunwrap'); sunwrap.tabIndex = 0;
  function startMusic() { E.audio.init(); if (!musicOn) { E.music.prime(); E.music.play('mono', .3); musicOn = true; } }
  sunwrap.addEventListener('pointerdown', e => {
    if (lit) return; e.preventDefault(); startMusic(); holding = true; E.audio.loopStart('riser');
    try { sunwrap.setPointerCapture(e.pointerId); } catch (_) {} E.vibe(8); $('#hint').textContent = 'Continue segurando…';
  });
  ['pointerup', 'pointercancel'].forEach(ev => sunwrap.addEventListener(ev, () => { holding = false; if (!lit && charge < 1) $('#hint').textContent = 'Segure o sol até ele acender (com som ligado 🔊)'; }));
  sunwrap.addEventListener('contextmenu', e => e.preventDefault());
  sunwrap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { startMusic(); ignite(); } });
  const stopSun = E.loop((dt, t) => {
    if (!lit) {
      charge = E.clamp(charge + (holding ? dt / 1.7 : -dt / .9), 0, 1);
      E.audio.loopSet('riser', charge); $('#meter').style.width = (charge * 100) + '%';
      if (holding && Math.random() < charge * .5) E.vibe(4);
      if (holding && Math.random() < charge * .6) { const r = sunwrap.getBoundingClientRect(); const a = Math.random() * 6.28, d = r.width * .55; E.fx.burst(r.left + r.width / 2 + Math.cos(a) * d, r.top + r.height / 2 + Math.sin(a) * d, { n: 1, angle: a + Math.PI, spread: .1, speed: [80, 160], gravity: 0, lift: 0, shapes: ['spark'], decay: [1.6, 2] }); }
      if (charge >= 1) ignite();
    }
    rot += dt * (lit ? 4 : 5 + charge * 90);
    const rays = document.getElementById('rays'); if (rays) rays.setAttribute('transform', `rotate(${rot}) scale(${lit ? 1 : .62 + charge * .45})`);
    const halo = document.getElementById('halo'); if (halo) halo.setAttribute('opacity', lit ? .55 + Math.sin(t * 2) * .1 : charge * .7);
    if (lit && !$('#s-seal').classList.contains('on')) stopSun();
  });
  function ignite() {
    if (lit) return; lit = true; holding = false;
    E.audio.loopStop('riser'); E.sfx('ignite'); E.music.level(1); E.vibe([30, 40, 70]); E.flash(); E.shake(12);
    E.fx.at(sunwrap, { n: 140, speed: [120, 520] });
    $('#hint').textContent = ''; $('#meterWrap').style.opacity = 0; sunwrap.classList.add('lit'); $('#paraTxt').style.opacity = 0;
    setTimeout(() => $('#reveal').classList.add('on'), 250);
  }

  /* =================================================================
     2. IDENTIDADE
     ================================================================= */
  const saved = store.get('cafe_ident');
  $('#goId').onclick = () => {
    E.sfx('select');
    if (saved) { $('#fNome').value = saved.nome || ''; $('#fEmail').value = saved.email || ''; $('#fTel').value = fmtTel(saved.telefone || ''); }
    else if (para) $('#fNome').value = para;
    show('s-id'); setWho('guest');
  };
  $('#fTel').addEventListener('input', e => { e.target.value = fmtTel(e.target.value); });
  $('#pTel').addEventListener('input', e => { e.target.value = fmtTel(e.target.value); });
  const toIdent = () => show(found ? 's-back' : 's-id');

  $('#idGo').onclick = async () => {
    const nome = $('#fNome').value.trim(), email = normEmail($('#fEmail').value), telefone = normTel($('#fTel').value);
    if (nome.length < 2) return fail('Diga seu nome ao oráculo.');
    if (!okEmail(email)) return fail('Esse e-mail não parece certo.');
    if (telefone.length < 10) return fail('Coloque o WhatsApp com DDD.');
    loader(true, 'Consultando os astros…');
    try {
      const r = await api('lookup', { email, telefone }); loader(false);
      if (!r.ok) throw new Error(r.error);
      if (r.mismatch) return fail('Esse e-mail já está ligado a outro WhatsApp. Confira o número.');
      Object.assign(P.guest, { nome, email, telefone }); store.set('cafe_ident', { nome, email, telefone });
      E.sfx('select'); setWho('guest');
      stored.par = r.par || null;
      if (r.found && r.perfil && r.perfil.fluxoTipo) {
        found = true; P.guest.ans = r.perfil; P.guest.adult = true;
        setFlow(flowOf(P.guest));
        $('#backHi').textContent = `Os astros lembram de você, ${first(nome)}.`;
        $('#backNext').textContent = r.proxima ? `Você já tem um café marcado: ${fmtLong(r.proxima.data)}, às ${r.proxima.hora}.` : '';
        show('s-back');
      } else { found = false; P.guest.mode = 'full'; goCompanion(); }
    } catch (err) { loader(false); fail(err.message || 'Algo deu errado. Tente de novo.'); }
  };
  $('#bKeep').onclick = () => { P.guest.mode = 'keep'; E.sfx('select'); goCompanion(); };
  $('#bRedo').onclick = () => { P.guest.mode = 'full'; P.guest.ans = { fluxoTipo: P.guest.ans.fluxoTipo }; E.sfx('select'); goCompanion(); };

  /* =================================================================
     3. ROTEIRO: companhia → encruzilhada → perfil → par → visita
     ================================================================= */
  function goCompanion() { openDeck([K.COMPANHIA], 'visit', afterCompanion, 0, toIdent, { last: 'Seguir' }); }
  function afterCompanion() {
    if (P.guest.mode === 'full') openCross('guest', goCompanion);
    else partnerPhase(goCompanion);
  }

  /* ---- encruzilhada ---- */
  let crossKey = 'guest', pendingF = null; const crossBacks = {};
  function openCross(key, back) {
    crossKey = key; if (back) crossBacks[key] = back; setWho(key);
    const p = P[key];
    $('#crossWho').textContent = key === 'par' ? `Vez de ${first(p.nome)} · a encruzilhada` : 'A encruzilhada';
    const cr = $('#cross');
    cr.querySelectorAll('.xcard').forEach(x => { x.classList.toggle('sel', x.dataset.f === p.ans.fluxoTipo); x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; });
    cr.classList.toggle('picked', !!p.ans.fluxoTipo && p.ans.fluxoTipo !== 'nd');
    if (p.ans.fluxoTipo) setFlow(flowOf(p)); else setFlow('mono');
    updCrossBtn(); show('s-cross'); E.sfx('flip');
  }
  function updCrossBtn() { const b = $('#crossGo'), f = P[crossKey].ans.fluxoTipo; b.disabled = !f || f === 'nd'; b.textContent = !f || f === 'nd' ? 'Escolha uma carta' : S() ? 'Entrar nesse clima 😏' : 'Seguir por esse caminho'; }
  function applyF(f, el) {
    const p = P[crossKey]; p.ans.fluxoTipo = f;
    $('#cross').classList.add('picked'); $('#cross').querySelectorAll('.xcard').forEach(x => x.classList.toggle('sel', x.dataset.f === f));
    const was = flow; setFlow(K.FLUXOS[f].flow, true); E.vibe(10);
    if (flow !== was) { E.fx.at(el || $('#cross'), { n: 70 }); E.shake(6); } else E.sfx('select');
    updCrossBtn();
  }
  $('#cross').addEventListener('click', e => {
    const c = e.target.closest('.xcard'); if (!c) return;
    const f = c.dataset.f, p = P[crossKey];
    if (K.FLUXOS[f].flow === 'spicy' && !p.adult) { pendingF = f; $('#adult').classList.add('on'); E.sfx('pop'); return; }
    applyF(f, c);
  });
  $('#adultYes').onclick = () => { P[crossKey].adult = true; $('#adult').classList.remove('on'); applyF(pendingF, document.querySelector(`.xcard[data-f="${pendingF}"]`)); };
  $('#adultNo').onclick = () => { $('#adult').classList.remove('on'); applyF('mono', document.querySelector('.xcard[data-f="mono"]')); };
  $('#crossGo').onclick = () => startProfile(crossKey);
  $('#crossNd').onclick = () => { P[crossKey].ans.fluxoTipo = 'nd'; setFlow('mono', true); startProfile(crossKey); };
  $('#crossBack').onclick = () => { E.sfx('flip'); (crossBacks[crossKey] || toIdent)(); };

  /* ---- perfil de cada jogador ---- */
  function startProfile(key, at = 0) {
    const p = P[key], steps = K.profileSteps(flowOf(p), { partner: key === 'par' });
    const last = steps.length - 1;
    const after = key === 'guest' ? () => partnerPhase(() => startProfile('guest', last)) : () => visitPhase(() => startProfile('par', last));
    const lastLabel = key === 'guest' && vis.companhia.par ? `Passar pro ${first(vis.companhia.parNome) || 'par'} 📱` : key === 'par' ? 'Ir pra agenda' : 'Seguir';
    openDeck(steps, key, after, at, () => openCross(key), { last: lastLabel });
    if (at === 0) setTimeout(() => Mascot.say(key === 'par' ? E.pick(K.SAY.p2) : E.pick(K.SAY.hello[S() ? 's' : 'm'])), 700);
  }

  /* ---- PLAYER 2 ---- */
  let p2Back = null;
  const sameName = (a, b) => first(a).toLowerCase() === first(b).toLowerCase();
  function partnerPhase(back) {
    const c = vis.companhia;
    if (!c.par) { parMode = 'none'; return visitPhase(back); }
    p2Back = back;
    const nm = first(c.parNome) || 'seu par';
    setFlow(flowOf(P.guest)); setWho('visit');
    $('#p2Title').textContent = `Agora é a vez de ${nm}!`;
    $('#p2Sub').textContent = `Passa o celular pra ${nm}. ${first(P.guest.nome)}, nada de espiar as respostas 👀`;
    $('#pNome').value = P.par.nome || c.parNome.trim();
    $('#pTel').value = fmtTel(P.par.telefone || ''); $('#pEmail').value = P.par.email || '';
    const canKeep = stored.par && stored.par.perfil && stored.par.perfil.fluxoTipo && sameName(stored.par.nome, c.parNome);
    $('#p2Keep').hidden = !canKeep;
    $('#p2Copy').textContent = `Usar as mesmas respostas de ${first(P.guest.nome)}`;
    if (canKeep) $('#p2Keep').textContent = `Usar as respostas de ${first(stored.par.nome)} da última vez`;
    show('s-p2');
    setTimeout(() => { E.banner('PLAYER 2', `${nm} entrou no jogo`, { cls: 'p2' }); E.sfx('power'); }, 350);
  }
  $('#p2Go').onclick = () => {
    const nome = $('#pNome').value.trim(), tel = normTel($('#pTel').value), email = normEmail($('#pEmail').value);
    if (nome.length < 2) return fail('Como te chamam?');
    if (tel && tel.length < 10) return fail('WhatsApp com DDD, ou deixa em branco.');
    if (email && !okEmail(email)) return fail('Esse e-mail não parece certo, ou deixa em branco.');
    if (normEmail(email) === P.guest.email) return fail('Esse e-mail é de quem já respondeu. Usa o seu, ou deixa em branco.');
    const changed = !sameName(nome, P.par.nome);
    Object.assign(P.par, { nome, telefone: tel, email }); vis.companhia.parNome = nome;
    if (changed && parMode !== 'full') { P.par.ans = {}; P.par.scores = {}; }
    parMode = 'full'; E.sfx('select');
    openCross('par', () => partnerPhase(p2Back));
  };
  $('#p2Keep').onclick = () => {
    parMode = 'keep'; P.par.nome = stored.par.nome; P.par.ans = stored.par.perfil; P.par.adult = true;
    vis.companhia.parNome = stored.par.nome; E.sfx('select');
    visitPhase(() => partnerPhase(p2Back));
  };
  function parBasics() {
    const nome = $('#pNome').value.trim() || vis.companhia.parNome.trim(), tel = normTel($('#pTel').value), email = normEmail($('#pEmail').value);
    if (nome.length < 2) { fail('Qual o nome do seu par?'); return false; }
    Object.assign(P.par, { nome, telefone: tel.length >= 10 ? tel : '', email: okEmail(email) && email !== P.guest.email ? email : '' });
    vis.companhia.parNome = nome; return true;
  }
  $('#p2Copy').onclick = () => {
    if (!parBasics()) return;
    parMode = 'copy'; P.par.ans = JSON.parse(JSON.stringify(P.guest.ans)); P.par.scores = {};
    E.sfx('select'); Mascot.say(`Copiou da ${first(P.guest.nome)}? Casal que combina em tudo 😄`);
    visitPhase(() => partnerPhase(p2Back));
  };
  $('#p2Skip').onclick = () => {
    if (!parBasics()) return;
    parMode = 'skip'; P.par.ans = {}; E.sfx('boing');
    toast(`Tudo bem, ${first(P.par.nome)}! O convite continua de pé pra você 💛`);
    visitPhase(() => partnerPhase(p2Back));
  };
  $('#p2Back').onclick = () => { E.sfx('flip'); p2Back && p2Back(); };

  /* ---- visita ---- */
  function visitPhase(back) {
    setFlow(visitFlow(), true);
    openDeck(K.VISIT, 'visit', goRoll, 0, back, { last: 'Rolar o destino 🎲', lastSkip: 'Pular e rolar o dado 🎲' });
  }

  /* =================================================================
     4. O BARALHO
     ================================================================= */
  const CORNER = `<svg viewBox="0 0 40 40"><path d="M2 38V14Q2 2 14 2h24" fill="none" stroke="currentColor"/><path d="M8 38V19Q8 8 19 8h19" fill="none" stroke="currentColor" stroke-width=".6" opacity=".55"/><path d="M15 15l1.6-4.4L18.2 15l4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6z" fill="currentColor"/></svg>`;
  const corners = ['tl', 'tr', 'bl', 'br'].map(k => `<i class="cn ${k}">${CORNER}</i>`).join('');
  let deck = [], idx = 0, deckWho = 'guest', deckDone = null, deckBack = null, deckOpts = {}, cleanup = null, booked = [];
  const gdone = {}, ptsGiven = {}, swState = {}, bonus = {};
  const ansOf = s => s.v ? vis : P[deckWho].ans;
  const player = () => deckWho === 'visit' ? P.guest : P[deckWho];
  const keyOf = s => deckWho + ':' + s.id;
  let PEP = null;

  function openDeck(steps, who, onDone, at, onBack, opts = {}) {
    deck = steps; deckWho = who; idx = at; deckDone = onDone; deckBack = onBack; deckOpts = opts;
    if (who !== 'visit') setFlow(flowOf(P[who]));
    setWho(who);
    if (steps.some(s => s.type === 'date')) api('slots').then(r => { applySlots(r); if (deck[idx] && ['date', 'hora'].includes(deck[idx].type)) { $('#card .sub') && deck[idx].type === 'date' && ($('#card .sub').textContent = dateSub()); refresh(); } }).catch(() => {});
    $('#card').className = 'card'; show('s-deck'); paint(); E.sfx('flip');
  }
  function paint() {
    if (cleanup) { cleanup(); cleanup = null; }
    const s = deck[idx], card = $('#card');
    card.innerHTML = frame(s, idx); card.classList.remove('heat3', 'heat5');
    pips(); navLabels();
    const body = $('#cbody');
    if (s.type === 'game') mountGame(s, body);
    else if (s.type === 'swipe') cleanup = mountSwipe(s, body);
    else if (s.type === 'plate') cleanup = mountPlate(s, body);
    else if (s.type === 'scale') heat(ansOf(s)[s.id] || 0, false);
  }
  function pips() { $('#pips').innerHTML = deck.length > 1 ? deck.map((s, i) => `<i class="${s.type === 'game' ? 'gm ' : ''}${i < idx ? 'done' : i === idx ? 'now' : ''}"></i>`).join('') : ''; }
  function navLabels() {
    const s = deck[idx], o = ansOf(s), last = idx === deck.length - 1;
    const skip = (s.type === 'text' && !String(o[s.id] || '').trim()) || (s.type === 'game' && !gdone[keyOf(s)]);
    $('#next').textContent = last ? (skip ? (deckOpts.lastSkip || 'Pular e seguir') : (deckOpts.last || 'Seguir')) : (skip ? 'Pular' : 'Seguir');
  }
  function frame(s, i) {
    let sub = tx(s.sub);
    if (s.type === 'hora') sub = `${vis.data ? `Dia escolhido: ${fmtLong(vis.data)}. ` : ''}Chegada entre ${agenda.horas[0]} e ${agenda.horas[agenda.horas.length - 1]}.`;
    if (s.type === 'date') sub = dateSub();
    const game = s.type === 'game';
    return `${corners}<header class="c-head"><span class="c-num">${roman(i + 1)}</span><span class="c-g" aria-hidden="true">${s.g}</span></header>
      <h2 class="q">${tx(s.q)}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}
      <div class="c-body${game ? ' gamebody' : ''}" id="cbody">${game || s.type === 'swipe' || s.type === 'plate' ? '' : body(s)}</div>
      ${game ? '<p class="gmsg" id="gmsg"></p>' : ''}
      <footer class="c-foot"><span>${s.arc}</span></footer>`;
  }
  function body(s) {
    const o = ansOf(s);
    if (s.type === 'single') return `<div class="opts">` + s.opts.map(p =>
      `<button class="opt ${o[s.id] === p.v ? 'sel' : ''}" data-single="${p.v}">${tx(p.l)}</button>` +
      (p.x && o[s.id] === p.v ? `<input class="xin" data-x="${s.id}_x" placeholder="${esc(p.x)}" value="${esc(o[s.id + '_x'])}">` : '')).join('') + `</div>`;
    if (s.type === 'multi') {
      const g = s.groups[0];
      const items = s.style === 'vinyl'
        ? `<div class="vinyls">${g.opts.map(p => `<button class="vinyl ${(o[g.id] || []).includes(p.v) ? 'sel' : ''}" data-multi="${g.id}" data-v="${esc(p.v)}"><span class="disc"></span><span>${p.l}</span></button>`).join('')}</div>`
        : `<div class="chips">${g.opts.map(p => `<button class="chip ${(o[g.id] || []).includes(p.v) ? 'sel' : ''}" data-multi="${g.id}" data-v="${esc(p.v)}">${p.l}</button>`).join('')}</div>`;
      return items + (s.text ? `<input class="xin" data-x="${s.text.id}" placeholder="${esc(s.text.ph)}" value="${esc(o[s.text.id])}">` : '');
    }
    if (s.type === 'text') return `<textarea class="ta" data-x="${s.id}" placeholder="${esc(s.ph)}">${esc(o[s.id])}</textarea>`;
    if (s.type === 'scale') {
      PEP = PEP || E.sprites.get('pimenta', 100).toDataURL(); const n = o[s.id] || 0;
      return `<div class="scale">${[1, 2, 3, 4, 5].map(k => `<button class="pep ${k <= n ? 'on' : ''}" data-scale="${k}" aria-label="Nível ${k}"><img src="${PEP}" alt=""></button>`).join('')}</div>
        <p class="scale-l">${n ? s.labels[n - 1] : 'Toque numa pimenta'}</p>`;
    }
    if (s.type === 'companhia') { const c = vis.companhia, none = !c.par && !c.criancas && !c.outro;
      return `<div class="opts">
        <button class="opt ${c.par ? 'sel' : ''}" data-comp="par">Meu par (vai jogar também 😈)</button>
        ${c.par ? `<input class="xin" data-cx="parNome" placeholder="Nome do seu par" value="${esc(c.parNome)}">` : ''}
        <button class="opt ${c.criancas ? 'sel' : ''}" data-comp="criancas">Criança(s)</button>
        ${c.criancas ? `<div class="stepper"><button data-kid="-1" aria-label="Menos uma">−</button><b>${c.criancas}</b><button data-kid="1" aria-label="Mais uma">+</button></div>
          <input class="xin" data-cx="idades" placeholder="Idades (ex.: 3 e 7 anos)" value="${esc(c.idades)}">` : ''}
        <button class="opt ${c.outro ? 'sel' : ''}" data-comp="outro">Mais alguém</button>
        ${c.outro ? `<input class="xin" data-cx="outroNome" placeholder="Quem vem com você?" value="${esc(c.outroNome)}">` : ''}
      </div><p class="note" style="text-align:center;margin-top:14px">${none ? 'Vindo só também é um ótimo café.' : c.par ? 'Seu par responde depois de você. Sem colar!' : 'Quanto mais gente, mais tapioca.'}</p>`; }
    if (s.type === 'date') return dateBody();
    if (s.type === 'hora') return `<div class="horas">${agenda.horas.map(h => { const ok = horaOk(vis.data, h); return `<button class="hora ${vis.hora === h ? 'sel' : ''}" data-hora="${h}" ${ok ? '' : 'disabled aria-label="' + h + ', ocupado"'}>${h}</button>`; }).join('')}</div>`;
    return '';
  }
  function dateSub() { return `${diasTxt()}. Dias com selo já estão ocupados.`; }
  function dateBody() {
    const firstD = new Date(); firstD.setHours(12, 0, 0, 0); firstD.setDate(firstD.getDate() + 1);
    const end = new Date(firstD); end.setDate(end.getDate() + agenda.diasAFrente);
    const cols = agenda.dias.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    let html = `<div class="cal-h" style="--cols:${cols.length}">${cols.map(d => `<span>${DSHORT[d]}</span>`).join('')}</div>`, lastM = -1;
    const mon = new Date(firstD); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    for (const w = new Date(mon); w <= end; w.setDate(w.getDate() + 7)) {
      const days = cols.map(dw => { const d = new Date(w); d.setDate(w.getDate() + ((dw + 6) % 7)); return d; });
      if (days.every(d => d < firstD || d > end)) continue;
      const ref = days.find(d => d >= firstD) || days[0];
      if (ref.getMonth() !== lastM) { lastM = ref.getMonth(); html += `<p class="cal-m">${MO[lastM]} de ${ref.getFullYear()}</p>`; }
      html += `<div class="cal-w" style="--cols:${cols.length}">`;
      for (const d of days) {
        const id = ymd(d), out = d < firstD || d > end, blk = !out && agenda.bloqueios.includes(id), ok = !out && dayOk(id);
        const taken = !out && !blk && !ok;
        html += `<button class="day ${out || blk ? 'past' : ''} ${taken ? 'taken' : ''} ${vis.data === id ? 'sel' : ''}" data-day="${id}" ${ok ? '' : 'disabled'} aria-label="${fmtLong(id)}${taken ? ', ocupado' : ''}"><b>${d.getDate()}</b>${taken ? '<i>selado</i>' : ''}</button>`;
      }
      html += `</div>`;
    }
    return html;
  }
  function refresh() { const s = deck[idx]; if (['game', 'swipe', 'plate'].includes(s.type)) return; const b = $('#cbody'); if (!b) return; const y = b.scrollTop; b.innerHTML = body(s); b.scrollTop = y; navLabels(); }
  function heat(n, fx = true) {
    const card = $('#card'); card.classList.toggle('heat3', n >= 3 && n < 5); card.classList.toggle('heat5', n === 5);
    if (!fx) return;
    E.sfx('sizzle', n); E.vibe(n * 8);
    if (n >= 4) E.fx.at($('#cbody'), { n: 10 + n * 4, emoji: ['🔥'], gravity: -260, speed: [30, 120], size: [5, 8], decay: [.6, .9] });
    if (n === 5) { E.banner('SEM FILTRO', 'o termômetro quebrou 🔥', { cls: 'hot' }); E.achieve('pimenta5', '🌶️', 'Sem filtro nenhum', first(player().nome)); }
  }

  /* ---- cliques nas perguntas ---- */
  $('#card').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const s = deck[idx];
    if (['game', 'swipe', 'plate'].includes(s.type)) return;
    const o = ansOf(s), c = vis.companhia;
    if (b.dataset.single) {
      o[s.id] = b.dataset.single; E.sfx('select'); E.vibe(6); refresh();
      const nb = $(`#cbody [data-single="${b.dataset.single}"]`); if (nb) { E.pop(nb); E.fx.at(nb, { n: 14, speed: [40, 170], size: [1.2, 3] }); }
      const opt = s.opts.find(p => p.v === b.dataset.single); if (opt && opt.r) Mascot.say(tx(opt.r));
      if (s.id === 'oferenda' && b.dataset.single === 'bolo' && !bonus.bolo) { bonus.bolo = 1; setTimeout(() => E.score.add(10, null, null, '+10 🍰'), 400); }
      const x = $('#cbody .xin'); if (x) setTimeout(() => x.focus({ preventScroll: true }), 60);
    } else if (b.dataset.multi) {
      const g = b.dataset.multi, v = b.dataset.v, a = o[g] || (o[g] = []), i = a.indexOf(v);
      i >= 0 ? a.splice(i, 1) : a.push(v); b.classList.toggle('sel', i < 0); E.sfx('tick', i < 0); E.vibe(5);
      if (i < 0) { E.pop(b); if (s.style === 'vinyl') E.fx.at(b, { n: 5, emoji: ['♪', '♫'], gravity: -120, speed: [30, 90], size: [4, 6] }); }
    } else if (b.dataset.scale) { const n = +b.dataset.scale; o[s.id] = n; refresh(); heat(n); const nb = $(`#cbody [data-scale="${n}"]`); if (nb) E.squash(nb); }
    else if (b.dataset.comp) { const k = b.dataset.comp; if (k === 'criancas') c.criancas = c.criancas ? 0 : 1; else c[k] = !c[k]; E.sfx('select'); E.vibe(6); refresh();
      if (k === 'par' && c.par) { Mascot.say('Ah, vai ter Player 2! Seu par joga depois de você 😈'); const x = $('#cbody [data-cx="parNome"]'); if (x) setTimeout(() => x.focus({ preventScroll: true }), 60); } }
    else if (b.dataset.kid) { c.criancas = E.clamp(c.criancas + (+b.dataset.kid), 0, 8); E.sfx('tick', +b.dataset.kid > 0); refresh(); }
    else if (b.dataset.day) { vis.data = b.dataset.day; if (vis.hora && !horaOk(vis.data, vis.hora)) vis.hora = null; E.sfx('select'); E.vibe(8); refresh(); E.fx.at($(`#cbody [data-day="${vis.data}"]`), { n: 18 }); }
    else if (b.dataset.hora) { vis.hora = b.dataset.hora; E.sfx('select'); E.vibe(8); refresh(); E.pop($(`#cbody [data-hora="${vis.hora}"]`)); }
  });
  $('#card').addEventListener('input', e => {
    const t = e.target, s = deck[idx];
    if (t.dataset.x) { ansOf(s)[t.dataset.x] = t.value; if (s.type === 'text') navLabels(); }
    if (t.dataset.cx) vis.companhia[t.dataset.cx] = t.value;
  });

  /* ---- mini jogo dentro da carta ---- */
  function mountGame(s, root) {
    const key = keyOf(s), p = player();
    const rv = deckWho === 'par' && s.duel ? P.guest.scores[s.id] : null;
    const api = {
      spicy: S(), who: first(p.nome) || 'você', replay: !!gdone[key], drink: p.ans.bebida,
      rival: rv != null ? { name: first(P.guest.nome), score: rv } : null,
      msg: t => { const m = $('#gmsg'); if (m) m.textContent = t; },
      done: (pts, msg, data) => {
        if (gdone[key]) return; gdone[key] = true;
        p.scores[s.id] = data && data.score != null ? data.score : pts;
        if (data && data.prenda) p.ans.prenda = data.prenda;
        api.msg(msg); E.score.add(Math.round(pts)); setTimeout(() => E.sfx('win'), 120);
        E.fx.confetti({ n: 26 }); E.vibe([20, 40, 60]); navLabels();
        const nx = $('#next'); E.pop(nx);
      }
    };
    try { cleanup = GAMES[s.game].mount(root, api); }
    catch (err) { console.error(err); gdone[key] = true; root.innerHTML = '<p class="note center" style="padding-top:30px">Esse jogo tropeçou no cuscuz. Pode seguir!</p>'; navLabels(); }
  }

  /* ---- swipe (deu match?) ---- */
  function mountSwipe(s, root) {
    const o = ansOf(s), g = s.groups[0], key = keyOf(s);
    const st = swState[key] || (swState[key] = { i: 0, liked: [] });
    let drag = null;
    function summary() {
      const liked = (o[g.id] || []).map(v => g.opts.find(p => p.v === v)).filter(Boolean);
      root.innerHTML = `<div class="sw-sum"><p class="note">${liked.length ? `Deu match com ${liked.length}! ✦` : 'Nenhum match? Tudo bem, a gente puxa assunto 😅'}</p>
        <div class="chips">${liked.map(p => `<span class="chip sel">${p.i || ''} ${p.l}</span>`).join('')}</div>
        <button class="ghost" data-redo="1">Passar as cartas de novo</button></div>`;
      root.querySelector('[data-redo]').onclick = () => { st.i = 0; st.liked = []; delete o[s.id + '_done']; o[g.id] = []; E.sfx('flip'); render(); };
    }
    function render() {
      if (o[s.id + '_done']) return summary();
      const rest = g.opts.slice(st.i);
      root.innerHTML = `<div class="sw"><div class="sw-stack">${rest.slice(0, 3).reverse().map((p, k, arr) => {
        const depth = arr.length - 1 - k;
        return `<div class="sw-card" data-v="${esc(p.v)}" style="transform:translateY(${depth * 8}px) scale(${1 - depth * .05});z-index:${10 - depth}">
          <span class="stamp y">${s.yes.toUpperCase()}</span><span class="stamp n">${s.no.toUpperCase()}</span><i>${p.i || '✦'}</i><b>${p.l}</b></div>`; }).join('')}</div>
        <div class="sw-btns"><button class="n" data-sw="0" aria-label="${s.no}">✕</button><span class="sw-count">${st.i + 1}/${g.opts.length}</span><button class="y" data-sw="1" aria-label="${s.yes}">♥</button></div></div>`;
      root.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => decide(b.dataset.sw === '1'));
      const top = root.querySelector('.sw-card[style*="z-index:10"]'); if (top) bindDrag(top);
    }
    function bindDrag(el) {
      el.addEventListener('pointerdown', e => { drag = { el, x0: e.clientX, y0: e.clientY, dx: 0 }; try { el.setPointerCapture(e.pointerId); } catch (_) {} el.style.transition = 'none'; E.audio.init(); });
      el.addEventListener('pointermove', e => {
        if (!drag || drag.el !== el) return; drag.dx = e.clientX - drag.x0; const dy = (e.clientY - drag.y0) * .3;
        el.style.transform = `translate(${drag.dx}px,${dy}px) rotate(${drag.dx * .07}deg)`;
        el.querySelector('.stamp.y').style.opacity = E.clamp(drag.dx / 90, 0, 1); el.querySelector('.stamp.n').style.opacity = E.clamp(-drag.dx / 90, 0, 1);
      });
      const end = () => { if (!drag || drag.el !== el) return; const dx = drag.dx; drag = null;
        if (Math.abs(dx) > 85) decide(dx > 0, el);
        else { el.style.transition = 'transform .35s cubic-bezier(.2,1.5,.4,1)'; el.style.transform = ''; el.querySelectorAll('.stamp').forEach(x => x.style.opacity = 0); } };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    }
    function decide(yes, el) {
      const card = el || root.querySelector('.sw-card[style*="z-index:10"]'); if (!card || card.dataset.gone) return; card.dataset.gone = 1;
      const v = card.dataset.v;
      if (yes) { st.liked.push(v); E.sfx(S() ? 'kiss' : 'heart'); E.fx.at(card, { n: 16, shapes: ['heart'], colors: ['#7FE0A6', '#FF8FA3', '#F0D79A'] }); }
      else { E.sfx('swipe'); }
      E.vibe(8);
      card.querySelector(yes ? '.stamp.y' : '.stamp.n').style.opacity = 1;
      card.style.transition = 'transform .4s ease-in, opacity .4s'; card.style.transform = `translate(${yes ? 420 : -420}px,-30px) rotate(${yes ? 30 : -30}deg)`; card.style.opacity = 0;
      st.i++;
      setTimeout(() => {
        if (st.i >= g.opts.length) { o[g.id] = st.liked.slice(); o[s.id + '_done'] = 1; E.sfx('win'); summary(); navLabels(); }
        else render();
      }, 260);
    }
    render();
    return () => {};
  }

  /* ---- prato (arraste e solte) ---- */
  function mountPlate(s, root) {
    const o = ansOf(s), gid = s.gid || s.id;
    const sel = () => (o[gid] || (o[gid] = []));
    const SLOTS = [[28, 12], [6, 44], [50, 46]];
    root.innerHTML = `<div class="platew"><div class="plate" id="plate"><span class="plate-hint">Arraste pra cá ↓</span></div>
      <div class="pantry">${s.opts.map(p => `<button class="food" data-food="${esc(p.v)}"><span class="fi"></span><span>${p.l}</span></button>`).join('')}</div></div>`;
    const plate = root.querySelector('#plate');
    root.querySelectorAll('.food').forEach(b => { const p = s.opts.find(x => x.v === b.dataset.food); b.querySelector('.fi').replaceWith(E.sprites.img(p.i, 96)); });
    function draw() {
      const a = sel(); plate.querySelectorAll('.pi').forEach(n => n.remove());
      plate.querySelector('.plate-hint').style.display = a.length ? 'none' : '';
      a.forEach((v, k) => { const p = s.opts.find(x => x.v === v); if (!p) return; const d = document.createElement('button'); d.className = 'pi'; d.dataset.v = v; d.setAttribute('aria-label', `Tirar ${p.l}`);
        d.style.left = SLOTS[k % 3][0] + '%'; d.style.top = SLOTS[k % 3][1] + '%'; d.style.transform = `rotate(${(k * 37) % 30 - 15}deg)`;
        d.appendChild(E.sprites.img(p.i, 120)); plate.appendChild(d); });
      root.querySelectorAll('.food').forEach(b => b.classList.toggle('sel', a.includes(b.dataset.food)));
    }
    function add(v) {
      const a = sel(); if (a.includes(v)) return; a.push(v); draw();
      const n = plate.querySelector(`.pi[data-v="${v}"]`); if (n) E.anim(n, [{ transform: 'translateY(-60px) scale(1.3)', opacity: 0 }, { transform: 'translateY(4px) scale(.95)', opacity: 1, offset: .7 }, { transform: n.style.transform }], { duration: 450, easing: 'ease-out' });
      E.sfx('pop'); E.vibe(12); E.squash(plate); E.fx.at(plate, { n: 22, speed: [60, 220] });
      if (a.length === s.opts.length && !bonus['plate' + deckWho]) { bonus['plate' + deckWho] = 1; Mascot.say(S() ? 'Os três? Gulosa(o)… gosto 😏' : 'Os três! Prato de campeão(ã) 🏆'); E.achieve('trio', '🍽️', 'Prato completo', first(player().nome)); }
    }
    function remove(v) { const a = sel(), i = a.indexOf(v); if (i < 0) return; a.splice(i, 1); E.sfx('boing'); draw(); }
    plate.addEventListener('click', e => { const n = e.target.closest('.pi'); if (n) remove(n.dataset.v); });
    let drag = null;
    const onMove = e => {
      if (!drag) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.ghost && Math.hypot(dx, dy) > 8) { drag.ghost = E.sprites.img(drag.p.i, 128); drag.ghost.className = 'ghostfood'; document.body.appendChild(drag.ghost); E.sfx('tap'); }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; const r = plate.getBoundingClientRect(); drag.over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; plate.classList.toggle('over', drag.over); }
    };
    const onUp = () => {
      if (!drag) return; const d = drag; drag = null; plate.classList.remove('over');
      if (d.ghost) { d.ghost.remove(); if (d.over) add(d.p.v); else E.sfx('boing'); }
      else { sel().includes(d.p.v) ? remove(d.p.v) : add(d.p.v); }
    };
    root.querySelectorAll('.food').forEach(b => b.addEventListener('pointerdown', e => {
      E.audio.init(); drag = { p: s.opts.find(x => x.v === b.dataset.food), x0: e.clientX, y0: e.clientY, ghost: null, over: false }; e.preventDefault();
    }));
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    draw();
    return () => { removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); document.querySelectorAll('.ghostfood').forEach(n => n.remove()); };
  }

  /* ---- navegação do baralho ---- */
  function check(s) {
    const o = ansOf(s);
    if (s.type === 'single' && !o[s.id]) return 'Escolha uma opção pra seguir.';
    if (s.type === 'multi' && s.min && !(o[s.groups[0].id] || []).length) return 'Escolha pelo menos uma opção.';
    if (s.type === 'plate' && s.min && !(o[s.gid || s.id] || []).length) return 'Coloca pelo menos uma coisa no prato 🍽️';
    if (s.type === 'swipe' && !o[s.id + '_done']) return 'Passa todas as cartas primeiro (direita ou esquerda) 😉';
    if (s.type === 'swipe' && s.min && !(o[s.groups[0].id] || []).length) return 'Dá match em pelo menos um, vai 😅';
    if (s.type === 'scale' && !o[s.id]) return 'Toque numa pimenta pra seguir.';
    if (s.type === 'companhia' && vis.companhia.par && vis.companhia.parNome.trim().length < 2) return 'Qual o nome do seu par?';
    if (s.type === 'date' && !vis.data) return 'Escolha um dia no calendário.';
    if (s.type === 'hora' && !vis.hora) return 'Escolha o horário de chegada.';
    if (s.type === 'hora' && !horaOk(vis.data, vis.hora)) return 'Esse horário não está mais livre. Escolha outro.';
    return '';
  }
  function turn(dir) {
    if (cleanup) { cleanup(); cleanup = null; }
    const card = $('#card'); card.classList.add(dir > 0 ? 'out' : 'outR'); E.sfx('flip');
    setTimeout(() => { idx += dir; card.className = 'card pre'; paint(); void card.offsetWidth; card.classList.remove('pre'); }, 380);
  }
  $('#next').onclick = () => {
    const s = deck[idx], msg = check(s);
    if (msg) { const c = $('#card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); Mascot.say(msg); return fail(msg); }
    const o = ansOf(s), key = keyOf(s);
    const empty = (s.type === 'text' && !String(o[s.id] || '').trim()) || (s.type === 'game' && !gdone[key]);
    if (empty) Mascot.say(E.pick(K.SAY.skip));
    else if (s.type !== 'game' && !ptsGiven[key]) { ptsGiven[key] = 1; E.score.add(5); }
    if (idx < deck.length - 1) turn(1);
    else { if (cleanup) { cleanup(); cleanup = null; } E.sfx('whoosh'); deckDone && deckDone(); }
  };
  $('#prev').onclick = () => { if (idx > 0) turn(-1); else { if (cleanup) { cleanup(); cleanup = null; } E.sfx('flip'); deckBack && deckBack(); } };

  /* =================================================================
     5. O DADO
     ================================================================= */
  let dado = null, bencao = '', rolling = false, visitId = uid();
  function goRoll() {
    setFlow(visitFlow()); setWho('visit'); show('s-roll');
    if (dado) { $('#dnum').textContent = dado; $('#fate').textContent = bencao; $('#fate').classList.add('on'); $('#sealBtn').hidden = false; $('#rollHint').textContent = ''; }
  }
  $('#d20').onclick = () => {
    if (rolling || dado) return; rolling = true; E.audio.init();
    const d = $('#d20'), final = 1 + Math.floor(Math.random() * 20); let delay = 45;
    d.classList.remove('idle', 'landed'); d.classList.add('rolling'); $('#rollHint').textContent = '';
    const step = () => { $('#dnum').textContent = 1 + Math.floor(Math.random() * 20); E.sfx('dice'); E.vibe(4); delay *= 1.14; if (delay < 330) setTimeout(step, delay); else land(); };
    const land = () => {
      dado = final; bencao = K.blessing(final, S()); $('#dnum').textContent = final;
      d.classList.remove('rolling'); void d.offsetWidth; d.classList.add('landed');
      E.sfx('crit', final); E.vibe(final === 20 ? [40, 50, 40, 50, 120] : 30); E.shake(final === 20 || final === 1 ? 16 : 6);
      if (final >= 15) E.fx.at(d, { n: 90 });
      if (final === 20) { E.banner('CRÍTICO!', 'acerto crítico do destino'); E.achieve('d20', '🎲', 'Acerto crítico', names()); }
      if (final === 1) { E.banner('FALHA CRÍTICA', 'mas a gente ainda te ama', { cls: 'hot' }); E.achieve('d1', '💀', 'Falha crítica (com estilo)', names()); }
      setTimeout(() => E.score.add(final * 3, null, null, `+${final * 3} do destino`), 500);
      $('#fate').textContent = bencao; $('#fate').classList.add('on'); $('#sealBtn').hidden = false; rolling = false;
    };
    step();
  };

  /* =================================================================
     6. SELAR E SALVAR
     ================================================================= */
  function leituraOf(p) {
    const out = [{ k: 'fluxo', l: 'Relacionamento', v: fluxoK(p) }];
    for (const s of K.profileSteps(flowOf(p))) {
      if (s.type === 'game') continue; const o = p.ans; let v = '';
      if (s.type === 'single') { const q = s.opts.find(q => q.v === o[s.id]); v = q ? q.k + (o[s.id + '_x'] ? ` (${o[s.id + '_x']})` : '') : ''; }
      else if (s.type === 'multi' || s.type === 'swipe') {
        v = s.groups.map(g => (o[g.id] || []).map(x => { const q = g.opts.find(q => q.v === x); return q ? (q.k || q.l) : x; }).join(', ')).filter(Boolean).join(' · ');
        if (s.text && o[s.text.id]) v += `${v ? ' · ' : ''}Não pode faltar: ${o[s.text.id]}`;
      }
      else if (s.type === 'plate') v = (o[s.gid || s.id] || []).join(', ');
      else if (s.type === 'scale') v = o[s.id] ? `${o[s.id]}/5 (${s.labels[o[s.id] - 1]})` : '';
      else if (s.type === 'text') v = String(o[s.id] || '').trim();
      if (v) out.push({ k: s.id, l: s.lab, v });
    }
    if (p.ans.prenda) out.push({ k: 'prenda', l: 'Prenda (garrafa)', v: p.ans.prenda });
    return out;
  }
  function compTxt() { const c = vis.companhia, p = [];
    if (c.par) p.push(`par${c.parNome ? ` (${c.parNome.trim()})` : ''}`);
    if (c.criancas) p.push(`${c.criancas} criança${c.criancas > 1 ? 's' : ''}${c.idades ? ` (${c.idades.trim()})` : ''}`);
    if (c.outro) p.push(c.outroNome ? c.outroNome.trim() : 'mais alguém');
    return p.length ? 'Vem com ' + p.join(', ') : 'Vem só'; }
  function ofTxt() { const s = K.VISIT.find(s => s.id === 'oferenda'), p = s.opts.find(p => p.v === vis.oferenda); return p ? p.k + (vis.oferenda_x ? ` (${vis.oferenda_x})` : '') : ''; }
  let titulo = '';
  $('#sealBtn').onclick = async () => {
    loader(true, 'Gravando nas estrelas…');
    titulo = K.titulo(E.score.total, visitFlow() === 'spicy', parMode !== 'none');
    const g = P.guest, pp = P.par;
    const payload = {
      guest: { nome: g.nome, email: g.email, telefone: g.telefone },
      perfil: g.mode === 'full' ? g.ans : null,
      leitura: g.mode === 'full' ? leituraOf(g) : null,
      fluxo: fluxoK(g),
      par: parMode === 'full' ? { nome: pp.nome, email: pp.email, telefone: pp.telefone, modo: 'respondeu', perfil: pp.ans, leitura: leituraOf(pp), fluxo: fluxoK(pp) }
        : parMode === 'copy' ? { nome: pp.nome, email: pp.email, telefone: pp.telefone, modo: 'copiou', perfil: pp.ans, leitura: [{ k: 'modo', l: 'Respostas', v: `Usou as respostas de ${first(g.nome)}` }, ...leituraOf(pp)], fluxo: fluxoK(pp) }
        : parMode === 'skip' ? { nome: pp.nome, email: pp.email, telefone: pp.telefone, modo: 'pulou', perfil: null, leitura: [{ k: 'modo', l: 'Respostas', v: 'Preferiu não responder' }], fluxo: '' }
        : null,
      parKeep: parMode === 'keep',
      visita: { id: visitId, data: vis.data, hora: vis.hora, companhia: compTxt(), oferenda: ofTxt(), recado: String(vis.recado || '').trim(), dado: String(dado), bencao,
        pontos: String(E.score.total), titulo, parNome: parMode !== 'none' ? pp.nome : '' }
    };
    try {
      const r = await api('save', payload); loader(false);
      if (!r.ok) throw new Error(r.error || 'Não consegui salvar.');
      done();
    } catch (err) {
      loader(false); fail(err.message);
      if (/ocupad|dispon|inválid/i.test(err.message)) {
        const res = await api('slots').catch(() => ({})); applySlots(res);
        vis.data = null; vis.hora = null;
        openDeck(K.VISIT, 'visit', goRoll, K.VISIT.findIndex(s => s.type === 'date'), () => {}, { last: 'Rolar o destino 🎲', lastSkip: 'Pular e rolar o dado 🎲' });
      }
    }
  };

  /* =================================================================
     7. O BILHETE (raspadinha)
     ================================================================= */
  function done() {
    const d = pd(vis.data);
    $('#ticket').innerHTML = `${corners}<header class="c-head"><span class="c-num">XXI</span><span class="c-g" aria-hidden="true">${S() ? '♡' : '☉'}</span></header>
      <p class="t-k">${C.HOSTS} esperam por</p><h2 class="t-name">${esc(names())}</h2>
      <div class="t-date"><span>${WD[d.getDay()]}</span><b>${d.getDate()}</b><span>de ${MO[d.getMonth()]}</span></div>
      <p class="t-hour">às ${vis.hora}</p><p class="t-comp">${esc(compTxt())}</p>
      <span class="t-rank">🏆 ${esc(titulo)}</span>
      <p class="t-fate">Dado do destino: ${dado}. ${esc(bencao)}</p><footer class="c-foot"><span>O Encontro</span></footer>`;
    show('s-done'); setTimeout(initScratch, 200);
  }
  function initScratch() {
    const cv = $('#scratch'), card = $('#ticket'), r = card.getBoundingClientRect(), stg = card.parentElement.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(cv.style, { width: r.width + 'px', height: r.height + 'px', left: (r.left - stg.left) + 'px', top: (r.top - stg.top) + 'px' });
    cv.width = r.width * dpr; cv.height = r.height * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const T = E.theme();
    const gr = x.createLinearGradient(0, 0, r.width, r.height); gr.addColorStop(0, T.gold2); gr.addColorStop(.5, T.gold); gr.addColorStop(1, T.golddim);
    x.fillStyle = gr; x.beginPath(); x.roundRect ? x.roundRect(0, 0, r.width, r.height, 20) : x.rect(0, 0, r.width, r.height); x.fill();
    x.fillStyle = T.ink; x.globalAlpha = .12; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc(Math.random() * r.width, Math.random() * r.height, Math.random() * 2 + .5, 0, 6.283); x.fill(); }
    x.globalAlpha = .85; x.textAlign = 'center'; x.font = '64px "IM Fell English SC", Georgia, serif'; x.fillText(S() ? '♡' : '☉', r.width / 2, r.height / 2 - 30);
    x.font = '700 22px "Pixelify Sans", monospace'; x.fillText('RASPE AQUI', r.width / 2, r.height / 2 + 26);
    x.globalAlpha = 1; x.globalCompositeOperation = 'destination-out'; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 48;
    let down = false, lx = 0, ly = 0, moves = 0, gone = false;
    cv.classList.remove('gone'); $('#acts').classList.add('wait'); $('#scratchHint').style.opacity = 1;
    const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.onpointerdown = e => { E.audio.init(); down = true; [lx, ly] = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} x.beginPath(); x.arc(lx, ly, 24, 0, 6.283); x.fill(); };
    cv.onpointermove = e => { if (!down || gone) return; const [nx, ny] = pt(e); x.beginPath(); x.moveTo(lx, ly); x.lineTo(nx, ny); x.stroke(); lx = nx; ly = ny;
      if (++moves % 3 === 0) { E.sfx('scratch'); E.vibe(3); E.fx.burst(e.clientX, e.clientY, { n: 2, colors: [T.gold, T.gold2], shapes: ['circle'], speed: [30, 90], size: [1, 2.2], decay: [1.4, 2] }); }
      if (moves % 12 === 0 && cleared() > .5) reveal(); };
    cv.onpointerup = cv.onpointercancel = () => { down = false; if (!gone && cleared() > .5) reveal(); };
    function cleared() { const data = x.getImageData(0, 0, cv.width, cv.height).data; let c = 0, t = 0; for (let i = 3; i < data.length; i += 4 * 37) { t++; if (data[i] < 20) c++; } return c / t; }
    function reveal() {
      gone = true; cv.classList.add('gone'); $('#acts').classList.remove('wait'); $('#scratchHint').style.opacity = 0;
      E.sfx('win'); E.vibe([20, 60, 20, 60, 140]); E.fx.confetti(); E.fx.at(card, { n: 80 });
      E.achieve('selado', '✉️', 'Convite selado', names());
    }
  }
  $('#toSpoiler').onclick = openSpoiler;
  $('#skipSpoiler').onclick = goEnd;

  /* =================================================================
     8. SPOILER — um pouquinho sobre nós
     ================================================================= */
  let spCards = [], spI = 0, spFlipped = false;
  function openSpoiler() {
    const sp = visitFlow() === 'spicy';
    spCards = K.spoiler(sp, { erva: P.guest.ans.erva, data: fmtLong(vis.data) });
    spI = 0; show('s-spoiler'); renderSp(); E.sfx(sp ? 'sexy' : 'select');
  }
  function redacted(t) { return esc(t).replace(/█+/g, m => `<span class="redact">${'x'.repeat(m.length)}</span>`); }
  function renderSp() {
    spFlipped = false;
    const c = spCards[spI], rest = spCards.length - spI;
    $('#spStage').innerHTML =
      (rest > 2 ? `<div class="sp-card pile2"><div class="sp-face sp-back"></div></div>` : '') +
      (rest > 1 ? `<div class="sp-card pile1"><div class="sp-face sp-back"></div></div>` : '') +
      `<div class="sp-card" id="spCur">
        <div class="sp-face sp-back"><b>${S() ? '♡' : '☉'}</b><span>TOQUE PRA VIRAR</span></div>
        <div class="sp-face sp-front${c.lock ? ' lock' : ''}"><span class="g">${c.g}</span><small>${esc(c.arc)}</small><h3>${esc(c.t)}</h3>
          <p id="spP">${c.redact ? redacted(c.p) : esc(c.p)}</p>${c.redact ? '<button class="sp-try" id="spTry">tentar ler mesmo assim</button>' : ''}</div>
      </div>`;
    E.anim($('#spCur'), [{ transform: 'translate(0,-40vh) rotate(-12deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,1.2,.4,1)' });
    $('#spCount').textContent = `${spI + 1} / ${spCards.length}`;
    $('#spNext').textContent = 'Virar a carta';
    $('#spCur').onclick = e => { if (e.target.closest('#spTry')) return; if (!spFlipped) flipSp(); };
  }
  function flipSp() {
    const c = spCards[spI], el = $('#spCur'); spFlipped = true; el.classList.add('flip');
    E.sfx('flip'); setTimeout(() => { E.sfx(S() ? 'kiss' : 'select'); E.fx.at(el, { n: 40 }); }, 300);
    E.score.add(10, null, null, '+10 ✦');
    if (c.lock) setTimeout(() => { E.sfx('buzz'); E.wobble($('#spStage')); Mascot.say('Selado mesmo. Nem eu sei o que tem aí 🤐'); }, 900);
    if (c.redact) setTimeout(() => {
      const b = $('#spTry'); if (b) b.onclick = ev => { ev.stopPropagation(); E.sfx('boing'); E.shake(8); $('#spP').innerHTML = esc(c.reveal); b.remove(); E.achieve('curioso', '👀', 'Curioso(a) demais', names()); };
    }, 100);
    const last = spI === spCards.length - 1;
    $('#spNext').textContent = last ? 'Fim… por enquanto' : 'Próxima carta';
  }
  $('#spNext').onclick = () => {
    if (!spFlipped) return flipSp();
    const el = $('#spCur');
    if (spI >= spCards.length - 1) return goEnd();
    E.sfx('swipe');
    E.anim(el, [{ transform: 'rotateY(180deg)' }, { transform: 'translate(-130%,10%) rotateY(180deg) rotate(-20deg)', opacity: 0 }], { duration: 380, easing: 'ease-in' }).then(() => { spI++; renderSp(); });
  };

  /* =================================================================
     9. FINAL
     ================================================================= */
  function goEnd() {
    const d = pd(vis.data);
    show('s-end'); setWho('visit');
    $('#endTitle').textContent = `Até ${WD[d.getDay()]}, ${names()}!`;
    $('#endWhen').textContent = `${d.getDate()} de ${MO[d.getMonth()]}, às ${vis.hora}. O café vai estar quentinho.`;
    $('#endRank').textContent = `🏆 ${titulo}`;
    E.tween({ v: 0 }, { v: E.score.total }, { dur: 1400, onUpdate: o => $('#endPts').textContent = Math.round(o.v) });
    $('#endAch').innerHTML = E.achievements.map(a => `<span>${a.emoji} ${esc(a.title)}${a.who ? ` · ${esc(first(a.who))}` : ''}</span>`).join('');
    const [y, m, dd] = vis.data.split('-'), [h, mi] = vis.hora.split(':');
    const q = new URLSearchParams({ action: 'TEMPLATE', text: `Café com ${C.HOSTS} ☕`, dates: `${y}${m}${dd}T${h}${mi}00/${y}${m}${dd}T${addMin(vis.hora, 60).replace(':', '')}00`, ctz: 'America/Fortaleza',
      details: bencao + (ofTxt() && ofTxt() !== 'Nada' ? `\n\nNão esquece: ${ofTxt()}.` : ''), ...(C.LOCAL ? { location: C.LOCAL } : {}) });
    $('#gcal').href = `https://calendar.google.com/calendar/render?${q}`;
    $('#wa').href = `https://wa.me/${C.WHATS}?text=${encodeURIComponent(waText())}`;
    setTimeout(() => { E.fx.confetti(); E.sfx('win'); }, 300);
    E.music.stop(4000);
  }
  function waText() {
    const r = String(vis.recado || '').trim();
    return `☕ *Café com ${C.HOSTS}*\n\nOi! Aqui é ${P.guest.nome}${parMode !== 'none' ? ` (e ${P.par.nome})` : ''}, acabei de aceitar o convite ✦\n\n` +
      `📅 ${fmtLong(vis.data)}, às ${vis.hora}\n👥 ${compTxt()}\n🎁 ${ofTxt() && ofTxt() !== 'Nada' ? 'Vou levar: ' + ofTxt() : 'Vou de mãos vazias e coração cheio'}\n` +
      `🏆 ${titulo} · ${E.score.total} pontos\n🎲 Dado do destino: ${dado}. ${bencao}` + (r ? `\n\n💬 ${r}` : '');
  }
  $('#again').onclick = () => location.reload();

  /* ---- imagem do convite (story 1080×1920) ---- */
  async function makeImage() {
    try { await Promise.all(['130px "IM Fell English SC"', 'italic 60px "IM Fell English"', '44px "Spectral"', '40px "Pixelify Sans"'].map(f => document.fonts.load(f))); } catch (_) {}
    const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), T = E.theme();
    const bg = x.createRadialGradient(W / 2, H * .35, 50, W / 2, H / 2, H * .8); bg.addColorStop(0, T.card1); bg.addColorStop(.6, T.card2); bg.addColorStop(1, T.ink); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.fillStyle = T.bone; for (let i = 0; i < 180; i++) { x.globalAlpha = Math.random() * .5 + .1; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + .4, 0, 6.283); x.fill(); }
    x.globalAlpha = 1; x.strokeStyle = T.gold; x.lineWidth = 3; x.strokeRect(60, 60, W - 120, H - 120); x.lineWidth = 1.5; x.globalAlpha = .6; x.strokeRect(84, 84, W - 168, H - 168); x.globalAlpha = 1;
    const ex = W / 2, ey = 320; x.save(); x.translate(ex, ey); x.fillStyle = T.ember; x.globalAlpha = .9;
    for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.beginPath(); x.moveTo(0, -(i % 2 ? 120 : 150)); x.lineTo(10, -78); x.lineTo(-10, -78); x.closePath(); x.fill(); }
    x.globalAlpha = 1; const cg = x.createRadialGradient(-15, -15, 5, 0, 0, 75); cg.addColorStop(0, '#FFF3DA'); cg.addColorStop(1, T.gold); x.fillStyle = cg; x.beginPath(); x.arc(0, 0, 72, 0, 6.283); x.fill();
    x.fillStyle = T.ink; x.font = '46px "IM Fell English SC", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(S() ? '♡' : 'D✦L', 0, 4); x.restore();
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const Tx = (t, y, font, col, a = 1) => { x.globalAlpha = a; x.font = font; x.fillStyle = col; x.fillText(t, W / 2, y); x.globalAlpha = 1; };
    const d = pd(vis.data), nm = names();
    Tx('XXI · O ENCONTRO', 550, '40px "IM Fell English SC", Georgia, serif', T.gold);
    Tx(`${C.HOSTS} esperam por`, 630, '44px "Spectral", Georgia, serif', T.bone, .8);
    Tx(nm, 770, `${nm.length > 14 ? 96 : 130}px "IM Fell English SC", Georgia, serif`, T.gold2);
    Tx(WD[d.getDay()], 880, 'italic 68px "IM Fell English", Georgia, serif', T.bone);
    Tx(String(d.getDate()), 1170, '320px "IM Fell English SC", Georgia, serif', T.bone);
    Tx(`de ${MO[d.getMonth()]}`, 1260, 'italic 68px "IM Fell English", Georgia, serif', T.bone);
    Tx(`às ${vis.hora}`, 1370, '80px "Pixelify Sans", monospace', T.gold);
    Tx(compTxt(), 1450, '42px "Spectral", Georgia, serif', T.bone, .8);
    Tx(`🏆 ${titulo} · ${E.score.total} pts`, 1530, '44px "Pixelify Sans", monospace', T.gold2);
    x.font = 'italic 44px "IM Fell English", Georgia, serif'; x.fillStyle = T.gold2;
    const words = `Dado do destino: ${dado}. ${bencao}`.split(' '); let line = '', y = 1630;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 820) { x.fillText(line, W / 2, y); line = w; y += 58; } else line = t; }
    x.fillText(line, W / 2, y);
    Tx('Um café com Dhione & Luh', H - 140, '38px "IM Fell English SC", Georgia, serif', T.gold, .8);
    return c;
  }
  $('#saveImg').onclick = async () => {
    loader(true, 'Pintando sua carta…');
    try {
      const c = await makeImage(), url = c.toDataURL('image/png');
      $('#imgOut').src = url; $('#dlImg').href = url;
      const blob = await new Promise(r => c.toBlob(r, 'image/png')), file = new File([blob], 'convite-cafe.png', { type: 'image/png' });
      const canShare = navigator.canShare && navigator.canShare({ files: [file] });
      $('#shareImg').hidden = !canShare; $('#shareImg').onclick = () => navigator.share({ files: [file], title: 'Meu convite' }).catch(() => {});
      loader(false); $('#imgModal').classList.add('on'); E.sfx('select');
    } catch (e) { loader(false); fail('Não consegui gerar a imagem. Tire um print da carta.'); }
  };
  $('#closeImg').onclick = () => $('#imgModal').classList.remove('on');

  /* ganchos para teste automatizado */
  window.__cafe = { get agenda() { return agenda; }, P, vis, get deck() { return deck; }, get idx() { return idx; }, gdone, ignite, get parMode() { return parMode; } };
})();
