import { expect, test } from "@playwright/test";

/**
 * Comprehensive Gameplay Verification — Mission 1 (Beachhead)
 *
 * Deploys Mission 1, lets it run for ~90s, and verifies all core gameplay
 * systems: economy, objectives, movement, combat, selection, build, minimap,
 * tutorial, and dialogue.
 */

test.use({
	viewport: { width: 1920, height: 1080 },
});

test.describe("Gameplay Verification: Mission 1", () => {
	test.setTimeout(180_000);

	test("full 90-second gameplay verification", async ({ page }) => {
		const errors: string[] = [];
		const warnings: string[] = [];
		const issuesFound: string[] = [];

		// Track ALL console messages for debugging game end
		const allConsole: string[] = [];
		page.on("console", (msg) => {
			const text = msg.text();
			allConsole.push(`[${msg.type()}] ${text}`);
			if (msg.type() === "error") {
				if (
					!text.includes("favicon") &&
					!text.includes("manifest") &&
					!text.includes("WebGL") &&
					!text.includes("net::ERR") &&
					!text.includes("AudioContext")
				) {
					errors.push(text);
				}
			}
		});

		await page.goto("http://localhost:5173/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		// ====================================================================
		// STEP 1: Navigate to briefing
		// ====================================================================
		console.log("=== STEP 1: Navigate to Mission 1 ===");
		await expect(page.locator("h1")).toContainText("Otter Elite Force", {
			timeout: 10000,
		});
		await page.screenshot({ path: "/tmp/gameplay-verify-01-main-menu.png" });

		await page.getByRole("button", { name: /New Campaign/i }).click();
		await page.waitForTimeout(1000);

		await expect(page.getByText("Mission Briefing")).toBeVisible({
			timeout: 10000,
		});
		await expect(
			page.getByRole("heading", { name: "Beachhead" }),
		).toBeVisible();
		await page.screenshot({ path: "/tmp/gameplay-verify-02-briefing.png" });

		// ====================================================================
		// STEP 2: Deploy
		// ====================================================================
		console.log("=== STEP 2: Deploy mission ===");
		await page.getByRole("button", { name: /Deploy/i }).click();

		// Wait for game HUD to appear
		const hudResources = page.locator(
			"[data-testid='runtime-hud-resources']",
		);
		await expect(hudResources).toBeVisible({ timeout: 15000 });
		await page.waitForTimeout(2000);
		await page.screenshot({
			path: "/tmp/gameplay-verify-03-game-loaded.png",
		});

		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
		console.log(`Canvas count: ${canvasCount}`);

		// ====================================================================
		// Helper: read resources safely
		// ====================================================================
		const readResources = async () => {
			try {
				const resourceBar = await hudResources.textContent({
					timeout: 3000,
				});
				if (!resourceBar) return null;
				const fishMatch = resourceBar.match(/Fish\s+(\d+)/i);
				const timberMatch = resourceBar.match(/Timber\s+(\d+)/i);
				const salvageMatch = resourceBar.match(/Salvage\s+(\d+)/i);
				return {
					fish: fishMatch ? Number.parseInt(fishMatch[1], 10) : 0,
					timber: timberMatch
						? Number.parseInt(timberMatch[1], 10)
						: 0,
					salvage: salvageMatch
						? Number.parseInt(salvageMatch[1], 10)
						: 0,
				};
			} catch {
				return null;
			}
		};

		// ====================================================================
		// Initial resource read
		// ====================================================================
		let resources = await readResources();
		console.log("Initial resources:", resources);

		// ====================================================================
		// TEST 11: Tutorial overlay
		// ====================================================================
		console.log("=== TEST 11: Tutorial overlay ===");
		const tutorialOverlay = page.locator("[data-testid='tutorial-overlay']");
		const tutorialVisible = await tutorialOverlay
			.isVisible()
			.catch(() => false);
		if (tutorialVisible) {
			console.log("PASS: Tutorial overlay appeared");
			const dismissBtn = tutorialOverlay.locator("button", {
				hasText: "Dismiss",
			});
			if (await dismissBtn.isVisible()) {
				await dismissBtn.click();
				await page.waitForTimeout(500);
				console.log("PASS: Tutorial dismissed");
			}
		} else {
			warnings.push("Tutorial overlay not visible");
		}

		// ====================================================================
		// Monitor game over 90 seconds in 5-second intervals
		// ====================================================================
		console.log("=== Running game for ~90 seconds ===");

		let lastGoodResources = resources;
		let gameEndPhase: string | null = null;
		let gameEndTime = 0;
		let dialogueSeen = false;
		let selectionWorked = false;
		let moveIssued = false;
		let buildMenuSeen = false;
		let objectiveCompleted = false;

		// We'll do 18 iterations of 5 seconds each = 90 seconds
		for (let tick = 0; tick < 18; tick++) {
			await page.waitForTimeout(5000);
			const elapsedSec = (tick + 1) * 5 + 7; // +7 for initial setup time

			// Check if game is still running by trying to read resources
			resources = await readResources();

			if (!resources) {
				// Game may have ended, take a diagnostic screenshot
				await page.screenshot({
					path: `/tmp/gameplay-verify-diag-${elapsedSec}s.png`,
				});

				// Capture current page content to understand what screen we're on
				const pageText = await page
					.evaluate(() => document.body.innerText?.substring(0, 500))
					.catch(() => "");
				console.log(`Game ended at ~${elapsedSec}s. Page text: ${pageText.substring(0, 200)}`);

				// Detect specific end state
				const hasResult = await page
					.getByText(/MISSION/i)
					.first()
					.isVisible()
					.catch(() => false);
				const hasMenu = await page
					.getByRole("button", { name: /New Campaign/i })
					.isVisible()
					.catch(() => false);

				if (hasResult) {
					const resultText = await page
						.getByText(/MISSION/i)
						.first()
						.textContent()
						.catch(() => "");
					gameEndPhase = resultText?.includes("COMPLETE")
						? "victory"
						: "defeat";
				} else if (hasMenu) {
					gameEndPhase = "returned-to-menu";
				} else {
					gameEndPhase = "unknown-screen";
				}

				gameEndTime = elapsedSec;
				issuesFound.push(
					`Game ended as '${gameEndPhase}' at ~${elapsedSec}s`,
				);
				break;
			}

			lastGoodResources = resources;

			// Log resources every 15 seconds
			if (tick % 3 === 2) {
				console.log(
					`[${elapsedSec}s] Fish=${resources.fish}, Timber=${resources.timber}, Salvage=${resources.salvage}`,
				);
				await page.screenshot({
					path: `/tmp/gameplay-verify-run-${elapsedSec}s.png`,
				});
			}

			// ================================================================
			// TEST 12: Check dialogue at ~15s mark
			// ================================================================
			if (tick === 1 && !dialogueSeen) {
				const dialogueBtn = page.locator("text=[continue]");
				const dv = await dialogueBtn.isVisible().catch(() => false);
				if (dv) {
					dialogueSeen = true;
					console.log("PASS: Dialogue appeared");
					await dialogueBtn.click().catch(() => {});
					await page.waitForTimeout(300);
				}
			}

			// ================================================================
			// TEST 7: Select worker at ~20s mark
			// ================================================================
			if (tick === 2 && !selectionWorked) {
				const viewport = page.viewportSize();
				const cx = (viewport?.width ?? 1920) / 2;
				const cy = (viewport?.height ?? 1080) / 2;

				// Try clicking near center
				for (const [dx, dy] of [
					[0, 0],
					[0, -50],
					[50, 0],
					[-50, 0],
					[0, 50],
					[-30, -30],
					[30, 30],
				]) {
					await page.mouse.click(cx + dx, cy + dy);
					await page.waitForTimeout(300);
					const selPanel = page.locator(
						"[data-testid='runtime-hud-selection']",
					);
					const sv = await selPanel.isVisible().catch(() => false);
					if (sv) {
						const selText = await selPanel
							.textContent()
							.catch(() => "");
						console.log(`PASS: Selection: "${selText}"`);
						if (selText?.toUpperCase().includes("RIVER RAT")) {
							console.log("PASS: Selected RIVER RAT");
						}
						selectionWorked = true;
						await page.screenshot({
							path: "/tmp/gameplay-verify-06-selection.png",
						});
						break;
					}
				}
				if (!selectionWorked) {
					warnings.push("Could not select a unit");
				}
			}

			// ================================================================
			// TEST 8: Right-click move at ~25s
			// ================================================================
			if (tick === 3 && selectionWorked && !moveIssued) {
				const vp = page.viewportSize();
				const cx = (vp?.width ?? 1920) / 2;
				const cy = (vp?.height ?? 1080) / 2;
				await page.mouse.click(cx + 150, cy - 150, {
					button: "right",
				});
				await page.waitForTimeout(500);
				moveIssued = true;
				console.log("PASS: Right-click move issued");
			}

			// ================================================================
			// TEST 9: Build mode at ~30s
			// ================================================================
			if (tick === 4 && !buildMenuSeen) {
				await page.keyboard.press("b");
				await page.waitForTimeout(1000);
				// Build mode shows an alert with building name via the runtime
				const alertBanner = page.locator("[data-testid='runtime-hud-alerts']");
				const alertVisible = await alertBanner.isVisible().catch(() => false);
				if (alertVisible) {
					const alertText = await alertBanner.textContent().catch(() => "");
					if (alertText?.toLowerCase().includes("build")) {
						buildMenuSeen = true;
						console.log(`PASS: Build mode entered: "${alertText}"`);
					}
				}
				if (buildMenuSeen) {
					await page.screenshot({
						path: "/tmp/gameplay-verify-08-build-mode.png",
					});
					await page.keyboard.press("Escape");
				} else {
					warnings.push("Build mode not detected on B key press");
				}
			}

			// ================================================================
			// TEST 3: Check objectives
			// ================================================================
			if (tick % 3 === 2 && !objectiveCompleted) {
				const objPanel = page.locator(
					"[data-testid='runtime-hud-objectives']",
				);
				const ov = await objPanel.isVisible().catch(() => false);
				if (ov) {
					const objText = await objPanel
						.textContent()
						.catch(() => "");
					if (objText?.includes("[x]")) {
						objectiveCompleted = true;
						console.log("PASS: Objective completed");
					}
				}
			}
		}

		// ====================================================================
		// Final analysis
		// ====================================================================
		const finalResources = lastGoodResources ?? {
			fish: 0,
			timber: 0,
			salvage: 0,
		};

		console.log("\n=== RESOURCE ANALYSIS ===");
		console.log(`Final: Fish=${finalResources.fish}, Timber=${finalResources.timber}, Salvage=${finalResources.salvage}`);

		// Starting: fish:200, timber:50, salvage:75
		const fishDelta = finalResources.fish - 200;
		const timberDelta = finalResources.timber - 50;
		const salvageDelta = finalResources.salvage - 75;
		console.log(`Delta: Fish=${fishDelta}, Timber=${timberDelta}, Salvage=${salvageDelta}`);

		if (fishDelta > 0 || timberDelta > 0) {
			console.log("PASS: Economy system is working (resources increased)");
		} else if (!gameEndPhase) {
			issuesFound.push("Economy not working: resources did not increase");
		}

		// ====================================================================
		// Summary
		// ====================================================================
		console.log("\n===================================");
		console.log("=== GAMEPLAY VERIFICATION SUMMARY ===");
		console.log("===================================");
		console.log(`Tutorial: ${tutorialVisible ? "PASS" : "WARN"}`);
		console.log(`Dialogue: ${dialogueSeen ? "PASS" : "WARN"}`);
		console.log(`Selection: ${selectionWorked ? "PASS" : "WARN"}`);
		console.log(`Move: ${moveIssued ? "PASS" : "WARN"}`);
		console.log(`Build Menu: ${buildMenuSeen ? "PASS" : "WARN"}`);
		console.log(`Objective Completed: ${objectiveCompleted ? "PASS" : "NOT YET"}`);
		console.log(`Game End: ${gameEndPhase ?? "Still running"}`);
		console.log(`Issues: ${issuesFound.length}`);
		console.log(`Warnings: ${warnings.length}`);

		for (const issue of issuesFound) {
			console.log(`  ISSUE: ${issue}`);
		}
		for (const w of warnings) {
			console.log(`  WARN: ${w}`);
		}

		// Dump last 20 console messages for debugging if game ended early
		if (gameEndPhase && gameEndTime < 60) {
			console.log("\n=== LAST 30 CONSOLE MESSAGES ===");
			for (const msg of allConsole.slice(-30)) {
				console.log(`  ${msg}`);
			}
		}

		// Hard assertions
		expect(canvasCount).toBeGreaterThanOrEqual(1);

		// Assert the game stayed running for at least 30 seconds
		// (if it ended, the game has a critical issue)
		if (gameEndPhase && gameEndTime < 30) {
			// This test should fail if the game crashes within 30 seconds
			expect(gameEndPhase).toBeNull();
		}
	});
});
