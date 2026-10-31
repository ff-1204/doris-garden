// P32 🐝 곤충농장 (10-30): 자동 장치를 곤충 일꾼으로 한 탭에 — 이름만 바뀌고 키 · 값 · 규칙 · 저장은 그대로 (P32-01)
// farmOf 일꾼 6 상태 · 지난달 한 일 · 말 한 줄 · 옛 일지 줄 · awayLast 저장 · 느긋하게 보기 숫자 없음 · 돈은 그대로 (P17-14)
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
  check(E.FARM.length === 6 && E.FARM_KEYS.join() === 'autobasket,dryrack,teahelper,hive,barrel,ladybug', '일꾼 6: 개미 · 누에 · 나비 · 꿀벌 · 달팽이 · 무당벌레');
  check(E.FARM.map(w => w.icon).join('') === '🐜🐛🦋🐝🐌🐞' && new Set(E.FARM.map(w => w.icon)).size === 6, '아이콘이 서로 다름');
  const D = E.DECOS;
  check(D.autobasket.name === '개미 일꾼' && D.dryrack.name === '누에 일꾼' && D.teahelper.name === '나비 일꾼' && D.hive.name === '벌통' && D.barrel.name === '빗물 통', 'DECOS 이름: 개미 · 누에 · 나비 일꾼 · 벌통 · 빗물 통은 그대로');
  check(D.autobasket.price === 12000 && D.autobasket.need === 2 && D.dryrack.price === 18000 && D.dryrack.need === 4 && D.teahelper.price === 30000 && D.teahelper.need === 6 && D.teahelper.one, '값 · 등급 · 하나만 (P38 작게 시작: 등급 2 · 4 · 6)');
  check(D.hive.price === 15000 && D.hive.months.join() === '6,7,8' && D.barrel.price === 25000 && D.barrel.months.join() === '6,7', '벌통 · 빗물 통 값 · 파는 달 그대로');
  check(E.AUTO_Q === 0.9 && E.RACK_N === 1 && E.AUTO_KEYS.join() === 'autobasket,dryrack,teahelper', '규칙 상수 그대로');
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
  check(w.state === 'placed' && w.placed.length === 1 && w.placed[0].x === 5 && w.work === '맡은 꽃 1포기', '놓으면 placed · 자리 · 맡은 꽃 1포기');
  check(W(st, 'dryrack').state === 'locked' && W(st, 'teahelper').when === '정원 등급 6부터 와요', '누에 · 나비는 아직 잠김');
  const h = W(st, 'hive');
  check(h.state === 'locked' && h.when === '6월·7월·8월에 화원에 와요' && h.deco === '벌통' && h.name === '꿀벌', '3월 꿀벌: 여름에 화원에 와요 · 카드 이름 꿀벌 (벌통)');
  const su = garden(c => c.month === 6 && !c.frozen);
  check(W(su, 'hive').state === 'shop' && W(su, 'barrel').state === 'shop', '6월엔 꿀벌 · 달팽이 데려올 수 있음');
  const one = garden(c => c.month === 6 && !c.frozen); one.grade.xp = E.gradeXpAt(12); E.buyDeco(one, 'teahelper', ctx);
  check(W(one, 'teahelper').state === 'stored' && !W(one, 'teahelper').canBuy, '나비 일꾼은 하나만 — 있으면 더 못 데려옴');
}

console.log('[🐞 무당벌레: 사는 게 아님 · 4층이 열리면 auto]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  let w = W(st, 'ladybug');
  check(w.state === 'locked' && w.when === '4층 작은 숲이 열리면 와요' && w.price === undefined, '3층 정원: 잠김 · 조건 안내만');
  st.dex.tea.chamomile = 1; st.stats.dug = 1; st.layers.at[4] = 0; w = W(st, 'ladybug');
  check(w.state === 'auto' && w.work === '달 끝마다 잡초 한 포기', '4층이 열리면 저절로 와 있음 (auto) · P38 1포기부터');
  fl(st, 'chamomile', 2, 2).weedH = 0;
  monthEnd(st); w = W(st, 'ladybug');
  check(w.did === 1 && w.didText === '잡초 1포기' && st.log.some(l => l.text === '무당벌레가 잡초 1포기를 치웠어요'), '달 끝에 잡초 1포기 · 일지 "무당벌레가 …"');
}

console.log('[지난달 한 일 · 말 한 줄]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(9); st.bonus.basket = 5; st.bonusFree = { basket: 6 };   // P38 예전 0단계(8포기)로
  const b = E.buyDeco(st, 'autobasket', ctx).deco; E.placeDeco(st, b.id, 5, 5); fl(st, 'lavender', 5, 6); fl(st, 'lavender', 4, 4);
  const v = E.buyDeco(st, 'barrel', ctx).deco; E.placeDeco(st, v.id, 10, 10); fl(st, 'chamomile', 10, 11).waterH = 1;
  const twin = copy(st);
  check(E.farmOf(st).month === '일꾼들이 이달 끝을 기다려요', '달 끝 전: 기다려요');
  const n = E.basketTick(twin, E.calendar(twin.virtual), ctx);
  monthEnd(st);
  const f = E.farmOf(st), a = f.workers.find(w => w.key === 'autobasket'), r = f.workers.find(w => w.key === 'barrel');
  check(n === 2 && a.did === 2 && a.didText === '꽃잎 2장' && st.stats.autoHarvest === 2, 'basketTick 결과(2장)와 개미 일꾼 지난달 한 일이 같음');
  check(r.did === 1 && r.didText === '꽃 1포기에 물' && st.stats.autoWater === 1, '달팽이(빗물 통) 꽃 1포기에 물');
  check(f.month === '지난달 일꾼들이 🐜 꽃잎 2장 · 🐌 꽃 1포기에 물', `머리 한 줄 ("${f.month}")`);
  check(a.line === E.farmOf(st).workers[0].line && E.FARM[0].lines.includes(a.line), '말 한 줄은 그 달엔 같음 · 3개 중 하나');
  const seen = new Set(); const s2 = copy(st); for (let i = 0; i < 12; i++) { monthEnd(s2); seen.add(W(s2, 'autobasket').line); }
  check(seen.size >= 2, `달이 바뀌면 말도 바뀜 (${seen.size}가지)`);
  monthEnd(st);
  check(W(st, 'autobasket').did === 2 || W(st, 'autobasket').did === 0, '다음 달 끝엔 그달 한 일로 바뀜');
}

console.log('[옛 일지 줄 · 자리를 비운 동안]');
{
  check(E.isAutoLine('자동 수확 바구니가 꽃잎 3장을 거뒀어요') && E.isAutoLine('자동 건조대가 꽃잎 8장을 꽃방에 널었어요') && E.isAutoLine('찻집 일손이 찻잔 2잔을 우렸어요') && E.isAutoLine('숲 바람이 잡초 3포기를 걷어 갔어요'), '예전 저장의 옛 머리말도 자동 줄');
  check(E.autoLineType('자동 수확 바구니가 꽃잎 3장을 거뒀어요') === 18 && E.autoLineType('숲 바람이 잡초를 걷어 갔어요') === 19 && E.autoLineType('나비 일꾼이 찻잔 2잔을 우렸어요') === 13, '옛 · 새 머리말 아이콘 그대로');
  check(!E.isAutoLine('🐜 개미가 왔어요') && !E.isAutoLine('빗물 통이 꽃 3포기에 물을 줬어요'), '다른 줄은 아님');
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
  check(FN === 41 && FN === E.MIGRATIONS.length - 4, 'MIGRATIONS 42번째 (43번째 P36 · 44번째 P37 · 45번째 맨 끝은 P38)');
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
  const st = garden(c => c.month === 6 && !c.frozen); st.dex.tea.chamomile = 1; st.stats.dug = 1; st.layers.at[4] = 0;
  const b = E.buyDeco(st, 'hive', ctx).deco; E.placeDeco(st, b.id, 5, 5); for (const [x, y] of [[4, 4], [5, 4], [6, 4], [4, 6]]) fl(st, 'lavender', x, y);
  fl(st, 'chamomile', 2, 2).weedH = 0;
  monthEnd(st); E.awayKeep(st, { h: 30, lines: [], money: 0 }, 1);
  const on = copy(st); on.settings.slow = true;
  const fo = E.farmOf(st), fs = E.farmOf(on);
  check(fo.workers.find(w => w.key === 'hive').did > 0 && /\d/.test(fo.month), '보통: 숫자 있음');
  check(fs.slow && fs.workers.every(w => w.did === null && w.work === null && w.didText === null && !/\d/.test(w.when) && !/\d/.test(w.line)), '일꾼 카드: 한 일 · 맡은 일 · 조건에 숫자 없음');
  check(fs.month === '지난달에도 일꾼들이 부지런히 일했어요' && fs.catchup.weeks === null && fs.catchup.last.h === null, '머리 · 따라잡기 숫자 없음');
  check(fs.workers.find(w => w.key === 'autobasket').when === '정원이 더 자라면 와요', '등급 조건도 숫자 없이');
  check(JSON.stringify(fs.workers.map(w => [w.key, w.state])) === JSON.stringify(fo.workers.map(w => [w.key, w.state])), '상태는 같음 (보기만 다름)');
}

console.log('[돈 · 규칙 — farmOf는 읽기만]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.grade.xp = E.gradeXpAt(12);
  for (const k of ['autobasket', 'dryrack', 'teahelper', 'hive', 'barrel']) E.buyDeco(st, k, ctx);
  const s0 = JSON.stringify(st); E.farmOf(st); E.farmOf(st);
  check(JSON.stringify(st) === s0, 'farmOf를 불러도 정원이 그대로');
  const a = copy(st), b = copy(st); E.advance(a, a.virtual + 60 * 24 * H, ctx); delete b.farm; E.advance(b, b.virtual + 60 * 24 * H, ctx);
  check(a.money === b.money && a.petals.length === b.petals.length && a.teas.length === b.teas.length, '농장 셈(farm)은 돈 · 꽃잎 · 티백에 영향 없음');
}

console.log(fails ? `\n결과: ${fails}개 실패` : '\n결과: 모두 통과');
