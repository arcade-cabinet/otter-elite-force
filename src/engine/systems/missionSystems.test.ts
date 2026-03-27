import { describe, expect, it, beforeEach } from "vitest";
import { Attack, Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import { createGameWorld, markForRemoval, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import { runTidalSystem, type TidalRuntime } from "./tidalSystem";
import { runFireSystem } from "./fireSystem";
import { runSiphonSystem } from "./siphonSystem";
import { runMultiBaseSystem } from "./multiBaseSystem";
import { runTerritorySystem } from "./territorySystem";
import { runDemolitionSystem } from "./demolitionSystem";
import { runSiegeSystem } from "./siegeSystem";
import { runLootSystem } from "./lootSystem";
import { runEncounterSystem, resetEncounterState } from "./encounterSystemEngine";
import { runDifficultyScalingSystem, resetDifficultyScaling } from "./difficultyScalingSystem";
import { calculateMissionScore } from "./scoringSystem";

describe("engine/systems/tidalSystem", () => {
	it("emits tidal-change events", () => {
		const world = createGameWorld();
		world.time.elapsedMs = 0;
		(world.runtime as TidalRuntime).lastTide = undefined;

		runTidalSystem(world);
		expect(world.events.some((e) => e.type === "tidal-change")).toBe(true);
	});
});

describe("engine/systems/fireSystem", () => {
	it("damages entities in fire zones", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000;
		world.runtime.zoneRects.set("fire_zone", { x: 0, y: 0, width: 200, height: 200 });

		const eid = spawnUnit(world, { x: 50, y: 50, faction: "ura", health: { current: 20, max: 20 } });

		runFireSystem(world);

		expect(Health.current[eid]).toBeLessThan(20);
	});
});

describe("engine/systems/siphonSystem", () => {
	it("drains player resources when siphon buildings exist", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000;
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		const building = spawnBuilding(world, {
			x: 100, y: 100, faction: "scale_guard", buildingType: "siphon_tower",
			health: { current: 20, max: 20 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBeLessThan(100);
	});
});

describe("engine/systems/multiBaseSystem", () => {
	it("emits all-bases-lost when no player bases remain", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		// No buildings at all

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
	});

	it("does not emit when player has bases", () => {
		const world = createGameWorld();
		world.session.phase = "playing";

		spawnBuilding(world, {
			x: 100, y: 100, faction: "ura", buildingType: "command_post",
			health: { current: 40, max: 40 },
		});

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
	});
});

describe("engine/systems/territorySystem", () => {
	it("reports zone control by unit count", () => {
		const world = createGameWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 200, height: 200 });

		spawnUnit(world, { x: 50, y: 50, faction: "ura" });
		spawnUnit(world, { x: 60, y: 60, faction: "ura" });
		spawnUnit(world, { x: 70, y: 70, faction: "scale_guard" });

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("ura");
	});
});

describe("engine/systems/demolitionSystem", () => {
	it("applies area damage on detonate events", () => {
		const world = createGameWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const eid = spawnUnit(world, { x: 100, y: 100, faction: "scale_guard", health: { current: 50, max: 50 } });

		runDemolitionSystem(world);

		expect(Health.current[eid]).toBeLessThan(50);
	});
});

describe("engine/systems/lootSystem", () => {
	it("grants resources when enemy units are destroyed", () => {
		const world = createGameWorld();
		world.session.resources = { fish: 0, timber: 0, salvage: 0 };

		const enemy = spawnUnit(world, { x: 100, y: 100, faction: "scale_guard", unitType: "gator", health: { current: 0, max: 10 } });
		// Use runtime loot table with guaranteed drops (probability 1.0)
		world.runtime.lootTables.set("gator", [
			{ resource: "salvage", chance: 1.0, min: 5, max: 10 },
		]);
		markForRemoval(world, enemy);

		runLootSystem(world);

		expect(world.session.resources.salvage).toBeGreaterThan(0);
	});
});

describe("engine/systems/encounterSystemEngine", () => {
	beforeEach(() => resetEncounterState());

	it("does not spawn encounters too quickly", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000; // 1 second, well under 120s interval

		const before = world.runtime.alive.size;
		runEncounterSystem(world);

		expect(world.runtime.alive.size).toBe(before);
	});
});

describe("engine/systems/difficultyScalingSystem", () => {
	beforeEach(() => resetDifficultyScaling());

	it("applies elite difficulty multipliers to enemies", () => {
		const world = createGameWorld();
		world.campaign.difficulty = "elite";

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard", health: { current: 10, max: 10 },
		});
		Attack.damage[enemy] = 4;
		Speed.value[enemy] = 50;

		runDifficultyScalingSystem(world);

		expect(Health.max[enemy]).toBe(15); // 1.5x
		expect(Attack.damage[enemy]).toBe(5); // 1.25x
	});
});

describe("engine/systems/scoringSystem", () => {
	it("calculates star rating based on performance", () => {
		const world = createGameWorld();
		world.time.elapsedMs = 300_000; // 5 minutes
		world.session.objectives = [
			{ id: "primary", description: "Win", status: "completed", bonus: false },
			{ id: "bonus", description: "No losses", status: "completed", bonus: true },
		];

		// Spawn some surviving player units
		for (let i = 0; i < 6; i++) {
			spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
		}

		const score = calculateMissionScore(world);

		expect(score.stars).toBeGreaterThanOrEqual(2);
		expect(score.timeBonus).toBe(true);
		expect(score.objectiveBonus).toBe(true);
	});
});
