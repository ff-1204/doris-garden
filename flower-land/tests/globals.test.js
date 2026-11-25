// 전역 이름 (P66-01 · P94-05): 브라우저는 엔진 조각을 함수 하나로 묶은 engine.js를 받아요(tools/engine-bundle.js) — 전역에는 Engine 하나만 생기고,
// 화면 파일(app.js · app-*.js …)끼리만 같은 전역 이름 공간을 써요. 화면 파일이 같은 이름을 두 번 선언하면 브라우저가 그 파일을 SyntaxError로 통째로 건너뛰어요
// 화면이 엔진 이름을 맨 이름으로 쓰려면 app.js의 `const { … } = E;` 줄에 있어야 해요 — 없는 이름을 E. 없이 쓰면 그 줄이 돌 때 ReferenceError (tools/free-names.js가 미리 찾음)
// Node(테스트 · 도구)에선 require('../engine.js')가 조각을 Node 전역에 펼치니, 엔진 이름이 Node 기본 이름과 겹치지 않는지도 봐요
// V8(vm)로 직접 펼쳐 봐요 (DOM이 없어 실행 중 오류는 나지만, 선언은 실행 전에 모두 만들어져서 이름은 다 보여요)
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

console.log('[엔진 · 화면 이름 — 화면이 맨 이름으로 쓰는 엔진 이름은 app.js의 = E; 줄뿐 (P94-05)]');
// app.js가 엔진에서 꺼내는 줄 `const { … } = E;` — 엔진이 묶음 안에 있어 이 줄의 이름만 화면 전역에 생겨요
const reDecl = [...read('app.js').matchAll(/^const \{([^}]*)\} = E;$/gm)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean));
const both = engineNames.filter(id => screenNames.includes(id)).sort();
check(both.join() === [...reDecl].sort().join(), `엔진과 같은 화면 최상위 이름은 app.js의 \`const { … } = E;\` 줄 ${reDecl.length}개뿐${both.join() === [...reDecl].sort().join() ? '' : ` — 겹침: ${both.join(', ')} / 그 줄: ${reDecl.join(', ')}`}`);
const publicNames = Object.keys(require(ENGINE));
const notPublic = reDecl.filter(id => !publicNames.includes(id));
check(!notPublic.length, `그 줄의 이름은 모두 엔진 공개 이름${notPublic.length ? ' — 공개 목록에 없음: ' + notPublic.join(', ') : ''}`);
{ // 구문 분석(tools/free-names.js — Node에 든 acorn): 화면 어디에도 선언이 없는데 쓰는 엔진 이름 = 브라우저에서 ReferenceError
  const r = require('child_process').spawnSync(process.execPath, [path.join(DIR, 'tools', 'free-names.js'), '--json', DIR], { encoding: 'utf8' });
  let free = null; try { free = JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { /* 아래에서 알림 */ }
  check(!!free, `tools/free-names.js가 돌아감${free ? '' : ' — ' + ((r.stderr || r.stdout || '').trim().split('\n').pop() || '결과 없음')}`);
  if (free) {
    check(free.engineTop === engineNames.length, `구문 분석이 본 엔진 최상위 이름 수가 V8과 같음 (${free.engineTop} · ${engineNames.length})`);
    check(!free.bare.length, `화면이 선언 없이 쓰는 엔진 이름 없음${free.bare.length ? ' — ' + free.bare.map(n => `${n} (${free.where[n].slice(0, 3).join(' ')})`).join(', ') + ' → app.js의 = E; 줄에 더하거나 E.이름으로' : ''}`);
    // 엔진도 화면도 아닌 자유 이름은 브라우저 기본 이름 · 다른 스크립트가 window에 다는 이름(Drive · TITLE_ART · google)이어야 함 — 오타면 여기서 걸려요
    const KNOWN = 'Array Blob Boolean Date Drive Error File Image JSON Map Math MutationObserver NodeFilter Notification Number Object Promise ResizeObserver Set String TITLE_ART URL clearTimeout document encodeURIComponent fetch getComputedStyle globalThis google innerHeight innerWidth isFinite localStorage location matchMedia module navigator parseInt performance requestAnimationFrame sessionStorage setInterval setTimeout undefined window'.split(' ');
    const odd = free.other.filter(n => !KNOWN.includes(n));
    check(!odd.length, `그 밖의 자유 이름은 아는 브라우저 이름뿐${odd.length ? ' — 처음 보는 이름: ' + odd.join(', ') + ' (브라우저 기본 이름이면 이 테스트의 KNOWN에 더해요)' : ''}`);
  }
}

console.log('[브라우저처럼: 엔진 묶음 다음에 화면 파일]');
const { bundle } = require(path.join(DIR, 'tools', 'engine-bundle.js'));
const bundled = bundle(DIR);
const ctxC = vm.createContext({}); ctxC.window = ctxC;
const bundleErr = run(ctxC, 'engine.js (묶음)', bundled);
check(!bundleErr && ctxC.Engine && Object.keys(ctxC.Engine).join() === publicNames.join(), `묶음 → window.Engine 공개 이름 ${ctxC.Engine ? Object.keys(ctxC.Engine).length : 0}개, Node의 require와 같은 차례${bundleErr ? ' — ' + bundleErr.message : ''}`);
const leaked = engineNames.filter(id => declared(ctxC, id));
check(!leaked.length, `묶음은 엔진 이름을 전역에 남기지 않음${leaked.length ? ' — ' + leaked.slice(0, 8).join(', ') : ''}`);
const syntax = [], halted = [];
for (const p of screenSrc) { const e = run(ctxC, p.file, p.src); if (isSyntax(e)) syntax.push(`${p.file}: ${e.message}`); else if (e && / is not defined$/.test(e.message) && engineNames.includes(e.message.replace(/ is not defined$/, ''))) halted.push(`${p.file}: ${e.message}`); }
check(!syntax.length, `화면 파일 모두 선언 단계 통과${syntax.length ? ' — ' + syntax.join(' / ') : ''}`);
check(!halted.length, `화면 파일이 불릴 때 엔진 이름을 못 찾아 멈추지 않음${halted.length ? ' — ' + halted.join(' / ') : ''}`);
check(reDecl.length > 0 && reDecl.every(id => vm.runInContext(id, ctxC) === ctxC.Engine[id]), 'app.js의 = E; 줄 이름은 Engine의 같은 값');

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

console.log('[엔진 묶음 — engine.js ENGINE_PARTS · index.html · build-site · serve (P66 · P94-05)]');
{ const parts = SRC.partNames(ENGINE);
  check(parts.length > 0 && parts.every(p => fs.existsSync(path.join(DIR, p))), `ENGINE_PARTS 조각 ${parts.length}개가 다 있음`);
  const eng = scripts.filter(f => /^engine(-[\w-]+)?\.js$/.test(f));
  check(eng.join() === 'engine.js', `index.html은 엔진을 engine.js 한 줄로만 부름 (조각을 따로 부르면 전역에 펼쳐져요)${eng.join() === 'engine.js' ? '' : ' — ' + eng.join(', ')}`);
  check(scripts.indexOf('engine.js') < Math.min(...SCREEN.map(f => scripts.indexOf(f))), 'engine.js가 화면 파일보다 앞');
  const build = read('tools/build-site.js'), files = (build.match(/const FILES = \[([^\]]*)\]/) || [, ''])[1];
  check(files.includes("'engine.js'") && !parts.some(p => files.includes(`'${p}'`)), 'build-site.js FILES에 engine.js만 있고 조각은 없음 (배포본엔 묶음만)');
  check(/f === 'engine\.js'\) fs\.writeFileSync\([^;]*bundle\(src\)\)/.test(build), 'build-site.js가 engine.js를 묶음(bundle)으로 씀 — 복사하지 않음');
  check(/isSource\(root\)/.test(read('serve.js')) && /bundle\(root\)/.test(read('serve.js')), 'serve.js가 소스 폴더의 /engine.js 요청에 묶음을 줌');
  const dom = parts.filter(p => /(?<![.\w$])(document|localStorage|sessionStorage|window)\s*\./.test(read(p).replace(/\/\/.*$/gm, '')));
  check(!dom.length, `조각에 document · localStorage · window 없음 (화면과 분리)${dom.length ? ' — ' + dom.join(', ') : ''}`);
  // 묶음은 조각 글자를 그대로 차례대로 담음 (빠지거나 순서가 바뀌면 여기서)
  let at = 0; const inOrder = parts.every(p => { const i = bundled.indexOf(read(p), at); if (i < 0) return false; at = i + 1; return true; });
  check(inOrder, '묶음에 조각 글자가 ENGINE_PARTS 차례 그대로 들어 있음');
  // 묶지 않은 engine.js를 브라우저가 받으면(serve.js가 아닌 서버) 조각이 없으니 알기 쉬운 오류로 멈춤 — Engine이 안 생겨 화면도 멈추고 저장은 일어나지 않음
  const lone = vm.createContext({}); lone.window = lone;
  const e1 = run(lone, 'engine.js', read('engine.js'));
  check(e1 && /묶지 않은 engine\.js/.test(e1.message) && !lone.Engine, '묶지 않은 engine.js만 불리면 안내 오류로 멈춤 (Engine 없음)');
  // 배포 직후 옛 index.html 캐시: 옛 조각(전역에 펼쳐짐) 뒤에 새 묶음이 불려도 Engine이 제대로 생김
  const old = vm.createContext({}); old.window = old;
  for (const p of engine) run(old, p.file, p.src);
  const e2 = run(old, 'engine.js (묶음)', bundled);
  check(!e2 && old.Engine && Object.keys(old.Engine).length === publicNames.length, `옛 index.html이 조각을 먼저 펼친 뒤 새 묶음이 불려도 Engine 공개 이름 ${old.Engine ? Object.keys(old.Engine).length : 0}개${e2 ? ' — ' + e2.message : ''}`);
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
