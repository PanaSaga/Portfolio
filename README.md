# Portfolio

게임 기획 포트폴리오 랜딩 페이지. HTML 파일 하나로 동작하며 빌드 과정이 없습니다.

- **파일**: `index.html` 단일 파일 + 해시 라우팅 (`#about`, `#resume`, `#portfolio`, `#taste`, `#project/<id>`)
- **폰트**: Pretendard (jsDelivr CDN, 동적 서브셋)
- **디자인**: Lightdash 스타일 가이드 (흰 캔버스 + 슬레이트 톤 + Volt Violet `#5e4cff` 단일 액센트)
- **대응**: 모바일 우선 반응형, iOS Safari 대응 (safe-area, `-webkit-` 프리픽스, 터치 스크롤, aspect-ratio 폴백)

---

## 내용 채우는 법

`index.html` 안 `<script>` 맨 위의 **`CONTENT` 객체 한 곳만** 고치면 됩니다. 그 아래 코드는 건드릴 필요가 없습니다.

```js
var SHOW_PLACEHOLDER = true;   // false 로 바꾸면 빈 항목이 화면에서 사라집니다
var CONTENT = { ... };
```

- 값이 비어 있으면(`''`, `[]`) 화면에 점선 안내 박스가 표시됩니다. 어디를 채워야 하는지 바로 보입니다.
- 배열 항목은 주석으로 형태만 적어 두었습니다. 주석을 풀고 복사해서 개수를 늘리면 됩니다.
- 줄바꿈은 `\n`, 문단 나눔은 빈 줄(`\n\n`)입니다.

### 구성

| 영역 | CONTENT 경로 | 내용 |
|---|---|---|
| About | `about` | 로그라인 1(헤드라인), 도입 문단, 핵심 지표, 요약 카드 |
| Resume · 프로필 | `resume.profile` | 사진, 이름, 로그라인 2, 이메일·연락처·학력 등 |
| Resume · 경력 | `resume.career` | 회사별 항목. 가장 큰 비중 |
| Resume · 프로젝트 | `resume.projects` | `relatedCareer` 에 회사 `id` 를 적으면 경력과 연관 표시 |
| Resume · 기술 | `resume.skills` | `level` 0~5 |
| Resume · 대외활동 | `resume.activities` | 요약 카드 |
| 자기소개 (탭) | `intro` | 문항 4개 (질문/답변) |
| Portfolio · 메인 | `portfolio.main` | 카드 → `#project/<id>` 상세 페이지 |
| Portfolio · 기획서 | `portfolio.docs` | PDF 등 |
| Portfolio · AI 작업물 | `portfolio.ai` | 웹빌드 게임 · 사이트 · PDF 혼합 |
| Taste | `taste` | 육각형 그래프(축 개수 자유), 게임 개수, 플레이한 게임 목록 |

### 경력 ↔ 프로젝트 연결

```js
career:   [ { id: 'actionfit', org: '㈜ 액션핏', relatedProjects: ['blocknyang'] } ]
projects: [ { id: 'blocknyang', name: '블럭냥!', relatedCareer: 'actionfit',
              portfolioId: 'blocknyang-detail' } ]
```

`portfolioId` 를 적으면 프로젝트 카드에 Portfolio 상세 페이지로 가는 버튼이 생깁니다.

### 첨부 파일

- 저장소 안 파일: `assets/docs/파일명.pdf`, `assets/images/파일명.jpg`
- 외부 링크: 전체 URL (`https://...`)
- `type` 값에 따라 아이콘 라벨이 바뀝니다: `pdf` · `site` · `game` · `image` · `doc`
- 외부 링크와 PDF 는 새 탭에서 열립니다. (iOS Safari 인라인 PDF 뷰어 이슈 회피)

### 육각형 그래프

`taste.axes` 배열 길이만큼 다각형이 그려집니다. 6개면 육각형, 5개면 오각형입니다.
`label` 이 비어 있으면 `축 1 … 축 6` 으로 표시됩니다.

```js
axes: [ { label: '로그라이트 덱빌딩', value: 5 }, ... ]   // value 는 0~5
```

---

## 미리보기

파일을 브라우저로 그냥 열어도 되지만, 로컬 서버로 여는 쪽이 실제 배포와 같습니다.

```bash
npx http-server . -p 8080
# 또는
python3 -m http.server 8080
```

## 배포

GitHub Pages: Settings → Pages → Source 를 브랜치 루트로 지정하면 `index.html` 이 그대로 서비스됩니다.
