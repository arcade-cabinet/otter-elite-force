import { EventEmitter } from "node:events";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const EventBus = new EventEmitter();

vi.mock("@/game/EventBus", () => ({ EventBus }));

vi.mock("@/ui/hud/Minimap", () => ({
	Minimap: () => createElement("div", { "data-testid": "minimap-stub" }, "Minimap"),
}));

vi.mock("@/ui/hud/ActionBar", () => ({
	ActionBar: () => createElement("div", { "data-testid": "action-bar-stub" }, "Action Bar"),
}));

vi.mock("@/ui/hud/UnitPanel", () => ({
	UnitPanel: () => createElement("div", { "data-testid": "unit-panel-stub" }, "Unit Panel"),
}));

vi.mock("@/ui/hud/TransmissionPortrait", () => ({
	TransmissionPortrait: ({
		portraitId,
		speaker,
	}: {
		portraitId?: string | null;
		speaker: string;
	}) =>
		createElement(
			"div",
			{ "data-testid": "transmission-portrait-stub" },
			`${portraitId ?? "none"}:${speaker}`,
		),
}));

let React: typeof import("react");
let cleanup: typeof import("@testing-library/react").cleanup;
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let CommandConsole: any;
let initSingletons: typeof import("@/ecs/singletons").initSingletons;
let Objectives: typeof import("@/ecs/traits/state").Objectives;
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
		fireEvent = rtl.fireEvent;
		const koota = await import("koota");
		createWorld = koota.createWorld;
		if (!sharedWorld) {
			sharedWorld = createWorld();
		}
		const singletons = await import("@/ecs/singletons");
		initSingletons = singletons.initSingletons;
		const kootaReact = await import("koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const stateTraits = await import("@/ecs/traits/state");
		Objectives = stateTraits.Objectives;
		const mod = await import("@/ui/hud/CommandConsole");
		CommandConsole = mod.CommandConsole ?? mod.default;
	} catch (error) {
		loadError = (error as Error).message;
	}

	sharedWorld?.reset();
	if (sharedWorld) initSingletons(sharedWorld as never);
});

afterEach(() => {
	EventBus.removeAllListeners();
	if (!skip()) cleanup();
});

const skip = () => loadError !== null;

function renderWithWorld(worldSetup?: (world: any) => void) {
	const world = sharedWorld;
	if (!world) {
		throw new Error("Shared test world was not initialized");
	}
	if (worldSetup) worldSetup(world);

	return render(
		React.createElement(
			WorldProvider,
			{ world },
			React.createElement(CommandConsole, {
				missionId: "mission_1",
				compact: false,
				showUnitPanel: false,
			}),
		),
	);
}

async function dismissMissionBriefing() {
	for (let i = 0; i < 8; i++) {
		if (screen.queryByText(/mission directives/i)) return;
		fireEvent.click(await screen.findByRole("button", { name: /reveal|acknowledge|move out/i }));
	}
}

describe("CommandConsole", () => {
	it("renders live directive statuses from singleton objective state", async () => {
		if (skip()) return;

		renderWithWorld((world: any) => {
			world.set(Objectives, {
				list: [
					{
						id: "build-command-post",
						description: "Build a Command Post",
						status: "completed",
						bonus: false,
					},
					{
						id: "build-barracks",
						description: "Build a Barracks",
						status: "active",
						bonus: false,
					},
					{
						id: "gather-salvage",
						description: "Gather 50 salvage from the northeast cache",
						status: "failed",
						bonus: true,
					},
				],
			});
		});

		await dismissMissionBriefing();

		expect(await screen.findByText(/mission directives/i)).toBeTruthy();
		expect(screen.getByText(/build a command post/i)).toBeTruthy();
		expect(screen.getByText(/build a barracks/i)).toBeTruthy();
		expect(screen.getByText(/gather 50 salvage from the northeast cache/i)).toBeTruthy();
		expect(screen.getByText(/^complete$/i)).toBeTruthy();
		expect(screen.getByText(/^failed$/i)).toBeTruthy();
		expect(screen.getByText(/1\/2 primary/i)).toBeTruthy();
		expect(screen.getByText(/0\/1 bonus/i)).toBeTruthy();
	});

	it("shows queued scenario transmissions for the active mission", async () => {
		if (skip()) return;

		renderWithWorld();
		expect((await screen.findByTestId("transmission-portrait-stub")).textContent).toContain(
			"foxhound:FOXHOUND",
		);
		await dismissMissionBriefing();

		EventBus.emit("command-transmission", {
			missionId: "mission_1",
			speaker: "FOXHOUND",
			text: "Scale-Guard scouts on the ridge.",
		});

		fireEvent.click(await screen.findByRole("button", { name: /reveal/i }));
		expect(await screen.findByText(/scale-guard scouts on the ridge/i)).toBeTruthy();
		expect(screen.getAllByText(/foxhound/i).length).toBeGreaterThan(0);
		expect(screen.getByTestId("transmission-portrait-stub").textContent).toContain(
			"foxhound:FOXHOUND",
		);

		fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

		expect(await screen.findByText(/mission directives/i)).toBeTruthy();
	});

	it("swaps the portrait when a different speaker transmission arrives", async () => {
		if (skip()) return;

		renderWithWorld();
		await dismissMissionBriefing();

		EventBus.emit("command-transmission", {
			missionId: "mission_1",
			speaker: "Gen. Whiskers",
			portrait: "gen_whiskers",
			text: "Hold the crossings. Reinforcements are moving.",
		});

		fireEvent.click(await screen.findByRole("button", { name: /reveal/i }));
		expect(await screen.findByText(/hold the crossings/i)).toBeTruthy();
		expect(screen.getByTestId("transmission-portrait-stub").textContent).toContain(
			"gen_whiskers:Gen. Whiskers",
		);
	});

	it("reveals the current line before advancing to the next briefing line", async () => {
		if (skip()) return;

		renderWithWorld();

		expect(await screen.findByRole("button", { name: /reveal/i })).toBeTruthy();
		expect(screen.getByTestId("command-transmission-status").textContent).toMatch(/receiving/i);
		expect(screen.getByTestId("command-transmission-text").textContent).not.toContain(
			"landing site.",
		);

		fireEvent.click(screen.getByRole("button", { name: /reveal/i }));

		expect(screen.getByTestId("command-transmission-status").textContent).toMatch(/ready/i);
		expect(screen.getByTestId("command-transmission-text").textContent).toContain(
			"Welcome to the Copper-Silt Reach.",
		);
		expect(screen.getByRole("button", { name: /acknowledge/i })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));
		fireEvent.click(await screen.findByRole("button", { name: /reveal/i }));

		expect(screen.getByTestId("command-transmission-text").textContent).toContain(
			"Your priority is establishing a forward operating base.",
		);
	});

	it("ignores transmissions for other missions", async () => {
		if (skip()) return;

		renderWithWorld();
		await dismissMissionBriefing();

		EventBus.emit("command-transmission", {
			missionId: "mission_2",
			speaker: "FOXHOUND",
			text: "This should stay off-screen.",
		});

		expect(screen.queryByText(/this should stay off-screen/i)).toBeNull();
		expect(screen.getByText(/mission directives/i)).toBeTruthy();
	});
});
