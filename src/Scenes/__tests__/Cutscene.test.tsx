/**
 * Cutscene Component Tests
 *
 * Tests the Cutscene component which uses Babylon.js Engine/Scene
 * for the 3D backdrop and React Native for the dialogue UI overlay.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";

// reactylon/web is automatically replaced via moduleNameMapper in jest.config.ts
// Do NOT call jest.mock("reactylon/web") - that would auto-mock and replace Engine
// with a no-op jest.fn() that renders nothing, breaking data-testid assertions.
// Mock reactylon Scene/useScene
jest.mock("reactylon");

// Use static import (jest.mock calls are hoisted above imports, so mocks apply)
import { Cutscene } from "../Cutscene";

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

	it("should render the cutscene screen", () => {
		const { container } = render(<Cutscene />);
		expect(container).toBeDefined();
		expect(container.firstChild).not.toBeNull();
	});

	it("should show first dialogue speaker name", () => {
		render(<Cutscene />);
		expect(screen.getByText("GEN. WHISKERS")).toBeInTheDocument();
	});

	it("should show first dialogue line on render", () => {
		render(<Cutscene />);
		expect(
			screen.getByText(
				"Listen up, River-Rats! The Scale-Guard just hit our observation post at the Mouth.",
			),
		).toBeInTheDocument();
	});

	it("should show NEXT button for first dialogue lines", () => {
		render(<Cutscene />);
		expect(screen.getByText("NEXT >>")).toBeInTheDocument();
	});

	it("should advance dialogue when clicking NEXT", () => {
		render(<Cutscene />);

		const nextButton = screen.getByText("NEXT >>");
		fireEvent.click(nextButton);

		expect(
			screen.getByText(
				"They're pushing deeper into the Reach, General. The soup is getting thick.",
			),
		).toBeInTheDocument();
	});

	it("should show BEGIN MISSION on last dialogue", () => {
		render(<Cutscene />);

		// Click through to the last dialogue (4 lines total, index 0->3)
		const getNext = () => screen.queryByText("NEXT >>");
		fireEvent.click(getNext()!); // line 2
		fireEvent.click(getNext()!); // line 3
		fireEvent.click(getNext()!); // line 4

		expect(screen.getByText("BEGIN MISSION")).toBeInTheDocument();
	});

	it("should transition to GAME mode on final click", () => {
		render(<Cutscene />);

		const getNext = () => screen.queryByText("NEXT >>");
		fireEvent.click(getNext()!); // line 2
		fireEvent.click(getNext()!); // line 3
		fireEvent.click(getNext()!); // line 4

		const beginButton = screen.getByText("BEGIN MISSION");
		fireEvent.click(beginButton);

		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should render Babylon.js Engine wrapper", () => {
		render(<Cutscene />);
		// The mocked Engine renders a div with data-testid
		expect(screen.getByTestId("babylon-engine-cutscene-canvas")).toBeInTheDocument();
	});
});
