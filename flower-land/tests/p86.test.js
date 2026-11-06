// P86 (11-06): 🪵 나무 선반 — 재질 토큰 · 돌봄 단추 · 돈 표시 · 지도 칸 정수배 · 여섯 화면
const path = require('path'), fs = require('fs');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const css = read('style.css'), html = read('index.html'), garden = read('app-garden.js'), journal = read('app-journal.js'), tea = read('app-teashop.js');
const apps = fs.readdirSync(path.join(__dirname, '..')).filter(f => /^app.*\.js$/.test(f)).map(read).join('\n');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; const [r, g, b] = hex(c).map(f); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const val = (block, k) => (block.match(new RegExp(`--${k}: (#[0-9a-f]{6})`)) || [])[1];

console.log('[재질 토큰 (P86-01)]');
const day = css.slice(css.indexOf(':root {'), css.indexOf('--spring')), night = css.match(/:root\[data-theme="dark"\] \{ --bg[^}]*\}/)[0];
check(/--r-xs: 0; --r-sm: 0; --r-md: 0; --r-lg: 0; --r-xl: 0; --r-pill: 0; --r-dot: 0;/.test(css), '모서리 토큰은 모두 0');
check(!/border-radius: 50%/.test(css), '동그란 모서리 없음');
check(/--pxb:/.test(css) && /:is\(\.shopcard, \.status, \.cafe[^{]*\{[^}]*box-shadow: var\(--pxb\)/.test(css), '판은 네 귀가 빈 도트 테두리');
for (const [nm, b] of [['낮', day], ['밤', night]]) {
  check(ratio(val(b, 'ink'), val(b, 'panel0')) >= 4.5 && ratio(val(b, 'muted'), val(b, 'panel0')) >= 4.5, `${nm}: 글자 · 흐린 글자 / 판 4.5:1 이상`);
  check(ratio(val(b, 'ink'), val(b, 'bg')) >= 4.5 && ratio(val(b, 'muted'), val(b, 'bg')) >= 4.5, `${nm}: 글자 · 흐린 글자 / 바탕 4.5:1 이상`);
  check(ratio(val(b, 'wood-ink'), val(b, 'wood')) >= 4.5 && ratio(val(b, 'wood-muted'), val(b, 'wood')) >= 4.5, `${nm}: 나무 위 글자 4.5:1 이상`);
}
check(ratio('#2c2119', '#d9b26a') >= 4.5, '주 단추 금빛 글자 4.5:1 이상');

console.log('[공통 세 가지 (P86-02)]');
check(/\.needs \.nd \{[^}]*min-height: 44px/.test(css) && /\.ring-btn \{ width: 44px; height: 44px/.test(css), '돌봄 단추 · 둘레 단추 44px');
check(/id="topMoney"/.test(html) && /E\.slowView\(st\) \|\| \['shop', 'farm'\]\.includes\(ui\.tab\) \? ''/.test(journal), '돈은 위 막대에 · 🐢 느긋하게 보기면 숨김 · 화원 · 곤충농장은 화면 안 돈과 겹치지 않음');
check(/cell = 16 \* k;/.test(garden) && /Math\.round\(base \/ \(W \* 16\)\)/.test(garden), '지도 칸은 16px 정수배');
check(/<div class="mapscroll" id="mapScroll"[^>]*><div class="mapinner">\s*<canvas id="map"/.test(html), '지도는 끄는 칸 안에');
check(/id="mapScroll"[\s\S]*id="careRing"[\s\S]*<\/div><\/div>\s*<div class="ysky"/.test(html), '둘레 단추 · 말풍선은 지도와 함께 움직임');
check(/> 10\) drag\.moved = true/.test(garden) && /if \(!moved\) onTiles\(\[t\]\)/.test(garden), '10px 넘게 끌면 칸 누르기가 아님');
check(/mapScroll\.scrollLeft = drag\.sx - /.test(garden) && /e\.pointerType !== 'touch'/.test(garden), '마우스는 직접 끌고 터치는 브라우저가 밀어 줌');
check(/\.mapscroll\.pannable canvas#map \{ touch-action: pan-x pan-y/.test(css), '끌 수 있을 때 터치로 가로 · 세로 밀기');
check(/flowerBitmap\(f\.type\)/.test(garden) && !/cell \* 0\.92/.test(garden), '핀 꽃 · 장식 · 손님은 칸 그대로 도트');
const sizes = [...apps.matchAll(/spriteImg\((?:(?!spriteImg\().){0,70}?, (\d+), (?:false|true)/g)].map(m => +m[1]);
check(sizes.length > 30 && sizes.every(n => n % 16 === 0), `화면 도트 크기는 모두 16의 배수 (${sizes.length}곳)`);

console.log('[여섯 화면 (P86-03)]');
check(/#p-cab \.stack > \.cabgrid \.teacard \.sc-art \{[^}]*border-bottom: 8px solid var\(--wood\)/.test(css), '찻집 티백은 선반 위');
check(!/생화 꽃잎의 <b class="val-down">/.test(tea) && !/그냥 두면 <b class="val-down">/.test(tea), '제다실에 늘 보이는 안내는 경고색이 아님');
check(/\.needs \.nd:not\(\.on\) \{ opacity: 1; background: transparent/.test(css), '0 칩은 바탕 없이 조용히');
check(/#p-shop \.shopcard \.btn\.primary:not\(:disabled\)/.test(css), '화원 사기 단추는 조용히');
check(/\.mine-grid \{ gap: 3px/.test(css), '광산 칸 경계');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
