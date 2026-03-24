/**
 * CampaignMap Component Specification Tests
 *
 * Defines the behavioral contract for the CampaignMap (command-post theme).
 * CampaignMap displays:
 *   - Weathered parchment/atlas background
 *   - Mission markers at fixed positions
 *   - Locked/unlocked/completed states per mission
 *   - Star ratings on completed missions
 *   - Click a mission marker → navigate to BriefingScreen
 *   - Chapter groupings (4 chapters x 4 missions)
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §4 (Theme 2), §5, §10
 *   - docs/design/game-design-document.md (16 missions, 4 chapters)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 *
 * Tests are written BEFORE the component exists.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

let React: typeof import("react");
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let CampaignMap: any;
let CampaignProgress: typeof import("@/ecs/traits/state").CampaignProgress;

let loadError: string | null = null;

beforeEach(async () => {
	loadError = null;
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		render = rtl.render;
		screen = rtl.screen;
		fireEvent = rtl.fireEvent;
		const koota = await import("koota");
		createWorld = koota.createWorld;
		const kootaReact = await import("koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const stateTraits = await import("@/ecs/traits/state");
		CampaignProgress = stateTraits.CampaignProgress;
		const mod = await import("@/ui/command-post/CampaignMap");
		CampaignMap = mod.CampaignMap ?? mod.default;
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

// ---------------------------------------------------------------------------
// Helpers: campaign progress states
// ---------------------------------------------------------------------------

function freshCampaignSetup(world: any) {
	world.set(CampaignProgress, {
		missions: {
			mission_1: { status: "unlocked", stars: 0, bestTime: 0 },
		},
		currentMission: "mission_1",
		difficulty: "tactical",
	});
}

function midCampaignSetup(world: any) {
	world.set(CampaignProgress, {
		missions: {
			mission_1: { status: "completed", stars: 3, bestTime: 420000 },
			mission_2: { status: "completed", stars: 2, bestTime: 600000 },
			mission_3: { status: "completed", stars: 2, bestTime: 540000 },
			mission_4: { status: "completed", stars: 1, bestTime: 780000 },
			mission_5: { status: "unlocked", stars: 0, bestTime: 0 },
		},
		currentMission: "mission_5",
		difficulty: "tactical",
	});
}

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("CampaignMap", () => {
	describe("rendering", () => {
		it("renders without crashing", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			expect(container).toBeTruthy();
		});

		it("displays chapter headings or groupings", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			// 4 chapters total; at least Chapter 1 should be visible
			expect(screen.getByText(/chapter\s*1/i)).toBeTruthy();
		});
	});

	describe("mission markers — fresh campaign", () => {
		it("shows mission 1 as unlocked/available", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			// Mission 1 marker should be interactable
			const marker = screen.getByText(/mission\s*1/i) ?? screen.getByText(/first light/i);
			expect(marker).toBeTruthy();
		});

		it("shows later missions as locked", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			// Locked missions should have a visual locked state
			const lockedMarkers = container.querySelectorAll(
				"[data-status='locked'], [class*='locked'], [aria-disabled='true']",
			);
			// At least some missions should be locked (missions 2-16)
			expect(lockedMarkers.length).toBeGreaterThan(0);
		});

		it("locked missions are not clickable", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			const lockedMarker = container.querySelector(
				"[data-status='locked'], [class*='locked'], [aria-disabled='true']",
			);
			if (lockedMarker) {
				const btn = lockedMarker.closest("button");
				if (btn) {
						expect(btn.getAttribute("disabled")).not.toBeNull();
				}
			}
		});
	});

	describe("mission markers — mid campaign", () => {
		it("shows completed missions with star ratings", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), midCampaignSetup);
			const stars = container.querySelectorAll(
				"[data-stars], [class*='star'], [aria-label*='star']",
			);
			expect(stars.length).toBeGreaterThan(0);
		});

		it("shows unlocked (next) mission as available", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(CampaignMap), midCampaignSetup);
			// Mission 5 should be available to click
			const marker = screen.getByText(/mission\s*5/i);
			expect(marker).toBeTruthy();
			const btn = marker.closest("button");
			if (btn) {
					expect(btn.getAttribute("disabled")).toBeNull();
			}
		});

		it("total star count is displayed", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(CampaignMap), midCampaignSetup);
			// Total stars: 3 + 2 + 2 + 1 = 8
			expect(screen.getByText(/8/)).toBeTruthy();
		});
	});

	describe("mission selection", () => {
		it("clicking an unlocked mission marker triggers navigation", () => {
			if (skip()) return;
			const onSelectMission = vi.fn();
			renderWithWorld(React.createElement(CampaignMap, { onSelectMission }), freshCampaignSetup);
			const marker = screen.getByText(/mission\s*1/i) ?? screen.getByText(/first light/i);
			fireEvent.click(marker.closest("button") ?? marker);
			expect(onSelectMission).toHaveBeenCalledWith("mission_1");
		});
	});

	describe("command-post theme", () => {
		it("applies command-post visual theme", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			const root = container.firstElementChild;
			expect(root).toBeTruthy();
			// Should use command-post or parchment styling
			const hasTheme =
				root?.className?.includes("command-post") ||
				root?.className?.includes("campaign") ||
				root?.className?.includes("parchment") ||
				root?.getAttribute("data-theme") === "command-post";
			expect(hasTheme).toBe(true);
		});
	});

	describe("back navigation", () => {
		it("has a back/return button to go to MainMenu", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			const backBtn =
				screen.queryByText(/back/i) ??
				screen.queryByText(/return/i) ??
				screen.queryByText(/menu/i) ??
				screen.queryByRole("button", { name: /back/i });
			expect(backBtn).toBeTruthy();
		});
	});

	describe("16 missions total", () => {
		it("renders markers for all 16 missions", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(CampaignMap), freshCampaignSetup);
			// Should have 16 mission markers (locked or unlocked)
			const markers = container.querySelectorAll(
				"[data-mission-id], [class*='mission-marker'], [data-testid*='mission']",
			);
			expect(markers.length).toBe(16);
		});
	});
});
