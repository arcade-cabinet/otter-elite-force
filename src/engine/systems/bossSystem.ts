/**
 * Boss System — Manages boss entity behavior and phase transitions.
 *
 * Boss entities are tracked via world.runtime.bossConfigs. Each boss
 * has phases that activate at HP thresholds, modifying stats and
 * triggering events.
 *
 * Pure function on GameWorld.
 */

import { Attack, Health, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

interface BossPhase {
	hpThreshold: number;
	armor?: number;
	damage?: number;
	speed?: number;
	range?: number;
}

interface BossConfig {
	name: string;
	armor: number;
	damage: number;
	range: number;
	attackCooldown: number;
	speed: number;
	visionRadius: number;
	phases: BossPhase[];
}

/**
 * Run one tick of the boss system.
 * Checks boss HP and applies phase transitions.
 */
export function runBossSystem(world: GameWorld): void {
	for (const [eid, rawConfig] of world.runtime.bossConfigs) {
		if (!world.runtime.alive.has(eid)) continue;

		const config = rawConfig as BossConfig;
		const hpPercent = Health.max[eid] > 0 ? (Health.current[eid] / Health.max[eid]) * 100 : 0;

		// Find the active phase (highest threshold that HP is below)
		let activePhase: BossPhase | null = null;
		for (const phase of config.phases ?? []) {
			if (hpPercent <= phase.hpThreshold) {
				activePhase = phase;
			}
		}

		if (activePhase) {
			// Apply phase stat overrides
			if (activePhase.damage !== undefined) {
				Attack.damage[eid] = activePhase.damage;
			}
			if (activePhase.range !== undefined) {
				Attack.range[eid] = activePhase.range;
			}
			if (activePhase.speed !== undefined) {
				Speed.value[eid] = activePhase.speed;
			}
		}
	}
}
