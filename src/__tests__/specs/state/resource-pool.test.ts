/**
 * ResourcePool Koota Trait Specification Tests
 *
 * Defines the behavioral contract for the ResourcePool singleton trait.
 * ResourcePool replaces the Zustand resourceStore and tracks Fish, Timber, Salvage.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §7
 *   - src/ecs/traits/state.ts (ResourcePool, PopulationState, CompletedResearch)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */

import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons, resetSessionState } from "@/ecs/singletons";
import { CompletedResearch, PopulationState, ResourcePool } from "@/ecs/traits/state";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.destroy();
});

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("ResourcePool trait", () => {
	describe("initialization", () => {
		it("is added to the world by initSingletons", () => {
			expect(world.has(ResourcePool)).toBe(true);
		});

		it("starts with zero fish, timber, salvage", () => {
			const res = world.get(ResourcePool);
			expect(res).toBeDefined();
			expect(res?.fish).toBe(0);
			expect(res?.timber).toBe(0);
			expect(res?.salvage).toBe(0);
		});
	});

	describe("mutations", () => {
		it("can set fish to a positive value", () => {
			world.set(ResourcePool, { fish: 250, timber: 0, salvage: 0 });
			expect(world.get(ResourcePool)?.fish).toBe(250);
		});

		it("can set all three resources independently", () => {
			world.set(ResourcePool, { fish: 100, timber: 200, salvage: 50 });
			const res = world.get(ResourcePool)!;
			expect(res.fish).toBe(100);
			expect(res.timber).toBe(200);
			expect(res.salvage).toBe(50);
		});

		it("preserves other fields when setting one resource", () => {
			world.set(ResourcePool, { fish: 100, timber: 200, salvage: 50 });
			world.set(ResourcePool, { fish: 150 });
			const res = world.get(ResourcePool)!;
			expect(res.fish).toBe(150);
			expect(res.timber).toBe(200);
			expect(res.salvage).toBe(50);
		});
	});

	describe("reset", () => {
		it("resetSessionState resets resources to zero", () => {
			world.set(ResourcePool, { fish: 999, timber: 999, salvage: 999 });
			resetSessionState(world);
			const res = world.get(ResourcePool)!;
			expect(res.fish).toBe(0);
			expect(res.timber).toBe(0);
			expect(res.salvage).toBe(0);
		});
	});
});

describe("PopulationState trait", () => {
	describe("initialization", () => {
		it("is added to the world by initSingletons", () => {
			expect(world.has(PopulationState)).toBe(true);
		});

		it("starts with current=0, max=4", () => {
			const pop = world.get(PopulationState)!;
			expect(pop.current).toBe(0);
			expect(pop.max).toBe(4);
		});
	});

	describe("mutations", () => {
		it("can update population current and max", () => {
			world.set(PopulationState, { current: 12, max: 24 });
			const pop = world.get(PopulationState)!;
			expect(pop.current).toBe(12);
			expect(pop.max).toBe(24);
		});
	});

	describe("reset", () => {
		it("resetSessionState resets to current=0, max=4", () => {
			world.set(PopulationState, { current: 30, max: 60 });
			resetSessionState(world);
			const pop = world.get(PopulationState)!;
			expect(pop.current).toBe(0);
			expect(pop.max).toBe(4);
		});
	});
});

describe("CompletedResearch trait", () => {
	describe("initialization", () => {
		it("is added to the world by initSingletons", () => {
			expect(world.has(CompletedResearch)).toBe(true);
		});

		it("starts with empty Set", () => {
			const research = world.get(CompletedResearch)!;
			expect(research.ids).toBeInstanceOf(Set);
			expect(research.ids.size).toBe(0);
		});
	});

	describe("mutations", () => {
		it("can add a research ID", () => {
			const research = world.get(CompletedResearch)!;
			research.ids.add("hardshell_armor");
			expect(world.get(CompletedResearch)?.ids.has("hardshell_armor")).toBe(true);
		});

		it("tracks multiple research IDs", () => {
			const research = world.get(CompletedResearch)!;
			research.ids.add("hardshell_armor");
			research.ids.add("rapid_deploy");
			research.ids.add("advanced_optics");
			expect(world.get(CompletedResearch)?.ids.size).toBe(3);
		});
	});

	describe("persistence across session reset", () => {
		it("resetSessionState does NOT clear completed research", () => {
			const research = world.get(CompletedResearch)!;
			research.ids.add("hardshell_armor");
			resetSessionState(world);
			// Research persists across missions (campaign-level)
			expect(world.get(CompletedResearch)?.ids.has("hardshell_armor")).toBe(true);
		});
	});
});
