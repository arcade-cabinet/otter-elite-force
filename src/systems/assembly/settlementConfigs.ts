import type { SettlementConfig, SettlementType } from "./types";

/**
 * Settlement configurations for different types of locations
 */
export const SETTLEMENT_CONFIGS: Record<SettlementType, SettlementConfig> = {
	NATIVE_VILLAGE: {
		type: "NATIVE_VILLAGE",
		structures: [
			{ type: "BASIC_HUT", min: 3, max: 6, required: true },
			{ type: "LONGHOUSE", min: 0, max: 1, required: false },
			{ type: "MEDICAL_POST", min: 0, max: 1, required: false },
			{ type: "DOCK_PLATFORM", min: 0, max: 2, required: false },
		],
		layout: {
			pattern: "SCATTERED",
			spacing: { min: 4, max: 8 },
			centerBuffer: 3,
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 1.2,
		},
		decorations: [
			{ type: "FIRE_PIT", density: 0.02 },
			{ type: "DRYING_RACK", density: 0.03 },
			{ type: "POTTERY", density: 0.05 },
		],
		inhabitants: [
			{ type: "VILLAGER", count: { min: 4, max: 10 } },
			{ type: "HEALER", count: { min: 0, max: 1 } },
		],
	},

	FISHING_CAMP: {
		type: "FISHING_CAMP",
		structures: [
			{ type: "BASIC_HUT", min: 2, max: 4, required: true },
			{ type: "DOCK_PLATFORM", min: 1, max: 3, required: true },
			{ type: "STORAGE_SHED", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "LINEAR",
			spacing: { min: 3, max: 5 },
			centerBuffer: 0,
			rotation: "FACING_WATER",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 1.5,
		},
		decorations: [
			{ type: "FISHING_NET", density: 0.04 },
			{ type: "FISH_BASKET", density: 0.06 },
			{ type: "BOAT", density: 0.01 },
		],
		inhabitants: [{ type: "VILLAGER", count: { min: 2, max: 6 } }],
	},

	SCALE_GUARD_OUTPOST: {
		type: "SCALE_GUARD_OUTPOST",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "BASIC_HUT", min: 2, max: 4, required: true },
			{ type: "WATCHTOWER", min: 1, max: 2, required: true },
			{ type: "AMMO_DEPOT", min: 1, max: 1, required: false },
		],
		layout: {
			pattern: "DEFENSIVE",
			spacing: { min: 5, max: 8 },
			centerBuffer: 4,
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 2,
		},
		decorations: [
			{ type: "BARRICADE", density: 0.03 },
			{ type: "SANDBAG", density: 0.04 },
			{ type: "AMMO_CRATE", density: 0.02 },
		],
		inhabitants: [{ type: "GUARD", count: { min: 4, max: 8 } }],
	},

	PRISON_COMPOUND: {
		type: "PRISON_COMPOUND",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "WATCHTOWER", min: 2, max: 4, required: true },
			{ type: "BASIC_HUT", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "CIRCULAR",
			spacing: { min: 6, max: 10 },
			centerBuffer: 8, // Large center for prison cage
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 2,
		},
		decorations: [
			{ type: "BARRICADE", density: 0.05 },
			{ type: "SPOTLIGHT", density: 0.02 },
		],
		inhabitants: [
			{ type: "GUARD", count: { min: 4, max: 8 } },
			{ type: "PRISONER", count: { min: 1, max: 3 } },
		],
	},

	SIPHON_FACILITY: {
		type: "SIPHON_FACILITY",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "STORAGE_SHED", min: 2, max: 4, required: true },
			{ type: "WATCHTOWER", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "GRID",
			spacing: { min: 6, max: 8 },
			centerBuffer: 5, // Central siphon
			rotation: "ALIGNED",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 2.5,
		},
		decorations: [
			{ type: "OIL_DRUM", density: 0.06 },
			{ type: "PIPE", density: 0.04 },
			{ type: "VALVE", density: 0.02 },
		],
		inhabitants: [{ type: "GUARD", count: { min: 3, max: 6 } }],
	},

	PLAYER_BASE: {
		type: "PLAYER_BASE",
		structures: [
			{ type: "DOCK_PLATFORM", min: 1, max: 1, required: true }, // Starting platform
		],
		layout: {
			pattern: "GRID",
			spacing: { min: 3, max: 3 },
			centerBuffer: 0,
			rotation: "ALIGNED",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 2,
		},
		decorations: [],
		inhabitants: [],
	},
};
