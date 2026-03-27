import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { RuntimeHost } from "./RuntimeHost";

describe("engine/runtime/RuntimeHost", () => {
	it("mounts a direct tactical runtime host with game HUD elements", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.getByTestId("runtime-host-container")).toBeTruthy();
		expect(screen.queryByTestId("runtime-host-bridge")).toBeNull();
		expect(screen.getByTestId("runtime-btn-recenter")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-resources")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-objectives")).toBeTruthy();
		// Alerts panel only renders when alerts exist (initially hidden)
		expect(screen.queryByTestId("runtime-hud-alerts")).toBeNull();
	});

	it("renders campaign mission title from the shared engine descriptor", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.getByText(/Beachhead/i)).toBeTruthy();
	});

	it("renders seeded skirmish mission title", () => {
		render(() => (
			<RuntimeHost
				mode="skirmish"
				skirmish={{
					mapId: "sk_river_crossing",
					mapName: "River Crossing",
					difficulty: "medium",
					playAsScaleGuard: false,
					preset: "meso",
					seed: {
						phrase: "silent-ember-heron",
						source: "skirmish",
						numericSeed: 10,
						designSeed: 20,
						gameplaySeeds: { loot: 1, waves: 2 },
					},
					startingResources: { fish: 300, timber: 200, salvage: 100 },
				}}
			/>
		));

		expect(screen.getByText(/River Crossing/i)).toBeTruthy();
	});

	it("does not show debug info (seeds, run IDs, map stats)", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.queryByText(/Seed:/i)).toBeNull();
		expect(screen.queryByText(/Design:/i)).toBeNull();
		expect(screen.queryByText(/Gameplay Streams:/i)).toBeNull();
		expect(screen.queryByText(/Focus:/i)).toBeNull();
		expect(screen.queryByText(/Chokepoints:/i)).toBeNull();
	});

	it("does not render a weather panel or Deselect button", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.queryByTestId("runtime-hud-weather")).toBeNull();
		expect(screen.queryByRole("button", { name: /Deselect/i })).toBeNull();
	});
});
