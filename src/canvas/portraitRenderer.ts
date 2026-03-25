/**
 * Portrait renderer — procedural canvas drawing for each character.
 *
 * Each of the 7 named characters has a dedicated drawing function that
 * captures their unique identity: face shape, accessories, expression,
 * uniform details. Drawn at 64x64 native, scaled 2x to 128x128.
 *
 * Character visual identities:
 *   FOXHOUND     — Radio operator. Headset, blue uniform, alert wide eyes.
 *   Sgt. Bubbles — Rambo otter. Red bandana, battle scars, teal eye glint.
 *   Gen. Whiskers — Grizzled general. Dark beret, cigar, medals, scarred face.
 *   Cpl. Splash  — Young diver. Goggles on forehead, teal wetsuit, eager grin.
 *   Sgt. Fang    — Heavy siege. Helmet, jaw scars, intense narrow eyes.
 *   Medic Marina — Field medic. White cap + red cross, kind soft eyes.
 *   Pvt. Muskrat — Demo expert. Cap with bomb insignia, determined squint.
 */

// ─── Palette ───

const P = {
	furDark: "#5c3a1e",
	furMid: "#8b6914",
	furLight: "#b8860b",
	skinLight: "#d4a574",
	skinShadow: "#a67c52",
	nose: "#1a1a1a",
	eyeWhite: "#e8e8e8",
	eyeBlack: "#0a0a0a",
	eyeTeal: "#2dd4bf",
	scarRed: "#b91c1c",
	bandanaRed: "#dc2626",
	bandanaDark: "#991b1b",
	uniformBlue: "#1e3a5f",
	uniformBlueLt: "#3b82f6",
	uniformGreen: "#166534",
	uniformGreenLt: "#22c55e",
	wetsuitTeal: "#0d9488",
	wetsuitTealLt: "#14b8a6",
	metalDark: "#374151",
	metalLight: "#9ca3af",
	metalGold: "#ca8a04",
	goldLight: "#fbbf24",
	white: "#f1f5f9",
	whiteShadow: "#cbd5e1",
	redCross: "#ef4444",
	cigarBrown: "#92400e",
	cigarTip: "#f97316",
	helmetGreen: "#365314",
	helmetGreenLt: "#4d7c0f",
	gogglesFrame: "#78716c",
	gogglesLens: "#06b6d4",
	bombYellow: "#fbbf24",
	bombOrange: "#f97316",
	bg: "#0f172a",
};

// ─── Drawing helpers ───

type Ctx = CanvasRenderingContext2D;

function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string): void {
	c.fillStyle = color;
	c.fillRect(x, y, w, h);
}

function px(c: Ctx, x: number, y: number, color: string): void {
	c.fillStyle = color;
	c.fillRect(x, y, 1, 1);
}

function circle(c: Ctx, cx: number, cy: number, r: number, color: string): void {
	for (let y = -r; y <= r; y++) {
		for (let x = -r; x <= r; x++) {
			if (x * x + y * y <= r * r) px(c, cx + x, cy + y, color);
		}
	}
}

function ellipse(c: Ctx, cx: number, cy: number, rx: number, ry: number, color: string): void {
	for (let y = -ry; y <= ry; y++) {
		for (let x = -rx; x <= rx; x++) {
			if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) px(c, cx + x, cy + y, color);
		}
	}
}

/** Draw the base otter head shape shared by all characters. */
function drawOtterHead(c: Ctx, offsetY = 0): void {
	const y = 12 + offsetY;
	// Ears
	circle(c, 20, y, 4, P.furDark);
	circle(c, 44, y, 4, P.furDark);
	circle(c, 20, y, 2, P.skinShadow);
	circle(c, 44, y, 2, P.skinShadow);
	// Head
	ellipse(c, 32, y + 10, 14, 12, P.furMid);
	// Face lighter area
	ellipse(c, 32, y + 12, 10, 9, P.skinLight);
	// Muzzle
	ellipse(c, 32, y + 17, 6, 4, P.skinShadow);
	// Nose
	rect(c, 30, y + 15, 4, 2, P.nose);
	// Mouth
	px(c, 30, y + 19, P.nose);
	px(c, 33, y + 19, P.nose);
	rect(c, 31, y + 20, 2, 1, P.nose);
}

/** Draw standard otter eyes. */
function drawEyes(c: Ctx, offsetY = 0, pupilColor = P.eyeBlack): void {
	const y = 20 + offsetY;
	// Left eye
	rect(c, 25, y, 4, 3, P.eyeWhite);
	rect(c, 26, y, 2, 3, pupilColor);
	px(c, 27, y, P.eyeWhite); // highlight
	// Right eye
	rect(c, 35, y, 4, 3, P.eyeWhite);
	rect(c, 36, y, 2, 3, pupilColor);
	px(c, 37, y, P.eyeWhite); // highlight
}

/** Draw the uniform/body area at the bottom. */
function drawBody(c: Ctx, color: string, colorLt: string): void {
	rect(c, 16, 44, 32, 20, color);
	// Shoulders
	rect(c, 12, 46, 4, 14, color);
	rect(c, 48, 46, 4, 14, color);
	// Collar
	rect(c, 28, 44, 8, 3, colorLt);
}

// ─── Character-specific portraits ───

function drawFoxhound(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c);
	drawEyes(c, 0, P.eyeBlack);
	drawBody(c, P.uniformBlue, P.uniformBlueLt);

	// Headset — metal band over head
	rect(c, 17, 10, 30, 2, P.metalDark);
	// Left earpiece
	rect(c, 14, 14, 5, 8, P.metalDark);
	rect(c, 15, 15, 3, 6, P.metalLight);
	// Right earpiece
	rect(c, 45, 14, 5, 8, P.metalDark);
	rect(c, 46, 15, 3, 6, P.metalLight);
	// Microphone boom
	rect(c, 14, 22, 1, 8, P.metalDark);
	rect(c, 12, 30, 4, 3, P.metalDark);
	rect(c, 13, 31, 2, 1, P.metalLight);
	// Alert wide eyes — slightly larger
	rect(c, 24, 20, 5, 4, P.eyeWhite);
	rect(c, 25, 20, 3, 4, P.eyeBlack);
	px(c, 26, 20, P.eyeWhite);
	rect(c, 35, 20, 5, 4, P.eyeWhite);
	rect(c, 36, 20, 3, 4, P.eyeBlack);
	px(c, 37, 20, P.eyeWhite);
}

function drawSgtBubbles(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c);
	drawBody(c, P.uniformGreen, P.uniformGreenLt);

	// Red bandana
	rect(c, 18, 8, 28, 4, P.bandanaRed);
	rect(c, 16, 10, 3, 3, P.bandanaDark); // trailing end left
	rect(c, 45, 10, 3, 3, P.bandanaDark); // trailing end right
	rect(c, 20, 9, 24, 2, P.bandanaDark); // shadow fold
	// Knot at back
	rect(c, 46, 8, 4, 2, P.bandanaRed);
	rect(c, 48, 10, 3, 4, P.bandanaRed);

	// Battle scars — two marks on right cheek
	rect(c, 40, 26, 1, 4, P.scarRed);
	rect(c, 42, 25, 1, 3, P.scarRed);

	// Eyes with teal glint
	drawEyes(c);
	px(c, 27, 20, P.eyeTeal); // teal highlight left
	px(c, 37, 20, P.eyeTeal); // teal highlight right

	// Slight snarl — mouth wider
	px(c, 29, 34, P.nose);
	px(c, 34, 34, P.nose);
}

function drawGenWhiskers(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c, 2); // slightly lower — heavier head
	drawEyes(c, 2);
	drawBody(c, P.uniformGreen, P.uniformGreenLt);

	// Dark beret
	ellipse(c, 32, 10, 16, 5, P.uniformGreen);
	rect(c, 16, 8, 32, 4, P.uniformGreen);
	circle(c, 22, 7, 2, P.metalGold); // beret badge

	// Cigar
	rect(c, 36, 34, 10, 2, P.cigarBrown);
	rect(c, 37, 33, 8, 1, P.cigarBrown);
	px(c, 46, 33, P.cigarTip); // lit end
	px(c, 46, 32, P.metalLight); // smoke wisp

	// Facial scar — diagonal across left cheek
	for (let i = 0; i < 5; i++) {
		px(c, 22 + i, 24 + i, P.scarRed);
	}

	// Medals on chest
	circle(c, 24, 50, 2, P.metalGold);
	circle(c, 30, 50, 2, P.goldLight);
	circle(c, 36, 50, 2, P.metalGold);

	// Grizzled — wider whiskers
	rect(c, 16, 28, 4, 1, P.furLight);
	rect(c, 44, 28, 4, 1, P.furLight);
	rect(c, 15, 30, 3, 1, P.furLight);
	rect(c, 46, 30, 3, 1, P.furLight);
}

function drawCplSplash(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c);
	drawBody(c, P.wetsuitTeal, P.wetsuitTealLt);

	// Dive goggles pushed up on forehead
	rect(c, 20, 11, 24, 5, P.gogglesFrame);
	circle(c, 26, 13, 3, P.gogglesLens);
	circle(c, 38, 13, 3, P.gogglesLens);
	rect(c, 29, 12, 6, 3, P.gogglesFrame); // bridge
	// Strap
	rect(c, 14, 13, 6, 2, P.gogglesFrame);
	rect(c, 44, 13, 6, 2, P.gogglesFrame);

	// Young eager eyes — slightly rounder
	rect(c, 24, 20, 5, 4, P.eyeWhite);
	rect(c, 26, 20, 2, 4, P.eyeBlack);
	px(c, 27, 20, P.eyeWhite);
	rect(c, 35, 20, 5, 4, P.eyeWhite);
	rect(c, 37, 20, 2, 4, P.eyeBlack);
	px(c, 38, 20, P.eyeWhite);

	// Slight grin
	rect(c, 29, 35, 6, 1, P.skinShadow);
	px(c, 28, 34, P.skinShadow);
	px(c, 35, 34, P.skinShadow);
}

function drawSgtFang(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c, 1);
	drawBody(c, P.uniformGreen, P.uniformGreenLt);

	// Heavy helmet
	rect(c, 16, 6, 32, 10, P.helmetGreen);
	rect(c, 18, 7, 28, 8, P.helmetGreenLt);
	rect(c, 14, 14, 36, 3, P.helmetGreen); // brim
	// Chin strap
	rect(c, 18, 28, 2, 6, P.helmetGreen);
	rect(c, 44, 28, 2, 6, P.helmetGreen);

	// Heavy jaw — wider face
	rect(c, 20, 30, 24, 6, P.skinShadow);

	// Scars across face — three parallel marks
	for (let i = 0; i < 3; i++) {
		rect(c, 38 + i * 2, 22, 1, 6, P.scarRed);
	}

	// Intense narrow eyes
	rect(c, 25, 21, 4, 2, P.eyeWhite);
	rect(c, 26, 21, 2, 2, P.eyeBlack);
	rect(c, 35, 21, 4, 2, P.eyeWhite);
	rect(c, 36, 21, 2, 2, P.eyeBlack);

	// Heavy brow ridge
	rect(c, 23, 19, 6, 2, P.furDark);
	rect(c, 33, 19, 6, 2, P.furDark);
}

function drawMedicMarina(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c);
	drawBody(c, P.white, P.whiteShadow);

	// White medical cap
	rect(c, 20, 6, 24, 8, P.white);
	rect(c, 22, 7, 20, 6, P.whiteShadow);
	// Red cross on cap
	rect(c, 30, 7, 4, 6, P.redCross);
	rect(c, 28, 9, 8, 2, P.redCross);

	// Kind soft eyes — rounder, slightly larger
	circle(c, 27, 21, 3, P.eyeWhite);
	rect(c, 26, 20, 2, 3, P.eyeBlack);
	px(c, 27, 20, P.eyeWhite);
	circle(c, 37, 21, 3, P.eyeWhite);
	rect(c, 36, 20, 2, 3, P.eyeBlack);
	px(c, 37, 20, P.eyeWhite);

	// Gentle smile
	rect(c, 29, 34, 6, 1, P.skinShadow);
	px(c, 28, 33, P.skinShadow);
	px(c, 35, 33, P.skinShadow);

	// Red cross on coat
	rect(c, 30, 50, 4, 8, P.redCross);
	rect(c, 28, 53, 8, 2, P.redCross);
}

function drawPvtMuskrat(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawOtterHead(c);
	drawBody(c, P.uniformGreen, P.uniformGreenLt);

	// Cap
	rect(c, 18, 6, 28, 8, P.uniformGreen);
	rect(c, 16, 12, 32, 3, P.uniformGreen); // brim
	// Bomb/explosive insignia on cap
	circle(c, 32, 9, 3, P.bombYellow);
	px(c, 32, 6, P.bombOrange); // fuse
	px(c, 33, 5, P.bombOrange);
	px(c, 34, 4, P.metalLight); // spark

	// Determined squint — narrow eyes
	rect(c, 25, 21, 4, 2, P.eyeWhite);
	rect(c, 26, 21, 2, 2, P.eyeBlack);
	rect(c, 35, 21, 4, 2, P.eyeWhite);
	rect(c, 36, 21, 2, 2, P.eyeBlack);
	// Heavy brows for determination
	rect(c, 24, 19, 5, 2, P.furDark);
	rect(c, 35, 19, 5, 2, P.furDark);

	// Set jaw
	rect(c, 24, 32, 16, 4, P.skinShadow);
	// Slight stubble
	for (let i = 0; i < 6; i++) {
		px(c, 24 + i * 2, 35, P.furDark);
	}
}

// ─── Registry ───

const PORTRAIT_DRAW_FNS: Record<string, (c: Ctx) => void> = {
	foxhound: drawFoxhound,
	sgt_bubbles: drawSgtBubbles,
	gen_whiskers: drawGenWhiskers,
	cpl_splash: drawCplSplash,
	sgt_fang: drawSgtFang,
	medic_marina: drawMedicMarina,
	pvt_muskrat: drawPvtMuskrat,
};

// ─── Cache + public API ───

const SIZE = 64;
const SCALE = 2;
const portraitCache = new Map<string, HTMLCanvasElement>();

/**
 * Get a rendered portrait canvas (128x128) for a character.
 * Returns null if no portrait exists for the given ID.
 */
export function getPortraitCanvas(portraitId: string): HTMLCanvasElement | null {
	if (portraitCache.has(portraitId)) return portraitCache.get(portraitId)!;

	const drawFn = PORTRAIT_DRAW_FNS[portraitId];
	if (!drawFn) return null;

	// Draw at native 64x64
	const native = document.createElement("canvas");
	native.width = SIZE;
	native.height = SIZE;
	const ctx = native.getContext("2d");
	if (!ctx) return null;
	drawFn(ctx);

	// Scale 2x with nearest-neighbor
	const scaled = document.createElement("canvas");
	scaled.width = SIZE * SCALE;
	scaled.height = SIZE * SCALE;
	const sCtx = scaled.getContext("2d");
	if (!sCtx) return null;
	sCtx.imageSmoothingEnabled = false;
	sCtx.drawImage(native, 0, 0, SIZE * SCALE, SIZE * SCALE);

	portraitCache.set(portraitId, scaled);
	return scaled;
}

/** Pre-render all portraits. Call at app init. */
export function initPortraits(): void {
	for (const id of Object.keys(PORTRAIT_DRAW_FNS)) {
		getPortraitCanvas(id);
	}
}

/** List all available portrait IDs. */
export function getPortraitIds(): string[] {
	return Object.keys(PORTRAIT_DRAW_FNS);
}
