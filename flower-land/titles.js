// 칭호 도트 문장 (P19-05, 10-17): 16×16 문장 + 등급 테두리 = 22×22. 칭호마다 고유한 모티프 · 팔레트
// draw(ctx, key, { locked, frame, rows }) — rows는 얻을 때 연출에서 위에서부터 그릴 줄 수(0~16), 테두리는 다 그렸을 때만
(function (root) {
'use strict';
const SEAS = ['#e39ab3', '#64a653', '#cc8636', '#86abc3'];
const LANDC = ['#9fae8f', '#88bd5c', '#4788b5', '#d8c08c', '#5aa553', '#2a8549', '#5e8a6c', '#5b9c80', '#c8bc82', '#a39b8e'];
// 칭호 → [문장 이름, 안쪽 바탕색]
const ART = {
  t_visit: ['gate', '#23291f'], t_first: ['sprout', '#2b2a22'], t_land: ['compass', '#262b26'], t_water: ['lotus', '#1f2a33'], t_blend: ['pot', '#2a2533'],
  t_cafe: ['cup', '#1e2438'], t_tree: ['plum', '#2a2628'], t_sleep: ['moon', '#24203a'], t_record: ['book', '#2b2722'],
  t_hat: ['leaf', '#22301f'], t_regular: ['stack', '#2c2620'], t_lands: ['mosaic', '#232723'], t_miracle: ['miracle', '#2e2a1c'],
  t_spring4: ['spring4', '#2e2228'], t_complete: ['wreath', '#2a2a22'],
};
function emblem(name, P, R) {
  const ring = (cx, cy, r, c, w) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x + .5 - cx, y + .5 - cy); if (d <= r && d > r - w) P(x, y, c); } };
  const disc = (fn) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) fn(x, y); };
  switch (name) {
    case 'gate':     // 활짝 열린 나무 대문과 안으로 이어지는 꽃길 (첫 방문)
      R(6, 9, 4, 7, '#d9c9a3'); R(7, 6, 2, 3, '#d9c9a3'); P(7, 12, '#bfae86'); P(8, 14, '#bfae86');   // 꽃길(징검돌)
      R(0, 13, 6, 3, '#4f9a3a'); R(10, 13, 6, 3, '#4f9a3a'); R(4, 6, 3, 7, '#3f7f35'); R(9, 6, 3, 7, '#3f7f35');      // 길가 풀 · 안쪽 산울타리
      [[1, 12, '#e39ab3'], [4, 14, '#f2c624'], [11, 14, '#e39ab3'], [14, 12, '#f2c624'], [5, 7, '#f0a3c0'], [10, 8, '#f2c624']].forEach(([x, y, c]) => P(x, y, c));
      R(2, 3, 2, 13, '#a0703f'); R(12, 3, 2, 13, '#a0703f'); P(3, 3, '#6e4a28'); P(12, 3, '#6e4a28');               // 기둥
      R(1, 1, 14, 2, '#6e4a28'); R(2, 1, 12, 1, '#a0703f'); P(7, 0, '#a0703f'); P(8, 0, '#a0703f');                   // 아치 들보
      R(0, 5, 2, 8, '#c08a52'); R(0, 6, 2, 1, '#6e4a28'); R(0, 11, 2, 1, '#6e4a28');                                  // 왼쪽 문짝(바깥으로 열림)
      R(14, 5, 2, 8, '#c08a52'); R(14, 6, 2, 1, '#6e4a28'); R(14, 11, 2, 1, '#6e4a28');                               // 오른쪽 문짝
      break;
    case 'sprout':   // 토분에 돋은 떡잎 두 장
      R(7, 3, 2, 6, '#4f9a3a'); R(3, 3, 4, 2, '#8fd16a'); P(2, 4, '#8fd16a'); R(4, 5, 3, 1, '#5fae45'); R(9, 2, 4, 2, '#8fd16a'); P(13, 3, '#8fd16a'); R(9, 4, 3, 1, '#5fae45');
      R(4, 9, 8, 1, '#5a3a22'); R(3, 10, 10, 2, '#c4733f'); R(3, 11, 10, 1, '#a35a2e'); R(4, 12, 8, 2, '#b5653a'); R(5, 14, 6, 1, '#8f4a26'); P(5, 12, '#d98b55'); break;
    case 'compass':  // 네 색 땅 타일이 맞물린 나침반
      disc((x, y) => { const d = Math.hypot(x + .5 - 8, y + .5 - 8); if (d <= 7.6) P(x, y, d > 6.6 ? '#3b3f3a' : x < 8 ? (y < 8 ? '#88bd5c' : '#d8c08c') : (y < 8 ? '#4788b5' : '#2a8549')); });
      R(7, 2, 2, 6, '#d6455d'); R(7, 8, 2, 6, '#f4f1e6'); R(7, 7, 2, 2, '#e2b33c'); break;
    case 'lotus':    // 물결 위 연꽃 한 송이
      R(0, 11, 16, 5, '#2f6f9e'); R(1, 12, 4, 1, '#86c1e6'); R(8, 12, 5, 1, '#86c1e6'); R(4, 14, 5, 1, '#86c1e6'); R(11, 14, 4, 1, '#86c1e6'); R(3, 10, 10, 1, '#4f9a3a');
      R(2, 8, 3, 2, '#d97aa0'); R(11, 8, 3, 2, '#d97aa0'); R(4, 5, 3, 5, '#f0a3c0'); R(9, 5, 3, 5, '#f0a3c0'); R(7, 2, 2, 8, '#f7c3d6'); R(6, 3, 1, 5, '#f0a3c0'); R(9, 3, 1, 5, '#f0a3c0'); R(7, 7, 2, 1, '#f2c624'); break;
    case 'pot':      // 꽃잎 두 장이 떠 있는 찻주전자
      disc((x, y) => { const d = Math.hypot((x + .5 - 7.5) / 1.15, y + .5 - 10.5); if (d <= 4.4) P(x, y, d > 3.4 ? '#5e4596' : '#8a6cc8'); });
      R(5, 5, 5, 1, '#5e4596'); R(7, 4, 1, 1, '#b9a2ea'); R(12, 9, 2, 1, '#5e4596'); P(14, 8, '#5e4596'); R(1, 8, 1, 4, '#5e4596'); P(2, 8, '#5e4596'); P(2, 11, '#5e4596'); R(5, 9, 2, 1, '#b9a2ea');
      R(2, 1, 2, 2, '#d6455d'); P(4, 2, '#d6455d'); P(3, 3, '#a8323f'); R(11, 1, 2, 2, '#b9a2ea'); P(13, 2, '#b9a2ea'); P(12, 3, '#8a6cc8'); break;
    case 'cup':      // 김이 오르는 찻잔과 눈송이
      R(3, 9, 9, 4, '#f2efe6'); R(4, 9, 7, 1, '#d39b12'); R(3, 11, 9, 1, '#2c3e70'); R(4, 13, 7, 1, '#d9d4c4'); R(12, 10, 2, 1, '#f2efe6'); P(13, 11, '#f2efe6'); P(12, 12, '#f2efe6'); R(1, 14, 13, 1, '#2c3e70');
      [[5, 3], [5, 5], [6, 4], [6, 6], [7, 7], [8, 3], [8, 5], [9, 4], [9, 6], [8, 7]].forEach(([x, y]) => P(x, y, '#cfd8e8'));
      P(13, 2, '#a9d1f0'); R(12, 3, 3, 1, '#a9d1f0'); P(13, 4, '#a9d1f0'); P(11, 1, '#a9d1f0'); P(15, 1, '#a9d1f0'); P(11, 5, '#a9d1f0'); P(15, 5, '#a9d1f0'); break;
    case 'plum':     // 눈 쌓인 매화 가지
      for (let i = 0; i < 13; i++) { const x = 1 + i, y = 14 - Math.round(i * 0.85); R(x, y, 1, 2, '#3d3434'); if (i % 2 === 0) P(x, y - 1, '#ffffff'); }
      R(9, 9, 1, 4, '#3d3434'); P(10, 13, '#3d3434');
      [[4, 10], [8, 6], [12, 3], [10, 12]].forEach(([x, y]) => { R(x - 1, y, 3, 1, '#f0b7c8'); R(x, y - 1, 1, 3, '#f0b7c8'); P(x, y, '#c2456a'); }); P(2, 13, '#ffffff'); P(13, 2, '#ffffff'); break;
    case 'moon':     // 초승달과 Zz
      disc((x, y) => { const a = Math.hypot(x + .5 - 6.5, y + .5 - 9), b = Math.hypot(x + .5 - 9, y + .5 - 7); if (a <= 5.4 && b > 4.6) P(x, y, a > 4.6 ? '#a993c9' : '#d8caf0'); });
      R(10, 1, 4, 1, '#e8e2f5'); P(12, 2, '#e8e2f5'); P(11, 3, '#e8e2f5'); R(10, 4, 4, 1, '#e8e2f5'); R(13, 6, 2, 1, '#c9bde6'); P(13, 7, '#c9bde6'); R(13, 8, 2, 1, '#c9bde6'); P(2, 2, '#e8e2f5'); P(4, 4, '#c9bde6'); break;
    case 'book':     // 리본이 꽂힌 일지
      R(3, 2, 10, 12, '#e9dfc7'); R(3, 2, 2, 12, '#b08c5a'); R(3, 14, 10, 1, '#8a6a44'); R(12, 2, 1, 12, '#cbbd9c'); for (const y of [5, 7, 9, 11]) R(6, y, 5, 1, '#bcae8e');
      R(9, 0, 2, 4, '#c8323c'); R(9, 13, 1, 3, '#c8323c'); P(10, 13, '#c8323c'); P(11, 14, '#c8323c'); P(10, 15, '#a02028'); break;
    case 'leaf':     // 별 하나가 박힌 찻잎
      disc((x, y) => { const u = (x - y) / 1.414, v = (x + y - 15) / 1.414; if ((v * v) / 42 + (u * u) / 7 <= 1) P(x, y, Math.abs(u) < .8 ? '#4f8f37' : '#7cc35a'); });
      P(1, 14, '#4f8f37'); P(0, 15, '#4f8f37'); P(12, 1, '#f2c624'); R(11, 2, 3, 1, '#f2c624'); P(12, 3, '#f2c624'); P(10, 1, '#fff1a8'); P(14, 3, '#fff1a8'); break;
    case 'stack':    // 비스듬히 쌓인 찻잔 세 개
      [[2, 11], [4, 7], [6, 3]].forEach(([x, y]) => { R(x, y, 7, 3, '#f4f1e6'); R(x, y, 7, 1, '#d9d4c4'); R(x, y + 1, 7, 1, '#a87b4f'); R(x + 7, y, 1, 2, '#f4f1e6'); P(x + 8, y + 1, '#f4f1e6'); R(x + 1, y + 3, 5, 1, '#c9c2ae'); });
      R(1, 14, 10, 1, '#8a6a44'); break;
    case 'mosaic':   // 3×3 + 1칸 땅 모자이크
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) R(1 + i * 5, 1 + j * 5, 4, 4, LANDC[j * 3 + i]);
      R(6, 6, 4, 4, '#3b3f3a'); R(7, 7, 2, 2, LANDC[9]); break;
    case 'miracle':  // 빛줄기 속 꽃 한 송이와 별
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (let r = 4; r < 8; r++) P(Math.round(7.5 + Math.cos(a) * r - .5), Math.round(7.5 + Math.sin(a) * r - .5), '#f6e3a1'); }
      disc((x, y) => { const d = Math.hypot(x + .5 - 8, y + .5 - 8); if (d <= 3.4) P(x, y, d <= 1.5 ? '#f2c624' : '#fff6d8'); });
      R(13, 0, 1, 3, '#ffffff'); R(12, 1, 3, 1, '#ffffff'); break;
    case 'spring4': {  // 네 겹으로 피는 꽃잎 시계
      const cols = ['#f7d3df', '#efa9c0', '#e3809f', '#c9506f'];
      [7.2, 5.6, 4, 2.4].forEach((R0, i) => disc((x, y) => { const dx = x + .5 - 8, dy = y + .5 - 8, t = Math.atan2(dy, dx); if (Math.hypot(dx, dy) <= R0 * (.72 + .28 * Math.abs(Math.cos(2 * t + i * .4)))) P(x, y, cols[i]); }));
      R(8, 3, 1, 5, '#5a2a3a'); R(8, 7, 3, 1, '#5a2a3a'); break;
    }
    case 'wreath':   // 펼친 책 위 화관 (계절 4색 꽃)
      ring(8, 6, 5.2, '#5fae45', 1.6);
      [[8, 1, 0], [13, 6, 1], [8, 11, 2], [3, 6, 3]].forEach(([x, y, i]) => { R(x - 1, y, 2, 1, SEAS[i]); R(x - 1, y - 1, 1, 2, SEAS[i]); P(x, y, SEAS[i]); });
      R(1, 11, 6, 4, '#fbf7ea'); R(9, 11, 6, 4, '#fbf7ea'); R(7, 11, 2, 4, '#c9b77c'); R(0, 15, 16, 1, '#8a6a44'); R(2, 12, 4, 1, '#d9cfb4'); R(10, 12, 4, 1, '#d9cfb4'); R(2, 13, 3, 1, '#d9cfb4'); break;
  }
}
function draw(x, key, tier, opt) {
  const o = opt || {}, locked = !!o.locked, frame = o.frame || 0, rows = o.rows == null ? 16 : o.rows;
  const [name, bg] = ART[key] || ['sprout', '#2a2e2a'];
  const g = v => locked ? '#4a504a' : v, fr = v => locked ? '#6a706a' : v;
  const P = (a, b, v) => { x.fillStyle = v; x.fillRect(a, b, 1, 1); }, R = (a, b, w, h, v) => { x.fillStyle = v; x.fillRect(a, b, w, h); };
  x.clearRect(0, 0, 22, 22);
  R(2, 2, 18, 18, locked ? '#2a2e2a' : bg);
  emblem(name, (a, b, v) => { if (b < rows) P(a + 3, b + 3, g(v)); }, (a, b, w, h, v) => { const hh = Math.min(h, rows - b); if (hh > 0) R(a + 3, b + 3, w, hh, g(v)); });
  if (rows < 16) return;
  if (tier === 's') {                                           // 🌱 새싹: 나무색 1px, 모서리 깎음
    for (let i = 2; i < 20; i++) { P(i, 1, fr('#8a6a44')); P(i, 20, fr('#8a6a44')); P(1, i, fr('#8a6a44')); P(20, i, fr('#8a6a44')); }
    return;
  }
  const outer = tier === 'f' ? '#c9cfd6' : '#e2b33c', inner = tier === 'f' ? '#8e959c' : '#a8781c';
  for (let i = 0; i < 22; i++) {
    const o2 = key === 't_complete' && !locked ? SEAS[Math.floor(((i + frame * 2) % 22) / 5.5)] : outer;   // 도감을 채운 정원사: 계절 4색 테두리가 돎
    P(i, 0, fr(o2)); P(i, 21, fr(o2)); P(0, i, fr(o2)); P(21, i, fr(o2));
  }
  for (let i = 1; i < 21; i++) { P(i, 1, fr(inner)); P(i, 20, fr(inner)); P(1, i, fr(inner)); P(20, i, fr(inner)); }
  if (tier === 'f') [[0, 0], [20, 0], [0, 20], [20, 20]].forEach(([a, b]) => { R(a, b, 2, 2, fr('#e39ab3')); P(a + (a ? 0 : 1), b + (b ? 0 : 1), fr('#f2c624')); });   // 🌸 꽃: 모서리 꽃
  if (tier === 'g' && !locked) {                                // 👑 정원: 반짝이 두 개가 번갈아
    const [a, b] = frame % 2 ? [3, 3] : [18, 18];
    P(a, b, '#fff7d6'); P(a - 1, b, '#f2d27a'); P(a + 1, b, '#f2d27a'); P(a, b - 1, '#f2d27a'); P(a, b + 1, '#f2d27a');
  }
}
root.TITLE_ART = { draw, SIZE: 22 };
})(typeof window !== 'undefined' ? window : globalThis);
