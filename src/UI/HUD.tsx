/**
 * HUD (Heads-Up Display)
 * In-game UI overlay
 */

import { useGameStore } from "../stores/gameStore";
import { LEVELS } from "../utils/constants";

export function HUD() {
	const { health, maxHealth, kills, currentLevel, toggleZoom } = useGameStore();
	const level = LEVELS[currentLevel];

	return (
		<div className="hud-container">
			{/* Top HUD */}
			<div className="hud-top">
				<div className="hud-health">
					<span className="hud-label">INTEGRITY</span>
					<div className="hud-hp-bar">
						<div
							className="hud-hp-fill"
							style={{ width: `${(health / maxHealth) * 100}%` }}
						/>
					</div>
				</div>

				<div className="hud-objective">
					<span className="hud-label">OBJECTIVE</span>
					<br />
					<span className="hud-value">
						{kills}/{level.goal}
					</span>
				</div>
			</div>

			{/* Scope Button */}
			<button
				type="button"
				className="scope-btn"
				onClick={toggleZoom}
				aria-label="Toggle Scope"
			>
				SCOPE
			</button>

			{/* Joystick zones */}
			<div id="joystick-move" className="joystick-zone left" />
			<div id="joystick-look" className="joystick-zone right" />
		</div>
	);
}
