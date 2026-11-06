// P89 (11-06): 젤리 도트 — 둥근 사각형 단추 · 돌봄 젤리 · 새 픽셀 아이콘 · 꽃 줄
const path = require('path'), fs = require('fs');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const css = read('style.css'), html = read('index.html'), garden = read('app-garden.js'), app = read('app.js'), shop = read('app-shop.js');
global.window = {}; require(path.join(__dirname, '..', 'sprites.js'));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; const [r, g, b] = c.map(f); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const mix = (a, b, p) => hex(a).map((v, i) => v * p + hex(b)[i] * (1 - p));

console.log('[둥글기 (P89-01)]');
check(/--r-xs: 6px; --r-sm: 12px; --r-md: 12px; --r-lg: 12px; --r-xl: 16px; --r-pill: 10px; --r-dot: 4px;/.test(css), '단추 12px · 카드 16px 토큰');
check(/\.btn \{ border: 0; border-radius: var\(--r-sm\)/.test(css) && /nav\.tabs button \{ border-radius: var\(--r-sm\)/.test(css) && /\.ring-btn \{ border-radius: var\(--r-sm\)/.test(css), '단추 · 탭 · 둘레 단추는 둥근 사각형');
check(/<div class="map-tools">\s*<button[^>]*id="mapZoom"[\s\S]*id="shareBtn"[\s\S]*?<\/div>/.test(html) && /\.map-tools \{[^}]*display: grid; gap: var\(--sp-4\)/.test(css), '🔍 · 공유는 세로로 나란히 — 서로 겹치지 않음');
check(/\.map-zoom, \.share-btn\.map-share \{ position: static;[^}]*width: 44px; height: 44px/.test(css), '지도 위 단추 44px');

console.log('[젤리 단추 (P89-02)]');
check(/\.needs \.nd:not\(\.on\) \{ background: var\(--sunk\)/.test(css), '값 0 칸은 색을 뺌');
check(/--press: 2px/.test(css) && /prefers-reduced-motion: reduce\) \{ :root \{ --press: 0px/.test(css), '움직임 줄이기면 눌림 움직임 없음');
check(/\.btn:active:not\(:disabled\) \{ transform: translateY\(var\(--press\)\)/.test(css), '눌리면 내려감');
const K = ['#3d8fd6', '#4f9a3a', '#d4466e', '#9a6a3a', '#d08a12'];
check(K.every(k => ratio(hex('#33251a'), mix(k, '#ffffff', .3)) >= 4.5), '낮: 돌봄 젤리 위 글자 4.5:1 이상');
check(K.every(k => ratio(hex('#f4e9d6'), mix(k, '#33261b', .34)) >= 4.5), '밤: 돌봄 젤리 위 글자 4.5:1 이상');
check(!/:root\[data-big\] nav\.tabs button\[aria-selected="true"\]/.test(css), '큰 글씨에서도 고른 탭은 금빛');

console.log('[새 픽셀 (P89-03)]');
const I = window.UI_ICONS || {};
check(['water', 'weed', 'prune', 'fert', 'basket', 'shovel', 'share', 'zoom', 'garland'].every(k => I[k]), '아이콘 8 + 꽃 줄 1');
check(Object.values(I).every(a => a.grid.length === 16 && a.grid.every(r => r.length === 16)), '모두 16×16');
check(Object.values(I).every(a => [...new Set(a.grid.join('').replace(/\./g, ''))].every(c => a.pal[c])), '쓰인 글자마다 색이 있음');
check(/width="\$\{16 \* \(scale \|\| 2\)\}"/.test(app), '정수배로만 그림');
check(/uiImg\(UI_CARE\[k\]\)/.test(garden) && /uiImg\(UI_CARE\[t\]\)/.test(garden) && /UI_SUP\[k\] \? uiImg/.test(shop), '돌봄 칸 · 둘레 단추 · 용품 칸');
check(/\.yearstrip::after \{[^}]*pointer-events: none/.test(css), '꽃 줄은 끌기 · 누르기를 막지 않음');
check(!/garland/.test(garden), '꽃 줄은 CSS — 공유 그림(draw)엔 안 나옴');

console.log('[모두 거두기 단추 빼기 (P89-05)]');
const man = read('app-manual.js');
check(/const CARE_ALL = \[\['water', '모두 물 주기'\]\];/.test(garden), '돌봄 줄 끝 모두 거두기 단추 없음');
check(/if \(t === 'harvest' && n >= 2\) return careAllOn\('harvest'\)/.test(garden), '바구니 칸이 두 포기부터 한 번에 거둠');
check(/눌러서 모두 거두기/.test(garden) && /<b>바구니 칸<\/b>을 누르면/.test(man), '칸 설명 · 매뉴얼 문구');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
