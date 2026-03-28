import { describe, expect, it } from "vitest";
import { FACTION_IDS } from "@/engine/content/ids";
import { Armor, Attack, Faction, Health, Position, Speed } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import type { BossConfig } from "./bossSystem";
import { runBossSystem } from "./bossSystem";

function makeBossConfig(overrides?: Partial<BossConfig>): BossConfig {
	return {
		name: "King Croc",
		armor: 5,
		damage: 5,
		range: 64,
		attackCooldown: 2,
		speed: 32,
		visionRadius: 128,
		phases: [
			{ hpThreshold: 50, name: "Wounded", damage: 8, speed: 48 },
			{ hpThreshold: 25, name: "Enraged", damage: 12, speed: 64, armor: 10 },
		],
		aoeDamage: 15,
		aoeRadius: 96,
		aoeCooldown: 8,
		...overrides,
	};
}

describe("engine/systems/bossSystem", () => {
	it("applies phase stat changes when boss HP drops below threshold", () => {
		const world = createGameWorld();
		world.time.deltaMs = 0;
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 40, max: 100 },
		});
		Attack.damage[boss] = 5;
		Speed.value[boss] = 32;

		world.runtime.bossConfigs.set(boss, makeBossConfig());

		runBossSystem(world);

		// HP is 40% -- only the 50% threshold is triggered
		expect(Attack.damage[boss]).toBe(8);
		expect(Speed.value[boss]).toBe(48);
	});

	it("applies the most severe phase when HP is very low", () => {
		const world = createGameWorld();
		world.time.deltaMs = 0;
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 100 },
		});
		Attack.damage[boss] = 5;
		Speed.value[boss] = 32;

		world.runtime.bossConfigs.set(boss, makeBossConfig());

		runBossSystem(world);

		// HP is 10% -- both thresholds triggered, last one wins
		expect(Attack.damage[boss]).toBe(12);
		expect(Speed.value[boss]).toBe(64);
	});

	it("skips dead bosses", () => {
		const world = createGameWorld();
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 100 },
		});
		world.runtime.bossConfigs.set(boss, makeBossConfig());

		world.runtime.alive.delete(boss);

		// Should not throw
		runBossSystem(world);
	});

	it("emits boss-phase-change event on phase transition", () => {
		const world = createGameWorld();
		world.time.deltaMs = 0;
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 40, max: 100 },
		});

		world.runtime.bossConfigs.set(boss, makeBossConfig());

		runBossSystem(world);

		const phaseEvent = world.events.find((e) => e.type === "boss-phase-change");
		expect(phaseEvent).toBeDefined();
		expect(phaseEvent?.payload?.phaseName).toBe("Wounded");
		expect(phaseEvent?.payload?.enraged).toBe(false);
	});

	it("sets enraged flag on final phase", () => {
		const world = createGameWorld();
		world.time.deltaMs = 0;
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 100 },
		});

		world.runtime.bossConfigs.set(boss, makeBossConfig());

		runBossSystem(world);

		const config = world.runtime.bossConfigs.get(boss) as BossConfig;
		expect(config.enraged).toBe(true);

		const phaseEvents = world.events.filter((e) => e.type === "boss-phase-change");
		// Should emit for the final phase
		const finalPhase = phaseEvents.find((e) => e.payload?.enraged === true);
		expect(finalPhase).toBeDefined();
	});

	it("applies phase-specific armor override", () => {
		const world = createGameWorld();
		world.time.deltaMs = 0;
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 100 },
		});
		Armor.value[boss] = 5;

		world.runtime.bossConfigs.set(boss, makeBossConfig());

		runBossSystem(world);

		// Phase 2 has armor: 10
		expect(Armor.value[boss]).toBe(10);
	});

	it("fires AoE attack when cooldown expires and damages nearby enemies", () => {
		const world = createGameWorld();
		world.time.deltaMs = 9000; // 9 seconds (above 8s cooldown)
		const boss = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		world.runtime.bossConfigs.set(
			boss,
			makeBossConfig({
				phases: [],
				aoeDamage: 20,
				aoeRadius: 100,
				aoeCooldown: 8,
			}),
		);

		// Spawn a player unit within AoE radius
		const playerUnit = spawnUnit(world, {
			x: 220,
			y: 200,
			faction: "ura",
			health: { current: 80, max: 80 },
		});
		Armor.value[playerUnit] = 2;

		runBossSystem(world);

		// Player unit should take damage: max(1, 20 - 2) = 18
		expect(Health.current[playerUnit]).toBe(80 - 18);

		const aoeEvent = world.events.find((e) => e.type === "boss-aoe");
		expect(aoeEvent).toBeDefined();
		expect(aoeEvent?.payload?.hitCount).toBe(1);
	});

	it("does not damage friendly units with AoE", () => {
		const world = createGameWorld();
		world.time.deltaMs = 9000;
		const boss = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		world.runtime.bossConfigs.set(
			boss,
			makeBossConfig({
				phases: [],
				aoeDamage: 20,
				aoeRadius: 100,
				aoeCooldown: 8,
			}),
		);

		// Spawn a friendly unit within AoE radius
		const friendly = spawnUnit(world, {
			x: 220,
			y: 200,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runBossSystem(world);

		// Friendly should NOT be damaged
		expect(Health.current[friendly]).toBe(50);
	});

	it("enraged boss fires AoE at double frequency", () => {
		const world = createGameWorld();
		const boss = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 10, max: 100 },
		});

		const config = makeBossConfig({
			aoeCooldown: 8,
			aoeDamage: 10,
			aoeRadius: 100,
		});
		world.runtime.bossConfigs.set(boss, config);

		// First tick: trigger phase transition to enraged
		world.time.deltaMs = 0;
		runBossSystem(world);

		const bossConfig = world.runtime.bossConfigs.get(boss) as BossConfig;
		expect(bossConfig.enraged).toBe(true);

		// Second tick: 5 seconds (above enraged cooldown of 4, but below normal 8)
		world.time.deltaMs = 5000;
		world.events.length = 0;

		const playerUnit = spawnUnit(world, {
			x: 210,
			y: 200,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runBossSystem(world);

		// Should have fired AoE (enraged cooldown = 8/2 = 4)
		const aoeEvent = world.events.find((e) => e.type === "boss-aoe");
		expect(aoeEvent).toBeDefined();
	});

	it("summons minions when summon cooldown expires", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16000; // above 15s default summon cooldown
		const boss = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		world.runtime.bossConfigs.set(
			boss,
			makeBossConfig({
				phases: [],
				summonType: "skink",
				summonCount: 3,
				summonCooldown: 15,
				aoeCooldown: 999, // disable AoE for this test
			}),
		);

		const aliveBefore = world.runtime.alive.size;
		runBossSystem(world);

		// Should have spawned 3 minions
		expect(world.runtime.alive.size).toBe(aliveBefore + 3);

		const summonEvent = world.events.find((e) => e.type === "boss-summon");
		expect(summonEvent).toBeDefined();
		expect(summonEvent?.payload?.summonType).toBe("skink");
		expect(summonEvent?.payload?.count).toBe(3);
	});

	it("does not summon when summonType is undefined", () => {
		const world = createGameWorld();
		world.time.deltaMs = 20000;
		const boss = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		world.runtime.bossConfigs.set(
			boss,
			makeBossConfig({
				phases: [],
				aoeCooldown: 999,
			}),
		);

		const aliveBefore = world.runtime.alive.size;
		runBossSystem(world);

		// No summons -- only boss exists
		expect(world.runtime.alive.size).toBe(aliveBefore);
		expect(world.events.find((e) => e.type === "boss-summon")).toBeUndefined();
	});
});
