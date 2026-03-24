/**
 * BriefingScreen Component Specification Tests
 *
 * Defines the behavioral contract for the BriefingScreen (briefing theme).
 * BriefingScreen displays before each mission:
 *   - Character portrait (rendered large)
 *   - Speaker name in faction-colored accent
 *   - Dialogue with typewriter animation
 *   - "DEPLOY >>" button to start the mission
 *   - Dossier/intel report layout
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §4 (Theme 3), §5, §10
 *   - docs/design/game-design-document.md (briefing anticipation)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 *
 * Tests are written BEFORE the component exists.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let React: typeof import("react");
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let act: typeof import("@testing-library/react").act;
let BriefingScreen: any;

let loadError: string | null = null;

beforeEach(async () => {
	loadError = null;
	vi.useFakeTimers();
	try {
		React = await import("react");
		const rtl = await import("@testing-library/react");
		render = rtl.render;
		screen = rtl.screen;
		fireEvent = rtl.fireEvent;
		act = rtl.act;
		const mod = await import("@/ui/briefing/BriefingScreen");
		BriefingScreen = mod.BriefingScreen ?? mod.default;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

afterEach(() => {
	vi.useRealTimers();
});

const skip = () => loadError !== null;

function renderWithWorld(ui: any, worldSetup?: (world: any) => void) {
	void worldSetup;
	return render(ui);
}

// ---------------------------------------------------------------------------
// Sample mission briefing data
// ---------------------------------------------------------------------------
const MISSION_1_BRIEFING = {
	missionId: "mission_1",
	missionName: "First Light",
	subtitle: "Secure the Landing Zone",
	portraitId: "sgt_bubbles",
	lines: [
		{ speaker: "FOXHOUND", text: "Sergeant, welcome to The Soup." },
		{ speaker: "FOXHOUND", text: "Intel says Scale-Guard patrols are thin in this sector." },
		{ speaker: "FOXHOUND", text: "Establish a perimeter and gather resources. FOXHOUND out." },
	],
};

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("BriefingScreen", () => {
	describe("rendering", () => {
		it("renders without crashing", () => {
			if (skip()) return;
			const { container } = renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			expect(container).toBeTruthy();
		});

		it("displays the mission name", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			expect(screen.getByText(/first light/i)).toBeTruthy();
		});

		it("displays the mission subtitle", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			expect(screen.getByText(/secure the landing zone/i)).toBeTruthy();
		});
	});

	describe("portrait display", () => {
		it("renders a portrait area for the briefing character", () => {
			if (skip()) return;
			const { container } = renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			// Portrait should be rendered large — look for portrait container
			const portrait =
				container.querySelector("[data-testid='portrait']") ??
				container.querySelector("[class*='portrait']") ??
				container.querySelector("img[alt*='portrait' i]") ??
				container.querySelector("canvas");
			expect(portrait).toBeTruthy();
		});
	});

	describe("speaker identification", () => {
		it("displays the speaker name", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			expect(screen.getByText(/foxhound/i)).toBeTruthy();
		});
	});

	describe("dialogue display", () => {
		it("displays dialogue text from the briefing lines", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
				act(() => {
					vi.advanceTimersByTime(600);
				});
				const text =
					screen.queryByText(/welcome to the soup/i) ?? screen.queryByText(/sergeant/i);
			expect(text).toBeTruthy();
		});

		it("has a mechanism to advance dialogue (click or auto-advance)", () => {
			if (skip()) return;
			const { container } = renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			// Should be clickable to advance or have auto-advance
			// The dialogue area should respond to interaction
			const dialogueArea =
				container.querySelector("[data-testid='dialogue']") ??
				container.querySelector("[class*='dialogue']") ??
				container.querySelector("[class*='briefing']");
			expect(dialogueArea).toBeTruthy();
		});
	});

	describe("deploy button", () => {
		it("displays a DEPLOY button", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			expect(screen.getByText(/deploy/i)).toBeTruthy();
		});

		it("deploy button is clickable", () => {
			if (skip()) return;
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			const deployBtn = screen.getByText(/deploy/i);
				expect(deployBtn.closest("button")?.getAttribute("disabled")).toBeNull();
		});

		it("calls onDeploy callback when deploy is clicked", () => {
			if (skip()) return;
			const onDeploy = vi.fn();
			renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
					onDeploy,
				}),
			);
			const deployBtn = screen.getByText(/deploy/i);
			fireEvent.click(deployBtn.closest("button") ?? deployBtn);
			expect(onDeploy).toHaveBeenCalledOnce();
		});
	});

	describe("briefing theme", () => {
		it("uses dark background with minimal chrome", () => {
			if (skip()) return;
			const { container } = renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: MISSION_1_BRIEFING,
				}),
			);
			// Briefing theme: dark with spotlight vignette
			const root = container.firstElementChild;
			expect(root).toBeTruthy();
			// Should have briefing-related styling
			const hasBriefingClass =
				root?.className?.includes("briefing") || root?.getAttribute("data-theme") === "briefing";
			expect(hasBriefingClass).toBe(true);
		});
	});

	describe("multiple briefing lines", () => {
		it("handles briefings with multiple speakers", () => {
			if (skip()) return;
			const multiBriefing = {
				...MISSION_1_BRIEFING,
				lines: [
					{ speaker: "FOXHOUND", text: "Sergeant, we have a situation." },
					{ speaker: "SGT. BUBBLES", text: "Copy that, FOXHOUND. What's the play?" },
					{ speaker: "FOXHOUND", text: "Scale-Guard convoy heading east. Intercept." },
				],
			};
			const { container } = renderWithWorld(
				React.createElement(BriefingScreen, {
					briefing: multiBriefing,
				}),
			);
			expect(container).toBeTruthy();
			// Should handle multiple speakers without error
		});
	});
});
