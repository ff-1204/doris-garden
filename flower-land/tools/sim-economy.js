// 경제 시뮬레이션: 부지런한 정원사가 몇 해 동안 어떻게 벌고 쓰는지 (node flower-land/tools/sim-economy.js [해 수] [씨앗] [--no-spend] [--no-grade-deco])
// --no-spend: 찻집 가꾸기 · 장식을 사지 않는 정원사 (P17-14-08 기준선과 비교할 때)
// --no-grade-deco: 🌱 등급 장식(P28-05-01)만 사지 않음 (등급 장식 전과 비교할 때)
// --auto: 🧺 자동 장치(P28-10)를 사서 맡기는 정원사 — 기본 정원사는 사지 않음(손으로 다 하면 장치가 더 벌어 주지 않아서). 바구니 3 · 건조대 2 · 일손 1까지, 맡긴 일은 손으로 안 함
// 정책: 판매 기간마다 꽃마다 3포기까지 사서 3칸 간격으로 심고, 2시간마다 돌보기 · 용품은 모자라기 전에 삼
//       꽃잎은 모두 꽃방에 말리고, 찻집이 열리면 레시피 블렌드 → 블렌드 티백, 남은 말린 꽃잎은 티백 → 모두 우려 바로 판매
const path = require('path');
const E = require(path.join(__dirname, '..', 'engine.js'));
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), NO_SPEND = process.argv.includes('--no-spend'), NO_GRADE_DECO = process.argv.includes('--no-grade-deco'), AUTO = process.argv.includes('--auto');
const YEARS = +(args[0] || 4), SEED = +(args[1] || 7);
let s = SEED; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
const H = E.HOUR;
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const st = E.create(mon + 0.1 * H, rng); st.gardenId = `sim-${SEED}`;   // 광산 판 · 주문 쪽지 · 기념품이 이름표로 정해져서 고정 (QA 7회차: 매번 같은 값)
st.onboarded = true;   // 첫 안내를 마친 정원사 — 🗓️ 주간 목표(P28-09)는 첫 안내 뒤부터 뽑혀서 (0장 첫 방문 퀘스트 10점도 이때)
const ctx = { live: false, rng };   // rng가 없으면 번식이 Math.random을 써서 같은 씨앗이어도 결과가 달라짐
const ledger = {}; const add = (yr, k, v) => { (ledger[yr] = ledger[yr] || {})[k] = (ledger[yr][k] || 0) + v; };
const spots = []; for (let y = 2; y < E.H - 1; y += 3) for (let x = 2; x < E.W - 1; x += 3) spots.push([x, y]);
const yearNow = () => E.yearOf(st, E.calendar(st.virtual));
const KEEP = { water: 8, hoe: 6, basket: 6, shears: 4 };
function spend(k, fn) { const m = st.money, r = fn(); if (r && r.ok) add(yearNow(), k, st.money - m); return r; }
function act() {
  const cal = E.calendar(st.virtual), yr = yearNow();
  // 용품
  for (const [k, n] of Object.entries(KEEP)) while ((st[k] || 0) < n && st.money >= E.SUPPLIES[k].price + 500) spend('용품', () => E.buySupply(st, k, 1));
  // 찻집 가꾸기 (P17-15): 돈이 넉넉하면(값 + 20,000원 남음) 손님 자리 → 찻잔 세트 → 간판 순서로
  const sh = E.shopOf(st), nx = E.SEATS[sh.seats + 1];
  if (!NO_SPEND && nx && st.money >= nx.price + 20000) spend('찻집 가꾸기', () => E.addSeat(st));
  for (const [kind, list] of [['cup', E.CUP_SETS], ['sign', E.SIGNS]]) for (const [k, it] of Object.entries(list)) if (!NO_SPEND && !(kind === 'cup' ? sh.cups : sh.signs).includes(k) && st.money >= it.price + 20000) spend('찻집 가꾸기', () => E.buyDecor(st, kind, k));
  // 이웃에게 선물 (P26): 값 + 30,000원이 남으면 해마다 종류마다 한 번
  for (const k of E.GIFT_KEYS) if (!NO_SPEND && !E.giftsOf(st).sent[k] && st.money >= E.GIFTS[k].price + 30000) spend('선물', () => E.sendGift(st, k));
  // 정원 장식 (P17-16): 이달 장식을 아직 없고 돈이 넉넉하면(값 + 20,000원 남음) 하나
  for (const k of E.decoOffer(cal)) if (!NO_SPEND && !E.DECOS[k].gear && !E.DECOS[k].auto && !(st.dex.deco || {})[k] && st.money >= E.DECOS[k].price + 20000) spend('장식', () => E.buyDeco(st, k));
  // 🌱 등급 장식 (P28-05-01): 등급이 닿은 것 가운데 아직 없는 것을 같은 기준(값 + 20,000원 남음)으로 하나씩
  for (const k of E.gradeDecoOffer(st)) if (!NO_SPEND && !NO_GRADE_DECO && !(st.dex.deco || {})[k] && st.money >= E.DECOS[k].price + 20000) spend('등급 장식', () => E.buyDeco(st, k));
  // 🧺 자동 장치 (P28-10, --auto): 등급이 닿고 값 + 20,000원이 남으면 하나씩 사서 놓음
  if (AUTO) for (const [k, max] of [['autobasket', 3], ['dryrack', 2], ['teahelper', 1]]) {
    const D = E.DECOS[k];
    if (st.decos.filter(d => d.key === k).length >= max || E.gradeOf(st).grade < D.need || st.money < D.price + 20000) continue;
    const free = (x, y) => !E.flowerAt(st, x, y) && !E.decoAt(st, x, y), near = (f, x, y) => Math.max(Math.abs(f.x - x), Math.abs(f.y - y)) <= E.AUTO_R;
    let best = null;
    if (k === 'autobasket') for (let y = 0; y < E.H; y++) for (let x = 0; x < E.W; x++) {   // 바구니는 다른 바구니가 안 맡은 꽃이 둘레에 가장 많은 빈칸 (없으면 사지 않음)
      if (!free(x, y)) continue;
      const n = st.flowers.filter(f => !f.withered && near(f, x, y) && !E.placedOf(st, 'autobasket').some(d => near(f, d.x, d.y))).length;
      if (n && (!best || n > best[2])) best = [x, y, n];
    }
    else for (let x = 0; x < E.W && !best; x++) if (free(x, 0)) best = [x, 0];   // 건조대 · 일손은 자리 상관없음 → 맨 위 줄
    if (!best) continue;
    const r = spend('자동 장치', () => E.buyDeco(st, k, ctx)); if (!r.ok) continue;
    E.placeDeco(st, r.deco.id, best[0], best[1]);
  }
  const baskets = E.placedOf(st, 'autobasket'), racks = E.placedOf(st, 'dryrack').length, helper = E.placedOf(st, 'teahelper').length > 0;
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
    const byBasket = ([x, y]) => baskets.some(d => Math.max(Math.abs(x - d.x), Math.abs(y - d.y)) <= E.AUTO_R);   // 바구니 둘레는 맡김 (--auto)
    for (const t of ['water', 'weed', 'prune', 'harvest', 'fert']) for (const tl of tiles) if (t !== 'harvest' || !byBasket(tl)) E.care(st, t, [tl], ctx);
    for (const f of st.flowers) E.propagate(st, f.id, rng, ctx);
    // 꽃잎은 모두 꽃방에 (--auto: 건조대가 달 끝에 가져갈 만큼 오래된 것은 남김)
    const leave = racks * E.RACK_N;
    if (st.petals.length > leave) E.dryPetals(st, st.petals.slice(leave).map(p => p.id));
  }
  // 찻집이 열리면: 레시피 블렌드 → 블렌드 티백 → 남은 말린 꽃잎 티백 → 우려서 바로 판매
  if (E.teaShopOpen(cal)) {
    let made = true;
    while (made) {
      made = false;
      for (const k of E.BLEND_KEYS) {
        const ids = E.BLENDS[k].parts.map(p => st.dried.filter(d => d.type === p).sort((a, b) => b.q - a.q)[0]);
        if (ids.every(Boolean)) { E.blend(st, ids.map(d => d.id), ctx); made = true; }
      }
    }
    const loose = st.blends.filter(b => !b.bagged); if (loose.length) E.bagBlends(st, loose.map(b => b.id), ctx);
    if (st.dried.length) E.makeTeaDried(st, st.dried.map(d => d.id), ctx);
    if (st.teas.length || st.blends.length) E.brew(st, helper ? [] : st.teas.map(t => t.id), st.blends.map(b => b.id));   // --auto: 티백은 일손이 우림
    const mine = (st.cups || []).filter(c => !helper || c.kind === 'blend');   // 일손이 우린 잔은 카운터가 팖
    if (mine.length) {
      for (const c of mine) add(yr, c.kind === 'blend' ? (c.recipe ? '찻집: 레시피 블렌드' : '찻집: 블렌드') : '찻집: 티백 차', E.cupValue(st, c, cal));
      add(yr, '잔 수', mine.length);
      add(yr, '제철 잔', mine.filter(c => c.kind === 'tea' && E.isFresh(st, c, cal)).length);
      add(yr, '식은 잔', mine.filter(c => E.cupCold(c, cal)).length);
      E.sellCups(st, mine.map(c => c.id), ctx);
    }
  }
}
const end = st.virtual + YEARS * 7 * 24 * H;
let lastIdx = E.calendar(st.virtual).idx, help0 = st.helpYear;
const weeks = {};
while (st.virtual < end) {
  act();
  const m0 = st.money, yr = yearNow(), ac0 = (st.stats.autoCups || 0), sum0 = (st.yearNow.income || 0);
  E.advance(st, st.virtual + 2 * H, ctx);
  if (AUTO && st.stats.autoCups > ac0) { add(yr, '카운터 잔', st.stats.autoCups - ac0); add(yr, '카운터 판매', Math.max(0, (st.yearNow.income || 0) - sum0)); }   // 손님이 카운터에서 사 간 것 (쉼달 기록에 걸린 2시간은 수입을 0으로 셈)
  const c = E.calendar(st.virtual);
  if (c.idx !== lastIdx && c.idx % 2 === 0) add(yr, '하루 용돈', E.DAILY_GIFT);
  if (st.helpYear !== help0) { add(yr, '막힘 방지', 5000); help0 = st.helpYear; }
  lastIdx = c.idx;
  add(yr, '_기타', st.money - m0);
  if (st.records[0] && st.records[0].score != null && !(ledger[st.records[0].year] || {})['점수']) (ledger[st.records[0].year] = ledger[st.records[0].year] || {})['점수'] = st.records[0].score;   // P23-02 쉼달 정원 점수
  ledger[yr]['연말 돈'] = st.money;   // 해마다 마지막으로 덮어쓴 값 = 그해 끝의 돈
  ledger[yr]['_등급'] = E.gradeOf(st); ledger[yr]['_by'] = Object.assign({}, st.grade.by);   // P28-05-01 그 주(해) 끝 등급
  if (st.weekly) weeks[st.weekly.week] = JSON.parse(JSON.stringify(st.weekly));   // P28-09 그 주 목표 (마지막 모습)
}
// 표
const keys = ['하루 용돈', '찻집: 티백 차', '찻집: 블렌드', '찻집: 레시피 블렌드', ...(AUTO ? ['카운터 판매'] : []), '막힘 방지', '꽃 사기', '용품', '찻집 가꾸기', '장식', '등급 장식', ...(AUTO ? ['자동 장치'] : []), '선물', '잔 수', ...(AUTO ? ['카운터 잔'] : []), '제철 잔', '식은 잔', '연말 돈', '심은 꽃', '점수'];
console.log(['해', ...keys].join('\t'));
for (const yr of Object.keys(ledger).sort((a, b) => a - b)) {
  const L = ledger[yr];
  console.log([yr, ...keys.map(k => Math.round(L[k] || 0))].join('\t'));
}
// 🌱 정원 등급 (P28-05-01): 주(= 한 해, 월요일 3월부터)마다 끝 등급 · 그 주에 오른 등급 · 그 주 경험치와 어디서 왔는지
console.log('\n주마다 정원 등급');
console.log(['주', '등급', '이름', '+등급', '경험치', '+경험치', ...Object.keys(E.XP).map(k => '+' + k)].join('\t'));
{ let pg = 1, px = 0, pb = {};
  for (const yr of Object.keys(ledger).sort((a, b) => a - b)) {
    const g = ledger[yr]._등급, by = ledger[yr]._by; if (!g) continue;
    console.log([yr, g.grade, g.name, g.grade - pg, g.xp, g.xp - px, ...Object.keys(E.XP).map(k => (by[k] || 0) - (pb[k] || 0))].join('\t'));
    pg = g.grade; px = g.xp; pb = by;
  } }
if (AUTO) console.log(`자동 장치: ${st.decos.filter(d => E.DECOS[d.key] && E.DECOS[d.key].auto).map(d => `${E.DECOS[d.key].name}(${d.x},${d.y}) ${d.n || 0}`).join(' · ') || '없음'} · 거둠 ${st.stats.autoHarvest || 0} · 티백 ${st.stats.autoBags || 0} · 우림 ${st.stats.autoBrew || 0}`);
// 🗓️ 주간 목표 (P28-09): 주마다 뽑힌 3개 · 진행 · 끝냈는지 (정원사는 목표를 따로 쫓지 않고 늘 하던 대로)
console.log('\n주마다 목표 (✓ 끝냄)');
Object.keys(weeks).sort((a, b) => a - b).forEach((k, i) => console.log([i + 1, ...weeks[k].goals.map(g => `${g.done ? '✓' : '·'} ${E.weeklyText(g)} ${g.got}/${g.n}`), weeks[k].bonus ? '덤' : ''].join('\t')));
console.log(`끝: 돈 ${st.money} · 정원 ${st.flowers.filter(f => !f.withered).length}포기 · 도감 ${E.dexCount(st)}/${E.DEX_TOTAL}`);
// 📈 해마다 기록 (P28-07-01): 정원에 남은 줄 그대로. 쉼달 기록과 기록 사이를 한 해로 세서, 꽃잠에 판 것은 위 표(월요일 3월부터)와 다른 해에 들어갈 수 있음
console.log('\n해마다 기록 (yearLogOf)');
console.log(['해', '수입', '판 잔', '꽃잎', '주문', '점수', '등급', '도감'].join('\t'));
for (const r of E.yearLogOf(st)) console.log([r.year, r.income, r.sold, r.harvest, r.orders, r.score, r.grade == null ? '-' : r.grade, `${r.dex}/${r.dexTotal}`].join('\t'));
