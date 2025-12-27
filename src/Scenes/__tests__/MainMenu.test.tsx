/**
 * MainMenu Component Tests
 *
 * Tests the main menu UI including:
 * - Character selection
 * - Difficulty modes
 * - Navigation buttons
 * - State management integration
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { MainMenu } from "../MainMenu";

// Mock the CSS import
vi.mock("../../styles/main.css", () => ({}));

describe("MainMenu", () => {
	beforeEach(() => {
		// Reset store to clean state
		useGameStore.setState({
			mode: "MENU",
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				rank: 0,
				xp: 0,
				coins: 500,
				unlockedCharacters: ["bubbles"],
				difficultyMode: "SUPPORT",
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render the main menu", () => {
		render(<MainMenu />);
		expect(screen.getByText("OTTER")).toBeInTheDocument();
		expect(screen.getByText("ELITE FORCE")).toBeInTheDocument();
	});

	it("should show START CAMPAIGN button", () => {
		render(<MainMenu />);
		const button = screen.getByRole("button", { name: /START CAMPAIGN/i });
		expect(button).toBeInTheDocument();
	});

	it("should show VISIT CANTEEN button", () => {
		render(<MainMenu />);
		const button = screen.getByRole("button", { name: /VISIT CANTEEN/i });
		expect(button).toBeInTheDocument();
	});

	it("should display character selection cards", () => {
		render(<MainMenu />);
		// Bubbles should be visible as the default character
		expect(screen.getByText("SGT. BUBBLES")).toBeInTheDocument();
	});

	it("should show unlocked characters as selectable", () => {
		render(<MainMenu />);
		const bubblesCard = screen.getByText("SGT. BUBBLES").closest("button");
		expect(bubblesCard).not.toBeDisabled();
	});

	it("should show locked characters as disabled", () => {
		render(<MainMenu />);
		// Whiskers should be locked by default
		const whiskersCard = screen.getByText("GEN. WHISKERS").closest("button");
		expect(whiskersCard).toBeDisabled();
	});

	it("should select character when clicked", () => {
		// Unlock whiskers first
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				unlockedCharacters: ["bubbles", "whiskers"],
			},
		});

		render(<MainMenu />);
		const whiskersCard = screen.getByText("GEN. WHISKERS").closest("button");

		fireEvent.click(whiskersCard!);

		expect(useGameStore.getState().selectedCharacterId).toBe("whiskers");
	});

	it("should display difficulty options", () => {
		render(<MainMenu />);
		expect(screen.getByText("SUPPORT")).toBeInTheDocument();
		expect(screen.getByText("TACTICAL")).toBeInTheDocument();
		expect(screen.getByText("ELITE")).toBeInTheDocument();
	});

	it("should navigate to cutscene when campaign started", () => {
		render(<MainMenu />);
		const campaignButton = screen.getByRole("button", { name: /START CAMPAIGN/i });

		fireEvent.click(campaignButton);

		expect(useGameStore.getState().mode).toBe("CUTSCENE");
	});

	it("should navigate to canteen when button clicked", () => {
		render(<MainMenu />);
		const canteenButton = screen.getByRole("button", { name: /VISIT CANTEEN/i });

		fireEvent.click(canteenButton);

		expect(useGameStore.getState().mode).toBe("CANTEEN");
	});

	it("should display player rank", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				rank: 3,
			},
		});

		render(<MainMenu />);
		// The rank display should be visible
		const rankElement = screen.getByText(/CPL|SGT|LT|CAPT|MAJ|COL|GEN/i);
		expect(rankElement).toBeInTheDocument();
	});

	it("should display coin count", () => {
		render(<MainMenu />);
		expect(screen.getByText(/500/)).toBeInTheDocument();
	});

	it("should highlight selected character", () => {
		render(<MainMenu />);
		const bubblesCard = screen.getByText("SGT. BUBBLES").closest("button");
		expect(bubblesCard).toHaveClass("selected");
	});

	it("should show character weapon info", () => {
		render(<MainMenu />);
		// Service pistol is bubbles' default weapon
		expect(screen.getByText(/service pistol/i)).toBeInTheDocument();
	});
});

describe("MainMenu - Difficulty Selection", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "MENU",
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should upgrade difficulty when higher mode selected", () => {
		render(<MainMenu />);
		const tacticalButton = screen.getByText("TACTICAL").closest("button");

		fireEvent.click(tacticalButton!);

		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");
	});

	it("should not downgrade difficulty", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
			},
		});

		render(<MainMenu />);
		const supportButton = screen.getByText("SUPPORT").closest("button");

		fireEvent.click(supportButton!);

		// Should remain TACTICAL, not downgrade to SUPPORT
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");
	});

	it("should highlight current difficulty", () => {
		render(<MainMenu />);
		const supportButton = screen.getByText("SUPPORT").closest("button");
		expect(supportButton).toHaveClass("selected");
	});
});
