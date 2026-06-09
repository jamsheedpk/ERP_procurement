import { chromium } from "playwright-core";
const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const PROC = "PRC-MQ65Y16D";  // now at proforma
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1600);
await page.fill('input[type="email"]', "admin@meridian.ae"); await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]'); await page.waitForTimeout(2500);
await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 }); await page.waitForTimeout(1800);
await page.locator(`tr:has-text("${PROC}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(1200);
// click "Sign off & advance" (current stage = Proforma Recv)
await page.getByRole("button", { name: /Sign off & advance/ }).first().click({ timeout: 8000 });
await page.waitForTimeout(1200);
log("opened sign-off modal");
await page.screenshot({ path: "proforma_modal.png", fullPage: false });
await browser.close();
