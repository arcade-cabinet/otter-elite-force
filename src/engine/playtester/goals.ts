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
 * 6. Attack    — when army is 5+ military, push toward enemies (prioritizes building destruction objectives)
 * 7. Capture   — move military units into zones required by capture/zone objectives
 */

import type { PerceivedResource, PerceivedUnit, WorldPerception } from "./perception";

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
	{ type: "command_post", cost: { fish: 200, timber: 100, salvage: 0 } },
	{ type: "barracks", cost: { fish: 100, timber: 150, salvage: 0 }, requires: ["command_post"] },
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

	// 2. GATHER — assign idle workers to resources, rebalance if needed
	const gatherActions = evaluateGather(perception, state);
	plans.push(...gatherActions);

	// 3. BUILD — construct next building in priority order
	const buildActions = evaluateBuild(perception, state, profile);
	plans.push(...buildActions);

	// 4. TRAIN — train military units
	const trainActions = evaluateTrain(perception, profile);
	plans.push(...trainActions);

	// 5. SCOUT — send one unit to explore
	const scoutActions = evaluateScout(perception, state);
	plans.push(...scoutActions);

	// 6. ATTACK — push military when army is strong enough (prioritizes destruction objectives)
	const attackActions = evaluateAttack(perception, profile);
	plans.push(...attackActions);

	// 7. CAPTURE — move military to zone-based objectives
	const captureActions = evaluateCapture(perception, profile);
	plans.push(...captureActions);

	return plans;
}

// ---------------------------------------------------------------------------
// Goal: Survive
// ---------------------------------------------------------------------------

function evaluateSurvive(perception: WorldPerception, profile: GovernorProfile): ActionPlan[] {
	// Check if lodge/burrow is under threat
	const lodge = perception.playerBuildings.find((b) => b.buildingType === "burrow" && b.isComplete);

	if (!lodge) return [];

	const lodgeHpRatio = lodge.maxHp > 0 ? lodge.hp / lodge.maxHp : 1;
	const underThreat = perception.threats.length > 0;

	if (!underThreat && lodgeHpRatio >= profile.defendHpThreshold) return [];

	// Pull all military units to defend the lodge
	const militaryEids = perception.militaryUnits.map((u) => u.eid);
	if (militaryEids.length === 0) return [];

	return [{ type: "defend-position", unitEids: militaryEids, x: lodge.x, y: lodge.y }];
}

// ---------------------------------------------------------------------------
// Goal: Gather
// ---------------------------------------------------------------------------

function evaluateGather(perception: WorldPerception, state: GovernorState): ActionPlan[] {
	const plans: ActionPlan[] = [];

	// Determine what resource types are needed for the next build/train priority
	const neededTypes = getNeededResourceTypes(perception);

	// Categorize resource nodes by type
	const nodesByType: Record<string, PerceivedResource[]> = {};
	for (const node of perception.resourceNodes) {
		if (node.remaining <= 0) continue;
		const resType = resolveResourceTypeFromNode(node.resourceType);
		if (resType) {
			if (!nodesByType[resType]) nodesByType[resType] = [];
			nodesByType[resType].push(node);
		}
	}

	// Rebalance: if we critically need a resource type (e.g. salvage for mudfoots)
	// and no idle workers are available, reassign one gathering worker every 500 ticks.
	if (
		perception.idleWorkers.length === 0 &&
		neededTypes.length > 0 &&
		perception.tick - state.lastRebalanceTick >= 500
	) {
		const gatheringWorkers = perception.playerUnits.filter(
			(u) => u.isWorker && u.isGathering && !state.rebalancedWorkers.has(u.eid),
		);

		for (const needed of neededTypes) {
			const currentAmount = perception.resources[needed as keyof typeof perception.resources] ?? 0;
			const buildNeed = getNextBuildCostFor(perception, needed);
			if (currentAmount >= buildNeed && buildNeed > 0) continue;

			const nodes = nodesByType[needed];
			if (!nodes || nodes.length === 0) continue;

			// Check if any rebalanced worker is already heading to this type
			let alreadyAssigned = false;
			for (const wEid of state.rebalancedWorkers) {
				const w = perception.playerUnits.find((u) => u.eid === wEid);
				if (!w) continue;
				// If the rebalanced worker is near (or heading toward) a node of this type
				for (const node of nodes) {
					const dx = w.x - node.x;
					const dy = w.y - node.y;
					if (dx * dx + dy * dy < 200 * 200) {
						alreadyAssigned = true;
						break;
					}
				}
				if (alreadyAssigned) break;
			}
			if (alreadyAssigned) continue;

			// Pick the worker furthest from its current gather location
			if (gatheringWorkers.length > 1) {
				const worker = gatheringWorkers[gatheringWorkers.length - 1];
				const nearestNode = findNearestInList(worker, nodes);
				if (nearestNode) {
					plans.push({
						type: "assign-gather",
						workerEid: worker.eid,
						resourceEid: nearestNode.eid,
					});
					state.rebalancedWorkers.add(worker.eid);
					state.lastRebalanceTick = perception.tick;
				}
			}
		}
		return plans;
	}

	if (perception.idleWorkers.length === 0) return plans;

	// Assign workers: prioritize needed resource types, then nearest
	let workerIdx = 0;
	const workers = [...perception.idleWorkers];

	// First pass: assign one worker per needed resource type that we're short on
	for (const needed of neededTypes) {
		if (workerIdx >= workers.length) break;
		const nodes = nodesByType[needed];
		if (!nodes || nodes.length === 0) continue;

		// Check if we actually need this resource
		const currentAmount = perception.resources[needed as keyof typeof perception.resources] ?? 0;
		const buildNeed = getNextBuildCostFor(perception, needed);
		if (currentAmount >= buildNeed && buildNeed > 0) continue;

		const worker = workers[workerIdx];
		const nearest = findNearestInList(worker, nodes);
		if (nearest) {
			plans.push({
				type: "assign-gather",
				workerEid: worker.eid,
				resourceEid: nearest.eid,
			});
			workerIdx++;
		}
	}

	// Second pass: distribute remaining workers across needed resource types
	// round-robin style to ensure balanced gathering (not all on nearest timber)
	if (neededTypes.length > 0) {
		let ntIdx = 0;
		for (; workerIdx < workers.length; workerIdx++) {
			const worker = workers[workerIdx];
			const needed = neededTypes[ntIdx % neededTypes.length];
			const nodes = nodesByType[needed];
			if (nodes && nodes.length > 0) {
				const nearest = findNearestInList(worker, nodes);
				if (nearest) {
					plans.push({
						type: "assign-gather",
						workerEid: worker.eid,
						resourceEid: nearest.eid,
					});
					ntIdx++;
					continue;
				}
			}
			// Fallback: assign to nearest resource
			const nearest = findNearestResource(worker, perception.resourceNodes);
			if (nearest) {
				plans.push({
					type: "assign-gather",
					workerEid: worker.eid,
					resourceEid: nearest.eid,
				});
			}
			ntIdx++;
		}
	} else {
		// No shortfalls detected — go to nearest resource
		for (; workerIdx < workers.length; workerIdx++) {
			const worker = workers[workerIdx];
			const nearest = findNearestResource(worker, perception.resourceNodes);
			if (nearest) {
				plans.push({
					type: "assign-gather",
					workerEid: worker.eid,
					resourceEid: nearest.eid,
				});
			}
		}
	}

	return plans;
}

/** Determine resource type from a node type string. */
function resolveResourceTypeFromNode(nodeType: string): string | null {
	if (nodeType.includes("fish")) return "fish";
	if (
		nodeType.includes("timber") ||
		nodeType.includes("mangrove") ||
		nodeType.includes("tree") ||
		nodeType.includes("lumber")
	)
		return "timber";
	if (nodeType.includes("salvage") || nodeType.includes("supply") || nodeType.includes("crate"))
		return "salvage";
	return null;
}

/** Core buildings that take priority over training. */
const CORE_BUILDING_TYPES = new Set(["command_post", "barracks"]);

/** Get the resource types needed for the next building or training in priority order. */
function getNeededResourceTypes(perception: WorldPerception): string[] {
	const existingTypes = new Set(perception.playerBuildings.map((b) => b.buildingType));
	const needed: string[] = [];

	// Check core building costs first (command_post, barracks take priority over training)
	for (const priority of BUILD_ORDER) {
		if (!CORE_BUILDING_TYPES.has(priority.type)) continue;
		if (existingTypes.has(priority.type)) continue;
		if (priority.requires) {
			const prereqsMet = priority.requires.every((req) =>
				perception.playerBuildings.some((b) => b.buildingType === req && b.isComplete),
			);
			if (!prereqsMet) continue;
		}

		const cost = priority.cost;
		if (cost.fish > 0 && perception.resources.fish < cost.fish) needed.push("fish");
		if (cost.timber > 0 && perception.resources.timber < cost.timber) needed.push("timber");
		if (cost.salvage > 0 && perception.resources.salvage < cost.salvage) needed.push("salvage");
		if (needed.length > 0) return needed;
		break;
	}

	// Training costs take priority over non-core buildings (fish_trap, watchtower, etc.)
	for (const trainPrio of TRAIN_ORDER) {
		const hasTrainer = perception.playerBuildings.some(
			(b) => b.buildingType === trainPrio.trainedAt && b.isComplete,
		);
		if (!hasTrainer) continue;

		const cost = trainPrio.cost;
		if (cost.fish > 0 && perception.resources.fish < cost.fish && !needed.includes("fish"))
			needed.push("fish");
		if (cost.timber > 0 && perception.resources.timber < cost.timber && !needed.includes("timber"))
			needed.push("timber");
		if (
			cost.salvage > 0 &&
			perception.resources.salvage < cost.salvage &&
			!needed.includes("salvage")
		)
			needed.push("salvage");
		if (needed.length > 0) return needed;
	}

	// Non-core buildings (fish_trap, watchtower, burrow)
	for (const priority of BUILD_ORDER) {
		if (CORE_BUILDING_TYPES.has(priority.type)) continue;
		if (
			existingTypes.has(priority.type) &&
			priority.type !== "fish_trap" &&
			priority.type !== "burrow"
		)
			continue;
		if (priority.requires) {
			const prereqsMet = priority.requires.every((req) =>
				perception.playerBuildings.some((b) => b.buildingType === req && b.isComplete),
			);
			if (!prereqsMet) continue;
		}

		const cost = priority.cost;
		if (cost.fish > 0 && perception.resources.fish < cost.fish) needed.push("fish");
		if (cost.timber > 0 && perception.resources.timber < cost.timber) needed.push("timber");
		if (cost.salvage > 0 && perception.resources.salvage < cost.salvage) needed.push("salvage");
		if (needed.length > 0) return needed;
		break;
	}

	return needed;
}

/** Get the cost of the next building or training for a specific resource type. */
function getNextBuildCostFor(perception: WorldPerception, resourceType: string): number {
	const existingTypes = new Set(perception.playerBuildings.map((b) => b.buildingType));

	for (const priority of BUILD_ORDER) {
		if (
			existingTypes.has(priority.type) &&
			priority.type !== "fish_trap" &&
			priority.type !== "burrow"
		)
			continue;
		if (priority.requires) {
			const prereqsMet = priority.requires.every((req) =>
				perception.playerBuildings.some((b) => b.buildingType === req && b.isComplete),
			);
			if (!prereqsMet) continue;
		}
		const cost = priority.cost[resourceType as keyof typeof priority.cost] ?? 0;
		if (cost > 0) return cost;
	}

	// Check training costs too
	for (const trainPrio of TRAIN_ORDER) {
		const hasTrainer = perception.playerBuildings.some(
			(b) => b.buildingType === trainPrio.trainedAt && b.isComplete,
		);
		if (!hasTrainer) continue;
		const cost = trainPrio.cost[resourceType as keyof typeof trainPrio.cost] ?? 0;
		if (cost > 0) return cost;
	}

	return 0;
}

function findNearestInList(
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
	profile?: GovernorProfile,
): ActionPlan[] {
	// Only build one building at a time; rate-limit to avoid spamming
	const cooldown = profile?.buildCooldownTicks ?? 60;
	if (state.lastBuildTick > 0 && perception.tick - state.lastBuildTick < cooldown) return [];

	// Delay building if there are active resource-gathering objectives that should
	// complete first (e.g. "Gather 150 timber" in Mission 1). This prevents the
	// governor from spending resources on buildings before the scenario trigger fires.
	for (const obj of perception.objectives) {
		if (obj.status !== "active") continue;
		const desc = obj.description.toLowerCase();
		const gatherMatch = desc.match(/gather\s+(\d+)\s+(timber|fish|salvage)/);
		if (gatherMatch) {
			const threshold = Number.parseInt(gatherMatch[1], 10);
			const resourceType = gatherMatch[2] as "timber" | "fish" | "salvage";
			if (perception.resources[resourceType] < threshold) {
				return []; // Don't build yet — complete the gather objective first
			}
		}
	}

	const existingTypes = new Set(perception.playerBuildings.map((b) => b.buildingType));

	// Also track buildings under construction to avoid duplicates
	const underConstruction = new Set(
		perception.playerBuildings.filter((b) => !b.isComplete).map((b) => b.buildingType),
	);

	for (const priority of BUILD_ORDER) {
		// Already have one or building one
		if (
			existingTypes.has(priority.type) &&
			priority.type !== "fish_trap" &&
			priority.type !== "burrow"
		)
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
			// Can't afford this building. If it's a high-priority building
			// (command_post or barracks), save resources instead of spending
			// on lower-priority buildings like fish traps.
			if (priority.type === "command_post" || priority.type === "barracks") {
				return []; // Don't build anything — save resources
			}
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

function evaluateTrain(perception: WorldPerception, profile: GovernorProfile): ActionPlan[] {
	const plans: ActionPlan[] = [];

	// Check population room
	if (perception.population.current >= perception.population.max) return [];

	// Don't train workers while saving for core buildings (command_post + barracks).
	// Training a river_rat costs 50 fish which delays the command_post (200 fish).
	const existingTypes = new Set(perception.playerBuildings.map((b) => b.buildingType));
	const hasCoreBuildings = existingTypes.has("command_post") && existingTypes.has("barracks");

	// First, train workers if below target count
	const workerCount = perception.playerUnits.filter((u) => u.isWorker).length;
	if (workerCount < profile.targetWorkerCount && hasCoreBuildings) {
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

	// Check if there's an active objective requiring a specific unit type
	// (e.g. "Train 3 Mudfoots"). If so, prioritize that unit type and
	// don't train anything else until the objective is met.
	let requiredUnitType: string | null = null;
	let requiredUnitCount = 0;
	for (const obj of perception.objectives) {
		if (obj.status !== "active") continue;
		const desc = obj.description.toLowerCase();
		const trainMatch = desc.match(/train\s+(\d+)\s+(\w+)/);
		if (trainMatch) {
			requiredUnitCount = Number.parseInt(trainMatch[1], 10);
			requiredUnitType = trainMatch[2].replace(/s$/, ""); // "mudfoots" -> "mudfoot"
			break;
		}
	}

	// Train military units
	for (const trainPrio of TRAIN_ORDER) {
		// If there's a required unit objective, skip non-matching unit types
		// until we've trained enough of the required type
		if (requiredUnitType && trainPrio.unitType !== requiredUnitType) {
			const currentCount = perception.playerUnits.filter(
				(u) => u.unitType === requiredUnitType,
			).length;
			if (currentCount < requiredUnitCount) {
				continue; // Skip — save resources for the required unit type
			}
		}

		const productionBuilding = perception.playerBuildings.find(
			(b) => b.buildingType === trainPrio.trainedAt && b.isComplete && !b.isTraining,
		);
		if (!productionBuilding) continue;

		const res = perception.resources;
		if (
			res.fish < trainPrio.cost.fish ||
			res.timber < trainPrio.cost.timber ||
			res.salvage < trainPrio.cost.salvage
		) {
			// Can't afford this unit — if it's the required type, don't train anything else
			if (requiredUnitType && trainPrio.unitType === requiredUnitType) {
				return plans; // Wait for resources to accumulate
			}
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

function evaluateScout(perception: WorldPerception, state: GovernorState): ActionPlan[] {
	// Only scout every 300 ticks
	if (state.lastScoutTick > 0 && perception.tick - state.lastScoutTick < 300) return [];

	// Find an idle military unit to scout with
	const idleMilitary = perception.militaryUnits.find((u) => u.isIdle);
	if (!idleMilitary) return [];

	// Pick a target: try to find unexplored areas
	// Use a simple strategy: move toward map quadrants we haven't sent scouts to
	const quadrants = state.scoutedQuadrants;
	const cx = (perception.mapWidth * 32) / 2;
	const cy = (perception.mapHeight * 32) / 2;

	const targets: Array<{ x: number; y: number; quadrant: number }> = [
		{ x: cx * 0.5, y: cy * 0.5, quadrant: 0 }, // NW
		{ x: cx * 1.5, y: cy * 0.5, quadrant: 1 }, // NE
		{ x: cx * 0.5, y: cy * 1.5, quadrant: 2 }, // SW
		{ x: cx * 1.5, y: cy * 1.5, quadrant: 3 }, // SE
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

/** Building types that objectives may reference for destruction. */
const DESTRUCTION_KEYWORDS: Record<string, string[]> = {
	flag_post: ["flag", "flag_post", "hilltop"],
	fuel_tank: ["fuel", "fuel_tank", "siphon", "tank", "depot"],
	radio_tower: ["radio", "radio_tower"],
	watchtower: ["watchtower", "watch_tower"],
	venom_spire: ["venom", "venom_spire", "spire"],
};

/**
 * Check active objectives for destruction targets and return the building type
 * the governor should prioritize attacking.
 */
function getDestructionTargetType(objectives: WorldPerception["objectives"]): string | null {
	for (const obj of objectives) {
		if (obj.status !== "active") continue;
		const desc = obj.description.toLowerCase();
		// Check for "destroy" keyword in objective description
		if (!desc.includes("destroy")) continue;
		for (const [buildingType, keywords] of Object.entries(DESTRUCTION_KEYWORDS)) {
			for (const kw of keywords) {
				if (desc.includes(kw)) return buildingType;
			}
		}
	}
	return null;
}

function evaluateAttack(perception: WorldPerception, profile: GovernorProfile): ActionPlan[] {
	if (perception.militaryUnits.length < profile.attackThreshold) return [];

	// Find a target: check destruction objectives first, then visible enemy buildings, then units
	// Default to map center if no targets found
	let targetX: number = perception.mapWidth * 16;
	let targetY: number = perception.mapHeight * 16;

	// Task 3: Check if any active objective requires destroying a specific building type
	const destructionTarget = getDestructionTargetType(perception.objectives);
	let foundPriorityTarget = false;

	if (destructionTarget && perception.enemyBuildings.length > 0) {
		// Find the nearest enemy building of the target type
		const targetBuildings = perception.enemyBuildings.filter(
			(b) => b.buildingType === destructionTarget,
		);
		if (targetBuildings.length > 0) {
			// Pick the nearest one to our army centroid
			const armyCx =
				perception.militaryUnits.reduce((sum, u) => sum + u.x, 0) / perception.militaryUnits.length;
			const armyCy =
				perception.militaryUnits.reduce((sum, u) => sum + u.y, 0) / perception.militaryUnits.length;
			let bestDist = Infinity;
			let bestTarget = targetBuildings[0];
			for (const b of targetBuildings) {
				const dx = b.x - armyCx;
				const dy = b.y - armyCy;
				const dist = dx * dx + dy * dy;
				if (dist < bestDist) {
					bestDist = dist;
					bestTarget = b;
				}
			}
			targetX = bestTarget.x;
			targetY = bestTarget.y;
			foundPriorityTarget = true;
		}
	}

	if (!foundPriorityTarget) {
		if (perception.enemyBuildings.length > 0) {
			const target = perception.enemyBuildings[0];
			targetX = target.x;
			targetY = target.y;
		} else if (perception.visibleEnemies.length > 0) {
			// Pick weakest enemy
			const weakest = perception.visibleEnemies.reduce((a, b) => (a.hp < b.hp ? a : b));
			targetX = weakest.x;
			targetY = weakest.y;
		} else {
			// No visible targets — move toward map center (or known enemy area)
			targetX = perception.mapWidth * 16;
			targetY = perception.mapHeight * 16;
		}
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
// Goal: Capture — move military units into zones required by objectives
// ---------------------------------------------------------------------------

/** Keywords in objective descriptions that indicate a zone-capture objective. */
const CAPTURE_KEYWORDS = ["capture", "zone", "area", "enter", "hold", "move into", "secure"];

function evaluateCapture(perception: WorldPerception, profile: GovernorProfile): ActionPlan[] {
	if (perception.militaryUnits.length < profile.attackThreshold) return [];

	const idleMilitary = perception.militaryUnits.filter((u) => u.isIdle);
	if (idleMilitary.length === 0) return [];

	// Scan active objectives for capture/zone keywords
	for (const obj of perception.objectives) {
		if (obj.status !== "active") continue;
		const desc = obj.description.toLowerCase();

		const isCaptureObjective = CAPTURE_KEYWORDS.some((kw) => desc.includes(kw));
		if (!isCaptureObjective) continue;

		// Try to match the objective to a zone by checking if any zone name
		// appears in the objective ID or description
		for (const zone of perception.zones) {
			const zoneNameNormalized = zone.id.replace(/_/g, " ").toLowerCase();
			const objIdNormalized = obj.id.replace(/-/g, " ").toLowerCase();

			if (desc.includes(zoneNameNormalized) || objIdNormalized.includes(zoneNameNormalized)) {
				// Found a matching zone — move idle military to its center
				const centerX = zone.x + zone.width / 2;
				const centerY = zone.y + zone.height / 2;

				return [
					{
						type: "attack-move",
						unitEids: idleMilitary.map((u) => u.eid),
						targetX: centerX,
						targetY: centerY,
					},
				];
			}
		}

		// If no zone name match, try matching common zone keywords in the description
		// (e.g. "Capture Hilltop Charlie" -> look for zone containing "charlie")
		const words = desc.split(/\s+/);
		for (const zone of perception.zones) {
			const zoneWords = zone.id.split("_");
			const matched = zoneWords.some((zw) => zw.length > 3 && words.some((dw) => dw.includes(zw)));
			if (matched) {
				const centerX = zone.x + zone.width / 2;
				const centerY = zone.y + zone.height / 2;

				return [
					{
						type: "attack-move",
						unitEids: idleMilitary.map((u) => u.eid),
						targetX: centerX,
						targetY: centerY,
					},
				];
			}
		}
	}

	return [];
}

// ---------------------------------------------------------------------------
// Governor State (mutable state carried between ticks)
// ---------------------------------------------------------------------------

export interface GovernorState {
	lastBuildTick: number;
	lastScoutTick: number;
	lastRebalanceTick: number;
	/** Worker eids that have been reassigned to gather a critical resource. */
	rebalancedWorkers: Set<number>;
	scoutedQuadrants: Set<number>;
}

export function createGovernorState(): GovernorState {
	return {
		lastBuildTick: 0,
		lastScoutTick: 0,
		lastRebalanceTick: 0,
		rebalancedWorkers: new Set(),
		scoutedQuadrants: new Set(),
	};
}
