import { chromium } from 'playwright';

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on('console', msg => {
  const t = msg.type();
  if (t === 'error' || t === 'warn') console.log(`[${t}]`, msg.text().slice(0, 300));
});
page.on('pageerror', err => console.log('[pageerror]', err.message.slice(0, 300)));

await page.goto('http://localhost:5000');
await page.waitForTimeout(3000);

// Dump the current URL and body structure
console.log('URL:', page.url());
const html = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
console.log('BODY HTML (first 3000):\n', html);

await browser.close();
