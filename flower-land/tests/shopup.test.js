// P17-15 찻집 가꾸기: 손님 자리 · 찻잔 세트 · 간판 (10-06 백업 브랜치에서 10-24 되살림)
const path = require('path');
const E = require(process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'engine.js'));
let fail = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const H = E.HOUR;
// 금요일 저녁 6시(찻집 여는 때) 조금 뒤
let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 2000; i++) { const c = E.calendar(t); if (c.idx === 9 && c.yh - 9 * 12 < 0.2) break; t += H / 4; }
const st = E.create(t + 0.05 * H);
const sh = E.shopOf(st);
check(sh.seats === 1 && sh.cup === 'baekja' && sh.sign === 'wood', '처음엔 1자리 · 백자 · 나무 팻말');
check(E.cupSellH(st) === 1, '1자리는 1시간에 한 잔');
st.money = 10000;
check(!E.addSeat(st).ok && sh.seats === 1, '돈이 모자라면 자리를 못 늘림');
st.money = 200000;
check(E.addSeat(st).ok && sh.seats === 2 && st.money === 170000, '2자리 30,000원');
check(E.cupSellH(st) === 0.5, '2자리는 30분에 한 잔');
check(E.addSeat(st).ok && sh.seats === 3 && st.money === 90000, '3자리 80,000원');
check(!E.addSeat(st).ok, '3자리가 끝');
// 찻잔 4잔을 1시간 동안 → 3잔 팔림
st.cups = [0, 1, 2, 3].map(i => ({ id: 900 + i, kind: 'tea', type: 'chamomile', q: 0.6, brewAbs: E.calendar(st.virtual).abs }));
const m0 = st.money;
E.advance(st, st.virtual + 1.01 * H);
check(st.cups.length === 1 && st.money > m0, `3자리면 1시간에 3잔 (남은 잔 ${st.cups.length})`);
// 찻잔 세트 · 간판
const m1 = st.money;
check(E.buyDecor(st, 'cup', 'cheongja').ok && sh.cup === 'cheongja' && st.money === m1 - 8000, '청자 찻잔 8,000원, 바로 씀');
check(E.buyDecor(st, 'cup', 'baekja').ok && sh.cup === 'baekja' && st.money === m1 - 8000, '가진 찻잔으로 바꾸기는 공짜');
check(E.buyDecor(st, 'cup', 'cheongja').ok && st.money === m1 - 8000, '다시 청자로도 공짜');
check(E.buyDecor(st, 'sign', 'lantern').ok && sh.sign === 'lantern' && st.money === m1 - 18000, '등불 간판 10,000원');
st.money = 100;
check(!E.buyDecor(st, 'cup', 'kkot').ok && sh.cup === 'cheongja', '돈이 모자라면 못 삼');
check(!E.buyDecor(st, 'cup', 'toString').ok && !E.buyDecor(st, 'seat', 'wood').ok && sh.cup === 'cheongja', '없는 물건 · 종류는 거절');
const fresh = E.create(t); check(fresh.shop && fresh.shop.seats === 1, '새 정원에 shop이 있음');
const old = JSON.parse(JSON.stringify(fresh)); delete old.shop; delete old.mig; check(E.migrateSave(old).shop.seats === 1, '예전 저장도 열면 shop이 생김');
console.log(fail ? `결과: ${fail}개 실패` : '결과: 모두 통과');
