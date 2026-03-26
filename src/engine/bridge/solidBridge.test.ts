/**
 * Tests for SolidJS GameBridge — verifies reactive state synchronization
 * between GameWorld and Solid signals.
 */

import { describe, expect, it } from "vitest";
import { createRoot } from "solid-js";
import { createGameWorld, spawnUnit, spawnBuilding } from "../world/gameWorld";
import { Selection } from "../world/components";
import { createSolidBridge } from "./solidBridge";

describe("engine/bridge/solidBridge", () => {
	it("creates bridge with default state", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();

			expect(bridge.accessors.screen()).toBe("game");
			expect(bridge.accessors.resources.fish).toBe(0);
			expect(bridge.accessors.resources.timber).toBe(0);
			expect(bridge.accessors.resources.salvage).toBe(0);
			expect(bridge.accessors.population.current).toBe(0);
			expect(bridge.accessors.population.max).toBe(0);
			expect(bridge.accessors.selection()).toBeNull();
			expect(bridge.accessors.objectives.length).toBe(0);
			expect(bridge.accessors.alerts.length).toBe(0);
			expect(bridge.accessors.dialogue()).toBeNull();
			expect(bridge.accessors.weather()).toBeNull();
			expect(bridge.accessors.boss()).toBeNull();

			dispose();
		});
	});

	it("syncs resources from world", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.resources = { fish: 100, timber: 200, salvage: 50 };
			world.session.phase = "playing";

			bridge.syncFromWorld(world);

			expect(bridge.accessors.resources.fish).toBe(100);
			expect(bridge.accessors.resources.timber).toBe(200);
			expect(bridge.accessors.resources.salvage).toBe(50);

			dispose();
		});
	});

	it("syncs selection from world", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";

			const eid = spawnUnit(world, {
				x: 100, y: 100, faction: "ura", unitType: "mudfoot",
			});
			Selection.selected[eid] = 1;

			bridge.syncFromWorld(world);

			const sel = bridge.accessors.selection();
			expect(sel).not.toBeNull();
			expect(sel?.entityIds).toContain(eid);
			expect(sel?.primaryLabel).toBe("mudfoot");

			dispose();
		});
	});

	it("syncs multi-unit selection", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";

			const eid1 = spawnUnit(world, { x: 100, y: 100, faction: "ura", unitType: "mudfoot" });
			const eid2 = spawnUnit(world, { x: 120, y: 100, faction: "ura", unitType: "river_rat" });
			Selection.selected[eid1] = 1;
			Selection.selected[eid2] = 1;

			bridge.syncFromWorld(world);

			const sel = bridge.accessors.selection();
			expect(sel?.entityIds.length).toBe(2);
			expect(sel?.primaryLabel).toBe("2 units selected");

			dispose();
		});
	});

	it("clears selection when no entities selected", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";

			spawnUnit(world, { x: 100, y: 100, faction: "ura", unitType: "mudfoot" });

			bridge.syncFromWorld(world);

			expect(bridge.accessors.selection()).toBeNull();

			dispose();
		});
	});

	it("syncs objectives from world", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.session.objectives = [
				{ id: "gather-timber", description: "Gather 150 timber", status: "active", bonus: false },
				{ id: "bonus-salvage", description: "Collect 50 salvage", status: "active", bonus: true },
			];

			bridge.syncFromWorld(world);

			expect(bridge.accessors.objectives.length).toBe(2);
			expect(bridge.accessors.objectives[0].id).toBe("gather-timber");
			expect(bridge.accessors.objectives[0].status).toBe("active");
			expect(bridge.accessors.objectives[1].id).toBe("bonus-salvage");

			dispose();
		});
	});

	it("updates objective status without recreating array", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.session.objectives = [
				{ id: "gather-timber", description: "Gather 150 timber", status: "active", bonus: false },
			];

			bridge.syncFromWorld(world);
			expect(bridge.accessors.objectives[0].status).toBe("active");

			// Update the objective status
			world.session.objectives[0].status = "completed";
			bridge.syncFromWorld(world);
			expect(bridge.accessors.objectives[0].status).toBe("completed");

			dispose();
		});
	});

	it("syncs dialogue from world", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.session.dialogue = {
				active: true,
				lines: [{ speaker: "Col. Bubbles", text: "Move out, Captain." }],
			};

			bridge.syncFromWorld(world);

			const dlg = bridge.accessors.dialogue();
			expect(dlg).not.toBeNull();
			expect(dlg?.lines.length).toBe(1);
			expect(dlg?.lines[0].speaker).toBe("Col. Bubbles");

			dispose();
		});
	});

	it("clears dialogue when inactive", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.session.dialogue = null;

			bridge.syncFromWorld(world);

			expect(bridge.accessors.dialogue()).toBeNull();

			dispose();
		});
	});

	it("syncs weather from world", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.runtime.weather = "monsoon";

			bridge.syncFromWorld(world);

			expect(bridge.accessors.weather()).toBe("monsoon");

			dispose();
		});
	});

	it("reports null weather when clear", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.runtime.weather = "clear";

			bridge.syncFromWorld(world);

			expect(bridge.accessors.weather()).toBeNull();

			dispose();
		});
	});

	it("syncs paused screen state", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "paused";

			bridge.syncFromWorld(world);

			expect(bridge.accessors.screen()).toBe("paused");

			dispose();
		});
	});

	it("syncs population from world entities", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";

			// Spawn some player units and buildings
			spawnUnit(world, { x: 100, y: 100, faction: "ura", unitType: "mudfoot" });
			spawnUnit(world, { x: 120, y: 100, faction: "ura", unitType: "river_rat" });
			spawnBuilding(world, { x: 200, y: 200, faction: "ura", buildingType: "barracks" });

			bridge.syncFromWorld(world);

			expect(bridge.accessors.population.current).toBe(2); // 2 player units
			expect(bridge.accessors.population.max).toBeGreaterThanOrEqual(10);

			dispose();
		});
	});

	it("produces valid snapshot", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();
			const world = createGameWorld();
			world.session.phase = "playing";
			world.session.resources = { fish: 50, timber: 75, salvage: 10 };

			bridge.syncFromWorld(world);

			const snap = bridge.snapshot();
			expect(snap.screen).toBe("game");
			expect(snap.resources.fish).toBe(50);
			expect(snap.resources.timber).toBe(75);
			expect(snap.resources.salvage).toBe(10);

			dispose();
		});
	});

	it("emit.setScreen updates screen signal", () => {
		createRoot((dispose) => {
			const bridge = createSolidBridge();

			bridge.emit.setScreen("menu");
			expect(bridge.accessors.screen()).toBe("menu");

			bridge.emit.setScreen("game");
			expect(bridge.accessors.screen()).toBe("game");

			dispose();
		});
	});
});
