/**
 * Faction Material Palettes
 *
 * Color and material properties for each faction.
 * Used to apply consistent visual styles across all faction-specific content.
 */

/**
 * Factions that can use the same components with different materials
 */
export type Faction = "URA" | "SCALE_GUARD" | "NATIVE" | "NEUTRAL";

/**
 * Material palette for each faction
 */
export interface FactionPalette {
	/** Main structure color */
	primary: string;
	/** Accent color */
	secondary: string;
	/** Wood tone */
	wood: string;
	/** Metal/hardware */
	metal: string;
	/** Cloth/thatch */
	fabric: string;
	/** Wear/damage level 0-1 */
	wear: number;
}

/**
 * Faction color palettes
 */
export const FACTION_PALETTES: Record<Faction, FactionPalette> = {
	URA: {
		primary: "#5D4E37", // Military brown
		secondary: "#3D5C3A", // Olive green
		wood: "#8B7355", // Clean wood
		metal: "#4A4A4A", // Dark metal
		fabric: "#556B2F", // Military green
		wear: 0.1, // Well-maintained
	},
	SCALE_GUARD: {
		primary: "#2F4F4F", // Dark slate
		secondary: "#8B0000", // Dark red
		wood: "#3E2723", // Dark worn wood
		metal: "#2F2F2F", // Rusted metal
		fabric: "#4A3728", // Muddy brown
		wear: 0.4, // Battle-worn
	},
	NATIVE: {
		primary: "#D2B48C", // Tan
		secondary: "#8FBC8F", // Sage green
		wood: "#DEB887", // Natural wood
		metal: "#B8860B", // Brass/bronze
		fabric: "#F5DEB3", // Wheat/natural
		wear: 0.2, // Weathered but cared for
	},
	NEUTRAL: {
		primary: "#696969", // Gray
		secondary: "#808080", // Light gray
		wood: "#A0826D", // Neutral wood
		metal: "#505050", // Steel
		fabric: "#C0C0C0", // Silver
		wear: 0.3,
	},
};

/**
 * Get faction palette by faction type
 */
export function getFactionPalette(faction: Faction): FactionPalette {
	return FACTION_PALETTES[faction];
}

/**
 * Get all faction types
 */
export function getAllFactions(): Faction[] {
	return Object.keys(FACTION_PALETTES) as Faction[];
}
