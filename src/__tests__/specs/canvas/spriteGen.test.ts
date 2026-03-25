/**
 * US-R01: Procedural sprite generator — unit tests
 *
 * Validates:
 * - Every registered sprite type produces a canvas
 * - Unit sprites are 40×40 (16 × 2.5)
 * - Building sprites are 96×96 (32 × 3)
 * - initSprites() populates the cache for all types
 * - getSprite() returns cached canvases
 *
 * Uses @napi-rs/canvas (node-canvas) to provide a real Canvas2D backend
 * following the Konva reference testing pattern. This avoids relying on
 * happy-dom/jsdom's non-existent Canvas2D support.
 */
import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';

// ─── Canvas2D backend via @napi-rs/canvas ───
// Patch document.createElement to return real node-canvas instances
// when 'canvas' is requested, following the Konva test setup pattern.

const origCreateElement = document.createElement.bind(document);

beforeAll(() => {
  // biome-ignore lint/suspicious/noExplicitAny: test setup for node-canvas
  (document as any).createElement = (tagName: string, ...args: any[]) => {
    if (tagName === 'canvas') {
      return createCanvas(300, 300) as unknown as HTMLCanvasElement;
    }
    return origCreateElement(tagName, ...args);
  };
});

afterAll(() => {
  document.createElement = origCreateElement;
});
import {
  SPRITE_TYPES,
  generateSprite,
  getSprite,
  initSprites,
  spriteCache,
  type SpriteType,
} from '@/canvas/spriteGen';

const UNIT_TYPES: SpriteType[] = ['gatherer', 'brawler', 'sniper', 'gator', 'snake', 'cattail', 'clambed'];
const BUILDING_TYPES: SpriteType[] = ['lodge', 'burrow', 'armory', 'tower', 'predator_nest'];

afterEach(() => {
  spriteCache.clear();
});

describe('spriteGen', () => {
  describe('SPRITE_TYPES registry', () => {
    it('contains all expected entity types', () => {
      expect(SPRITE_TYPES).toContain('gatherer');
      expect(SPRITE_TYPES).toContain('brawler');
      expect(SPRITE_TYPES).toContain('sniper');
      expect(SPRITE_TYPES).toContain('gator');
      expect(SPRITE_TYPES).toContain('snake');
      expect(SPRITE_TYPES).toContain('cattail');
      expect(SPRITE_TYPES).toContain('clambed');
      expect(SPRITE_TYPES).toContain('lodge');
      expect(SPRITE_TYPES).toContain('burrow');
      expect(SPRITE_TYPES).toContain('armory');
      expect(SPRITE_TYPES).toContain('tower');
      expect(SPRITE_TYPES).toContain('predator_nest');
      expect(SPRITE_TYPES.length).toBe(12);
    });
  });

  describe('generateSprite()', () => {
    it.each(UNIT_TYPES)('generates a 40×40 canvas for unit "%s"', (type) => {
      const canvas = generateSprite(type);
      expect(canvas.width).toBe(40);
      expect(canvas.height).toBe(40);
      expect(canvas.getContext('2d')).not.toBeNull();
    });

    it.each(BUILDING_TYPES)('generates a 96×96 canvas for building "%s"', (type) => {
      const canvas = generateSprite(type);
      expect(canvas.width).toBe(96);
      expect(canvas.height).toBe(96);
      expect(canvas.getContext('2d')).not.toBeNull();
    });

    it('produces canvases with non-transparent pixels', () => {
      // Real pixel verification via @napi-rs/canvas
      for (const type of ['gatherer', 'lodge'] as SpriteType[]) {
        const canvas = generateSprite(type);
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let hasPixels = false;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) { hasPixels = true; break; }
        }
        expect(hasPixels).toBe(true);
      }
    });
  });

  describe('initSprites()', () => {
    it('populates spriteCache with all sprite types', () => {
      expect(spriteCache.size).toBe(0);
      initSprites();
      expect(spriteCache.size).toBe(SPRITE_TYPES.length);
      for (const type of SPRITE_TYPES) {
        expect(spriteCache.has(type)).toBe(true);
        const s = spriteCache.get(type);
        expect(s).toBeDefined();
        expect(s!.getContext('2d')).not.toBeNull();
      }
    });

    it('clears previous cache on re-init', () => {
      initSprites();
      const first = spriteCache.get('gatherer');
      initSprites();
      const second = spriteCache.get('gatherer');
      // New canvas instance after re-init
      expect(first).not.toBe(second);
    });
  });

  describe('getSprite()', () => {
    it('returns undefined before initSprites()', () => {
      expect(getSprite('gatherer')).toBeUndefined();
    });

    it('returns cached canvas after initSprites()', () => {
      initSprites();
      const sprite = getSprite('gatherer');
      expect(sprite).toBeDefined();
      expect(sprite!.getContext('2d')).not.toBeNull();
      expect(sprite).toBe(spriteCache.get('gatherer'));
    });

    it('returns undefined for unknown types', () => {
      initSprites();
      expect(getSprite('nonexistent')).toBeUndefined();
    });
  });
});

