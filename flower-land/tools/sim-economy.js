// 경제 시뮬레이션: 부지런한 정원사가 몇 해 동안 어떻게 벌고 쓰는지 (node flower-land/tools/sim-economy.js [해 수] [씨앗] [--no-spend] [--no-grade-deco])
// --no-spend: 찻집 가꾸기 · 장식을 사지 않는 정원사 (P17-14-08 기준선과 비교할 때)
// --no-grade-deco: 🌱 등급 장식(P28-05-01)만 사지 않음 (등급 장식 전과 비교할 때)
// --auto: 🐝 곤충 일곱(P39)과 정원 장치 둘(🧺 건조 선반 2 · 🫖 찻집 도우미 1)을 데려와 맡기는 정원사 — 기본 정원사는 사지 않음(손으로 다 하면 더 벌어 주지 않아서)
//   P65-02: 🐝 꿀벌이 창고에 넣은 꿀은 찻집이 열리면 모두 🍵 꿀차로 우려 팖 (표 '찻집: 꿀차' — --auto일 때만 칸이 있음)
//   곤충은 등급이 닿고 값 + 20,000원이 남으면 하나씩, 둘레에 꽃이 가장 많은 빈칸에 놓고 해마다 3월에 다시 그 자리로 옮김 · 맡긴 돌봄(🐌 물 · 🐞 잡초 · 🪱 비료 · 🐛 가지치기 · 🐜 거두기)은 손으로 안 함
//   --insects=barrel,teahelper처럼 몇 가지만 (장식 키 — dryshelf · teastand도) · 곤충마다 하나씩 켠 표를 잴 때 (P39-13)
// --buy: 💰 돈을 내고 사는 정원사 (P41-06) — 등급이 닿고 값 + 20,000원이 남으면 🌾 말리는 → 🌱 자라는 속도 → 곤충 둘레 순으로 한 단계씩 (곤충은 데려온 것만이라 --auto와 함께). 표의 기르기 = 낸 돈
//   --buy=save: 열린 단계가 있으면 살 때까지 찻집 가꾸기 · 선물 · 장식을 미루고 모으는 정원사 · --speed=값2:등급2:값3:등급3 · --ring=값1:값2[:up1:up2]로 값 후보를 이 시뮬 안에서만 바꿔 잼
// --bonus: 기르기(P28-05-02 · P37 · P39 · P40 · P41) 9칸을 처음부터 끝단계로 둔 정원사 (돈을 내지 않음 — 경제를 흔드는지 보는 가장 센 경우, 돈을 내고 사는 건 --buy). --auto와 함께 써야 곤충이 일함 · 🌱 자라는 · 🌾 말리는 속도는 기본 정원사에도 일함
//   --bonus=rack,basket처럼 몇 칸만 끝단계로 · --bonus brew=2(또는 --bonus=brew=2,hive=1)처럼 단계를 정할 수도 · --bonus all = 모두 끝단계 (P37)
// 🧺 작은 것은 P90부터 저절로 들어와요 (예전 --pantry 정원사와 같은 양)
// --season: 🌸 새 철(P28-08) — 해 수만큼 돌고 그 해 꽃잠(쉼달 기록 뒤)에 새 철을 시작해 다시 해 수만큼. 표의 해는 2철부터 "2철 1"처럼 (꽃 13종 조건은 꽃 도감만 채운 것으로 봄 — 아래 새 철 줄)
// --path 꽃길|찻길|흙길 (또는 flower|tea|earth): 🛤️ 철의 길(P30-04-01) — 1철부터 그 길을 걷는 정원으로 봄(실제로는 2철부터 고름) · --season이면 2철도 그 길. 돈 · 수확은 길 없이와 같아야 함 (P17-14)
// --layer4 (또는 --forest): 🌳 4층(작은 숲)이 처음부터 열린 정원(P30-02) — 2 · 3층이 열리는 대로 4층도. P39부터 숲 바람은 없고 4층이 열리면 🐞 무당벌레를 선물로 받음 (--auto면 놓음)
// --decos: P35 · P36 이달의 장식 14가지(3월 ~ 꽃샘달)를 처음부터 맨 위 줄에 놓은 정원 — 사는 돈은 같게(정원사는 기본처럼 그 달에 또 사서 창고에 둠). 연말 돈이 기본과 ±5% 안이어야 함 (P17-14)
// --workers (P37 · P39): --auto에 더해 곤충 일곱 · 장치 둘을 처음부터 공짜로 (등급 · 값 없이 — 등급 8에 닿기 전의 🦋도 잴 수 있게). 공짜로 놓으니 연말 돈은 기본과 견주지 않고 --workers끼리만
// --mine: ⛏️ 광산(P43)을 들를 때마다(2시간) 기력을 다 써서 파는 정원사 — 앞 칸부터 파고, 계단을 파면 바로 아래층(지하 20층까지) · 다 판 판은 새 굴. 💎 보석 돈은 표의 '💎 보석' · '보석 수'. 기본 정원사는 광산을 파지 않음 · --mine=day는 하루(현실 24시간)에 한 번만 들러 파는 정원사
// --ws: ⛏️ 광산 공방(P44) 효과 장식 여섯(👣 징검돌 · 💧 돌 물확 · 🏮 석등 · ⛏️ 화석 진열장 · 💎 호박 등 · 🌰 옛 씨앗 화분)을 처음부터 하나씩 공짜로 놓은 정원 — 둘레 셋은 가운데 꽃 자리 옆 · --ws=all은 꽃 자리마다 셋을 모두 붙여 모든 꽃이 둘레 안 (가장 센 경우). 광산 둘(진열장 · 호박 등)은 --mine과 함께
// --preserved (P53): 🌹 품질 · 기운 100%로 핀 꽃을 보면 바로 꺾어 프리저브드로 만들고 완성되면 바로 화원에 파는 정원사 — 🧪 특수 용액은 공짜로 늘 있음(가장 센 경우) · --mine과 함께면 광산 가방 재료로 만든 용액만 씀. 표의 '🌹 프리저브드' · '프리저브드 수'
// --title=칭호키 (P52): 그 칭호를 처음부터 대표로 건 정원 · --top: ⬆️ 위 칸에 장식을 단 정원 (칭호 덤 ×1.1) — 기본 정원사는 칭호를 걸지 않음
// --hold: P34 겨울(12 · 1 · 2월) · 꽃잠에만 모아 파는 정원사 (철 값 TEA_PRICE_MUL) · --hold=sleep: 꽃잠에만 파는 정원사 (꽃잠 값 · 꽃잠 기념품) — 기본 정원사는 찻집이 열린 달마다 팖
// 정책: 판매 기간마다 꽃마다 3포기까지 사서 3칸 간격으로 심고, 2시간마다 돌보기 · 용품은 모자라기 전에 삼
//       꽃잎은 모두 꽃방에 말리고, 찻집이 열리면 레시피 블렌드 → 블렌드 티백, 남은 말린 꽃잎은 티백 → 모두 우려 바로 판매
process.env.TZ = 'Asia/Seoul';   // 달력이 현지 시각을 따라 결과가 시간대에 흔들림 — CI(UTC)에서 22,250원이 나와 기준값(KST 22,310원 · P34 뒤 80,720원)에 고정 (10-30)
const path = require('path');
const E = require(path.join(__dirname, '..', 'engine.js'));
const PATH_I = process.argv.indexOf('--path'), PATH_ARG = PATH_I > 0 ? process.argv[PATH_I + 1] : null;
const BONUS_I = process.argv.indexOf('--bonus'), BONUS_NEXT = BONUS_I > 0 && process.argv[BONUS_I + 1] && !process.argv[BONUS_I + 1].startsWith('--') && !/^\d+$/.test(process.argv[BONUS_I + 1]) ? BONUS_I + 1 : -1;   // P37 --bonus brew=2 (뒤 값은 해 수 · 씨앗이 아님)
const PATH = PATH_ARG == null ? null : (E.PATHS[PATH_ARG] ? PATH_ARG : E.PATH_KEYS.find(k => E.PATHS[k].name === PATH_ARG) || null);
if (PATH_ARG != null && !PATH) { console.error(`모르는 길: ${PATH_ARG} (꽃길 · 찻길 · 흙길)`); process.exit(1); }
const args = process.argv.slice(2).filter((a, i) => !a.startsWith('--') && !(PATH_I > 0 && i + 2 === PATH_I + 1) && i + 2 !== BONUS_NEXT), NO_SPEND = process.argv.includes('--no-spend'), NO_GRADE_DECO = process.argv.includes('--no-grade-deco'), WORKERS = process.argv.includes('--workers'), AUTO = WORKERS || process.argv.includes('--auto'), SEASON = process.argv.includes('--season'), BONUS = (process.argv.find(a => a.startsWith('--bonus=')) || '').replace(/^--bonus=/, '') || (BONUS_NEXT > 0 ? process.argv[BONUS_NEXT] : BONUS_I > 0 ? 'all' : '');
const YEARS = +(args[0] || 4), SEED = +(args[1] || 7);
let s = SEED; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
const H = E.HOUR;
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const st = E.create(mon + 0.1 * H, rng); st.gardenId = `sim-${SEED}`;   // 광산 판 · 주문 쪽지 · 기념품이 이름표로 정해져서 고정 (QA 7회차: 매번 같은 값)
const BONUS_LV = Object.fromEntries(BONUS.split(',').filter(Boolean).map(p => p.split('=')).map(([k, n]) => [k, n == null ? null : +n]));
for (const k of Object.keys(BONUS_LV)) if (k !== 'all' && !E.BONUS[k]) { console.error(`모르는 일꾼 칸: ${k} (${E.BONUS_KEYS.join(' · ')})`); process.exit(1); }
if (BONUS) st.bonus = Object.fromEntries(E.BONUS_KEYS.map(k => [k, 'all' in BONUS_LV ? E.bonusMax(k) : k in BONUS_LV ? Math.min(E.bonusMax(k), BONUS_LV[k] == null ? E.bonusMax(k) : BONUS_LV[k]) : 0]));   // P28-05-02 · P37 --bonus
if (PATH) st.season.path = PATH;   // P30-04-01 --path
// P52 --title=t_water: 그 칭호를 처음부터 대표로 건 정원 · --top: ⬆️ 위 칸에 장식(첫 방문 칭호 문장 — 정원에는 안 놓음)을 단 정원 (덤 부분 ×1.1)
const TITLE_ARG = (process.argv.find(a => a.startsWith('--title=')) || '').replace('--title=', '');
if (TITLE_ARG) { if (!E.TITLES[TITLE_ARG]) { console.error(`모르는 칭호: ${TITLE_ARG} (${Object.keys(E.TITLES).join(' · ')})`); process.exit(1); } st.titles[TITLE_ARG] = 0; st.titleOn = TITLE_ARG; }
if (process.argv.includes('--top')) { const d = { id: -52, key: 't:t_visit', x: null, y: null }; st.decos.push(d); st.topDeco = d.id; }   // 칭호 문장(사지 않는 것) · 도감엔 안 적음 · 이름표 차례(nextId)도 안 씀 — 뽑기 · 사는 장식이 기본과 같게
const INSECTS_ARG = (process.argv.find(a => a.startsWith('--insects=')) || '').replace('--insects=', '').split(',').filter(Boolean);
for (const k of INSECTS_ARG) if (!E.DECOS[k] || !E.DECOS[k].auto) { console.error(`모르는 곤충 · 장치: ${k} (${E.AUTO_KEYS.join(' · ')})`); process.exit(1); }
// P39 --auto가 데려오는 것: 곤충 일곱(데려오는 차례) 하나씩 · 🧺 건조 선반 2 · 🫖 찻집 도우미 1 (--insects면 그것만)
const WANT = [...E.FARM_KEYS.map(k => [k, 1]), ['dryshelf', 2], ['teastand', 1]].filter(([k]) => !INSECTS_ARG.length || INSECTS_ARG.includes(k));
const BUY_SAVE = process.argv.includes('--buy=save'), BUY = BUY_SAVE || process.argv.includes('--buy');   // P41-06 돈을 내고 사는 정원사 (=save: 열린 단계가 있으면 다른 지출을 미루고 모음)
// P41 값 후보 재기: --speed=값2:등급2:값3:등급3 (🌱 · 🌾 같이) · --ring=값1:값2[:up1:up2] (곤충 둘레) — 엔진 BONUS 표를 이 시뮬 안에서만 바꿈
for (const [flag, keys] of [['--speed=', ['grow', 'dry']], ['--ring=', E.BONUS_KEYS.filter(k => E.BONUS[k].worker)]]) {
  const a = process.argv.find(x => x.startsWith(flag)); if (!a) continue;
  const v = a.slice(flag.length).split(':').map(Number);
  for (const k of keys) if (flag === '--speed=') { E.BONUS[k].price = [v[0], v[2]]; E.BONUS[k].need = [v[1], v[3]]; } else { E.BONUS[k].price = [v[0], v[1]]; if (v.length > 2) E.BONUS[k].up = [v[2], v[3]]; }
}
const BUY_ORDER = ['dry', 'grow', ...E.BONUS_KEYS.filter(k => E.BONUS[k].worker)];   // 🌾 → 🌱 → 곤충 둘레 (곤충은 데려온 것만 — --auto와 함께)
const PRES = process.argv.includes('--preserved');   // P53
const MINE_DAY = process.argv.includes('--mine=day'), MINE = MINE_DAY || process.argv.includes('--mine');   // P43 (=day: 하루 한 번만)
let mineDay = null;
const LAYER4 = process.argv.includes('--layer4') || process.argv.includes('--forest');
const HOLD = process.argv.includes('--hold=sleep') ? 'sleep' : process.argv.includes('--hold') ? 'season' : null;   // P34
if (process.argv.includes('--decos')) E.MONTH_DECO_KEYS.concat(['moonlamp', 'pavilion']).forEach((k, i) => st.decos.push({ id: st.nextId++, key: k, x: E.W - 1 - i, y: 0 }));   // P35 --decos (dex.deco는 안 적어 사는 것은 기본과 같음 · 자동 장치는 맨 위 줄 왼쪽부터라 오른쪽 끝부터)
if (LAYER4) { E.LAYERS[2].test = E.LAYERS[3].test = () => true; st.layers.at[4] = 0; }   // P30-02 --layer4: 2 · 3층은 연 것으로(시뮬 정원사는 광산을 파지 않음) · 4층 연 해를 미리 적어 둠 — 층은 다른 값에 닿지 않음
st.onboarded = true;   // 첫 안내를 마친 정원사 — 🗓️ 주간 목표(P28-09)는 첫 안내 뒤부터 뽑혀서 (0장 첫 방문 퀘스트 10점도 이때)
const ctx = { live: false, rng, path: PATH };   // rng가 없으면 번식이 Math.random을 써서 같은 씨앗이어도 결과가 달라짐
const ledger = {}; const add = (yr, k, v) => { (ledger[yr] = ledger[yr] || {})[k] = (ledger[yr][k] || 0) + v; };
const spots = []; for (let y = 2; y < E.H - 1; y += 3) for (let x = 2; x < E.W - 1; x += 3) spots.push([x, y]);
// P44 --ws · --ws=all: 공방 효과 장식을 공짜로 놓음 (꽃은 3칸 간격 자리에만 심으니 그 옆 칸은 늘 비어 있음)
const WS_ALL = process.argv.includes('--ws=all'), WS = WS_ALL || process.argv.includes('--ws');
if (WS) {
  const put = (k, x, y) => { if (x < E.W && y < E.H && !E.decoAt(st, x, y)) E.placeDeco(st, E.addDeco(st, k).id, x, y); };
  const mid = spots[Math.floor(spots.length / 2)];
  for (const [x, y] of WS_ALL ? spots : [mid]) { put('stepstone', x + 1, y); put('basin', x, y + 1); put('stonelamp', x + 1, y + 1); }
  put('fossilcase', 0, E.H - 1); put('amberlamp', 1, E.H - 1); put('oldpot', 2, E.H - 1);
}
const ykey = (n, y) => n > 1 ? n * 100 + y : y, ylabel = k => k >= 100 ? `${Math.floor(k / 100)}철 ${k % 100}` : k;   // P28-08 --season: 2철부터 해 칸을 나눔
const yearNow = () => ykey(E.seasonN(st), E.yearOf(st, E.calendar(st.virtual)));
const KEEP = { water: 8, hoe: 6, basket: 6, shears: 4 };
function spend(k, fn) { const m = st.money, r = fn(); if (r && r.ok) add(yearNow(), k, st.money - m); return r; }
// P85-02 새 놀이 유형 (옵션 없으면 기본 출력 그대로)
// --automine[=N]: ⛏️ 자동 캐기를 켜 두는 정원사 (P83-01) — 돈이 N원(기본 20,000)을 넘으면 다시 켬 · 표 '자동 캐기 낸 돈' · 끝줄에 칸 수 · 받은 돈 · 재료
// --craft: 🧺 용품이 모자라면 먼저 가방 재료로 만듦 (P83-02) — 표 '용품'이 줄어든 만큼이 재료 값 · --automine이나 --mine과 함께
// --move=N: 🪏 달마다 꽃 N포기를 옆 칸으로 옮겼다 되돌림 (P83-03, 한 번에 삽 2번) — 삽은 모자라면 삼 (표 '용품')
// --blendn: 🫖 블렌드를 꽃마다 한 번에 최대 잔으로 (P82-01, 기본은 한 잔씩 되풀이 — 같은 값이어야 함)
// --presdeco: 🌹 --preserved와 함께 — 완성된 것을 팔지 않고 꽃 옆 빈칸에 놓음 (P84) · 끝줄에 놓은 수 · 시뮬 안 꽃 품질 평균
// --presseason: 🌹 --preserved --season과 함께 — 꽃잠 전 마지막 해엔 안 팔고 모아 새 철에 팖 (P85-01 철 넘김 돈)
// --petalloop[=N]: 💐 꽃잎을 사서 말려 레시피 블렌드(=tea면 티백)로 파는 되풀이 — 달마다 N원(기본 20,000)어치 · 표 '꽃잎 사기' · '꽃잎 찻값' (P74 · P85 돈 고리 재기)
const ARGV = process.argv, flagN = (f, d) => { const a = ARGV.find(x => x === f || x.startsWith(f + '=')); return a ? (a.includes('=') ? +a.split('=')[1] : d) : null; };
const AUTOMINE = flagN('--automine', 20000), CRAFT = ARGV.includes('--craft'), MOVE_N = flagN('--move', 1), BLENDN = ARGV.includes('--blendn'), PRESDECO = ARGV.includes('--presdeco'), PRESSEASON = ARGV.includes('--presseason');
const LOOP_TEA = ARGV.includes('--petalloop=tea'), PETALLOOP = LOOP_TEA ? 20000 : flagN('--petalloop', 20000);
const P85 = { cells0: 0, paid0: 0, moved: 0, loopAbs: -1, moveAbs: -1, placed: 0 };
function presSpot() {                              // --presdeco: 꽃 옆 빈칸 (꽃 심는 자리는 비워 둠)
  for (const f of st.flowers) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) { const x = f.x + dx, y = f.y + dy;
    if (x < E.W && y < E.H && !E.flowerAt(st, x, y) && !E.decoAt(st, x, y) && !spots.some(([a, b]) => a === x && b === y)) return [x, y]; }
  return null;
}
function p85Act(cal, yr) {
  if (AUTOMINE != null) { const m = E.mineOf(st); if (!m.auto && st.money >= AUTOMINE) E.mineAutoSet(st, true, ctx);
    const paid = st.stats.autoPaid || 0; add(yr, '자동 캐기 낸 돈', -(paid - P85.paid0)); P85.paid0 = paid; }
  if (CRAFT) for (const k of E.TOOL_CRAFTS) while ((k === 'fert' ? st.fert < 4 : (st[k] || 0) < (KEEP[k] || 4)) && E.canCraft(st, k)) { E.craft(st, k, ctx); add(yr, '만든 도구 값', E.SUPPLIES[k].price); }
  if (MOVE_N && cal.abs !== P85.moveAbs) { P85.moveAbs = cal.abs; let n = 0;
    for (const f of st.flowers) { if (n >= MOVE_N) break; if (f.withered || E.flowerAt(st, f.x + 1, f.y) || E.decoAt(st, f.x + 1, f.y) || f.x + 1 >= E.W) continue;
      while ((st.shovel || 0) < 2 && st.money >= E.SUPPLIES.shovel.price) spend('삽', () => E.buySupply(st, 'shovel', 1));
      const x0 = f.x; if (E.move(st, f.id, x0 + 1, f.y, ctx).ok && E.move(st, f.id, x0, f.y, ctx).ok) { n++; P85.moved += 2; } } }
  if (PETALLOOP != null && cal.abs !== P85.loopAbs && !cal.frozen) { P85.loopAbs = cal.abs;   // 달 첫머리에 사서 넒 — 다음 달에 찻집 길로 팖
    const k = LOOP_TEA ? ['rose'] : E.BLENDS.rosejasmine.parts, unit = k.reduce((a, p) => a + E.FLOWERS[p].petals * E.petalPrice(p), 0), n = Math.min(Math.floor(PETALLOOP / unit), Math.floor(st.money / unit));
    for (let i = 0; i < n; i++) for (const p of k) { spend('꽃잎 사기', () => E.buyPetal(st, p, E.FLOWERS[p].petals)); } }
}
function act() {
  const cal = E.calendar(st.virtual), yr = yearNow();
  if (AUTOMINE != null || CRAFT || MOVE_N || PETALLOOP != null) p85Act(cal, yr);
  // ⛏️ 광산 (P43, --mine): 기력을 다 써서 파기 — 계단을 파면 바로 아래층, 다 판 판은 새 굴 (만들기는 하지 않음)
  if (MINE && (!MINE_DAY || mineDay !== Math.floor(st.virtual / (24 * H)))) { const m = E.mineOf(st); mineDay = Math.floor(st.virtual / (24 * H));
    while (m.energy >= 1) {
      if (m.depth < E.MINE_DEEPEST && m.board.cells.some(c => c.dug && c.stairs)) { const d = E.descend(st, ctx); if (d.won) add(yr, '🪜 층 돈', d.won); continue; }
      if (m.board.cells.every(c => c.dug)) E.freshBoard(st);
      const r = E.dig(st, m.board.cells.findIndex(c => !c.dug), ctx);
      if (r.jewel) { add(yr, '💎 보석', r.jewel); add(yr, '보석 수', 1); }
    } }
  // 🌹 프리저브드 (P53, --preserved): 완성된 것은 바로 팔고, 100% 꽃은 바로 꺾어 유리 돔에 (용액은 공짜 — --mine이면 가방으로 만든 것만)
  if (PRES) {
    if (PRESDECO) for (const p of st.preserved.slice()) { const c = presSpot(); if (c && E.placeDeco(st, p.id, c[0], c[1]).ok) P85.placed++; }
    const presHold = PRESSEASON && seasonAt == null && E.seasonRows(st).length >= YEARS - 1;   // 마지막 해엔 모아 둠
    if (st.preserved.length && !presHold) { const r = E.sellPreserved(st, st.preserved.map(p => p.id), ctx); add(yr, '🌹 프리저브드', r.sum); add(yr, '프리저브드 수', st.stats.presSold - (presSold0 || 0)); presSold0 = st.stats.presSold; }
    for (const f of st.flowers.slice()) { if (!E.presFull(st, f) || f.stage !== 'bloom' || f.withered) continue;
      if (MINE) { while (E.canCraft(st, 'presol') && st.presol < 1) E.craft(st, 'presol', ctx); } else st.presol = Math.max(st.presol, 1);
      E.preserve(st, f.id, ctx); }
  }
  // 용품
  for (const [k, n] of Object.entries(KEEP)) while ((st[k] || 0) < n && st.money >= E.SUPPLIES[k].price + 500) spend('용품', () => E.buySupply(st, k, 1));
  // 💰 기르기 (P41-06, --buy): 등급이 닿고 값 + 20,000원이 남으면 🌾 → 🌱 → 곤충 둘레 순으로 한 단계씩 — 열린 단계가 있으면 살 때까지 찻집 가꾸기 · 선물 · 장식을 미루고 모음 (saving)
  if (BUY) for (const k of BUY_ORDER) { const lv = E.bonusOwned(st, k) + 1; if (lv <= E.bonusMax(k) && E.bonusHas(st, k) && E.gradeOf(st).grade >= E.bonusNeed(k, lv) && st.money >= E.bonusPrice(k, lv) + 20000) { const r = spend('기르기', () => E.bonusSet(st, k, lv)); if (r.ok) bought.push(`${ylabel(yearNow())}년 ${E.monthName(E.calendar(st.virtual).month)} ${E.bonusStepName(k, lv)} ${E.bonusPrice(k, lv)}`); } }
  const saving = BUY_SAVE && BUY_ORDER.some(k => { const lv = E.bonusOwned(st, k) + 1; return lv <= E.bonusMax(k) && E.bonusHas(st, k) && E.gradeOf(st).grade >= E.bonusNeed(k, lv); });
  // 찻집 가꾸기 (P17-15): 돈이 넉넉하면(값 + 20,000원 남음) 손님 자리 → 찻잔 세트 → 간판 순서로
  const sh = E.shopOf(st), nx = E.SEATS[sh.seats + 1];
  if (!NO_SPEND && !saving && nx && st.money >= nx.price + 20000) spend('찻집 가꾸기', () => E.addSeat(st));
  for (const [kind, list] of [['cup', E.CUP_SETS], ['sign', E.SIGNS]]) for (const [k, it] of Object.entries(list)) if (!NO_SPEND && !saving && !(kind === 'cup' ? sh.cups : sh.signs).includes(k) && st.money >= it.price + 20000) spend('찻집 가꾸기', () => E.buyDecor(st, kind, k));
  // 이웃에게 선물 (P26): 값 + 30,000원이 남으면 해마다 종류마다 한 번
  for (const k of E.GIFT_KEYS) if (!NO_SPEND && !saving && !E.giftsOf(st).sent[k] && st.money >= E.GIFTS[k].price + 30000) spend('선물', () => E.sendGift(st, k));
  // 정원 장식 (P17-16): 이달 장식을 아직 없고 돈이 넉넉하면(값 + 20,000원 남음) 하나
  for (const k of E.decoOffer(cal)) if (!NO_SPEND && !saving && !E.DECOS[k].gear && !E.DECOS[k].auto && !(st.dex.deco || {})[k] && st.money >= E.DECOS[k].price + 20000) spend('장식', () => E.buyDeco(st, k));
  // 🌱 등급 장식 (P28-05-01): 등급이 닿은 것 가운데 아직 없는 것을 같은 기준(값 + 20,000원 남음)으로 하나씩
  for (const k of E.gradeDecoOffer(st)) if (!NO_SPEND && !saving && !NO_GRADE_DECO && !(st.dex.deco || {})[k] && st.money >= E.DECOS[k].price + 20000) spend('등급 장식', () => E.buyDeco(st, k));
  // 🐝 곤충 · 🧺 장치 (P28-10 · P39, --auto): 등급이 닿고 값 + 20,000원이 남으면 하나씩 사서 놓음 (--workers는 공짜로 처음부터)
  if (AUTO) for (const [k, max] of WANT) {
    const D = E.DECOS[k];
    if (st.decos.filter(d => d.key === k).length >= max) continue;
    if (!WORKERS && (E.gradeOf(st).grade < D.need || st.money < D.price + 20000)) continue;
    const best = D.insect ? bestTile(k) : topTile();   // 곤충은 둘레에 꽃이 가장 많은 빈칸 (꽃이 없으면 아직) · 장치는 자리 상관없음 → 맨 위 줄
    if (!best) continue;
    const d = WORKERS ? E.addDeco(st, k) : (spend('자동 장치', () => E.buyDeco(st, k, ctx)).deco || null); if (!d) continue;
    E.placeDeco(st, d.id, best[0], best[1]);
  }
  if (AUTO && cal.idx === 0 && moved !== cal.week) { moved = cal.week; for (const k of E.INSECT_KEYS) for (const d of E.placedOf(st, k)) { const b = bestTile(k, d); if (b) E.placeDeco(st, d.id, b[0], b[1]); } }   // 해마다 3월: 꽃 자리가 바뀌었으면 옮김
  if (LAYER4 && AUTO) for (const d of st.decos.filter(d => d.key === 'ladybug' && d.x == null)) { const b = bestTile('ladybug'); if (b) E.placeDeco(st, d.id, b[0], b[1]); }   // 4층 선물 🐞
  const racks = E.placedOf(st, 'dryshelf').length, helper = E.placedOf(st, 'teastand').length > 0;
  if (!cal.frozen) {
    // 꽃 사기 (꽃마다 정원 + 창고 3포기까지, 돈은 2,000원 남김)
    for (const k of E.FLOWER_KEYS) {
      const F = E.FLOWERS[k]; if (!F.sow.includes(cal.month)) continue;
      const have = st.flowers.filter(f => f.type === k && !f.withered).length + st.items.filter(i => i.type === k).length;
      if (have < 3 && st.money - F.price >= 2000) spend('꽃 사기', () => E.buy(st, k, 1));
    }
    // 심기
    for (const it of st.items.slice()) {
      if (!E.FLOWERS[it.type].sow.includes(cal.month) || E.germOf(it) <= 0) continue;
      const sp = spots.find(([x, y]) => !E.flowerAt(st, x, y)); if (!sp) break;
      const r = E.plant(st, it.id, sp[0], sp[1], rng);
      if (r.ok && r.flower) add(yr, '심은 꽃', 1);   // 싹이 터서 정원에 자리 잡은 것만 (안 튼 씨앗은 비료)
    }
    // 돌보기
    const tiles = st.flowers.map(f => [f.x, f.y]);
    // P39 곤충이 맡은 돌봄은 손으로 안 함 (🐌 물 · 🐞 잡초 · 🐛 가지치기 · 🐜 거두기 · 🪱 비료 — 곤충은 달 끝에 일함)
    const BY = { water: 'barrel', weed: 'ladybug', prune: 'dryrack', harvest: 'autobasket', fert: 'earthworm' };
    const kept = t => { const k = BY[t]; return new Set(st.flowers.filter(f => E.insectNear(st, k, f) && (k !== 'autobasket' || !f.mut)).map(f => f.x + ',' + f.y)); };
    for (const t of ['water', 'weed', 'prune', 'harvest', 'fert']) { const own = kept(t); for (const tl of tiles) if (!own.has(tl[0] + ',' + tl[1])) E.care(st, t, [tl], ctx); }
    for (const f of st.flowers) E.propagate(st, f.id, rng, ctx);
    // 꽃잎은 모두 꽃방에 (--auto: 🧺 건조 선반이 달 끝에 가져갈 만큼 오래된 것은 남김)
    const leave = racks * E.rackN(st);
    if (st.petals.length > leave) E.dryPetals(st, st.petals.slice(leave).map(p => p.id));
  }
  // 찻집이 열리면: 레시피 블렌드 → 블렌드 티백 → 남은 말린 꽃잎 티백 → 우려서 바로 판매
  if (E.teaShopOpen(cal) && (!HOLD || (HOLD === 'sleep' ? cal.frozen : E.teaPriceKind(cal)))) {   // P34 --hold: 겨울 · 꽃잠에만 (=sleep: 꽃잠에만)
    let made = true;
    if (BLENDN) for (const k of E.BLEND_KEYS) { const parts = E.BLENDS[k].parts, n = E.blendMax(st, parts); if (n > 0 && !E.BLENDS[k].hidden) { const ids = parts.map(p => st.dried.filter(d => d.type === p).sort((a, b) => b.q - a.q)[0].id); E.blend(st, ids, ctx, n); } }
    while (made) {
      made = false;
      for (const k of E.BLEND_KEYS) {
        const ids = E.BLENDS[k].parts.map(p => st.dried.filter(d => d.type === p).sort((a, b) => b.q - a.q)[0]);
        if (ids.every(Boolean) && E.blend(st, ids.map(d => d.id), ctx).ok) made = true;   // P77-C 블렌드는 꽃마다 petals장이 있어야 돼요 — 안 되면 멈춤
      }
    }
    const loose = st.blends.filter(b => !b.bagged); if (loose.length) E.bagBlends(st, loose.map(b => b.id), ctx);
    if (st.dried.length) E.makeTeaDried(st, st.dried.map(d => d.id), ctx);
    const honey = Object.fromEntries(Object.entries(st.honey || {}).filter(([, n]) => n > 0));   // P65-02 창고 꿀은 모두 🍵 꿀차로 (--auto 🐝 꿀벌이 넣은 꿀)
    if (st.teas.length || st.blends.length || Object.keys(honey).length) E.brew(st, helper ? [] : st.teas.map(t => t.id), st.blends.map(b => b.id), honey);   // --auto: 티백은 🫖 찻집 도우미가 우림
    for (const c of st.cups || []) delete c.steepUntil;   // P56 정원사는 3분 우려 다 우린 뒤 팖 — 한 달 사이 3분은 값 · 식음에 닿지 않으니 바로 다 우린 것으로
    const mine = (st.cups || []).filter(c => !helper || c.kind !== 'tea');   // P65-02 꿀차는 정원사가 팖   // 도우미가 우린 잔은 카운터가 팖
    if (mine.length) {
      for (const c of mine) add(yr, c.kind === 'blend' ? (c.recipe ? '찻집: 레시피 블렌드' : '찻집: 블렌드') : c.kind === 'honey' ? '찻집: 꿀차' : '찻집: 티백 차', E.cupValue(st, c, cal));
      add(yr, '잔 수', mine.length);
      add(yr, '제철 잔', mine.filter(c => c.kind === 'tea' && E.isFresh(st, c, cal)).length);
      add(yr, '식은 잔', mine.filter(c => E.cupCold(c, cal)).length);
      E.sellCups(st, mine.map(c => c.id), ctx);
    }
  }
}
// P39 곤충 놓을 자리 (꽃 심는 3칸 간격 사이): 둘레(insectR)에 든 꽃(시든 꽃 빼고, 🐛은 가지치기하는 꽃 · 🐜은 변이 아닌 꽃)이 가장 많은 빈칸 — 같으면 위 · 왼쪽부터. self = 이미 놓인 그 곤충(제자리도 후보)
function bestTile(k, self) {
  const r = E.insectR(st, k), ok = f => !f.withered && (k !== 'dryrack' || E.FLOWERS[f.type].prune) && (k !== 'autobasket' || !f.mut);
  let best = null;
  for (let y = 0; y < E.H; y++) for (let x = 0; x < E.W; x++) {
    const o = E.decoAt(st, x, y); if (E.flowerAt(st, x, y) || (o && o !== self) || spots.some(([a, b]) => a === x && b === y)) continue;   // 꽃 심을 자리(3칸 간격)는 비워 둠
    const n = st.flowers.filter(f => ok(f) && Math.max(Math.abs(f.x - x), Math.abs(f.y - y)) <= r).length;
    if (n && (!best || n > best[2])) best = [x, y, n];
  }
  return best;
}
const topTile = () => { for (let x = 0; x < E.W; x++) if (!E.flowerAt(st, x, 0) && !E.decoAt(st, x, 0)) return [x, 0]; return null; };
let moved = null, presSold0 = 0;
const bought = [];   // P41 --buy 산 것 (해 · 달 · 이름 · 값)
let end = st.virtual + YEARS * 7 * 24 * H, seasonAt = null;
const start0 = st.virtual, reach = {};   // P54 등급마다 처음 닿은 때 (해 = 현실 한 주, 소수 둘째 자리)
let lastIdx = E.calendar(st.virtual).idx, help0 = st.helpYear, m0f = 0;
const weeks = {};
while (st.virtual < end) {
  act();
  const m0 = st.money, yr = yearNow(), ac0 = (st.stats.autoCups || 0), sum0 = (st.yearNow.income || 0);
  E.advance(st, st.virtual + 2 * H, ctx);
  if (AUTO && st.stats.autoCups > ac0) { add(yr, '카운터 잔', st.stats.autoCups - ac0); add(yr, '카운터 판매', Math.max(0, (st.yearNow.income || 0) - sum0)); }   // 손님이 카운터에서 사 간 것 (쉼달 기록에 걸린 2시간은 수입을 0으로 셈)
  const c = E.calendar(st.virtual);
  if (c.idx !== lastIdx && c.idx % 2 === 0) add(yr, '하루 용돈', E.DAILY_GIFT);
  for (const b of (st.letterBox || []).filter(b => b.mail && b.mail.id.startsWith('farm-gift-') && !b.took)) { const g0 = st.money; E.mailTake(st, b.mail.id, ctx); add(yr, '농장 정착금', st.money - g0); m0f += st.money - g0; }   // P49 편지를 열면 받음
  if (st.helpYear !== help0) { add(yr, '막힘 방지', 5000); help0 = st.helpYear; }
  lastIdx = c.idx;
  add(yr, '_기타', st.money - m0 - m0f); m0f = 0;
  const rk = st.records[0] && ykey(st.records[0].season || 1, st.records[0].year);
  if (st.records[0] && st.records[0].score != null && !(ledger[rk] || {})['점수']) (ledger[rk] = ledger[rk] || {})['점수'] = st.records[0].score;   // P23-02 쉼달 정원 점수
  ledger[yr]['연말 돈'] = st.money;   // 해마다 마지막으로 덮어쓴 값 = 그해 끝의 돈
  { const g = E.gradeOf(st).grade; if (!(g in reach)) reach[g] = (st.virtual - start0) / (7 * 24 * H); }   // P54
  ledger[yr]['_등급'] = E.gradeOf(st); ledger[yr]['_by'] = Object.assign({}, st.grade.by);   // P28-05-01 그 주(해) 끝 등급
  if (st.weekly) weeks[st.weekly.week] = JSON.parse(JSON.stringify(st.weekly));   // P28-09 그 주 목표 (마지막 모습)
  // 🌸 새 철 (P28-08, --season): 해 수만큼 지난 꽃잠에 한 번 — 다음 월요일 3월부터 다시 해 수만큼
  if (SEASON && seasonAt == null && c.frozen && E.seasonRows(st).length >= YEARS) {
    const rd = E.seasonReady(st), money = st.money;
    // 시뮬 정원사는 값비싼 나무 · 연꽃을 다 피우지 못해(씨앗 7: 4년에 8종) 꽃 도감만 채운 것으로 봄 — 늘어난 도감 칸 경험치는 주지 않음(grade.dex를 맞춤)
    for (const k of E.FLOWER_KEYS) st.dex.flower[k] = true;
    st.grade.dex = E.gradeDexCount(st);
    const r = E.seasonStart(st, ctx);
    seasonAt = { ok: r.ok, msg: r.msg, years: rd.years, flowers: rd.flowers, money, end: r.ended || null };
    if (r.ok) { end = c.ws + 7 * 24 * H + 0.1 * H + YEARS * 7 * 24 * H; help0 = st.helpYear; }
  }
}
// 표
const keys = ['하루 용돈', '농장 정착금', '찻집: 티백 차', '찻집: 블렌드', '찻집: 레시피 블렌드', ...(AUTO ? ['찻집: 꿀차', '카운터 판매'] : []), ...(MINE ? ['💎 보석', '🪜 층 돈'] : []), ...(PRES ? ['🌹 프리저브드'] : []), '막힘 방지', '꽃 사기', ...(PETALLOOP != null ? ['꽃잎 사기'] : []), ...(AUTOMINE != null ? ['자동 캐기 낸 돈'] : []), ...(CRAFT ? ['만든 도구 값'] : []), ...(MOVE_N ? ['삽'] : []), '용품', '찻집 가꾸기', '장식', '등급 장식', ...(AUTO ? ['자동 장치'] : []), ...(BUY ? ['기르기'] : []), '선물', ...(MINE ? ['보석 수'] : []), ...(PRES ? ['프리저브드 수'] : []), '잔 수', ...(AUTO ? ['카운터 잔'] : []), '제철 잔', '식은 잔', '연말 돈', '심은 꽃', '점수'];
console.log(['해', ...keys].join('\t'));
for (const yr of Object.keys(ledger).sort((a, b) => a - b)) {
  const L = ledger[yr];
  console.log([ylabel(+yr), ...keys.map(k => Math.round(L[k] || 0))].join('\t'));
}
// 🌱 정원 등급 (P28-05-01): 주(= 한 해, 월요일 3월부터)마다 끝 등급 · 그 주에 오른 등급 · 그 주 경험치와 어디서 왔는지
console.log('\n주마다 정원 등급');
console.log(['주', '등급', '이름', '+등급', '경험치', '+경험치', ...Object.keys(E.XP).map(k => '+' + k)].join('\t'));
{ let pg = 1, px = 0, pb = {};
  for (const yr of Object.keys(ledger).sort((a, b) => a - b)) {
    const g = ledger[yr]._등급, by = ledger[yr]._by; if (!g) continue;
    console.log([ylabel(+yr), g.grade, g.name, g.grade - pg, g.xp, g.xp - px, ...Object.keys(E.XP).map(k => (by[k] || 0) - (pb[k] || 0))].join('\t'));
    pg = g.grade; px = g.xp; pb = by;
  }
  console.log(`등급 닿은 때(해): ${Object.keys(reach).filter(g => g % 5 === 0 || +g === E.gradeOf(st).grade).map(g => `${g} ${reach[g].toFixed(2)}`).join(' · ')}`); }   // P54 5등급마다 · 끝 등급
if (AUTO) console.log(`곤충 · 장치: ${st.decos.filter(d => E.DECOS[d.key] && E.DECOS[d.key].auto).map(d => `${E.DECOS[d.key].name}(${d.x},${d.y})`).join(' · ') || '없음'} · 거둠 ${st.stats.autoHarvest || 0} · 나비 꽃잎 ${st.stats.autoPetal || 0} · 물 ${st.stats.autoWater || 0} · 잡초 ${st.stats.autoWeed || 0} · 비료 ${st.stats.autoFert || 0} · 가지치기 ${st.stats.autoPrune || 0} · 티백 ${st.stats.autoBags || 0} · 우림 ${st.stats.autoBrew || 0}`);
// 🗓️ 주간 목표 (P28-09): 주마다 뽑힌 3개 · 진행 · 끝냈는지 (정원사는 목표를 따로 쫓지 않고 늘 하던 대로)
console.log('\n주마다 목표 (✓ 끝냄)');
Object.keys(weeks).sort((a, b) => a - b).forEach((k, i) => console.log([i + 1, ...weeks[k].goals.map(g => `${g.done ? '✓' : '·'} ${E.weeklyText(g)} ${g.got}/${g.n}`), weeks[k].bonus ? '덤' : ''].join('\t')));
if (PATH) console.log(`길: ${E.PATHS[PATH].icon} ${E.PATHS[PATH].name} · 손님 ${E.VISITOR_KEYS.filter(k => E.VISITORS[k].path === PATH).map(k => `${E.VISITORS[k].name} ${E.visitorTimes(st, k)}번`).join('')} · 등급 ${E.gradeOf(st).grade}`);
console.log(`끝: 돈 ${st.money} · 정원 ${st.flowers.filter(f => !f.withered).length}포기 · 도감 ${E.dexCount(st)}/${E.DEX_TOTAL} · 기념품 ${E.ORDER_MEMENTO_KEYS.filter(k => (st.dex.memento || {})[k]).length}/${E.ORDER_MEMENTO_KEYS.length} · 🧬 변이 ${st.flowers.filter(f => f.mut && !f.withered).length}포기 · 도감 ${E.mutDexCount(st)}종`);   // P34 기념품 (꽃잠 주문만) · P36 돌연변이 (수확 못 하는 꽃 — 돈 영향 확인)
if (WS) console.log(`공방 효과: ${['stepstone', 'basin', 'stonelamp'].map(k => `${E.DECOS[k].name} ${E.placedOf(st, k).length}`).join(' · ')} · 둘레 안 꽃 ${st.flowers.filter(f => !f.withered && ['stepstone', 'basin', 'stonelamp'].some(k => E.decoNear(st, k, f))).length}/${st.flowers.filter(f => !f.withered).length} · 씨앗 처음 품질 ${E.pct(E.seedQ(st))}%`);   // P44
if (MINE) console.log(`광산: 판 칸 ${st.stats.dug || 0} · 💎 보석 ${st.stats.jewels || 0}개 ${(st.stats.jewelWon || 0).toLocaleString('ko-KR')}원 · 가장 깊이 ${st.mine.deepest}층`);   // P43
if (PRES) console.log(`프리저브드: 만듦 ${st.stats.presMade || 0} · 팖 ${st.stats.presSold || 0} · 도감 ${E.presCount(st)}/13 · 변이 ${E.presMutCount(st)}/13`);   // P53
if (AUTOMINE != null) console.log(`자동 캐기: ${st.stats.autoDug || 0}칸 · 낸 돈 ${st.stats.autoPaid || 0}원 · 💎 ${st.stats.jewelWon || 0}원 · 🪜 ${st.stats.descendWon || 0}원 · 가장 깊이 ${st.mine.deepest}층 · 가방 ${JSON.stringify(st.mine.bag)}`);   // P85-02
if (MOVE_N) console.log(`옮기기: ${P85.moved}번`);
if (PRESDECO) console.log(`프리저브드 장식: 놓음 ${P85.placed} · 지금 ${E.placedOf(st, 'pres').length} · 꽃 품질 평균 ${Math.round(st.flowers.reduce((a, f) => a + f.q, 0) / Math.max(1, st.flowers.length) * 1000) / 10}%`);
if (BUY) console.log(`기르기 산 것: ${bought.join(" · ") || "없음"}`);   // P41 --buy
// 📈 해마다 기록 (P28-07-01): 정원에 남은 줄 그대로. 쉼달 기록과 기록 사이를 한 해로 세서, 꽃잠에 판 것은 위 표(월요일 3월부터)와 다른 해에 들어갈 수 있음
console.log('\n해마다 기록 (yearLogOf)');
console.log(['해', '수입', '판 잔', '꽃잎', '주문', '점수', '등급', '도감'].join('\t'));
for (const r of E.yearLogOf(st)) console.log([(r.season || 1) > 1 ? `${r.season}철 ${r.year}` : r.year, r.income, r.sold, r.harvest, r.orders, r.score, r.grade == null ? '-' : r.grade, `${r.dex}/${r.dexTotal}`].join('\t'));
if (SEASON) {   // 🌸 새 철 (P28-08): 1철 · 2철 같은 해끼리 연말 돈 · 잔 수 견줌 (자동 장치 · 찻집 가꾸기 · 보너스는 이어지고 수입 배율은 없음)
  console.log('\n새 철 (--season)');
  if (!seasonAt || !seasonAt.ok) console.log(`새 철을 시작하지 못함: ${seasonAt ? `${seasonAt.msg} (해 ${seasonAt.years} · 꽃 ${seasonAt.flowers}종)` : '해 수가 모자람'}`);
  else {
    console.log(`1철 ${seasonAt.end.years}해 · 끝 등급 ${seasonAt.end.grade} · 판 잔 ${seasonAt.end.sold} · 시작할 때 돈 ${seasonAt.money}원 → 15,000원 · 꽃 ${seasonAt.flowers}종`);
    console.log(['해', '1철 연말 돈', '2철 연말 돈', '1철 찻집 수입', '2철 찻집 수입', '1철 잔 수', '2철 잔 수', '1철 장치 · 가꾸기 · 장식', '2철 장치 · 가꾸기 · 장식'].join('\t'));
    const spent = L => -((L['자동 장치'] || 0) + (L['찻집 가꾸기'] || 0) + (L['장식'] || 0) + (L['등급 장식'] || 0));
    const income = L => ['찻집: 티백 차', '찻집: 블렌드', '찻집: 레시피 블렌드', '카운터 판매'].reduce((a, k) => a + (L[k] || 0), 0);
    const sum = { a: [0, 0], b: [0, 0] };
    for (let y = 1; y <= YEARS; y++) {
      const a = ledger[y] || {}, b = ledger[200 + y] || {};
      sum.a[0] += income(a); sum.a[1] += spent(a); sum.b[0] += income(b); sum.b[1] += spent(b);
      console.log([y, a['연말 돈'], b['연말 돈'], income(a), income(b), a['잔 수'] || 0, b['잔 수'] || 0, spent(a), spent(b)].map(v => v == null ? '-' : Math.round(v)).join('\t'));
    }
    console.log(`${YEARS}해 합: 찻집 수입 1철 ${Math.round(sum.a[0])} · 2철 ${Math.round(sum.b[0])} (${sum.a[0] ? Math.round((sum.b[0] - sum.a[0]) / sum.a[0] * 1000) / 10 : 0}%) · 장치 · 가꾸기 · 장식에 쓴 돈 1철 ${Math.round(sum.a[1])} · 2철 ${Math.round(sum.b[1])}`);
    console.log(`철: ${E.seasonN(st)} · 칭호 ${E.SEASON_TITLES.filter(k => st.titles[k] != null).map(k => E.TITLES[k].name).join(' · ') || '없음'}`);
  }
}
