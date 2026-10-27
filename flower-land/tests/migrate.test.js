// 예전 저장 보정 (MIGRATIONS · migrateSave, 10-24): 옛 정원이 지금 형식으로 열리는지
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));

const st = E.create(MON, () => 0.5);
E.advance(st, MON + 30 * H, ctx);
check(st.mig === E.MIGRATIONS.length, '새 정원은 보정을 다 한 것으로 시작 (mig)');

console.log('[쓸 수 없는 정원]');
check(E.migrateSave(null) === null && E.migrateSave({ v: 2 }) === null, '없거나 옛 v면 null');
const cut = copy(st); cut.tiles.pop();
check(E.migrateSave(cut) === null, '땅 칸 수가 틀리면 null');

console.log('[가장 옛 정원]');
const old = copy(st);
for (const k of ['water', 'shears', 'hoe', 'basket', 'drying', 'dried', 'blends', 'cups', 'gardenId', 'mig', 'account', 'actAt', 'letterBox']) delete old[k];
for (const k of ['petal', 'blend', 'bagBlend', 'teabag', 'form']) delete old.dex[k];
old.dex.tea = { chamomile: true }; old.teas = [{ id: 900, type: 'lavender', q: 3 }];
old.items.push({ id: 901, type: 'rose', q: 3, origin: '가게', form: 'seed' });
old.dex.flower = { sunflower: true };
const m = E.migrateSave(old);
check(m === old && m.mig === E.MIGRATIONS.length, '보정을 끝까지 하고 mig를 적음');
check(m.water === 10 && m.shears === 5 && m.hoe === 10 && m.basket === 10, '용품 기본값');
check(['drying', 'dried', 'blends', 'cups'].every(k => Array.isArray(m[k])), '꽃방 · 블렌딩 · 찻잔 칸');
check(m.items.find(i => i.id === 901).origin === '화원', '가게 → 화원');
check(m.dex.petal.chamomile && m.dex.petal.lavender, '꽃잎 도감: 차 도감 · 가진 차의 꽃 등록');
check(m.dex.teabag.chamomile && m.dex.teabag.lavender, '티백 도감: 만든 적 있는 차 등록');
check(m.dex.form.rose && m.dex.form.sunflower, '씨앗 · 묘목 도감: 창고 · 핀 적 있는 꽃 등록');
check(typeof m.gardenId === 'string' && m.dex.blend && m.dex.bagBlend, '이름표 · 블렌드 도감 칸');
check(m.restClosed === null && m.flowers.every(f => f.propRest === false), '꽃잠 번식 표시 · 꽃잠 안내 닫은 주 칸 (QA 19회차)');
check(m.account === null && m.actAt === null, '☁️ 계정 기록 · 마지막으로 손댄 때 칸 (P20-06 · 08)');
check(Array.isArray(m.letterBox) && m.letterBox.length === 0, '🎁 받은 편지함 칸 · 예전 편지에는 답례품 소급 없음 (P26-06)');
check(m._fertNew === 0 && JSON.stringify(m._bloomNew) === '{}', '열 때마다: 새 알림 표시 비움');

console.log('[여러 번 열어도 같음]');
const again = copy(m), before = JSON.stringify(again);
E.migrateSave(again); delete again.mig;
const b2 = JSON.parse(before); delete b2.mig;
check(JSON.stringify(again) === JSON.stringify(b2), '두 번째로 열 때 바뀌는 것이 없음');
const redo = copy(m); delete redo.mig; const ref = JSON.stringify(m);
check(JSON.stringify(E.migrateSave(redo)) === ref, 'mig가 없어 처음부터 다시 돌아도 결과가 같음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
