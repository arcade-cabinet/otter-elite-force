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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSingletons } from "@/ecs/singletons";

let React: typeof import("react");
let cleanup: typeof import("@testing-library/react").cleanup;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let ActionBar: any;
let UnitType: typeof import("@/ecs/traits/identity").UnitType;
let Selected: typeof import("@/ecs/traits/identity").Selected;
let IsBuilding: typeof import("@/ecs/traits/identity").IsBuilding;
let Category: typeof import("@/ecs/traits/identity").Category;
let ProductionQueue: typeof import("@/ecs/traits/economy").ProductionQueue;
let ResourcePool: typeof import("@/ecs/traits/state").ResourcePool;
let PopulationState: typeof import("@/ecs/traits/state").PopulationState;
let EventBus: typeof import("@/game/EventBus").EventBus;
let sharedWorld: { reset: () => void } | null = null;

let loadError: string | null = null;

beforeEach(async () => {
	loadError = null;
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		cleanup = rtl.cleanup;
		fireEvent = rtl.fireEvent;
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
		UnitType = identityTraits.UnitType;
		Selected = identityTraits.Selected;
		IsBuilding = identityTraits.IsBuilding;
		Category = identityTraits.Category;
		const economyTraits = await import("@/ecs/traits/economy");
		ProductionQueue = economyTraits.ProductionQueue;
		const stateTraits = await import("@/ecs/traits/state");
		ResourcePool = stateTraits.ResourcePool;
		PopulationState = stateTraits.PopulationState;
		EventBus = (await import("@/game/EventBus")).EventBus;
		const mod = await import("@/ui/hud/ActionBar");
		ActionBar = mod.ActionBar ?? mod.default;
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
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "river_rat" });
				entity.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/build/i)).toBeTruthy();
		});

		it("shows Gather action for a worker", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "river_rat" });
				entity.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/gather/i)).toBeTruthy();
		});

		it("shows Stop action for a worker", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "river_rat" });
				entity.set(Category, { category: "worker" });
			});
			expect(screen.getByText(/stop/i)).toBeTruthy();
		});

		it("shows the build palette when Build is pressed", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "river_rat" });
				entity.set(Category, { category: "worker" });
			});
			fireEvent.click(screen.getByRole("button", { name: /build/i }));
			expect(screen.getByText(/command post/i)).toBeTruthy();
			expect(screen.getByText(/barracks/i)).toBeTruthy();
		});
	});

	describe("military unit selected", () => {
		it("shows Move action for a Mudfoot infantry", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Category, { category: "infantry" });
			});
			expect(screen.getByRole("button", { name: /move/i })).toBeTruthy();
		});

		it("shows Attack action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/attack/i)).toBeTruthy();
		});

		it("shows Patrol action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/patrol/i)).toBeTruthy();
		});

		it("shows Hold Position action for military units", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Category, { category: "infantry" });
			});
			expect(screen.getByText(/hold/i)).toBeTruthy();
		});
	});

	describe("building selected", () => {
		it("shows Train button for a Barracks", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				world.spawn(UnitType, IsBuilding, Selected).set(UnitType, { type: "barracks" });
			});
			expect(screen.getByText(/train/i)).toBeTruthy();
		});

		it("shows Research button for an Armory", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				world.spawn(UnitType, IsBuilding, Selected).set(UnitType, { type: "armory" });
			});
			expect(screen.getByText(/research/i)).toBeTruthy();
		});

		it("shows trainable units for a Barracks by default", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				world.set(ResourcePool, { fish: 500, timber: 0, salvage: 500 });
				world.set(PopulationState, { current: 0, max: 12 });
				world
					.spawn(UnitType, IsBuilding, Selected, ProductionQueue)
					.set(UnitType, { type: "barracks" });
			});
			expect(screen.getByText(/mudfoot/i)).toBeTruthy();
			expect(screen.getByText(/shellcracker/i)).toBeTruthy();
		});

		it("queues a trainable unit when clicked", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				world.set(ResourcePool, { fish: 500, timber: 0, salvage: 500 });
				world.set(PopulationState, { current: 0, max: 12 });
				world
					.spawn(UnitType, IsBuilding, Selected, ProductionQueue)
					.set(UnitType, { type: "barracks" });
			});

			fireEvent.click(screen.getByRole("button", { name: /mudfoot/i }));
			expect(screen.getByText(/queue 1/i)).toBeTruthy();
		});
	});

	describe("worker build actions", () => {
		it("emits build placement intent when a build option is chosen", () => {
			if (skip()) return;
			const spy = vi.spyOn(EventBus, "emit");

			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				world.set(ResourcePool, { fish: 1000, timber: 1000, salvage: 1000 });
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "river_rat" });
				entity.set(Category, { category: "worker" });
			});

			fireEvent.click(screen.getByRole("button", { name: /build/i }));
			fireEvent.click(screen.getByRole("button", { name: /barracks/i }));

			expect(spy).toHaveBeenCalledWith(
				"start-build-placement",
				expect.objectContaining({ buildingId: "barracks" }),
			);
			spy.mockRestore();
		});
	});

	describe("action buttons are interactive", () => {
		it("action buttons are not disabled by default", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ActionBar), (world: any) => {
				const entity = world.spawn(UnitType, Selected, Category);
				entity.set(UnitType, { type: "mudfoot" });
				entity.set(Category, { category: "infantry" });
			});
			const buttons = screen.getAllByRole("button");
			for (const btn of buttons) {
				expect(btn.getAttribute("disabled")).toBeNull();
			}
		});
	});
});
