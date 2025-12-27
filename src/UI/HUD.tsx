/**
 * HUD (Heads-Up Display)
 * In-game UI overlay
 */

import { inputSystem } from "../Core/InputSystem";
import { useGameStore } from "../stores/gameStore";

export function HUD() {
	const { health, maxHealth, kills, mudAmount, playerPos, toggleZoom } = useGameStore();
	// HUD logic...

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
					<div className="hud-territory">
						TERRITORY SECURED: {useGameStore.getState().saveData.territoryScore}
					</div>
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
				<button 
					type="button" 
					className="action-btn scope" 
					onClick={toggleZoom}
				>
					SCOPE
				</button>
			</div>

			{/* Joystick zones */}
			<div id="joystick-move" className="joystick-zone left" />
			<div id="joystick-look" className="joystick-zone drag-area" />
		</div>
	);
}
