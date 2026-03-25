/**
 * Command Dispatcher — translates pointer actions into ECS orders.
 *
 * Pure ECS logic: operates on a Koota World, no framework dependency.
 * Visual feedback (command markers) is emitted via EventBus for the OverlayLayer.
 *
 * Context command on empty ground → Move order
 * Context command on enemy entity → Attack order
 * Context command on resource node → Gather order (workers only)
 */

import type { Entity, World } from "koota";
import { Gatherer, ResourceNode } from "@/ecs/traits/economy";
import { Faction, IsResource, Selected } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { EventBus } from "@/game/EventBus";
import { TILE_SIZE } from "@/maps/loader";

export class CommandDispatcher {
	private world: World;
	private enabled = true;

	constructor(world: World) {
		this.world = world;
	}

	/**
	 * Public entry point for issuing commands at a world position.
	 *
	 * @param mode - "context" for smart right-click behavior,
	 *               "move" for explicit move, "attack" for explicit attack
	 */
	issueCommandAt(
		worldX: number,
		worldY: number,
		mode: "context" | "move" | "attack",
		append = false,
	): void {
		if (!this.enabled) return;
		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);

		if (this.shouldIssueRallyCommand()) {
			this.issueRallyCommand(tileX, tileY);
			return;
		}

		if (mode === "move") {
			this.issueMoveCommand(tileX, tileY, append);
			return;
		}

		if (mode === "attack") {
			const target = this.findEntityAtTile(tileX, tileY);
			if (target) {
				this.issueAttackCommand(target, append);
			} else {
				// Attack-move to ground
				this.issueMoveCommand(tileX, tileY, append);
			}
			return;
		}

		// Context mode: same as right-click logic
		this.handleContextCommand(tileX, tileY, append);
	}

	private handleContextCommand(tileX: number, tileY: number, append = false): void {
		const target = this.findEntityAtTile(tileX, tileY);

		if (target) {
			const targetFaction = target.get(Faction);
			const targetIsResource = target.has(IsResource);

			if (targetIsResource) {
				this.issueGatherCommand(tileX, tileY, target, append);
			} else if (targetFaction && targetFaction.id !== "ura") {
				this.issueAttackCommand(target, append);
			} else {
				this.issueMoveCommand(tileX, tileY, append);
			}
		} else {
			this.issueMoveCommand(tileX, tileY, append);
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
	private issueMoveCommand(tileX: number, tileY: number, append = false): void {
		let issued = 0;
		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			const queue = entity.get(OrderQueue);
			if (!queue) return;

			if (!append) queue.length = 0;
			queue.push({ type: "move", targetX: tileX, targetY: tileY });
			issued += 1;
		});

		if (issued > 0) {
			this.showCommandMarker(tileX, tileY, 0x00ff00);
			EventBus.emit("move-command");
		}
	}

	/** Order all selected units to attack a target entity. */
	private issueAttackCommand(target: Entity, append = false): void {
		const targetId = target.id();
		let issued = 0;

		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			const queue = entity.get(OrderQueue);
			if (!queue) return;

			if (!append) queue.length = 0;
			queue.push({ type: "attack", targetEntity: targetId });
			issued += 1;
		});

		const targetPos = target.get(Position);
		if (targetPos && issued > 0) {
			this.showCommandMarker(targetPos.x, targetPos.y, 0xff0000);
			EventBus.emit("attack-command");
		}
	}

	/** Order selected workers to gather from a resource node. */
	private issueGatherCommand(tileX: number, tileY: number, resource: Entity, append = false): void {
		const resourceId = resource.id();
		let issued = 0;

		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			// Only workers (entities with Gatherer trait) can gather
			if (!entity.has(Gatherer)) return;

			const queue = entity.get(OrderQueue);
			if (!queue) return;

			if (!append) queue.length = 0;
			queue.push({
				type: "gather",
				targetX: tileX,
				targetY: tileY,
				targetEntity: resourceId,
			});
			issued += 1;
		});

		if (issued > 0) {
			this.showCommandMarker(tileX, tileY, 0xfbbf24);
			const nodeData = resource.has(ResourceNode) ? resource.get(ResourceNode) : null;
			EventBus.emit("gather-command", { resourceType: nodeData?.type ?? "" });
		}
	}

	private issueRallyCommand(tileX: number, tileY: number): void {
		const buildings = this.getSelectedFriendlyRallyBuildings();
		if (buildings.length === 0) return;

		for (const building of buildings) {
			building.set(RallyPoint, { x: tileX, y: tileY });
		}

		this.showCommandMarker(tileX, tileY, 0x5fd0ff);
		EventBus.emit("hud-alert", {
			message:
				buildings.length === 1
					? "Rally point updated. New units will move to the marked position."
					: `Rally point updated for ${buildings.length} structures.`,
			severity: "info",
		});
	}

	private shouldIssueRallyCommand(): boolean {
		return (
			this.getSelectedFriendlyCommandUnits().length === 0 &&
			this.getSelectedFriendlyRallyBuildings().length > 0
		);
	}

	private getSelectedFriendlyCommandUnits(): Entity[] {
		const units: Entity[] = [];
		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id === "ura") {
				units.push(entity);
			}
		});
		return units;
	}

	private getSelectedFriendlyRallyBuildings(): Entity[] {
		const buildings: Entity[] = [];
		this.world.query(Selected, RallyPoint, Position, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id === "ura") {
				buildings.push(entity);
			}
		});
		return buildings;
	}

	/** Emit a command-marker event for the OverlayLayer to render. */
	private showCommandMarker(tileX: number, tileY: number, color: number): void {
		const px = tileX * TILE_SIZE + TILE_SIZE / 2;
		const py = tileY * TILE_SIZE + TILE_SIZE / 2;
		EventBus.emit("command-marker", { x: px, y: py, color });
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	destroy(): void {
		// No-op — no event bindings to clean up.
	}
}
