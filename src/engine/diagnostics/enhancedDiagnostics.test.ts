/**
 * Tests for enhanced diagnostics — verifies performance counters,
 * pathfinding anomalies, fog stats, and minimap entity visibility
 * are populated by syncGameWorldDiagnostics.
 */

import { describe, expect, it } from "vitest";
import { createFogGrid, FOG_VISIBLE, type FogRuntime } from "@/engine/systems";
import { Speed } from "@/engine/world/components";
import { createGameWorld, spawnBuilding, spawnResource, spawnUnit } from "@/engine/world/gameWorld";
import { syncGameWorldDiagnostics } from "./runtimeDiagnostics";

describe("engine/diagnostics/enhanced", () => {
	it("populates performance counters from world time", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16;
		world.time.tick = 100;

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.performance.frameTimeMs).toBe(16);
		expect(diag.performance.fps).toBe(63); // Math.round(1000/16)
		expect(diag.tick).toBe(100);
	});

	it("detects boundary violations", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		// Entity inside bounds
		spawnUnit(world, { x: 500, y: 500, faction: "ura" });
		// Entity outside bounds (negative)
		const outsideEid = spawnUnit(world, { x: -100, y: 300, faction: "ura" });
		// Entity outside bounds (too far right)
		const farEid = spawnUnit(world, { x: 64 * 32 + 100, y: 300, faction: "ura" });

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.pathfinding.boundaryViolations.length).toBe(2);
		expect(diag.pathfinding.boundaryViolations).toContain(outsideEid);
		expect(diag.pathfinding.boundaryViolations).toContain(farEid);
	});

	it("detects stuck entities with move orders but no speed", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		const eid = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		// Give move order but zero speed
		world.runtime.orderQueues.set(eid, [{ type: "move", targetX: 200, targetY: 200 }]);
		Speed.value[eid] = 0;

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.pathfinding.stuckEntities.length).toBe(1);
		expect(diag.pathfinding.stuckEntities[0]).toBe(eid);
	});

	it("does not flag entities without move orders as stuck", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		const eid = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Speed.value[eid] = 0; // No speed, but no orders either

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.pathfinding.stuckEntities.length).toBe(0);
	});

	it("counts fog visible tiles", () => {
		const world = createGameWorld();
		world.navigation.width = 10;
		world.navigation.height = 10;
		world.time.deltaMs = 16;

		// Initialize fog grid and mark some tiles visible
		const fogRuntime = world.runtime as FogRuntime;
		fogRuntime.fogGrid = createFogGrid(10, 10);
		fogRuntime.fogGrid[0] = FOG_VISIBLE;
		fogRuntime.fogGrid[1] = FOG_VISIBLE;
		fogRuntime.fogGrid[2] = FOG_VISIBLE;
		fogRuntime.fogGrid[11] = FOG_VISIBLE;
		fogRuntime.fogGrid[22] = FOG_VISIBLE;

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.fogVisibleTiles).toBe(5);
	});

	it("counts minimap visible entities", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		// Player entities — always visible on minimap
		spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		spawnUnit(world, { x: 200, y: 200, faction: "ura" });

		// Enemy entity — not visible without fog
		spawnUnit(world, { x: 500, y: 500, faction: "scale_guard" });

		const diag = syncGameWorldDiagnostics(world);

		// 2 player entities visible, enemy not (no fog grid = not counted)
		expect(diag.minimapVisibleEntities).toBe(2);
	});

	it("counts enemy entities visible in fog", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		// Initialize fog grid
		const fogRuntime = world.runtime as FogRuntime;
		fogRuntime.fogGrid = createFogGrid(64, 48);

		// Player entity
		spawnUnit(world, { x: 100, y: 100, faction: "ura" });

		// Enemy in a visible tile
		const _enemyInLight = spawnUnit(world, { x: 64, y: 64, faction: "scale_guard" });
		// Mark the tile at (2, 2) as visible (64/32=2, 64/32=2 => index 2*64+2=130)
		fogRuntime.fogGrid[2 * 64 + 2] = FOG_VISIBLE;

		// Enemy in an unexplored tile (should not count)
		spawnUnit(world, { x: 1000, y: 1000, faction: "scale_guard" });

		const diag = syncGameWorldDiagnostics(world);

		// 1 player + 1 visible enemy = 2
		expect(diag.minimapVisibleEntities).toBe(2);
	});

	it("records objective transition events", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16;
		world.session.objectives = [
			{ id: "gather-timber", description: "Gather timber", status: "completed", bonus: false },
			{ id: "destroy-outpost", description: "Destroy outpost", status: "active", bonus: false },
		];

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.objectives.length).toBe(2);
		expect(diag.objectives[0].status).toBe("completed");
		expect(diag.objectives[1].status).toBe("active");
	});

	it("records seed metadata", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16;

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.seedPhrase).toBe("silent-ember-heron");
		expect(typeof diag.designSeed).toBe("number");
		expect(typeof diag.gameplaySeeds).toBe("object");
	});

	it("skips buildings and resources for pathfinding anomalies", () => {
		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 48;
		world.time.deltaMs = 16;

		// Building outside bounds — should not be flagged
		spawnBuilding(world, { x: -100, y: -100, faction: "ura", buildingType: "barracks" });
		// Resource outside bounds — should not be flagged
		spawnResource(world, { x: -200, y: -200, resourceType: "fish_spot" });

		const diag = syncGameWorldDiagnostics(world);

		expect(diag.pathfinding.boundaryViolations.length).toBe(0);
	});
});
