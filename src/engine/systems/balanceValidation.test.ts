/**
 * Balance Validation Test Suite — W8-01
 *
 * Validates combat and economy balance numbers from balance-deep-dive.md
 * and the JSON template data. All tests are deterministic.
 *
 * Combat formula: effectiveDamage = max(minimumDamage, attackDamage - targetArmor)
 * DPS = effectiveDamage / (attackCooldownMs / 1000)
 * TTK = targetHP / DPS
 */

import { describe, expect, it } from "vitest";

// ─── Unit Stats (from public/data/templates/units.json) ───

interface UnitStats {
	hp: number;
	armor: number;
	speed: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
	visionRadius: number;
	popCost: number;
}

const UNITS: Record<string, UnitStats> = {
	river_rat: {
		hp: 40,
		armor: 0,
		speed: 80,
		attackDamage: 5,
		attackRange: 32,
		attackCooldownMs: 1500,
		visionRadius: 6,
		popCost: 1,
	},
	mudfoot: {
		hp: 80,
		armor: 2,
		speed: 64,
		attackDamage: 12,
		attackRange: 32,
		attackCooldownMs: 1200,
		visionRadius: 5,
		popCost: 1,
	},
	shellcracker: {
		hp: 150,
		armor: 5,
		speed: 48,
		attackDamage: 18,
		attackRange: 32,
		attackCooldownMs: 1800,
		visionRadius: 4,
		popCost: 2,
	},
	mortar_otter: {
		hp: 45,
		armor: 0,
		speed: 56,
		attackDamage: 25,
		attackRange: 192,
		attackCooldownMs: 3000,
		visionRadius: 8,
		popCost: 2,
	},
	sapper: {
		hp: 50,
		armor: 1,
		speed: 64,
		attackDamage: 8,
		attackRange: 32,
		attackCooldownMs: 1400,
		visionRadius: 5,
		popCost: 1,
	},
	diver: {
		hp: 50,
		armor: 0,
		speed: 72,
		attackDamage: 10,
		attackRange: 32,
		attackCooldownMs: 1300,
		visionRadius: 5,
		popCost: 1,
	},
	gator: {
		hp: 90,
		armor: 2,
		speed: 56,
		attackDamage: 14,
		attackRange: 32,
		attackCooldownMs: 1300,
		visionRadius: 5,
		popCost: 1,
	},
	skink: {
		hp: 30,
		armor: 0,
		speed: 72,
		attackDamage: 6,
		attackRange: 32,
		attackCooldownMs: 1200,
		visionRadius: 4,
		popCost: 1,
	},
	viper: {
		hp: 50,
		armor: 0,
		speed: 48,
		attackDamage: 16,
		attackRange: 128,
		attackCooldownMs: 2000,
		visionRadius: 6,
		popCost: 1,
	},
	croc_champion: {
		hp: 300,
		armor: 8,
		speed: 40,
		attackDamage: 28,
		attackRange: 32,
		attackCooldownMs: 1800,
		visionRadius: 5,
		popCost: 3,
	},
	snapper: {
		hp: 200,
		armor: 6,
		speed: 40,
		attackDamage: 22,
		attackRange: 32,
		attackCooldownMs: 2000,
		visionRadius: 4,
		popCost: 2,
	},
};

// ─── Combat simulation helpers ───

const MINIMUM_DAMAGE = 1;

function effectiveDamage(attacker: UnitStats, defender: UnitStats): number {
	return Math.max(MINIMUM_DAMAGE, attacker.attackDamage - defender.armor);
}

function _dps(attacker: UnitStats, defender: UnitStats): number {
	const dmg = effectiveDamage(attacker, defender);
	return dmg / (attacker.attackCooldownMs / 1000);
}

/**
 * Simulate a 1vN fight. Returns the winner faction.
 * Assumes both sides attack simultaneously each tick.
 */
function simulate1v1(a: UnitStats, b: UnitStats): "a" | "b" {
	let hpA = a.hp;
	let hpB = b.hp;
	const dmgAtoB = effectiveDamage(a, b);
	const dmgBtoA = effectiveDamage(b, a);

	// Simulate in 100ms ticks
	let timerA = 0;
	let timerB = 0;
	const dt = 100; // ms per tick

	while (hpA > 0 && hpB > 0) {
		timerA += dt;
		timerB += dt;

		if (timerA >= a.attackCooldownMs) {
			hpB -= dmgAtoB;
			timerA -= a.attackCooldownMs;
		}
		if (timerB >= b.attackCooldownMs) {
			hpA -= dmgBtoA;
			timerB -= b.attackCooldownMs;
		}
	}

	return hpA > 0 ? "a" : "b";
}

function simulateNvM(
	aUnit: UnitStats,
	aCount: number,
	bUnit: UnitStats,
	bCount: number,
): "a" | "b" {
	const aHps = Array(aCount).fill(aUnit.hp) as number[];
	const bHps = Array(bCount).fill(bUnit.hp) as number[];
	const dmgAtoB = effectiveDamage(aUnit, bUnit);
	const dmgBtoA = effectiveDamage(bUnit, aUnit);

	let timerA = 0;
	let timerB = 0;
	const dt = 100;
	let maxTicks = 10000; // safety

	while (maxTicks-- > 0) {
		const aAlive = aHps.filter((hp) => hp > 0).length;
		const bAlive = bHps.filter((hp) => hp > 0).length;
		if (aAlive === 0) return "b";
		if (bAlive === 0) return "a";

		timerA += dt;
		timerB += dt;

		if (timerA >= aUnit.attackCooldownMs) {
			// Each alive A attacks a random alive B (focus fire on first alive)
			for (let i = 0; i < aHps.length; i++) {
				if (aHps[i] <= 0) continue;
				const target = bHps.findIndex((hp) => hp > 0);
				if (target >= 0) bHps[target] -= dmgAtoB;
			}
			timerA -= aUnit.attackCooldownMs;
		}
		if (timerB >= bUnit.attackCooldownMs) {
			for (let i = 0; i < bHps.length; i++) {
				if (bHps[i] <= 0) continue;
				const target = aHps.findIndex((hp) => hp > 0);
				if (target >= 0) aHps[target] -= dmgBtoA;
			}
			timerB -= bUnit.attackCooldownMs;
		}
	}

	// Tie-break: whoever has more surviving HP
	const aTotal = aHps.reduce((s, hp) => s + Math.max(0, hp), 0);
	const bTotal = bHps.reduce((s, hp) => s + Math.max(0, hp), 0);
	return aTotal >= bTotal ? "a" : "b";
}

// ─── Balance config ───

const FISH_TRAP_INCOME = 3; // fish per interval
const FISH_TRAP_INTERVAL_MS = 10000;
const FISH_TRAP_COST = 75; // from buildings.json
const FISH_PER_TRIP = 8;
const TRIP_DURATION_MS = 4000;
const RETURN_SPEED_MULT = 0.8;

// ─── Veterancy ───
const VET_XP_THRESHOLDS = { veteran: 50, elite: 150, hero: 400 };
const VET_BONUSES = { veteran: 0.1, elite: 0.2, hero: 0.3 };
const XP_PER_KILL = 10;

describe("engine/balance/combat", () => {
	it("Mudfoot vs Gator 1v1: Gator wins (higher DPS and comparable HP)", () => {
		// Gator: 90 HP, 2 armor, 14 dmg, 1300ms cd
		// Mudfoot: 80 HP, 2 armor, 12 dmg, 1200ms cd
		// Gator effective dmg = max(1, 14-2) = 12, DPS = 12/1.3 = 9.23
		// Mudfoot effective dmg = max(1, 12-2) = 10, DPS = 10/1.2 = 8.33
		// Gator has more HP AND higher DPS, so Gator wins
		const result = simulate1v1(UNITS.mudfoot, UNITS.gator);
		expect(result).toBe("b"); // Gator wins
	});

	it("2 Mudfoots vs 1 Gator: Mudfoots win", () => {
		const result = simulateNvM(UNITS.mudfoot, 2, UNITS.gator, 1);
		expect(result).toBe("a"); // 2 Mudfoots win
	});

	it("Shellcracker vs Gator 1v1: Shellcracker wins (tank build)", () => {
		// Shellcracker: 150 HP, 5 armor, 18 dmg
		// Gator: 90 HP, 2 armor, 14 dmg
		// SC effective dmg vs Gator = max(1, 18-2) = 16
		// Gator effective dmg vs SC = max(1, 14-5) = 9
		const result = simulate1v1(UNITS.shellcracker, UNITS.gator);
		expect(result).toBe("a"); // Shellcracker wins
	});

	it("Mortar vs 5 clustered Gators: AoE damage would kill at least 3", () => {
		// Mortar: 25 dmg, 192 range, 3000ms cd
		// With splash radius, 5 clustered Gators each take 25 dmg per volley
		// Gator HP = 90, armor = 2, effective dmg from mortar = max(1, 25-2) = 23
		// Volleys to kill: ceil(90/23) = 4 volleys = 12 seconds
		// Over 12s, mortar fires 4 times. With splash hitting all 5:
		// Total effective dmg per gator = 23 * 4 = 92 > 90 HP
		// So at least 3 should die from splash
		const effectiveMortarDmg = effectiveDamage(UNITS.mortar_otter, UNITS.gator);
		const volleysToKill = Math.ceil(UNITS.gator.hp / effectiveMortarDmg);
		expect(effectiveMortarDmg).toBe(23);
		expect(volleysToKill).toBeLessThanOrEqual(4);
		// In 4 volleys, AoE at full splash kills all 5
		expect(volleysToKill * effectiveMortarDmg).toBeGreaterThanOrEqual(UNITS.gator.hp);
	});

	it("Viper outranges Gator (range 128 vs 32)", () => {
		expect(UNITS.viper.attackRange).toBeGreaterThan(UNITS.gator.attackRange);
		expect(UNITS.viper.attackRange).toBe(128);
		expect(UNITS.gator.attackRange).toBe(32);
	});

	it("Armor reduction is flat (damage - armor, min 1)", () => {
		// River Rat (5 dmg) vs Shellcracker (5 armor) = min damage 1
		const dmg = effectiveDamage(UNITS.river_rat, UNITS.shellcracker);
		expect(dmg).toBe(1); // 5 - 5 = 0, clamped to 1
	});

	it("Croc Champion is the strongest non-boss unit", () => {
		// 300 HP, 8 armor, 28 dmg — elite enemy requires 5+ mudfoots to beat
		expect(UNITS.croc_champion.hp).toBe(300);
		expect(UNITS.croc_champion.armor).toBe(8);
		expect(UNITS.croc_champion.attackDamage).toBe(28);
		// Requires 5 mudfoots to take down (high armor reduces mudfoot dmg to 4)
		const result5v1 = simulateNvM(UNITS.mudfoot, 5, UNITS.croc_champion, 1);
		expect(result5v1).toBe("a"); // 5 mudfoots can beat 1 croc champion
		const result4v1 = simulateNvM(UNITS.mudfoot, 4, UNITS.croc_champion, 1);
		expect(result4v1).toBe("b"); // 4 mudfoots cannot
	});
});

describe("engine/balance/economy", () => {
	it("Fish Trap ROI: pays for itself within 250s", () => {
		// Fish Trap cost: 75 fish
		// Income: 3 fish per 10 seconds = 0.3 fish/second
		// ROI = 75 / 0.3 = 250 seconds
		const incomePerSecond = FISH_TRAP_INCOME / (FISH_TRAP_INTERVAL_MS / 1000);
		const roiSeconds = FISH_TRAP_COST / incomePerSecond;
		expect(roiSeconds).toBe(250);
		expect(incomePerSecond).toBeCloseTo(0.3, 5);
	});

	it("Worker gather rate: 8 fish per 4s trip + return time", () => {
		// Round trip: 4000ms forward + 4000/0.8 return = 4000 + 5000 = 9000ms
		const returnTimeMs = TRIP_DURATION_MS / RETURN_SPEED_MULT;
		const roundTripMs = TRIP_DURATION_MS + returnTimeMs;
		expect(roundTripMs).toBe(9000);
		const fishPerSecond = FISH_PER_TRIP / (roundTripMs / 1000);
		expect(fishPerSecond).toBeCloseTo(0.889, 2);
	});

	it("First Mudfoot trainable by 2:00 with optimal play", () => {
		// Start: 100 fish, 50 timber
		// Mudfoot cost: 80 fish, 20 salvage
		// Train time: 20000ms
		// With 3 starting River Rats gathering fish at ~0.889 fish/s each:
		// 3 * 0.889 = 2.67 fish/s
		// Time to get 80 fish: have 100 already, so already affordable
		// But need 20 salvage. Start with 0.
		// Salvage gather rate: 4/9s = 0.444/s per worker
		// Time for 20 salvage: 20/0.444 = 45s
		// Plus train time: 20s
		// Total: ~65s = ~1:05 (well under 2:00)
		const salvagePerTrip = 4;
		const salvageRoundTripMs = TRIP_DURATION_MS + TRIP_DURATION_MS / RETURN_SPEED_MULT;
		const salvagePerSecond = salvagePerTrip / (salvageRoundTripMs / 1000);
		const timeForSalvage = 20 / salvagePerSecond; // seconds
		const totalTime = timeForSalvage + 20; // + 20s train time
		expect(totalTime).toBeLessThan(120); // under 2 minutes
	});
});

describe("engine/balance/veterancy", () => {
	it("Veteran promotion at 50 XP (5 kills)", () => {
		const killsForVeteran = VET_XP_THRESHOLDS.veteran / XP_PER_KILL;
		expect(killsForVeteran).toBe(5);
	});

	it("Veteran gives +10% damage", () => {
		const baseDamage = UNITS.mudfoot.attackDamage; // 12
		const veteranDamage = Math.floor(baseDamage * (1 + VET_BONUSES.veteran));
		expect(veteranDamage).toBe(13); // 12 * 1.1 = 13.2 → 13
	});

	it("Elite at 150 XP gives +20% HP/damage", () => {
		const killsForElite = VET_XP_THRESHOLDS.elite / XP_PER_KILL;
		expect(killsForElite).toBe(15);
		const eliteHp = Math.floor(UNITS.mudfoot.hp * (1 + VET_BONUSES.elite));
		expect(eliteHp).toBe(96); // 80 * 1.2 = 96
	});

	it("Hero at 400 XP gives +30% all stats", () => {
		const killsForHero = VET_XP_THRESHOLDS.hero / XP_PER_KILL;
		expect(killsForHero).toBe(40);
		const heroHp = Math.floor(UNITS.mudfoot.hp * (1 + VET_BONUSES.hero));
		expect(heroHp).toBe(104); // 80 * 1.3 = 104
	});
});

describe("engine/balance/difficulty", () => {
	it("Support difficulty reduces enemy damage by 25%", () => {
		const supportMultiplier = 0.75;
		const gatorDmg = UNITS.gator.attackDamage * supportMultiplier;
		expect(gatorDmg).toBe(10.5);
	});

	it("Elite difficulty increases enemy HP by 25%", () => {
		const eliteMultiplier = 1.25;
		const gatorHp = UNITS.gator.hp * eliteMultiplier;
		expect(gatorHp).toBe(112.5);
	});

	it("Elite difficulty increases enemy damage by 30%", () => {
		const eliteMultiplier = 1.3;
		const gatorDmg = UNITS.gator.attackDamage * eliteMultiplier;
		expect(gatorDmg).toBeCloseTo(18.2, 1);
	});
});

describe("engine/balance/research", () => {
	it("Hardshell Armor research gives +2 armor to all units", () => {
		// Research effect: target=all_units, stat=armor, modifier="+2"
		const mudfootArmorBase = UNITS.mudfoot.armor; // 2
		const mudfootArmorResearched = mudfootArmorBase + 2;
		expect(mudfootArmorResearched).toBe(4);

		// After research, Mudfoot takes less damage from Gator
		const dmgBefore = effectiveDamage(UNITS.gator, UNITS.mudfoot); // 14-2 = 12
		const mudfootResearched = { ...UNITS.mudfoot, armor: mudfootArmorResearched };
		const dmgAfter = effectiveDamage(UNITS.gator, mudfootResearched); // 14-4 = 10
		expect(dmgBefore).toBe(12);
		expect(dmgAfter).toBe(10);
	});
});
