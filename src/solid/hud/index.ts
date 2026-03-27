/**
 * SolidJS HUD Components -- barrel file.
 *
 * All HUD components for the tactical overlay, reading state
 * from the SolidJS bridge signals.
 */

export { AlertBanner } from "./AlertBanner";
export { BossHealthBar } from "./BossHealthBar";
export { BuildMenu, type BuildOption } from "./BuildMenu";
export { CommandTransmission } from "./CommandTransmission";
export {
	createTypewriter,
	type TypewriterOptions,
	type TypewriterResult,
} from "./createTypewriter";
export { ErrorFeedback } from "./ErrorFeedback";
export { createErrorFeedback, type ErrorMessage } from "./errorState";
export { MilitaryTooltip, SimpleTooltip, type TooltipData } from "./MilitaryTooltip";
export { ObjectivesPanel } from "./ObjectivesPanel";
// --- Restored polish components ---
export { PanelFrame } from "./PanelFrame";
export { ResourceBar } from "./ResourceBar";
export { SelectionPanel } from "./SelectionPanel";
export {
	calculateStarRating,
	type ScoreBreakdown,
	StarRatingDisplay,
} from "./StarRatingDisplay";
export { TacticalHUD } from "./TacticalHUD";
export { TransmissionPortrait } from "./TransmissionPortrait";
export { TutorialOverlay } from "./TutorialOverlay";
