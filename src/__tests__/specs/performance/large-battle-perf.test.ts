/**
 * US-088: Large battle performance profiling
 *
 * Benchmarks 20 URA vs 20 Scale-Guard units in combat.
 * Profiles frame time breakdown for ECS systems.
 * Documents bottlenecks and optimizations.
 */
import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Targeting } from "@/ecs/relations";
import { initSingletons } from "@/ecs/singletons";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";
import { Armor, Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { Position, Velocity } from "@/ecs/traits/spatial";
import { CampaignProgress, PopulationState, ResourcePool } from "@/ecs/traits/state";
import {
	aggroSystem,
	combatSystem,
	deathSystem,
	projectileSystem,
} from "@/systems/combatSystem";
import { movementSystem } from "@/systems/movementSystem";

// ─── Constants ───

const URA_COUNT = 20;
const SG_COUNT = 20;
const TOTAL_UNITS = URA_COUNT + SG_COUNT;
const TICK_DELTA = 1 / 60; // 16.67ms tick (60fps target)
const BENCHMARK_TICKS = 300; // 5 seconds of gameplay

// ─── URA unit archetypes ───

const URA_ARCHETYPES = [
	{ type: "mudfoot", hp: 80, armor: 1, damage: 12, range: 1, cooldown: 1.0, speed: 60, vision: 5 },
	{ type: "shellcracker", hp: 70, armor: 0, damage: 15, range: 4, cooldown: 1.2, speed: 50, vision: 6 },
	{ type: "river_rat", hp: 50, armor: 0, damage: 5, range: 1, cooldown: 0.8, speed: 70, vision: 4 },
	{ type: "mortar_otter", hp: 60, armor: 0, damage: 20, range: 6, cooldown: 2.0, speed: 40, vision: 7 },
] as const;

// ─── Scale-Guard unit archetypes ───

const SG_ARCHETYPES = [
	{ type: "gator", hp: 120, armor: 3, damage: 15, range: 1, cooldown: 1.2, speed: 50, vision: 5 },
	{ type: "viper", hp: 60, armor: 0, damage: 12, range: 5, cooldown: 1.0, speed: 55, vision: 6 },
	{ type: "skink", hp: 40, armor: 0, damage: 4, range: 1, cooldown: 0.6, speed: 80, vision: 4 },
	{ type: "snapper", hp: 80, armor: 1, damage: 18, range: 3, cooldown: 1.5, speed: 45, vision: 5 },
] as const;

// ─── Helpers ───

interface TimingResult {
	system: string;
	totalMs: number;
	avgMs: number;
	maxMs: number;
}

function spawnBattleUnits(world: World) {
	const uraUnits: ReturnType<World["spawn"]>[] = [];
	const sgUnits: ReturnType<World["spawn"]>[] = [];

	// Spawn URA units on left side (x: 2-6) — close enough for combat
	for (let i = 0; i < URA_COUNT; i++) {
		const arch = URA_ARCHETYPES[i % URA_ARCHETYPES.length];
		const entity = world.spawn(
			UnitType({ type: arch.type }),
			Faction({ id: "ura" }),
			Position({ x: 2 + (i % 5) * 0.8, y: 2 + Math.floor(i / 5) * 0.8 }),
			Velocity({ x: 0, y: 0 }),
			Health({ current: arch.hp, max: arch.hp }),
			Armor({ value: arch.armor }),
			Attack({ damage: arch.damage, range: arch.range, cooldown: arch.cooldown, timer: 0 }),
			VisionRadius({ value: arch.vision }),
			AIState({ state: "idle", target: null, alertLevel: 0 }),
		);
		uraUnits.push(entity);
	}

	// Spawn Scale-Guard units on right side (x: 5-9) — overlapping with URA for melee
	for (let i = 0; i < SG_COUNT; i++) {
		const arch = SG_ARCHETYPES[i % SG_ARCHETYPES.length];
		const entity = world.spawn(
			UnitType({ type: arch.type }),
			Faction({ id: "scale_guard" }),
			Position({ x: 5 + (i % 5) * 0.8, y: 2 + Math.floor(i / 5) * 0.8 }),
			Velocity({ x: 0, y: 0 }),
			Health({ current: arch.hp, max: arch.hp }),
			Armor({ value: arch.armor }),
			Attack({ damage: arch.damage, range: arch.range, cooldown: arch.cooldown, timer: 0 }),
			VisionRadius({ value: arch.vision }),
			AIState({ state: "idle", target: null, alertLevel: 0 }),
		);
		sgUnits.push(entity);
	}

	// Set up initial targeting: each unit targets nearest enemy
	for (let i = 0; i < uraUnits.length; i++) {
		const target = sgUnits[i % sgUnits.length];
		if (target.isAlive()) {
			uraUnits[i].add(Targeting(target));
		}
	}
	for (let i = 0; i < sgUnits.length; i++) {
		const target = uraUnits[i % uraUnits.length];
		if (target.isAlive()) {
			sgUnits[i].add(Targeting(target));
		}
	}

	return { uraUnits, sgUnits };
}

function benchmarkSystem(
	name: string,
	fn: () => void,
	ticks: number,
): TimingResult {
	const times: number[] = [];

	for (let i = 0; i < ticks; i++) {
		const start = performance.now();
		fn();
		times.push(performance.now() - start);
	}

	const totalMs = times.reduce((a, b) => a + b, 0);
	return {
		system: name,
		totalMs,
		avgMs: totalMs / ticks,
		maxMs: Math.max(...times),
	};
}

// ─── Tests ───

describe("US-088: Large battle performance profiling", () => {
	let world: World;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		world.set(ResourcePool, { fish: 200, timber: 200, salvage: 200 });
		world.set(PopulationState, { current: TOTAL_UNITS, max: 100 });
		world.set(CampaignProgress, { missions: {}, currentMission: null, difficulty: "tactical" });
	});

	afterEach(() => {
		world.reset();
	});

	it(`benchmarks ${TOTAL_UNITS}-unit battle (${URA_COUNT} URA vs ${SG_COUNT} SG)`, () => {
		spawnBattleUnits(world);

		// Warm up
		for (let i = 0; i < 10; i++) {
			aggroSystem(world);
			combatSystem(world, TICK_DELTA);
			projectileSystem(world, TICK_DELTA);
			deathSystem(world);
			movementSystem(world, TICK_DELTA);
		}

		// Benchmark each system individually
		const aggroResult = benchmarkSystem("aggroSystem", () => aggroSystem(world), BENCHMARK_TICKS);
		const combatResult = benchmarkSystem("combatSystem", () => combatSystem(world, TICK_DELTA), BENCHMARK_TICKS);
		const projectileResult = benchmarkSystem("projectileSystem", () => projectileSystem(world, TICK_DELTA), BENCHMARK_TICKS);
		const deathResult = benchmarkSystem("deathSystem", () => deathSystem(world), BENCHMARK_TICKS);
		const movementResult = benchmarkSystem("movementSystem", () => movementSystem(world, TICK_DELTA), BENCHMARK_TICKS);

		const results = [aggroResult, combatResult, projectileResult, deathResult, movementResult];

		// Print results
		console.log(`\n=== LARGE BATTLE PERFORMANCE PROFILE (${TOTAL_UNITS} units, ${BENCHMARK_TICKS} ticks) ===`);
		console.log("  System            | Total ms  | Avg ms/tick | Max ms/tick");
		console.log("  ─────────────────────────────────────────────────────────");
		for (const r of results) {
			console.log(
				`  ${r.system.padEnd(18)} | ${r.totalMs.toFixed(2).padStart(8)}  | ${r.avgMs.toFixed(4).padStart(10)}  | ${r.maxMs.toFixed(4).padStart(10)}`,
			);
		}

		const totalCombinedMs = results.reduce((a, r) => a + r.totalMs, 0);
		const avgCombinedMs = totalCombinedMs / BENCHMARK_TICKS;
		console.log("  ─────────────────────────────────────────────────────────");
		console.log(
			`  COMBINED           | ${totalCombinedMs.toFixed(2).padStart(8)}  | ${avgCombinedMs.toFixed(4).padStart(10)}  |`,
		);
		console.log("");

		// Performance budget: all combat systems combined should complete in < 4ms per tick
		// at 60fps (16.67ms budget total, combat is ~25% of frame)
		const BUDGET_MS_PER_TICK = 4.0;
		console.log(`  Budget: < ${BUDGET_MS_PER_TICK}ms/tick combined`);
		console.log(`  Actual: ${avgCombinedMs.toFixed(4)}ms/tick combined`);
		console.log(
			`  Status: ${avgCombinedMs < BUDGET_MS_PER_TICK ? "WITHIN BUDGET" : "OVER BUDGET — needs optimization"}`,
		);
		console.log("");

		// Identify bottlenecks
		const bottlenecks = results.filter((r) => r.avgMs > 1.0);
		if (bottlenecks.length > 0) {
			console.log("  BOTTLENECKS (> 1ms avg):");
			for (const b of bottlenecks) {
				console.log(`    - ${b.system}: ${b.avgMs.toFixed(4)}ms avg`);
			}
		}

		// Hard assertion: combined avg must be under 4ms/tick
		expect(avgCombinedMs).toBeLessThan(BUDGET_MS_PER_TICK);
	});

	it("battle runs to completion without errors", () => {
		const { uraUnits, sgUnits } = spawnBattleUnits(world);

		// Run the battle for 600 ticks (10 seconds of gameplay)
		for (let i = 0; i < 600; i++) {
			aggroSystem(world);
			combatSystem(world, TICK_DELTA);
			projectileSystem(world, TICK_DELTA);
			deathSystem(world);
			movementSystem(world, TICK_DELTA);
		}

		// Count surviving units per faction
		const uraAlive = uraUnits.filter((u) => u.isAlive()).length;
		const sgAlive = sgUnits.filter((u) => u.isAlive()).length;

		console.log(`\n=== BATTLE OUTCOME (600 ticks) ===`);
		console.log(`  URA surviving: ${uraAlive}/${URA_COUNT}`);
		console.log(`  Scale-Guard surviving: ${sgAlive}/${SG_COUNT}`);
		console.log(`  Casualties: ${URA_COUNT - uraAlive + SG_COUNT - sgAlive}/${TOTAL_UNITS}`);
		console.log("");

		// At least some units should have died (combat is working)
		const totalSurvivors = uraAlive + sgAlive;
		expect(totalSurvivors).toBeLessThan(TOTAL_UNITS);
	});

	it("frame time breakdown shows no individual system exceeding 2ms", () => {
		spawnBattleUnits(world);

		// Run 100 ticks and measure each system
		const systemTimings: Record<string, number[]> = {
			aggro: [],
			combat: [],
			projectile: [],
			death: [],
			movement: [],
		};

		for (let i = 0; i < 100; i++) {
			let start = performance.now();
			aggroSystem(world);
			systemTimings.aggro.push(performance.now() - start);

			start = performance.now();
			combatSystem(world, TICK_DELTA);
			systemTimings.combat.push(performance.now() - start);

			start = performance.now();
			projectileSystem(world, TICK_DELTA);
			systemTimings.projectile.push(performance.now() - start);

			start = performance.now();
			deathSystem(world);
			systemTimings.death.push(performance.now() - start);

			start = performance.now();
			movementSystem(world, TICK_DELTA);
			systemTimings.movement.push(performance.now() - start);
		}

		console.log("\n=== FRAME TIME BREAKDOWN (100 ticks, per-system avg) ===");
		for (const [name, times] of Object.entries(systemTimings)) {
			const avg = times.reduce((a, b) => a + b, 0) / times.length;
			const max = Math.max(...times);
			const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
			console.log(
				`  ${name.padEnd(12)} avg: ${avg.toFixed(4)}ms  p95: ${p95.toFixed(4)}ms  max: ${max.toFixed(4)}ms`,
			);
		}
		console.log("");

		// No individual system should average more than 2ms per tick
		for (const [name, times] of Object.entries(systemTimings)) {
			const avg = times.reduce((a, b) => a + b, 0) / times.length;
			expect(avg).toBeLessThan(2.0);
		}
	});
});
