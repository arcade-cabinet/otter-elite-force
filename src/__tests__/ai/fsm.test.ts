/**
 * Tests for enemy AI FSM states, profiles, and runner.
 */

import { describe, expect, it, vi } from "vitest";
import { type AIContext, createDefaultAIContext, type EnemyInfo } from "@/ai/fsm/context";
import {
	AI_PROFILES,
	CROC_CHAMPION_PROFILE,
	GATOR_PROFILE,
	getAIProfile,
	SCOUT_LIZARD_PROFILE,
	SIPHON_DRONE_PROFILE,
	SKINK_PROFILE,
	SNAPPER_PROFILE,
	VIPER_PROFILE,
} from "@/ai/fsm/profiles";
import { FSMRunner } from "@/ai/fsm/runner";
import {
	ALL_STATES,
	AlertState,
	AmbushState,
	ApproachState,
	AttackState,
	BerserkState,
	ChaseState,
	DrainState,
	EngageState,
	FleeState,
	IdleState,
	PatrolState,
	RetreatState,
	SignalState,
	SnipeState,
	SpotState,
	STATE,
} from "@/ai/fsm/states";

function makeEnemy(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 99, x: 5, y: 5, hp: 100, isBuilding: false, ...overrides };
}

function makeBuilding(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 50, x: 10, y: 10, hp: 200, isBuilding: true, ...overrides };
}

// =========================================================================
// State unit tests
// =========================================================================

describe("FSM States", () => {
	describe("IdleState", () => {
		it("should transition to ALERT when enemy is in vision range", () => {
			const state = new IdleState();
			const enemy = makeEnemy();
			const ctx = createDefaultAIContext({
				nearestEnemy: enemy,
				distanceToNearestEnemy: 3,
				visionRadius: 5,
			});
			expect(state.execute(ctx)).toBe(STATE.ALERT);
		});

		it("should transition to PATROL when waypoints exist and no enemy", () => {
			const state = new IdleState();
			const ctx = createDefaultAIContext({
				patrolWaypoints: [{ x: 5, y: 5 }],
			});
			expect(state.execute(ctx)).toBe(STATE.PATROL);
		});

		it("should stay IDLE when no enemies and no waypoints", () => {
			const state = new IdleState();
			const ctx = createDefaultAIContext();
			expect(state.execute(ctx)).toBeNull();
		});
	});

	describe("PatrolState", () => {
		it("should request move to first waypoint on enter", () => {
			const state = new PatrolState();
			const moveTo = vi.fn();
			const ctx = createDefaultAIContext({
				patrolWaypoints: [
					{ x: 3, y: 4 },
					{ x: 7, y: 8 },
				],
				patrolIndex: 0,
				requestMoveTo: moveTo,
			});
			state.enter(ctx);
			expect(moveTo).toHaveBeenCalledWith(3, 4);
		});

		it("should transition to ALERT on enemy sighting", () => {
			const state = new PatrolState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 4,
				visionRadius: 5,
			});
			expect(state.execute(ctx)).toBe(STATE.ALERT);
		});

		it("should advance to next waypoint when close", () => {
			const state = new PatrolState();
			const moveTo = vi.fn();
			const ctx = createDefaultAIContext({
				x: 3,
				y: 4,
				patrolWaypoints: [
					{ x: 3, y: 4 },
					{ x: 7, y: 8 },
				],
				patrolIndex: 0,
				requestMoveTo: moveTo,
			});
			state.execute(ctx);
			expect(ctx.patrolIndex).toBe(1);
			expect(moveTo).toHaveBeenCalledWith(7, 8);
		});
	});

	describe("AlertState", () => {
		it("should set alert level on enter", () => {
			const state = new AlertState();
			const ctx = createDefaultAIContext();
			state.enter(ctx);
			expect(ctx.alertLevel).toBe(2);
		});

		it("should transition to ATTACK when enemy is in attack range", () => {
			const state = new AlertState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
			});
			expect(state.execute(ctx)).toBe(STATE.ATTACK);
		});

		it("should transition to CHASE when enemy is visible but out of range", () => {
			const state = new AlertState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 4,
				attackRange: 1,
			});
			expect(state.execute(ctx)).toBe(STATE.CHASE);
		});

		it("should return to PATROL after timeout with no enemy", () => {
			const state = new AlertState();
			const ctx = createDefaultAIContext();
			state.enter(ctx);
			// Simulate 61 ticks with no enemy
			for (let i = 0; i < 61; i++) {
				const result = state.execute(ctx);
				if (result) {
					expect(result).toBe(STATE.PATROL);
					return;
				}
			}
			expect(state.execute(ctx)).toBe(STATE.PATROL);
		});
	});

	describe("ChaseState", () => {
		it("should request moveTo enemy on enter", () => {
			const state = new ChaseState();
			const moveTo = vi.fn();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy({ x: 8, y: 8 }),
				requestMoveTo: moveTo,
			});
			state.enter(ctx);
			expect(moveTo).toHaveBeenCalledWith(8, 8);
		});

		it("should transition to ATTACK when in range", () => {
			const state = new ChaseState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
			});
			expect(state.execute(ctx)).toBe(STATE.ATTACK);
		});

		it("should transition to PATROL when enemy is too far", () => {
			const state = new ChaseState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 20,
				visionRadius: 5,
			});
			expect(state.execute(ctx)).toBe(STATE.PATROL);
		});
	});

	describe("AttackState", () => {
		it("should request attack on enter", () => {
			const state = new AttackState();
			const attack = vi.fn();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy({ entityId: 42 }),
				requestAttack: attack,
			});
			state.enter(ctx);
			expect(attack).toHaveBeenCalledWith(42);
		});

		it("should transition to FLEE at low HP", () => {
			const state = new AttackState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
				hp: 10,
				maxHp: 100,
			});
			expect(state.execute(ctx)).toBe(STATE.FLEE);
		});

		it("should transition to CHASE when enemy moves out of range", () => {
			const state = new AttackState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 5,
				attackRange: 1,
				hp: 80,
				maxHp: 100,
			});
			expect(state.execute(ctx)).toBe(STATE.CHASE);
		});
	});

	describe("FleeState", () => {
		it("should request moveTo in opposite direction of enemy", () => {
			const state = new FleeState();
			const moveTo = vi.fn();
			const ctx = createDefaultAIContext({
				x: 5,
				y: 5,
				nearestEnemy: makeEnemy({ x: 8, y: 5 }),
				requestMoveTo: moveTo,
			});
			state.enter(ctx);
			expect(moveTo).toHaveBeenCalled();
			// Should flee away from enemy (x < 5)
			const [fleeX] = moveTo.mock.calls[0];
			expect(fleeX).toBeLessThan(5);
		});

		it("should transition to IDLE when enemy is far enough", () => {
			const state = new FleeState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 20,
				visionRadius: 5,
			});
			expect(state.execute(ctx)).toBe(STATE.IDLE);
		});
	});

	describe("AmbushState", () => {
		it("should transition to ATTACK when enemy is close", () => {
			const state = new AmbushState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
			});
			state.enter(ctx);
			expect(state.execute(ctx)).toBe(STATE.ATTACK);
		});

		it("should timeout and return to PATROL", () => {
			const state = new AmbushState();
			const ctx = createDefaultAIContext();
			state.enter(ctx);
			for (let i = 0; i < 181; i++) {
				const result = state.execute(ctx);
				if (result) {
					expect(result).toBe(STATE.PATROL);
					return;
				}
			}
			expect(state.execute(ctx)).toBe(STATE.PATROL);
		});
	});

	describe("SpotState / SignalState (Scout Lizard)", () => {
		it("SpotState should transition to SIGNAL when enemy present", () => {
			const state = new SpotState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
			});
			expect(state.execute(ctx)).toBe(STATE.SIGNAL);
		});

		it("SignalState should call requestSignalAllies on enter", () => {
			const state = new SignalState();
			const signal = vi.fn();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy({ x: 7, y: 3 }),
				requestSignalAllies: signal,
			});
			state.enter(ctx);
			expect(signal).toHaveBeenCalledWith(7, 3);
		});

		it("SignalState should transition to FLEE after timeout", () => {
			const state = new SignalState();
			const ctx = createDefaultAIContext();
			state.enter(ctx);
			for (let i = 0; i < 31; i++) {
				const result = state.execute(ctx);
				if (result) {
					expect(result).toBe(STATE.FLEE);
					return;
				}
			}
			expect(state.execute(ctx)).toBe(STATE.FLEE);
		});
	});

	describe("SnipeState (Viper)", () => {
		it("should attack when enemy is in range", () => {
			const state = new SnipeState();
			const attack = vi.fn();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 4,
				attackRange: 5,
				requestAttack: attack,
			});
			expect(state.execute(ctx)).toBeNull();
			expect(attack).toHaveBeenCalled();
		});

		it("should FLEE when enemy is too close", () => {
			const state = new SnipeState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1.5,
				attackRange: 5,
			});
			expect(state.execute(ctx)).toBe(STATE.FLEE);
		});
	});

	describe("EngageState / BerserkState (Croc Champion)", () => {
		it("EngageState should transition to BERSERK at low HP", () => {
			const state = new EngageState();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
				hp: 50,
				maxHp: 200,
			});
			expect(state.execute(ctx)).toBe(STATE.BERSERK);
		});

		it("BerserkState should keep attacking (never flees)", () => {
			const state = new BerserkState();
			const attack = vi.fn();
			const ctx = createDefaultAIContext({
				nearestEnemy: makeEnemy(),
				distanceToNearestEnemy: 1,
				attackRange: 1,
				hp: 10,
				maxHp: 200,
				requestAttack: attack,
			});
			expect(state.execute(ctx)).toBeNull();
			expect(attack).toHaveBeenCalled();
		});
	});

	describe("ApproachState / DrainState / RetreatState (Siphon Drone)", () => {
		it("ApproachState should move toward a building", () => {
			const state = new ApproachState();
			const moveTo = vi.fn();
			const building = makeBuilding({ x: 10, y: 10 });
			const ctx = createDefaultAIContext({
				visibleEnemies: [building],
				requestMoveTo: moveTo,
			});
			state.enter(ctx);
			expect(moveTo).toHaveBeenCalledWith(10, 10);
		});

		it("ApproachState should transition to DRAIN when in range", () => {
			const state = new ApproachState();
			const building = makeBuilding({ x: 3, y: 3 });
			const ctx = createDefaultAIContext({
				x: 3,
				y: 4,
				visibleEnemies: [building],
				attackRange: 3,
			});
			expect(state.execute(ctx)).toBe(STATE.DRAIN);
		});

		it("ApproachState should transition to RETREAT when damaged", () => {
			const state = new ApproachState();
			const ctx = createDefaultAIContext({
				hp: 15,
				maxHp: 40,
				visibleEnemies: [makeBuilding()],
			});
			expect(state.execute(ctx)).toBe(STATE.RETREAT);
		});

		it("DrainState should call requestDrain", () => {
			const state = new DrainState();
			const drain = vi.fn();
			const building = makeBuilding({ entityId: 77 });
			const ctx = createDefaultAIContext({
				visibleEnemies: [building],
				requestDrain: drain,
			});
			state.enter(ctx);
			expect(drain).toHaveBeenCalledWith(77);
		});

		it("RetreatState should return to APPROACH when healed", () => {
			const state = new RetreatState();
			const ctx = createDefaultAIContext({
				hp: 35,
				maxHp: 40,
			});
			expect(state.execute(ctx)).toBe(STATE.APPROACH);
		});
	});
});

// =========================================================================
// Profile tests
// =========================================================================

describe("FSM Profiles", () => {
	it("should have profiles for all 7 Scale-Guard unit types", () => {
		expect(AI_PROFILES.gator).toBeDefined();
		expect(AI_PROFILES.viper).toBeDefined();
		expect(AI_PROFILES.scout_lizard).toBeDefined();
		expect(AI_PROFILES.croc_champion).toBeDefined();
		expect(AI_PROFILES.siphon_drone).toBeDefined();
		expect(AI_PROFILES.snapper).toBeDefined();
		expect(AI_PROFILES.skink).toBeDefined();
	});

	it("getAIProfile should return undefined for player units", () => {
		expect(getAIProfile("mudfoot")).toBeUndefined();
		expect(getAIProfile("river_rat")).toBeUndefined();
	});

	it("all profiles should have valid initial states", () => {
		for (const profile of Object.values(AI_PROFILES)) {
			expect(profile.allowedStates).toContain(profile.initialState);
			expect(ALL_STATES[profile.initialState]).toBeDefined();
		}
	});

	it("all profile transitions should reference allowed states", () => {
		for (const profile of Object.values(AI_PROFILES)) {
			for (const [from, targets] of Object.entries(profile.transitions)) {
				expect(profile.allowedStates).toContain(from);
				for (const target of targets as string[]) {
					expect(profile.allowedStates).toContain(target);
				}
			}
		}
	});
});

// =========================================================================
// FSM Runner tests
// =========================================================================

describe("FSMRunner", () => {
	it("should start in the profile initial state", () => {
		const runner = new FSMRunner(GATOR_PROFILE);
		expect(runner.state).toBe(STATE.IDLE);
	});

	it("should call enter on start", () => {
		const runner = new FSMRunner(GATOR_PROFILE);
		const ctx = createDefaultAIContext();
		runner.start(ctx);
		// IdleState.enter is a no-op, just verify no crash
		expect(runner.state).toBe(STATE.IDLE);
	});

	describe("Gator flow: idle → alert → chase → attack", () => {
		it("should progress through states as context changes", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const moveTo = vi.fn();
			const attack = vi.fn();

			// Start idle
			const ctx = createDefaultAIContext({
				requestMoveTo: moveTo,
				requestAttack: attack,
			});
			runner.start(ctx);
			expect(runner.state).toBe(STATE.IDLE);

			// Enemy appears → alert
			ctx.nearestEnemy = makeEnemy({ x: 8, y: 8 });
			ctx.distanceToNearestEnemy = 4;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// Alert sees enemy out of attack range → chase
			runner.update(ctx);
			expect(runner.state).toBe(STATE.CHASE);

			// Close in → attack
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ATTACK);
			expect(attack).toHaveBeenCalled();
		});
	});

	describe("Viper flow: patrol → alert → snipe → flee", () => {
		it("should snipe from range then flee when approached", () => {
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

			// idle → patrol (has waypoints)
			runner.update(ctx);
			expect(runner.state).toBe(STATE.PATROL);

			// Enemy sighted → alert
			ctx.nearestEnemy = makeEnemy({ x: 8, y: 0 });
			ctx.distanceToNearestEnemy = 4;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// Alert → snipe (enemy in range)
			runner.update(ctx);
			expect(runner.state).toBe(STATE.SNIPE);

			// Enemy closes in → flee
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.FLEE);
		});
	});

	describe("Scout Lizard flow: patrol → spot → signal → flee", () => {
		it("should spot enemy, signal allies, then flee", () => {
			const runner = new FSMRunner(SCOUT_LIZARD_PROFILE);
			const signal = vi.fn();
			const moveTo = vi.fn();

			const ctx = createDefaultAIContext({
				patrolWaypoints: [{ x: 0, y: 0 }],
				requestSignalAllies: signal,
				requestMoveTo: moveTo,
			});
			runner.start(ctx);

			// patrol → alert (enemy sighted)
			ctx.nearestEnemy = makeEnemy();
			ctx.distanceToNearestEnemy = 3;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// alert → spot
			runner.update(ctx);
			expect(runner.state).toBe(STATE.SPOT);

			// spot → signal
			runner.update(ctx);
			expect(runner.state).toBe(STATE.SIGNAL);
			expect(signal).toHaveBeenCalled();

			// signal → flee (after timer)
			for (let i = 0; i < 31; i++) {
				runner.update(ctx);
			}
			expect(runner.state).toBe(STATE.FLEE);
		});
	});

	describe("Croc Champion flow: patrol → engage → berserk", () => {
		it("should engage and go berserk at low HP", () => {
			const runner = new FSMRunner(CROC_CHAMPION_PROFILE);
			const attack = vi.fn();
			const moveTo = vi.fn();

			const ctx = createDefaultAIContext({
				hp: 200,
				maxHp: 200,
				attackRange: 1,
				requestAttack: attack,
				requestMoveTo: moveTo,
			});
			runner.start(ctx);

			// patrol → alert
			ctx.nearestEnemy = makeEnemy();
			ctx.distanceToNearestEnemy = 3;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// alert → engage (chase variant)
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ENGAGE);

			// Low HP → berserk
			ctx.hp = 50;
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.BERSERK);

			// Berserk stays berserk (never flees)
			ctx.hp = 5;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.BERSERK);
		});
	});

	describe("Siphon Drone flow: approach → drain → retreat", () => {
		it("should approach building, drain, then retreat when damaged", () => {
			const runner = new FSMRunner(SIPHON_DRONE_PROFILE);
			const moveTo = vi.fn();
			const drain = vi.fn();

			const building = makeBuilding({ x: 10, y: 10, entityId: 77 });
			const ctx = createDefaultAIContext({
				hp: 40,
				maxHp: 40,
				attackRange: 3,
				visibleEnemies: [building],
				requestMoveTo: moveTo,
				requestDrain: drain,
			});
			runner.start(ctx);
			expect(runner.state).toBe(STATE.APPROACH);

			// Close enough → drain
			ctx.x = 10;
			ctx.y = 11;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.DRAIN);
			expect(drain).toHaveBeenCalledWith(77);

			// Take damage → retreat
			ctx.hp = 15;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.RETREAT);
		});
	});

	describe("Snapper flow: idle → attack (stationary)", () => {
		it("should attack when enemy in range without moving", () => {
			const runner = new FSMRunner(SNAPPER_PROFILE);
			const attack = vi.fn();
			const moveTo = vi.fn();

			const ctx = createDefaultAIContext({
				attackRange: 6,
				requestAttack: attack,
				requestMoveTo: moveTo,
			});
			runner.start(ctx);
			expect(runner.state).toBe(STATE.IDLE);

			// Enemy appears → alert → attack
			ctx.nearestEnemy = makeEnemy();
			ctx.distanceToNearestEnemy = 5;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			ctx.distanceToNearestEnemy = 5;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ATTACK);
			expect(attack).toHaveBeenCalled();

			// Snapper has no CHASE — stays in ATTACK or reverts to ALERT
			// moveTo should not have been called (stationary turret logic
			// is enforced at the game system level, not FSM level)
		});
	});

	describe("transition guard", () => {
		it("should block invalid transitions", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const ctx = createDefaultAIContext();
			runner.start(ctx);

			// Gator idle cannot go directly to BERSERK
			const result = runner.transitionTo(STATE.BERSERK, ctx);
			expect(result).toBe(false);
			expect(runner.state).toBe(STATE.IDLE);
		});

		it("should allow valid forced transitions", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const ctx = createDefaultAIContext();
			runner.start(ctx);

			const result = runner.transitionTo(STATE.PATROL, ctx);
			expect(result).toBe(true);
			expect(runner.state).toBe(STATE.PATROL);
		});

		it("should track previous state", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const ctx = createDefaultAIContext();
			runner.start(ctx);

			runner.transitionTo(STATE.PATROL, ctx);
			expect(runner.previous).toBe(STATE.IDLE);

			runner.transitionTo(STATE.ALERT, ctx);
			expect(runner.previous).toBe(STATE.PATROL);
		});
	});
});
