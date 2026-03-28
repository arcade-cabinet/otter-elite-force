/**
 * Scenario Engine — Trigger Evaluator & Objective Tracker
 *
 * Evaluates ScenarioTrigger conditions each frame and fires
 * corresponding actions. Tracks objective completion state.
 */

import type {
	ObjectiveStatus,
	Scenario,
	ScenarioTrigger,
	TriggerAction,
	TriggerCondition,
} from "./types";

// ---------------------------------------------------------------------------
// World Query Interface — decouples engine from ECS implementation
// ---------------------------------------------------------------------------

export interface ScenarioWorldQuery {
	/** Elapsed time in seconds since mission start */
	elapsedTime: number;
	/** Count units matching faction and optional unitType */
	countUnits(faction: string, unitType?: string): number;
	/** Count buildings matching faction and optional buildingType */
	countBuildings(faction: string, buildingType?: string): number;
	/** Count units of a faction within a rectangular area */
	countUnitsInArea(
		faction: string,
		area: { x: number; y: number; width: number; height: number },
		unitType?: string,
	): number;
	/** Check if a tagged building has been destroyed */
	isBuildingDestroyed(buildingTag: string): boolean;
	/** Get entity health as percentage (0-100), or null if not found */
	getEntityHealthPercent(entityTag: string): number | null;
	/** Get current amount of a resource from the ResourcePool */
	getResourceAmount(resource: "fish" | "timber" | "salvage"): number;
	/** Optional count of enemy units in a zone. */
	countEnemiesInZone?(zoneId: string, operatorContext?: { faction?: string }): number;
	/** Optional count of buildings in a zone. */
	countBuildingsInZone?(faction: string, zoneId: string, buildingType?: string): number;
	/** Optional entity-destroyed check by tag identity. */
	isEntityDestroyed?(entityTag: string, match?: "first" | "any" | "all"): boolean;
	/** Optional entity destroyed counter. */
	getDestroyedEntityCount?(entityTag: string): number;
	/** Optional wave counter. */
	getWaveCounter?(): number;
	/** Optional convoy-zone entry check. */
	hasConvoyEnteredZone?(zoneId: string, convoyTag?: string): boolean;
}

// ---------------------------------------------------------------------------
// Action Handler — callback for executing trigger actions
// ---------------------------------------------------------------------------

export type ActionHandler = (action: TriggerAction) => void;

// ---------------------------------------------------------------------------
// Scenario Event Types
// ---------------------------------------------------------------------------

export type ScenarioEvent =
	| { type: "objectiveCompleted"; objectiveId: string }
	| { type: "objectiveFailed"; objectiveId: string }
	| { type: "allObjectivesCompleted" }
	| { type: "missionFailed"; reason: string }
	| { type: "triggerFired"; triggerId: string };

export type ScenarioEventListener = (event: ScenarioEvent) => void;

// ---------------------------------------------------------------------------
// Scenario Engine
// ---------------------------------------------------------------------------

export class ScenarioEngine {
	private scenario: Scenario;
	private firedTriggers: Set<string> = new Set();
	private objectiveStatuses: Map<string, ObjectiveStatus> = new Map();
	private actionHandler: ActionHandler;
	private listeners: ScenarioEventListener[] = [];
	private _missionFailed = false;
	private _missionFailReason = "";

	constructor(scenario: Scenario, actionHandler: ActionHandler) {
		this.scenario = scenario;
		this.actionHandler = actionHandler;

		// Initialize objective statuses from scenario definition
		for (const obj of scenario.objectives) {
			this.objectiveStatuses.set(obj.id, obj.status);
		}
	}

	/**
	 * Subscribe to scenario events (objective completion, mission failure, etc.)
	 */
	on(listener: ScenarioEventListener): () => void {
		this.listeners.push(listener);
		return () => {
			const idx = this.listeners.indexOf(listener);
			if (idx >= 0) this.listeners.splice(idx, 1);
		};
	}

	private emit(event: ScenarioEvent): void {
		for (const listener of this.listeners) {
			listener(event);
		}
	}

	/**
	 * Evaluate all triggers against current world state.
	 * Call once per frame from the scenario system.
	 */
	evaluate(world: ScenarioWorldQuery): void {
		if (this._missionFailed) return;

		for (const trigger of this.scenario.triggers) {
			// Skip disabled triggers
			if (trigger.enabled === false) continue;

			// Skip already-fired one-shot triggers
			if (trigger.once && this.firedTriggers.has(trigger.id)) continue;

			if (this.checkCondition(trigger.condition, world)) {
				this.fireTrigger(trigger);
			}
		}
	}

	/**
	 * Check whether a single condition is satisfied.
	 */
	checkCondition(condition: TriggerCondition, world: ScenarioWorldQuery): boolean {
		switch (condition.type) {
			case "timer":
				return world.elapsedTime >= condition.time;

			case "unitCount": {
				const count = world.countUnits(condition.faction, condition.unitType);
				switch (condition.operator) {
					case "gte":
						return count >= condition.count;
					case "lte":
						return count <= condition.count;
					case "eq":
						return count === condition.count;
				}
				return false;
			}

			case "buildingCount": {
				const count = world.countBuildings(condition.faction, condition.buildingType);
				switch (condition.operator) {
					case "gte":
						return count >= condition.count;
					case "lte":
						return count <= condition.count;
					case "eq":
						return count === condition.count;
				}
				return false;
			}

			case "areaEntered": {
				const minUnits = condition.minUnits ?? 1;
				const count = world.countUnitsInArea(condition.faction, condition.area, condition.unitType);
				return count >= minUnits;
			}

			case "buildingDestroyed":
				return world.isBuildingDestroyed(condition.buildingTag);

			case "objectiveComplete":
				return this.objectiveStatuses.get(condition.objectiveId) === "completed";

			case "allObjectivesComplete":
				return this.areAllPrimaryObjectivesComplete();

			case "healthThreshold": {
				const hp = world.getEntityHealthPercent(condition.entityTag);
				if (hp === null) return false;
				return condition.operator === "below"
					? hp < condition.percentage
					: hp > condition.percentage;
			}

			case "resourceThreshold": {
				const amount = world.getResourceAmount(condition.resource);
				switch (condition.operator) {
					case "gte":
						return amount >= condition.amount;
					case "lte":
						return amount <= condition.amount;
					case "eq":
						return amount === condition.amount;
				}
				return false;
			}

			case "entityDestroyed":
				return world.isEntityDestroyed?.(condition.entityTag, condition.match) ?? false;

			case "entityDestroyedCount": {
				const count = world.getDestroyedEntityCount?.(condition.entityTag) ?? 0;
				switch (condition.operator) {
					case "gte":
						return count >= condition.count;
					case "lte":
						return count <= condition.count;
					case "eq":
						return count === condition.count;
				}
				return false;
			}

			case "enemyCountInZone": {
				const count =
					world.countEnemiesInZone?.(condition.zoneId, {
						faction: condition.faction,
					}) ?? 0;
				switch (condition.operator) {
					case "gte":
						return count >= condition.count;
					case "lte":
						return count <= condition.count;
					case "eq":
						return count === condition.count;
				}
				return false;
			}

			case "buildingCountInZone": {
				const count =
					world.countBuildingsInZone?.(
						condition.faction,
						condition.zoneId,
						condition.buildingType,
					) ?? 0;
				switch (condition.operator) {
					case "gte":
						return count >= condition.count;
					case "lte":
						return count <= condition.count;
					case "eq":
						return count === condition.count;
				}
				return false;
			}

			case "waveCounter": {
				const wave = world.getWaveCounter?.() ?? 0;
				switch (condition.operator) {
					case "gte":
						return wave >= condition.wave;
					case "lte":
						return wave <= condition.wave;
					case "eq":
						return wave === condition.wave;
				}
				return false;
			}

			case "convoyEntersZone":
				return world.hasConvoyEnteredZone?.(condition.zoneId, condition.convoyTag) ?? false;
		}
	}

	/**
	 * Fire a trigger: execute its action(s) and mark as fired.
	 */
	private fireTrigger(trigger: ScenarioTrigger): void {
		if (trigger.once) {
			this.firedTriggers.add(trigger.id);
		}

		const actions = Array.isArray(trigger.action) ? trigger.action : [trigger.action];

		for (const action of actions) {
			this.executeAction(action);
		}

		this.emit({ type: "triggerFired", triggerId: trigger.id });
	}

	/**
	 * Execute a single trigger action.
	 */
	private executeAction(action: TriggerAction): void {
		// Handle objective/mission state changes internally
		if (action.type === "completeObjective") {
			this.completeObjective(action.objectiveId);
		} else if (action.type === "failMission") {
			this._missionFailed = true;
			this._missionFailReason = action.reason;
			this.emit({ type: "missionFailed", reason: action.reason });
		} else if (action.type === "enableTrigger") {
			const target = this.scenario.triggers.find((t) => t.id === action.triggerId);
			if (target) target.enabled = true;
		} else if (action.type === "addObjective") {
			// Add a new objective mid-mission if it doesn't already exist
			const existing = this.objectiveStatuses.get(action.id);
			if (existing === undefined) {
				this.objectiveStatuses.set(action.id, "active");
				this.scenario.objectives.push({
					id: action.id,
					description: action.description,
					type: action.objectiveType,
					status: "active",
				});
			}
		} else if (action.type === "startPhase") {
			// Enable all triggers whose ID starts with the phase prefix
			const phasePrefix = `phase:${action.phase}:`;
			for (const trigger of this.scenario.triggers) {
				if (trigger.id.startsWith(phasePrefix)) {
					trigger.enabled = true;
				}
			}
		}

		// Delegate all actions to the handler (including completeObjective/failMission
		// so the handler can update UI, spawn units, etc.)
		this.actionHandler(action);
	}

	// -----------------------------------------------------------------------
	// Objective tracking
	// -----------------------------------------------------------------------

	completeObjective(objectiveId: string): void {
		const current = this.objectiveStatuses.get(objectiveId);
		if (current === "completed" || current === "failed") return;

		this.objectiveStatuses.set(objectiveId, "completed");
		this.emit({ type: "objectiveCompleted", objectiveId });

		if (this.areAllPrimaryObjectivesComplete()) {
			this.emit({ type: "allObjectivesCompleted" });
		}
	}

	failObjective(objectiveId: string): void {
		const current = this.objectiveStatuses.get(objectiveId);
		if (current === "completed" || current === "failed") return;

		this.objectiveStatuses.set(objectiveId, "failed");
		this.emit({ type: "objectiveFailed", objectiveId });
	}

	getObjectiveStatus(objectiveId: string): ObjectiveStatus | undefined {
		return this.objectiveStatuses.get(objectiveId);
	}

	getObjectives(): Array<{ id: string; status: ObjectiveStatus }> {
		return Array.from(this.objectiveStatuses.entries()).map(([id, status]) => ({ id, status }));
	}

	areAllPrimaryObjectivesComplete(): boolean {
		for (const obj of this.scenario.objectives) {
			if (obj.type === "primary") {
				if (this.objectiveStatuses.get(obj.id) !== "completed") {
					return false;
				}
			}
		}
		return true;
	}

	get isMissionFailed(): boolean {
		return this._missionFailed;
	}

	get missionFailReason(): string {
		return this._missionFailReason;
	}

	/**
	 * Check if a one-shot trigger has already fired.
	 */
	hasTriggerFired(triggerId: string): boolean {
		return this.firedTriggers.has(triggerId);
	}

	/**
	 * Reset engine state (for mission restart).
	 */
	reset(): void {
		this.firedTriggers.clear();
		this._missionFailed = false;
		this._missionFailReason = "";
		for (const obj of this.scenario.objectives) {
			this.objectiveStatuses.set(obj.id, obj.status);
		}
	}
}
