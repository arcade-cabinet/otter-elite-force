/**
 * HUD Component Tests
 *
 * Tests the heads-up display including:
 * - Health bar display
 * - Kill counter
 * - Action buttons
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { HUD } from "../HUD";

// Mock CSS
vi.mock("../../styles/main.css", () => ({}));

// Mock the audio engine to prevent initialization issues
vi.mock("../../Core/AudioEngine", () => ({
	audioEngine: {
		playSFX: vi.fn(),
		init: vi.fn(),
	},
}));

// Mock input system
vi.mock("../../Core/InputSystem", () => ({
	inputSystem: {
		setJump: vi.fn(),
		setGrip: vi.fn(),
		init: vi.fn(),
	},
}));

describe("HUD", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "GAME",
			health: 100,
			maxHealth: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			isBuildMode: false,
			playerPos: [0, 0, 0],
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				rank: 2,
				coins: 1500,
				isLZSecured: true,
				difficultyMode: "SUPPORT",
				territoryScore: 10,
				peacekeepingScore: 5,
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render the HUD container", () => {
		render(<HUD />);
		const hud = document.querySelector(".hud-container");
		expect(hud).toBeInTheDocument();
	});

	it("should display health bar", () => {
		render(<HUD />);
		const healthBar = document.querySelector(".hud-hp-bar");
		expect(healthBar).toBeInTheDocument();
	});

	it("should show correct health percentage", () => {
		useGameStore.setState({ health: 75, maxHealth: 100 });
		render(<HUD />);

		const healthFill = document.querySelector(".hud-hp-fill") as HTMLElement;
		expect(healthFill).toBeInTheDocument();
		expect(healthFill.style.width).toBe("75%");
	});

	it("should display kill counter", () => {
		useGameStore.setState({ kills: 5 });
		render(<HUD />);
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("should display territory score", () => {
		render(<HUD />);
		expect(screen.getByText(/TERRITORY SECURED: 10/)).toBeInTheDocument();
	});

	it("should display peacekeeping score", () => {
		render(<HUD />);
		expect(screen.getByText(/PEACEKEEPING: 5/)).toBeInTheDocument();
	});

	it("should display action buttons", () => {
		render(<HUD />);
		expect(screen.getByText("JUMP")).toBeInTheDocument();
		expect(screen.getByText("GRIP")).toBeInTheDocument();
		expect(screen.getByText("SCOPE")).toBeInTheDocument();
	});

	it("should show build button when LZ secured", () => {
		render(<HUD />);
		expect(screen.getByText("BUILD")).toBeInTheDocument();
	});

	it("should hide build button when LZ not secured", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				isLZSecured: false,
			},
		});
		render(<HUD />);
		expect(screen.queryByText("BUILD")).not.toBeInTheDocument();
	});

	it("should show SUPPORT drop button in SUPPORT mode", () => {
		render(<HUD />);
		expect(screen.getByText("DROP")).toBeInTheDocument();
	});

	it("should hide SUPPORT drop button in other modes", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
			},
		});
		render(<HUD />);
		expect(screen.queryByText("DROP")).not.toBeInTheDocument();
	});

	it("should toggle build mode when BUILD clicked", () => {
		render(<HUD />);
		const buildBtn = screen.getByText("BUILD");
		
		fireEvent.click(buildBtn);
		expect(useGameStore.getState().isBuildMode).toBe(true);
		
		fireEvent.click(buildBtn);
		expect(useGameStore.getState().isBuildMode).toBe(false);
	});

	it("should show build UI when in build mode", () => {
		useGameStore.setState({ isBuildMode: true });
		render(<HUD />);
		
		expect(screen.getByText("+FLOOR")).toBeInTheDocument();
		expect(screen.getByText("+WALL")).toBeInTheDocument();
		expect(screen.getByText("+ROOF")).toBeInTheDocument();
		expect(screen.getByText("+STILT")).toBeInTheDocument();
	});

	it("should display player coordinates", () => {
		useGameStore.setState({ playerPos: [25, 0, 50] });
		render(<HUD />);
		expect(screen.getByText(/COORD: 25, 50/)).toBeInTheDocument();
	});

	it("should display mud overlay with correct opacity", () => {
		useGameStore.setState({ mudAmount: 0.5 });
		render(<HUD />);
		
		const mudOverlay = document.querySelector(".mud-overlay") as HTMLElement;
		expect(mudOverlay).toBeInTheDocument();
		expect(mudOverlay.style.opacity).toBe("0.5");
	});
});
