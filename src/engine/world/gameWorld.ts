import { addEntity, createWorld, removeEntity } from "bitecs";
import type { DiagnosticSnapshot } from "../diagnostics/types";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { resolveFactionId } from "../content/ids";
import { createSeedBundle, type SeedBundle } from "../random/seed";
import {
	Attack,
	Construction,
	Content,
	Faction,
	Flags,
	Health,
	Position,
	Selection,
	TargetRef,
} from "./components";

export interface Order {
	type: string;
	targetEid?: number;
	targetX?: number;
	targetY?: number;
}

export interface ProductionEntry {
	type: string;
	contentId: string;
	progress: number;
}

export interface SessionObjective {
	id: string;
	description: string;
	status: string;
	bonus?: boolean;
}

export interface GameWorld {
	ecs: ReturnType<typeof createWorld>;
	time: {
		elapsedMs: number;
		deltaMs: number;
		tick: number;
	};
	runtime: {
		orderQueues: Map<number, Order[]>;
		productionQueues: Map<number, ProductionEntry[]>;
		scriptTagIndex: Map<string, number>;
		entityTypeIndex: Map<number, string>;
		scenarioPhase: string;
		waveCounter: number;
		weather: "clear" | "rain" | "monsoon";
		revealedZones: Set<string>;
		lockedZones: Set<string>;
		zoneRects: Map<string, { x: number; y: number; width: number; height: number }>;
		steeringAgents: Map<number, unknown>;
		navGraphs: Map<string, unknown>;
		bossConfigs: Map<number, unknown>;
		convoyRoutes: Map<number, Array<{ x: number; y: number }>>;
		diagnosticEvents: DiagnosticSnapshot["events"];
		removals: Set<number>;
		alive: Set<number>;
		/** Terrain grid populated by missionBootstrap from mission terrain regions. */
		terrainGrid: number[][] | null;
	};
	session: {
		currentMissionId: string | null;
		phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat";
		objectives: SessionObjective[];
		resources: {
			fish: number;
			timber: number;
			salvage: number;
		};
		dialogue: {
			active: boolean;
			expiresAtMs?: number | null;
			lines: Array<{ speaker: string; text: string }>;
		} | null;
	};
	campaign: {
		currentMissionId: string | null;
		difficulty: "support" | "tactical" | "elite";
	};
	settings: {
		masterVolume: number;
		musicVolume: number;
		sfxVolume: number;
		showSubtitles: boolean;
		reduceMotion: boolean;
	};
	navigation: {
		width: number;
		height: number;
		activeGraphId: string | null;
	};
	events: Array<{
		type: string;
		payload?: Record<string, unknown>;
	}>;
	rng: SeedBundle;
	diagnostics: DiagnosticSnapshot;
}

export function createGameWorld(seed = createSeedBundle({ phrase: "silent-ember-heron", source: "manual" })): GameWorld {
	return {
		ecs: createWorld(),
		time: {
			elapsedMs: 0,
			deltaMs: 0,
			tick: 0,
		},
		runtime: {
			orderQueues: new Map(),
			productionQueues: new Map(),
			scriptTagIndex: new Map(),
			entityTypeIndex: new Map(),
			scenarioPhase: "initial",
			waveCounter: 0,
			weather: "clear",
			revealedZones: new Set(),
			lockedZones: new Set(),
			zoneRects: new Map(),
			steeringAgents: new Map(),
			navGraphs: new Map(),
			bossConfigs: new Map(),
			convoyRoutes: new Map(),
			diagnosticEvents: [],
			removals: new Set(),
			alive: new Set(),
			terrainGrid: null,
		},
		session: {
			currentMissionId: null,
			phase: "loading",
			objectives: [],
			resources: {
				fish: 0,
				timber: 0,
				salvage: 0,
			},
			dialogue: null,
		},
		campaign: {
			currentMissionId: null,
			difficulty: "support",
		},
		settings: {
			masterVolume: 1,
			musicVolume: 0.8,
			sfxVolume: 0.9,
			showSubtitles: true,
			reduceMotion: false,
		},
		navigation: {
			width: 0,
			height: 0,
			activeGraphId: null,
		},
		events: [],
		rng: seed,
		diagnostics: {
			...createEmptyDiagnosticsSnapshot(),
			seedPhrase: seed.phrase,
			designSeed: seed.designSeed,
			gameplaySeeds: { ...seed.gameplaySeeds },
		},
	};
}

export function resetWorldSession(world: GameWorld): void {
	world.time.elapsedMs = 0;
	world.time.deltaMs = 0;
	world.time.tick = 0;
	world.session.currentMissionId = null;
	world.session.phase = "loading";
	world.session.objectives = [];
	world.session.resources = { fish: 0, timber: 0, salvage: 0 };
	world.session.dialogue = null;
	world.navigation.width = 0;
	world.navigation.height = 0;
	world.navigation.activeGraphId = null;
	world.events.length = 0;
	world.runtime.orderQueues.clear();
	world.runtime.productionQueues.clear();
	world.runtime.scriptTagIndex.clear();
	world.runtime.entityTypeIndex.clear();
	world.runtime.scenarioPhase = "initial";
	world.runtime.waveCounter = 0;
	world.runtime.weather = "clear";
	world.runtime.revealedZones.clear();
	world.runtime.lockedZones.clear();
	world.runtime.zoneRects.clear();
	world.runtime.steeringAgents.clear();
	world.runtime.navGraphs.clear();
	world.runtime.bossConfigs.clear();
	world.runtime.convoyRoutes.clear();
	world.runtime.diagnosticEvents.length = 0;
	world.runtime.removals.clear();
	world.runtime.alive.clear();
	world.runtime.terrainGrid = null;
}

function spawnEntity(world: GameWorld, options: {
	x: number;
	y: number;
	faction?: string;
	health?: { current: number; max: number };
	categoryId?: number;
	flags?: Partial<{
		isBuilding: number;
		isProjectile: number;
		isResource: number;
		canSwim: number;
		submerged: number;
		stealthed: number;
	}>;
}): number {
	const eid = addEntity(world.ecs);
	Position.x[eid] = options.x;
	Position.y[eid] = options.y;
	Faction.id[eid] = resolveFactionId(options.faction);
	Health.current[eid] = options.health?.current ?? 1;
	Health.max[eid] = options.health?.max ?? 1;
	Content.categoryId[eid] = options.categoryId ?? 0;
	Selection.selected[eid] = 0;
	Flags.isBuilding[eid] = options.flags?.isBuilding ?? 0;
	Flags.isProjectile[eid] = options.flags?.isProjectile ?? 0;
	Flags.isResource[eid] = options.flags?.isResource ?? 0;
	Flags.canSwim[eid] = options.flags?.canSwim ?? 0;
	Flags.submerged[eid] = options.flags?.submerged ?? 0;
	Flags.stealthed[eid] = options.flags?.stealthed ?? 0;

	world.runtime.alive.add(eid);
	return eid;
}

export function spawnUnit(world: GameWorld, options: {
	x: number;
	y: number;
	faction?: string;
	unitId?: number;
	unitType?: string;
	categoryId?: number;
	health?: { current: number; max: number };
	scriptId?: string;
}): number {
	const eid = spawnEntity(world, {
		x: options.x,
		y: options.y,
		faction: options.faction,
		health: options.health,
		categoryId: options.categoryId,
	});
	Content.unitId[eid] = options.unitId ?? 0;
	if (options.unitType) {
		world.runtime.entityTypeIndex.set(eid, options.unitType);
	}
	if (options.scriptId) {
		setScriptTag(world, eid, options.scriptId);
	}
	return eid;
}

export function spawnBuilding(world: GameWorld, options: {
	x: number;
	y: number;
	faction?: string;
	buildingId?: number;
	buildingType?: string;
	categoryId?: number;
	health?: { current: number; max: number };
	construction?: { progress: number; buildTime: number };
	scriptId?: string;
}): number {
	const eid = spawnEntity(world, {
		x: options.x,
		y: options.y,
		faction: options.faction,
		health: options.health,
		categoryId: options.categoryId,
		flags: { isBuilding: 1 },
	});
	Content.buildingId[eid] = options.buildingId ?? 0;
	if (options.buildingType) {
		world.runtime.entityTypeIndex.set(eid, options.buildingType);
	}
	Construction.progress[eid] = options.construction?.progress ?? 100;
	Construction.buildTime[eid] = options.construction?.buildTime ?? 0;
	if (options.scriptId) {
		setScriptTag(world, eid, options.scriptId);
	}
	return eid;
}

export function spawnResource(world: GameWorld, options: {
	x: number;
	y: number;
	resourceId?: number;
	resourceType?: string;
	categoryId?: number;
	scriptId?: string;
}): number {
	const eid = spawnEntity(world, {
		x: options.x,
		y: options.y,
		categoryId: options.categoryId,
		flags: { isResource: 1 },
	});
	Content.resourceId[eid] = options.resourceId ?? 0;
	if (options.resourceType) {
		world.runtime.entityTypeIndex.set(eid, options.resourceType);
	}
	if (options.scriptId) {
		setScriptTag(world, eid, options.scriptId);
	}
	return eid;
}

export function spawnProjectile(world: GameWorld, options: {
	x: number;
	y: number;
	faction?: string;
	damage: number;
	targetEid?: number;
}): number {
	const eid = spawnEntity(world, {
		x: options.x,
		y: options.y,
		faction: options.faction,
		flags: { isProjectile: 1 },
	});
	Attack.damage[eid] = options.damage;
	TargetRef.eid[eid] = options.targetEid ?? 0;
	return eid;
}

export function markForRemoval(world: GameWorld, eid: number): void {
	world.runtime.removals.add(eid);
}

export function flushRemovals(world: GameWorld): void {
	for (const eid of world.runtime.removals) {
		removeEntity(world.ecs, eid);
		world.runtime.alive.delete(eid);
		world.runtime.orderQueues.delete(eid);
		world.runtime.productionQueues.delete(eid);
		world.runtime.entityTypeIndex.delete(eid);
		world.runtime.steeringAgents.delete(eid);
		world.runtime.bossConfigs.delete(eid);
		world.runtime.convoyRoutes.delete(eid);
		for (const [scriptId, taggedEid] of world.runtime.scriptTagIndex.entries()) {
			if (taggedEid === eid) {
				world.runtime.scriptTagIndex.delete(scriptId);
			}
		}
	}
	world.runtime.removals.clear();
}

export function isAlive(world: GameWorld, eid: number): boolean {
	return world.runtime.alive.has(eid);
}

export function getOrderQueue(world: GameWorld, eid: number): Order[] {
	const existing = world.runtime.orderQueues.get(eid);
	if (existing) return existing;
	const queue: Order[] = [];
	world.runtime.orderQueues.set(eid, queue);
	return queue;
}

export function getProductionQueue(world: GameWorld, eid: number): ProductionEntry[] {
	const existing = world.runtime.productionQueues.get(eid);
	if (existing) return existing;
	const queue: ProductionEntry[] = [];
	world.runtime.productionQueues.set(eid, queue);
	return queue;
}

export function setSelection(_world: GameWorld, eid: number, selected: boolean): void {
	Selection.selected[eid] = selected ? 1 : 0;
}

export function setFaction(_world: GameWorld, eid: number, faction: string): void {
	Faction.id[eid] = resolveFactionId(faction);
}

export function setScriptTag(world: GameWorld, eid: number, scriptId: string): void {
	world.runtime.scriptTagIndex.set(scriptId, eid);
}
