import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const OUT = 'playtest-results/mission1';
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  console.log('=== MISSION 1 PLAYTEST ===');
  await page.goto('http://localhost:8081');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/00-main-menu.png` });
  console.log('[00] Main menu');

  await page.getByRole('button', { name: /New Game/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Support/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/01-campaign.png` });
  console.log('[01] Campaign view');

  await page.getByText('Beachhead').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/02-briefing.png` });
  console.log('[02] Briefing start');

  // Advance through briefing
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(500);
  
  const beginBtn = page.getByRole('button', { name: /Begin Mission/i });
  if (await beginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await beginBtn.click();
    console.log('[03] Clicked Begin Mission');
  } else {
    await page.keyboard.press('Space');
    console.log('[03] Space to begin');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/03-game-start.png` });
  
  // Dump game state
  const startState = await page.evaluate(() => {
    const texts = [];
    document.querySelectorAll('span, div, button').forEach(el => {
      const t = el.textContent?.trim();
      if (t && t.length > 0 && t.length < 40 && el.children.length < 2) texts.push(t);
    });
    return {
      canvases: document.querySelectorAll('canvas').length,
      buttons: document.querySelectorAll('button').length,
      texts: [...new Set(texts)].slice(0, 30),
    };
  });
  writeFileSync(`${OUT}/03-state.json`, JSON.stringify(startState, null, 2));
  console.log(`[03] Game: ${startState.canvases} canvas, ${startState.buttons} btns`);
  console.log(`     Visible: ${startState.texts.slice(0, 8).join(' | ')}`);

  // Watch the game for 90 seconds total, capturing every 15s
  const snapshots = [15, 30, 45, 60, 75, 90];
  for (const sec of snapshots) {
    await page.waitForTimeout(15000);
    const fn = `${OUT}/game-${sec}s`;
    await page.screenshot({ path: `${fn}.png` });
    
    const state = await page.evaluate(() => {
      const texts = [];
      document.querySelectorAll('span, div').forEach(el => {
        const t = el.textContent?.trim();
        if (t && t.length > 0 && t.length < 40 && el.children.length < 2) texts.push(t);
      });
      return {
        ts: Date.now(),
        canvases: document.querySelectorAll('canvas').length,
        texts: [...new Set(texts)].slice(0, 25),
      };
    });
    writeFileSync(`${fn}.json`, JSON.stringify(state, null, 2));
    console.log(`[${sec}s] ${state.texts.slice(0, 6).join(' | ')}`);
  }

  console.log('\n=== PLAYTEST COMPLETE — 90 seconds of Mission 1 ===');
  await browser.close();
})();
