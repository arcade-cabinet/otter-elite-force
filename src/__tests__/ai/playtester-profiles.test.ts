/**
 * US-071: AI Playtester Strategy Profiles
 *
 * Tests that different strategy profiles produce different behavior:
 *   - Aggressive: prioritizes combat units and early attacks
 *   - Defensive: prioritizes walls/towers before advancing
 *   - Economic: prioritizes resource infrastructure before military
 *   - Each profile produces different build order
 *   - Profiles are selectable as parameter
 */

import { describe, expect, it } from "vitest";
import { BuildArmyGoal, BuildEconomyGoal, DefendBaseGoal } from "@/ai/playtester/goals";
import type { PlayerPerception } from "@/ai/playtester/perception";
import {
	createPlaytesterBrainWithProfile,
	STRATEGY_PROFILES,
	type StrategyProfileName,
} from "@/ai/playtester/profiles";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerception(overrides: Partial<PlayerPerception> = {}): PlayerPerception {
	return {
		viewport: { x: 0, y: 0, width: 800, height: 600 },
		exploredTiles: new Set<string>(),
		visibleTiles: new Set<string>(),
		resources: { fish: 200, timber: 200, salvage: 100 },
		population: { current: 4, max: 10 },
		selectedUnits: [],
		selectedBuildings: [],
		visibleFriendlyUnits: [],
		visibleEnemyUnits: [],
		visibleBuildings: [],
		visibleResources: [],
		minimapDots: [],
		gameTime: 0,
		mapCols: 30,
		mapRows: 30,
		...overrides,
	};
}

// ===========================================================================
// US-071: Strategy Profile Tests
// ===========================================================================

describe("US-071: AI Playtester Strategy Profiles", () => {
	describe("profile definitions", () => {
		it("defines 4 named profiles: balanced, aggressive, defensive, economic", () => {
			expect(Object.keys(STRATEGY_PROFILES)).toEqual(
				expect.arrayContaining(["balanced", "aggressive", "defensive", "economic"]),
			);
			expect(Object.keys(STRATEGY_PROFILES)).toHaveLength(4);
		});

		it("each profile has name, description, and 5 bias values", () => {
			for (const [key, profile] of Object.entries(STRATEGY_PROFILES)) {
				expect(profile.name).toBe(key);
				expect(profile.description).toBeTruthy();
				expect(Object.keys(profile.biases)).toEqual(
					expect.arrayContaining(["survive", "economy", "military", "objective", "exploration"]),
				);
			}
		});

		it("all bias values are positive numbers", () => {
			for (const profile of Object.values(STRATEGY_PROFILES)) {
				for (const [_key, value] of Object.entries(profile.biases)) {
					expect(value).toBeGreaterThan(0);
					expect(typeof value).toBe("number");
				}
			}
		});
	});

	describe("createPlaytesterBrainWithProfile", () => {
		const profileNames: StrategyProfileName[] = ["balanced", "aggressive", "defensive", "economic"];

		it.each(profileNames)("creates a brain with 5 evaluators for profile: %s", (profileName) => {
			const brain = createPlaytesterBrainWithProfile(profileName);
			expect(brain.evaluators).toHaveLength(5);
		});

		it("defaults to balanced profile when no argument given", () => {
			const brain = createPlaytesterBrainWithProfile();
			expect(brain.evaluators).toHaveLength(5);
			// Balanced biases
			expect(brain.evaluators[0].characterBias).toBe(STRATEGY_PROFILES.balanced.biases.survive);
			expect(brain.evaluators[1].characterBias).toBe(STRATEGY_PROFILES.balanced.biases.economy);
		});
	});

	describe("aggressive profile", () => {
		it("has higher military bias than economy bias", () => {
			const profile = STRATEGY_PROFILES.aggressive;
			expect(profile.biases.military).toBeGreaterThan(profile.biases.economy);
		});

		it("has higher objective bias than balanced economic bias", () => {
			const profile = STRATEGY_PROFILES.aggressive;
			expect(profile.biases.objective).toBeGreaterThan(profile.biases.economy);
		});

		it("prioritizes army building when barracks exists and few military", () => {
			const brain = createPlaytesterBrainWithProfile("aggressive");
			const perception = makePerception({
				visibleBuildings: [
					{
						entityId: 1,
						unitType: "barracks",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 350,
						maxHp: 350,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleFriendlyUnits: [
					{
						entityId: 2,
						unitType: "mudfoot",
						faction: "ura",
						tileX: 6,
						tileY: 5,
						hp: 80,
						maxHp: 80,
						armor: 2,
						damage: 12,
						range: 1,
						speed: 8,
						isGathering: false,
						hasOrders: false,
					},
				],
			});

			brain.arbitrate(perception);
			const current = brain.currentSubgoal();
			// Military evaluator: 0.7 (few military) * 1.2 (aggressive bias) = 0.84
			// Economy evaluator: 0.3 (baseline) * 0.5 (aggressive bias) = 0.15
			expect(current).toBeInstanceOf(BuildArmyGoal);
		});
	});

	describe("defensive profile", () => {
		it("has higher survive bias than balanced", () => {
			expect(STRATEGY_PROFILES.defensive.biases.survive).toBeGreaterThan(
				STRATEGY_PROFILES.balanced.biases.survive,
			);
		});

		it("has lower objective bias — waits before attacking", () => {
			expect(STRATEGY_PROFILES.defensive.biases.objective).toBeLessThan(
				STRATEGY_PROFILES.balanced.biases.objective,
			);
		});

		it("prioritizes base defense when enemies appear near base", () => {
			const brain = createPlaytesterBrainWithProfile("defensive");
			const perception = makePerception({
				visibleBuildings: [
					{
						entityId: 1,
						unitType: "command_post",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 600,
						maxHp: 600,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleEnemyUnits: [
					{
						entityId: 2,
						unitType: "gator",
						faction: "scale_guard",
						tileX: 7,
						tileY: 5,
						hp: 120,
						maxHp: 120,
						armor: 4,
						damage: 18,
						range: 1,
						speed: 5,
						isGathering: false,
						hasOrders: false,
					},
				],
			});

			brain.arbitrate(perception);
			const current = brain.currentSubgoal();
			// Survive evaluator: 1.0 * 1.2 (defensive bias) = 1.2
			expect(current).toBeInstanceOf(DefendBaseGoal);
		});
	});

	describe("economic profile", () => {
		it("has highest economy bias among all profiles", () => {
			const economicBias = STRATEGY_PROFILES.economic.biases.economy;
			expect(economicBias).toBeGreaterThan(STRATEGY_PROFILES.balanced.biases.economy);
			expect(economicBias).toBeGreaterThan(STRATEGY_PROFILES.aggressive.biases.economy);
			expect(economicBias).toBeGreaterThan(STRATEGY_PROFILES.defensive.biases.economy);
		});

		it("has lowest military bias among all profiles", () => {
			const economicMilitary = STRATEGY_PROFILES.economic.biases.military;
			expect(economicMilitary).toBeLessThanOrEqual(STRATEGY_PROFILES.balanced.biases.military);
			expect(economicMilitary).toBeLessThanOrEqual(STRATEGY_PROFILES.aggressive.biases.military);
			expect(economicMilitary).toBeLessThanOrEqual(STRATEGY_PROFILES.defensive.biases.military);
		});

		it("prioritizes economy over army when workers are idle", () => {
			const brain = createPlaytesterBrainWithProfile("economic");
			const perception = makePerception({
				visibleFriendlyUnits: [
					{
						entityId: 1,
						unitType: "river_rat",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 40,
						maxHp: 40,
						armor: 0,
						damage: 5,
						range: 1,
						speed: 10,
						isGathering: false,
						hasOrders: false,
					},
				],
				visibleBuildings: [
					{
						entityId: 2,
						unitType: "barracks",
						faction: "ura",
						tileX: 10,
						tileY: 10,
						hp: 350,
						maxHp: 350,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleResources: [
					{ entityId: 10, resourceType: "fish", tileX: 8, tileY: 5, remaining: 100 },
				],
			});

			brain.arbitrate(perception);
			const current = brain.currentSubgoal();
			// Economy: 0.8 (idle workers) * 1.3 (economic bias) = 1.04
			// Military: 0.7 (few military, has barracks) * 0.5 (economic bias) = 0.35
			expect(current).toBeInstanceOf(BuildEconomyGoal);
		});
	});

	describe("different profiles produce different build orders", () => {
		it("aggressive and economic profiles choose different goals in the same situation", () => {
			const perception = makePerception({
				visibleFriendlyUnits: [
					{
						entityId: 1,
						unitType: "river_rat",
						faction: "ura",
						tileX: 5,
						tileY: 5,
						hp: 40,
						maxHp: 40,
						armor: 0,
						damage: 5,
						range: 1,
						speed: 10,
						isGathering: false,
						hasOrders: false,
					},
					{
						entityId: 2,
						unitType: "mudfoot",
						faction: "ura",
						tileX: 6,
						tileY: 5,
						hp: 80,
						maxHp: 80,
						armor: 2,
						damage: 12,
						range: 1,
						speed: 8,
						isGathering: false,
						hasOrders: false,
					},
				],
				visibleBuildings: [
					{
						entityId: 10,
						unitType: "barracks",
						faction: "ura",
						tileX: 10,
						tileY: 10,
						hp: 350,
						maxHp: 350,
						isTraining: false,
						queueLength: 0,
					},
				],
				visibleResources: [
					{ entityId: 20, resourceType: "timber", tileX: 3, tileY: 3, remaining: 200 },
				],
			});

			const aggressiveBrain = createPlaytesterBrainWithProfile("aggressive");
			aggressiveBrain.arbitrate(perception);
			const aggressiveGoal = aggressiveBrain.currentSubgoal();

			const economicBrain = createPlaytesterBrainWithProfile("economic");
			economicBrain.arbitrate(perception);
			const economicGoal = economicBrain.currentSubgoal();

			// Aggressive should pick military, economic should pick economy
			expect(aggressiveGoal?.constructor.name).not.toBe(economicGoal?.constructor.name);
		});

		it("all four profiles produce brains with distinct evaluator weights", () => {
			const profiles: StrategyProfileName[] = ["balanced", "aggressive", "defensive", "economic"];
			const biasSignatures = new Set<string>();

			for (const name of profiles) {
				const brain = createPlaytesterBrainWithProfile(name);
				const signature = brain.evaluators.map((e) => e.characterBias.toFixed(2)).join(",");
				biasSignatures.add(signature);
			}

			// Each profile should produce a unique set of biases
			expect(biasSignatures.size).toBe(4);
		});
	});
});
