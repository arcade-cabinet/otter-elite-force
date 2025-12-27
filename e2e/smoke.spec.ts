import { expect, test } from "@playwright/test";

test("app loads and displays title", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /OTTER: ELITE FORCE/i })).toBeVisible();
});
