// P37 일꾼 기르기 (10-31) · P39 (10-31): 곤충 7칸 모두 둘레 1 → 2 → 3칸(P61-01부터 2 → 4 → 6칸) · P40 그 밖에 두 칸 · 🐝 꿀벌 둘레 · 상한 · 저장 · 새 철
// 🔄 P41 (10-31): 🌼 꽃가루는 없어지고 돈 + 등급으로 삼 — 사기 · 낮추기 · 옮기기는 p41.test.js, 여기는 칸 구조와 규칙이 읽는 값
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (pred, g) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'pollen-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 12); return st; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', ripeH: 6, bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const grow = (st, k, n) => { st.bonusOwn = Object.assign({}, st.bonusOwn, { [k]: E.bonusMax(k) }); return E.bonusSet(st, k, n); };   // 끝까지 산 정원에서 n단계로 (P41)

console.log('[9칸 · 단계 값 (P39-01 · P40 · P41)]');
check(E.BONUS_KEYS.join() === 'barrel,basket,weed,worm,rack,hive,brew,grow,dry', '9칸: 🐌 · 🐜 · 🐞 · 🪱 · 🐛 · 🐝 · 🦋 · 🌱 자라는 속도 · 🌾 말리는 속도 (🌼 꽃가루 늘리기는 P41에서 없앰)');
check(E.BONUS_KEYS.map(k => E.BONUS[k].worker).join() === 'barrel,autobasket,ladybug,earthworm,dryrack,hive,teahelper,,', '곤충 카드 키 (그 밖에 두 칸은 곤충 아님) — 곤충농장 카드 차례와 같음');
check(E.BONUS_KEYS.filter(k => E.BONUS[k].worker).join() === E.FARM_KEYS.map(k => E.INSECTS[k]).join(), 'INSECTS 표와 곤충농장 카드가 한 칸씩 맞음');
const val = v => typeof v === 'object' ? `${v.r}/${v.max}` : v;
check(E.BONUS_KEYS.map(k => E.BONUS[k].vals.map(val).join('>')).join(' ') === '2>4>6 2>4>6 2>4>6 2>4>6 2>4>6 2/3>4/6>6/9 2>4>6 1>1.5>2>2.5>3>3.5>4>4.5>5 1>1.5>2>2.5>3>3.5>4>4.5>5', '곤충은 모두 둘레 2 → 4 → 6칸 (P61-01 · 🐝 꿀 3 → 6 → 9병) · 두 속도 ×1 → ×5 0.5배씩 (P42)');
check(E.BONUS_KEYS.every(k => E.BONUS[k].price.length === E.bonusMax(k)), 'price 칸 수 = 단계 수');
check(E.BONUS_PER === 1 && E.bonusPointsAt(2) === 1 && E.bonusPointsAt(41) === 40, '예전 꽃가루 셈(옮기기만): 등급 1마다 1알');
check(E.bonusCostTo(2, 'brew') === 5 && E.bonusCostTo(2) === 3 && E.bonusCostTo(0, 'hive') === 0, 'bonusCostTo(단계, 키) — 예전 꽃가루 (P38 옮기기만)');
check(E.BONUS_KEYS.every(k => !E.BONUS[k].open), '4층 같은 잠금 없음 (🐞도 데려오면 넓힘)');

console.log('[🐝 꿀벌 — 둘레 · 꿀 상한 (hiveTick)]');
{ const ring = st => { for (let y = 5; y <= 15; y++) for (let x = 5; x <= 15; x++) if (x !== 10 || y !== 10) fl(st, 'lavender', x, y); };
  const st = garden(c => c.month === 7 && !c.frozen); st.flowers.length = 0; const d = put(st, 'hive', 10, 10);
  fl(st, 'lavender', 16, 10); fl(st, 'lavender', 4, 4);   // 6칸 거리 2포기 (P61-01)
  check(E.hiveR(st) === 2 && E.hiveMax(st) === 3 && E.hiveR(st) === E.HONEY_R && E.hiveMax(st) === E.HIVE_MAX && E.insectR(st, 'hive') === 2, '0단계: 둘레 2칸 · 3병');
  check(E.hiveBlooms(st, d).length === 0, '0단계: 6칸 떨어진 꽃은 안 셈');
  grow(st, 'hive', 1);
  check(E.hiveR(st) === 4 && E.hiveMax(st) === 6 && E.hiveBlooms(st, d).length === 0, '1단계: 둘레 4칸 · 6병');
  grow(st, 'hive', 2);
  check(E.hiveR(st) === 6 && E.hiveMax(st) === 9 && E.hiveBlooms(st, d).length === 2, '2단계: 둘레 6칸 · 9병 — 6칸 꽃도 셈');
  const fill = n => { const s = garden(c => c.month === 7 && !c.frozen); s.flowers.length = 0; const h = put(s, 'hive', 10, 10); ring(s); if (n) grow(s, 'hive', n); for (let i = 0; i < 6; i++) E.hiveTick(s, ctx); return [E.honeyLeft(s), E.honeyOf(E.hiveBlooms(s, h)).jars]; };
  const f = [0, 1, 2].map(fill);
  check(f.map(x => x[0]).join() === '3,6,9' && f.every(x => x[1] === 3), `달마다 3병은 그대로 · 창고 꿀 상한만 3 → 6 · 9병 (P65-01) (${f.map(x => x[0]).join(' · ')})`); }

console.log('[bonusView — 카드가 읽는 값]');
{ const st = garden(c => c.month === 6, 8); put(st, 'autobasket', 1, 1); put(st, 'hive', 3, 3); grow(st, 'basket', 1); grow(st, 'hive', 1);
  const v = E.bonusView(st), row = k => v.rows.find(r => r.key === k);
  check(v.rows.length === 9 && v.grade === 8 && !('points' in v), '9줄 · 꽃가루 숫자 없음');
  const b = row('basket'), h = row('hive');
  check(b.worker === 'autobasket' && b.who === '🐜 개미 일꾼' && b.name === '둘레 넓히기' && b.level === 1 && b.desc === E.INSECT_LINE.autobasket(4), '개미: 단계 · 설명');
  check(h.level === 1 && h.desc === `${E.INSECT_LINE.hive(4)} · 창고 꿀 6병까지`, '꿀벌: 둘레 · 상한 설명');
  st.settings.slow = true;
  const sv = E.bonusView(st);
  check(sv.rows[1].level === 1 && !('slow' in sv), '느긋하게 보기여도 엔진 값은 같음 (숨김은 화면 몫)'); }

console.log('[저장 · 새 철]');
{ const st = garden(c => c.month === 6, 20); grow(st, 'brew', 2); grow(st, 'hive', 1); st.bonusOwn.hive = 2;
  const back = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const got = back.ok ? E.migrateSave(back.data.game) : null;
  check(!!got && got.bonus.brew === 2 && got.bonus.hive === 1 && E.bonusOwned(got, 'hive') === 2 && got.bonus.weed === 0, '파일로 저장 · 열기 — 쓰는 단계 · 산 단계 그대로');
  check(E.SEASON_KEEP.includes('bonus') && E.SEASON_KEEP.includes('bonusOwn'), '새 철에도 이어짐 (SEASON_KEEP)');
  const n = E.create(at(c => c.month === 6), () => 0.5);
  check(E.BONUS_KEYS.every(k => n.bonus[k] === 0) && JSON.stringify(n.bonusOwn) === '{}', '새 정원 9칸 0단계 · 산 것 없음'); }
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드')]; };
  const base = y4(sim()), all = y4(sim('--bonus=barrel,basket,weed,worm,rack,hive,brew'));
  check(base[0] === 3782050 && base[1] === 1779390, `P90 저절로 들어옴: 3,782,050원 · 찻집 1,779,390원 (P77-C 3,365,510원 · 1,574,230원) (P72-01 4,977,660원 · 찻집 2,183,330원 · 시뮬 기본 4 7: 65,420원 · 찻집 319,920원 (P54 새 기준 · P49 117,420원 · 319,990원 · P47 87,330원 · 319,680원 · P41 43,920원 · 282,940원 — ${base.join(' · ')})`);
  check(all[0] === base[0] && all[1] === base[1], '기본 정원사는 곤충 칸이 끝단계여도 같음 (곤충이 없으면 둘레도 일하지 않음)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
