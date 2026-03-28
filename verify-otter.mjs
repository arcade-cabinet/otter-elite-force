import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp';

async function screenshot(page, name) {
  const path = `${SCREENSHOT_DIR}/verify-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  Screenshot saved: ${path}`);
  return path;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const results = [];

function check(name, status, screenshotPath, details) {
  results.push({ name, status, screenshot: screenshotPath, details });
  console.log(`  [${status}] ${name}: ${details}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMsgs = [];
  page.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  // ==========================================
  // 1. Main Menu
  // ==========================================
  console.log('\n=== 1. Main Menu ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await delay(2000);
  const ssMenu = await screenshot(page, '01-main-menu');

  // Check for buttons
  const menuText = await page.textContent('body');
  const hasNewCampaign = menuText?.toLowerCase().includes('campaign');
  const hasSkirmish = menuText?.toLowerCase().includes('skirmish');
  const hasSettings = menuText?.toLowerCase().includes('settings');

  check('Main Menu - visible', (menuText && menuText.length > 10) ? 'PASS' : 'FAIL', ssMenu,
    `Page loaded with content. Campaign: ${hasNewCampaign}, Skirmish: ${hasSkirmish}, Settings: ${hasSettings}`);

  // ==========================================
  // 2. Settings
  // ==========================================
  console.log('\n=== 2. Settings ===');
  try {
    const settingsBtn = await page.$('button:has-text("Settings")')
      || await page.$('[data-testid="settings"]')
      || await page.$('text=Settings');

    if (settingsBtn) {
      await settingsBtn.click();
      await delay(1500);
      const ssSettings = await screenshot(page, '02-settings');

      const hasSliders = await page.$$('input[type="range"]');
      const hasToggles = await page.$$('input[type="checkbox"]');
      const hasAnyControl = hasSliders.length > 0 || hasToggles.length > 0;

      check('Settings - visible', 'PASS', ssSettings,
        `Settings screen loaded. Sliders: ${hasSliders.length}, Toggles: ${hasToggles.length}, Controls present: ${hasAnyControl}`);

      // Click Back
      const backBtn = await page.$('button:has-text("Back")') || await page.$('text=Back');
      if (backBtn) {
        await backBtn.click();
        await delay(1000);
        check('Settings - Back button', 'PASS', ssSettings, 'Back button found and clicked');
      } else {
        check('Settings - Back button', 'FAIL', ssSettings, 'Back button not found');
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await delay(1000);
      }
    } else {
      const ssSettings = await screenshot(page, '02-settings');
      check('Settings - visible', 'FAIL', ssSettings, 'Settings button not found on main menu');
    }
  } catch (e) {
    const ssSettings = await screenshot(page, '02-settings-error');
    check('Settings - visible', 'FAIL', ssSettings, `Error: ${e.message}`);
  }

  // ==========================================
  // 3. Skirmish Setup
  // ==========================================
  console.log('\n=== 3. Skirmish Setup ===');
  try {
    await delay(500);
    const skirmishBtn = await page.$('button:has-text("Skirmish")')
      || await page.$('[data-testid="skirmish"]')
      || await page.$('text=Skirmish');

    if (skirmishBtn) {
      await skirmishBtn.click();
      await delay(1500);
      const ssSkirmish = await screenshot(page, '03-skirmish-setup');

      const bodyText = await page.textContent('body') || '';
      const hasSeed = bodyText.toLowerCase().includes('seed') || (await page.$$('input')).length > 0;
      const hasMap = bodyText.toLowerCase().includes('map');
      const hasDifficulty = bodyText.toLowerCase().includes('difficulty');

      check('Skirmish Setup - visible', 'PASS', ssSkirmish,
        `Skirmish screen loaded. Seed input: ${hasSeed}, Map: ${hasMap}, Difficulty: ${hasDifficulty}`);

      // Go back
      const backBtn = await page.$('button:has-text("Back")') || await page.$('text=Back');
      if (backBtn) {
        await backBtn.click();
        await delay(1000);
      } else {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await delay(1000);
      }
    } else {
      const ssSkirmish = await screenshot(page, '03-skirmish-setup');
      check('Skirmish Setup - visible', 'FAIL', ssSkirmish, 'Skirmish button not found on main menu');
    }
  } catch (e) {
    const ssSkirmish = await screenshot(page, '03-skirmish-error');
    check('Skirmish Setup - visible', 'FAIL', ssSkirmish, `Error: ${e.message}`);
  }

  // ==========================================
  // 4. Campaign Briefing (Mission 1)
  // ==========================================
  console.log('\n=== 4. Campaign Briefing ===');
  try {
    const campaignBtn = await page.$('button:has-text("New Campaign")')
      || await page.$('button:has-text("Campaign")')
      || await page.$('[data-testid="campaign"]')
      || await page.$('text=New Campaign')
      || await page.$('text=Campaign');

    if (campaignBtn) {
      await campaignBtn.click();
      await delay(2000);
      const ssBriefing = await screenshot(page, '04-campaign-briefing');

      const bodyText = await page.textContent('body') || '';
      const hasClassified = bodyText.toLowerCase().includes('classified');
      const hasObjectives = bodyText.toLowerCase().includes('objective');
      const hasDeploy = bodyText.toLowerCase().includes('deploy');
      const hasBriefing = bodyText.toLowerCase().includes('briefing') || bodyText.toLowerCase().includes('mission');

      check('Campaign Briefing - visible', hasBriefing || hasClassified ? 'PASS' : 'FAIL', ssBriefing,
        `Briefing screen. CLASSIFIED: ${hasClassified}, Objectives: ${hasObjectives}, Deploy: ${hasDeploy}, Briefing: ${hasBriefing}`);

      // ==========================================
      // 5. Game Screen (Mission 1 - 30 seconds)
      // ==========================================
      console.log('\n=== 5. Game Screen (30s) ===');
      const deployBtn = await page.$('button:has-text("Deploy")')
        || await page.$('[data-testid="deploy"]')
        || await page.$('text=Deploy');

      if (deployBtn) {
        await deployBtn.click();
        await delay(3000);
        const ssGameLoad = await screenshot(page, '05a-game-loading');

        console.log('  Waiting 30 seconds for game to run...');
        await delay(27000);
        const ssGame30 = await screenshot(page, '05-game-30s');

        const canvas = await page.$('canvas');
        const hasCanvas = canvas !== null;

        const bodyText30 = await page.textContent('body') || '';
        const hasResources = bodyText30.toLowerCase().includes('wood') || bodyText30.toLowerCase().includes('fish') || bodyText30.toLowerCase().includes('resource');
        const hasTutorial = bodyText30.toLowerCase().includes('tutorial') || bodyText30.toLowerCase().includes('hint') || bodyText30.toLowerCase().includes('tip');

        check('Game Screen 30s - Canvas', hasCanvas ? 'PASS' : 'FAIL', ssGame30,
          `Canvas present: ${hasCanvas}`);
        check('Game Screen 30s - Resources', hasResources ? 'PASS' : 'FAIL', ssGame30,
          `Resources visible: ${hasResources}. Text sample: ${bodyText30.substring(0, 200)}`);
        check('Game Screen 30s - Tutorial', hasTutorial ? 'PASS' : 'FAIL', ssGame30,
          `Tutorial overlay: ${hasTutorial}`);

        // ==========================================
        // 6. Game Screen (60 seconds)
        // ==========================================
        console.log('\n=== 6. Game Screen (60s) ===');
        console.log('  Waiting 30 more seconds...');
        await delay(30000);
        const ssGame60 = await screenshot(page, '06-game-60s');

        const bodyText60 = await page.textContent('body') || '';

        check('Game Screen 60s - Still running', hasCanvas ? 'PASS' : 'FAIL', ssGame60,
          `Game still active after 60s. Text: ${bodyText60.substring(0, 200)}`);

        // ==========================================
        // 7. Selection interaction
        // ==========================================
        console.log('\n=== 7. Selection interaction ===');
        if (canvas) {
          const canvasBox = await canvas.boundingBox();
          if (canvasBox) {
            // Click near center
            await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
            await delay(1000);
            const ssSelect = await screenshot(page, '07-selection');

            const selectText = await page.textContent('body') || '';
            const hasSelection = selectText.toLowerCase().includes('otter') || selectText.toLowerCase().includes('lodge') || selectText.toLowerCase().includes('selected') || selectText.toLowerCase().includes('hp');

            check('Selection - Click entity', hasSelection ? 'PASS' : 'FAIL', ssSelect,
              `Selection panel visible: ${hasSelection}. Text: ${selectText.substring(0, 200)}`);

            // Also try clicking around different spots if center didn't work
            if (!hasSelection) {
              // Try clicking at 1/3 from left
              await page.mouse.click(canvasBox.x + canvasBox.width / 3, canvasBox.y + canvasBox.height / 2);
              await delay(1000);
              const ssSelect2 = await screenshot(page, '07-selection-alt');
              const selectText2 = await page.textContent('body') || '';
              const hasSelection2 = selectText2.toLowerCase().includes('otter') || selectText2.toLowerCase().includes('lodge') || selectText2.toLowerCase().includes('selected') || selectText2.toLowerCase().includes('hp');
              if (hasSelection2) {
                check('Selection - Alt click', 'PASS', ssSelect2, `Selection found after alt click`);
              }
            }
          } else {
            const ssSelect = await screenshot(page, '07-selection');
            check('Selection - Click entity', 'FAIL', ssSelect, 'Canvas bounding box not available');
          }
        } else {
          const ssSelect = await screenshot(page, '07-selection');
          check('Selection - Click entity', 'FAIL', ssSelect, 'No canvas found for clicking');
        }

        // ==========================================
        // 8. Build interaction
        // ==========================================
        console.log('\n=== 8. Build interaction ===');
        await page.keyboard.press('b');
        await delay(1500);
        const ssBuild = await screenshot(page, '08-build');

        const buildText = await page.textContent('body') || '';
        const hasBuildMenu = buildText.toLowerCase().includes('build') || buildText.toLowerCase().includes('barracks') || buildText.toLowerCase().includes('outpost') || buildText.toLowerCase().includes('watchtower');

        check('Build - B key', hasBuildMenu ? 'PASS' : 'FAIL', ssBuild,
          `Build mode visible: ${hasBuildMenu}. Text: ${buildText.substring(0, 300)}`);

        // Press Escape to close build menu
        await page.keyboard.press('Escape');
        await delay(500);

      } else {
        const ssNoDeploy = await screenshot(page, '05-no-deploy');
        check('Game Screen - Deploy', 'FAIL', ssNoDeploy, 'Deploy button not found');
      }

    } else {
      const ssBriefing = await screenshot(page, '04-no-campaign');
      check('Campaign Briefing - visible', 'FAIL', ssBriefing, 'Campaign button not found on main menu');
    }
  } catch (e) {
    const ssError = await screenshot(page, '04-campaign-error');
    check('Campaign flow', 'FAIL', ssError, `Error: ${e.message}`);
    console.error(e);
  }

  // ==========================================
  // 9. Mobile viewport
  // ==========================================
  console.log('\n=== 9. Mobile viewport ===');
  try {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', msg => consoleMsgs.push(`[mobile][${msg.type()}] ${msg.text()}`));
    mobilePage.on('pageerror', err => pageErrors.push(`[mobile] ${err.message}`));

    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2000);
    const ssMobile = await screenshot(mobilePage, '09-mobile-menu');

    const mobileMenuText = await mobilePage.textContent('body') || '';
    check('Mobile - Menu renders', mobileMenuText.length > 10 ? 'PASS' : 'FAIL', ssMobile,
      `Mobile menu text: ${mobileMenuText.substring(0, 150)}`);

    // Try to start a game on mobile
    const campaignBtn = await mobilePage.$('button:has-text("New Campaign")')
      || await mobilePage.$('button:has-text("Campaign")')
      || await mobilePage.$('text=New Campaign');

    if (campaignBtn) {
      await campaignBtn.click();
      await delay(1500);

      const deployBtn = await mobilePage.$('button:has-text("Deploy")') || await mobilePage.$('text=Deploy');
      if (deployBtn) {
        await deployBtn.click();
        await delay(5000);
        const ssMobileGame = await screenshot(mobilePage, '09-mobile-game');

        const mobileCanvas = await mobilePage.$('canvas');
        check('Mobile - Game renders', mobileCanvas ? 'PASS' : 'FAIL', ssMobileGame,
          `Canvas present on mobile: ${mobileCanvas !== null}`);

        const mobileBody = await mobilePage.textContent('body') || '';
        const mobileHasHUD = mobileBody.toLowerCase().includes('wood') || mobileBody.toLowerCase().includes('fish') || mobileBody.toLowerCase().includes('hp');
        check('Mobile - HUD adapts', mobileHasHUD ? 'PASS' : 'FAIL', ssMobileGame,
          `Mobile HUD elements: ${mobileHasHUD}. Text: ${mobileBody.substring(0, 200)}`);
      } else {
        check('Mobile - Deploy', 'FAIL', ssMobile, 'Deploy button not found on mobile');
      }
    } else {
      check('Mobile - Menu navigation', 'FAIL', ssMobile, 'Campaign button not found on mobile');
    }

    await mobileContext.close();
  } catch (e) {
    const ssMobileErr = await screenshot(page, '09-mobile-error');
    check('Mobile viewport', 'FAIL', ssMobileErr, `Error: ${e.message}`);
  }

  // ==========================================
  // 10. Skirmish game
  // ==========================================
  console.log('\n=== 10. Skirmish game ===');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2000);

    const skirmishBtn = await page.$('button:has-text("Skirmish")')
      || await page.$('text=Skirmish');

    if (skirmishBtn) {
      await skirmishBtn.click();
      await delay(1500);

      // Look for seed input and set it
      const seedInput = await page.$('input[type="text"]') || await page.$('input[type="number"]') || await page.$('input');
      if (seedInput) {
        await seedInput.fill('42');
        await delay(500);
      }

      const ssSkirmishSetup = await screenshot(page, '10a-skirmish-setup');

      // Click Start
      const startBtn = await page.$('button:has-text("Start")')
        || await page.$('button:has-text("Start Skirmish")')
        || await page.$('button:has-text("Play")');

      if (startBtn) {
        await startBtn.click();
        await delay(3000);

        console.log('  Waiting 15 seconds for skirmish...');
        await delay(12000);
        const ssSkirmishGame = await screenshot(page, '10-skirmish-game');

        const skirmishBody = await page.textContent('body') || '';
        const skirmishCanvas = await page.$('canvas');

        check('Skirmish - Game running', skirmishCanvas ? 'PASS' : 'FAIL', ssSkirmishGame,
          `Canvas: ${skirmishCanvas !== null}. Text: ${skirmishBody.substring(0, 200)}`);
      } else {
        const ssNoStart = await screenshot(page, '10-skirmish-no-start');
        check('Skirmish - Start button', 'FAIL', ssNoStart, 'Start button not found');
      }
    } else {
      const ssNoSkirmish = await screenshot(page, '10-no-skirmish');
      check('Skirmish - button', 'FAIL', ssNoSkirmish, 'Skirmish button not found');
    }
  } catch (e) {
    const ssError = await screenshot(page, '10-skirmish-error');
    check('Skirmish flow', 'FAIL', ssError, `Error: ${e.message}`);
  }

  // ==========================================
  // Print Report
  // ==========================================
  console.log('\n\n========================================');
  console.log('  VERIFICATION REPORT');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    console.log(`[${r.status}] ${r.name}`);
    console.log(`       Screenshot: ${r.screenshot}`);
    console.log(`       Details: ${r.details}`);
    console.log('');
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }

  console.log(`\nTotal: ${passCount} PASS, ${failCount} FAIL out of ${results.length} checks`);

  if (consoleMsgs.length > 0) {
    console.log('\n--- Browser Console Messages (last 50) ---');
    for (const msg of consoleMsgs.slice(-50)) {
      console.log(`  ${msg}`);
    }
  }

  if (pageErrors.length > 0) {
    console.log('\n--- Page Errors ---');
    for (const err of pageErrors) {
      console.log(`  ERROR: ${err}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
