# CLAUDE.md — 도리의 정원

Claude Code가 이 저장소에서 작업할 때 따르는 규칙. 상위 폴더에 CLAUDE.md가 있으면(커밋 메시지 형식 등) 함께 적용되고, 겹치면 이 파일이 우선한다.

## 먼저 볼 것

- [docs/개발.md](docs/개발.md): 폴더 · 실행 · 테스트 · 디자인 규칙 · 배포 · 운영자 편지. [README.md](README.md)는 플레이어용 안내 — 개발 내용은 맨 끝 "개발" 절(실행 · 테스트 명령 몇 줄)만
- [체크리스트.md](체크리스트.md): 기획과 결정 기록. **맨 아래 "다음 작업"부터** 읽는다. 진행 중인 P20과 최근 P51 ~ 만 여기 있고, 끝난 절은 보관소 [P01 ~ P27](docs/기록/체크리스트-P01-P27.md) · [P28 ~ P50](docs/기록/체크리스트-P28-P50.md) (QA · 작업 메모 · 끝난 기획안도 `docs/기록/`). 항목 번호는 코드 주석에도 쓴다 (`// P19-05-06`) — 새 P 절 · 진행은 체크리스트.md에만 적고, 절이 많아지면 끝난 오래된 절을 글자 그대로 보관소로 옮긴다
- 큰 기획은 `roadmap` 스킬로 `docs/기획/`에 (스킬이 `personas.md`의 `> 문서:` 줄로 찾으니 그 줄 · 파일 위치를 함부로 바꾸지 않는다)
- 배포 주소: https://ff-1204.github.io/doris-garden/ (공개 저장소 ff-1204/doris-garden, main push = 자동 배포)

## 작업 방식

- 기능은 **기획안 → 사용자 확정 → 구현** 순서. 기획안은 체크리스트에 ⬜(미정) · 추천안으로 적고, 확정 · 구현하면 ✅와 날짜 `*(새로 10-17)*` · `*(변경 10-17)*`를 붙인다
- 구현이 끝나면 체크리스트의 해당 항목과 맨 아래 "진행 상황" · "다음 작업"을 같이 고친다
- 커밋 · push · 태그는 사용자가 요청할 때만. 목적이 다른 변경은 커밋을 나눈다. push하면 바로 공개 배포된다는 점을 잊지 않는다
- 이 저장소의 커밋 작성자는 `dorim <dorimhan@kakao.com>` (저장소 git 설정). 개인 메일을 새로 넣지 않는다

## 코드 규칙

- **엔진(`engine-*.js` 조각 10개 + 공개 목록 `engine.js`)은 화면과 분리**: DOM을 쓰지 않는다. 조각은 `engine-base` → `state` → `progress` → `actions` → `journal` → `mine-mail` → `decos` → `auto` → `long` → `save` 순서(engine.js `ENGINE_PARTS` · index.html · build-site `FILES` 셋이 같게 — `tests/globals.test.js`가 봄)로 화면 파일과 같은 전역 이름 공간을 쓴다. 새 구역은 가장 가까운 조각 끝에, 불릴 때 바로 실행되는 최상위 코드는 앞 조각 이름만. 화면 파일에 엔진과 같은 최상위 이름을 만들지 않는다(SyntaxError · 함수 덮어쓰기). 공개는 `engine.js`의 `api`에 이름을 더해서(테스트 · 도구는 `require('../engine.js')` 그대로). 공개 이름 · 보정을 일부러 바꾸면 `node flower-land/tools/engine-snapshot.js --write`. 새 규칙은 엔진 함수 + `flower-land/tests/*.test.js` 테스트로. 테스트 파일은 마지막 줄에 `결과: 모두 통과` / `결과: n개 실패`를 찍는다 (run.js가 이걸 읽음)
- 시드 rng를 쓰는 곳에 `Math.random`을 새로 넣지 않는다 (시뮬레이션 결과가 흔들림 — `node flower-land/tools/sim-economy.js`가 매번 같은 값인지 확인)
- 저장 형식(`st`)에 필드를 더하면 `engine-save.js`의 `MIGRATIONS` **맨 끝에** 보정을 한 줄 더하고(가운데 끼우거나 순서를 바꾸지 않음 — `st.mig`가 몇 번째까지 했는지 셈), `tests/migrate.test.js`에 확인을 더한다. 열 때마다 할 일은 `onOpen`. 불러온 저장은 `cleanSave`(P67)가 글자 < > · 숫자 칸(`SAVE_NUMS`)을 먼저 정리 — 화면에 그대로 찍는 숫자 칸을 새로 만들면 목록에 더한다. `app.js`의 `load()`는 `E.migrateSave`만 부른다
- 화면 코드는 `app.js` → `app-journal` → `app-garden` → `app-mine` → `app-shop` → `app-teashop` → `app-forest` → `app-farm` → `app-dex` → `app-inbox` → `app-manual` → `app-cloud` → `app-main` 순서로 불리고 전역 이름 공간을 같이 쓴다. 불릴 때 바로 실행되는 코드(이벤트 연결 등)는 앞 파일에 있는 것만 쓸 수 있다. 새 최상위 이름이 `window`의 기본 이름(open · close · print 등)과 겹치지 않게
- 화면의 뽑기(심기 · 번식 등)는 `Math.random` 대신 `ctx.rng`
- 화면 문구는 한국어 해요체 · 짧게(📘 매뉴얼 말투, P51). 단추는 "~하기"보다 동사 한두 마디
- **도트 그림 규칙 (P16-14)**: 모서리 없는 네모 칸, 도트 그림은 원본 크기(16px · 22px)의 **정수배**로만 그린다. 칭호는 칭호마다 모티프 · 팔레트가 겹치지 않게 (`titles.js`)
- **디자인 규칙 (P57)**: 간격 · 모서리 · 글자는 `style.css` 토큰(`--sp-*` · `--r-*` · `--fs-*`)과 있는 색 변수만. 카드 격자는 칸 수를 고정하지 않고, 격자 트랙엔 맨 `1fr` 대신 `minmax(0, 1fr)`. 자세한 것은 [docs/개발.md](docs/개발.md) "디자인 규칙"
- 개발용 기능은 `DEV`(localhost · 127.0.0.1)일 때만 보이게 한다. 배포 사이트에 테스트 단추를 노출하지 않는다
- 화면에 새 파일을 추가하면 `flower-land/tools/build-site.js`의 `FILES`에도 넣는다
- 외부 서버로 데이터를 보내는 코드를 넣지 않는다 (개인정보처리방침 3번 — 방침에 적힌 쿠키 없는 방문 수 · Google Fonts · 사용자가 고른 구글 드라이브만). 바꿔야 하면 방침을 먼저 고친다

## 확인 순서 (작업을 마치기 전)

1. `node flower-land/tests/run.js` — 모두 통과. 경제를 건드렸으면 `node flower-land/tools/sim-economy.js 4 7` 전후를 체크리스트에 적는다
2. `node flower-land/tools/build-site.js` — 배포본 모으기 통과
3. 화면이 바뀌었으면 `node flower-land/serve.js`(localhost:5173)로 띄워 브라우저에서 확인 — 폭 375 · 768 · 1280 · 1536에서 `layoutCheck()` 0건 (개발.md "디자인 규칙"). 저장 상태를 심어 볼 땐 `Engine.create(...)` 후 localStorage `flower-land-v3`에 넣고, 확인 뒤 지운다 (앱이 페이지를 떠날 때 다시 저장하니 `Storage.prototype.setItem`을 잠시 막고 새로고침)
4. 모바일 · 앱 안 브라우저 동작은 이 환경에서 끝까지 확인할 수 없다 — 못 한 확인은 못 했다고 적는다

## 환경 메모 (이 PC)

- Node는 `C:\Program Files\nodejs` (bash에서 PATH에 없으면 `export PATH="/c/Program Files/nodejs:$PATH"`)
- gh는 ff-1204 계정, 토큰에 `workflow` 권한이 있어야 `.github/workflows`를 push할 수 있다
