// P82 (11-06): 🫖 블렌딩 수량 · 🏷️ 티백 최소 수량 표시 · ☕ 찻집 주문칸 크기 ½
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const tea = read('app-teashop.js'), css = read('style.css');
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const K = 'springfield', [A, B] = E.BLENDS[K].parts, pa = E.FLOWERS[A].petals, pb = E.FLOWERS[B].petals;
// 재료 A는 a장, B는 b장 — 뒤로 갈수록 품질이 낮음
const garden = (a, b, q = 0.9) => {
  const st = E.create(Date.UTC(2026, 9, 5, 0, 0) + 0.1 * H, () => 0.5); st.onboarded = true; E.advance(st, st.virtual + H, ctx);
  let id = 9000; const put = (t, n) => { for (let i = 0; i < n; i++) st.dried.push({ id: id++, type: t, q: q - i * 0.001 }); };
  put(A, a); put(B, b); return st;
};
const pickIds = st => [A, B].map(t => st.dried.find(p => p.type === t).id);

console.log('[🫖 블렌딩 수량 (P82-01)]');
let st = garden(pa * 3 + 1, pb * 2 + 2);
check(E.blendMax(st, [A, B]) === 2, '가장 적게 만들 수 있는 꽃에 맞춰 최대 2잔');
check(E.blendMax(garden(pa - 1, pb), [A, B]) === 0, '한 꽃이라도 한 잔 몫이 모자라면 0잔');
const plan = E.blendPlan(st, [A, B], 2);
check(plan.length === 2 && plan.every(c => c.list.length === pa + pb), '잔마다 꽃마다 petals장씩');
check(plan[0].q > plan[1].q, '좋은 꽃잎부터 — 첫 잔이 더 좋음');
check(new Set(plan.flatMap(c => c.list.map(p => p.id))).size === (pa + pb) * 2, '두 잔이 같은 꽃잎을 쓰지 않음');
check(st.dried.length === pa * 3 + 1 + pb * 2 + 2, '계획만으로는 꽃잎이 줄지 않음');

const left0 = st.dried.length, xp0 = st.grade.by.blend || 0;
st.weekly.goals = [{ k: 'recipe', tier: 1, n: 5, got: 0, done: false }];
const r = E.blend(st, pickIds(st), ctx, 2);
check(r.ok && r.blends.length === 2 && st.blends.length === 2, '한 번에 2잔');
check(r.msg === `${E.BLENDS[K].name} 2잔을 만들었어요`, '잔 수를 알려 줌');
check(r.blend === r.blends[0], '예전 이름 blend는 첫 잔');
check(st.dried.length === left0 - (pa + pb) * 2, '두 잔 몫만 꽃잎이 줄어듦');
check(st.dried.filter(p => p.type === A).length === pa + 1 && st.dried.filter(p => p.type === B).length === 2, '남은 꽃잎은 그대로');
check(r.blends[0].q === plan[0].q && r.blends[1].q === plan[1].q, '잔마다 쓴 꽃잎의 평균 품질 · 미리보기 계획과 같음');
check(st.dex.blend[K] === plan[0].q, '도감엔 가장 좋은 잔 품질');
check(st.weekly.goals[0].got === 2, '주간 목표 2잔으로 셈');
check((st.grade.by.blend || 0) - xp0 === E.XP.blend * 2, '경험치 2잔 몫');
check(st.log.filter(l => l.text === `도감에 등록: ${E.BLENDS[K].name}`).length === 1, '도감 등록 일지는 한 번만');
check(new Set(st.blends.map(b => b.id)).size === 2, '잔마다 다른 번호');

st = garden(pa * 2, pb * 2);
const before = JSON.stringify(st.dried), over = E.blend(st, pickIds(st), ctx, 3);
check(!over.ok && over.msg.includes('블렌드 3잔엔') && over.msg.includes(`${E.FLOWERS[A].name} ${pa}장`), '최대보다 많이 고르면 막고 모자란 장 수를 알려 줌');
check(JSON.stringify(st.dried) === before && !st.blends.length, '막히면 아무것도 쓰지 않음');
const one = E.blend(st, pickIds(st), ctx);
check(one.ok && st.blends.length === 1 && one.msg.endsWith('만들었어요') && !one.msg.includes('잔을'), '수를 안 주면 예전처럼 1잔');
st = garden(pa * 2, pb * 2);
check(E.blend(st, pickIds(st), ctx, 0).blends.length === 1, '0은 1잔으로');
st = garden(pa * 2, pb * 2);
check(E.blend(st, pickIds(st), ctx, 'x').blends.length === 1, '숫자가 아니면 1잔으로');
st = garden(pa * 2, pb * 2);
check(E.blend(st, pickIds(st), ctx, 1.9).blends.length === 1, '소수는 내림');

st = garden(pa, pb, 1);
check(E.blend(st, pickIds(st), ctx, 1).blend.hat === E.isHat(1 - 0.001 * (Math.max(pa, pb) - 1)), '🍃 햇차 규칙 그대로 (잔의 꽃잎이 모두 ★5면)');

console.log('[🏷️ 티백 최소 수량 (P82-02)]');
check(E.bagNeed(A, 0).per === pa && E.bagNeed(A, 0).short === pa, '하나도 없으면 한 개 몫이 다 모자람');
check(E.bagNeed(A, pa - 1).short === 1, '한 장 모자람');
check(E.bagNeed(A, pa).short === 0 && E.bagNeed(A, pa * 5).short === 0, '넉넉하면 0');
check(/티백 1개 = 꽃잎 \$\{per\}장/.test(tea) && /\$\{short\}장 더 모아요/.test(tea), '카드 줄 문구');
check((tea.match(/bagNeedHTML\((p|d)\.type, (p|d)\.ids\.length\)/g) || []).length === 2, '생화 · 말린 꽃잎 카드 둘 다');
check(/티백 1개 = 꽃잎 \$\{per\(g\)\}장/.test(tea), '티백 고르는 창도 같은 문구');
check(/한 잔에 \$\{parts\.map/.test(tea) && /지금 최대 \$\{blendMaxN\}잔/.test(tea), '블렌딩 칸: 한 잔에 드는 장 수 · 지금 최대');
check(/data-blend="1" \$\{parts\.length >= 2 && recipe && blendMaxN >= 1/.test(tea), '모자라면 블렌딩 단추가 잠김');

console.log('[🫖 블렌딩 창 (P82-01)]');
check(/function openBlendConfirm\(n = 1\)/.test(tea) && /data-bn="max"/.test(tea), '창에 −/+ · 최대');
check(/E\.blend\(st, ui\.blendSel, ctx, n\)/.test(tea), '고른 잔 수로 만듦');
check(/FLOWERS\[p\.type\]\.petals \* n/.test(tea), '쓰이는 꽃잎 수가 잔 수를 따라감');
check(/data-bagblend="\$\{b\.ids\.join\(','\)\}"/.test(tea) && /data-brewblend="\$\{b\.ids\.join\(','\)\}"/.test(tea), '같은 블렌드는 카드 한 장 (×개수)');

console.log('[☕ 주문칸 크기 ½ (P82-03)]');
const steps = [...css.matchAll(/--gs: (\d+)/g)].map(m => +m[1]);
check(steps.every(Number.isInteger) && Math.max(...steps) === 6 && Math.min(...steps) === 2, '손님 정수배 2 ~ 6 (예전 4 ~ 12의 반)');
check(!/--(cs|ss): \d*\.\d/.test(css), '찻잔 · 쪽지 그림도 정수배');
check(/\.cf-seats \{[^}]*--sf: var\(--fs-sm\)/.test(css) && /min-width: 300px\) \{ \.cf-seats \{ --sf: var\(--fs-md\)/.test(css), '375px 쪽지 글씨는 예전 크기 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
