// src/entities/terrain/tiles.ts
// Terrain tile definitions with paint rules for procedural map rendering.

import type { TerrainTileDef } from "../types";

export const TERRAIN_TILES: Record<string, TerrainTileDef> = {
	grass: {
		id: "grass",
		name: "Grass",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#14532d",
			noiseColors: ["#166534", "#15803d"],
			noiseDensity: 0.3,
		},
	},
	dirt: {
		id: "dirt",
		name: "Dirt",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#713f12",
			noiseColors: ["#854d0e", "#92400e"],
			noiseDensity: 0.25,
		},
	},
	beach: {
		id: "beach",
		name: "Beach",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#d4a574",
			noiseColors: ["#c4956a", "#b8865e"],
			noiseDensity: 0.2,
		},
	},
	mud: {
		id: "mud",
		name: "Mud",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 2,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#5c4033",
			noiseColors: ["#6b4c3b", "#4a3428"],
			noiseDensity: 0.35,
		},
	},
	water: {
		id: "water",
		name: "Water",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: Infinity,
		swimCost: 2,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#1e3a5f",
			noiseColors: ["#1e40af", "#2563eb"],
			noiseDensity: 0.4,
		},
	},
	mangrove: {
		id: "mangrove",
		name: "Mangrove",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 3,
		blocksVision: true,
		providesConcealment: true,
		paintRules: {
			baseColor: "#0f3d0f",
			noiseColors: ["#1a4a1a", "#0d2d0d"],
			noiseDensity: 0.4,
		},
	},
	toxic_sludge: {
		id: "toxic_sludge",
		name: "Toxic Sludge",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 2,
		blocksVision: false,
		providesConcealment: false,
		damagePerSecond: 5,
		paintRules: {
			baseColor: "#2d1b4e",
			noiseColors: ["#4a1d7a", "#3b0d6b"],
			noiseDensity: 0.5,
		},
	},
	bridge: {
		id: "bridge",
		name: "Bridge",
		sprite: { size: 16, frames: { idle: [[]] } },
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#8B6914",
			noiseColors: ["#7a5c12", "#6b4e10"],
			noiseDensity: 0.15,
		},
	},
};
