/**
 * AI Governor Perception — reads GameWorld state to build a structured snapshot.
 *
 * The governor perceives the world by scanning the ECS alive set and reading
 * bitECS SoA stores + runtime maps. Unlike the old Yuka playtester that
 * simulated screen reading, this governor operates headless and reads
 * world state directly. Fog of war still constrains enemy visibility.
 */

import { CATEGORY_IDS, FACTION_IDS } from "@/engine/content/ids";
import type { FogRuntime } from "@/engine/systems/fogSystem";
import { FOG_VISIBLE } from "@/engine/systems/fogSystem";
import {
	Armor,
	Attack,
	Construction,
	Content,
	Faction,
	Flags,
	Health,
	Position,
	ResourceNode,
	Speed,
} from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Perceived entity types
// ---------------------------------------------------------------------------

export interface PerceivedUnit {
	eid: number;
	unitType: string;
	factionId: number;
	x: number;
	y: number;
	hp: number;
	maxHp: number;
	armor: number;
	damage: number;
	range: number;
	speed: number;
	isGathering: boolean;
	isIdle: boolean;
	isWorker: boolean;
	isMilitary: boolean;
}

export interface PerceivedBuilding {
	eid: number;
	buildingType: string;
	factionId: number;
	x: number;
	y: number;
	hp: number;
	maxHp: number;
	constructionProgress: number;
	isComplete: boolean;
	isTraining: boolean;
	queueLength: number;
}

export interface PerceivedResource {
	eid: number;
	resourceType: string;
	x: number;
	y: number;
	remaining: number;
}

// ---------------------------------------------------------------------------
// World Perception
// ---------------------------------------------------------------------------

export interface WorldPerception {
	/** Game time in ms. */
	elapsedMs: number;
	tick: number;

	/** Player (URA) resources. */
	resources: { fish: number; timber: number; salvage: number };

	/** Population state. */
	population: { current: number; max: number };

	/** Map dimensions in tiles. */
	mapWidth: number;
	mapHeight: number;

	/** All player units. */
	playerUnits: PerceivedUnit[];

	/** Enemy units that are visible (in fog-revealed tiles or no fog). */
	visibleEnemies: PerceivedUnit[];

	/** Player buildings. */
	playerBuildings: PerceivedBuilding[];

	/** Enemy buildings visible. */
	enemyBuildings: PerceivedBuilding[];

	/** Resource nodes. */
	resourceNodes: PerceivedResource[];

	/** Idle player workers (no orders, not gathering). */
	idleWorkers: PerceivedUnit[];

	/** Player military units. */
	militaryUnits: PerceivedUnit[];

	/** Threats: enemy units within threat radius of player buildings. */
	threats: PerceivedUnit[];

	/** Session objectives. */
	objectives: Array<{ id: string; description: string; status: string; bonus?: boolean }>;

	/** Session phase. */
	phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat";
}

const MILITARY_CATEGORIES = new Set<number>([
	CATEGORY_IDS.infantry,
	CATEGORY_IDS.ranged,
	CATEGORY_IDS.siege,
	CATEGORY_IDS.scout,
	CATEGORY_IDS.support,
]);

/** Worker unit types — identified by type string since categoryId may not be set on spawned units. */
const WORKER_TYPES = new Set(["river_rat"]);

/** Military unit types — fallback when categoryId is not set. */
const MILITARY_TYPES = new Set([
	"mudfoot",
	"shellcracker",
	"sapper",
	"mortar_otter",
	"diver",
	"raftsman",
]);

const THREAT_RADIUS = 256; // pixels

/**
 * Build a complete perception of the GameWorld for the governor.
 */
export function perceiveWorld(world: GameWorld): WorldPerception {
	const playerUnits: PerceivedUnit[] = [];
	const visibleEnemies: PerceivedUnit[] = [];
	const playerBuildings: PerceivedBuilding[] = [];
	const enemyBuildings: PerceivedBuilding[] = [];
	const resourceNodes: PerceivedResource[] = [];

	const fogGrid = (world.runtime as FogRuntime).fogGrid ?? null;
	const fogWidth = world.navigation.width;

	for (const eid of world.runtime.alive) {
		const fid = Faction.id[eid];
		const x = Position.x[eid];
		const y = Position.y[eid];

		if (Flags.isResource[eid] === 1) {
			const remaining = ResourceNode.remaining[eid];
			// Resources with remaining < 0 are depleted.
			// Resources with remaining == 0 may be uninitialized (treat as harvestable).
			if (remaining < 0) continue;
			const resType = world.runtime.entityTypeIndex.get(eid) ?? "unknown";
			resourceNodes.push({
				eid,
				resourceType: resType,
				x,
				y,
				remaining: remaining > 0 ? remaining : 9999,
			});
			continue;
		}

		if (Flags.isBuilding[eid] === 1) {
			const buildingType = world.runtime.entityTypeIndex.get(eid) ?? "unknown";
			const progress = Construction.progress[eid];
			const queue = world.runtime.productionQueues.get(eid);
			const building: PerceivedBuilding = {
				eid,
				buildingType,
				factionId: fid,
				x,
				y,
				hp: Health.current[eid],
				maxHp: Health.max[eid],
				constructionProgress: progress,
				isComplete: progress >= 100,
				isTraining: queue !== undefined && queue.length > 0,
				queueLength: queue?.length ?? 0,
			};
			if (fid === FACTION_IDS.ura) {
				playerBuildings.push(building);
			} else if (isVisible(fogGrid, fogWidth, x, y)) {
				enemyBuildings.push(building);
			}
			continue;
		}

		// Projectile — skip
		if (Flags.isProjectile[eid] === 1) continue;

		// Unit
		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "unknown";
		const catId = Content.categoryId[eid];
		const orders = world.runtime.orderQueues.get(eid);
		const hasOrders = orders !== undefined && orders.length > 0;
		// Identify workers by categoryId OR unit type (categoryId may be 0 from bootstrap)
		const isWorker =
			catId === CATEGORY_IDS.worker ||
			WORKER_TYPES.has(unitType) ||
			(world.runtime.entityAbilities.get(eid)?.includes("gather") ?? false);
		const isMilitary = MILITARY_CATEGORIES.has(catId) || MILITARY_TYPES.has(unitType);
		const isGathering = hasOrders && orders[0].type === "gather";

		const unit: PerceivedUnit = {
			eid,
			unitType,
			factionId: fid,
			x,
			y,
			hp: Health.current[eid],
			maxHp: Health.max[eid],
			armor: Armor.value[eid],
			damage: Attack.damage[eid],
			range: Attack.range[eid],
			speed: Speed.value[eid],
			isGathering,
			isIdle: !hasOrders,
			isWorker,
			isMilitary,
		};

		if (fid === FACTION_IDS.ura) {
			playerUnits.push(unit);
		} else if (isVisible(fogGrid, fogWidth, x, y)) {
			visibleEnemies.push(unit);
		}
	}

	// Derived sets
	const idleWorkers = playerUnits.filter((u) => u.isWorker && u.isIdle);
	const militaryUnits = playerUnits.filter((u) => u.isMilitary);

	// Threats: enemies within THREAT_RADIUS of any player building
	const threats: PerceivedUnit[] = [];
	for (const enemy of visibleEnemies) {
		for (const building of playerBuildings) {
			const dx = enemy.x - building.x;
			const dy = enemy.y - building.y;
			if (dx * dx + dy * dy <= THREAT_RADIUS * THREAT_RADIUS) {
				threats.push(enemy);
				break;
			}
		}
	}

	return {
		elapsedMs: world.time.elapsedMs,
		tick: world.time.tick,
		resources: { ...world.session.resources },
		population: { ...world.runtime.population },
		mapWidth: world.navigation.width,
		mapHeight: world.navigation.height,
		playerUnits,
		visibleEnemies,
		playerBuildings,
		enemyBuildings,
		resourceNodes,
		idleWorkers,
		militaryUnits,
		threats,
		objectives: world.session.objectives.map((o) => ({ ...o })),
		phase: world.session.phase,
	};
}

/**
 * Check if a position is visible through fog of war.
 * Returns true if no fog grid exists (headless, full visibility).
 */
function isVisible(
	fogGrid: Uint8Array | null,
	fogWidth: number,
	worldX: number,
	worldY: number,
): boolean {
	if (!fogGrid || fogWidth <= 0) return true;
	const tileX = Math.floor(worldX / 32);
	const tileY = Math.floor(worldY / 32);
	if (tileX < 0 || tileY < 0) return false;
	const idx = tileY * fogWidth + tileX;
	if (idx >= fogGrid.length) return false;
	// Visible (2) or Explored (1) — governor can see explored enemy buildings
	return fogGrid[idx] >= FOG_VISIBLE;
}
