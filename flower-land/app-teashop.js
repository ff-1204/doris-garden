// 도리의 정원 — 화면: 🍵 찻집 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 🍵 찻집 (P12, P17)
// 티백 · 생차 확인 창 (P12-03, P12-10): 꽃마다 한 줄 (꽃잎 › 티백/찻잔 · ★ · 🏷️ 햇차 · −/+)
// mode: false = 꽃잎 → 티백, true = 말린 꽃잎 → 티백, 'raw' = 꽃잎 → 생차(바로 찻집)
function openTeaConfirm(ids, mode, counts) {
  const dried = mode === true, raw = mode === 'raw';
  const cal = E.calendar(st.virtual), src = (dried ? st.dried : st.petals).filter(p => ids.includes(p.id));
  if (!src.length) return;
  const fresh = () => false;   // 제철 보너스 없앰 (10-06)
  const key = p => [p.type, fresh(p), E.isHat(p.q)].join('|');
  const groups = groupType(src, key);
  // 줄마다 몇 개 만들지 (기본은 전부). 고른 수만큼 품질이 좋은 꽃잎부터 써요
  counts = counts || Object.fromEntries(groups.map(g => [key(g), g.ids.length]));
  const pick = groups.flatMap(g => src.filter(p => g.ids.includes(p.id)).sort((x, y) => y.q - x.q).slice(0, counts[key(g)]).map(p => p.id));
  const what = '티백';
  const body = `<div class="rc">
    <div class="rc-list">${groups.map(g => { const F = FLOWERS[g.type], fr = fresh(g), k = key(g), n = counts[k], hat = E.isHat(g.q); return `<div class="rc-item tc-item ${n ? '' : 'off'}" style="--pc:${SPR.tea[g.type] || F.petal}">
      <span class="rc-art tc-pair">${spriteImg(g.type, dried ? 'dried' : 'petal', 26, false, '')}<span class="sc-to">›</span>${spriteImg(g.type, 'teabag', 34, false, `${F.name} ${what}`)}</span>
      <span class="rc-main"><b>${F.name} ${raw ? '생화 티백' : '티백'}${hat ? ' <span class="chip hat-chip">🍃 햇차</span>' : ''}${fr ? ' <span class="chip fresh-chip">✨ 제철</span>' : ''}</b>
        <small><span class="stars">${starStr(g.q)}</span> · ${dried ? '말린 ' : ''}${F.name} 꽃잎 ${g.ids.length}장 중</small></span>
      <span class="stepper"><button type="button" data-tq="${k}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-tq="${k}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span>
      </div>`; }).join('')}</div>
    <div class="rc-notes">${raw ? '<span>🌸 생화 티백: 말리지 않고 바로 티백으로 · <b class="val-down">값 −10%</b> (말린 꽃잎 티백보다 조금 싸요)</span><span>🏷️ 티백이 되는 순간 지금 품질 그대로 멈춰요 · 생화로 두면 <b class="val-down">한 달에 20%씩 줄어요</b></span>' : `<span>🏷️ 만드는 순간의 꽃잎 품질 그대로 티백이 되고, 그 뒤로 품질이 줄지 않아요</span><span>🍵 티백은 찻집으로 가서 한 잔씩 우려 팔아요</span>`}<span>🍃 ★5 꽃잎은 햇차가 돼요 · <b class="val-up">값 +10%</b></span>${pick.length < src.length ? `<span>남는 꽃잎 ${src.length - pick.length}장은 그대로 ${dried ? '꽃방' : '제다실'}에 있어요 · 좋은 꽃잎부터 써요</span>` : ''}</div></div>`;
  openModal(raw ? '🌸 생화 티백' : '🏷️ 티백', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `티백 · ${pick.length}개` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(raw ? E.makeRaw(st, pick, ctx) : dried ? E.makeTeaDried(st, pick, ctx) : E.makeTea(st, pick, ctx), null, { label: '🍵 찻집', fn: () => setTab('cab') }); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-tq]').forEach(b => b.onclick = () => {
    const parts = b.dataset.tq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => key(x) === k);
    openTeaConfirm(ids, mode, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 꽃방에 널기 확인 창 (P12-07): 꽃마다 한 줄 (꽃잎 › 말린 꽃잎 · ★ · −/+), 고른 수만큼 품질 좋은 꽃잎부터
function openDryConfirm(ids, counts) {
  const cal = E.calendar(st.virtual), src = st.petals.filter(p => ids.includes(p.id));
  if (!src.length) return;
  const groups = groupType(src, p => p.type);
  counts = counts || Object.fromEntries(groups.map(g => [g.type, g.ids.length]));
  const pick = groups.flatMap(g => src.filter(p => g.ids.includes(p.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.type]).map(p => p.id));
  const body = `<div class="rc">
    <div class="rc-list">${groups.map(g => { const F = FLOWERS[g.type], n = counts[g.type]; return `<div class="rc-item tc-item ${n ? '' : 'off'}" style="--pc:${mixHex(F.petal, '#b49a74', 0.45)}">
      <span class="rc-art tc-pair">${spriteImg(g.type, 'petal', 30, false, '')}<span class="sc-to">›</span>${spriteImg(g.type, 'dried', 30, false, '')}</span>
      <span class="rc-main"><b>${F.name}</b><small><span class="stars">${starStr(g.q)}</span> · 꽃잎 ${g.ids.length}장 중</small></span>
      <span class="stepper"><button type="button" data-dq="${g.type}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-dq="${g.type}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>🌾 널어 두면 지금 품질 그대로 멈추고, 흐르는 시간 1달 뒤 다 말라요${cal.frozen ? ' (꽃잠 동안은 마르지 않아요)' : ''}</span><span>🫖 말린 꽃잎은 언제든 블렌딩할 수 있어요 · 다시 꽃잎으로 되돌릴 수는 없어요</span>${pick.length < src.length ? `<span>남는 꽃잎 ${src.length - pick.length}장은 그대로 있어요 · 좋은 꽃잎부터 널어요</span>` : ''}</div></div>`;
  openModal('🌾 건조', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `건조 · ${pick.length}장` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.dryPetals(st, pick)); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-dq]').forEach(b => b.onclick = () => {
    const [t, d] = b.dataset.dq.split('|'), g = groups.find(x => x.type === t);
    openDryConfirm(ids, { ...counts, [t]: Math.max(0, Math.min(g.ids.length, counts[t] + (d === '+' ? 1 : -1))) });
  });
}
// 팔기 확인 창 (P17-01): 파는 차마다 한 줄 (찻잔 · 이름 ×개수 · ★ · 한 잔 값 · 합) + 받을 돈과 가진 돈 변화
function openSellConfirm(cupIds, counts) {   // 판매는 ☕ 찻잔에서만 (P17-10)
  const cal = E.calendar(st.virtual), cups = (st.cups || []).filter(c => cupIds.includes(c.id));
  if (!cups.length) return;
  const val = c => E.cupValue(st, c, cal);
  const ckey = c => [c.kind, c.kind === 'blend' ? c.name : c.type, c.kind === 'tea' && E.isFresh(st, c, cal), !!c.hat, !!c.raw, E.cupCold(c, cal), c.honey || ''].join('|');
  const groups = groupType(cups, ckey).map(g => ({ ...g, k: ckey(g), fresh: g.kind === 'tea' && E.isFresh(st, g, cal), cold: E.cupCold(g, cal) })).sort((a, b) => a.cold - b.cold);
  // 줄마다 몇 잔 팔지 (기본은 전부). 고른 수만큼 품질 좋은 찻잔부터
  counts = counts || Object.fromEntries(groups.map(g => [g.k, g.ids.length]));
  const best = g => cups.filter(x => g.ids.includes(x.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.k]);
  const pick = groups.flatMap(best);
  const total = pick.reduce((a, c) => a + val(c), 0);
  const step = g => `<span class="stepper"><button type="button" data-sq2="${g.k}|-" ${counts[g.k] <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${counts[g.k]}</span><button type="button" data-sq2="${g.k}|+" ${counts[g.k] >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span>`;
  const body = `<div class="rc">
    <div class="rc-list sell-list">${groups.map(g => { const c = g, vs = cups.filter(x => g.ids.includes(x.id)).map(val), sum = best(g).reduce((a, x) => a + val(x), 0);
      return `<div class="rc-item sell-item ${counts[g.k] ? '' : 'off'}"><span class="rc-art">${spriteImg(c.kind === 'blend' ? c.parts[0] : c.type, 'tea', 40, false, '')}</span>
        <span class="rc-main"><b>${c.honey ? '🍯 꿀 ' : ''}${c.kind === 'blend' ? `${c.recipe ? '✨ ' : ''}${c.name}` : FLOWERS[c.type].tea}${c.kind === 'blend' ? ' <span class="chip fresh-chip blend-chip">🫖 블렌드</span>' : teaTags(g, true)}${g.cold ? ' <span class="chip cold-chip">🧊 식은 차 −50%</span>' : ''}</b><small><span class="stars">${starStr(g.q)}</span> · 한 잔 ${wonRange(Math.min(...vs), Math.max(...vs))} · ${g.ids.length}잔 중</small></span>
        <span class="sell-r">${step(g)}<span class="data">${won(sum)}</span></span></div>`; }).join('')}</div>
    <div class="rc-total"><div class="rc-sum"><b>받을 돈</b><b class="data good">+${won(total)}</b></div></div>
    <div class="rc-pay"><div><span class="muted">가진 돈</span><span class="data">${won(st.money)}</span></div><div><span class="muted">판 뒤</span><b class="data">${won(st.money + total)}</b></div></div></div>`;
  openModal('💰 찻잔 판매', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `판매 · ${pick.length}잔 · ${won(total)}` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.sellCups(st, pick.map(c => c.id), ctx), 'sold'); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-sq2]').forEach(b => b.onclick = () => {
    const parts = b.dataset.sq2.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => x.k === k);
    openSellConfirm(cupIds, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 블렌드 → 티백 확인 창 (P12-11)
function openBagBlend(ids, counts) {
  const list = st.blends.filter(x => ids.includes(x.id) && !x.bagged);
  if (!list.length) return;
  const key = x => x.name, groups = groupType(list, key);
  counts = counts || Object.fromEntries(groups.map(g => [key(g), g.ids.length]));
  const pick = groups.flatMap(g => list.filter(x => g.ids.includes(x.id)).sort((a, b) => b.q - a.q).slice(0, counts[key(g)]).map(x => x.id));
  const body = `<div class="rc"><div class="rc-list">${groups.map(g => { const n = counts[key(g)]; return `<div class="rc-item tc-item ${n ? '' : 'off'}"><span class="rc-art tc-pair">${spriteImg(g.parts[0], 'tea', 28, false, '')}<span class="sc-to">›</span>${spriteImg(g.parts[0], 'teabag', 32, false, '')}</span>
      <span class="rc-main"><b>${g.recipe ? '✨ ' : ''}${g.name} 티백</b><small><span class="stars">${starStr(g.q)}</span> · ${g.parts.map(p => FLOWERS[p].name).join(' + ')} · ${g.ids.length}개 중</small></span>
      <span class="stepper"><button type="button" data-gq="${key(g)}|-" ${n <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-gq="${key(g)}|+" ${n >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>🏷️ 블렌드 티백은 찻집으로 가서 🫖 우려 팔아요 · 이름 있는 블렌드는 티백 도감에도 등록돼요</span></div></div>`;
  openModal('🏷️ 블렌드 티백', body, [
    { label: '취소', act: () => closeModal() },
    { label: pick.length ? `티백 · ${pick.length}개` : '선택 없음', primary: true, act: () => { if (!pick.length) return; closeModal(); after(E.bagBlends(st, pick, ctx), null, { label: '🍵 찻집', fn: () => setTab('cab') }); } },
  ]);
  const root = $('#modalRoot');
  if (!pick.length) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-gq]').forEach(b => b.onclick = () => { const parts = b.dataset.gq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => key(x) === k); openBagBlend(ids, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) }); });
}
// 우림 확인 창 (P17-10): 티백 › 찻잔 / 생차 · 블렌드도. 줄마다 −/+, 버튼 "우림 · ○잔"
function openBrewConfirm(teaIds, blendIds, counts) {
  const cal = E.calendar(st.virtual), teas = st.teas.filter(t => teaIds.includes(t.id)), blends = st.blends.filter(x => blendIds.includes(x.id));
  if (!teas.length && !blends.length) return;
  const tkey = t => ['t', t.type, E.isFresh(st, t, cal), !!t.hat, !!t.raw].join('|'), bkey = x => ['b', x.name].join('|');
  const groups = [...groupType(teas, tkey).map(g => ({ ...g, k: tkey(g), fresh: E.isFresh(st, g, cal) })), ...groupType(blends, bkey).map(g => ({ ...g, k: bkey(g) }))];
  counts = counts || Object.fromEntries(groups.map(g => [g.k, g.ids.length]));
  const best = (list, g) => list.filter(x => g.ids.includes(x.id)).sort((x, y) => y.q - x.q).slice(0, counts[g.k]).map(x => x.id);
  const pickT = groups.filter(g => g.k[0] === 't').flatMap(g => best(teas, g)), pickB = groups.filter(g => g.k[0] === 'b').flatMap(g => best(blends, g));
  const n = pickT.length + pickB.length;
  const body = `<div class="rc">
    <div class="rc-list sell-list">${groups.map(g => { const isB = g.k[0] === 'b', F = isB ? null : FLOWERS[g.type], c = counts[g.k];
      return `<div class="rc-item tc-item ${c ? '' : 'off'}"><span class="rc-art tc-pair">${spriteImg(isB ? g.parts[0] : g.type, 'teabag', 28, false, '')}<span class="sc-to">›</span>${spriteImg(isB ? g.parts[0] : g.type, 'tea', 32, false, '')}</span>
        <span class="rc-main"><b>${isB ? `${g.recipe ? '✨ ' : ''}${g.name} <span class="chip fresh-chip blend-chip">🫖 블렌드</span>` : `${F.tea}${teaTags(g)}`}</b><small><span class="stars">${starStr(g.q)}</span> · ${isB ? '블렌드 티백' : g.raw ? '생화 티백' : '티백'} ${g.ids.length}개 중</small></span>
        <span class="stepper"><button type="button" data-bq="${g.k}|-" ${c <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${c}</span><button type="button" data-bq="${g.k}|+" ${c >= g.ids.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}</div>
    <div class="rc-notes"><span>☕ 우린 차는 찻잔으로 가서 바로 팔 수 있어요</span><span>🧊 찻잔은 우린 달이 지나면 식어서 <b class="val-down">값이 반</b>이 돼요 · 팔 만큼만 우려요</span></div></div>`;
  openModal('🫖 우림', body, [
    { label: '취소', act: () => closeModal() },
    { label: n ? `우림 · ${n}잔` : '선택 없음', primary: true, act: () => { if (!n) return; closeModal(); after(E.brew(st, pickT, pickB)); } },
  ]);
  const root = $('#modalRoot');
  if (!n) root.querySelector('[data-mb="1"]').disabled = true;
  root.querySelectorAll('[data-bq]').forEach(b => b.onclick = () => {
    const parts = b.dataset.bq.split('|'), d = parts.pop(), k = parts.join('|'), g = groups.find(x => x.k === k);
    openBrewConfirm(teaIds, blendIds, { ...counts, [k]: Math.max(0, Math.min(g.ids.length, counts[k] + (d === '+' ? 1 : -1))) });
  });
}
// 블렌딩 확인 창 (P12-08): 재료 말린 꽃잎 → 블렌드 찻잔, 이름 · ★ · 값, 처음 만드는 이름 있는 블렌드면 도감 안내
function openBlendConfirm() {
  const sel = ui.blendSel.map(id => st.dried.find(p => p.id === id)).filter(Boolean);
  if (sel.length < 2) return;
  const parts = sel.map(p => p.type), recipe = E.blendRecipe(parts, st), q = sel.reduce((a, p) => a + p.q, 0) / sel.length;
  const name = recipe ? E.BLENDS[recipe].name : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`, val = E.blendValue({ parts, q, recipe });
  const sep = sel.reduce((a, p) => a + E.teaValue(FLOWERS[p.type], p.q, false), 0);
  const body = `<div class="rc">
    <div class="bc-hero" style="--pc:${SPR.tea[parts[0]] || FLOWERS[parts[0]].petal}">
      <div class="bc-parts">${sel.map(p => `<span class="bc-part">${spriteImg(p.type, 'dried', 36, false, '')}<small>${FLOWERS[p.type].name}</small></span>`).join('<b class="bc-plus">+</b>')}</div>
      <span class="bc-arrow">↓</span>
      <div class="bc-out">${spriteImg(parts[0], 'tea', 56, false, name)}<div><b>${recipe ? '✨ ' : ''}${name}</b><span class="stars">${starStr(q)}</span></div></div></div>
    <div class="rc-notes">${recipe && st.dex.blend[recipe] == null ? '<span>📖 처음 만드는 블렌드예요 · 도감에 등록돼요</span>' : !recipe ? `<span>📖 이름 있는 블렌드는 레시피 ${E.blendKeys(st).length}가지예요 · 이건 재료 이름으로 불러요</span>` : ''}<span>🫖 말린 꽃잎 ${sel.length}장이 들어가요 · 따로 차로 만들 때보다 <b class="val-up">값이 ${recipe ? '1.5배 · 📖 레시피' : '1.2배'}</b></span></div></div>`;
  openModal('🫖 블렌딩', body, [
    { label: '취소', act: () => closeModal() },
    { label: `🫖 블렌딩 · ${sel.length}장`, primary: true, act: () => { closeModal(); const r = E.blend(st, ui.blendSel, ctx); if (r.ok) ui.blendSel = []; after(r, 'blended'); } },
  ]);
}
function groupBy(list, keyFn) {
  const m = new Map();
  for (const x of list) { const k = keyFn(x); if (!m.has(k)) m.set(k, { ...x, ids: [] }); m.get(k).ids.push(x.id); }
  return [...m.values()];
}
// 차 꼬리표: 🌸 생화 티백 (−10%) · 🍃 햇차 (★5 꽃잎, +10%) (✨ 제철은 10-06에 없앰)
const teaTags = (t, pct) => `${t.raw ? ` <span class="chip raw-chip">🌸 생화${pct ? ' −10%' : ''}</span>` : ''}${t.hat ? ` <span class="chip hat-chip">🍃 햇차${pct ? ' +10%' : ''}</span>` : ''}`;
// 같은 꽃은 한 장으로 묶고 품질은 범위로 (★은 가장 좋은 것, 값은 "1,040~1,200원")
function groupType(list, keyFn) {
  return groupBy(list, keyFn).map(g => { const qs = list.filter(x => g.ids.includes(x.id)).map(x => x.q); return { ...g, q: Math.max(...qs), qMin: Math.min(...qs) }; });
}
const wonRange = (lo, hi) => Math.round(lo / 10) === Math.round(hi / 10) ? won(hi) : `${won(lo).replace('원', '')}~${won(hi)}`;
function renderCab(force) {
  const cal = E.calendar(st.virtual);
  const petals = groupType(st.petals, p => p.type);
  const teas = groupType(st.teas, t => [t.type, E.isFresh(st, t, cal), !!t.hat, !!t.raw].join('|')).map(t => ({ ...t, fresh: E.isFresh(st, t, cal) })).sort((a, b) => b.raw - a.raw || b.hat - a.hat || b.fresh - a.fresh);   // 티백 먼저
  const dried = groupType(st.dried, p => p.type);
  ui.blendSel = (ui.blendSel || []).filter(id => st.dried.some(p => p.id === id));
  const sig = JSON.stringify([st.money, cal.frozen, cal.idx >= 10, E.teaShopOpen(cal) ? 0 : realH(E.hoursToShopOpen(st.virtual) / (st.speed || 1)), petals.map(p => [p.type, E.pct(p.q), p.ids.length]), teas.map(t => [t.type, E.pct(t.q), t.fresh, t.ids.length]),
    st.drying.map(d => [d.id, flowH(Math.max(0, d.leftH))]), dried.map(d => [d.type, E.pct(d.q), d.ids.length]), st.blends.map(b => [b.id, !!b.bagged]), (st.cups || []).map(c => [c.id, E.cupCold(c, cal), c.honey]), Math.floor((st.cupTimerH || 0) * 60), ui.blendSel, ui.dryTab, st.honey, st.orders]);
  if (!force && ui.sigs.cab === sig) return;
  ui.sigs.cab = sig;
  const shopOpen = E.teaShopOpen(cal);   // P17-09 찻집은 겨울(12월)부터 꽃잠까지
  const teaTotal = st.teas.reduce((a, t) => a + E.teaItemValue(st, t, cal), 0) + st.blends.reduce((a, b) => a + E.blendValue(b), 0);
  // 꽃잎: 차로 만들거나 꽃방에 널기
  const petalCards = petals.map(p => { const F = FLOWERS[p.type]; return `<div class="shopcard cabcard" style="--pc:${F.petal}">
      <div class="sc-art">${spriteImg(p.type, 'petal', 52, false, F.name)}<span class="sc-count">×${p.ids.length}</span>${p.qMin <= 0.2 ? '<span class="sc-last" title="다음 달엔 비료가 돼요">곧 시들어요</span>' : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(p.q)}</span></div>
      <div class="cc-acts"><button type="button" class="btn primary" data-dry="${p.ids.join(',')}">🌾 건조</button><button type="button" class="btn" data-raw="${p.ids.join(',')}">🏷️ 티백</button></div></div>`; }).join('');
  // 🌾 꽃방 (P12-07): 말리는 중 · 말린 꽃잎
  // 🌾 꽃방 꽃잎별 탭: 전체 · 라벤더 3 · 장미 2 … (말리는 중 + 말린 꽃잎 수)
  const dryTypes = FLOWER_KEYS.filter(k => st.drying.some(d => d.type === k));   // 꽃방엔 말리는 중만 (다 마르면 찻집으로)
  if (!dryTypes.includes(ui.dryTab)) ui.dryTab = 'all';
  const dryN = k => st.drying.filter(d => d.type === k).length;
  const dryShow = k => ui.dryTab === 'all' || ui.dryTab === k;
  const dryTabs = dryTypes.length > 1 ? `<div class="dexchips dry-tabs" role="tablist" aria-label="꽃방 꽃잎">${[['all', '전체', st.drying.length], ...dryTypes.map(k => [k, FLOWERS[k].name, dryN(k)])].map(([k, nm, n]) => `<button type="button" class="dexchip" role="tab" data-drt="${k}" aria-pressed="${ui.dryTab === k}">${k === 'all' ? '' : spriteImg(k, 'dried', 18, false, '')}<span>${nm}</span><span class="data">${n}</span></button>`).join('')}</div>` : '';
  // 말리는 중은 같은 꽃 · 같은 진행(5% 단위)이면 한 장 (×개수)
  const dryGroups = groupBy(st.drying.filter(d => dryShow(d.type)), d => [d.type, Math.round((1 - d.leftH / E.DRY_H) * 20)].join('|'));
  const dryingCards = dryGroups.map(d => { const F = FLOWERS[d.type], pr = Math.round((1 - d.leftH / E.DRY_H) * 100); return `<div class="shopcard cabcard drying" style="--pc:${F.petal}">
      <div class="sc-art">${spriteImg(d.type, 'petal', 52, false, F.name)}<span class="chip sc-form">말리는 중</span>${d.ids.length > 1 ? `<span class="sc-count">×${d.ids.length}</span>` : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(d.q)}</span></div>
      <div class="cc-q"><span class="qbar"><i style="width:${pr}%;background:#b49a74"></i></span><span class="data">${pr}%</span></div>
      <div class="cc-meta">${cal.frozen ? '꽃잠에는 쉬어요' : `${flowH(Math.max(0, d.leftH))} 뒤 다 말라요`}</div></div>`; }).join('');
  const starRange = g => E.stars(g.qMin != null ? g.qMin : g.q) === E.stars(g.q) ? starStr(g.q) : `★${E.stars(g.qMin)}~${E.stars(g.q)}`;   // 묶음의 품질 범위 (10-24)
  const driedCards = dried.map(d => {
    const F = FLOWERS[d.type], selN = d.ids.filter(id => ui.blendSel.includes(id)).length, canSel = selN < d.ids.length && ui.blendSel.length < 3 && !ui.blendSel.some(id => st.dried.find(p => p.id === id).type === d.type);
    return `<div class="shopcard cabcard driedcard ${selN ? 'picked' : ''}" style="--pc:${mixHex(F.petal, '#b49a74', 0.45)}">
      <div class="sc-art">${spriteImg(d.type, 'dried', 52, false, F.name)}<span class="chip sc-form">말린 꽃잎</span><span class="sc-count">×${d.ids.length}</span></div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starRange(d)}</span></div>
      <div class="cc-acts"><button type="button" class="btn primary" data-bsel="${d.type}" ${canSel ? '' : 'disabled'}>${selN ? '✓ 블렌딩' : '🫖 블렌딩'}</button><button type="button" class="btn" data-makedried="${d.ids.join(',')}">🏷️ 티백</button></div></div>`;
  }).join('');
  // 🫖 블렌딩 (P12-08): 언제든 (10-06)
  const sel = ui.blendSel.map(id => st.dried.find(p => p.id === id)), parts = sel.map(p => p.type);
  const recipe = parts.length >= 2 ? E.blendRecipe(parts, st) : null, avg = sel.length ? sel.reduce((a, p) => a + p.q, 0) / sel.length : 0;
  const previewVal = parts.length >= 2 ? E.blendValue({ parts, q: avg, recipe }) : 0;
  // 한 줄: 재료 칸 세 개 → 결과 → 블렌딩하기. 레시피는 접어 둠
  const gotN = E.blendKeys(st).filter(k => st.dex.blend[k] != null).length;
  // 레시피: 말린 꽃잎이 다 있는 것은 "지금 만들 수 있어요"로 맨 앞, 누르면 재료 칸에 담김 (10-06)
  const haveDried = new Set(st.dried.map(p => p.type)), canMake = k => E.BLENDS[k].parts.every(p => haveDried.has(p));
  const recKeys = E.blendKeys(st).slice().sort((x, y) => canMake(y) - canMake(x)), readyN = E.blendKeys(st).filter(canMake).length;
  const bookHTML = `<details class="bl-book"${ui.bookOpen ?? readyN > 0 ? ' open' : ''}><summary>📖 레시피 <span class="data">${gotN} / ${E.blendKeys(st).length}</span>${readyN ? ` · <b class="val-up">지금 만들 수 있어요 ${readyN}</b>` : ''}</summary>
        <div class="bl-recs">${recKeys.map(k => { const B = E.BLENDS[k], got = st.dex.blend[k] != null, ok = canMake(k), inner = `${got ? '✓ ' : ''}<b>${B.name}</b> <small>${B.parts.map(p => FLOWERS[p].name).join(' + ')}</small>`; return ok ? `<button type="button" class="bl-rec ready ${got ? 'got' : ''} ${recipe === k ? 'on' : ''}" aria-pressed="${recipe === k}" data-recipe="${k}" title="재료를 블렌딩 칸에 담아요">🫖 ${inner}</button>` : `<span class="bl-rec ${got ? 'got' : ''}">${inner}</span>`; }).join('')}</div></details>`;
  const blendBox = true ? `
    <div class="cab-head" id="tr-blend"><span class="sb-title">🫖 블렌딩</span><span class="muted">말린 꽃잎 2~3가지</span></div>
    <div class="blendbox">
      <div class="bl-row">
        <div class="bl-slots">${[0, 1, 2].map(i => sel[i] ? `<button type="button" class="bl-slot on" data-bunsel="${sel[i].id}" title="${FLOWERS[sel[i].type].name} 빼기" style="--pc:${FLOWERS[sel[i].type].petal}">${spriteImg(sel[i].type, 'dried', 32, false, '')}<small>${FLOWERS[sel[i].type].name}</small></button>` : `<span class="bl-slot ${i < 2 ? '' : 'opt'}" ${i < 2 ? '' : 'title="세 번째는 넣어도, 안 넣어도 돼요"'}>+${i < 2 ? '' : '<small>더</small>'}</span>`).join('')}</div>
        <span class="bl-arrow" aria-hidden="true">→</span>
        <div class="bl-out">${parts.length >= 2 ? `<b>${recipe ? `✨ ${E.BLENDS[recipe].name}` : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`}</b><span><span class="stars">${starStr(avg)}</span></span>` : `<span class="muted">${!st.dried.length ? '꽃방에서 말린 꽃잎이 있어야 해요' : readyN ? '말린 꽃잎의 🫖 블렌딩이나 아래 레시피를 눌러요' : '위 말린 꽃잎에서 🫖 블렌딩을 눌러요'}</span>`}</div>
        <button type="button" class="btn primary" data-blend="1" ${parts.length >= 2 ? '' : 'disabled'}>블렌딩</button>
      </div>
      ${bookHTML}
    </div>` : '';
  // 🏷️ 티백 (찻집): 생화 티백 · 티백 · 블렌드 티백 → 🫖 우림
  const bagged = st.blends.filter(x => x.bagged), loose = st.blends.filter(x => !x.bagged);
  const teaCards = teas.map(t => { const F = FLOWERS[t.type]; return `<div class="shopcard cabcard teacard ${t.raw ? 'raw' : ''} ${t.hat ? 'hat' : ''}" style="--pc:${SPR.tea[t.type] || F.petal}">
      <div class="sc-art"><span class="sc-pair">${spriteImg(t.type, 'teabag', 52, false, `${F.name} 티백`)}<span class="sc-to" aria-hidden="true">›</span><span class="sc-bloom">${spriteImg(t.type, 'tea', 30, false, F.tea)}</span></span><span class="chip sc-form">${t.raw ? '🌸 생화 티백' : '🏷️ 티백'}</span><span class="sc-count">×${t.ids.length}</span></div>
      <div class="cc-name"><b>${F.tea}</b><span class="stars">${starStr(t.q)}</span></div>
      ${t.hat || t.fresh ? `<div class="cc-meta">${teaTags({ ...t, raw: false })}</div>` : ''}
      <button type="button" class="btn primary" data-brew="${t.ids.join(',')}" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 우림' : '🔒 준비 중'}</button></div>`; }).join('')
    + bagged.map(b => `<div class="shopcard cabcard teacard blendcard" style="--pc:${SPR.tea[b.parts[0]] || FLOWERS[b.parts[0]].petal}">
      <div class="sc-art"><span class="sc-pair">${spriteImg(b.parts[0], 'teabag', 52, false, `${b.name} 티백`)}<span class="sc-to" aria-hidden="true">›</span><span class="sc-bloom">${spriteImg(b.parts[0], 'tea', 30, false, b.name)}</span></span><span class="chip sc-form blend">🫖 블렌드 티백</span></div>
      <div class="cc-name"><b>${b.recipe ? '✨ ' : ''}${b.name}</b><span class="stars">${starStr(b.q)}</span></div>
      <button type="button" class="btn primary" data-brewblend="${b.id}" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 우림' : '🔒 준비 중'}</button></div>`).join('');
  // 🫖 블렌드 (제다실): 아직 티백이 아닌 블렌드 → 🏷️ 티백
  const looseCards = loose.map(b => `<div class="shopcard cabcard teacard blendcard" style="--pc:${SPR.tea[b.parts[0]] || FLOWERS[b.parts[0]].petal}">
      <div class="sc-art"><span class="blend-art n${b.parts.length}">${b.parts.map(p => spriteImg(p, 'dried', 40, false, FLOWERS[p].name)).join('')}</span><span class="chip sc-form blend">🫖 블렌드</span></div>
      <div class="cc-name"><b>${b.recipe ? '✨ ' : ''}${b.name}</b><span class="stars">${starStr(b.q)}</span></div>
      <button type="button" class="btn primary" data-bagblend="${b.id}">🏷️ 티백</button></div>`).join('');
  // ☕ 찻잔 (P17-10): 우린 차. 같은 꽃·꼬리표·식음이 같으면 한 장
  const cupKey = c => [c.kind, c.kind === 'blend' ? c.name : c.type, c.kind === 'tea' && E.isFresh(st, c, cal), !!c.hat, !!c.raw, E.cupCold(c, cal), c.honey || ''].join('|');
  const honeyLeft = Object.values(st.honey || {}).reduce((a, n) => a + n, 0);
  const cupGroups = groupType(st.cups || [], cupKey).map(g => ({ ...g, fresh: g.kind === 'tea' && E.isFresh(st, g, cal), cold: E.cupCold(g, cal) }));
  const cupCards = cupGroups.map(g => { const isB = g.kind === 'blend', key = isB ? g.parts[0] : g.type, nm = isB ? `${g.recipe ? '✨ ' : ''}${g.name}` : FLOWERS[g.type].tea; return `<div class="shopcard cabcard teacard cupcard ${g.cold ? 'cold' : ''}" style="--pc:${SPR.tea[key] || FLOWERS[key].petal}">
      <div class="sc-art"><span class="cup-steam">${spriteImg(key, 'tea', 64, false, nm)}</span><span class="chip sc-form">${g.cold ? '🧊 식은 차' : '☕ 갓 우림'}</span><span class="sc-count">×${g.ids.length}</span>${shopOpen && st.cups[0] && g.ids.includes(st.cups[0].id) ? '<span class="sc-next-up">다음 차례</span>' : ''}</div>
      <div class="cc-name"><b>${g.honey ? '🍯 꿀 ' : ''}${nm}</b><span class="stars">${starStr(g.q)}</span></div>
      <div class="cc-meta">${g.cold ? '식어서 <b class="val-down">값이 반</b>' : '이번 달 안에 팔면 제값'}${isB ? '' : teaTags(g)}${g.honey ? ` <span class="chip honey-chip">🍯 ${E.honeyName(g.honey)}</span>` : ''}</div>
      ${!g.honey && honeyLeft ? `<button type="button" class="btn small honey-btn" data-honeycup="${g.ids.join(',')}">🍯 꿀 한 숟갈</button>` : ''}
      <button type="button" class="btn primary" data-sellcup="${g.ids.join(',')}" ${shopOpen ? '' : 'disabled'}>💰 판매</button></div>`; }).join('');
  // P18 🍯 꿀 선반: 거둔 꿀을 종류마다 병으로
  const honeyKinds = E.HONEY_KEYS.filter(k => (st.honey || {})[k] > 0);
  const honeyShelf = honeyKinds.length ? `<div class="cab-head"><span class="sb-title">🍯 꿀 선반 <span class="sh-n">${honeyLeft}</span></span><span class="muted">찻잔에 한 숟갈 넣으면 꿀차가 돼요 · 값은 그대로</span></div>
    <div class="honeyshelf">${honeyKinds.map(k => `<span class="hj">${honeyImg(k, 2)}<small>${E.honeyName(k)} <b class="data">×${st.honey[k]}</b></small></span>`).join('')}</div>` : '';
  // ☕ 카운터: 우린 찻잔을 나무빛 상자 안에 (티백 선반과 구분)
  const cupSection = (st.cups || []).length ? `<section class="counter"><div class="cab-head"><span class="sb-title">☕ 찻잔 <span class="sh-n">${st.cups.length}</span></span><span class="muted">${shopOpen ? `${seatText()} · 다음 손님 <b>${realH(Math.max(0, E.cupSellH(st) - (st.cupTimerH || 0)) / (st.speed || 1))}</b> 뒤` : `찻집이 열리면 ${seatText()}`}</span>${st.cups.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-sellcup="all" ${shopOpen ? '' : 'disabled'}>💰 전체 판매</button></span>` : ''}</div>${shopOpen ? `<div class="cust-bar" title="다음 손님까지"><i style="width:${Math.round(Math.min(1, (st.cupTimerH || 0) / E.cupSellH(st)) * 100)}%"></i></div>` : ''}<div class="shopgrid cabgrid">${cupCards}</div></section>` : (shopOpen ? '<section class="counter empty"><span>☕</span><div class="muted">카운터가 비어 있어요 · 아래 🏷️ 티백에서 "🫖 우림"을 누르면 찻잔이 여기에 놓여요</div></section>' : '<section class="counter empty closed"><span>🔒</span><div class="muted">카운터는 겨울(12월)부터 열려요</div></section>');
  $('#p-cab').innerHTML = `<div class="stack">
    <div class="news-row"><div class="shop-sign ${shopOpen ? 'open' : 'closed'} sign-${E.shopOf(st).sign}">
      <span class="ss-board"><b>${shopOpen ? 'OPEN' : 'CLOSED'}</b><small>${shopOpen ? '영업 중' : '준비 중'}</small></span>
      <span class="ss-txt"><b>${shopOpen ? '☕ 오늘은 찻집이 열려요' : '🔒 겨울(12월)이 되면 열어요'}</b><small>${shopOpen ? '겨울 · 꽃잠 동안 · 티백을 우려 팔 수 있어요' : `${realH(E.hoursToShopOpen(st.virtual) / (st.speed || 1))} 뒤 · 평일엔 티백을 모아 두세요`} · 🏷️ 티백은 품질이 그대로예요</small></span>
</div><span class="news-side">${wallet()}<button type="button" class="btn small" data-act="shopUp">🪑 찻집 가꾸기</button></span></div>
    ${ordersHTML()}
    ${cupSection}
    ${honeyShelf}
    <div class="cab-head"><span class="sb-title">🏷️ 티백${st.teas.length + bagged.length ? ` <span class="sh-n">${st.teas.length + bagged.length}</span>` : ''}</span><span class="muted">우려서 찻잔으로</span>${st.teas.length + bagged.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-brew="all" ${shopOpen ? '' : 'disabled'}>${shopOpen ? '🫖 전체 우림' : '🔒 준비 중'}</button></span>` : ''}</div>
    ${teaCards ? `<div class="shopgrid cabgrid">${teaCards}</div>` : '<div class="cab-empty"><span>🏷️</span><div><b>티백이 없어요</b> <span class="muted">🌿 제다실에서 생화 · 말린 꽃잎 · 블렌드를 티백으로 만들면 여기로 와요</span></div></div>'}</div>`;
  // 🌿 제다실: 생화 · 꽃방 · 말린 꽃잎 · 블렌딩 · 블렌드 → 모두 🏷️ 티백으로 (10-06)
  $('#p-tearoom').innerHTML = `<div class="stack">
    <div class="shop-news"><span>${cal.frozen ? '🌙 꽃잠에는 품질이 그대로예요' : '꽃잎은 <b class="val-down">한 달에 20%씩 줄어요</b> · 꽃방에 말리면 멈춰요'}</span><span>🏷️ 티백은 찻집으로 가요</span></div>
    <nav class="flow-steps" aria-label="제다실 흐름">${[['tr-petal', '🌸', '생화', st.petals.length], ['tr-dry', '🌾', '꽃방', st.drying.length], ['tr-dried', '🍂', '말린 꽃잎', st.dried.length], ['tr-blend', '🫖', '블렌드', loose.length]].map(([id, ic, nm, n], j) => `${j ? '<span class="fs-arrow" aria-hidden="true">›</span>' : ''}<button type="button" class="fs-step ${n ? '' : 'zero'}" data-jump="${id}"><span>${ic}</span>${nm}<b class="data">${n}</b></button>`).join('')}<span class="fs-arrow" aria-hidden="true">›</span><button type="button" class="fs-step out" data-go="cab"><span>🏷️</span>찻집으로</button></nav>
    <div class="cab-head" id="tr-petal"><span class="sb-title">🌸 생화${st.petals.length ? ` <span class="sh-n">${st.petals.length}</span>` : ''}</span><span class="muted">그냥 두면 <b class="val-down">품질이 줄어요</b> · 바로 티백(<b class="val-down">값 −10%</b>) 또는 건조</span>${st.petals.length > 1 ? `<span class="right"><button type="button" class="btn small primary" data-dry="all">전체 건조</button><button type="button" class="btn small" data-raw="all">전체 티백</button></span>` : ''}</div>
    ${petalCards ? `<div class="shopgrid cabgrid">${petalCards}</div>` : '<div class="cab-empty"><span>🧺</span><div><b>꽃잎이 없어요</b> <span class="muted">꽃이 피면 정원에서 거둬요</span></div></div>'}
    <div class="cab-head" id="tr-dry"><span class="sb-title">🌾 꽃방${st.drying.length ? ` <span class="sh-n">${st.drying.length}</span>` : ''}</span><span class="muted">1달이면 다 말라요</span></div>
    ${dryTabs}
    ${dryingCards ? `<div class="shopgrid cabgrid">${dryingCards}</div>` : '<div class="cab-empty slim"><span>🌾</span><div class="muted">위 생화에서 "🌾 건조"를 눌러요</div></div>'}
    <div class="cab-head" id="tr-dried"><span class="sb-title">🍂 말린 꽃잎${st.dried.length ? ` <span class="sh-n">${st.dried.length}</span>` : ''}</span><span class="muted">시들지 않아요 · 블렌딩이나 티백으로</span></div>
    ${driedCards ? `<div class="shopgrid cabgrid">${driedCards}</div>` : '<div class="cab-empty slim"><span>🍂</span><div class="muted">꽃방에서 다 마르면 여기로 와요</div></div>'}
${blendBox}
    ${loose.length ? `<div class="cab-head"><span class="sb-title">🫖 블렌드 <span class="sh-n">${loose.length}</span></span><span class="muted">티백으로 만들어 찻집으로</span>${loose.length > 1 ? '<span class="right"><button type="button" class="btn small primary" data-bagblend="all">전체 티백</button></span>' : ''}</div><div class="shopgrid cabgrid">${looseCards}</div>` : ''}</div>`;
}
['#p-cab', '#p-tearoom'].forEach(sel => $(sel).addEventListener('toggle', e => { if (e.target.matches('.bl-book')) ui.bookOpen = e.target.open; }, true));   // 레시피 펼침 기억
['#p-cab', '#p-tearoom'].forEach(sel => $(sel).addEventListener('click', cabClick));
// P23-01 💌 손님 주문 쪽지: 찻집이 열린 달마다 3장, 맞는 찻잔이 팔리면 ✓와 기념품
function ordersHTML() {
  const os = st.orders && st.orders.list; if (!os) return '';
  const done = os.filter(o => o.done).length;
  return `<div class="cab-head"><span class="sb-title">💌 손님 주문 <span class="sh-n">${done} / ${os.length}</span></span><span class="muted">맞는 찻잔이 팔리면 손님이 기념품을 두고 가요 · 다음 달엔 새 쪽지</span></div>
    <div class="orders">${os.map(o => `<div class="order ${o.done ? 'done' : ''}"><span class="od-ic">${o.done ? '✓' : '💌'}</span><span>${o.kind === 'tea' ? spriteImg(o.type, 'tea', 32, false, '') : ''}<b>${E.orderText(o)}</b></span></div>`).join('')}</div>`;
}
// P17-15 찻집 가꾸기 창 (10-06 백업 → 10-24): 🪑 손님 자리 · ☕ 찻잔 세트 · 🪧 간판. 값은 여기(사는 곳)에서만
function seatText() { const n = E.shopOf(st).seats; return n === 1 ? '☕ 손님이 1시간마다 한 잔씩 사 가요' : `☕ 손님 ${n}자리 · 1시간에 ${n}잔씩 사 가요`; }
function openShopUp() {
  const sh = E.shopOf(st), next = E.SEATS[sh.seats + 1];
  const tile = (kind, key, it) => {
    const own = (kind === 'cup' ? sh.cups : sh.signs).includes(key), on = sh[kind] === key, short = !own && st.money < it.price;
    const art = kind === 'cup' ? `<img class="px" src="${cupPreview(key)}" width="48" height="48" alt="">` : `<span class="sgn-mini sign-${key}"><b>OPEN</b></span>`;
    return `<button type="button" class="up-tile ${on ? 'on' : ''}" data-up="${kind}:${key}" ${on || short ? 'disabled' : ''} aria-pressed="${on}">${art}<b>${it.name}</b><small>${it.desc}</small><span class="up-price ${short ? 'bad' : ''}">${on ? '✓ 쓰는 중' : own ? '쓰기' : won(it.price)}</span></button>`;
  };
  const body = `<div class="up-pop">
    <div class="up-sec"><div class="up-h">🪑 손님 자리 <span class="muted">자리만큼 한 시간에 여러 잔이 팔려요 · 값은 그대로</span></div>
      <div class="up-seats">${[1, 2, 3].map(n => `<span class="seat ${n <= sh.seats ? 'on' : ''}" aria-hidden="true">🪑</span>`).join('')}<span class="muted">지금 ${sh.seats}자리 · 1시간에 ${sh.seats}잔</span>
        ${next ? `<button type="button" class="btn small primary" data-up="seat" ${st.money < next.price ? 'disabled' : ''}>🪑 ${sh.seats + 1}자리 · ${won(next.price)}</button>` : '<span class="muted">✓ 다 늘렸어요</span>'}</div></div>
    <div class="up-sec"><div class="up-h">☕ 찻잔 세트 <span class="muted">보기만 바뀌어요</span></div><div class="up-grid">${Object.entries(E.CUP_SETS).map(([k, it]) => tile('cup', k, it)).join('')}</div></div>
    <div class="up-sec"><div class="up-h">🪧 간판 <span class="muted">보기만 바뀌어요</span></div><div class="up-grid">${Object.entries(E.SIGNS).map(([k, it]) => tile('sign', k, it)).join('')}</div></div>
    <div class="up-wallet"><span class="muted">💰 가진 돈</span><b class="data">${won(st.money)}</b></div></div>`;
  openModal('🪑 찻집 가꾸기', body, [{ label: '닫기', act: () => closeModal() }]);
  $('#modalRoot').querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const v = b.dataset.up;
    const go = () => { const r = v === 'seat' ? E.addSeat(st) : E.buyDecor(st, ...v.split(':')); feedback(r.msg, !r.ok); if (r.ok) { save(); renderAll(true); } openShopUp(); };
    if (v !== 'seat') return go();
    const nx = E.SEATS[E.shopOf(st).seats + 1];
    openModal('🪑 손님 자리 늘리기', `<p>손님 자리를 ${E.shopOf(st).seats + 1}자리로 늘려요 · <b class="data">${won(nx.price)}</b></p><p class="muted">한 시간에 ${E.shopOf(st).seats + 1}잔씩 팔려요 · 되돌릴 수 없어요</p>`, [{ label: '취소', act: () => openShopUp() }, { label: `늘리기 · ${won(nx.price)}`, primary: true, act: go }]);
  });
}
function cupPreview(set) {                     // 찻잔 세트 미리보기 (빈 찻잔)
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'), pal = Object.assign({}, SPR.cupPal, E.CUP_SETS[set].pal, { T: '#d9c79a', f: '#e3a3b3' });
  SPR.cup.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c.toDataURL();
}
// P18 찻잔에 꿀 한 숟갈: 가진 꿀 고르기 → 그 줄의 찻잔 하나에
function openHoneyPick(ids) {
  const kinds = E.HONEY_KEYS.filter(k => (st.honey || {})[k] > 0), c = st.cups.find(x => ids.includes(x.id) && !x.honey);
  if (!c || !kinds.length) return;
  openModal('🍯 꿀 한 숟갈', `<div class="honeypick">${kinds.map(k => `<button type="button" class="up-tile" data-hk="${k}">${honeyImg(k, 3)}<b>${E.honeyName(k)}</b><small>×${st.honey[k]}</small></button>`).join('')}</div><p class="muted" style="margin-top:8px">찻잔 하나에 넣어요 · 꿀차가 돼요 · 값은 그대로예요</p>`, [{ label: '닫기', act: () => closeModal() }]);
  $('#modalRoot').querySelectorAll('[data-hk]').forEach(b => b.onclick = () => { closeModal(); after(E.honeyCup(st, c.id, b.dataset.hk)); });
}
function cabClick(e) {
  if (e.target.closest('[data-act="shopUp"]')) return openShopUp();
  const hc = e.target.closest('[data-honeycup]'); if (hc) return openHoneyPick(hc.dataset.honeycup.split(',').map(Number));
  const jp = e.target.closest('[data-jump]'); if (jp) { const t = document.getElementById(jp.dataset.jump); if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 70); return; }
  const tb = e.target.closest('[data-drt]'); if (tb) { ui.dryTab = tb.dataset.drt; return renderCab(true); }
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.raw) { const ids = b.dataset.raw === 'all' ? st.petals.map(p => p.id) : b.dataset.raw.split(',').map(Number); return openTeaConfirm(ids, 'raw'); }
  if (b.dataset.make) { const ids = b.dataset.make === 'all' ? st.petals.map(p => p.id) : b.dataset.make.split(',').map(Number); return openTeaConfirm(ids, false); }
  if (b.dataset.dry) { const ids = b.dataset.dry === 'all' ? st.petals.map(p => p.id) : b.dataset.dry.split(',').map(Number); return openDryConfirm(ids); }
  if (b.dataset.makedried) return openTeaConfirm(b.dataset.makedried.split(',').map(Number), true);
  if (b.dataset.bsel) {                                // 블렌딩 재료 고르기: 같은 묶음에서 아직 안 고른 한 장
    const type = b.dataset.bsel, p = st.dried.filter(x => x.type === type && !ui.blendSel.includes(x.id)).sort((a, c) => c.q - a.q)[0];   // 그 꽃 중 가장 좋은 한 장
    if (p && ui.blendSel.length < 3) ui.blendSel.push(p.id);
    return renderCab(true);
  }
  if (b.dataset.recipe) {
    ui.blendSel = E.BLENDS[b.dataset.recipe].parts.map(t => st.dried.filter(x => x.type === t).sort((p, q) => q.q - p.q)[0]).filter(Boolean).map(p => p.id);
    renderCab(true); const box = document.querySelector('#p-tearoom .blendbox'); if (box) window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - 90);
    return;
  }
  if (b.dataset.bunsel) { ui.blendSel = ui.blendSel.filter(id => id !== +b.dataset.bunsel); return renderCab(true); }
  if (b.dataset.blend) return openBlendConfirm();
  if (b.dataset.bagblend) return openBagBlend(b.dataset.bagblend === 'all' ? st.blends.filter(x => !x.bagged).map(x => x.id) : [+b.dataset.bagblend]);
  if (b.dataset.brew) return b.dataset.brew === 'all' ? openBrewConfirm(st.teas.map(t => t.id), st.blends.filter(x => x.bagged).map(x => x.id)) : openBrewConfirm(b.dataset.brew.split(',').map(Number), []);
  if (b.dataset.brewblend) return openBrewConfirm([], [+b.dataset.brewblend]);
  if (b.dataset.sellcup) return openSellConfirm(b.dataset.sellcup === 'all' ? st.cups.map(c => c.id) : b.dataset.sellcup.split(',').map(Number));
}
