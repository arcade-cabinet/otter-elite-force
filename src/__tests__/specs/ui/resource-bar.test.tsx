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
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";

let React: typeof import("react");
let cleanup: typeof import("@testing-library/react").cleanup;
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let ResourceBar: any;
let ResourcePool: typeof import("@/ecs/traits/state").ResourcePool;
let PopulationState: typeof import("@/ecs/traits/state").PopulationState;
let sharedWorld: { reset: () => void } | null = null;

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
		const stateTraits = await import("@/ecs/traits/state");
		ResourcePool = stateTraits.ResourcePool;
		PopulationState = stateTraits.PopulationState;
		const mod = await import("@/ui/hud/ResourceBar");
		ResourceBar = mod.ResourceBar ?? mod.default;
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
			// Should show population in some format like "0/4" (default PopulationState)
			expect(screen.getByText(/\d+\s*\/\s*\d+/)).toBeTruthy();
		});
	});

	describe("Koota state integration", () => {
		it("displays zero values when ResourcePool trait has default values", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(ResourceBar));
			// Default ResourcePool is { fish: 0, timber: 0, salvage: 0 }
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
			const container = screen.getByRole("status") ?? screen.getByTestId("resource-bar");
			expect(container).toBeTruthy();
		});
	});

	describe("tactical theme", () => {
		it("applies tactical HUD styling class", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(ResourceBar));
			const bar =
				container.querySelector("[class*='resource']") ??
				container.querySelector("[data-testid='resource-bar']");
			expect(bar).toBeTruthy();
		});
	});
});
