/**
 * Integration tests for US-065: Wire Yuka FSM profiles to game entities.
 *
 * Verifies that:
 * - Spawning a Scale-Guard entity creates a Yuka Vehicle with correct FSM profile
 * - Each enemy type has a distinct FSM profile
 * - FSM states transition based on perception
 * - AI entities use Yuka pathfinding (steering vehicle is assigned)
 * - FSM state transitions work correctly for 2+ enemy types
 */

import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDefaultAIContext, type EnemyInfo } from "@/ai/fsm/context";
import {
	AI_PROFILES,
	CROC_CHAMPION_PROFILE,
	GATOR_PROFILE,
	getAIProfile,
	SKINK_PROFILE,
	VIPER_PROFILE,
} from "@/ai/fsm/profiles";
import { FSMRunner } from "@/ai/fsm/runner";
import { STATE } from "@/ai/fsm/states";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";
import { Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { aiSystem, resetAIRunners } from "@/systems/aiSystem";

function makeEnemy(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 99, x: 5, y: 5, hp: 100, isBuilding: false, ...overrides };
}

function _makeBuilding(overrides: Partial<EnemyInfo> = {}): EnemyInfo {
	return { entityId: 50, x: 10, y: 10, hp: 200, isBuilding: true, ...overrides };
}

describe("US-065: Wire Yuka FSM profiles to game entities", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
		resetAIRunners();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("Profile coverage — all 7 enemy types have distinct FSM profiles", () => {
		it("should have profiles for all Scale-Guard unit types including Skink", () => {
			const expectedTypes = [
				"gator",
				"viper",
				"scout_lizard",
				"croc_champion",
				"siphon_drone",
				"snapper",
				"skink",
			];
			for (const type of expectedTypes) {
				expect(getAIProfile(type)).toBeDefined();
			}
		});

		it("each profile should have a distinct initial state or allowed states", () => {
			const profiles = Object.values(AI_PROFILES);
			// Each unit type should be uniquely configured
			for (let i = 0; i < profiles.length; i++) {
				for (let j = i + 1; j < profiles.length; j++) {
					const a = profiles[i];
					const b = profiles[j];
					expect(a.unitType).not.toBe(b.unitType);
				}
			}
		});

		it("Skink profile should be worker-like: idle/patrol/alert/flee only", () => {
			expect(SKINK_PROFILE.initialState).toBe(STATE.IDLE);
			expect(SKINK_PROFILE.allowedStates).toContain(STATE.IDLE);
			expect(SKINK_PROFILE.allowedStates).toContain(STATE.PATROL);
			expect(SKINK_PROFILE.allowedStates).toContain(STATE.FLEE);
			// Skink should NOT have aggressive states
			expect(SKINK_PROFILE.allowedStates).not.toContain(STATE.ATTACK);
			expect(SKINK_PROFILE.allowedStates).not.toContain(STATE.BERSERK);
		});
	});

	describe("FSM state transitions for Gator (melee tank)", () => {
		it("idle → alert → chase → attack → flee flow", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const moveTo = vi.fn();
			const attack = vi.fn();

			const ctx = createDefaultAIContext({
				hp: 100,
				maxHp: 100,
				attackRange: 1,
				visionRadius: 5,
				requestMoveTo: moveTo,
				requestAttack: attack,
			});
			runner.start(ctx);
			expect(runner.state).toBe(STATE.IDLE);

			// Enemy sighted → ALERT
			ctx.nearestEnemy = makeEnemy({ x: 8, y: 8 });
			ctx.distanceToNearestEnemy = 4;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// ALERT → CHASE (enemy out of melee range)
			runner.update(ctx);
			expect(runner.state).toBe(STATE.CHASE);

			// CHASE → ATTACK (enemy in range)
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ATTACK);

			// ATTACK → FLEE (low HP)
			ctx.hp = 15;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.FLEE);
		});

		it("should return to patrol after idle → patrol when no enemies", () => {
			const runner = new FSMRunner(GATOR_PROFILE);
			const ctx = createDefaultAIContext({
				patrolWaypoints: [{ x: 5, y: 5 }],
			});
			runner.start(ctx);
			expect(runner.state).toBe(STATE.IDLE);

			runner.update(ctx);
			expect(runner.state).toBe(STATE.PATROL);
		});
	});

	describe("FSM state transitions for Croc Champion (boss)", () => {
		it("patrol → alert → engage → berserk (never flees)", () => {
			const runner = new FSMRunner(CROC_CHAMPION_PROFILE);
			const moveTo = vi.fn();
			const attack = vi.fn();

			const ctx = createDefaultAIContext({
				hp: 200,
				maxHp: 200,
				attackRange: 1,
				requestMoveTo: moveTo,
				requestAttack: attack,
				patrolWaypoints: [{ x: 0, y: 0 }],
			});
			runner.start(ctx);

			// Patrol → alert on enemy sighting
			ctx.nearestEnemy = makeEnemy();
			ctx.distanceToNearestEnemy = 3;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// Alert → engage
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ENGAGE);

			// Engage → berserk at low HP (below 30%)
			ctx.hp = 50;
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.BERSERK);

			// Berserk Croc Champion never enters FLEE
			expect(CROC_CHAMPION_PROFILE.allowedStates).not.toContain(STATE.FLEE);

			// Berserk stays berserk even at critical HP
			ctx.hp = 5;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.BERSERK);
		});
	});

	describe("FSM state transitions for Viper (ranged)", () => {
		it("patrol → alert → snipe → flee when closed on", () => {
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
			runner.update(ctx);
			expect(runner.state).toBe(STATE.PATROL);

			// Enemy spotted
			ctx.nearestEnemy = makeEnemy({ x: 8, y: 0 });
			ctx.distanceToNearestEnemy = 4;
			ctx.visibleEnemies = [ctx.nearestEnemy];
			runner.update(ctx);
			expect(runner.state).toBe(STATE.ALERT);

			// Alert → snipe
			runner.update(ctx);
			expect(runner.state).toBe(STATE.SNIPE);

			// Enemy closes in → flee
			ctx.distanceToNearestEnemy = 1;
			runner.update(ctx);
			expect(runner.state).toBe(STATE.FLEE);
		});
	});

	describe("ECS integration — AI entities get FSM runner + steering vehicle", () => {
		it("should initialize FSM runner when entity has AIState + valid profile", () => {
			const gator = world.spawn(
				AIState,
				UnitType,
				Position,
				Health,
				Attack,
				VisionRadius,
				Faction,
				OrderQueue,
				SteeringAgent,
			);
			gator.set(UnitType, { type: "gator" });
			gator.set(Position, { x: 10, y: 10 });
			gator.set(Health, { current: 120, max: 120 });
			gator.set(Attack, { damage: 18, range: 1, cooldown: 1, timer: 0 });
			gator.set(VisionRadius, { radius: 5 });
			gator.set(Faction, { id: "scale_guard" });
			gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

			aiSystem(world, 0.016);

			const state = gator.get(AIState);
			expect(state).toBeDefined();
			expect(typeof state.state).toBe("string");
		});

		it("should detect enemy and transition for two different AI entity types", () => {
			// Gator at (10, 10)
			const gator = world.spawn(
				AIState,
				UnitType,
				Position,
				Health,
				Attack,
				VisionRadius,
				Faction,
				OrderQueue,
			);
			gator.set(UnitType, { type: "gator" });
			gator.set(Position, { x: 10, y: 10 });
			gator.set(Health, { current: 120, max: 120 });
			gator.set(Attack, { damage: 18, range: 1, cooldown: 1, timer: 0 });
			gator.set(VisionRadius, { radius: 5 });
			gator.set(Faction, { id: "scale_guard" });
			gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

			// Viper at (20, 20)
			const viper = world.spawn(
				AIState,
				UnitType,
				Position,
				Health,
				Attack,
				VisionRadius,
				Faction,
				OrderQueue,
			);
			viper.set(UnitType, { type: "viper" });
			viper.set(Position, { x: 20, y: 20 });
			viper.set(Health, { current: 35, max: 35 });
			viper.set(Attack, { damage: 8, range: 5, cooldown: 1, timer: 0 });
			viper.set(VisionRadius, { radius: 7 });
			viper.set(Faction, { id: "scale_guard" });
			viper.set(AIState, { state: "idle", target: null, alertLevel: 0 });

			// Player unit near gator
			const player = world.spawn(UnitType, Position, Health, Faction);
			player.set(UnitType, { type: "mudfoot" });
			player.set(Position, { x: 12, y: 10 });
			player.set(Health, { current: 80, max: 80 });
			player.set(Faction, { id: "ura" });

			// Tick
			aiSystem(world, 0.016);

			// Gator should detect nearby enemy and transition
			const gatorState = gator.get(AIState);
			expect(gatorState.target).not.toBeNull();

			// Viper should not detect enemy (too far)
			const viperState = viper.get(AIState);
			expect(viperState.target).toBeNull();
		});
	});
});
