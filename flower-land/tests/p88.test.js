// P88 (11-06): 정원 배치 — 칭호 액자 · 돌봄 줄은 지도 아래 · 공유는 지도 위
const path = require('path'), fs = require('fs');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const css = read('style.css'), html = read('index.html'), garden = read('app-garden.js'), man = read('app-manual.js');

console.log('[칭호 액자 (P88-01)]');
check(/\.brand \.logo-ttl \{ width: 48px; height: 48px;[^}]*border: 2px solid var\(--wood-edge\)/.test(css), '칭호는 48px 나무 액자 위');
check(/\.brand \.logo-ttl img, \.brand \.logo-ttl\.top-deco img\[width="22"\] \{ width: 44px; height: 44px/.test(css), '22px 그림 ×2 정수배');
check(/\.brand \.logo-ttl\.top-deco img \{ width: 32px; height: 32px/.test(css), '16px 장식 ×2 정수배');
check(/\.brand \.logo-ttl\[hidden\] \{ display: none/.test(css), '칭호가 없으면 빈 액자가 없음');

console.log('[돌봄 줄 (P88-02)]');
check(html.indexOf('class="hintbar"') > html.indexOf('class="mapwrap"') && html.indexOf('class="hintbar"') < html.indexOf('class="sidecol"'), '안내 줄 · 돌봄 칩은 지도 아래');
check(/for \(const id of \['#guideBox', '#today', '#tray'\]\) ro\.observe/.test(garden) && /for \(const id of \['#tray'\]\) new MutationObserver/.test(garden), '지도 아래 줄은 "지도가 밀림"으로 치지 않음');
check(/@media \(min-width: 601px\) \{ \.mapscroll \{ max-height: max\(320px, calc\(100dvh - 224px\)\)/.test(css), '넓은 화면은 지도 틀을 창에 맞춰 돌봄 줄이 첫 화면에');
check(/cell \* H > mapScroll\.clientHeight/.test(garden), '높이만 넘쳐도 끌어서 봄');
check(/지도 아래 칩 줄/.test(man), '매뉴얼 문구도 지도 아래');

console.log('[공유 (P88-03)]');
const frame = html.slice(html.indexOf('class="mapframe"'), html.indexOf('id="restBanner"'));
check(/id="mapZoom"[\s\S]*id="shareBtn"/.test(frame) && !/id="shareBtn"/.test(html.slice(html.indexOf('id="mapScroll"'), html.indexOf('class="ysky"'))), '공유는 지도 틀 위 · 끄는 칸 밖');
check(/\.share-btn\.map-share \{ position: absolute;[^}]*z-index: 3/.test(css), '지도 위에 겹침');
check(/\.mapscroll\.pan-x \.mapinner \{ margin: 0 72px 0 0/.test(css), '끌면 단추 밑 칸이 드러남');
check(!/shareBtn/.test(garden.slice(garden.indexOf('function draw(clean)'), garden.indexOf('function tileAt'))), '공유 그림(draw)엔 단추가 없음');

console.log('[카드 단추 줄 (P88-06)]');
check(/:is\(\.shopcard, \.decotile\) \{ display: flex; flex-direction: column; \}/.test(css), '세로로 쌓는 카드는 flex');
check(/:is\(\.shopcard, \.decotile\) > :is\(\.btn, \.cc-acts, \.sc-buy, \.rv-acts\):not\(\.btn \+ \*, \.cc-acts \+ \*, \.sc-buy \+ \*\) \{ margin-top: auto/.test(css), '첫 단추 줄이 맨 아래로 (이어진 단추는 그 아래)');
check(!/\.shopgrid \{[^}]*align-items/.test(css), '격자가 줄마다 카드 높이를 맞춤');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
