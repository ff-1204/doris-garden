// 도리의 정원 — 게임 규칙 엔진 조각 6/10: ⛏️ 광산 · 이웃의 화분 · 첫 방문 꾸러미 · 📮 운영자 편지 · ✉️ 편지함 · 첫걸음
// P66(11-03): 예전 한 파일 engine.js(줄 1831 ~ 2276)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- ⛏️ 정원 뒤 광산 (P24, 10-24)
// 기다리는 시간에 조금씩: 기력 15칸, 1분(현실 = 게임 시간)마다 1칸 — 꺼 둔 동안에도 참(열 때 따라잡음), 꽃잠에도 팜 (P43-02, 11-01: 12칸 · 30분 → 15칸 · 1분)
// 층마다 6×6칸(P48, 11-01 사용자 요청 — 예전 P43-03 5×5 · 그 전 8×6), 한 칸 파는 데 기력 1. 계단을 찾으면 아래층. 나온 것은 팔지 않고 만들기 · 도감에만 (P24-04) — 💎 보석만 파면 바로 돈 (P43-04)
const MINE_W = 6, MINE_H = 6, MINE_MAX_E = 15, MINE_REGEN_H = 1 / 60, MINE_DEEPEST = 20;
// P43-04 💎 보석 (11-01 사용자 "선택사항이니까 열심히 하면 돈을 더 많이 버는 거지" — 경제 +5% 기준으로 값을 줄이지 않음): 칸마다 5%, 1층 5,000원 + 층마다 1,000원
// P72-04 (11-04 사용자 확정): 보석 값 ½ — 1층 2,500원 + 층마다 500원 (20층 12,000원)
const JEWEL_P = 0.05, JEWEL_BASE = 2500, JEWEL_STEP = 500;
// P50 🪜 층 내려가기 돈 (11-01 사용자 "광산 층 내려갈때마다 2000원씩"): 계단으로 한 층 내려갈 때마다 2,000원
const DESCEND_WON = 2000;
const jewelWon = depth => JEWEL_BASE + (Math.max(1, depth) - 1) * JEWEL_STEP;
const ORES = {
  quartz: { name: '석영', from: 1, color: '#e9e4f2' },
  feldspar: { name: '장석', from: 1, color: '#e6b8a0' },
  mica: { name: '운모', from: 3, color: '#c9c2a8' },
  amethyst: { name: '자수정', from: 6, color: '#9a6ac8' },
  jade: { name: '비취', from: 9, color: '#5fae84' },
  amber: { name: '호박', from: 12, color: '#e0a03a' },
};
const FOSSILS = {
  shell: { name: '조개 화석', from: 2 },
  fern: { name: '고사리 화석', from: 6 },
  leaf: { name: '잎 화석', from: 8 },
  bone: { name: '작은 뼈 화석', from: 11 },
};
const ORE_KEYS = Object.keys(ORES), FOSSIL_KEYS = Object.keys(FOSSILS);
const MINE_DEX_KEYS = [...ORE_KEYS, ...FOSSIL_KEYS, 'oldseed'];       // 광산 도감 11칸 (도감 93칸과 따로)
const mineName = k => ORES[k] ? ORES[k].name : FOSSILS[k] ? FOSSILS[k].name : k === 'oldseed' ? '옛 씨앗' : k === 'jewel' ? '보석' : k === 'stone' ? '돌' : k === 'dirt' ? '흙' : k;
// 층 판은 정원 이름표 · 층 · 몇 번째 판으로 정해지는 난수 (Math.random을 쓰지 않음 — 시뮬레이션이 흔들리지 않게)
function mineRng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function newBoard(st, depth) {
  const m = st.mine, rnd = mineRng(hashStr(`${st.gardenId || 'g'}|${depth}|${m.boards || 0}`));
  const ores = ORE_KEYS.filter(k => ORES[k].from <= depth), fos = FOSSIL_KEYS.filter(k => FOSSILS[k].from <= depth);
  const cells = [];
  for (let i = 0; i < MINE_W * MINE_H; i++) {
    if (rnd() < jewelP(st)) { cells.push({ k: 'jewel', dug: false }); continue; }   // P43-04 💎 먼저 뽑고, 나머지는 예전 비율 그대로
    const x = rnd();
    let k;
    if (depth >= 8 && x < 0.006) k = 'oldseed';
    else if (fos.length && x < 0.03) k = fos[Math.floor(rnd() * fos.length)];
    else if (x < 0.03 + 0.10 + depth * 0.004) k = ores[Math.floor(rnd() * ores.length)];
    else if (x < 0.52) k = 'stone';
    else k = 'dirt';
    cells.push({ k, dug: false });
  }
  cells[Math.floor(rnd() * cells.length)].stairs = true;             // 계단은 한 칸 (그 칸에서 나온 것도 받음)
  m.boards = (m.boards || 0) + 1;
  return { depth, cells };
}
const newMine = () => ({ energy: MINE_MAX_E, regenH: 0, depth: 1, deepest: 1, boards: 0, board: null, bag: {}, auto: false, autoStop: null, autoLog: null, autoBudget: 0, autoSpent: 0 });
function mineOf(st) {
  if (!st.mine) st.mine = newMine();
  if (!st.mine.board) st.mine.board = newBoard(st, st.mine.depth);
  return st.mine;
}
function mineRegen(st, dtH, ctx) {                // advance에서 (꽃잠에도)
  const m = st.mine, max = mineMaxE(st); if (!m) return;
  if (m.auto) mineAutoRun(st, ctx);               // P83-01 켜 두면 차는 대로 바로 — 한 걸음(15분) 안에서도 기력이 상한에 막히지 않게 한 칸씩
  if (m.energy >= max) { m.regenH = 0; return; }
  m.regenH += dtH;
  while (m.regenH >= MINE_REGEN_H - 1e-9 && m.energy < max) { m.regenH -= MINE_REGEN_H; m.energy++; if (m.auto) mineAutoRun(st, ctx); }
  if (m.energy >= max) m.regenH = 0;
}
function dig(st, i, ctx, auto) {                   // auto: P83-01 돈을 내고 판 칸 — 파기 경험치 · 주간 목표 없음 (P17-14)
  const m = mineOf(st), c = m.board.cells[i];
  if (!Number.isInteger(i) || !c) return no('그런 칸이 없어요');
  if (c.dug) return no('이미 판 칸이에요');
  if (m.energy < 1) return no('기력이 없어요 · 1분마다 한 칸씩 차요');
  m.energy--; c.dug = true;
  st.stats = st.stats || {};
  let jewel = 0;
  if (c.k === 'jewel') {                           // P43-04 💎 가방 · 도감에 넣지 않고 바로 돈 (느긋하게 보기면 숫자만 숨김)
    jewel = jewelWon(m.depth); st.money += jewel;
    st.stats.jewels = (st.stats.jewels || 0) + 1; st.stats.jewelWon = (st.stats.jewelWon || 0) + jewel;
  } else m.bag[c.k] = (m.bag[c.k] || 0) + 1;
  st.dex.mine = st.dex.mine || {};
  let first = false;
  if (MINE_DEX_KEYS.includes(c.k) && !st.dex.mine[c.k]) { st.dex.mine[c.k] = true; first = true; addLog(st, 9, `도감에 등록: ⛏️ ${mineName(c.k)}`, ctx); }
  st.stats.dug = (st.stats.dug || 0) + 1; if (!auto) { weekNote(st, 'dig', null, 1, ctx); addXp(st, 'dig', 1, ctx); }   // P28-09 · P54
  const what = jewel ? (slowView(st) ? '💎 보석을 캤어요' : `💎 보석! ${jewel.toLocaleString('ko-KR')}원`) : `${c.k === 'oldseed' ? '🌰 ' : ''}${mineName(c.k)}`;
  return ok(`${what}${c.stairs ? (m.depth >= MINE_DEEPEST ? ' · 가장 깊은 곳이에요' : ' · 아래로 내려가는 계단을 찾았어요') : ''}`, { cell: c, first, jewel, stairs: !!c.stairs && m.depth < MINE_DEEPEST });
}
function descend(st, ctx, auto) {                  // auto: P83-01 자동 캐기 (dig와 같음)
  const m = mineOf(st);
  if (!m.board.cells.some(c => c.dug && c.stairs)) return no('먼저 계단을 찾아요');
  if (m.depth >= MINE_DEEPEST) return no('가장 깊은 층이에요');
  m.depth++; m.deepest = Math.max(m.deepest, m.depth); m.board = newBoard(st, m.depth); if (!auto) { weekNote(st, 'descend', null, 1, ctx); addXp(st, 'descend', 1, ctx); }   // P28-09 · P54
  const dw = Math.round(DESCEND_WON * titlePerk(st, 'descend'));   // P52 🪜
  st.money += dw; st.stats = st.stats || {}; st.stats.descendWon = (st.stats.descendWon || 0) + dw;   // P50
  return ok(`지하 ${m.depth}층으로 내려왔어요${slowView(st) ? '' : ` · ${dw.toLocaleString('ko-KR')}원`}`, { won: dw });
}
function mineUp(st) {                            // 1층으로 돌아가기 (새 판)
  const m = mineOf(st);
  if (m.depth === 1) return no('이미 1층이에요');
  m.depth = 1; m.board = newBoard(st, 1);
  return ok('1층으로 올라왔어요');
}
function toDeepest(st) {                          // 가장 깊이 내려간 층으로 돌아가기: 기력 3 (QA 4회차)
  const m = mineOf(st);
  if (m.depth >= m.deepest) return no('이미 가장 깊은 층이에요');
  if (m.energy < 3) return no('기력이 3칸 차면 내려갈 수 있어요');
  m.energy -= 3; m.depth = m.deepest; m.board = newBoard(st, m.depth);
  return ok(`지하 ${m.depth}층으로 다시 내려왔어요`);
}
function freshBoard(st) {                        // 지금 층을 새 판으로 (다 팠을 때)
  const m = mineOf(st);
  if (m.board.cells.some(c => !c.dug)) return no('안 판 칸을 다 파면 새 굴이 열려요');
  m.board = newBoard(st, m.depth);
  return ok('새 굴을 팠어요');
}
// P83-01 ⛏️ 자동 캐기 (11-06 사용자 확정 "켜 두면 계속 파되, 1회당 돈을 내게"): 켜 두면 꺼 둔 동안에도 기력이 찰 때마다 한 칸 · 칸마다 돈을 냄 — 돈이 모자라면 꺼지고 까닭(autoStop)을 남김
//   계단을 찾으면 내려가고(층 돈은 받음), 판을 다 파면 새 판. 돈으로 산 일이라 파기 · 내려가기 경험치 · 주간 목표는 없음 (P17-14) — 도감 · 가방 · 💎 · 층 돈 · stats.dug는 그대로
//   P91-01 (11-06 사용자 확정): 값은 층과 상관없이 한 칸 100원 고정 — 예전 값(한 칸 기대 수입, 1층 320 ~ 19층 770원)은 시간당 2 ~ 4만 원을 써서 돈이 바닥나야 멈췄음. 일부러 기대 수입보다 싸게 정한 값이라 P83 · P85의 "공짜 수입이 아님" 기준은 사용자 결정으로 바뀜
//   P91-02 (11-06 사용자 확정): 켤 때 쓸 돈(m.autoBudget 남은 돈 · m.autoSpent 쓴 돈)을 고름 — 다 쓰면 꺼지고 까닭(autoStop 'budget')을 남김. 칸마다 보므로 꺼 둔 시간이 길어도 · 배속이어도 정한 돈을 넘지 않음
//   🐞 🪱 🐛 곤충(insectDig)은 기력으로 공짜로 캐요 — 놓여 있으면 기력 AUTO_KEEP_E칸은 곤충 몫으로 남기고 그 위만 씀 (흙 5 = 비료 1개)
const AUTO_DIG_WON = 100, AUTO_KEEP_E = 5;
const AUTO_BUDGETS = [{ won: 5000, name: '조금' }, { won: 10000, name: '보통' }, { won: 50000, name: '넉넉히' }], AUTO_BUDGET = 10000;   // 🐢 느긋하게 보기는 이름만
const autoDigWon = () => AUTO_DIG_WON;
const autoKeepE = st => Object.keys(INSECT_SUPPLY).some(k => placedOf(st, k).length) ? AUTO_KEEP_E : 0;
function mineAutoStep(st, ctx) {                  // 한 칸 → 팠으면 true (돈이 모자라면 끄고 false)
  const m = mineOf(st), L = m.autoLog || (m.autoLog = { n: 0, paid: 0, jewels: 0, won: 0, down: 0, downWon: 0, bag: {} });
  if (m.depth < MINE_DEEPEST && m.board.cells.some(c => c.dug && c.stairs)) { const d = descend(st, ctx, true); L.down++; L.downWon += d.won; }   // 손으로 찾아 둔 계단도
  if (m.board.cells.every(c => c.dug)) m.board = newBoard(st, m.depth);
  const price = autoDigWon();
  if ((m.autoBudget || 0) < price) { m.auto = false; m.autoStop = 'budget'; mineAutoFlush(st, ctx); return false; }   // P91-02 돈 모자람보다 먼저
  if (st.money < price) { m.auto = false; m.autoStop = 'money'; mineAutoFlush(st, ctx); return false; }
  st.money -= price; m.autoBudget -= price; m.autoSpent = (m.autoSpent || 0) + price;
  const r = dig(st, m.board.cells.findIndex(c => !c.dug), ctx, true);
  L.n++; L.paid += price; st.stats.autoDug = (st.stats.autoDug || 0) + 1; st.stats.autoPaid = (st.stats.autoPaid || 0) + price;
  if (r.jewel) { L.jewels++; L.won += r.jewel; } else L.bag[r.cell.k] = (L.bag[r.cell.k] || 0) + 1;
  return true;
}
function mineAutoRun(st, ctx) {                   // 곤충 몫을 뺀 기력을 모두
  const m = st.mine, keep = autoKeepE(st);
  while (m.auto && m.energy >= keep + 1) if (!mineAutoStep(st, ctx)) break;
}
const AUTO_STOP = { money: '돈이 모자라 자동 캐기를 멈췄어요', budget: '정한 돈을 다 써서 자동 캐기를 멈췄어요' };
// 일지는 묶어서 한 줄: 달이 바뀔 때 · 끌 때 · 멈출 때 · 오래 비운 뒤 (느긋하게 보기면 돈 숫자 없이)
function mineAutoFlush(st, ctx) {
  const m = st.mine, L = m && m.autoLog, stop = m && !m.auto ? AUTO_STOP[m.autoStop] || '' : ''; if (!L || !L.n) { if (L) m.autoLog = null; if (stop && L) addLog(st, 18, `⛏️ ${stop}`, ctx); return; }
  const slow = slowView(st), w = n => n.toLocaleString('ko-KR');
  const got = Object.entries(L.bag).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 4);
  const parts = slow ? [`⛏️ 자동 캐기로 ${L.n}칸을 팠어요`, got.length ? `${got.map(([k]) => mineName(k)).join(' · ')}${L.jewels ? ' · 보석' : ''}` : L.jewels ? '보석' : '']
    : [`⛏️ 자동 캐기 ${L.n}칸 · ${w(L.paid)}원을 냈어요`, L.jewels ? `💎 ${L.jewels}개 +${w(L.won)}원` : '', L.down ? `🪜 ${L.down}층 +${w(L.downWon)}원` : '', got.map(([k, n]) => `${mineName(k)} ${n}`).join(' · ')];
  addLog(st, 18, [...parts, stop].filter(Boolean).join(' · '), ctx); m.autoLog = null;
}
function mineAutoSet(st, on, ctx, budget) {       // 🖥️ 켜기 · 끄기 — budget: AUTO_BUDGETS의 값 (없으면 기본)
  const m = mineOf(st), price = autoDigWon();
  if (!on) { m.auto = false; m.autoStop = null; m.autoBudget = 0; mineAutoFlush(st, ctx); return ok('자동 캐기를 껐어요'); }
  if (st.money < price) return no(slowView(st) ? '돈이 모자라요' : `돈이 모자라요 · 지금 한 칸 ${price.toLocaleString('ko-KR')}원이에요`);
  m.auto = true; m.autoStop = null; m.autoSpent = 0; m.autoBudget = AUTO_BUDGETS.some(b => b.won === budget) ? budget : AUTO_BUDGET; mineAutoRun(st, ctx);
  return ok(m.auto ? '자동 캐기를 켰어요 · 기력이 차면 파요' : AUTO_STOP[m.autoStop]);
}
const mineAutoView = st => { const m = mineOf(st), L = m.autoLog; return { on: !!m.auto, stop: m.autoStop || null, price: autoDigWon(), keep: autoKeepE(st), n: L ? L.n : 0, paid: L ? L.paid : 0, left: m.autoBudget || 0, spent: m.autoSpent || 0 }; };
// 만들기 (P24-03): 돌 → 장식, 흙 → 비료, 광물 → 찻잔 유약 (P17-15 세트를 돈 대신)
const CRAFTS = {
  fert: { name: '비료', need: { dirt: 5 }, desc: '흙 5 → 🌱 비료 1' },
  // P58 (11-02 사용자 "이달의 장식으로 나오는 장식들은 광산 공방에서 제외"): 👣 징검돌 · 💧 돌 물확 · 🏮 석등은 공방에서 뺌 — 🌸 화원 이달의 장식(3 · 6 · 9월)으로만
  fossilcase: { name: '화석 진열장', need: { shell: 1, fern: 1, leaf: 1, bone: 1, stone: 10 }, deco: 'fossilcase' },
  amberlamp: { name: '호박 등', need: { amber: 3, stone: 15 }, deco: 'amberlamp' },
  oldpot: { name: '옛 씨앗 화분', need: { oldseed: 2, dirt: 10 }, deco: 'oldpot' },
  cheongja: { name: '청자 찻잔', need: { jade: 2 }, cup: 'cheongja' },               // 비취는 9층부터라 2개로
  buncheong: { name: '분청 찻잔', need: { feldspar: 4, mica: 2 }, cup: 'buncheong' },
  kkot: { name: '꽃무늬 찻잔', need: { amethyst: 2, quartz: 4 }, cup: 'kkot' },
  jar: { name: '유리 관', need: { quartz: 15, stone: 9 }, item: 'jar', desc: '석영 15 · 돌 9 → 🫙 유리 관 1' },
  presol: { name: '특수 용액', need: { quartz: 3, mica: 2, feldspar: 2 }, item: 'presol', desc: '석영 3 · 운모 2 · 장석 2 → 🧪 특수 용액 1' },   // P53 🌹 프리저브드 한 송이에 한 병 (운모는 3층부터)
  hoe: { name: '호미', need: { stone: 3, feldspar: 1 }, supply: 'hoe', desc: '돌 3 · 장석 1 → ⛏️ 호미 1개(잡초 10번)' },      // 10-31 사용자 요청: 광산에서 호미 · 가위 만들기 (화원 값 400 · 500원 — 돌 · 광석으로 대신)
  shears: { name: '가위', need: { stone: 2, mica: 1 }, supply: 'shears', desc: '돌 2 · 운모 1 → ✂️ 가위 1개(가지치기 5번)' },   // P36-04 변이 꽃을 담는 용품 (사용자 결정 ① 그대로)
  // P83-02 (11-06 사용자 확정): 키우는 도구 여섯을 모두 재료로 — 재료 값이 화원 값과 비슷하게 (흙 30 · 돌 50 · 장석 · 석영 250원으로 셈: 물병 50 = 돌 1 · 바구니 500 = 돌 5 + 장석 1 · 삽 500 = 돌 5 + 석영 1 · 호미 400 = 돌 3 + 장석 1 그대로)
  water: { name: '물병', need: { stone: 1 }, supply: 'water', desc: '돌 1 → 💧 물병 1개' },
  basket: { name: '바구니', need: { stone: 5, feldspar: 1 }, supply: 'basket', desc: '돌 5 · 장석 1 → 🧺 바구니 1개(꽃잎 거두기 10번)' },
  shovel: { name: '삽', need: { stone: 5, quartz: 1 }, supply: 'shovel', desc: '돌 5 · 석영 1 → 🪏 삽 1개(옮겨심기 10번)' },
  // P44-01 ⛏️ 광산 공방: 정원 장치 다섯도 재료로 (값은 돈으로 사기와 함께 WORKSHOP)
  heatmat: { name: '온상 매트', need: { dirt: 20, stone: 5 }, deco: 'heatmat' },
  growlight: { name: '생장등', need: { quartz: 3, stone: 10 }, deco: 'growlight' },
  greenhouse: { name: '유리 온실', need: { quartz: 10, feldspar: 5, stone: 30 }, deco: 'greenhouse' },
  dryshelf: { name: '건조 선반', need: { stone: 15, dirt: 10 }, deco: 'dryshelf' },
  stonewall: { name: '나무 울타리', need: { stone: 2 }, deco: 'stonewall' },   // P73-02 🧱 한 칸 · 여럿 · P77-A 이름
  autodryer: { name: '자동 건조기', need: { stone: 20, dirt: 10, quartz: 3 }, deco: 'autodryer' },   // P72-02 건조 선반 + 돌 5 · 석영 3 (생장등처럼 유리 창)
  teastand: { name: '찻집 도우미', need: { feldspar: 4, mica: 2, stone: 10 }, deco: 'teastand' },
};
// P44-01 ⛏️ 광산 공방 (11-01 사용자 확정): 정원에 놓는 12가지 — 재료로 만들기(CRAFTS) 또는 💰 돈으로 사기(값). 찻잔은 공방 밖 "재료 만들기" · 키우는 도구는 P83-02 TOOL_CRAFTS(값은 SUPPLIES)
const WORKSHOP = { stonewall: 500, fossilcase: 25000, amberlamp: 20000, oldpot: 15000, jar: 8000, heatmat: 15000, growlight: 30000, greenhouse: 120000, dryshelf: 18000, autodryer: 30000, teastand: 30000 };   // P73-02 🧱 돌담 500원 · P72-02 ⚙️ 자동 건조기 30,000원 (건조 선반 18,000원 한 단계 위 — 생장등 · 찻집 도우미 값)
const WORKSHOP_KEYS = Object.keys(WORKSHOP);
// P44-04 공방 효과 — 정원에 놓았을 때만(창고면 쉼). 둘레 효과는 꽃마다 한 번, 광산 · 씨앗 효과는 여러 개 놓아도 한 번
const DECO_REACH = { stepstone: 1, basin: 1, stonelamp: 2, pres: 1 };   // P84-02 🌹 놓은 프리저브드
const BASIN_H = MONTH_H / 2, LAMP_Q = 0.01, FOSSIL_E = 3, AMBER_P = 0.01, OLDPOT_Q = 0.05;
const decoNear = (st, key, f) => placedOf(st, key).some(d => Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= DECO_REACH[key]);
const waterSet = (st, f) => 2 * MONTH_H * titlePerk(st, 'water') + (decoNear(st, 'basin', f) ? BASIN_H : 0);
const mineMaxE = st => MINE_MAX_E + (placedOf(st, 'fossilcase').length ? FOSSIL_E : 0);
const jewelP = st => JEWEL_P * titlePerk(st, 'jewel') + (placedOf(st, 'amberlamp').length ? AMBER_P : 0);
function lampTick(st) {                           // onSlot: 꽃잠 달이 끝날 때 — 🏮 석등 둘레 2칸 꽃 품질 +1% (시든 꽃 빼고)
  if (!placedOf(st, 'stonelamp').length) return 0;
  let n = 0;
  for (const f of st.flowers) if (!f.withered && decoNear(st, 'stonelamp', f) && f.q < 1) { f.q = Math.min(1, f.q + LAMP_Q); n++; }
  return n;
}
// 만들기 · 사기 앞에 막는 것 (하나만 · 정원 등급)
function workshopLock(st, k) {
  const C = CRAFTS[k], D = C && C.deco && DECOS[C.deco]; if (!D) return '';
  if (D.one && (st.decos || []).some(d => d.key === C.deco)) return `${josa(D.name, '은/는')} 하나면 충분해요`;
  if (D.need && gradeOf(st).grade < D.need) return `${josa(D.name, '은/는')} 정원 등급 ${D.need}부터 놓을 수 있어요`;
  return '';
}
function workshopBuy(st, k, ctx) {               // 💰 돈으로 사기
  if (!Object.prototype.hasOwnProperty.call(WORKSHOP, k)) return no('공방에 없는 것이에요');
  const C = CRAFTS[k], price = WORKSHOP[k], lock = workshopLock(st, k);
  if (lock) return no(lock);
  if (st.money < price) return no('돈이 모자라요');
  st.money -= price;
  if (C.item) { st[C.item] = (st[C.item] || 0) + 1; return ok(`${josa(C.name, '을/를')} 샀어요 · 창고 용품에 있어요 (${st[C.item]}개)`); }
  const first = !(st.dex.deco || {})[C.deco], d = addDeco(st, C.deco);
  if (first) addLog(st, 9, `도감에 등록: 🪴 ${DECOS[C.deco].name}`, ctx);
  return ok(`${josa(C.name, '을/를')} 샀어요 · 창고에서 정원에 놓을 수 있어요`, { deco: d });
}
const CRAFT_KEYS = Object.keys(CRAFTS);
const TOOL_CRAFTS = ['water', 'fert', 'hoe', 'shears', 'basket', 'shovel'];   // P83-02 공방 「🧺 키우는 도구」 카드 차례 (= SUPPLIES 키 — 재료가 모자라면 그 카드에서 buySupply)
const canCraft = (st, k) => { const C = Object.prototype.hasOwnProperty.call(CRAFTS, k) ? CRAFTS[k] : null, bag = (st.mine && st.mine.bag) || {}; return !!C && Object.entries(C.need).every(([n, q]) => (bag[n] || 0) >= q); };
function craft(st, k, ctx) {
  const C = Object.prototype.hasOwnProperty.call(CRAFTS, k) ? CRAFTS[k] : null;
  if (!C) return no('만들 수 없는 것이에요');
  if (C.cup && shopOf(st).cups.includes(C.cup)) return no('이미 있는 찻잔이에요');
  const lock = workshopLock(st, k); if (lock) return no(lock);   // P44 장치: 하나만 · 정원 등급
  if (!canCraft(st, k)) return no('재료가 모자라요 · 광산에서 더 캐 와요');
  const bag = st.mine.bag;
  for (const [n, q] of Object.entries(C.need)) bag[n] -= q;
  addXp(st, 'craft', 1, ctx);   // P54 재료로 만든 것만 (💰 공방 사기 workshopBuy는 세지 않음)
  if (C.deco) { const first = !(st.dex.deco || {})[C.deco]; addDeco(st, C.deco); if (first) addLog(st, 9, `도감에 등록: 🪴 ${DECOS[C.deco].name}`, ctx); return ok(`${josa(C.name, '을/를')} 만들었어요 · 창고에 있어요`); }
  if (C.supply) { const S = SUPPLIES[C.supply]; st[C.supply] = (st[C.supply] || 0) + S.per; return ok(`${josa(C.name, '을/를')} 만들었어요 · ${S.name} ${S.per}${S.unit} (${st[C.supply]}${S.unit} 남음)`); }   // 10-31 호미 · 가위
  if (C.item) { st[C.item] = (st[C.item] || 0) + 1; return ok(`${josa(C.name, '을/를')} 만들었어요 · 창고 용품에 있어요 (${st[C.item]}개)`); }   // P36-04 🫙 유리 관
  if (C.cup) { shopOf(st).cups.push(C.cup); return ok(`${josa(C.name, '을/를')} 구웠어요 · 찻집 가꾸기에서 고를 수 있어요`); }
  addFert(st, 1); st._fertNew = Math.max(0, st._fertNew - 1);
  return ok('흙으로 비료 1개를 만들었어요');
}
const mineCount = st => Object.keys((st.dex && st.dex.mine) || {}).filter(k => MINE_DEX_KEYS.includes(k)).length;

// ---------------------------------------------------------------- 이웃의 화분 (P22-02, 10-24)
// 첫 방문(첫 안내 창의 '시작')에 그 달에 피어 있거나 다음 달에 피는 여러해살이 · 나무 하나를 다 자란 채로 심어 줌. 돈은 주지 않음
// 어느 요일에 시작해도 첫날 꽃 · 수확을 보고, 1장 퀘스트(P22-01)를 그 꽃으로 함
const GIFT_BY_MONTH = { 3: 'maehwa', 4: 'rose', 5: 'rose', 6: 'lavender', 7: 'jasmine', 8: 'jasmine', 9: 'gamguk', 10: 'gamguk', 11: 'gamguk', 12: 'dongbaek', 1: 'napmae', 2: 'maehwa', 13: 'maehwa', 14: 'maehwa' };
function giftPot(st, ctx, want) {                // want: 안내 창에서 보여 준 꽃 (창을 연 채 달이 바뀌어도 같은 꽃)
  if (st.gift != null) return no('이웃의 화분은 한 번만 와요');
  const cal = calendar(st.virtual), type = want && Object.values(GIFT_BY_MONTH).includes(want) ? want : GIFT_BY_MONTH[cal.month], F = FLOWERS[type];
  // 정원 가운데에서 가까운 빈 칸
  let spot = null;
  for (let r = 0; r < Math.max(W, H) && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
    const x = Math.floor(W / 2) + dx, y = Math.floor(H / 2) + dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && inGarden(x, y) && !flowerAt(st, x, y) && !decoAt(st, x, y)) spot = [x, y];
  }
  if (!spot) return no('화분을 둘 빈 칸이 없어요');
  const f = {
    id: nid(st), type, x: spot[0], y: spot[1], q: 0.8, startQ: 0.8, origin: '이웃', parent: null,
    ageH: F.mature * MONTH_H + 1, ripeH: RIPE_H, stage: 'young', bloomed: false, withered: false,   // P72-01 화분은 핀 채로 옴
    waterH: 2 * MONTH_H, weedH: 2 * MONTH_H, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 24,   // 물 · 잡초는 막 돌본 채로
    harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: yearOf(st, cal),
  };
  f.stage = computeStage(f, cal.month);
  const tl = st.tiles[f.y * W + f.x]; tl.t = F.t; tl.m = F.m;          // 화분 흙째 옮겨 심음
  st.flowers.push(f);
  st.gift = cal.abs; st.firstFlower = type;
  if (cal.frozen) {                               // 꽃잠엔 거둘 수 없으니 티백 2개도 (QA 7회차: 첫 쪽지를 들어줄 수 있게) — P22-05 꾸러미 티백 1개는 이 둘 중 하나로 셈
    for (let i = 0; i < 2; i++) st.teas.push({ id: nid(st), type, q: 0.8, seasonKey: -1, hat: false, gift: true });   // gift: 첫걸음 수확으로 치지 않음
    st.dex.teabag = st.dex.teabag || {}; st.dex.teabag[type] = true;
  }
  if (teaShopOpen(cal)) makeOrders(st, cal);      // 쪽지는 화분 꽃을 알고 나서 다시 (QA 6회차 높음)
  st.dex.form = st.dex.form || {}; st.dex.form[type] = true;
  addLog(st, 3, `이웃이 ${josa(F.name, '을/를')} 화분째 나눠 줬어요 · 정원 가운데에 심었어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께` : ''}`, ctx);
  starterPack(st, type, cal, ctx);
  return ok(`이웃이 ${josa(F.name, '을/를')} 나눠 줬어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께 받았어요` : ''} · 꽃집 할머니의 꾸러미도 왔어요`, { flower: f });
}
// ---------------------------------------------------------------- 첫 방문 꾸러미 (P22-05, 10-28)
// 화분과 함께 꽃집 할머니의 편지 + 꾸러미: 말린 꽃잎 2장(이름 있는 레시피 두 재료) · 화분 꽃 티백 1개 · 🍵 첫 손님 한 번. 돈은 주지 않음
// 화분 꽃이 들어가는 공개 레시피가 있으면 그 짝, 없으면(동백) 겨울에 어울리는 「겨울 매화향」. 화분 꽃잎은 거두고 1달 말려야 하니 두 재료를 모두 줌
const STARTER_BLEND = { maehwa: 'plumwinter', napmae: 'plumwinter', dongbaek: 'plumwinter', rose: 'springfield', lavender: 'sleepnight', jasmine: 'pondmorning', gamguk: 'autumngarden' };
function starterPack(st, type, cal, ctx) {
  const recipe = STARTER_BLEND[type] || 'springfield';
  for (const p of BLENDS[recipe].parts) for (let i = 0; i < FLOWERS[p].petals; i++) st.dried.push({ id: nid(st), type: p, q: 0.8, gift: true });   // gift: 거의 새 정원 판단에서 뺌 · 말린 수 · 꽃잎 도감엔 넣지 않음 · P77-C 꽃마다 티백 하나 몫(petals장)
  // 꽃잠엔 위 티백 2개가 꾸러미 티백을 겸함. 도감 티백엔 넣지 않아 1장 "○○ 티백 만들기"는 직접 만들어야 끝남
  if (!cal.frozen) st.teas.push({ id: nid(st), type, q: 0.8, seasonKey: -1, hat: false, gift: true });
  st.firstGuest = true;
  st.dex.letter = st.dex.letter || {}; st.dex.letter.welcome = true;
  (st.letterBox = st.letterBox || []).push({ k: 'welcome', gift: null, re: null, pack: { recipe, tea: type }, y: yearOf(st, cal), m: cal.month, read: false, at: st.virtual });
  addLog(st, 17, `꽃집 할머니에게서 편지와 꾸러미가 왔어요 · 말린 ${BLENDS[recipe].parts.map(k => FLOWERS[k].name).join(' · ')} 꽃잎 · ${FLOWERS[type].name} 티백 · 🍵 첫 손님 한 번`, ctx);
}
const starterText = pack => `말린 ${BLENDS[pack.recipe].parts.map(k => FLOWERS[k].name).join(' · ')} 꽃잎 (섞으면 「${BLENDS[pack.recipe].name}」) · ${FLOWERS[pack.tea].name} 티백 · 🍵 첫 손님 한 번`;
// P22-05-03 🍵 첫 손님: 찻집이 닫혀 있어도 딱 한 번 (P34부터 찻집이 매달 열려 화면엔 안 나옴 — 첫 찻잔이 팔리면 표가 사라짐), 티백(꽃 · 블렌드) 하나를 우려 그 찻잔을 바로 팖. 닫힌 찻집의 예외는 여기 한 곳 (brew · sellCups는 그대로)
// 표는 찻잔이 한 잔이라도 팔리면(찻집이 열린 때 · 손님 · 일손 포함) 사라짐 — countCup
const firstGuestReady = st => !!st.firstGuest && !teaShopOpen(calendar(st.virtual));
function firstGuest(st, id, ctx) {
  if (!st.firstGuest) return no('첫 손님은 한 번만 와요');
  const cal = calendar(st.virtual);
  if (teaShopOpen(cal)) return no('찻집이 열려 있어요 · 🫖 우림으로 우려 팔아요');
  const t = st.teas.find(x => x.id === id), b = t ? null : st.blends.find(x => x.id === id && x.bagged);
  if (!t && !b) return no('우릴 티백이 없어요 · 제다실에서 만들어요');
  if (t) st.teas.splice(st.teas.indexOf(t), 1); else st.blends.splice(st.blends.indexOf(b), 1);
  const { gift, ...src } = t || b, c = { ...src, id: nid(st), kind: t ? 'tea' : 'blend', brewAbs: cal.abs };
  st.cups = st.cups || []; st.cups.push(c);
  const sum = sellCupList(st, cal, [c], ctx);
  st.firstGuest = false;
  const nm = t ? FLOWERS[t.type].tea : b.name;
  return ok(`🍵 첫 손님이 ${josa(nm, '을/를')} 사 갔어요 · +${sum.toLocaleString('ko-KR')}원`, { sum });
}

// ---------------------------------------------------------------- 📮 운영자 편지 (P29, 10-28)
// 운영자가 저장소의 flower-land/mail.json에 적어 배포하면, 화면이 같은 사이트의 그 파일을 읽어 여기로 넘김 (아무것도 보내지 않음)
// 한 통: { id, from, title, text, gifts: [{ cat, key, n }], start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', to: 'all' | 'new' | 'before:YYYY-MM-DD' }
// 선물은 이웃 답례품과 같은 종류 · 같은 곳(giveReturn · RETURN_WHERE). 돈 · 칭호는 받지 않음 (확정 ②). 날짜는 한국 시간 하루 단위
const MAIL_CATS = ['seed', 'supply', 'honey', 'mine', 'deco'];
const MAIL_WARN = 10000, MAIL_MAX = 30000;        // (물건 선물)
const MAIL_MONEY_MAX = 50000;                      // 10-31 사용자 결정: 📮 편지로 돈도 보낼 수 있음(이벤트용 예외, P17-14 밖) — 한 통 5만 원까지. { cat: 'money', key: 'won', n: 원 }        // 편지 한 통의 선물 가치(returnValue 합): 넘으면 테스트 경고 · 막기 (확정 ①)
const MAIL_LEN = { id: 40, from: 20, title: 30, text: 400 };
const MAIL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const kstDay = ms => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);   // 한국 시간 날짜 'YYYY-MM-DD'
const mailDayOk = d => { if (typeof d !== 'string' || !MAIL_DAY.test(d)) return false; const t = Date.parse(d + 'T00:00:00+09:00'); return Number.isFinite(t) && kstDay(t) === d; };   // 11-31 같은 없는 날도 막음
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// 넣을 수 있는 선물인가: 엔진에 있는 것 · 값을 셀 수 있는 것만 (광산은 답례품에 나오는 재료 · 화석, 장식은 화원 장식 중 꾸밈만)
function mailGiftOk(g) {
  if (g && g.cat === 'money') return g.key === 'won' && Number.isInteger(g.n) && g.n >= 1 && g.n <= MAIL_MONEY_MAX;   // 돈: 한 선물 5만 원까지
  if (!g || !MAIL_CATS.includes(g.cat) || typeof g.key !== 'string' || !Number.isInteger(g.n) || g.n < 1) return false;
  const k = g.key;
  return g.cat === 'seed' ? has(FLOWERS, k) : g.cat === 'supply' ? has(SUPPLIES, k) : g.cat === 'honey' ? HONEY_KEYS.includes(k)
    : g.cat === 'mine' ? has(FOSSILS, k) || (k !== 'honey' && k !== 'fossil' && has(RETURN_V, k)) : DECO_KEYS.includes(k) && !!DECOS[k].price && !DECOS[k].func;   // 수입을 늘리는 장식(벌통 · 빗물 통 · 장치)은 빼고 (P17-14, 답례품과 같게)
}
const mailValue = m => ((m && m.gifts) || []).filter(g => mailGiftOk(g) && g.cat !== 'money').reduce((a, g) => a + returnValue(g), 0);   // 물건 선물 값(돈은 따로)
const mailMoney = m => ((m && m.gifts) || []).filter(g => g && g.cat === 'money' && Number.isInteger(g.n) && g.n > 0).reduce((a, g) => a + g.n, 0);
// 편지 한 통 검사 (tests/mail.test.js가 실제 mail.json에 씀): 틀린 곳 목록, 비면 통과. mailDeliver는 틀린 편지를 건너뜀
function mailCheck(m) {
  const e = [], str = (k, need) => { const v = m[k]; if (typeof v !== 'string' || (need && !v.trim())) e.push(`${k}: 글자가 없어요`); else if (v.length > MAIL_LEN[k]) e.push(`${k}: ${MAIL_LEN[k]}자를 넘어요 (${v.length}자)`); };
  if (!m || typeof m !== 'object' || Array.isArray(m)) return ['편지가 { } 모양이 아니에요'];
  str('id', true); str('from', true); str('title', true); str('text', true);
  if (typeof m.id === 'string' && !/^[0-9A-Za-z_-]+$/.test(m.id)) e.push('id: 영문 · 숫자 · - · _만 써요');
  if (!mailDayOk(m.start)) e.push('start: YYYY-MM-DD 날짜가 아니에요');
  if (!mailDayOk(m.end)) e.push('end: YYYY-MM-DD 날짜가 아니에요');
  if (mailDayOk(m.start) && mailDayOk(m.end) && m.start > m.end) e.push('start가 end보다 늦어요');
  const to = m.to;
  if (!(to === 'all' || to === 'new' || (typeof to === 'string' && to.startsWith('before:') && mailDayOk(to.slice(7))))) e.push('to: all · new · before:YYYY-MM-DD 중 하나예요');
  if (!Array.isArray(m.gifts)) e.push('gifts: [ ] 목록이 아니에요 (선물이 없으면 [])');
  else m.gifts.forEach((g, i) => {
    if (g && g.cat === 'title') e.push(`gifts[${i}]: 칭호는 선물로 못 넣어요`);
    else if (!mailGiftOk(g)) e.push(`gifts[${i}]: 모르는 선물이에요 (${JSON.stringify(g)})`);
  });
  if (Array.isArray(m.gifts) && mailValue(m) > MAIL_MAX) e.push(`선물 가치 ${mailValue(m).toLocaleString('ko-KR')}원이 상한 ${MAIL_MAX.toLocaleString('ko-KR')}원을 넘어요`);
  if (Array.isArray(m.gifts) && mailMoney(m) > MAIL_MONEY_MAX) e.push(`돈 선물 ${mailMoney(m).toLocaleString('ko-KR')}원이 상한 ${MAIL_MONEY_MAX.toLocaleString('ko-KR')}원을 넘어요`);
  return e;
}
// 받는 사람: 정원을 시작한 때는 정원 이름표의 만든 때(gardenBorn). 모르면(이상한 이름표) 오래된 정원으로 봄 — new 아님 · before는 받음
function mailFor(st, m, now) {
  const day = kstDay(now);
  if (day < m.start || day > m.end) return false;
  if (m.to === 'all') return true;
  const born = gardenBorn(st), bd = born ? kstDay(born) : null;
  if (m.to === 'new') return !!bd && bd >= m.start && bd <= m.end;
  return !bd || bd < m.to.slice(7);
}
// 받은 편지함이 가득하면 밀어냄 (P29-03): 다시 볼 것 없는 이웃 답장 → 선물을 받은 📮 편지 → 맨 앞. 선물을 안 받은 📮 편지는 밀지 않음 (모두 그렇다면 넘쳐도 둠)
function trimLetterBox(st) {
  const box = st.letterBox;
  while (box.length > LETTER_BOX_MAX) {
    let i = box.findIndex(b => !b.k && !b.mail && b.read);
    if (i < 0) i = box.findIndex(b => b.mail && b.took);
    if (i < 0) i = box.findIndex(b => !(b.mail && !b.took));
    if (i < 0) return;
    box.splice(i, 1);
  }
}
// 읽은 편지 목록에서 이 정원이 받을 것을 받은 편지함에 넣음 (선물은 아직). 받은 기록 st.mailGot[id] = 받은 때(ms) — 저장 · 드라이브에 실려 다른 기기에서도 두 번 안 옴
function mailDeliver(st, list, now, ctx) {
  if (!Array.isArray(list)) return 0;
  st.mailGot = st.mailGot || {}; st.letterBox = st.letterBox || [];
  const cal = calendar(st.virtual); let n = 0;
  for (const m of list) {
    if (!m || typeof m.id !== 'string' || has(st.mailGot, m.id)) continue;
    if (mailCheck(m).some(x => !x.startsWith('gifts[') && !x.startsWith('선물 가치') && !x.startsWith('돈 선물'))) continue;   // 선물 쪽 오류는 선물만 거르고 편지는 옴   // 모양이 틀린 편지는 통째로 건너뜀
    if (!mailFor(st, m, now)) continue;
    const gifts = m.gifts.filter(mailGiftOk).map(g => ({ cat: g.cat, key: g.key, n: g.n }));   // 모르는 선물(손댄 파일) · 칭호는 빼고 (돈은 5만 원까지 허용 — 10-31)
    if (mailValue({ gifts }) > MAIL_MAX || mailMoney({ gifts }) > MAIL_MONEY_MAX) gifts.length = 0;                                      // 상한을 넘는 선물은 주지 않음 (테스트가 막지만 한 번 더)
    st.mailGot[m.id] = now;
    st.letterBox.push({ k: null, mail: { id: m.id, from: m.from, title: m.title, text: m.text, gifts }, took: gifts.length ? null : true, y: yearOf(st, cal), m: cal.month, read: false, at: st.virtual });
    trimLetterBox(st);
    addLog(st, 17, `📮 새 편지가 왔어요 · ${m.from}「${m.title}」${gifts.length ? ' · 🎁 선물이 있어요' : ''}`, ctx);
    n++;
  }
  if (n && ctx && ctx.live && ctx.toast) ctx.toast(n > 1 ? `📮 새 편지 ${n}통이 왔어요` : '📮 새 편지가 왔어요');
  return n;
}
const mailOf = (st, id) => (st.letterBox || []).find(b => b.mail && b.mail.id === id) || null;
const mailGiftText = gifts => gifts.map(returnText).join(' · ');
// 🎁 받기: 편지함에 있는 동안은 기간이 지나도 받을 수 있음
function mailTake(st, id, ctx) {
  const b = mailOf(st, id);
  if (!b) return no('편지함에 없는 편지예요');
  if (b.took) return no('이미 받은 선물이에요');
  const gifts = b.mail.gifts.filter(mailGiftOk);
  for (const g of gifts) giveReturn(st, g, ctx);
  b.took = true; b.read = true;
  const where = [...new Set(gifts.map(g => RETURN_WHERE[g.cat]))].join(' · ');
  if (gifts.length) addLog(st, 17, `📮 ${b.mail.from}의 선물 ${mailGiftText(gifts)} · ${where}에 있어요`, ctx);
  return ok(gifts.length ? `🎁 ${where}에 넣었어요` : '편지를 읽었어요', { gifts, where });
}

// ---------------------------------------------------------------- ✉️ 편지함 (P31-01, 10-30)
// 편지 셋 갈래(이웃 답장 P26-02 · 📮 운영자 편지 P29 · 💌 첫 방문 편지 P22-05)와 알림 한 줄로 지나간 소식을 한곳에. 돈 · 보상 없음 — 읽기만
// 소식은 따로 쌓지 않고 일지(st.log + 쉼달에 옮겨진 st.records[].log)에서 NEWS_MATCH로 거름. 안 읽은 것 = st.mailSeenAt(마지막으로 연 때, st.virtual) 뒤에 생긴 것
//   시각 at은 소식 줄 · 받은 편지에만 적음(addLog · letterBox) — 시각이 없는 예전 줄 · 편지는 읽은 것
const INBOX_NEWS_MAX = 30;
// 소식 갈래: [갈래, 아이콘, 맞는지(일지 줄), 느긋하게 보기 문장(숫자 없이 — 없으면 그대로, 그래도 숫자가 남으면 그 줄은 뺌)]
const NEWS_MATCH = [
  ['yearly', '🗓️', l => l.type === 9 && (/^올해 .+왔어요$/.test(l.text) || / 못 봤어요 · 다음 해 /.test(l.text))],
  ['visitor', '🐾', l => l.type === 9 && VISITOR_KEYS.some(k => l.text.startsWith(VISITORS[k].icon + ' ')) && /(앉았어요|다녀갔어요|남겼어요)/.test(l.text)],
  ['layer', '🌳', l => l.type === 9 && (LAYERS.some(L => L && L.openText === l.text) || /^\S+ 정원의 \d+층 .+열렸어요$/.test(l.text)), t => t.replace(/정원의 \d+층 /, '')],
  ['season', '🌸', l => l.type === 7 && l.text.startsWith('🌸 '), t => { const m = t.match(/ · ([^·]+로 걸어요)/); return `🌸 새 철을 시작했어요${m ? ` · ${m[1]}` : ''}`; }],
  ['memento', '💌', l => l.type === 15 && /주문을 받은 손님이 .+두고 갔어요$/.test(l.text)],
  ['wind', '🐞', l => l.type === 19, t => /잡초/.test(t) ? '무당벌레가 잡초를 치웠어요' : t],   // P30-02 숲 바람 옛 줄 · P39-08-02 4층 🐞 선물 줄
  ['title', '🏅', l => l.type === 9 && l.text.startsWith('🏅 새 칭호')],
];
const newsKind = l => NEWS_MATCH.find(([, , ok]) => ok(l)) || null;
// 소식 한 줄 문장 (느긋하게 보기면 숫자 없이 — 고칠 수 없으면 null = 그 줄은 뺌, P30-08). 줄 아이콘과 같은 문장 머리 아이콘은 뺌 (🏅 🏅 겹침)
function newsText(st, l, K) {
  const t = slowView(st) && K[3] ? K[3](l.text) : l.text;
  if (slowView(st) && /\d/.test(t)) return null;
  return t.startsWith(K[1] + ' ') ? t.slice(K[1].length + 1) : t;
}
const inboxSeen = st => st.mailSeenAt == null ? Infinity : st.mailSeenAt;
const inboxNew = (st, at) => at != null && at > inboxSeen(st);
function inboxLetters(st) {
  const out = [], had = {};
  (st.letterBox || []).forEach((b, i) => {
    const L = b.k ? LETTERS[b.k] : null, kind = b.mail ? 'mail' : b.k === 'welcome' ? 'welcome' : 'neighbor';
    if (b.k) had[b.k] = true;
    out.push({ kind, id: b.mail ? b.mail.id : null, key: b.k || null, i, from: b.mail ? b.mail.from : L ? L.from : '이웃',
      title: b.mail ? b.mail.title : kind === 'welcome' ? '첫 방문 편지' : L ? '답장' : '고맙다는 답장',
      y: b.y, m: b.m, at: b.at == null ? null : b.at, read: !!b.read, gift: !!(b.mail && !b.took), unread: inboxNew(st, b.at) });
  });
  const dl = (st.dex && st.dex.letter) || {};   // 받은 편지함이 생기기 전(P26-06)에 왔거나 밀려난 답장은 도감에만 — 언제인지 몰라 맨 아래
  for (const k of [...LETTER_KEYS, 'welcome']) if (dl[k] && !had[k]) out.push({ kind: k === 'welcome' ? 'welcome' : 'neighbor', id: null, key: k, i: -1, from: LETTERS[k].from, title: k === 'welcome' ? '첫 방문 편지' : '답장', y: null, m: null, at: null, read: true, gift: false, unread: false });
  const t = x => x.at == null ? -Infinity : x.at;
  return out.sort((a, b) => t(b) - t(a) || b.i - a.i);   // 최근 것부터 (시각이 같거나 모르면 나중에 받은 것부터)
}
function inboxNews(st) {
  const all = [];
  for (const l of [...(st.records || []).slice().reverse().flatMap(r => r.log || []), ...(st.log || [])]) {   // 오래된 해부터
    const K = newsKind(l); if (!K) continue;
    const text = newsText(st, l, K); if (text == null) continue;
    const vk = K[0] === 'visitor' ? VISITOR_KEYS.find(k => text.startsWith(VISITORS[k].icon + ' ')) : null;   // 🐾 줄은 손님 아이콘을 줄 아이콘으로 (🐾 🦔 겹침 없이)
    const icon = vk ? VISITORS[vk].icon : K[1], body = vk ? text.slice(VISITORS[vk].icon.length + 1) : text;
    all.push({ type: l.type, kind: K[0], icon, text: body, y: l.y, m: l.m, d: l.d, at: l.at == null ? null : l.at, unread: inboxNew(st, l.at) });
  }
  return { list: all.slice(-INBOX_NEWS_MAX).reverse(), more: all.length > INBOX_NEWS_MAX };   // 최근 30줄 · 넘으면 more ("그 밖은 📜 정원 일지에" — 열린 질문 ①)
}
// 화면이 읽는 것: { letters, news, more, unread(안 읽은 수 — 화면엔 점 하나만, 수는 보이지 않음) }
function inboxOf(st) {
  const letters = inboxLetters(st), n = inboxNews(st);
  return { letters, news: n.list, more: n.more, unread: letters.filter(x => x.unread).length + n.list.filter(x => x.unread).length };
}
// 위 막대 점 (그리기마다 불림): 뒤에서부터 보다가 읽은 시각을 지나면 멈춤
function inboxUnread(st) {
  const s = inboxSeen(st);
  if ((st.letterBox || []).some(b => b.at != null && b.at > s)) return true;
  for (const log of [st.log || [], ...(st.records || []).map(r => r.log || [])]) {
    for (let i = log.length - 1; i >= 0; i--) {
      const l = log[i]; if (l.at == null) continue;
      if (l.at <= s) break;
      const K = newsKind(l); if (K && newsText(st, l, K) != null) return true;
    }
  }
  return false;
}
// 편지함을 열면 지금까지 온 것을 읽은 것으로 (편지마다의 read · 🎁 받기는 그대로 — 열린 질문 ③)
function inboxOpen(st) { st.mailSeenAt = st.virtual; return ok('편지함을 열었어요'); }

// ---------------------------------------------------------------- 첫걸음 (P11-01-05 · P04-05 · P22-02)
// 어떤 단계를 어떤 순서로 하는지, 이미 한 것은 ✓. 단계 이름은 화면(app.js GUIDE_LABEL)이 붙임
const GUIDE_STEPS = {
  base: ['bought', 'planted', 'watered', 'harvested', 'sold'],
  gift: ['blended', 'sold', 'bought', 'planted', 'watered', 'harvested'],   // P04-04 예전 시작 선물 정원
  sleep: ['reserved', 'planted', 'watered', 'harvested', 'sold'],           // P04-05 꽃잠에 시작: 화원이 닫혀 있으니 예약부터
};
const gotPot = st => st.gift != null && st.gift >= 0;
const potFlower = st => (gotPot(st) && st.flowers.find(f => f.origin === '이웃' && !f.withered)) || null;
// 변경 10-27 (사용자 요청): 화분이 이미 심겨 있으니 화분을 받은 정원은 "🌸 정원의 첫 꽃 돌보기"부터 (문구 변경 10-27: 남의 것이 아닌 내 꽃으로)
function guideKeys(st) {
  const ks = st.starterGift ? GUIDE_STEPS.gift : st.startedInSleep ? GUIDE_STEPS.sleep : GUIDE_STEPS.base;
  return gotPot(st) ? ['pot', ...ks] : ks;
}
function guideFill(st) {
  const g = st.guide = st.guide || {};
  if (st.flowers.some(f => f.origin !== '이웃')) { g.bought = true; g.planted = true; }   // 이웃의 화분은 산 것 · 심은 것으로 치지 않음
  if (st.items.length) g.bought = true;
  if (st.reservations.length || g.bought) g.reserved = true;   // 예약을 건너뛰고 월요일에 바로 사도 됨
  if (Object.keys(st.dex.petal || {}).length || Object.keys(st.dex.tea).length || (!st.starterGift && (st.petals.length || st.teas.some(t => !t.gift)))) g.harvested = true;   // 시작 선물 꽃잎 · 화분과 받은 티백은 수확으로 치지 않음
  if (gotPot(st) && !potFlower(st)) g.pot = true;  // 받은 화분이 시들었거나 없으면 누를 수 없으니 (받기 전엔 그대로)
  return g;
}
// 플레이어가 지도에서 화분을 직접 누르거나 그 화분에 돌보기를 했을 때. 새로 ✓가 되면 true
function guideTap(st, f) {
  if (!f || f.origin !== '이웃' || (st.guide && st.guide.pot)) return false;
  guideFill(st).pot = true;
  return true;
}

