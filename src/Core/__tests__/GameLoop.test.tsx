import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { GameLoop } from "../GameLoop";

// Mock store
const mockSetState = vi.fn();
vi.mock("../../stores/gameStore", () => ({
	useGameStore: Object.assign(
		vi.fn((selector) => selector({ mode: "GAME", comboTimer: 0 })),
		{ setState: vi.fn() }, // Initial mock, we will override or spy on it
	),
}));

// Capture the callback properly
const mockUseFrame = vi.fn();
vi.mock("@react-three/fiber", () => ({
	useFrame: (cb: any) => mockUseFrame(cb),
}));

describe("GameLoop", () => {
	const mockUseGameStore = useGameStore as unknown as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		// Default state
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({ mode: "GAME", comboTimer: 0 }),
		);

		// Link the external mockSetState to the store's setState
		(useGameStore.setState as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockSetState);
	});

	it("should render without crashing", () => {
		const { container } = render(<GameLoop />);
		expect(container).toBeDefined();
	});

	it("should not update when not in GAME mode", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({ mode: "MENU", comboTimer: 0 }),
		);
		const onUpdate = vi.fn();

		render(<GameLoop onUpdate={onUpdate} />);

		// Get the registered callback
		const frameCallback = mockUseFrame.mock.calls[0][0];
		frameCallback({ clock: { elapsedTime: 10 } }, 0.1);

		expect(onUpdate).not.toHaveBeenCalled();
	});

	it("should update when in GAME mode", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({ mode: "GAME", comboTimer: 0 }),
		);
		const onUpdate = vi.fn();

		render(<GameLoop onUpdate={onUpdate} />);

		const frameCallback = mockUseFrame.mock.calls[0][0];
		frameCallback({ clock: { elapsedTime: 10 } }, 0.1);

		expect(onUpdate).toHaveBeenCalledWith(0.1, 10);
	});

	it("should update combo timer", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({ mode: "GAME", comboTimer: 2 }),
		);

		render(<GameLoop />);

		const frameCallback = mockUseFrame.mock.calls[0][0];
		frameCallback({ clock: { elapsedTime: 10 } }, 0.1);

		expect(mockSetState).toHaveBeenCalledWith({ comboTimer: 1.9 });
	});

	it("should reset combo count when timer expires", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({ mode: "GAME", comboTimer: 0.05 }),
		);

		render(<GameLoop />);

		const frameCallback = mockUseFrame.mock.calls[0][0];
		frameCallback({ clock: { elapsedTime: 10 } }, 0.1);

		// Timer should become 0
		expect(mockSetState).toHaveBeenCalledWith({ comboTimer: 0 });
		// Combo count should reset
		expect(mockSetState).toHaveBeenCalledWith({ comboCount: 0 });
	});
});
