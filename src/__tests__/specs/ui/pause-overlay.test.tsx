/**
 * US-020: Pause Menu During Gameplay
 *
 * Tests that the pause overlay renders correctly and handles all user actions:
 * - Resume, Save Game, Settings, Quit to Menu buttons
 * - Quit confirmation flow
 * - Escape key resumes or cancels quit confirmation
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PauseOverlay } from "@/ui/hud/PauseOverlay";

afterEach(() => {
	cleanup();
});

function renderPause(overrides = {}) {
	const props = {
		onResume: vi.fn(),
		onSaveGame: vi.fn(),
		onSettings: vi.fn(),
		onQuitToMenu: vi.fn(),
		...overrides,
	};
	render(<PauseOverlay {...props} />);
	return props;
}

describe("PauseOverlay", () => {
	it("renders all four action buttons", () => {
		renderPause();
		expect(screen.getByTestId("pause-resume")).toBeDefined();
		expect(screen.getByTestId("pause-save")).toBeDefined();
		expect(screen.getByTestId("pause-settings")).toBeDefined();
		expect(screen.getByTestId("pause-quit")).toBeDefined();
	});

	it("calls onResume when Resume is clicked", () => {
		const props = renderPause();
		fireEvent.click(screen.getByTestId("pause-resume"));
		expect(props.onResume).toHaveBeenCalledOnce();
	});

	it("calls onSaveGame when Save Game is clicked", () => {
		const props = renderPause();
		fireEvent.click(screen.getByTestId("pause-save"));
		expect(props.onSaveGame).toHaveBeenCalledOnce();
	});

	it("calls onSettings when Settings is clicked", () => {
		const props = renderPause();
		fireEvent.click(screen.getByTestId("pause-settings"));
		expect(props.onSettings).toHaveBeenCalledOnce();
	});

	it("requires confirmation before quitting to menu", () => {
		const props = renderPause();
		const quitButton = screen.getByTestId("pause-quit");

		// First click shows confirmation
		fireEvent.click(quitButton);
		expect(props.onQuitToMenu).not.toHaveBeenCalled();
		expect(quitButton.textContent).toContain("Confirm Quit");

		// Second click actually quits
		fireEvent.click(quitButton);
		expect(props.onQuitToMenu).toHaveBeenCalledOnce();
	});

	it("Escape key calls onResume", () => {
		const props = renderPause();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(props.onResume).toHaveBeenCalledOnce();
	});

	it("Escape cancels quit confirmation instead of resuming", () => {
		const props = renderPause();
		// Enter quit confirmation state
		fireEvent.click(screen.getByTestId("pause-quit"));
		expect(screen.getByTestId("pause-quit").textContent).toContain("Confirm Quit");

		// Escape should cancel confirmation, not resume
		fireEvent.keyDown(window, { key: "Escape" });
		expect(props.onResume).not.toHaveBeenCalled();
		// Back to normal quit button
		expect(screen.getByTestId("pause-quit").textContent).toContain("Quit to Menu");
	});

	it("displays the pause overlay container", () => {
		renderPause();
		expect(screen.getByTestId("pause-overlay")).toBeDefined();
	});
});
