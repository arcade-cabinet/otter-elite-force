import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { useGameStore } from "./stores/gameStore";

// Mock CSS imports
vi.mock("./styles/main.css", () => ({}));

describe("App", () => {
	beforeEach(() => {
		act(() => {
			useGameStore.setState({
				mode: "MENU",
				health: 100,
				maxHealth: 100,
				selectedCharacterId: "bubbles",
			});
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
		// Menu has the title in an h1
		expect(screen.getByRole("heading", { name: /OTTER/i })).toBeInTheDocument();
	});

	it("should render canteen when mode is CANTEEN", () => {
		act(() => {
			useGameStore.setState({ mode: "CANTEEN" });
		});
		render(<App />);
		// Canteen has "FORWARD OPERATING BASE" header
		expect(screen.getByText("FORWARD OPERATING BASE")).toBeInTheDocument();
	});

	it("should render cutscene when mode is CUTSCENE", () => {
		useGameStore.setState({ mode: "CUTSCENE" });
		render(<App />);
		// Cutscene has dialogue box with character names
		expect(screen.getByText("GEN. WHISKERS")).toBeInTheDocument();
	});

	it("should have app container", () => {
		const { container } = render(<App />);
		expect(container.querySelector(".app")).toBeInTheDocument();
	});

	it("should have correct title structure", () => {
		render(<App />);
		const titleElements = screen.getAllByRole("heading");
		expect(titleElements.length).toBeGreaterThan(0);
	});

	it("should display scanlines overlay", () => {
		const { container } = render(<App />);
		expect(container.querySelector(".scanlines")).toBeInTheDocument();
	});
});

describe("App - State Integration", () => {
	beforeEach(() => {
		act(() => {
			useGameStore.setState({
				mode: "MENU",
				selectedCharacterId: "bubbles",
			});
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should respond to mode changes", () => {
		const { rerender } = render(<App />);
		expect(screen.getByRole("heading", { name: /OTTER/i })).toBeInTheDocument();

		act(() => {
			useGameStore.setState({ mode: "CANTEEN" });
		});
		rerender(<App />);
		expect(screen.getByText("FORWARD OPERATING BASE")).toBeInTheDocument();
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
