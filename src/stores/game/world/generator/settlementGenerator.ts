import * as THREE from "three";
import { spawnSettlement } from "../../../../ecs/integration/assemblyBridge";
import { CHUNK_SIZE } from "../../../../stores/gameStore";
import type { Faction } from "../../../../systems/assembly/componentLibrary";
import type { SettlementType } from "../../../../systems/assembly/types";
import type { WorldPoint } from "../../../worldLayout";

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
