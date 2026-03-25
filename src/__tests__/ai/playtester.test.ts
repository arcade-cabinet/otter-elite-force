/**
 * AI Playtester E2E Tests
 *
 * Layer 4 testing: the AI plays the game through real browser events.
 * These tests validate that the game is playable end-to-end.
 *
 * BLOCKED: These tests require the full React+Konva+Koota pipeline
 * (A2, A3, A4, D2) to be wired up before they can run. The test
 * structure is ready; the bootGame/loadMission helpers will be
 * implemented once the game pipeline is complete.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AIPlaytester,
	type AIPlaytesterConfig,
	type GameStateReader,
	type PlayerPerception,
	runUntilComplete,
} from "@/ai/playtester";
import {
	AttackNearestEnemyGoal,
	BuildArmyGoal,
	BuildEconomyGoal,
	ClickTrainButtonGoal,
	createPlaytesterBrain,
	DefendBaseGoal,
	EconomyEvaluator,
	ExplorationEvaluator,
	GoalStatus,
	MilitaryEvaluator,
	ObjectiveEvaluator,
	PlaytesterBrain,
	ScoutMapGoal,
	SelectIdleWorkerGoal,
	SurviveEvaluator,
} from "@/ai/playtester/goals";
import {
	APMLimiter,
	applyMisclick,
	clickAtTile,
	DEFAULT_INPUT_CONFIG,
	dragSelectTiles,
	executeAction,
	type InputConfig,
	type PlayerAction,
	pressKey,
	rightClickAtTile,
} from "@/ai/playtester/input";
import {
	canAfford,
	countIdleWorkers,
	countMilitaryUnits,
	explorationProgress,
	findBuildings,
	findNearestResource,
	findNearestUnexploredTile,
	findWeakestEnemy,
	hasPopulationRoom,
	isBaseUnderThreat,
	PerceptionBuilder,
} from "@/ai/playtester/perception";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a minimal perception for testing evaluators and goals. */
function makePerception(overrides: Partial<PlayerPerception> = {}): PlayerPerception {
	return {
		viewport: { x: 0, y: 0, width: 800, height: 600 },
		exploredTiles: new Set<string>(),
		visibleTiles: new Set<string>(),
		resources: { fish: 200, timber: 200, salvage: 100 },
		population: { current: 4, max: 10 },
		selectedUnits: [],
		selectedBuildings: [],
		visibleFriendlyUnits: [],
		visibleEnemyUnits: [],
		visibleBuildings: [],
		visibleResources: [],
		minimapDots: [],
		gameTime: 0,
		mapCols: 30,
		mapRows: 30,
		...overrides,
	};
}

/** Create a mock canvas element for input tests. */
function makeCanvas(): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 800;
	canvas.height = 600;
	// Mock getBoundingClientRect
	canvas.getBoundingClientRect = () => ({
		left: 0,
		top: 0,
		right: 800,
		bottom: 600,
		width: 800,
		height: 600,
		x: 0,
		y: 0,
		toJSON: () => {},
	});
	return canvas;
}

// ============================================================================
// PERCEPTION QUERIES
// ============================================================================

describe("Perception Queries", () => {
	it("countIdleWorkers returns idle river_rats only", () => {
		const perception = makePerception({
			visibleFriendlyUnits: [
				{
					entityId: 1,
					unitType: "river_rat",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: false,
					hasOrders: false,
				},
				{
					entityId: 2,
					unitType: "river_rat",
					faction: "ura",
					tileX: 6,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: true,
					hasOrders: false,
				},
				{
					entityId: 3,
					unitType: "mudfoot",
					faction: "ura",
					tileX: 7,
					tileY: 5,
					hp: 80,
					maxHp: 80,
					armor: 2,
					damage: 12,
					range: 1,
					speed: 8,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		expect(countIdleWorkers(perception)).toBe(1);
	});

	it("countMilitaryUnits counts combat units only", () => {
		const perception = makePerception({
			visibleFriendlyUnits: [
				{
					entityId: 1,
					unitType: "mudfoot",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 80,
					maxHp: 80,
					armor: 2,
					damage: 12,
					range: 1,
					speed: 8,
					isGathering: false,
					hasOrders: false,
				},
				{
					entityId: 2,
					unitType: "shellcracker",
					faction: "ura",
					tileX: 6,
					tileY: 5,
					hp: 50,
					maxHp: 50,
					armor: 0,
					damage: 10,
					range: 5,
					speed: 9,
					isGathering: false,
					hasOrders: false,
				},
				{
					entityId: 3,
					unitType: "river_rat",
					faction: "ura",
					tileX: 7,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		expect(countMilitaryUnits(perception)).toBe(2);
	});

	it("isBaseUnderThreat detects enemies near command_post", () => {
		const perception = makePerception({
			visibleBuildings: [
				{
					entityId: 10,
					unitType: "command_post",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 600,
					maxHp: 600,
					isTraining: false,
					queueLength: 0,
				},
			],
			visibleEnemyUnits: [
				{
					entityId: 20,
					unitType: "gator",
					faction: "scale_guard",
					tileX: 7,
					tileY: 5,
					hp: 120,
					maxHp: 120,
					armor: 4,
					damage: 18,
					range: 1,
					speed: 5,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		expect(isBaseUnderThreat(perception, 5)).toBe(true);
	});

	it("isBaseUnderThreat returns false when enemies far away", () => {
		const perception = makePerception({
			visibleBuildings: [
				{
					entityId: 10,
					unitType: "command_post",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 600,
					maxHp: 600,
					isTraining: false,
					queueLength: 0,
				},
			],
			visibleEnemyUnits: [
				{
					entityId: 20,
					unitType: "gator",
					faction: "scale_guard",
					tileX: 20,
					tileY: 20,
					hp: 120,
					maxHp: 120,
					armor: 4,
					damage: 18,
					range: 1,
					speed: 5,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		expect(isBaseUnderThreat(perception, 5)).toBe(false);
	});

	it("canAfford checks all resource types", () => {
		const perception = makePerception({
			resources: { fish: 100, timber: 50, salvage: 10 },
		});

		expect(canAfford(perception, { fish: 80 })).toBe(true);
		expect(canAfford(perception, { timber: 100 })).toBe(false);
		expect(canAfford(perception, { fish: 80, salvage: 20 })).toBe(false);
	});

	it("hasPopulationRoom checks capacity", () => {
		expect(hasPopulationRoom(makePerception({ population: { current: 4, max: 10 } }))).toBe(true);
		expect(hasPopulationRoom(makePerception({ population: { current: 10, max: 10 } }))).toBe(false);
	});

	it("explorationProgress computes ratio", () => {
		const explored = new Set<string>();
		explored.add("0,0");
		explored.add("1,0");
		explored.add("2,0");

		const perception = makePerception({
			exploredTiles: explored,
			mapCols: 10,
			mapRows: 10,
		});

		expect(explorationProgress(perception)).toBeCloseTo(0.03);
	});

	it("findNearestResource finds closest of type", () => {
		const perception = makePerception({
			visibleResources: [
				{ entityId: 1, resourceType: "fish", tileX: 10, tileY: 10, remaining: 50 },
				{ entityId: 2, resourceType: "timber", tileX: 3, tileY: 3, remaining: 80 },
				{ entityId: 3, resourceType: "fish", tileX: 4, tileY: 4, remaining: 60 },
			],
		});

		const nearest = findNearestResource(perception, 5, 5, "fish");
		expect(nearest?.entityId).toBe(3);
	});

	it("findWeakestEnemy returns lowest HP enemy", () => {
		const perception = makePerception({
			visibleEnemyUnits: [
				{
					entityId: 1,
					unitType: "gator",
					faction: "scale_guard",
					tileX: 10,
					tileY: 10,
					hp: 120,
					maxHp: 120,
					armor: 4,
					damage: 18,
					range: 1,
					speed: 5,
					isGathering: false,
					hasOrders: false,
				},
				{
					entityId: 2,
					unitType: "viper",
					faction: "scale_guard",
					tileX: 12,
					tileY: 10,
					hp: 20,
					maxHp: 35,
					armor: 0,
					damage: 8,
					range: 5,
					speed: 8,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		const weakest = findWeakestEnemy(perception);
		expect(weakest?.entityId).toBe(2);
		expect(weakest?.hp).toBe(20);
	});
});

// ============================================================================
// APM LIMITER
// ============================================================================

describe("APMLimiter", () => {
	it("enforces minimum action gap", () => {
		const limiter = new APMLimiter({
			apm: 120,
			errorRate: 0,
			maxMisclickOffset: 0,
			minActionGap: 100,
		});

		limiter.record(1000);
		expect(limiter.getDelay(1050)).toBeGreaterThan(0);
		expect(limiter.getDelay(1100)).toBe(0);
	});

	it("enforces APM ceiling", () => {
		const limiter = new APMLimiter({ apm: 2, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 });

		limiter.record(1000);
		limiter.record(1100);

		// 2 actions in the last 60s — at ceiling
		const delay = limiter.getDelay(1200);
		expect(delay).toBeGreaterThan(0);
	});

	it("allows actions after window expires", () => {
		const limiter = new APMLimiter({ apm: 2, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 });

		limiter.record(0);
		limiter.record(100);

		// After 60 seconds, the window clears
		expect(limiter.getDelay(61_000)).toBe(0);
	});
});

// ============================================================================
// MISCLICK SIMULATION
// ============================================================================

describe("applyMisclick", () => {
	it("returns original position when no misclick occurs", () => {
		const config: InputConfig = { apm: 60, errorRate: 0, maxMisclickOffset: 10, minActionGap: 50 };
		const result = applyMisclick(100, 200, config);
		expect(result).toEqual({ x: 100, y: 200 });
	});

	it("offsets position when misclick occurs", () => {
		const config: InputConfig = {
			apm: 60,
			errorRate: 1.0,
			maxMisclickOffset: 10,
			minActionGap: 50,
		};

		// Run multiple times — at least one should differ
		let hadOffset = false;
		for (let i = 0; i < 20; i++) {
			const result = applyMisclick(100, 200, config);
			if (result.x !== 100 || result.y !== 200) {
				hadOffset = true;
				// Offset should be within maxMisclickOffset
				const dx = result.x - 100;
				const dy = result.y - 200;
				const dist = Math.sqrt(dx * dx + dy * dy);
				expect(dist).toBeLessThanOrEqual(config.maxMisclickOffset + 1); // +1 for rounding
				break;
			}
		}
		expect(hadOffset).toBe(true);
	});
});

// ============================================================================
// ACTION FACTORIES
// ============================================================================

describe("Action Factories", () => {
	it("clickAtTile converts tile coords to screen-relative pixels", () => {
		const action = clickAtTile(5, 5, 0, 0);
		expect(action.type).toBe("click");
		// Tile 5 * 32 + 16 = 176
		expect(action.screenX).toBe(176);
		expect(action.screenY).toBe(176);
	});

	it("clickAtTile adjusts for viewport offset", () => {
		const action = clickAtTile(5, 5, 100, 50);
		expect(action.screenX).toBe(76); // 176 - 100
		expect(action.screenY).toBe(126); // 176 - 50
	});

	it("rightClickAtTile creates rightClick action", () => {
		const action = rightClickAtTile(3, 3, 0, 0);
		expect(action.type).toBe("rightClick");
	});

	it("dragSelectTiles creates drag with correct bounds", () => {
		const action = dragSelectTiles(2, 2, 5, 5, 0, 0);
		expect(action.type).toBe("drag");
		expect(action.screenX).toBe(64); // 2 * 32
		expect(action.screenY).toBe(64);
		expect(action.endX).toBe(192); // (5+1) * 32
		expect(action.endY).toBe(192);
	});

	it("pressKey creates keypress action", () => {
		const action = pressKey("b");
		expect(action.type).toBe("keypress");
		expect(action.key).toBe("b");
	});
});

// ============================================================================
// INPUT DISPATCH
// ============================================================================

describe("executeAction", () => {
	it("dispatches mousedown + mouseup + click for left click", async () => {
		const canvas = makeCanvas();
		const events: string[] = [];
		canvas.addEventListener("mousedown", () => events.push("mousedown"));
		canvas.addEventListener("mouseup", () => events.push("mouseup"));
		canvas.addEventListener("click", () => events.push("click"));

		await executeAction(
			canvas,
			{ type: "click", screenX: 100, screenY: 100 },
			{ apm: 60, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 },
		);

		expect(events).toEqual(["mousedown", "mouseup", "click"]);
	});

	it("dispatches contextmenu for right click", async () => {
		const canvas = makeCanvas();
		const events: string[] = [];
		canvas.addEventListener("mousedown", () => events.push("mousedown"));
		canvas.addEventListener("mouseup", () => events.push("mouseup"));
		canvas.addEventListener("contextmenu", () => events.push("contextmenu"));

		await executeAction(
			canvas,
			{ type: "rightClick", screenX: 100, screenY: 100 },
			{ apm: 60, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 },
		);

		expect(events).toEqual(["mousedown", "mouseup", "contextmenu"]);
	});

	it("dispatches keydown + keyup for keypress", async () => {
		const canvas = makeCanvas();
		const events: string[] = [];
		const keys: string[] = [];
		canvas.addEventListener("keydown", (e) => {
			events.push("keydown");
			keys.push((e as KeyboardEvent).key);
		});
		canvas.addEventListener("keyup", () => events.push("keyup"));

		await executeAction(
			canvas,
			{ type: "keypress", screenX: 0, screenY: 0, key: "b" },
			{ apm: 60, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 },
		);

		expect(events).toEqual(["keydown", "keyup"]);
		expect(keys).toEqual(["b"]);
	});

	it("dispatches wheel event for scroll", async () => {
		const canvas = makeCanvas();
		let deltaY = 0;
		canvas.addEventListener("wheel", (e) => {
			deltaY = (e as WheelEvent).deltaY;
		});

		await executeAction(
			canvas,
			{ type: "scroll", screenX: 400, screenY: 300, scrollDelta: -120 },
			{ apm: 60, errorRate: 0, maxMisclickOffset: 0, minActionGap: 0 },
		);

		expect(deltaY).toBe(-120);
	});
});

// ============================================================================
// GOAL EVALUATORS
// ============================================================================

describe("Goal Evaluators", () => {
	describe("SurviveEvaluator", () => {
		it("returns 1.0 when base is under threat", () => {
			const evaluator = new SurviveEvaluator();
			const perception = makePerception({
				visibleBuildings: [
					{
						entityId: 1,
						unitType: "command_post",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 600,
						maxHp: 600,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleEnemyUnits: [
					{
						entityId: 2,
						unitType: "gator",
						faction: "scale_guard",
						tileX: 7,
						tileY: 5,
						hp: 120,
						maxHp: 120,
						armor: 4,
						damage: 18,
						range: 1,
						speed: 5,
						isGathering: false,
						hasOrders: false,
					},
				],
			});

			expect(evaluator.calculateDesirability(perception)).toBe(1.0);
		});

		it("returns 0 when no enemies visible", () => {
			const evaluator = new SurviveEvaluator();
			expect(evaluator.calculateDesirability(makePerception())).toBe(0.0);
		});
	});

	describe("EconomyEvaluator", () => {
		it("returns high score when workers are idle", () => {
			const evaluator = new EconomyEvaluator();
			const perception = makePerception({
				visibleFriendlyUnits: [
					{
						entityId: 1,
						unitType: "river_rat",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 40,
						maxHp: 40,
						armor: 0,
						damage: 5,
						range: 1,
						speed: 10,
						isGathering: false,
						hasOrders: false,
					},
				],
			});

			expect(evaluator.calculateDesirability(perception)).toBe(0.8);
		});
	});

	describe("MilitaryEvaluator", () => {
		it("returns low score without barracks", () => {
			const evaluator = new MilitaryEvaluator();
			expect(evaluator.calculateDesirability(makePerception())).toBe(0.1);
		});

		it("returns high score with barracks but few military", () => {
			const evaluator = new MilitaryEvaluator();
			const perception = makePerception({
				visibleBuildings: [
					{
						entityId: 1,
						unitType: "barracks",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 350,
						maxHp: 350,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleFriendlyUnits: [
					{
						entityId: 2,
						unitType: "mudfoot",
						faction: "ura",
						tileX: 6,
						tileY: 5,
						hp: 80,
						maxHp: 80,
						armor: 2,
						damage: 12,
						range: 1,
						speed: 8,
						isGathering: false,
						hasOrders: false,
					},
				],
			});

			expect(evaluator.calculateDesirability(perception)).toBe(0.7);
		});
	});

	describe("ExplorationEvaluator", () => {
		it("returns high score when map barely explored", () => {
			const evaluator = new ExplorationEvaluator();
			const perception = makePerception({
				exploredTiles: new Set(["0,0", "1,0"]),
				mapCols: 30,
				mapRows: 30,
			});

			expect(evaluator.calculateDesirability(perception)).toBe(0.5);
		});
	});
});

// ============================================================================
// BRAIN (Think)
// ============================================================================

describe("PlaytesterBrain", () => {
	it("creates brain with 5 evaluators via factory", () => {
		const brain = createPlaytesterBrain();
		expect(brain.evaluators).toHaveLength(5);
	});

	it("arbitrate picks Survive when base is under attack", () => {
		const brain = createPlaytesterBrain();
		const perception = makePerception({
			visibleBuildings: [
				{
					entityId: 1,
					unitType: "command_post",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 600,
					maxHp: 600,
					isTraining: false,
					queueLength: 0,
				},
			],
			visibleEnemyUnits: [
				{
					entityId: 2,
					unitType: "gator",
					faction: "scale_guard",
					tileX: 7,
					tileY: 5,
					hp: 120,
					maxHp: 120,
					armor: 4,
					damage: 18,
					range: 1,
					speed: 5,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		brain.arbitrate(perception);
		const current = brain.currentSubgoal();
		expect(current).toBeInstanceOf(DefendBaseGoal);
	});

	it("arbitrate picks Economy when workers are idle and no threat", () => {
		const brain = createPlaytesterBrain();
		const perception = makePerception({
			visibleFriendlyUnits: [
				{
					entityId: 1,
					unitType: "river_rat",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		brain.arbitrate(perception);
		const current = brain.currentSubgoal();
		expect(current).toBeInstanceOf(BuildEconomyGoal);
	});

	it("execute returns actions from the active goal", () => {
		const brain = createPlaytesterBrain();
		const perception = makePerception({
			visibleFriendlyUnits: [
				{
					entityId: 1,
					unitType: "river_rat",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: false,
					hasOrders: false,
				},
			],
			visibleResources: [
				{ entityId: 10, resourceType: "fish", tileX: 8, tileY: 5, remaining: 100 },
			],
		});

		const actions = brain.execute(perception);
		// Should produce at least one click action (selecting the idle worker)
		expect(actions.length).toBeGreaterThan(0);
		expect(actions[0].type).toBe("click");
	});
});

// ============================================================================
// LEAF GOALS
// ============================================================================

describe("Leaf Goals", () => {
	it("SelectIdleWorkerGoal produces click on idle river_rat", () => {
		const goal = new SelectIdleWorkerGoal();
		const perception = makePerception({
			visibleFriendlyUnits: [
				{
					entityId: 1,
					unitType: "river_rat",
					faction: "ura",
					tileX: 5,
					tileY: 5,
					hp: 40,
					maxHp: 40,
					armor: 0,
					damage: 5,
					range: 1,
					speed: 10,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		goal.activateIfInactive(perception);
		const actions = goal.execute(perception);
		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe("click");
		expect(goal.completed()).toBe(true);
	});

	it("SelectIdleWorkerGoal fails when no idle workers", () => {
		const goal = new SelectIdleWorkerGoal();
		const perception = makePerception();

		goal.activateIfInactive(perception);
		const actions = goal.execute(perception);
		expect(actions).toHaveLength(0);
		expect(goal.failed()).toBe(true);
	});

	it("AttackNearestEnemyGoal produces rightClick on weakest enemy", () => {
		const goal = new AttackNearestEnemyGoal();
		const perception = makePerception({
			visibleEnemyUnits: [
				{
					entityId: 1,
					unitType: "gator",
					faction: "scale_guard",
					tileX: 10,
					tileY: 10,
					hp: 50,
					maxHp: 120,
					armor: 4,
					damage: 18,
					range: 1,
					speed: 5,
					isGathering: false,
					hasOrders: false,
				},
			],
		});

		goal.activateIfInactive(perception);
		const actions = goal.execute(perception);
		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe("rightClick");
		expect(goal.completed()).toBe(true);
	});

	it("ClickTrainButtonGoal fails when no barracks is selected", () => {
		const goal = new ClickTrainButtonGoal("1");
		const actions = goal.execute(makePerception());

		expect(actions).toEqual([]);
		expect(goal.failed()).toBe(true);
	});

	it("ClickTrainButtonGoal presses the train hotkey when a barracks is selected", () => {
		const goal = new ClickTrainButtonGoal("1");
		const actions = goal.execute(
			makePerception({
				selectedBuildings: [
					{
						entityId: 12,
						unitType: "barracks",
						faction: "ura",
						tileX: 8,
						tileY: 6,
						hp: 500,
						maxHp: 500,
						isTraining: false,
						queueLength: 0,
					},
				],
			}),
		);

		expect(actions).toEqual([{ type: "keypress", screenX: 0, screenY: 0, key: "1" }]);
		expect(goal.completed()).toBe(true);
	});
});
