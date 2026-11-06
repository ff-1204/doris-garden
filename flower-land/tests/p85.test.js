// P85 (11-06): 경제 밸런스 — 새 철 프리저브드 · 산 꽃잎 돈 고리 막기 · 시뮬 새 유형
const path = require('path'), { execFileSync } = require('child_process');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 2, 2, 6, 0, 0).getTime();
const at = pred => { let t = MON; for (let i = 0; i < 400; i++) { if (pred(E.calendar(t))) return t; t += 6 * H; } throw new Error('날 못 찾음'); };
const ctx = { live: false, rng: () => 0.5 };
const garden = pred => { const s = E.create(at(pred || (c => c.month === 7 && !c.frozen)), () => 0.5); s.gardenId = 'p85-test'; s.onboarded = true; s.money = 1e6; return s; };

console.log('[P85-01 새 철 프리저브드]');
{ const s = garden(c => c.frozen); s.preserved = [{ id: 901, type: 'rose', mut: false }, { id: 902, type: 'lavender', mut: true }, { id: 903, type: 'rose', mut: false }];
  E.placeDeco(s, 903, 5, 5); s.preserving = [{ id: 904, type: 'rose', mut: false, leftH: 5 }];
  s.yearLog = [1, 2, 3].map(y => ({ year: y, season: E.seasonN(s) })); for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true;
  check(E.SEASON_KEEP.includes('preserved'), 'SEASON_KEEP에 창고 프리저브드');
  const r = E.seasonStart(s, ctx); check(r.ok, '새 철 시작');
  check(s.preserved.map(p => p.id).sort().join() === '901,902,903' && s.preserved.find(p => p.id === 902).mut, '창고 것 · 놓인 것 모두 창고에 남음 (변이 표시 그대로)');
  check(s.money === 15000 && !s.preserving.length, '돈은 15,000원 · 유리 돔에서 마르는 것은 예전처럼 비워짐');
  check(E.sellPreserved(s, [901], ctx).ok, '남은 것은 새 철에 팖'); }

console.log('[P85-03 산 꽃잎 돈 고리]');
const dryAll = s => { E.dryPetals(s, s.petals.map(p => p.id), ctx); E.advance(s, s.virtual + (E.MONTH_H + 1) * H, ctx); };
const buyBlend = pred => { const s = garden(pred), P = ['rose', 'jasmine']; const m0 = s.money; for (const p of P) E.buyPetal(s, p, E.FLOWERS[p].petals); return { s, cost: m0 - s.money, P }; };
{ const { s, cost, P } = buyBlend();
  check(s.petals.every(p => p.bought === true), '산 꽃잎엔 표시');
  dryAll(s);
  check(s.dried.length === 10 && s.dried.every(p => p.bought === true), '말려도 표시가 따라감');
  const ids = P.map(t => s.dried.find(d => d.type === t).id);
  const b = E.blend(s, ids, ctx).blend; check(b.bought === true && b.recipe === 'rosejasmine', '레시피는 만들어지되 표시가 따라감');
  const fair = E.blendValue({ parts: b.parts, q: b.q, recipe: b.recipe }), v = E.blendValue(b);
  const near = x => x <= cost + 20;   // 값은 10원 단위 반올림이라 몇십 원은 남을 수 있음
  check(near(v) && fair > cost * 1.4, `산 꽃잎 블렌드 ${v}원 ≈ 산 값 ${cost}원 (배율이 붙으면 ${fair}원이던 것)`);
  E.bagBlends(s, [b.id], ctx); const cal = E.calendar(s.virtual);
  E.brew(s, [], [b.id]); const c = s.cups[0]; check(c.bought === true && near(E.cupValue(s, c, cal)), '찻잔까지 표시');
  for (const k of ['winter', 'sleep']) { const pr = E.TEA_PRICE_MUL[k]; check(E.cupValue(s, c, k === 'sleep' ? Object.assign({}, cal, { frozen: true, month: 13 }) : Object.assign({}, cal, { month: 12 })) === v, `${k === 'sleep' ? '꽃잠' : '겨울'} ×${pr}에도 산 값까지만`); } }
{ const s = garden(), F = E.FLOWERS.rose; E.buyPetal(s, 'rose', F.petals); const cost = F.petals * E.petalPrice('rose'); dryAll(s);
  E.makeTeaDried(s, s.dried.map(d => d.id), ctx); const t = s.teas.find(x => x.bought);
  check(t && t.bought === true, '티백에도 표시');
  E.brew(s, [t.id], []); const c = s.cups[0], w = Object.assign({}, E.calendar(s.virtual), { frozen: true, month: 13 });
  check(E.cupValue(s, c, w) <= cost, `산 꽃잎 티백 꽃잠 값 ${E.cupValue(s, c, w)}원 ≤ ${cost}원`); }
{ const s = garden(); E.buyPetal(s, 'rose', 5); E.makeRaw(s, s.petals.map(p => p.id), ctx); check(s.teas.some(t => t.raw && t.bought), '생화 티백에도 표시'); }
{ const s = garden(), P = ['rose', 'jasmine'];   // 거둔 꽃잎은 그대로
  for (let i = 0; i < 5; i++) for (const p of P) s.dried.push({ id: 8000 + i * 2 + P.indexOf(p), type: p, q: 0.8 });
  const b = E.blend(s, P.map(t => s.dried.find(d => d.type === t).id), ctx).blend;
  check(!('bought' in b) && E.blendValue(b) === E.blendValue({ parts: b.parts, q: b.q, recipe: b.recipe }), '거둔 꽃잎 블렌드는 × 1.5 그대로 · 저장 칸도 그대로');
  const c = Object.assign({}, b, { kind: 'blend', brewAbs: E.calendar(s.virtual).abs }), cal = E.calendar(s.virtual);
  check(E.cupValue(s, c, Object.assign({}, cal, { frozen: true, month: 13 })) > E.cupValue(s, c, cal), '겨울 · 꽃잠 값도 그대로'); }
{ const s = garden(), P = ['rose', 'jasmine'];   // 섞여도 표시
  for (const p of P) E.buyPetal(s, p, 5); dryAll(s); s.dried.push({ id: 8100, type: 'rose', q: 0.9 });
  const b = E.blend(s, P.map(t => s.dried.find(d => d.type === t).id), ctx).blend; check(b.bought === true, '거둔 꽃잎과 섞여도 산 꽃잎이 들면 배율 없음'); }
{ const s = garden(), keep = Object.keys(E.create(MON, () => 0.5)); check(!keep.includes('bought'), '표시는 꽃잎마다 — 정원 칸은 그대로'); }

console.log('[P85-02 시뮬 새 유형 · 같은 씨앗이면 같은 값]');
const sim = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '1', '7', ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });
{ const base = sim(); check(base === sim(), '기본 두 번 같음');
  const a = sim('--automine', '--craft', '--move=1'); check(a === sim('--automine', '--craft', '--move=1') && a.includes('자동 캐기:') && a.includes('옮기기:'), '--automine --craft --move도 두 번 같음');
  check(sim('--blendn') === base, '--blendn은 기본과 같은 값 (한 번에 만들어도 돈은 그대로)');
  check(sim('--petalloop').includes('꽃잎 사기'), '--petalloop 칸'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
