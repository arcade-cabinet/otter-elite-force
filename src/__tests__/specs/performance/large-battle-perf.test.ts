/**
 * Large Battle Performance Tests — ported from old Koota codebase.
 *
 * Tests that the engine can handle large numbers of entities
 * within acceptable time bounds.
 */

import { describe, expect, it, vi } from "vitest";
import { Attack, Health, Speed, VisionRadius } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runCombatSystem } from "@/engine/systems/combatSystem";
import { runMovementSystem } from "@/engine/systems/movementSystem";
import { runAiSystem } from "@/engine/systems/aiSystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

describe("Large battle performance", () => {
	it("can spawn 200 entities without error", () => {
		const world = createGameWorld();

		for (let i = 0; i < 100; i++) {
			spawnUnit(world, {
				x: i * 10,
				y: 0,
				faction: "ura",
				health: { current: 80, max: 80 },
			});
		}

		for (let i = 0; i < 100; i++) {
			spawnUnit(world, {
				x: i * 10,
				y: 200,
				faction: "scale_guard",
				health: { current: 90, max: 90 },
			});
		}

		expect(world.runtime.alive.size).toBe(200);
	});

	it("combat system ticks 200 entities in under 50ms", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		// Spawn 100 ura units
		for (let i = 0; i < 100; i++) {
			const eid = spawnUnit(world, {
				x: i * 5,
				y: 0,
				faction: "ura",
				health: { current: 80, max: 80 },
			});
			Attack.damage[eid] = 10;
			Attack.range[eid] = 48;
			Attack.cooldown[eid] = 1;
			Attack.timer[eid] = 1;
			VisionRadius.value[eid] = 200;
		}

		// Spawn 100 enemy units nearby
		for (let i = 0; i < 100; i++) {
			const eid = spawnUnit(world, {
				x: i * 5,
				y: 30,
				faction: "scale_guard",
				health: { current: 90, max: 90 },
			});
			Attack.damage[eid] = 8;
			Attack.range[eid] = 48;
			Attack.cooldown[eid] = 1;
			Attack.timer[eid] = 1;
			VisionRadius.value[eid] = 200;
		}

		const start = performance.now();
		runCombatSystem(world);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(50);
	});

	it("movement system ticks 200 entities in under 20ms", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		for (let i = 0; i < 200; i++) {
			const eid = spawnUnit(world, {
				x: i * 10,
				y: 0,
				faction: i < 100 ? "ura" : "scale_guard",
			});
			Speed.value[eid] = 64;
			world.runtime.orderQueues.set(eid, [
				{ type: "move", targetX: 1000, targetY: 1000 },
			]);
		}

		const start = performance.now();
		runMovementSystem(world);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(20);
	});

	it("AI system ticks 100 enemy entities in under 50ms", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16;

		// Spawn player units
		for (let i = 0; i < 10; i++) {
			spawnUnit(world, {
				x: 500 + i * 20,
				y: 500,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
		}

		// Spawn enemy units with AI
		for (let i = 0; i < 100; i++) {
			const eid = spawnUnit(world, {
				x: i * 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 90, max: 90 },
			});
			Attack.damage[eid] = 10;
			Attack.range[eid] = 32;
			VisionRadius.value[eid] = 200;
		}

		const start = performance.now();
		runAiSystem(world);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(50);
	});

	it("can run 10 combat ticks on 200 entities without crash", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		for (let i = 0; i < 100; i++) {
			const eid = spawnUnit(world, {
				x: i * 5,
				y: 0,
				faction: "ura",
				health: { current: 80, max: 80 },
			});
			Attack.damage[eid] = 10;
			Attack.range[eid] = 48;
			Attack.cooldown[eid] = 1;
			Attack.timer[eid] = 0;
			VisionRadius.value[eid] = 200;
		}

		for (let i = 0; i < 100; i++) {
			const eid = spawnUnit(world, {
				x: i * 5,
				y: 30,
				faction: "scale_guard",
				health: { current: 90, max: 90 },
			});
			Attack.damage[eid] = 8;
			Attack.range[eid] = 48;
			Attack.cooldown[eid] = 1;
			Attack.timer[eid] = 0;
			VisionRadius.value[eid] = 200;
		}

		for (let tick = 0; tick < 10; tick++) {
			runCombatSystem(world);
		}

		// At least some damage should have been dealt
		let totalDamage = 0;
		for (const eid of world.runtime.alive) {
			if (Health.current[eid] < Health.max[eid]) {
				totalDamage += Health.max[eid] - Health.current[eid];
			}
		}
		expect(totalDamage).toBeGreaterThan(0);
	});

	it("entity spawn and remove cycle does not leak", () => {
		const world = createGameWorld();

		// Spawn and remove entities in a cycle
		for (let cycle = 0; cycle < 5; cycle++) {
			const eids: number[] = [];
			for (let i = 0; i < 50; i++) {
				eids.push(spawnUnit(world, { x: i, y: 0, faction: "ura" }));
			}
			expect(world.runtime.alive.size).toBe(50);

			for (const eid of eids) {
				world.runtime.removals.add(eid);
			}

			// Flush
			for (const eid of world.runtime.removals) {
				world.runtime.alive.delete(eid);
			}
			world.runtime.removals.clear();

			expect(world.runtime.alive.size).toBe(0);
		}
	});
});
