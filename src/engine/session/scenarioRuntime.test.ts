import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import { Objectives, ResourcePool, ScenarioRuntimeState } from "@/ecs/traits/state";
import { EventBus } from "@/game/EventBus";
import { createRng } from "../random/seed";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import {
	createScenarioActionHandler,
	handleScenarioEventFeedback,
	registerBuildPlacementHandler,
} from "./scenarioRuntime";

describe("engine/session/scenarioRuntime", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
	});

	afterEach(() => {
		EventBus.removeAllListeners();
		vi.restoreAllMocks();
	});

	it("updates objectives, resources, and runtime counters through scenario actions", () => {
		world.set(Objectives, {
			list: [{ id: "hold-line", description: "Hold the line", status: "active", bonus: false }],
		});
		world.set(ResourcePool, { fish: 100, timber: 100, salvage: 100 });
		const diagnostics = createEmptyDiagnosticsSnapshot();
		const handleAction = createScenarioActionHandler({
			world,
			missionId: "mission_1",
			rng: createRng(123),
			diagnostics,
		});

		handleAction({ type: "completeObjective", objectiveId: "hold-line" });
		handleAction({
			type: "addObjective",
			id: "secure-bridge",
			description: "Secure the bridge",
			objectiveType: "primary",
		});
		handleAction({ type: "grantResource", resource: "fish", amount: 25 });
		handleAction({ type: "startPhase", phase: "counterattack" });
		handleAction({ type: "setWaveCounter", value: 2 });
		handleAction({ type: "incrementWaveCounter", amount: 3 });

		expect(world.get(Objectives)?.list.find((o) => o.id === "hold-line")?.status).toBe("completed");
		expect(world.get(Objectives)?.list.find((o) => o.id === "secure-bridge")?.status).toBe("active");
		expect(world.get(ResourcePool)?.fish).toBe(125);
		expect(world.get(ScenarioRuntimeState)?.phase).toBe("counterattack");
		expect(world.get(ScenarioRuntimeState)?.waveCounter).toBe(5);
		expect(diagnostics.events.some((event) => event.type === "action:grantResource")).toBe(true);
	});

	it("registers deterministic build placement through the engine layer", () => {
		const emitSpy = vi.spyOn(EventBus, "emit");
		world.set(ResourcePool, { fish: 1000, timber: 1000, salvage: 1000 });

		const dispose = registerBuildPlacementHandler({
			world,
			mission: {
				zones: {
					ura_start: { x: 10, y: 20, width: 4, height: 3 },
				},
			},
			rng: createRng(777),
		});

		EventBus.emit("start-build-placement", { buildingType: "watchtower" });
		dispose();

		expect(emitSpy).toHaveBeenCalledWith(
			"hud-alert",
			expect.objectContaining({ severity: "info" }),
		);
		expect(world.get(ResourcePool)?.timber).toBeLessThan(1000);
	});

	it("emits HUD feedback for scenario events and keeps objectives in sync", () => {
		const emitSpy = vi.spyOn(EventBus, "emit");
		world.set(Objectives, {
			list: [{ id: "extract", description: "Extract", status: "active", bonus: false }],
		});

		handleScenarioEventFeedback(world, { type: "objectiveCompleted", objectiveId: "extract" });
		handleScenarioEventFeedback(world, { type: "allObjectivesCompleted" });
		handleScenarioEventFeedback(world, { type: "missionFailed", reason: "Captain down" });

		expect(world.get(Objectives)?.list[0]?.status).toBe("completed");
		expect(emitSpy).toHaveBeenCalledWith(
			"hud-alert",
			expect.objectContaining({ message: expect.stringContaining("Objective: extract") }),
		);
		expect(emitSpy).toHaveBeenCalledWith(
			"hud-alert",
			expect.objectContaining({ severity: "critical" }),
		);
	});
});
