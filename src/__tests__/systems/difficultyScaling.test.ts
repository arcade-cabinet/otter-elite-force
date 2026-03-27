/**
 * Difficulty Scaling Tests — ported from old Koota codebase.
 *
 * Tests that enemy stats are scaled by difficulty multipliers.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Attack, Health, Speed } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { resetDifficultyScaling, runDifficultyScalingSystem } from "@/engine/systems/difficultyScalingSystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/difficultyScalingSystem", () => {
	beforeEach(() => {
		resetDifficultyScaling();
	});

	it("support difficulty reduces enemy HP to 75%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "support";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		runDifficultyScalingSystem(world);

		expect(Health.max[enemy]).toBe(75);
	});

	it("support difficulty reduces enemy damage to 75%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "support";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		Attack.damage[enemy] = 20;

		runDifficultyScalingSystem(world);

		expect(Attack.damage[enemy]).toBeCloseTo(15, 0);
	});

	it("support difficulty reduces enemy speed to 90%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "support";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		Speed.value[enemy] = 100;

		runDifficultyScalingSystem(world);

		expect(Speed.value[enemy]).toBeCloseTo(90, 0);
	});

	it("tactical difficulty does not modify stats (1.0x)", () => {
		const world = makeWorld();
		world.campaign.difficulty = "tactical";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});
		Attack.damage[enemy] = 10;
		Speed.value[enemy] = 50;

		runDifficultyScalingSystem(world);

		expect(Health.max[enemy]).toBe(100);
		expect(Attack.damage[enemy]).toBe(10);
		expect(Speed.value[enemy]).toBe(50);
	});

	it("elite difficulty increases enemy HP to 150%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "elite";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});

		runDifficultyScalingSystem(world);

		expect(Health.max[enemy]).toBe(15);
	});

	it("elite difficulty increases enemy damage to 125%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "elite";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		Attack.damage[enemy] = 4;

		runDifficultyScalingSystem(world);

		expect(Attack.damage[enemy]).toBe(5);
	});

	it("elite difficulty increases enemy speed to 110%", () => {
		const world = makeWorld();
		world.campaign.difficulty = "elite";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		Speed.value[enemy] = 50;

		runDifficultyScalingSystem(world);

		expect(Speed.value[enemy]).toBeCloseTo(55, 0);
	});

	it("does not modify player (ura) entity stats", () => {
		const world = makeWorld();
		world.campaign.difficulty = "elite";

		const player = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[player] = 10;

		runDifficultyScalingSystem(world);

		expect(Health.max[player]).toBe(100);
		expect(Attack.damage[player]).toBe(10);
	});

	it("does not re-apply scaling when difficulty hasn't changed", () => {
		const world = makeWorld();
		world.campaign.difficulty = "elite";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});

		runDifficultyScalingSystem(world);
		expect(Health.max[enemy]).toBe(15);

		// Second call should not re-apply
		runDifficultyScalingSystem(world);
		expect(Health.max[enemy]).toBe(15); // Not 22 (15 * 1.5)
	});

	it("clamps current health to max when scaling down", () => {
		const world = makeWorld();
		world.campaign.difficulty = "support";

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		runDifficultyScalingSystem(world);

		// Current should not exceed new max
		expect(Health.current[enemy]).toBeLessThanOrEqual(Health.max[enemy]);
	});
});
