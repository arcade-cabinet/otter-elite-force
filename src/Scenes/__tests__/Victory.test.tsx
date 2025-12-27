/**
 * Victory Component Tests
 *
 * Tests the victory/game over screen including:
 * - Stats display
 * - XP gained
 * - Return to menu functionality
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { Victory } from "../Victory";

// Mock CSS
vi.mock("../../styles/main.css", () => ({}));

describe("Victory", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "GAMEOVER",
			kills: 10,
			health: 0,
			saveData: {
				...useGameStore.getState().saveData,
				rank: 2,
				xp: 500,
				coins: 1000,
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render victory screen", () => {
		render(<Victory />);
		// Should show mission end screen
		expect(screen.getByText(/MISSION|COMPLETE|OVER|VICTORY|DEFEAT/i)).toBeInTheDocument();
	});

	it("should display kill count", () => {
		render(<Victory />);
		expect(screen.getByText(/10/)).toBeInTheDocument();
	});

	it("should show XP earned", () => {
		render(<Victory />);
		expect(screen.getByText(/XP|EXPERIENCE/i)).toBeInTheDocument();
	});

	it("should display return to menu button", () => {
		render(<Victory />);
		const menuButton = screen.getByRole("button", { name: /MENU|CONTINUE|BACK/i });
		expect(menuButton).toBeInTheDocument();
	});

	it("should navigate to menu when button clicked", () => {
		render(<Victory />);
		const menuButton = screen.getByRole("button", { name: /MENU|CONTINUE|BACK/i });

		fireEvent.click(menuButton);

		expect(useGameStore.getState().mode).toBe("MENU");
	});

	it("should show rank progression", () => {
		render(<Victory />);
		// Should display current rank
		expect(screen.getByText(/CPL|SGT|RANK/i)).toBeInTheDocument();
	});

	it("should display coins earned", () => {
		render(<Victory />);
		expect(screen.getByText(/COINS|CREDITS|\$/i)).toBeInTheDocument();
	});
});

describe("Victory - Mission Statistics", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "GAMEOVER",
			kills: 25,
			health: 50, // Survived with health
			saveData: {
				...useGameStore.getState().saveData,
				spoilsOfWar: {
					creditsEarned: 100,
					clamsHarvested: 5,
					upgradesUnlocked: 2,
				},
				strategicObjectives: {
					siphonsDismantled: 1,
					villagesLiberated: 0,
					gasStockpilesCaptured: 1,
					healersProtected: 0,
					alliesRescued: 2,
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should show survival status", () => {
		render(<Victory />);
		// Should indicate if player survived
		expect(screen.getByText(/SURVIVED|EXTRACTED|VICTORY/i)).toBeInTheDocument();
	});

	it("should display objectives completed", () => {
		render(<Victory />);
		// Should show objective stats
		expect(screen.getByText(/OBJECTIVE|MISSION/i)).toBeInTheDocument();
	});

	it("should show clams harvested", () => {
		render(<Victory />);
		expect(screen.getByText(/CLAM|5/i)).toBeInTheDocument();
	});

	it("should display allies rescued count", () => {
		render(<Victory />);
		expect(screen.getByText(/ALLIES|RESCUED|2/i)).toBeInTheDocument();
	});
});
