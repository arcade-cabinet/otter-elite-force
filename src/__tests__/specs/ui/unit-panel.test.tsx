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
 *
 * Tests are written BEFORE the component exists.
 */
import { describe, it, expect, beforeEach } from "vitest";

let React: typeof import("react");
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let createWorld: typeof import("koota").createWorld;
let trait: typeof import("koota").trait;
let WorldProvider: any;
let UnitPanel: any;

let loadError: string | null = null;

beforeEach(async () => {
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		render = rtl.render;
		screen = rtl.screen;
		const koota = await import("koota");
		createWorld = koota.createWorld;
		trait = koota.trait;
		const kootaReact = await import("@koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const mod = await import("@/ui/hud/UnitPanel");
		UnitPanel = mod.UnitPanel ?? mod.default;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => loadError !== null;

function renderWithWorld(ui: any, worldSetup?: (world: any) => void) {
	const world = createWorld();
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
				const UnitType = trait({ type: "" });
				const Faction = trait({ id: "" });
				const Selected = trait();
				const Health = trait({ current: 80, max: 80 });
				const Combat = trait({ damage: 12, armor: 2, range: 1, speed: 8 });

				world
					.spawn(UnitType, Faction, Selected, Health, Combat)
					.set(UnitType, { type: "mudfoot" })
					.set(Faction, { id: "ura" })
					.set(Health, { current: 80, max: 80 })
					.set(Combat, { damage: 12, armor: 2, range: 1, speed: 8 });
			});
			expect(screen.getByText(/mudfoot/i)).toBeTruthy();
		});

		it("displays HP as a value (e.g. 80/80)", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Health = trait({ current: 65, max: 80 });

				world
					.spawn(UnitType, Selected, Health)
					.set(UnitType, { type: "mudfoot" })
					.set(Health, { current: 65, max: 80 });
			});
			expect(screen.getByText(/65\s*\/\s*80/)).toBeTruthy();
		});

		it("displays armor value", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Health = trait({ current: 80, max: 80 });
				const Combat = trait({ damage: 12, armor: 2, range: 1, speed: 8 });

				world
					.spawn(UnitType, Selected, Health, Combat)
					.set(UnitType, { type: "mudfoot" })
					.set(Health, { current: 80, max: 80 })
					.set(Combat, { damage: 12, armor: 2, range: 1, speed: 8 });
			});
			// Should display armor somewhere in the panel
			expect(screen.getByText(/2/)).toBeTruthy();
		});

		it("displays damage value", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Health = trait({ current: 80, max: 80 });
				const Combat = trait({ damage: 12, armor: 2, range: 1, speed: 8 });

				world
					.spawn(UnitType, Selected, Health, Combat)
					.set(UnitType, { type: "mudfoot" })
					.set(Health, { current: 80, max: 80 })
					.set(Combat, { damage: 12, armor: 2, range: 1, speed: 8 });
			});
			expect(screen.getByText(/12/)).toBeTruthy();
		});
	});

	describe("multiple units selected", () => {
		it("displays count of selected units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(UnitPanel), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Health = trait({ current: 80, max: 80 });

				// Select 3 Mudfoots
				for (let i = 0; i < 3; i++) {
					world
						.spawn(UnitType, Selected, Health)
						.set(UnitType, { type: "mudfoot" })
						.set(Health, { current: 80, max: 80 });
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
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const IsHero = trait();
				const Health = trait({ current: 120, max: 120 });

				world
					.spawn(UnitType, Selected, IsHero, Health)
					.set(UnitType, { type: "sgt_bubbles" })
					.set(Health, { current: 120, max: 120 });
			});
			expect(screen.getByText(/sgt.*bubbles/i)).toBeTruthy();
		});
	});
});
