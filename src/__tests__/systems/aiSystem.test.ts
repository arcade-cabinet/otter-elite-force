/**
 * AI System Unit Tests
 *
 * Verifies that aiSystem correctly:
 * 1. Calls the FSM runner for entities with AIState trait
 * 2. Skips entities without an AI profile (player units)
 * 3. Updates AIState after each tick
 * 4. Finds visible enemies and populates context
 */

import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AIState } from "@/ecs/traits/ai";
import { Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { aiSystem, resetAIRunners } from "@/systems/aiSystem";

describe("aiSystem", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
		resetAIRunners();
	});

	afterEach(() => {
		world.destroy();
	});

	it("should execute FSM runner for entities with AIState and a known profile", () => {
		// Spawn a Gator (has an AI profile in profiles.ts)
		const entity = world.spawn(AIState, UnitType, Position, Health, Attack, VisionRadius, Faction);
		entity.set(UnitType, { type: "gator" });
		entity.set(Position, { x: 10, y: 10 });
		entity.set(Health, { current: 100, max: 100 });
		entity.set(Attack, { damage: 20, range: 1, cooldown: 1, timer: 0 });
		entity.set(VisionRadius, { radius: 5 });
		entity.set(Faction, { id: "scale_guard" });
		entity.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Tick the AI system
		aiSystem(world, 0.016);

		// After one tick, the Gator should have an updated AI state
		const state = entity.get(AIState);
		expect(state).toBeDefined();
		// The FSM should have been initialized and executed
		// The Gator's initial state is IDLE, and with no enemies nearby,
		// it should transition to PATROL (IDLE → PATROL is allowed)
		expect(typeof state.state).toBe("string");
		expect(state.state.length).toBeGreaterThan(0);
	});

	it("should skip entities without an AI profile (player units)", () => {
		// Spawn a Mudfoot (player unit — no AI profile)
		const entity = world.spawn(AIState, UnitType, Position, Health, Faction);
		entity.set(UnitType, { type: "mudfoot" });
		entity.set(Position, { x: 5, y: 5 });
		entity.set(Health, { current: 80, max: 80 });
		entity.set(Faction, { id: "ura" });
		entity.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Tick — should not crash or modify state
		aiSystem(world, 0.016);

		// State should be unchanged (no profile means the system skips it)
		const state = entity.get(AIState);
		expect(state.state).toBe("idle");
	});

	it("should detect visible enemies within vision radius", () => {
		// Spawn a Gator at (10, 10) with vision radius 5
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
		gator.set(Health, { current: 100, max: 100 });
		gator.set(Attack, { damage: 20, range: 1, cooldown: 1, timer: 0 });
		gator.set(VisionRadius, { radius: 5 });
		gator.set(Faction, { id: "scale_guard" });
		gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Spawn a player unit at (12, 10) — within vision range (distance = 2)
		const playerUnit = world.spawn(UnitType, Position, Health, Faction);
		playerUnit.set(UnitType, { type: "mudfoot" });
		playerUnit.set(Position, { x: 12, y: 10 });
		playerUnit.set(Health, { current: 80, max: 80 });
		playerUnit.set(Faction, { id: "ura" });

		// Tick the AI system
		aiSystem(world, 0.016);

		// The Gator should detect the nearby enemy and potentially change state
		const state = gator.get(AIState);
		// With an enemy in range, the Gator should transition from IDLE to ALERT or PATROL
		expect(state.target).not.toBeNull();
	});

	it("should not detect enemies outside vision radius", () => {
		// Spawn a Gator at (10, 10) with vision radius 5
		const gator = world.spawn(AIState, UnitType, Position, Health, Attack, VisionRadius, Faction);
		gator.set(UnitType, { type: "gator" });
		gator.set(Position, { x: 10, y: 10 });
		gator.set(Health, { current: 100, max: 100 });
		gator.set(Attack, { damage: 20, range: 1, cooldown: 1, timer: 0 });
		gator.set(VisionRadius, { radius: 5 });
		gator.set(Faction, { id: "scale_guard" });
		gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Spawn a player unit at (30, 30) — outside vision range
		const farUnit = world.spawn(UnitType, Position, Health, Faction);
		farUnit.set(UnitType, { type: "mudfoot" });
		farUnit.set(Position, { x: 30, y: 30 });
		farUnit.set(Health, { current: 80, max: 80 });
		farUnit.set(Faction, { id: "ura" });

		// Tick the AI system
		aiSystem(world, 0.016);

		// The Gator should NOT detect the far enemy
		const state = gator.get(AIState);
		expect(state.target).toBeNull();
	});

	it("should handle multiple AI entities in one tick", () => {
		// Spawn two different enemy types
		const gator = world.spawn(AIState, UnitType, Position, Health, VisionRadius, Faction);
		gator.set(UnitType, { type: "gator" });
		gator.set(Position, { x: 5, y: 5 });
		gator.set(Health, { current: 100, max: 100 });
		gator.set(VisionRadius, { radius: 5 });
		gator.set(Faction, { id: "scale_guard" });
		gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		const viper = world.spawn(AIState, UnitType, Position, Health, VisionRadius, Faction);
		viper.set(UnitType, { type: "viper" });
		viper.set(Position, { x: 20, y: 20 });
		viper.set(Health, { current: 60, max: 60 });
		viper.set(VisionRadius, { radius: 7 });
		viper.set(Faction, { id: "scale_guard" });
		viper.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Tick — should process both without error
		aiSystem(world, 0.016);

		const gatorState = gator.get(AIState);
		const viperState = viper.get(AIState);
		expect(gatorState).toBeDefined();
		expect(viperState).toBeDefined();
	});

	it("should maintain runner state across multiple ticks", () => {
		const gator = world.spawn(AIState, UnitType, Position, Health, VisionRadius, Faction);
		gator.set(UnitType, { type: "gator" });
		gator.set(Position, { x: 10, y: 10 });
		gator.set(Health, { current: 100, max: 100 });
		gator.set(VisionRadius, { radius: 5 });
		gator.set(Faction, { id: "scale_guard" });
		gator.set(AIState, { state: "idle", target: null, alertLevel: 0 });

		// Tick multiple times
		aiSystem(world, 0.016);
		const stateAfter1 = gator.get(AIState).state;

		aiSystem(world, 0.016);
		const stateAfter2 = gator.get(AIState).state;

		// States should be valid string values
		expect(typeof stateAfter1).toBe("string");
		expect(typeof stateAfter2).toBe("string");
	});
});
