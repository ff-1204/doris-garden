// 도리의 정원 — 게임 규칙 엔진 조각 4/10: 물건 · 행동
// P66(11-03): 예전 한 파일 engine.js(줄 887 ~ 1363)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
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
  if (!Number.isInteger(n) || n < 1 || n > 99) return no('한 번에 1~99개까지 살 수 있어요');
  if (!F || !Object.prototype.hasOwnProperty.call(FLOWERS, type)) return no('팔지 않는 꽃이에요');
  if (cal.frozen) return no('꽃잠엔 화원이 쉬어요 · 다음 해 씨앗은 예약할 수 있어요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} 심는 달에만 팔아요`);
  const cost = F.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost;
  for (let i = 0; i < n; i++) st.items.push(newItem(st, type, seedQ(st), '화원'));   // P41 R-05 처음 품질 = 정원 등급
  return ok(`${F.name} ${FORM[F.form].name} ${n}${FORM[F.form].unit}를 샀어요`);
}

// 화원 소모품: 비료 1개 = 1번, 물병 1개 = 물 주기 1번, 호미 1개 = 잡초 뽑기 10번, 가위 1개 = 가지치기 5번, 바구니 1개 = 수확 10번. 꽃잠에도 팔아요
const SUPPLIES = {
  fert: { name: '비료', icon: '🌱', price: 150, per: 1, unit: '개', desc: '한 포기에 주면 12시간 동안 품질이 올라요' },
  water: { name: '물병', icon: '💧', price: 50, per: 1, unit: '개', desc: '물병 1개로 한 포기에 물을 줘요 · 하루 동안 괜찮아요' },
  hoe: { name: '호미', icon: '⛏️', price: 400, per: 10, unit: '번', desc: '호미 1개로 잡초를 10번 뽑을 수 있어요' },
  basket: { name: '바구니', icon: '🧺', price: 500, per: 10, unit: '번', desc: '바구니 1개로 꽃잎을 10번 거둘 수 있어요' },
  shears: { name: '가위', icon: '✂️', price: 500, per: 5, unit: '번', desc: '가위 1개로 가지치기를 5번 할 수 있어요' },
};
function buySupply(st, kind, n) {
  const S = Object.prototype.hasOwnProperty.call(SUPPLIES, kind) ? SUPPLIES[kind] : null; n = n == null ? 1 : n;
  if (!S) return no('팔지 않는 물건이에요');
  if (!Number.isInteger(n) || n < 1 || n > 99) return no('한 번에 1~99개까지 살 수 있어요');
  const cost = S.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost; st[kind] = (st[kind] || 0) + S.per * n;
  return ok(`${S.name} ${n}개를 샀어요`);
}

// P72-03 💐 꽃잎 사기 (11-04 사용자 확정): 화원에서 꽃잎을 돈으로 — 한 장 값은 그 꽃 차 기본값(teaBase = ★3 티백 한 잔)의 50%, 품질은 '보통' 50%
//   50% = ★3 칸의 가운데(ECON_Q 대표값 — teaBase가 이 품질의 찻값) · 💐 화원 씨앗 처음 품질의 바탕(SEED_Q0)과 같은 값. 등급으로 오르지 않음
//   산 꽃잎은 제다실로(⚙️ 자동 건조기가 있으면 바로 꽃방에) · 돈으로 사기라 경험치 · 주간 목표 · 도감 꽃잎 등록 · 올해 거둔 꽃잎은 없음 (P17-14 · P54)
// P74-01 (11-04 사용자 확정): 산 꽃잎을 말려 팔면 산 값의 두 배가 남던 것 → 값 60% · 품질 ★1 10%. 찻값 = teaBase × (0.5 + q)라 한 잔 0.6 × teaBase = 산 값과 같음(꽃잠 ×1.3 · 블렌드 배율에선 조금 남음)
const PETAL_BUY_RATE = 0.6, PETAL_BUY_Q = 0.1;
const petalPrice = k => Math.round(FLOWERS[k].teaBase * PETAL_BUY_RATE / PETAL_BASE / 10) * 10;   // P77-C 꽃잎 한 장 = 티백 1/petals · 한 장 값 teaBase/5 × 60%
function buyPetal(st, type, n) {
  const F = Object.prototype.hasOwnProperty.call(FLOWERS, type) ? FLOWERS[type] : null; n = n == null ? 1 : n;
  if (!F) return no('팔지 않는 꽃잎이에요');
  if (!Number.isInteger(n) || n < 1 || n > 99) return no('한 번에 1~99장까지 살 수 있어요');
  const cost = petalPrice(type) * n;
  if (st.money < cost) return no('돈이 모자라요');
  const cal = calendar(st.virtual);
  st.money -= cost;
  for (let i = 0; i < n; i++) st.petals.push({ id: nid(st), type, q: PETAL_BUY_Q, seasonKey: seasonKey(st, cal) });
  const hung = autoDryTick(st);
  return ok(`${F.name} 꽃잎 ${n}장을 샀어요 · ${hung ? '⚙️ 자동 건조기가 꽃방에 널었어요' : '제다실로 보냈어요'}`, { count: n, cost });
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
  if (!cal.frozen) return no('예약은 꽃잠(일요일)에 할 수 있어요');
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
  return ok(`예약했어요 (${cost.toLocaleString('ko-KR')}원) · 심는 날 아침에 와요`, { cost });
}
function cartSummary(st, cart) {
  const cal = calendar(st.virtual), year = yearOf(st, cal) + 1;
  return cart.filter(c => c.qty > 0).map(c => {
    const F = FLOWERS[c.type], di = deliverIdxOf(c.window);
    const win = F.windows.find(w => w[0] === c.window);
    return { F, qty: c.qty, year, deliverMonth: MONTHS[di], window: win, unit: reservationPrice(F), total: reservationPrice(F) * c.qty };
  });
}

function plant(st, itemId, x, y, rng, ctx) {     // P06-01-05, P06-07-07-f
  rng = rng || defaultRng;   // R-D2
  const cal = calendar(st.virtual);
  const it = st.items.find(i => i.id === itemId);
  if (!it) return no('창고에 없어요');
  const F = FLOWERS[it.type];
  if (cal.frozen) return no('꽃잠엔 심기도 쉬어요 · 월요일 아침에 정원이 깨어나요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} ${F.sow.map(monthName).join('·')}에 심을 수 있어요`);
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('이 자리엔 꽃이 있어요 · 빈 칸을 골라 주세요');
  if (decoAt(st, x, y)) return no('이 자리엔 장식이 있어요 · 빈 칸을 골라 주세요');
  const g = germOf(it);
  if (g <= 0) return no(`${josa(FORM[F.form].rate, '이/가')} 0%예요 · 창고에서 비료로 만들 수 있어요`);
  st.items.splice(st.items.indexOf(it), 1);
  if (rng() >= g) {
    addFert(st, 1);
    return ok(F.form === 'seed' ? '이번엔 쉬어 가나 봐요. 싹이 트지 않은 씨앗은 비료가 됐어요' : '이번엔 뿌리를 내리지 못했어요. 비료가 됐어요', { failed: true });
  }
  const warm = monthDecoLift(st, it, cal);                                     // P35-01 그 달의 장식이 그 달 꽃을 반김 (씨앗 품질 최소 90%)
  const q0 = warm ? MONTH_DECO_Q : it.q;
  const f = {
    id: nid(st), type: it.type, x, y, q: q0, startQ: q0, origin: it.origin, parent: it.parent,
    ageH: 0, stage: F.form === 'seed' ? 'germ' : 'young', bloomed: false, withered: false,
    waterH: 0, weedH: 24, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 24 * titlePerk(st, 'adapt'),   // P52 🪴   // 심은 직후는 목마름 (물은 직접, 10-06) · 흙은 고른 상태
    harvestKey: -1, bloomKey: -1, propYear: null, propRest: false, plantedYear: yearOf(st, cal),
  };
  st.flowers.push(f); addXp(st, 'plant', 1, ctx);   // P54 싹이 튼 것만 (안 튼 씨앗은 비료)
  if (it.mut) f.mut = true;                                                   // P36 변이 씨앗 · 묘목 (처음 필 때 드러남)
  return ok(`${josa(F.name, '을/를')} 심었어요${warm ? ` · 🪴 ${josa(warm.name, '이/가')} 반겨${slowView(st) ? '요' : ` 품질 ${pct(MONTH_DECO_Q)}%로`}` : ''}`, { flower: f, warm: !!warm });
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
    case 'harvest': return !f.mut && f.stage === 'bloom';   // P36-02 변이 꽃은 꽃잎을 딸 수 없음   // 꽃잠엔 핀 채로 잠든 꽃만 (새로 피지 않음) · P72-01 거두면 다 자람으로 돌아가 한 달 한 번(harvestKey) 대신 다시 필 때까지
  }
  return false;
}
// R-B1 (11-05 사용자 "모두 물 주기도 제외 · 곤충이 해준 횟수는 목표에 포함"): opts.all = 한꺼번에 돌보기(careAll)에서 온 것 — 주간 목표엔 세지 않음(경험치 · 도감 · 올해 거둔 꽃잎은 그대로). 곤충은 insectCareTick이 weekNote
function care(st, tool, tiles, ctx, opts) {      // P13 · 꽃잠에도 돌보기 · 수확 (P04-01-09, 효과 시간은 흐르는 시간에만 줄어듦)
  const cal = calendar(st.virtual);
  const targets = tiles.map(([x, y]) => flowerAt(st, x, y)).filter(f => canCare(st, f, tool, cal));
  if (!targets.length) return no('돌볼 꽃이 없어요');
  if (tool === 'fert' && st.fert < targets.length) return no(`비료가 ${targets.length - st.fert}개 모자라요`); // P13-06-01-c
  if (tool === 'water' && (st.water || 0) < targets.length) return no(st.water ? `물병이 ${targets.length - st.water}개 모자라요` : '물병이 없어요 · 창고에서 살 수 있어요');
  if (tool === 'weed' && (st.hoe || 0) < targets.length) return no(st.hoe ? `호미가 ${targets.length - st.hoe}번 모자라요` : '호미가 없어요 · 창고에서 살 수 있어요');
  if (tool === 'harvest' && (st.basket || 0) < targets.length) return no(st.basket ? `바구니가 ${targets.length - st.basket}번 모자라요` : '바구니가 없어요 · 창고에서 살 수 있어요');
  if (tool === 'prune' && (st.shears || 0) < targets.length) return no(st.shears ? `가위가 ${targets.length - st.shears}번 모자라요` : '가위가 없어요 · 창고에서 살 수 있어요');
  const p0 = st.petals.length;   // P77-C 거둔 장수 (메시지)
  for (const f of targets) {
    if (tool === 'water') { f.waterH = waterSet(st, f); f.thirstH = 0; st.water--; }        // 유지: 2달 (P44-04 💧 돌 물확 둘레는 2달 반)
    if (tool === 'weed') { f.weedH = 24; st.hoe--; if (++st.weedCount % 5 === 0) addFert(st, 1); }
    if (tool === 'prune') { f.pruneH = 12; st.shears--; if (++st.pruneCount % 3 === 0) addFert(st, 1); } // 향상: 1달
    if (tool === 'fert') { f.fertH = 12; st.fert--; }
    if (tool === 'harvest') {                                                    // P12-05
      pickFlower(f, cal); st.basket--;                                          // P72-01 다시 다 자람 → RIPE_H 뒤 다시 핌
      const got = harvestCount(FLOWERS[f.type], ctx && ctx.rng);                 // P77-C 1 ~ 꽃잎 수(F.petals)장 고르게
      for (let n = 0; n < got; n++) st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) });
      yearAdd(st, 'harvest', got); addXp(st, 'harvest', got, ctx);   // P28-07-01 올해 거둔 꽃잎 · P28-05-01 등급 경험치
      const two = f.origin === '이웃' && !f.giftPicked;
      if (two) { f.giftPicked = true; st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) }); yearAdd(st, 'harvest', 1); addXp(st, 'harvest', 1, ctx); }   // 화분 첫 수확은 2장 (QA 6회차)
      const bf = harvestYear(st, f, cal);                                        // P39-03 🦋 나비 둘레 꽃의 그해 첫 수확은 꽃잎 +1장
      if (bf) { st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) }); yearAdd(st, 'harvest', 1); addXp(st, 'harvest', 1, ctx); }
      if (!(opts && opts.all)) weekNote(st, 'harvest', { type: f.type, q: f.q }, got + (two ? 1 : 0) + bf, ctx);       // P28-09 이번 주 목표 · R-B1 모두 거두기는 안 셈
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); } // P08-02-02
    }
  }
  if (tool !== 'harvest') { if (!(opts && opts.all)) weekNote(st, 'care', { tool }, targets.length, ctx); addXp(st, tool, targets.length, ctx); }   // R-B1 모두 물 주기는 목표에 안 셈   // P28-09 · P54 돌보기 한 포기마다 (손으로 한 것만 — 곤충은 insectTick에서 bugCare로, P54-02)
  flushPending(st, ctx);
  const two = tool === 'harvest' && targets.length === 1 && targets[0].origin === '이웃' && st.petals.filter(p => p.type === targets[0].type).length >= 2 && targets[0].harvestKey === harvestSlot(cal);
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: `꽃잎 ${st.petals.length - p0}장을 거둬 제다실로 보냈어요${two ? ' (화분 첫 수확 덤 한 장)' : ''}` }[tool];   // P77-C 장수
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
  if (!have) return no(kind === 'fert' ? '비료가 없어요 · 창고에서 살 수 있어요' : `${josa(S[1], '이/가')} 없어요 · 창고에서 살 수 있어요`);
  const pick = all.slice(0, have), p0 = st.petals.length;
  const r = care(st, kind, pick.map(f => [f.x, f.y]), ctx, { all: true });   // R-B1 주간 목표엔 안 셈
  if (!r.ok) return r;
  const n = pick.length, unit = unitOf(pick), left = st[S[0]] || 0, petals = st.petals.length - p0;
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: `꽃잎 ${petals}장을 거뒀어요` }[kind];
  const msg = n < all.length ? `${josa(S[1], '이/가')} 모자라 ${n}${unit}만 ${word}` : `${n}${unit}에 ${word} · ${S[1]} ${left}${S[2]} 남았어요`;
  return ok(msg, { count: n, need: all.length, short: all.length - n, left, petals });
}

function propagate(st, flowerId, rng, ctx) {     // P06-02-05
  rng = rng || defaultRng;   // R-D2
  const cal = calendar(st.virtual), f = st.flowers.find(x => x.id === flowerId);
  if (!f || f.withered) return no('번식할 꽃이 없어요');
  const F = FLOWERS[f.type], yr = propYearOf(st, cal);   // 꽃잠에 한 번식은 새해 몫 (P04-01-09)
  if (F.prop === '채종') return no('한해살이는 시들 때 씨앗을 저절로 남겨요');
  if (!propGrown(f)) return no('다 자라면 번식할 수 있어요');
  if (!cal.frozen && !F.propMonths.includes(cal.month)) return no(`${josa(F.prop, '은/는')} ${F.propMonths.map(monthName).join('·')}에 할 수 있어요`);
  if (f.propYear === yr) return no(cal.frozen ? '이 꽃은 새해 몫 번식을 이미 했어요' : f.propRest ? '이 꽃은 꽃잠에 새해 몫 번식을 했어요' : '이 꽃은 올해 벌써 번식했어요 · 새해에 다시 돼요');
  f.propYear = yr; f.propRest = !!cal.frozen;   // 꽃잠에 했는지 (QA 19회차: 다음 해 문구)
  weekNote(st, 'prop', null, 1, ctx); addXp(st, 'prop', 1, ctx);   // P28-09 · P54
  const n = propCount(f.q), qs = [], half = insectNear(st, 'hive', f);   // P39-06-01 🐝
  for (let i = 0; i < n; i++) qs.push(propQuality(f.q, rng, half, titlePerk(st, 'prop')));
  const muts = f.mut ? qs.map((q, i) => mutSeed(st, f, i, cal)) : null;      // P36-01 변이 꽃의 번식은 하나마다 50%
  const formName = FORM[F.form].name;
  if (F.prop === '꺾꽂이' || F.prop === '접붙이기') {
    st.pending.push(Object.assign({ id: nid(st), type: f.type, qs, dueH: MONTH_H, parent: F.name, method: F.prop }, muts ? { muts } : {}));
    return ok(`${josa(F.prop, '을/를')} 했어요 · ${cal.frozen ? '정원이 깨어나고 ' : ''}${timeText(MONTH_H)} 뒤 ${formName} ${n}개가 창고에 들어와요`);
  }
  qs.forEach((q, i) => { const it = newItem(st, f.type, q, '번식', F.name); if (muts && muts[i]) it.mut = true; st.items.push(it); });
  return ok(`${josa(F.prop, '으로/로')} ${formName} ${n}개를 얻었어요`);
}

function move(st, flowerId, x, y, ctx) {         // P13-03
  const cal = calendar(st.virtual), f = st.flowers.find(z => z.id === flowerId);
  if (!f || f.withered) return no('옮길 꽃이 없어요');
  const F = FLOWERS[f.type];
  if (!canMoveNow(f, cal)) return no('심는 달 · 쉬는 달 · 꽃잠에 옮길 수 있어요');   // 꽃잠엔 모든 꽃 (P04-01-09)
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('그 자리엔 꽃이 있어요 · 빈 칸을 골라 주세요');
  if (decoAt(st, x, y)) return no('그 자리엔 장식이 있어요 · 빈 칸을 골라 주세요');
  f.x = x; f.y = y; f.adaptH = 24 * titlePerk(st, 'adapt');   // P52 🪴
  if (f.movedXp !== cal.abs) { f.movedXp = cal.abs; addXp(st, 'move', 1, ctx); }   // P54 꽃마다 정원 달에 한 번 (이리저리 옮겨 경험치만 벌지 않게)
  return ok(`${josa(F.name, '을/를')} 옮겨 심었어요 · ${cal.frozen ? '정원이 깨어나면 ' : ''}${timeText(24)} 동안 새 자리에 적응해요`);
}

// P08-04: 제다실에서 만든 것은 티백 (찻집으로 보내는 형태). 티백은 처음 만들 때, 차는 찻집에서 처음 우려 팔 때 도감에
function regTeabag(st, type, ctx) {
  st.dex.teabag = st.dex.teabag || {};
  if (!st.dex.teabag[type]) { st.dex.teabag[type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[type].name} 티백`, ctx); }
}
// P77-C 티백 하나 = 같은 꽃 꽃잎 F.petals장 (품질은 좋은 것부터 petals장의 평균 · seasonKey는 첫 장). 고른 꽃잎을 꽃마다 묶어 만들 수 있는 만큼 만들고 남는 장은 그대로 둠 → { bags, used, short }
function bagPetals(st, pool, list, make) {
  const byType = {}; for (const p of list) (byType[p.type] = byType[p.type] || []).push(p);
  let bags = 0, used = 0; const short = [];
  for (const [type, ps] of Object.entries(byType)) {
    const N = FLOWERS[type].petals; ps.sort((a, b) => b.q - a.q);
    if (ps.length < N) short.push(`${FLOWERS[type].name} ${N - ps.length}장`);
    for (let i = 0; i + N <= ps.length; i += N) {
      const take = ps.slice(i, i + N), q = take.reduce((a, p) => a + p.q, 0) / N;
      for (const p of take) pool.splice(pool.indexOf(p), 1);
      make(type, q, take[0]); bags++; used += N;
    }
  }
  return { bags, used, short };
}
const bagShortMsg = r => `티백 하나에 꽃잎이 꽃마다 정해진 수만큼 들어가요 · ${r.short.join(' · ')} 더 모아요`;
function makeTea(st, ids, ctx) {                 // P12-03 · P77-C petals장마다 하나
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요 · 핀 꽃에서 거둬 와요');
  const r = bagPetals(st, st.petals, list, (type, q, p0) => {
    st.teas.push({ id: nid(st), type, q, seasonKey: p0.seasonKey, hat: isHat(q) });
    regTeabag(st, type, ctx);
    if (!st.yearBest || q > st.yearBest.q) st.yearBest = { type, q };
  });
  if (!r.bags) return no(bagShortMsg(r));
  weekNote(st, 'teabag', null, r.bags, ctx); addXp(st, 'teabag', r.bags, ctx);   // P28-09 · P54
  return ok(`꽃잎 ${r.used}장으로 티백 ${r.bags}개를 만들었어요`);
}
// P12-10 생화 티백 (예전 생차): 생화를 말리지 않고 티백으로. 값 −10% (10-06)
function makeRaw(st, ids, ctx) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요 · 핀 꽃에서 거둬 와요');
  const r = bagPetals(st, st.petals, list, (type, q, p0) => {
    st.teas.push({ id: nid(st), type, q, seasonKey: p0.seasonKey, hat: isHat(q), raw: true });
    regTeabag(st, type, ctx);
    if (!st.yearBest || q > st.yearBest.q) st.yearBest = { type, q };
  });
  if (!r.bags) return no(bagShortMsg(r));
  weekNote(st, 'teabag', null, r.bags, ctx); addXp(st, 'teabag', r.bags, ctx);   // P54
  return ok(`꽃잎 ${r.used}장으로 생화 티백 ${r.bags}개를 만들어 찻집으로 보냈어요`);
}
// P12-07 꽃방: 꽃잎을 널면 1달(흐르는 시간) 뒤 말린 꽃잎이 됨. 언제든 널 수 있음
function dryPetals(st, ids, ctx) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('널 꽃잎이 없어요 · 핀 꽃에서 거둬 와요');
  for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H }); }
  bump(st, 'dried', list.length); weekNote(st, 'dry', null, list.length, ctx); addXp(st, 'dry', list.length, ctx);   // P28-09 · P54
  return ok(`꽃잎 ${list.length}장을 꽃방에 널었어요. ${dryText(dryRate(st))} 뒤에 다 말라요${calendar(st.virtual).frozen ? ' (꽃잠엔 멈춰요)' : ''}`);
}
// P12-07-04: 말린 꽃잎으로도 차를 만들 수 있음 (제철 보너스는 없음)
function makeTeaDried(st, ids, ctx) {
  const list = st.dried.filter(p => ids.includes(p.id));
  if (!list.length) return no('말린 꽃잎이 없어요 · 꽃방에 널어 말려요');
  const r = bagPetals(st, st.dried, list, (type, q) => {
    st.teas.push({ id: nid(st), type, q, seasonKey: -1, hat: isHat(q) });
    regTeabag(st, type, ctx);
    if (!st.yearBest || q > st.yearBest.q) st.yearBest = { type, q };
  });
  if (!r.bags) return no(bagShortMsg(r));
  weekNote(st, 'teabag', null, r.bags, ctx); addXp(st, 'teabag', r.bags, ctx);   // P54
  return ok(`말린 꽃잎 ${r.used}장으로 티백 ${r.bags}개를 만들었어요`);
}
// P12-08 블렌딩: 언제든 (변경 10-06, 예전엔 꽃잠에만), 서로 다른 말린 꽃잎 2~3장으로 블렌딩 차 1잔
function blend(st, ids, ctx) {
  const cal = calendar(st.virtual);
  const picked = st.dried.filter(p => ids.includes(p.id)), parts = [...new Set(picked.map(p => p.type))];   // P77-C 고른 건 꽃 종류 — 꽃마다 좋은 것부터 petals장(티백 하나 몫)씩
  if (parts.length < 2 || parts.length > 3) return no('말린 꽃잎 2~3가지를 골라 주세요');
  if (picked.length !== parts.length) return no('서로 다른 꽃의 꽃잎을 골라 주세요');
  if (!blendRecipe(parts, st)) return no(`정해진 블렌드만 만들 수 있어요 · ${blendNearText(parts, st)}`);   // P79-05 레시피 밖 짝은 막음 (예전에 만든 블렌드는 × 1.2 그대로 팖)
  const short = parts.filter(t => st.dried.filter(p => p.type === t).length < FLOWERS[t].petals);
  if (short.length) return no(`블렌드엔 꽃마다 티백 하나 몫이 들어가요 · ${short.map(t => `${FLOWERS[t].name} ${FLOWERS[t].petals - st.dried.filter(p => p.type === t).length}장`).join(' · ')} 더 모아요`);
  const list = parts.flatMap(t => st.dried.filter(p => p.type === t).sort((a, b) => b.q - a.q).slice(0, FLOWERS[t].petals));
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
  weekNote(st, 'blend', { recipe }, 1, ctx); addXp(st, 'blend', 1, ctx);   // P28-09 · P54
  return ok(`${josa(name, '을/를')} 만들었어요`, { blend: b });
}
// 예전 규칙(P17-01: 우리지 않고 바로 팔기)의 판매 함수 — 화면은 찻잔(sellCups)만 씀. 예전 테스트 · 도구를 위해 남겨 둠
function sellBlends(st, ids, ctx) {              // (R-D2 11-05: 화면은 brew → sellCups만 씀 · 테스트 · 시뮬 호환으로 남김)
  if (!teaShopOpen(calendar(st.virtual))) return no('찻집이 닫혀 있어요');
  const list = st.blends.filter(b => ids.includes(b.id));
  if (!list.length) return no('팔 블렌드 차가 없어요');
  let sum = 0;
  for (const b of list) { sum += blendValue(b); st.blends.splice(st.blends.indexOf(b), 1); }
  st.money += sum; yearAdd(st, 'income', sum); yearAdd(st, 'sold', list.length); addXp(st, 'sell', list.length, ctx);
  return ok(`블렌드 차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
// P17-10 우림 → 찻잔 → 판매: 찻집이 열렸을 때(P34부터 매달) 티백 · 생차 · 블렌드를 우려 찻잔으로. 판매는 찻잔에서만
// 찻잔은 우린 달이 지나면 식어서 값이 반 (COLD_RATE)
const COLD_RATE = 0.5;
const cupCold = (c, cal) => cal.abs > c.brewAbs;
// P56 🫖 티백 우리는 시간 (11-02 사용자 요청 "찻집에서 티백 우리는 시간도 추가해줘. 대신 짧게"): 손으로 우린 잔(brew)은 STEEP_H 3분 동안 우려요 (st.virtual 기준 — 배속 1에서 현실 3분)
// 우리는 동안엔 손으로도 · 카운터 자동 판매로도 팔리지 않고 주문도 못 채움. 🫖 찻집 도우미가 우린 잔 · 첫 손님은 기다리지 않음. 예전 찻잔(steepUntil 없음)은 다 우린 것
// st.virtual은 꽃잠에도 흐름(advance). 시간이 거꾸로 가도(불러오기 · 다른 기기) 남은 시간이 STEEP_H보다 길면 다 우린 것으로 봐서 영원히 멈추지 않게
const STEEP_H = 0.05;
function steepLeftH(st, c) {
  if (!c || !c.steepUntil) return 0;
  const l = (c.steepUntil - st.virtual) / HOUR;
  return l > 0 && l <= STEEP_H + 1e-9 ? l : 0;
}
const cupSteeping = (st, c) => steepLeftH(st, c) > 0;
const readyCups = st => (st.cups || []).filter(c => !cupSteeping(st, c));
// 찻잔 카드 한 마디: "🫖 우리는 중 · 2분 13초" (현실 시간 — 배속으로 나눔) · 🐢 느긋하게 보기면 숫자 없이
function steepText(st, c) {
  const l = steepLeftH(st, c); if (!l) return '';
  if (slowView(st)) return '🫖 우리는 중';
  const s = Math.max(1, Math.ceil(l / (st.speed || 1) * 3600 - 1e-6)), m = Math.floor(s / 60), r = s % 60;
  return `🫖 우리는 중 · ${m ? `${m}분` : ''}${m && r ? ' ' : ''}${r ? `${r}초` : ''}`;
}
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
function brew(st, teaIds, blendIds, honey) {     // honey = { 꿀 키: 병 수 } — P65-02 🍵 꿀차 (창고 꿀 한 병 = 한 잔)
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집이 닫혀 있어요 · 열리면 우려요');
  st.cups = st.cups || [];
  const teas = st.teas.filter(t => (teaIds || []).includes(t.id)), blends = st.blends.filter(b => (blendIds || []).includes(b.id) && b.bagged);   // 블렌드는 티백이 된 것만
  const hs = Object.entries(honey || {}).filter(([k]) => HONEY_KEYS.includes(k)).map(([k, n]) => [k, Math.max(0, Math.min(Math.floor(n) || 0, (st.honey || {})[k] || 0))]).filter(([, n]) => n > 0);
  const hn = hs.reduce((a, [, n]) => a + n, 0);
  if (!teas.length && !blends.length && !hn) return no('우릴 티백이 없어요 · 제다실에서 만들어요');
  const steepUntil = st.virtual + STEEP_H * HOUR;   // P56
  for (const t of teas) { st.teas.splice(st.teas.indexOf(t), 1); st.cups.push({ ...t, id: nid(st), kind: 'tea', brewAbs: cal.abs, steepUntil }); }
  for (const b of blends) { st.blends.splice(st.blends.indexOf(b), 1); st.cups.push({ ...b, id: nid(st), kind: 'blend', brewAbs: cal.abs, steepUntil }); }
  for (const [k, n] of hs) for (let i = 0; i < n; i++) { st.honey[k]--; st.cups.push({ id: nid(st), kind: 'honey', type: k, honey: k, brewAbs: cal.abs, steepUntil }); }
  return ok(`차 ${teas.length + blends.length + hn}잔을 우리고 있어요 🫖 · 3분 뒤 팔 수 있어요`);
}
// P34 (10-30 사용자 요청): 겨울(12 · 1 · 2월) · 꽃잠(쉼달 · 꽃샘달)엔 찻값이 비쌈 — 손으로 팔든 나비 일꾼 · 손님(자동 판매)이 팔든 같은 배율 (⬜ 추천값, 사용자가 바꿀 수 있게 상수 하나)
const TEA_PRICE_MUL = { winter: 1.2, sleep: 1.3 };
const teaPriceKind = cal => !cal ? null : cal.frozen ? 'sleep' : [12, 1, 2].includes(cal.month) ? 'winter' : null;
const teaPriceMul = (cal, st) => { const k = teaPriceKind(cal); return !k ? 1 : k === 'winter' ? 1 + (TEA_PRICE_MUL.winter - 1) * titlePerk(st, 'winter') : TEA_PRICE_MUL[k]; };   // P52 ❄️ 겨울 찻집 주인: 덤만
// 찻잔 카드 · 판매 알림의 한 마디: "❄️ 겨울 값 ×1.2" · 🐢 느긋하게 보기면 숫자 없이 "조금 비싸요". 평달은 ''
const teaPriceText = (st, cal) => { const k = teaPriceKind(cal); if (!k) return ''; return `${k === 'sleep' ? '🌙 꽃잠 값' : '❄️ 겨울 값'} · ${slowView(st) ? '조금 비싸요' : `×${TEA_PRICE_MUL[k]}`}`; };
function cupValue(st, c, cal) {
  const v = c.kind === 'blend' ? blendValue(c) : c.kind === 'honey' ? honeyTeaValue(c.type) : teaItemValue(st, c, cal);   // P65-02 🍵 꿀차
  const m = teaPriceMul(cal, st) * (c.honey ? titlePerk(st, 'honey') : 1);   // P52 🍯
  return Math.round(v * (cupCold(c, cal) ? COLD_RATE : 1) * m / 10) * 10;
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
const cupSellH = st => CUP_SELL_H / shopOf(st).seats / titlePerk(st, 'cupSpeed');   // P52 🍵 찻길                         // 손님 자리만큼 빨리 팔림
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
  if (!teaShopOpen(cal) || !readyCups(st).length) { st.cupTimerH = 0; return; }   // P56 우리는 잔만 있으면 손님도 기다림
  st.cupTimerH = (st.cupTimerH || 0) + dtH;
  const every = cupSellH(st);
  while (st.cupTimerH >= every && readyCups(st).length) {
    st.cupTimerH -= every;
    const c = readyCups(st)[0], v = cupValue(st, c, cal);   // 먼저 우린 것부터 (우리는 잔은 건너뜀)
    st.cups.splice(st.cups.indexOf(c), 1);
    st.money += v; yearAdd(st, 'income', v);
    countCup(st, c, cal, true, ctx);
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
    st._autoSold = st._autoSold || { n: 0, sum: 0 }; st._autoSold.n++; st._autoSold.sum += v; st._autoSold.k = teaPriceKind(cal);   // P34 판 달의 철 값
  }
  if (!readyCups(st).length) st.cupTimerH = 0;
}
function sellCups(st, ids, ctx) {
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집이 닫혀 있어요');
  const all = (st.cups || []).filter(c => ids.includes(c.id)), list = all.filter(c => !cupSteeping(st, c));   // P56 우리는 잔은 빠짐
  if (!list.length) return no(all.length ? '아직 우리는 중이에요 · 조금만 기다려요' : '팔 찻잔이 없어요 · 먼저 티백을 우려요');
  const sum = sellCupList(st, cal, list, ctx);
  const pt = teaPriceText(st, cal);
  return ok(`찻잔 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요${pt ? ` · ${pt}` : ''}`);   // P34 철 값
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
function sellTea(st, ids, ctx) {                 // P17-01: 찻집에서 티백을 우려 한 잔씩 팔아요 (R-D2 11-05: 화면은 brew → sellCups만 씀 · 테스트 호환으로 남김)
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집이 닫혀 있어요');
  const list = st.teas.filter(t => ids.includes(t.id));
  if (!list.length) return no('팔 차가 없어요 · 먼저 티백을 우려요');
  let sum = 0;
  for (const t of list) {
    sum += Math.round(teaItemValue(st, t, cal) * teaPriceMul(cal, st) / 10) * 10; st.teas.splice(st.teas.indexOf(t), 1);   // P34 철 값
    if (st.dex.tea[t.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[t.type].tea}`, ctx);   // P08-01-05-a (변경 10-06: 처음 팔 때)
    st.dex.tea[t.type] = Math.max(st.dex.tea[t.type] || 0, t.q);                                     // P08-01-06 가장 좋은 품질
  }
  st.money += sum; yearAdd(st, 'income', sum); yearAdd(st, 'sold', list.length); addXp(st, 'sell', list.length, ctx);
  return ok(`차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}

