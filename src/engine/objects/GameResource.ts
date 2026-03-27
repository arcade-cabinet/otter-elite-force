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
					// Tree: green triangle (drawn as circle + rect combo)
					a.drawCircle(this.pos, 0.3 * scale, new a.Color(0.12, 0.5, 0.08, 1));
					a.drawRect(
						a.vec2(this.pos.x, this.pos.y - 0.15 * scale),
						a.vec2(0.08, 0.2 * scale),
						new a.Color(0.4, 0.25, 0.1, 1),
					);
					break;
				}
				case "fish": {
					// Fish: blue circle
					a.drawCircle(this.pos, 0.25 * scale, new a.Color(0.2, 0.5, 0.85, 1));
					break;
				}
				case "salvage": {
					// Salvage: orange diamond (rotated rect)
					a.drawRect(
						this.pos,
						a.vec2(0.35 * scale, 0.35 * scale),
						new a.Color(0.9, 0.6, 0.1, 1),
						Math.PI / 4,
					);
					break;
				}
				default: {
					// Generic: yellow circle
					a.drawCircle(this.pos, 0.3 * scale, new a.Color(0.98, 0.8, 0.08, 1));
					break;
				}
			}
		}
	};
}

export type GameResource = InstanceType<ReturnType<typeof createGameResourceClass>>;
