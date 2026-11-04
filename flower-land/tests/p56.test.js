// P56 🫖 티백 우리는 시간 (11-02 사용자 요청 "찻집에서 티백 우리는 시간도 추가해줘. 대신 짧게"): 손으로 우린 잔은 3분 동안 우림 — 팔기 · 자동 판매 · 주문 안 됨. 🫖 도우미 잔은 바로
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MIN = 60e3, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const tea = (st, type, q) => { const t = { id: st.nextId++, type: type || 'rose', q: q == null ? 0.7 : q, seasonKey: -1, hat: false }; st.teas.push(t); return t; };
const garden = at => { const st = E.create(MON); E.advance(st, at, ctx); st.teas = []; st.blends = []; st.cups = []; st.cupTimerH = 0; return st; };

console.log('[우린 직후: 팔기 · 주문 · 자동 판매 안 됨]');
{
  const st = garden(MON + 2 * H + MIN);
  check(E.STEEP_H * 60 === 3, '우리는 시간은 3분');
  const t = tea(st), b = { id: st.nextId++, parts: ['chamomile', 'rose'], q: 0.8, recipe: 'springfield', name: '봄 들판', bagged: true }; st.blends.push(b);
  const r = E.brew(st, [t.id], [b.id]);
  check(r.ok && r.msg === '차 2잔을 우리고 있어요 🫖 · 3분 뒤 팔 수 있어요', '우리기 문구');
  check(st.cups.length === 2 && st.cups.every(c => E.cupSteeping(st, c)), '티백 · 블렌드 티백 모두 우리는 중');
  check(E.steepText(st, st.cups[0]) === '🫖 우리는 중 · 3분', '카드 한 마디: 🫖 우리는 중 · 3분');
  st.orders = { abs: E.calendar(st.virtual).abs, list: [{ kind: 'any', done: false }] };
  const m0 = st.money, s = E.sellCups(st, st.cups.map(c => c.id), ctx);
  check(!s.ok && s.msg === '아직 우리는 중이에요 · 조금만 기다려요' && st.money === m0 && st.cups.length === 2, '손으로 팔기 막힘');
  check(!st.orders.list[0].done, '주문도 그대로');
  E.advance(st, st.virtual + 47e3, ctx);
  check(E.steepText(st, st.cups[0]) === '🫖 우리는 중 · 2분 13초', '47초 뒤: 2분 13초');
  st.settings = st.settings || {}; st.settings.slow = true;
  check(E.steepText(st, st.cups[0]) === '🫖 우리는 중', '🐢 느긋하게 보기면 숫자 없이');
  st.settings.slow = false;
  E.advance(st, st.virtual + 2 * MIN, ctx);
  check(st.cups.length === 2 && st.money === m0 && !(st.cupTimerH > 0), '2분 47초: 카운터 손님도 기다림 (타이머 0)');
  E.advance(st, st.virtual + 15e3, ctx);
  check(st.cups.every(c => !E.cupSteeping(st, c)) && E.steepText(st, st.cups[0]) === '', '3분 지나면 다 우림');
  const s2 = E.sellCups(st, [st.cups[0].id], ctx);
  check(s2.ok && st.money > m0 && st.orders.list[0].done, '3분 뒤 팔기 · 주문 채움');
}

console.log('[자동 판매: 우리는 잔은 건너뜀 · 다 우리면 팔림]');
{
  const st = garden(MON + 2 * H + MIN);
  st.cups.push({ ...tea(st, 'rose'), id: st.nextId++, kind: 'tea', brewAbs: E.calendar(st.virtual).abs }); st.teas = [];   // 예전 찻잔 (steepUntil 없음)
  tea(st, 'lavender'); E.brew(st, st.teas.map(t => t.id), []);
  check(!E.cupSteeping(st, st.cups[0]) && E.cupSteeping(st, st.cups[1]), '예전 찻잔은 다 우린 것 · 새 잔은 우리는 중');
  st.cupTimerH = E.cupSellH(st) - 0.01;
  E.advance(st, st.virtual + MIN, ctx);
  check(st.cups.length === 1 && st.cups[0].type === 'lavender', '예전 찻잔은 바로 자동으로 팔림, 우리는 잔은 남음');
  E.advance(st, st.virtual + 30 * MIN, ctx);
  check(st.cups.length === 1, '다 우렸어도 다음 손님 차례 전엔 그대로');
  E.advance(st, st.virtual + E.cupSellH(st) * H, ctx);
  check(st.cups.length === 0, '다 우린 뒤 손님 한 시간 → 팔림');
  const st2 = garden(MON + 2 * H + MIN);
  st2.cups.push({ id: st2.nextId++, type: 'rose', q: 0.7, seasonKey: -1, hat: false, kind: 'tea', brewAbs: E.calendar(st2.virtual).abs });
  const m0 = st2.money;
  check(E.sellCups(st2, st2.cups.map(c => c.id), ctx).ok && st2.money > m0, '예전 찻잔(필드 없음)은 손으로도 팔림');
}

console.log('[🫖 찻집 도우미 잔은 바로]');
{
  const st = garden(MON + 2 * H + MIN), d = E.addDeco(st, 'teastand'); d.x = 0; d.y = 0;
  tea(st, 'rose'); tea(st, 'rose');
  const n = E.helperTick(st, E.calendar(st.virtual));
  check(n === 2 && st.cups.every(c => c.auto && !c.steepUntil && !E.cupSteeping(st, c)), '도우미가 우린 잔은 우리는 시간 없음');
  const m0 = st.money;
  check(E.sellCups(st, st.cups.map(c => c.id), ctx).ok && st.money > m0, '바로 팔 수 있음');
}

console.log('[저장 · 불러오기]');
{
  const st = garden(MON + 2 * H + MIN); tea(st); E.brew(st, st.teas.map(t => t.id), []);
  const r = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const g = r.ok && r.data.game; if (g) E.migrateSave(g);
  check(g && g.cups[0].steepUntil === st.cups[0].steepUntil && E.cupSteeping(g, g.cups[0]), '불러온 뒤에도 우리는 중');
  if (g) { E.advance(g, g.virtual + 3 * MIN + 1e3, ctx); check(!E.cupSteeping(g, g.cups[0]) && E.sellCups(g, g.cups.map(c => c.id), ctx).ok, '불러온 정원에서도 3분 뒤 팔림'); }
}

console.log('[꽃잠 · 시간이 거꾸로 가도 멈추지 않음]');
{
  const st = garden(MON + 6 * 24 * H + 2 * H);   // 일요일 = 꽃잠
  const cal = E.calendar(st.virtual);
  check(cal.frozen && E.teaShopOpen(cal), '꽃잠에도 찻집은 열림');
  tea(st); E.brew(st, st.teas.map(t => t.id), []);
  check(E.cupSteeping(st, st.cups[0]), '꽃잠에도 우리는 중');
  E.advance(st, st.virtual + 3 * MIN + 1e3, ctx);
  check(!E.cupSteeping(st, st.cups[0]), '꽃잠에도 virtual이 흘러 3분 뒤 다 우림');
  st.cups[0].steepUntil = st.virtual + 5 * H;   // 시간이 거꾸로 간 정원 (다른 기기 · 불러오기)
  check(!E.cupSteeping(st, st.cups[0]) && E.sellCups(st, [st.cups[0].id], ctx).ok, '남은 시간이 3분보다 길면 다 우린 것 (영원히 안 멈춤)');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
