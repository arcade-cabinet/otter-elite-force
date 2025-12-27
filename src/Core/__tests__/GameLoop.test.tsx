/**
 * GameLoop Component Tests
 */

import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useGameStore } from "../../stores/gameStore";

// Mock React Three Fiber
vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn((callback) => {
		// Simulate a single frame
		const mockState = {
			clock: { elapsedTime: 1.0 },
		};
		callback(mockState, 0.016);
	}),
}));

describe("GameLoop", () => {
	beforeEach(() => {
		useGameStore.setState({ mode: "GAME" });
	});

	it("should render without error", async () => {
		const { GameLoop } = await import("../GameLoop");
		expect(() => {
			render(<GameLoop />);
		}).not.toThrow();
	});

	it("should call onUpdate callback in GAME mode", async () => {
		const { GameLoop } = await import("../GameLoop");
		const onUpdate = vi.fn();

		render(<GameLoop onUpdate={onUpdate} />);

		expect(onUpdate).toHaveBeenCalled();
	});

	it("should pass delta and elapsed time to onUpdate", async () => {
		const { GameLoop } = await import("../GameLoop");
		const onUpdate = vi.fn();

		render(<GameLoop onUpdate={onUpdate} />);

		expect(onUpdate).toHaveBeenCalledWith(0.016, 1.0);
	});

	it("should not call onUpdate when not in GAME mode", async () => {
		useGameStore.setState({ mode: "MENU" });

		// Re-import to get fresh mock
		vi.resetModules();
		vi.mock("@react-three/fiber", () => ({
			useFrame: vi.fn((callback) => {
				const mockState = { clock: { elapsedTime: 1.0 } };
				callback(mockState, 0.016);
			}),
		}));

		const { GameLoop } = await import("../GameLoop");
		const onUpdate = vi.fn();

		render(<GameLoop onUpdate={onUpdate} />);

		// onUpdate should not be called because mode is MENU
		// The actual check happens in the component
		expect(onUpdate).not.toHaveBeenCalled();
	});

	it("should return null (no DOM output)", async () => {
		const { GameLoop } = await import("../GameLoop");
		const { container } = render(<GameLoop />);

		expect(container.innerHTML).toBe("");
	});
});
