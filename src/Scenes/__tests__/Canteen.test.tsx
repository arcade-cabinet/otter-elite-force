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
import { UPGRADE_COSTS, useGameStore } from "../../stores/gameStore";
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
		expect(screen.getByText("FORWARD OPERATING BASE")).toBeInTheDocument();
	});

	it("should display current coin balance", () => {
		render(<Canteen />);
		expect(screen.getByText(/SUPPLY CREDITS: 5000/)).toBeInTheDocument();
	});

	it("should show back to menu button", () => {
		render(<Canteen />);
		const backButton = screen.getByRole("button", { name: /RETURN TO PERIMETER/i });
		expect(backButton).toBeInTheDocument();
	});

	it("should navigate back to menu when back clicked", () => {
		render(<Canteen />);
		const backButton = screen.getByRole("button", { name: /RETURN TO PERIMETER/i });

		fireEvent.click(backButton);

		expect(useGameStore.getState().mode).toBe("MENU");
	});

	it("should display upgrade options", () => {
		render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		expect(screen.getByText(/SPEED BOOST/i)).toBeInTheDocument();
		expect(screen.getByText(/HEALTH BOOST/i)).toBeInTheDocument();
		expect(screen.getByText(/DAMAGE BOOST/i)).toBeInTheDocument();
	});

	it("should show upgrade costs", () => {
		const { container } = render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		// Should display upgrade costs in upgrade items
		const upgradeItems = container.querySelectorAll(".upgrade-item button");
		expect(upgradeItems.length).toBe(3);
		expect(upgradeItems[0].textContent).toContain(UPGRADE_COSTS.speed.toString());
	});

	it("should buy speed upgrade when clicked", () => {
		const { container } = render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		// Get the first upgrade button (speed)
		const upgradeItems = container.querySelectorAll(".upgrade-item button");
		const speedButton = upgradeItems[0];
		fireEvent.click(speedButton);

		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
	});

	it("should deduct coins after purchase", () => {
		const initialCoins = useGameStore.getState().saveData.coins;
		const { container } = render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		// Get the first upgrade button (speed)
		const upgradeItems = container.querySelectorAll(".upgrade-item button");
		const speedButton = upgradeItems[0];
		fireEvent.click(speedButton);

		expect(useGameStore.getState().saveData.coins).toBeLessThan(initialCoins);
	});

	it("should disable purchase when insufficient funds", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				coins: 10, // Not enough for any upgrade
			},
		});

		const { container } = render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		// All upgrade buttons should be disabled
		const upgradeItems = container.querySelectorAll(".upgrade-item button");
		expect(upgradeItems[0]).toBeDisabled();
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
		// PLATOON tab is active by default, should show character names
		expect(screen.getByText("GEN. WHISKERS")).toBeInTheDocument();
	});

	it("should show character prices", () => {
		render(<Canteen />);
		// Click on a locked character to see its price
		const whiskersButton = screen.getByRole("button", { name: "GEN. WHISKERS" });
		fireEvent.click(whiskersButton);

		// Price should be shown in requisition button
		expect(screen.getByText(/REQUISITION:/)).toBeInTheDocument();
	});

	it("should unlock character when purchased", () => {
		render(<Canteen />);
		// Select Whiskers first
		const whiskersButton = screen.getByRole("button", { name: "GEN. WHISKERS" });
		fireEvent.click(whiskersButton);

		// Now click the purchase button
		const purchaseButton = screen.getByRole("button", { name: /REQUISITION:/i });
		fireEvent.click(purchaseButton);

		expect(useGameStore.getState().saveData.unlockedCharacters).toContain("whiskers");
	});
});

describe("Canteen - Upgrade Levels", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 5000,
				unlockedWeapons: ["service-pistol"],
				upgrades: {
					speedBoost: 2,
					healthBoost: 1,
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

	it("should display upgrade levels", () => {
		render(<Canteen />);
		// Click on UPGRADES tab first
		const upgradesTab = screen.getByRole("button", { name: /UPGRADES/i });
		fireEvent.click(upgradesTab);

		// Should show upgrade levels
		expect(screen.getByText(/SPEED BOOST \(Lvl 2\)/)).toBeInTheDocument();
		expect(screen.getByText(/HEALTH BOOST \(Lvl 1\)/)).toBeInTheDocument();
		expect(screen.getByText(/DAMAGE BOOST \(Lvl 0\)/)).toBeInTheDocument();
	});

	it("should show tabs for navigation", () => {
		render(<Canteen />);
		expect(screen.getByRole("button", { name: "PLATOON" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "UPGRADES" })).toBeInTheDocument();
	});
});
