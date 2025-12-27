import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { useGameStore } from "./stores/gameStore";

// Mock CSS imports
vi.mock("./styles/main.css", () => ({}));

describe("App", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "MENU",
			health: 100,
			maxHealth: 100,
			selectedCharacterId: "bubbles",
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("renders without crashing", () => {
		render(<App />);
	});

	it("should render menu when mode is MENU", () => {
		useGameStore.setState({ mode: "MENU" });
		render(<App />);
		expect(screen.getByText("OTTER")).toBeInTheDocument();
		expect(screen.getByText("ELITE FORCE")).toBeInTheDocument();
	});

	it("should render canteen when mode is CANTEEN", () => {
		useGameStore.setState({ mode: "CANTEEN" });
		render(<App />);
		expect(screen.getByText(/CANTEEN|ARMORY|SHOP/i)).toBeInTheDocument();
	});

	it("should render cutscene when mode is CUTSCENE", () => {
		useGameStore.setState({ mode: "CUTSCENE" });
		render(<App />);
		// Cutscene should have some narrative content
		expect(screen.getByText(/BRIEFING|MISSION|INTEL/i)).toBeInTheDocument();
	});

	it("should render game over screen when mode is GAMEOVER", () => {
		useGameStore.setState({ mode: "GAMEOVER" });
		render(<App />);
		expect(screen.getByText(/MISSION|COMPLETE|OVER|VICTORY|DEFEAT/i)).toBeInTheDocument();
	});

	it("should have correct title structure", () => {
		render(<App />);
		const titleElements = screen.getAllByRole("heading");
		expect(titleElements.length).toBeGreaterThan(0);
	});

	it("should display UI layer", () => {
		render(<App />);
		const uiLayer = document.querySelector(".ui-layer, #ui-layer, [class*='ui']");
		expect(uiLayer).toBeInTheDocument();
	});
});

describe("App - State Integration", () => {
	afterEach(() => {
		cleanup();
	});

	it("should respond to mode changes", () => {
		const { rerender } = render(<App />);
		expect(screen.getByText("OTTER")).toBeInTheDocument();

		useGameStore.setState({ mode: "CANTEEN" });
		rerender(<App />);
		expect(screen.getByText(/CANTEEN|ARMORY|SHOP/i)).toBeInTheDocument();
	});

	it("should maintain state across rerenders", () => {
		useGameStore.setState({
			selectedCharacterId: "whiskers",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 9999,
			},
		});

		const { rerender } = render(<App />);
		rerender(<App />);

		expect(useGameStore.getState().selectedCharacterId).toBe("whiskers");
		expect(useGameStore.getState().saveData.coins).toBe(9999);
	});
});
