/**
 * HUD (Heads-Up Display)
 * In-game UI overlay
 */

import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { audioEngine } from "../Core/AudioEngine";
import { inputSystem } from "../Core/InputSystem";
import { useGameStore } from "../stores/gameStore";

export function HUD() {
	const { health, maxHealth, kills, mudAmount, playerPos, saveData, isBuildMode } = useGameStore(
		useShallow((state) => ({
			health: state.health,
			maxHealth: state.maxHealth,
			kills: state.kills,
			mudAmount: state.mudAmount,
			playerPos: state.playerPos,
			saveData: state.saveData,
			isBuildMode: state.isBuildMode,
		})),
	);

	const toggleZoom = useGameStore((state) => state.toggleZoom);
	const setBuildMode = useGameStore((state) => state.setBuildMode);
	const placeComponent = useGameStore((state) => state.placeComponent);

	const handlePlace = useCallback(
		(type: "FLOOR" | "WALL" | "ROOF" | "STILT") => {
			const pos: [number, number, number] = [
				Math.round(playerPos[0] / 4) * 4,
				Math.round(playerPos[1]),
				Math.round(playerPos[2] / 4) * 4,
			];

			if (type === "ROOF") pos[1] += 2.5;
			if (type === "WALL") pos[1] += 1;

			placeComponent({
				type,
				position: pos,
				rotation: [0, 0, 0],
			});
			audioEngine.playSFX("pickup");
		},
		[playerPos, placeComponent],
	);

	return (
		<div className="hud-container">
			{/* Mud Overlay */}
			<div className="mud-overlay" style={{ opacity: mudAmount }} />

			{/* Top HUD */}
			<div className="hud-top">
				<div className="hud-left">
					<div className="hud-health">
						<span className="hud-label">INTEGRITY</span>
						<div className="hud-hp-bar">
							<div className="hud-hp-fill" style={{ width: `${(health / maxHealth) * 100}%` }} />
						</div>
					</div>
					<div className="hud-coords">
						COORD: {Math.floor(playerPos[0])}, {Math.floor(playerPos[2])}
					</div>
					<div className="hud-territory">TERRITORY SECURED: {saveData.territoryScore}</div>
					<div className="hud-peacekeeping">PEACEKEEPING: {saveData.peacekeepingScore}</div>
				</div>

				<div className="hud-objective">
					<span className="hud-label">ELIMINATIONS</span>
					<br />
					<span className="hud-value">{kills}</span>
				</div>
			</div>

			{/* Action Cluster (Right Side) */}
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
				<button type="button" className="action-btn scope" onClick={toggleZoom}>
					SCOPE
				</button>
				{saveData.isLZSecured && (
					<button
						type="button"
						className={`action-btn build ${isBuildMode ? "active" : ""}`}
						onClick={() => setBuildMode(!isBuildMode)}
					>
						BUILD
					</button>
				)}
				{saveData.difficultyMode === "SUPPORT" && (
					<button
						type="button"
						className="action-btn support"
						onClick={() => audioEngine.playSFX("pickup")}
					>
						DROP
					</button>
				)}
			</div>

			{/* BUILD UI (Bottom Center) */}
			{isBuildMode && (
				<div className="build-ui">
					<button type="button" onClick={() => handlePlace("FLOOR")}>
						+FLOOR
					</button>
					<button type="button" onClick={() => handlePlace("WALL")}>
						+WALL
					</button>
					<button type="button" onClick={() => handlePlace("ROOF")}>
						+ROOF
					</button>
					<button type="button" onClick={() => handlePlace("STILT")}>
						+STILT
					</button>
				</div>
			)}

			{/* Joystick zones */}
			<div id="joystick-move" className="joystick-zone left" />
			<div id="joystick-look" className="joystick-zone drag-area" />
		</div>
	);
}
