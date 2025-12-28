/**
 * HUD Action Buttons
 * Touch-friendly action cluster for mobile gameplay
 */

import { audioEngine } from "../../Core/AudioEngine";
import { inputSystem } from "../../Core/InputSystem";

interface HUDActionsProps {
	selectedBuildItem: unknown | null;
	isBuildMode: boolean;
	nearLZ: boolean;
	difficultyMode: string;
	onConfirmPlacement: () => void;
	onCancelPlacement: () => void;
	onToggleZoom: () => void;
	onToggleBuildMode: () => void;
}

export function HUDActions({
	selectedBuildItem,
	isBuildMode,
	nearLZ,
	difficultyMode,
	onConfirmPlacement,
	onCancelPlacement,
	onToggleZoom,
	onToggleBuildMode,
}: HUDActionsProps) {
	if (selectedBuildItem) {
		return (
			<div className="action-cluster">
				<button type="button" className="action-btn place" onClick={onConfirmPlacement}>
					PLACE
				</button>
				<button type="button" className="action-btn cancel" onClick={onCancelPlacement}>
					✕
				</button>
			</div>
		);
	}

	return (
		<div className="action-cluster">
			<button
				type="button"
				className="action-btn jump"
				onPointerDown={() => inputSystem.setJump(true)}
				onPointerUp={() => inputSystem.setJump(false)}
			>
				JUMP
			</button>
			<button
				type="button"
				className="action-btn grip"
				onPointerDown={() => inputSystem.setGrip(true)}
				onPointerUp={() => inputSystem.setGrip(false)}
			>
				GRIP
			</button>
			<button type="button" className="action-btn scope" onClick={onToggleZoom}>
				SCOPE
			</button>
			{nearLZ && (
				<button
					type="button"
					className={`action-btn build ${isBuildMode ? "active" : ""}`}
					onClick={onToggleBuildMode}
				>
					BUILD
				</button>
			)}
			{difficultyMode === "SUPPORT" && (
				<button
					type="button"
					className="action-btn support"
					onClick={() => audioEngine.playSFX("pickup")}
				>
					DROP
				</button>
			)}
		</div>
	);
}
