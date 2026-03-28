import { buildGraphFromTilemap } from "@/ai/graphBuilder";
import type { TerrainType as PathfindingTerrainType } from "@/ai/terrainTypes";
import { buildTerrainGridForPathfinding } from "@/canvas/tilePainter";
import { resolveCategoryId } from "@/engine/content/ids";
import { TerrainTypeId } from "@/engine/content/terrainTypes";
import { getMissionById } from "@/entities/missions";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import type { MissionDef, Placement } from "@/entities/types";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import {
	generateSkirmishMap,
	type SkirmishMapData,
	type SkirmishTerrainType,
} from "@/maps/skirmishMapGenerator";
import { TerrainType as MapTerrainType } from "@/maps/types";
import type { DiagnosticSnapshot } from "../diagnostics/types";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createMissionSeedBundle, type SeedBundle } from "../random/seed";
import { type EncounterEntry, initEncounterEntries } from "../systems/encounterSystemEngine";
import { Faction, Flags, Position, ResourceNode } from "../world/components";
import {
	type GameWorld,
	getOrderQueue,
	setSelection,
	spawnBuilding as spawnRuntimeBuilding,
	spawnResource as spawnRuntimeResource,
	spawnUnit as spawnRuntimeUnit,
} from "../world/gameWorld";
import { buildTerrainGrid } from "./missionBootstrap";

export interface CampaignRuntimeSession {
	mode: "campaign";
	mission: MissionDef;
	seed: SeedBundle;
	diagnostics: DiagnosticSnapshot;
	worldSize: {
		width: number;
		height: number;
	};
	focusTile: {
		x: number;
		y: number;
	};
}

export interface SkirmishRuntimeSession {
	mode: "skirmish";
	config: SkirmishSessionConfig;
	map: SkirmishMapData;
	diagnostics: DiagnosticSnapshot;
}

export interface RuntimeMapSummary {
	size: string;
	resourceNodes: number;
	chokepoints: number;
	playerStart?: string;
	aiStart?: string;
	focusTile?: string;
}

export interface RuntimeSessionDescriptor {
	mode: "campaign" | "skirmish";
	title: string;
	subtitle: string;
	seedPhrase: string;
	designSeed: number;
	gameplaySeeds: Record<string, number>;
	runId: string;
	mapSummary?: RuntimeMapSummary;
	cameraFocus: {
		x: number;
		y: number;
	};
	worldSize?: {
		width: number;
		height: number;
	};
}

export interface CampaignBootstrapResult {
	session: CampaignRuntimeSession;
	worldSize: {
		width: number;
		height: number;
	};
	focusTile: {
		x: number;
		y: number;
	};
}

export function resolvePlacementPosition(
	placement: Placement,
	mission: MissionDef,
	index: number,
): { x: number; y: number } {
	if (placement.x != null && placement.y != null) {
		return { x: placement.x, y: placement.y };
	}
	if (placement.zone) {
		const zone = mission.zones[placement.zone];
		if (zone) {
			const seed = `${placement.type}:${placement.zone}:${index}:${placement.scriptId ?? "anon"}`;
			const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
			return {
				x: zone.x + (hash % zone.width),
				y: zone.y + (Math.floor(hash / Math.max(1, zone.width)) % zone.height),
			};
		}
	}
	return { x: index, y: 0 };
}

export function createCampaignRuntimeSession(missionId: string): CampaignRuntimeSession {
	const mission = getMissionById(missionId);
	if (!mission) {
		throw new Error(`Unknown mission '${missionId}'`);
	}
	const seed = createMissionSeedBundle(mission.id);
	const focusTile = resolveMissionFocusTile(mission);
	const worldSize = {
		width: mission.terrain.width * 32,
		height: mission.terrain.height * 32,
	};
	const diagnostics = createEmptyDiagnosticsSnapshot();
	diagnostics.runId = `campaign:${mission.id}:${seed.phrase}`;
	diagnostics.mode = "campaign";
	diagnostics.missionId = mission.id;
	diagnostics.seedPhrase = seed.phrase;
	diagnostics.designSeed = seed.designSeed;
	diagnostics.gameplaySeeds = { ...seed.gameplaySeeds };

	return {
		mode: "campaign",
		mission,
		seed,
		diagnostics,
		worldSize,
		focusTile,
	};
}

export function createSkirmishRuntimeSession(
	config: SkirmishSessionConfig,
): SkirmishRuntimeSession {
	const map = generateSkirmishMap({
		size: resolveMapSize(config.mapId),
		terrainType: resolveTerrainType(config.mapId),
		seed: config.seed.designSeed,
	});
	const diagnostics = createEmptyDiagnosticsSnapshot();
	diagnostics.runId = `skirmish:${config.mapId}:${config.seed.phrase}`;
	diagnostics.mode = "skirmish";
	diagnostics.skirmishPresetId = config.preset;
	diagnostics.seedPhrase = config.seed.phrase;
	diagnostics.designSeed = config.seed.designSeed;
	diagnostics.gameplaySeeds = { ...config.seed.gameplaySeeds };
	diagnostics.events.push({
		tick: 0,
		type: "skirmish-map-generated",
		payload: {
			mapId: config.mapId,
			cols: map.cols,
			rows: map.rows,
			resourceNodes: map.resourceNodes.length,
			chokepoints: map.chokepoints.length,
		},
	});

	return {
		mode: "skirmish",
		config,
		map,
		diagnostics,
	};
}

function resolveMissionFocusTile(mission: MissionDef): { x: number; y: number } {
	const uraBuilding = mission.placements.find(
		(placement) =>
			placement.faction === "ura" &&
			(placement.type === "burrow" || placement.type === "command_post"),
	);
	const uraUnit = mission.placements.find(
		(placement) => placement.faction === "ura" && placement.x != null,
	);
	return {
		x: uraBuilding?.x ?? uraUnit?.x ?? mission.zones.ura_start?.x ?? 0,
		y: uraBuilding?.y ?? uraUnit?.y ?? mission.zones.ura_start?.y ?? 0,
	};
}

function resolveMapSize(mapId: string): "small" | "medium" | "large" {
	if (mapId.includes("delta") || mapId.includes("iron")) return "large";
	if (mapId.includes("basin") || mapId.includes("canopy")) return "medium";
	return "small";
}

function resolveTerrainType(mapId: string): SkirmishTerrainType {
	if (mapId.includes("river") || mapId.includes("delta")) return "river";
	if (mapId.includes("swamp") || mapId.includes("mud") || mapId.includes("sludge")) return "swamp";
	return "jungle";
}

export function describeCampaignRuntimeSession(
	session: CampaignRuntimeSession,
): RuntimeSessionDescriptor {
	return {
		mode: "campaign",
		title: session.mission.name,
		subtitle: session.mission.subtitle
			? `${session.mission.subtitle} tactical runtime`
			: "Campaign tactical runtime",
		seedPhrase: session.seed.phrase,
		designSeed: session.seed.designSeed,
		gameplaySeeds: session.seed.gameplaySeeds,
		runId: session.diagnostics.runId,
		mapSummary: {
			size: `${session.mission.terrain.width}x${session.mission.terrain.height}`,
			resourceNodes: session.mission.placements.filter((placement) => getResource(placement.type))
				.length,
			chokepoints: Object.keys(session.mission.zones).length,
			focusTile: `${session.focusTile.x},${session.focusTile.y}`,
		},
		cameraFocus: session.focusTile,
		worldSize: session.worldSize,
	};
}

export function describeSkirmishRuntimeSession(
	session: SkirmishRuntimeSession,
): RuntimeSessionDescriptor {
	return {
		mode: "skirmish",
		title: session.config.mapName,
		subtitle: `${session.config.preset.toUpperCase()} skirmish runtime`,
		seedPhrase: session.config.seed.phrase,
		designSeed: session.config.seed.designSeed,
		gameplaySeeds: session.config.seed.gameplaySeeds,
		runId: session.diagnostics.runId,
		mapSummary: {
			size: `${session.map.cols}x${session.map.rows}`,
			resourceNodes: session.map.resourceNodes.length,
			chokepoints: session.map.chokepoints.length,
			playerStart: `${session.map.playerStart.tileX},${session.map.playerStart.tileY}`,
			aiStart: `${session.map.aiStart.tileX},${session.map.aiStart.tileY}`,
			focusTile: `${session.map.playerStart.tileX},${session.map.playerStart.tileY}`,
		},
		cameraFocus: {
			x: session.map.playerStart.tileX,
			y: session.map.playerStart.tileY,
		},
		worldSize: {
			width: session.map.cols * 32,
			height: session.map.rows * 32,
		},
	};
}

export function seedGameWorldFromCampaignSession(
	world: GameWorld,
	session: CampaignRuntimeSession,
): void {
	world.session.currentMissionId = session.mission.id;
	world.session.phase = "playing";
	world.session.resources = {
		fish: session.mission.startResources.fish ?? 0,
		timber: session.mission.startResources.timber ?? 0,
		salvage: session.mission.startResources.salvage ?? 0,
	};
	world.session.objectives = [
		...session.mission.objectives.primary.map((objective) => ({
			id: objective.id,
			description: objective.description,
			status: "active",
			bonus: false,
		})),
		...session.mission.objectives.bonus.map((objective) => ({
			id: objective.id,
			description: objective.description,
			status: "active",
			bonus: true,
		})),
	];
	world.campaign.currentMissionId = session.mission.id;
	world.navigation.width = session.mission.terrain.width;
	world.navigation.height = session.mission.terrain.height;
	world.runtime.terrainGrid = buildTerrainGrid(session.mission);

	// Build Yuka nav graph for A* pathfinding
	const pathfindingGrid = buildTerrainGridForPathfinding(session.mission);
	const navGraph = buildGraphFromTilemap(pathfindingGrid, { eightWay: false });
	world.runtime.navGraphs.set("main", navGraph);
	world.navigation.activeGraphId = "main";

	world.runtime.scenarioPhase = "initial";
	world.runtime.waveCounter = 0;
	world.runtime.zoneRects = new Map(
		Object.entries(session.mission.zones).map(([zoneId, zone]) => [
			zoneId,
			{ x: zone.x * 32, y: zone.y * 32, width: zone.width * 32, height: zone.height * 32 },
		]),
	);
	world.diagnostics.runId = session.diagnostics.runId;
	world.diagnostics.mode = session.diagnostics.mode;
	world.diagnostics.missionId = session.diagnostics.missionId;

	let selectedAssigned = false;
	for (const placement of session.mission.placements) {
		const count = placement.count ?? 1;
		const faction = placement.faction ?? "neutral";
		for (let i = 0; i < count; i++) {
			const pos = resolvePlacementPosition(placement, session.mission, i);
			const unitDef = getUnit(placement.type) ?? getHero(placement.type);
			if (unitDef) {
				const abilities = unitDef.tags.filter((t) =>
					[
						"gather",
						"build",
						"swim",
						"heal",
						"snipe",
						"demolition",
						"stealth",
						"rally",
						"shield_bash",
					].includes(t),
				);
				const eid = spawnRuntimeUnit(world, {
					x: pos.x * 32 + 16,
					y: pos.y * 32 + 16,
					faction,
					unitType: placement.type,
					categoryId: resolveCategoryId(unitDef.category),
					health: { current: unitDef.hp, max: unitDef.hp },
					scriptId: placement.scriptId,
					stats: {
						hp: unitDef.hp,
						armor: unitDef.armor,
						speed: unitDef.speed,
						attackDamage: unitDef.damage,
						attackRange: unitDef.range,
						attackCooldownMs: unitDef.attackCooldown,
						visionRadius: unitDef.visionRadius,
						popCost: unitDef.populationCost,
					},
					abilities,
					flags: {
						canSwim: unitDef.canSwim ?? false,
						canStealth: unitDef.canCrouch ?? false,
					},
				});
				if (!selectedAssigned && faction === "ura") {
					setSelection(world, eid, true);
					selectedAssigned = true;
				}
				continue;
			}
			const buildingDef = getBuilding(placement.type);
			if (buildingDef) {
				spawnRuntimeBuilding(world, {
					x: pos.x * 32 + 16,
					y: pos.y * 32 + 16,
					faction,
					buildingType: placement.type,
					health: { current: buildingDef.hp, max: buildingDef.hp },
					scriptId: placement.scriptId,
					stats: {
						hp: buildingDef.hp,
						armor: buildingDef.armor ?? 0,
						visionRadius: 5,
						attackDamage: buildingDef.attackDamage ?? 0,
						attackRange: buildingDef.attackRange ?? 0,
						attackCooldownMs: buildingDef.attackCooldown ?? 0,
						populationCapacity: buildingDef.populationCapacity ?? 0,
					},
				});
				continue;
			}
			const resourceDef = getResource(placement.type);
			if (resourceDef) {
				const eid = spawnRuntimeResource(world, {
					x: pos.x * 32 + 16,
					y: pos.y * 32 + 16,
					resourceType: placement.type,
					scriptId: placement.scriptId,
				});
				// Set resource yield — average of min/max
				const avgYield = Math.round((resourceDef.yield.min + resourceDef.yield.max) / 2);
				ResourceNode.remaining[eid] = avgYield;
			}
		}
	}

	// Set starting population cap from mission definition
	world.runtime.population.max = session.mission.startPopCap ?? 10;

	// Count initial player (URA) unit count for population tracking
	let playerUnitCount = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === 1 && Flags.isBuilding[eid] === 0 && Flags.isResource[eid] === 0) {
			playerUnitCount++;
		}
	}
	world.runtime.population.current = playerUnitCount;

	// ── Task 1: Auto-assign workers to gather nearest resource ──
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== 1) continue; // player only
		if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) continue;
		const type = world.runtime.entityTypeIndex.get(eid);
		if (type !== "river_rat") continue;
		// Find nearest resource
		let nearestRid = -1;
		let nearestDist = Infinity;
		for (const rid of world.runtime.alive) {
			if (Flags.isResource[rid] !== 1) continue;
			const dx = Position.x[rid] - Position.x[eid];
			const dy = Position.y[rid] - Position.y[eid];
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearestRid = rid;
			}
		}
		if (nearestRid !== -1) {
			const orders = getOrderQueue(world, eid);
			orders.push({
				type: "gather",
				targetEid: nearestRid,
				targetX: Position.x[nearestRid],
				targetY: Position.y[nearestRid],
			});
		}
	}

	// ── Task 2: Initialize encounter entries ──
	// Early encounters are light scouts near the river (mud_banks), not near
	// the player base, so the lodge survives while the player learns.
	// Heavier encounters require phase progression and spawn further away.
	const earlyPatrolEntries: EncounterEntry[] = [
		{
			composition: [{ unitType: "skink", count: 2, variance: 1 }],
			spawnZone: "mud_banks",
			intervalMs: 90_000,
			intervalVariance: 20_000,
			maxSpawns: 2,
		},
		{
			composition: [
				{ unitType: "gator", count: 2, variance: 1 },
				{ unitType: "skink", count: 1, variance: 1 },
			],
			spawnZone: "jungle_north",
			intervalMs: 180_000,
			intervalVariance: 30_000,
			maxSpawns: 3,
			requiresPhase: "crossing",
		},
		{
			composition: [
				{ unitType: "viper", count: 1, variance: 1 },
				{ unitType: "gator", count: 1, variance: 0 },
			],
			spawnZone: "enemy_outpost",
			intervalMs: 240_000,
			intervalVariance: 45_000,
			maxSpawns: 3,
			requiresPhase: "outpost",
		},
	];
	initEncounterEntries(world, earlyPatrolEntries);
}

// ---------------------------------------------------------------------------
// Skirmish terrain conversion helpers
// ---------------------------------------------------------------------------

/** Map from skirmish MapTerrainType enum to engine TerrainTypeId numeric values. */
function mapTerrainToEngineId(t: MapTerrainType): number {
	switch (t) {
		case MapTerrainType.Grass:
			return TerrainTypeId.grass;
		case MapTerrainType.Dirt:
			return TerrainTypeId.dirt;
		case MapTerrainType.Mud:
			return TerrainTypeId.mud;
		case MapTerrainType.Water:
			return TerrainTypeId.water;
		case MapTerrainType.Mangrove:
			return TerrainTypeId.mangrove;
		case MapTerrainType.Bridge:
			return TerrainTypeId.bridge;
		case MapTerrainType.ToxicSludge:
			return TerrainTypeId.toxic_sludge;
		case MapTerrainType.TallGrass:
			return TerrainTypeId.grass; // No tall_grass ID in engine, use grass
		default:
			return TerrainTypeId.grass;
	}
}

/** Map from skirmish MapTerrainType enum to pathfinding string terrain type. */
function mapTerrainToPathfinding(t: MapTerrainType): PathfindingTerrainType {
	switch (t) {
		case MapTerrainType.Grass:
			return "grass";
		case MapTerrainType.Dirt:
			return "dirt";
		case MapTerrainType.Mud:
			return "mud";
		case MapTerrainType.Water:
			return "water";
		case MapTerrainType.Mangrove:
			return "mangrove";
		case MapTerrainType.Bridge:
			return "bridge";
		case MapTerrainType.ToxicSludge:
			return "toxic_sludge";
		case MapTerrainType.TallGrass:
			return "tall_grass";
		default:
			return "grass";
	}
}

/** Convert a skirmish map's numeric terrain grid to engine TerrainTypeId grid. */
function convertSkirmishTerrainToGrid(terrain: MapTerrainType[][]): number[][] {
	return terrain.map((row) => row.map((t) => mapTerrainToEngineId(t)));
}

/** Convert a skirmish map's numeric terrain grid to pathfinding string grid. */
function convertSkirmishTerrainToPathfinding(
	terrain: MapTerrainType[][],
): PathfindingTerrainType[][] {
	return terrain.map((row) => row.map((t) => mapTerrainToPathfinding(t)));
}

export function seedGameWorldFromSkirmishSession(
	world: GameWorld,
	session: SkirmishRuntimeSession,
): void {
	world.session.currentMissionId = session.config.mapId;
	world.session.phase = "playing";
	world.session.resources = {
		fish: session.config.startingResources.fish,
		timber: session.config.startingResources.timber,
		salvage: session.config.startingResources.salvage,
	};
	world.session.objectives = [
		{
			id: "skirmish-dominate",
			description: `Defeat the opposing force on ${session.config.mapName}`,
			status: "active",
			bonus: false,
		},
	];
	world.navigation.width = session.map.cols;
	world.navigation.height = session.map.rows;
	world.runtime.scenarioPhase = "initial";
	world.runtime.waveCounter = 0;
	world.runtime.zoneRects = new Map();
	world.diagnostics.runId = session.diagnostics.runId;
	world.diagnostics.mode = session.diagnostics.mode;
	world.diagnostics.skirmishPresetId = session.diagnostics.skirmishPresetId;

	// Build terrain grid from skirmish map data (convert map enum to engine terrain IDs)
	world.runtime.terrainGrid = convertSkirmishTerrainToGrid(session.map.terrain);

	// Build pathfinding nav graph from skirmish terrain
	const pathGrid = convertSkirmishTerrainToPathfinding(session.map.terrain);
	const navGraph = buildGraphFromTilemap(pathGrid, { eightWay: false });
	world.runtime.navGraphs.set("main", navGraph);
	world.navigation.activeGraphId = "main";

	// Initialize AI resource pool
	const aiRes = { ...session.config.startingResources };
	(
		world.runtime as { aiResources?: { fish: number; timber: number; salvage: number } }
	).aiResources = aiRes;

	// Set starting population cap for skirmish
	world.runtime.population.max = 20;

	const playerFaction = session.config.playAsScaleGuard ? "scale_guard" : "ura";
	const enemyFaction = session.config.playAsScaleGuard ? "ura" : "scale_guard";

	const commandPostDef = getBuilding("command_post");
	const playerBase = spawnRuntimeBuilding(world, {
		x: session.map.playerStart.tileX * 32 + 16,
		y: session.map.playerStart.tileY * 32 + 16,
		faction: playerFaction,
		buildingType: "command_post",
		health: { current: commandPostDef?.hp ?? 40, max: commandPostDef?.hp ?? 40 },
		scriptId: "player_base",
		stats: commandPostDef
			? {
					hp: commandPostDef.hp,
					armor: commandPostDef.armor ?? 0,
					visionRadius: 5,
					attackDamage: commandPostDef.attackDamage ?? 0,
					attackRange: commandPostDef.attackRange ?? 0,
					attackCooldownMs: commandPostDef.attackCooldown ?? 0,
					populationCapacity: commandPostDef.populationCapacity ?? 0,
				}
			: undefined,
	});
	setSelection(world, playerBase, true);

	const sludgePitDef = getBuilding("sludge_pit");
	spawnRuntimeBuilding(world, {
		x: session.map.aiStart.tileX * 32 + 16,
		y: session.map.aiStart.tileY * 32 + 16,
		faction: enemyFaction,
		buildingType: "sludge_pit",
		health: { current: sludgePitDef?.hp ?? 40, max: sludgePitDef?.hp ?? 40 },
		scriptId: "enemy_base",
		stats: sludgePitDef
			? {
					hp: sludgePitDef.hp,
					armor: sludgePitDef.armor ?? 0,
					visionRadius: 5,
					attackDamage: sludgePitDef.attackDamage ?? 0,
					attackRange: sludgePitDef.attackRange ?? 0,
					attackCooldownMs: sludgePitDef.attackCooldown ?? 0,
					populationCapacity: sludgePitDef.populationCapacity ?? 0,
				}
			: undefined,
	});

	for (let i = 0; i < 4; i++) {
		const playerUnitType = i === 0 ? "river_rat" : "mudfoot";
		const playerUnitDef = getUnit(playerUnitType);
		spawnRuntimeUnit(world, {
			x: session.map.playerStart.tileX * 32 + 48 + i * 14,
			y: session.map.playerStart.tileY * 32 + 48,
			faction: playerFaction,
			unitType: playerUnitType,
			categoryId: playerUnitDef ? resolveCategoryId(playerUnitDef.category) : undefined,
			health: { current: playerUnitDef?.hp ?? 10, max: playerUnitDef?.hp ?? 10 },
			scriptId: `player_unit_${i}`,
			stats: playerUnitDef
				? {
						hp: playerUnitDef.hp,
						armor: playerUnitDef.armor,
						speed: playerUnitDef.speed,
						attackDamage: playerUnitDef.damage,
						attackRange: playerUnitDef.range,
						attackCooldownMs: playerUnitDef.attackCooldown,
						visionRadius: playerUnitDef.visionRadius,
						popCost: playerUnitDef.populationCost,
					}
				: undefined,
		});
		const enemyUnitDef = getUnit("gator");
		spawnRuntimeUnit(world, {
			x: session.map.aiStart.tileX * 32 - 24 - i * 14,
			y: session.map.aiStart.tileY * 32 - 24,
			faction: enemyFaction,
			unitType: "gator",
			categoryId: enemyUnitDef ? resolveCategoryId(enemyUnitDef.category) : undefined,
			health: { current: enemyUnitDef?.hp ?? 10, max: enemyUnitDef?.hp ?? 10 },
			scriptId: `enemy_unit_${i}`,
			stats: enemyUnitDef
				? {
						hp: enemyUnitDef.hp,
						armor: enemyUnitDef.armor,
						speed: enemyUnitDef.speed,
						attackDamage: enemyUnitDef.damage,
						attackRange: enemyUnitDef.range,
						attackCooldownMs: enemyUnitDef.attackCooldown,
						visionRadius: enemyUnitDef.visionRadius,
						popCost: enemyUnitDef.populationCost,
					}
				: undefined,
		});
	}

	for (const [index, resourceNode] of session.map.resourceNodes.slice(0, 24).entries()) {
		spawnRuntimeResource(world, {
			x: resourceNode.position.tileX * 32 + 16,
			y: resourceNode.position.tileY * 32 + 16,
			resourceType: resourceNode.resourceType,
			scriptId: `resource_${index}`,
		});
	}

	// Count initial player unit count for population tracking
	const playerFactionId = session.config.playAsScaleGuard ? 2 : 1;
	let playerUnitCount = 0;
	for (const eid of world.runtime.alive) {
		if (
			Faction.id[eid] === playerFactionId &&
			Flags.isBuilding[eid] === 0 &&
			Flags.isResource[eid] === 0
		) {
			playerUnitCount++;
		}
	}
	world.runtime.population.current = playerUnitCount;
}
