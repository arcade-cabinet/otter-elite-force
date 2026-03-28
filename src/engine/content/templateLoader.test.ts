import { afterEach, describe, expect, it } from "vitest";
import {
	_injectTemplatesForTest,
	getAbilityDef,
	getBalance,
	getBuildingTemplate,
	getResearchTemplate,
	getUnitTemplate,
} from "./templateLoader";
import type {
	AbilityDef,
	BuildingTemplate,
	GameTemplates,
	ResearchDef,
	UnitTemplate,
} from "./templateTypes";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeUnit(overrides: Partial<UnitTemplate> = {}): UnitTemplate {
	return {
		id: "test_unit",
		base: "otter",
		name: "Test Unit",
		faction: "ura",
		category: "infantry",
		visual: {
			sprite: "otter",
			tint: null,
			emblem: "none",
			scale: 1.0,
			defaultAnim: "Otter Idle",
		},
		stats: {
			hp: 100,
			armor: 2,
			speed: 64,
			attackDamage: 12,
			attackRange: 32,
			attackCooldownMs: 1200,
			visionRadius: 5,
			popCost: 1,
		},
		abilities: [],
		flags: { canSwim: false, canStealth: false },
		training: {
			building: "barracks",
			cost: { fish: 80, timber: 0, salvage: 20 },
			timeMs: 20000,
		},
		unlocksAtMission: 1,
		description: "A test unit.",
		...overrides,
	};
}

function makeBuilding(overrides: Partial<BuildingTemplate> = {}): BuildingTemplate {
	return {
		id: "test_building",
		name: "Test Building",
		faction: "ura",
		category: "production",
		visual: { sprite: null, tint: null, scale: 1.0 },
		stats: {
			hp: 600,
			armor: 1,
			visionRadius: 5,
			attackDamage: 0,
			attackRange: 0,
			attackCooldownMs: 0,
			healRate: 0,
			healRadius: 0,
			populationCapacity: 0,
		},
		flags: { isHQ: false },
		construction: {
			cost: { fish: 150, timber: 200, salvage: 0 },
			timeMs: 25000,
		},
		produces: ["mudfoot"],
		passiveIncome: null,
		unlocksAtMission: 1,
		description: "A test building.",
		...overrides,
	};
}

function makeTestTemplates(overrides: Partial<GameTemplates> = {}): GameTemplates {
	return {
		units: new Map([
			["river_rat", makeUnit({ id: "river_rat", name: "River Rat", category: "worker" })],
			["mudfoot", makeUnit({ id: "mudfoot", name: "Mudfoot" })],
			[
				"diver",
				makeUnit({ id: "diver", name: "Diver", flags: { canSwim: true, canStealth: true } }),
			],
		]),
		buildings: new Map([
			["barracks", makeBuilding({ id: "barracks", name: "Barracks" })],
			["burrow", makeBuilding({ id: "burrow", name: "Lodge", flags: { isHQ: true } })],
		]),
		abilities: new Map<string, AbilityDef>([
			[
				"gather",
				{
					id: "gather",
					type: "active",
					description: "Harvest resources",
					params: { carryCapacity: 8 },
				},
			],
			[
				"stealth",
				{
					id: "stealth",
					type: "passive",
					description: "Go invisible",
					params: { breakOnAttack: true },
				},
			],
		]),
		research: new Map<string, ResearchDef>([
			[
				"improved_armor",
				{
					id: "improved_armor",
					name: "Improved Armor",
					description: "+2 armor",
					cost: { fish: 100, timber: 0, salvage: 200 },
					timeMs: 30000,
					researchedAt: "armory",
					effects: [{ target: "all_ura_units", stat: "armor", modifier: "+2" }],
					prerequisite: null,
					unlocksAtMission: 5,
				},
			],
		]),
		balance: {
			gathering: {
				fishPerTrip: 8,
				timberPerTrip: 6,
				salvagePerTrip: 4,
				tripDurationMs: 4000,
				returnSpeedMultiplier: 0.8,
				autoSearchRadius: 320,
			},
			startingResources: { mission1: { fish: 100, timber: 50, salvage: 0 } },
			population: { lodgeCap: 10, commandPostCap: 20, maxCap: 50 },
			combat: {
				retreatHealthPercent: 25,
				lodgeDestroyedDefeat: true,
				armorReduction: "flat",
				minimumDamage: 1,
			},
			economy: { fishTrapIncome: 3, fishTrapIntervalMs: 10000 },
			difficulty: {
				support: {
					enemyDamageMultiplier: 0.75,
					enemyHpMultiplier: 0.8,
					resourceMultiplier: 1.25,
					xpMultiplier: 0.75,
				},
				tactical: {
					enemyDamageMultiplier: 1.0,
					enemyHpMultiplier: 1.0,
					resourceMultiplier: 1.0,
					xpMultiplier: 1.0,
				},
				elite: {
					enemyDamageMultiplier: 1.3,
					enemyHpMultiplier: 1.25,
					resourceMultiplier: 0.8,
					xpMultiplier: 1.5,
				},
			},
		},
		missions: new Map(),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("templateLoader accessors", () => {
	afterEach(() => {
		_injectTemplatesForTest(null);
	});

	it("getUnitTemplate returns the correct unit", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const mudfoot = getUnitTemplate("mudfoot");
		expect(mudfoot.id).toBe("mudfoot");
		expect(mudfoot.name).toBe("Mudfoot");
		expect(mudfoot.stats.hp).toBe(100);
	});

	it("getUnitTemplate throws for unknown unit", () => {
		_injectTemplatesForTest(makeTestTemplates());
		expect(() => getUnitTemplate("nonexistent")).toThrow("unknown unit ID");
	});

	it("getBuildingTemplate returns the correct building", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const barracks = getBuildingTemplate("barracks");
		expect(barracks.id).toBe("barracks");
		expect(barracks.name).toBe("Barracks");
	});

	it("getBuildingTemplate throws for unknown building", () => {
		_injectTemplatesForTest(makeTestTemplates());
		expect(() => getBuildingTemplate("nonexistent")).toThrow("unknown building ID");
	});

	it("getAbilityDef returns the correct ability", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const gather = getAbilityDef("gather");
		expect(gather.id).toBe("gather");
		expect(gather.type).toBe("active");
	});

	it("getAbilityDef throws for unknown ability", () => {
		_injectTemplatesForTest(makeTestTemplates());
		expect(() => getAbilityDef("nonexistent")).toThrow("unknown ability ID");
	});

	it("getResearchTemplate returns the correct research", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const armor = getResearchTemplate("improved_armor");
		expect(armor.id).toBe("improved_armor");
		expect(armor.name).toBe("Improved Armor");
	});

	it("getResearchTemplate throws for unknown research", () => {
		_injectTemplatesForTest(makeTestTemplates());
		expect(() => getResearchTemplate("nonexistent")).toThrow("unknown research ID");
	});

	it("getBalance returns balance config", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const balance = getBalance();
		expect(balance.gathering.fishPerTrip).toBe(8);
		expect(balance.population.maxCap).toBe(50);
	});

	it("throws if templates not loaded", () => {
		// No injection — loaded is null
		expect(() => getUnitTemplate("mudfoot")).toThrow("Templates not loaded");
	});

	it("unit templates preserve all stat fields", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const unit = getUnitTemplate("mudfoot");
		expect(unit.stats.hp).toBeGreaterThan(0);
		expect(unit.stats.speed).toBeGreaterThanOrEqual(0);
		expect(unit.stats.visionRadius).toBeGreaterThanOrEqual(0);
		expect(typeof unit.stats.armor).toBe("number");
		expect(typeof unit.stats.attackDamage).toBe("number");
		expect(typeof unit.stats.attackRange).toBe("number");
		expect(typeof unit.stats.attackCooldownMs).toBe("number");
		expect(typeof unit.stats.popCost).toBe("number");
	});

	it("building templates preserve all stat fields", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const building = getBuildingTemplate("barracks");
		expect(building.stats.hp).toBeGreaterThan(0);
		expect(typeof building.stats.armor).toBe("number");
		expect(typeof building.stats.visionRadius).toBe("number");
		expect(typeof building.stats.attackDamage).toBe("number");
		expect(typeof building.stats.attackRange).toBe("number");
		expect(typeof building.stats.attackCooldownMs).toBe("number");
		expect(typeof building.stats.healRate).toBe("number");
		expect(typeof building.stats.healRadius).toBe("number");
		expect(typeof building.stats.populationCapacity).toBe("number");
	});

	it("balance difficulty levels are configured correctly", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const balance = getBalance();
		expect(balance.difficulty.support.enemyDamageMultiplier).toBeLessThan(1);
		expect(balance.difficulty.tactical.enemyDamageMultiplier).toBe(1);
		expect(balance.difficulty.elite.enemyDamageMultiplier).toBeGreaterThan(1);
	});

	it("unit visual config has sprite mapping", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const unit = getUnitTemplate("river_rat");
		expect(unit.visual.sprite).toBe("otter");
		expect(unit.visual.defaultAnim).toBe("Otter Idle");
	});

	it("unit flags are preserved", () => {
		_injectTemplatesForTest(makeTestTemplates());
		const diver = getUnitTemplate("diver");
		expect(diver.flags.canSwim).toBe(true);
		expect(diver.flags.canStealth).toBe(true);
	});
});
