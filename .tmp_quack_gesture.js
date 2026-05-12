const fs = require('node:fs');
const WebSocket = require('ws');

const port = process.env.CDP_PORT || '9226';
const out = process.argv[2] || 'gesture.png';

async function main() {
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = pages.find((item) => item.type === 'page' && item.url.includes('/game/case_006'));
  if (!page) throw new Error('QuackDoku page not found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(String(raw));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 650));
  };
  const longPress = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 900));
  };
  await new Promise((resolve) => ws.once('open', resolve));
  await send('Page.enable');
  await send('Page.bringToFront');
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await click(60, 772);
  await click(242, 185);
  await longPress(242, 185);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(out, Buffer.from(screenshot.data, 'base64'));
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
