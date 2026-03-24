/**
 * Command Dispatcher — translates right-click actions into ECS orders.
 *
 * Right-click on empty ground → Move order
 * Right-click on enemy entity → Attack order
 * Right-click on resource node → Gather order (workers only)
 */

import type { Entity, World } from "koota";
import type Phaser from "phaser";
import { Gatherer } from "@/ecs/traits/economy";
import { Faction, IsResource, Selected } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { TILE_SIZE } from "@/maps/loader";

export class CommandDispatcher {
	private scene: Phaser.Scene;
	private world: World;

	constructor(scene: Phaser.Scene, world: World) {
		this.scene = scene;
		this.world = world;

		this.bindEvents();
	}

	private bindEvents(): void {
		this.scene.input.on("pointerdown", this.onPointerDown, this);
	}

	/**
	 * Public entry point for issuing commands at a world position.
	 * Used by MobileInput for tap-after-button and long-press commands.
	 *
	 * @param mode - "context" for smart right-click behavior,
	 *               "move" for explicit move, "attack" for explicit attack
	 */
	issueCommandAt(worldX: number, worldY: number, mode: "context" | "move" | "attack"): void {
		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);

		if (mode === "move") {
			this.issueMoveCommand(tileX, tileY);
			return;
		}

		if (mode === "attack") {
			const target = this.findEntityAtTile(tileX, tileY);
			if (target) {
				this.issueAttackCommand(target);
			} else {
				// Attack-move to ground
				this.issueMoveCommand(tileX, tileY);
			}
			return;
		}

		// Context mode: same as right-click logic
		this.handleContextCommand(tileX, tileY);
	}

	private onPointerDown(pointer: Phaser.Input.Pointer): void {
		if (!pointer.rightButtonDown()) return;

		const tileX = Math.floor(pointer.worldX / TILE_SIZE);
		const tileY = Math.floor(pointer.worldY / TILE_SIZE);
		this.handleContextCommand(tileX, tileY);
	}

	private handleContextCommand(tileX: number, tileY: number): void {
		const target = this.findEntityAtTile(tileX, tileY);

		if (target) {
			const targetFaction = target.get(Faction);
			const targetIsResource = target.has(IsResource);

			if (targetIsResource) {
				this.issueGatherCommand(tileX, tileY, target);
			} else if (targetFaction && targetFaction.id !== "ura") {
				this.issueAttackCommand(target);
			} else {
				this.issueMoveCommand(tileX, tileY);
			}
		} else {
			this.issueMoveCommand(tileX, tileY);
		}
	}

	/** Find the closest entity at a given tile position. */
	private findEntityAtTile(tileX: number, tileY: number): Entity | null {
		let closestEntity: Entity | null = null;
		let closestDist = 1.5;

		this.world.query(Position, Faction).forEach((entity) => {
			const pos = entity.get(Position);
			if (!pos) return;

			const dx = pos.x - tileX;
			const dy = pos.y - tileY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < closestDist) {
				closestDist = dist;
				closestEntity = entity;
			}
		});

		return closestEntity;
	}

	/** Move all selected units to a tile position. */
	private issueMoveCommand(tileX: number, tileY: number): void {
		this.world.query(Selected, OrderQueue).forEach((entity) => {
			const queue = entity.get(OrderQueue);
			if (!queue) return;

			// Replace current orders with the new move command
			queue.length = 0;
			queue.push({ type: "move", targetX: tileX, targetY: tileY });
		});

		this.showCommandMarker(tileX, tileY, 0x00ff00);
	}

	/** Order all selected units to attack a target entity. */
	private issueAttackCommand(target: Entity): void {
		const targetId = target.id();

		this.world.query(Selected, OrderQueue).forEach((entity) => {
			const queue = entity.get(OrderQueue);
			if (!queue) return;

			queue.length = 0;
			queue.push({ type: "attack", targetEntity: targetId });
		});

		const targetPos = target.get(Position);
		if (targetPos) {
			this.showCommandMarker(targetPos.x, targetPos.y, 0xff0000);
		}
	}

	/** Order selected workers to gather from a resource node. */
	private issueGatherCommand(tileX: number, tileY: number, resource: Entity): void {
		const resourceId = resource.id();

		this.world.query(Selected, OrderQueue).forEach((entity) => {
			// Only workers (entities with Gatherer trait) can gather
			if (!entity.has(Gatherer)) return;

			const queue = entity.get(OrderQueue);
			if (!queue) return;

			queue.length = 0;
			queue.push({
				type: "gather",
				targetX: tileX,
				targetY: tileY,
				targetEntity: resourceId,
			});
		});

		this.showCommandMarker(tileX, tileY, 0xfbbf24);
	}

	/** Flash a brief marker at the command target position. */
	private showCommandMarker(tileX: number, tileY: number, color: number): void {
		const px = tileX * TILE_SIZE + TILE_SIZE / 2;
		const py = tileY * TILE_SIZE + TILE_SIZE / 2;

		const marker = this.scene.add.graphics();
		marker.lineStyle(2, color, 0.8);
		marker.strokeCircle(px, py, 12);
		marker.setDepth(999);

		this.scene.tweens.add({
			targets: marker,
			alpha: 0,
			scaleX: 1.5,
			scaleY: 1.5,
			duration: 400,
			onComplete: () => marker.destroy(),
		});
	}

	destroy(): void {
		this.scene.input.off("pointerdown", this.onPointerDown, this);
	}
}
