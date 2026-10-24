// 도리의 정원 — 화면: 오늘의 정원 · 땅 안내 · 빈 정원 · 그리기 반복 · 시작 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 오늘의 정원 · 땅 안내 · 빈 정원
const allFlowerTiles = () => st.flowers.filter(f => !f.withered).map(f => [f.x, f.y]);
function renderToday(force) {
  const cal = E.calendar(st.virtual), gd = guideState();
  const need = careNeed(cal);
  const showGuide = !gd.hidden && guideList().some(([k]) => !gd[k]);
  const nq = !showGuide && st.journal && !st.journal.hidden && guideList().every(([k]) => gd[k]) ? nextQuest(cal) : null;
  const sig = JSON.stringify([need, cal.frozen, showGuide && guideList().map(([k]) => !!gd[k]), nq && [nq.q.key, nq.w.now, nq.w.label]]);
  if (!force && ui.sigs.today === sig) return;
  ui.sigs.today = sig;
  let html = '';
  if (showGuide) {
    const next = guideList().findIndex(([k]) => !gd[k]);
    // 한 줄로: 첫걸음 ○/5 · 단계 점 다섯 개 · 지금 할 일 (설명은 작게) · ✕
    const doneN = guideList().filter(([k]) => gd[k]).length, [nk, nl] = guideList()[next];
    html += `<div class="guide"><span class="gd-t">🌱 첫걸음 <span class="data">${doneN} / ${guideList().length}</span></span>
      <span class="gd-steps">${guideList().map(([k, label], i) => `<i class="${gd[k] ? 'done' : i === next ? 'now' : ''}" title="${label}${gd[k] ? ' ✓' : ''}">${[...label][0]}</i>`).join('')}</span>
      <span class="gd-now"><b>${nl}</b>${guideSub(nk, need)}</span>
      <button type="button" class="x" data-do="hideGuide" aria-label="첫걸음 안내 닫기" title="안내 닫기">✕</button></div>`;
  } else if (nq) {
    const n = nq.c.quests.filter(q => st.journal.done[q.key] != null).length;
    html += `<div class="guide jguide"><span class="gd-t">📜 ${nq.c.no}장 ${nq.c.name} <span class="data">${n} / ${nq.c.quests.length}</span></span>
      <span class="gd-now"><b>${E.questName(nq.q, st)}</b><small>${nq.w.now ? '지금 할 수 있어요' : nq.w.label || '때가 되면'}${nextReason()}</small></span>
      <button type="button" class="btn small" data-do="journal">📔 도감일지</button>
      <button type="button" class="x" data-do="hideJournal" aria-label="퀘스트 안내 닫기" title="안내 닫기 (도감일지에서는 계속 보여요)">✕</button></div>`;
  }
  $('#today').innerHTML = html;
}
// "다음에 올 이유" (QA 6회차): 곧 필 꽃 · 광산 기력이 다 차는 때
function nextReason() {
  const out = [], cal = E.calendar(st.virtual);
  let best = null;
  for (const f of st.flowers) {
    if (f.withered || f.stage === 'bloom') continue;
    const F = FLOWERS[f.type], n = E.untilMonth(st.virtual, c => !c.frozen && F.bloom.includes(c.month));
    if (n && f.ageH + n.hours >= F.mature * E.MONTH_H && (!best || n.hours < best.h)) best = { F, h: n.hours, m: n.cal.month };
  }
  if (best && best.h < 72) out.push(`🌸 ${josa(best.F.name, '이/가')} ${monthName(best.m)}(${realH(best.h / (st.speed || 1))} 뒤)에 펴요`);
  const m = E.mineOf(st);
  if (m.energy < E.MINE_MAX_E) out.push(`⛏️ 기력 ${realH(((E.MINE_MAX_E - m.energy) * E.MINE_REGEN_H - m.regenH) / (st.speed || 1))} 뒤 가득`);
  else out.push('⛏️ 광산 기력이 가득해요');
  return out.length && !cal.frozen ? ` · 다음: ${out.join(' · ')}` : (out.length ? ` · ${out.join(' · ')}` : '');
}
$('#today').addEventListener('click', e => {
  const b = e.target.closest('[data-do]'); if (!b) return;
  const d = b.dataset.do;
  if (d === 'hideGuide') { guideState().hidden = true; save(); return renderToday(true); }
  if (d === 'hideJournal') { st.journal.hidden = true; save(); return renderToday(true); }
  if (d === 'journal') { ui.dexTab = 'journal'; setTab('dex'); return $('#jQuests') && $('#jQuests').scrollIntoView({ block: 'start' }); }
  if (d === 'gocab') return setTab('tearoom');
  if (d === 'plant') { ui.tool = 'plant'; ui.plantType = null; renderToolbar(true); return renderEmpty(true); }
  const r = E.care(st, d, allFlowerTiles(), ctx);
  after(r, d === 'water' ? 'watered' : d === 'harvest' ? 'harvested' : null, d === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null);
});
function renderLegend() {
  const c = E.landCounts(st), sig = JSON.stringify(c);
  if (ui.sigs.legend === sig) return;
  ui.sigs.legend = sig;
  // 땅 범례: 넓은 땅부터, 칸 수와 함께 작은 칩으로 (황무지는 맨 뒤)
  const keys = LAND_KEYS.filter(k => c[k]).sort((a, b) => (a === 'barren') - (b === 'barren') || c[b] - c[a]);
  $('#legend2').innerHTML = keys.map(k => `<span class="lg-chip ${k === 'barren' ? 'barren' : ''}"><span class="sw" style="background:${LANDS[k].color}"></span>${LANDS[k].name} <span class="data">${c[k]}</span></span>`).join('');
}
function renderEmpty(force) {
  const cal = E.calendar(st.virtual), live = st.flowers.some(f => !f.withered), el = $('#emptyMap');
  const pl = Object.keys(plantable()).length;
  const sig = [live, cal.frozen, pl, ui.tool].join('|');
  if (!force && ui.sigs.empty === sig) return;
  ui.sigs.empty = sig;
  if (live || ui.tool === 'plant') { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const text = cal.frozen ? '정원은 쉬고 있어요. 다음 해에 심을 꽃을 예약해 보세요.'
    : pl ? '창고에 심을 것이 있어요. 심기를 골라 빈 칸을 눌러 보세요.'
    : '꽃을 심으면 그 꽃이 좋아하는 땅으로 바뀌어요. 화원에서 제철 꽃을 사 보세요.';
  const btn = cal.frozen ? '<button type="button" class="btn primary" data-go="shop">💐 예약</button>'
    : pl ? '<button type="button" class="btn primary" data-start-plant="1">🌰 심기</button>'
    : '<button type="button" class="btn primary" data-go="shop">💐 화원</button>';
  el.innerHTML = `<div class="box"><b>${cal.frozen ? '꽃잠이에요' : '아직 꽃이 없어요'}</b><span class="muted" style="font-size:13px">${text}</span>${btn}</div>`;
}
$('#emptyMap').addEventListener('click', e => {
  if (!e.target.closest('[data-start-plant]')) return;
  ui.tool = 'plant'; ui.plantType = null; renderToolbar(true); renderEmpty(true);
});

// ---------------------------------------------------------------- 그리기 반복
function renderAll(force) {
  renderTop();
  const cal = E.calendar(st.virtual);
  if (!cal.frozen) ui.restClosed = false;
  $('#restBanner').hidden = !cal.frozen || ui.restClosed || !$('#emptyMap').hidden;
  if (ui.tab === 'garden') { renderToday(force); renderToolbar(force); renderStatus(force); renderLegend(); renderYear(force); renderGardenLog(force); renderEmpty(force); }
  if (ui.tab === 'shop') renderShop(force);
  if (ui.tab === 'store') renderStore(force);
  if (ui.tab === 'cab' || ui.tab === 'tearoom') renderCab(force);
  if (ui.tab === 'dex') renderDex(force);
  if (ui.tab === 'manual') renderManual(force);
  if (ui.tab === 'settings' && force) renderSettings();   // 입력 중에 다시 그려지지 않게, 들어올 때만
  showNewTitles();
}
let lastUi = 0, lastSave = Date.now();
// P25-01 "자리를 비운 동안" 창
function showAway() {
  const a = awayInfo; awayInfo = null;
  if (!a || $('#modalRoot').innerHTML) return;
  const hh = a.h >= 48 ? `${Math.round(a.h / 24)}일` : `${Math.round(a.h)}시간`;
  const pick = a.lines.slice(-8).map(l => `<li><span>${LOG_IC[l.type] || '·'}</span>${esc(l.text)}</li>`).join('');
  const chips = [a.money ? `💰 ${a.money > 0 ? '+' : ''}${won(a.money)}` : '', a.thirsty ? `💧 목마른 꽃 ${a.thirsty}포기` : '🌿 목마른 꽃 없어요', `⛏️ 기력 ${a.gained > 0 ? `+${a.gained} · ` : ''}${a.energy >= E.MINE_MAX_E ? '가득' : `${a.energy} / ${E.MINE_MAX_E}`}`].filter(Boolean);
  openModal(`🌙 자리를 비운 동안 · ${hh}`, `<div class="away-pop"><div class="away-chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
    ${pick ? `<ul class="away-log">${pick}</ul>${a.lines.length > 8 ? `<p class="muted">그 밖에 ${a.lines.length - 8}줄은 📜 정원 일지에 있어요</p>` : ''}` : '<p class="muted">조용히 시간이 흘렀어요</p>'}</div>`,
    [{ label: '닫기', act: () => closeModal() }, ...(a.thirsty ? [{ label: '💧 정원으로', primary: true, act: () => { closeModal(); setTab('garden'); ui.flash = { t: 'water', until: performance.now() + 2400 }; } }] : [])]);
}
function frame() {
  const real = Date.now(), dt = real - st.lastReal;
  const snap = dt > AWAY_H * HOUR ? awaySnap() : null;   // 다른 탭 · 잠든 화면에서 오래 있다 돌아옴 (P25-01)
  st.lastReal = real;
  if (dt > 0) {
    ctx.live = dt < 5000;                         // P11-02-01-c: 다른 탭에 있다가 돌아온 동안 생긴 알림은 로그에만
    E.advance(st, st.virtual + dt * (st.speed || 1), ctx);
    ctx.live = true;
    if (snap) { awayInfo = awayDiff(snap); showAway(); }
  }
  if (ui.tab === 'garden') draw();
  if (real - lastUi > 400) { renderAll(false); lastUi = real; }
  if (real - lastSave > 3000) { save(); lastSave = real; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

resize(); renderAll(true);
if (window.__brokenSave) brokenNotice(() => { if (!st.onboarded) onboarding(); });
else if (!st.onboarded) onboarding();
else showAway();
requestAnimationFrame(frame);
