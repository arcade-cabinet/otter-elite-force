/**
 * Combat System — Full attack resolution, projectile spawning, armor
 * calculation, AoE damage, target priority, and death cleanup.
 *
 * Each frame:
 * 1. Auto-aggro: units without a target acquire nearest enemy in vision.
 * 2. Attack resolution: melee (range <= 48) applies direct damage with armor.
 *    Ranged (range > 48) spawns projectile entities.
 * 3. Projectile movement: travel toward target, apply damage + AoE on arrival.
 * 4. Death system: mark dead entities for removal, clear targeting refs.
 *
 * Damage formula: effective = max(1, attackDamage - targetArmor)
 * Difficulty scaling: Scale-Guard attacking URA applies campaign modifier.
 */

import { playSfx } from "@/engine/audio/audioRuntime";
import {
	Armor,
	Attack,
	Faction,
	Flags,
	Health,
	Position,
	SplashRadius,
	TargetRef,
	Velocity,
	VisionRadius,
} from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import {
	markForRemoval,
	spawnProjectile,
	type GameWorld,
} from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Projectile speed in pixels per second. */
const PROJECTILE_SPEED = 480;

/** Hit radius — projectile hits when this close to target. */
const HIT_RADIUS = 16;

/** Melee vs ranged threshold in pixels. Units with range <= 64 attack directly. */
const MELEE_RANGE_THRESHOLD = 64;

/** Default mortar splash radius in pixels. */
const MORTAR_SPLASH_RADIUS = 64;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distSq(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return dx * dx + dy * dy;
}

/** Calculate effective damage after armor reduction. Min 1. */
export function calculateDamage(attackDamage: number, armorValue: number): number {
	return Math.max(1, attackDamage - armorValue);
}

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	return Math.sqrt(distSq(ax, ay, bx, by));
}

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------

/**
 * Find the nearest enemy entity within range.
 * Skips same-faction, neutral, resources, projectiles, dead, and submerged
 * (unless attacker can swim). Returns -1 if none found.
 */
function findNearestEnemy(world: GameWorld, eid: number, range: number): number {
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const myFaction = Faction.id[eid];
	const rangeSq = range * range;

	let bestEid = -1;
	let bestDistSq = Number.POSITIVE_INFINITY;

	for (const cid of world.runtime.alive) {
		if (cid === eid) continue;
		if (Faction.id[cid] === myFaction) continue;
		if (Faction.id[cid] === FACTION_IDS.neutral) continue;
		if (Flags.isResource[cid] === 1) continue;
		if (Flags.isProjectile[cid] === 1) continue;
		if (Health.max[cid] <= 0) continue;
		if (Health.current[cid] <= 0) continue;
		if (Flags.submerged[cid] === 1 && Flags.canSwim[eid] !== 1) continue;

		const dSqVal = distSq(ax, ay, Position.x[cid], Position.y[cid]);
		if (dSqVal <= rangeSq && dSqVal < bestDistSq) {
			bestDistSq = dSqVal;
			bestEid = cid;
		}
	}

	return bestEid;
}

// ---------------------------------------------------------------------------
// Auto-aggro
// ---------------------------------------------------------------------------

/**
 * For combatants not already targeting something, find nearest enemy
 * within vision radius and set TargetRef.
 */
function autoAggro(world: GameWorld): void {
	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1 || Flags.isProjectile[eid] === 1) continue;
		if (Attack.damage[eid] <= 0) continue;

		// Skip if already has a valid target
		const ct = TargetRef.eid[eid];
		if (ct > 0 && world.runtime.alive.has(ct) && Health.current[ct] > 0) continue;

		// Skip if moving under orders
		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0 && orders[0].type === "move") continue;

		const vr = VisionRadius.value[eid] > 0 ? VisionRadius.value[eid] : Attack.range[eid];
		if (vr <= 0) continue;

		const tgt = findNearestEnemy(world, eid, vr);
		if (tgt !== -1) {
			TargetRef.eid[eid] = tgt;
			if (Faction.id[eid] === FACTION_IDS.ura) {
				world.events.push({
					type: "enemy-spotted",
					payload: { x: Position.x[tgt], y: Position.y[tgt] },
				});
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Main combat tick
// ---------------------------------------------------------------------------

export function runCombatSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	// Phase 1: Auto-aggro
	autoAggro(world);

	// Phase 2: Process attacks
	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1 || Flags.isProjectile[eid] === 1) continue;
		const damage = Attack.damage[eid];
		if (damage <= 0) continue;

		// Skip entities with an active move order
		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0 && orders[0].type === "move") continue;

		// Advance cooldown timer
		Attack.timer[eid] += deltaSec;
		if (Attack.timer[eid] < Attack.cooldown[eid]) continue;

		// Resolve target
		const range = Attack.range[eid];
		let targetEid = TargetRef.eid[eid];

		// Validate existing target
		if (targetEid > 0) {
			if (!world.runtime.alive.has(targetEid) || Health.current[targetEid] <= 0) {
				TargetRef.eid[eid] = 0;
				targetEid = 0;
			}
		}

		// Find new target if needed
		if (targetEid <= 0) {
			targetEid = findNearestEnemy(world, eid, range);
		}
		if (targetEid <= 0) continue;

		// Range check
		if (distSq(Position.x[eid], Position.y[eid], Position.x[targetEid], Position.y[targetEid]) > range * range) {
			continue;
		}

		// Fire!
		Attack.timer[eid] = 0;

		// Difficulty scaling
		let effectiveDmg = damage;
		if (Faction.id[eid] === FACTION_IDS.scale_guard && Faction.id[targetEid] === FACTION_IDS.ura) {
			effectiveDmg *= getDifficultyMod(world);
		}

		if (range <= MELEE_RANGE_THRESHOLD) {
			// Melee: direct damage with armor
			const armorVal = Armor.value[targetEid];
			const dmg = calculateDamage(effectiveDmg, armorVal);
			Health.current[targetEid] -= dmg;
			playSfx("meleeHit");

			world.events.push({ type: "melee-hit", payload: { attacker: eid, target: targetEid, damage: dmg } });

			if (Faction.id[targetEid] === FACTION_IDS.ura) {
				world.events.push({ type: "under-attack", payload: { x: Position.x[targetEid], y: Position.y[targetEid] } });
			}

			if (Health.current[targetEid] <= 0) {
				playSfx("unitDeath");
				markForRemoval(world, targetEid);
			}
		} else {
			// Ranged: spawn projectile
			const fName = Faction.id[eid] === FACTION_IDS.ura ? "ura"
				: Faction.id[eid] === FACTION_IDS.scale_guard ? "scale_guard"
				: "neutral";
			const projEid = spawnProjectile(world, {
				x: Position.x[eid],
				y: Position.y[eid],
				faction: fName,
				damage: effectiveDmg,
				targetEid,
			});

			// Mortar otters get splash radius
			const uType = world.runtime.entityTypeIndex.get(eid);
			if (uType === "mortar_otter") {
				SplashRadius.radius[projEid] = MORTAR_SPLASH_RADIUS;
			}

			playSfx("rangedFire");
			world.events.push({ type: "ranged-fire", payload: { attacker: eid, target: targetEid } });
		}
	}

	// Phase 3: Process projectiles
	processProjectiles(world, deltaSec);

	// Phase 4: Death cleanup
	processDeaths(world);
}

// ---------------------------------------------------------------------------
// Projectile system
// ---------------------------------------------------------------------------

function processProjectiles(world: GameWorld, deltaSec: number): void {
	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] !== 1) continue;

		const tgt = TargetRef.eid[eid];
		if (tgt <= 0 || !world.runtime.alive.has(tgt)) {
			markForRemoval(world, eid);
			continue;
		}

		const px = Position.x[eid];
		const py = Position.y[eid];
		const tx = Position.x[tgt];
		const ty = Position.y[tgt];
		const dx = tx - px;
		const dy = ty - py;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= HIT_RADIUS) {
			// Hit
			const projDmg = Attack.damage[eid];
			const splash = SplashRadius.radius[eid];

			if (splash > 0) {
				applyAoe(world, tx, ty, splash, projDmg, Faction.id[eid]);
			} else {
				const armorVal = Armor.value[tgt];
				const dmg = calculateDamage(projDmg, armorVal);
				Health.current[tgt] -= dmg;

				if (Faction.id[tgt] === FACTION_IDS.ura) {
					world.events.push({ type: "under-attack", payload: { x: tx, y: ty } });
				}
				if (Health.current[tgt] <= 0) {
					playSfx("unitDeath");
					markForRemoval(world, tgt);
				}
			}
			markForRemoval(world, eid);
		} else {
			const step = Math.min(PROJECTILE_SPEED * deltaSec, dist);
			const nx = dx / dist;
			const ny = dy / dist;
			Position.x[eid] = px + nx * step;
			Position.y[eid] = py + ny * step;
			Velocity.x[eid] = nx * PROJECTILE_SPEED;
			Velocity.y[eid] = ny * PROJECTILE_SPEED;
		}
	}
}

// ---------------------------------------------------------------------------
// AoE damage
// ---------------------------------------------------------------------------

function applyAoe(
	world: GameWorld,
	cx: number,
	cy: number,
	radius: number,
	damage: number,
	attackerFaction: number,
): void {
	const radiusSq = radius * radius;
	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;
		if (Health.max[eid] <= 0) continue;
		if (Faction.id[eid] === attackerFaction) continue;

		const dx = Position.x[eid] - cx;
		const dy = Position.y[eid] - cy;
		const dSqVal = dx * dx + dy * dy;
		if (dSqVal > radiusSq) continue;

		// Damage falloff: full at center, 50% at edge
		const distFrac = Math.sqrt(dSqVal) / radius;
		const falloff = 1 - distFrac * 0.5;
		const dmg = calculateDamage(damage * falloff, Armor.value[eid]);
		Health.current[eid] -= dmg;

		if (Faction.id[eid] === FACTION_IDS.ura) {
			world.events.push({ type: "under-attack", payload: { x: Position.x[eid], y: Position.y[eid] } });
		}
		if (Health.current[eid] <= 0) {
			playSfx("unitDeath");
			markForRemoval(world, eid);
		}
	}
}

// ---------------------------------------------------------------------------
// Death system
// ---------------------------------------------------------------------------

function processDeaths(world: GameWorld): void {
	const deadEids: number[] = [];

	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] === 1) continue;
		if (Health.max[eid] <= 0) continue;
		if (Health.current[eid] <= 0 && !world.runtime.removals.has(eid)) {
			deadEids.push(eid);
		}
	}

	if (deadEids.length === 0) return;

	// Clear TargetRef pointing at dead entities
	const deadSet = new Set(deadEids);
	for (const eid of world.runtime.alive) {
		if (TargetRef.eid[eid] > 0 && deadSet.has(TargetRef.eid[eid])) {
			TargetRef.eid[eid] = 0;
		}
	}

	for (const eid of deadEids) {
		// Roll loot
		const unitType = world.runtime.entityTypeIndex.get(eid);
		if (unitType && Faction.id[eid] !== FACTION_IDS.ura) {
			rollLoot(world, eid, unitType);
		}

		world.events.push({ type: "unit-died", payload: { eid, x: Position.x[eid], y: Position.y[eid] } });
		markForRemoval(world, eid);
	}
}

// ---------------------------------------------------------------------------
// Loot tables
// ---------------------------------------------------------------------------

const DEFAULT_LOOT: Record<string, Array<{ resource: "fish" | "timber" | "salvage"; chance: number; min: number; max: number }>> = {
	skink: [{ resource: "fish", chance: 0.3, min: 5, max: 10 }],
	gator: [
		{ resource: "salvage", chance: 0.5, min: 10, max: 20 },
		{ resource: "fish", chance: 0.3, min: 5, max: 15 },
	],
	viper: [{ resource: "salvage", chance: 0.4, min: 8, max: 15 }],
	scout_lizard: [{ resource: "timber", chance: 0.2, min: 5, max: 10 }],
	snapper: [{ resource: "salvage", chance: 0.6, min: 15, max: 30 }],
	croc_champion: [
		{ resource: "salvage", chance: 0.9, min: 25, max: 50 },
		{ resource: "fish", chance: 0.6, min: 15, max: 30 },
		{ resource: "timber", chance: 0.4, min: 10, max: 20 },
	],
	siphon_drone: [{ resource: "salvage", chance: 0.7, min: 10, max: 25 }],
	serpent_king: [
		{ resource: "salvage", chance: 1.0, min: 100, max: 200 },
		{ resource: "fish", chance: 1.0, min: 50, max: 100 },
		{ resource: "timber", chance: 1.0, min: 50, max: 100 },
	],
};

function rollLoot(world: GameWorld, eid: number, unitType: string): void {
	const table = world.runtime.lootTables.get(unitType) ?? DEFAULT_LOOT[unitType];
	if (!table) return;

	for (const entry of table) {
		if (Math.random() > entry.chance) continue;
		const amount = Math.floor(entry.min + Math.random() * (entry.max - entry.min + 1));
		if (amount <= 0) continue;
		world.session.resources[entry.resource] += amount;
		world.events.push({ type: "loot-collected", payload: { eid, resource: entry.resource, amount } });
	}
}

// ---------------------------------------------------------------------------
// Difficulty helper
// ---------------------------------------------------------------------------

function getDifficultyMod(world: GameWorld): number {
	switch (world.campaign.difficulty) {
		case "support": return 0.75;
		case "tactical": return 1.0;
		case "elite": return 1.25;
	}
}
