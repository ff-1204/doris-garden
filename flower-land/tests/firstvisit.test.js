// P22 요일마다 첫 방문: 이웃의 화분 · 1장은 첫 꽃으로
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[달마다 화분]');
for (const m of E.MONTHS) {
  const st = E.create(at(c => c.month === m), () => 0.5); st.onboarded = true;
  const r = E.giftPot(st, { live: false }), f = r.flower, F = E.FLOWERS[f.type], cal = E.calendar(st.virtual);
  const soon = F.bloom.includes(m) || F.bloom.includes(E.MONTHS[(E.MONTHS.indexOf(m) + 1) % 14]) || cal.frozen && F.bloom.includes(3);
  check(r.ok && f.x === 15 && f.y === 10 && f.q === 0.8 && st.firstFlower === f.type && soon && F.life !== 'annual', `${E.monthName(m)}: ${F.name} (지금이나 다음 달에 핌, 여러해살이)`);
}

console.log('[한 번만 · 칸 피하기]');
const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.onboarded = true;
st.decos = [{ id: 99, key: 'bench', x: 15, y: 10 }];
const g = E.giftPot(st);
check(g.ok && !(g.flower.x === 15 && g.flower.y === 10), '가운데 칸에 장식이 있으면 옆 칸에');
check(!E.giftPot(st).ok && st.flowers.length === 1, '화분은 한 번만');
check(st.flowers[0].stage === 'bloom' && st.flowers[0].type === 'lavender', '6월엔 라벤더가 피어 있음');

console.log('[1장은 첫 꽃]');
const c1 = E.CHAPTERS.find(c => c.key === 'c1');
check(c1.quests.map(q => E.questName(q, st)).join(',') === '라벤더 피우기,라벤더 꽃잎 거두기,꽃방에 꽃잎 널기,라벤더 티백 만들기,' + E.LANDS[E.classify(E.FLOWERS.lavender.t, E.FLOWERS.lavender.m)].name + ' 만들기,라벤더차 팔기', '퀘스트 이름이 라벤더로');
check(JSON.stringify(E.questWhenOf(c1.quests[0], st)) === '{"bloom":"lavender"}', '언제 힌트도 라벤더');
E.advance(st, st.virtual + 2 * H, { live: false, rng: () => 0.5 });
E.checkJournal(st, { live: false });
check(st.journal.done.c1_bloom != null, `핀 화분으로 "라벤더 피우기"가 바로 됨`);

console.log('[예전 정원]');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); old.onboarded = true; delete old.gift; delete old.firstFlower; old.mig = 12;
const m = E.migrateSave(old);
check(m.gift === -1 && E.firstFlower(m) === 'chamomile' && !E.giftPot(m).ok, '이미 시작한 정원은 화분 없음 · 1장은 캐모마일 그대로');
check(E.questName(c1.quests[0], m) === '캐모마일 피우기', '캐모마일 퀘스트 이름');
const fresh = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete fresh.gift; fresh.mig = 12;
check(E.migrateSave(fresh).gift === null, '첫 안내 전 정원은 화분을 받을 수 있음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
