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

// ─── Seeded PRNG (local copy — used for splash art background noise) ───

let _seed = 42;
function seedRng(s: number): void { _seed = s; }
function srand(): number {
	_seed = (_seed * 16807 + 0) % 2147483647;
	return (_seed - 1) / 2147483646;
}

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

// ============================================================================
// SCALE-GUARD VILLAIN PORTRAITS
// ============================================================================

// Reptilian palette — distinct from otter warm tones
const SG = {
	scalesDark: "#14532d",
	scalesMid: "#166534",
	scalesLight: "#22c55e",
	scaleBelly: "#a3e635",
	eyeYellow: "#fef08a",
	eyeSlitBlack: "#1a1a1a",
	jawIron: "#6b7280",
	jawIronLight: "#9ca3af",
	jawIronDark: "#374151",
	albinoScale: "#e2e8f0",
	albinoPink: "#fda4af",
	albinoEyePink: "#fb7185",
	cobraBlack: "#0f0f0f",
	cobraHood: "#365314",
	cobraHoodYellow: "#fbbf24",
	cobraEyeGreen: "#4ade80",
	monitorBrown: "#78350f",
	monitorSpots: "#b45309",
	sgUniformRed: "#7f1d1d",
	sgUniformRedLt: "#991b1b",
	sgMedal: "#ca8a04",
	sgCap: "#1c1917",
};

/** Draw the base crocodilian head shape — long snout, ridged brows, no ears. */
function drawCrocHead(c: Ctx, color: string, lightColor: string, offsetY = 0): void {
	const y = 10 + offsetY;
	// Long skull/snout shape — wider at the back, tapering forward
	ellipse(c, 32, y + 8, 15, 10, color);
	// Snout protrusion
	rect(c, 22, y + 14, 20, 10, color);
	rect(c, 20, y + 16, 24, 6, color);
	// Lighter underjaw
	rect(c, 24, y + 20, 16, 6, lightColor);
	// Brow ridges
	rect(c, 20, y + 4, 8, 3, color);
	rect(c, 36, y + 4, 8, 3, color);
	// Nostrils at snout tip
	px(c, 26, y + 16, P.nose);
	px(c, 37, y + 16, P.nose);
	// Teeth visible along jaw line
	for (let i = 0; i < 5; i++) {
		px(c, 24 + i * 3, y + 24, P.eyeWhite);
	}
}

/** Draw reptilian slit eyes. */
function drawCrocEyes(c: Ctx, eyeColor: string, offsetY = 0): void {
	const y = 14 + offsetY;
	// Left eye — horizontal slit
	rect(c, 24, y, 5, 3, eyeColor);
	rect(c, 25, y, 3, 3, SG.eyeSlitBlack); // vertical slit pupil
	px(c, 26, y, eyeColor); // highlight
	// Right eye
	rect(c, 35, y, 5, 3, eyeColor);
	rect(c, 36, y, 3, 3, SG.eyeSlitBlack);
	px(c, 37, y, eyeColor);
}

/** Draw Scale-Guard body/uniform area. */
function drawSGBody(c: Ctx, scaleColor: string): void {
	rect(c, 14, 44, 36, 20, scaleColor);
	// Scale pattern on body
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 6; col++) {
			if ((row + col) % 2 === 0) {
				px(c, 16 + col * 5, 46 + row * 5, SG.scalesLight);
			}
		}
	}
}

function drawKommandantIronjaw(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	drawCrocHead(c, SG.scalesDark, SG.scaleBelly);
	drawCrocEyes(c, SG.eyeYellow);
	drawSGBody(c, SG.sgUniformRed);

	// IRON JAW — prosthetic replacing lower jaw
	// Metal plate covering the entire lower face
	rect(c, 20, 26, 24, 10, SG.jawIronDark);
	rect(c, 22, 27, 20, 8, SG.jawIron);
	// Rivets along the jaw line
	for (let i = 0; i < 4; i++) {
		px(c, 24 + i * 5, 27, SG.jawIronLight);
		px(c, 24 + i * 5, 33, SG.jawIronLight);
	}
	// Jaw hinge bolts
	circle(c, 20, 28, 2, SG.jawIronLight);
	circle(c, 44, 28, 2, SG.jawIronLight);
	// Iron teeth
	for (let i = 0; i < 6; i++) {
		rect(c, 23 + i * 3, 34, 2, 2, SG.jawIronLight);
	}

	// Commander's insignia — red star on shoulder
	rect(c, 16, 46, 8, 8, SG.sgUniformRedLt);
	px(c, 20, 48, SG.sgMedal);
	px(c, 19, 49, SG.sgMedal);
	px(c, 20, 49, SG.sgMedal);
	px(c, 21, 49, SG.sgMedal);
	px(c, 20, 50, SG.sgMedal);

	// Scars around the iron jaw attachment points
	rect(c, 18, 25, 1, 3, P.scarRed);
	rect(c, 45, 25, 1, 3, P.scarRed);
}

function drawCaptainScalebreak(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	// ALBINO ALLIGATOR — pale, unsettling
	drawCrocHead(c, SG.albinoScale, P.whiteShadow);
	drawSGBody(c, SG.sgUniformRed);

	// Pink albino eyes — wider, more unsettling
	rect(c, 23, 14, 6, 4, SG.albinoEyePink);
	rect(c, 25, 14, 2, 4, SG.eyeSlitBlack);
	px(c, 26, 14, SG.albinoEyePink);
	rect(c, 35, 14, 6, 4, SG.albinoEyePink);
	rect(c, 37, 14, 2, 4, SG.eyeSlitBlack);
	px(c, 38, 14, SG.albinoEyePink);

	// Faint pink veins visible through pale skin
	px(c, 28, 18, SG.albinoPink);
	px(c, 30, 20, SG.albinoPink);
	px(c, 36, 19, SG.albinoPink);

	// Radio headset (intercepted comms)
	rect(c, 14, 12, 4, 6, P.metalDark);
	rect(c, 15, 13, 2, 4, P.metalLight);
	rect(c, 46, 12, 4, 6, P.metalDark);

	// Officer's cap
	rect(c, 20, 6, 24, 5, SG.sgCap);
	rect(c, 18, 9, 28, 3, SG.sgCap); // brim
	rect(c, 28, 7, 8, 2, SG.sgMedal); // cap badge
}

function drawWardenFangrot(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	// BLOATED CAIMAN — wider face, smaller eyes, heavy jowls
	// Wider head shape
	ellipse(c, 32, 18, 18, 14, SG.scalesDark);
	rect(c, 14, 24, 36, 12, SG.scalesDark); // heavy jowls
	rect(c, 18, 28, 28, 8, SG.scaleBelly);
	// Small beady eyes — sunken
	rect(c, 24, 16, 3, 2, SG.eyeYellow);
	px(c, 25, 16, SG.eyeSlitBlack);
	rect(c, 37, 16, 3, 2, SG.eyeYellow);
	px(c, 38, 16, SG.eyeSlitBlack);
	// Heavy brow — almost covering eyes
	rect(c, 22, 14, 6, 3, SG.scalesDark);
	rect(c, 36, 14, 6, 3, SG.scalesDark);
	// Scarred snout
	rect(c, 26, 22, 12, 6, SG.scalesDark);
	px(c, 28, 22, P.nose);
	px(c, 35, 22, P.nose);
	// Scars from prisoner revolts
	rect(c, 40, 18, 1, 8, P.scarRed);
	rect(c, 42, 20, 1, 6, P.scarRed);

	drawSGBody(c, SG.sgUniformRed);
	// Keys on belt (prison warden)
	rect(c, 40, 52, 3, 6, P.metalLight);
	rect(c, 43, 54, 2, 2, P.metalLight);
	rect(c, 44, 56, 3, 2, P.metalLight);
}

function drawVenom(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	// KING COBRA — hood spread, vertical slit eyes, menacing
	// Cobra hood — wide fan shape
	ellipse(c, 32, 22, 20, 16, SG.cobraBlack);
	ellipse(c, 32, 22, 18, 14, SG.cobraHood);
	// Hood pattern — classic spectacle marks
	circle(c, 24, 20, 3, SG.cobraHoodYellow);
	circle(c, 24, 20, 1, SG.cobraBlack);
	circle(c, 40, 20, 3, SG.cobraHoodYellow);
	circle(c, 40, 20, 1, SG.cobraBlack);
	// Face — narrow, angular
	ellipse(c, 32, 24, 8, 10, SG.cobraHood);
	ellipse(c, 32, 26, 5, 6, SG.cobraBlack);
	// Piercing green eyes
	rect(c, 27, 22, 4, 3, SG.cobraEyeGreen);
	rect(c, 28, 22, 2, 3, SG.eyeSlitBlack); // vertical slit
	px(c, 29, 22, SG.cobraEyeGreen);
	rect(c, 33, 22, 4, 3, SG.cobraEyeGreen);
	rect(c, 34, 22, 2, 3, SG.eyeSlitBlack);
	px(c, 35, 22, SG.cobraEyeGreen);
	// Forked tongue
	px(c, 31, 32, P.scarRed);
	px(c, 33, 32, P.scarRed);
	px(c, 30, 33, P.scarRed);
	px(c, 34, 33, P.scarRed);

	// Sniper scope hung around neck
	rect(c, 22, 40, 20, 3, P.metalDark);
	circle(c, 42, 41, 3, P.metalDark);
	circle(c, 42, 41, 2, P.gogglesLens);

	drawSGBody(c, SG.cobraBlack);
}

function drawBroodmother(c: Ctx): void {
	rect(c, 0, 0, 64, 64, P.bg);
	// MONITOR LIZARD — broad head, hooded eyes, spotted pattern
	// Wide flat head
	ellipse(c, 32, 18, 16, 12, SG.monitorBrown);
	rect(c, 16, 22, 32, 8, SG.monitorBrown);
	// Spotted pattern
	for (let i = 0; i < 8; i++) {
		const sx = 20 + (i % 4) * 7;
		const sy = 14 + Math.floor(i / 4) * 8;
		circle(c, sx, sy, 2, SG.monitorSpots);
	}
	// Hooded eyes — half-lidded, calculating
	rect(c, 24, 16, 5, 2, SG.eyeYellow);
	rect(c, 25, 16, 3, 2, SG.eyeSlitBlack);
	rect(c, 24, 15, 5, 1, SG.monitorBrown); // heavy lid
	rect(c, 35, 16, 5, 2, SG.eyeYellow);
	rect(c, 36, 16, 3, 2, SG.eyeSlitBlack);
	rect(c, 35, 15, 5, 1, SG.monitorBrown);
	// Wide flat nose
	rect(c, 28, 22, 8, 3, SG.monitorBrown);
	px(c, 30, 23, P.nose);
	px(c, 33, 23, P.nose);
	// Jowly chin
	rect(c, 20, 26, 24, 6, SG.monitorSpots);

	drawSGBody(c, SG.sgUniformRed);
	// Clipboard/ledger (administrator)
	rect(c, 38, 48, 12, 14, P.whiteShadow);
	rect(c, 39, 49, 10, 12, P.white);
	// Writing on clipboard
	for (let i = 0; i < 4; i++) {
		rect(c, 40, 50 + i * 3, 8, 1, P.metalDark);
	}
}

// ============================================================================
// SPLASH ART — Wide confrontation scene for landing page
// ============================================================================

/**
 * Draw the Warcraft-style confrontation splash: Sgt. Bubbles (left profile)
 * vs Kommandant Ironjaw (right profile), glaring across dark water.
 *
 * Native: 160x64. Scaled 3x to 480x192.
 * Left half warm brown tones. Right half cold green tones.
 */
function drawConfrontationSplash(c: CanvasRenderingContext2D): void {
	const W = 160, H = 64;

	// ── Background: split warm/cold with dark water divide ──
	// Left half — warm dark gradient (otter territory)
	rect(c, 0, 0, W / 2 - 3, H, "#0e0a07");
	// Subtle warm streaks
	for (let y = 0; y < H; y += 4) rect(c, 0, y, W / 2 - 6, 1, "#120d08");
	for (let y = 2; y < H; y += 7) rect(c, 0, y, W / 2 - 10, 1, "#161009");
	// Right half — cold dark gradient (reptile territory)
	rect(c, W / 2 + 3, 0, W / 2 - 3, H, "#060b08");
	for (let y = 0; y < H; y += 4) rect(c, W / 2 + 6, y, W / 2 - 9, 1, "#081009");
	for (let y = 2; y < H; y += 7) rect(c, W / 2 + 10, y, W / 2 - 13, 1, "#0a130b");
	// Center divide — dark water with ripple lines
	rect(c, W / 2 - 3, 0, 6, H, "#0a1520");
	for (let y = 0; y < H; y += 3) rect(c, W / 2 - 2, y, 4, 1, "#0d1e2a");
	for (let y = 1; y < H; y += 5) rect(c, W / 2 - 1, y, 2, 1, "#112838");

	// ── SGT. BUBBLES — left side profile, facing right ──
	const bx = 20; // center of Bubbles
	const by = 20; // head y

	// Head — side profile otter snout pointing right
	ellipse(c, bx, by + 8, 12, 10, P.furMid);        // head mass
	rect(c, bx, by + 4, 14, 12, P.furMid);             // snout extension right
	ellipse(c, bx - 2, by + 10, 8, 7, P.skinLight);   // lighter face
	rect(c, bx + 8, by + 8, 8, 6, P.skinLight);        // snout front
	rect(c, bx + 14, by + 10, 3, 3, P.skinShadow);     // nose tip
	px(c, bx + 15, by + 11, P.nose);                    // nostril

	// Eye — fierce, looking right
	rect(c, bx + 4, by + 5, 4, 3, P.eyeWhite);
	rect(c, bx + 6, by + 5, 2, 3, P.eyeBlack);
	px(c, bx + 7, by + 5, P.eyeTeal);                   // teal glint

	// Ear
	ellipse(c, bx - 8, by + 2, 3, 3, P.furDark);
	ellipse(c, bx - 8, by + 2, 1, 1, P.skinShadow);

	// Red bandana — trailing behind
	rect(c, bx - 10, by + 1, 16, 3, P.bandanaRed);
	rect(c, bx - 12, by + 2, 4, 2, P.bandanaDark);     // trailing tail
	rect(c, bx - 14, by + 3, 3, 3, P.bandanaDark);     // trailing end
	rect(c, bx - 16, by + 5, 2, 3, P.bandanaRed);      // wind flutter

	// Mouth — slight snarl
	rect(c, bx + 10, by + 14, 6, 1, P.nose);
	px(c, bx + 9, by + 13, P.nose);

	// Body/shoulder
	rect(c, bx - 14, by + 18, 28, 30, P.uniformGreen);
	rect(c, bx - 12, by + 20, 24, 26, P.uniformGreenLt);

	// Whiskers
	rect(c, bx + 12, by + 12, 4, 1, P.furLight);
	rect(c, bx + 13, by + 14, 3, 1, P.furLight);

	// Battle scar on cheek
	rect(c, bx + 2, by + 10, 1, 3, P.scarRed);

	// ── KOMMANDANT IRONJAW — right side profile, facing left ──
	const ix = W - 22; // center of Ironjaw
	const iy = 16;     // head y

	// Head — side profile croc snout pointing left
	ellipse(c, ix, iy + 10, 14, 12, SG.scalesDark);    // head mass (bigger than Bubbles)
	rect(c, ix - 16, iy + 6, 16, 14, SG.scalesDark);   // snout extension left
	rect(c, ix - 20, iy + 8, 6, 8, SG.scalesDark);     // snout tip
	// Jaw — the IRON prosthetic, lower half
	rect(c, ix - 18, iy + 14, 20, 6, SG.jawIronDark);
	rect(c, ix - 16, iy + 15, 16, 4, SG.jawIron);
	// Rivets
	for (let i = 0; i < 4; i++) {
		px(c, ix - 14 + i * 4, iy + 15, SG.jawIronLight);
	}
	// Iron teeth along jaw
	for (let i = 0; i < 5; i++) {
		rect(c, ix - 17 + i * 3, iy + 20, 2, 2, SG.jawIronLight);
	}

	// Upper jaw — real teeth visible
	for (let i = 0; i < 4; i++) {
		px(c, ix - 16 + i * 3, iy + 13, P.eyeWhite);
	}

	// Dorsal ridges along top of head
	for (let i = 0; i < 6; i++) {
		px(c, ix - 4 + i * 3, iy + 2, SG.scalesLight);
	}

	// Eye — cold, calculating, slit pupil
	rect(c, ix - 6, iy + 6, 5, 4, SG.eyeYellow);
	rect(c, ix - 5, iy + 6, 2, 4, SG.eyeSlitBlack);
	px(c, ix - 4, iy + 6, SG.eyeYellow);               // highlight

	// Brow ridge
	rect(c, ix - 8, iy + 4, 8, 2, SG.scalesDark);

	// Scar tissue around iron jaw attachment
	rect(c, ix + 4, iy + 14, 1, 4, P.scarRed);
	rect(c, ix + 6, iy + 13, 1, 3, P.scarRed);

	// Body/shoulder
	rect(c, ix - 8, iy + 22, 28, 30, SG.sgUniformRed);
	rect(c, ix - 6, iy + 24, 24, 26, SG.sgUniformRedLt);
	// Shoulder insignia
	px(c, ix + 12, iy + 26, SG.sgMedal);
	px(c, ix + 11, iy + 27, SG.sgMedal);
	px(c, ix + 12, iy + 27, SG.sgMedal);
	px(c, ix + 13, iy + 27, SG.sgMedal);
	px(c, ix + 12, iy + 28, SG.sgMedal);

	// Scale texture on visible skin
	for (let i = 0; i < 4; i++) {
		px(c, ix - 2 + i * 3, iy + 4, SG.scalesLight);
	}
}

const SPLASH_W = 160;
const SPLASH_H = 64;
const SPLASH_SCALE = 3;

let _splashCache: HTMLCanvasElement | null = null;

/**
 * Get the confrontation splash art canvas (480x192).
 * Rendered once and cached.
 */
export function getSplashCanvas(): HTMLCanvasElement {
	if (_splashCache) return _splashCache;

	seedRng(999); // deterministic for the background noise

	const native = document.createElement("canvas");
	native.width = SPLASH_W;
	native.height = SPLASH_H;
	const ctx = native.getContext("2d")!;
	drawConfrontationSplash(ctx);

	const scaled = document.createElement("canvas");
	scaled.width = SPLASH_W * SPLASH_SCALE;
	scaled.height = SPLASH_H * SPLASH_SCALE;
	const sCtx = scaled.getContext("2d")!;
	sCtx.imageSmoothingEnabled = false;
	sCtx.drawImage(native, 0, 0, SPLASH_W * SPLASH_SCALE, SPLASH_H * SPLASH_SCALE);

	_splashCache = scaled;
	return scaled;
}

// ─── Registry ───

const PORTRAIT_DRAW_FNS: Record<string, (c: Ctx) => void> = {
	// OEF Heroes
	foxhound: drawFoxhound,
	sgt_bubbles: drawSgtBubbles,
	gen_whiskers: drawGenWhiskers,
	cpl_splash: drawCplSplash,
	sgt_fang: drawSgtFang,
	medic_marina: drawMedicMarina,
	pvt_muskrat: drawPvtMuskrat,
	// Scale-Guard Villains
	ironjaw: drawKommandantIronjaw,
	scalebreak: drawCaptainScalebreak,
	fangrot: drawWardenFangrot,
	venom: drawVenom,
	broodmother: drawBroodmother,
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
