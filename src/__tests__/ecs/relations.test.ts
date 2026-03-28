/**
 * ECS Relations Tests — ported from old Koota codebase.
 *
 * Tests entity relationships: order queues, production queues,
 * script tags, entity type index, and AI state maps.
 */

import { describe, expect, it } from "vitest";
import {
	createGameWorld,
	getOrderQueue,
	getProductionQueue,
	setScriptTag,
	setSelection,
	setFaction,
	spawnUnit,
	spawnBuilding,
	markForRemoval,
	flushRemovals,
} from "@/engine/world/gameWorld";
import { Faction, Selection } from "@/engine/world/components";

describe("ECS entity relations", () => {
	describe("Order queues", () => {
		it("creates an order queue on first access", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			const queue = getOrderQueue(world, eid);
			expect(queue).toEqual([]);
			expect(world.runtime.orderQueues.has(eid)).toBe(true);
		});

		it("returns the same queue on subsequent access", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			const q1 = getOrderQueue(world, eid);
			q1.push({ type: "move", targetX: 100, targetY: 0 });

			const q2 = getOrderQueue(world, eid);
			expect(q2).toBe(q1);
			expect(q2).toHaveLength(1);
		});

		it("supports multiple order types", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			const queue = getOrderQueue(world, eid);

			queue.push({ type: "move", targetX: 100, targetY: 0 });
			queue.push({ type: "attack", targetEid: 42 });
			queue.push({ type: "gather", targetEid: 99 });

			expect(queue).toHaveLength(3);
			expect(queue[0].type).toBe("move");
			expect(queue[1].type).toBe("attack");
			expect(queue[2].type).toBe("gather");
		});

		it("is cleaned up on entity removal", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			getOrderQueue(world, eid).push({ type: "move", targetX: 50, targetY: 50 });

			markForRemoval(world, eid);
			flushRemovals(world);

			expect(world.runtime.orderQueues.has(eid)).toBe(false);
		});
	});

	describe("Production queues", () => {
		it("creates a production queue on first access", () => {
			const world = createGameWorld();
			const building = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
			});

			const queue = getProductionQueue(world, building);
			expect(queue).toEqual([]);
		});

		it("can store production entries", () => {
			const world = createGameWorld();
			const building = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
			});

			const queue = getProductionQueue(world, building);
			queue.push({ type: "unit", contentId: "mudfoot", progress: 0 });
			queue.push({ type: "unit", contentId: "shellcracker", progress: 50 });

			expect(queue).toHaveLength(2);
			expect(queue[0].contentId).toBe("mudfoot");
			expect(queue[1].progress).toBe(50);
		});
	});

	describe("Script tag index", () => {
		it("sets and retrieves script tags", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			setScriptTag(world, eid, "player_base");

			expect(world.runtime.scriptTagIndex.get("player_base")).toBe(eid);
		});

		it("allows multiple entities with different script tags", () => {
			const world = createGameWorld();
			const eid1 = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			const eid2 = spawnUnit(world, { x: 10, y: 0, faction: "ura" });

			setScriptTag(world, eid1, "base_1");
			setScriptTag(world, eid2, "base_2");

			expect(world.runtime.scriptTagIndex.get("base_1")).toBe(eid1);
			expect(world.runtime.scriptTagIndex.get("base_2")).toBe(eid2);
		});

		it("is cleaned up on entity removal", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			setScriptTag(world, eid, "commander");

			markForRemoval(world, eid);
			flushRemovals(world);

			expect(world.runtime.scriptTagIndex.has("commander")).toBe(false);
		});
	});

	describe("Entity type index", () => {
		it("stores entity type on spawn", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", unitType: "mudfoot" });
			expect(world.runtime.entityTypeIndex.get(eid)).toBe("mudfoot");
		});

		it("is cleaned up on entity removal", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", unitType: "mudfoot" });

			markForRemoval(world, eid);
			flushRemovals(world);

			expect(world.runtime.entityTypeIndex.has(eid)).toBe(false);
		});
	});

	describe("Selection", () => {
		it("setSelection toggles selection state", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			setSelection(world, eid, true);
			expect(Selection.selected[eid]).toBe(1);

			setSelection(world, eid, false);
			expect(Selection.selected[eid]).toBe(0);
		});
	});

	describe("Faction", () => {
		it("setFaction changes faction", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			expect(Faction.id[eid]).toBe(1);

			setFaction(world, eid, "scale_guard");
			expect(Faction.id[eid]).toBe(2);
		});
	});

	describe("AI state map", () => {
		it("stores FSM state per entity", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "scale_guard" });

			world.runtime.aiStates.set(eid, {
				state: "idle",
				alertLevel: 0,
				stateTimer: 0,
				homeX: 100,
				homeY: 100,
				patrolIndex: 0,
			});

			const state = world.runtime.aiStates.get(eid);
			expect(state?.state).toBe("idle");
			expect(state?.homeX).toBe(100);
		});

		it("can transition states", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "scale_guard" });

			world.runtime.aiStates.set(eid, {
				state: "idle",
				alertLevel: 0,
				stateTimer: 0,
				homeX: 100,
				homeY: 100,
				patrolIndex: 0,
			});

			const state = world.runtime.aiStates.get(eid)!;
			state.state = "chase";
			state.alertLevel = 1;

			expect(world.runtime.aiStates.get(eid)?.state).toBe("chase");
			expect(world.runtime.aiStates.get(eid)?.alertLevel).toBe(1);
		});
	});
});
