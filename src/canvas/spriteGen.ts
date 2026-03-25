/**
 * Procedural sprite generator — Canvas2D fillRect/fillStyle drawing.
 *
 * Follows the POC's SpriteGen.generate() pattern (docs/references/poc_final.html L177-248).
 * Each entity type gets a dedicated drawing function producing pixel-art on an
 * off-screen canvas, then scaled up (units 2.5×, buildings 3×).
 *
 * Usage:
 *   import { initSprites, getSprite, spriteCache } from '@/canvas/spriteGen';
 *   initSprites();            // call once at boot
 *   const canvas = getSprite('gatherer');
 */

// ─── POC Palette (matches docs/references/poc_final.html L125-135) ───

const PAL = {
  otterBase: '#78350f',
  otterBelly: '#b45309',
  otterNose: '#000000',
  gatorBase: '#166534',
  gatorLight: '#22c55e',
  gatorEye: '#fef08a',
  snakeBase: '#65a30d',
  snakeStripe: '#facc15',
  waterDeep: '#0f2b32',
  waterMid: '#11525c',
  waterShallow: '#1e3a5f',
  mudDark: '#451a03',
  mudLight: '#713f12',
  clamShell: '#cbd5e1',
  clamMeat: '#f87171',
  reedGreen: '#4ade80',
  reedBrown: '#92400e',
  stone: '#4b5563',
  stoneL: '#9ca3af',
  shadow: 'rgba(0,0,0,0.3)',
  black: '#000000',
} as const;

// ─── Drawing helpers ───

type Ctx = CanvasRenderingContext2D;

function p(ctx: Ctx, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function circle(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) p(ctx, cx + x, cy + y, color);
    }
  }
}

// ─── Entity drawing functions ───

function drawOtterUnit(ctx: Ctx, type: 'gatherer' | 'brawler' | 'sniper'): void {
  rect(ctx, 5, 4, 6, 8, PAL.otterBase);
  rect(ctx, 6, 5, 4, 6, PAL.otterBelly);
  rect(ctx, 5, 2, 6, 4, PAL.otterBase);
  p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black);
  p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose);
  rect(ctx, 4, 5, 1, 4, PAL.otterBase);
  rect(ctx, 11, 5, 1, 4, PAL.otterBase);
  rect(ctx, 5, 12, 2, 2, PAL.otterBase);
  rect(ctx, 9, 12, 2, 2, PAL.otterBase);
  rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  if (type === 'gatherer') { rect(ctx, 3, 5, 2, 2, PAL.clamShell); }
  if (type === 'brawler') {
    rect(ctx, 12, 4, 2, 7, PAL.reedBrown);
    rect(ctx, 6, 1, 4, 2, PAL.clamShell);
  }
  if (type === 'sniper') {
    rect(ctx, 13, 4, 1, 8, PAL.reedBrown);
    rect(ctx, 12, 4, 1, 1, PAL.stoneL);
    rect(ctx, 12, 11, 1, 1, PAL.stoneL);
  }
}

function drawGator(ctx: Ctx): void {
  rect(ctx, 3, 10, 10, 4, PAL.gatorBase);
  for (let i = 3; i < 12; i += 2) p(ctx, i, 9, PAL.gatorLight);
  rect(ctx, 13, 11, 3, 2, PAL.gatorBase);
  rect(ctx, 0, 11, 4, 3, PAL.gatorLight);
  p(ctx, 3, 10, PAL.gatorEye);
  rect(ctx, 3, 14, 2, 1, PAL.gatorLight);
  rect(ctx, 9, 14, 2, 1, PAL.gatorLight);
}

function drawSnake(ctx: Ctx): void {
  rect(ctx, 4, 12, 8, 2, PAL.snakeBase);
  rect(ctx, 2, 10, 4, 2, PAL.snakeBase);
  rect(ctx, 10, 10, 4, 2, PAL.snakeBase);
  rect(ctx, 12, 8, 2, 2, PAL.snakeBase);
  p(ctx, 13, 8, PAL.black);
  p(ctx, 14, 9, PAL.clamMeat);
  p(ctx, 5, 12, PAL.snakeStripe);
  p(ctx, 7, 12, PAL.snakeStripe);
  p(ctx, 9, 12, PAL.snakeStripe);
}

function drawCattail(ctx: Ctx): void {
  rect(ctx, 7, 4, 2, 10, PAL.reedGreen);
  rect(ctx, 6, 2, 4, 6, PAL.reedBrown);
  p(ctx, 7, 1, PAL.otterBase); p(ctx, 8, 1, PAL.otterBase);
  p(ctx, 8, 12, PAL.reedGreen); p(ctx, 9, 11, PAL.reedGreen);
}

function drawClambed(ctx: Ctx): void {
  circle(ctx, 8, 10, 6, PAL.waterShallow);
  rect(ctx, 5, 9, 2, 2, PAL.clamShell); p(ctx, 6, 9, PAL.stone);
  rect(ctx, 9, 11, 3, 2, PAL.clamShell); p(ctx, 10, 11, PAL.stone);
  rect(ctx, 7, 13, 2, 2, PAL.clamShell);
}

function drawTower(ctx: Ctx): void {
  rect(ctx, 8, 16, 16, 14, PAL.mudLight);
  for (let i = 0; i < 30; i++) p(ctx, 8 + Math.random() * 16, 16 + Math.random() * 14, PAL.mudDark);
  rect(ctx, 6, 8, 20, 8, PAL.mudDark);
  rect(ctx, 10, 4, 12, 4, PAL.reedGreen);
  rect(ctx, 14, 22, 4, 8, PAL.black);
  rect(ctx, 14, 12, 4, 2, PAL.black);
}

function drawPredatorNest(ctx: Ctx): void {
  circle(ctx, 16, 16, 12, PAL.mudDark);
  circle(ctx, 16, 18, 8, PAL.black);
  rect(ctx, 6, 10, 2, 16, PAL.gatorBase);
  rect(ctx, 24, 12, 2, 14, PAL.gatorBase);
  rect(ctx, 10, 6, 2, 12, PAL.gatorBase);
  p(ctx, 14, 16, PAL.gatorEye); p(ctx, 18, 16, PAL.gatorEye);
}

function drawLodge(ctx: Ctx): void {
  circle(ctx, 16, 20, 14, PAL.mudDark);
  for (let i = 0; i < 80; i++) p(ctx, 4 + Math.random() * 24, 8 + Math.random() * 24, PAL.mudLight);
  for (let i = 0; i < 40; i++) rect(ctx, 4 + Math.random() * 22, 10 + Math.random() * 18, 6, 2, PAL.otterBase);
  rect(ctx, 12, 22, 8, 8, PAL.black);
}



function drawBurrow(ctx: Ctx): void {
  circle(ctx, 16, 24, 8, PAL.mudDark);
  for (let i = 0; i < 20; i++) p(ctx, 8 + Math.random() * 16, 16 + Math.random() * 8, PAL.mudLight);
  rect(ctx, 14, 24, 4, 6, PAL.black);
}

function drawArmory(ctx: Ctx): void {
  rect(ctx, 4, 12, 24, 16, PAL.waterMid);
  rect(ctx, 2, 10, 28, 4, PAL.mudDark);
  rect(ctx, 2, 10, 4, 20, PAL.mudDark);
  rect(ctx, 26, 10, 4, 20, PAL.mudDark);
  rect(ctx, 2, 26, 28, 4, PAL.mudDark);
  for (let i = 0; i < 30; i++) {
    p(ctx, 2 + Math.random() * 28, 10 + Math.random() * 4, PAL.otterBase);
    p(ctx, 2 + Math.random() * 28, 26 + Math.random() * 4, PAL.otterBase);
  }
  rect(ctx, 12, 24, 8, 8, PAL.waterShallow);
}

// ─── Sprite type registry ───

/** All entity types that have procedural sprites. */
export const SPRITE_TYPES = [
  'gatherer', 'brawler', 'sniper',
  'gator', 'snake',
  'cattail', 'clambed',
  'lodge', 'burrow', 'armory', 'tower', 'predator_nest',
] as const;

export type SpriteType = (typeof SPRITE_TYPES)[number];

const BUILDING_TYPES = new Set<string>(['lodge', 'burrow', 'armory', 'tower', 'predator_nest']);

/** Draw functions keyed by entity type. */
const DRAW_FNS: Record<SpriteType, (ctx: Ctx) => void> = {
  gatherer: (ctx) => drawOtterUnit(ctx, 'gatherer'),
  brawler: (ctx) => drawOtterUnit(ctx, 'brawler'),
  sniper: (ctx) => drawOtterUnit(ctx, 'sniper'),
  gator: drawGator,
  snake: drawSnake,
  cattail: drawCattail,
  clambed: drawClambed,
  lodge: drawLodge,
  burrow: drawBurrow,
  armory: drawArmory,
  tower: drawTower,
  predator_nest: drawPredatorNest,
};

// ─── Sprite cache ───

/** Generated sprite cache: entity type → scaled HTMLCanvasElement. */
export const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * Generate a single sprite for the given entity type.
 * Returns the scaled canvas (units: 16×2.5 = 40px, buildings: 32×3 = 96px).
 */
export function generateSprite(type: SpriteType): HTMLCanvasElement {
  const isBuilding = BUILDING_TYPES.has(type);
  const size = isBuilding ? 32 : 16;
  const scale = isBuilding ? 3 : 2.5;

  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error(`Canvas2D context unavailable for sprite "${type}"`);

  // Draw at native resolution
  const drawFn = DRAW_FNS[type];
  drawFn(ctx);

  // Scale up with nearest-neighbor
  const sCanvas = document.createElement('canvas');
  sCanvas.width = size * scale;
  sCanvas.height = size * scale;
  const sCtx = sCanvas.getContext('2d');
  if (!sCtx) throw new Error(`Canvas2D context unavailable for scaled sprite "${type}"`);
  sCtx.imageSmoothingEnabled = false;
  sCtx.drawImage(c, 0, 0, size * scale, size * scale);

  return sCanvas;
}

/**
 * Retrieve a cached sprite. Returns undefined if initSprites() hasn't run.
 */
export function getSprite(type: string): HTMLCanvasElement | undefined {
  return spriteCache.get(type);
}

/**
 * Generate all sprites and populate the cache.
 * Designed to complete in <50 ms on modern hardware.
 */
export function initSprites(): void {
  spriteCache.clear();
  for (const type of SPRITE_TYPES) {
    spriteCache.set(type, generateSprite(type));
  }
}
