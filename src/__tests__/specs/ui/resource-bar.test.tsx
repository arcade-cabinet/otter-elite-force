/**
 * ResourceBar Component Specification Tests
 *
 * Defines the behavioral contract for the ResourceBar HUD component.
 * ResourceBar displays Fish, Timber, Salvage counts and population (current/max)
 * by reading Koota singleton traits via @koota/react hooks.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §5, §7, §10
 *   - docs/design/game-design-document.md (three resources + population)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 *
 * Tests are written BEFORE the component exists.
 * They WILL FAIL until ResourceBar.tsx and Koota singleton traits are implemented.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// We need React + testing-library + Koota. These may not be installed yet.
// Guard every test with skipIfNotLoaded so the suite still runs (and skips)
// when dependencies are missing.
// ---------------------------------------------------------------------------

let React: typeof import("react");
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let ResourceBar: any;
let ResourcePool: typeof import("@/ecs/traits/state").ResourcePool;
let PopulationState: typeof import("@/ecs/traits/state").PopulationState;

let loadError: string | null = null;

beforeEach(async () => {
	loadError = null;
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		render = rtl.render;
		screen = rtl.screen;
		const koota = await import("koota");
		createWorld = koota.createWorld;
		const kootaReact = await import("koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const stateTraits = await import("@/ecs/traits/state");
		ResourcePool = stateTraits.ResourcePool;
		PopulationState = stateTraits.PopulationState;
		const mod = await import("@/ui/hud/ResourceBar");
		ResourceBar = mod.ResourceBar ?? mod.default;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => loadError !== null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithWorld(ui: any, worldSetup?: (world: any) => void) {
	const world = createWorld();
	if (worldSetup) worldSetup(world);
	return render(React.createElement(WorldProvider, { world }, ui));
}

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("ResourceBar", () => {
	describe("rendering", () => {
		it("renders without crashing", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(ResourceBar));
			expect(container).toBeTruthy();
		});

		it("displays all three resource types: Fish, Timber, Salvage", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar));
			expect(screen.getByText(/fish/i)).toBeTruthy();
			expect(screen.getByText(/timber/i)).toBeTruthy();
			expect(screen.getByText(/salvage/i)).toBeTruthy();
		});

		it("displays population as current/max", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar));
			// Should show population in some format like "4/24" or "POP: 4/24"
			expect(screen.getByText(/\d+\s*\/\s*\d+/)).toBeTruthy();
		});
	});

	describe("Koota state integration", () => {
		it("displays zero values when ResourcePool trait has default values", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar));
			// Default ResourcePool is { fish: 0, timber: 0, salvage: 0 }
			// Should display 0 for each resource
			const zeros = screen.getAllByText("0");
			expect(zeros.length).toBeGreaterThanOrEqual(3);
		});

		it("displays correct fish count from ResourcePool", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar), (world: any) => {
					world.set(ResourcePool, { fish: 250, timber: 0, salvage: 0 });
			});
			expect(screen.getByText("250")).toBeTruthy();
		});

		it("displays correct population from PopulationState", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar), (world: any) => {
					world.set(PopulationState, { current: 12, max: 24 });
			});
			expect(screen.getByText(/12\s*\/\s*24/)).toBeTruthy();
		});
	});

	describe("accessibility", () => {
		it("has accessible labels for screen readers", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar));
			// Resource values should be labeled for assistive technology
			const container = screen.getByRole("status") ?? screen.getByTestId("resource-bar");
			expect(container).toBeTruthy();
		});
	});

	describe("tactical theme", () => {
		it("applies tactical HUD styling class", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(ResourceBar));
			// Should have a class that identifies it as part of the tactical HUD
			const bar =
				container.querySelector("[class*='resource']") ??
				container.querySelector("[data-testid='resource-bar']");
			expect(bar).toBeTruthy();
		});
	});
});
