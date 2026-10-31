// P38 🐜 작게 시작하는 일꾼 (10-31): 데려오는 조건을 낮추고(🐜 등급 2 · 🐛 4 · 🦋 6), 1포기 · 1장 · 1칸처럼 작게 시작해 꽃가루를 먹일수록 커짐
// 새 조건 · 시작값 1 · 단계 값 · 비용 합 · 예전 저장 단계 옮김(bonusFree) · 환급 셈 · 화면 값(곤충농장 카드) · 시뮬 불변 (P17-14)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (pred, g) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'smallstart-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(g || 1); return st; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const W = (st, k) => E.farmOf(st).workers.find(w => w.key === k);

console.log('[데려오는 조건 — 🐜 등급 2 · 12,000 · 🐛 등급 4 · 18,000 · 🦋 등급 6 · 30,000]');
{ const D = E.DECOS;
  check([['autobasket', 2, 12000], ['dryrack', 4, 18000], ['teahelper', 6, 30000]].every(([k, need, price]) => D[k].need === need && D[k].price === price), '조건 · 값');
  check(D.hive.price === 15000 && D.hive.months.join() === '6,7,8' && !D.hive.need && D.teahelper.one, '🐝 꿀벌(여름 · 15,000) · 🦋 하나만은 그대로');
  for (const [k, need] of [['autobasket', 2], ['dryrack', 4], ['teahelper', 6]]) {
    const st = garden(c => c.month === 6 && !c.frozen, need - 1);
    const w0 = W(st, k), r0 = E.buyDeco(st, k, ctx);
    st.grade.xp = E.gradeXpAt(need); const w1 = W(st, k), r1 = E.buyDeco(st, k, ctx);
    check(w0.state === 'locked' && w0.when === `정원 등급 ${need}부터 와요` && !r0.ok && w1.state === 'shop' && r1.ok, `${D[k].name}: 등급 ${need - 1}엔 잠김 · ${need}면 데려옴`);
  }
  check(['autobasket', 'dryrack'].every(k => !/\d/.test(D[k].desc)), '🐜 · 🐛 설명엔 숫자가 없음 (기르면 바뀌는 값은 카드 줄에서)'); }

console.log('[시작값 1 — 새 정원 0단계]');
{ const st = garden(c => c.month === 6 && !c.frozen, 2);
  check(E.bonusVal(st, 'basket') === 1 && E.rackN(st) === 1 && E.helperKeep(st) === E.shopOf(st).seats + 1 && E.hiveR(st) === 1 && E.hiveMax(st) === 3 && E.forestWeedN(st) === 1, '🐜 1포기 · 🐛 1장 · 🦋 손님 자리 + 1잔 · 🐝 둘레 1칸 · 3병 · 🐞 1포기');
  check(E.RACK_N === 1 && E.HONEY_R === 1 && E.HIVE_MAX === 3 && E.FOREST_WEED_N === 1, '0단계 상수도 같은 값');
  const d = put(st, 'autobasket', 5, 5); fl(st, 'chamomile', 4, 4); fl(st, 'chamomile', 6, 5); fl(st, 'lavender', 5, 6);
  check(E.basketTick(st, E.calendar(st.virtual), ctx) === 1 && d.n === 1, '데려오자마자 개미 일꾼이 꽃잎 1장');
  check(W(st, 'autobasket').work === '맡은 꽃 1포기', '곤충농장 카드: 맡은 꽃 1포기');
  E.bonusSet(st, 'basket', 1);
  check(E.bonusLeft(st) === 0 && E.basketTick(Object.assign(copy(st), { flowers: st.flowers.map(f => Object.assign({}, f, { harvestKey: -1 })) }), E.calendar(st.virtual), ctx) === 2, '2등급 꽃가루 1알로 바로 2포기'); }

console.log('[단계 값 · 꽃가루]');
{ const T = k => E.BONUS[k].vals.map(v => typeof v === 'object' ? `${v.r}/${v.max}` : v).join('>');
  check(T('basket') === '1>2>3>4>6>8>12>16>20' && E.BONUS.basket.cost.join() === '1,1,1,1,2,2,3,3', '🐜 1 → 20포기 (8단계 · 1·1·1·1·2·2·3·3)');
  check(T('rack') === '1>2>3>4>6>8>10>12>14' && E.BONUS.rack.cost.join() === '1,1,1,1,2,2,3,3', '🐛 1 → 14장 (8단계)');
  check(T('brew') === '1>2>3>4' && E.BONUS.brew.cost.join() === '2,3,4', '🦋 손님 자리 + 1 → +4잔 (3단계 · 2·3·4)');
  check(T('hive') === '1/3>2/6>3/9>3/12' && E.BONUS.hive.cost.join() === '1,2,3', '🐝 1칸3병 → 3칸12병 (3단계 · 1·2·3)');
  check(T('weed') === '1>2>3>4' && E.BONUS.weed.cost.join() === '1,1,2', '🐞 1 → 4포기 (3단계 · 1·1·2)');
  check(T('pantry') === '0>1>2>3' && T('catchup') === '3>4>5', '🧺 선반 · 🌙 늦잠 그대로');
  const ends = Object.fromEntries(E.BONUS_KEYS.map(k => [k, E.bonusCostTo(E.bonusMax(k), k)]));
  check(JSON.stringify(ends) === '{"basket":14,"rack":14,"brew":9,"hive":6,"weed":4,"pantry":6,"catchup":3}', `끝까지: 🐜 14 · 🐛 14 · 🦋 9 · 🐝 6 · 🐞 4 · 🧺 6 · 🌙 3알`);
  check(Object.values(ends).reduce((a, b) => a + b, 0) === 56, '모두 끝단계 56알 (57등급 — 오래 하는 사람 몫)');
  const old = E.BONUS_OLD;
  check(['basket', 'rack', 'hive', 'weed'].every(k => JSON.stringify(E.BONUS[k].vals[E.bonusMax(k)]) === JSON.stringify(old[k].vals[old[k].vals.length - 1])), '끝값은 P37과 같음 (🐜 20 · 🐛 14 · 🐝 3칸12병 · 🐞 4)');
  check(E.helperKeep({ bonus: { brew: 3 }, shop: E.create(at(c => c.month === 6), () => 0.5).shop }) === 1 + 4, '🦋 끝 = 손님 자리 + 4잔 (P37 끝 +1 +3과 같음)'); }

console.log('[예전 저장 — 같은 값의 새 단계로 · 꽃가루 셈 그대로]');
{ const XN = E.MIGRATIONS.findIndex(x => x[0].includes('P38'));
  check(XN === E.MIGRATIONS.length - 1, 'MIGRATIONS 맨 끝 P38');
  const mk = (bonus, g) => { const s = garden(c => c.month === 6 && !c.frozen, g); s.bonus = Object.assign(E.newBonus(), bonus); delete s.bonusFree; s.mig = XN; return s; };
  const OLD_PAID = { basket: [0, 1, 3, 6], rack: [0, 1, 3, 6], brew: [0, 2, 5, 9], hive: [0, 2, 5], weed: [0, 1], pantry: [0, 1, 3, 6], catchup: [0, 1, 3] };   // P37 비용표로 그 단계까지 낸 꽃가루
  const oldUsed = b => Object.entries(b).reduce((a, [k, lv]) => a + OLD_PAID[k][lv], 0);
  const vals = s => [E.bonusVal(s, 'basket'), E.rackN(s), E.bonusVal(s, 'brew'), `${E.hiveR(s)}/${E.hiveMax(s)}`, E.forestWeedN(s), E.bonusVal(s, 'pantry'), E.bonusVal(s, 'catchup')].join(' ');
  // 예전 값: 🐜 [8,12,16,20] · 🐛 [8,10,12,14] · 🦋 +[0..3]잔(손님 자리 + 1 위) · 🐝 [2/6,3/9,3/12] · 🐞 [3,4]
  for (const [b, want, to] of [
    [{}, '8 8 1 2/6 3 0 3', { basket: 5, rack: 5, hive: 1, weed: 2 }],
    [{ basket: 2 }, '16 8 1 2/6 3 0 3', { basket: 7 }],
    [{ basket: 3, rack: 3, brew: 3, hive: 2, weed: 1, pantry: 3, catchup: 2 }, '20 14 4 3/12 4 3 5', { basket: 8, rack: 8, brew: 3, hive: 3, weed: 3, pantry: 3, catchup: 2 }],
    [{ rack: 1, hive: 1 }, '8 10 1 3/9 3 0 3', { rack: 6, hive: 2 }],
  ]) {
    const s = mk(b, 40), used = oldUsed(b), m = E.migrateSave(s);
    check(vals(m) === want && Object.entries(to).every(([k, v]) => m.bonus[k] === v) && E.bonusUsed(m) === used && E.bonusLeft(m) === 39 - used, `${JSON.stringify(b)} → 값 ${want} 그대로 · 쓴 꽃가루 ${used}알 그대로`);
  }
  const s = E.migrateSave(mk({ basket: 3 }, 10)), back = [];   // 예전 끝단계 개미(6알 냄)를 하나씩 다시 어리게
  for (let lv = 7; lv >= 0; lv--) { const r = E.bonusSet(s, 'basket', lv); back.push(r.msg.includes('돌아왔어요') ? +r.msg.match(/(\d+)알이 돌아왔어요/)[1] : 0); }
  check(back.join() === '3,3,0,0,0,0,0,0' && E.bonusLeft(s) === 9, `다시 어리게: 낸 6알만 돌아옴 (${back.join(' · ')}) — 덜어 준 단계(8포기 아래)는 돌아올 꽃가루 없음`);
  check(E.bonusSet(s, 'basket', 5).ok && E.bonusLeft(s) === 9 && E.bonusSet(s, 'basket', 8).ok && E.bonusLeft(s) === 3, '다시 먹이면 8포기까지는 공짜 · 20포기까지 6알 (예전과 같음)');
  const r0 = E.bonusSet(s, 'basket', 4);
  check(r0.ok && r0.msg === '🐜 개미 일꾼을 다시 어리게 했어요 · 🌼 꽃가루 6알이 돌아왔어요', `알림 ("${r0.msg}")`);
  const r1 = E.bonusSet(s, 'basket', 3);
  check(r1.ok && r1.msg === '🐜 개미 일꾼을 다시 어리게 했어요', '돌아올 꽃가루가 없으면 꽃가루 말 없이');
  const v = E.bonusView(s).rows.find(r => r.key === 'basket');
  check(v.level === 3 && v.costNext === 0 && E.bonusView(E.migrateSave(mk({}, 10))).rows.find(r => r.key === 'rack').costNext === 2, '덜어 준 단계까지는 다음 꽃가루 0알(카드 먹이기가 바로 됨) · 그 위는 새 비용표 (🐛 8장 → 10장 2알)');
  const low = E.migrateSave(mk({ basket: 3, rack: 3, hive: 2, weed: 1 }, 2));   // 저장을 손으로 고친 셈 — 등급보다 많이 쓴 정원
  check(E.bonusLeft(low) < 0 && E.bonusView(low).left === 0, '쓴 꽃가루가 모은 것보다 많아도 화면은 0알 (예전 그대로 — 옮김이 만들지는 않음)');
  const sea = E.migrateSave(mk({ basket: 2 }, 20));
  check(E.SEASON_KEEP.includes('bonusFree') && E.SEASON_KEEP.includes('bonus'), '새 철에도 단계 · 덜어 준 셈이 이어짐');
  const file = E.parseSave(JSON.stringify(E.makeSave(sea, 1))), got = file.ok ? E.migrateSave(file.data.game) : null;
  check(!!got && got.bonus.basket === 7 && got.bonusFree.basket === sea.bonusFree.basket && E.bonusLeft(got) === E.bonusLeft(sea), '파일로 저장 · 열기 — 또 옮기지 않음'); }

console.log('[시뮬 (P17-14)]');
{ const { execFileSync } = require('child_process');
  const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7', ...a], { encoding: 'utf8' }).split('\n');
  const y4 = out => { const h = out[0].split('\t'), r = out.find(l => l.startsWith('4\t')).split('\t'), v = k => +r[h.indexOf(k)] || 0; return [v('연말 돈'), v('찻집: 티백 차') + v('찻집: 블렌드') + v('찻집: 레시피 블렌드') + v('카운터 판매')]; };
  const base = y4(sim()), auto = y4(sim('--auto'));
  check(base[0] === 80720 && base[1] === 336900, `기본 4 7: 80,720원 · 찻집 336,900원 그대로 (${base.join(' · ')})`);
  check(auto[1] <= base[1], `--auto(등급 2 · 4 · 6에 데려옴) 4년째 찻집 ${auto[1]}원 ≤ 기본 — 일꾼은 손을 덜 뿐 더 벌지 않음`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
