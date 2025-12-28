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
		// Should show mission success header
		expect(screen.getByText("MISSION SUCCESSFUL")).toBeInTheDocument();
	});

	it("should display kill count", () => {
		render(<Victory />);
		expect(screen.getByText("ELIMINATIONS:")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("should display stats box", () => {
		render(<Victory />);
		const { container } = render(<Victory />);
		const statsBox = container.querySelector(".stats-box");
		expect(statsBox).toBeInTheDocument();
	});

	it("should display proceed button", () => {
		render(<Victory />);
		const proceedButton = screen.getByRole("button", { name: /PROCEED TO FOB/i });
		expect(proceedButton).toBeInTheDocument();
	});

	it("should navigate to canteen when button clicked", () => {
		render(<Victory />);
		const proceedButton = screen.getByRole("button", { name: /PROCEED TO FOB/i });

		fireEvent.click(proceedButton);

		expect(useGameStore.getState().mode).toBe("CANTEEN");
	});

	it("should show peacekeeping score", () => {
		render(<Victory />);
		expect(screen.getByText("PEACEKEEPING SCORE:")).toBeInTheDocument();
	});

	it("should display credits earned", () => {
		render(<Victory />);
		expect(screen.getByText(/SUPPLY CREDITS EARNED/i)).toBeInTheDocument();
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
				peacekeepingScore: 15,
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should display mission successful title", () => {
		render(<Victory />);
		expect(screen.getByText("MISSION SUCCESSFUL")).toBeInTheDocument();
	});

	it("should display eliminations count", () => {
		render(<Victory />);
		expect(screen.getByText("ELIMINATIONS:")).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
	});

	it("should show clams harvested count", () => {
		render(<Victory />);
		expect(screen.getByText("CLAMS HARVESTED:")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("should display peacekeeping score", () => {
		render(<Victory />);
		expect(screen.getByText("PEACEKEEPING SCORE:")).toBeInTheDocument();
		expect(screen.getByText("15")).toBeInTheDocument();
	});
});
