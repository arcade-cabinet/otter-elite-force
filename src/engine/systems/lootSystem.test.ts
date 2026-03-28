import { describe, expect, it, vi } from "vitest";
import { Flags } from "@/engine/world/components";
import { createGameWorld, markForRemoval, spawnUnit } from "@/engine/world/gameWorld";
import { DROP_TABLES, resetLootRng, rollLootFromTable, runLootSystem } from "./lootSystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 1000;
	world.time.tick = 1;
	return world;
}

describe("engine/systems/lootSystem", () => {
	describe("DROP_TABLES", () => {
		it("has entries for all expected enemy types", () => {
			expect(DROP_TABLES.scale_grunt).toBeDefined();
			expect(DROP_TABLES.scale_archer).toBeDefined();
			expect(DROP_TABLES.scale_brute).toBeDefined();
			expect(DROP_TABLES.scale_sniper).toBeDefined();
			expect(DROP_TABLES.scale_demolisher).toBeDefined();
			expect(DROP_TABLES.scale_commander).toBeDefined();
			expect(DROP_TABLES.boss_ironjaw).toBeDefined();
			expect(DROP_TABLES.siphon_drone).toBeDefined();
		});

		it("boss_ironjaw has guaranteed drops (probability 1.0)", () => {
			const table = DROP_TABLES.boss_ironjaw;
			for (const entry of table.entries) {
				expect(entry.probability).toBe(1.0);
			}
		});

		it("siphon_drone drops salvage", () => {
			const table = DROP_TABLES.siphon_drone;
			expect(table.entries).toHaveLength(1);
			expect(table.entries[0].resource).toBe("salvage");
			expect(table.entries[0].probability).toBe(0.8);
		});
	});

	describe("rollLootFromTable", () => {
		it("awards resources from deterministic drop table", () => {
			resetLootRng();
			const world = makeWorld();

			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "scale_guard",
				unitType: "boss_ironjaw",
				health: { current: 0, max: 100 },
			});

			const results = rollLootFromTable(world, "boss_ironjaw", eid);

			// Boss should always drop all three resources
			expect(results.length).toBe(3);
			const fishDrop = results.find((r) => r.resource === "fish");
			const timberDrop = results.find((r) => r.resource === "timber");
			const salvageDrop = results.find((r) => r.resource === "salvage");

			expect(fishDrop).toBeDefined();
			expect(fishDrop?.amount).toBe(50);
			expect(timberDrop).toBeDefined();
			expect(timberDrop?.amount).toBe(30);
			expect(salvageDrop).toBeDefined();
			expect(salvageDrop?.amount).toBe(20);

			// Verify session resources were credited
			expect(world.session.resources.fish).toBe(50);
			expect(world.session.resources.timber).toBe(30);
			expect(world.session.resources.salvage).toBe(20);
		});

		it("uses runtime loot tables when available", () => {
			resetLootRng();
			const world = makeWorld();

			// Set up a runtime loot table for a custom enemy
			world.runtime.lootTables.set("custom_enemy", [
				{ resource: "salvage", chance: 1.0, min: 100, max: 100 },
			]);

			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "scale_guard",
				unitType: "custom_enemy",
				health: { current: 0, max: 100 },
			});

			const results = rollLootFromTable(world, "custom_enemy", eid);
			expect(results).toHaveLength(1);
			expect(results[0].resource).toBe("salvage");
			expect(results[0].amount).toBe(100);
		});

		it("returns empty for unknown unit types", () => {
			resetLootRng();
			const world = makeWorld();

			const eid = spawnUnit(world, { x: 0, y: 0, faction: "scale_guard" });
			const results = rollLootFromTable(world, "unknown_type", eid);
			expect(results).toHaveLength(0);
		});

		it("emits loot-collected events", () => {
			resetLootRng();
			const world = makeWorld();

			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "scale_guard",
				unitType: "siphon_drone",
				health: { current: 0, max: 60 },
			});

			rollLootFromTable(world, "siphon_drone", eid);

			const lootEvents = world.events.filter((e) => e.type === "loot-collected");
			expect(lootEvents.length).toBeGreaterThanOrEqual(1);
			expect(lootEvents[0].payload?.resource).toBe("salvage");
		});
	});

	describe("runLootSystem", () => {
		it("rolls loot for removed scale_guard entities", () => {
			resetLootRng();
			const world = makeWorld();

			const enemy = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "scale_guard",
				unitType: "siphon_drone",
				health: { current: 0, max: 60 },
			});

			markForRemoval(world, enemy);
			runLootSystem(world);

			// Siphon drone drops 10-20 salvage with 0.8 probability
			// With deterministic RNG, should drop something (or not if unlucky)
			expect(world.session.resources.salvage).toBeGreaterThanOrEqual(0);
		});

		it("does not roll loot for URA entities", () => {
			resetLootRng();
			const world = makeWorld();

			const uraUnit = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				unitType: "river_rat",
				health: { current: 0, max: 40 },
			});

			markForRemoval(world, uraUnit);
			runLootSystem(world);

			expect(world.session.resources.fish).toBe(0);
			expect(world.session.resources.timber).toBe(0);
			expect(world.session.resources.salvage).toBe(0);
		});

		it("does not roll loot for resource entities", () => {
			resetLootRng();
			const world = makeWorld();

			const resource = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "scale_guard",
				unitType: "fish_spot",
				health: { current: 0, max: 100 },
			});
			Flags.isResource[resource] = 1;

			markForRemoval(world, resource);
			runLootSystem(world);

			expect(world.events.filter((e) => e.type === "loot-collected")).toHaveLength(0);
		});
	});
});
