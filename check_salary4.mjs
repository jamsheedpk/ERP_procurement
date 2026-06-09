import { chromium } from 'playwright';

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on('pageerror', err => console.log('[ERR]', err.message.slice(0, 300)));
page.on('console', msg => { if (msg.type()==='error') console.log('[CON ERR]', msg.text().slice(0,300)); });

await page.goto('http://localhost:5000');
await page.waitForTimeout(2000);

// Login with correct credentials
await page.fill('input[type="email"]', 'admin@meridian.ae');
await page.fill('input[type="password"]', 'admin123');
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

const afterLoginText = await page.evaluate(() => document.body.innerText.slice(0, 200));
console.log('After login text:', afterLoginText);
await page.screenshot({ path: '/tmp/s01_dashboard.png' });
console.log('01: dashboard');

// Find Salary nav — it might be inside a collapsible section
// First expand "Money" section if needed
const moneySection = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')];
  const moneyEl = els.find(e => e.textContent?.trim() === 'Money' && e.children.length <= 2);
  if (moneyEl) { moneyEl.click(); return 'clicked Money'; }
  return 'Money not found as clickable';
});
console.log('Money section:', moneySection);
await page.waitForTimeout(500);

// Now find Salary
const salaryText = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')];
  return els.filter(e => e.textContent?.trim() === 'Salary').map(e => ({
    tag: e.tagName, cls: e.className, parent: e.parentElement?.className
  })).slice(0, 5);
});
console.log('Salary elements:', JSON.stringify(salaryText));

// Click it
const clicked = await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')];
  // Look for "Salary" text inside sidebar nav items
  for (const el of all) {
    if (el.textContent?.trim() === 'Salary' && el.children.length === 0) {
      // Walk up to find a clickable parent
      let p = el;
      for (let i = 0; i < 5; i++) {
        p.click();
        p = p.parentElement;
        if (!p) break;
      }
      return `clicked Salary (tag: ${el.tagName}, cls: ${el.className})`;
    }
  }
  // Fallback: look for any element containing "Salary" in sidebar
  const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="side-nav"]');
  if (sidebar) {
    const items = [...sidebar.querySelectorAll('*')].filter(e => e.textContent?.includes('Salary'));
    return `sidebar items with Salary: ${items.length}`;
  }
  return 'not found';
});
console.log('Click result:', clicked);

await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/s02_salary_overview.png' });

const pageTitle = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const eyebrow = document.querySelector('.eyebrow');
  return { h1: h1?.textContent, eyebrow: eyebrow?.textContent };
});
console.log('Page title:', JSON.stringify(pageTitle));

const pageText = await page.evaluate(() => document.body.innerText.slice(0, 800));
console.log('Page text:\n', pageText);

// Try clicking Calculator tab
const calcClicked = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button, [role="tab"], .tab')];
  const calc = els.find(e => e.textContent?.trim() === 'Calculator');
  if (calc) { calc.click(); return true; }
  return false;
});
console.log('Calculator tab clicked:', calcClicked);
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/s03_calculator.png' });

// Try History tab
const histClicked = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button, [role="tab"], .tab')];
  const hist = els.find(e => e.textContent?.trim() === 'History');
  if (hist) { hist.click(); return true; }
  return false;
});
console.log('History tab clicked:', histClicked);
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/s04_history.png' });

await browser.close();
console.log('✅ Done — screenshots in /tmp/s0*.png');
