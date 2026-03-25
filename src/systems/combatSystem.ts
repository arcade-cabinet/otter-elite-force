/**
 * Combat System for Otter: Elite Force RTS.
 *
 * Handles melee/ranged attacks, auto-aggro, projectile travel, and death cleanup.
 * All combat flows through Koota ECS traits and the Targeting relation.
 *
 * Spec reference: §8.4 — damage = attack - armor (min 1), per-unit cooldown,
 * ranged attacks spawn projectile entities, units auto-aggro nearest enemy.
 *
 * IMPORTANT: Koota SoA traits return snapshots from .get(), so all mutations
 * MUST use .set() to persist changes back to the store.
 */

import type { Entity, World } from "koota";
import { Targeting } from "../ecs/relations";
import { Armor, Attack, Health, VisionRadius } from "../ecs/traits/combat";
import { Faction, IsProjectile } from "../ecs/traits/identity";
import { Position, Velocity } from "../ecs/traits/spatial";
import { EventBus } from "../game/EventBus";
import {
	applyEnemyDamageModifier,
	getDifficultyModifiers,
	type DifficultyModifiers,
} from "./difficultyScaling";

/** Projectile speed in tiles per second. */
const PROJECTILE_SPEED = 8;

/** Hit radius — when a projectile is this close to its target, it hits. */
const HIT_RADIUS = 0.5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

export function calculateDamage(attackDamage: number, armorValue: number): number {
	return Math.max(1, attackDamage - armorValue);
}

// ---------------------------------------------------------------------------
// combatSystem — process Attack+Targeting entities, apply damage or spawn projectile
// ---------------------------------------------------------------------------

/**
 * Ticks combat for all entities that have an Attack trait and a Targeting relation.
 * Melee (range <= 1): apply damage directly.
 * Ranged (range > 1): spawn a projectile entity.
 *
 * Difficulty scaling: When a Scale-Guard entity attacks a player entity,
 * enemy damage is multiplied by the difficulty modifier.
 */
export function combatSystem(world: World, delta: number): void {
	const attackers = world.query(Attack, Position, Targeting("*"));
	// Read difficulty modifiers once per frame (not per entity)
	let modifiers: DifficultyModifiers | null = null;

	for (const entity of attackers) {
		// Skip projectiles — they have their own system
		if (entity.has(IsProjectile)) continue;

		const attack = entity.get(Attack)!;
		const attackerPos = entity.get(Position)!;

		// Accumulate timer (read snapshot, check, then persist)
		const newTimer = attack.timer + delta;
		if (newTimer < attack.cooldown) {
			entity.set(Attack, { timer: newTimer });
			continue;
		}

		// Find the target via the Targeting relation
		const targets = entity.targetsFor(Targeting);
		if (targets.length === 0) {
			entity.set(Attack, { timer: newTimer });
			continue;
		}
		const target = targets[0];

		// Validate target still exists and has health
		if (!target.isAlive() || !target.has(Health)) {
			entity.remove(Targeting(target));
			entity.set(Attack, { timer: newTimer });
			continue;
		}

		const targetPos = target.get(Position)!;
		const dist = distanceBetween(attackerPos.x, attackerPos.y, targetPos.x, targetPos.y);

		// Out of range — don't attack, don't reset timer
		if (dist > attack.range) {
			entity.set(Attack, { timer: newTimer });
			continue;
		}

		// Reset cooldown timer (attack fires)
		entity.set(Attack, { timer: 0 });

		// Determine effective damage with difficulty scaling:
		// If attacker is Scale-Guard and target is player (ura), apply enemy damage modifier.
		let effectiveDamage = attack.damage;
		const attackerFaction = entity.has(Faction) ? entity.get(Faction) : null;
		const targetFaction = target.has(Faction) ? target.get(Faction) : null;
		if (attackerFaction?.id === "scale_guard" && targetFaction?.id === "ura") {
			if (!modifiers) modifiers = getDifficultyModifiers(world);
			effectiveDamage = applyEnemyDamageModifier(attack.damage, modifiers);
		}

		if (attack.range <= 1) {
			// Melee: direct damage
			const armorValue = target.has(Armor) ? target.get(Armor)!.value : 0;
			const dmg = calculateDamage(effectiveDamage, armorValue);
			target.set(Health, (prev) => ({ current: prev.current - dmg }));
			EventBus.emit("melee-hit");
		} else {
			// Ranged: spawn projectile (carries effective damage for difficulty scaling)
			world.spawn(
				IsProjectile(),
				Position({ x: attackerPos.x, y: attackerPos.y }),
				Velocity({ x: 0, y: 0 }),
				Attack({
					damage: effectiveDamage,
					range: attack.range,
					cooldown: 0,
					timer: 0,
				}),
				Targeting(target),
			);
			EventBus.emit("ranged-fire");
		}
	}
}

// ---------------------------------------------------------------------------
// aggroSystem — auto-acquire nearest enemy within vision radius
// ---------------------------------------------------------------------------

/**
 * For units with Attack + VisionRadius that are NOT already targeting something,
 * find the nearest enemy within vision range and set Targeting.
 */
export function aggroSystem(world: World): void {
	const combatants = world.query(Attack, Position, Faction, VisionRadius);
	const potentialTargets = world.query(Position, Faction, Health);

	for (const entity of combatants) {
		// Skip if already targeting
		if (entity.has(Targeting("*"))) continue;

		const pos = entity.get(Position)!;
		const faction = entity.get(Faction)!;
		const vision = entity.get(VisionRadius)!;

		let nearestDist = Number.POSITIVE_INFINITY;
		let nearestTarget: Entity | null = null;

		for (const candidate of potentialTargets) {
			// Don't target self
			if (candidate === entity) continue;

			// Don't target allies
			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id === faction.id) continue;

			// Check distance
			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(pos.x, pos.y, candidatePos.x, candidatePos.y);

			if (dist <= vision.radius && dist < nearestDist) {
				nearestDist = dist;
				nearestTarget = candidate;
			}
		}

		if (nearestTarget !== null) {
			entity.add(Targeting(nearestTarget));
		}
	}
}

// ---------------------------------------------------------------------------
// projectileSystem — move projectiles toward targets, apply damage on arrival
// ---------------------------------------------------------------------------

/**
 * Moves projectile entities toward their target. On arrival (within HIT_RADIUS),
 * applies damage and destroys the projectile.
 */
export function projectileSystem(world: World, delta: number): void {
	const projectiles = world.query(IsProjectile, Position, Targeting("*"));

	for (const proj of projectiles) {
		const targets = proj.targetsFor(Targeting);
		if (targets.length === 0) {
			proj.destroy();
			continue;
		}

		const target = targets[0];
		if (!target.isAlive() || !target.has(Position)) {
			proj.destroy();
			continue;
		}

		const projPos = proj.get(Position)!;
		const targetPos = target.get(Position)!;

		const dx = targetPos.x - projPos.x;
		const dy = targetPos.y - projPos.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= HIT_RADIUS) {
			// Hit! Apply damage
			if (target.has(Health)) {
				const attack = proj.get(Attack)!;
				const armorValue = target.has(Armor) ? target.get(Armor)!.value : 0;
				const dmg = calculateDamage(attack.damage, armorValue);
				target.set(Health, (prev) => ({ current: prev.current - dmg }));
			}
			proj.destroy();
		} else {
			// Move toward target
			const speed = PROJECTILE_SPEED * delta;
			const nx = dx / dist;
			const ny = dy / dist;
			proj.set(Position, {
				x: projPos.x + nx * speed,
				y: projPos.y + ny * speed,
			});

			// Update velocity for rendering
			if (proj.has(Velocity)) {
				proj.set(Velocity, {
					x: nx * PROJECTILE_SPEED,
					y: ny * PROJECTILE_SPEED,
				});
			}
		}
	}
}

// ---------------------------------------------------------------------------
// deathSystem — destroy entities with health <= 0, clear targeting refs
// ---------------------------------------------------------------------------

/**
 * Finds all entities with Health.current <= 0, clears Targeting relations
 * that point at them, and destroys them.
 *
 * Returns an array of entities that died (useful for spawning death FX).
 */
export function deathSystem(world: World): Entity[] {
	const mortal = world.query(Health, Position);
	const dead: Entity[] = [];

	for (const entity of mortal) {
		const health = entity.get(Health)!;
		if (health.current <= 0) {
			dead.push(entity);
		}
	}

	// Clear targeting relations pointing at dead entities, then destroy them
	if (dead.length > 0) {
		const allWithTargeting = world.query(Targeting("*"));
		for (const attacker of allWithTargeting) {
			const targets = attacker.targetsFor(Targeting);
			for (const target of targets) {
				if (dead.includes(target)) {
					attacker.remove(Targeting(target));
				}
			}
		}

		for (const entity of dead) {
			EventBus.emit("unit-died");
			entity.destroy();
		}
	}

	return dead;
}
