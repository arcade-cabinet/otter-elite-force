/** Sprite format types for the .sprite TOML+ASCII pipeline */

/** A single animation definition */
export interface AnimationDef {
	frames: number[];
	rate: number;
}

/** Metadata block from [meta] */
export interface SpriteMeta {
	name: string;
	width: number;
	height: number;
}

/** A single frame of ASCII art */
export interface SpriteFrame {
	index: number;
	art: string[];
}

/** Full parsed sprite definition */
export interface SpriteDefinition {
	meta: SpriteMeta;
	palette: Record<string, string>;
	animations: Record<string, AnimationDef>;
	frames: SpriteFrame[];
}

/** Rectangle in an atlas */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Atlas output: pixel data + frame rects */
export interface AtlasResult {
	image: ImageData;
	frames: Record<string, Rect>;
}
