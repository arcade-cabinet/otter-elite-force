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

	it("should handle left movement (a key)", () => {
		inputSystem.init();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
		expect(inputSystem.getState().move.x).toBeLessThan(0);
		expect(inputSystem.getState().move.active).toBe(true);
	});

	it("should handle right movement (d key)", () => {
		inputSystem.init();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
		expect(inputSystem.getState().move.x).toBeGreaterThan(0);
		expect(inputSystem.getState().move.active).toBe(true);
	});

	it("should handle backward movement (s key)", () => {
		inputSystem.init();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
		expect(inputSystem.getState().move.y).toBeGreaterThan(0);
		expect(inputSystem.getState().move.active).toBe(true);
	});

	it("should toggle zoom with f key", () => {
		inputSystem.init();
		expect(inputSystem.getState().zoom).toBe(false);
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" }));
		expect(inputSystem.getState().zoom).toBe(true);
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" }));
		expect(inputSystem.getState().zoom).toBe(false);
	});

	it("should handle jump with spacebar", () => {
		inputSystem.init();
		expect(inputSystem.getState().jump).toBe(false);
		window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
		expect(inputSystem.getState().jump).toBe(true);
		window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
		expect(inputSystem.getState().jump).toBe(false);
	});

	it("should handle grip with g key", () => {
		inputSystem.init();
		expect(inputSystem.getState().grip).toBe(false);
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
		expect(inputSystem.getState().grip).toBe(true);
		window.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
		expect(inputSystem.getState().grip).toBe(false);
	});

	it("should toggle zoom via toggleZoom method", () => {
		inputSystem.init();
		expect(inputSystem.getState().zoom).toBe(false);
		inputSystem.toggleZoom();
		expect(inputSystem.getState().zoom).toBe(true);
		inputSystem.toggleZoom();
		expect(inputSystem.getState().zoom).toBe(false);
	});

	it("should handle multiple key releases", () => {
		inputSystem.init();
		
		// Press W and D
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
		
		// Release W, D should still be active
		window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
		expect(inputSystem.getState().move.x).toBeGreaterThan(0);
		expect(inputSystem.getState().move.active).toBe(true);
		
		// Release D
		window.dispatchEvent(new KeyboardEvent("keyup", { key: "d" }));
		expect(inputSystem.getState().move.active).toBe(false);
	});
});
