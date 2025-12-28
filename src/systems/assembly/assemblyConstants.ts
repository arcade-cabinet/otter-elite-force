import type { AssemblyConfig } from "./types";

/**
 * Default configurations for various procedural assemblies
 */
export const DEFAULT_ASSEMBLY_CONFIG: AssemblyConfig = {
	hut: {
		minStilts: 4,
		maxStilts: 9,
		floorHeight: { min: 0.5, max: 2.5 },
		roomSize: { min: 2.5, max: 5 },
		roofPitch: { min: 0.3, max: 0.6 },
		wearVariation: 0.3,
	},
	village: {
		minHuts: 3,
		maxHuts: 8,
		centralFeature: "FIRE_PIT",
		hasHealer: true,
		pathDensity: 0.7,
	},
	platforms: {
		minHeight: 1.5,
		maxHeight: 4,
		sectionSize: 3,
		connectRadius: 8,
		requiresLadderAccess: true,
	},
};
