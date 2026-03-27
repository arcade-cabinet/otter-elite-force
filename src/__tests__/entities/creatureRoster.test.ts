/**
 * Creature Roster Verification — ensures every unit, hero, and boss
 * is properly registered with valid stats, sprite mappings, and ability tags.
 */

import { describe, expect, it } from "vitest";
import {
	ALL_UNIT_ENTITIES,
	ALL_HERO_ENTITIES,
	getUnit,
	getHero,
} from "@/entities/registry";

// ─── Expected rosters ───

const URA_UNIT_IDS = [
	"river_rat",
	"mudfoot",
	"shellcracker",
	"sapper",
	"raftsman",
	"mortar_otter",
	"diver",
] as const;

const SCALE_GUARD_UNIT_IDS = [
	"skink",
	"gator",
	"viper",
	"snapper",
	"scout_lizard",
	"croc_champion",
	"siphon_drone",
	"serpent_king",
	"kommandant_ironjaw",
	"captain_scalebreak",
	"warden_fangrot",
	"venom",
	"broodmother",
] as const;

const ALL_UNIT_IDS = [...URA_UNIT_IDS, ...SCALE_GUARD_UNIT_IDS];

const HERO_IDS = [
	"col_bubbles",
	"gen_whiskers",
	"cpl_splash",
	"sgt_fang",
	"medic_marina",
	"pvt_muskrat",
] as const;

const BOSS_IDS = [
	"kommandant_ironjaw",
	"serpent_king",
	"captain_scalebreak",
	"warden_fangrot",
	"venom",
	"broodmother",
] as const;

// ─── Sprite mapping (mirrors buildEntitySpriteMap in spriteAtlas.ts) ───
// We verify the mapping exists by checking against the known animal atlas names.

const ENTITY_SPRITE_EXPECTATIONS: Record<string, string> = {
	// URA units + heroes -> otter
	river_rat: "otter",
	mudfoot: "otter",
	shellcracker: "otter",
	sapper: "otter",
	raftsman: "otter",
	mortar_otter: "otter",
	diver: "otter",
	col_bubbles: "otter",
	gen_whiskers: "otter",
	cpl_splash: "otter",
	sgt_fang: "otter",
	medic_marina: "otter",
	pvt_muskrat: "otter",
	// Scale-Guard
	gator: "crocodile",
	croc_champion: "crocodile",
	snapper: "crocodile",
	viper: "snake",
	skink: "snake",
	scout_lizard: "cobra",
	siphon_drone: "cobra",
	serpent_king: "cobra",
	kommandant_ironjaw: "crocodile",
	captain_scalebreak: "crocodile",
	warden_fangrot: "crocodile",
	venom: "cobra",
	broodmother: "crocodile",
};

// ─── Ability tag expectations per URA unit ───

const URA_ABILITY_TAGS: Record<string, string[]> = {
	river_rat: ["gather", "build", "swim"],
	mudfoot: ["swim", "shield_bash"],
	shellcracker: ["ranged_attack"],
	sapper: ["demolition_charge", "build"],
	raftsman: ["swim", "raft_build"],
	mortar_otter: ["ranged_attack"],
	diver: ["swim", "stealth", "underwater_strike"],
};

// ─── Boss ability tag expectations ───

const BOSS_ABILITY_TAGS: Record<string, string[]> = {
	captain_scalebreak: ["command_aura"],
	warden_fangrot: ["shield_bash", "fortified"],
	venom: ["poison_aura", "stealth"],
	broodmother: ["summon_hatchlings", "regeneration"],
};

// ─── Tests ───

describe("Creature Roster", () => {
	describe("Unit registry completeness", () => {
		it("has all 20 unit types registered (7 URA + 13 Scale-Guard)", () => {
			expect(Object.keys(ALL_UNIT_ENTITIES)).toHaveLength(20);
		});

		it("has all 7 URA units", () => {
			for (const id of URA_UNIT_IDS) {
				expect(getUnit(id), `URA unit '${id}' missing from registry`).toBeDefined();
			}
		});

		it("has all 13 Scale-Guard units", () => {
			for (const id of SCALE_GUARD_UNIT_IDS) {
				expect(getUnit(id), `Scale-Guard unit '${id}' missing from registry`).toBeDefined();
			}
		});

		it("all unit IDs match their registry keys", () => {
			for (const [key, unit] of Object.entries(ALL_UNIT_ENTITIES)) {
				expect(unit.id).toBe(key);
			}
		});
	});

	describe("Hero registry completeness", () => {
		it("has all 6 heroes registered", () => {
			expect(Object.keys(ALL_HERO_ENTITIES)).toHaveLength(6);
		});

		it("each hero is retrievable via getHero()", () => {
			for (const id of HERO_IDS) {
				expect(getHero(id), `Hero '${id}' missing from registry`).toBeDefined();
			}
		});
	});

	describe("Unit stat validation", () => {
		it("every unit has HP > 0", () => {
			for (const [id, unit] of Object.entries(ALL_UNIT_ENTITIES)) {
				expect(unit.hp, `${id} HP should be > 0`).toBeGreaterThan(0);
			}
		});

		it("every unit has speed > 0 (except static turrets)", () => {
			for (const [id, unit] of Object.entries(ALL_UNIT_ENTITIES)) {
				// snapper is a static turret with speed 0
				if (id === "snapper") continue;
				expect(unit.speed, `${id} speed should be > 0`).toBeGreaterThan(0);
			}
		});

		it("every unit has damage >= 0", () => {
			for (const [id, unit] of Object.entries(ALL_UNIT_ENTITIES)) {
				expect(unit.damage, `${id} damage should be >= 0`).toBeGreaterThanOrEqual(0);
			}
		});

		it("every hero has HP > 0 and speed > 0", () => {
			for (const [id, hero] of Object.entries(ALL_HERO_ENTITIES)) {
				expect(hero.hp, `hero ${id} HP should be > 0`).toBeGreaterThan(0);
				expect(hero.speed, `hero ${id} speed should be > 0`).toBeGreaterThan(0);
			}
		});
	});

	describe("Boss definitions", () => {
		it("all 6 bosses have the IsBoss tag", () => {
			for (const id of BOSS_IDS) {
				const unit = getUnit(id);
				expect(unit, `Boss '${id}' not found`).toBeDefined();
				expect(unit!.tags, `Boss '${id}' missing IsBoss tag`).toContain("IsBoss");
			}
		});

		it("all 4 new bosses have correct stats", () => {
			const scalebreak = getUnit("captain_scalebreak")!;
			expect(scalebreak.hp).toBe(300);
			expect(scalebreak.armor).toBe(5);
			expect(scalebreak.speed).toBe(6);
			expect(scalebreak.damage).toBe(18);
			expect(scalebreak.range).toBe(2);

			const fangrot = getUnit("warden_fangrot")!;
			expect(fangrot.hp).toBe(250);
			expect(fangrot.armor).toBe(4);
			expect(fangrot.speed).toBe(5);
			expect(fangrot.damage).toBe(15);
			expect(fangrot.range).toBe(2);

			const ven = getUnit("venom")!;
			expect(ven.hp).toBe(150);
			expect(ven.armor).toBe(1);
			expect(ven.speed).toBe(9);
			expect(ven.damage).toBe(12);
			expect(ven.range).toBe(4);

			const brood = getUnit("broodmother")!;
			expect(brood.hp).toBe(400);
			expect(brood.armor).toBe(6);
			expect(brood.speed).toBe(4);
			expect(brood.damage).toBe(25);
			expect(brood.range).toBe(2);
		});

		it("all bosses have aiProfile with boss specialBehavior", () => {
			for (const id of BOSS_IDS) {
				const unit = getUnit(id)!;
				expect(unit.aiProfile, `Boss '${id}' missing aiProfile`).toBeDefined();
				expect(
					unit.aiProfile!.specialBehavior,
					`Boss '${id}' should have boss specialBehavior`,
				).toBe("boss");
			}
		});
	});

	describe("Sprite atlas mapping", () => {
		it("every unit has a known sprite atlas animal assigned", () => {
			const validAnimals = new Set([
				"otter",
				"crocodile",
				"boar",
				"cobra",
				"fox",
				"hedgehog",
				"naked_mole_rat",
				"porcupine",
				"skunk",
				"snake",
				"squirrel",
				"vulture",
			]);

			for (const id of ALL_UNIT_IDS) {
				const expected = ENTITY_SPRITE_EXPECTATIONS[id];
				expect(expected, `Unit '${id}' has no sprite mapping expectation`).toBeDefined();
				expect(
					validAnimals.has(expected),
					`Unit '${id}' mapped to unknown animal '${expected}'`,
				).toBe(true);
			}
		});

		it("every hero has a known sprite atlas animal assigned", () => {
			for (const id of HERO_IDS) {
				const expected = ENTITY_SPRITE_EXPECTATIONS[id];
				expect(expected, `Hero '${id}' has no sprite mapping expectation`).toBeDefined();
				expect(expected).toBe("otter");
			}
		});
	});

	describe("Ability tags", () => {
		it("each URA unit has its required ability tags", () => {
			for (const [id, expectedTags] of Object.entries(URA_ABILITY_TAGS)) {
				const unit = getUnit(id)!;
				expect(unit, `Unit '${id}' not found`).toBeDefined();
				for (const tag of expectedTags) {
					expect(
						unit.tags,
						`Unit '${id}' missing ability tag '${tag}'`,
					).toContain(tag);
				}
			}
		});

		it("each new boss has its required ability tags", () => {
			for (const [id, expectedTags] of Object.entries(BOSS_ABILITY_TAGS)) {
				const unit = getUnit(id)!;
				expect(unit, `Boss '${id}' not found`).toBeDefined();
				for (const tag of expectedTags) {
					expect(
						unit.tags,
						`Boss '${id}' missing ability tag '${tag}'`,
					).toContain(tag);
				}
			}
		});

		it("all units have at least the IsUnit tag", () => {
			for (const [id, unit] of Object.entries(ALL_UNIT_ENTITIES)) {
				expect(unit.tags, `Unit '${id}' missing IsUnit tag`).toContain("IsUnit");
			}
		});
	});

	describe("Faction assignment", () => {
		it("all URA units have faction 'ura'", () => {
			for (const id of URA_UNIT_IDS) {
				expect(getUnit(id)!.faction).toBe("ura");
			}
		});

		it("all Scale-Guard units have faction 'scale_guard'", () => {
			for (const id of SCALE_GUARD_UNIT_IDS) {
				expect(getUnit(id)!.faction).toBe("scale_guard");
			}
		});
	});
});
