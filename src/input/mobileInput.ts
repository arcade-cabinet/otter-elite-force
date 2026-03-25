/**
 * Mobile Input System — translates touch gestures into RTS commands.
 *
 * US-058: Touch-to-game command dispatch.
 *
 * Uses GestureDetector (pure logic) to classify multi-touch events, then
 * delegates to SelectionManager and CommandDispatcher for game actions.
 *
 * Gesture mapping:
 * - Single tap on unit → select unit (via SelectionManager.clickSelect)
 * - Single tap on ground (with selection) → move command
 * - Single tap on enemy (with selection) → attack command
 * - Single tap on resource (with selection) → gather command
 * - One-finger drag → selection rectangle (via SelectionManager.boxSelect)
 * - Two-finger drag → camera pan (no false positives with game commands)
 * - Pinch → camera zoom
 * - Long press → context command (move/attack via CommandDispatcher)
 *
 * Two-finger gestures are fully isolated from game commands by the
 * GestureDetector — once a second pointer is down, the gesture is
 * classified as TwoFingerDrag or Pinch, and single-finger handlers
 * (tap, drag, long-press) are suppressed.
 */

import type { World } from "koota";
import Phaser from "phaser";
import { Selected } from "@/ecs/traits/identity";
import { EventBus } from "@/game/EventBus";
import { CommandDispatcher } from "./commandDispatcher";
import { GestureDetector, GestureType, type PointerState } from "./gestureDetector";
import { SelectionManager } from "./selectionManager";

/** Convert a Phaser pointer to our platform-agnostic PointerState. */
function toPointerState(pointer: Phaser.Input.Pointer): PointerState {
	return {
		id: pointer.id,
		x: pointer.x,
		y: pointer.y,
		worldX: pointer.worldX,
		worldY: pointer.worldY,
		isDown: pointer.isDown,
		time: pointer.time,
	};
}

export class MobileInput {
	private scene: Phaser.Scene;
	private world: World;
	private selectionManager: SelectionManager;
	private commandDispatcher: CommandDispatcher;
	private gestureDetector: GestureDetector;
	private selectionRect: Phaser.GameObjects.Graphics;
	private enabled = true;

	/** Track whether we're in "move mode" or "attack mode" from HUD buttons. */
	private commandMode: "none" | "move" | "attack" = "none";

	constructor(scene: Phaser.Scene, world: World) {
		this.scene = scene;
		this.world = world;
		this.selectionManager = new SelectionManager(world);
		this.commandDispatcher = new CommandDispatcher(world);
		this.gestureDetector = new GestureDetector();
		this.selectionRect = scene.add.graphics();
		this.selectionRect.setDepth(1000);

		this.bindEvents();
	}

	get selection(): SelectionManager {
		return this.selectionManager;
	}

	get commands(): CommandDispatcher {
		return this.commandDispatcher;
	}

	/** Set command mode from HUD button press. */
	setCommandMode(mode: "none" | "move" | "attack"): void {
		this.commandMode = mode;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.selectionManager.setEnabled(enabled);
		this.commandDispatcher.setEnabled(enabled);
		this.selectionRect.clear();
	}

	private bindEvents(): void {
		this.scene.input.on("pointerdown", this.onPointerDown, this);
		this.scene.input.on("pointermove", this.onPointerMove, this);
		this.scene.input.on("pointerup", this.onPointerUp, this);
	}

	private getActivePointers(): PointerState[] {
		const pointers: PointerState[] = [];
		const input = this.scene.input;

		if (input.pointer1?.isDown) pointers.push(toPointerState(input.pointer1));
		if (input.pointer2?.isDown) pointers.push(toPointerState(input.pointer2));

		return pointers;
	}

	private onPointerDown(_pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		const pointers = this.getActivePointers();
		if (pointers.length === 0) return;

		this.gestureDetector.onPointerDown(pointers);
	}

	private onPointerMove(_pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		const pointers = this.getActivePointers();
		if (pointers.length === 0) return;

		const gesture = this.gestureDetector.onPointerMove(pointers);
		if (!gesture) return;

		switch (gesture.type) {
			case GestureType.TwoFingerDrag:
				this.handleCameraPan(gesture.deltaX ?? 0, gesture.deltaY ?? 0);
				break;

			case GestureType.Pinch:
				this.handlePinchZoom(gesture.scale ?? 1);
				break;

			case GestureType.OneFingerDrag:
				this.handleDragSelect(
					gesture.startWorldX ?? 0,
					gesture.startWorldY ?? 0,
					gesture.currentWorldX ?? 0,
					gesture.currentWorldY ?? 0,
				);
				break;
		}
	}

	private onPointerUp(pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		const released = toPointerState(pointer);
		const gesture = this.gestureDetector.onPointerUp([released]);

		// Clear selection rectangle on any pointer up
		this.selectionRect.clear();

		// Finalize box select if one-finger drag ended
		if (this.gestureDetector.wasDragSelect) {
			this.selectionManager.selectBox(
				this.gestureDetector.lastDragStartWorldX,
				this.gestureDetector.lastDragStartWorldY,
				released.worldX,
				released.worldY,
			);
			this.gestureDetector.clearDragState();
			return;
		}

		if (!gesture) return;

		switch (gesture.type) {
			case GestureType.Tap:
				this.handleTap(gesture.currentWorldX ?? 0, gesture.currentWorldY ?? 0);
				break;
		}
	}

	/**
	 * Called from GameScene.update() to check for long press.
	 * Must be called every frame for timely long-press detection.
	 */
	update(): void {
		if (!this.enabled) return;
		const pointers = this.getActivePointers();
		if (pointers.length !== 1) return;

		const gesture = this.gestureDetector.onHoldCheck(pointers, Date.now());
		if (!gesture) return;

		if (gesture.type === GestureType.LongPress) {
			this.handleLongPress(
				gesture.currentWorldX ?? 0,
				gesture.currentWorldY ?? 0,
				pointers[0].x,
				pointers[0].y,
			);
		}
	}

	/**
	 * US-058: Smart tap dispatch — if units are selected and the tap
	 * doesn't land on a friendly unit, treat it as a context command
	 * (move to ground / attack enemy / gather resource).
	 * If no units are selected or the tap is on a friendly unit, select it.
	 */
	private handleTap(worldX: number, worldY: number): void {
		// Explicit command mode from HUD buttons takes priority
		if (this.commandMode !== "none") {
			this.commandDispatcher.issueCommandAt(worldX, worldY, this.commandMode);
			this.commandMode = "none";
			return;
		}

		// Check if we have a current selection
		const hasSelection = this.world.query(Selected).length > 0;

		if (hasSelection) {
			// Check if tap lands on a friendly unit — if so, re-select
			const hitFriendly = this.selectionManager.hasFriendlyAt(worldX, worldY);
			if (hitFriendly) {
				// Tap on friendly unit = re-select that unit
				this.selectionManager.clearSelection();
				this.selectionManager.selectAt(worldX, worldY);
			} else {
				// Tap on ground/enemy/resource = issue context command
				this.commandDispatcher.issueCommandAt(worldX, worldY, "context");
			}
		} else {
			// No selection: tap = select unit at location
			this.selectionManager.selectAt(worldX, worldY);
		}
	}

	/**
	 * US-060: Long press emits position for radial menu overlay.
	 * Also issues context command as fallback.
	 */
	private handleLongPress(worldX: number, worldY: number, screenX: number, screenY: number): void {
		EventBus.emit("mobile-long-press", { worldX, worldY, screenX, screenY });
		// If no subscriber handles it, also issue the context command
		this.commandDispatcher.issueCommandAt(worldX, worldY, "context");
	}

	private handleCameraPan(deltaX: number, deltaY: number): void {
		const cam = this.scene.cameras.main;
		cam.scrollX -= deltaX / cam.zoom;
		cam.scrollY -= deltaY / cam.zoom;
	}

	private handlePinchZoom(scale: number): void {
		const cam = this.scene.cameras.main;
		const newZoom = Phaser.Math.Clamp(cam.zoom * scale, 0.5, 2.0);
		cam.setZoom(newZoom);
	}

	private handleDragSelect(
		startWorldX: number,
		startWorldY: number,
		currentWorldX: number,
		currentWorldY: number,
	): void {
		// Draw selection rectangle
		this.selectionRect.clear();
		this.selectionRect.lineStyle(1, 0x00ff00, 0.8);
		this.selectionRect.fillStyle(0x00ff00, 0.15);

		const x = Math.min(startWorldX, currentWorldX);
		const y = Math.min(startWorldY, currentWorldY);
		const w = Math.abs(currentWorldX - startWorldX);
		const h = Math.abs(currentWorldY - startWorldY);

		this.selectionRect.fillRect(x, y, w, h);
		this.selectionRect.strokeRect(x, y, w, h);
	}

	destroy(): void {
		this.scene.input.off("pointerdown", this.onPointerDown, this);
		this.scene.input.off("pointermove", this.onPointerMove, this);
		this.scene.input.off("pointerup", this.onPointerUp, this);
		this.selectionRect.destroy();
		this.selectionManager.destroy();
		this.commandDispatcher.destroy();
	}
}
