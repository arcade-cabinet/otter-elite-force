import { describe, expect, it } from "vitest";
import { parseSpriteFile } from "@/sprites/parser";

const MINIMAL_SPRITE = `
[meta]
name = "test-unit"
width = 4
height = 4

[palette]
"#" = "#8B6914"
"@" = "#6B4912"
"." = "#FFFFFF"

[animations]
idle = { frames = [0], rate = 1 }

[frame.0]
art = """
 ##
#@@#
#..#
 ##
"""
`;

const MULTI_FRAME_SPRITE = `
[meta]
name = "walker"
width = 4
height = 4

[palette]
"#" = "#8B6914"
"@" = "#6B4912"

[animations]
idle = { frames = [0], rate = 1 }
walk = { frames = [0, 1], rate = 8 }

[frame.0]
art = """
 ##
#@@#
#@@#
 ##
"""

[frame.1]
art = """
 ##
@##@
@##@
 ##
"""
`;

describe("parseSpriteFile", () => {
	it("extracts meta fields", () => {
		const def = parseSpriteFile(MINIMAL_SPRITE);
		expect(def.meta.name).toBe("test-unit");
		expect(def.meta.width).toBe(4);
		expect(def.meta.height).toBe(4);
	});

	it("extracts palette map", () => {
		const def = parseSpriteFile(MINIMAL_SPRITE);
		expect(def.palette["#"]).toBe("#8B6914");
		expect(def.palette["@"]).toBe("#6B4912");
		expect(def.palette["."]).toBe("#FFFFFF");
	});

	it("extracts animations", () => {
		const def = parseSpriteFile(MINIMAL_SPRITE);
		expect(def.animations.idle).toEqual({ frames: [0], rate: 1 });
	});

	it("extracts single frame art grid", () => {
		const def = parseSpriteFile(MINIMAL_SPRITE);
		expect(def.frames).toHaveLength(1);
		expect(def.frames[0].index).toBe(0);
		// Art grid should be exactly height lines, each width chars
		expect(def.frames[0].art).toHaveLength(4);
		expect(def.frames[0].art[0]).toBe(" ## ");
		expect(def.frames[0].art[1]).toBe("#@@#");
		expect(def.frames[0].art[2]).toBe("#..#");
		expect(def.frames[0].art[3]).toBe(" ## ");
	});

	it("parses multiple frames", () => {
		const def = parseSpriteFile(MULTI_FRAME_SPRITE);
		expect(def.frames).toHaveLength(2);
		expect(def.frames[0].index).toBe(0);
		expect(def.frames[1].index).toBe(1);
		expect(def.frames[1].art[1]).toBe("@##@");
	});

	it("parses multi-frame animations", () => {
		const def = parseSpriteFile(MULTI_FRAME_SPRITE);
		expect(def.animations.walk).toEqual({ frames: [0, 1], rate: 8 });
	});

	it("pads short art lines to sprite width", () => {
		const shortLineSrc = `
[meta]
name = "padded"
width = 6
height = 2

[palette]
"#" = "#000000"

[animations]
idle = { frames = [0], rate = 1 }

[frame.0]
art = """
##
####
"""
`;
		const def = parseSpriteFile(shortLineSrc);
		expect(def.frames[0].art[0]).toBe("##    ");
		expect(def.frames[0].art[1]).toBe("####  ");
	});

	it("pads short art to sprite height with empty lines", () => {
		const shortHeightSrc = `
[meta]
name = "short"
width = 4
height = 4

[palette]
"#" = "#000000"

[animations]
idle = { frames = [0], rate = 1 }

[frame.0]
art = """
####
####
"""
`;
		const def = parseSpriteFile(shortHeightSrc);
		expect(def.frames[0].art).toHaveLength(4);
		expect(def.frames[0].art[2]).toBe("    ");
		expect(def.frames[0].art[3]).toBe("    ");
	});
});
