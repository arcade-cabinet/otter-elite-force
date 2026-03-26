/**
 * Skirmish AI — Goal-based decision loop for AI opponent in Skirmish mode.
 *
 * Sits above unit-level FSMs (FSMRunner) and dispatches high-level orders:
 *   1. Build workers until target count
 *   2. Send workers to gather
 *   3. Build Spawning Pool (barracks) when affordable
 *   4. Scout with early units
 *   5. Train army with ~60% melee / 40% ranged mix
 *   6. Expand (second base) when army > threshold
 *   7. Attack when army reaches threshold (varies by difficulty)
 *
 * Difficulty tiers (US-080):
 *   Easy:   5s think, no bonus, high attack threshold, slow/small/predictable
 *   Medium: 3s think, +10% resources, moderate attack threshold
 *   Hard:   1s think, +25% resources, lower attack threshold
 *   Brutal: instant, +50% resources, low attack threshold, multi-prong attacks
 *
 * Win condition: destroy enemy Command Post.
 *
 * The AI communicates with the game world exclusively through a GameAdapter
 * interface, keeping it testable without Koota dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkirmishDifficulty = "easy" | "medium" | "hard" | "brutal";

export type SkirmishPhase = "economy" | "military" | "attack";

export interface SkirmishState {
	thinkTimer: number;
	phase: SkirmishPhase;
	attackCooldown: number;
	/** Whether the AI has sent a scout unit to explore. */
	hasScouted: boolean;
}

export interface DifficultyConfig {
	thinkInterval: number;
	resourceBonus: number;
	/** Army size required before the AI launches its first attack. */
	attackThreshold: number;
	/** Whether the AI sends a scout unit early in the game. */
	scoutsEarly: boolean;
	/** Whether Brutal-level multi-prong attack is used. */
	multiProngAttack: boolean;
}

export interface GameAdapter {
	/** Number of worker units (skinks) the AI controls. */
	getWorkerCount(): number;
	/** Number of combat units the AI controls. */
	getArmyCount(): number;
	/** Melee vs ranged breakdown of the army. */
	getArmyComposition(): { melee: number; ranged: number };
	/** Count of a specific building type. */
	getBuildingCount(buildingType: string): number;
	/** Whether at least one of this building type exists. */
	hasBuilding(buildingType: string): boolean;
	/** Current resource pool. */
	getResources(): { fish: number; timber: number; salvage: number };
	/** Current and max population. */
	getPopulation(): { current: number; max: number };
	/** Queue a unit for training. Returns true if successful. */
	trainUnit(unitType: string): boolean;
	/** Place a building at coordinates. Returns true if successful. */
	placeBuilding(buildingType: string, x: number, y: number): boolean;
	/** Order all army units to attack-move toward a position. */
	sendAttack(x: number, y: number): void;
	/** Order idle workers to gather resources. */
	sendGather(): void;
	/** Send a scout unit to explore the map. */
	sendScout(x: number, y: number): void;
	/** Get the enemy (player) base position for attack targeting. */
	getEnemyBasePosition(): { x: number; y: number };
	/** Get a valid build position for a new building. */
	getBuildPosition(buildingType?: string): { x: number; y: number };
	/** Check whether the enemy Command Post has been destroyed (win condition). */
	isEnemyCommandPostDestroyed(): boolean;
	/** Check whether our own Command Post has been destroyed (lose condition). */
	isOwnCommandPostDestroyed(): boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_TARGET = 5;
const WORKERS_BEFORE_BARRACKS = 3;
const ARMY_EXPAND_THRESHOLD = 10;
const ATTACK_COOLDOWN = 30; // seconds between attack waves
const MAX_BASES = 2;
const MELEE_RATIO = 0.6;

/** Scale-Guard unit types */
const WORKER_UNIT = "skink";
const MELEE_UNIT = "gator";
const RANGED_UNIT = "viper";
// const _SCOUT_UNIT = "scout_lizard"; // reserved for future scouting behavior
const TOWN_HALL = "sludge_pit";
const BARRACKS = "spawning_pool";

export const DIFFICULTY_CONFIG: Record<SkirmishDifficulty, DifficultyConfig> = {
	easy: {
		thinkInterval: 5,
		resourceBonus: 0,
		attackThreshold: 20,
		scoutsEarly: false,
		multiProngAttack: false,
	},
	medium: {
		thinkInterval: 3,
		resourceBonus: 0.1,
		attackThreshold: 15,
		scoutsEarly: true,
		multiProngAttack: false,
	},
	hard: {
		thinkInterval: 1,
		resourceBonus: 0.25,
		attackThreshold: 12,
		scoutsEarly: true,
		multiProngAttack: false,
	},
	brutal: {
		thinkInterval: 0,
		resourceBonus: 0.5,
		attackThreshold: 10,
		scoutsEarly: true,
		multiProngAttack: true,
	},
};

// ---------------------------------------------------------------------------
// SkirmishAI
// ---------------------------------------------------------------------------

export class SkirmishAI {
	readonly difficulty: SkirmishDifficulty;
	private adapter: GameAdapter;
	private config: DifficultyConfig;
	private state: SkirmishState;

	constructor(difficulty: SkirmishDifficulty, adapter: GameAdapter) {
		this.difficulty = difficulty;
		this.adapter = adapter;
		this.config = DIFFICULTY_CONFIG[difficulty];
		this.state = {
			thinkTimer: 0,
			phase: "economy",
			attackCooldown: 0,
			hasScouted: false,
		};
	}

	/** Get a snapshot of the AI's internal state (for testing / debugging). */
	getState(): SkirmishState {
		return { ...this.state };
	}

	/**
	 * Main update — called every game tick with delta in seconds.
	 * Accumulates time, then runs the decision loop when the think interval elapses.
	 */
	update(delta: number): void {
		this.state.thinkTimer += delta;

		// Tick down attack cooldown
		if (this.state.attackCooldown > 0) {
			this.state.attackCooldown -= delta;
		}

		// Gate decisions behind think interval
		if (this.state.thinkTimer < this.config.thinkInterval) {
			return;
		}

		// Reset timer (keep remainder for accuracy)
		this.state.thinkTimer -= this.config.thinkInterval;

		this.think();
	}

	/**
	 * Core decision loop — evaluates game state and issues orders.
	 */
	private think(): void {
		const workerCount = this.adapter.getWorkerCount();
		const armyCount = this.adapter.getArmyCount();
		const pop = this.adapter.getPopulation();

		// Always send idle workers to gather
		this.adapter.sendGather();

		// Scout with early units if difficulty calls for it
		if (this.config.scoutsEarly && !this.state.hasScouted && armyCount >= 1) {
			const target = this.adapter.getEnemyBasePosition();
			this.adapter.sendScout(target.x, target.y);
			this.state.hasScouted = true;
		}

		// Phase evaluation: determine current phase based on game state
		this.evaluatePhase(workerCount, armyCount);

		switch (this.state.phase) {
			case "economy":
				this.economyDecisions(workerCount);
				break;
			case "military":
				this.militaryDecisions(workerCount, armyCount, pop);
				break;
			case "attack":
				this.attackDecisions();
				break;
		}
	}

	/**
	 * Evaluate and transition phases based on game state.
	 */
	private evaluatePhase(workerCount: number, armyCount: number): void {
		const threshold = this.config.attackThreshold;

		if (this.state.phase === "attack") {
			// Stay in attack phase until cooldown expires and army is depleted
			if (this.state.attackCooldown <= 0 && armyCount <= threshold) {
				this.state.phase = "military";
			}
			return;
		}

		// Transition: economy → military when we have enough workers + barracks
		if (
			this.state.phase === "economy" &&
			workerCount >= WORKER_TARGET &&
			this.adapter.hasBuilding(BARRACKS)
		) {
			this.state.phase = "military";
		}

		// Transition: military → attack when army is large enough
		if (this.state.phase === "military" && armyCount > threshold) {
			this.state.phase = "attack";
		}
	}

	/**
	 * Economy phase: train workers, build barracks.
	 */
	private economyDecisions(workerCount: number): void {
		// Priority 1: Train workers up to target
		if (workerCount < WORKER_TARGET && this.adapter.hasBuilding(TOWN_HALL)) {
			this.adapter.trainUnit(WORKER_UNIT);
		}

		// Priority 2: Build barracks when we have enough workers
		if (workerCount >= WORKERS_BEFORE_BARRACKS && !this.adapter.hasBuilding(BARRACKS)) {
			const pos = this.adapter.getBuildPosition(BARRACKS);
			this.adapter.placeBuilding(BARRACKS, pos.x, pos.y);
		}
	}

	/**
	 * Military phase: train army, consider expansion.
	 */
	private militaryDecisions(
		workerCount: number,
		armyCount: number,
		pop: { current: number; max: number },
	): void {
		// Still train workers if below target
		if (workerCount < WORKER_TARGET && this.adapter.hasBuilding(TOWN_HALL)) {
			this.adapter.trainUnit(WORKER_UNIT);
			return;
		}

		// Check population before training
		if (pop.current >= pop.max) {
			return;
		}

		// Expansion: build second base when army > threshold and only 1 base
		if (armyCount > ARMY_EXPAND_THRESHOLD && this.adapter.getBuildingCount(TOWN_HALL) < MAX_BASES) {
			const pos = this.adapter.getBuildPosition(TOWN_HALL);
			this.adapter.placeBuilding(TOWN_HALL, pos.x, pos.y);
		}

		// Train army: maintain ~60% melee / 40% ranged
		if (this.adapter.hasBuilding(BARRACKS)) {
			const comp = this.adapter.getArmyComposition();
			const total = comp.melee + comp.ranged;
			const meleeRatio = total > 0 ? comp.melee / total : 0;

			if (meleeRatio < MELEE_RATIO) {
				this.adapter.trainUnit(MELEE_UNIT);
			} else {
				this.adapter.trainUnit(RANGED_UNIT);
			}
		}
	}

	/**
	 * Attack phase: send army to enemy base, then cooldown.
	 * Brutal difficulty uses multi-prong attacks (offset targets).
	 */
	private attackDecisions(): void {
		if (this.state.attackCooldown <= 0) {
			const target = this.adapter.getEnemyBasePosition();
			this.adapter.sendAttack(target.x, target.y);

			// Brutal: send a second attack wave offset from the main target
			if (this.config.multiProngAttack) {
				this.adapter.sendAttack(target.x + 5, target.y + 5);
			}

			this.state.attackCooldown = ATTACK_COOLDOWN;
		}

		// Continue training during attack
		const pop = this.adapter.getPopulation();
		if (pop.current < pop.max && this.adapter.hasBuilding(BARRACKS)) {
			const comp = this.adapter.getArmyComposition();
			const total = comp.melee + comp.ranged;
			const meleeRatio = total > 0 ? comp.melee / total : 0;

			if (meleeRatio < MELEE_RATIO) {
				this.adapter.trainUnit(MELEE_UNIT);
			} else {
				this.adapter.trainUnit(RANGED_UNIT);
			}
		}
	}
}
