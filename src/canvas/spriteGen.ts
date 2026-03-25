/**
 * Procedural sprite generator — Canvas2D fillRect/fillStyle drawing.
 *
 * Maps ALL entity IDs from the ECS registry (src/entities/registry.ts) to
 * procedural drawing functions. Each entity type gets a dedicated or
 * category-based fallback drawing function producing pixel-art on an
 * off-screen canvas, then scaled up (units 2.5×, buildings 3×).
 *
 * Usage:
 *   import { initSprites, getSprite, spriteCache } from '@/canvas/spriteGen';
 *   initSprites();            // call once at boot
 *   const canvas = getSprite('river_rat');
 */

// ─── Palette ───

const PAL = {
  // Otter / URA faction
  otterBase: '#78350f',
  otterBelly: '#b45309',
  otterNose: '#000000',
  uraFaction: '#4a7c59',
  // Scale-Guard faction
  gatorBase: '#166534',
  gatorLight: '#22c55e',
  gatorEye: '#fef08a',
  snakeBase: '#65a30d',
  snakeStripe: '#facc15',
  sgFaction: '#8b4513',
  // Environment
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
  // Building faction tints
  uraBldg: '#5a5a3a',
  sgBldg: '#6b3a3a',
  // Hero accent
  gold: '#ffd700',
  // Resource colors
  fishBlue: '#4488cc',
  intelGold: '#ffcc00',
  timberGreen: '#2d5a1e',
  salvageTan: '#8a7b6b',
  crateSienna: '#a0522d',
} as const;

// ─── Seeded PRNG for deterministic sprite decoration ───

let _seed = 42;
function seedRng(s: number): void { _seed = s; }
function srand(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

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

// ─── Shared otter body base ───

/** Draw the base otter body at 16x16: head, torso, belly, eyes, nose, arms, legs, tail. */
function drawOtterBase(ctx: Ctx): void {
  rect(ctx, 5, 4, 6, 8, PAL.otterBase);    // torso
  rect(ctx, 6, 5, 4, 6, PAL.otterBelly);    // belly
  rect(ctx, 5, 2, 6, 4, PAL.otterBase);     // head
  p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black); // eyes
  p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose); // nose
  rect(ctx, 4, 5, 1, 4, PAL.otterBase);     // left arm
  rect(ctx, 11, 5, 1, 4, PAL.otterBase);    // right arm
  rect(ctx, 5, 12, 2, 2, PAL.otterBase);    // left foot
  rect(ctx, 9, 12, 2, 2, PAL.otterBase);    // right foot
}

// ─── Detailed drawing functions (ported from POC, adapted to real IDs) ───

function drawOtterWorker(ctx: Ctx): void {
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
  rect(ctx, 3, 5, 2, 2, PAL.clamShell); // carrying basket
}

function drawOtterInfantry(ctx: Ctx): void {
  rect(ctx, 5, 4, 6, 8, PAL.otterBase);
  rect(ctx, 6, 5, 4, 6, PAL.otterBelly);
  rect(ctx, 5, 2, 6, 4, PAL.otterBase);
  p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black);
  p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose);
  rect(ctx, 4, 5, 1, 4, PAL.otterBase);
  rect(ctx, 11, 5, 1, 4, PAL.otterBase);
  rect(ctx, 5, 12, 2, 2, PAL.otterBase);
  rect(ctx, 9, 12, 2, 2, PAL.otterBase);
  rect(ctx, 12, 4, 2, 7, PAL.reedBrown); // weapon
  rect(ctx, 6, 1, 4, 2, PAL.clamShell);  // helmet
}

function drawOtterRanged(ctx: Ctx): void {
  rect(ctx, 5, 4, 6, 8, PAL.otterBase);
  rect(ctx, 6, 5, 4, 6, PAL.otterBelly);
  rect(ctx, 5, 2, 6, 4, PAL.otterBase);
  p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black);
  p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose);
  rect(ctx, 4, 5, 1, 4, PAL.otterBase);
  rect(ctx, 11, 5, 1, 4, PAL.otterBase);
  rect(ctx, 5, 12, 2, 2, PAL.otterBase);
  rect(ctx, 9, 12, 2, 2, PAL.otterBase);
  rect(ctx, 13, 4, 1, 8, PAL.reedBrown); // rifle
  rect(ctx, 12, 4, 1, 1, PAL.stoneL);
  rect(ctx, 12, 11, 1, 1, PAL.stoneL);
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

function drawViper(ctx: Ctx): void {
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

// ─── Category-based fallback drawing functions ───

/** Generic unit: colored circle with faction tint + size indicator. */
function drawFallbackUnit(ctx: Ctx, color: string, size: 'sm' | 'md' | 'lg'): void {
  const r = size === 'sm' ? 4 : size === 'md' ? 5 : 6;
  circle(ctx, 8, 8, r, color);
  p(ctx, 7, 6, PAL.black); p(ctx, 9, 6, PAL.black); // eyes
}

/** Hero unit: same as faction unit but with gold border. */
function drawHeroUnit(ctx: Ctx, factionColor: string): void {
  circle(ctx, 8, 8, 6, factionColor);
  // Gold border ring
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    p(ctx, Math.round(8 + Math.cos(angle) * 6), Math.round(8 + Math.sin(angle) * 6), PAL.gold);
  }
  p(ctx, 7, 6, PAL.black); p(ctx, 9, 6, PAL.black); // eyes
  p(ctx, 8, 4, PAL.gold); // star marker
}

/** Generic building: colored rectangle with faction tint. */
function drawFallbackBuilding(ctx: Ctx, color: string, size: 'sm' | 'md' | 'lg'): void {
  const s = size === 'sm' ? 12 : size === 'md' ? 18 : 24;
  const off = (32 - s) / 2;
  rect(ctx, off, off, s, s, color);
  // Door
  rect(ctx, 14, off + s - 4, 4, 4, PAL.black);
}

/** Wall segment. */
function drawWall(ctx: Ctx, color: string): void {
  rect(ctx, 4, 12, 24, 8, color);
  rect(ctx, 4, 12, 24, 2, PAL.mudDark);
}

/** Resource: colored diamond/circle. */
function drawFallbackResource(ctx: Ctx, color: string): void {
  circle(ctx, 8, 8, 5, color);
  // Sparkle
  p(ctx, 6, 5, '#ffffff'); p(ctx, 10, 5, '#ffffff');
}

// ─── Detailed building drawing functions (ported from POC) ───

function drawLodge(ctx: Ctx): void {
  circle(ctx, 16, 20, 14, PAL.mudDark);
  for (let i = 0; i < 80; i++) p(ctx, 4 + srand() * 24, 8 + srand() * 24, PAL.mudLight);
  for (let i = 0; i < 40; i++) rect(ctx, 4 + srand() * 22, 10 + srand() * 18, 6, 2, PAL.otterBase);
  rect(ctx, 12, 22, 8, 8, PAL.black);
}

function drawTower(ctx: Ctx): void {
  rect(ctx, 8, 16, 16, 14, PAL.mudLight);
  for (let i = 0; i < 30; i++) p(ctx, 8 + srand() * 16, 16 + srand() * 14, PAL.mudDark);
  rect(ctx, 6, 8, 20, 8, PAL.mudDark);
  rect(ctx, 10, 4, 12, 4, PAL.reedGreen);
  rect(ctx, 14, 22, 4, 8, PAL.black);
  rect(ctx, 14, 12, 4, 2, PAL.black);
}

function drawBurrow(ctx: Ctx): void {
  circle(ctx, 16, 24, 8, PAL.mudDark);
  for (let i = 0; i < 20; i++) p(ctx, 8 + srand() * 16, 16 + srand() * 8, PAL.mudLight);
  rect(ctx, 14, 24, 4, 6, PAL.black);
}

function drawArmory(ctx: Ctx): void {
  rect(ctx, 4, 12, 24, 16, PAL.waterMid);
  rect(ctx, 2, 10, 28, 4, PAL.mudDark);
  rect(ctx, 2, 10, 4, 20, PAL.mudDark);
  rect(ctx, 26, 10, 4, 20, PAL.mudDark);
  rect(ctx, 2, 26, 28, 4, PAL.mudDark);
  for (let i = 0; i < 30; i++) {
    p(ctx, 2 + srand() * 28, 10 + srand() * 4, PAL.otterBase);
    p(ctx, 2 + srand() * 28, 26 + srand() * 4, PAL.otterBase);
  }
  rect(ctx, 12, 24, 8, 8, PAL.waterShallow);
}

function drawPredatorNest(ctx: Ctx): void {
  circle(ctx, 16, 16, 12, PAL.mudDark);
  circle(ctx, 16, 18, 8, PAL.black);
  rect(ctx, 6, 10, 2, 16, PAL.gatorBase);
  rect(ctx, 24, 12, 2, 14, PAL.gatorBase);
  rect(ctx, 10, 6, 2, 12, PAL.gatorBase);
  p(ctx, 14, 16, PAL.gatorEye); p(ctx, 18, 16, PAL.gatorEye);
}

// ─── Resource drawing functions (ported from POC) ───

function drawFishSpot(ctx: Ctx): void {
  circle(ctx, 8, 10, 6, PAL.waterShallow);
  rect(ctx, 5, 9, 2, 2, PAL.clamShell); p(ctx, 6, 9, PAL.stone);
  rect(ctx, 9, 11, 3, 2, PAL.clamShell); p(ctx, 10, 11, PAL.stone);
  rect(ctx, 7, 13, 2, 2, PAL.clamShell);
}

function drawMangroveTree(ctx: Ctx): void {
  rect(ctx, 7, 4, 2, 10, PAL.reedGreen);
  rect(ctx, 6, 2, 4, 6, PAL.reedBrown);
  p(ctx, 7, 1, PAL.otterBase); p(ctx, 8, 1, PAL.otterBase);
  p(ctx, 8, 12, PAL.reedGreen); p(ctx, 9, 11, PAL.reedGreen);
}

// ─── Sprite type registry (all 47 IDs from src/entities/registry.ts) ───

/** All entity types that have procedural sprites. */
export const SPRITE_TYPES = [
  // URA units (7)
  'river_rat', 'mudfoot', 'shellcracker', 'sapper', 'raftsman', 'mortar_otter', 'diver',
  // Scale-Guard units (8)
  'skink', 'gator', 'viper', 'snapper', 'scout_lizard', 'croc_champion', 'siphon_drone', 'serpent_king',
  // Heroes (6)
  'sgt_bubbles', 'gen_whiskers', 'cpl_splash', 'sgt_fang', 'medic_marina', 'pvt_muskrat',
  // URA buildings (12)
  'command_post', 'barracks', 'armory', 'watchtower', 'fish_trap', 'burrow', 'dock',
  'field_hospital', 'sandbag_wall', 'stone_wall', 'gun_tower', 'minefield',
  // Scale-Guard buildings (9)
  'flag_post', 'fuel_tank', 'great_siphon', 'sludge_pit', 'spawning_pool',
  'venom_spire', 'siphon', 'scale_wall', 'shield_generator',
  // Resources (5)
  'fish_spot', 'intel_marker', 'mangrove_tree', 'salvage_cache', 'supply_crate',
] as const;

export type SpriteType = (typeof SPRITE_TYPES)[number];

const BUILDING_TYPES = new Set<string>([
  'command_post', 'barracks', 'armory', 'watchtower', 'fish_trap', 'burrow', 'dock',
  'field_hospital', 'sandbag_wall', 'stone_wall', 'gun_tower', 'minefield',
  'flag_post', 'fuel_tank', 'great_siphon', 'sludge_pit', 'spawning_pool',
  'venom_spire', 'siphon', 'scale_wall', 'shield_generator',
]);

/** Draw functions keyed by entity type. */
const DRAW_FNS: Record<SpriteType, (ctx: Ctx) => void> = {
  // URA units — detailed drawings where available, fallbacks for the rest
  river_rat: drawOtterWorker,
  mudfoot: drawOtterInfantry,
  shellcracker: drawOtterRanged,
  sapper: (ctx) => {
    drawOtterBase(ctx);
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);  // tail
    // Sapper pack on back (explosive charge backpack)
    rect(ctx, 3, 4, 3, 5, PAL.stone);
    rect(ctx, 4, 5, 1, 3, PAL.stoneL);
    // Detonator in hand
    rect(ctx, 12, 6, 2, 3, PAL.reedBrown);
    p(ctx, 13, 6, PAL.clamMeat); // red button
    // Hard hat
    rect(ctx, 5, 1, 6, 2, PAL.stone);
    rect(ctx, 6, 0, 4, 1, PAL.stoneL);
  },
  raftsman: (ctx) => {
    drawOtterBase(ctx);
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);  // tail
    // Blue-tinted uniform (water specialist)
    rect(ctx, 6, 5, 4, 6, PAL.waterShallow);
    // Paddle held across body
    rect(ctx, 2, 3, 1, 10, PAL.reedBrown);
    rect(ctx, 1, 3, 3, 1, PAL.reedBrown);  // paddle blade top
    rect(ctx, 1, 12, 3, 1, PAL.reedBrown); // paddle blade bottom
    // Life vest
    rect(ctx, 5, 4, 2, 3, PAL.clamShell);
    rect(ctx, 9, 4, 2, 3, PAL.clamShell);
  },
  mortar_otter: (ctx) => {
    drawOtterBase(ctx);
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);  // tail
    // Mortar tube on shoulder
    rect(ctx, 12, 1, 2, 10, PAL.stone);
    rect(ctx, 11, 1, 4, 2, PAL.stoneL);  // mortar mouth
    p(ctx, 12, 0, PAL.clamMeat); // shell visible
    // Ammo pouch
    rect(ctx, 3, 7, 2, 3, PAL.stone);
    p(ctx, 4, 8, PAL.clamMeat); // shell
    // Helmet with chinstrap
    rect(ctx, 5, 1, 6, 2, PAL.stone);
  },
  diver: (ctx) => {
    // Sleek body in teal wetsuit
    rect(ctx, 5, 4, 6, 8, PAL.waterMid);     // wetsuit torso
    rect(ctx, 6, 5, 4, 6, PAL.waterShallow);  // wetsuit belly stripe
    rect(ctx, 5, 2, 6, 4, PAL.otterBase);     // face (fur visible)
    p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black); // eyes
    p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose);
    rect(ctx, 4, 5, 1, 4, PAL.waterMid);      // wetsuit arms
    rect(ctx, 11, 5, 1, 4, PAL.waterMid);
    rect(ctx, 5, 12, 2, 2, PAL.waterMid);     // flippers
    rect(ctx, 9, 12, 2, 2, PAL.waterMid);
    rect(ctx, 4, 12, 1, 2, PAL.waterShallow); // flipper extension
    rect(ctx, 11, 12, 1, 2, PAL.waterShallow);
    // Dive goggles
    rect(ctx, 5, 2, 2, 2, PAL.stoneL);        // left goggle
    rect(ctx, 9, 2, 2, 2, PAL.stoneL);        // right goggle
    rect(ctx, 7, 2, 2, 1, PAL.stone);         // bridge
    // Rebreather tube
    rect(ctx, 3, 4, 1, 4, PAL.stone);
    p(ctx, 2, 4, PAL.stoneL);
  },
  // Scale-Guard units
  skink: (ctx) => drawFallbackUnit(ctx, PAL.gatorLight, 'sm'),
  gator: drawGator,
  viper: drawViper,
  snapper: (ctx) => drawFallbackUnit(ctx, PAL.gatorBase, 'lg'),
  scout_lizard: (ctx) => drawFallbackUnit(ctx, PAL.snakeBase, 'sm'),
  croc_champion: (ctx) => drawFallbackUnit(ctx, PAL.gatorBase, 'lg'),
  siphon_drone: (ctx) => drawFallbackUnit(ctx, PAL.waterDeep, 'sm'),
  serpent_king: (ctx) => drawFallbackUnit(ctx, PAL.snakeBase, 'lg'),
  // Heroes — gold-rimmed faction units
  sgt_bubbles: (ctx) => drawHeroUnit(ctx, PAL.uraFaction),
  gen_whiskers: (ctx) => drawHeroUnit(ctx, PAL.uraFaction),
  cpl_splash: (ctx) => drawHeroUnit(ctx, PAL.uraFaction),
  sgt_fang: (ctx) => drawHeroUnit(ctx, PAL.sgFaction),
  medic_marina: (ctx) => drawHeroUnit(ctx, PAL.uraFaction),
  pvt_muskrat: (ctx) => drawHeroUnit(ctx, PAL.uraFaction),
  // URA buildings — detailed where available, fallbacks for rest
  command_post: drawLodge,
  barracks: (ctx) => drawFallbackBuilding(ctx, PAL.uraBldg, 'lg'),
  armory: drawArmory,
  watchtower: drawTower,
  fish_trap: (ctx) => drawFallbackBuilding(ctx, PAL.waterShallow, 'sm'),
  burrow: drawBurrow,
  dock: (ctx) => drawFallbackBuilding(ctx, PAL.otterBase, 'md'),
  field_hospital: (ctx) => drawFallbackBuilding(ctx, PAL.uraBldg, 'md'),
  sandbag_wall: (ctx) => drawWall(ctx, PAL.mudLight),
  stone_wall: (ctx) => drawWall(ctx, PAL.stone),
  gun_tower: drawTower,
  minefield: (ctx) => drawFallbackBuilding(ctx, PAL.mudDark, 'sm'),
  // Scale-Guard buildings
  flag_post: (ctx) => drawFallbackBuilding(ctx, PAL.sgBldg, 'sm'),
  fuel_tank: (ctx) => drawFallbackBuilding(ctx, PAL.sgBldg, 'md'),
  great_siphon: (ctx) => drawFallbackBuilding(ctx, PAL.waterDeep, 'lg'),
  sludge_pit: (ctx) => drawFallbackBuilding(ctx, PAL.mudDark, 'md'),
  spawning_pool: drawPredatorNest,
  venom_spire: (ctx) => drawFallbackBuilding(ctx, PAL.snakeBase, 'md'),
  siphon: (ctx) => drawFallbackBuilding(ctx, PAL.waterDeep, 'sm'),
  scale_wall: (ctx) => drawWall(ctx, PAL.gatorBase),
  shield_generator: (ctx) => drawFallbackBuilding(ctx, PAL.sgBldg, 'lg'),
  // Resources
  fish_spot: drawFishSpot,
  intel_marker: (ctx) => drawFallbackResource(ctx, PAL.intelGold),
  mangrove_tree: drawMangroveTree,
  salvage_cache: (ctx) => drawFallbackResource(ctx, PAL.salvageTan),
  supply_crate: (ctx) => drawFallbackResource(ctx, PAL.crateSienna),
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

  // Seed RNG deterministically per entity type for consistent decoration
  seedRng(type.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0));

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
