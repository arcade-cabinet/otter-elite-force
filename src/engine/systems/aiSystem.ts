/**
 * AI System — FSM-based enemy behavior for Scale Guard entities.
 *
 * Each frame, for every enemy-faction entity:
 * 1. Build an AI context from current ECS state.
 * 2. Evaluate FSM state transitions based on conditions.
 * 3. Execute the active state's behavior (idle, patrol, chase, attack, flee, gather).
 * 4. Write back state changes (orders, alerts).
 *
 * FSM States:
 *   idle     — No enemies detected. Stand ground or wander.
 *   patrol   — Move between waypoints. Transition to chase on enemy detection.
 *   chase    — Move toward detected enemy. Transition to attack when in range.
 *   attack   — Engage target. Transition to chase if target moves out of range.
 *   flee     — HP below threshold. Move away from combat.
 *   gather   — Siphon drones: drain resources from nearby nodes.
 *
 * State transitions:
 *   idle → chase (enemy in vision)
 *   idle → patrol (has patrol waypoints)
 *   patrol → chase (enemy in vision)
 *   chase → attack (enemy in attack range)
 *   chase → idle (enemy escaped beyond de-aggro range)
 *   attack → chase (enemy moved out of attack range)
 *   attack → flee (HP < 20%)
 *   flee → idle (no enemies in vision OR HP recovered)
 *   any → idle (target dead)
 */

import {
	Attack,
	Faction,
	Flags,
	Health,
	Position,
	TargetRef,
	VisionRadius,
} from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";
import { getOrderQueue } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default detection range when VisionRadius is not set. */
const DEFAULT_DETECTION_RANGE = 128;

/** De-aggro distance multiplier. If target is beyond vision * this factor, lose interest. */
const DE_AGGRO_MULTIPLIER = 1.5;

/** HP percentage below which enemies flee. */
const FLEE_HP_THRESHOLD = 0.2;

/** Flee distance in pixels. */
const FLEE_DISTANCE = 128;

// TODO: Alert propagation range — uncomment when propagation system is wired in
// const ALERT_PROPAGATION_RANGE = 256;

/** Group behavior: allies within this range join a chase. */
const GROUP_ASSIST_RANGE = 192;

// ---------------------------------------------------------------------------
// AI FSM State type
// ---------------------------------------------------------------------------

interface AIState {
	state: string;
	alertLevel: number;
	stateTimer: number;
	homeX: number;
	homeY: number;
	patrolIndex: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

function getOrCreateAIState(world: GameWorld, eid: number): AIState {
	let state = world.runtime.aiStates.get(eid);
	if (!state) {
		state = {
			state: "idle",
			alertLevel: 0,
			stateTimer: 0,
			homeX: Position.x[eid],
			homeY: Position.y[eid],
			patrolIndex: 0,
		};
		world.runtime.aiStates.set(eid, state);
	}
	return state;
}

/**
 * Find the nearest player-faction entity within a given range.
 * Returns the entity ID or -1 if none found.
 */
function findNearestPlayerEntity(
	world: GameWorld,
	eid: number,
	range: number,
): { targetEid: number; dist: number } {
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const playerFactionId = FACTION_IDS.ura;

	let nearestEid = -1;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const candidateEid of world.runtime.alive) {
		if (candidateEid === eid) continue;
		if (Faction.id[candidateEid] !== playerFactionId) continue;
		if (Flags.isProjectile[candidateEid] === 1) continue;
		if (Health.max[candidateEid] <= 0) continue;
		if (Health.current[candidateEid] <= 0) continue;

		const dx = Position.x[candidateEid] - ax;
		const dy = Position.y[candidateEid] - ay;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= range && dist < nearestDist) {
			nearestDist = dist;
			nearestEid = candidateEid;
		}
	}

	return { targetEid: nearestEid, dist: nearestDist };
}

/**
 * Find visible player-faction entities within vision range.
 * Returns sorted by distance (nearest first).
 */
function findVisibleEnemies(
	world: GameWorld,
	eid: number,
	visionRadius: number,
): Array<{ eid: number; dist: number; hp: number; isBuilding: boolean }> {
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const myFaction = Faction.id[eid];
	const enemies: Array<{ eid: number; dist: number; hp: number; isBuilding: boolean }> = [];

	for (const candidateEid of world.runtime.alive) {
		if (candidateEid === eid) continue;
		if (Faction.id[candidateEid] === myFaction) continue;
		if (Faction.id[candidateEid] === FACTION_IDS.neutral) continue;
		if (Flags.isProjectile[candidateEid] === 1) continue;
		if (Health.max[candidateEid] <= 0) continue;
		if (Health.current[candidateEid] <= 0) continue;

		const dist = distanceBetween(ax, ay, Position.x[candidateEid], Position.y[candidateEid]);
		if (dist <= visionRadius) {
			enemies.push({
				eid: candidateEid,
				dist,
				hp: Health.current[candidateEid],
				isBuilding: Flags.isBuilding[candidateEid] === 1,
			});
		}
	}

	enemies.sort((a, b) => a.dist - b.dist);
	return enemies;
}

// ---------------------------------------------------------------------------
// FSM State handlers
// ---------------------------------------------------------------------------

function handleIdle(
	world: GameWorld,
	eid: number,
	ai: AIState,
	detectionRange: number,
): void {
	ai.stateTimer += world.time.deltaMs / 1000;

	// Check for enemies
	const { targetEid } = findNearestPlayerEntity(world, eid, detectionRange);

	if (targetEid !== -1) {
		// Enemy detected — transition to chase and issue initial move order
		ai.state = "chase";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = targetEid;

		// Issue initial move order toward the target
		const orderQueue = getOrderQueue(world, eid);
		orderQueue.length = 0;
		orderQueue.push({
			type: "move",
			targetX: Position.x[targetEid],
			targetY: Position.y[targetEid],
		});

		// Alert nearby allies (group behavior)
		alertNearbyAllies(world, eid, targetEid);
		return;
	}
}

function handlePatrol(
	world: GameWorld,
	eid: number,
	ai: AIState,
	detectionRange: number,
): void {
	// Check for enemies first — patrol is interrupted by detection
	const { targetEid } = findNearestPlayerEntity(world, eid, detectionRange);
	if (targetEid !== -1) {
		ai.state = "chase";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = targetEid;
		alertNearbyAllies(world, eid, targetEid);
		return;
	}

	// Continue patrol — order system handles waypoint cycling
	const orders = world.runtime.orderQueues.get(eid);
	if (!orders || orders.length === 0) {
		// No patrol waypoints — go idle
		ai.state = "idle";
		ai.stateTimer = 0;
	}
}

function handleChase(
	world: GameWorld,
	eid: number,
	ai: AIState,
	detectionRange: number,
): void {
	const targetEid = TargetRef.eid[eid];

	// Target dead or gone — return to idle
	if (targetEid <= 0 || !world.runtime.alive.has(targetEid) || Health.current[targetEid] <= 0) {
		ai.state = "idle";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = 0;

		// Clear movement orders
		const orders = world.runtime.orderQueues.get(eid);
		if (orders) orders.length = 0;
		return;
	}

	const dist = distanceBetween(
		Position.x[eid], Position.y[eid],
		Position.x[targetEid], Position.y[targetEid],
	);

	// De-aggro if target is too far
	if (dist > detectionRange * DE_AGGRO_MULTIPLIER) {
		ai.state = "idle";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = 0;

		const orders = world.runtime.orderQueues.get(eid);
		if (orders) orders.length = 0;
		return;
	}

	const attackRange = Attack.range[eid];

	// In attack range — transition to attack
	if (dist <= attackRange) {
		ai.state = "attack";
		ai.stateTimer = 0;
		return;
	}

	// Move toward target
	const orderQueue = getOrderQueue(world, eid);
	if (orderQueue.length === 0 || orderQueue[0].type !== "move") {
		orderQueue.length = 0;
		orderQueue.push({
			type: "move",
			targetX: Position.x[targetEid],
			targetY: Position.y[targetEid],
		});
	} else {
		// Update existing move order target
		orderQueue[0].targetX = Position.x[targetEid];
		orderQueue[0].targetY = Position.y[targetEid];
	}
}

function handleAttack(
	world: GameWorld,
	eid: number,
	ai: AIState,
	detectionRange: number,
): void {
	const targetEid = TargetRef.eid[eid];

	// Target dead or gone — return to idle
	if (targetEid <= 0 || !world.runtime.alive.has(targetEid) || Health.current[targetEid] <= 0) {
		ai.state = "idle";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = 0;
		return;
	}

	// Check if we should flee (low HP)
	const hpPercent = Health.max[eid] > 0 ? Health.current[eid] / Health.max[eid] : 0;
	if (hpPercent < FLEE_HP_THRESHOLD && hpPercent > 0) {
		ai.state = "flee";
		ai.stateTimer = 0;
		return;
	}

	const dist = distanceBetween(
		Position.x[eid], Position.y[eid],
		Position.x[targetEid], Position.y[targetEid],
	);

	// Target moved out of attack range — chase
	if (dist > Attack.range[eid]) {
		ai.state = "chase";
		ai.stateTimer = 0;
		return;
	}

	// Clear move orders — let combat system handle the attack
	const orders = world.runtime.orderQueues.get(eid);
	if (orders && orders.length > 0 && orders[0].type === "move") {
		orders.length = 0;
	}

	// Priority targeting: if a closer or higher-threat enemy appears, re-target
	const enemies = findVisibleEnemies(world, eid, detectionRange);
	if (enemies.length > 1) {
		const currentTargetEntry = enemies.find((e) => e.eid === targetEid);
		const nearestEntry = enemies[0];

		// Switch to closer enemy if significantly closer
		if (currentTargetEntry && nearestEntry.eid !== targetEid) {
			if (nearestEntry.dist < currentTargetEntry.dist * 0.5) {
				TargetRef.eid[eid] = nearestEntry.eid;
			}
		}
	}
}

function handleFlee(
	world: GameWorld,
	eid: number,
	ai: AIState,
	detectionRange: number,
): void {
	ai.stateTimer += world.time.deltaMs / 1000;

	// Check if we can stop fleeing (no enemies nearby)
	const { targetEid: nearestEnemy, dist: _nearestDist } =
		findNearestPlayerEntity(world, eid, detectionRange);

	if (nearestEnemy === -1) {
		// No enemies — recover to idle
		ai.state = "idle";
		ai.stateTimer = 0;
		TargetRef.eid[eid] = 0;
		return;
	}

	// HP recovered above threshold — stop fleeing
	const hpPercent = Health.max[eid] > 0 ? Health.current[eid] / Health.max[eid] : 0;
	if (hpPercent >= FLEE_HP_THRESHOLD * 2) {
		ai.state = "idle";
		ai.stateTimer = 0;
		return;
	}

	// Run away from nearest enemy
	const ex = Position.x[eid];
	const ey = Position.y[eid];
	const enemyX = Position.x[nearestEnemy];
	const enemyY = Position.y[nearestEnemy];

	const dx = ex - enemyX;
	const dy = ey - enemyY;
	const len = Math.sqrt(dx * dx + dy * dy);

	if (len > 0) {
		const fleeX = ex + (dx / len) * FLEE_DISTANCE;
		const fleeY = ey + (dy / len) * FLEE_DISTANCE;

		const orderQueue = getOrderQueue(world, eid);
		orderQueue.length = 0;
		orderQueue.push({
			type: "move",
			targetX: fleeX,
			targetY: fleeY,
		});
	}
}

// ---------------------------------------------------------------------------
// Group behavior
// ---------------------------------------------------------------------------

/**
 * Alert nearby same-faction allies about a detected enemy.
 * Idle allies within GROUP_ASSIST_RANGE will transition to chase.
 */
function alertNearbyAllies(world: GameWorld, alerterEid: number, targetEid: number): void {
	const alerterFaction = Faction.id[alerterEid];
	const ax = Position.x[alerterEid];
	const ay = Position.y[alerterEid];

	for (const allyEid of world.runtime.alive) {
		if (allyEid === alerterEid) continue;
		if (Faction.id[allyEid] !== alerterFaction) continue;
		if (Flags.isResource[allyEid] === 1 || Flags.isProjectile[allyEid] === 1) continue;
		if (Flags.isBuilding[allyEid] === 1) continue;
		if (Attack.damage[allyEid] <= 0) continue;

		const dist = distanceBetween(ax, ay, Position.x[allyEid], Position.y[allyEid]);
		if (dist > GROUP_ASSIST_RANGE) continue;

		const allyAi = world.runtime.aiStates.get(allyEid);
		if (allyAi && allyAi.state === "idle") {
			allyAi.state = "chase";
			allyAi.stateTimer = 0;
			TargetRef.eid[allyEid] = targetEid;
		}
	}
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the AI system.
 * Evaluates enemy entity behavior through FSM states and assigns orders.
 */
export function runAiSystem(world: GameWorld): void {
	const enemyFactionId = FACTION_IDS.scale_guard;

	for (const eid of world.runtime.alive) {
		// Only process enemy faction entities that are not buildings/resources
		if (Faction.id[eid] !== enemyFactionId) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;
		if (Flags.isBuilding[eid] === 1) continue;

		// Must have attack capability (non-combat enemies handled elsewhere)
		if (Attack.damage[eid] <= 0) continue;

		// Get or create AI state
		const ai = getOrCreateAIState(world, eid);

		// Determine detection range
		const detectionRange =
			VisionRadius.value[eid] > 0
				? VisionRadius.value[eid]
				: DEFAULT_DETECTION_RANGE;

		// Run FSM for current state
		switch (ai.state) {
			case "idle":
				handleIdle(world, eid, ai, detectionRange);
				break;
			case "patrol":
				handlePatrol(world, eid, ai, detectionRange);
				break;
			case "chase":
				handleChase(world, eid, ai, detectionRange);
				break;
			case "attack":
				handleAttack(world, eid, ai, detectionRange);
				break;
			case "flee":
				handleFlee(world, eid, ai, detectionRange);
				break;
			default:
				// Unknown state — reset to idle
				ai.state = "idle";
				ai.stateTimer = 0;
				break;
		}
	}
}

/**
 * Reset AI state cache. Call when starting a new mission.
 */
export function resetAIStates(world: GameWorld): void {
	world.runtime.aiStates.clear();
}
