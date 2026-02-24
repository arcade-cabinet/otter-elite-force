/**
 * Environment Entity Component Tests
 *
 * Smoke tests verifying components export correctly and types are valid.
 */

import * as EnvironmentExports from "../index";

describe("Environment Entity Exports", () => {
	it("should export BurntTrees component", () => {
		expect(EnvironmentExports.BurntTrees).toBeDefined();
		expect(typeof EnvironmentExports.BurntTrees).toBe("function");
	});

	it("should export Debris component", () => {
		expect(EnvironmentExports.Debris).toBeDefined();
		expect(typeof EnvironmentExports.Debris).toBe("function");
	});

	it("should export FloatingDrums component", () => {
		expect(EnvironmentExports.FloatingDrums).toBeDefined();
		expect(typeof EnvironmentExports.FloatingDrums).toBe("function");
	});

	it("should export Lilypads component", () => {
		expect(EnvironmentExports.Lilypads).toBeDefined();
		expect(typeof EnvironmentExports.Lilypads).toBe("function");
	});

	it("should export Mangroves component", () => {
		expect(EnvironmentExports.Mangroves).toBeDefined();
		expect(typeof EnvironmentExports.Mangroves).toBe("function");
	});

	it("should export MudPit component", () => {
		expect(EnvironmentExports.MudPit).toBeDefined();
		expect(typeof EnvironmentExports.MudPit).toBe("function");
	});

	it("should export OilSlick component", () => {
		expect(EnvironmentExports.OilSlick).toBeDefined();
		expect(typeof EnvironmentExports.OilSlick).toBe("function");
	});

	it("should export Platform component", () => {
		expect(EnvironmentExports.Platform).toBeDefined();
		expect(typeof EnvironmentExports.Platform).toBe("function");
	});

	it("should export Reeds component", () => {
		expect(EnvironmentExports.Reeds).toBeDefined();
		expect(typeof EnvironmentExports.Reeds).toBe("function");
	});

	it("should export ToxicSludge component", () => {
		expect(EnvironmentExports.ToxicSludge).toBeDefined();
		expect(typeof EnvironmentExports.ToxicSludge).toBe("function");
	});
});
