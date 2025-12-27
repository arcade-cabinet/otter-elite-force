/**
 * MainMenu Component Tests
 *
 * Tests the game loader interface including:
 * - New Game / Continue buttons (NOT level select)
 * - Character selection (rescue-based unlocks)
 * - Difficulty modes (escalation only)
 * - Canteen navigation
 * - State management integration
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { MainMenu } from "../MainMenu";

// Mock the CSS import
vi.mock("../../styles/main.css", () => ({}));

// Mock window.confirm for difficulty escalation warnings
const mockConfirm = vi.fn(() => true);
vi.stubGlobal("confirm", mockConfirm);

describe("MainMenu - Game Loader Interface", () => {
	beforeEach(() => {
		// Reset store to clean state (no save data = new game)
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
				discoveredChunks: {}, // No chunks = new game
				territoryScore: 0,
				peacekeepingScore: 0,
			},
		});
		mockConfirm.mockClear();
	});

	afterEach(() => {
		cleanup();
	});

	// ============================================
	// Basic Rendering Tests
	// ============================================

	it("should render the main menu with correct title", () => {
		render(<MainMenu />);
		expect(screen.getByRole("heading", { name: /OTTER/i })).toBeInTheDocument();
		expect(screen.getByText(/DEFEND THE COPPER-SILT REACH/i)).toBeInTheDocument();
	});

	it("should show NEW GAME button when no save data exists", () => {
		render(<MainMenu />);
		const button = screen.getByRole("button", { name: /NEW GAME/i });
		expect(button).toBeInTheDocument();
		// Should NOT show "CONTINUE CAMPAIGN" when no save data
		expect(screen.queryByRole("button", { name: /CONTINUE CAMPAIGN/i })).not.toBeInTheDocument();
	});

	it("should show CONTINUE CAMPAIGN button when save data exists", () => {
		// Add some discovered chunks to simulate a saved game
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {
					"0,0": {
						id: "0,0",
						x: 0,
						z: 0,
						seed: 0,
						terrainType: "RIVER",
						secured: false,
						entities: [],
						decorations: [],
					},
				},
			},
		});

		render(<MainMenu />);
		const continueBtn = screen.getByRole("button", { name: /CONTINUE CAMPAIGN/i });
		expect(continueBtn).toBeInTheDocument();
	});

	// ============================================
	// NO Level Select Tests (Critical Design Check)
	// ============================================

	it("should NOT have level select or mission list", () => {
		render(<MainMenu />);
		// Ensure no level/mission terminology appears
		expect(screen.queryByText(/MISSIONS/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/LEVEL/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/STAGE/i)).not.toBeInTheDocument();
	});

	it("should NOT have multiple mission buttons", () => {
		const { container } = render(<MainMenu />);
		// Ensure no level-card elements exist
		const levelCards = container.querySelectorAll(".level-card");
		expect(levelCards.length).toBe(0);
	});

	// ============================================
	// Navigation Tests
	// ============================================

	it("should navigate to cutscene when NEW GAME clicked", () => {
		render(<MainMenu />);
		const newGameBtn = screen.getByRole("button", { name: /NEW GAME/i });
		fireEvent.click(newGameBtn);
		expect(useGameStore.getState().mode).toBe("CUTSCENE");
	});

	it("should navigate directly to GAME when CONTINUE clicked", () => {
		// Set up save data
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {
					"0,0": {
						id: "0,0",
						x: 0,
						z: 0,
						seed: 0,
						terrainType: "RIVER",
						secured: false,
						entities: [],
						decorations: [],
					},
				},
			},
		});

		render(<MainMenu />);
		const continueBtn = screen.getByRole("button", { name: /CONTINUE CAMPAIGN/i });
		fireEvent.click(continueBtn);
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should navigate to canteen when button clicked", () => {
		render(<MainMenu />);
		const canteenBtn = screen.getByRole("button", { name: /VISIT CANTEEN/i });
		fireEvent.click(canteenBtn);
		expect(useGameStore.getState().mode).toBe("CANTEEN");
	});

	// ============================================
	// Character Selection Tests
	// ============================================

	it("should display character selection grid", () => {
		const { container } = render(<MainMenu />);
		const charCards = container.querySelectorAll(".char-card");
		expect(charCards.length).toBeGreaterThan(0);
	});

	it("should show unlocked characters as selectable", () => {
		const { container } = render(<MainMenu />);
		const unlockedCards = container.querySelectorAll(".char-card.unlocked");
		expect(unlockedCards.length).toBeGreaterThan(0);
		expect(unlockedCards[0]).not.toBeDisabled();
	});

	it("should show locked characters with rescue hint", () => {
		render(<MainMenu />);
		// Locked characters should show "RESCUE TO UNLOCK"
		expect(screen.getAllByText(/RESCUE TO UNLOCK/i).length).toBeGreaterThan(0);
	});

	it("should show locked characters as disabled", () => {
		render(<MainMenu />);
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

	// ============================================
	// Difficulty Mode Tests (Escalation Only)
	// ============================================

	it("should display all three difficulty options", () => {
		const { container } = render(<MainMenu />);
		const diffGrid = container.querySelector(".difficulty-grid");
		expect(diffGrid).toBeInTheDocument();
		expect(diffGrid?.textContent).toContain("SUPPORT");
		expect(diffGrid?.textContent).toContain("TACTICAL");
		expect(diffGrid?.textContent).toContain("ELITE");
	});

	it("should upgrade difficulty when higher mode selected", () => {
		render(<MainMenu />);
		const tacticalButton = screen.getByText("TACTICAL").closest("button");
		fireEvent.click(tacticalButton!);
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");
	});

	it("should NOT downgrade difficulty (escalation only)", () => {
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

	it("should highlight current difficulty as selected", () => {
		const { container } = render(<MainMenu />);
		const selectedDiff = container.querySelector(".diff-card.selected");
		expect(selectedDiff).toBeInTheDocument();
		expect(selectedDiff?.textContent).toContain("SUPPORT");
	});

	it("should show warning when upgrading to TACTICAL", () => {
		render(<MainMenu />);
		const tacticalButton = screen.getByText("TACTICAL").closest("button");
		fireEvent.click(tacticalButton!);
		expect(mockConfirm).toHaveBeenCalled();
	});

	it("should show warning when upgrading to ELITE", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
			},
		});

		render(<MainMenu />);
		const eliteButton = screen.getByText("ELITE").closest("button");
		fireEvent.click(eliteButton!);
		expect(mockConfirm).toHaveBeenCalled();
	});

	// ============================================
	// Stats Display Tests
	// ============================================

	it("should display territory score", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				territoryScore: 5,
			},
		});

		render(<MainMenu />);
		expect(screen.getByText("TERRITORY SECURED")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("should display peacekeeping score", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				peacekeepingScore: 100,
			},
		});

		render(<MainMenu />);
		expect(screen.getByText("PEACEKEEPING SCORE")).toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
	});

	it("should display player rank", () => {
		render(<MainMenu />);
		expect(screen.getByText("RANK")).toBeInTheDocument();
		expect(screen.getByText("PUP")).toBeInTheDocument();
	});

	// ============================================
	// LZ Status Tests
	// ============================================

	it("should show LZ secured status when base is established", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				isLZSecured: true,
				baseComponents: [{ id: "test", type: "FLOOR", position: [0, 0, 0], rotation: [0, 0, 0] }],
			},
		});

		render(<MainMenu />);
		expect(screen.getByText(/LZ SECURED/i)).toBeInTheDocument();
	});

	// ============================================
	// Reset Data Tests
	// ============================================

	it("should have reset data button", () => {
		render(<MainMenu />);
		const resetBtn = screen.getByRole("button", { name: /RESET ALL DATA/i });
		expect(resetBtn).toBeInTheDocument();
	});
});

describe("MainMenu - Open World Design Compliance", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "MENU",
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
				discoveredChunks: {},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should emphasize rescue-based character unlocks", () => {
		render(<MainMenu />);
		expect(screen.getByText(/Rescue allies in the field to unlock/i)).toBeInTheDocument();
	});

	it("should show escalation-only difficulty warning", () => {
		render(<MainMenu />);
		expect(screen.getByText(/can be increased but never decreased/i)).toBeInTheDocument();
	});

	it("should show subtitle about defending the Reach", () => {
		render(<MainMenu />);
		expect(screen.getByText(/COPPER-SILT REACH/i)).toBeInTheDocument();
	});
});
