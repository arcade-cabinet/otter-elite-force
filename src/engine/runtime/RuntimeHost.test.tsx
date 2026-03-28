import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { RuntimeHost } from "./RuntimeHost";

describe("engine/runtime/RuntimeHost", () => {
	it("mounts the canvas container and TacticalHUD overlay", () => {
		render(() => <RuntimeHost mode="campaign" missionId="mission_1" />);

		expect(screen.getByTestId("runtime-host-container")).toBeTruthy();
		expect(screen.getByTestId("tactical-hud")).toBeTruthy();
		expect(screen.getByTestId("resource-bar")).toBeTruthy();
		expect(screen.getByTestId("objectives-panel")).toBeTruthy();
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
