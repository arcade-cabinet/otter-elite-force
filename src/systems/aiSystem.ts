/**
 * AI System — Runs enemy FSM decisions each frame.
 *
 * For every entity with the AIState trait, this system:
 *  1. Builds an AIContext from the entity's Koota traits
 *  2. Retrieves (or creates) a FSMRunner for the entity's unit type
 *  3. Calls runner.update(ctx) to tick the FSM one step
 *  4. Writes back any state changes to Koota traits
 *
 * Called at position 3 in tickAllSystems() (after orders, before movement).
 */

import type { Entity, World } from "koota";
import { FSMRunner } from "@/ai/fsm/runner";
import { type AIContext, createDefaultAIContext } from "@/ai/fsm/context";
import { getAIProfile } from "@/ai/fsm/profiles";
import { AIState } from "@/ecs/traits/ai";
import { Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, IsBuilding, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";

/**
 * Map from entity ID → FSMRunner instance.
 * Runners are created lazily on first encounter and persist
 * for the entity's lifetime. Stale entries are cleaned when
 * the entity is found to no longer have AIState.
 */
const runners = new Map<number, FSMRunner>();

/**
 * Tick all AI-controlled entities one FSM step.
 *
 * @param world - The Koota ECS world.
 * @param _delta - Delta time in seconds (unused for now; FSM states
 *                 use stateData timers rather than real-time delta).
 */
export function aiSystem(world: World, _delta: number): void {
	// Query all entities with AIState + UnitType + Position (minimum for AI)
	const entities = world.query(AIState, UnitType, Position);

	for (const entity of entities) {
		const unitType = entity.get(UnitType);
		if (!unitType) continue;

		const profile = getAIProfile(unitType.type);
		if (!profile) {
			// Player units or unknown types — skip
			continue;
		}

		const entityId = entity.id();

		// Get or create runner
		let runner = runners.get(entityId);
		if (!runner) {
			runner = new FSMRunner(profile);
			runners.set(entityId, runner);
			// Build initial context and enter the initial state
			const initCtx = buildContext(entity, world);
			runner.start(initCtx);
		}

		// Build context from current ECS state
		const ctx = buildContext(entity, world);

		// Tick one FSM step
		runner.update(ctx);

		// Write state back to AIState trait
		entity.set(AIState, {
			state: runner.state,
			target: ctx.nearestEnemy?.entityId ?? null,
			alertLevel: ctx.alertLevel,
		});
	}
}

/**
 * Build an AIContext from an entity's Koota traits.
 * This bridges the ECS world into the FSM's decision-making interface.
 */
function buildContext(entity: Entity, world: World): AIContext {
	const pos = entity.get(Position) ?? { x: 0, y: 0 };
	const health = entity.get(Health) ?? { current: 100, max: 100 };
	const attack = entity.get(Attack) ?? { damage: 10, range: 1, cooldown: 1, timer: 0 };
	const vision = entity.get(VisionRadius) ?? { radius: 5 };
	const aiState = entity.get(AIState) ?? { state: "idle", target: null, alertLevel: 0 };
	const entityId = entity.id();

	// Find visible enemies (player faction entities within vision radius)
	const visibleEnemies = findVisibleEnemies(entity, world, vision.radius);
	const nearestEnemy = visibleEnemies.length > 0 ? visibleEnemies[0] : null;
	const distToNearest = nearestEnemy
		? Math.hypot(nearestEnemy.x - pos.x, nearestEnemy.y - pos.y)
		: Number.POSITIVE_INFINITY;

	return createDefaultAIContext({
		entityId,
		x: pos.x,
		y: pos.y,
		hp: health.current,
		maxHp: health.max,
		attackDamage: attack.damage,
		attackRange: attack.range,
		visionRadius: vision.radius,
		visibleEnemies,
		nearestEnemy,
		distanceToNearestEnemy: distToNearest,
		alertLevel: aiState.alertLevel,
		stateData: {},

		requestMoveTo: (tx: number, ty: number) => {
			if (entity.has(OrderQueue)) {
				const queue = entity.get(OrderQueue);
				if (queue) queue.push({ type: "move", targetX: tx, targetY: ty });
			}
		},

		requestAttack: (targetId: number) => {
			if (entity.has(OrderQueue)) {
				const queue = entity.get(OrderQueue);
				if (queue) queue.push({ type: "attack", targetEntity: targetId });
			}
		},

		requestSignalAllies: (_x: number, _y: number) => {
			// Scout signal — alert nearby allies. Handled by alertCascadeSystem.
			entity.set(AIState, {
				state: aiState.state,
				target: aiState.target,
				alertLevel: 2,
			});
		},

		requestDrain: (targetEntityId: number) => {
			// Siphon drain — handled by siphonSystem once order is dispatched.
			if (entity.has(OrderQueue)) {
				const queue = entity.get(OrderQueue);
				if (queue) queue.push({ type: "gather", targetEntity: targetEntityId });
			}
		},
	});
}

/**
 * Find player-faction entities visible to this AI entity.
 * Returns them sorted by distance (nearest first).
 */
function findVisibleEnemies(
	entity: Entity,
	world: World,
	visionRadius: number,
): Array<{ entityId: number; x: number; y: number; hp: number; isBuilding: boolean }> {
	const pos = entity.get(Position) ?? { x: 0, y: 0 };
	const myFactionTrait = entity.get(Faction);
	const myFaction = myFactionTrait?.id ?? "scale_guard";

	const enemies: Array<{
		entityId: number;
		x: number;
		y: number;
		hp: number;
		isBuilding: boolean;
		dist: number;
	}> = [];

	// Query all entities with Position + Health + Faction
	const candidates = world.query(Position, Health, Faction);
	for (const candidate of candidates) {
		const candidateFaction = candidate.get(Faction);
		if (!candidateFaction) continue;
		// Skip same faction
		if (candidateFaction.id === myFaction) continue;

		const cPos = candidate.get(Position);
		if (!cPos) continue;

		const dx = cPos.x - pos.x;
		const dy = cPos.y - pos.y;
		const dist = Math.hypot(dx, dy);

		if (dist <= visionRadius) {
			const cHealth = candidate.get(Health);
			if (!cHealth) continue;
			enemies.push({
				entityId: candidate.id(),
				x: cPos.x,
				y: cPos.y,
				hp: cHealth.current,
				isBuilding: candidate.has(IsBuilding),
				dist,
			});
		}
	}

	// Sort by distance (nearest first)
	enemies.sort((a, b) => a.dist - b.dist);

	return enemies.map(({ dist: _d, ...rest }) => rest);
}

/**
 * Remove runner entries for entities that no longer exist.
 * Call periodically (e.g., after deathSystem) to prevent memory leaks.
 */
export function cleanupAIRunners(world: World): void {
	const livingEntities = new Set<number>();
	const entities = world.query(AIState);
	for (const entity of entities) {
		livingEntities.add(entity.id());
	}

	for (const [entityId] of runners) {
		if (!livingEntities.has(entityId)) {
			runners.delete(entityId);
		}
	}
}

/**
 * Reset the runner cache. Call when starting a new mission.
 */
export function resetAIRunners(): void {
	runners.clear();
}
