/**
 * Campaign Progress State Tests — ported from old Koota codebase.
 *
 * Tests campaign state tracking through the GameWorld.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, resetWorldSession } from "@/engine/world/gameWorld";

describe("Campaign progress state", () => {
	describe("initialization", () => {
		it("starts with null currentMissionId", () => {
			const world = createGameWorld();
			expect(world.campaign.currentMissionId).toBeNull();
		});

		it("starts with support difficulty", () => {
			const world = createGameWorld();
			expect(world.campaign.difficulty).toBe("support");
		});
	});

	describe("mission tracking", () => {
		it("can set current mission", () => {
			const world = createGameWorld();
			world.campaign.currentMissionId = "mission-01";
			expect(world.campaign.currentMissionId).toBe("mission-01");
		});

		it("can change difficulty to tactical", () => {
			const world = createGameWorld();
			world.campaign.difficulty = "tactical";
			expect(world.campaign.difficulty).toBe("tactical");
		});

		it("can change difficulty to elite", () => {
			const world = createGameWorld();
			world.campaign.difficulty = "elite";
			expect(world.campaign.difficulty).toBe("elite");
		});
	});

	describe("session management", () => {
		it("session starts in loading phase", () => {
			const world = createGameWorld();
			expect(world.session.phase).toBe("loading");
		});

		it("session tracks current mission ID", () => {
			const world = createGameWorld();
			world.session.currentMissionId = "mission-05";
			expect(world.session.currentMissionId).toBe("mission-05");
		});

		it("session tracks objectives", () => {
			const world = createGameWorld();
			world.session.objectives.push({
				id: "obj-1",
				description: "Destroy enemy base",
				status: "incomplete",
			});
			world.session.objectives.push({
				id: "obj-2",
				description: "Find intel",
				status: "completed",
				bonus: true,
			});

			expect(world.session.objectives).toHaveLength(2);
			expect(world.session.objectives[0].status).toBe("incomplete");
			expect(world.session.objectives[1].bonus).toBe(true);
		});

		it("resetWorldSession clears session state", () => {
			const world = createGameWorld();
			world.session.currentMissionId = "mission-05";
			world.session.phase = "playing";
			world.session.objectives.push({ id: "obj-1", description: "Win", status: "completed" });
			world.session.resources = { fish: 100, timber: 200, salvage: 50 };

			resetWorldSession(world);

			expect(world.session.currentMissionId).toBeNull();
			expect(world.session.phase).toBe("loading");
			expect(world.session.objectives).toHaveLength(0);
			expect(world.session.resources.fish).toBe(0);
		});

		it("resetWorldSession preserves campaign state", () => {
			const world = createGameWorld();
			world.campaign.currentMissionId = "mission-10";
			world.campaign.difficulty = "elite";

			resetWorldSession(world);

			// Campaign state should NOT be reset
			expect(world.campaign.currentMissionId).toBe("mission-10");
			expect(world.campaign.difficulty).toBe("elite");
		});
	});

	describe("dialogue state", () => {
		it("starts with null dialogue", () => {
			const world = createGameWorld();
			expect(world.session.dialogue).toBeNull();
		});

		it("can set active dialogue", () => {
			const world = createGameWorld();
			world.session.dialogue = {
				active: true,
				lines: [
					{ speaker: "Col. Bubbles", text: "Move to the objective!" },
					{ speaker: "FOXHOUND", text: "Enemy positions detected." },
				],
			};

			expect(world.session.dialogue?.active).toBe(true);
			expect(world.session.dialogue?.lines).toHaveLength(2);
			expect(world.session.dialogue?.lines[0].speaker).toBe("Col. Bubbles");
		});

		it("resetWorldSession clears dialogue", () => {
			const world = createGameWorld();
			world.session.dialogue = {
				active: true,
				lines: [{ speaker: "Test", text: "Testing" }],
			};

			resetWorldSession(world);

			expect(world.session.dialogue).toBeNull();
		});
	});

	describe("settings persistence", () => {
		it("starts with default settings", () => {
			const world = createGameWorld();
			expect(world.settings.masterVolume).toBe(1);
			expect(world.settings.musicVolume).toBe(0.8);
			expect(world.settings.sfxVolume).toBe(0.9);
			expect(world.settings.showSubtitles).toBe(true);
			expect(world.settings.reduceMotion).toBe(false);
		});

		it("settings are preserved across session reset", () => {
			const world = createGameWorld();
			world.settings.masterVolume = 0.5;
			world.settings.musicVolume = 0.3;

			resetWorldSession(world);

			// Settings should NOT be affected by session reset
			expect(world.settings.masterVolume).toBe(0.5);
			expect(world.settings.musicVolume).toBe(0.3);
		});
	});
});
