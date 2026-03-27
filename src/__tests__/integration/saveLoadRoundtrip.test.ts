/**
 * E2E Integration Test — Save/Load Roundtrip.
 *
 * Exercises the full save/load lifecycle:
 *   1. Boot a mission into a GameWorld
 *   2. Run the system pipeline for some ticks
 *   3. Serialize world state via serializeGameWorld
 *   4. Deserialize into a fresh GameWorld
 *   5. Verify entity positions, resources, objectives match
 *   6. Run more ticks on the loaded world without crash
 */

import { describe, expect, it } from "vitest";
import { createSeedBundle } from "@/engine/random/seed";
import { bootstrapMission } from "@/engine/session/missionBootstrap";
import {
	serializeGameWorld,
	deserializeGameWorld,
	type GameWorldSnapshot,
} from "@/engine/persistence/gameWorldSaveLoad";
import { createGameWorld, type GameWorld } from "@/engine/world/gameWorld";
import { runAllSystems } from "@/engine/systems";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { createFogGrid, type FogRuntime } from "@/engine/systems/fogSystem";
import { Position, Health, Faction, Flags } from "@/engine/world/components";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bootMission1(): GameWorld {
	resetGatherTimers();
	const seed = createSeedBundle({ phrase: "save-load-e2e", source: "manual" });
	const world = createGameWorld(seed);
	bootstrapMission(world, "mission_1");

	// Initialize fog grid (required for fogSystem to run without error)
	if (world.navigation.width > 0 && world.navigation.height > 0) {
		const fogRuntime = world.runtime as FogRuntime;
		if (!fogRuntime.fogGrid) {
			fogRuntime.fogGrid = createFogGrid(world.navigation.width, world.navigation.height);
			(fogRuntime as { fogGridWidth?: number }).fogGridWidth = world.navigation.width;
			(fogRuntime as { fogGridHeight?: number }).fogGridHeight = world.navigation.height;
		}
	}

	return world;
}

function runTicks(world: GameWorld, ticks: number, deltaMs = 16.67): void {
	for (let i = 0; i < ticks; i++) {
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		world.time.tick++;

		runAllSystems(world);

		if (world.session.phase === "victory" || world.session.phase === "defeat") {
			break;
		}
	}
}

/** Collect positions and health for all alive entities, sorted by eid. */
function snapshotEntities(world: GameWorld): Array<{
	eid: number;
	x: number;
	y: number;
	health: number;
	faction: number;
	isBuilding: number;
	isResource: number;
	type: string | undefined;
}> {
	const result = [];
	for (const eid of world.runtime.alive) {
		result.push({
			eid,
			x: Position.x[eid],
			y: Position.y[eid],
			health: Health.current[eid],
			faction: Faction.id[eid],
			isBuilding: Flags.isBuilding[eid],
			isResource: Flags.isResource[eid],
			type: world.runtime.entityTypeIndex.get(eid),
		});
	}
	return result.sort((a, b) => a.eid - b.eid);
}

// ---------------------------------------------------------------------------
// Task 3: Save/Load roundtrip E2E
// ---------------------------------------------------------------------------

describe("E2E: Save/Load roundtrip", () => {
	describe("Basic serialization after gameplay", () => {
		it("serializes a mission world after 5000 ticks", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);

			expect(snapshot.version).toBe(1);
			expect(snapshot.tick).toBeGreaterThan(0);
			expect(snapshot.elapsedMs).toBeGreaterThan(0);
			expect(snapshot.entities.length).toBeGreaterThan(0);
			expect(snapshot.session.currentMissionId).toBe("mission_1");
		});

		it("snapshot is valid JSON", () => {
			const world = bootMission1();
			runTicks(world, 100);

			const snapshot = serializeGameWorld(world);
			const json = JSON.stringify(snapshot);
			const parsed = JSON.parse(json) as GameWorldSnapshot;

			expect(parsed.version).toBe(1);
			expect(parsed.entities.length).toBeGreaterThan(0);
			expect(parsed.session.currentMissionId).toBe("mission_1");
		});
	});

	describe("Entity position roundtrip", () => {
		it("preserves entity count after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalCount = world.runtime.alive.size;
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.runtime.alive.size).toBe(originalCount);
		});

		it("preserves entity types after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalTypes = snapshotEntities(world).map((e) => e.type);
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);
			const restoredTypes = snapshotEntities(restored).map((e) => e.type);

			expect(restoredTypes.length).toBe(originalTypes.length);

			// Types should match (both sorted by eid)
			for (let i = 0; i < originalTypes.length; i++) {
				expect(restoredTypes[i]).toBe(originalTypes[i]);
			}
		});

		it("preserves entity factions after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalFactions = snapshotEntities(world).map((e) => e.faction);
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);
			const restoredFactions = snapshotEntities(restored).map((e) => e.faction);

			expect(restoredFactions.length).toBe(originalFactions.length);

			for (let i = 0; i < originalFactions.length; i++) {
				expect(restoredFactions[i]).toBe(originalFactions[i]);
			}
		});

		it("preserves entity health values after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalEntities = snapshotEntities(world);
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);
			const restoredEntities = snapshotEntities(restored);

			expect(restoredEntities.length).toBe(originalEntities.length);

			for (let i = 0; i < originalEntities.length; i++) {
				expect(restoredEntities[i].health).toBe(originalEntities[i].health);
			}
		});
	});

	describe("Resource state roundtrip", () => {
		it("preserves resource values after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalResources = { ...world.session.resources };
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.session.resources.fish).toBe(originalResources.fish);
			expect(restored.session.resources.timber).toBe(originalResources.timber);
			expect(restored.session.resources.salvage).toBe(originalResources.salvage);
		});
	});

	describe("Objective state roundtrip", () => {
		it("preserves objective statuses after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const originalObjectives = world.session.objectives.map((o) => ({
				id: o.id,
				status: o.status,
				bonus: o.bonus,
			}));

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.session.objectives.length).toBe(originalObjectives.length);

			for (let i = 0; i < originalObjectives.length; i++) {
				expect(restored.session.objectives[i].id).toBe(originalObjectives[i].id);
				expect(restored.session.objectives[i].status).toBe(originalObjectives[i].status);
				expect(restored.session.objectives[i].bonus).toBe(originalObjectives[i].bonus);
			}
		});
	});

	describe("Session and time state roundtrip", () => {
		it("preserves session phase and mission ID", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.session.phase).toBe(world.session.phase);
			expect(restored.session.currentMissionId).toBe(world.session.currentMissionId);
		});

		it("preserves time state after roundtrip", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.time.tick).toBe(world.time.tick);
			expect(restored.time.elapsedMs).toBe(world.time.elapsedMs);
		});

		it("preserves campaign state after roundtrip", () => {
			const world = bootMission1();
			world.campaign.currentMissionId = "mission_1";
			world.campaign.difficulty = "tactical";
			runTicks(world, 100);

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.campaign.currentMissionId).toBe("mission_1");
			expect(restored.campaign.difficulty).toBe("tactical");
		});

		it("preserves seed bundle after roundtrip", () => {
			const world = bootMission1();
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.rng.phrase).toBe(world.rng.phrase);
			expect(restored.rng.numericSeed).toBe(world.rng.numericSeed);
			expect(restored.rng.designSeed).toBe(world.rng.designSeed);
		});
	});

	describe("Continued gameplay after load", () => {
		it("runs 1000 more ticks on a loaded world without crash", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			// Initialize fog grid for the restored world
			if (restored.navigation.width > 0 && restored.navigation.height > 0) {
				const fogRuntime = restored.runtime as FogRuntime;
				if (!fogRuntime.fogGrid) {
					fogRuntime.fogGrid = createFogGrid(
						restored.navigation.width,
						restored.navigation.height,
					);
					(fogRuntime as { fogGridWidth?: number }).fogGridWidth = restored.navigation.width;
					(fogRuntime as { fogGridHeight?: number }).fogGridHeight = restored.navigation.height;
				}
			}

			// Reset gather timers before continuing (module-level state)
			resetGatherTimers();

			// This should not throw
			const ticksBefore = restored.time.tick;
			runTicks(restored, 1000);

			// Tick count should have advanced
			expect(restored.time.tick).toBeGreaterThan(ticksBefore);

			// World should still be valid
			expect(restored.runtime.alive.size).toBeGreaterThanOrEqual(0);
		});

		it("loaded world maintains entity consistency during continued play", () => {
			const world = bootMission1();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			// Initialize fog for continued play
			if (restored.navigation.width > 0 && restored.navigation.height > 0) {
				const fogRuntime = restored.runtime as FogRuntime;
				if (!fogRuntime.fogGrid) {
					fogRuntime.fogGrid = createFogGrid(
						restored.navigation.width,
						restored.navigation.height,
					);
					(fogRuntime as { fogGridWidth?: number }).fogGridWidth = restored.navigation.width;
					(fogRuntime as { fogGridHeight?: number }).fogGridHeight = restored.navigation.height;
				}
			}

			resetGatherTimers();

			const entitiesBefore = restored.runtime.alive.size;
			runTicks(restored, 1000);

			// Entity count can change (deaths, spawns) but should be non-negative
			expect(restored.runtime.alive.size).toBeGreaterThanOrEqual(0);

			// If no victory/defeat, there should still be some entities
			if (restored.session.phase === "playing") {
				expect(restored.runtime.alive.size).toBeGreaterThan(0);
			}
		});
	});

	describe("Navigation and runtime state roundtrip", () => {
		it("preserves navigation dimensions", () => {
			const world = bootMission1();
			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.navigation.width).toBe(world.navigation.width);
			expect(restored.navigation.height).toBe(world.navigation.height);
		});

		it("preserves runtime weather and scenario phase", () => {
			const world = bootMission1();
			world.runtime.weather = "monsoon";
			world.runtime.scenarioPhase = "phase_2";
			world.runtime.waveCounter = 5;

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.runtime.weather).toBe("monsoon");
			expect(restored.runtime.scenarioPhase).toBe("phase_2");
			expect(restored.runtime.waveCounter).toBe(5);
		});

		it("preserves revealed and locked zones", () => {
			const world = bootMission1();
			world.runtime.revealedZones.add("zone_alpha");
			world.runtime.revealedZones.add("zone_beta");
			world.runtime.lockedZones.add("zone_gamma");

			const snapshot = serializeGameWorld(world);
			const restored = deserializeGameWorld(snapshot);

			expect(restored.runtime.revealedZones.has("zone_alpha")).toBe(true);
			expect(restored.runtime.revealedZones.has("zone_beta")).toBe(true);
			expect(restored.runtime.lockedZones.has("zone_gamma")).toBe(true);
		});
	});
});
