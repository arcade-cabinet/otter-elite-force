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
  goldLight: '#ffe44d',
  // Resource colors
  fishBlue: '#4488cc',
  intelGold: '#ffcc00',
  timberGreen: '#2d5a1e',
  salvageTan: '#8a7b6b',
  crateSienna: '#a0522d',
} as const;

import { createNoise, hashString } from "@/utils/noise";

// Design noise instance — reset per entity type in generateSprite()
let _noise = createNoise(1);

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

// ─── Hero + utility drawing functions ───

// drawHeroUnit DELETED — all heroes have dedicated drawings with unique gear.

/** Wall segment. */
function drawWall(ctx: Ctx, color: string): void {
  rect(ctx, 4, 12, 24, 8, color);
  rect(ctx, 4, 12, 24, 2, PAL.mudDark);
}

/** Resource: colored diamond/circle. */
// All fallback drawing functions DELETED — every entity MUST have dedicated art.
// If a sprite ID has no drawing function, generateSprite() will throw.

// ─── Detailed building drawing functions (ported from POC) ───

function drawLodge(ctx: Ctx): void {
  circle(ctx, 16, 20, 14, PAL.mudDark);
  for (let i = 0; i < 80; i++) p(ctx, 4 + _noise.next() * 24, 8 + _noise.next() * 24, PAL.mudLight);
  for (let i = 0; i < 40; i++) rect(ctx, 4 + _noise.next() * 22, 10 + _noise.next() * 18, 6, 2, PAL.otterBase);
  rect(ctx, 12, 22, 8, 8, PAL.black);
}

function drawTower(ctx: Ctx): void {
  rect(ctx, 8, 16, 16, 14, PAL.mudLight);
  for (let i = 0; i < 30; i++) p(ctx, 8 + _noise.next() * 16, 16 + _noise.next() * 14, PAL.mudDark);
  rect(ctx, 6, 8, 20, 8, PAL.mudDark);
  rect(ctx, 10, 4, 12, 4, PAL.reedGreen);
  rect(ctx, 14, 22, 4, 8, PAL.black);
  rect(ctx, 14, 12, 4, 2, PAL.black);
}

function drawBurrow(ctx: Ctx): void {
  circle(ctx, 16, 24, 8, PAL.mudDark);
  for (let i = 0; i < 20; i++) p(ctx, 8 + _noise.next() * 16, 16 + _noise.next() * 8, PAL.mudLight);
  rect(ctx, 14, 24, 4, 6, PAL.black);
}

function drawArmory(ctx: Ctx): void {
  rect(ctx, 4, 12, 24, 16, PAL.waterMid);
  rect(ctx, 2, 10, 28, 4, PAL.mudDark);
  rect(ctx, 2, 10, 4, 20, PAL.mudDark);
  rect(ctx, 26, 10, 4, 20, PAL.mudDark);
  rect(ctx, 2, 26, 28, 4, PAL.mudDark);
  for (let i = 0; i < 30; i++) {
    p(ctx, 2 + _noise.next() * 28, 10 + _noise.next() * 4, PAL.otterBase);
    p(ctx, 2 + _noise.next() * 28, 26 + _noise.next() * 4, PAL.otterBase);
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
  // Scale-Guard units — each a distinct reptile silhouette
  skink: (ctx) => {
    // Small worker lizard — thin, quick, low to ground
    rect(ctx, 4, 10, 8, 3, PAL.gatorLight);      // body
    rect(ctx, 12, 11, 3, 1, PAL.gatorLight);      // tail
    rect(ctx, 2, 11, 2, 2, PAL.gatorLight);       // head
    p(ctx, 2, 11, PAL.gatorEye);                   // eye
    rect(ctx, 5, 13, 2, 1, PAL.gatorLight);       // front legs
    rect(ctx, 9, 13, 2, 1, PAL.gatorLight);       // back legs
  },
  gator: drawGator,
  viper: drawViper,
  snapper: (ctx) => {
    // Armored turtle-like turret — domed shell, stubby legs, no movement
    circle(ctx, 8, 8, 6, PAL.gatorBase);           // shell dome
    circle(ctx, 8, 8, 4, PAL.gatorLight);          // inner shell
    // Shell segments
    rect(ctx, 5, 6, 6, 1, PAL.gatorBase);
    rect(ctx, 6, 9, 4, 1, PAL.gatorBase);
    // Head poking out front
    rect(ctx, 2, 8, 3, 3, PAL.gatorBase);
    p(ctx, 2, 8, PAL.gatorEye);
    // Stubby legs
    rect(ctx, 4, 13, 2, 2, PAL.gatorBase);
    rect(ctx, 10, 13, 2, 2, PAL.gatorBase);
    // Ranged projectile indicator
    rect(ctx, 14, 7, 2, 1, PAL.stoneL);           // barrel
  },
  scout_lizard: (ctx) => {
    // Fast, thin lizard — long tail, alert posture, upright
    rect(ctx, 6, 6, 4, 6, PAL.snakeBase);         // upright body
    rect(ctx, 5, 3, 6, 4, PAL.snakeBase);         // head (bigger for alertness)
    p(ctx, 6, 4, PAL.gatorEye);                    // left eye (large, alert)
    p(ctx, 9, 4, PAL.gatorEye);                    // right eye
    rect(ctx, 7, 12, 2, 3, PAL.snakeBase);        // legs
    rect(ctx, 4, 12, 2, 1, PAL.snakeBase);        // splayed foot
    rect(ctx, 10, 12, 2, 1, PAL.snakeBase);
    // Long thin tail
    rect(ctx, 6, 12, 1, 1, PAL.snakeBase);
    rect(ctx, 5, 13, 1, 2, PAL.snakeBase);
    rect(ctx, 4, 14, 1, 2, PAL.snakeStripe);
    // Alert crest/frill
    p(ctx, 5, 3, PAL.snakeStripe);
    p(ctx, 10, 3, PAL.snakeStripe);
  },
  croc_champion: (ctx) => {
    // HUGE crocodile — fills the 16x16 frame, armored, terrifying
    rect(ctx, 1, 8, 14, 6, PAL.gatorBase);        // massive body
    for (let i = 1; i < 14; i += 2) p(ctx, i, 7, PAL.gatorLight); // dorsal ridges
    rect(ctx, 0, 9, 3, 5, PAL.gatorLight);        // snout
    p(ctx, 0, 9, PAL.gatorEye);                    // eye
    p(ctx, 0, 11, PAL.gatorEye);                   // second eye
    // Jaw with visible teeth
    rect(ctx, 0, 13, 3, 1, PAL.gatorLight);
    for (let i = 0; i < 3; i++) p(ctx, i, 14, PAL.clamShell); // teeth
    // Tail curving back
    rect(ctx, 14, 9, 2, 4, PAL.gatorBase);
    rect(ctx, 15, 8, 1, 2, PAL.gatorBase);
    // Heavy legs
    rect(ctx, 3, 14, 3, 2, PAL.gatorBase);
    rect(ctx, 10, 14, 3, 2, PAL.gatorBase);
    // Armor plates on back (champion is armored)
    rect(ctx, 4, 7, 3, 2, PAL.stone);
    rect(ctx, 9, 7, 3, 2, PAL.stone);
  },
  siphon_drone: (ctx) => {
    // Mechanical/organic hybrid — small hovering drone with tentacles
    circle(ctx, 8, 6, 4, PAL.waterDeep);           // body orb
    circle(ctx, 8, 6, 2, PAL.waterMid);            // inner glow
    p(ctx, 7, 5, PAL.gatorEye);                    // eye
    p(ctx, 9, 5, PAL.gatorEye);
    // Tentacle-like appendages hanging down
    rect(ctx, 5, 10, 1, 4, PAL.gatorBase);
    rect(ctx, 8, 10, 1, 5, PAL.gatorBase);
    rect(ctx, 11, 10, 1, 4, PAL.gatorBase);
    // Energy ring
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      p(ctx, Math.round(8 + Math.cos(angle) * 5), Math.round(6 + Math.sin(angle) * 5), PAL.waterShallow);
    }
  },
  serpent_king: (ctx) => {
    // BOSS — massive snake coiled, crown, glowing eyes
    // Coiled body fills the frame
    circle(ctx, 8, 10, 6, PAL.snakeBase);          // coil
    circle(ctx, 8, 10, 4, PAL.snakeStripe);        // inner coil
    circle(ctx, 8, 10, 2, PAL.snakeBase);          // center
    // Head rising above coils
    rect(ctx, 5, 2, 6, 5, PAL.snakeBase);
    p(ctx, 6, 3, PAL.clamMeat);                    // glowing red eye
    p(ctx, 9, 3, PAL.clamMeat);
    // Crown
    p(ctx, 6, 1, PAL.gold);
    p(ctx, 8, 0, PAL.gold);
    p(ctx, 10, 1, PAL.gold);
    p(ctx, 7, 1, PAL.goldLight);
    p(ctx, 9, 1, PAL.goldLight);
    // Forked tongue
    p(ctx, 7, 7, PAL.clamMeat);
    p(ctx, 9, 7, PAL.clamMeat);
  },
  // Heroes — gold-rimmed faction units
  sgt_bubbles: (ctx) => {
    // Rambo otter — red bandana, fighting stick, gold star
    drawOtterBase(ctx);
    rect(ctx, 5, 1, 6, 2, PAL.clamMeat);          // red bandana
    p(ctx, 4, 2, PAL.clamMeat);                    // bandana tails
    p(ctx, 11, 2, PAL.clamMeat);
    rect(ctx, 12, 3, 2, 8, PAL.reedBrown);         // fighting stick
    p(ctx, 8, 1, PAL.gold);                         // gold star (hero marker)
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);         // tail
  },
  gen_whiskers: (ctx) => {
    // Grizzled general — beret, cigar, medals
    drawOtterBase(ctx);
    rect(ctx, 4, 1, 8, 3, PAL.uraBldg);            // dark beret
    circle(ctx, 6, 2, 1, PAL.gold);                 // beret badge
    rect(ctx, 10, 6, 4, 1, PAL.reedBrown);          // cigar
    p(ctx, 13, 6, PAL.clamMeat);                     // cigar tip
    p(ctx, 7, 10, PAL.gold);                         // medal
    p(ctx, 9, 10, PAL.goldLight);                    // medal
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  },
  cpl_splash: (ctx) => {
    // Young diver — goggles, teal wetsuit
    rect(ctx, 5, 4, 6, 8, PAL.waterMid);            // teal wetsuit body
    rect(ctx, 6, 5, 4, 6, PAL.waterShallow);
    rect(ctx, 5, 2, 6, 4, PAL.otterBase);           // head (fur)
    p(ctx, 6, 3, PAL.black); p(ctx, 9, 3, PAL.black);
    p(ctx, 7, 4, PAL.otterNose); p(ctx, 8, 4, PAL.otterNose);
    rect(ctx, 4, 5, 1, 4, PAL.waterMid);
    rect(ctx, 11, 5, 1, 4, PAL.waterMid);
    rect(ctx, 5, 12, 2, 2, PAL.waterMid);
    rect(ctx, 9, 12, 2, 2, PAL.waterMid);
    // Goggles on forehead
    rect(ctx, 5, 1, 2, 2, PAL.stoneL);
    rect(ctx, 9, 1, 2, 2, PAL.stoneL);
    p(ctx, 8, 0, PAL.gold);                          // hero star
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  },
  sgt_fang: (ctx) => {
    // Heavy siege otter — helmet, bulky, jaw scars
    drawOtterBase(ctx);
    rect(ctx, 4, 0, 8, 3, PAL.stone);               // heavy helmet
    rect(ctx, 3, 2, 10, 2, PAL.stone);              // helmet brim
    // Wider jaw (heavy build)
    rect(ctx, 4, 6, 8, 3, PAL.otterBase);
    // Scars
    p(ctx, 10, 4, PAL.clamMeat);
    p(ctx, 11, 5, PAL.clamMeat);
    // Heavy weapon
    rect(ctx, 12, 2, 3, 9, PAL.stone);
    rect(ctx, 13, 1, 1, 2, PAL.stoneL);
    p(ctx, 8, 1, PAL.gold);                          // hero star
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  },
  medic_marina: (ctx) => {
    // Field medic — white cap, red cross, med kit
    drawOtterBase(ctx);
    rect(ctx, 5, 0, 6, 3, PAL.clamShell);           // white cap
    rect(ctx, 7, 0, 2, 2, PAL.clamMeat);            // red cross on cap
    rect(ctx, 6, 1, 4, 1, PAL.clamMeat);
    // White coat over body
    rect(ctx, 5, 6, 6, 6, PAL.clamShell);
    // Red cross on coat
    rect(ctx, 7, 8, 2, 3, PAL.clamMeat);
    rect(ctx, 6, 9, 4, 1, PAL.clamMeat);
    // Med kit in hand
    rect(ctx, 12, 6, 3, 3, PAL.clamShell);
    p(ctx, 13, 7, PAL.clamMeat);
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  },
  pvt_muskrat: (ctx) => {
    // Demolitions expert — cap with bomb, charge pack
    drawOtterBase(ctx);
    rect(ctx, 5, 0, 6, 3, PAL.uraBldg);             // cap
    rect(ctx, 7, 1, 2, 1, PAL.gold);                 // bomb emblem
    p(ctx, 8, 0, PAL.clamMeat);                      // fuse spark
    // Explosive pack on back
    rect(ctx, 3, 4, 3, 4, PAL.stone);
    rect(ctx, 4, 5, 1, 2, PAL.clamMeat);             // blasting cap
    // Detonator
    rect(ctx, 12, 5, 2, 4, PAL.reedBrown);
    p(ctx, 13, 5, PAL.clamMeat);                     // red button
    rect(ctx, 11, 10, 3, 2, PAL.otterBase);
  },
  // URA buildings — detailed where available, fallbacks for rest
  command_post: drawLodge,
  barracks: (ctx) => {
    // Military training hall — long wooden structure with peaked roof
    rect(ctx, 4, 16, 24, 12, PAL.mudLight);     // walls
    for (let i = 0; i < 20; i++) p(ctx, 4 + _noise.next() * 24, 16 + _noise.next() * 12, PAL.mudDark); // wood grain
    rect(ctx, 2, 12, 28, 4, PAL.uraBldg);       // roof base
    // Peaked roof (triangle)
    for (let y = 0; y < 6; y++) {
      const w = 28 - y * 4;
      rect(ctx, 16 - w / 2, 12 - y, w, 1, PAL.uraBldg);
    }
    rect(ctx, 12, 22, 8, 8, PAL.black);          // door
    // Training dummy silhouette in doorway
    rect(ctx, 14, 23, 4, 5, PAL.reedBrown);
    p(ctx, 15, 22, PAL.clamShell);                // dummy head
    p(ctx, 17, 22, PAL.clamShell);
    // Weapon rack on side
    rect(ctx, 26, 18, 2, 6, PAL.reedBrown);
    rect(ctx, 27, 17, 1, 1, PAL.stoneL);
    rect(ctx, 27, 20, 1, 1, PAL.stoneL);
  },
  armory: drawArmory,
  watchtower: drawTower,
  fish_trap: (ctx) => {
    // Woven basket trap in shallow water — nets, wooden frame
    circle(ctx, 16, 20, 8, PAL.waterShallow);    // water circle
    // Woven basket
    rect(ctx, 10, 16, 12, 10, PAL.reedBrown);
    for (let i = 0; i < 5; i++) rect(ctx, 11, 17 + i * 2, 10, 1, PAL.otterBase); // weave lines
    // Stakes
    rect(ctx, 8, 14, 2, 14, PAL.reedBrown);
    rect(ctx, 22, 14, 2, 14, PAL.reedBrown);
    // Fish visible
    p(ctx, 14, 20, PAL.clamShell);
    p(ctx, 18, 22, PAL.clamShell);
  },
  burrow: drawBurrow,
  dock: (ctx) => {
    // Wooden pier extending into water — planks, mooring posts
    rect(ctx, 0, 16, 32, 16, PAL.waterShallow);  // water
    rect(ctx, 4, 12, 24, 4, PAL.reedBrown);      // main pier deck
    for (let i = 0; i < 8; i++) rect(ctx, 5 + i * 3, 12, 2, 4, PAL.otterBase); // planks
    // Mooring posts
    rect(ctx, 2, 8, 3, 8, PAL.reedBrown);
    rect(ctx, 27, 8, 3, 8, PAL.reedBrown);
    // Rope
    for (let i = 0; i < 5; i++) p(ctx, 5 + i * 2, 11, PAL.clamShell);
    // Boat silhouette
    rect(ctx, 8, 18, 16, 6, PAL.otterBase);
    rect(ctx, 6, 20, 2, 2, PAL.otterBase);       // prow
  },
  field_hospital: (ctx) => {
    // White tent with red cross — medical facility
    rect(ctx, 4, 14, 24, 14, PAL.clamShell);     // white tent body
    // Tent roof (peaked)
    for (let y = 0; y < 8; y++) {
      const w = 26 - y * 2;
      rect(ctx, 16 - w / 2, 14 - y, w, 1, PAL.clamShell);
    }
    rect(ctx, 14, 6, 4, 2, PAL.clamMeat);        // red cross top
    rect(ctx, 12, 8, 8, 2, PAL.clamMeat);        // red cross horizontal
    rect(ctx, 14, 10, 4, 2, PAL.clamMeat);       // red cross bottom
    // Door flaps
    rect(ctx, 12, 22, 4, 8, PAL.stoneL);
    rect(ctx, 16, 22, 4, 8, PAL.stoneL);
    // Ground
    rect(ctx, 2, 28, 28, 4, PAL.mudLight);
  },
  sandbag_wall: (ctx) => drawWall(ctx, PAL.mudLight),
  stone_wall: (ctx) => drawWall(ctx, PAL.stone),
  gun_tower: drawTower,
  minefield: (ctx) => {
    // Buried mines — dirt mounds with warning signs
    rect(ctx, 2, 20, 28, 10, PAL.mudDark);       // dirt patch
    for (let i = 0; i < 15; i++) p(ctx, 4 + _noise.next() * 24, 20 + _noise.next() * 10, PAL.mudLight);
    // Mine shapes (dome bumps)
    circle(ctx, 10, 24, 3, PAL.stone);
    circle(ctx, 22, 22, 3, PAL.stone);
    circle(ctx, 16, 26, 3, PAL.stone);
    // Warning stakes
    rect(ctx, 6, 14, 2, 8, PAL.reedBrown);
    rect(ctx, 4, 14, 6, 2, PAL.clamMeat);        // danger sign
    rect(ctx, 24, 16, 2, 6, PAL.reedBrown);
  },
  // Scale-Guard buildings
  flag_post: (ctx) => {
    // Scale-Guard control point — tall pole with SG banner
    rect(ctx, 15, 4, 2, 24, PAL.reedBrown);      // pole
    rect(ctx, 17, 4, 10, 7, PAL.clamMeat);        // red banner
    rect(ctx, 18, 5, 8, 5, PAL.sgBldg);           // darker stripe
    // Skull emblem on banner
    p(ctx, 21, 6, PAL.clamShell);
    p(ctx, 23, 6, PAL.clamShell);
    p(ctx, 22, 7, PAL.clamShell);
    // Base stones
    rect(ctx, 10, 26, 12, 4, PAL.stone);
    rect(ctx, 12, 24, 8, 2, PAL.stoneL);
  },
  fuel_tank: (ctx) => {
    // Cylindrical metal tank — riveted, hazard markings
    rect(ctx, 6, 8, 20, 18, PAL.stone);           // tank body
    rect(ctx, 8, 10, 16, 14, PAL.stoneL);         // lighter panel
    // Rivets along edges
    for (let i = 0; i < 4; i++) {
      p(ctx, 7, 10 + i * 4, PAL.clamShell);
      p(ctx, 24, 10 + i * 4, PAL.clamShell);
    }
    // Hazard stripes
    for (let i = 0; i < 4; i++) {
      rect(ctx, 10 + i * 4, 20, 2, 4, PAL.clamMeat);
    }
    // Pipe on top
    rect(ctx, 14, 4, 4, 4, PAL.stone);
    rect(ctx, 15, 2, 2, 2, PAL.stoneL);           // valve
  },
  great_siphon: (ctx) => {
    // Massive water-draining machine — industrial, menacing
    rect(ctx, 4, 8, 24, 20, PAL.waterDeep);       // main structure
    rect(ctx, 6, 10, 20, 16, PAL.waterMid);
    // Central intake pipe
    circle(ctx, 16, 18, 6, PAL.black);
    circle(ctx, 16, 18, 4, PAL.waterDeep);
    circle(ctx, 16, 18, 2, PAL.waterShallow);     // whirlpool
    // Support pillars
    rect(ctx, 2, 6, 4, 24, PAL.stone);
    rect(ctx, 26, 6, 4, 24, PAL.stone);
    // Top gantry
    rect(ctx, 2, 4, 28, 4, PAL.stone);
    rect(ctx, 4, 2, 24, 2, PAL.stoneL);
    // Warning lights
    p(ctx, 8, 5, PAL.clamMeat);
    p(ctx, 24, 5, PAL.clamMeat);
  },
  sludge_pit: (ctx) => {
    // Toxic waste pool — bubbling dark liquid, stone rim
    circle(ctx, 16, 18, 12, PAL.stone);            // stone rim
    circle(ctx, 16, 18, 10, PAL.mudDark);          // pit
    circle(ctx, 16, 18, 8, PAL.snakeBase);         // toxic sludge
    // Bubbles
    circle(ctx, 12, 16, 2, PAL.snakeStripe);
    circle(ctx, 20, 19, 1, PAL.snakeStripe);
    circle(ctx, 15, 21, 1, PAL.snakeStripe);
    // Fumes
    p(ctx, 14, 10, PAL.snakeBase);
    p(ctx, 18, 8, PAL.snakeBase);
    p(ctx, 16, 6, PAL.snakeBase);
  },
  spawning_pool: drawPredatorNest,
  venom_spire: (ctx) => {
    // Tall venomous tower — organic-looking, dripping with poison
    rect(ctx, 12, 6, 8, 22, PAL.snakeBase);       // main spire
    rect(ctx, 10, 8, 12, 4, PAL.snakeBase);       // wider base
    rect(ctx, 14, 4, 4, 4, PAL.snakeStripe);      // cap
    // Venom drips
    p(ctx, 11, 14, PAL.snakeStripe);
    p(ctx, 10, 16, PAL.snakeStripe);
    p(ctx, 21, 15, PAL.snakeStripe);
    p(ctx, 22, 18, PAL.snakeStripe);
    // Eye-like opening
    rect(ctx, 14, 12, 4, 3, PAL.black);
    p(ctx, 15, 13, PAL.gatorEye);
    p(ctx, 17, 13, PAL.gatorEye);
    // Foundation
    rect(ctx, 8, 26, 16, 4, PAL.mudDark);
  },
  siphon: (ctx) => {
    // Small water-draining device — pipe and pump
    rect(ctx, 8, 10, 16, 16, PAL.waterDeep);      // housing
    rect(ctx, 10, 12, 12, 12, PAL.waterMid);
    // Intake pipe
    rect(ctx, 6, 18, 4, 4, PAL.stone);
    rect(ctx, 2, 19, 4, 2, PAL.stone);            // pipe extending
    // Pump wheel
    circle(ctx, 16, 16, 4, PAL.stone);
    circle(ctx, 16, 16, 2, PAL.stoneL);
    p(ctx, 16, 16, PAL.black);                     // axle
    // Water splashing
    p(ctx, 22, 22, PAL.waterShallow);
    p(ctx, 24, 20, PAL.waterShallow);
  },
  scale_wall: (ctx) => drawWall(ctx, PAL.gatorBase),
  shield_generator: (ctx) => {
    // Energy shield projector — metal base, glowing field emitter
    rect(ctx, 6, 16, 20, 12, PAL.stone);          // metal base
    rect(ctx, 8, 18, 16, 8, PAL.stoneL);
    // Central emitter column
    rect(ctx, 13, 6, 6, 12, PAL.stone);
    rect(ctx, 14, 4, 4, 4, PAL.stoneL);           // emitter cap
    // Energy field glow
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      const r = 10 + (a % 2) * 2;
      p(ctx, Math.round(16 + Math.cos(angle) * r), Math.round(14 + Math.sin(angle) * r), PAL.waterShallow);
    }
    // Power conduits
    rect(ctx, 4, 20, 2, 6, PAL.gatorBase);
    rect(ctx, 26, 20, 2, 6, PAL.gatorBase);
    // Status light
    p(ctx, 16, 5, PAL.snakeStripe);               // green active
  },
  // Resources
  fish_spot: drawFishSpot,
  intel_marker: (ctx) => {
    // Map/document on a stake — intel pickup
    rect(ctx, 7, 3, 2, 10, PAL.reedBrown);        // stake
    rect(ctx, 4, 2, 8, 7, PAL.clamShell);         // paper
    rect(ctx, 5, 3, 6, 5, PAL.intelGold);         // gold tint (valuable)
    // Writing lines
    for (let i = 0; i < 3; i++) rect(ctx, 5, 3 + i * 2, 5, 1, PAL.black);
    // Wax seal
    circle(ctx, 9, 7, 1, PAL.clamMeat);
  },
  mangrove_tree: drawMangroveTree,
  salvage_cache: (ctx) => {
    // Pile of wreckage — metal scraps, bent beams
    rect(ctx, 3, 8, 10, 6, PAL.stone);            // main wreck
    rect(ctx, 2, 10, 4, 3, PAL.stoneL);           // bent plate
    rect(ctx, 8, 6, 2, 8, PAL.stone);             // beam sticking up
    p(ctx, 9, 5, PAL.stoneL);                      // beam top
    // Scattered scraps
    rect(ctx, 11, 12, 3, 2, PAL.salvageTan);
    p(ctx, 5, 7, PAL.salvageTan);
    p(ctx, 10, 9, PAL.stoneL);
  },
  supply_crate: (ctx) => {
    // Wooden crate with rope binding
    rect(ctx, 3, 5, 10, 9, PAL.crateSienna);      // crate body
    rect(ctx, 4, 6, 8, 7, PAL.otterBase);         // lighter wood face
    // Planks
    rect(ctx, 3, 8, 10, 1, PAL.reedBrown);
    rect(ctx, 3, 11, 10, 1, PAL.reedBrown);
    // Rope cross
    rect(ctx, 7, 5, 2, 9, PAL.clamShell);
    rect(ctx, 3, 9, 10, 1, PAL.clamShell);
    // Lid slightly ajar
    rect(ctx, 2, 4, 12, 2, PAL.crateSienna);
    rect(ctx, 3, 3, 10, 1, PAL.reedBrown);
  },
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

  // Design noise — seeded per entity type for consistent decoration
  _noise = createNoise(hashString(type));

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
