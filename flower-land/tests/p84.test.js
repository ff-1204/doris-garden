// P84 (11-06): 🌹 프리저브드를 정원 장식으로 — 놓기 · 거두기 · 작은 효과 · 팔기 · 새 철
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 2, 2, 6, 0, 0).getTime();
const at = pred => { let t = MON; for (let i = 0; i < 400; i++) { if (pred(E.calendar(t))) return t; t += 6 * H; } throw new Error('날 못 찾음'); };
const ctx = { live: false, rng: () => 0.5 };
const garden = pred => { const s = E.create(at(pred || (c => c.month === 7 && !c.frozen)), () => 0.5); s.gardenId = 'p84-test'; s.onboarded = true; s.money = 0; s.preserved = [{ id: 901, type: 'rose', mut: false }, { id: 902, type: 'lavender', mut: true }]; return s; };
const flower = (s, type, x, y, q) => { const f = { id: 7000 + s.flowers.length, type, x, y, q: q == null ? 0.5 : q, startQ: 0.5, stage: 'mature', ripeH: 0, bloomed: false, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: 1 }; s.flowers.push(f); return f; };
const toSleepEnd = s => { let t = s.virtual; for (let i = 0; i < 2000; i++) { t += H; const c = E.calendar(t); if (!c.frozen && E.calendar(t - H).frozen) return t + H; } throw new Error('꽃잠을 못 찾음'); };

console.log('[P84-01 놓기 · 거두기]');
{ const s = garden(), xp0 = s.grade.xp;
  const r = E.placeDeco(s, 901, 5, 5), d = E.decoAt(s, 5, 5);
  check(r.ok && r.msg === '프리저브드 장미를 놓았어요' && d && d.key === 'pres' && d.id === 901, `창고에서 빈 칸에: ${r.msg}`);
  check(s.preserved.length === 1 && s.preserved[0].id === 902, '놓으면 창고에서 빠짐');
  check(E.decoKey(d) === 'pres:rose:0' && E.decoInfo('pres:rose:0').name === '프리저브드 장미' && E.decoInfo('pres:lavender:1').name.includes('🧬'), '이름 · 그림 키는 꽃 · 변이까지');
  check(!E.DECO_KEYS.includes('pres') && !E.decoExtras(s).includes('pres') && !(s.dex.deco || {}).pres, '꾸밈 도감 칸 밖');
  check(E.decoGroups(s).find(g => g.items.some(i => i.key === 'pres:rose:0')).key === 'keep', '창고 장식 칸에선 🏅 기념 장식 묶음');
  check(!E.sellPreserved(s, [901], ctx).ok && s.money === 0, '놓인 동안엔 못 팖');
  check(!E.placeDeco(s, 902, 5, 5).ok && s.preserved.length === 1, '장식이 있는 칸엔 못 놓음 · 창고 그대로');
  const f = flower(s, 'rose', 6, 6); check(!E.placeDeco(s, 902, 6, 6).ok && !E.placeDeco(s, 902, -1, 0).ok && s.preserved.length === 1, '꽃 칸 · 정원 밖엔 못 놓음');
  s.items.push({ id: 950, type: 'rose', q: 0.7, got: 0, origin: '화원' });
  check(!E.move(s, f.id, 5, 5, ctx).ok, '옮겨심기도 막힘');
  check(E.placeDeco(s, 901, 7, 7).ok && !E.decoAt(s, 5, 5) && E.decoAt(s, 7, 7) === d, '놓인 것을 옮김');
  const g = E.storeDeco(s, 901);
  check(g.ok && g.msg.includes('창고에 넣었어요') && s.preserved.some(p => p.id === 901 && p.type === 'rose' && !p.mut) && !(s.decos || []).some(z => z.key === 'pres'), `거두면 창고로: ${g.msg}`);
  check((s.grade.by.deco || 0) === 0 && s.grade.xp === xp0, '놓기 · 거두기엔 경험치 없음');
  const sold = E.sellPreserved(s, [901], ctx);
  check(sold.ok && s.money === E.presValue(s, 'rose', false), '거둔 것은 그대로 팖');
  E.placeDeco(s, 902, 2, 2); const dm = E.decoAt(s, 2, 2); E.storeDeco(s, 902);
  check(s.preserved.some(p => p.id === 902 && p.mut === true), '🧬 변이는 그대로');
  E.placeDeco(s, 902, 2, 2); check(!E.setTopDeco(s, 902, ctx).ok && E.decoAt(s, 2, 2), '🎀 대표 장식으로는 못 담'); }
{ const s = garden(); check(E.presDeco(s, 901).pres.type === 'rose' && E.presDeco(s, 901).x === null && s.preserved.length === 2 && E.presDeco(s, 9) === null, '놓는 동안의 모습은 창고를 안 바꿈'); }

console.log('[P84-02 작은 효과]');
check(E.PRES_DECO_Q === 0.005 && E.PRES_DECO_Q < E.LAMP_Q && E.DECO_REACH.pres === 1 && E.DECO_REACH.pres < E.DECO_REACH.stonelamp, '🏮 석등(둘레 2칸 · +1%)보다 작게: 둘레 1칸 · +0.5%');
{ const s = garden(c => c.frozen), near = flower(s, 'rose', 6, 5), far = flower(s, 'rose', 8, 5), full = flower(s, 'rose', 4, 5, 1);
  E.placeDeco(s, 901, 5, 5); E.placeDeco(s, 902, 5, 6);   // 둘이 겹쳐도
  const d = E.decoAt(s, 5, 5); check(d.at === E.calendar(s.virtual).abs, '놓은 달을 적음');
  d.at = E.decoAt(s, 5, 6).at = -1; E.advance(s, toSleepEnd(s), ctx);   // 꽃잠엔 품질이 안 변해 차이가 곧 효과
  const q = Math.round((near.q - far.q) * 1e4) / 1e4;
  check(q === 0.01, `꽃잠 달 끝 두 번: 둘이 겹쳐도 한 꽃에 한 번씩 +0.5% × 2 — ${q}`);
  check(full.q <= 1, '100%를 넘지 않음'); }
{ const s = garden(c => c.frozen), f = flower(s, 'rose', 6, 5), c0 = E.calendar(s.virtual);
  E.placeDeco(s, 901, 5, 5);
  check(E.presDecoTick(s, c0) === 0 && f.q === 0.5, '그 달에 놓은 것은 그 달 끝에 효과 없음 (놓았다 거둬 거저 못 얻음)');
  const d = E.decoAt(s, 5, 5); check(E.presDecoTick(s, { abs: c0.abs + 1 }) === 1 && f.q === 0.505, '다음 달 끝부터 +0.5%');
  E.placeDeco(s, 901, 5, 6); check(E.presDecoTick(s, { abs: d.at }) === 0, '옮기면 다시 그 달은 쉼');
  E.storeDeco(s, 901); check(E.presDecoTick(s, { abs: c0.abs + 9 }) === 0, '거두면 효과 없음'); }
{ const s = garden(), line = E.decoBuffLine(s, 'pres:rose:0');
  check(line.includes('둘레 1칸') && line.includes('+0.5%') && E.decoActive('pres:rose:0') === 'place', `효과 한 줄: ${line}`);
  s.settings.slow = true; check(!/\d%/.test(E.decoBuffLine(s, 'pres:rose:0')), '🐢 느긋하게 보기는 숫자 없이'); }
{ const s = garden(), base = E.yearScore ? E.yearScore(s) : null; E.placeDeco(s, 901, 5, 5);
  if (base) check(E.yearScore(s).parts.decos === base.parts.decos, '한 해 평가 장식 점수에 안 듦'); }

console.log('[P84-03 쉼달 · 새 철]');
{ const s = garden(); E.placeDeco(s, 901, 5, 5); E.advance(s, toSleepEnd(s), ctx);
  check(E.decoAt(s, 5, 5) && E.decoAt(s, 5, 5).pres.type === 'rose', '꽃잠 · 쉼달이 지나도 제자리'); }
{ const s = garden(c => c.frozen); s.season = s.season || {}; E.placeDeco(s, 901, 5, 5); const keepD = E.addDeco(s, 'bench'); E.placeDeco(s, keepD.id, 6, 5);
  s.yearLog = [1, 2, 3].map(y => ({ year: y, season: E.seasonN(s) })); for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true; E.seasonReady(s);
  const r = E.seasonStart(s, ctx); check(r.ok, '새 철 시작: ' + r.msg);
  check(s.preserved.some(p => p.id === 901 && p.type === 'rose') && !s.decos.some(d => d.key === 'pres'), '새 철: 놓인 프리저브드는 창고로 돌아옴');
  check(s.decos.some(d => d.key === 'bench' && d.x == null), '다른 장식은 예전처럼 창고 🪴로');
  check(E.sellPreserved(s, [901], ctx).ok, '돌아온 것은 팔 수 있음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
