import { describe, expect, it } from "vitest";
import { Attack, Flags } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runStealthSystem } from "./stealthSystem";

describe("engine/systems/stealthSystem", () => {
	it("keeps stealthed entities hidden when not attacking", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Flags.stealthed[eid] = 1;
		Attack.damage[eid] = 0;

		runStealthSystem(world);

		expect(Flags.stealthed[eid]).toBe(1);
	});

	it("does not affect non-stealthed entities", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Flags.stealthed[eid] = 0;

		runStealthSystem(world);

		expect(Flags.stealthed[eid]).toBe(0);
	});
});
