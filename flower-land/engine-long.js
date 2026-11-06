// 도리의 정원 — 게임 규칙 엔진 조각 9/10: 🌸 새 철 · 🛤️ 철의 길 · 🌳 층 · 🗓️ 올해만 · 🍃 그동안 · 🐾 특별 손님 · 🌳 작은 숲
// P66(11-03): 예전 한 파일 engine.js(줄 3063 ~ 3543)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 🌸 새 철 다시 시작 (P28-08, M3-3 10-30)
// P28-08-00 고르는 것이지 해야 하는 것이 아님: 안 해도 손해 없음 · 창으로 재촉하지 않음 — 엔진은 꽃잠 기록 끝 한 줄(seasonHint)만, 알림 · 이벤트 없음
// P28-08-01 조건: 이번 철에 쉼달 기록 3해 + 꽃 도감 13종. 해는 yearLog의 이번 철 줄 수로 셈 (해 번호는 철마다 1부터라 줄로 — 0년차 꽃잠은 줄이 없어 안 셈)
//   꽃잠(쉼달 · 꽃샘달)에만 시작 → 그 꽃잠은 새 철 0년차, 다음 월요일 3월이 1년차 (P04-05 꽃잠 시작과 같은 꼴)
const SEASON_YEARS = 3;
const SEASON_TITLES = Object.keys(TITLES).filter(k => TITLES[k].season);   // P28-08-04 2 · 3 · 5철 숨은 칭호
const newSeason = () => ({ n: 1, startedAt: null, path: null, log: [] });   // path: P30-04 철의 길 (PATHS 키 | null) · log: 끝난 철마다 { n, startedAt, endedAt, years, grade, sold, path } (P30-04-03 철마다 표)
// ---------------------------------------------------------------- 🛤️ 철의 길 (P30-04-01, L2-1 10-30)
// 새 철을 시작할 때 하나 고름(1철은 길 없이) · 철 가운데엔 안 바뀜. 길이 바꾸는 것은 넷뿐: ① 주간 목표 뽑는 쪽(fams) ② 그 길에만 오는 손님(VISITORS path)
//   ③ 그 길로 한 철을 마치면 길 칭호(TITLES path) ④ 그 철 한 해 기록 카드 테두리(color). 돈 · 수확 · 꽃 값 · 경험치 배율은 없음 (P17-14 — path.test.js · 시뮬 --path)
const PATHS = {
  flower: { name: '꽃길', icon: '🌸', color: '#d98aa8', fams: ['petal', 'tidy', 'prop'], desc: '꽃잎 · ★ 품질 · 번식 쪽 주간 목표와 꽃길 손님' },
  tea: { name: '찻길', icon: '🍵', color: '#8faa6c', fams: ['cup', 'teabag', 'blend', 'order'], desc: '찻잔 · 블렌드 · 손님 주문 쪽 주간 목표와 찻길 손님' },
  earth: { name: '흙길', icon: '⛏️', color: '#b08a5a', fams: ['dig'], desc: '광산 파기 · 계단 쪽 주간 목표와 흙길 손님' },
};
const PATH_KEYS = Object.keys(PATHS);
const PATH_NONE = { name: '길 없이', icon: '🌿', color: null, desc: '지금처럼 — 어느 쪽에도 쏠리지 않아요' };
const seasonPath = st => (st && st.season && PATHS[st.season.path]) ? st.season.path : null;
const pathInfo = k => PATHS[k] || PATH_NONE;
const pathTitle = k => Object.keys(TITLES).find(t => TITLES[t].path === k) || null;
// 화면이 읽음: 지금 길 (길 없이면 null). 느긋하게 보기여도 보임 (숫자가 아님)
const pathBadge = st => { const k = seasonPath(st); return k ? { key: k, icon: PATHS[k].icon, name: PATHS[k].name, color: PATHS[k].color, text: `${PATHS[k].icon} ${PATHS[k].name}` } : null; };
// P30-04-03 철마다 표: 끝난 철(log) + 지금 철(now: true "진행 중"). 2철부터 · 느긋하게 보기면 null (P30-08)
function seasonTable(st) {
  const n = seasonN(st); if (n < 2 || slowView(st)) return null;
  const row = e => { const P = pathInfo(e.path); return { n: e.n, path: PATHS[e.path] ? e.path : null, pathName: P.name, pathIcon: P.icon, years: e.years, grade: e.grade == null ? null : e.grade, sold: typeof e.sold === 'number' ? e.sold : null, now: false }; };
  const rows = ((st.season && st.season.log) || []).map(row), cur = seasonRows(st, n);
  const sold = cur.some(x => typeof x.sold === 'number') ? cur.reduce((a, x) => a + (x.sold || 0), 0) : null;
  rows.push(Object.assign(row({ n, path: seasonPath(st), years: cur.length, grade: gradeOf(st).grade, sold }), { now: true }));
  return rows;
}
const seasonN = st => Math.max(1, Math.floor(+((st && st.season && st.season.n) || 1)));
const seasonRows = (st, n) => ((st && st.yearLog) || []).filter(r => rowSeason(r) === (n || seasonN(st)));
function seasonReady(st) {
  const years = seasonRows(st).length, flowers = FLOWER_KEYS.filter(k => st.dex && st.dex.flower && st.dex.flower[k]).length;
  return { ready: years >= SEASON_YEARS && flowers >= FLOWER_KEYS.length, years, flowers, need: { years: SEASON_YEARS, flowers: FLOWER_KEYS.length } };
}
const seasonCanStart = (st, cal) => !!(cal || calendar(st.virtual)).frozen && seasonReady(st).ready;
// P28-08-01 · 05 꽃잠 한 해 기록 끝 한 줄 (창 없음). 시작할 수 없으면 null — 느긋하게 보기여도 숫자가 없어 그대로
const seasonHint = (st, cal) => seasonCanStart(st, cal) ? '🌸 새 철을 시작할 수 있어요' : null;
// P28-08-04 위 막대 "🌸 2철" — 1철이면 null. 느긋하게 보기 판단은 화면(M3-4)
const seasonBadge = st => { const n = seasonN(st); return n >= 2 ? { n, text: `🌸 ${n}철` } : null; };
// P28-08-05 📈 해마다 그래프 철 경계선 (M3-4): 줄 목록에서 바로 앞 줄과 철이 달라지는 자리 → [{ i, n }] (i = 그 철 첫 줄, n = 몇 철). 첫 줄은 경계가 아님
const seasonBreaks = rows => (rows || []).reduce((out, r, i) => (i > 0 && rowSeason(r) !== rowSeason(rows[i - 1]) ? [...out, { i, n: rowSeason(r) }] : out), []);
// P28-08-02 이어지는 것 (그 밖은 새 정원 _create 값으로 비워짐): 등급 · 경험치 · 🌟 손길 점과 고른 보너스 · 칭호 · 대표 칭호 · 도감 전부 · 도감일지(끝낸 퀘스트 ✅, 못 끝낸 퀘스트는 새 철에서 이어서)
//   · 쌓인 기록(판 잔 · 주문 같은 stats, 해마다 기록 · 한 해 기록 카드 · 최고 점수) · 받은 편지함 · 오는 중인 답장 · 📮 받은 편지 · 설정 · ☁️ 계정 · 다시 시작 표시 · 정원 이름표(드라이브는 같은 정원)
//   · 🪑 찻집 가꾸기 · 장식 보유(🧺 자동 장치는 놓인 자리 그대로 — 열린 질문 ①, 나머지는 창고 🪴로) · 첫 안내 · 이웃의 화분 · 첫 꽃 · 첫 손님 표시 · 꽃잠 시작 표시(「꽃잠에 온 손님」을 새로 주지 않게)
//   · 이번 주 목표(같은 주에 다시 뽑으면 경험치를 두 번 받아서 — 월요일에 저절로 바뀜) · 마지막 파일 저장 · 마지막으로 손댄 때 · 이름표 번호(nextId)
const SEASON_KEEP = ['grade', 'bonus', 'bonusOwn', 'speedSteps', 'bonusFree', 'pollenExtra', 'titles', 'titleOn', 'dex', 'journal', 'stats', 'yearLog', 'records', 'bestScore', 'letterBox', 'letterPending', 'mailGot', 'settings', 'account', 'resetAt', 'gardenId',
  'shop', 'decos', 'onboarded', 'guide', 'gift', 'firstFlower', 'ownBloom', 'firstGuest', 'starterGift', 'startedInSleep', 'weekly', 'restClosed', 'lastExport', 'lastReal', 'actAt', 'speed', 'nextId', '_newTitles', 'layers', 'yearly', 'visitors', 'forest', 'mailSeenAt', 'awayLast', 'farm', 'jar', 'topDeco', 'presol'];   // presol: P53 🧪 특수 용액은 유리 관처럼 이어짐 (꽃방 유리 돔 · 창고 프리저브드는 팔 물건이라 찻잔 · 티백처럼 비워짐)   // topDeco: P52 ⬆️ 위 칸 장식은 정원이 아니라 그대로   // layers: P30-01-01 정원의 층 (연 해는 누적 해 수라 철을 넘겨도 그대로) · yearly: P30-05-01 올해만 오는 것 (해 번호가 누적이라 달력 · 본 것 · 놓친 것 그대로) · visitors: P30-06 특별 손님 (온 횟수 · 기념품은 이어지고 앉은 손님은 seasonStart가 비움)
function seasonStart(st, ctx) {
  ctx = ctx || {};
  const path = ctx.path == null ? null : ctx.path;                           // P30-04-01 고른 길 (null = 길 없이)
  if (path != null && !PATHS[path]) return no('없는 길이에요');
  const cal = calendar(st.virtual);
  if (!cal.frozen) return no('새 철은 꽃잠에 시작해요');
  const r = seasonReady(st);
  if (!r.ready) return no(r.years < SEASON_YEARS ? `이번 철에 ${SEASON_YEARS}해를 보내면 돼요 (지금 ${r.years}해)` : `꽃 도감 ${FLOWER_KEYS.length}종을 모두 피우면 돼요 (지금 ${r.flowers}종)`);
  const n = seasonN(st), old = st.season || newSeason(), now = st.virtual, rows = seasonRows(st, n);
  const sold = rows.some(x => typeof x.sold === 'number') ? rows.reduce((a, x) => a + (x.sold || 0), 0) : null;   // 판 잔은 아는 해만 (예전 정원은 모름)
  const oldPath = seasonPath(st);
  const ended = { n, startedAt: old.startedAt == null ? null : old.startedAt, endedAt: now, years: rows.length, grade: gradeOf(st).grade, sold, path: oldPath };
  const keep = {}; for (const k of SEASON_KEEP) if (k in st) keep[k] = st[k];
  const mine = st.mine || newMine();
  for (const k of Object.keys(st)) delete st[k];                             // 화면이 같은 st를 쥐고 있어 제자리에서 바꿈
  Object.assign(st, _create(now, ctx.rng || defaultRng, cal), keep);   // R-D2        // 땅 600칸은 황무지로 새로 (create와 같은 뽑기)
  st.season = { n: n + 1, startedAt: now, path, log: [...(old.log || []), ended] };
  st.mine = Object.assign(newMine(), { deepest: mine.deepest || 1, boards: mine.boards || 0 });   // ⛏️ 주머니 · 지금 층은 비우고, 가장 깊이 간 층은 이어짐
  for (const d of st.decos || []) {
    if (d.honey) d.honey = [];                                                // 벌통에 모인 꿀도 비움
    if (!(DECOS[d.key] && DECOS[d.key].auto)) { d.x = null; d.y = null; }     // 🧺 자동 장치만 제자리, 나머지 장식은 창고 🪴로
  }
  st.decos = (st.decos || []).filter(d => { if (d.key !== 'pres') return true; st.preserved.push({ id: d.id, type: d.pres.type, mut: !!d.pres.mut }); return false; });   // P84-03 놓인 🌹 프리저브드는 창고 칸으로 돌아옴 (다른 장식처럼 잃지 않음)
  if (st.visitors) { st.visitors.now = []; st.visitors.call = null; }        // P30-06-01 앉아 있던 손님은 떠남 (장식이 창고로 감) — 온 횟수 · 기념품은 이어짐
  st.yearPace.xp0 = (st.grade && st.grade.xp) || 0;                         // P28-07-02 새 철 0년차부터 견줌 (경험치는 이어짐)
  addLog(st, 7, `🌸 ${n + 1}철을 시작했어요${path ? ` · ${PATHS[path].icon} ${PATHS[path].name}로 걸어요` : ''} · 다음 월요일 3월이 새 철 1년차예요`, ctx);
  const title = SEASON_TITLES.find(k => TITLES[k].season === n + 1) || null;   // 새 철 보상은 이 칭호뿐 — 🌟 손길 점은 더 주지 않음 (열린 질문 ②)
  if (title) giveTitle(st, title, cal, ctx);
  const pathT = oldPath ? pathTitle(oldPath) : null;                          // P30-04-01 지난 철을 길로 마쳤으면 길 칭호
  if (pathT) giveTitle(st, pathT, cal, ctx);
  return ok(`🌸 ${n + 1}철을 시작했어요`, { season: n + 1, title, pathTitle: pathT, path, ended });
}

// ---------------------------------------------------------------- 🌳 정원의 층 (P30-01-01, L1-1 10-30)
// P30-01-01 해 단위로 천천히 열리는 층. 1~3층은 이미 있는 것(찻집 · 광산)을 층으로 부를 뿐이라 정원은 바뀌지 않음 — 찻집은 첫 찻잔을 팔면, 광산은 처음 파면(주간 목표 open과 같은 기준)
//   4층부터는 앞 층을 연 뒤 흐른 해 + 모은 것. 흐른 해 = 해마다 기록(yearLog) 줄 수 — 철을 넘겨 센 누적(seasonRows가 아님), 비운 동안 따라잡기로 쌓인 줄도 셈(켜 두어야만 얻는 것 없음)
//   새 층(4층~)은 새해 3월 아침(월요일 6시, onSlot idx 0)에만 열림 — 꽃잠 가운데 · 흐르는 달 중간엔 안 열림. 수입 배율 없음 (P17-14)
// 저장 st.layers = { at: { 2: 연 때의 누적 해 수, 3: …, 4: … } } (없으면 null) — 새 철에도 이어짐 (SEASON_KEEP)
// LAYER_MAX_OPEN: 실제로 열 수 있는 가장 높은 층. L1 · L2 동안 3(4층 조건 · 남은 것만 보임) → L3에서 4 — 🌳 숲 탭 · 열림 알림이 생겨서 (P30-01-03 · P30-03, 10-30)
const LAYER_MAX_OPEN = 4;
const LAYERS = [
  null,
  { layer: 1, name: '꽃밭', icon: '🌱' },
  { layer: 2, name: '찻집', icon: '🍵', test: st => n0(st.dex && st.dex.tea) > 0, how: '찻집에서 첫 찻잔을 팔면' },
  { layer: 3, name: '광산과 벌통', icon: '⛏️', test: st => S(st, 'dug') > 0, how: '광산에서 처음 파면' },
  { layer: 4, name: '작은 숲', icon: '🌳', years: 8, dex: true, newYear: true, openText: '🌳 정원 뒤에 작은 숲이 생겼어요' },
  { layer: 5, name: null, icon: null },   // 5층부터는 자리만 (지금 범위 밖 — 연못 · 온실 후보)
];
const newLayers = () => ({ at: {} });
const layerYears = st => ((st && st.yearLog) || []).length;   // 흐른 해 (누적)
const layerDexOk = st => FLOWER_KEYS.every(k => st.dex && st.dex.flower && st.dex.flower[k]);
const layerDexN = st => FLOWER_KEYS.filter(k => st.dex && st.dex.flower && st.dex.flower[k]).length;
const layerAt = (st, n) => { const a = st.layers && st.layers.at; return a && a[n] != null ? a[n] : null; };
function layerNow(st) {   // 지금 층: 1층부터 차례로 — 1~3층은 조건이 차면 바로, 4층부터는 연 해가 저장돼 있어야
  let n = 1;
  for (let i = 2; i < LAYERS.length && LAYERS[i].name; i++) {
    const L = LAYERS[i];
    if (L.test ? L.test(st) : layerAt(st, i) != null) n = i; else break;
  }
  return n;
}
function layerNeed(st, i, max) {   // i층 조건 (4층부터): 앞 층 연 해에서 몇 해 더 · 꽃 도감
  const L = LAYERS[i], prevAt = layerAt(st, i - 1), years = layerYears(st);
  const from = prevAt == null ? years : prevAt;                     // 앞 층을 막 열었으면(아직 저장 전) 지금 해부터
  const yearsLeft = Math.max(0, from + (L.years || 0) - years);
  const dexOk = !L.dex || layerDexOk(st);
  return { needYears: L.years || 0, yearsLeft, needDex: L.dex ? FLOWER_KEYS.length : 0, dex: layerDexN(st), dexOk, ready: yearsLeft === 0 && dexOk, held: i > (max || LAYER_MAX_OPEN) };
}
function layerOf(st, max) {   // max: 열 수 있는 가장 높은 층 (기본 LAYER_MAX_OPEN — 테스트 · L3가 ctx.layerMax로 넘김)
  const n = layerNow(st), L = LAYERS[n], N = LAYERS[n + 1];
  let next = null;
  if (N && N.name) {
    next = { layer: N.layer, name: N.name, icon: N.icon };
    if (N.test) Object.assign(next, { how: N.how, needYears: 0, yearsLeft: 0, needDex: 0, dex: layerDexN(st), dexOk: true, ready: false, held: false });
    else Object.assign(next, layerNeed(st, N.layer, max));
  }
  return { layer: n, name: L.name, icon: L.icon, layers: LAYERS.filter(x => x && x.name).map(x => ({ layer: x.layer, name: x.name, icon: x.icon, open: x.layer <= n })), next };
}
function layerSync(st) {   // 1~3층: 조건이 찬 층의 연 해를 적어 둠 (onSlot 달마다) — 다음 층 남은 해가 여기서부터
  st.layers = st.layers || newLayers();
  const n = layerNow(st), y = layerYears(st);
  for (let i = 2; i <= n; i++) if (LAYERS[i].test && st.layers.at[i] == null) st.layers.at[i] = y;
}
function layerCheck(st, ctx) {   // 새해 3월 아침에만 (onSlot idx 0): 다음 층 조건이 차면 한 층만 엶
  layerSync(st);
  const o = layerOf(st, ctx && ctx.layerMax), N = o.next;
  if (!N || !LAYERS[N.layer].newYear || !N.ready || N.held) return null;
  st.layers.at[N.layer] = layerYears(st);
  addLog(st, 9, LAYERS[N.layer].openText || `${N.icon} 정원의 ${N.layer}층 ${N.name}이 열렸어요`);   // P30-01-03 알림은 화면이 onLayer로 (토스트 한 줄 · 탭이 생김, 창 없음) — 등급 줄처럼 ctx 없이
  if (N.layer === 4) ladybugGift(st, ctx);         // P39-08-02 4층 숲이 열리면 🐞 무당벌레 선물 (예전 숲 바람)
  const e = { layer: N.layer, name: N.name };
  if (ctx && ctx.onLayer) ctx.onLayer(e);
  return e;
}

// ---------------------------------------------------------------- 🗓️ 올해만 오는 것 (P30-05-01, L1-3 10-30)
// 해마다 계절(봄 · 여름 · 가을 · 겨울)마다 그해에만 오는 것 하나 — 정원 위 날씨 그림 · 올해의 꽃빛(꽃 하나가 다른 색). 그림 · 도감만, 꽃 값 · 자람 · 수확 · 경험치는 그대로 (P17-14)
// 해 번호 = 해마다 기록(yearLog) 줄 수 + 1 (층과 같음 — 철을 넘겨 누적), 계절 = 현실 요일로 정해진 달(calendar().season). 꽃잠엔 없음
// 고르기: 정원 이름표 · 해 번호 · 계절로 정해지는 차례(그 계절 3가지를 해마다 돌림, Math.random 아님). 그 계절에 놓친 것이 있으면 그것이 먼저 (retry — 몇 해를 놓쳐도 사라지지 않음)
// "봤다" = 그 계절에 정원을 한 번이라도 열었음 — 화면이 열 때 yearlyMark, 열어 둔 채 달이 바뀌면 onSlot(ctx.live). 켜 둘 필요 없음. 그 계절이 끝날 때까지 못 봤으면 missed로
// 저장 st.yearly = { at: 지금 계절 차례((해-1)×4 + 계절, 꽃잠은 -0.5 — 이보다 앞 계절은 정해짐, 처음엔 null),
//   years: [{ y, k: [계절 4개 키], f: [꽃빛 꽃 | null], r: [다시 온 것 0/1], a: [일지에 온 줄 0/1], s: [봤음 0/1], m: [놓침 0/1] }] (최근 YEARLY_ROWS해),
//   missed: [{ k, f, y }] (놓친 차례 — 다음 해 같은 계절 맨 앞), got: { 키: 처음 본 해 } (📖 도감 🗓️ 올해만 칩 — DEX_TOTAL · dexTotal에 넣지 않음) } — 새 철에도 이어짐 (SEASON_KEEP)
const YEARLY = {
  rainbow: { season: 0, name: '봄비 뒤 무지개', word: '무지개', icon: '🌈', kind: 'weather', desc: '봄비가 그친 뒤 정원 위에 무지개가 걸려요' },
  fog: { season: 0, name: '봄 안개', word: '안개', icon: '🌫️', kind: 'weather', desc: '이른 아침 안개가 정원에 낮게 깔려요' },
  bloom_spring: { season: 0, name: '봄 꽃빛', word: '꽃빛', icon: '🌸', kind: 'bloom', flowers: ['chamomile', 'rose'], desc: '봄꽃 하나가 올해만 다른 빛으로 피어요' },
  firefly: { season: 1, name: '여름 반딧불', word: '반딧불', icon: '✨', kind: 'weather', desc: '저녁 정원에 반딧불이 몇 마리 날아요' },
  shower: { season: 1, name: '소나기', word: '소나기', icon: '🌦️', kind: 'weather', desc: '한여름 소나기가 지나가요' },
  bloom_summer: { season: 1, name: '여름 꽃빛', word: '꽃빛', icon: '🌸', kind: 'bloom', flowers: ['lavender', 'jasmine', 'lotus', 'bpea'], desc: '여름꽃 하나가 올해만 다른 빛으로 피어요' },
  leafrain: { season: 2, name: '단풍비', word: '단풍비', icon: '🍁', kind: 'weather', desc: '바람에 단풍잎이 비처럼 내려요' },
  bigmoon: { season: 2, name: '큰 달', word: '큰 달', icon: '🌕', kind: 'weather', desc: '가을밤 큰 달이 정원을 비춰요' },
  bloom_fall: { season: 2, name: '가을 꽃빛', word: '꽃빛', icon: '🌸', kind: 'bloom', flowers: ['hibiscus', 'marigold', 'celosia', 'gamguk'], desc: '가을꽃 하나가 올해만 다른 빛으로 피어요' },
  firstsnow: { season: 3, name: '첫눈', word: '첫눈', icon: '❄️', kind: 'weather', desc: '정원에 첫눈이 소복이 내려요' },
  clearsky: { season: 3, name: '눈보라 뒤 맑음', word: '맑은 하늘', icon: '🌬️', kind: 'weather', desc: '눈보라가 그친 뒤 하늘이 맑게 개요' },
  bloom_winter: { season: 3, name: '겨울 꽃빛', word: '꽃빛', icon: '🌸', kind: 'bloom', flowers: ['dongbaek', 'maehwa', 'napmae'], desc: '동백 · 매화 · 납매 중 하나가 올해만 다른 빛으로 피어요' },
};
const YEARLY_KEYS = Object.keys(YEARLY);
const YEARLY_ROWS = 20;                                           // 해마다 줄은 최근 20해만 (달력 지난 해들 · P30-07 그동안)
const newYearly = () => ({ at: null, years: [], missed: [], got: {} });
const yearlyNo = st => ((st && st.yearLog) || []).length + 1;    // 올해 번호 (꽃잠은 쉼달 기록 뒤라 다음 해)
const yearlyOrd = (st, cal) => (yearlyNo(st) - 1) * 4 + (cal.season === 4 ? -0.5 : cal.season);
const yearlyAt = p => ({ y: Math.floor(p / 4) + 1, s: p % 4 });
const yearlyWord = (k, f) => YEARLY[k].kind === 'bloom' && f ? `${FLOWERS[f].name} 꽃빛` : YEARLY[k].word;
// 이름표 해시를 한 번 더 섞음 — FNV만으로는 끝 글자(계절 번호)만 다른 해시끼리 나머지가 닮아 계절끼리 차례가 같이 움직임
const yearlyHash = str => { let h = hashStr(str); h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
function yearlyPick(st, y, s) {   // 그해 그 계절 것: 놓친 것이 먼저, 없으면 정원 이름표로 정한 차례를 해마다 한 칸씩
  const Y = st.yearly || newYearly(), m = Y.missed.find(x => YEARLY[x.k] && YEARLY[x.k].season === s);
  if (m) return { k: m.k, f: m.f || null, r: 1 };
  const gid = st.gardenId || 'g', ks = YEARLY_KEYS.filter(k => YEARLY[k].season === s);
  const k = ks[(yearlyHash(`${gid}|yearly|${s}`) + y - 1) % ks.length], fl = YEARLY[k].flowers;
  return { k, f: fl ? fl[yearlyHash(`${gid}|bloom|${y}|${s}`) % fl.length] : null, r: 0 };
}
function yearlyRow(st, y, keep) {   // 그해 줄 — keep이면 저장 (처음 닿을 때 정해 두어 뒤에 놓친 것이 늘어도 바뀌지 않음), 아니면 미리 보기만
  const Y = st.yearly || newYearly();
  let row = Y.years.find(r => r.y === y);
  if (row) return row;
  row = { y, k: [], f: [], r: [], a: [0, 0, 0, 0], s: [0, 0, 0, 0], m: [0, 0, 0, 0] };
  for (let s = 0; s < 4; s++) { const p = yearlyPick(st, y, s); row.k.push(p.k); row.f.push(p.f); row.r.push(p.r); }
  if (keep) { st.yearly = Y; Y.years.push(row); Y.years.sort((a, b) => a.y - b.y); while (Y.years.length > YEARLY_ROWS) Y.years.shift(); }
  return row;
}
function yearlyLine(row, s) {   // 일지 한 줄 · 알림 문구
  const k = row.k[s], w = yearlyWord(k, row.f[s]), I = YEARLY[k].icon, again = row.r[s] ? '다시 ' : '';
  return { log: `올해 ${SEASONS[s]}엔 ${row.r[s] ? '지난번에 놓친 ' : ''}${I} ${josa(w, '이/가')} ${again}왔어요`, toast: `${I} 올해 ${SEASONS[s]}엔 ${josa(w, '이/가')} ${again}왔어요` };
}
function yearlySettle(st, p) {   // 끝난 계절: 못 봤으면 놓친 차례로 (같은 것은 한 번만 — 다시 놓쳐도 맨 앞 그대로)
  const { y, s } = yearlyAt(p), Y = st.yearly, row = yearlyRow(st, y, true);
  if (row.s[s] || row.m[s]) return;
  row.m[s] = 1;
  const k = row.k[s];
  if (!Y.missed.some(x => x.k === k)) Y.missed.push({ k, f: row.f[s], y });
  addLog(st, 9, `${YEARLY[k].icon} ${josa(yearlyWord(k, row.f[s]), '은/는')} 못 봤어요 · 다음 해 ${SEASONS[s]}에 다시 와요`);
}
function yearlySee(st, p, ctx) {   // 이 계절에 정원을 열었음
  const { y, s } = yearlyAt(p), Y = st.yearly, row = yearlyRow(st, y, true);
  if (row.s[s]) return null;
  row.s[s] = 1;
  const k = row.k[s];
  if (Y.got[k] == null) Y.got[k] = y;
  Y.missed = Y.missed.filter(x => x.k !== k);
  const e = { key: k, season: s, name: yearlyWord(k, row.f[s]), icon: YEARLY[k].icon, retry: !!row.r[s], text: yearlyLine(row, s).toast };
  if (ctx && ctx.live && ctx.onYearly && st.onboarded) ctx.onYearly(e);   // 알림 한 줄은 화면이 (따라잡는 동안 · 첫 안내 중엔 없음)
  return e;
}
// 달이 바뀔 때(onSlot 끝 — 쉼달 기록 뒤라 꽃잠은 다음 해 번호) · 열 때 부름. look: 지금 정원을 보고 있음(열었음 · 열어 둔 채 달이 바뀜)
function yearlyTick(st, cal, ctx, look) {
  const Y = st.yearly = st.yearly || newYearly(), o = yearlyOrd(st, cal);
  if (Y.at == null) Y.at = o;                                     // 처음(새 정원 · 업데이트한 정원): 앞 계절은 놓친 것으로 치지 않음
  if (o > Y.at) { for (let p = Math.ceil(Y.at); p < o; p++) yearlySettle(st, p); Y.at = o; }
  if (!Number.isInteger(o) || o !== Y.at) return null;            // 꽃잠 · 비운 동안 건너뛴 시간으로 해 번호가 덜 간 때(o < at)
  const { y, s } = yearlyAt(o), row = yearlyRow(st, y, true);
  if (!row.a[s]) { row.a[s] = 1; addLog(st, 9, yearlyLine(row, s).log); }   // 새 계절 첫 달: 일지 한 줄 (토스트 없음 — 알림은 봤을 때 onYearly)
  return look ? yearlySee(st, o, ctx) : null;
}
const yearlyMark = (st, cal, ctx) => yearlyTick(st, cal || calendar(st.virtual), ctx, true);
function yearlyItem(row, s, at) {
  const k = row.k[s], T = YEARLY[k], p = (row.y - 1) * 4 + s, f = row.f[s];
  const state = row.s[s] ? 'seen' : row.m[s] ? 'missed' : at == null || p > at ? 'soon' : p === at ? 'now' : 'gone';   // gone: 세기 전에 지난 계절 (놓친 것 아님)
  return { key: k, season: s, seasonName: SEASONS[s], name: yearlyWord(k, f), title: T.name, icon: T.icon, kind: T.kind, desc: T.desc, flower: f, flowerName: f ? FLOWERS[f].name : null, seen: !!row.s[s], missed: !!row.m[s], retry: !!row.r[s], state };
}
// 화면 · 묶음 3(특별 손님) · P30-07(그동안)이 읽는 것
function yearlyOf(st, year) {   // 그해 4개 (계절마다 하나). 올해 · 다음 해는 저장 전이어도 미리 정해 보여 줌, 지난 해는 남아 있는 줄만
  const Y = st.yearly || newYearly(), now = yearlyNo(st), y = year == null ? now : year;
  const row = Y.years.find(r => r.y === y) || (y >= now ? yearlyRow(st, y, false) : null);
  return row ? row.k.map((_, s) => yearlyItem(row, s, Y.at)) : null;
}
function yearlyNow(st, cal) {   // 지금 계절의 올해만 것 | null (꽃잠)
  cal = cal || calendar(st.virtual);
  if (cal.season === 4) return null;
  const list = yearlyOf(st); return list ? list[cal.season] : null;
}
const yearlyMissedAll = st => ((st.yearly && st.yearly.missed) || []).filter(m => YEARLY[m.k]).map(m => ({ key: m.k, season: YEARLY[m.k].season, seasonName: SEASONS[YEARLY[m.k].season], name: yearlyWord(m.k, m.f), icon: YEARLY[m.k].icon, year: m.y, flower: m.f || null }));
const yearlySeen = (st, key) => !!(st.yearly && st.yearly.got && st.yearly.got[key] != null);
const yearlyCount = st => YEARLY_KEYS.filter(k => yearlySeen(st, k)).length;
function yearlyDex(st) {   // 📖 도감 🗓️ 올해만 칩 12칸 — flower: 꽃빛이면 가장 최근에 본 꽃 (그 꽃의 다른 빛 그림)
  const rows = ((st.yearly && st.yearly.years) || []).slice().reverse();
  return YEARLY_KEYS.map(k => { const T = YEARLY[k], r = T.kind === 'bloom' && rows.find(x => x.s[T.season] && x.k[T.season] === k);
    return { key: k, name: T.name, icon: T.icon, kind: T.kind, season: T.season, seasonName: SEASONS[T.season], desc: T.desc, got: yearlySeen(st, k), flower: r ? r.f[T.season] : null, hint: `${SEASONS[T.season]}에 와요` }; });
}
function yearlyPast(st, n) {   // 달력 "지난 해들": 올해 전 최근 n해 (본 것 · 놓친 것)
  const Y = st.yearly || newYearly(), now = yearlyNo(st);
  return Y.years.filter(r => r.y < now).slice(-(n || 3)).map(r => ({ year: r.y, items: r.k.map((_, s) => yearlyItem(r, s, Y.at)) }));
}

// ---------------------------------------------------------------- 🍃 그동안 (P30-07, L2-4 10-30)
// P30-07 1해(현실 1주) 넘게 비웠다 열면 "🌙 자리를 비운 동안" 창(P25-01) 아래 세 줄 — 지나간 해 수 · 그사이 놓친 올해만 것 · 다음 층까지 남은 것
// 지나간 해 수는 현실 시간(비운 시간 / 1주)으로 셈 — 따라잡기 상한(catchUpH 3~5주)을 넘으면 앞쪽만 따라잡고 나머지는 건너뛰어 해마다 기록 · 해 번호 · 층의 흐른 해는
//   따라잡은 만큼만 감(yearlyNo · layerYears는 바꾸지 않음 — 저장 호환 · 시뮬 · L1 테스트 그대로). 그래서 건너뛴 구간은 skipped로 솔직하게 한 줄 (P30-05 열린 질문)
// 놓친 것 = 비운 동안 끝난 계절 중 못 본 것(올해만 달력 줄의 m) — 같은 것은 한 번만. 저장 필드 없이 awaySnap에 비우기 전 값만 더함
const awayLongSnap = st => ({ yl: ((st.yearLog) || []).length, at: st.yearly && st.yearly.at != null ? st.yearly.at : null });
function awayLines(st, real, b, now) {   // real: 비우기 전 st.lastReal · b: awayLongSnap(비우기 전) · now: 지금 현실 시각 → null(1해 미만) | { years, counted, skipped, missed, layer, slow }
  const gap = Math.max(0, now - real), years = Math.floor(gap / WEEK);
  if (years < 1 || !b) return null;
  const counted = Math.max(0, ((st.yearLog) || []).length - b.yl), Y = st.yearly || newYearly();
  const from = b.at == null ? -Infinity : Math.ceil(b.at), still = new Set(Y.missed.map(m => m.k)), seen = new Set(), missed = [];   // 돌아와 연 지금 계절에 다시 와서 본 것은 뺌
  for (const r of Y.years) for (let s = 0; s < 4; s++) {
    const p = (r.y - 1) * 4 + s;
    if (p < from || Y.at == null || p >= Y.at || !r.m[s] || !still.has(r.k[s]) || seen.has(r.k[s])) continue;
    seen.add(r.k[s]); missed.push({ key: r.k[s], season: s, seasonName: SEASONS[s], name: yearlyWord(r.k[s], r.f[s]), icon: YEARLY[r.k[s]].icon, year: r.y });
  }
  const o = layerOf(st);
  return { years, counted, skipped: gap > catchUpH(st) * HOUR && counted < years, missed, layer: { layer: o.layer, name: o.name, icon: o.icon, next: o.next }, slow: slowView(st) };
}
const isYearlyMissLine = t => / 못 봤어요 · 다음 해 /.test(t);   // 일지의 올해만 놓침 줄 — 🍃 그동안이 있으면 창 위 일지에선 뺌 (한 번만 보이게)
const AWAY_MISSED_MAX = 4;   // 놓친 것 이름은 넷까지 · 그 밖은 "그 밖에 n가지"
function awayLinesText(a) {   // 세 줄 문구 { title, years, skipped, missed, layer } — 🐢 느긋하게 보기면 숫자 없이 · 층 줄 없음 (P30-08)
  if (!a) return null;
  const names = a.missed.slice(0, AWAY_MISSED_MAX).map(m => `${m.icon} ${m.name}`), more = a.missed.length - names.length;
  const missed = !a.missed.length ? '놓친 올해만 것은 없어요'
    : `${josa(`${names.join(' · ')}${more > 0 && !a.slow ? ` 그 밖에 ${more}가지` : ''}`, '은/는')} 못 봤어요 · 다음 해 그 계절에 다시 와요`;
  if (a.slow) return { title: '🍃 그동안', years: '오래 쉬었다 왔어요 · 정원은 그대로 기다렸어요', skipped: null, missed, layer: null };
  const N = a.layer.next;
  let layer;
  if (!N) layer = `${a.layer.icon} 정원이 다 자랐어요 · 모든 층을 열었어요`;
  else if (N.how) layer = `다음 층 ${N.icon} ${N.layer}층 ${N.name} · ${N.how} 열려요`;
  else if (N.ready) layer = `다음 층 ${N.icon} ${N.layer}층 ${N.name} · 조건을 다 채웠어요 · ${N.held ? '곧 업데이트로 열려요' : '새해 3월 아침에 열려요'}`;
  else {   // 남은 해는 정원 해(따라잡은 만큼)로 — 위 줄의 현실 해와 엇갈려 읽히지 않게. 아직 못 여는 층(LAYER_MAX_OPEN 위)이면 업데이트 한마디를 덧붙임 (검토 10-30)
    const left = `${N.yearsLeft ? `정원 해로 🗓️ ${N.yearsLeft}해 더` : '🗓️ 정원 해는 다 찼어요 ✔'} · 📖 꽃 도감 ${N.dex} / ${N.needDex}${N.dexOk ? ' ✔' : ''}`;
    layer = N.held ? `다음 층 ${N.icon} ${N.layer}층 ${josa(N.name, '은/는')} 다음 업데이트에 열려요 · ${left}` : `다음 층 ${N.icon} ${N.layer}층 ${N.name}까지 ${left}`;
  }
  return { title: '🍃 그동안', years: `정원에 ${a.years}해가 지났어요`, skipped: a.skipped ? `그 사이 정원은 조용히 쉬었어요 · 해 번호는 따라잡은 ${a.counted}해만큼만 가요` : null, missed, layer };
}

// ---------------------------------------------------------------- 🐾 특별 손님 (P30-06-01, L1-6 10-30)
// 놓은 장식 · 핀 꽃 · 올해만 것에 따라 특별 손님이 정원 빈 칸에 와 앉음 — 보는 즐거움 · 수집만, 돈 · 주문 · 경험치 보상 없음 (P17-14)
// 오기: 달이 바뀔 때(onSlot 끝 visitorTick) 조건이 맞는 손님마다 정원 이름표 · 달(cal.abs = 해 · 달)로 정해지는 난수 ~1/3 (Math.random 아님), 한 달에 한 명 · 한꺼번에 둘까지
//   자리 = 조건 장식 · 꽃 바로 옆 빈 칸(꽃 · 장식 · 다른 손님 없는 칸, 없으면 안 옴). 2~3달 앉았다 떠남. 꽃잠엔 새로 안 오고 앉은 손님도 그대로(떠나는 달을 세지 않음)
//   켜 두어야만 얻는 것 없음 — 비운 동안 따라잡기에도 돌고 알림은 일지만 (열어 둔 채일 때만 ctx.onVisitor)
// 세 번째로 와 앉은 날 기념품 하나(P30-06-03) — 💌 기념품 도감(P23-01 dex.memento)에 새 칸, 손님마다 한 번
// 저장 st.visitors = { now: [{ k, x, y, at: 온 달 abs, left: 남은 달 }], times: { 키: 온 횟수(앉은 때 셈) }, gift: { 키: true }, call: DEV 부른 손님 | null }
//   새 철: times · gift는 이어지고(SEASON_KEEP) now는 비움(장식이 창고로 가서 앉을 자리가 없음)
// 큰 나무(P30-03 작은 숲, L3)가 생기면 🐦 박새 자리 · 조건에 더함 — 지금은 꽃 아치
const blooming = (st, type) => (st.flowers || []).filter(f => !f.withered && f.stage === 'bloom' && (!type || f.type === type));
const VISITORS = {
  hedgehog: { name: '고슴도치 할머니', icon: '🦔', memento: 'coaster', where: '나무 그네 옆', need: '🪴 나무 그네를 놓으면',
    lines: ['그네가 살랑살랑, 졸음이 와요', '이 정원 꽃은 향이 순해요', '천천히 가꾸는 게 제일이에요'], spots: st => placedOf(st, 'swing') },
  tit: { name: '박새', icon: '🐦', memento: 'titstring', where: '꽃 아치 옆', need: '🪴 꽃 아치를 놓으면',
    lines: ['아치 위에서 노래 연습 중이에요', '찌르르, 꽃 냄새가 좋아요', '오늘은 바람이 착해요'], spots: st => placedOf(st, 'arch'),
    forest: st => forestBigSlots(st), forestWhere: '큰 나무 가지 위', forestLines: ['큰 나무 가지가 제일 좋아요', '여기선 숲이 다 보여요', '찌르르, 둥지 틀 자리를 봐요'] },   // P30-03 큰 나무에도 앉음 (P30-06 메모)
  beekid: { name: '꿀벌 아이', icon: '🐝', memento: 'honeycomb', where: '벌통 옆', need: '🐝 벌통을 놓으면',
    lines: ['벌통 언니들 일하는 거 보러 왔어요', '이 꽃 꿀은 무슨 맛일까요', '붕붕, 잠깐만 쉬어 갈게요'], spots: st => placedOf(st, 'hive') },
  cat: { name: '길고양이', icon: '🐈', memento: 'yarn', where: '볕 드는 자리', need: '🍵 찻집 손님 자리가 둘이 되면',
    lines: ['찻집 손님이 많아서 구경 왔어요', '여기 볕이 제일 따뜻해요', '야옹, 조금만 누웠다 갈게요'], cond: st => shopOf(st).seats >= 2, spots: st => [...(st.decos || []).filter(d => d.x != null), ...(st.flowers || []).filter(f => !f.withered)] },
  butterfly: { name: '나비 언니', icon: '🦋', memento: 'wingmark', where: '꽃 옆', need: '🌸 꽃이 열 포기 넘게 피면',
    lines: ['꽃이 이렇게 많다니, 신나요', '날개 좀 말리고 갈게요', '이 꽃 색이 제일 예뻐요'], cond: st => blooming(st).length >= 10, spots: st => blooming(st) },
  frog: { name: '청개구리', icon: '🐸', memento: 'lotusbrella', where: '연꽃 옆', need: '🌦️ 소나기를 본 정원에 연꽃이 피면',
    lines: ['소나기 덕에 연못이 좋아요', '연꽃 아래가 시원해요', '개굴, 비 오면 또 올게요'], cond: st => yearlySeen(st, 'shower'), spots: st => blooming(st, 'lotus') },
  snowkid: { name: '눈사람 아이', icon: '⛄', memento: 'snowbutton', where: '동백 옆', need: '❄️ 첫눈을 본 정원에 동백이 피면',
    lines: ['첫눈 오던 날 생각나요', '동백이 빨개서 따뜻해 보여요', '녹기 전에 놀다 갈게요'], cond: st => yearlySeen(st, 'firstsnow'), spots: st => blooming(st, 'dongbaek') },
  owl: { name: '부엉이', icon: '🦉', memento: 'quill', where: '해시계 옆', need: '🌕 큰 달을 본 정원에 해시계를 놓으면',
    lines: ['큰 달 뜨던 밤이 그리워요', '해시계는 밤엔 쉬어요', '부엉, 조용한 정원이 좋아요'], cond: st => yearlySeen(st, 'bigmoon'), spots: st => placedOf(st, 'sundial') },
  // P30-03 🌳 숲 손님: 큰 나무가 있어야 옴 (정원 지도엔 안 앉고 숲 탭 큰 나무 아래에만)
  rabbit: { name: '산토끼', icon: '🐇', memento: 'clover', where: '큰 나무 아래', need: '🌳 숲에 큰 나무가 자라면', spots: () => [],
    forest: st => forestBigSlots(st), forestWhere: '큰 나무 아래', lines: ['나무 그늘이 시원해요', '숲이 생겨서 이사 왔어요', '깡총, 낮잠 자고 갈게요'] },
  // P30-04-01 길 손님: 그 길을 걷는 철에만 옴 (path — 그 밖은 다른 손님과 같음)
  snail: { name: '달팽이 할아버지', icon: '🐌', memento: 'dewjar', path: 'flower', where: '꽃 옆', need: '🌸 꽃길을 걷는 철에 꽃이 피면',
    lines: ['꽃길은 천천히 걸어야 제맛이에요', '이슬 맺힌 꽃잎이 좋아요', '느릿느릿, 구경 잘하고 가요'], cond: st => seasonPath(st) === 'flower', spots: st => blooming(st) },
  squirrel: { name: '다람쥐 단골', icon: '🐿️', memento: 'teaspoon', path: 'tea', where: '정원 한쪽', need: '🍵 찻길을 걷는 철에',
    lines: ['찻집 냄새 따라 왔어요', '따뜻한 차 한 잔이면 충분해요', '다음엔 친구도 데려올게요'], cond: st => seasonPath(st) === 'tea', spots: st => [...(st.decos || []).filter(d => d.x != null), ...(st.flowers || []).filter(f => !f.withered)] },
  badger: { name: '오소리 광부', icon: '🦡', memento: 'pebble', path: 'earth', where: '정원 한쪽', need: '⛏️ 흙길을 걷는 철에',
    lines: ['흙냄새가 좋은 정원이에요', '굴 파다 잠깐 쉬러 왔어요', '이 땅은 잘 갈려 있네요'], cond: st => seasonPath(st) === 'earth', spots: st => [...(st.decos || []).filter(d => d.x != null), ...(st.flowers || []).filter(f => !f.withered)] },
};
const VISITOR_KEYS = Object.keys(VISITORS);
const VISITOR_MAX = 2, VISITOR_P = 1 / 3, VISITOR_GIFT_AT = 3;   // 한꺼번에 앉는 손님 · 달마다 올 확률 · 몇 번째 온 날 기념품
const newVisitors = () => ({ now: [], times: {}, gift: {}, call: null });
const visitorsSt = st => (st.visitors = st.visitors || newVisitors());
const visitorOk = (st, k) => { const T = VISITORS[k]; return (!T.cond || T.cond(st)) && (T.spots(st).length > 0 || (!!T.forest && T.forest(st).length > 0)); };   // 조건은 놓은 장식 · 핀 꽃 · 올해만 것으로만 (돈 · 등급 숫자 없음)
const cellTaken = (st, x, y) => !!flowerAt(st, x, y) || !!decoAt(st, x, y) || visitorsSt(st).now.some(v => v.x === x && v.y === y);
function visitorCells(st, k) {   // 조건 장식 · 꽃 바로 옆 빈 칸 (같은 칸은 한 번)
  const out = [], seen = {};
  for (const a of VISITORS[k].spots(st)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = a.x + dx, y = a.y + dy, id = y * W + x;
    if ((dx || dy) && x >= 0 && x < W && y >= 0 && y < H && !seen[id] && !cellTaken(st, x, y)) { seen[id] = 1; out.push([x, y]); }
  }
  if (VISITORS[k].forest) for (const i of VISITORS[k].forest(st)) if (!visitorsSt(st).now.some(v => v.w === 'forest' && v.x === i)) out.push([i, -1, 'forest']);   // P30-03 큰 나무 자리 (한 그루에 한 손님)
  return out;
}
const visitorWho = k => `${VISITORS[k].icon} ${josa(VISITORS[k].name, '이/가')}`;
function visitorArrive(st, k, cell, cal, rnd, ctx) {
  const V = visitorsSt(st), T = VISITORS[k];
  const fo = cell[2] === 'forest';
  V.now.push(Object.assign({ k, x: cell[0], y: cell[1], at: cal.abs, left: 2 + (rnd() < 0.5 ? 1 : 0) }, fo ? { w: 'forest' } : {}));   // 2~3달 · P30-03 숲 자리면 w: 'forest'
  const times = V.times[k] = (V.times[k] || 0) + 1;
  const text = `${visitorWho(k)} ${fo ? `🌳 숲 ${T.forestWhere}` : T.where}에 앉았어요`;
  addLog(st, 9, text);                                                         // 토스트는 화면이 onVisitor로 (따라잡는 동안엔 일지만)
  let gift = null;
  if (times >= VISITOR_GIFT_AT && !V.gift[k] && MEMENTOS[T.memento]) {         // P30-06-03 세 번째로 온 날 기념품 (한 번만)
    V.gift[k] = true; st.dex.memento = st.dex.memento || {}; st.dex.memento[T.memento] = true;
    const M = MEMENTOS[T.memento];
    gift = { key: T.memento, name: M.name, ic: M.ic, text: `${visitorWho(k)} ${josa(M.name, '을/를')} 남겼어요` };
    addLog(st, 9, `${gift.text} ${M.ic}`);
  }
  const e = { key: k, name: T.name, icon: T.icon, times, text, gift };
  if (ctx && ctx.live && ctx.onVisitor && st.onboarded) ctx.onVisitor(e);
  return e;
}
// 달이 바뀔 때 (onSlot 끝). 돌려줌: 이 달에 온 손님 이벤트 | null
function visitorTick(st, cal, ctx) {
  const V = visitorsSt(st), gid = st.gardenId || 'g';
  if (cal.frozen) return null;                                                 // 꽃잠: 새로 안 오고 앉은 손님은 그대로
  const left = [];
  V.now = V.now.filter(v => {                                                  // 떠남: 자리에 꽃 · 장식이 들어섰거나 머문 달이 다 됨
    const gone = !VISITORS[v.k] || (v.w === 'forest' ? !forestBigSlots(st).includes(v.x) : !!flowerAt(st, v.x, v.y) || !!decoAt(st, v.x, v.y)) || --v.left <= 0;
    if (gone) left.push(v.k);
    if (gone && VISITORS[v.k]) addLog(st, 9, `${visitorWho(v.k)} 다녀갔어요`);
    return !gone;
  });
  const call = V.call; V.call = null;
  if (V.now.length >= VISITOR_MAX) return null;
  const order = VISITOR_KEYS.filter(k => !V.now.some(v => v.k === k) && !left.includes(k) && visitorOk(st, k))   // 떠난 달엔 다시 안 옴
    .sort((a, b) => (b === call) - (a === call) || yearlyHash(`${gid}|vorder|${a}|${cal.abs}`) - yearlyHash(`${gid}|vorder|${b}|${cal.abs}`));
  for (const k of order) {
    const rnd = mineRng(yearlyHash(`${gid}|visitor|${k}|${cal.abs}`));
    if (!(rnd() < VISITOR_P) && k !== call) continue;
    const cells = visitorCells(st, k); if (!cells.length) continue;
    return visitorArrive(st, k, cells[Math.floor(rnd() * cells.length)], cal, rnd, ctx);   // 한 달에 한 명
  }
  return null;
}
// 화면이 읽는 것: 지금 앉아 있는 손님 (자리에 꽃 · 장식이 들어선 손님은 다음 달에 떠나므로 빼고 보여 줌)
function visitorsOf(st, cal) {
  cal = cal || calendar(st.virtual);
  const V = visitorsSt(st), gid = st.gardenId || 'g';
  return V.now.filter(v => v.w !== 'forest' && VISITORS[v.k] && !flowerAt(st, v.x, v.y) && !decoAt(st, v.x, v.y)).map(v => {   // 숲 손님은 forestVisitors (P30-03)
    const T = VISITORS[v.k], L = T.lines;
    return { key: v.k, name: T.name, icon: T.icon, x: v.x, y: v.y, since: v.at, times: V.times[v.k] || 1, where: T.where,
      line: L[yearlyHash(`${gid}|vline|${v.k}|${cal.abs}`) % L.length] };   // 같은 손님 같은 달이면 같은 말
  });
}
const visitorAt = (st, x, y, cal) => visitorsOf(st, cal).find(v => v.x === x && v.y === y) || null;
const visitorTimes = (st, k) => (st.visitors && st.visitors.times && st.visitors.times[k]) || 0;
const visitorCall = (st, k) => { if (!VISITORS[k]) return false; visitorsSt(st).call = k; return true; };   // DEV 🐾 손님 부르기: 조건이 맞으면 다음 달에 꼭 옴

// ---------------------------------------------------------------- 🌳 작은 숲 (P30-03, L3-1 10-30)
// 4층이 열리면(P30-01-03) 🌳 숲 탭에 나무 자리 6칸. 묘목을 심으면 해가 바뀔 때마다(새해 3월 아침, onSlot idx 0) 한 단계 — 묘목 → 어린나무 → 나무 → 큰 나무에서 멈춤
//   물 · 돌봄 없음, 죽지 않음(P07), 뽑기 · 옮기기 · 베기 없음(심은 자리 그대로). 묘목은 돈으로만 · 나무는 팔지 않고 열매 · 수입 없음 (P17-14 — 돈 쓸 곳)
//   단계 = 지금 해 − 심은 해 (해 = 해마다 기록 누적 줄 수, layerYears와 같은 기준) — 켜 두어야만 자라는 것 없음, 비운 동안 따라잡기에도 자람. 꽃잠에도 해 바뀜(쉼달 기록)은 그대로
//   숲 도감: 나무 6 × 4단계(그 단계까지 자라면 참) — DEX_TOTAL · dexTotal · 등급 경험치(gradeDexCount)에 넣지 않음 (🗓️ 올해만과 같음)
//   묘목(TREES)은 화원 꽃 묘목(FLOWERS form: 'sapling' · life: 'tree')과 다른 표 · 다른 이름
// 저장 st.forest = { trees: [{ k, at: 심은 해, stage: 0~3 } | null] × 6, dex: { 키: 가장 높이 자란 단계 } } — 새 철에도 이어짐 (SEASON_KEEP, 층이 이어지니 숲도)
const TREES = {
  cherry: { name: '벚나무', icon: '🌸', price: 5000, desc: '봄이면 연분홍 꽃이 펴요' },
  ginkgo: { name: '은행나무', icon: '🍂', price: 3500, desc: '가을이면 노랗게 물들어요' },
  maple: { name: '단풍나무', icon: '🍁', price: 4000, desc: '가을이면 붉게 물들어요' },
  pine: { name: '소나무', icon: '🌲', price: 2500, desc: '사철 푸른 잎이에요' },
  persimmon: { name: '감나무', icon: '🍊', price: 4500, desc: '가을이면 주황 감이 달려요 · 따지는 않아요' },
  birch: { name: '자작나무', icon: '🌳', price: 2000, desc: '하얀 줄기가 곧게 자라요' },
};
const TREE_KEYS = Object.keys(TREES);
const FOREST_N = 6, TREE_BIG = 3;
const TREE_STAGES = ['묘목', '어린나무', '나무', '큰 나무'];
const newForest = () => ({ trees: Array(FOREST_N).fill(null), dex: {} });
const forestSt = st => { const f = st.forest = st.forest || newForest(); if (!Array.isArray(f.trees)) f.trees = []; while (f.trees.length < FOREST_N) f.trees.push(null); f.dex = f.dex || {}; return f; };
const forestOpen = st => layerNow(st) >= 4;
const treeStageAt = (st, t) => Math.max(0, Math.min(TREE_BIG, layerYears(st) - t.at));
function forestTick(st) {   // 새해 3월 아침 (onSlot idx 0, layerCheck 뒤): 심은 해부터 흐른 해만큼 단계 · 도감 칸
  if (!st.forest) return 0;
  const F = forestSt(st); let grew = 0;
  for (const t of F.trees) {
    if (!t || !TREES[t.k]) continue;
    const s = treeStageAt(st, t);
    if (s > (t.stage || 0)) { t.stage = s; grew++; }
    if (!(F.dex[t.k] >= t.stage)) F.dex[t.k] = t.stage || 0;
  }
  return grew;
}
function plantTree(st, key, slot, ctx) {
  if (!forestOpen(st)) return no('작은 숲은 4층이 열리면 생겨요');
  const T = TREES[key];
  if (!T || !Object.prototype.hasOwnProperty.call(TREES, key)) return no('없는 나무예요');
  const F = forestSt(st);
  if (slot == null) slot = F.trees.findIndex(t => !t);
  if (!Number.isInteger(slot) || slot < 0 || slot >= FOREST_N) return no('나무 자리가 다 찼어요');
  if (F.trees[slot]) return no('이미 나무가 있는 자리예요');
  if (st.money < T.price) return no('돈이 모자라요');
  st.money -= T.price;
  F.trees[slot] = { k: key, at: layerYears(st), stage: 0 };
  const first = F.dex[key] == null;
  if (first) F.dex[key] = 0;
  addLog(st, 10, `🌳 숲에 ${T.name} 묘목을 심었어요`, ctx);
  const sleep = calendar(st.virtual).frozen;                                   // 꽃잠엔 그해 기록이 이미 끝나 다음 해 아침부터 셈 (검토 10-30 — 셈은 그대로, 한 줄로 알려 줌)
  return ok(`${T.icon} ${josa(T.name, '을/를')} 심었어요 · ${sleep ? '꽃잠에 심어 다음 해 아침부터 자라요' : '해가 바뀔 때마다 자라요'}`, { slot, first, sleep });
}
function forestOf(st) {   // 화면이 읽는 것: 자리 6칸 · 도감 칸 수 (🐢 느긋하게 보기면 화면이 숫자를 뺌 — slow)
  const F = forestSt(st);
  const slots = F.trees.slice(0, FOREST_N).map((t, i) => {
    if (!t || !TREES[t.k]) return null;
    const T = TREES[t.k], s = t.stage || 0;
    return { slot: i, key: t.k, name: T.name, icon: T.icon, stage: s, stageName: TREE_STAGES[s], big: s >= TREE_BIG, yearsLeft: TREE_BIG - s };
  });
  return { open: forestOpen(st), slots, empty: slots.filter(x => !x).length, dex: forestCount(st), total: TREE_KEYS.length * TREE_STAGES.length, slow: slowView(st) };
}
const forestCount = st => TREE_KEYS.reduce((a, k) => a + (st.forest && st.forest.dex && st.forest.dex[k] != null ? st.forest.dex[k] + 1 : 0), 0);
// 숲 도감 칸: 나무마다 4단계 [{ key, stage, got }] (나무 순서 → 단계 순서)
const forestDex = st => TREE_KEYS.flatMap(k => TREE_STAGES.map((name, s) => ({ key: k, stage: s, stageName: name, name: TREES[k].name, icon: TREES[k].icon, got: !!(st.forest && st.forest.dex && st.forest.dex[k] >= s) })));
const forestBigSlots = st => st.forest ? forestSt(st).trees.map((t, i) => (t && TREES[t.k] && t.stage >= TREE_BIG ? i : -1)).filter(i => i >= 0) : [];
// 🐾 큰 나무에 앉은 손님 (P30-03 · P30-06): 숲 칸 좌표 = 자리 번호(x), y = -1 · w: 'forest' — 정원 지도는 visitorsOf에서 빠짐
function forestVisitors(st, cal) {
  cal = cal || calendar(st.virtual);
  const V = visitorsSt(st), gid = st.gardenId || 'g';
  return V.now.filter(v => v.w === 'forest' && VISITORS[v.k] && forestBigSlots(st).includes(v.x)).map(v => {
    const T = VISITORS[v.k], L = T.forestLines || T.lines;
    return { key: v.k, name: T.name, icon: T.icon, slot: v.x, since: v.at, times: V.times[v.k] || 1, where: T.forestWhere, line: L[yearlyHash(`${gid}|vline|${v.k}|${cal.abs}`) % L.length] };
  });
}
function forestGrowDev(st) {   // DEV 🌳 나무 한 해 키우기: 심은 해를 한 해 앞으로 당겨 바로 셈 (해마다 기록은 그대로)
  const F = forestSt(st);
  for (const t of F.trees) if (t) t.at -= 1;
  return forestTick(st);
}

