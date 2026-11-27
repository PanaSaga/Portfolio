/* 인챈트 인 차트 · 화면 / 입력 / 튜토리얼 */
(function () {
  'use strict';
  const CONFIG = {
    startCoins: 0,          // 시작 코인 없음
    clearReward: 30,        // 클리어 보상 (별 개수와 무관, 클리어할 때마다)
    starPrice: 30,          // 부족한 별 1개 가격
    hintCost: [10, 20, 40],
    maxHearts: 5,
    undoDepth: 99,          // 되돌리기는 여러 번 가능
    dimStart: 0.75,         // 처음 시작할 때 덮개 농도
    dim: 0.7,               // 조작 타이밍이 아닐 때 덮개 농도
    cell: 140, boardX: 40, boardY: 376,
    trayRect: { x: 752, y: 366, w: 250, h: 588 },
    inspectorRect: { x: 20, y: 1108, w: 984, h: 322 },
  };
  const AV = '?v=2';   // 블록 그림을 바꿨을 때 브라우저 캐시를 피하는 버전 표시
  const KW = window.KEYWORDS, E = window.Engine, C = CONFIG.cell, BX = CONFIG.boardX, BY = CONFIG.boardY;
  const $ = id => document.getElementById(id);
  const app = $('app');

  /* ── 저장 ── */
  const SAVE_KEY = 'eic_save_v1';
  let save = { coins: CONFIG.startCoins, stars: {}, lang: null };
  try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { /* 저장 불가 환경 */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 무시 */ } };

  /* ── 언어 ── */
  const LANGS = ['ko', 'en', 'ja'];
  function detectLang() {
    const n = (navigator.language || 'ko').toLowerCase();
    return n.startsWith('ja') ? 'ja' : n.startsWith('en') ? 'en' : 'ko';
  }
  let lang = LANGS.indexOf(save.lang) >= 0 ? save.lang : detectLang();
  function t(path, vars) {
    const pick = root => path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
    let v = pick(window.I18N[lang]);
    if (v == null) v = pick(window.I18N.ko);
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => vars[k]);
    return v;
  }
  function setLang(l) { lang = l; save.lang = l; persist(); applyLang(); }
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $('titleLogo').src = 'assets/logos/title-' + lang + '.png'; $('clearLogo').src = 'assets/logos/clear-' + lang + '.png';
    applyLangRows(); renderCoins();
    if (current === 'select') renderSelect();
    if (current === 'story') renderStory();
    if (current === 'game') renderGame();
    if (current === 'result') renderResult();
  }
  function applyLangRows() {
    document.querySelectorAll('[data-langrow]').forEach(row => {
      row.innerHTML = '';
      LANGS.forEach(l => {
        const b = mk('button', 'lang-btn' + (l === lang ? ' on' : ''), window.I18N[l].langName);
        b.onclick = () => { setLang(l); if ($('modal').classList.contains('on')) openSettings(); };
        row.appendChild(b);
      });
    });
  }

  /* ── 화면 전환 / 스케일 ── */
  let current = 'title', scale = 1;
  function show(name) {
    current = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 'scr-' + name));
    closeModal();
  }
  function fit() {
    scale = Math.min(window.innerWidth / 1024, window.innerHeight / 1536);
    app.style.transform = 'scale(' + scale + ')';
    app.style.left = (window.innerWidth - 1024 * scale) / 2 + 'px';
    app.style.top = (window.innerHeight - 1536 * scale) / 2 + 'px';
  }
  window.addEventListener('resize', fit);
  const toDesign = e => { const r = app.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; };
  const rectOf = el => { const r = el.getBoundingClientRect(), a = app.getBoundingClientRect(); return { x: (r.left - a.left) / scale, y: (r.top - a.top) / scale, w: r.width / scale, h: r.height / scale }; };
  const centerOf = el => { const r = rectOf(el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  function mk(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function renderCoins() { document.querySelectorAll('[data-coin]').forEach(el => { el.textContent = save.coins; }); }
  let toastTimer;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 1600); }
  function fitText(el, max, min) {
    let size = max; el.style.fontSize = size + 'px';
    const box = el.parentElement;
    while (size > min && (el.scrollHeight > box.clientHeight - 16 || el.scrollWidth > box.clientWidth)) { size -= 1; el.style.fontSize = size + 'px'; }
  }

  /* ── 모달 ── */
  function openModal(build) { const box = $('modalBox'); box.className = 'm-popup'; box.innerHTML = ''; build(box); $('modal').classList.add('on'); }
  function closeModal() { $('modal').classList.remove('on'); }
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  const img = (src, cls) => { const i = new Image(); i.src = src; i.alt = ''; if (cls) i.className = cls; return i; };
  function popButton(cls, iconSrc, label, onclick) {
    const b = mk('button', cls); if (iconSrc) b.appendChild(img(iconSrc)); b.appendChild(mk('span', '', label)); b.onclick = onclick; return b;
  }
  function openSettings() {
    openModal(box => {
      const tab = mk('div', 'pop-tab');
      tab.appendChild(img('assets/decor/mobile/hud-wildflower.png', 'deco l'));
      tab.appendChild(img('assets/icons/settings.png')); tab.appendChild(mk('span', '', t('ui.settings')));
      tab.appendChild(img('assets/decor/mobile/hud-wildflower.png', 'deco r'));
      box.appendChild(tab);
      const row = mk('div', 'lang-row'); row.setAttribute('data-langrow', ''); box.appendChild(row);
      if (current === 'game') {
        box.appendChild(popButton('m-cream pop-btn', 'assets/icons/undo.png', t('ui.restart'), () => { closeModal(); startStage(G.stage.id); }));
        box.appendChild(popButton('m-cream pop-btn', 'assets/icons/mobile/journal.png', t('ui.toSelect'), goSelect));
      }
      box.appendChild(popButton('m-primary pop-close-btn', null, t('ui.close'), closeModal));
      applyLangRows();
    });
  }
  document.querySelectorAll('[data-open-settings]').forEach(b => { b.onclick = openSettings; });
  document.querySelectorAll('[data-dummy]').forEach(b => { b.onclick = () => toast(t('ui.dummy')); });

  /* ══════════ 타이틀 / 스테이지 선택 ══════════ */
  $('btnStart').onclick = goSelect;
  function goSelect() { show('select'); renderSelect(); }
  function starImgs(n) { let h = ''; for (let i = 0; i < 3; i++) h += '<img src="assets/icons/' + (i < n ? 'star' : 'star-off') + '.png" alt="">'; return h; }
  const THUMB = { 1: 'assets/stage-thumbnails/first-fire.png', 2: 'assets/stage-thumbnails/rain.png', 3: 'assets/stage-thumbnails/river.png' };
  function renderSelect() {
    const list = $('chapterList'); list.innerHTML = '';
    window.CHAPTERS.forEach((ch, idx) => {
      const prev = window.CHAPTERS[idx - 1];
      const prevStars = prev ? prev.stages.reduce((a, s) => a + (save.stars[s] || 0), 0) : 0;
      const locked = ch.needStars > prevStars;
      const box = mk('div', 'chapter' + (locked ? ' locked' : ''));
      if (locked) {   // 잠긴 챕터: 한 줄로 필요 별 표시
        const card = mk('div', 'stage-card m-stage locked');
        card.appendChild(mk('span', 'chapter-tag', t('ui.chapter') + ' ' + ch.id));
        const need = mk('span', 'need'); need.appendChild(img('assets/icons/mobile/lock.png'));
        need.appendChild(mk('span', '', t('ui.needStars', { n: ch.needStars }) + ' (' + prevStars + '/' + ch.needStars + ')'));
        card.appendChild(need); box.appendChild(card); list.appendChild(box); return;
      }
      const head = mk('div', 'chapter-head'); head.appendChild(mk('span', 'chapter-tag', t('ui.chapter') + ' ' + ch.id)); box.appendChild(head);
      const rows = mk('div', 'stage-list');
      ch.stages.forEach(sid => {
        const playable = !!window.STAGES[sid];
        const card = mk(playable ? 'button' : 'div', 'stage-card m-stage' + (playable ? '' : ' soon'));
        if (THUMB[sid]) card.appendChild(img(THUMB[sid], 'thumb'));
        card.appendChild(mk('span', 'num', String(sid))); card.appendChild(mk('span', 'bar'));
        card.appendChild(mk('span', 'nm', t('stageName.' + sid) || ''));
        if (playable) { const st = mk('span', 'st'); st.innerHTML = starImgs(save.stars[sid] || 0); card.appendChild(st); card.onclick = () => startStory(sid); }
        else { card.appendChild(mk('span', 'soon', t('ui.comingSoon'))); card.appendChild(img('assets/icons/chevron-right.png', 'go')); }
        rows.appendChild(card);
      });
      box.appendChild(rows); list.appendChild(box);
    });
    renderCoins();
  }
  $('btnBack').onclick = () => show('title');

  /* ══════════ 스토리 컷 ══════════ */
  const S = { stage: null, i: 0 };
  function startStory(sid) { S.stage = window.STAGES[sid]; S.i = 0; show('story'); renderStory(); }
  function renderStory() {
    const st = S.stage, lines = t(st.textKey + '.intro');
    const cut = st.introCut[S.i], expr = st.introExpr[S.i], nCuts = Math.max.apply(null, st.introCut) + 1;
    $('storyTxt').textContent = lines[S.i];
    $('cutLabel').textContent = t('ui.placeholderCut') + ' ' + (cut + 1) + '/' + nCuts;
    // 임시 컷: 기존 리소스를 조합한 자리 표시 그림
    const art = $('cutArt');
    const portrait = '<img src="assets/portraits/cache-' + expr + '.png" style="left:%L;bottom:0;width:%W" alt="">';
    if (cut === 0) art.innerHTML = '<img src="assets/decor/greenhouse.png" style="left:-700px;top:0;height:100%" alt=""><div class="frost"></div>' + portrait.replace('%L', '120px').replace('%W', '580px') + '<div class="emo" style="left:40px;top:60px">❄️</div><div class="emo" style="right:50px;top:200px">❄️</div>';
    else if (cut === 1) art.innerHTML = '<img src="assets/decor/terrarium.png" style="left:136px;top:120px;width:540px" alt=""><div class="frost"></div><div class="emo" style="left:70px;top:80px">❄️</div><div class="emo" style="right:70px;top:120px">❄️</div><div class="emo" style="left:350px;top:30px">❄️</div>';
    else art.innerHTML = '<img src="assets/decor/greenhouse.png" style="left:-300px;top:0;height:100%" alt="">' + portrait.replace('%L', '20px').replace('%W', '520px') + '<img src="assets/decor/terrarium.png" style="right:30px;bottom:30px;width:300px" alt=""><div class="emo" style="right:130px;top:330px">✨</div>';
  }
  function storyNext() { S.i++; if (S.i >= t(S.stage.textKey + '.intro').length) startStage(S.stage.id); else renderStory(); }
  $('cut').onclick = storyNext; $('storyBox').onclick = storyNext;
  $('btnSkip').onclick = () => startStage(S.stage.id);

  /* ══════════ 인게임 ══════════ */
  const G = { stage: null, state: null, undo: [], mistakes: 0, sel: null, selKw: null, queue: [], line: null, busy: false, cleared: false,
    preview: null, drag: null, tut: null, hints: {}, known: {}, fail: null, cutActive: null, dimA: CONFIG.dim };

  function startStage(sid) {
    G.stage = window.STAGES[sid]; G.state = E.init(G.stage); G.undo = []; G.mistakes = 0; G.sel = null; G.selKw = null;
    G.queue = []; G.line = null; G.waiting = false; G.busy = false; G.cleared = false; G.preview = null; G.drag = null; G.hints = {}; G.known = {}; G.fail = null;
    G.tut = { seen: {}, used: {}, force: null, guide: null, spot: null, phase: 'intro' };
    E.settle(G.state, G.stage);
    show('game'); buildCells(); renderGame();
    tutStart();
  }
  const tk = k => G.stage.textKey + '.' + k;

  /* ── 대사 ──
     lines: [L(키, 줄번호, 표정, 비출 곳)] / done: 마지막 줄이 뜰 때 호출 (hold=true 면 마지막 줄도 터치 후 호출)
     넘길 줄이 남아 있는 동안은 "조작 타이밍이 아닌 때" 이므로 캐릭터·말풍선 외에는 어둡게 덮는다. */
  const L = (key, i, expr, holes, glow) => ({ key, i, expr, holes, glow });
  function applyGlow() {
    document.querySelectorAll('.yglow').forEach(e => e.classList.remove('yglow'));
    if (G.waiting && G.line && G.line.glow) document.querySelectorAll(G.line.glow).forEach(e => e.classList.add('yglow'));
  }
  function say(lines, done, hold) {
    G.queue = lines.slice(); G.onDone = done || null; G.hold = !!hold;
    nextLine();
  }
  function nextLine() {
    if (!G.queue.length) { G.waiting = false; $('blocker').classList.remove('on'); $('speech').classList.remove('more'); renderDim(); applyGlow(); const d = G.onDone; G.onDone = null; if (d) d(); drawGuide(); return; }
    G.line = G.queue.shift();
    renderSpeech();
    G.waiting = G.queue.length > 0 || G.hold;
    $('blocker').classList.toggle('on', G.waiting); $('speech').classList.toggle('more', G.waiting);
    renderDim(); applyGlow();
    if (!G.waiting) { const d = G.onDone; G.onDone = null; if (d) d(); }
    drawGuide();
  }
  $('blocker').addEventListener('click', nextLine);
  function renderSpeech() {
    if (!G.line) { $('speechTxt').textContent = ''; return; }
    $('speechTxt').textContent = [].concat(t(tk(G.line.key)))[G.line.i];
    fitText($('speechTxt'), 27, 17);
    if (G.line.expr) $('portraitImg').src = 'assets/portraits/cache-' + G.line.expr + '.png';
  }
  const fb = (k, expr) => say([L('fb.' + k, 0, expr || 'neutral')]);

  /* ── 어두운 덮개 + 비추기 ── */
  function cellsHole(cells) {
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    return { x: BX + x0 * C - 4, y: BY + y0 * C - 4, w: (Math.max.apply(null, xs) - x0 + 1) * C + 8, h: (Math.max.apply(null, ys) - y0 + 1) * C + 8 };
  }
  const blockHoles = id => { const b = E.get(G.state, id); return b ? (b.cells.length > 2 && E.def(G.stage, b).parts ? E.parts(G.stage, b).map(cellsHole) : [cellsHole(b.cells)]) : []; };
  const elHole = (sel, pad) => { const el = document.querySelector(sel); if (!el) return []; const r = rectOf(el), p = pad == null ? 8 : pad; return [{ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 }]; };
  function renderDim() {
    const dim = $('dim');
    let alpha = 0, holes = [];
    if (current === 'game' && !G.busy) {
      if (G.waiting) { alpha = G.dimA; holes = G.line && G.line.holes ? G.line.holes() : []; }
      else if (G.tut && G.tut.spot && !G.queue.length) { alpha = CONFIG.dim; holes = G.tut.spot(); }
    }
    if (!alpha) { dim.style.display = 'none'; return; }
    dim.style.display = 'block';
    const p = $('dimPath');
    p.setAttribute('d', 'M0 0H1024V1536H0Z' + holes.map(h => 'M' + h.x + ' ' + h.y + 'h' + h.w + 'v' + h.h + 'h' + (-h.w) + 'Z').join(''));
    p.setAttribute('fill-opacity', alpha);
  }

  /* ── 렌더 ── */
  function buildCells() {
    const cells = $('cells'); cells.innerHTML = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const c = mk('div', 'cell'); c.style.left = x * C + 3 + 'px'; c.style.top = y * C + 3 + 'px'; cells.appendChild(c); }
  }
  function renderGame() { renderHUD(); renderBoard(); renderTray(); renderInspector(); renderSpeech(); renderDim(); drawGuide(); }
  function renderHUD() {
    const hearts = Math.max(0, CONFIG.maxHearts - G.mistakes), h = $('hearts');
    h.innerHTML = '';
    for (let i = 0; i < CONFIG.maxHearts; i++) { const im = new Image(); im.src = 'assets/icons/' + (i < hearts ? 'heart' : 'heart-off') + '.png'; if (i === hearts && G.justLost) im.className = 'pop'; h.appendChild(im); }
    G.justLost = false;
    $('stars').innerHTML = starImgs(starsNow());
    $('objTxt').textContent = t(tk('goal')); fitText($('objTxt'), 28, 18);
    $('btnUndo').disabled = !G.undo.length || (!!G.tut.force && G.tut.force.type !== 'undo') || G.cleared;
    renderCoins();
  }
  const starsNow = () => Math.max(1, 3 - Math.floor(G.mistakes / 2));
  const BADGE_IMG = { move: 'word-move', growH: 'word-grow-horizontal', growV: 'word-grow-vertical' };
  const place = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px'; };
  const bbox = cells => { const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]); const x = Math.min.apply(null, xs), y = Math.min.apply(null, ys); return { x, y, w: Math.max.apply(null, xs) - x + 1, h: Math.max.apply(null, ys) - y + 1 }; };
  const isRect = cells => { const bb = bbox(cells); return cells.length === bb.w * bb.h; };
  const cellsNow = b => (G.preview && G.preview.id === b.id ? G.preview.cells : b.cells);
  function renderBoard() {
    const layer = $('blocks'); layer.innerHTML = '';
    const dd = G.drag && G.drag.live ? G.drag : null, src = dd && dd.mode === 'chip' ? E.get(G.state, dd.id) : null;
    const dragKw = dd && (dd.mode === 'card' || (src && E.canRetrieve(src, dd.kw))) ? dd.kw : null;
    const g = G.tut.guide;
    G.state.blocks.forEach(b => {
      const d = E.def(G.stage, b), cells = cellsNow(b);
      const el = mk('div', 'blk'); el.dataset.id = b.id;
      if (d.render === 'figure') {
        // 늘어나서 이어진 사물(모닥불·나뭇가지 등)은 원래 그림을 늘어난 칸만큼 잡아 늘린다
        const stretched = !d.parts && cells.length > (b.base || 1);
        const im = d.imgWarm && E.hasState(b, 'warm') ? d.imgWarm : d.img;
        const groups = d.parts ? d.parts.map(p => ({ img: p.img, cells: p.cells.map(i => cells[i]) })) : [{ img: im, cells }];
        groups.forEach(gr => {
          const bb = bbox(gr.cells), f = mk('div', 'fig');
          place(f, bb.x * C + 3, bb.y * C + 3, bb.w * C - 6, bb.h * C - 6);
          f.style.backgroundImage = 'url(assets/' + gr.img + AV + ')';
          if (stretched) f.style.backgroundSize = '100% 100%';
          el.appendChild(f);
        });
      } else cells.forEach((c, i) => {
        const Lf = E.has(cells, c[0] - 1, c[1]), Rt = E.has(cells, c[0] + 1, c[1]), Tp = E.has(cells, c[0], c[1] - 1), Bt = E.has(cells, c[0], c[1] + 1);
        const x0 = c[0] * C + (Lf ? 0 : 3), x1 = (c[0] + 1) * C - (Rt ? 0 : 3), y0 = c[1] * C + (Tp ? 0 : 3), y1 = (c[1] + 1) * C - (Bt ? 0 : 3);
        const tile = mk('div', 'tile'); place(tile, x0, y0, x1 - x0, y1 - y0);
        tile.style.backgroundImage = 'url(assets/' + (d.render === 'tree' && i === 0 ? d.img2 : d.img) + AV + ')';
        tile.style.backgroundPosition = (c[0] * C + 3 - x0) + 'px ' + (c[1] * C + 3 - y0) + 'px';
        const r = v => (v ? '0' : '12px');
        tile.style.borderRadius = r(Lf || Tp) + ' ' + r(Rt || Tp) + ' ' + r(Rt || Bt) + ' ' + r(Lf || Bt);
        el.appendChild(tile);
      });
      const first = cells[0], last = cells[cells.length - 1];
      if (d.render !== 'figure' && cells.length > 1 && isRect(cells)) { const bb = bbox(cells), o = mk('div', 'multi-box'); place(o, bb.x * C, bb.y * C, bb.w * C, bb.h * C); el.appendChild(o); }
      el.style.transformOrigin = (first[0] * C + C / 2) + 'px ' + (first[1] * C + C / 2) + 'px';
      if (G.sel === b.id) el.classList.add('sel');
      if (g && g.id === b.id && g.k !== 'chip' && g.k !== 'take' && !G.waiting) {
        // 노란 테두리: 블록 외곽선만 그린다
        el.classList.add('hl');
        if (isRect(cells)) { const bb = bbox(cells), o = mk('div', 'hl-box'); place(o, bb.x * C - 14, bb.y * C - 14, bb.w * C + 28, bb.h * C + 28); el.appendChild(o); }
        else cells.forEach(c => {
          [[-1, 0, 'l'], [1, 0, 'r'], [0, -1, 't'], [0, 1, 'b']].forEach(s => {
            if (E.has(cells, c[0] + s[0], c[1] + s[1])) return;
            const e = mk('div', 'hl-edge');
            if (s[2] === 'l') place(e, c[0] * C - 3, c[1] * C - 3, 10, C + 6);
            if (s[2] === 'r') place(e, (c[0] + 1) * C - 7, c[1] * C - 3, 10, C + 6);
            if (s[2] === 't') place(e, c[0] * C - 3, c[1] * C - 3, C + 6, 10);
            if (s[2] === 'b') place(e, c[0] * C - 3, (c[1] + 1) * C - 7, C + 6, 10);
            el.appendChild(e);
          });
        });
      }
      if (!G.known[b.id]) { el.classList.add('fresh'); G.known[b.id] = 1; }
      if (G.shake === b.id) el.classList.add('shake');
      if (dragKw && (!src || src.id !== b.id) && E.canEnchant(G.stage, b, dragKw)) {
        if (isRect(cells)) { const bb = bbox(cells), o = mk('div', 'can-box'); place(o, bb.x * C - 6, bb.y * C - 6, bb.w * C + 12, bb.h * C + 12); el.appendChild(o); el.style.zIndex = 2; }
        else el.classList.add('can');
      }
      if (d.enchantable && BADGE_IMG[b.kw.yellow]) {
        const u = E.usesOf(b, b.kw.yellow), bd = mk('div', 'badge'); bd.style.backgroundImage = 'url(assets/guides/' + BADGE_IMG[b.kw.yellow] + '.png)';
        if (u != null) bd.appendChild(mk('span', 'cnt', String(u)));
        bd.style.left = last[0] * C + 78 + 'px'; bd.style.top = last[1] * C + 78 + 'px'; el.appendChild(bd);
      }
      if (G.fail && G.fail.ids.indexOf(b.id) >= 0) {
        el.classList.add('fail');
        const person = d.category === 'person';
        if (person) { const bb = bbox(cells), f = mk('div', 'burn'); place(f, bb.x * C + 3, bb.y * C + 3, bb.w * C - 6, bb.h * C - 6); f.style.backgroundImage = 'url(assets/fx/' + (bb.h > 1 ? 'burn-overlay-tall' : 'burn-overlay') + '.png)'; el.appendChild(f); }
        else cells.forEach(c => { const f = mk('div', 'burn fire'); place(f, c[0] * C + 3, c[1] * C + 3, C - 6, C - 6); el.appendChild(f); });
      }
      layer.appendChild(el);
    });
    G.shake = null;
    if (G.tut.seen.arrows) drawGrowArrows(layer);
    const sb = G.sel && E.get(G.state, G.sel);
    if (sb) {
      // 분리 절단선
      if (!G.preview) E.cutLines(sb).forEach((ln, i) => {
        const horiz = ln.a[1] !== ln.b[1], c = mk('div', 'cut ' + (horiz ? 'h' : 'v') + (G.cutActive === i ? ' active' : ''));
        if (horiz) { c.style.left = ln.a[0] * C + 6 + 'px'; c.style.top = Math.max(ln.a[1], ln.b[1]) * C + 'px'; c.style.width = C - 12 + 'px'; }
        else { c.style.left = Math.max(ln.a[0], ln.b[0]) * C + 'px'; c.style.top = ln.a[1] * C + 6 + 'px'; c.style.height = C - 12 + 'px'; }
        layer.appendChild(c);
      });
    }
  }
  /* 늘릴 수 있는 방향 표시: 여러 칸은 지나온 길 + 시작점(grow-start)·화살촉(grow-arrowhead),
     한 칸은 축 방향 양쪽 화살표(grow-horizontal / grow-vertical) */
  function drawGrowArrows(layer) {
    let body = '';
    const mid = c => [c[0] * C + C / 2, c[1] * C + C / 2];
    const image = (href, x, y, w, h, extra) => '<image href="assets/guides/' + href + '.png" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (extra || '') + '/>';
    G.state.blocks.forEach(b => {
      const k = b.kw.yellow; if (!k || !KW[k].grow) return;
      const cells = cellsNow(b);
      if (cells.length > 1) {
        const pts = cells.map(c => mid(c).join(',')).join(' ');
        const [ex, ey] = mid(cells[cells.length - 1]), [px, py] = mid(cells[cells.length - 2]);
        const ang = Math.atan2(ey - py, ex - px) * 180 / Math.PI;
        const [sx, sy] = mid(cells[0]);
        body += '<polyline points="' + pts + '" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
          '<polyline points="' + pts + '" fill="none" stroke="#1F726A" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>';
        body += image('grow-start', sx - 20, sy - 20, 40, 40);
        body += image('grow-arrowhead', ex - 18, ey - 26, 52, 52, ' transform="rotate(' + ang + ' ' + ex + ' ' + ey + ')"');
      } else {
        const [cx, cy] = mid(cells[0]);
        body += KW[k].grow === 'w' ? image('grow-horizontal', cx - 52, cy - 25, 104, 49) : image('grow-vertical', cx - 26, cy - 54, 52, 108);
      }
    });
    if (!body) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'grow-arrow'); svg.setAttribute('viewBox', '0 0 700 700');
    svg.innerHTML = body;
    layer.appendChild(svg);
  }
  /* 보드 위 일회성 연출: ignite(3프레임) / warming / blocked */
  function fx(kind, where) {
    let layer = $('fxLayer'); if (!layer) { layer = mk('div'); layer.id = 'fxLayer'; $('board').appendChild(layer); }
    const cells = typeof where[0] === 'number' ? [where] : where, bb = bbox(cells);
    const el = mk('div', 'fx fx-' + kind); place(el, bb.x * C, bb.y * C, bb.w * C, bb.h * C);
    layer.appendChild(el); setTimeout(() => el.remove(), kind === 'ignite' ? 900 : 1300);
  }
  function chip(kw, extra) { const el = mk('div', 'kw ' + KW[kw].color + (extra ? ' ' + extra : '')); el.dataset.kw = kw; el.appendChild(mk('span', '', t('kw.' + kw))); return el; }
  function renderTray() {
    const tray = $('tray'); tray.innerHTML = '';
    tray.classList.toggle('drop', !!(G.drag && G.drag.mode === 'chip' && G.drag.live));
    for (let i = 0; i < 7; i++) {
      const top = 14 + i * 80, c = G.state.tray[i];
      const slot = mk('div', 'slot n-slot'); slot.style.top = top + 'px'; tray.appendChild(slot);
      if (!c) continue;
      const card = chip(c.kw, 'card' + (G.selKw === c.kw ? ' sel' : '')); card.style.top = top + 'px';
      card.appendChild(mk('span', 'cnt', String(c.count)));
      card.addEventListener('pointerdown', e => wordDown(e, 'card', c.kw, null, card));
      tray.appendChild(card);
    }
  }
  function renderInspector() {
    const b = G.sel && E.get(G.state, G.sel);
    $('insImg').style.backgroundImage = ''; $('insTag').textContent = ''; $('insName').textContent = '';
    const states = $('insStates'), kws = $('insKws'); states.innerHTML = ''; kws.innerHTML = '';
    const list = [];
    if (b) {
      const d = E.def(G.stage, b);
      $('insImg').style.backgroundImage = 'url(assets/' + (d.preview || d.img) + AV + ')';
      $('insTag').textContent = t('cat.' + d.category); $('insName').textContent = t('block.' + b.type);
      ['yellow', 'blue', 'red', 'green'].forEach(c => { if (b.kw[c]) list.push(b.kw[c]); });
    }
    for (let i = 0; i < 3; i++) {
      const st = b && b.states[i];
      const el = st ? chip(st, 'st') : mk('div', 'st n-insslot');
      if (st) el.onclick = () => tapKw(st);
      states.appendChild(el);
    }
    for (let i = 0; i < 6; i++) {
      const kw = list[i];
      if (!kw) { kws.appendChild(mk('div', 'ks n-insslot')); continue; }
      const can = E.canTake(b, kw), el = chip(kw, 'ks' + (can ? ' takeable' : '') + (G.selKw === kw ? ' sel' : ''));
      const left = E.usesOf(b, kw);
      if (can) { el.appendChild(mk('span', 'spark')); el.appendChild(mk('span', 'cnt', String(b.take[kw]))); }
      else if (left != null) el.appendChild(mk('span', 'cnt', String(left)));
      else el.appendChild(mk('span', 'lock'));
      el.addEventListener('pointerdown', e => wordDown(e, 'chip', kw, b.id, el));
      kws.appendChild(el);
    }
    const sk = $('selKw'); sk.innerHTML = '';
    if (G.selKw) {
      const title = chip(G.selKw);
      const own = b && (b.kw[KW[G.selKw].color] === G.selKw);
      if (own && !E.canTake(b, G.selKw) && E.usesOf(b, G.selKw) == null && KW[G.selKw].kind !== 'state') title.appendChild(mk('span', 'lock'));
      sk.appendChild(title);
      $('descTxt').innerHTML = richDesc(t('kwDesc.' + G.selKw)); fitText($('descTxt'), 26, 17);
    } else $('descTxt').textContent = '';
  }

  /* 설명 속 '워드 이름'을 그 워드 색의 칩 모양으로 바꾼다 */
  function richDesc(text) {
    const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const names = {};
    Object.keys(KW).forEach(k => { const n = t('kw.' + k); if (!n) return; names[n] = KW[k].color; names[n.replace(/[↔↕✚※]/g, '')] = KW[k].color; });
    return esc(text).replace(/'([^']+)'|"([^"]+)"|「([^」]+)」/g, (m, a, b2, c) => { const n = a || b2 || c; return names[n] ? '<span class="kwi ' + names[n] + '">' + n + '</span>' : m; });
  }

  /* ── 행동 실행 공통 ── */
  const fits = (f, a) => f.type === a.type && (!f.id || f.id === a.id) && (!f.kw || f.kw === a.kw);
  const forces = () => { const f = G.tut.force; return f ? (f.any || [f]) : null; };
  const allow = a => { const fs = forces(); return !fs || fs.some(f => fits(f, a)); };
  const locked = () => G.busy || G.cleared || G.waiting;
  // mutate 를 적용하고 효과를 처리한다. 오답이면 연출 후 자동 복구.
  function act(mutate, after) {
    const snap = E.clone(G.state);
    const info = mutate(G.state);
    const res = E.settle(G.state, G.stage);
    G.preview = null;
    if (res.fail) {
      G.fail = res.fail; G.busy = true;
      renderBoard(); renderTray(); drawGuide();
      fb(res.fail.kind, 'worried');
      setTimeout(() => {
        G.state = snap; G.fail = null; G.mistakes++; G.justLost = true; G.busy = false;
        if (G.sel && !E.get(G.state, G.sel)) G.sel = null;
        renderGame();
        fb(G.mistakes === CONFIG.maxHearts ? 'noHearts' : 'recovered', 'neutral');
      }, 1700);
      return false;
    }
    G.undo.push(snap); if (G.undo.length > CONFIG.undoDepth) G.undo.shift();
    G.tut.force = null; G.tut.guide = null; G.tut.spot = null;
    if (G.sel && !E.get(G.state, G.sel)) G.sel = null;
    $('btnUndo').classList.remove('pulse'); $('btnSettings').classList.remove('pulse');
    renderGame();
    res.events.filter(ev => ev.t === 'warm').forEach(ev => { const blk = E.get(G.state, ev.id); if (blk) fx('warming', blk.cells); });
    if (res.cleared) { onClear(); return true; }
    if (after) after(info, res);
    const comb = res.events.find(ev => ev.t === 'combine' && ev.type === 'campfire');
    res.events.forEach(ev => {
      const blk = E.get(G.state, ev.id); if (!blk) return;
      if (ev.t === 'combine' && ev.type === 'campfire') blk.cells.forEach(c => fx('ignite', c));
    });
    if (comb) tutCampfire(comb.id);
    if (E.stuck(G.state, G.stage)) { fb('stuck', 'worried'); $('btnUndo').classList.add('pulse'); $('btnSettings').classList.add('pulse'); }
    renderHUD(); renderBoard(); drawGuide();
    return true;
  }

  /* ── 파인드: 블록을 눌러 정보 보기 ── */
  function clickBlock(b) {
    const f = G.tut.force;
    if (f && !forces().some(x => x.id === b.id && ['click', 'cut', 'take', 'drag'].indexOf(x.type) >= 0)) return;
    G.sel = b.id; renderBoard(); renderInspector();
    tutClick(b);
    renderBoard(); drawGuide();
  }
  /* ── 워드: 터치하면 설명, 끌어서 옮기면 획득(상태란 → 워드란) / 인챈트(워드란 → 블록·상태란) ── */
  function tapKw(kw) {
    if (locked()) return;
    const f = G.tut.force, hit = f && f.type === 'kwtap' && f.kw === kw;
    G.selKw = kw;   // 터치는 언제나 설명만 보여 준다
    renderTray(); renderInspector();
    if (hit) tutKwTap(kw);
    drawGuide();
  }
  function wordDown(e, mode, kw, id, el) {
    if (locked() || G.drag) return;
    e.preventDefault();
    G.drag = { mode, kw, id, start: toDesign(e), live: false, el };
  }
  function wordMove(p) {
    const d = G.drag;
    if (!d.live) {
      if (Math.hypot(p.x - d.start.x, p.y - d.start.y) < 14) return;
      const f = G.tut.force;
      if (f && !forces().some(x => x.type === (d.mode === 'card' ? 'enchant' : 'take'))) { G.drag = null; return; }
      d.live = true; d.el.classList.add('dragging');
      const g = chip(d.kw); g.id = 'ghost'; app.appendChild(g); d.ghost = g;
      setGuideVisible(false); renderBoard(); $('tray').classList.toggle('drop', d.mode === 'chip');
    }
    d.ghost.style.left = p.x + 'px'; d.ghost.style.top = p.y + 'px';
  }
  function wordUp(p) {
    const d = G.drag; G.drag = null;
    if (!d.live) { tapKw(d.kw); return; }
    d.ghost.remove(); d.el.classList.remove('dragging'); $('tray').classList.remove('drop');
    let done = false;
    if (d.mode === 'chip') {                            // 정보창 워드 → 워드란: 가져오기(복제) 또는 회수 / → 다른 블록: 옮기기
      const b = E.get(G.state, d.id);
      const target = blockAtPoint(p);
      if (b && inRect(p, CONFIG.trayRect) && allow({ type: 'take', id: b.id, kw: d.kw })) {
        if (E.canTake(b, d.kw)) { G.selKw = d.kw; done = act(s => E.take(s, G.stage, b.id, d.kw), () => tutTake(d.kw)); }
        else if (E.canRetrieve(b, d.kw) && !G.tut.force) { G.selKw = d.kw; done = act(s => E.retrieve(s, b.id, d.kw)); }
        else if (!G.tut.force) fb('cantTake', 'neutral');
      } else if (b && target && target.id !== b.id && E.canRetrieve(b, d.kw) && !G.tut.force) {
        if (E.canEnchant(G.stage, target, d.kw)) {
          const id = target.id, type = target.type; G.selKw = d.kw; G.sel = id;
          done = act(s => E.transfer(s, G.stage, b.id, id, d.kw), replaced => tutEnchant(d.kw, id, type, replaced));
        } else { G.shake = target.id; fb('cantEnchant', 'neutral'); }
      }
    } else {                                            // 워드란 → 블록 또는 상태란: 인챈트
      const b = blockAtPoint(p) || (inRect(p, CONFIG.inspectorRect) && G.sel ? E.get(G.state, G.sel) : null);
      if (b && allow({ type: 'enchant', id: b.id, kw: d.kw })) {
        if (E.canEnchant(G.stage, b, d.kw)) {
          const id = b.id, type = b.type; G.selKw = d.kw; G.sel = id;
          done = act(s => E.enchant(s, G.stage, id, d.kw), replaced => tutEnchant(d.kw, id, type, replaced));
        } else { G.shake = b.id; if (!G.tut.force) fb('cantEnchant', 'neutral'); }
      }
    }
    if (!done) { renderBoard(); renderTray(); renderInspector(); setGuideVisible(true); }
  }
  function blockAtPoint(p) {
    const x = Math.floor((p.x - BX) / C), y = Math.floor((p.y - BY) / C);
    if (x < 0 || y < 0 || x > 4 || y > 4) return null;
    return E.at(G.state, x, y) || null;
  }

  /* ── 무브 / 분리 (보드 드래그) ── */
  $('board').addEventListener('pointerdown', e => {
    if (locked() || G.drag) return;
    e.preventDefault();
    const p = toDesign(e), bx = p.x - BX, by = p.y - BY;
    const sb = G.sel && E.get(G.state, G.sel);
    if (sb && allow({ type: 'cut', id: sb.id })) {     // 선택된 블록의 절단선 근처면 분리 드래그
      const lines = E.cutLines(sb);
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i], horiz = ln.a[1] !== ln.b[1];
        const hit = horiz
          ? Math.abs(by - Math.max(ln.a[1], ln.b[1]) * C) < 30 && bx > ln.a[0] * C - 20 && bx < (ln.a[0] + 1) * C + 20
          : Math.abs(bx - Math.max(ln.a[0], ln.b[0]) * C) < 30 && by > ln.a[1] * C - 20 && by < (ln.a[1] + 1) * C + 20;
        if (hit) { G.drag = { mode: 'cut', id: sb.id, line: ln, horiz, idx: i, start: p, travel: 0 }; return; }
      }
    }
    const cx = Math.floor(bx / C), cy = Math.floor(by / C), b = E.at(G.state, cx, cy);
    if (!b) return;
    G.drag = { mode: 'pending', id: b.id, start: p, cx, cy, off: { x: 0, y: 0 } };
  });
  window.addEventListener('pointermove', e => {
    const d = G.drag; if (!d) return;
    const p = toDesign(e);
    if (d.mode === 'card' || d.mode === 'chip') return wordMove(p);
    const dx = p.x - d.start.x, dy = p.y - d.start.y;
    if (d.mode === 'cut') {
      d.travel = Math.max(d.travel, Math.abs(d.horiz ? dx : dy));
      if (G.cutActive !== d.idx && d.travel > 20) { G.cutActive = d.idx; renderBoard(); }
      return;
    }
    const b = E.get(G.state, d.id);
    if (d.mode === 'pending') {
      if (Math.hypot(dx, dy) < 16) return;
      if (!allow({ type: 'drag', id: b.id })) { d.mode = 'ignore'; return; }
      d.mode = E.dragMode(b) === 'none' ? 'stuck' : E.dragMode(b);
      if (d.mode === 'grow') {
        const idx = b.cells.findIndex(c => c[0] === d.cx && c[1] === d.cy);
        d.end = E.growEnd(G.stage, b, idx);
        d.orig = d.end === 'last' ? b.cells[b.cells.length - 1] : b.cells[0];
      }
      setGuideVisible(false);
    }
    if (d.mode === 'move') {
      let tx = Math.round(dx / C), ty = Math.round(dy / C);
      if (KW[b.kw.yellow].axis === 'h') ty = 0;
      const u = E.usesOf(b, b.kw.yellow);
      while (u != null && Math.abs(tx) + Math.abs(ty) > u) { if (Math.abs(tx) >= Math.abs(ty)) tx -= Math.sign(tx); else ty -= Math.sign(ty); }
      d.off = E.slide(G.state, G.stage, b, d.off, tx, ty);
      d.blocked = (d.off.x !== tx || d.off.y !== ty) && b.cells.every(c => c[0] + tx >= 0 && c[0] + tx < 5 && c[1] + ty >= 0 && c[1] + ty < 5);
      setPreview(b.id, b.cells.map(c => [c[0] + d.off.x, c[1] + d.off.y]));
    } else if (d.mode === 'grow') {
      const horiz = KW[b.kw.yellow].grow === 'w';
      const ax = horiz ? 0 : 1, target = d.orig[ax] + Math.round((horiz ? dx : dy) / C);
      const cells = growLimited(b, d.end, d.orig[ax], target), endC = d.end === 'last' ? cells[cells.length - 1] : cells[0];
      d.blocked = false;
      if (endC[ax] !== target) {   // 끝 칸 다음 칸에 다른 블록이 있어서 막혔는가
        const nx = endC.slice(); nx[ax] += Math.sign(target - endC[ax]);
        const o = E.at(G.state, nx[0], nx[1]); d.blocked = !!(o && o.id !== b.id); d.blockedAt = nx;
      }
      setPreview(b.id, cells);
    }
  });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* 움직인 칸 수: 새로 차지한 칸 + 비운 칸 */
  function stepsOf(a, b) { const k = c => c[0] + ',' + c[1], A = new Set(a.map(k)), B = new Set(b.map(k)); return b.filter(c => !A.has(k(c))).length + a.filter(c => !B.has(k(c))).length; }
  function growLimited(b, end, from, target) {
    const u = E.usesOf(b, b.kw.yellow);
    if (u == null) return E.grow(G.state, G.stage, b, end, target);
    let best = b.cells; const dir = Math.sign(target - from);
    for (let t = from + dir; dir && t !== target + dir; t += dir) {
      const c = E.grow(G.state, G.stage, b, end, t);
      if (stepsOf(b.cells, c) > u) break;
      best = c;
    }
    return best;
  }
  function setPreview(id, cells) {
    if (G.preview && same(G.preview.cells, cells)) return;
    G.preview = { id, cells }; renderBoard();
  }
  function pointerEnd(e) {
    const d = G.drag; if (!d) return;
    const p = toDesign(e);
    if (d.mode === 'card' || d.mode === 'chip') return wordUp(p);
    G.drag = null;
    const b = E.get(G.state, d.id);
    if (d.mode === 'cut') {
      G.cutActive = null;
      if (d.travel >= C * 0.45) act(s => E.split(s, G.stage, d.id, d.line.k), () => tutSplit());
      else if (d.travel < 16) clickBlock(b); else renderBoard();
      return;
    }
    if (d.mode === 'pending') return clickBlock(b);
    if (d.mode === 'stuck') { G.shake = b.id; renderBoard(); fb('cantMove', 'worried'); setGuideVisible(true); return; }
    if (d.mode === 'move' || d.mode === 'grow') {
      const r = G.preview;
      if (d.blocked && d.blockedAt) fx('blocked', d.blockedAt);
      if (!r || same(r.cells, b.cells)) { G.preview = null; renderBoard(); setGuideVisible(true); if (d.blocked) fb('occupied', 'worried'); return; }
      const mode = d.mode;
      guideHidden = false;
      const steps = mode === 'move' ? Math.abs(d.off.x) + Math.abs(d.off.y) : stepsOf(b.cells, r.cells);   // 움직인 칸 수만큼 사용
      act(s => { E.get(s, d.id).cells = r.cells; E.useWord(s, d.id, Math.max(1, steps)); }, () => tutDrag(d.id));
      if (d.blocked && !G.waiting && !G.busy) fb('occupied', 'worried');
    }
  }
  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);

  /* ── 되돌리기 / 힌트 ── */
  $('btnUndo').onclick = () => {
    if (locked() || !G.undo.length || (G.tut.force && G.tut.force.type !== 'undo')) return;
    G.state = G.undo.pop(); G.tut.guide = null; G.tut.spot = null; G.tut.force = null;
    if (G.sel && !E.get(G.state, G.sel)) G.sel = null;
    $('btnUndo').classList.remove('pulse'); $('btnSettings').classList.remove('pulse');
    renderGame();
    if (!tutUndo()) fb('undo', 'neutral');
  };
  function hintPhase() {
    const s = G.state, steam = E.get(s, 'steam');
    if (s.blocks.some(b => b.type === 'campfire')) return 2;
    return steam && steam.cells.length > 1 ? 0 : 1;
  }
  $('btnHint').onclick = () => { if (!G.busy && !G.cleared) openHints(); };
  const HINT_ICON = ['assets/icons/mobile/hint-look.png', 'assets/icons/mobile/hint-keyword.png', 'assets/icons/mobile/hint-next.png'];
  function openHints() {
    const ph = hintPhase(), texts = t(tk('hints'))[ph], lv = t('ui.hintLv');
    G.hints[ph] = G.hints[ph] || {};
    openModal(box => {
      box.appendChild(img('assets/portraits/cache-surprised.png', 'pop-cache'));
      box.appendChild(img('assets/icons/hint.png', 'pop-bulb'));
      const close = mk('button', 'pop-close'); close.appendChild(img('assets/icons/mobile/close.png')); close.onclick = closeModal; box.appendChild(close);
      const title = mk('div', 'pop-title');
      title.appendChild(img('assets/decor/mobile/button-leaf.png', 'sprig')); title.appendChild(mk('span', '', t('ui.hint'))); title.appendChild(img('assets/decor/mobile/button-leaf.png', 'sprig flip'));
      box.appendChild(title);
      const free = G.stage.id === 1;
      if (free) box.appendChild(mk('div', 'hint-free', t('ui.hintFree')));
      texts.forEach((tx, i) => {
        const row = mk('div', 'hint-item m-row');
        row.appendChild(img(HINT_ICON[i], 'ico')); row.appendChild(mk('i', 'bar'));
        if (G.hints[ph][i]) row.appendChild(mk('span', '', tx));
        else {
          row.appendChild(mk('b', '', (i + 1) + '. ' + lv[i]));
          row.appendChild(mk('span', ''));
          const buy = mk('button', 'm-amber');
          if (free) buy.textContent = t('ui.hintShow'); else { buy.appendChild(img('assets/icons/coin.png')); buy.appendChild(mk('span', '', String(CONFIG.hintCost[i]))); }
          buy.onclick = () => {
            if (free) { G.hints[ph][i] = 1; openHints(); return; }
            if (save.coins < CONFIG.hintCost[i]) { toast(t('ui.noCoin')); closeModal(); if (!G.waiting) fb('noCoin', 'worried'); return; }
            save.coins -= CONFIG.hintCost[i]; persist(); renderCoins(); G.hints[ph][i] = 1; openHints();
          };
          row.appendChild(buy);
        }
        box.appendChild(row);
      });
      box.appendChild(popButton('m-cream pop-close-btn', null, t('ui.close'), closeModal));
    });
  }

  /* ══════════ 튜토리얼 (1스테이지) ══════════
     순서가 고정된 단계(phase). 각 단계에서는 정해진 조작만 허용(force)하고, 대상만 비춘다.
     수증기(자란다 가리키기 → 설명 → 줄이기) → 자란다↔ → 열 살피기(워드 없음, 연소 상태, 위험)
     → 모녀(추위 상태) → 이동 → 나무(화재 위험 → 분리 설명) → "그럼 이제 해결해 볼까?" 이후는 자유 조작 */
  const trayHas = kw => G.state.tray.some(c => c.kw === kw);
  const guideHeat = () => G.state.blocks.find(b => b.type === 'heat' && E.has(b.cells, 2, 1));
  function setGuide(guide, force, spot) {
    G.tut.guide = guide; G.tut.force = force || null;
    G.tut.spot = spot || (force ? () => guideHoles(guide) : null);   // 강제 조작 중에는 대상만 비춘다
    guideHidden = false; renderHUD(); renderBoard(); renderDim(); drawGuide();
  }
  function guideHoles(g) {
    const chipSel = kw => '#insKws [data-kw="' + kw + '"]';
    if (g.k === 'take') return elHole(chipSel(g.kw), 10).concat(elHole('#tray', 0));
    if (g.k === 'chip') return elHole(chipSel(g.kw), 10);
    if (g.k === 'state') return elHole('#insStates [data-kw="' + g.kw + '"]', 10);
    if (g.k === 'undo') return elHole('#btnUndo', 8);
    return g.id ? blockHoles(g.id) : [];
  }
  const holesOf = (...ids) => () => ids.reduce((a, id) => a.concat(blockHoles(typeof id === 'function' ? id() : id)), []);
  const elHoles = (sel, pad) => [...document.querySelectorAll(sel)].map(el => { const r = rectOf(el); return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }; });
  const descHoles = () => elHole('#selKw', 6).concat(elHole('#descBox', 6));
  const select = id => { G.sel = id; renderBoard(); renderInspector(); };
  const phase = p => { G.tut.phase = p; G.tut.force = null; G.tut.guide = null; G.tut.spot = null; };
  const branchId = () => (G.state.blocks.find(b => b.type === 'branch' || b.type === 'campfire') || {}).id;
  const growVLeft = () => trayHas('growV') || G.state.blocks.some(b => b.kw.yellow === 'growV');

  const steamPull = () => { const st = E.get(G.state, 'steam'); return { k: 'pull', id: 'steam', from: st.cells[st.cells.length - 1], to: st.cells[0] }; };
  const forceClick = id => setGuide({ k: 'block', id }, { type: 'click', id });
  const forceTake = (id, kw) => { select(id); setGuide({ k: 'take', kw }, { type: 'take', id, kw }); };
  const forceTap = (kw, k) => setGuide({ k: k || 'chip', kw }, { type: 'kwtap', kw });

  function tutStart() {
    phase('steamClick'); G.dimA = CONFIG.dimStart;
    const sigilRow = () => [cellsHole([[2, 0], [4, 1]])];   // 마법진과 수증기 3×2
    say([L('t1', 0, 'worried'), L('t1', 1, 'surprised', sigilRow), L('t1', 2, 'neutral')],
      () => { G.dimA = CONFIG.dim; forceClick('steam'); });
  }
  function tutClick(b) {
    const tu = G.tut, ph = tu.phase;
    if (tu.force && tu.force.type === 'click' && tu.force.id === b.id) {
      if (ph === 'steamClick') { tu.seen.arrows = 1; phase('steamWord'); say([L('u2a', 0, 'happy')], () => forceTap('growH')); return; }
      if (ph === 'heatClick') { phase('igniteTap'); say([L('uH2', 0, 'neutral', () => blockHoles(b.id).concat(elHole('#insKws', 4))), L('uH2', 1, 'neutral')], () => forceTap('ignite', 'state')); return; }
      if (ph === 'famClick') { phase('coldTap'); say([L('uF1', 0, 'surprised', holesOf('mother', 'daughter')), L('uF2', 0, 'worried')], () => forceTap('cold', 'state')); return; }
      if (ph === 'treeClick') { phase('dangerTap'); say([L('uR1', 0, 'neutral')], () => forceTap('danger', 'state')); return; }
    }
    if (tu.force || ph !== 'free') return;
    const d = E.def(G.stage, b), warm = d.category === 'person' && !E.hasState(b, 'cold');
    say([L('react.' + (warm ? 'warm' : b.type), 0, warm || b.type === 'campfire' ? 'happy' : 'neutral')]);
  }
  function tutKwTap(kw) {
    const ph = G.tut.phase;
    if (ph === 'steamWord' && kw === 'growH') {
      phase('steamPull');
      say([L('u2b', 0, 'happy', descHoles), L('u2b', 1, 'neutral')], () => setGuide(steamPull(), { type: 'drag', id: 'steam' }));
    } else if (ph === 'igniteTap' && kw === 'ignite') {
      phase('famClick');
      say([L('uH3', 0, 'worried', () => descHoles().concat(blockHoles('mother'), blockHoles('daughter'))), L('uH3', 1, 'worried'), L('uH3', 2, 'neutral'), L('uH3', 3, 'worried')],
        () => setGuide({ k: 'block', id: 'mother' }, { type: 'click', id: 'mother' }, holesOf('mother', 'daughter')));
    } else if (ph === 'coldTap' && kw === 'cold') {
      phase('takeMove');
      say([L('uF3', 0, 'worried', descHoles), L('uF3', 1, 'neutral')], () => forceTake('mother', 'move'));
    } else if (ph === 'dangerTap' && kw === 'danger') {
      phase('splitTap');
      say([L('uR2', 0, 'worried', () => elHole('#insStates [data-kw="danger"]', 10).concat(descHoles())), L('uR2', 1, 'neutral'), L('uR2', 2, 'neutral')], () => forceTap('split'));
    } else if (ph === 'splitTap' && kw === 'split') {
      phase('solveIntro');
      const yellowSel = '#tray .card.yellow, #insKws .kw.yellow';
      say([L('uR3', 0, 'surprised', descHoles), L('uR3', 1, 'worried', descHoles), L('uR3', 2, 'happy'),
        L('uR3', 3, 'neutral', () => elHole('#insKws [data-kw="split"] .lock', 12).concat(elHole('#selKw .lock', 10))),
        L('uR3', 4, 'happy'),
        L('uR3', 5, 'surprised', () => elHoles(yellowSel, 8), yellowSel), L('uR3', 6, 'neutral', () => elHoles(yellowSel, 8), yellowSel),
        L('uR3', 7, 'neutral', () => elHole('#tray', 0)),
        L('uR3', 8, 'happy', () => elHole('#btnUndo', 6)), L('uR3', 9, 'happy'), L('uFree', 0, 'happy')],
        () => {   // 여기부터 자유 조작 + 힌트 버튼 한 번 반짝
          phase('free');
          const h = $('btnHint'); h.classList.remove('spark-once'); void h.offsetWidth; h.classList.add('spark-once');
        });
    }
  }
  function tutTake(kw) {
    const ph = G.tut.phase;
    if (ph === 'takeH' && kw === 'growH') {
      phase('heatClick');
      say([L('uApply', 0, 'neutral', () => elHole('#tray', 0).concat(elHole('#boardFrame', 0))), L('uApply', 1, 'happy'), L('uCount', 0, 'neutral', () => elHole('#tray .card[data-kw="growH"]', 8)), L('uH1', 0, 'worried'), L('uH1', 1, 'worried'), L('uH1', 2, 'neutral')], () => { const h = guideHeat(); if (h) forceClick(h.id); });
    } else if (ph === 'takeMove' && kw === 'move') {
      phase('treeClick');
      say([L('uM', 0, 'worried'), L('uM', 1, 'neutral')], () => forceClick('tree'));
    }
  }
  function tutSplit() {
    const tu = G.tut;
    if (tu.phase !== 'free') return;
    if (!growVLeft() && !tu.seen.split) {   // 자란다↕를 옮기기 전에 잘라 버렸다 → 되돌리기 안내 (강제하지 않음)
      tu.mistake = true;
      say([L('uR4', 0, 'worried')], () => setGuide({ k: 'undo' }));
      return;
    }
    if (tu.seen.split) return;
    tu.seen.split = 1;
    say([L('t7c', 0, 'happy', holesOf(branchId)), L('uR6', 0, 'happy')]);
  }
  function tutUndo() {
    const tu = G.tut;
    if (!tu.mistake) return false;
    tu.mistake = false; tu.guide = null;
    say([L('uR5', 0, 'happy')]);
    return true;
  }
  function tutEnchant(kw, id, type, replaced) {
    if (replaced) fb('swapped', 'neutral');
  }
  function tutDrag(id) {
    const ph = G.tut.phase, b = E.get(G.state, id);
    if (ph !== 'steamPull') return;
    if (b.cells.length > 1) { setGuide(steamPull(), { type: 'drag', id: 'steam' }); return; }   // B1까지 다 줄일 때까지 계속 안내
    phase('takeH'); select('steam');
    say([L('t3', 0, 'worried'), L('tTake', 0, 'neutral'), L('tTake', 1, 'happy')], () => forceTake('steam', 'growH'));
  }
  function tutCampfire(id) {
    say([L('t10b', 0, 'happy', holesOf(id))]);
  }

  /* ── 손가락 가이드 ── */
  let fingerAnim = null, guideHidden = false;
  function setGuideVisible(v) { guideHidden = !v; drawGuide(); }
  const cellCenter = c => ({ x: BX + c[0] * C + C / 2, y: BY + c[1] * C + C / 2 });
  function drawGuide() {
    const fg = $('finger'), g = G.tut && G.tut.guide;
    if (fingerAnim) { fingerAnim.cancel(); fingerAnim = null; }
    fg.style.display = 'none';
    if (!g || guideHidden || current !== 'game' || G.waiting || G.busy || G.cleared) return;
    let a = null, b = null;
    const blk = g.id && E.get(G.state, g.id);
    const chipEl = kw => document.querySelector('#insKws [data-kw="' + kw + '"]');
    if (g.k === 'block' && blk) a = cellCenter(blk.cells[Math.floor(blk.cells.length / 2)]);
    else if (g.k === 'chip') { const el = chipEl(g.kw); if (el) { a = centerOf(el); a.y += 16; } }
    else if (g.k === 'state') { const el = document.querySelector('#insStates [data-kw="' + g.kw + '"]'); if (el) { a = centerOf(el); a.y += 16; } }
    else if (g.k === 'take') { const el = chipEl(g.kw); if (el) { a = centerOf(el); const n = G.state.tray.length; b = { x: 877, y: 366 + 14 + n * 80 + 35 }; } }
    else if (g.k === 'cut' && blk) { const ln = E.cutLines(blk)[blk.cells.length - 2]; if (ln) { const y = BY + Math.max(ln.a[1], ln.b[1]) * C; a = { x: BX + ln.a[0] * C + 14, y }; b = { x: BX + (ln.a[0] + 1) * C - 14, y }; } }
    else if (g.k === 'card' && blk) { const el = document.querySelector('#tray .card[data-kw="' + g.kw + '"]'); if (el) { a = centerOf(el); b = cellCenter(blk.cells[blk.cells.length - 1]); } }
    else if (g.k === 'pull' && blk) { a = cellCenter(g.from); b = cellCenter(g.to); }
    else if (g.k === 'undo') { a = centerOf($('btnUndo')); a.y += 20; }
    if (!a) return;
    fg.src = 'assets/guides/' + (b ? 'drag-finger' : 'tap-finger') + '.png';
    fg.style.display = 'block';
    const tr = p => 'translate(' + p.x + 'px,' + p.y + 'px)';
    fingerAnim = b
      ? fg.animate([{ transform: tr(a), opacity: 0 }, { transform: tr(a), opacity: 1, offset: .15 }, { transform: tr(b), opacity: 1, offset: .8 }, { transform: tr(b), opacity: 0 }], { duration: 1700, iterations: Infinity })
      : fg.animate([{ transform: tr({ x: a.x, y: a.y + 14 }) }, { transform: tr(a) }], { duration: 480, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
  }

  /* ══════════ 클리어 / 결과 ══════════ */
  const R = { sid: 0, stars: 0, mistakes: 0 };
  function onClear() {
    G.cleared = true; G.tut.guide = null; G.tut.force = null; G.tut.spot = null; drawGuide(); renderHUD();
    const fam = () => G.state.blocks.filter(b => E.def(G.stage, b).category === 'person' || b.type === 'campfire').reduce((a, b) => a.concat(blockHoles(b.id)), []);
    say([L('clear', 0, 'happy', fam)], () => {
      R.sid = G.stage.id; R.stars = starsNow(); R.mistakes = G.mistakes;
      save.stars[R.sid] = Math.max(save.stars[R.sid] || 0, R.stars);
      save.coins += CONFIG.clearReward; persist();
      show('result'); renderResult();
    }, true);
  }
  function renderResult() {
    const n = save.stars[R.sid] || 0;
    $('resStage').textContent = t('ui.stage') + ' ' + R.sid + ' · ' + t('stageName.' + R.sid);
    const rs = $('resStars'); rs.innerHTML = '';
    for (let i = 0; i < 3; i++) { const im = new Image(); im.src = 'assets/icons/' + (i < n ? 'star' : 'star-off') + '.png'; if (i < n) { im.className = 'on'; im.style.animationDelay = i * .2 + 's'; } rs.appendChild(im); }
    $('resMistakes').textContent = t('ui.mistakes', { n: R.mistakes });
    $('resCoin').textContent = '+' + CONFIG.clearReward;
    const buy = $('btnBuyStar');
    buy.style.display = n < 3 ? '' : 'none';
    buy.textContent = t('ui.buyStar', { n: CONFIG.starPrice });
    renderCoins();
  }
  $('btnBuyStar').onclick = () => {
    if (save.coins < CONFIG.starPrice) return toast(t('ui.noCoin'));
    save.coins -= CONFIG.starPrice; save.stars[R.sid] = Math.min(3, (save.stars[R.sid] || 0) + 1); persist(); renderResult();
  };
  $('btnNext').onclick = () => { if (window.STAGES[R.sid + 1]) startStory(R.sid + 1); else { goSelect(); toast(t('ui.comingSoon')); } };
  $('btnRetry').onclick = () => startStage(R.sid);
  $('btnToSelect').onclick = goSelect;

  /* ── 시작 ── */
  fit(); applyLang(); show('title');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (current === 'game') renderGame(); });
  window.__eic = { G, E, save, CONFIG, startStage, setLang };   // 디버그용
})();
