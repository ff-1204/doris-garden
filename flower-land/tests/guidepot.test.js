// 첫걸음 "🌸 이웃의 화분 눌러 보기" (P22-02 변경 10-27): 화분을 받은 정원은 화분부터, 직접 누를 때만 ✓, 예전 저장은 ✓
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fresh = pred => { const st = E.create(at(pred), () => 0.5); st.onboarded = true; E.giftPot(st, { live: false }); return st; };
const copy = o => JSON.parse(JSON.stringify(o));

console.log('[단계 순서]');
const st = fresh(c => c.month === 6 && !c.frozen);
check(E.guideKeys(st).join(',') === 'pot,bought,planted,watered,harvested,sold', '평일 시작: 화분 → 사기 → 심기 → 물 → 수확 → 팔기 (6단계)');
const sl = fresh(c => c.frozen);
check(sl.startedInSleep && E.guideKeys(sl).join(',') === 'pot,reserved,planted,watered,harvested,sold', '꽃잠 시작: 화분 → 예약 → 심기 → 물 → 수확 → 팔기');
const noPot = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); noPot.gift = -1;
check(E.guideKeys(noPot).join(',') === 'bought,planted,watered,harvested,sold', '화분이 없는 예전 정원: 예전 5단계 그대로');
const sg = copy(noPot); sg.starterGift = true;
check(E.guideKeys(sg).join(',') === 'blended,sold,bought,planted,watered,harvested', '시작 선물 정원(화분 없음): 예전 6단계 그대로');

console.log('[첫 안내 창 뒤 (화분 받기 전)]');
const pre = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5);
E.guideFill(pre); E.giftPot(pre, { live: false });
check(!E.guideFill(pre).pot && E.guideKeys(pre)[0] === 'pot', '받기 전에 첫걸음을 그려도 화분 단계가 미리 ✓되지 않음');

console.log('[처음엔 아무것도 ✓ 아님]');
const g = E.guideFill(st);
check(!E.guideKeys(st).some(k => g[k]), '평일 시작 0/6 — 화분은 산 것 · 심은 것이 아님');
const gs = E.guideFill(sl);
check(!E.guideKeys(sl).some(k => gs[k]), '꽃잠 시작 0/6 — 화분과 받은 티백 2개는 수확으로 치지 않음');
check(sl.teas.length === 2 && sl.teas.every(t => t.gift), '꽃잠 화분 티백엔 gift 표시');

console.log('[직접 누를 때만]');
const other = { origin: '화원' };
check(!E.guideTap(st, null) && !E.guideTap(st, other) && !st.guide.pot, '빈 칸 · 다른 꽃은 ✓ 아님');
check(E.guideTap(st, st.flowers[0]) && st.guide.pot, '화분을 누르면 ✓');
check(!E.guideTap(st, st.flowers[0]), '두 번째엔 새로 ✓가 아님');
check(E.guideKeys(st).filter(k => st.guide[k]).length === 1 && E.guideKeys(st).find(k => !st.guide[k]) === 'bought', '1/6 · 다음은 사기');

console.log('[화분이 없어지면]');
const w = fresh(c => c.month === 6 && !c.frozen); w.flowers[0].withered = true;
check(E.guideFill(w).pot === true, '화분이 시들면 누를 수 없으니 ✓');

console.log('[예전 저장]');
const mig = (s, n) => { const o = copy(s); o.mig = n; return E.migrateSave(o); };
const N = E.MIGRATIONS.length - 1;
const a = copy(fresh(c => c.month === 6 && !c.frozen)); a.guide = { bought: true };
check(mig(a, N).guide.pot === true, '다른 단계를 이미 한 정원은 ✓');
const b = copy(fresh(c => c.month === 6 && !c.frozen)); b.guide = { bought: true, planted: true, watered: true, harvested: true, sold: true, celebrated: true };
const mb = mig(b, N);
check(mb.guide.pot === true && E.guideKeys(mb).every(k => mb.guide[k]), '첫걸음을 다 마친 정원엔 다시 뜨지 않음');
const c = copy(fresh(c => c.month === 6 && !c.frozen)); c.guide = { hidden: true };
check(mig(c, N).guide.pot === true, '첫걸음을 닫은 정원도 ✓');
const d = copy(fresh(c => c.month === 6 && !c.frozen)); d.guide = {};
check(!mig(d, N).guide.pot, '막 시작해 아무것도 안 한 정원은 화분 단계부터');
const e = copy(fresh(c => c.month === 6 && !c.frozen)); delete e.guide;
check(mig(e, N).guide === undefined, '첫걸음 기록이 없는 정원은 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
