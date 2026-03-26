/**
 * Rank Emblem System — draws faction badges and unit-type insignia
 * on top of base animal sprites to distinguish unit roles at a glance.
 *
 * Each entity type gets:
 * 1. A faction outline color (green for OEF, red for Scale-Guard)
 * 2. A small rank/role emblem drawn at a fixed position on the sprite
 *
 * The emblem is composited onto the sprite frame at render time.
 */

// ─── Faction colors ───

const FACTION_COLORS: Record<string, string> = {
	ura: "#4ade80",        // green — OEF
	scale_guard: "#ef4444", // red — Scale-Guard
	neutral: "#a1a1aa",     // gray — neutral
};

const FACTION_OUTLINE: Record<string, string> = {
	ura: "#166534",
	scale_guard: "#7f1d1d",
	neutral: "#52525b",
};

// ─── Emblem definitions ───

interface EmblemDef {
	/** Faction id for color. */
	faction: string;
	/** Small symbol drawn at the emblem position. */
	symbol: "chevron" | "star" | "cross" | "diamond" | "wrench" | "skull" | "crown" | "bolt" | "shield" | "eye" | "fang" | "wave" | "arrow" | "circle";
	/** Symbol accent color override (defaults to faction color). */
	color?: string;
}

/** Maps entity type IDs to their emblem definition. */
const EMBLEM_DEFS: Record<string, EmblemDef> = {
	// ─── OEF Units ───
	river_rat:     { faction: "ura", symbol: "circle" },     // basic worker — plain dot
	mudfoot:       { faction: "ura", symbol: "chevron" },    // infantry — single chevron
	shellcracker:  { faction: "ura", symbol: "diamond" },    // heavy — diamond
	sapper:        { faction: "ura", symbol: "bolt" },       // engineer — lightning bolt
	raftsman:      { faction: "ura", symbol: "wave" },       // water transport — wave
	mortar_otter:  { faction: "ura", symbol: "star" },       // artillery — star
	diver:         { faction: "ura", symbol: "arrow" },      // stealth — downward arrow

	// ─── OEF Heroes ───
	col_bubbles:   { faction: "ura", symbol: "star", color: "#facc15" },    // gold star (HQ only)
	gen_whiskers:  { faction: "ura", symbol: "crown", color: "#facc15" },   // gold crown
	cpl_splash:    { faction: "ura", symbol: "wave", color: "#38bdf8" },    // blue wave
	sgt_fang:      { faction: "ura", symbol: "fang", color: "#facc15" },    // gold fang
	medic_marina:  { faction: "ura", symbol: "cross", color: "#f87171" },   // red cross
	pvt_muskrat:   { faction: "ura", symbol: "bolt", color: "#fb923c" },    // orange bolt

	// ─── Scale-Guard Units ───
	skink:         { faction: "scale_guard", symbol: "circle" },
	gator:         { faction: "scale_guard", symbol: "chevron" },
	viper:         { faction: "scale_guard", symbol: "fang" },
	snapper:       { faction: "scale_guard", symbol: "shield" },
	scout_lizard:  { faction: "scale_guard", symbol: "eye" },
	croc_champion: { faction: "scale_guard", symbol: "diamond" },
	siphon_drone:  { faction: "scale_guard", symbol: "bolt" },
	serpent_king:  { faction: "scale_guard", symbol: "crown", color: "#facc15" },
};

// ─── Emblem drawing ───

/** Size of emblem badge in pixels. */
const BADGE_SIZE = 10;
/** Emblem position offset from top-right of sprite. */
const BADGE_OFFSET_X = -2;
const BADGE_OFFSET_Y = -2;

/**
 * Draw a rank emblem onto a canvas at the top-right corner.
 * Call this after drawing the base sprite frame.
 */
export function drawRankEmblem(
	ctx: CanvasRenderingContext2D,
	entityType: string,
	spriteW: number,
): void {
	const def = EMBLEM_DEFS[entityType];
	if (!def) return;

	const factionColor = FACTION_COLORS[def.faction] ?? FACTION_COLORS.neutral;
	const outlineColor = FACTION_OUTLINE[def.faction] ?? FACTION_OUTLINE.neutral;
	const symbolColor = def.color ?? factionColor;

	// Badge position: top-right corner of sprite
	const bx = spriteW + BADGE_OFFSET_X - BADGE_SIZE;
	const by = BADGE_OFFSET_Y + 2;
	const cx = bx + BADGE_SIZE / 2;
	const cy = by + BADGE_SIZE / 2;
	const r = BADGE_SIZE / 2;

	// Draw badge background circle
	ctx.fillStyle = outlineColor;
	ctx.beginPath();
	ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = "#0f172a"; // dark slate background
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();

	// Draw symbol
	ctx.fillStyle = symbolColor;
	ctx.strokeStyle = symbolColor;
	ctx.lineWidth = 1;

	switch (def.symbol) {
		case "circle":
			ctx.beginPath();
			ctx.arc(cx, cy, 2, 0, Math.PI * 2);
			ctx.fill();
			break;

		case "chevron":
			ctx.beginPath();
			ctx.moveTo(cx - 3, cy + 1);
			ctx.lineTo(cx, cy - 2);
			ctx.lineTo(cx + 3, cy + 1);
			ctx.stroke();
			break;

		case "star": {
			drawStar(ctx, cx, cy, 3, 1.5, 5);
			break;
		}

		case "cross":
			ctx.fillRect(cx - 1, cy - 3, 2, 6);
			ctx.fillRect(cx - 3, cy - 1, 6, 2);
			break;

		case "diamond":
			ctx.beginPath();
			ctx.moveTo(cx, cy - 3);
			ctx.lineTo(cx + 3, cy);
			ctx.lineTo(cx, cy + 3);
			ctx.lineTo(cx - 3, cy);
			ctx.closePath();
			ctx.fill();
			break;

		case "wrench":
			ctx.fillRect(cx - 1, cy - 3, 2, 6);
			ctx.fillRect(cx - 2, cy - 3, 4, 2);
			break;

		case "skull":
			ctx.beginPath();
			ctx.arc(cx, cy - 1, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "#0f172a";
			ctx.fillRect(cx - 2, cy - 2, 1, 1);
			ctx.fillRect(cx + 1, cy - 2, 1, 1);
			break;

		case "crown":
			ctx.beginPath();
			ctx.moveTo(cx - 3, cy + 2);
			ctx.lineTo(cx - 3, cy - 1);
			ctx.lineTo(cx - 1, cy + 1);
			ctx.lineTo(cx, cy - 3);
			ctx.lineTo(cx + 1, cy + 1);
			ctx.lineTo(cx + 3, cy - 1);
			ctx.lineTo(cx + 3, cy + 2);
			ctx.closePath();
			ctx.fill();
			break;

		case "bolt":
			ctx.beginPath();
			ctx.moveTo(cx + 1, cy - 3);
			ctx.lineTo(cx - 1, cy);
			ctx.lineTo(cx + 1, cy);
			ctx.lineTo(cx - 1, cy + 3);
			ctx.stroke();
			break;

		case "shield":
			ctx.beginPath();
			ctx.moveTo(cx - 3, cy - 2);
			ctx.lineTo(cx + 3, cy - 2);
			ctx.lineTo(cx + 3, cy);
			ctx.lineTo(cx, cy + 3);
			ctx.lineTo(cx - 3, cy);
			ctx.closePath();
			ctx.fill();
			break;

		case "eye":
			ctx.beginPath();
			ctx.ellipse(cx, cy, 3, 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "#0f172a";
			ctx.beginPath();
			ctx.arc(cx, cy, 1, 0, Math.PI * 2);
			ctx.fill();
			break;

		case "fang":
			ctx.beginPath();
			ctx.moveTo(cx - 2, cy - 3);
			ctx.lineTo(cx - 1, cy + 2);
			ctx.lineTo(cx, cy);
			ctx.lineTo(cx + 1, cy + 2);
			ctx.lineTo(cx + 2, cy - 3);
			ctx.stroke();
			break;

		case "wave":
			ctx.beginPath();
			ctx.moveTo(cx - 3, cy);
			ctx.quadraticCurveTo(cx - 1.5, cy - 3, cx, cy);
			ctx.quadraticCurveTo(cx + 1.5, cy + 3, cx + 3, cy);
			ctx.stroke();
			break;

		case "arrow":
			ctx.beginPath();
			ctx.moveTo(cx, cy - 3);
			ctx.lineTo(cx, cy + 3);
			ctx.moveTo(cx - 2, cy + 1);
			ctx.lineTo(cx, cy + 3);
			ctx.lineTo(cx + 2, cy + 1);
			ctx.stroke();
			break;
	}
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
	ctx.beginPath();
	for (let i = 0; i < points * 2; i++) {
		const r = i % 2 === 0 ? outerR : innerR;
		const angle = (Math.PI * i) / points - Math.PI / 2;
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
}

/**
 * Draw a faction outline (1px colored border) around a sprite.
 * Drawn BEFORE the sprite to appear as a background glow.
 */
export function drawFactionOutline(
	ctx: CanvasRenderingContext2D,
	entityType: string,
	spriteW: number,
	spriteH: number,
): void {
	const def = EMBLEM_DEFS[entityType];
	if (!def) return;

	const color = FACTION_COLORS[def.faction] ?? FACTION_COLORS.neutral;
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.globalAlpha = 0.5;
	ctx.strokeRect(0.5, 0.5, spriteW - 1, spriteH - 1);
	ctx.globalAlpha = 1;
}

/**
 * Check if an entity type has a rank emblem defined.
 */
export function hasEmblem(entityType: string): boolean {
	return entityType in EMBLEM_DEFS;
}

/**
 * Get the faction color for an entity type.
 */
export function getFactionColor(entityType: string): string | undefined {
	const def = EMBLEM_DEFS[entityType];
	if (!def) return undefined;
	return FACTION_COLORS[def.faction];
}
