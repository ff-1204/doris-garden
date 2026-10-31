// P32 🐝 곤충농장 (10-30): 자동 장치를 곤충 일꾼으로 한 탭에 — 이름만 바뀌고 키 · 값 · 규칙 · 저장은 그대로 (P32-01)
// farmOf 일꾼 6 상태 · 지난달 한 일 · 말 한 줄 · 옛 일지 줄 · awayLast 저장 · 느긋하게 보기 숫자 없음 · 돈은 그대로 (P17-14)
// P39 (10-31): 곤충 7 — 모두 꽃을 돕고 곤충농장에서 언제든 · 한 종류에 하나 (데려오는 차례 P39-10). 곤충 일 규칙은 insects.test.js
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'farm-test'; st.money = 1e6; return st; };   // 첫 안내 전 — 🧺 저장고가 핀 꽃을 먼저 거두지 않게
const fl = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, harvestKey: -1, origin: '씨앗' }; st.flowers.push(f); return f; };
const monthEnd = st => E.advance(st, E.calendar(st.virtual).slotEnd + 0.2 * H, ctx);
const W = (st, k) => E.farmOf(st).workers.find(w => w.key === k);

console.log('[🐜 일꾼 표 — 이름만 바뀜 (키 · 값 · 조건 그대로)]');
{
  check(E.FARM.length === 7 && E.FARM_KEYS.join() === 'barrel,autobasket,ladybug,earthworm,dryrack,hive,teahelper', 'P39 곤충 7: 달팽이 · 개미 · 무당벌레 · 지렁이 · 누에 · 꿀벌 · 나비 (데려오는 차례)');
  check(E.FARM.map(w => w.icon).join('') === '🐌🐜🐞🪱🐛🐝🦋' && new Set(E.FARM.map(w => w.icon)).size === 7, '아이콘이 서로 다름');
  check(E.FARM.every(w => E.DECOS[w.key].insect && E.DECOS[w.key].one && E.DECOS[w.key].months.length === 14), '모두 곤충 · 하나만 · 언제든 (P39-10)');
  const D = E.DECOS;
  check(D.autobasket.name === '개미 일꾼' && D.dryrack.name === '누에 일꾼' && D.teahelper.name === '나비 일꾼' && D.hive.name === '벌통' && D.barrel.name === '빗물 통', 'DECOS 이름: 개미 · 누에 · 나비 일꾼 · 벌통 · 빗물 통은 그대로');
  const need = E.FARM.map(w => `${D[w.key].need}·${D[w.key].price}`).join(' ');
  check(need === '2·10000 2·12000 3·12000 4·15000 5·15000 6·15000 8·30000', `등급 · 값 P39-10 표대로 (${need})`);
  check(E.AUTO_Q === 0.9 && E.SHELF_N === 4 && E.TEASTAND_KEEP === 2 && E.AUTO_KEYS.join() === 'hive,barrel,autobasket,dryrack,teahelper,earthworm,ladybug,dryshelf,teastand', '규칙 상수 · 🧺 선반 4장 · 🫖 +2잔');
  check(E.FARM.every(w => w.lines.length === 3 && w.lines.every(l => !/\d/.test(l))), '말 한 줄은 3개씩 · 숫자 없음');
}

console.log('[🐜 상태: locked → shop → stored → placed]');
{
  const st = garden(c => c.month === 3 && !c.frozen);
  let w = W(st, 'autobasket');
  check(w.state === 'locked' && w.when === '정원 등급 2부터 와요' && !w.canBuy, '등급 2 전: 잠김 · "정원 등급 2부터 와요"');
  st.grade.xp = E.gradeXpAt(2); w = W(st, 'autobasket');
  check(w.state === 'shop' && w.canBuy && w.price === 12000, '등급 2: 데려올 수 있음 (shop)');
  const r = E.buyDeco(st, 'autobasket', ctx); w = W(st, 'autobasket');
  check(r.ok && w.state === 'stored' && w.storedId === r.deco.id && st.money === 1e6 - 12000, '사면 창고에 (stored) — buyDeco 그대로');
  E.placeDeco(st, r.deco.id, 5, 5); fl(st, 'chamomile', 5, 6); fl(st, 'chamomile', 9, 9); w = W(st, 'autobasket');
  check(w.state === 'placed' && w.placed.length === 1 && w.placed[0].x === 5 && w.work === '둘레 1칸 · 핀 꽃 1포기 거두기' && w.r === 1, '놓으면 placed · 자리 · "둘레 1칸 · 핀 꽃 1포기 거두기" (P39-12-01)');
  check(W(st, 'dryrack').state === 'locked' && W(st, 'teahelper').when === '정원 등급 8부터 와요', '누에 · 나비는 아직 잠김');
  const h = W(st, 'hive');
  check(h.state === 'locked' && h.when === '정원 등급 6부터 와요' && h.deco === '벌통' && h.name === '꿀벌', '3월 꿀벌: 등급 6부터 · 카드 이름 꿀벌 (벌통)');
  check(W(st, 'barrel').state === 'shop' && W(st, 'barrel').price === 10000, '3월에도 달팽이 데려올 수 있음 (언제든 · P39-10)');
  const one = garden(c => c.month === 6 && !c.frozen); one.grade.xp = E.gradeXpAt(12); E.buyDeco(one, 'teahelper', ctx);
  check(W(one, 'teahelper').state === 'stored' && !W(one, 'teahelper').canBuy && W(one, 'hive').canBuy, '나비는 하나만 — 있으면 더 못 데려옴 · 다른 곤충은 그대로');
  const many = garden(c => c.month === 6 && !c.frozen); many.decos.push({ id: 1, key: 'autobasket', x: 1, y: 1 }, { id: 2, key: 'autobasket', x: 9, y: 9 });
  check(W(many, 'autobasket').placed.length === 2 && !W(many, 'autobasket').canBuy, '이미 여럿 가진 정원은 그대로 둠 · 더는 못 데려옴');
}

console.log('[🐞 무당벌레 · 🪱 지렁이: 놓는 곤충 (P39-05 · 08)]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(4);
  for (const k of ['ladybug', 'earthworm']) { const d = E.buyDeco(st, k, ctx).deco; E.placeDeco(st, d.id, k === 'ladybug' ? 2 : 10, 2); }
  const a = fl(st, 'chamomile', 2, 3); a.weedH = 0; const b = fl(st, 'chamomile', 10, 3);
  check(W(st, 'ladybug').work === '둘레 1칸 · 꽃 1포기의 잡초' && W(st, 'earthworm').work === '둘레 1칸 · 꽃 1포기에 비료', '맡은 일 한 줄');
  monthEnd(st);
  const L = W(st, 'ladybug'), R = W(st, 'earthworm');
  check(L.did === 1 && L.didText === '꽃 1포기 잡초' && a.weedH > 20, '달 끝에 잡초 · 지난달 한 일');
  for (let i = 0; i < 3 && !(st.stats.autoFert > 0); i++) monthEnd(st);
  check(st.stats.autoFert === 1 && W(st, 'earthworm').didText === '꽃 1포기에 비료', '🪱 석 달에 한 번 일한 달엔 "꽃 1포기에 비료"');
}

console.log('[지난달 한 일 · 말 한 줄]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(9);
  const b = E.buyDeco(st, 'autobasket', ctx).deco; E.placeDeco(st, b.id, 5, 5); fl(st, 'lavender', 5, 6); fl(st, 'lavender', 4, 4);
  const v = E.buyDeco(st, 'barrel', ctx).deco; E.placeDeco(st, v.id, 10, 10); fl(st, 'chamomile', 10, 11).waterH = 1;
  const twin = copy(st);
  check(E.farmOf(st).month === '곤충들이 이달 끝을 기다려요', '달 끝 전: 기다려요');
  const n = E.basketTick(twin, E.calendar(twin.virtual), ctx);
  monthEnd(st);
  const f = E.farmOf(st), a = f.workers.find(w => w.key === 'autobasket'), r = f.workers.find(w => w.key === 'barrel');
  check(n === 2 && a.did === 2 && a.didText === '꽃잎 2장' && st.stats.autoHarvest === 2, 'basketTick 결과(2장)와 개미 일꾼 지난달 한 일이 같음');
  check(r.did === 1 && r.didText === '꽃 1포기에 물' && st.stats.autoWater === 1, '달팽이(빗물 통) 꽃 1포기에 물');
  check(f.month === '지난달 곤충들이 🐌 꽃 1포기에 물 · 🐜 꽃잎 2장', `머리 한 줄 ("${f.month}")`);
  check(a.line === E.farmOf(st).workers[1].line && E.FARM[1].lines.includes(a.line), '말 한 줄은 그 달엔 같음 · 3개 중 하나');
  const seen = new Set(); const s2 = copy(st); for (let i = 0; i < 12; i++) { monthEnd(s2); seen.add(W(s2, 'autobasket').line); }
  check(seen.size >= 2, `달이 바뀌면 말도 바뀜 (${seen.size}가지)`);
  monthEnd(st);
  check(W(st, 'autobasket').did === 2 || W(st, 'autobasket').did === 0, '다음 달 끝엔 그달 한 일로 바뀜');
}

console.log('[옛 일지 줄 · 자리를 비운 동안]');
{
  check(E.isAutoLine('자동 수확 바구니가 꽃잎 3장을 거뒀어요') && E.isAutoLine('자동 건조대가 꽃잎 8장을 꽃방에 널었어요') && E.isAutoLine('찻집 일손이 찻잔 2잔을 우렸어요') && E.isAutoLine('숲 바람이 잡초 3포기를 걷어 갔어요'), '예전 저장의 옛 머리말도 자동 줄');
  check(E.autoLineType('자동 수확 바구니가 꽃잎 3장을 거뒀어요') === 18 && E.autoLineType('숲 바람이 잡초를 걷어 갔어요') === 20 && E.autoLineType('나비 일꾼이 찻잔 2잔을 우렸어요') === 13 && E.autoLineType('누에 일꾼이 꽃잎 8장을 꽃방에 널었어요') === 12, '옛 머리말 아이콘 (P39: 곤충 돌봄 줄은 🐝 20 · 옛 누에 말리기 🍂 · 나비 차 ☕)');
  check(E.isAutoLine('빗물 통이 꽃 3포기에 물을 줬어요') && E.isAutoLine('달팽이가 꽃 3포기에 물을 줬어요') && E.isAutoLine('지렁이가 꽃 2포기의 흙을 기름지게 했어요'), 'P39 곤충 돌봄 줄 · 옛 빗물 통 줄도 묶임');
  check(!E.isAutoLine('🐜 개미가 왔어요'), '다른 줄은 아님');
  check(E.autoAwayLines(garden(c => c.month === 6), { autoHarvest: 0 }).length === 0, '한 일이 없으면 줄 없음');
}

console.log('[🌙 awayLast — 지난번 자리를 비운 동안 다시 보기]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  check(st.awayLast === null && E.farmOf(st).catchup.last === null && E.farmOf(st).catchup.weeks === 3, '새 정원: 다시 볼 것 없음 · 따라잡기 3주');
  const lines = Array.from({ length: 60 }, (_, i) => ({ type: 9, text: `줄 ${i}`, extra: 'x' }));
  E.awayKeep(st, { h: 30, lines, money: 1200, long: null, thirsty: 3, energy: 5 }, 12345);
  check(st.awayLast.lines.length === E.AWAY_LAST_MAX && st.awayLast.lines[0].text === '줄 10' && !('extra' in st.awayLast.lines[0]), '최근 50줄만 · 줄은 type · text만');
  check(st.awayLast.h === 30 && st.awayLast.money === 1200 && st.awayLast.at === 12345 && !('thirsty' in st.awayLast), '시간 · 돈 · 저장 때만 (목마른 꽃 · 기력은 다시 볼 때 새로)');
  check(E.farmOf(st).catchup.last.n === 50 && E.farmOf(st).catchup.last.h === 30, 'farmOf catchup.last');
  check(E.awayKeep(st, null, 1) === null && st.awayLast.h === 30, '비운 게 아니면 그대로');
  const r = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const back = r.ok && E.migrateSave(r.data.game);
  check(back && back.awayLast.lines.length === 50 && back.awayLast.money === 1200, '파일로 저장해 열어도 그대로');
  check(E.SEASON_KEEP.includes('awayLast') && E.SEASON_KEEP.includes('farm'), '새 철에도 이어짐 (SEASON_KEEP)');
}

console.log('[예전 정원 — MIGRATIONS 42번째]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(6);
  const b = E.buyDeco(st, 'autobasket', ctx).deco; E.placeDeco(st, b.id, 5, 5); fl(st, 'lavender', 5, 6);
  st.stats.autoHarvest = 40; st.log.push({ y: 1, m: 6, d: 1, type: 18, text: '자동 수확 바구니가 꽃잎 40장을 거뒀어요' });
  const FN = E.MIGRATIONS.findIndex(m => m[0].includes('awayLast'));
  check(FN === 41 && FN === E.MIGRATIONS.length - 6, 'MIGRATIONS 42번째 (43번째 P36 · 44번째 P37 · 45번째 P38 · 46번째 P39 · 47번째 맨 끝 P40)');
  const old = copy(st); delete old.awayLast; delete old.farm; old.mig = FN;
  const om = E.migrateSave(old);
  check(om.awayLast === null && om.farm.mark.autoHarvest === 40 && om.farm.last === null && om.mig === E.MIGRATIONS.length, '예전 정원: awayLast null · 지금 셈을 표시로');
  check(om.decos.find(d => d.key === 'autobasket').x === 5 && om.stats.autoHarvest === 40 && om.log.some(l => l.text.startsWith('자동 수확 바구니가')), '장식 자리 · 통계 · 옛 일지 줄 그대로');
  check(E.decoInfo('autobasket').name === '개미 일꾼', '불러온 장식은 새 이름으로 보임');
  monthEnd(om);
  check(W(om, 'autobasket').did === 1, '보정 뒤 첫 달 끝: 예전 40장을 지난달로 세지 않고 1장만');
}

console.log('[🐢 느긋하게 보기 — 숫자 없이]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.dex.tea.chamomile = 1; st.stats.dug = 1; st.layers.at[4] = 0; st.grade.xp = E.gradeXpAt(6);
  const b = E.buyDeco(st, 'hive', ctx).deco; E.placeDeco(st, b.id, 5, 5); for (const [x, y] of [[4, 4], [5, 4], [6, 4], [4, 6]]) fl(st, 'lavender', x, y);
  fl(st, 'chamomile', 2, 2).weedH = 0;
  monthEnd(st); E.awayKeep(st, { h: 30, lines: [], money: 0 }, 1);
  const on = copy(st); on.settings.slow = true;
  const fo = E.farmOf(st), fs = E.farmOf(on);
  check(fo.workers.find(w => w.key === 'hive').did > 0 && /\d/.test(fo.month), '보통: 숫자 있음');
  check(fs.slow && fs.workers.every(w => w.did === null && !/\d/.test(w.work || '') && w.didText === null && !/\d/.test(w.when) && !/\d/.test(w.line)), '일꾼 카드: 한 일 · 맡은 일 · 조건에 숫자 없음');
  check(fs.workers.find(w => w.key === 'hive').work === '둘레 꽃의 씨앗이 튼튼해요', '🐢 맡은 일은 숫자 없는 말 (P39-12-01)');
  check(fs.month === '지난달에도 곤충들이 부지런히 일했어요' && fs.catchup.weeks === null && fs.catchup.last.h === null, '머리 · 따라잡기 숫자 없음');
  check(fs.workers.find(w => w.key === 'autobasket').when === '정원이 더 자라면 와요', '등급 조건도 숫자 없이');
  check(JSON.stringify(fs.workers.map(w => [w.key, w.state])) === JSON.stringify(fo.workers.map(w => [w.key, w.state])), '상태는 같음 (보기만 다름)');
}

console.log('[돈 · 규칙 — farmOf는 읽기만]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(12);
  for (const k of E.FARM_KEYS) E.buyDeco(st, k, ctx);
  const s0 = JSON.stringify(st); E.farmOf(st); E.farmOf(st);
  check(JSON.stringify(st) === s0, 'farmOf를 불러도 정원이 그대로');
  const a = copy(st), b = copy(st); E.advance(a, a.virtual + 60 * 24 * H, ctx); delete b.farm; E.advance(b, b.virtual + 60 * 24 * H, ctx);
  check(a.money === b.money && a.petals.length === b.petals.length && a.teas.length === b.teas.length, '농장 셈(farm)은 돈 · 꽃잎 · 티백에 영향 없음');
}

console.log(fails ? `\n결과: ${fails}개 실패` : '\n결과: 모두 통과');
