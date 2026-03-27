import { describe, expect, it, vi } from "vitest";
import { createGameWorld } from "@/engine/world/gameWorld";
import {
	type EncounterEntry,
	initEncounterEntries,
	resetEncounterState,
	runEncounterSystem,
} from "./encounterSystemEngine";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

// Mock entity registry since encounter system uses it
vi.mock("@/entities/registry", () => ({
	getUnit: vi.fn((id: string) => ({
		id,
		name: id.charAt(0).toUpperCase() + id.slice(1),
		faction: "scale_guard",
		category: "infantry",
		hp: 50,
		armor: 0,
		damage: 8,
		range: 1,
		attackCooldown: 1.5,
		speed: 5,
		visionRadius: 5,
		cost: { fish: 0, timber: 0, salvage: 0 },
		populationCost: 1,
		trainTime: 5000,
		trainedAt: "barracks",
		unlockedAt: "mission_1",
		tags: [],
		sprite: { atlas: "", row: 0, col: 0 },
	})),
}));

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 0;
	world.time.tick = 0;
	return world;
}

describe("engine/systems/encounterSystemEngine", () => {
	beforeEach(() => {
		resetEncounterState();
	});

	describe("initEncounterEntries", () => {
		it("initializes encounter entries and state arrays", () => {
			const world = makeWorld();
			const entries: EncounterEntry[] = [
				{
					composition: [{ unitType: "gator", count: 2, variance: 0 }],
					spawnZone: "patrol",
					intervalMs: 10_000,
					intervalVariance: 0,
					maxSpawns: 3,
				},
			];

			initEncounterEntries(world, entries);

			expect(world.runtime.encounterEntries).toHaveLength(1);
			expect(world.runtime.encounterState).toHaveLength(1);
			expect(world.runtime.encounterState[0].timerMs).toBe(0);
			expect(world.runtime.encounterState[0].spawnCount).toBe(0);
		});

		it("uses default entries when none provided", () => {
			const world = makeWorld();
			initEncounterEntries(world);

			expect(world.runtime.encounterEntries.length).toBeGreaterThan(0);
		});
	});

	describe("runEncounterSystem", () => {
		it("does nothing when no entries are configured", () => {
			const world = makeWorld();
			world.time.deltaMs = 1000;

			runEncounterSystem(world);

			// No events should be emitted
			const encounterEvents = world.events.filter((e) => e.type === "encounter-spawned");
			expect(encounterEvents).toHaveLength(0);
		});

		it("does nothing when deltaMs is 0", () => {
			const world = makeWorld();
			world.time.deltaMs = 0;

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 1, variance: 0 }],
					spawnZone: "patrol",
					intervalMs: 1000,
					intervalVariance: 0,
					maxSpawns: 10,
				},
			]);

			runEncounterSystem(world);
			expect(world.events.filter((e) => e.type === "encounter-spawned")).toHaveLength(0);
		});

		it("spawns enemies when timer exceeds interval and zone exists", () => {
			const world = makeWorld();

			// Set up a patrol zone
			world.runtime.zoneRects.set("patrol_zone_1", {
				x: 100,
				y: 100,
				width: 200,
				height: 200,
			});

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 2, variance: 0 }],
					spawnZone: "patrol",
					intervalMs: 5000,
					intervalVariance: 0,
					maxSpawns: 3,
				},
			]);

			// Advance past the interval
			world.time.deltaMs = 6000;
			world.time.tick = 1;

			runEncounterSystem(world);

			const encounterEvents = world.events.filter((e) => e.type === "encounter-spawned");
			expect(encounterEvents).toHaveLength(1);
			expect(world.runtime.encounterState[0].spawnCount).toBe(1);
		});

		it("does not spawn when timer is below interval", () => {
			const world = makeWorld();

			world.runtime.zoneRects.set("patrol_zone_1", {
				x: 100,
				y: 100,
				width: 200,
				height: 200,
			});

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 1, variance: 0 }],
					spawnZone: "patrol",
					intervalMs: 10000,
					intervalVariance: 0,
					maxSpawns: 3,
				},
			]);

			world.time.deltaMs = 3000;
			world.time.tick = 1;

			runEncounterSystem(world);

			expect(world.events.filter((e) => e.type === "encounter-spawned")).toHaveLength(0);
		});

		it("respects maxSpawns limit", () => {
			const world = makeWorld();

			world.runtime.zoneRects.set("patrol_zone", {
				x: 100,
				y: 100,
				width: 200,
				height: 200,
			});

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 1, variance: 0 }],
					spawnZone: "patrol",
					intervalMs: 1000,
					intervalVariance: 0,
					maxSpawns: 2,
				},
			]);

			// Spawn twice
			for (let i = 0; i < 4; i++) {
				world.time.deltaMs = 2000;
				world.time.tick = i + 1;
				runEncounterSystem(world);
			}

			expect(world.runtime.encounterState[0].spawnCount).toBe(2);
		});

		it("respects phase requirement", () => {
			const world = makeWorld();
			world.runtime.scenarioPhase = "initial";

			world.runtime.zoneRects.set("encounter_zone", {
				x: 100,
				y: 100,
				width: 200,
				height: 200,
			});

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 1, variance: 0 }],
					spawnZone: "encounter",
					intervalMs: 1000,
					intervalVariance: 0,
					maxSpawns: 5,
					requiresPhase: "combat",
				},
			]);

			world.time.deltaMs = 5000;
			world.time.tick = 1;
			runEncounterSystem(world);

			// Should not spawn because phase doesn't match
			expect(world.events.filter((e) => e.type === "encounter-spawned")).toHaveLength(0);

			// Now change phase
			world.runtime.scenarioPhase = "combat";
			world.time.deltaMs = 5000;
			world.time.tick = 2;
			runEncounterSystem(world);

			expect(world.events.filter((e) => e.type === "encounter-spawned")).toHaveLength(1);
		});

		it("does not spawn when no matching zone exists", () => {
			const world = makeWorld();

			initEncounterEntries(world, [
				{
					composition: [{ unitType: "gator", count: 1, variance: 0 }],
					spawnZone: "nonexistent_zone",
					intervalMs: 1000,
					intervalVariance: 0,
					maxSpawns: 5,
				},
			]);

			world.time.deltaMs = 5000;
			world.time.tick = 1;
			runEncounterSystem(world);

			expect(world.events.filter((e) => e.type === "encounter-spawned")).toHaveLength(0);
		});
	});
});
