// QA 6회차(플레이 평가, 10-24) 반영: 화분 첫 수확 2장 · 해마다 다시 채우는 정원 점수 · 광산 재료 만들기 · 손으로 비료
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[화분 첫 수확]');
const st = E.create(at(c => c.month === 1 && !c.frozen), () => 0.5); st.onboarded = true;
const f = E.giftPot(st).flower; E.advance(st, st.virtual + 0.2 * H, { live: false, rng: () => 0.5 });
E.care(st, 'harvest', [[f.x, f.y]], { live: false });
check(st.petals.length === 2 && f.giftPicked, '화분 첫 수확은 꽃잎 2장 (하나는 꽃방, 하나는 티백)');

console.log('[정원 점수는 해마다 다시]');
const ys = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);
ys.yearSeen = { bloom: { rose: true, lavender: true }, blend: { springfield: true }, honey: { wild: true } };
const sc = E.yearScore(ys);
check(sc.parts.bloom === 8 && sc.parts.blend === 3 && sc.parts.honey === 2 && sc.parts.dex === undefined, '올해 핀 꽃 ×4 · 블렌드 ×3 · 꿀 ×2 (도감 늘어난 칸은 뺌)');
const rs = E.create(at(c => c.month === 2 && !c.frozen), () => 0.5); rs.yearSeen = { bloom: { maehwa: true }, blend: {}, honey: {} };
E.advance(rs, E.calendar(rs.virtual).slotEnd + 0.2 * H, { live: false });
check(rs.records[0].scoreParts.bloom === 4 && Object.keys(rs.yearSeen.bloom).length === 0, '쉼달 기록에 담고 새해엔 비움');
const dried = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); dried.dried.push({ id: 1, type: 'chamomile', q: 0.7 }, { id: 2, type: 'rose', q: 0.7 });
E.blend(dried, [1, 2]);
check(Object.keys(dried.yearSeen.blend).length === 1, '블렌드를 만들면 올해 블렌드에 셈');

console.log('[광산 재료 쓸 곳]');
const ms = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); const m = E.mineOf(ms);
m.bag = { shell: 1, fern: 1, leaf: 1, bone: 1, stone: 25, amber: 3, oldseed: 2, dirt: 10 };
check(E.craft(ms, 'fossilcase').ok && E.craft(ms, 'amberlamp').ok && E.craft(ms, 'oldpot').ok, '화석 진열장 · 호박 등 · 옛 씨앗 화분');
check(['fossilcase', 'amberlamp', 'oldpot'].every(k => ms.dex.deco[k] && ms.decos.some(d => d.key === k)) && E.decoOffer({ month: 3 }).every(k => !E.DECOS[k].craft), '만든 장식은 창고 · 꾸밈 도감, 화원엔 안 나옴');

console.log('[손으로 비료]');
const cp = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);
cp.items.push({ id: 50, type: 'rose', q: 0, origin: '번식', ageH: 5, got: 0 });
check(!E.compostable(cp.items[0]) && E.compostable(cp.items[0], true), '품질 0% 묘목은 10달 전이라도 손으로 비료');
const f0 = cp.fert; check(E.compostItems(cp, [50]).ok && cp.fert === f0 + 1, '창고에서 바로 비료로');

console.log('[QA 7회차]');
{ const s = E.create(at(c => c.month === 13), () => 0.5); s.onboarded = true; const r = E.giftPot(s); E.advance(s, s.virtual + 0.05 * H);
  check(r.msg.includes('티백 2개') && s.teas.length === 2 && s.teas.every(x => x.type === s.firstFlower), '꽃잠에 처음 오면 화분 꽃 티백 2개도');
  const l = s.orders.list; E.brew(s, s.teas.map(x => x.id), []); E.sellCups(s, s.cups.map(c => c.id));
  check(l.every(o => o.done), `꽃잠 첫 쪽지를 모두 들어줄 수 있음 (${l.map(E.orderText).join(' · ')})`); }
{ const s = E.create(at(c => c.month === 1 && !c.frozen), () => 0.5); s.onboarded = true; const f = E.giftPot(s).flower; E.advance(s, s.virtual + 0.1 * H, { live: false, rng: () => 0.5 });
  check(E.care(s, 'harvest', [[f.x, f.y]], { live: false }).msg.includes('꽃잎 2장'), '화분 첫 수확 알림은 "꽃잎 2장"'); }
{ const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 12), () => 0.5))); delete old.yearSeen; old.mig = 16;
  old.log = [{ y: 1, m: 5, d: 1, type: 8, text: '장미 3포기가 피었어요. 수확할 수 있어요' }, { y: 1, m: 6, d: 2, type: 8, text: '라벤더가 피었어요. 수확할 수 있어요' }, { y: 1, m: 6, d: 2, type: 9, text: '도감에 등록: 라벤더' }];
  const m = E.migrateSave(old); check(m.yearSeen.bloom.rose && m.yearSeen.bloom.lavender && Object.keys(m.yearSeen.bloom).length === 2, '업데이트한 해: 올해 일지의 "피었어요"로 핀 꽃을 채움'); }
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
