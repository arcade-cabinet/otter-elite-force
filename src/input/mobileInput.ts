/**
 * Mobile Input System — translates touch gestures into RTS commands.
 *
 * Uses GestureDetector (pure logic) to classify multi-touch events, then
 * delegates to SelectionManager and CommandDispatcher for game actions.
 *
 * Gesture mapping (spec §7):
 * - Single tap → select unit (via SelectionManager.clickSelect)
 * - One-finger drag → selection rectangle (via SelectionManager.boxSelect)
 * - Two-finger drag → camera pan
 * - Pinch → camera zoom
 * - Long press → context command (move/attack via CommandDispatcher)
 */

import type { World } from "koota";
import Phaser from "phaser";
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
	private selectionManager: SelectionManager;
	private commandDispatcher: CommandDispatcher;
	private gestureDetector: GestureDetector;
	private selectionRect: Phaser.GameObjects.Graphics;
	private enabled = true;

	/** Track whether we're in "move mode" or "attack mode" from HUD buttons. */
	private commandMode: "none" | "move" | "attack" = "none";

	constructor(scene: Phaser.Scene, world: World) {
		this.scene = scene;
		this.selectionManager = new SelectionManager(scene, world);
		this.commandDispatcher = new CommandDispatcher(scene, world);
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
			this.handleLongPress(gesture.currentWorldX ?? 0, gesture.currentWorldY ?? 0);
		}
	}

	private handleTap(worldX: number, worldY: number): void {
		if (this.commandMode !== "none") {
			// In command mode: tap = issue command at this location
			this.commandDispatcher.issueCommandAt(worldX, worldY, this.commandMode);
			this.commandMode = "none";
			return;
		}

		// Normal tap = select unit at location
		this.selectionManager.clearSelection();
		this.selectionManager.selectAt(worldX, worldY);
	}

	private handleLongPress(worldX: number, worldY: number): void {
		// Long press = context-sensitive command (same as right-click on desktop)
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
