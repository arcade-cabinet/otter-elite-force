import { describe, expect, it } from "vitest";
import { Faction, Flags, Position, Selection } from "../world/components";
import { createGameWorld, isAlive } from "../world/gameWorld";
import { bootstrapMission } from "./missionBootstrap";

describe("engine/session/missionBootstrap", () => {
	it("throws for unknown mission ID", () => {
		const world = createGameWorld();
		expect(() => bootstrapMission(world, "nonexistent_mission")).toThrow("unknown mission ID");
	});

	it("bootstraps mission_1 with correct session state", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		expect(world.session.currentMissionId).toBe("mission_1");
		expect(world.session.phase).toBe("playing");
		expect(world.campaign.currentMissionId).toBe("mission_1");
	});

	it("sets starting resources from mission definition", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Mission 1 starts with fish: 100, timber: 50, salvage: 0
		expect(world.session.resources.fish).toBe(100);
		expect(world.session.resources.timber).toBe(50);
		expect(world.session.resources.salvage).toBe(0);
	});

	it("sets terrain dimensions on navigation", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Mission 1 terrain is 128x96 tiles
		expect(world.navigation.width).toBe(128);
		expect(world.navigation.height).toBe(96);
	});

	it("registers zone rectangles in pixel coordinates", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		expect(world.runtime.zoneRects.size).toBeGreaterThan(0);
		const landingZone = world.runtime.zoneRects.get("landing_zone");
		expect(landingZone).toBeDefined();
		// landing_zone is at tile (16, 84) with size (96, 12)
		// In pixels: x=16*32=512, y=84*32=2688, w=96*32=3072, h=12*32=384
		expect(landingZone?.x).toBe(16 * 32);
		expect(landingZone?.y).toBe(84 * 32);
		expect(landingZone?.width).toBe(96 * 32);
		expect(landingZone?.height).toBe(12 * 32);
	});

	it("populates objectives from mission definition", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Mission 1 has 7 primary + 1 bonus objectives
		expect(world.session.objectives.length).toBe(8);

		const gatherTimber = world.session.objectives.find((obj) => obj.id === "gather-timber");
		expect(gatherTimber).toBeDefined();
		expect(gatherTimber?.status).toBe("active");
		expect(gatherTimber?.bonus).toBe(false);

		const bonusSalvage = world.session.objectives.find((obj) => obj.id === "bonus-salvage");
		expect(bonusSalvage).toBeDefined();
		expect(bonusSalvage?.bonus).toBe(true);
	});

	it("spawns player lodge (burrow) as a building", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Find the burrow building
		const burrowEids = [...world.runtime.alive].filter(
			(eid) => world.runtime.entityTypeIndex.get(eid) === "burrow" && Flags.isBuilding[eid] === 1,
		);
		expect(burrowEids.length).toBe(1);

		const burrowEid = burrowEids[0];
		// Lodge should be player faction (ura = 1)
		expect(Faction.id[burrowEid]).toBe(1);
		expect(isAlive(world, burrowEid)).toBe(true);
	});

	it("spawns initial otter workers (river_rats)", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Mission 1 places 4 river_rat units for the player
		const riverRatEids = [...world.runtime.alive].filter(
			(eid) =>
				world.runtime.entityTypeIndex.get(eid) === "river_rat" &&
				Faction.id[eid] === 1 &&
				Flags.isBuilding[eid] === 0 &&
				Flags.isResource[eid] === 0,
		);
		expect(riverRatEids.length).toBe(4);
	});

	it("spawns enemy units", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// Mission 1 has gators, a skink, and a viper in the outpost
		const enemyEids = [...world.runtime.alive].filter(
			(eid) => Faction.id[eid] === 2 && Flags.isBuilding[eid] === 0 && Flags.isResource[eid] === 0,
		);
		// 6 gators + 1 skink + 1 viper = 8 enemy units
		expect(enemyEids.length).toBe(8);
	});

	it("spawns enemy flag_post building", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		const flagPostEids = [...world.runtime.alive].filter(
			(eid) =>
				world.runtime.entityTypeIndex.get(eid) === "flag_post" &&
				Flags.isBuilding[eid] === 1 &&
				Faction.id[eid] === 2,
		);
		expect(flagPostEids.length).toBe(1);
	});

	it("spawns resource nodes", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		const resourceEids = [...world.runtime.alive].filter((eid) => Flags.isResource[eid] === 1);
		// 12 mangrove_trees + 4 fish_spots + 3 salvage_caches = 19 resources
		expect(resourceEids.length).toBe(19);
	});

	it("places entities at correct pixel coordinates", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		// The burrow is placed at tile (40, 68) -> pixel (40*32+16, 68*32+16) = (1296, 2192)
		const burrowEid = [...world.runtime.alive].find(
			(eid) => world.runtime.entityTypeIndex.get(eid) === "burrow" && Flags.isBuilding[eid] === 1,
		);
		expect(burrowEid).toBeDefined();
		if (burrowEid !== undefined) {
			expect(Position.x[burrowEid]).toBe(40 * 32 + 16);
			expect(Position.y[burrowEid]).toBe(68 * 32 + 16);
		}
	});

	it("auto-selects first player entity", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		const selectedEids = [...world.runtime.alive].filter((eid) => Selection.selected[eid] === 1);
		expect(selectedEids.length).toBeGreaterThanOrEqual(1);
		// The first player entity (burrow) should be selected
		expect(Faction.id[selectedEids[0]]).toBe(1);
	});

	it("records bootstrap diagnostic event", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		const bootstrapEvent = world.diagnostics.events.find(
			(event) => event.type === "mission-bootstrapped",
		);
		expect(bootstrapEvent).toBeDefined();
		expect(bootstrapEvent?.payload?.missionId).toBe("mission_1");
		// 1 burrow + 4 river_rats + 12 mangrove_trees + 4 fish_spots + 3 salvage_caches
		// + 1 flag_post + 6 gators + 1 skink + 1 viper = 33
		expect(bootstrapEvent?.payload?.placements).toBe(33);
	});

	it("sets scenario runtime state to initial", () => {
		const world = createGameWorld();
		bootstrapMission(world, "mission_1");

		expect(world.runtime.scenarioPhase).toBe("initial");
		expect(world.runtime.waveCounter).toBe(0);
	});
});
