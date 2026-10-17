// 링크 미리보기 이미지(og.png, 1200×630) 만들기: 게임의 도트 그림(꽃 · 찻잔 · 칭호 문장)으로 정원 한 장면을 그림
// node flower-land/tools/make-og.js → flower-land/og.png (카카오톡 · 페이스북 · X 등이 링크 카드에 씀)
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
global.window = global;                                                   // sprites.js · titles.js가 window에 붙음
eval(fs.readFileSync(path.join(root, 'sprites.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'titles.js'), 'utf8'));
const E = require(path.join(root, 'engine.js'));
const SPR = window.FLOWER_SPRITES, ART = window.TITLE_ART;

const LW = 240, LH = 126, SCALE = 5;                                     // 논리 240×126 도트를 5배 → 1200×630
const W = LW * SCALE, H = LH * SCALE, px = Buffer.alloc(W * H * 4);
const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function dot(x, y, c) {                                                   // 논리 도트 하나 = 5×5 실제 픽셀
  if (x < 0 || y < 0 || x >= LW || y >= LH || !c) return;
  const [r, g, b] = Array.isArray(c) ? c : hex(c);
  for (let yy = 0; yy < SCALE; yy++) for (let xx = 0; xx < SCALE; xx++) {
    const i = ((y * SCALE + yy) * W + x * SCALE + xx) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
}
// 칭호 문장용 가짜 캔버스: fillRect를 도트로 (k배 크게, (ox, oy)에)
const fakeCtx = (ox, oy, k) => ({ fillStyle: '#000', clearRect() {}, fillRect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) dot(ox + (x + i) * k + a, oy + (y + j) * k + b, this.fillStyle); } });

// 1) 바탕: 꽃이 바꾼 땅 모자이크 (게임 지도처럼 칸마다 조금씩 다른 밝기)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const L = k => E.LANDS[k].color;
const lands = [[30, 40, 'grassland', 34], [118, 104, 'pond', 30], [205, 30, 'med', 30], [210, 100, 'subtropic', 30], [24, 108, 'foothill', 26], [120, 14, 'mossy', 18]];
const T = 6;
for (let ty = 0; ty < Math.ceil(LH / T); ty++) for (let tx = 0; tx < Math.ceil(LW / T); tx++) {
  const cx = tx * T + T / 2, cy = ty * T + T / 2;
  let best = null, bd = 1e9;
  for (const [x, y, k, r] of lands) { const d = Math.hypot(cx - x, cy - y) / r; if (d < bd) { bd = d; best = k; } }
  const base = hex(bd <= 1 ? L(best) : L('barren')), f = 0.92 + rnd() * 0.12;
  const c = base.map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) dot(tx * T + x, ty * T + y, c);
}
// 2) 꽃: 16×16 도트 그림을 그 꽃의 땅 위에
function sprite(grid, pal, ox, oy, k = 1) {
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) dot(ox + x * k + a, oy + y * k + b, pal[ch]); }));
}
const flower = (key, x, y, k) => sprite(SPR.flowers[key], SPR.pal[key], x, y, k);
[['chamomile', 14, 22], ['chamomile', 34, 44], ['marigold', 46, 18], ['rose', 8, 62], ['lavender', 188, 14], ['lavender', 210, 34], ['lotus', 104, 92], ['lotus', 128, 100],
 ['jasmine', 196, 86], ['hibiscus', 222, 102], ['gamguk', 12, 98], ['maehwa', 34, 92], ['bpea', 176, 104], ['celosia', 226, 66], ['napmae', 72, 106], ['dongbaek', 154, 4]]
  .forEach(([k, x, y]) => flower(k, x, y, 1));
// 3) 가운데: 정원 문 칭호 문장(22×22)을 3배로 + 양옆에 큰 꽃 · 찻잔
const gx = Math.round(LW / 2 - 33), gy = 24;
for (let y = -3; y < 69; y++) for (let x = -3; x < 69; x++) dot(gx + x, gy + y, [28, 34, 29]);   // 문장 뒤 그림자 판
ART.draw(fakeCtx(gx, gy, 3), 't_visit', 's', {});
flower('rose', gx - 40, gy + 26, 2);
flower('chamomile', gx + 74, gy + 26, 2);
const cupPal = Object.assign({}, SPR.cupPal, { T: SPR.tea.chamomile, f: E.FLOWERS.chamomile.petal });
sprite(SPR.cup, cupPal, gx + 25, gy + 72, 1);

// PNG로 쓰기 (RGBA 8bit, 줄마다 필터 0)
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync(path.join(root, 'og.png'), png);
console.log(`og.png ${W}×${H} · ${(png.length / 1024).toFixed(1)}KB`);
