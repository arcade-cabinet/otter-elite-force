/**
 * Headless RTS simulation engine for AI Playtester (US-070)
 *
 * Provides a lightweight game-state simulation that runs without Phaser,
 * Koota, or any DOM. The playtester drives the simulation through its
 * perception-goal-action loop, and the simulation updates state in response.
 *
 * This is used for:
 *   1. Automated Mission 1 playthrough validation
 *   2. Balance testing (US-072)
 *   3. Strategy profile comparison (US-071)
 *
 * The simulation models:
 *   - Resource gathering (workers assigned to nodes)
 *   - Building construction (build queue with timers)
 *   - Unit training (production queue with timers)
 *   - Simple combat (damage = max(1, atk - armor))
 *   - Mission objective tracking
 */

import type {
	PlayerPerception,
	VisibleBuildingInfo,
	VisibleResourceInfo,
	VisibleUnitInfo,
} from "./perception";

// ---------------------------------------------------------------------------
// Simulation entity types
// ---------------------------------------------------------------------------

export interface SimUnit {
	id: number;
	unitType: string;
	faction: string;
	tileX: number;
	tileY: number;
	hp: number;
	maxHp: number;
	armor: number;
	damage: number;
	range: number;
	speed: number;
	attackCooldown: number;
	attackTimer: number;
	isGathering: boolean;
	hasOrders: boolean;
	alive: boolean;
	/** Target entity id for attack commands. */
	attackTarget: number | null;
	/** Resource target for gather commands. */
	gatherTarget: number | null;
}

export interface SimBuilding {
	id: number;
	unitType: string;
	faction: string;
	tileX: number;
	tileY: number;
	hp: number;
	maxHp: number;
	isTraining: boolean;
	/** Seconds remaining on current training. */
	trainTimer: number;
	/** Queue of unit types to train. */
	trainQueue: string[];
	alive: boolean;
}

export interface SimResource {
	id: number;
	resourceType: string;
	tileX: number;
	tileY: number;
	remaining: number;
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------

export interface SimState {
	units: SimUnit[];
	buildings: SimBuilding[];
	resources: SimResource[];
	playerResources: { fish: number; timber: number; salvage: number };
	population: { current: number; max: number };
	gameTime: number;
	mapCols: number;
	mapRows: number;
	objectivesCompleted: Set<string>;
	nextEntityId: number;
	outcome: "playing" | "victory" | "defeat" | "timeout";
}

// ---------------------------------------------------------------------------
// Unit stat definitions (inline for headless simulation)
// ---------------------------------------------------------------------------

interface UnitStats {
	hp: number;
	armor: number;
	damage: number;
	range: number;
	speed: number;
	attackCooldown: number;
	populationCost: number;
	cost: { fish?: number; timber?: number; salvage?: number };
	trainTime: number;
}

const UNIT_STATS: Record<string, UnitStats> = {
	river_rat: {
		hp: 40,
		armor: 0,
		damage: 5,
		range: 1,
		speed: 10,
		attackCooldown: 1.0,
		populationCost: 1,
		cost: { fish: 50 },
		trainTime: 15,
	},
	mudfoot: {
		hp: 80,
		armor: 2,
		damage: 12,
		range: 1,
		speed: 8,
		attackCooldown: 1.2,
		populationCost: 1,
		cost: { fish: 80, salvage: 20 },
		trainTime: 20,
	},
	shellcracker: {
		hp: 50,
		armor: 0,
		damage: 10,
		range: 5,
		speed: 9,
		attackCooldown: 1.5,
		populationCost: 1,
		cost: { fish: 70, salvage: 30 },
		trainTime: 22,
	},
	sapper: {
		hp: 60,
		armor: 1,
		damage: 8,
		range: 1,
		speed: 7,
		attackCooldown: 2.0,
		populationCost: 1,
		cost: { fish: 100, salvage: 50 },
		trainTime: 30,
	},
	mortar_otter: {
		hp: 45,
		armor: 0,
		damage: 20,
		range: 7,
		speed: 5,
		attackCooldown: 3.0,
		populationCost: 1,
		cost: { fish: 80, salvage: 60 },
		trainTime: 35,
	},
	gator: {
		hp: 120,
		armor: 4,
		damage: 18,
		range: 1,
		speed: 5,
		attackCooldown: 1.8,
		populationCost: 1,
		cost: {},
		trainTime: 30,
	},
	viper: {
		hp: 35,
		armor: 0,
		damage: 8,
		range: 5,
		speed: 8,
		attackCooldown: 1.5,
		populationCost: 1,
		cost: {},
		trainTime: 20,
	},
	scout_lizard: {
		hp: 25,
		armor: 0,
		damage: 3,
		range: 1,
		speed: 14,
		attackCooldown: 1.0,
		populationCost: 1,
		cost: {},
		trainTime: 15,
	},
};

const BUILDING_STATS: Record<
	string,
	{
		hp: number;
		buildTime: number;
		cost: { fish?: number; timber?: number; salvage?: number };
		trains?: string[];
		popCapBonus?: number;
	}
> = {
	command_post: {
		hp: 600,
		buildTime: 60,
		cost: { timber: 400, salvage: 200 },
		trains: ["river_rat"],
	},
	barracks: { hp: 350, buildTime: 30, cost: { timber: 200 }, trains: ["mudfoot", "shellcracker"] },
	armory: {
		hp: 400,
		buildTime: 40,
		cost: { timber: 300, salvage: 100 },
		trains: ["sapper", "mortar_otter"],
	},
	burrow: { hp: 100, buildTime: 10, cost: { timber: 80 }, popCapBonus: 6 },
	fish_trap: { hp: 80, buildTime: 15, cost: { timber: 100 } },
	watchtower: { hp: 200, buildTime: 20, cost: { timber: 150 } },
	sandbag_wall: { hp: 150, buildTime: 5, cost: { timber: 50 } },
};

// ---------------------------------------------------------------------------
// Simulation factory
// ---------------------------------------------------------------------------

/** Create Mission 1 simulation state. */
export function createMission1Sim(): SimState {
	const state: SimState = {
		units: [],
		buildings: [],
		resources: [],
		playerResources: { fish: 100, timber: 50, salvage: 0 },
		population: { current: 3, max: 4 },
		gameTime: 0,
		mapCols: 48,
		mapRows: 44,
		objectivesCompleted: new Set(),
		nextEntityId: 1,
		outcome: "playing",
	};

	// Spawn 3 river rats
	for (let i = 0; i < 3; i++) {
		state.units.push(createUnit(state, "river_rat", "ura", 10 + i, 38));
	}

	// Spawn resources
	state.resources.push(
		{ id: state.nextEntityId++, resourceType: "fish", tileX: 14, tileY: 18, remaining: 500 },
		{ id: state.nextEntityId++, resourceType: "fish", tileX: 10, tileY: 19, remaining: 500 },
		{ id: state.nextEntityId++, resourceType: "timber", tileX: 4, tileY: 30, remaining: 800 },
		{ id: state.nextEntityId++, resourceType: "timber", tileX: 6, tileY: 32, remaining: 800 },
		{ id: state.nextEntityId++, resourceType: "timber", tileX: 8, tileY: 30, remaining: 800 },
		{ id: state.nextEntityId++, resourceType: "salvage", tileX: 40, tileY: 8, remaining: 300 },
		{ id: state.nextEntityId++, resourceType: "salvage", tileX: 42, tileY: 10, remaining: 300 },
	);

	return state;
}

function createUnit(
	state: SimState,
	unitType: string,
	faction: string,
	tileX: number,
	tileY: number,
): SimUnit {
	const stats = UNIT_STATS[unitType] ?? {
		hp: 50,
		armor: 0,
		damage: 5,
		range: 1,
		speed: 5,
		attackCooldown: 1.0,
		populationCost: 1,
		cost: {},
		trainTime: 20,
	};
	return {
		id: state.nextEntityId++,
		unitType,
		faction,
		tileX,
		tileY,
		hp: stats.hp,
		maxHp: stats.hp,
		armor: stats.armor,
		damage: stats.damage,
		range: stats.range,
		speed: stats.speed,
		attackCooldown: stats.attackCooldown,
		attackTimer: 0,
		isGathering: false,
		hasOrders: false,
		alive: true,
		attackTarget: null,
		gatherTarget: null,
	};
}

// ---------------------------------------------------------------------------
// Simulation tick
// ---------------------------------------------------------------------------

const GATHER_RATE = 5; // resources per second per worker
const DT = 1.0; // 1 second per tick for fast simulation

/**
 * Advance the simulation by one tick (1 second of game time).
 * Returns updated state.
 */
export function tickSimulation(state: SimState): void {
	state.gameTime += DT;

	// 1. Workers gather resources
	for (const unit of state.units) {
		if (!unit.alive || unit.faction !== "ura") continue;
		if (unit.unitType === "river_rat" && unit.gatherTarget !== null) {
			const resource = state.resources.find((r) => r.id === unit.gatherTarget);
			if (resource && resource.remaining > 0) {
				const amount = Math.min(GATHER_RATE * DT, resource.remaining);
				resource.remaining -= amount;
				unit.isGathering = true;
				const rType = resource.resourceType as keyof typeof state.playerResources;
				if (rType in state.playerResources) {
					state.playerResources[rType] += amount;
				}
			} else {
				unit.isGathering = false;
				unit.gatherTarget = null;
				unit.hasOrders = false;
			}
		}
	}

	// 2. Buildings train units
	for (const building of state.buildings) {
		if (!building.alive || building.faction !== "ura") continue;
		if (building.trainQueue.length > 0) {
			building.isTraining = true;
			building.trainTimer -= DT;
			if (building.trainTimer <= 0) {
				const unitType = building.trainQueue.shift()!;
				const stats = UNIT_STATS[unitType];
				if (stats && state.population.current < state.population.max) {
					const newUnit = createUnit(
						state,
						unitType,
						"ura",
						building.tileX + 1,
						building.tileY + 1,
					);
					state.units.push(newUnit);
					state.population.current += stats.populationCost;
				}
				// Start next in queue
				if (building.trainQueue.length > 0) {
					const nextType = building.trainQueue[0];
					building.trainTimer = UNIT_STATS[nextType]?.trainTime ?? 20;
				} else {
					building.isTraining = false;
					building.trainTimer = 0;
				}
			}
		}
	}

	// 3. Combat: units with attack targets deal damage
	for (const unit of state.units) {
		if (!unit.alive || unit.attackTarget === null) continue;
		const target = state.units.find((u) => u.id === unit.attackTarget);
		if (!target || !target.alive) {
			unit.attackTarget = null;
			unit.hasOrders = false;
			continue;
		}

		// Check range
		const dx = target.tileX - unit.tileX;
		const dy = target.tileY - unit.tileY;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= unit.range + 0.5) {
			unit.attackTimer += DT;
			if (unit.attackTimer >= unit.attackCooldown) {
				unit.attackTimer = 0;
				const dmg = Math.max(1, unit.damage - target.armor);
				target.hp -= dmg;
				if (target.hp <= 0) {
					target.alive = false;
					unit.attackTarget = null;
					unit.hasOrders = false;
				}
			}
		} else {
			// Move toward target
			const move = unit.speed * DT;
			const angle = Math.atan2(dy, dx);
			unit.tileX += Math.round(Math.cos(angle) * Math.min(move, dist));
			unit.tileY += Math.round(Math.sin(angle) * Math.min(move, dist));
		}
	}

	// 4. Check Mission 1 objectives
	checkMission1Objectives(state);
}

// ---------------------------------------------------------------------------
// Mission 1 objective checking
// ---------------------------------------------------------------------------

function checkMission1Objectives(state: SimState): void {
	const uraBuildings = state.buildings.filter((b) => b.faction === "ura" && b.alive);
	const uraMudfoots = state.units.filter(
		(u) => u.faction === "ura" && u.unitType === "mudfoot" && u.alive,
	);

	if (uraBuildings.some((b) => b.unitType === "command_post")) {
		state.objectivesCompleted.add("build-command-post");
	}
	if (uraBuildings.some((b) => b.unitType === "barracks")) {
		state.objectivesCompleted.add("build-barracks");
	}
	if (uraMudfoots.length >= 4) {
		state.objectivesCompleted.add("train-mudfoots");
	}

	// Victory: all primary objectives complete
	if (
		state.objectivesCompleted.has("build-command-post") &&
		state.objectivesCompleted.has("build-barracks") &&
		state.objectivesCompleted.has("train-mudfoots")
	) {
		state.outcome = "victory";
	}
}

// ---------------------------------------------------------------------------
// Action application — translate playtester actions into sim changes
// ---------------------------------------------------------------------------

/**
 * Interpret high-level playtester intent on the simulation.
 * Instead of dispatching DOM events, we directly mutate sim state
 * based on the brain's current goal and perception.
 */
export function applyPlaytesterIntent(state: SimState, _perception: PlayerPerception): void {
	const uraUnits = state.units.filter((u) => u.faction === "ura" && u.alive);
	const idleWorkers = uraUnits.filter(
		(u) => u.unitType === "river_rat" && !u.isGathering && !u.hasOrders,
	);
	const uraBuildings = state.buildings.filter((b) => b.faction === "ura" && b.alive);

	// Phase 1: Assign idle workers to gather
	for (const worker of idleWorkers) {
		const nearestResource = findNearestSimResource(state, worker.tileX, worker.tileY);
		if (nearestResource) {
			worker.gatherTarget = nearestResource.id;
			worker.hasOrders = true;
		}
	}

	// Phase 2: Build command post if we don't have one
	const hasCommandPost = uraBuildings.some((b) => b.unitType === "command_post");
	if (!hasCommandPost && canAffordSim(state, "command_post")) {
		buildStructure(state, "command_post", 12, 38);
	}

	// Phase 3: Build barracks if we have a command post but no barracks
	const hasBarracks = uraBuildings.some((b) => b.unitType === "barracks");
	if (hasCommandPost && !hasBarracks && canAffordSim(state, "barracks")) {
		buildStructure(state, "barracks", 15, 38);
	}

	// Phase 4: Build burrow for population cap if needed
	const mudfoots = uraUnits.filter((u) => u.unitType === "mudfoot");
	if (hasBarracks && state.population.current >= state.population.max - 1 && mudfoots.length < 4) {
		if (canAffordSim(state, "burrow")) {
			buildStructure(state, "burrow", 18, 38);
		}
	}

	// Phase 5: Train mudfoots if barracks is available and pop room
	if (hasBarracks) {
		const barracks = uraBuildings.find((b) => b.unitType === "barracks");
		if (
			barracks &&
			!barracks.isTraining &&
			state.population.current < state.population.max &&
			mudfoots.length < 4
		) {
			const stats = UNIT_STATS.mudfoot;
			if (
				state.playerResources.fish >= (stats.cost.fish ?? 0) &&
				state.playerResources.salvage >= (stats.cost.salvage ?? 0)
			) {
				state.playerResources.fish -= stats.cost.fish ?? 0;
				state.playerResources.salvage -= stats.cost.salvage ?? 0;
				barracks.trainQueue.push("mudfoot");
				if (!barracks.isTraining) {
					barracks.trainTimer = stats.trainTime;
					barracks.isTraining = true;
				}
			}
		}
	}
}

function findNearestSimResource(state: SimState, fromX: number, fromY: number): SimResource | null {
	let best: SimResource | null = null;
	let bestDist = Infinity;
	for (const r of state.resources) {
		if (r.remaining <= 0) continue;
		const dx = r.tileX - fromX;
		const dy = r.tileY - fromY;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			best = r;
		}
	}
	return best;
}

function canAffordSim(state: SimState, buildingType: string): boolean {
	const stats = BUILDING_STATS[buildingType];
	if (!stats) return false;
	const cost = stats.cost;
	if ((cost.fish ?? 0) > state.playerResources.fish) return false;
	if ((cost.timber ?? 0) > state.playerResources.timber) return false;
	if ((cost.salvage ?? 0) > state.playerResources.salvage) return false;
	return true;
}

function buildStructure(state: SimState, buildingType: string, tileX: number, tileY: number): void {
	const stats = BUILDING_STATS[buildingType];
	if (!stats) return;

	state.playerResources.fish -= stats.cost.fish ?? 0;
	state.playerResources.timber -= stats.cost.timber ?? 0;
	state.playerResources.salvage -= stats.cost.salvage ?? 0;

	const building: SimBuilding = {
		id: state.nextEntityId++,
		unitType: buildingType,
		faction: "ura",
		tileX,
		tileY,
		hp: stats.hp,
		maxHp: stats.hp,
		isTraining: false,
		trainTimer: 0,
		trainQueue: [],
		alive: true,
	};
	state.buildings.push(building);

	// Population cap bonus
	if (stats.popCapBonus) {
		state.population.max += stats.popCapBonus;
	}
}

// ---------------------------------------------------------------------------
// Build perception from sim state (for the brain to read)
// ---------------------------------------------------------------------------

export function buildPerceptionFromSim(state: SimState): PlayerPerception {
	const exploredTiles = new Set<string>();
	const visibleTiles = new Set<string>();

	// All tiles explored and visible in headless sim
	for (let y = 0; y < state.mapRows; y++) {
		for (let x = 0; x < state.mapCols; x++) {
			exploredTiles.add(`${x},${y}`);
			visibleTiles.add(`${x},${y}`);
		}
	}

	const visibleFriendlyUnits: VisibleUnitInfo[] = [];
	const visibleEnemyUnits: VisibleUnitInfo[] = [];
	const visibleBuildings: VisibleBuildingInfo[] = [];
	const visibleResources: VisibleResourceInfo[] = [];

	for (const u of state.units) {
		if (!u.alive) continue;
		const info: VisibleUnitInfo = {
			entityId: u.id,
			unitType: u.unitType,
			faction: u.faction,
			tileX: u.tileX,
			tileY: u.tileY,
			hp: u.hp,
			maxHp: u.maxHp,
			armor: u.armor,
			damage: u.damage,
			range: u.range,
			speed: u.speed,
			isGathering: u.isGathering,
			hasOrders: u.hasOrders,
		};
		if (u.faction === "ura") {
			visibleFriendlyUnits.push(info);
		} else {
			visibleEnemyUnits.push(info);
		}
	}

	for (const b of state.buildings) {
		if (!b.alive) continue;
		visibleBuildings.push({
			entityId: b.id,
			unitType: b.unitType,
			faction: b.faction,
			tileX: b.tileX,
			tileY: b.tileY,
			hp: b.hp,
			maxHp: b.maxHp,
			isTraining: b.isTraining,
			queueLength: b.trainQueue.length,
		});
	}

	for (const r of state.resources) {
		if (r.remaining <= 0) continue;
		visibleResources.push({
			entityId: r.id,
			resourceType: r.resourceType,
			tileX: r.tileX,
			tileY: r.tileY,
			remaining: r.remaining,
		});
	}

	return {
		viewport: { x: 0, y: 0, width: 1536, height: 1408 },
		exploredTiles,
		visibleTiles,
		resources: { ...state.playerResources },
		population: { ...state.population },
		selectedUnits: [],
		selectedBuildings: [],
		visibleFriendlyUnits,
		visibleEnemyUnits,
		visibleBuildings,
		visibleResources,
		minimapDots: [],
		gameTime: state.gameTime,
		mapCols: state.mapCols,
		mapRows: state.mapRows,
	};
}

// ---------------------------------------------------------------------------
// Simulation log entry
// ---------------------------------------------------------------------------

export interface SimLogEntry {
	tick: number;
	gameTime: number;
	event: string;
	details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Run full Mission 1 simulation
// ---------------------------------------------------------------------------

export interface Mission1Result {
	outcome: "victory" | "defeat" | "timeout";
	gameTimeSeconds: number;
	ticks: number;
	objectivesCompleted: string[];
	log: SimLogEntry[];
	finalState: SimState;
}

/**
 * Run a complete Mission 1 playthrough headlessly.
 *
 * @param maxTicks - Maximum ticks before timeout (default: 960 = 16 minutes at 1s/tick)
 * @returns Playthrough result with log and final state
 */
export function runMission1Simulation(maxTicks = 960): Mission1Result {
	const state = createMission1Sim();
	const log: SimLogEntry[] = [];
	let tick = 0;

	log.push({
		tick: 0,
		gameTime: 0,
		event: "mission_start",
		details: { units: 3, resources: state.playerResources },
	});

	while (tick < maxTicks && state.outcome === "playing") {
		tick++;

		// Snapshot objectives before this tick
		const prevCompleted = new Set(state.objectivesCompleted);

		// Build perception
		const perception = buildPerceptionFromSim(state);

		// Apply AI playtester intent
		applyPlaytesterIntent(state, perception);

		// Tick simulation (includes objective checking)
		tickSimulation(state);

		// Log newly completed objectives
		for (const obj of state.objectivesCompleted) {
			if (!prevCompleted.has(obj)) {
				log.push({
					tick,
					gameTime: state.gameTime,
					event: "objective_complete",
					details: { objective: obj },
				});
			}
		}
	}

	if (state.outcome === "playing") {
		state.outcome = "timeout";
	}

	log.push({
		tick,
		gameTime: state.gameTime,
		event: "mission_end",
		details: {
			outcome: state.outcome,
			objectives: [...state.objectivesCompleted],
			resources: state.playerResources,
			unitCount: state.units.filter((u) => u.alive && u.faction === "ura").length,
		},
	});

	return {
		outcome: state.outcome,
		gameTimeSeconds: state.gameTime,
		ticks: tick,
		objectivesCompleted: [...state.objectivesCompleted],
		log,
		finalState: state,
	};
}

// ---------------------------------------------------------------------------
// Balance combat simulation (headless, no Phaser — US-072)
// ---------------------------------------------------------------------------

export interface CombatSimUnit {
	id: string;
	unitType: string;
	hp: number;
	maxHp: number;
	armor: number;
	damage: number;
	/** Bonus damage vs buildings (Sapper-specific). */
	damageVsBuildings?: number;
	range: number;
	speed: number;
	cooldown: number;
	timer: number;
	alive: boolean;
}

export interface CombatSimBuilding {
	id: string;
	buildingType: string;
	hp: number;
	maxHp: number;
	armor: number;
	alive: boolean;
}

export interface CombatResult {
	winner: "teamA" | "teamB" | "draw";
	teamASurvivors: number;
	teamBSurvivors: number;
	teamATotalHpRemaining: number;
	teamBTotalHpRemaining: number;
	totalTicks: number;
	margin: number;
	log: string[];
}

function combatEntityFromStats(unitType: string, index: number): CombatSimUnit {
	const stats = UNIT_STATS[unitType];
	if (!stats) throw new Error(`Unknown unit type: ${unitType}`);
	return {
		id: `${unitType}_${index}`,
		unitType,
		hp: stats.hp,
		maxHp: stats.hp,
		armor: stats.armor,
		damage: stats.damage,
		range: stats.range,
		speed: stats.speed,
		cooldown: stats.attackCooldown,
		timer: 0,
		alive: true,
	};
}

/**
 * Simulate group combat between two teams.
 * TeamA uses focus fire (good micro), TeamB uses distributed fire.
 */
export function simulateGroupCombat(teamATypes: string[], teamBTypes: string[]): CombatResult {
	const teamA = teamATypes.map((t, i) => combatEntityFromStats(t, i));
	const teamB = teamBTypes.map((t, i) => combatEntityFromStats(t, i));
	const log: string[] = [];

	const dt = 0.1;
	let totalTicks = 0;
	const MAX_TICKS = 20000;

	while (totalTicks < MAX_TICKS) {
		totalTicks++;

		const aliveA = teamA.filter((u) => u.alive);
		const aliveB = teamB.filter((u) => u.alive);

		if (aliveA.length === 0 || aliveB.length === 0) break;

		// Advance timers
		for (const u of [...aliveA, ...aliveB]) {
			u.timer += dt;
		}

		// Team A: focus fire on first alive enemy
		for (const unit of aliveA) {
			if (unit.timer < unit.cooldown) continue;
			unit.timer = 0;
			const target = teamB.find((u) => u.alive);
			if (target) {
				const dmg = Math.max(1, unit.damage - target.armor);
				target.hp -= dmg;
				if (target.hp <= 0) {
					target.alive = false;
					log.push(`[t=${(totalTicks * dt).toFixed(1)}s] ${unit.id} killed ${target.id}`);
				}
			}
		}

		// Team B: distributed fire
		const currentAliveA = teamA.filter((u) => u.alive);
		if (currentAliveA.length === 0) break;
		const stillAliveB = teamB.filter((u) => u.alive);
		for (let i = 0; i < stillAliveB.length; i++) {
			const unit = stillAliveB[i];
			if (unit.timer < unit.cooldown) continue;
			unit.timer = 0;
			const target = currentAliveA[i % currentAliveA.length];
			if (target) {
				const dmg = Math.max(1, unit.damage - target.armor);
				target.hp -= dmg;
				if (target.hp <= 0) {
					target.alive = false;
					log.push(`[t=${(totalTicks * dt).toFixed(1)}s] ${unit.id} killed ${target.id}`);
				}
			}
		}
	}

	const survivorsA = teamA.filter((u) => u.alive);
	const survivorsB = teamB.filter((u) => u.alive);
	const hpA = survivorsA.reduce((sum, u) => sum + u.hp, 0);
	const hpB = survivorsB.reduce((sum, u) => sum + u.hp, 0);
	const maxHpA = teamA.reduce((sum, u) => sum + u.maxHp, 0);
	const maxHpB = teamB.reduce((sum, u) => sum + u.maxHp, 0);

	let winner: "teamA" | "teamB" | "draw";
	if (survivorsA.length > 0 && survivorsB.length === 0) {
		winner = "teamA";
	} else if (survivorsB.length > 0 && survivorsA.length === 0) {
		winner = "teamB";
	} else {
		winner = "draw";
	}

	// Margin = winner's remaining HP as fraction of their total max HP
	const margin = winner === "teamA" ? hpA / maxHpA : winner === "teamB" ? hpB / maxHpB : 0;

	return {
		winner,
		teamASurvivors: survivorsA.length,
		teamBSurvivors: survivorsB.length,
		teamATotalHpRemaining: hpA,
		teamBTotalHpRemaining: hpB,
		totalTicks,
		margin,
		log,
	};
}

/**
 * Simulate kiting combat: ranged units maintain distance from melee.
 */
export function simulateKitingCombat(rangedTypes: string[], meleeTypes: string[]): CombatResult {
	const teamA = rangedTypes.map((t, i) => combatEntityFromStats(t, i));
	const teamB = meleeTypes.map((t, i) => combatEntityFromStats(t, i));
	const log: string[] = [];

	// Each ranged unit starts at its max range from the nearest melee
	const maxRange = Math.max(...teamA.map((u) => u.range));
	let distance = maxRange;

	const dt = 0.1;
	let totalTicks = 0;
	const MAX_TICKS = 20000;

	while (totalTicks < MAX_TICKS) {
		totalTicks++;

		const aliveA = teamA.filter((u) => u.alive);
		const aliveB = teamB.filter((u) => u.alive);

		if (aliveA.length === 0 || aliveB.length === 0) break;

		// Melee team closes distance
		const meleeSpeed = Math.max(...aliveB.map((u) => u.speed));
		distance -= meleeSpeed * dt;

		// Ranged team kites back
		const rangedSpeed = Math.max(...aliveA.map((u) => u.speed));
		if (distance < maxRange) {
			distance += rangedSpeed * dt;
			if (distance > maxRange) distance = maxRange;
		}

		// Ranged team fires if in range
		for (const unit of aliveA) {
			unit.timer += dt;
			if (unit.timer >= unit.cooldown && distance <= unit.range) {
				unit.timer = 0;
				const target = teamB.find((u) => u.alive);
				if (target) {
					const dmg = Math.max(1, unit.damage - target.armor);
					target.hp -= dmg;
					if (target.hp <= 0) {
						target.alive = false;
						log.push(
							`[t=${(totalTicks * dt).toFixed(1)}s] ${unit.id} killed ${target.id} (kiting)`,
						);
					}
				}
			}
		}

		// Melee attacks if close enough (distance <= 1)
		if (distance <= 1) {
			for (const unit of aliveB) {
				unit.timer += dt;
				if (unit.timer >= unit.cooldown) {
					unit.timer = 0;
					const target = teamA.find((u) => u.alive);
					if (target) {
						const dmg = Math.max(1, unit.damage - target.armor);
						target.hp -= dmg;
						if (target.hp <= 0) {
							target.alive = false;
							log.push(
								`[t=${(totalTicks * dt).toFixed(1)}s] ${unit.id} killed ${target.id} (melee)`,
							);
						}
					}
				}
			}
		}
	}

	const survivorsA = teamA.filter((u) => u.alive);
	const survivorsB = teamB.filter((u) => u.alive);
	const hpA = survivorsA.reduce((sum, u) => sum + u.hp, 0);
	const hpB = survivorsB.reduce((sum, u) => sum + u.hp, 0);
	const maxHpA = teamA.reduce((sum, u) => sum + u.maxHp, 0);
	const maxHpB = teamB.reduce((sum, u) => sum + u.maxHp, 0);

	let winner: "teamA" | "teamB" | "draw";
	if (survivorsA.length > 0 && survivorsB.length === 0) {
		winner = "teamA";
	} else if (survivorsB.length > 0 && survivorsA.length === 0) {
		winner = "teamB";
	} else {
		winner = "draw";
	}

	const margin = winner === "teamA" ? hpA / maxHpA : winner === "teamB" ? hpB / maxHpB : 0;

	return {
		winner,
		teamASurvivors: survivorsA.length,
		teamBSurvivors: survivorsB.length,
		teamATotalHpRemaining: hpA,
		teamBTotalHpRemaining: hpB,
		totalTicks,
		margin,
		log,
	};
}

/**
 * Simulate siege: units attacking a building.
 */
export function simulateSiege(
	attackerTypes: string[],
	buildingType: string,
	buildingHp: number,
	buildingArmor = 0,
): {
	wallDestroyed: boolean;
	totalTicks: number;
	timeSeconds: number;
	remainingHp: number;
	log: string[];
} {
	const attackers = attackerTypes.map((t, i) => {
		const unit = combatEntityFromStats(t, i);
		// Sappers use damageVsBuildings (30) against buildings
		if (t === "sapper") {
			(unit as CombatSimUnit & { damageVsBuildings?: number }).damageVsBuildings = 30;
		}
		return unit;
	});
	const log: string[] = [];
	let wallHp = buildingHp;

	const dt = 0.1;
	let totalTicks = 0;
	const MAX_TICKS = 20000;

	while (totalTicks < MAX_TICKS && wallHp > 0) {
		totalTicks++;

		for (const unit of attackers) {
			if (!unit.alive) continue;
			unit.timer += dt;
			if (unit.timer >= unit.cooldown) {
				unit.timer = 0;
				const dmg = (unit as CombatSimUnit & { damageVsBuildings?: number }).damageVsBuildings
					? Math.max(
							1,
							((unit as CombatSimUnit & { damageVsBuildings?: number }).damageVsBuildings ??
								unit.damage) - buildingArmor,
						)
					: Math.max(1, unit.damage - buildingArmor);
				wallHp -= dmg;
				if (wallHp <= 0) {
					log.push(`[t=${(totalTicks * dt).toFixed(1)}s] ${unit.id} destroyed ${buildingType}`);
					break;
				}
			}
		}
	}

	return {
		wallDestroyed: wallHp <= 0,
		totalTicks,
		timeSeconds: totalTicks * dt,
		remainingHp: Math.max(0, wallHp),
		log,
	};
}

/**
 * Simulate AoE splash: one mortar shot hitting clustered enemies.
 */
export function simulateMortarSplash(
	mortarDamage: number,
	splashRadius: number,
	targets: Array<{ unitType: string; distance: number }>,
): {
	totalDamageDealt: number;
	targetsHit: number;
	results: Array<{ unitType: string; distance: number; damageDealt: number; hpRemaining: number }>;
} {
	let totalDamage = 0;
	let targetsHit = 0;
	const results: Array<{
		unitType: string;
		distance: number;
		damageDealt: number;
		hpRemaining: number;
	}> = [];

	for (const target of targets) {
		const stats = UNIT_STATS[target.unitType];
		if (!stats) continue;

		if (target.distance <= splashRadius) {
			const dmg = Math.max(1, mortarDamage - stats.armor);
			totalDamage += dmg;
			targetsHit++;
			results.push({
				unitType: target.unitType,
				distance: target.distance,
				damageDealt: dmg,
				hpRemaining: stats.hp - dmg,
			});
		} else {
			results.push({
				unitType: target.unitType,
				distance: target.distance,
				damageDealt: 0,
				hpRemaining: stats.hp,
			});
		}
	}

	return { totalDamageDealt: totalDamage, targetsHit, results };
}
