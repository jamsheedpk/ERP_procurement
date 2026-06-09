import { chromium } from 'playwright';

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on('console', msg => { if (msg.type() === 'error') console.log('ERR:', msg.text().slice(0,200)); });
page.on('pageerror', err => console.log('PAGE ERR:', err.message.slice(0,200)));

await page.goto('http://localhost:5000');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/s01_login.png' });
console.log('01: login page');

// Login with first available credentials
const emailInput = page.locator('input[type="email"], input[type="text"]').first();
const passInput  = page.locator('input[type="password"]').first();

if (await emailInput.count()) {
  await emailInput.fill('admin@meridian.com');
  if (await passInput.count()) await passInput.fill('password');
  await page.locator('button[type="submit"], button:text("Log in"), button:text("Sign in"), button:text("Login")').first().click();
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: '/tmp/s02_dashboard.png' });
console.log('02: dashboard');

// Navigate to Salary via sidebar
const salaryBtn = page.locator('text=Salary').first();
if (await salaryBtn.count()) {
  await salaryBtn.click();
  await page.waitForTimeout(3000);
  console.log('03: clicked Salary nav');
} else {
  // Dump sidebar items to help debug
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('nav *, aside *, [class*="side"] *')]
      .map(e => e.textContent?.trim()).filter(t => t && t.length < 30).slice(0, 40)
  );
  console.log('Sidebar items found:', items);
}

await page.screenshot({ path: '/tmp/s03_salary_overview.png' });
console.log('03: salary overview tab');

// Click Calculator tab
const calcTab = page.locator('text=Calculator').first();
if (await calcTab.count()) {
  await calcTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/s04_calculator.png' });
  console.log('04: calculator tab');
}

// Click History tab
const histTab = page.locator('text=History').first();
if (await histTab.count()) {
  await histTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/s05_history.png' });
  console.log('05: history tab');
}

// Back to overview, click Edit on first row
const overviewTab = page.locator('text=Overview').first();
if (await overviewTab.count()) {
  await overviewTab.click();
  await page.waitForTimeout(1500);
  const editBtn = page.locator('button:text("Edit")').first();
  if (await editBtn.count()) {
    await editBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/s06_calc_from_overview.png' });
    console.log('06: calculator opened from overview Edit button');
  }
}

await browser.close();
console.log('✅ Done');
