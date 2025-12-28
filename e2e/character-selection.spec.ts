import { expect, test } from "@playwright/test";
import { injectGameState, waitForStable } from "./helpers";

/**
 * E2E Tests: Character Selection and Unlocks
 *
 * Tests for character selection mechanics and unlock requirements:
 * - Locked character display
 * - Character unlock system
 * - Character selection UI
 */

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
