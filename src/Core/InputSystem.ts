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

export class InputSystem {
	private state: InputState = {
		move: { x: 0, y: 0, active: false },
		look: { x: 0, y: 0, active: false },
		drag: { x: 0, y: 0, active: false },
		gyro: { x: 0, y: 0 },
		zoom: false,
		jump: false,
		grip: false,
	};

	private initialized = false;
	private moveJoystick: JoystickManager | null = null;
	private gyroEnabled = false;
	private keys: Record<string, boolean> = {};

	// Cached DOM elements for robust cleanup
	private moveZone: HTMLElement | null = null;
	private lookZone: HTMLElement | null = null;

	// Event handler references for removal
	private handleDeviceOrientation: ((event: DeviceOrientationEvent) => void) | null = null;
	private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
	private handleKeyUp: ((e: KeyboardEvent) => void) | null = null;
	private handleTouchStart: ((e: TouchEvent) => void) | null = null;
	private handleTouchMove: ((e: TouchEvent) => void) | null = null;
	private handleTouchEnd: (() => void) | null = null;

	/**
	 * Initialize input handlers
	 */
	init(): void {
		if (this.initialized) return;
		this.setupJoysticks();
		this.setupGyroscope();
		this.setupKeyboard();
		this.initialized = true;
	}

	/**
	 * Setup virtual joysticks using nipplejs
	 */
	private setupJoysticks(): void {
		// Movement joystick (left side)
		this.moveZone = document.getElementById("joystick-move");
		if (this.moveZone) {
			this.moveJoystick = nipplejs.create({
				zone: this.moveZone,
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
		} else {
			console.warn("InputSystem: #joystick-move not found in DOM");
		}

		// Touch drag for looking (right side)
		this.lookZone = document.getElementById("joystick-look");
		if (this.lookZone) {
			let lastX = 0;
			let lastY = 0;

			this.handleTouchStart = (e: TouchEvent) => {
				if ((e.target as HTMLElement).tagName === "BUTTON") return;
				if (e.cancelable) e.preventDefault();
				const touch = e.touches[0];
				lastX = touch.clientX;
				lastY = touch.clientY;
				this.state.drag.active = true;
			};

			this.handleTouchMove = (e: TouchEvent) => {
				if (this.state.drag.active && e.cancelable) e.preventDefault();
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

			this.lookZone.addEventListener("touchstart", this.handleTouchStart, { passive: false });
			this.lookZone.addEventListener("touchmove", this.handleTouchMove, { passive: false });
			this.lookZone.addEventListener("touchend", this.handleTouchEnd);
		} else {
			console.warn("InputSystem: #joystick-look not found in DOM");
		}
	}

	/**
	 * Setup gyroscope/device orientation
	 */
	private setupGyroscope(): void {
		if (window.DeviceOrientationEvent) {
			this.handleDeviceOrientation = (event: DeviceOrientationEvent) => {
				if (!this.gyroEnabled) return;
				const beta = event.beta || 0;
				const gamma = event.gamma || 0;
				this.state.gyro = {
					x: Math.max(-1, Math.min(1, gamma / 45)),
					y: Math.max(-1, Math.min(1, (beta - 45) / 45)),
				};
			};
			window.addEventListener("deviceorientation", this.handleDeviceOrientation);
		}
	}

	/**
	 * Setup keyboard controls
	 */
	private setupKeyboard(): void {
		this.handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			this.keys[key] = true;
			this.updateKeyboardState();

			if (key === " ") this.state.jump = true;
			if (key === "f") this.state.zoom = !this.state.zoom;
			if (key === "g") this.state.grip = true;
		};

		this.handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			this.keys[key] = false;
			this.updateKeyboardState();

			if (key === " ") this.state.jump = false;
			if (key === "g") this.state.grip = false;
		};

		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
	}

	/**
	 * Update input state from keyboard with normalized movement
	 */
	private updateKeyboardState(): void {
		// WASD movement
		let x = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
		let y = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);

		// Normalize diagonal movement
		if (x !== 0 && y !== 0) {
			const length = Math.sqrt(x * x + y * y);
			x /= length;
			y /= length;
		}

		if (x !== 0 || y !== 0) {
			this.state.move = { x, y, active: true };
		} else {
			this.state.move = { x: 0, y: 0, active: false };
		}

		// Arrow keys for looking
		const lookX = (this.keys.arrowright ? 1 : 0) - (this.keys.arrowleft ? 1 : 0);
		const lookY = (this.keys.arrowdown ? 1 : 0) - (this.keys.arrowup ? 1 : 0);

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
		const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
			requestPermission?: () => Promise<"granted" | "denied">;
		};

		if (typeof DeviceOrientationEventAny.requestPermission === "function") {
			try {
				const permission = await DeviceOrientationEventAny.requestPermission();
				this.gyroEnabled = permission === "granted";
				return this.gyroEnabled;
			} catch (error) {
				console.error("Gyroscope permission denied:", error);
				return false;
			}
		}

		this.gyroEnabled = true;
		return true;
	}

	getState(): InputState {
		return { ...this.state };
	}

	toggleZoom(): void {
		this.state.zoom = !this.state.zoom;
	}

	setJump(active: boolean): void {
		this.state.jump = active;
	}

	setGrip(active: boolean): void {
		this.state.grip = active;
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.moveJoystick?.destroy();
		this.moveJoystick = null;

		if (this.handleDeviceOrientation) {
			window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
		}
		if (this.handleKeyDown) {
			window.removeEventListener("keydown", this.handleKeyDown);
		}
		if (this.handleKeyUp) {
			window.removeEventListener("keyup", this.handleKeyUp);
		}

		if (this.lookZone) {
			if (this.handleTouchStart) this.lookZone.removeEventListener("touchstart", this.handleTouchStart);
			if (this.handleTouchMove) this.lookZone.removeEventListener("touchmove", this.handleTouchMove);
			if (this.handleTouchEnd) this.lookZone.removeEventListener("touchend", this.handleTouchEnd);
		}

		this.initialized = false;
	}
}

// Singleton instance
export const inputSystem = new InputSystem();
