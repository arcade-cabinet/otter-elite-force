/**
 * Veterancy Progression Validation -- Task 5
 *
 * Simulates 100 combats and measures:
 *   - Average XP per engagement
 *   - Average kills needed for Veteran promotion (should be ~5)
 *   - Average kills for Elite (should be ~15)
 *   - Average kills for Hero (should be ~40)
 *   - Whether these are achievable within a single mission
 *
 * Uses actual GameWorld + combat + veterancy systems.
 */

import { describe, expect, it } from "vitest";
import { FACTION_IDS } from "@/engine/content/ids";
import { createSeedBundle } from "@/engine/random/seed";
import { runCombatSystem } from "@/engine/systems/combatSystem";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { resetLootRng } from "@/engine/systems/lootSystem";
import {
	awardXp,
	PROMOTION_THRESHOLDS,
	RANK_ELITE,
	RANK_HERO,
	RANK_NAMES,
	RANK_VETERAN,
	rankForXp,
	runVeterancySystem,
	XP_CONFIG,
} from "@/engine/systems/veterancySystem";
import {
	Armor,
	Attack,
	Faction,
	Flags,
	Health,
	Position,
	Speed,
	TargetRef,
	Veterancy,
	VisionRadius,
} from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	type GameWorld,
	spawnUnit,
} from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 16.67;

function createVeterancyTestWorld(): GameWorld {
	resetGatherTimers();
	resetLootRng();
	const seed = createSeedBundle({ phrase: "veterancy-test", source: "manual" });
	const world = createGameWorld(seed);
	world.session.phase = "playing";
	world.campaign.difficulty = "tactical";
	return world;
}

function spawnMudfoot(world: GameWorld, x: number, y: number, faction: string): number {
	return spawnUnit(world, {
		x,
		y,
		faction,
		unitType: "mudfoot",
		stats: {
			hp: 80,
			armor: 2,
			speed: 8,
			attackDamage: 12,
			attackRange: 1,
			attackCooldownMs: 1.2,
			visionRadius: 5,
			popCost: 1,
		},
	});
}

function spawnGator(world: GameWorld, x: number, y: number): number {
	return spawnUnit(world, {
		x,
		y,
		faction: "scale_guard",
		unitType: "gator",
		stats: {
			hp: 120,
			armor: 4,
			speed: 5,
			attackDamage: 18,
			attackRange: 1,
			attackCooldownMs: 1.8,
			visionRadius: 5,
			popCost: 1,
		},
	});
}

function spawnSkink(world: GameWorld, x: number, y: number): number {
	return spawnUnit(world, {
		x,
		y,
		faction: "scale_guard",
		unitType: "skink",
		stats: {
			hp: 35,
			armor: 0,
			speed: 9,
			attackDamage: 6,
			attackRange: 1,
			attackCooldownMs: 1.0,
			visionRadius: 5,
			popCost: 1,
		},
	});
}

/** Run a combat encounter until one side is dead. */
function runEncounterToCompletion(world: GameWorld, maxSeconds: number = 60): void {
	const maxTicks = Math.round((maxSeconds * 1000) / TICK_MS);
	for (let tick = 0; tick < maxTicks; tick++) {
		world.time.deltaMs = TICK_MS;
		world.time.elapsedMs += TICK_MS;
		world.time.tick++;

		runCombatSystem(world);
		runVeterancySystem(world);
		world.events.length = 0;
		flushRemovals(world);

		// Check if enemies are all dead
		let sgAlive = false;
		for (const eid of world.runtime.alive) {
			if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;
			if (Faction.id[eid] === FACTION_IDS.scale_guard && Health.current[eid] > 0) {
				sgAlive = true;
				break;
			}
		}
		if (!sgAlive) break;
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Veterancy Progression Validation (Task 5)", () => {
	describe("XP configuration", () => {
		it("should have correct XP values from config", () => {
			console.log("\n=== XP Configuration ===");
			console.log(`  Kill unit: ${XP_CONFIG.killUnit} XP`);
			console.log(`  Kill building: ${XP_CONFIG.killBuilding} XP`);
			console.log(`  Assist: ${XP_CONFIG.assistKill} XP`);
			console.log(`  Gather trip: ${XP_CONFIG.gatherTrip} XP`);
			console.log(`  Survive mission: ${XP_CONFIG.surviveMission} XP`);

			expect(XP_CONFIG.killUnit).toBe(10);
			expect(XP_CONFIG.killBuilding).toBe(25);
			expect(XP_CONFIG.assistKill).toBe(5);
		});

		it("should have correct promotion thresholds", () => {
			console.log("\n=== Promotion Thresholds ===");
			for (const threshold of PROMOTION_THRESHOLDS) {
				console.log(`  ${RANK_NAMES[threshold.rank]}: ${threshold.xp} XP`);
			}

			// Code thresholds
			expect(PROMOTION_THRESHOLDS[1].xp).toBe(50); // Veteran
			expect(PROMOTION_THRESHOLDS[2].xp).toBe(150); // Elite
			expect(PROMOTION_THRESHOLDS[3].xp).toBe(400); // Hero

			// Balance doc thresholds (from Part 7.3)
			// Doc says: Veteran=100, Elite=300, Hero=600
			// Code says: Veteran=50, Elite=150, Hero=400
			console.log("\n  Balance doc comparison:");
			console.log("  Rank     | Code | Doc  | Difference");
			console.log("  ---------+------+------+----------");
			console.log(
				`  Veteran  |  ${PROMOTION_THRESHOLDS[1].xp}  | 100  | ${PROMOTION_THRESHOLDS[1].xp - 100}`,
			);
			console.log(
				`  Elite    | ${PROMOTION_THRESHOLDS[2].xp}  | 300  | ${PROMOTION_THRESHOLDS[2].xp - 300}`,
			);
			console.log(
				`  Hero     | ${PROMOTION_THRESHOLDS[3].xp}  | 600  | ${PROMOTION_THRESHOLDS[3].xp - 600}`,
			);
		});
	});

	describe("Kills needed for each rank", () => {
		it("should calculate kills needed based on XP per kill", () => {
			const xpPerKill = XP_CONFIG.killUnit; // 10

			const killsForVeteran = Math.ceil(PROMOTION_THRESHOLDS[1].xp / xpPerKill);
			const killsForElite = Math.ceil(PROMOTION_THRESHOLDS[2].xp / xpPerKill);
			const killsForHero = Math.ceil(PROMOTION_THRESHOLDS[3].xp / xpPerKill);

			console.log("\n=== Kills Needed (pure kill XP only) ===");
			console.log(`  Veteran (${PROMOTION_THRESHOLDS[1].xp} XP): ${killsForVeteran} kills`);
			console.log(`  Elite (${PROMOTION_THRESHOLDS[2].xp} XP): ${killsForElite} kills`);
			console.log(`  Hero (${PROMOTION_THRESHOLDS[3].xp} XP): ${killsForHero} kills`);

			// Balance doc says: Veteran ~5 kills, Elite ~15 kills, Hero ~40 kills
			// With code thresholds (50/150/400) and 10 XP per kill:
			// Veteran: 5 kills, Elite: 15 kills, Hero: 40 kills
			// This matches the doc exactly
			console.log("\n  Balance doc target: Veteran ~5, Elite ~15, Hero ~40");
			console.log(
				`  Code actual: Veteran ${killsForVeteran}, Elite ${killsForElite}, Hero ${killsForHero}`,
			);

			expect(killsForVeteran).toBe(5);
			expect(killsForElite).toBe(15);
			expect(killsForHero).toBe(40);
		});
	});

	describe("XP accumulation in combat simulation", () => {
		it("should track XP through 100 sequential combats", () => {
			const world = createVeterancyTestWorld();

			// Spawn a persistent Mudfoot hero unit
			const heroMudfoot = spawnMudfoot(world, 100, 100, "ura");

			let totalKills = 0;
			let totalXp = 0;
			let veteranReachedAtKill = -1;
			let eliteReachedAtKill = -1;
			let heroReachedAtKill = -1;

			for (let engagement = 0; engagement < 100; engagement++) {
				// Heal the hero between fights
				Health.current[heroMudfoot] = Health.max[heroMudfoot];

				// Spawn a skink enemy (easy kill for accumulating XP)
				const skinkEid = spawnSkink(world, 132, 100);

				// Run the combat
				runEncounterToCompletion(world, 30);

				// Check if skink is dead
				if (!world.runtime.alive.has(skinkEid) || Health.current[skinkEid] <= 0) {
					totalKills++;
				}

				// Check XP
				const currentXp = Veterancy.xp[heroMudfoot];
				const currentRank = Veterancy.rank[heroMudfoot];

				if (veteranReachedAtKill === -1 && currentRank >= RANK_VETERAN) {
					veteranReachedAtKill = totalKills;
				}
				if (eliteReachedAtKill === -1 && currentRank >= RANK_ELITE) {
					eliteReachedAtKill = totalKills;
				}
				if (heroReachedAtKill === -1 && currentRank >= RANK_HERO) {
					heroReachedAtKill = totalKills;
				}

				totalXp = currentXp;
			}

			console.log("\n=== 100 Combat Simulation Results ===");
			console.log(`  Total kills: ${totalKills}`);
			console.log(`  Total XP: ${totalXp}`);
			console.log(`  Avg XP per engagement: ${(totalXp / 100).toFixed(1)}`);
			console.log(`  Final rank: ${RANK_NAMES[Veterancy.rank[heroMudfoot]]}`);
			console.log(`  Veteran reached at kill: ${veteranReachedAtKill}`);
			console.log(`  Elite reached at kill: ${eliteReachedAtKill}`);
			console.log(`  Hero reached at kill: ${heroReachedAtKill}`);

			// The combat system awards XP to the killer via damageAssists tracking
			// After 100 skink kills (10 XP each), should have 1000 XP -> Hero rank
			// Veteran at 50 XP = 5 kills, Elite at 150 XP = 15 kills, Hero at 400 XP = 40 kills
		});
	});

	describe("Direct XP award test", () => {
		it("should promote at correct thresholds via direct awardXp", () => {
			const world = createVeterancyTestWorld();
			const eid = spawnMudfoot(world, 100, 100, "ura");

			// Start at rank 0
			expect(Veterancy.rank[eid]).toBe(0);
			expect(rankForXp(0)).toBe(0);

			// Award XP incrementally
			awardXp(world, eid, 49);
			expect(Veterancy.rank[eid]).toBe(0); // Still Recruit

			awardXp(world, eid, 1); // Total: 50
			expect(Veterancy.rank[eid]).toBe(RANK_VETERAN);

			awardXp(world, eid, 100); // Total: 150
			expect(Veterancy.rank[eid]).toBe(RANK_ELITE);

			awardXp(world, eid, 250); // Total: 400
			expect(Veterancy.rank[eid]).toBe(RANK_HERO);

			console.log("\n=== Direct XP Award Test ===");
			console.log(`  50 XP -> ${RANK_NAMES[rankForXp(50)]}`);
			console.log(`  150 XP -> ${RANK_NAMES[rankForXp(150)]}`);
			console.log(`  400 XP -> ${RANK_NAMES[rankForXp(400)]}`);
			console.log("  All promotions fire at correct thresholds: PASS");
		});
	});

	describe("Achievability within a single mission", () => {
		it("should assess whether promotions are realistic per mission", () => {
			// Mission 1: ~14 enemies total on Tactical
			// A unit that gets 5+ kills can reach Veteran
			// Getting all 14 kills = 140 XP (between Veteran and Elite)
			const m1Kills = 14;
			const m1MaxXp = m1Kills * XP_CONFIG.killUnit;

			// Mission 5: ~28 enemies
			const m5Kills = 28;
			const m5MaxXp = m5Kills * XP_CONFIG.killUnit;

			// Mission 16: ~250+ enemies
			const m16Kills = 250;
			const m16MaxXp = m16Kills * XP_CONFIG.killUnit;

			console.log("\n=== Achievability Per Mission ===");
			console.log("  Mission | Max Kills | Max XP | Best Rank Achievable");
			console.log("  --------+-----------+--------+---------------------");
			console.log(
				`  M1      | ${m1Kills.toString().padStart(9)} | ${m1MaxXp.toString().padStart(6)} | ${RANK_NAMES[rankForXp(m1MaxXp)]}`,
			);
			console.log(
				`  M5      | ${m5Kills.toString().padStart(9)} | ${m5MaxXp.toString().padStart(6)} | ${RANK_NAMES[rankForXp(m5MaxXp)]}`,
			);
			console.log(
				`  M16     | ${m16Kills.toString().padStart(9)} | ${m16MaxXp.toString().padStart(6)} | ${RANK_NAMES[rankForXp(m16MaxXp)]}`,
			);

			// Veteran (50 XP = 5 kills): achievable in Mission 1
			expect(rankForXp(m1MaxXp)).toBeGreaterThanOrEqual(RANK_VETERAN);

			// Elite (150 XP = 15 kills): achievable in Mission 5
			expect(rankForXp(m5MaxXp)).toBeGreaterThanOrEqual(RANK_ELITE);

			// Hero (400 XP = 40 kills): achievable in Mission 16
			expect(rankForXp(m16MaxXp)).toBeGreaterThanOrEqual(RANK_HERO);

			console.log("\n  Conclusion:");
			console.log("  - Veteran achievable in Mission 1 (5 kills)");
			console.log("  - Elite achievable in Mission 5+ (15 kills)");
			console.log("  - Hero achievable in Mission 16 (40 kills)");
			console.log("  - In practice, XP is split across units, so individual Hero rank");
			console.log("    requires focused kills on a single unit across missions.");
		});
	});

	describe("Stat multiplier validation", () => {
		it("should apply correct stat bonuses at each rank", () => {
			const world = createVeterancyTestWorld();
			const eid = spawnMudfoot(world, 100, 100, "ura");

			const baseHp = Health.max[eid];
			const baseDmg = Attack.damage[eid];
			const baseSpeed = Speed.value[eid];

			console.log("\n=== Stat Multipliers Per Rank ===");
			console.log(`  Recruit: HP=${baseHp} Dmg=${baseDmg} Spd=${baseSpeed.toFixed(1)}`);

			// Promote to Veteran (+10% HP, +10% damage)
			awardXp(world, eid, 50);
			console.log(
				`  Veteran: HP=${Health.max[eid].toFixed(1)} Dmg=${Attack.damage[eid].toFixed(1)} Spd=${Speed.value[eid].toFixed(1)}`,
			);
			expect(Health.max[eid]).toBeCloseTo(baseHp * 1.1, 0);
			expect(Attack.damage[eid]).toBeCloseTo(baseDmg * 1.1, 0);

			// Promote to Elite (+20% HP, +20% damage, +5% speed)
			awardXp(world, eid, 100);
			console.log(
				`  Elite:   HP=${Health.max[eid].toFixed(1)} Dmg=${Attack.damage[eid].toFixed(1)} Spd=${Speed.value[eid].toFixed(1)}`,
			);
			expect(Health.max[eid]).toBeCloseTo(baseHp * 1.2, 0);
			expect(Attack.damage[eid]).toBeCloseTo(baseDmg * 1.2, 0);

			// Promote to Hero (+30% all)
			awardXp(world, eid, 250);
			console.log(
				`  Hero:    HP=${Health.max[eid].toFixed(1)} Dmg=${Attack.damage[eid].toFixed(1)} Spd=${Speed.value[eid].toFixed(1)}`,
			);
			expect(Health.max[eid]).toBeCloseTo(baseHp * 1.3, 0);
			expect(Attack.damage[eid]).toBeCloseTo(baseDmg * 1.3, 0);
		});
	});
});
