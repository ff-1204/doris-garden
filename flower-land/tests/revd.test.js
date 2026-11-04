// R-D (11-05 전체 검토 고침 D — 코드): ① 화원 카드 값은 엔진 상수 ② Math.random 폴백은 defaultRng 하나 ③ 서머타임 주(169시간)에서 advance가 멈추거나 뒤로 가지 않음 ④ app-mine.js 나눔
const path = require('path'), fs = require('fs'), { spawnSync } = require('child_process');
const ENGINE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js'));
const E = require(ENGINE);
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

console.log('[R-D1 엔진 상수 · 화면은 그 값을 씀]');
check(E.GERM_FULL_M === 12 && E.GERM_FADE_M === 8 && E.GERM_SOON_M === 10 && E.germOf({ ageH: 12 * E.MONTH_H }) === 1 && E.germOf({ ageH: 20 * E.MONTH_H }) === 0, 'germOf 12달 · 8달 · 10달');
check(/E\.GERM_FULL_M \* E\.MONTH_H/.test(read('app-shop.js')) && /E\.GERM_SOON_M/.test(read('app-shop.js')) && !/12 \* E\.MONTH_H - gr\.ageH/.test(read('app-shop.js')), '화원 씨앗 카드는 엔진 상수');
check(/Math\.round\(E\.PETAL_BUY_RATE \* 100\)/.test(read('app-shop.js')) && !/값의 60% ÷/.test(read('app-shop.js')), '화원 꽃잎 카드 60%는 PETAL_BUY_RATE');

console.log('[R-D2 Math.random은 defaultRng 하나]');
{ const eng = ['engine-base.js', 'engine-state.js', 'engine-progress.js', 'engine-actions.js', 'engine-journal.js', 'engine-mine-mail.js', 'engine-decos.js', 'engine-auto.js', 'engine-long.js', 'engine-save.js'];
  const hits = eng.flatMap(f => read(f).split('\n').map((l, i) => [f, i + 1, l]).filter(([, , l]) => /Math\.random/.test(l) && !/^\s*\/\//.test(l) && !/\/\/.*Math\.random[^;]*$/.test(l.replace(/.*Math\.random\(\)/, '')) ));
  const code = hits.filter(([, , l]) => /Math\.random\(\)/.test(l.replace(/\/\/.*$/, '')));
  check(code.length === 2 && code.some(([f]) => f === 'engine-base.js') && code.some(([f]) => f === 'engine-save.js'), `코드에서 Math.random()은 defaultRng · newGardenId 둘뿐 (${code.map(([f, i]) => `${f}:${i}`).join(' · ')})`);
  check(typeof E.defaultRng === 'function' && E.defaultRng() < 1, 'defaultRng 공개'); }

console.log('[R-D3 서머타임이 끝나는 주 (미국 동부 2026-11-01) — 멈추지 않고 앞으로만]');
{ const script = `const E = require(${JSON.stringify(ENGINE)}); const HH = E.HOUR;
    const t0 = new Date(2026, 9, 26, 7, 0).getTime();   // 월요일 아침 (DST 끝나는 주 — 그 주는 169시간)
    const st = E.create(t0, () => 0.5); st.gardenId = 'dst'; let v = st.virtual, mono = true, steps = 0, last = t0;
    const end = new Date(2026, 10, 3, 9, 0).getTime();   // 다음 주 화요일
    for (let t = t0 + 6 * HH; t <= end; t += 6 * HH) { E.advance(st, t, { live: false, rng: () => 0.5 }); if (st.virtual < v) mono = false; v = st.virtual; steps++; last = t; }
    const c = E.calendar(st.virtual);
    console.log(JSON.stringify({ mono, steps, week: c.week - st.firstWeek, idx: c.idx, virtualOk: Math.abs(st.virtual - last) < 1000 }));`;
  const r = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', env: { ...process.env, TZ: 'America/New_York' }, timeout: 60000 });
  let out = null; try { out = JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { /* 아래에서 실패 */ }
  check(r.status === 0 && out && out.mono && out.virtualOk && out.week === 1, `TZ=America/New_York 에서 2주를 6시간씩 — 끝까지 가고(${out ? `${out.steps}걸음 · 둘째 주 idx ${out.idx}` : (r.stderr || '').slice(0, 120)}) 뒤로 가지 않음`);
  const r2 = spawnSync(process.execPath, ['-e', script.replace('2026, 9, 26', '2026, 2, 2').replace('2026, 10, 3', '2026, 2, 10')], { encoding: 'utf8', env: { ...process.env, TZ: 'America/New_York' }, timeout: 60000 });
  let o2 = null; try { o2 = JSON.parse((r2.stdout || '').trim().split('\n').pop()); } catch (e) { /* */ }
  check(r2.status === 0 && o2 && o2.mono && o2.virtualOk, 'DST가 시작하는 주(167시간, 3월 8일)도 끝까지'); }

console.log('[R-D4 app-mine.js 나눔]');
check(fs.existsSync(path.join(__dirname, '..', 'app-mine.js')) && /^\/\/ 도리의 정원 — 화면: ⛏️ 광산 탭/.test(read('app-mine.js')) && !/⛏️ 광산 탭 \(P24/.test(read('app-garden.js')), '광산 구역은 app-mine.js에만');
check(/<script src="app-garden\.js"><\/script>\s*<script src="app-mine\.js"><\/script>/.test(read('index.html')) && /'app-garden\.js', 'app-mine\.js'/.test(read('tools/build-site.js')), 'index.html · build-site FILES에 app-garden 바로 뒤');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
