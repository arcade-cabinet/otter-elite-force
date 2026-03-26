import { describe, expect, it } from "vitest";
import { createSystemPipeline } from "./systemPipeline";
import {
	createGameWorld,
	getOrderQueue,
	isAlive,
	spawnUnit,
} from "../world/gameWorld";
import { Position, Speed, Health, Attack } from "../world/components";

describe("engine/session/systemPipeline", () => {
	it("creates a pipeline with step and dispose methods", () => {
		const world = createGameWorld();
		const pipeline = createSystemPipeline(world);

		expect(typeof pipeline.step).toBe("function");
		expect(typeof pipeline.dispose).toBe("function");

		pipeline.dispose();
	});

	it("skips execution when world is not playing", () => {
		const world = createGameWorld();
		world.session.phase = "paused";
		world.time.deltaMs = 16;

		const eid = spawnUnit(world, { x: 10, y: 20, faction: "ura" });
		const orders = getOrderQueue(world, eid);
		Speed.value[eid] = 100;
		orders.push({ type: "move", targetX: 50, targetY: 20 });

		const pipeline = createSystemPipeline(world);
		pipeline.step();

		// Position should not have changed since phase is "paused"
		expect(Position.x[eid]).toBe(10);

		pipeline.dispose();
	});

	it("skips execution when deltaMs is zero", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.time.deltaMs = 0;

		const eid = spawnUnit(world, { x: 10, y: 20, faction: "ura" });
		Speed.value[eid] = 100;
		getOrderQueue(world, eid).push({ type: "move", targetX: 50, targetY: 20 });

		const pipeline = createSystemPipeline(world);
		pipeline.step();

		expect(Position.x[eid]).toBe(10);

		pipeline.dispose();
	});

	it("runs movement system — entities move toward targets", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.time.deltaMs = 1000;

		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 50;
		getOrderQueue(world, eid).push({ type: "move", targetX: 100, targetY: 0 });

		const pipeline = createSystemPipeline(world);
		pipeline.step();

		// Should have moved toward target
		expect(Position.x[eid]).toBeGreaterThan(0);

		pipeline.dispose();
	});

	it("runs combat system — attack orders damage targets", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.time.deltaMs = 1000;

		const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Attack.damage[attacker] = 5;
		Attack.range[attacker] = 100;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 0;

		const target = spawnUnit(world, {
			x: 10,
			y: 0,
			faction: "scale_guard",
			health: { current: 20, max: 20 },
		});

		getOrderQueue(world, attacker).push({
			type: "attack",
			targetEid: target,
		});

		const pipeline = createSystemPipeline(world);
		pipeline.step();

		// Target should have taken damage
		expect(Health.current[target]).toBe(15);

		pipeline.dispose();
	});

	it("flushes dead entities after combat", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.time.deltaMs = 1000;

		const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Attack.damage[attacker] = 100;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 0;

		const target = spawnUnit(world, {
			x: 10,
			y: 0,
			faction: "scale_guard",
			health: { current: 5, max: 5 },
		});

		getOrderQueue(world, attacker).push({
			type: "attack",
			targetEid: target,
		});

		const pipeline = createSystemPipeline(world);
		pipeline.step();

		// Target should be dead and flushed
		expect(isAlive(world, target)).toBe(false);

		pipeline.dispose();
	});

	it("does nothing after dispose", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.time.deltaMs = 1000;

		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 50;
		getOrderQueue(world, eid).push({ type: "move", targetX: 100, targetY: 0 });

		const pipeline = createSystemPipeline(world);
		pipeline.dispose();
		pipeline.step();

		// Nothing should have changed
		expect(Position.x[eid]).toBe(0);
	});
});
