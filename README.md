# Portfolio

게임 기획 포트폴리오 랜딩 페이지. HTML 파일 하나로 동작하며 빌드 과정이 없습니다.

- **파일**: `index.html` 단일 파일 + 해시 라우팅
  (`#about`, `#resume`, `#resume/intro`, `#portfolio`, `#post/<id>`, `#history`)
- **폰트**: Pretendard (jsDelivr CDN, 동적 서브셋)
- **디자인**: Lightdash 스타일 — 흰 캔버스 + 슬레이트 톤 + Volt Violet `#5e4cff` 단일 액센트,
  우상단 코너에 밀착된 픽셀 모자이크, 픽셀 픽토그램(스파클 · 눈 · `</>` · 다이아몬드)
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
| About | `about` | 로그라인 1(헤드라인), 도입 문단, 핵심 지표, 요약 카드 |
| Resume · 프로필 | `resume.profile` | 사진 · 이름 · 로그라인 2 · **이메일/연락처(한 행)** · 학력 |
| Resume · 경력 | `resume.career` | 가장 큰 비중 |
| Resume · 프로젝트 | `resume.projects` | `relatedCareer` 에 회사 `id` → 경력과 연관 표시 |
| Resume · 기술 | `resume.skills` | 오른쪽 2/3, `level` 0~5 |
| Resume · 대외활동 | `resume.activities` | 왼쪽 1/3 |
| 자기소개 (탭) | `intro` | 문항 4개, 접지 않고 한 페이지로 나열 |
| Portfolio · 메인 | `portfolio.main` | **3열** |
| Portfolio · 기획서 | `portfolio.docs` | **4열** |
| Portfolio · AI 작업물 | `portfolio.ai` | **3열** |
| History | `history` | 다각형 그래프 · 게임 총 개수 · 플랫폼 선호도 · 게임 목록 |

### 경력 ↔ 프로젝트 ↔ 게시물 연결

```js
career:   [ { id: 'actionfit', org: '㈜ 액션핏', relatedProjects: ['blocknyang'] } ]
projects: [ { id: 'blocknyang', name: '블럭냥!', relatedCareer: 'actionfit', postId: 'blocknyang-post' } ]
portfolio: { main: [ { id: 'blocknyang-post', title: '블럭냥!' } ] }
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
  meta:  [ { label: '기간', value: '' }, { label: '역할', value: '' } ],
  links: [ { label: 'PDF 열기', href: 'assets/docs/기획서.pdf', style: 'violet' } ],
  sections: [ { heading: '', body: '', bullets: [], images: [ { src: '', caption: '' } ] } ]
}
```

- 저장소 안 파일: `assets/docs/…`, `assets/images/…` / 외부는 전체 URL
- 외부 링크와 PDF 는 새 탭에서 열립니다 (iOS Safari 인라인 PDF 뷰어 이슈 회피)
- `CONTENT.portfolio.main` 의 `id: 'sample'` 은 **상세 페이지 레이아웃 확인용 샘플**입니다.
  실제 게시물을 넣을 때 그 항목을 지우면 사라집니다.

### History

```js
axes: [ { label: '로그라이트 덱빌딩', value: 5 }, ... ]   // value 0~5, 항목을 늘리면 8각형까지 그대로
total: { value: '128', label: '플레이한 게임' },
platforms: [ { label: 'PC', value: '68', percent: 53 }, ... ],
games: [ { title: '', image: '', platform: '', genre: '', playtime: '', ending: '' } ]
```

- 축 이름은 **다각형 위에만** 표시됩니다 (별도 범례 없음).
- 게임은 하단에 **6열**(모바일 2~4열)로 나열되고, 카드마다 이미지 · 이름 · 태그 4종이 붙습니다.
- 태그는 그대로 검색 대상입니다. 검색창에 `로그라이트`, `#PC 인디` 처럼 입력하면 되고
  (`#` 는 붙여도 안 붙여도 동일), 여러 단어는 AND 로 걸립니다.
  플랫폼 · 장르 · 엔딩 칩은 데이터에서 자동으로 만들어지며 눌러서 켜고 끌 수 있습니다.

---

## 미리보기

```bash
npx http-server . -p 8080
# 또는
python3 -m http.server 8080
```

## 배포

GitHub Pages: Settings → Pages → Source 를 브랜치 루트로 지정하면 `index.html` 이 그대로 서비스됩니다.
