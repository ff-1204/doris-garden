// 🍃 그동안 (P30-07, L2-4 10-30): 1해(현실 1주) 넘게 비웠다 열면 세 줄 — 지나간 해 수(현실 시간) · 그사이 놓친 올해만 것 · 다음 층까지 남은 것
// 13해(13주) 비운 저장 · 1해 미만이면 없음 · 따라잡기 상한을 넘으면 건너뛴 구간 한 줄 · 🐢 느긋하게 보기면 숫자 없음 · 꼭대기 층 · 놓친 것 없음
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const hasNum = s => /\d/.test(s);

// 앱(app.js catchUp)과 같은 따라잡기: 상한까지만 흐르고 나머지는 건너뜀 → 열었음(yearlyMark)
function openAfter(st, gap) {
  const real = st.lastReal, snap = E.awayLongSnap(st), CAP = E.catchUpH(st) * H;
  if (gap > CAP) { E.advance(st, st.virtual + CAP, ctx); st.virtual += gap - CAP; st.lastAbs = E.calendar(st.virtual).abs; }
  else E.advance(st, st.virtual + gap, ctx);
  st.lastReal = real + gap;
  E.yearlyMark(st, E.calendar(st.virtual), ctx);
  return E.awayLines(st, real, snap, real + gap);
}
function garden(id) {   // 3층까지 연 정원, 봄 첫 달에 열어 봄 것을 봄
  const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = id; st.onboarded = true;
  st.dex.tea.chamomile = 1; st.stats.dug = 1;
  st.lastReal = mon + 0.1 * H;
  E.yearlyMark(st, E.calendar(st.virtual), ctx);
  return st;
}

console.log('[13해 비운 저장 — 상한 3주까지만 따라잡음]');
const st = garden('away-13');
const a = openAfter(st, 13 * WEEK + 2 * H);
check(a && a.years === 13, `지나간 해 수는 현실 시간으로 13해 (${a && a.years})`);
check(a.counted === 3 && a.skipped, `해마다 기록은 따라잡은 3해만큼만 · 건너뜀 표시 (${a.counted})`);
check(E.yearlyNo(st) === 4 && st.yearLog.length === 3, '해 번호 · 층의 흐른 해는 바꾸지 않음 (3줄 → 4해째)');
check(a.missed.length >= 1 && a.missed.every(m => E.YEARLY[m.key] && m.name && m.icon), `놓친 올해만 것 목록 (${a.missed.map(m => m.name).join(', ')})`);
check(new Set(a.missed.map(m => m.key)).size === a.missed.length, '같은 것은 한 번만');
check(a.missed.every(m => E.yearlyMissedAll(st).some(x => x.key === m.key)), '모두 달력의 놓친 것(다음 해에 다시)에 있음');
check(!a.missed.some(m => m.key === E.yearlyOf(st, 1)[0].key && m.season === 0 && m.year === 1), '열고 본 첫해 봄 것은 놓친 것이 아님');
check(a.layer.layer === 3 && a.layer.next && a.layer.next.layer === 4 && a.layer.next.yearsLeft === 5, `다음 층 4층까지 5해 더 (${a.layer.next && a.layer.next.yearsLeft})`);
let t = E.awayLinesText(a);
check(t.title === '🍃 그동안' && t.years === '정원에 13해가 지났어요', `첫 줄 "${t.years}"`);
check(t.skipped === '그 사이 정원은 조용히 쉬었어요 · 해 번호는 따라잡은 3해만큼만 가요', `건너뜀 한 줄 "${t.skipped}"`);
check(t.missed.endsWith('못 봤어요 · 다음 해 그 계절에 다시 와요') && t.missed.includes(a.missed[0].name), `놓친 줄 "${t.missed}"`);
check(t.layer === '다음 층 🌳 4층 작은 숲까지 정원 해로 🗓️ 5해 더 · 📖 꽃 도감 0 / 13', `층 줄 — L3부터 4층은 열 수 있는 층 · "업데이트" 한마디 없음 "${t.layer}"`);
{ const r = E.awayLines(st, mon - WEEK, { yl: 3, at: null }, mon); r.layer.next = { ...r.layer.next, held: true };
  check(E.awayLinesText(r).layer === '다음 층 🌳 4층 작은 숲은 다음 업데이트에 열려요 · 정원 해로 🗓️ 5해 더 · 📖 꽃 도감 0 / 13', `못 여는 층(held)이면 업데이트 한마디 "${E.awayLinesText(r).layer}"`); }
check(E.isYearlyMissLine('🌈 무지개는 못 봤어요 · 다음 해 봄에 다시 와요') && !E.isYearlyMissLine('올해 봄엔 🌈 무지개가 왔어요'), '일지의 놓침 줄을 알아봄 (그동안이 있으면 창 위 일지에선 뺌)');

console.log('[🐢 느긋하게 보기 — 숫자 없이 (P30-08)]');
const slow = copy(st); slow.settings.slow = true;
const ts = E.awayLinesText(E.awayLines(slow, st.lastReal - 13 * WEEK - 2 * H, { yl: 0, at: 0 }, st.lastReal));
check(ts.years === '오래 쉬었다 왔어요 · 정원은 그대로 기다렸어요' && !ts.skipped && ts.layer === null, '해 수 · 건너뜀 · 층 줄 없이 한 줄');
check(!hasNum(ts.years) && !hasNum(ts.missed) && ts.missed.includes(a.missed[0].name), `놓친 것은 이름만 · 숫자 없음 "${ts.missed}"`);

console.log('[1해 미만이면 없음 · 상한 안이면 건너뜀 없음]');
{ const s2 = garden('away-short'), r = openAfter(s2, 3 * H + 60e3);
  check(r === null, '3시간만 비우면 세 줄 없음 (지금 창 그대로)'); }
{ const s2 = garden('away-6d'), r = openAfter(s2, 6 * 24 * H + 23 * H);
  check(r === null, '6일 23시간 비워도 1해 미만이라 없음'); }
{ const s2 = garden('away-2'), r = openAfter(s2, 2 * WEEK + 3 * H), tx = E.awayLinesText(r);
  check(r.years === 2 && r.counted === 2 && !r.skipped && tx.skipped === null, `2주는 상한 안 — 2해 따라잡음 · 건너뜀 줄 없음 (${r.counted})`); }
{ const s2 = garden('away-none'), real = s2.lastReal;
  const r = E.awayLines(s2, real - 2 * WEEK, E.awayLongSnap(s2), real), tx = E.awayLinesText(r);
  check(r.missed.length === 0 && tx.missed === '놓친 올해만 것은 없어요', '놓친 것이 없으면 "놓친 올해만 것은 없어요"'); }
check(E.awayLinesText(null) === null, '없음은 없음');

console.log('[다음 층 줄 — 찻집 전 · 조건 다 참 · 꼭대기]');
{ const s2 = E.create(mon + 0.1 * H, () => 0.5); s2.gardenId = 'away-l1';
  const r = E.awayLines(s2, mon - WEEK, E.awayLongSnap(s2), mon);
  check(E.awayLinesText(r).layer === '다음 층 🍵 2층 찻집 · 찻집에서 첫 찻잔을 팔면 열려요', `1층 "${E.awayLinesText(r).layer}"`); }
{ const s2 = copy(st); s2.yearLog = Array.from({ length: 9 }, (_, i) => ({ year: i + 1, season: 1, score: 1 })); s2.layers.at[3] = 0;
  for (const k of E.FLOWER_KEYS) s2.dex.flower[k] = true;
  const r = E.awayLines(s2, mon - WEEK, { yl: 9, at: null }, mon);
  check(E.awayLinesText(r).layer === '다음 층 🌳 4층 작은 숲 · 조건을 다 채웠어요 · 새해 3월 아침에 열려요', `조건 다 참 (LAYER_MAX_OPEN 4) "${E.awayLinesText(r).layer}"`); }
{ const top = { ...a, layer: { layer: 4, name: '작은 숲', icon: '🌳', next: null } };
  check(E.awayLinesText(top).layer === '🌳 정원이 다 자랐어요 · 모든 층을 열었어요', '꼭대기 층이면 "정원이 다 자랐어요"'); }

console.log('[놓친 것이 많으면 넷까지]');
{ const many = { ...a, missed: E.YEARLY_KEYS.slice(0, 6).map(k => ({ key: k, name: E.YEARLY[k].word, icon: E.YEARLY[k].icon })) };
  const tx = E.awayLinesText(many);
  check(tx.missed.split(' · ').length >= 4 && tx.missed.includes('그 밖에 2가지는 못 봤어요'), `"${tx.missed}"`);
  const sl = E.awayLinesText({ ...many, slow: true });
  check(!hasNum(sl.missed) && sl.missed.includes('는 못 봤어요') || sl.missed.includes('은 못 봤어요'), `느긋하게 보기는 "그 밖에 n가지" 없이 "${sl.missed}"`); }

console.log('[저장 형식 그대로]');
check(!('away' in st) && Object.keys(E.awayLongSnap(st)).join() === 'yl,at', '새 저장 필드 없음 — 비우기 전 값(해마다 기록 줄 수 · 달력 차례)만 awaySnap에');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
