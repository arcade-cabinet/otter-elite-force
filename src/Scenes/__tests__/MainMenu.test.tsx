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
		// H1 contains OTTER<br />ELITE FORCE - use regex for multi-element text
		expect(screen.getByRole("heading", { name: /OTTER/i })).toBeInTheDocument();
		expect(screen.getByText("DEFEND THE RIVER")).toBeInTheDocument();
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
		// Character grid should have character cards
		const { container } = render(<MainMenu />);
		const charCards = container.querySelectorAll(".char-card");
		expect(charCards.length).toBeGreaterThan(0);
	});

	it("should show unlocked characters as selectable", () => {
		render(<MainMenu />);
		// Find unlocked character buttons (not disabled)
		const { container } = render(<MainMenu />);
		const unlockedCards = container.querySelectorAll(".char-card.unlocked");
		expect(unlockedCards.length).toBeGreaterThan(0);
		expect(unlockedCards[0]).not.toBeDisabled();
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
		const { container } = render(<MainMenu />);
		// Check difficulty grid has all three options
		const diffGrid = container.querySelector(".difficulty-grid");
		expect(diffGrid).toBeInTheDocument();
		expect(diffGrid?.textContent).toContain("SUPPORT");
		expect(diffGrid?.textContent).toContain("TACTICAL");
		expect(diffGrid?.textContent).toContain("ELITE");
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
				rank: 0, // First rank
			},
		});

		render(<MainMenu />);
		// Check that RANK label and value are present
		expect(screen.getByText("RANK")).toBeInTheDocument();
		// Check stat-val class elements exist
		const { container } = render(<MainMenu />);
		const rankRow = container.querySelector(".stat-row");
		expect(rankRow).toBeInTheDocument();
	});

	it("should display medals count", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				medals: 5,
			},
		});
		render(<MainMenu />);
		expect(screen.getByText("MEDALS")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("should highlight selected character", () => {
		const { container } = render(<MainMenu />);
		// Selected character should have "selected" class
		const selectedCard = container.querySelector(".char-card.selected");
		expect(selectedCard).toBeInTheDocument();
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
		const { container } = render(<MainMenu />);
		// Current difficulty should have "selected" class
		const selectedDiff = container.querySelector(".diff-card.selected");
		expect(selectedDiff).toBeInTheDocument();
		expect(selectedDiff?.textContent).toBe("SUPPORT");
	});
});
