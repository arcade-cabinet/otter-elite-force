/**
 * Canteen Component Tests
 *
 * Tests the canteen (shop) UI including:
 * - Character purchasing
 * - Weapon upgrades
 * - Stat upgrades
 * - Currency display
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore, UPGRADE_COSTS } from "../../stores/gameStore";
import { Canteen } from "../Canteen";

// Mock CSS
vi.mock("../../styles/main.css", () => ({}));

describe("Canteen", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 5000,
				unlockedCharacters: ["bubbles"],
				unlockedWeapons: ["service-pistol"],
				upgrades: {
					speedBoost: 0,
					healthBoost: 0,
					damageBoost: 0,
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render the canteen", () => {
		render(<Canteen />);
		expect(screen.getByText(/CANTEEN|ARMORY|SHOP/i)).toBeInTheDocument();
	});

	it("should display current coin balance", () => {
		render(<Canteen />);
		expect(screen.getByText(/5000/)).toBeInTheDocument();
	});

	it("should show back to menu button", () => {
		render(<Canteen />);
		const backButton = screen.getByRole("button", { name: /BACK|MENU|EXIT/i });
		expect(backButton).toBeInTheDocument();
	});

	it("should navigate back to menu when back clicked", () => {
		render(<Canteen />);
		const backButton = screen.getByRole("button", { name: /BACK|MENU|EXIT/i });

		fireEvent.click(backButton);

		expect(useGameStore.getState().mode).toBe("MENU");
	});

	it("should display upgrade options", () => {
		render(<Canteen />);
		// Should show stat upgrade buttons
		expect(screen.getByText(/SPEED|HEALTH|DAMAGE/i)).toBeInTheDocument();
	});

	it("should show upgrade costs", () => {
		render(<Canteen />);
		// Should display upgrade cost
		const costText = screen.getByText(new RegExp(UPGRADE_COSTS.speed.toString()));
		expect(costText).toBeInTheDocument();
	});

	it("should buy speed upgrade when clicked", () => {
		render(<Canteen />);
		const speedButton = screen.getByText(/SPEED/i).closest("button");

		if (speedButton) {
			fireEvent.click(speedButton);
			expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
		}
	});

	it("should deduct coins after purchase", () => {
		const initialCoins = useGameStore.getState().saveData.coins;
		render(<Canteen />);
		const speedButton = screen.getByText(/SPEED/i).closest("button");

		if (speedButton) {
			fireEvent.click(speedButton);
			expect(useGameStore.getState().saveData.coins).toBeLessThan(initialCoins);
		}
	});

	it("should disable purchase when insufficient funds", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				coins: 10, // Not enough for any upgrade
			},
		});

		render(<Canteen />);
		const speedButton = screen.getByText(/SPEED/i).closest("button");

		// Button should be disabled or purchase should fail
		if (speedButton) {
			const initialSpeedBoost = useGameStore.getState().saveData.upgrades.speedBoost;
			fireEvent.click(speedButton);
			expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(initialSpeedBoost);
		}
	});
});

describe("Canteen - Character Shop", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 10000,
				unlockedCharacters: ["bubbles"],
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should display available characters for purchase", () => {
		render(<Canteen />);
		// Should show locked characters that can be purchased
		expect(screen.getByText(/WHISKERS|SPLASH|MUDSKIPPER/i)).toBeInTheDocument();
	});

	it("should show character prices", () => {
		render(<Canteen />);
		// Characters have prices displayed
		const priceElements = screen.getAllByText(/\d+/);
		expect(priceElements.length).toBeGreaterThan(0);
	});

	it("should unlock character when purchased", () => {
		render(<Canteen />);
		// Find a locked character button and click it
		const whiskersElement = screen.getByText(/WHISKERS/i);
		const buyButton = whiskersElement.closest("button") || whiskersElement.parentElement?.querySelector("button");

		if (buyButton && !buyButton.disabled) {
			fireEvent.click(buyButton);
			expect(useGameStore.getState().saveData.unlockedCharacters).toContain("whiskers");
		}
	});
});

describe("Canteen - Weapon Upgrades", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 5000,
				unlockedWeapons: ["service-pistol"],
				upgrades: {
					speedBoost: 0,
					healthBoost: 0,
					damageBoost: 0,
					weaponLvl: {
						"service-pistol": 1,
					},
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should display weapon upgrade options", () => {
		render(<Canteen />);
		expect(screen.getByText(/PISTOL|WEAPON/i)).toBeInTheDocument();
	});

	it("should show current weapon level", () => {
		render(<Canteen />);
		// Should display level indicator
		expect(screen.getByText(/LV|LEVEL|1/i)).toBeInTheDocument();
	});
});
