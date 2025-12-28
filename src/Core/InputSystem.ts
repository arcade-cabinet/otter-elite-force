/**
 * Input System
 * Handles all player input: touch joysticks, gyroscope, keyboard
 */

import nipplejs, { type JoystickManager } from "nipplejs";

export interface InputState {
	move: { x: number; y: number; active: boolean };
	look: { x: number; y: number; active: boolean };
	drag: { x: number; y: number; active: boolean };
	gyro: { x: number; y: number };
	zoom: boolean;
	jump: boolean;
	grip: boolean;
}

const INITIAL_INPUT_STATE: InputState = {
	move: { x: 0, y: 0, active: false },
	look: { x: 0, y: 0, active: false },
	drag: { x: 0, y: 0, active: false },
	gyro: { x: 0, y: 0 },
	zoom: false,
	jump: false,
	grip: false,
};

export class InputSystem {
	private state: InputState = { ...INITIAL_INPUT_STATE };

	private moveJoystick: JoystickManager | null = null;
	private lookJoystick: JoystickManager | null = null;
	private gyroEnabled = false;
	private handleDeviceOrientation: ((event: DeviceOrientationEvent) => void) | null = null;
	private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
	private handleKeyUp: ((e: KeyboardEvent) => void) | null = null;
	private handleTouchStart: ((e: TouchEvent) => void) | null = null;
	private handleTouchMove: ((e: TouchEvent) => void) | null = null;
	private handleTouchEnd: (() => void) | null = null;
	private lookZone: HTMLElement | null = null;

	/**
	 * Initialize input handlers
	 */
	init(): void {
		this.setupJoysticks();
		this.setupGyroscope();
		this.setupKeyboard();
	}

	/**
	 * Setup virtual joysticks using nipplejs
	 */
	private setupJoysticks(): void {
		// Movement joystick (left side)
		const moveZone = document.getElementById("joystick-move");
		if (!moveZone) {
			console.warn("InputSystem: joystick-move zone not found");
		} else {
			this.moveJoystick = nipplejs.create({
				zone: moveZone,
				mode: "static",
				position: { left: "80px", bottom: "80px" },
				color: "rgba(255, 170, 0, 0.5)",
				size: 120,
			});

			this.moveJoystick.on("move", (_evt, data) => {
				const force = Math.min(data.force, 2) / 2;
				const angle = data.angle.radian;
				this.state.move = {
					x: Math.cos(angle) * force,
					y: Math.sin(angle) * force,
					active: true,
				};
			});

			this.moveJoystick.on("end", () => {
				this.state.move = { x: 0, y: 0, active: false };
			});
		}

		// Touch drag for looking (right side)
		this.lookZone = document.getElementById("joystick-look"); // Reusing ID for now
		if (!this.lookZone) {
			console.warn("InputSystem: joystick-look zone not found");
		} else {
			let lastX = 0;
			let lastY = 0;

			this.handleTouchStart = (e: TouchEvent) => {
				const touch = e.touches[0];
				lastX = touch.clientX;
				lastY = touch.clientY;
				this.state.drag.active = true;
			};

			this.handleTouchMove = (e: TouchEvent) => {
				const touch = e.touches[0];
				const dx = touch.clientX - lastX;
				const dy = touch.clientY - lastY;

				this.state.drag.x = dx * 0.01;
				this.state.drag.y = dy * 0.01;

				lastX = touch.clientX;
				lastY = touch.clientY;
			};

			this.handleTouchEnd = () => {
				this.state.drag.active = false;
				this.state.drag.x = 0;
				this.state.drag.y = 0;
			};

			this.lookZone.addEventListener("touchstart", this.handleTouchStart);
			this.lookZone.addEventListener("touchmove", this.handleTouchMove);
			this.lookZone.addEventListener("touchend", this.handleTouchEnd);
		}
	}

	/**
	 * Setup gyroscope/device orientation for fine aiming
	 */
	private setupGyroscope(): void {
		if (window.DeviceOrientationEvent) {
			this.handleDeviceOrientation = (event: DeviceOrientationEvent) => {
				if (!this.gyroEnabled) return;

				// Use beta (front-to-back tilt) and gamma (left-to-right tilt)
				const beta = event.beta || 0; // -180 to 180
				const gamma = event.gamma || 0; // -90 to 90

				// Normalize to -1 to 1 range
				this.state.gyro = {
					x: Math.max(-1, Math.min(1, gamma / 45)),
					y: Math.max(-1, Math.min(1, (beta - 45) / 45)),
				};
			};
			window.addEventListener("deviceorientation", this.handleDeviceOrientation);
		}
	}

	/**
	 * Setup keyboard controls (for desktop testing)
	 */
	private setupKeyboard(): void {
		const keys: Record<string, boolean> = {};

		this.handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			keys[key] = true;
			this.updateKeyboardState(keys);

			// Toggles - use lowercase for Caps Lock compatibility
			if (e.key === " ") {
				this.state.jump = true;
			}
			if (key === "f") {
				this.state.zoom = !this.state.zoom;
			}
			if (key === "g") {
				this.state.grip = true;
			}
		};

		this.handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			keys[key] = false;
			this.updateKeyboardState(keys);
			if (e.key === " ") {
				this.state.jump = false;
			}
			if (key === "g") {
				this.state.grip = false;
			}
		};

		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
	}

	/**
	 * Update input state from keyboard
	 * Normalizes diagonal movement to prevent faster diagonal speed
	 */
	private updateKeyboardState(keys: Record<string, boolean>): void {
		// WASD movement
		let x = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
		let y = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

		// Normalize diagonal movement to prevent sqrt(2) speed boost
		if (x !== 0 && y !== 0) {
			const invLength = 1 / Math.sqrt(x * x + y * y);
			x *= invLength;
			y *= invLength;
		}

		if (x !== 0 || y !== 0) {
			this.state.move = { x, y, active: true };
		} else {
			this.state.move = { x: 0, y: 0, active: false };
		}

		// Arrow keys for looking
		const lookX = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0);
		const lookY = (keys.arrowdown ? 1 : 0) - (keys.arrowup ? 1 : 0);

		if (lookX !== 0 || lookY !== 0) {
			this.state.look = { x: lookX, y: lookY, active: true };
		} else {
			this.state.look = { x: 0, y: 0, active: false };
		}
	}

	/**
	 * Request gyroscope permission (required on iOS)
	 */
	async requestGyroPermission(): Promise<boolean> {
		if (
			typeof DeviceOrientationEvent !== "undefined" &&
			// biome-ignore lint/suspicious/noExplicitAny: Standard API doesn't include requestPermission yet
			typeof (DeviceOrientationEvent as any).requestPermission === "function"
		) {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: Standard API doesn't include requestPermission yet
				const permission = await (DeviceOrientationEvent as any).requestPermission();
				this.gyroEnabled = permission === "granted";
				return this.gyroEnabled;
			} catch (error) {
				console.error("Gyroscope permission denied:", error);
				return false;
			}
		}

		// If no permission needed, enable gyro
		this.gyroEnabled = true;
		return true;
	}

	/**
	 * Get current input state
	 */
	getState(): InputState {
		return { ...this.state };
	}

	/**
	 * Toggle zoom
	 */
	toggleZoom(): void {
		this.state.zoom = !this.state.zoom;
	}

	/**
	 * Set jump state
	 */
	setJump(active: boolean): void {
		this.state.jump = active;
	}

	/**
	 * Set grip state
	 */
	setGrip(active: boolean): void {
		this.state.grip = active;
	}

	/**
	 * Cleanup - safe to call even when not initialized
	 */
	destroy(): void {
		// Destroy joysticks (optional chaining handles null case)
		this.moveJoystick?.destroy();
		this.moveJoystick = null;
		this.lookJoystick?.destroy();
		this.lookJoystick = null;

		// Remove event listeners (guards ensure safety when not initialized)
		if (this.handleDeviceOrientation) {
			window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
			this.handleDeviceOrientation = null;
		}
		if (this.handleKeyDown) {
			window.removeEventListener("keydown", this.handleKeyDown);
			this.handleKeyDown = null;
		}
		if (this.handleKeyUp) {
			window.removeEventListener("keyup", this.handleKeyUp);
			this.handleKeyUp = null;
		}
		if (this.lookZone) {
			if (this.handleTouchStart) {
				this.lookZone.removeEventListener("touchstart", this.handleTouchStart);
				this.handleTouchStart = null;
			}
			if (this.handleTouchMove) {
				this.lookZone.removeEventListener("touchmove", this.handleTouchMove);
				this.handleTouchMove = null;
			}
			if (this.handleTouchEnd) {
				this.lookZone.removeEventListener("touchend", this.handleTouchEnd);
				this.handleTouchEnd = null;
			}
			this.lookZone = null;
		}

		// Reset input state
		this.state = { ...INITIAL_INPUT_STATE };
		this.gyroEnabled = false;
	}
}

// Singleton instance
export const inputSystem = new InputSystem();
