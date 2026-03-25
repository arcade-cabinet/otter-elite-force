/**
 * Wave Spawner System — Escalation for defense missions (US-068).
 *
 * Reads wave definitions from mission data and spawns enemies according to
 * an escalation curve. Early waves are small (2-3 enemies), later waves
 * add variety and count. Boss waves include Croc Champions.
 *
 * Wave timing is configurable per mission via WaveSchedule.
 * Difficulty scaling affects composition (more enemies on Elite, fewer on Support).
 */

import type { World } from "koota";
import { AIState } from "@/ecs/traits/ai";
import { Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { Armor } from "@/ecs/traits/combat";
import { SCALE_GUARD_UNITS } from "@/data/units";

// ---------------------------------------------------------------------------
// Wave Definition Types
// ---------------------------------------------------------------------------

export interface WaveEnemy {
	/** Unit type id from data/units.ts (e.g. "gator", "viper") */
	unitType: string;
	/** Number of this unit type in the wave */
	count: number;
}

export interface WaveDefinition {
	/** Wave number (1-indexed) */
	waveNumber: number;
	/** Enemies in this wave */
	enemies: WaveEnemy[];
	/** Spawn position(s) — enemies are distributed across these */
	spawnPoints: Array<{ x: number; y: number }>;
	/** Delay in seconds before this wave starts (from mission start) */
	delaySeconds: number;
	/** Whether this is a boss wave */
	isBoss?: boolean;
}

export interface WaveSchedule {
	/** All waves for this mission */
	waves: WaveDefinition[];
	/** Time between waves in seconds (used if delaySeconds is 0) */
	intervalSeconds: number;
	/** Optional callback when a wave starts */
	onWaveStart?: (waveNumber: number, totalWaves: number) => void;
	/** Optional callback when all waves are cleared */
	onAllWavesCleared?: () => void;
}

// ---------------------------------------------------------------------------
// Difficulty Scaling
// ---------------------------------------------------------------------------

export type DifficultyLevel = "support" | "tactical" | "elite";

const DIFFICULTY_WAVE_MULTIPLIERS: Record<DifficultyLevel, { countMultiplier: number; extraTypes: boolean }> = {
	support: { countMultiplier: 0.75, extraTypes: false },
	tactical: { countMultiplier: 1.0, extraTypes: false },
	elite: { countMultiplier: 1.25, extraTypes: true },
};

// ---------------------------------------------------------------------------
// Wave Schedule Builder
// ---------------------------------------------------------------------------

/**
 * Generate a default escalation wave schedule.
 *
 * @param totalWaves - Number of waves (typically 4-8)
 * @param intervalSeconds - Base time between waves
 * @param spawnPoints - Available spawn positions
 * @param difficulty - Difficulty level for scaling
 */
export function buildEscalationSchedule(
	totalWaves: number,
	intervalSeconds: number,
	spawnPoints: Array<{ x: number; y: number }>,
	difficulty: DifficultyLevel = "tactical",
): WaveSchedule {
	const scaling = DIFFICULTY_WAVE_MULTIPLIERS[difficulty];
	const waves: WaveDefinition[] = [];

	for (let i = 1; i <= totalWaves; i++) {
		const progress = i / totalWaves; // 0..1
		const isBoss = i === totalWaves || (totalWaves >= 6 && i === Math.ceil(totalWaves * 0.75));

		const enemies: WaveEnemy[] = [];

		// Base: gators (melee tanks) scale up with wave number
		const gatorCount = Math.max(1, Math.round((1 + progress * 3) * scaling.countMultiplier));
		enemies.push({ unitType: "gator", count: gatorCount });

		// Mid-game: add vipers from wave 3+
		if (i >= 3) {
			const viperCount = Math.max(1, Math.round((progress * 2) * scaling.countMultiplier));
			enemies.push({ unitType: "viper", count: viperCount });
		}

		// Late-game: add scout lizards for variety from wave 4+
		if (i >= 4 && scaling.extraTypes) {
			enemies.push({ unitType: "scout_lizard", count: 1 });
		}

		// Boss waves: add Croc Champion
		if (isBoss) {
			const champCount = difficulty === "elite" ? 2 : 1;
			enemies.push({ unitType: "croc_champion", count: champCount });
		}

		// Siphon drones on later waves
		if (i >= Math.ceil(totalWaves * 0.6)) {
			const droneCount = Math.max(1, Math.round(progress * scaling.countMultiplier));
			enemies.push({ unitType: "siphon_drone", count: droneCount });
		}

		waves.push({
			waveNumber: i,
			enemies,
			spawnPoints,
			delaySeconds: i * intervalSeconds,
			isBoss,
		});
	}

	return { waves, intervalSeconds };
}

// ---------------------------------------------------------------------------
// Wave Spawner State
// ---------------------------------------------------------------------------

export interface WaveSpawnerState {
	schedule: WaveSchedule;
	currentWave: number; // 0 = not started, 1 = first wave, etc.
	elapsedSeconds: number;
	wavesSpawned: Set<number>;
	allWavesCleared: boolean;
}

export function createWaveSpawnerState(schedule: WaveSchedule): WaveSpawnerState {
	return {
		schedule,
		currentWave: 0,
		elapsedSeconds: 0,
		wavesSpawned: new Set(),
		allWavesCleared: false,
	};
}

// ---------------------------------------------------------------------------
// Spawner Logic
// ---------------------------------------------------------------------------

/**
 * Spawn enemies for a wave definition into the ECS world.
 */
function spawnWaveEnemies(world: World, waveDef: WaveDefinition): void {
	for (const entry of waveDef.enemies) {
		const unitDef = SCALE_GUARD_UNITS[entry.unitType];
		if (!unitDef) continue;

		for (let i = 0; i < entry.count; i++) {
			// Distribute across spawn points
			const sp = waveDef.spawnPoints[i % waveDef.spawnPoints.length];
			// Add slight random offset so units don't stack
			const offsetX = sp.x + (Math.random() - 0.5) * 2;
			const offsetY = sp.y + (Math.random() - 0.5) * 2;

			world.spawn(
				Position({ x: offsetX, y: offsetY }),
				UnitType({ type: entry.unitType }),
				Faction({ id: "scale_guard" }),
				Health({ current: unitDef.hp, max: unitDef.hp }),
				Attack({
					damage: unitDef.damage,
					range: unitDef.range,
					cooldown: 1,
					timer: 0,
				}),
				Armor({ value: unitDef.armor }),
				VisionRadius({ radius: 5 }),
				AIState({ state: "idle", target: null, alertLevel: 0 }),
				OrderQueue,
			);
		}
	}
}

/**
 * Tick the wave spawner system.
 *
 * @param world - The Koota ECS world
 * @param delta - Delta time in seconds
 * @param state - Mutable wave spawner state
 * @returns Updated wave number (0 if no new wave this tick)
 */
export function waveSpawnerSystem(
	world: World,
	delta: number,
	state: WaveSpawnerState,
): number {
	if (state.allWavesCleared) return 0;

	state.elapsedSeconds += delta;
	let newWave = 0;

	for (const waveDef of state.schedule.waves) {
		if (state.wavesSpawned.has(waveDef.waveNumber)) continue;

		if (state.elapsedSeconds >= waveDef.delaySeconds) {
			spawnWaveEnemies(world, waveDef);
			state.wavesSpawned.add(waveDef.waveNumber);
			state.currentWave = waveDef.waveNumber;
			newWave = waveDef.waveNumber;

			if (state.schedule.onWaveStart) {
				state.schedule.onWaveStart(
					waveDef.waveNumber,
					state.schedule.waves.length,
				);
			}
		}
	}

	// Check if all waves have been spawned
	if (state.wavesSpawned.size === state.schedule.waves.length && !state.allWavesCleared) {
		state.allWavesCleared = true;
		if (state.schedule.onAllWavesCleared) {
			state.schedule.onAllWavesCleared();
		}
	}

	return newWave;
}
