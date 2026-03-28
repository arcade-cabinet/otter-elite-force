/**
 * Demolition System Tests — ported from old Koota codebase.
 *
 * Tests explosive detonation and area damage.
 */

import { describe, expect, it } from "vitest";
import { runDemolitionSystem } from "@/engine/systems/demolitionSystem";
import { Health, Position } from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	isAlive,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/demolitionSystem", () => {
	it("applies area damage on detonate events", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const eid = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runDemolitionSystem(world);

		expect(Health.current[eid]).toBeLessThan(50);
	});

	it("damages all entities within explosion radius", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const near1 = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 80, max: 80 },
		});
		const near2 = spawnUnit(world, {
			x: 150,
			y: 100,
			faction: "scale_guard",
			health: { current: 60, max: 60 },
		});

		runDemolitionSystem(world);

		expect(Health.current[near1]).toBeLessThan(80);
		expect(Health.current[near2]).toBeLessThan(60);
	});

	it("does not damage entities outside explosion radius", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const far = spawnUnit(world, {
			x: 1000,
			y: 1000,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		runDemolitionSystem(world);

		expect(Health.current[far]).toBe(100);
	});

	it("marks entities for removal when HP drops to zero", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const eid = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});

		runDemolitionSystem(world);

		expect(world.runtime.removals.has(eid)).toBe(true);
		flushRemovals(world);
		expect(isAlive(world, eid)).toBe(false);
	});

	it("emits explosion event", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 50, y: 75 } });

		runDemolitionSystem(world);

		const explosionEvents = world.events.filter((e) => e.type === "explosion");
		expect(explosionEvents).toHaveLength(1);
		expect(explosionEvents[0].payload?.x).toBe(50);
		expect(explosionEvents[0].payload?.y).toBe(75);
	});

	it("damages buildings within range", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const building = spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});

		runDemolitionSystem(world);

		expect(Health.current[building]).toBeLessThan(150);
	});

	it("damages friendly entities too (friendly fire)", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });

		const friendly = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "ura",
			health: { current: 50, max: 50 },
		});

		runDemolitionSystem(world);

		expect(Health.current[friendly]).toBeLessThan(50);
	});

	it("processes multiple detonation events", () => {
		const world = makeWorld();
		world.events.push({ type: "detonate", payload: { x: 100, y: 100 } });
		world.events.push({ type: "detonate", payload: { x: 200, y: 200 } });

		const at100 = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});
		const at200 = spawnUnit(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		runDemolitionSystem(world);

		expect(Health.current[at100]).toBeLessThan(100);
		expect(Health.current[at200]).toBeLessThan(100);
	});

	it("does nothing when no detonation events exist", () => {
		const world = makeWorld();

		const eid = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		runDemolitionSystem(world);

		expect(Health.current[eid]).toBe(100);
	});
});
