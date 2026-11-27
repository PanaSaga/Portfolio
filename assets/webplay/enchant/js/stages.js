/* 스테이지 데이터 (기획서 부록 B.3 형식의 JSON 데이터).
   file:// 로도 열 수 있도록 .json 대신 JS 전역에 넣는다. 좌표는 x=열(0~4), y=행(A=0 ~ E=4). */
window.KEYWORDS = {
  move:       { color: 'yellow', kind: 'trait', axis: 'h' },   // 이동↔: 좌우로만
  growH:      { color: 'yellow', kind: 'trait', grow: 'w', notOn: ['magic'] },
  growV:      { color: 'yellow', kind: 'trait', grow: 'h', notOn: ['magic'] },
  split:      { color: 'blue',   kind: 'trait' },
  heatSpread: { color: 'red',    kind: 'trait' },
  ignite:     { color: 'gray',   kind: 'state' },   // '연소' — 열이 가진 상태
  campfire:   { color: 'gray',   kind: 'state' },   // '온기': 닿은 물체에 따뜻함
  block:      { color: 'green',  kind: 'trait' },
  danger:     { color: 'gray',   kind: 'state' },
  cold:       { color: 'gray',   kind: 'state', blocksMove: true },
  fixed:      { color: 'gray',   kind: 'state', blocksMove: true },   // 이동불가
  warm:       { color: 'gray',   kind: 'state' },
  hot:        { color: 'gray',   kind: 'state' },
};

window.STAGES = {
  1: {
    id: 1,
    textKey: 's1',
    size: 5,
    flags: { hot: false },               // 1스테이지는 '더움' 없음
    goal: { category: 'person', withoutState: 'cold' },
    introExpr: ['worried', 'surprised', 'surprised', 'worried', 'worried', 'neutral'],
    introCut: [0, 0, 1, 1, 2, 2],        // 대사별 스토리 컷 번호
    blockTypes: {
      thermostat: { category: 'magic',  render: 'tile',   img: 'tiles/thermostat.png', enchantable: false },
      steam:      { category: 'object', render: 'tile',   img: 'tiles/steam.png', enchantable: false, showGrowth: true },
      heat:       { category: 'state',  render: 'tile',   img: 'tiles/heat.png', enchantable: true, showGrowth: true, kw: {}, states: ['ignite'] },
      tree:       { category: 'object', render: 'tree',   img: 'tiles/tree-crown.png', img2: 'tiles/tree-trunk.png', preview: 'tiles/tree-crown.png',
                    enchantable: false, dangerMinH: 2, splitUpper: 'branch', splitRootSmall: 'stump' },
      stump:      { category: 'object', render: 'figure', img: 'tiles/stump.png', enchantable: false },
      branch:     { category: 'object', render: 'figure', img: 'tiles/branch.png', enchantable: true, ignitesTo: 'campfire' },
      campfire:   { category: 'object', render: 'figure', img: 'tiles/campfire.png', enchantable: true, kw: {}, states: ['campfire'] },
      mother:     { category: 'person', render: 'figure', img: 'tiles/mother.png', imgWarm: 'tiles/mother-warm.png', enchantable: false },
      daughter:   { category: 'person', render: 'figure', img: 'tiles/daughter.png', imgWarm: 'tiles/daughter-warm.png', enchantable: false },
    },
    // rules: 연소 부여가 닿았을 때의 조합 결과
    rules: { personOnIgnite: 'burn', dangerOnIgnite: 'fire' },
    // cells 순서 = 자라난 길 (시작점 → 끝점). fixedStart 면 시작점은 고정이고 끝점만 움직인다.
    blocks: [
      { id: 'sigil', type: 'thermostat', cells: [[3, 0]], kw: { red: 'heatSpread' }, take: {}, states: [] },
      { id: 'steam', type: 'steam', cells: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], base: 1, fixedStart: true,
        kw: { yellow: 'growH', green: 'block' }, take: { growH: 3 }, states: [] },
      { id: 'tree', type: 'tree', cells: [[0, 4], [0, 3]], fixedStart: true, kw: { yellow: 'growV', blue: 'split' }, take: { growV: 5 }, states: ['fixed', 'danger'] },
      { id: 'mother', type: 'mother', cells: [[3, 3], [3, 4]], kw: { yellow: 'move' }, take: { move: 5 }, states: ['cold'] },
      { id: 'daughter', type: 'daughter', cells: [[2, 4]], kw: { yellow: 'move' }, take: { move: 5 }, states: ['cold'] },
    ],
  },
};

/* 스테이지 선택 화면용 챕터 구성 (프로토타입 범위) */
window.CHAPTERS = [
  { id: 1, stages: [1, 2, 3], needStars: 0 },
  { id: 2, stages: [4, 5, 6], needStars: 6 },
];
