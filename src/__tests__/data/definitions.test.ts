import { describe, expect, it } from "vitest";
import { ALL_BUILDINGS, SCALE_GUARD_BUILDINGS, URA_BUILDINGS } from "@/data/buildings";
import { FACTIONS, SCALE_GUARD_FACTION, URA_FACTION } from "@/data/factions";
import { ALL_RESEARCH, RESEARCH } from "@/data/research";
import { ALL_HEROES, ALL_UNITS, SCALE_GUARD_UNITS, URA_HEROES, URA_UNITS } from "@/data/units";

// ---------------------------------------------------------------------------
// Unit Stat Validation
// ---------------------------------------------------------------------------

describe("URA Units", () => {
	it("has 7 trainable unit types", () => {
		expect(Object.keys(URA_UNITS)).toHaveLength(7);
	});

	it("has 6 heroes", () => {
		expect(Object.keys(URA_HEROES)).toHaveLength(6);
	});

	describe("River Rat", () => {
		const u = URA_UNITS.river_rat;
		it("costs 50 fish", () => {
			expect(u.cost).toEqual({ fish: 50 });
		});
		it("has 40 HP, 0 armor, 5 melee damage, range 1, speed 10", () => {
			expect(u.hp).toBe(40);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(5);
			expect(u.damageType).toBe("melee");
			expect(u.range).toBe(1);
			expect(u.speed).toBe(10);
		});
		it("costs 1 pop, unlocks at mission 1, trains at command_post", () => {
			expect(u.pop).toBe(1);
			expect(u.unlock).toBe(1);
			expect(u.trainAt).toBe("command_post");
		});
	});

	describe("Mudfoot", () => {
		const u = URA_UNITS.mudfoot;
		it("costs 80 fish, 20 salvage", () => {
			expect(u.cost).toEqual({ fish: 80, salvage: 20 });
		});
		it("has 80 HP, 2 armor, 12 melee damage", () => {
			expect(u.hp).toBe(80);
			expect(u.armor).toBe(2);
			expect(u.damage).toBe(12);
			expect(u.damageType).toBe("melee");
			expect(u.range).toBe(1);
			expect(u.speed).toBe(8);
		});
		it("unlocks at mission 1, trains at barracks", () => {
			expect(u.unlock).toBe(1);
			expect(u.trainAt).toBe("barracks");
		});
	});

	describe("Shellcracker", () => {
		const u = URA_UNITS.shellcracker;
		it("costs 70 fish, 30 salvage", () => {
			expect(u.cost).toEqual({ fish: 70, salvage: 30 });
		});
		it("has 50 HP, 0 armor, 10 ranged damage at range 5", () => {
			expect(u.hp).toBe(50);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(10);
			expect(u.damageType).toBe("ranged");
			expect(u.range).toBe(5);
			expect(u.speed).toBe(9);
		});
		it("unlocks at mission 3", () => {
			expect(u.unlock).toBe(3);
		});
	});

	describe("Sapper", () => {
		const u = URA_UNITS.sapper;
		it("costs 100 fish, 50 salvage", () => {
			expect(u.cost).toEqual({ fish: 100, salvage: 50 });
		});
		it("has 60 HP, 1 armor, 8 damage vs units, 30 damage vs buildings", () => {
			expect(u.hp).toBe(60);
			expect(u.armor).toBe(1);
			expect(u.damage).toBe(8);
			expect(u.damageVsBuildings).toBe(30);
		});
		it("unlocks at mission 5, trains at armory", () => {
			expect(u.unlock).toBe(5);
			expect(u.trainAt).toBe("armory");
		});
	});

	describe("Raftsman", () => {
		const u = URA_UNITS.raftsman;
		it("costs 60 timber, 20 salvage", () => {
			expect(u.cost).toEqual({ timber: 60, salvage: 20 });
		});
		it("has 100 HP, 3 armor, 0 damage (no attack)", () => {
			expect(u.hp).toBe(100);
			expect(u.armor).toBe(3);
			expect(u.damage).toBe(0);
		});
		it("unlocks at mission 7, trains at dock", () => {
			expect(u.unlock).toBe(7);
			expect(u.trainAt).toBe("dock");
		});
	});

	describe("Mortar Otter", () => {
		const u = URA_UNITS.mortar_otter;
		it("costs 80 fish, 60 salvage", () => {
			expect(u.cost).toEqual({ fish: 80, salvage: 60 });
		});
		it("has 45 HP, 0 armor, 20 ranged damage at range 7", () => {
			expect(u.hp).toBe(45);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(20);
			expect(u.damageType).toBe("ranged");
			expect(u.range).toBe(7);
		});
		it("unlocks at mission 9, trains at armory", () => {
			expect(u.unlock).toBe(9);
			expect(u.trainAt).toBe("armory");
		});
	});

	describe("Diver", () => {
		const u = URA_UNITS.diver;
		it("costs 60 fish, 40 salvage", () => {
			expect(u.cost).toEqual({ fish: 60, salvage: 40 });
		});
		it("has 35 HP, 0 armor, 8 melee damage, speed 12", () => {
			expect(u.hp).toBe(35);
			expect(u.armor).toBe(0);
			expect(u.damage).toBe(8);
			expect(u.speed).toBe(12);
		});
		it("unlocks at mission 9, trains at dock", () => {
			expect(u.unlock).toBe(9);
			expect(u.trainAt).toBe("dock");
		});
	});
});

describe("URA Heroes", () => {
	it("all heroes have pop 0 and isHero true", () => {
		for (const hero of Object.values(URA_HEROES)) {
			expect(hero.pop).toBe(0);
			expect(hero.isHero).toBe(true);
		}
	});

	it("Sgt. Bubbles has 120 HP, speed 14, unlocks at mission 1", () => {
		const h = URA_HEROES.sgt_bubbles;
		expect(h.hp).toBe(120);
		expect(h.speed).toBe(14);
		expect(h.unlock).toBe(1);
	});

	it("Gen. Whiskers has 200 HP, speed 10, unlocks at mission 4", () => {
		const h = URA_HEROES.gen_whiskers;
		expect(h.hp).toBe(200);
		expect(h.speed).toBe(10);
		expect(h.unlock).toBe(4);
	});

	it("Cpl. Splash has 80 HP, speed 18, unlocks at mission 8", () => {
		const h = URA_HEROES.cpl_splash;
		expect(h.hp).toBe(80);
		expect(h.speed).toBe(18);
		expect(h.unlock).toBe(8);
	});

	it("Sgt. Fang has 150 HP, speed 12, unlocks at mission 12", () => {
		const h = URA_HEROES.sgt_fang;
		expect(h.hp).toBe(150);
		expect(h.speed).toBe(12);
		expect(h.unlock).toBe(12);
	});

	it("Medic Marina has 80 HP, speed 16, unlocks at mission 10", () => {
		const h = URA_HEROES.medic_marina;
		expect(h.hp).toBe(80);
		expect(h.speed).toBe(16);
		expect(h.unlock).toBe(10);
	});

	it("Pvt. Muskrat has 120 HP, speed 11, unlocks at mission 14", () => {
		const h = URA_HEROES.pvt_muskrat;
		expect(h.hp).toBe(120);
		expect(h.speed).toBe(11);
		expect(h.unlock).toBe(14);
	});
});

describe("Scale-Guard Units", () => {
	it("has 7 unit types", () => {
		expect(Object.keys(SCALE_GUARD_UNITS)).toHaveLength(7);
	});

	it("Skink: 30 HP, 0 armor, 4 melee damage, speed 10", () => {
		const u = SCALE_GUARD_UNITS.skink;
		expect(u.hp).toBe(30);
		expect(u.armor).toBe(0);
		expect(u.damage).toBe(4);
		expect(u.speed).toBe(10);
	});

	it("Gator: 120 HP, 4 armor, 18 melee damage, speed 5", () => {
		const u = SCALE_GUARD_UNITS.gator;
		expect(u.hp).toBe(120);
		expect(u.armor).toBe(4);
		expect(u.damage).toBe(18);
		expect(u.speed).toBe(5);
	});

	it("Viper: 35 HP, 0 armor, 8 ranged damage at range 5, speed 8", () => {
		const u = SCALE_GUARD_UNITS.viper;
		expect(u.hp).toBe(35);
		expect(u.armor).toBe(0);
		expect(u.damage).toBe(8);
		expect(u.range).toBe(5);
		expect(u.speed).toBe(8);
	});

	it("Snapper: 80 HP, 3 armor, 14 ranged damage at range 6, speed 0", () => {
		const u = SCALE_GUARD_UNITS.snapper;
		expect(u.hp).toBe(80);
		expect(u.armor).toBe(3);
		expect(u.damage).toBe(14);
		expect(u.range).toBe(6);
		expect(u.speed).toBe(0);
	});

	it("Scout Lizard: 25 HP, 0 armor, 3 melee damage, speed 14", () => {
		const u = SCALE_GUARD_UNITS.scout_lizard;
		expect(u.hp).toBe(25);
		expect(u.damage).toBe(3);
		expect(u.speed).toBe(14);
	});

	it("Croc Champion: 200 HP, 5 armor, 25 melee damage, speed 6", () => {
		const u = SCALE_GUARD_UNITS.croc_champion;
		expect(u.hp).toBe(200);
		expect(u.armor).toBe(5);
		expect(u.damage).toBe(25);
		expect(u.speed).toBe(6);
	});

	it("Siphon Drone: 40 HP, 1 armor, 0 damage, range 3, speed 7", () => {
		const u = SCALE_GUARD_UNITS.siphon_drone;
		expect(u.hp).toBe(40);
		expect(u.armor).toBe(1);
		expect(u.damage).toBe(0);
		expect(u.range).toBe(3);
		expect(u.speed).toBe(7);
	});

	it("all Scale-Guard units have faction scale_guard", () => {
		for (const u of Object.values(SCALE_GUARD_UNITS)) {
			expect(u.faction).toBe("scale_guard");
		}
	});
});

describe("ALL_UNITS aggregate", () => {
	it("contains all 14 units (7 URA + 7 Scale-Guard)", () => {
		expect(Object.keys(ALL_UNITS)).toHaveLength(14);
	});

	it("every unit id matches its key", () => {
		for (const [key, unit] of Object.entries(ALL_UNITS)) {
			expect(unit.id).toBe(key);
		}
	});

	it("every unit has positive HP", () => {
		for (const u of Object.values(ALL_UNITS)) {
			expect(u.hp).toBeGreaterThan(0);
		}
	});
});

describe("ALL_HEROES aggregate", () => {
	it("contains 6 heroes", () => {
		expect(Object.keys(ALL_HEROES)).toHaveLength(6);
	});
});

// ---------------------------------------------------------------------------
// Building Stat Validation
// ---------------------------------------------------------------------------

describe("URA Buildings", () => {
	it("has 12 building types", () => {
		expect(Object.keys(URA_BUILDINGS)).toHaveLength(12);
	});

	it("Command Post: 600 HP, costs 400 timber + 200 salvage, 60s build", () => {
		const b = URA_BUILDINGS.command_post;
		expect(b.hp).toBe(600);
		expect(b.cost).toEqual({ timber: 400, salvage: 200 });
		expect(b.buildTime).toBe(60);
		expect(b.trains).toContain("river_rat");
	});

	it("Barracks: 350 HP, costs 200 timber, 30s build, trains mudfoot + shellcracker", () => {
		const b = URA_BUILDINGS.barracks;
		expect(b.hp).toBe(350);
		expect(b.cost).toEqual({ timber: 200 });
		expect(b.buildTime).toBe(30);
		expect(b.trains).toEqual(["mudfoot", "shellcracker"]);
	});

	it("Armory: 400 HP, costs 300 timber + 100 salvage, 40s build, unlocks at mission 5", () => {
		const b = URA_BUILDINGS.armory;
		expect(b.hp).toBe(400);
		expect(b.cost).toEqual({ timber: 300, salvage: 100 });
		expect(b.buildTime).toBe(40);
		expect(b.unlock).toBe(5);
		expect(b.trains).toEqual(["sapper", "mortar_otter"]);
	});

	it("Watchtower: 200 HP, 6 damage, range 8, costs 150 timber", () => {
		const b = URA_BUILDINGS.watchtower;
		expect(b.hp).toBe(200);
		expect(b.damage).toBe(6);
		expect(b.range).toBe(8);
		expect(b.cost).toEqual({ timber: 150 });
	});

	it("Fish Trap: 80 HP, costs 100 timber, 15s build, passive income", () => {
		const b = URA_BUILDINGS.fish_trap;
		expect(b.hp).toBe(80);
		expect(b.cost).toEqual({ timber: 100 });
		expect(b.buildTime).toBe(15);
		expect(b.passive).toBeDefined();
	});

	it("Burrow: 100 HP, costs 80 timber, 10s build, +6 pop cap", () => {
		const b = URA_BUILDINGS.burrow;
		expect(b.hp).toBe(100);
		expect(b.cost).toEqual({ timber: 80 });
		expect(b.buildTime).toBe(10);
		expect(b.popCapBonus).toBe(6);
	});

	it("Dock: 300 HP, costs 250 timber + 50 salvage, 35s build, requires water", () => {
		const b = URA_BUILDINGS.dock;
		expect(b.hp).toBe(300);
		expect(b.cost).toEqual({ timber: 250, salvage: 50 });
		expect(b.buildTime).toBe(35);
		expect(b.requiresWater).toBe(true);
		expect(b.trains).toEqual(["raftsman", "diver"]);
	});

	it("Field Hospital: 250 HP, costs 200 timber + 100 salvage, 30s build, unlocks at mission 10", () => {
		const b = URA_BUILDINGS.field_hospital;
		expect(b.hp).toBe(250);
		expect(b.cost).toEqual({ timber: 200, salvage: 100 });
		expect(b.buildTime).toBe(30);
		expect(b.unlock).toBe(10);
	});

	it("Sandbag Wall: 150 HP, costs 50 timber, 5s build", () => {
		const b = URA_BUILDINGS.sandbag_wall;
		expect(b.hp).toBe(150);
		expect(b.cost).toEqual({ timber: 50 });
		expect(b.buildTime).toBe(5);
	});

	it("Stone Wall: 400 HP, costs 100 timber + 50 salvage, 10s build", () => {
		const b = URA_BUILDINGS.stone_wall;
		expect(b.hp).toBe(400);
		expect(b.cost).toEqual({ timber: 100, salvage: 50 });
		expect(b.buildTime).toBe(10);
	});

	it("Gun Tower: 350 HP, 12 damage, costs 200 timber + 100 salvage, 25s build", () => {
		const b = URA_BUILDINGS.gun_tower;
		expect(b.hp).toBe(350);
		expect(b.damage).toBe(12);
		expect(b.cost).toEqual({ timber: 200, salvage: 100 });
		expect(b.buildTime).toBe(25);
	});

	it("Minefield: 1 HP, 40 damage, costs 80 salvage, 8s build", () => {
		const b = URA_BUILDINGS.minefield;
		expect(b.hp).toBe(1);
		expect(b.damage).toBe(40);
		expect(b.cost).toEqual({ salvage: 80 });
		expect(b.buildTime).toBe(8);
	});
});

describe("Scale-Guard Buildings", () => {
	it("has 5 building types", () => {
		expect(Object.keys(SCALE_GUARD_BUILDINGS)).toHaveLength(5);
	});

	it("Sludge Pit: 500 HP, trains skink", () => {
		expect(SCALE_GUARD_BUILDINGS.sludge_pit.hp).toBe(500);
		expect(SCALE_GUARD_BUILDINGS.sludge_pit.trains).toContain("skink");
	});

	it("Spawning Pool: 350 HP, trains all combat units", () => {
		const b = SCALE_GUARD_BUILDINGS.spawning_pool;
		expect(b.hp).toBe(350);
		expect(b.trains).toContain("gator");
		expect(b.trains).toContain("viper");
		expect(b.trains).toContain("croc_champion");
	});

	it("Venom Spire: 250 HP, 10 damage, range 7", () => {
		const b = SCALE_GUARD_BUILDINGS.venom_spire;
		expect(b.hp).toBe(250);
		expect(b.damage).toBe(10);
		expect(b.range).toBe(7);
	});

	it("Scale Wall: 300 HP", () => {
		expect(SCALE_GUARD_BUILDINGS.scale_wall.hp).toBe(300);
	});
});

describe("ALL_BUILDINGS aggregate", () => {
	it("contains all 17 buildings (12 URA + 5 Scale-Guard)", () => {
		expect(Object.keys(ALL_BUILDINGS)).toHaveLength(17);
	});

	it("every building id matches its key", () => {
		for (const [key, b] of Object.entries(ALL_BUILDINGS)) {
			expect(b.id).toBe(key);
		}
	});
});

// ---------------------------------------------------------------------------
// Research Stat Validation
// ---------------------------------------------------------------------------

describe("Research", () => {
	it("has 9 research items", () => {
		expect(Object.keys(RESEARCH)).toHaveLength(9);
	});

	it("all research is at the armory", () => {
		for (const r of Object.values(RESEARCH)) {
			expect(r.researchAt).toBe("armory");
		}
	});

	it("Hardshell Armor: 150 salvage, 20s, unlocks at mission 5", () => {
		const r = RESEARCH.hardshell_armor;
		expect(r.cost).toEqual({ salvage: 150 });
		expect(r.time).toBe(20);
		expect(r.unlock).toBe(5);
	});

	it("Fish Oil Arrows: 100 salvage, 15s, unlocks at mission 5", () => {
		const r = RESEARCH.fish_oil_arrows;
		expect(r.cost).toEqual({ salvage: 100 });
		expect(r.time).toBe(15);
		expect(r.unlock).toBe(5);
	});

	it("Fortified Walls: 200 salvage, 25s, unlocks at mission 9", () => {
		const r = RESEARCH.fortified_walls;
		expect(r.cost).toEqual({ salvage: 200 });
		expect(r.time).toBe(25);
		expect(r.unlock).toBe(9);
	});

	it("Gun Emplacements: 250 salvage, 30s, unlocks at mission 9", () => {
		const r = RESEARCH.gun_emplacements;
		expect(r.cost).toEqual({ salvage: 250 });
		expect(r.time).toBe(30);
		expect(r.unlock).toBe(9);
	});

	it("Demolition Training: 150 salvage, 20s, unlocks at mission 9", () => {
		const r = RESEARCH.demolition_training;
		expect(r.cost).toEqual({ salvage: 150 });
		expect(r.time).toBe(20);
		expect(r.unlock).toBe(9);
	});

	it("Advanced Rafts: 100 salvage, 15s, unlocks at mission 7", () => {
		const r = RESEARCH.advanced_rafts;
		expect(r.cost).toEqual({ salvage: 100 });
		expect(r.time).toBe(15);
		expect(r.unlock).toBe(7);
	});

	it("Mortar Precision: 200 salvage, 25s, unlocks at mission 9", () => {
		const r = RESEARCH.mortar_precision;
		expect(r.cost).toEqual({ salvage: 200 });
		expect(r.time).toBe(25);
		expect(r.unlock).toBe(9);
	});

	it("Combat Medics: 150 salvage, 20s, unlocks at mission 10", () => {
		const r = RESEARCH.combat_medics;
		expect(r.cost).toEqual({ salvage: 150 });
		expect(r.time).toBe(20);
		expect(r.unlock).toBe(10);
	});

	it("Diving Gear: 100 salvage, 15s, unlocks at mission 9", () => {
		const r = RESEARCH.diving_gear;
		expect(r.cost).toEqual({ salvage: 100 });
		expect(r.time).toBe(15);
		expect(r.unlock).toBe(9);
	});

	it("ALL_RESEARCH matches RESEARCH", () => {
		expect(Object.keys(ALL_RESEARCH)).toEqual(Object.keys(RESEARCH));
	});
});

// ---------------------------------------------------------------------------
// Faction Validation
// ---------------------------------------------------------------------------

describe("Factions", () => {
	it("has exactly 2 factions", () => {
		expect(Object.keys(FACTIONS)).toHaveLength(2);
	});

	describe("URA", () => {
		it("has correct name and doctrine", () => {
			expect(URA_FACTION.name).toBe("Otter Elite Force");
			expect(URA_FACTION.doctrine).toContain("Liberation");
		});

		it("lists all 7 trainable unit ids", () => {
			expect(URA_FACTION.unitIds).toHaveLength(7);
			expect(URA_FACTION.unitIds).toContain("river_rat");
			expect(URA_FACTION.unitIds).toContain("mudfoot");
			expect(URA_FACTION.unitIds).toContain("diver");
		});

		it("lists all 6 hero ids", () => {
			expect(URA_FACTION.heroIds).toHaveLength(6);
			expect(URA_FACTION.heroIds).toContain("sgt_bubbles");
			expect(URA_FACTION.heroIds).toContain("gen_whiskers");
		});

		it("lists all 12 building ids", () => {
			expect(URA_FACTION.buildingIds).toHaveLength(12);
			expect(URA_FACTION.buildingIds).toContain("command_post");
			expect(URA_FACTION.buildingIds).toContain("barracks");
		});

		it("lists all 9 research ids", () => {
			expect(URA_FACTION.researchIds).toHaveLength(9);
			expect(URA_FACTION.researchIds).toContain("hardshell_armor");
		});
	});

	describe("Scale-Guard", () => {
		it("has correct name and doctrine", () => {
			expect(SCALE_GUARD_FACTION.name).toBe("Scale-Guard Militia");
			expect(SCALE_GUARD_FACTION.doctrine).toContain("Ambush");
		});

		it("lists all 7 unit ids", () => {
			expect(SCALE_GUARD_FACTION.unitIds).toHaveLength(7);
			expect(SCALE_GUARD_FACTION.unitIds).toContain("gator");
			expect(SCALE_GUARD_FACTION.unitIds).toContain("croc_champion");
		});

		it("has no heroes", () => {
			expect(SCALE_GUARD_FACTION.heroIds).toHaveLength(0);
		});

		it("lists all 5 building ids", () => {
			expect(SCALE_GUARD_FACTION.buildingIds).toHaveLength(5);
		});

		it("has no research", () => {
			expect(SCALE_GUARD_FACTION.researchIds).toHaveLength(0);
		});
	});
});

// ---------------------------------------------------------------------------
// Cross-Reference Integrity
// ---------------------------------------------------------------------------

describe("Cross-reference integrity", () => {
	it("every unit trainAt references an existing building", () => {
		for (const u of Object.values(ALL_UNITS)) {
			expect(ALL_BUILDINGS).toHaveProperty(u.trainAt);
		}
	});

	it("every building trains references correspond to existing units", () => {
		for (const b of Object.values(ALL_BUILDINGS)) {
			if (b.trains) {
				for (const unitId of b.trains) {
					expect(ALL_UNITS).toHaveProperty(unitId);
				}
			}
		}
	});

	it("every research researchAt references an existing building", () => {
		for (const r of Object.values(ALL_RESEARCH)) {
			expect(ALL_BUILDINGS).toHaveProperty(r.researchAt);
		}
	});
});
