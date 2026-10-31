// P37 🌼 꽃가루 · 일꾼 기르기 (10-31) · P39 (10-31): 곤충 7칸 모두 둘레 1 → 2 → 3칸 · 꽃가루 2 · 3알 (모두 44알) · P40 그 밖에 세 칸(모두 93알) · 환급 · 모자람 · 🐝 꿀벌 둘레 · 상한 · 저장 · 시뮬 기준값
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (pred, g) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'pollen-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 12); return st; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const grow = (st, k, n) => { st.grade.xp = E.gradeXpAt(200); return E.bonusSet(st, k, n); };   // 꽃가루가 넉넉한 정원에서 n단계로

console.log('[10칸 · 단계 값 · 꽃가루 (P39-01 · P40)]');
check(E.BONUS_KEYS.join() === 'barrel,basket,weed,worm,rack,hive,brew,grow,dry,pollen', '10칸: 🐌 · 🐜 · 🐞 · 🪱 · 🐛 · 🐝 · 🦋 · 🌱 자라는 속도 · 🌾 말리는 속도 · 🌼 꽃가루 늘리기');
check(E.BONUS_KEYS.map(k => E.BONUS[k].worker).join() === 'barrel,autobasket,ladybug,earthworm,dryrack,hive,teahelper,,,', '곤충 카드 키 (그 밖에 세 칸은 곤충 아님) — 곤충농장 카드 차례와 같음');
check(E.BONUS_KEYS.filter(k => E.BONUS[k].worker).join() === E.FARM_KEYS.map(k => E.INSECTS[k]).join(), 'INSECTS 표와 곤충농장 카드가 한 칸씩 맞음');
const val = (k, v) => typeof v === 'object' ? `${v.r}/${v.max}` : v;
check(E.BONUS_KEYS.map(k => E.BONUS[k].vals.map(v => val(k, v)).join('>')).join(' ') === '1>2>3 1>2>3 1>2>3 1>2>3 1>2>3 1/3>2/6>3/9 1>2>3 1>2>3>4>5>6>7>8>9>10 1>2>3>4>5>6>7>8>9>10 1>2>3', '곤충은 모두 둘레 1 → 2 → 3칸 (🐝 꿀 3 → 6 → 9병)');
check(E.BONUS_KEYS.map(k => E.BONUS[k].cost.join('·')).join(' ') === '2·3 2·3 2·3 2·3 2·3 2·3 2·3 1·1·2·2·3·3·4·4·5 1·1·2·2·3·3·4·4·5 3·5', '곤충 2 · 3알 · 자라는 · 말리는 속도 1 · 1 · 2 · 2 · 3 · 3 · 4 · 4 · 5 · 꽃가루 늘리기 3 · 5');
check(E.BONUS_KEYS.every(k => E.BONUS[k].cost.length === E.bonusMax(k)), 'cost 칸 수 = 단계 수');
const total = E.BONUS_KEYS.reduce((a, k) => a + E.bonusCostTo(E.bonusMax(k), k), 0);
check(total === 93, `모두 끝단계 = 꽃가루 ${total}알 (곤충 35 + 자라는 25 + 말리는 25 + 꽃가루 8 — P40)`);
check(E.BONUS_PER === 1 && E.bonusPointsAt(2) === 1 && E.bonusPointsAt(94) === 93, '등급 1마다 1알 (BONUS_PER 그대로)');
check(E.bonusCostTo(2, 'brew') === 5 && E.bonusCostTo(2) === 3 && E.bonusCostTo(0, 'hive') === 0, 'bonusCostTo(단계, 키) — 키가 없으면 예전 1 · 2 · 3');
check(E.BONUS_KEYS.every(k => !E.BONUS[k].open), '4층 같은 잠금 없음 (🐞도 데려오면 기름)');

console.log('[기르기 · 모자람 · 다시 어리게]');
{ const st = garden(c => c.month === 6, 3);   // 2알
  const a = E.bonusSet(st, 'worm', 1);
  check(a.ok && st.bonus.worm === 1 && E.bonusLeft(st) === 0 && a.msg === '🪱 지렁이가 자랐어요 · 둘레 넓히기 1단계', `지렁이 1단계 = 2알 ("${a.msg}")`);
  const b = E.bonusSet(st, 'worm', 2);
  check(!b.ok && b.msg === '🌼 꽃가루가 3알 모자라요' && st.bonus.worm === 1, `모자라면 거절 ("${b.msg}")`);
  const c = E.bonusSet(st, 'worm', 0);
  check(c.ok && st.bonus.worm === 0 && E.bonusLeft(st) === 2 && c.msg === '🪱 지렁이를 다시 어리게 했어요 · 🌼 꽃가루 2알이 돌아왔어요', `다시 어리게 — 꽃가루 그대로 돌아옴 ("${c.msg}")`);
  st.grade.xp = E.gradeXpAt(11);   // 10알
  check(E.bonusSet(st, 'brew', 2).ok && E.bonusLeft(st) === 5 && E.bonusUsed(st) === 5, '0 → 2단계로 바로 (2 + 3알)');
  check(E.bonusSet(st, 'brew', 1).ok && E.bonusLeft(st) === 8, '2 → 1단계: 3알 돌아옴');
  check(E.bonusSet(st, 'hive', 2).ok && E.bonusLeft(st) === 3 && E.bonusSet(st, 'pollen', 1).ok && E.bonusLeft(st) === 0, '남은 꽃가루 안에서 다른 칸으로 (꿀벌 5알 · 꽃가루 늘리기 3알)');
  const s2 = garden(c => c.month === 6, 2);
  const p = E.bonusSet(s2, 'grow', 1), q = E.bonusSet(s2, 'pollen', 1);
  check(p.ok && p.msg === '🌱 자라는 속도가 자랐어요 · 자라는 속도 1단계' && !q.ok && q.msg === '🌼 꽃가루가 3알 모자라요', '그 밖에 칸도 같은 꼴');
  check(!E.bonusSet(s2, 'gold', 1).ok && !E.bonusSet(s2, 'weed', 3).ok && !E.bonusSet(s2, 'hive', 3).ok, '없는 칸 · 없는 단계는 거절');
  const m0 = s2.money; E.bonusSet(s2, 'grow', 0);
  check(s2.money === m0, '돈은 그대로 (꽃가루만)'); }

console.log('[🐝 꿀벌 — 둘레 · 꿀 상한 (hiveTick)]');
{ const ring = st => { for (let y = 5; y <= 15; y++) for (let x = 5; x <= 15; x++) if (x !== 10 || y !== 10) fl(st, 'lavender', x, y); };
  const st = garden(c => c.month === 7 && !c.frozen); st.flowers.length = 0; const d = put(st, 'hive', 10, 10);
  fl(st, 'lavender', 13, 10); fl(st, 'lavender', 7, 7);   // 3칸 거리 2포기
  check(E.hiveR(st) === 1 && E.hiveMax(st) === 3 && E.hiveR(st) === E.HONEY_R && E.hiveMax(st) === E.HIVE_MAX && E.insectR(st, 'hive') === 1, '0단계: 둘레 1칸 · 3병');
  check(E.hiveBlooms(st, d).length === 0, '0단계: 3칸 떨어진 꽃은 안 셈');
  grow(st, 'hive', 1);
  check(E.hiveR(st) === 2 && E.hiveMax(st) === 6 && E.hiveBlooms(st, d).length === 0, '1단계: 둘레 2칸 · 6병');
  grow(st, 'hive', 2);
  check(E.hiveR(st) === 3 && E.hiveMax(st) === 9 && E.hiveBlooms(st, d).length === 2, '2단계: 둘레 3칸 · 9병 — 3칸 꽃도 셈');
  const fill = n => { const s = garden(c => c.month === 7 && !c.frozen); s.flowers.length = 0; const h = put(s, 'hive', 10, 10); ring(s); if (n) grow(s, 'hive', n); for (let i = 0; i < 6; i++) E.hiveTick(s, ctx); return [h.honey.length, E.honeyOf(E.hiveBlooms(s, h)).jars]; };
  const f = [0, 1, 2].map(fill);
  check(f.map(x => x[0]).join() === '3,6,9' && f.every(x => x[1] === 3), `달마다 3병은 그대로 · 쌓아 두는 상한만 3 → 6 · 9병 (${f.map(x => x[0]).join(' · ')})`); }

console.log('[bonusView — 카드가 읽는 값]');
{ const st = garden(c => c.month === 6, 8); E.bonusSet(st, 'basket', 1); E.bonusSet(st, 'hive', 1);
  const v = E.bonusView(st), row = k => v.rows.find(r => r.key === k);
  check(v.points === 7 && v.used === 4 && v.left === 3 && v.nextAt === 9 && v.rows.length === 10, `모은 7 · 쓴 4 · 남은 3알 · 다음 알은 등급 9`);
  const b = row('basket'), h = row('hive'), r = row('brew');
  check(b.worker === 'autobasket' && b.who === '🐜 개미 일꾼' && b.name === '둘레 넓히기' && b.level === 1 && b.costNext === 3 && b.desc === '둘레 2칸 핀 꽃 거두기' && b.nextDesc === '둘레 3칸 핀 꽃 거두기', '개미: 단계 · 다음 꽃가루 · 지금 / 다음 값');
  check(h.level === 1 && h.costNext === 3 && h.desc === '둘레 2칸 번식 · 꿀 6병까지' && h.nextDesc === '둘레 3칸 번식 · 꿀 9병까지', '꿀벌: 둘레 · 상한 설명');
  check(r.level === 0 && r.costNext === 2 && r.desc === '둘레 1칸 꽃의 첫 꽃잎 +1' && r.nextDesc === '둘레 2칸 꽃의 첫 꽃잎 +1', '나비 0단계: 다음 2알');
  st.settings.slow = true;
  const sv = E.bonusView(st);
  check(sv.left === 3 && sv.rows[1].level === 1 && !('slow' in sv), '느긋하게 보기여도 엔진 값은 같음 (숨김은 화면 몫)'); }

console.log('[저장 · 새 철 · 시뮬 기준값]');
{ const st = garden(c => c.month === 6, 20); E.bonusSet(st, 'brew', 2); E.bonusSet(st, 'hive', 2);
  const back = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const got = back.ok ? E.migrateSave(back.data.game) : null;
  check(!!got && got.bonus.brew === 2 && got.bonus.hive === 2 && got.bonus.weed === 0 && E.bonusLeft(got) === E.bonusLeft(st), '파일로 저장 · 열기');
  check(E.SEASON_KEEP.includes('bonus'), '새 철에도 이어짐 (SEASON_KEEP)');
  const n = E.create(at(c => c.month === 6), () => 0.5);
  check(E.BONUS_KEYS.every(k => n.bonus[k] === 0), '새 정원 10칸 0단계'); }
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드')]; };
  const base = y4(sim()), all = y4(sim('--bonus=barrel,basket,weed,worm,rack,hive,brew,pollen'));
  check(base[0] === 80720 && base[1] === 336900, `시뮬 기본 4 7: 80,720원 · 찻집 336,900원 그대로 (${base.join(' · ')})`);
  check(all[0] === base[0] && all[1] === base[1], '기본 정원사는 곤충 · 꽃가루 늘리기가 끝단계여도 같음 (일꾼이 없으면 기르기도 일하지 않음 · 자라는 · 말리는 속도는 P40 시뮬 표)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
