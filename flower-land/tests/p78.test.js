// P78 (11-05): 📦 창고 장식 종류별 묶음 · 최대 수(있는 규칙 one만) · 빈 칸을 누르면 바로 놓을 장식
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const st = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5);   // 현지 시각 (CI는 UTC)

console.log('[종류 나누기]');
const g = E.decoGroupOf;
check(g('bench') === 'month' && g('fence') === 'month' && g('pavilion') === 'month', '이달의 장식 (꽃 울타리 · 정자 포함)');
check(g('arch') === 'grade' && g('flowercart') === 'grade', '등급 장식');
check(g('stonewall') === 'craft' && g('fossilcase') === 'craft' && g('oldpot') === 'craft', '공방 장식 (나무 울타리 · 화석 진열장)');
check(g('heatmat') === 'gear' && g('greenhouse') === 'gear' && g('dryshelf') === 'gear' && g('teastand') === 'gear', '정원 장치');
check(['hive', 'barrel', 'autobasket', 'dryrack', 'teahelper', 'earthworm', 'ladybug'].every(k => g(k) === 'insect'), '곤충 일꾼 7');
check(g('cloudstone') === 'keep' && g('t:t_visit') === 'keep' && g('mutjar') === 'keep' && g('nope') === 'keep', '기념 장식 (덤 · 칭호 문장 · 유리 관 · 모르는 키)');
check(Object.keys(E.DECOS).every(k => E.DECO_GROUPS.some(G => G.key === g(k))), '모든 장식이 묶음 하나에 듦');

console.log('[최대 수]');
check(E.decoMax('greenhouse') === 1 && E.decoMax('hive') === 1 && E.decoMax('teastand') === 1, '한 종류에 하나(one)는 최대 1');
check(E.decoMax('bench') === null && E.decoMax('stonewall') === null && E.decoMax('t:t_visit') === null, '그 밖엔 제한 없음(null)');

console.log('[창고 묶음]');
const a = E.addDeco(st, 'bench'), b = E.addDeco(st, 'bench'), c = E.addDeco(st, 'greenhouse'), w = E.addDeco(st, 'stonewall');
E.placeDeco(st, a.id, 2, 2);
const gs = E.decoGroups(st);
check(gs.map(x => x.key).join() === 'month,craft,gear', '가진 것만 · 정한 차례로 (' + gs.map(x => x.key).join() + ')');
const bi = gs[0].items[0];
check(bi.key === 'bench' && bi.all.length === 2 && bi.store.length === 1 && bi.out === 1 && bi.max === null, '벤치: 가진 2 · 창고 1 · 정원 1 · 제한 없음');
check(gs[2].items[0].max === 1 && gs[1].items[0].key === 'stonewall', '온실 최대 1 · 울타리는 공방');
st.topDeco = b.id;
check(E.decoGroups(st)[0].items[0].store.length === 0, '🎀 위 칸에 단 장식은 창고 수에서 빠짐');
st.topDeco = null;

console.log('[빈 칸에 놓을 장식]');
const ps = E.decoPlaceable(st, 5, 5);
check(ps.length === 3 && ps.map(p => p.key).join() === 'bench,stonewall,greenhouse', '창고에 있는 종류마다 하나 (' + ps.map(p => p.key).join() + ')');
check(ps[0].id === b.id && ps[0].n === 1, '벤치는 창고에 남은 것 id · 1개');
check(E.decoPlaceable(st, 2, 2).length === 0, '장식 있는 칸엔 없음');
st.flowers.push({ id: 9100, type: 'chamomile', x: 7, y: 7, q: 0.5, stage: 'young', withered: false });
check(E.decoPlaceable(st, 7, 7).length === 0, '꽃 있는 칸엔 없음');
st.flowers.pop();
check(E.decoPlaceable(st, -1, 0).length === 0, '정원 밖은 없음');
check(E.placeDeco(st, ps[2].id, 5, 5).ok && c.x === 5, '골라 바로 놓음');
check(!E.decoPlaceable(st, 6, 6).some(p => p.key === 'greenhouse'), '놓은 뒤엔 목록에서 빠짐');
const empty = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5); empty.decos = [];
check(E.decoPlaceable(empty, 1, 1).length === 0 && E.decoGroups(empty).length === 0, '장식이 없으면 빈 목록');
void w;

console.log('[P81 지금 효과 한 줄]');
{ const s = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5); s.decos = [];
  const ef = k => E.decoEffect(s, k).line;
  ['basin', 'ladybug', 'arch', 'greenhouse', 'cloudstone', 't:t_visit'].forEach(k => E.addDeco(s, k));
  check(ef('cloudstone') === '🌼 보기만 바뀌는 꾸밈 장식이에요' && ef('t:t_visit') === '🌼 보기만 바뀌는 꾸밈 장식이에요', '효과 없는 꾸밈 · 칭호 문장');
  check(ef('basin').includes('물이 6시간 더 가요') && ef('basin').endsWith('아직 놓지 않아 효과가 없어요') && !E.decoEffect(s, 'basin').active, '창고에만 있으면 효과 줄 + "아직 놓지 않아"');
  E.placeDeco(s, s.decos.find(d => d.key === 'basin').id, 1, 1);
  check(ef('basin').endsWith('정원에 1개 놓음') && E.decoEffect(s, 'basin').active, '놓으면 "정원에 1개 놓음"');
  check(/둘레 \d칸 꽃에서/.test(ef('ladybug')) && ef('greenhouse').includes('2배'), '곤충은 지금 둘레 칸 수 · 장치는 배율 숫자');
  E.placeDeco(s, s.decos.find(d => d.key === 'arch').id, 2, 2);
  check(ef('arch').includes(`(지금 ${E.orderMax(s)}장)`), '등급 장식은 놓으면 지금 주문 쪽지 수'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
