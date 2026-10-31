// QA 4회차(10-24)에서 찾은 것들이 다시 생기지 않게: 화분과 퀘스트 겹침 · 화분 기운 · 광산 · 빗물 통 일지
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const c6 = E.CHAPTERS.find(c => c.key === 'c6').quests, c3 = E.CHAPTERS.find(c => c.key === 'c3').quests;

console.log('[화분과 뒤 장 퀘스트]');
const st = E.create(at(c => c.month === 2 && !c.frozen), () => 0.5); st.onboarded = true;
E.giftPot(st);
check(st.firstFlower === 'maehwa' && E.questName(c6[1], st) === '직접 심은 매화 피우기' && E.questName(c6[0], st) === '동백 피우기', '화분이 매화면 6장은 "직접 심은 매화"');
E.advance(st, st.virtual + 2 * H, { live: false, rng: () => 0.5 });
check(st.dex.flower.maehwa && !c6[1].test(st), '화분 매화가 펴도 6장 매화는 아직');
check(E.GIFT_BY_MONTH[7] !== 'lotus' && Object.values(E.GIFT_BY_MONTH).every(k => !c3.some(q => E.questName(q, st).startsWith(E.FLOWERS[k].name))), '어느 달 화분도 3장(연꽃)과 겹치지 않음');
const names = E.QUESTS.map(q => E.questName(q, st));
check(new Set(names).size === names.length, '퀘스트 이름이 서로 겹치지 않음');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); old.onboarded = true; old.gift = -1; old.dex.flower.maehwa = true; delete old.ownBloom; old.mig = 15;
check(c6[1].test(E.migrateSave(old)) && E.questName(c6[1], old) === '매화 피우기', '예전 정원은 그대로 "매화 피우기" · 핀 적 있으면 인정');

console.log('[화분 기운 · 안내 창 꽃]');
const g = E.create(at(c => c.month === 1 && !c.frozen), () => 0.5); g.onboarded = true;
const f = E.giftPot(g, null, 'dongbaek').flower;
check(f.type === 'dongbaek' && E.vigorOf(g, f) > 80, `안내 창에서 보여 준 꽃 그대로 · 화분 흙이라 기운 ${Math.round(E.vigorOf(g, f))}%`);

console.log('[광산]');
const ms = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); ms.gardenId = 'qa4'; const m = E.mineOf(ms);
check(E.canCraft(ms, 'constructor') === false && E.canCraft(ms, 'toString') === false, 'canCraft 없는 이름은 false');
m.deepest = 7; m.depth = 1; m.energy = 2;
check(!E.toDeepest(ms).ok && m.depth === 1, '기력 3이 없으면 가장 깊은 층으로 못 감');
m.energy = 5;
check(E.toDeepest(ms).ok && m.depth === 7 && m.energy === 2 && !E.toDeepest(ms).ok, '기력 3으로 지하 7층에 바로 · 이미 가장 깊으면 거절');
m.depth = m.deepest = 20; m.board = null; E.mineOf(ms); m.energy = 12;
const si = m.board.cells.findIndex(c => c.stairs), dr = E.dig(ms, si);
check(dr.msg.includes('가장 깊은 곳') && !dr.stairs, '20층 계단은 "가장 깊은 곳이에요"');

console.log('[빗물 통 일지]');
const b = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); b.money = 1e5; b.grade.xp = E.gradeXpAt(2);
const bd = E.buyDeco(b, 'barrel').deco; E.placeDeco(b, bd.id, 4, 4);
b.flowers.push({ id: 900, type: 'lavender', x: 4, y: 5, q: 0.7, startQ: 0.7, stage: 'young', withered: false, ageH: 200, waterH: 0, weedH: 99, pruneH: 0, fertH: 0, thirstH: 3, adaptH: 0, harvestKey: -1, bloomKey: -1 });
E.advance(b, E.calendar(b.virtual).slotEnd + 0.2 * H, { live: false, rng: () => 0.5 });
check(b.log.some(l => l.type === 20 && l.text === '달팽이가 꽃 1포기에 물을 줬어요'), 'P39 일지에 🐝 "달팽이가 꽃 1포기에 물을 줬어요"');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
