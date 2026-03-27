/**
 * Command Processor — Drains the bridge command queue each tick and
 * dispatches commands to the appropriate game systems.
 *
 * This is the critical link between UI buttons (which push to the
 * SolidBridge command queue) and the actual game state. Without this,
 * every HUD button is cosmetic.
 */

import { playSfx } from "@/engine/audio/audioRuntime";
import { queueResearch } from "@/engine/systems/researchSystem";
import { Faction, Flags, Position, Selection } from "@/engine/world/components";
import {
	type GameWorld,
	getOrderQueue,
	getProductionQueue,
	type Order,
} from "@/engine/world/gameWorld";

/**
 * A command from the UI bridge command queue.
 */
export interface BridgeCommand {
	type: string;
	payload?: Record<string, unknown>;
}

/**
 * Drain the command queue and dispatch each command to the game systems.
 * Call this once per tick, before running systems.
 */
export function processCommands(world: GameWorld, commandQueue: BridgeCommand[]): void {
	while (commandQueue.length > 0) {
		const command = commandQueue.shift();
		if (!command) break;
		dispatchCommand(world, command);
	}
}

function getSelectedEntityIds(world: GameWorld): number[] {
	const ids: number[] = [];
	for (const eid of world.runtime.alive) {
		if (Selection.selected[eid] === 1) {
			ids.push(eid);
		}
	}
	return ids;
}

function getSelectedBuildings(world: GameWorld): number[] {
	const ids: number[] = [];
	for (const eid of world.runtime.alive) {
		if (Selection.selected[eid] === 1 && Flags.isBuilding[eid] === 1) {
			ids.push(eid);
		}
	}
	return ids;
}

function dispatchCommand(world: GameWorld, command: BridgeCommand): void {
	switch (command.type) {
		case "move":
			handleMoveCommand(world, command);
			break;
		case "attack":
			handleAttackCommand(world, command);
			break;
		case "stop":
			handleStopCommand(world);
			break;
		case "patrol":
			handlePatrolCommand(world, command);
			break;
		case "startBuild":
			handleStartBuildCommand(world, command);
			break;
		case "queueUnit":
			handleQueueUnitCommand(world, command);
			break;
		case "issueResearch":
			handleIssueResearchCommand(world, command);
			break;
		case "pause":
			handlePauseCommand(world);
			break;
		case "resume":
			handleResumeCommand(world);
			break;
		case "save":
			handleSaveCommand(world);
			break;
		case "focusCamera":
			handleFocusCameraCommand(world, command);
			break;
		default:
			// Unknown command type — ignore
			break;
	}
}

function handleMoveCommand(world: GameWorld, command: BridgeCommand): void {
	const targetX = Number(command.payload?.targetX ?? 0);
	const targetY = Number(command.payload?.targetY ?? 0);
	const selected = getSelectedEntityIds(world);
	if (selected.length === 0) return;

	for (const eid of selected) {
		const queue = getOrderQueue(world, eid);
		queue.length = 0;
		const order: Order = { type: "move", targetX, targetY };
		queue.push(order);
	}
	playSfx("unitMove");
}

function handleAttackCommand(world: GameWorld, command: BridgeCommand): void {
	const targetEid = command.payload?.targetEid as number | undefined;
	const targetX = Number(command.payload?.targetX ?? 0);
	const targetY = Number(command.payload?.targetY ?? 0);
	const selected = getSelectedEntityIds(world);
	if (selected.length === 0) return;

	for (const eid of selected) {
		const queue = getOrderQueue(world, eid);
		queue.length = 0;
		const order: Order = { type: "attack", targetEid, targetX, targetY };
		queue.push(order);
	}
	playSfx("unitAttack");
}

function handleStopCommand(world: GameWorld): void {
	const selected = getSelectedEntityIds(world);
	if (selected.length === 0) return;

	for (const eid of selected) {
		const queue = getOrderQueue(world, eid);
		queue.length = 0;
	}
}

function handlePatrolCommand(world: GameWorld, command: BridgeCommand): void {
	const targetX = Number(command.payload?.targetX ?? 0);
	const targetY = Number(command.payload?.targetY ?? 0);
	const selected = getSelectedEntityIds(world);
	if (selected.length === 0) return;

	for (const eid of selected) {
		const queue = getOrderQueue(world, eid);
		queue.length = 0;
		// Patrol: move between current position and target
		const startX = Position.x[eid];
		const startY = Position.y[eid];
		queue.push({ type: "move", targetX, targetY });
		queue.push({ type: "move", targetX: startX, targetY: startY });
	}
	playSfx("unitMove");
}

function handleStartBuildCommand(world: GameWorld, command: BridgeCommand): void {
	const buildingId = String(command.payload?.buildingId ?? "");
	if (!buildingId) return;

	// Set a flag on the world so the runtime knows to enter build placement mode.
	// The runtime will handle the actual placement on the next click.
	world.events.push({
		type: "enter-build-mode",
		payload: { buildingId },
	});
	playSfx("buildStart");
}

function handleQueueUnitCommand(world: GameWorld, command: BridgeCommand): void {
	const unitId = String(command.payload?.unitId ?? "");
	if (!unitId) return;

	// Find a selected building that can produce this unit
	const buildings = getSelectedBuildings(world);
	if (buildings.length === 0) {
		// If no building selected, find any player building that can produce this unit type
		for (const eid of world.runtime.alive) {
			if (Flags.isBuilding[eid] === 1 && Faction.id[eid] === 1) {
				buildings.push(eid);
			}
		}
	}

	if (buildings.length === 0) return;

	// Queue on the first suitable building
	const buildingEid = buildings[0];
	const queue = getProductionQueue(world, buildingEid);
	queue.push({
		type: "unit",
		contentId: unitId,
		progress: 0,
	});
	playSfx("buildStart");
}

function handleIssueResearchCommand(world: GameWorld, command: BridgeCommand): void {
	const researchId = String(command.payload?.researchId ?? "");
	if (!researchId) return;

	// Find a selected building that can research, or any armory/research_den
	const buildings = getSelectedBuildings(world);
	let targetBuilding: number | null = null;

	for (const eid of buildings) {
		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType === "armory" || buildingType === "research_den") {
			targetBuilding = eid;
			break;
		}
	}

	// Fallback: find any player armory or research_den
	if (targetBuilding === null) {
		for (const eid of world.runtime.alive) {
			if (Flags.isBuilding[eid] !== 1 || Faction.id[eid] !== 1) continue;
			const buildingType = world.runtime.entityTypeIndex.get(eid);
			if (buildingType === "armory" || buildingType === "research_den") {
				targetBuilding = eid;
				break;
			}
		}
	}

	if (targetBuilding === null) return;

	const success = queueResearch(world, targetBuilding, researchId);
	if (success) {
		playSfx("buildStart");
	} else {
		playSfx("errorAction");
	}
}

function handlePauseCommand(world: GameWorld): void {
	if (world.session.phase === "playing") {
		world.session.phase = "paused";
	}
}

function handleResumeCommand(world: GameWorld): void {
	if (world.session.phase === "paused") {
		world.session.phase = "playing";
	}
}

function handleSaveCommand(world: GameWorld): void {
	// Emit a save event that the persistence layer can pick up
	world.events.push({
		type: "save-requested",
		payload: { tick: world.time.tick },
	});
}

function handleFocusCameraCommand(world: GameWorld, command: BridgeCommand): void {
	const worldX = Number(command.payload?.worldX ?? 0);
	const worldY = Number(command.payload?.worldY ?? 0);
	world.events.push({
		type: "camera-focus",
		payload: { x: Math.floor(worldX / 32), y: Math.floor(worldY / 32) },
	});
}
