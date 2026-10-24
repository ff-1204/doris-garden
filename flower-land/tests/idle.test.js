// P25 켜 두지 않는 방치: 빗물 통 (돌아왔을 때 요약은 화면 기능이라 브라우저로 확인)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = 12 * H;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, x, y) => { const f = { id: 7000 + st.flowers.length, type: 'lavender', x, y, q: 0.7, startQ: 0.7, stage: 'young', withered: false, ageH: 200, waterH: 0, weedH: 99, pruneH: 0, fertH: 0, thirstH: 5, adaptH: 0, harvestKey: -1, bloomKey: -1 }; st.flowers.push(f); return f; };

console.log('[빗물 통 사기]');
const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.money = 100000;
check(E.decoOffer(E.calendar(st.virtual)).includes('barrel'), '6월 화원에 빗물 통');
const r = E.buyDeco(st, 'barrel'), r2 = E.buyDeco(st, 'barrel');
check(r.ok && r2.ok && st.money === 50000, '25,000원 · 여러 개 살 수 있음');

console.log('[바로 옆 꽃에 물]');
E.placeDeco(st, r.deco.id, 5, 5);
const near = [fl(st, 4, 4), fl(st, 6, 5), fl(st, 5, 6)], far = fl(st, 7, 5);
check(E.barrelTick(st) === 3 && near.every(f => f.waterH === 2 * 12 && f.thirstH === 0) && far.waterH === 0, '1칸 안 꽃만 물 (2칸 떨어진 꽃은 아님)');
near[0].waterH = 20;
check(E.barrelTick(st) === 0, '아직 촉촉하면(1달 넘게 남음) 건너뜀');

console.log('[달이 끝날 때 · 꽃잠엔 쉼]');
const ad = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); ad.money = 1e5;
const b = E.buyDeco(ad, 'barrel').deco; E.placeDeco(ad, b.id, 3, 3); const f = fl(ad, 3, 4);
E.advance(ad, E.calendar(ad.virtual).slotEnd + 0.2 * H, { live: false, rng: () => 0.5 });
check(f.waterH > 12 && f.thirstH === 0, '6월이 끝나면 물이 채워짐');
const sl = E.create(at(c => c.month === 13), () => 0.5);
sl.decos = [{ id: 1, key: 'barrel', x: 2, y: 2 }]; const g = fl(sl, 2, 3);
E.advance(sl, E.calendar(sl.virtual).slotEnd + 0.2 * H);
check(g.waterH === 0, '꽃잠 달이 끝날 땐 물 안 줌');
const stored = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); stored.decos = [{ id: 1, key: 'barrel', x: null, y: null }]; fl(stored, 0, 0);
check(E.barrelTick(stored) === 0, '창고의 빗물 통은 쉼');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
