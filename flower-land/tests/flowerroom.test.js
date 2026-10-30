// 꽃방(말리기) · 블렌딩 · 꽃잎 도감 검증
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const ctx = { live: false, rng: () => 0.5, toast() {} };
// 월요일 06:00 (3월 시작) 기준
const MON = (() => { const d = new Date(2026, 9, 5, 6, 0, 0); return d.getTime(); })();
const st = E.create(MON);
check(E.calendar(st.virtual).month === 3, '3월에서 시작');
check(E.DEX_TOTAL === 93, '도감 전체 93칸 (씨앗·묘목 13 · 꽃 13 · 꽃잎 13 · 티백 22(꽃 13 + 블렌드 9) · 차 13 · 땅 10 · 블렌드 9)');
check(Object.keys(E.FLOWERS).every(k => true) && E.BLEND_KEYS.every(b => E.BLENDS[b].parts.every(p => E.FLOWERS[p])), '블렌드 재료는 모두 있는 꽃');

// 꽃잎을 손으로 넣고 말리기
let id = 5000;
const P = (type, q) => ({ id: id++, type, q, seasonKey: 0 });
st.petals.push(P('chamomile', 0.8), P('rose', 0.6), P('lavender', 0.9));
const ids = st.petals.map(p => p.id);
check(E.dryPetals(st, [ids[0], ids[1]]).ok && st.drying.length === 2 && st.petals.length === 1, '꽃잎 2장을 꽃방에 널기 (언제든)');
const q0 = st.drying[0].q;
E.advance(st, st.virtual + 6 * E.HOUR, ctx);
check(st.drying.length === 2 && st.drying[0].q === q0, '말리는 중에는 품질이 그대로');
check(st.petals[0].q < 0.9, '널지 않은 꽃잎은 품질이 떨어짐');
E.advance(st, st.virtual + 7 * E.HOUR, ctx);
check(st.drying.length === 0 && st.dried.length === 2, '1달(흐르는 12시간) 뒤 말린 꽃잎이 됨');
check(st.log.some(l => l.type === 12), '다 마르면 정원 일지에 남음');
const dq = st.dried[0].q;
E.advance(st, st.virtual + 30 * E.HOUR, ctx);
check(st.dried[0].q === dq, '말린 꽃잎은 품질이 더 떨어지지 않음');

// 블렌딩은 꽃잠에만
const dIds = st.dried.map(p => p.id);
// 블렌딩은 언제든 (10-06). 찻집은 매달 (P34)
st.teas.push({ id: id++, type: 'rose', q: 0.5, seasonKey: 0 });
check(E.sellTea(st, [st.teas[st.teas.length - 1].id]).ok, 'P34 평일(월)에도 찻집에서 팖');
// 일요일 06:00(쉼달)로 이동
const SUN = MON + 6 * 24 * E.HOUR;
E.advance(st, SUN + 60 * 1000, ctx);
check(E.calendar(st.virtual).frozen, '꽃잠으로 이동');
check(!E.blend(st, [dIds[0]], ctx).ok, '1장으로는 블렌딩 안 됨');
const r = E.blend(st, dIds, ctx);
check(r.ok && st.blends.length === 1 && st.dried.length === 0, '말린 캐모마일 + 장미로 블렌딩');
const b = st.blends[0];
check(b.recipe === 'springfield' && b.name === '봄 들판', '이름 있는 블렌드 "봄 들판"이 됨');
check(st.dex.blend.springfield > 0, '블렌드 도감에 등록');
const expect = Math.round((E.teaValue(E.FLOWERS.chamomile, b.q, false) + E.teaValue(E.FLOWERS.rose, b.q, false)) * 1.5 / 10) * 10;
check(E.blendValue(b) === expect, '블렌딩 차 값 = 따로 만든 차 값의 합 × 1.5 (레시피 봄 들판)');
const m0 = st.money;
check(E.sellBlends(st, [b.id]).ok && st.money - m0 === expect, '블렌딩 차 팔기');

// 같은 꽃 2장은 안 됨, 말린 꽃잎으로 차 만들기
st.dried.push({ id: id++, type: 'lotus', q: 0.7 }, { id: id++, type: 'lotus', q: 0.7 });
check(!E.blend(st, st.dried.map(p => p.id), ctx).ok, '같은 꽃끼리는 블렌딩 안 됨');
check(E.makeTeaDried(st, [st.dried[0].id], ctx).ok && st.teas.some(t => t.type === 'lotus' && t.seasonKey === -1), '말린 꽃잎으로 차 (햇차 아님)');
const tea = st.teas.find(t => t.type === 'lotus');
check(!E.isFresh(st, tea, E.calendar(st.virtual)), '말린 꽃잎 차는 햇차가 아님');

// 꽃잎 도감: 처음 수확할 때
check(Object.keys(st.dex.petal).length === 0, '수확 전 꽃잎 도감은 비어 있음');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
