// 도리의 정원 (Dori's Garden) — 화면
(function () {
'use strict';
const E = window.Engine;
const { FLOWERS, FLOWER_KEYS, FORM, LIFE, LANDS, LAND_KEYS, MONTHS, SEASONS, W, H, HOUR, josa, monthName } = E;
const $ = s => document.querySelector(s);
const KEY = 'flower-land-v3';
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const starStr = q => { const s = E.stars(q); return '★'.repeat(s) + '☆'.repeat(5 - s); };
const qLabel = q => `<span class="stars">${starStr(q)}</span> <span class="data">${E.pct(q)}%</span>`;
const WEEKDAY = ['월', '화', '수', '목', '금', '토', '일'];
const SEASON_COLOR = ['var(--spring)', 'var(--summer)', 'var(--autumn)', 'var(--winter)', 'var(--rest)'];
const MONTH_SHORT = m => m === 13 ? '쉼' : m === 14 ? '샘' : String(m);
const monthsText = arr => arr.map(monthName).join('·').replace(/월·/g, '·');
const windowText = w => w.length >= 3 ? `${monthName(w[0])}~${monthName(w[w.length - 1])}` : monthsText(w);   // 이어지는 3달 이상은 "10월~1월"
const sowText = F => F.windows.map(windowText).join(' · ');                                                   // "3·4월 · 10월~1월"
const flowH = h => {
  let m = Math.floor(h / E.MONTH_H + 1e-6), d = Math.round((h - m * E.MONTH_H) / 0.8);
  if (d >= 15) { m++; d = 0; }
  return [m ? m + '달' : '', d ? d + '일' : ''].filter(Boolean).join(' ') || '1일 미만';
};
const realH = h => {
  const min = Math.max(1, Math.round(h * 60)), d = Math.floor(min / 1440), hh = Math.floor(min % 1440 / 60), mm = min % 60;
  return d ? `${d}일 ${hh}시간` : hh ? `${hh}시간 ${mm}분` : `${mm}분`;
};
const vigorWord = v => v >= 80 ? '생생해요' : v >= 50 ? '괜찮아요' : '조금 목말라 보여요';       // P14-08-02-a
const qualityWord = q => ['돌봄이 필요해 보여요', '돌봄이 필요해 보여요', '조금 지쳐 보여요', '잘 자라고 있어요', '곱게 자랐어요', '아주 곱게 피었어요'][E.stars(q)];
const homeLand = F => E.classify(F.t, F.m);
const SPR = window.FLOWER_SPRITES, spriteCache = {};
// 꽃잎 한 장 (P08-02-04): 꽃잎 색 P, 그늘 p, 잎맥 h, 테두리 o, 꼭지 g. 말린 꽃잎은 빛이 바랜 색
const PETAL_GRID = [
  '................',
  '.......ooo......',
  '......oPPPo.....',
  '.....oPPPPPo....',
  '....oPPPhPPPo...',
  '....oPPPhPPPpo..',
  '...oPPPPhPPPpo..',
  '...oPPPPPhPPpo..',
  '...oPPPPPhPPpo..',
  '....oPPPPhPppo..',
  '....oPPPPhPpo...',
  '.....oPPPhppo...',
  '......oPPppo....',
  '.......oppo.....',
  '........gg......',
  '........g.......',
];
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function petalPal(key, dried) {
  let c = FLOWERS[key].petal;
  if (dried) c = mixHex(c, '#b49a74', 0.45);                   // 말리면 갈빛이 돌아요
  return { P: c, p: mixHex(c, '#000000', 0.18), h: mixHex(c, '#ffffff', 0.35), o: mixHex(c, '#3a2a20', 0.45), g: dried ? '#8a7a52' : '#5f9445' };
}
// 화원·창고에서 파는 모양 (씨앗 봉투 · 묘목 화분 · 모종 포트 · 연근). f는 그 꽃의 꽃잎 색이라 꽃마다 달라 보여요
const FORM_GRID = {
  seed: [                                   // 씨앗 봉투: 크라프트 종이 + 흰 라벨에 작은 꽃 그림, 옆에 씨앗 몇 알
    '................',
    '...KKKKKKKKKK...',
    '...KkkkkkkkkK...',
    '...KKKKKKKKKK...',
    '...KkkkkkkkkK...',
    '...KkwwwwwwkK...',
    '...KkwwfwwwkK...',
    '...KkwfcfwwkK...',
    '...KkwwfwwwkK...',
    '...KkwwgGwwkK...',
    '...KkwwgwwwkK...',
    '...KkkkkkkkkK...',
    '...KkkkkkkkkK...',
    '...KKKKKKKKKK...',
    '.............s..',
    '...........s..s.',
  ],
  sapling: [                                // 묘목: 테라코타 화분에 나무 줄기와 잎, 화분에 꽃 색 이름표
    '................',
    '.........gg.....',
    '....gg..gGGg....',
    '...gGGg.gGg.gg..',
    '....gGb..b.gGGg.',
    '......b..b.bgg..',
    '.......bbbb.....',
    '........bb......',
    '........b.......',
    '........b.......',
    '...PPPPPPPPPPP..',
    '....ppppppppp...',
    '....ppffffppp...',
    '....ppffffppp...',
    '.....ppppppp....',
    '................',
  ],
  tree: [                                  // 나무 묘목 (동백·매화·납매): 줄기가 길고 위에만 잎
    '........gg......',
    '......gGGgg.....',
    '.....gGGgGGg....',
    '......gGbGg.....',
    '........b.......',
    '........b..gg...',
    '........bbgGg...',
    '........b.......',
    '........b.......',
    '........b.......',
    '...PPPPPPPPPPP..',
    '....ppppppppp...',
    '....ppffffppp...',
    '....ppffffppp...',
    '.....ppppppp....',
    '................',
  ],
  seedling: [                               // 모종: 까만 포트에 잎이 여럿 난 어린 포기
    '................',
    '................',
    '......g...g.....',
    '.....gGg.gGg....',
    '....gGGgggGGg...',
    '...gGg.gGg.gGg..',
    '....g.gGGGg.g...',
    '......gGGGg.....',
    '.......ggg......',
    '....TTTTTTTTT...',
    '....TtttttttT...',
    '.....tttttttt...',
    '.....tffftttt...',
    '.....tffftttt...',
    '......tttttt....',
    '................',
  ],
  rhizome: [                                // 연근: 마디 두 개와 새싹
    '................',
    '..........g.....',
    '.........gGg....',
    '..........g.....',
    '..........g.....',
    '......LLLLLLLL..',
    '.LLLL.LllllllL..',
    'LllllLLlollollL.',
    'LlollLLllllllL..',
    'LllllLLlolollL..',
    '.LLLL.LllllllL..',
    '......LLLLLLLL..',
    '................',
    '................',
    '................',
    '................',
  ],
};
function formPal(key) {
  const c = FLOWERS[key].petal, light = ['#ffffff', '#fbfbf5', '#fbe3ea', '#f1d36a'].includes(c);
  const f = light ? mixHex(c, '#b08a5a', 0.4) : c;            // 흰 꽃은 라벨 위에서 보이게 조금 진하게
  return { K: '#a07a4c', k: '#d9b98a', w: '#fbf6ea', f, c: '#f1c84a', g: '#6db35a', G: '#4f8f3e', s: '#7a5230', b: '#8a6236',
    P: '#a95d38', p: '#cf7b4c', T: '#33392f', t: '#4c5546', L: '#c49a6c', l: '#ecd5b2', o: '#9e7a55' };
}
// 티백 (P08-04): 종이 주머니 안에 찻잎(찻물 색), 실과 꽃잎 색 꼬리표
const TEABAG_GRID = [
  '........sss.....',
  '.......s...s....',
  '....BBBBBBBBs...',
  '....BbbbbbbB.s..',
  '....BbTbbTbB.s..',
  '....BbbTTbbB..s.',
  '....BTbbbbTB..s.',
  '....BbbTTbbB..s.',
  '....BbTbbTbB..s.',
  '....BbbbbbbB.ttt',
  '....BBBBBBBB.tft',
  '.............ttt',
  '................',
  '................',
  '................',
  '................',
];
function teabagPal(key) {
  const c = FLOWERS[key].petal, light = ['#ffffff', '#fbfbf5', '#fbe3ea', '#f1d36a'].includes(c);
  return { B: '#bfa883', b: '#f6efe1', T: mixHex(SPR.tea[key] || c, '#000000', 0.15), s: '#9b8a6d', t: light ? mixHex(c, '#b08a5a', 0.4) : c, f: '#ffffff' };
}
// kind: 'flower' | 'tea' | 'petal' | 'dried' | 'form' | 'teabag'. 잠긴 칸은 같은 모양의 회색 실루엣
// 🫖 대신 채도를 낮춘 도트 찻주전자 (10-06): 화면에 그려지는 글자 속 🫖를 모두 이 그림으로 바꿈
const POT_URL = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%201%2016%2013%27%20width%3D%2716%27%20height%3D%2713%27%20shape-rendering%3D%27crispEdges%27%3E%3Crect%20x%3D%276%27%20y%3D%272%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%272%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%273%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%273%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23cdb89f%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%273%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23cdb89f%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%273%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%274%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2712%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2713%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2714%27%20y%3D%275%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%270%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2714%27%20y%3D%276%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%270%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%271%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23c99aa5%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23a3b394%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2714%27%20y%3D%277%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%271%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%272%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23c99aa5%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2712%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2713%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2714%27%20y%3D%278%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%272%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23a3b394%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2712%27%20y%3D%279%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%272%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2712%27%20y%3D%2710%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%273%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%23ecdfcd%27%2F%3E%3Crect%20x%3D%2711%27%20y%3D%2711%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%274%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%275%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%277%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%279%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3Crect%20x%3D%2710%27%20y%3D%2712%27%20width%3D%271%27%20height%3D%271%27%20fill%3D%27%239a8471%27%2F%3E%3C%2Fsvg%3E";
const POT_IMG = () => { const i = document.createElement('img'); i.src = POT_URL; i.alt = ''; i.className = 'ic-pot'; return i; };
function softPots(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (root.nodeValue.includes('🫖') && root.parentNode && !root.parentNode.closest('textarea, script, style')) swapPot(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 11) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.includes('🫖') ? 1 : 3 }), list = [];
  while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { if (!n.parentNode.closest('textarea, script, style')) swapPot(n); });
}
function swapPot(n) {
  const frag = document.createDocumentFragment();
  n.nodeValue.split('🫖').forEach((part, i) => { if (i) frag.appendChild(POT_IMG()); if (part) frag.appendChild(document.createTextNode(part)); });
  n.parentNode.replaceChild(frag, n);
}
new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') softPots(m.target); else m.addedNodes.forEach(softPots); } }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
document.addEventListener('DOMContentLoaded', () => softPots(document.body));
function spriteURL(key, kind, locked) {
  const id = [key, kind, locked ? 1 : 0].join('|');
  if (spriteCache[id]) return spriteCache[id];
  const isPetal = kind === 'petal' || kind === 'dried';
  const grid = kind === 'tea' ? SPR.cup : isPetal ? PETAL_GRID : kind === 'form' ? FORM_GRID[FLOWERS[key].life === 'tree' ? 'tree' : FLOWERS[key].form] : kind === 'teabag' ? TEABAG_GRID : SPR.flowers[key];
  const pal = kind === 'tea' ? Object.assign({}, SPR.cupPal, { T: SPR.tea[key], f: FLOWERS[key].petal }) : isPetal ? petalPal(key, kind === 'dried') : kind === 'form' ? formPal(key) : kind === 'teabag' ? teabagPal(key) : SPR.pal[key];
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const x = c.getContext('2d');
  grid.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.' || !pal[ch]) return;
    x.fillStyle = locked ? (kind === 'tea' && 'sDd'.includes(ch) ? 'rgba(130,136,128,.35)' : '#8a8f86') : pal[ch];
    x.fillRect(i, j, 1, 1);
  }));
  return (spriteCache[id] = c.toDataURL());
}
// 화원·창고 카드 그림: 파는 모양(씨앗 봉투·묘목…) → 피면 이런 꽃 (작게)
const formArt = (key, size) => { const F = FLOWERS[key]; return `<span class="sc-pair">${spriteImg(key, 'form', size, false, `${F.name} ${FORM[F.form].name}`)}<span class="sc-to" aria-hidden="true">›</span><span class="sc-bloom" title="피면 ${F.name}">${spriteImg(key, 'flower', Math.round(size * 0.5), false, F.name)}</span></span>`; };
const spriteImg = (key, kind, size, locked, alt) => `<img class="px" src="${spriteURL(key, kind, locked)}" width="${size}" height="${size}" alt="${esc(alt || '')}">`;

// ---------------------------------------------------------------- 저장
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 3 && s.tiles && s.tiles.length === W * H) {
      s._fertNew = 0; s._bloomNew = {};
      if (s.water == null) s.water = 10;          // 물병·가위가 생기기 전 저장
      if (s.shears == null) s.shears = 5;
      if (s.hoe == null) s.hoe = 10;
      if (s.basket == null) s.basket = 10;
      s.drying = s.drying || []; s.dried = s.dried || []; s.blends = s.blends || []; s.cups = s.cups || [];   // 꽃방·블렌딩이 생기기 전 저장
      for (const x of [...(s.items || []), ...(s.flowers || [])]) if (x.origin === '가게') x.origin = '화원';   // 가게 → 화원 (10-05)
      if (!s.dex.petal) {                          // 꽃잎 도감 전: 이미 거둔 적 있는 꽃(차나 꽃잎이 있는 꽃)은 등록해 둠
        s.dex.petal = {};
        for (const k of [...Object.keys(s.dex.tea), ...s.petals.map(p => p.type), ...s.teas.map(t => t.type)]) s.dex.petal[k] = true;
      }
      s.dex.blend = s.dex.blend || {};
      if (!s.gardenId) s.gardenId = E.newGardenId();   // P20 정원 이름표 (이 기능 전 저장)
      s.dex.bagBlend = s.dex.bagBlend || {};
      for (const b of [...(s.blends || []), ...(s.cups || []).filter(c => c.kind === 'blend')]) { const r = E.blendRecipe(b.parts, s); if (r !== (b.recipe || null)) { b.recipe = r; b.name = r ? E.BLENDS[r].name : `${b.parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`; } }   // 10-06 레시피가 바뀌어도 이름이 맞게
      if (!s.dex.teabag) { s.dex.teabag = {}; for (const k of [...Object.keys(s.dex.tea), ...s.teas.map(t => t.type)]) s.dex.teabag[k] = true; }   // 티백 도감 전: 만든 적 있는 차는 티백으로도 등록
      E.autoCompost(s);                            // 0%로 시든 씨앗·묘목은 열 때도 바로 비료로 (꽃잠엔 시간이 안 흘러서)
      if (!s.dex.form) {                           // 씨앗·묘목 도감 전: 가진 적 있는 것(창고 · 심은 꽃 · 핀 적 있는 꽃)은 등록해 둠
        s.dex.form = {};
        for (const x of [...s.items, ...s.flowers]) s.dex.form[x.type] = true;
        for (const k of Object.keys(s.dex.flower)) s.dex.form[k] = true;
      }
      return s;
    }
  } catch (e) { /* 저장소를 쓸 수 없으면 새로 시작 */ }
  return null;
}
function save() { try { st.lastReal = Date.now(); localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } }

let st = load() || E.create(Date.now());
// 관리자 · 테스트 기능(⏩ 배속 · 다음 달 건너뛰기)은 로컬 개발 주소에서만 (P20-12, 10-17). 배포 사이트에선 배속도 1로
const DEV = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (!DEV && st.speed !== 1) st.speed = 1;
const ctx = {
  live: false, rng: Math.random,
  toast: (text) => queueToast(text),
  onRecord: rec => { try { draw(); rec.snapshot = snapshot(); } catch (e) { /* 그림 없이 기록 */ } },
};

// 자리를 비운 동안 흐른 시간 따라잡기 (최대 3주, 그 이상은 건너뜀)
function catchUp() {
  ctx.live = false;                               // 따라잡는 동안 생긴 알림은 일지에만
  const now = Date.now(), gap = Math.max(0, now - st.lastReal), CAP = 21 * 24 * HOUR;
  if (gap > CAP) { E.advance(st, st.virtual + CAP, ctx); st.virtual += gap - CAP; st.lastAbs = E.calendar(st.virtual).abs; }
  else E.advance(st, st.virtual + gap, ctx);
  st.lastReal = now;
  ctx.live = true;
}
catchUp();

// ---------------------------------------------------------------- 파일 저장하기 · 불러오기 (P20-02 · 03, 10-17)
const UNDO_KEY = KEY + '-undo';                                        // 불러오기 직전 정원 (되돌리기 칸 1개)
const pad2 = n => String(n).padStart(2, '0');
const yearWord = y => y < 1 ? '첫 해 전' : `${y}년차`;
function whenText(ms) {
  const d = new Date(ms), now = new Date();
  return d.toDateString() === now.toDateString() ? `오늘 ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
const exportStale = () => st.lastExport && Date.now() - st.lastExport > 7 * 24 * HOUR;   // 7일 넘게 저장하지 않음 (P20-02, 알림 창은 없음)
function saveFile() {
  const now = Date.now();
  st.lastExport = now; save();
  const d = E.makeSave(st, now), sm = d.summary, t = new Date(now);
  const name = `도리의정원_${yearWord(sm.year).replace(/ /g, '')}-${monthName(sm.month)}_${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}.json`;
  return { name, sm, file: new File([JSON.stringify(d)], name, { type: 'application/json' }) };
}
function downloadSave() {
  const { name, sm, file } = saveFile(), url = URL.createObjectURL(file), a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  feedback(`💾 저장했어요 · ${yearWord(sm.year)} ${monthName(sm.month)}`);
  renderSettings();
}
// 휴대폰: 공유 시트로 파일 보내기 (되는 브라우저에서만 단추가 보임)
const canShareFile = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'a.json', { type: 'application/json' })] })); } catch (e) { return false; } })();
// 모바일 (10-17): 앱 안 브라우저(카카오톡 · 인스타그램 · 페이스북 · 라인 · 네이버)는 파일 내려받기가 막히거나 JSON이 글자로 열릴 수 있음
const UA = navigator.userAgent || '';
const IN_APP = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER\(inapp|DaumApps|everytimeApp|; wv\)/i.test(UA);
const IS_IOS = /iP(hone|ad|od)/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
const STANDALONE = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
// iPhone · iPad Safari는 7일 넘게 열지 않은 사이트의 저장 데이터를 지울 수 있음 (홈 화면 앱은 예외)
const IOS_EVICT = IS_IOS && !STANDALONE && !IN_APP;
// 브라우저에 "이 사이트 저장소는 지우지 말아 줘" 요청 (안드로이드 Chrome 등에서 받아들여질 수 있음, 실패해도 그만)
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* 무시 */ }
function openOutside() {   // 바깥 브라우저로 같은 주소 열기
  const url = location.href.split('#')[0];
  if (/KAKAOTALK/i.test(UA)) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  else if (IS_ANDROID) location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
}
function copyAddress() {
  const url = location.href.split('#')[0];
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => feedback('주소를 복사했어요 · Chrome이나 Safari에 붙여 넣어 주세요'), () => feedback(url));
}
// 💾 저장 단추: 앱 안 브라우저면 먼저 안내 (P20-07과 같은 안내를 저장에도)
function saveClick() {
  if (!IN_APP) return downloadSave();
  const canOpen = /KAKAOTALK/i.test(UA) || IS_ANDROID;
  openModal('💾 저장하기', `<div class="stack" style="gap:10px"><p style="margin:0">지금은 <b>앱 안의 브라우저</b>라서 파일 저장이 막히거나 글자로 열릴 수 있어요.</p>
    <p class="note">${canOpen ? '바깥 브라우저(Chrome · Safari)로 열어서 저장하면 확실해요. 정원은 브라우저마다 따로 저장되니, 지금 정원을 옮기려면 여기서 한 번 저장해 두세요.' : '오른쪽 위 ··· 메뉴에서 <b>Safari로 열기</b>를 고르면 확실해요. 정원은 브라우저마다 따로 저장되니, 지금 정원을 옮기려면 여기서 한 번 저장해 두세요.'}</p></div>`,
    [{ label: '주소 복사', act: () => { closeModal(); copyAddress(); } }].concat(canOpen ? [{ label: '바깥 브라우저로 열기', act: () => { closeModal(); openOutside(); } }] : [])
      .concat([{ label: '그래도 저장', primary: true, act: () => { closeModal(); downloadSave(); } }]));
}
async function shareSave() {
  const { name, sm, file } = saveFile();
  try { await navigator.share({ files: [file], title: name }); feedback(`💾 보냈어요 · ${yearWord(sm.year)} ${monthName(sm.month)}`); }
  catch (e) { if (e && e.name !== 'AbortError') feedback('보내지 못했어요. 저장 단추로 내려받아 주세요', true); }
  renderSettings();
}
// 요약 한 칸: 대표 칭호 문장 · 년차 달 · 돈 · 도감 · 칭호 · 저장한 때
function summaryCol(label, sm, when) {
  return `<div class="imp-col"><small class="imp-l">${label}</small>${sm.titleOn && E.TITLES[sm.titleOn] ? titleImg(sm.titleOn, 44, false) : '<span class="imp-ph">🌱</span>'}
    <b>${yearWord(sm.year)} ${monthName(sm.month)}</b>
    <dl class="kv"><dt>돈</dt><dd class="data">${won(sm.money)}</dd><dt>도감</dt><dd class="data">${sm.dex} / ${sm.dexTotal}</dd><dt>칭호</dt><dd class="data">${sm.titles}개</dd><dt>저장한 때</dt><dd>${when}</dd></dl></div>`;
}
function readImport(file) {
  if (!file) return;
  file.text().then(text => {
    const r = E.parseSave(text);
    if (!r.ok) return feedback(r.msg, true);
    const d = r.data, sm = E.saveSummary(d.game);                        // 요약은 파일에 적힌 값 대신 정원에서 다시 셈
    openModal('📂 불러오기', `<div class="stack" style="gap:10px">
      <div class="imp-cmp">${summaryCol('지금 정원', E.saveSummary(st), '이 브라우저')}<span class="imp-arrow" aria-hidden="true">›</span>${summaryCol('불러올 정원', sm, d.savedAt ? whenText(d.savedAt) : '알 수 없음')}</div>
      <label class="imp-opt"><input type="checkbox" id="impSettings"> 설정도 불러오기 <small class="muted">(알림 · 수면 시간)</small></label>
      <p class="note">지금 정원은 ↩︎ 되돌리기 칸에 한 번 보관돼요. 저장한 뒤 흐른 시간은 최대 3주까지 따라잡아요.</p></div>`,
      [{ label: '취소', act: closeModal }, { label: '불러오기', primary: true, act: () => applyImport(d.game, $('#impSettings').checked) }]);
  }).catch(() => feedback('파일을 읽지 못했어요', true));
}
// 정원 바꾸기: 지금 정원을 되돌리기 칸에 → 새 정원을 저장소에 쓰고 열 때와 같은 검사 · 소급 · 따라잡기
function swapGarden(game, msg) {
  try { localStorage.setItem(KEY, JSON.stringify(game)); } catch (e) { return feedback('저장소에 쓸 수 없어서 바꾸지 못했어요', true); }
  const s2 = load();
  if (!s2) { save(); return feedback('정원을 열지 못했어요. 지금 정원은 그대로예요', true); }
  st = s2;
  if (!st.gardenId) st.gardenId = E.newGardenId();
  ui.selected = null; ui.cart = {}; ui.sigs = {};
  catchUp(); E.checkJournal(st, ctx);
  closeModal(); save(); setTab('garden');
  const sm = E.saveSummary(st);
  feedback(`${msg} · ${yearWord(sm.year)} ${monthName(sm.month)}`);
}
function applyImport(game, withSettings) {
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(st)); } catch (e) { /* 보관 못 해도 불러오기는 함 */ }
  if (!withSettings) game.settings = st.settings;
  swapGarden(game, '📂 불러왔어요');
}
function undoImport() {
  let g = null;
  try { g = JSON.parse(localStorage.getItem(UNDO_KEY)); } catch (e) { /* 없음 */ }
  if (!g) return feedback('되돌릴 정원이 없어요', true);
  try { localStorage.removeItem(UNDO_KEY); } catch (e) { /* 무시 */ }
  swapGarden(g, '↩︎ 불러오기 전으로 되돌렸어요');
}
const undoSummary = () => { try { const g = JSON.parse(localStorage.getItem(UNDO_KEY)); return g && g.tiles ? E.saveSummary(g) : null; } catch (e) { return null; } };


// ---------------------------------------------------------------- 화면 상태
const ui = { tab: 'garden', tool: 'look', plantType: null, moveFrom: null, selected: null, mode: 'path', detailsOpen: false,
  shopQty: {}, cart: {}, shopFilter: true, selTile: null, storeSort: 'flower', dexTab: 'journal', fold: {}, sigs: {}, sheetOpen: false };
let feedbackTimer;
function feedback(msg, warn, action) {
  const snack = $('#snack'), top = $('#feedbackTop');
  clearTimeout(feedbackTimer);
  for (const el of [snack, top]) { el.hidden = true; el.innerHTML = ''; }
  if (!msg) return;
  const el = ui.tab === 'garden' ? snack : top;               // 정원은 지도 위 풍선, 다른 탭은 위쪽 줄
  el.innerHTML = `<span>${warn ? '⚠️' : '✓'} ${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  el.classList.toggle('warn', !!warn); el.hidden = false;
  const b = el.querySelector('button'); if (b) b.onclick = () => { el.hidden = true; action.fn(); };
  feedbackTimer = setTimeout(() => { el.hidden = true; }, action ? 7000 : 3500);
}
// 첫걸음 안내
const GUIDE_BASE = [['bought', '💐 화원에서 제철 꽃 사기'], ['planted', '🌰 빈 칸에 심기'], ['watered', '💧 목마른 꽃에 물 주기'], ['harvested', '🧺 꽃이 피면 수확하기'], ['sold', '🍵 차를 만들어 팔기']];
// P04-04: 꽃잠에 시작한 사람은 제다실 · 찻집부터 (시작 선물로 블렌딩 → 판매), 그다음 화원 · 정원
const GUIDE_GIFT = [['blended', '🫖 제다실에서 블렌딩'], ['sold', '🍵 찻집에서 판매'], ['bought', '💐 화원에서 제철 꽃 사기'], ['planted', '🌰 빈 칸에 심기'], ['watered', '💧 목마른 꽃에 물 주기'], ['harvested', '🧺 꽃이 피면 수확하기']];
// P04-05: 꽃잠에 시작한 사람은 화원이 닫혀 있으니 예약부터 (10-17)
const GUIDE_SLEEP = [['reserved', '🗓️ 화원에서 새해 꽃 예약하기'], ...GUIDE_BASE.slice(1)];
const guideList = () => st.starterGift ? GUIDE_GIFT : st.startedInSleep ? GUIDE_SLEEP : GUIDE_BASE;
function guideState() {
  const g0 = st.guide = st.guide || {};
  if (st.flowers.length) { g0.bought = true; g0.planted = true; }
  if (st.items.length) g0.bought = true;
  if (st.reservations.length || g0.bought) g0.reserved = true;   // 예약을 건너뛰고 월요일에 바로 사도 됨
  if (Object.keys(st.dex.petal || {}).length || Object.keys(st.dex.tea).length || (!st.starterGift && (st.petals.length || st.teas.length))) g0.harvested = true;   // 시작 선물 꽃잎은 수확으로 치지 않음
  return g0;
}
function guideSub(k, need) {
  const sub = t => `<small>${t}</small>`;
  if (k === 'watered') return sub(need.water ? '심은 꽃은 목말라요. 반짝이는 꽃을 누르고 꽃 둘레의 💧를 눌러요' : '목마른 꽃이 생기면 위 💧 숫자가 늘어요');
  if (k === 'harvested' && !need.harvest) return sub('꽃이 피면 노란 점이 생겨요');
  if (k === 'blended') return sub('🎁 시작 선물의 말린 꽃잎 두 가지를 골라 섞어요 · 캐모마일 + 장미 = 봄 들판');
  if (k === 'sold') return sub('블렌드를 🏷️ 티백으로 만들고, 찻집에서 🫖 우려 ☕ 찻잔을 💰 판매해요');
  if (k === 'bought' && E.calendar(st.virtual).frozen) return sub('월요일 아침 6시에 정원이 깨어나면 화원에서 살 수 있어요');
  if (k === 'planted' && E.calendar(st.virtual).frozen) return sub(st.reservations.some(r => !r.done) ? '월요일 아침 6시부터 예약한 꽃이 심을 때에 맞춰 창고로 와요' : '월요일 아침 6시에 정원이 깨어나면 심을 수 있어요');
  if (k === 'reserved') return sub(E.calendar(st.virtual).frozen ? '꽃잠엔 새해 꽃을 10% 싸게 미리 사 둬요 · 심을 때가 되면 창고로 와요' : '화원에서 제철 꽃을 사도 돼요');
  return '';
}
function track(kind) { if (kind) guideState()[kind] = true; }
function after(r, kind, action) {
  if (r) {
    let msg = r.msg;
    if (r.ok) {
      track(kind);
      const gd = guideState();
      if (!gd.celebrated && guideList().every(([k]) => gd[k])) { gd.celebrated = true; msg += ' · 첫걸음을 모두 마쳤어요 🎉'; }
    }
    feedback(msg, !r.ok, r.ok ? action : null);
  }
  E.checkJournal(st, ctx);
  save(); renderAll(true);
}

// ---------------------------------------------------------------- 짧은 알림 (P11-02-01)
const toastEl = $('#toast');
let toastPending = [], toastTimer = null, toastBusy = false;
function queueToast(text) { toastPending.push(text); if (!toastTimer) toastTimer = setTimeout(flushToast, 300); }
function flushToast() {
  toastTimer = null;
  if (toastBusy) { toastTimer = setTimeout(flushToast, 400); return; }
  if (!toastPending.length) return;
  const list = toastPending.splice(0);
  const many = list.length >= 2;                                                // P11-02-01-b
  showToast(many ? `새 소식 ${list.length}개 · 정원 일지에서 보기` : list[0], many ? 4000 : 3000);
}
function showToast(msg, ms) {
  toastBusy = true; toastEl.textContent = msg; toastEl.classList.add('show');
  setTimeout(() => { toastEl.classList.remove('show'); setTimeout(() => { toastBusy = false; if (toastPending.length) flushToast(); }, 300); }, ms);
}
toastEl.addEventListener('click', () => { toastEl.classList.remove('show'); openLog(); });

// ---------------------------------------------------------------- 위 막대
const SEASON_IC = ['🌸', '☀️', '🍁', '❄️', '🌙'];
const monthIc = m => SEASON_IC[m >= 3 && m <= 5 ? 0 : m >= 6 && m <= 8 ? 1 : m >= 9 && m <= 11 ? 2 : 3];   // 심는 달의 계절 이모지

// ---------------------------------------------------------------- 픽셀 설명 (글로 쓰던 설명을 도트 그림으로, 10-17)
const seasonOfIdx = i => Math.min(4, Math.floor(i / 3));
// 달 띠: 3월부터 꽃샘달까지 14칸. rows = [[아이콘, 이름, 달 배열, 색]], 빈 줄은 뺌. 지금 달은 테두리
function monthStrip(rows, nowIdx) {
  rows = rows.filter(r => r[2].length);
  const cell = (i, cls, c) => `<i class="${cls}${i === nowIdx ? ' now' : ''}" style="--c:${c}"></i>`;
  return `<div class="mstrip" role="img" aria-label="${rows.map(r => `${r[1]} ${monthsText(r[2])}`).join(', ')}"><span></span>`
    + MONTHS.map((m, i) => `<i class="ms-h${i === nowIdx ? ' now' : ''}" style="--c:${SEASON_COLOR[seasonOfIdx(i)]}">${MONTH_SHORT(m)}</i>`).join('')
    + rows.map(([ic, nm, arr, c]) => `<span class="ms-l">${ic}<small>${nm}</small></span>${MONTHS.map((m, i) => cell(i, arr.includes(m) ? 'on' : '', c)).join('')}`).join('')
    + '</div>';
}
const flowerStrip = (F, nowIdx) => monthStrip([['🌰', '심기', F.sow, 'var(--seed)'], ['🌸', '개화', F.bloom, F.petal], ['🌱', '번식', F.prop === '채종' ? [] : F.propMonths, 'var(--good)'], ['💤', '휴면', F.dormant, 'var(--muted)']], nowIdx);
// 온도·습도 막대: 20칸, 원하는 범위(±3)는 색칸, 지금 값은 ▲
function envGauge(ic, name, want, now, lo, hi, unit, c) {
  const N = 20, at = v => Math.max(0, Math.min(N - 1, Math.floor((v - lo) / (hi - lo) * N)));
  const a = at(want - 3), b = at(want + 3), n = now == null ? -1 : at(now), ok = now != null && Math.abs(now - want) <= 3;
  const fmt = v => unit === '°C' ? v.toFixed(1) : Math.round(v);
  return `<div class="gauge" role="img" aria-label="${name}: 원하는 ${want}${unit}${now != null ? `, 지금 ${fmt(now)}${unit}` : ''}"><span class="g-l">${ic} ${name}</span>`
    + `<span class="g-bar" style="--c:${c}">${Array.from({ length: N }, (_, i) => `<i class="${i >= a && i <= b ? 'band' : ''}${i === n ? ' here' : ''}"></i>`).join('')}</span>`
    + `<span class="g-v data">${now != null ? `<b class="${ok ? 'val-up' : 'val-down'}">${fmt(now)}</b> / ` : ''}${want}${unit}</span></div>`;
}
const envGauges = (F, tl) => envGauge('🌡️', '온도', F.t, tl ? tl.t : null, 0, 35, '°C', '#d9823b') + envGauge('💧', '습도', F.m, tl ? tl.m : null, 0, 100, '%', '#4788b5');
// 첫 안내: 한 주 = 한 해. 요일마다 낮(06–18시) · 밤(18–06시) 두 칸, 칸 색은 계절
function weekPixel(cal) {
  return `<div class="wkpx" role="img" aria-label="월요일 오전 6시 3월부터 일요일 꽃잠까지, 반나절마다 한 달"><span></span>${WEEKDAY.map((d, i) => `<b class="${i === 6 ? 'rest' : ''}">${d}</b>`).join('')}`
    + ['☀️', '🌙'].map((ic, half) => `<span class="wk-l">${ic}</span>${WEEKDAY.map((_, d) => { const i = d * 2 + half; return `<i class="${i === cal.idx ? 'now' : ''}" style="--c:${SEASON_COLOR[seasonOfIdx(i)]}">${MONTH_SHORT(MONTHS[i])}</i>`; }).join('')}`).join('')
    + '</div>';
}
// 첫 안내: 꽃 한 포기가 둘레 땅을 바꿈 (7×7, 가운데 캐모마일, 2칸 안은 초원)
function landPixel() {
  const F = FLOWERS.chamomile, L = LANDS[homeLand(F)];
  let html = '';
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.max(Math.abs(x), Math.abs(y));
    html += `<i style="background:${d <= 2 ? L.color : LANDS.barren.color};opacity:${d <= 2 ? 1 - d * 0.15 : 1}">${!x && !y ? spriteImg('chamomile', 'flower', 32, false, F.name) : ''}</i>`;
  }
  return `<div class="landpx" role="img" aria-label="${F.name} 둘레 2칸이 ${L.name}으로 바뀐 모습">${html}</div>`;
}
// ---------------------------------------------------------------- 도감일지 · 칭호 (P19, 10-17)
const TIER_NAME = { s: '🌱 새싹', f: '🌸 꽃', g: '👑 정원' };
const titleCache = {};
function titleURL(k, locked, frame) {
  const T = E.TITLES[k], f = T.tier === 'g' && !locked ? frame % 22 : 0, id = `${k}|${locked ? 1 : 0}|${f}`;
  if (titleCache[id]) return titleCache[id];
  const c = document.createElement('canvas'); c.width = c.height = TITLE_ART.SIZE;
  TITLE_ART.draw(c.getContext('2d'), k, T.tier, { locked, frame: f });
  return (titleCache[id] = c.toDataURL());
}
// 칭호 그림은 22px의 정수배로만 (P16-14)
const titleImg = (k, size, locked) => `<img class="px ttl-img" data-ttl="${k}" data-locked="${locked ? 1 : 0}" src="${titleURL(k, locked, 0)}" width="${size}" height="${size}" alt="${locked ? '아직 얻지 못한 칭호' : esc(E.TITLES[k].name)}">`;
let ttlFrame = 0;
setInterval(() => {   // 👑 정원 칭호: 반짝이가 번갈아 (보이는 그림만 0.4초마다 바꿈)
  ttlFrame++;
  document.querySelectorAll('img.ttl-img[data-locked="0"]').forEach(im => { if (E.TITLES[im.dataset.ttl].tier === 'g') im.src = titleURL(im.dataset.ttl, false, ttlFrame); });
}, 400);
// abs(달 번호) → "1년차 5월" (0년차는 "첫 해 전")
const absText = abs => { const y = Math.floor(abs / 14) - st.firstWeek + 1; return `${y < 1 ? '첫 해 전' : `${y}년차`} ${monthName(MONTHS[abs % 14])}`; };
// 퀘스트 그림: 그 꽃 · 땅 색 칸 · 찻잔
const QART = {
  c0_visit: ['form', 'chamomile'],
  c1_bloom: ['flower', 'chamomile'], c1_petal: ['petal', 'chamomile'], c1_dry: ['dried', 'chamomile'], c1_bag: ['teabag', 'chamomile'], c1_land: ['land', 'grassland'], c1_sell: ['tea', 'chamomile'],
  c2_foothill: ['land', 'foothill'], c2_med: ['land', 'med'], c2_sub: ['land', 'subtropic'], c2_trop: ['land', 'tropical'], c2_edge: ['land', 'mossy'],
  c3_root: ['form', 'lotus'], c3_bloom: ['flower', 'lotus'], c3_pond: ['land', 'pond'], c3_wet: ['land', 'wetland'], c3_sell: ['tea', 'lotus'],
  c4_spring: ['tea', 'chamomile'], c4_sleep: ['tea', 'lavender'], c4_violet: ['tea', 'bpea'], c4_five: ['dried', 'rose'], c4_bag: ['teabag', 'rose'],
  c5_guest: ['tea', 'rose'], c5_warm: ['tea', 'jasmine'], c5_hat: ['tea', 'lotus'], c5_blend: ['tea', 'hibiscus'], c5_five: ['tea', 'gamguk'],
  c6_dongbaek: ['flower', 'dongbaek'], c6_maehwa: ['flower', 'maehwa'], c6_napmae: ['flower', 'napmae'], c6_plum: ['tea', 'maehwa'],
};
const questArt = q => { const [k, v] = QART[q.key]; return k === 'land' ? `<span class="q-land" style="background:${LANDS[v].color}"></span>` : spriteImg(v, k, 32, false, ''); };
// 언제 할 수 있는지 (P19-04-03): 화원에 들어오는 달 · 심어 둔 꽃이 피는 달 · 찻집 여는 달
function questWhen(q, cal) {
  const w = q.when;
  if (!w) return { now: true };
  if (w === 'cafe') return E.teaShopOpen(cal) ? { now: true } : { now: false, label: `${SEASON_IC[3]} 12월부터` };
  const F = FLOWERS[w.sow || w.bloom];
  const next = test => { const n = E.untilMonth(st.virtual, c => !c.frozen && test(c)); return n ? `${monthIc(n.cal.month)} ${monthName(n.cal.month)}부터` : ''; };
  if (w.bloom && st.flowers.some(f => f.type === F.key && !f.withered)) return F.bloom.includes(cal.month) && !cal.frozen ? { now: true } : { now: false, label: next(c => F.bloom.includes(c.month)).replace('부터', '에 펴요') };
  if (st.items.some(it => it.type === F.key) || (!cal.frozen && F.sow.includes(cal.month))) return { now: !cal.frozen, label: next(() => true) };
  return { now: false, label: next(c => F.sow.includes(c.month)) };
}
// 다음에 할 퀘스트: 열린 장에서 지금 할 수 있는 것 먼저, 없으면 첫 번째
function nextQuest(cal) {
  const pend = [];
  for (const c of E.CHAPTERS) if (E.chapterOpen(st, c.key)) for (const q of c.quests) if (st.journal.done[q.key] == null) pend.push({ c, q, w: questWhen(q, cal) });
  return pend.find(p => p.w.now) || pend[0] || null;
}
const hiddenBlendOf = tk => Object.keys(E.BLENDS).find(b => E.BLENDS[b].hidden === tk) || null;
function journalHTML() {
  const cal = E.calendar(st.virtual), done = st.journal.done, got = E.TITLE_KEYS.filter(k => st.titles[k] != null).length;
  // 한 페이지에 🏅 칭호 → 📜 퀘스트 순서로 (10-17, 예전엔 두 화면으로 나눔)
  const qDone = E.QUESTS.filter(q => done[q.key] != null).length;
  const head = (id, ic, title, n, total) => `<div class="cab-head dex-head j-head" id="${id}"><span class="sb-title">${ic} ${title}</span><span class="dh-count data">${n} / ${total}</span></div>`;
  // 열린 장은 펼쳐 두고, 닫힌 장은 아래에 접어 둠 (10-17)
  const chs = E.CHAPTERS.map(c => ({ c, open: E.chapterOpen(st, c.key) })), closed = chs.filter(x => !x.open);
  const card = c => {
    const open = E.chapterOpen(st, c.key), n = c.quests.filter(q => done[q.key] != null).length, tk = c.title, has = st.titles[tk] != null, hb = hiddenBlendOf(tk);
    const lockMsg = c.key === 'c1' ? '🌱 첫걸음을 마치면 열려요' : c.key === 'c6' ? '🌳 나무는 오래 걸려서 2년차 3월에 열려요 · 첫해에 심어 두세요' : '1장 첫 꽃밭을 마치면 열려요';
    const rows = open ? c.quests.map(q => {
      const d = done[q.key], w = d != null ? null : questWhen(q, cal);
      const state = d != null ? `<span class="q-st">🔖 ${absText(d)}</span>` : w.now ? '<span class="q-st">지금 할 수 있어요</span>' : `<span class="q-st">${w.label || '때가 되면'}</span>`;
      return `<button type="button" class="q-row ${d != null ? 'done' : w.now ? 'now' : 'later'}" data-qgo="${q.go}"><span class="q-art">${questArt(q)}</span><span class="q-name">${q.name}</span>${state}</button>`;
    }).join('') : '';
    return `<div class="card jch ${open ? '' : 'closed'} ${has ? 'cleared' : ''}">
      <div class="jch-head">${titleImg(tk, 44, !has)}<div class="jch-t"><small>${c.no}장</small><b>${c.name}</b><span class="jch-stamps" aria-label="${n} / ${c.quests.length}">${c.quests.map(q => `<i class="${done[q.key] != null ? 'on' : ''}"></i>`).join('')}</span></div><span class="data jch-n">${n} / ${c.quests.length}</span></div>
      ${open ? `<div class="q-list">${rows}</div>` : `<p class="note">${lockMsg}</p>`}
      <div class="jch-reward">🏅 ${has ? `<b>${E.TITLES[tk].name}</b> 칭호를 얻었어요` : `마치면 칭호 「${E.TITLES[tk].name}」`}${hb ? ` · 📖 숨은 레시피${has ? ` 「${E.BLENDS[hb].name}」` : ''}` : ''}</div></div>`;
  };
  const openHTML = chs.filter(x => x.open).map(x => card(x.c)).join('');
  return head('jTitles', '🏅', '칭호', got, E.TITLE_KEYS.length) + titlesHTML()
    + head('jQuests', '📜', '퀘스트', qDone, E.QUESTS.length)
    + (openHTML || '<p class="note">🌱 첫걸음을 마치면 1장이 열려요.</p>')
    + (closed.length ? foldBox('j-closed', `아직 열리지 않은 장 ${closed.length}개`, `<div class="stack">${closed.map(x => card(x.c)).join('')}</div>`) : '');
}
function titlesHTML() {
  // 얻은 칭호는 펼쳐 두고, 못 얻은 칭호는 접어 둠 (10-17)
  const has = E.TITLE_KEYS.filter(k => st.titles[k] != null), not = E.TITLE_KEYS.filter(k => st.titles[k] == null);
  return `<p class="note">칭호를 하나 골라 대표로 걸면 위 막대에 보여요. 숨은 칭호는 수수께끼를 풀어 보세요.</p>`
    + (has.length ? `<div class="ttl-grid">${has.map(titleCard).join('')}</div>` : '<p class="note">아직 얻은 칭호가 없어요. 아래 📜 퀘스트의 장을 마치면 얻어요.</p>')
    + (not.length ? foldBox('t-locked', `아직 얻지 못한 칭호 ${not.length}개`, `<div class="ttl-grid">${not.map(titleCard).join('')}</div>`) : '');
}
// 접기 상자: 펼친 상태는 다시 그려도 유지 (ui.fold)
const foldBox = (key, label, inner) => `<details class="fold" data-fold="${key}"${ui.fold[key] ? ' open' : ''}><summary>${label}</summary>${inner}</details>`;
// 도감 칸 묶음: 모은 칸은 그대로, 못 모은 칸(.locked)은 접기 상자로
function foldGrid(key, gridHTML) {   // 티백 · 차처럼 그리드가 여럿(꽃 + 블렌드)이어도 그리드마다 나눔
  const t = document.createElement('template'); t.innerHTML = gridHTML.trim();
  let shown = '', folded = '', n = 0;
  for (const el of [...t.content.children]) {
    const off = el.classList.contains('dexgrid') ? [...el.children].filter(c => c.classList.contains('locked')) : [];
    off.forEach(c => c.remove()); n += off.length;
    if (!off.length || el.children.length) shown += el.outerHTML;
    if (off.length) folded += `<div class="${el.className}">${off.map(c => c.outerHTML).join('')}</div>`;
  }
  return n ? shown + foldBox(key, `아직 못 모은 ${n}칸`, `<div class="stack" style="gap:8px">${folded}</div>`) : gridHTML;
}
function titleCard(k) {
  const T = E.TITLES[k], has = st.titles[k] != null, hidden = !T.chapter, ch = T.chapter && E.CHAPTERS.find(c => c.key === T.chapter), on = st.titleOn === k;
  const sub = has ? `${hidden ? `${T.cond} · ` : ''}${absText(st.titles[k])}` : hidden ? `“${T.hint}”` : `${ch.no}장 ${ch.name}을 마치면`;
  return `<div class="ttl-card t-${T.tier} ${has ? '' : 'locked'} ${on ? 'on' : ''}">${titleImg(k, 66, !has)}<b>${has || !hidden ? T.name : '???'}</b><span class="ttl-tier">${TIER_NAME[T.tier]}${hidden ? ' · 숨은 칭호' : ''}</span><small>${sub}</small>${has ? `<button type="button" class="btn small" data-ttlon="${on ? '' : k}">${on ? '대표 내리기' : '대표로 걸기'}</button>` : ''}</div>`;
}
// 얻을 때 연출 (P19-05-06): 문장이 위에서 아래로 한 줄씩 그려진 뒤 테두리가 켜짐
function showNewTitles() {
  if (!st._newTitles || !st._newTitles.length || $('#modalRoot').innerHTML) return;
  const k = st._newTitles.shift(), T = E.TITLES[k], ch = T.chapter && E.CHAPTERS.find(c => c.key === T.chapter), hb = hiddenBlendOf(k);
  openModal('🏅 새 칭호', `<div class="ttl-pop t-${T.tier}"><canvas width="22" height="22" id="ttlAnim" class="ttl-anim" role="img" aria-label="${esc(T.name)} 칭호 문장"></canvas>
    <b>${T.name}</b><span class="ttl-tier">${TIER_NAME[T.tier]}${T.chapter ? '' : ' · 숨은 칭호'}</span><small>${ch ? `${ch.no}장 ${ch.name}을 마쳤어요` : T.cond}</small>
    ${hb ? `<p class="note">📖 숨은 레시피 「${E.BLENDS[hb].name}」이(가) 제다실 레시피에 생겼어요</p>` : ''}</div>`,
    [{ label: '닫기', act: () => { closeModal(); save(); showNewTitles(); } }, { label: '대표로 걸기', primary: true, act: () => { E.setTitleOn(st, k); closeModal(); save(); renderAll(true); } }]);
  const x = $('#ttlAnim').getContext('2d'); let r = 0;
  const tick = () => { if (!$('#ttlAnim')) return; TITLE_ART.draw(x, k, T.tier, { rows: r }); if (r++ < 16) setTimeout(tick, 38); };
  tick();
  save();
}
// 상태창 "오늘의 한 마디" (게임을 위해 새로 쓴 문장)
const GARDEN_WORDS = [
  '꽃은 서두르지 않아요. 그래도 늘 제때 피어요.',
  '오늘 심은 씨앗은 오늘의 나를 믿는다는 뜻이에요.',
  '천천히 자라는 것도 자라는 거예요.',
  '꽃이 핀 자리에는 누군가의 기다림이 있어요.',
  '물을 주는 동안, 마음도 함께 촉촉해져요.',
  '시든 꽃도 땅에 돌아가 다음 꽃을 키워요.',
  '작은 새싹 하나가 땅의 빛깔을 바꿔요.',
  '바람이 부는 날에도 뿌리는 조용히 자라요.',
  '모든 꽃이 봄에 피지는 않아요. 저마다의 계절이 있어요.',
  '쉬어 가는 날의 정원도 여전히 아름다워요.',
  '오늘 거둔 꽃잎 한 장이 내일의 차 한 잔이 돼요.',
  '흙을 만지면 마음이 낮고 따뜻해져요.',
  '피지 않은 꽃봉오리에도 이미 향기가 있어요.',
  '잡초를 뽑는 시간은 마음을 고르는 시간이에요.',
  '빈 땅은 비어 있는 게 아니라 기다리고 있는 거예요.',
  '꽃은 남과 견주지 않고, 그저 자기 빛깔로 피어요.',
  '한 해를 돌보면, 정원이 나를 기억해요.',
  '느리게 걷는 사람만 보이는 꽃이 있어요.',
  '겨울에 피는 꽃은 추위 속에서도 다정해요.',
  '오늘 하루도 정원과 함께 잘 지냈어요.',
  '햇살 한 줌, 물 한 모금이면 충분할 때가 있어요.',
  '꽃이 지는 건 끝이 아니라 씨앗이 되는 시간이에요.',
  '좋아하는 꽃 곁에는 좋아하는 땅이 생겨요.',
  '잠든 정원도 꿈속에서 봄을 준비해요.',
];
// 달마다 제철 꽃의 꽃말과 한 마디 (10-06). 꽃말은 흔히 알려진 것, own: true는 널리 알려진 꽃말이 없어 정원에서 붙인 것
const FLOWER_WORDS = {
  maehwa: { lang: '고결한 마음 · 인내', words: ['추위가 다 가시지 않아도 매화는 피어요. 오늘의 나도 충분히 피어날 수 있어요.', '기다림을 견딘 꽃이 가장 먼저 봄을 알려요.'] },
  chamomile: { lang: '역경 속의 힘', words: ['밟혀도 다시 일어서는 캐모마일처럼, 오늘의 나도 다시 피어나요.', '힘든 날에도 작은 꽃은 사과 향을 잃지 않아요.'] },
  rose: { lang: '사랑 · 아름다움', words: ['나를 아끼는 마음도 사랑이에요. 오늘은 나에게 장미 한 송이를.', '가시가 있어도 장미는 아름다워요. 모난 마음도 나의 일부예요.'] },
  lavender: { lang: '기다림 · 내게 대답해 주세요', words: ['대답이 늦어도 괜찮아요. 라벤더는 조용히 기다리며 향을 남겨요.', '말없이 곁에 있어 주는 것도 다정한 대답이에요.'] },
  lotus: { lang: '깨끗한 마음', words: ['흙탕물 속에서도 연꽃은 맑게 피어요. 내 마음도 다시 맑아질 수 있어요.', '흐린 날을 지나온 마음이 가장 깨끗하게 피어요.'] },
  jasmine: { lang: '상냥함 · 사랑스러움', words: ['작은 상냥함 하나가 하루를 향기롭게 해요.', '밤에 더 짙어지는 재스민처럼, 어두운 날에도 나의 다정함은 남아 있어요.'] },
  bpea: { lang: '새로운 빛깔', own: true, words: ['레몬 한 방울에 파랑이 보라로 바뀌듯, 작은 일 하나로 하루가 달라져요.'] },
  marigold: { lang: '반드시 오고야 말 행복', words: ['행복은 늦게 와도 반드시 와요. 메리골드가 그렇게 말해요.', '오늘이 흐려도 괜찮아요. 금빛 꽃은 가을까지 피어 있어요.'] },
  hibiscus: { lang: '섬세한 아름다움', words: ['섬세한 마음은 약한 게 아니라 아름다운 거예요.', '하루만 피는 꽃도 온 힘을 다해 붉어요.'] },
  celosia: { lang: '건강 · 시들지 않는 사랑', words: ['몸과 마음이 건강한 것, 그게 가장 큰 꽃이에요.', '맨드라미는 말라도 빛깔이 남아요. 진심도 그래요.'] },
  gamguk: { lang: '성실 (국화)', words: ['늦가을에 피는 꽃은 서두르지 않았을 뿐이에요.', '찬 서리에도 감국은 노랗게 웃어요. 성실한 하루는 빛이 나요.'] },
  dongbaek: { lang: '누구보다 그대를 사랑합니다', words: ['가장 추운 날 피는 꽃이 가장 따뜻한 마음을 전해요.', '동백은 꽃송이째 떨어져요. 끝까지 나답게 살아도 괜찮아요.'] },
  napmae: { lang: '자애', words: ['한겨울의 노란 꽃처럼, 나에게 먼저 다정해지기로 해요.', '추운 날에도 향은 멀리 가요. 작은 친절도 그래요.'] },
};
// 달마다 제철 꽃 (게임에서 그달에 피는 꽃 위주, 4월은 심는 철인 캐모마일, 꽃잠은 겨울 꽃)
const MONTH_FLOWERS = { 3: ['maehwa'], 4: ['chamomile'], 5: ['rose', 'chamomile'], 6: ['lavender', 'rose'], 7: ['lotus', 'jasmine', 'bpea'], 8: ['marigold', 'jasmine', 'lotus'], 9: ['marigold', 'hibiscus', 'celosia'], 10: ['celosia', 'gamguk', 'hibiscus'], 11: ['gamguk', 'celosia'], 12: ['dongbaek'], 1: ['napmae', 'dongbaek'], 2: ['maehwa', 'napmae', 'dongbaek'], 13: ['napmae'], 14: ['maehwa'] };
function monthWord(cal) {          // 그달 꽃들의 한 마디를 게임 하루(현실 48분)마다 돌아가며
  const list = (MONTH_FLOWERS[cal.month] || []).flatMap(k => FLOWER_WORDS[k].words.map(w => ({ k, w })));
  return list.length ? list[(cal.day - 1) % list.length] : null;
}
function renderTop() {
  const cal = E.calendar(st.virtual);
  const info = yearInfo(cal), ti = $('#topInfo'); if (ti.textContent !== info) ti.textContent = info;
  const tt = $('#topTitle'), tk = st.titleOn || '';   // P19-05-05 대표 칭호
  if (tt.dataset.k !== tk) { tt.dataset.k = tk; tt.hidden = !tk; tt.innerHTML = tk ? `${titleImg(tk, 22, false)}<span>${E.TITLES[tk].name}</span>` : ''; }
  if (document.documentElement.dataset.season !== String(cal.season)) { document.documentElement.dataset.season = cal.season; requestAnimationFrame(() => document.documentElement.classList.add('season-anim')); }   // 계절 바탕색
}

// ---------------------------------------------------------------- 탭 (P16-02)
document.querySelectorAll('nav.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#brandBtn').addEventListener('click', () => { setTab('garden'); window.scrollTo({ top: 0, behavior: 'smooth' }); });   // 상단 로고 → 정원 (10-17)
$('#topTitle').addEventListener('click', () => { ui.dexTab = 'journal'; setTab('dex'); });
$('#restBanner').addEventListener('click', e => { if (e.target.closest('[data-rest="close"]')) { ui.restClosed = true; $('#restBanner').hidden = true; } });
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]'); if (!go) return;
  if (go.dataset.go === 'rec') { ui.dexTab = 'rec'; return setTab('dex'); }
  setTab(go.dataset.go);
});
function setTab(t, keepTool) {
  ui.tab = t;
  if (t === 'garden' && !keepTool) { ui.tool = 'look'; ui.moveFrom = null; }   // 정원은 늘 관찰에서 시작
  document.querySelectorAll('nav.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  ui.sigs = {};
  $('#feedbackTop').hidden = true; $('#snack').hidden = true; $('#tip').hidden = true;
  renderAll(true);
  if (t === 'garden') resize();
}

// ---------------------------------------------------------------- 정원: 도구 (P13)
const TOOL_GROUPS = [
  [{ id: 'look', ic: '🔍', label: '관찰' }],
  [{ id: 'water', ic: '💧', label: '물' }, { id: 'weed', ic: '🌿', label: '잡초' }, { id: 'prune', ic: '✂️', label: '가지치기' }, { id: 'fert', ic: '🌱', label: '비료' }, { id: 'harvest', ic: '🧺', label: '수확' }],
];
const BATCH = ['water', 'weed', 'prune', 'fert', 'harvest'];
const HINT = {
  look: '꽃을 누르면 꽃 둘레에서 돌보기를, 상태창에서 옮겨심기·번식을, 빈 칸을 누르면 심기를 할 수 있어요.',
  plant: '위에서 심을 꽃을 고른 뒤, 빈 칸을 누르세요.',
  water: '목마른 꽃을 눌러 물을 줘요. 한 번 주면 2달(현실 하루) 동안 괜찮아요.',
  weed: '잡초 난 꽃을 눌러 잡초를 뽑아요. 2달(현실 하루) 동안 괜찮아요. 뽑은 잡초는 비료가 돼요.',
  prune: '나무와 덤불(장미, 라벤더, 재스민, 동백, 매화, 납매)의 가지를 쳐요. 1달 동안 품질이 올라요.',
  fert: '꽃이 있는 칸에 비료를 뿌려요. 1달 동안 품질이 오르고, 품질이 오르면 땅이 넓어져요.',
  harvest: '노란 점이 있는 꽃(개화)에서 꽃잎을 거둬 제다실에 넣어요. 한 달에 한 번이에요.',
  prop: '다 자란 꽃을 눌러 번식해요. 꽃마다 할 수 있는 달이 정해져 있고, 한 해에 한 번이에요.',
  move: '옮길 꽃을 누른 다음, 빈 칸을 누르세요. 심는 기간이나 휴면기에 할 수 있어요.',
};
function plantable() {
  const cal = E.calendar(st.virtual), by = {};
  if (cal.frozen) return by;
  for (const it of st.items) {
    if (E.germOf(it) <= 0 || !FLOWERS[it.type].sow.includes(cal.month)) continue;
    by[it.type] = (by[it.type] || 0) + 1;
  }
  return by;
}
function careNeed(cal) {
  const need = { water: 0, weed: 0, prune: 0, harvest: 0, fert: 0 };
  if (cal.frozen) return need;
  for (const f of st.flowers) if (!f.withered) for (const t in need) if (E.canCare(st, f, t, cal)) need[t]++;
  return need;
}
// 돌봄 색 (아이콘 색에 맞춤): 물 파랑, 잡초 초록, 가지치기 분홍, 비료 갈색, 수확 노랑
const CARE_COLOR = { water: '#3d8fd6', weed: '#4f9a3a', prune: '#d4466e', fert: '#9a6a3a', harvest: '#d08a12' };
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const NEEDS = [['water', '💧', '목마른 꽃'], ['weed', '🌿', '잡초 난 꽃'], ['prune', '✂️', '가지 칠 수 있는 꽃'], ['fert', '🌱', '비료 줄 수 있는 꽃'], ['harvest', '🧺', '꽃이 핀 꽃']];
function renderToolbar(force) {
  const pl = plantable(), cal = E.calendar(st.virtual), need = careNeed(cal);
  const sig = JSON.stringify([ui.tool, ui.plantType, ui.moveFrom, st.fert, pl, cal.frozen, need]);
  if (!force && ui.sigs.toolbar === sig) return;
  ui.sigs.toolbar = sig;
  if (ui.tool === 'plant' && ui.plantType && !pl[ui.plantType]) ui.plantType = null;   // 다 심으면 다시 "선택 안 함"
  const needSum = NEEDS.reduce((a, [k]) => a + need[k], 0);   // 칩 앞에 한마디: 돌볼 게 있으면 "누르면 반짝", 없으면 쉬어도 된다고
  $('#needs').innerHTML = `<span class="nd-say">${cal.frozen ? '🌙 꽃들이 자는 중' : needSum ? '돌볼 꽃 · 누르면 반짝여요' : '🌿 지금은 돌볼 꽃이 없어요'}</span>` + NEEDS.map(([k, ic, nm]) => `<button type="button" class="nd ${need[k] ? 'on' : ''}" style="--k:${CARE_COLOR[k]}" data-flash="${k}" title="${nm} ${need[k]}포기 · 눌러서 찾기"><span>${ic}</span><b>${need[k]}</b></button>`).join('');
  const tray = $('#tray');
  if (ui.tool === 'plant') {
    const keys = Object.keys(pl);
    tray.hidden = false;
    tray.innerHTML = keys.length ? `<button type="button" class="seedchip none" data-seed="" aria-pressed="${!ui.plantType}">선택 안 함</button>` + keys.map(k => {
      const F = FLOWERS[k], best = Math.max(...st.items.filter(i => i.type === k && E.germOf(i) > 0).map(i => i.q));
      return `<button type="button" class="seedchip" data-seed="${k}" aria-pressed="${ui.plantType === k}"><span class="dot" style="background:${F.petal}"></span>${F.name} ${FORM[F.form].name} <span class="data">×${pl[k]}</span> <span class="stars" style="font-size:11px">★${E.stars(best)}</span></button>`;
    }).join('') + '<button type="button" class="btn small" data-act="endMode">✓ 심기 끝</button>'
      : `<span class="muted" style="font-size:13px">${cal.frozen ? '꽃잠에는 심을 수 없어요.' : '지금 심을 수 있는 게 창고에 없어요.'}</span> <button type="button" class="btn small primary" data-go="shop">💐 화원</button> <button type="button" class="btn small" data-act="endMode">닫기</button>`;
  } else if (ui.tool === 'move') {
    tray.hidden = false;
    tray.innerHTML = '<span class="muted" style="font-size:13px">↔ 옮겨 심는 중이에요</span><button type="button" class="btn small" data-act="endMode">취소</button>';
  } else { tray.hidden = true; tray.innerHTML = ''; }
  renderHint();
}
$('#needs').addEventListener('click', e => {
  const b = e.target.closest('[data-flash]'); if (!b) return;
  const t = b.dataset.flash, nm = NEEDS.find(n => n[0] === t)[2];
  if (!careNeed(E.calendar(st.virtual))[t]) return feedback(`지금은 ${nm}이 없어요`);
  ui.flash = { t, until: performance.now() + 2400 };
});
// 안내 문구는 심기·옮겨 심기 중일 때만 (평소 설명은 상태창과 첫걸음 안내에 있음)
function renderHint() {
  let msg = '';
  if (E.calendar(st.virtual).frozen) msg = '';      // 꽃잠은 지도 가운데 팝업이 알려 줌
  else if (ui.tool === 'plant') msg = ui.plantType ? `${josa(FLOWERS[ui.plantType].name, '을/를')} 심을 빈 칸을 누르세요` : HINT.plant;
  else if (ui.tool === 'move') { const f = ui.moveFrom && st.flowers.find(x => x.id === ui.moveFrom); msg = f ? `${josa(FLOWERS[f.type].name, '을/를')} 옮길 빈 칸을 누르세요` : HINT.move; }
  $('#hint').textContent = msg;
  $('#hint').hidden = !msg;
}
$('#tray').addEventListener('click', e => {
  if (e.target.closest('[data-act="endMode"]')) { ui.tool = 'look'; ui.moveFrom = null; renderToolbar(true); renderEmpty(true); return; }
  const b = e.target.closest('[data-seed]'); if (!b) return;
  ui.plantType = b.dataset.seed && b.dataset.seed !== ui.plantType ? b.dataset.seed : null; renderToolbar(true);   // 다시 누르면 선택 풀기
});
// ---------------------------------------------------------------- 정원: 지도 그리기
const canvas = $('#map'), g = canvas.getContext('2d');
let cell = 20, dpr = 1, hover = null, drag = null;
const shade = Array.from({ length: W * H }, (_, i) => (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.07);
function resize() {
  const w = canvas.parentElement.clientWidth; if (!w) return;
  dpr = window.devicePixelRatio || 1; cell = w / W;
  canvas.style.height = cell * H + 'px';
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(cell * H * dpr);
}
new ResizeObserver(resize).observe(canvas.parentElement);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const LCOL = Object.fromEntries(LAND_KEYS.map(k => [k, hex(LANDS[k].color)]));
function tileColor(i) {
  const tl = st.tiles[i], bare = LCOL.barren, target = LCOL[E.classify(tl.t, tl.m)];
  const a = Math.min(1, Math.max(0, (tl.life - 0.1) / (E.LIFE_MIN + 0.15 - 0.1)));
  const sh = 1 + shade[i];
  return `rgb(${[0, 1, 2].map(j => Math.round((bare[j] + (target[j] - bare[j]) * a) * sh)).join(',')})`;
}
function ell(x, y, rx, ry, rot, fill) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7); g.fill(); }
function drawFlower(f, cal) {
  const F = FLOWERS[f.type], cx = (f.x + 0.5) * cell, cy = (f.y + 0.5) * cell, R = cell * 0.46;
  g.save(); g.translate(cx, cy);
  // 심은 칸 받침: 옅은 흙빛 동그라미 — 땅 색 위에서도 꽃이 잘 보이게 (10-06)
  g.fillStyle = 'rgba(255,248,236,.42)'; g.strokeStyle = 'rgba(90,70,50,.22)'; g.lineWidth = Math.max(1, cell * 0.04);
  g.beginPath(); g.ellipse(0, R * 0.12, R * 0.98, R * 0.9, 0, 0, 7); g.fill(); g.stroke();
  switch (f.stage) {
    case 'germ': ell(0, 0, R * 0.22, R * 0.15, 0, '#5b4632'); break;
    case 'sprout': ell(-R * 0.2, 0, R * 0.25, R * 0.12, -0.5, '#3f8a3a'); ell(R * 0.2, 0, R * 0.25, R * 0.12, 0.5, '#3f8a3a'); break;
    case 'withered':
      g.strokeStyle = '#6e5a43'; g.lineWidth = Math.max(1, cell * 0.07); g.lineCap = 'round';
      g.beginPath(); g.moveTo(-R * 0.4, R * 0.3); g.quadraticCurveTo(0, -R * 0.5, R * 0.45, R * 0.2); g.moveTo(0, R * 0.4); g.lineTo(-R * 0.1, -R * 0.15); g.stroke(); break;
    case 'dormant':
      g.strokeStyle = '#6b5440'; g.lineWidth = Math.max(1, cell * 0.06); g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.45; g.beginPath(); g.moveTo(0, R * 0.35); g.lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6 + R * 0.1); g.stroke(); }
      break;
    case 'young': case 'mature': {
      const s = f.stage === 'young' ? 0.55 : 0.8;
      ell(R * 0.08, R * 0.1, R * s, R * s * 0.9, 0, 'rgba(0,0,0,.15)');
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ell(Math.cos(a) * R * s * 0.4, Math.sin(a) * R * s * 0.4, R * s * 0.5, R * s * 0.35, a, i % 2 ? '#3d7f3a' : '#4d9445'); }
      break;
    }
    case 'bloom': {
      const picked = f.harvestKey === cal.abs, open = picked ? 0.6 : 1;
      ell(R * 0.08, R * 0.12, R * 0.95, R * 0.85, 0, 'rgba(0,0,0,.16)');
      if (F.look === 'lotus') { g.fillStyle = '#3c7d4a'; g.beginPath(); g.arc(0, 0, R * 0.95, 0.5, Math.PI * 2 - 0.1); g.lineTo(0, 0); g.fill(); }
      else for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; ell(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, R * 0.38, R * 0.22, a, '#467f3d'); }
      if (F.look === 'spike') {
        for (let s = -1; s <= 1; s++) for (let j = 0; j < F.n; j++) ell(s * R * 0.35, R * 0.45 - j * R * 0.14 * open, R * 0.11, R * 0.08, 0, j % 2 ? F.petal : F.center);
      } else if (F.look === 'rose') {
        // 꽃잎 5장 + 안쪽 4장 + 가운데 (10-06: 예전엔 동그라미 세 겹이라 꽃으로 안 보였음)
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) { g.save(); g.rotate(i / 5 * Math.PI * 2 + f.x); g.fillStyle = F.petal; g.beginPath(); g.ellipse(0, -R * 0.4 * open, R * 0.34 * open, R * 0.3 * open, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
        for (let i = 0; i < 4; i++) { g.save(); g.rotate(i / 4 * Math.PI * 2 + 0.6 + f.y); g.fillStyle = F.center; g.beginPath(); g.ellipse(0, -R * 0.17 * open, R * 0.2 * open, R * 0.15 * open, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
        g.fillStyle = F.look === 'rose' && F.key === 'dongbaek' ? '#f2c94c' : F.petal; g.beginPath(); g.arc(0, 0, R * 0.1 * open, 0, 7); g.fill();
      } else {
        const len = { daisy: 0.55, star: 0.5, round: 0.5, lotus: 0.7 }[F.look], wid = { daisy: 0.13, star: 0.14, round: 0.3, lotus: 0.24 }[F.look];
        g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 0.8;
        for (let i = 0; i < F.n; i++) {
          g.save(); g.rotate(i / F.n * Math.PI * 2 + f.x);
          g.fillStyle = F.petal; g.beginPath(); g.ellipse(0, -R * len * 0.62 * open, R * wid * open, R * len * 0.6 * open, 0, 0, 7); g.fill(); g.stroke();
          g.restore();
        }
        g.fillStyle = F.center; g.beginPath(); g.arc(0, 0, R * (F.look === 'daisy' ? 0.26 : 0.14), 0, 7); g.fill();
      }
      if (!picked && !cal.frozen) { g.fillStyle = '#ffd84a'; g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(0, -R * 0.95, Math.max(2, R * 0.14), 0, 7); g.fill(); g.stroke(); }
      break;
    }
  }
  g.restore();
}
// P13-06-02: 돌봄이 필요한 꽃(물·잡초)에 "!" 말풍선 하나. 무엇이 필요한지는 꽃을 눌러 상태창에서
function drawMarks(f, cal) {
  if (cal.frozen || f.withered) return;
  if (!E.canCare(st, f, 'water', cal) && !E.canCare(st, f, 'weed', cal)) return;
  const r = Math.max(8, cell * 0.26), cx = f.x * cell + cell - r * 0.75, cy = f.y * cell + r * 0.75;
  g.save();
  g.beginPath(); g.moveTo(cx - r * 0.5, cy + r * 0.7); g.lineTo(cx - r * 0.9, cy + r * 1.35); g.lineTo(cx + r * 0.1, cy + r * 0.85); g.closePath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = '#fffaf2'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3; g.fill();
  g.shadowBlur = 0; g.lineWidth = 1.5; g.strokeStyle = '#b8456b'; g.stroke();
  g.fillStyle = '#b8456b'; g.font = `bold ${Math.round(r * 1.4)}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', cx, cy + r * 0.05);
  g.restore();
}
function dragTiles() {
  if (!drag) return [];
  if (ui.mode === 'rect') {
    const out = [], [x1, y1] = drag.start, [x2, y2] = drag.cur;
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) out.push([x, y]);
    return out;
  }
  return [...drag.path.values()];
}
function draw() {
  if (!canvas.width) return;
  updateRing();
  const cal = E.calendar(st.virtual);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, tl = st.tiles[i];
    g.fillStyle = tileColor(i);
    g.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
    if (tl.life > E.LIFE_MIN && E.classify(tl.t, tl.m) === 'pond') {
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
      g.beginPath(); g.arc((x + 0.5) * cell, (y + 0.55) * cell, cell * 0.22, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
  }
  g.fillStyle = ['rgba(255,190,210,.06)', 'rgba(255,220,120,.05)', 'rgba(220,140,60,.07)', 'rgba(215,232,255,.16)', 'rgba(0,0,0,0)'][cal.season];
  g.fillRect(0, 0, W * cell, H * cell);
  // P05-01: 낮과 밤, 꽃잠에는 새벽빛으로 멈춤
  if (cal.frozen) { g.fillStyle = 'rgba(150,140,200,.22)'; g.fillRect(0, 0, W * cell, H * cell); g.fillStyle = 'rgba(255,200,190,.10)'; g.fillRect(0, 0, W * cell, H * cell * 0.4); }
  else if ((st.speed || 1) <= 60) {
    const h = cal.hour, night = h < 5 || h >= 20 ? 1 : h < 7 ? (7 - h) / 2 : h >= 18 ? (h - 18) / 2 : 0;
    if (night > 0) { g.fillStyle = `rgba(14,22,52,${0.18 * night})`; g.fillRect(0, 0, W * cell, H * cell); }
  }
  for (const f of st.flowers) drawFlower(f, cal);
  if (ui.flash) {                                  // 숫자를 누른 돌봄이 필요한 꽃들 반짝이기
    const now = performance.now(), left = ui.flash.until - now;
    if (left <= 0) ui.flash = null;
    else {
      const a = 0.45 + 0.55 * Math.abs(Math.sin((2400 - left) / 2400 * Math.PI * 4));
      const col = CARE_COLOR[ui.flash.t];
      g.save(); g.lineWidth = 3; g.strokeStyle = rgba(col, a); g.fillStyle = rgba(col, a * 0.3);
      g.shadowColor = rgba(col, 0.9); g.shadowBlur = 10;
      for (const f of st.flowers) if (!f.withered && E.canCare(st, f, ui.flash.t, cal)) {
        const r = cell * (0.7 + 0.15 * a);
        g.beginPath(); g.arc((f.x + 0.5) * cell, (f.y + 0.5) * cell, r, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      g.restore();
    }
  }
  const sel = st.flowers.find(f => f.id === ui.selected);
  if (sel) {
    const r = E.stageRadius(sel);
    g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2;
    g.strokeRect(sel.x * cell + 1, sel.y * cell + 1, cell - 2, cell - 2);
    if (r > 0) { g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath(); g.arc((sel.x + 0.5) * cell, (sel.y + 0.5) * cell, (r + 0.5) * cell, 0, 7); g.stroke(); }
    g.restore();
  }
  if (ui.selTile && !sel) { const [sx, sy] = ui.selTile; g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.strokeRect(sx * cell + 1, sy * cell + 1, cell - 2, cell - 2); g.restore(); }
  const mv = ui.moveFrom && st.flowers.find(f => f.id === ui.moveFrom);
  if (mv) { g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 2.5; g.setLineDash([4, 3]); g.strokeRect(mv.x * cell + 1, mv.y * cell + 1, cell - 2, cell - 2); g.restore(); }
  if (hover) { g.save(); g.strokeStyle = 'rgba(255,255,255,.65)'; g.setLineDash([4, 3]); g.lineWidth = 1.5; g.strokeRect(hover[0] * cell + 1, hover[1] * cell + 1, cell - 2, cell - 2); g.restore(); }
}
function snapshot() {
  const c = document.createElement('canvas'); c.width = 240; c.height = 160;
  c.getContext('2d').drawImage(canvas, 0, 0, 240, 160);
  return c.toDataURL('image/jpeg', 0.75);
}

// ---------------------------------------------------------------- 정원: 누르기와 드래그 (P13-06-01)
function tileAt(e) {
  const r = canvas.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / cell), y = Math.floor((e.clientY - r.top) / cell);
  return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null;
}
const tipEl = $('#tip');
function tipHTML([x, y]) {
  const f = E.flowerAt(st, x, y), tl = st.tiles[y * W + x], land = LANDS[E.landOf(tl)].name;
  if (!f) return `<b>${land}</b><br><span class="muted">${tl.t.toFixed(1)}°C · 습도 ${Math.round(tl.m)}%</span>`;
  const F = FLOWERS[f.type], cal = E.calendar(st.virtual), v = Math.round(E.vigorOf(st, f));
  const needs = [];
  if (!cal.frozen && !f.withered) {
    if (E.canCare(st, f, 'water', cal)) needs.push('💧 물이 필요해요');
    if (E.canCare(st, f, 'weed', cal)) needs.push('🌿 잡초가 났어요');
    if (E.canCare(st, f, 'harvest', cal)) needs.push('🧺 수확할 수 있어요');
  }
  return `<b>${F.name}</b> · ${E.STAGE[f.stage]}<br><span class="stars">${starStr(f.q)}</span> ${E.pct(f.q)}% · 기운 ${v}%${needs.length ? '<br>' + needs.join('<br>') : ''}<br><span class="muted">${land}</span>`;
}
canvas.addEventListener('pointerdown', e => {
  tipEl.hidden = true;
  const t = tileAt(e); if (!t) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 일부 환경에서는 지원하지 않음 */ }
  drag = { start: t, cur: t, path: new Map([[t.join(','), t]]), moved: false };
});
canvas.addEventListener('pointermove', e => {
  const t = tileAt(e); hover = t;
  if (drag) {
    tipEl.hidden = true;
    return;                                       // 드래그로 여러 칸 고르기는 지금은 꺼 둠
  }
  if (e.pointerType === 'mouse' && t) {
    tipEl.innerHTML = tipHTML(t); tipEl.hidden = false;
    tipEl.style.left = Math.min(innerWidth - 262, e.clientX + 14) + 'px';
    tipEl.style.top = Math.min(innerHeight - 110, e.clientY + 16) + 'px';
  } else tipEl.hidden = true;
});
canvas.addEventListener('pointerup', () => {
  if (!drag) return;
  const t = drag.start;
  drag = null;
  onTiles([t]);
});
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('pointerleave', () => { hover = null; tipEl.hidden = true; });

function onTiles(tiles) {
  const [x, y] = tiles[tiles.length - 1];
  const f = E.flowerAt(st, x, y);
  if (BATCH.includes(ui.tool)) {
    const r = E.care(st, ui.tool, tiles, ctx);
    if (tiles.length === 1 && f) select(f.id);
    return after(r, ui.tool === 'water' ? 'watered' : ui.tool === 'harvest' ? 'harvested' : null, ui.tool === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null);
  }
  if (ui.tool === 'look') {
    if (f) select(f.id);
    else { ui.selected = null; ui.selTile = [x, y]; ui.sheetOpen = true; }   // 빈 칸: 상태창에서 심기
    return renderStatus(true);
  }
  if (ui.tool === 'plant') {
    if (f) { select(f.id); return feedback('이 자리에는 이미 꽃이 있어요', true); }
    if (!ui.plantType) { $('#tray').classList.remove('nudge'); void $('#tray').offsetWidth; $('#tray').classList.add('nudge'); return feedback('먼저 위에서 심을 꽃을 골라 주세요', true); }
    return plantAt(ui.plantType, x, y);
  }
  if (ui.tool === 'prop') { if (!f) return feedback('번식할 꽃을 눌러 주세요', true); select(f.id); return after(E.propagate(st, f.id, Math.random, ctx)); }
  if (ui.tool === 'move') {
    if (!ui.moveFrom) { if (!f) return feedback('먼저 옮길 꽃을 눌러 주세요', true); ui.moveFrom = f.id; select(f.id); renderHint(); return renderToolbar(true); }
    const r = E.move(st, ui.moveFrom, x, y);
    if (r.ok) { ui.moveFrom = null; ui.tool = 'look'; }                     // 옮긴 뒤에는 관찰로 돌아감
    return after(r);
  }
}
function select(id) { ui.selected = id; ui.selTile = null; ui.sheetOpen = true; renderStatus(true); }
function plantAt(type, x, y) {
  if (E.flowerAt(st, x, y)) return feedback('이 자리에는 이미 꽃이 있어요', true);
  const best = st.items.filter(i => i.type === type && E.germOf(i) > 0).sort((a, b) => b.q - a.q)[0];
  if (!best) return feedback('창고에 심을 것이 없어요', true);
  const r = E.plant(st, best.id, x, y, Math.random);
  if (r.flower) select(r.flower.id);
  after(r, 'planted');
}

// ---------------------------------------------------------------- 정원: 꽃 상태창 (P14)
function blockers(f) {
  const tile = { x: f.x, y: f.y }, mine = homeLand(FLOWERS[f.type]);
  return st.flowers.filter(o => o !== f && !o.withered && homeLand(FLOWERS[o.type]) !== mine && Math.hypot(o.x - tile.x, o.y - tile.y) <= E.stageRadius(o) + 0.01);
}
// 기운이 낮은 이유 (목마름 / 땅이 아직 바뀌는 중 / 다른 꽃에 밀림)
function vigorCause(f, match) {   // 10-06: 이유가 여럿이면 함께 (목마름 + 옆 꽃)
  const out = [];
  if (f.thirstH > 0) out.push('물을 주면 기운이 돌아와요');
  const blk = blockers(f);
  if (blk.length) {   // ⑭ 좋아하는 환경이 아주 다른 꽃이 옆이면 이름을 대고 띄워 심기를 권함
    const F = FLOWERS[f.type], far = blk.map(o => FLOWERS[o.type]).map(O => ({ O, d: Math.abs(O.t - F.t) / 12 + Math.abs(O.m - F.m) / 30 })).sort((x, y) => y.d - x.d)[0];
    out.push(far.d >= 1 ? `옆 ${josa(far.O.name, '과/와')} 좋아하는 환경이 너무 달라요 · 한 칸 띄워 심어 보세요` : '다른 꽃의 땅에 밀리고 있어요');
  } else if (!out.length && match < 0.8) out.push(f.adaptH > 0 ? '땅이 아직 바뀌는 중이에요. 적응 기간이라 품질은 그대로예요' : '땅이 아직 바뀌는 중이에요');
  return out.join(' · ');
}
function renderStatus(force) {
  const el = $('#status'), f = st.flowers.find(x => x.id === ui.selected);
  if (!f && ui.selTile && !E.flowerAt(st, ui.selTile[0], ui.selTile[1])) return renderTileStatus(force);
  if (!f) {
    // 아무것도 고르지 않았을 때: 오늘의 한 마디만 (게임 하루, 현실 48분마다 바뀌고 옆 도트 꽃도 함께 바뀜)
    const cal0 = E.calendar(st.virtual), mw = monthWord(cal0), qi = (cal0.abs * 15 + cal0.day) % GARDEN_WORDS.length, qf = mw ? mw.k : FLOWER_KEYS[qi % FLOWER_KEYS.length];
    const sig0 = ['none', cal0.month, cal0.day, qi].join('|');
    if (!force && ui.sigs.status === sig0) return;
    ui.sigs.status = sig0;
    el.className = 'status idle';
    el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${FLOWERS[qf].petal} 16%, var(--sunk))">${spriteImg(qf, 'flower', 56, false, '')}</div>
      <div class="sx-title"><p class="sx-quote">${mw ? mw.w : GARDEN_WORDS[qi]}</p>${mw ? `<div class="sx-lang">${monthName(cal0.month)}의 꽃 · <b>${FLOWERS[mw.k].name}</b> · ${FLOWER_WORDS[mw.k].own ? '정원의 꽃말' : '꽃말'} 「${FLOWER_WORDS[mw.k].lang}」</div>` : ''}<div class="muted" style="font-size:11.5px">꽃이나 빈 칸을 누르면 여기에 자세히 나와요</div></div>
    </div>`;
    return;
  }
  const cal = E.calendar(st.virtual), F = FLOWERS[f.type], yr = E.yearOf(st, cal);
  const ch = E.monthlyChange(st, f), v = ch.v;
  const next = Math.min(1, Math.max(f.q > 0.3 ? 0.3 : f.q, f.q + (ch.pos - ch.neg) / 100));
  const tl = st.tiles[f.y * W + f.x], land = E.landOf(tl), home = homeLand(F), match = E.landMatch(st, f);
  const rel = land === home ? '같아요' : match > 0.5 ? '가까워요' : '멀어요';
  const blk = blockers(f);
  const can = {}; for (const t of ['water', 'weed', 'prune', 'fert', 'harvest']) can[t] = E.canCare(st, f, t, cal);
  const have = t => t === 'water' ? st.water > 0 : t === 'prune' ? st.shears > 0 : t === 'weed' ? st.hoe > 0 : t === 'harvest' ? st.basket > 0 : t === 'fert' ? st.fert > 0 : true;
  const TOOLNAME = { water: '물병', weed: '호미', prune: '가위', harvest: '바구니', fert: '비료' };
  ui.careNeed = []; ui.careLack = []; ui.careNeedFor = f.id;
  const careTile = (t, ic, label) => {
    let state, sub;
    const hH = { water: f.waterH, weed: f.weedH, prune: f.pruneH, fert: f.fertH }[t];
    if (f.withered || cal.frozen) { state = 'na'; sub = cal.frozen ? '쉬는 중' : '-'; }
    else if (t === 'prune' && !F.prune) { state = 'na'; sub = '필요 없어요'; }
    else if (t === 'harvest' && !can.harvest) { state = f.stage === 'bloom' && f.harvestKey === cal.abs ? 'done' : 'na'; sub = state === 'done' ? '거뒀어요' : monthsText(F.bloom); }
    else if (t !== 'harvest' && hH > 0) { state = 'done'; sub = flowH(hH) + ' 남음'; }
    else if (!can[t]) { state = 'na'; sub = '자란 뒤에'; }
    else if (!have(t)) { state = 'lack'; sub = TOOLNAME[t] + ' 없음'; }
    else { state = 'need'; sub = { water: '목말라요', weed: '잡초 났어요', prune: '칠 수 있어요', fert: '줄 수 있어요', harvest: '피었어요' }[t]; }
    const act = state === 'need';
    if (act) ui.careNeed.push(t);   // 꽃 둘레 단추로 (10-06)
    if (state === 'lack') ui.careLack.push(t);   // ⑯ 도구가 없으면 흐린 단추 (누르면 사기 창)
    return `<button type="button" class="ct ${state}" style="--k:${CARE_COLOR[t]}" ${act ? `data-care="${t}"` : 'disabled'} title="${label} · ${sub}"><span class="ci">${ic}${state === 'done' ? '<i>✓</i>' : ''}</span><span class="cl">${label}</span><span class="cs">${sub}</span></button>`;
  };
  ['water', 'weed', 'prune', 'fert', 'harvest'].forEach(t => careTile(t, '', ''));   // 지금 할 수 있는 돌보기 → 꽃 둘레 단추 (10-06)
  const canMove = !cal.frozen && !f.withered && (F.sow.includes(cal.month) || f.stage === 'dormant');
  // 옮겨 심기와 번식: 할 수 있으면 버튼, 아니면 이유
  const propReason = (() => {
    if (f.withered) return '시든 꽃이에요';
    if (cal.frozen) return '꽃잠에는 쉬어요';
    if (F.prop === '채종') return '시들 때 자동으로 거둬요';
    if (f.propYear === yr) return '올해 이미 했어요';
    if (!['mature', 'bloom', 'dormant'].includes(f.stage)) return '다 자란 뒤에 할 수 있어요';
    if (!F.propMonths.includes(cal.month)) return `${monthsText(F.propMonths)}에 할 수 있어요`;
    return '';
  })();
  const moveReason = canMove ? '' : f.withered ? '시든 꽃이에요' : cal.frozen ? '꽃잠에는 쉬어요' : '심는 기간이나 휴면기에 할 수 있어요';
  const actBtn = (act, label, reason) => `<div class="sx-act"><button type="button" class="btn ${reason ? '' : 'primary'}" data-act="${act}" ${reason ? 'disabled' : ''}>${label}</button>${reason ? `<span class="muted">${reason}</span>` : ''}</div>`;
  const actions = `<div class="sx-acts">${actBtn('move', ui.tool === 'move' && ui.moveFrom === f.id ? '↔ 옮길 빈 칸을 누르세요' : '↔ 옮겨심기', moveReason)}${actBtn('prop', `🌾 ${F.prop}${propReason ? '' : ` · ${E.propCount(f.q)}개`}`, propReason)}</div>`;
  const sig = JSON.stringify([can, have('water'), have('weed'), have('prune'), have('fert'), have('harvest'), st.fert, st.water, st.shears, st.hoe, st.basket, ui.tool, ui.moveFrom, propReason, moveReason, f.id, f.stage, E.pct(f.q), Math.round(v), E.pct(next), Math.round(f.waterH * 2), Math.round(f.weedH * 2), Math.round(f.pruneH * 2), Math.round(f.fertH * 2), Math.round(f.adaptH * 2), f.harvestKey === cal.abs, f.propYear, cal.idx, ui.detailsOpen, ui.sheetOpen, land, blk.length, Math.round(tl.t), Math.round(tl.m)]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : ' idle-mobile');
  const vCol = v >= 80 ? 'var(--good)' : v >= 50 ? '#c2a33a' : 'var(--warn)';
  const note = [f.adaptH > 0 ? `새 자리에 적응하는 중 (${flowH(f.adaptH)} 남음)` : '', v < 80 ? vigorCause(f, match) : ''].filter(Boolean).join(' · ');
  // 자라는 단계 길: 발아 → 새싹 → 자라는 중 → 다 자람 → 개화 (휴면·시듦은 따로 표시)
  const PATH = ['germ', 'sprout', 'young', 'mature', 'bloom'], si = PATH.indexOf(f.stage);
  const stagePath = `<div class="stagepath">${PATH.map((s, i) => `<span class="${si >= 0 && i < si ? 'past' : i === si ? 'cur' : ''}">${E.STAGE[s]}</span>`).join('')}${si < 0 ? `<span class="cur odd">${f.stage === 'dormant' ? '💤 ' : ''}${E.STAGE[f.stage]}</span>` : ''}</div>`;
  const nextArrow = next > f.q + 0.004 ? '↑' : next < f.q - 0.004 ? '↓' : '→';
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${F.petal} 16%, var(--sunk))">${spriteImg(f.type, 'flower', 56, false, F.name)}</div>
      <div class="sx-title"><h3>${F.name}</h3><div><span class="stars">${starStr(f.q)}</span> <span class="muted" style="font-size:12px">${qualityWord(f.q)}</span></div>
        <div class="muted" style="font-size:12px">${LIFE[F.life]} · ${FORM[F.form].name} · 심은 지 ${flowH(f.ageH)}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    ${stagePath}
    <div class="sx-stats">
      <div title="${qualityWord(f.q)}"><span class="lbl">품질</span><b>${E.pct(f.q)}%</b><span class="mini"><i style="width:${E.pct(f.q)}%;background:#d39b12"></i></span><span class="sub">다음 달 ${nextArrow} ${E.pct(next)}%</span></div>
      <div title="${vigorWord(v)}"><span class="lbl">기운</span><b style="color:${vCol}">${Math.round(v)}%</b><span class="mini"><i style="width:${Math.round(v)}%;background:${vCol}"></i></span><span class="sub">${vigorWord(v)}</span></div>
      <div title="꽃이 바꾸는 땅의 범위"><span class="lbl">땅</span><b>${E.qualityRadius(f)}칸</b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">${LANDS[land].name}</span></div>
    </div>
    ${note ? `<div class="sx-note">💬 ${note}</div>` : ''}
    <!-- 돌보기 다섯 칸은 꽃 둘레 단추로 옮김 (10-06) -->
    ${actions}
    <details ${ui.detailsOpen ? 'open' : ''} data-act="details"><summary>자세히 보기 · 땅 · 일정 · 출신</summary>
      <h3 style="margin:10px 0 4px;font-size:14px">땅</h3>
      <dl class="kv">
        <dt>지금 땅</dt><dd><span class="sw" style="background:${LANDS[land].color}"></span> ${LANDS[land].name}</dd>
        <dt>원하는 땅</dt><dd>${LANDS[home].name} · ${rel}</dd>
      </dl>
      <div class="gauges" title="색칸이 이 꽃이 원하는 범위(±3), ▲가 지금 이 칸">${envGauges(F, tl)}</div>
      <dl class="kv">
        <dt>바꾸는 범위</dt><dd>${Math.max(0, E.stageRadius(f))}칸 (다 자라면 ${E.qualityRadius(f)}칸)</dd>
        ${blk.length ? `<dt>밀리는 중</dt><dd>옆의 ${josa(FLOWERS[blk[0].type].name, '이/가')} 만든 땅에 밀리고 있어요</dd>` : ''}
      </dl>
      <h3 style="margin:10px 0 4px;font-size:14px">일정</h3>
      ${flowerStrip(F, cal.idx)}
      <dl class="kv">
        ${f.stage === 'bloom' ? `<dt>수확</dt><dd>${f.harvestKey === cal.abs ? '이번 달은 수확했어요' : '지금 수확할 수 있어요'}</dd>` : ''}
        <dt>번식</dt><dd>${F.prop === '채종' ? '채종 · 시들 때 자동' : F.prop}</dd>
        <dt>옮겨심기</dt><dd>${canMove ? '지금 할 수 있어요' : '심는 기간이나 휴면기에'}</dd>
      </dl>
      <h3 style="margin:10px 0 4px;font-size:14px">출신</h3>
      <dl class="kv">
        <dt>어디서</dt><dd>${f.origin}${f.parent ? ` (${f.parent}에서)` : ''}</dd>
        <dt>심을 때 품질</dt><dd>${qLabel(f.startQ)}</dd>
      </dl>
      <div class="row" style="margin-top:8px"><button type="button" class="btn small" data-act="dex" data-key="${f.type}">📖 도감</button></div>
    </details>`;
}
// 빈 칸 상태창: 땅 정보와 이 칸에 심기
function renderTileStatus(force) {
  const el = $('#status'), [x, y] = ui.selTile, tl = st.tiles[y * W + x], land = E.landOf(tl), cal = E.calendar(st.virtual);
  const pl = plantable(), keys = Object.keys(pl);
  const sig = JSON.stringify(['tile', x, y, land, Math.round(tl.t), Math.round(tl.m), pl, cal.frozen, ui.sheetOpen]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  const best = k => Math.max(...st.items.filter(i => i.type === k && E.germOf(i) > 0).map(i => i.q));
  // 꽃 상태창과 같은 카드형: 땅 그림 · 세 칸 수치 · 심을 꽃 카드
  const list = keys.slice().sort((a, b) => (homeLand(FLOWERS[b]) === land) - (homeLand(FLOWERS[a]) === land)).map(k => {   // 이 땅과 맞는 꽃이 먼저
    const F = FLOWERS[k], fits = homeLand(F) === land, L = LANDS[homeLand(F)];
    return `<button type="button" class="pcard ${fits ? 'fits' : ''}" data-plantat="${k}" style="--pc:${F.petal}" title="누르면 이 칸에 심어요">
      <span class="pc-art">${spriteImg(k, 'flower', 40, false, F.name)}<span class="pc-count">×${pl[k]}</span></span>
      <span class="pc-name"><b>${F.name}</b> <span class="muted">${FORM[F.form].name}</span></span>
      <span class="stars">${starStr(best(k))}</span>
      <span class="pc-land"><span class="sw" style="background:${L.color}"></span>${josa(L.name, '을/를')} 만들어요</span>
      ${fits ? '<span class="pc-fit">이 땅과 잘 맞아요</span>' : ''}<span class="pc-go">🌰 심기</span></button>`;
  }).join('');
  const cnt = E.landCounts(st)[land] || 0;
  // 이 땅이 고향인 꽃 (도감에서 만난 꽃만 이름을 보여 줌)
  const homes = FLOWER_KEYS.filter(k => homeLand(FLOWERS[k]) === land), known = homes.filter(k => st.dex.flower[k]).map(k => FLOWERS[k].name);
  const say = land === 'barren' ? '아직 아무 꽃의 땅도 아니에요. 꽃을 심으면 그 꽃이 좋아하는 땅으로 바뀌어요'
    : known.length ? `${known.join(', ')}${josa(known[known.length - 1], '이/가').slice(-1)} 좋아하는 땅이에요` : homes.length ? '어떤 꽃이 좋아하는 땅일까요?' : '꽃과 꽃 사이에서 생긴 땅이에요';
  const tPct = Math.max(0, Math.min(100, tl.t / 35 * 100)), mPct = Math.max(0, Math.min(100, tl.m));
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : '');
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${LANDS[land].color} 22%, var(--sunk))"><span class="sx-land" style="background-color:${LANDS[land].color}"></span></div>
      <div class="sx-title"><h3>빈 칸</h3><div><span class="chip" style="font-size:11.5px"><span class="sw" style="background:${LANDS[land].color};width:9px;height:9px;margin-right:4px"></span>${LANDS[land].name}</span></div>
        <div class="muted" style="font-size:12px">가로 ${x + 1} · 세로 ${y + 1}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    <div class="sx-stats">
      <div><span class="lbl">기온</span><b>${tl.t.toFixed(1)}°</b><span class="mini"><i style="width:${tPct}%;background:${tl.t < 12 ? '#86abc3' : tl.t < 23 ? '#64a653' : '#cc8636'}"></i></span><span class="sub">${tl.t < 12 ? '서늘해요' : tl.t < 23 ? '온화해요' : '따뜻해요'}</span></div>
      <div><span class="lbl">습도</span><b>${Math.round(tl.m)}%</b><span class="mini"><i style="width:${mPct}%;background:#3d8fd6"></i></span><span class="sub">${tl.m < 30 ? '메말라요' : tl.m < 60 ? '보통이에요' : tl.m < 80 ? '촉촉해요' : '물이 많아요'}</span></div>
      <div><span class="lbl">이 땅</span><b>${cnt}<small> 칸</small></b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">정원 전체에서</span></div>
    </div>
    <div class="sx-note">💬 ${say}</div>
    <div class="sx-sec">🌰 이 칸에 심기${keys.length && !cal.frozen ? ` <span class="muted" style="font-family:var(--font-body);font-weight:400;font-size:12px">${keys.length}가지 · 누르면 바로 심어요</span>` : ''}</div>
    ${cal.frozen ? '<p class="note">꽃잠에는 심을 수 없어요. 화원에서 다음 해 꽃을 예약할 수 있어요.</p><div><button type="button" class="btn small" data-go="shop">💐 예약</button></div>'
      : keys.length ? `<div class="pgrid">${list}</div>`
      : '<p class="note">지금 심을 수 있는 게 창고에 없어요. 화원에서 제철 꽃을 사 보세요.</p><div><button type="button" class="btn small primary" data-go="shop">💐 화원</button></div>'}`;
}
function careOn(f, t) { return after(E.care(st, t, [[f.x, f.y]], ctx), t === 'water' ? 'watered' : t === 'harvest' ? 'harvested' : null, t === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null); }
// 꽃 둘레 돌보기 단추 (10-06): 고른 꽃에 지금 할 수 있는 돌보기만 꽃 위에 부채꼴로. (상태창의 다섯 칸은 뺌)
const RING_TOOL = { water: 'water', weed: 'hoe', prune: 'shears', fert: 'fert', harvest: 'basket' };
const RING_IC = { water: '💧', weed: '🌿', prune: '✂️', fert: '🌱', harvest: '🧺' }, RING_NM = { water: '물', weed: '잡초', prune: '가지치기', fert: '비료', harvest: '수확' };
var ringEl = document.getElementById('careRing');   // var: draw()가 먼저 불려도 안전하게
function updateRing() {
  if (!ringEl) return;
  const f = ui.tab === 'garden' && ui.tool === 'look' && st.flowers.find(x => x.id === ui.selected);
  const mine = f && ui.careNeedFor === f.id, need = mine ? (ui.careNeed || []) : [], lack = mine ? (ui.careLack || []) : [];
  const cares = ['water', 'weed', 'prune', 'fert', 'harvest'].filter(t => need.includes(t) || lack.includes(t));
  if (!cares.length) { if (!ringEl.hidden) { ringEl.hidden = true; ringEl.innerHTML = ''; ui.ringSig = ''; } return; }
  const cx = canvas.offsetLeft + (f.x + 0.5) * cell, cy = canvas.offsetTop + (f.y + 0.5) * cell;
  const R = Math.max(46, cell * 1.6), step = 52, n = cares.length;   // 단추끼리 겹치지 않게 (활꼴 간격 ≥ 40px)
  // 꽃 자리에 따라 (10-06): 지도 가운데 쪽으로 펼침 (오른쪽 끝 꽃 → 왼쪽, 위쪽 꽃 → 아래). 가운데 가까운 꽃은 위로. 안 들어가면 옆 방향을 차례로
  const fw = ringEl.clientWidth, fh = ringEl.clientHeight, M = 20;
  const pos = base => cares.map((t, i) => { const ang = (base + (i - (n - 1) / 2) * step) * Math.PI / 180; return [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]; });
  const fits = ps => ps.every(([x, y]) => x >= M && x <= fw - M && y >= M && y <= fh - M);
  const dx = fw / 2 - cx, dy = fh / 2 - cy, toC = Math.round(Math.atan2(dy, dx) * 180 / Math.PI / 45) * 45;   // 가운데 쪽 (45° 단위)
  const first = Math.hypot(dx, dy) < Math.min(fw, fh) * 0.18 ? -90 : toC;
  const bases = [first, first - 45, first + 45, first - 90, first + 90, -90, 90, 0, 180];
  let base = bases.find(b => fits(pos(b)));
  let pts;
  if (base != null) pts = pos(base);
  else {   // 지도 모서리 · 가장자리라 부채꼴이 안 들어가면: 지도 안쪽으로 한 줄 (좌우 끝이면 세로 줄, 위아래 끝이면 가로 줄)
    const gap = 42, nearSide = Math.min(cx, fw - cx) < Math.min(cy, fh - cy);
    base = nearSide ? 'col' : 'row';
    const clampLine = (c0, lim) => Math.min(lim - M - (n - 1) * gap / 2, Math.max(M + (n - 1) * gap / 2, c0));
    if (nearSide) { const x = cx < fw / 2 ? cx + R : cx - R, y0 = clampLine(cy, fh); pts = cares.map((t, i) => [x, y0 + (i - (n - 1) / 2) * gap]); }
    else { const y = cy < fh / 2 ? cy + R : cy - R, x0 = clampLine(cx, fw); pts = cares.map((t, i) => [x0 + (i - (n - 1) / 2) * gap, y]); }
  }
  const sig = [f.id, cares.join(','), lack.join(','), Math.round(cx), Math.round(cy), Math.round(R), base, fw, fh].join('|');
  if (sig === ui.ringSig) return;
  ui.ringSig = sig; ringEl.hidden = false;
  ringEl.innerHTML = cares.map((t, i) => {
    const lk = lack.includes(t);
    return `<button type="button" class="ring-btn ${lk ? 'lack' : ''}" data-ring="${t}" ${lk ? `data-ringbuy="${RING_TOOL[t]}"` : ''} style="--k:${CARE_COLOR[t]};left:${pts[i][0].toFixed(1)}px;top:${pts[i][1].toFixed(1)}px;--d:${i * 40}ms" title="${lk ? `${RING_NM[t]} · ${E.SUPPLIES[RING_TOOL[t]].name} 없음 · 누르면 살 수 있어요` : RING_NM[t]}" aria-label="${RING_NM[t]}${lk ? ' (도구 없음)' : ''}"><span>${RING_IC[t]}</span>${lk ? '<i class="ring-lack">+</i>' : ''}</button>`;
  }).join('');
}
ringEl.addEventListener('click', e => {
  const b = e.target.closest('[data-ring]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.ringbuy) return openSupply(b.dataset.ringbuy);
  const f = st.flowers.find(x => x.id === ui.selected); if (f) careOn(f, b.dataset.ring);
});
$('#status').addEventListener('click', e => {
  const b = e.target.closest('[data-act], [data-plantat], [data-care]'); if (!b || b.disabled) return;
  const f = st.flowers.find(x => x.id === ui.selected);
  if (b.dataset.care && f) return careOn(f, b.dataset.care);
  if (b.dataset.plantat && ui.selTile) return plantAt(b.dataset.plantat, ui.selTile[0], ui.selTile[1]);
  if (b.dataset.act === 'closeSheet') { ui.sheetOpen = false; ui.selected = null; ui.selTile = null; if (ui.tool === 'move') { ui.tool = 'look'; ui.moveFrom = null; renderToolbar(true); } renderStatus(true); }
  if (b.dataset.act === 'dex') openDexDetail('flower', b.dataset.key);
  if (b.dataset.act === 'move' && f) {
    if (ui.tool === 'move' && ui.moveFrom === f.id) { ui.tool = 'look'; ui.moveFrom = null; }
    else { ui.tool = 'move'; ui.moveFrom = f.id; }
    renderToolbar(true); renderStatus(true);
  }
  if (b.dataset.act === 'prop' && f) after(E.propagate(st, f.id, Math.random, ctx));
});
$('#status').addEventListener('toggle', e => { if (e.target.matches('details')) ui.detailsOpen = e.target.open; }, true);

// ---------------------------------------------------------------- 💐 화원 (P06, P17)
function strip(F, cal) {
  const c = ['#ffffff', '#fbfbf5', '#fbe3ea', '#f1d36a'].includes(F.petal) ? '#e0b4c3' : F.petal;
  return `<div class="strip" style="--c:${c}">${MONTHS.map(m => `<i class="${F.sow.includes(m) ? 'sow ' : ''}${F.bloom.includes(m) ? 'bloom ' : ''}${m > 12 ? 'rest ' : ''}${m === cal.month ? 'now' : ''}" title="${monthName(m)}"></i>`).join('')}</div>`;
}
// 정원: 올해의 흐름 (지도 아래)
function yearInfo(cal) {
  const night = cal.hour >= 18 || cal.hour < 7;
  return `${cal.frozen ? `${monthName(cal.month)} · 정원이 쉬는 중` : `${SEASON_IC[cal.season]} ${SEASONS[cal.season]} ${monthName(cal.month)} ${cal.day}일 ${night ? '밤' : '낮'}`}${st.speed > 1 ? ` · ${st.speed}배속` : ''}`;   // 10-06: 년차 · 다음 달까지는 뺌
}
function renderYear(force) {
  const cal = E.calendar(st.virtual), pct = Math.min(100, Math.max(0, (st.virtual - cal.slotStart) / (cal.slotEnd - cal.slotStart) * 100));
  const sig = [cal.idx, Math.floor(pct / 2)].join('|');
  if (!force && ui.sigs.year === sig) return;
  ui.sigs.year = sig;
  $('#yearBox').innerHTML = MONTHS.map((m, i) => `<i class="${i === cal.idx ? 'now ' : ''}${Math.min(4, Math.floor(i / 3)) === cal.season ? 'cur' : ''}" style="--c:${SEASON_COLOR[Math.min(4, Math.floor(i / 3))]};--p:${pct.toFixed(1)}%" title="${monthName(m)}"><b style="width:${i < cal.idx ? 100 : i === cal.idx ? pct.toFixed(1) : 0}%"></b></i>`).join('');
  $('#yearBox').setAttribute('aria-label', `올해의 흐름: ${monthName(cal.month)}, 이번 달 ${Math.round(pct)}% 지남`);
}
function nextSale(F) { return E.untilMonth(st.virtual, c => !c.frozen && F.sow.includes(c.month)); }
const wallet = () => `<span class="wallet" aria-label="가진 돈">💰 ${won(st.money)}</span>`;
function renderShop(force) {
  const cal = E.calendar(st.virtual), yr = E.yearOf(st, cal);
  const sig = JSON.stringify([cal.idx, realH((cal.slotEnd - st.virtual) / HOUR / (st.speed || 1)), cal.frozen, st.money, st.fert, st.water, st.shears, st.hoe, st.basket, ui.shopQty, ui.cart, ui.shopFilter, st.items.length, st.reservations.map(r => [r.id, r.done])]);
  if (!force && ui.sigs.shop === sig) { updateCountdowns(); return; }
  ui.sigs.shop = sig;
  const onSale = FLOWER_KEYS.filter(k => !cal.frozen && FLOWERS[k].sow.includes(cal.month));
  const order = FLOWER_KEYS.slice().sort((a, b) => {
    const A = onSale.includes(a), B = onSale.includes(b);
    if (A !== B) return B - A;
    if (A) { const la = !FLOWERS[a].sow.includes(MONTHS[cal.idx + 1]), lb = !FLOWERS[b].sow.includes(MONTHS[cal.idx + 1]); if (la !== lb) return lb - la; return 0; }
    const na = nextSale(FLOWERS[a]), nb = nextSale(FLOWERS[b]);
    return (na ? na.hours : 999) - (nb ? nb.hours : 999);
  });
  const shown = ui.shopFilter && !cal.frozen ? order.filter(k => onSale.includes(k)) : order;
  const own = {}; for (const it of st.items) own[it.type] = (own[it.type] || 0) + 1;
  const rsv = {}; for (const r of st.reservations) if (!r.done) rsv[r.type] = (rsv[r.type] || 0) + r.qty;   // 카드 오른쪽 아래 "🗓️ 예약 ○"   // 카드에 "📦 창고에 ○개"
  const cards = shown.map(k => {
    const F = FLOWERS[k], on = onSale.includes(k);
    let action;
    if (cal.frozen) {
      const used = E.reservedCount(st, k, yr + 1), inCart = Object.values(ui.cart[k] || {}).reduce((a, b) => a + b, 0), left = 3 - used - inCart;
      // 예약 카드: 할인 가격 · 심는 때마다 수량 · 남은 예약
      action = `<div class="rv-box">
        <div class="rv-price"><s>${won(F.price)}</s><b>${won(E.reservationPrice(F))}</b><span class="rv-left">${3 - used > 0 ? `남은 예약 ${3 - used}개` : '예약을 다 했어요'}</span></div>
        ${F.windows.map(w => { const q = (ui.cart[k] || {})[w[0]] || 0; return `<div class="rv-row ${q ? 'on' : ''}"><span>${monthIc(w[0])} ${windowText(w)} 심기</span>
          <span class="stepper"><button type="button" data-cart="-" data-key="${k}" data-win="${w[0]}" ${q <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${q}</span><button type="button" data-cart="+" data-key="${k}" data-win="${w[0]}" ${left <= 0 ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}
      </div>`;
    } else if (on) {
      const n = ui.shopQty[k] || 1;
      action = `<div class="sc-buy"><span class="stepper"><button type="button" data-qty="-" data-key="${k}" aria-label="줄이기">−</button><span>${n}</span><button type="button" data-qty="+" data-key="${k}" aria-label="늘리기">+</button></span>
        <button type="button" class="btn primary" data-buy="${k}" ${st.money < F.price * n ? 'disabled' : ''}>${st.money < F.price * n ? '잔액 부족' : `구매${n > 1 ? ` · ${n}${FORM[F.form].unit}` : ''}`}</button></div>`;
    } else {
      const ns = nextSale(F);
      action = `<div class="sc-next">다음 판매 ${ns ? `<b>${monthName(ns.cal.month)}</b> · <span data-next="${k}">${realH(ns.hours / (st.speed || 1))} 뒤</span>` : '-'}</div>`;
    }
    const L = LANDS[homeLand(F)], inC = cal.frozen ? Object.values(ui.cart[k] || {}).reduce((a, b) => a + b, 0) : 0;
    const last = on && !F.sow.includes(MONTHS[cal.idx + 1]);   // 다음 달엔 안 팔면 "이번 달까지"
    return `<div class="shopcard ${on || cal.frozen ? '' : 'off'} ${inC ? 'incart' : ''}" data-on="${on ? 1 : 0}" style="--pc:${F.petal}">
      <div class="sc-art">${formArt(k, 64)}<span class="chip sc-form">${FORM[F.form].name}</span>${last ? '<span class="sc-last">이번 달까지</span>' : ''}${own[k] ? `<span class="sc-own" title="창고에 ${own[k]}개 있어요">📦 ${own[k]}</span>` : ''}${rsv[k] ? `<span class="sc-rsv" title="예약한 것 ${rsv[k]}개 · 창고에서 도착 날짜를 볼 수 있어요">🗓️ ${rsv[k]}</span>` : ''}</div>
      <div class="sc-name"><b>${F.name}</b><span class="sc-price">${won(F.price)}</span></div>
      <div class="sc-meta"><span>${LIFE[F.life]} · 개화 ${monthsText(F.bloom)}</span><span><span class="sw" style="background:${L.color}"></span>${josa(L.name, '을/를')} 만들어요</span></div>
      ${action}</div>`;
  });
  // 일반 판매: 지금 파는 꽃 / 곧 들어올 꽃을 나눠서
  const onCards = shown.map((k, i) => onSale.includes(k) ? cards[i] : '').join(''), soonCards = shown.map((k, i) => onSale.includes(k) ? '' : cards[i]).join('');
  const nextIn = order.map(k => [k, nextSale(FLOWERS[k])]).filter(x => x[1] && !onSale.includes(x[0])).sort((a, b) => a[1].hours - b[1].hours)[0];
  const stockN = Object.values(plantable()).reduce((a, b) => a + b, 0);
  const seg = `<span class="seg" role="group" aria-label="보기"><button type="button" data-shopf="on" aria-pressed="${!!ui.shopFilter}">지금 파는 꽃</button><button type="button" data-shopf="off" aria-pressed="${!ui.shopFilter}">모든 꽃</button></span>`;
  // 일반 판매: 맨 위 한 줄 소식 → 지금 파는 꽃 → 곧 들어올 꽃
  const news = `<div class="shop-news">
      <span><b>${SEASON_IC[cal.season]} ${monthName(cal.month)}</b> ${realH((cal.slotEnd - st.virtual) / HOUR / (st.speed || 1))} 남음</span>
      ${nextIn ? `<span>다음엔 <b>${monthName(nextIn[1].cal.month)} ${FLOWERS[nextIn[0]].name}</b></span>` : ''}
      ${stockN ? `<button type="button" data-go="store">📦 창고에 지금 심을 것 <b>${stockN}개</b> ›</button>` : ''}${wallet()}</div>`;
  const saleView = `${news}
    <div class="cab-head"><span class="sb-title">🌸 지금 파는 꽃 <span class="sh-n">${onSale.length}</span></span><span class="right">${seg}</span></div>
    ${onCards ? `<div class="shopgrid">${onCards}</div>` : `<div class="cab-empty"><span>🌱</span><div><b>지금은 심는 기간인 꽃이 없어요</b><br><span class="muted">${nextIn ? `${monthName(nextIn[1].cal.month)}에 ${josa(FLOWERS[nextIn[0]].name, '이/가')} 들어와요` : ''}</span></div>${ui.shopFilter ? '<button type="button" class="btn small" data-shopf="off">모든 꽃</button>' : ''}</div>`}
    ${!ui.shopFilter && soonCards ? `<div class="cab-head"><span class="sb-title">🗓️ 곧 들어올 꽃</span><span class="muted">들어오는 순서대로 · 심는 기간에만 팔아요</span></div><div class="shopgrid">${soonCards}</div>` : ''}`;
  const cart = Object.entries(ui.cart).flatMap(([k, ws]) => Object.entries(ws).map(([w, q]) => ({ type: k, window: +w, qty: q }))).filter(c => c.qty > 0);
  const cartTotal = cart.reduce((a, c) => a + E.reservationPrice(FLOWERS[c.type]) * c.qty, 0);
  const cartN = cart.reduce((a, c) => a + c.qty, 0), short = cart.length && st.money < cartTotal;
  // 꽃잠 예약: 한 줄 안내 → 예약한 꽃 → 꽃 카드 → 아래에 붙는 예약 바구니
  const rvView = `<div class="shop-news rv-intro"><span class="rv-badge">🗓️ 예약 기간</span><span>심는 달 첫날 아침 6시에 창고로 와요</span><span>꽃마다 3개까지 · 취소할 수 없어요</span></div>
    <div class="shopgrid rv">${cards.join('')}</div>
    <div class="rv-bar ${cart.length ? 'on' : ''}"><span class="rv-bar-ic">🧺</span>
      <span class="rv-bar-main">${cart.length ? `<b>담은 예약 ${cartN}개</b><small>${[...new Set(cart.map(c => FLOWERS[c.type].name))].join(' · ')}</small>` : '<b>담은 예약이 없어요</b><small>꽃 카드에서 + 를 눌러 담아요</small>'}</span>
      ${cart.length ? `<span class="rv-bar-sum"><b class="data">${won(cartTotal)}</b>${short ? '<small class="rv-warn">돈이 모자라요</small>' : '<small>10% 할인</small>'}</span><button type="button" class="btn" data-act="clearCart">초기화</button>` : ''}
      <button type="button" class="btn primary" data-act="reserve" ${cart.length && !short ? '' : 'disabled'}>예약</button></div>`;
  $('#p-shop').innerHTML = `<div class="stack">
    ${cal.frozen ? rvView : saleView}</div>`;
}
function updateCountdowns() {
  document.querySelectorAll('[data-next]').forEach(el => { const ns = nextSale(FLOWERS[el.dataset.next]); if (ns) el.textContent = realH(ns.hours / (st.speed || 1)) + ' 뒤'; });
}
$('#p-shop').addEventListener('change', e => { if (e.target.id === 'shopFilter') { ui.shopFilter = e.target.checked; renderShop(true); } });
$('#p-shop').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const k = b.dataset.key;
  if (b.dataset.qty) { ui.shopQty[k] = Math.max(1, Math.min(20, (ui.shopQty[k] || 1) + (b.dataset.qty === '+' ? 1 : -1))); return renderShop(true); }
  if (b.dataset.shopf) { ui.shopFilter = b.dataset.shopf === 'on'; return renderShop(true); }
  if (b.dataset.buy) { const key = b.dataset.buy, n = ui.shopQty[key] || 1; ui.shopQty[key] = 1; return after(E.buy(st, key, n), 'bought', { label: '🌰 심기', fn: () => { ui.tool = 'plant'; ui.plantType = null; setTab('garden', true); } }); }
  if (b.dataset.cart) {
    const w = +b.dataset.win; ui.cart[k] = ui.cart[k] || {};
    ui.cart[k][w] = Math.max(0, (ui.cart[k][w] || 0) + (b.dataset.cart === '+' ? 1 : -1));
    return renderShop(true);
  }
  if (b.dataset.act === 'clearCart') { ui.cart = {}; return renderShop(true); }
  if (b.dataset.act === 'reserve') return openReserveConfirm();
});
function cartList() { return Object.entries(ui.cart).flatMap(([k, ws]) => Object.entries(ws).map(([w, q]) => ({ type: k, window: +w, qty: q }))).filter(c => c.qty > 0); }
function openReserveConfirm() {                                                   // P06-06-05
  const cart = cartList(), sum = E.cartSummary(st, cart);
  const total = sum.reduce((a, s) => a + s.total, 0), full = sum.reduce((a, s) => a + s.F.price * s.qty, 0), short = st.money < total;
  // 예약 확인: 담은 꽃 카드 줄 + 합계 상자 + 안내
  const body = `<div class="rc">
    <div class="rc-list">${sum.map(s => {
      const di = MONTHS.indexOf(s.deliverMonth);
      return `<div class="rc-item" style="--pc:${s.F.petal}"><span class="rc-art">${spriteImg(s.F.key, 'flower', 40, false, s.F.name)}</span>
        <span class="rc-main"><b>${s.F.name} ${FORM[s.F.form].name} <span class="data">×${s.qty}</span></b>
          <small>${monthIc(s.window[0])} ${monthsText(s.window)} 심기</small>
          <small>📦 내년 ${monthName(s.deliverMonth)} 1일 (${WEEKDAY[Math.floor(di / 2)]}) 오전 6시 도착</small></span>
        <span class="rc-price data">${won(s.total)}</span></div>`;
    }).join('')}</div>
    <div class="rc-total"><div><span class="muted">일반가</span><s class="data">${won(full)}</s></div><div><span class="muted">예약 할인</span><span class="data good">−${won(full - total)}</span></div><div class="rc-sum"><b>합계</b><b class="data">${won(total)}</b></div></div>
    <div class="rc-pay ${short ? 'short' : ''}"><div class="rc-pay-t">💰 선금 · 예약할 때 바로 내요</div>
      <div><span class="muted">가진 돈</span><span class="data">${won(st.money)}</span></div>
      <div><span class="muted">예약 뒤 남는 돈</span><b class="data">${short ? `${won(total - st.money)} 모자라요` : won(st.money - total)}</b></div></div>
    <div class="rc-notes"><span>📦 특수 포장이라 심는 기간이 시작될 때까지 품질이 그대로예요</span><span class="rc-warn">⚠️ 예약은 취소할 수 없어요</span></div></div>`;
  openModal('🗓️ 예약 확인', body, [
    { label: '취소', act: () => closeModal() },
    { label: `예약 · ${won(total)}`, primary: true, act: () => { if (short) return; const r = E.reserve(st, cart); if (r.ok) ui.cart = {}; closeModal(); after(r, 'reserved'); } },
  ]);
  if (short) $('#modalRoot [data-mb="1"]').disabled = true;
}

// ---------------------------------------------------------------- 📦 창고 (P06-14)
function groupItems() {
  const map = new Map();
  for (const it of st.items) {
    const g0 = E.germOf(it), key = [it.type, it.origin, E.pct(it.q), Math.round(g0 * 100), it.packaged].join('|');
    if (!map.has(key)) map.set(key, { type: it.type, origin: it.origin, q: it.q, g: g0, ageH: it.ageH, packaged: it.packaged, got: it.got, parent: it.parent, ids: [] });
    const gr = map.get(key); gr.ids.push(it.id); gr.got = Math.max(gr.got, it.got);
  }
  return [...map.values()];
}
function renderStore(force) {
  const cal = E.calendar(st.virtual), yr0 = E.yearOf(st, cal);
  const relYear = y => y <= yr0 ? '올해' : y === yr0 + 1 ? '내년' : `${y - yr0}년 뒤`;   // 10-06: ○년차 대신
  const groups = groupItems();
  const sig = JSON.stringify([groups.map(g0 => [g0.type, E.pct(g0.q), Math.round(g0.g * 100), g0.packaged, g0.ids.length, Math.floor(g0.ageH / E.MONTH_H)]), ui.storeSort, st.fert, st.water, st.shears, st.hoe, st.basket, st.pending.map(p => [p.id, Math.ceil(p.dueH)]), st.reservations.length, cal.idx]);
  if (!force && ui.sigs.store === sig) return;
  ui.sigs.store = sig;
  const nextSow = F => { const n = E.untilMonth(st.virtual, c => !c.frozen && F.sow.includes(c.month)); return n ? n.hours : 999; };
  const sorters = {
    flower: (a, b) => FLOWER_KEYS.indexOf(a.type) - FLOWER_KEYS.indexOf(b.type) || b.q - a.q,
    month: (a, b) => (FLOWERS[a.type].sow.includes(cal.month) && !cal.frozen ? -1 : nextSow(FLOWERS[a.type])) - (FLOWERS[b.type].sow.includes(cal.month) && !cal.frozen ? -1 : nextSow(FLOWERS[b.type])),
    quality: (a, b) => b.q - a.q,
    got: (a, b) => b.got - a.got,
  };
  groups.sort(sorters[ui.storeSort]);
  // 씨앗·묘목 카드: 품질 막대 · 싱싱한 기간 · 곧 시들면 표시. 지금 심을 것 / 나중에 심을 것으로 나눔
  const qbar = q => `<span class="qbar"><i style="width:${Math.round(q * 100)}%"></i></span>`;
  const card = gr => {
    const F = FLOWERS[gr.type], now = !cal.frozen && F.sow.includes(cal.month) && gr.g > 0;
    const comp = gr.ids.filter(id => E.compostable(st.items.find(it => it.id === id)));   // 곧 시들고 품질 5% 이하 → 비료로
    const exp = gr.ageH < 12 * E.MONTH_H ? E.calendarAfterFlow(st.virtual, 12 * E.MONTH_H - gr.ageH) : null;
    const soon = !gr.packaged && gr.g > 0 && gr.ageH >= 10 * E.MONTH_H;          // 싹 트는 힘이 곧 줄기 시작함
    const expTxt = gr.packaged ? '📦 심을 때까지 그대로' : exp ? `<span title="이때까지 싱싱해요 (그 뒤엔 싹 트는 힘이 줄어요)">🌿 ${relYear(E.yearOf(st, exp))} ${monthName(exp.month)}까지</span>` : `${FORM[F.form].rate} ${Math.round(gr.g * 100)}%`;
    return `<div class="shopcard storecard ${now ? 'ready' : ''}" style="--pc:${F.petal}">
      <div class="sc-art">${formArt(gr.type, 64)}<span class="chip sc-form">${FORM[F.form].name}</span><span class="sc-count left">×${gr.ids.length}</span>${gr.packaged ? '<span class="sc-pack" title="특수 포장">📦</span>' : soon ? '<span class="sc-last">곧 시들어요</span>' : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(gr.q)}</span></div>
      <div class="cc-q">${qbar(gr.q)}<span class="data">${E.pct(gr.q)}%</span></div>
      <div class="cc-meta"><span class="st-from">${gr.origin}</span> ${expTxt}</div>
      ${now ? `<button type="button" class="btn primary" data-plant="${gr.type}">🌰 심기</button>` : `<div class="sc-next">${gr.g <= 0 ? '싹이 트지 않아요' : (ns => ns ? `다음 심는 때 <b>${monthName(ns.cal.month)}</b> · ${realH(ns.hours / (st.speed || 1))} 뒤` : `심는 때 <b>${sowText(F)}</b>`)(nextSale(F))}</div>`}
      ${comp.length ? `<button type="button" class="btn compost" data-compost="${comp.join(',')}">🌱 비료</button>` : ''}</div>`;
  };
  const isNow = gr => !cal.frozen && FLOWERS[gr.type].sow.includes(cal.month) && gr.g > 0;
  const nowCards = groups.filter(isNow).map(card).join(''), laterCards = groups.filter(g0 => !isNow(g0)).map(card).join('');
  const total = groups.reduce((a, g0) => a + g0.ids.length, 0), nowN = groups.filter(isNow).reduce((a, g0) => a + g0.ids.length, 0);
  const soonN = groups.filter(g0 => !g0.packaged && g0.g > 0 && g0.ageH >= 10 * E.MONTH_H).reduce((a, g0) => a + g0.ids.length, 0);
  const rows = nowCards || laterCards;
  // 도착할 것: 번식 중(뿌리 내리는 중)과 예약 배송을 작은 카드로
  const arrive = (k, n, tag, tagCls, when, sub) => { const F = FLOWERS[k]; return `<div class="arcard" style="--pc:${F.petal}">
      <span class="ar-art">${spriteImg(k, 'flower', 36, false, F.name)}<span class="ar-n">×${n}</span></span>
      <span class="ar-main"><b>${F.name} <span class="muted">${FORM[F.form].name}</span></b><span class="ar-tag ${tagCls}">${tag}</span></span>
      <span class="ar-when"><b>${when}</b><small>${sub}</small></span></div>`; };
  const pend = st.pending.map(p => arrive(p.type, p.qs.length, `🌱 ${p.method}`, 'grow', `${flowH(Math.max(0, p.dueH))} 뒤`, '뿌리 내리는 중')).join('');
  const resv = st.reservations.filter(r => !r.done).map(r => arrive(r.type, r.qty, '🗓️ 예약', 'resv', `${monthName(MONTHS[r.deliverIdx])} 1일`, `${relYear(r.year)} · 특수 포장`)).join('');
  $('#p-store').innerHTML = `<div class="stack">
    <div class="shop-news">
      <span><b>🌰 ${total}개</b> ${groups.length ? `${new Set(groups.map(g0 => g0.type)).size}가지 꽃` : '비어 있어요'}</span>
      <span>${cal.frozen ? '🌙 꽃잠에는 품질이 그대로예요' : '한 달에 품질 5%씩 줄어요'}</span>
      ${soonN ? `<span class="warn">⏳ 곧 시들 것 <b>${soonN}개</b></span>` : ''}</div>
    <div class="cab-head"><span class="sb-title">🧺 정원 용품</span><span class="muted">누르면 살 수 있어요</span></div>
    <div class="suptiles">${Object.entries(E.SUPPLIES).map(([k, S]) => {
      const n = st[k] || 0, low = n <= (S.per > 1 ? S.per / 2 : 3);   // 얼마 안 남으면 주황
      return `<button type="button" class="suptile ${n ? (low ? 'low' : '') : 'empty'}" data-sup="${k}" title="${S.desc}"><span class="si">${S.icon}</span><b>${S.name}</b><small>${n ? `${n}${S.unit} 남음` : '다 썼어요'}</small><span class="sp" aria-hidden="true">+</span></button>`;
    }).join('')}</div>
    ${pend || resv ? `<div class="cab-head"><span class="sb-title">🚚 도착할 것</span><span class="muted">때가 되면 창고로 들어와요</span></div><div class="argrid">${pend}${resv}</div>` : ''}
    ${rows ? `
    <div class="cab-head"><span class="sb-title">🌰 지금 심을 수 있어요 <span class="sh-n">${nowN}</span></span>
      <span class="right"><select id="storeSort" class="plantsel" aria-label="정렬"><option value="flower">꽃별</option><option value="month">심는 달별</option><option value="quality">품질별</option><option value="got">받은 날짜별</option></select></span></div>
    ${nowCards ? `<div class="shopgrid">${nowCards}</div>` : `<div class="cab-empty slim"><span>🌱</span><div class="muted">${cal.frozen ? '꽃잠에는 심을 수 없어요' : `${monthName(cal.month)}에 심는 꽃이 창고에 없어요`}</div></div>`}
    ${laterCards ? `<div class="cab-head"><span class="sb-title">📦 나중에 심을 것 <span class="sh-n">${total - nowN}</span></span><span class="muted">심는 때가 오면 위로 올라가요</span></div><div class="shopgrid">${laterCards}</div>` : ''}`
    : '<div class="cab-empty"><span>📦</span><div><b>창고가 비어 있어요</b><br><span class="muted">화원에서 제철 꽃을 사면 여기에 들어와요</span></div><button type="button" class="btn small primary" data-go="shop">💐 화원</button></div>'}</div>`;
  const ss = $('#storeSort'); if (ss) ss.value = ui.storeSort;   // 창고가 비면 정렬 칸이 없음
}
$('#p-store').addEventListener('change', e => { if (e.target.id === 'storeSort') { ui.storeSort = e.target.value; renderStore(true); } });
$('#p-store').addEventListener('click', e => {
  const s = e.target.closest('[data-sup]'); if (s) return openSupply(s.dataset.sup);
  const c = e.target.closest('[data-compost]'); if (c) return openCompost(c.dataset.compost.split(',').map(Number));
  const b = e.target.closest('[data-plant]'); if (!b) return;
  ui.tool = 'plant'; ui.plantType = b.dataset.plant; setTab('garden', true);
});
// 비료로 만들기 확인 창 (P06-16): 씨앗·묘목 › 비료, 몇 개 바꿀지 −/+
function openCompost(ids, n) {
  const list = st.items.filter(it => ids.includes(it.id) && E.compostable(it));
  if (!list.length) return;
  const it = list[0], F = FLOWERS[it.type]; n = Math.max(1, Math.min(list.length, n || list.length));
  const body = `<div class="rc">
    <div class="rc-item tc-item" style="--pc:${F.petal}"><span class="rc-art tc-pair">${spriteImg(it.type, 'form', 34, false, F.name)}<span class="sc-to">›</span><span class="cp-fert">🌱</span></span>
      <span class="rc-main"><b>${F.name} ${FORM[F.form].name} → 비료</b><small>품질 ${E.pct(it.q)}% · 받은 지 10달이 넘었어요 · ${list.length}개 중</small></span>
      <span class="stepper"><button type="button" data-cq="-" ${n <= 1 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-cq="+" ${n >= list.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>
    <div class="rc-pay"><div><span class="muted">가진 비료</span><span class="data">${st.fert || 0}개</span></div><div><span class="muted">만든 뒤</span><b class="data">${(st.fert || 0) + n}개</b></div></div>
    <div class="rc-notes"><span>🌱 품질 5% 이하로 떨어진 씨앗·묘목은 1개가 비료 1개가 돼요</span></div></div>`;
  openModal('🌱 비료', body, [
    { label: '취소', act: () => closeModal() },
    { label: `비료 · ${n}개`, primary: true, act: () => { closeModal(); after(E.compostItems(st, list.slice(0, n).map(x => x.id))); } },
  ]);
  $('#modalRoot').querySelectorAll('[data-cq]').forEach(b => b.onclick = () => openCompost(ids, n + (b.dataset.cq === '+' ? 1 : -1)));
}
// 정원 용품 사기 (P13-07): 창고의 용품 칩을 누르면 뜨는 작은 창
// 위에 용품 고르기 줄 → 그림과 설명 → 수량 → 사기 전/후 영수증
function openSupply(k, n) {
  const S = E.SUPPLIES[k]; n = Math.max(1, Math.min(20, n || 1));
  const have = st[k] || 0, cost = S.price * n, short = st.money < cost;
  const body = `<div class="sup-pop">
    <div class="sup-tabs" role="tablist">${Object.entries(E.SUPPLIES).map(([kk, T]) => `<button type="button" role="tab" class="sup-tab ${(st[kk] || 0) ? '' : 'empty'}" data-st="${kk}" aria-selected="${kk === k}"><span>${T.icon}</span><em>${T.name}</em></button>`).join('')}</div>
    <div class="sup-hero"><span class="sup-art">${S.icon}</span>
      <div><b class="sup-name">${S.name}</b><span class="sup-desc">${S.desc}</span>
        <span class="sup-price"><b class="data">${won(S.price)}</b> · 1개로 ${S.per}번</span></div></div>
    <div class="sup-qty">
      <span class="sup-step"><button type="button" data-sq="-" ${n <= 1 ? 'disabled' : ''} aria-label="줄이기">−</button><b class="data">${n}<small>개</small></b><button type="button" data-sq="+" ${n >= 20 ? 'disabled' : ''} aria-label="늘리기">+</button></span>
      <span class="sup-quick">${[1, 5, 10].map(q => `<button type="button" data-sq="${q}" aria-pressed="${q === n}">${q}개</button>`).join('')}</span></div>
    <div class="sup-bill">
      <div><span>${S.icon} 가진 ${S.unit === '번' ? '횟수' : '개수'}</span><span class="data">${have}${S.unit} <i>→</i> <b>${have + S.per * n}${S.unit}</b></span></div>
      <div><span>💰 가진 돈</span><span class="data ${short ? 'bad' : ''}">${won(st.money)} <i>→</i> <b>${short ? '모자라요' : won(st.money - cost)}</b></span></div></div></div>`;
  openModal('🧺 정원 용품 구매', body, [
    { label: '닫기', act: () => closeModal() },
    { label: short ? `${won(cost - st.money)} 모자라요` : `구매 · ${won(cost)}`, primary: true, act: () => { if (short) return; closeModal(); after(E.buySupply(st, k, n)); } },
  ]);
  const root = $('#modalRoot'), buy = root.querySelector('[data-mb="1"]');
  if (short) buy.disabled = true;
  root.querySelectorAll('[data-sq]').forEach(b => b.onclick = () => {
    const v = b.dataset.sq; openSupply(k, v === '+' ? n + 1 : v === '-' ? n - 1 : +v);
  });
  root.querySelectorAll('[data-st]').forEach(b => b.onclick = () => openSupply(b.dataset.st));
}

// ---------------------------------------------------------------- 🍵 찻집 (P12, P17)
// 티백 · 생차 확인 창 (P12-03, P12-10): 꽃마다 한 줄 (꽃잎 › 티백/찻잔 · ★ · 🏷️ 햇차 · −/+)
// mode: false = 꽃잎 → 티백, true = 말린 꽃잎 → 티백, 'raw' = 꽃잎 → 생차(바로 찻집)
function openTeaConfirm(ids, mode, counts) {
  const dried = mode === true, raw = mode === 'raw';
  const cal = E.calendar(st.virtual), src = (dried ? st.dried : st.petals).filter(p => ids.includes(p.id));
  if (!src.length) return;
  const fresh = () => false;   // 제철 보너스 없앰 (10-06)
  const key = p => [p.type, fresh(p), E.isHat(p.q)].join('|');
  const groups = groupType(src, key);
  // 줄마다 몇 개 만들지 (기본은 전부). 고른 수만큼 품질이 좋은 꽃잎부터 써요
  counts = counts || Object.fromEntries(groups.map(g => [key(g), g.ids.length]));
  const pick = groups.flatMap(g => src.filter(p => g.ids.includes(p.id)).sort((x, y) => y.q - x.q).slice(0, counts[key(g)]).map(p => p.id));
  const what = '티백';
  const body = `<div class="rc">
    <div class="rc-list">${groups.map(g => { const F = FLOWERS[g.type], fr = fresh(g), k = key(g), n = counts[k], hat = E.isHat(g.q); return `<div class="rc-item tc-item ${n ? '' : 'off'}" style="--pc:${SPR.tea[g.type] || F.petal}">
      <span class="rc-art tc-pair">${spriteImg(g.type, dried ? 'dried' : 'petal', 26, false, '')}<span class="sc-to">›</span>${spriteImg(g.type, 'teabag', 34, false, `${F.name} ${what}`)}</span>
      <span class="rc-main"><b>${F.name} ${raw ? '생화 티백' : '티백'}${hat ? ' <span class="chip hat-chip">🍃 햇차</span>' : ''}${fr ? ' <span class="chip fresh-chip">✨ 제철</span>' : ''}</b>
        <small><span class="stars">${starStr(g.q)}</span> · ${dried ? '말린 ' : ''}${F.name} 꽃잎 ${g.ids.length}장 중</small></span>
      <span class="stepper"><button type="button" data-tq="${k}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-tq="${k}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span>
      </div>`; }).join('')}</div>
    <div class="rc-notes">${raw ? '<span>🌸 생화 티백: 말리지 않고 바로 티백으로 · <b class="val-down">값 −10%</b> (말린 꽃잎 티백보다 조금 싸요)</span><span>🏷️ 티백이 되는 순간 지금 품질 그대로 멈춰요 · 생화로 두면 <b class="val-down">한 달에 20%씩 줄어요</b></span>' : `<span>🏷️ 만드는 순간의 꽃잎 품질 그대로 티백이 되고, 그 뒤로 품질이 줄지 않아요</span><span>🍵 티백은 찻집으로 가서 한 잔씩 우려 팔아요</span>`}<span>🍃 ★5 꽃잎은 햇차가 돼요 · <b class="val-up">값 +10%</b></span>${pick.length < src.length ? `<span>남는 꽃잎 ${src.length - pick.length}장은 그대로 ${dried ? '꽃방' : '제다실'}에 있어요 · 좋은 꽃잎부터 써요</span>` : ''}</div></div>`;
  openModal(raw ? '🌸 생화 티백' : '🏷️ 티백', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `티백 · ${pick.length}개` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(raw ? E.makeRaw(st, pick, ctx) : dried ? E.makeTeaDried(st, pick, ctx) : E.makeTea(st, pick, ctx), null, { label: '🍵 찻집', fn: () => setTab('cab') }); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-tq]').forEach(b => b.onclick = () => {
    const parts = b.dataset.tq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => key(x) === k);
    openTeaConfirm(ids, mode, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 꽃방에 널기 확인 창 (P12-07): 꽃마다 한 줄 (꽃잎 › 말린 꽃잎 · ★ · −/+), 고른 수만큼 품질 좋은 꽃잎부터
function openDryConfirm(ids, counts) {
  const cal = E.calendar(st.virtual), src = st.petals.filter(p => ids.includes(p.id));
  if (!src.length) return;
  const groups = groupType(src, p => p.type);
  counts = counts || Object.fromEntries(groups.map(g => [g.type, g.ids.length]));
  const pick = groups.flatMap(g => src.filter(p => g.ids.includes(p.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.type]).map(p => p.id));
  const body = `<div class="rc">
    <div class="rc-list">${groups.map(g => { const F = FLOWERS[g.type], n = counts[g.type]; return `<div class="rc-item tc-item ${n ? '' : 'off'}" style="--pc:${mixHex(F.petal, '#b49a74', 0.45)}">
      <span class="rc-art tc-pair">${spriteImg(g.type, 'petal', 30, false, '')}<span class="sc-to">›</span>${spriteImg(g.type, 'dried', 30, false, '')}</span>
      <span class="rc-main"><b>${F.name}</b><small><span class="stars">${starStr(g.q)}</span> · 꽃잎 ${g.ids.length}장 중</small></span>
      <span class="stepper"><button type="button" data-dq="${g.type}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-dq="${g.type}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>🌾 널어 두면 지금 품질 그대로 멈추고, 흐르는 시간 1달 뒤 다 말라요${cal.frozen ? ' (꽃잠 동안은 마르지 않아요)' : ''}</span><span>🫖 말린 꽃잎은 꽃잠에 블렌딩할 수 있어요 · 다시 꽃잎으로 되돌릴 수는 없어요</span>${pick.length < src.length ? `<span>남는 꽃잎 ${src.length - pick.length}장은 그대로 있어요 · 좋은 꽃잎부터 널어요</span>` : ''}</div></div>`;
  openModal('🌾 건조', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `건조 · ${pick.length}장` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.dryPetals(st, pick)); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-dq]').forEach(b => b.onclick = () => {
    const [t, d] = b.dataset.dq.split('|'), g = groups.find(x => x.type === t);
    openDryConfirm(ids, { ...counts, [t]: Math.max(0, Math.min(g.ids.length, counts[t] + (d === '+' ? 1 : -1))) });
  });
}
// 팔기 확인 창 (P17-01): 파는 차마다 한 줄 (찻잔 · 이름 ×개수 · ★ · 한 잔 값 · 합) + 받을 돈과 가진 돈 변화
function openSellConfirm(cupIds, counts) {   // 판매는 ☕ 찻잔에서만 (P17-10)
  const cal = E.calendar(st.virtual), cups = (st.cups || []).filter(c => cupIds.includes(c.id));
  if (!cups.length) return;
  const val = c => E.cupValue(st, c, cal);
  const ckey = c => [c.kind, c.kind === 'blend' ? c.name : c.type, c.kind === 'tea' && E.isFresh(st, c, cal), !!c.hat, !!c.raw, E.cupCold(c, cal)].join('|');
  const groups = groupType(cups, ckey).map(g => ({ ...g, k: ckey(g), fresh: g.kind === 'tea' && E.isFresh(st, g, cal), cold: E.cupCold(g, cal) })).sort((a, b) => a.cold - b.cold);
  // 줄마다 몇 잔 팔지 (기본은 전부). 고른 수만큼 품질 좋은 찻잔부터
  counts = counts || Object.fromEntries(groups.map(g => [g.k, g.ids.length]));
  const best = g => cups.filter(x => g.ids.includes(x.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.k]);
  const pick = groups.flatMap(best);
  const total = pick.reduce((a, c) => a + val(c), 0);
  const step = g => `<span class="stepper"><button type="button" data-sq2="${g.k}|-" ${counts[g.k] <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${counts[g.k]}</span><button type="button" data-sq2="${g.k}|+" ${counts[g.k] >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span>`;
  const body = `<div class="rc">
    <div class="rc-list sell-list">${groups.map(g => { const c = g, vs = cups.filter(x => g.ids.includes(x.id)).map(val), sum = best(g).reduce((a, x) => a + val(x), 0);
      return `<div class="rc-item sell-item ${counts[g.k] ? '' : 'off'}"><span class="rc-art">${spriteImg(c.kind === 'blend' ? c.parts[0] : c.type, 'tea', 40, false, '')}</span>
        <span class="rc-main"><b>${c.kind === 'blend' ? `${c.recipe ? '✨ ' : ''}${c.name}` : FLOWERS[c.type].tea}${c.kind === 'blend' ? ' <span class="chip fresh-chip blend-chip">🫖 블렌드</span>' : teaTags(g, true)}${g.cold ? ' <span class="chip cold-chip">🧊 식은 차 −50%</span>' : ''}</b><small><span class="stars">${starStr(g.q)}</span> · 한 잔 ${wonRange(Math.min(...vs), Math.max(...vs))} · ${g.ids.length}잔 중</small></span>
        <span class="sell-r">${step(g)}<span class="data">${won(sum)}</span></span></div>`; }).join('')}</div>
    <div class="rc-total"><div class="rc-sum"><b>받을 돈</b><b class="data good">+${won(total)}</b></div></div>
    <div class="rc-pay"><div><span class="muted">가진 돈</span><span class="data">${won(st.money)}</span></div><div><span class="muted">판 뒤</span><b class="data">${won(st.money + total)}</b></div></div></div>`;
  openModal('💰 찻잔 판매', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `판매 · ${pick.length}잔 · ${won(total)}` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.sellCups(st, pick.map(c => c.id), ctx), 'sold'); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-sq2]').forEach(b => b.onclick = () => {
    const parts = b.dataset.sq2.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => x.k === k);
    openSellConfirm(cupIds, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 블렌드 → 티백 확인 창 (P12-11)
function openBagBlend(ids, counts) {
  const list = st.blends.filter(x => ids.includes(x.id) && !x.bagged);
  if (!list.length) return;
  const key = x => x.name, groups = groupType(list, key);
  counts = counts || Object.fromEntries(groups.map(g => [key(g), g.ids.length]));
  const pick = groups.flatMap(g => list.filter(x => g.ids.includes(x.id)).sort((a, b) => b.q - a.q).slice(0, counts[key(g)]).map(x => x.id));
  const body = `<div class="rc"><div class="rc-list">${groups.map(g => { const n = counts[key(g)]; return `<div class="rc-item tc-item ${n ? '' : 'off'}"><span class="rc-art tc-pair">${spriteImg(g.parts[0], 'tea', 28, false, '')}<span class="sc-to">›</span>${spriteImg(g.parts[0], 'teabag', 32, false, '')}</span>
      <span class="rc-main"><b>${g.recipe ? '✨ ' : ''}${g.name} 티백</b><small><span class="stars">${starStr(g.q)}</span> · ${g.parts.map(p => FLOWERS[p].name).join(' + ')} · ${g.ids.length}개 중</small></span>
      <span class="stepper"><button type="button" data-gq="${key(g)}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-gq="${key(g)}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>🏷️ 블렌드 티백은 찻집으로 가서 🫖 우려 팔아요 · 이름 있는 블렌드는 티백 도감에도 등록돼요</span></div></div>`;
  openModal('🏷️ 블렌드 티백', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `티백 · ${pick.length}개` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.bagBlends(st, pick, ctx), null, { label: '🍵 찻집', fn: () => setTab('cab') }); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-gq]').forEach(b => b.onclick = () => { const parts = b.dataset.gq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => key(x) === k); openBagBlend(ids, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) }); });
}
// 우림 확인 창 (P17-10): 티백 › 찻잔 / 생차 · 블렌드도. 줄마다 −/+, 버튼 "우림 · ○잔"
function openBrewConfirm(teaIds, blendIds, counts) {
  const cal = E.calendar(st.virtual), teas = st.teas.filter(t => teaIds.includes(t.id)), blends = st.blends.filter(x => blendIds.includes(x.id));
  if (!teas.length && !blends.length) return;
  const tkey = t => ['t', t.type, E.isFresh(st, t, cal), !!t.hat, !!t.raw].join('|'), bkey = x => ['b', x.name].join('|');
  const groups = [...groupType(teas, tkey).map(g => ({ ...g, k: tkey(g), fresh: E.isFresh(st, g, cal) })), ...groupType(blends, bkey).map(g => ({ ...g, k: bkey(g) }))];
  counts = counts || Object.fromEntries(groups.map(g => [g.k, g.ids.length]));
  const best = (list, g) => list.filter(x => g.ids.includes(x.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.k]).map(x => x.id);
  const pickT = groups.filter(g => g.k[0] === 't').flatMap(g => best(teas, g)), pickB = groups.filter(g => g.k[0] === 'b').flatMap(g => best(blends, g));
  const n = pickT.length + pickB.length;
  const body = `<div class="rc">
    <div class="rc-list sell-list">${groups.map(g => { const isB = g.k[0] === 'b', F = isB ? null : FLOWERS[g.type], c = counts[g.k];
      return `<div class="rc-item tc-item ${c ? '' : 'off'}"><span class="rc-art tc-pair">${spriteImg(isB ? g.parts[0] : g.type, 'teabag', 28, false, '')}<span class="sc-to">›</span>${spriteImg(isB ? g.parts[0] : g.type, 'tea', 32, false, '')}</span>
        <span class="rc-main"><b>${isB ? `${g.recipe ? '✨ ' : ''}${g.name} <span class="chip fresh-chip blend-chip">🫖 블렌드</span>` : `${F.tea}${teaTags(g)}`}</b><small><span class="stars">${starStr(g.q)}</span> · ${isB ? '블렌드 티백' : g.raw ? '생화 티백' : '티백'} ${g.ids.length}개 중</small></span>
        <span class="stepper"><button type="button" data-bq="${g.k}|-" ${c <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${c}</span><button type="button" data-bq="${g.k}|+" ${c >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>☕ 우린 차는 찻잔으로 가서 바로 팔 수 있어요</span><span>🧊 찻잔은 우린 달이 지나면 식어서 <b class="val-down">값이 반</b>이 돼요 · 팔 만큼만 우려요</span></div></div>`;
  openModal('🫖 우림', body, [
    { label: '취소', act: () => closeModal() },
    { label: n ? `우림 · ${n}잔` : '선택 없음', primary: true, act: () => { if (!n) return; closeModal(); after(E.brew(st, pickT, pickB)); } },
  ]);
  const root = $('#modalRoot');
  if (!n) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-bq]').forEach(b => b.onclick = () => {
    const parts = b.dataset.bq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => x.k === k);
    openBrewConfirm(teaIds, blendIds, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 블렌딩 확인 창 (P12-08): 재료 말린 꽃잎 → 블렌드 찻잔, 이름 · ★ · 값, 처음 만드는 이름 있는 블렌드면 도감 안내
function openBlendConfirm() {
  const sel = ui.blendSel.map(id => st.dried.find(p => p.id === id)).filter(Boolean);
  if (sel.length < 2) return;
  const parts = sel.map(p => p.type), recipe = E.blendRecipe(parts, st), q = sel.reduce((a, p) => a + p.q, 0) / sel.length;
  const name = recipe ? E.BLENDS[recipe].name : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`, val = E.blendValue({ parts, q, recipe });
  const sep = sel.reduce((a, p) => a + E.teaValue(FLOWERS[p.type], p.q, false), 0);
  const body = `<div class="rc">
    <div class="bc-hero" style="--pc:${SPR.tea[parts[0]] || FLOWERS[parts[0]].petal}">
      <div class="bc-parts">${sel.map(p => `<span class="bc-part">${spriteImg(p.type, 'dried', 36, false, '')}<small>${FLOWERS[p.type].name}</small></span>`).join('<b class="bc-plus">+</b>')}</div>
      <span class="bc-arrow">↓</span>
      <div class="bc-out">${spriteImg(parts[0], 'tea', 56, false, name)}<div><b>${recipe ? '✨ ' : ''}${name}</b><span class="stars">${starStr(q)}</span></div></div></div>
    <div class="rc-notes">${recipe && st.dex.blend[recipe] == null ? '<span>📖 처음 만드는 블렌드예요 · 도감에 등록돼요</span>' : !recipe ? `<span>📖 이름 있는 블렌드는 레시피 ${E.blendKeys(st).length}가지예요 · 이건 재료 이름으로 불러요</span>` : ''}<span>🫖 말린 꽃잎 ${sel.length}장이 들어가요 · 따로 차로 만들 때보다 <b class="val-up">값이 ${recipe ? '1.5배 · 📖 레시피' : '1.2배'}</b></span></div></div>`;
  openModal('🫖 블렌딩', body, [
    { label: '취소', act: () => closeModal() },
    { label: `🫖 블렌딩 · ${sel.length}장`, primary: true, act: () => { closeModal(); const r = E.blend(st, ui.blendSel, ctx); if (r.ok) ui.blendSel = []; after(r, 'blended'); } },
  ]);
}
function groupBy(list, keyFn) {
  const m = new Map();
  for (const x of list) { const k = keyFn(x); if (!m.has(k)) m.set(k, { ...x, ids: [] }); m.get(k).ids.push(x.id); }
  return [...m.values()];
}
// 차 꼬리표: 🌸 생화 티백 (−10%) · 🍃 햇차 (★5 꽃잎, +10%) (✨ 제철은 10-06에 없앰)
const teaTags = (t, pct) => `${t.raw ? ` <span class="chip raw-chip">🌸 생화${pct ? ' −10%' : ''}</span>` : ''}${t.hat ? ` <span class="chip hat-chip">🍃 햇차${pct ? ' +10%' : ''}</span>` : ''}`;
// 같은 꽃은 한 장으로 묶고 품질은 범위로 (★은 가장 좋은 것, 값은 "1,040~1,200원")
function groupType(list, keyFn) {
  return groupBy(list, keyFn).map(g => { const qs = list.filter(x => g.ids.includes(x.id)).map(x => x.q); return { ...g, q: Math.max(...qs), qMin: Math.min(...qs) }; });
}
const wonRange = (lo, hi) => Math.round(lo / 10) === Math.round(hi / 10) ? won(hi) : `${won(lo).replace('원', '')}~${won(hi)}`;
function renderCab(force) {
  const cal = E.calendar(st.virtual);
  const petals = groupType(st.petals, p => p.type);
  const teas = groupType(st.teas, t => [t.type, E.isFresh(st, t, cal), !!t.hat, !!t.raw].join('|')).map(t => ({ ...t, fresh: E.isFresh(st, t, cal) })).sort((a, b) => b.raw - a.raw || b.hat - a.hat || b.fresh - a.fresh);   // 티백 먼저
  const dried = groupType(st.dried, p => p.type);
  ui.blendSel = (ui.blendSel || []).filter(id => st.dried.some(p => p.id === id));
  const sig = JSON.stringify([st.money, cal.frozen, cal.idx >= 10, E.teaShopOpen(cal) ? 0 : realH(E.hoursToShopOpen(st.virtual) / (st.speed || 1)), petals.map(p => [p.type, E.pct(p.q), p.ids.length]), teas.map(t => [t.type, E.pct(t.q), t.fresh, t.ids.length]),
    st.drying.map(d => [d.id, flowH(Math.max(0, d.leftH))]), dried.map(d => [d.type, E.pct(d.q), d.ids.length]), st.blends.map(b => [b.id, !!b.bagged]), (st.cups || []).map(c => [c.id, E.cupCold(c, cal)]), Math.floor((st.cupTimerH || 0) * 60), ui.blendSel, ui.dryTab]);
  if (!force && ui.sigs.cab === sig) return;
  ui.sigs.cab = sig;
  const shopOpen = E.teaShopOpen(cal);   // P17-09 찻집은 겨울(12월)부터 꽃잠까지
  const teaTotal = st.teas.reduce((a, t) => a + E.teaItemValue(st, t, cal), 0) + st.blends.reduce((a, b) => a + E.blendValue(b), 0);
  // 꽃잎: 차로 만들거나 꽃방에 널기
  const petalCards = petals.map(p => { const F = FLOWERS[p.type]; return `<div class="shopcard cabcard" style="--pc:${F.petal}">
      <div class="sc-art">${spriteImg(p.type, 'petal', 52, false, F.name)}<span class="sc-count">×${p.ids.length}</span>${p.qMin <= 0.2 ? '<span class="sc-last" title="다음 달엔 비료가 돼요">곧 시들어요</span>' : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(p.q)}</span></div>
      <div class="cc-acts"><button type="button" class="btn primary" data-dry="${p.ids.join(',')}">🌾 건조</button><button type="button" class="btn" data-raw="${p.ids.join(',')}">🏷️ 티백</button></div></div>`; }).join('');
  // 🌾 꽃방 (P12-07): 말리는 중 · 말린 꽃잎
  // 🌾 꽃방 꽃잎별 탭: 전체 · 라벤더 3 · 장미 2 … (말리는 중 + 말린 꽃잎 수)
  const dryTypes = FLOWER_KEYS.filter(k => st.drying.some(d => d.type === k));   // 꽃방엔 말리는 중만 (다 마르면 찻집으로)
  if (!dryTypes.includes(ui.dryTab)) ui.dryTab = 'all';
  const dryN = k => st.drying.filter(d => d.type === k).length;
  const dryShow = k => ui.dryTab === 'all' || ui.dryTab === k;
  const dryTabs = dryTypes.length > 1 ? `<div class="dexchips dry-tabs" role="tablist" aria-label="꽃방 꽃잎">${[['all', '전체', st.drying.length], ...dryTypes.map(k => [k, FLOWERS[k].name, dryN(k)])].map(([k, nm, n]) => `<button type="button" class="dexchip" role="tab" data-drt="${k}" aria-pressed="${ui.dryTab === k}">${k === 'all' ? '' : spriteImg(k, 'dried', 18, false, '')}<span>${nm}</span><span class="data">${n}</span></button>`).join('')}</div>` : '';
  // 말리는 중은 같은 꽃 · 같은 진행(5% 단위)이면 한 장 (×개수)
  const dryGroups = groupBy(st.drying.filter(d => dryShow(d.type)), d => [d.type, Math.round((1 - d.leftH / E.DRY_H) * 20)].join('|'));
  const dryingCards = dryGroups.map(d => { const F = FLOWERS[d.type], pr = Math.round((1 - d.leftH / E.DRY_H) * 100); return `<div class="shopcard cabcard drying" style="--pc:${F.petal}">
      <div class="sc-art">${spriteImg(d.type, 'petal', 52, false, F.name)}<span class="chip sc-form">말리는 중</span>${d.ids.length > 1 ? `<span class="sc-count">×${d.ids.length}</span>` : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(d.q)}</span></div>
      <div class="cc-q"><span class="qbar"><i style="width:${pr}%;background:#b49a74"></i></span><span class="data">${pr}%</span></div>
      <div class="cc-meta">${cal.frozen ? '꽃잠에는 쉬어요' : `${flowH(Math.max(0, d.leftH))} 뒤 다 말라요`}</div></div>`; }).join('');
  const driedCards = dried.map(d => {
    const F = FLOWERS[d.type], selN = d.ids.filter(id => ui.blendSel.includes(id)).length, canSel = selN < d.ids.length && ui.blendSel.length < 3 && !ui.blendSel.some(id => st.dried.find(p => p.id === id).type === d.type);
    return `<div class="shopcard cabcard driedcard ${selN ? 'picked' : ''}" style="--pc:${mixHex(F.petal, '#b49a74', 0.45)}">
      <div class="sc-art">${spriteImg(d.type, 'dried', 52, false, F.name)}<span class="chip sc-form">말린 꽃잎</span><span class="sc-count">×${d.ids.length}</span></div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(d.q)}</span></div>
      <div class="cc-acts"><button type="button" class="btn primary" data-bsel="${d.type}" ${canSel ? '' : 'disabled'}>${selN ? '✓ 블렌딩' : '🫖 블렌딩'}</button><button type="button" class="btn" data-makedried="${d.ids.join(',')}">🏷️ 티백</button></div></div>`;
  }).join('');
  // 🫖 블렌딩 (P12-08): 언제든 (10-06)
  const sel = ui.blendSel.map(id => st.dried.find(p => p.id === id)), parts = sel.map(p => p.type);
  const recipe = parts.length >= 2 ? E.blendRecipe(parts, st) : null, avg = sel.length ? sel.reduce((a, p) => a + p.q, 0) / sel.length : 0;
  const previewVal = parts.length >= 2 ? E.blendValue({ parts, q: avg, recipe }) : 0;
  // 한 줄: 재료 칸 세 개 → 결과 → 블렌딩하기. 레시피는 접어 둠
  const gotN = E.blendKeys(st).filter(k => st.dex.blend[k] != null).length;
  // 레시피: 말린 꽃잎이 다 있는 것은 "지금 만들 수 있어요"로 맨 앞, 누르면 재료 칸에 담김 (10-06)
  const haveDried = new Set(st.dried.map(p => p.type)), canMake = k => E.BLENDS[k].parts.every(p => haveDried.has(p));
  const recKeys = E.blendKeys(st).slice().sort((x, y) => canMake(y) - canMake(x)), readyN = E.blendKeys(st).filter(canMake).length;
  const bookHTML = `<details class="bl-book"${ui.bookOpen ?? readyN > 0 ? ' open' : ''}><summary>📖 레시피 <span class="data">${gotN} / ${E.blendKeys(st).length}</span>${readyN ? ` · <b class="val-up">지금 만들 수 있어요 ${readyN}</b>` : ''}</summary>
        <div class="bl-recs">${recKeys.map(k => { const B = E.BLENDS[k], got = st.dex.blend[k] != null, ok = canMake(k), inner = `${got ? '✓ ' : ''}<b>${B.name}</b> <small>${B.parts.map(p => FLOWERS[p].name).join(' + ')}</small>`; return ok ? `<button type="button" class="bl-rec ready ${got ? 'got' : ''} ${recipe === k ? 'on' : ''}" aria-pressed="${recipe === k}" data-recipe="${k}" title="재료를 블렌딩 칸에 담아요">🫖 ${inner}</button>` : `<span class="bl-rec ${got ? 'got' : ''}">${inner}</span>`; }).join('')}</div></details>`;
  const blendBox = true ? `
    <div class="cab-head" id="tr-blend"><span class="sb-title">🫖 블렌딩</span><span class="muted">말린 꽃잎 2~3가지</span></div>
    <div class="blendbox">
      <div class="bl-row">
        <div class="bl-slots">${[0, 1, 2].map(i => sel[i] ? `<button type="button" class="bl-slot on" data-bunsel="${sel[i].id}" title="${FLOWERS[sel[i].type].name} 빼기" style="--pc:${FLOWERS[sel[i].type].petal}">${spriteImg(sel[i].type, 'dried', 32, false, '')}<small>${FLOWERS[sel[i].type].name}</small></button>` : `<span class="bl-slot ${i < 2 ? '' : 'opt'}" ${i < 2 ? '' : 'title="세 번째는 넣어도, 안 넣어도 돼요"'}>+${i < 2 ? '' : '<small>더</small>'}</span>`).join('')}</div>
        <span class="bl-arrow" aria-hidden="true">→</span>
        <div class="bl-out">${parts.length >= 2 ? `<b>${recipe ? `✨ ${E.BLENDS[recipe].name}` : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`}</b><span><span class="stars">${starStr(avg)}</span></span>` : `<span class="muted">${!st.dried.length ? '꽃방에서 말린 꽃잎이 있어야 해요' : readyN ? '말린 꽃잎의 🫖 블렌딩이나 아래 레시피를 눌러요' : '위 말린 꽃잎에서 🫖 블렌딩을 눌러요'}</span>`}</div>
        <button type="button" class="btn primary" data-blend="1" ${parts.length >= 2 ? '' : 'disabled'}>블렌딩</button>
      </div>
      ${bookHTML}
    </div>` : '';
  // 🏷️ 티백 (찻집): 생화 티백 · 티백 · 블렌드 티백 → 🫖 우림
  const bagged = st.blends.filter(x => x.bagged), loose = st.blends.filter(x => !x.bagged);
  const teaCards = teas.map(t => { const F = FLOWERS[t.type]; return `<div class="shopcard cabcard teacard ${t.raw ? 'raw' : ''} ${t.hat ? 'hat' : ''}" style="--pc:${SPR.tea[t.type] || F.petal}">
      <div class="sc-art"><span class="sc-pair">${spriteImg(t.type, 'teabag', 52, false, `${F.name} 티백`)}<span class="sc-to" aria-hidden="true">›</span><span class="sc-bloom">${spriteImg(t.type, 'tea', 30, false, F.tea)}</span></span><span class="chip sc-form">${t.raw ? '🌸 생화 티백' : '🏷️ 티백'}</span><span class="sc-count">×${t.ids.length}</span></div>
      <div class="cc-name"><b>${F.tea}</b><span class="stars">${starStr(t.q)}</span></div>
      ${t.hat || t.fresh ? `<div class="cc-meta">${teaTags({ ...t, raw: false })}</div>` : ''}
      <button type="button" class="btn primary" data-brew="${t.ids.join(',')}" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 우림' : '🔒 준비 중'}</button></div>`; }).join('')
    + bagged.map(b => `<div class="shopcard cabcard teacard blendcard" style="--pc:${SPR.tea[b.parts[0]] || FLOWERS[b.parts[0]].petal}">
      <div class="sc-art"><span class="sc-pair">${spriteImg(b.parts[0], 'teabag', 52, false, `${b.name} 티백`)}<span class="sc-to" aria-hidden="true">›</span><span class="sc-bloom">${spriteImg(b.parts[0], 'tea', 30, false, b.name)}</span></span><span class="chip sc-form blend">🫖 블렌드 티백</span></div>
      <div class="cc-name"><b>${b.recipe ? '✨ ' : ''}${b.name}</b><span class="stars">${starStr(b.q)}</span></div>
      <button type="button" class="btn primary" data-brewblend="${b.id}" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 우림' : '🔒 준비 중'}</button></div>`).join('');
  // 🫖 블렌드 (제다실): 아직 티백이 아닌 블렌드 → 🏷️ 티백
  const looseCards = loose.map(b => `<div class="shopcard cabcard teacard blendcard" style="--pc:${SPR.tea[b.parts[0]] || FLOWERS[b.parts[0]].petal}">
      <div class="sc-art"><span class="blend-art n${b.parts.length}">${b.parts.map(p => spriteImg(p, 'dried', 40, false, FLOWERS[p].name)).join('')}</span><span class="chip sc-form blend">🫖 블렌드</span></div>
      <div class="cc-name"><b>${b.recipe ? '✨ ' : ''}${b.name}</b><span class="stars">${starStr(b.q)}</span></div>
      <button type="button" class="btn primary" data-bagblend="${b.id}">🏷️ 티백</button></div>`).join('');
  // ☕ 찻잔 (P17-10): 우린 차. 같은 꽃·꼬리표·식음이 같으면 한 장
  const cupKey = c => [c.kind, c.kind === 'blend' ? c.name : c.type, c.kind === 'tea' && E.isFresh(st, c, cal), !!c.hat, !!c.raw, E.cupCold(c, cal)].join('|');
  const cupGroups = groupType(st.cups || [], cupKey).map(g => ({ ...g, fresh: g.kind === 'tea' && E.isFresh(st, g, cal), cold: E.cupCold(g, cal) }));
  const cupCards = cupGroups.map(g => { const isB = g.kind === 'blend', key = isB ? g.parts[0] : g.type, nm = isB ? `${g.recipe ? '✨ ' : ''}${g.name}` : FLOWERS[g.type].tea; return `<div class="shopcard cabcard teacard cupcard ${g.cold ? 'cold' : ''}" style="--pc:${SPR.tea[key] || FLOWERS[key].petal}">
      <div class="sc-art"><span class="cup-steam">${spriteImg(key, 'tea', 64, false, nm)}</span><span class="chip sc-form">${g.cold ? '🧊 식은 차' : '☕ 갓 우림'}</span><span class="sc-count">×${g.ids.length}</span>${shopOpen && st.cups[0] && g.ids.includes(st.cups[0].id) ? '<span class="sc-next-up">다음 차례</span>' : ''}</div>
      <div class="cc-name"><b>${nm}</b><span class="stars">${starStr(g.q)}</span></div>
      <div class="cc-meta">${g.cold ? '식어서 <b class="val-down">값이 반</b>' : '이번 달 안에 팔면 제값'}${isB ? '' : teaTags(g)}</div>
      <button type="button" class="btn primary" data-sellcup="${g.ids.join(',')}" ${shopOpen ? '' : 'disabled'}>💰 판매</button></div>`; }).join('');
  // ☕ 카운터: 우린 찻잔을 나무빛 상자 안에 (티백 선반과 구분)
  const cupSection = (st.cups || []).length ? `<section class="counter"><div class="cab-head"><span class="sb-title">☕ 찻잔 <span class="sh-n">${st.cups.length}</span></span><span class="muted">${shopOpen ? `☕ 손님이 1시간마다 한 잔씩 사 가요 · 다음 손님 <b>${realH(Math.max(0, E.CUP_SELL_H - (st.cupTimerH || 0)) / (st.speed || 1))}</b> 뒤` : '찻집이 열리면 손님이 한 잔씩 사 가요'}</span>${st.cups.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-sellcup="all" ${shopOpen ? '' : 'disabled'}>💰 전체 판매</button></span>` : ''}</div>${shopOpen ? `<div class="cust-bar" title="다음 손님까지"><i style="width:${Math.round(Math.min(1, (st.cupTimerH || 0) / E.CUP_SELL_H) * 100)}%"></i></div>` : ''}<div class="shopgrid cabgrid">${cupCards}</div></section>` : (shopOpen ? '<section class="counter empty"><span>☕</span><div class="muted">카운터가 비어 있어요 · 아래 🏷️ 티백에서 "🫖 우림"을 누르면 찻잔이 여기에 놓여요</div></section>' : '<section class="counter empty closed"><span>🔒</span><div class="muted">카운터는 겨울(12월)부터 열려요</div></section>');
  $('#p-cab').innerHTML = `<div class="stack">
    <div class="news-row"><div class="shop-sign ${shopOpen ? 'open' : 'closed'}">
      <span class="ss-board"><b>${shopOpen ? 'OPEN' : 'CLOSED'}</b><small>${shopOpen ? '영업 중' : '준비 중'}</small></span>
      <span class="ss-txt"><b>${shopOpen ? '☕ 오늘은 찻집이 열려요' : '🔒 겨울(12월)이 되면 열어요'}</b><small>${shopOpen ? '겨울 · 꽃잠 동안 · 티백을 우려 팔 수 있어요' : `${realH(E.hoursToShopOpen(st.virtual) / (st.speed || 1))} 뒤 · 평일엔 티백을 모아 두세요`} · 🏷️ 티백은 품질이 그대로예요</small></span>
</div>${wallet()}</div>
    ${cupSection}
    <div class="cab-head"><span class="sb-title">🏷️ 티백${st.teas.length + bagged.length ? ` <span class="sh-n">${st.teas.length + bagged.length}</span>` : ''}</span><span class="muted">우려서 찻잔으로</span>${st.teas.length + bagged.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-brew="all" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 전체 우림' : '🔒 준비 중'}</button></span>` : ''}</div>
    ${teaCards ? `<div class="shopgrid cabgrid">${teaCards}</div>` : '<div class="cab-empty"><span>🏷️</span><div><b>티백이 없어요</b> <span class="muted">🌿 제다실에서 생화 · 말린 꽃잎 · 블렌드를 티백으로 만들면 여기로 와요</span></div></div>'}</div>`;
  // 🌿 제다실: 생화 · 꽃방 · 말린 꽃잎 · 블렌딩 · 블렌드 → 모두 🏷️ 티백으로 (10-06)
  $('#p-tearoom').innerHTML = `<div class="stack">
    <div class="shop-news"><span>${cal.frozen ? '🌙 꽃잠에는 품질이 그대로예요' : '꽃잎은 <b class="val-down">한 달에 20%씩 줄어요</b> · 꽃방에 말리면 멈춰요'}</span><span>🏷️ 티백은 찻집으로 가요</span></div>
    <nav class="flow-steps" aria-label="제다실 흐름">${[['tr-petal', '🌸', '생화', st.petals.length], ['tr-dry', '🌾', '꽃방', st.drying.length], ['tr-dried', '🍂', '말린 꽃잎', st.dried.length], ['tr-blend', '🫖', '블렌드', loose.length]].map(([id, ic, nm, n], j) => `${j ? '<span class="fs-arrow" aria-hidden="true">›</span>' : ''}<button type="button" class="fs-step ${n ? '' : 'zero'}" data-jump="${id}"><span>${ic}</span>${nm}<b class="data">${n}</b></button>`).join('')}<span class="fs-arrow" aria-hidden="true">›</span><button type="button" class="fs-step out" data-go="cab"><span>🏷️</span>찻집으로</button></nav>
    <div class="cab-head" id="tr-petal"><span class="sb-title">🌸 생화${st.petals.length ? ` <span class="sh-n">${st.petals.length}</span>` : ''}</span><span class="muted">그냥 두면 <b class="val-down">품질이 줄어요</b> · 바로 티백(<b class="val-down">값 −10%</b>) 또는 건조</span>${st.petals.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-dry="all">전체 건조</button><button type="button" class="btn small" data-raw="all">전체 티백</button></span>` : ''}</div>
    ${petalCards ? `<div class="shopgrid cabgrid">${petalCards}</div>` : '<div class="cab-empty"><span>🧺</span><div><b>꽃잎이 없어요</b> <span class="muted">꽃이 피면 정원에서 거둬요</span></div></div>'}
    <div class="cab-head" id="tr-dry"><span class="sb-title">🌾 꽃방${st.drying.length ? ` <span class="sh-n">${st.drying.length}</span>` : ''}</span><span class="muted">1달이면 다 말라요</span></div>
    ${dryTabs}
    ${dryingCards ? `<div class="shopgrid cabgrid">${dryingCards}</div>` : '<div class="cab-empty slim"><span>🌾</span><div class="muted">위 생화에서 "🌾 건조"를 눌러요</div></div>'}
    <div class="cab-head" id="tr-dried"><span class="sb-title">🍂 말린 꽃잎${st.dried.length ? ` <span class="sh-n">${st.dried.length}</span>` : ''}</span><span class="muted">시들지 않아요 · 블렌딩이나 티백으로</span></div>
    ${driedCards ? `<div class="shopgrid cabgrid">${driedCards}</div>` : '<div class="cab-empty slim"><span>🍂</span><div class="muted">꽃방에서 다 마르면 여기로 와요</div></div>'}
${blendBox}
    ${loose.length ? `<div class="cab-head"><span class="sb-title">🫖 블렌드 <span class="sh-n">${loose.length}</span></span><span class="muted">티백으로 만들어 찻집으로</span>${loose.length > 1 ? '<span class="right"><button type="button" class="btn small primary" data-bagblend="all">전체 티백</button></span>' : ''}</div><div class="shopgrid cabgrid">${looseCards}</div>` : ''}</div>`;
}
['#p-cab', '#p-tearoom'].forEach(sel => $(sel).addEventListener('toggle', e => { if (e.target.matches('.bl-book')) ui.bookOpen = e.target.open; }, true));   // 레시피 펼침 기억
['#p-cab', '#p-tearoom'].forEach(sel => $(sel).addEventListener('click', cabClick));
function cabClick(e) {
  const jp = e.target.closest('[data-jump]'); if (jp) { const t = document.getElementById(jp.dataset.jump); if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 70); return; }
  const tb = e.target.closest('[data-drt]'); if (tb) { ui.dryTab = tb.dataset.drt; return renderCab(true); }
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.raw) { const ids = b.dataset.raw === 'all' ? st.petals.map(p => p.id) : b.dataset.raw.split(',').map(Number); return openTeaConfirm(ids, 'raw'); }
  if (b.dataset.make) { const ids = b.dataset.make === 'all' ? st.petals.map(p => p.id) : b.dataset.make.split(',').map(Number); return openTeaConfirm(ids, false); }
  if (b.dataset.dry) { const ids = b.dataset.dry === 'all' ? st.petals.map(p => p.id) : b.dataset.dry.split(',').map(Number); return openDryConfirm(ids); }
  if (b.dataset.makedried) return openTeaConfirm(b.dataset.makedried.split(',').map(Number), true);
  if (b.dataset.bsel) {                                // 블렌딩 재료 고르기: 같은 묶음에서 아직 안 고른 한 장
    const type = b.dataset.bsel, p = st.dried.filter(x => x.type === type && !ui.blendSel.includes(x.id)).sort((a, c) => c.q - a.q)[0];   // 그 꽃 중 가장 좋은 한 장
    if (p && ui.blendSel.length < 3) ui.blendSel.push(p.id);
    return renderCab(true);
  }
  if (b.dataset.recipe) {
    ui.blendSel = E.BLENDS[b.dataset.recipe].parts.map(t => st.dried.filter(x => x.type === t).sort((p, q) => q.q - p.q)[0]).filter(Boolean).map(p => p.id);
    renderCab(true); const box = document.querySelector('#p-tearoom .blendbox'); if (box) window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - 90);
    return;
  }
  if (b.dataset.bunsel) { ui.blendSel = ui.blendSel.filter(id => id !== +b.dataset.bunsel); return renderCab(true); }
  if (b.dataset.blend) return openBlendConfirm();
  if (b.dataset.bagblend) return openBagBlend(b.dataset.bagblend === 'all' ? st.blends.filter(x => !x.bagged).map(x => x.id) : [+b.dataset.bagblend]);
  if (b.dataset.brew) return b.dataset.brew === 'all' ? openBrewConfirm(st.teas.map(t => t.id), st.blends.filter(x => x.bagged).map(x => x.id)) : openBrewConfirm(b.dataset.brew.split(',').map(Number), []);
  if (b.dataset.brewblend) return openBrewConfirm([], [+b.dataset.brewblend]);
  if (b.dataset.sellcup) return openSellConfirm(b.dataset.sellcup === 'all' ? st.cups.map(c => c.id) : b.dataset.sellcup.split(',').map(Number));
}

// ---------------------------------------------------------------- 📖 도감·기록 (P08, P04-02)
function renderDex(force) {
  const sig = JSON.stringify([ui.dexTab, ui.dexCat, ui.fold, st.dex, st.journal, st.titles, st.titleOn, E.calendar(st.virtual).idx, st.records.length, st.records[0] && !!st.records[0].snapshot]);
  if (!force && ui.sigs.dex === sig) return;
  ui.sigs.dex = sig;
  const n = E.dexCount(st);
  const tab = (k, label) => `<button type="button" data-dt="${k}" aria-pressed="${ui.dexTab === k}">${label}</button>`;
  const tabs = `<span class="seg" id="dexTabs">${tab('journal', '📔 도감일지')}${tab('rec', '기록')}${tab('dex', '도감')}</span>`;   // 순서: 도감일지 > 기록 > 도감 (10-17)
  let body;
  if (ui.dexTab === 'dex') {
    // 모은 카드는 작은 설명, 못 모은 카드는 "어떻게 모으는지" 힌트
    const card = (kind, k, on, art, name, sub, pc, cls) => `<button type="button" class="dexcard ${cls || ''} ${on ? '' : 'locked'}" style="--pc:${pc}" ${on ? `data-dex="${kind}" data-key="${k}"` : 'tabindex="-1" aria-disabled="true"'}><span class="dc-art">${art}</span><span class="dc-name">${on ? name : '???'}</span><span class="dc-sub">${sub}</span></button>`;
    const nf = Object.keys(st.dex.flower).length, nt = Object.keys(st.dex.tea).length, nl = Object.keys(st.dex.land).length;
    const nfo = Object.keys(st.dex.form || {}).length, ntb = Object.keys(st.dex.teabag || {}).length, np = Object.keys(st.dex.petal || {}).length, nb = Object.keys(st.dex.blend || {}).length;
    // 단순하게: 줄 제목에 모은 수만, 카드는 그림 · 이름 (차는 ★), 못 모은 카드만 힌트
    const head = (ic, title, got, total) => `<div class="cab-head dex-head"><span class="sb-title">${ic} ${title}</span><span class="dh-count data">${got} / ${total}</span></div>`;
    const makers = k => FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k);
    // 종류 칩: 전체 또는 한 종류만 보기 (긴 화면을 짧게)
    const cats = [
      { key: 'form', ic: '🌰', title: '씨앗·묘목', got: nfo, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.form[k], nm = `${F.name} ${FORM[F.form].name}`; return card('form', k, on, spriteImg(k, 'form', 56, !on, on ? nm : '아직 모르는 씨앗·묘목'), nm, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'flower', ic: '🌸', title: '꽃', got: nf, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.flower[k]; return card('flower', k, on, spriteImg(k, 'flower', 56, !on, on ? F.name : '아직 모르는 꽃'), F.name, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'petal', ic: '🍂', title: '꽃잎', got: np, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.petal[k]; return card('petal', k, on, spriteImg(k, 'petal', 52, !on, on ? `${F.name} 꽃잎` : '아직 모르는 꽃잎'), `${F.name} 꽃잎`, on ? '' : (st.dex.flower[k] ? '피면 거둬요' : '처음 거둘 때'), F.petal); }).join('')}</div>` },
      { key: 'teabag', ic: '🏷️', title: '티백', got: ntb + Object.keys(st.dex.bagBlend || {}).length, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!(st.dex.teabag || {})[k], nm = `${F.name} 티백`; return card('teabag', k, on, spriteImg(k, 'teabag', 52, !on, on ? nm : '아직 모르는 티백'), nm, on ? '' : ((st.dex.petal || {})[k] ? '제다실에서 꽃잎으로' : '꽃잎을 티백으로'), F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], on = !!(st.dex.bagBlend || {})[k], nm = `${B.name} 티백`; return card('blend', k, on, spriteImg(B.parts[0], 'teabag', 52, !on, on ? nm : '아직 모르는 블렌드 티백'), nm, on ? '' : (st.dex.blend[k] != null ? '블렌드를 티백으로' : '블렌딩 → 티백'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'tea', ic: '🍵', title: '차', got: nt + nb, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], q = st.dex.tea[k], on = q != null; return card('tea', k, on, spriteImg(k, 'tea', 56, !on, on ? F.tea : '아직 모르는 차'), F.tea, on ? `<span class="stars">${starStr(q)}</span>` : ((st.dex.teabag || {})[k] ? '찻집에서 우려 팔면' : '티백을 찻집에서'), SPR.tea[k] || F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], q = st.dex.blend[k], on = q != null, known = B.parts.every(p => st.dex.petal[p]); return card('blend', k, on, spriteImg(B.parts[0], 'tea', 52, !on, on ? B.name : '아직 모르는 블렌드'), B.name, on ? `<span class="stars">${starStr(q)}</span>` : (known ? B.parts.map(p => FLOWERS[p].name).join(' + ') : '제다실에서 섞어 봐요'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'land', ic: '🟫', title: '땅', got: nl, total: 10, grid: `<div class="dexgrid big">${LAND_KEYS.map(k => { const L = LANDS[k], on = !!st.dex.land[k], mk = makers(k); return card('land', k, on, `<span class="dc-land" style="background-color:${on ? L.color : 'var(--line)'}"></span>`, L.name, on ? '' : (mk.some(f => st.dex.flower[f]) ? `${FLOWERS[mk.find(f => st.dex.flower[f])].name}의 땅` : mk.length ? '어떤 꽃의 땅일까요' : '꽃과 꽃 사이에서'), L.color); }).join('')}</div>` },
    ];
    const cat = cats.some(c => c.key === ui.dexCat) ? ui.dexCat : 'all';
    const chip = (key, label, got, total) => `<button type="button" class="dexchip ${got >= total ? 'done' : ''}" data-dc="${key}" aria-pressed="${cat === key}"><span>${label}</span><span class="data">${got} / ${total}</span><i style="--p:${Math.round(got / total * 100)}%"></i></button>`;
    body = `<div class="dexchips" role="group" aria-label="도감 종류">${chip('all', '전체', n, E.dexTotal(st))}${cats.map(c => chip(c.key, `${c.ic} ${c.title}`, c.got, c.total)).join('')}</div>
      ${cats.filter(c => cat === 'all' || c.key === cat).map(c => `${cat === 'all' ? head(c.ic, c.title, c.got, c.total) : ''}${foldGrid('dex-' + c.key, c.grid)}`).join('')}`;   // 못 모은 칸은 접어 둠 (10-17)
  } else if (ui.dexTab === 'journal') {
    body = journalHTML();
  } else {
    body = st.records.length ? st.records.map(r => {
      const total = W * H, order = LAND_KEYS.filter(k => r.counts[k]).sort((a, b) => (a === 'barren') - (b === 'barren') || r.counts[b] - r.counts[a]);
      // 한 해 카드: 왼쪽 그해 정원 그림 (없으면 점선 자리) · 오른쪽 제목과 두 칩(가장 좋은 차 · 도감) · 땅 막대 · 일지
      const land = order.filter(k => k !== 'barren').length;
      return `<div class="card record">
        <div class="rec-art">${r.snapshot ? `<img src="${r.snapshot}" alt="${r.year}년차 쉼달 아침의 정원">` : '<div class="rec-noimg"><span>🖼️</span>이 해는 정원 그림이 없어요</div>'}</div>
        <div class="stack" style="gap:10px">
          <div class="rec-head"><h3>${r.year}년차 정원</h3><span class="muted">땅 ${land}가지</span></div>
          <div class="rec-chips">
            <span class="rec-chip">${r.best ? `${spriteImg(r.best.type, 'tea', 22, false, FLOWERS[r.best.type].tea)}<span><small>가장 좋은 차</small><b>${FLOWERS[r.best.type].tea} <span class="stars">${starStr(r.best.q)}</span></b></span>` : '<span class="rec-ic">🍵</span><span><small>가장 좋은 차</small><b class="muted">없어요</b></span>'}</span>
            ${r.titleOn && E.TITLES[r.titleOn] ? `<span class="rec-chip">${titleImg(r.titleOn, 22, false)}<span><small>대표 칭호</small><b>${E.TITLES[r.titleOn].name}</b></span></span>` : ''}<span class="rec-chip"><span class="rec-ic">📖</span><span><small>도감</small><b class="data">${r.dex} / ${r.dexTotal || 32}</b></span></span>
          </div>
          <div class="tally">${order.map(k => `<i style="width:${r.counts[k] / total * 100}%;background:${LANDS[k].color}" title="${LANDS[k].name} ${r.counts[k]}칸"></i>`).join('')}</div>
          <div class="rec-lands">${order.map(k => `<span><span class="sw" style="background:${LANDS[k].color}"></span>${LANDS[k].name} <span class="data">${r.counts[k]}</span></span>`).join('')}</div>
          <details class="rec-log"><summary>📜 그해 정원 일지 <span class="muted">${r.log.length}줄</span></summary><div class="logview" style="margin-top:8px;max-height:280px;overflow-y:auto">${logHTML(r.log)}</div></details></div></div>`;
    }).join('') : '<div class="cab-empty"><span>📖</span><div><b>아직 기록이 없어요</b><br><span class="muted">일요일 오전 6시, 쉼달이 시작되면 그해 정원 그림과 땅, 가장 좋은 차가 여기에 남아요</span></div></div>';
  }
  $('#p-dex').innerHTML = `<div class="stack"><div class="sectionhead">${tabs}</div>${body}</div>`;
}
$('#p-dex').addEventListener('click', e => {
  const t = e.target.closest('[data-dt]'); if (t) { ui.dexTab = t.dataset.dt; return renderDex(true); }
  const fd = e.target.closest('details.fold > summary'); if (fd) { const d = fd.parentElement; ui.fold[d.dataset.fold] = !d.open; return; }   // 펼침 상태 기억
  const dc = e.target.closest('[data-dc]'); if (dc) { ui.dexCat = dc.dataset.dc; return renderDex(true); }
  const qg = e.target.closest('[data-qgo]'); if (qg) return setTab(qg.dataset.qgo);
  const to = e.target.closest('[data-ttlon]'); if (to) return after(E.setTitleOn(st, to.dataset.ttlon || null));
  const c = e.target.closest('[data-dex]'); if (c) openDexDetail(c.dataset.dex, c.dataset.key);
});
function openDexDetail(kind, k) {
  if (kind === 'blend') {                              // 🫖 블렌드: 재료와 가장 좋았던 품질
    const B = E.BLENDS[k], q = st.dex.blend[k];
    return openModal(B.name, `<div class="stack">
      <div class="dexart"><div class="beq" role="img" aria-label="${B.parts.map(p => `말린 ${FLOWERS[p].name} 꽃잎`).join(' 더하기 ')}은 ${B.name}">
        ${B.parts.map(p => `<span class="beq-i">${spriteImg(p, 'dried', 48, false, '')}<small>말린 ${FLOWERS[p].name}</small></span>`).join('<span class="beq-op">+</span>')}
        <span class="beq-op">=</span><span class="beq-i out">${spriteImg(B.parts[0], 'tea', 64, false, '')}<small>${B.name}</small><em class="beq-x">×1.5</em></span>
      </div></div>
      <div class="row"><b>${B.name}</b><span class="chip">블렌드</span>${q != null ? `<span class="stars">${starStr(q)}</span>` : ''}</div>
      ${B.story ? `<p class="note">${B.original ? '🌱' : '🍵'} ${B.story}</p>` : ''}
      <p class="note">🌿 제다실 🫖 블렌딩에서 언제든 만들어요. 값은 재료 차 값을 더한 것의 <b class="val-up">×1.5</b> (레시피에 없는 블렌드는 ×1.2)</p></div>`, [{ label: '닫기', act: closeModal }]);
  }
  if (kind === 'land') {
    const L = LANDS[k], makers = FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k).map(f => FLOWERS[f].name);
    const desc = { barren: '꽃의 영향이 닿지 않은 땅이에요. 모든 정원은 여기서 시작해요.', mossy: '서늘하고 습한 경계에서 생겨요. 추운 땅의 꽃과 물가의 꽃을 가까이 심어 보세요.', wetland: '연못의 물기가 약하게 퍼지는 가장자리에서 생겨요.', dryfield: '꽃의 영향이 막 닿기 시작한 마른 땅이나, 서로 다른 땅 사이에서 생겨요.' }[k];
    return openModal(L.name, `<div class="stack"><div class="row"><span class="sw" style="background:${L.color};width:20px;height:20px"></span><b>${L.name}</b></div>
      <p class="note">${desc || `${makers.join(', ')}이(가) 만드는 땅이에요.`}</p>${makers.length ? `<p class="note">만드는 꽃: ${makers.join(', ')}</p>` : ''}</div>`, [{ label: '닫기', act: closeModal }]);
  }
  // 씨앗·묘목 · 꽃 · 꽃잎 · 차: 한 꽃의 흐름을 한 창에 (누른 것을 크게, 아래 네 단계는 눌러서 바꿔 보기)
  const F = FLOWERS[k], best = st.dex.tea[k];
  const steps = [['form', `${F.name} ${FORM[F.form].name}`, !!st.dex.form[k]], ['flower', F.name, !!st.dex.flower[k]], ['petal', `${F.name} 꽃잎`, !!(st.dex.petal || {})[k]], ['teabag', `${F.name} 티백`, !!(st.dex.teabag || {})[k]], ['tea', F.tea, best != null]];
  const cur = steps.find(x => x[0] === kind) || steps[1];
  openModal(cur[1], `<div class="stack">
    <div class="dexart">${spriteImg(k, cur[0], 112, false, cur[1])}</div>
    <div class="dex-chain">${steps.map(([kd, nm, on], i) => `${i ? '<span class="dc-arrow">›</span>' : ''}<button type="button" class="dc-step ${kd === cur[0] ? 'on' : ''} ${on ? '' : 'locked'}" ${on ? `data-dk="${kd}"` : 'disabled'} title="${on ? nm : '아직 몰라요'}">${spriteImg(k, kd, 36, !on, on ? nm : '')}<small>${on ? ['씨앗·묘목', '꽃', '꽃잎', '티백', '차'][i] : '???'}</small></button>`).join('')}</div>
    <div class="row"><b>${F.name}</b><span class="chip">${LIFE[F.life]}</span><span class="chip">${FORM[F.form].name}</span></div>
    <p style="margin:0">${F.story}</p>
    ${flowerStrip(F, E.calendar(st.virtual).idx)}
    <div class="gauges">${envGauges(F, null)}</div>
    <dl class="kv">
      <dt>다 자라기까지</dt><dd>${F.mature}달</dd>
      <dt>만드는 땅</dt><dd>${LANDS[homeLand(F)].name}</dd><dt>번식</dt><dd>${F.prop}</dd>
      ${best != null ? `<dt>가장 좋은 ${F.tea}</dt><dd>${qLabel(best)}</dd>` : ''}
    </dl></div>`, [{ label: '닫기', act: closeModal }]);
  $('#modalRoot').querySelectorAll('[data-dk]').forEach(b => b.onclick = () => openDexDetail(b.dataset.dk, k));
}

// ---------------------------------------------------------------- 창
function openModal(title, html, buttons) {
  $('#modalRoot').innerHTML = `<div class="overlay" data-close="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close="1" aria-label="닫기">✕</button></header>
    <div class="content">${html}</div>
    <footer>${(buttons || []).map((b, i) => `<button type="button" class="btn ${b.primary ? 'primary' : ''}" data-mb="${i}">${esc(b.label)}</button>`).join('')}</footer></div></div>`;
  const root = $('#modalRoot');
  root.onclick = e => {
    if (e.target.dataset.close) return closeModal();
    const b = e.target.closest('[data-mb]'); if (b) buttons[+b.dataset.mb].act();
  };
  const first = root.querySelector('[data-mb]:last-child') || root.querySelector('[data-close]');
  if (first) first.focus();
}
function closeModal() { $('#modalRoot').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal(); });

// 📜 이벤트 로그 (P11-02-04)
// 일지 한 줄마다 알림 종류 아이콘 (P11-01 번호)
const LOG_IC = { 1: '🌰', 3: '📦', 4: '💐', 7: '📖', 8: '🌸', 9: '📖', 10: '🌱', 11: '🎁', 12: '🍂', 13: '☕' };
// 일지 묶음 (거르기 단추와 아이콘 바탕색): 꽃 · 배송 · 도감 · 그 밖
const LOG_KIND = { 8: 'bloom', 3: 'ship', 4: 'ship', 7: 'book', 9: 'book', 1: 'etc', 10: 'etc', 11: 'etc', 12: 'bloom', 13: 'etc' };
const LOG_KINDS = [['all', '전체'], ['bloom', '🌸 개화·수확'], ['ship', '📦 배송·예약'], ['book', '📖 도감·기록'], ['etc', '🌱 그 밖']];
function logHTML(log, kind) {
  const list = kind && kind !== 'all' ? log.filter(l => (LOG_KIND[l.type] || 'etc') === kind) : log;
  if (!list.length) return `<div class="log-empty">${log.length ? '이 묶음에는 아직 생긴 일이 없어요.' : '아직 정원에 생긴 일이 없어요.'}</div>`;
  let out = '', last = '';
  for (const l of list) {
    const k = l.y + '|' + l.m;
    if (k !== last) { out += `<div class="sep"><span>${l.y < 1 ? '첫 해 전' : `${l.y}년차`} ${monthName(l.m)}</span></div>`; last = k; }   // 0년차 = 꽃잠에 시작한 준비 기간 (P04-05)   // 달이 바뀌는 구분선
    out += `<div class="line k-${LOG_KIND[l.type] || 'etc'}"><span class="li">${LOG_IC[l.type] || '·'}</span><span class="lt">${esc(l.text)}</span><span class="d">${l.d}일</span></div>`;
  }
  return out;
}
// 정원 일지: 정원 상태창 아래, 새 일이 생기면 맨 아래(최근)가 보이게. 접혀 있어도 가장 최근 일 한 줄은 보임
function renderGardenLog(force) {
  const kind = ui.logKind || 'all', sig = st.log.length + '|' + (st.log.length && st.log[st.log.length - 1].text) + '|' + kind;
  if (!force && ui.sigs.glog === sig) return;
  ui.sigs.glog = sig;
  const lastL = st.log[st.log.length - 1];
  $('#logCount').textContent = st.log.length ? `${st.log.length}줄` : '비어 있어요';
  $('#logLatest').innerHTML = lastL ? `최근 · ${LOG_IC[lastL.type] || ''} ${esc(lastL.text)} <span class="data">(${monthName(lastL.m)} ${lastL.d}일)</span>` : '올해 정원에서 생긴 일 · 쉼달에 한 해 기록으로 옮겨져요';
  const have = new Set(st.log.map(l => LOG_KIND[l.type] || 'etc'));
  $('#logFilter').innerHTML = st.log.length ? LOG_KINDS.filter(([k]) => k === 'all' || have.has(k)).map(([k, nm]) => `<button type="button" data-logk="${k}" aria-pressed="${kind === k}">${nm}</button>`).join('') : '';
  const lv = $('#logView'); lv.innerHTML = logHTML(st.log, kind); lv.scrollTop = lv.scrollHeight;
}
$('#logFilter').addEventListener('click', e => { const b = e.target.closest('[data-logk]'); if (!b) return; ui.logKind = b.dataset.logk; renderGardenLog(true); });
function openLog() {                                  // 알림을 누르면 정원의 일지를 펼쳐서 보여 줌
  if (ui.tab !== 'garden') setTab('garden');
  const d = $('#gardenLog'); d.open = true; renderGardenLog(true);
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ⚙️ 설정 (P11-03, P11-02-03)
let resetArmed = false;
function openSettings() { setTab('settings'); }
function renderSettings() {
  const s = st.settings, hours = Array.from({ length: 24 }, (_, h) => h);
  const opt = (v, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${String(v).padStart(2, '0')}:00</option>`;
  const tog = (attr, on) => `<input type="checkbox" class="tog" ${attr} ${on ? 'checked' : ''}>`;
  // 한 줄 = 아이콘 · 이름과 설명 · 오른쪽 조작. 줄들을 주제별 카드로 묶음
  const row = (ic, name, desc, ctrl, cls) => `<div class="set-row ${cls || ''}"><span class="sr-ic">${ic}</span><span class="sr-t"><b>${name}</b>${desc ? `<small>${desc}</small>` : ''}</span><span class="sr-c">${ctrl}</span></div>`;
  const group = (ic, title, note, rows, cls) => `<section class="setgroup ${cls || ''}"><div class="cab-head"><span class="sb-title">${ic} ${title}</span><span class="muted">${note}</span></div><div class="setcard2">${rows}</div></section>`;
  const sleepBar = () => {                            // 하루 24시간 막대, 자는 시간만 보라색 (칸 사이 선 없이 한 줄)
    const on = h => s.sleep.from <= s.sleep.to ? h >= s.sleep.from && h < s.sleep.to : h >= s.sleep.from || h < s.sleep.to;
    const c = s.sleep.on ? '#8e7cc3' : 'var(--line)', stops = hours.map(h => `${on(h) ? c : 'transparent'} ${(h / 24 * 100).toFixed(3)}% ${((h + 1) / 24 * 100).toFixed(3)}%`).join(', ');
    return `<div class="sleepbar" id="sleepBar" data-hours="${hours.filter(on).length}" style="background-image:linear-gradient(90deg, ${stops})"></div><div class="sleepticks"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div>`; };
  const SPEEDS = [[1, '현실', '현실 1주 = 1년'], [60, '1분=1시간', '하루가 금방'], [720, '1분=1달', '한 해가 약 14분'], [10080, '1분=1년', '한 해가 1분']];
  $('#p-settings').innerHTML = `<div class="stack setwrap"><div class="sectionhead"><span class="muted">바꾸면 바로 저장돼요</span></div>
    ${group('🔔', '알림', '꺼도 정원 일지에는 그대로 남아요',
      [[3, '📦', '예약 배송', '예약한 꽃이 창고에 왔을 때'], [8, '🌸', '개화와 수확', '꽃이 피어 거둘 수 있을 때'], [9, '📖', '도감 등록', '새 꽃·차·땅을 처음 만났을 때']].map(([t, ic, nm, d]) => row(ic, nm, d, tog(`data-toast="${t}"`, s.toast[t]))).join('')
      + row('🌙', '수면 시간', '이 시간의 알림은 모았다가 끝날 때 한 번에 (휴대폰 푸시용, 웹은 저장만)', tog('id="sleepOn"', s.sleep.on))
      + `<div class="set-sub ${s.sleep.on ? '' : 'off'}" id="sleepSub"><div class="row sleeprow"><select id="sleepFrom" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.from)).join('')}</select><span class="muted">부터</span><select id="sleepTo" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.to)).join('')}</select><span class="muted">까지</span></div>${sleepBar()}</div>`)}
    ${!DEV ? '' : group('⏩', '시간', '개발용 · 이 컴퓨터(localhost)에서만 보여요',
      `<div class="speedgrid" role="group" aria-label="배속">${SPEEDS.map(([v, l, d]) => `<button type="button" data-speed="${v}" aria-pressed="${st.speed === v}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`
      + row('⏭', '다음 달로 건너뛰기', '지금 달을 바로 끝내요', '<button type="button" class="btn small" id="skipMonth">다음 달</button>'))}
    ${(() => { const us = undoSummary(); return group('💾', '저장', '진행은 이 브라우저에 자동 저장돼요. 다른 기기로 옮기거나 지켜 두려면 파일로 저장하세요',
      row('💾', '저장하기', `파일로 내려받아요 · ${st.lastExport ? `마지막 저장 ${whenText(st.lastExport)}` : '아직 저장한 적이 없어요'}${exportStale() ? ' · <b class="val-down">한동안 저장하지 않았어요</b>' : ''}`, `<span class="row" style="gap:6px"><button type="button" class="btn small" id="exportBtn">저장</button>${canShareFile ? '<button type="button" class="btn small" id="shareBtn">보내기</button>' : ''}</span>`)
      + row('📂', '불러오기', '저장한 파일로 정원을 바꿔요. 바꾸기 전에 요약을 보여 줘요', '<button type="button" class="btn small" id="importBtn">불러오기</button><input type="file" id="importFile" hidden>')
      + (IOS_EVICT ? row('📱', 'iPhone · iPad Safari', '7일 넘게 열지 않으면 Safari가 정원을 지울 수 있어요. <b>공유 › 홈 화면에 추가</b>로 앱처럼 쓰거나 💾 저장해 두세요', '') : '')
      + (IN_APP ? row('💬', '앱 안의 브라우저', '카카오톡 · 인스타그램 안에서 연 정원은 그 앱 안에만 저장돼요. Chrome · Safari로 열면 다른 정원이 돼요', '<button type="button" class="btn small" id="copyAddrBtn">주소 복사</button>') : '')
      + (us ? row('↩︎', '불러오기 전으로 되돌리기', `보관한 정원: ${yearWord(us.year)} ${monthName(us.month)} · 도감 ${us.dex} / ${us.dexTotal} · 칭호 ${us.titles}개`, '<button type="button" class="btn small" id="undoBtn">되돌리기</button>') : ''));
    })()}
    ${group('🌱', '정원', '되돌릴 수 없어요',
      row('🗑️', '처음부터 다시 시작', '꽃, 창고, 찻집, 돈, 도감, 기록이 모두 지워져요. 설정은 남아요', '<button type="button" class="btn small danger" id="resetBtn">재시작</button>', 'danger'), 'danger-group')}
    ${group('ℹ️', '정보', '',
      row(`${document.querySelector('.logo-px') ? document.querySelector('.logo-px').outerHTML.replace('width="33" height="30"', 'width="22" height="20"') : '🌱'}`, "도리의 정원 · Dori's Garden", '프로토타입 · 진행은 이 브라우저에 자동 저장돼요 (💾 파일로 옮길 수 있어요)', '')
      + row('🔤', '글꼴', '주아 · 고운바탕 · IBM Plex (모두 SIL 오픈 폰트 라이선스)', '')
      + row('📜', '정책', '정원이 저장하는 곳과 약속', '<span class="row" style="gap:6px"><a class="btn small" href="privacy.html">개인정보처리방침</a><a class="btn small" href="terms.html">이용약관</a></span>'))}
  </div>`;
  resetArmed = false;
  const root = $('#p-settings');
  $('#exportBtn').addEventListener('click', saveClick);
  if ($('#shareBtn')) $('#shareBtn').addEventListener('click', shareSave);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => { readImport(e.target.files[0]); e.target.value = ''; });
  if ($('#undoBtn')) $('#undoBtn').addEventListener('click', undoImport);
  if ($('#copyAddrBtn')) $('#copyAddrBtn').addEventListener('click', copyAddress);
  root.querySelectorAll('[data-toast]').forEach(i => i.addEventListener('change', () => { s.toast[i.dataset.toast] = i.checked; save(); }));
  // 수면 시간은 바꾸면 막대와 선택 칸을 다시 그림
  $('#sleepOn').addEventListener('change', e => { s.sleep.on = e.target.checked; save(); renderSettings(); });
  $('#sleepFrom').addEventListener('change', e => { s.sleep.from = +e.target.value; save(); renderSettings(); });
  $('#sleepTo').addEventListener('change', e => { s.sleep.to = +e.target.value; save(); renderSettings(); });
  if (DEV) root.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { st.speed = +b.dataset.speed; save(); renderTop(); root.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  if (DEV) $('#skipMonth').addEventListener('click', () => { const c = E.calendar(st.virtual); E.advance(st, c.slotEnd + 1000, ctx); save(); renderAll(true); feedback(`${monthName(E.calendar(st.virtual).month)}이 되었어요`); });
  $('#resetBtn').addEventListener('click', e => {
    if (!resetArmed) { resetArmed = true; e.target.textContent = '한 번 더 누르면 모두 지워져요'; return; }
    const keep = st.settings; st = E.create(Date.now()); st.settings = keep; st.onboarded = true;
    ui.selected = null; ui.cart = {}; ui.sigs = {}; save(); setTab('garden'); feedback('빈 황무지에서 새 정원을 시작했어요');
  });
}

function onboarding() {
  const cal = E.calendar(st.virtual);
  openModal('도리의 정원', `<div class="stack" style="gap:10px">
    <div class="ob-vis">
      <figure>${landPixel()}<figcaption><b>꽃이 땅을 바꿔요</b>처음엔 모두 황무지. 심은 꽃 둘레가 그 꽃이 좋아하는 땅이 돼요</figcaption></figure>
      <figure>${weekPixel(cal)}<figcaption><b>현실 1주 = 정원 1년</b>오전·오후 6시마다 한 달씩. 일요일은 🌙 꽃잠 (시간이 멈추고 예약해요)</figcaption></figure>
    </div>
    <p class="ob-care"><span>💧</span><span>🌿</span> 물과 잡초는 <b>하루에 한 번</b>이면 충분해요</p>
    <p class="note">${cal.frozen ? `지금은 꽃잠이라 정원이 쉬고 있어요. 첫 해는 <b>월요일 아침 6시</b>(${realH(E.untilMonth(st.virtual, c => !c.frozen).hours)} 뒤)에 3월로 시작해요. 그 전에 💐 화원에서 새해 꽃을 <b>10% 싸게 예약</b>해 두면, 심을 때가 되면 창고로 와요.` : `지금은 ${monthName(cal.month)}이에요. 💐 화원에서 제철 꽃을 사서 심어 보세요.`}</p>
    <p class="note">꽃은 시들지 않고, 놓친 것은 다음 해에 다시 할 수 있어요. 천천히 즐겨 주세요.</p></div>`,
    [{ label: '시작', primary: true, act: () => { st.onboarded = true; closeModal(); E.checkJournal(st, ctx); save(); renderAll(true); } }]);   // 0장 첫 방문: 누르자마자 칭호 (P19, 10-17)
}

// ---------------------------------------------------------------- 오늘의 정원 · 땅 안내 · 빈 정원
const allFlowerTiles = () => st.flowers.filter(f => !f.withered).map(f => [f.x, f.y]);
function renderToday(force) {
  const cal = E.calendar(st.virtual), gd = guideState();
  const need = careNeed(cal);
  const showGuide = !gd.hidden && guideList().some(([k]) => !gd[k]);
  const nq = !showGuide && st.journal && !st.journal.hidden && guideList().every(([k]) => gd[k]) ? nextQuest(cal) : null;
  const sig = JSON.stringify([need, cal.frozen, showGuide && guideList().map(([k]) => !!gd[k]), nq && [nq.q.key, nq.w.now, nq.w.label]]);
  if (!force && ui.sigs.today === sig) return;
  ui.sigs.today = sig;
  let html = '';
  if (showGuide) {
    const next = guideList().findIndex(([k]) => !gd[k]);
    // 한 줄로: 첫걸음 ○/5 · 단계 점 다섯 개 · 지금 할 일 (설명은 작게) · ✕
    const doneN = guideList().filter(([k]) => gd[k]).length, [nk, nl] = guideList()[next];
    html += `<div class="guide"><span class="gd-t">🌱 첫걸음 <span class="data">${doneN} / ${guideList().length}</span></span>
      <span class="gd-steps">${guideList().map(([k, label], i) => `<i class="${gd[k] ? 'done' : i === next ? 'now' : ''}" title="${label}${gd[k] ? ' ✓' : ''}">${[...label][0]}</i>`).join('')}</span>
      <span class="gd-now"><b>${nl}</b>${guideSub(nk, need)}</span>
      <button type="button" class="x" data-do="hideGuide" aria-label="첫걸음 안내 닫기" title="안내 닫기">✕</button></div>`;
  } else if (nq) {
    const n = nq.c.quests.filter(q => st.journal.done[q.key] != null).length;
    html += `<div class="guide jguide"><span class="gd-t">📜 ${nq.c.no}장 ${nq.c.name} <span class="data">${n} / ${nq.c.quests.length}</span></span>
      <span class="gd-now"><b>${nq.q.name}</b><small>${nq.w.now ? '지금 할 수 있어요' : nq.w.label || '때가 되면'}</small></span>
      <button type="button" class="btn small" data-do="journal">📔 도감일지</button>
      <button type="button" class="x" data-do="hideJournal" aria-label="퀘스트 안내 닫기" title="안내 닫기 (도감일지에서는 계속 보여요)">✕</button></div>`;
  }
  $('#today').innerHTML = html;
}
$('#today').addEventListener('click', e => {
  const b = e.target.closest('[data-do]'); if (!b) return;
  const d = b.dataset.do;
  if (d === 'hideGuide') { guideState().hidden = true; save(); return renderToday(true); }
  if (d === 'hideJournal') { st.journal.hidden = true; save(); return renderToday(true); }
  if (d === 'journal') { ui.dexTab = 'journal'; setTab('dex'); return $('#jQuests') && $('#jQuests').scrollIntoView({ block: 'start' }); }
  if (d === 'gocab') return setTab('tearoom');
  if (d === 'plant') { ui.tool = 'plant'; ui.plantType = null; renderToolbar(true); return renderEmpty(true); }
  const r = E.care(st, d, allFlowerTiles(), ctx);
  after(r, d === 'water' ? 'watered' : d === 'harvest' ? 'harvested' : null, d === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null);
});
function renderLegend() {
  const c = E.landCounts(st), sig = JSON.stringify(c);
  if (ui.sigs.legend === sig) return;
  ui.sigs.legend = sig;
  // 땅 범례: 넓은 땅부터, 칸 수와 함께 작은 칩으로 (황무지는 맨 뒤)
  const keys = LAND_KEYS.filter(k => c[k]).sort((a, b) => (a === 'barren') - (b === 'barren') || c[b] - c[a]);
  $('#legend2').innerHTML = keys.map(k => `<span class="lg-chip ${k === 'barren' ? 'barren' : ''}"><span class="sw" style="background:${LANDS[k].color}"></span>${LANDS[k].name} <span class="data">${c[k]}</span></span>`).join('');
}
function renderEmpty(force) {
  const cal = E.calendar(st.virtual), live = st.flowers.some(f => !f.withered), el = $('#emptyMap');
  const pl = Object.keys(plantable()).length;
  const sig = [live, cal.frozen, pl, ui.tool].join('|');
  if (!force && ui.sigs.empty === sig) return;
  ui.sigs.empty = sig;
  if (live || ui.tool === 'plant') { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const text = cal.frozen ? '정원은 쉬고 있어요. 다음 해에 심을 꽃을 예약해 보세요.'
    : pl ? '창고에 심을 것이 있어요. 심기를 골라 빈 칸을 눌러 보세요.'
    : '꽃을 심으면 그 꽃이 좋아하는 땅으로 바뀌어요. 화원에서 제철 꽃을 사 보세요.';
  const btn = cal.frozen ? '<button type="button" class="btn primary" data-go="shop">💐 예약</button>'
    : pl ? '<button type="button" class="btn primary" data-start-plant="1">🌰 심기</button>'
    : '<button type="button" class="btn primary" data-go="shop">💐 화원</button>';
  el.innerHTML = `<div class="box"><b>${cal.frozen ? '꽃잠이에요' : '아직 꽃이 없어요'}</b><span class="muted" style="font-size:13px">${text}</span>${btn}</div>`;
}
$('#emptyMap').addEventListener('click', e => {
  if (!e.target.closest('[data-start-plant]')) return;
  ui.tool = 'plant'; ui.plantType = null; renderToolbar(true); renderEmpty(true);
});

// ---------------------------------------------------------------- 그리기 반복
function renderAll(force) {
  renderTop();
  const cal = E.calendar(st.virtual);
  if (!cal.frozen) ui.restClosed = false;
  $('#restBanner').hidden = !cal.frozen || ui.restClosed || !$('#emptyMap').hidden;
  if (ui.tab === 'garden') { renderToday(force); renderToolbar(force); renderStatus(force); renderLegend(); renderYear(force); renderGardenLog(force); renderEmpty(force); }
  if (ui.tab === 'shop') renderShop(force);
  if (ui.tab === 'store') renderStore(force);
  if (ui.tab === 'cab' || ui.tab === 'tearoom') renderCab(force);
  if (ui.tab === 'dex') renderDex(force);
  if (ui.tab === 'settings' && force) renderSettings();   // 입력 중에 다시 그려지지 않게, 들어올 때만
  showNewTitles();
}
let lastUi = 0, lastSave = Date.now();
function frame() {
  const real = Date.now(), dt = real - st.lastReal;
  st.lastReal = real;
  if (dt > 0) {
    ctx.live = dt < 5000;                         // P11-02-01-c: 다른 탭에 있다가 돌아온 동안 생긴 알림은 로그에만
    E.advance(st, st.virtual + dt * (st.speed || 1), ctx);
    ctx.live = true;
  }
  if (ui.tab === 'garden') draw();
  if (real - lastUi > 400) { renderAll(false); lastUi = real; }
  if (real - lastSave > 3000) { save(); lastSave = real; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

resize(); renderAll(true);
if (!st.onboarded) onboarding();
requestAnimationFrame(frame);
})();
