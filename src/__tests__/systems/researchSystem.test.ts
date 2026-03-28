/**
 * Research System Tests — ported from old Koota codebase.
 *
 * Tests research queuing, progress, and effect application.
 */

import { describe, expect, it } from "vitest";
import { Attack, Flags, Health, Speed } from "@/engine/world/components";
import {
	createGameWorld,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";
import {
	getResearchDef,
	isResearchCompleted,
	queueResearch,
	runResearchSystem,
} from "@/engine/systems/researchSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

function spawnArmory(world: ReturnType<typeof createGameWorld>) {
	return spawnBuilding(world, {
		x: 100,
		y: 100,
		faction: "ura",
		buildingType: "armory",
		health: { current: 400, max: 400 },
	});
}

describe("engine/systems/researchSystem", () => {
	describe("getResearchDef", () => {
		it("returns hardshell_armor definition", () => {
			const def = getResearchDef("hardshell_armor");
			expect(def).not.toBeNull();
			expect(def!.name).toBe("Hardshell Armor");
			expect(def!.time).toBe(20);
		});

		it("returns null for unknown research", () => {
			expect(getResearchDef("nonexistent")).toBeNull();
		});
	});

	describe("queueResearch", () => {
		it("starts research at armory and deducts resources", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			const result = queueResearch(world, armory, "hardshell_armor");
			expect(result).toBe(true);

			// Hardshell Armor costs 150 salvage
			expect(world.session.resources.salvage).toBe(50);

			const queue = world.runtime.productionQueues.get(armory);
			expect(queue).toBeDefined();
			expect(queue!.some((e) => e.type === "research" && e.contentId === "hardshell_armor")).toBe(true);
		});

		it("rejects research if insufficient resources", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 0 };
			const armory = spawnArmory(world);

			const result = queueResearch(world, armory, "hardshell_armor");
			expect(result).toBe(false);
		});

		it("rejects research if armory already has active research", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 400 };
			const armory = spawnArmory(world);

			queueResearch(world, armory, "hardshell_armor");
			const result = queueResearch(world, armory, "fish_oil_arrows");
			expect(result).toBe(false);
		});

		it("rejects research that is already completed", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			world.runtime.completedResearch.add("hardshell_armor");
			const armory = spawnArmory(world);

			const result = queueResearch(world, armory, "hardshell_armor");
			expect(result).toBe(false);
		});

		it("rejects unknown research id", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 9999 };
			const armory = spawnArmory(world);

			const result = queueResearch(world, armory, "nonexistent_research");
			expect(result).toBe(false);
		});

		it("rejects research at wrong building type", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const barracks = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
			});

			const result = queueResearch(world, barracks, "hardshell_armor");
			expect(result).toBe(false);
		});
	});

	describe("research progress", () => {
		it("advances research progress over time", () => {
			const world = makeWorld(10000); // 10 seconds
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);
			queueResearch(world, armory, "hardshell_armor");

			runResearchSystem(world);

			const queue = world.runtime.productionQueues.get(armory);
			expect(queue).toBeDefined();
			// 10s / 20s researchTime = 50%
			expect(queue![0].progress).toBeCloseTo(50, 0);
		});

		it("completes research and marks as completed", () => {
			const world = makeWorld(20000); // 20 seconds (hardshell_armor time)
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);
			queueResearch(world, armory, "hardshell_armor");

			runResearchSystem(world);

			expect(isResearchCompleted(world, "hardshell_armor")).toBe(true);
			expect(world.events.some((e) => e.type === "research-complete")).toBe(true);
		});

		it("clears research entry from queue on completion", () => {
			const world = makeWorld(20000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);
			queueResearch(world, armory, "hardshell_armor");

			runResearchSystem(world);

			const queue = world.runtime.productionQueues.get(armory);
			expect(!queue || queue.length === 0).toBe(true);
		});
	});

	describe("research effects", () => {
		it("hardshell_armor increases Mudfoot HP by 20", () => {
			const world = makeWorld(20000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			const mudfoot1 = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				unitType: "mudfoot",
				health: { current: 80, max: 80 },
			});
			const mudfoot2 = spawnUnit(world, {
				x: 60,
				y: 60,
				faction: "ura",
				unitType: "mudfoot",
				health: { current: 80, max: 80 },
			});

			queueResearch(world, armory, "hardshell_armor");
			runResearchSystem(world);

			expect(Health.max[mudfoot1]).toBe(100);
			expect(Health.current[mudfoot1]).toBe(100);
			expect(Health.max[mudfoot2]).toBe(100);
		});

		it("fish_oil_arrows increases Shellcracker damage by 3", () => {
			const world = makeWorld(15000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			const sc = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				unitType: "shellcracker",
				health: { current: 50, max: 50 },
			});
			Attack.damage[sc] = 10;

			queueResearch(world, armory, "fish_oil_arrows");
			runResearchSystem(world);

			expect(Attack.damage[sc]).toBe(13);
		});

		it("demolition_training increases Sapper damage by 50%", () => {
			const world = makeWorld(20000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			const sapper = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				unitType: "sapper",
				health: { current: 60, max: 60 },
			});
			Attack.damage[sapper] = 8;

			queueResearch(world, armory, "demolition_training");
			runResearchSystem(world);

			expect(Attack.damage[sapper]).toBe(12); // 8 * 1.5 = 12
		});

		it("advanced_rafts increases Raftsman speed by 30%", () => {
			const world = makeWorld(15000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			const raftsman = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				unitType: "raftsman",
				health: { current: 50, max: 50 },
			});
			Speed.value[raftsman] = 100;

			queueResearch(world, armory, "advanced_rafts");
			runResearchSystem(world);

			expect(Speed.value[raftsman]).toBe(130); // 100 * 1.3 = 130
		});

		it("does not affect non-matching unit types", () => {
			const world = makeWorld(20000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			// Hardshell armor affects mudfoots, not shellcrackers
			const sc = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				unitType: "shellcracker",
				health: { current: 50, max: 50 },
			});

			queueResearch(world, armory, "hardshell_armor");
			runResearchSystem(world);

			expect(Health.max[sc]).toBe(50); // Unchanged
		});

		it("passive research (fortified_walls) is only tracked as completed, no stat changes", () => {
			const world = makeWorld(25000);
			world.session.resources = { fish: 0, timber: 0, salvage: 200 };
			const armory = spawnArmory(world);

			queueResearch(world, armory, "fortified_walls");
			runResearchSystem(world);

			expect(isResearchCompleted(world, "fortified_walls")).toBe(true);
		});
	});
});
