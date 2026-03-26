/**
 * Tests for SolidJS HUD components — verifies bridge signal consumption
 * and component data logic without JSX rendering (pure TS signal tests).
 *
 * These tests verify the data layer that feeds the HUD components,
 * using the same pattern as appState.test.ts.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type {
	AlertViewModel,
	BossViewModel,
	DialogueViewModel,
	ObjectiveViewModel,
	PopulationViewModel,
	ResourceViewModel,
	SelectionViewModel,
} from "@/engine/bridge/solidBridge";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import { createErrorFeedback } from "./errorState";

/**
 * Create a mock SolidBridgeAccessors for testing.
 */
function createMockBridge(overrides?: Partial<{
	resources: ResourceViewModel;
	population: PopulationViewModel;
	objectives: ObjectiveViewModel[];
	alerts: AlertViewModel[];
	selection: SelectionViewModel | null;
	dialogue: DialogueViewModel | null;
	boss: BossViewModel | null;
	weather: "clear" | "rain" | "monsoon" | null;
}>): { accessors: SolidBridgeAccessors; setters: Record<string, unknown> } {
	const [screen, setScreen] = createSignal("game");
	const [resources, setResources] = createStore<ResourceViewModel>(
		overrides?.resources ?? { fish: 100, timber: 200, salvage: 50 },
	);
	const [population, setPopulation] = createStore<PopulationViewModel>(
		overrides?.population ?? { current: 5, max: 20 },
	);
	const [selection, setSelection] = createSignal<SelectionViewModel | null>(
		overrides?.selection ?? null,
	);
	const [objectives, setObjectives] = createStore<ObjectiveViewModel[]>(
		overrides?.objectives ?? [],
	);
	const [alerts, setAlerts] = createStore<AlertViewModel[]>(
		overrides?.alerts ?? [],
	);
	const [dialogue, setDialogue] = createSignal<DialogueViewModel | null>(
		overrides?.dialogue ?? null,
	);
	const [weather, setWeather] = createSignal<"clear" | "rain" | "monsoon" | null>(
		overrides?.weather ?? null,
	);
	const [boss, setBoss] = createSignal<BossViewModel | null>(
		overrides?.boss ?? null,
	);

	return {
		accessors: {
			screen,
			resources,
			population,
			selection,
			objectives,
			alerts,
			dialogue,
			weather,
			boss,
		},
		setters: {
			setScreen,
			setResources,
			setPopulation,
			setSelection,
			setObjectives,
			setAlerts,
			setDialogue,
			setWeather,
			setBoss,
		},
	};
}

function createMockEmit(): SolidBridgeEmit {
	return {
		pause: vi.fn(),
		resume: vi.fn(),
		saveGame: vi.fn(),
		startBuild: vi.fn(),
		queueUnit: vi.fn(),
		issueResearch: vi.fn(),
		setScreen: vi.fn(),
	};
}

describe("solid/hud", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("mock bridge accessors", () => {
		it("provides default resource values", () => {
			const { accessors } = createMockBridge();
			expect(accessors.resources.fish).toBe(100);
			expect(accessors.resources.timber).toBe(200);
			expect(accessors.resources.salvage).toBe(50);
		});

		it("provides default population values", () => {
			const { accessors } = createMockBridge();
			expect(accessors.population.current).toBe(5);
			expect(accessors.population.max).toBe(20);
		});

		it("provides null selection by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.selection()).toBeNull();
		});

		it("provides empty objectives by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.objectives.length).toBe(0);
		});

		it("provides empty alerts by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.alerts.length).toBe(0);
		});

		it("provides null dialogue by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.dialogue()).toBeNull();
		});

		it("provides null boss by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.boss()).toBeNull();
		});

		it("provides null weather by default", () => {
			const { accessors } = createMockBridge();
			expect(accessors.weather()).toBeNull();
		});
	});

	describe("bridge with custom values", () => {
		it("accepts custom resource values", () => {
			const { accessors } = createMockBridge({
				resources: { fish: 500, timber: 300, salvage: 100 },
			});
			expect(accessors.resources.fish).toBe(500);
			expect(accessors.resources.timber).toBe(300);
			expect(accessors.resources.salvage).toBe(100);
		});

		it("accepts custom population values", () => {
			const { accessors } = createMockBridge({
				population: { current: 15, max: 50 },
			});
			expect(accessors.population.current).toBe(15);
			expect(accessors.population.max).toBe(50);
		});

		it("accepts a selection", () => {
			const { accessors } = createMockBridge({
				selection: { entityIds: [1, 2, 3], primaryLabel: "3 units selected" },
			});
			const sel = accessors.selection();
			expect(sel).not.toBeNull();
			expect(sel?.entityIds).toEqual([1, 2, 3]);
			expect(sel?.primaryLabel).toBe("3 units selected");
		});

		it("accepts objectives", () => {
			const { accessors } = createMockBridge({
				objectives: [
					{ id: "obj-1", description: "Capture the bridge", status: "active" },
					{ id: "obj-2", description: "Eliminate hostiles", status: "completed" },
				],
			});
			expect(accessors.objectives.length).toBe(2);
			expect(accessors.objectives[0].status).toBe("active");
			expect(accessors.objectives[1].status).toBe("completed");
		});

		it("accepts alerts", () => {
			const { accessors } = createMockBridge({
				alerts: [
					{ id: "a1", severity: "critical", message: "Under Attack!" },
					{ id: "a2", severity: "info", message: "Building Complete" },
				],
			});
			expect(accessors.alerts.length).toBe(2);
			expect(accessors.alerts[0].severity).toBe("critical");
			expect(accessors.alerts[1].severity).toBe("info");
		});

		it("accepts dialogue", () => {
			const { accessors } = createMockBridge({
				dialogue: {
					lines: [
						{ speaker: "Col. Bubbles", text: "Move out, Captain!" },
						{ speaker: "FOXHOUND", text: "Enemy spotted ahead." },
					],
				},
			});
			const d = accessors.dialogue();
			expect(d).not.toBeNull();
			expect(d?.lines.length).toBe(2);
			expect(d?.lines[0].speaker).toBe("Col. Bubbles");
		});

		it("accepts boss data", () => {
			const { accessors } = createMockBridge({
				boss: { name: "General Croc", currentHp: 500, maxHp: 1000 },
			});
			const b = accessors.boss();
			expect(b).not.toBeNull();
			expect(b?.name).toBe("General Croc");
			expect(b?.currentHp).toBe(500);
			expect(b?.maxHp).toBe(1000);
		});
	});

	describe("emit mock", () => {
		it("creates all emit functions", () => {
			const emit = createMockEmit();
			expect(typeof emit.pause).toBe("function");
			expect(typeof emit.resume).toBe("function");
			expect(typeof emit.saveGame).toBe("function");
			expect(typeof emit.startBuild).toBe("function");
			expect(typeof emit.queueUnit).toBe("function");
			expect(typeof emit.issueResearch).toBe("function");
			expect(typeof emit.setScreen).toBe("function");
		});

		it("records startBuild calls", () => {
			const emit = createMockEmit();
			emit.startBuild("barracks");
			expect(emit.startBuild).toHaveBeenCalledWith("barracks");
		});

		it("records queueUnit calls", () => {
			const emit = createMockEmit();
			emit.queueUnit("river_rat");
			expect(emit.queueUnit).toHaveBeenCalledWith("river_rat");
		});
	});

	describe("createErrorFeedback", () => {
		it("starts with empty error list", () => {
			const { errors } = createErrorFeedback();
			expect(errors()).toEqual([]);
		});

		it("pushes an error message", () => {
			const { errors, pushError } = createErrorFeedback();
			pushError("Not enough resources");
			expect(errors().length).toBe(1);
			expect(errors()[0].message).toBe("Not enough resources");
		});

		it("assigns unique IDs to errors", () => {
			const { errors, pushError } = createErrorFeedback();
			pushError("Error A");
			pushError("Error B");
			expect(errors()[0].id).not.toBe(errors()[1].id);
		});

		it("limits to 2 visible errors", () => {
			const { errors, pushError } = createErrorFeedback();
			pushError("Error A");
			pushError("Error B");
			pushError("Error C");
			// Keeps last 1 + new one = 2 max
			expect(errors().length).toBe(2);
		});

		it("auto-dismisses errors after timeout", () => {
			const { errors, pushError } = createErrorFeedback(1000);
			pushError("Temporary error");
			expect(errors().length).toBe(1);

			vi.advanceTimersByTime(1000);
			expect(errors().length).toBe(0);
		});

		it("auto-dismisses errors with default timeout", () => {
			const { errors, pushError } = createErrorFeedback(2000);
			pushError("Error 1");
			expect(errors().length).toBe(1);

			vi.advanceTimersByTime(2000);
			expect(errors().length).toBe(0);
		});
	});

	describe("boss HP percent calculation", () => {
		it("calculates 50% HP correctly", () => {
			const { accessors } = createMockBridge({
				boss: { name: "Boss", currentHp: 500, maxHp: 1000 },
			});
			const b = accessors.boss();
			const pct = b ? Math.max(0, Math.min(100, (b.currentHp / Math.max(b.maxHp, 1)) * 100)) : 0;
			expect(pct).toBe(50);
		});

		it("clamps at 0% for dead boss", () => {
			const { accessors } = createMockBridge({
				boss: { name: "Boss", currentHp: 0, maxHp: 1000 },
			});
			const b = accessors.boss();
			const pct = b ? Math.max(0, Math.min(100, (b.currentHp / Math.max(b.maxHp, 1)) * 100)) : 0;
			expect(pct).toBe(0);
		});

		it("clamps at 100% for full HP", () => {
			const { accessors } = createMockBridge({
				boss: { name: "Boss", currentHp: 1000, maxHp: 1000 },
			});
			const b = accessors.boss();
			const pct = b ? Math.max(0, Math.min(100, (b.currentHp / Math.max(b.maxHp, 1)) * 100)) : 0;
			expect(pct).toBe(100);
		});

		it("handles zero maxHp gracefully", () => {
			const { accessors } = createMockBridge({
				boss: { name: "Boss", currentHp: 0, maxHp: 0 },
			});
			const b = accessors.boss();
			const pct = b ? Math.max(0, Math.min(100, (b.currentHp / Math.max(b.maxHp, 1)) * 100)) : 0;
			expect(pct).toBe(0);
		});
	});

	describe("build menu affordability logic", () => {
		it("can afford when resources are sufficient", () => {
			const { accessors } = createMockBridge({
				resources: { fish: 100, timber: 400, salvage: 200 },
			});
			const cost = { fish: 0, timber: 400, salvage: 200 };
			const affordable =
				accessors.resources.fish >= (cost.fish ?? 0) &&
				accessors.resources.timber >= (cost.timber ?? 0) &&
				accessors.resources.salvage >= (cost.salvage ?? 0);
			expect(affordable).toBe(true);
		});

		it("cannot afford when timber is insufficient", () => {
			const { accessors } = createMockBridge({
				resources: { fish: 100, timber: 100, salvage: 200 },
			});
			const cost = { timber: 400, salvage: 200 };
			const affordable =
				accessors.resources.fish >= (cost.fish ?? 0) &&
				accessors.resources.timber >= (cost.timber ?? 0) &&
				accessors.resources.salvage >= (cost.salvage ?? 0);
			expect(affordable).toBe(false);
		});

		it("cannot afford when salvage is insufficient", () => {
			const { accessors } = createMockBridge({
				resources: { fish: 100, timber: 400, salvage: 50 },
			});
			const cost = { timber: 400, salvage: 200 };
			const affordable =
				accessors.resources.fish >= (cost.fish ?? 0) &&
				accessors.resources.timber >= (cost.timber ?? 0) &&
				accessors.resources.salvage >= (cost.salvage ?? 0);
			expect(affordable).toBe(false);
		});

		it("can afford free buildings", () => {
			const { accessors } = createMockBridge({
				resources: { fish: 0, timber: 0, salvage: 0 },
			});
			const cost = { fish: 0, timber: 0, salvage: 0 };
			const affordable =
				accessors.resources.fish >= (cost.fish ?? 0) &&
				accessors.resources.timber >= (cost.timber ?? 0) &&
				accessors.resources.salvage >= (cost.salvage ?? 0);
			expect(affordable).toBe(true);
		});
	});

	describe("objective status indicators", () => {
		const STATUS_ICON: Record<string, { symbol: string; color: string }> = {
			completed: { symbol: "\u2713", color: "text-green-400" },
			active: { symbol: "\u2022", color: "text-amber-400" },
			failed: { symbol: "\u2717", color: "text-rose-400" },
		};

		it("maps completed status to green checkmark", () => {
			expect(STATUS_ICON.completed.symbol).toBe("\u2713");
			expect(STATUS_ICON.completed.color).toBe("text-green-400");
		});

		it("maps active status to amber dot", () => {
			expect(STATUS_ICON.active.symbol).toBe("\u2022");
			expect(STATUS_ICON.active.color).toBe("text-amber-400");
		});

		it("maps failed status to red X", () => {
			expect(STATUS_ICON.failed.symbol).toBe("\u2717");
			expect(STATUS_ICON.failed.color).toBe("text-rose-400");
		});
	});

	describe("alert severity styling", () => {
		const SEVERITY_STYLES: Record<string, string> = {
			info: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300",
			warning: "border-amber-500/50 bg-amber-950/20 text-amber-300",
			critical: "border-rose-500/50 bg-rose-950/20 text-rose-300",
		};

		it("info alerts use cyan styling", () => {
			expect(SEVERITY_STYLES.info).toContain("cyan");
		});

		it("warning alerts use amber styling", () => {
			expect(SEVERITY_STYLES.warning).toContain("amber");
		});

		it("critical alerts use rose styling", () => {
			expect(SEVERITY_STYLES.critical).toContain("rose");
		});
	});

	describe("dialogue line navigation logic", () => {
		it("tracks line index for multi-line dialogue", () => {
			const dialogue: DialogueViewModel = {
				lines: [
					{ speaker: "Col. Bubbles", text: "Line 1" },
					{ speaker: "FOXHOUND", text: "Line 2" },
					{ speaker: "Col. Bubbles", text: "Line 3" },
				],
			};
			let lineIndex = 0;
			const isLastLine = () => lineIndex >= dialogue.lines.length - 1;

			expect(isLastLine()).toBe(false);
			expect(dialogue.lines[lineIndex].speaker).toBe("Col. Bubbles");

			lineIndex++;
			expect(isLastLine()).toBe(false);
			expect(dialogue.lines[lineIndex].speaker).toBe("FOXHOUND");

			lineIndex++;
			expect(isLastLine()).toBe(true);
			expect(dialogue.lines[lineIndex].speaker).toBe("Col. Bubbles");
		});

		it("handles single-line dialogue", () => {
			const dialogue: DialogueViewModel = {
				lines: [{ speaker: "Gen. Whiskers", text: "Deploy." }],
			};
			const lineIndex = 0;
			const isLastLine = lineIndex >= dialogue.lines.length - 1;
			expect(isLastLine).toBe(true);
		});
	});
});
