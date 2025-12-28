/**
 * ECS Archetypes Index Tests
 *
 * Tests the ECS archetypes barrel exports
 */

import { describe, expect, it } from "vitest";
import * as ArchetypeExports from "../index";

describe("Archetypes Index Exports", () => {
	describe("Enemy Exports", () => {
		it("should export createGator", () => {
			expect(ArchetypeExports.createGator).toBeDefined();
			expect(typeof ArchetypeExports.createGator).toBe("function");
		});

		it("should export createScout", () => {
			expect(ArchetypeExports.createScout).toBeDefined();
			expect(typeof ArchetypeExports.createScout).toBe("function");
		});

		it("should export createSnake", () => {
			expect(ArchetypeExports.createSnake).toBeDefined();
			expect(typeof ArchetypeExports.createSnake).toBe("function");
		});

		it("should export createSnapper", () => {
			expect(ArchetypeExports.createSnapper).toBeDefined();
			expect(typeof ArchetypeExports.createSnapper).toBe("function");
		});
	});

	describe("Environment Exports", () => {
		it("should export createMudPit", () => {
			expect(ArchetypeExports.createMudPit).toBeDefined();
			expect(typeof ArchetypeExports.createMudPit).toBe("function");
		});

		it("should export createOilSlick", () => {
			expect(ArchetypeExports.createOilSlick).toBeDefined();
			expect(typeof ArchetypeExports.createOilSlick).toBe("function");
		});

		it("should export createPlatform", () => {
			expect(ArchetypeExports.createPlatform).toBeDefined();
			expect(typeof ArchetypeExports.createPlatform).toBe("function");
		});

		it("should export createToxicSludge", () => {
			expect(ArchetypeExports.createToxicSludge).toBeDefined();
			expect(typeof ArchetypeExports.createToxicSludge).toBe("function");
		});
	});

	describe("Interaction Exports", () => {
		it("should export createRaft", () => {
			expect(ArchetypeExports.createRaft).toBeDefined();
			expect(typeof ArchetypeExports.createRaft).toBe("function");
		});

		it("should export createVillager", () => {
			expect(ArchetypeExports.createVillager).toBeDefined();
			expect(typeof ArchetypeExports.createVillager).toBe("function");
		});
	});

	describe("Objective Exports", () => {
		it("should export createExtractionPoint", () => {
			expect(ArchetypeExports.createExtractionPoint).toBeDefined();
			expect(typeof ArchetypeExports.createExtractionPoint).toBe("function");
		});

		it("should export createPrisonCage", () => {
			expect(ArchetypeExports.createPrisonCage).toBeDefined();
			expect(typeof ArchetypeExports.createPrisonCage).toBe("function");
		});

		it("should export createSiphon", () => {
			expect(ArchetypeExports.createSiphon).toBeDefined();
			expect(typeof ArchetypeExports.createSiphon).toBe("function");
		});
	});

	describe("Player Exports", () => {
		it("should export createPlayer", () => {
			expect(ArchetypeExports.createPlayer).toBeDefined();
			expect(typeof ArchetypeExports.createPlayer).toBe("function");
		});
	});

	describe("Projectile Exports", () => {
		it("should export createProjectile", () => {
			expect(ArchetypeExports.createProjectile).toBeDefined();
			expect(typeof ArchetypeExports.createProjectile).toBe("function");
		});
	});
});
