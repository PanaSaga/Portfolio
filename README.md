# Portfolio

게임 기획 포트폴리오 랜딩 페이지. HTML 파일 하나로 동작하며 빌드 과정이 없습니다.

- **파일**: `index.html` 단일 파일 + 해시 라우팅
  (`#about`, `#resume`, `#resume/intro`, `#portfolio`, `#post/<id>`, `#history`)
- **폰트**: Pretendard (jsDelivr CDN, 동적 서브셋)
- **디자인**: Lightdash 스타일 — 흰 캔버스 + 슬레이트 톤 + Volt Violet `#5e4cff` 단일 액센트,
  우상단 코너에 밀착된 픽셀 모자이크, 픽셀 픽토그램(스파클 · 눈 · `</>` · 다이아몬드)
- **연출**: About 에 처음 들어갈 때 코너 모자이크가 오른쪽 위 → 왼쪽 아래 순서로 나타납니다.
  연출은 페이지를 새로 열 때 한 번만 재생되고, 탭을 오가는 것으로는 다시 재생되지 않습니다.
- **대응**: 모바일 우선 반응형, iOS Safari 대응 (safe-area, `-webkit-` 프리픽스, 터치 스크롤, `aspect-ratio` 폴백)

---

## 내용 채우는 법

`index.html` 안 `<script>` 맨 위의 **`CONTENT` 객체 한 곳만** 고치면 됩니다.

```js
var SHOW_PLACEHOLDER = true;   // false 로 바꾸면 빈 항목이 화면에서 사라집니다
var CONTENT = { ... };
```

- 값이 비어 있으면(`''`, `[]`) 화면에 점선 안내가 뜹니다. 어디를 채워야 하는지 바로 보입니다.
- 배열 항목은 주석으로 형태만 적어 두었습니다. 주석을 풀고 복사해서 개수를 늘리면 됩니다.
- 줄바꿈은 `\n`, 문단 나눔은 빈 줄(`\n\n`)입니다.

### 구성

| 영역 | CONTENT 경로 | 비고 |
|---|---|---|
| 대단원 설명문 | `descs` | 비우면 전부 `상세 설명 첨부` 로 표시 |
| About · 헤드라인 | `about.logline` / `about.intro` | 도입 문단은 로그라인의 2/3 크기 |
| About · Work style | `about.workStyle` | 3열, 큰 픽토그램 + 제목 / 하단 설명. `icon` 은 게임 아이콘(`gamepad` · `pawn` · `monitor` · `dice` · `trophy` · `heart`) 또는 `blocks` · `target` · `bars` · `bolt` · `flag` · `chat` · `box` |
| About · 대표 프로젝트 | (자동) | 메인 · 기획서 · AI 작업물 게시물 카드가 오른쪽 → 왼쪽으로 흐름. 엷은 회색 구역, 좌우 페이드 |
| 푸터 | `meta.footerName` / `meta.updated` | 오른쪽에 이름과 최종 수정 일자. **파일을 고칠 때마다 `updated` 를 함께 바꿔 주세요** |
| Resume · 프로필 | `resume.profile` | 증명사진(3:4) · 이름 + `nameEn`(영어 이름) · 로그라인 2 · **이메일/연락처(한 행)** · 학력 |
| 기술 아이콘 | `resume.skills[].icons` | 1:1 이미지 경로 **배열** (여러 개 가능) |
| Resume · 경력 | `resume.career` | **왼쪽 2/3**, 연도별 묶음 · 세로선을 따라 내려오는 타임라인 |
| Resume · 프로젝트 | `portfolio.main` | **오른쪽 1/3**, Portfolio 메인 프로젝트와 같은 게시물 (누르면 상세로) |
| Resume · 대외활동 | `resume.activities` | **왼쪽 1/3**, 경력과 같은 세로 타임라인 |
| Resume · 기술 | `resume.skills` | **오른쪽 2/3**, 탭 하나가 통째로 한 판이고 그 안에서 2열 |
| 자기소개 (탭) | `intro` | 문항 4개를 한 페이지로 나열. 탭을 바꿔도 프로필·인적사항은 그대로 유지 |
| Portfolio · 메인 | `portfolio.main` | **3열** |
| Portfolio · 기획서 | `portfolio.docs` | **4열** |
| Portfolio · AI 작업물 | `portfolio.ai` | **3열** |
| History | `history` | 다각형 그래프 · 게임 총 개수 · 플랫폼 선호도 · 게임 목록 |

### 경력 · 대외활동 칸

연도별로 묶고, 한 칸에 1:1 이미지 / 이름 / 기간 / 설명이 들어갑니다.

```js
career: [
  { year: '2025', items: [
      { image: 'assets/images/logo.png', org: '㈜ 액션핏',
        start: '2023.03.01', end: '2025.04.30',
        desc: '한 문단 설명',
        posts: [ 'blocknyang' ]      // 선택 — Portfolio 게시물 id, 칩으로 연결됩니다
      }
  ] }
]
activities: [ { image: '', title: '', start: '', end: '', desc: '' } ]
```

Resume 의 프로젝트 칸은 `CONTENT.portfolio.main` 을 그대로 보여줍니다.
따로 입력할 필요 없이 Portfolio 쪽만 채우면 됩니다.

### 기술

```js
skills: [ { icons: [ 'assets/images/ps.png', 'assets/images/ai.png' ],
            name: 'Adobe', level: 5, note: '설명 1~2줄' } ]
```

### 게시물 (메인 · 기획서 · AI 작업물)

세 목록 모두 형태가 같고, 카드를 누르면 `#post/<id>` 상세 페이지로 들어갑니다.

```js
{
  id: 'check-matter',
  title: '', tagline: '',
  kind: 'pdf',          // pdf | site | game | image | doc  — 카드 좌상단 라벨/아이콘
  thumb: 'assets/images/thumb.jpg',
  tags: ['기획', '시스템'],
  meta: [                              // 상세 페이지에서 2행 2열로 표시됩니다
    { label: '기간', value: '' }, { label: '플랫폼', value: '' },
    { label: '팀',   value: '' }, { label: '역할',   value: '' }
  ],
  links: [ { label: 'PDF 열기', href: 'assets/docs/기획서.pdf', style: 'violet' } ],
  sections: [ { heading: '', body: '', bullets: [], images: [ { src: '', caption: '' } ] } ]
}
```

상세 페이지는 **제목과 한 줄 설명만 왼쪽 정렬**이고, 그 아래는 전부 중앙 정렬입니다.

- 저장소 안 파일: `assets/docs/…`, `assets/images/…` / 외부는 전체 URL
- 외부 링크와 PDF 는 새 탭에서 열립니다 (iOS Safari 인라인 PDF 뷰어 이슈 회피)
- 세 목록에 **상세 페이지 레이아웃 확인용 샘플**이 하나씩 들어 있습니다
  (`main` → `sample`, `docs` → `sample-doc`, `ai` → `sample-ai`).
  실제 게시물을 넣을 때 해당 항목을 지우면 사라집니다.

### History

```js
axes: [ { label: '로그라이트 덱빌딩', value: 5 }, ... ]   // value 0~5, 항목을 늘리면 8각형까지 그대로
total: { value: '128', label: '플레이한 게임' },
platforms: [ { label: 'PC', value: '68', percent: 53 }, ... ],
games: [ { title: '', image: '', platform: '', genre: '', playtime: '', ending: '' } ]
```

- 축 이름은 **다각형 위에만** 표시됩니다 (별도 범례 없음).
- 게임 커버는 **4:3**, 하단에 **6열**(모바일 2~4열)로 나열됩니다.
- 카드에는 이미지 · 이름 · 태그(플랫폼 / 장르 / 플레이타임 / 엔딩)가 들어갑니다.
- 필터는 **플랫폼 · 장르 드롭다운** 두 개이고 수치 카드 바로 아래에 있습니다.
  목록은 게임 데이터에서 자동으로 만들어집니다.
- `playtime` 은 자유 입력이라 표시만 되고 필터에는 쓰이지 않습니다.
  `ending` 은 `'엔딩'` 또는 `'진행 중'` 두 값만 씁니다.

---

## 미리보기

```bash
npx http-server . -p 8080
# 또는
python3 -m http.server 8080
```

## 배포

GitHub Pages: Settings → Pages → Source 를 브랜치 루트로 지정하면 `index.html` 이 그대로 서비스됩니다.
