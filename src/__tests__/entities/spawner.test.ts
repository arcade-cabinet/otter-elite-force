import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld } from "koota";
import { spawnUnit, spawnBuilding, spawnResource } from "@/entities/spawner";
import type { UnitDef, HeroDef, BuildingDef, ResourceDef, SpriteDef } from "@/entities/types";
import { Position } from "@/ecs/traits/spatial";
import { Health, Attack, Armor, VisionRadius } from "@/ecs/traits/combat";
import { UnitType, Faction, IsHero, IsBuilding, IsResource } from "@/ecs/traits/identity";
import { Gatherer, PopulationCost, ResourceNode } from "@/ecs/traits/economy";
import { CanSwim } from "@/ecs/traits/water";
import { DetectionRadius } from "@/ecs/traits/stealth";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";

const STUB_SPRITE: SpriteDef = {
	size: 16,
	frames: { idle: [["."]] },
};

const MUDFOOT_DEF: UnitDef = {
	id: "mudfoot",
	name: "MUDFOOT",
	faction: "ura",
	category: "infantry",
	sprite: STUB_SPRITE,
	hp: 80,
	armor: 2,
	damage: 12,
	range: 1,
	attackCooldown: 1.2,
	speed: 8,
	visionRadius: 6,
	cost: { fish: 80, salvage: 20 },
	populationCost: 1,
	trainTime: 15,
	trainedAt: "barracks",
	unlockedAt: "start",
	tags: ["IsUnit"],
};

const HERO_DEF: HeroDef = {
	...MUDFOOT_DEF,
	id: "sgt_bubbles",
	name: "SGT. BUBBLES",
	portraitId: "portrait_bubbles",
	unlockMission: "mission_1",
	unlockDescription: "Starting hero",
	abilities: [{ id: "rally", name: "Rally", description: "Boosts morale", cooldown: 30 }],
};

const WORKER_DEF: UnitDef = {
	...MUDFOOT_DEF,
	id: "river_rat",
	name: "RIVER RAT",
	category: "worker",
	gatherCapacity: 10,
	gatherRate: 2,
	buildRate: 1,
};

const SWIMMER_DEF: UnitDef = {
	...MUDFOOT_DEF,
	id: "diver",
	name: "DIVER",
	canSwim: true,
	canSubmerge: true,
};

const ENEMY_DEF: UnitDef = {
	...MUDFOOT_DEF,
	id: "gator",
	name: "GATOR",
	faction: "scale_guard",
	detectionRadius: 8,
	aiProfile: {
		states: ["patrol", "chase", "attack"],
		defaultState: "patrol",
		aggroRange: 10,
		fleeThreshold: 0.2,
	},
};

const BUILDING_DEF: BuildingDef = {
	id: "barracks",
	name: "BARRACKS",
	faction: "ura",
	category: "production",
	sprite: { size: 32, frames: { idle: [["."]] } },
	hp: 350,
	armor: 1,
	buildTime: 30,
	cost: { timber: 200 },
	unlockedAt: "start",
	trains: ["mudfoot", "shellcracker"],
	tags: ["IsBuilding"],
};

const TOWER_DEF: BuildingDef = {
	...BUILDING_DEF,
	id: "watchtower",
	name: "WATCHTOWER",
	category: "defense",
	attackDamage: 6,
	attackRange: 8,
	attackCooldown: 2,
};

const RESOURCE_DEF: ResourceDef = {
	id: "fish_spot",
	name: "Fish Spot",
	resourceType: "fish",
	sprite: STUB_SPRITE,
	yield: { min: 80, max: 120 },
	harvestRate: 5,
	tags: ["IsResource"],
};

let world: ReturnType<typeof createWorld>;

beforeEach(() => {
	world = createWorld();
});
afterEach(() => {
	world.destroy();
});

describe("spawnUnit", () => {
	it("creates entity with position, identity, and combat stats", () => {
		const e = spawnUnit(world, MUDFOOT_DEF, 10, 20);

		expect(e.has(Position)).toBe(true);
		expect(e.get(Position)).toEqual({ x: 10, y: 20 });

		expect(e.get(UnitType).type).toBe("mudfoot");
		expect(e.get(Faction).id).toBe("ura");

		expect(e.get(Health)).toEqual({ current: 80, max: 80 });
		expect(e.get(Attack).damage).toBe(12);
		expect(e.get(Attack).range).toBe(1);
		expect(e.get(Armor).value).toBe(2);
		expect(e.get(VisionRadius).radius).toBe(6);
		expect(e.get(PopulationCost).cost).toBe(1);
	});

	it("allows faction override", () => {
		const e = spawnUnit(world, MUDFOOT_DEF, 0, 0, "neutral");
		expect(e.get(Faction).id).toBe("neutral");
	});

	it("does not add worker/swim/stealth/AI traits to basic infantry", () => {
		const e = spawnUnit(world, MUDFOOT_DEF, 0, 0);
		expect(e.has(Gatherer)).toBe(false);
		expect(e.has(CanSwim)).toBe(false);
		expect(e.has(DetectionRadius)).toBe(false);
		expect(e.has(AIState)).toBe(false);
		expect(e.has(IsHero)).toBe(false);
	});
});

describe("spawnUnit — worker", () => {
	it("adds Gatherer trait with capacity from definition", () => {
		const e = spawnUnit(world, WORKER_DEF, 5, 5);
		expect(e.has(Gatherer)).toBe(true);
		expect(e.get(Gatherer).capacity).toBe(10);
	});
});

describe("spawnUnit — swimmer", () => {
	it("adds CanSwim tag", () => {
		const e = spawnUnit(world, SWIMMER_DEF, 0, 0);
		expect(e.has(CanSwim)).toBe(true);
	});
});

describe("spawnUnit — enemy with AI", () => {
	it("adds AIState with default state from profile", () => {
		const e = spawnUnit(world, ENEMY_DEF, 0, 0);
		expect(e.has(AIState)).toBe(true);
		expect(e.get(AIState).state).toBe("patrol");
	});

	it("adds SteeringAgent", () => {
		const e = spawnUnit(world, ENEMY_DEF, 0, 0);
		expect(e.has(SteeringAgent)).toBe(true);
	});

	it("adds DetectionRadius", () => {
		const e = spawnUnit(world, ENEMY_DEF, 0, 0);
		expect(e.has(DetectionRadius)).toBe(true);
		expect(e.get(DetectionRadius).radius).toBe(8);
	});
});

describe("spawnUnit — hero", () => {
	it("adds IsHero tag", () => {
		const e = spawnUnit(world, HERO_DEF, 0, 0);
		expect(e.has(IsHero)).toBe(true);
	});
});

describe("spawnBuilding", () => {
	it("creates building with position, identity, and health", () => {
		const e = spawnBuilding(world, BUILDING_DEF, 15, 25);

		expect(e.get(Position)).toEqual({ x: 15, y: 25 });
		expect(e.get(UnitType).type).toBe("barracks");
		expect(e.get(Health)).toEqual({ current: 350, max: 350 });
		expect(e.get(Armor).value).toBe(1);
		expect(e.has(IsBuilding)).toBe(true);
	});

	it("does not add Attack trait to non-defensive buildings", () => {
		const e = spawnBuilding(world, BUILDING_DEF, 0, 0);
		expect(e.has(Attack)).toBe(false);
	});

	it("adds Attack trait to defensive buildings", () => {
		const e = spawnBuilding(world, TOWER_DEF, 0, 0);
		expect(e.has(Attack)).toBe(true);
		expect(e.get(Attack).damage).toBe(6);
		expect(e.get(Attack).range).toBe(8);
	});
});

describe("spawnResource", () => {
	it("creates resource node with IsResource tag", () => {
		const e = spawnResource(world, RESOURCE_DEF, 30, 40);

		expect(e.get(Position)).toEqual({ x: 30, y: 40 });
		expect(e.get(UnitType).type).toBe("fish_spot");
		expect(e.get(Faction).id).toBe("neutral");
		expect(e.has(IsResource)).toBe(true);
		expect(e.has(ResourceNode)).toBe(true);
		expect(e.get(ResourceNode).type).toBe("fish");
	});

	it("sets remaining between yield min and max", () => {
		const e = spawnResource(world, RESOURCE_DEF, 0, 0);
		const remaining = e.get(ResourceNode).remaining;
		expect(remaining).toBeGreaterThanOrEqual(80);
		expect(remaining).toBeLessThanOrEqual(120);
	});
});
