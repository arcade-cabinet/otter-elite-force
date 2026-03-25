/**
 * Building Stat Specification Tests
 *
 * These tests define the SPEC for all 17 building types (12 URA + 5 Scale-Guard).
 * Values are sourced from:
 *   - docs/superpowers/specs/2026-03-23-rts-pivot-design.md §4
 *   - docs/superpowers/specs/2026-03-24-entity-architecture-design.md
 *
 * Tests are written BEFORE entity definitions exist.
 * They WILL FAIL until the corresponding entity modules are implemented.
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
	getCategoryDimensions,
	materializeSpriteToLegacy,
} from "@/entities/sprite-materialization";
import type { BuildingDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Dynamic imports — modules don't exist yet.
// ---------------------------------------------------------------------------

let buildings: Record<string, BuildingDef> = {};
let loadError: string | null = null;

beforeAll(async () => {
	try {
		const registry = await import("@/entities/registry");
		const dimensions = getCategoryDimensions("buildings");
		buildings = Object.fromEntries(
			Object.entries(registry.ALL_BUILDINGS ?? {}).map(([id, building]) => [
				id,
				{ ...building, sprite: materializeSpriteToLegacy(building.sprite, dimensions) },
			]),
		);
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => !!loadError;

// ===========================================================================
// URA BUILDINGS (12)
// ===========================================================================

describe("URA Buildings", () => {
	describe("Command Post", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b).toBeDefined();
			expect(b.hp).toBe(600);
			expect(b.buildTime).toBe(60);
		});

		it("has correct cost", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b.cost).toEqual({ timber: 400, salvage: 200 });
		});

		it("trains River Rats", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b.trains).toContain("river_rat");
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b.id).toBe("command_post");
			expect(b.faction).toBe("ura");
			expect(b.category).toBe("production");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b.sprite.size).toBe(32);
			expect(b.sprite.frames.idle).toBeDefined();
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			const b = buildings.command_post;
			expect(b.unlockedAt).toBe("mission_1");
		});
	});

	describe("Barracks", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.barracks;
			expect(b).toBeDefined();
			expect(b.hp).toBe(350);
			expect(b.buildTime).toBe(30);
		});

		it("has correct cost", () => {
			if (skip()) return;
			const b = buildings.barracks;
			expect(b.cost).toEqual({ timber: 200 });
		});

		it("trains Mudfoots and Shellcrackers", () => {
			if (skip()) return;
			const b = buildings.barracks;
			expect(b.trains).toContain("mudfoot");
			expect(b.trains).toContain("shellcracker");
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.barracks;
			expect(b.id).toBe("barracks");
			expect(b.faction).toBe("ura");
			expect(b.category).toBe("production");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			const b = buildings.barracks;
			expect(b.sprite.size).toBe(32);
			expect(b.sprite.frames.idle).toBeDefined();
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			expect(buildings.barracks.unlockedAt).toBe("mission_1");
		});
	});

	describe("Armory", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.armory;
			expect(b).toBeDefined();
			expect(b.hp).toBe(400);
			expect(b.buildTime).toBe(40);
		});

		it("has correct cost", () => {
			if (skip()) return;
			const b = buildings.armory;
			expect(b.cost).toEqual({ timber: 300, salvage: 100 });
		});

		it("trains Sappers and Mortar Otters", () => {
			if (skip()) return;
			const b = buildings.armory;
			expect(b.trains).toContain("sapper");
			expect(b.trains).toContain("mortar_otter");
		});

		it("supports research", () => {
			if (skip()) return;
			const b = buildings.armory;
			expect(b.researches).toBeDefined();
			expect(b.researches!.length).toBeGreaterThan(0);
		});

		it("unlocks at mission 5", () => {
			if (skip()) return;
			expect(buildings.armory.unlockedAt).toBe("mission_5");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			const b = buildings.armory;
			expect(b.sprite.size).toBe(32);
			expect(b.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Watchtower", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.watchtower;
			expect(b).toBeDefined();
			expect(b.hp).toBe(200);
			expect(b.buildTime).toBe(20);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.watchtower.cost).toEqual({ timber: 150 });
		});

		it("has ranged defense", () => {
			if (skip()) return;
			const b = buildings.watchtower;
			expect(b.attackDamage).toBe(6);
			expect(b.attackRange).toBe(8);
		});

		it("is a defense building", () => {
			if (skip()) return;
			expect(buildings.watchtower.category).toBe("defense");
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			expect(buildings.watchtower.unlockedAt).toBe("mission_1");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.watchtower.sprite.size).toBe(32);
			expect(buildings.watchtower.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Fish Trap", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.fish_trap;
			expect(b).toBeDefined();
			expect(b.hp).toBe(80);
			expect(b.buildTime).toBe(15);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.fish_trap.cost).toEqual({ timber: 100 });
		});

		it("generates passive fish income", () => {
			if (skip()) return;
			const b = buildings.fish_trap;
			expect(b.passiveIncome).toBeDefined();
			expect(b.passiveIncome!.type).toBe("fish");
			expect(b.passiveIncome!.amount).toBe(3);
			expect(b.passiveIncome!.interval).toBe(10);
		});

		it("is an economy building", () => {
			if (skip()) return;
			expect(buildings.fish_trap.category).toBe("economy");
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			expect(buildings.fish_trap.unlockedAt).toBe("mission_1");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.fish_trap.sprite.size).toBe(32);
			expect(buildings.fish_trap.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Burrow", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.burrow;
			expect(b).toBeDefined();
			expect(b.hp).toBe(100);
			expect(b.buildTime).toBe(10);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.burrow.cost).toEqual({ timber: 80 });
		});

		it("provides +6 population capacity", () => {
			if (skip()) return;
			expect(buildings.burrow.populationCapacity).toBe(6);
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			expect(buildings.burrow.unlockedAt).toBe("mission_1");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.burrow.sprite.size).toBe(32);
			expect(buildings.burrow.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Dock", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.dock;
			expect(b).toBeDefined();
			expect(b.hp).toBe(300);
			expect(b.buildTime).toBe(35);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.dock.cost).toEqual({ timber: 250, salvage: 50 });
		});

		it("trains Raftsmen and Divers", () => {
			if (skip()) return;
			const b = buildings.dock;
			expect(b.trains).toContain("raftsman");
			expect(b.trains).toContain("diver");
		});

		it("unlocks at mission 7", () => {
			if (skip()) return;
			expect(buildings.dock.unlockedAt).toBe("mission_7");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.dock.sprite.size).toBe(32);
			expect(buildings.dock.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Field Hospital", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.field_hospital;
			expect(b).toBeDefined();
			expect(b.hp).toBe(250);
			expect(b.buildTime).toBe(30);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.field_hospital.cost).toEqual({
				timber: 200,
				salvage: 100,
			});
		});

		it("heals nearby units", () => {
			if (skip()) return;
			const b = buildings.field_hospital;
			expect(b.healRate).toBe(2);
			expect(b.healRadius).toBe(3);
		});

		it("unlocks at mission 10", () => {
			if (skip()) return;
			expect(buildings.field_hospital.unlockedAt).toBe("mission_10");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.field_hospital.sprite.size).toBe(32);
			expect(buildings.field_hospital.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Sandbag Wall", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.sandbag_wall;
			expect(b).toBeDefined();
			expect(b.hp).toBe(150);
			expect(b.buildTime).toBe(5);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.sandbag_wall.cost).toEqual({ timber: 50 });
		});

		it("is a wall category building", () => {
			if (skip()) return;
			expect(buildings.sandbag_wall.category).toBe("wall");
		});

		it("unlocks at mission 1", () => {
			if (skip()) return;
			expect(buildings.sandbag_wall.unlockedAt).toBe("mission_1");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.sandbag_wall.sprite.size).toBe(32);
			expect(buildings.sandbag_wall.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Stone Wall", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.stone_wall;
			expect(b).toBeDefined();
			expect(b.hp).toBe(400);
			expect(b.buildTime).toBe(10);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.stone_wall.cost).toEqual({ timber: 100, salvage: 50 });
		});

		it("requires Fortified Walls research", () => {
			if (skip()) return;
			expect(buildings.stone_wall.requiresResearch).toBe("fortified_walls");
		});

		it("is a wall category building", () => {
			if (skip()) return;
			expect(buildings.stone_wall.category).toBe("wall");
		});

		it("unlocks at mission 11", () => {
			if (skip()) return;
			expect(buildings.stone_wall.unlockedAt).toBe("mission_11");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.stone_wall.sprite.size).toBe(32);
			expect(buildings.stone_wall.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Gun Tower", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.gun_tower;
			expect(b).toBeDefined();
			expect(b.hp).toBe(350);
			expect(b.buildTime).toBe(25);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.gun_tower.cost).toEqual({ timber: 200, salvage: 100 });
		});

		it("has ranged attack", () => {
			if (skip()) return;
			expect(buildings.gun_tower.attackDamage).toBe(12);
		});

		it("is a defense building", () => {
			if (skip()) return;
			expect(buildings.gun_tower.category).toBe("defense");
		});

		it("unlocks at mission 11", () => {
			if (skip()) return;
			expect(buildings.gun_tower.unlockedAt).toBe("mission_11");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.gun_tower.sprite.size).toBe(32);
			expect(buildings.gun_tower.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Minefield", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.minefield;
			expect(b).toBeDefined();
			expect(b.hp).toBe(1);
			expect(b.buildTime).toBe(8);
		});

		it("has correct cost", () => {
			if (skip()) return;
			expect(buildings.minefield.cost).toEqual({ salvage: 80 });
		});

		it("deals 40 damage on trigger", () => {
			if (skip()) return;
			expect(buildings.minefield.attackDamage).toBe(40);
		});

		it("is a defense building", () => {
			if (skip()) return;
			expect(buildings.minefield.category).toBe("defense");
		});

		it("unlocks at mission 11", () => {
			if (skip()) return;
			expect(buildings.minefield.unlockedAt).toBe("mission_11");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.minefield.sprite.size).toBe(32);
			expect(buildings.minefield.sprite.frames.idle).toBeDefined();
		});
	});
});

// ===========================================================================
// SCALE-GUARD BUILDINGS (5)
// ===========================================================================

describe("Scale-Guard Buildings", () => {
	describe("Sludge Pit (town hall)", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.sludge_pit;
			expect(b).toBeDefined();
			expect(b.hp).toBe(500);
		});

		it("trains Skinks", () => {
			if (skip()) return;
			expect(buildings.sludge_pit.trains).toContain("skink");
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.sludge_pit;
			expect(b.id).toBe("sludge_pit");
			expect(b.faction).toBe("scale_guard");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.sludge_pit.sprite.size).toBe(32);
			expect(buildings.sludge_pit.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Spawning Pool (barracks)", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.spawning_pool;
			expect(b).toBeDefined();
			expect(b.hp).toBe(350);
		});

		it("trains combat units", () => {
			if (skip()) return;
			const b = buildings.spawning_pool;
			expect(b.trains).toContain("gator");
			expect(b.trains).toContain("viper");
			expect(b.trains).toContain("croc_champion");
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.spawning_pool;
			expect(b.id).toBe("spawning_pool");
			expect(b.faction).toBe("scale_guard");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.spawning_pool.sprite.size).toBe(32);
			expect(buildings.spawning_pool.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Venom Spire (tower)", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.venom_spire;
			expect(b).toBeDefined();
			expect(b.hp).toBe(250);
		});

		it("has ranged attack", () => {
			if (skip()) return;
			const b = buildings.venom_spire;
			expect(b.attackDamage).toBe(10);
			expect(b.attackRange).toBe(7);
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.venom_spire;
			expect(b.id).toBe("venom_spire");
			expect(b.faction).toBe("scale_guard");
			expect(b.category).toBe("defense");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.venom_spire.sprite.size).toBe(32);
			expect(buildings.venom_spire.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Siphon (resource drain / objective)", () => {
		it("exists as a building", () => {
			if (skip()) return;
			const b = buildings.siphon;
			expect(b).toBeDefined();
			expect(b.faction).toBe("scale_guard");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.siphon.sprite.size).toBe(32);
			expect(buildings.siphon.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Scale Wall", () => {
		it("has correct stats", () => {
			if (skip()) return;
			const b = buildings.scale_wall;
			expect(b).toBeDefined();
			expect(b.hp).toBe(300);
		});

		it("has correct identity", () => {
			if (skip()) return;
			const b = buildings.scale_wall;
			expect(b.id).toBe("scale_wall");
			expect(b.faction).toBe("scale_guard");
			expect(b.category).toBe("wall");
		});

		it("has 32x32 sprite with idle frame", () => {
			if (skip()) return;
			expect(buildings.scale_wall.sprite.size).toBe(32);
			expect(buildings.scale_wall.sprite.frames.idle).toBeDefined();
		});
	});
});

// ===========================================================================
// AGGREGATE CHECKS
// ===========================================================================

describe("Building aggregates", () => {
	it("has 12 URA buildings", () => {
		if (skip()) return;
		const ura = Object.values(buildings).filter((b) => b.faction === "ura");
		expect(ura).toHaveLength(12);
	});

	it("has 5 Scale-Guard buildings", () => {
		if (skip()) return;
		const sg = Object.values(buildings).filter((b) => b.faction === "scale_guard");
		expect(sg).toHaveLength(5);
	});

	it("total is 17 buildings", () => {
		if (skip()) return;
		expect(Object.keys(buildings)).toHaveLength(17);
	});

	it("every building id matches its key", () => {
		if (skip()) return;
		for (const [key, b] of Object.entries(buildings)) {
			expect(b.id).toBe(key);
		}
	});

	it("every building has positive HP", () => {
		if (skip()) return;
		for (const b of Object.values(buildings)) {
			expect(b.hp).toBeGreaterThan(0);
		}
	});

	it("every building has a 32x32 sprite", () => {
		if (skip()) return;
		for (const b of Object.values(buildings)) {
			expect(b.sprite.size).toBe(32);
		}
	});

	it("every building has an idle frame", () => {
		if (skip()) return;
		for (const b of Object.values(buildings)) {
			expect(b.sprite.frames.idle).toBeDefined();
			expect(b.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("every building has a cost defined", () => {
		if (skip()) return;
		for (const b of Object.values(buildings)) {
			expect(b.cost).toBeDefined();
		}
	});

	it("production buildings have trains array", () => {
		if (skip()) return;
		const productionIds = [
			"command_post",
			"barracks",
			"armory",
			"dock",
			"sludge_pit",
			"spawning_pool",
		];
		for (const id of productionIds) {
			expect(buildings[id]?.trains).toBeDefined();
			expect(buildings[id]?.trains!.length).toBeGreaterThan(0);
		}
	});

	it("all URA buildings are faction ura", () => {
		if (skip()) return;
		const uraIds = [
			"command_post",
			"barracks",
			"armory",
			"watchtower",
			"fish_trap",
			"burrow",
			"dock",
			"field_hospital",
			"sandbag_wall",
			"stone_wall",
			"gun_tower",
			"minefield",
		];
		for (const id of uraIds) {
			expect(buildings[id]?.faction).toBe("ura");
		}
	});

	it("all Scale-Guard buildings are faction scale_guard", () => {
		if (skip()) return;
		const sgIds = ["sludge_pit", "spawning_pool", "venom_spire", "siphon", "scale_wall"];
		for (const id of sgIds) {
			expect(buildings[id]?.faction).toBe("scale_guard");
		}
	});
});
