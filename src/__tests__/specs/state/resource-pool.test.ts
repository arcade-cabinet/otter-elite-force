/**
 * Resource Pool State Tests — ported from old Koota codebase.
 *
 * Tests resource management through the GameWorld session state.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, resetWorldSession } from "@/engine/world/gameWorld";

describe("Resource pool state", () => {
	describe("initialization", () => {
		it("starts with zero fish, timber, salvage", () => {
			const world = createGameWorld();
			expect(world.session.resources.fish).toBe(0);
			expect(world.session.resources.timber).toBe(0);
			expect(world.session.resources.salvage).toBe(0);
		});
	});

	describe("mutations", () => {
		it("can set fish to a positive value", () => {
			const world = createGameWorld();
			world.session.resources.fish = 250;
			expect(world.session.resources.fish).toBe(250);
		});

		it("can set all three resources independently", () => {
			const world = createGameWorld();
			world.session.resources = { fish: 100, timber: 200, salvage: 50 };
			expect(world.session.resources.fish).toBe(100);
			expect(world.session.resources.timber).toBe(200);
			expect(world.session.resources.salvage).toBe(50);
		});

		it("can add to existing resources", () => {
			const world = createGameWorld();
			world.session.resources.fish = 100;
			world.session.resources.fish += 50;
			expect(world.session.resources.fish).toBe(150);
		});

		it("can subtract from existing resources", () => {
			const world = createGameWorld();
			world.session.resources.timber = 200;
			world.session.resources.timber -= 75;
			expect(world.session.resources.timber).toBe(125);
		});
	});

	describe("reset", () => {
		it("resetWorldSession resets resources to zero", () => {
			const world = createGameWorld();
			world.session.resources = { fish: 999, timber: 999, salvage: 999 };
			resetWorldSession(world);
			expect(world.session.resources.fish).toBe(0);
			expect(world.session.resources.timber).toBe(0);
			expect(world.session.resources.salvage).toBe(0);
		});
	});
});

describe("Population state", () => {
	describe("initialization", () => {
		it("starts with current=0, max=10", () => {
			const world = createGameWorld();
			expect(world.runtime.population.current).toBe(0);
			expect(world.runtime.population.max).toBe(10);
		});
	});

	describe("mutations", () => {
		it("can update population current and max", () => {
			const world = createGameWorld();
			world.runtime.population.current = 12;
			world.runtime.population.max = 24;
			expect(world.runtime.population.current).toBe(12);
			expect(world.runtime.population.max).toBe(24);
		});
	});

	describe("reset", () => {
		it("resetWorldSession resets to current=0, max=10", () => {
			const world = createGameWorld();
			world.runtime.population = { current: 30, max: 60 };
			resetWorldSession(world);
			expect(world.runtime.population.current).toBe(0);
			expect(world.runtime.population.max).toBe(10);
		});
	});
});

describe("Completed research state", () => {
	describe("initialization", () => {
		it("starts with empty Set", () => {
			const world = createGameWorld();
			expect(world.runtime.completedResearch.size).toBe(0);
		});
	});

	describe("mutations", () => {
		it("can add a research ID", () => {
			const world = createGameWorld();
			world.runtime.completedResearch.add("hardshell_armor");
			expect(world.runtime.completedResearch.has("hardshell_armor")).toBe(true);
		});

		it("tracks multiple research IDs", () => {
			const world = createGameWorld();
			world.runtime.completedResearch.add("hardshell_armor");
			world.runtime.completedResearch.add("fish_oil_arrows");
			world.runtime.completedResearch.add("demolition_training");
			expect(world.runtime.completedResearch.size).toBe(3);
		});
	});

	describe("reset", () => {
		it("resetWorldSession clears completed research", () => {
			const world = createGameWorld();
			world.runtime.completedResearch.add("hardshell_armor");
			resetWorldSession(world);
			expect(world.runtime.completedResearch.size).toBe(0);
		});
	});
});
