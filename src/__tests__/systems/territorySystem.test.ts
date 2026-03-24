import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld } from "koota";
import { Faction, IsBuilding, IsVillage, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { Health } from "@/ecs/traits/combat";
import { GarrisonedIn } from "@/ecs/relations";
import { resourceStore } from "@/stores/resourceStore";
import { territoryStore } from "@/stores/territoryStore";
import {
	isGarrisonCleared,
	liberateVillage,
	recaptureVillage,
	isVillageUndefended,
	applyVillageHealing,
	applyVillageIncome,
	resetVillageIncomeTimer,
	territorySystem,
	getVillages,
	FOG_REVEAL_RADIUS,
} from "@/systems/territorySystem";

function spawnVillage(
	world: ReturnType<typeof createWorld>,
	faction: string,
	x: number,
	y: number,
) {
	const village = world.spawn(IsVillage, IsBuilding, Faction, Position, Health);
	village.set(Faction, { id: faction });
	village.set(Position, { x, y });
	village.set(Health, { current: 200, max: 200 });
	return village;
}

function spawnUnit(world: ReturnType<typeof createWorld>, faction: string, x: number, y: number) {
	const unit = world.spawn(UnitType, Faction, Position, Health);
	unit.set(UnitType, { type: "mudfoot" });
	unit.set(Faction, { id: faction });
	unit.set(Position, { x, y });
	unit.set(Health, { current: 80, max: 80 });
	return unit;
}

describe("Territory / Village Liberation System", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
		resourceStore.getState().reset();
		territoryStore.getState().reset();
		resetVillageIncomeTimer();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("isGarrisonCleared", () => {
		it("should return true when no units are garrisoned in village", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			expect(isGarrisonCleared(world, village)).toBe(true);
		});

		it("should return false when units are garrisoned", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			const guard = spawnUnit(world, "scale_guard", 5, 5);
			guard.add(GarrisonedIn(village));

			expect(isGarrisonCleared(world, village)).toBe(false);
		});

		it("should return true after garrison is destroyed", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			const guard = spawnUnit(world, "scale_guard", 5, 5);
			guard.add(GarrisonedIn(village));

			expect(isGarrisonCleared(world, village)).toBe(false);

			guard.destroy();
			expect(isGarrisonCleared(world, village)).toBe(true);
		});
	});

	describe("liberateVillage", () => {
		it("should flip faction to ura", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			territoryStore.getState().setTotalVillages(1);

			expect(liberateVillage(village)).toBe(true);
			expect(village.get(Faction).id).toBe("ura");
		});

		it("should update territory store", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			territoryStore.getState().setTotalVillages(1);

			liberateVillage(village);

			const state = territoryStore.getState();
			expect(state.liberatedCount).toBe(1);
			expect(state.occupiedCount).toBe(0);
		});

		it("should not liberate an already liberated village", () => {
			const village = spawnVillage(world, "ura", 5, 5);
			expect(liberateVillage(village)).toBe(false);
		});
	});

	describe("recaptureVillage", () => {
		it("should flip faction back to scale_guard", () => {
			const village = spawnVillage(world, "ura", 5, 5);
			territoryStore.getState().setTotalVillages(1);
			territoryStore.getState().liberateVillage(); // simulate prior liberation

			expect(recaptureVillage(village)).toBe(true);
			expect(village.get(Faction).id).toBe("scale_guard");
		});

		it("should update territory store", () => {
			territoryStore.getState().setTotalVillages(2);
			territoryStore.getState().liberateVillage();
			territoryStore.getState().liberateVillage();

			const village = spawnVillage(world, "ura", 5, 5);
			recaptureVillage(village);

			const state = territoryStore.getState();
			expect(state.liberatedCount).toBe(1);
			expect(state.occupiedCount).toBe(1);
		});

		it("should not recapture an occupied village", () => {
			const village = spawnVillage(world, "scale_guard", 5, 5);
			expect(recaptureVillage(village)).toBe(false);
		});
	});

	describe("isVillageUndefended", () => {
		it("should return true when enemy nearby and no friendlies", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const enemy = spawnUnit(world, "scale_guard", 12, 10); // within 5 tiles
			const allUnits = [enemy];

			expect(isVillageUndefended(world, village, allUnits)).toBe(true);
		});

		it("should return false when friendly units are nearby", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const enemy = spawnUnit(world, "scale_guard", 12, 10);
			const friendly = spawnUnit(world, "ura", 11, 10);
			const allUnits = [enemy, friendly];

			expect(isVillageUndefended(world, village, allUnits)).toBe(false);
		});

		it("should return false when no enemies nearby", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const enemy = spawnUnit(world, "scale_guard", 50, 50); // far away
			const allUnits = [enemy];

			expect(isVillageUndefended(world, village, allUnits)).toBe(false);
		});

		it("should return false for occupied villages", () => {
			const village = spawnVillage(world, "scale_guard", 10, 10);
			const enemy = spawnUnit(world, "scale_guard", 12, 10);
			const allUnits = [enemy];

			expect(isVillageUndefended(world, village, allUnits)).toBe(false);
		});
	});

	describe("applyVillageHealing", () => {
		it("should heal friendly units within 3 tiles of liberated villages", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const friendly = spawnUnit(world, "ura", 11, 10);
			friendly.set(Health, { current: 50, max: 80 });

			applyVillageHealing(world, [village], [friendly], 1.0);

			expect(friendly.get(Health).current).toBe(51); // +1 HP for 1 second
		});

		it("should not heal beyond max HP", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const friendly = spawnUnit(world, "ura", 11, 10);
			friendly.set(Health, { current: 79, max: 80 });

			applyVillageHealing(world, [village], [friendly], 5.0);

			expect(friendly.get(Health).current).toBe(80);
		});

		it("should not heal units outside healing radius", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const friendly = spawnUnit(world, "ura", 20, 10); // 10 tiles away
			friendly.set(Health, { current: 50, max: 80 });

			applyVillageHealing(world, [village], [friendly], 1.0);

			expect(friendly.get(Health).current).toBe(50);
		});

		it("should not heal units near occupied villages", () => {
			const village = spawnVillage(world, "scale_guard", 10, 10);
			const friendly = spawnUnit(world, "ura", 11, 10);
			friendly.set(Health, { current: 50, max: 80 });

			applyVillageHealing(world, [village], [friendly], 1.0);

			expect(friendly.get(Health).current).toBe(50);
		});
	});

	describe("applyVillageIncome", () => {
		it("should add fish income after interval", () => {
			territoryStore.getState().setTotalVillages(3);
			territoryStore.getState().liberateVillage();
			territoryStore.getState().liberateVillage();

			// Simulate 10 seconds
			applyVillageIncome(10);

			expect(resourceStore.getState().fish).toBe(2); // 2 villages * 1 fish
		});

		it("should not add income before interval", () => {
			territoryStore.getState().setTotalVillages(1);
			territoryStore.getState().liberateVillage();

			applyVillageIncome(5); // only 5 seconds

			expect(resourceStore.getState().fish).toBe(0);
		});

		it("should accumulate timer across frames", () => {
			territoryStore.getState().setTotalVillages(1);
			territoryStore.getState().liberateVillage();

			applyVillageIncome(4);
			applyVillageIncome(4);
			applyVillageIncome(4); // total 12s → 1 tick at 10s

			expect(resourceStore.getState().fish).toBe(1);
		});
	});

	describe("getVillages", () => {
		it("should find all village entities", () => {
			spawnVillage(world, "scale_guard", 5, 5);
			spawnVillage(world, "ura", 10, 10);
			spawnUnit(world, "ura", 3, 3); // not a village

			const villages = getVillages(world);
			expect(villages).toHaveLength(2);
		});
	});

	describe("territorySystem (integration)", () => {
		it("should liberate village when garrison is killed", () => {
			territoryStore.getState().setTotalVillages(1);
			const village = spawnVillage(world, "scale_guard", 5, 5);
			const guard1 = spawnUnit(world, "scale_guard", 5, 5);
			const guard2 = spawnUnit(world, "scale_guard", 5, 5);
			guard1.add(GarrisonedIn(village));
			guard2.add(GarrisonedIn(village));

			// Village still occupied
			territorySystem(world, 0.016);
			expect(village.get(Faction).id).toBe("scale_guard");

			// Kill garrison
			guard1.destroy();
			guard2.destroy();

			territorySystem(world, 0.016);
			expect(village.get(Faction).id).toBe("ura");
			expect(territoryStore.getState().liberatedCount).toBe(1);
		});

		it("should recapture undefended village when enemy approaches", () => {
			territoryStore.getState().setTotalVillages(1);
			const village = spawnVillage(world, "ura", 10, 10);
			territoryStore.getState().liberateVillage();

			// Enemy approaches, no friendly nearby
			spawnUnit(world, "scale_guard", 12, 10);

			territorySystem(world, 0.016);

			expect(village.get(Faction).id).toBe("scale_guard");
			expect(territoryStore.getState().liberatedCount).toBe(0);
			expect(territoryStore.getState().occupiedCount).toBe(1);
		});

		it("should not recapture village when friendly units defend it", () => {
			territoryStore.getState().setTotalVillages(1);
			const village = spawnVillage(world, "ura", 10, 10);
			territoryStore.getState().liberateVillage();

			spawnUnit(world, "scale_guard", 12, 10);
			spawnUnit(world, "ura", 11, 10); // defender

			territorySystem(world, 0.016);

			expect(village.get(Faction).id).toBe("ura");
		});

		it("should heal friendly units near liberated villages each tick", () => {
			const village = spawnVillage(world, "ura", 10, 10);
			const friendly = spawnUnit(world, "ura", 11, 10);
			friendly.set(Health, { current: 50, max: 80 });

			territorySystem(world, 2.0);

			expect(friendly.get(Health).current).toBe(52); // +1 HP/s * 2s
		});
	});

	describe("fog reveal radius", () => {
		it("should export the correct fog reveal radius constant", () => {
			expect(FOG_REVEAL_RADIUS).toBe(5);
		});
	});
});
