// R-A (11-05 전체 검토 고침 A): ④ cleanSave 숫자 칸 보강 — 꽃 시간 칸 · 번식 대기 · 광산 기력 시계가 글자여도 숫자로 (①~③ 프레임 · 두 탭은 화면 코드라 브라우저로 봄)
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };

console.log('[R-A4 flowers[] 시간 칸 · pending[] · mine.regenH]');
{ const s = E.cleanSave({ flowers: [{ id: '7', ageH: '12', lifeH: '30', waterH: '', weedH: 'x', pruneH: '3', fertH: '0', thirstH: '2.5', adaptH: '1', harvestKey: '5', bloomKey: '3', antKey: '9', bfm: '4', type: 'rose' }], pending: [{ id: '8', dueH: '12', type: 'rose' }], mine: { regenH: '0.5', energy: '3' } });
  const f = s.flowers[0];
  check([f.ageH, f.lifeH, f.pruneH, f.fertH, f.thirstH, f.adaptH, f.harvestKey, f.bloomKey, f.antKey, f.bfm].every(v => typeof v === 'number') && f.ageH === 12 && f.thirstH === 2.5 && f.type === 'rose', '꽃 시간 칸 글자 → 숫자 (글자 아닌 칸은 그대로)');
  check(f.waterH === 0 && f.weedH === 0, "빈 글자 · 숫자가 아닌 글자는 기본값 0");
  check(s.pending[0].dueH === 12 && s.pending[0].id === 8 && s.mine.regenH === 0.5 && s.mine.energy === 3, '번식 대기 dueH · 광산 regenH');
  const st = E.create(new Date(2026, 9, 5, 12).getTime(), () => 0.5); st.gardenId = 'reva';
  st.flowers.push({ id: 7001, type: 'rose', x: 5, y: 5, q: 0.8, startQ: 0.8, origin: '화원', stage: 'mature', bloomed: true, withered: false, ageH: '12', lifeH: '30', waterH: '1', weedH: '1', pruneH: '0', fertH: '0', thirstH: '0', adaptH: '0', harvestKey: -1, bloomKey: 3, ripeH: '0' });
  const cleaned = E.cleanSave(JSON.parse(JSON.stringify(st)));
  E.advance(cleaned, cleaned.virtual + 2 * H, ctx);
  const g = cleaned.flowers[0];
  check(typeof g.ageH === 'number' && !Number.isNaN(g.ageH) && g.ageH > 12 && typeof g.ripeH === 'number', '정리한 뒤 2시간 흘려도 NaN 없이 숫자로 더해짐'); }
{ const st = E.create(Date.UTC(2026, 9, 5), () => 0.5); st.gardenId = 'reva2';
  const before = JSON.stringify(st);
  check(JSON.stringify(E.cleanSave(JSON.parse(before))) === before, '정상 저장은 한 글자도 안 바뀜'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
