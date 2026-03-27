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

import { TerrainTypeId } from "@/engine/rendering/terrainRenderer";
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
 * Resolve a terrain ID string to its numeric constant from TerrainTypeId.
 */
function resolveTerrainId(terrainId: string): number {
	return (TerrainTypeId as Record<string, number>)[terrainId] ?? TerrainTypeId.grass;
}

/**
 * Build a 2D terrain grid from the mission terrain definition.
 *
 * Processes regions in order (fill, rects, circles, rivers), then applies
 * tile overrides. Returns a grid[row][col] of numeric terrain type IDs.
 */
function buildTerrainGrid(mission: MissionDef): number[][] {
	const { width, height, regions, overrides } = mission.terrain;
	const grid: number[][] = Array.from({ length: height }, () =>
		Array.from({ length: width }, () => TerrainTypeId.grass),
	);

	for (const region of regions) {
		const tid = resolveTerrainId(region.terrainId);

		if (region.fill) {
			// Full map fill (base layer)
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					grid[y][x] = tid;
				}
			}
		} else if (region.rect) {
			const r = region.rect;
			const x0 = Math.max(0, r.x);
			const y0 = Math.max(0, r.y);
			const x1 = Math.min(width, r.x + r.w);
			const y1 = Math.min(height, r.y + r.h);
			for (let y = y0; y < y1; y++) {
				for (let x = x0; x < x1; x++) {
					grid[y][x] = tid;
				}
			}
		} else if (region.circle) {
			const c = region.circle;
			const r2 = c.r * c.r;
			const x0 = Math.max(0, Math.floor(c.cx - c.r));
			const y0 = Math.max(0, Math.floor(c.cy - c.r));
			const x1 = Math.min(width, Math.ceil(c.cx + c.r));
			const y1 = Math.min(height, Math.ceil(c.cy + c.r));
			for (let y = y0; y < y1; y++) {
				for (let x = x0; x < x1; x++) {
					const dx = x - c.cx;
					const dy = y - c.cy;
					if (dx * dx + dy * dy <= r2) {
						grid[y][x] = tid;
					}
				}
			}
		} else if (region.river) {
			const { points, width: riverWidth } = region.river;
			const halfW = riverWidth / 2;
			// Rasterize river as a polyline with width
			for (let i = 0; i < points.length - 1; i++) {
				const [ax, ay] = points[i];
				const [bx, by] = points[i + 1];
				const segLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
				const steps = Math.max(1, Math.ceil(segLen * 2));
				for (let s = 0; s <= steps; s++) {
					const t = s / steps;
					const cx = ax + (bx - ax) * t;
					const cy = ay + (by - ay) * t;
					const x0 = Math.max(0, Math.floor(cx - halfW));
					const y0 = Math.max(0, Math.floor(cy - halfW));
					const x1 = Math.min(width, Math.ceil(cx + halfW));
					const y1 = Math.min(height, Math.ceil(cy + halfW));
					for (let y = y0; y < y1; y++) {
						for (let x = x0; x < x1; x++) {
							grid[y][x] = tid;
						}
					}
				}
			}
		}
	}

	// Apply tile overrides (e.g., bridge tiles)
	for (const override of overrides) {
		if (override.x >= 0 && override.x < width && override.y >= 0 && override.y < height) {
			grid[override.y][override.x] = resolveTerrainId(override.terrainId);
		}
	}

	return grid;
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

	// Build terrain grid from mission regions and overrides
	world.runtime.terrainGrid = buildTerrainGrid(mission);

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
