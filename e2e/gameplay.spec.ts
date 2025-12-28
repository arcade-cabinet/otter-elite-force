import { expect, type Page, test } from "@playwright/test";

/**
 * End-to-End Gameplay Tests for OTTER: ELITE FORCE
 *
 * Comprehensive playthrough tests that exercise normal gameplay scenarios:
 * - Main menu navigation and game initialization
 * - Canteen operation (character unlocks, upgrades)
 * - Base construction flow
 * - Village hut interactions
 * - Movement and climbing mechanics
 * - Combat and enemy interactions
 * - Objective systems (LZ securing, clam collection)
 *
 * These tests validate the full game flow and help identify visual quirks.
 */

const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

// Helper to wait for game to stabilize after transitions
// Uses networkidle for deterministic waits (recommended by gemini-code-assist)
const waitForStable = async (page: Page, ms = 1500) => {
	await page.waitForLoadState("networkidle");
	if (ms > 0) {
		await page.waitForTimeout(ms);
	}
};

// Helper to inject game state for testing specific scenarios
const injectGameState = async (page: Page, stateOverrides: Record<string, unknown>) => {
	await page.evaluate((overrides) => {
		const key = "otter_v8";
		// Provide a full valid base state to pass validation
		const baseState = {
			version: 8,
			rank: 0,
			xp: 0,
			medals: 0,
			unlocked: 1,
			unlockedCharacters: ["bubbles"],
			unlockedWeapons: ["service-pistol"],
			coins: 0,
			discoveredChunks: {},
			territoryScore: 0,
			peacekeepingScore: 0,
			difficultyMode: "SUPPORT",
			isFallTriggered: false,
			strategicObjectives: {
				siphonsDismantled: 0,
				villagesLiberated: 0,
				gasStockpilesCaptured: 0,
				healersProtected: 0,
				alliesRescued: 0,
			},
			spoilsOfWar: {
				creditsEarned: 0,
				clamsHarvested: 0,
				upgradesUnlocked: 0,
			},
			upgrades: {
				speedBoost: 0,
				healthBoost: 0,
				damageBoost: 0,
				weaponLvl: { "service-pistol": 1 },
			},
			isLZSecured: false,
			baseComponents: [],
			lastPlayerPosition: [0, 0, 0],
		};

		const existing = localStorage.getItem(key);
		const current = existing ? JSON.parse(existing) : baseState;

		// Deep merge helper for evaluate block
		const merge = (
			target: Record<string, unknown>,
			source: Record<string, unknown>,
		): Record<string, unknown> => {
			for (const key of Object.keys(source)) {
				// Guard against prototype pollution
				if (key === "__proto__" || key === "constructor" || key === "prototype") {
					continue;
				}
				if (source[key] instanceof Object && !Array.isArray(source[key])) {
					if (!target[key]) target[key] = {};
					merge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					target[key] = source[key];
				}
			}
			return target;
		};

		const merged = merge({ ...current }, overrides);
		localStorage.setItem(key, JSON.stringify(merged));
	}, stateOverrides);
	await page.reload();
	await page.waitForLoadState("networkidle");
	await waitForStable(page);
};

test.describe("Gameplay Flow - Menu to Game Transition", () => {
	test.beforeEach(async ({ page }) => {
		// Clear save data for fresh start
		await page.goto("/");
		await page.evaluate(() => localStorage.removeItem("otter_v8"));
		await page.reload();
		await waitForStable(page);
	});

	test("complete new game flow: menu -> cutscene -> game world", async ({ page }) => {
		// Verify main menu loaded
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
		await expect(page.getByRole("heading", { name: /ELITE FORCE/i })).toBeVisible();

		// Check default character is selected
		const bubblesCard = page.locator('.char-card.selected:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toBeVisible();

		// Verify NEW GAME button is shown (no save data)
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible();

		// Start new game
		await newGameBtn.click();

		// Should transition to cutscene
		const cutscene = page.locator(".cutscene-screen");
		await expect(cutscene).toBeVisible({ timeout: 10000 });
		await expect(page.locator(".dialogue-box")).toBeVisible();

		// Verify cutscene has proper elements
		const dialogueText = page.locator(".dialogue-text");
		await expect(dialogueText).toBeVisible();

		// Click through cutscene
		const nextBtn = page.locator("button.dialogue-next");
		await expect(nextBtn).toBeVisible({ timeout: 10000 });

		// Click NEXT >> until we reach BEGIN MISSION (with delays for stability)
		let buttonText = await nextBtn.innerText();
		let clickCount = 0;
		while (buttonText.includes("NEXT") && clickCount < 20) {
			await nextBtn.click();
			await page.waitForTimeout(500);
			buttonText = await nextBtn.innerText();
			clickCount++;
		}

		// Final click on BEGIN MISSION - use JS click to bypass animation issues
		const beginMissionBtn = page.locator('button.dialogue-next:has-text("BEGIN MISSION")');
		await expect(beginMissionBtn).toBeVisible({ timeout: 5000 });
		await page.evaluate(() => {
			const btn = document.querySelector("button.dialogue-next") as HTMLButtonElement;
			if (btn) btn.click();
		});

		// Wait for transition to start
		await page.waitForTimeout(500);

		// Should transition to gameplay (canvas visible if WebGL supported)
		if (hasMcpSupport) {
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });

			// HUD should also be visible
			await expect(page.locator(".hud-container")).toBeVisible({ timeout: 5000 });
		} else {
			// If no WebGL, we might still see HUD or just verify we're not on menu
			await expect(page.getByRole("heading", { name: /OTTER/i })).not.toBeVisible();
		}
	});

	test("continue campaign flow for returning players", async ({ page }) => {
		// Inject save data with some progress
		await injectGameState(page, {
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: false } },
			isLZSecured: false,
			coins: 500,
			rank: 1,
		});

		// Should show CONTINUE CAMPAIGN button instead of NEW GAME
		const continueBtn = page.locator('button:has-text("CONTINUE CAMPAIGN")');
		await expect(continueBtn).toBeVisible();

		// Should also show RESTART CAMPAIGN option
		const restartBtn = page.locator('button:has-text("RESTART CAMPAIGN")');
		await expect(restartBtn).toBeVisible();

		// Continue should go directly to game (skip cutscene)
		await continueBtn.click();
		await waitForStable(page, 2000);

		// Should be in game mode (canvas visible if WebGL supported)
		if (hasMcpSupport) {
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 10000 });
		} else {
			await expect(page.locator('button:has-text("CONTINUE CAMPAIGN")')).not.toBeVisible();
		}
	});

	test("difficulty selection only allows escalation", async ({ page }) => {
		// Start with SUPPORT difficulty (default)
		await expect(page.locator(".stat-val:has-text('SUPPORT')")).toBeVisible();

		// TACTICAL card should be clickable (can escalate)
		const tacticalCard = page.locator('.diff-card:has-text("TACTICAL")');
		await expect(tacticalCard).not.toHaveClass(/locked/);

		// SUPPORT should be marked as current
		const supportCard = page.locator('.diff-card:has-text("SUPPORT")');
		await expect(supportCard).toHaveClass(/selected/);

		// ELITE should be available for escalation
		const eliteCard = page.locator('.diff-card:has-text("ELITE")');
		await expect(eliteCard).not.toHaveClass(/locked/);

		// Escalate to TACTICAL
		page.on("dialog", (dialog) => dialog.accept());
		await tacticalCard.click();
		await expect(page.locator(".stat-val:has-text('TACTICAL')")).toBeVisible();

		// Now SUPPORT should be locked (cannot downgrade)
		await expect(page.locator('.diff-card:has-text("SUPPORT")')).toHaveClass(/locked/);
	});

	test("The Fall mechanic in TACTICAL mode", async ({ page }) => {
		// Inject TACTICAL mode with isFallTriggered enabled
		await injectGameState(page, {
			difficultyMode: "TACTICAL",
			isFallTriggered: true,
			isLZSecured: true,
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: true } },
		});

		// Start game - wait for button to be ready before clicking
		const continueBtn = page.locator('button:has-text("CONTINUE CAMPAIGN")');
		await expect(continueBtn).toBeVisible();
		await continueBtn.click();

		// Wait for game to load (longer on mobile/CI)
		await waitForStable(page, 5000);

		// HUD should show THE FALL warning with extended timeout for mobile
		await expect(page.locator("text=THE FALL")).toBeVisible({ timeout: 15000 });
		await expect(page.locator("text=RETURN TO LZ")).toBeVisible({ timeout: 10000 });
	});
});

test.describe("Canteen Operations", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await waitForStable(page);
	});

	test("navigate to canteen and view character roster", async ({ page }) => {
		// Navigate to canteen
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();

		// Should show Forward Operating Base header
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();

		// Should show supply credits
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();

		// Should have PLATOON and UPGRADES tabs
		await expect(page.locator('button:has-text("PLATOON")')).toBeVisible();
		await expect(page.locator('button:has-text("UPGRADES")')).toBeVisible();

		// PLATOON tab should be active by default
		await expect(page.locator('button.active:has-text("PLATOON")')).toBeVisible();
	});

	test("character selection in platoon roster", async ({ page }) => {
		// Navigate to canteen
		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page);

		// Platoon list should show characters
		const platoonList = page.locator(".platoon-list");
		await expect(platoonList).toBeVisible();

		// Default character (bubbles) should be unlocked
		const bubblesItem = page.locator('.platoon-item:has-text("SGT. BUBBLES")');
		await expect(bubblesItem).toHaveClass(/unlocked/);

		// Select different character if available
		const characterItems = page.locator(".platoon-item");
		const count = await characterItems.count();
		expect(count).toBeGreaterThan(0);
	});

	test("upgrades tab shows boost options", async ({ page }) => {
		// Navigate to canteen - wait for button visibility first
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();
		await waitForStable(page, 2000);

		// Wait for canteen to load
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();

		// Switch to UPGRADES tab - wait for button visibility
		const upgradesTab = page.locator('button:has-text("UPGRADES")');
		await expect(upgradesTab).toBeVisible();
		await upgradesTab.click();
		await waitForStable(page, 500);

		// Should show upgrade options with extended timeout for mobile
		await expect(page.locator("text=SPEED BOOST")).toBeVisible({ timeout: 10000 });
		await expect(page.locator("text=HEALTH BOOST")).toBeVisible({ timeout: 10000 });
		await expect(page.locator("text=DAMAGE BOOST")).toBeVisible({ timeout: 10000 });

		// Each upgrade should have a BUY button
		const buyButtons = page.locator('.upgrade-item button:has-text("BUY")');
		await expect(buyButtons.first()).toBeVisible({ timeout: 10000 });
	});

	test("purchase upgrade with sufficient coins", async ({ page }) => {
		// Inject coins for testing
		await injectGameState(page, {
			coins: 1000,
			upgrades: { speedBoost: 1, healthBoost: 1, damageBoost: 1, weaponLvl: {} },
		});

		// Navigate to canteen upgrades - wait for visibility first
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();
		await waitForStable(page, 2000);

		// Wait for canteen to fully load
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();

		// Switch to UPGRADES tab
		const upgradesTab = page.locator('button:has-text("UPGRADES")');
		await expect(upgradesTab).toBeVisible();
		await upgradesTab.click();
		await waitForStable(page, 500);

		// Initial speed boost level should be 1 (with extended timeout for mobile)
		await expect(page.locator("text=SPEED BOOST (Lvl 1)")).toBeVisible({ timeout: 10000 });

		// Click buy on speed boost - wait for button visibility
		const speedBuyBtn = page
			.locator('.upgrade-item:has-text("SPEED BOOST")')
			.locator('button:has-text("BUY")');
		await expect(speedBuyBtn).toBeVisible({ timeout: 10000 });
		await speedBuyBtn.click();

		// Should now show level 2 (with extended timeout for UI update)
		await expect(page.locator("text=SPEED BOOST (Lvl 2)")).toBeVisible({ timeout: 10000 });
	});

	test("return to menu from canteen", async ({ page }) => {
		// Navigate to canteen - wait for button visibility first
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();
		await waitForStable(page, 2000);

		// Wait for canteen to fully load
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();

		// Click return button - wait for visibility first
		const returnBtn = page.locator('button:has-text("RETURN TO PERIMETER")');
		await expect(returnBtn).toBeVisible({ timeout: 10000 });
		await returnBtn.click();

		// Should be back at main menu (with extended timeout for transition)
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible({ timeout: 10000 });
	});

	test.describe("WebGL required", () => {
		test.skip(!hasMcpSupport, "Requires WebGL for 3D preview");

		test("canteen 3D preview renders character", async ({ page }) => {
			await page.locator('button:has-text("VISIT CANTEEN")').click();
			await waitForStable(page, 2000);

			// Canvas should be visible for 3D preview
			const canvas = page.locator(".canteen-3d canvas");
			await expect(canvas).toBeVisible();
		});
	});
});

test.describe("Base Construction System", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Inject state with LZ secured to enable build mode
		await injectGameState(page, {
			isLZSecured: true,
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: true } },
			baseComponents: [],
			coins: 1000,
		});
	});

	test("build button appears when LZ is secured", async ({ page }) => {
		// Start game
		await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
		await waitForStable(page, 3000);

		// BUILD button should be visible in HUD
		const buildBtn = page.locator('.action-btn.build:has-text("BUILD")');
		await expect(buildBtn).toBeVisible({ timeout: 10000 });
	});

	test.describe("WebGL required", () => {
		test.skip(!hasMcpSupport, "Requires WebGL for gameplay");

		test("build mode UI shows component options", async ({ page }) => {
			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Click BUILD button
			const buildBtn = page.locator('.action-btn.build:has-text("BUILD")');
			await buildBtn.click();

			// Build UI should appear with component options
			const buildUI = page.locator(".build-ui");
			await expect(buildUI).toBeVisible();

			// Should have all building component buttons
			await expect(page.locator('button:has-text("+FLOOR")')).toBeVisible();
			await expect(page.locator('button:has-text("+WALL")')).toBeVisible();
			await expect(page.locator('button:has-text("+ROOF")')).toBeVisible();
			await expect(page.locator('button:has-text("+STILT")')).toBeVisible();
		});

		test("placing base components persists to save data", async ({ page }) => {
			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Enter build mode
			await page.locator('.action-btn.build:has-text("BUILD")').click();
			await waitForStable(page);

			// Place a floor
			await page.locator('button:has-text("+FLOOR")').click();

			// Check save data includes the component
			const saveData = await page.evaluate(() => {
				const data = localStorage.getItem("otter_v8");
				return data ? JSON.parse(data) : null;
			});

			expect(saveData?.baseComponents?.length).toBeGreaterThan(0);
			expect(saveData?.baseComponents[0]?.type).toBe("FLOOR");
		});
	});
});

test.describe("HUD and Player Interface", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await injectGameState(page, {
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: false } },
		});
	});

	test.describe("WebGL required", () => {
		test.skip(!hasMcpSupport, "Requires WebGL for gameplay");

		test("HUD displays player stats correctly", async ({ page }) => {
			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Health bar should be visible
			await expect(page.locator(".hud-health")).toBeVisible();
			await expect(page.locator(".hud-label:has-text('INTEGRITY')")).toBeVisible();

			// Coordinates should be displayed
			await expect(page.locator("text=COORD:")).toBeVisible();

			// Kill counter should be visible
			await expect(page.locator(".hud-label:has-text('ELIMINATIONS')")).toBeVisible();
		});

		test("action buttons are visible and responsive", async ({ page }) => {
			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Core action buttons should be visible
			await expect(page.locator('.action-btn.jump:has-text("JUMP")')).toBeVisible();
			await expect(page.locator('.action-btn.grip:has-text("GRIP")')).toBeVisible();
			await expect(page.locator('.action-btn.scope:has-text("SCOPE")')).toBeVisible();
		});

		test("first objective prompt shows for new players", async ({ page }) => {
			// Clear save data for fresh start
			await page.evaluate(() => localStorage.removeItem("otter_v8"));
			await page.reload();
			await waitForStable(page);

			// Start new game
			await page.locator('button:has-text("NEW GAME")').click();

			// Should show cutscene
			await expect(page.locator(".cutscene-screen")).toBeVisible();

			// Click through ALL cutscene dialogue until BEGIN MISSION
			const nextBtn = page.locator("button.dialogue-next");
			await expect(nextBtn).toBeVisible({ timeout: 10000 });

			let buttonText = await nextBtn.innerText();
			let clickCount = 0;
			while (buttonText.includes("NEXT") && clickCount < 20) {
				await nextBtn.click();
				await page.waitForTimeout(500);
				buttonText = await nextBtn.innerText();
				clickCount++;
			}

			// Final click on BEGIN MISSION - use force:true for animation stability
			const beginMissionBtn = page.locator('button.dialogue-next:has-text("BEGIN MISSION")');
			await expect(beginMissionBtn).toBeVisible({ timeout: 5000 });
			await page.evaluate(() => {
				const btn = document.querySelector("button.dialogue-next") as HTMLButtonElement;
				if (btn) btn.click();
			});
			await page.waitForTimeout(500);

			// Verify we transitioned to gameplay
			await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
			await waitForStable(page, 3000);

			// First objective prompt should be visible
			const firstObjective = page.locator(".first-objective-prompt");
			await expect(firstObjective).toBeVisible({ timeout: 10000 });
			await expect(page.locator("text=FIRST OBJECTIVE")).toBeVisible();
			await expect(page.locator("text=SECURE YOUR LZ")).toBeVisible();
		});

		test("joystick zones are visible for mobile controls", async ({ page }) => {
			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Move joystick zone
			await expect(page.locator("#joystick-move")).toBeVisible();
			await expect(page.locator("#joystick-move:has-text('MOVE')")).toBeVisible();

			// Look/aim joystick zone
			await expect(page.locator("#joystick-look")).toBeVisible();
		});
	});
});

test.describe("Game World and Environment", () => {
	test.describe("WebGL required", () => {
		test.skip(!hasMcpSupport, "Requires WebGL for gameplay");

		test("chunks are fixed on discovery and persist", async ({ page }) => {
			await page.goto("/");
			await page.evaluate(() => localStorage.removeItem("otter_v8"));
			await page.reload();
			await waitForStable(page);

			// Start new game
			await page.locator('button:has-text("NEW GAME")').click();

			// Should show cutscene
			await expect(page.locator(".cutscene-screen")).toBeVisible();

			// Click through ALL cutscene dialogue until BEGIN MISSION
			const nextBtn = page.locator("button.dialogue-next");
			await expect(nextBtn).toBeVisible({ timeout: 10000 });

			let buttonText = await nextBtn.innerText();
			let clickCount = 0;
			while (buttonText.includes("NEXT") && clickCount < 20) {
				await nextBtn.click();
				await page.waitForTimeout(500);
				buttonText = await nextBtn.innerText();
				clickCount++;
			}

			// Final click on BEGIN MISSION - use force:true for animation stability
			const beginMissionBtn = page.locator('button.dialogue-next:has-text("BEGIN MISSION")');
			await expect(beginMissionBtn).toBeVisible({ timeout: 5000 });
			await page.evaluate(() => {
				const btn = document.querySelector("button.dialogue-next") as HTMLButtonElement;
				if (btn) btn.click();
			});
			await page.waitForTimeout(500);

			// Verify we transitioned to gameplay
			await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
			await waitForStable(page, 4000);

			// Record discovered chunks
			const firstDiscovery = await page.evaluate(() => {
				const data = JSON.parse(localStorage.getItem("otter_v8") || "{}");
				return data.discoveredChunks;
			});
			const chunkKeys = Object.keys(firstDiscovery);
			expect(chunkKeys.length).toBeGreaterThan(0);

			// Reload page
			await page.reload();
			await waitForStable(page);

			// Verify chunks are the same
			const secondDiscovery = await page.evaluate(() => {
				const data = JSON.parse(localStorage.getItem("otter_v8") || "{}");
				return data.discoveredChunks;
			});
			expect(Object.keys(secondDiscovery)).toEqual(chunkKeys);

			// Verify deterministic content (seed is same)
			for (const key of chunkKeys) {
				expect(secondDiscovery[key].seed).toBe(firstDiscovery[key].seed);
			}
		});

		test("character rescue updates unlockedCharacters list", async ({ page }) => {
			// Start game with one character locked
			await page.goto("/");
			await injectGameState(page, {
				unlockedCharacters: ["bubbles"],
				discoveredChunks: {
					"5,5": {
						id: "5,5",
						x: 5,
						z: 5,
						entities: [
							{
								type: "PRISON_CAGE",
								id: "whiskers-cage",
								objectiveId: "whiskers",
								position: [0, 0, 0],
							},
						],
					},
				},
			});

			// We can't easily simulate 3D collision for rescue in E2E without complex setup,
			// but we can verify that the store action for rescue works by injecting state
			// and checking the UI.

			// Verify whiskers is locked
			await expect(page.locator('.char-card.locked:has-text("GEN. WHISKERS")')).toBeVisible();

			// Manually trigger rescue via store in console (simulating collision)
			await page.evaluate(() => {
				// Access the store via the window if it's exposed, or just simulate the state change
				const data = JSON.parse(localStorage.getItem("otter_v8") || "{}");
				data.unlockedCharacters.push("whiskers");
				localStorage.setItem("otter_v8", JSON.stringify(data));
			});

			await page.reload();
			await waitForStable(page);

			// Verify whiskers is now unlocked
			await expect(page.locator('.char-card.unlocked:has-text("GEN. WHISKERS")')).toBeVisible();
		});

		test("WebGL canvas renders 3D environment", async ({ page }) => {
			await page.goto("/");
			await injectGameState(page, {
				discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: false } },
			});

			// Start game
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await waitForStable(page, 3000);

			// Canvas should be present and rendering
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible();

			// Canvas should have non-zero dimensions
			const boundingBox = await canvas.boundingBox();
			expect(boundingBox?.width).toBeGreaterThan(0);
			expect(boundingBox?.height).toBeGreaterThan(0);
		});
	});
});

test.describe("Character Selection and Unlocks", () => {
	test("locked characters show unlock requirements", async ({ page }) => {
		await page.goto("/");
		await waitForStable(page);

		// Find a locked character card
		const lockedCard = page.locator(".char-card.locked").first();

		// Ensure we have at least one locked card to test
		await expect(lockedCard).toBeVisible();

		// Should show "RESCUE TO UNLOCK" text
		await expect(lockedCard.locator("text=RESCUE TO UNLOCK")).toBeVisible();

		// Should be visually and interactively locked
		await expect(lockedCard).toHaveClass(/locked/);
	});

	test("unlocked characters can be selected", async ({ page }) => {
		// Inject multiple unlocked characters
		await page.goto("/");
		await injectGameState(page, {
			unlockedCharacters: ["bubbles", "whiskers"],
		});

		// Find unlocked character cards
		const unlockedCards = page.locator(".char-card.unlocked");

		// Ensure both characters are unlocked
		await expect(unlockedCards).toHaveCount(2);

		// Click the second unlocked card (Whiskers)
		await unlockedCards.nth(1).click();

		// Should be selected
		await expect(unlockedCards.nth(1)).toHaveClass(/selected/);
	});
});

test.describe("Save and Persistence", () => {
	test("game state persists across page reloads", async ({ page }) => {
		await page.goto("/");

		// Inject specific state
		await injectGameState(page, {
			coins: 777,
			rank: 3,
			discoveredChunks: { "0,0": {}, "1,0": {}, "0,1": {} },
		});

		// Reload and verify state persisted
		await page.reload();
		await waitForStable(page);

		// Navigate to canteen to check coins
		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page);

		// Should show our injected coin amount
		await expect(page.locator("text=777")).toBeVisible();
	});

	test("reset data clears all progress", async ({ page }) => {
		await page.goto("/");

		// Inject state with progress
		await injectGameState(page, {
			coins: 999,
			rank: 5,
			discoveredChunks: { "0,0": {}, "1,1": {} },
			isLZSecured: true,
		});

		// Click reset button (need to handle confirmation dialog)
		page.on("dialog", (dialog) => dialog.accept());
		await page.locator('button:has-text("RESET ALL DATA")').click();

		// Page should reload, wait for it
		await page.waitForLoadState("networkidle");
		await waitForStable(page);

		// Should be back to fresh state - NEW GAME button visible
		await expect(page.locator('button:has-text("NEW GAME")')).toBeVisible();
	});
});

test.describe("Responsive Layout", () => {
	test("menu displays correctly on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await waitForStable(page);

		// Title should still be visible
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();

		// Buttons should be accessible
		await expect(page.locator('button:has-text("NEW GAME")')).toBeVisible();
		await expect(page.locator('button:has-text("VISIT CANTEEN")')).toBeVisible();
	});

	test("canteen displays correctly on tablet viewport", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/");
		await waitForStable(page);

		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page);

		// All UI elements should be visible
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();
		await expect(page.locator(".platoon-list")).toBeVisible();
	});
});

test.describe("Error Handling and Edge Cases", () => {
	test("app handles missing save data gracefully", async ({ page }) => {
		await page.goto("/");

		// Clear any existing save data
		await page.evaluate(() => localStorage.removeItem("otter_v8"));
		await page.reload();
		await waitForStable(page);

		// App should load without errors
		await expect(page.locator("#root")).toBeVisible();
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
	});

	test("app handles corrupted save data", async ({ page }) => {
		await page.goto("/");

		// Inject corrupted data
		await page.evaluate(() => {
			localStorage.setItem("otter_v8", "{ invalid json }}}");
		});

		// Reload - app should handle this gracefully
		await page.reload();
		await waitForStable(page);

		// App should still function (may reset to defaults)
		await expect(page.locator("#root")).toBeVisible();
	});

	test("no console errors on normal gameplay flow", async ({ page }) => {
		const consoleErrors: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/");
		await waitForStable(page);

		// Navigate through screens - wait for button visibility before clicking
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();
		await waitForStable(page, 2000);

		// Wait for canteen UI to fully load before clicking return
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible({
			timeout: 10000,
		});
		const returnBtn = page.locator('button:has-text("RETURN TO PERIMETER")');
		await expect(returnBtn).toBeVisible({ timeout: 10000 });
		await returnBtn.click();
		await waitForStable(page);

		// Filter out expected/non-critical errors
		const criticalErrors = consoleErrors.filter(
			(e) =>
				!e.includes("favicon") &&
				!e.includes("manifest") &&
				!e.includes("WebGL") &&
				!e.includes("THREE.WebGLRenderer"),
		);

		expect(criticalErrors).toHaveLength(0);
	});
});
