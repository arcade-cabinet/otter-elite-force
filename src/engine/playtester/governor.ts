/**
 * AI Governor — headless E2E playtester that plays the game via GameWorld.
 *
 * The governor takes a GameWorld and plays the game by:
 * 1. **Perceiving** the world state (scan entities, resources, threats)
 * 2. **Deciding** what to do (based on goals and priorities)
 * 3. **Acting** by pushing orders into entity order queues and production queues
 *
 * Runs purely in Node via the system pipeline. No browser, no canvas, no DOM.
 * Deterministic: same seed + same inputs = same decisions.
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { perceiveWorld, type WorldPerception } from "./perception";
import {
	evaluateGoals,
	createGovernorState,
	GOVERNOR_PROFILES,
	type GovernorProfile,
	type GovernorState,
	type ActionPlan,
} from "./goals";
import { executeAction } from "./actions";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GovernorConfig {
	difficulty: "beginner" | "optimal" | "aggressive";
	missionId: string;
}

export interface GovernorReport {
	ticksRun: number;
	actionsExecuted: number;
	actionsPerType: Record<string, number>;
	timeline: Array<{ tick: number; event: string }>;
}

export interface Governor {
	/** Called each frame to perceive -> decide -> act. */
	tick(): void;
	/** Summary of what the governor did. */
	getReport(): GovernorReport;
	/** Last perception snapshot (for test assertions). */
	getLastPerception(): WorldPerception | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a governor that plays the game headless.
 *
 * The governor reads the GameWorld state each tick, evaluates its goal
 * hierarchy, and pushes orders/production entries directly into the world.
 */
export function createGovernor(world: GameWorld, config: GovernorConfig): Governor {
	const profile: GovernorProfile =
		GOVERNOR_PROFILES[config.difficulty] ?? GOVERNOR_PROFILES.optimal;

	const state: GovernorState = createGovernorState();
	let lastPerception: WorldPerception | null = null;
	let ticksRun = 0;
	let actionsExecuted = 0;
	const actionsPerType: Record<string, number> = {};
	const timeline: Array<{ tick: number; event: string }> = [];

	/** Re-evaluate and act every N ticks to avoid thrashing. */
	const DECISION_INTERVAL = 5;

	return {
		tick(): void {
			ticksRun++;

			// Only make decisions every DECISION_INTERVAL ticks
			if (ticksRun % DECISION_INTERVAL !== 0) return;

			// Skip if game is not playing
			if (world.session.phase !== "playing") return;

			// 1. Perceive
			const perception = perceiveWorld(world);
			lastPerception = perception;

			// 2. Decide
			const plans = evaluateGoals(perception, profile, state);

			// 3. Act
			for (const plan of plans) {
				const success = executeAction(world, plan);
				if (success) {
					actionsExecuted++;
					actionsPerType[plan.type] = (actionsPerType[plan.type] ?? 0) + 1;
					timeline.push({
						tick: world.time.tick,
						event: formatActionEvent(plan),
					});
				}
			}
		},

		getReport(): GovernorReport {
			return {
				ticksRun,
				actionsExecuted,
				actionsPerType: { ...actionsPerType },
				timeline: [...timeline],
			};
		},

		getLastPerception(): WorldPerception | null {
			return lastPerception;
		},
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatActionEvent(plan: ActionPlan): string {
	switch (plan.type) {
		case "assign-gather":
			return `assign-gather: worker ${plan.workerEid} -> resource ${plan.resourceEid}`;
		case "place-building":
			return `place-building: ${plan.buildingType} at (${plan.x}, ${plan.y})`;
		case "train-unit":
			return `train-unit: ${plan.unitType} at building ${plan.buildingEid}`;
		case "attack-move":
			return `attack-move: ${plan.unitEids.length} units -> (${plan.targetX}, ${plan.targetY})`;
		case "defend-position":
			return `defend: ${plan.unitEids.length} units -> (${plan.x}, ${plan.y})`;
		case "scout":
			return `scout: unit ${plan.unitEid} -> (${plan.targetX}, ${plan.targetY})`;
	}
}
