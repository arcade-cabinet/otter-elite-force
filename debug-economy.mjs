/**
 * Debug script: launch Mission 1, wait 20s, check resource changes.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('pageerror', (err) => {
  console.error('PAGE ERROR:', err.message);
});

await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);
await page.click('button:has-text("New Campaign")');
await page.waitForTimeout(1500);
await page.click('button:has-text("Deploy")');
await page.waitForTimeout(2000);

// Dismiss tutorial
const dismissBtn = await page.$('button:has-text("Dismiss")');
if (dismissBtn) await dismissBtn.click();

// Check initial resources
const hudInitial = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="runtime-hud-resources"]');
  return el ? el.textContent : 'No HUD found';
});
console.log('Initial HUD:', hudInitial);

// Check at 5 second intervals
for (let i = 1; i <= 4; i++) {
  await page.waitForTimeout(5000);
  const hud = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="runtime-hud-resources"]');
    return el ? el.textContent : 'No HUD found';
  });
  console.log(`HUD at ${i * 5}s:`, hud);
}

await browser.close();
