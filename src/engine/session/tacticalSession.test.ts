import { createWorld } from "koota";
import { describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import { ScriptTag } from "@/ecs/traits/identity";
import { CurrentMission, NavGraphState, Objectives } from "@/ecs/traits/state";
import { spawnBuilding, spawnUnit } from "@/entities/spawner";
import { createGameWorld } from "../world/gameWorld";
import { getBuilding, getUnit } from "@/entities/registry";
import {
	bootstrapCampaignWorld,
	createCampaignRuntimeSession,
	createScenarioWorldQuery,
	createSkirmishRuntimeSession,
	describeCampaignRuntimeSession,
	describeSkirmishRuntimeSession,
	resolvePlacementPosition,
	seedGameWorldFromCampaignSession,
	seedGameWorldFromSkirmishSession,
} from "./tacticalSession";

describe("engine/session/tacticalSession", () => {
	it("creates campaign runtime sessions with deterministic diagnostics", () => {
		const session = createCampaignRuntimeSession("mission_1");
		expect(session.mission.id).toBe("mission_1");
		expect(session.diagnostics.missionId).toBe("mission_1");
		expect(session.diagnostics.seedPhrase).toBe(session.seed.phrase);
	});

	it("creates skirmish runtime sessions with generated map diagnostics", () => {
		const session = createSkirmishRuntimeSession({
			mapId: "sk_river_crossing",
			mapName: "River Crossing",
			difficulty: "medium",
			playAsScaleGuard: false,
			preset: "meso",
			seed: {
				phrase: "silent-ember-heron",
				source: "skirmish",
				numericSeed: 1,
				designSeed: 2,
				gameplaySeeds: { loot: 3 },
			},
			startingResources: { fish: 300, timber: 200, salvage: 100 },
		});
		expect(session.map.cols).toBeGreaterThan(0);
		expect(session.diagnostics.events[0]?.type).toBe("skirmish-map-generated");
	});

	it("builds shared runtime descriptors for campaign and skirmish sessions", () => {
		const campaign = createCampaignRuntimeSession("mission_1");
		const skirmish = createSkirmishRuntimeSession({
			mapId: "sk_river_crossing",
			mapName: "River Crossing",
			difficulty: "medium",
			playAsScaleGuard: false,
			preset: "meso",
			seed: {
				phrase: "silent-ember-heron",
				source: "skirmish",
				numericSeed: 1,
				designSeed: 2,
				gameplaySeeds: { loot: 3 },
			},
			startingResources: { fish: 300, timber: 200, salvage: 100 },
		});

		const campaignDescriptor = describeCampaignRuntimeSession(campaign);
		const skirmishDescriptor = describeSkirmishRuntimeSession(skirmish);

		expect(campaignDescriptor.worldSize?.width).toBeGreaterThan(0);
		expect(campaignDescriptor.cameraFocus.x).toBeGreaterThanOrEqual(0);
		expect(skirmishDescriptor.mapSummary?.playerStart).toBeTruthy();
		expect(skirmishDescriptor.cameraFocus.x).toBe(skirmish.map.playerStart.tileX);
	});

	it("resolves placement positions deterministically using script ids", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const placement = {
			type: "river_rat",
			zone: "landing_zone",
			scriptId: "alpha",
		};
		expect(resolvePlacementPosition(placement, session.mission, 0)).toEqual(
			resolvePlacementPosition(placement, session.mission, 0),
		);
	});

	it("prefers ScriptTag identity over UnitType fallback in scenario queries", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createWorld();
		const building = getBuilding("flag_post");
		const unit = getUnit("mudfoot");
		if (!building || !unit) {
			throw new Error("Missing test fixture entity definitions");
		}
		const taggedBuilding = spawnBuilding(world, building, 10, 10, "scale_guard", "outpost_core");
		spawnUnit(world, unit, 4, 4, "ura", "captain_alpha");

		taggedBuilding.set(ScriptTag, { id: "outpost_core" });
		const query = createScenarioWorldQuery(world, session.mission);
		expect(query.getEntityHealthPercent("outpost_core")).toBe(100);
		expect(query.isBuildingDestroyed("outpost_core")).toBe(false);
	});

	it("bootstraps campaign world state, objectives, and navigation through the engine layer", () => {
		const world = createWorld();
		initSingletons(world);
		const bootstrap = bootstrapCampaignWorld(world, "mission_1", () => {});

		expect(world.get(CurrentMission)?.missionId).toBe("mission_1");
		expect(world.get(Objectives)?.list.length).toBeGreaterThan(0);
		expect(world.get(NavGraphState)?.graph).toBeTruthy();
		expect(bootstrap.worldQuery.elapsedTime).toBe(0);
		expect(bootstrap.focusTile.x).toBeGreaterThanOrEqual(0);
		expect(bootstrap.session.diagnostics.events.some((event) => event.type === "campaign-bootstrap")).toBe(
			true,
		);
	});

	it("seeds engine GameWorld state from a campaign session", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createGameWorld(session.seed);

		seedGameWorldFromCampaignSession(world, session);

		expect(world.session.currentMissionId).toBe("mission_1");
		expect(world.session.objectives[0]?.description).toBeTruthy();
		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(world.runtime.scriptTagIndex.size).toBeGreaterThanOrEqual(0);
		expect(world.navigation.width).toBe(session.mission.terrain.width);
	});

	it("seeds engine GameWorld state from a skirmish session", () => {
		const session = createSkirmishRuntimeSession({
			mapId: "sk_river_crossing",
			mapName: "River Crossing",
			difficulty: "medium",
			playAsScaleGuard: false,
			preset: "meso",
			seed: {
				phrase: "silent-ember-heron",
				source: "skirmish",
				numericSeed: 1,
				designSeed: 2,
				gameplaySeeds: { loot: 3 },
			},
			startingResources: { fish: 300, timber: 200, salvage: 100 },
		});
		const world = createGameWorld(session.config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		expect(world.session.currentMissionId).toBe("sk_river_crossing");
		expect(world.session.objectives[0]?.description).toContain("Defeat");
		expect(world.runtime.alive.size).toBeGreaterThanOrEqual(10);
		expect(world.navigation.width).toBe(session.map.cols);
		expect(world.runtime.scriptTagIndex.has("player_base")).toBe(true);
	});
});
