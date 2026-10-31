// 🍯 꿀 (P18): 벌통 사기 · 둘레의 핀 꽃으로 꿀 종류와 양 · 꽃잠엔 쉼 · 거두기 · 찻잔에 한 숟갈
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = (pred) => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const bloom = (st, type, x, y) => { const f = { id: E.HOUR + st.nextId++, type, x, y, q: 0.6, stage: 'bloom', withered: false, bloomed: true }; st.flowers.push(f); return f; };

console.log('[벌통 사기]');
const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5);
st.money = 100000; st.bonus.hive = 1; st.grade.xp = E.gradeXpAt(6);   // P39 기르기 1단계(둘레 2칸 · 6병) · 등급 6부터
check(E.DECOS.hive.auto && E.DECOS.hive.insect, 'P39 화원엔 벌통이 없음 (🐝 곤충농장에서 데려옴)');
const r = E.buyDeco(st, 'hive');
check(r.ok && st.money === 85000, '벌통 15,000원');
check(!E.buyDeco(st, 'hive').ok && st.money === 85000, '벌통은 하나만');
const st5 = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); st5.money = 100000;
check(!E.buyDeco(st5, 'hive').ok, 'P39 등급 6 전엔 못 데려옴');
st5.grade.xp = E.gradeXpAt(6);
check(E.buyDeco(st5, 'hive').ok, 'P39 5월에도 데려옴 (언제든)');

console.log('[꿀 종류 · 양]');
check(E.honeyOf([]) === null, '핀 꽃이 없으면 꿀이 없음');
const mk = (types) => types.map(t => ({ type: t }));
check(JSON.stringify(E.honeyOf(mk(['lavender']))) === '{"type":"lavender","jars":1}', '라벤더 하나 → 라벤더꿀 1병');
check(JSON.stringify(E.honeyOf(mk(['lavender', 'lavender', 'chamomile']))) === '{"type":"lavender","jars":2}', '3포기 → 2병, 많은 꽃을 따라감');
check(E.honeyOf(mk(['lavender', 'chamomile', 'rose', 'jasmine', 'lotus', 'gamguk'])).type === 'wild', '여러 꽃이 고루 섞이면 들꽃꿀');
check(E.honeyOf(mk(Array(7).fill('lotus'))).jars === 3, '6포기 넘으면 3병');
check(E.honeyName('wild') === '들꽃꿀' && E.honeyName('lavender') === '라벤더꿀', '꿀 이름');

console.log('[달이 끝날 때 모임]');
const d = r.deco; E.placeDeco(st, d.id, 10, 10);
bloom(st, 'lavender', 11, 11); bloom(st, 'lavender', 12, 10); bloom(st, 'chamomile', 8, 8);
bloom(st, 'rose', 13, 13);   // 3칸 떨어짐 → 안 셈
check(E.hiveBlooms(st, d).length === 3, '둘레 2칸(대각선 포함)만 셈');
E.hiveTick(st);
check(JSON.stringify(d.honey) === '["lavender","lavender"]' && st.log.some(l => l.text.includes('라벤더꿀 2병')), '라벤더꿀 2병 · 일지');
for (let i = 0; i < 5; i++) E.hiveTick(st);
check(d.honey.length === E.hiveMax(st) && E.hiveMax(st) === 6 && E.HIVE_MAX === 3, `벌통은 ${E.hiveMax(st)}병까지 (P38 0단계는 ${E.HIVE_MAX}병)`);
const stored = E.create(st.virtual, () => 0.5); stored.money = 1e6; stored.grade.xp = E.gradeXpAt(6); const sd = E.buyDeco(stored, 'hive').deco;
bloom(stored, 'lavender', 1, 1); E.hiveTick(stored);
check(!sd.honey || !sd.honey.length, '창고에 있는 벌통은 꿀을 모으지 않음');

console.log('[꽃잠엔 벌도 쉼]');
const sl = E.create(at(c => c.month === 13), () => 0.5); sl.money = 1e6;
sl.decos = [{ id: 500, key: 'hive', x: 5, y: 5 }];
bloom(sl, 'lavender', 5, 6);
const end13 = E.calendar(sl.virtual).slotEnd;
E.advance(sl, end13 + 0.5 * H);
check(!(sl.decos[0].honey || []).length, '꽃잠 달이 끝나도 꿀이 없음');

console.log('[거두기 · 찻잔에 한 숟갈]');
check(!E.takeHoney(st, 99999).ok, '없는 벌통은 거절');
const tk = E.takeHoney(st, d.id);
check(tk.ok && st.honey.lavender === 6 && d.honey.length === 0 && st.dex.honey.lavender && E.honeyCount(st) === 1, '거두면 꿀 선반 · 꿀 도감');
check(!E.takeHoney(st, d.id).ok, '빈 벌통은 거절');
st.cups = [{ id: 700, kind: 'tea', type: 'chamomile', q: 0.6, brewAbs: E.calendar(st.virtual).abs }];
const cal = E.calendar(st.virtual), v0 = E.cupValue(st, st.cups[0], cal);
check(!E.honeyCup(st, 700, 'rose').ok, '없는 꿀은 못 넣음');
check(E.honeyCup(st, 700, 'lavender').ok && st.cups[0].honey === 'lavender' && st.honey.lavender === 5, '한 숟갈 넣으면 하나 줄어듦');
check(!E.honeyCup(st, 700, 'lavender').ok, '한 잔에 한 번만');
check(E.cupValue(st, st.cups[0], cal) === v0, '꿀을 넣어도 값은 그대로 (P18-07)');

console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(st5)); delete old.honey; delete old.dex.honey; old.mig = 11;
const m = E.migrateSave(old);
check(m.honey && m.dex.honey && m.mig === E.MIGRATIONS.length, '꿀 선반 · 꿀 도감 칸이 생김');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
