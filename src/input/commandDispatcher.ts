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
import { Faction, IsBuilding, IsResource, Selected } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { AIState } from "@/ecs/traits/ai";
import { Health } from "@/ecs/traits/combat";
import { Position } from "@/ecs/traits/spatial";
import { EventBus } from "@/game/EventBus";
import { CELL_SIZE } from "@/maps/constants";

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
		const tileX = Math.floor(worldX / CELL_SIZE);
		const tileY = Math.floor(worldY / CELL_SIZE);

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
			// Reset AI state so orderSystem re-dispatches the new path
			if (entity.has(AIState)) {
				entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
			}
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
			if (entity.has(AIState)) {
				entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
			}
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
			if (entity.has(AIState)) {
				entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
			}
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
		const px = tileX * CELL_SIZE + CELL_SIZE / 2;
		const py = tileY * CELL_SIZE + CELL_SIZE / 2;
		EventBus.emit("command-marker", { x: px, y: py, color });
	}

	// ─── Swarm commands (rally ALL idle units, not just selected) ───

	/**
	 * Rally all idle workers to gather from a resource.
	 * Called when player clicks directly on a resource node.
	 */
	swarmGather(resource: Entity): void {
		const resourceId = resource.id();
		const pos = resource.get(Position);
		if (!pos) return;

		let issued = 0;
		this.world.query(OrderQueue, Faction, Gatherer).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			if (entity.has(IsBuilding)) return;
			const ai = entity.has(AIState) ? entity.get(AIState) : null;
			if (ai && ai.state !== "idle" && ai.state !== "gathering") return;

			const queue = entity.get(OrderQueue);
			if (!queue) return;
			queue.length = 0;
			queue.push({ type: "gather", targetX: pos.x, targetY: pos.y, targetEntity: resourceId });
			if (entity.has(AIState)) {
				entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
			}
			issued += 1;
		});

		if (issued > 0) {
			this.showCommandMarker(pos.x, pos.y, 0xfbbf24);
			const nodeData = resource.has(ResourceNode) ? resource.get(ResourceNode) : null;
			EventBus.emit("gather-command", { resourceType: nodeData?.type ?? "" });
			EventBus.emit("hud-alert", {
				message: `${issued} worker${issued > 1 ? "s" : ""} dispatched to harvest`,
				severity: "info",
			});
		}
	}

	/**
	 * Rally all idle combat units to attack an enemy.
	 * Called when player clicks directly on an enemy unit/building.
	 */
	swarmAttack(target: Entity): void {
		const targetId = target.id();
		const targetPos = target.get(Position);

		let issued = 0;
		this.world.query(OrderQueue, Faction, Health).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			if (entity.has(IsBuilding)) return;
			if (entity.has(Gatherer)) return; // workers don't auto-engage
			const ai = entity.has(AIState) ? entity.get(AIState) : null;
			if (ai && ai.state !== "idle") return;

			const queue = entity.get(OrderQueue);
			if (!queue) return;
			queue.length = 0;
			queue.push({ type: "attack", targetEntity: targetId });
			issued += 1;
		});

		// Also send selected units regardless of idle state
		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			if (entity.has(IsBuilding)) return;
			const queue = entity.get(OrderQueue);
			if (!queue) return;
			queue.length = 0;
			queue.push({ type: "attack", targetEntity: targetId });
			issued += 1;
		});

		if (targetPos && issued > 0) {
			this.showCommandMarker(targetPos.x, targetPos.y, 0xff0000);
			EventBus.emit("attack-command");
			EventBus.emit("hud-alert", {
				message: `${issued} unit${issued > 1 ? "s" : ""} engaging enemy`,
				severity: "info",
			});
		}
	}

	/**
	 * Request a build menu at a world position.
	 * Build grid is always visible in GameLayout's ActionPanelSection,
	 * so this method is a no-op. Kept for API compatibility.
	 */
	requestBuildMenu(_tileX: number, _tileY: number): void {
		// No-op: build grid is shown by default in the UI panel
	}

	// ─── Updated context command with swarm behavior ───

	/**
	 * Smart context command with swarm behavior:
	 * - Resource → swarm all idle workers
	 * - Enemy → swarm all idle fighters + selected units
	 * - Open ground (no selection) → build menu
	 * - Open ground (with selection) → move selected units
	 */
	issueSmartCommand(worldX: number, worldY: number): void {
		if (!this.enabled) return;
		const tileX = Math.floor(worldX / CELL_SIZE);
		const tileY = Math.floor(worldY / CELL_SIZE);

		const target = this.findEntityAtTile(tileX, tileY);

		if (target) {
			const targetFaction = target.get(Faction);
			const targetIsResource = target.has(IsResource);

			if (targetIsResource) {
				// Swarm gather
				this.swarmGather(target);
				return;
			}

			if (targetFaction && targetFaction.id !== "ura") {
				// Swarm attack
				this.swarmAttack(target);
				return;
			}

			// Clicked a friendly unit/building — just select it (handled by selection manager)
			return;
		}

		// Clicked open ground
		const selected = this.getSelectedFriendlyCommandUnits();
		if (selected.length > 0) {
			// Move selected units
			this.issueMoveCommand(tileX, tileY, false);
		} else {
			// No selection on open ground — show build menu
			this.requestBuildMenu(tileX, tileY);
		}
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	destroy(): void {
		// No-op — no event bindings to clean up.
	}
}
