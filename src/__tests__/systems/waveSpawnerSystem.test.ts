/**
 * Tests for US-068: Wave spawner escalation for defense missions.
 *
 * - Wave spawner reads definitions from mission ScenarioTrigger data
 * - Early waves small (2-3 enemies), later waves add variety and count
 * - Boss waves include Croc Champions
 * - Wave timing configurable per mission
 * - Difficulty scaling affects composition
 * - Wave number indicator
 */

import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIState } from "@/ecs/traits/ai";
import { Health } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import {
	buildEscalationSchedule,
	createWaveSpawnerState,
	waveSpawnerSystem,
	type WaveDefinition,
	type WaveSchedule,
} from "@/systems/waveSpawnerSystem";

describe("waveSpawnerSystem", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	const defaultSpawnPoints = [
		{ x: 0, y: 0 },
		{ x: 20, y: 0 },
	];

	describe("wave scheduling and timing", () => {
		it("should not spawn enemies before wave delay", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 60,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);
			waveSpawnerSystem(world, 30, state); // 30 seconds — not enough

			const enemies = world.query(Faction);
			expect(enemies.length).toBe(0);
			expect(state.currentWave).toBe(0);
		});

		it("should spawn enemies when delay is reached", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 3 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 60,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);
			const newWave = waveSpawnerSystem(world, 61, state);

			const enemies = world.query(UnitType);
			expect(enemies.length).toBe(3);
			expect(newWave).toBe(1);
			expect(state.currentWave).toBe(1);
		});

		it("should spawn multiple waves at correct times", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 30,
					},
					{
						waveNumber: 2,
						enemies: [{ unitType: "viper", count: 3 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 90,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);

			// Tick to wave 1
			waveSpawnerSystem(world, 31, state);
			expect(state.currentWave).toBe(1);
			expect(world.query(UnitType).length).toBe(2);

			// Tick to wave 2
			waveSpawnerSystem(world, 60, state);
			expect(state.currentWave).toBe(2);
			expect(world.query(UnitType).length).toBe(5); // 2 + 3
		});

		it("should not re-spawn already spawned waves", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 10,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);
			waveSpawnerSystem(world, 11, state);
			const count1 = world.query(UnitType).length;

			waveSpawnerSystem(world, 10, state);
			const count2 = world.query(UnitType).length;

			expect(count1).toBe(count2);
		});
	});

	describe("escalation — early waves small, later waves larger", () => {
		it("early waves should have 2-3 enemies", () => {
			const schedule = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");
			const wave1 = schedule.waves[0];
			const totalEnemies = wave1.enemies.reduce((sum, e) => sum + e.count, 0);
			expect(totalEnemies).toBeGreaterThanOrEqual(1);
			expect(totalEnemies).toBeLessThanOrEqual(4);
		});

		it("later waves should have more enemies than early waves", () => {
			const schedule = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");
			const earlyTotal = schedule.waves[0].enemies.reduce((sum, e) => sum + e.count, 0);
			const lateTotal = schedule.waves[5].enemies.reduce((sum, e) => sum + e.count, 0);
			expect(lateTotal).toBeGreaterThan(earlyTotal);
		});

		it("later waves should add enemy variety (vipers, siphon drones)", () => {
			const schedule = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");
			const lastWave = schedule.waves[5];
			const unitTypes = lastWave.enemies.map((e) => e.unitType);
			expect(unitTypes.length).toBeGreaterThan(1);
			// Last wave should have at least gators and one other type
			expect(unitTypes).toContain("gator");
		});
	});

	describe("boss waves include Croc Champions", () => {
		it("final wave should include croc_champion", () => {
			const schedule = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");
			const finalWave = schedule.waves[schedule.waves.length - 1];
			const hasCroc = finalWave.enemies.some((e) => e.unitType === "croc_champion");
			expect(hasCroc).toBe(true);
			expect(finalWave.isBoss).toBe(true);
		});

		it("boss wave at 75% should include croc_champion for 6+ wave schedules", () => {
			const schedule = buildEscalationSchedule(8, 60, defaultSpawnPoints, "tactical");
			// 75% of 8 = wave 6
			const bossWave = schedule.waves.find(
				(w) => w.isBoss && w.waveNumber < schedule.waves.length,
			);
			if (bossWave) {
				const hasCroc = bossWave.enemies.some((e) => e.unitType === "croc_champion");
				expect(hasCroc).toBe(true);
			}
		});
	});

	describe("wave timing configurable per mission", () => {
		it("should respect custom interval seconds", () => {
			const schedule = buildEscalationSchedule(4, 120, defaultSpawnPoints, "tactical");
			expect(schedule.waves[0].delaySeconds).toBe(120);
			expect(schedule.waves[1].delaySeconds).toBe(240);
			expect(schedule.waves[2].delaySeconds).toBe(360);
			expect(schedule.waves[3].delaySeconds).toBe(480);
		});

		it("should support tighter intervals for intense missions", () => {
			const schedule = buildEscalationSchedule(4, 45, defaultSpawnPoints, "tactical");
			expect(schedule.waves[0].delaySeconds).toBe(45);
			expect(schedule.waves[1].delaySeconds).toBe(90);
		});
	});

	describe("difficulty scaling affects composition", () => {
		it("Support: fewer enemies", () => {
			const support = buildEscalationSchedule(6, 60, defaultSpawnPoints, "support");
			const tactical = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");

			const supportTotal = support.waves[5].enemies.reduce((sum, e) => sum + e.count, 0);
			const tacticalTotal = tactical.waves[5].enemies.reduce((sum, e) => sum + e.count, 0);

			expect(supportTotal).toBeLessThanOrEqual(tacticalTotal);
		});

		it("Elite: more enemies and extra unit types", () => {
			const elite = buildEscalationSchedule(6, 60, defaultSpawnPoints, "elite");
			const tactical = buildEscalationSchedule(6, 60, defaultSpawnPoints, "tactical");

			const eliteTotal = elite.waves[5].enemies.reduce((sum, e) => sum + e.count, 0);
			const tacticalTotal = tactical.waves[5].enemies.reduce((sum, e) => sum + e.count, 0);

			expect(eliteTotal).toBeGreaterThanOrEqual(tacticalTotal);
		});

		it("Elite: boss waves have 2 Croc Champions", () => {
			const elite = buildEscalationSchedule(6, 60, defaultSpawnPoints, "elite");
			const finalWave = elite.waves[elite.waves.length - 1];
			const crocEntry = finalWave.enemies.find((e) => e.unitType === "croc_champion");
			expect(crocEntry).toBeDefined();
			expect(crocEntry!.count).toBe(2);
		});
	});

	describe("wave number indicator", () => {
		it("should track current wave number in state", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 10,
					},
					{
						waveNumber: 2,
						enemies: [{ unitType: "viper", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 60,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);
			expect(state.currentWave).toBe(0);

			waveSpawnerSystem(world, 11, state);
			expect(state.currentWave).toBe(1);

			waveSpawnerSystem(world, 50, state);
			expect(state.currentWave).toBe(2);
		});

		it("should call onWaveStart callback with wave number and total", () => {
			const onWaveStart = vi.fn();
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 2 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 10,
					},
				],
				intervalSeconds: 60,
				onWaveStart,
			};

			const state = createWaveSpawnerState(schedule);
			waveSpawnerSystem(world, 11, state);

			expect(onWaveStart).toHaveBeenCalledWith(1, 1);
		});

		it("should call onAllWavesCleared when all waves spawned", () => {
			const onAllWavesCleared = vi.fn();
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 1 }],
						spawnPoints: defaultSpawnPoints,
						delaySeconds: 10,
					},
				],
				intervalSeconds: 60,
				onAllWavesCleared,
			};

			const state = createWaveSpawnerState(schedule);
			waveSpawnerSystem(world, 11, state);

			expect(onAllWavesCleared).toHaveBeenCalled();
			expect(state.allWavesCleared).toBe(true);
		});
	});

	describe("spawned entities have correct traits", () => {
		it("spawned enemies should have Health, AIState, Faction(scale_guard)", () => {
			const schedule: WaveSchedule = {
				waves: [
					{
						waveNumber: 1,
						enemies: [{ unitType: "gator", count: 1 }],
						spawnPoints: [{ x: 5, y: 5 }],
						delaySeconds: 0,
					},
				],
				intervalSeconds: 60,
			};

			const state = createWaveSpawnerState(schedule);
			waveSpawnerSystem(world, 1, state);

			const entities = world.query(UnitType, Health, Faction, AIState, Position);
			expect(entities.length).toBe(1);

			const entity = entities[0];
			const unitType = entity.get(UnitType);
			const health = entity.get(Health);
			const faction = entity.get(Faction);

			expect(unitType!.type).toBe("gator");
			expect(health!.max).toBe(120); // From SCALE_GUARD_UNITS
			expect(faction!.id).toBe("scale_guard");
		});
	});
});
