// P60 ☕ 카페 손님 · 주문 쪽지 · 우리기 전에 찻잔 고르기 · 간판 펼치기 (11-02 사용자 스케치 "픽셀로 된 사람들이 앉아있고, 커피 주문을 받는 형태이고, 차를 우리기 전에 찻잔을 선택할 수 있게 · 간판은 펼치기 형태로")
// 화면 문자열 확인 + 손님 도트 모양 확인. 엔진 값 · 저장 형식은 그대로
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const tea = read('app-teashop.js'), man = read('app-manual.js'), css = read('style.css');
global.window = {}; require(path.join(__dirname, '..', 'decos.js'));

console.log('[손님 도트 (decos.js CAFE_GUEST_ART)]');
const G = window.CAFE_GUEST_ART || {};
check(['tophat', 'cone', 'droopy', 'beanie'].every(k => G[k]), '높은 모자 · 고깔 모자 · 늘어진 귀 · 털모자 손님 4명');
check(Object.values(G).every(g => g.grid.length === 16 && g.grid.every(r => r.length === 16)), '모두 16×16');
check(Object.values(G).every(g => [...new Set(g.grid.join('').replace(/\./g, ''))].every(c => g.pal[c])), '쓰인 글자마다 색이 있음');
check(Object.values(G).every(g => g.pal.k && /^#[0-3]/.test(g.pal.k)), '진한 테두리(k) — 밝은 · 어두운 모드 둘 다 보임');

console.log('[카페: 손님 · 주문 쪽지]');
const cafe = tea.slice(tea.indexOf('function cafeHTML('), tea.indexOf('function askSeat('));
check(/guestImg\(GUEST_KEYS\[/.test(cafe) && /n <= sh\.seats/.test(cafe), '산 자리 수만큼 도트 손님이 앉음');
check(/GUEST_KEYS\.length\], 3\)/.test(cafe) && /width="32" height="32"/.test(cafe), '손님 16px ×3 · 앞의 찻잔 16px ×2 (정수배)');
check(/st\.orders && st\.orders\.list/.test(cafe) && /list\[n - 1\]/.test(cafe), '주문 쪽지를 손님에게 한 장씩');
check(/os\.filter\(o => !o\.done\), \.\.\.os\.filter\(o => o\.done\)/.test(cafe), '남은 주문부터 손님 앞에 · 끝난 주문은 ✓');
check(/☕ 아무 차나/.test(cafe), '주문보다 손님이 많으면 기본 쪽지');
check(/extra = open \? list\.slice\(sh\.seats\) : list/.test(cafe) &&/\+\$\{more\}/.test(cafe) && /cf-extra/.test(cafe), '손님보다 주문이 많으면 마지막 손님 "+n" · 카운터 아래 줄 (사라지지 않음 · 닫힌 날엔 모두 아래 줄)');
check(/!slow && st\.orders/.test(cafe) && /slow \? '' : slip\(/.test(cafe), '🐢 느긋하게 보기면 쪽지를 숨김 (P28-02 규칙)');
check(/!open\) return[^\n]*🔒 쉬는 중/.test(cafe), '찻집이 닫혀 있으면 빈 의자 · 쉬는 중');
check(/data-seat="\$\{n\}"/.test(cafe) && /＋/.test(cafe), '다음 자리는 점선 칸 "＋ 값" (askSeat)');
check(!/기념품을 두고 가요/.test(cafe) && !/cf-cap/.test(cafe) && !/1시간에 \$\{sh\.seats\}잔/.test(cafe) && /🌙 꽃잠 주문엔 작은 기념품/.test(man), '카페 아래 안내 두 줄은 없음 (P60 덧붙임) · 기념품 규칙은 매뉴얼에');
check(/cafe-scene"><div class="cf-seats">\$\{seats\}<\/div>\$\{more\}<\/div>/.test(cafe) && /extra\.length \?/.test(cafe), '넘친 쪽지 줄은 넘칠 때만');
check(/\.cafe-scene \{ container-type: inline-size/.test(css) && /@container \(min-width: 960px\) \{ \.cf-seats \{ --gs: 6/.test(css) && /\.cf-guest > img\.px:first-child \{ width: calc\(16px \* var\(--gs\)\)/.test(css), '손님은 카페 폭에 맞춘 정수배(--gs 2 ~ 6, P82-03에서 반으로)');
check(/\.cf-slip \{[^}]*width: min\([^}]*16px \* var\(--gs\)/.test(css) && /\.cf-slip b \{[^}]*font-size: var\(--sf\)/.test(css), '쪽지 폭은 손님 폭 + 여유 · 글씨는 --sf');
check(!/\.cf-seat\.(off|add) \.cf-desk/.test(css) && !/\.cf-win|\.cf-shelf|\.cf-cap/.test(css), '자리마다 다르던 탁자 대신 하나로 이어진 긴 카운터 · 창문 · 선반 · 안내 줄 CSS 정리');
check(!/function ordersHTML/.test(tea) && !/\$\{ordersHTML\(\)\}/.test(tea), '아래쪽 💌 손님 주문 블록(ordersHTML)은 지움');

console.log('[🪧 간판 펼치기]');
check(/<details class="cf-signs"\$\{ui\.signOpen \? ' open' : ''\}>/.test(cafe) && /🪧 간판 바꾸기/.test(cafe), '간판은 접어 둔 「간판 바꾸기」를 펼쳐서');
check(/data-decor="sign:\$\{key\}"/.test(cafe) && !/data-decor="cup/.test(cafe) && !/E\.CUP_SETS/.test(cafe), '카페엔 간판 타일만 (☕ 찻잔 줄은 없음)');
check(/matches\('\.cf-signs'\)\) ui\.signOpen = e\.target\.open/.test(tea), '펼침 상태를 기억 (다시 그려도 그대로)');

console.log('[☕ 우리기 전에 찻잔 고르기]');
const brew = tea.slice(tea.indexOf('function openBrewConfirm('), tea.indexOf('function openBlendConfirm('));
check(/function openBrewConfirm\(teaIds, blendIds, counts, cup, honeyKs\)/.test(brew) && /again = \(c2, cup2\) => openBrewConfirm\(teaIds, blendIds, c2, cup2, honeyKs\)/.test(brew) && /cup = cup && sh\.cups\.includes\(cup\) \? cup : sh\.cup/.test(brew), '우리기 창이 지금 세트를 골라 둔 채 열림 (그대로면 바로 우리기)');
check(/Object\.entries\(E\.CUP_SETS\)/.test(brew) && /data-bcup=/.test(brew) && /cupPreview\(k\)/.test(brew), '찻잔 세트 줄 (가진 것 · 없는 것은 값)');
check(/askBuy\(/.test(brew) && /E\.buyDecor\(st, 'cup', k\)/.test(brew), '없는 세트는 💰 살까요? 뒤 E.buyDecor');
check(/if \(cup !== E\.shopOf\(st\)\.cup\) E\.buyDecor\(st, 'cup', cup\); after\(E\.brew\(/.test(brew), '우리면 고른 세트가 sh.cup (저장 형식 그대로)');
check(/data-bq[\s\S]*again\(\{[^}]*\}, cup\)/.test(brew), '개수 바꿔도 고른 찻잔 유지 (P65-02 again — 꿀차 줄도 그대로)');
check(/class="cup-now"/.test(tea) && /cupPreview\(E\.shopOf\(st\)\.cup\)/.test(tea), '🏷️ 티백 머리줄에 지금 찻잔 미리보기');
check(!/openModal\('☕/.test(tea), '찻잔만 고르는 따로 창은 없음 (우리기 창 안에서)');

console.log('[CSS · 매뉴얼]');
check(/\.cf-seats \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/.test(css) && /\.cf-slip \{/.test(css) && /\.cf-desk \{/.test(css), 'CSS: 세 칸(minmax(0, 1fr)) · 카운터 · 쪽지');
check(/:root\[data-theme="dark"\] \.cf-slip \{/.test(css) && /prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \.cf-slip/.test(css), '쪽지 어두운 모드 색');
check(!/^\.orders \{/m.test(css) && !/^\.order \{/m.test(css), '옛 쪽지 CSS(.orders · .order) 정리');
check(/\.brew-cup \{/.test(css) && /\.cf-signs > summary/.test(css), 'CSS: 우리기 찻잔 줄 · 간판 펼치기');
check(/손님이 카운터에 앉아 주문 쪽지/.test(man) && /찻잔은 🫖 우리기 창에서 골라요/.test(man) && /간판 바꾸기」를 펼쳐요/.test(man), '매뉴얼 찻집 문구');

console.log('[엔진 값 그대로]');
check(JSON.stringify(E.SEATS.slice(1).map(s => s.price)) === '[0,30000,80000]' && JSON.stringify(Object.values(E.CUP_SETS).map(c => c.price)) === '[0,8000,12000,20000]' && JSON.stringify(Object.values(E.SIGNS).map(c => c.price)) === '[0,6000,10000]', '자리 · 찻잔 · 간판 값 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
