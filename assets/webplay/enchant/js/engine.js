/* 인챈트 인 차트 · 규칙 엔진 (화면과 무관한 순수 로직)
   state = { blocks: [...], tray: [{kw, count}], seq: n }
   블록은 칸 목록 cells = [[x,y], ...] 을 가진다. 순서는 자라난 길(시작점 → 끝점)이다. */
window.Engine = (function () {
  const KW = window.KEYWORDS;

  function init(stage) {
    const blocks = JSON.parse(JSON.stringify(stage.blocks));
    blocks.forEach(b => { if (b.base == null) b.base = b.cells.length; });
    return { blocks, tray: [], seq: 1 };
  }
  const clone = s => JSON.parse(JSON.stringify(s));
  const get = (s, id) => s.blocks.find(b => b.id === id);
  const has = (cells, x, y) => cells.some(c => c[0] === x && c[1] === y);
  const at = (s, x, y) => s.blocks.find(b => has(b.cells, x, y));
  const inside = (stage, x, y) => x >= 0 && y >= 0 && x < stage.size && y < stage.size;
  const def = (stage, b) => stage.blockTypes[b.type];
  const hasState = (b, st) => b.states.indexOf(st) >= 0;
  const free = (s, stage, x, y, ignoreId) => { if (!inside(stage, x, y)) return false; const o = at(s, x, y); return !o || o.id === ignoreId; };
  const pair = (A, B, test) => A.some(a => B.some(b => test(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))));
  const touching = (A, B) => pair(A, B, (dx, dy) => dx + dy === 1);        // 변이 맞붙어 있다
  const near = (A, B) => pair(A, B, (dx, dy) => dx <= 1 && dy <= 1);        // 주변 1칸 (대각선 포함)
  /* 한 세트 블록(모녀)의 구성원별 칸 */
  const parts = (stage, b) => { const p = def(stage, b).parts; return p ? p.map(q => q.cells.map(i => b.cells[i])) : [b.cells]; };

  /* ── 파인드: 워드 가져오기 ── */
  function canTake(b, kw) { return !!(b.take && b.take[kw]); }
  function take(s, stage, id, kw) {
    const b = get(s, id), n = b.take[kw];
    delete b.take[kw];   // 복제는 한 번만. 원래 워드는 블록에 그대로 남는다(잠김)
    const card = s.tray.find(c => c.kw === kw);
    if (card) card.count += n; else s.tray.push({ kw, count: n });
    if (def(stage, b).vanishOnTake) s.blocks.splice(s.blocks.indexOf(b), 1);
  }

  /* ── 인챈트 ── */
  function canEnchant(stage, b, kw) {
    const d = def(stage, b), k = KW[kw];
    if (!d.enchantable) return false;
    if (k.notOn && k.notOn.indexOf(d.category) >= 0) return false;
    if (kw === 'split' && !(d.category === 'object' && b.base >= 2)) return false;
    if (k.kind === 'state') return !hasState(b, kw);
    return b.kw[k.color] !== kw;
  }
  const toTray = (s, kw, n) => { const c = s.tray.find(x => x.kw === kw); if (c) c.count += n; else s.tray.push({ kw, count: n }); };
  /* 인챈트: 워드란 카드의 사용 횟수가 통째로 블록으로 넘어간다 (카드는 사라진다) */
  function enchant(s, stage, id, kw, given) {
    const b = get(s, id), k = KW[kw];
    let count = given;
    if (count == null) { const card = s.tray.find(c => c.kw === kw); count = card.count; s.tray.splice(s.tray.indexOf(card), 1); }
    let replaced = null;
    if (k.kind === 'state') b.states.push(kw);
    else {
      replaced = b.kw[k.color] || null;
      b.uses = b.uses || {};
      if (replaced) {                                    // 밀려난 워드: 남은 횟수가 있으면 워드란으로 돌아간다
        const left = b.uses[replaced];
        delete b.uses[replaced];
        if (left > 0) toTray(s, replaced, left);
      }
      b.kw[k.color] = kw; b.uses[kw] = count;
    }
    return replaced;
  }
  /* 노란 워드를 한 번 썼다. 인챈트로 붙인 워드만 횟수가 줄고, 0이 되면 사라진다. (원래 워드는 무제한) */
  function useWord(s, id, n) {
    const b = get(s, id), kw = b && b.kw.yellow;
    if (!kw || !b.uses || b.uses[kw] == null) return;
    b.uses[kw] -= (n == null ? 1 : n);
    if (b.uses[kw] <= 0) { delete b.uses[kw]; delete b.kw.yellow; }
  }
  const usesOf = (b, kw) => (b.uses && b.uses[kw] != null ? b.uses[kw] : null);
  /* 붙인 워드는 남은 횟수가 있으면 회수(워드란으로) 하거나 다른 블록으로 옮길 수 있다 */
  const canRetrieve = (b, kw) => (usesOf(b, kw) || 0) > 0;
  function detach(s, id, kw) {
    const b = get(s, id), n = b.uses[kw];
    delete b.uses[kw]; delete b.kw[KW[kw].color];
    return n;
  }
  function retrieve(s, id, kw) { toTray(s, kw, detach(s, id, kw)); }
  function transfer(s, stage, fromId, toId, kw) { return enchant(s, stage, toId, kw, detach(s, fromId, kw)); }

  /* ── 무브 ── */
  function dragMode(b) {
    const y = b.kw.yellow;
    if (!y) return 'none';
    if (y === 'move') return b.states.some(st => KW[st].blocksMove) ? 'none' : 'move';
    return KW[y].grow ? 'grow' : 'none';
  }
  /* 이동: 지금 밀린 거리(off)에서 목표 거리(tx,ty)를 향해 빈칸 길을 따라 한 칸씩 */
  function slide(s, stage, b, off, tx, ty) {
    let x = off.x, y = off.y, guard = 40;
    const ok = (ox, oy) => b.cells.every(c => free(s, stage, c[0] + ox, c[1] + oy, b.id));
    while ((x !== tx || y !== ty) && guard--) {
      const dx = Math.sign(tx - x), dy = Math.sign(ty - y);
      const tryX = dx && ok(x + dx, y), tryY = dy && ok(x, y + dy);
      const preferX = Math.abs(tx - x) >= Math.abs(ty - y);
      if (tryX && (preferX || !tryY)) x += dx;
      else if (tryY) y += dy;
      else if (tryX) x += dx;
      else break;
    }
    return { x, y };
  }
  /* 자란다: 잡은 칸 번호로 어느 끝을 움직일지 정한다 */
  function growEnd(stage, b, idx) {
    const n = b.cells.length;
    if (b.fixedStart || n === 1) return 'last';
    return idx < (n - 1) / 2 ? 'first' : 'last';
  }
  /* 자란다: 끝 칸에서 1칸 폭으로 뻗는다. 왔던 길로 되끌면 줄어든다.
     target = 끝 칸이 가야 할 좌표 (자란다↔ 는 x, 자란다↕ 는 y) */
  function grow(s, stage, b, end, target) {
    const ax = KW[b.kw.yellow].grow === 'w' ? 0 : 1;
    const cells = b.cells.map(c => c.slice());
    if (end === 'first') cells.reverse();
    let guard = 30;
    while (guard--) {
      const e = cells[cells.length - 1], p = cells[cells.length - 2];
      if (e[ax] === target) break;
      const nx = e.slice(); nx[ax] += Math.sign(target - e[ax]);
      if (p && p[0] === nx[0] && p[1] === nx[1]) { if (cells.length > b.base) cells.pop(); else break; }
      else if (free(s, stage, nx[0], nx[1], b.id) && !has(cells, nx[0], nx[1])) cells.push(nx);
      else break;
    }
    if (end === 'first') cells.reverse();
    return cells;
  }

  /* ── 분리: 길 위에서 이웃한 두 칸 사이가 절단선 ── */
  function cutLines(b) {
    if (b.kw.blue !== 'split') return [];
    const lines = [];
    for (let k = 1; k < b.cells.length; k++) lines.push({ k, a: b.cells[k - 1], b: b.cells[k] });
    return lines;
  }
  function split(s, stage, id, k) {
    const b = get(s, id), d = def(stage, b);
    const upper = b.cells.slice(k);
    b.cells = b.cells.slice(0, k);
    delete b.kw.blue;                                  // 1회 사용 후 사라진다
    const upType = d.splitUpper || b.type;
    const pieces = d.splitUpper ? upper.map(c => [c]) : [upper];
    const made = pieces.map(cells => {
      const nb = { id: 'n' + (s.seq++), type: upType, cells, base: 1, kw: Object.assign({}, stage.blockTypes[upType].kw), take: {}, states: [] };
      s.blocks.push(nb); return nb;
    });
    if (b.cells.length === 1 && d.splitRootSmall) {    // 뿌리 쪽이 1칸 → 자란다를 잃는다
      const y = b.kw.yellow;
      if (y && KW[y].grow) { delete b.kw.yellow; delete b.take[y]; }
      b.type = d.splitRootSmall; b.base = 1;
    } else b.base = Math.min(b.base, b.cells.length);
    return made[0].id;
  }

  /* ── 매 행동 후 효과 처리: 열 전달 → 차단 확인 → 연소 부여 → 조합 → 모닥불 → 목표 ── */
  function settle(s, stage) {
    const events = [];
    s.blocks.forEach(b => {                            // 세로 2칸 이상 나무 = 위험
      const d = def(stage, b), i = b.states.indexOf('danger');
      const danger = !!d.dangerMinH && b.cells.length >= d.dangerMinH;
      if (danger && i < 0) b.states.push('danger');
      if (!danger && i >= 0) b.states.splice(i, 1);
    });
    // 열 전달: 주변 1칸의 빈칸에 열 (다른 블록이 차지한 칸은 막힌다)
    s.blocks.filter(b => b.kw.red === 'heatSpread').forEach(src => {
      src.cells.forEach(c => {
        for (let x = c[0] - 1; x <= c[0] + 1; x++) for (let y = c[1] - 1; y <= c[1] + 1; y++) {
          if (!inside(stage, x, y) || at(s, x, y)) continue;
          const id = 'n' + (s.seq++);
          s.blocks.push({ id, type: 'heat', cells: [[x, y]], base: 1, kw: Object.assign({}, stage.blockTypes.heat.kw), take: {}, states: (stage.blockTypes.heat.states || []).slice() });
          events.push({ t: 'heat', id });
        }
      });
    });
    // 연소 부여 + 조합
    const fail = { kind: null, ids: [] }, toBurn = [];
    s.blocks.filter(b => hasState(b, 'ignite')).forEach(src => {
      s.blocks.forEach(o => {
        if (o === src || !touching(src.cells, o.cells)) return;
        const d = def(stage, o);
        if (d.category === 'person') { fail.kind = fail.kind || stage.rules.personOnIgnite; fail.ids.push(o.id); }
        else if (hasState(o, 'danger')) { fail.kind = fail.kind || stage.rules.dangerOnIgnite; fail.ids.push(o.id); }
        else if (d.ignitesTo && toBurn.indexOf(o) < 0) toBurn.push(o);
      });
    });
    if (fail.kind) return { fail, events, cleared: false };
    toBurn.forEach(o => {
      o.type = def(stage, o).ignitesTo;
      Object.assign(o.kw, stage.blockTypes[o.type].kw);
      (stage.blockTypes[o.type].states || []).forEach(st => { if (!hasState(o, st)) o.states.push(st); });
      events.push({ t: 'combine', id: o.id, type: o.type });
    });
    // 온기: 닿은(변이 맞닿은) 생물에게 따뜻함 → 추위 제거
    s.blocks.filter(b => hasState(b, 'campfire')).forEach(src => {
      s.blocks.forEach(o => {
        if (o === src || def(stage, o).category !== 'person') return;
        if (!touching(src.cells, o.cells)) return;
        const c = o.states.indexOf('cold');
        if (c >= 0) { o.states.splice(c, 1); o.states.push('warm'); events.push({ t: 'warm', id: o.id }); }
        else if (stage.flags.hot && hasState(o, 'warm')) { o.states.splice(o.states.indexOf('warm'), 1); o.states.push('hot'); events.push({ t: 'hot', id: o.id }); }
      });
    });
    const g = stage.goal;
    const cleared = s.blocks.filter(b => def(stage, b).category === g.category).every(b => !hasState(b, g.withoutState));
    return { fail: null, events, cleared };
  }

  /* 워드가 부족해 더 풀 수 없는 상태인지 (어림 판정) */
  function stuck(s, stage) {
    const yellow = kw => KW[kw].color === 'yellow';
    if (s.tray.some(c => yellow(c.kw))) return false;
    if (s.blocks.some(b => Object.keys(b.take).some(yellow))) return false;
    if (s.blocks.some(b => def(stage, b).enchantable && b.kw.yellow)) return false;
    return true;
  }

  return { init, clone, get, at, def, hasState, has, parts, canTake, take, canEnchant, enchant, useWord, usesOf, canRetrieve, retrieve, transfer, dragMode, slide, growEnd, grow, cutLines, split, settle, stuck };
})();
