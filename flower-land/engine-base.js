// 도리의 정원 — 게임 규칙 엔진 조각 1/10: 머리 상수 · 달력 · 꽃 · 땅 · 품질 · 꽃방과 블렌딩
// P66(11-03): 예전 한 파일 engine.js(줄 5 ~ 321)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
// 도리의 정원 (Dori's Garden) — 게임 규칙 엔진 (화면과 분리)
// 기획 체크리스트 P01–P17 기준. 번호는 주석에 함께 적어 둠.
'use strict';

const HOUR = 3600e3, WEEK = 7 * 24 * HOUR;
const W = 30, H = 20;
const STEP_H = 0.25;            // 시뮬레이션 한 걸음 (현실 시간)
const SLOT_H = 12;              // P03: 한 달 = 현실 12시간
const GAME_DAY_H = 0.8;         // P05: 게임 하루 = 현실 48분 → 한 달 15일
const MONTH_H = SLOT_H;         // "흐르는 달" 한 달의 길이
// P02, P03, P04: 월요일 06시 = 3월, 일요일 = 쉼달(06–18시)·꽃샘달(18–06시)
const MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14];
const SEASONS = ['봄', '여름', '가을', '겨울', '꽃잠'];
const EPOCH = new Date(2000, 0, 3, 6).getTime(); // 2000년 1월 3일 월요일 06시
const monthName = m => m === 13 ? '쉼달' : m === 14 ? '꽃샘달' : m + '월';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 받침에 맞는 조사: josa('장미', '을/를') → '장미를'
function josa(word, pair) {
  const [a, b] = pair.split('/');
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + b;
  const jong = (c - 0xac00) % 28;
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? b : a);
  return word + (jong ? a : b);
}

// R-D2 (11-05 검토): rng를 안 넘긴 호출의 뽑기 — 화면 ctx.rng도 Math.random이라 같고, 시뮬 · 테스트는 늘 시드 rng를 넘김. 엔진 안 Math.random은 여기 하나(와 newGardenId)뿐
const defaultRng = () => Math.random();
// ---------------------------------------------------------------- 달력
function weekStart(ms) {
  const d = new Date(ms - 6 * HOUR);
  const day = (d.getDay() + 6) % 7;
  d.setHours(6, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
function calendar(ms) {
  const ws = weekStart(ms), yh = (ms - ws) / HOUR;
  const idx = clamp(Math.floor(yh / SLOT_H), 0, 13);
  const into = yh - idx * SLOT_H;
  const week = Math.round((ws - EPOCH) / WEEK);
  return {
    ms, ws, yh, idx, week,
    month: MONTHS[idx],
    season: Math.min(4, Math.floor(idx / 3)),
    frozen: idx >= 12,                                   // P04-01: 꽃잠에는 정원의 시간이 멈춤
    day: Math.min(15, Math.floor(into / GAME_DAY_H) + 1),
    hour: (into % GAME_DAY_H) / GAME_DAY_H * 24,
    abs: week * 14 + idx,
    slotStart: ws + idx * SLOT_H * HOUR,
    slotEnd: ws + (idx + 1) * SLOT_H * HOUR,
  };
}
const yearOf = (st, cal) => cal.week - st.firstWeek + 1;
// 처음부터 다시 시작은 1년차 동안만 (변경 10-27, 사용자 요청) — 1년차 꽃잠 · 일요일에 시작한 0년차도 포함
const canReset = (st, cal) => yearOf(st, cal) <= 1 && seasonN(st) < 2;   // P28-08-02 새 철 1년차는 해 번호가 1이어도 완전 초기화를 다시 보이지 않음
// P16-12-03 처음부터 다시 시작 = 완전 초기화 (변경 10-27, 사용자 요청): 이 게임의 브라우저 저장 키 전부 (정원 · 되돌리기 칸 · 보관본 · 안내 표시 · 구글 로그인 기록 · 토큰)
// base 'flower-land-v3' → 'flower-land-v3' 자신과 'flower-land-v3-…'만. 다른 사이트 · 옛 판('flower-land-v2') 키는 건드리지 않음
const resetKeys = (keys, base) => keys.filter(k => k === base || (typeof k === 'string' && k.startsWith(base + '-')));
// P04-01-09 꽃잠 관리 (10-25): 꽃잠은 꽃이 잠든 때라 휴면기처럼 — 옮겨심기 · 번식은 달 조건 없이, 번식은 새해 몫으로 셈
const propYearOf = (st, cal) => yearOf(st, cal) + (cal.frozen ? 1 : 0);
// 수확 한 번의 칸: 꽃잠(쉼달 + 꽃샘달)은 합쳐 한 칸 = 쉼달의 abs (10-25 변경: 꽃잠에 한 번, 2월과는 따로)
const harvestSlot = cal => cal.frozen ? cal.week * 14 + 12 : cal.abs;
// 번식할 만큼 다 자랐는지: 휴면 달엔 덜 자란 꽃도 'dormant'라 나이로 봄 (QA 19회차 — 꽃잠엔 달 조건이 없어 드러남)
const propGrown = f => f.stage === 'mature' || f.stage === 'bloom' || (f.stage === 'dormant' && f.ageH >= FLOWERS[f.type].mature * MONTH_H);
const canMoveNow = (f, cal) => !!f && !f.withered && (cal.frozen || FLOWERS[f.type].sow.includes(cal.month) || f.stage === 'dormant');
// P34 찻집은 매달 열림 (10-30 사용자 요청 — 예전 P17-09: 겨울 12월 ~ 꽃잠만, idx 9~13). 값 · 속도는 그대로
// 함수는 남겨 둠: 부르는 곳(우림 · 판매 · 주문 쪽지 · 나비 일꾼 · 첫 손님)이 그대로 돌고, 다시 닫는 달이 생기면 여기만 고침
const teaShopOpen = cal => !!cal;
const hoursToShopOpen = () => 0;

// 지금부터 "흐르는 시간" flowH가 지난 뒤의 달력 (꽃잠은 건너뜀)
function calendarAfterFlow(ms, flowH) {
  let t = ms, rem = flowH, guard = 0;
  while (rem > 1e-9 && guard++ < 400) {
    const c = calendar(t);
    if (c.frozen) { t = c.slotEnd; continue; }
    const left = (c.slotEnd - t) / HOUR;
    if (rem <= left) { t += rem * HOUR; rem = 0; } else { rem -= left; t = c.slotEnd; }
  }
  while (calendar(t).frozen && guard++ < 400) t = calendar(t).slotEnd;  // 꽃잠에 걸리면 다음 흐르는 달로
  return calendar(t);
}
// P46 ⏱️ 걸리는 시간은 현실 시간 글자로 (11-01 사용자 요청): 1시간 안은 "n분", 하루 안은 "n시간"(반은 "n시간 반"), 그 위는 반나절 단위 "하루 · 하루 반 · 2일 …"
// h = 현실 시간(시간). 게임 한 달 = 12시간 · 게임 하루 = 48분
function timeText(h) {
  const min = Math.round(Math.max(0, h) * 60);
  if (min < 60) return `${Math.max(1, min)}분`;
  const hh = Math.round(h * 2) / 2;
  if (hh < 24) return `${Math.floor(hh)}시간${hh % 1 ? ' 반' : ''}`;
  const d = Math.round(h / 12) / 2;
  return `${d < 2 ? '하루' : Math.floor(d) + '일'}${d % 1 ? ' 반' : ''}`;
}
// 지금부터 "흐르는 시간" flowH가 다 지날 때까지 현실 몇 시간인지 (꽃잠은 시간이 멈추니 그만큼 더 김)
function flowLeftH(ms, flowH) {
  let t = ms, rem = flowH, guard = 0;
  while (rem > 1e-9 && guard++ < 400) {
    const c = calendar(t);
    if (c.frozen) { t = c.slotEnd; continue; }
    const left = (c.slotEnd - t) / HOUR;
    if (rem <= left) { t += rem * HOUR; rem = 0; } else { rem -= left; t = c.slotEnd; }
  }
  return (t - ms) / HOUR;
}
// 조건을 처음 만족하는 달이 시작될 때까지 (현실 시간 기준)
function untilMonth(ms, test) {
  let t = ms, guard = 0;
  while (guard++ < 40) {
    const c = calendar(t);
    if (c.slotStart > ms - 1 && test(c)) return { cal: c, hours: (c.slotStart - ms) / HOUR };
    t = c.slotEnd;
  }
  return null;
}

// ---------------------------------------------------------------- 꽃 (P09, P15-08, P17)
const FORM = {
  seed: { name: '씨앗', rate: '발아율', unit: '봉지' },        // 세는 말 (10-06): 화원에서 쓰는 단위
  sapling: { name: '묘목', rate: '뿌리내림', unit: '그루' },
  seedling: { name: '모종', rate: '뿌리내림', unit: '포기' },
  rhizome: { name: '연근', rate: '뿌리내림', unit: '뿌리' },
};
const LIFE = { annual: '한해살이', perennial: '여러해살이', tree: '나무' };
const FLOWERS = {
  chamomile: { name: '캐모마일', tea: '캐모마일차', life: 'annual', form: 'seed', sow: [3, 4, 9], bloom: [5, 6, 7], mature: 2, t: 17, m: 40, price: 500, teaBase: 800, prop: '채종', propMonths: [], prune: false,
    petal: '#fbfbf5', center: '#f2c230', look: 'daisy', n: 12,
    story: '사과 향이 나는 작은 데이지꽃이에요. 꽃송이를 말려 차로 마셔요.' },
  bpea: { name: '버터플라이피', tea: '버터플라이피차', life: 'annual', form: 'seed', sow: [5], bloom: [7, 8, 9], mature: 2, t: 31, m: 68, price: 600, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#2d4fcf', center: '#f4f4f0', look: 'round', n: 4,
    story: '파란 꽃잎을 우리면 푸른 차가 되고, 레몬을 떨어뜨리면 보랏빛으로 바뀌어요.' },
  hibiscus: { name: '히비스커스', tea: '히비스커스차', life: 'annual', form: 'seed', sow: [4, 5], bloom: [9, 10], mature: 4, t: 31, m: 82, price: 500, teaBase: 800, prop: '채종', propMonths: [], prune: false,
    petal: '#c4242f', center: '#f3d25a', look: 'round', n: 5,
    story: '로젤의 붉은 꽃받침을 말려 새콤한 붉은 차를 만들어요.' },
  marigold: { name: '메리골드', tea: '메리골드차', life: 'annual', form: 'seed', sow: [6, 7], bloom: [8, 9, 10], mature: 2, t: 21, m: 32, price: 500, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#f39a1e', center: '#c9561a', look: 'daisy', n: 16,
    story: '주황빛 겹꽃이 한여름부터 가을까지 피어요. 말린 꽃을 우리면 노란 차가 돼요.' },
  celosia: { name: '맨드라미', tea: '맨드라미차', life: 'annual', form: 'seed', sow: [7, 8], bloom: [9, 10, 11], mature: 2, t: 25, m: 40, price: 600, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#e23a5e', center: '#a8183a', look: 'spike', n: 6,
    story: '닭 볏을 닮은 붉은 꽃이에요. 늦여름에 심어 가을에 거두고, 말려서 붉은 차로 우려요.' },
  lavender: { name: '라벤더', tea: '라벤더차', life: 'perennial', form: 'sapling', sow: [3, 4, 6], bloom: [6, 7], mature: 2, t: 28, m: 12, price: 2500, teaBase: 800, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#8a6cc8', center: '#5d4a91', look: 'spike', n: 7,
    story: '햇볕과 마른 땅을 좋아하는 보랏빛 꽃이에요. 향이 오래 남아요.' },
  jasmine: { name: '재스민', tea: '재스민차', life: 'perennial', form: 'sapling', sow: [4, 5, 6], bloom: [7, 8], mature: 2, t: 27, m: 50, price: 5000, teaBase: 1600, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#ffffff', center: '#e9dfa0', look: 'star', n: 5,
    story: '여름 밤에 짙은 향을 내는 하얀 꽃이에요. 차에 향을 입힐 때도 써요.' },
  gamguk: { name: '감국', tea: '국화차', life: 'perennial', form: 'seedling', sow: [3, 4, 6], bloom: [10, 11], mature: 3, t: 7, m: 36, price: 1200, teaBase: 2400, prop: '포기나누기', propMonths: [3, 10, 11], prune: false,
    petal: '#f2c624', center: '#d99a12', look: 'daisy', n: 14,
    story: '늦가을 산기슭에 피는 작은 노란 국화예요. 말려서 국화차를 만들어요.' },
  rose: { name: '장미', tea: '장미차', life: 'perennial', form: 'sapling', sow: [3, 4, 10, 11, 12, 1], bloom: [5, 6], mature: 2, t: 16, m: 52, price: 5000, teaBase: 1000, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#d6455d', center: '#a52a40', look: 'rose', n: 5,
    story: '꽃봉오리를 말려 차로 우려요. 봄과 초여름에 피어요.' },
  lotus: { name: '연꽃', tea: '연꽃차', life: 'perennial', form: 'rhizome', sow: [4, 5, 6], bloom: [7, 8], mature: 2, t: 19, m: 97, price: 4000, teaBase: 4000, prop: '연근 나누기', propMonths: [4], prune: false,
    petal: '#f0a3c0', center: '#f0d050', look: 'lotus', n: 8,
    story: '연꽃 씨앗은 껍질이 아주 단단해요. 경남 함안에서 발굴된 약 700년 전 씨앗이 2010년에 싹을 틔워 꽃을 피웠고, 아라홍련이라는 이름을 얻었어요.' },
  dongbaek: { name: '동백', tea: '동백꽃차', life: 'tree', form: 'sapling', sow: [3, 4, 10, 2], bloom: [12, 1, 2], mature: 3, t: 26, m: 52, price: 3000, teaBase: 1600, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#c81f3a', center: '#f2c94c', look: 'rose', n: 5,
    story: '한겨울에 붉게 피는 꽃이에요. 꽃잎을 덖어 차로 마셔요.' },
  maehwa: { name: '매화', tea: '매화차', life: 'tree', form: 'sapling', sow: [3, 11, 12, 1, 2], bloom: [2, 3], mature: 8, t: 8, m: 50, price: 5000, teaBase: 3000, prop: '접붙이기', propMonths: [2, 3], prune: true,
    petal: '#fbe3ea', center: '#d9a03a', look: 'round', n: 5,
    story: '추위가 채 가시기 전에 피는 꽃이에요. 봉오리를 따서 매화차를 만들어요.' },
  napmae: { name: '납매', tea: '납매차', life: 'tree', form: 'sapling', sow: [3, 11, 12, 1, 2], bloom: [1, 2], mature: 6, t: 8, m: 42, price: 12000, teaBase: 3200, prop: '접붙이기', propMonths: [2, 3], prune: true,
    petal: '#f1d36a', center: '#9a5b2a', look: 'round', n: 6,
    story: '한겨울에 노란 꽃을 피우는 귀한 나무예요. 향이 맑아요.' },
};
const FLOWER_KEYS = Object.keys(FLOWERS);
for (const k of FLOWER_KEYS) {
  const F = FLOWERS[k];
  F.key = k;
  F.baseR = F.life === 'tree' ? 2 : 1;                                  // P15-01-04-a
  F.dormant = F.life === 'annual' ? [] : [12, 1, 2].filter(m => !F.bloom.includes(m));
  F.windows = sowWindows(F.sow);
  F.petals = Math.max(5, F.n || 5);   // P77-C (11-04 사용자 확정): 꽃 한 송이의 꽃잎 수 = 실제 꽃 모양(도트 n)대로, 최소 5 — 손으로 거두면 1 ~ petals장 · 티백 하나에 petals장
}
function sowWindows(sow) {
  const idxs = sow.map(m => MONTHS.indexOf(m)).sort((a, b) => a - b), out = [];
  for (const i of idxs) {
    const last = out[out.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i); else out.push([i]);
  }
  return out.map(w => w.map(i => MONTHS[i]));
}
const reservationPrice = F => Math.round(F.price * 0.9);                  // P06-06-01
const deliverIdxOf = firstMonth => { const i = MONTHS.indexOf(firstMonth); return i % 2 === 0 ? i : i - 1; }; // P06-05-01

// ---------------------------------------------------------------- 땅 (P15)
const LANDS = {
  barren: { name: '황무지', color: '#a39b8e' },
  foothill: { name: '산기슭', color: '#9fae8f' },
  grassland: { name: '초원', color: '#88bd5c' },
  pond: { name: '연못', color: '#4788b5' },
  med: { name: '지중해 언덕', color: '#d8c08c' },
  subtropic: { name: '아열대 정원', color: '#5aa553' },
  tropical: { name: '열대', color: '#2a8549' },
  mossy: { name: '이끼 숲', color: '#5e8a6c' },
  wetland: { name: '습지', color: '#5b9c80' },
  dryfield: { name: '메마른 들', color: '#c8bc82' },
};
const LAND_KEYS = Object.keys(LANDS);
const LIFE_MIN = 0.35;
const BASE_T = 15, BASE_M = 25;
const SEASON_T = [0, 3, 0, -3, 0];               // P15-04-01
const LIFE_DECAY_SEASON = [1, 1.3, 1, 0.4, 0];   // P15-05-01-b
function classify(t, m) {                        // P15-01-03
  if (t < 12) return m < 60 ? 'foothill' : 'mossy';
  if (t < 23) return m >= 80 ? 'pond' : m >= 60 ? 'wetland' : m >= 30 ? 'grassland' : 'dryfield';
  return m < 30 ? 'med' : m < 60 ? 'subtropic' : 'tropical';
}
const landOf = tile => tile.life < LIFE_MIN ? 'barren' : classify(tile.t, tile.m);

// ---------------------------------------------------------------- 품질 (P06-15, P13-05)
const stars = q => q <= 0 ? 0 : Math.min(5, Math.ceil(Math.round(q * 1000) / 1000 * 100 / 20));
const pct = q => Math.round(q * 100);
const GERM_FULL_M = 12, GERM_FADE_M = 8, GERM_SOON_M = 10;   // R-D1 (11-05 검토): 싹 트는 힘 — 12달까지 100% · 뒤 8달에 0% · 10달부터 "곧 줄어요" (화원 카드가 같은 값을 씀)
function germOf(it) {                            // P06-07-07: 유효기간 12달(현실 6일), 뒤 8달에 S자로 0%
  const m = it.ageH / MONTH_H;
  if (m <= GERM_FULL_M) return 1;
  if (m >= GERM_FULL_M + GERM_FADE_M) return 0;
  const x = (m - GERM_FULL_M) / GERM_FADE_M;
  return 1 - x * x * (3 - 2 * x);
}
function qualityRadius(f) {                      // P13-04-02-d
  return FLOWERS[f.type].baseR + Math.max(1, stars(f.q)) - 1;
}
function stageRadius(f) {                        // P13-04-02-e
  const r = qualityRadius(f);
  switch (f.stage) {
    case 'germ': return 0;
    case 'sprout': return Math.floor(r / 2);
    case 'young': case 'dormant': return Math.max(0, r - 1);
    case 'mature': case 'bloom': return r;
    default: return -1;
  }
}
const STAGE = { germ: '발아 중', sprout: '새싹', young: '자라는 중', mature: '다 자람', bloom: '개화', dormant: '휴면', withered: '시듦' };
function computeStage(f, month) {                // P07
  const F = FLOWERS[f.type];
  if (f.withered) return 'withered';
  const ageM = f.ageH / MONTH_H;
  if (F.form === 'seed') {
    if (ageM < 0.15) return 'germ';
    if (ageM < F.mature * 0.5) return 'sprout';
  }
  if (ageM < F.mature) return F.dormant.includes(month) ? 'dormant' : 'young';
  if (F.dormant.includes(month)) return 'dormant';
  return (f.ripeH || 0) >= RIPE_H - 1e-9 ? 'bloom' : 'mature';   // P72-01 피는 달 대신 다 자란 뒤 흐르는 시간 RIPE_H
}
// P72-01 다시 피는 꽃 (11-04 사용자 확정): "피는 달"(F.bloom) 제한을 없앰 — 다 자란 뒤 흐르는 시간 RIPE_H(현실 6시간)가 지나면 개화, 거두면 다시 다 자람 → RIPE_H 뒤 다시 핌
//   시계는 꽃의 f.ripeH(다 자란 뒤 · 마지막으로 거둔 뒤 흐른 시간). 휴면 달(F.dormant — 그대로) · 꽃잠(걸음이 없음)엔 멈춤
//   🌱 자라는 속도(BONUS.grow)는 P61-02처럼 처음 피기까지만(bloomKey === -1) 이 시계도 빠르게 — 다시 피는 시간은 그대로 · 🔆 장치 · 칭호 덤은 다 자라기까지만
//   한해살이는 처음 핀 뒤 예전 피는 달 수(F.bloom.length)만큼 흐르면 시듦(f.ripeT — 다 자란 뒤 흐른 시간 모두) · F.bloom은 도감 · 화원의 "제철" 표시로만 남음
const RIPE_H = 6;
const ripeOn = (f, month) => !f.withered && f.ageH >= FLOWERS[f.type].mature * MONTH_H && !FLOWERS[f.type].dormant.includes(month);   // 시계가 가는지
const annualSpanH = F => RIPE_H + F.bloom.length * MONTH_H;   // 한해살이가 다 자란 뒤 살아 있는 흐르는 시간
function pickFlower(f, cal) {                   // P72-01 거두는 모든 길(손 · 모두 거두기 · 🐜 개미 · 🧺 저장고): 다시 다 자람으로 · 시계 0
  f.harvestKey = harvestSlot(cal); f.ripeH = 0;
  if (f.stage === 'bloom') f.stage = 'mature';
}
function landMatch(st, f) {
  const tl = st.tiles[f.y * W + f.x], F = FLOWERS[f.type];
  const et = Math.max(0, Math.abs(tl.t - F.t) - 3), em = Math.max(0, Math.abs(tl.m - F.m) - 3); // P15-08: ±3
  return clamp(1 - et / 12 - em / 30, 0, 1);
}
function vigorOf(st, f) {                        // P13-01: 땅이 맞는 정도 − 목마름, 20%에서 멈춤
  return clamp(landMatch(st, f) * 100 - 20 * (f.thirstH / MONTH_H), 20, 100);
}
function monthlyChange(st, f) {                  // P13-05 (한 달 기준 %)
  const v = vigorOf(st, f);
  let pos = 0, neg = 0;
  if (f.weedH <= 0) neg += 5;
  if (v < 50 && f.adaptH <= 0 && !decoNear(st, 'stepstone', f)) neg += 3 * titlePerk(st, 'landNeg');   // P52 🧭   // P13-05-01-a 적응 기간 · P44-04 👣 징검돌 둘레는 늘 적응 기간처럼
  if (v >= 80) pos += 2;
  if (f.pruneH > 0) pos += 3;
  if (f.fertH > 0) pos += 5;
  pos *= titlePerk(st, 'qPos');                    // P52 🌸 꽃길
  return { pos, neg, v };
}
function propCount(q) { const s = Math.max(1, stars(q)); return s <= 2 ? 1 : s <= 4 ? 2 : 3; } // P06-02-05-b
function propQuality(q, rng, half, mul) {             // P06-15-06-a, a-1, a-2 · half: P39-06-01 🐝 꿀벌 둘레 꽃은 깎임 절반 (뽑는 수는 같아 시드 흐름 그대로)
  const r = rng(), drop = r < 0.5 ? rng() * 0.05 : r < 0.8 ? 0.05 + rng() * 0.05 : 0.1 + rng() * 0.1;
  return Math.max(0.1, q - drop * (half ? 0.5 : 1) * (mul == null ? 1 : mul));   // mul: P52 🌾 한 포기의 기적
}
// P77-C (11-04 사용자 확정 "티백 하나에 꽃잎 여러 장 · 들어간 장수만큼 찻값이 올라요"): 티백 하나 = 꽃잎 F.petals장, 값 = teaBase × petals / PETAL_BASE — 꽃잎 한 장 값은 꽃마다 teaBase / 5로 같음
//   (petals 5인 꽃은 예전 값 그대로 · 캐모마일 12장이면 티백 하나가 2.4배). 손 수확은 1 ~ petals장 고르게(ctx.rng — 없으면 가운데), 🐜 개미는 1 ~ ANT_PETALS_MAX장
const PETAL_BASE = 5, ANT_PETALS_MAX = 5;
const bagMul = F => F.petals / PETAL_BASE;
const harvestCount = (F, rng) => 1 + Math.floor((rng ? rng() : 0.5) * F.petals);
const antCount = rng => 1 + Math.floor((rng ? rng() : 0.5) * ANT_PETALS_MAX);
const teaValue = (F, q, fresh) => Math.round(F.teaBase * bagMul(F) * (0.5 + q) * (fresh ? 1.1 : 1) / 10) * 10; // P17-04, P17-05 · P77-C × petals/5
// P12-09 햇차: ★5(품질 80% 초과) 꽃잎으로 만들면 붙는 표시, 값 +10% / P12-11 생화 티백: 말리지 않고 바로 티백, 값 −10% (10-06)
const HAT_RATE = 1.1, RAW_RATE = 0.9, RAW_DECAY = 0, TEA_DECAY = 0;   // 티백은 품질이 줄지 않음 (10-06)
const isHat = q => stars(q) === 5;
const teaItemValue = (st, t, cal) => Math.round(FLOWERS[t.type].teaBase * bagMul(FLOWERS[t.type]) * (0.5 + t.q) * (t.hat ? 1 + (HAT_RATE - 1) * titlePerk(st, 'hat') : 1) * (t.raw ? RAW_RATE : 1) / 10) * 10;   // ✨ 제철 보너스는 없앰 (10-06, P17-05)
function seasonKey(st, cal) { const y = yearOf(st, cal); return y * 10 + (cal.season === 4 ? 3 : cal.season); } // P17-05-02: 꽃잠엔 겨울 티백 유지
const isFresh = () => false;   // P17-05 제철 보너스 없앰 (10-06): 그때는 찻집이 겨울에만 열려 거의 받을 수 없었음. 예전 저장의 seasonKey는 그대로 둠
// P28-06 효율 정보 표 (10-28): 꽃마다 셈 — 값은 모두 FLOWERS · teaItemValue · classify에서 계산하고 숫자를 따로 적지 않음
// P12-05 수확 한 번에 꽃잎 1장 → P77-C 1 ~ F.petals장 (harvestCount) · 표의 petals = 꽃잎 수, 한 번 거두면 평균 (petals + 1) / 2장 = 티백 (petals + 1) / (2 · petals)개
const ECON_Q = [0.1, 0.3, 0.5, 0.7, 0.9];        // ★1~★5 칸의 가운데 품질 — 대표값은 ★3
// 다 자란 한 포기가 한 해에 거두는 수 (P72-01): 필 때마다 바로 거두면 RIPE_H마다 한 번 — 여러해살이 · 나무는 휴면이 아닌 흐르는 달 동안, 한해살이는 핀 뒤 사는 동안(예전 피는 달 수)
//   예전 "피는 달마다 한 번 + 2월에 핀 채 꽃잠에 들면 한 번 더"는 없어짐 (꽃잠엔 시계가 멈춰, 늘 거두는 정원이면 꽃잠 직전에 다시 피지 않음)
const harvestsPerYear = F => (F.life === 'annual' ? F.bloom.length : 12 - F.dormant.length) * MONTH_H / RIPE_H;
function flowerEconomy(by) {
  const rows = FLOWER_KEYS.map((key, i) => {
    const F = FLOWERS[key], star = ECON_Q.map(q => teaItemValue(null, { type: key, q, hat: isHat(q) }));
    const harvests = harvestsPerYear(F), tea = star[2];
    return { key, i, name: F.name, life: F.life, price: F.price, mature: F.mature, bloom: F.bloom.length, bloomMonths: F.bloom.slice(), harvests, petals: F.petals,
      tea, star, income: harvests * ((F.petals + 1) / 2 / F.petals) * tea, land: classify(F.t, F.m) };   // P77-C 한 번에 평균 (petals + 1) / 2장 → 티백 수
  });
  const cmp = { income: (a, b) => b.income - a.income, price: (a, b) => a.price - b.price, mature: (a, b) => a.mature - b.mature }[by];
  return cmp ? rows.sort((a, b) => cmp(a, b) || a.i - b.i) : rows;
}

// ---------------------------------------------------------------- 꽃방과 블렌딩 (P12-07, P12-08, P08-02)
const DRY_H = MONTH_H;                           // P12-07-02: 꽃방에 널면 흐르는 시간 1달 뒤 다 마름
const BLEND_RATE = 1.2, RECIPE_RATE = 1.5;        // P12-08-04: 따로 만든 차 값의 합 × 1.2 / 레시피에 있는 이름 있는 블렌드는 × 1.5 (10-06)
// P12-08-06: 도감에 모이는 이름 있는 블렌드 9가지 (10-06: 6 → 9) (재료가 정확히 같아야 함)
const BLENDS = {   // P12-08-06 (10-06 검토: 실제로 파는 짝으로 바꿈 · 9가지)
  springfield: { taste: '사과 향에 장미 향 · 부드러운 단맛', name: '봄 들판', parts: ['chamomile', 'rose'], story: '캐모마일과 장미는 꽃차 가게에서 흔히 함께 파는 짝이에요. 사과 향에 장미 향이 얹혀요.' },
  sleepnight: { taste: '포근한 꽃향 · 차분한 단맛', name: '잠드는 밤', parts: ['chamomile', 'lavender'], story: '잠들기 전에 많이 마시는 블렌드예요. 여러 차 회사에서 캐모마일 라벤더로 팔아요.' },
  violetdusk: { taste: '시원한 라벤더 향 · 순한 맛', name: '보랏빛 저녁', parts: ['lavender', 'bpea'], story: '파란 버터플라이피에 라벤더 향을 더한 블렌드예요. 레몬을 넣으면 보랏빛으로 바뀌어요.' },
  redsummer: { taste: '새콤한 맛 · 장미 향 뒷맛', name: '붉은 여름', parts: ['hibiscus', 'rose'], story: '새콤한 히비스커스와 장미를 섞은 붉은 차예요. 차갑게 우려도 맛있어요.' },
  pondmorning: { taste: '맑은 연꽃 향 · 달콤한 재스민', name: '연못의 아침', parts: ['lotus', 'jasmine'], story: '연꽃 향과 재스민 향을 함께 입힌 차는 베트남과 중국에서 오래 만들어 왔어요.' },
  autumngarden: { taste: '쌉쌀한 국화 · 시원한 뒷맛', name: '가을 정원', parts: ['gamguk', 'jasmine'], story: '국화와 재스민은 중국에서 오래 함께 우려 온 짝이에요. 달큰하고 시원한 맛이에요.' },
  sunfield: { taste: '구수한 맛 · 사과 향 단맛', name: '햇살 들판', parts: ['marigold', 'chamomile'], story: '금빛 메리골드와 캐모마일을 섞은 노란 차예요. 허브차 가게에서 자주 보는 짝이에요.' },
  sunsetcomb: { taste: '순한 맛 · 장미 향이 살아요', name: '노을빛 볏', parts: ['celosia', 'rose'], story: '맨드라미차는 맛이 순해서 장미를 더해 향을 살리는 블렌딩을 권해요.' },
  plumwinter: { taste: '맑은 매화 향 · 달큰한 뒷맛', name: '겨울 매화향', parts: ['maehwa', 'napmae'], story: '한겨울에 피는 두 매화를 섞은 정원만의 블렌드예요. 실제로 파는 짝은 아니에요.', original: true },
  // P79-01 (11-05) 새 블렌드 넷: 같은 철에 피는 짝 · 실제로 파는 짝 셋 + 정원만의 짝 하나 — 도감 93 → 101칸
  bluejasmine: { taste: '달콤한 재스민 향 · 푸른 빛깔', name: '푸른 재스민', parts: ['bpea', 'jasmine'], story: '버터플라이피에 재스민 향을 입힌 파란 차예요. 여름 꽃차 가게에서 자주 보는 짝이에요.' },
  rosejasmine: { taste: '장미 향 · 재스민 단맛 두 겹', name: '꽃향 두 겹', parts: ['rose', 'jasmine'], story: '장미와 재스민을 함께 넣은 꽃향 가득한 차예요. 향긋한 블렌드로 흔히 팔아요.' },
  duskhill: { taste: '새콤한 맛 · 시원한 꽃향', name: '노을 언덕', parts: ['hibiscus', 'lavender'], story: '히비스커스에 라벤더를 더한 붉은 차예요. 허브차 가게에서 자주 함께 섞어요.' },
  goldautumn: { taste: '구수한 맛 · 쌉쌀한 국화 향', name: '금빛 가을', parts: ['marigold', 'gamguk'], story: '가을에 함께 피는 메리골드와 감국을 섞은 정원만의 블렌드예요. 실제로 파는 짝은 아니에요.', original: true },
  // P19-08-03 숨은 레시피: 그 칭호를 얻어야 레시피 · 도감에 나타나고 이름이 붙음 (10-17, 열린 질문 ⑩)
  threegarden: { taste: '꽃향 세 겹 · 부드러운 단맛', name: '세 정원의 오후', parts: ['chamomile', 'rose', 'lavender'], story: '들판 · 장미 울타리 · 언덕의 꽃을 한 잔에 담은 정원만의 블렌드예요. 블렌드 연구가에게만 알려 줘요.', original: true, hidden: 't_blend' },
  snowcamellia: { taste: '은은한 단맛 · 맑은 매화 향', name: '동백 눈길', parts: ['dongbaek', 'maehwa'], story: '눈 속에 피는 동백과 매화를 섞은 정원만의 블렌드예요. 나무를 기다린 사람에게만 알려 줘요.', original: true, hidden: 't_tree' },
};
const ALL_BLEND_KEYS = Object.keys(BLENDS);
// P79-02 (11-05) 맛 한 줄: 꽃 차는 FLOWER_TASTE · 이름 있는 블렌드는 BLENDS[k].taste · 이름 없는 블렌드는 꽃마다 첫 낱말을 이어서
const FLOWER_TASTE = { chamomile: '사과 향 · 부드러운 단맛', bpea: '은은한 풀 향 · 순한 맛', hibiscus: '새콤한 맛 · 붉은 빛깔', marigold: '구수한 맛 · 살짝 쌉쌀', celosia: '순하고 구수한 맛',
  lavender: '시원한 꽃향 · 살짝 쌉쌀', jasmine: '달콤한 꽃향 · 깔끔한 뒷맛', gamguk: '쌉쌀한 국화 향 · 단 뒷맛', rose: '장미 향 · 은은한 단맛', lotus: '맑은 연꽃 향 · 구수함',
  dongbaek: '은은한 단맛 · 부드러움', maehwa: '맑은 매화 향 · 새콤함', napmae: '달큰한 향 · 맑은 맛' };
function teaTaste(kind, key, parts) {           // kind 'tea'(key = 꽃) · 'blend'(key = 레시피 키 | null, parts = 꽃 키들)
  if (kind === 'blend') return key && BLENDS[key] ? BLENDS[key].taste : (parts || []).map(k => (FLOWER_TASTE[k] || '').split(' · ')[0]).filter(Boolean).join(' · ');
  return FLOWER_TASTE[key] || '';
}
const BLEND_KEYS = ALL_BLEND_KEYS.filter(k => !BLENDS[k].hidden);
const blendKeys = st => ALL_BLEND_KEYS.filter(k => !BLENDS[k].hidden || (st && st.titles && st.titles[BLENDS[k].hidden] != null));
const DEX_TOTAL = FLOWER_KEYS.length * 5 + BLEND_KEYS.length + LAND_KEYS.length + BLEND_KEYS.length;   // 씨앗·묘목 13 · 꽃 13 · 꽃잎 13 · 티백(꽃 13 + 블렌드 13) · 차 13 · 땅 10 · 블렌드 13 = 101 (P08-03, P08-04, P12-08-06 · P79-01 93 → 101)
const dexTotal = st => DEX_TOTAL + (blendKeys(st).length - BLEND_KEYS.length) * 2;   // 숨은 레시피를 열면 블렌드 · 블렌드 티백 칸이 하나씩 늘어남
function blendRecipe(parts, st) {
  const s = parts.slice().sort().join('|');
  return blendKeys(st).find(k => BLENDS[k].parts.slice().sort().join('|') === s) || null;
}
// 만든 블렌드는 b.recipe를 따르고(숨은 레시피 포함), 미리보기처럼 recipe가 없으면 재료로 찾음
// P79-05 (11-05 사용자 "블랜딩 종류가 아닌거는 블랜딩 안되게"): 레시피 밖 짝은 못 만듦 — 막힐 때 보여 줄 가까운 레시피(고른 꽃이 많이 든 차례 · 최대 2)
function blendNear(parts, st) {
  const has = k => BLENDS[k].parts.filter(p => parts.includes(p)).length;
  return blendKeys(st).filter(k => has(k)).sort((a, b) => has(b) - has(a) || BLENDS[a].parts.length - BLENDS[b].parts.length).slice(0, 2);
}
const blendNearText = (parts, st) => { const n = blendNear(parts, st); return n.length ? `가까운 블렌드: ${n.map(k => `${BLENDS[k].name}(${BLENDS[k].parts.map(p => FLOWERS[p].name).join(' + ')})`).join(' · ')}` : '📖 레시피에서 짝을 골라요'; };
const blendValue = (b, st) => Math.round(b.parts.reduce((a, k) => a + teaValue(FLOWERS[k], b.q, false), 0) * (('recipe' in b ? b.recipe : blendRecipe(b.parts, st)) ? RECIPE_RATE : BLEND_RATE) / 10) * 10;

