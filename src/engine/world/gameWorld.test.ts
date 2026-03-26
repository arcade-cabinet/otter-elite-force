import { describe, expect, it } from "vitest";
import {
	createGameWorld,
	flushRemovals,
	getOrderQueue,
	getProductionQueue,
	isAlive,
	markForRemoval,
	resetWorldSession,
	setFaction,
	setScriptTag,
	setSelection,
	spawnBuilding,
	spawnProjectile,
	spawnResource,
	spawnUnit,
} from "./gameWorld";
import { Faction, Selection } from "./components";

describe("engine/world/gameWorld", () => {
	it("creates a world with deterministic seed metadata", () => {
		const world = createGameWorld();
		expect(world.rng.phrase).toBeTruthy();
		expect(world.diagnostics.seedPhrase).toBe(world.rng.phrase);
	});

	it("spawns units, buildings, resources, and projectiles", () => {
		const world = createGameWorld();
		const unit = spawnUnit(world, { x: 2, y: 4, faction: "ura", scriptId: "captain" });
		const building = spawnBuilding(world, { x: 5, y: 6, faction: "ura", scriptId: "hq" });
		const resource = spawnResource(world, { x: 8, y: 9, scriptId: "cache" });
		const projectile = spawnProjectile(world, { x: 1, y: 1, damage: 10, targetEid: unit });

		expect(isAlive(world, unit)).toBe(true);
		expect(isAlive(world, building)).toBe(true);
		expect(isAlive(world, resource)).toBe(true);
		expect(isAlive(world, projectile)).toBe(true);
		expect(world.runtime.scriptTagIndex.get("captain")).toBe(unit);
		expect(world.runtime.scriptTagIndex.get("hq")).toBe(building);
		expect(world.runtime.scriptTagIndex.get("cache")).toBe(resource);
	});

	it("provides stable queue helpers", () => {
		const world = createGameWorld();
		const unit = spawnUnit(world, { x: 0, y: 0 });

		const orderQueue = getOrderQueue(world, unit);
		orderQueue.push({ type: "move", targetX: 10, targetY: 12 });

		const productionQueue = getProductionQueue(world, unit);
		productionQueue.push({ type: "unit", contentId: "mudfoot", progress: 0 });

		expect(getOrderQueue(world, unit)).toHaveLength(1);
		expect(getProductionQueue(world, unit)).toHaveLength(1);
	});

	it("supports selection, faction updates, and script tags through helpers", () => {
		const world = createGameWorld();
		const unit = spawnUnit(world, { x: 1, y: 1, faction: "neutral" });

		setSelection(world, unit, true);
		setFaction(world, unit, "scale_guard");
		setScriptTag(world, unit, "sentry");

		expect(Selection.selected[unit]).toBe(1);
		expect(Faction.id[unit]).toBeGreaterThan(0);
		expect(world.runtime.scriptTagIndex.get("sentry")).toBe(unit);
	});

	it("defers removals until flush", () => {
		const world = createGameWorld();
		const unit = spawnUnit(world, { x: 3, y: 3 });

		markForRemoval(world, unit);
		expect(isAlive(world, unit)).toBe(true);

		flushRemovals(world);
		expect(isAlive(world, unit)).toBe(false);
	});

	it("resets world session-owned runtime state", () => {
		const world = createGameWorld();
		const unit = spawnUnit(world, { x: 7, y: 7, scriptId: "scout" });
		getOrderQueue(world, unit).push({ type: "hold" });
		world.session.currentMissionId = "mission_1";
		world.navigation.width = 128;

		resetWorldSession(world);

		expect(world.session.currentMissionId).toBeNull();
		expect(world.navigation.width).toBe(0);
		expect(world.runtime.orderQueues.size).toBe(0);
		expect(world.runtime.scriptTagIndex.size).toBe(0);
	});
});
