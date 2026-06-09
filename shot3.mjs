import { chromium } from "playwright-core";
const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const PROC = "PRC-MQ65XZWF";  // has per-category awards + POs
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
await page.fill('input[type="email"]', "admin@meridian.ae"); await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]'); await page.waitForTimeout(2500); log("logged in");
await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 }); await page.waitForTimeout(1800);
await page.locator(`tr:has-text("${PROC}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(1200); log("opened", PROC);
try { await page.getByRole("button", { name: /Compare quotes/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(1800); log("opened compare page"); }
catch (e) { log("compare:", e.message.slice(0,70)); }
// scroll to bottom to capture the Award Summary
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(600);
await page.screenshot({ path: "compare_summary.png", fullPage: true });
log("saved");
await browser.close();
