/**
 * Scoring System Specification Tests — ported from old Koota codebase.
 *
 * Tests scoring system calculations and star rating thresholds.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, spawnUnit, spawnBuilding } from "@/engine/world/gameWorld";
import { calculateMissionScore, type MissionScore } from "@/engine/systems/scoringSystem";

describe("Mission scoring specifications", () => {
	describe("Star rating thresholds", () => {
		it("1 star: base completion with no bonuses", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 900_000; // 15 minutes
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
			];

			// Very few survivors
			spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			const score = calculateMissionScore(world);
			expect(score.stars).toBe(1);
		});

		it("2 stars: one bonus criterion met", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000; // under threshold
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
			];

			// Enough survivors for casualty bonus
			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			const score = calculateMissionScore(world);
			expect(score.stars).toBe(2);
		});

		it("3 stars: two or more bonus criteria met", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
				{ id: "bonus", description: "Bonus", status: "completed", bonus: true },
			];

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			const score = calculateMissionScore(world);
			expect(score.stars).toBe(3);
		});
	});

	describe("Time bonus", () => {
		it("awarded at 5 minutes", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).timeBonus).toBe(true);
		});

		it("awarded at exactly 10 minutes", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 600_000;

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).timeBonus).toBe(true);
		});

		it("not awarded at 11 minutes", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 660_000;

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).timeBonus).toBe(false);
		});
	});

	describe("Casualty bonus", () => {
		it("awarded with 8 survivors (0 casualties)", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).casualtyBonus).toBe(true);
		});

		it("not awarded with only 1 survivor", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 900_000;

			spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			const score = calculateMissionScore(world);
			// With 1 survivor, max(1, 8) - 1 = 7 casualties > 5
			expect(score.casualtyBonus).toBe(false);
		});
	});

	describe("Objective bonus", () => {
		it("awarded when all bonus objectives completed", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
				{ id: "bonus1", description: "Find intel", status: "completed", bonus: true },
				{ id: "bonus2", description: "No losses", status: "completed", bonus: true },
			];

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).objectiveBonus).toBe(true);
		});

		it("not awarded when any bonus objective is incomplete", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
				{ id: "bonus1", description: "Find intel", status: "completed", bonus: true },
				{ id: "bonus2", description: "No losses", status: "incomplete", bonus: true },
			];

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).objectiveBonus).toBe(false);
		});

		it("not awarded when no bonus objectives exist", () => {
			const world = createGameWorld();
			world.time.elapsedMs = 300_000;
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
			];

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 10, y: 0, faction: "ura" });
			}

			expect(calculateMissionScore(world).objectiveBonus).toBe(false);
		});
	});
});
