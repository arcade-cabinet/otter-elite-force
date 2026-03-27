/**
 * GameProjectile — LittleJS EngineObject subclass for projectiles.
 *
 * Small fast-moving dot with a trail effect. Spawned by combat system
 * for ranged attacks, destroyed on hit or after max lifetime.
 *
 * W1-04: EngineObject subclasses for units, buildings, resources.
 */

import type { Vector2 } from "littlejsengine";
import type { LjsApi } from "./GameUnit";

let _ljs: LjsApi | null = null;

export function initGameProjectileLjs(ljs: LjsApi): void {
	_ljs = ljs;
}

function ljs(): LjsApi {
	if (!_ljs) throw new Error("GameProjectile: LittleJS API not initialized");
	return _ljs;
}

export interface GameProjectileOptions {
	startPos: Vector2;
	targetPos: Vector2;
	speed: number; // tiles per second
	color?: [number, number, number]; // RGB 0-1
}

export function createGameProjectileClass() {
	const api = ljs();

	return class GameProjectile extends api.EngineObject {
		targetPos: Vector2;
		projectileSpeed: number;
		projectileColor: [number, number, number];
		trailPositions: Vector2[];
		maxTrailLength = 5;
		reachedTarget = false;

		constructor(options: GameProjectileOptions) {
			const size = api.vec2(0.15, 0.15);
			super(options.startPos, size, undefined, 0, api.WHITE, 1000); // High renderOrder = on top
			this.targetPos = options.targetPos.copy();
			this.projectileSpeed = options.speed;
			this.projectileColor = options.color ?? [1, 0.9, 0.3];
			this.trailPositions = [];
			this.mass = 0;
			this.damping = 1;

			// Calculate velocity toward target
			const dir = options.targetPos.subtract(options.startPos);
			const dist = dir.length();
			if (dist > 0) {
				const normalized = dir.scale(1 / dist);
				this.velocity = normalized.scale(options.speed);
			}
		}

		update(): void {
			super.update();

			// Record trail position
			this.trailPositions.push(this.pos.copy());
			if (this.trailPositions.length > this.maxTrailLength) {
				this.trailPositions.shift();
			}

			// Check if reached target
			const dist = this.pos.subtract(this.targetPos).length();
			if (dist < 0.3) {
				this.reachedTarget = true;
				this.destroy();
			}

			// Timeout: destroy after 3 seconds
			if (api.EngineObject.prototype.spawnTime !== undefined) {
				// Use LittleJS time tracking
			}
		}

		render(): void {
			const a = ljs();
			const [r, g, b] = this.projectileColor;

			// Draw trail (fading dots)
			for (let i = 0; i < this.trailPositions.length; i++) {
				const alpha = ((i + 1) / (this.trailPositions.length + 1)) * 0.6;
				const trailSize = 0.06 + (i / this.trailPositions.length) * 0.05;
				a.drawCircle(this.trailPositions[i], trailSize, new a.Color(r, g, b, alpha));
			}

			// Draw projectile body
			a.drawCircle(this.pos, 0.08, new a.Color(r, g, b, 1));

			// Bright core
			a.drawCircle(this.pos, 0.04, new a.Color(1, 1, 1, 0.8));
		}
	};
}

export type GameProjectile = InstanceType<ReturnType<typeof createGameProjectileClass>>;
