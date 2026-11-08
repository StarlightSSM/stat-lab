// Real-time headless check of the 3D book over the Chrome DevTools Protocol (no virtual time, so rAF runs normally).
// usage: node tools/shoot.js "<hash or query+hash>" out.png [width] [height] [waitMs] ["js to run after load"]
//   node tools/shoot.js "#reg-multi" .preview/x.png 1440 900 9000
// Prints console errors / exceptions, then saves a screenshot.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const [, , target = '', out = '.preview/shot.png', W = '1440', H = '900', WAIT = '9000', JS = ''] = process.argv;
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'bkshot-'));
const chrome = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [];
(async () => {
  let ws, id = 0; const pend = new Map();
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/json`); const tabs = await r.json(); const pg = tabs.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch (e) { /* not up yet */ } await sleep(250); }
  await new Promise((r) => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m.error); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n').slice(0, 3).join(' | '));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('CE ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 600 });
  await send('Page.navigate', { url: `http://localhost:8800/${target}` });
  await sleep(+WAIT);
  if (JS) { const r = await send('Runtime.evaluate', { expression: JS, awaitPromise: true, returnByValue: true }); if (r && r.result && r.result.value !== undefined) console.log('JS', JSON.stringify(r.result.value)); await sleep(2500); }
  const st = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__book ? {cur: __book.cur, busy: __book.busy, mode: __book.mode, figs: __book.figs.count} : null)', returnByValue: true });
  console.log('STATE', st.result && st.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(errs.length ? errs.join('\n') : 'NO_ERRORS');
  console.log('shot', out);
  ws.close(); chrome.kill();
  setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* locked */ } process.exit(0); }, 500);
})().catch((e) => { console.error('FAIL', e); chrome.kill(); process.exit(1); });
