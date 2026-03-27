import { describe, expect, it, vi } from "vitest";
import { Position, Selection } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	getProductionQueue,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { type BridgeCommand, processCommands } from "./commandProcessor";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
	initAudioRuntime: vi.fn(),
	playBattleMusic: vi.fn(),
	syncAudioFromWorld: vi.fn(),
}));

function createTestWorld() {
	const world = createGameWorld();
	world.session.phase = "playing";
	world.session.resources = { fish: 500, timber: 500, salvage: 500 };
	return world;
}

describe("commandProcessor", () => {
	describe("processCommands", () => {
		it("drains the command queue completely", () => {
			const world = createTestWorld();
			const queue: BridgeCommand[] = [{ type: "pause" }, { type: "resume" }];
			processCommands(world, queue);
			expect(queue).toHaveLength(0);
		});

		it("does nothing with empty queue", () => {
			const world = createTestWorld();
			const queue: BridgeCommand[] = [];
			processCommands(world, queue);
			expect(world.session.phase).toBe("playing");
		});
	});

	describe("pause/resume", () => {
		it("pauses the game", () => {
			const world = createTestWorld();
			processCommands(world, [{ type: "pause" }]);
			expect(world.session.phase).toBe("paused");
		});

		it("resumes the game", () => {
			const world = createTestWorld();
			world.session.phase = "paused";
			processCommands(world, [{ type: "resume" }]);
			expect(world.session.phase).toBe("playing");
		});

		it("does not resume if not paused", () => {
			const world = createTestWorld();
			world.session.phase = "victory";
			processCommands(world, [{ type: "resume" }]);
			expect(world.session.phase).toBe("victory");
		});
	});

	describe("move command", () => {
		it("sets move orders on selected entities", () => {
			const world = createTestWorld();
			const eid1 = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			const eid2 = spawnUnit(world, { x: 20, y: 20, faction: "ura" });
			Selection.selected[eid1] = 1;
			Selection.selected[eid2] = 1;

			processCommands(world, [{ type: "move", payload: { targetX: 100, targetY: 200 } }]);

			const q1 = getOrderQueue(world, eid1);
			const q2 = getOrderQueue(world, eid2);
			expect(q1).toHaveLength(1);
			expect(q1[0].type).toBe("move");
			expect(q1[0].targetX).toBe(100);
			expect(q1[0].targetY).toBe(200);
			expect(q2).toHaveLength(1);
			expect(q2[0].type).toBe("move");
		});

		it("does nothing when no entities selected", () => {
			const world = createTestWorld();
			spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			processCommands(world, [{ type: "move", payload: { targetX: 100, targetY: 200 } }]);
			// No crash, no orders set
			expect(world.runtime.orderQueues.size).toBe(0);
		});
	});

	describe("attack command", () => {
		it("sets attack orders on selected entities", () => {
			const world = createTestWorld();
			const eid = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			Selection.selected[eid] = 1;

			processCommands(world, [
				{ type: "attack", payload: { targetX: 50, targetY: 50, targetEid: 99 } },
			]);

			const q = getOrderQueue(world, eid);
			expect(q).toHaveLength(1);
			expect(q[0].type).toBe("attack");
			expect(q[0].targetEid).toBe(99);
		});
	});

	describe("stop command", () => {
		it("clears order queues on selected entities", () => {
			const world = createTestWorld();
			const eid = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
			Selection.selected[eid] = 1;
			const q = getOrderQueue(world, eid);
			q.push({ type: "move", targetX: 100, targetY: 100 });
			q.push({ type: "attack", targetX: 50, targetY: 50 });

			processCommands(world, [{ type: "stop" }]);
			expect(q).toHaveLength(0);
		});
	});

	describe("patrol command", () => {
		it("sets alternating patrol waypoints", () => {
			const world = createTestWorld();
			const eid = spawnUnit(world, { x: 10, y: 20, faction: "ura" });
			Selection.selected[eid] = 1;
			Position.x[eid] = 10;
			Position.y[eid] = 20;

			processCommands(world, [{ type: "patrol", payload: { targetX: 100, targetY: 200 } }]);

			const q = getOrderQueue(world, eid);
			expect(q).toHaveLength(2);
			expect(q[0].type).toBe("move");
			expect(q[0].targetX).toBe(100);
			expect(q[0].targetY).toBe(200);
			expect(q[1].type).toBe("move");
			expect(q[1].targetX).toBe(10);
			expect(q[1].targetY).toBe(20);
		});
	});

	describe("startBuild command", () => {
		it("emits enter-build-mode event", () => {
			const world = createTestWorld();
			processCommands(world, [{ type: "startBuild", payload: { buildingId: "barracks" } }]);

			expect(world.events).toHaveLength(1);
			expect(world.events[0].type).toBe("enter-build-mode");
			expect(world.events[0].payload?.buildingId).toBe("barracks");
		});
	});

	describe("queueUnit command", () => {
		it("adds a production entry to a selected building", () => {
			const world = createTestWorld();
			const buildingEid = spawnBuilding(world, {
				x: 50,
				y: 50,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 500, max: 500 },
			});
			Selection.selected[buildingEid] = 1;

			processCommands(world, [{ type: "queueUnit", payload: { unitId: "mudfoot" } }]);

			const q = getProductionQueue(world, buildingEid);
			expect(q).toHaveLength(1);
			expect(q[0].type).toBe("unit");
			expect(q[0].contentId).toBe("mudfoot");
			expect(q[0].progress).toBe(0);
		});

		it("finds any player building when none selected", () => {
			const world = createTestWorld();
			const buildingEid = spawnBuilding(world, {
				x: 50,
				y: 50,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 500, max: 500 },
			});

			processCommands(world, [{ type: "queueUnit", payload: { unitId: "mudfoot" } }]);

			const q = getProductionQueue(world, buildingEid);
			expect(q).toHaveLength(1);
			expect(q[0].contentId).toBe("mudfoot");
		});
	});

	describe("issueResearch command", () => {
		it("queues research at an armory building", () => {
			const world = createTestWorld();
			const armoryEid = spawnBuilding(world, {
				x: 50,
				y: 50,
				faction: "ura",
				buildingType: "armory",
				health: { current: 500, max: 500 },
			});
			Selection.selected[armoryEid] = 1;

			processCommands(world, [
				{ type: "issueResearch", payload: { researchId: "hardshell_armor" } },
			]);

			const q = getProductionQueue(world, armoryEid);
			expect(q).toHaveLength(1);
			expect(q[0].type).toBe("research");
			expect(q[0].contentId).toBe("hardshell_armor");
		});
	});

	describe("save command", () => {
		it("emits save-requested event", () => {
			const world = createTestWorld();
			world.time.tick = 42;
			processCommands(world, [{ type: "save" }]);

			expect(world.events).toHaveLength(1);
			expect(world.events[0].type).toBe("save-requested");
			expect(world.events[0].payload?.tick).toBe(42);
		});
	});

	describe("focusCamera command", () => {
		it("emits camera-focus event with tile coordinates", () => {
			const world = createTestWorld();
			processCommands(world, [{ type: "focusCamera", payload: { worldX: 320, worldY: 640 } }]);

			expect(world.events).toHaveLength(1);
			expect(world.events[0].type).toBe("camera-focus");
			expect(world.events[0].payload?.x).toBe(10); // 320 / 32
			expect(world.events[0].payload?.y).toBe(20); // 640 / 32
		});
	});

	describe("unknown command", () => {
		it("ignores unknown command types without crashing", () => {
			const world = createTestWorld();
			processCommands(world, [{ type: "nonexistent_command" }]);
			expect(world.session.phase).toBe("playing");
		});
	});
});
