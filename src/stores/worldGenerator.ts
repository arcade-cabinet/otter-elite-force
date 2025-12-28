import * as THREE from "three";
import { spawnSettlement } from "../ecs/integration/assemblyBridge";
import type { Faction } from "../systems/assembly/componentLibrary";
import type { SettlementType } from "../systems/assembly/types";
import { GAME_CONFIG } from "../utils/constants";
import type {
	ChunkData,
	Entity,
	EnvironmentEntity,
	InteractionEntity,
	ObjectiveEntity,
	PredatorEntity,
} from "./types";
import {
	DEFAULT_WORLD_CONFIG,
	generateWorldLayout,
	getKeyCoordinateForChunk,
	getTerrainForChunk,
	type WorldLayout,
	type WorldPoint,
} from "./worldLayout";

// Use centralized CHUNK_SIZE from constants
export const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;

// Global world layout - generated once per game session
let _worldLayout: WorldLayout | null = null;

/**
 * Get or generate the world layout
 * Uses seed from save data for consistency
 */
export function getWorldLayout(seed?: number): WorldLayout {
	if (!_worldLayout || (seed !== undefined && seed !== _worldLayout.seed)) {
		_worldLayout = generateWorldLayout({
			...DEFAULT_WORLD_CONFIG,
			seed: seed ?? Date.now(),
		});
	}
	return _worldLayout;
}

/**
 * Reset world layout (for new game)
 */
export function resetWorldLayout(): void {
	_worldLayout = null;
}

/**
 * Legacy KEY_COORDINATES export for backward compatibility
 * This is now dynamically generated from the world layout
 */
export function getKeyCoordinates(): Record<
	string,
	{
		x: number;
		z: number;
		name: string;
		rescueCharacter?: string;
		isBossArea?: boolean;
		specialObjective?: string;
	}
> {
	const layout = getWorldLayout();
	const result: Record<
		string,
		{
			x: number;
			z: number;
			name: string;
			rescueCharacter?: string;
			isBossArea?: boolean;
			specialObjective?: string;
		}
	> = {};

	for (const [id, point] of layout.points) {
		if (point.type !== "WAYPOINT") {
			result[id] = {
				x: point.x,
				z: point.z,
				name: getPointName(point),
				rescueCharacter: point.rescueCharacter,
				isBossArea: point.isBossArea,
				specialObjective: point.specialObjective,
			};
		}
	}

	return result;
}

function getPointName(point: WorldPoint): string {
	switch (point.type) {
		case "LZ":
			return "Landing Zone / Base";
		case "VILLAGE":
			return "Native Village";
		case "HEALER_HUB":
			return "Healer's Grove";
		case "PRISON_CAMP":
			return "Prison Camp";
		case "ENEMY_OUTPOST":
			return "Scale-Guard Outpost";
		case "SIPHON_CLUSTER":
			return "Siphon Cluster";
		case "GAS_DEPOT":
			return "Gas Depot";
		case "BOSS_ARENA":
			return "The Great Siphon";
		case "RAFT_DOCK":
			return "River Crossing";
		default:
			return "Unknown Location";
	}
}

/**
 * Maps world POI types to ECS settlement types
 */
function getSettlementTypeForPOI(poiType: WorldPoint["type"]): SettlementType | null {
	switch (poiType) {
		case "VILLAGE":
			return "NATIVE_VILLAGE";
		case "HEALER_HUB":
			return "NATIVE_VILLAGE"; // Healer villages use native layout
		case "PRISON_CAMP":
			return "PRISON_COMPOUND";
		case "ENEMY_OUTPOST":
			return "SCALE_GUARD_OUTPOST";
		case "SIPHON_CLUSTER":
			return "SIPHON_FACILITY";
		case "GAS_DEPOT":
			return "SCALE_GUARD_OUTPOST"; // Gas depots use outpost layout
		case "RAFT_DOCK":
			return "FISHING_CAMP"; // Docks use fishing camp layout
		case "LZ":
			return "PLAYER_BASE";
		default:
			return null;
	}
}

/**
 * Gets faction for a POI type
 */
function getFactionForPOI(poiType: WorldPoint["type"]): Faction {
	switch (poiType) {
		case "VILLAGE":
		case "HEALER_HUB":
		case "RAFT_DOCK":
			return "NATIVE";
		case "PRISON_CAMP":
		case "ENEMY_OUTPOST":
		case "SIPHON_CLUSTER":
		case "GAS_DEPOT":
			return "SCALE_GUARD";
		case "LZ":
			return "URA";
		default:
			return "NEUTRAL";
	}
}

/**
 * Spawns ECS settlement for a POI
 * This creates proper Miniplex entities for the settlement structures
 */
export function spawnPOISettlement(keyCoord: WorldPoint, chunkX: number, chunkZ: number): void {
	const settlementType = getSettlementTypeForPOI(keyCoord.type);
	if (!settlementType) return;

	const faction = getFactionForPOI(keyCoord.type);
	const center = new THREE.Vector3(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
	const seed = Math.abs(chunkX * 31 + chunkZ * 17);

	// Spawn the settlement via ECS integration bridge
	spawnSettlement(seed, settlementType, center, faction);
}

// Efficient seeded random function
export const getSeededRandom = (x: number, z: number, index: number = 0) => {
	const seed = x * 374761393 + z * 668265263 + index * 1664525;
	const t = (seed ^ (seed << 13)) >>> 0;
	return ((t ^ (t >>> 17) ^ (t << 5)) & 0x7fffffff) / 0x7fffffff;
};

export const generateChunk = (x: number, z: number): ChunkData => {
	const id = `${x},${z}`;
	const seed = Math.abs(x * 31 + z * 17);
	let randIndex = 0;

	const nextRand = () => getSeededRandom(x, z, randIndex++);

	// Get world layout for intelligent placement
	const layout = getWorldLayout();
	const keyCoord = getKeyCoordinateForChunk(layout, x, z);

	// Use terrain from layout, or generate based on position
	const terrainType = getTerrainForChunk(layout, x, z);

	// Get difficulty from layout or calculate based on distance
	const difficulty = keyCoord?.difficulty ?? Math.min(1, Math.sqrt(x * x + z * z) / 50);

	const entities: Entity[] = [];

	// Add Predators - count and type based on difficulty
	const baseEnemyCount = Math.floor(difficulty * 4) + 2;
	const entityCount = Math.floor(nextRand() * 3) + baseEnemyCount;
	for (let i = 0; i < entityCount; i++) {
		const r = nextRand();
		// Higher difficulty = more snappers (hardest), fewer gators (easiest)
		const typeRoll = r + difficulty * 0.3;
		const type: "SNAPPER" | "SNAKE" | "GATOR" | "SCOUT" =
			typeRoll > 0.9 ? "SNAPPER" : typeRoll > 0.75 ? "SNAKE" : typeRoll > 0.6 ? "SCOUT" : "GATOR";

		// Heavy enemies more common at higher difficulty
		const isHeavy = nextRand() < difficulty * 0.4;

		const predator: PredatorEntity = {
			id: `e-${id}-${i}`,
			type,
			position: [
				(nextRand() - 0.5) * CHUNK_SIZE,
				type === "SNAKE" ? 5 : 0,
				(nextRand() - 0.5) * CHUNK_SIZE,
			],
			isHeavy,
			hp:
				type === "SNAPPER"
					? isHeavy
						? 40
						: 20
					: type === "GATOR"
						? isHeavy
							? 20
							: 10
						: type === "SCOUT"
							? 3
							: 2,
			suppression: 0,
		};
		entities.push(predator);
	}

	// ==========================================================================
	// TERRAIN-BASED ENVIRONMENT GENERATION
	// Only add random spawns if this is NOT a key coordinate (POIs handle their own spawning)
	// ==========================================================================

	const isPOI = keyCoord && keyCoord.type !== "WAYPOINT";

	// Add terrain-specific environment elements
	if (terrainType === "DENSE_JUNGLE") {
		// Platforms and climbables in jungle
		const platformCount = Math.floor(nextRand() * 2) + (isPOI ? 0 : 1);
		for (let i = 0; i < platformCount; i++) {
			entities.push({
				id: `p-${id}-${i}`,
				type: "PLATFORM",
				position: [
					(nextRand() - 0.5) * (CHUNK_SIZE - 20),
					0.5 + nextRand() * 2,
					(nextRand() - 0.5) * (CHUNK_SIZE - 20),
				],
			} as EnvironmentEntity);
		}

		const climbableCount = Math.floor(nextRand() * 2) + 1;
		for (let i = 0; i < climbableCount; i++) {
			entities.push({
				id: `c-${id}-${i}`,
				type: "CLIMBABLE",
				position: [
					(nextRand() - 0.5) * (CHUNK_SIZE - 30),
					5,
					(nextRand() - 0.5) * (CHUNK_SIZE - 30),
				],
			} as EnvironmentEntity);
		}
	}

	if (terrainType === "MARSH") {
		// Mud pits and toxic sludge in marsh
		if (nextRand() > 0.5) {
			entities.push({
				id: `mud-${id}`,
				type: "MUD_PIT",
				position: [(nextRand() - 0.5) * 40, 0.05, (nextRand() - 0.5) * 40],
			} as EnvironmentEntity);
		}
		if (nextRand() > 0.7) {
			entities.push({
				id: `sludge-env-${id}`,
				type: "TOXIC_SLUDGE",
				position: [(nextRand() - 0.5) * 40, 0.05, (nextRand() - 0.5) * 40],
			} as EnvironmentEntity);
		}
	}

	if (terrainType === "RIVER") {
		// Oil slicks and reeds near water
		if (nextRand() > 0.6) {
			entities.push({
				id: `oil-${id}`,
				type: "OIL_SLICK",
				position: [(nextRand() - 0.5) * 30, 0.02, (nextRand() - 0.5) * 30],
			} as EnvironmentEntity);
		}
		// Raft crossing in river chunks
		if (nextRand() > 0.75 && !isPOI) {
			entities.push({
				id: `raft-env-${id}`,
				type: "RAFT",
				position: [(nextRand() - 0.5) * 40, 0.2, (nextRand() - 0.5) * 40],
			} as InteractionEntity);
		}
	}

	// ==========================================================================
	// RANDOM CONTENT (Only in non-POI chunks)
	// ==========================================================================

	if (!isPOI) {
		// Random siphons (difficulty-scaled)
		if (nextRand() > 0.8 - difficulty * 0.2) {
			entities.push({
				id: `siphon-${id}`,
				type: "SIPHON",
				position: [(nextRand() - 0.5) * 40, 0, (nextRand() - 0.5) * 40],
				hp: 40 + difficulty * 20,
			} as ObjectiveEntity);
		}

		// Random gas stockpiles
		if (nextRand() > 0.85) {
			entities.push({
				id: `gas-${id}`,
				type: "GAS_STOCKPILE",
				position: [(nextRand() - 0.5) * 40, 0.5, (nextRand() - 0.5) * 40],
				hp: 30,
			} as ObjectiveEntity);
		}

		// Clam baskets (loot/traps)
		if (nextRand() > 0.75) {
			entities.push({
				id: `basket-${id}`,
				type: "CLAM_BASKET",
				position: [(nextRand() - 0.5) * 35, 0.2, (nextRand() - 0.5) * 35],
				isHeavy: nextRand() > 0.5,
			} as InteractionEntity);
		}

		// Random villager huts (only in safer areas)
		if (difficulty < 0.5 && nextRand() > 0.7) {
			const isHealerVillage = nextRand() > 0.85;
			const villageX = (nextRand() - 0.5) * 30;
			const villageZ = (nextRand() - 0.5) * 30;
			entities.push({
				id: `hut-${id}`,
				type: "HUT",
				position: [villageX, 0, villageZ],
			} as InteractionEntity);
			entities.push({
				id: `vil-${id}`,
				type: isHealerVillage ? "HEALER" : "VILLAGER",
				position: [villageX + 3, 0, villageZ + 2],
			} as InteractionEntity);
		}
	}

	// Key Coordinate special spawns from world layout
	if (keyCoord) {
		// Spawn content based on POI type
		switch (keyCoord.type) {
			case "LZ":
				// Landing zone - extraction point, minimal enemies
				entities.push({
					id: `extract-${id}`,
					type: "EXTRACTION_POINT",
					position: [0, 0, 0],
				} as InteractionEntity);
				break;

			case "VILLAGE":
				// Friendly village with civilians
				entities.push({
					id: `hut-${id}-main`,
					type: "HUT",
					position: [0, 0, 0],
				} as InteractionEntity);
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `villager-${id}-${i}`,
						type: "VILLAGER",
						position: [Math.cos(angle) * 5, 0, Math.sin(angle) * 5],
					} as InteractionEntity);
				}
				break;

			case "HEALER_HUB":
				// Healer location with potential rescue
				entities.push({
					id: `healer-${id}`,
					type: "HEALER",
					position: [0, 0, 0],
				} as InteractionEntity);
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [8, 0, 0],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				break;

			case "PRISON_CAMP":
				// Prison camp - heavily guarded rescue location
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [0, 0, 0],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				// Heavy guard presence
				for (let i = 0; i < 4; i++) {
					const angle = (i / 4) * Math.PI * 2;
					entities.push({
						id: `guard-${id}-${i}`,
						type: "SNAPPER",
						position: [Math.cos(angle) * 12, 0, Math.sin(angle) * 12],
						hp: 30,
						suppression: 0,
					} as PredatorEntity);
				}
				// Watchtower scout
				entities.push({
					id: `scout-${id}`,
					type: "SCOUT",
					position: [0, 5, 15],
					hp: 3,
					suppression: 0,
				} as PredatorEntity);
				break;

			case "ENEMY_OUTPOST":
				// Scale-Guard outpost
				entities.push({
					id: `outpost-hut-${id}`,
					type: "HUT",
					position: [0, 0, 0],
				} as InteractionEntity);
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `outpost-enemy-${id}-${i}`,
						type: nextRand() > 0.5 ? "GATOR" : "SNAPPER",
						position: [Math.cos(angle) * 10, 0, Math.sin(angle) * 10],
						hp: 15,
						suppression: 0,
						isHeavy: nextRand() > 0.7,
					} as PredatorEntity);
				}
				break;

			case "SIPHON_CLUSTER":
				// Multiple siphons to destroy
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `siphon-${id}-${i}`,
						type: "SIPHON",
						position: [Math.cos(angle) * 15, 0, Math.sin(angle) * 15],
						hp: 50,
					} as ObjectiveEntity);
				}
				// Toxic sludge around siphons
				entities.push({
					id: `sludge-${id}`,
					type: "TOXIC_SLUDGE",
					position: [0, 0.05, 0],
				} as EnvironmentEntity);
				break;

			case "GAS_DEPOT":
				// Gas stockpile cluster with rescue
				for (let i = 0; i < 4; i++) {
					entities.push({
						id: `gas-${id}-${i}`,
						type: "GAS_STOCKPILE",
						position: [(nextRand() - 0.5) * 20, 0, (nextRand() - 0.5) * 20],
						hp: 30,
					} as ObjectiveEntity);
				}
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [0, 0, -15],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				break;

			case "BOSS_ARENA":
				// Major objective area - The Great Siphon
				// Central massive siphon
				entities.push({
					id: `boss-siphon-${id}`,
					type: "SIPHON",
					position: [0, 0, 0],
					hp: 200,
				} as ObjectiveEntity);
				// Surrounding siphons
				for (let i = 0; i < 4; i++) {
					const angle = (i / 4) * Math.PI * 2;
					entities.push({
						id: `siphon-${id}-${i}`,
						type: "SIPHON",
						position: [Math.cos(angle) * 25, 0, Math.sin(angle) * 25],
						hp: 75,
					} as ObjectiveEntity);
				}
				// Heavy gator guards
				for (let i = 0; i < 5; i++) {
					const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
					entities.push({
						id: `boss-gator-${id}-${i}`,
						type: "GATOR",
						position: [Math.cos(angle) * 35, 0, Math.sin(angle) * 35],
						hp: 40,
						suppression: 0,
						isHeavy: true,
					} as PredatorEntity);
				}
				// Elite snappers
				for (let i = 0; i < 2; i++) {
					entities.push({
						id: `elite-snapper-${id}-${i}`,
						type: "SNAPPER",
						position: [i === 0 ? -15 : 15, 0, 20],
						hp: 50,
						suppression: 0,
					} as PredatorEntity);
				}
				break;

			case "RAFT_DOCK":
				// River crossing with raft
				entities.push({
					id: `raft-${id}`,
					type: "RAFT",
					position: [0, 0.2, 0],
				} as InteractionEntity);
				// Platform for boarding
				entities.push({
					id: `platform-${id}`,
					type: "PLATFORM",
					position: [5, 0.5, 0],
				} as EnvironmentEntity);
				break;
		}
	}

	// ==========================================================================
	// LZ SPECIAL HANDLING (always has extraction point)
	// ==========================================================================

	if (id === "0,0" && !entities.some((e) => e.type === "EXTRACTION_POINT")) {
		entities.push({
			id: `extract-${id}`,
			type: "EXTRACTION_POINT",
			position: [0, 0, 0],
		} as InteractionEntity);
	}

	return {
		id,
		x,
		z,
		seed,
		terrainType,
		secured: false,
		territoryState: "NEUTRAL",
		lastVisited: Date.now(),
		hibernated: false,
		entities,
		decorations: [
			{
				id: `${id}-dec-0`,
				type: "REED",
				count: Math.floor(nextRand() * 20) + 10,
			},
			{
				id: `${id}-dec-1`,
				type: "LILYPAD",
				count: Math.floor(nextRand() * 15) + 5,
			},
			{ id: `${id}-dec-2`, type: "DEBRIS", count: Math.floor(nextRand() * 5) },
			{
				id: `${id}-dec-3`,
				type: "BURNT_TREE",
				count: terrainType === "DENSE_JUNGLE" ? 15 : 5,
			},
			{
				id: `${id}-dec-4`,
				type: "MANGROVE",
				count: terrainType === "DENSE_JUNGLE" ? 20 : 10,
			},
			{ id: `${id}-dec-5`, type: "DRUM", count: Math.floor(nextRand() * 3) },
		],
	};
};
