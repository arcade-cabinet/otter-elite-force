import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputSystem } from "./InputSystem";

describe("InputSystem", () => {
	let inputSystem: InputSystem;

	beforeEach(() => {
		// Mock DOM
		document.body.innerHTML = `
      <div id="joystick-move"></div>
      <div id="joystick-look"></div>
    `;
		vi.clearAllMocks();
		inputSystem = new InputSystem();
	});

	it("should initialize and destroy correctly", () => {
		inputSystem.init();
		expect(inputSystem.getState().move.active).toBe(false);
		inputSystem.destroy();
	});

	it("should handle keyboard input", () => {
		inputSystem.init();

		// Simulate keydown
		const event = new KeyboardEvent("keydown", { key: "w" });
		window.dispatchEvent(event);

		expect(inputSystem.getState().move.y).toBeLessThan(0);
		expect(inputSystem.getState().move.active).toBe(true);

		// Simulate keyup
		const upEvent = new KeyboardEvent("keyup", { key: "w" });
		window.dispatchEvent(upEvent);

		expect(inputSystem.getState().move.active).toBe(false);
	});

	it("should normalize diagonal keyboard movement", () => {
		inputSystem.init();

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));

		const state = inputSystem.getState();
		const length = Math.sqrt(state.move.x * state.move.x + state.move.y * state.move.y);

		expect(length).toBeCloseTo(1);
	});

	it("should handle Caps Lock by normalizing keys", () => {
		inputSystem.init();

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "W" }));
		expect(inputSystem.getState().move.y).toBeLessThan(0);

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "F" }));
		expect(inputSystem.getState().zoom).toBe(true);
	});
});
