// P53 🌹 프리저브드 플라워 (11-01 사용자 요청): 품질 · 기운 100%인 다 핀 꽃을 꺾어 🧪 특수 용액과 꽃방 유리 돔에 → 현실 하루 뒤 창고 → 화원에서 팖 · 도감 13 + 변이 13 · 덤 칭호 둘
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), SUN = new Date(2026, 9, 11, 7, 0, 0).getTime();
const ctx = { live: false, rng: () => 0.5 };
const fresh = (t, id) => { const s = E.create(t || MON, () => 0.5); s.onboarded = true; s.gardenId = id || 'p53'; return s; };
// 다 핀 꽃 한 포기 (땅을 그 꽃이 좋아하는 값으로 맞춰 기운 100%)
function bloom(s, type, x, y, o) {
  const F = E.FLOWERS[type], tl = s.tiles[y * E.W + x]; tl.t = F.t; tl.m = F.m;
  const f = { id: s.nextId++, type, x, y, q: 1, startQ: 1, origin: '화원', parent: null, ageH: 99 * E.MONTH_H, lifeH: 99 * E.MONTH_H, stage: 'bloom', ripeH: 6, bloomed: true, withered: false,
    waterH: 24, weedH: 24, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: E.calendar(s.virtual).abs, propYear: null, propRest: false, plantedYear: 1, ...(o || {}) };
  s.flowers.push(f); return f;
}

console.log('[만들 수 없을 때]');
{ const s = fresh(), f = bloom(s, 'rose', 3, 3);
  check(E.presFull(s, f) && E.vigorOf(s, f) === 100, '시험 꽃은 품질 · 기운 100%');
  check(E.presReason(s, f) === '⛏️ 광산에서 특수 용액을 만들어요' && !E.preserve(s, f.id, ctx).ok, '용액이 없으면 못 만듦 · 광산 안내');
  s.presol = 1;
  f.q = 0.99; check(E.presReason(s, f) === '품질 · 기운이 100%일 때 만들 수 있어요' && !E.preserve(s, f.id, ctx).ok, '품질 99%면 못 만듦');
  f.q = 1; f.thirstH = E.MONTH_H; check(E.presReason(s, f) === '품질 · 기운이 100%일 때 만들 수 있어요', '목말라 기운이 떨어지면 못 만듦');
  f.thirstH = 0; s.tiles[f.y * E.W + f.x].t = E.FLOWERS.rose.t + 10; check(E.vigorOf(s, f) < 100 && !!E.presReason(s, f), '땅이 안 맞아 기운이 낮으면 못 만듦');
  s.tiles[f.y * E.W + f.x].t = E.FLOWERS.rose.t;
  f.stage = 'mature'; check(E.presReason(s, f) === '다 핀 꽃으로 만들 수 있어요', '안 핀 꽃은 못 만듦');
  f.stage = 'bloom'; f.withered = true; check(!!E.presReason(s, f), '시든 꽃은 못 만듦');
  f.withered = false;
  check(s.presol === 1 && s.flowers.includes(f) && !s.preserving.length, '못 만들면 용액 · 꽃 그대로');
  check(E.presReason(s, f) === '' && !E.preserve(s, 99999, ctx).ok, '없는 꽃 id는 못 만듦'); }

console.log('[🧪 특수 용액 — ⛏️ 광산 재료 만들기]');
{ const s = fresh(), C = E.CRAFTS.presol;
  check(C && C.item === 'presol' && C.need.quartz === 3 && C.need.mica === 2 && C.need.feldspar === 2 && !E.WORKSHOP.presol, 'CRAFTS 새 줄: 석영 3 · 운모 2 · 장석 2 (공방 돈 사기 없음)');
  s.mine.bag = { quartz: 3, mica: 1, feldspar: 2 };
  check(!E.craft(s, 'presol', ctx).ok && s.presol === 0, '재료가 모자라면 못 만듦');
  s.mine.bag.mica = 2;
  const r = E.craft(s, 'presol', ctx);
  check(r.ok && s.presol === 1 && s.mine.bag.quartz === 0 && s.mine.bag.mica === 0 && s.mine.bag.feldspar === 0, '만들면 용액 1 · 재료가 빠짐'); }

console.log('[용액 소모 · 꽃이 사라짐]');
const s = fresh(); s.presol = 2;
const rose = bloom(s, 'rose', 4, 4);
{ const r = E.preserve(s, rose.id, ctx);
  check(r.ok && s.presol === 1, '용액 1병을 씀');
  check(!E.flowerAt(s, 4, 4) && !s.flowers.includes(rose), '꽃은 정원에서 사라지고 그 자리는 빈 칸');
  check(s.preserving.length === 1 && s.preserving[0].type === 'rose' && !s.preserving[0].mut && s.preserving[0].leftH === E.PRES_H && E.PRES_H === 24, '꽃방 유리 돔에 · 현실 하루(24시간)');
  check(s.drying.length === 0, '꽃잎 말리기 칸과 따로'); }

console.log('[하루 뒤 완성]');
{ E.advance(s, MON + 23 * H, ctx);
  check(s.preserving.length === 1 && !s.preserved.length && Math.abs(E.presLeftH(s, s.preserving[0]) - 1) < 0.01, '23시간 뒤엔 아직 (1시간 남음)');
  E.advance(s, MON + 24 * H + 1000, ctx);
  check(!s.preserving.length && s.preserved.length === 1 && s.preserved[0].type === 'rose', '24시간 뒤 창고로');
  check(s.dex.pres.rose === true && E.presCount(s) === 1 && s.log.some(l => l.text.includes('프리저브드 장미가 완성됐어요')), '도감 칸 · 일지 한 줄'); }
{ const z = fresh(MON, 'p53-z'); z.presol = 1; const f = bloom(z, 'chamomile', 2, 2); E.preserve(z, f.id, ctx); z.bonus.dry = E.bonusMax('dry');
  E.advance(z, MON + 12 * H, ctx); check(z.preserving.length === 1, '🌾 말리는 속도는 닿지 않음 (늘 하루)'); }
{ const q = fresh(SUN, 'p53-sun'); q.presol = 1;
  check(E.calendar(SUN).frozen, '꽃잠(일요일)에 시작');
  const f = bloom(q, 'lavender', 2, 2); E.preserve(q, f.id, ctx); E.advance(q, SUN + 24 * H + 1000, ctx);
  check(q.preserved.length === 1, '꽃잠에도 하루 뒤 완성'); }

console.log('[팔면 값]');
{ check(E.presValue(s, 'rose') === 50000 && E.presValue(s, 'chamomile') === 5000 && E.presValue(s, 'napmae') === 120000, '꽃 값(화원 한 포기 값) × 10 — 장미 50,000 · 캐모마일 5,000 · 납매 120,000원');
  check(E.presValue(s, 'rose', true) === 100000, '🧬 변이 꽃은 × 2');
  const m0 = s.money, inc0 = s.yearNow.income || 0;
  check(!E.sellPreserved(s, [123456], ctx).ok, '없는 것은 못 팖');
  const r = E.sellPreserved(s, s.preserved.map(p => p.id), ctx);
  check(r.ok && s.money === m0 + 50000 && !s.preserved.length && s.yearNow.income === inc0 + 50000 && s.stats.presSold === 1, '팔면 돈 · 올해 수입 · 창고에서 빠짐'); }

console.log('[도감 칸 · 13칸 칭호]');
{ const t = fresh(MON, 'p53-t'); t.presol = 1;
  for (const k of E.FLOWER_KEYS) if (k !== 'rose') t.dex.pres[k] = true;
  E.advance(t, MON + H, ctx);
  check(E.presCount(t) === 12 && t.titles.t_pres13 == null, '12칸이면 칭호 없음');
  const f = bloom(t, 'rose', 5, 5); E.preserve(t, f.id, ctx); E.advance(t, MON + 26 * H, ctx);
  check(E.presCount(t) === 13 && t.titles.t_pres13 != null, '13칸을 다 모으면 「시간을 멈춘 정원사」');
  check(E.TITLES.t_pres13.extra && !E.TITLE_KEYS.includes('t_pres13') && E.TITLE_KEYS.length === 19, '덤 칭호 (칭호 19개 그대로)');
  { const c0 = E.dexCount(t); t.dex.pres = {}; check(E.dexCount(t) === c0 && E.DEX_TOTAL === 101, '기본 도감 101칸 그대로 · dexCount에 안 셈'); for (const k of E.FLOWER_KEYS) t.dex.pres[k] = true; }
  const d = E.presDexOf(t); check(d.flower.length === 13 && d.flower.every(x => x.got) && d.mut.length === 13 && d.mut.every(x => !x.got && x.name === null), '📖 🌹 쪽: 꽃 13 · 변이 13 (안 본 변이는 이름 없음)'); }

console.log('[🧬 변이 꽃 프리저브드 · 변이 칭호]');
{ const t = fresh(MON, 'p53-m'); t.presol = 1;
  for (const k of E.MUTANT_KEYS) if (k !== 'lotus') t.dex.presMut[k] = true;
  const f = bloom(t, 'lotus', 6, 6, { mut: true });
  check(E.mutShown(f) && E.presFull(t, f) && E.presReason(t, f) === '', '변이 꽃도 100%면 만들 수 있음');
  const r = E.preserve(t, f.id, ctx);
  check(r.ok && r.mut && t.preserving[0].mut && t.dex.mutant.lotus === 1, '변이로 담기 · 변이 도감 1단계도');
  E.advance(t, MON + 25 * H, ctx);
  check(t.preserved[0].mut && t.dex.presMut.lotus && !t.dex.pres.lotus && E.presMutCount(t) === 13 && E.presCount(t) === 0, '변이 칸에만 적힘');
  check(t.titles.t_presmut13 != null && t.titles.t_pres13 == null, '변이 13칸이면 「달빛을 가둔 사람」');
  check(E.presDexOf(t).mut.find(x => x.k === 'lotus').name === E.MUTANTS.lotus.name, '모은 변이는 이름이 보임'); }

console.log('[새 칭호 효과 (P52 TITLE_PERKS)]');
{ check(E.TITLE_PERKS.t_pres13.knob === 'presSpeed' && E.TITLE_PERKS.t_presmut13.knob === 'presValue', '두 칭호 모두 효과가 있음');
  const a = fresh(MON, 'p53-p'); a.presol = 1; a.titles.t_pres13 = 0; a.titleOn = 't_pres13';
  const f = bloom(a, 'rose', 2, 2); E.preserve(a, f.id, ctx); E.advance(a, MON + 22 * H, ctx);
  check(a.preserved.length === 1, '「시간을 멈춘 정원사」를 걸면 하루보다 빨리 (24 ÷ 1.1 ≈ 21.8시간)');
  a.titles.t_presmut13 = 0; a.titleOn = 't_presmut13';
  check(E.presValue(a, 'rose') === 52500, '「달빛을 가둔 사람」을 걸면 값 × 1.05 (장미 52,500원)'); }

console.log('[저장 왕복]');
{ const w = fresh(MON, 'p53-w'); w.presol = 2; const f = bloom(w, 'gamguk', 7, 7); E.preserve(w, f.id, ctx);
  w.preserved.push({ id: w.nextId++, type: 'maehwa', mut: true }); w.dex.pres.rose = true; w.dex.presMut.maehwa = true;
  const r = E.parseSave(JSON.stringify(E.makeSave(w, 12345)));
  const g = r.ok && E.migrateSave(r.data.game || r.data);
  check(g && g.presol === 1 && g.preserving.length === 1 && g.preserving[0].type === 'gamguk' && g.preserved[0].mut && g.dex.pres.rose && g.dex.presMut.maehwa, '파일로 저장해 열어도 용액 · 유리 돔 · 창고 · 도감 그대로');
  E.advance(g, MON + 25 * H, ctx); check(g.preserved.length === 2, '열고 나서도 하루 뒤 완성'); }

console.log('[새 철]');
{ const n = fresh(MON, 'p53-n'); n.presol = 4; n.preserved.push({ id: 1, type: 'rose', mut: false }); n.preserving.push({ id: 2, type: 'rose', mut: false, leftH: 3 }); n.dex.pres.rose = true; n.titles.t_pres13 = 0;
  const keep = {}; for (const k of E.SEASON_KEEP) if (k in n) keep[k] = n[k];
  check(keep.presol === 4 && keep.dex.pres.rose && keep.titles.t_pres13 === 0 && 'preserved' in keep && !('preserving' in keep), '용액 · 도감 · 칭호 · 창고 프리저브드(P85-01)는 이어지고 유리 돔은 비워짐 (팔 물건 — 찻잔 · 티백과 같음)'); }

console.log('[Math.random 안 씀]');
{ const src = require('./engine-src.js').source(process.argv[2]),   // P66 엔진 조각을 이은 글자
   a = src.indexOf('🌹 프리저브드 플라워 (P53'), b = src.indexOf('const decoBuffLine');
  check(a > 0 && b > a && !src.slice(a, b).includes('Math.random'), 'P53 엔진 부분에 Math.random 없음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
