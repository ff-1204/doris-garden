// P41 💰 꽃가루를 없애고 돈 + 등급으로 (10-31 사용자 확정): 기르기는 💰 값 + 🌱 등급으로 사서 올림 · 낮춰 쓰기 · 🌱 씨앗 처음 품질 = 등급 (R-05) ·
// 등급 오름 알림 · 🌙 돌아왔을 때 한 창 (R-04) · 예전 저장 옮기기 (P41-05) · 여정 두 개 — 사기 규칙 기본은 grade.test.js
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (g, pred) => { const st = E.create(at(pred || (c => c.month === 3 && !c.frozen)), () => 0.5); st.gardenId = 'p41-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 1); return st; };
const toGrade = (st, g, ev) => E.addXp(st, 'quest', Math.ceil((E.gradeXpAt(g) - st.grade.xp) / E.XP.quest), { onGrade: e => ev && ev.push(e) });

console.log('[🌱 씨앗 처음 품질 (R-05-01)]');
check([1, 2, 10, 25, 26, 40].map(E.seedQAt).join() === '0.5,0.52,0.68,0.98,1,1', '50% + 등급마다 2% (1등급 50% · 10등급 68% · 26등급부터 100%)');
{ const st = garden(1);
  check(E.buy(st, 'chamomile', 2).ok && st.items.every(i => i.q === 0.5 && i.origin === '화원'), '💐 화원 씨앗: 1등급 50%');
  st.grade.xp = E.gradeXpAt(10); E.buy(st, 'rose', 1);
  check(st.items.find(i => i.type === 'rose').q === 0.68 && st.items.filter(i => i.type === 'chamomile').every(i => i.q === 0.5), '10등급에 산 것은 68% · 이미 창고에 있던 것은 그대로 (R-05-02)');
  st.grade.xp = E.gradeXpAt(30); E.buy(st, 'lavender', 1);
  check(st.items.find(i => i.type === 'lavender').q === 1, '26등급 넘으면 100%'); }
{ const st = garden(6, c => c.frozen);
  const r = E.reserve(st, [{ type: 'chamomile', window: 3, qty: 2 }]);
  st.grade.xp = E.gradeXpAt(11);   // 도착할 때의 등급으로
  E.advance(st, at(c => c.month === 3 && !c.frozen && c.abs > E.calendar(st.virtual).abs) + 7 * H, ctx);
  const got = st.items.filter(i => i.origin === '예약');
  check(r.ok && got.length === 2 && got.every(i => Math.abs(i.q - 0.7) < 0.051), `🗓️ 예약 도착: 도착할 때 등급(11 → 70%)으로 — 창고에서 줄어든 것까지 (${got.map(i => E.pct(i.q)).join(' · ')}%)`); }
{ const st = garden(1, c => c.month === 6 && !c.frozen); st.flowers.push({ id: 7001, type: 'chamomile', x: 3, y: 3, q: 0.9, startQ: 0.9, stage: 'bloom', ripeH: 6, bloomed: true, withered: false, ageH: 9999, lifeH: 9999, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 });
  const q = E.propQuality(0.9, () => 0.5);
  check(q > 0.5 && q <= 0.9, `번식 · 채종은 부모 품질에서 (R-05-04 — 1등급이어도 부모 90%면 ${E.pct(q)}%)`); }
{ const st = garden(1); const it = { type: 'chamomile', q: 0.5 }; const cal = E.calendar(st.virtual);
  st.decos.push({ id: 9001, key: E.MONTH_DECO_KEYS.find(k => E.DECOS[k].month === cal.month), x: 0, y: 0 });
  const before = E.monthDecoLift(st, it, cal); st.titles.t_miracle = 1; const after = E.monthDecoLift(st, it, cal);
  check(!before && !!after, '🪴 그 달의 장식은 「한 포기의 기적」 조건 그대로 (80% 이하는 칭호 뒤부터 90%로 — R-05-03)'); }
{ const st = garden(1); const g = E.create(Date.now(), () => 0.5); g.dex.form = {};
  const n0 = st.items.length; E.buy(st, 'chamomile', 1);
  check(st.items.length === n0 + 1 && st.items[st.items.length - 1].q === E.seedQ(st), 'seedQ(st) = 지금 등급의 처음 품질'); }

console.log('[🌱 등급 오름 알림 (R-05-01 · P41-04)]');
{ const st = garden(1), ev = []; toGrade(st, 2, ev);
  const al = E.gradeAlerts(st, ev[0]);
  check(al.includes('🌱 이제 씨앗이 52%로 와요') && E.seedUpText(0.7) === '🌱 이제 씨앗이 70%로 와요', `등급이 오르면 "🌱 이제 씨앗이 52%로 와요" (${al.join(' / ')})`); }
{ const st = garden(2), ev = []; toGrade(st, 3, ev);
  const al = E.gradeAlerts(st, ev[0]);
  check(al.includes('💰 이제 살 수 있어요 · 🌱 자라는 속도 ×1.5 · 🌾 말리는 속도 ×1.5'), `등급 3: 두 속도 ×1.5가 열림 (P42) (${al.join(' / ')})`); }
{ const st = garden(3), ev = []; E.buyDeco(st, 'barrel', ctx); toGrade(st, 4, ev);
  check(E.bonusOpenedAt(st, 3, 4).join() === '🐌 달팽이 둘레 4칸' && E.gradeAlerts(st, ev[0]).some(t => t === '💰 이제 살 수 있어요 · 🐌 달팽이 둘레 4칸'), '곤충 둘레는 데려온 곤충만 알림 (🐌 등급 2 + 2 = 4)');
  const no = garden(3); check(E.bonusOpenedAt(no, 3, 4).length === 0, '데려오지 않았으면 알림 없음'); }
{ const st = garden(30), ev = []; toGrade(st, 31, ev);
  check(!E.gradeAlerts(st, ev[0]).some(t => t.startsWith('🌱 이제 씨앗이')), '26등급 넘어 100%면 씨앗 줄 없음'); }
{ const st = garden(1); st.settings.slow = true; const ev = []; toGrade(st, 2, ev);
  check(E.gradeAlerts(st, ev[0]).length === 0, '🐢 느긋하게 보기면 알림 없음 (숫자 줄)'); }

console.log('[💰 기르기 — 모은 돈으로 (P41-01 · 02 · 03)]');
{ const st = garden(3); st.money = 24999;
  const v = E.bonusView(st).rows.find(r => r.key === 'grow');
  check(v.gradeOk && v.moneyOk && v.canBuy && v.price === 10000, '등급 3 · 10,000원이 있으면 살 수 있음');
  E.bonusSet(st, 'grow', 1);
  const v2 = E.bonusView(st).rows.find(r => r.key === 'grow');
  check(v2.level === 1 && v2.own === 1 && v2.buyLv === 2 && v2.price === 15000 && v2.need === 5 && !v2.gradeOk && v2.moneyOk === false, '다음은 ×2 · 15,000원 · 등급 5 (등급 · 돈 모자람)');
  st.money = 0; E.bonusSet(st, 'grow', 0);
  check(st.money === 0 && E.bonusSet(st, 'grow', 1).ok && st.money === 0, '돈이 0이어도 산 단계 안에서는 낮추고 올림'); }
{ const st = garden(7); E.buyDeco(st, 'barrel', ctx); const m0 = st.money;
  check(E.bonusSet(st, 'barrel', 1).ok && E.bonusSet(st, 'barrel', 2).ok && st.money === m0 - 35000 && E.insectR(st, 'barrel') === 6, '🐌 달팽이: 등급 7에 둘레 4칸(10,000) → 6칸(25,000)');
  const sum = E.BONUS_KEYS.reduce((a, k) => a + E.BONUS[k].price.reduce((x, y) => x + y, 0), 0);
  check(sum === 7 * 35000 + 2 * 220000, `모두 사면 ${sum.toLocaleString()}원 (곤충 7 × 35,000 + 두 속도 × 220,000 — P42)`); }

console.log('[🌙 돌아왔을 때 한 창 (R-04)]');
{ const st = garden(6, c => c.month === 6 && !c.frozen);
  check(JSON.stringify(E.awayHome(st)) === JSON.stringify({ pantry: null, dried: null, drying: null }), '비어 있으면 아무 줄도 없음');
  st.dried.push({ id: 1, type: 'rose', q: 0.7 }, { id: 2, type: 'rose', q: 0.7 });
  st.pantry = { items: [{ k: 'water' }], h: 0 };
  const a = E.awayHome(st);
  check(a.dried === '🍂 꽃방에 다 마른 꽃잎 2장이 기다려요' && a.drying === null, `다 마른 꽃잎 줄 ("${a.dried}")`);
  check(!a.pantry || a.pantry.has, '🧺 입구 선반은 pantryView 그대로 (열린 정원만)');
  st.dried = []; st.drying.push({ id: 3, type: 'rose', q: 0.7, leftH: 5 });
  check(E.awayHome(st).drying === '🌾 꽃방에서 꽃잎 1장이 마르고 있어요', '다 마른 게 없으면 마르는 중 한 줄');
  st.settings.slow = true;
  check(E.awayHome(st).drying === '🌾 꽃방에서 꽃잎이 마르고 있어요', '🐢 느긋하게 보기면 숫자 없이'); }

console.log('[여정 — 새 정원]');
{ const st = garden(1); st.money = 0;
  E.buy(st, 'chamomile', 0); st.money = 5000; E.buy(st, 'chamomile', 1);
  check(st.items[st.items.length - 1].q === 0.5, '1등급 씨앗 50%');
  const ev = []; toGrade(st, 2, ev);
  check(E.gradeAlerts(st, ev[0]).includes('🌱 이제 씨앗이 52%로 와요'), '등급 2 알림 · 52%');
  toGrade(st, 3, ev); st.money = 10000;
  check(E.bonusSet(st, 'grow', 1).ok && E.bonusVal(st, 'grow') === 1.5 && st.money === 0, '등급 3에 1만 원을 모아 🌱 ×1.5 (P42)');
  toGrade(st, 4, ev); st.money = 10000; E.buyDeco(st, 'barrel', ctx); st.money = 10000;
  check(E.bonusSet(st, 'barrel', 1).ok && E.insectR(st, 'barrel') === 4, '🐌 달팽이를 데려와 1만 원으로 둘레 4칸'); }

console.log('[여정 — 예전 저장 (P40 ×10 · 곤충 3칸 · 꽃가루 40알)]');
{ const P41N = E.MIGRATIONS.findIndex(x => x[0].includes('P41-05'));
  const old = copy(garden(41)); old.mig = P41N; delete old.bonusOwn; delete old.mailGot; old.money = 1000; old.pollenExtra = 0;
  old.bonus = { barrel: 2, basket: 2, weed: 2, worm: 2, rack: 2, hive: 2, brew: 2, grow: 9, dry: 9, pollen: 0 };
  const m = E.migrateSave(old);
  check(E.BONUS_KEYS.every(k => m.bonus[k] === 0) && m.money === 201000, `열면 모두 0단계 · 💰 200,000원 (${m.money.toLocaleString()}원)`);
  const L = m.letterBox.find(b => b.mail && b.mail.id === E.P41_LETTER);
  check(L && L.mail.title === '꽃가루가 돈이 되었어요' && L.mail.text.includes('40알') && L.mail.text.includes('100%'), '📮 편지: 꽃가루 40알 · 씨앗 품질(41등급 100%)');
  check(E.bonusSet(m, 'grow', 1).ok && m.money === 191000, '등급이 닿은 단계는 돈으로 다시 삼');
  const pe = copy(garden(11)); pe.mig = P41N; delete pe.mailGot; pe.pollenExtra = 6; pe.bonusFree = { basket: 3 }; const p0 = pe.money; E.migrateSave(pe);
  check(pe.money === p0 + (10 + 6) * 5000, '🌼 늘리기로 더 받은 꽃가루(pollenExtra)도 셈 · 덜어 준 bonusFree는 셈에 없음');
  const z = copy(garden(1)); z.mig = P41N; delete z.mailGot; const z0 = z.money; E.migrateSave(z);
  const ZL = z.letterBox.find(b => b.mail && b.mail.id === E.P41_LETTER);
  check(z.money === z0 && ZL && !ZL.mail.text.includes('알은'), '받은 꽃가루가 없으면 돈 줄 없이 안내만'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
