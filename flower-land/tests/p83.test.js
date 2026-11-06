// P83 (11-06): ⛏️ 자동 캐기 · 🧺 키우는 도구 만들기 · 사기 · 🪏 옮겨심기 언제나 + 삽
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 2, 2, 6, 0, 0).getTime();
const at = pred => { let t = MON; for (let i = 0; i < 400; i++) { if (pred(E.calendar(t))) return t; t += 6 * H; } throw new Error('날 못 찾음'); };
const garden = (pred, money) => { const s = E.create(at(pred || (c => c.month === 7 && !c.frozen)), () => 0.5); s.gardenId = 'p83-test'; s.onboarded = true; s.money = money == null ? 1e7 : money; return s; };
const ctx = { live: false, rng: () => 0.5 };
const logs = s => s.log.filter(l => l.text.includes('자동 캐기'));
const flower = (s, type, x, y, extra) => { const f = Object.assign({ id: 7000 + s.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'mature', ripeH: 0, bloomed: false, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: 1 }, extra); s.flowers.push(f); return f; };

console.log('[P91-01 값은 한 칸 100원 고정]');
{ const s = garden(); check([1, 10, 19, 20].every(d => E.autoDigWon(s, d) === 100) && E.AUTO_DIG_WON === 100, '층과 상관없이 100원');
  const lamp = garden(); E.placeDeco(lamp, E.addDeco(lamp, 'amberlamp').id, 0, 0); check(E.autoDigWon(lamp, 10) === 100, '🏮 호박 등이 있어도 그대로'); }

console.log('[P91-01 일부러 기대 수입보다 쌈 — 돈으로는 조금 남음 (사용자 결정)]');
for (const depth of [1, 10, 20]) {
  const s = garden(null, 1e9), m = E.mineOf(s); m.depth = m.deepest = depth; m.board = null; E.mineOf(s); m.energy = 0;
  E.mineAutoSet(s, true, ctx, 50000); const m0 = s.money, far = s.virtual + 20 * H; E.advance(s, far, ctx);
  check(s.stats.autoDug === 500 && s.stats.autoPaid === 50000, `${depth}층부터 500칸에 50,000원 — 낸 돈은 정한 돈까지만`);
  console.log(`    ${depth}층부터: 돈 ${(s.money - m0).toLocaleString('ko-KR')}원 (칸마다 ${Math.round((s.money - m0) / 500)}원)`); }

console.log('[P83-01 기력이 찰 때마다 · 꺼 둔 동안에도]');
{ const s = garden(), m = E.mineOf(s); const e0 = m.energy;
  check(!m.auto && E.mineAutoView(s).on === false, '처음엔 꺼져 있음');
  const r = E.mineAutoSet(s, true, ctx, 50000);
  check(r.ok && m.auto && m.energy === 0 && s.stats.autoDug === e0, `켜면 있던 기력 ${e0}칸을 바로 씀`);
  const m0 = s.money, paid0 = s.stats.autoPaid, n0 = s.stats.autoDug;
  E.advance(s, s.virtual + 3 * H, ctx);
  check(s.stats.autoDug - n0 >= 179 && s.stats.autoDug - n0 <= 181, `꺼 둔 3시간 = 약 180칸 (걸음마다 15칸에 막히지 않음) — ${s.stats.autoDug - n0}`);
  check(s.stats.autoPaid > paid0 && s.money !== m0, '칸마다 돈을 냄');
  check(m.deepest > 1 && m.depth === m.deepest, `계단을 찾으면 내려감 — ${m.depth}층`);
  check(E.mineAutoSet(s, false, ctx).ok && !m.auto, '끄면 멈춤');
  const n1 = s.stats.autoDug; E.advance(s, s.virtual + H, ctx);
  check(s.stats.autoDug === n1 && m.energy > 0, '끈 뒤엔 파지 않고 기력만 참'); }

console.log('[P83-01 판을 다 파면 새 판]');
{ const s = garden(), m = E.mineOf(s); m.depth = m.deepest = E.MINE_DEEPEST; m.board = null; E.mineOf(s); const b0 = m.boards; m.energy = 0;
  E.mineAutoSet(s, true, ctx, 50000); E.advance(s, s.virtual + 2 * H, ctx);
  check(m.depth === E.MINE_DEEPEST && m.boards >= b0 + 3, `가장 깊은 층에선 판만 새로 — ${m.boards - b0}판`); }
{ const s = garden(), m = E.mineOf(s); m.board.cells.find(c => c.stairs).dug = true; m.energy = 1;
  E.mineAutoSet(s, true, ctx); check(m.depth === 2, '손으로 찾아 둔 계단이 있으면 그 층을 더 파지 않고 내려감'); }

console.log('[P83-01 돈이 모자라면 멈춤 · 까닭]');
{ const s = garden(null, 700), m = E.mineOf(s); m.energy = 0;
  check(E.mineAutoSet(s, true, ctx).ok && m.auto, '한 칸 값이 있으면 켜짐');
  s.money = 50; const n0 = s.stats.autoDug || 0; E.advance(s, s.virtual + 5 * 60e3, ctx);
  check(!m.auto && m.autoStop === 'money' && E.mineAutoView(s).stop === 'money', '돈이 모자라면 꺼지고 까닭을 남김');
  check((s.stats.autoDug || 0) === n0 && !s.stats.autoPaid && m.energy > 0, `값을 못 내면 파지 않고 돈도 안 나감 · 기력은 참 (${m.energy}칸)`);
  check(logs(s).some(l => l.text.includes('돈이 모자라 자동 캐기를 멈췄어요')), '일지에 까닭');
  s.money = 0; const r = E.mineAutoSet(s, true, ctx);
  check(!r.ok && r.msg.includes('돈이 모자라요') && !m.auto, '돈이 없으면 못 켬');
  s.money = 1e6; check(E.mineAutoSet(s, true, ctx).ok && m.autoStop === null, '다시 켜면 까닭이 지워짐'); }

console.log('[P83-01 일지는 묶어서 한 줄]');
{ const s = garden(), m = E.mineOf(s); E.mineAutoSet(s, true, ctx);
  for (let i = 0; i < 40; i++) E.advance(s, s.virtual + 60e3, ctx);   // 켜 둔 채 1분씩 40번
  const n = logs(s).length, L = m.autoLog;
  check(n <= 1 && L && L.n >= 30, `1분씩 지나는 동안엔 줄이 늘지 않고 모음 (${L && L.n}칸 · ${n}줄)`);
  E.mineAutoSet(s, false, ctx);
  const line = logs(s).pop().text;
  check(/자동 캐기 \d+칸 · [\d,]+원을 냈어요/.test(line) && /(흙|돌) \d+/.test(line), `끌 때 한 줄: ${line}`);
  check(m.autoLog === null, '적은 뒤 비움'); }
{ const s = garden(), m = E.mineOf(s); E.mineAutoSet(s, true, ctx); s.log.length = 0;
  E.advance(s, s.virtual + 5 * H, ctx); const n = logs(s).length;
  check(n >= 1 && n <= 2, `5시간 비운 뒤 한두 줄 (달이 바뀌면 나뉨) — ${n}줄`); }
{ const s = garden(); s.settings.slow = true; if (!E.slowView(s)) s.settings.view = 'slow'; const m = E.mineOf(s); E.mineAutoSet(s, true, ctx); E.mineAutoSet(s, false, ctx);
  const line = logs(s).pop().text;
  check(E.slowView(s) && !/\d원/.test(line) && line.includes('자동 캐기로'), `🐢 느긋하게 보기는 돈 숫자 없이: ${line}`); }

console.log('[P83-01 돈으로 산 일 — 경험치 · 주간 목표 없음]');
{ const s = garden(), m = E.mineOf(s); E.weeklyOf(s); s.weekly.goals = [{ k: 'dig', tier: 0, n: 20, got: 0, done: false }];
  E.mineAutoSet(s, true, ctx); E.advance(s, s.virtual + 10 * 60e3, ctx);
  check(s.stats.autoDug >= 20 && s.stats.dug === s.stats.autoDug, '판 칸 수는 stats.dug에 듦');
  check(!s.grade.frac && !s.grade.by.dig && !s.grade.by.descend && s.weekly.goals[0].got === 0, '파기 · 내려가기 경험치 · 주간 목표는 없음');
  check(Object.keys(m.bag).length > 0, '가방엔 들어옴'); }
{ const s = garden(), m = E.mineOf(s); for (let i = 0; i < 10; i++) E.dig(s, i, ctx); check((s.grade.by.dig || 0) === 1, '손으로 판 칸은 경험치 그대로 (10칸에 1)'); }

console.log('[P83-01 곤충 일꾼과 겹치지 않음]');
{ const s = garden(), m = E.mineOf(s); check(E.autoKeepE(s) === 0, '일꾼이 없으면 기력을 다 씀');
  E.placeDeco(s, E.addDeco(s, 'ladybug').id, 3, 3);
  check(E.autoKeepE(s) === E.AUTO_KEEP_E, '🐞 놓으면 곤충 몫을 남김');
  E.mineAutoSet(s, true, ctx);
  check(m.energy === E.AUTO_KEEP_E, `기력 ${E.AUTO_KEEP_E}칸 남기고 멈춤`);
  const paid = s.stats.autoPaid, n = s.stats.autoDug; s.hoe = 0; delete m.bag.stone; delete m.bag.feldspar;
  flower(s, 'lavender', 3, 4, { weedH: 0 });
  const e0 = m.energy, bug0 = s.stats.bugDig || 0; E.insectCareTick(s, 'ladybug', null, ctx);
  check((s.stats.bugDig || 0) > bug0 && s.stats.autoDug === n && s.stats.autoPaid === paid && m.energy < e0, '곤충이 판 칸은 돈을 내지 않고 자동 캐기 수에도 안 듦'); }

console.log('[P83-02 키우는 도구 여섯 — 재료로 · 사기]');
{ check(E.TOOL_CRAFTS.length === 6 && E.TOOL_CRAFTS.every(k => E.CRAFTS[k] && E.SUPPLIES[k]), '물병 · 비료 · 호미 · 가위 · 바구니 · 삽 모두 CRAFTS + SUPPLIES');
  check(Object.keys(E.SUPPLIES).length === 6 && Object.keys(E.SUPPLIES).every(k => E.TOOL_CRAFTS.includes(k)), '파는 용품은 모두 공방에서 만들 수 있음');
  const WORTH = { dirt: 30, stone: 50, feldspar: 250, quartz: 250, mica: 400 };
  for (const k of E.TOOL_CRAFTS) { const v = Object.entries(E.CRAFTS[k].need).reduce((a, [n, q]) => a + WORTH[n] * q, 0), p = E.SUPPLIES[k].price;
    check(v / p >= 0.75 && v / p <= 1.25, `${E.CRAFTS[k].name} 재료 값 ${v}원 ≈ 사는 값 ${p}원`); }
  const s = garden(); E.mineOf(s).bag = { stone: 12, feldspar: 2, quartz: 1, dirt: 5, mica: 1 };
  const w0 = s.water, b0 = s.basket, v0 = s.shovel, m0 = s.money;
  check(E.craft(s, 'water', ctx).ok && s.water === w0 + 1 && s.mine.bag.stone === 11, '돌 1 → 물병 1개');
  check(E.craft(s, 'basket', ctx).ok && s.basket === b0 + 10 && s.mine.bag.stone === 6 && s.mine.bag.feldspar === 1, '돌 5 · 장석 1 → 바구니 10번');
  check(E.craft(s, 'shovel', ctx).ok && s.shovel === v0 + 10 && s.mine.bag.stone === 1 && s.mine.bag.quartz === 0, '돌 5 · 석영 1 → 삽 10번');
  check(!E.canCraft(s, 'shovel') && !E.craft(s, 'shovel', ctx).ok && s.money === m0, '재료가 모자라면 못 만들고 돈은 그대로');
  check(E.buySupply(s, 'shovel', 1).ok && s.shovel === v0 + 20 && s.money === m0 - 500, '그 카드에서 사기: 삽 500원 · 10번');
  for (const k of E.TOOL_CRAFTS) { const t = garden(null, 1000), n0 = t[k]; check(E.buySupply(t, k, 1).ok && t[k] === n0 + E.SUPPLIES[k].per && t.money === 1000 - E.SUPPLIES[k].price, `${E.SUPPLIES[k].name} 사기`); } }

console.log('[P83-03 옮겨심기 언제나 + 삽]');
{ check(E.SUPPLIES.shovel.per === 10 && E.SUPPLIES.shovel.price === 500, '삽 1개 = 10번 · 500원');
  const s = garden(c => c.month === 7 && !c.frozen); check(s.shovel === 10, '새 정원은 삽 1개(10번)');
  check(!E.FLOWERS.rose.sow.includes(7), '7월은 장미 심는 달이 아님');
  const f = flower(s, 'rose', 3, 3, { adaptH: 0 });
  check(E.canMoveNow(f), '살아 있는 꽃은 언제나');
  const r = E.move(s, f.id, 5, 5, ctx);
  check(r.ok && f.x === 5 && s.shovel === 9 && r.msg.includes('삽 9번'), `심는 달이 아니어도 옮김: ${r.msg}`);
  check(f.adaptH === 24 && f.movedXp === E.calendar(s.virtual).abs, '적응 · 경험치 규칙은 그대로');
  check(!E.move(s, f.id, -1, 0, ctx).ok && s.shovel === 9, '못 옮기면 삽을 안 씀');
  s.shovel = 0; const n = E.move(s, f.id, 6, 6, ctx);
  check(!n.ok && n.msg === E.NO_SHOVEL && n.msg.includes('광산 공방') && n.msg.includes('화원') && f.x === 5, `삽이 없으면 까닭과 안내: ${n.msg}`);
  const w = flower(s, 'lavender', 8, 8, { withered: true }); s.shovel = 5;
  check(!E.canMoveNow(w) && !E.move(s, w.id, 9, 9, ctx).ok && s.shovel === 5, '시든 꽃은 못 옮김'); }
{ const s = garden(c => c.frozen), f = flower(s, 'rose', 3, 3), n = s.shovel;
  check(E.move(s, f.id, 4, 4, ctx).ok && s.shovel === n - 1, '꽃잠에도 삽 1번'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
