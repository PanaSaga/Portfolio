# 포트폴리오 사이트 인수인계 (새 채팅용)

새 채팅을 시작하면 가장 먼저 이 파일을 읽고 이어서 작업하세요.

## 1. 기본 정보
- **저장소:** `PanaSaga/Portfolio`
- **실제 사이트 브랜치:** `Portfolio_Ver01` → GitHub Pages로 자동 배포 https://panasaga.github.io/Portfolio/
- **작업 브랜치:** `claude/epic-hopper-mo9027` (세션마다 지정된 이름이 다를 수 있음)
- **배포 방법:** 두 브랜치에 같이 푸시합니다. 사용자가 `Portfolio_Ver01` 푸시를 허락해 둔 상태입니다.
  ```bash
  git commit -qam "메시지" && git push -q origin HEAD:<작업브랜치> HEAD:Portfolio_Ver01
  # 반영 확인: 새로 넣은 고유 문자열이 라이브 페이지에 나타날 때까지 확인
  for i in $(seq 40); do curl -s "https://panasaga.github.io/Portfolio/?$RANDOM" | grep -q "고유문자열" && { echo LIVE; break; }; sleep 15; done
  ```
- 커밋 메시지 끝에는 세션이 알려주는 Co-Authored-By / Claude-Session 줄을 붙입니다.

## 2. 사용자 작업 방식 (중요)
- **언어:** 항상 한국어로 답합니다.
- **보통 요청:** 수정한 뒤 바로 커밋, 푸시하고 라이브 반영까지 확인한 다음 결과를 보고합니다.
- **미리보기 요청:** "스크린샷만", "미리보기", "커밋푸쉬하지말고"라고 하면 로컬에서만 고치고 스크린샷을 보여줍니다. 이후 "배포해줘"라고 하면 그때 올립니다. 이 상태에서는 Stop hook이 "uncommitted changes" 경고를 띄우는데, 커밋하지 말고 짧게 상황만 알리면 됩니다.
- **보기만 요청:** "보여줘"나 "확인만"이면 보여주기만 하고 적용하지 않습니다.
- **추천·의견:** 깃허브에 올리지 말고 채팅으로만 답합니다.
- **빨간 표시가 있는 스크린샷:** 사용자가 자주 보냅니다. 지금까지는 이렇게 해석했습니다.
  - ✓ 체크 = 그 위치에서 줄바꿈
  - 곡선(⌒) = 줄바꿈을 없애고 띄어쓰기로 이어붙이기
  - 취소선 = 삭제
  - X = 빈 줄 삭제
  애매하면 해석한 내용을 답변에 밝힙니다.
- **이미지 화질:** 채팅에 이미지를 붙여 넣으면 압축되어 들어옵니다. 원본 화질이 필요하면 파일 첨부로 받아야 합니다. 첨부 파일은 `/root/.claude/uploads/...`에 저장됩니다.
- **유튜브:** 이 환경에서는 유튜브 다운로드가 보안 규칙으로 막혀 있습니다. 영상이 필요하면 사용자에게 파일을 받습니다.

## 3. 구조
- 사이트는 `index.html` 파일 하나입니다(약 3,600줄). 모든 내용은 그 안의 `CONTENT` 객체에 있습니다.
  - `about`: 프로필. 로그라인, workStyle(I Walk & My Work style), featured(대표 프로젝트 4개 id)
  - `resume`: profile, career(경력), skills(기술 6칸, 3열×2행), activities(대외활동)
  - `intro`: 자기소개 items. 각 항목은 `{label, q, a}`입니다.
    - `q`는 `'큰 제목|[태그][태그] 부제'` 형식입니다.
    - `a`는 본문입니다. `**굵게(보라)**`, `__형광펜(연보라)__`를 쓰고, 빈 줄은 문단 구분, `---`는 주황 `*` 구분 기호입니다.
  - `portfolio.main`: 프로젝트 목록
    - moremustmush, highnum, sample-3, sample-4
    - 쓰는 필드: brief, meta, embed, embedNative, plans(기획서 페이지 이미지), preview, loopVideo 등
  - `portfolio.docs`: 기획서 샘플 3개
  - `portfolio.ai`: 아트 작업물
    - art-work(회사 작업물), art-chara(캐릭터 원화), art-illust(일러스트), sample-art-2
    - 쓰는 필드: images, `{row:[...]}`(나란히 배치), sideThumbs, detailDesc
  - `history.games`: 플레이한 게임. 한 줄에 JSON 하나이고, 현재 501개(★80)입니다.
- 라우팅은 해시 방식입니다: `#about` `#resume` `#resume/intro` `#portfolio` `#post/<id>` `#history`
- **자산:**
  - `assets/images/`: about, career, activities, projects, games, art
  - `assets/docs/`: mmm, highnum 기획서 PDF와 페이지 이미지(webp, 1600×900)
  - `assets/icons/`: 섹션 아이콘, `nav-*.png`, `skills/*.svg`
- **도구:**
  - `tools/recalc_games.py index.html`: 게임을 추가하거나 삭제한 뒤 장르 레이더, 플랫폼 도넛, 총합 통계를 다시 계산합니다.
  - `.claude/skills/add-played-game/SKILL.md`: 게임 추가 규칙입니다. 정규 장르 33종 밖의 장르는 만들지 않습니다. 플레이타임과 엔딩은 사용자가 말한 경우에만 넣습니다.

## 4. 현재 디자인 상태 (주요 결정 사항)
- **상단 바:** 브라우저 탭 모양입니다.
  - 탭 4개: 프로필 · 이력 · 자기소개 · 포트폴리오 · 히스토리. 각 탭에 픽토그램이 있고, 폭은 고정입니다.
  - 바 높이는 59px, 배경 rgba(247,241,253), 바·본문 경계선과 선택 탭 테두리는 #f0e2fa, 탭 사이 구분선은 #dac2f5입니다.
  - 오른쪽에 창 버튼 모양의 원 3개(보·주·빨)가 있습니다.
  - 선택된 탭 색은 바로 아래 본문 배경색을 따라갑니다. 그림 위에서는 가장 밝은 색 #fffbf9를 씁니다. 관련 코드는 `syncTabBg`입니다.
  - '이력 · 자기소개' 탭의 빨간 알림 점은 누르면 사라지고, 다른 화면으로 나가면 다시 나타납니다.
  - 이 탭에 마우스를 올리면 프로필 제목의 '기획자·박지수'가 커지는 애니메이션이 함께 재생됩니다.
- **보라 팔레트:** #f0e2fa · #dac2f5 · #a576ec · #4a30dd · #241a8f (진한 두 단계는 원래 값 그대로)
- **강조색:** 주황 #f88e20, 빨강 #f31d5d
- **프로필 대표 프로젝트(bento):**
  - 1번 More Must Mush: 썸네일 7초 → 플레이 영상 3편 슬라이드, 아래에 진행 게이지
  - 2번 High Num: 플레이 영상 → 썸네일 7초 반복(`armLoop2`), 아래에 게이지. 왼쪽에 흰 그라데이션으로 팀·역할·제작 기간·역할 목록이 있고, 뒷배경은 검정입니다.
- **이력서/자기소개 전환 버튼:** 어두운 알약 모양이고, 선택된 쪽 위에 주황 막대가 붙습니다.
- **게시글 상세:**
  - 대표 이미지는 480×288로 고정입니다.
  - 제목 위치는 More Must Mush 기준으로 모든 게시글에 통일했습니다.
  - 위쪽과 아래쪽(가운데 정렬)에 '이전 · 목록으로 · 다음' 버튼이 있습니다.
  - High Num 웹빌드는 Unity 고정 크기라 `embedNative:[960,675]` + `fitWebplay()`로 칸 폭에 맞춰 확대합니다.
- **자기소개:**
  - 본문 10.5pt, 글자색 #2a2c31
  - 제목은 빨강, 키워드 태그는 주황, 항목 구분선은 베이지
  - 오른쪽에 목차(CONTENTS)가 있습니다.

## 5. 남은 일 / 미완성
- **자기소개:** '경험 및 역량'은 '…그러나'까지만 쓰여 있습니다. '성격의 장단점'은 '내용 수정중…' 상태입니다.
- **포트폴리오 샘플:** sample-3, sample-4(메인 프로젝트), 기획서 샘플 2개(sample-doc·sample-doc-2), sample-art-2가 아직 비어 있습니다.
  - `sample-doc-3`은 **인챈트 인 차트**로 채웠습니다. 상세는 **위=웹빌드 플레이, 아래=기획서 뷰어(`assets/docs/enchant/`)** 입니다.
    - 웹빌드는 외부 전용 리포(https://panasaga.github.io/Enchant_In_Chart/)를 iframe으로 임베드합니다. 용량이 커서 포트폴리오 리포에는 호스팅하지 않습니다(이전 로컬 `assets/webplay/enchant/` 23MB는 제거).
    - `embedPortrait`(세로 프레임) + `embedDefer`(클릭 시 로드, 페이지는 즉시 표시) + `embedPoster`(로드 전 세로 타이틀 표지 `assets/docs/enchant/game-cover.webp`). 관련 로직은 `bindWebplay()`.
- **I Walk & My Work style:** Check Matter 썸네일이 비어 있습니다.
- **자기소개 로그라인:** 로그라인 제목과 하단 설명이 비어 있어서 화면에 표시하지 않고 있습니다.

## 6. 확인 방법 (스크린샷)
```bash
cd /home/user/Portfolio && (python3 -m http.server 8765 >/dev/null 2>&1 &) && sleep 2
# Playwright: chromium.launch({executablePath:'/opt/pw-browsers/chromium'}) 로 http://localhost:8765/#about 등을 캡처
kill $(lsof -t -i:8765)
```
