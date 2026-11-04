// P76 🐝 곤충은 모두 달마다 (11-04 사용자 확정 "모든 곤충을 통일성 있게 매달로"): 🪱 지렁이 석 달 → 달마다 · 🦋 나비 두 해에 한 번 그해 첫 → 달마다 그달 첫 꽃잎 +1
//   (🌙 자리를 비운 동안 창에서 🧺 거두기 둘을 뺀 P76-02는 화면 코드라 브라우저로 봄)
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = () => { const st = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); st.gardenId = 'p76-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(10); st.fert = 10; return st; };   // P77-B 🪱 비료
const put = (st, key, x, y) => { const d = E.buyDeco(st, key, ctx).deco; E.placeDeco(st, d.id, x, y); return d; };
const bloom = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.8, startQ: 0.8, origin: '화원', stage: 'bloom', bloomed: true, withered: false, ageH: 99 * M, lifeH: 99 * M, waterH: 1e4, weedH: 1e4, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: 3, ripeH: 0 }; st.flowers.push(f); return f; };

console.log('[P76-01 일곱 모두 "달마다"]');
{ const st = garden();
  check(E.INSECT_KEYS.every(k => / 달마다 /.test(E.insectLine(st, k))) && !E.INSECT_KEYS.some(k => /석 달|두 해/.test(E.insectLine(st, k))), '효과 한 줄에 석 달 · 두 해가 없음');
  check(E.DECOS.earthworm.desc === E.insectLine(st, 'earthworm') && E.DECOS.teahelper.desc === E.insectLine(st, 'teahelper'), '장식 카드 한 줄도 같음');
  check(E.INSECT_CARE.earthworm.every === 1, '🪱 every 1 (석 달 → 달마다)'); }

console.log('[P76-01 🪱 지렁이 — 끝난 달 번호와 상관없이 달마다]');
{ const st = garden(); put(st, 'earthworm', 5, 5); const f = bloom(st, 'chamomile', 6, 6);
  const done = [0, 1, 2, 3, 4, 5, 6].map(abs => { f.fertH = 0; return E.insectCareTick(st, 'earthworm', { abs }); });
  check(done.every(n => n === 1) && f.fertH === M, '일곱 달 모두 비료 효과(1달)'); }

console.log('[P76-01 🦋 나비 — 그달 첫 수확만 +1 · 다음 달 다시]');
{ const st = garden(); put(st, 'teahelper', 5, 5); const f = bloom(st, 'chamomile', 6, 6), cal = E.calendar(st.virtual), m = E.harvestSlot(cal);
  check(E.harvestYear(st, f, cal) === 1 && f.bfm === m && f.hy === undefined && f.bfy === undefined, '첫 수확 +1 · 덤 받은 달 bfm만 적음 (hy · bfy는 더 안 씀)');
  check(E.harvestYear(st, f, cal) === 0, '같은 달 두 번째는 0');
  check(E.harvestYear(st, f, Object.assign({}, cal, { abs: cal.abs + 1 })) === 1 && f.bfm === m + 1, '다음 달 첫 수확은 다시 +1');
  const far = bloom(st, 'chamomile', 12, 12);
  check(E.harvestYear(st, far, cal) === 0 && far.bfm === undefined, '둘레 밖 꽃은 0 · 아무것도 안 적음');
  const old = bloom(st, 'chamomile', 6, 7); old.hy = 3; old.bfy = 3;
  check(E.harvestYear(st, old, cal) === 1 && old.hy === 3, '옛 저장의 hy · bfy가 있어도 그달 첫 수확이면 +1 (옛 칸은 그대로)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
