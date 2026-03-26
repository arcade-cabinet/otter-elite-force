/**
 * Chapter integration tests — bootstrap each mission and run the system pipeline
 * to verify that all 16 missions boot, simulate, and produce valid entity state
 * on the new bitECS/GameWorld runtime.
 *
 * Covers US-D03 (Chapter 1), US-D04 (Chapter 2), US-D05 (Chapter 3), US-D06 (Chapter 4).
 */

import { describe, expect, it } from "vitest";
import { Faction, Flags, Health, Position } from "@/engine/world/components";
import { createGameWorld, flushRemovals, type GameWorld } from "@/engine/world/gameWorld";
import { bootstrapMission } from "./missionBootstrap";
import { createSystemPipeline } from "./systemPipeline";
import { createFogGrid, type FogRuntime } from "@/engine/systems";
import { CAMPAIGN } from "@/entities/missions";

/**
 * Shared helper: bootstrap a mission and run the system pipeline for N ticks.
 * Returns the final GameWorld state.
 */
function bootstrapAndSimulate(
	missionId: string,
	ticks: number,
	deltaMs = 16,
): { world: GameWorld; ticksRun: number } {
	const world = createGameWorld();
	bootstrapMission(world, missionId);

	// Initialize fog grid for fogSystem
	const fogRuntime = world.runtime as FogRuntime;
	fogRuntime.fogGrid = createFogGrid(world.navigation.width, world.navigation.height);

	const pipeline = createSystemPipeline(world);

	let ticksRun = 0;
	for (let tick = 0; tick < ticks; tick++) {
		world.time.tick = tick;
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		ticksRun = tick + 1;

		pipeline.step();

		// Early exit if session ended
		if (world.session.phase === "victory" || world.session.phase === "defeat") {
			break;
		}
	}

	pipeline.dispose();
	return { world, ticksRun };
}

/**
 * Count entities by faction and type.
 */
function countEntities(world: GameWorld, faction?: number, isBuilding?: boolean): number {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (faction !== undefined && Faction.id[eid] !== faction) continue;
		if (isBuilding !== undefined && (Flags.isBuilding[eid] === 1) !== isBuilding) continue;
		count++;
	}
	return count;
}

/**
 * Verify all entities have valid positions (non-NaN, non-infinite).
 */
function allPositionsValid(world: GameWorld): boolean {
	for (const eid of world.runtime.alive) {
		const x = Position.x[eid];
		const y = Position.y[eid];
		if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
	}
	return true;
}

/**
 * Verify all entities have non-negative health.
 */
function allHealthValid(world: GameWorld): boolean {
	for (const eid of world.runtime.alive) {
		if (Health.max[eid] > 0 && !Number.isFinite(Health.current[eid])) return false;
	}
	return true;
}

// ═══════════════════════════════════════════════════════════════════════
// CHAPTER 1: First Landing (Missions 1-4)
// ═══════════════════════════════════════════════════════════════════════

describe("Chapter 1: integration", () => {
	it("Mission 1 (Beachhead) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_1", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_1");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
		expect(allHealthValid(world)).toBe(true);

		// Player faction has units
		expect(countEntities(world, 1)).toBeGreaterThan(0);
		// Enemy faction has units
		expect(countEntities(world, 2)).toBeGreaterThan(0);
		// Resources exist
		const resources = [...world.runtime.alive].filter((eid) => Flags.isResource[eid] === 1);
		expect(resources.length).toBeGreaterThan(0);
	});

	it("Mission 1 objectives are initialized", () => {
		const { world } = bootstrapAndSimulate("mission_1", 1);

		const primaryObjectives = world.session.objectives.filter((o) => !o.bonus);
		const bonusObjectives = world.session.objectives.filter((o) => o.bonus);

		expect(primaryObjectives.length).toBe(7);
		expect(bonusObjectives.length).toBe(1);
		expect(primaryObjectives.every((o) => o.status === "active")).toBe(true);
	});

	it("Mission 1 zones registered correctly", () => {
		const { world } = bootstrapAndSimulate("mission_1", 1);

		expect(world.runtime.zoneRects.has("landing_zone")).toBe(true);
		expect(world.runtime.zoneRects.has("enemy_outpost")).toBe(true);
		expect(world.runtime.zoneRects.has("bridge_crossing")).toBe(true);
	});

	it("Mission 2 (Causeway) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_2", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_2");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
		expect(allHealthValid(world)).toBe(true);
	});

	it("Mission 3 (Firebase Delta) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_3", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_3");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
		expect(allHealthValid(world)).toBe(true);
	});

	it("Mission 4 (Prison Break) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_4", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_4");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
		expect(allHealthValid(world)).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// CHAPTER 2: Deep Water (Missions 5-8)
// ═══════════════════════════════════════════════════════════════════════

describe("Chapter 2: integration", () => {
	it("Mission 5 (Siphon Valley) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_5", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_5");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 6 (Monsoon Ambush) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_6", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_6");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 7 (River Rats) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_7", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_7");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 8 (Underwater Cache) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_8", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_8");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// CHAPTER 3: Burning Ground (Missions 9-12)
// ═══════════════════════════════════════════════════════════════════════

describe("Chapter 3: integration", () => {
	it("Mission 9 (Dense Canopy) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_9", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_9");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 10 (Scorched Earth) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_10", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_10");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 11 (Entrenchment) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_11", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_11");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 12 (Fang Rescue) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_12", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_12");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// CHAPTER 4: Endgame (Missions 13-16)
// ═══════════════════════════════════════════════════════════════════════

describe("Chapter 4: integration", () => {
	it("Mission 13 (Great Siphon) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_13", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_13");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 14 (Iron Delta) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_14", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_14");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 15 (Serpent Lair) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_15", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_15");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});

	it("Mission 16 (Last Stand) boots and simulates 300 ticks", () => {
		const { world, ticksRun } = bootstrapAndSimulate("mission_16", 300);

		expect(ticksRun).toBe(300);
		expect(world.session.currentMissionId).toBe("mission_16");
		expect(world.session.phase).toBe("playing");
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(allPositionsValid(world)).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// CROSS-CUTTING: All 16 missions boot and have valid initial state
// ═══════════════════════════════════════════════════════════════════════

describe("All 16 missions: bootstrap validation", () => {
	const missionIds = CAMPAIGN.map((m) => m.id);

	it("all 16 missions are registered", () => {
		expect(missionIds.length).toBe(16);
	});

	it.each(missionIds)("%s bootstraps with valid entity state", (missionId) => {
		const world = createGameWorld();
		bootstrapMission(world, missionId);

		// Every mission must produce at least 1 entity
		expect(world.runtime.alive.size).toBeGreaterThan(0);

		// Session state must be correctly set
		expect(world.session.currentMissionId).toBe(missionId);
		expect(world.session.phase).toBe("playing");

		// All positions must be finite numbers
		expect(allPositionsValid(world)).toBe(true);

		// All health values must be finite
		expect(allHealthValid(world)).toBe(true);

		// Objectives must exist
		expect(world.session.objectives.length).toBeGreaterThan(0);

		// Zones must be registered
		expect(world.runtime.zoneRects.size).toBeGreaterThan(0);

		// Navigation dimensions must be set
		expect(world.navigation.width).toBeGreaterThan(0);
		expect(world.navigation.height).toBeGreaterThan(0);
	});

	it.each(missionIds)("%s simulates 60 ticks without crash", (missionId) => {
		const { world, ticksRun } = bootstrapAndSimulate(missionId, 60);

		expect(ticksRun).toBe(60);
		expect(world.session.phase).toBe("playing");
		expect(allPositionsValid(world)).toBe(true);
	});
});
