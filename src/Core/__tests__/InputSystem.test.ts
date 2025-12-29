
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputSystem } from "../InputSystem";

// Mock nipplejs
vi.mock("nipplejs", () => ({
	default: {
		create: vi.fn(() => ({
			on: vi.fn(),
			destroy: vi.fn(),
		})),
	},
}));

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

    // New tests to cover gaps

    it("should handle arrow keys for looking", () => {
        inputSystem.init();

        // Right arrow
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        expect(inputSystem.getState().look.x).toBe(1);
        expect(inputSystem.getState().look.active).toBe(true);

        // Up arrow
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
        expect(inputSystem.getState().look.y).toBe(-1);

        // Release
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight" }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowUp" }));
        expect(inputSystem.getState().look.active).toBe(false);
    });

    it("should set jump state via method", () => {
        inputSystem.init();
        inputSystem.setJump(true);
        expect(inputSystem.getState().jump).toBe(true);
    });

    it("should set grip state via method", () => {
        inputSystem.init();
        inputSystem.setGrip(true);
        expect(inputSystem.getState().grip).toBe(true);
    });

    it("should request gyro permission if needed", async () => {
        // Mock DeviceOrientationEvent
        (window as any).DeviceOrientationEvent = {
            requestPermission: vi.fn().mockResolvedValue("granted")
        };

        const result = await inputSystem.requestGyroPermission();
        expect(result).toBe(true);
        expect((window as any).DeviceOrientationEvent.requestPermission).toHaveBeenCalled();
    });

    it("should handle gyro permission denial", async () => {
        // Mock DeviceOrientationEvent
        (window as any).DeviceOrientationEvent = {
            requestPermission: vi.fn().mockRejectedValue("denied")
        };

        const result = await inputSystem.requestGyroPermission();
        expect(result).toBe(false);
    });

    it("should enable gyro directly if no permission needed", async () => {
        // Mock DeviceOrientationEvent without requestPermission
        (window as any).DeviceOrientationEvent = {};

        const result = await inputSystem.requestGyroPermission();
        expect(result).toBe(true);
    });

    it("should handle device orientation events", async () => {
        inputSystem.init();
        await inputSystem.requestGyroPermission(); // Enable gyro

        // Trigger device orientation
        const event = new Event("deviceorientation");
        (event as any).beta = 90; // Tilted forward 45 deg relative to 45 base
        (event as any).gamma = 45; // Tilted right 45 deg

        window.dispatchEvent(event);

        // logic:
        // x = gamma / 45 = 45/45 = 1
        // y = (beta - 45) / 45 = (90-45)/45 = 1

        expect(inputSystem.getState().gyro.x).toBeCloseTo(1);
        expect(inputSystem.getState().gyro.y).toBeCloseTo(1);
    });

    it("should handle touch drag for looking", () => {
        inputSystem.init();
        const lookZone = document.getElementById("joystick-look");

        // Touch start
        const touchStart = new Event("touchstart");
        (touchStart as any).touches = [{ clientX: 100, clientY: 100 }];
        lookZone?.dispatchEvent(touchStart);

        expect(inputSystem.getState().drag.active).toBe(true);

        // Touch move
        const touchMove = new Event("touchmove");
        (touchMove as any).touches = [{ clientX: 150, clientY: 150 }]; // Moved 50, 50
        lookZone?.dispatchEvent(touchMove);

        // dx = 50, dy = 50
        // state.x = dx * 0.01 = 0.5
        expect(inputSystem.getState().drag.x).toBe(0.5);

        // Touch end
        const touchEnd = new Event("touchend");
        lookZone?.dispatchEvent(touchEnd);

        expect(inputSystem.getState().drag.active).toBe(false);
    });
});
