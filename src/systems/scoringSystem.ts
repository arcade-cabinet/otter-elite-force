/**
 * Scoring System — calculates Bronze/Silver/Gold star ratings for missions.
 *
 * Formula (per spec §13):
 *   time_score  (40%) — how fast the mission was completed vs par time
 *   units_lost  (30%) — ratio of units lost to units spawned
 *   bonus_score (30%) — fraction of bonus objectives completed
 *
 * Star thresholds:
 *   Gold   (3 stars) — total >= 90%
 *   Silver (2 stars) — total >= 75%
 *   Bronze (1 star)  — total >= 50%
 *   None   (0 stars) — total < 50%
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MissionScoreInput {
	/** Seconds elapsed from mission start to completion. */
	elapsedSeconds: number;
	/** Par time in seconds — expected "good" completion time per mission. */
	parTimeSeconds: number;
	/** Total non-hero units lost during the mission. */
	unitsLost: number;
	/** Total non-hero units spawned/trained during the mission. */
	unitsSpawned: number;
	/** Number of bonus objectives completed. */
	bonusCompleted: number;
	/** Total number of bonus objectives in the mission. */
	bonusTotal: number;
}

export interface MissionScoreResult {
	/** Raw time sub-score (0..1). */
	timeScore: number;
	/** Raw units-lost sub-score (0..1). */
	unitsLostScore: number;
	/** Raw bonus sub-score (0..1). */
	bonusScore: number;
	/** Weighted total score (0..1). */
	totalScore: number;
	/** Star rating: 0 | 1 | 2 | 3. */
	stars: number;
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const TIME_WEIGHT = 0.4;
const UNITS_WEIGHT = 0.3;
const BONUS_WEIGHT = 0.3;

// ---------------------------------------------------------------------------
// Sub-score calculators
// ---------------------------------------------------------------------------

/**
 * Time score: 1.0 if at or under par, degrades as par/elapsed ratio.
 * Clamped to minimum 0.1 so extremely slow runs still get something.
 */
export function calculateTimeScore(elapsedSeconds: number, parTimeSeconds: number): number {
	if (parTimeSeconds <= 0 || elapsedSeconds <= 0) return 1.0;
	if (elapsedSeconds <= parTimeSeconds) return 1.0;
	return Math.max(0.1, parTimeSeconds / elapsedSeconds);
}

/**
 * Units lost score: 1.0 for no losses, linear degradation.
 * 0.0 if all units lost (or more due to edge cases).
 */
export function calculateUnitsLostScore(unitsLost: number, unitsSpawned: number): number {
	if (unitsSpawned <= 0) return 1.0;
	return Math.max(0.0, 1.0 - unitsLost / unitsSpawned);
}

/**
 * Bonus objectives score: fraction of bonus objectives completed.
 * 1.0 if mission has no bonus objectives (full marks by default).
 */
export function calculateBonusScore(bonusCompleted: number, bonusTotal: number): number {
	if (bonusTotal <= 0) return 1.0;
	return bonusCompleted / bonusTotal;
}

// ---------------------------------------------------------------------------
// Star rating
// ---------------------------------------------------------------------------

/** Convert a 0..1 score to a 0-3 star rating. */
export function getStarRating(totalScore: number): number {
	if (totalScore >= 0.9) return 3;
	if (totalScore >= 0.75) return 2;
	if (totalScore >= 0.5) return 1;
	return 0;
}

// ---------------------------------------------------------------------------
// Full calculation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MissionStats tracker — accumulates stats during gameplay
// ---------------------------------------------------------------------------

/**
 * Mutable stats tracker for an active mission. Call recording methods
 * as events happen (unit spawned, unit killed, bonus completed),
 * tick() each frame, then finalize() on mission complete.
 */
export class MissionStats {
	elapsedSeconds = 0;
	unitsSpawned = 0;
	unitsLost = 0;
	bonusCompleted = 0;
	parTimeSeconds: number;
	bonusTotal: number;

	constructor(parTimeSeconds: number, bonusTotal: number) {
		this.parTimeSeconds = parTimeSeconds;
		this.bonusTotal = bonusTotal;
	}

	/** Advance elapsed time by delta seconds. */
	tick(deltaSeconds: number): void {
		this.elapsedSeconds += deltaSeconds;
	}

	/** Record a non-hero unit being spawned/trained. */
	recordUnitSpawned(): void {
		this.unitsSpawned++;
	}

	/** Record a non-hero unit being killed. */
	recordUnitLost(): void {
		this.unitsLost++;
	}

	/** Record a bonus objective completed. Capped at bonusTotal. */
	recordBonusCompleted(): void {
		if (this.bonusCompleted < this.bonusTotal) {
			this.bonusCompleted++;
		}
	}

	/** Produce a MissionScoreInput snapshot for the calculator. */
	toScoreInput(): MissionScoreInput {
		return {
			elapsedSeconds: this.elapsedSeconds,
			parTimeSeconds: this.parTimeSeconds,
			unitsLost: this.unitsLost,
			unitsSpawned: this.unitsSpawned,
			bonusCompleted: this.bonusCompleted,
			bonusTotal: this.bonusTotal,
		};
	}

	/** Calculate the final mission score from accumulated stats. */
	finalize(): MissionScoreResult {
		return calculateMissionScore(this.toScoreInput());
	}

	/** Reset all counters for a new mission. */
	reset(parTimeSeconds: number, bonusTotal: number): void {
		this.elapsedSeconds = 0;
		this.unitsSpawned = 0;
		this.unitsLost = 0;
		this.bonusCompleted = 0;
		this.parTimeSeconds = parTimeSeconds;
		this.bonusTotal = bonusTotal;
	}
}

// ---------------------------------------------------------------------------
// Full calculation
// ---------------------------------------------------------------------------

/** Calculate the complete mission score from raw stats. */
export function calculateMissionScore(input: MissionScoreInput): MissionScoreResult {
	const timeScore = calculateTimeScore(input.elapsedSeconds, input.parTimeSeconds);
	const unitsLostScore = calculateUnitsLostScore(input.unitsLost, input.unitsSpawned);
	const bonusScore = calculateBonusScore(input.bonusCompleted, input.bonusTotal);

	const totalScore =
		timeScore * TIME_WEIGHT + unitsLostScore * UNITS_WEIGHT + bonusScore * BONUS_WEIGHT;

	return {
		timeScore,
		unitsLostScore,
		bonusScore,
		totalScore,
		stars: getStarRating(totalScore),
	};
}
