/**
 * Input System
 * Handles all player input: touch joysticks, gyroscope, keyboard
 */

import nipplejs, { type JoystickManager } from "nipplejs";

export interface InputState {
	move: { x: number; y: number; active: boolean };
	look: { x: number; y: number; active: boolean };
	gyro: { x: number; y: number };
	zoom: boolean;
}

export class InputSystem {
	private state: InputState = {
		move: { x: 0, y: 0, active: false },
		look: { x: 0, y: 0, active: false },
		gyro: { x: 0, y: 0 },
		zoom: false,
	};

	private moveJoystick: JoystickManager | null = null;
	private lookJoystick: JoystickManager | null = null;
	private gyroEnabled = false;
	private handleDeviceOrientation: ((event: DeviceOrientationEvent) => void) | null = null;
	private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
	private handleKeyUp: ((e: KeyboardEvent) => void) | null = null;

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
		if (moveZone) {
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

		// Look/aim joystick (right side)
		const lookZone = document.getElementById("joystick-look");
		if (lookZone) {
			this.lookJoystick = nipplejs.create({
				zone: lookZone,
				mode: "static",
				position: { right: "80px", bottom: "80px" },
				color: "rgba(255, 50, 50, 0.5)",
				size: 120,
			});

			this.lookJoystick.on("move", (_evt, data) => {
				const force = Math.min(data.force, 2) / 2;
				const angle = data.angle.radian;
				this.state.look = {
					x: Math.cos(angle) * force,
					y: Math.sin(angle) * force,
					active: true,
				};
			});

			this.lookJoystick.on("end", () => {
				this.state.look = { x: 0, y: 0, active: false };
			});
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
			keys[e.key.toLowerCase()] = true;
			this.updateKeyboardState(keys);

			// Zoom toggle
			if (e.key === " ") {
				this.state.zoom = !this.state.zoom;
			}
		};

		this.handleKeyUp = (e: KeyboardEvent) => {
			keys[e.key.toLowerCase()] = false;
			this.updateKeyboardState(keys);
		};

		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
	}

	/**
	 * Update input state from keyboard
	 */
	private updateKeyboardState(keys: Record<string, boolean>): void {
		// WASD movement
		const x = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
		const y = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

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
	 * Cleanup
	 */
	destroy(): void {
		this.moveJoystick?.destroy();
		this.lookJoystick?.destroy();

		if (this.handleDeviceOrientation) {
			window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
		}
		if (this.handleKeyDown) {
			window.removeEventListener("keydown", this.handleKeyDown);
		}
		if (this.handleKeyUp) {
			window.removeEventListener("keyup", this.handleKeyUp);
		}
	}
}

// Singleton instance
export const inputSystem = new InputSystem();
