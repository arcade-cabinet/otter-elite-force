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

			{/* Scope Button */}
			<button type="button" className="scope-btn" onClick={toggleZoom} aria-label="Toggle Scope">
				SCOPE
			</button>

			{/* Jump Button */}
			<button
				type="button"
				className="jump-btn"
				onPointerDown={() => inputSystem.setJump(true)}
				onPointerUp={() => inputSystem.setJump(false)}
				aria-label="Jump"
			>
				JUMP
			</button>

			{/* Grip Button */}
			<button
				type="button"
				className="grip-btn"
				onPointerDown={() => inputSystem.setGrip(true)}
				onPointerUp={() => inputSystem.setGrip(false)}
				aria-label="Grip"
			>
				GRIP
			</button>

			{/* Joystick zones */}
			<div id="joystick-move" className="joystick-zone left" />
			<div id="joystick-look" className="joystick-zone right" />
		</div>
	);
}
