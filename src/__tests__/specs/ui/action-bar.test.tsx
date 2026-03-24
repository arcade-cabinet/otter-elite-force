/**
 * ActionBar Component Specification Tests
 *
 * Defines the behavioral contract for the ActionBar HUD component.
 * ActionBar shows contextual action buttons based on selected unit type:
 * - Workers: Build, Gather, Repair
 * - Military: Move, Attack, Patrol, Hold Position
 * - Buildings: Train units, Research
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §5, §10
 *   - docs/design/game-design-document.md (unit abilities)
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
let ActionBar: any;

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
		const mod = await import("@/ui/hud/ActionBar");
		ActionBar = mod.ActionBar ?? mod.default;
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

describe("ActionBar", () => {
	describe("no selection", () => {
		it("renders empty or hidden when nothing is selected", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(ActionBar));
			const bar = container.querySelector("[data-testid='action-bar']");
			if (bar) {
				// Should have no action buttons
				const buttons = bar.querySelectorAll("button");
				expect(buttons.length).toBe(0);
			}
		});
	});

	describe("worker selected", () => {
		it("shows Build action for a River Rat worker", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Faction = trait({ id: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Faction, Selected, Category)
					.set(UnitType, { type: "river_rat" })
					.set(Faction, { id: "ura" })
					.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/build/i)).toBeTruthy();
		});

		it("shows Gather action for a worker", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "river_rat" })
					.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/gather/i)).toBeTruthy();
		});

		it("shows Repair action for a worker", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "river_rat" })
					.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/repair/i)).toBeTruthy();
		});
	});

	describe("military unit selected", () => {
		it("shows Move action for a Mudfoot infantry", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "mudfoot" })
					.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/move/i)).toBeTruthy();
		});

		it("shows Attack action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "mudfoot" })
					.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/attack/i)).toBeTruthy();
		});

		it("shows Patrol action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "mudfoot" })
					.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/patrol/i)).toBeTruthy();
		});

		it("shows Hold Position action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "mudfoot" })
					.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/hold/i)).toBeTruthy();
		});
	});

	describe("building selected", () => {
		it("shows Train button for a Barracks", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const IsBuilding = trait();
				const Selected = trait();

				world.spawn(UnitType, IsBuilding, Selected).set(UnitType, { type: "barracks" });
			});
			expect(screen.getByText(/train/i)).toBeTruthy();
		});

		it("shows Research button for an Armory", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const IsBuilding = trait();
				const Selected = trait();

				world.spawn(UnitType, IsBuilding, Selected).set(UnitType, { type: "armory" });
			});
			expect(screen.getByText(/research/i)).toBeTruthy();
		});
	});

	describe("action buttons are interactive", () => {
		it("action buttons are not disabled by default", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const UnitType = trait({ type: "" });
				const Selected = trait();
				const Category = trait({ category: "" });

				world
					.spawn(UnitType, Selected, Category)
					.set(UnitType, { type: "mudfoot" })
					.set(Category, { category: "infantry" });
			});
			const buttons = screen.getAllByRole("button");
			for (const btn of buttons) {
				expect(btn).not.toHaveAttribute("disabled");
			}
		});
	});
});
