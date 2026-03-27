/**
 * Integration Tests — End-to-end gameplay loops.
 * Ported from old Koota codebase.
 *
 * Tests that multiple engine systems work together correctly:
 * - Gather loop: worker gathers resources
 * - Build loop: worker constructs buildings
 * - Train loop: building produces units
 * - Combat loop: units fight enemies
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_IDS } from "@/engine/content/ids";
import { Attack, Content, Health, Speed, VisionRadius } from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	getOrderQueue,
	getProductionQueue,
	isAlive,
	spawnBuilding,
	spawnResource,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runCombatSystem } from "@/engine/systems/combatSystem";
import { resetGatherTimers, runEconomySystem } from "@/engine/systems/economySystem";
import { runMovementSystem } from "@/engine/systems/movementSystem";
import { runOrderSystem } from "@/engine/systems/orderSystem";
import { runProductionSystem } from "@/engine/systems/productionSystem";
import { runBuildingSystem } from "@/engine/systems/buildingSystem";
import { runAiSystem } from "@/engine/systems/aiSystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

beforeEach(() => {
	resetGatherTimers();
});

describe("Gameplay loops integration", () => {
	describe("Gather loop", () => {
		it("worker gathers fish when near a fish node with gather order", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;

			const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;

			const node = spawnResource(world, {
				x: 10,
				y: 10,
				resourceType: "fish_node",
			});

			const orders = getOrderQueue(world, worker);
			orders.push({ type: "gather", targetEid: node });

			runEconomySystem(world);

			expect(world.session.resources.fish).toBe(1);
		});

		it("worker accumulates resources over multiple ticks", () => {
			const world = createGameWorld();
			world.time.deltaMs = 1000;

			const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;

			const node = spawnResource(world, {
				x: 10,
				y: 10,
				resourceType: "fish_node",
			});

			const orders = getOrderQueue(world, worker);
			orders.push({ type: "gather", targetEid: node });

			// Tick 1: accumulates 1s (not enough)
			runEconomySystem(world);
			expect(world.session.resources.fish).toBe(0);

			// Tick 2: accumulates 2s (gathers 1)
			runEconomySystem(world);
			expect(world.session.resources.fish).toBe(1);

			// Tick 3: accumulates 3s (not yet another 2s)
			runEconomySystem(world);
			expect(world.session.resources.fish).toBe(1);

			// Tick 4: accumulates 4s (gathers another 1)
			runEconomySystem(world);
			expect(world.session.resources.fish).toBe(2);
		});
	});

	describe("Build loop", () => {
		it("worker near building with build order advances construction", () => {
			const world = createGameWorld();
			world.time.deltaMs = 15000; // 15 seconds

			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
				construction: { progress: 0, buildTime: 30 },
			});

			const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;
			const orders = getOrderQueue(world, worker);
			orders.push({ type: "build", targetEid: building });

			runBuildingSystem(world);

			// After 15s with 30s build time: 50%
			expect(world.events.some((e) => e.type === "building-complete")).toBe(false);
		});

		it("building completes when workers spend enough time", () => {
			const world = createGameWorld();
			world.time.deltaMs = 30000; // 30 seconds

			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
				construction: { progress: 0, buildTime: 30 },
			});

			const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;
			const orders = getOrderQueue(world, worker);
			orders.push({ type: "build", targetEid: building });

			runBuildingSystem(world);

			expect(world.events.some((e) => e.type === "building-complete")).toBe(true);
		});
	});

	describe("Train loop", () => {
		it("building produces a unit after build time elapses", () => {
			const world = createGameWorld();
			world.time.deltaMs = 5000;

			const barracks = spawnBuilding(world, {
				x: 50,
				y: 50,
				faction: "ura",
			});

			const queue = getProductionQueue(world, barracks);
			queue.push({
				type: "unit",
				contentId: "mudfoot",
				progress: 0,
				buildTimeMs: 5000,
			} as never);

			const aliveBefore = world.runtime.alive.size;
			runProductionSystem(world);

			expect(queue).toHaveLength(0);
			expect(world.runtime.alive.size).toBe(aliveBefore + 1);
		});
	});

	describe("Combat loop", () => {
		it("melee attacker deals damage to nearby enemy", () => {
			const world = createGameWorld();
			world.time.deltaMs = 1000;

			const attacker = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[attacker] = 10;
			Attack.range[attacker] = 48;
			Attack.cooldown[attacker] = 1;
			Attack.timer[attacker] = 1;
			VisionRadius.value[attacker] = 48;

			const enemy = spawnUnit(world, {
				x: 30,
				y: 0,
				faction: "scale_guard",
				health: { current: 50, max: 50 },
			});

			runCombatSystem(world);

			expect(Health.current[enemy]).toBe(40);
		});

		it("full combat cycle: aggro + attack + death", () => {
			const world = createGameWorld();
			world.time.deltaMs = 1000;

			const attacker = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[attacker] = 100;
			Attack.range[attacker] = 48;
			Attack.cooldown[attacker] = 1;
			Attack.timer[attacker] = 1;
			VisionRadius.value[attacker] = 48;

			const enemy = spawnUnit(world, {
				x: 30,
				y: 0,
				faction: "scale_guard",
				health: { current: 20, max: 20 },
			});

			runCombatSystem(world);

			expect(Health.current[enemy]).toBeLessThanOrEqual(0);
			expect(world.runtime.removals.has(enemy)).toBe(true);

			flushRemovals(world);
			expect(isAlive(world, enemy)).toBe(false);
		});

		it("AI automatically chases player units", () => {
			const world = createGameWorld();
			world.time.deltaMs = 16;

			const enemy = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "scale_guard",
				health: { current: 50, max: 50 },
			});
			Attack.damage[enemy] = 10;
			Attack.range[enemy] = 30;
			VisionRadius.value[enemy] = 200;

			spawnUnit(world, {
				x: 200,
				y: 100,
				faction: "ura",
				health: { current: 100, max: 100 },
			});

			runAiSystem(world);

			const aiState = world.runtime.aiStates.get(enemy);
			expect(aiState?.state).toBe("chase");
		});
	});

	describe("Multi-system coordination", () => {
		it("order system clears orders when target dies", () => {
			const world = createGameWorld();
			world.time.deltaMs = 1000;

			const attacker = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[attacker] = 100;
			Attack.range[attacker] = 48;
			Attack.cooldown[attacker] = 1;
			Attack.timer[attacker] = 1;
			VisionRadius.value[attacker] = 48;

			const enemy = spawnUnit(world, {
				x: 30,
				y: 0,
				faction: "scale_guard",
				health: { current: 10, max: 10 },
			});

			const orders = getOrderQueue(world, attacker);
			orders.push({ type: "attack", targetEid: enemy });

			// Kill the enemy
			runCombatSystem(world);
			flushRemovals(world);

			// Order system should clear stale orders
			runOrderSystem(world);
			expect(orders).toHaveLength(0);
		});

		it("movement system moves unit toward target then combat system deals damage", () => {
			const world = createGameWorld();

			const attacker = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Speed.value[attacker] = 100;
			Attack.damage[attacker] = 10;
			Attack.range[attacker] = 48;
			Attack.cooldown[attacker] = 1;
			Attack.timer[attacker] = 0;
			VisionRadius.value[attacker] = 200;

			const enemy = spawnUnit(world, {
				x: 200,
				y: 0,
				faction: "scale_guard",
				health: { current: 50, max: 50 },
			});

			// Move toward enemy
			const orders = getOrderQueue(world, attacker);
			orders.push({ type: "move", targetX: 200, targetY: 0 });

			// Run movement for 2 seconds (move 200px)
			world.time.deltaMs = 2000;
			runMovementSystem(world);

			// Now clear the move order and let combat happen
			orders.length = 0;
			Attack.timer[attacker] = 1; // ready to fire

			world.time.deltaMs = 1000;
			runCombatSystem(world);

			expect(Health.current[enemy]).toBe(40);
		});
	});
});
