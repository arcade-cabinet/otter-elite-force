/**
 * GOAP Goal hierarchy for the AI Playtester.
 *
 * Follows Yuka's Goal/CompositeGoal/Think pattern but adapted for
 * our 2D RTS playtester that operates through perception + input.
 *
 * Goals do NOT read Koota directly. They read PlayerPerception and
 * produce PlayerAction arrays dispatched through the input model.
 */

import type { PlayerPerception } from "./perception";
import type { PlayerAction } from "./input";
import { clickAtTile, rightClickAtTile, dragSelectTiles, pressKey } from "./input";
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
} from "./perception";

// ---------------------------------------------------------------------------
// Goal status
// ---------------------------------------------------------------------------

export const GoalStatus = {
	INACTIVE: "inactive",
	ACTIVE: "active",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type GoalStatusType = (typeof GoalStatus)[keyof typeof GoalStatus];

// ---------------------------------------------------------------------------
// Base Goal
// ---------------------------------------------------------------------------

export abstract class PlaytesterGoal {
	status: GoalStatusType = GoalStatus.INACTIVE;

	/** Called when this goal becomes active. */
	activate(_perception: PlayerPerception): void {}

	/** Called each decision tick. Returns actions to execute. */
	abstract execute(perception: PlayerPerception): PlayerAction[];

	/** Called when this goal completes or is removed. */
	terminate(): void {}

	active(): boolean {
		return this.status === GoalStatus.ACTIVE;
	}

	inactive(): boolean {
		return this.status === GoalStatus.INACTIVE;
	}

	completed(): boolean {
		return this.status === GoalStatus.COMPLETED;
	}

	failed(): boolean {
		return this.status === GoalStatus.FAILED;
	}

	activateIfInactive(perception: PlayerPerception): void {
		if (this.inactive()) {
			this.status = GoalStatus.ACTIVE;
			this.activate(perception);
		}
	}

	replanIfFailed(): void {
		if (this.failed()) {
			this.status = GoalStatus.INACTIVE;
		}
	}
}

// ---------------------------------------------------------------------------
// Composite Goal
// ---------------------------------------------------------------------------

export abstract class CompositePlaytesterGoal extends PlaytesterGoal {
	subgoals: PlaytesterGoal[] = [];

	addSubgoal(goal: PlaytesterGoal): void {
		this.subgoals.unshift(goal);
	}

	clearSubgoals(): void {
		for (const sg of this.subgoals) {
			sg.terminate();
		}
		this.subgoals.length = 0;
	}

	currentSubgoal(): PlaytesterGoal | null {
		return this.subgoals.length > 0 ? this.subgoals[this.subgoals.length - 1] : null;
	}

	executeSubgoals(perception: PlayerPerception): {
		status: GoalStatusType;
		actions: PlayerAction[];
	} {
		// Remove completed/failed goals from the back
		while (this.subgoals.length > 0) {
			const back = this.subgoals[this.subgoals.length - 1];
			if (back.completed() || back.failed()) {
				if (back instanceof CompositePlaytesterGoal) {
					back.clearSubgoals();
				}
				back.terminate();
				this.subgoals.pop();
			} else {
				break;
			}
		}

		const current = this.currentSubgoal();
		if (current !== null) {
			current.activateIfInactive(perception);
			const actions = current.execute(perception);

			if (current.completed() && this.subgoals.length > 1) {
				return { status: GoalStatus.ACTIVE, actions };
			}
			return { status: current.status, actions };
		}

		return { status: GoalStatus.COMPLETED, actions: [] };
	}
}

// ---------------------------------------------------------------------------
// Goal Evaluator
// ---------------------------------------------------------------------------

export abstract class PlaytesterGoalEvaluator {
	characterBias: number;

	constructor(characterBias = 1) {
		this.characterBias = characterBias;
	}

	/** Score 0..1 representing how desirable this goal is right now. */
	abstract calculateDesirability(perception: PlayerPerception): number;

	/** Push the appropriate goal onto the brain's subgoal stack. */
	abstract setGoal(brain: PlaytesterBrain): void;
}

// ---------------------------------------------------------------------------
// Brain (Think equivalent)
// ---------------------------------------------------------------------------

export class PlaytesterBrain extends CompositePlaytesterGoal {
	evaluators: PlaytesterGoalEvaluator[] = [];

	addEvaluator(evaluator: PlaytesterGoalEvaluator): this {
		this.evaluators.push(evaluator);
		return this;
	}

	override activate(perception: PlayerPerception): void {
		this.arbitrate(perception);
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);

		if (status === GoalStatus.COMPLETED || status === GoalStatus.FAILED) {
			this.status = GoalStatus.INACTIVE;
		}

		return actions;
	}

	/** Top-level decision: pick the highest-desirability evaluator. */
	arbitrate(perception: PlayerPerception): void {
		let bestDesirability = -1;
		let bestEvaluator: PlaytesterGoalEvaluator | null = null;

		for (const evaluator of this.evaluators) {
			let desirability = evaluator.calculateDesirability(perception);
			desirability *= evaluator.characterBias;

			if (desirability >= bestDesirability) {
				bestDesirability = desirability;
				bestEvaluator = evaluator;
			}
		}

		if (bestEvaluator !== null) {
			bestEvaluator.setGoal(this);
		}
	}
}

// ============================================================================
// CONCRETE GOALS
// ============================================================================

// ---------------------------------------------------------------------------
// Leaf goals (atomic actions)
// ---------------------------------------------------------------------------

/** Select idle workers by clicking on them. */
export class SelectIdleWorkerGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		const worker = perception.visibleFriendlyUnits.find(
			(u) => u.unitType === "river_rat" && !u.isGathering && !u.hasOrders,
		);

		if (!worker) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		this.status = GoalStatus.COMPLETED;
		return [clickAtTile(worker.tileX, worker.tileY, perception.viewport.x, perception.viewport.y)];
	}
}

/** Right-click on the nearest resource to send selected workers gathering. */
export class RightClickResourceGoal extends PlaytesterGoal {
	private resourceType?: string;

	constructor(resourceType?: string) {
		super();
		this.resourceType = resourceType;
	}

	execute(perception: PlayerPerception): PlayerAction[] {
		const center = this.getViewportCenter(perception);
		const resource = findNearestResource(perception, center.x, center.y, this.resourceType);

		if (!resource) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		this.status = GoalStatus.COMPLETED;
		return [
			rightClickAtTile(
				resource.tileX,
				resource.tileY,
				perception.viewport.x,
				perception.viewport.y,
			),
		];
	}

	private getViewportCenter(perception: PlayerPerception): { x: number; y: number } {
		const vp = perception.viewport;
		return {
			x: Math.floor((vp.x + vp.width / 2) / 32),
			y: Math.floor((vp.y + vp.height / 2) / 32),
		};
	}
}

/** Select all military units in the viewport with a box drag. */
export class SelectMilitaryUnitsGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		const military = perception.visibleFriendlyUnits.filter((u) =>
			["mudfoot", "shellcracker", "sapper", "mortar_otter", "diver"].includes(u.unitType),
		);

		if (military.length === 0) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		// Find bounding box of military units
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const u of military) {
			minX = Math.min(minX, u.tileX);
			minY = Math.min(minY, u.tileY);
			maxX = Math.max(maxX, u.tileX);
			maxY = Math.max(maxY, u.tileY);
		}

		this.status = GoalStatus.COMPLETED;
		return [
			dragSelectTiles(
				minX - 1,
				minY - 1,
				maxX + 1,
				maxY + 1,
				perception.viewport.x,
				perception.viewport.y,
			),
		];
	}
}

/** Right-click the nearest/weakest enemy to attack. */
export class AttackNearestEnemyGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		const enemy = findWeakestEnemy(perception);

		if (!enemy) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		this.status = GoalStatus.COMPLETED;
		return [
			rightClickAtTile(enemy.tileX, enemy.tileY, perception.viewport.x, perception.viewport.y),
		];
	}
}

/** Press a hotkey to open the build menu (e.g., "b" for build). */
export class OpenBuildMenuGoal extends PlaytesterGoal {
	execute(_perception: PlayerPerception): PlayerAction[] {
		this.status = GoalStatus.COMPLETED;
		return [pressKey("b")];
	}
}

/** Click the barracks to select it. */
export class SelectBarracksGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		const barracks = findBuildings(perception, "barracks");

		if (barracks.length === 0) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		const target = barracks[0];
		this.status = GoalStatus.COMPLETED;
		return [clickAtTile(target.tileX, target.tileY, perception.viewport.x, perception.viewport.y)];
	}
}

/** Press the train button hotkey for the unit type. */
export class ClickTrainButtonGoal extends PlaytesterGoal {
	private unitKey: string;

	constructor(unitKey = "1") {
		super();
		this.unitKey = unitKey;
	}

	execute(_perception: PlayerPerception): PlayerAction[] {
		this.status = GoalStatus.COMPLETED;
		return [pressKey(this.unitKey)];
	}
}

/** Select a scout unit and right-click an unexplored tile. */
export class SelectScoutGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		// Pick fastest available unit for scouting
		const scout = perception.visibleFriendlyUnits.find(
			(u) => !u.hasOrders && u.unitType !== "river_rat",
		);

		if (!scout) {
			this.status = GoalStatus.FAILED;
			return [];
		}

		this.status = GoalStatus.COMPLETED;
		return [clickAtTile(scout.tileX, scout.tileY, perception.viewport.x, perception.viewport.y)];
	}
}

/** Right-click toward unexplored territory. */
export class RightClickUnexploredGoal extends PlaytesterGoal {
	execute(perception: PlayerPerception): PlayerAction[] {
		const center = {
			x: Math.floor((perception.viewport.x + perception.viewport.width / 2) / 32),
			y: Math.floor((perception.viewport.y + perception.viewport.height / 2) / 32),
		};

		const target = findNearestUnexploredTile(perception, center.x, center.y);

		if (!target) {
			this.status = GoalStatus.COMPLETED; // Map fully explored
			return [];
		}

		this.status = GoalStatus.COMPLETED;
		return [
			rightClickAtTile(target.tileX, target.tileY, perception.viewport.x, perception.viewport.y),
		];
	}
}

/** Placeholder: click a building placement spot. */
export class PlaceBuildingGoal extends PlaytesterGoal {
	private buildingHotkey: string;
	private nearTileX: number;
	private nearTileY: number;

	constructor(buildingHotkey: string, nearTileX: number, nearTileY: number) {
		super();
		this.buildingHotkey = buildingHotkey;
		this.nearTileX = nearTileX;
		this.nearTileY = nearTileY;
	}

	execute(perception: PlayerPerception): PlayerAction[] {
		this.status = GoalStatus.COMPLETED;
		return [
			pressKey(this.buildingHotkey),
			clickAtTile(this.nearTileX, this.nearTileY, perception.viewport.x, perception.viewport.y),
		];
	}
}

/** Wait for a condition — re-evaluates each tick. */
export class WaitForConditionGoal extends PlaytesterGoal {
	private condition: (p: PlayerPerception) => boolean;
	private maxTicks: number;
	private tickCount = 0;

	constructor(condition: (p: PlayerPerception) => boolean, maxTicks = 300) {
		super();
		this.condition = condition;
		this.maxTicks = maxTicks;
	}

	execute(perception: PlayerPerception): PlayerAction[] {
		this.tickCount++;

		if (this.condition(perception)) {
			this.status = GoalStatus.COMPLETED;
		} else if (this.tickCount >= this.maxTicks) {
			this.status = GoalStatus.FAILED;
		}

		return [];
	}
}

// ---------------------------------------------------------------------------
// Composite goals (sequences of leaf goals)
// ---------------------------------------------------------------------------

/** Defend base: select military → attack nearest threat. */
export class DefendBaseGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		// Reverse execution order: select first, attack second
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/** Build economy: send idle workers to resources, build income structures. */
export class BuildEconomyGoal extends CompositePlaytesterGoal {
	override activate(perception: PlayerPerception): void {
		this.clearSubgoals();

		const idleCount = countIdleWorkers(perception);

		if (idleCount > 0) {
			// Send idle workers to gather: select first, then right-click resource
			// addSubgoal uses unshift, so add in REVERSE execution order
			this.addSubgoal(new SelectIdleWorkerGoal());
			this.addSubgoal(new RightClickResourceGoal());
		} else if (canAfford(perception, { timber: 100 })) {
			// Build a fish trap for passive income
			// Execution order: select worker → open build menu → place building
			const cp = findBuildings(perception, "command_post");
			if (cp.length > 0) {
				this.addSubgoal(new SelectIdleWorkerGoal());
				this.addSubgoal(new OpenBuildMenuGoal());
				this.addSubgoal(new PlaceBuildingGoal("f", cp[0].tileX + 2, cp[0].tileY));
			}
		}

		// If no subgoals were added, this goal completes immediately
		if (this.subgoals.length === 0) {
			this.status = GoalStatus.COMPLETED;
		}
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/** Build army: select barracks → train a unit. */
export class BuildArmyGoal extends CompositePlaytesterGoal {
	override activate(perception: PlayerPerception): void {
		this.clearSubgoals();

		if (!hasPopulationRoom(perception)) {
			// Need a burrow first: select worker → build menu → place
			if (canAfford(perception, { timber: 80 })) {
				const cp = findBuildings(perception, "command_post");
				if (cp.length > 0) {
					this.addSubgoal(new SelectIdleWorkerGoal());
					this.addSubgoal(new OpenBuildMenuGoal());
					this.addSubgoal(new PlaceBuildingGoal("u", cp[0].tileX - 2, cp[0].tileY));
				}
			}
		} else if (canAfford(perception, { fish: 80, salvage: 20 })) {
			// Train a mudfoot: select barracks first, then click train
			this.addSubgoal(new SelectBarracksGoal());
			this.addSubgoal(new ClickTrainButtonGoal("1"));
		}

		if (this.subgoals.length === 0) {
			this.status = GoalStatus.COMPLETED;
		}
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/** Complete objective: move army toward objective markers. */
export class CompleteObjectiveGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		// Reverse execution order: select first, attack second
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/** Scout the map: select a unit and send it exploring. */
export class ScoutMapGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		// Reverse execution order: select first, rightclick-explore second
		this.addSubgoal(new SelectScoutGoal());
		this.addSubgoal(new RightClickUnexploredGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

// ============================================================================
// CONCRETE EVALUATORS
// ============================================================================

/** Highest priority when enemies are near base. */
export class SurviveEvaluator extends PlaytesterGoalEvaluator {
	constructor() {
		super(1.0);
	}

	calculateDesirability(perception: PlayerPerception): number {
		if (isBaseUnderThreat(perception)) {
			return 1.0; // Maximum urgency
		}

		// Slight bias if enemies visible anywhere
		if (perception.visibleEnemyUnits.length > 0) {
			return 0.3;
		}

		return 0.0;
	}

	setGoal(brain: PlaytesterBrain): void {
		// Only add if not already the active goal
		const current = brain.currentSubgoal();
		if (!(current instanceof DefendBaseGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new DefendBaseGoal());
		}
	}
}

/** High priority early game — workers gathering, income structures. */
export class EconomyEvaluator extends PlaytesterGoalEvaluator {
	constructor() {
		super(0.9);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const idleWorkers = countIdleWorkers(perception);
		const { fish, timber } = perception.resources;

		// Very high if workers are idle
		if (idleWorkers > 0) return 0.8;

		// High if low on resources
		if (fish < 100 && timber < 100) return 0.6;

		// Medium baseline — economy always matters
		return 0.3;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof BuildEconomyGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new BuildEconomyGoal());
		}
	}
}

/** Medium priority — build army when economy is stable. */
export class MilitaryEvaluator extends PlaytesterGoalEvaluator {
	constructor() {
		super(0.8);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		const hasBarracks = findBuildings(perception, "barracks").length > 0;

		if (!hasBarracks) return 0.1;

		// High if few military units
		if (militaryCount < 3) return 0.7;

		// Medium if some but not many
		if (militaryCount < 6) return 0.5;

		// Low if well-stocked
		return 0.2;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof BuildArmyGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new BuildArmyGoal());
		}
	}
}

/** Push to complete mission objectives when army is ready. */
export class ObjectiveEvaluator extends PlaytesterGoalEvaluator {
	constructor() {
		super(0.7);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);

		// Only push objectives when we have a real army
		if (militaryCount >= 5) return 0.6;
		if (militaryCount >= 3) return 0.4;
		return 0.1;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof CompleteObjectiveGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new CompleteObjectiveGoal());
		}
	}
}

/** Low priority — explore when there's nothing more urgent. */
export class ExplorationEvaluator extends PlaytesterGoalEvaluator {
	constructor() {
		super(0.5);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const explored = explorationProgress(perception);

		// High if we've barely explored
		if (explored < 0.2) return 0.5;

		// Moderate if partial exploration
		if (explored < 0.5) return 0.3;

		// Low if well-explored
		return 0.1;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof ScoutMapGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new ScoutMapGoal());
		}
	}
}

// ============================================================================
// Factory: create a fully wired brain
// ============================================================================

/** Create a standard AIPlaytester brain with all five evaluators. */
export function createPlaytesterBrain(): PlaytesterBrain {
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new SurviveEvaluator());
	brain.addEvaluator(new EconomyEvaluator());
	brain.addEvaluator(new MilitaryEvaluator());
	brain.addEvaluator(new ObjectiveEvaluator());
	brain.addEvaluator(new ExplorationEvaluator());
	return brain;
}
