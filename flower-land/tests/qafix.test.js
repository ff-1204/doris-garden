// QA 1 · 2회차(10-24)에서 찾은 것들이 다시 생기지 않게
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[개수 · 이름 검사]');
const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.money = 100000;
const m0 = st.money;
check(!E.buy(st, 'chamomile', -2).ok && !E.buy(st, 'chamomile', 1.5).ok && !E.buy(st, 'chamomile', 0).ok && st.money === m0, '꽃: 음수 · 소수 · 0개는 거절 (돈 그대로)');
check(!E.buy(st, 'toString', 1).ok, '꽃: 없는 이름은 거절');
check(!E.buySupply(st, 'water', -3).ok && !E.buySupply(st, '__proto__', 1).ok && st.money === m0, '용품: 음수 · 없는 이름은 거절');
check(E.buy(st, 'chamomile').ok && E.buySupply(st, 'water').ok, '개수를 안 주면 1개');

console.log('[저장 파일 format]');
const d = E.makeSave(st, 1); delete d.format;
check(E.parseSave(JSON.stringify(d)).msg === '파일이 손상됐어요', 'format이 없으면 "파일이 손상됐어요"');

console.log('[정원 칸은 정수만]');
const dd = (() => { const s2 = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); s2.money = 1e6; return s2; })();
const deco = E.buyDeco(dd, 'stepstone').deco;
for (const [x, y] of [[1.5, 2], ['3', 4], ['', ''], [null, null], [NaN, 1]]) check(!E.placeDeco(dd, deco.id, x, y).ok && deco.x === null, `장식 (${JSON.stringify(x)}, ${JSON.stringify(y)}) 거절`);
E.buy(dd, 'chamomile', 1); const it = dd.items[dd.items.length - 1];
check(!E.plant(dd, it.id, 2.5, 3, () => 0).ok && !E.plant(dd, it.id, '2', 3, () => 0).ok, '심기도 정수 칸만');
check(E.placeDeco(dd, deco.id, 4, 4).msg.endsWith('놓았어요') && E.placeDeco(dd, deco.id, 5, 4).msg.endsWith('옮겼어요'), '처음엔 "놓았어요", 옮기면 "옮겼어요"');

console.log('[창고에 넣는 벌통의 꿀]');
const hv = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); hv.money = 1e6;
const hd = E.buyDeco(hv, 'hive').deco; E.placeDeco(hv, hd.id, 3, 3); hd.honey = ['lavender', 'wild'];
const sr = E.storeDeco(hv, hd.id);
check(sr.ok && sr.msg.includes('꿀 2병') && hv.honey.lavender === 1 && hv.honey.wild === 1 && !hd.honey.length, '꿀은 꿀 선반으로 함께 거둠');

console.log('[벌통은 달이 끝날 때 실제로 모음]');
const ad = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); ad.money = 1e6;
const ah = E.buyDeco(ad, 'hive').deco; E.placeDeco(ad, ah.id, 10, 10);
for (let i = 0; i < 3; i++) ad.flowers.push({ id: 8000 + i, type: 'lavender', x: 9 + i, y: 11, q: 0.7, startQ: 0.7, stage: 'bloom', withered: false, bloomed: true, ageH: 3000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 });
const cal0 = E.calendar(ad.virtual);
ad.flowers.forEach(f => { f.waterH = 99; });
E.advance(ad, cal0.slotEnd + 0.2 * H, { live: false, rng: () => 0.5 });
check((ah.honey || []).length >= 1, `6월이 끝나면 꿀이 모임 (${(ah.honey || []).join(',')})`);

console.log('[세는 말]');
const tr = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);
tr.flowers.push({ id: 9000, type: 'maehwa', x: 2, y: 2, q: 0.7, startQ: 0.7, stage: 'young', withered: false, ageH: 50, waterH: 0, weedH: 0, pruneH: 0, fertH: 0, thirstH: 5, adaptH: 0, harvestKey: -1, bloomKey: -1 });
const wr = E.care(tr, 'water', [[2, 2]], { live: false });
check(wr.ok && wr.msg.startsWith('1그루'), `나무는 "그루" (${wr.msg})`);

console.log('[한 포기의 기적]');
const mk = startQ => { const s = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); s.flowers.push({ id: 1, type: 'chamomile', x: 1, y: 1, q: 1, startQ, stage: 'bloom', withered: false }); return s; };
check(!E.TITLES.t_miracle.test(mk(1)), '100%로 산 꽃이 100%로 피면 아님');
check(E.TITLES.t_miracle.test(mk(0.7)), '70%로 심은 꽃을 100%로 피우면 칭호');

console.log('[빠진 칸이 있는 저장]');
const br = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete br.cups; delete br.blends;
let okOpen = true; try { E.migrateSave(br); } catch (e) { okOpen = false; }
check(okOpen && Array.isArray(br.cups), 'mig가 끝난 저장에 cups · blends가 없어도 열림');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
