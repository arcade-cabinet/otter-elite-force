/**
 * Floating Text Manager — US-021
 *
 * Spawns floating text at world positions in Phaser for damage, healing,
 * and resource deposit feedback. Text rises and fades over 1 second.
 *
 * - Damage: red "-X HP"
 * - Healing: green "+X HP"
 * - Resource deposit: green "+X [resource]"
 * - Black outline/shadow for readability
 * - Max 20 simultaneous (oldest removed on overflow)
 * - Fixed screen size (not world-scaled)
 */

import type Phaser from "phaser";

export type FloatingTextKind = "damage" | "healing" | "resource";

interface FloatingTextEntry {
	text: Phaser.GameObjects.Text;
	shadow: Phaser.GameObjects.Text;
	elapsed: number;
	duration: number;
	startX: number;
	startY: number;
}

const MAX_FLOATING_TEXTS = 20;
const DEFAULT_DURATION = 1.0; // seconds
const RISE_DISTANCE = 30; // pixels

function getColor(kind: FloatingTextKind): string {
	switch (kind) {
		case "damage":
			return "#ff4444";
		case "healing":
			return "#44ff44";
		case "resource":
			return "#44ff44";
	}
}

function formatMessage(kind: FloatingTextKind, amount: number, resourceType?: string): string {
	switch (kind) {
		case "damage":
			return `-${amount} HP`;
		case "healing":
			return `+${amount} HP`;
		case "resource":
			return `+${amount} ${resourceType ?? ""}`.trim();
	}
}

export class FloatingTextManager {
	private entries: FloatingTextEntry[] = [];
	private scene: Phaser.Scene;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
	}

	/**
	 * Spawn floating text at a world position.
	 */
	spawn(
		worldX: number,
		worldY: number,
		kind: FloatingTextKind,
		amount: number,
		resourceType?: string,
	): void {
		// Enforce max limit — remove oldest if at capacity
		while (this.entries.length >= MAX_FLOATING_TEXTS) {
			const oldest = this.entries.shift();
			if (oldest) {
				oldest.text.destroy();
				oldest.shadow.destroy();
			}
		}

		const message = formatMessage(kind, amount, resourceType);
		const color = getColor(kind);

		// Shadow text (black outline for readability)
		const shadow = this.scene.add.text(worldX + 1, worldY + 1, message, {
			fontSize: "14px",
			fontFamily: "monospace",
			color: "#000000",
			fontStyle: "bold",
		});
		shadow.setOrigin(0.5, 1);
		shadow.setDepth(1999);
		shadow.setScrollFactor(1); // world-space

		// Main colored text
		const text = this.scene.add.text(worldX, worldY, message, {
			fontSize: "14px",
			fontFamily: "monospace",
			color,
			fontStyle: "bold",
		});
		text.setOrigin(0.5, 1);
		text.setDepth(2000);
		text.setScrollFactor(1); // world-space

		this.entries.push({
			text,
			shadow,
			elapsed: 0,
			duration: DEFAULT_DURATION,
			startX: worldX,
			startY: worldY,
		});
	}

	/**
	 * Update all floating texts. Call once per frame.
	 * @param delta Time elapsed in seconds.
	 */
	update(delta: number): void {
		for (let i = this.entries.length - 1; i >= 0; i--) {
			const entry = this.entries[i];
			entry.elapsed += delta;

			const progress = Math.min(entry.elapsed / entry.duration, 1);
			const alpha = 1 - progress;
			const offsetY = -RISE_DISTANCE * progress;

			entry.text.setPosition(entry.startX, entry.startY + offsetY);
			entry.text.setAlpha(alpha);

			entry.shadow.setPosition(entry.startX + 1, entry.startY + offsetY + 1);
			entry.shadow.setAlpha(alpha * 0.8);

			if (entry.elapsed >= entry.duration) {
				entry.text.destroy();
				entry.shadow.destroy();
				this.entries.splice(i, 1);
			}
		}
	}

	/** Number of active floating texts. */
	get count(): number {
		return this.entries.length;
	}

	/** Destroy all floating texts and clean up. */
	destroy(): void {
		for (const entry of this.entries) {
			entry.text.destroy();
			entry.shadow.destroy();
		}
		this.entries.length = 0;
	}
}
