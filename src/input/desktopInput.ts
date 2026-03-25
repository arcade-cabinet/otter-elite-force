/**
 * Desktop Input System — orchestrates selection and command input for desktop.
 *
 * Camera controls (WASD, edge scroll, wheel zoom) are handled directly in GameScene.
 * This module adds:
 * - SelectionManager (left-click select, drag-select rectangle)
 * - CommandDispatcher (right-click move/attack/gather)
 * - KeyboardHotkeys (H/A/P/Ctrl+1..9/Esc/Space)
 *
 * Initialize from GameScene.create() after the ECS world is available.
 */

import type { World } from "koota";
import type Phaser from "phaser";
import { CommandDispatcher } from "./commandDispatcher";
import { KeyboardHotkeys } from "./keyboardHotkeys";
import { SelectionManager } from "./selectionManager";

export class DesktopInput {
	private selectionManager: SelectionManager;
	private commandDispatcher: CommandDispatcher;
	private keyboardHotkeys: KeyboardHotkeys;

	constructor(scene: Phaser.Scene, world: World) {
		this.selectionManager = new SelectionManager(scene, world);
		this.commandDispatcher = new CommandDispatcher(scene, world);
		this.keyboardHotkeys = new KeyboardHotkeys(
			scene,
			world,
			this.selectionManager,
			this.commandDispatcher,
		);

		// Enable right-click context menu prevention on the canvas
		scene.input.mouse?.disableContextMenu();
	}

	/** Access the selection manager for external queries. */
	get selection(): SelectionManager {
		return this.selectionManager;
	}

	/** Access the command dispatcher for external queries. */
	get commands(): CommandDispatcher {
		return this.commandDispatcher;
	}

	/** Access the keyboard hotkeys for external queries. */
	get hotkeys(): KeyboardHotkeys {
		return this.keyboardHotkeys;
	}

	setEnabled(enabled: boolean): void {
		this.selectionManager.setEnabled(enabled);
		this.commandDispatcher.setEnabled(enabled);
		this.keyboardHotkeys.setEnabled(enabled);
	}

	destroy(): void {
		this.selectionManager.destroy();
		this.commandDispatcher.destroy();
		this.keyboardHotkeys.destroy();
	}
}
