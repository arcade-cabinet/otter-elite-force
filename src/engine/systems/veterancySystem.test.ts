import { describe, expect, it, vi } from "vitest";
import { Attack, Health, Speed, Veterancy } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import {
	awardXp,
	RANK_ELITE,
	RANK_HERO,
	RANK_RECRUIT,
	RANK_VETERAN,
	rankForXp,
	recordDamageAssist,
	runVeterancySystem,
	veterancyMultiplier,
	XP_CONFIG,
} from "./veterancySystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

function makeWorld(deltaMs = 0) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/veterancySystem", () => {
	describe("rankForXp", () => {
		it("returns Recruit for 0 XP", () => {
			expect(rankForXp(0)).toBe(RANK_RECRUIT);
		});

		it("returns Veteran at 50 XP", () => {
			expect(rankForXp(50)).toBe(RANK_VETERAN);
		});

		it("returns Elite at 150 XP", () => {
			expect(rankForXp(150)).toBe(RANK_ELITE);
		});

		it("returns Hero at 400 XP", () => {
			expect(rankForXp(400)).toBe(RANK_HERO);
		});

		it("returns Veteran between 50 and 149 XP", () => {
			expect(rankForXp(100)).toBe(RANK_VETERAN);
			expect(rankForXp(149)).toBe(RANK_VETERAN);
		});
	});

	describe("veterancyMultiplier", () => {
		it("returns 1.0 multipliers for Recruit", () => {
			const mult = veterancyMultiplier(RANK_RECRUIT);
			expect(mult.hp).toBe(1.0);
			expect(mult.damage).toBe(1.0);
			expect(mult.speed).toBe(1.0);
		});

		it("returns +10% HP/damage for Veteran", () => {
			const mult = veterancyMultiplier(RANK_VETERAN);
			expect(mult.hp).toBeCloseTo(1.1);
			expect(mult.damage).toBeCloseTo(1.1);
			expect(mult.speed).toBe(1.0);
		});

		it("returns +20% HP/damage, +5% speed for Elite", () => {
			const mult = veterancyMultiplier(RANK_ELITE);
			expect(mult.hp).toBeCloseTo(1.2);
			expect(mult.damage).toBeCloseTo(1.2);
			expect(mult.speed).toBeCloseTo(1.05);
		});

		it("returns +30% all stats for Hero", () => {
			const mult = veterancyMultiplier(RANK_HERO);
			expect(mult.hp).toBeCloseTo(1.3);
			expect(mult.damage).toBeCloseTo(1.3);
			expect(mult.speed).toBeCloseTo(1.3);
		});
	});

	describe("awardXp", () => {
		it("awards XP to an entity", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[eid] = 10;
			Speed.value[eid] = 64;

			awardXp(world, eid, 30);
			expect(Veterancy.xp[eid]).toBe(30);
			expect(Veterancy.rank[eid]).toBe(RANK_RECRUIT);
		});

		it("promotes to Veteran at 50 XP and applies stat multipliers", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[eid] = 10;
			Speed.value[eid] = 64;

			awardXp(world, eid, 50);
			expect(Veterancy.rank[eid]).toBe(RANK_VETERAN);
			expect(Health.max[eid]).toBeCloseTo(110);
			expect(Attack.damage[eid]).toBeCloseTo(11);

			// Check promotion event
			const promotionEvents = world.events.filter((e) => e.type === "promotion");
			expect(promotionEvents).toHaveLength(1);
			expect(promotionEvents[0].payload?.newRank).toBe(RANK_VETERAN);
		});

		it("does not promote below threshold", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[eid] = 10;

			awardXp(world, eid, 49);
			expect(Veterancy.rank[eid]).toBe(RANK_RECRUIT);
			expect(Health.max[eid]).toBeCloseTo(100);
		});

		it("ignores zero or negative XP", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});

			awardXp(world, eid, 0);
			expect(Veterancy.xp[eid]).toBe(0);

			awardXp(world, eid, -5);
			expect(Veterancy.xp[eid]).toBe(0);
		});

		it("scales HP proportionally on promotion (keeps damage ratio)", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 50, max: 100 },
			});
			Attack.damage[eid] = 10;
			Speed.value[eid] = 64;

			awardXp(world, eid, 50);
			// 50% HP ratio should be preserved: 110 max * 0.5 = 55
			expect(Health.max[eid]).toBeCloseTo(110);
			expect(Health.current[eid]).toBeCloseTo(55);
		});
	});

	describe("recordDamageAssist", () => {
		it("records damage timestamps for assist tracking", () => {
			const world = makeWorld();
			world.time.elapsedMs = 5000;

			const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			const target = spawnUnit(world, { x: 10, y: 0, faction: "scale_guard" });

			recordDamageAssist(world, attacker, target);

			const assistMap = world.runtime.damageAssists.get(target);
			expect(assistMap).toBeDefined();
			expect(assistMap?.get(attacker)).toBe(5000);
		});
	});

	describe("runVeterancySystem", () => {
		it("awards kill XP when unit-died event with damage assists", () => {
			const world = makeWorld();
			world.time.elapsedMs = 5000;

			const killer = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[killer] = 10;
			Speed.value[killer] = 64;

			const deadEid = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 0, max: 50 },
			});

			// Record damage assist before death
			recordDamageAssist(world, killer, deadEid);

			// Simulate death event
			world.events.push({
				type: "unit-died",
				payload: { eid: deadEid, x: 10, y: 0 },
			});

			runVeterancySystem(world);

			expect(Veterancy.xp[killer]).toBe(XP_CONFIG.killUnit);
			expect(world.runtime.killCounts.get(killer)).toBe(1);
		});

		it("awards assist XP to other attackers within window", () => {
			const world = makeWorld();
			world.time.elapsedMs = 10000;

			const killer = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const assister = spawnUnit(world, {
				x: 5,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const deadEid = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 0, max: 50 },
			});

			// Assister hit at 8000ms (within 5s window)
			const assistMap = new Map<number, number>();
			assistMap.set(assister, 8000);
			assistMap.set(killer, 10000); // most recent = killer
			world.runtime.damageAssists.set(deadEid, assistMap);

			world.events.push({
				type: "unit-died",
				payload: { eid: deadEid, x: 10, y: 0 },
			});

			runVeterancySystem(world);

			expect(Veterancy.xp[killer]).toBe(XP_CONFIG.killUnit);
			expect(Veterancy.xp[assister]).toBe(XP_CONFIG.assistKill);
		});

		it("awards survive XP on mission-complete", () => {
			const world = makeWorld();

			const survivor1 = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const survivor2 = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "ura",
				health: { current: 50, max: 100 },
			});

			world.events.push({ type: "mission-complete" });

			runVeterancySystem(world);

			expect(Veterancy.xp[survivor1]).toBe(XP_CONFIG.surviveMission);
			expect(Veterancy.xp[survivor2]).toBe(XP_CONFIG.surviveMission);
		});
	});
});
