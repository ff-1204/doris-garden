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
// P28-06 효율 정보 표 (10-28): 꽃마다 셈 — 값은 모두 FLOWERS · teaItemValue · classify에서 계산하고 숫자를 따로 적지 않음
const HARVEST_PETALS = 1;                        // P12-05 수확 한 번에 꽃잎 1장 (care가 이 수만큼 거둠)
const ECON_Q = [0.1, 0.3, 0.5, 0.7, 0.9];        // ★1~★5 칸의 가운데 품질 — 대표값은 ★3
// 다 자란 한 포기가 한 해에 거두는 수: 피는 달마다 한 번 + 마지막 흐르는 달(2월)에 핀 채 꽃잠에 들면 꽃잠에 한 번 더 (harvestSlot)
const harvestsPerYear = F => F.bloom.length + (F.bloom.includes(MONTHS[MONTHS.indexOf(13) - 1]) ? 1 : 0);
function flowerEconomy(by) {
  const rows = FLOWER_KEYS.map((key, i) => {
    const F = FLOWERS[key], star = ECON_Q.map(q => teaItemValue(null, { type: key, q, hat: isHat(q) }));
    const harvests = harvestsPerYear(F), tea = star[2];
    return { key, i, name: F.name, life: F.life, price: F.price, mature: F.mature, bloom: F.bloom.length, bloomMonths: F.bloom.slice(), harvests, petals: HARVEST_PETALS,
      tea, star, income: harvests * HARVEST_PETALS * tea, land: classify(F.t, F.m) };
  });
  const cmp = { income: (a, b) => b.income - a.income, price: (a, b) => a.price - b.price, mature: (a, b) => a.mature - b.mature }[by];
  return cmp ? rows.sort((a, b) => cmp(a, b) || a.i - b.i) : rows;
}

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
    log: [], records: [], yearLog: [], yearNow: newYearNow(), yearPace: Object.assign(newYearPace(0), { now: Array.from({ length: yearMonth(cal) }, () => [0, 0]) }), yearBest: null, helpYear: null, nextId: 1,   // P28-07-01 해마다 기록 · 올해 쌓는 중 · P28-07-02 달마다 쌓인 값 (시작 전 달은 0)
    settings: { toast: { 3: true, 8: true, 9: true }, sleep: { on: true, from: 23, to: 7 }, marks: { water: true, weed: true, prune: true, fert: true }, slow: false },   // slow: P28-02 느긋하게 보기
    onboarded: false, _fertNew: 0, _bloomNew: {},
    journal: { done: {} }, titles: {}, titleOn: null, stats: {}, grade: newGrade(), gardenId: newGardenId(), lastExport: null, mig: MIGRATIONS.length,   // P19 도감일지 · P20 이름표 · 마지막 파일 저장 · mig: 예전 저장 보정을 어디까지 했는지(새 정원은 다 한 것)
    shop: newShop(), decos: [], honey: {}, gift: null, firstFlower: null, mine: newMine(), orders: null, bestScore: 0, gifts: null, letterPending: [], letterBox: [], pantry: newPantry(), restClosed: null, account: null, actAt: null, resetAt: null, weekly: null, firstGuest: null, mailGot: {}, layers: newLayers(), yearly: newYearly(), visitors: newVisitors(), bonus: newBonus(), season: Object.assign(newSeason(), { startedAt: now }),   // P28-08-03 🌸 새 철 · P28-05-02 🌟 고른 등급 보너스 · P29 📮 운영자 편지 받은 기록 · P22-05 🍵 첫 손님 한 번 (꾸러미를 받으면 true) · P28-09 이번 주 목표 · P16-12-03 처음부터 다시 시작한 때 · P20-08 계정 기록 · P20-06 마지막으로 손댄 때 · P24 광산 · P17-15 찻집 가꾸기 · P17-16 장식 · P18 꿀 · P22 이웃의 화분 · 1장 첫 꽃
  };
}
const nid = st => st.nextId++;
const inGarden = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < W && y < H;   // 정원의 한 칸 (10-24)
const plantUnit = F => F.life === 'tree' || F.form === 'sapling' ? '그루' : '포기';   // P16-02-05 세는 말: 나무 · 묘목은 그루
const unitOf = fs => fs.length && fs.every(f => plantUnit(FLOWERS[f.type]) === '그루') ? '그루' : '포기';

// ---------------------------------------------------------------- 알림 (P11)
const TOAST_TYPES = [3, 8, 9];                   // P11-02-01-a
// P28-02 🐢 느긋하게 보기 (10-27): 켜면 퀘스트 띠 · 주문 쪽지 · 점수 · 칭호 연출을 숨김. 얻는 규칙은 그대로, 보이는 것만
// 새 숫자 · 목표 화면(정원 등급 · 그래프 · 주간 목표 · 효율 표 …)은 이 함수를 따른다 — 숨길지 여기 하나만 봄
const slowView = st => !!(st && st.settings && st.settings.slow);
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
  if (st._rackBagNew > 0) { addLog(st, 12, `자동 건조대에서 꽃잎 ${st._rackBagNew}장이 말라 티백이 됐어요`, ctx); st._rackBagNew = 0; }   // P28-10-02
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
    if (dtH > 0) helperTick(st, cal);                                  // P28-10-03 찻집 일손이 카운터를 채움 (팔기 바로 앞)
    if (dtH > 0) autoSell(st, cal, dtH, ctx);                          // P17-11 카운터 찻잔은 꽃잠에도 팔림
    if (dtH > 0) mineRegen(st, dtH);                                   // P24 광산 기력 (꽃잠에도)
    if (!cal.frozen && dtH > 0) pantryTick(st, cal, dtH);              // P28-04 정원 저장고 (꽃잠엔 멈춤)
    st.virtual = next;
    const nc = calendar(st.virtual);
    if (nc.abs !== st.lastAbs) { st.lastAbs = nc.abs; onSlot(st, nc, ctx); }
  }
  flushPending(st, ctx);
  { const c = calendar(st.virtual); if (teaShopOpen(c) && (!st.orders || st.orders.abs !== c.abs)) makeOrders(st, c); }   // P23-01 찻집이 열린 채로 시작 · 열어도 그 달 쪽지 (QA 5회차)
  checkLands(st, ctx);
  checkHelp(st, calendar(st.virtual), ctx);
  checkJournal(st, ctx);
  gradeDexSync(st, ctx);                                               // P28-05-01 늘어난 도감 칸
  weeklyOf(st);                                                        // P28-09 이번 주 목표 (처음 · 3주 넘게 건너뛴 뒤에도)
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
      if (d.auto) { rackBag(st, d, ctx); continue; }                            // P28-10-02 자동 건조대가 넌 꽃잎은 다 마르면 바로 티백
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
  if (st._helperBrew) { addLog(st, 13, `찻집 일손이 찻잔 ${st._helperBrew}잔을 우렸어요`, ctx); st._helperBrew = 0; }   // P28-10-03 달마다 한 줄 (잔마다 남기면 일지가 넘침)
  if (cal.idx === 0) weeklyOf(st);                                             // P28-09 월요일 아침 6시: 이번 주 목표 (지난 주 것은 벌칙 없이 사라짐)
  const ended = calendar(st.virtual - 1000);
  if (!ended.frozen) { hiveTick(st, ctx); const nb = barrelTick(st); if (nb) addLog(st, 16, `빗물 통이 꽃 ${nb}포기에 물을 줬어요`, ctx); basketTick(st, ended, ctx); rackTick(st, ctx); }   // P28-10 자동 장치 (바구니가 거둔 꽃잎을 건조대가 바로 넒)
  if (teaShopOpen(cal)) { makeOrders(st, cal); if (!slowView(st)) addLog(st, 15, '찻집에 새 주문 쪽지가 왔어요', ctx); }   // P23-01 · 느긋하게 보기면 쪽지 소식은 남기지 않음 (P28-02)
  else if (st.orders) st.orders = null;   // P18 벌통 · P25 빗물 통: 끝난 달이 꽃잠이 아니면
  // 시든 한해살이는 다음 달에 사라지며 비료 1개 (P07-02)
  st.flowers = st.flowers.filter(f => { if (f.withered && cal.abs > f.witherAbs) { addFert(st, 1); return false; } return true; });
  paceMark(st, cal);                                                            // P28-07-02 끝난 달까지 쌓인 수입 · 경험치 (기록 앞에)
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
  if (cal.idx === 0) layerCheck(st, ctx); else layerSync(st);                 // P30-01-01 새 층은 새해 3월 아침에만 · 1~3층 연 해는 달마다 적음
  yearlyTick(st, cal, ctx, !!(ctx && ctx.live));                              // P30-05-01 올해만 오는 것: 새 계절 일지 한 줄 · 끝난 계절 놓침 · 열어 둔 채면 봤음 (쉼달 기록 뒤 — 꽃잠은 다음 해 번호)
  visitorTick(st, cal, ctx);                                                   // P30-06-01 특별 손님: 떠남 · 새로 옴 (올해만 것 본 뒤라 그 조건을 바로 읽음)
}

function recordYear(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx); gradeDexSync(st, ctx);                              // P28-05-01 늘어난 도감 칸은 기록 앞에
  const sc = yearScore(st), prevBest = st.bestScore || 0;   // P23-02 한 해 정원 평가
  const rec = { year: yr, season: seasonN(st), counts: landCounts(st), best: st.yearBest, dex: dexCount(st), dexTotal: dexTotal(st), titleOn: st.titleOn || null, log: st.log.slice(), snapshot: null, score: sc.total, scoreParts: sc.parts, orders: sc.orders, giftsTotal: sc.giftsTotal, prevBest };
  const row = yearRow(st, rec, sc); addYearLog(st, row);                      // P28-07-01
  st.yearNow = newYearNow();
  st.bestScore = Math.max(prevBest, sc.total);
  st.yearSeen = { bloom: {}, blend: {}, honey: {} };   // 새해에 다시
  st.records.unshift(rec);
  st.records = st.records.slice(0, 10);
  if (ctx && ctx.onRecord) ctx.onRecord(rec);
  st.log = [];                                                                // P11-02-04-e: 쉼달에 초기화
  st.yearBest = null;
  addLog(st, 7, `${yr}년차 정원을 기록했어요${slowView(st) ? '' : ` · 🏅 정원 점수 ${sc.total}점${sc.total > prevBest && prevBest ? ' · 최고 기록!' : ''}`}`, ctx);   // 점수는 기록(rec)에는 남기고 일지 줄에서만 뺌 (P28-02)
  addLog(st, 4, '다음 해 꽃을 예약할 수 있어요', ctx);
  addXp(st, 'year', yearXpOf(sc), ctx); row.grade = gradeOf(st).grade;        // P28-05-01 한 해 평가도 등급 경험치로 — 오른 줄은 새해 일지에, 해마다 기록의 grade는 그 뒤 등급
  const p = st.yearPace || {};                                                // P28-07-02 올해 달마다 쌓인 값 → 지난해로 (한 해 평가 경험치는 어느 해에도 넣지 않음)
  st.yearPace = Object.assign(newYearPace((st.grade && st.grade.xp) || 0), p.xp0 != null ?{ last: p.now || [], lastYear: yr } : {});
}

// ---------------------------------------------------------------- 📈 해마다 기록 (P28-07-01, 10-27)
// 쉼달 기록 때 그해 한 줄: 판매 수입(원) · 판 잔 수 · 거둔 꽃잎 · 들어준 주문 · 정원 점수 · 등급(M1-3에서 채움) · 도감. 기록과 기록 사이(꽃잠 + 새해)를 한 해로 셈 — 주문 · 선물 점수와 같은 기준
// 용돈 · 막힘 방지 돈은 수입에 넣지 않음 (번 돈만). 그래프(M1-5) · 등급(M1-3)은 yearLogOf만 읽음
const newYearNow = () => ({ income: 0, sold: 0, harvest: 0 });
function yearAdd(st, k, n) { const y = st.yearNow = st.yearNow || newYearNow(); y[k] = (y[k] || 0) + n; }
function yearRow(st, rec, sc) {
  const y = st.yearNow || newYearNow();
  const row = { year: rec.year, season: rec.season || seasonN(st), income: y.income, sold: y.sold, harvest: y.harvest, orders: sc.parts.orders / 5, score: sc.total, grade: gradeOf(st).grade, dex: rec.dex, dexTotal: rec.dexTotal };   // season: P28-08-04 철 구분 (해 번호는 철마다 1부터)
  if (y.part) row.part = true;   // 업데이트한 해: 업데이트 전 판매 · 수확은 못 셈
  return row;
}
const rowSeason = r => r.season || 1;
function addYearLog(st, row) {   // 같은 철 같은 해는 한 줄만 (나중 것으로), 철 · 해 순서대로
  st.yearLog = (st.yearLog || []).filter(r => !(r.year === row.year && rowSeason(r) === rowSeason(row)));
  st.yearLog.push(row);
  st.yearLog.sort((a, b) => rowSeason(a) - rowSeason(b) || a.year - b.year);
}
const yearLogOf = st => (st.yearLog || []).map(r => Object.assign({}, r));

// ---------------------------------------------------------------- 📈 해마다 그래프 (P28-07-02, 10-28)
// 화면(도감 "해마다" 쪽 · 한 해 기록 카드)은 아래 함수만 읽음. 느긋하게 보기면 숫자 · 견줌은 화면이 숨김 (P28-02)
// 한 해 = 쉼달(idx 12)부터 다음 쉼달까지 → 그해 몇째 달인지 0(쉼달) ~ 13(2월)
const yearMonth = cal => (cal.idx + 2) % 14;
// yearPace = { xp0: 올해 시작할 때 경험치(null이면 올해는 모름), now: [달마다 끝날 때 [수입, 경험치]], last: 지난해 것, lastYear }
const newYearPace = xp0 => ({ xp0, now: [], last: null, lastYear: null });
function paceMark(st, cal) {   // 달이 바뀔 때: 끝난 달(그해 몇째 달)까지 쌓인 값. 업데이트한 해의 수입은 모름(null)
  const p = st.yearPace; if (!p || p.xp0 == null) return;
  const y = st.yearNow || newYearNow(), ended = (yearMonth(cal) + 13) % 14;
  p.now = p.now || [];
  while (p.now.length < ended) p.now.push(null);
  p.now[ended] = [y.part ? null : y.income, ((st.grade && st.grade.xp) || 0) - p.xp0];
}
// 축: 0부터, 눈금 ticks칸이 1 · 2 · 2.5 · 5 × 10ⁿ 간격으로 가장 큰 값을 덮게. 값이 없거나 모두 0이면 top 0 (빈 축)
function graphAxis(values, ticks) {
  const n = ticks || 4, vs = (values || []).filter(v => typeof v === 'number' && isFinite(v) && v > 0), max = vs.length ? Math.max(...vs) : 0;
  if (!max) return { top: 0, step: 0, ticks: [0] };
  const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
  const step = Math.max(1, (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag);   // 정수 값(점수 · 잔 · 원)이라 1보다 작게 자르지 않음
  const top = step * Math.ceil(max / step - 1e-9), out = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return { top, step, ticks: out };
}
// 그래프에 보일 해: 해가 많으면 n해(기본 10)씩. end = 보일 마지막 해의 자리(없으면 가장 최근). 0~1해면 empty
function graphYears(st, n, end) {
  const all = yearLogOf(st), size = n || 10, total = all.length;
  const last = end == null ? total - 1 : Math.max(Math.min(size, total) - 1, Math.min(total - 1, end));
  const from = Math.max(0, last - size + 1);
  return { rows: all.slice(from, last + 1), from, end: last, total, prev: from > 0, next: last < total - 1, empty: total < 2 };
}
// 지난해와 견줌: 수입은 %(지난해가 0 · 모름 · 일부만이면 null), 점수 · 등급은 차이
function yearDiff(cur, prev) {
  if (!cur || !prev) return null;
  const ok = v => typeof v === 'number';
  const income = ok(cur.income) && ok(prev.income) && prev.income > 0 && !cur.part && !prev.part ? Math.round((cur.income - prev.income) / prev.income * 100) : null;
  const score = ok(cur.score) && ok(prev.score) ? cur.score - prev.score : null;
  const grade = ok(cur.grade) && ok(prev.grade) ? cur.grade - prev.grade : null;
  return income == null && score == null && grade == null ? null : { year: cur.year, prevYear: prev.year, income, score, grade };
}
// 그해 기록 줄의 바로 앞 해와 견줌 (해가 비면 견주지 않음)
// P28-08-04 철을 넘어서는 견주지 않음 (season을 안 주면 지금 철)
const yearDiffOf = (st, year, season) => { const n = season || seasonN(st), all = yearLogOf(st), i = all.findIndex(r => r.year === year && rowSeason(r) === n); return i > 0 && all[i - 1].year === year - 1 && rowSeason(all[i - 1]) === n ? yearDiff(all[i], all[i - 1]) : null; };
// 올해 지금까지 vs 지난해 같은 때 (05-6 "어제보다 큰 숫자"): 지난해 같은 달 안 같은 자리까지를 달 끝 값 사이로 어림. 모르면 그 칸은 null, 둘 다 없으면 null
function yearPace(st, cal) {
  const p = st.yearPace, c = cal || calendar(st.virtual);
  if (!p || p.xp0 == null || !p.last || p.lastYear !== propYearOf(st, c) - 1) return null;
  const m = yearMonth(c), f = clamp((c.yh - c.idx * SLOT_H) / SLOT_H, 0, 1);
  const a = m === 0 ? [0, 0] : p.last[m - 1], b = p.last[m];
  const at = i => a && b && a[i] != null && b[i] != null ? Math.round(a[i] + (b[i] - a[i]) * f) : null;
  const y = st.yearNow || newYearNow(), nowIncome = y.part ? null : y.income || 0, nowXp = ((st.grade && st.grade.xp) || 0) - p.xp0;
  const pair = (now, then) => now == null || then == null ? null : { now, then, diff: now - then };
  const income = pair(nowIncome, at(0)), xp = pair(nowXp, at(1));
  return income || xp ? { year: propYearOf(st, c), month: m, income, xp } : null;
}

// ---------------------------------------------------------------- 🌱 정원 등급 (P28-05-01, 10-27)
// 정원에서 한 일로 경험치가 쌓이고 등급이 오름 — 처음엔 빨리, 뒤로 갈수록 천천히, 끝이 없음. 돈을 주고 사는 것(씨앗 · 용품 · 장식 · 찻집 가꾸기 · 선물)만으로는 오르지 않음 (P17-14)
// 느긋하게 보기(P28-02)여도 똑같이 쌓임 — 숨김은 화면 몫. 등급 보너스는 M3(P28-05-02)
const XP = { harvest: 2, sell: 2, order: 15, quest: 10, dex: 5, year: 1, weekly: 1 };   // 꽃잎 한 장 · 판 잔 하나 · 주문 · 퀘스트 · 도감 새 칸 · 한 해 평가 점수 1점 · 주간 목표(P28-09) 1점
const GRADE_TIERS = ['씨앗', '새싹', '꽃봉오리', '꽃', '열매', '나무', '숲'];        // 5등급마다 다음 이름, 숲 정원은 끝없이 (숲 정원 1, 2, …)
const gradeCost = g => 40 + 10 * Math.min(g - 1, 19) + 3 * Math.max(0, g - 20);   // g등급 → g+1등급에 드는 경험치 (20등급부터는 조금씩만 늘어 끝없이 오름)
const gradeName = g => { const t = Math.min(GRADE_TIERS.length - 1, Math.floor((g - 1) / 5)); return `${GRADE_TIERS[t]} 정원 ${g - t * 5}`; };
const newGrade = () => ({ xp: 0, dex: null, by: {} });   // dex: 경험치로 센 도감 칸 수 (null이면 다음 확인 때 지금 수로 맞춤)
function gradeAt(xp) {
  let g = 1, base = 0;
  while (xp >= base + gradeCost(g)) { base += gradeCost(g); g++; }
  return { grade: g, base, cost: gradeCost(g) };
}
function gradeOf(st) {
  const xp = (st && st.grade && st.grade.xp) || 0, a = gradeAt(xp);
  return { grade: a.grade, name: gradeName(a.grade), xp, next: a.base + a.cost, progress: (xp - a.base) / a.cost };
}
// 등급 경험치로 세는 도감 칸: 도감 93칸에서 씨앗 · 묘목(사기만 해도 생김)은 빼고 + 꿀 · 광산. 기념품은 주문으로, 편지 · 장식은 돈으로 생겨서 뺌
const gradeDexCount = st => dexCount(st) - n0(st.dex.form) + n0(st.dex.honey) + n0(st.dex.mine);
function addXp(st, kind, n, ctx) {
  if (!XP[kind] || !(n > 0)) return { xp: 0, up: 0 };
  const g = st.grade = st.grade || newGrade(), before = gradeAt(g.xp).grade, add = Math.round(XP[kind] * n);
  g.xp += add; g.by[kind] = (g.by[kind] || 0) + add;
  const after = gradeAt(g.xp).grade;
  if (after > before) {
    const name = gradeName(after), unlock = GRADE_DECO_KEYS.filter(k => DECOS[k].grade > before && DECOS[k].grade <= after);
    if (!slowView(st)) addLog(st, 9, gradeUpText(name));   // 알림은 화면이 onGrade로 (M1-4), 느긋하게 보기면 일지에도 숫자를 남기지 않음 (P28-02)
    for (const k of unlock) addLog(st, 9, gradeUnlockText(k));   // 등급 장식이 화원에 — 숫자가 없어 느긋하게 보기여도 남김 (M1-4)
    if (ctx && ctx.onGrade) ctx.onGrade({ from: before, grade: after, name, unlock });
  }
  return { xp: add, up: after - before };
}
function gradeDexSync(st, ctx) {   // advance 끝에: 늘어난 도감 칸만큼
  const g = st.grade = st.grade || newGrade(), c = gradeDexCount(st);
  if (g.dex == null || c < g.dex) { g.dex = c; return; }
  if (c > g.dex) { const d = c - g.dex; g.dex = c; addXp(st, 'dex', d, ctx); }
}
const yearXpOf = sc => Math.max(0, sc.total - (sc.parts.decos || 0) - (sc.parts.gifts || 0));   // 한 해 평가 점수에서 장식 · 선물 몫(돈으로 사는 것)은 뺌
// 🌱 등급 화면 (P28-05-01, M1-4 10-28): 화면은 이것만 읽음. 숨길지는 slowView 하나 — 경험치 · 등급 · 장식은 그대로
const gradeUpText = name => `🌱 정원 등급이 올랐어요 · ${name}`;
const gradeUnlockText = ks => { const names = [].concat(ks).map(k => DECOS[k].name); return `🪴 화원에 ${names.slice(0, -1).map(x => x + ' · ').join('')}${josa(names[names.length - 1], '이/가')} 들어왔어요`; };   // 하나 또는 여럿 (한 줄로)
const GRADE_BY = [['harvest', '🧺', '거두기'], ['sell', '💰', '팔기'], ['order', '💌', '주문'], ['quest', '📜', '퀘스트'], ['dex', '📖', '도감'], ['year', '🏅', '한 해 평가'], ['weekly', '🗓️', '주간 목표']];
const gradeXpAt = g => { let x = 0; for (let i = 1; i < g; i++) x += gradeCost(i); return x; };   // g등급이 되는 누적 경험치
function gradeView(st) {   // 도감 등급 쪽: 지금 등급 · 남은 양 · 어디서 왔는지 · 등급 장식 (느긋하게 보기면 slow: true → 숫자를 줄여 보여 줌)
  const g = gradeOf(st), by = (st.grade && st.grade.by) || {};
  const sources = GRADE_BY.filter(([k]) => k !== 'weekly' || by[k] > 0).map(([k, ic, label]) => ({ k, ic, label, xp: by[k] || 0 }));   // 주간 목표는 생기면(P28-09)
  const decos = GRADE_DECO_KEYS.map(k => ({ key: k, name: DECOS[k].name, grade: DECOS[k].grade, open: DECOS[k].grade <= g.grade }));
  const nextDeco = decos.find(d => !d.open) || null;
  return Object.assign(g, { left: g.next - g.xp, slow: slowView(st), sources, decos, nextDeco, nextDecoLeft: nextDeco ? gradeXpAt(nextDeco.grade) - g.xp : 0 });
}
const gradeBadge = st => slowView(st) ? null : (g => ({ grade: g.grade, name: g.name, pct: Math.floor(g.progress * 100) }))(gradeOf(st));   // 위 막대 (느긋하게 보기면 없음)
const gradeAlerts = (st, e) => slowView(st) || !e ? [] : [gradeUpText(e.name), ...(e.unlock && e.unlock.length ? [gradeUnlockText(e.unlock)] : [])];   // 오를 때 알림 줄 (onGrade 이벤트로) — 등급 한 줄 + 열린 장식 한 줄
function gradeAwayLine(st, from) {   // "자리를 비운 동안" 한 줄 (P25-01): 그동안 오른 등급을 하나로
  const to = gradeOf(st).grade;
  return slowView(st) || from == null || to <= from ? null : `🌱 정원 등급이 올랐어요 · ${gradeName(from)} → ${gradeName(to)}`;
}
const isGradeUpLine = t => typeof t === 'string' && t.startsWith('🌱 정원 등급이 올랐어요');

// ---------------------------------------------------------------- 🗓️ 주마다 바뀌는 목표 (P28-09, 10-28)
// 월요일 아침 6시(정원 3월 = 새해)마다 쉬움 · 보통 · 어려움 하나씩 3개. 뽑기는 정원 이름표 + 주로 정하고 뽑은 것은 저장 → 같은 주엔 다시 열어도 같음
// 그 정원이 연 기능에서만 고름(광산을 판 적 없으면 광산 목표 없음 …). 그 주 안 언제든(꽃잠에도) 끝내면 되고, 못 끝낸 목표는 벌칙 없이 사라짐
// 보상은 등급 경험치만(addXp 'weekly') — 돈 · 용품은 주지 않음 (P17-14). 셋 다 끝낸 덤도 경험치: 용품은 돈과 같아 경제를 흔들고,
// 그 주에만 얻는 장식은 몰아서 하는 사람(10 이현)에게 놓치면 영영 못 얻는 벌칙이 되어서
// 느긋하게 보기(P28-02)여도 진행 · 보상은 그대로, 일지 줄 · 알림만 남기지 않음 (목표 줄을 숨기는 건 화면 몫)
const WEEKLY_TIERS = ['쉬움', '보통', '어려움'];
const WEEKLY_XP = [20, 40, 80], WEEKLY_BONUS = 40;   // 끝내면 등급 경험치 (어려울수록 많이) · 셋 다 끝낸 덤
// 목표 종류: tier 0 쉬움 · 1 보통 · 2 어려움 · ev 어떤 일에 오르는지 · fam 같은 주에 한 번만(같은 일을 두 줄로 내지 않게) · open 그 정원이 연 기능인지
const hasHive = st => (st.decos || []).some(d => d.key === 'hive' && d.x != null);
const aliveTypes = st => { const c = {}; for (const f of st.flowers || []) if (!f.withered) c[f.type] = (c[f.type] || 0) + 1; return c; };
const WEEKLY = {
  water: { tier: 0, ic: '💧', n: 15, ev: 'care', fam: 'water', match: (g, i) => i.tool === 'water', text: g => `꽃에 물 ${g.n}번 주기`, open: () => true },
  petal: { tier: 0, ic: '🧺', n: 15, ev: 'harvest', fam: 'petal', text: g => `꽃잎 ${g.n}장 거두기`, open: () => true },
  dry: { tier: 0, ic: '🌾', n: 10, ev: 'dry', fam: 'dry', text: g => `꽃방에 꽃잎 ${g.n}장 널기`, open: st => n0(st.dex.petal) > 0 },
  cup: { tier: 0, ic: '☕', n: 10, ev: 'sell', fam: 'cup', text: g => `찻잔 ${g.n}잔 팔기`, open: st => n0(st.dex.teabag) > 0 },
  dig: { tier: 0, ic: '⛏️', n: 20, ev: 'dig', fam: 'dig', text: g => `광산 ${g.n}칸 파기`, open: st => S(st, 'dug') > 0 },
  tidy: { tier: 1, ic: '🌿', n: 12, ev: 'care', fam: 'tidy', match: (g, i) => i.tool === 'weed' || i.tool === 'prune', text: g => `잡초 뽑기 · 가지치기 ${g.n}번`, open: () => true },
  star4: { tier: 1, ic: '⭐', n: 10, ev: 'harvest', fam: 'petal', match: (g, i) => stars(i.q) >= 4, text: g => `★4 이상 꽃잎 ${g.n}장 거두기`, open: () => true },
  teabag: { tier: 1, ic: '🍵', n: 15, ev: 'teabag', fam: 'teabag', text: g => `티백 ${g.n}개 만들기`, open: st => n0(st.dex.petal) > 0 },
  order: { tier: 1, ic: '💌', n: 4, ev: 'order', fam: 'order', text: g => `손님 주문 ${g.n}장 들어주기`, open: st => S(st, 'orders') > 0 },
  recipe: { tier: 1, ic: '🫖', n: 3, ev: 'blend', fam: 'blend', match: (g, i) => !!i.recipe, text: g => `이름 있는 블렌드 ${g.n}잔 만들기`, open: st => n0(st.dex.blend) > 0 },
  prop: { tier: 1, ic: '🌱', n: 2, ev: 'prop', fam: 'prop', text: g => `번식 ${g.n}번 하기`, open: st => (st.flowers || []).some(f => !f.withered && FLOWERS[f.type].prop !== '채종') },   // 한해살이는 시들 때 저절로라 뺌
  stairs: { tier: 1, ic: '🪜', n: 3, ev: 'descend', fam: 'dig', text: g => `광산 계단 ${g.n}번 내려가기`, open: st => !!st.mine && st.mine.deepest >= 2 },
  star5: { tier: 2, ic: '🌟', n: 5, ev: 'harvest', fam: 'petal', match: (g, i) => i.type === g.type && stars(i.q) >= 5, text: g => `★5 ${FLOWERS[g.type].name} 꽃잎 ${g.n}장 거두기`, open: st => n0(aliveTypes(st)) > 0,
    pick: (st, rnd) => { const c = aliveTypes(st), ks = Object.keys(c).sort(), type = ks[Math.floor(rnd() * ks.length)]; return { type, n: Math.max(2, Math.min(5, 2 * c[type])) }; } },   // 정원에 있는 꽃에서 · 포기가 적으면 장 수도 적게
  blends: { tier: 2, ic: '🫖', n: 3, ev: 'sell', fam: 'cup', match: (g, i) => i.cup.kind === 'blend', distinct: i => i.cup.recipe || i.cup.parts.slice().sort().join('+'), text: g => `블렌드 차 ${g.n}종 팔기`, open: st => S(st, 'blendCups') > 0 },
  hat: { tier: 2, ic: '🍃', n: 5, ev: 'sell', fam: 'cup', match: (g, i) => !!i.cup.hat, text: g => `햇차 ${g.n}잔 팔기`, open: st => S(st, 'hatCups') > 0 },
  honey: { tier: 2, ic: '🍯', n: 3, ev: 'honey', fam: 'honey', text: g => `벌통 꿀 ${g.n}병 거두기`, open: hasHive },
  digs: { tier: 2, ic: '⛏️', n: 60, ev: 'dig', fam: 'dig', text: g => `광산 ${g.n}칸 파기`, open: st => S(st, 'dug') >= 20 },
  cups: { tier: 2, ic: '☕', n: 40, ev: 'sell', fam: 'cup', text: g => `찻잔 ${g.n}잔 팔기`, open: st => S(st, 'cups') >= 20 },
  orders: { tier: 2, ic: '💌', n: 8, ev: 'order', fam: 'order', text: g => `손님 주문 ${g.n}장 들어주기`, open: st => S(st, 'orders') >= 5 },
  petals: { tier: 2, ic: '🧺', n: 40, ev: 'harvest', fam: 'petal', text: g => `꽃잎 ${g.n}장 거두기`, open: () => true },
};
const WEEKLY_KEYS = Object.keys(WEEKLY);
const weeklyText = g => WEEKLY[g.k].text(g);
function weeklyRoll(st, cal) {   // 이번 주 목표 3개 (어려움부터 뽑아 같은 fam은 한 번 — 고를 게 적은 쪽이 먼저, 보여 줄 땐 쉬움 → 어려움)
  const prev = st.weekly || {}, rnd = mineRng(hashStr(`${st.gardenId || 'g'}|weekly|${cal.week}`)), goals = [], fams = [];
  for (let t = 2; t >= 0; t--) {
    const ks = WEEKLY_KEYS.filter(k => WEEKLY[k].tier === t && !fams.includes(WEEKLY[k].fam) && WEEKLY[k].open(st));
    if (!ks.length) continue;
    const k = ks[Math.floor(rnd() * ks.length)], K = WEEKLY[k];
    goals.push(Object.assign({ k, tier: t, n: K.n, got: 0, done: false }, K.pick ? K.pick(st, rnd) : {}));
    fams.push(K.fam);
  }
  goals.reverse();
  st.weekly = { week: cal.week, goals, bonus: false, full: prev.full || 0, doneAll: prev.doneAll || 0 };   // full: 셋 다 끝낸 주 · doneAll: 끝낸 목표 (모두)
  return st.weekly;
}
function weeklyOf(st) {   // 이번 주 목표 (주가 바뀌었으면 새로 뽑음). 첫 안내 전 정원은 아직 없음(null)
  if (!st.onboarded) return null;
  const cal = calendar(st.virtual);
  return st.weekly && st.weekly.week === cal.week ? st.weekly : weeklyRoll(st, cal);
}
function weeklyDone(st, g, ctx) {
  const w = st.weekly, quiet = slowView(st), xp = WEEKLY_XP[g.tier];
  g.done = true; g.got = g.n; w.doneAll = (w.doneAll || 0) + 1;
  if (!quiet) addLog(st, 9, `🗓️ 이번 주 목표를 끝냈어요 · ${weeklyText(g)} · 🌱 +${xp}`, ctx);
  addXp(st, 'weekly', xp, ctx);
  if (!w.bonus && w.goals.length && w.goals.every(x => x.done)) {
    w.bonus = true; w.full = (w.full || 0) + 1;
    if (!quiet) addLog(st, 9, `🗓️ 이번 주 목표를 모두 끝냈어요 · 덤 🌱 +${WEEKLY_BONUS}`, ctx);
    addXp(st, 'weekly', WEEKLY_BONUS, ctx);
  }
}
// 정원에서 한 일 → 이번 주 목표 진행 (ev: care · harvest · prop · dry · teabag · blend · sell · order · dig · descend · honey)
function weekNote(st, ev, info, n, ctx) {
  const w = weeklyOf(st); if (!w) return;
  for (const g of w.goals) {
    const K = WEEKLY[g.k];
    if (g.done || K.ev !== ev || (K.match && !K.match(g, info || {}))) continue;
    if (K.distinct) { const id = K.distinct(info); g.seen = g.seen || []; if (g.seen.includes(id)) continue; g.seen.push(id); g.got = g.seen.length; }
    else g.got = Math.min(g.n, g.got + (n == null ? 1 : n));
    if (g.got >= g.n) weeklyDone(st, g, ctx);
  }
}
function weeklyFinish(st, i, ctx) {   // 개발용(DEV) · 테스트: 이번 주 i번째 목표를 바로 끝냄
  const w = weeklyOf(st), g = w && w.goals[i];
  if (!g || g.done) return no('끝낼 목표가 없어요');
  weeklyDone(st, g, ctx);
  return ok(`${weeklyText(g)} 끝`);
}
// 화면은 아래만 읽음. 느긋하게 보기면 null → 목표 줄 · 띠를 통째로 숨김
function weeklyView(st) {
  const w = weeklyOf(st); if (!w || slowView(st)) return null;
  const leftH = (weekStart(st.virtual) + WEEK - st.virtual) / HOUR;
  const goals = w.goals.map(g => ({ k: g.k, ic: WEEKLY[g.k].ic, text: weeklyText(g), tier: g.tier, tierName: WEEKLY_TIERS[g.tier], n: g.n, got: g.got, done: g.done, xp: WEEKLY_XP[g.tier] }));
  return { week: w.week, goals, done: goals.filter(g => g.done).length, bonus: w.bonus, bonusXp: WEEKLY_BONUS, full: w.full || 0, leftH };
}
const weeklySnap = st => ({ all: (st.weekly && st.weekly.doneAll) || 0, full: (st.weekly && st.weekly.full) || 0, xp: (st.grade && st.grade.by && st.grade.by.weekly) || 0 });
function weeklyAwayLine(st, snap) {   // "자리를 비운 동안" 한 줄 (P25-01): 그동안 끝낸 목표를 하나로
  if (slowView(st) || !snap) return null;
  const now = weeklySnap(st), n = now.all - snap.all;
  return n > 0 ? `🗓️ 주간 목표 ${n}개를 끝냈어요${now.full > (snap.full || 0) ? ' · 🎉 셋 다 끝' : ''} · 🌱 +${now.xp - snap.xp}` : null;   // 경험치는 덤까지
}
const isWeeklyLine = t => typeof t === 'string' && t.startsWith('🗓️ 이번 주 목표');

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
      for (let n = 0; n < HARVEST_PETALS; n++) st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) });
      yearAdd(st, 'harvest', HARVEST_PETALS); addXp(st, 'harvest', HARVEST_PETALS, ctx);   // P28-07-01 올해 거둔 꽃잎 · P28-05-01 등급 경험치
      const two = f.origin === '이웃' && !f.giftPicked;
      if (two) { f.giftPicked = true; st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) }); yearAdd(st, 'harvest', 1); addXp(st, 'harvest', 1, ctx); }   // 화분 첫 수확은 2장 (QA 6회차)
      weekNote(st, 'harvest', { type: f.type, q: f.q }, two ? 2 : 1, ctx);       // P28-09 이번 주 목표
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); } // P08-02-02
    }
  }
  if (tool !== 'harvest') weekNote(st, 'care', { tool }, targets.length, ctx);   // P28-09
  flushPending(st, ctx);
  const two = tool === 'harvest' && targets.length === 1 && targets[0].origin === '이웃' && st.petals.filter(p => p.type === targets[0].type).length >= 2 && targets[0].harvestKey === harvestSlot(cal);
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: two ? '꽃잎 2장을 거둬 제다실로 보냈어요' : '꽃잎을 거둬 제다실로 보냈어요' }[tool];
  return ok(`${targets.length}${unitOf(targets)}에 ${word}`, { count: targets.length });
}

// P28-11 한꺼번에 돌보기 · 모두 거두기 (M2-5, ⏸ P13-06-01 되살림): 돌볼 꽃(canCare)만 골라 care에 한 번에 넘김 —
// 수확 품질 · 경험치 · 주간 목표 · 도감은 한 송이씩 한 것과 같음. 용품은 송이마다, 모자라면 되는 만큼만
const CARE_SUPPLY = { water: ['water', '물병', '개'], weed: ['hoe', '호미', '번'], prune: ['shears', '가위', '번'], fert: ['fert', '비료', '개'], harvest: ['basket', '바구니', '번'] };
// 모자랄 때 먼저 돌볼 꽃: 물은 오래 목마른 꽃, 거두기는 품질 높은 꽃, 나머지는 지도 위에서 아래로
function careAllTargets(st, kind, cal) {
  cal = cal || calendar(st.virtual);
  const pos = (a, b) => a.y - b.y || a.x - b.x;
  const by = kind === 'water' ? (a, b) => (b.thirstH || 0) - (a.thirstH || 0) || pos(a, b) : kind === 'harvest' ? (a, b) => b.q - a.q || pos(a, b) : pos;
  return st.flowers.filter(f => canCare(st, f, kind, cal)).sort(by);
}
function careAll(st, kind, ctx) {
  const S = CARE_SUPPLY[kind];
  if (!S) return no('돌볼 수 없어요');
  const all = careAllTargets(st, kind);
  if (!all.length) return no('돌볼 꽃이 없어요');
  const have = Math.max(0, Math.floor(st[S[0]] || 0));
  if (!have) return no(kind === 'fert' ? '비료가 없어요' : `${josa(S[1], '이/가')} 없어요. 창고에서 살 수 있어요`);
  const pick = all.slice(0, have), p0 = st.petals.length;
  const r = care(st, kind, pick.map(f => [f.x, f.y]), ctx);
  if (!r.ok) return r;
  const n = pick.length, unit = unitOf(pick), left = st[S[0]] || 0, petals = st.petals.length - p0;
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: `꽃잎 ${petals}장을 거뒀어요` }[kind];
  const msg = n < all.length ? `${josa(S[1], '이/가')} 모자라 ${n}${unit}만 ${word}` : `${n}${unit}에 ${word} · ${S[1]} ${left}${S[2]} 남았어요`;
  return ok(msg, { count: n, need: all.length, short: all.length - n, left, petals });
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
  weekNote(st, 'prop', null, 1, ctx);   // P28-09
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
  weekNote(st, 'teabag', null, list.length, ctx);   // P28-09
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
  weekNote(st, 'teabag', null, list.length, ctx);
  return ok(`생화 티백 ${list.length}개를 만들어 찻집으로 보냈어요`);
}
// P12-07 꽃방: 꽃잎을 널면 1달(흐르는 시간) 뒤 말린 꽃잎이 됨. 언제든 널 수 있음
function dryPetals(st, ids, ctx) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('널 꽃잎이 없어요');
  for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H }); }
  bump(st, 'dried', list.length); weekNote(st, 'dry', null, list.length, ctx);   // P28-09
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
  weekNote(st, 'teabag', null, list.length, ctx);
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
  weekNote(st, 'blend', { recipe }, 1, ctx);   // P28-09
  return ok(`${josa(name, '을/를')} 만들었어요`, { blend: b });
}
// 예전 규칙(P17-01: 우리지 않고 바로 팔기)의 판매 함수 — 화면은 찻잔(sellCups)만 씀. 예전 테스트 · 도구를 위해 남겨 둠
function sellBlends(st, ids, ctx) {
  if (!teaShopOpen(calendar(st.virtual))) return no('찻집은 겨울(12월)부터 열어요');
  const list = st.blends.filter(b => ids.includes(b.id));
  if (!list.length) return no('팔 블렌드 차가 없어요');
  let sum = 0;
  for (const b of list) { sum += blendValue(b); st.blends.splice(st.blends.indexOf(b), 1); }
  st.money += sum; yearAdd(st, 'income', sum); yearAdd(st, 'sold', list.length); addXp(st, 'sell', list.length, ctx);
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
    st.money += v; yearAdd(st, 'income', v);
    countCup(st, c, cal, true, ctx);
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
  const sum = sellCupList(st, cal, list, ctx);
  return ok(`찻잔 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
function sellCupList(st, cal, list, ctx) {        // 찻잔 팔기 (찻집이 열렸는지는 부르는 쪽이 봄 — sellCups · 첫 손님 P22-05)
  let sum = 0;
  for (const c of list) {
    sum += cupValue(st, c, cal); st.cups.splice(st.cups.indexOf(c), 1);
    countCup(st, c, cal, false, ctx);
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);   // 차는 처음 팔 때 도감에
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
  }
  st.money += sum; yearAdd(st, 'income', sum);
  return sum;
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
  st.money += sum; yearAdd(st, 'income', sum); yearAdd(st, 'sold', list.length); addXp(st, 'sell', list.length, ctx);
  return ok(`차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}

// ---------------------------------------------------------------- 도감일지: 퀘스트 → 칭호 (P19, 10-17)
const bump = (st, k, n) => { st.stats = st.stats || {}; st.stats[k] = (st.stats[k] || 0) + (n || 1); };
// 찻잔이 팔릴 때마다: 전체 · 손님(자동) · 갓 우린 · 햇차 · 블렌드 잔 수 (P19-07-01: 판매 잔 수 · 햇차 수만 새로 셈)
function countCup(st, c, cal, auto, ctx) {
  if (st.firstGuest) st.firstGuest = false;       // P22-05 첫 잔이 팔리면 🍵 첫 손님 표는 끝
  if (fillOrder(st, c)) { addXp(st, 'order', 1, ctx); weekNote(st, 'order', null, 1, ctx); }   // P23-01 손님 주문 · P28-05-01 등급 경험치 · P28-09
  bump(st, 'cups'); if (auto) bump(st, 'autoCups');
  yearAdd(st, 'sold', 1); addXp(st, 'sell', 1, ctx);   // P28-07-01 올해 판 잔 수 · P28-05-01
  if (!cupCold(c, cal)) bump(st, 'warmCups');
  if (c.hat) bump(st, 'hatCups');
  if (c.kind === 'blend') bump(st, 'blendCups');
  weekNote(st, 'sell', { cup: c }, 1, ctx);   // P28-09
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
  // P28-08-04 철마다 숨은 칭호 (M3-3 10-30): 새 철은 고르는 것이라 덤 칭호로 — 칭호 19개 · 꾸밈 도감 칸에 넣지 않음(안 해도 손해 없음). 새 철을 시작할 때 seasonStart가 줌
  t_season2: { name: '두 번째 봄', tier: 'f', extra: true, season: 2, cond: '새 철을 처음 시작 (2철)', hint: '비운 정원에 다시 씨앗을 뿌린 사람' },
  t_season3: { name: '세 철의 정원사', tier: 'g', extra: true, season: 3, cond: '3철을 시작', hint: '바람개비가 세 번 돈 정원' },
  t_season5: { name: '다섯 철을 건넌 사람', tier: 'g', extra: true, season: 5, cond: '5철을 시작', hint: '징검돌 다섯 개를 건너온 사람' },
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
    yr >= 2 || seasonN(st) >= 2 || chapterQuests('c1').some(q => q.test(st));   // P28-08-02 새 철은 해 번호가 1부터라 철로도 봄
  if (key === 'c6') return yr >= 2 || seasonN(st) >= 2;
  return chapterDone(st, 'c1');
}
function giveTitle(st, k, cal, ctx, silent) {
  if (st.titles[k] != null) return false;
  st.titles[k] = cal.abs;
  if (!(st.dex.deco && st.dex.deco['t:' + k])) addDeco(st, 't:' + k);   // P17-16-06 칭호 문장 장식
  if (!silent) {
    const quiet = slowView(st), lc = quiet ? null : ctx;                  // 느긋하게 보기 (P28-02): 일지 · 도감에만 조용히 — 알림 · 창 없음
    addLog(st, 9, `🏅 새 칭호: ${TITLES[k].name}`, lc);
    if (!quiet) (st._newTitles = st._newTitles || []).push(k);           // 화면이 얻는 연출을 띄움 (P19-05-06)
    const hb = ALL_BLEND_KEYS.find(b => BLENDS[b].hidden === k);
    if (hb) addLog(st, 9, `📖 숨은 레시피가 열렸어요: ${BLENDS[hb].name}`, lc);
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
        st.journal.done[q.key] = cal.abs; nq++; addXp(st, 'quest', 1, migrate ? null : ctx);   // P28-05-01
        if (!migrate) addLog(st, 9, `📜 퀘스트: ${questName(q, st)} 완료`, slowView(st) ? null : ctx);   // 느긋하게 보기면 알림 없이 일지에만 (P28-02)
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
  // P30-06-03 🐾 특별 손님이 세 번째로 온 날 남기는 기념품 (L1-8 10-30) — visitor: 그 손님 키. 주문 기념품 뽑기에는 넣지 않음
  coaster: { name: '도토리 찻잔 받침', ic: '🪵', visitor: 'hedgehog' }, titstring: { name: '박새 깃털 끈', ic: '🪢', visitor: 'tit' }, honeycomb: { name: '벌집 조각', ic: '🍯', visitor: 'beekid' }, yarn: { name: '털실 방울', ic: '🧶', visitor: 'cat' },
  wingmark: { name: '나비 날개 책갈피', ic: '📑', visitor: 'butterfly' }, lotusbrella: { name: '연잎 우산', ic: '☂️', visitor: 'frog' }, snowbutton: { name: '눈 결정 단추', ic: '❄️', visitor: 'snowkid' }, quill: { name: '부엉이 깃털 펜', ic: '🖋️', visitor: 'owl' },
};
const MEMENTO_KEYS = Object.keys(MEMENTOS);
const ORDER_MEMENTO_KEYS = MEMENTO_KEYS.filter(k => !MEMENTOS[k].visitor);   // 손님 주문이 두고 가는 12가지 (특별 손님 것은 빼고 — 주문 뽑기 차례 그대로)
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
  const left = ORDER_MEMENTO_KEYS.filter(k => !st.dex.memento[k]);
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
  // P22-05 첫 방문 꾸러미와 함께 오는 편지 — 답장이 아니라 답장 뽑기 · 편지 수(12통)에 넣지 않음
  welcome: { from: '꽃집 할머니', welcome: true, text: '정원에 온 걸 환영해요. 화분과 함께 말린 꽃잎과 티백을 넣었어요. 두 꽃잎을 섞어 차를 만들고, 찻집 문을 한 번 열어 첫 손님을 맞아 보세요.' },
};
const LETTER_KEYS = Object.keys(LETTERS).filter(k => !LETTERS[k].welcome);
const letterCount = st => Object.keys((st.dex && st.dex.letter) || {}).filter(k => LETTER_KEYS.includes(k)).length;
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
    trimLetterBox(st);                            // 가득하면 밀어냄 (P29-03: 선물을 안 받은 📮 편지는 남김)
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
  st.stats = st.stats || {}; st.stats.dug = (st.stats.dug || 0) + 1; weekNote(st, 'dig', null, 1, ctx);   // P28-09
  return ok(`${c.k === 'oldseed' ? '🌰 ' : ''}${mineName(c.k)}${c.stairs ? (m.depth >= MINE_DEEPEST ? ' · 가장 깊은 곳이에요' : ' · 아래로 내려가는 계단을 찾았어요') : ''}`, { cell: c, first, stairs: !!c.stairs && m.depth < MINE_DEEPEST });
}
function descend(st, ctx) {
  const m = mineOf(st);
  if (!m.board.cells.some(c => c.dug && c.stairs)) return no('먼저 계단을 찾아요');
  if (m.depth >= MINE_DEEPEST) return no('가장 깊은 층이에요');
  m.depth++; m.deepest = Math.max(m.deepest, m.depth); m.board = newBoard(st, m.depth); weekNote(st, 'descend', null, 1, ctx);   // P28-09
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
  if (cal.frozen) {                               // 꽃잠엔 거둘 수 없으니 티백 2개도 (QA 7회차: 첫 쪽지를 들어줄 수 있게) — P22-05 꾸러미 티백 1개는 이 둘 중 하나로 셈
    for (let i = 0; i < 2; i++) st.teas.push({ id: nid(st), type, q: 0.8, seasonKey: -1, hat: false, gift: true });   // gift: 첫걸음 수확으로 치지 않음
    st.dex.teabag = st.dex.teabag || {}; st.dex.teabag[type] = true;
  }
  if (teaShopOpen(cal)) makeOrders(st, cal);      // 쪽지는 화분 꽃을 알고 나서 다시 (QA 6회차 높음)
  st.dex.form = st.dex.form || {}; st.dex.form[type] = true;
  addLog(st, 3, `이웃이 ${josa(F.name, '을/를')} 화분째 나눠 줬어요 · 정원 가운데에 심었어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께` : ''}`, ctx);
  starterPack(st, type, cal, ctx);
  return ok(`이웃이 ${josa(F.name, '을/를')} 나눠 줬어요${cal.frozen ? ` · ${F.name} 티백 2개도 함께 받았어요` : ''} · 꽃집 할머니의 꾸러미도 왔어요`, { flower: f });
}
// ---------------------------------------------------------------- 첫 방문 꾸러미 (P22-05, 10-28)
// 화분과 함께 꽃집 할머니의 편지 + 꾸러미: 말린 꽃잎 2장(이름 있는 레시피 두 재료) · 화분 꽃 티백 1개 · 🍵 첫 손님 한 번. 돈은 주지 않음
// 화분 꽃이 들어가는 공개 레시피가 있으면 그 짝, 없으면(동백) 겨울에 어울리는 「겨울 매화향」. 화분 꽃잎은 거두고 1달 말려야 하니 두 재료를 모두 줌
const STARTER_BLEND = { maehwa: 'plumwinter', napmae: 'plumwinter', dongbaek: 'plumwinter', rose: 'springfield', lavender: 'sleepnight', jasmine: 'pondmorning', gamguk: 'autumngarden' };
function starterPack(st, type, cal, ctx) {
  const recipe = STARTER_BLEND[type] || 'springfield';
  for (const p of BLENDS[recipe].parts) st.dried.push({ id: nid(st), type: p, q: 0.8, gift: true });   // gift: 거의 새 정원 판단에서 뺌 · 말린 수 · 꽃잎 도감엔 넣지 않음
  // 꽃잠엔 위 티백 2개가 꾸러미 티백을 겸함. 도감 티백엔 넣지 않아 1장 "○○ 티백 만들기"는 직접 만들어야 끝남
  if (!cal.frozen) st.teas.push({ id: nid(st), type, q: 0.8, seasonKey: -1, hat: false, gift: true });
  st.firstGuest = true;
  st.dex.letter = st.dex.letter || {}; st.dex.letter.welcome = true;
  (st.letterBox = st.letterBox || []).push({ k: 'welcome', gift: null, re: null, pack: { recipe, tea: type }, y: yearOf(st, cal), m: cal.month, read: false });
  addLog(st, 17, `꽃집 할머니에게서 편지와 꾸러미가 왔어요 · 말린 ${BLENDS[recipe].parts.map(k => FLOWERS[k].name).join(' · ')} 꽃잎 · ${FLOWERS[type].name} 티백 · 🍵 첫 손님 한 번`, ctx);
}
const starterText = pack => `말린 ${BLENDS[pack.recipe].parts.map(k => FLOWERS[k].name).join(' · ')} 꽃잎 (섞으면 「${BLENDS[pack.recipe].name}」) · ${FLOWERS[pack.tea].name} 티백 · 🍵 첫 손님 한 번`;
// P22-05-03 🍵 첫 손님: 찻집이 닫혀 있어도 딱 한 번, 티백(꽃 · 블렌드) 하나를 우려 그 찻잔을 바로 팖. 닫힌 찻집의 예외는 여기 한 곳 (brew · sellCups는 그대로)
// 표는 찻잔이 한 잔이라도 팔리면(찻집이 열린 때 · 손님 · 일손 포함) 사라짐 — countCup
const firstGuestReady = st => !!st.firstGuest && !teaShopOpen(calendar(st.virtual));
function firstGuest(st, id, ctx) {
  if (!st.firstGuest) return no('첫 손님은 한 번만 와요');
  const cal = calendar(st.virtual);
  if (teaShopOpen(cal)) return no('찻집이 열려 있어요 · 🫖 우림으로 우려 팔아요');
  const t = st.teas.find(x => x.id === id), b = t ? null : st.blends.find(x => x.id === id && x.bagged);
  if (!t && !b) return no('우릴 티백이 없어요');
  if (t) st.teas.splice(st.teas.indexOf(t), 1); else st.blends.splice(st.blends.indexOf(b), 1);
  const { gift, ...src } = t || b, c = { ...src, id: nid(st), kind: t ? 'tea' : 'blend', brewAbs: cal.abs };
  st.cups = st.cups || []; st.cups.push(c);
  const sum = sellCupList(st, cal, [c], ctx);
  st.firstGuest = false;
  const nm = t ? FLOWERS[t.type].tea : b.name;
  return ok(`🍵 첫 손님이 ${josa(nm, '을/를')} 사 갔어요 · +${sum.toLocaleString('ko-KR')}원`, { sum });
}

// ---------------------------------------------------------------- 📮 운영자 편지 (P29, 10-28)
// 운영자가 저장소의 flower-land/mail.json에 적어 배포하면, 화면이 같은 사이트의 그 파일을 읽어 여기로 넘김 (아무것도 보내지 않음)
// 한 통: { id, from, title, text, gifts: [{ cat, key, n }], start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', to: 'all' | 'new' | 'before:YYYY-MM-DD' }
// 선물은 이웃 답례품과 같은 종류 · 같은 곳(giveReturn · RETURN_WHERE). 돈 · 칭호는 받지 않음 (확정 ②). 날짜는 한국 시간 하루 단위
const MAIL_CATS = ['seed', 'supply', 'honey', 'mine', 'deco'];
const MAIL_WARN = 10000, MAIL_MAX = 30000;        // 편지 한 통의 선물 가치(returnValue 합): 넘으면 테스트 경고 · 막기 (확정 ①)
const MAIL_LEN = { id: 40, from: 20, title: 30, text: 400 };
const MAIL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const kstDay = ms => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);   // 한국 시간 날짜 'YYYY-MM-DD'
const mailDayOk = d => { if (typeof d !== 'string' || !MAIL_DAY.test(d)) return false; const t = Date.parse(d + 'T00:00:00+09:00'); return Number.isFinite(t) && kstDay(t) === d; };   // 11-31 같은 없는 날도 막음
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// 넣을 수 있는 선물인가: 엔진에 있는 것 · 값을 셀 수 있는 것만 (광산은 답례품에 나오는 재료 · 화석, 장식은 화원 장식 중 꾸밈만)
function mailGiftOk(g) {
  if (!g || !MAIL_CATS.includes(g.cat) || typeof g.key !== 'string' || !Number.isInteger(g.n) || g.n < 1) return false;
  const k = g.key;
  return g.cat === 'seed' ? has(FLOWERS, k) : g.cat === 'supply' ? has(SUPPLIES, k) : g.cat === 'honey' ? HONEY_KEYS.includes(k)
    : g.cat === 'mine' ? has(FOSSILS, k) || (k !== 'honey' && k !== 'fossil' && has(RETURN_V, k)) : DECO_KEYS.includes(k) && !!DECOS[k].price && !DECOS[k].func;   // 수입을 늘리는 장식(벌통 · 빗물 통 · 장치)은 빼고 (P17-14, 답례품과 같게)
}
const mailValue = m => ((m && m.gifts) || []).filter(mailGiftOk).reduce((a, g) => a + returnValue(g), 0);
// 편지 한 통 검사 (tests/mail.test.js가 실제 mail.json에 씀): 틀린 곳 목록, 비면 통과. mailDeliver는 틀린 편지를 건너뜀
function mailCheck(m) {
  const e = [], str = (k, need) => { const v = m[k]; if (typeof v !== 'string' || (need && !v.trim())) e.push(`${k}: 글자가 없어요`); else if (v.length > MAIL_LEN[k]) e.push(`${k}: ${MAIL_LEN[k]}자를 넘어요 (${v.length}자)`); };
  if (!m || typeof m !== 'object' || Array.isArray(m)) return ['편지가 { } 모양이 아니에요'];
  str('id', true); str('from', true); str('title', true); str('text', true);
  if (typeof m.id === 'string' && !/^[0-9A-Za-z_-]+$/.test(m.id)) e.push('id: 영문 · 숫자 · - · _만 써요');
  if (!mailDayOk(m.start)) e.push('start: YYYY-MM-DD 날짜가 아니에요');
  if (!mailDayOk(m.end)) e.push('end: YYYY-MM-DD 날짜가 아니에요');
  if (mailDayOk(m.start) && mailDayOk(m.end) && m.start > m.end) e.push('start가 end보다 늦어요');
  const to = m.to;
  if (!(to === 'all' || to === 'new' || (typeof to === 'string' && to.startsWith('before:') && mailDayOk(to.slice(7))))) e.push('to: all · new · before:YYYY-MM-DD 중 하나예요');
  if (!Array.isArray(m.gifts)) e.push('gifts: [ ] 목록이 아니에요 (선물이 없으면 [])');
  else m.gifts.forEach((g, i) => {
    if (g && (g.cat === 'money' || g.cat === 'title')) e.push(`gifts[${i}]: 돈 · 칭호는 선물로 못 넣어요`);
    else if (!mailGiftOk(g)) e.push(`gifts[${i}]: 모르는 선물이에요 (${JSON.stringify(g)})`);
  });
  if (Array.isArray(m.gifts) && mailValue(m) > MAIL_MAX) e.push(`선물 가치 ${mailValue(m).toLocaleString('ko-KR')}원이 상한 ${MAIL_MAX.toLocaleString('ko-KR')}원을 넘어요`);
  return e;
}
// 받는 사람: 정원을 시작한 때는 정원 이름표의 만든 때(gardenBorn). 모르면(이상한 이름표) 오래된 정원으로 봄 — new 아님 · before는 받음
function mailFor(st, m, now) {
  const day = kstDay(now);
  if (day < m.start || day > m.end) return false;
  if (m.to === 'all') return true;
  const born = gardenBorn(st), bd = born ? kstDay(born) : null;
  if (m.to === 'new') return !!bd && bd >= m.start && bd <= m.end;
  return !bd || bd < m.to.slice(7);
}
// 받은 편지함이 가득하면 밀어냄 (P29-03): 다시 볼 것 없는 이웃 답장 → 선물을 받은 📮 편지 → 맨 앞. 선물을 안 받은 📮 편지는 밀지 않음 (모두 그렇다면 넘쳐도 둠)
function trimLetterBox(st) {
  const box = st.letterBox;
  while (box.length > LETTER_BOX_MAX) {
    let i = box.findIndex(b => !b.k && !b.mail && b.read);
    if (i < 0) i = box.findIndex(b => b.mail && b.took);
    if (i < 0) i = box.findIndex(b => !(b.mail && !b.took));
    if (i < 0) return;
    box.splice(i, 1);
  }
}
// 읽은 편지 목록에서 이 정원이 받을 것을 받은 편지함에 넣음 (선물은 아직). 받은 기록 st.mailGot[id] = 받은 때(ms) — 저장 · 드라이브에 실려 다른 기기에서도 두 번 안 옴
function mailDeliver(st, list, now, ctx) {
  if (!Array.isArray(list)) return 0;
  st.mailGot = st.mailGot || {}; st.letterBox = st.letterBox || [];
  const cal = calendar(st.virtual); let n = 0;
  for (const m of list) {
    if (!m || typeof m.id !== 'string' || has(st.mailGot, m.id)) continue;
    if (mailCheck(m).some(x => !x.startsWith('gifts[') && !x.startsWith('선물 가치'))) continue;   // 모양이 틀린 편지는 통째로 건너뜀
    if (!mailFor(st, m, now)) continue;
    const gifts = m.gifts.filter(mailGiftOk).map(g => ({ cat: g.cat, key: g.key, n: g.n }));   // 모르는 선물(손댄 파일) · 돈 · 칭호는 빼고
    if (mailValue({ gifts }) > MAIL_MAX) gifts.length = 0;                                      // 상한을 넘는 선물은 주지 않음 (테스트가 막지만 한 번 더)
    st.mailGot[m.id] = now;
    st.letterBox.push({ k: null, mail: { id: m.id, from: m.from, title: m.title, text: m.text, gifts }, took: gifts.length ? null : true, y: yearOf(st, cal), m: cal.month, read: false });
    trimLetterBox(st);
    addLog(st, 17, `📮 새 편지가 왔어요 · ${m.from}「${m.title}」${gifts.length ? ' · 🎁 선물이 있어요' : ''}`, ctx);
    n++;
  }
  if (n && ctx && ctx.live && ctx.toast) ctx.toast(n > 1 ? `📮 새 편지 ${n}통이 왔어요` : '📮 새 편지가 왔어요');
  return n;
}
const mailOf = (st, id) => (st.letterBox || []).find(b => b.mail && b.mail.id === id) || null;
const mailGiftText = gifts => gifts.map(returnText).join(' · ');
// 🎁 받기: 편지함에 있는 동안은 기간이 지나도 받을 수 있음
function mailTake(st, id, ctx) {
  const b = mailOf(st, id);
  if (!b) return no('편지함에 없는 편지예요');
  if (b.took) return no('이미 받은 선물이에요');
  const gifts = b.mail.gifts.filter(mailGiftOk);
  for (const g of gifts) giveReturn(st, g, ctx);
  b.took = true; b.read = true;
  const where = [...new Set(gifts.map(g => RETURN_WHERE[g.cat]))].join(' · ');
  if (gifts.length) addLog(st, 17, `📮 ${b.mail.from}의 선물 ${mailGiftText(gifts)} · ${where}에 있어요`, ctx);
  return ok(gifts.length ? `🎁 ${where}에 넣었어요` : '편지를 읽었어요', { gifts, where });
}

// ---------------------------------------------------------------- 첫걸음 (P11-01-05 · P04-05 · P22-02)
// 어떤 단계를 어떤 순서로 하는지, 이미 한 것은 ✓. 단계 이름은 화면(app.js GUIDE_LABEL)이 붙임
const GUIDE_STEPS = {
  base: ['bought', 'planted', 'watered', 'harvested', 'sold'],
  gift: ['blended', 'sold', 'bought', 'planted', 'watered', 'harvested'],   // P04-04 예전 시작 선물 정원
  sleep: ['reserved', 'planted', 'watered', 'harvested', 'sold'],           // P04-05 꽃잠에 시작: 화원이 닫혀 있으니 예약부터
};
const gotPot = st => st.gift != null && st.gift >= 0;
const potFlower = st => (gotPot(st) && st.flowers.find(f => f.origin === '이웃' && !f.withered)) || null;
// 변경 10-27 (사용자 요청): 화분이 이미 심겨 있으니 화분을 받은 정원은 "🌸 정원의 첫 꽃 돌보기"부터 (문구 변경 10-27: 남의 것이 아닌 내 꽃으로)
function guideKeys(st) {
  const ks = st.starterGift ? GUIDE_STEPS.gift : st.startedInSleep ? GUIDE_STEPS.sleep : GUIDE_STEPS.base;
  return gotPot(st) ? ['pot', ...ks] : ks;
}
function guideFill(st) {
  const g = st.guide = st.guide || {};
  if (st.flowers.some(f => f.origin !== '이웃')) { g.bought = true; g.planted = true; }   // 이웃의 화분은 산 것 · 심은 것으로 치지 않음
  if (st.items.length) g.bought = true;
  if (st.reservations.length || g.bought) g.reserved = true;   // 예약을 건너뛰고 월요일에 바로 사도 됨
  if (Object.keys(st.dex.petal || {}).length || Object.keys(st.dex.tea).length || (!st.starterGift && (st.petals.length || st.teas.some(t => !t.gift)))) g.harvested = true;   // 시작 선물 꽃잎 · 화분과 받은 티백은 수확으로 치지 않음
  if (gotPot(st) && !potFlower(st)) g.pot = true;  // 받은 화분이 시들었거나 없으면 누를 수 없으니 (받기 전엔 그대로)
  return g;
}
// 플레이어가 지도에서 화분을 직접 누르거나 그 화분에 돌보기를 했을 때. 새로 ✓가 되면 true
function guideTap(st, f) {
  if (!f || f.origin !== '이웃' || (st.guide && st.guide.pot)) return false;
  guideFill(st).pot = true;
  return true;
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
  // P28-10 🧺 자동 장치 (10-28): 손을 덜어 주는 기능 장식 — 늘 팖 · 정원 등급 need부터 (등급 장식 줄과 따로). 장치 표는 체크리스트 P28-10
  autobasket: { name: '자동 수확 바구니', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 40000, need: 6, func: true, auto: true, desc: '달이 끝날 때 바로 옆 꽃 8포기의 꽃잎을 거둬요' },
  dryrack: { name: '자동 건조대', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 50000, need: 9, func: true, auto: true, desc: '달이 끝날 때 제다실 꽃잎 8장을 널어 티백까지 만들어요' },
  teahelper: { name: '찻집 일손', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 80000, need: 12, one: true, func: true, auto: true, desc: '찻집이 열리면 티백을 우려 카운터를 채워요' },
  cloudstone: { name: '구름 돌', month: 0, months: [], extra: true, desc: '구름 정원사에게 온 뭉게구름 모양 돌' },   // P20-16 덤 장식 (10-27): 팔지 않음 · 꾸밈 도감 칸과 따로 셈
  // P28-05-01 🌱 등급 장식 (10-27): 정원 등급이 그만큼 오르면 화원에 늘 나옴 (달과 상관없이). 땅 · 꽃 · 값에는 영향 없음 (보너스는 M3 P28-05-02)
  // 화원은 🌱 등급 장식 줄(이달의 장식 DECO_KEYS와 따로), 꾸밈 도감 칸에는 넣음 (M1-4, 10-28)
  sproutsign: { name: '새싹 팻말', month: 0, months: [], grade: 5, price: 3000, desc: '"새싹이 자라요" 나무 팻말' },
  wateringcan: { name: '양철 물뿌리개', month: 0, months: [], grade: 10, price: 6000, desc: '오래 써서 반질반질한 물뿌리개' },
  arch: { name: '꽃 아치', month: 0, months: [], grade: 15, price: 18000, desc: '덩굴꽃이 감아 오른 아치' },
  sundial: { name: '해시계', month: 0, months: [], grade: 20, price: 25000, desc: '그림자로 시간을 알려 주는 돌' },
  swing: { name: '나무 그네', month: 0, months: [], grade: 25, price: 35000, desc: '바람에 살랑이는 그네' },
  flowercart: { name: '꽃수레', month: 0, months: [], grade: 30, price: 50000, desc: '꽃 화분을 가득 실은 수레' },
};
const DECO_KEYS = Object.keys(DECOS).filter(k => !DECOS[k].extra && !DECOS[k].grade);   // 덤 장식은 EXTRA_DECO_KEYS · 등급 장식은 GRADE_DECO_KEYS
const GRADE_DECO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].grade);
const gradeDecoOffer = st => GRADE_DECO_KEYS.filter(k => DECOS[k].grade <= gradeOf(st).grade);   // 지금 등급으로 살 수 있는 등급 장식
const EXTRA_DECO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].extra);
const decoInfo = key => {
  if (DECOS[key] && Object.prototype.hasOwnProperty.call(DECOS, key)) return DECOS[key];
  const tk = typeof key === 'string' && key.startsWith('t:') ? key.slice(2) : null;
  return tk && TITLES[tk] ? { name: `${TITLES[tk].name} 문장`, title: tk, price: null, extra: !!TITLES[tk].extra, desc: '칭호를 얻은 기념 문장' } : null;
};
const decoTotal = () => DECO_KEYS.length + GRADE_DECO_KEYS.length + TITLE_KEYS.length;   // 꾸밈 도감 칸 (도감 93칸과 따로 셈, P17-16-05) — 덤 장식 · 덤 칭호 문장은 빼고, 등급 장식은 넣음 (M1-4)
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
  if (it.grade) { if (gradeOf(st).grade < it.grade) return no(`${josa(it.name, '은/는')} 정원 등급 ${it.grade}부터 살 수 있어요`); }   // P28-05-01 등급 장식: 달과 상관없이
  else if (it.need && gradeOf(st).grade < it.need) return no(`${josa(it.name, '은/는')} 정원 등급 ${it.need}부터 살 수 있어요`);   // P28-10 자동 장치
  else if (!decoMonths(key).includes(cal.month)) return no(`${josa(it.name, '은/는')} ${decoMonths(key).map(monthName).join('·')}에만 들어와요`);
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
// ---------------------------------------------------------------- 🧺 자동 장치 (P28-10, 10-28)
// 빗물 통처럼 놓으면(창고에 있으면 쉼) 일함. 손을 덜어 줄 뿐 사람이 할 때보다 더 벌지 않음 (P17-14)
const AUTO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].auto);
const AUTO_R = 1, AUTO_Q = 0.9;                  // 바구니 둘레 · 자동으로 거둔 꽃잎은 손으로 거둔 것의 90% 품질
const placedOf = (st, key) => (st.decos || []).filter(d => d.key === key && d.x != null);
const inReach = (f, d, r) => Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= r;
// P28-05-02-02 🧺 바구니 넓게: 기본은 바로 옆(1칸) 8포기, 보너스를 켜면 둘레 2칸에서 가까운 꽃부터 12 · 16 · 20포기 (거두는 양 · 품질은 그대로)
const basketReach = st => bonusVal(st, 'basket') > 8 ? 2 : AUTO_R;
function basketFlowers(st, d) {                  // 바구니가 맡은 꽃 (시든 꽃은 자리를 차지하지 않음) — 가까운 순, 같으면 심은 순
  const n = bonusVal(st, 'basket'), near = st.flowers.filter(f => !f.withered && inReach(f, d, basketReach(st)));
  if (near.length <= n) return near;
  const dist = f => { const dx = Math.abs(f.x - d.x), dy = Math.abs(f.y - d.y); return Math.max(dx, dy) * 10 + dx + dy; };
  const pick = new Set(near.slice().sort((a, b) => dist(a) - dist(b)).slice(0, n));
  return near.filter(f => pick.has(f));
}
// 바구니 둘레에서 이 달에 거둘 꽃: 손으로 거두는 규칙(canCare) 그대로 — 그 달에 이미 거둔 꽃은 빼고
const basketBlooms = (st, d, cal) => basketFlowers(st, d).filter(f => canCare(st, f, 'harvest', cal));
// P28-10-01 꽃잠이 아닌 달이 끝날 때(ended = 끝난 달). 바구니 용품은 쓰지 않음 (빗물 통이 물병을 안 쓰는 것과 같음) · 화분 첫 수확 덤 없음
function basketTick(st, ended, ctx) {
  let n = 0;
  for (const d of placedOf(st, 'autobasket')) {
    const fs = basketBlooms(st, d, ended);
    for (const f of fs) {
      f.harvestKey = harvestSlot(ended);
      st.petals.push({ id: nid(st), type: f.type, q: f.q * AUTO_Q, seasonKey: seasonKey(st, ended), auto: true });
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); }
    }
    d.n = (d.n || 0) + fs.length; n += fs.length;
  }
  if (n) {
    yearAdd(st, 'harvest', n); addXp(st, 'harvest', n, ctx); bump(st, 'autoHarvest', n);   // 거둔 꽃잎은 사람이 거둔 것과 같은 양으로 셈
    addLog(st, 18, `자동 수확 바구니가 꽃잎 ${n}장을 거뒀어요`, ctx);
  }
  return n;
}
// P28-10-02 자동 건조대: 꽃잠이 아닌 달이 끝날 때 제다실 생화를 오래된 것부터(먼저 거둔 것 = 품질이 먼저 줄어든 것) 건조대 하나에 RACK_N장씩 꽃방에 넒
// 다 마르면(1달, 흐르는 시간) 말린 꽃잎 칸을 거치지 않고 바로 티백 — 블렌드 · 레시피는 사람 몫으로 남김. 손으로 넌 꽃잎은 그대로
const RACK_N = 8;
const rackN = st => bonusVal(st, 'rack');        // P28-05-02-02 🍂 건조대 넉넉히: 8 → 10 · 12 · 14장 (꽃잎은 손으로도 말릴 수 있는 양)
function rackTick(st, ctx) {
  let n = 0;
  for (const d of placedOf(st, 'dryrack')) {
    const list = st.petals.slice(0, rackN(st));
    for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H, auto: true }); }
    d.n = (d.n || 0) + list.length; n += list.length;
  }
  if (n) { bump(st, 'autoHung', n); addLog(st, 12, `자동 건조대가 꽃잎 ${n}장을 꽃방에 널었어요`, ctx); }   // 말린 수(stats.dried)는 손으로 넌 것만 — 퀘스트 · 칭호를 장치가 끝내지 않게
  return n;
}
function rackBag(st, d, ctx) {                     // 손으로 말린 꽃잎을 티백으로 만든 것(makeTeaDried)과 같은 티백
  st.teas.push({ id: nid(st), type: d.type, q: d.q, seasonKey: -1, hat: isHat(d.q), auto: true });
  regTeabag(st, d.type, ctx);
  if (!st.yearBest || d.q > st.yearBest.q) st.yearBest = { type: d.type, q: d.q };
  st._rackBagNew = (st._rackBagNew || 0) + 1; bump(st, 'autoBags');
}
// P28-10-03 찻집 일손: 찻집이 열린 동안 카운터의 갓 우린 잔이 (손님 자리 + 1)잔보다 적으면 가장 오래된 티백부터 우려 채움 → 카운터가 한 잔씩 팖(autoSell)
// 블렌드 티백 · 🍯 꿀 · 주문 맞추기는 사람 몫. 달이 바뀌면 남은 잔은 식어 반값 (그만큼 사람이 한꺼번에 우려 파는 것보다 조금 덜 벎)
const helperKeep = st => shopOf(st).seats + 1;
function helperTick(st, cal) {
  if (!teaShopOpen(cal) || !st.teas.length) return 0;
  const d = placedOf(st, 'teahelper')[0]; if (!d) return 0;
  st.cups = st.cups || [];
  let warm = st.cups.filter(c => !cupCold(c, cal)).length, n = 0;
  while (warm < helperKeep(st) && st.teas.length) {
    const t = st.teas.shift();
    st.cups.push({ ...t, id: nid(st), kind: 'tea', brewAbs: cal.abs, auto: true });
    warm++; n++;
  }
  if (n) { d.n = (d.n || 0) + n; bump(st, 'autoBrew', n); st._helperBrew = (st._helperBrew || 0) + n; }
  return n;
}
// "자리를 비운 동안"(P25-01): 장치마다 한 줄로 합침 — 달마다 남긴 일지 줄은 빼고(isAutoLine) 이 줄만. 느긋하게 보기면 숫자 없이 (P28-02)
const AUTO_STATS = [['autoHarvest', '자동 수확 바구니', n => `가 꽃잎 ${n}장을 거뒀어요`, '가 꽃잎을 거뒀어요', 18], ['autoBags', '자동 건조대', n => `가 꽃잎을 말려 티백 ${n}개를 만들었어요`, '가 꽃잎을 말려 티백을 만들었어요', 12],
  ['autoBrew', '찻집 일손', n => `이 찻잔 ${n}잔을 우렸어요`, '이 차를 우렸어요', 13]];
const autoStats = st => Object.fromEntries(AUTO_STATS.map(([k]) => [k, ((st.stats || {})[k]) || 0]));
const isAutoLine = text => AUTO_STATS.some(([, who]) => text.startsWith(who));
const autoLineType = text => (AUTO_STATS.find(([, who]) => text.startsWith(who)) || [])[4] || 18;   // 일지 아이콘: 🧺 · 🍂 · ☕
function autoAwayLines(st, before) {
  const now = autoStats(st), b = before || {};
  return AUTO_STATS.filter(([k]) => now[k] > (b[k] || 0)).map(([k, who, many, plain]) => who + (slowView(st) ? plain : many(now[k] - (b[k] || 0))));
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
  d.honey = []; weekNote(st, 'honey', null, n, ctx);   // P28-09
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
// ---------------------------------------------------------------- 🧺 정원 저장고 (P28-04, M2-7 10-28)
// 흐르는 시간 2시간마다 한 칸씩 작은 것이 상한까지 쌓이고, "모두 거두기" 한 번으로 받음. 꽃잠엔 멈춤(advance가 흐르는 달에만 부름) · 따라잡기 3주 안에서만 (catchUp)
// 돈 고리 막기 (P17-14): 하루(12칸) 가치가 하루 용돈보다 작게(pantryDayValue). 🍂 떨어진 꽃잎은 아직 안 거둔 핀 꽃의 이달 수확을 바구니 1번으로 대신 거둠(품질 90%, 자동 수확 바구니와 같음)이라 새 돈이 아님
//   — 핀 꽃이나 바구니가 없으면 흙 (바구니 없이 거두면 돈이 모자란 정원에 공짜 수확이 됨: 시뮬에서 찾음)
// 상한은 정원 등급 표 하나로만 늘어남 (등급 보너스 체계 P28-05-02는 따로)
const PANTRY_H = 2;
const PANTRY_CYCLE = ['water', 'dirt', 'petal', 'dirt', 'quartz', 'fert', 'water', 'dirt', 'petal', 'water', 'dirt', 'quartz'];
const PANTRY_CAPS = [[1, 4], [10, 5], [20, 6]];   // [정원 등급, 상한 칸] — 8 · 10 · 12시간이면 참
const PANTRY_ITEMS = {
  water: { ic: '💧', name: '물병', unit: '개', won: SUPPLIES.water.price, to: '창고' },
  fert: { ic: '🌱', name: '비료', unit: '개', won: SUPPLIES.fert.price, to: '창고' },
  dirt: { ic: '🟫', name: '흙', unit: '줌', won: Math.round(SUPPLIES.fert.price / CRAFTS.fert.need.dirt), to: '광산 주머니' },   // 흙 5 → 비료 1이라 비료 값의 1/5
  quartz: { ic: '💎', name: '석영 조각', unit: '개', won: 0, to: '광산 주머니' },   // 팔지 않고 꾸밈 · 찻잔 만들기에만 (돈이 늘지 않음)
  petal: { ic: '🍂', name: '떨어진 꽃잎', unit: '장', won: 0, to: '제다실' },        // 그 꽃의 이달 수확을 대신함 — 새 돈 아님
};
const PANTRY_KEYS = Object.keys(PANTRY_ITEMS);
const newPantry = () => ({ h: 0, n: 0, items: [], got: 0 });
const pantryOn = st => !!st.onboarded;            // 첫 안내를 마친 정원부터
const pantryOf = st => (st.pantry = st.pantry || newPantry());
const pantryCap = st => { const g = gradeOf(st).grade; let c = PANTRY_CAPS[0][1]; for (const [need, cap] of PANTRY_CAPS) if (g >= need) c = cap; return c + bonusVal(st, 'pantry'); };   // P28-05-02-02 🧺 저장고 한 칸 더 (하루 12칸은 그대로)
// 하루(흐르는 24시간 = 12칸) 동안 쌓일 수 있는 것의 값 — 떨어진 꽃잎은 핀 꽃이 없을 때의 흙으로 셈 (가장 많은 쪽)
const pantryDayValue = () => { let v = 0; for (let i = 0; i < 24 / PANTRY_H; i++) { const k = PANTRY_CYCLE[i % PANTRY_CYCLE.length]; v += PANTRY_ITEMS[k === 'petal' ? 'dirt' : k].won; } return v; };
function pantryDrop(st, k, cal) {
  if (k !== 'petal') return { k };
  const f = st.flowers.find(z => !z.withered && z.origin !== '이웃' && canCare(st, z, 'harvest', cal));   // 이웃의 화분은 빼고 (첫 수확 2장 · 첫걸음은 손으로)
  if (!f || !(st.basket > 0)) return { k: 'dirt' };
  f.harvestKey = harvestSlot(cal); st.basket--;   // 이달 수확을 저장고가 바구니로 대신함 (손으로 다시 거두지 못함)
  return { k, type: f.type, q: f.q * AUTO_Q, seasonKey: seasonKey(st, cal) };
}
function pantryTick(st, cal, dtH) {               // advance에서 흐르는 달에만
  if (!pantryOn(st)) return;
  const p = pantryOf(st), cap = pantryCap(st);
  if (p.items.length >= cap) { p.h = 0; return; }   // 가득 차면 더 쌓이지 않음 (놓친 벌칙도 없음)
  p.h += dtH;
  while (p.h >= PANTRY_H - 1e-9 && p.items.length < cap) { p.h -= PANTRY_H; p.items.push(pantryDrop(st, PANTRY_CYCLE[p.n % PANTRY_CYCLE.length], cal)); p.n++; }
  if (p.items.length >= cap) p.h = 0;
}
function pantryCounts(items) {
  const c = {}; for (const it of items) c[it.k] = (c[it.k] || 0) + 1;
  return PANTRY_KEYS.filter(k => c[k]).map(k => ({ k, n: c[k], ...PANTRY_ITEMS[k] }));
}
function takePantry(st, ctx) {
  const p = pantryOf(st);
  if (!p.items.length) return no('저장고가 비었어요');
  const list = pantryCounts(p.items), m = st.mine || (st.mine = newMine());
  let petals = 0;
  for (const it of p.items) {
    if (it.k === 'water') st.water = (st.water || 0) + 1;
    else if (it.k === 'fert') st.fert += 1;
    else if (it.k === 'dirt' || it.k === 'quartz') {
      m.bag[it.k] = (m.bag[it.k] || 0) + 1;
      st.dex.mine = st.dex.mine || {};
      if (MINE_DEX_KEYS.includes(it.k) && !st.dex.mine[it.k]) { st.dex.mine[it.k] = true; addLog(st, 9, `도감에 등록: ⛏️ ${mineName(it.k)}`, ctx); }
    } else if (it.k === 'petal') {
      st.petals.push({ id: nid(st), type: it.type, q: it.q, seasonKey: it.seasonKey, auto: true }); petals++;
      if (!st.dex.petal[it.type]) { st.dex.petal[it.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[it.type].name} 꽃잎`, ctx); }
    }
  }
  if (petals) { yearAdd(st, 'harvest', petals); addXp(st, 'harvest', petals, ctx); }   // 거둔 꽃잎은 사람이 거둔 것과 같은 양 (주간 목표에는 세지 않음 — 장치처럼)
  p.got += p.items.length; p.items = [];
  const text = list.map(x => `${x.ic} ${x.name} ${x.n}`).join(' · ');
  return ok(`🧺 저장고에서 거뒀어요 · ${text}`, { list, petals });
}
// 화면이 읽는 것: 쌓인 칸 · 상한 · 종류별 수 · 다음 칸까지 남은 시간. 🐢 느긋하게 보기면 숫자(n · cap · next)는 null — 거두기는 그대로 (P28-02)
function pantryView(st) {
  if (!pantryOn(st)) return null;
  const p = pantryOf(st), cap = pantryCap(st), slow = slowView(st), full = p.items.length >= cap;
  return { has: p.items.length > 0, full, list: pantryCounts(p.items), n: slow ? null : p.items.length, cap: slow ? null : cap, next: slow || full ? null : Math.max(0, PANTRY_H - p.h), slow };
}
function storeDeco(st, id) {
  const d = (st.decos || []).find(z => z.id === id);
  if (!d) return no('거둘 장식이 없어요');
  const hn = (d.honey || []).length;
  if (hn) takeHoney(st, d.id);                   // 벌통에 모인 꿀은 함께 거둠 (QA 2회차)
  d.x = null; d.y = null;
  return ok(`${josa(decoInfo(d.key).name, '을/를')} 창고에 넣었어요${hn ? ` · 꿀 ${hn}병은 찻집 꿀 선반으로` : ''}`);
}

// ---------------------------------------------------------------- 🌟 등급 보너스 (P28-05-02, M3-1 10-29)
// P28-05-02-01 🌟 손길 점: 정원 등급 5등급마다 1점 (5 · 10 · 15 …, 끝없음). 등급 = 평생 경험치라 돈 · 아이템으로는 못 얻고 되풀이 꼼수도 없음
// P28-05-02-02 고르는 보너스 4칸: 시간 · 손만 덜어 줌 — 값 · 품질 · 꽃 수 · 생산 배율은 넣지 않음 (P17-14). 단계 값 1 · 2 · 3점 (한 칸을 끝까지 = 6점)
//   💧 물 오래(2달 → 3달)는 뺌 (10-29 시뮬): 물병을 덜 써서 목마른 꽃이 줄어 품질 · 수입이 올랐음 — 3달 +5~9%, 2.25달도 +3~7% (5씨앗 4년 찻집 수입)
// P28-05-02-03 언제든 올리고 내림 — 내리면 점이 그대로 돌아옴 (벌칙 없음, P07). 느긋하게 보기(P28-02) 숨김은 화면 몫 (E.slowView)
const BONUS_PER = 5;                              // 몇 등급마다 1점
const BONUS_COST = [1, 2, 3];                    // 1 · 2 · 3단계에 드는 점
const BONUS = {                                  // vals[단계] = 그 단계에서 규칙이 읽는 값 (0단계 = 보너스 없을 때)
  basket: { name: '바구니 넓게', icon: '🧺', vals: [8, 12, 16, 20], desc: v => `자동 수확 바구니가 꽃 ${v}포기까지 거둬요` },           // basketFlowers
  rack: { name: '건조대 넉넉히', icon: '🍂', vals: [8, 10, 12, 14], desc: v => `자동 건조대가 달마다 꽃잎 ${v}장을 널어요` },           // rackN
  pantry: { name: '저장고 한 칸 더', icon: '🧺', vals: [0, 1, 2, 3], desc: v => v ? `정원 저장고에 ${v}칸 더 쌓여요` : '정원 저장고 칸 그대로예요' },   // pantryCap
  catchup: { name: '따라잡기 길게', icon: '🌙', vals: [3, 4, 5], desc: v => `오래 비워도 ${v}주까지 따라잡아요` },                     // catchUpH (app.js catchUp이 읽음 — M3-2)
};
const BONUS_KEYS = Object.keys(BONUS);
const newBonus = () => Object.fromEntries(BONUS_KEYS.map(k => [k, 0]));
const bonusMax = k => BONUS[k].vals.length - 1;
const bonusLevel = (st, k) => clamp(Math.floor(+(((st && st.bonus) || {})[k]) || 0), 0, bonusMax(k));
const bonusVal = (st, k) => BONUS[k].vals[bonusLevel(st, k)];
const bonusCostTo = lv => BONUS_COST.slice(0, lv).reduce((a, b) => a + b, 0);   // 0단계에서 lv단계까지 드는 점
const bonusPoints = st => Math.floor(gradeOf(st).grade / BONUS_PER);
const bonusUsed = st => BONUS_KEYS.reduce((a, k) => a + bonusCostTo(bonusLevel(st, k)), 0);
const bonusLeft = st => bonusPoints(st) - bonusUsed(st);
const bonusMaxed = (st, k) => !!BONUS[k] && bonusLevel(st, k) === bonusMax(k);   // P28-05-02-04 이정표: 끝까지 올린 칸은 장치 그림이 한 단계 바뀜 (그림은 M3-2)
const catchUpH = st => bonusVal(st, 'catchup') * 7 * 24;   // 자리를 비운 동안 따라잡는 가장 긴 시간 (현실 시간)
function bonusSet(st, key, level) {
  if (!BONUS[key]) return no('없는 보너스예요');
  if (!Number.isInteger(level) || level < 0 || level > bonusMax(key)) return no('그 단계는 없어요');
  const B = BONUS[key], from = bonusLevel(st, key);
  st.bonus = Object.assign(newBonus(), st.bonus);
  if (level === from) return ok(`${B.icon} ${B.name} ${level}단계 그대로예요`, { level });
  if (level > from) {
    const short = bonusCostTo(level) - bonusCostTo(from) - bonusLeft(st);
    if (short > 0) return no(`🌟 손길 점이 ${short}점 모자라요`);
    st.bonus[key] = level;
    return ok(`${B.icon} ${josa(B.name, '을/를')} ${level}단계로 올렸어요`, { level });
  }
  st.bonus[key] = level;                          // 내리기는 늘 됨 — 점이 그대로 돌아옴
  return ok(`${B.icon} ${josa(B.name, '을/를')} ${level}단계로 내렸어요 · 🌟 ${bonusCostTo(from) - bonusCostTo(level)}점이 돌아왔어요`, { level });
}
function bonusView(st) {                          // 고르기 화면(M3-2)이 읽음 — 느긋하게 보기 판단은 넣지 않음
  const points = bonusPoints(st), used = bonusUsed(st);
  const rows = BONUS_KEYS.map(key => {
    const B = BONUS[key], level = bonusLevel(st, key), max = bonusMax(key);
    return { key, name: B.name, icon: B.icon, level, max, maxed: level === max, costNext: level < max ? BONUS_COST[level] : null, desc: B.desc(B.vals[level]), nextDesc: level < max ? B.desc(B.vals[level + 1]) : null };
  });
  return { points, used, left: Math.max(0, points - used), per: BONUS_PER, nextAt: (points + 1) * BONUS_PER, rows };
}

// ---------------------------------------------------------------- 🌸 새 철 다시 시작 (P28-08, M3-3 10-30)
// P28-08-00 고르는 것이지 해야 하는 것이 아님: 안 해도 손해 없음 · 창으로 재촉하지 않음 — 엔진은 꽃잠 기록 끝 한 줄(seasonHint)만, 알림 · 이벤트 없음
// P28-08-01 조건: 이번 철에 쉼달 기록 3해 + 꽃 도감 13종. 해는 yearLog의 이번 철 줄 수로 셈 (해 번호는 철마다 1부터라 줄로 — 0년차 꽃잠은 줄이 없어 안 셈)
//   꽃잠(쉼달 · 꽃샘달)에만 시작 → 그 꽃잠은 새 철 0년차, 다음 월요일 3월이 1년차 (P04-05 꽃잠 시작과 같은 꼴)
const SEASON_YEARS = 3;
const SEASON_TITLES = Object.keys(TITLES).filter(k => TITLES[k].season);   // P28-08-04 2 · 3 · 5철 숨은 칭호
const newSeason = () => ({ n: 1, startedAt: null, path: null, log: [] });   // path: P30-04 철의 길 자리 · log: 끝난 철마다 { n, startedAt, endedAt, years, grade, sold } (P30-04-03 철마다 표)
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
const SEASON_KEEP = ['grade', 'bonus', 'titles', 'titleOn', 'dex', 'journal', 'stats', 'yearLog', 'records', 'bestScore', 'letterBox', 'letterPending', 'mailGot', 'settings', 'account', 'resetAt', 'gardenId',
  'shop', 'decos', 'onboarded', 'guide', 'gift', 'firstFlower', 'ownBloom', 'firstGuest', 'starterGift', 'startedInSleep', 'weekly', 'restClosed', 'lastExport', 'lastReal', 'actAt', 'speed', 'nextId', '_newTitles', 'layers', 'yearly', 'visitors'];   // layers: P30-01-01 정원의 층 (연 해는 누적 해 수라 철을 넘겨도 그대로) · yearly: P30-05-01 올해만 오는 것 (해 번호가 누적이라 달력 · 본 것 · 놓친 것 그대로) · visitors: P30-06 특별 손님 (온 횟수 · 기념품은 이어지고 앉은 손님은 seasonStart가 비움)
function seasonStart(st, ctx) {
  ctx = ctx || {};
  const cal = calendar(st.virtual);
  if (!cal.frozen) return no('새 철은 꽃잠에만 시작할 수 있어요');
  const r = seasonReady(st);
  if (!r.ready) return no(r.years < SEASON_YEARS ? `이번 철에 ${SEASON_YEARS}해를 지나야 해요 (${r.years}해)` : `꽃 도감 ${FLOWER_KEYS.length}종을 모두 피워야 해요 (${r.flowers}종)`);
  const n = seasonN(st), old = st.season || newSeason(), now = st.virtual, rows = seasonRows(st, n);
  const sold = rows.some(x => typeof x.sold === 'number') ? rows.reduce((a, x) => a + (x.sold || 0), 0) : null;   // 판 잔은 아는 해만 (예전 정원은 모름)
  const ended = { n, startedAt: old.startedAt == null ? null : old.startedAt, endedAt: now, years: rows.length, grade: gradeOf(st).grade, sold };
  const keep = {}; for (const k of SEASON_KEEP) if (k in st) keep[k] = st[k];
  const mine = st.mine || newMine();
  for (const k of Object.keys(st)) delete st[k];                             // 화면이 같은 st를 쥐고 있어 제자리에서 바꿈
  Object.assign(st, _create(now, ctx.rng || Math.random, cal), keep);        // 땅 600칸은 황무지로 새로 (create와 같은 뽑기)
  st.season = { n: n + 1, startedAt: now, path: null, log: [...(old.log || []), ended] };
  st.mine = Object.assign(newMine(), { deepest: mine.deepest || 1, boards: mine.boards || 0 });   // ⛏️ 주머니 · 지금 층은 비우고, 가장 깊이 간 층은 이어짐
  for (const d of st.decos || []) {
    if (d.honey) d.honey = [];                                                // 벌통에 모인 꿀도 비움
    if (!(DECOS[d.key] && DECOS[d.key].auto)) { d.x = null; d.y = null; }     // 🧺 자동 장치만 제자리, 나머지 장식은 창고 🪴로
  }
  if (st.visitors) { st.visitors.now = []; st.visitors.call = null; }        // P30-06-01 앉아 있던 손님은 떠남 (장식이 창고로 감) — 온 횟수 · 기념품은 이어짐
  st.yearPace.xp0 = (st.grade && st.grade.xp) || 0;                         // P28-07-02 새 철 0년차부터 견줌 (경험치는 이어짐)
  addLog(st, 7, `🌸 ${n + 1}철을 시작했어요 · 다음 월요일 3월이 새 철 1년차예요`, ctx);
  const title = SEASON_TITLES.find(k => TITLES[k].season === n + 1) || null;   // 새 철 보상은 이 칭호뿐 — 🌟 손길 점은 더 주지 않음 (열린 질문 ②)
  if (title) giveTitle(st, title, cal, ctx);
  return ok(`🌸 ${n + 1}철을 시작했어요`, { season: n + 1, title, ended });
}

// ---------------------------------------------------------------- 🌳 정원의 층 (P30-01-01, L1-1 10-30)
// P30-01-01 해 단위로 천천히 열리는 층. 1~3층은 이미 있는 것(찻집 · 광산)을 층으로 부를 뿐이라 정원은 바뀌지 않음 — 찻집은 첫 찻잔을 팔면, 광산은 처음 파면(주간 목표 open과 같은 기준)
//   4층부터는 앞 층을 연 뒤 흐른 해 + 모은 것. 흐른 해 = 해마다 기록(yearLog) 줄 수 — 철을 넘겨 센 누적(seasonRows가 아님), 비운 동안 따라잡기로 쌓인 줄도 셈(켜 두어야만 얻는 것 없음)
//   새 층(4층~)은 새해 3월 아침(월요일 6시, onSlot idx 0)에만 열림 — 꽃잠 가운데 · 흐르는 달 중간엔 안 열림. 수입 배율 없음 (P17-14)
// 저장 st.layers = { at: { 2: 연 때의 누적 해 수, 3: …, 4: … } } (없으면 null) — 새 철에도 이어짐 (SEASON_KEEP)
// LAYER_MAX_OPEN: 실제로 열 수 있는 가장 높은 층. 🌳 숲 탭 · 열림 알림은 L3(P30-01-03 · P30-03) 몫이라 그때까지 3 — 4층 조건 · 남은 것은 보이되 열리지는 않음
const LAYER_MAX_OPEN = 3;
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
  addLog(st, 9, LAYERS[N.layer].openText || `${N.icon} 정원의 ${N.layer}층 ${N.name}이 열렸어요`);   // 알림은 화면이 onLayer로 (L3) — 등급 줄처럼 ctx 없이
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
function yearlyBloom(st, cal) {   // 지금 다른 빛으로 피는 꽃 (지도 그림만 — 값 · 자람 · 수확 그대로) | null
  const it = yearlyNow(st, cal); return it && it.kind === 'bloom' ? it.flower : null;
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
    lines: ['아치 위에서 노래 연습 중이에요', '찌르르, 꽃 냄새가 좋아요', '오늘은 바람이 착해요'], spots: st => placedOf(st, 'arch') },
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
};
const VISITOR_KEYS = Object.keys(VISITORS);
const VISITOR_MAX = 2, VISITOR_P = 1 / 3, VISITOR_GIFT_AT = 3;   // 한꺼번에 앉는 손님 · 달마다 올 확률 · 몇 번째 온 날 기념품
const newVisitors = () => ({ now: [], times: {}, gift: {}, call: null });
const visitorsSt = st => (st.visitors = st.visitors || newVisitors());
const visitorOk = (st, k) => { const T = VISITORS[k]; return (!T.cond || T.cond(st)) && T.spots(st).length > 0; };   // 조건은 놓은 장식 · 핀 꽃 · 올해만 것으로만 (돈 · 등급 숫자 없음)
const cellTaken = (st, x, y) => !!flowerAt(st, x, y) || !!decoAt(st, x, y) || visitorsSt(st).now.some(v => v.x === x && v.y === y);
function visitorCells(st, k) {   // 조건 장식 · 꽃 바로 옆 빈 칸 (같은 칸은 한 번)
  const out = [], seen = {};
  for (const a of VISITORS[k].spots(st)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = a.x + dx, y = a.y + dy, id = y * W + x;
    if ((dx || dy) && x >= 0 && x < W && y >= 0 && y < H && !seen[id] && !cellTaken(st, x, y)) { seen[id] = 1; out.push([x, y]); }
  }
  return out;
}
const visitorWho = k => `${VISITORS[k].icon} ${josa(VISITORS[k].name, '이/가')}`;
function visitorArrive(st, k, cell, cal, rnd, ctx) {
  const V = visitorsSt(st), T = VISITORS[k];
  V.now.push({ k, x: cell[0], y: cell[1], at: cal.abs, left: 2 + (rnd() < 0.5 ? 1 : 0) });   // 2~3달
  const times = V.times[k] = (V.times[k] || 0) + 1;
  const text = `${visitorWho(k)} ${T.where}에 앉았어요`;
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
    const gone = !VISITORS[v.k] || !!flowerAt(st, v.x, v.y) || !!decoAt(st, v.x, v.y) || --v.left <= 0;
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
  return V.now.filter(v => VISITORS[v.k] && !flowerAt(st, v.x, v.y) && !decoAt(st, v.x, v.y)).map(v => {
    const T = VISITORS[v.k], L = T.lines;
    return { key: v.k, name: T.name, icon: T.icon, x: v.x, y: v.y, since: v.at, times: V.times[v.k] || 1, where: T.where,
      line: L[yearlyHash(`${gid}|vline|${v.k}|${cal.abs}`) % L.length] };   // 같은 손님 같은 달이면 같은 말
  });
}
const visitorAt = (st, x, y, cal) => visitorsOf(st, cal).find(v => v.x === x && v.y === y) || null;
const visitorTimes = (st, k) => (st.visitors && st.visitors.times && st.visitors.times[k]) || 0;
const visitorCall = (st, k) => { if (!VISITORS[k]) return false; visitorsSt(st).call = k; return true; };   // DEV 🐾 손님 부르기: 조건이 맞으면 다음 달에 꼭 옴

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
// 정원을 만든 현실 시각: 이름표 앞쪽이 만든 때(ms, 36진수) — 새 저장 칸 없이 (P20-06-06, 10-27). 예전 정원(이름표를 나중에 받음)은 이름표를 받은 때라 추정, 이상하면 null
function gardenBorn(st) {
  const t = parseInt(String((st && st.gardenId) || '').split('-')[0], 36);
  return t > Date.UTC(2026, 0, 1) && t < Date.UTC(2100, 0, 1) ? t : null;
}
// 불러오기 전에 보여 줄 요약 (JSON에서 막 읽은 정원에도 씀). born: 시작한 때 · flowers: 지금 정원에 있는 꽃 (P20-06-06)
function saveSummary(st) {
  const cal = calendar(st.virtual);
  return { year: yearOf(st, cal), season: seasonN(st), month: cal.month, money: st.money, dex: dexCount(st), dexTotal: dexTotal(st), titles: n0(st.titles), titleOn: st.titleOn || null,   // season: P28-08 몇 철 (드라이브 고르기)
    born: gardenBorn(st), flowers: (st.flowers || []).filter(f => !f.withered).length };
}
// P20-06-05 거의 새 정원 (10-27, 사용자 요청): 첫 안내 · 이웃의 화분 뒤로 직접 한 것이 없음. 저절로 일어나는 일(하루 용돈 · 화분이 피어 생기는
// 도감 · 1장 퀘스트 · 땅 · 칭호 문장 장식 · 쉼달의 한 해 기록)은 보지 않고, 직접 해야만 남는 흔적만 봄: 심기 · 사기 · 예약 · 수확 · 차 · 블렌딩 · 판매 · 돌보기 도구 · 장식 · 찻집 가꾸기 · 광산 · 선물
const EMPTY_DEX = ['petal', 'tea', 'teabag', 'bagBlend', 'blend', 'honey', 'mine', 'memento', 'letter'];
function freshGarden(st) {
  if (!st) return false;
  if (!st.onboarded) return true;
  const none = a => !a || a.every(x => x.gift === true || x.k === 'welcome' || !!x.mail), sh = st.shop || newShop();   // P22-05 꾸러미(gift) · 꽃집 할머니 편지 · 📮 운영자 편지(P29)는 받은 것이라 빼고 봄
  return (st.flowers || []).every(f => f.origin === '이웃')
    && ['items', 'reservations', 'pending', 'petals', 'teas', 'drying', 'dried', 'blends', 'cups', 'letterBox'].every(k => none(st[k]))
    && (st.decos || []).every(d => { const i = decoInfo(d.key); return !!(i && (i.title || i.extra)); })        // 칭호 문장 · 덤 장식만 (산 장식 없음)
    && Object.values(st.stats || {}).every(v => !v)                                                               // 판매 · 찻잔 · 주문 · 선물 · 광산
    && EMPTY_DEX.every(k => !st.dex || !st.dex[k] || Object.keys(st.dex[k]).every(x => k === 'letter' && x === 'welcome'))
    && st.water === 10 && st.shears === 5 && st.hoe === 10 && st.basket === 10 && !st.fert
    && sh.seats === 1 && (sh.cups || []).length <= 1 && (sh.signs || []).length <= 1;
}
// "어느 정원을 쓸까요?"(다른 정원) 전에: 한쪽이 거의 새 정원이면 묻지 않음. 이 기기가 새 정원이면(둘 다 새것이어도) 드라이브 것, 드라이브만 새것이면 이 기기 것, 아니면 null(묻기)
const freshPick = (localFresh, remoteFresh) => localFresh ? 'remote' : remoteFresh ? 'local' : null;
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
  ['처음부터 다시 시작한 때 resetAt (P16-12-03 완전 초기화, 10-27): 예전 정원은 null — 예전 재시작 정원도 계정 칭호를 이어 받던 그대로', s => { if (s.resetAt === undefined) s.resetAt = null; }],
  ['첫걸음 🌸 정원의 첫 꽃 돌보기 guide.pot (P22-02 변경 10-27): 이미 다른 단계를 했거나 · 마쳤거나 · 닫은 정원은 ✓', s => { const g = s.guide; if (g && !g.pot && Object.values(g).some(v => v === true)) g.pot = true; }],
  ['📈 해마다 기록 yearLog · 올해 쌓는 중 yearNow (P28-07-01, 10-27): 남은 한 해 기록(최근 10개)으로 해 · 점수 · 도감 · 주문을 채우고 수입 · 판 잔 · 꽃잎은 모름(null). 올해는 업데이트 뒤부터만 셈(part)', s => {
    if (!s.yearNow) s.yearNow = Object.assign(newYearNow(), { part: true });
    if (s.yearLog) return;
    s.yearLog = [];
    const recs = (s.records || []).slice().reverse();   // 옛 것부터
    recs.forEach((r, i) => {
      if (r.year == null) return;
      const older = recs[i - 1], cut = !older && (s.records || []).length >= 10;   // 10개를 넘어 잘린 기록 앞은 모름
      const orders = r.orders == null || cut ? null : r.orders - ((older && older.orders) || 0);
      addYearLog(s, { year: r.year, income: null, sold: null, harvest: null, orders, score: r.score == null ? null : r.score, grade: null, dex: r.dex == null ? null : r.dex, dexTotal: r.dexTotal == null ? null : r.dexTotal });
    });
  }],
  ['🐢 느긋하게 보기 settings.slow (P28-02, 10-27): 예전 정원은 꺼짐', s => { if (s.settings && s.settings.slow == null) s.settings.slow = false; }],
  ['🌱 정원 등급 grade (P28-05-01, 10-27): 예전 정원은 남은 기록으로 경험치를 어림 — 꽃잎은 말린 수 · 해마다 기록 중 큰 쪽, 판 잔 · 주문 · 퀘스트 · 도감 칸 · 남은 한 해 평가(최근 10개, 장식 · 선물 몫 빼고). 지난 해마다 기록의 grade는 모름(null) 그대로', s => {
    if (s.grade) return;
    const st = s.stats || {}, sum = k => (s.yearLog || []).reduce((a, r) => a + (r[k] || 0), 0) + ((s.yearNow && s.yearNow[k]) || 0);
    const n = {
      harvest: Math.max(st.dried || 0, sum('harvest')), sell: Math.max(st.cups || 0, sum('sold')), order: st.orders || 0, quest: n0((s.journal || {}).done),
      dex: Math.max(0, gradeDexCount(s) - 1),   // 처음부터 있는 거친 땅 한 칸은 빼고
      year: (s.records || []).reduce((a, r) => a + (r.score == null ? 0 : r.scoreParts ? yearXpOf({ total: r.score, parts: r.scoreParts }) : r.score), 0),
    };
    s.grade = newGrade(); s.grade.dex = gradeDexCount(s);
    for (const k in n) { const v = Math.round(XP[k] * n[k]); if (v) { s.grade.by[k] = v; s.grade.xp += v; } }
  }],
  ['📈 그래프 견줌 yearPace (P28-07-02, 10-28): 달마다 쌓인 수입 · 경험치 — 예전 정원은 올해 시작 값을 몰라(xp0 null) 다음 쉼달 기록부터 셈', s => { if (!s.yearPace) s.yearPace = newYearPace(null); }],
  ['🗓️ 주마다 바뀌는 목표 weekly (P28-09, 10-28): 예전 정원은 null — 다음 확인 때 이번 주 목표를 뽑음', s => { if (s.weekly === undefined) s.weekly = null; }],
  ['🧺 정원 저장고 pantry (P28-04, 10-28): 예전 정원은 빈 저장고 — 연 뒤부터 쌓임 (지난 시간을 거슬러 채우지 않음)', s => { if (!s.pantry) s.pantry = newPantry(); }],
  ['🎁 첫 방문 꾸러미 · 🍵 첫 손님 firstGuest (P22-05, 10-28): 예전 정원은 꾸러미 없음(false) — 아직 화분을 받지 않은 정원은 화분과 함께 받음', s => { if (s.firstGuest === undefined) s.firstGuest = false; }],
  ['📮 운영자 편지 받은 기록 mailGot (P29, 10-28): 예전 정원은 빈 기록 — 지금 기간인 편지는 다음에 열 때 받음', s => { s.mailGot = s.mailGot || {}; }],
  ['🌟 등급 보너스 bonus (P28-05-02, M3-1 10-29): 예전 정원은 모든 칸 0단계 — 🌟 손길 점은 지금 등급으로 바로 셈', s => { s.bonus = Object.assign(newBonus(), s.bonus); }],
  ['🌸 새 철 season (P28-08-03, M3-3 10-30): 예전 정원은 1철 · 시작한 때는 모름(null) · 해마다 기록 줄과 한 해 기록 카드는 1철', s => {
    if (!s.season) s.season = newSeason();
    for (const r of [...(s.yearLog || []), ...(s.records || [])]) if (r.season == null) r.season = 1;
  }],
  ['🌳 정원의 층 layers (P30-01-01, L1-1 10-30): 이미 찻집 · 광산을 연 정원은 2 · 3층 연 해 = 업데이트한 해(지금 해마다 기록 줄 수) — 4층이 한꺼번에 열리지 않게', s => {
    if (!s.layers) { s.layers = newLayers(); layerSync(s); }
  }],
  ['🗓️ 올해만 오는 것 yearly (P30-05-01, L1-3 10-30): 예전 정원은 빈 달력 — 다음에 열 때부터 셈 (지난 계절을 놓친 것으로 치지 않음)', s => { if (!s.yearly) s.yearly = newYearly(); }],
  ['🐾 특별 손님 visitors (P30-06-01, L1-6 10-30): 예전 정원은 아무도 안 온 정원 — 다음 달부터 조건이 맞으면 옴', s => { if (!s.visitors) s.visitors = newVisitors(); }],
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
// P28-08 열린 질문 ③: local · remote에 season(몇 철, saveSummary)이 있으면 결과에 seasons { local, remote }와, 철이 다를 때 먼저 보여 줄 쪽 first(철이 큰 쪽)를 붙임
//   새 철은 같은 정원 이름표 그대로라(완전 초기화 resetAt과 다름) 같은 정원으로 보고 시각으로 고르되, 이 기기에서 처음 맞추는데 철이 다르면 늦은 쪽을 자동으로 고르지 않고 묻기 (season)
function cloudDecide(local, base, remote) {
  const d = cloudDecide0(local, base, remote), ls = local && local.season, rs = remote && remote.season;
  if (!ls || !rs) return d;
  const out = Object.assign({}, d, { seasons: { local: ls, remote: rs } });
  if (ls !== rs) out.first = rs > ls ? 'remote' : 'local';
  return out;
}
function cloudDecide0(local, base, remote) {
  if (!remote || !remote.gardenId) return { act: 'local', why: 'empty' };
  // 이 기기가 본 뒤로 드라이브가 그대로면 이 기기 것이 맞음 (처음부터 다시 시작 · 파일 불러오기로 정원이 바뀐 경우도)
  if (base && remote.gardenId === base.gardenId && remote.savedAt <= base.savedAt) return { act: 'local', why: 'mine' };
  if (remote.gardenId !== local.gardenId) return { act: 'ask', why: 'other' };           // 다른 정원 (P20-06-03)
  const act = local.actAt || 0;
  if (base && base.gardenId === local.gardenId)                                          // 다른 기기에서 저장함 (P20-06-04)
    return act <= base.savedAt ? { act: 'remote', why: 'newer' } : { act: 'ask', why: 'both' };   // 이 기기도 그 뒤에 손댔으면 둘 다 바뀐 것
  // 이 기기에서 처음 맞춤: 늦은 쪽 (P20-06-02), 1분 안이면 묻기 · 철이 다르면 묻기 (P28-08 ③ — 옛 철 정원이 새 철을 덮지 않게)
  if (local.season && remote.season && local.season !== remote.season) return { act: 'ask', why: 'season' };
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
  if (st.titles.t_visit != null || st.resetAt) return false;            // 처음부터 다시 시작한 정원엔 이어 붙이지 않음 (P16-12-03 변경 10-27) — 첫 안내에서 다시 얻음
  const cal = calendar(st.virtual);
  if (st.journal.done.c0_visit == null) st.journal.done.c0_visit = cal.abs;
  giveTitle(st, 't_visit', cal, ctx, true); st.account.gave = true;
  addLog(st, 11, '☁️ 계정의 첫 방문 날짜로 「정원 문을 연 사람」을 이어 붙였어요', ctx);
  return true;
}
// P20-16 구름 정원사 (10-27): 처음 로그인해 드라이브와 맞춘 정원에 덤 칭호 + 구름 돌. 얻는 연출은 계정마다 한 번
//  has: 이 정원이 이미 받음 · rewardedAt: 계정이 처음 받은 때(드라이브 · 이 기기 기록, 모르면 null)
//  reset: 처음부터 다시 시작한 정원 (P16-12-03 변경 10-27) — 계정에서 이어 받지 않고 로그인해서 다시 얻음 (연출도 다시)
//  → { give: 이 정원에 줄지, show: 얻는 연출을 띄울지 } — 이미 받은 계정이면 새 기기 정원에 조용히 이어 붙임
const cloudRewardPlan = (has, rewardedAt, reset) => ({ give: !has, show: !has && (!rewardedAt || !!reset) });
// 정원에 줌 (돈 · 씨앗은 주지 않음). 줬으면 { at: 계정이 받은 때(처음이면 now), show }, 이 정원이 이미 받았으면 null
function giveCloudReward(st, rewardedAt, now, ctx) {
  st.titles = st.titles || {};
  const p = cloudRewardPlan(st.titles.t_cloud != null, rewardedAt, st.resetAt);
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
  DAILY_GIFT, HOUR, W, H, MONTHS, josa, SEASONS, MONTH_H, monthName, calendar, calendarAfterFlow, untilMonth, yearOf, canReset, resetKeys,
  FLOWERS, FLOWER_KEYS, FORM, LIFE, LANDS, LAND_KEYS, LIFE_MIN, classify, landOf, landCounts, flowerEconomy, harvestsPerYear, HARVEST_PETALS, ECON_Q,
  stars, pct, germOf, qualityRadius, stageRadius, STAGE, computeStage, landMatch, vigorOf, monthlyChange,
  teaShopOpen, hoursToShopOpen, CUP_SELL_H, SEATS, CUP_SETS, SIGNS, shopOf, cupSellH, addSeat, buyDecor, autoSell, bagBlends, brew, sellCups, cupValue, cupCold, COLD_RATE, propCount, teaValue, teaItemValue, isHat, makeRaw, HAT_RATE, RAW_RATE, RAW_DECAY, isFresh, seasonKey, reservationPrice, deliverIdxOf, reservedCount, cartSummary,
  create, advance, addLog, slowView, compostable, compostItems, autoCompost, COMPOST_Q, TOOLS, canCare, harvestSlot, canMoveNow, propGrown, propYearOf, care, careAll, careAllTargets, CARE_SUPPLY, buy, buySupply, SUPPLIES, reserve, plant, propagate, move, makeTea, sellTea,
  guideKeys, guideFill, guideTap, potFlower,
  flowerAt, dexCount, DEX_TOTAL, dexTotal, blendKeys, CHAPTERS, QUESTS, TITLES, TITLE_KEYS, EXTRA_TITLE_KEYS, chapterOpen, chapterDone, checkJournal, setTitleOn, newGardenId, saveSummary, makeSave, parseSave, SAVE_FORMAT, MIGRATIONS, migrateSave, CLOUD_GAP, cloudDue, cloudAutoOk, cloudTokenUse, cloudDecide, freshGarden, freshPick, gardenBorn, firstVisitOf, applyAccount, cloudRewardPlan, giveCloudReward, inAppBrowser, outsideUrl, DECOS, DECO_KEYS, EXTRA_DECO_KEYS, decoInfo, decoTotal, decoCount, decoExtras, decoOffer, decoAt, buyDeco, placeDeco, storeDeco, decoMonths, firstFlower, questName, questWhenOf, GIFT_BY_MONTH, giftPot, STARTER_BLEND, starterText, firstGuest, firstGuestReady, MAIL_CATS, MAIL_WARN, MAIL_MAX, MAIL_LEN, kstDay, mailGiftOk, mailValue, mailCheck, mailFor, mailDeliver, mailOf, mailGiftText, mailTake, trimLetterBox, LETTER_BOX_MAX, MINE_W, MINE_H, MINE_MAX_E, MINE_REGEN_H, MINE_DEEPEST, ORES, FOSSILS, ORE_KEYS, FOSSIL_KEYS, MINE_DEX_KEYS, mineName, mineOf, mineRegen, dig, descend, mineUp, toDeepest, freshBoard, CRAFTS, CRAFT_KEYS, canCraft, craft, mineCount, GIFTS, GIFT_KEYS, LETTERS, LETTER_KEYS, letterCount, giftsOf, sendGift, deliverLetters, letterLeftFor, RETURNS, RETURN_V, RETURN_WHERE, pickReturn, giveReturn, returnValue, returnName, returnText, returnEV, letterOf, MEMENTOS, MEMENTO_KEYS, mementoCount, orderText, orderMatch, makeOrders, fillOrder, yearScore, yearLogOf, newYearNow, yearMonth, newYearPace, graphAxis, graphYears, yearDiff, yearDiffOf, yearPace, XP, GRADE_TIERS, gradeCost, gradeName, gradeAt, gradeOf, addXp, gradeDexSync, gradeView, gradeBadge, gradeAlerts, gradeAwayLine, gradeUpText, gradeUnlockText, isGradeUpLine, gradeXpAt, GRADE_BY, gradeDexCount, newGrade, WEEKLY, WEEKLY_KEYS, WEEKLY_TIERS, WEEKLY_XP, WEEKLY_BONUS, weeklyText, weeklyRoll, weeklyOf, weekNote, weeklyFinish, weeklyView, weeklySnap, weeklyAwayLine, isWeeklyLine, PANTRY_H, PANTRY_CYCLE, PANTRY_CAPS, PANTRY_ITEMS, PANTRY_KEYS, pantryOf, pantryCap, pantryDayValue, pantryTick, takePantry, pantryView, pantryCounts, GRADE_DECO_KEYS, gradeDecoOffer, HONEY_R, HIVE_MAX, HONEY_KEYS, honeyName, hiveBlooms, honeyOf, hiveTick, takeHoney, honeyCup, honeyCount, BARREL_R, barrelTick, AUTO_KEYS, AUTO_R, AUTO_Q, placedOf, basketReach, basketFlowers, basketBlooms, basketTick, autoStats, isAutoLine, autoAwayLines, RACK_N, rackN, rackTick, BONUS, BONUS_KEYS, BONUS_PER, BONUS_COST, newBonus, bonusMax, bonusLevel, bonusVal, bonusCostTo, bonusPoints, bonusUsed, bonusLeft, bonusMaxed, bonusSet, bonusView, catchUpH, SEASON_YEARS, SEASON_TITLES, SEASON_KEEP, newSeason, seasonN, seasonRows, seasonReady, seasonCanStart, seasonHint, seasonBadge, seasonBreaks, seasonStart, LAYERS, LAYER_MAX_OPEN, newLayers, layerYears, layerNow, layerOf, layerSync, layerCheck, YEARLY, YEARLY_KEYS, YEARLY_ROWS, newYearly, yearlyNo, yearlyOf, yearlyTick, yearlyMark, yearlyNow, yearlyMissedAll, yearlySeen, yearlyCount, yearlyDex, yearlyPast, yearlyBloom, VISITORS, VISITOR_KEYS, VISITOR_MAX, VISITOR_P, VISITOR_GIFT_AT, newVisitors, visitorOk, visitorCells, visitorTick, visitorsOf, visitorAt, visitorTimes, visitorCall, ORDER_MEMENTO_KEYS, helperKeep, helperTick, autoLineType, GEAR, growRate, DRY_H, BLENDS, BLEND_KEYS, BLEND_RATE, RECIPE_RATE, blendRate, blendRecipe, blendValue, dryPetals, makeTeaDried, blend, sellBlends,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
