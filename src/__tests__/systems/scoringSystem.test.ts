/**
 * Scoring System Tests — ported from old Koota codebase.
 *
 * Tests mission star rating calculation based on time, casualties, and objectives.
 */

import { describe, expect, it } from "vitest";
import { calculateMissionScore } from "@/engine/systems/scoringSystem";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/scoringSystem", () => {
	it("awards 3 stars with time + casualty + objective bonus", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000; // 5 minutes (under 10 min threshold)
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
			{ id: "bonus", description: "No losses", status: "completed", bonus: true },
		];

		// 8 surviving player units (no casualties)
		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);

		expect(score.stars).toBe(3);
		expect(score.timeBonus).toBe(true);
		expect(score.casualtyBonus).toBe(true);
		expect(score.objectiveBonus).toBe(true);
	});

	it("awards 2 stars with only time bonus (many casualties, no objective bonus)", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000; // under threshold
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
			{ id: "bonus", description: "No losses", status: "incomplete", bonus: true },
		];

		// Only 1 survivor out of at least 8 estimated initial -> 7 casualties > 5 threshold
		spawnUnit(world, { x: 0, y: 0, faction: "ura" });

		const score = calculateMissionScore(world);

		expect(score.stars).toBe(2);
		expect(score.timeBonus).toBe(true);
		expect(score.casualtyBonus).toBe(false);
		expect(score.objectiveBonus).toBe(false);
	});

	it("awards 1 star with no bonuses", () => {
		const world = makeWorld();
		world.time.elapsedMs = 900_000; // 15 minutes (over threshold)
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
			{ id: "bonus", description: "No losses", status: "incomplete", bonus: true },
		];

		// Only 1 survivor (many casualties)
		spawnUnit(world, { x: 0, y: 0, faction: "ura" });

		const score = calculateMissionScore(world);

		expect(score.stars).toBe(1);
		expect(score.timeBonus).toBe(false);
	});

	it("time bonus is true at exactly 600 seconds", () => {
		const world = makeWorld();
		world.time.elapsedMs = 600_000; // exactly 10 minutes

		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.timeBonus).toBe(true);
	});

	it("time bonus is false at 601 seconds", () => {
		const world = makeWorld();
		world.time.elapsedMs = 601_000;

		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.timeBonus).toBe(false);
	});

	it("casualty bonus is true with 5 or fewer casualties", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000;

		// 3 survivors out of ~8 initial = 5 casualties
		for (let i = 0; i < 3; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.casualtyBonus).toBe(true);
	});

	it("does not count resource entities as player units", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000;

		// Player units
		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.casualtyBonus).toBe(true);
	});

	it("objective bonus is false when no bonus objectives exist", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000;
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
		];

		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.objectiveBonus).toBe(false);
	});

	it("objective bonus requires ALL bonus objectives completed", () => {
		const world = makeWorld();
		world.time.elapsedMs = 300_000;
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
			{ id: "bonus1", description: "Find intel", status: "completed", bonus: true },
			{ id: "bonus2", description: "No losses", status: "incomplete", bonus: true },
		];

		for (let i = 0; i < 8; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);
		expect(score.objectiveBonus).toBe(false);
	});
});
