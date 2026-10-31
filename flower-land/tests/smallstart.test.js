// P38 🐜 작게 시작하는 일꾼 (10-31) → P39 🐝 곤충은 모두 꽃을 돕는다 (10-31): 1에서 시작해 꽃가루로 키우는 꼴은 그대로, 단계 값은 "둘레 1 → 2 → 3칸"으로
// 데려오는 조건(P39-10 표) · 시작값 둘레 1칸 · P37 · P38 때 저장이 지금으로 옮겨질 때 쓴 꽃가루가 모두 돌아오는지 · 시뮬 불변 (P17-14)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (pred, g) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'smallstart-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(g || 1); return st; };
const W = (st, k) => E.farmOf(st).workers.find(w => w.key === k);

console.log('[데려오는 조건 (P39-10 표) — 등급 하나 아래엔 잠김]');
for (const [k, need, price] of [['barrel', 2, 10000], ['autobasket', 2, 12000], ['ladybug', 3, 12000], ['earthworm', 4, 15000], ['dryrack', 5, 15000], ['hive', 6, 15000], ['teahelper', 8, 30000]]) {
  const st = garden(c => c.month === 3 && !c.frozen, need - 1);
  const w0 = W(st, k), r0 = E.buyDeco(st, k, ctx);
  st.grade.xp = E.gradeXpAt(need); const w1 = W(st, k), r1 = E.buyDeco(st, k, ctx);
  check(w0.state === 'locked' && w0.when === `정원 등급 ${need}부터 와요` && !r0.ok && w1.state === 'shop' && r1.ok && st.money === 1e6 - price, `${E.DECOS[k].name}: 등급 ${need - 1}엔 잠김 · ${need}면 ${price.toLocaleString()}원에 데려옴`);
}
check(E.FARM_KEYS.every(k => !/\d/.test(E.DECOS[k].desc)), '곤충 설명엔 숫자가 없음 (기르면 바뀌는 둘레는 카드 줄에서)');

console.log('[시작값 — 새 정원 0단계는 모두 둘레 1칸]');
{ const st = garden(c => c.month === 6 && !c.frozen, 2);
  check(E.FARM_KEYS.every(k => E.insectR(st, k) === 1) && E.hiveMax(st) === 3 && E.HONEY_R === 1 && E.HIVE_MAX === 3, '곤충 7 모두 둘레 1칸 · 🐝 꿀 3병');
  check(E.rackN() === 4 && E.helperKeep(st) === E.shopOf(st).seats + 2, '🧺 선반 4장 · 🫖 손님 자리 + 2잔 (기르기 없음)'); }

console.log('[P37 · P38 때 저장 → 지금 (MIGRATIONS 45 · 46번째를 거쳐)]');
{ const P38N = E.MIGRATIONS.findIndex(x => x[0].includes('P38'));
  // P37 저장 (P38 옮기기 전): 개미 끝 · 누에 1 · 나비 2 · 꿀벌 1 · 무당벌레 1 · 선반 1 · 늦잠 2
  const s = garden(c => c.month === 6 && !c.frozen, 40); s.bonus = Object.assign(E.newBonus(), { basket: 3, rack: 1, brew: 2, hive: 1, weed: 1, pantry: 1, catchup: 2 }); delete s.bonusFree; delete s.mailGot; s.mig = P38N;
  const m = E.migrateSave(s);
  check(E.FARM_KEYS.every(k => m.bonus[E.INSECTS[k]] === 0) && m.bonus.pantry === 1 && m.bonus.catchup === 2, '곤충 칸은 0단계 · 선반 · 늦잠은 그대로');
  check(E.bonusUsed(m) === 1 + 3 && E.bonusLeft(m) === 39 - 4, `쓴 꽃가루는 선반 · 늦잠 4알만 — 곤충에 쓴 꽃가루는 모두 돌아옴 (남은 ${E.bonusLeft(m)}알)`);
  check(Object.keys(m.bonusFree).length === 0, '덜어 준 셈(bonusFree)도 곤충 칸은 지움');
  const r = E.bonusSet(m, 'basket', 2);
  check(r.ok && E.bonusLeft(m) === 30 && E.insectR(m, 'autobasket') === 3, '다시 먹이면 새 비용표 (개미 둘레 3칸 = 5알)'); }

console.log('[시뮬 (P17-14)]');
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드') + v('카운터 판매')]; };
  const base = y4(sim()), auto = y4(sim('--auto', '--bonus', 'all'));
  check(base[0] === 80720 && base[1] === 336900, `기본 4 7: 80,720원 · 찻집 336,900원 그대로 (${base.join(' · ')})`);
  check(auto[1] <= base[1] * 1.05, `--auto 곤충 모두 끝단계 4년째 찻집 ${auto[1]}원 — 기본 +5% 안 (P39-13)`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
