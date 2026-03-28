import { describe, expect, it } from "vitest";
import { createSeedBundle } from "../random/seed";
import { Attack, Speed } from "../world/components";
import {
	createGameWorld,
	getOrderQueue,
	getProductionQueue,
	spawnBuilding,
	spawnResource,
	spawnUnit,
} from "../world/gameWorld";
import { deserializeGameWorld, serializeGameWorld } from "./gameWorldSaveLoad";

function makeSeed() {
	return createSeedBundle({ phrase: "test-save-heron", source: "manual" });
}

describe("engine/persistence/gameWorldSaveLoad", () => {
	it("roundtrips a simple world with units", () => {
		const seed = makeSeed();
		const world = createGameWorld(seed);
		world.session.phase = "playing";
		world.session.currentMissionId = "mission_1";
		world.session.resources = { fish: 100, timber: 50, salvage: 25 };
		world.time.tick = 100;
		world.time.elapsedMs = 1600;
		world.navigation.width = 128;
		world.navigation.height = 96;

		const eid = spawnUnit(world, {
			x: 50,
			y: 75,
			faction: "ura",
			unitType: "river_rat",
			health: { current: 8, max: 10 },
			scriptId: "alpha",
		});
		Speed.value[eid] = 64;
		Attack.damage[eid] = 3;
		Attack.range[eid] = 48;

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		// Verify session state
		expect(restored.session.currentMissionId).toBe("mission_1");
		expect(restored.session.phase).toBe("playing");
		expect(restored.session.resources).toEqual({ fish: 100, timber: 50, salvage: 25 });

		// Verify time
		expect(restored.time.tick).toBe(100);
		expect(restored.time.elapsedMs).toBe(1600);

		// Verify navigation
		expect(restored.navigation.width).toBe(128);
		expect(restored.navigation.height).toBe(96);

		// Verify entity count
		expect(restored.runtime.alive.size).toBe(1);

		// Verify script tag
		expect(restored.runtime.scriptTagIndex.has("alpha")).toBe(true);
	});

	it("roundtrips buildings with construction progress", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";

		spawnBuilding(world, {
			x: 200,
			y: 300,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 40, max: 40 },
			construction: { progress: 75, buildTime: 5000 },
			scriptId: "base",
		});

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.runtime.alive.size).toBe(1);
		expect(restored.runtime.scriptTagIndex.has("base")).toBe(true);
	});

	it("roundtrips resources", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";

		spawnResource(world, {
			x: 150,
			y: 200,
			resourceType: "fish_node",
			scriptId: "fish_1",
		});

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.runtime.alive.size).toBe(1);
		expect(restored.runtime.scriptTagIndex.has("fish_1")).toBe(true);
	});

	it("roundtrips order queues", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";

		const eid = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "mudfoot",
		});
		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 200 });
		orders.push({ type: "attack", targetEid: 999 });

		const snapshot = serializeGameWorld(world);

		// Find the entity in snapshot
		expect(snapshot.entities[0].orders).toHaveLength(2);
		expect(snapshot.entities[0].orders[0].type).toBe("move");
		expect(snapshot.entities[0].orders[1].type).toBe("attack");
	});

	it("roundtrips production queues", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";

		const eid = spawnBuilding(world, {
			x: 200,
			y: 200,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 40, max: 40 },
		});
		const queue = getProductionQueue(world, eid);
		queue.push({ type: "unit", contentId: "river_rat", progress: 50 });

		const snapshot = serializeGameWorld(world);
		expect(snapshot.entities[0].productionQueue).toHaveLength(1);
		expect(snapshot.entities[0].productionQueue[0].progress).toBe(50);
	});

	it("roundtrips runtime state (weather, zones, scenario phase)", () => {
		const world = createGameWorld(makeSeed());
		world.runtime.weather = "monsoon";
		world.runtime.scenarioPhase = "phase_2";
		world.runtime.waveCounter = 3;
		world.runtime.revealedZones.add("zone_a");
		world.runtime.lockedZones.add("zone_b");

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.runtime.weather).toBe("monsoon");
		expect(restored.runtime.scenarioPhase).toBe("phase_2");
		expect(restored.runtime.waveCounter).toBe(3);
		expect(restored.runtime.revealedZones.has("zone_a")).toBe(true);
		expect(restored.runtime.lockedZones.has("zone_b")).toBe(true);
	});

	it("roundtrips objectives", () => {
		const world = createGameWorld(makeSeed());
		world.session.objectives = [
			{ id: "obj_1", description: "Capture the flag", status: "active", bonus: false },
			{ id: "obj_2", description: "No casualties", status: "active", bonus: true },
		];

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.session.objectives).toHaveLength(2);
		expect(restored.session.objectives[0].id).toBe("obj_1");
		expect(restored.session.objectives[1].bonus).toBe(true);
	});

	it("roundtrips campaign state", () => {
		const world = createGameWorld(makeSeed());
		world.campaign.currentMissionId = "mission_3";
		world.campaign.difficulty = "elite";

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.campaign.currentMissionId).toBe("mission_3");
		expect(restored.campaign.difficulty).toBe("elite");
	});

	it("roundtrips seed bundle", () => {
		const seed = makeSeed();
		const world = createGameWorld(seed);

		const snapshot = serializeGameWorld(world);
		const restored = deserializeGameWorld(snapshot);

		expect(restored.rng.phrase).toBe(seed.phrase);
		expect(restored.rng.designSeed).toBe(seed.designSeed);
	});

	it("serializes to valid JSON", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";
		spawnUnit(world, { x: 10, y: 20, faction: "ura" });

		const snapshot = serializeGameWorld(world);
		const json = JSON.stringify(snapshot);
		const parsed = JSON.parse(json);

		expect(parsed.version).toBe(1);
		expect(parsed.entities).toHaveLength(1);
	});

	it("handles multiple entities across factions", () => {
		const world = createGameWorld(makeSeed());
		world.session.phase = "playing";

		spawnUnit(world, { x: 10, y: 10, faction: "ura", unitType: "river_rat" });
		spawnUnit(world, { x: 50, y: 50, faction: "ura", unitType: "mudfoot" });
		spawnUnit(world, { x: 100, y: 100, faction: "scale_guard", unitType: "gator" });
		spawnBuilding(world, { x: 200, y: 200, faction: "ura", buildingType: "command_post" });
		spawnResource(world, { x: 300, y: 300, resourceType: "fish_node" });

		const snapshot = serializeGameWorld(world);
		expect(snapshot.entities).toHaveLength(5);

		const restored = deserializeGameWorld(snapshot);
		expect(restored.runtime.alive.size).toBe(5);
	});
});
