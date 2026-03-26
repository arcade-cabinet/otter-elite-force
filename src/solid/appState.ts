/**
 * App state and routing types for the SolidJS shell.
 * Separated from JSX components so pure-TS tests can import without
 * needing the Solid JSX transform.
 */

import { createSignal } from "solid-js";

/**
 * Screen types for the Solid app shell routing.
 */
export type ScreenId =
	| "main-menu"
	| "campaign"
	| "settings"
	| "skirmish"
	| "game"
	| "briefing"
	| "result";

/**
 * App-level state shared across screens.
 */
export interface AppState {
	screen: () => ScreenId;
	setScreen: (screen: ScreenId) => void;
	currentMissionId: () => string | null;
	setCurrentMissionId: (id: string | null) => void;
	isSkirmish: () => boolean;
	setIsSkirmish: (v: boolean) => void;
}

/**
 * Create the app state signals.
 */
export function createAppState(): AppState {
	const [screen, setScreen] = createSignal<ScreenId>("main-menu");
	const [currentMissionId, setCurrentMissionId] = createSignal<string | null>(null);
	const [isSkirmish, setIsSkirmish] = createSignal(false);

	return {
		screen,
		setScreen,
		currentMissionId,
		setCurrentMissionId,
		isSkirmish,
		setIsSkirmish,
	};
}
