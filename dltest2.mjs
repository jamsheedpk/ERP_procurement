import { chromium } from "playwright-core";
const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const PROC = "PRC-MQ65XZWF";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on("console", m => { if (m.type() === "error") log("ERR:", m.text().slice(0, 120)); });
await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1800);
await page.fill('input[type="email"]', "admin@meridian.ae"); await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]'); await page.waitForTimeout(2500);
await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 }); await page.waitForTimeout(1800);
await page.locator(`tr:has-text("${PROC}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Payment Application/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(1500);
log("on Payment App page");
// fill % complete on the first few line inputs so amounts/totals are non-zero
const pcts = page.locator('table input[type="number"]');
const n = await pcts.count();
for (let k = 0; k < Math.min(n, 8); k++) { try { await pcts.nth(k).fill(String(60 + k * 5)); } catch {} }
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await page.screenshot({ path: "payment_summary.png", fullPage: true });
log("screenshot saved");
await browser.close();
