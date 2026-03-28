/**
 * Combat Outcome Specification Tests — ported from old Koota codebase.
 *
 * Pure combat simulations using unit stats to validate balance.
 * Combat formula: damage = max(1, attackDamage - targetArmor)
 */

import { describe, expect, it } from "vitest";

interface UnitStats {
	hp: number;
	armor: number;
	speed: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
}

const UNITS: Record<string, UnitStats> = {
	river_rat: { hp: 40, armor: 0, speed: 80, attackDamage: 5, attackRange: 32, attackCooldownMs: 1500 },
	mudfoot: { hp: 80, armor: 2, speed: 64, attackDamage: 12, attackRange: 32, attackCooldownMs: 1200 },
	shellcracker: { hp: 150, armor: 5, speed: 48, attackDamage: 18, attackRange: 32, attackCooldownMs: 1800 },
	mortar_otter: { hp: 45, armor: 0, speed: 56, attackDamage: 25, attackRange: 192, attackCooldownMs: 3000 },
	sapper: { hp: 50, armor: 1, speed: 64, attackDamage: 8, attackRange: 32, attackCooldownMs: 1400 },
	diver: { hp: 50, armor: 0, speed: 72, attackDamage: 10, attackRange: 32, attackCooldownMs: 1300 },
	gator: { hp: 90, armor: 2, speed: 56, attackDamage: 14, attackRange: 32, attackCooldownMs: 1300 },
	skink: { hp: 30, armor: 0, speed: 72, attackDamage: 6, attackRange: 32, attackCooldownMs: 1200 },
	viper: { hp: 50, armor: 0, speed: 48, attackDamage: 16, attackRange: 128, attackCooldownMs: 2000 },
	croc_champion: { hp: 300, armor: 8, speed: 40, attackDamage: 28, attackRange: 32, attackCooldownMs: 1800 },
	snapper: { hp: 200, armor: 6, speed: 40, attackDamage: 22, attackRange: 32, attackCooldownMs: 2000 },
};

const MINIMUM_DAMAGE = 1;

function effectiveDamage(attacker: UnitStats, defender: UnitStats): number {
	return Math.max(MINIMUM_DAMAGE, attacker.attackDamage - defender.armor);
}

function dps(attacker: UnitStats, defender: UnitStats): number {
	return effectiveDamage(attacker, defender) / (attacker.attackCooldownMs / 1000);
}

function simulate1v1(a: UnitStats, b: UnitStats): "a" | "b" {
	let hpA = a.hp;
	let hpB = b.hp;
	const dmgAtoB = effectiveDamage(a, b);
	const dmgBtoA = effectiveDamage(b, a);
	let timerA = 0;
	let timerB = 0;
	const dt = 100;

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

function simulateNvM(aUnit: UnitStats, aCount: number, bUnit: UnitStats, bCount: number): "a" | "b" {
	const aHps = Array(aCount).fill(aUnit.hp) as number[];
	const bHps = Array(bCount).fill(bUnit.hp) as number[];
	const dmgAtoB = effectiveDamage(aUnit, bUnit);
	const dmgBtoA = effectiveDamage(bUnit, aUnit);
	let timerA = 0;
	let timerB = 0;
	const dt = 100;
	let maxTicks = 10000;

	while (maxTicks-- > 0) {
		const aAlive = aHps.filter((hp) => hp > 0).length;
		const bAlive = bHps.filter((hp) => hp > 0).length;
		if (aAlive === 0) return "b";
		if (bAlive === 0) return "a";

		timerA += dt;
		timerB += dt;

		if (timerA >= aUnit.attackCooldownMs) {
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

	const aTotal = aHps.reduce((s, hp) => s + Math.max(0, hp), 0);
	const bTotal = bHps.reduce((s, hp) => s + Math.max(0, hp), 0);
	return aTotal >= bTotal ? "a" : "b";
}

describe("Combat outcome specifications", () => {
	describe("Damage formula", () => {
		it("damage = attackDamage - armor, minimum 1", () => {
			const dmg = effectiveDamage(UNITS.mudfoot, UNITS.gator);
			expect(dmg).toBe(10); // 12 - 2 = 10
		});

		it("minimum damage is 1 when armor exceeds attack", () => {
			const dmg = effectiveDamage(UNITS.river_rat, UNITS.shellcracker);
			expect(dmg).toBe(1); // 5 - 5 = 0, clamped to 1
		});

		it("zero armor means full damage", () => {
			const dmg = effectiveDamage(UNITS.gator, UNITS.skink);
			expect(dmg).toBe(14); // 14 - 0 = 14
		});
	});

	describe("1v1 matchups", () => {
		it("Gator beats Mudfoot 1v1", () => {
			expect(simulate1v1(UNITS.mudfoot, UNITS.gator)).toBe("b");
		});

		it("Shellcracker beats Gator 1v1 (tank build)", () => {
			expect(simulate1v1(UNITS.shellcracker, UNITS.gator)).toBe("a");
		});

		it("Croc Champion beats Mudfoot 1v1", () => {
			expect(simulate1v1(UNITS.mudfoot, UNITS.croc_champion)).toBe("b");
		});

		it("Croc Champion beats Shellcracker 1v1", () => {
			expect(simulate1v1(UNITS.shellcracker, UNITS.croc_champion)).toBe("b");
		});
	});

	describe("NvM matchups", () => {
		it("2 Mudfoots beat 1 Gator", () => {
			expect(simulateNvM(UNITS.mudfoot, 2, UNITS.gator, 1)).toBe("a");
		});

		it("3 Mudfoots beat 2 Gators", () => {
			expect(simulateNvM(UNITS.mudfoot, 3, UNITS.gator, 2)).toBe("a");
		});

		it("5 Mudfoots beat 1 Croc Champion", () => {
			expect(simulateNvM(UNITS.mudfoot, 5, UNITS.croc_champion, 1)).toBe("a");
		});

		it("4 Mudfoots lose to 1 Croc Champion", () => {
			expect(simulateNvM(UNITS.mudfoot, 4, UNITS.croc_champion, 1)).toBe("b");
		});
	});

	describe("Range advantage", () => {
		it("Viper outranges Gator (128 vs 32)", () => {
			expect(UNITS.viper.attackRange).toBeGreaterThan(UNITS.gator.attackRange);
		});

		it("Mortar Otter has longest range (192)", () => {
			const ranges = Object.values(UNITS).map((u) => u.attackRange);
			expect(UNITS.mortar_otter.attackRange).toBe(Math.max(...ranges));
		});
	});

	describe("DPS calculations", () => {
		it("Mudfoot DPS vs unarmored is 10", () => {
			expect(dps(UNITS.mudfoot, { ...UNITS.mudfoot, armor: 0 })).toBeCloseTo(10, 0);
		});

		it("Gator DPS vs Mudfoot is ~9.2", () => {
			// damage = max(1, 14 - 2) = 12, DPS = 12 / (1300/1000) = 9.23
			const gatorDps = dps(UNITS.gator, UNITS.mudfoot);
			expect(gatorDps).toBeCloseTo(9.2, 0);
		});
	});

	describe("Mortar AoE potential", () => {
		it("mortar deals 23 effective damage per volley vs gator", () => {
			const dmg = effectiveDamage(UNITS.mortar_otter, UNITS.gator);
			expect(dmg).toBe(23); // 25 - 2
		});

		it("4 volleys can kill a gator (92 > 90 HP)", () => {
			const dmg = effectiveDamage(UNITS.mortar_otter, UNITS.gator);
			const totalDmg = dmg * 4;
			expect(totalDmg).toBeGreaterThanOrEqual(UNITS.gator.hp);
		});
	});

	describe("Unit stat contracts", () => {
		it("all units have positive HP", () => {
			for (const [name, stats] of Object.entries(UNITS)) {
				expect(stats.hp, `${name} HP`).toBeGreaterThan(0);
			}
		});

		it("all units have positive attack damage", () => {
			for (const [name, stats] of Object.entries(UNITS)) {
				expect(stats.attackDamage, `${name} damage`).toBeGreaterThan(0);
			}
		});

		it("all units have positive speed", () => {
			for (const [name, stats] of Object.entries(UNITS)) {
				expect(stats.speed, `${name} speed`).toBeGreaterThan(0);
			}
		});

		it("armor is non-negative", () => {
			for (const [name, stats] of Object.entries(UNITS)) {
				expect(stats.armor, `${name} armor`).toBeGreaterThanOrEqual(0);
			}
		});
	});
});
