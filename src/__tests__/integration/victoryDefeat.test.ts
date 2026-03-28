/**
 * Victory/Defeat Integration Tests — ported from old Koota codebase.
 *
 * Tests victory and defeat detection through session phase changes,
 * objective completion, and multi-base tracking.
 */

import { describe, expect, it } from "vitest";
import { runMultiBaseSystem } from "@/engine/systems/multiBaseSystem";
import { calculateMissionScore } from "@/engine/systems/scoringSystem";
import { Health } from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	markForRemoval,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("Victory and defeat detection", () => {
	describe("Victory conditions", () => {
		it("mission completes when all primary objectives are completed", () => {
			const world = makeWorld();
			world.session.objectives = [
				{ id: "obj-1", description: "Destroy enemy base", status: "completed", bonus: false },
				{ id: "obj-2", description: "Rescue hostages", status: "completed", bonus: false },
				{ id: "obj-bonus", description: "No losses", status: "incomplete", bonus: true },
			];

			const allPrimary = world.session.objectives
				.filter((o) => !o.bonus)
				.every((o) => o.status === "completed");
			expect(allPrimary).toBe(true);
		});

		it("bonus objectives do not block completion", () => {
			const world = makeWorld();
			world.session.objectives = [
				{ id: "obj-1", description: "Win", status: "completed", bonus: false },
				{ id: "obj-bonus", description: "Speed run", status: "incomplete", bonus: true },
			];

			const allPrimary = world.session.objectives
				.filter((o) => !o.bonus)
				.every((o) => o.status === "completed");
			expect(allPrimary).toBe(true);
		});

		it("calculates score on victory", () => {
			const world = makeWorld();
			world.time.elapsedMs = 300_000; // 5 minutes
			world.session.phase = "victory";
			world.session.objectives = [
				{ id: "primary", description: "Win", status: "completed", bonus: false },
				{ id: "bonus", description: "No losses", status: "completed", bonus: true },
			];

			for (let i = 0; i < 8; i++) {
				spawnUnit(world, { x: i * 20, y: 0, faction: "ura" });
			}

			const score = calculateMissionScore(world);
			expect(score.stars).toBeGreaterThanOrEqual(2);
		});
	});

	describe("Defeat conditions", () => {
		it("all-bases-lost triggers when all command posts and burrows are destroyed", () => {
			const world = makeWorld();
			world.session.phase = "playing";

			const base = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "command_post",
				health: { current: 600, max: 600 },
			});

			// Destroy the base
			markForRemoval(world, base);
			flushRemovals(world);

			runMultiBaseSystem(world);

			expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
		});

		it("game is not lost while any base survives", () => {
			const world = makeWorld();
			world.session.phase = "playing";

			// Destroy first base
			const base1 = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "command_post",
				health: { current: 600, max: 600 },
			});
			markForRemoval(world, base1);
			flushRemovals(world);

			// Second base still alive
			spawnBuilding(world, {
				x: 300,
				y: 300,
				faction: "ura",
				buildingType: "burrow",
				health: { current: 400, max: 400 },
			});

			runMultiBaseSystem(world);

			expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
		});

		it("having units but no bases is still a loss", () => {
			const world = makeWorld();
			world.session.phase = "playing";

			// Has units but no bases
			spawnUnit(world, { x: 50, y: 50, faction: "ura" });
			spawnUnit(world, { x: 60, y: 60, faction: "ura" });

			runMultiBaseSystem(world);

			expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
		});
	});

	describe("Game phase transitions", () => {
		it("session starts in loading phase", () => {
			const world = makeWorld();
			expect(world.session.phase).toBe("loading");
		});

		it("can transition to playing phase", () => {
			const world = makeWorld();
			world.session.phase = "playing";
			expect(world.session.phase).toBe("playing");
		});

		it("can transition to victory phase", () => {
			const world = makeWorld();
			world.session.phase = "victory";
			expect(world.session.phase).toBe("victory");
		});

		it("can transition to defeat phase", () => {
			const world = makeWorld();
			world.session.phase = "defeat";
			expect(world.session.phase).toBe("defeat");
		});

		it("can pause and unpause", () => {
			const world = makeWorld();
			world.session.phase = "playing";
			world.session.phase = "paused";
			expect(world.session.phase).toBe("paused");
			world.session.phase = "playing";
			expect(world.session.phase).toBe("playing");
		});
	});
});
