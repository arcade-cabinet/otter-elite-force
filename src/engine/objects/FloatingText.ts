/**
 * FloatingText — LittleJS EngineObject for damage/heal/resource numbers.
 *
 * Spawned at entity position, drifts upward, fades, and self-destructs.
 * Replaces the inline floating text rendering in tacticalRuntime.
 *
 * W1-08: LittleJS combat text as floating EngineObjects.
 */

import type { Vector2 } from "littlejsengine";
import type { LjsApi } from "./GameUnit";

let _ljs: LjsApi | null = null;

export function initFloatingTextLjs(ljs: LjsApi): void {
	_ljs = ljs;
}

function ljs(): LjsApi {
	if (!_ljs) throw new Error("FloatingText: LittleJS API not initialized");
	return _ljs;
}

export type FloatingTextColor = "red" | "green" | "yellow" | "white";

export interface FloatingTextOptions {
	text: string;
	pos: Vector2;
	color: FloatingTextColor;
	durationSeconds?: number;
}

const COLOR_MAP: Record<FloatingTextColor, [number, number, number]> = {
	red: [0.94, 0.27, 0.27],
	green: [0.13, 0.77, 0.37],
	yellow: [0.98, 0.8, 0.08],
	white: [1, 1, 1],
};

export function createFloatingTextClass() {
	const api = ljs();

	return class FloatingTextObj extends api.EngineObject {
		displayText: string;
		textColor: FloatingTextColor;
		durationSeconds: number;
		elapsedSeconds = 0;

		constructor(options: FloatingTextOptions) {
			super(options.pos, api.vec2(0, 0), undefined, 0, api.WHITE, 2000); // Highest renderOrder
			this.displayText = options.text;
			this.textColor = options.color;
			this.durationSeconds = options.durationSeconds ?? 0.9;
			this.mass = 0;
			this.damping = 1;
			// Upward drift velocity
			this.velocity = api.vec2(0, 1.3);
		}

		update(): void {
			super.update();
			this.elapsedSeconds += 1 / 60; // Approximate frame time
			if (this.elapsedSeconds >= this.durationSeconds) {
				this.destroy();
			}
		}

		render(): void {
			const a = ljs();
			const progress = Math.min(1, this.elapsedSeconds / this.durationSeconds);
			const alpha = 1 - progress;

			const [r, g, b] = COLOR_MAP[this.textColor];
			a.drawText(this.displayText, this.pos, 0.4, new a.Color(r, g, b, alpha));
		}
	};
}

export type FloatingTextObj = InstanceType<ReturnType<typeof createFloatingTextClass>>;
