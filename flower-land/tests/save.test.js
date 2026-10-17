// 저장 파일: 만들기 · 검사 · 요약 (P20-02 · 03)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };

const st = E.create(MON, () => 0.5);
E.advance(st, MON + 30 * H, ctx);
st.onboarded = true; E.checkJournal(st, ctx); E.setTitleOn(st, 't_visit');
const other = E.create(MON, () => 0.5);
check(typeof st.gardenId === 'string' && st.gardenId !== other.gardenId, '정원마다 다른 이름표(gardenId)');

console.log('[만들기]');
const d = E.makeSave(st, 12345);
check(d.app === 'doris-garden' && d.format === E.SAVE_FORMAT && d.savedAt === 12345 && d.gardenId === st.gardenId, '앱 · 형식 · 저장 시각 · 이름표');
check(d.summary.year === 1 && d.summary.month === E.calendar(st.virtual).month && d.summary.titles === 1 && d.summary.titleOn === 't_visit', '요약: 년차 · 달 · 칭호 수 · 대표 칭호');
check(!('_newTitles' in d.game) && '_newTitles' in st, '얻는 연출 대기열은 파일에 넣지 않음');
check(d.game !== st && d.game.tiles !== st.tiles, '정원을 복사해서 담음 (지금 정원과 따로)');

console.log('[검사]');
const text = JSON.stringify(d), r = E.parseSave(text);
check(r.ok && JSON.stringify(r.data.game) === JSON.stringify(d.game), '저장한 파일은 그대로 다시 읽힘');
const back = r.data.game;
check(JSON.stringify(E.saveSummary(back)) === JSON.stringify(d.summary), '읽은 정원에서 다시 센 요약이 같음');
const bad = JSON.parse(text); bad.game.money += 1;
check(!E.parseSave(JSON.stringify(bad)).ok && E.parseSave(JSON.stringify(bad)).msg === '파일이 손상됐어요', '내용이 바뀌면 "파일이 손상됐어요"');
check(E.parseSave('그냥 글자').msg === '도리의 정원 저장 파일이 아니에요' && E.parseSave('{"app":"other","game":{}}').msg === '도리의 정원 저장 파일이 아니에요', 'JSON이 아니거나 다른 앱이면 "저장 파일이 아니에요"');
const newer = JSON.parse(text); newer.format = E.SAVE_FORMAT + 1;
check(E.parseSave(JSON.stringify(newer)).msg === '더 새로운 버전에서 저장한 파일이에요', '더 새 형식은 거절');
const cut = JSON.parse(text); cut.game.tiles = cut.game.tiles.slice(1); cut.check = (() => { let h = 0x811c9dc5; const s = JSON.stringify(cut.game); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); })();
check(!E.parseSave(JSON.stringify(cut)).ok, '해시가 맞아도 땅 칸 수가 틀리면 거절');

console.log('[불러온 정원으로 이어 하기]');
back.lastReal = 0;   // 화면은 lastReal부터 지금까지 따라잡음 — 엔진은 그대로 진행돼야 함
E.advance(back, back.virtual + 12 * H, ctx);
check(E.calendar(back.virtual).abs > E.calendar(st.virtual).abs, '불러온 정원도 시간이 흐름');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
