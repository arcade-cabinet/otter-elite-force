/**
 * App Screen State Tests — ported from old Koota codebase.
 *
 * Tests game phase transitions and screen state management.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld } from "@/engine/world/gameWorld";

describe("App screen state", () => {
	it("session starts in loading phase", () => {
		const world = createGameWorld();
		expect(world.session.phase).toBe("loading");
	});

	it("can transition through standard phase sequence", () => {
		const world = createGameWorld();

		world.session.phase = "loading";
		expect(world.session.phase).toBe("loading");

		world.session.phase = "briefing";
		expect(world.session.phase).toBe("briefing");

		world.session.phase = "playing";
		expect(world.session.phase).toBe("playing");

		world.session.phase = "victory";
		expect(world.session.phase).toBe("victory");
	});

	it("can pause and resume", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.session.phase = "paused";
		expect(world.session.phase).toBe("paused");
		world.session.phase = "playing";
		expect(world.session.phase).toBe("playing");
	});

	it("can reach defeat state", () => {
		const world = createGameWorld();
		world.session.phase = "playing";
		world.session.phase = "defeat";
		expect(world.session.phase).toBe("defeat");
	});

	it("events array starts empty", () => {
		const world = createGameWorld();
		expect(world.events).toHaveLength(0);
	});

	it("events can accumulate", () => {
		const world = createGameWorld();
		world.events.push({ type: "unit-spawned" });
		world.events.push({ type: "building-placed" });
		world.events.push({ type: "research-complete" });
		expect(world.events).toHaveLength(3);
	});
});
