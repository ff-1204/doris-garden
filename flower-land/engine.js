// 도리의 정원 (Dori's Garden) — 게임 규칙 엔진 (화면과 분리)
// 기획 체크리스트 P01–P17 기준. 번호는 주석에 함께 적어 둠.
(function (root) {
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
const canReset = (st, cal) => yearOf(st, cal) <= 1;
// P04-01-09 꽃잠 관리 (10-25): 꽃잠은 꽃이 잠든 때라 휴면기처럼 — 옮겨심기 · 번식은 달 조건 없이, 번식은 새해 몫으로 셈
const propYearOf = (st, cal) => yearOf(st, cal) + (cal.frozen ? 1 : 0);
// 수확 한 번의 칸: 꽃잠(쉼달 + 꽃샘달)은 합쳐 한 칸 = 쉼달의 abs (10-25 변경: 꽃잠에 한 번, 2월과는 따로)
const harvestSlot = cal => cal.frozen ? cal.week * 14 + 12 : cal.abs;
// 번식할 만큼 다 자랐는지: 휴면 달엔 덜 자란 꽃도 'dormant'라 나이로 봄 (QA 19회차 — 꽃잠엔 달 조건이 없어 드러남)
const propGrown = f => f.stage === 'mature' || f.stage === 'bloom' || (f.stage === 'dormant' && f.ageH >= FLOWERS[f.type].mature * MONTH_H);
const canMoveNow = (f, cal) => !!f && !f.withered && (cal.frozen || FLOWERS[f.type].sow.includes(cal.month) || f.stage === 'dormant');
// P17-09 찻집은 겨울부터 (12월 · 1월 · 2월 · 쉼달 · 꽃샘달 = idx 9~13, 금요일 저녁 6시 ~ 일요일) — 10-06 변경 (예전 토·일)
const SHOP_OPEN_IDX = 9;
const teaShopOpen = cal => cal.idx >= SHOP_OPEN_IDX;
const hoursToShopOpen = ms => { const c = calendar(ms); return teaShopOpen(c) ? 0 : (c.ws + SHOP_OPEN_IDX * SLOT_H * HOUR - ms) / HOUR; };

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
function germOf(it) {                            // P06-07-07: 유효기간 12달, 뒤 8달에 S자로 0%
  const m = it.ageH / MONTH_H;
  if (m <= 12) return 1;
  if (m >= 20) return 0;
  const x = (m - 12) / 8;
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
  if (F.bloom.includes(month)) return 'bloom';
  if (F.dormant.includes(month)) return 'dormant';
  return 'mature';
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
  if (v < 50 && f.adaptH <= 0) neg += 3;          // P13-05-01-a 적응 기간
  if (v >= 80) pos += 2;
  if (f.pruneH > 0) pos += 3;
  if (f.fertH > 0) pos += 5;
  return { pos, neg, v };
}
function propCount(q) { const s = Math.max(1, stars(q)); return s <= 2 ? 1 : s <= 4 ? 2 : 3; } // P06-02-05-b
function propQuality(q, rng) {                   // P06-15-06-a, a-1, a-2
  const r = rng(), drop = r < 0.5 ? rng() * 0.05 : r < 0.8 ? 0.05 + rng() * 0.05 : 0.1 + rng() * 0.1;
  return Math.max(0.1, q - drop);
}
const teaValue = (F, q, fresh) => Math.round(F.teaBase * (0.5 + q) * (fresh ? 1.1 : 1) / 10) * 10; // P17-04, P17-05
// P12-09 햇차: ★5(품질 80% 초과) 꽃잎으로 만들면 붙는 표시, 값 +10% / P12-11 생화 티백: 말리지 않고 바로 티백, 값 −10% (10-06)
const HAT_RATE = 1.1, RAW_RATE = 0.9, RAW_DECAY = 0, TEA_DECAY = 0;   // 티백은 품질이 줄지 않음 (10-06)
const isHat = q => stars(q) === 5;
const teaItemValue = (st, t, cal) => Math.round(FLOWERS[t.type].teaBase * (0.5 + t.q) * (t.hat ? HAT_RATE : 1) * (t.raw ? RAW_RATE : 1) / 10) * 10;   // ✨ 제철 보너스는 없앰 (10-06, P17-05)
function seasonKey(st, cal) { const y = yearOf(st, cal); return y * 10 + (cal.season === 4 ? 3 : cal.season); } // P17-05-02: 꽃잠엔 겨울 티백 유지
const isFresh = () => false;   // P17-05 제철 보너스 없앰 (10-06): 찻집이 겨울에만 열려 거의 받을 수 없었음. 예전 저장의 seasonKey는 그대로 둠

// ---------------------------------------------------------------- 꽃방과 블렌딩 (P12-07, P12-08, P08-02)
const DRY_H = MONTH_H;                           // P12-07-02: 꽃방에 널면 흐르는 시간 1달 뒤 다 마름
const BLEND_RATE = 1.2, RECIPE_RATE = 1.5;        // P12-08-04: 따로 만든 차 값의 합 × 1.2 / 레시피에 있는 이름 있는 블렌드는 × 1.5 (10-06)
// P12-08-06: 도감에 모이는 이름 있는 블렌드 9가지 (10-06: 6 → 9) (재료가 정확히 같아야 함)
const BLENDS = {   // P12-08-06 (10-06 검토: 실제로 파는 짝으로 바꿈 · 9가지)
  springfield: { name: '봄 들판', parts: ['chamomile', 'rose'], story: '캐모마일과 장미는 꽃차 가게에서 흔히 함께 파는 짝이에요. 사과 향에 장미 향이 얹혀요.' },
  sleepnight: { name: '잠드는 밤', parts: ['chamomile', 'lavender'], story: '잠들기 전에 많이 마시는 블렌드예요. 여러 차 회사에서 캐모마일 라벤더로 팔아요.' },
  violetdusk: { name: '보랏빛 저녁', parts: ['lavender', 'bpea'], story: '파란 버터플라이피에 라벤더 향을 더한 블렌드예요. 레몬을 넣으면 보랏빛으로 바뀌어요.' },
  redsummer: { name: '붉은 여름', parts: ['hibiscus', 'rose'], story: '새콤한 히비스커스와 장미를 섞은 붉은 차예요. 차갑게 우려도 맛있어요.' },
  pondmorning: { name: '연못의 아침', parts: ['lotus', 'jasmine'], story: '연꽃 향과 재스민 향을 함께 입힌 차는 베트남과 중국에서 오래 만들어 왔어요.' },
  autumngarden: { name: '가을 정원', parts: ['gamguk', 'jasmine'], story: '국화와 재스민은 중국에서 오래 함께 우려 온 짝이에요. 달큰하고 시원한 맛이에요.' },
  sunfield: { name: '햇살 들판', parts: ['marigold', 'chamomile'], story: '금빛 메리골드와 캐모마일을 섞은 노란 차예요. 허브차 가게에서 자주 보는 짝이에요.' },
  sunsetcomb: { name: '노을빛 볏', parts: ['celosia', 'rose'], story: '맨드라미차는 맛이 순해서 장미를 더해 향을 살리는 블렌딩을 권해요.' },
  plumwinter: { name: '겨울 매화향', parts: ['maehwa', 'napmae'], story: '한겨울에 피는 두 매화를 섞은 정원만의 블렌드예요. 실제로 파는 짝은 아니에요.', original: true },
  // P19-08-03 숨은 레시피: 그 칭호를 얻어야 레시피 · 도감에 나타나고 이름이 붙음 (10-17, 열린 질문 ⑩)
  threegarden: { name: '세 정원의 오후', parts: ['chamomile', 'rose', 'lavender'], story: '들판 · 장미 울타리 · 언덕의 꽃을 한 잔에 담은 정원만의 블렌드예요. 블렌드 연구가에게만 알려 줘요.', original: true, hidden: 't_blend' },
  snowcamellia: { name: '동백 눈길', parts: ['dongbaek', 'maehwa'], story: '눈 속에 피는 동백과 매화를 섞은 정원만의 블렌드예요. 나무를 기다린 사람에게만 알려 줘요.', original: true, hidden: 't_tree' },
};
const ALL_BLEND_KEYS = Object.keys(BLENDS);
const BLEND_KEYS = ALL_BLEND_KEYS.filter(k => !BLENDS[k].hidden);
const blendKeys = st => ALL_BLEND_KEYS.filter(k => !BLENDS[k].hidden || (st && st.titles && st.titles[BLENDS[k].hidden] != null));
const DEX_TOTAL = FLOWER_KEYS.length * 5 + BLEND_KEYS.length + LAND_KEYS.length + BLEND_KEYS.length;   // 씨앗·묘목 13 · 꽃 13 · 꽃잎 13 · 티백(꽃 13 + 블렌드 9) · 차 13 · 땅 10 · 블렌드 9 = 93 (P08-03, P08-04, P12-08-06)
const dexTotal = st => DEX_TOTAL + (blendKeys(st).length - BLEND_KEYS.length) * 2;   // 숨은 레시피를 열면 블렌드 · 블렌드 티백 칸이 하나씩 늘어남
function blendRecipe(parts, st) {
  const s = parts.slice().sort().join('|');
  return blendKeys(st).find(k => BLENDS[k].parts.slice().sort().join('|') === s) || null;
}
const blendRate = (parts, st) => blendRecipe(parts, st) ? RECIPE_RATE : BLEND_RATE;
// 만든 블렌드는 b.recipe를 따르고(숨은 레시피 포함), 미리보기처럼 recipe가 없으면 재료로 찾음
const blendValue = (b, st) => Math.round(b.parts.reduce((a, k) => a + teaValue(FLOWERS[k], b.q, false), 0) * (('recipe' in b ? b.recipe : blendRecipe(b.parts, st)) ? RECIPE_RATE : BLEND_RATE) / 10) * 10;

// ---------------------------------------------------------------- 상태
function create(now, rng) {
  rng = rng || Math.random;
  const cal = calendar(now);
  // P04-04 시작 선물은 없앰 (10-06). 예전 저장의 st.starterGift 표시는 app.js 첫걸음 순서에서만 씀
  return _create(now, rng, cal);
}
function _create(now, rng, cal) {
  const tiles = [];
  for (let i = 0; i < W * H; i++) tiles.push({ t: BASE_T + (rng() - 0.5) * 1.5, m: BASE_M + (rng() - 0.5) * 4, life: 0 });
  return {
    // P04-05: 꽃잠에 시작하면 그 꽃잠은 0년차(준비), 1년차는 다음 월요일 3월부터 (10-17)
    v: 3, firstWeek: cal.frozen ? cal.week + 1 : cal.week, startedInSleep: cal.frozen, virtual: now, lastReal: now, lastAbs: cal.abs, speed: 1,
    money: 15000,                                                         // P17-06
    tiles, flowers: [], items: [], petals: [], teas: [], pending: [], reservations: [],
    drying: [], dried: [], blends: [], cups: [],                         // P12-07 꽃방, P12-08 블렌딩, P17-10 찻잔
    fert: 0, water: 10, shears: 5, hoe: 10, basket: 10, weedCount: 0, pruneCount: 0, // 처음에 물병 10개, 가위 1개(5번), 호미·바구니 1개(10번)
    dex: { form: {}, flower: {}, petal: {}, teabag: {}, bagBlend: {}, tea: {}, land: { barren: true }, blend: {}, deco: {}, honey: {}, mine: {}, memento: {}, letter: {} }, // P08-01-04, P08-02, P08-03
    log: [], records: [], yearBest: null, helpYear: null, nextId: 1,
    settings: { toast: { 3: true, 8: true, 9: true }, sleep: { on: true, from: 23, to: 7 }, marks: { water: true, weed: true, prune: true, fert: true } },
    onboarded: false, _fertNew: 0, _bloomNew: {},
    journal: { done: {} }, titles: {}, titleOn: null, stats: {}, gardenId: newGardenId(), lastExport: null, mig: MIGRATIONS.length,   // P19 도감일지 · P20 이름표 · 마지막 파일 저장 · mig: 예전 저장 보정을 어디까지 했는지(새 정원은 다 한 것)
    shop: newShop(), decos: [], honey: {}, gift: null, firstFlower: null, mine: newMine(), orders: null, bestScore: 0, gifts: null, letterPending: [], letterBox: [], restClosed: null, account: null, actAt: null,   // P20-08 계정 기록 · P20-06 마지막으로 손댄 때 · P24 광산 · P17-15 찻집 가꾸기 · P17-16 장식 · P18 꿀 · P22 이웃의 화분 · 1장 첫 꽃
  };
}
const nid = st => st.nextId++;
const inGarden = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < W && y < H;   // 정원의 한 칸 (10-24)
const plantUnit = F => F.life === 'tree' || F.form === 'sapling' ? '그루' : '포기';   // P16-02-05 세는 말: 나무 · 묘목은 그루
const unitOf = fs => fs.length && fs.every(f => plantUnit(FLOWERS[f.type]) === '그루') ? '그루' : '포기';

// ---------------------------------------------------------------- 알림 (P11)
const TOAST_TYPES = [3, 8, 9];                   // P11-02-01-a
function addLog(st, type, text, ctx) {
  const cal = calendar(st.virtual);
  st.log.push({ y: yearOf(st, cal), m: cal.month, d: cal.day, type, text });
  if (st.log.length > 600) st.log.shift();
  if (ctx && ctx.live && TOAST_TYPES.includes(type) && st.settings.toast[type] && ctx.toast) ctx.toast(text, type);
}
function flushPending(st, ctx) {
  if (st._fertNew > 0) { addLog(st, 10, `비료 ${st._fertNew}개가 만들어졌어요`, ctx); st._fertNew = 0; }
  if (st._autoSold && st._autoSold.n) { addLog(st, 13, `손님이 찻잔 ${st._autoSold.n}잔을 사 갔어요 · +${st._autoSold.sum.toLocaleString('ko-KR')}원`, ctx); st._autoSold = { n: 0, sum: 0 }; }
  if (st._driedNew > 0) { addLog(st, 12, `꽃방에서 꽃잎 ${st._driedNew}장이 다 말랐어요`, ctx); st._driedNew = 0; }
  const b = st._bloomNew;
  for (const k in b) {
    const F = FLOWERS[k], n = b[k];
    addLog(st, 8, n > 1 ? `${F.name} ${n}${plantUnit(F)}가 피었어요. 수확할 수 있어요` : `${josa(F.name, '이/가')} 피었어요. 수확할 수 있어요`, ctx);
  }
  st._bloomNew = {};
}
function addFert(st, n) { st.fert += n; st._fertNew += n; }

// ---------------------------------------------------------------- 시간 진행
function advance(st, target, ctx) {
  while (st.virtual < target - 1) {
    const cal = calendar(st.virtual);
    const next = Math.min(target, cal.slotEnd, st.virtual + STEP_H * HOUR);
    const dtH = (next - st.virtual) / HOUR;
    if (!cal.frozen && dtH > 0) step(st, dtH, cal, ctx);
    if (dtH > 0) autoSell(st, cal, dtH, ctx);                          // P17-11 카운터 찻잔은 꽃잠에도 팔림
    if (dtH > 0) mineRegen(st, dtH);                                   // P24 광산 기력 (꽃잠에도)
    st.virtual = next;
    const nc = calendar(st.virtual);
    if (nc.abs !== st.lastAbs) { st.lastAbs = nc.abs; onSlot(st, nc, ctx); }
  }
  flushPending(st, ctx);
  { const c = calendar(st.virtual); if (teaShopOpen(c) && (!st.orders || st.orders.abs !== c.abs)) makeOrders(st, c); }   // P23-01 찻집이 열린 채로 시작 · 열어도 그 달 쪽지 (QA 5회차)
  checkLands(st, ctx);
  checkHelp(st, calendar(st.virtual), ctx);
  checkJournal(st, ctx);
}

function step(st, dtH, cal, ctx) {
  // 1) 땅 (P01, P15)
  const n = W * H, WS = new Float32Array(n), WT = new Float32Array(n), WM = new Float32Array(n);
  for (const f of st.flowers) {
    if (f.withered) continue;
    const r = stageRadius(f);
    if (r < 0) continue;
    const F = FLOWERS[f.type];
    for (let y = Math.max(0, f.y - r); y <= Math.min(H - 1, f.y + r); y++) {
      for (let x = Math.max(0, f.x - r); x <= Math.min(W - 1, f.x + r); x++) {
        const d = Math.hypot(x - f.x, y - f.y);
        if (d > r + 0.01) continue;
        const w = 1 - d / (r + 1), i = y * W + x;
        WS[i] += w; WT[i] += w * F.t; WM[i] += w * F.m;
      }
    }
  }
  const bt = BASE_T + SEASON_T[cal.season], bm = BASE_M;
  const decay = (1 - LIFE_MIN) / (12 * MONTH_H) * LIFE_DECAY_SEASON[cal.season];  // P15-05: 약 1년
  for (let i = 0; i < n; i++) {
    const tl = st.tiles[i], w = WS[i];
    if (w > 0) {
      const k = 1 - Math.exp(-0.15 * Math.min(w, 1.5) * dtH);
      tl.t += (WT[i] / w - tl.t) * k;
      tl.m += (WM[i] / w - tl.m) * k;
      tl.life = Math.min(1, tl.life + (1 - tl.life) * k * 1.2);
    } else {
      tl.life = Math.max(0, tl.life - decay * dtH);
    }
    const a = 0.004 * dtH * (1 - Math.min(w, 1));                             // 계절 기본 온도 쪽으로 (가장자리와 빈 땅)
    tl.t += (bt - tl.t) * a; tl.m += (bm - tl.m) * a;
  }

  // 2) 꽃 (P07, P13)
  for (const f of st.flowers) {
    if (f.withered) continue;
    const F = FLOWERS[f.type];
    if (f.lifeH == null) f.lifeH = f.ageH;          // 심은 뒤 실제로 흐른 시간 (QA 12회차: 수명 · "심은 지"는 이걸로)
    f.ageH += dtH * growRate(st, f);                // P27 생장 장치 (없으면 1) — 다 자라기까지만 빨라짐
    f.lifeH += dtH;
    const s = computeStage(f, cal.month);
    if (F.life === 'annual') {
      if (s === 'bloom') f.bloomed = true;
      else if (f.bloomed || f.lifeH / MONTH_H > 12) { wither(st, f, cal, ctx); continue; }
    }
    f.stage = s;
    if (s === 'bloom' && f.bloomKey !== cal.abs) {
      f.bloomKey = cal.abs;
      st._bloomNew[f.type] = (st._bloomNew[f.type] || 0) + 1;
      if (!st.dex.flower[f.type]) { st.dex.flower[f.type] = true; addLog(st, 9, `도감에 등록: ${F.name}`, ctx); }
      if (f.origin !== '이웃') (st.ownBloom = st.ownBloom || {})[f.type] = true;
      seeYear(st, 'bloom', f.type);   // 직접 심어 피운 꽃 (QA 4회차: 화분 꽃과 6장 퀘스트가 겹치지 않게)
    }
    const { pos, neg } = monthlyChange(st, f);
    f.q = Math.min(1, f.q + pos / 100 * dtH / MONTH_H);
    if (neg > 0 && f.q > 0.3) f.q = Math.max(0.3, f.q - neg / 100 * dtH / MONTH_H); // P13-05-04-a
    f.waterH = Math.max(0, f.waterH - dtH);
    if (f.waterH <= 0) f.thirstH += dtH;
    f.weedH = Math.max(0, f.weedH - dtH);
    f.pruneH = Math.max(0, f.pruneH - dtH);
    f.fertH = Math.max(0, f.fertH - dtH);
    f.adaptH = Math.max(0, f.adaptH - dtH);
  }

  // 3) 창고 (P06-07, P06-14, P06-15)
  for (let i = st.items.length - 1; i >= 0; i--) {
    const it = st.items[i];
    if (it.packaged) {                                                         // P06-15-07-a 특수 포장
      if (FLOWERS[it.type].sow.includes(cal.month)) it.packaged = false; else continue;
    }
    it.ageH += dtH;
    it.q = Math.max(0, it.q - 0.05 * dtH / MONTH_H);                           // P06-15-10
    if (it.q <= 0 && germOf(it) <= 0) { st.items.splice(i, 1); addFert(st, 1); } // P13-04-01
  }
  autoCompost(st, ctx);                                                        // P06-16-03
  // 4) 찻집 (P12-04)
  for (let i = st.petals.length - 1; i >= 0; i--) {
    const p = st.petals[i];
    p.q = Math.max(0, p.q - 0.2 * dtH / MONTH_H);
    if (p.q <= 0) { st.petals.splice(i, 1); addFert(st, 1); }
  }
  for (let i = st.teas.length - 1; i >= 0; i--) {
    const t = st.teas[i];
    // P12-12 (10-06): 티백이 되는 순간 품질이 그대로 멈춤 (생화 티백 · 티백 · 블렌드 티백 모두). 품질이 줄어드는 건 제다실의 생화뿐
    if (t.q <= 0) { st.teas.splice(i, 1); addFert(st, 1); }
  }
  // 꽃방 (P12-07): 말리는 동안과 말린 뒤에는 품질이 떨어지지 않음
  for (let i = st.drying.length - 1; i >= 0; i--) {
    const d = st.drying[i];
    d.leftH -= dtH;
    if (d.leftH <= 0) {
      st.drying.splice(i, 1);
      st.dried.push({ id: d.id, type: d.type, q: d.q });
      st._driedNew = (st._driedNew || 0) + 1;
    }
  }
  // 5) 꺾꽂이·접붙이기로 뿌리 내리는 중인 것 (P06-02-05-a-2)
  for (let i = st.pending.length - 1; i >= 0; i--) {
    const p = st.pending[i];
    p.dueH -= dtH;
    if (p.dueH <= 0) {
      for (const q of p.qs) st.items.push(newItem(st, p.type, q, '번식', p.parent));
      st.pending.splice(i, 1);
      const F = FLOWERS[p.type];
      addLog(st, 10, `${F.name} ${FORM[F.form].name} ${p.qs.length}개가 뿌리를 내려 창고에 들어왔어요`, ctx);   // 일지에만 (QA 19회차)
    }
  }
}

function wither(st, f, cal, ctx) {                // P07-02
  f.withered = true; f.stage = 'withered'; f.witherAbs = cal.abs;
  const F = FLOWERS[f.type];
  if (F.prop === '채종' && f.bloomed) {           // P07-02-01 자동 채종
    const n = propCount(f.q);
    for (let i = 0; i < n; i++) st.items.push(newItem(st, f.type, propQuality(f.q, ctx && ctx.rng || Math.random), '번식', F.name));
  }
}

const DAILY_GIFT = 500;                          // P17-13 (10-06)
function onSlot(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx);
  deliverLetters(st, cal, ctx);                                                // P26 답장 편지
  if (!calendar(st.virtual - 1000).frozen) { hiveTick(st, ctx); const nb = barrelTick(st); if (nb) addLog(st, 16, `빗물 통이 꽃 ${nb}포기에 물을 줬어요`, ctx); }
  if (teaShopOpen(cal)) { makeOrders(st, cal); addLog(st, 15, '찻집에 새 주문 쪽지가 왔어요', ctx); }   // P23-01
  else if (st.orders) st.orders = null;   // P18 벌통 · P25 빗물 통: 끝난 달이 꽃잠이 아니면
  // 시든 한해살이는 다음 달에 사라지며 비료 1개 (P07-02)
  st.flowers = st.flowers.filter(f => { if (f.withered && cal.abs > f.witherAbs) { addFert(st, 1); return false; } return true; });
  if (cal.idx === 12) recordYear(st, cal, ctx);                                 // P04-02
  // P17-13 하루 용돈: 요일이 바뀔 때(매일 아침 6시, 짝수 idx)마다 500원. 꽃잠(일요일)도 받음
  if (cal.idx % 2 === 0) { st.money += DAILY_GIFT; addLog(st, 11, `${'월화수목금토일'[cal.idx / 2]}요일 아침, 용돈 ${DAILY_GIFT}원이 들어왔어요`, ctx); }
  // 예약 배송 (P06-05)
  for (const r of st.reservations) {
    if (r.done || r.year !== yr || r.deliverIdx !== cal.idx) continue;
    for (let i = 0; i < r.qty; i++) { const it = newItem(st, r.type, 1, '예약'); it.packaged = true; st.items.push(it); }
    r.done = true;
    const F = FLOWERS[r.type];
    addLog(st, 3, `예약한 ${F.name} ${FORM[F.form].name} ${r.qty}${FORM[F.form].unit}가 도착했어요`, ctx);
  }
  st.reservations = st.reservations.filter(r => !r.done || r.year >= yr);
  // 심을 때 (P11-01-01)
  for (const k of FLOWER_KEYS) {
    const F = FLOWERS[k];
    if (!F.windows.some(w => w[0] === cal.month)) continue;
    const have = st.items.filter(it => it.type === k && germOf(it) > 0).length;
    addLog(st, 1, `${josa(F.name, '을/를')} 심을 때예요. 화원에 ${josa(FORM[F.form].name, '이/가')} 들어왔어요${have ? `. 창고에도 ${have}개 있어요` : ''}`, ctx);
  }
  flushPending(st, ctx);
  checkLands(st, ctx);
}

function recordYear(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx);
  const sc = yearScore(st), prevBest = st.bestScore || 0;   // P23-02 한 해 정원 평가
  const rec = { year: yr, counts: landCounts(st), best: st.yearBest, dex: dexCount(st), dexTotal: dexTotal(st), titleOn: st.titleOn || null, log: st.log.slice(), snapshot: null, score: sc.total, scoreParts: sc.parts, orders: sc.orders, giftsTotal: sc.giftsTotal, prevBest };
  st.bestScore = Math.max(prevBest, sc.total);
  st.yearSeen = { bloom: {}, blend: {}, honey: {} };   // 새해에 다시
  st.records.unshift(rec);
  st.records = st.records.slice(0, 10);
  if (ctx && ctx.onRecord) ctx.onRecord(rec);
  st.log = [];                                                                // P11-02-04-e: 쉼달에 초기화
  st.yearBest = null;
  addLog(st, 7, `${yr}년차 정원을 기록했어요 · 🏅 정원 점수 ${sc.total}점${sc.total > prevBest && prevBest ? ' · 최고 기록!' : ''}`, ctx);
  addLog(st, 4, '다음 해 꽃을 예약할 수 있어요', ctx);
}

function landCounts(st) {
  const c = {}; for (const k of LAND_KEYS) c[k] = 0;
  for (const tl of st.tiles) c[landOf(tl)]++;
  return c;
}
function checkLands(st, ctx) {
  const c = landCounts(st);
  for (const k of LAND_KEYS) if (c[k] > 0 && !st.dex.land[k]) { st.dex.land[k] = true; addLog(st, 9, `도감에 등록: ${LANDS[k].name}`, ctx); }
}
function dexCount(st) {
  const d = st.dex;
  return Object.keys(d.form || {}).length + Object.keys(d.flower).length + Object.keys(d.petal || {}).length + Object.keys(d.teabag || {}).length + Object.keys(d.bagBlend || {}).length + Object.keys(d.tea).length + Object.keys(d.land).length + Object.keys(d.blend || {}).length;
}
function checkHelp(st, cal, ctx) {               // P17-06-01
  const yr = yearOf(st, cal);
  if (st.helpYear === yr) return;
  if (st.flowers.some(f => !f.withered)) return;
  if (st.items.some(it => germOf(it) > 0)) return;
  if (st.teas.length || st.petals.length || st.drying.length || st.dried.length || st.blends.length || (st.cups || []).length) return;
  if (st.money >= 500) return;
  st.money += 5000; st.helpYear = yr;
  addLog(st, 11, '정원을 다시 시작할 수 있도록 5,000원이 들어왔어요', ctx);
}

// ---------------------------------------------------------------- 물건
function newItem(st, type, q, origin, parent) {
  // P08-03: 씨앗·묘목·모종·연근은 처음 손에 들어올 때 도감에 (화원에서 사거나, 번식하거나, 예약이 도착하거나)
  if (st.dex.form && !st.dex.form[type]) { st.dex.form[type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[type].name} ${FORM[FLOWERS[type].form].name}`); }
  return { id: nid(st), type, q, ageH: 0, packaged: false, origin: origin || '화원', parent: parent || null, got: st.virtual };
}

// ---------------------------------------------------------------- 행동
const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra || {});
const no = msg => ({ ok: false, msg });
const flowerAt = (st, x, y) => st.flowers.find(f => f.x === x && f.y === y);

function buy(st, type, n) {                      // P06-01-01
  const cal = calendar(st.virtual), F = FLOWERS[type];
  n = n == null ? 1 : n;
  if (!Number.isInteger(n) || n < 1 || n > 99) return no('살 개수가 맞지 않아요');
  if (!F || !Object.prototype.hasOwnProperty.call(FLOWERS, type)) return no('팔지 않는 꽃이에요');
  if (cal.frozen) return no('꽃잠에는 일반 판매를 쉬어요. 예약은 할 수 있어요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} 심는 기간에만 팔아요`);
  const cost = F.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost;
  for (let i = 0; i < n; i++) st.items.push(newItem(st, type, 1, '화원'));
  return ok(`${F.name} ${FORM[F.form].name} ${n}${FORM[F.form].unit}를 샀어요`);
}

// 화원 소모품: 비료 1개 = 1번, 물병 1개 = 물 주기 1번, 호미 1개 = 잡초 뽑기 10번, 가위 1개 = 가지치기 5번, 바구니 1개 = 수확 10번. 꽃잠에도 팔아요
const SUPPLIES = {
  fert: { name: '비료', icon: '🌱', price: 150, per: 1, unit: '개', desc: '한 포기에 주면 1달 동안 품질이 올라요' },
  water: { name: '물병', icon: '💧', price: 50, per: 1, unit: '개', desc: '물병 1개로 한 포기에 물을 줘요. 2달 동안 괜찮아요' },
  hoe: { name: '호미', icon: '⛏️', price: 400, per: 10, unit: '번', desc: '호미 1개로 잡초를 10번 뽑을 수 있어요' },
  basket: { name: '바구니', icon: '🧺', price: 500, per: 10, unit: '번', desc: '바구니 1개로 꽃잎을 10번 거둘 수 있어요' },
  shears: { name: '가위', icon: '✂️', price: 500, per: 5, unit: '번', desc: '가위 1개로 가지치기를 5번 할 수 있어요' },
};
function buySupply(st, kind, n) {
  const S = Object.prototype.hasOwnProperty.call(SUPPLIES, kind) ? SUPPLIES[kind] : null; n = n == null ? 1 : n;
  if (!S) return no('팔지 않는 물건이에요');
  if (!Number.isInteger(n) || n < 1 || n > 99) return no('살 개수가 맞지 않아요');
  const cost = S.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost; st[kind] = (st[kind] || 0) + S.per * n;
  return ok(`${S.name} ${n}개를 샀어요`);
}

// P06-16: 곧 시드는(받은 지 10달 넘은) 씨앗·묘목 중 품질 5% 이하는 비료로 (1개 → 비료 1개)
const COMPOST_Q = 0.05;
const compostable = (it, byHand) => !it.packaged && (byHand || it.ageH >= 10 * MONTH_H) && it.q <= COMPOST_Q + 1e-9;
// P06-16-03: "곧 시들어요" 중 품질 0%(반올림)는 저절로 비료가 됨. 정원 일지에 한 줄
function autoCompost(st, ctx) {
  const list = st.items.filter(it => compostable(it) && pct(it.q) === 0);
  if (!list.length) return 0;
  for (const it of list) st.items.splice(st.items.indexOf(it), 1);
  st.fert += list.length;                         // 일지는 아래 한 줄로 ("비료 ○개가 만들어졌어요"와 겹치지 않게)
  const names = [...new Set(list.map(it => `${FLOWERS[it.type].name} ${FORM[FLOWERS[it.type].form].name}`))].join(', ');
  addLog(st, 10, `창고의 ${names} ${list.length}개가 다 시들어 비료가 되었어요`, ctx);
  return list.length;
}
function compostItems(st, ids) {
  const list = st.items.filter(it => ids.includes(it.id) && compostable(it, true));
  if (!list.length) return no('비료로 만들 수 있는 게 없어요');
  for (const it of list) st.items.splice(st.items.indexOf(it), 1);
  addFert(st, list.length);
  return ok(`${FLOWERS[list[0].type].name} ${FORM[FLOWERS[list[0].type].form].name} ${list.length}${FORM[FLOWERS[list[0].type].form].unit}로 비료 ${list.length}개를 만들었어요`);
}

function reservedCount(st, type, year) {
  return st.reservations.filter(r => r.type === type && r.year === year).reduce((a, r) => a + r.qty, 0);
}
function reserve(st, cart) {                     // P06-01-02, P06-04, P06-05, P06-06
  const cal = calendar(st.virtual);
  if (!cal.frozen) return no('예약은 쉼달과 꽃샘달에만 할 수 있어요');
  const year = yearOf(st, cal) + 1;
  let cost = 0;
  const per = {};
  for (const c of cart) {
    if (c.qty <= 0) continue;
    per[c.type] = (per[c.type] || 0) + c.qty;
    cost += reservationPrice(FLOWERS[c.type]) * c.qty;
  }
  for (const k in per) if (reservedCount(st, k, year) + per[k] > 3) return no(`${josa(FLOWERS[k].name, '은/는')} 한 해에 3개까지 예약할 수 있어요`);
  if (cost <= 0) return no('예약할 꽃을 골라 주세요');
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost;
  for (const c of cart) {
    if (c.qty <= 0) continue;
    st.reservations.push({ id: nid(st), type: c.type, window: c.window, qty: c.qty, year, deliverIdx: deliverIdxOf(c.window), done: false });
  }
  return ok(`예약했어요. ${cost.toLocaleString('ko-KR')}원을 냈어요`, { cost });
}
function cartSummary(st, cart) {
  const cal = calendar(st.virtual), year = yearOf(st, cal) + 1;
  return cart.filter(c => c.qty > 0).map(c => {
    const F = FLOWERS[c.type], di = deliverIdxOf(c.window);
    const win = F.windows.find(w => w[0] === c.window);
    return { F, qty: c.qty, year, deliverMonth: MONTHS[di], window: win, unit: reservationPrice(F), total: reservationPrice(F) * c.qty };
  });
}

function plant(st, itemId, x, y, rng) {          // P06-01-05, P06-07-07-f
  rng = rng || Math.random;
  const cal = calendar(st.virtual);
  const it = st.items.find(i => i.id === itemId);
  if (!it) return no('창고에 없어요');
  const F = FLOWERS[it.type];
  if (cal.frozen) return no('꽃잠에는 정원이 쉬어요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} ${F.sow.map(monthName).join('·')}에 심을 수 있어요`);
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('이 자리에는 이미 꽃이 있어요');
  if (decoAt(st, x, y)) return no('이 자리에는 장식이 있어요');
  const g = germOf(it);
  if (g <= 0) return no(`${josa(FORM[F.form].rate, '이/가')} 0%라 심을 수 없어요`);
  st.items.splice(st.items.indexOf(it), 1);
  if (rng() >= g) {
    addFert(st, 1);
    return ok(F.form === 'seed' ? '이번엔 쉬어 가나 봐요. 싹이 트지 않은 씨앗은 비료가 됐어요' : '이번엔 뿌리를 내리지 못했어요. 비료가 됐어요', { failed: true });
  }
  const f = {
    id: nid(st), type: it.type, x, y, q: it.q, startQ: it.q, origin: it.origin, parent: it.parent,
    ageH: 0, stage: F.form === 'seed' ? 'germ' : 'young', bloomed: false, withered: false,
    waterH: 0, weedH: 24, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 24,   // 심은 직후는 목마름 (물은 직접, 10-06) · 흙은 고른 상태
    harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: yearOf(st, cal),
  };
  st.flowers.push(f);
  return ok(`${josa(F.name, '을/를')} 심었어요`, { flower: f });
}

const TOOLS = {
  water: { name: '물 주기', icon: '💧' },
  weed: { name: '잡초 뽑기', icon: '🌿' },
  prune: { name: '가지치기', icon: '✂️' },
  fert: { name: '비료 주기', icon: '🌱' },
  harvest: { name: '수확', icon: '🧺' },
};
function canCare(st, f, tool, cal) {
  if (!f || f.withered) return false;
  const F = FLOWERS[f.type];
  switch (tool) {
    case 'water': return f.waterH <= 0;
    case 'weed': return f.weedH <= 0;
    case 'prune': return F.prune && f.pruneH <= 0;
    case 'fert': return f.fertH <= 0;
    case 'harvest': return f.stage === 'bloom' && f.harvestKey !== harvestSlot(cal);   // 꽃잠엔 핀 채로 잠든 꽃만 (새로 피지 않음) · 꽃잠에 한 번
  }
  return false;
}
function care(st, tool, tiles, ctx) {            // P13 · 꽃잠에도 돌보기 · 수확 (P04-01-09, 효과 시간은 흐르는 시간에만 줄어듦)
  const cal = calendar(st.virtual);
  const targets = tiles.map(([x, y]) => flowerAt(st, x, y)).filter(f => canCare(st, f, tool, cal));
  if (!targets.length) return no('돌볼 꽃이 없어요');
  if (tool === 'fert' && st.fert < targets.length) return no(`비료가 ${targets.length - st.fert}개 모자라요`); // P13-06-01-c
  if (tool === 'water' && (st.water || 0) < targets.length) return no(st.water ? `물병이 ${targets.length - st.water}개 모자라요` : '물병이 없어요. 창고에서 살 수 있어요');
  if (tool === 'weed' && (st.hoe || 0) < targets.length) return no(st.hoe ? `호미가 ${targets.length - st.hoe}번 모자라요` : '호미가 없어요. 창고에서 살 수 있어요');
  if (tool === 'harvest' && (st.basket || 0) < targets.length) return no(st.basket ? `바구니가 ${targets.length - st.basket}번 모자라요` : '바구니가 없어요. 창고에서 살 수 있어요');
  if (tool === 'prune' && (st.shears || 0) < targets.length) return no(st.shears ? `가위가 ${targets.length - st.shears}번 모자라요` : '가위가 없어요. 창고에서 살 수 있어요');
  for (const f of targets) {
    if (tool === 'water') { f.waterH = 24; f.thirstH = 0; st.water--; }                     // 유지: 2달
    if (tool === 'weed') { f.weedH = 24; st.hoe--; if (++st.weedCount % 5 === 0) addFert(st, 1); }
    if (tool === 'prune') { f.pruneH = 12; st.shears--; if (++st.pruneCount % 3 === 0) addFert(st, 1); } // 향상: 1달
    if (tool === 'fert') { f.fertH = 12; st.fert--; }
    if (tool === 'harvest') {                                                    // P12-05
      f.harvestKey = harvestSlot(cal); st.basket--;
      st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) });
      if (f.origin === '이웃' && !f.giftPicked) { f.giftPicked = true; st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) }); }   // 화분 첫 수확은 2장 (QA 6회차)
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); } // P08-02-02
    }
  }
  flushPending(st, ctx);
  const two = tool === 'harvest' && targets.length === 1 && targets[0].origin === '이웃' && st.petals.filter(p => p.type === targets[0].type).length >= 2 && targets[0].harvestKey === harvestSlot(cal);
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: two ? '꽃잎 2장을 거둬 제다실로 보냈어요' : '꽃잎을 거둬 제다실로 보냈어요' }[tool];
  return ok(`${targets.length}${unitOf(targets)}에 ${word}`, { count: targets.length });
}

function propagate(st, flowerId, rng, ctx) {     // P06-02-05
  rng = rng || Math.random;
  const cal = calendar(st.virtual), f = st.flowers.find(x => x.id === flowerId);
  if (!f || f.withered) return no('번식할 꽃이 없어요');
  const F = FLOWERS[f.type], yr = propYearOf(st, cal);   // 꽃잠에 한 번식은 새해 몫 (P04-01-09)
  if (F.prop === '채종') return no('한해살이는 시들 때 씨앗을 자동으로 거둬요');
  if (!propGrown(f)) return no('다 자란 꽃만 번식할 수 있어요');
  if (!cal.frozen && !F.propMonths.includes(cal.month)) return no(`${josa(F.prop, '은/는')} ${F.propMonths.map(monthName).join('·')}에 할 수 있어요`);
  if (f.propYear === yr) return no(cal.frozen ? '이 꽃은 새해 몫 번식을 이미 했어요' : f.propRest ? '이 꽃은 꽃잠에 새해 몫 번식을 했어요' : '이 꽃은 올해 이미 번식했어요');
  f.propYear = yr; f.propRest = !!cal.frozen;   // 꽃잠에 했는지 (QA 19회차: 다음 해 문구)
  const n = propCount(f.q), qs = [];
  for (let i = 0; i < n; i++) qs.push(propQuality(f.q, rng));
  const formName = FORM[F.form].name;
  if (F.prop === '꺾꽂이' || F.prop === '접붙이기') {
    st.pending.push({ id: nid(st), type: f.type, qs, dueH: MONTH_H, parent: F.name, method: F.prop });
    return ok(`${josa(F.prop, '을/를')} 했어요. ${cal.frozen ? '정원이 깨어나고 ' : ''}1달 뒤 ${formName} ${n}개가 창고에 들어와요`);
  }
  for (const q of qs) st.items.push(newItem(st, f.type, q, '번식', F.name));
  return ok(`${josa(F.prop, '으로/로')} ${formName} ${n}개를 얻었어요`);
}

function move(st, flowerId, x, y) {              // P13-03
  const cal = calendar(st.virtual), f = st.flowers.find(z => z.id === flowerId);
  if (!f || f.withered) return no('옮길 꽃이 없어요');
  const F = FLOWERS[f.type];
  if (!canMoveNow(f, cal)) return no('심는 기간이나 휴면기, 꽃잠에 옮길 수 있어요');   // 꽃잠엔 모든 꽃 (P04-01-09)
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('그 자리에는 이미 꽃이 있어요');
  if (decoAt(st, x, y)) return no('그 자리에는 장식이 있어요');
  f.x = x; f.y = y; f.adaptH = 24;
  return ok(`${josa(F.name, '을/를')} 옮겨 심었어요. ${cal.frozen ? '정원이 깨어나면 ' : ''}2달 동안 새 자리에 적응해요`);
}

// P08-04: 제다실에서 만든 것은 티백 (찻집으로 보내는 형태). 티백은 처음 만들 때, 차는 찻집에서 처음 우려 팔 때 도감에
function regTeabag(st, type, ctx) {
  st.dex.teabag = st.dex.teabag || {};
  if (!st.dex.teabag[type]) { st.dex.teabag[type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[type].name} 티백`, ctx); }
}
function makeTea(st, ids, ctx) {                 // P12-03
  const cal = calendar(st.virtual);
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요');
  for (const p of list) {
    st.petals.splice(st.petals.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: p.seasonKey, hat: isHat(p.q) });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`티백 ${list.length}개를 만들었어요`);
}
// P12-10 생화 티백 (예전 생차): 생화를 말리지 않고 티백으로. 값 −10% (10-06)
function makeRaw(st, ids, ctx) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요');
  for (const p of list) {
    st.petals.splice(st.petals.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: p.seasonKey, hat: isHat(p.q), raw: true });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`생화 티백 ${list.length}개를 만들어 찻집으로 보냈어요`);
}
// P12-07 꽃방: 꽃잎을 널면 1달(흐르는 시간) 뒤 말린 꽃잎이 됨. 언제든 널 수 있음
function dryPetals(st, ids) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('널 꽃잎이 없어요');
  for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H }); }
  bump(st, 'dried', list.length);
  return ok(`꽃잎 ${list.length}장을 꽃방에 널었어요. 1달 뒤에 다 말라요`);
}
// P12-07-04: 말린 꽃잎으로도 차를 만들 수 있음 (제철 보너스는 없음)
function makeTeaDried(st, ids, ctx) {
  const list = st.dried.filter(p => ids.includes(p.id));
  if (!list.length) return no('말린 꽃잎이 없어요');
  for (const p of list) {
    st.dried.splice(st.dried.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: -1, hat: isHat(p.q) });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`말린 꽃잎으로 티백 ${list.length}개를 만들었어요`);
}
// P12-08 블렌딩: 언제든 (변경 10-06, 예전엔 꽃잠에만), 서로 다른 말린 꽃잎 2~3장으로 블렌딩 차 1잔
function blend(st, ids, ctx) {
  const cal = calendar(st.virtual);
  const list = st.dried.filter(p => ids.includes(p.id));
  if (list.length < 2 || list.length > 3) return no('말린 꽃잎 2~3장을 골라 주세요');
  const parts = list.map(p => p.type);
  if (new Set(parts).size !== parts.length) return no('서로 다른 꽃의 꽃잎을 골라 주세요');
  for (const p of list) st.dried.splice(st.dried.indexOf(p), 1);
  const q = list.reduce((a, p) => a + p.q, 0) / list.length, recipe = blendRecipe(parts, st);
  const name = recipe ? BLENDS[recipe].name : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`;
  seeYear(st, 'blend', recipe || parts.slice().sort().join('+'));
  const b = { id: nid(st), parts, q, recipe, name, hat: list.every(p => isHat(p.q)) };   // 10-24: ★5 꽃잎만 섞으면 블렌드도 🍃 햇차 (값은 블렌드 배율 그대로, 햇차 잔 수 · 칭호에 셈)
  st.blends.push(b);
  if (recipe) {
    if (!st.dex.blend[recipe]) addLog(st, 9, `도감에 등록: ${name}`, ctx);
    st.dex.blend[recipe] = Math.max(st.dex.blend[recipe] || 0, q);
  }
  return ok(`${josa(name, '을/를')} 만들었어요`, { blend: b });
}
// 예전 규칙(P17-01: 우리지 않고 바로 팔기)의 판매 함수 — 화면은 찻잔(sellCups)만 씀. 예전 테스트 · 도구를 위해 남겨 둠
function sellBlends(st, ids) {
  if (!teaShopOpen(calendar(st.virtual))) return no('찻집은 겨울(12월)부터 열어요');
  const list = st.blends.filter(b => ids.includes(b.id));
  if (!list.length) return no('팔 블렌드 차가 없어요');
  let sum = 0;
  for (const b of list) { sum += blendValue(b); st.blends.splice(st.blends.indexOf(b), 1); }
  st.money += sum;
  return ok(`블렌드 차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
// P17-10 우림 → 찻잔 → 판매: 찻집이 열렸을 때(토·일) 티백 · 생차 · 블렌드를 우려 찻잔으로. 판매는 찻잔에서만
// 찻잔은 우린 달이 지나면 식어서 값이 반 (COLD_RATE)
const COLD_RATE = 0.5;
const cupCold = (c, cal) => cal.abs > c.brewAbs;
// P12-11 블렌드 티백: 제다실의 블렌드를 티백으로 만들어 찻집으로 (블렌드 티백 도감)
function bagBlends(st, ids, ctx) {
  const list = st.blends.filter(b => ids.includes(b.id) && !b.bagged);
  if (!list.length) return no('티백으로 만들 블렌드가 없어요');
  st.dex.bagBlend = st.dex.bagBlend || {};
  for (const b of list) {
    b.bagged = true;
    if (b.recipe && !st.dex.bagBlend[b.recipe]) { st.dex.bagBlend[b.recipe] = true; addLog(st, 9, `도감에 등록: ${b.name} 티백`, ctx); }
  }
  return ok(`블렌드 티백 ${list.length}개를 만들어 찻집으로 보냈어요`);
}
function brew(st, teaIds, blendIds) {
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집이 열리는 겨울(12월)부터 우릴 수 있어요');
  st.cups = st.cups || [];
  const teas = st.teas.filter(t => teaIds.includes(t.id)), blends = st.blends.filter(b => (blendIds || []).includes(b.id) && b.bagged);   // 블렌드는 티백이 된 것만
  if (!teas.length && !blends.length) return no('우릴 티백이 없어요');
  for (const t of teas) { st.teas.splice(st.teas.indexOf(t), 1); st.cups.push({ ...t, id: nid(st), kind: 'tea', brewAbs: cal.abs }); }
  for (const b of blends) { st.blends.splice(st.blends.indexOf(b), 1); st.cups.push({ ...b, id: nid(st), kind: 'blend', brewAbs: cal.abs }); }
  return ok(`차 ${teas.length + blends.length}잔을 우렸어요 ☕`);
}
function cupValue(st, c, cal) {
  const v = c.kind === 'blend' ? blendValue(c) : teaItemValue(st, c, cal);
  return cupCold(c, cal) ? Math.round(v * COLD_RATE / 10) * 10 : v;
}
// P17-11 자동 판매: 찻집이 열려 있으면 카운터의 찻잔이 1시간(게임 시간 = 배속 1에서 현실 1시간)마다 한 잔씩, 먼저 우린 것부터 팔림
const CUP_SELL_H = 1;
// P17-15 찻집 가꾸기 (10-06 백업 → 10-24 되살림): 돈 쓸 곳. 손님 자리는 자동 판매를 빠르게(값은 그대로), 찻잔 세트 · 간판은 보기만 바뀜
const SEATS = [null, { price: 0 }, { price: 30000 }, { price: 80000 }];        // 자리 1(처음) · 2 · 3
const CUP_SETS = {
  baekja: { name: '백자', price: 0, desc: '희고 맑은 기본 찻잔', pal: { c: '#8a7f72', w: '#fbf8f2', s: '#c9c4b8', D: '#e7e1d6', d: '#b9b0a2' } },
  cheongja: { name: '청자', price: 8000, desc: '비취빛이 은은한 찻잔', pal: { c: '#5f7d6e', w: '#bcd6c4', s: '#8fb3a0', D: '#a8c8b5', d: '#7fa08e' } },
  buncheong: { name: '분청', price: 12000, desc: '흙빛에 흰 분을 바른 찻잔', pal: { c: '#6e6253', w: '#ddd3c3', s: '#a99a86', D: '#cbbfac', d: '#998b78' } },
  kkot: { name: '꽃무늬', price: 20000, desc: '분홍 꽃이 그려진 찻잔', pal: { c: '#8a7f72', w: '#fdf6f6', s: '#e3a3b3', D: '#f3d9df', d: '#d495a5' } },
};
const SIGNS = {
  wood: { name: '나무 팻말', price: 0, desc: '처음 걸어 둔 팻말' },
  flower: { name: '꽃 장식', price: 6000, desc: '팻말에 작은 꽃을 둘러요' },
  lantern: { name: '등불', price: 10000, desc: '따뜻한 등불을 달아요' },
};
const newShop = () => ({ seats: 1, cups: ['baekja'], cup: 'baekja', signs: ['wood'], sign: 'wood' });
const shopOf = st => (st.shop = st.shop || newShop());
const cupSellH = st => CUP_SELL_H / shopOf(st).seats;                          // 손님 자리만큼 빨리 팔림
function addSeat(st) {
  const sh = shopOf(st), next = SEATS[sh.seats + 1];
  if (!next) return no('손님 자리를 다 늘렸어요');
  if (st.money < next.price) return no('돈이 모자라요');
  st.money -= next.price; sh.seats++;
  return ok(`손님 자리가 ${sh.seats}자리가 되었어요 · 이제 한 시간에 ${sh.seats}잔씩 팔려요`);
}
function buyDecor(st, kind, key) {                // kind: 'cup' | 'sign' — 가진 것은 고르기만, 없으면 사서 바로 씀
  if (kind !== 'cup' && kind !== 'sign') return no('없는 물건이에요');
  const sh = shopOf(st), list = kind === 'cup' ? CUP_SETS : SIGNS, own = kind === 'cup' ? sh.cups : sh.signs, it = list[key];
  if (!it || !Object.prototype.hasOwnProperty.call(list, key)) return no('없는 물건이에요');
  const bought = !own.includes(key);
  if (bought) {
    if (st.money < it.price) return no('돈이 모자라요');
    st.money -= it.price; own.push(key);
  }
  sh[kind] = key;
  const nm = kind === 'cup' ? `${it.name} 찻잔` : it.name;
  return ok(bought ? `${josa(nm, '을/를')} 사서 바꿨어요` : `${josa(nm, '으로/로')} 바꿨어요`);
}
function autoSell(st, cal, dtH, ctx) {
  st.cups = st.cups || [];
  if (!teaShopOpen(cal) || !st.cups.length) { st.cupTimerH = 0; return; }
  st.cupTimerH = (st.cupTimerH || 0) + dtH;
  const every = cupSellH(st);
  while (st.cupTimerH >= every && st.cups.length) {
    st.cupTimerH -= every;
    const c = st.cups.shift(), v = cupValue(st, c, cal);
    st.money += v;
    countCup(st, c, cal, true);
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
    st._autoSold = st._autoSold || { n: 0, sum: 0 }; st._autoSold.n++; st._autoSold.sum += v;
  }
  if (!st.cups.length) st.cupTimerH = 0;
}
function sellCups(st, ids, ctx) {
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집은 겨울(12월)부터 열어요');
  const list = (st.cups || []).filter(c => ids.includes(c.id));
  if (!list.length) return no('팔 찻잔이 없어요');
  let sum = 0;
  for (const c of list) {
    sum += cupValue(st, c, cal); st.cups.splice(st.cups.indexOf(c), 1);
    countCup(st, c, cal, false);
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);   // 차는 처음 팔 때 도감에
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
  }
  st.money += sum;
  return ok(`찻잔 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
function sellTea(st, ids, ctx) {                 // P17-01: 찻집에서 티백을 우려 한 잔씩 팔아요
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집은 겨울(12월)부터 열어요');
  const list = st.teas.filter(t => ids.includes(t.id));
  if (!list.length) return no('팔 차가 없어요');
  let sum = 0;
  for (const t of list) {
    sum += teaItemValue(st, t, cal); st.teas.splice(st.teas.indexOf(t), 1);
    if (st.dex.tea[t.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[t.type].tea}`, ctx);   // P08-01-05-a (변경 10-06: 처음 팔 때)
    st.dex.tea[t.type] = Math.max(st.dex.tea[t.type] || 0, t.q);                                     // P08-01-06 가장 좋은 품질
  }
  st.money += sum;
  return ok(`차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}

// ---------------------------------------------------------------- 도감일지: 퀘스트 → 칭호 (P19, 10-17)
const bump = (st, k, n) => { st.stats = st.stats || {}; st.stats[k] = (st.stats[k] || 0) + (n || 1); };
// 찻잔이 팔릴 때마다: 전체 · 손님(자동) · 갓 우린 · 햇차 · 블렌드 잔 수 (P19-07-01: 판매 잔 수 · 햇차 수만 새로 셈)
function countCup(st, c, cal, auto) {
  fillOrder(st, c);                               // P23-01 손님 주문
  bump(st, 'cups'); if (auto) bump(st, 'autoCups');
  if (!cupCold(c, cal)) bump(st, 'warmCups');
  if (c.hat) bump(st, 'hatCups');
  if (c.kind === 'blend') bump(st, 'blendCups');
}
const n0 = o => Object.keys(o || {}).length;
const S = (st, k) => (st.stats || {})[k] || 0;
// 퀘스트: 키 · 이름 · 판정 · 할 곳(탭) · 언제 할 수 있는지 힌트 ({ sow: 꽃 } 화원에 들어오는 달 · { bloom: 꽃 } 피는 달 · 'cafe' 찻집 여는 달)
const Q = (key, name, test, go, when) => ({ key, name, test, go, when: when || null });
// P22-01 (10-24): 1장은 "첫 꽃" — 첫 방문에 받은 이웃의 화분(P22-02). 예전 정원 · 화분을 받기 전엔 캐모마일
const firstFlower = st => st && st.firstFlower && FLOWERS[st.firstFlower] ? st.firstFlower : 'chamomile';
const firstLand = st => { const F = FLOWERS[firstFlower(st)]; return classify(F.t, F.m); };
// 화분으로 받은 꽃과 같은 6장 나무 퀘스트는 "직접 심은 ○○" (QA 4회차)
const giftedSame = (st, k) => st && st.gift != null && st.gift >= 0 && st.firstFlower === k;
const ownName = (st, k) => `${giftedSame(st, k) ? '직접 심은 ' : ''}${FLOWERS[k].name} 피우기`;
const ownTest = (st, k) => giftedSame(st, k) ? !!(st.ownBloom || {})[k] : !!st.dex.flower[k];
const questName = (q, st) => typeof q.name === 'function' ? q.name(st) : q.name;
const questWhenOf = (q, st) => typeof q.when === 'function' ? q.when(st) : q.when;
const CHAPTERS = [
  { key: 'c0', no: 0, name: '첫 방문', title: 't_visit', quests: [   // 첫 안내 창에서 '시작'을 누르면 바로 (10-17)
    Q('c0_visit', '도리의 정원에 처음 오기', st => !!st.onboarded, 'garden'),
  ] },
  { key: 'c1', no: 1, name: '첫 꽃밭', title: 't_first', quests: [
    Q('c1_bloom', st => `${FLOWERS[firstFlower(st)].name} 피우기`, st => !!st.dex.flower[firstFlower(st)], 'garden', st => ({ bloom: firstFlower(st) })),
    Q('c1_petal', st => `${FLOWERS[firstFlower(st)].name} 꽃잎 거두기`, st => !!(st.dex.petal || {})[firstFlower(st)], 'garden', st => ({ bloom: firstFlower(st) })),
    Q('c1_dry', '꽃방에 꽃잎 널기', st => S(st, 'dried') > 0, 'tearoom', { need: 'dry' }),
    Q('c1_bag', st => `${FLOWERS[firstFlower(st)].name} 티백 만들기`, st => !!(st.dex.teabag || {})[firstFlower(st)], 'tearoom', st => ({ need: 'petal', flower: firstFlower(st) })),
    Q('c1_land', st => st.gift != null && st.gift >= 0 ? '첫 땅 만들기' : '초원 만들기', st => st.gift != null && st.gift >= 0 ? LAND_KEYS.some(k => k !== 'barren' && st.dex.land[k]) : !!st.dex.land.grassland, 'garden', { need: 'land' }),   // 화분을 받은 정원은 어떤 땅이든 (QA 4회차)
    Q('c1_sell', st => `${FLOWERS[firstFlower(st)].tea} 팔기`, st => st.dex.tea[firstFlower(st)] != null, 'cab', st => ({ need: 'sell', flower: firstFlower(st) })),   // 그 꽃 차가 있어야 지금 (QA 16 · 19회차)
  ] },
  { key: 'c2', no: 2, name: '땅 바꾸기', title: 't_land', quests: [
    Q('c2_foothill', '산기슭 만들기', st => !!st.dex.land.foothill, 'shop', { sow: 'gamguk' }),
    Q('c2_med', '지중해 언덕 만들기', st => !!st.dex.land.med, 'shop', { sow: 'lavender' }),
    Q('c2_sub', '아열대 정원 만들기', st => !!st.dex.land.subtropic, 'shop', { sow: 'jasmine' }),
    Q('c2_trop', '열대 만들기', st => !!st.dex.land.tropical, 'shop', { sow: 'hibiscus' }),
    Q('c2_edge', '경계 땅 하나 찾기', st => ['mossy', 'wetland', 'dryfield'].some(k => st.dex.land[k]), 'garden'),
  ] },
  { key: 'c3', no: 3, name: '물가의 여름', title: 't_water', quests: [
    Q('c3_root', '연꽃 연근 들이기', st => !!(st.dex.form || {}).lotus, 'shop', { sow: 'lotus' }),
    Q('c3_bloom', '연꽃 피우기', st => !!st.dex.flower.lotus, 'garden', { bloom: 'lotus' }),
    Q('c3_pond', '연못 만들기', st => !!st.dex.land.pond, 'garden'),
    Q('c3_wet', '습지 만들기', st => !!st.dex.land.wetland, 'garden'),
    Q('c3_sell', '연꽃차 팔기', st => st.dex.tea.lotus != null, 'cab', 'cafe'),
  ] },
  { key: 'c4', no: 4, name: '블렌드 연구', title: 't_blend', quests: [
    Q('c4_spring', '봄 들판 만들기', st => st.dex.blend.springfield != null, 'tearoom'),
    Q('c4_sleep', '잠드는 밤 만들기', st => st.dex.blend.sleepnight != null, 'tearoom'),
    Q('c4_violet', '보랏빛 저녁 만들기', st => st.dex.blend.violetdusk != null, 'tearoom'),
    Q('c4_five', '이름 있는 블렌드 5가지', st => n0(st.dex.blend) >= 5, 'tearoom'),
    Q('c4_bag', '블렌드 티백 만들기', st => n0(st.dex.bagBlend) > 0, 'tearoom'),
  ] },
  { key: 'c5', no: 5, name: '겨울 찻집', title: 't_cafe', quests: [
    Q('c5_guest', '손님이 사 간 첫 찻잔', st => S(st, 'autoCups') > 0, 'cab', 'cafe'),
    Q('c5_warm', '갓 우린 차 팔기', st => S(st, 'warmCups') > 0, 'cab', 'cafe'),
    Q('c5_hat', '햇차 팔기', st => S(st, 'hatCups') > 0, 'cab', 'cafe'),
    Q('c5_blend', '블렌드 차 팔기', st => S(st, 'blendCups') > 0, 'cab', 'cafe'),
    Q('c5_five', '차 도감 5칸', st => n0(st.dex.tea) >= 5, 'cab', 'cafe'),
  ] },
  { key: 'c6', no: 6, name: '나무의 해', title: 't_tree', quests: [
    Q('c6_dongbaek', st => ownName(st, 'dongbaek'), st => ownTest(st, 'dongbaek'), 'garden', { bloom: 'dongbaek' }),
    Q('c6_maehwa', st => ownName(st, 'maehwa'), st => ownTest(st, 'maehwa'), 'garden', { bloom: 'maehwa' }),
    Q('c6_napmae', st => ownName(st, 'napmae'), st => ownTest(st, 'napmae'), 'garden', { bloom: 'napmae' }),
    Q('c6_plum', '겨울 매화향 만들기', st => st.dex.blend.plumwinter != null, 'tearoom'),
  ] },
];
const QUESTS = CHAPTERS.flatMap(c => c.quests.map(q => Object.assign(q, { chapter: c.key })));
// 칭호: 등급 s 새싹 · f 꽃 · g 정원 (P19-05-03). 장 칭호는 그 장을 마치면, 숨은 칭호는 test로
const TITLES = {
  t_visit: { name: '정원 문을 연 사람', tier: 's', chapter: 'c0' },
  t_first: { name: '새싹 정원사', tier: 's', chapter: 'c1' },
  t_land: { name: '땅을 읽는 사람', tier: 'f', chapter: 'c2' },
  t_water: { name: '물가의 정원사', tier: 'f', chapter: 'c3' },
  t_blend: { name: '블렌드 연구가', tier: 'f', chapter: 'c4' },
  t_cafe: { name: '겨울 찻집 주인', tier: 'f', chapter: 'c5' },
  t_tree: { name: '나무를 기다린 사람', tier: 'g', chapter: 'c6' },
  t_sleep: { name: '꽃잠에 온 손님', tier: 's', cond: '꽃잠(일요일)에 처음 시작', hint: '모두 잠든 정원에 처음 온 사람', test: st => !!st.startedInSleep },
  t_record: { name: '한 해의 기록자', tier: 's', cond: '한 해 정원을 기록 (쉼달)', hint: '한 해를 끝까지 지켜본 사람', test: st => st.records.length > 0 },
  t_hat: { name: '햇차 장인', tier: 'f', cond: '햇차 5잔 팔기', hint: '가장 좋은 잎만 골라 우린 사람', test: st => S(st, 'hatCups') >= 5 },
  t_regular: { name: '찻집의 단골', tier: 'f', cond: '찻잔 100잔 팔기', hint: '손님이 이름을 기억하는 가게', test: st => S(st, 'cups') >= 100 },
  t_lands: { name: '열 가지 땅', tier: 'g', cond: '땅 도감 10칸', hint: '정원의 모든 흙을 밟아 본 사람', test: st => LAND_KEYS.every(k => st.dex.land[k]) },
  t_miracle: { name: '한 포기의 기적', tier: 'g', cond: '품질 80% 이하로 심은 꽃을 100%로 피우기', hint: '지친 꽃을 다시 흠 없이', test: st => st.flowers.some(f => !f.withered && f.stage === 'bloom' && pct(f.q) >= 100 && f.startQ != null && f.startQ <= 0.8) },   // 10-24: 화원 꽃은 100%로 와서 너무 쉬웠음 (QA 1회차)
  t_spring4: { name: '네 번째 봄', tier: 'g', cond: '4년차 3월을 맞기', hint: '봄을 네 번 맞은 정원', test: st => yearOf(st, calendar(st.virtual)) >= 4 },
  t_complete: { name: '도감을 채운 정원사', tier: 'g', cond: '도감 모든 칸', hint: '빈칸이 하나도 없는 책', test: st => dexCount(st) >= dexTotal(st) },
  // P23-03 오래 하는 정원사를 위한 어려운 숨은 칭호 (10-24)
  t_guests: { name: '손님의 편지', tier: 'g', cond: '손님 주문 30번 들어주기', hint: '쪽지를 서른 번 읽은 찻집', test: st => S(st, 'orders') >= 30 },
  t_honey: { name: '꿀 열네 병', tier: 'g', cond: '꿀 도감 14칸', hint: '꽃마다 다른 단맛', test: st => honeyCount(st) >= HONEY_KEYS.length },
  t_deep: { name: '깊은 굴의 광부', tier: 'g', cond: '광산 지하 20층까지', hint: '빛이 닿지 않는 곳까지', test: st => !!st.mine && st.mine.deepest >= MINE_DEEPEST },
  t_score: { name: '빛나는 한 해', tier: 'g', cond: '한 해 정원 점수 250점', hint: '스스로를 넘어선 해', test: st => (st.bestScore || 0) >= 250 },
  // P20-16 덤 칭호 (10-27): 구글 로그인 · 드라이브 저장 보상. 로그인할 수 없는 곳(앱 안 브라우저 등)도 있어서 칭호 수 · 꾸밈 도감 칸에는 넣지 않고 따로 셈
  t_cloud: { name: '구름 정원사', tier: 'f', extra: true, cond: '구글 드라이브에 정원을 맡기기', hint: '정원을 구름 위에도 둔 사람' },
};
const TITLE_KEYS = Object.keys(TITLES).filter(k => !TITLES[k].extra);       // 모으는 칭호 19개 (덤 칭호는 EXTRA_TITLE_KEYS)
const EXTRA_TITLE_KEYS = Object.keys(TITLES).filter(k => TITLES[k].extra);
const chapterQuests = key => CHAPTERS.find(c => c.key === key).quests;
const chapterDone = (st, key) => chapterQuests(key).every(q => st.journal.done[q.key] != null);
// P19-03 장이 열리는 순서: 0장은 처음부터, 1장은 첫걸음을 마치면(1장 퀘스트를 이미 했거나 2년차여도), 2~5장은 1장을 마치면, 6장은 2년차 3월부터
function chapterOpen(st, key) {
  const yr = yearOf(st, calendar(st.virtual));
  if (key === 'c0') return true;                                       // 0장 첫 방문은 처음부터
  if (key === 'c1') return !!(st.guide && (st.guide.celebrated || st.guide.hidden)) ||   // 첫걸음을 닫아도 1장 (QA 8회차)
    yr >= 2 || chapterQuests('c1').some(q => q.test(st));
  if (key === 'c6') return yr >= 2;
  return chapterDone(st, 'c1');
}
function giveTitle(st, k, cal, ctx, silent) {
  if (st.titles[k] != null) return false;
  st.titles[k] = cal.abs;
  if (!(st.dex.deco && st.dex.deco['t:' + k])) addDeco(st, 't:' + k);   // P17-16-06 칭호 문장 장식
  if (!silent) {
    addLog(st, 9, `🏅 새 칭호: ${TITLES[k].name}`, ctx);
    (st._newTitles = st._newTitles || []).push(k);                       // 화면이 얻는 연출을 띄움 (P19-05-06)
    const hb = ALL_BLEND_KEYS.find(b => BLENDS[b].hidden === k);
    if (hb) addLog(st, 9, `📖 숨은 레시피가 열렸어요: ${BLENDS[hb].name}`, ctx);
  }
  return true;
}
// 지금 상태로 퀘스트 · 칭호를 판정. 예전 저장(도감일지 전)은 처음 한 번 조용히 소급하고 한 줄만 남김 (P19-07-03)
function checkJournal(st, ctx) {
  const migrate = !st.journal;
  if (migrate) st.journal = { done: {} };
  st.titles = st.titles || {}; st.stats = st.stats || {}; if (st.titleOn === undefined) st.titleOn = null;
  const cal = calendar(st.virtual);
  let nq = 0, nt = 0;
  for (let pass = 0; pass < 2; pass++) {                                // 칭호로 열리는 것이 있어 두 번
    for (const c of CHAPTERS) {
      if (!chapterOpen(st, c.key)) continue;
      for (const q of c.quests) {
        if (st.journal.done[q.key] != null || !q.test(st)) continue;
        st.journal.done[q.key] = cal.abs; nq++;
        if (!migrate) addLog(st, 9, `📜 퀘스트: ${questName(q, st)} 완료`, ctx);
      }
      if (chapterDone(st, c.key) && giveTitle(st, c.title, cal, ctx, migrate)) nt++;
    }
    for (const k of TITLE_KEYS) if (TITLES[k].test && TITLES[k].test(st) && giveTitle(st, k, cal, ctx, migrate)) nt++;
  }
  if (migrate && (nq || nt)) addLog(st, 11, `📔 도감일지에 지난 기록 ${nq}개 · 칭호 ${nt}개를 옮겨 적었어요`, ctx);
}
function setTitleOn(st, k) {
  if (k != null && st.titles[k] == null) return no('아직 얻지 못한 칭호예요');
  st.titleOn = k;
  return ok(k ? `대표 칭호를 「${TITLES[k].name}」(으)로 걸었어요` : '대표 칭호를 내렸어요');
}

// ---------------------------------------------------------------- 💌 손님 주문 · 기념품 (P23-01, 10-24)
// 찻집이 열린 달마다 주문 쪽지 3장. 맞는 찻잔이 팔리면(손으로든 저절로든) 손님이 기념품을 두고 감. 돈 보상 없음, 놓쳐도 벌 없음
const MEMENTOS = {
  hanky: { name: '꽃수 손수건', ic: '🧣' }, button: { name: '나무 단추', ic: '🔘' }, postcard: { name: '바다 엽서', ic: '🖼️' }, shell: { name: '분홍 조개껍데기', ic: '🐚' },
  feather: { name: '파랑새 깃털', ic: '🪶' }, acorn: { name: '반들 도토리', ic: '🌰' }, ribbon: { name: '노란 리본', ic: '🎀' }, stamp: { name: '옛 우표', ic: '📮' },
  bookmark: { name: '꽃잎 책갈피', ic: '🔖' }, marble: { name: '유리구슬', ic: '🔮' }, bell: { name: '작은 종', ic: '🔔' }, candy: { name: '별사탕', ic: '⭐' },
};
const MEMENTO_KEYS = Object.keys(MEMENTOS);
const mementoCount = st => Object.keys((st.dex && st.dex.memento) || {}).filter(k => MEMENTOS[k]).length;
const orderText = o => o.kind === 'tea' ? `★${o.stars} 이상 ${FLOWERS[o.type].tea}` : o.kind === 'recipe' ? '레시피 블렌드 아무거나' : o.kind === 'honey' ? '꿀 넣은 차 아무거나' : o.kind === 'any' ? '차 아무거나 한 잔' : '🍃 햇차 아무거나';
function orderMatch(o, c) {
  if (o.done) return false;
  if (o.kind === 'tea') return c.kind === 'tea' && c.type === o.type && stars(c.q) >= o.stars;
  if (o.kind === 'recipe') return c.kind === 'blend' && !!c.recipe;
  if (o.kind === 'honey') return !!c.honey;
  if (o.kind === 'any') return true;              // 아무 차 한 잔 (QA 6회차: 처음 온 사람도 들어줄 수 있게)
  return !!c.hat;
}
function makeOrders(st, cal) {
  const rnd = mineRng(hashStr(`${st.gardenId || 'g'}|order|${cal.abs}`));
  // 차 주문은 만든 적 있는 티백 꽃 중에서 (없으면 이웃의 화분 꽃)
  const known = FLOWER_KEYS.filter(k => (st.dex.teabag || {})[k] || st.teas.some(x => x.type === k));
  const pool = known.length ? known : [firstFlower(st)];
  // 처음엔 들어줄 수 있는 것만 (QA 6회차): 레시피는 블렌드를 만든 적이 있으면, 햇차는 ★5를 본 적이 있으면, 꿀은 거둔 적이 있으면
  const kinds = ['tea', 'any'];
  if (Object.keys(st.dex.blend || {}).length) kinds.push('recipe');
  if (S(st, 'hatCups') > 0 || st.teas.some(x => x.hat) || st.dried.some(p => isHat(p.q)) || st.petals.some(p => isHat(p.q))) kinds.push('hat');
  if (Object.keys(st.dex.honey || {}).length) kinds.push('honey');
  const out = [], key = o => o.kind === 'tea' ? `tea|${o.type}` : o.kind;   // 같은 꽃 차 · 같은 종류는 한 장만 (QA 5회차)
  for (let i = 0, tries = 0; out.length < 3 && tries < 40; tries++) {
    const kind = i === 0 ? 'tea' : kinds[Math.floor(rnd() * kinds.length)];
    const o = kind === 'tea' ? { kind, type: pool[Math.floor(rnd() * pool.length)], stars: 3 + Math.floor(rnd() * 2), done: false } : { kind, done: false };
    if (out.some(x => key(x) === key(o))) continue;
    out.push(o); i++;
  }
  st.orders = { abs: cal.abs, list: out };
}
function fillOrder(st, c) {
  const os = st.orders && st.orders.list; if (!os) return null;
  const hard = x => x.kind === 'tea' ? 10 + x.stars : x.kind === 'honey' ? 5 : x.kind === 'recipe' ? 4 : x.kind === 'hat' ? 3 : 1;   // 까다로운 쪽지부터 (QA 5회차)
  const o = os.filter(x => orderMatch(x, c)).sort((a, b) => hard(b) - hard(a))[0]; if (!o) return null;
  o.done = true; bump(st, 'orders');
  st.dex.memento = st.dex.memento || {};
  const left = MEMENTO_KEYS.filter(k => !st.dex.memento[k]);
  let gift = null;
  if (left.length) { const rnd = mineRng(hashStr(`${st.gardenId || 'g'}|memento|${S(st, 'orders')}`)); gift = left[Math.floor(rnd() * left.length)]; st.dex.memento[gift] = true; }
  else addFert(st, 1);                            // 기념품을 다 모은 뒤엔 손님이 비료 한 줌 (QA 6회차)
  addLog(st, 15, gift ? `${orderText(o)} 주문을 받은 손님이 ${josa(MEMENTOS[gift].name, '을/를')} 두고 갔어요` : `${orderText(o)} 주문을 받은 손님이 고맙다며 비료 한 줌을 두고 갔어요`);
  return { order: o, gift };
}

// ---------------------------------------------------------------- 💐 이웃에게 선물 · ✉️ 답장 편지 (P26, 10-24)
// 오래 하면 남는 돈을 해마다 되풀이해 쓰는 곳. 종류마다 한 해에 한 번, 다음 달에 답장 편지(12통 도감) + 답례품 하나 (P26-06, 10-27)
const GIFTS = {
  bouquet: { name: '꽃다발', ic: '💐', price: 8000, desc: '이웃집 식탁에 놓을 꽃다발' },
  teabox: { name: '차 한 상자', ic: '🍵', price: 15000, desc: '고운 차 상자를 사서 보내요' },
  party: { name: '정원 잔치', ic: '🎉', price: 40000, desc: '이웃을 불러 차와 과자를 나눠요' },
};
const GIFT_KEYS = Object.keys(GIFTS);
const LETTERS = {
  florist: { from: '꽃집 할머니', likes: 'seed', gift: 'bouquet', text: '꽃다발 고마워요. 식탁에 두니 아침이 환해졌어요. 다음 봄에도 좋은 씨앗을 골라 둘게요.' },
  postman: { from: '우체부 아저씨', likes: 'supply', text: '배달 길에 정원을 지나는 게 하루의 즐거움이에요. 덕분에 저도 화분 하나를 들였어요.' },
  kid: { from: '옆집 꼬마', likes: 'mine', gift: null, text: '선물 고마워요! 저도 커서 정원사가 될래요. 꽃 그림을 그려서 넣었어요.' },
  regular: { from: '찻집 단골 할아버지', likes: 'honey', gift: 'teabox', text: '보내 준 차를 우려 아내와 마셨어요. 오래전 함께 걷던 꽃길 이야기를 나눴어요.' },
  librarian: { from: '도서관 사서', likes: 'seed', text: '책 사이에 꽃잎을 끼워 두었어요. 펼칠 때마다 정원 냄새가 날 거예요.' },
  beekeeper: { from: '양봉가 이웃', likes: 'honey', text: '벌들이 요즘 정원 쪽으로 자주 가요. 좋은 꽃이 많다는 뜻이겠지요.' },
  baker: { from: '빵집 사장님', likes: 'honey', gift: 'teabox', text: '나눠 준 차에 맞춰 꽃잎 쿠키를 구워 봤어요. 다음엔 제가 들고 갈게요.' },
  bori: { from: '강아지 보리네', likes: 'mine', text: '보리가 정원 앞에서 늘 멈춰요. 꽃 냄새 맡는 게 제일 좋은가 봐요.' },
  newcomer: { from: '이사 온 새 이웃', likes: 'deco', gift: 'bouquet', text: '처음 받은 선물이 꽃이라 이 동네가 금방 좋아졌어요. 고마워요.' },
  teacher: { from: '학교 선생님', likes: 'seed', text: '아이들과 정원 이야기를 나눴어요. 꽃이 땅을 바꾼다는 말에 다들 눈이 반짝였어요.' },
  photo: { from: '사진관 주인', likes: 'deco', gift: 'party', text: '잔치 때 찍은 사진을 한 장 넣었어요. 모두 웃고 있네요.' },
  faraway: { from: '바다 건너 친구', likes: 'seed', gift: null, text: '멀리서도 정원 소식이 반가워요. 저도 창가에 작은 화분을 하나 두었어요.' },
};
const LETTER_KEYS = Object.keys(LETTERS);
const letterCount = st => Object.keys((st.dex && st.dex.letter) || {}).filter(k => LETTERS[k]).length;
const giftsOf = st => { const y = yearOf(st, calendar(st.virtual)); if (!st.gifts || st.gifts.year !== y) st.gifts = { year: y, sent: {} }; return st.gifts; };
function sendGift(st, k, ctx) {
  const G = Object.prototype.hasOwnProperty.call(GIFTS, k) ? GIFTS[k] : null;
  if (!G) return no('없는 선물이에요');
  const g = giftsOf(st);
  if (g.sent[k]) return no(`${josa(G.name, '은/는')} 올해 이미 보냈어요 · 내년에 다시`);
  if (!(st.money >= G.price)) return no('돈이 모자라요');
  st.money -= G.price; g.sent[k] = true;
  bump(st, 'gifts');
  (st.letterPending = st.letterPending || []).push({ gift: k, due: calendar(st.virtual).abs + 1 });
  addLog(st, 17, `이웃에게 ${josa(G.name, '을/를')} 보냈어요 · 다음 달에 답장이 와요`, ctx);
  return ok(`이웃에게 ${josa(G.name, '을/를')} 보냈어요 · 다음 달에 답장이 와요`);
}
// 이 선물을 보내면 새 편지가 올지 (보낸 선물에 맞는 편지나 공통 편지가 남았는지) — 화면 안내용 (QA 11회차)
const letterLeftFor = (st, k) => LETTER_KEYS.some(x => !(st.dex.letter || {})[x] && (!LETTERS[x].gift || LETTERS[x].gift === k));
// 🎁 답례품 (P26-06, 10-27 사용자 요청): 답장마다 하나. 선물값이 클수록 좋은 칸에서 뽑고, 기대 가치는 선물값의 25% 아래 (P26-07)
// 돈이 다시 돈을 벌면 안 됨(P17-14): 팔 수 있는 것(차 · 꽃잎)과 수입을 늘리는 장식(벌통 · 빗물 통 · 장치)은 넣지 않음
// cat: seed(창고) · supply(창고 용품) · honey(찻집 꿀 선반) · mine(광산 주머니) · deco(창고 장식, 한 번 가진 것은 같은 등급의 다른 것으로)
const ANNUALS = ['chamomile', 'bpea', 'hibiscus', 'marigold', 'celosia'];
const RETURNS = {
  bouquet: [   // 💐 작은 것
    { cat: 'seed', keys: ANNUALS, n: 3, w: 20 },
    { cat: 'supply', keys: ['fert'], n: 10, w: 15 },
    { cat: 'supply', keys: ['water'], n: 20, w: 15 },
    { cat: 'honey', n: 2, w: 10 },
    { cat: 'mine', keys: ['stone'], n: 5, w: 10 },
    { cat: 'mine', keys: ['dirt'], n: 10, w: 10 },
    { cat: 'mine', keys: ['shell'], n: 1, w: 5 },
    { cat: 'deco', keys: ['stepstone', 'fence'], n: 1, w: 15 },
  ],
  teabox: [    // 🍵 보통
    { cat: 'seed', keys: ['lavender', 'gamguk', 'dongbaek', 'lotus'], n: 1, w: 18 },
    { cat: 'seed', keys: ANNUALS, n: 6, w: 10 },
    { cat: 'supply', keys: ['fert'], n: 20, w: 12 },
    { cat: 'supply', keys: ['basket', 'hoe', 'shears'], n: 2, w: 10 },
    { cat: 'honey', n: 4, w: 12 },
    { cat: 'mine', keys: ['stone'], n: 10, w: 8 },
    { cat: 'mine', keys: ['quartz'], n: 1, w: 6 },
    { cat: 'mine', keys: ['shell', 'fern', 'leaf', 'bone'], n: 1, w: 6 },
    { cat: 'deco', keys: ['pumpkin', 'snowman', 'chime', 'moonlamp'], n: 1, w: 18 },
  ],
  party: [     // 🎉 좋은 것 · 가끔 귀한 장식
    { cat: 'seed', keys: ['rose', 'jasmine', 'maehwa', 'napmae'], n: 1, w: 16 },
    { cat: 'supply', keys: ['fert'], n: 40, w: 12 },
    { cat: 'honey', n: 3, w: 12 },
    { cat: 'mine', keys: ['amber'], n: 3, w: 8 },
    { cat: 'mine', keys: ['oldseed'], n: 1, w: 8 },
    { cat: 'mine', keys: ['shell', 'fern', 'leaf', 'bone'], n: 2, w: 8 },
    { cat: 'deco', keys: ['birdhouse', 'basin', 'bench', 'stonelamp'], n: 1, w: 30 },
    { cat: 'deco', keys: ['jars', 'bonsai'], n: 1, w: 7 },
  ],
};
// 가치(원): 씨앗 · 용품 · 장식은 화원 값. 꿀 · 광산 재료는 팔지 않아 참고값 — 만들 수 있는 것의 값으로 어림 (돌 20 → 돌 물확 9,000 · 석영 → 꽃무늬 찻잔 등)
const RETURN_V = { honey: 300, stone: 450, dirt: 30, quartz: 1500, amber: 1000, oldseed: 2000, fossil: 1000 };
const returnBias = 2;                             // 답장한 이웃이 좋아하는 쪽(likes) 칸은 2배로 잘 나옴
function returnValue(re) {
  if (!re) return 0;
  const one = re.cat === 'seed' ? FLOWERS[re.key].price : re.cat === 'supply' ? SUPPLIES[re.key].price : re.cat === 'deco' ? DECOS[re.key].price
    : re.cat === 'honey' ? RETURN_V.honey : FOSSILS[re.key] ? RETURN_V.fossil : RETURN_V[re.key];
  return one * re.n;
}
const returnName = re => re.cat === 'seed' ? `${FLOWERS[re.key].name} ${FORM[FLOWERS[re.key].form].name}` : re.cat === 'supply' ? SUPPLIES[re.key].name
  : re.cat === 'honey' ? honeyName(re.key) : re.cat === 'mine' ? mineName(re.key) : decoInfo(re.key).name;
const returnText = re => `${returnName(re)} ×${re.n}`;
const RETURN_WHERE = { seed: '창고', supply: '창고', honey: '찻집 꿀 선반', mine: '광산 주머니', deco: '창고' };
const returnKeys = (st, e) => e.cat === 'honey' ? HONEY_KEYS.filter(k => k === 'wild' || (st.dex.flower || {})[k])   // 꿀은 들꽃꿀이나 본 적 있는 꽃의 꿀
  : e.cat === 'deco' ? e.keys.filter(k => !(st.dex.deco || {})[k]) : e.keys;                                         // 장식은 아직 없는 것만
const pickW = (list, rng) => { const tot = list.reduce((a, x) => a + x.w, 0); let r = rng() * tot; for (const x of list) { r -= x.w; if (r < 0) return x; } return list[list.length - 1]; };
// 답례품 하나 뽑기 (주지는 않음). likes: 이웃이 좋아하는 칸. 고른 장식이 다 있으면 같은 등급의 더 싸거나 같은 장식 → 그것도 없으면 장식 아닌 칸에서 다시
function pickReturn(st, giftKey, likes, rng) {
  const table = RETURNS[giftKey]; if (!table) return null;
  const w = e => ({ e, w: e.w * (likes && e.cat === likes ? returnBias : 1) });
  let e = pickW(table.map(w), rng).e, keys = returnKeys(st, e);
  if (!keys.length && e.cat === 'deco') {
    const cap = Math.max(...e.keys.map(k => DECOS[k].price));
    keys = table.filter(x => x.cat === 'deco' && x !== e).flatMap(x => returnKeys(st, x)).filter(k => DECOS[k].price <= cap);
  }
  if (!keys.length) { e = pickW(table.filter(x => x.cat !== 'deco').map(w), rng).e; keys = returnKeys(st, e); }
  return { cat: e.cat, key: keys[Math.floor(rng() * keys.length)], n: e.n };
}
function giveReturn(st, re, ctx) {                // 알맞은 곳에 넣기
  if (re.cat === 'seed') for (let i = 0; i < re.n; i++) st.items.push(newItem(st, re.key, 1, '답례품'));
  else if (re.cat === 'supply') st[re.key] = (st[re.key] || 0) + SUPPLIES[re.key].per * re.n;
  else if (re.cat === 'honey') { st.honey = st.honey || {}; st.honey[re.key] = (st.honey[re.key] || 0) + re.n; }   // 꿀 도감 · 올해 꿀은 직접 거둔 것만
  else if (re.cat === 'mine') { const m = st.mine = st.mine || newMine(); m.bag[re.key] = (m.bag[re.key] || 0) + re.n; }               // 광산 도감은 직접 판 것만
  else if (re.cat === 'deco') { const first = !(st.dex.deco || {})[re.key]; addDeco(st, re.key); if (first) addLog(st, 9, `도감에 등록: 🪴 ${DECOS[re.key].name}`, ctx); }
}
const LETTER_BOX_MAX = 60;
function deliverLetters(st, cal, ctx) {           // onSlot: 때가 된 답장
  const due = (st.letterPending || []).filter(p => cal.abs >= p.due); if (!due.length) return;
  st.letterPending = st.letterPending.filter(p => cal.abs < p.due);
  st.dex.letter = st.dex.letter || {};
  st.letterBox = st.letterBox || [];
  for (const p of due) {
    if (!GIFTS[p.gift]) continue;                 // 모르는 선물(손댄 파일)은 건너뜀 (QA 9회차)
    const left0 = LETTER_KEYS.filter(k => !st.dex.letter[k]);
    // 보낸 선물에 맞는 편지 → 어느 선물에나 맞는 편지 → 남은 아무 편지 (QA 9회차: 꽃다발에 차 이야기가 오던 것)
    const left = [left0.filter(k => LETTERS[k].gift === p.gift), left0.filter(k => !LETTERS[k].gift)].find(a => a.length) || [];   // 다른 선물 전용 편지는 주지 않음 (QA 10회차)
    let k = null;
    if (left.length) {
      k = left[Math.floor(mineRng(hashStr(`${st.gardenId || 'g'}|letter|${S(st, 'gifts')}|${p.gift}`))() * left.length)];
      st.dex.letter[k] = true;
      addLog(st, 17, `${LETTERS[k].from}에게서 답장이 왔어요 · 📖 도감 ✉️ 편지`, ctx);
    } else addLog(st, 17, `${josa(GIFTS[p.gift].name, '을/를')} 받은 이웃이 고맙다는 답장을 보냈어요`, ctx);
    // P26-06 답례품: ctx.rng(화면은 Math.random, 시뮬 · 테스트는 시드 rng). 없으면 정원 이름표로 정해지는 난수
    const rng = (ctx && ctx.rng) || mineRng(hashStr(`${st.gardenId || 'g'}|return|${S(st, 'gifts')}|${p.gift}|${cal.abs}`));
    const re = pickReturn(st, p.gift, k && LETTERS[k].likes, rng);
    if (re) {
      giveReturn(st, re, ctx);
      addLog(st, 17, `🎁 답례품 ${returnText(re)} · ${RETURN_WHERE[re.cat]}에 있어요`, ctx);
      if (ctx && ctx.live && ctx.toast) ctx.toast(`✉️ ${k ? LETTERS[k].from : '이웃'}의 답장 · 🎁 ${returnText(re)}`);
    }
    // 받은 편지함: 도감에서 다시 읽을 때 그때 받은 답례품을 보여 줌 · read는 화면이 편지를 띄우면 true
    st.letterBox.push({ k, gift: p.gift, re, y: yearOf(st, cal), m: cal.month, read: false });
    if (st.letterBox.length > LETTER_BOX_MAX) { const i = st.letterBox.findIndex(b => !b.k && b.read); st.letterBox.splice(i >= 0 ? i : 0, 1); }
  }
}
const letterOf = (st, k) => (st.letterBox || []).find(b => b.k === k) || null;
function returnEV(giftKey, likes, owned) {    // 기대 가치(원) — 체크리스트 표 · 테스트용. owned: 장식을 다 가진 정원으로 셈
  const table = RETURNS[giftKey], w = e => e.w * (likes && e.cat === likes ? returnBias : 1);
  const avg = e => { const ks = e.cat === 'honey' ? ['wild'] : e.keys; return ks.reduce((a, key) => a + returnValue({ cat: e.cat, key, n: e.n }), 0) / ks.length; };
  const list = owned ? table.filter(e => e.cat !== 'deco') : table;
  const tot = list.reduce((a, e) => a + w(e), 0);
  return list.reduce((a, e) => a + w(e) * avg(e), 0) / tot;
}

// ---------------------------------------------------------------- 🏅 한 해 정원 평가 (P23-02, 10-24)
// 쉼달 기록 때 점수 — 땅 가짓수 ×10 · 살아 있는 꽃(80까지) · 올해 핀 꽃 가짓수 ×4 · 만든 블렌드 가짓수 ×3 · 거둔 꿀 가짓수 ×2 · 정원에 놓은 장식(20까지) ×3 · 올해 손님 주문 ×5. 남과 겨루지 않고 내 기록과만
// 해마다 다시 채우는 것 (QA 6회차: 도감 늘어난 칸은 오래 할수록 0이라 점수가 해마다 떨어졌음) — 올해 핀 꽃 · 만든 블렌드 · 거둔 꿀 가짓수
function seeYear(st, k, v) { const y = st.yearSeen = st.yearSeen || { bloom: {}, blend: {}, honey: {} }; (y[k] = y[k] || {})[v] = true; }
function yearScore(st) {
  const counts = landCounts(st), lands = LAND_KEYS.filter(k => k !== 'barren' && counts[k] > 0).length;
  const alive = Math.min(80, st.flowers.filter(f => !f.withered).length);
  const prev = st.records[0], ys = st.yearSeen || {};
  const decos = Math.min(20, (st.decos || []).filter(d => d.x != null).length);
  const orders = S(st, 'orders') - ((prev && prev.orders) || 0);
  const gifts = Math.min(6, S(st, 'gifts') - ((prev && prev.giftsTotal) || 0));   // 기록 사이(꽃잠 + 새해)에 최대 6번 (QA 10회차)   // 꽃잠에 보낸 것도 다음 기록에 (QA 9회차)
  const parts = { lands: lands * 10, flowers: alive, bloom: n0(ys.bloom) * 4, blend: n0(ys.blend) * 3, honey: n0(ys.honey) * 2, decos: decos * 3, orders: orders * 5, gifts: gifts * 10 };   // gifts: P26-03
  return { total: Object.values(parts).reduce((a, b) => a + b, 0), parts, orders: S(st, 'orders'), giftsTotal: S(st, 'gifts') };
}

// ---------------------------------------------------------------- ⛏️ 정원 뒤 광산 (P24, 10-24)
// 기다리는 시간에 조금씩: 기력 10칸, 30분(현실 = 게임 시간)마다 1칸 — 꺼 둔 동안에도 참(열 때 따라잡음), 꽃잠에도 팜
// 층마다 8×6칸, 한 칸 파는 데 기력 1. 계단을 찾으면 아래층. 나온 것은 팔지 않고 만들기 · 도감에만 (돈이 더 남지 않게, P24-04)
const MINE_W = 8, MINE_H = 6, MINE_MAX_E = 12, MINE_REGEN_H = 0.5, MINE_DEEPEST = 20;
const ORES = {
  quartz: { name: '석영', from: 1, color: '#e9e4f2' },
  feldspar: { name: '장석', from: 1, color: '#e6b8a0' },
  mica: { name: '운모', from: 3, color: '#c9c2a8' },
  amethyst: { name: '자수정', from: 6, color: '#9a6ac8' },
  jade: { name: '비취', from: 9, color: '#5fae84' },
  amber: { name: '호박', from: 12, color: '#e0a03a' },
};
const FOSSILS = {
  shell: { name: '조개 화석', from: 2 },
  fern: { name: '고사리 화석', from: 6 },
  leaf: { name: '잎 화석', from: 8 },
  bone: { name: '작은 뼈 화석', from: 11 },
};
const ORE_KEYS = Object.keys(ORES), FOSSIL_KEYS = Object.keys(FOSSILS);
const MINE_DEX_KEYS = [...ORE_KEYS, ...FOSSIL_KEYS, 'oldseed'];       // 광산 도감 11칸 (도감 93칸과 따로)
const mineName = k => ORES[k] ? ORES[k].name : FOSSILS[k] ? FOSSILS[k].name : k === 'oldseed' ? '옛 씨앗' : k === 'stone' ? '돌' : k === 'dirt' ? '흙' : k;
// 층 판은 정원 이름표 · 층 · 몇 번째 판으로 정해지는 난수 (Math.random을 쓰지 않음 — 시뮬레이션이 흔들리지 않게)
function mineRng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function newBoard(st, depth) {
  const m = st.mine, rnd = mineRng(hashStr(`${st.gardenId || 'g'}|${depth}|${m.boards || 0}`));
  const ores = ORE_KEYS.filter(k => ORES[k].from <= depth), fos = FOSSIL_KEYS.filter(k => FOSSILS[k].from <= depth);
  const cells = [];
  for (let i = 0; i < MINE_W * MINE_H; i++) {
    const x = rnd();
    let k;
    if (depth >= 8 && x < 0.006) k = 'oldseed';
    else if (fos.length && x < 0.03) k = fos[Math.floor(rnd() * fos.length)];
    else if (x < 0.03 + 0.10 + depth * 0.004) k = ores[Math.floor(rnd() * ores.length)];
    else if (x < 0.52) k = 'stone';
    else k = 'dirt';
    cells.push({ k, dug: false });
  }
  cells[Math.floor(rnd() * cells.length)].stairs = true;             // 계단은 한 칸 (그 칸에서 나온 것도 받음)
  m.boards = (m.boards || 0) + 1;
  return { depth, cells };
}
const newMine = () => ({ energy: MINE_MAX_E, regenH: 0, depth: 1, deepest: 1, boards: 0, board: null, bag: {} });
function mineOf(st) {
  if (!st.mine) st.mine = newMine();
  if (!st.mine.board) st.mine.board = newBoard(st, st.mine.depth);
  return st.mine;
}
function mineRegen(st, dtH) {                     // advance에서 (꽃잠에도)
  const m = st.mine; if (!m || m.energy >= MINE_MAX_E) { if (m) m.regenH = 0; return; }
  m.regenH += dtH;
  while (m.regenH >= MINE_REGEN_H && m.energy < MINE_MAX_E) { m.regenH -= MINE_REGEN_H; m.energy++; }
  if (m.energy >= MINE_MAX_E) m.regenH = 0;
}
function dig(st, i, ctx) {
  const m = mineOf(st), c = m.board.cells[i];
  if (!Number.isInteger(i) || !c) return no('그런 칸이 없어요');
  if (c.dug) return no('이미 판 칸이에요');
  if (m.energy < 1) return no('기력이 없어요 · 30분마다 한 칸씩 차요');
  m.energy--; c.dug = true;
  m.bag[c.k] = (m.bag[c.k] || 0) + 1;
  st.dex.mine = st.dex.mine || {};
  let first = false;
  if (MINE_DEX_KEYS.includes(c.k) && !st.dex.mine[c.k]) { st.dex.mine[c.k] = true; first = true; addLog(st, 9, `도감에 등록: ⛏️ ${mineName(c.k)}`, ctx); }
  st.stats = st.stats || {}; st.stats.dug = (st.stats.dug || 0) + 1;
  return ok(`${c.k === 'oldseed' ? '🌰 ' : ''}${mineName(c.k)}${c.stairs ? (m.depth >= MINE_DEEPEST ? ' · 가장 깊은 곳이에요' : ' · 아래로 내려가는 계단을 찾았어요') : ''}`, { cell: c, first, stairs: !!c.stairs && m.depth < MINE_DEEPEST });
}
function descend(st) {
  const m = mineOf(st);
  if (!m.board.cells.some(c => c.dug && c.stairs)) return no('먼저 계단을 찾아요');
  if (m.depth >= MINE_DEEPEST) return no('가장 깊은 층이에요');
  m.depth++; m.deepest = Math.max(m.deepest, m.depth); m.board = newBoard(st, m.depth);
  return ok(`지하 ${m.depth}층으로 내려왔어요`);
}
function mineUp(st) {                            // 1층으로 돌아가기 (새 판)
  const m = mineOf(st);
  if (m.depth === 1) return no('이미 1층이에요');
  m.depth = 1; m.board = newBoard(st, 1);
  return ok('1층으로 올라왔어요');
}
function toDeepest(st) {                          // 가장 깊이 내려간 층으로 돌아가기: 기력 3 (QA 4회차)
  const m = mineOf(st);
  if (m.depth >= m.deepest) return no('이미 가장 깊은 층이에요');
  if (m.energy < 3) return no('기력 3이 필요해요');
  m.energy -= 3; m.depth = m.deepest; m.board = newBoard(st, m.depth);
  return ok(`지하 ${m.depth}층으로 다시 내려왔어요`);
}
function freshBoard(st) {                        // 지금 층을 새 판으로 (다 팠을 때)
  const m = mineOf(st);
  if (m.board.cells.some(c => !c.dug)) return no('아직 안 판 칸이 있어요');
  m.board = newBoard(st, m.depth);
  return ok('새 굴을 팠어요');
}
// 만들기 (P24-03): 돌 → 장식, 흙 → 비료, 광물 → 찻잔 유약 (P17-15 세트를 돈 대신)
const CRAFTS = {
  fert: { name: '비료', need: { dirt: 5 }, desc: '흙 5 → 🌱 비료 1' },
  stepstone: { name: '징검돌', need: { stone: 8 }, deco: 'stepstone' },            // 10-24 밸런스(QA 4회차): 돌 값을 2~2.5배로
  basin: { name: '돌 물확', need: { stone: 20 }, deco: 'basin' },
  stonelamp: { name: '석등', need: { stone: 30, quartz: 2 }, deco: 'stonelamp' },
  fossilcase: { name: '화석 진열장', need: { shell: 1, fern: 1, leaf: 1, bone: 1, stone: 10 }, deco: 'fossilcase' },
  amberlamp: { name: '호박 등', need: { amber: 3, stone: 15 }, deco: 'amberlamp' },
  oldpot: { name: '옛 씨앗 화분', need: { oldseed: 2, dirt: 10 }, deco: 'oldpot' },
  cheongja: { name: '청자 찻잔', need: { jade: 2 }, cup: 'cheongja' },               // 비취는 9층부터라 2개로
  buncheong: { name: '분청 찻잔', need: { feldspar: 4, mica: 2 }, cup: 'buncheong' },
  kkot: { name: '꽃무늬 찻잔', need: { amethyst: 2, quartz: 4 }, cup: 'kkot' },
};
const CRAFT_KEYS = Object.keys(CRAFTS);
const canCraft = (st, k) => { const C = Object.prototype.hasOwnProperty.call(CRAFTS, k) ? CRAFTS[k] : null, bag = (st.mine && st.mine.bag) || {}; return !!C && Object.entries(C.need).every(([n, q]) => (bag[n] || 0) >= q); };
function craft(st, k, ctx) {
  const C = Object.prototype.hasOwnProperty.call(CRAFTS, k) ? CRAFTS[k] : null;
  if (!C) return no('만들 수 없는 것이에요');
  if (C.cup && shopOf(st).cups.includes(C.cup)) return no('이미 있는 찻잔이에요');
  if (!canCraft(st, k)) return no('재료가 모자라요');
  const bag = st.mine.bag;
  for (const [n, q] of Object.entries(C.need)) bag[n] -= q;
  if (C.deco) { const first = !(st.dex.deco || {})[C.deco]; addDeco(st, C.deco); if (first) addLog(st, 9, `도감에 등록: 🪴 ${DECOS[C.deco].name}`, ctx); return ok(`${josa(C.name, '을/를')} 만들었어요 · 창고에 있어요`); }
  if (C.cup) { shopOf(st).cups.push(C.cup); return ok(`${josa(C.name, '을/를')} 구웠어요 · 찻집 가꾸기에서 고를 수 있어요`); }
  addFert(st, 1); st._fertNew = Math.max(0, st._fertNew - 1);
  return ok('흙으로 비료 1개를 만들었어요');
}
const mineCount = st => Object.keys((st.dex && st.dex.mine) || {}).filter(k => MINE_DEX_KEYS.includes(k)).length;

// ---------------------------------------------------------------- 이웃의 화분 (P22-02, 10-24)
// 첫 방문(첫 안내 창의 '시작')에 그 달에 피어 있거나 다음 달에 피는 여러해살이 · 나무 하나를 다 자란 채로 심어 줌. 돈은 주지 않음
// 어느 요일에 시작해도 첫날 꽃 · 수확을 보고, 1장 퀘스트(P22-01)를 그 꽃으로 함
const GIFT_BY_MONTH = { 3: 'maehwa', 4: 'rose', 5: 'rose', 6: 'lavender', 7: 'jasmine', 8: 'jasmine', 9: 'gamguk', 10: 'gamguk', 11: 'gamguk', 12: 'dongbaek', 1: 'napmae', 2: 'maehwa', 13: 'maehwa', 14: 'maehwa' };
function giftPot(st, ctx, want) {                // want: 안내 창에서 보여 준 꽃 (창을 연 채 달이 바뀌어도 같은 꽃)
  if (st.gift != null) return no('이웃의 화분은 한 번만 와요');
  const cal = calendar(st.virtual), type = want && Object.values(GIFT_BY_MONTH).includes(want) ? want : GIFT_BY_MONTH[cal.month], F = FLOWERS[type];
  // 정원 가운데에서 가까운 빈 칸
  let spot = null;
  for (let r = 0; r < Math.max(W, H) && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
    const x = Math.floor(W / 2) + dx, y = Math.floor(H / 2) + dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && inGarden(x, y) && !flowerAt(st, x, y) && !decoAt(st, x, y)) spot = [x, y];
  }
  if (!spot) return no('화분을 둘 빈 칸이 없어요');
  const f = {
    id: nid(st), type, x: spot[0], y: spot[1], q: 0.8, startQ: 0.8, origin: '이웃', parent: null,
    ageH: F.mature * MONTH_H + 1, stage: 'young', bloomed: false, withered: false,
    waterH: 2 * MONTH_H, weedH: 2 * MONTH_H, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 24,   // 물 · 잡초는 막 돌본 채로
    harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: yearOf(st, cal),
  };
  f.stage = computeStage(f, cal.month);
  const tl = st.tiles[f.y * W + f.x]; tl.t = F.t; tl.m = F.m;          // 화분 흙째 옮겨 심음
  st.flowers.push(f);
  st.gift = cal.abs; st.firstFlower = type;
  if (cal.frozen) {                               // 꽃잠엔 거둘 수 없으니 티백 2개도 (QA 7회차: 첫 쪽지를 들어줄 수 있게)
    for (let i = 0; i < 2; i++) st.teas.push({ id: nid(st), type, q: 0.8, seasonKey: -1, hat: false });
    st.dex.teabag = st.dex.teabag || {}; st.dex.teabag[type] = true;
  }
  if (teaShopOpen(cal)) makeOrders(st, cal);      // 쪽지는 화분 꽃을 알고 나서 다시 (QA 6회차 높음)
  st.dex.form = st.dex.form || {}; st.dex.form[type] = true;
  addLog(st, 3, `이웃이 ${josa(F.name, '을/를')} 화분째 나눠 줬어요 · 정원 가운데에 심었어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께` : ''}`, ctx);
  return ok(`이웃이 ${josa(F.name, '을/를')} 나눠 줬어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께 받았어요` : ''}`, { flower: f });
}

// ---------------------------------------------------------------- 정원 장식 (P17-16, 10-24)
// 돈 쓸 곳: 달마다 화원에 장식 하나가 들어옴 (그 달에만, 다음 해에 다시 옴). 꽃이 없는 칸에 놓고, 땅 · 꽃 · 값에는 영향이 없음
// 칭호를 얻으면 그 칭호 문장 장식("t:칭호키")을 하나 받음 (사지 못함, P19-08-04)
const DECOS = {
  stepstone: { name: '징검돌', month: 3, price: 1500, desc: '꽃 사이를 걷는 납작한 돌' },
  birdhouse: { name: '새집', month: 4, price: 8000, desc: '봄 새가 쉬어 가는 작은 집' },
  bench: { name: '나무 벤치', month: 5, price: 12000, desc: '꽃을 보며 앉는 자리' },
  basin: { name: '돌 물확', month: 6, price: 9000, desc: '빗물이 고이는 돌그릇' },
  chime: { name: '풍경', month: 7, price: 5000, desc: '바람이 불면 맑게 울려요' },
  pond: { name: '작은 연못', month: 8, price: 40000, desc: '연잎이 떠 있는 물웅덩이' },
  stonelamp: { name: '석등', month: 9, price: 15000, desc: '가을밤을 밝히는 돌 등' },
  pumpkin: { name: '호박 바구니', month: 10, price: 3000, desc: '잘 익은 호박 한 덩이' },
  fence: { name: '나무 울타리', month: 11, price: 2000, desc: '정원 가장자리를 두르는 울' },
  snowman: { name: '눈사람', month: 12, price: 4000, desc: '첫눈으로 만든 친구' },
  jars: { name: '장독대', month: 1, price: 20000, desc: '겨울 볕을 쬐는 항아리' },
  bonsai: { name: '매화 분재', month: 2, price: 25000, desc: '작은 화분에 핀 매화' },
  moonlamp: { name: '달 초롱', month: 13, price: 6000, desc: '꽃잠 밤을 지키는 초롱' },
  pavilion: { name: '정자', month: 14, price: 60000, desc: '정원을 내려다보는 쉼터' },
  hive: { name: '벌통', month: 6, months: [6, 7, 8], price: 15000, one: true, func: true, desc: '둘레 2칸에 핀 꽃에서 달마다 꿀을 모아요' },   // P18 여름의 꿀 채집 (10-24)
  fossilcase: { name: '화석 진열장', month: 0, months: [], craft: true, desc: '광산에서 찾은 화석 네 가지' },   // 10-24 QA 6회차: 광산 재료 쓸 곳
  amberlamp: { name: '호박 등', month: 0, months: [], craft: true, desc: '호박빛이 은은한 등' },
  oldpot: { name: '옛 씨앗 화분', month: 0, months: [], craft: true, desc: '무엇이 필지 모르는 오래된 씨앗' },
  // P27 생장 장치 (10-24 저녁): 돈이 넉넉한 정원사를 위한 것 — 다 자라기까지 걸리는 시간만 줄임 (피는 달 · 품질 · 땅 · 꽃잠은 그대로). 늘 팖
  heatmat: { name: '온상 매트', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 15000, func: true, gear: true, desc: '바로 옆 꽃이 심은 첫 달 · 싹 · 새싹일 때 2배 빨리' },
  growlight: { name: '생장등', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 30000, func: true, gear: true, desc: '바로 옆 꽃 8포기가 1.5배 빨리 자라요' },
  greenhouse: { name: '유리 온실', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 120000, one: true, func: true, gear: true, desc: '둘레 2칸 꽃이 2배 빨리 자라요' },
  barrel: { name: '빗물 통', month: 6, months: [6, 7], price: 25000, func: true, desc: '바로 옆 꽃 8포기에 달마다 물을 줘요' },   // P25-02 기능 있는 장식 (10-24)
  cloudstone: { name: '구름 돌', month: 0, months: [], extra: true, desc: '구름 정원사에게 온 뭉게구름 모양 돌' },   // P20-16 덤 장식 (10-27): 팔지 않음 · 꾸밈 도감 칸과 따로 셈
};
const DECO_KEYS = Object.keys(DECOS).filter(k => !DECOS[k].extra);           // 덤 장식은 EXTRA_DECO_KEYS
const EXTRA_DECO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].extra);
const decoInfo = key => {
  if (DECOS[key] && Object.prototype.hasOwnProperty.call(DECOS, key)) return DECOS[key];
  const tk = typeof key === 'string' && key.startsWith('t:') ? key.slice(2) : null;
  return tk && TITLES[tk] ? { name: `${TITLES[tk].name} 문장`, title: tk, price: null, extra: !!TITLES[tk].extra, desc: '칭호를 얻은 기념 문장' } : null;
};
const decoTotal = () => DECO_KEYS.length + TITLE_KEYS.length;               // 꾸밈 도감 칸 (도감 93칸과 따로 셈, P17-16-05) — 덤 장식 · 덤 칭호 문장은 빼고
const decoCount = st => Object.keys((st.dex && st.dex.deco) || {}).filter(k => decoInfo(k) && !decoInfo(k).extra).length;
const decoExtras = st => [...EXTRA_DECO_KEYS, ...EXTRA_TITLE_KEYS.map(k => 't:' + k)].filter(k => ((st.dex && st.dex.deco) || {})[k]);   // 가진 덤 장식 (꾸밈 도감 끝에 덧붙여 보여 줌)
const decoMonths = k => DECOS[k].months || [DECOS[k].month];
const decoOffer = cal => DECO_KEYS.filter(k => decoMonths(k).includes(cal.month));
const decoAt = (st, x, y) => (st.decos || []).find(d => d.x === x && d.y === y);
function addDeco(st, key) {
  const d = { id: nid(st), key, x: null, y: null };
  (st.decos = st.decos || []).push(d);
  st.dex.deco = st.dex.deco || {}; st.dex.deco[key] = true;
  return d;
}
function buyDeco(st, key, ctx) {
  const it = DECOS[key], cal = calendar(st.virtual);
  if (!it || !Object.prototype.hasOwnProperty.call(DECOS, key)) return no('없는 장식이에요');
  if (!decoMonths(key).includes(cal.month)) return no(`${josa(it.name, '은/는')} ${decoMonths(key).map(monthName).join('·')}에만 들어와요`);
  if (it.one && (st.decos || []).some(d => d.key === key)) return no(`${josa(it.name, '은/는')} 하나면 충분해요`);
  if (st.money < it.price) return no('돈이 모자라요');
  st.money -= it.price;
  const first = !st.dex.deco || !st.dex.deco[key];
  const d = addDeco(st, key);
  if (first) addLog(st, 9, `도감에 등록: 🪴 ${it.name}`, ctx);
  return ok(`${josa(it.name, '을/를')} 샀어요 · 창고에서 정원에 놓을 수 있어요`, { deco: d });
}
function placeDeco(st, id, x, y) {
  const d = (st.decos || []).find(z => z.id === id);
  if (!d) return no('놓을 장식이 없어요');
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('꽃이 있는 칸에는 놓을 수 없어요');
  const o = decoAt(st, x, y);
  if (o && o !== d) return no('이 자리에는 이미 장식이 있어요');
  const moved = d.x != null && (d.x !== x || d.y !== y);
  d.x = x; d.y = y;
  return ok(`${josa(decoInfo(d.key).name, '을/를')} ${moved ? '옮겼어요' : '놓았어요'}`);
}
// ---------------------------------------------------------------- 🔆 생장 장치 (P27, 10-24 저녁)
// 놓인 장치 둘레의 꽃이 자라는 시간(ageH)을 빨리 셈 — 겹치면 가장 빠른 것 하나만. 다 자란 꽃은 피는 달을 기다릴 뿐이라 영향이 없음
const GEAR = { growlight: { r: 1, rate: 1.5 }, heatmat: { r: 1, rate: 2, young: true }, greenhouse: { r: 2, rate: 2 } };
function growRate(st, f) {
  let best = 1;
  for (const d of st.decos || []) {
    const g = GEAR[d.key]; if (!g || d.x == null) continue;
    if (Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) > g.r) continue;
    if (g.young && !(f.stage === 'germ' || f.stage === 'sprout' || (f.lifeH != null ? f.lifeH : f.ageH) < MONTH_H)) continue;   // 온상 매트는 싹 · 새싹, 또는 심은 첫 달(묘목 · 모종 뿌리내림, QA 12회차 제안)
    if (g.rate > best) best = g.rate;
  }
  return best;
}
// ---------------------------------------------------------------- 🍯 꿀 (P18, 10-24)
// 놓인 벌통은 꽃잠이 아닌 달이 끝날 때마다 둘레 2칸(가로 · 세로 · 대각선)에 핀 꽃을 세어 꿀을 모음 (P18-03 · 04 · 09)
// 꿀은 팔지 않음 — 찻잔에 한 숟갈 넣어 "꿀 ○○차"로 내고(값은 그대로), 종류마다 꿀 도감에 남음 (P18-07 · 08)
const HONEY_R = 2, HIVE_MAX = 6;
const HONEY_KEYS = [...FLOWER_KEYS, 'wild'];
const honeyName = k => k === 'wild' ? '들꽃꿀' : `${FLOWERS[k].name}꿀`;
function hiveBlooms(st, d) {
  return st.flowers.filter(f => !f.withered && f.stage === 'bloom' && Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= HONEY_R);
}
// 둘레의 핀 꽃 → 꿀 종류 · 병 수. 가장 많은 꽃을 따르고, 세 가지 넘게 섞여 절반을 넘는 꽃이 없으면 들꽃꿀
function honeyOf(blooms) {
  const n = blooms.length; if (!n) return null;
  const by = {}; for (const f of blooms) by[f.type] = (by[f.type] || 0) + 1;
  const kinds = Object.keys(by), top = FLOWER_KEYS.filter(k => by[k]).sort((a, b) => by[b] - by[a])[0];
  const type = kinds.length >= 3 && by[top] * 2 < n ? 'wild' : top;
  return { type, jars: n >= 6 ? 3 : n >= 3 ? 2 : 1 };
}
// P25-02 빗물 통: 꽃잠이 아닌 달이 끝날 때 바로 옆(가로 · 세로 · 대각선 1칸) 꽃에 물 — 물병 없이, 물 준 것과 같음(2달)
const BARREL_R = 1;
function barrelTick(st) {
  let n = 0;
  for (const d of st.decos || []) {
    if (d.key !== 'barrel' || d.x == null) continue;
    for (const f of st.flowers) if (!f.withered && Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= BARREL_R && f.waterH < MONTH_H) { f.waterH = 2 * MONTH_H; f.thirstH = 0; n++; }
  }
  return n;
}
function hiveTick(st, ctx) {
  for (const d of st.decos || []) {
    if (d.key !== 'hive' || d.x == null) continue;
    const h = honeyOf(hiveBlooms(st, d)); if (!h) continue;
    d.honey = d.honey || [];
    const add = Math.min(h.jars, HIVE_MAX - d.honey.length); if (add <= 0) continue;
    for (let i = 0; i < add; i++) d.honey.push(h.type);
    addLog(st, 14, `벌통에 ${honeyName(h.type)} ${add}병이 모였어요`, ctx);
  }
}
function takeHoney(st, id, ctx) {                 // 벌통의 꿀을 거둬 찻집 꿀 선반으로 (P18-05: 도구 없이)
  const d = (st.decos || []).find(z => z.id === id && z.key === 'hive');
  if (!d || !(d.honey || []).length) return no('벌통에 모인 꿀이 없어요');
  st.honey = st.honey || {}; st.dex.honey = st.dex.honey || {};
  const n = d.honey.length;
  for (const k of d.honey) {
    st.honey[k] = (st.honey[k] || 0) + 1; seeYear(st, 'honey', k);
    if (!st.dex.honey[k]) { st.dex.honey[k] = true; addLog(st, 9, `도감에 등록: 🍯 ${honeyName(k)}`, ctx); }
  }
  d.honey = [];
  return ok(`꿀 ${n}병을 거뒀어요 · 찻집 꿀 선반에 있어요`);
}
function honeyCup(st, cupId, k) {                  // 찻잔에 꿀 한 숟갈 (P18-07)
  const c = (st.cups || []).find(z => z.id === cupId);
  if (!c) return no('찻잔이 없어요');
  if (c.honey) return no('이미 꿀을 넣었어요');
  if (!HONEY_KEYS.includes(k) || !(st.honey && st.honey[k] > 0)) return no('그 꿀이 없어요');
  st.honey[k]--; c.honey = k;
  return ok(`${josa(honeyName(k), '을/를')} 한 숟갈 넣었어요 🍯`);
}
const honeyCount = st => Object.keys((st.dex && st.dex.honey) || {}).filter(k => HONEY_KEYS.includes(k)).length;
function storeDeco(st, id) {
  const d = (st.decos || []).find(z => z.id === id);
  if (!d) return no('거둘 장식이 없어요');
  const hn = (d.honey || []).length;
  if (hn) takeHoney(st, d.id);                   // 벌통에 모인 꿀은 함께 거둠 (QA 2회차)
  d.x = null; d.y = null;
  return ok(`${josa(decoInfo(d.key).name, '을/를')} 창고에 넣었어요${hn ? ` · 꿀 ${hn}병은 찻집 꿀 선반으로` : ''}`);
}

// ---------------------------------------------------------------- 저장 파일 (P20-02 · 03, 10-17)
// 파일과 (나중의) 구글 드라이브가 같은 형식을 씀. check는 깨짐 확인용 해시일 뿐 치트 방지가 아님
const SAVE_APP = 'doris-garden', SAVE_FORMAT = 1;
function hashText(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
// 정원마다 붙는 이름표: 여러 기기에서 같은 정원인지 가릴 때 씀 (P20-06). 시드 rng를 쓰지 않아 땅 생성 · 시뮬레이션에 영향 없음
const newGardenId = () => Date.now().toString(36) + '-' + Math.floor(Math.random() * 36 ** 6).toString(36);
// 불러오기 전에 보여 줄 요약 (JSON에서 막 읽은 정원에도 씀)
function saveSummary(st) {
  const cal = calendar(st.virtual);
  return { year: yearOf(st, cal), month: cal.month, money: st.money, dex: dexCount(st), dexTotal: dexTotal(st), titles: n0(st.titles), titleOn: st.titleOn || null };
}
function makeSave(st, now) {
  const game = JSON.parse(JSON.stringify(st));
  delete game._newTitles;                                                // 얻는 연출 대기열은 이 기기에서만
  return { app: SAVE_APP, format: SAVE_FORMAT, gardenId: st.gardenId || null, savedAt: now, summary: saveSummary(st), check: hashText(JSON.stringify(game)), game };
}
// 검사(P20-03-01): 앱 · 형식 · 깨짐 · 땅 칸 수. 통과하면 { ok, data }
function parseSave(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return no('도리의 정원 저장 파일이 아니에요'); }
  if (!d || d.app !== SAVE_APP || !d.game || typeof d.game !== 'object') return no('도리의 정원 저장 파일이 아니에요');
  if (typeof d.format !== 'number') return no('파일이 손상됐어요');
  if (d.format > SAVE_FORMAT) return no('더 새로운 버전에서 저장한 파일이에요');
  if (hashText(JSON.stringify(d.game)) !== d.check) return no('파일이 손상됐어요');
  const g = d.game;
  if (g.v !== 3 || !Array.isArray(g.tiles) || g.tiles.length !== W * H || !g.dex) return no('파일이 손상됐어요');
  return ok('', { data: d });
}

// ---------------------------------------------------------------- 예전 저장 보정 (10-24, app.js load()에서 옮김)
// 저장 형식(st)에 필드를 더하면 여기 맨 끝에 한 줄 더함. 순서대로 한 번씩 돌고 st.mig에 몇 번째까지 했는지 적음.
// 지금 있는 보정은 모두 여러 번 돌아도 같은 결과라서, mig가 없는 예전 저장은 처음부터 다 돌려도 됨
const MIGRATIONS = [
  ['물병 · 가위 · 호미 · 바구니 (10-05)', s => {
    if (s.water == null) s.water = 10;
    if (s.shears == null) s.shears = 5;
    if (s.hoe == null) s.hoe = 10;
    if (s.basket == null) s.basket = 10;
  }],
  ['꽃방 · 블렌딩 · 찻잔 (P12-07 · 08, P17-10)', s => { s.drying = s.drying || []; s.dried = s.dried || []; s.blends = s.blends || []; s.cups = s.cups || []; }],
  ['가게 → 화원 (10-05)', s => { for (const x of [...(s.items || []), ...(s.flowers || [])]) if (x.origin === '가게') x.origin = '화원'; }],
  ['꽃잎 도감: 이미 거둔 꽃(차 · 꽃잎이 있는 꽃) 등록', s => {
    if (s.dex.petal) return;
    s.dex.petal = {};
    for (const k of [...Object.keys(s.dex.tea), ...s.petals.map(p => p.type), ...s.teas.map(t => t.type)]) s.dex.petal[k] = true;
  }],
  ['블렌드 도감', s => { s.dex.blend = s.dex.blend || {}; }],
  ['정원 이름표 gardenId (P20)', s => { if (!s.gardenId) s.gardenId = newGardenId(); }],
  ['블렌드 티백 도감', s => { s.dex.bagBlend = s.dex.bagBlend || {}; }],
  ['티백 도감: 만든 적 있는 차는 티백으로도 등록', s => {
    if (s.dex.teabag) return;
    s.dex.teabag = {};
    for (const k of [...Object.keys(s.dex.tea), ...s.teas.map(t => t.type)]) s.dex.teabag[k] = true;
  }],
  ['씨앗 · 묘목 도감: 가진 적 있는 것(창고 · 심은 꽃 · 핀 적 있는 꽃) 등록', s => {
    if (s.dex.form) return;
    s.dex.form = {};
    for (const x of [...s.items, ...s.flowers]) s.dex.form[x.type] = true;
    for (const k of Object.keys(s.dex.flower)) s.dex.form[k] = true;
  }],
  ['찻집 가꾸기 (P17-15, 10-24)', s => { if (!s.shop) s.shop = newShop(); }],
  ['정원 장식 · 꾸밈 도감 · 이미 얻은 칭호의 문장 장식 (P17-16, 10-24)', s => {
    s.decos = s.decos || []; s.dex.deco = s.dex.deco || {};
    for (const k of Object.keys(s.titles || {})) if (TITLES[k] && !s.dex.deco['t:' + k]) addDeco(s, 't:' + k);
  }],
  ['꿀 선반 · 꿀 도감 (P18, 10-24)', s => { s.honey = s.honey || {}; s.dex.honey = s.dex.honey || {}; }],
  ['이웃의 화분 · 첫 꽃 (P22, 10-24): 이미 시작한 정원은 화분을 받지 않고 1장은 캐모마일 그대로', s => { if (s.gift === undefined) s.gift = s.onboarded ? -1 : null; if (s.firstFlower === undefined) s.firstFlower = null; }],
  ['⛏️ 광산 · 광산 도감 (P24, 10-24)', s => { if (!s.mine) s.mine = newMine(); s.dex.mine = s.dex.mine || {}; }],
  ['💌 손님 주문 · 기념품 도감 · 🏅 정원 점수 (P23, 10-24)', s => { if (s.orders === undefined) s.orders = null; s.dex.memento = s.dex.memento || {}; if (s.bestScore === undefined) s.bestScore = 0; }],
  ['직접 피운 꽃 (QA 4회차, 10-24): 지금까지 핀 꽃은 화분 꽃만 빼고 직접 피운 것으로', s => { if (!s.ownBloom) { s.ownBloom = {}; for (const k of Object.keys(s.dex.flower || {})) if (!(s.gift != null && s.gift >= 0 && s.firstFlower === k)) s.ownBloom[k] = true; } }],
  ['올해 본 것 (정원 점수, QA 6회차) — 올해 일지의 "피었어요"로 핀 꽃을 채움 (QA 7회차)', s => {
    if (s.yearSeen) return;
    s.yearSeen = { bloom: {}, blend: {}, honey: {} };
    for (const l of s.log || []) if (l.type === 8) { const k = FLOWER_KEYS.find(f => l.text.startsWith(FLOWERS[f].name)); if (k) s.yearSeen.bloom[k] = true; }
  }],
  ['💐 이웃에게 선물 · ✉️ 편지 도감 (P26, 10-24)', s => { if (s.gifts === undefined) s.gifts = null; s.letterPending = s.letterPending || []; s.dex.letter = s.dex.letter || {}; }],
  ['심은 뒤 흐른 시간 lifeH (QA 12회차, 10-24): 지금까지는 자란 시간과 같음', s => { for (const f of s.flowers || []) if (f.lifeH == null) f.lifeH = f.ageH; }],
  ['꽃잠 번식 표시 propRest · 꽃잠 안내를 닫은 주 restClosed (QA 19회차, 10-27)', s => { for (const f of s.flowers || []) if (f.propRest == null) f.propRest = false; if (s.restClosed === undefined) s.restClosed = null; }],
  ['☁️ 계정 기록 account · 마지막으로 손댄 때 actAt (P20-06 · 08, 10-27): 예전 정원은 모름(null)', s => { if (s.account === undefined) s.account = null; if (s.actAt === undefined) s.actAt = null; }],
  ['🎁 답례품 · 받은 편지함 letterBox (P26-06, 10-27): 예전에 받은 편지에는 답례품을 소급하지 않음', s => { s.letterBox = s.letterBox || []; }],
];
// 열 때마다 하는 일 (한 번으로 끝나지 않는 것)
function onOpen(s) {
  s._fertNew = 0; s._bloomNew = {};
  s.blends = s.blends || []; s.cups = s.cups || []; s.items = s.items || []; s.flowers = s.flowers || [];
  for (const b of [...s.blends, ...s.cups.filter(c => c.kind === 'blend')]) {   // 10-06 레시피가 바뀌어도 이름이 맞게
    const r = blendRecipe(b.parts, s);
    if (r !== (b.recipe || null)) { b.recipe = r; b.name = r ? BLENDS[r].name : `${b.parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`; }
  }
  autoCompost(s);                                  // 0%로 시든 씨앗 · 묘목은 열 때도 바로 비료로 (꽃잠엔 시간이 안 흘러서)
}
// 저장소 · 파일에서 막 읽은 정원을 지금 형식으로. 쓸 수 없는 정원이면 null
function migrateSave(s) {
  if (!s || s.v !== 3 || !Array.isArray(s.tiles) || s.tiles.length !== W * H || !s.dex) return null;
  for (let i = s.mig || 0; i < MIGRATIONS.length; i++) MIGRATIONS[i][1](s);
  s.mig = MIGRATIONS.length;
  onOpen(s);
  return s;
}

// ---------------------------------------------------------------- ☁️ 구글 드라이브 · 여러 기기 (P20-05 ~ 08, 10-27)
// 통신 · 창은 화면(drive.js · app-cloud.js)이 하고, 무엇을 할지는 여기서 정함. 시각은 모두 현실 ms
const CLOUD_GAP = 5 * 60 * 1000;                                       // P20-05-02 자동 저장 최소 간격
const CLOUD_CLOSE = 60 * 1000;                                          // 처음 맞추는 기기에서 두 저장이 1분 안이면 애매함
// 지금 드라이브에 저장해도 되나: 닫을 때 · 지금 저장 · 로그인 · 고른 뒤는 바로, 나머지(달 · 칭호)는 5분 간격
const cloudDue = (now, lastAt, why) => ['close', 'now', 'login', 'pick'].includes(why) || !lastAt || now - lastAt >= CLOUD_GAP;
// P20-04-03 첫 누름에 조용히 다시 받기를 해도 되나 (팝업이라 사용자 동작 안에서만, 이미 허락한 계정은 창이 잠깐 열렸다 닫힘)
//  c { on(클라이언트 ID), inApp(앱 안 브라우저), email(이 기기에서 로그인함), tokenOk, ready(구글 스크립트), waiting(받는 중),
//      failed(이 페이지에서 자동으로 해 보다 실패함), tried(마지막으로 자동으로 해 본 토큰의 exp, 없으면 null), exp(지금 토큰의 exp, 없으면 0) }
// 토큰이 끝날 때마다 한 번만 · 한 번 실패하면 그 페이지에서는 더 안 함 (누를 때마다 창이 뜨지 않게)
const cloudAutoOk = c => !!(c.on && !c.inApp && c.email && !c.tokenOk && c.ready && !c.waiting && !c.failed) && c.tried !== c.exp;
// 이 브라우저에 기억한 토큰을 써도 되나 (P20-04-03, 10-27 변경): 같은 계정 · 1분 넘게 남음. saved { token, exp, email }
const cloudTokenUse = (saved, email, now) => !!(saved && saved.token && email && saved.email === email && +saved.exp - now > 60 * 1000);
// P20-06 드라이브 정원과 이 기기 정원 중 무엇을 쓸까
//  local  { gardenId, actAt }    — actAt: 이 정원에 마지막으로 손댄 때 (st.actAt, 모르면 0)
//  base   { gardenId, savedAt }  — 이 기기가 마지막으로 드라이브와 맞춘 판 (올렸거나 받았거나 고른 것), 없으면 null
//  remote { gardenId, savedAt }  — 지금 드라이브의 garden.json, 없으면 null
// → { act: 'local'(이 기기 것을 올려도 됨) | 'remote'(드라이브 것을 자동으로) | 'ask'(어느 정원을 쓸까요?), why }
function cloudDecide(local, base, remote) {
  if (!remote || !remote.gardenId) return { act: 'local', why: 'empty' };
  // 이 기기가 본 뒤로 드라이브가 그대로면 이 기기 것이 맞음 (처음부터 다시 시작 · 파일 불러오기로 정원이 바뀐 경우도)
  if (base && remote.gardenId === base.gardenId && remote.savedAt <= base.savedAt) return { act: 'local', why: 'mine' };
  if (remote.gardenId !== local.gardenId) return { act: 'ask', why: 'other' };           // 다른 정원 (P20-06-03)
  const act = local.actAt || 0;
  if (base && base.gardenId === local.gardenId)                                          // 다른 기기에서 저장함 (P20-06-04)
    return act <= base.savedAt ? { act: 'remote', why: 'newer' } : { act: 'ask', why: 'both' };   // 이 기기도 그 뒤에 손댔으면 둘 다 바뀐 것
  // 이 기기에서 처음 맞춤: 늦은 쪽 (P20-06-02), 1분 안이면 묻기
  if (Math.abs(remote.savedAt - act) < CLOUD_CLOSE) return { act: 'ask', why: 'close' };
  return remote.savedAt > act ? { act: 'remote', why: 'newer' } : { act: 'local', why: 'older' };
}
// P20-08 계정의 첫 방문: 아는 날짜 중 가장 이른 것 (없으면 null)
const firstVisitOf = (...xs) => { const v = xs.map(Number).filter(x => x > 0); return v.length ? Math.min(...v) : null; };
// 계정 날짜를 정원에 이어 붙임: 「정원 문을 연 사람」이 없으면 조용히(연출 없이) 주고, 정원에 계정 날짜를 적음. 새로 줬으면 true
function applyAccount(st, firstVisit, ctx) {
  if (!firstVisit) return false;
  const a = st.account || {};
  st.account = Object.assign({}, a, { firstVisit: firstVisitOf(firstVisit, a.firstVisit), gave: !!a.gave });   // gave: 칭호를 계정 날짜로 받음 (도감일지에 그 날짜를 보여 줌) · reward(P20-16)는 그대로
  st.journal = st.journal || { done: {} }; st.titles = st.titles || {};
  if (st.titles.t_visit != null) return false;
  const cal = calendar(st.virtual);
  if (st.journal.done.c0_visit == null) st.journal.done.c0_visit = cal.abs;
  giveTitle(st, 't_visit', cal, ctx, true); st.account.gave = true;
  addLog(st, 11, '☁️ 계정의 첫 방문 날짜로 「정원 문을 연 사람」을 이어 붙였어요', ctx);
  return true;
}
// P20-16 구름 정원사 (10-27): 처음 로그인해 드라이브와 맞춘 정원에 덤 칭호 + 구름 돌. 얻는 연출은 계정마다 한 번
//  has: 이 정원이 이미 받음 · rewardedAt: 계정이 처음 받은 때(드라이브 · 이 기기 기록, 모르면 null)
//  → { give: 이 정원에 줄지, show: 얻는 연출을 띄울지 } — 이미 받은 계정이면 새 기기 · 다시 시작한 정원에 조용히 이어 붙임
const cloudRewardPlan = (has, rewardedAt) => ({ give: !has, show: !has && !rewardedAt });
// 정원에 줌 (돈 · 씨앗은 주지 않음). 줬으면 { at: 계정이 받은 때(처음이면 now), show }, 이 정원이 이미 받았으면 null
function giveCloudReward(st, rewardedAt, now, ctx) {
  st.titles = st.titles || {};
  const p = cloudRewardPlan(st.titles.t_cloud != null, rewardedAt);
  if (!p.give) return null;
  giveTitle(st, 't_cloud', calendar(st.virtual), ctx, !p.show);         // 연출 · 일지 🏅는 처음 받는 계정에서만
  if (!(st.decos || []).some(d => d.key === 'cloudstone')) addDeco(st, 'cloudstone');
  addLog(st, p.show ? 9 : 11, p.show ? '도감에 등록: 🪴 구름 돌' : '☁️ 계정에서 받은 「구름 정원사」와 구름 돌을 이 정원에도 이어 붙였어요', ctx);
  const at = rewardedAt || now;
  st.account = Object.assign({}, st.account || {}, { reward: at });
  return { at, show: p.show };
}
// P20-07 앱 안 브라우저 (사용자 에이전트 → 종류). 구글 로그인은 앱 안 웹뷰에서 막힘(disallowed_useragent)
const IN_APPS = [['kakao', /KAKAOTALK/i], ['instagram', /Instagram/i], ['facebook', /FBAN|FBAV|FB_IAB/i], ['line', /\bLine\//i], ['naver', /NAVER\(inapp/i],
  ['daum', /DaumApps/i], ['everytime', /everytimeApp/i], ['google', /\bGSA\//], ['webview', /; wv\)/]];
function inAppBrowser(ua) {
  ua = ua || '';
  const hit = IN_APPS.find(([, re]) => re.test(ua));
  if (!hit) return null;
  return { app: hit[0], os: /Android/i.test(ua) ? 'android' : /iP(hone|ad|od)/.test(ua) ? 'ios' : 'other' };
}
// 바깥 브라우저로 같은 주소 열기: 카카오톡은 자기 주소, 안드로이드는 Chrome intent, 그 밖은 null(메뉴 안내 · 주소 복사)
function outsideUrl(href, info) {
  if (!info) return null;
  const url = String(href).split('#')[0];
  if (info.app === 'kakao') return 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  const m = url.match(/^(https?):\/\/(.*)$/);
  if (info.os === 'android' && m) return `intent://${m[2]}#Intent;scheme=${m[1]};package=com.android.chrome;end`;
  return null;
}

const api = {
  DAILY_GIFT, HOUR, W, H, MONTHS, josa, SEASONS, MONTH_H, monthName, calendar, calendarAfterFlow, untilMonth, yearOf, canReset,
  FLOWERS, FLOWER_KEYS, FORM, LIFE, LANDS, LAND_KEYS, LIFE_MIN, classify, landOf, landCounts,
  stars, pct, germOf, qualityRadius, stageRadius, STAGE, computeStage, landMatch, vigorOf, monthlyChange,
  teaShopOpen, hoursToShopOpen, CUP_SELL_H, SEATS, CUP_SETS, SIGNS, shopOf, cupSellH, addSeat, buyDecor, autoSell, bagBlends, brew, sellCups, cupValue, cupCold, COLD_RATE, propCount, teaValue, teaItemValue, isHat, makeRaw, HAT_RATE, RAW_RATE, RAW_DECAY, isFresh, seasonKey, reservationPrice, deliverIdxOf, reservedCount, cartSummary,
  create, advance, addLog, compostable, compostItems, autoCompost, COMPOST_Q, TOOLS, canCare, harvestSlot, canMoveNow, propGrown, propYearOf, care, buy, buySupply, SUPPLIES, reserve, plant, propagate, move, makeTea, sellTea,
  flowerAt, dexCount, DEX_TOTAL, dexTotal, blendKeys, CHAPTERS, QUESTS, TITLES, TITLE_KEYS, EXTRA_TITLE_KEYS, chapterOpen, chapterDone, checkJournal, setTitleOn, newGardenId, saveSummary, makeSave, parseSave, SAVE_FORMAT, MIGRATIONS, migrateSave, CLOUD_GAP, cloudDue, cloudAutoOk, cloudTokenUse, cloudDecide, firstVisitOf, applyAccount, cloudRewardPlan, giveCloudReward, inAppBrowser, outsideUrl, DECOS, DECO_KEYS, EXTRA_DECO_KEYS, decoInfo, decoTotal, decoCount, decoExtras, decoOffer, decoAt, buyDeco, placeDeco, storeDeco, decoMonths, firstFlower, questName, questWhenOf, GIFT_BY_MONTH, giftPot, MINE_W, MINE_H, MINE_MAX_E, MINE_REGEN_H, MINE_DEEPEST, ORES, FOSSILS, ORE_KEYS, FOSSIL_KEYS, MINE_DEX_KEYS, mineName, mineOf, mineRegen, dig, descend, mineUp, toDeepest, freshBoard, CRAFTS, CRAFT_KEYS, canCraft, craft, mineCount, GIFTS, GIFT_KEYS, LETTERS, LETTER_KEYS, letterCount, giftsOf, sendGift, deliverLetters, letterLeftFor, RETURNS, RETURN_V, RETURN_WHERE, pickReturn, giveReturn, returnValue, returnName, returnText, returnEV, letterOf, MEMENTOS, MEMENTO_KEYS, mementoCount, orderText, orderMatch, makeOrders, fillOrder, yearScore, HONEY_R, HIVE_MAX, HONEY_KEYS, honeyName, hiveBlooms, honeyOf, hiveTick, takeHoney, honeyCup, honeyCount, BARREL_R, barrelTick, GEAR, growRate, DRY_H, BLENDS, BLEND_KEYS, BLEND_RATE, RECIPE_RATE, blendRate, blendRecipe, blendValue, dryPetals, makeTeaDried, blend, sellBlends,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
