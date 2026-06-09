import { chromium } from "playwright-core";
import fs from "fs";

const EXEC = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const PROC = fs.readFileSync("/tmp/proc_target_id.txt", "utf8").trim();

const log = (...a) => console.log(...a);

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
page.on("console", m => { if (m.type() === "error") log("PAGE-ERR:", m.text().slice(0, 160)); });

await page.goto("http://localhost:5000/", { waitUntil: "networkidle", timeout: 60000 });

// ── Login ───────────────────────────────────────────────────────────────────
await page.waitForTimeout(1500);
try {
  await page.fill('input[type="email"]', "admin@meridian.ae", { timeout: 8000 });
  await page.fill('input[type="password"]', "admin123");
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForTimeout(2500),
  ]);
  log("logged in");
} catch (e) { log("login skip:", e.message.slice(0, 80)); }

await page.waitForTimeout(2000);

// ── Navigate straight to the Lifecycle nav item (Procurement is open by default)
try {
  await page.locator('.nav-item:has-text("Lifecycle")').first().click({ timeout: 10000 });
  await page.waitForTimeout(1800);
  log("nav -> Lifecycle");
} catch (e) { log("nav Lifecycle:", e.message.slice(0,80)); }

// ── Open our seeded request row, then its Compare button ─────────────────────
await page.waitForTimeout(1500);
try {
  // click the row containing our PROC id
  await page.locator(`tr:has-text("${PROC}")`).first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  log("opened request", PROC);
} catch (e) { log("open row:", e.message.slice(0,80)); }

// click the "Compare" button in the detail pane
try {
  await page.getByRole("button", { name: /Compare/ }).first().click({ timeout: 8000 });
  await page.waitForTimeout(2000);
  log("clicked Compare");
} catch (e) { log("compare:", e.message.slice(0,80)); }

await page.waitForTimeout(1500);
await page.screenshot({ path: "compare_screen.png", fullPage: true });
log("screenshot saved");
await browser.close();
