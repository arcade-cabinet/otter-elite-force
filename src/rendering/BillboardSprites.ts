/**
 * Billboard Sprite System for Babylon.js
 * Modern implementation of Daggerfall-style sprite rendering
 */

export interface SpriteAnimation {
	name: string;
	frames: string[];
	frameRate: number;
	loop: boolean;
}

export class SpriteAnimator {
	private currentAnimation: string = "idle";
	private currentFrame: number = 0;
	private frameTime: number = 0;
	private animations: Map<string, SpriteAnimation> = new Map();

	constructor(animations: Record<string, SpriteAnimation>) {
		for (const [name, anim] of Object.entries(animations)) {
			this.animations.set(name, anim);
		}
	}

	play(animationName: string, reset: boolean = false) {
		if (this.currentAnimation !== animationName || reset) {
			this.currentAnimation = animationName;
			this.currentFrame = 0;
			this.frameTime = 0;
		}
	}

	update(deltaTime: number): string | null {
		const anim = this.animations.get(this.currentAnimation);
		if (!anim) return null;

		this.frameTime += deltaTime;
		const frameDuration = 1 / anim.frameRate;

		if (this.frameTime >= frameDuration) {
			this.frameTime -= frameDuration;
			this.currentFrame++;

			if (this.currentFrame >= anim.frames.length) {
				if (anim.loop) {
					this.currentFrame = 0;
				} else {
					this.currentFrame = anim.frames.length - 1;
				}
			}
		}

		return anim.frames[this.currentFrame];
	}
}

export function createOtterSpriteConfig(color: "brown" | "grey" | "white") {
	const basePath = `/sprites/keyframes/${color}`;

	const createAnimation = (
		name: string,
		frameCount: number,
		frameRate: number = 12,
		loop: boolean = true,
	): SpriteAnimation => ({
		name,
		frames: Array.from(
			{ length: frameCount },
			(_, i) => `${basePath}/__${color}_otter_${name}_${String(i).padStart(3, "0")}.png`,
		),
		frameRate,
		loop,
	});

	return {
		color,
		scale: 1.5,
		animations: {
			idle: createAnimation("idle", 12, 8, true),
			walk: createAnimation("walk", 8, 10, true),
			run: createAnimation("run", 8, 15, true),
			swim1: createAnimation("swim_style_01", 16, 12, true),
			swim2: createAnimation("swim_style_02", 16, 12, true),
			jump: createAnimation("jump", 8, 12, false),
			die: createAnimation("die", 5, 8, false),
			whacked: createAnimation("whacked", 5, 10, false),
			standUp: createAnimation("stand_up", 8, 10, false),
			dive: createAnimation("dive_pose", 1, 1, false),
			headInWater: createAnimation("head_in_water", 17, 8, true),
			idleStanding: createAnimation("idle_standing_up", 12, 8, true),
			laugh: createAnimation("laugh_standing_up", 8, 12, true),
			goDown: createAnimation("go_down", 4, 8, false),
		},
	};
}
