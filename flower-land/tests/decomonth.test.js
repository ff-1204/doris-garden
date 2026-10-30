// P35 그 달의 장식은 그 달 꽃을 반겨요 (10-30): 놓인 이달의 장식(12가지)의 달에, 그 달이 심는 달인 꽃을 심으면 씨앗 품질 최소 90%
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const mk = month => { const st = E.create(at(c => c.month === month && !c.frozen), () => 0.5); st.money = 1e6; st.titles.t_miracle = 1; return st; };   // 칭호를 얻은 정원 (아래 「한 포기의 기적」 절만 따로)
const seed = (st, type, q) => { E.buy(st, type, 1); const it = st.items[st.items.length - 1]; it.q = q; return it; };
const place = (st, key, x, y) => { st.decos.push({ id: st.nextId++, key, x, y }); };

console.log('[12가지 · 짝 달]');
check(E.MONTH_DECO_KEYS.length === 12 && !E.MONTH_DECO_KEYS.includes('moonlamp') && !E.MONTH_DECO_KEYS.includes('pavilion'), '이달의 장식 12가지 (🏮 · 🏯 빼고)');
check(new Set(E.MONTH_DECO_KEYS.map(k => E.DECOS[k].month)).size === 12, '3월 ~ 2월 한 달에 하나씩');
check(E.monthDecoOf(5) === 'bench' && E.monthDecoOf(13) === null, '5월은 나무 벤치 · 쉼달은 없음');

console.log('[그 달 · 놓였을 때]');
let st = mk(5); place(st, 'bench', 0, 0);
let it = seed(st, 'bpea', 0.82), r = E.plant(st, it.id, 5, 5, () => 0);
check(r.ok && r.flower.q === 0.9 && r.flower.startQ === 0.9 && r.warm, `5월 벤치 · 5월에 심는 버터플라이피 82% → 90% (${r.flower && r.flower.q})`);
check(r.msg.includes('나무 벤치') && r.msg.includes('90%'), `심기 문구 "${r.msg}"`);
it = seed(st, 'jasmine', 0.95); r = E.plant(st, it.id, 6, 5, () => 0);
check(r.ok && r.flower.q === 0.95 && !r.warm, '이미 90% 넘으면 그대로 (95%)');
it = seed(st, 'jasmine', 1); r = E.plant(st, it.id, 7, 5, () => 0);
check(r.flower.q === 1, '100%는 그대로 (상한 100%)');

console.log('[다른 달 · 창고 · 심는 달이 아닌 꽃]');
st = mk(5); place(st, 'birdhouse', 0, 0);                                // 4월 장식을 5월에
it = seed(st, 'bpea', 0.82); r = E.plant(st, it.id, 5, 5, () => 0);
check(r.flower.q === 0.82, '다른 달 장식(4월 새집)은 효과 없음');
st = mk(5); st.decos.push({ id: st.nextId++, key: 'bench', x: null, y: null });
it = seed(st, 'bpea', 0.82); r = E.plant(st, it.id, 5, 5, () => 0);
check(r.flower.q === 0.82, '창고에 있는 벤치는 효과 없음');
check(!E.monthDecoBoost(st, 'bpea'), 'monthDecoBoost: 창고면 false');
st = mk(5); place(st, 'bench', 0, 0); place(st, 'bench', 1, 0);
check(E.monthDecoBoost(st, 'bpea') && !E.monthDecoBoost(st, 'marigold'), '5월에 심는 꽃만 (메리골드는 6 · 7월)');
it = seed(st, 'bpea', 0.82); r = E.plant(st, it.id, 5, 5, () => 0);
check(r.flower.q === 0.9, '같은 장식 여럿이어도 90% 한 번');
st = mk(6); place(st, 'basin', 0, 0);
check(E.monthDecoBoost(st, 'marigold') && E.monthDecoBoost(st, 'lavender') && !E.monthDecoBoost(st, 'bpea'), '6월 돌 물확: 메리골드 · 라벤더 O · 버터플라이피 X');

console.log('[「한 포기의 기적」 진행 중]');
st = mk(5); delete st.titles.t_miracle; place(st, 'bench', 0, 0);
it = seed(st, 'bpea', 0.7); r = E.plant(st, it.id, 5, 5, () => 0);
check(r.flower.q === 0.7 && r.flower.startQ === 0.7, '칭호 전엔 80% 이하 씨앗은 그대로 (70%) — 기적을 노릴 수 있게');
it = seed(st, 'bpea', 0.85); r = E.plant(st, it.id, 6, 5, () => 0);
check(r.flower.q === 0.9, '칭호 전에도 80% 넘는 씨앗(85%)은 90%로');
st.titles.t_miracle = 1; it = seed(st, 'bpea', 0.7); r = E.plant(st, it.id, 7, 5, () => 0);
check(r.flower.q === 0.9, '칭호를 얻은 뒤엔 70%도 90%로');

console.log('[느긋하게 보기 · 카드 한 줄]');
st = mk(5); place(st, 'bench', 0, 0); st.settings.slow = true;
it = seed(st, 'bpea', 0.82); r = E.plant(st, it.id, 5, 5, () => 0);
check(!/\d+%/.test(r.msg) && r.msg.includes('반겨요'), `느긋하게 보기 문구엔 숫자 없음 "${r.msg}"`);
check(E.decoBuffLine(st, 'bench') === '🌸 5월 꽃을 반겨요', '카드 한 줄 (느긋하게)');
st.settings.slow = false;
check(E.decoBuffLine(st, 'bench') === '🌸 5월 꽃을 심으면 품질 90%부터' && E.decoBuffLine(st, 'bonsai') === '🌸 2월 꽃을 심으면 품질 90%부터', '카드 한 줄 (숫자)');
check(E.decoBuffLine(st, 'hive') === '', '이달의 장식이 아닌 것은 줄 없음');

console.log('[돈은 그대로]');
st = mk(5); place(st, 'bench', 0, 0); it = seed(st, 'bpea', 0.82); const m0 = st.money; E.plant(st, it.id, 5, 5, () => 0);
check(st.money === m0, '심기에 돈이 들거나 생기지 않음');
st = mk(7); place(st, 'chime', 0, 0); it = seed(st, 'celosia', 0.82); r = E.plant(st, it.id, 5, 5, () => 0);
check(r.flower.q === 0.9 && r.msg.includes('풍경이 반겨'), `받침 ("${r.msg}")`);

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
