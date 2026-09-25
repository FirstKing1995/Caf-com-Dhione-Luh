/* ============================================================
   CONFIGURAÇÃO ÚNICA — vale para o convite E para a sala de vocês
   ============================================================ */
window.CAFE = {
  // URL do Web App do Apps Script (termina em /exec). Vazio = modo demonstração.
  API_URL: 'https://script.google.com/macros/s/AKfycbxvSgYUFRWCRn_IukwBLN8cdj5A1xvfB4Z_pVEk7HGVLmbVYiTdwvgmqjrsm3bD8mHJ/exec',

  // WhatsApp que recebe a mensagem do convidado (55 + DDD + número, só dígitos)
  WHATS: '5588999764866',

  HOSTS: 'Dhione & Luh',
  LOCAL: 'Rua Coronel José Marinho - 149 (Casa com flores brancas na frente)',                                  // endereço que vai na agenda (opcional)
  HORAS: ['17:00', '17:15', '17:30', '17:45'],
  DIAS_A_FRENTE: 35
};

/* Comunicação com o Apps Script: GET simples (mais compatível com navegadores de
   dentro do WhatsApp/Instagram), POST só para envios grandes, 3 tentativas. */
window.cafeApi = async function (action, payload = {}) {
  const body = JSON.stringify({ action, ...payload });
  const url = window.CAFE.API_URL;
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const q = encodeURIComponent(body);
      const r = q.length < 6000
        ? await fetch(`${url}?d=${q}&t=${Date.now()}`, { signal: ctrl.signal, redirect: 'follow' })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(timer);
      const txt = await r.text();
      try { return JSON.parse(txt); }
      catch (_) { throw new Error(/<html|<!DOCTYPE/i.test(txt) ? 'O servidor devolveu uma página em vez de dados. Confira se a implantação está como "Qualquer pessoa".' : 'Resposta inválida do servidor.'); }
    } catch (e) {
      last = e;
      if (i < 2) await new Promise(r => setTimeout(r, 900 * (i + 1)));
    }
  }
  throw new Error(last && last.name === 'AbortError'
    ? 'O servidor demorou demais para responder. Tente de novo.'
    : (last && last.message && !/fetch|network|load failed/i.test(last.message) ? last.message : 'Sem conexão com o servidor. Confira a internet e tente de novo.'));
};
