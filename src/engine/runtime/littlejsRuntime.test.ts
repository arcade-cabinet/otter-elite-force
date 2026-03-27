import { describe, expect, it, vi } from "vitest";
import { createGameBridge } from "../bridge/gameBridge";
import { Position, Selection } from "../world/components";
import { createGameWorld, spawnBuilding, spawnResource, spawnUnit } from "../world/gameWorld";

describe("engine/runtime/littlejsRuntime", () => {
	it("fails safely when the LittleJS browser runtime is unavailable", async () => {
		vi.stubGlobal("window", {} as Window & typeof globalThis);
		const module = await import("./littlejsRuntime");
		const canLoad = await module.canLoadLittleJsRuntime();
		expect(typeof canLoad).toBe("boolean");
		expect(canLoad).toBe(false);
		vi.unstubAllGlobals();
	});

	it("mounts a native canvas runtime and renders world entities without Konva", async () => {
		const container = document.createElement("div");
		Object.defineProperty(container, "clientWidth", { value: 640 });
		Object.defineProperty(container, "clientHeight", { value: 360 });
		document.body.appendChild(container);
		vi.stubGlobal(
			"AudioContext",
			class AudioContextMock {},
		);

		const world = createGameWorld();
		spawnUnit(world, { x: 48, y: 64, faction: "ura", health: { current: 8, max: 10 } });
		spawnBuilding(world, { x: 96, y: 96, faction: "scale_guard", health: { current: 20, max: 20 } });
		spawnResource(world, { x: 128, y: 144 });

		const module = await import("./littlejsRuntime");
		const runtime = await module.createLittleJsRuntime({
			container,
			world,
			bridge: createGameBridge({ screen: "game" }),
		});

		await runtime.start();
		runtime.resize(640, 360);

		expect(container.dataset.runtime).toBe("littlejs");
		expect(container.dataset.runtimeEntities).toBe("3");
		expect(container.querySelector("canvas")).toBeTruthy();
		expect(world.session.phase).toBe("playing");
		expect(world.session.objectives.length).toBe(0);

		await runtime.stop();
		expect(container.querySelector("canvas")).toBeNull();
		vi.unstubAllGlobals();
	});

	it("supports pointer selection on the LittleJS runtime canvas", async () => {
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

		const world = createGameWorld();
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });

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
		if (!canvas) {
			throw new Error("Expected LittleJS canvas to mount");
		}
		canvas.getBoundingClientRect = container.getBoundingClientRect;
		canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: 320, clientY: 180, button: 0, bubbles: true }));
		canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: 320, clientY: 180, button: 0, bubbles: true }));

		expect(container.dataset.runtimeSelected).toBe("1");
		expect(bridge.state.selection?.entityIds.length).toBe(1);
		expect(bridge.state.population.current).toBeGreaterThanOrEqual(1);
		expect(bridge.state.resources.fish).toBeGreaterThanOrEqual(0);
		expect(bridge.state.alerts.length).toBeGreaterThanOrEqual(0);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("supports explicit deselect controls without keyboard input", async () => {
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

		const world = createGameWorld();
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });

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
		if (!canvas) {
			throw new Error("Expected LittleJS canvas to mount");
		}
		canvas.getBoundingClientRect = container.getBoundingClientRect;
		canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: 320, clientY: 180, button: 0, bubbles: true }));
		canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: 320, clientY: 180, button: 0, bubbles: true }));

		expect(container.dataset.runtimeSelected).toBe("1");
		runtime.clearSelection();
		expect(container.dataset.runtimeSelected).toBe("0");
		expect(bridge.state.selection).toBeNull();

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("supports box selection for multiple units on the LittleJS surface", async () => {
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
		vi.stubGlobal("AudioContext", class AudioContextMock {});
		if (typeof PointerEvent === "undefined") {
			vi.stubGlobal(
				"PointerEvent",
				class PointerEventMock extends MouseEvent {
					pointerId = 1;
					pointerType = "mouse";
				},
			);
		}

		const world = createGameWorld();
		// Place two ura units close together and one enemy far away.
		// With default zoom 2.0, screen coords must cover a larger screen area
		// to encompass the same world-space region.
		spawnUnit(world, { x: 280, y: 150, faction: "ura", health: { current: 8, max: 10 } });
		spawnUnit(world, { x: 340, y: 210, faction: "ura", health: { current: 8, max: 10 } });
		spawnUnit(world, { x: 520, y: 320, faction: "scale_guard", health: { current: 8, max: 10 } });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);

		const canvas = container.querySelector("canvas");
		if (!canvas) {
			throw new Error("Expected LittleJS canvas to mount");
		}
		canvas.getBoundingClientRect = container.getBoundingClientRect;
		// With zoom 2.0, camera centers on first ura unit at (280,150).
		// Camera: x=120, y=60. Screen->world: worldX = screenX/2 + 120.
		// To select (280,150) and (340,210), we need screen rect covering both.
		runtime.selectInScreenRect(200, 60, 520, 380);

		expect(container.dataset.runtimeSelected).toBe("2");
		expect(bridge.state.selection?.entityIds.length).toBe(2);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("supports minimap recenter without keyboard input", async () => {
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
		vi.stubGlobal("AudioContext", class AudioContextMock {});
		if (typeof PointerEvent === "undefined") {
			vi.stubGlobal(
				"PointerEvent",
				class PointerEventMock extends MouseEvent {
					pointerId = 1;
					pointerType = "mouse";
				},
			);
		}

		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 64;
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });
		spawnUnit(world, { x: 1800, y: 1600, faction: "ura", health: { current: 8, max: 10 } });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);

		const canvas = container.querySelector("canvas");
		if (!canvas) {
			throw new Error("Expected LittleJS canvas to mount");
		}
		canvas.getBoundingClientRect = container.getBoundingClientRect;

		const beforeX = Number(container.dataset.runtimeCameraX ?? "0");
		const beforeY = Number(container.dataset.runtimeCameraY ?? "0");

		runtime.recenterFromMinimap(600, 320);

		const afterX = Number(container.dataset.runtimeCameraX ?? "0");
		const afterY = Number(container.dataset.runtimeCameraY ?? "0");

		expect(afterX).not.toBe(beforeX);
		expect(afterY).not.toBe(beforeY);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("blocks movement orders into locked authored zones", async () => {
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
		vi.stubGlobal("AudioContext", class AudioContextMock {});
		if (typeof PointerEvent === "undefined") {
			vi.stubGlobal(
				"PointerEvent",
				class PointerEventMock extends MouseEvent {
					pointerId = 1;
					pointerType = "mouse";
				},
			);
		}

		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });
		world.runtime.lockedZones.add("sealed_gate");
		world.runtime.zoneRects.set("sealed_gate", { x: 400, y: 200, width: 120, height: 120 });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);
		runtime.clearSelection();
		Selection.selected[eid] = 1;
		runtime.recenterFromMinimap(600, 320);
		const beforeX = Position.x[eid];
		const beforeY = Position.y[eid];

		const canvas = container.querySelector("canvas");
		if (!canvas) {
			throw new Error("Expected LittleJS canvas to mount");
		}
		canvas.getBoundingClientRect = container.getBoundingClientRect;
		canvas.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
		// Right-click inside the locked zone (world coords ~460,260).
		// With zoom 2.0 and camera at ~(320, 155), screenX = (460-320)*2 = 280, screenY = (260-155)*2 = 210.
		canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: 280, clientY: 210, button: 2, bubbles: true }));
		canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: 280, clientY: 210, button: 2, bubbles: true }));

		expect(Position.x[eid]).toBe(beforeX);
		expect(Position.y[eid]).toBe(beforeY);
		expect(world.diagnostics.pathfinding.boundaryViolations.length).toBeGreaterThan(0);
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Route blocked: sealed_gate"))).toBe(true);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("publishes authored mission objective descriptions into bridge state", async () => {
		const container = document.createElement("div");
		Object.defineProperty(container, "clientWidth", { value: 640 });
		Object.defineProperty(container, "clientHeight", { value: 360 });
		document.body.appendChild(container);
		vi.stubGlobal("AudioContext", class AudioContextMock {});

		const world = createGameWorld();
		world.session.objectives = [
			{
				id: "secure-bridge",
				description: "Repair the bridge and hold the crossing",
				status: "active",
				bonus: false,
			},
		];
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);

		expect(bridge.state.objectives[0]?.description).toBe("Repair the bridge and hold the crossing");
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Repair the bridge"))).toBe(true);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("clears expired dialogue and surfaces phase alerts on the active runtime", async () => {
		const container = document.createElement("div");
		Object.defineProperty(container, "clientWidth", { value: 640 });
		Object.defineProperty(container, "clientHeight", { value: 360 });
		document.body.appendChild(container);
		vi.stubGlobal("AudioContext", class AudioContextMock {});

		const world = createGameWorld();
		world.session.objectives = [
			{
				id: "cross-river",
				description: "Cross the river",
				status: "active",
				bonus: false,
			},
		];
		world.time.elapsedMs = 2;
		world.session.dialogue = {
			active: true,
			expiresAtMs: 1,
			lines: [{ speaker: "FOXHOUND", text: "Move north, Captain." }],
		};
		world.runtime.scenarioPhase = "outpost";
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);

		expect(bridge.state.dialogue).toBeNull();
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Phase: outpost"))).toBe(true);

		await runtime.stop();
		vi.unstubAllGlobals();
	});

	it("consumes runtime weather, zone, boss, and camera events from authored mission flow", async () => {
		const container = document.createElement("div");
		Object.defineProperty(container, "clientWidth", { value: 640 });
		Object.defineProperty(container, "clientHeight", { value: 360 });
		document.body.appendChild(container);
		vi.stubGlobal("AudioContext", class AudioContextMock {});

		const world = createGameWorld();
		world.navigation.width = 64;
		world.navigation.height = 64;
		const bossEid = spawnUnit(world, { x: 640, y: 420, faction: "scale_guard", health: { current: 320, max: 500 } });
		world.runtime.bossConfigs.set(bossEid, { name: "Kommandant Ironjaw" });
		world.events.push(
			{ type: "weather-changed", payload: { weather: "monsoon" } },
			{ type: "zone-revealed", payload: { zoneId: "north_beach" } },
			{ type: "boss-spawned", payload: { name: "Kommandant Ironjaw" } },
			{ type: "camera-focus", payload: { x: 40, y: 24, duration: 2_000 } },
		);
		world.runtime.weather = "monsoon";
		spawnUnit(world, { x: 320, y: 180, faction: "ura", health: { current: 8, max: 10 } });

		const module = await import("./littlejsRuntime");
		const bridge = createGameBridge({ screen: "game" });
		const runtime = await module.createLittleJsRuntime({ container, world, bridge });

		await runtime.start();
		runtime.resize(640, 360);

		expect(container.dataset.runtimeWeather).toBe("monsoon");
		expect(Number(container.dataset.runtimeCameraX ?? "0")).toBeGreaterThan(0);
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Weather: monsoon"))).toBe(true);
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Zone revealed: north_beach"))).toBe(true);
		expect(bridge.state.alerts.some((alert) => alert.message.includes("Boss engaged: Kommandant Ironjaw"))).toBe(true);
		expect(bridge.state.boss?.name).toBe("Kommandant Ironjaw");
		expect(bridge.state.boss?.currentHp).toBe(320);

		await runtime.stop();
		vi.unstubAllGlobals();
	});
});
