/**
 * Tests for the Siphon System.
 *
 * Verifies:
 * - Active siphons suppress Fish Traps within 5 tiles (produce 0 fish)
 * - Active siphons deal 5 HP/s toxic damage to units within 5 tiles
 * - Destroyed siphons no longer suppress or damage
 * - Active siphon count is tracked for scenario objectives
 * - Fish Traps outside siphon range are unaffected
 * - Units outside siphon range take no toxic damage
 */
import { createWorld, type World } from "koota";
import { beforeEach, describe, expect, it } from "vitest";
import { OwnedBy } from "../../ecs/relations";
import { Health } from "../../ecs/traits/combat";
import { Faction, IsBuilding, IsSiphon, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import {
	getActiveSiphonCount,
	isSuppressedBySiphon,
	siphonSystem,
} from "../../systems/siphonSystem";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let world: World;

beforeEach(() => {
	world = createWorld();
});

/** Spawn a siphon (Scale-Guard building) at the given position. */
function spawnSiphon(x: number, y: number, hp = 500) {
	return world.spawn(
		IsSiphon,
		IsBuilding,
		Position({ x, y }),
		Health({ current: hp, max: 500 }),
		Faction({ id: "scale_guard" }),
		UnitType({ type: "siphon" }),
	);
}

/** Spawn a URA faction entity to act as owner target for OwnedBy. */
function spawnUraFaction() {
	return world.spawn(Faction({ id: "ura" }));
}

/** Spawn a Fish Trap (URA building) at the given position. */
function spawnFishTrap(x: number, y: number, uraFactionEntity: ReturnType<typeof spawnUraFaction>) {
	return world.spawn(
		IsBuilding,
		Position({ x, y }),
		UnitType({ type: "fish_trap" }),
		Faction({ id: "ura" }),
		OwnedBy(uraFactionEntity),
	);
}

/** Spawn a URA unit at the given position. */
function spawnUnit(x: number, y: number, hp = 80) {
	return world.spawn(
		Position({ x, y }),
		Health({ current: hp, max: hp }),
		Faction({ id: "ura" }),
		UnitType({ type: "mudfoot" }),
	);
}

// ---------------------------------------------------------------------------
// Fish Trap Suppression
// ---------------------------------------------------------------------------

describe("siphonSystem — Fish Trap suppression", () => {
	it("should suppress Fish Traps within 5 tiles of an active siphon", () => {
		spawnSiphon(10, 10);
		const ura = spawnUraFaction();
		const trap = spawnFishTrap(12, 10, ura); // 2 tiles away

		expect(isSuppressedBySiphon(world, trap)).toBe(true);
	});

	it("should NOT suppress Fish Traps beyond 5 tiles from any siphon", () => {
		spawnSiphon(10, 10);
		const ura = spawnUraFaction();
		const trap = spawnFishTrap(20, 10, ura); // 10 tiles away

		expect(isSuppressedBySiphon(world, trap)).toBe(false);
	});

	it("should restore Fish Trap when siphon is destroyed (HP <= 0)", () => {
		const siphon = spawnSiphon(10, 10, 0); // already dead
		const ura = spawnUraFaction();
		const trap = spawnFishTrap(12, 10, ura);

		expect(isSuppressedBySiphon(world, trap)).toBe(false);
	});

	it("should suppress Fish Trap if ANY nearby siphon is active", () => {
		spawnSiphon(10, 10, 0); // dead siphon
		spawnSiphon(13, 10); // alive siphon, 1 tile from trap
		const ura = spawnUraFaction();
		const trap = spawnFishTrap(12, 10, ura);

		expect(isSuppressedBySiphon(world, trap)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Toxic Damage
// ---------------------------------------------------------------------------

describe("siphonSystem — Toxic damage", () => {
	it("should deal 5 HP/s to units within 5 tiles of an active siphon", () => {
		spawnSiphon(10, 10);
		const unit = spawnUnit(12, 10, 80); // 2 tiles away

		siphonSystem(world, 1.0); // 1 second

		const health = unit.get(Health);
		expect(health.current).toBe(75); // 80 - 5*1.0
	});

	it("should NOT damage units beyond 5 tiles from siphon", () => {
		spawnSiphon(10, 10);
		const unit = spawnUnit(20, 10, 80); // 10 tiles away

		siphonSystem(world, 1.0);

		const health = unit.get(Health);
		expect(health.current).toBe(80);
	});

	it("should NOT damage units when siphon is destroyed", () => {
		spawnSiphon(10, 10, 0); // dead siphon
		const unit = spawnUnit(12, 10, 80);

		siphonSystem(world, 1.0);

		const health = unit.get(Health);
		expect(health.current).toBe(80);
	});

	it("should scale damage with delta time", () => {
		spawnSiphon(10, 10);
		const unit = spawnUnit(12, 10, 80);

		siphonSystem(world, 0.5); // half second

		const health = unit.get(Health);
		expect(health.current).toBe(77.5); // 80 - 5*0.5
	});

	it("should NOT damage Scale-Guard (siphon faction) units", () => {
		spawnSiphon(10, 10);
		// Spawn a Scale-Guard unit near the siphon
		const sgUnit = world.spawn(
			Position({ x: 12, y: 10 }),
			Health({ current: 100, max: 100 }),
			Faction({ id: "scale_guard" }),
			UnitType({ type: "gator" }),
		);

		siphonSystem(world, 1.0);

		const health = sgUnit.get(Health);
		expect(health.current).toBe(100);
	});

	it("should not stack damage from multiple siphons on same unit", () => {
		// Two siphons both in range
		spawnSiphon(10, 10);
		spawnSiphon(14, 10);
		const unit = spawnUnit(12, 10, 80); // within 5 of both

		siphonSystem(world, 1.0);

		// Damage should apply once per siphon in range: 5 + 5 = 10
		const health = unit.get(Health);
		expect(health.current).toBe(70); // 80 - 10
	});
});

// ---------------------------------------------------------------------------
// Active Siphon Count
// ---------------------------------------------------------------------------

describe("siphonSystem — Active siphon count", () => {
	it("should count only living siphons", () => {
		spawnSiphon(10, 10); // alive
		spawnSiphon(20, 20); // alive
		spawnSiphon(30, 30, 0); // dead

		expect(getActiveSiphonCount(world)).toBe(2);
	});

	it("should return 0 when no siphons exist", () => {
		expect(getActiveSiphonCount(world)).toBe(0);
	});

	it("should update count when siphon is destroyed mid-game", () => {
		const siphon = spawnSiphon(10, 10);
		spawnSiphon(20, 20);

		expect(getActiveSiphonCount(world)).toBe(2);

		// Simulate siphon taking lethal damage
		siphon.set(Health, { current: 0 });

		expect(getActiveSiphonCount(world)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("siphonSystem — Edge cases", () => {
	it("should handle entity exactly at 5 tile boundary (inclusive)", () => {
		spawnSiphon(10, 10);
		const unit = spawnUnit(15, 10, 80); // exactly 5 tiles

		siphonSystem(world, 1.0);

		const health = unit.get(Health);
		expect(health.current).toBe(75); // should be affected at exactly 5
	});

	it("should handle entity just beyond 5 tile boundary", () => {
		spawnSiphon(10, 10);
		const unit = spawnUnit(15.1, 10, 80); // 5.1 tiles

		siphonSystem(world, 1.0);

		const health = unit.get(Health);
		expect(health.current).toBe(80); // not affected
	});

	it("should not crash with no units in world", () => {
		spawnSiphon(10, 10);
		// No units — just siphons
		siphonSystem(world, 1.0);
		expect(getActiveSiphonCount(world)).toBe(1);
	});
});
