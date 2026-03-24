/**
 * Siphon System — Scale-Guard area denial structures.
 *
 * Active siphons (HP > 0) project a 5-tile radius effect:
 * 1. **Fish Trap Suppression**: URA Fish Traps within range produce 0 fish.
 *    Exposed via `isSuppressedBySiphon()` for the economy system to check.
 * 2. **Toxic Damage**: Non-Scale-Guard units within range take 5 HP/s.
 * 3. **Siphon Count**: `getActiveSiphonCount()` for scenario objective tracking.
 *
 * When a siphon is destroyed (HP <= 0), its area effects cease immediately —
 * Fish Traps resume production and toxic damage stops.
 *
 * Spec reference: §8.4 Environmental Hazards, CLAUDE.md coordinates of interest
 */

import type { World, Entity } from "koota";
import { Health } from "../ecs/traits/combat";
import { Faction, IsSiphon } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";

/** Siphon area-of-effect radius in tiles. */
const SIPHON_RADIUS = 5;

/** Toxic damage per second to non-allied units in siphon range. */
const TOXIC_DPS = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get all active (alive) siphon entities.
 */
function getActiveSiphons(world: World): Entity[] {
	const siphons = world.query(IsSiphon, Position, Health);
	const active: Entity[] = [];
	for (const siphon of siphons) {
		const health = siphon.get(Health);
		if (health.current > 0) {
			active.push(siphon);
		}
	}
	return active;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a Fish Trap entity is suppressed by any active siphon within range.
 * Called by the economy system to skip fish income for suppressed traps.
 */
export function isSuppressedBySiphon(world: World, fishTrap: Entity): boolean {
	if (!fishTrap.has(Position)) return false;

	const trapPos = fishTrap.get(Position);
	const activeSiphons = getActiveSiphons(world);

	for (const siphon of activeSiphons) {
		const siphonPos = siphon.get(Position);
		const dist = distanceBetween(trapPos.x, trapPos.y, siphonPos.x, siphonPos.y);
		if (dist <= SIPHON_RADIUS) {
			return true;
		}
	}

	return false;
}

/**
 * Count the number of active (alive) siphons in the world.
 * Used by scenario objectives (e.g., "Destroy all siphons").
 */
export function getActiveSiphonCount(world: World): number {
	return getActiveSiphons(world).length;
}

/**
 * Main siphon system tick.
 *
 * Applies toxic damage to non-Scale-Guard units within range of active siphons.
 * Fish Trap suppression is handled lazily via `isSuppressedBySiphon()`.
 */
export function siphonSystem(world: World, delta: number): void {
	const activeSiphons = getActiveSiphons(world);
	if (activeSiphons.length === 0) return;

	// Find all damageable units (have Health, Position, Faction)
	const units = world.query(Health, Position, Faction);

	for (const unit of units) {
		// Skip siphon entities themselves
		if (unit.has(IsSiphon)) continue;

		// Skip Scale-Guard units — siphons don't damage their own faction
		const faction = unit.get(Faction);
		if (faction.id === "scale_guard") continue;

		const unitPos = unit.get(Position);

		// Accumulate damage from all siphons in range
		let siphonsInRange = 0;
		for (const siphon of activeSiphons) {
			const siphonPos = siphon.get(Position);
			const dist = distanceBetween(unitPos.x, unitPos.y, siphonPos.x, siphonPos.y);
			if (dist <= SIPHON_RADIUS) {
				siphonsInRange++;
			}
		}

		if (siphonsInRange > 0) {
			const totalDamage = TOXIC_DPS * siphonsInRange * delta;
			unit.set(Health, (prev) => ({ current: prev.current - totalDamage }));
		}
	}
}
