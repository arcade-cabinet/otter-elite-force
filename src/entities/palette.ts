// src/entities/palette.ts
// Shared color palette for all ASCII sprite definitions.
// Single-char keys map to hex colors. '.' = transparent.
// All sprite grids use these characters exclusively.

export type PaletteKey = string;
export type Palette = Record<PaletteKey, string>;

/**
 * Master palette — every character used in any sprite grid must have
 * an entry here. Add new entries as needed but NEVER use raw hex in
 * a sprite definition.
 */
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
	g: "#22c55e", // Light Green — foliage highlights, otter skin
	W: "#78350f", // Dark Wood — tree trunks, structures
	w: "#b45309", // Light Wood — wood highlights
	Y: "#eab308", // Gold — resources, accents
	y: "#fef08a", // Light Gold — gold highlights
	C: "#4b5563", // Dark Stone — stone, metal
	c: "#9ca3af", // Light Stone — stone highlights, armor
	M: "#1f2937", // Dark Interior — building doorways, caves
	T: "#0d9488", // Teal — otter-specific accent
	t: "#5eead4", // Light Teal — otter highlights
	O: "#c2410c", // Orange — enemy accent, fire
	o: "#fb923c", // Light Orange — enemy highlights
	P: "#7e22ce", // Purple — poison, special effects
	p: "#c084fc", // Light Purple — magic/special highlights
} as const;
