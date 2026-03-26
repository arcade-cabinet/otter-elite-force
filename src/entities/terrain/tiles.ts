// src/entities/terrain/tiles.ts
// Terrain tile definitions with paint rules for procedural map rendering.

import type { SPDSLSprite, TerrainTileDef } from "../types";

function filledGrid(char: string): string[][] {
	return [Array.from({ length: 16 }, () => char.repeat(16))];
}

function makeLayeredTerrainSprite(base: string, noise: string, accent?: string): SPDSLSprite {
	return {
		palette: "resource_default",
		layers: [
			{ id: "base", zIndex: 1, grid: filledGrid(base) },
			{ id: "noise", zIndex: 2, grid: filledGrid(noise), blendMode: "multiply" },
			...(accent
				? [{ id: "accent", zIndex: 3, grid: filledGrid(accent), blendMode: "screen" as const }]
				: []),
		],
		animations: {
			idle: [{}],
		},
	};
}

export const TERRAIN_TILES: Record<string, TerrainTileDef> = {
	grass: {
		id: "grass",
		name: "Grass",
		sprite: makeLayeredTerrainSprite("2", "3"),
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#14532d",
			noiseColors: ["#166534", "#15803d", "#0f4a24", "#1a6b3a", "#0d3d1c", "#22843e"],
			noiseDensity: 0.4,
		},
	},
	dirt: {
		id: "dirt",
		name: "Dirt",
		sprite: makeLayeredTerrainSprite("4", "5"),
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#713f12",
			noiseColors: ["#854d0e", "#92400e", "#5c3310", "#a0590e", "#663818"],
			noiseDensity: 0.35,
		},
	},
	beach: {
		id: "beach",
		name: "Beach",
		sprite: makeLayeredTerrainSprite("8", "9"),
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#d4a574",
			noiseColors: ["#c4956a", "#b8865e", "#dbb88a", "#aa7a52", "#e6c89e", "#9a6d48"],
			noiseDensity: 0.3,
		},
	},
	mud: {
		id: "mud",
		name: "Mud",
		sprite: makeLayeredTerrainSprite("4", "6"),
		movementCost: 2,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#5c4033",
			noiseColors: ["#6b4c3b", "#4a3428", "#3d2a1e", "#7a5845", "#503624", "#342015"],
			noiseDensity: 0.45,
		},
	},
	water: {
		id: "water",
		name: "Water",
		sprite: makeLayeredTerrainSprite("a", "b", "d"),
		movementCost: Infinity,
		swimCost: 2,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#0f2b32",
			noiseColors: ["#11525c", "#1e3a5f", "#1e40af", "#2563eb", "#0a1d22", "#164e63"],
			noiseDensity: 0.5,
		},
	},
	mangrove: {
		id: "mangrove",
		name: "Mangrove",
		sprite: makeLayeredTerrainSprite("2", "3", "5"),
		movementCost: 3,
		blocksVision: true,
		providesConcealment: true,
		paintRules: {
			baseColor: "#0f3d0f",
			noiseColors: ["#1a4a1a", "#0d2d0d", "#083008", "#245a24", "#062006", "#1a5e1a"],
			noiseDensity: 0.5,
		},
	},
	toxic_sludge: {
		id: "toxic_sludge",
		name: "Toxic Sludge",
		sprite: makeLayeredTerrainSprite("e", "f", "m"),
		movementCost: 2,
		blocksVision: false,
		providesConcealment: false,
		damagePerSecond: 5,
		paintRules: {
			baseColor: "#2d1b4e",
			noiseColors: ["#4a1d7a", "#3b0d6b", "#5a2d8a", "#220a3d", "#6b3daa"],
			noiseDensity: 0.5,
		},
	},
	bridge: {
		id: "bridge",
		name: "Bridge",
		sprite: makeLayeredTerrainSprite("4", "5", "7"),
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#8B6914",
			noiseColors: ["#7a5c12", "#6b4e10", "#a07a18", "#5a4010", "#9c7420"],
			noiseDensity: 0.25,
		},
	},
	scorched: {
		id: "scorched",
		name: "Scorched",
		sprite: makeLayeredTerrainSprite("4", "5"),
		movementCost: 1,
		blocksVision: false,
		providesConcealment: false,
		paintRules: {
			baseColor: "#281e14",
			noiseColors: ["#322316", "#2a1b10", "#3c2a1a", "#1e1408", "#463220"],
			noiseDensity: 0.45,
		},
	},
};
