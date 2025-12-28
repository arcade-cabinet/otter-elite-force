/**
 * HUD Stats Display
 * Shows health, coordinates, territory, peacekeeping, and resources
 */

interface HUDStatsProps {
	health: number;
	maxHealth: number;
	kills: number;
	playerPos: [number, number, number];
	territoryScore: number;
	peacekeepingScore: number;
	resources: { wood: number; metal: number; supplies: number };
}

export function HUDStats({
	health,
	maxHealth,
	kills,
	playerPos,
	territoryScore,
	peacekeepingScore,
	resources,
}: HUDStatsProps) {
	return (
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
				{territoryScore > 0 && <div className="hud-territory">TERRITORY: {territoryScore}</div>}
				{peacekeepingScore > 0 && (
					<div className="hud-peacekeeping">PEACEKEEPING: {peacekeepingScore}</div>
				)}
				<div className="hud-resources">
					<span className="resource-mini">🪵 {resources.wood}</span>
					<span className="resource-mini">⚙️ {resources.metal}</span>
					<span className="resource-mini">📦 {resources.supplies}</span>
				</div>
			</div>

			<div className="hud-objective">
				<span className="hud-label">ELIMINATIONS</span>
				<br />
				<span className="hud-value">{kills}</span>
			</div>
		</div>
	);
}
