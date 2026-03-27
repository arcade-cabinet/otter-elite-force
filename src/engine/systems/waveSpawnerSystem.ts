/**
 * Wave Spawner System — Spawns enemy waves at timed intervals.
 *
 * Reads waveCounter from world.runtime and spawns enemy entities
 * based on the current scenario phase. Wave spawning is triggered
 * by scenario actions (setWaveCounter, incrementWaveCounter) and
 * this system handles the actual entity spawning.
 *
 * Pure function on GameWorld.
 */

import { TILE_SIZE } from "@/config/constants";
import { Attack, Speed, VisionRadius } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";

/** Accumulated wave spawn timer per wave counter value. */
const waveTimers = new Map<number, number>();

/** Minimum interval between wave spawns in seconds. */
const WAVE_COOLDOWN = 30;

/**
 * Run one tick of the wave spawner system.
 * Manages wave timing and spawning based on scenario state.
 */
export function runWaveSpawnerSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const waveCounter = world.runtime.waveCounter;
	if (waveCounter <= 0) return;

	// Track time for current wave
	const timer = (waveTimers.get(waveCounter) ?? 0) + deltaSec;
	waveTimers.set(waveCounter, timer);

	// Only spawn once per wave counter value
	if (timer < WAVE_COOLDOWN) return;

	// Reset timer so we don't spawn again for this wave value
	waveTimers.set(waveCounter, -999999);

	// Find enemy spawn zones
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (!zoneId.includes("enemy") && !zoneId.includes("spawn") && !zoneId.includes("scale")) {
			continue;
		}

		// Spawn wave units at zone center
		const centerX = rect.x + rect.width / 2;
		const centerY = rect.y + rect.height / 2;
		const count = Math.min(2 + waveCounter, 8);

		for (let i = 0; i < count; i++) {
			const eid = spawnUnit(world, {
				x: centerX + (i % 4) * 20 - 30,
				y: centerY + Math.floor(i / 4) * 20 - 10,
				faction: "scale_guard",
				unitType: "gator",
				health: { current: 10, max: 10 },
			});
			Attack.damage[eid] = 2;
			Attack.range[eid] = 1 * TILE_SIZE;
			Attack.cooldown[eid] = 1.5;
			Speed.value[eid] = 5 * TILE_SIZE;
			VisionRadius.value[eid] = 5 * TILE_SIZE;
		}

		world.events.push({
			type: "wave-spawned",
			payload: {
				waveCounter,
				count,
				zoneId,
			},
		});
		break; // One spawn zone per wave
	}
}

/** Reset wave timers (for new missions/tests). */
export function resetWaveTimers(): void {
	waveTimers.clear();
}
