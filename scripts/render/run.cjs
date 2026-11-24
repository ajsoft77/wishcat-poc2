// 부품 카테고리 이미지 렌더링: node scripts/render/run.cjs [카테고리...]
// 필요: playwright-core(크로미움), three. playwright-core 가 다른 곳에 있으면 PLAYWRIGHT 환경변수로 경로를 준다
const fs = require('fs');
const path = require('path');
const os = require('os');

const PLAYWRIGHT = process.env.PLAYWRIGHT || 'playwright-core';
const THREE_ROOT = process.env.THREE_ROOT || path.join(__dirname, '..', '..', 'node_modules', 'three');
const { chromium } = require(PLAYWRIGHT);

(async () => {
  const outDir = path.join(__dirname, '..', '..', 'public', 'img');
  fs.mkdirSync(outDir, { recursive: true });
  const html = fs.readFileSync(path.join(__dirname, 'render.html'), 'utf8').replaceAll('THREE_ROOT', 'file://' + THREE_ROOT);
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'parts-render-')), 'render.html');
  fs.writeFileSync(tmp, html);

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  page.on('pageerror', (e) => console.error('page error:', String(e)));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto('file://' + tmp);
  await page.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const names = process.argv.length > 2 ? process.argv.slice(2) : await page.evaluate(() => window.NAMES);
  for (const n of names) {
    const url = await page.evaluate((x) => window.shoot(x), n);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(path.join(outDir, `${n}.jpg`), buf);
    console.log(n, Math.round(buf.length / 1024) + 'KB');
  }
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
