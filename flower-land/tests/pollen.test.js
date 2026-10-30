// P37 🌼 꽃가루 · 일꾼 기르기 (10-31): 손길 점 → 꽃가루, 고르기 → 기르기 · 7칸 단계 · 항목마다 꽃가루 · 환급 · 모자람 · 🦋 나비 잔 수 · 🐝 꿀벌 둘레 · 상한 · 🐞 무당벌레 포기 수 · 4층 전 잠김 · 저장 · 시뮬 기준값
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

console.log('[7칸 · 단계 값 · 꽃가루]');
check(E.BONUS_KEYS.join() === 'basket,rack,brew,hive,weed,pantry,catchup', '7칸: 🐜 · 🐛 · 🦋 · 🐝 · 🐞 · 🧺 선반 · 🌙 따라잡기');
check(E.BONUS_KEYS.map(k => E.BONUS[k].worker).join() === 'autobasket,dryrack,teahelper,hive,ladybug,,', '일꾼 카드 키 (선반 · 따라잡기는 일꾼 아님)');
check(E.BONUS_KEYS.every(k => E.FARM_KEYS.includes(E.BONUS[k].worker) || E.BONUS[k].worker === null), '일꾼 키는 모두 곤충농장 카드에 있음');
const val = (k, v) => typeof v === 'object' ? `${v.r}/${v.max}` : v;
check(E.BONUS_KEYS.map(k => E.BONUS[k].vals.map(v => val(k, v)).join('>')).join(' ') === '8>12>16>20 8>10>12>14 0>1>2>3 2/6>3/9>3/12 3>4 0>1>2>3 3>4>5', '단계 값 (🐞 식성은 3 → 4 한 단계 — 시뮬로 줄임)');
check(E.BONUS_KEYS.map(k => E.BONUS[k].cost.join('·')).join(' ') === '1·2·3 1·2·3 2·3·4 2·3 1 1·2·3 1·2', '단계마다 꽃가루 (나비 2 · 3 · 4 · 꿀벌 2 · 3 · 무당벌레 1)');
check(E.BONUS_KEYS.every(k => E.BONUS[k].cost.length === E.bonusMax(k)), 'cost 칸 수 = 단계 수');
const total = E.BONUS_KEYS.reduce((a, k) => a + E.bonusCostTo(E.bonusMax(k), k), 0);
check(total === 36, `모두 끝단계 = 꽃가루 ${total}알 (37등급)`);
check(E.BONUS_PER === 1 && E.bonusPointsAt(2) === 1 && E.bonusPointsAt(37) === 36, '등급 1마다 1알 (BONUS_PER 그대로)');
check(E.bonusCostTo(2, 'brew') === 5 && E.bonusCostTo(2) === 3 && E.bonusCostTo(0, 'hive') === 0, 'bonusCostTo(단계, 키) — 키가 없으면 예전 1 · 2 · 3');

console.log('[기르기 · 모자람 · 다시 어리게]');
{ const st = garden(c => c.month === 6, 3);   // 2알
  const a = E.bonusSet(st, 'brew', 1);
  check(a.ok && st.bonus.brew === 1 && E.bonusLeft(st) === 0 && a.msg === '🦋 나비 일꾼이 자랐어요 · 부지런히 1단계', `나비 1단계 = 2알 ("${a.msg}")`);
  const b = E.bonusSet(st, 'brew', 2);
  check(!b.ok && b.msg === '🌼 꽃가루가 3알 모자라요' && st.bonus.brew === 1, `모자라면 거절 ("${b.msg}")`);
  const c = E.bonusSet(st, 'brew', 0);
  check(c.ok && st.bonus.brew === 0 && E.bonusLeft(st) === 2 && c.msg === '🦋 나비 일꾼을 다시 어리게 했어요 · 🌼 꽃가루 2알이 돌아왔어요', `다시 어리게 — 꽃가루 그대로 돌아옴 ("${c.msg}")`);
  st.grade.xp = E.gradeXpAt(10);   // 9알
  check(E.bonusSet(st, 'brew', 3).ok && E.bonusLeft(st) === 0 && E.bonusUsed(st) === 9, '0 → 3단계로 바로 (2 + 3 + 4알)');
  check(E.bonusSet(st, 'brew', 1).ok && E.bonusLeft(st) === 7, '3 → 1단계: 3 + 4 = 7알 돌아옴');
  check(E.bonusSet(st, 'hive', 2).ok && E.bonusLeft(st) === 2 && !E.bonusSet(st, 'catchup', 2).ok && E.bonusSet(st, 'catchup', 1).ok && E.bonusLeft(st) === 1, '남은 꽃가루 안에서 다른 일꾼으로 (꿀벌 5알 · 따라잡기 1알)');
  const s2 = garden(c => c.month === 6, 2);
  const p = E.bonusSet(s2, 'pantry', 1), q = E.bonusSet(s2, 'catchup', 1);
  check(p.ok && p.msg === '🧺 입구 선반이 자랐어요 · 선반 넓히기 1단계' && !q.ok && q.msg === '🌼 꽃가루가 1알 모자라요', '선반 · 따라잡기도 같은 꼴');
  check(!E.bonusSet(s2, 'gold', 1).ok && !E.bonusSet(s2, 'weed', 2).ok && !E.bonusSet(s2, 'hive', 3).ok, '없는 칸 · 없는 단계는 거절');
  const m0 = s2.money; E.bonusSet(s2, 'pantry', 0);
  check(s2.money === m0, '돈은 그대로 (꽃가루만)'); }

console.log('[🦋 나비 — 부지런히: 카운터에 더 우려 둠 (helperTick)]');
{ const brewN = n => {
    const st = garden(c => c.month === 12); put(st, 'teahelper', 0, 0); if (n) grow(st, 'brew', n);
    for (let i = 0; i < 8; i++) st.teas.push({ id: st.nextId++, type: 'rose', q: 0.6, seasonKey: -1 });
    return [E.helperKeep(st), E.helperTick(st, E.calendar(st.virtual))];
  };
  const r = [0, 1, 2, 3].map(brewN);
  check(r.map(x => x.join('/')).join(' ') === '2/2 3/3 4/4 5/5', `손님 자리 1 → 2 · 3 · 4 · 5잔 (${r.map(x => x[1]).join(' · ')})`);
  const st = garden(c => c.month === 12); grow(st, 'brew', 3);
  check(E.helperTick(st, E.calendar(st.virtual)) === 0, '나비가 정원에 없으면 기르기만으로는 우리지 않음'); }

console.log('[🐝 꿀벌 — 멀리 날기: 둘레 · 꿀 상한 (hiveTick)]');
{ const ring = st => { for (let y = 5; y <= 15; y++) for (let x = 5; x <= 15; x++) if (x !== 10 || y !== 10) fl(st, 'lavender', x, y); };
  const st = garden(c => c.month === 7 && !c.frozen); st.flowers.length = 0; const d = put(st, 'hive', 10, 10);
  fl(st, 'lavender', 13, 10); fl(st, 'lavender', 7, 7);   // 3칸 거리 2포기
  check(E.hiveR(st) === 2 && E.hiveMax(st) === 6 && E.hiveR(st) === E.HONEY_R && E.hiveMax(st) === E.HIVE_MAX, '0단계: 둘레 2칸 · 6병 (HONEY_R · HIVE_MAX)');
  check(E.hiveBlooms(st, d).length === 0, '0단계: 3칸 떨어진 꽃은 안 셈');
  grow(st, 'hive', 1);
  check(E.hiveR(st) === 3 && E.hiveMax(st) === 9 && E.hiveBlooms(st, d).length === 2, '1단계: 둘레 3칸 · 9병 — 3칸 꽃도 셈');
  grow(st, 'hive', 2);
  check(E.hiveR(st) === 3 && E.hiveMax(st) === 12, '2단계: 둘레 3칸 · 12병');
  const fill = n => { const s = garden(c => c.month === 7 && !c.frozen); s.flowers.length = 0; const h = put(s, 'hive', 10, 10); ring(s); if (n) grow(s, 'hive', n); for (let i = 0; i < 6; i++) E.hiveTick(s, ctx); return [h.honey.length, E.honeyOf(E.hiveBlooms(s, h)).jars]; };
  const f = [0, 1, 2].map(fill);
  check(f.map(x => x[0]).join() === '6,9,12' && f.every(x => x[1] === 3), `달마다 3병은 그대로 · 쌓아 두는 상한만 6 → 9 · 12병 (${f.map(x => x[0]).join(' · ')})`);
  const far = garden(c => c.month === 7 && !c.frozen); far.flowers.length = 0; const fd = put(far, 'hive', 10, 10); fl(far, 'rose', 13, 13); grow(far, 'hive', 1);
  check(E.hiveBlooms(far, fd).length === 1 && E.farmOf(far).workers.find(w => w.key === 'hive').desc.includes('둘레 3칸'), '곤충농장 꿀벌 설명도 둘레를 따라감'); }

console.log('[🐞 무당벌레 — 식성: 달마다 잡초 (forestWeedTick) · 4층 전엔 잠김]');
{ const w = (open, n) => {
    const st = garden(c => c.month === 6 && !c.frozen); st.flowers.length = 0;
    if (open) { st.layers.at[4] = 0; st.dex.tea.chamomile = 1; st.stats.dug = 1; }
    for (let i = 0; i < 6; i++) fl(st, 'chamomile', 2 + 2 * i, 2, { weedH: 0 });
    if (n) st.bonus = Object.assign(E.newBonus(), { weed: n });
    return [st, E.forestWeedTick(st, E.calendar(st.virtual), ctx)];
  };
  const [a, n0] = w(true, 0), [b, n1] = w(true, 1);
  check(E.forestOpen(a) && n0 === 3 && n1 === 4 && E.FOREST_WEED_N === 3, `달마다 3 → 4포기 (${n0} · ${n1})`);
  check(E.forestWeedWord(a) === '세 포기' && E.forestWeedWord(b) === '네 포기' && E.forestWeedOf(a).text.includes('세 포기') && E.forestWeedWord() === '세 포기', '화면 문구 "잡초 네 포기"도 따라감');
  check(E.farmOf(b).workers.find(x => x.key === 'ladybug').work === '달 끝마다 잡초 네 포기', '곤충농장 무당벌레 일 한 줄');
  const [c] = w(false, 0);
  const r = E.bonusSet(c, 'weed', 1);
  check(!E.forestOpen(c) && !r.ok && r.msg === '4층 작은 숲이 열려야 길러요' && c.bonus.weed === 0, `4층 전엔 기를 수 없음 ("${r.msg}")`);
  const v = E.bonusView(c).rows.find(x => x.key === 'weed');
  check(v.open === false && v.lock && E.bonusView(a).rows.find(x => x.key === 'weed').open === true, 'bonusView open · lock');
  c.bonus.weed = 1;   // 4층이 열렸다 닫힌 셈은 없지만, 저장에 있으면 다시 어리게는 늘 됨
  check(E.bonusSet(c, 'weed', 0).ok && c.bonus.weed === 0, '잠겨 있어도 다시 어리게는 됨');
  check(E.bonusSet(a, 'weed', 1).ok && a.bonus.weed === 1, '4층이 열리면 기름'); }

console.log('[bonusView — 카드가 읽는 값]');
{ const st = garden(c => c.month === 6, 8); E.bonusSet(st, 'basket', 2); E.bonusSet(st, 'hive', 1);
  const v = E.bonusView(st), row = k => v.rows.find(r => r.key === k);
  check(v.points === 7 && v.used === 5 && v.left === 2 && v.nextAt === 9 && v.rows.length === 7, `모은 7 · 쓴 5 · 남은 2알 · 다음 알은 등급 9`);
  const b = row('basket'), h = row('hive'), r = row('brew');
  check(b.worker === 'autobasket' && b.who === '🐜 개미 일꾼' && b.name === '걸음 넓히기' && b.level === 2 && b.costNext === 3 && b.desc === '맡는 꽃 16포기' && b.nextDesc === '맡는 꽃 20포기', '개미: 단계 · 다음 꽃가루 · 지금 / 다음 값');
  check(h.level === 1 && h.costNext === 3 && h.desc === '둘레 3칸 · 꿀 9병까지' && h.nextDesc === '둘레 3칸 · 꿀 12병까지', '꿀벌: 둘레 · 상한 설명');
  check(r.level === 0 && r.costNext === 2 && r.nextDesc === '카운터에 1잔 더 우려 둬요', '나비 0단계: 다음 2알');
  st.settings.slow = true;
  const sv = E.bonusView(st);
  check(sv.left === 2 && sv.rows[0].level === 2 && !('slow' in sv), '느긋하게 보기여도 엔진 값은 같음 (숨김은 화면 몫)'); }

console.log('[저장 · 새 철 · 시뮬 기준값]');
{ const st = garden(c => c.month === 6, 20); E.bonusSet(st, 'brew', 2); E.bonusSet(st, 'hive', 2);
  const back = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const got = back.ok ? E.migrateSave(back.data.game) : null;
  check(!!got && got.bonus.brew === 2 && got.bonus.hive === 2 && got.bonus.weed === 0 && E.bonusLeft(got) === E.bonusLeft(st), '파일로 저장 · 열기');
  check(E.SEASON_KEEP.includes('bonus'), '새 철에도 이어짐 (SEASON_KEEP)');
  const n = E.create(at(c => c.month === 6), () => 0.5);
  check(E.BONUS_KEYS.every(k => n.bonus[k] === 0), '새 정원 7칸 0단계'); }
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드')]; };
  const base = y4(sim()), all = y4(sim('--bonus', 'all'));
  check(base[0] === 80720 && base[1] === 336900, `시뮬 기본 4 7: 80,720원 · 찻집 336,900원 그대로 (${base.join(' · ')})`);
  check(all[0] === base[0] && all[1] === base[1], '기본 정원사는 모두 끝단계여도 같음 (일꾼이 없으면 기르기도 일하지 않음)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
