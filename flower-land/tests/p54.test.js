// P54 🌱 정원 등급 경험치를 모든 활동에서 (11-01 사용자 요청 "정원 등급에 대한 경험치 모든 활동에 대한 계산으로 개선해줘")
// 사용자가 고른 것: 조금 빨라짐(부지런한 정원사 20~30%) · 하루 상한 없음 · 도감일지 등급 칸에 활동별 표(grade.by 묶음)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
const ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = MON; for (let i = 0; i < 4 * 24 * 21; i++) { const c = E.calendar(t); if (pred(c)) return t; t += H / 4; } throw new Error('그런 때가 없어요'); };
const APRIL = at(c => c.month === 4 && !c.frozen);
const fresh = (t, id) => { const s = E.create(t || APRIL, () => 0.5); s.onboarded = true; s.gardenId = id || 'p54'; s.grade.dex = E.gradeDexCount(s); return s; };
const by = (s, k) => (s.grade.by && s.grade.by[k]) || 0;
function bloom(s, type, x, y, o) {   // 다 핀 꽃 한 포기 (땅을 그 꽃이 좋아하는 값으로 — 기운 100%)
  const F = E.FLOWERS[type], tl = s.tiles[y * E.W + x]; tl.t = F.t; tl.m = F.m;
  const f = { id: s.nextId++, type, x, y, q: 1, startQ: 1, origin: '화원', parent: null, ageH: 99 * E.MONTH_H, lifeH: 99 * E.MONTH_H, stage: 'bloom', ripeH: 6, bloomed: true, withered: false,
    waterH: 24, weedH: 24, pruneH: 12, fertH: 12, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: E.calendar(s.virtual).abs, propYear: null, propRest: false, plantedYear: 1, ...(o || {}) };
  s.flowers.push(f); return f;
}

console.log('[경험치 표]');
{ const X = E.XP;
  check(X.harvest === 2 && X.sell === 2 && X.order === 15 && X.quest === 10 && X.dex === 5 && X.year === 1 && X.weekly === 1, '예전 일곱 값은 그대로 (쌓인 경험치와 어긋나지 않게)');
  const kinds = E.GRADE_BY.map(r => r[0]), groups = E.GRADE_GROUPS.map(g => g[0]);
  check(Object.keys(X).every(k => kinds.includes(k)) && kinds.every(k => X[k] > 0), '경험치 종류마다 등급 칸 줄이 있음 (GRADE_BY)');
  check(E.GRADE_BY.every(r => groups.includes(r[3])) && groups.every(g => E.GRADE_BY.some(r => r[3] === g)), '줄마다 묶음 하나 · 묶음마다 줄이 있음');
  check(groups.join() === 'care,garden,tea,mine,bug,collect,goal', `묶음 일곱: ${E.GRADE_GROUPS.map(g => g[1] + ' ' + g[2]).join(' · ')}`);
  check(['water', 'weed', 'prune', 'fert', 'plant', 'move', 'prop', 'dry', 'teabag', 'blend', 'dig', 'descend', 'craft', 'bug', 'honey', 'pantry', 'jar', 'pres', 'presSell'].every(k => X[k] > 0), 'P54 새 종류 19가지');
  check(!X.tree && !X.buy && !X.deco && !X.gift && !X.brew, '돈으로 사기만 하는 것(🌳 숲 나무 · 사기 · 장식 · 선물) · 우리기는 없음'); }

console.log('[💧 돌보기 — 한 포기마다, 끝수는 모아서]');
{ const s = fresh(); const fs = [0, 1, 2, 3, 4].map(i => bloom(s, 'rose', 1 + i, 1, { waterH: 0, weedH: 0, pruneH: 0, fertH: 0 }));
  const tiles = fs.map(f => [f.x, f.y]); s.water = 9; s.hoe = 9; s.shears = 9; s.fert = 9;
  const x0 = s.grade.xp;
  check(E.care(s, 'water', tiles, ctx).ok && by(s, 'water') === 1 && s.grade.xp === x0 + 1, `물 5포기 = 1 (0.2씩, ${by(s, 'water')})`);
  E.care(s, 'weed', tiles.slice(0, 2), ctx);
  check(by(s, 'weed') === 0 && s.grade.frac > 0.39 && s.grade.frac < 0.41, '잡초 2포기 = 0.4는 끝수로 (g.frac)');
  E.care(s, 'weed', tiles.slice(2), ctx);
  check(by(s, 'weed') === 1 && s.grade.xp === x0 + 2 && s.grade.frac < 1e-6, '3포기 더 → 끝수가 모여 1');
  E.care(s, 'prune', tiles, ctx); E.care(s, 'fert', tiles, ctx);
  check(by(s, 'prune') === 1 && by(s, 'fert') === 1 && s.grade.xp === x0 + 4, '가지치기 · 비료도 5포기 = 1씩');
  const h0 = by(s, 'harvest'); s.basket = 9; E.care(s, 'harvest', tiles, ctx);
  check(by(s, 'harvest') === h0 + 5 * E.harvestCount(E.FLOWERS.rose, ctx.rng) * E.XP.harvest, 'P77-C 꽃잎 수: 거두기는 예전 그대로 꽃잎 한 장 2 (장미 5포기 × 3장)'); }

console.log('[🌸 꽃밭 — 심기 · 옮겨심기 · 번식]');
{ const s = fresh(); s.money = 99999; E.buy(s, 'rose', 2);
  const [a, b] = s.items.filter(i => i.type === 'rose');
  const r = E.plant(s, a.id, 2, 2, () => 0, ctx);
  check(r.ok && r.flower && by(s, 'plant') === 1, '싹이 튼 심기 +1');
  const r2 = E.plant(s, b.id, 4, 4, () => 1, ctx);
  check(r2.ok && r2.failed && by(s, 'plant') === 1, '싹이 안 튼 씨앗(비료가 됨)은 없음');
  const f = r.flower;
  check(E.move(s, f.id, 3, 3, ctx).ok && by(s, 'move') === 1, '옮겨심기 +1');
  check(E.move(s, f.id, 2, 2, ctx).ok && by(s, 'move') === 1, '같은 정원 달에 같은 꽃을 또 옮기면 없음 (이리저리 옮겨 벌지 않게)');
  const g = bloom(s, 'rose', 6, 6);
  check(E.move(s, g.id, 5, 5, ctx).ok && by(s, 'move') === 2, '다른 꽃은 따로 +1');
  const p = bloom(s, 'rose', 0, 6);
  check(E.propagate(s, p.id, () => 0.5, ctx).ok && by(s, 'prop') === 2, '번식 한 번 +2');
  check(!E.propagate(s, p.id, () => 0.5, ctx).ok && by(s, 'prop') === 2, '못 하면 없음'); }

console.log('[🍵 찻집 · 제다실 — 말리기 · 티백 · 블렌드 · 팔기]');
{ const s = fresh(), cal = E.calendar(s.virtual);
  for (let i = 0; i < 12; i++) s.petals.push({ id: s.nextId++, type: 'rose', q: 0.8, seasonKey: -1 });   // P77-C 널 2장 + 티백 둘(장미 5장씩)
  E.dryPetals(s, s.petals.slice(0, 2).map(p => p.id), ctx);
  check(by(s, 'dry') === 2, '꽃방에 넌 꽃잎 한 장마다 +1');
  E.makeTea(s, s.petals.slice(0, 5).map(p => p.id), ctx); E.makeRaw(s, s.petals.slice(0, 5).map(p => p.id), ctx);
  check(by(s, 'teabag') === 2 && s.petals.length === 0, 'P77-C 꽃잎 수: 생화 · 꽃잎 티백 하나(장미 5장)마다 +1');
  s.petals.push({ id: s.nextId++, type: 'rose', q: 0.8, seasonKey: -1 });
  check(!E.makeTea(s, [s.petals[0].id], ctx).ok && by(s, 'teabag') === 2, 'P77-C 꽃잎 수: 꽃잎이 모자라 못 만들면 없음');
  for (let i = 0; i < 10; i++) s.dried.push({ id: s.nextId++, type: 'rose', q: 0.8 });   // P77-C 티백 하나 · 블렌드 한 몫 (장미 5장씩)
  for (let i = 0; i < 5; i++) s.dried.push({ id: s.nextId++, type: 'hibiscus', q: 0.8 });   // 블렌드 한 몫 (히비스커스 5장 — P79-05 레시피 붉은 여름)
  E.makeTeaDried(s, s.dried.filter(d => d.type === 'rose').slice(0, 5).map(d => d.id), ctx);
  check(by(s, 'teabag') === 3, 'P77-C 꽃잎 수: 말린 꽃잎 티백(장미 5장)도 +1');
  check(E.blend(s, ['rose', 'hibiscus'].map(t => s.dried.find(d => d.type === t).id), ctx).ok && s.dried.length === 0 && by(s, 'blend') === 3, 'P77-C 꽃잎 수: 블렌드 한 잔(꽃 종류마다 petals장) +3');
  const x0 = s.grade.xp; E.bagBlends(s, s.blends.map(b => b.id), ctx);
  check(s.grade.xp === x0, '블렌드 티백 만들기는 없음 (블렌드에 들어 있음)');
  if (E.teaShopOpen(cal)) { E.brew(s, s.teas.map(t => t.id), s.blends.map(b => b.id)); check(s.grade.xp === x0, '우리기는 없음 (팔기에 들어 있음)');
    s.cups.forEach(c => delete c.steepUntil); /* P56 3분 우림 끝 */ const n = s.cups.length, sell0 = by(s, 'sell'); E.sellCups(s, s.cups.map(c => c.id), ctx); check(by(s, 'sell') === sell0 + n * E.XP.sell, '판 잔은 예전 그대로 2'); } }

console.log('[⛏️ 광산 — 파기 · 내려가기 · 만들기]');
{ const s = fresh(), m = E.mineOf(s); m.energy = 10;
  for (let i = 0; i < 10; i++) E.dig(s, m.board.cells.findIndex(c => !c.dug), ctx);
  check(by(s, 'dig') === 1, `10칸 파면 +1 (0.1씩, ${by(s, 'dig')})`);
  m.board.cells[0].dug = true; m.board.cells[0].stairs = true;
  check(E.descend(s, ctx).ok && by(s, 'descend') === 2, '한 층 내려가면 +2');
  m.bag = { stone: 3, feldspar: 1 };
  check(E.craft(s, 'hoe', ctx).ok && by(s, 'craft') === 2, '재료로 만들기 +2');
  check(!E.craft(s, 'hoe', ctx).ok && by(s, 'craft') === 2, '재료가 모자라 못 만들면 없음');
  s.money = 99999; const x0 = s.grade.xp;
  check(E.workshopBuy(s, 'oldpot', ctx).ok && s.grade.xp === x0, '💰 공방에서 돈으로 사면 없음'); }

console.log('[🐝 곤충 — 🐜 거둔 꽃잎 · 꿀 · 저장고]');
{ const s = fresh(); bloom(s, 'rose', 2, 2); bloom(s, 'rose', 3, 2);
  s.decos.push({ id: s.nextId++, key: 'autobasket', x: 2, y: 3 });
  const h0 = by(s, 'harvest'), n = E.basketTick(s, E.calendar(s.virtual), ctx);
  check(n === 2 * E.antCount(ctx.rng) && by(s, 'bug') === n * E.XP.harvest && by(s, 'harvest') === h0, `P77-C 꽃잎 수: 🐜 장미 2포기 × 3장 · 거둔 꽃잎은 꽃잎 한 장 2 그대로 · 묶음만 곤충 (${n}장)`);
  const hive = { id: s.nextId++, key: 'hive', x: 6, y: 6, honey: ['rose', 'rose', 'lavender'] }; s.decos.push(hive);
  check(E.takeHoney(s, hive.id, ctx).ok && by(s, 'honey') === 3, '꿀 한 병마다 +1');
  { const b0 = by(s, 'pantry'); s.onboarded = true; E.pantryOf(s).h = 0; E.advance(s, s.virtual + 6.2 * E.HOUR, ctx); check(by(s, 'pantry') === b0 + 1, '🧺 작은 것을 받은 진행 한 번에 +1 (받은 수와 상관없이, P90)'); }
  const t = fresh(), f = bloom(t, 'rose', 2, 2, { waterH: 0 }); t.decos.push({ id: t.nextId++, key: 'barrel', x: 2, y: 3 }); const x0 = t.grade.xp;
  f.waterH = 0; for (const [x, y] of [[1, 2], [3, 2], [1, 3], [3, 3], [1, 4], [2, 4], [3, 4]]) bloom(t, 'rose', x, y, { waterH: 0 });   // 🐌 둘레 8칸 모두 목마른 꽃 (8 × 0.2 = 1.6)
  E.insectTick(t, E.calendar(t.virtual), ctx);
  check(f.waterH > 0 && t.grade.by.water == null && t.grade.by.bugCare >= 1 && t.grade.xp - x0 === t.grade.by.bugCare, `🐌 곤충이 준 물도 0.2씩 — 묶음은 🐝 곤충 「곤충 돌보기」 (P54-02, ${t.grade.by.bugCare})`);
  check(E.GRADE_BY.some(r => r[0] === 'bugCare' && r[3] === 'bug'), '도감일지 표에 🐞 곤충 돌보기 줄'); }

console.log('[📖 수집 — 🫙 유리 관 · 🌹 프리저브드]');
{ const s = fresh(); const f = bloom(s, 'rose', 2, 2);
  E.mutDev(s, ctx);
  check(E.jarCapture(s, f.id, ctx).ok && by(s, 'jar') === 5, '🫙 유리 관에 담기 +5');
  const g = bloom(s, 'rose', 3, 3); s.presol = 1;
  check(E.preserve(s, g.id, ctx).ok && by(s, 'pres') === 5, '🌹 프리저브드 만들기 +5');
  s.preserved = [{ id: s.nextId++, type: 'rose', mut: false }, { id: s.nextId++, type: 'chamomile', mut: false }];
  check(E.sellPreserved(s, s.preserved.map(p => p.id), ctx).ok && by(s, 'presSell') === 4, '🌹 팔기 한 개마다 +2'); }

console.log('[💰 돈으로 사기만 하는 것은 없음]');
{ const s = fresh(); s.money = 999999; const x0 = s.grade.xp;
  E.buy(s, 'rose', 1); E.buySupply(s, 'water', 1); const d = E.buyDeco(s, E.decoOffer(E.calendar(s.virtual))[0], ctx);
  if (d && d.deco) { E.placeDeco(s, d.deco.id, 5, 5); E.storeDeco(s, d.deco.id); E.placeDeco(s, d.deco.id, 6, 6); }
  E.sendGift(s, E.GIFT_KEYS[0], ctx);
  check(s.grade.xp === x0 && !s.grade.frac, '씨앗 · 용품 · 장식 사기 · 장식 놓기 · 선물은 그대로'); }

console.log('[🏅 칭호 효과 — 새 종류에도]');
{ const s = fresh(); s.titles = s.titles || {}; s.titles.t_complete = 1; s.titleOn = 't_complete';
  const fs = []; for (let i = 0; i < 10; i++) fs.push(bloom(s, 'rose', i % 7, 1 + Math.floor(i / 7), { waterH: 0 }));
  s.water = 20; E.care(s, 'water', fs.map(f => [f.x, f.y]), ctx);
  check(by(s, 'water') === 2 && Math.abs(s.grade.frac - 0.1) < 1e-6, `「정원을 다 채운 사람」 ×1.05: 물 10포기 = 2.1 → 2 + 끝수 0.1 (${by(s, 'water')} · ${s.grade.frac.toFixed(2)})`);
  E.TITLE_PERKS.t_test = { knob: 'xp:dig', mul: 2, text: '' }; s.titleOn = 't_test';
  const m = E.mineOf(s); m.energy = 10; for (let i = 0; i < 5; i++) E.dig(s, m.board.cells.findIndex(c => !c.dug), ctx);
  check(by(s, 'dig') === 1, '\'xp:종류\' 손잡이는 새 종류(xp:dig)에도 그대로 일함 (0.1 × 2 × 5 = 1)');
  delete E.TITLE_PERKS.t_test;
  s.titleOn = 't_regular'; const f0 = s.grade.frac, x0 = s.grade.xp; m.energy = 10; for (let i = 0; i < 10; i++) E.dig(s, m.board.cells.findIndex(c => !c.dug) < 0 ? (E.freshBoard(s), 0) : m.board.cells.findIndex(c => !c.dug), ctx);
  check(s.grade.xp + s.grade.frac - x0 - f0 > 0.99 && s.grade.xp + s.grade.frac - x0 - f0 < 1.01, '다른 칭호(☕ 찻잔 팔기)는 새 종류에 닿지 않음'); }

console.log('[📔 등급 칸 — 묶음 표 (gradeView)]');
{ const s = fresh(); s.grade.by = {}; s.grade.xp = 0;
  E.addXp(s, 'harvest', 10, ctx); E.addXp(s, 'water', 15, ctx); E.addXp(s, 'teabag', 4, ctx); E.addXp(s, 'dig', 30, ctx); E.addXp(s, 'quest', 1, ctx); E.addXp(s, 'honey', 2, ctx); E.addXp(s, 'pres', 1, ctx);
  const v = E.gradeView(s), G = Object.fromEntries(v.groups.map(g => [g.k, g]));
  check(v.groups.length === 7 && v.groups.every(g => g.ic && g.label), '묶음 일곱 줄은 늘 (0이어도)');
  check(G.care.xp === 3 && G.garden.xp === 20 && G.tea.xp === 4 && G.mine.xp === 3 && G.bug.xp === 2 && G.collect.xp === 5 && G.goal.xp === 10, `묶음 합: ${v.groups.map(g => `${g.label} ${g.xp}`).join(' · ')}`);
  check(v.groups.reduce((a, g) => a + g.xp, 0) === s.grade.xp, '묶음 합 = 경험치 전체');
  check(G.care.items.map(i => i.k).join() === 'water' && G.mine.items.length === 1 && !G.goal.items.some(i => i.k === 'weekly'), '묶음 안 줄은 받은 것만');
  check(v.sources.slice(0, 6).map(x => x.label).join() === '거두기,팔기,주문,퀘스트,도감,한 해 평가' && v.sources.some(x => x.k === 'water'), '예전 sources 줄 · 순서 그대로 + 새 종류는 생기면');
  s.settings.slow = true; const w = E.gradeView(s);
  check(w.slow === true && w.groups.length === 7, '🐢 느긋하게 보기: slow · 묶음은 그대로 (숫자는 화면이 숨김)');
  const t = fresh(); t.settings.slow = true; t.water = 9; const f = bloom(t, 'rose', 2, 2, { waterH: 0 }); for (let i = 0; i < 5; i++) { f.waterH = 0; E.care(t, 'water', [[2, 2]], ctx); }
  check(by(t, 'water') === 1, '🐢 느긋하게 보기여도 똑같이 쌓임'); }

console.log('[💾 저장 · 불러오기]');
{ const s = fresh(); E.addXp(s, 'dig', 13, ctx); E.addXp(s, 'blend', 2, ctx);
  const back = E.migrateSave(E.parseSave(JSON.stringify(E.makeSave(s, 1))).data.game);
  check(back.grade.by.dig === 1 && back.grade.by.blend === 6 && Math.abs(back.grade.frac - 0.3) < 1e-6 && back.grade.xp === s.grade.xp, '새 종류 · 끝수가 저장에 그대로 (새 저장 필드 없음 — 이음 없이)'); }

console.log('[시뮬 (sim-economy 4 7) — 부지런한 정원사 20~30% 빨리]');
{ const out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7'], { encoding: 'utf8' });
  const line = (/등급 닿은 때\(해\): ([^\n]*)/.exec(out) || [])[1] || '', reach = Object.fromEntries(line.split(' · ').map(x => x.split(' ').map(Number)));
  const r25 = reach[25] / 3.65;   // P54 전 25등급 3.65해 · 26등급 3.86해(4년 끝)
  check(Math.abs(reach[25] - 1.19) < 0.05, `P77-C 꽃잎 수: 25등급에 닿는 때 ${reach[25]}해 (P54 전 3.65해의 ${Math.round(r25 * 100)}% — 손 수확이 한 번에 1 ~ petals장이라 거두기 경험치가 늘어 1.12해 · P90 작은 것이 핀 꽃을 대신 거둬 1.19해) (P72-01 1.38해 · P54 2.65해)`);
  const y4 = out.split('주마다 정원 등급')[1].split('\n').find(l => l.startsWith('4\t')).split('\t');
  check(+y4[1] > 26, `4년 끝 등급 ${y4[1]} (P54 전 26)`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
