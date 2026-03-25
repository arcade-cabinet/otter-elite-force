import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import {
	AppScreen,
	type AppScreenType,
	GameClock,
	GamePhase,
	type GamePhaseType,
} from "@/ecs/traits/state";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.destroy();
});

describe("AppScreen trait", () => {
	it("starts on menu", () => {
		expect(world.get(AppScreen)?.screen).toBe("menu");
	});

	it("accepts the simplified screen set", () => {
		const validScreens: AppScreenType[] = ["menu", "game", "victory", "settings"];
		for (const screen of validScreens) {
			world.set(AppScreen, { screen });
			expect(world.get(AppScreen)?.screen).toBe(screen);
		}
	});

	it("follows the simplified app flow", () => {
		world.set(AppScreen, { screen: "game" });
		expect(world.get(AppScreen)?.screen).toBe("game");

		world.set(AppScreen, { screen: "victory" });
		expect(world.get(AppScreen)?.screen).toBe("victory");

		world.set(AppScreen, { screen: "menu" });
		expect(world.get(AppScreen)?.screen).toBe("menu");
	});
});

describe("GamePhase trait", () => {
	it("starts in loading", () => {
		expect(world.get(GamePhase)?.phase).toBe("loading");
	});

	it("accepts the gameplay phase set", () => {
		const phases: GamePhaseType[] = ["loading", "playing", "paused", "victory", "defeat"];
		for (const phase of phases) {
			world.set(GamePhase, { phase });
			expect(world.get(GamePhase)?.phase).toBe(phase);
		}
	});
});

describe("GameClock trait", () => {
	it("starts at zero and can advance", () => {
		expect(world.get(GameClock)?.elapsedMs).toBe(0);
		world.set(GameClock, { elapsedMs: 120500, lastDeltaMs: 16, tick: 42 });
		expect(world.get(GameClock)?.elapsedMs).toBe(120500);
		expect(world.get(GameClock)?.lastDeltaMs).toBe(16);
		expect(world.get(GameClock)?.tick).toBe(42);
	});
});
