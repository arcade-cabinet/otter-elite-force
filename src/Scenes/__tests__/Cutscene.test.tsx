/**
 * Cutscene Component Tests
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../stores/gameStore";

// Mock React Three Fiber
vi.mock("@react-three/fiber", () => ({
	Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
	useFrame: vi.fn((callback) => {
		// Simulate a frame
		const mockState = {
			clock: { elapsedTime: 1.0 },
			camera: {
				position: { x: 0, y: 5, z: 20 },
				lookAt: vi.fn(),
			},
		};
		callback(mockState);
	}),
}));

// Mock drei
vi.mock("@react-three/drei", () => ({
	Environment: () => null,
	Sky: () => null,
}));

// Mock PlayerRig
vi.mock("../../Entities/PlayerRig", () => ({
	PlayerRig: () => null,
}));

describe("Cutscene", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CUTSCENE",
			selectedCharacterId: "bubbles",
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render the cutscene screen", async () => {
		const { Cutscene } = await import("../Cutscene");
		const { container } = render(<Cutscene />);

		expect(container.querySelector(".cutscene-screen")).toBeInTheDocument();
	});

	it("should display dialogue box", async () => {
		const { Cutscene } = await import("../Cutscene");
		const { container } = render(<Cutscene />);

		expect(container.querySelector(".dialogue-box")).toBeInTheDocument();
	});

	it("should show first dialogue line on render", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		expect(screen.getByText("GEN. WHISKERS")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Listen up, River-Rats! The Scale-Guard just hit our observation post at the Mouth.",
			),
		).toBeInTheDocument();
	});

	it("should show NEXT button for first dialogue lines", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		expect(screen.getByRole("button", { name: "NEXT >>" })).toBeInTheDocument();
	});

	it("should advance dialogue when clicking NEXT", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		const nextButton = screen.getByRole("button", { name: "NEXT >>" });
		fireEvent.click(nextButton);

		// Should now show SGT. BUBBLES dialogue
		expect(
			screen.getByText("They're pushing deeper into the Reach, General. The soup is getting thick."),
		).toBeInTheDocument();
	});

	it("should show BEGIN MISSION on last dialogue", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		// Click through all dialogue lines
		const nextButton = screen.getByRole("button", { name: "NEXT >>" });
		fireEvent.click(nextButton); // Line 2
		fireEvent.click(nextButton); // Line 3
		fireEvent.click(nextButton); // Line 4 (last)

		expect(screen.getByRole("button", { name: "BEGIN MISSION" })).toBeInTheDocument();
	});

	it("should transition to GAME mode on final click", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		// Click through all dialogue
		const nextButton = screen.getByRole("button", { name: "NEXT >>" });
		fireEvent.click(nextButton); // Line 2
		fireEvent.click(nextButton); // Line 3
		fireEvent.click(nextButton); // Line 4

		// Click BEGIN MISSION
		const beginButton = screen.getByRole("button", { name: "BEGIN MISSION" });
		fireEvent.click(beginButton);

		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should render Canvas component", async () => {
		const { Cutscene } = await import("../Cutscene");
		render(<Cutscene />);

		expect(screen.getByTestId("canvas")).toBeInTheDocument();
	});
});
