/* =====================================================================
   CONTEÚDO — perguntas, reações do mascote, bênçãos, títulos e spoiler
   Em cada opção: l = texto que o convidado vê · k = leitura direta (painel)
   Textos com {m, s}: m = fluxo monogâmico · s = fluxo quente
   ===================================================================== */
window.CONTENT = (() => {
  const FLUXOS = {
    mono:    { k: 'Monogâmico(a)',      flow: 'mono'  },
    nd:      { k: 'Preferiu não dizer', flow: 'mono'  },
    aberto:  { k: 'Não-monogâmico(a)',  flow: 'spicy' },
    liberal: { k: 'Liberal',            flow: 'spicy' },
    curioso: { k: 'Curioso(a)',         flow: 'spicy' }
  };

  const GENEROS = ['MPB', 'Forró e piseiro', 'Samba e pagode', 'Rock', 'Jazz e lo-fi', 'R&B e soul', 'Rap e trap', 'Funk', 'Eletrônica', 'Sertanejo', 'Pop', 'Indie', 'Reggae', 'Louvor'].map(l => ({ v: l, l }));

  const TEMAS = [
    { v: 'jogos', i: '🎲', l: 'Jogos e mundos de fantasia', k: 'Jogos' },
    { v: 'espiritual', i: '🔮', l: 'Astros, oráculos e espiritualidade', k: 'Espiritualidade' },
    { v: 'viagens', i: '✈️', l: 'Viagens e lugares longe', k: 'Viagens' },
    { v: 'negocios', i: '💼', l: 'Negócios, dinheiro e planos', k: 'Negócios' },
    { v: 'telas', i: '🎬', l: 'Filmes, séries e livros', k: 'Filmes/séries/livros' },
    { v: 'filosofia', i: '🤔', l: 'As grandes perguntas da vida', k: 'Filosofia' },
    { v: 'familia', i: '🏡', l: 'Família, filhos e casa', k: 'Família' },
    { v: 'musica', i: '🎧', l: 'Música e shows', k: 'Música' },
    { v: 'fofoca', i: '🤭', l: 'Uma boa fofoca, confesso', k: 'Fofoca' }
  ];
  const JOGOS_BASE = [
    { v: 'tabuleiro', l: 'Tabuleiro e estratégia', k: 'Tabuleiro' },
    { v: 'cartas', l: 'Baralho na mão', k: 'Cartas' },
    { v: 'rpg', l: 'Dados, fichas e RPG', k: 'RPG' },
    { v: 'video', l: 'Videogame', k: 'Videogame' }
  ];

  /* ---------------- perfil (vale para convidado e para o par) ---------------- */
  function profileSteps(flow, { partner = false } = {}) {
    const sp = flow === 'spicy';
    const st = [
      { id: 'bebida', lab: 'Bebida', arc: 'A Poção', g: '☉', type: 'single',
        q: { m: 'Toda tarde começa com uma poção. Qual é a sua?', s: 'Pra começar esquentando: como você gosta?' },
        opts: [
          { v: 'preto', l: { m: 'Preto, forte, de acordar defunto', s: 'Preto, forte e bem quente' }, k: 'Café preto', r: { m: 'Respeito. Gente séria.', s: 'Forte e quente… anotado 😏' } },
          { v: 'leite', l: { m: 'Com leite, um abraço em forma de xícara', s: 'Com leite, cremosinho' }, k: 'Café com leite', r: 'Fofo(a). Fica a dica: a gente não pode leite, mas você pode 😌' },
          { v: 'cha', l: 'Chá', k: 'Chá', x: 'Qual chá? Camomila, hibisco, capim-santo…', r: 'Chá?! Elegância detectada. 🫖' },
          { v: 'agua', l: 'Nem café nem chá, só uma água e paz', k: 'Nem café nem chá', r: 'Água num café?! Tudo bem, a gente te ama mesmo assim 😅' }
        ] },
      { id: 'g_pour', arc: 'A Xícara', g: '✧', type: 'game', game: 'pour', duel: true,
        q: { m: 'Sirva sua xícara até a linha dourada.', s: 'Enche até a marca… sem transbordar (ainda) 😏' },
        sub: 'Segure pra servir. Solte na hora certa.' },
      { id: 'comida', gid: 'prato', lab: 'No prato', arc: 'A Mesa', g: '✦', type: 'plate', min: 1,
        q: { m: 'O cardápio é simples e sagrado. Monte seu prato.', s: 'Tapioca ou cuscuz? Pode querer os dois, aqui ninguém julga guloso(a).' },
        sub: 'Arraste pro prato ou toque. Tapioca, cuscuz e ovo, feitos com carinho.',
        opts: [{ v: 'Tapioca', l: 'Tapioca', i: 'tapioca' }, { v: 'Cuscuz', l: 'Cuscuz', i: 'cuscuz' }, { v: 'Ovo', l: 'Ovo', i: 'ovo' }] },
      { id: 'g_tapioca', arc: 'A Frigideira', g: '◯', type: 'game', game: 'tapioca',
        q: { m: 'Ajuda a virar a tapioca?', s: 'Mostra que você sabe virar 😏' },
        sub: 'Toque em "Virar" quando o ponteiro passar na faixa dourada.' },
      { id: 'restricoes', lab: 'Restrições', arc: 'O Guardião', g: '◈', type: 'text', optional: true,
        q: 'Tem algo que você não pode ou não come de jeito nenhum?', sub: 'Alergia, intolerância, sem glúten… a gente se vira. (A gente mesmo não pode leite, então entende 🥛🚫)', ph: 'Se come de tudo, é só pular' },
      { id: 'musica', lab: 'Música', arc: 'A Trilha', g: '♫', type: 'multi', style: 'vinyl', min: 1,
        q: { m: 'Se essa tarde tivesse trilha sonora, tocaria…', s: 'Que som combina com uma tarde quente?' }, sub: 'Toque nos discos que você colocaria pra tocar.',
        groups: [{ id: 'generos', opts: GENEROS }], text: { id: 'artista', ph: 'Um nome que não pode faltar na playlist' } },
      { id: 'g_catcher', arc: sp ? 'A Tentação' : 'A Chuva', g: '☂', type: 'game', game: 'catcher', duel: true,
        q: { m: 'Choveu cuscuz! Pega tudo… menos o leite.', s: 'Choveu tentação. Pega o que é bom, foge do climão.' },
        sub: 'Arraste o prato. 20 segundos.' }
    ];
    if (!sp) {
      st.push(
        { id: 'conversas', lab: 'Assuntos', arc: 'Os Portais', g: '✧', type: 'swipe', min: 1,
          q: 'Deu match com qual assunto?', sub: 'Arraste pra direita se curte, pra esquerda se passa.', yes: 'Curto', no: 'Passo',
          groups: [{ id: 'temas', opts: TEMAS }] },
        { id: 'jogos', lab: 'Jogos', arc: 'O Tabuleiro', g: '◇', type: 'multi', min: 1,
          q: 'Se aparecer um jogo na mesa depois do café…', sub: 'Escolha quantos quiser.',
          groups: [{ id: 'tipos', opts: [...JOGOS_BASE, { v: 'perguntas', l: 'Jogos de perguntas e conversa', k: 'Jogos de conversa' }, { v: 'torcida', l: 'Prefiro torcer de fora', k: 'Não joga' }] }] },
        { id: 'g_memory', arc: 'A Memória', g: '☽', type: 'game', game: 'memory',
          q: 'Os arcanos se embaralharam. Encontre os pares!', sub: 'Olha bem no comecinho, eles se mostram rapidinho.' }
      );
    } else {
      st.push(
        { id: 'g_rub', arc: 'O Termômetro', g: '✺', type: 'game', game: 'rub', duel: true,
          q: 'Antes das próximas perguntas… esfrega aqui pra esquentar 🔥', sub: 'Esfregue o dedo na área até o termômetro estourar.' },
        { id: 'olhar', lab: 'Atração', arc: 'O Olhar', g: '☽', type: 'single', q: 'Sem rodeio: você sente atração por…', opts: [
          { v: 'homens', l: 'Homens', k: 'Homens' },
          { v: 'mulheres', l: 'Mulheres', k: 'Mulheres' },
          { v: 'ambos', l: 'Homens e mulheres', k: 'Homens e mulheres (bi)', r: 'O dobro de opções. Inteligente 😏' },
          { v: 'todos', l: 'Todo mundo, gênero não importa', k: 'Todo mundo (pan)', r: 'Ó, igualzinho a gente 👀' },
          { v: 'segredo', l: 'Prefiro guardar esse segredo', k: 'Não disse', r: 'Mistério também é sexy.' }
        ] },
        { id: 'situacao', lab: 'Situação', arc: 'O Par', g: '∞', type: 'single', q: 'E hoje você está…', opts: [
          { v: 'solteiro', l: 'Solteiro(a) e disponível 😏', k: 'Solteiro(a)', r: 'Anotado com caneta dourada ✍️' },
          { v: 'casal', l: 'Num casal', k: 'Em casal' },
          { v: 'trisal', l: 'Num trisal ou mais', k: 'Trisal ou mais', r: 'Precisa de mais cadeiras? 😅' },
          { v: 'complicado', l: 'É complicado', k: 'Complicado', r: 'Café resolve. Ou complica mais. Veremos.' }
        ] },
        { id: 'desejos', lab: 'Curte', arc: 'O Desejo', g: '♡', type: 'swipe', min: 1,
          q: 'O que te dá vontade de ficar mais um pouquinho?', sub: 'Direita: quero 🔥 · Esquerda: passo. Tudo com consentimento, sempre.', yes: 'Quero', no: 'Passo',
          groups: [{ id: 'des', opts: [
            { v: 'papo', i: '🗣️', l: 'Papo sem filtro sobre sexo', k: 'Conversa sobre sexo' },
            { v: 'flerte', i: '😏', l: 'Flerte e troca de olhares', k: 'Flerte' },
            { v: 'duplo', i: '🍌', l: 'Duplo sentido o tempo todo', k: 'Duplo sentido' },
            { v: 'beijo', i: '💋', l: 'Um beijo, se rolar o clima', k: 'Beijo' },
            { v: 'troca', i: '🔄', l: 'Troca de casal', k: 'Troca de casal' },
            { v: 'olhar', i: '👀', l: 'Só olhar, sem tocar', k: 'Só observar' },
            { v: 'descobrindo', i: '🧭', l: 'Ainda estou descobrindo', k: 'Descobrindo' }
          ] }] },
        { id: 'pimenta', lab: 'Pimenta', arc: 'A Pimenta', g: '☼', type: 'scale', q: 'Até onde a conversa pode esquentar?',
          labels: ['Morna, só uma piadinha', 'Temperada', 'Quente', 'Pelando', 'Sem filtro nenhum 🔥'] },
        { id: 'g_garrafa', arc: 'A Garrafa', g: '♁', type: 'game', game: 'garrafa',
          q: 'Gira a garrafa. A prenda fica guardada pro dia do café 😈', sub: 'Dê um peteleco na garrafa ou toque em Girar.' },
        { id: 'jogos', lab: 'Jogos', arc: 'O Tabuleiro', g: '◇', type: 'multi', min: 1, q: 'Se aparecer um jogo na mesa…', sub: 'Escolha quantos quiser.',
          groups: [{ id: 'tipos', opts: [...JOGOS_BASE,
            { v: 'vd', l: 'Verdade ou desafio apimentado', k: 'Verdade ou desafio picante' },
            { v: 'eununca', l: 'Eu nunca…', k: 'Eu nunca' },
            { v: 'cartasq', l: 'Cartas picantes', k: 'Cartas picantes' },
            { v: 'conversa', l: 'Só conversa quente mesmo', k: 'Só conversa' }] }] },
        { id: 'conversas', lab: 'Assuntos', arc: 'Os Portais', g: '✧', type: 'swipe', min: 0,
          q: 'E fora da cama… digo, fora desse assunto, o que rende papo?', sub: 'Direita: curto · Esquerda: passo.', yes: 'Curto', no: 'Passo',
          groups: [{ id: 'temas', opts: TEMAS }] },
        { id: 'limites', lab: 'Limites', arc: 'O Limite', g: '◈', type: 'text', optional: true,
          q: 'Tem algo que é limite pra você?', sub: 'A gente respeita 100%. Aqui só rola o que todo mundo quer.', ph: 'Pode escrever sem vergonha, ou pular' }
      );
    }
    st.push(
      { id: 'erva', lab: 'Erva', arc: 'A Erva', g: '❦', type: 'single', q: 'Se aparecer um baseado na roda, você…', opts: [
        { v: 'junto', l: 'Acende junto', k: 'Fuma', r: 'Já tá de boa só de responder 🌿' },
        { v: 'deboa', l: 'Não acende, mas fica de boa', k: 'Não fuma, não se incomoda' },
        { v: 'guardada', l: 'Prefere que fique guardado', k: 'Prefere que não role', r: 'Combinado. Fica guardadinho.' },
        { v: 'camomila', l: 'Que erva? Camomila? 😇', k: 'Não entra nessa', r: 'Camomila tem de sobra, pode deixar 😇' }
      ] },
      { id: 'sobre', lab: 'Sobre', arc: 'O Espelho', g: '◐', type: 'text', optional: true,
        q: { m: 'Conta uma coisa sobre você que a gente precisa saber antes do café.', s: 'Conta um segredinho seu… ou só algo que a gente precisa saber 😏' },
        ph: 'Uma mania, um sonho, uma história…' }
    );
    return partner ? st.filter(s => s.type !== 'game' || s.duel) : st;
  }

  const COMPANHIA = { id: 'companhia', v: 1, arc: 'Os Companheiros', g: '∞', type: 'companhia', q: 'Quem atravessa o portal com você?',
    sub: 'O convite se estende a quem é seu. Se trouxer seu par, ele(a) também joga e responde. Nada de resposta por procuração 😄' };

  const VISIT = [
    { id: 'oferenda', v: 1, arc: 'A Oferenda', g: '✶', type: 'single', q: 'Quer trazer algo pra mesa?', sub: 'Opcional de verdade. Café, chá, tapioca e cuscuz já estão garantidos.', opts: [
      { v: 'bolo', l: 'Um bolo', k: 'Bolo', x: 'Qual bolo?', r: 'BOLO! Você acabou de ganhar 10 pontos de amizade 🍰' },
      { v: 'salgado', l: 'Algo salgado', k: 'Salgado', x: 'O quê?' },
      { v: 'bebida', l: 'Uma bebida', k: 'Bebida', x: 'Qual?' },
      { v: 'surpresa', l: 'Surpresa, não conto', k: 'Surpresa', r: 'Ui, misterioso(a).' },
      { v: 'nada', l: 'Venho de mãos vazias e coração cheio', k: 'Nada', r: 'Coração cheio já vale. 💛' }
    ] },
    { id: 'g_stars', v: 1, arc: 'A Constelação', g: '✦', type: 'game', game: 'stars',
      q: { m: 'Ligue as estrelas pra abrir a agenda dos astros.', s: 'Ligue as estrelas… o desenho que elas formam diz tudo 😏' }, sub: 'Toque na estrela que está pulsando. Rápido vale bônus.' },
    { id: 'data', v: 1, arc: 'O Dia', g: '☉', type: 'date', q: 'Qual dia os astros reservam pra gente?', sub: 'De segunda a sexta. Dias com selo já estão ocupados.' },
    { id: 'hora', v: 1, arc: 'A Hora', g: '◷', type: 'hora', q: 'E a que horas você chega?' },
    { id: 'recado', v: 1, arc: 'O Recado', g: '✎', type: 'text', optional: true,
      q: { m: 'Quer dizer algo sobre o convite, ou sobre a gente?', s: 'Quer mandar um recado pra gente? Pode ser safado 😏' }, ph: 'Um elogio, uma provocação, um pedido de música…' }
  ];

  /* ---------------- falas do mascote (Xicrinha) ---------------- */
  const SAY = {
    hello: { m: ['Oi! Eu sou a Xicrinha. Vou te acompanhar ☕', 'Bem-vindo(a)! Segura firme que é jogo.'], s: ['Oi, delícia. Eu sou a Xicrinha 😏', 'Ih, escolheu o caminho quente. Gostei.'] },
    skip: ['Pular? Tá bom… eu finjo que não vi 👀', 'Mistério. Respeito.'],
    p2: ['Player 2 na área! Sem colar, hein 👀', 'Agora é contigo. A outra pessoa não pode olhar!'],
    nag: ['Escolhe aí, eu espero ☕', 'Tic-tac… o café esfria!']
  };

  /* ---------------- bênçãos do dado ---------------- */
  function blessing(n, sp) {
    if (n === 20) return sp ? 'Acerto crítico! A tarde vai ser inesquecível… e talvez não termine às 18h 😏' : 'Acerto crítico! Amizade selada pra esta vida e pras próximas. Sua tapioca vem caprichada.';
    if (n === 1) return sp ? 'Falha crítica… você começa pagando a primeira prenda 😈' : 'Falha crítica… O destino decidiu: você ajuda a lavar as xícaras no final. 😂';
    const pool = n >= 15
      ? (sp ? ['Os astros piscaram pra você. Vem preparado(a) 😏', 'A química tá escrita nas estrelas.', 'Vai ter olhar que fala mais que palavra.']
            : ['Os astros sorriem: conversa longa, riso solto e café que não esfria.', 'Vem aí uma daquelas tardes que viram história.', 'Sorte grande: o café vai estar quentinho quando você chegar.'])
      : n >= 8
      ? (sp ? ['Clima morno com chance de esquentar.', 'Traga seu melhor duplo sentido.', 'O oráculo prevê uma risada safada lá pelas 17h40.']
            : ['Tarde tranquila no horizonte. Traga seu melhor assunto.', 'O oráculo prevê uma boa gargalhada lá pelas 17h40.', 'Café na medida certa, conversa na medida certa.'])
      : (sp ? ['Os astros estão tímidos… cabe a você esquentar.', 'Começo devagar, mas quem disse que devagar é ruim?']
            : ['O oráculo ficou tímido. Tudo bem, o café resolve.', 'Destino morno, café quente. Vai dar tudo certo.']);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ---------------- título pela pontuação ---------------- */
  function titulo(pts, sp, dupla) {
    const T = dupla
      ? (sp ? ['Curiosos de Plantão', 'Provocadores Natos', 'Diabinhos Certificados 😈', 'Entidades da Pimenta 🔥']
            : ['Aprendizes de Barista', 'Mestres da Tapioca', 'Oráculos do Cuscuz', 'Lendas do Café da Tarde'])
      : (sp ? ['Curioso(a) de Plantão', 'Provocador(a) Nato(a)', 'Diabinho(a) Certificado(a) 😈', 'Entidade da Pimenta 🔥']
            : ['Aprendiz de Barista', 'Mestre(a) da Tapioca', 'Oráculo do Cuscuz', 'Lenda do Café da Tarde']);
    const lim = dupla ? [450, 850, 1200] : [260, 500, 720];
    const i = pts < lim[0] ? 0 : pts < lim[1] ? 1 : pts < lim[2] ? 2 : 3;
    return T[i];
  }

  /* ---------------- SPOILER: um pouquinho sobre nós ----------------
     Montado a partir das respostas do Dhione & da Luh.
     ctx: { erva: valor da erva do convidado, data: 'segunda, 20 de outubro' } */
  function spoiler(sp, ctx = {}) {
    const ervaOk = ['junto', 'deboa'].includes(ctx.erva);
    const dia = ctx.data || 'o dia do café';
    if (!sp) return [
      { g: '☉', arc: 'O Casal', t: 'Dhione & Luh', p: 'Dois anfitriões que transformam um café da tarde em evento. (Você percebeu, né? Teve até mini game.)' },
      { g: '☕', arc: 'A Poção', t: 'Preto. Forte. Sem leite.', p: 'Leite aqui é proibido, e não é frescura: a gente não pode mesmo. Por isso fugir dele valia ponto 🥛🚫' },
      { g: '✦', arc: 'A Mesa', t: 'O trio sagrado', p: 'Tapioca, cuscuz e ovo. A gente come os três e ainda pergunta se tem mais.' },
      { g: '♫', arc: 'A Trilha', t: 'Playlist sem crise', p: 'MPB, rock, jazz, R&B, rap, indie, reggae… Nossa playlist não tem crise de identidade. Tem várias.' },
      { g: '◇', arc: 'O Tabuleiro', t: 'Viciados em jogo', p: 'Tabuleiro, cartas, RPG, videogame. Se tem regra e dado, a gente joga. Se perde, pede revanche.' },
      { g: '✧', arc: 'Os Portais', t: 'Papo de tudo', p: 'Espiritualidade, viagens, negócios, filosofia, família, filmes… e fofoca. Principalmente fofoca.' },
      ...(ervaOk ? [{ g: '❦', arc: 'A Erva', t: 'Plantinha na roda', p: 'Às vezes aparece uma plantinha por aqui. Você disse que fica de boa, então tá tudo certo 🌿' }] : []),
      { g: '🔒', arc: 'O Arcano Selado', t: 'Esse a gente não conta', p: `Esse arcano só abre pessoalmente, ${dia}, com café na mão. Pode vir curioso(a).`, lock: true }
    ];
    return [
      { g: '∞', arc: 'O Casal', t: 'Portas abertas', p: 'Dhione & Luh. Um casal de portas abertas. E janelas. E… bom, você entendeu 😏' },
      { g: '☽', arc: 'O Olhar', t: 'Pan, com orgulho', p: 'A gente acha todo mundo bonito. Sim, inclusive você. Principalmente você.' },
      { g: '🌶️', arc: 'A Pimenta', t: 'Nível 5 de 5', p: 'Quando a gente respondeu, o termômetro estourou. Literalmente. Tivemos que trocar.' },
      { g: '♡', arc: 'O Desejo', t: 'A lista é longa', p: 'Papo sem filtro, flerte, duplo sentido, beijo, troca de casal, olhar de longe… O resto a gente conta pessoalmente. Ou não conta. Mostra. 😈' },
      { g: '◇', arc: 'O Tabuleiro', t: 'Jogo com prenda', p: 'RPG, cartas, tabuleiro… e verdade ou desafio apimentado, eu nunca, cartas picantes. Quem perde paga prenda. Quem ganha também.' },
      { g: '☕', arc: 'A Poção', t: 'Forte e quente', p: 'Café preto, sem leite (a gente não pode, sério). Pra combinar com a tarde.' },
      ...(ervaOk ? [{ g: '❦', arc: 'A Erva', t: 'A gente acende', p: 'Você também, ou pelo menos fica de boa. Então já sabe o clima 🌿' }] : []),
      { g: '◈', arc: 'O Limite', t: 'Só uma regra', p: 'Limite? Só um, e esse não se negocia: todo mundo tem que querer. O resto… a gente conversa 😏' },
      { g: '✶', arc: 'O Segredo', t: 'Censurado pelo oráculo', redact: true,
        p: 'Amamos conhecer gente nova, e depois ███████ ████ e █████ ██████ ████… ',
        reveal: 'Achou que ia ser fácil assim? Essa parte é só ao vivo 😈' },
      { g: '🔒', arc: 'O Arcano Selado', t: 'Abre devagar', p: `Esse só abre ${dia}. E dizem que abre devagarinho…`, lock: true }
    ];
  }

  const tx = (v, sp) => (v && typeof v === 'object' && !Array.isArray(v)) ? (sp ? v.s : v.m) : v;
  return { FLUXOS, profileSteps, COMPANHIA, VISIT, SAY, blessing, titulo, spoiler, tx };
})();
