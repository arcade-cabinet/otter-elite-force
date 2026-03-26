import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { RuntimeHost } from "./RuntimeHost";

describe("engine/runtime/RuntimeHost", () => {
	it("mounts a direct tactical runtime host without a bridge overlay", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.getByTestId("runtime-host-container")).toBeTruthy();
		expect(screen.queryByTestId("runtime-host-bridge")).toBeNull();
		expect(screen.getByRole("button", { name: /Deselect/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /Recenter/i })).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-resources")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-weather")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-selection")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-objectives")).toBeTruthy();
		expect(screen.getByTestId("runtime-hud-alerts")).toBeTruthy();
	});

	it("renders campaign runtime summary from the shared engine descriptor", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.getByText(/Beachhead/i)).toBeTruthy();
		expect(screen.getByText(/Focus:/i)).toBeTruthy();
		expect(screen.getByText(/Runtime Boot|Runtime Active|Runtime Failed/i)).toBeTruthy();
	});

	it("renders seeded skirmish runtime summary", () => {
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
		expect(screen.getByText(/Seed:\s+silent-ember-heron/i)).toBeTruthy();
		expect(screen.getByText(/Runtime Boot|Runtime Active|Runtime Failed/i)).toBeTruthy();
	});
});
