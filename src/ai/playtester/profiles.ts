/**
 * AI Playtester Strategy Profiles (US-071)
 *
 * Defines configurable strategy profiles that bias the GOAP evaluators.
 * Each profile adjusts the characterBias on each evaluator to produce
 * different build orders and playstyles:
 *
 *   - Aggressive: prioritizes combat units and early attacks
 *   - Defensive: prioritizes walls/towers before advancing
 *   - Economic: prioritizes resource infrastructure before military
 *
 * Usage:
 *   const brain = createPlaytesterBrainWithProfile("aggressive");
 */

import {
	EconomyEvaluator,
	ExplorationEvaluator,
	MilitaryEvaluator,
	ObjectiveEvaluator,
	PlaytesterBrain,
	SurviveEvaluator,
} from "./goals";

// ---------------------------------------------------------------------------
// Profile types
// ---------------------------------------------------------------------------

export type StrategyProfileName = "balanced" | "aggressive" | "defensive" | "economic";

export interface StrategyProfile {
	name: StrategyProfileName;
	description: string;
	/** Bias multipliers for each evaluator (applied to characterBias). */
	biases: {
		survive: number;
		economy: number;
		military: number;
		objective: number;
		exploration: number;
	};
}

// ---------------------------------------------------------------------------
// Predefined profiles
// ---------------------------------------------------------------------------

export const STRATEGY_PROFILES: Record<StrategyProfileName, StrategyProfile> = {
	balanced: {
		name: "balanced",
		description: "Standard play: even mix of economy, military, and objectives",
		biases: {
			survive: 1.0,
			economy: 0.9,
			military: 0.8,
			objective: 0.7,
			exploration: 0.5,
		},
	},

	aggressive: {
		name: "aggressive",
		description: "Rush: prioritizes combat units and early attacks over economy",
		biases: {
			survive: 1.0,
			economy: 0.5, // Minimal economy — just enough to sustain
			military: 1.2, // Build army ASAP
			objective: 1.0, // Push objectives early
			exploration: 0.3, // Scout only when nothing else to do
		},
	},

	defensive: {
		name: "defensive",
		description: "Turtle: prioritizes walls/towers before advancing",
		biases: {
			survive: 1.2, // Extra-vigilant about base defense
			economy: 1.0, // Strong economy to fund defenses
			military: 0.6, // Build army slowly
			objective: 0.4, // Wait until overwhelming force
			exploration: 0.6, // Moderate scouting
		},
	},

	economic: {
		name: "economic",
		description: "Boom: prioritizes resource infrastructure before military",
		biases: {
			survive: 1.0,
			economy: 1.3, // Maximum economic focus
			military: 0.5, // Late military buildup
			objective: 0.3, // Push objectives only when ready
			exploration: 0.7, // Scout for resource locations
		},
	},
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a PlaytesterBrain with evaluator biases set by the named profile.
 *
 * The profile modifies each evaluator's characterBias, which is multiplied
 * against the raw desirability score during arbitration. Higher bias = more
 * likely to be selected as the active goal.
 */
export function createPlaytesterBrainWithProfile(
	profileName: StrategyProfileName = "balanced",
): PlaytesterBrain {
	const profile = STRATEGY_PROFILES[profileName];
	const brain = new PlaytesterBrain();

	const survive = new SurviveEvaluator();
	survive.characterBias = profile.biases.survive;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = profile.biases.economy;
	brain.addEvaluator(economy);

	const military = new MilitaryEvaluator();
	military.characterBias = profile.biases.military;
	brain.addEvaluator(military);

	const objective = new ObjectiveEvaluator();
	objective.characterBias = profile.biases.objective;
	brain.addEvaluator(objective);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = profile.biases.exploration;
	brain.addEvaluator(exploration);

	return brain;
}
