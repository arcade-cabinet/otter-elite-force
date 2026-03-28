/**
 * Mobile components barrel — SolidJS adaptive UI for phone/tablet.
 *
 * Pure-TS state factories and types are re-exported from state modules
 * so tests can import them without triggering JSX parsing.
 */

// JSX components (require Solid transform — import in Solid app only)
export { type CommandAction, CommandButtons } from "./CommandButtons";
export {
	DESKTOP_QUERY,
	type FormFactor,
	resolveFormFactor,
	TABLET_QUERY,
} from "./formFactor";
export { createFormFactorSignal, MobileLayout, type MobileLayoutProps } from "./MobileLayout";
export { RadialMenu } from "./RadialMenu";
// State factories and types (pure TS — safe for test imports)
export {
	createRadialMenuState,
	DEFAULT_RADIAL_ACTIONS,
	type RadialAction,
	type RadialMenuState,
} from "./radialMenuState";
export { SquadTabs } from "./SquadTabs";
export {
	createSquadTabsState,
	type SquadGroup,
	type SquadTabsState,
} from "./squadTabsState";
