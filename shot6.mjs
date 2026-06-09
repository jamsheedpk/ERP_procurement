import { chromium } from "playwright-core";
const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1600);
await page.fill('input[type="email"]', "admin@meridian.ae"); await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]'); await page.waitForTimeout(2500);
await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 }); await page.waitForTimeout(1800);
await page.locator('tr:has-text("PRC-MQ65Y16D")').first().click({ timeout: 8000 }); await page.waitForTimeout(1200);
// open the status dropdown so options are visible
const sel = page.locator('select[title="Change request status"]').first();
await sel.scrollIntoViewIfNeeded();
const b = await sel.boundingBox();
console.log("box:", JSON.stringify(b));
const clip = { x: Math.max(0, b.x - 360), y: Math.max(0, b.y - 40), width: 440, height: 130 };
await page.screenshot({ path: "status_dropdown.png", clip });
console.log("saved");
await browser.close();
