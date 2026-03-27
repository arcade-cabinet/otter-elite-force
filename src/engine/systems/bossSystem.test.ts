import { describe, expect, it } from "vitest";
import { Attack, Speed } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runBossSystem } from "./bossSystem";

describe("engine/systems/bossSystem", () => {
	it("applies phase stat changes when boss HP drops below threshold", () => {
		const world = createGameWorld();
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 40, max: 100 },
		});
		Attack.damage[boss] = 5;
		Speed.value[boss] = 32;

		world.runtime.bossConfigs.set(boss, {
			name: "King Croc",
			armor: 5,
			damage: 5,
			range: 64,
			attackCooldown: 2,
			speed: 32,
			visionRadius: 128,
			phases: [
				{ hpThreshold: 50, damage: 8, speed: 48 },
				{ hpThreshold: 25, damage: 12, speed: 64 },
			],
		});

		runBossSystem(world);

		// HP is 40% — only the 50% threshold is triggered
		expect(Attack.damage[boss]).toBe(8);
		expect(Speed.value[boss]).toBe(48);
	});

	it("applies the most severe phase when HP is very low", () => {
		const world = createGameWorld();
		const boss = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 100 },
		});
		Attack.damage[boss] = 5;
		Speed.value[boss] = 32;

		world.runtime.bossConfigs.set(boss, {
			name: "King Croc",
			armor: 5,
			damage: 5,
			range: 64,
			attackCooldown: 2,
			speed: 32,
			visionRadius: 128,
			phases: [
				{ hpThreshold: 50, damage: 8, speed: 48 },
				{ hpThreshold: 25, damage: 12, speed: 64 },
			],
		});

		runBossSystem(world);

		// HP is 10% — both thresholds triggered, last one wins
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
		world.runtime.bossConfigs.set(boss, {
			name: "Boss",
			armor: 0,
			damage: 5,
			range: 64,
			attackCooldown: 2,
			speed: 32,
			visionRadius: 128,
			phases: [],
		});

		world.runtime.alive.delete(boss);

		// Should not throw
		runBossSystem(world);
	});
});
