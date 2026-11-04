// 전역 이름 겹침 (P66-01): 엔진을 조각(engine-*.js)으로 나누면 엔진 최상위 이름이 화면 파일과 같은 전역 이름 공간에 놓여요 (app.js · app-*.js처럼)
// 그때 화면 파일이 같은 이름을 다시 선언하면 브라우저가 그 파일을 SyntaxError로 통째로 건너뛰고, 함수 선언끼리 겹치면 오류 없이 뒤 것이 엔진 함수를 덮어써요
// V8(vm)로 직접 펼쳐 봐요: 엔진 스크립트들(tests/engine-src.js parts — 한 파일일 땐 IIFE를 벗긴 몸)을 문맥 하나에 차례로 펼친 뒤
// index.html 차례로 화면 파일을 넣어요 (DOM이 없어 실행 중 오류는 나지만, 선언은 실행 전에 모두 만들어져서 이름은 다 보여요)
const path = require('path'), fs = require('fs'), vm = require('vm');
const SRC = require('./engine-src.js');
const ENGINE = SRC.enginePath(process.argv[2]), DIR = path.dirname(ENGINE);
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r\n/g, '\n');
const NODE_GLOBALS = Object.getOwnPropertyNames(globalThis);   // 엔진을 부르기 전 (Node에선 조각의 함수 선언이 globalThis 속성이 됨)

const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"?#]+)[^"]*"><\/script>/g)].map(m => m[1]);
const SCREEN = scripts.filter(f => !/^engine(-[\w-]+)?\.js$/.test(f));
const engine = SRC.parts(ENGINE);

// 이 문맥에 그 이름이 최상위로 선언돼 있나 — 값을 읽을 수 있으면 선언됨. 파일이 실행 중 멈춰 초기화 못 한 const(TDZ)는 V8이 읽을 때도
// "is not defined"라고 하지만 typeof가 오류를 내요 (선언 안 된 이름엔 typeof가 'undefined')
const pristine = vm.createContext({});
const declared = (ctx, id) => { try { vm.runInContext(id, ctx); return true; } catch (e) { if (!e || e.name !== 'ReferenceError') return false; }
  try { vm.runInContext(`typeof ${id}`, ctx); return false; } catch (e) { return true; } };
const idents = src => [...new Set(src.match(/[A-Za-z_$][\w$]*/g))].filter(id => !declared(pristine, id));
const run = (ctx, file, src) => { try { vm.runInContext(src, ctx, { filename: file }); return null; } catch (e) { return e; } };
const isSyntax = e => e && (e instanceof SyntaxError || e.name === 'SyntaxError');

console.log('[엔진 스크립트는 혼자 펼쳐짐]');
const ctxE = vm.createContext({});
const engineErr = engine.map(p => run(ctxE, p.file, p.src)).filter(Boolean);
check(!engineErr.length, `엔진 ${engine.map(p => p.file).join(' → ')} 오류 없이 펼쳐짐${engineErr.length ? ' — ' + engineErr[0].message : ''}`);
const engineNames = idents(engine.map(p => p.src).join('\n')).filter(id => declared(ctxE, id));
check(engineNames.length > 600, `엔진 최상위 이름 ${engineNames.length}개`);

console.log('[화면 파일 최상위 이름]');
const ctxS = vm.createContext({});
const screenSrc = SCREEN.map(f => ({ file: f, src: read(f) }));
const screenSyntax = screenSrc.map(p => [p.file, run(ctxS, p.file, p.src)]).filter(([, e]) => isSyntax(e));
check(!screenSyntax.length, `화면 ${SCREEN.length}개 파일끼리는 겹침 없음${screenSyntax.length ? ' — ' + screenSyntax.map(([f, e]) => `${f}: ${e.message}`).join(' / ') : ''}`);
const screenNames = idents(screenSrc.map(p => p.src).join('\n')).filter(id => declared(ctxS, id));
check(screenNames.length > 300, `화면 최상위 이름 ${screenNames.length}개`);

console.log('[엔진 · 화면 이름 겹침]');
// app.js가 엔진 이름을 다시 선언하는 줄 `const { … } = E;` — 엔진이 한 파일(IIFE)일 땐 필요했고, 나누면 지워야 함 (그 이름은 엔진 전역에 이미 있음)
const reDecl = [...read('app.js').matchAll(/^const \{([^}]*)\} = E;$/gm)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean));
const both = engineNames.filter(id => screenNames.includes(id)).sort();
check(both.join() === [...reDecl].sort().join(), `겹치는 이름은 app.js의 \`const { … } = E;\` 줄 ${reDecl.length}개뿐${both.join() === [...reDecl].sort().join() ? '' : ` — 겹침: ${both.join(', ')} / 그 줄: ${reDecl.join(', ')}`}`);
if (reDecl.length) console.log(`    (엔진을 나누기 전이라 남은 줄: ${reDecl.join(', ')} — 나누는 PR에서 지움)`);

console.log('[엔진 다음에 화면을 펼쳐도 됨 (app.js의 = E; 줄은 빼고)]');
const ctxC = vm.createContext({});
for (const p of engine) run(ctxC, p.file, p.src);
const before = new Map(engineNames.map(id => [id, vm.runInContext(id, ctxC)]));
const syntax = [];
for (const p of screenSrc) { const src = p.file === 'app.js' ? p.src.replace(/^const \{[^}]*\} = E;$/gm, '') : p.src; const e = run(ctxC, p.file, src); if (isSyntax(e)) syntax.push(`${p.file}: ${e.message}`); }
check(!syntax.length, `화면 파일 모두 선언 단계 통과${syntax.length ? ' — ' + syntax.join(' / ') : ''}`);
const changed = engineNames.filter(id => vm.runInContext(id, ctxC) !== before.get(id));
check(!changed.length, `엔진 이름이 화면 파일 뒤에도 같은 값 (함수 선언끼리 겹쳐 덮어쓴 것 없음)${changed.length ? ' — ' + changed.join(', ') : ''}`);

console.log('[브라우저 · Node 기본 이름과 안 겹침]');
// 브라우저 window의 기본 이름 (전역 함수 선언은 window 속성이 되고, const는 같은 이름 전역을 가려요 — top · location 같은 건 SyntaxError · TypeError)
const WINDOW = 'window self document location top parent frames opener name status length closed origin history navigator screen event external performance crypto open close print stop focus blur find alert confirm prompt postMessage fetch scroll scrollTo scrollBy moveTo moveBy resizeTo resizeBy getComputedStyle getSelection matchMedia requestAnimationFrame cancelAnimationFrame requestIdleCallback setTimeout setInterval clearTimeout clearInterval queueMicrotask structuredClone atob btoa localStorage sessionStorage indexedDB caches customElements visualViewport innerWidth innerHeight outerWidth outerHeight scrollX scrollY pageXOffset pageYOffset screenX screenY screenLeft screenTop devicePixelRatio menubar toolbar statusbar locationbar personalbar scrollbars Image Audio Option Notification isSecureContext crossOriginIsolated reportError createImageBitmap onload onerror onclick onresize onscroll onmessage onstorage onfocus onblur'.split(' ');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);   // id가 있는 요소는 window.이름으로도 보임
const hitW = engineNames.filter(id => WINDOW.includes(id)), hitId = engineNames.filter(id => ids.includes(id)), hitN = engineNames.filter(id => NODE_GLOBALS.includes(id));
check(!hitW.length, `엔진 이름이 window 기본 이름과 안 겹침${hitW.length ? ' — ' + hitW.join(', ') : ''}`);
check(!hitId.length, `엔진 이름이 index.html 요소 id와 안 겹침${hitId.length ? ' — ' + hitId.join(', ') : ''}`);
check(!hitN.length, `엔진 이름이 Node 전역(globalThis) 이름과 안 겹침${hitN.length ? ' — ' + hitN.join(', ') : ''}`);
const hitSW = screenNames.filter(id => WINDOW.includes(id));
check(!hitSW.length, `화면 이름도 window 기본 이름과 안 겹침 (CLAUDE.md 규칙)${hitSW.length ? ' — ' + hitSW.join(', ') : ''}`);

console.log('[엔진 조각 차례 — engine.js ENGINE_PARTS · index.html · build-site FILES (P66)]');
{ const parts = SRC.partNames(ENGINE);
  if (parts.length) {
    check(!reDecl.length, 'app.js에 엔진 이름을 다시 선언하는 `const { … } = E;` 줄이 없음 (있으면 브라우저에서 app.js가 SyntaxError)');
    const eng = scripts.filter(f => /^engine(-[\w-]+)?\.js$/.test(f));
    check(eng.join() === [...parts, 'engine.js'].join(), `index.html이 조각 ${parts.length}개를 ENGINE_PARTS 차례로 부른 뒤 engine.js`);
    check(scripts.indexOf('engine.js') < Math.min(...SCREEN.map(f => scripts.indexOf(f))), 'engine.js가 화면 파일보다 앞');
    const files = (read('tools/build-site.js').match(/const FILES = \[([^\]]*)\]/) || [, ''])[1];
    check([...parts, 'engine.js'].every(p => files.includes(`'${p}'`)), 'build-site.js FILES에 조각 · engine.js가 다 있음');
    const dom = parts.filter(p => /(?<![.\w$])(document|localStorage|sessionStorage|window)\s*\./.test(read(p).replace(/\/\/.*$/gm, '')));
    check(!dom.length, `조각에 document · localStorage · window 없음 (화면과 분리)${dom.length ? ' — ' + dom.join(', ') : ''}`);
    // 브라우저 길: 조각 뒤 engine.js → window.Engine · 조각 없이 engine.js만(배포 직후 옛 index.html 캐시) → 한 번만 새로 읽음
    const store = () => { const m = {}; return { getItem: k => k in m ? m[k] : null, setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, m }; };
    const win = (ss, loc) => { const w = vm.createContext({ sessionStorage: ss, location: loc }); w.window = w; return w; };
    const okSS = store(); okSS.setItem('flower-land-engine-reload', '1');
    const ok = win(okSS, { reload: () => { throw new Error('다시 읽으면 안 됨'); } });
    for (const p of engine) run(ok, p.file, p.src);
    const okErr = run(ok, 'engine.js', read('engine.js'));
    check(!okErr && ok.Engine && Object.keys(ok.Engine).length === Object.keys(require(ENGINE)).length && okSS.getItem('flower-land-engine-reload') === null, `브라우저: 조각 뒤 engine.js → window.Engine 공개 이름 ${ok.Engine ? Object.keys(ok.Engine).length : 0}개 · 다시 읽기 표시는 지움${okErr ? ' — ' + okErr.message : ''}`);
    let reloads = 0; const ss = store(), lone = win(ss, { reload: () => { reloads++; } });
    const e1 = run(lone, 'engine.js', read('engine.js'));
    check(!e1 && reloads === 1 && ss.getItem('flower-land-engine-reload') === '1' && !lone.Engine, '배포 직후 섞임: 조각 없이 새 engine.js만 불리면 한 번 새로 읽음 (오류 없이)');
    const e2 = run(lone, 'engine.js', read('engine.js'));
    check(reloads === 1 && e2 && e2.name === 'ReferenceError', '두 번째에도 조각이 없으면 다시 읽지 않음 (끝없이 새로 읽지 않게 — 예전처럼 멈춤)');
  } else check(scripts.includes('engine.js'), 'index.html이 engine.js를 부름 (한 파일)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
