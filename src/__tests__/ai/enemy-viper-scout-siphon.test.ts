/**
 * Tests for US-067: Enemy AI — Viper, Scout Lizard, Siphon Drone
 *
 * Viper: patrol → snipe at max range → flee when enemy closes → re-engage at range
 * Scout Lizard: patrol → spot player → signal alert → flee
 * Siphon Drone: approach buildings → drain resources → retreat when threatened
 */

import { describe, expect, it, vi } from "vitest";
import { createDefaultAIContext, type EnemyInfo } from "@/ai/fsm/context";
import { SCOUT_LIZARD_PROFILE, SIPHON_DRONE_PROFILE, VIPER_PROFILE } from "@/ai/fsm/profiles";
import { FSMRunner } from "@/ai/fsm/runner";
import { STATE } from "@/ai/fsm/states";
import { SCALE_GUARD_UNITS } from "@/data/units";

function makeEnemy(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 99, x: 5, y: 5, hp: 100, isBuilding: false, ...overrides };
}

function makeBuilding(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 50, x: 10, y: 10, hp: 200, isBuilding: true, ...overrides };
}

// =========================================================================
// Viper
// =========================================================================

describe("US-067: Viper AI behavior", () => {
	it("uses correct stat values from entity definitions", () => {
		const viperDef = SCALE_GUARD_UNITS.viper;
		expect(viperDef).toBeDefined();
		expect(viperDef.hp).toBe(35);
		expect(viperDef.damage).toBe(8);
		expect(viperDef.range).toBe(5);
		expect(viperDef.damageType).toBe("ranged");
	});

	it("patrol → snipe at max range", () => {
		const runner = new FSMRunner(VIPER_PROFILE);
		const viperDef = SCALE_GUARD_UNITS.viper;
		const attack = vi.fn();
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			hp: viperDef.hp,
			maxHp: viperDef.hp,
			attackDamage: viperDef.damage,
			attackRange: viperDef.range,
			visionRadius: 7,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestAttack: attack,
			requestMoveTo: moveTo,
		});
		runner.start(ctx);

		// idle → patrol (has waypoints)
		runner.update(ctx);
		expect(runner.state).toBe(STATE.PATROL);

		// Enemy at max range → alert
		ctx.nearestEnemy = makeEnemy({ x: 5, y: 0 });
		ctx.distanceToNearestEnemy = 5;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ALERT);

		// Alert → snipe (enemy in range)
		runner.update(ctx);
		expect(runner.state).toBe(STATE.SNIPE);
		expect(attack).toHaveBeenCalled();
	});

	it("flee when enemy closes within melee distance", () => {
		const runner = new FSMRunner(VIPER_PROFILE);
		const attack = vi.fn();
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			attackRange: 5,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestAttack: attack,
			requestMoveTo: moveTo,
		});
		runner.start(ctx);
		runner.update(ctx); // → patrol

		// Enemy sighted → alert → snipe
		ctx.nearestEnemy = makeEnemy({ x: 4, y: 0 });
		ctx.distanceToNearestEnemy = 4;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // → alert
		runner.update(ctx); // → snipe

		// Enemy closes in → flee (distance <= 2)
		ctx.distanceToNearestEnemy = 1.5;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.FLEE);
		expect(moveTo).toHaveBeenCalled();
	});

	it("re-engage at range after fleeing", () => {
		const runner = new FSMRunner(VIPER_PROFILE);
		const attack = vi.fn();
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			x: 0,
			y: 0,
			attackRange: 5,
			visionRadius: 7,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestAttack: attack,
			requestMoveTo: moveTo,
		});
		runner.start(ctx);
		runner.update(ctx); // → patrol

		// Get to snipe state
		ctx.nearestEnemy = makeEnemy({ x: 4, y: 0 });
		ctx.distanceToNearestEnemy = 4;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // → alert
		runner.update(ctx); // → snipe

		// Flee when closed on
		ctx.distanceToNearestEnemy = 1;
		runner.update(ctx); // → flee
		expect(runner.state).toBe(STATE.FLEE);

		// Enemy retreats, flee ends → idle
		ctx.nearestEnemy = null;
		ctx.visibleEnemies = [];
		ctx.distanceToNearestEnemy = Number.POSITIVE_INFINITY;
		runner.update(ctx); // → idle
		expect(runner.state).toBe(STATE.IDLE);

		// Back to patrol → re-engage cycle
		runner.update(ctx); // → patrol (has waypoints)
		expect(runner.state).toBe(STATE.PATROL);

		// Enemy reappears at range → alert → snipe
		ctx.nearestEnemy = makeEnemy({ x: 5, y: 0 });
		ctx.distanceToNearestEnemy = 5;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // → alert
		expect(runner.state).toBe(STATE.ALERT);

		runner.update(ctx); // → snipe
		expect(runner.state).toBe(STATE.SNIPE);
	});
});

// =========================================================================
// Scout Lizard
// =========================================================================

describe("US-067: Scout Lizard AI behavior", () => {
	it("uses correct stat values from entity definitions", () => {
		const scoutDef = SCALE_GUARD_UNITS.scout_lizard;
		expect(scoutDef).toBeDefined();
		expect(scoutDef.hp).toBe(25);
		expect(scoutDef.speed).toBe(14);
		expect(scoutDef.damage).toBe(3);
	});

	it("patrol → spot player → signal alert → flee", () => {
		const runner = new FSMRunner(SCOUT_LIZARD_PROFILE);
		const signal = vi.fn();
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			hp: 25,
			maxHp: 25,
			visionRadius: 5,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestSignalAllies: signal,
			requestMoveTo: moveTo,
		});
		runner.start(ctx);
		expect(runner.state).toBe(STATE.PATROL);

		// 1. Enemy enters vision → alert
		ctx.nearestEnemy = makeEnemy({ x: 3, y: 0 });
		ctx.distanceToNearestEnemy = 3;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ALERT);

		// 2. Alert → spot
		runner.update(ctx);
		expect(runner.state).toBe(STATE.SPOT);

		// 3. Spot → signal
		runner.update(ctx);
		expect(runner.state).toBe(STATE.SIGNAL);
		expect(signal).toHaveBeenCalledWith(3, 0);

		// 4. Signal timeout → flee
		for (let i = 0; i < 31; i++) {
			runner.update(ctx);
		}
		expect(runner.state).toBe(STATE.FLEE);
	});

	it("Scout Lizard flees after signaling (does not fight)", () => {
		const runner = new FSMRunner(SCOUT_LIZARD_PROFILE);
		const attack = vi.fn();

		const ctx = createDefaultAIContext({
			hp: 25,
			maxHp: 25,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestSignalAllies: vi.fn(),
			requestMoveTo: vi.fn(),
			requestAttack: attack,
		});
		runner.start(ctx);

		// Get to signal state
		ctx.nearestEnemy = makeEnemy();
		ctx.distanceToNearestEnemy = 3;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // alert
		runner.update(ctx); // spot
		runner.update(ctx); // signal

		// Signal → flee
		for (let i = 0; i < 31; i++) {
			runner.update(ctx);
		}
		expect(runner.state).toBe(STATE.FLEE);

		// Scout never calls requestAttack
		expect(attack).not.toHaveBeenCalled();
	});
});

// =========================================================================
// Siphon Drone
// =========================================================================

describe("US-067: Siphon Drone AI behavior", () => {
	it("uses correct stat values from entity definitions", () => {
		const siphonDef = SCALE_GUARD_UNITS.siphon_drone;
		expect(siphonDef).toBeDefined();
		expect(siphonDef.hp).toBe(40);
		expect(siphonDef.damage).toBe(0); // Non-combat, drains resources
		expect(siphonDef.range).toBe(3);
	});

	it("approach buildings → drain resources → retreat when threatened", () => {
		const runner = new FSMRunner(SIPHON_DRONE_PROFILE);
		const moveTo = vi.fn();
		const drain = vi.fn();

		const building = makeBuilding({ x: 10, y: 10, entityId: 77 });
		const ctx = createDefaultAIContext({
			x: 0,
			y: 0,
			hp: 40,
			maxHp: 40,
			attackRange: 3,
			visibleEnemies: [building],
			requestMoveTo: moveTo,
			requestDrain: drain,
		});

		// 1. Start in approach
		runner.start(ctx);
		expect(runner.state).toBe(STATE.APPROACH);
		expect(moveTo).toHaveBeenCalledWith(10, 10);

		// 2. Move close to building → drain
		ctx.x = 10;
		ctx.y = 11;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.DRAIN);
		expect(drain).toHaveBeenCalledWith(77);

		// 3. Take damage → retreat
		ctx.hp = 15; // below 50%
		runner.update(ctx);
		expect(runner.state).toBe(STATE.RETREAT);
	});

	it("retreats and returns to approach when healed", () => {
		const runner = new FSMRunner(SIPHON_DRONE_PROFILE);
		const moveTo = vi.fn();
		const drain = vi.fn();

		const building = makeBuilding({ x: 10, y: 10, entityId: 77 });
		const ctx = createDefaultAIContext({
			x: 10,
			y: 11,
			hp: 40,
			maxHp: 40,
			attackRange: 3,
			visibleEnemies: [building],
			requestMoveTo: moveTo,
			requestDrain: drain,
		});

		runner.start(ctx);
		// approach → drain
		runner.update(ctx);
		expect(runner.state).toBe(STATE.DRAIN);

		// damage → retreat
		ctx.hp = 15;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.RETREAT);

		// heal back → approach
		ctx.hp = 35; // >= 70% of 40 = 28
		runner.update(ctx);
		expect(runner.state).toBe(STATE.APPROACH);
	});

	it("goes idle when no buildings visible", () => {
		const runner = new FSMRunner(SIPHON_DRONE_PROFILE);
		const ctx = createDefaultAIContext({
			hp: 40,
			maxHp: 40,
			attackRange: 3,
			visibleEnemies: [], // No buildings
			requestMoveTo: vi.fn(),
			requestDrain: vi.fn(),
		});

		runner.start(ctx);
		runner.update(ctx);
		expect(runner.state).toBe(STATE.IDLE);
	});
});
