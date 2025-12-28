/**
 * Input System
 * Handles all player input using strata VirtualJoystick for touch controls,
 * plus keyboard and gyroscope support.
 *
 * Integrates with @strata-game-library/core VirtualJoystick component.
 */

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

/**
 * Input System that manages game input state.
 *
 * Touch joystick controls are handled by strata VirtualJoystick components
 * rendered in the HUD. This class provides:
 * - State management for all input types
 * - Keyboard controls (WASD + arrows)
 * - Gyroscope integration
 * - Callbacks for strata VirtualJoystick integration
 */
export class InputSystem {
	private state: InputState = { ...INITIAL_INPUT_STATE };
	private gyroEnabled = false;
	private handleDeviceOrientation: ((event: DeviceOrientationEvent) => void) | null = null;
	private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
	private handleKeyUp: ((e: KeyboardEvent) => void) | null = null;
	private keys: Record<string, boolean> = {};

	/**
	 * Initialize input handlers (keyboard and gyroscope only).
	 * Touch joysticks are handled by strata VirtualJoystick components.
	 */
	init(): void {
		this.setupGyroscope();
		this.setupKeyboard();
	}

	/**
	 * Callback for strata VirtualJoystick move events.
	 * Call this from the onMove prop of the movement joystick.
	 */
	onMoveJoystick = (x: number, y: number): void => {
		if (x === 0 && y === 0) {
			this.state.move = { x: 0, y: 0, active: false };
		} else {
			this.state.move = { x, y: -y, active: true }; // Invert Y for world space
		}
	};

	/**
	 * Callback for movement joystick start.
	 */
	onMoveStart = (): void => {
		this.state.move.active = true;
	};

	/**
	 * Callback for movement joystick end.
	 */
	onMoveEnd = (): void => {
		this.state.move = { x: 0, y: 0, active: false };
	};

	/**
	 * Callback for strata VirtualJoystick look events.
	 * Call this from the onMove prop of the look/aim joystick.
	 */
	onLookJoystick = (x: number, y: number): void => {
		if (x === 0 && y === 0) {
			this.state.look = { x: 0, y: 0, active: false };
		} else {
			this.state.look = { x, y, active: true };
		}
	};

	/**
	 * Callback for look joystick start.
	 */
	onLookStart = (): void => {
		this.state.look.active = true;
	};

	/**
	 * Callback for look joystick end.
	 */
	onLookEnd = (): void => {
		this.state.look = { x: 0, y: 0, active: false };
	};

	/**
	 * Handle drag input for aiming (used when not using joystick for look).
	 */
	onDrag = (deltaX: number, deltaY: number): void => {
		this.state.drag = { x: deltaX, y: deltaY, active: true };
	};

	/**
	 * End drag input.
	 */
	onDragEnd = (): void => {
		this.state.drag = { x: 0, y: 0, active: false };
	};

	/**
	 * Setup gyroscope/device orientation for fine aiming.
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
	 * Setup keyboard controls (for desktop testing).
	 */
	private setupKeyboard(): void {
		this.handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			this.keys[key] = true;
			this.updateKeyboardState();

			// Toggles
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
			this.keys[key] = false;
			this.updateKeyboardState();
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
	 * Update input state from keyboard.
	 * Normalizes diagonal movement to prevent faster diagonal speed.
	 */
	private updateKeyboardState(): void {
		// WASD movement
		let x = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
		let y = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);

		// Normalize diagonal movement to prevent sqrt(2) speed boost
		if (x !== 0 && y !== 0) {
			const invLength = 1 / Math.sqrt(x * x + y * y);
			x *= invLength;
			y *= invLength;
		}

		if (x !== 0 || y !== 0) {
			this.state.move = { x, y, active: true };
		} else if (!this.state.move.active) {
			// Only reset if joystick isn't active
			this.state.move = { x: 0, y: 0, active: false };
		}

		// Arrow keys for looking
		const lookX = (this.keys.arrowright ? 1 : 0) - (this.keys.arrowleft ? 1 : 0);
		const lookY = (this.keys.arrowdown ? 1 : 0) - (this.keys.arrowup ? 1 : 0);

		if (lookX !== 0 || lookY !== 0) {
			this.state.look = { x: lookX, y: lookY, active: true };
		} else if (!this.state.look.active) {
			// Only reset if joystick isn't active
			this.state.look = { x: 0, y: 0, active: false };
		}
	}

	/**
	 * Request gyroscope permission (required on iOS).
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
	 * Get current input state.
	 */
	getState(): InputState {
		return { ...this.state };
	}

	/**
	 * Toggle zoom.
	 */
	toggleZoom(): void {
		this.state.zoom = !this.state.zoom;
	}

	/**
	 * Set jump state.
	 */
	setJump(active: boolean): void {
		this.state.jump = active;
	}

	/**
	 * Set grip state.
	 */
	setGrip(active: boolean): void {
		this.state.grip = active;
	}

	/**
	 * Cleanup - safe to call even when not initialized.
	 */
	destroy(): void {
		// Remove event listeners
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

		// Reset state
		this.state = { ...INITIAL_INPUT_STATE };
		this.keys = {};
		this.gyroEnabled = false;
	}
}

// Singleton instance
export const inputSystem = new InputSystem();
