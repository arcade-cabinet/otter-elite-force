/**
 * Ability System -- Composable behaviors attached to entities.
 *
 * Abilities are NOT hardcoded per unit type. Any entity can have any ability.
 * Active abilities are triggered via the ability queue; passive abilities
 * apply their effects automatically each tick.
 *
 * Pure function on GameWorld.
 */

import { Attack, Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Ability definition interface
// ---------------------------------------------------------------------------

export interface AbilityDef {
	id: string;
	name: string;
	type: "active" | "passive";
	cooldownMs: number;
	cost?: { resource: "fish" | "timber" | "salvage"; amount: number };
	range?: number;
	execute: (
		world: GameWorld,
		casterEid: number,
		targetEid?: number,
		targetX?: number,
		targetY?: number,
	) => void;
}

// ---------------------------------------------------------------------------
// Ability configuration constants
// ---------------------------------------------------------------------------

export const ABILITY_CONFIG = {
	heal: {
		amount: 20,
		cooldownMs: 5000,
		range: 48,
	},
	demolition_charge: {
		damage: 200,
		fuseMs: 3000,
		cooldownMs: 15000,
	},
	underwater_strike: {
		damageMultiplier: 2.0,
		cooldownMs: 10000,
	},
	shield_bash: {
		stunDurationMs: 1000,
		cooldownMs: 10000,
	},
	snipe: {
		damageMultiplier: 3.0,
		cooldownMs: 15000,
	},
	rally_cry: {
		damageBoost: 0.2,
		durationMs: 10000,
		range: 96,
		cooldownMs: 30000,
	},
} as const;

// ---------------------------------------------------------------------------
// Ability definitions
// ---------------------------------------------------------------------------

function distSq(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return dx * dx + dy * dy;
}

const gatherAbility: AbilityDef = {
	id: "gather",
	name: "Gather",
	type: "passive",
	cooldownMs: 0,
	execute(_world, _casterEid) {
		// Gathering is handled by economySystem; this is a registration placeholder.
	},
};

const buildAbility: AbilityDef = {
	id: "build",
	name: "Build",
	type: "passive",
	cooldownMs: 0,
	execute(_world, _casterEid) {
		// Building is handled by buildingSystem; this is a registration placeholder.
	},
};

const swimAbility: AbilityDef = {
	id: "swim",
	name: "Swim",
	type: "passive",
	cooldownMs: 0,
	execute(_world, casterEid) {
		Flags.canSwim[casterEid] = 1;
	},
};

const stealthAbility: AbilityDef = {
	id: "stealth",
	name: "Stealth",
	type: "passive",
	cooldownMs: 0,
	execute(_world, casterEid) {
		// Entity is invisible when stationary in forest.
		// Stealth application is checked in the main system tick;
		// the actual flag is managed by stealthSystem.
		if (Speed.value[casterEid] === 0) {
			Flags.stealthed[casterEid] = 1;
		}
	},
};

const demolitionChargeAbility: AbilityDef = {
	id: "demolition_charge",
	name: "Demolition Charge",
	type: "active",
	cooldownMs: ABILITY_CONFIG.demolition_charge.cooldownMs,
	execute(world, casterEid, targetEid, targetX, targetY) {
		// Place explosive on a building. 200 damage after 3s fuse.
		const x = targetX ?? (targetEid !== undefined ? Position.x[targetEid] : Position.x[casterEid]);
		const y = targetY ?? (targetEid !== undefined ? Position.y[targetEid] : Position.y[casterEid]);

		world.runtime.activeEffects.push({
			type: "demolition_charge_fuse",
			casterEid,
			targetEid,
			x,
			y,
			remainingMs: ABILITY_CONFIG.demolition_charge.fuseMs,
			payload: { damage: ABILITY_CONFIG.demolition_charge.damage },
		});

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "demolition_charge", casterEid, x, y },
		});
	},
};

const underwaterStrikeAbility: AbilityDef = {
	id: "underwater_strike",
	name: "Underwater Strike",
	type: "active",
	cooldownMs: ABILITY_CONFIG.underwater_strike.cooldownMs,
	execute(world, casterEid, targetEid) {
		if (targetEid === undefined) return;
		if (!world.runtime.alive.has(targetEid)) return;

		const baseDmg = Attack.damage[casterEid];
		const bonusDmg = baseDmg * ABILITY_CONFIG.underwater_strike.damageMultiplier;
		Health.current[targetEid] -= bonusDmg;

		// Breaks stealth
		Flags.stealthed[casterEid] = 0;
		Flags.submerged[casterEid] = 0;

		if (Health.current[targetEid] <= 0) {
			markForRemoval(world, targetEid);
		}

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "underwater_strike", casterEid, targetEid, damage: bonusDmg },
		});
	},
};

const healAbility: AbilityDef = {
	id: "heal",
	name: "Heal",
	type: "active",
	cooldownMs: ABILITY_CONFIG.heal.cooldownMs,
	range: ABILITY_CONFIG.heal.range,
	execute(world, casterEid, targetEid) {
		// Heal the target (or nearest wounded ally within range)
		let healTarget = targetEid;

		if (healTarget === undefined || !world.runtime.alive.has(healTarget)) {
			// Auto-target: find nearest wounded ally within range
			healTarget = findNearestWoundedAlly(world, casterEid, ABILITY_CONFIG.heal.range);
		}

		if (healTarget === undefined || healTarget < 0) return;
		if (!world.runtime.alive.has(healTarget)) return;

		const healAmount = Math.min(
			ABILITY_CONFIG.heal.amount,
			Health.max[healTarget] - Health.current[healTarget],
		);
		if (healAmount <= 0) return;

		Health.current[healTarget] += healAmount;

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "heal", casterEid, targetEid: healTarget, healAmount },
		});
	},
};

const shieldBashAbility: AbilityDef = {
	id: "shield_bash",
	name: "Shield Bash",
	type: "active",
	cooldownMs: ABILITY_CONFIG.shield_bash.cooldownMs,
	execute(world, casterEid, targetEid) {
		if (targetEid === undefined) return;
		if (!world.runtime.alive.has(targetEid)) return;

		// Stun the target: apply a timed effect that prevents actions
		world.runtime.activeEffects.push({
			type: "stun",
			casterEid,
			targetEid,
			remainingMs: ABILITY_CONFIG.shield_bash.stunDurationMs,
		});

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "shield_bash", casterEid, targetEid },
		});
	},
};

const snipeAbility: AbilityDef = {
	id: "snipe",
	name: "Snipe",
	type: "active",
	cooldownMs: ABILITY_CONFIG.snipe.cooldownMs,
	execute(world, casterEid, targetEid) {
		if (targetEid === undefined) return;
		if (!world.runtime.alive.has(targetEid)) return;

		const baseDmg = Attack.damage[casterEid];
		const snipeDmg = baseDmg * ABILITY_CONFIG.snipe.damageMultiplier;
		Health.current[targetEid] -= snipeDmg;

		if (Health.current[targetEid] <= 0) {
			markForRemoval(world, targetEid);
		}

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "snipe", casterEid, targetEid, damage: snipeDmg },
		});
	},
};

const rallyCryAbility: AbilityDef = {
	id: "rally_cry",
	name: "Rally Cry",
	type: "active",
	cooldownMs: ABILITY_CONFIG.rally_cry.cooldownMs,
	execute(world, casterEid) {
		const cx = Position.x[casterEid];
		const cy = Position.y[casterEid];
		const myFaction = Faction.id[casterEid];
		const rangeSq = ABILITY_CONFIG.rally_cry.range * ABILITY_CONFIG.rally_cry.range;

		// Find all nearby allies and apply damage buff
		const boostedEids: number[] = [];
		for (const eid of world.runtime.alive) {
			if (eid === casterEid) continue;
			if (Faction.id[eid] !== myFaction) continue;
			if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;
			if (Flags.isBuilding[eid] === 1) continue;

			if (distSq(cx, cy, Position.x[eid], Position.y[eid]) <= rangeSq) {
				boostedEids.push(eid);
			}
		}

		// Apply damage boost as a timed effect
		for (const eid of boostedEids) {
			world.runtime.activeEffects.push({
				type: "rally_cry_buff",
				casterEid,
				targetEid: eid,
				remainingMs: ABILITY_CONFIG.rally_cry.durationMs,
				payload: {
					damageBoost: ABILITY_CONFIG.rally_cry.damageBoost,
					baseDamage: Attack.damage[eid],
				},
			});
			// Apply boost immediately
			Attack.damage[eid] *= 1 + ABILITY_CONFIG.rally_cry.damageBoost;
		}

		world.events.push({
			type: "ability-used",
			payload: { abilityId: "rally_cry", casterEid, boostedCount: boostedEids.length },
		});
	},
};

// ---------------------------------------------------------------------------
// Ability registry
// ---------------------------------------------------------------------------

export const ABILITY_REGISTRY: Map<string, AbilityDef> = new Map([
	[gatherAbility.id, gatherAbility],
	[buildAbility.id, buildAbility],
	[swimAbility.id, swimAbility],
	[stealthAbility.id, stealthAbility],
	[demolitionChargeAbility.id, demolitionChargeAbility],
	[underwaterStrikeAbility.id, underwaterStrikeAbility],
	[healAbility.id, healAbility],
	[shieldBashAbility.id, shieldBashAbility],
	[snipeAbility.id, snipeAbility],
	[rallyCryAbility.id, rallyCryAbility],
]);

/**
 * Look up an ability definition by ID.
 * Throws if the ID is not found.
 */
export function getAbilityDef(id: string): AbilityDef {
	const def = ABILITY_REGISTRY.get(id);
	if (!def) {
		throw new Error(
			`getAbilityDef: unknown ability ID '${id}'. ` +
				`Available: ${[...ABILITY_REGISTRY.keys()].join(", ")}`,
		);
	}
	return def;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findNearestWoundedAlly(world: GameWorld, eid: number, range: number): number {
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const myFaction = Faction.id[eid];
	const rangeSq = range * range;

	let bestEid = -1;
	let bestDistSq = Number.POSITIVE_INFINITY;

	for (const cid of world.runtime.alive) {
		if (cid === eid) continue;
		if (Faction.id[cid] !== myFaction) continue;
		if (Flags.isProjectile[cid] === 1 || Flags.isResource[cid] === 1) continue;
		if (Health.current[cid] >= Health.max[cid]) continue; // not wounded
		if (Health.current[cid] <= 0) continue; // dead

		const dSq = distSq(ax, ay, Position.x[cid], Position.y[cid]);
		if (dSq <= rangeSq && dSq < bestDistSq) {
			bestDistSq = dSq;
			bestEid = cid;
		}
	}

	return bestEid;
}

/**
 * Grant an ability to an entity.
 */
export function grantAbility(world: GameWorld, eid: number, abilityId: string): void {
	let abilities = world.runtime.entityAbilities.get(eid);
	if (!abilities) {
		abilities = [];
		world.runtime.entityAbilities.set(eid, abilities);
	}
	if (!abilities.includes(abilityId)) {
		abilities.push(abilityId);
	}
}

/**
 * Check if an entity has a specific ability.
 */
export function hasAbility(world: GameWorld, eid: number, abilityId: string): boolean {
	const abilities = world.runtime.entityAbilities.get(eid);
	return abilities ? abilities.includes(abilityId) : false;
}

/**
 * Get remaining cooldown for an entity's ability (in ms).
 * Returns 0 if ready.
 */
export function getAbilityCooldown(world: GameWorld, eid: number, abilityId: string): number {
	const cooldowns = world.runtime.abilityCooldowns.get(eid);
	if (!cooldowns) return 0;
	return cooldowns.get(abilityId) ?? 0;
}

/**
 * Queue an ability activation for this tick.
 */
export function queueAbility(
	world: GameWorld,
	casterEid: number,
	abilityId: string,
	targetEid?: number,
	targetX?: number,
	targetY?: number,
): void {
	world.runtime.abilityQueue.push({ casterEid, abilityId, targetEid, targetX, targetY });
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the ability system.
 * Processes queued ability activations and ticks down cooldowns/effects.
 */
export function runAbilitySystem(world: GameWorld): void {
	const deltaMs = world.time.deltaMs;
	if (deltaMs <= 0) return;

	// Phase 1: Tick active effects (before queue so new effects this tick aren't immediately decremented)
	processActiveEffects(world, deltaMs);

	// Phase 2: Tick down cooldowns
	for (const [eid, cooldowns] of world.runtime.abilityCooldowns) {
		for (const [abilityId, remaining] of cooldowns) {
			const newRemaining = remaining - deltaMs;
			if (newRemaining <= 0) {
				cooldowns.delete(abilityId);
			} else {
				cooldowns.set(abilityId, newRemaining);
			}
		}
		if (cooldowns.size === 0) {
			world.runtime.abilityCooldowns.delete(eid);
		}
	}

	// Phase 3: Process ability activations from queue
	const queue = world.runtime.abilityQueue.splice(0);
	for (const activation of queue) {
		const { casterEid, abilityId, targetEid, targetX, targetY } = activation;

		// Validate caster is alive
		if (!world.runtime.alive.has(casterEid)) continue;

		// Validate entity has this ability
		if (!hasAbility(world, casterEid, abilityId)) continue;

		// Look up ability def
		const def = ABILITY_REGISTRY.get(abilityId);
		if (!def) continue;

		// Skip passive abilities (they don't activate via queue)
		if (def.type === "passive") continue;

		// Check cooldown
		if (getAbilityCooldown(world, casterEid, abilityId) > 0) continue;

		// Check stun (stunned entities can't use abilities)
		const isStunned = world.runtime.activeEffects.some(
			(e) => e.type === "stun" && e.targetEid === casterEid && e.remainingMs > 0,
		);
		if (isStunned) continue;

		// Check resource cost
		if (def.cost) {
			const available = world.session.resources[def.cost.resource];
			if (available < def.cost.amount) continue;
			world.session.resources[def.cost.resource] -= def.cost.amount;
		}

		// Execute
		def.execute(world, casterEid, targetEid, targetX, targetY);

		// Start cooldown
		if (def.cooldownMs > 0) {
			let cooldowns = world.runtime.abilityCooldowns.get(casterEid);
			if (!cooldowns) {
				cooldowns = new Map();
				world.runtime.abilityCooldowns.set(casterEid, cooldowns);
			}
			cooldowns.set(abilityId, def.cooldownMs);
		}
	}
}

// ---------------------------------------------------------------------------
// Active effects processing
// ---------------------------------------------------------------------------

function processActiveEffects(world: GameWorld, deltaMs: number): void {
	const effects = world.runtime.activeEffects;
	let i = 0;

	while (i < effects.length) {
		const effect = effects[i];
		effect.remainingMs -= deltaMs;

		if (effect.remainingMs <= 0) {
			// Effect expired -- handle expiration
			handleEffectExpiry(world, effect);
			// Remove by swapping with last
			effects[i] = effects[effects.length - 1];
			effects.pop();
			// Don't increment i -- re-check swapped element
		} else {
			i++;
		}
	}
}

function handleEffectExpiry(
	world: GameWorld,
	effect: {
		type: string;
		casterEid: number;
		targetEid?: number;
		x?: number;
		y?: number;
		remainingMs: number;
		payload?: Record<string, unknown>;
	},
): void {
	switch (effect.type) {
		case "demolition_charge_fuse": {
			// Explosion! Apply damage at the charge location
			const damage = (effect.payload?.damage as number) ?? ABILITY_CONFIG.demolition_charge.damage;
			const cx = effect.x ?? 0;
			const cy = effect.y ?? 0;

			// Direct damage to target building if specified
			if (effect.targetEid !== undefined && world.runtime.alive.has(effect.targetEid)) {
				Health.current[effect.targetEid] -= damage;
				if (Health.current[effect.targetEid] <= 0) {
					markForRemoval(world, effect.targetEid);
				}
			}

			world.events.push({
				type: "explosion",
				payload: { x: cx, y: cy, damage, source: "demolition_charge" },
			});
			break;
		}

		case "rally_cry_buff": {
			// Remove damage boost
			if (effect.targetEid !== undefined && world.runtime.alive.has(effect.targetEid)) {
				const baseDamage = effect.payload?.baseDamage as number;
				if (baseDamage !== undefined) {
					Attack.damage[effect.targetEid] = baseDamage;
				}
			}
			break;
		}

		case "stun": {
			// Stun expired -- nothing to clean up
			world.events.push({
				type: "stun-expired",
				payload: { targetEid: effect.targetEid },
			});
			break;
		}
	}
}
