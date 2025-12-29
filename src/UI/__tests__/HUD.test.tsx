/**
 * HUD Component Tests
 *
 * Tests the heads-up display using React Testing Library
 * Focus on user-visible behavior and interactions
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { HUD } from "../HUD";

// Mock audio engine - it requires user gesture to initialize
vi.mock("../../Core/AudioEngine", () => ({
	audioEngine: {
		playSFX: vi.fn(),
		init: vi.fn().mockResolvedValue(undefined),
		isReady: () => true,
	},
}));

// Mock input system - it requires DOM elements
vi.mock("../../Core/InputSystem", () => ({
	inputSystem: {
		setJump: vi.fn(),
		setGrip: vi.fn(),
		init: vi.fn(),
		destroy: vi.fn(),
		getState: () => ({ move: { x: 0, y: 0, active: false } }),
	},
}));

describe("HUD Component", () => {
	beforeEach(() => {
		// Reset store to known state
		useGameStore.setState({
			mode: "GAME",
			health: 100,
			maxHealth: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			isBuildMode: false,
			isZoomed: false,
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
		vi.clearAllMocks();
	});

	describe("Rendering", () => {
		it("renders HUD container", () => {
			const { container } = render(<HUD />);
			expect(container.querySelector(".hud-container")).toBeInTheDocument();
		});

		it("renders health section with label", () => {
			render(<HUD />);
			expect(screen.getByText("INTEGRITY")).toBeInTheDocument();
		});

		it("renders kill counter with label", () => {
			render(<HUD />);
			expect(screen.getByText("ELIMINATIONS")).toBeInTheDocument();
		});

		it("renders joystick zones for mobile controls", () => {
			const { container } = render(<HUD />);
			expect(container.querySelector("#joystick-move")).toBeInTheDocument();
			expect(container.querySelector("#joystick-look")).toBeInTheDocument();
		});
	});

	describe("Health Display", () => {
		it("displays health bar at correct width for full health", () => {
			useGameStore.setState({ health: 100, maxHealth: 100 });
			const { container } = render(<HUD />);

			const healthFill = container.querySelector(".hud-hp-fill") as HTMLElement;
			expect(healthFill).toBeInTheDocument();
			expect(healthFill.style.width).toBe("100%");
		});

		it("displays health bar at correct width for partial health", () => {
			useGameStore.setState({ health: 75, maxHealth: 100 });
			const { container } = render(<HUD />);

			const healthFill = container.querySelector(".hud-hp-fill") as HTMLElement;
			expect(healthFill.style.width).toBe("75%");
		});

		it("displays health bar at correct width for low health", () => {
			useGameStore.setState({ health: 25, maxHealth: 100 });
			const { container } = render(<HUD />);

			const healthFill = container.querySelector(".hud-hp-fill") as HTMLElement;
			expect(healthFill.style.width).toBe("25%");
		});

		it("displays health bar at 0% when dead", () => {
			useGameStore.setState({ health: 0, maxHealth: 100 });
			const { container } = render(<HUD />);

			const healthFill = container.querySelector(".hud-hp-fill") as HTMLElement;
			expect(healthFill.style.width).toBe("0%");
		});
	});

	describe("Kill Counter", () => {
		it("displays zero kills initially", () => {
			useGameStore.setState({ kills: 0 });
			render(<HUD />);
			expect(screen.getByText("0")).toBeInTheDocument();
		});

		it("displays correct kill count", () => {
			useGameStore.setState({ kills: 15 });
			render(<HUD />);
			expect(screen.getByText("15")).toBeInTheDocument();
		});

		it("displays high kill counts correctly", () => {
			useGameStore.setState({ kills: 999 });
			render(<HUD />);
			expect(screen.getByText("999")).toBeInTheDocument();
		});
	});

	describe("Coordinates Display", () => {
		it("displays player coordinates", () => {
			useGameStore.setState({ playerPos: [100, 0, 200] });
			render(<HUD />);
			expect(screen.getByText("COORD: 100, 200")).toBeInTheDocument();
		});

		it("floors coordinate values", () => {
			useGameStore.setState({ playerPos: [10.7, 0, 20.3] });
			render(<HUD />);
			expect(screen.getByText("COORD: 10, 20")).toBeInTheDocument();
		});

		it("displays negative coordinates", () => {
			useGameStore.setState({ playerPos: [-50, 0, -75] });
			render(<HUD />);
			expect(screen.getByText("COORD: -50, -75")).toBeInTheDocument();
		});
	});

	describe("Territory and Peacekeeping Scores", () => {
		it("displays territory score when greater than 0", () => {
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					territoryScore: 10,
					discoveredChunks: { "0,0": { id: "0,0" } as any },
				},
			});
			render(<HUD />);
			expect(screen.getByText(/TERRITORY: 10 \/ 1/)).toBeInTheDocument();
		});

		it("hides territory score when 0", () => {
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					territoryScore: 0,
					discoveredChunks: {},
				},
			});

			render(<HUD />);
			expect(screen.queryByText(/TERRITORY:/)).not.toBeInTheDocument();
		});

		it("displays peacekeeping score when greater than 0", () => {
			render(<HUD />);
			expect(screen.getByText("PEACEKEEPING: 5")).toBeInTheDocument();
		});

		it("updates territory score when changed", () => {
			const { rerender } = render(<HUD />);

			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					territoryScore: 25,
					discoveredChunks: { "0,0": {} as any },
				},
			});

			rerender(<HUD />);
			expect(screen.getByText(/TERRITORY: 25 \/ 1/)).toBeInTheDocument();
		});
	});

	describe("Action Buttons", () => {
		it("renders JUMP button", () => {
			render(<HUD />);
			expect(screen.getByRole("button", { name: "JUMP" })).toBeInTheDocument();
		});

		it("renders GRIP button", () => {
			render(<HUD />);
			expect(screen.getByRole("button", { name: "GRIP" })).toBeInTheDocument();
		});

		it("renders SCOPE button", () => {
			render(<HUD />);
			expect(screen.getByRole("button", { name: "SCOPE" })).toBeInTheDocument();
		});

		it("SCOPE button toggles zoom state", () => {
			render(<HUD />);
			const scopeBtn = screen.getByRole("button", { name: "SCOPE" });

			expect(useGameStore.getState().isZoomed).toBe(false);
			fireEvent.click(scopeBtn);
			expect(useGameStore.getState().isZoomed).toBe(true);
			fireEvent.click(scopeBtn);
			expect(useGameStore.getState().isZoomed).toBe(false);
		});

		it("JUMP button calls inputSystem.setJump on pointer events", async () => {
			const { inputSystem } = await import("../../Core/InputSystem");
			render(<HUD />);
			const jumpBtn = screen.getByRole("button", { name: "JUMP" });

			fireEvent.pointerDown(jumpBtn);
			expect(inputSystem.setJump).toHaveBeenCalledWith(true);

			fireEvent.pointerUp(jumpBtn);
			expect(inputSystem.setJump).toHaveBeenCalledWith(false);
		});

		it("GRIP button calls inputSystem.setGrip on pointer events", async () => {
			const { inputSystem } = await import("../../Core/InputSystem");
			render(<HUD />);
			const gripBtn = screen.getByRole("button", { name: "GRIP" });

			fireEvent.pointerDown(gripBtn);
			expect(inputSystem.setGrip).toHaveBeenCalledWith(true);

			fireEvent.pointerUp(gripBtn);
			expect(inputSystem.setGrip).toHaveBeenCalledWith(false);
		});
	});

	describe("Build Mode", () => {
		it("shows BUILD button when LZ is secured", () => {
			render(<HUD />);
			expect(screen.getByRole("button", { name: "BUILD" })).toBeInTheDocument();
		});

		it("hides BUILD button when LZ is not secured", () => {
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					isLZSecured: false,
				},
			});
			render(<HUD />);
			expect(screen.queryByRole("button", { name: "BUILD" })).not.toBeInTheDocument();
		});

		it("BUILD button toggles build mode", () => {
			render(<HUD />);
			const buildBtn = screen.getByRole("button", { name: "BUILD" });

			expect(useGameStore.getState().isBuildMode).toBe(false);
			fireEvent.click(buildBtn);
			expect(useGameStore.getState().isBuildMode).toBe(true);
			fireEvent.click(buildBtn);
			expect(useGameStore.getState().isBuildMode).toBe(false);
		});

		it("shows build options when in build mode", () => {
			useGameStore.setState({ isBuildMode: true });
			render(<HUD />);

			expect(screen.getByRole("button", { name: "FLOOR" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "WALL" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "ROOF" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "STILT" })).toBeInTheDocument();
			expect(screen.getByText(/PLACE/)).toBeInTheDocument();
		});

		it("hides build options when not in build mode", () => {
			useGameStore.setState({ isBuildMode: false });
			render(<HUD />);

			expect(screen.queryByRole("button", { name: "FLOOR" })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: "WALL" })).not.toBeInTheDocument();
		});

		it("BUILD button has active class when build mode is on", () => {
			useGameStore.setState({ isBuildMode: true });
			render(<HUD />);

			const buildBtn = screen.getByRole("button", { name: "BUILD" });
			expect(buildBtn).toHaveClass("active");
		});
	});

	describe("Difficulty-Specific Features", () => {
		it("shows DROP button in SUPPORT mode", () => {
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					difficultyMode: "SUPPORT",
				},
			});
			render(<HUD />);
			expect(screen.getByRole("button", { name: "DROP" })).toBeInTheDocument();
		});

		it("DROP button calls audioEngine.playSFX on click", async () => {
			const { audioEngine } = await import("../../Core/AudioEngine");
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					difficultyMode: "SUPPORT",
				},
			});
			render(<HUD />);
			const dropBtn = screen.getByRole("button", { name: "DROP" });

			fireEvent.click(dropBtn);
			expect(audioEngine.playSFX).toHaveBeenCalledWith("pickup");
		});

		it("shows DROP button in TACTICAL mode when at LZ", () => {
			useGameStore.setState({
				playerPos: [0, 0, 0],
				saveData: {
					...useGameStore.getState().saveData,
					difficultyMode: "TACTICAL",
				},
			});
			render(<HUD />);
			expect(screen.getByRole("button", { name: "DROP" })).toBeInTheDocument();
		});

		it("hides DROP button in TACTICAL mode when away from LZ", () => {
			useGameStore.setState({
				playerPos: [100, 0, 100],
				saveData: {
					...useGameStore.getState().saveData,
					difficultyMode: "TACTICAL",
				},
			});
			render(<HUD />);
			expect(screen.queryByRole("button", { name: "DROP" })).not.toBeInTheDocument();
		});

		it("hides DROP button in ELITE mode when away from LZ", () => {
			useGameStore.setState({
				playerPos: [100, 0, 100],
				saveData: {
					...useGameStore.getState().saveData,
					difficultyMode: "ELITE",
				},
			});
			render(<HUD />);
			expect(screen.queryByRole("button", { name: "DROP" })).not.toBeInTheDocument();
		});
	});

	describe("Build UI Buttons", () => {
		beforeEach(() => {
			useGameStore.setState({ isBuildMode: true });
		});

		it("clicking FLOOR button selects it", () => {
			render(<HUD />);
			const floorBtn = screen.getByRole("button", { name: "FLOOR" });
			fireEvent.click(floorBtn);
			expect(useGameStore.getState().selectedComponentType).toBe("FLOOR");
		});

		it("clicking WALL button selects it", () => {
			render(<HUD />);
			const wallBtn = screen.getByRole("button", { name: "WALL" });
			fireEvent.click(wallBtn);
			expect(useGameStore.getState().selectedComponentType).toBe("WALL");
		});

		it("clicking PLACE button calls placeComponent", () => {
			useGameStore.setState({ selectedComponentType: "FLOOR" });
			const spy = vi.spyOn(useGameStore.getState(), "placeComponent");
			render(<HUD />);
			const placeBtn = screen.getByText(/PLACE FLOOR/);
			fireEvent.click(placeBtn);
			expect(spy).toHaveBeenCalled();
		});
	});

	describe("Mud Overlay", () => {
		it("renders mud overlay with opacity 0 when clean", () => {
			useGameStore.setState({ mudAmount: 0 });
			const { container } = render(<HUD />);

			const mudOverlay = container.querySelector(".mud-overlay") as HTMLElement;
			expect(mudOverlay).toBeInTheDocument();
			expect(mudOverlay.style.opacity).toBe("0");
		});

		it("renders mud overlay with correct opacity when muddy", () => {
			useGameStore.setState({ mudAmount: 0.5 });
			const { container } = render(<HUD />);

			const mudOverlay = container.querySelector(".mud-overlay") as HTMLElement;
			expect(mudOverlay.style.opacity).toBe("0.5");
		});

		it("renders mud overlay at full opacity when very muddy", () => {
			useGameStore.setState({ mudAmount: 1 });
			const { container } = render(<HUD />);

			const mudOverlay = container.querySelector(".mud-overlay") as HTMLElement;
			expect(mudOverlay.style.opacity).toBe("1");
		});
	});
});
