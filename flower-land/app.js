// 도리의 정원 (Dori's Garden) — 화면: 공통 · 저장 · 파일 저장하기 · 불러오기 · 화면 상태 · 짧은 알림 · 위 막대
// 화면 코드는 app.js → app-journal → app-garden → app-shop → app-teashop → app-dex → app-manual → app-main 순서로 불려요 (index.html).
// 모두 같은 전역 이름 공간을 써요 (예전 한 파일 app.js를 10-24에 섹션 그대로 나눔). 불릴 때 바로 실행되는 코드는 앞 파일 것만 쓸 수 있어요
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
const vigorWord = (v, thirsty, watered) => v >= 80 ? '생생해요' : v >= 50 ? '괜찮아요' : thirsty ? '조금 목말라 보여요' : watered ? '물을 마셨어요 · 기운이 차차 올라요' : '기운이 조금 없어 보여요';       // P14-08-02-a (10-24: 목마를 때만 "목말라")
const qualityWord = (q, bloom) => ['돌봄이 필요해 보여요', '돌봄이 필요해 보여요', '조금 지쳐 보여요', '잘 자라고 있어요', '곱게 자랐어요', bloom ? '아주 곱게 피었어요' : '아주 곱게 자랐어요'][E.stars(q)];
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
  const cupSet = kind === 'tea' ? (st.shop && E.CUP_SETS[st.shop.cup] ? st.shop.cup : 'baekja') : '';   // 찻잔 세트 (P17-15) — 그림은 st를 연 뒤에만 그림
  const id = [key, kind, locked ? 1 : 0, cupSet].join('|');
  if (spriteCache[id]) return spriteCache[id];
  const isPetal = kind === 'petal' || kind === 'dried';
  const grid = kind === 'tea' ? SPR.cup : isPetal ? PETAL_GRID : kind === 'form' ? FORM_GRID[FLOWERS[key].life === 'tree' ? 'tree' : FLOWERS[key].form] : kind === 'teabag' ? TEABAG_GRID : SPR.flowers[key];
  const pal = kind === 'tea' ? Object.assign({}, SPR.cupPal, E.CUP_SETS[cupSet].pal, { T: SPR.tea[key], f: FLOWERS[key].petal }) : isPetal ? petalPal(key, kind === 'dried') : kind === 'form' ? formPal(key) : kind === 'teabag' ? teabagPal(key) : SPR.pal[key];
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
// P17-16 정원 장식 그림: decos.js의 16×16 도트, 칭호 문장은 칭호 그림(22×22, titleURL)
const decoCache = {}, decoBitmaps = {};
function decoURL(key) {
  if (decoCache[key]) return decoCache[key];
  const info = E.decoInfo(key); if (!info) return '';
  if (info.title) return (decoCache[key] = titleURL(info.title, false, 0));
  const S = window.DECO_SPRITES[key], c = document.createElement('canvas'); c.width = c.height = 16;
  const x = c.getContext('2d');
  S.grid.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && S.pal[ch]) { x.fillStyle = S.pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return (decoCache[key] = c.toDataURL());
}
// 화면에 띄우는 크기는 원본의 정수배로 (장식 16 · 칭호 문장 22, P16-14)
const decoImg = (key, scale) => { const info = E.decoInfo(key), px = (info && info.title ? 22 : 16) * (scale || 3); return `<img class="px" src="${decoURL(key)}" width="${px}" height="${px}" alt="${esc(info ? info.name : '')}">`; };
// P18 꿀병 그림: 꿀 빛깔은 그 꽃의 꽃잎 색을 꿀색과 섞음 (들꽃꿀은 호박색)
const honeyCache = {};
function honeyURL(k) {
  if (honeyCache[k]) return honeyCache[k];
  const J = window.HONEY_JAR, hc = k === 'wild' ? '#d99a2b' : mixHex(FLOWERS[k].petal, '#d99a2b', 0.55);
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  J.grid.forEach((row, j) => [...row].forEach((ch, i) => { const col = ch === 'h' ? hc : J.pal[ch]; if (ch !== '.' && col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }));
  return (honeyCache[k] = c.toDataURL());
}
const honeyImg = (k, scale) => `<img class="px" src="${honeyURL(k)}" width="${16 * (scale || 2)}" height="${16 * (scale || 2)}" alt="${esc(E.honeyName(k))}">`;
// P24 광산 그림: 광물은 한 모양을 광물 빛깔로, 나머지는 decos.js MINE_ART 그대로
const mineCache = {};
function mineURL(k) {
  if (mineCache[k]) return mineCache[k];
  const A = window.MINE_ART, c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  let grid, pal;
  if (E.ORES[k]) { const col = E.ORES[k].color; grid = A.gem; pal = { g: col, G: mixHex(col, '#ffffff', 0.55), d: mixHex(col, '#000000', 0.45) }; }
  else { const a = E.FOSSILS[k] ? A.fossil : A[k]; if (!a) return ''; grid = a.grid; pal = a.pal; }
  grid.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return (mineCache[k] = c.toDataURL());
}
const mineImg = (k, scale) => `<img class="px" src="${mineURL(k)}" width="${16 * (scale || 2)}" height="${16 * (scale || 2)}" alt="${esc(E.mineName(k))}">`;
function decoBitmap(key) {                         // 지도에 그릴 그림 (불러오기가 끝난 뒤부터)
  let im = decoBitmaps[key];
  if (!im) { im = new Image(); im.src = decoURL(key); decoBitmaps[key] = im; }
  return im.complete && im.naturalWidth ? im : null;
}
const px16 = size => 16 * Math.max(1, size >= 48 ? Math.floor(size / 16 + 0.49) : Math.round(size / 16));   // 도트 그림은 16px의 정수배로만 (P16-14, 10-24)
const spriteImg = (key, kind, size, locked, alt) => { const s = px16(size); return `<img class="px" src="${spriteURL(key, kind, locked)}" width="${s}" height="${s}" alt="${esc(alt || '')}">`; };

// ---------------------------------------------------------------- 저장
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { return null; }   // 저장소를 쓸 수 없으면 새로 시작
  if (!raw) return null;
  try { const s = E.migrateSave(JSON.parse(raw)); if (s) return s; } catch (e) { /* 아래에서 보관 */ }
  // 열 수 없는 저장(10-24): 지우지 않고 따로 보관 → 새 정원으로 시작해도 원본은 남음, 설정에서 내려받을 수 있음
  try { if (!localStorage.getItem(KEY + '-broken')) localStorage.setItem(KEY + '-broken', raw); } catch (e) { /* 보관도 못 하면 어쩔 수 없음 */ }   // 먼저 보관한 것을 덮어쓰지 않음
  window.__brokenSave = true;
  return null;
}
function save() { try { st.lastReal = Date.now(); localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } }

let st = load() || E.create(Date.now());
// 관리자 · 테스트 기능(⏩ 배속 · 다음 달 건너뛰기)은 로컬 개발 주소에서만 (P20-12, 10-17). 배포 사이트에선 배속도 1로
const DEV = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (!DEV && st.speed !== 1) st.speed = 1;
const ctx = {
  live: false, rng: Math.random,   // 화면의 뽑기(심기 · 번식 등)는 모두 ctx.rng로 — 시뮬레이션 · 테스트처럼 시드 rng로 바꿔 끼울 수 있게
  toast: (text) => queueToast(text),
  onRecord: rec => { try { draw(); rec.snapshot = snapshot(); } catch (e) { /* 그림 없이 기록 */ } },
};

// P25-01 돌아왔을 때 한 장 요약: 3시간 넘게 비웠으면 그 사이 일지 · 돈 · 목마른 꽃 · 광산 기력을 모아 보여 줌
const AWAY_H = 3;
const awaySnap = () => ({ real: st.lastReal, money: st.money, log: st.log.length, last: st.log[st.log.length - 1] || null, energy: st.mine ? st.mine.energy : 0 });
function awayDiff(b) {
  const h = (Date.now() - b.real) / HOUR;
  if (h < AWAY_H || !st.onboarded) return null;
  let i = b.last ? st.log.lastIndexOf(b.last) + 1 : 0; if (b.last && i === 0) i = Math.max(0, st.log.length - 50);   // 일지가 600줄을 넘겨 밀렸으면 최근 50줄
  const lines = st.log.slice(i).filter(l => [3, 8, 9, 12, 13, 14, 15, 16].includes(l.type) && !l.text.startsWith('찻집에 새 주문 쪽지'));
  const cal = E.calendar(st.virtual);
  const thirsty = cal.frozen ? 0 : st.flowers.filter(f => !f.withered && E.canCare(st, f, 'water', cal)).length;
  return { h, lines, money: st.money - b.money, thirsty, energy: E.mineOf(st).energy, gained: E.mineOf(st).energy - (b.energy || 0) };
}
// 자리를 비운 동안 흐른 시간 따라잡기 (최대 3주, 그 이상은 건너뜀)
function catchUp() {
  ctx.live = false;                               // 따라잡는 동안 생긴 알림은 일지에만
  const now = Date.now(), gap = Math.max(0, now - st.lastReal), CAP = 21 * 24 * HOUR;
  if (gap > CAP) { E.advance(st, st.virtual + CAP, ctx); st.virtual += gap - CAP; st.lastAbs = E.calendar(st.virtual).abs; }
  else E.advance(st, st.virtual + gap, ctx);
  st.lastReal = now;
  ctx.live = true;
}
const awayBefore = awaySnap();
catchUp();
let awayInfo = awayDiff(awayBefore);             // 화면이 다 불린 뒤(app-main) 창으로 보여 줌 (ui는 아직 없음)

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
function undoImport(sure) {
  let g = null;
  try { g = JSON.parse(localStorage.getItem(UNDO_KEY)); } catch (e) { /* 없음 */ }
  if (!g || !g.tiles) return feedback('되돌릴 정원이 없어요', true);
  if (!sure) {                                   // 10-24: 한 번 묻고 바꿈 (지금 정원은 되돌리기 칸에 남지 않아요)
    return openModal('↩︎ 불러오기 전으로', `<div class="stack" style="gap:10px"><div class="imp-cmp">${summaryCol('지금 정원', E.saveSummary(st), '이 브라우저')}<span class="imp-arrow" aria-hidden="true">›</span>${summaryCol('되돌릴 정원', E.saveSummary(g), '보관한 정원')}</div>
      <p class="note">지금 정원은 따로 남지 않아요 · 필요하면 먼저 💾 저장해 두세요</p></div>`,
      [{ label: '취소', act: closeModal }, { label: '되돌리기', primary: true, act: () => undoImport(true) }]);
  }
  try { localStorage.removeItem(UNDO_KEY); } catch (e) { /* 무시 */ }
  swapGarden(g, '↩︎ 불러오기 전으로 되돌렸어요');
}
// 열지 못한 예전 정원 (10-24): 알림 창 · 설정에서 파일로 내려받기 · 지우기
const BROKEN_KEY = KEY + '-broken';
const brokenRaw = () => { try { return localStorage.getItem(BROKEN_KEY); } catch (e) { return null; } };
function downloadBroken() {
  const raw = brokenRaw(); if (!raw) return;
  const a = document.createElement('a'), url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  a.href = url; a.download = '도리의정원_열지못한정원.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function brokenNotice(then) {
  openModal('🧰 예전 정원을 열지 못했어요', `<p>저장된 정원을 여는 중에 문제가 생겨 새 정원으로 시작했어요.</p><p class="muted">예전 정원은 지우지 않고 따로 보관했어요. 파일로 내려받아 운영자(dorimhan@kakao.com)에게 보내 주시면 살펴볼게요 · ⚙️ 설정 › 💾 저장에서도 받을 수 있어요</p>`,
    [{ label: '닫기', act: () => { closeModal(); if (then) then(); } }, { label: '💾 내려받기', primary: true, act: () => { downloadBroken(); closeModal(); if (then) then(); } }]);
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
  const el = ui.tab === 'garden' && !ui.zoom ? snack : top;               // 정원은 지도 위 풍선, 다른 탭은 위쪽 줄
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
  if (st.flowers.some(f => f.origin !== '이웃')) { g0.bought = true; g0.planted = true; }   // 이웃의 화분(P22-02)은 산 것 · 심은 것으로 치지 않음
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
  if (k === 'sold' && st.gift != null && st.gift >= 0 && st.petals.length >= 2) return sub('꽃잎 하나는 🌾 꽃방에 널고, 하나는 🏷️ 티백으로 · 찻집은 금요일 저녁 6시(12월)부터 꽃잠까지');
  if (k === 'sold') return sub(st.starterGift ? '블렌드를 🏷️ 티백으로 만들고, 찻집에서 🫖 우려 ☕ 찻잔을 💰 판매해요' : `꽃잎을 말려 🏷️ 티백으로 · 찻집은 금요일 저녁 6시(12월)에 열어요${E.teaShopOpen(E.calendar(st.virtual)) ? ' · 지금 열려 있어요' : ` · ${realH(E.hoursToShopOpen(st.virtual) / (st.speed || 1))} 뒤`}`);   // P22-04
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
