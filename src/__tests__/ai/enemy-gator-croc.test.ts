/**
 * Tests for US-066: Enemy AI — Gator and Croc Champion
 *
 * Gator: idle → patrol → alert → chase → melee attack → return to patrol
 * Croc Champion: patrol → engage → berserk below 50% HP (increased speed/damage, no flee)
 * Both use correct stat values from entity definitions.
 */

import { describe, expect, it, vi } from "vitest";
import { createDefaultAIContext, type EnemyInfo } from "@/ai/fsm/context";
import { CROC_CHAMPION_PROFILE, GATOR_PROFILE } from "@/ai/fsm/profiles";
import { FSMRunner } from "@/ai/fsm/runner";
import { STATE } from "@/ai/fsm/states";
import { SCALE_GUARD_UNITS } from "@/data/units";

function makeEnemy(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 99, x: 5, y: 5, hp: 100, isBuilding: false, ...overrides };
}

describe("US-066: Gator AI behavior", () => {
	it("uses correct stat values from entity definitions", () => {
		const gatorDef = SCALE_GUARD_UNITS.gator;
		expect(gatorDef).toBeDefined();
		expect(gatorDef.hp).toBe(120);
		expect(gatorDef.armor).toBe(4);
		expect(gatorDef.damage).toBe(18);
		expect(gatorDef.range).toBe(1); // melee
		expect(gatorDef.damageType).toBe("melee");
	});

	it("full cycle: idle → patrol → alert → chase → attack → return to patrol", () => {
		const runner = new FSMRunner(GATOR_PROFILE);
		const gatorDef = SCALE_GUARD_UNITS.gator;
		const moveTo = vi.fn();
		const attack = vi.fn();

		const ctx = createDefaultAIContext({
			hp: gatorDef.hp,
			maxHp: gatorDef.hp,
			attackDamage: gatorDef.damage,
			attackRange: gatorDef.range,
			visionRadius: 5,
			patrolWaypoints: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
			],
			requestMoveTo: moveTo,
			requestAttack: attack,
		});

		// 1. Start idle
		runner.start(ctx);
		expect(runner.state).toBe(STATE.IDLE);

		// 2. No enemies → patrol
		runner.update(ctx);
		expect(runner.state).toBe(STATE.PATROL);

		// 3. Enemy enters vision → alert
		ctx.nearestEnemy = makeEnemy({ x: 8, y: 0 });
		ctx.distanceToNearestEnemy = 4;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ALERT);

		// 4. Alert sees enemy out of melee range → chase
		runner.update(ctx);
		expect(runner.state).toBe(STATE.CHASE);
		expect(moveTo).toHaveBeenCalled();

		// 5. Close to melee range → attack
		ctx.distanceToNearestEnemy = 1;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ATTACK);
		expect(attack).toHaveBeenCalled();

		// 6. Enemy dies (disappears) → alert (no target)
		ctx.nearestEnemy = null;
		ctx.visibleEnemies = [];
		ctx.distanceToNearestEnemy = Number.POSITIVE_INFINITY;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ALERT);

		// 7. Alert timeout → return to patrol
		for (let i = 0; i < 62; i++) {
			const result = runner.state;
			runner.update(ctx);
			if (runner.state === STATE.PATROL) break;
		}
		expect(runner.state).toBe(STATE.PATROL);
	});

	it("transitions based on perception: no enemy outside vision", () => {
		const runner = new FSMRunner(GATOR_PROFILE);
		const ctx = createDefaultAIContext({
			hp: 120,
			maxHp: 120,
			attackRange: 1,
			visionRadius: 5,
			patrolWaypoints: [{ x: 5, y: 5 }],
		});
		runner.start(ctx);
		runner.update(ctx);
		expect(runner.state).toBe(STATE.PATROL);

		// Enemy outside vision → stays patrol
		ctx.nearestEnemy = null;
		ctx.distanceToNearestEnemy = Number.POSITIVE_INFINITY;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.PATROL);
	});
});

describe("US-066: Croc Champion AI behavior", () => {
	it("uses correct stat values from entity definitions", () => {
		const crocDef = SCALE_GUARD_UNITS.croc_champion;
		expect(crocDef).toBeDefined();
		expect(crocDef.hp).toBe(200);
		expect(crocDef.armor).toBe(5);
		expect(crocDef.damage).toBe(25);
		expect(crocDef.range).toBe(1);
		expect(crocDef.damageType).toBe("melee");
	});

	it("patrol → engage → berserk below 50% HP", () => {
		const runner = new FSMRunner(CROC_CHAMPION_PROFILE);
		const crocDef = SCALE_GUARD_UNITS.croc_champion;
		const moveTo = vi.fn();
		const attack = vi.fn();

		const ctx = createDefaultAIContext({
			hp: crocDef.hp,
			maxHp: crocDef.hp,
			attackDamage: crocDef.damage,
			attackRange: crocDef.range,
			visionRadius: 5,
			patrolWaypoints: [{ x: 0, y: 0 }],
			requestMoveTo: moveTo,
			requestAttack: attack,
		});

		runner.start(ctx);
		expect(runner.state).toBe(STATE.PATROL);

		// Enemy in vision → alert
		ctx.nearestEnemy = makeEnemy();
		ctx.distanceToNearestEnemy = 3;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ALERT);

		// Alert → engage
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ENGAGE);

		// Above 50% HP — stays engaged
		ctx.hp = 110; // 55%
		ctx.distanceToNearestEnemy = 1;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.ENGAGE);

		// Drop below 50% HP → berserk
		ctx.hp = 99; // 49.5%
		runner.update(ctx);
		expect(runner.state).toBe(STATE.BERSERK);
	});

	it("berserk: increased aggression, never flees even at critical HP", () => {
		const runner = new FSMRunner(CROC_CHAMPION_PROFILE);
		const attack = vi.fn();
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			hp: 200,
			maxHp: 200,
			attackRange: 1,
			requestAttack: attack,
			requestMoveTo: moveTo,
			patrolWaypoints: [{ x: 0, y: 0 }],
		});

		runner.start(ctx);

		// Force to berserk state
		ctx.nearestEnemy = makeEnemy();
		ctx.distanceToNearestEnemy = 3;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // → alert
		runner.update(ctx); // → engage
		ctx.hp = 50;
		ctx.distanceToNearestEnemy = 1;
		runner.update(ctx); // → berserk
		expect(runner.state).toBe(STATE.BERSERK);

		// At 1 HP — still berserk, still attacking
		ctx.hp = 1;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.BERSERK);
		expect(attack).toHaveBeenCalled();

		// Croc Champion profile has no FLEE state
		expect(CROC_CHAMPION_PROFILE.allowedStates).not.toContain(STATE.FLEE);
	});

	it("berserk: chases enemies when out of range", () => {
		const runner = new FSMRunner(CROC_CHAMPION_PROFILE);
		const moveTo = vi.fn();

		const ctx = createDefaultAIContext({
			hp: 200,
			maxHp: 200,
			attackRange: 1,
			requestMoveTo: moveTo,
			requestAttack: vi.fn(),
			patrolWaypoints: [{ x: 0, y: 0 }],
		});

		runner.start(ctx);
		ctx.nearestEnemy = makeEnemy({ x: 8, y: 8 });
		ctx.distanceToNearestEnemy = 3;
		ctx.visibleEnemies = [ctx.nearestEnemy];
		runner.update(ctx); // → alert
		runner.update(ctx); // → engage
		ctx.hp = 50;
		runner.update(ctx); // → berserk

		// Enemy out of melee range: berserk chases
		moveTo.mockClear();
		ctx.distanceToNearestEnemy = 5;
		runner.update(ctx);
		expect(runner.state).toBe(STATE.BERSERK);
		expect(moveTo).toHaveBeenCalledWith(8, 8);
	});
});
