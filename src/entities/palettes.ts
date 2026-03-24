// src/entities/palettes.ts
// SP-DSL palette system — numeric-index palettes for layered sprite composition.
//
// Each palette maps single-char numeric indices to hex colors:
//   '0' = transparent (always)
//   '1' = outline / darkest tone (always #000000)
//   '2'–'9' = palette-specific colors
//
// CRITICAL: Otters are BROWN (#5C4033 dark / #8B7355 light). Teal is UI accent only.

// ─── Types ───

/** Single-char numeric key ('0'–'9') → hex color or "transparent". */
export type PaletteMap = Record<string, string>;

/** Named palette collection. */
export type PaletteRecord = Record<string, PaletteMap>;

// ─── Palettes ───

export const PALETTES: PaletteRecord = {
	// URA (Otter) default — brown fur, blue uniform
	otter_default: {
		"0": "transparent",
		"1": "#000000", // Outline / darkest shadow
		"2": "#5C4033", // Fur dark (brown)
		"3": "#8B7355", // Fur light (tan brown)
		"4": "#1e3a8a", // Uniform dark (navy blue)
		"5": "#3b82f6", // Uniform light (blue)
		"6": "#78350f", // Wood / gear dark
		"7": "#b45309", // Wood / gear light
		"8": "#4b5563", // Stone / metal dark
		"9": "#9ca3af", // Stone / metal light
	},

	// Scale-Guard (Croc/Reptile) default — green skin, red uniform
	croc_default: {
		"0": "transparent",
		"1": "#000000", // Outline / darkest shadow
		"2": "#166534", // Skin dark (deep green)
		"3": "#22c55e", // Skin light (bright green)
		"4": "#7f1d1d", // Uniform dark (dark red)
		"5": "#ef4444", // Uniform light (red)
		"6": "#78350f", // Wood / gear dark
		"7": "#b45309", // Wood / gear light
		"8": "#4b5563", // Stone / metal dark
		"9": "#9ca3af", // Stone / metal light
	},
} as const;

// ─── Legacy PALETTE (backward compatibility) ───
// The old single-char palette used by existing SpriteDef grids.
// Imported by renderer.ts and existing entity definitions.
// Will be removed once all entities migrate to SP-DSL layers.

export type PaletteKey = string;
export type Palette = Record<PaletteKey, string>;

export const PALETTE: Palette = {
	".": "transparent",
	"#": "#000000", // Black — outlines, shadows
	S: "#ffcc99", // Skin Light — otter faces, hands
	s: "#eebb88", // Skin Dark — otter shadow/detail
	B: "#1e3a8a", // Blue Primary — URA uniforms
	b: "#3b82f6", // Blue Secondary — URA highlights
	R: "#7f1d1d", // Red Primary — Scale-Guard base
	r: "#ef4444", // Red Secondary — Scale-Guard highlights
	G: "#166534", // Dark Green — jungle, leaves
	g: "#22c55e", // Light Green — foliage highlights
	W: "#78350f", // Dark Wood — tree trunks, structures
	w: "#b45309", // Light Wood — wood highlights
	Y: "#eab308", // Gold — resources, accents
	y: "#fef08a", // Light Gold — gold highlights
	C: "#4b5563", // Dark Stone — stone, metal
	c: "#9ca3af", // Light Stone — stone highlights, armor
	M: "#1f2937", // Dark Interior — building doorways, caves
	T: "#0d9488", // Teal — UI accent (NOT otter skin)
	t: "#5eead4", // Light Teal — UI accent highlights
	O: "#c2410c", // Orange — enemy accent, fire
	o: "#fb923c", // Light Orange — enemy highlights
	P: "#7e22ce", // Purple — poison, special effects
	p: "#c084fc", // Light Purple — magic/special highlights
	F: "#5C4033", // Fur Dark — otter brown (SP-DSL bridge)
	f: "#8B7355", // Fur Light — otter tan (SP-DSL bridge)
} as const;
