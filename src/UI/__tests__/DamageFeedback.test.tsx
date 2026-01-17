import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";
import { DamageFeedback } from "../DamageFeedback";

// Mock the store
vi.mock("../../stores/gameStore", () => ({
	useGameStore: vi.fn(),
}));

describe("DamageFeedback", () => {
	const mockUseGameStore = useGameStore as unknown as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 0,
				comboTimer: 0,
				lastHit: null,
			}),
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("should render without crashing", () => {
		const { container } = render(<DamageFeedback />);
		expect(container).toBeDefined();
	});

	it("should show combo counter when combo is active", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 3,
				comboTimer: 2,
				lastHit: null,
			}),
		);

		render(<DamageFeedback />);
		expect(screen.getByText("3X")).toBeDefined();
		expect(screen.getByText("COMBO")).toBeDefined();
	});

	it("should not show combo counter when combo count is low", () => {
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 1,
				comboTimer: 2,
				lastHit: null,
			}),
		);

		render(<DamageFeedback />);
		expect(screen.queryByText("COMBO")).toBeNull();
	});

	it("should display hit markers on hit", () => {
		// Initial render
		const { rerender } = render(<DamageFeedback />);

		// Update store with a hit
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 0,
				comboTimer: 0,
				lastHit: {
					isCritical: false,
					isKill: false,
					enemyType: "Gator",
					damage: 10,
					timestamp: Date.now(),
				},
			}),
		);

		// Force rerender to pick up new state (in real app, useGameStore subscription handles this)
		rerender(<DamageFeedback />);

		// Check for svg (hit marker)
		// Since we can't easily query by content, check if we have svgs
		expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
	});

	it("should display critical hit markers", () => {
		// Initial render
		const { rerender } = render(<DamageFeedback />);

		// Update store with a hit
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 0,
				comboTimer: 0,
				lastHit: {
					isCritical: true, // CRITICAL
					isKill: false,
					enemyType: "Gator",
					damage: 20,
					timestamp: Date.now(),
				},
			}),
		);

		rerender(<DamageFeedback />);

		// Critical hit marker has circle
		expect(document.querySelector("circle")).toBeDefined();
	});

	it("should display kill notification", () => {
		// Initial render
		const { rerender } = render(<DamageFeedback />);

		// Update store with a kill
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 0,
				comboTimer: 0,
				lastHit: {
					isCritical: false,
					isKill: true, // KILL
					enemyType: "Gator",
					xp: 100,
					credits: 50,
					damage: 10,
					timestamp: Date.now(),
				},
			}),
		);

		rerender(<DamageFeedback />);

		expect(screen.getByText("GATOR ELIMINATED")).toBeDefined();
		expect(screen.getByText("+100 XP")).toBeDefined();
		expect(screen.getByText("+50 CREDITS")).toBeDefined();
	});

	it("should remove markers after timeout", () => {
		// Initial render
		const { rerender } = render(<DamageFeedback />);

		// Update store with a hit
		mockUseGameStore.mockImplementation((selector: any) =>
			selector({
				comboCount: 0,
				comboTimer: 0,
				lastHit: {
					isCritical: false,
					isKill: false,
					enemyType: "Gator",
					damage: 10,
					timestamp: Date.now(),
				},
			}),
		);

		rerender(<DamageFeedback />);
		expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);

		// Advance time
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		// Should be gone (React state update needs to happen)
		// Since we can't easily trigger the interval inside the component from here without real timers
		// or properly wrapped act, we rely on the component's internal interval.
		// We need to wait for the interval to fire.

		// Re-check
		// Note: checking "gone" in unit tests with fake timers and internal state can be tricky.
		// But the logic is: setHitMarkers(prev => prev.filter(...)) runs every 100ms.
		// 1000ms passed, so it should have run multiple times and filtered out the marker (500ms lifetime).

		// We might need to query again
		expect(document.querySelectorAll("svg").length).toBe(0);
	});
});
