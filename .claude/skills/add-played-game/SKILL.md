---
name: add-played-game
description: >-
  Add a game to this portfolio's History "플레이한 게임" list. Use whenever the user
  says they played a game or asks to add/register a game to the played-games list
  (e.g. "○○ 게임 플레이한 게임에 추가해줘", "○○ 30시간 했어 추가해"). Asks how long they
  played (unless already told), looks up the game's platform·genre·release date,
  downloads and 4:3-crops a thumbnail, appends the entry in the exact project
  schema in index.html (CONTENT.history.games), then rebuilds and commits.
---

# 플레이한 게임 추가

이 스킬은 `index.html` 의 `CONTENT.history.games` 배열에 게임 한 개를 규격대로 추가한다.
목록은 화면에서 자동 정렬되므로 **배열에서의 위치는 상관없다**(그래도 최신 항목은 위쪽에 넣어두면 깔끔하다).

## 1. 플레이타임 확인
- 사용자가 이미 "N시간 했어" 처럼 말했으면 **질문하지 않는다.**
- 안 말했으면 **"몇 시간 플레이했나요?"** 한 번만 묻는다. ("기록 없음"/모름도 허용)

## 2. 게임 정보 검색 (플랫폼 · 장르 · 출시일)
`WebSearch`(필요하면 `WebFetch`)로 게임을 찾아 다음을 파악한다. 과하게 조사하지 말고 간단히.
- **플랫폼** → 아래 7개 정규값으로만 매핑: `PC` · `모바일` · `콘솔` · `아케이드` · `보드게임` · `TRPG` · `VR` (복수 가능)
- **장르** → 아래 33개 정규 장르에서 1~3개 선택(복수 가능). 검색 결과 장르가 목록에 없으면 가장 가까운 정규값으로 합친다.
- **출시일** → `YYYY-MM` (월까지 알면), 아니면 `YYYY`. **불명/미확인이면 `date` 키를 생략**한다.

### 정규 장르 33종 (이 목록 밖의 값은 쓰지 않는다)
`RPG` `액션` `어드벤처` `시뮬레이션` `퍼즐` `캐주얼` `전략` `방치형` `카드` `로그라이크`
`슈팅` `호러` `턴제` `오픈월드` `비주얼노벨` `리듬` `추리` `파티게임` `플랫포머` `경영`
`타워디펜스` `수집형` `서바이벌` `샌드박스` `레이싱` `스포츠` `판타지` `SF` `협동`
`MMORPG` `덱빌딩` `보드게임` `2인용`

**매핑 예시(비정규 → 정규):** 액션RPG·롤플레잉→`RPG` / 공포·좀비→`호러` / 전략게임·타일배치·일꾼배치→`전략` /
FPS·TPS→`슈팅` / 카드게임→`카드` / 라이프시뮬·목장시뮬→`시뮬레이션` / 검과마법·히로익판타지→`판타지` /
로맨스·연애→`비주얼노벨` / 협력게임→`협동` / 서바이벌게임·배틀로얄→`서바이벌` / 힐링·인디·가족게임→`캐주얼`.
(현재 데이터에 쓰인 장르는 `grep -oE '"genres":\[[^]]*\]' index.html` 로 확인 가능.)

## 3. 플레이타임 반올림 규칙 (표시값 계산)
1. **10시간 미만이거나 기록이 없으면 `play` 키를 아예 넣지 않는다.**
2. **100시간 이하** → 5의 배수로 반올림: 끝자리 `0–2`→내림, `3–6`→`5`, `7–9`→다음 10.
   (예: 36→35, 61→60, 87→90, 97→100, 202는 >100 규칙)
3. **100시간 초과** → 10의 자리에서 **올림(ceil)**. (예: 115→120, 465→470, 585→590, 200→200)

## 4. 항목 스키마 (배열에 넣을 객체)
```json
{"title":"게임명","image":"assets/images/games/<id>.jpg","platforms":["PC"],"date":"2024-05","genres":["RPG","액션"],"play":"120시간"}
```
- `image` : 썸네일 있을 때만. (2단계 실패 시 생략 → 카드에 '이미지' 자리표시)
- `date`  : 불명이면 키 생략.
- `play`  : 10시간 미만/기록없음이면 키 생략. 10시간 이상이면 위 반올림값 `"N시간"`.
- `ending`: 엔딩(클리어)을 본 게임이면 `true`. 아니면 키 생략. 카드에 회색 '엔딩' 배지가 뜨고,
  플레이타임이 없어도 표시된다. (정렬: 플레이타임순에서 '플레이타임 있음 → 없는 엔딩 → 나머지', '엔딩순' 옵션도 있음)
- 키 순서는 `title, image, platforms, date, genres, play, ending` 로 맞춘다(있는 것만).

`index.html` 에서 `games: [` 배열의 **첫 줄 바로 아래**(또는 출시일에 맞는 위치)에 `      {…},` 한 줄로 삽입한다.

## 5. 썸네일 (규격에 맞게 잘라 등록)
1. 구글 등에서 **가장 연관 높은 커버 이미지 1장**을 찾는다. `WebSearch` 로 `"<게임명> 커버"` / 스토어(Steam header)·나무위키·위키 대표 이미지가 좋다. **최대한 간략하게**, 딱 1장만.
2. 이미지 URL 을 `curl -sL "<url>" -o /tmp/thumb.src` 로 내려받는다. (실패하면 다른 후보 1개만 더 시도)
3. **4:3(320×240) 센터크롭**으로 잘라 저장한다:
   ```python
   from PIL import Image
   im=Image.open('/tmp/thumb.src').convert('RGB'); tw,th=320,240; w,h=im.size
   s=max(tw/w,th/h); nw,nh=int(w*s+.5),int(h*s+.5); im=im.resize((nw,nh),Image.LANCZOS)
   l=(nw-tw)//2; t=(nh-th)//2; im.crop((l,t,l+tw,t+th)).save('assets/images/games/<id>.jpg','JPEG',quality=78,optimize=True)
   ```
4. **`<id>` 는 기존 파일과 겹치지 않게** 정한다. 예: 영문 슬러그 `add-<slug>.jpg` 또는 사용 중이 아닌 `gNNN`.
   (`ls assets/images/games` 로 중복 확인.)
5. 저장한 경로를 4단계 항목의 `image` 에 그대로 쓴다.

## 6. 마무리 (반영)
1. `python3 tools/build_standalone.py` 로 단일 파일 재생성(선택). 아이콘·게임 썸네일이 data URI 로 인라인된다.
2. 변경 검증: `node --check` 는 불필요하지만, 최소한 브라우저/스크립트로 게임 수가 +1 됐는지 확인.
3. `git add -A && git commit && git push` (현재 작업 브랜치로).
4. 미리보기 아티팩트를 쓰던 세션이라면 같은 URL 로 republish + standalone 파일 전달.

## 참고
- 좌측 **선호 장르 레이더 / 플랫폼 도넛 / 온라인·오프라인 총개수** 는 전체 집계 스냅샷이라
  한 게임 추가로 자동 갱신되지 않는다. 사용자가 원하면 전체 데이터로 다시 계산해 갱신한다(선택).
- 커버 4:3 규격·플레이타임 규칙·정규 장르/플랫폼은 반드시 위 규칙을 그대로 따른다.
