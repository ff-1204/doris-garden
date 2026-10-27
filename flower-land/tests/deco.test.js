// 정원 장식 (P17-16): 달마다 들어오는 장식 사기 · 놓기 · 거두기 · 꾸밈 도감 · 칭호 문장 장식
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
// 5월(벤치가 들어오는 달)로 맞춤
let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 4000; i++) { const c = E.calendar(t); if (c.month === 5 && !c.frozen) break; t += H / 4; }
const st = E.create(t, () => 0.5);
const cal = E.calendar(st.virtual);

console.log('[달마다 하나]');
check(E.MONTHS.every(m => E.DECO_KEYS.filter(k => !E.DECOS[k].months && E.DECOS[k].month === m).length === 1), '14달에 하나씩 (+ 여름 벌통)');
check(JSON.stringify(E.decoOffer(cal).filter(k => !E.DECOS[k].gear && !E.DECOS[k].auto)) === '["bench"]', '5월엔 나무 벤치 (늘 파는 정원 장치 · 자동 장치 빼고)');
check(E.decoTotal() === E.DECO_KEYS.length + E.GRADE_DECO_KEYS.length + E.TITLE_KEYS.length && E.DECO_KEYS.length === 25 && E.decoCount(st) === 0, '꾸밈 도감 칸 = 장식 + 등급 장식 + 칭호 문장');

console.log('[사기]');
st.money = 5000;
check(!E.buyDeco(st, 'bench').ok && st.money === 5000, '돈이 모자라면 못 삼');
st.money = 100000;
check(!E.buyDeco(st, 'pavilion').ok && st.money === 100000, '다른 달 장식은 못 삼');
check(!E.buyDeco(st, 'toString').ok && !E.buyDeco(st, 't:t_visit').ok, '없는 장식 · 칭호 문장은 못 삼');
const r = E.buyDeco(st, 'bench');
check(r.ok && st.money === 88000 && st.decos.length === 1 && r.deco.x === null, '벤치 12,000원 → 창고에');
check(st.dex.deco.bench && E.decoCount(st) === 1 && st.log.some(l => l.text.includes('🪴 나무 벤치')), '꾸밈 도감 등록 · 일지');
const r2 = E.buyDeco(st, 'bench');
check(r2.ok && st.decos.length === 2 && E.decoCount(st) === 1 && st.log.filter(l => l.text.includes('🪴 나무 벤치')).length === 1, '같은 장식을 또 살 수 있음 (도감은 한 칸 · 일지 한 번)');

console.log('[놓기 · 거두기]');
const d = r.deco;
check(E.placeDeco(st, d.id, 3, 4).ok && d.x === 3 && d.y === 4 && E.decoAt(st, 3, 4) === d, '빈 칸에 놓음');
check(!E.placeDeco(st, r2.deco.id, 3, 4).ok, '장식 있는 칸에 다른 장식은 안 됨');
check(!E.placeDeco(st, d.id, -1, 0).ok && !E.placeDeco(st, d.id, E.W, 0).ok, '정원 밖은 안 됨');
check(E.placeDeco(st, d.id, 5, 5).ok && !E.decoAt(st, 3, 4), '다시 놓으면 옮겨짐');
// 심기는 장식 칸에 안 됨 (이달에 심을 수 있는 꽃으로)
const sk = E.FLOWER_KEYS.find(k => E.FLOWERS[k].sow.includes(E.calendar(st.virtual).month));
E.buy(st, sk, 1); const it = st.items[st.items.length - 1];
const pr = E.plant(st, it.id, 5, 5, () => 0);
check(!pr.ok && pr.msg.includes('장식'), '장식 칸에는 심지 못함 (' + pr.msg + ')');
check(E.plant(st, it.id, 6, 5, () => 0).ok, '옆 빈 칸에는 심어짐');
check(E.storeDeco(st, d.id).ok && d.x === null && !E.decoAt(st, 5, 5), '거두면 창고로');
check(!E.placeDeco(st, 99999, 1, 1).ok && !E.storeDeco(st, 99999).ok, '없는 장식 id는 거절');
// 꽃이 있는 칸엔 못 놓음
const f0 = { id: 9100, type: 'chamomile', x: 8, y: 8, q: 0.5, stage: 'young', withered: false };
st.flowers.push(f0);
check(!E.placeDeco(st, d.id, 8, 8).ok, '꽃이 있는 칸에는 못 놓음');
st.flowers.pop();

console.log('[칭호 문장]');
const st2 = E.create(t, () => 0.5);
st2.onboarded = true; E.checkJournal(st2, { live: false });
check(st2.titles.t_visit != null && st2.decos.some(z => z.key === 't:t_visit') && st2.dex.deco['t:t_visit'], '칭호를 얻으면 문장 장식이 창고에');
check(E.decoInfo('t:t_visit').name.endsWith('문장') && E.decoInfo('t:nope') === null && E.decoInfo('nope') === null, '문장 이름 · 없는 키');
const n = st2.decos.length; E.checkJournal(st2, { live: false });
check(st2.decos.length === n, '다시 판정해도 문장은 하나');

console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(st2)); delete old.decos; delete old.dex.deco; old.mig = 10;
const m = E.migrateSave(old);
check(m.decos.length === 1 && m.decos[0].key === 't:t_visit' && m.dex.deco['t:t_visit'], '이미 얻은 칭호의 문장을 소급');
const again = E.migrateSave(JSON.parse(JSON.stringify(m)));
check(again.decos.length === 1, '다시 열어도 하나');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
