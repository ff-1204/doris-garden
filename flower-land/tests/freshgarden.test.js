// ☁️ 거의 새 정원이면 "어느 정원을 쓸까요?"를 묻지 않음 · 요약에 시작한 날 · 꽃 수 (P20-06-05 · 06, 10-27 사용자 요청)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
// 첫 안내 → 이웃의 화분 → 도감일지 (화면 startGarden과 같은 순서)
const started = (at) => { const s = E.create(at, () => 0.5); s.onboarded = true; E.giftPot(s, ctx); E.checkJournal(s, ctx); return s; };

console.log('[거의 새 정원]');
const raw = E.create(MON + 30 * H, () => 0.5);
check(E.freshGarden(raw), '첫 안내 전 정원');
const st = started(MON + 30 * H);
check(st.flowers.length === 1 && st.flowers[0].origin === '이웃' && E.freshGarden(st), '이웃의 화분만 받은 정원');
const later = copy(st); E.advance(later, later.virtual + 5 * 24 * H, ctx); E.checkJournal(later, ctx);
check(later.money > st.money && E.freshGarden(later), '며칠 지나 용돈 · 화분 꽃 · 도감 · 한 해 기록이 저절로 늘어도 새 정원');
const titled = copy(st); E.giveCloudReward(titled, null, MON, ctx);
check(E.freshGarden(titled), '칭호 문장 · 덤 장식(구름 돌)은 직접 한 것이 아님');
check(!E.freshGarden(null), '정원이 없으면 아님');

console.log('[직접 한 것이 있으면 아님]');
const not = (fn, m) => { const s = copy(st); fn(s); check(!E.freshGarden(s), m); };
const sow = E.FLOWER_KEYS.find(k => E.FLOWERS[k].sow.includes(E.calendar(st.virtual).month));
not(s => { const r = E.buy(s, sow, 1); if (!r.ok) throw new Error(r.msg); }, '씨앗을 삼');
not(s => { s.flowers.push(Object.assign(copy(s.flowers[0]), { id: 999, x: 0, y: 0, origin: '화원' })); }, '직접 심은 꽃');
not(s => { s.water = 9; }, '물을 줌 (돌보기 도구를 씀)');
not(s => { s.petals.push({ id: 998, type: 'chamomile', q: 0.8 }); }, '수확한 꽃잎');
not(s => { s.dex.petal.chamomile = true; s.petals = []; }, '꽃잎을 거둔 적 있음 (다 써도)');
not(s => { s.stats.cups = 1; }, '찻잔을 팖');
not(s => { s.stats.dug = 1; }, '광산을 팜');
not(s => { s.decos.push({ id: 997, key: 'bench', x: null, y: null }); }, '장식을 삼');
not(s => { s.shop.seats = 2; }, '찻집 자리를 더함');
not(s => { s.reservations.push({ type: 'rose' }); }, '꽃잠 예약');
not(s => { s.letterBox.push({ k: 'x' }); }, '선물 답장을 받음');

console.log('[묻지 않고 고르기]');
check(E.freshPick(true, false) === 'remote', '이 기기가 새 정원 · 드라이브는 진행됨 → 드라이브 정원');
check(E.freshPick(false, true) === 'local', '드라이브가 새 정원 · 이 기기는 진행됨 → 이 기기 정원');
check(E.freshPick(true, true) === 'remote', '둘 다 새 정원 → 드라이브 정원');
check(E.freshPick(false, false) === null, '둘 다 진행됨 → 묻기');
const d = E.cloudDecide({ gardenId: st.gardenId, actAt: null }, null, { gardenId: 'other-1', savedAt: MON });
check(d.act === 'ask' && d.why === 'other', '다른 정원일 때만 이 판단을 씀 (cloudDecide other)');
const same = E.cloudDecide({ gardenId: 'g', actAt: MON }, { gardenId: 'g', savedAt: MON }, { gardenId: 'g', savedAt: MON + H });
check(same.act === 'remote', '넘어간 뒤 같은 정원은 기존 규칙 그대로');

console.log('[요약: 시작한 날 · 꽃 수]');
const born = MON + 7 * H, b = E.create(born, () => 0.5); b.gardenId = born.toString(36) + '-abc123';
check(E.gardenBorn(b) === born && E.saveSummary(b).born === born, '이름표에서 만든 때를 읽음');
check(E.gardenBorn({ gardenId: 'zz' }) === null && E.gardenBorn({}) === null, '알 수 없는 이름표는 null (화면에 —)');
const f0 = E.create(MON, () => 0.5); f0.gardenId = Date.now().toString(36) + '-x';
check(Math.abs(E.gardenBorn(f0) - Date.now()) < 5000, '새 이름표는 지금');
check(E.saveSummary(st).flowers === 1 && E.saveSummary(raw).flowers === 0, '정원에 있는 꽃 수');
const w = copy(st); w.flowers[0].withered = true;
check(E.saveSummary(w).flowers === 0, '시든 꽃은 세지 않음');
const back = E.parseSave(JSON.stringify(E.makeSave(st, MON)));
check(back.ok && back.data.summary.flowers === 1 && back.data.summary.born === E.gardenBorn(st), '저장 파일 요약에도 들어감');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
