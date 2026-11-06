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
check(E.FARM_KEYS.every(k => E.DECOS[k].desc.startsWith('둘레 2칸 ')), 'P65-04 장식 카드 곤충 설명은 기르기 전 둘레 2칸 (기르면 카드 · 정원 창은 insectLine으로 그 칸 수)');

console.log('[시작값 — 새 정원 0단계는 모두 둘레 2칸 (P61-01, 예전 1칸)]');
{ const st = garden(c => c.month === 6 && !c.frozen, 2);
  check(E.FARM_KEYS.every(k => E.insectR(st, k) === 2) && E.hiveMax(st) === 3 && E.HONEY_R === 2 && E.HIVE_MAX === 3, '곤충 7 모두 둘레 2칸 · 🐝 꿀 3병');
  check(E.rackN() === 4 && E.helperKeep(st) === E.shopOf(st).seats + 2, '🧺 선반 4장 · 🫖 손님 자리 + 2잔 (기르기 없음)'); }

console.log('[P37 · P38 때 저장 → 지금 (MIGRATIONS 45 · 46 · 47 · 48번째를 거쳐)]');
{ const P38N = E.MIGRATIONS.findIndex(x => x[0].includes('P38'));
  // P37 저장 (P38 옮기기 전): 개미 끝 · 누에 1 · 나비 2 · 꿀벌 1 · 무당벌레 1 · 선반 1 · 늦잠 2
  const s = garden(c => c.month === 6 && !c.frozen, 40); s.bonus = Object.assign(E.newBonus(), { basket: 3, rack: 1, brew: 2, hive: 1, weed: 1, pantry: 1, catchup: 2 }); delete s.bonusFree; delete s.mailGot; s.mig = P38N;
  const m0 = s.money, m = E.migrateSave(s);
  check(E.BONUS_KEYS.every(k => m.bonus[k] === 0) && !('pantry' in m.bonus) && !('catchup' in m.bonus) && JSON.stringify(m.bonusOwn) === '{}', '기르기 칸은 모두 0단계 · 선반 · 늦잠 칸은 없어짐 (P40 · P41)');
  check(m.money === m0 + 39 * E.POLLEN_WON, `받은 꽃가루 39알(등급 40)은 돈으로 — +${(m.money - m0).toLocaleString()}원 (P41-05)`);
  const r = E.bonusSet(m, 'basket', 1);
  check(!r.ok && r.msg === '🐜 개미 일꾼을 먼저 데려와요', '다시 넓히려면 데려온 곤충이 있어야 함 (돈으로 삼)'); }

console.log('[시뮬 (P17-14)]');
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드') + v('카운터 판매'), v('찻집: 꿀차')]; };   // [2] P65-02 🍵 꿀차 (따로)
  const base = y4(sim()), auto = y4(sim('--auto', '--bonus=barrel,basket,weed,worm,rack,hive,brew'));
  check(base[0] === 3782050 && base[1] === 1779390, `P90 저절로 들어옴: 3,782,050원 · 찻집 1,779,390원 (P77-C 3,365,510원 · 1,574,230원) (P72-01 4,977,660원 · 찻집 2,183,330원 · 기본 4 7: 65,420원 · 찻집 319,920원 (P54 새 기준 · P49 117,420원 · 319,990원 · P47 87,330원 · 319,680원 · P41 43,920원 · 282,940원 — ${base.join(' · ')})`);
  // P65-02 꿀차를 팔면 주문 · 경험치 흐름이 바뀌어 꿀차를 뺀 4년째 값도 해마다 나뉨이 달라짐 — 꿀차까지 합쳐 봄 (4년 합은 체크리스트 P65-05 표)
  const withHoney = auto[1] + auto[2], pct = Math.round((withHoney / base[1] - 1) * 1000) / 10;   // P65-02 꿀차 값(찻값 30%)은 +5%를 넘는 것을 알고 11-03 사용자가 고름 — 숫자만 알림, 크게 바뀌면(+15% 넘게) 다시 보게
  console.log(`  ⚠️ 꿀차 넣으면 ${withHoney}원 (기본 대비 +${pct}% · 꿀차 ${auto[2]}원 — P65-02 사용자 결정)`);
  check(withHoney <= base[1] * 1.15, `꿀차까지 넣어도 기본 +15% 안 (${withHoney}원)`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
