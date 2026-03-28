import { describe, expect, it } from "vitest";
import type { MissionDef } from "@/entities/types";
import { createGameWorld } from "../world/gameWorld";
import { createRuntimeMissionFlow } from "./runtimeMissionFlow";
import { createCampaignRuntimeSession, seedGameWorldFromCampaignSession } from "./tacticalSession";

describe("engine/session/runtimeMissionFlow", () => {
	it("fires authored timer dialogue triggers into the active runtime world", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createGameWorld(session.seed);
		seedGameWorldFromCampaignSession(world, session);
		const flow = createRuntimeMissionFlow({ world, mission: session.mission });

		world.time.elapsedMs = 16_000;
		flow.step();

		expect(world.session.dialogue?.active).toBe(true);
		expect(world.session.dialogue?.lines[0]?.speaker).toBe("FOXHOUND");

		flow.dispose();
	});

	it("completes authored resource-threshold objectives and advances scenario state", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createGameWorld(session.seed);
		seedGameWorldFromCampaignSession(world, session);
		const flow = createRuntimeMissionFlow({ world, mission: session.mission });

		world.session.resources.timber = 150;
		flow.step();

		expect(
			world.session.objectives.find((objective) => objective.id === "gather-timber")?.status,
		).toBe("completed");
		expect(world.runtime.scenarioPhase).toBe("base-building");

		flow.dispose();
	});

	it("records authored dialogue duration in runtime world state", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createGameWorld(session.seed);
		const timedMission: MissionDef = {
			...session.mission,
			triggers: [
				{
					id: "timed-dialogue",
					condition: { type: "timer", time: 1 },
					action: {
						type: "showDialogue",
						portrait: "foxhound",
						speaker: "FOXHOUND",
						text: "Timed update",
						duration: 3,
					},
					once: true,
				},
			],
		};
		seedGameWorldFromCampaignSession(world, session);
		const flow = createRuntimeMissionFlow({ world, mission: timedMission });

		world.time.elapsedMs = 2_000;
		flow.step();
		expect(world.session.dialogue?.active).toBe(true);
		expect(world.session.dialogue?.expiresAtMs).toBe(5_000);

		flow.dispose();
	});

	it("applies authored weather, camera, zone reveal, reinforcement, and boss actions into runtime state", () => {
		const session = createCampaignRuntimeSession("mission_1");
		const world = createGameWorld(session.seed);
		const scriptedMission: MissionDef = {
			...session.mission,
			triggers: [
				{
					id: "runtime-authoring",
					condition: { type: "timer", time: 1 },
					action: [
						{ type: "changeWeather", weather: "monsoon" },
						{ type: "revealZone", zoneId: "north_beach" },
						{ type: "panCamera", target: { x: 10, y: 12 }, duration: 2_000 },
						{
							type: "spawnReinforcements",
							faction: "ura",
							units: [{ unitType: "mudfoot", count: 2, position: { x: 14, y: 15 } }],
							dialogue: {
								portrait: "foxhound",
								speaker: "FOXHOUND",
								text: "Reinforcements inbound.",
							},
						},
						{
							type: "spawnBossUnit",
							name: "Kommandant Ironjaw",
							unitType: "gator",
							faction: "scale_guard",
							position: { x: 20, y: 18 },
							hp: 500,
							armor: 12,
							damage: 40,
							range: 5,
							attackCooldown: 1.5,
							speed: 2.5,
							visionRadius: 8,
							phases: [{ name: "Commander", hpThreshold: 100, abilities: ["roar"] }],
						},
					],
					once: true,
				},
			],
		};
		seedGameWorldFromCampaignSession(world, session);
		const flow = createRuntimeMissionFlow({ world, mission: scriptedMission });

		world.time.elapsedMs = 2_000;
		flow.step();

		expect(world.runtime.weather).toBe("monsoon");
		expect(world.runtime.revealedZones.has("north_beach")).toBe(true);
		expect(world.events.some((event) => event.type === "camera-focus")).toBe(true);
		expect(world.session.dialogue?.lines[0]?.text).toBe("Reinforcements inbound.");
		expect(
			[...world.runtime.alive].filter((eid) => world.runtime.entityTypeIndex.get(eid) === "mudfoot")
				.length,
		).toBeGreaterThanOrEqual(2);
		expect([...world.runtime.bossConfigs.values()].length).toBe(1);
		expect(world.diagnostics.events.some((event) => event.type === "weather-changed")).toBe(true);

		flow.dispose();
	});
});
