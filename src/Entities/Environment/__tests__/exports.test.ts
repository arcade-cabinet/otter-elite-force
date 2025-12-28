/**
 * Environment Index Tests
 *
 * Tests the Environment barrel exports
 */

import { describe, expect, it } from "vitest";
import * as EnvironmentExports from "../index";

describe("Environment Index Exports", () => {
	it("should export BurntTrees", () => {
		expect(EnvironmentExports.BurntTrees).toBeDefined();
	});

	it("should export Debris", () => {
		expect(EnvironmentExports.Debris).toBeDefined();
	});

	it("should export FloatingDrums", () => {
		expect(EnvironmentExports.FloatingDrums).toBeDefined();
	});

	it("should export Lilypads", () => {
		expect(EnvironmentExports.Lilypads).toBeDefined();
	});

	it("should export Mangroves", () => {
		expect(EnvironmentExports.Mangroves).toBeDefined();
	});

	it("should export MudPit", () => {
		expect(EnvironmentExports.MudPit).toBeDefined();
	});

	it("should export OilSlick", () => {
		expect(EnvironmentExports.OilSlick).toBeDefined();
	});

	it("should export Platform", () => {
		expect(EnvironmentExports.Platform).toBeDefined();
	});

	it("should export Reeds", () => {
		expect(EnvironmentExports.Reeds).toBeDefined();
	});

	it("should export ToxicSludge", () => {
		expect(EnvironmentExports.ToxicSludge).toBeDefined();
	});
});
