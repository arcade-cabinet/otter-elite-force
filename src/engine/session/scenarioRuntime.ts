import type { World } from "koota";
import { AIState } from "@/ecs/traits/ai";
import { Gatherer } from "@/ecs/traits/economy";
import { Faction } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import {
	DialogueState,
	GamePhase,
	Objectives,
	ResourcePool,
	ScenarioRuntimeState,
} from "@/ecs/traits/state";
import { getBuilding, getHero, getUnit } from "@/entities/registry";
import { spawnBuilding, spawnUnit } from "@/entities/spawner";
import { EventBus } from "@/game/EventBus";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import type { Rng } from "../random/seed";
import { recordDiagnosticEvent } from "../diagnostics/runtimeDiagnostics";
import type { DiagnosticSnapshot } from "../diagnostics/types";
import type { ActionHandler, ScenarioEvent } from "@/scenarios/engine";
import type { ObjectiveStatus, TriggerAction } from "@/scenarios/types";

function updateObjectiveStatus(
	world: World,
	objectiveId: string,
	status: ObjectiveStatus,
): void {
	const objectives = world.get(Objectives)?.list ?? [];
	const next = objectives.map((objective) =>
		objective.id === objectiveId ? { ...objective, status } : objective,
	);
	world.set(Objectives, { list: next });
}

function ensureObjective(
	world: World,
	action: Extract<TriggerAction, { type: "addObjective" }>,
): void {
	const objectives = world.get(Objectives)?.list ?? [];
	if (objectives.some((objective) => objective.id === action.id)) return;
	world.set(Objectives, {
		list: [
			...objectives,
			{
				id: action.id,
				description: action.description,
				status: "active",
				bonus: action.objectiveType === "bonus",
			},
		],
	});
}

function adjustResourcePool(
	world: World,
	resource: "fish" | "timber" | "salvage",
	amount: number,
): void {
	const pool = world.get(ResourcePool);
	if (!pool) return;
	world.set(ResourcePool, {
		...pool,
		[resource]: pool[resource] + amount,
	});
}

function handleBuildPlacement(
	world: World,
	mission: {
		zones?: Record<string, { x: number; y: number; width: number; height: number }>;
	},
	buildingType: string,
	rng: Rng,
): void {
	const buildingDef = getBuilding(buildingType);
	if (!buildingDef) return;

	const resources = world.get(ResourcePool);
	if (!resources) return;
	const cost = buildingDef.cost ?? {};
	if (
		(cost.fish ?? 0) > resources.fish ||
		(cost.timber ?? 0) > resources.timber ||
		(cost.salvage ?? 0) > resources.salvage
	) {
		EventBus.emit("hud-alert", { message: "Not enough resources!", severity: "critical" });
		return;
	}

	world.set(ResourcePool, {
		fish: resources.fish - (cost.fish ?? 0),
		timber: resources.timber - (cost.timber ?? 0),
		salvage: resources.salvage - (cost.salvage ?? 0),
	});

	const startZone = mission.zones?.base_clearing ?? mission.zones?.ura_start;
	const bx = (startZone?.x ?? 12) + rng.nextInt(startZone?.width ?? 6);
	const by = (startZone?.y ?? 37) + rng.nextInt(startZone?.height ?? 4);

	spawnBuilding(world, buildingDef, bx, by, "ura");
	EventBus.emit("hud-alert", { message: `${buildingDef.name} placed!`, severity: "info" });

	for (const entity of world.query(OrderQueue, Faction, Gatherer)) {
		if (entity.get(Faction)?.id !== "ura") continue;
		const ai = entity.has(AIState) ? entity.get(AIState) : null;
		if (ai && ai.state !== "idle") continue;
		const queue = entity.get(OrderQueue);
		if (!queue) continue;
		queue.length = 0;
		queue.push({ type: "build", targetX: bx, targetY: by });
		if (entity.has(AIState)) entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
	}
}

export function registerBuildPlacementHandler(params: {
	world: World;
	mission: {
		zones?: Record<string, { x: number; y: number; width: number; height: number }>;
	};
	rng: Rng;
}): () => void {
	const onStartBuild = (data: { buildingType: string }) => {
		handleBuildPlacement(params.world, params.mission, data.buildingType, params.rng);
	};

	EventBus.on("start-build-placement", onStartBuild);
	return () => {
		EventBus.off("start-build-placement", onStartBuild);
	};
}

export function createScenarioActionHandler(params: {
	world: World;
	missionId: string;
	rng: Rng;
	diagnostics?: DiagnosticSnapshot;
}): ActionHandler {
	return (action: TriggerAction) => {
		recordDiagnosticEvent(params.diagnostics ?? createEmptyDiagnosticsSnapshot(), `action:${action.type}`);

		if (action.type === "spawnUnits") {
			const unitDef = getUnit(action.unitType) ?? getHero(action.unitType);
			if (!unitDef) return;
			for (let i = 0; i < (action.count ?? 1); i++) {
				const jitterX = params.rng.next() - 0.5;
				const jitterY = params.rng.next() - 0.5;
				spawnUnit(
					params.world,
					unitDef,
					action.position.x + jitterX * 2,
					action.position.y + jitterY * 2,
					action.faction,
				);
			}
			return;
		}

		if (action.type === "showDialogue") {
			EventBus.emit("hud-alert", {
				message: `${action.speaker}: ${action.text}`,
				severity: "info",
			});
			return;
		}

		if (action.type === "showDialogueExchange") {
			params.world.set(DialogueState, {
				active: true,
				lines: action.lines,
				currentLine: 0,
				pauseGame: action.pauseGame ?? true,
				triggerId: null,
			});
			if (action.pauseGame !== false) {
				params.world.set(GamePhase, { phase: "paused" });
			}
			return;
		}

		if (action.type === "victory") {
			EventBus.emit("mission-complete", { missionId: params.missionId, stars: 1, stats: {} });
			return;
		}

		if (action.type === "failMission") {
			EventBus.emit("mission-failed", { reason: action.reason });
			return;
		}

		if (action.type === "grantResource") {
			adjustResourcePool(params.world, action.resource, action.amount);
			EventBus.emit("hud-alert", {
				message: `Granted ${action.amount} ${action.resource}`,
				severity: "info",
			});
			return;
		}

		if (action.type === "addObjective") {
			ensureObjective(params.world, action);
			return;
		}

		if (action.type === "completeObjective") {
			updateObjectiveStatus(params.world, action.objectiveId, "completed");
			return;
		}

		if (action.type === "startPhase") {
			const runtime = params.world.get(ScenarioRuntimeState);
			params.world.set(ScenarioRuntimeState, {
				phase: action.phase,
				waveCounter: runtime?.waveCounter ?? 0,
			});
			return;
		}

		if (action.type === "setWaveCounter") {
			const runtime = params.world.get(ScenarioRuntimeState);
			params.world.set(ScenarioRuntimeState, {
				phase: runtime?.phase ?? "initial",
				waveCounter: action.value,
			});
			return;
		}

		if (action.type === "incrementWaveCounter") {
			const runtime = params.world.get(ScenarioRuntimeState);
			params.world.set(ScenarioRuntimeState, {
				phase: runtime?.phase ?? "initial",
				waveCounter: (runtime?.waveCounter ?? 0) + (action.amount ?? 1),
			});
		}
	};
}

export function handleScenarioEventFeedback(
	world: World,
	event: ScenarioEvent,
): void {
	if (event.type === "objectiveCompleted") {
		updateObjectiveStatus(world, event.objectiveId, "completed");
		EventBus.emit("hud-alert", {
			message: `Objective: ${event.objectiveId}`,
			severity: "info",
		});
		return;
	}

	if (event.type === "objectiveFailed") {
		updateObjectiveStatus(world, event.objectiveId, "failed");
		EventBus.emit("hud-alert", {
			message: `Objective failed: ${event.objectiveId}`,
			severity: "warning",
		});
		return;
	}

	if (event.type === "allObjectivesCompleted") {
		EventBus.emit("hud-alert", { message: "All objectives complete!", severity: "info" });
		return;
	}

	if (event.type === "missionFailed") {
		EventBus.emit("hud-alert", {
			message: `Mission failed: ${event.reason}`,
			severity: "critical",
		});
	}
}
