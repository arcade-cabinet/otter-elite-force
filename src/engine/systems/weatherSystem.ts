/**
 * Weather System — Applies weather effects to gameplay.
 *
 * Weather states: "clear", "rain", "monsoon"
 *
 * Effects:
 *   - Rain: reduces vision radius by 25%, reduces movement speed by 10%
 *   - Monsoon: reduces vision radius by 50%, reduces movement speed by 25%,
 *     ranged attack range reduced by 30%
 *
 * Weather transitions are triggered by scenario actions (changeWeather).
 * This system applies the ongoing effects each tick.
 *
 * Pure function on GameWorld.
 */

import { Attack, Speed, VisionRadius } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Speed multiplier per weather type. */
const WEATHER_SPEED: Record<string, number> = {
	clear: 1.0,
	rain: 0.9,
	monsoon: 0.75,
};

/** Vision multiplier per weather type. */
const WEATHER_VISION: Record<string, number> = {
	clear: 1.0,
	rain: 0.75,
	monsoon: 0.5,
};

/** Attack range multiplier per weather type. */
const WEATHER_RANGE: Record<string, number> = {
	clear: 1.0,
	rain: 1.0,
	monsoon: 0.7,
};

/** Per-entity base stats cache (eid -> base value). */
const baseSpeed = new Map<number, number>();
const baseVision = new Map<number, number>();
const baseRange = new Map<number, number>();

/** Last weather state to detect transitions. */
let lastWeather = "clear";

/**
 * Run one tick of the weather system.
 * Applies weather modifiers to entity stats.
 */
export function runWeatherSystem(world: GameWorld): void {
	const weather = world.runtime.weather;

	// On weather transition, cache base stats
	if (weather !== lastWeather) {
		for (const eid of world.runtime.alive) {
			// Restore base stats from cache before applying new modifiers
			const bs = baseSpeed.get(eid);
			if (bs !== undefined) Speed.value[eid] = bs;
			const bv = baseVision.get(eid);
			if (bv !== undefined) VisionRadius.value[eid] = bv;
			const br = baseRange.get(eid);
			if (br !== undefined) Attack.range[eid] = br;
		}

		// Cache current (now restored) base stats
		for (const eid of world.runtime.alive) {
			baseSpeed.set(eid, Speed.value[eid]);
			baseVision.set(eid, VisionRadius.value[eid]);
			baseRange.set(eid, Attack.range[eid]);
		}

		lastWeather = weather;
	}

	// Apply weather modifiers
	const speedMul = WEATHER_SPEED[weather] ?? 1.0;
	const visionMul = WEATHER_VISION[weather] ?? 1.0;
	const rangeMul = WEATHER_RANGE[weather] ?? 1.0;

	if (weather === "clear") return; // No modifiers needed

	for (const eid of world.runtime.alive) {
		const bs = baseSpeed.get(eid);
		if (bs !== undefined && bs > 0) {
			Speed.value[eid] = bs * speedMul;
		}
		const bv = baseVision.get(eid);
		if (bv !== undefined && bv > 0) {
			VisionRadius.value[eid] = bv * visionMul;
		}
		const br = baseRange.get(eid);
		if (br !== undefined && br > 0) {
			Attack.range[eid] = br * rangeMul;
		}
	}
}

/** Reset weather system state (for new missions/tests). */
export function resetWeatherSystem(): void {
	baseSpeed.clear();
	baseVision.clear();
	baseRange.clear();
	lastWeather = "clear";
}
