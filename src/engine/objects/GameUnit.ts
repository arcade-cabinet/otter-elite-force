/**
 * GameUnit — LittleJS EngineObject subclass for unit entities.
 *
 * Renders the unit sprite via drawTile with tileInfo from the atlas adapter.
 * Syncs pos from bitECS Position each frame. Draws selection ring, HP bar,
 * and rank emblem as overlays.
 *
 * W1-04: EngineObject subclasses for units, buildings, resources.
 */

import type { TileInfo, Vector2 } from "littlejsengine";

/** Minimal LittleJS API surface used by GameUnit (injected to avoid top-level import). */
export interface LjsApi {
	EngineObject: typeof import("littlejsengine").EngineObject;
	vec2: typeof import("littlejsengine").vec2;
	Color: typeof import("littlejsengine").Color;
	drawTile: typeof import("littlejsengine").drawTile;
	drawRect: typeof import("littlejsengine").drawRect;
	drawCircle: typeof import("littlejsengine").drawCircle;
	drawText: typeof import("littlejsengine").drawText;
	WHITE: import("littlejsengine").Color;
	CLEAR_WHITE: import("littlejsengine").Color;
}

export interface GameUnitOptions {
	eid: number;
	pos: Vector2;
	factionId: number;
	tileInfo?: TileInfo;
	drawSize?: Vector2;
}

let _ljs: LjsApi | null = null;

/** Must be called once at runtime start to inject LittleJS API references. */
export function initGameUnitLjs(ljs: LjsApi): void {
	_ljs = ljs;
}

function ljs(): LjsApi {
	if (!_ljs) throw new Error("GameUnit: LittleJS API not initialized — call initGameUnitLjs first");
	return _ljs;
}

/**
 * Creates a GameUnit EngineObject subclass dynamically.
 * We use a factory because EngineObject must come from the runtime-loaded LittleJS module.
 */
export function createGameUnitClass() {
	const api = ljs();

	return class GameUnit extends api.EngineObject {
		eid: number;
		factionId: number;
		isSelected = false;
		hpCurrent = 0;
		hpMax = 0;
		rank = 0;
		animTileInfo: TileInfo | undefined;
		unitDrawSize: Vector2;

		constructor(options: GameUnitOptions) {
			const size = options.drawSize ?? api.vec2(1.2, 1.2);
			super(options.pos, size, options.tileInfo, 0, api.WHITE, -options.pos.y);
			this.eid = options.eid;
			this.factionId = options.factionId;
			this.unitDrawSize = size;
			this.mass = 0; // Static physics — positions driven by ECS
			this.damping = 1;
		}

		/** Called by tacticalRuntime to sync ECS state before rendering. */
		syncFromECS(
			px: number,
			py: number,
			selected: boolean,
			hpCurrent: number,
			hpMax: number,
			rank: number,
			tileInfo: TileInfo | undefined,
			drawSize: Vector2 | undefined,
		): void {
			this.pos.x = px;
			this.pos.y = py;
			this.renderOrder = -py; // Depth sort
			this.isSelected = selected;
			this.hpCurrent = hpCurrent;
			this.hpMax = hpMax;
			this.rank = rank;
			this.animTileInfo = tileInfo;
			if (drawSize) {
				this.unitDrawSize = drawSize;
			}
		}

		render(): void {
			const a = ljs();

			// Draw sprite if atlas is ready
			if (this.animTileInfo) {
				a.drawTile(this.pos, this.unitDrawSize, this.animTileInfo);
			}
			// No fallback shapes — if atlas not loaded, skip rendering

			// Selection ring — bright white ring with green glow, pulsing
			if (this.isSelected) {
				const pulseAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
				a.drawCircle(
					this.pos,
					0.5,
					new a.Color(0.2, 0.9, 0.3, 0.15 * pulseAlpha),
					0.06,
					new a.Color(1, 1, 1, pulseAlpha),
				);
				a.drawCircle(
					this.pos,
					0.53,
					new a.Color(0, 0, 0, 0),
					0.03,
					new a.Color(0.3, 1, 0.4, 0.5 * pulseAlpha),
				);
			}

			// HP bar — shown for selected OR damaged entities
			if (
				this.hpMax > 0 &&
				this.hpCurrent > 0 &&
				(this.hpCurrent < this.hpMax || this.isSelected)
			) {
				const barWidth = 0.5;
				const barHeight = 0.06;
				const barY = this.pos.y + 0.35;
				const hpRatio = this.hpCurrent / this.hpMax;

				// Background
				a.drawRect(
					a.vec2(this.pos.x, barY),
					a.vec2(barWidth, barHeight),
					new a.Color(0.2, 0.2, 0.2, 0.8),
				);

				// Fill
				const fillColor =
					hpRatio > 0.5
						? new a.Color(0.13, 0.77, 0.37, 0.9)
						: hpRatio > 0.25
							? new a.Color(0.98, 0.8, 0.08, 0.9)
							: new a.Color(0.94, 0.27, 0.27, 0.9);
				const fillWidth = barWidth * hpRatio;
				a.drawRect(
					a.vec2(this.pos.x - (barWidth - fillWidth) / 2, barY),
					a.vec2(fillWidth, barHeight),
					fillColor,
				);
			}

			// Rank emblem for veteran/elite/hero
			if (this.rank > 0) {
				const emblemY = this.pos.y + 0.4;
				const emblemX = this.pos.x + 0.25;
				if (this.rank === 1) {
					// Veteran: silver chevron
					a.drawRect(a.vec2(emblemX, emblemY), a.vec2(0.12, 0.12), new a.Color(0.75, 0.75, 0.8, 1));
				} else if (this.rank === 2) {
					// Elite: gold double-chevron
					a.drawRect(a.vec2(emblemX, emblemY), a.vec2(0.14, 0.14), new a.Color(1.0, 0.84, 0.0, 1));
				} else {
					// Hero: star emblem
					a.drawCircle(a.vec2(emblemX, emblemY), 0.08, new a.Color(1.0, 0.95, 0.3, 1));
				}
			}
		}
	};
}

export type GameUnit = InstanceType<ReturnType<typeof createGameUnitClass>>;
