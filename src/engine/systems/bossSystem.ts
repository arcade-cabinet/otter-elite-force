/**
 * Boss System -- Manages boss entity behavior, phase transitions, AoE
 * ground-pound attacks, minion summoning, and enrage mechanics.
 *
 * Boss entities are tracked via world.runtime.bossConfigs. Each boss
 * has phases that activate at HP thresholds, modifying stats and
 * triggering events.
 *
 * Phase logic:
 *   - Compares current HP% against phase thresholds (descending).
 *   - When a new threshold is crossed, advances phase and emits "boss-phase-change".
 *   - Final phase sets enraged flag, doubling AoE frequency.
 *
 * AoE:
 *   - Ticks aoeCooldown timer. When ready, deals aoeDamage to all player units
 *     within aoeRadius pixels. Emits "boss-aoe" event.
 *
 * Summon:
 *   - Ticks summonCooldown timer. When ready, spawns summonCount units of
 *     summonType near the boss. Emits "boss-summon" event.
 *
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { Armor, Attack, Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";
import { calculateDamage, distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BossPhase {
	hpThreshold: number;
	name?: string;
	dialogue?: string;
	armor?: number;
	damage?: number;
	speed?: number;
	range?: number;
}

export interface BossConfig {
	name: string;
	armor: number;
	damage: number;
	range: number;
	attackCooldown: number;
	speed: number;
	visionRadius: number;
	phases: BossPhase[];
	/** AoE ground-pound damage. Default 15. */
	aoeDamage?: number;
	/** AoE blast radius in pixels. Default 96. */
	aoeRadius?: number;
	/** AoE cooldown in seconds. Default 8. */
	aoeCooldown?: number;
	/** Current AoE timer accumulator (seconds). */
	aoeTimer?: number;
	/** Unit type to summon. If undefined, summoning is disabled. */
	summonType?: string;
	/** Number of minions to summon per wave. Default 2. */
	summonCount?: number;
	/** Summon cooldown in seconds. Default 15. */
	summonCooldown?: number;
	/** Current summon timer accumulator (seconds). */
	summonTimer?: number;
	/** Current active phase index (1-based). 0 = no phase active. */
	currentPhase?: number;
	/** Whether boss is enraged (final phase). */
	enraged?: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_AOE_DAMAGE = 15;
const DEFAULT_AOE_RADIUS = 96;
const DEFAULT_AOE_COOLDOWN = 8;
const DEFAULT_SUMMON_COUNT = 2;
const DEFAULT_SUMMON_COOLDOWN = 15;

// ---------------------------------------------------------------------------
// runBossSystem
// ---------------------------------------------------------------------------

/**
 * Run one tick of the boss system.
 * Checks boss HP, applies phase transitions, fires AoE, and summons minions.
 */
export function runBossSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;

	for (const [eid, rawConfig] of world.runtime.bossConfigs) {
		if (!world.runtime.alive.has(eid)) continue;

		const config = rawConfig as BossConfig;
		const hpPercent = Health.max[eid] > 0 ? (Health.current[eid] / Health.max[eid]) * 100 : 0;

		// --- Phase check ---
		let activePhase: BossPhase | null = null;
		let activePhaseIndex = 0;
		for (let i = 0; i < (config.phases ?? []).length; i++) {
			const phase = config.phases[i];
			if (hpPercent <= phase.hpThreshold) {
				activePhase = phase;
				activePhaseIndex = i + 1; // 1-based
			}
		}

		const prevPhase = config.currentPhase ?? 0;

		if (activePhaseIndex !== prevPhase) {
			// Phase transition
			config.currentPhase = activePhaseIndex;
			const isEnraged = activePhaseIndex === config.phases.length && activePhaseIndex > 0;
			config.enraged = isEnraged;

			world.events.push({
				type: "boss-phase-change",
				payload: {
					bossName: config.name,
					phase: activePhaseIndex,
					phaseName: activePhase?.name ?? `Phase ${activePhaseIndex}`,
					dialogue: activePhase?.dialogue ?? null,
					enraged: isEnraged,
				},
			});
		}

		// Apply phase stat overrides
		if (activePhase) {
			if (activePhase.damage !== undefined) {
				Attack.damage[eid] = activePhase.damage;
			}
			if (activePhase.range !== undefined) {
				Attack.range[eid] = activePhase.range;
			}
			if (activePhase.speed !== undefined) {
				Speed.value[eid] = activePhase.speed;
			}
			if (activePhase.armor !== undefined) {
				Armor.value[eid] = activePhase.armor;
			}
		}

		if (deltaSec <= 0) continue;

		// --- AoE timer ---
		const aoeDamage = config.aoeDamage ?? DEFAULT_AOE_DAMAGE;
		const aoeRadius = config.aoeRadius ?? DEFAULT_AOE_RADIUS;
		const baseCooldown = config.aoeCooldown ?? DEFAULT_AOE_COOLDOWN;
		const effectiveAoeCooldown = config.enraged ? baseCooldown / 2 : baseCooldown;

		config.aoeTimer = (config.aoeTimer ?? 0) + deltaSec;

		if (config.aoeTimer >= effectiveAoeCooldown) {
			config.aoeTimer = 0;

			// Deal AoE damage to all enemy units within radius
			const bossFaction = Faction.id[eid];
			const bossX = Position.x[eid];
			const bossY = Position.y[eid];
			let hitCount = 0;

			for (const cid of world.runtime.alive) {
				if (cid === eid) continue;
				if (Faction.id[cid] === bossFaction) continue;
				if (Flags.isProjectile[cid] === 1 || Flags.isResource[cid] === 1) continue;
				if (Health.max[cid] <= 0 || Health.current[cid] <= 0) continue;

				const dist = distanceBetween(bossX, bossY, Position.x[cid], Position.y[cid]);
				if (dist <= aoeRadius) {
					const armorVal = Armor.value[cid];
					const dmg = calculateDamage(aoeDamage, armorVal);
					Health.current[cid] -= dmg;
					hitCount++;
				}
			}

			world.events.push({
				type: "boss-aoe",
				payload: {
					bossName: config.name,
					x: bossX,
					y: bossY,
					radius: aoeRadius,
					hitCount,
				},
			});
		}

		// --- Summon timer ---
		if (config.summonType) {
			const summonCooldown = config.summonCooldown ?? DEFAULT_SUMMON_COOLDOWN;
			const summonCount = config.summonCount ?? DEFAULT_SUMMON_COUNT;

			config.summonTimer = (config.summonTimer ?? 0) + deltaSec;

			if (config.summonTimer >= summonCooldown) {
				config.summonTimer = 0;

				const bossX = Position.x[eid];
				const bossY = Position.y[eid];
				const bossFaction = Faction.id[eid];
				const factionName = bossFaction === FACTION_IDS.ura ? "ura"
					: bossFaction === FACTION_IDS.scale_guard ? "scale_guard"
					: "neutral";

				for (let i = 0; i < summonCount; i++) {
					const offsetX = bossX + (Math.random() - 0.5) * 128;
					const offsetY = bossY + (Math.random() - 0.5) * 128;

					spawnUnit(world, {
						x: offsetX,
						y: offsetY,
						faction: factionName,
						unitType: config.summonType,
						health: { current: 50, max: 50 },
						stats: {
							hp: 50,
							armor: 1,
							speed: 1.5,
							attackDamage: 8,
							attackRange: 1,
							attackCooldownMs: 1,
							visionRadius: 5,
							popCost: 0,
						},
					});
				}

				world.events.push({
					type: "boss-summon",
					payload: {
						bossName: config.name,
						x: bossX,
						y: bossY,
						summonType: config.summonType,
						count: summonCount,
					},
				});
			}
		}
	}
}
