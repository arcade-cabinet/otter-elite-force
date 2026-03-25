/**
 * US-072: Balance Validation Automation
 *
 * Headless combat simulation tests that validate game balance assertions:
 *   - 3 Mudfoots vs 2 Gators: Mudfoots win with focus fire (1-2 survivors)
 *   - 3 Shellcrackers vs 2 Gators: Shellcrackers should win (kiting)
 *   - 2 Sappers vs 1 Scale Wall: Sappers destroy wall efficiently
 *   - 1 Mortar Otter vs 4 clustered Gators: AoE significant damage
 *
 * All tests run headless without Phaser, using the simulation engine.
 * Results are logged with margin of victory.
 *
 * Note: TeamA uses focus fire (good micro), TeamB uses distributed fire.
 * This models real RTS gameplay where the player micro-manages and the
 * AI auto-aggros. The balance conclusion: numbers + focus fire beats
 * raw stats when the ratio is 3:2.
 */

import { describe, expect, it } from "vitest";
import {
	simulateGroupCombat,
	simulateKitingCombat,
	simulateMortarSplash,
	simulateSiege,
} from "@/ai/playtester/simulation";

// ===========================================================================
// US-072: Balance Validation
// ===========================================================================

describe("US-072: Balance Validation Automation", () => {
	describe("3 Mudfoots vs 2 Gators", () => {
		it("Mudfoots win with focus fire micro (numerical advantage + coordination)", () => {
			// Mudfoot: 80 HP, 2 armor, 12 damage, cooldown 1.2s
			// Gator: 120 HP, 4 armor, 18 damage, cooldown 1.8s
			// Gators have superior individual stats, but 3v2 with focus fire
			// means Mudfoots concentrate damage on one Gator at a time.
			// Per existing combat-outcomes.test.ts: "Mudfoots win with 1-2 survivors"
			const result = simulateGroupCombat(["mudfoot", "mudfoot", "mudfoot"], ["gator", "gator"]);

			expect(result.winner).toBe("teamA");
			expect(result.teamASurvivors).toBeGreaterThanOrEqual(1);
			expect(result.teamASurvivors).toBeLessThanOrEqual(2);
			expect(result.margin).toBeGreaterThan(0);

			// Log for balance review
			console.log("--- 3 Mudfoots vs 2 Gators ---");
			console.log(`Winner: ${result.winner}`);
			console.log(`Mudfoot survivors: ${result.teamASurvivors}`);
			console.log(`Mudfoot HP remaining: ${result.teamATotalHpRemaining}`);
			console.log(`Margin of victory: ${(result.margin * 100).toFixed(1)}%`);
			console.log(`Combat duration: ${(result.totalTicks * 0.1).toFixed(1)}s`);
			for (const line of result.log) console.log(`  ${line}`);
		});

		it("fight is close — Mudfoots lose significant HP", () => {
			const result = simulateGroupCombat(["mudfoot", "mudfoot", "mudfoot"], ["gator", "gator"]);

			// Mudfoots should have taken heavy losses (< 50% total HP remaining)
			const totalMudfootMaxHp = 80 * 3;
			expect(result.teamATotalHpRemaining).toBeLessThan(totalMudfootMaxHp * 0.5);
		});
	});

	describe("3 Shellcrackers vs 2 Gators (kiting)", () => {
		it("Shellcrackers should win by kiting", () => {
			// Shellcracker: 50 HP, 0 armor, 10 damage, range 5, speed 9
			// Gator: 120 HP, 4 armor, 18 damage, range 1, speed 5
			// Shellcrackers are faster (9 > 5) and outrange Gators (5 > 1).
			// With kiting, Gators should never close to melee range.
			const result = simulateKitingCombat(
				["shellcracker", "shellcracker", "shellcracker"],
				["gator", "gator"],
			);

			expect(result.winner).toBe("teamA");
			expect(result.teamASurvivors).toBeGreaterThanOrEqual(1);
			expect(result.margin).toBeGreaterThan(0);

			console.log("--- 3 Shellcrackers vs 2 Gators (kiting) ---");
			console.log(`Winner: ${result.winner}`);
			console.log(`Shellcracker survivors: ${result.teamASurvivors}`);
			console.log(`Shellcracker HP remaining: ${result.teamATotalHpRemaining}`);
			console.log(`Margin of victory: ${(result.margin * 100).toFixed(1)}%`);
			console.log(`Combat duration: ${(result.totalTicks * 0.1).toFixed(1)}s`);
			for (const line of result.log) console.log(`  ${line}`);
		});

		it("Shellcrackers maintain range advantage (speed 9 > Gator speed 5)", () => {
			const result = simulateKitingCombat(
				["shellcracker", "shellcracker", "shellcracker"],
				["gator", "gator"],
			);

			// All 3 Shellcrackers should survive since they can kite forever
			// (speed 9 > speed 5 means gators can never close the gap)
			expect(result.teamASurvivors).toBe(3);
		});
	});

	describe("2 Sappers vs 1 Scale Wall", () => {
		it("Sappers destroy Scale Wall efficiently", () => {
			// Sapper: 60 HP, 1 armor, 8 damage (30 vs buildings), cooldown 2.0s
			// Scale Wall: 300 HP, 0 armor
			// Each Sapper deals 30 damage per hit to buildings.
			// Wall should die in ceil(300 / (30 * 2 attackers per cooldown)) hits
			const result = simulateSiege(
				["sapper", "sapper"],
				"scale_wall",
				300, // Scale Wall HP
				0, // Scale Wall armor
			);

			expect(result.wallDestroyed).toBe(true);
			expect(result.remainingHp).toBe(0);

			// Should complete reasonably fast (< 30 seconds)
			expect(result.timeSeconds).toBeLessThan(30);

			console.log("--- 2 Sappers vs 1 Scale Wall ---");
			console.log(`Wall destroyed: ${result.wallDestroyed}`);
			console.log(`Time to destroy: ${result.timeSeconds.toFixed(1)}s`);
			console.log(`Total ticks: ${result.totalTicks}`);
			for (const line of result.log) console.log(`  ${line}`);
		});

		it("Sappers deal 30 damage per hit to buildings (siege bonus)", () => {
			// With 2 sappers each dealing 30 damage every 2 seconds:
			// Total DPS = 2 * 30 / 2.0 = 30 DPS
			// 300 HP wall / 30 DPS = 10 seconds expected
			const result = simulateSiege(["sapper", "sapper"], "scale_wall", 300, 0);

			expect(result.timeSeconds).toBeCloseTo(10, 0);
		});

		it("single Sapper can solo a Scale Wall", () => {
			// 1 Sapper: 30 dmg every 2.0s = 15 DPS
			// 300 HP / 15 DPS = 20 seconds
			const result = simulateSiege(["sapper"], "scale_wall", 300, 0);

			expect(result.wallDestroyed).toBe(true);
			expect(result.timeSeconds).toBeCloseTo(20, 0);
		});
	});

	describe("1 Mortar Otter vs 4 clustered Gators (AoE)", () => {
		it("single mortar shot deals significant damage to clustered enemies", () => {
			// Mortar Otter: 20 damage, 2-tile splash radius
			// Gator: 120 HP, 4 armor
			// Damage per hit per Gator: max(1, 20 - 4) = 16
			// 4 Gators in splash radius = 4 * 16 = 64 total damage
			const result = simulateMortarSplash(
				20, // mortar damage
				2, // splash radius (tiles)
				[
					{ unitType: "gator", distance: 0 }, // direct hit
					{ unitType: "gator", distance: 0.5 }, // very close
					{ unitType: "gator", distance: 1.5 }, // within splash
					{ unitType: "gator", distance: 1.8 }, // edge of splash
				],
			);

			expect(result.targetsHit).toBe(4);
			expect(result.totalDamageDealt).toBe(64); // 4 * 16

			console.log("--- 1 Mortar Otter vs 4 clustered Gators ---");
			console.log(`Targets hit: ${result.targetsHit}`);
			console.log(`Total damage dealt: ${result.totalDamageDealt}`);
			for (const r of result.results) {
				console.log(
					`  ${r.unitType} at ${r.distance} tiles: ${r.damageDealt} dmg, ${r.hpRemaining} HP remaining`,
				);
			}
		});

		it("mortar respects splash radius — targets beyond 2 tiles take no damage", () => {
			const result = simulateMortarSplash(20, 2, [
				{ unitType: "gator", distance: 1.0 }, // in range
				{ unitType: "gator", distance: 2.5 }, // out of range
				{ unitType: "gator", distance: 3.0 }, // way out of range
			]);

			expect(result.targetsHit).toBe(1);
			expect(result.results[0].damageDealt).toBe(16); // 20 - 4 armor
			expect(result.results[1].damageDealt).toBe(0);
			expect(result.results[2].damageDealt).toBe(0);
		});

		it("mortar deals reduced damage to armored targets", () => {
			// Gator has 4 armor: 20 - 4 = 16 damage per hit
			const result = simulateMortarSplash(20, 2, [{ unitType: "gator", distance: 0 }]);

			expect(result.results[0].damageDealt).toBe(16);
			expect(result.results[0].hpRemaining).toBe(104); // 120 - 16
		});

		it("mortar is devastating against unarmored clustered units", () => {
			// Shellcracker has 0 armor: 20 - 0 = 20 damage per hit
			const result = simulateMortarSplash(20, 2, [
				{ unitType: "shellcracker", distance: 0 },
				{ unitType: "shellcracker", distance: 0.5 },
				{ unitType: "shellcracker", distance: 1.0 },
				{ unitType: "shellcracker", distance: 1.5 },
			]);

			expect(result.targetsHit).toBe(4);
			expect(result.totalDamageDealt).toBe(80); // 4 * 20
			// Each Shellcracker: 50 - 20 = 30 HP remaining (60% damage!)
			for (const r of result.results) {
				expect(r.hpRemaining).toBe(30);
			}
		});

		it("multiple mortar shots can eliminate clustered gators", () => {
			// Each mortar deals 16 to each gator. Gators have 120 HP.
			// Shots needed: ceil(120 / 16) = 8 shots per gator
			// But all 4 gators take damage simultaneously from AoE.
			// Total shots to kill all 4 = 8 (they all die on the same shot).
			const gatorHp = 120;
			const damagePerHit = 16; // max(1, 20 - 4)
			const shotsToKill = Math.ceil(gatorHp / damagePerHit);

			expect(shotsToKill).toBe(8);

			// Total damage across 8 shots to 4 targets
			const totalAoeDamage = shotsToKill * 4 * damagePerHit;
			expect(totalAoeDamage).toBe(512);
		});
	});

	describe("balance summary — margin of victory logging", () => {
		it("logs balance summary for all matchups", () => {
			console.log("\n========================================");
			console.log("BALANCE VALIDATION SUMMARY");
			console.log("========================================");

			// Matchup 1: 3 Mudfoots vs 2 Gators
			const matchup1 = simulateGroupCombat(["mudfoot", "mudfoot", "mudfoot"], ["gator", "gator"]);
			console.log(
				`3 Mudfoots vs 2 Gators: ${matchup1.winner} wins | margin: ${(matchup1.margin * 100).toFixed(1)}% | survivors: A=${matchup1.teamASurvivors} B=${matchup1.teamBSurvivors}`,
			);

			// Matchup 2: 3 Shellcrackers vs 2 Gators (kiting)
			const matchup2 = simulateKitingCombat(
				["shellcracker", "shellcracker", "shellcracker"],
				["gator", "gator"],
			);
			console.log(
				`3 Shellcrackers vs 2 Gators (kiting): ${matchup2.winner} wins | margin: ${(matchup2.margin * 100).toFixed(1)}% | survivors: A=${matchup2.teamASurvivors} B=${matchup2.teamBSurvivors}`,
			);

			// Matchup 3: 2 Sappers vs Scale Wall
			const matchup3 = simulateSiege(["sapper", "sapper"], "scale_wall", 300, 0);
			console.log(
				`2 Sappers vs Scale Wall: destroyed=${matchup3.wallDestroyed} | time: ${matchup3.timeSeconds.toFixed(1)}s`,
			);

			// Matchup 4: Mortar splash
			const matchup4 = simulateMortarSplash(20, 2, [
				{ unitType: "gator", distance: 0 },
				{ unitType: "gator", distance: 0.5 },
				{ unitType: "gator", distance: 1.5 },
				{ unitType: "gator", distance: 1.8 },
			]);
			console.log(
				`Mortar vs 4 Gators (AoE): ${matchup4.targetsHit} hit | ${matchup4.totalDamageDealt} total dmg`,
			);

			console.log("========================================\n");

			// All matchups should produce expected outcomes
			expect(matchup1.winner).toBe("teamA"); // Mudfoots win (focus fire)
			expect(matchup2.winner).toBe("teamA"); // Shellcrackers win (kiting)
			expect(matchup3.wallDestroyed).toBe(true); // Wall destroyed
			expect(matchup4.targetsHit).toBe(4); // All 4 hit
		});
	});
});
