/**
 * GameWorld Save/Load — Serializes and deserializes bitECS typed-array
 * state for mid-mission save/load roundtrips.
 *
 * Serializes:
 *   - All entity scalar state from bitECS typed arrays
 *   - World session state (resources, objectives, phase, mission ID)
 *   - Runtime queues (orders, production)
 *   - Script tags and entity type index
 *   - Campaign progress and diagnostics references
 *   - Time state (tick, elapsedMs)
 *
 * Does NOT serialize:
 *   - Yuka steering agents (reconstructed after load)
 *   - Nav graphs (reconstructed from mission data)
 *   - Boss configs (reconstructed from mission scenarios)
 *   - Fog grid (reconstructed and fog system re-runs)
 *
 * The save format is a JSON blob stored via SqlitePersistenceStore.saveMission().
 */

import {
	Armor,
	Attack,
	Construction,
	ContainerRef,
	Content,
	Facing,
	Faction,
	Flags,
	Health,
	Position,
	ResourceRef,
	Selection,
	Speed,
	SquadRef,
	TargetRef,
	Velocity,
	VisionRadius,
} from "../world/components";
import {
	type GameWorld,
	type Order,
	type ProductionEntry,
	type SessionObjective,
	createGameWorld,
	spawnUnit,
	spawnBuilding,
	spawnResource,
} from "../world/gameWorld";
import type { SeedBundle } from "../random/seed";

/** Serialized representation of a single entity. */
interface SavedEntity {
	eid: number;
	px: number;
	py: number;
	vx: number;
	vy: number;
	facing: number;
	healthCurrent: number;
	healthMax: number;
	armor: number;
	attackDamage: number;
	attackRange: number;
	attackCooldown: number;
	attackTimer: number;
	speed: number;
	visionRadius: number;
	factionId: number;
	unitId: number;
	buildingId: number;
	resourceId: number;
	categoryId: number;
	selected: number;
	isBuilding: number;
	isProjectile: number;
	isResource: number;
	canSwim: number;
	submerged: number;
	stealthed: number;
	constructionProgress: number;
	constructionBuildTime: number;
	targetRefEid: number;
	resourceRefEid: number;
	containerRefEid: number;
	squadRefId: number;
	entityType: string | undefined;
	scriptId: string | undefined;
	orders: Order[];
	productionQueue: ProductionEntry[];
}

/** Full save snapshot. */
export interface GameWorldSnapshot {
	version: 1;
	tick: number;
	elapsedMs: number;
	session: {
		currentMissionId: string | null;
		phase: string;
		objectives: SessionObjective[];
		resources: { fish: number; timber: number; salvage: number };
		dialogue: GameWorld["session"]["dialogue"];
	};
	campaign: {
		currentMissionId: string | null;
		difficulty: string;
	};
	runtime: {
		scenarioPhase: string;
		waveCounter: number;
		weather: string;
		revealedZones: string[];
		lockedZones: string[];
	};
	navigation: {
		width: number;
		height: number;
	};
	entities: SavedEntity[];
	seed: SeedBundle;
}

/**
 * Serialize a GameWorld into a JSON-safe snapshot.
 */
export function serializeGameWorld(world: GameWorld): GameWorldSnapshot {
	const entities: SavedEntity[] = [];

	for (const eid of world.runtime.alive) {
		// Find scriptId for this entity (reverse lookup)
		let scriptId: string | undefined;
		for (const [tag, taggedEid] of world.runtime.scriptTagIndex.entries()) {
			if (taggedEid === eid) {
				scriptId = tag;
				break;
			}
		}

		entities.push({
			eid,
			px: Position.x[eid],
			py: Position.y[eid],
			vx: Velocity.x[eid],
			vy: Velocity.y[eid],
			facing: Facing.radians[eid],
			healthCurrent: Health.current[eid],
			healthMax: Health.max[eid],
			armor: Armor.value[eid],
			attackDamage: Attack.damage[eid],
			attackRange: Attack.range[eid],
			attackCooldown: Attack.cooldown[eid],
			attackTimer: Attack.timer[eid],
			speed: Speed.value[eid],
			visionRadius: VisionRadius.value[eid],
			factionId: Faction.id[eid],
			unitId: Content.unitId[eid],
			buildingId: Content.buildingId[eid],
			resourceId: Content.resourceId[eid],
			categoryId: Content.categoryId[eid],
			selected: Selection.selected[eid],
			isBuilding: Flags.isBuilding[eid],
			isProjectile: Flags.isProjectile[eid],
			isResource: Flags.isResource[eid],
			canSwim: Flags.canSwim[eid],
			submerged: Flags.submerged[eid],
			stealthed: Flags.stealthed[eid],
			constructionProgress: Construction.progress[eid],
			constructionBuildTime: Construction.buildTime[eid],
			targetRefEid: TargetRef.eid[eid],
			resourceRefEid: ResourceRef.eid[eid],
			containerRefEid: ContainerRef.eid[eid],
			squadRefId: SquadRef.id[eid],
			entityType: world.runtime.entityTypeIndex.get(eid),
			scriptId,
			orders: world.runtime.orderQueues.get(eid)?.slice() ?? [],
			productionQueue: world.runtime.productionQueues.get(eid)?.slice() ?? [],
		});
	}

	return {
		version: 1,
		tick: world.time.tick,
		elapsedMs: world.time.elapsedMs,
		session: {
			currentMissionId: world.session.currentMissionId,
			phase: world.session.phase,
			objectives: world.session.objectives.map((o) => ({ ...o })),
			resources: { ...world.session.resources },
			dialogue: world.session.dialogue
				? {
						active: world.session.dialogue.active,
						expiresAtMs: world.session.dialogue.expiresAtMs,
						lines: world.session.dialogue.lines.map((l) => ({ ...l })),
					}
				: null,
		},
		campaign: {
			currentMissionId: world.campaign.currentMissionId,
			difficulty: world.campaign.difficulty,
		},
		runtime: {
			scenarioPhase: world.runtime.scenarioPhase,
			waveCounter: world.runtime.waveCounter,
			weather: world.runtime.weather,
			revealedZones: [...world.runtime.revealedZones],
			lockedZones: [...world.runtime.lockedZones],
		},
		navigation: {
			width: world.navigation.width,
			height: world.navigation.height,
		},
		entities,
		seed: {
			phrase: world.rng.phrase,
			source: world.rng.source,
			numericSeed: world.rng.numericSeed,
			designSeed: world.rng.designSeed,
			gameplaySeeds: { ...world.rng.gameplaySeeds },
		},
	};
}

/**
 * Deserialize a snapshot into a fresh GameWorld.
 * Reconstructs all entity state from saved typed-array values.
 */
export function deserializeGameWorld(snapshot: GameWorldSnapshot): GameWorld {
	const world = createGameWorld(snapshot.seed);

	// Restore time
	world.time.tick = snapshot.tick;
	world.time.elapsedMs = snapshot.elapsedMs;
	world.time.deltaMs = 0; // Will be set by the first tick after load

	// Restore session
	world.session.currentMissionId = snapshot.session.currentMissionId;
	world.session.phase = snapshot.session.phase as GameWorld["session"]["phase"];
	world.session.objectives = snapshot.session.objectives;
	world.session.resources = snapshot.session.resources;
	world.session.dialogue = snapshot.session.dialogue;

	// Restore campaign
	world.campaign.currentMissionId = snapshot.campaign.currentMissionId;
	world.campaign.difficulty = snapshot.campaign.difficulty as GameWorld["campaign"]["difficulty"];

	// Restore runtime state
	world.runtime.scenarioPhase = snapshot.runtime.scenarioPhase;
	world.runtime.waveCounter = snapshot.runtime.waveCounter;
	world.runtime.weather = snapshot.runtime.weather as GameWorld["runtime"]["weather"];
	world.runtime.revealedZones = new Set(snapshot.runtime.revealedZones);
	world.runtime.lockedZones = new Set(snapshot.runtime.lockedZones);

	// Restore navigation
	world.navigation.width = snapshot.navigation.width;
	world.navigation.height = snapshot.navigation.height;

	// Restore entities
	for (const saved of snapshot.entities) {
		let eid: number;

		// Spawn entity of the correct type
		if (saved.isBuilding) {
			eid = spawnBuilding(world, {
				x: saved.px,
				y: saved.py,
				faction: factionIdToString(saved.factionId),
				buildingType: saved.entityType,
				health: { current: saved.healthCurrent, max: saved.healthMax },
				construction: {
					progress: saved.constructionProgress,
					buildTime: saved.constructionBuildTime,
				},
				scriptId: saved.scriptId,
			});
		} else if (saved.isResource) {
			eid = spawnResource(world, {
				x: saved.px,
				y: saved.py,
				resourceType: saved.entityType,
				scriptId: saved.scriptId,
			});
		} else {
			eid = spawnUnit(world, {
				x: saved.px,
				y: saved.py,
				faction: factionIdToString(saved.factionId),
				unitType: saved.entityType,
				health: { current: saved.healthCurrent, max: saved.healthMax },
				scriptId: saved.scriptId,
			});
		}

		// Restore all component values
		Velocity.x[eid] = saved.vx;
		Velocity.y[eid] = saved.vy;
		Facing.radians[eid] = saved.facing;
		Armor.value[eid] = saved.armor;
		Attack.damage[eid] = saved.attackDamage;
		Attack.range[eid] = saved.attackRange;
		Attack.cooldown[eid] = saved.attackCooldown;
		Attack.timer[eid] = saved.attackTimer;
		Speed.value[eid] = saved.speed;
		VisionRadius.value[eid] = saved.visionRadius;
		Content.unitId[eid] = saved.unitId;
		Content.buildingId[eid] = saved.buildingId;
		Content.resourceId[eid] = saved.resourceId;
		Content.categoryId[eid] = saved.categoryId;
		Selection.selected[eid] = saved.selected;
		Flags.canSwim[eid] = saved.canSwim;
		Flags.submerged[eid] = saved.submerged;
		Flags.stealthed[eid] = saved.stealthed;
		TargetRef.eid[eid] = saved.targetRefEid;
		ResourceRef.eid[eid] = saved.resourceRefEid;
		ContainerRef.eid[eid] = saved.containerRefEid;
		SquadRef.id[eid] = saved.squadRefId;

		// Restore orders
		if (saved.orders.length > 0) {
			world.runtime.orderQueues.set(eid, [...saved.orders]);
		}

		// Restore production queue
		if (saved.productionQueue.length > 0) {
			world.runtime.productionQueues.set(eid, [...saved.productionQueue]);
		}
	}

	return world;
}

/** Convert numeric faction ID back to string for spawn functions. */
function factionIdToString(id: number): string {
	switch (id) {
		case 1:
			return "ura";
		case 2:
			return "scale_guard";
		default:
			return "neutral";
	}
}
