/**
 * Fog of War system — RenderTexture overlay with three states:
 *   - Unexplored: fully black (never seen)
 *   - Explored: dark tint (terrain visible, no units)
 *   - Visible: fully clear (real-time view within friendly unit vision)
 *
 * Uses a 2D boolean grid to track which tiles have been explored.
 * Each frame, clears the fog texture to unexplored/explored state,
 * then punches transparent circles for each friendly unit's vision radius.
 */

import type { World } from "koota";
import { VisionRadius } from "@/ecs/traits/combat";
import { Faction } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { CELL_SIZE } from "@/maps/constants";

/** Minimal graphics-like object used by the fog system. */
interface FogGraphics {
	setVisible(v: boolean): void;
	clear(): void;
	fillStyle(color: number, alpha: number): void;
	fillRect(x: number, y: number, w: number, h: number): void;
	destroy(): void;
}

/** Minimal render-texture-like object used by the fog system. */
interface FogRenderTexture {
	setOrigin(x: number, y: number): void;
	setDepth(d: number): void;
	fill(color: number, alpha: number): void;
	clear(): void;
	erase(obj: FogGraphics): void;
	draw(obj: FogGraphics): void;
	destroy(): void;
}

/** Scene-like object providing factory methods for fog rendering. */
export interface FogScene {
	add: {
		renderTexture(x: number, y: number, w: number, h: number): FogRenderTexture;
		graphics(): FogGraphics;
	};
}

/** Fog state for each tile */
export enum FogState {
	/** Never seen — fully black */
	Unexplored = 0,
	/** Previously seen — dark tint, shows terrain only */
	Explored = 1,
	/** Currently within friendly vision — fully visible */
	Visible = 2,
}

export class FogOfWarSystem {
	private world: World;
	private cols: number;
	private rows: number;
	private fogTexture: FogRenderTexture;
	private exploredGrid: FogState[][];
	private eraserGraphics: FogGraphics;

	/** Color for unexplored fog */
	private static readonly FOG_COLOR_UNEXPLORED = 0x000000;
	/** Alpha for unexplored fog */
	private static readonly FOG_ALPHA_UNEXPLORED = 0.95;
	/** Alpha for explored (but not currently visible) fog */
	private static readonly FOG_ALPHA_EXPLORED = 0.55;
	/** Player faction ID */
	private playerFaction: string;

	constructor(
		scene: FogScene,
		world: World,
		cols: number,
		rows: number,
		playerFaction = "ura",
	) {
		this.world = world;
		this.cols = cols;
		this.rows = rows;
		this.playerFaction = playerFaction;

		// Initialize explored grid — all tiles start unexplored
		this.exploredGrid = [];
		for (let y = 0; y < rows; y++) {
			this.exploredGrid[y] = [];
			for (let x = 0; x < cols; x++) {
				this.exploredGrid[y][x] = FogState.Unexplored;
			}
		}

		// Create a RenderTexture the size of the full map
		const mapWidth = cols * CELL_SIZE;
		const mapHeight = rows * CELL_SIZE;
		this.fogTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight);
		this.fogTexture.setOrigin(0, 0);
		// Fog renders above tilemap and units but below HUD (high depth value)
		this.fogTexture.setDepth(1000);

		// Graphics object used to draw "eraser" circles
		this.eraserGraphics = scene.add.graphics();
		this.eraserGraphics.setVisible(false);

		// Fill fog with full black initially
		this.fogTexture.fill(FogOfWarSystem.FOG_COLOR_UNEXPLORED, FogOfWarSystem.FOG_ALPHA_UNEXPLORED);
	}

	/**
	 * Update fog of war. Call once per frame from GameScene.update().
	 * Redraws the fog texture based on current friendly unit positions.
	 */
	update(): void {
		const visibleTiles = new Set<string>();

		// Gather all currently visible tiles from friendly units
		this.world.query(Position, Faction, VisionRadius).forEach((entity) => {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			const vision = entity.get(VisionRadius);

			if (!pos || !faction || !vision) return;
			if (faction.id !== this.playerFaction) return;

			const tileX = Math.floor(pos.x);
			const tileY = Math.floor(pos.y);
			const radius = vision.radius;

			// Mark tiles within vision as visible and explored
			for (let dy = -radius; dy <= radius; dy++) {
				for (let dx = -radius; dx <= radius; dx++) {
					if (dx * dx + dy * dy > radius * radius) continue;

					const tx = tileX + dx;
					const ty = tileY + dy;

					if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) continue;

					visibleTiles.add(`${tx},${ty}`);
					this.exploredGrid[ty][tx] = FogState.Explored;
				}
			}
		});

		// Redraw fog texture
		this.fogTexture.clear();

		// First pass: fill entire texture with unexplored fog
		this.fogTexture.fill(FogOfWarSystem.FOG_COLOR_UNEXPLORED, FogOfWarSystem.FOG_ALPHA_UNEXPLORED);

		// Second pass: draw explored tiles with lighter fog
		this.eraserGraphics.clear();
		this.eraserGraphics.fillStyle(
			FogOfWarSystem.FOG_COLOR_UNEXPLORED,
			FogOfWarSystem.FOG_ALPHA_EXPLORED,
		);

		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				if (this.exploredGrid[y][x] === FogState.Explored) {
					this.eraserGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
				}
			}
		}

		// Erase explored regions from the full-black fog, then draw lighter fog
		this.fogTexture.erase(this.eraserGraphics);

		// Redraw explored regions with lighter fog
		this.eraserGraphics.clear();
		this.eraserGraphics.fillStyle(
			FogOfWarSystem.FOG_COLOR_UNEXPLORED,
			FogOfWarSystem.FOG_ALPHA_EXPLORED,
		);
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				if (this.exploredGrid[y][x] === FogState.Explored && !visibleTiles.has(`${x},${y}`)) {
					this.eraserGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
				}
			}
		}
		this.fogTexture.draw(this.eraserGraphics);

		// Third pass: clear visible tiles completely (punch holes in fog)
		this.eraserGraphics.clear();
		this.eraserGraphics.fillStyle(0xffffff, 1);
		for (const key of visibleTiles) {
			const [tx, ty] = key.split(",").map(Number);
			this.eraserGraphics.fillRect(tx * CELL_SIZE, ty * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
		this.fogTexture.erase(this.eraserGraphics);
	}

	/** Get the fog state for a specific tile. */
	getFogState(tileX: number, tileY: number): FogState {
		if (tileX < 0 || tileX >= this.cols || tileY < 0 || tileY >= this.rows) {
			return FogState.Unexplored;
		}
		return this.exploredGrid[tileY][tileX];
	}

	/** Check if a tile is currently visible (within friendly unit vision). */
	isTileVisible(tileX: number, tileY: number): boolean {
		// This is a snapshot query — for real-time checks, we'd cache the
		// visible tiles set from the last update. For now, re-query.
		let visible = false;
		this.world.query(Position, Faction, VisionRadius).forEach((entity) => {
			if (visible) return;
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			const vision = entity.get(VisionRadius);
			if (!pos || !faction || !vision || faction.id !== this.playerFaction) return;

			const dx = Math.floor(pos.x) - tileX;
			const dy = Math.floor(pos.y) - tileY;
			if (dx * dx + dy * dy <= vision.radius * vision.radius) {
				visible = true;
			}
		});
		return visible;
	}

	destroy(): void {
		this.fogTexture.destroy();
		this.eraserGraphics.destroy();
	}
}
