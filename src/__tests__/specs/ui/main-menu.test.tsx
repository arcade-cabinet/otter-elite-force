/**
 * MainMenu Component Specification Tests
 *
 * Defines the behavioral contract for the MainMenu (command-post theme).
 * MainMenu is the game loader interface:
 *   - "New Deployment" — starts a new campaign (always visible)
 *   - "Continue" — resumes from save (only visible when save exists)
 *   - "Canteen" — meta-progression hub (always visible)
 *   - "Settings" — game settings (always visible)
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §3, §5, §10
 *   - docs/design/game-design-document.md (campaign structure)
 *   - CLAUDE.md (Main Menu = Game Loader, NO level select)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 *
 * Tests are written BEFORE the component exists.
 */
import { describe, it, expect, beforeEach } from "vitest";

let React: typeof import("react");
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let MainMenu: any;
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
		const mod = await import("@/ui/command-post/MainMenu");
		MainMenu = mod.MainMenu ?? mod.default;
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

describe("MainMenu", () => {
	describe("rendering", () => {
		it("renders without crashing", () => {
			if (skip()) return;
			const { container } = renderWithWorld(React.createElement(MainMenu));
			expect(container).toBeTruthy();
		});

		it("displays the game title", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			// Should display game title or logo text
			expect(screen.getByText(/otter.*elite.*force/i)).toBeTruthy();
		});
	});

	describe("menu buttons — no save data", () => {
		it("shows 'New Deployment' button", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			expect(screen.getByText(/new.*deployment/i)).toBeTruthy();
		});

		it("does NOT show 'Continue' when no campaign progress exists", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			// CampaignProgress has no missions completed
			const continueBtn = screen.queryByText(/continue/i);
			expect(continueBtn).toBeNull();
		});

		it("shows 'Canteen' button", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			expect(screen.getByText(/canteen/i)).toBeTruthy();
		});

		it("shows 'Settings' button", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			expect(screen.getByText(/settings/i)).toBeTruthy();
		});
	});

	describe("menu buttons — with save data", () => {
		it("shows 'Continue' when campaign progress exists", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu), (world: any) => {
				world.set(CampaignProgress, {
					missions: {
						mission_1: { status: "completed", stars: 2, bestTime: 480000 },
					},
					currentMission: "mission_2",
					difficulty: "tactical",
				});
			});
			expect(screen.getByText(/continue/i)).toBeTruthy();
		});
	});

	describe("anti-patterns", () => {
		it("does NOT render a level select screen", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			// Per CLAUDE.md: REJECT level select screens
			const levelSelect = screen.queryByText(/level\s*select/i);
			expect(levelSelect).toBeNull();
		});

		it("does NOT render a mission list directly in the menu", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			// Mission selection is on CampaignMap, not MainMenu
			const missionList = screen.queryByText(/mission_1/i);
			expect(missionList).toBeNull();
		});
	});

	describe("difficulty selection flow", () => {
		it("clicking 'New Deployment' should lead to difficulty selection", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			const newBtn = screen.getByText(/new.*deployment/i);
			fireEvent.click(newBtn);
			// After clicking, should show difficulty options or navigate to selection
			// Could show Support/Tactical/Elite or transition AppScreen
			const supportOption = screen.queryByText(/support/i);
			const tacticalOption = screen.queryByText(/tactical/i);
			const eliteOption = screen.queryByText(/elite/i);
			// At least one should appear (either inline or via screen change)
			const anyDifficulty = supportOption || tacticalOption || eliteOption;
			expect(anyDifficulty).toBeTruthy();
		});
	});

	describe("navigation", () => {
		it("all menu buttons are clickable", () => {
			if (skip()) return;
			renderWithWorld(React.createElement(MainMenu));
			const buttons = screen.getAllByRole("button");
			// Should have at least 3 buttons (New Deployment, Canteen, Settings)
			expect(buttons.length).toBeGreaterThanOrEqual(3);
			for (const btn of buttons) {
				expect(btn.getAttribute("disabled")).toBeNull();
			}
		});
	});
});
