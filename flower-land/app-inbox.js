// 도리의 정원 — 화면: ✉️ 편지함 (P31-02, 10-30 · app-dex 다음, app-manual 앞에 불림)
// 📦 창고 탭 ✉️ 편지함 단추 · 창고 탭 아이콘 점(안 읽은 것이 있으면 — 수 배지 없음, 10-30 전엔 위 막대) → 창 두 칸 ✉️ 편지 · 🔔 소식. 고르는 일은 엔진 inboxOf · inboxUnread · inboxOpen만
'use strict';
// 위 막대 점 — renderTop이 부름. 엔진 판단은 일지 · 편지함이 바뀔 때만 다시 (그리기마다 일지를 훑지 않게)
let inboxSig = null, inboxDot = false;
function inboxTop() {
  const b = $('#inboxDot'); if (!b) return;   // 🍵 찻집 탭 아이콘의 점 (10-31 — 10-30엔 창고, 그 전엔 위 막대 ✉️ 단추)
  const last = st.log[st.log.length - 1], sig = [st.log.length, last && last.at, (st.records || []).length, (st.letterBox || []).length, st.mailSeenAt, E.slowView(st)].join('|');
  if (sig !== inboxSig) { inboxSig = sig; inboxDot = E.inboxUnread(st); }
  if (b.hidden === inboxDot) { b.hidden = !inboxDot; b.title = inboxDot ? '편지함 · 새로 온 것이 있어요' : ''; const sb = $('#cabInbox'); if (sb) sb.classList.toggle('on', inboxDot); }
}
// 언제: 게임 날짜 (느긋하게 보기면 숫자 없이 계절 이름만 — P30-08)
function inboxWhen(y, m, d) {
  if (y == null || m == null) return '예전에';
  if (E.slowView(st)) {
    const i = E.MONTHS.indexOf(m), s = i < 0 ? 4 : Math.min(4, Math.floor(i / 3)), cy = E.yearOf(st, E.calendar(st.virtual));
    return `${y < cy ? '지난 ' : ''}${SEASONS[s]}`;
  }
  return `${yearWord(y)} ${monthName(m)}${d ? ` ${d}일` : ''}`;
}
const INBOX_LETTER_IC = { mail: '📮', neighbor: '✉️', welcome: '💌' };
function renderInbox(ib) {
  const tab = ui.inboxTab === 'news' ? 'news' : 'letters', dot = on => on ? '<i class="ib-new" aria-label="새로 옴"></i>' : '';
  const tb = (k, label) => `<button type="button" data-ibt="${k}" aria-pressed="${tab === k}">${label}</button>`;
  const letters = !ib.letters.length ? '<div class="log-empty">아직 온 편지가 없어요.</div>'
    : ib.letters.map((l, n) => `<button type="button" class="ib-row ib-letter" data-ibl="${n}"><span class="li">${INBOX_LETTER_IC[l.kind]}</span><span class="ib-t"><b>${esc(l.from)}</b><small>${esc(l.title)}</small></span>${l.gift ? '<span class="ib-gift" title="🎁 받기 전">🎁</span>' : ''}<span class="d">${inboxWhen(l.y, l.m)}</span>${dot(l.unread)}</button>`).join('');
  const news = !ib.news.length ? '<div class="log-empty">조용한 정원이에요.</div>'
    : ib.news.map(x => `<div class="ib-row"><span class="li">${x.icon}</span><span class="lt">${esc(x.text)}</span><span class="d">${inboxWhen(x.y, x.m, x.d)}</span>${dot(x.unread)}</div>`).join('')
      + (ib.more ? '<p class="note ib-more">그 밖은 📜 정원 일지 · 📖 기록에 있어요</p>' : '');   // 열린 질문 ①: 최근 30줄 · 넘치면 한 줄
  return `<div class="stack ib-wrap"><span class="seg ib-tabs">${tb('letters', '✉️ 편지')}${tb('news', '🔔 소식')}</span>
    <div class="ib-list">${tab === 'news' ? news : letters}</div>
    ${tab === 'news' ? '' : '<button type="button" class="btn small ib-dex" data-ibdex="1">📖 도감에서 모두 보기</button>'}</div>`;
}
// 열면 점이 사라짐 (st.mailSeenAt = 지금) — 줄마다의 "새로 옴"은 이번에 연 창에서만 보임
function openInbox() {
  const ib = E.inboxOf(st);
  E.inboxOpen(st); save(); inboxSig = null; renderTop();
  const show = () => {
    openModal('✉️ 편지함', renderInbox(ib), [{ label: '닫기', act: () => closeModal() }]);
    const root = $('#modalRoot');
    root.querySelectorAll('[data-ibt]').forEach(b => b.onclick = () => { ui.inboxTab = b.dataset.ibt; show(); });
    root.querySelectorAll('[data-ibl]').forEach(b => b.onclick = () => {
      const l = ib.letters[+b.dataset.ibl], box = st.letterBox || [];
      const item = l.i >= 0 ? box[l.i] : null;
      if (item) item.read = true;                 // 편지함에서 연 편지는 다시 저절로 뜨지 않게 (showLetters)
      save();
      if (l.kind === 'mail') { const m = E.mailOf(st, l.id); return m ? openMail(m) : feedback('편지함에 없는 편지예요', true); }
      openLetter(item || E.letterOf(st, l.key) || { k: l.key }, false);   // 도감 편지 칩과 같은 창
    });
    const dex = root.querySelector('[data-ibdex]');   // ✉️ 편지 칸에만
    if (dex) dex.onclick = () => { closeModal(); ui.dexTab = 'dex'; ui.dexCat = 'letter'; setTab('dex'); window.scrollTo({ top: 0 }); };
  };
  show();
}
// (10-30) 위 막대 ✉️ 단추는 뺌 — 🍵 찻집 머리 '✉️ 편지함' 단추(app-teashop renderCab · data-inbox, 10-31 창고에서 옮김)가 openInbox를 부름
