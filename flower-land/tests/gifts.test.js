// P26 💐 이웃에게 선물 · ✉️ 답장 편지: 해마다 한 번씩 · 다음 달 답장 · 편지 도감 · 정원 점수 · 예전 저장
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[보내기]');
const st = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); st.gardenId = 'gift-test'; st.money = 100000;
check(E.GIFT_KEYS.length === 3 && E.LETTER_KEYS.length === 12, '선물 3가지 · 편지 12통');
check(!E.sendGift(st, 'toString').ok && !E.sendGift(st, 'nope').ok, '없는 선물은 거절');
const r = E.sendGift(st, 'bouquet');
check(r.ok && st.money === 92000 && st.gifts.sent.bouquet && st.letterPending.length === 1, '꽃다발 8,000원 · 답장 기다림');
check(!E.sendGift(st, 'bouquet').ok && st.money === 92000, '같은 선물은 올해 한 번만');
st.money = 1000; check(!E.sendGift(st, 'party').ok && st.money === 1000, '돈이 모자라면 못 보냄'); st.money = 100000;
const items = JSON.stringify([st.items, st.teas, st.flowers]);
E.sendGift(st, 'teabox');
check(JSON.stringify([st.items, st.teas, st.flowers]) === items, '선물은 돈만 씀 (꽃 · 차 · 재료는 그대로)');

console.log('[다음 달 답장]');
check(E.letterCount(st) === 0, '보낸 달엔 아직 없음');
E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, { live: false });
check(E.letterCount(st) === 2 && st.letterPending.length === 0 && st.log.filter(l => l.type === 17 && l.text.includes('답장이 왔어요')).length === 2, '다음 달에 편지 2통 · 일지');
const st2 = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); st2.gardenId = 'gift-test'; st2.money = 100000;
E.sendGift(st2, 'bouquet'); E.sendGift(st2, 'teabox'); E.advance(st2, E.calendar(st2.virtual).slotEnd + 0.1 * H, { live: false });
check(JSON.stringify(st2.dex.letter) === JSON.stringify(st.dex.letter), '같은 정원 이름표면 같은 편지 (Math.random 안 씀)');

console.log('[새해엔 다시 · 정원 점수]');
check(E.yearScore(st).parts.gifts === 20, '올해 보낸 선물마다 +10');
E.advance(st, at(c => c.month === 3) + 7 * 24 * H, { live: false });
check(E.calendar(st.virtual).month === 3 && E.sendGift(st, 'bouquet').ok, '새해(3월)엔 다시 보낼 수 있음');

console.log('[편지를 다 모으면]');
st.dex.letter = Object.fromEntries(E.LETTER_KEYS.map(k => [k, true])); E.sendGift(st, 'teabox');
E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, { live: false });
check(E.letterCount(st) === 12 && st.log.some(l => l.type === 17 && l.text.includes('고맙다는 답장')), '다 모은 뒤엔 고맙다는 답장 한 줄');

console.log('[QA 9회차]');
{ const s = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); s.money = 1e5; E.sendGift(s, 'bouquet'); E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false });
  const k = Object.keys(s.dex.letter)[0]; check(E.LETTERS[k].gift === 'bouquet', '꽃다발엔 꽃다발 답장부터 (' + E.LETTERS[k].from + ')'); }
{ const s = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); s.money = 1e5; E.sendGift(s, 'party'); E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false });
  check(E.LETTERS[Object.keys(s.dex.letter)[0]].gift === 'party', '잔치엔 잔치 답장부터'); }
{ const s = E.create(at(c => c.month === 13), () => 0.5); s.money = 1e5; s.records = [{ year: 1, dex: 0, orders: 0, giftsTotal: 0 }]; E.sendGift(s, 'party');
  check(E.yearScore(s).parts.gifts === 10, '꽃잠(쉼달)에 보낸 선물도 다음 기록 점수에'); }
{ const s = E.create(at(c => c.month === 4), () => 0.5); s.dex.letter = Object.fromEntries(E.LETTER_KEYS.map(k => [k, true])); s.letterPending = [{ gift: 'nope', due: 0 }];
  let okk = true; try { E.advance(s, s.virtual + 13 * H); } catch (e) { okk = false; } check(okk, '모르는 선물이 기다리는 깨진 저장도 시간이 흐름'); }
{ const s = E.create(at(c => c.month === 4), () => 0.5); s.money = NaN; check(!E.sendGift(s, 'teabox').ok, '돈이 NaN이면 못 보냄'); }
console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete old.gifts; delete old.letterPending; delete old.dex.letter; old.mig = 17;
const m = E.migrateSave(old);
check(m.gifts === null && Array.isArray(m.letterPending) && m.dex.letter && m.mig === E.MIGRATIONS.length, '선물 · 편지 칸이 생김');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
