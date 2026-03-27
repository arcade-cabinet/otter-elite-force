/**
 * Tests for LittleJS EngineObject subclasses.
 *
 * W1-04: Verify GameUnit, GameBuilding, GameResource, GameProjectile, FloatingText
 * classes are created correctly with the factory pattern.
 */

import { describe, expect, it } from "vitest";

// We test the factory functions exist and can be called
// (full EngineObject instantiation requires LittleJS runtime which is browser-only)

describe("GameUnit factory", () => {
	it("exports createGameUnitClass and initGameUnitLjs", async () => {
		const mod = await import("./GameUnit");
		expect(mod.createGameUnitClass).toBeDefined();
		expect(mod.initGameUnitLjs).toBeDefined();
		expect(typeof mod.createGameUnitClass).toBe("function");
		expect(typeof mod.initGameUnitLjs).toBe("function");
	});

	it("throws if LittleJS API not initialized", async () => {
		const mod = await import("./GameUnit");
		expect(() => mod.createGameUnitClass()).toThrow("LittleJS API not initialized");
	});
});

describe("GameBuilding factory", () => {
	it("exports createGameBuildingClass and initGameBuildingLjs", async () => {
		const mod = await import("./GameBuilding");
		expect(mod.createGameBuildingClass).toBeDefined();
		expect(mod.initGameBuildingLjs).toBeDefined();
		expect(typeof mod.createGameBuildingClass).toBe("function");
		expect(typeof mod.initGameBuildingLjs).toBe("function");
	});
});

describe("GameResource factory", () => {
	it("exports createGameResourceClass and initGameResourceLjs", async () => {
		const mod = await import("./GameResource");
		expect(mod.createGameResourceClass).toBeDefined();
		expect(mod.initGameResourceLjs).toBeDefined();
		expect(typeof mod.createGameResourceClass).toBe("function");
		expect(typeof mod.initGameResourceLjs).toBe("function");
	});
});

describe("GameProjectile factory", () => {
	it("exports createGameProjectileClass and initGameProjectileLjs", async () => {
		const mod = await import("./GameProjectile");
		expect(mod.createGameProjectileClass).toBeDefined();
		expect(mod.initGameProjectileLjs).toBeDefined();
		expect(typeof mod.createGameProjectileClass).toBe("function");
		expect(typeof mod.initGameProjectileLjs).toBe("function");
	});
});

describe("FloatingText factory", () => {
	it("exports createFloatingTextClass and initFloatingTextLjs", async () => {
		const mod = await import("./FloatingText");
		expect(mod.createFloatingTextClass).toBeDefined();
		expect(mod.initFloatingTextLjs).toBeDefined();
		expect(typeof mod.createFloatingTextClass).toBe("function");
		expect(typeof mod.initFloatingTextLjs).toBe("function");
	});
});

describe("objects barrel export", () => {
	it("re-exports all object factories", async () => {
		const mod = await import("./index");
		expect(mod.createGameUnitClass).toBeDefined();
		expect(mod.createGameBuildingClass).toBeDefined();
		expect(mod.createGameResourceClass).toBeDefined();
		expect(mod.createGameProjectileClass).toBeDefined();
		expect(mod.createFloatingTextClass).toBeDefined();
	});
});
