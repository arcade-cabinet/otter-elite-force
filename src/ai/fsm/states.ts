/**
 * FSM states for Scale-Guard enemy AI.
 *
 * Each state implements Yuka's State interface with enter/execute/exit.
 * States read from AIContext (attached to the owner entity via userData)
 * and issue commands via context callbacks.
 *
 * Spec reference: §10 Yuka AI Integration — Enemy AI Profiles
 */

import type { AIContext } from "./context";

// ---------------------------------------------------------------------------
// State name constants
// ---------------------------------------------------------------------------

export const STATE = {
	IDLE: "idle",
	PATROL: "patrol",
	ALERT: "alert",
	CHASE: "chase",
	ATTACK: "attack",
	FLEE: "flee",
	AMBUSH: "ambush",
	SIGNAL: "signal",
	SNIPE: "snipe",
	SPOT: "spot",
	ENGAGE: "engage",
	BERSERK: "berserk",
	APPROACH: "approach",
	DRAIN: "drain",
	RETREAT: "retreat",
} as const;

export type StateName = (typeof STATE)[keyof typeof STATE];

// ---------------------------------------------------------------------------
// State interface (mirrors Yuka State but typed for our context)
// ---------------------------------------------------------------------------

export interface AIState {
	name: StateName;
	enter(ctx: AIContext): void;
	execute(ctx: AIContext): StateName | null;
	exit(ctx: AIContext): void;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function distanceTiles(ax: number, ay: number, bx: number, by: number): number {
	return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/** Do nothing, transition to patrol/alert on enemy detection. */
export class IdleState implements AIState {
	name = STATE.IDLE as StateName;
	enter() {}
	execute(ctx: AIContext): StateName | null {
		if (ctx.nearestEnemy && ctx.distanceToNearestEnemy <= ctx.visionRadius) {
			return STATE.ALERT;
		}
		if (ctx.patrolWaypoints.length > 0) {
			return STATE.PATROL;
		}
		return null;
	}
	exit() {}
}

/** Walk a patrol route, transition to alert on enemy sighting. */
export class PatrolState implements AIState {
	name = STATE.PATROL as StateName;
	enter(ctx: AIContext) {
		if (ctx.patrolWaypoints.length > 0) {
			const wp = ctx.patrolWaypoints[ctx.patrolIndex % ctx.patrolWaypoints.length];
			ctx.requestMoveTo(wp.x, wp.y);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (ctx.nearestEnemy && ctx.distanceToNearestEnemy <= ctx.visionRadius) {
			return STATE.ALERT;
		}
		// Advance to next waypoint when close
		if (ctx.patrolWaypoints.length > 0) {
			const wp = ctx.patrolWaypoints[ctx.patrolIndex % ctx.patrolWaypoints.length];
			if (distanceTiles(ctx.x, ctx.y, wp.x, wp.y) < 1) {
				ctx.patrolIndex = (ctx.patrolIndex + 1) % ctx.patrolWaypoints.length;
				const next = ctx.patrolWaypoints[ctx.patrolIndex];
				ctx.requestMoveTo(next.x, next.y);
			}
		}
		return null;
	}
	exit() {}
}

/** Enemy detected — assess threat, transition to chase/ambush/signal. */
export class AlertState implements AIState {
	name = STATE.ALERT as StateName;
	enter(ctx: AIContext) {
		ctx.alertLevel = 2;
		ctx.stateData.alertTimer = 0;
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			ctx.stateData.alertTimer = (ctx.stateData.alertTimer ?? 0) + 1;
			if (ctx.stateData.alertTimer > 60) {
				ctx.alertLevel = 0;
				return STATE.PATROL;
			}
			return null;
		}
		if (ctx.distanceToNearestEnemy <= ctx.attackRange) {
			return STATE.ATTACK;
		}
		return STATE.CHASE;
	}
	exit() {}
}

/** Move toward nearest enemy. */
export class ChaseState implements AIState {
	name = STATE.CHASE as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			ctx.requestMoveTo(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			return STATE.ALERT;
		}
		if (ctx.distanceToNearestEnemy <= ctx.attackRange) {
			return STATE.ATTACK;
		}
		if (ctx.distanceToNearestEnemy > ctx.visionRadius * 1.5) {
			return STATE.PATROL;
		}
		ctx.requestMoveTo(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		return null;
	}
	exit() {}
}

/** Attack the current target. */
export class AttackState implements AIState {
	name = STATE.ATTACK as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			ctx.requestAttack(ctx.nearestEnemy.entityId);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			return STATE.ALERT;
		}
		if (ctx.distanceToNearestEnemy > ctx.attackRange) {
			return STATE.CHASE;
		}
		// Low health threshold: flee
		if (ctx.hp < ctx.maxHp * 0.2) {
			return STATE.FLEE;
		}
		ctx.requestAttack(ctx.nearestEnemy.entityId);
		return null;
	}
	exit() {}
}

/** Run away from enemies (used by low-hp units, scouts, vipers). */
export class FleeState implements AIState {
	name = STATE.FLEE as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			// Flee in opposite direction
			const dx = ctx.x - ctx.nearestEnemy.x;
			const dy = ctx.y - ctx.nearestEnemy.y;
			const len = Math.max(distanceTiles(0, 0, dx, dy), 0.001);
			const fleeX = Math.round(ctx.x + (dx / len) * 5);
			const fleeY = Math.round(ctx.y + (dy / len) * 5);
			ctx.requestMoveTo(fleeX, fleeY);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy || ctx.distanceToNearestEnemy > ctx.visionRadius * 2) {
			return STATE.IDLE;
		}
		// Keep fleeing
		const dx = ctx.x - ctx.nearestEnemy.x;
		const dy = ctx.y - ctx.nearestEnemy.y;
		const len = Math.max(distanceTiles(0, 0, dx, dy), 0.001);
		const fleeX = Math.round(ctx.x + (dx / len) * 5);
		const fleeY = Math.round(ctx.y + (dy / len) * 5);
		ctx.requestMoveTo(fleeX, fleeY);
		return null;
	}
	exit() {}
}

/** Gator ambush: wait submerged, strike when enemy is close. */
export class AmbushState implements AIState {
	name = STATE.AMBUSH as StateName;
	enter(ctx: AIContext) {
		ctx.stateData.ambushTimer = 0;
	}
	execute(ctx: AIContext): StateName | null {
		if (ctx.nearestEnemy && ctx.distanceToNearestEnemy <= ctx.attackRange + 1) {
			return STATE.ATTACK;
		}
		ctx.stateData.ambushTimer = (ctx.stateData.ambushTimer ?? 0) + 1;
		// Give up ambush after timeout
		if (ctx.stateData.ambushTimer > 180) {
			return STATE.PATROL;
		}
		return null;
	}
	exit() {}
}

/** Scout Lizard: spotted enemy, now signaling allies. */
export class SignalState implements AIState {
	name = STATE.SIGNAL as StateName;
	enter(ctx: AIContext) {
		ctx.stateData.signalTimer = 0;
		if (ctx.nearestEnemy) {
			ctx.requestSignalAllies(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		}
	}
	execute(ctx: AIContext): StateName | null {
		ctx.stateData.signalTimer = (ctx.stateData.signalTimer ?? 0) + 1;
		// Signal for a brief period then flee
		if (ctx.stateData.signalTimer > 30) {
			return STATE.FLEE;
		}
		return null;
	}
	exit() {}
}

/** Scout Lizard: spotted an enemy in vision, preparing to signal. */
export class SpotState implements AIState {
	name = STATE.SPOT as StateName;
	enter() {}
	execute(ctx: AIContext): StateName | null {
		if (ctx.nearestEnemy) {
			return STATE.SIGNAL;
		}
		return STATE.PATROL;
	}
	exit() {}
}

/** Viper: snipe from range, flee if approached. */
export class SnipeState implements AIState {
	name = STATE.SNIPE as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			ctx.requestAttack(ctx.nearestEnemy.entityId);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			return STATE.PATROL;
		}
		// If enemy gets too close, flee
		if (ctx.distanceToNearestEnemy <= 2) {
			return STATE.FLEE;
		}
		// If enemy is in range, keep sniping
		if (ctx.distanceToNearestEnemy <= ctx.attackRange) {
			ctx.requestAttack(ctx.nearestEnemy.entityId);
			return null;
		}
		// Enemy out of range — chase to snipe range
		return STATE.CHASE;
	}
	exit() {}
}

/** Croc Champion: engage target aggressively. */
export class EngageState implements AIState {
	name = STATE.ENGAGE as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			ctx.requestMoveTo(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			return STATE.PATROL;
		}
		if (ctx.distanceToNearestEnemy <= ctx.attackRange) {
			ctx.requestAttack(ctx.nearestEnemy.entityId);
		} else {
			ctx.requestMoveTo(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		}
		// Go berserk below 50% HP — increased speed/damage, no flee
		if (ctx.hp < ctx.maxHp * 0.5) {
			return STATE.BERSERK;
		}
		return null;
	}
	exit() {}
}

/** Croc Champion: berserk mode — increased aggression, no retreat. */
export class BerserkState implements AIState {
	name = STATE.BERSERK as StateName;
	enter() {}
	execute(ctx: AIContext): StateName | null {
		if (!ctx.nearestEnemy) {
			// Berserk Croc looks for anything to hit
			if (ctx.visibleEnemies.length === 0) {
				return STATE.PATROL;
			}
			return null;
		}
		if (ctx.distanceToNearestEnemy <= ctx.attackRange) {
			ctx.requestAttack(ctx.nearestEnemy.entityId);
		} else {
			ctx.requestMoveTo(ctx.nearestEnemy.x, ctx.nearestEnemy.y);
		}
		return null;
	}
	exit() {}
}

/** Siphon Drone: approach nearest player building. */
export class ApproachState implements AIState {
	name = STATE.APPROACH as StateName;
	enter(ctx: AIContext) {
		const building = ctx.visibleEnemies.find((e) => e.isBuilding);
		if (building) {
			ctx.requestMoveTo(building.x, building.y);
		}
	}
	execute(ctx: AIContext): StateName | null {
		// If damaged, retreat
		if (ctx.hp < ctx.maxHp * 0.5) {
			return STATE.RETREAT;
		}
		const building = ctx.visibleEnemies.find((e) => e.isBuilding);
		if (!building) {
			return STATE.IDLE;
		}
		const dist = distanceTiles(ctx.x, ctx.y, building.x, building.y);
		if (dist <= ctx.attackRange) {
			return STATE.DRAIN;
		}
		ctx.requestMoveTo(building.x, building.y);
		return null;
	}
	exit() {}
}

/** Siphon Drone: drain resources from a building. */
export class DrainState implements AIState {
	name = STATE.DRAIN as StateName;
	enter(ctx: AIContext) {
		const building = ctx.visibleEnemies.find((e) => e.isBuilding);
		if (building) {
			ctx.requestDrain(building.entityId);
		}
	}
	execute(ctx: AIContext): StateName | null {
		// If damaged, retreat
		if (ctx.hp < ctx.maxHp * 0.5) {
			return STATE.RETREAT;
		}
		const building = ctx.visibleEnemies.find((e) => e.isBuilding);
		if (!building) {
			return STATE.APPROACH;
		}
		const dist = distanceTiles(ctx.x, ctx.y, building.x, building.y);
		if (dist > ctx.attackRange) {
			return STATE.APPROACH;
		}
		ctx.requestDrain(building.entityId);
		return null;
	}
	exit() {}
}

/** Siphon Drone: retreat when damaged. */
export class RetreatState implements AIState {
	name = STATE.RETREAT as StateName;
	enter(ctx: AIContext) {
		if (ctx.nearestEnemy) {
			const dx = ctx.x - ctx.nearestEnemy.x;
			const dy = ctx.y - ctx.nearestEnemy.y;
			const len = Math.max(distanceTiles(0, 0, dx, dy), 0.001);
			ctx.requestMoveTo(Math.round(ctx.x + (dx / len) * 8), Math.round(ctx.y + (dy / len) * 8));
		}
	}
	execute(ctx: AIContext): StateName | null {
		if (ctx.hp >= ctx.maxHp * 0.7) {
			return STATE.APPROACH;
		}
		if (!ctx.nearestEnemy || ctx.distanceToNearestEnemy > ctx.visionRadius * 2) {
			return STATE.IDLE;
		}
		return null;
	}
	exit() {}
}

// ---------------------------------------------------------------------------
// Registry: all states by name
// ---------------------------------------------------------------------------

export const ALL_STATES: Record<StateName, AIState> = {
	[STATE.IDLE]: new IdleState(),
	[STATE.PATROL]: new PatrolState(),
	[STATE.ALERT]: new AlertState(),
	[STATE.CHASE]: new ChaseState(),
	[STATE.ATTACK]: new AttackState(),
	[STATE.FLEE]: new FleeState(),
	[STATE.AMBUSH]: new AmbushState(),
	[STATE.SIGNAL]: new SignalState(),
	[STATE.SPOT]: new SpotState(),
	[STATE.SNIPE]: new SnipeState(),
	[STATE.ENGAGE]: new EngageState(),
	[STATE.BERSERK]: new BerserkState(),
	[STATE.APPROACH]: new ApproachState(),
	[STATE.DRAIN]: new DrainState(),
	[STATE.RETREAT]: new RetreatState(),
};
