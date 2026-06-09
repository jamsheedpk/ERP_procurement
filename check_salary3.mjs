import { chromium } from 'playwright';

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on('pageerror', err => console.log('[ERR]', err.message.slice(0, 200)));

await page.goto('http://localhost:5000');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/s01_login.png' });
console.log('01: login loaded');

// Fill login form
const inputs = await page.evaluate(() =>
  [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder }))
);
console.log('Inputs:', JSON.stringify(inputs));

await page.fill('input[type="email"]', 'admin@meridian.com');
await page.fill('input[type="password"]', 'password');

// Get the submit button
const buttons = await page.evaluate(() =>
  [...document.querySelectorAll('button')].map(b => ({ type: b.type, text: b.textContent?.trim() }))
);
console.log('Buttons:', JSON.stringify(buttons));

await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

console.log('URL after login:', page.url());
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log('Body text:', bodyText);

await page.screenshot({ path: '/tmp/s02_after_login.png' });
console.log('02: after login');

// Check if we're in the app now
const allText = await page.evaluate(() => document.body.innerText);
if (!allText.includes('Dashboard') && !allText.includes('Employees')) {
  // Try demo/admin credentials
  console.log('Login may have failed, trying other credentials...');
  await page.fill('input[type="email"]', 'demo@meridian.com');
  await page.fill('input[type="password"]', 'demo');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/s02b_retry_login.png' });
}

// Find and click Salary in sidebar
const links = await page.evaluate(() => {
  return [...document.querySelectorAll('*')].filter(el => {
    const t = el.textContent?.trim();
    return t === 'Salary' && el.children.length === 0;
  }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.trim() }));
});
console.log('Salary elements:', JSON.stringify(links));

// Click the Salary nav item
const salaryEl = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e =>
    e.textContent?.trim() === 'Salary' && e.children.length === 0
  );
  if (el) { el.click(); return true; }
  return false;
});
console.log('Clicked salary:', salaryEl);

await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/s03_salary.png' });
console.log('03: salary page');

const pageText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
console.log('Salary page text:', pageText);

await browser.close();
console.log('✅ Done. Screenshots in /tmp/s0*.png');
