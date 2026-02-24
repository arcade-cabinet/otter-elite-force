/**
 * GameLoop Component Tests
 *
 * Tests the Babylon.js-based game loop that uses scene.onBeforeRenderObservable.
 */

import { act, render } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { GameLoop } from "../GameLoop";

// Mock reactylon to provide a fake scene with controllable onBeforeRenderObservable
jest.mock("reactylon");

// Mock game store
jest.mock("../../stores/gameStore", () => ({
	useGameStore: Object.assign(
		jest.fn((selector: (s: { mode: string; comboTimer: number }) => unknown) =>
			selector({ mode: "GAME", comboTimer: 0 }),
		),
		{
			setState: jest.fn(),
			getState: jest.fn(() => ({ mode: "GAME", comboTimer: 0 })),
		},
	),
}));

// Access the mocked scene + observer from our reactylon mock
function getReactylonMock() {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require("../../test/__mocks__/reactylon") as {
		mockScene: { onBeforeRenderObservable: { add: jest.Mock; remove: jest.Mock } };
		mockObserver: { callback: (() => void) | null };
	};
}

describe("GameLoop", () => {
	const mockUseGameStore = useGameStore as unknown as jest.Mock;
	let mockSetState: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockSetState = jest.fn();
		mockUseGameStore.mockImplementation(
			(selector: (s: { mode: string; comboTimer: number }) => unknown) =>
				selector({ mode: "GAME", comboTimer: 0 }),
		);
		(useGameStore.setState as jest.Mock).mockImplementation(mockSetState);
	});

	it("should render without crashing", () => {
		const { container } = render(<GameLoop />);
		expect(container).toBeDefined();
	});

	it("should register an observer on the Babylon.js scene", () => {
		const { mockScene } = getReactylonMock();
		render(<GameLoop />);
		expect(mockScene.onBeforeRenderObservable.add).toHaveBeenCalled();
	});

	it("should not call onUpdate when not in GAME mode", () => {
		mockUseGameStore.mockImplementation(
			(selector: (s: { mode: string; comboTimer: number }) => unknown) =>
				selector({ mode: "MENU", comboTimer: 0 }),
		);
		const onUpdate = jest.fn();
		const { mockObserver } = getReactylonMock();

		render(<GameLoop onUpdate={onUpdate} />);

		act(() => {
			mockObserver.callback?.();
		});

		expect(onUpdate).not.toHaveBeenCalled();
	});

	it("should call onUpdate when in GAME mode", () => {
		const onUpdate = jest.fn();
		const { mockObserver } = getReactylonMock();

		// Mock performance.now BEFORE render so lastTime initialization gets 1000
		(performance.now as jest.Mock)
			.mockReturnValueOnce(1000) // for lastTime = performance.now() in useEffect
			.mockReturnValueOnce(1100); // for now = performance.now() in callback

		render(<GameLoop onUpdate={onUpdate} />);

		act(() => {
			mockObserver.callback?.();
		});

		expect(onUpdate).toHaveBeenCalled();
	});

	it("should decrement combo timer each frame", () => {
		mockUseGameStore.mockImplementation(
			(selector: (s: { mode: string; comboTimer: number }) => unknown) =>
				selector({ mode: "GAME", comboTimer: 2 }),
		);
		const { mockObserver } = getReactylonMock();

		// Mock BEFORE render: lastTime=0, then callback gets now=100 → 0.1s delta
		(performance.now as jest.Mock)
			.mockReturnValueOnce(0) // for lastTime in useEffect
			.mockReturnValueOnce(100); // for now in callback

		render(<GameLoop />);

		act(() => {
			mockObserver.callback?.();
		});

		expect(mockSetState).toHaveBeenCalledWith(
			expect.objectContaining({ comboTimer: expect.any(Number) }),
		);
	});

	it("should reset combo count when timer expires", () => {
		mockUseGameStore.mockImplementation(
			(selector: (s: { mode: string; comboTimer: number }) => unknown) =>
				selector({ mode: "GAME", comboTimer: 0.05 }),
		);
		const { mockObserver } = getReactylonMock();

		// React 19's scheduler also calls performance.now internally.
		// Use an always-increasing mock (100ms per call) so lastTime→now always has 100ms delta.
		// Any consecutive calls produce rawDelta=0.1s (capped to 0.1s) which exceeds the 0.05s timer.
		let perfTime = 0;
		(performance.now as jest.Mock).mockImplementation(() => {
			perfTime += 100;
			return perfTime;
		});

		render(<GameLoop />);

		act(() => {
			mockObserver.callback?.();
		});

		// Should be called twice: { comboTimer: 0 } then { comboCount: 0 }
		expect(mockSetState).toHaveBeenCalledWith({ comboCount: 0 });
	});

	it("should remove the observer on unmount", () => {
		const { mockScene } = getReactylonMock();
		const { unmount } = render(<GameLoop />);
		unmount();
		expect(mockScene.onBeforeRenderObservable.remove).toHaveBeenCalled();
	});
});
