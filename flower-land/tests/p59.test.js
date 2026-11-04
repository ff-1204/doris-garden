// P59 🪑 찻집 가꾸기 되살리기 — 찻집 화면에 바로 (11-02 사용자 요청 "다시 보이게 하되 · 찻집 화면에서 카페 느낌이 나게 · 버튼 하나 만들고 그 안에 넣지마")
// 화면 문자열 확인: 가꾸기 단추 · 창은 없고, 찻집 화면(renderCab)에 작은 카페(손님 자리 · 찻잔 · 간판 고르기 줄)가 바로 있음. 엔진 값은 그대로
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const tea = read('app-teashop.js'), man = read('app-manual.js'), gar = read('app-garden.js'), css = read('style.css');

console.log('[찻집 화면]');
check(!/openShopUp/.test(tea) && !/data-act="shopUp"/.test(tea), '🪑 찻집 가꾸기 단추 · 창(openShopUp)이 없음');
const cab = tea.slice(tea.indexOf('function renderCab('), tea.indexOf('function firstGuestHTML('));
check(/\$\{cafeHTML\(\)\}/.test(cab), '찻집 화면(renderCab)에 작은 카페가 바로 그려짐');
check(/E\.shopOf\(st\), E\.slowView\(st\)\]\);/.test(cab), '가꾸기 · 느긋하게 보기가 바뀌면 다시 그림 (sig)');
const cafe = tea.slice(tea.indexOf('function cafeHTML('), tea.indexOf('function askSeat('));
check(/data-seat=/.test(cafe) && /data-decor=/.test(cafe) && /E\.SIGNS/.test(cafe), '빈 자리 · 간판 고르기가 화면에 (☕ 찻잔은 P60부터 🫖 우리기 창에서)');
check(/cupPreview\(sh\.cup\)/.test(cafe) && /sgn-mini sign-/.test(cafe), '탁자 위엔 지금 쓰는 찻잔 · 간판 미리보기 재사용');
check(!/openModal/.test(cafe), '고르는 곳은 창이 아님');
check(/slow \? ''/.test(cafe), '🐢 느긋하게 보기면 자리 · 잔 수 숫자를 숨김');
const buy = tea.slice(tea.indexOf('function askSeat('), tea.indexOf('const cupPrev'));
check((buy.match(/askBuy\(/g) || []).length === 2 && /E\.addSeat\(st\)/.test(buy) && /E\.buyDecor\(st, kind, key\)/.test(buy), '자리 늘리기 · 새 찻잔 · 간판은 💰 살까요? 창(askBuy) 뒤에');
check(/includes\(key\)\) return after\(E\.buyDecor/.test(buy), '가진 찻잔 · 간판은 바로 고르기 (돈 안 듦)');
check(/b\.dataset\.seat\) return askSeat\(\)/.test(tea) && /b\.dataset\.decor\) return pickDecor/.test(tea), '찻집 클릭 처리에 연결');
check(/\.cafe \{/.test(css) && /\.cf-row \{[^}]*overflow-x: auto/.test(css) && !/\.up-pop|\.up-seats|\.up-wallet/.test(css), 'CSS: 카페 · 가로 고르기 줄 · 옛 창 규칙은 지움');

console.log('[광산 · 매뉴얼]');
check(!/filter\(k => !E\.CRAFTS\[k\]\.cup\)/.test(gar) && !/!E\.CRAFTS\[c\]\.cup/.test(gar), '⛏️ 광산 만들기 · 재료 쓰임에 찻잔 세트가 다시 보임');
check(/🪑 찻집 가꾸기는 그대로/.test(man), '매뉴얼 새 철: 찻집 가꾸기 그대로');
check(/찻집 위 작은 카페/.test(man) && /빈 자리를 누르면 손님 자리가 늘어/.test(man), '매뉴얼 찻집: 화면 위 카페에서 바로 가꿔요 (P60 문구)');

console.log('[엔진 값 그대로]');
check(JSON.stringify(E.SEATS.slice(1).map(s => s.price)) === '[0,30000,80000]', '손님 자리 0 · 30,000 · 80,000원');
check(JSON.stringify(Object.values(E.CUP_SETS).map(c => c.price)) === '[0,8000,12000,20000]' && JSON.stringify(Object.values(E.SIGNS).map(c => c.price)) === '[0,6000,10000]', '찻잔 · 간판 값 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
