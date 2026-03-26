/**
 * Boss System for Otter: Elite Force RTS.
 *
 * Manages boss encounter phases, AoE ground-pound attacks, and minion summoning.
 * Runs once per frame for every entity with BossUnit + Health.
 *
 * Phase logic:
 *   - Compares current HP% against phase thresholds (descending).
 *   - When a new threshold is crossed, advances phase and emits "boss-phase-change".
 *   - Final phase sets `enraged = true`, doubling AoE frequency.
 *
 * AoE:
 *   - Ticks aoeCooldown timer. When ready, deals aoeDamage to all player units
 *     within aoeRadius tiles. Emits "boss-aoe" event.
 *
 * Summon:
 *   - Ticks summonCooldown timer. When ready, spawns summonCount units of
 *     summonType near the boss. Emits "boss-summon" event.
 *
 * IMPORTANT: BossUnit is a factory trait — all .set() calls must use the
 * callback form `(prev) => ({ ...prev, field: value })` for partial updates.
 */

import type { World } from "koota";
import { AIState } from "../ecs/traits/ai";
import { BossUnit } from "../ecs/traits/boss";
import { Armor, Attack, Health, VisionRadius } from "../ecs/traits/combat";
import { Faction, UnitType } from "../ecs/traits/identity";
import { OrderQueue } from "../ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { EventBus } from "../game/EventBus";
import { distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// bossSystem — phase transitions, AoE, and summon timers
// ---------------------------------------------------------------------------

export function bossSystem(world: World, delta: number): void {
	const bosses = world.query(BossUnit, Health, Position, Faction);

	for (const entity of bosses) {
		const boss = entity.get(BossUnit)!;
		const health = entity.get(Health)!;
		const bossPos = entity.get(Position)!;
		const bossFaction = entity.get(Faction)!;

		// --- Phase check ---
		const hpPercent = (health.current / Math.max(health.max, 1)) * 100;

		let newPhase = boss.currentPhase;
		for (let i = boss.phases.length - 1; i >= 0; i--) {
			if (hpPercent <= boss.phases[i].hpThreshold && i + 1 > newPhase) {
				newPhase = i + 1;
			}
		}

		if (newPhase !== boss.currentPhase) {
			const phaseIndex = newPhase - 1;
			const phase = boss.phases[phaseIndex];
			const isEnraged = newPhase === boss.phases.length;

			entity.set(BossUnit, (prev) => ({
				...prev,
				currentPhase: newPhase,
				enraged: isEnraged,
			}));

			EventBus.emit("boss-phase-change", {
				bossName: boss.name,
				phase: newPhase,
				phaseName: phase?.name ?? "Unknown",
				dialogue: phase?.dialogue ?? null,
				enraged: isEnraged,
			});

			// Skip AoE/summon this tick — phase just changed
			continue;
		}

		const effectiveAoeCooldown = boss.enraged ? boss.aoeCooldown / 2 : boss.aoeCooldown;

		// --- AoE timer ---
		const newAoeTimer = boss.aoeTimer + delta;
		if (newAoeTimer >= effectiveAoeCooldown) {
			// Deal AoE damage to all enemy units within radius
			const targets = world.query(Position, Health, Faction);
			let hitCount = 0;

			for (const target of targets) {
				if (target === entity) continue;
				const targetFaction = target.get(Faction)!;
				if (targetFaction.id === bossFaction.id) continue;

				const targetPos = target.get(Position)!;
				const dist = distanceBetween(bossPos.x, bossPos.y, targetPos.x, targetPos.y);

				if (dist <= boss.aoeRadius) {
					const armorValue = target.has(Armor) ? target.get(Armor)!.value : 0;
					const dmg = Math.max(1, boss.aoeDamage - armorValue);
					target.set(Health, (prev) => ({ current: prev.current - dmg }));
					hitCount++;
				}
			}

			entity.set(BossUnit, (prev) => ({ ...prev, aoeTimer: 0 }));

			EventBus.emit("boss-aoe", {
				bossName: boss.name,
				x: bossPos.x,
				y: bossPos.y,
				radius: boss.aoeRadius,
				hitCount,
			});
		} else {
			entity.set(BossUnit, (prev) => ({ ...prev, aoeTimer: newAoeTimer }));
		}

		// --- Summon timer ---
		// Re-read after AoE set to get latest timer state
		const updatedBoss = entity.get(BossUnit)!;
		const newSummonTimer = updatedBoss.summonTimer + delta;
		if (newSummonTimer >= updatedBoss.summonCooldown && updatedBoss.summonType) {
			// Spawn minions near the boss
			for (let i = 0; i < updatedBoss.summonCount; i++) {
				const offsetX = bossPos.x + (Math.random() - 0.5) * 4;
				const offsetY = bossPos.y + (Math.random() - 0.5) * 4;

				world.spawn(
					Position({ x: offsetX, y: offsetY }),
					UnitType({ type: updatedBoss.summonType }),
					Faction({ id: bossFaction.id }),
					Health({ current: 50, max: 50 }),
					Attack({ damage: 8, range: 1, cooldown: 1.0, timer: 0 }),
					Armor({ value: 1 }),
					VisionRadius({ radius: 5 }),
					AIState({ state: "idle", target: null, alertLevel: 0 }),
					OrderQueue,
				);
			}

			entity.set(BossUnit, (prev) => ({ ...prev, summonTimer: 0 }));

			EventBus.emit("boss-summon", {
				bossName: updatedBoss.name,
				x: bossPos.x,
				y: bossPos.y,
				summonType: updatedBoss.summonType,
				count: updatedBoss.summonCount,
			});
		} else {
			entity.set(BossUnit, (prev) => ({ ...prev, summonTimer: newSummonTimer }));
		}
	}
}
