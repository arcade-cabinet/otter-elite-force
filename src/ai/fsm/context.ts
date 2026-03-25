/**
 * AI context interface — the bridge between Yuka FSM states and game state.
 *
 * Each AI-controlled entity carries an AIContext that states read/write
 * to make decisions. The Koota↔Yuka sync system populates this each frame.
 */

export interface EnemyInfo {
	entityId: number;
	x: number;
	y: number;
	hp: number;
	isBuilding: boolean;
}

export interface AIContext {
	/** This entity's Koota entity ID */
	entityId: number;

	/** Current tile position */
	x: number;
	y: number;

	/** Current health */
	hp: number;
	maxHp: number;

	/** Attack stats */
	attackDamage: number;
	attackRange: number;

	/** Vision radius in tiles */
	visionRadius: number;

	/** Enemies currently visible within vision radius */
	visibleEnemies: EnemyInfo[];

	/** Nearest visible enemy (null if none) */
	nearestEnemy: EnemyInfo | null;

	/** Distance to nearest enemy (Infinity if none) */
	distanceToNearestEnemy: number;

	/** Patrol waypoints (tile coordinates) */
	patrolWaypoints: Array<{ x: number; y: number }>;
	patrolIndex: number;

	/** Alert level: 0=calm, 1=suspicious, 2=alerted */
	alertLevel: number;

	/** Arbitrary state data (timers, counters, etc.) */
	stateData: Record<string, number>;

	/** Callback: request pathfinding to a tile */
	requestMoveTo: (x: number, y: number) => void;

	/** Callback: request attack on entity */
	requestAttack: (targetEntityId: number) => void;

	/** Callback: signal nearby allies (scout behavior) */
	requestSignalAllies: (x: number, y: number) => void;

	/** Callback: drain resources from building */
	requestDrain: (targetEntityId: number) => void;
}

/** Create a default AIContext with no-op callbacks (useful for testing). */
export function createDefaultAIContext(overrides: Partial<AIContext> = {}): AIContext {
	return {
		entityId: 0,
		x: 0,
		y: 0,
		hp: 100,
		maxHp: 100,
		attackDamage: 10,
		attackRange: 1,
		visionRadius: 5,
		visibleEnemies: [],
		nearestEnemy: null,
		distanceToNearestEnemy: Number.POSITIVE_INFINITY,
		patrolWaypoints: [],
		patrolIndex: 0,
		alertLevel: 0,
		stateData: {},
		requestMoveTo: () => {},
		requestAttack: () => {},
		requestSignalAllies: () => {},
		requestDrain: () => {},
		...overrides,
	};
}
