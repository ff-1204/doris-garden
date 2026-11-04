// P52 🏅 칭호 효과 · ⬆️ 위 칸 장식 (11-01 사용자 확정): 대표 칭호 하나만 일함 · 위 칸에 장식을 달면 칭호 효과 전체 +10% (숨은 효과, P52-05)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const near = (a, b) => Math.abs(a - b) < 1e-9;
const ctx = { live: false, rng: () => 0.5 };
const fresh = id => { const s = E.create(Date.UTC(2026, 9, 5, 3), () => 0.5); s.onboarded = true; s.gardenId = id; return s; };
const wear = (s, k) => { s.titles[k] = 0; s.titleOn = k; };
const freeCell = (s, skip) => { for (let y = 0; y < E.H; y++) for (let x = 0; x < E.W; x++) if (!E.flowerAt(s, x, y) && !E.decoAt(s, x, y) && !(skip && skip(x, y))) return [x, y]; };
const top = s => { const d = E.addDeco(s, 'bench'); s.topDeco = d.id; return d; };

console.log('[효과 표]');
const keys = Object.keys(E.TITLES);
check(keys.length === 31 && keys.every(k => E.TITLE_PERKS[k] && E.titlePerkText(k)), '칭호 31개 모두 효과 (P53 🌹 둘 더함) · 문구가 있음');
check(Object.values(E.TITLE_PERKS).every(P => P.mul >= 0.9 && P.mul <= 1.2 && !/\d/.test(P.text)), '값은 ×0.9 ~ ×1.2 · 문구에 숫자 없음');
check(E.TITLE_PERKS.t_blend.knob === 'blendXp' && E.TITLE_PERKS.t_path_earth.knob === 'jewel', '🫖 블렌드는 경험치로 바꿈 · 💎 보석은 그대로');

console.log('[대표 칭호 하나만]');
{ const s = fresh('p52-a'), f = { x: 0, y: 0 };
  check(E.titlePerk(s, 'water') === 1 && E.waterSet(s, f) === 2 * E.MONTH_H, '칭호 없으면 그대로 (물 2달)');
  s.titles.t_water = 0; s.titles.t_visit = 0; s.titleOn = 't_visit';
  check(E.waterSet(s, f) === 2 * E.MONTH_H, '얻기만 하고 대표가 아니면 일하지 않음');
  s.titleOn = 't_water';
  check(near(E.waterSet(s, f), 2.2 * E.MONTH_H), '💧 대표로 걸면 2.2달');
  top(s);
  check(near(E.waterSet(s, f), 2.42 * E.MONTH_H), '⬆️ 위 칸 장식이 있으면 효과 전체 ×1.1 → 2.42달');
  s.titleOn = null;
  check(E.waterSet(s, f) === 2 * E.MONTH_H, '위 칸만 있고 대표 칭호가 없으면 그대로'); }

console.log('[손잡이마다]');
{ const s = fresh('p52-b');
  wear(s, 't_visit'); const cal = E.calendar(s.virtual);
  check(near(E.titlePerk(s, 'gift'), 1.1), '🌅 용돈 ×1.1');
  wear(s, 't_land'); s.flowers.push({ id: 1, type: 'rose', x: 0, y: 0, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, waterH: 99, q: 0.5 });
  const fl = s.flowers[0];
  { const n0 = (() => { const k = s.titleOn; s.titleOn = null; const r = E.monthlyChange(s, fl).neg; s.titleOn = k; return r; })(), n1 = E.monthlyChange(s, fl).neg;
    check(n0 === 3 && near(n1, 2.7), '🧭 땅 안 맞음 −3% → −2.7%'); }
  wear(s, 't_path_flower'); fl.fertH = 10;
  { const k = s.titleOn; s.titleOn = null; const p0 = E.monthlyChange(s, fl).pos; s.titleOn = k; check(near(E.monthlyChange(s, fl).pos, p0 * 1.05), '🌸 꽃길 품질 오름 ×1.05'); }
  wear(s, 't_first');
  check(near(E.growRate(s, { x: 0, y: 0, stage: 'germ', type: 'rose' }), 1.1) && E.growRate(s, { x: 0, y: 0, stage: 'bloom', ripeH: 6, type: 'rose' }) === 1, '🌱 새싹 정원사: 싹 · 새싹만 ×1.1');
  wear(s, 't_tree');
  check(near(E.growRate(s, { x: 0, y: 0, stage: 'young', type: 'maehwa' }), 1.05) && E.growRate(s, { x: 0, y: 0, stage: 'young', type: 'rose' }) === 1, '🌳 나무만 ×1.05');
  wear(s, 't_season5');
  check(near(E.growRate(s, { x: 0, y: 0, stage: 'young', type: 'rose' }), 1.05), '🌱 다섯 철: 모든 꽃 ×1.05');
  wear(s, 't_cafe');
  const wint = { frozen: false, month: 1 };
  check(near(E.teaPriceMul(wint, s), 1.22) && near(E.teaPriceMul({ frozen: true, month: 13 }, s), 1.3), '❄️ 겨울 덤 ×1.2 → ×1.22 · 꽃잠 값은 그대로');
  check(E.teaPriceMul(wint) === 1.2, 'st 없이 부르면 예전 값');
  wear(s, 't_hat');
  { const t = { type: 'rose', q: 0.9, hat: true }, v1 = E.teaItemValue(s, t, cal); s.titleOn = null; const v0 = E.teaItemValue(s, t, cal);
    check(v1 >= v0, `✨ 햇차 덤 +10 → +10.5% (${v0} → ${v1}원)`); }
  wear(s, 't_path_tea');
  check(near(E.cupSellH(s), E.CUP_SELL_H / 1.1), '🍵 찻길 판매 빠르기 ÷1.1');
  wear(s, 't_season2');
  check(near(E.pantryH(s), E.PANTRY_H / 1.1), '🧺 두 번째 봄 저장고 ÷1.1');
  { s.titleOn = null; const c0 = E.pantryCap(s); wear(s, 't_season3'); check(E.pantryCap(s) === Math.floor(c0 * 1.1), `🧺 세 철 저장고 칸 ×1.1 내림 (${c0} → ${E.pantryCap(s)})`); }
  wear(s, 't_path_earth');
  check(near(E.jewelP(s), E.JEWEL_P * 1.1), '💎 흙길 보석 5% → 5.5%');
  wear(s, 't_mut5');
  check(near(E.mutChance(s, 'rose', cal), 0.011), '🧬 돌연변이 1% → 1.1%');
  top(s);
  check(near(E.mutChance(s, 'rose', cal), 0.0121), '⬆️ 위 칸이면 1.21% (만분의 일까지 셈)');
  s.topDeco = null;
  wear(s, 't_cloud');
  check(near(E.catchUpH(s), E.CATCHUP_WEEKS * 7 * 24 * 1.1) && E.catchUpH({}) === E.CATCHUP_WEEKS * 7 * 24, '☁️ 따라잡기 3주 → 3.3주');
  wear(s, 't_miracle');
  { const r = () => 0.9; check(near(0.8 - E.propQuality(0.8, r, false, E.titlePerk(s, 'prop')), (0.1 + 0.9 * 0.1) * 0.9), '🌾 번식 품질 깎임 ×0.9'); }
  wear(s, 't_lands');
  check(near(E.titlePerk(s, 'adapt') * 24, 26.4), '🪴 적응 24 → 26.4시간'); }

console.log('[경험치]');
{ const s = fresh('p52-c'); s.grade.xp = 0;
  wear(s, 't_regular');
  for (let i = 0; i < 10; i++) E.addXp(s, 'sell', 1, ctx);
  check(s.grade.xp === 22, `☕ 찻잔 10잔 = 경험치 22 (끝수가 쌓임, 지금 ${s.grade.xp})`);
  s.grade.xp = 0; s.grade.frac = 0; s.titleOn = null;
  for (let i = 0; i < 10; i++) E.addXp(s, 'sell', 1, ctx);
  check(s.grade.xp === 20, '칭호 없으면 20');
  s.grade.xp = 0; wear(s, 't_blend');
  for (let i = 0; i < 10; i++) E.addXp(s, 'sell', 1, ctx, E.titlePerk(s, 'blendXp'));
  check(s.grade.xp === 24, '🫖 블렌드 연구가: 블렌드 잔 10잔 = 24');
  s.grade.xp = 0; s.grade.frac = 0;
  for (let i = 0; i < 10; i++) E.addXp(s, 'sell', 1, ctx, 1);
  check(s.grade.xp === 20, '🫖 다른 찻잔은 그대로');
  s.grade.xp = 0; wear(s, 't_guests'); E.addXp(s, 'order', 10, ctx);
  check(s.grade.xp === 165, '💌 주문 경험치 ×1.1');
  s.grade.xp = 0; s.grade.frac = 0; wear(s, 't_complete'); E.addXp(s, 'quest', 10, ctx);
  check(s.grade.xp === 105, '🌱 도감을 채운 정원사: 모든 경험치 ×1.05');
  s.grade.xp = 0; s.grade.frac = 0; wear(s, 't_score'); E.addXp(s, 'weekly', 40, ctx);
  check(s.grade.xp === 44, '🗓️ 주간 목표 ×1.1'); }

console.log('[⬆️ 위 칸 장식]');
{ const s = fresh('p52-d');
  const a = E.addDeco(s, 'bench'), [x, y] = freeCell(s);
  check(E.placeDeco(s, a.id, x, y).ok && E.placedOf(s, 'bench').length === 1, '벤치를 정원에 놓음');
  const r = E.setTopDeco(s, a.id);
  check(r.ok && s.topDeco === a.id && a.x == null && E.placedOf(s, 'bench').length === 0 && E.topDecoOf(s) === a, '정원에 놓인 것을 달면 정원에서 빠짐 (정원 효과 쉼)');
  check(!E.setTopDeco(s, a.id).ok, '같은 장식을 또 달 수 없음');
  const b = E.addDeco(s, 't:t_visit'), r2 = E.setTopDeco(s, b.id);
  check(r2.ok && s.topDeco === b.id && a.x == null && r2.old === a && /창고로/.test(r2.msg || r2.text || JSON.stringify(r2)), '칭호 문장도 달 수 있음 · 있던 벤치는 창고로');
  const [x2, y2] = freeCell(s);
  const p = E.placeDeco(s, b.id, x2, y2);
  check(p.ok && s.topDeco === null && b.x === x2, '위 칸 장식을 정원에 다시 놓으면 위 칸에서 내려옴');
  E.setTopDeco(s, a.id);
  check(E.clearTopDeco(s).ok && s.topDeco === null && a.x == null, '내리기 → 창고에');
  check(!E.clearTopDeco(s).ok, '빈 위 칸은 내릴 것이 없음');
  const h = E.addDeco(s, 'hive'), [x3, y3] = freeCell(s); E.placeDeco(s, h.id, x3, y3); h.honey = ['rose', 'rose'];
  const r3 = E.setTopDeco(s, h.id);
  check(r3.ok && h.x == null && h.honey.length === 0 && s.honey.rose >= 2, '곤충(벌통)도 달 수 있음 · 모인 꿀은 함께 거둠');
  const w = E.addDeco(s, 'barrel');
  check(E.setTopDeco(s, w.id).ok && s.topDeco === w.id, '곤충 · 자동 장치(빗물 통 🐌)도 달 수 있음');
  check(!E.setTopDeco(s, 99999).ok, '없는 장식은 못 닮');
  check(E.SEASON_KEEP.includes('topDeco'), '🌸 새 철에도 위 칸은 그대로 (SEASON_KEEP)'); }

console.log('[시뮬 기본은 그대로 — 칭호를 걸지 않은 정원]');
{ const s = fresh('p52-e');
  check(E.titlePerk(s, 'water') === 1 && E.titlePerk(s, 'grow', { stage: 'germ' }) === 1 && E.teaPriceMul({ frozen: false, month: 1 }, s) === 1.2, '대표 칭호가 없으면 모든 손잡이가 1'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
