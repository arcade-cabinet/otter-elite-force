/**
 * Combat System
 *
 * Handles damage, health, death, and weapon firing.
 */

import * as THREE from "three";
import { useGameStore } from "../../stores/gameStore";
import { createProjectile } from "../archetypes";
import { damageables, deadEntities, enemies, players, projectiles, world } from "../world";

/**
 * Apply damage to an entity
 */
export const applyDamage = (
	entityId: string,
	damage: number,
	_damageType: "kinetic" | "explosive" | "fire" | "toxic" = "kinetic",
	sourceId?: string,
	isCritical = false,
): void => {
	const entity = [...damageables].find((e) => e.id === entityId);
	if (!entity?.health) return;

	// Check invulnerability
	if (entity.health.isInvulnerable || entity.isInvulnerable) return;

	// Apply damage
	entity.health.current = Math.max(0, entity.health.current - damage);
	entity.health.lastDamageTime = Date.now();

	// Apply suppression if entity has it (0-100 scale)
	if (entity.suppression) {
		entity.suppression.amount = Math.min(100, entity.suppression.amount + damage * 5);
		entity.suppression.lastIncrementTime = Date.now();
	}

	// Check for death and register hit feedback
	const isKill = entity.health.current <= 0;
	if (isKill) {
		world.addComponent(entity, "isDead", { __tag: "IsDead" });
	}
	
	// If source was player, register hit for feedback UI
	const isPlayerSource = [...players].some((p) => p.id === sourceId);
	if (isPlayerSource && entity.isEnemy) {
		const enemyType = entity.enemy?.type || "enemy";
		const xp = isKill ? entity.enemy?.xpValue || 0 : 0;
		const credits = isKill ? Math.floor(Math.random() * 10) + 5 : 0; // Random credits 5-15
		
		useGameStore.getState().registerHit(
			isCritical,
			isKill,
			enemyType,
			xp,
			credits
		);
	}
};

/**
 * Heal an entity
 */
export const healEntity = (entityId: string, amount: number): void => {
	const entity = [...damageables].find((e) => e.id === entityId);
	if (!entity?.health) return;

	entity.health.current = Math.min(entity.health.max, entity.health.current + amount);
};

/**
 * Fire a weapon from an entity
 */
export const fireWeapon = (entityId: string, targetDirection: THREE.Vector3): boolean => {
	const entity = world.entities.find((e) => e.id === entityId);
	if (!entity?.weapon || !entity?.transform) return false;

	const now = Date.now();
	const timeSinceLastFire = (now - entity.weapon.lastFireTime) / 1000;

	// Check fire rate
	if (timeSinceLastFire < entity.weapon.fireRate) return false;

	// Check ammo
	if (entity.weapon.ammo <= 0) return false;

	// Create projectile
	const muzzleOffset = new THREE.Vector3(0, 0.5, 0.5);
	muzzleOffset.applyEuler(entity.transform.rotation);
	const muzzlePosition = entity.transform.position.clone().add(muzzleOffset);

	createProjectile({
		position: muzzlePosition,
		direction: targetDirection.normalize(),
		speed: entity.weapon.bulletSpeed,
		damage: entity.weapon.damage,
		damageType: "kinetic",
		sourceId: entityId,
		range: entity.weapon.range,
	});

	// Update weapon state
	entity.weapon.lastFireTime = now;
	entity.weapon.ammo--;
	entity.weapon.isFiring = true;

	return true;
};

/**
 * Update projectile collisions
 */
export const updateProjectileCollisions = (): void => {
	const projectileList = [...projectiles];
	const targetLists = {
		player: [...players],
		enemy: [...enemies],
	};

	for (const projectile of projectileList) {
		if (!projectile.transform || !projectile.damage || !projectile.collider) continue;

		// Determine what this projectile can hit
		const isPlayerProjectile = targetLists.player.some((p) => p.id === projectile.damage?.source);
		const targets = isPlayerProjectile ? targetLists.enemy : targetLists.player;

		for (const target of targets) {
			if (!target.transform || !target.collider) continue;

			const distance = projectile.transform.position.distanceTo(target.transform.position);
			const hitRadius = projectile.collider.radius + target.collider.radius;

			if (distance < hitRadius) {
				// Apply damage
				applyDamage(
					target.id,
					projectile.damage.amount,
					projectile.damage.type,
					projectile.damage.source,
				);

				// Destroy projectile
				world.addComponent(projectile, "isDead", { __tag: "IsDead" });
				break;
			}
		}
	}
};

/**
 * Update suppression decay
 */
export const updateSuppression = (delta: number): void => {
	for (const entity of enemies) {
		if (!entity.suppression) continue;

		// Decay suppression over time
		entity.suppression.amount = Math.max(
			0,
			entity.suppression.amount - entity.suppression.decayRate * delta,
		);
	}
};

/**
 * Update health regeneration
 */
export const updateHealthRegen = (delta: number): void => {
	for (const entity of damageables) {
		if (!entity.health) continue;
		if (entity.health.regenRate <= 0) continue;
		if (entity.health.current >= entity.health.max) continue;

		// Only regen if not recently damaged
		const timeSinceDamage = (Date.now() - entity.health.lastDamageTime) / 1000;
		if (timeSinceDamage < 3) continue;

		entity.health.current = Math.min(
			entity.health.max,
			entity.health.current + entity.health.regenRate * delta,
		);
	}
};

/**
 * Clean up dead entities
 */
export const cleanupDead = (): void => {
	const dead = [...deadEntities];
	for (const entity of dead) {
		world.remove(entity);
	}
};

/**
 * Get all entities in explosion radius and apply damage
 */
export const applyExplosionDamage = (
	center: THREE.Vector3,
	radius: number,
	damage: number,
	sourceId?: string,
): void => {
	for (const entity of damageables) {
		if (!entity.transform) continue;
		if (entity.id === sourceId) continue; // Don't damage source

		const distance = entity.transform.position.distanceTo(center);
		if (distance > radius) continue;

		// Damage falls off with distance
		const falloff = 1 - distance / radius;
		const actualDamage = Math.floor(damage * falloff);

		if (actualDamage > 0) {
			applyDamage(entity.id, actualDamage, "explosive", sourceId);
		}
	}
};
