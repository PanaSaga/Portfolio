# Portfolio

게임 기획자 박지수의 포트폴리오 사이트입니다. HTML 파일 하나로 동작하며 빌드 과정이 없습니다.

- **사이트:** https://panasaga.github.io/Portfolio/
- **배포 브랜치:** `Portfolio_Ver01` — 푸시하면 GitHub Pages 에 자동 반영됩니다.
- **작업 인수인계:** 작업 방식 · 배포 절차 · 남은 일은 [`HANDOFF.md`](HANDOFF.md) 를 먼저 읽어 주세요.

---

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 사이트 전체(약 3,500줄). 화면 · 스타일 · 스크립트와 모든 내용(`CONTENT` 객체)이 들어 있습니다. |
| `assets/images/` | about · career · activities · projects · games · art 이미지 |
| `assets/docs/` | 기획서 PDF 와 페이지 이미지(webp, 1600×900) — `mmm/` · `highnum/` · `quest/` · `enchant/` |
| `assets/icons/` | 섹션 아이콘 15종, 상단 탭 아이콘 `nav-*.png`, 기술 아이콘 `skills/*.svg` |
| `assets/stickers/` | 장식용 스티커 |
| `tools/recalc_games.py` | 플레이한 게임을 추가 · 삭제한 뒤 통계(장르 레이더 · 플랫폼 도넛 · 총합)를 다시 계산 |
| `.claude/skills/add-played-game/` | 플레이한 게임을 규칙대로 추가하는 Claude 스킬 |

- **라우팅(해시):** `#about` · `#resume` · `#resume/intro` · `#portfolio` · `#post/<id>` · `#history`
- **폰트:** Pretendard Variable (jsDelivr CDN, 동적 서브셋)
- **색:** 보라 `#f0e2fa` · `#dac2f5` · `#a576ec` · `#4a30dd` · `#241a8f`, 강조 주황 `#f88e20` · 빨강 `#f31d5d`,
  제목 `#36394a`, 바탕 `#f7f5f2` · `#efebe6`. 모든 페이지 오른쪽 위에 픽셀 모자이크가 붙습니다.
- **대응:** 모바일 우선 반응형, iOS Safari 대응(safe-area, `-webkit-` 프리픽스, `aspect-ratio` 폴백)

---

## 내용 고치는 법

`index.html` 의 `<script>` 맨 위 **`CONTENT` 객체 한 곳만** 고치면 됩니다.

```js
var SHOW_PLACEHOLDER = true;   // false 로 바꾸면 빈 항목이 화면에서 사라집니다
var CONTENT = { meta, descs, about, resume, intro, portfolio, history };
```

- 값이 비어 있으면(`''`, `[]`) 화면에 점선 자리표시가 떠서 채울 곳이 바로 보입니다.
- 줄바꿈은 `\n`, 문단 나눔은 빈 줄(`\n\n`)입니다.

| 영역 | CONTENT 경로 | 비고 |
|---|---|---|
| 사이트 공통 | `meta` | 탭 제목(`siteTitle`), 푸터 이름 · 최종 수정일(`updated`) |
| 섹션 설명문 | `descs` | 채운 것만 섹션 제목 아래에 표시 |
| 프로필 | `about` | 로그라인 · 소개 · 배너, `workStyleIntro` + `workStyle`(I Walk & My Work style), `featured`(대표 프로젝트 4개 id) |
| 이력서 | `resume` | `profile`(이름 · 로그라인 · 인적사항), `career`, `skills`(3열 × 2행), `activities` |
| 자기소개 | `intro` | 문항 `items: [{ label, q, a }]` · 오른쪽 목차(CONTENTS) |
| 포트폴리오 | `portfolio` | `main`(메인 프로젝트) · `docs`(기획서) · `ai`(아트 작업물) |
| 히스토리 | `history` | `axes`(장르 레이더) · `platforms`(도넛) · `total` · `counts` · `games`(플레이한 게임) |

### 자기소개 문항

```js
{ label: '비전',                          // 오른쪽 목차에 뜨는 짧은 이름
  q: '큰 제목|[태그][태그] 부제',           // 큰 제목(빨강) + 키워드 태그(주황)
  a: '본문…' }
```

본문 표기: `**굵게(보라)**`, `__형광펜(연보라)__`, 빈 줄 = 문단 구분, `---` 한 줄 = 주황 `*` 구분 기호.

### 게시물 (메인 · 기획서 · 아트 작업물)

카드를 누르면 `#post/<id>` 상세 페이지로 들어갑니다. 쓰는 필드만 채우면 됩니다.

```js
{
  id: 'highnum', title: 'High Num', tagline: '한 줄 설명\n둘째 줄',
  kind: 'project',            // project | pdf | game | image … — 카드 라벨
  thumb: 'assets/images/projects/highnum-thumb.webp',
  tags: ['로그라이트', '덱빌딩'],
  meta: [ { label: '팀', value: '' }, { label: '역할', value: '' }, { label: '제작 기간', value: '' } ],

  // 웹빌드 플레이 (선택)
  embed: 'https://…',         // iframe 주소
  embedNative: [960, 675],    // 고정 크기 빌드(Unity 등)를 칸 폭에 맞춰 확대
  embedPortrait: true,        // 세로형(모바일) 게임: 가운데 세로 프레임
  embedDefer: true,           // 무거운 빌드: ▶ 플레이를 눌러야 로드
  embedPoster: 'assets/…',    // 로드 전 표지

  // 기획서 뷰어 (선택) — 여러 개면 상단 토글로 전환
  plans: [ { title: '기획서', pdf: 'assets/docs/…/원본.pdf', pages: [ { img: 'assets/docs/…/slide-01.webp' } ] } ]
}
```

- 아트 작업물(`portfolio.ai`)은 `images`(여러 장, `{ row: [...] }` 로 나란히 배치), `sideThumbs`, `detailDesc` 를 씁니다.
- 대표 프로젝트 카드는 `brief` · `preview`(재생 영상) · `loopVideo` 를 씁니다.
- 게시물 본문 표기: `**형광펜**`, `__굵게__`
- 기획서 페이지 이미지는 PDF 를 가로 1600px webp 로 변환해 넣습니다.

### 플레이한 게임

```js
{"title":"게임명","image":"assets/images/games/<id>.jpg","platforms":["PC"],"date":"2024-05","genres":["RPG"],"play":"120시간","ending":true,"star":true}
```

- 한 줄에 게임 하나. 썸네일은 4:3(320×240), 장르는 정규 33종 안에서만 씁니다.
- `play` · `ending` · `star` 는 있을 때만 넣습니다. 자세한 규칙은 `add-played-game` 스킬 문서에 있습니다.
- 추가 · 삭제 후에는 `python3 tools/recalc_games.py index.html` 로 통계를 다시 계산합니다.

---

## 미리보기

```bash
python3 -m http.server 8080   # http://localhost:8080/#about
```

## 배포

```bash
git commit -am "메시지" && git push origin HEAD:Portfolio_Ver01
```

`Portfolio_Ver01` 브랜치 루트가 GitHub Pages 로 서비스됩니다. 보통 1~2분 안에 https://panasaga.github.io/Portfolio/ 에 반영됩니다.
