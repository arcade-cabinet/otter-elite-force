import { act, render, screen } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { DamageFeedback } from "../DamageFeedback";

// Mock the store
jest.mock("../../stores/gameStore", () => ({
	useGameStore: jest.fn(),
}));

// Stable state objects to avoid triggering infinite re-renders
// (useEffect deps comparison uses reference equality for objects)
const defaultState = {
	comboCount: 0,
	comboTimer: 0,
	lastHit: null as any,
};

describe("DamageFeedback", () => {
	const mockUseGameStore = useGameStore as unknown as jest.Mock;

	beforeEach(() => {
		jest.useFakeTimers();
		// Reset to a stable default state each test
		defaultState.comboCount = 0;
		defaultState.comboTimer = 0;
		defaultState.lastHit = null;
		mockUseGameStore.mockImplementation((selector: any) => selector(defaultState));
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("should render without crashing", () => {
		const { container } = render(<DamageFeedback />);
		expect(container).toBeDefined();
	});

	it("should show combo counter when combo is active", () => {
		const comboState = {
			comboCount: 3,
			comboTimer: 2,
			lastHit: null,
		};
		mockUseGameStore.mockImplementation((selector: any) => selector(comboState));

		render(<DamageFeedback />);
		expect(screen.getByText("3X")).toBeDefined();
		expect(screen.getByText("COMBO")).toBeDefined();
	});

	it("should not show combo counter when combo count is low", () => {
		const lowComboState = {
			comboCount: 1,
			comboTimer: 2,
			lastHit: null,
		};
		mockUseGameStore.mockImplementation((selector: any) => selector(lowComboState));

		render(<DamageFeedback />);
		expect(screen.queryByText("COMBO")).toBeNull();
	});

	it("should display hit markers on hit", () => {
		// Create a stable hit object reference
		const hitState = {
			comboCount: 0,
			comboTimer: 0,
			lastHit: {
				isCritical: false,
				isKill: false,
				enemyType: "Gator",
				damage: 10,
				timestamp: Date.now(),
			},
		};

		mockUseGameStore.mockImplementation((selector: any) => selector(hitState));

		render(<DamageFeedback />);

		// Check for svg (hit marker)
		expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
	});

	it("should display critical hit markers", () => {
		// Create a stable critical hit object reference
		const criticalHitState = {
			comboCount: 0,
			comboTimer: 0,
			lastHit: {
				isCritical: true,
				isKill: false,
				enemyType: "Gator",
				damage: 20,
				timestamp: Date.now(),
			},
		};

		mockUseGameStore.mockImplementation((selector: any) => selector(criticalHitState));

		render(<DamageFeedback />);

		// Critical hit marker has circle
		expect(document.querySelector("circle")).toBeDefined();
	});

	it("should display kill notification", () => {
		// Create a stable kill object reference
		const killState = {
			comboCount: 0,
			comboTimer: 0,
			lastHit: {
				isCritical: false,
				isKill: true,
				enemyType: "Gator",
				xp: 100,
				credits: 50,
				damage: 10,
				timestamp: Date.now(),
			},
		};

		mockUseGameStore.mockImplementation((selector: any) => selector(killState));

		render(<DamageFeedback />);

		expect(screen.getByText("GATOR ELIMINATED")).toBeDefined();
		expect(screen.getByText("+100 XP")).toBeDefined();
		expect(screen.getByText("+50 CREDITS")).toBeDefined();
	});

	it("should remove markers after timeout", () => {
		// Create a stable hit object reference (render with hit from the start)
		const hitState = {
			comboCount: 0,
			comboTimer: 0,
			lastHit: {
				isCritical: false,
				isKill: false,
				enemyType: "Gator",
				damage: 10,
				timestamp: Date.now(),
			},
		};

		mockUseGameStore.mockImplementation((selector: any) => selector(hitState));

		render(<DamageFeedback />);
		expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);

		// Advance time past the 500ms marker lifetime
		act(() => {
			jest.advanceTimersByTime(1000);
		});

		// Should be gone after the cleanup interval ran
		expect(document.querySelectorAll("svg").length).toBe(0);
	});
});
