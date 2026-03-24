/**
 * AppScreen Routing Specification Tests
 *
 * Defines the behavioral contract for AppScreen trait (screen routing).
 * AppScreen replaces Zustand's phase management and drives which React
 * screen is displayed: menu | campaign | briefing | game | victory | settings.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §3, §7
 *   - src/ecs/traits/state.ts (AppScreen, AppScreenType)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, type World } from "koota";
import { AppScreen, type AppScreenType, GamePhase, GameClock } from "@/ecs/traits/state";
import { initSingletons } from "@/ecs/singletons";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("AppScreen trait", () => {
	describe("initialization", () => {
		it("is added to the world by initSingletons", () => {
			expect(world.has(AppScreen)).toBe(true);
		});

		it("starts on 'menu' screen", () => {
			const screen = world.get(AppScreen)!;
			expect(screen.screen).toBe("menu");
		});
	});

	describe("screen transitions", () => {
		it("can transition to campaign screen", () => {
			world.set(AppScreen, { screen: "campaign" });
			expect(world.get(AppScreen)!.screen).toBe("campaign");
		});

		it("can transition to briefing screen", () => {
			world.set(AppScreen, { screen: "briefing" });
			expect(world.get(AppScreen)!.screen).toBe("briefing");
		});

		it("can transition to game screen", () => {
			world.set(AppScreen, { screen: "game" });
			expect(world.get(AppScreen)!.screen).toBe("game");
		});

		it("can transition to victory screen", () => {
			world.set(AppScreen, { screen: "victory" });
			expect(world.get(AppScreen)!.screen).toBe("victory");
		});

		it("can transition to settings screen", () => {
			world.set(AppScreen, { screen: "settings" });
			expect(world.get(AppScreen)!.screen).toBe("settings");
		});
	});

	describe("app flow (menu → campaign → briefing → game → victory)", () => {
		it("follows the full expected app flow", () => {
			// Start at menu
			expect(world.get(AppScreen)!.screen).toBe("menu");

			// User clicks "New Deployment"
			world.set(AppScreen, { screen: "campaign" });
			expect(world.get(AppScreen)!.screen).toBe("campaign");

			// User clicks a mission marker
			world.set(AppScreen, { screen: "briefing" });
			expect(world.get(AppScreen)!.screen).toBe("briefing");

			// User clicks "Deploy"
			world.set(AppScreen, { screen: "game" });
			expect(world.get(AppScreen)!.screen).toBe("game");

			// Mission complete
			world.set(AppScreen, { screen: "victory" });
			expect(world.get(AppScreen)!.screen).toBe("victory");

			// User clicks "Next Mission"
			world.set(AppScreen, { screen: "campaign" });
			expect(world.get(AppScreen)!.screen).toBe("campaign");
		});
	});

	describe("valid screen types", () => {
		const validScreens: AppScreenType[] = [
			"menu",
			"campaign",
			"briefing",
			"game",
			"victory",
			"settings",
		];

		it("accepts all 6 valid screen types", () => {
			for (const screen of validScreens) {
				world.set(AppScreen, { screen });
				expect(world.get(AppScreen)!.screen).toBe(screen);
			}
		});
	});
});

describe("GamePhase trait", () => {
	describe("initialization", () => {
		it("starts in 'loading' phase", () => {
			expect(world.get(GamePhase)!.phase).toBe("loading");
		});
	});

	describe("phase transitions during gameplay", () => {
		it("transitions loading → playing", () => {
			world.set(GamePhase, { phase: "playing" });
			expect(world.get(GamePhase)!.phase).toBe("playing");
		});

		it("transitions playing → paused", () => {
			world.set(GamePhase, { phase: "playing" });
			world.set(GamePhase, { phase: "paused" });
			expect(world.get(GamePhase)!.phase).toBe("paused");
		});

		it("transitions playing → victory", () => {
			world.set(GamePhase, { phase: "playing" });
			world.set(GamePhase, { phase: "victory" });
			expect(world.get(GamePhase)!.phase).toBe("victory");
		});

		it("transitions playing → defeat", () => {
			world.set(GamePhase, { phase: "playing" });
			world.set(GamePhase, { phase: "defeat" });
			expect(world.get(GamePhase)!.phase).toBe("defeat");
		});
	});
});

describe("GameClock trait", () => {
	describe("initialization", () => {
		it("starts with elapsed=0, paused=false", () => {
			const clock = world.get(GameClock)!;
			expect(clock.elapsed).toBe(0);
			expect(clock.paused).toBe(false);
		});
	});

	describe("mutations", () => {
		it("can advance elapsed time", () => {
			world.set(GameClock, { elapsed: 120.5 });
			expect(world.get(GameClock)!.elapsed).toBe(120.5);
		});

		it("can pause the clock", () => {
			world.set(GameClock, { paused: true });
			expect(world.get(GameClock)!.paused).toBe(true);
		});
	});
});
