# CLAUDE.md — 도리의 정원

Claude Code가 이 저장소에서 작업할 때 따르는 규칙. 상위 `C:\Users\dorim\Project\CLAUDE.md`(커밋 메시지 형식 등)도 함께 적용되고, 겹치면 이 파일이 우선한다.

## 먼저 볼 것

- [docs/개발.md](docs/개발.md): 폴더 · 실행 · 테스트 · 배포. [README.md](README.md)는 플레이어용 안내라 개발 내용을 넣지 않는다
- [체크리스트.md](체크리스트.md): 기획과 결정 기록. **맨 아래 "다음 작업"부터** 읽는다. 지금 진행 중인 P20 · P28 ~ P32만 여기 있고, 끝난 P01 ~ P27은 보관소 [docs/기록/체크리스트-P01-P27.md](docs/기록/체크리스트-P01-P27.md) (QA 상세 · 10-30까지 작업 메모도 `docs/기록/`). 항목 번호(P01 ~ P32)는 코드 주석에도 쓴다 (`// P19-05-06`) — 새 P 절 · 진행은 체크리스트.md에만 적는다
- 배포 주소: https://ff-1204.github.io/doris-garden/ (공개 저장소 ff-1204/doris-garden, main push = 자동 배포)

## 작업 방식

- 기능은 **기획안 → 사용자 확정 → 구현** 순서. 기획안은 체크리스트에 ⬜(미정) · 추천안으로 적고, 확정 · 구현하면 ✅와 날짜 `*(새로 10-17)*` · `*(변경 10-17)*`를 붙인다
- 구현이 끝나면 체크리스트의 해당 항목과 맨 아래 "진행 상황" · "다음 작업"을 같이 고친다
- 커밋 · push · 태그는 사용자가 요청할 때만. 목적이 다른 변경은 커밋을 나눈다. push하면 바로 공개 배포된다는 점을 잊지 않는다
- 이 저장소의 커밋 작성자는 `dorim <dorimhan@kakao.com>` (저장소 git 설정). 개인 메일을 새로 넣지 않는다

## 코드 규칙

- **engine.js는 화면과 분리**: DOM을 쓰지 않는다. 새 규칙은 엔진 함수 + `flower-land/tests/*.test.js` 테스트로. 테스트 파일은 마지막 줄에 `결과: 모두 통과` / `결과: n개 실패`를 찍는다 (run.js가 이걸 읽음)
- 시드 rng를 쓰는 곳에 `Math.random`을 새로 넣지 않는다 (시뮬레이션 결과가 흔들림 — `node flower-land/tools/sim-economy.js`가 매번 같은 값인지 확인)
- 저장 형식(`st`)에 필드를 더하면 `engine.js`의 `MIGRATIONS` **맨 끝에** 보정을 한 줄 더하고(가운데 끼우거나 순서를 바꾸지 않음 — `st.mig`가 몇 번째까지 했는지 셈), `tests/migrate.test.js`에 확인을 더한다. 열 때마다 할 일은 `onOpen`. `app.js`의 `load()`는 `E.migrateSave`만 부른다
- 화면 코드는 `app.js` → `app-journal` → `app-garden` → `app-shop` → `app-teashop` → `app-forest` → `app-farm` → `app-dex` → `app-inbox` → `app-manual` → `app-cloud` → `app-main` 순서로 불리고 전역 이름 공간을 같이 쓴다. 불릴 때 바로 실행되는 코드(이벤트 연결 등)는 앞 파일에 있는 것만 쓸 수 있다. 새 최상위 이름이 `window`의 기본 이름(open · close · print 등)과 겹치지 않게
- 화면의 뽑기(심기 · 번식 등)는 `Math.random` 대신 `ctx.rng`
- 화면 문구는 한국어 해요체 · 짧게. 단추는 "~하기"보다 동사 한두 마디
- **도트 그림 규칙 (P16-14)**: 모서리 없는 네모 칸, 도트 그림은 원본 크기(16px · 22px)의 **정수배**로만 그린다. 칭호는 칭호마다 모티프 · 팔레트가 겹치지 않게 (`titles.js`)
- 개발용 기능은 `DEV`(localhost · 127.0.0.1)일 때만 보이게 한다. 배포 사이트에 테스트 단추를 노출하지 않는다
- 화면에 새 파일을 추가하면 `flower-land/tools/build-site.js`의 `FILES`에도 넣는다
- 외부 서버로 데이터를 보내는 코드를 넣지 않는다 (개인정보처리방침 3번 "운영자에게 보내는 정보 없음"). 바꿔야 하면 방침을 먼저 고친다

## 확인 순서 (작업을 마치기 전)

1. `node flower-land/tests/run.js` — 모두 통과
2. `node flower-land/tools/build-site.js` — 배포본 모으기 통과
3. 화면이 바뀌었으면 `node flower-land/serve.js`(localhost:5173)로 띄워 브라우저에서 확인. 저장 상태를 심어 볼 땐 `Engine.create(...)` 후 localStorage `flower-land-v3`에 넣고, 확인 뒤 지운다 (앱이 페이지를 떠날 때 다시 저장하니 `Storage.prototype.setItem`을 잠시 막고 새로고침)
4. 모바일 · 앱 안 브라우저 동작은 이 환경에서 끝까지 확인할 수 없다 — 못 한 확인은 못 했다고 적는다

## 환경 메모 (이 PC)

- Node는 `C:\Program Files\nodejs` (bash에서 PATH에 없으면 `export PATH="/c/Program Files/nodejs:$PATH"`)
- gh는 ff-1204 계정, 토큰에 `workflow` 권한이 있어야 `.github/workflows`를 push할 수 있다
