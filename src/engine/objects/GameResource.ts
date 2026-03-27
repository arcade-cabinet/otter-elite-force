/**
 * GameResource — LittleJS EngineObject subclass for resource entities.
 *
 * Renders distinct shapes per resource type:
 * - Tree: triangle (green)
 * - Fish: circle (blue)
 * - Salvage: diamond (orange)
 *
 * W1-04: EngineObject subclasses for units, buildings, resources.
 */

import type { Vector2 } from "littlejsengine";
import type { LjsApi } from "./GameUnit";

let _ljs: LjsApi | null = null;

export function initGameResourceLjs(ljs: LjsApi): void {
	_ljs = ljs;
}

function ljs(): LjsApi {
	if (!_ljs) throw new Error("GameResource: LittleJS API not initialized");
	return _ljs;
}

export interface GameResourceOptions {
	eid: number;
	pos: Vector2;
	resourceType: string; // "timber", "fish", "salvage", etc.
}

export function createGameResourceClass() {
	const api = ljs();

	return class GameResource extends api.EngineObject {
		eid: number;
		resourceType: string;
		remainingRatio = 1; // 0-1 for depletion visual

		constructor(options: GameResourceOptions) {
			const size = api.vec2(0.6, 0.6);
			super(options.pos, size, undefined, 0, api.WHITE, -options.pos.y);
			this.eid = options.eid;
			this.resourceType = options.resourceType;
			this.mass = 0;
			this.damping = 1;
		}

		syncFromECS(px: number, py: number, remainingRatio: number): void {
			this.pos.x = px;
			this.pos.y = py;
			this.renderOrder = -py;
			this.remainingRatio = remainingRatio;
		}

		render(): void {
			const a = ljs();

			// Scale by remaining ratio (shrinks when depleting)
			const scale = 0.3 + 0.7 * this.remainingRatio;

			switch (this.resourceType) {
				case "timber": {
					// Tree: brown trunk + large green canopy (0.6 radius)
					a.drawRect(this.pos, a.vec2(0.12 * scale, 0.5 * scale), new a.Color(0.35, 0.22, 0.1, 1));
					a.drawCircle(
						a.vec2(this.pos.x, this.pos.y + 0.2 * scale),
						0.6 * scale,
						new a.Color(0.08, 0.42, 0.12, 1),
					);
					a.drawCircle(
						a.vec2(this.pos.x - 0.1, this.pos.y + 0.3 * scale),
						0.25 * scale,
						new a.Color(0.15, 0.6, 0.2, 0.7),
					);
					break;
				}
				case "fish": {
					// Fish: larger blue circle with sparkle
					a.drawCircle(this.pos, 0.5 * scale, new a.Color(0.15, 0.4, 0.75, 0.8));
					a.drawCircle(this.pos, 0.35 * scale, new a.Color(0.2, 0.55, 0.9, 1));
					a.drawCircle(
						a.vec2(this.pos.x + 0.1, this.pos.y + 0.1),
						0.08 * scale,
						new a.Color(0.9, 0.95, 1, 0.9),
					);
					break;
				}
				case "salvage": {
					// Salvage: larger orange/brown box shape
					a.drawRect(this.pos, a.vec2(0.6 * scale, 0.5 * scale), new a.Color(0.55, 0.35, 0.1, 1));
					a.drawRect(this.pos, a.vec2(0.5 * scale, 0.4 * scale), new a.Color(0.85, 0.6, 0.2, 1));
					a.drawRect(this.pos, a.vec2(0.5 * scale, 0.06), new a.Color(0.45, 0.3, 0.08, 0.8));
					break;
				}
				default: {
					// Generic: yellow circle
					a.drawCircle(this.pos, 0.45 * scale, new a.Color(0.98, 0.8, 0.08, 1));
					break;
				}
			}
		}
	};
}

export type GameResource = InstanceType<ReturnType<typeof createGameResourceClass>>;
