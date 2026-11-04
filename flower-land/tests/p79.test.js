// P79 (11-05): 🫖 새 블렌드 넷 · 👅 차 · 블렌드 맛 한 줄
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

console.log('[새 블렌드]');
const NEW = { bluejasmine: ['bpea', 'jasmine'], rosejasmine: ['rose', 'jasmine'], duskhill: ['hibiscus', 'lavender'], goldautumn: ['marigold', 'gamguk'] };
check(Object.entries(NEW).every(([k, p]) => E.BLENDS[k] && E.BLENDS[k].parts.join() === p.join() && !E.BLENDS[k].hidden), '넷 모두 레시피에 (숨은 레시피 아님)');
check(E.BLEND_KEYS.length === 13 && E.DEX_TOTAL === 101, '레시피 13가지 · 기본 도감 101칸');
const sig = k => E.BLENDS[k].parts.slice().sort().join('|'), sigs = Object.keys(E.BLENDS).map(sig);
check(new Set(sigs).size === sigs.length, '재료가 같은 블렌드가 둘 없음');
check(Object.keys(E.BLENDS).every(k => E.BLENDS[k].parts.every(p => E.FLOWERS[p])), '재료는 모두 있는 꽃');
check(E.blendRecipe(['jasmine', 'bpea']) === 'bluejasmine' && E.blendRecipe(['gamguk', 'marigold']) === 'goldautumn', '재료 차례와 상관없이 레시피를 찾음');
const q = 0.5, sum = p => p.reduce((a, k) => a + E.teaValue(E.FLOWERS[k], q, false), 0);
check(E.blendValue({ parts: NEW.duskhill, q }) === Math.round(sum(NEW.duskhill) * E.RECIPE_RATE / 10) * 10, '새 레시피 값은 다른 레시피와 같은 × 1.5');
// 같은 철: 두 꽃이 피는 달이 겹치거나 이웃 (여름 · 가을 짝)
const near = ([a, b]) => E.FLOWERS[a].bloom.some(m => E.FLOWERS[b].bloom.some(n => Math.abs(m - n) <= 3));
check(Object.values(NEW).every(near), '두 꽃이 피는 철이 가까움');

console.log('[맛 한 줄]');
check(E.FLOWER_KEYS.every(k => E.teaTaste('tea', k).length >= 4 && E.teaTaste('tea', k).length <= 20), '꽃 차 13가지 모두 한 줄 (4 ~ 20자)');
check(Object.keys(E.BLENDS).every(k => E.BLENDS[k].taste && E.teaTaste('blend', k).length <= 20), '이름 있는 블렌드 15가지(숨은 둘 포함) 모두 한 줄 (20자 이하)');
check(E.teaTaste('blend', null, ['rose', 'lotus']) === '장미 향 · 맑은 연꽃 향', '이름 없는 블렌드는 꽃마다 첫 낱말을 이음');
check(E.teaTaste('blend', 'springfield', ['chamomile', 'rose']) === E.BLENDS.springfield.taste, '레시피 블렌드는 그 레시피 줄');
check(E.teaTaste('tea', 'nope') === '' && E.teaTaste('blend', 'nope', []) === '', '모르는 키는 빈 줄');
check(E.FLOWER_KEYS.every(k => !/[<>]/.test(E.teaTaste('tea', k))), '화면에 그대로 찍어도 되는 글자');

console.log('[P79-05 레시피 밖 짝은 못 섞음]');
const st = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5); st.onboarded = true;
let nid = 800000; const dry = (t, n = E.FLOWERS[t].petals) => { for (let i = 0; i < n; i++) st.dried.push({ id: nid++, type: t, q: 0.7 }); };
dry('rose'); dry('lotus');
const one = t => st.dried.find(d => d.type === t).id;
const r = E.blend(st, [one('rose'), one('lotus')]);
check(!r.ok && r.msg.startsWith('정해진 블렌드만 만들 수 있어요') && st.dried.length === 13 && st.blends.length === 0, '장미 + 연꽃은 막힘 · 꽃잎 그대로 (' + r.msg + ')');
check(E.blendNear(['rose', 'lotus']).length === 2 && E.blendNear(['rose', 'lotus']).every(k => E.BLENDS[k].parts.some(p => p === 'rose' || p === 'lotus')), '가까운 블렌드 둘 — 고른 꽃이 든 레시피');
check(E.blendNearText(['rose', 'lotus']).startsWith('가까운 블렌드: ') && E.blendNearText(['napmae', 'celosia']).includes('('), '안내 한 줄 (재료 이름 함께)');
dry('jasmine');
check(E.blend(st, [one('rose'), one('jasmine')]).ok && st.blends[0].recipe === 'rosejasmine', '레시피 짝(꽃향 두 겹)은 됨');
// 숨은 레시피는 칭호 전엔 레시피 밖
dry('chamomile'); dry('rose'); dry('lavender');
check(!E.blend(st, [one('chamomile'), one('rose'), one('lavender')]).ok, '숨은 레시피(세 정원의 오후)는 「블렌드 연구가」 전엔 막힘');
st.titles.t_blend = 0;
check(E.blend(st, [one('chamomile'), one('rose'), one('lavender')]).ok, '칭호를 얻으면 됨');

console.log('[첫 방문 꾸러미]');
for (const type of ['chamomile', 'maehwa', 'rose', 'lavender', 'jasmine', 'gamguk', 'dongbaek', 'napmae']) {
  const s = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5); s.onboarded = true; s.dried = []; s.letterBox = [];
  s.firstFlower = type;
  const pack = E.STARTER_BLEND[type] || 'springfield';
  for (const p of E.BLENDS[pack].parts) for (let i = 0; i < E.FLOWERS[p].petals; i++) s.dried.push({ id: nid++, type: p, q: 0.8, gift: true });
  const ids = E.BLENDS[pack].parts.map(p => s.dried.find(d => d.type === p).id), b = E.blend(s, ids);
  if (!b.ok) check(false, `${type} 꾸러미(${pack}) 블렌딩 막힘: ${b.msg}`);
}
check(Object.values(E.STARTER_BLEND).every(k => E.BLEND_KEYS.includes(k)), '꾸러미 레시피는 모두 숨지 않은 레시피 — 첫 블렌딩이 막히지 않음');

console.log('[예전에 만든 이름 없는 블렌드]');
const old = E.create(new Date(2026, 4, 10, 12).getTime(), () => 0.5);
old.blends.push({ id: 7001, parts: ['rose', 'lotus'], q: 0.6, recipe: null, name: '장미 · 연꽃 블렌드', hat: false });
const m = E.migrateSave(JSON.parse(JSON.stringify(old)));
const ob = m.blends.find(b => b.id === 7001);
check(ob && ob.recipe === null && ob.name === '장미 · 연꽃 블렌드', '저장을 열어도 지우지 않고 그대로');
const sum2 = ['rose', 'lotus'].reduce((a, k) => a + E.teaValue(E.FLOWERS[k], 0.6, false), 0);
check(E.blendValue(ob) === Math.round(sum2 * E.BLEND_RATE / 10) * 10, '값은 예전처럼 × 1.2');
check(E.bagBlends(m, [7001]).ok && m.blends[0].bagged, '티백으로 만들 수 있음 (그다음 우려 팔기는 다른 블렌드와 같음)');

console.log(fails ?`결과: ${fails}개 실패` : '결과: 모두 통과');
