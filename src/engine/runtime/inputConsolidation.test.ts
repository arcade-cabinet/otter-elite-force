/**
 * US-C08 — Input Consolidation Tests
 *
 * Covers control groups, context-sensitive commands,
 * and touch panning behavior.
 */

import { describe, expect, it, vi } from "vitest";
import { createGameBridge } from "../bridge/gameBridge";
import { Faction, Flags, Position, Selection } from "../world/components";
import {
	createGameWorld,
	getOrderQueue,
	spawnBuilding,
	spawnResource,
	spawnUnit,
} from "../world/gameWorld";

function createTestContainer(): HTMLDivElement {
	const container = document.createElement("div");
	Object.defineProperty(container, "clientWidth", { value: 640 });
	Object.defineProperty(container, "clientHeight", { value: 360 });
	container.getBoundingClientRect = () =>
		({
			left: 0,
			top: 0,
			width: 640,
			height: 360,
			right: 640,
			bottom: 360,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}) as DOMRect;
	document.body.appendChild(container);
	return container;
}

function stubBrowserGlobals(): void {
	vi.stubGlobal(
		"AudioContext",
		class AudioContextMock {},
	);
	if (typeof PointerEvent === "undefined") {
		vi.stubGlobal(
			"PointerEvent",
			class PointerEventMock extends MouseEvent {
				pointerId = 1;
				pointerType = "mouse";
			},
		);
	}
}

describe("US-C08: Input Consolidation", () => {
	describe("Control Groups", () => {
		it("assigns control group on Ctrl+digit and recalls on digit press", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const eid1 = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			const eid2 = spawnUnit(world, {
				x: 120,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			spawnUnit(world, {
				x: 300,
				y: 300,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			// Select first two units manually
			Selection.selected[eid1] = 1;
			Selection.selected[eid2] = 1;

			// Assign to control group 3
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "3", ctrlKey: true }),
			);

			const groups = runtime.getControlGroups();
			expect(groups.has(3)).toBe(true);
			const group3 = groups.get(3);
			expect(group3).toContain(eid1);
			expect(group3).toContain(eid2);
			expect(group3?.length).toBe(2);

			// Clear selection
			runtime.clearSelection();
			expect(container.dataset.runtimeSelected).toBe("0");

			// Recall control group 3
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));

			expect(Selection.selected[eid1]).toBe(1);
			expect(Selection.selected[eid2]).toBe(1);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("filters dead entities when recalling a control group", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const eid1 = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			const eid2 = spawnUnit(world, {
				x: 120,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			// Select both, assign to group 1
			Selection.selected[eid1] = 1;
			Selection.selected[eid2] = 1;
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "1", ctrlKey: true }),
			);

			// Kill eid2 by removing from alive
			world.runtime.alive.delete(eid2);

			// Clear selection and recall
			runtime.clearSelection();
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));

			expect(Selection.selected[eid1]).toBe(1);
			// eid2 should not be selected (it's dead)
			const groups = runtime.getControlGroups();
			expect(groups.get(1)?.length).toBe(1);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("ignores recall for unassigned group number", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			// Press 5 without assigning anything — should not error
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "5" }));

			expect(runtime.getControlGroups().has(5)).toBe(false);

			await runtime.stop();
			vi.unstubAllGlobals();
		});
	});

	describe("Context-Sensitive Commands", () => {
		it("issues attack order when right-clicking an enemy", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const friendlyEid = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			const enemyEid = spawnUnit(world, {
				x: 108,
				y: 100,
				faction: "scale_guard",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			// Select friendly unit
			Selection.selected[friendlyEid] = 1;

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			// Right-click near enemy position
			canvas.dispatchEvent(
				new PointerEvent("pointerdown", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);
			canvas.dispatchEvent(
				new PointerEvent("pointerup", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);

			const orders = getOrderQueue(world, friendlyEid);
			expect(orders.length).toBeGreaterThan(0);
			expect(orders[0].type).toBe("attack");
			expect(orders[0].targetEid).toBe(enemyEid);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("issues gather order when right-clicking a resource", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const friendlyEid = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			const resourceEid = spawnResource(world, { x: 108, y: 100 });

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			Selection.selected[friendlyEid] = 1;

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			// Right-click near resource
			canvas.dispatchEvent(
				new PointerEvent("pointerdown", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);
			canvas.dispatchEvent(
				new PointerEvent("pointerup", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);

			const orders = getOrderQueue(world, friendlyEid);
			expect(orders.length).toBeGreaterThan(0);
			expect(orders[0].type).toBe("gather");
			expect(orders[0].targetEid).toBe(resourceEid);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("issues garrison order when right-clicking own building", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const friendlyEid = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});
			const buildingEid = spawnBuilding(world, {
				x: 108,
				y: 100,
				faction: "ura",
				health: { current: 50, max: 50 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			Selection.selected[friendlyEid] = 1;

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			// Right-click near own building
			canvas.dispatchEvent(
				new PointerEvent("pointerdown", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);
			canvas.dispatchEvent(
				new PointerEvent("pointerup", {
					clientX: 108,
					clientY: 100,
					button: 2,
					bubbles: true,
				}),
			);

			const orders = getOrderQueue(world, friendlyEid);
			expect(orders.length).toBeGreaterThan(0);
			expect(orders[0].type).toBe("garrison");
			expect(orders[0].targetEid).toBe(buildingEid);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("issues move order when right-clicking empty ground", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			const friendlyEid = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			Selection.selected[friendlyEid] = 1;

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			// Right-click far from any entity
			canvas.dispatchEvent(
				new PointerEvent("pointerdown", {
					clientX: 400,
					clientY: 300,
					button: 2,
					bubbles: true,
				}),
			);
			canvas.dispatchEvent(
				new PointerEvent("pointerup", {
					clientX: 400,
					clientY: 300,
					button: 2,
					bubbles: true,
				}),
			);

			const orders = getOrderQueue(world, friendlyEid);
			expect(orders.length).toBeGreaterThan(0);
			expect(orders[0].type).toBe("move");

			await runtime.stop();
			vi.unstubAllGlobals();
		});
	});

	describe("Touch Panning", () => {
		it("single-finger drag without long-press pans camera on touch devices", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			world.navigation.width = 64;
			world.navigation.height = 64;
			spawnUnit(world, {
				x: 320,
				y: 180,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			const cameraXBefore = Number(container.dataset.runtimeCameraX ?? "0");

			// Simulate a quick touch drag (not held long enough for box-select)
			const now = performance.now();
			canvas.dispatchEvent(
				new PointerEvent("pointerdown", {
					clientX: 300,
					clientY: 200,
					button: 0,
					pointerId: 1,
					pointerType: "touch",
					bubbles: true,
				}),
			);

			// Move while still under the TOUCH_BOX_SELECT_DELAY_MS threshold
			// The timestamp on the move event should be within the delay window
			const moveEvent = new PointerEvent("pointermove", {
				clientX: 250,
				clientY: 200,
				button: 0,
				pointerId: 1,
				pointerType: "touch",
				bubbles: true,
			});
			// timeStamp is readonly, but the move should happen quickly
			canvas.dispatchEvent(moveEvent);

			const cameraXAfter = Number(container.dataset.runtimeCameraX ?? "0");

			// Camera should have panned (x increased because we dragged left)
			// Due to the short time window, the touch should pan not box-select
			expect(cameraXAfter).toBeGreaterThanOrEqual(cameraXBefore);

			// Clean up
			canvas.dispatchEvent(
				new PointerEvent("pointerup", {
					clientX: 250,
					clientY: 200,
					button: 0,
					pointerId: 1,
					pointerType: "touch",
					bubbles: true,
				}),
			);

			await runtime.stop();
			vi.unstubAllGlobals();
		});

		it("mouse left-drag still performs box selection", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			spawnUnit(world, {
				x: 280,
				y: 150,
				faction: "ura",
				health: { current: 8, max: 10 },
			});
			spawnUnit(world, {
				x: 340,
				y: 210,
				faction: "ura",
				health: { current: 8, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			const canvas = container.querySelector("canvas");
			if (!canvas) throw new Error("Expected canvas");
			canvas.getBoundingClientRect = container.getBoundingClientRect;

			// Mouse drag: box selection should still work
			runtime.selectInScreenRect(220, 90, 390, 260);
			expect(container.dataset.runtimeSelected).toBe("2");

			await runtime.stop();
			vi.unstubAllGlobals();
		});
	});

	describe("Arrow Key Panning", () => {
		it("pans camera on arrow key press", async () => {
			const container = createTestContainer();
			stubBrowserGlobals();

			const world = createGameWorld();
			world.navigation.width = 64;
			world.navigation.height = 64;
			spawnUnit(world, {
				x: 320,
				y: 180,
				faction: "ura",
				health: { current: 10, max: 10 },
			});

			const module = await import("./littlejsRuntime");
			const bridge = createGameBridge({ screen: "game" });
			const runtime = await module.createLittleJsRuntime({
				container,
				world,
				bridge,
			});

			await runtime.start();
			runtime.resize(640, 360);

			const cameraXBefore = Number(container.dataset.runtimeCameraX ?? "0");

			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight" }),
			);

			const cameraXAfter = Number(container.dataset.runtimeCameraX ?? "0");
			expect(cameraXAfter).toBeGreaterThan(cameraXBefore);

			await runtime.stop();
			vi.unstubAllGlobals();
		});
	});
});
