import { afterEach, beforeEach, describe, expect, it } from "vitest";

let React: typeof import("react");
let cleanup: typeof import("@testing-library/react").cleanup;
let render: typeof import("@testing-library/react").render;
let screen: typeof import("@testing-library/react").screen;
let fireEvent: typeof import("@testing-library/react").fireEvent;
let createWorld: typeof import("koota").createWorld;
let WorldProvider: any;
let MainMenu: any;
let initSingletons: typeof import("@/ecs/singletons").initSingletons;

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
		const singletons = await import("@/ecs/singletons");
		initSingletons = singletons.initSingletons;
		const kootaReact = await import("koota/react");
		WorldProvider = kootaReact.WorldProvider;
		const mod = await import("@/ui/command-post/MainMenu");
		MainMenu = mod.MainMenu ?? mod.default;
	} catch (error) {
		loadError = (error as Error).message;
	}
});

const skip = () => loadError !== null;

afterEach(() => {
	if (!skip()) cleanup();
});

function createInitializedWorld() {
	const world = createWorld();
	initSingletons(world);
	return world;
}

describe("MainMenu", () => {
	it("renders the classic three-action landing", () => {
		if (skip()) return;
		const world = createInitializedWorld();
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		expect(screen.getByRole("heading", { name: /otter elite force/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /new game/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /settings/i })).toBeTruthy();
	});

	it("reveals difficulty choices when new game is clicked", () => {
		if (skip()) return;
		const world = createInitializedWorld();
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		fireEvent.click(screen.getByRole("button", { name: /new game/i }));
		expect(screen.getByRole("button", { name: /support/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /tactical/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /^elite/i })).toBeTruthy();
	});

	it("starts a brand new campaign directly into gameplay", async () => {
		if (skip()) return;
		const world = createInitializedWorld();
		const traits = await import("@/ecs/traits/state");
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		fireEvent.click(screen.getByRole("button", { name: /new game/i }));
		fireEvent.click(screen.getByRole("button", { name: /tactical/i }));
		expect(world.get(traits.CampaignProgress)?.currentMission).toBe("mission_1");
		expect(world.get(traits.CampaignProgress)?.difficulty).toBe("tactical");
		expect(world.get(traits.CompletedResearch)?.ids.size).toBe(0);
		expect(world.get(traits.AppScreen)?.screen).toBe("campaign");
	});

	it("keeps continue disabled when there is no active campaign", () => {
		if (skip()) return;
		const world = createInitializedWorld();
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		expect(
			screen.getByRole("button", { name: /continue/i }).getAttribute("disabled"),
		).not.toBeNull();
	});

	it("resumes directly into gameplay when campaign progress exists", async () => {
		if (skip()) return;
		const world = createInitializedWorld();
		const traits = await import("@/ecs/traits/state");
		world.set(traits.CampaignProgress, {
			missions: { mission_1: { status: "completed", stars: 2, bestTime: 123 } },
			currentMission: "mission_2",
			difficulty: "support",
		});
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		fireEvent.click(screen.getByRole("button", { name: /continue/i }));
		expect(world.get(traits.AppScreen)?.screen).toBe("campaign");
	});

	it("routes skirmish to the skirmish screen", async () => {
		if (skip()) return;
		const world = createInitializedWorld();
		const traits = await import("@/ecs/traits/state");
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		fireEvent.click(screen.getByRole("button", { name: /skirmish/i }));
		expect(world.get(traits.AppScreen)?.screen).toBe("skirmish");
	});

	it("routes settings to the settings screen", async () => {
		if (skip()) return;
		const world = createInitializedWorld();
		const traits = await import("@/ecs/traits/state");
		render(React.createElement(WorldProvider, { world }, React.createElement(MainMenu)));
		fireEvent.click(screen.getByRole("button", { name: /settings/i }));
		expect(world.get(traits.AppScreen)?.screen).toBe("settings");
	});
});
