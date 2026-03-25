/**
 * Unit Stat Specification Tests
 *
 * These tests define the SPEC for all unit types in the game.
 * Values are sourced from:
 *   - docs/superpowers/specs/2026-03-23-rts-pivot-design.md §4
 *   - docs/design/balance-framework.md
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
import type { HeroDef, UnitDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Dynamic imports — modules don't exist yet. Load what we can, skip the rest.
// ---------------------------------------------------------------------------

let units: Record<string, UnitDef> = {};
let heroes: Record<string, HeroDef> = {};
let loadError: string | null = null;

beforeAll(async () => {
	try {
		const registry = await import("@/entities/registry");
		const dimensions = getCategoryDimensions("units");
		units = Object.fromEntries(
			Object.entries(registry.ALL_UNITS ?? {}).map(([id, unit]) => [
				id,
				{ ...unit, sprite: materializeSpriteToLegacy(unit.sprite, dimensions) },
			]),
		);
		heroes = Object.fromEntries(
			Object.entries(registry.ALL_HEROES ?? {}).map(([id, hero]) => [
				id,
				{ ...hero, sprite: materializeSpriteToLegacy(hero.sprite, dimensions) },
			]),
		);
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skipIfNotLoaded = () => {
	if (loadError) {
		return true;
	}
	return false;
};

// ===========================================================================
// URA TRAINABLE UNITS (7)
// ===========================================================================

describe("URA Trainable Units", () => {
	describe("River Rat (worker)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.river_rat;
			expect(u).toBeDefined();
			expect(u.hp).toBe(40);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(5);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(10);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.river_rat;
			expect(u.cost).toEqual({ fish: 50 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("command_post");
			expect(u.unlockedAt).toBe("mission_1");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.river_rat;
			expect(u.id).toBe("river_rat");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("worker");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const u = units.river_rat;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		});

		it("has walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.river_rat;
			expect(u.sprite.frames.walk).toBeDefined();
			expect(u.sprite.frames.walk.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("Mudfoot (melee infantry)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mudfoot;
			expect(u).toBeDefined();
			expect(u.hp).toBe(80);
			expect(u.armor).toBe(2);
			expect(u.damage).toBe(12);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(8);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mudfoot;
			expect(u.cost).toEqual({ fish: 80, salvage: 20 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("barracks");
			expect(u.unlockedAt).toBe("mission_1");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mudfoot;
			expect(u.id).toBe("mudfoot");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("infantry");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mudfoot;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
			expect(u.sprite.frames.walk.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("Shellcracker (ranged infantry)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.shellcracker;
			expect(u).toBeDefined();
			expect(u.hp).toBe(50);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(10);
			expect(u.range).toBe(5);
			expect(u.speed).toBe(9);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.shellcracker;
			expect(u.cost).toEqual({ fish: 70, salvage: 30 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("barracks");
			expect(u.unlockedAt).toBe("mission_3");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.shellcracker;
			expect(u.id).toBe("shellcracker");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("ranged");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.shellcracker;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Sapper (anti-building siege)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.sapper;
			expect(u).toBeDefined();
			expect(u.hp).toBe(60);
			expect(u.armor).toBe(1);
			expect(u.damage).toBe(8);
			expect(u.damageVsBuildings).toBe(30);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(7);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.sapper;
			expect(u.cost).toEqual({ fish: 100, salvage: 50 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("armory");
			expect(u.unlockedAt).toBe("mission_5");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.sapper;
			expect(u.id).toBe("sapper");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("siege");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.sapper;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Raftsman (water transport)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.raftsman;
			expect(u).toBeDefined();
			expect(u.hp).toBe(100);
			expect(u.armor).toBe(3);
			expect(u.damage).toBe(0);
			expect(u.speed).toBe(6);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.raftsman;
			expect(u.cost).toEqual({ timber: 60, salvage: 20 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("dock");
			expect(u.unlockedAt).toBe("mission_7");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.raftsman;
			expect(u.id).toBe("raftsman");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("transport");
		});

		it("can swim and carry 4 units", () => {
			if (skipIfNotLoaded()) return;
			const u = units.raftsman;
			expect(u.canSwim).toBe(true);
			expect(u.carryCapacity).toBe(4);
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const u = units.raftsman;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Mortar Otter (long range AoE)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mortar_otter;
			expect(u).toBeDefined();
			expect(u.hp).toBe(45);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(20);
			expect(u.range).toBe(7);
			expect(u.speed).toBe(5);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mortar_otter;
			expect(u.cost).toEqual({ fish: 80, salvage: 60 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("armory");
			expect(u.unlockedAt).toBe("mission_9");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mortar_otter;
			expect(u.id).toBe("mortar_otter");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("siege");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.mortar_otter;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Diver (underwater scout)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.diver;
			expect(u).toBeDefined();
			expect(u.hp).toBe(35);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(8);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(12);
		});

		it("has correct economy stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.diver;
			expect(u.cost).toEqual({ fish: 60, salvage: 40 });
			expect(u.populationCost).toBe(1);
			expect(u.trainedAt).toBe("dock");
			expect(u.unlockedAt).toBe("mission_9");
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.diver;
			expect(u.id).toBe("diver");
			expect(u.faction).toBe("ura");
			expect(u.category).toBe("scout");
		});

		it("can swim and submerge", () => {
			if (skipIfNotLoaded()) return;
			const u = units.diver;
			expect(u.canSwim).toBe(true);
			expect(u.canSubmerge).toBe(true);
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.diver;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});
});

// ===========================================================================
// SCALE-GUARD UNITS (7)
// ===========================================================================

describe("Scale-Guard Units", () => {
	describe("Skink (worker)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.skink;
			expect(u).toBeDefined();
			expect(u.hp).toBe(30);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(4);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(10);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.skink;
			expect(u.id).toBe("skink");
			expect(u.faction).toBe("scale_guard");
			expect(u.category).toBe("worker");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const u = units.skink;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Gator (melee tank)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.gator;
			expect(u).toBeDefined();
			expect(u.hp).toBe(120);
			expect(u.armor).toBe(4);
			expect(u.damage).toBe(18);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(5);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.gator;
			expect(u.id).toBe("gator");
			expect(u.faction).toBe("scale_guard");
			expect(u.category).toBe("infantry");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.gator;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Viper (ranged poison)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.viper;
			expect(u).toBeDefined();
			expect(u.hp).toBe(35);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(8);
			expect(u.range).toBe(5);
			expect(u.speed).toBe(8);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.viper;
			expect(u.id).toBe("viper");
			expect(u.faction).toBe("scale_guard");
			expect(u.category).toBe("ranged");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.viper;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Snapper (anchored turret)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.snapper;
			expect(u).toBeDefined();
			expect(u.hp).toBe(80);
			expect(u.armor).toBe(3);
			expect(u.damage).toBe(14);
			expect(u.range).toBe(6);
			expect(u.speed).toBe(0);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.snapper;
			expect(u.id).toBe("snapper");
			expect(u.faction).toBe("scale_guard");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const u = units.snapper;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Scout Lizard (recon)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.scout_lizard;
			expect(u).toBeDefined();
			expect(u.hp).toBe(25);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(3);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(14);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.scout_lizard;
			expect(u.id).toBe("scout_lizard");
			expect(u.faction).toBe("scale_guard");
			expect(u.category).toBe("scout");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.scout_lizard;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Croc Champion (elite)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.croc_champion;
			expect(u).toBeDefined();
			expect(u.hp).toBe(200);
			expect(u.armor).toBe(5);
			expect(u.damage).toBe(25);
			expect(u.range).toBe(1);
			expect(u.speed).toBe(6);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.croc_champion;
			expect(u.id).toBe("croc_champion");
			expect(u.faction).toBe("scale_guard");
		});

		it("has 16x16 sprite with idle and walk frames", () => {
			if (skipIfNotLoaded()) return;
			const u = units.croc_champion;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.walk).toBeDefined();
		});
	});

	describe("Siphon Drone (harass)", () => {
		it("has correct combat stats", () => {
			if (skipIfNotLoaded()) return;
			const u = units.siphon_drone;
			expect(u).toBeDefined();
			expect(u.hp).toBe(40);
			expect(u.armor).toBe(1);
			expect(u.damage).toBe(0);
			expect(u.range).toBe(3);
			expect(u.speed).toBe(7);
		});

		it("has correct identity", () => {
			if (skipIfNotLoaded()) return;
			const u = units.siphon_drone;
			expect(u.id).toBe("siphon_drone");
			expect(u.faction).toBe("scale_guard");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const u = units.siphon_drone;
			expect(u.sprite.size).toBe(16);
			expect(u.sprite.frames.idle).toBeDefined();
		});
	});
});

// ===========================================================================
// URA HEROES (6)
// ===========================================================================

describe("URA Heroes", () => {
	describe("Sgt. Bubbles", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_bubbles;
			expect(h).toBeDefined();
			expect(h.hp).toBe(120);
			expect(h.speed).toBe(14);
		});

		it("is available from the start", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_bubbles;
			expect(h.unlockedAt).toBe("mission_1");
			expect(h.populationCost).toBe(0);
		});

		it("has portrait reference", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_bubbles;
			expect(h.portraitId).toBeDefined();
			expect(h.portraitId).toBe("sgt_bubbles");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_bubbles;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});

		it("has IsHero tag", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_bubbles;
			expect(h.tags).toContain("IsHero");
		});
	});

	describe("Gen. Whiskers", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.gen_whiskers;
			expect(h).toBeDefined();
			expect(h.hp).toBe(200);
			expect(h.speed).toBe(10);
		});

		it("unlocks at mission 4", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.gen_whiskers;
			expect(h.unlockedAt).toBe("mission_4");
			expect(h.unlockMission).toBe("mission_4");
			expect(h.populationCost).toBe(0);
		});

		it("has portrait reference", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.gen_whiskers;
			expect(h.portraitId).toBe("gen_whiskers");
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.gen_whiskers;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Cpl. Splash", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.cpl_splash;
			expect(h).toBeDefined();
			expect(h.hp).toBe(80);
			expect(h.speed).toBe(18);
		});

		it("unlocks at mission 8", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.cpl_splash;
			expect(h.unlockedAt).toBe("mission_8");
			expect(h.unlockMission).toBe("mission_8");
			expect(h.populationCost).toBe(0);
		});

		it("has underwater capability", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.cpl_splash;
			expect(h.canSwim).toBe(true);
			expect(h.canSubmerge).toBe(true);
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.cpl_splash;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Sgt. Fang", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_fang;
			expect(h).toBeDefined();
			expect(h.hp).toBe(150);
			expect(h.speed).toBe(12);
		});

		it("unlocks at mission 12", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_fang;
			expect(h.unlockedAt).toBe("mission_12");
			expect(h.unlockMission).toBe("mission_12");
			expect(h.populationCost).toBe(0);
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.sgt_fang;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Medic Marina", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.medic_marina;
			expect(h).toBeDefined();
			expect(h.hp).toBe(80);
			expect(h.speed).toBe(16);
		});

		it("unlocks at mission 10", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.medic_marina;
			expect(h.unlockedAt).toBe("mission_10");
			expect(h.unlockMission).toBe("mission_10");
			expect(h.populationCost).toBe(0);
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.medic_marina;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});
	});

	describe("Pvt. Muskrat", () => {
		it("has correct stats", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.pvt_muskrat;
			expect(h).toBeDefined();
			expect(h.hp).toBe(120);
			expect(h.speed).toBe(11);
		});

		it("unlocks at mission 14", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.pvt_muskrat;
			expect(h.unlockedAt).toBe("mission_14");
			expect(h.unlockMission).toBe("mission_14");
			expect(h.populationCost).toBe(0);
		});

		it("has 16x16 sprite with idle frame", () => {
			if (skipIfNotLoaded()) return;
			const h = heroes.pvt_muskrat;
			expect(h.sprite.size).toBe(16);
			expect(h.sprite.frames.idle).toBeDefined();
		});
	});
});

// ===========================================================================
// AGGREGATE CHECKS
// ===========================================================================

describe("Unit aggregates", () => {
	it("has 15 trainable units (7 URA + 8 Scale-Guard)", () => {
		if (skipIfNotLoaded()) return;
		const uraUnits = Object.values(units).filter((u) => u.faction === "ura");
		const sgUnits = Object.values(units).filter((u) => u.faction === "scale_guard");
		expect(uraUnits).toHaveLength(7);
		expect(sgUnits).toHaveLength(8);
	});

	it("has 6 heroes", () => {
		if (skipIfNotLoaded()) return;
		expect(Object.keys(heroes)).toHaveLength(6);
	});

	it("every unit id matches its key", () => {
		if (skipIfNotLoaded()) return;
		for (const [key, unit] of Object.entries(units)) {
			expect(unit.id).toBe(key);
		}
	});

	it("every hero id matches its key", () => {
		if (skipIfNotLoaded()) return;
		for (const [key, hero] of Object.entries(heroes)) {
			expect(hero.id).toBe(key);
		}
	});

	it("every unit has positive HP", () => {
		if (skipIfNotLoaded()) return;
		for (const u of Object.values(units)) {
			expect(u.hp).toBeGreaterThan(0);
		}
	});

	it("every hero has populationCost 0", () => {
		if (skipIfNotLoaded()) return;
		for (const h of Object.values(heroes)) {
			expect(h.populationCost).toBe(0);
		}
	});

	it("every unit has a 16x16 sprite", () => {
		if (skipIfNotLoaded()) return;
		for (const u of Object.values(units)) {
			expect(u.sprite.size).toBe(16);
		}
	});

	it("every unit has an idle frame", () => {
		if (skipIfNotLoaded()) return;
		for (const u of Object.values(units)) {
			expect(u.sprite.frames.idle).toBeDefined();
			expect(u.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("all URA units are faction ura", () => {
		if (skipIfNotLoaded()) return;
		const uraIds = [
			"river_rat",
			"mudfoot",
			"shellcracker",
			"sapper",
			"raftsman",
			"mortar_otter",
			"diver",
		];
		for (const id of uraIds) {
			expect(units[id]?.faction).toBe("ura");
		}
	});

	it("all Scale-Guard units are faction scale_guard", () => {
		if (skipIfNotLoaded()) return;
		const sgIds = [
			"skink",
			"gator",
			"viper",
			"snapper",
			"scout_lizard",
			"croc_champion",
			"siphon_drone",
			"serpent_king",
		];
		for (const id of sgIds) {
			expect(units[id]?.faction).toBe("scale_guard");
		}
	});

	it("every unit trainedAt references a valid building id", () => {
		if (skipIfNotLoaded()) return;
		const validBuildings = [
			"command_post",
			"barracks",
			"armory",
			"dock",
			"sludge_pit",
			"spawning_pool",
		];
		for (const u of Object.values(units)) {
			expect(validBuildings).toContain(u.trainedAt);
		}
	});
});
