/**
 * AI Governor Goals — priority-ordered decision system.
 *
 * The governor evaluates goals in priority order. Each goal checks
 * the current perception and returns an action plan (or null if not applicable).
 * The first applicable goal wins.
 *
 * Priority:
 * 1. Survive   — if lodge HP < 50% or enemies near base, pull all units to defend
 * 2. Gather    — keep workers gathering (never idle workers)
 * 3. Build     — construct buildings in priority order
 * 4. Train     — train military units when resources allow
 * 5. Scout     — send 1 unit to explore fog
 * 6. Attack    — when army is 5+ military, push toward enemies
 * 7. Complete  — move toward mission objectives
 */

import type { WorldPerception, PerceivedUnit, PerceivedResource } from "./perception";

// ---------------------------------------------------------------------------
// Action plan types (returned by goals, executed by actions module)
// ---------------------------------------------------------------------------

export type ActionPlan =
	| { type: "assign-gather"; workerEid: number; resourceEid: number }
	| { type: "place-building"; buildingType: string; x: number; y: number }
	| { type: "train-unit"; buildingEid: number; unitType: string }
	| { type: "attack-move"; unitEids: number[]; targetX: number; targetY: number }
	| { type: "defend-position"; unitEids: number[]; x: number; y: number }
	| { type: "scout"; unitEid: number; targetX: number; targetY: number };

// ---------------------------------------------------------------------------
// Difficulty profiles — bias the governor's decision thresholds
// ---------------------------------------------------------------------------

export interface GovernorProfile {
	/** Minimum military units before attacking. */
	attackThreshold: number;
	/** How aggressively to defend (lower = more cautious). */
	defendHpThreshold: number;
	/** Ticks between re-evaluations of building priorities. */
	buildCooldownTicks: number;
	/** Prefer to train workers until this count. */
	targetWorkerCount: number;
}

export const GOVERNOR_PROFILES: Record<string, GovernorProfile> = {
	beginner: {
		attackThreshold: 7,
		defendHpThreshold: 0.6,
		buildCooldownTicks: 120,
		targetWorkerCount: 6,
	},
	optimal: {
		attackThreshold: 5,
		defendHpThreshold: 0.5,
		buildCooldownTicks: 60,
		targetWorkerCount: 5,
	},
	aggressive: {
		attackThreshold: 3,
		defendHpThreshold: 0.3,
		buildCooldownTicks: 30,
		targetWorkerCount: 4,
	},
};

// ---------------------------------------------------------------------------
// Building priority
// ---------------------------------------------------------------------------

interface BuildPriority {
	type: string;
	cost: { fish: number; timber: number; salvage: number };
	/** Building types that must exist before this one. */
	requires?: string[];
}

const BUILD_ORDER: BuildPriority[] = [
	{ type: "command_post", cost: { fish: 0, timber: 400, salvage: 200 } },
	{ type: "barracks", cost: { fish: 0, timber: 200, salvage: 0 }, requires: ["command_post"] },
	{ type: "fish_trap", cost: { fish: 0, timber: 75, salvage: 0 } },
	{ type: "watchtower", cost: { fish: 0, timber: 100, salvage: 50 }, requires: ["command_post"] },
	{ type: "burrow", cost: { fish: 0, timber: 200, salvage: 100 } },
];

// ---------------------------------------------------------------------------
// Training priority
// ---------------------------------------------------------------------------

interface TrainPriority {
	unitType: string;
	trainedAt: string;
	cost: { fish: number; timber: number; salvage: number };
}

const TRAIN_ORDER: TrainPriority[] = [
	{ unitType: "mudfoot", trainedAt: "barracks", cost: { fish: 80, timber: 0, salvage: 20 } },
	{ unitType: "shellcracker", trainedAt: "barracks", cost: { fish: 70, timber: 0, salvage: 30 } },
];

// ---------------------------------------------------------------------------
// Goal evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate all goals in priority order and return a list of action plans.
 * Multiple actions can be returned per tick (e.g. assign all idle workers).
 */
export function evaluateGoals(
	perception: WorldPerception,
	profile: GovernorProfile,
	state: GovernorState,
): ActionPlan[] {
	const plans: ActionPlan[] = [];

	// 1. SURVIVE — defend if base under threat or lodge HP critical
	const surviveActions = evaluateSurvive(perception, profile);
	if (surviveActions.length > 0) {
		return surviveActions; // Survival overrides everything
	}

	// 2. GATHER — assign idle workers to resources
	const gatherActions = evaluateGather(perception);
	plans.push(...gatherActions);

	// 3. BUILD — construct next building in priority order
	const buildActions = evaluateBuild(perception, state);
	plans.push(...buildActions);

	// 4. TRAIN — train military units
	const trainActions = evaluateTrain(perception, profile);
	plans.push(...trainActions);

	// 5. SCOUT — send one unit to explore
	const scoutActions = evaluateScout(perception, state);
	plans.push(...scoutActions);

	// 6. ATTACK — push military when army is strong enough
	const attackActions = evaluateAttack(perception, profile);
	plans.push(...attackActions);

	return plans;
}

// ---------------------------------------------------------------------------
// Goal: Survive
// ---------------------------------------------------------------------------

function evaluateSurvive(
	perception: WorldPerception,
	profile: GovernorProfile,
): ActionPlan[] {
	// Check if lodge/burrow is under threat
	const lodge = perception.playerBuildings.find(
		(b) => b.buildingType === "burrow" && b.isComplete,
	);

	if (!lodge) return [];

	const lodgeHpRatio = lodge.maxHp > 0 ? lodge.hp / lodge.maxHp : 1;
	const underThreat = perception.threats.length > 0;

	if (!underThreat && lodgeHpRatio >= profile.defendHpThreshold) return [];

	// Pull all military units to defend the lodge
	const militaryEids = perception.militaryUnits.map((u) => u.eid);
	if (militaryEids.length === 0) return [];

	return [
		{ type: "defend-position", unitEids: militaryEids, x: lodge.x, y: lodge.y },
	];
}

// ---------------------------------------------------------------------------
// Goal: Gather
// ---------------------------------------------------------------------------

function evaluateGather(perception: WorldPerception): ActionPlan[] {
	const plans: ActionPlan[] = [];

	for (const worker of perception.idleWorkers) {
		const nearest = findNearestResource(worker, perception.resourceNodes);
		if (nearest) {
			plans.push({
				type: "assign-gather",
				workerEid: worker.eid,
				resourceEid: nearest.eid,
			});
		}
	}

	return plans;
}

function findNearestResource(
	unit: PerceivedUnit,
	resources: PerceivedResource[],
): PerceivedResource | null {
	let best: PerceivedResource | null = null;
	let bestDist = Infinity;

	for (const res of resources) {
		if (res.remaining <= 0) continue;
		const dx = res.x - unit.x;
		const dy = res.y - unit.y;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			best = res;
		}
	}

	return best;
}

// ---------------------------------------------------------------------------
// Goal: Build
// ---------------------------------------------------------------------------

function evaluateBuild(
	perception: WorldPerception,
	state: GovernorState,
): ActionPlan[] {
	// Only build one building at a time; rate-limit to avoid spamming
	if (state.lastBuildTick > 0 && perception.tick - state.lastBuildTick < 120) return [];

	const existingTypes = new Set(
		perception.playerBuildings.map((b) => b.buildingType),
	);

	// Also track buildings under construction to avoid duplicates
	const underConstruction = new Set(
		perception.playerBuildings
			.filter((b) => !b.isComplete)
			.map((b) => b.buildingType),
	);

	for (const priority of BUILD_ORDER) {
		// Already have one or building one
		if (existingTypes.has(priority.type) && priority.type !== "fish_trap" && priority.type !== "burrow")
			continue;
		if (underConstruction.has(priority.type)) continue;

		// Check prerequisites
		if (priority.requires) {
			const prereqsMet = priority.requires.every((req) => {
				const building = perception.playerBuildings.find(
					(b) => b.buildingType === req && b.isComplete,
				);
				return building !== undefined;
			});
			if (!prereqsMet) continue;
		}

		// Check if we need a burrow (pop cap about to be reached)
		if (priority.type === "burrow") {
			const popRoom = perception.population.max - perception.population.current;
			if (popRoom > 2) continue; // Still have room
		}

		// Check resources
		const res = perception.resources;
		if (
			res.fish < priority.cost.fish ||
			res.timber < priority.cost.timber ||
			res.salvage < priority.cost.salvage
		) {
			continue;
		}

		// Find placement position near the lodge
		const lodge = perception.playerBuildings.find(
			(b) => b.buildingType === "burrow" && b.isComplete,
		);
		const baseX = lodge ? lodge.x : 40 * 32 + 16;
		const baseY = lodge ? lodge.y : 80 * 32 + 16;

		// Offset from base in a predictable pattern
		const buildingCount = perception.playerBuildings.length;
		const offsetX = ((buildingCount % 4) - 2) * 96;
		const offsetY = (Math.floor(buildingCount / 4) - 1) * 96;

		state.lastBuildTick = perception.tick;

		return [
			{
				type: "place-building",
				buildingType: priority.type,
				x: baseX + offsetX,
				y: baseY + offsetY,
			},
		];
	}

	return [];
}

// ---------------------------------------------------------------------------
// Goal: Train
// ---------------------------------------------------------------------------

function evaluateTrain(
	perception: WorldPerception,
	profile: GovernorProfile,
): ActionPlan[] {
	const plans: ActionPlan[] = [];

	// Check population room
	if (perception.population.current >= perception.population.max) return [];

	// First, train workers if below target count
	const workerCount = perception.playerUnits.filter((u) => u.isWorker).length;
	if (workerCount < profile.targetWorkerCount) {
		const commandPost = perception.playerBuildings.find(
			(b) =>
				(b.buildingType === "command_post" || b.buildingType === "burrow") &&
				b.isComplete &&
				!b.isTraining,
		);
		if (commandPost) {
			// river_rat costs 50 fish
			if (perception.resources.fish >= 50) {
				plans.push({
					type: "train-unit",
					buildingEid: commandPost.eid,
					unitType: "river_rat",
				});
				return plans;
			}
		}
	}

	// Train military units
	for (const trainPrio of TRAIN_ORDER) {
		const productionBuilding = perception.playerBuildings.find(
			(b) =>
				b.buildingType === trainPrio.trainedAt &&
				b.isComplete &&
				!b.isTraining,
		);
		if (!productionBuilding) continue;

		const res = perception.resources;
		if (
			res.fish < trainPrio.cost.fish ||
			res.timber < trainPrio.cost.timber ||
			res.salvage < trainPrio.cost.salvage
		) {
			continue;
		}

		plans.push({
			type: "train-unit",
			buildingEid: productionBuilding.eid,
			unitType: trainPrio.unitType,
		});
		break; // Only train one per tick
	}

	return plans;
}

// ---------------------------------------------------------------------------
// Goal: Scout
// ---------------------------------------------------------------------------

function evaluateScout(
	perception: WorldPerception,
	state: GovernorState,
): ActionPlan[] {
	// Only scout every 300 ticks
	if (state.lastScoutTick > 0 && perception.tick - state.lastScoutTick < 300) return [];

	// Find an idle military unit to scout with
	const idleMilitary = perception.militaryUnits.find(
		(u) => u.isIdle,
	);
	if (!idleMilitary) return [];

	// Pick a target: try to find unexplored areas
	// Use a simple strategy: move toward map quadrants we haven't sent scouts to
	const quadrants = state.scoutedQuadrants;
	const cx = (perception.mapWidth * 32) / 2;
	const cy = (perception.mapHeight * 32) / 2;

	const targets: Array<{ x: number; y: number; quadrant: number }> = [
		{ x: cx * 0.5, y: cy * 0.5, quadrant: 0 },    // NW
		{ x: cx * 1.5, y: cy * 0.5, quadrant: 1 },    // NE
		{ x: cx * 0.5, y: cy * 1.5, quadrant: 2 },    // SW
		{ x: cx * 1.5, y: cy * 1.5, quadrant: 3 },    // SE
	];

	for (const target of targets) {
		if (quadrants.has(target.quadrant)) continue;
		quadrants.add(target.quadrant);
		state.lastScoutTick = perception.tick;
		return [
			{
				type: "scout",
				unitEid: idleMilitary.eid,
				targetX: target.x,
				targetY: target.y,
			},
		];
	}

	// All quadrants scouted — reset and re-scout
	quadrants.clear();
	state.lastScoutTick = perception.tick;
	return [];
}

// ---------------------------------------------------------------------------
// Goal: Attack
// ---------------------------------------------------------------------------

function evaluateAttack(
	perception: WorldPerception,
	profile: GovernorProfile,
): ActionPlan[] {
	if (perception.militaryUnits.length < profile.attackThreshold) return [];

	// Find a target: visible enemy buildings, then visible enemy units
	let targetX: number;
	let targetY: number;

	if (perception.enemyBuildings.length > 0) {
		const target = perception.enemyBuildings[0];
		targetX = target.x;
		targetY = target.y;
	} else if (perception.visibleEnemies.length > 0) {
		// Pick weakest enemy
		const weakest = perception.visibleEnemies.reduce((a, b) =>
			a.hp < b.hp ? a : b,
		);
		targetX = weakest.x;
		targetY = weakest.y;
	} else {
		// No visible targets — move toward map center (or known enemy area)
		targetX = perception.mapWidth * 16;
		targetY = perception.mapHeight * 16;
	}

	const idleMilitary = perception.militaryUnits.filter((u) => u.isIdle);
	if (idleMilitary.length === 0) return [];

	return [
		{
			type: "attack-move",
			unitEids: idleMilitary.map((u) => u.eid),
			targetX,
			targetY,
		},
	];
}

// ---------------------------------------------------------------------------
// Governor State (mutable state carried between ticks)
// ---------------------------------------------------------------------------

export interface GovernorState {
	lastBuildTick: number;
	lastScoutTick: number;
	scoutedQuadrants: Set<number>;
}

export function createGovernorState(): GovernorState {
	return {
		lastBuildTick: 0,
		lastScoutTick: 0,
		scoutedQuadrants: new Set(),
	};
}
