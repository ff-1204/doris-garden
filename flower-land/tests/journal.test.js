// 도감일지: 퀘스트 → 칭호 · 숨은 레시피 · 예전 저장 소급 (P19)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };

console.log('[구성]');
check(E.QUESTS.length === 31 && E.CHAPTERS.length === 7, '퀘스트 0~6장 31개');
check(E.TITLE_KEYS.length === 15 && E.TITLE_KEYS.filter(k => E.TITLES[k].chapter).length === 7, '칭호 15개 (장 칭호 7 · 숨은 칭호 8)');
check(['s', 'f', 'g'].map(t => E.TITLE_KEYS.filter(k => E.TITLES[k].tier === t).length).join() === '4,6,5', '등급 새싹 4 · 꽃 6 · 정원 5');

console.log('[0장 첫 방문]');
const first = E.create(MON + H, () => 0.5);
E.checkJournal(first, ctx);
check(E.chapterOpen(first, 'c0') && first.titles.t_visit == null, '0장은 처음부터 열려 있고, 첫 안내 창 전엔 칭호 없음');
first.onboarded = true;   // 첫 안내 창의 '시작'
E.checkJournal(first, ctx);
check(first.journal.done.c0_visit != null && first.titles.t_visit != null && first._newTitles.includes('t_visit'), "'시작'을 누르면 퀘스트 완료 · 칭호 「정원 문을 연 사람」");
check(E.DEX_TOTAL === 93 && E.BLEND_KEYS.length === 9, '숨은 레시피는 기본 도감 93칸에 들지 않음');

console.log('[장이 열리는 순서]');
const st = E.create(MON + H, () => 0.5);
E.checkJournal(st, ctx);
check(!E.chapterOpen(st, 'c1') && !Object.keys(st.journal.done).length, '첫걸음 전엔 1장이 닫혀 있음');
st.guide = { celebrated: true };
check(E.chapterOpen(st, 'c1') && !E.chapterOpen(st, 'c2') && !E.chapterOpen(st, 'c6'), '첫걸음을 마치면 1장만 열림');
st.dex.land.pond = true;
E.checkJournal(st, ctx);
check(st.journal.done.c3_pond == null, '닫힌 장의 퀘스트는 아직 체크하지 않음');

console.log('[1장 → 칭호]');
st.dex.flower.chamomile = true; st.dex.petal.chamomile = true;
E.checkJournal(st, ctx);
check(st.journal.done.c1_bloom != null && st.journal.done.c1_petal != null, '도감 등록으로 퀘스트 자동 체크');
check(st.log.some(l => l.text === '📜 퀘스트: 캐모마일 피우기 완료'), '정원 일지에 퀘스트 완료 한 줄');
st.petals.push({ id: 900, type: 'chamomile', q: 0.8 });
E.dryPetals(st, [900]);
st.dex.teabag.chamomile = true; st.dex.land.grassland = true; st.dex.tea.chamomile = 0.8;
E.checkJournal(st, ctx);
check(st.titles.t_first != null && (st._newTitles || []).includes('t_first'), '1장을 마치면 칭호 「새싹 정원사」 + 얻는 연출 대기');
check(['c2', 'c3', 'c4', 'c5'].every(k => E.chapterOpen(st, k)) && !E.chapterOpen(st, 'c6'), '1장을 마치면 2~5장이 함께 열림, 6장은 아직');
check(st.journal.done.c3_pond != null, '열리기 전에 해 둔 퀘스트는 열릴 때 체크');

console.log('[숨은 레시피]');
check(E.blendRecipe(['chamomile', 'rose', 'lavender'], st) === null, '블렌드 연구가 전엔 세 가지 블렌드에 이름이 없음');
const before = E.dexTotal(st);
['springfield', 'sleepnight', 'violetdusk', 'redsummer', 'sunfield'].forEach(k => { st.dex.blend[k] = 0.8; });
st.dex.bagBlend.springfield = true;
E.checkJournal(st, ctx);
check(st.titles.t_blend != null, '4장을 마치면 「블렌드 연구가」');
check(E.blendRecipe(['lavender', 'chamomile', 'rose'], st) === 'threegarden' && E.dexTotal(st) === before + 2, '숨은 레시피 「세 정원의 오후」가 열리고 도감 칸 +2');
st.dried.push({ id: 901, type: 'chamomile', q: 0.8 }, { id: 902, type: 'rose', q: 0.8 }, { id: 903, type: 'lavender', q: 0.8 });
const b = E.blend(st, [901, 902, 903], ctx).blend;
check(b.recipe === 'threegarden' && E.blendValue(b) === E.blendValue({ parts: b.parts, q: b.q }, st), '숨은 레시피 블렌드는 ×1.5 (레시피 값)');
check(E.blendValue({ parts: b.parts, q: b.q }) < E.blendValue(b), '칭호가 없으면 같은 재료도 ×1.2');

console.log('[찻집 셈 · 숨은 칭호]');
const fri = E.create(MON, () => 0.5);
E.advance(fri, MON + 4 * 24 * H + 12 * H + 60e3, ctx);   // 금요일 저녁 6시 = 12월, 찻집 열림
fri.teas.push({ id: 950, type: 'rose', q: 0.95, hat: true }, { id: 951, type: 'rose', q: 0.6 });
E.brew(fri, [950, 951], []);
const cups = fri.cups.map(c => c.id);
E.sellCups(fri, [cups[0]], ctx);
check(fri.stats.cups === 1 && fri.stats.warmCups === 1 && fri.stats.hatCups === 1 && !fri.stats.autoCups, '직접 판 찻잔: 전체 · 갓 우린 · 햇차 1잔씩');
E.advance(fri, fri.virtual + 1.5 * H, ctx);
check(fri.stats.autoCups === 1 && fri.stats.cups === 2, '손님이 사 간 찻잔도 셈');
fri.stats.hatCups = 5; E.checkJournal(fri, ctx);
check(fri.titles.t_hat != null, '햇차 5잔이면 숨은 칭호 「햇차 장인」');
const sun = E.create(MON + 6 * 24 * H + 3 * H, () => 0.5);
E.checkJournal(sun, ctx);
check(sun.titles.t_sleep != null, '꽃잠에 시작하면 「꽃잠에 온 손님」');

console.log('[6장 · 대표 칭호 · 기록]');
const y2 = E.create(MON, () => 0.5);
E.advance(y2, MON + 7 * 24 * H + 60e3, ctx);
check(E.chapterOpen(y2, 'c6') && y2.titles.t_record != null, '2년차 3월에 6장이 열리고, 한 해 기록으로 「한 해의 기록자」');
check(!E.setTitleOn(y2, 't_tree').ok && E.setTitleOn(y2, 't_record').ok && y2.titleOn === 't_record', '얻은 칭호만 대표로 걸 수 있음');
E.advance(y2, MON + 14 * 24 * H + 60e3, ctx);
check(y2.records[0].titleOn === 't_record', '한 해 기록에 그해 대표 칭호');

console.log('[예전 저장 소급]');
const old = E.create(MON, () => 0.5);
delete old.journal; delete old.titles; delete old.stats; delete old.titleOn;
old.guide = { celebrated: true }; Object.assign(old.dex.flower, { chamomile: true }); old.dex.petal = { chamomile: true };
E.checkJournal(old, ctx);
check(old.journal.done.c1_bloom != null && old.journal.done.c1_petal != null, '해 둔 퀘스트에 도장 소급');
check(!(old._newTitles || []).length && old.log.filter(l => l.text.startsWith('📔')).length === 1 && !old.log.some(l => l.text.startsWith('📜')), '소급은 얻는 연출 없이 정원 일지 한 줄만');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
