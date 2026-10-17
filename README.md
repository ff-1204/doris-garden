# 🌱 도리의 정원 (Dori's Garden)

꽃을 심으면 땅이 그 꽃의 땅으로 바뀌는 느린 도트 정원 놀이. **현실 1주 = 정원 1년**, 일요일은 정원이 쉬는 꽃잠.

- **플레이**: https://ff-1204.github.io/doris-garden/
- **기획 · 결정 기록**: [체크리스트.md](체크리스트.md) (P01~P20, 진행 상황 · 다음 작업은 맨 아래)
- **작업 규칙 (Claude Code용)**: [CLAUDE.md](CLAUDE.md)

## 폴더

```
flower-land/
  index.html     화면 (문서 틀 · 스타일 포함)
  engine.js      게임 규칙 엔진 — 화면과 분리, Node에서도 돌아감 (테스트 · 시뮬레이션)
  app.js         화면 · 입력 · 저장(localStorage) · 도감일지 · 파일 저장하기/불러오기
  sprites.js     16×16 도트 그림 (꽃 13종 · 찻잔)
  titles.js      칭호 16×16 도트 문장 · 등급 테두리
  privacy.html · terms.html · policy.css   개인정보처리방침 · 이용약관 · 오픈소스 고지
  og.png         링크 미리보기 이미지 (tools/make-og.js로 만듦)
  serve.js       로컬 미리보기 서버
  tests/         엔진 테스트 (*.test.js, run.js로 한꺼번에)
  tools/         sim-economy.js(경제 시뮬레이션) · build-site.js(배포본) · make-og.js(미리보기 이미지)
.github/workflows/pages.yml   main에 push → 테스트 → 배포본 → GitHub Pages
```

## 로컬에서

Node.js 24 이상 (빌드 도구 · 패키지 없음).

```bash
node flower-land/serve.js
```

→ http://localhost:5173 . **localhost에서만** ⚙️ 설정에 개발용 ⏩ 시간 묶음(배속 · 다음 달 건너뛰기)이 보여요.

```bash
node flower-land/tests/run.js
```

엔진 테스트 15개 파일. 배포 워크플로도 이걸 먼저 돌리고, 실패하면 배포하지 않아요.

```bash
node flower-land/tools/sim-economy.js 4 7
```

부지런한 정원사로 4년(씨앗 7) 경제 시뮬레이션. 같은 씨앗이면 결과가 같아요.

## 배포

`main`에 push하면 [Pages 워크플로](.github/workflows/pages.yml)가 테스트 → `tools/build-site.js`로 화면 파일만 `_site/`에 모아 → Pages에 올려요 (1분 안팎).

- 화면에 새 파일을 추가하면 `tools/build-site.js`의 `FILES` 목록에도 넣어야 해요 (index.html이 부르는 파일이 빠지면 모으기가 실패해요).
- 배포본을 로컬에서 미리 보기:

  ```bash
  node flower-land/tools/build-site.js && node flower-land/serve.js _site
  ```

- 링크 미리보기 이미지를 다시 만들기:

  ```bash
  node flower-land/tools/make-og.js
  ```

  카카오톡은 미리보기를 기억하니, 바꾼 뒤엔 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 캐시를 초기화해요.
- **주소를 바꾸지 마세요.** 진행(localStorage)과 나중의 구글 로그인 허용 주소가 이 주소에 묶여 있어요.

## 저장

- 진행은 브라우저 localStorage `flower-land-v3`에 자동 저장 (불러오기 직전 정원은 `flower-land-v3-undo`).
- ⚙️ 설정 › 💾 저장: `.json` 파일로 내보내기 · 불러오기 · 되돌리기. 형식은 `engine.js`의 `makeSave` / `parseSave` (`format: 1`, 해시로 깨짐 확인). 나중의 구글 드라이브 저장도 같은 형식을 써요.

## 라이선스

LICENSE 파일을 두지 않아 기본적으로 모든 권리는 운영자에게 있어요 ([이용약관](flower-land/terms.html) 7번). 글꼴은 SIL OFL 1.1 (주아 · 고운바탕 · IBM Plex).
