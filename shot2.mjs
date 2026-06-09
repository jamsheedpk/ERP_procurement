import { chromium } from "playwright-core";

const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const PROC = "PRC-MQ65Y16D";  // request sitting at Enquiry
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 }, deviceScaleFactor: 2 });

await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
try {
  await page.fill('input[type="email"]', "admin@meridian.ae", { timeout: 8000 });
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  log("logged in");
} catch (e) { log("login:", e.message.slice(0, 60)); }

await page.waitForTimeout(1500);
try { await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 }); await page.waitForTimeout(1800); log("-> Lifecycle"); }
catch (e) { log("nav:", e.message.slice(0, 60)); }

try { await page.locator(`tr:has-text("${PROC}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(1500); log("opened", PROC); }
catch (e) { log("open:", e.message.slice(0, 60)); }

// Expand the detail pane (drop max-height) and screenshot the whole stepper card
const pane = await page.evaluateHandle(() => {
  const cards = [...document.querySelectorAll('.card')];
  const p = cards.find(c => /lifecycle\s*·\s*stage/i.test(c.textContent));
  if (p) { p.style.maxHeight = "none"; p.style.overflow = "visible"; p.style.position = "static"; }
  return p;
});
await page.waitForTimeout(500);
const el = pane.asElement();
if (el) await el.screenshot({ path: "lock_stepper.png" });
else await page.screenshot({ path: "lock_stepper.png", clip: { x: 1068, y: 120, width: 420, height: 760 } });
log("saved");
await browser.close();
