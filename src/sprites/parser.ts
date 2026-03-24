import { parse as parseToml } from "smol-toml";
import type { AnimationDef, SpriteDefinition, SpriteFrame, SpriteMeta } from "./types";

/**
 * Parse a .sprite file (TOML header + ASCII art grid) into a SpriteDefinition.
 *
 * Format:
 *   [meta]          — name, width, height
 *   [palette]       — char → hex color map
 *   [animations]    — name → { frames, rate }
 *   [frame.N]       — art = """ ... """ ASCII grid
 */
export function parseSpriteFile(content: string): SpriteDefinition {
	const doc = parseToml(content) as Record<string, unknown>;

	const rawMeta = doc.meta as Record<string, unknown>;
	const meta: SpriteMeta = {
		name: rawMeta.name as string,
		width: rawMeta.width as number,
		height: rawMeta.height as number,
	};

	const rawPalette = doc.palette as Record<string, string>;
	const palette: Record<string, string> = { ...rawPalette };

	const rawAnimations = doc.animations as Record<string, { frames: number[]; rate: number }>;
	const animations: Record<string, AnimationDef> = {};
	for (const [name, anim] of Object.entries(rawAnimations)) {
		animations[name] = { frames: [...anim.frames], rate: anim.rate };
	}

	// smol-toml parses [frame.0] as nested: { frame: { "0": { art: "..." } } }
	const frames: SpriteFrame[] = [];
	const frameTable = doc.frame as Record<string, { art: string }> | undefined;
	if (frameTable) {
		for (const [key, rawFrame] of Object.entries(frameTable)) {
			const index = Number(key);
			const art = parseArtBlock(rawFrame.art, meta.width, meta.height);
			frames.push({ index, art });
		}
	}

	frames.sort((a, b) => a.index - b.index);

	return { meta, palette, animations, frames };
}

/**
 * Parse a triple-quoted art block into an array of lines,
 * padded/trimmed to exactly width x height.
 */
function parseArtBlock(raw: string, width: number, height: number): string[] {
	// Split into lines, strip leading/trailing empty lines from the triple-quote block
	const allLines = raw.split("\n");

	// Remove leading empty line (artifact of """ on its own line)
	if (allLines.length > 0 && allLines[0].trim() === "") {
		allLines.shift();
	}
	// Remove trailing empty line
	if (allLines.length > 0 && allLines[allLines.length - 1].trim() === "") {
		allLines.pop();
	}

	const lines: string[] = [];
	for (let i = 0; i < height; i++) {
		const line = i < allLines.length ? allLines[i] : "";
		// Pad or truncate to exact width
		lines.push(line.padEnd(width).slice(0, width));
	}

	return lines;
}
