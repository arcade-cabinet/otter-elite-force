/**
 * Keyboard Hotkeys — RTS command hotkeys for desktop play.
 *
 * Manages:
 * - H: halt (stop order)
 * - A then click: attack-move
 * - P then click: patrol
 * - Ctrl+1..9: assign control group
 * - 1..9: select control group
 * - Escape: deselect all / cancel pending action
 * - Space: center camera on last alert position
 *
 * Operates on the GameScene's input and ECS world via CommandDispatcher
 * and SelectionManager.
 */

import type { Entity, World } from "koota";
import Phaser from "phaser";
import { Faction, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { EventBus } from "@/game/EventBus";
import type { CommandDispatcher } from "./commandDispatcher";
import type { SelectionManager } from "./selectionManager";

export type PendingAction = "none" | "attack-move" | "patrol";

export class KeyboardHotkeys {
	private scene: Phaser.Scene;
	private world: World;
	private selection: SelectionManager;
	private commands: CommandDispatcher;
	private controlGroups: Map<number, number[]> = new Map();
	private _pendingAction: PendingAction = "none";
	private lastAlertPosition: { x: number; y: number } | null = null;
	private alertListener: (...args: unknown[]) => void;
	private enabled = true;

	constructor(
		scene: Phaser.Scene,
		world: World,
		selection: SelectionManager,
		commands: CommandDispatcher,
	) {
		this.scene = scene;
		this.world = world;
		this.selection = selection;
		this.commands = commands;

		this.alertListener = (data: unknown) => {
			const alert = data as { worldX?: number; worldY?: number };
			if (alert.worldX != null && alert.worldY != null) {
				this.lastAlertPosition = { x: alert.worldX, y: alert.worldY };
			}
		};
		EventBus.on("hud-alert", this.alertListener);

		this.bindKeys();
	}

	get pendingAction(): PendingAction {
		return this._pendingAction;
	}

	/** Called by GameScene on left-click when a pending action is active. */
	handlePendingClick(worldX: number, worldY: number): boolean {
		if (this._pendingAction === "none") return false;

		if (this._pendingAction === "attack-move") {
			this.commands.issueCommandAt(worldX, worldY, "attack");
		} else if (this._pendingAction === "patrol") {
			this.issuePatrolCommand(worldX, worldY);
		}

		this._pendingAction = "none";
		return true;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	destroy(): void {
		EventBus.off("hud-alert", this.alertListener);
		// Phaser keyboard keys are cleaned up when the scene shuts down
	}

	// ---------------------------------------------------------------
	// Key bindings
	// ---------------------------------------------------------------

	private bindKeys(): void {
		const kb = this.scene.input.keyboard;
		if (!kb) return;

		// H — halt / stop
		kb.on("keydown-H", () => {
			if (!this.enabled) return;
			this.issueHaltCommand();
		});

		// A — attack-move (sets pending)
		kb.on("keydown-A", () => {
			if (!this.enabled) return;
			this._pendingAction = "attack-move";
		});

		// P — patrol (sets pending)
		kb.on("keydown-P", () => {
			if (!this.enabled) return;
			this._pendingAction = "patrol";
		});

		// Escape — cancel pending / deselect
		kb.on("keydown-ESC", () => {
			if (!this.enabled) return;
			if (this._pendingAction !== "none") {
				this._pendingAction = "none";
				return;
			}
			this.selection.clearSelection();
		});

		// Space — center camera on last alert
		kb.on("keydown-SPACE", () => {
			if (!this.enabled) return;
			this.centerOnLastAlert();
		});

		// Number keys 1-9: control groups
		for (let i = 1; i <= 9; i++) {
			const keyCode = `keydown-${i.toString()}` as const;
			const num = i;
			kb.on(keyCode, (event: KeyboardEvent) => {
				if (!this.enabled) return;
				if (event.ctrlKey || event.metaKey) {
					this.assignControlGroup(num);
				} else {
					this.recallControlGroup(num);
				}
			});
		}
	}

	// ---------------------------------------------------------------
	// Command implementations
	// ---------------------------------------------------------------

	private issueHaltCommand(): void {
		this.world.query(Selected, OrderQueue, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			const queue = entity.get(OrderQueue);
			if (!queue) return;
			queue.length = 0;
			queue.push({ type: "stop" });
		});
	}

	private issuePatrolCommand(worldX: number, worldY: number): void {
		const TILE_SIZE = 32;
		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);

		this.world.query(Selected, OrderQueue, Position, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			const queue = entity.get(OrderQueue);
			const pos = entity.get(Position);
			if (!queue || !pos) return;

			queue.length = 0;
			queue.push({
				type: "patrol",
				waypoints: [
					{ x: pos.x, y: pos.y },
					{ x: tileX, y: tileY },
				],
			});
		});
	}

	private centerOnLastAlert(): void {
		if (!this.lastAlertPosition) return;
		const cam = this.scene.cameras.main;
		cam.centerOn(this.lastAlertPosition.x, this.lastAlertPosition.y);
	}

	// ---------------------------------------------------------------
	// Control groups
	// ---------------------------------------------------------------

	assignControlGroup(group: number): void {
		const ids: number[] = [];
		this.world.query(Selected, Faction).forEach((entity) => {
			if (entity.get(Faction)?.id !== "ura") return;
			ids.push(entity.id());
		});
		if (ids.length > 0) {
			this.controlGroups.set(group, ids);
		}
	}

	recallControlGroup(group: number): void {
		const ids = this.controlGroups.get(group);
		if (!ids || ids.length === 0) return;

		this.selection.clearSelection();

		// Select all living entities in the group
		for (const id of ids) {
			const entity = this.findEntityById(id);
			if (entity) {
				entity.add(Selected);
			}
		}
	}

	getControlGroup(group: number): number[] {
		return this.controlGroups.get(group) ?? [];
	}

	private findEntityById(entityId: number): Entity | null {
		for (const entity of this.world.query(UnitType, Position, Faction)) {
			if (entity.id() === entityId) return entity;
		}
		return null;
	}
}
