/**
 * GameBuilding — LittleJS EngineObject subclass for building entities.
 *
 * Renders as a faction-colored rectangle with outline, selection ring,
 * HP bar, and construction progress bar. Larger size than units.
 *
 * W1-04: EngineObject subclasses for units, buildings, resources.
 */

import type { Vector2 } from "littlejsengine";
import type { LjsApi } from "./GameUnit";

let _ljs: LjsApi | null = null;

export function initGameBuildingLjs(ljs: LjsApi): void {
	_ljs = ljs;
}

function ljs(): LjsApi {
	if (!_ljs) throw new Error("GameBuilding: LittleJS API not initialized");
	return _ljs;
}

export interface GameBuildingOptions {
	eid: number;
	pos: Vector2;
	factionId: number;
}

export function createGameBuildingClass() {
	const api = ljs();

	return class GameBuilding extends api.EngineObject {
		eid: number;
		factionId: number;
		isSelected = false;
		hpCurrent = 0;
		hpMax = 0;
		constructionProgress = -1; // -1 = complete, 0-1 = under construction
		label = "";

		constructor(options: GameBuildingOptions) {
			const size = api.vec2(0.8, 0.8);
			super(options.pos, size, undefined, 0, api.WHITE, -options.pos.y);
			this.eid = options.eid;
			this.factionId = options.factionId;
			this.mass = 0;
			this.damping = 1;
		}

		syncFromECS(
			px: number,
			py: number,
			selected: boolean,
			hpCurrent: number,
			hpMax: number,
			constructionProgress: number,
			label: string,
		): void {
			this.pos.x = px;
			this.pos.y = py;
			this.renderOrder = -py;
			this.isSelected = selected;
			this.hpCurrent = hpCurrent;
			this.hpMax = hpMax;
			this.constructionProgress = constructionProgress;
			this.label = label;
		}

		render(): void {
			const a = ljs();

			// Faction color
			const entityColor =
				this.factionId === 1
					? new a.Color(0.13, 0.77, 0.37, 1)
					: this.factionId === 2
						? new a.Color(0.94, 0.27, 0.27, 1)
						: new a.Color(0.8, 0.84, 0.88, 1);

			// Construction opacity
			const alpha = this.constructionProgress >= 0 ? 0.4 + 0.6 * this.constructionProgress : 1;
			const drawColor = new a.Color(entityColor.r, entityColor.g, entityColor.b, alpha);

			// Building body
			a.drawRect(this.pos, a.vec2(0.75, 0.75), drawColor);

			// Outline
			const outlineColor =
				this.factionId === 1
					? new a.Color(0.97, 0.98, 0.99, alpha * 0.5)
					: new a.Color(0.27, 0.04, 0.04, alpha * 0.5);
			a.drawRect(this.pos, a.vec2(0.8, 0.8), outlineColor);

			// Building label
			if (this.label) {
				a.drawText(
					this.label,
					a.vec2(this.pos.x, this.pos.y - 0.5),
					0.2,
					new a.Color(1, 1, 1, 0.8),
				);
			}

			// Selection ring
			if (this.isSelected) {
				a.drawCircle(this.pos, 0.55, new a.Color(1, 1, 1, 0));
				a.drawCircle(this.pos, 0.52, new a.Color(1, 1, 1, 0.6));
			}

			// Construction progress bar
			if (this.constructionProgress >= 0 && this.constructionProgress < 1) {
				const barWidth = 0.8;
				const barHeight = 0.07;
				const barY = this.pos.y + 0.55;
				// Background
				a.drawRect(
					a.vec2(this.pos.x, barY),
					a.vec2(barWidth, barHeight),
					new a.Color(0.2, 0.2, 0.2, 0.8),
				);
				// Fill (blue for construction)
				const fillWidth = barWidth * this.constructionProgress;
				a.drawRect(
					a.vec2(this.pos.x - (barWidth - fillWidth) / 2, barY),
					a.vec2(fillWidth, barHeight),
					new a.Color(0.3, 0.6, 0.95, 0.9),
				);
			}

			// HP bar for damaged buildings
			if (
				this.hpMax > 0 &&
				this.hpCurrent < this.hpMax &&
				this.hpCurrent > 0 &&
				this.constructionProgress < 0
			) {
				const barWidth = 0.8;
				const barHeight = 0.06;
				const barY = this.pos.y + 0.5;
				const hpRatio = this.hpCurrent / this.hpMax;

				a.drawRect(
					a.vec2(this.pos.x, barY),
					a.vec2(barWidth, barHeight),
					new a.Color(0.2, 0.2, 0.2, 0.8),
				);
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
		}
	};
}

export type GameBuilding = InstanceType<ReturnType<typeof createGameBuildingClass>>;
