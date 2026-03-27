import { describe, expect, it } from "vitest";
import {
	Armor,
	Attack,
	Faction,
	Flags,
	Health,
	Selection,
	Speed,
	VisionRadius,
} from "./components";
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

	it("spawns river_rat with full template stats wired into bitECS SoA stores", () => {
		const world = createGameWorld();

		// Stats use tile-based units (matching entity definitions):
		// speed=10 tiles/s, attackRange=1 tile, visionRadius=6 tiles
		const eid = spawnUnit(world, {
			x: 100,
			y: 200,
			faction: "ura",
			unitType: "river_rat",
			stats: {
				hp: 40,
				armor: 0,
				speed: 10,
				attackDamage: 5,
				attackRange: 1,
				attackCooldownMs: 1.5,
				visionRadius: 6,
				popCost: 1,
			},
			abilities: ["gather", "build", "swim"],
			flags: { canSwim: true, canStealth: false },
		});

		expect(Health.current[eid]).toBe(40);
		expect(Health.max[eid]).toBe(40);
		expect(Armor.value[eid]).toBe(0);
		// Speed, range, and visionRadius are converted from tiles to pixels (* 32)
		expect(Speed.value[eid]).toBe(320);
		expect(Attack.damage[eid]).toBe(5);
		expect(Attack.range[eid]).toBe(32);
		expect(Attack.cooldown[eid]).toBe(1.5);
		expect(VisionRadius.value[eid]).toBe(192);
		expect(Flags.canSwim[eid]).toBe(1);
		expect(world.runtime.entityAbilities.get(eid)).toEqual(["gather", "build", "swim"]);
		expect(world.runtime.entityTypeIndex.get(eid)).toBe("river_rat");
	});

	it("spawns a building with template stats wired into bitECS SoA stores", () => {
		const world = createGameWorld();

		// Stats use tile-based units for range and visionRadius
		const eid = spawnBuilding(world, {
			x: 300,
			y: 400,
			faction: "ura",
			buildingType: "watchtower",
			stats: {
				hp: 200,
				armor: 3,
				visionRadius: 10,
				attackDamage: 15,
				attackRange: 5,
				attackCooldownMs: 2,
				populationCapacity: 0,
			},
		});

		expect(Health.current[eid]).toBe(200);
		expect(Health.max[eid]).toBe(200);
		expect(Armor.value[eid]).toBe(3);
		expect(Attack.damage[eid]).toBe(15);
		// Range and visionRadius converted from tiles to pixels (* 32)
		expect(Attack.range[eid]).toBe(160);
		expect(VisionRadius.value[eid]).toBe(320);
		expect(Flags.isBuilding[eid]).toBe(1);
		expect(world.runtime.entityTypeIndex.get(eid)).toBe("watchtower");
	});
});
