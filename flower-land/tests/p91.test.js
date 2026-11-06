// P91 (11-06): ⛏️ 자동 캐기 쓸 돈 — 정한 돈보다 더 나가지 않음
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 2, 2, 6, 0, 0).getTime();
const at = pred => { let t = MON; for (let i = 0; i < 400; i++) { if (pred(E.calendar(t))) return t; t += 6 * H; } throw new Error('날 못 찾음'); };
const ctx = { live: false, rng: () => 0.5 };
const garden = money => { const s = E.create(at(c => c.month === 7 && !c.frozen), () => 0.5); s.gardenId = 'p91-test'; s.onboarded = true; s.money = money == null ? 1e7 : money; return s; };
const logs = s => s.log.filter(l => l.text.includes('자동 캐기'));

console.log('[P91-02 쓸 돈 고르기]');
{ check(E.AUTO_BUDGET === 10000 && E.AUTO_BUDGETS.map(b => b.won).join() === '5000,10000,50000', '기본 10,000원 · 5,000 · 10,000 · 50,000원');
  const s = garden(), m = E.mineOf(s); m.energy = 3; E.mineAutoSet(s, true, ctx);
  const v = E.mineAutoView(s); check(v.on && v.left === 9700 && v.spent === 300 && v.price === 100, '기본 10,000원 · 남은 돈 · 쓴 돈이 보임');
  const t = garden(), n = E.mineOf(t); n.energy = 0; E.mineAutoSet(t, true, ctx, 12345); check(n.autoBudget === 10000, '목록에 없는 값은 기본으로');
  E.mineAutoSet(t, false, ctx); check(!n.auto && n.autoBudget === 0, '끄면 남은 돈은 비움 (다시 켤 때 또 정함)'); }

console.log('[P91-04 꺼 둔 시간이 길어도 넘지 않음]');
for (const [won, hours] of [[5000, 24], [10000, 24 * 7], [50000, 24 * 21]]) {
  const s = garden(), m = E.mineOf(s); m.energy = 0; E.mineAutoSet(s, true, ctx, won);
  E.advance(s, s.virtual + hours * H, ctx);
  check(s.stats.autoPaid === won && s.stats.autoDug === won / 100 && !m.auto && m.autoStop === 'budget' && m.autoBudget === 0 && m.autoSpent === won, `${won.toLocaleString('ko-KR')}원 · 꺼 둔 ${hours}시간 → 낸 돈 ${s.stats.autoPaid.toLocaleString('ko-KR')}원에서 꺼짐`); }
{ const s = garden(), m = E.mineOf(s); m.energy = 0; E.mineAutoSet(s, true, ctx, 5000); s.speed = 60;
  for (let i = 0; i < 300; i++) E.advance(s, s.virtual + H / 2, ctx);
  check(s.stats.autoPaid === 5000 && !m.auto, `빠른 시간 재생(st.speed 60)에서도 5,000원까지만 — ${s.stats.autoPaid}`); }
{ const s = garden(), m = E.mineOf(s); m.energy = 15; E.mineAutoSet(s, true, ctx, 5000); check(s.stats.autoPaid === 1500 && m.energy === 0, '켜자마자 있던 기력만큼'); }

console.log('[P91-02 다 쓰면 까닭]');
{ const s = garden(), m = E.mineOf(s); m.energy = 0; E.mineAutoSet(s, true, ctx, 5000); E.advance(s, s.virtual + 3 * H, ctx);
  check(E.mineAutoView(s).stop === 'budget' && E.mineAutoView(s).spent === 5000, '화면이 까닭 · 쓴 돈을 읽음');
  check(logs(s).some(l => l.text.includes('정한 돈을 다 써서 자동 캐기를 멈췄어요') && l.text.includes('5,000원을 냈어요')), '일지 한 줄에 까닭');
  const e0 = m.energy; E.advance(s, s.virtual + H, ctx); check(s.stats.autoPaid === 5000 && m.energy >= e0, '멈춘 뒤엔 기력만 참');
  m.energy = 0; const r = E.mineAutoSet(s, true, ctx, 5000); check(r.ok && m.auto && m.autoStop === null && m.autoSpent === 0 && m.autoBudget === 5000, '다시 켜면 쓴 돈을 새로 셈'); }
{ const s = garden(250), m = E.mineOf(s); m.energy = 0; E.mineAutoSet(s, true, ctx, 5000); s.money = 250; E.advance(s, s.virtual + 10 * 60e3, ctx);
  check(m.autoStop === 'money' && !m.auto && s.stats.autoPaid <= 250 + 1000, `돈이 모자라 멈추는 것도 그대로 — 낸 돈 ${s.stats.autoPaid}`); }
{ const s = garden(); s.settings.slow = true; const m = E.mineOf(s); m.energy = 0; E.mineAutoSet(s, true, ctx, 5000); E.advance(s, s.virtual + 2 * H, ctx); E.advance(s, s.virtual + 2 * H, ctx);
  check(logs(s).every(l => !/\d+원/.test(l.text)) && logs(s).some(l => l.text.includes('정한 돈을 다 써서')), '🐢 느긋하게 보기는 돈 숫자 없이'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
