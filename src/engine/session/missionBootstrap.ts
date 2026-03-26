/**
 * Mission Bootstrap — seeds a GameWorld with mission entities and state.
 *
 * Takes a mission ID, looks up the definition from the mission registry,
 * and populates the GameWorld with:
 *   - All entity placements (units, buildings, resources)
 *   - Starting resources
 *   - Terrain/navigation dimensions
 *   - Script tags for named entities
 *   - Session state (phase, mission ID, objectives)
 *   - Zone rectangles for scenario triggers
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { setSelection, spawnBuilding, spawnResource, spawnUnit } from "@/engine/world/gameWorld";
import { getMissionById } from "@/entities/missions";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import type { MissionDef, Placement } from "@/entities/types";
import { resolvePlacementPosition } from "./tacticalSession";

/**
 * Spawn a single placement into the GameWorld using the runtime spawn helpers.
 * Returns the entity ID if spawned, or null if the type was not found.
 */
function spawnPlacement(
	world: GameWorld,
	placement: Placement,
	x: number,
	y: number,
): number | null {
	const faction = placement.faction ?? "neutral";
	const worldX = x * 32 + 16;
	const worldY = y * 32 + 16;

	// Try unit first
	const unitDef = getUnit(placement.type) ?? getHero(placement.type);
	if (unitDef) {
		return spawnUnit(world, {
			x: worldX,
			y: worldY,
			faction,
			unitType: placement.type,
			health: { current: unitDef.hp, max: unitDef.hp },
			scriptId: placement.scriptId,
		});
	}

	// Try building
	const buildingDef = getBuilding(placement.type);
	if (buildingDef) {
		return spawnBuilding(world, {
			x: worldX,
			y: worldY,
			faction,
			buildingType: placement.type,
			health: { current: buildingDef.hp, max: buildingDef.hp },
			scriptId: placement.scriptId,
		});
	}

	// Try resource
	if (getResource(placement.type)) {
		return spawnResource(world, {
			x: worldX,
			y: worldY,
			resourceType: placement.type,
			scriptId: placement.scriptId,
		});
	}

	return null;
}

/**
 * Populate the GameWorld from a resolved MissionDef.
 * Spawns all placements, sets resources, dimensions, zones, and objectives.
 */
function seedWorldFromMission(world: GameWorld, mission: MissionDef): void {
	// Set session state
	world.session.currentMissionId = mission.id;
	world.session.phase = "playing";
	world.session.resources = {
		fish: mission.startResources.fish ?? 0,
		timber: mission.startResources.timber ?? 0,
		salvage: mission.startResources.salvage ?? 0,
	};

	// Set objectives
	world.session.objectives = [
		...mission.objectives.primary.map((obj) => ({
			id: obj.id,
			description: obj.description,
			status: "active",
			bonus: false,
		})),
		...mission.objectives.bonus.map((obj) => ({
			id: obj.id,
			description: obj.description,
			status: "active",
			bonus: true,
		})),
	];

	// Set navigation/terrain dimensions
	world.navigation.width = mission.terrain.width;
	world.navigation.height = mission.terrain.height;

	// Set runtime scenario state
	world.runtime.scenarioPhase = "initial";
	world.runtime.waveCounter = 0;

	// Register zone rectangles (convert tile coords to pixel coords)
	world.runtime.zoneRects = new Map(
		Object.entries(mission.zones).map(([zoneId, zone]) => [
			zoneId,
			{
				x: zone.x * 32,
				y: zone.y * 32,
				width: zone.width * 32,
				height: zone.height * 32,
			},
		]),
	);

	// Spawn all placements
	let firstPlayerUnitSelected = false;
	for (const [placementIndex, placement] of mission.placements.entries()) {
		const count = placement.count ?? 1;
		for (let i = 0; i < count; i++) {
			const pos = resolvePlacementPosition(placement, mission, placementIndex * 100 + i);
			const eid = spawnPlacement(world, placement, pos.x, pos.y);

			// Auto-select the first player unit for camera focus
			if (eid !== null && !firstPlayerUnitSelected && placement.faction === "ura") {
				setSelection(world, eid, true);
				firstPlayerUnitSelected = true;
			}
		}
	}

	// Set campaign metadata
	world.campaign.currentMissionId = mission.id;
}

/**
 * Bootstrap a mission into a GameWorld by mission ID.
 *
 * Looks up the mission definition from the registry, then seeds the world
 * with all entities, resources, objectives, and navigation data.
 *
 * Throws if the mission ID is not found.
 */
export function bootstrapMission(world: GameWorld, missionId: string): void {
	const mission = getMissionById(missionId);
	if (!mission) {
		throw new Error(
			`bootstrapMission: unknown mission ID '${missionId}'. ` +
				"Check that the mission is registered in src/entities/missions/index.ts.",
		);
	}

	seedWorldFromMission(world, mission);

	// Record bootstrap in diagnostics
	world.diagnostics.missionId = missionId;
	world.diagnostics.events.push({
		tick: 0,
		type: "mission-bootstrapped",
		payload: {
			missionId,
			placements: mission.placements.length,
			objectives: mission.objectives.primary.length + mission.objectives.bonus.length,
			terrainWidth: mission.terrain.width,
			terrainHeight: mission.terrain.height,
			startFish: mission.startResources.fish ?? 0,
			startTimber: mission.startResources.timber ?? 0,
			startSalvage: mission.startResources.salvage ?? 0,
		},
	});
}
