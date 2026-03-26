import type { DiagnosticSnapshot } from "../diagnostics/types";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createMissionSeedBundle, type SeedBundle } from "../random/seed";
import {
	type GameWorld,
	setSelection,
	spawnBuilding as spawnRuntimeBuilding,
	spawnResource as spawnRuntimeResource,
	spawnUnit as spawnRuntimeUnit,
} from "../world/gameWorld";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { generateSkirmishMap, type SkirmishMapData, type SkirmishTerrainType } from "@/maps/skirmishMapGenerator";
import { getMissionById } from "@/entities/missions";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import type { MissionDef, Placement } from "@/entities/types";

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

export function createSkirmishRuntimeSession(config: SkirmishSessionConfig): SkirmishRuntimeSession {
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
	const uraUnit = mission.placements.find((placement) => placement.faction === "ura" && placement.x != null);
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
			resourceNodes: session.mission.placements.filter((placement) => getResource(placement.type)).length,
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

export function seedGameWorldFromCampaignSession(world: GameWorld, session: CampaignRuntimeSession): void {
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
				const eid = spawnRuntimeUnit(world, {
					x: pos.x * 32 + 16,
					y: pos.y * 32 + 16,
					faction,
					unitType: placement.type,
					health: { current: unitDef.hp, max: unitDef.hp },
					scriptId: placement.scriptId,
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
				});
				continue;
			}
			if (getResource(placement.type)) {
				spawnRuntimeResource(world, {
					x: pos.x * 32 + 16,
					y: pos.y * 32 + 16,
					resourceType: placement.type,
					scriptId: placement.scriptId,
				});
			}
		}
	}
}

export function seedGameWorldFromSkirmishSession(world: GameWorld, session: SkirmishRuntimeSession): void {
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

	const playerFaction = session.config.playAsScaleGuard ? "scale_guard" : "ura";
	const enemyFaction = session.config.playAsScaleGuard ? "ura" : "scale_guard";

	const playerBase = spawnRuntimeBuilding(world, {
		x: session.map.playerStart.tileX * 32 + 16,
		y: session.map.playerStart.tileY * 32 + 16,
		faction: playerFaction,
		buildingType: "command_post",
		health: { current: 40, max: 40 },
		scriptId: "player_base",
	});
	setSelection(world, playerBase, true);

	spawnRuntimeBuilding(world, {
		x: session.map.aiStart.tileX * 32 + 16,
		y: session.map.aiStart.tileY * 32 + 16,
		faction: enemyFaction,
		buildingType: "flag_post",
		health: { current: 40, max: 40 },
		scriptId: "enemy_base",
	});

	for (let i = 0; i < 4; i++) {
		spawnRuntimeUnit(world, {
			x: session.map.playerStart.tileX * 32 + 48 + i * 14,
			y: session.map.playerStart.tileY * 32 + 48,
			faction: playerFaction,
			unitType: i === 0 ? "river_rat" : "mudfoot",
			health: { current: 10, max: 10 },
			scriptId: `player_unit_${i}`,
		});
		spawnRuntimeUnit(world, {
			x: session.map.aiStart.tileX * 32 - 24 - i * 14,
			y: session.map.aiStart.tileY * 32 - 24,
			faction: enemyFaction,
			unitType: "gator",
			health: { current: 10, max: 10 },
			scriptId: `enemy_unit_${i}`,
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
}
