/**
 * Combat Text — Floating damage/heal/resource numbers rendered on the canvas.
 *
 * Tracks entity HP changes between frames and spawns floating text:
 * - Red "-X" when HP decreases (damage taken)
 * - Green "+X" when HP increases (healing)
 * - Yellow "+X FISH/TIMBER/SALVAGE" when resources increase at depot
 *
 * Text floats upward and fades over 900ms. Entries outside viewport are culled.
 *
 * Integrated into drawScene() in littlejsRuntime.ts after entity rendering.
 */

import { Faction, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

const FLOAT_LIFETIME_MS = 900;
const MAX_FLOATERS = 64;

interface Floater {
	text: string;
	color: string;
	worldX: number;
	worldY: number;
	createdAt: number;
}

interface Camera {
	x: number;
	y: number;
	zoom: number;
}

export interface CombatTextRenderer {
	/** Call once per tick to detect HP/resource changes and spawn floaters. */
	update(world: GameWorld, nowMs: number): void;
	/** Render all active floaters to the canvas. Call after entity rendering. */
	render(
		ctx: CanvasRenderingContext2D,
		camera: Camera,
		viewport: { width: number; height: number },
		nowMs: number,
	): void;
}

export function createCombatTextRenderer(): CombatTextRenderer {
	const floaters: Floater[] = [];
	const previousHealth = new Map<number, number>();
	let previousResources: { fish: number; timber: number; salvage: number } | null = null;

	function spawnFloater(
		text: string,
		color: string,
		worldX: number,
		worldY: number,
		nowMs: number,
	): void {
		if (floaters.length >= MAX_FLOATERS) {
			floaters.shift();
		}
		floaters.push({ text, color, worldX, worldY, createdAt: nowMs });
	}

	function findPlayerDepot(world: GameWorld): { x: number; y: number } {
		for (const eid of world.runtime.alive) {
			if (Flags.isBuilding[eid] === 1 && Faction.id[eid] === 1) {
				return { x: Position.x[eid], y: Position.y[eid] };
			}
		}
		return { x: 64, y: 64 };
	}

	function update(world: GameWorld, nowMs: number): void {
		// Track HP changes
		const seenEids = new Set<number>();
		for (const eid of world.runtime.alive) {
			seenEids.add(eid);
			const current = Health.current[eid];
			const max = Health.max[eid];
			if (max <= 0) continue;

			const prev = previousHealth.get(eid);
			if (prev !== undefined && prev !== current) {
				const delta = Math.round(current - prev);
				if (delta !== 0) {
					const text = delta > 0 ? `+${delta}` : `${delta}`;
					const color = delta > 0 ? "#5eead4" : "#f87171";
					spawnFloater(text, color, Position.x[eid], Position.y[eid], nowMs);
				}
			}
			previousHealth.set(eid, current);
		}

		// Clean up tracked entities that no longer exist
		for (const eid of previousHealth.keys()) {
			if (!seenEids.has(eid)) {
				previousHealth.delete(eid);
			}
		}

		// Track resource changes
		const res = world.session.resources;
		if (previousResources !== null) {
			const deltas: Array<[string, number]> = [
				["FISH", res.fish - previousResources.fish],
				["TIMBER", res.timber - previousResources.timber],
				["SALVAGE", res.salvage - previousResources.salvage],
			];

			for (const [label, delta] of deltas) {
				if (delta > 0) {
					const depot = findPlayerDepot(world);
					spawnFloater(`+${delta} ${label}`, "#fde047", depot.x, depot.y, nowMs);
				}
			}
		}
		previousResources = { fish: res.fish, timber: res.timber, salvage: res.salvage };

		// Cull expired floaters
		for (let i = floaters.length - 1; i >= 0; i--) {
			if (nowMs - floaters[i].createdAt >= FLOAT_LIFETIME_MS) {
				floaters.splice(i, 1);
			}
		}
	}

	function render(
		ctx: CanvasRenderingContext2D,
		camera: Camera,
		viewport: { width: number; height: number },
		nowMs: number,
	): void {
		if (floaters.length === 0) return;

		ctx.save();
		ctx.textAlign = "center";

		for (const floater of floaters) {
			const age = nowMs - floater.createdAt;
			const progress = age / FLOAT_LIFETIME_MS;
			if (progress >= 1) continue;

			const screenX = (floater.worldX - camera.x) * camera.zoom;
			const screenY = (floater.worldY - camera.y) * camera.zoom;

			// Cull off-screen
			if (
				screenX < -64 ||
				screenY < -64 ||
				screenX > viewport.width + 64 ||
				screenY > viewport.height + 64
			) {
				continue;
			}

			// Float upward and fade
			const floatOffset = progress * 28 * camera.zoom;
			const alpha = Math.max(0, 1 - progress);

			ctx.globalAlpha = alpha;
			ctx.fillStyle = floater.color;
			ctx.font = `bold ${Math.round(11 * camera.zoom)}px monospace`;
			ctx.shadowColor = "rgba(0,0,0,0.9)";
			ctx.shadowBlur = 2;
			ctx.fillText(floater.text, screenX, screenY - floatOffset);
		}

		ctx.restore();
	}

	return { update, render };
}
