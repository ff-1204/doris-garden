// 🗓️ 올해만 오는 것 (P30-05-01, L1-3 10-30): 표 12가지 · 한 해 4개 계절마다 하나 · 같은 해 같은 결과 · 이름표마다 다름 · "봤다" = 열기만으로 · 놓친 것은 다음 해 같은 계절 맨 앞
//   · 3해를 놓쳐도 안 사라짐 · 꽃잠엔 없음 · 새 철에 이어짐 · Math.random 없음 · 돈 · 꽃 값 그대로
const path = require('path'), fs = require('fs');
const ENGINE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js'));
const E = require(ENGINE);
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, away = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const SUMMER = 3 * 12 * H, FALL = 6 * 12 * H, WINTER = 9 * 12 * H, REST = 12 * 12 * H;   // 월요일 06시에서 여름 · 가을 · 겨울 · 쉼달까지
const fresh = id => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = id; s.onboarded = true; return s; };
const keysOf = list => list.map(x => x.key).join(',');

console.log('[표 12가지]');
check(E.YEARLY_KEYS.length === 12 && [0, 1, 2, 3].every(s => E.YEARLY_KEYS.filter(k => E.YEARLY[k].season === s).length === 3), '12가지 · 계절마다 3개');
check(['rainbow', 'firefly', 'firstsnow', 'leafrain'].every(k => E.YEARLY[k].kind === 'weather') && [0, 1, 2, 3].every(s => E.YEARLY_KEYS.some(k => E.YEARLY[k].season === s && E.YEARLY[k].kind === 'bloom')), '날씨 그림 + 계절마다 올해의 꽃빛 하나');
check(E.YEARLY.bloom_winter.flowers.join() === 'dongbaek,maehwa,napmae' && E.YEARLY_KEYS.every(k => (E.YEARLY[k].flowers || []).every(f => E.FLOWERS[f])), '겨울 꽃빛은 동백 · 매화 · 납매 중 · 꽃빛 꽃은 모두 있는 꽃');

console.log('[한 해 4개 · 결정적]');
{ const a = fresh('yearly-1'), list = E.yearlyOf(a);
  check(list.length === 4 && list.map(x => x.season).join() === '0,1,2,3' && list.every(x => E.YEARLY[x.key].season === x.season), '한 해 4개 · 계절마다 하나');
  check(keysOf(E.yearlyOf(a)) === keysOf(E.yearlyOf(copy(a))) && JSON.stringify(E.yearlyOf(a, 5)) === JSON.stringify(E.yearlyOf(copy(a), 5)), '같은 정원 같은 해는 같은 결과');
  const yrs = id => [1, 2, 3, 4].map(y => JSON.stringify(E.yearlyOf(fresh(id), y).map(x => [x.key, x.flower]))).join('|');
  check(yrs('yearly-1') !== yrs('yearly-2') && yrs('yearly-2') !== yrs('yearly-3'), '정원 이름표가 다르면 다름');
  const seq = [1, 2, 3].map(y => E.yearlyOf(a, y)[1].key);
  check(new Set(seq).size === 3, `놓친 것이 없으면 해마다 차례로 돌아 3해에 그 계절 3가지를 다 봄 (여름: ${seq.join(' → ')})`);
  const bl = E.YEARLY_KEYS.filter(k => E.YEARLY[k].kind === 'bloom');
  check([1, 2, 3, 4, 5, 6].every(y => E.yearlyOf(a, y).every(x => x.kind !== 'bloom' || E.YEARLY[x.key].flowers.includes(x.flower))) && bl.length === 4, '꽃빛은 그 계절 꽃 중 하나 (해 번호 · 이름표로 정함)'); }

console.log('["봤다" = 그 계절에 열기만]');
const st = fresh('yearly-1'), Y1 = E.yearlyOf(st);
{ const e = E.yearlyMark(st, E.calendar(st.virtual), away);
  check(e && e.key === Y1[0].key && E.yearlySeen(st, Y1[0].key) && E.yearlyOf(st)[0].state === 'seen', `봄에 열면 봄 것(${Y1[0].icon} ${Y1[0].name})을 봄`);
  check(st.log.some(l => l.text.startsWith('올해 봄엔 ') && l.text.endsWith('왔어요')), `일지 한 줄: "${(st.log.find(l => l.text.startsWith('올해 봄엔')) || {}).text}"`);
  check(E.yearlyMark(st, E.calendar(st.virtual), away) === null && st.log.filter(l => l.text.startsWith('올해 봄엔')).length === 1, '한 계절에 여러 번 열어도 한 번만'); }
E.advance(st, mon + REST + H, away);   // 열지 않은 채 한 주가 흐름 (따라잡기)
{ const now = E.yearlyOf(st, 1), missed = E.yearlyMissedAll(st);
  check(now.map(x => x.state).join() === 'seen,missed,missed,missed', '켜 두지 않은 여름 · 가을 · 겨울은 놓침 (따라잡기는 보지 않은 것)');
  check(missed.length === 3 && missed.map(m => m.season).join() === '1,2,3' && missed.every(m => m.year === 1), 'yearlyMissedAll: 놓친 셋 · 해 번호');
  check(st.log.some(l => l.text.includes('못 봤어요 · 다음 해 여름에 다시 와요')) || (st.records[0] && st.records[0].log.some(l => l.text.includes('못 봤어요 · 다음 해 여름에 다시 와요'))), '놓친 것 일지 한 줄 "… 다음 해 여름에 다시 와요"');
  check(E.yearlyNow(st, E.calendar(st.virtual)) === null && E.yearlyMark(st, E.calendar(st.virtual), away) === null, '꽃잠엔 올해만 것이 없음');
  const next = E.yearlyOf(st);
  check(next[1].key === Y1[1].key && next[1].retry && next[2].key === Y1[2].key && next[2].retry && next[3].retry && !next[0].retry, '다음 해: 놓친 여름 · 가을 · 겨울이 그 계절 맨 앞으로 (retry) · 본 봄은 새 차례');
  check(next[3].flower === Y1[3].flower, '꽃빛은 놓친 그 꽃 그대로 다시'); }

console.log('[몇 해를 놓쳐도 사라지지 않음]');
{ const s = copy(st);
  E.advance(s, mon + 3 * WEEK + REST + H, away);   // 3해 더 열지 않음
  const ms = E.yearlyMissedAll(s);
  check(E.yearlyOf(s).length === 4 && [1, 2, 3].every(i => ms.some(m => m.key === Y1[i].key)), '3해를 더 놓쳐도 처음 놓친 여름 · 가을 · 겨울 것이 그대로 남음');
  check(ms.filter(m => m.season === 1).length === 1 && E.yearlyOf(s)[1].key === Y1[1].key, '같은 것은 한 번만 (다시 놓쳐도 맨 앞 그대로)');
  check(s.yearly.years.filter(r => r.y >= 2).every(r => r.r[1] === 1 && r.k[1] === Y1[1].key), '그동안 해마다 여름엔 그것이 다시 왔음');
  E.advance(s, mon + 4 * WEEK + SUMMER + H, away);
  const e = E.yearlyMark(s, E.calendar(s.virtual), away);
  check(e && e.key === Y1[1].key && e.retry && !E.yearlyMissedAll(s).some(m => m.key === Y1[1].key) && E.yearlySeen(s, Y1[1].key), '여름에 열면 드디어 봄 → 놓친 목록에서 빠지고 도감에'); }

console.log('[열어 둔 채 달이 바뀜 · 알림 이벤트]');
{ const s = fresh('yearly-4'), got = [], live = { live: true, rng: () => 0.5, onYearly: e => got.push(e) };
  E.yearlyMark(s, E.calendar(s.virtual), live);
  E.advance(s, mon + SUMMER + H, live);
  const it = E.yearlyOf(s)[1];
  check(got.length === 2 && got[1].key === it.key && got[1].text.startsWith(`${it.icon} 올해 여름엔 ${it.name}`) && got[1].text.endsWith('왔어요'), `열어 둔 채 여름이 되면 봄 → onYearly "${got[1] && got[1].text}"`);
  const q = fresh('yearly-4'); q.onboarded = false; const g2 = [];
  E.yearlyMark(q, E.calendar(q.virtual), { live: true, onYearly: e => g2.push(e) });
  check(g2.length === 0 && E.yearlySeen(q, E.yearlyOf(q)[0].key), '첫 안내 중엔 알림 없이 봄으로만'); }

console.log('[꽃잠에 시작한 정원 · 처음 셈]');
{ const s = E.create(mon + REST + H, () => 0.5); s.gardenId = 'yearly-5'; s.onboarded = true;
  E.yearlyMark(s, E.calendar(s.virtual), away);
  check(s.yearly.at === -0.5 && !s.yearly.missed.length, '꽃잠에 시작하면 아직 셀 것 없음');
  E.advance(s, mon + WEEK + H, away);
  E.yearlyMark(s, E.calendar(s.virtual), away);
  check(!s.yearly.missed.length && E.yearlyOf(s)[0].seen, '첫 봄에 열면 봄 · 앞 계절은 놓친 것 아님');
  const mid = E.create(mon + FALL + H, () => 0.5); mid.gardenId = 'yearly-6';
  E.yearlyMark(mid, E.calendar(mid.virtual), away);
  check(!mid.yearly.missed.length && E.yearlyOf(mid).map(x => x.state).join() === 'gone,gone,seen,soon', '가을에 시작한 정원: 봄 · 여름은 지난 것(놓침 아님) · 가을 봄 · 겨울 아직'); }

console.log('[새 철에 이어짐]');
{ const s = fresh('yearly-7');
  E.yearlyMark(s, E.calendar(s.virtual), away);
  E.advance(s, mon + 2 * WEEK + REST, away); for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true;
  const before = JSON.stringify(s.yearly);
  check(E.seasonStart(s, away).ok && s.season.n === 2, '3해 뒤 새 철 시작');
  check(E.SEASON_KEEP.includes('yearly') && JSON.stringify(s.yearly) === before && E.yearlyMissedAll(s).length > 0, '새 철에도 달력 · 본 것 · 놓친 것 그대로');
  E.advance(s, mon + 3 * WEEK + 0.5 * H, away);
  check(E.yearlyOf(s)[1].retry && s.yearly.years.some(r => r.y === 4), '2철 1해 = 누적 4해째 · 놓친 여름은 다시 맨 앞'); }

console.log('[지난 해들]');
{ const past = E.yearlyPast(st, 3);
  check(past.length === 1 && past[0].year === 1 && past[0].items.map(x => x.seen ? 1 : 0).join('') === '1000', '지난 해 줄: 1해 — 봄만 봄');
  const s = copy(st); E.advance(s, mon + 4 * WEEK + REST + H, away);
  check(E.yearlyPast(s, 3).map(p => p.year).join() === '3,4,5', '최근 3해만'); }

console.log('[도감 칩]');
{ const d = E.yearlyDex(st);
  check(d.length === 12 && d.filter(x => x.got).length === 1 && E.yearlyCount(st) === 1 && d.find(x => !x.got).hint.endsWith('에 와요'), '12칸 중 본 것 1 · 안 본 칸 힌트 "봄에 와요"');
  const all = copy(st); for (const k of E.YEARLY_KEYS) all.yearly.got[k] = 1;
  check(E.dexTotal(all) === E.dexTotal(st) && E.dexCount(all) === E.dexCount(st) && E.yearlyCount(all) === 12, '12칸을 다 봐도 기본 도감 칸 수 · 모은 수(dexTotal · dexCount)는 그대로 — 등급 경험치 · 퀘스트에 안 들어감'); }

console.log('[Math.random 없음 · 돈 · 꽃 값 그대로]');
{ const src = fs.readFileSync(ENGINE, 'utf8'), part = src.slice(src.indexOf('// ---------------------------------------------------------------- 🗓️ 올해만 오는 것'), src.indexOf('// ---------------------------------------------------------------- 저장 파일'));
  check(part.length > 1000 && !/Math\.random\s*\(/.test(part), '올해만 칸에 Math.random 없음');
  const s = fresh('yearly-8'), rnd = Math.random; Math.random = () => { throw new Error('Math.random'); };
  let ok = true; try { E.yearlyMark(s, E.calendar(s.virtual), away); E.yearlyOf(s, 9); E.yearlyNow(s); } catch (e) { ok = false; }
  Math.random = rnd;
  check(ok, '올해만 함수는 Math.random을 부르지 않음');
  const a = fresh('yearly-9'), money = a.money, prices = JSON.stringify(E.FLOWERS);
  E.yearlyMark(a, E.calendar(a.virtual), away);
  check(a.money === money && JSON.stringify(E.FLOWERS) === prices && !a.grade.xp, '보는 것만으로 돈 · 꽃 값 · 경험치가 바뀌지 않음');
  const b = fresh('yearly-9'), c = copy(b); c.yearly = { at: null, years: [], missed: [{ k: 'firefly', f: null, y: 1 }], got: {} };
  E.advance(b, mon + 2 * WEEK, away); E.advance(c, mon + 2 * WEEK, away);
  check(b.money === c.money && JSON.stringify(b.flowers) === JSON.stringify(c.flowers), '올해만 것이 달라도 같은 돈 · 같은 꽃'); }

console.log('[저장 · 다시 열기]');
{ const sv = E.makeSave(st, st.virtual), back = E.parseSave(JSON.stringify(sv)), mg = back.ok && E.migrateSave(back.data.game);
  check(mg && JSON.stringify(mg.yearly) === JSON.stringify(st.yearly) && keysOf(E.yearlyOf(mg)) === keysOf(E.yearlyOf(st)), '저장 파일로 다시 열어도 그대로'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
