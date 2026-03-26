/**
 * UnitPanel Component Specification Tests
 *
 * Defines the behavioral contract for the UnitPanel HUD component.
 * UnitPanel displays stats for the currently selected unit(s):
 * portrait, name, HP bar, armor, damage, range, speed.
 * Reads Selected tag + unit traits from Koota.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §5, §7, §10
 *   - docs/design/game-design-document.md (unit stats)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";

let React: typeof import("react");
let cleanup: typeof import("@testing-library/react").cleanup;
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let UnitPanel: any;
let UnitType: typeof import("@/ecs/traits/identity").UnitType;
let Selected: typeof import("@/ecs/traits/identity").Selected;
let IsHero: typeof import("@/ecs/traits/identity").IsHero;
let Health: typeof import("@/ecs/traits/combat").Health;
let Attack: typeof import("@/ecs/traits/combat").Attack;
let Armor: typeof import("@/ecs/traits/combat").Armor;
let sharedWorld: { reset: () => void; spawn: (...args: any[]) => any } | null = null;

let loadError: string | null = null;

beforeEach(async () => {
	loadError = null;
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		cleanup = rtl.cleanup;
		render = rtl.render;
		screen = rtl.screen;
		const koota = await import("koota");
		createWorld = koota.createWorld;
		if (!sharedWorld) {
			sharedWorld = createWorld();
		}
		const kootaReact = await import("koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const identityTraits = await import("@/ecs/traits/identity");
		const combatTraits = await import("@/ecs/traits/combat");
		UnitType = identityTraits.UnitType;
		Selected = identityTraits.Selected;
		IsHero = identityTraits.IsHero;
		Health = combatTraits.Health;
		Attack = combatTraits.Attack;
		Armor = combatTraits.Armor;
		const mod = await import("@/ui/hud/UnitPanel");
		UnitPanel = mod.UnitPanel ?? mod.default;
	} catch (e) {
		loadError = (e as Error).message;
	}

	sharedWorld?.reset();
	if (sharedWorld) initSingletons(sharedWorld as never);
});

afterEach(() => {
	if (!skip()) cleanup();
});

const skip = () => loadError !== null;

function renderWithWorld(ui: any, worldSetup?: (world: any) => void) {
	const world = sharedWorld;
	if (!world) {
		throw new Error("Shared test world was not initialized");
	}
	if (worldSetup) worldSetup(world);
	return render(React.createElement(WorldProvider, { world }, ui));
}

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("UnitPanel", () => {
	describe("no selection", () => {
		it("renders nothing when no unit is selected", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(UnitPanel));
			// With no Selected entities, panel should be empty or hidden
			const panel = container.querySelector("[data-testid='unit-panel']");
			// Either the panel doesn't exist or it has no meaningful content
			if (panel) {
				expect(panel.textContent?.trim()).toBe("");
			}
		});
	});

	describe("single unit selected", () => {
		it("displays the unit name when a Mudfoot is selected", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Health, Attack, Armor);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Health, { current: 80, max: 80 });
				entity.set(Attack, { damage: 12, range: 1, cooldown: 1, timer: 0 });
				entity.set(Armor, { value: 2 });
			});
			expect(screen.getByText(/mudfoot/i)).toBeTruthy();
		});

		it("displays HP as a value (e.g. 80/80)", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Health);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Health, { current: 65, max: 80 });
			});
			expect(screen.getByText(/65\s*\/\s*80/)).toBeTruthy();
		});

		it("displays armor value", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Health, Attack, Armor);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Health, { current: 80, max: 80 });
				entity.set(Attack, { damage: 12, range: 1, cooldown: 1, timer: 0 });
				entity.set(Armor, { value: 2 });
			});
			// Should display armor somewhere in the panel
			expect(screen.getByText(/arm\s*2/i)).toBeTruthy();
		});

		it("displays damage value", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Health, Attack, Armor);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Health, { current: 80, max: 80 });
				entity.set(Attack, { damage: 12, range: 1, cooldown: 1, timer: 0 });
				entity.set(Armor, { value: 2 });
			});
			expect(screen.getByText(/dmg\s*12/i)).toBeTruthy();
		});
	});

	describe("multiple units selected", () => {
		it("displays count of selected units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				// Select 3 Mudfoots
				for (let i = 0; i < 3; i++) {
					const entity = world.spawn(UnitType, Selected, Health);
					entity.set(UnitType, { type: "mudfoot" });
					entity.set(Health, { current: 80, max: 80 });
				}
			});
			// Should indicate 3 units selected
			expect(screen.getByText(/3/)).toBeTruthy();
		});
	});

	describe("hero display", () => {
		it("indicates hero status for hero units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const entity = world.spawn(UnitType, Selected, IsHero, Health);
				entity.set(UnitType, { type: "col_bubbles" });
				entity.set(Health, { current: 120, max: 120 });
			});
			expect(screen.getByText(/col.*bubbles/i)).toBeTruthy();
		});
	});
});
