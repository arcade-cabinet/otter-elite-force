/**
 * HUD Overlay Components
 * Damage indicators, objectives, warnings
 */

interface DamageIndicatorProps {
	show: boolean;
	direction: { x: number; y: number } | null;
}

export function DamageIndicator({ show, direction }: DamageIndicatorProps) {
	if (!show || !direction) return null;

	return (
		<div
			className="damage-indicator"
			style={{
				position: "absolute",
				top: direction.y < 0 ? "0" : "auto",
				bottom: direction.y > 0 ? "0" : "auto",
				left: direction.x < 0 ? "0" : "auto",
				right: direction.x > 0 ? "0" : "auto",
				width: Math.abs(direction.x) > Math.abs(direction.y) ? "30%" : "100%",
				height: Math.abs(direction.y) > Math.abs(direction.x) ? "30%" : "100%",
				background: "linear-gradient(to center, rgba(255,0,0,0.6), transparent)",
				pointerEvents: "none",
				zIndex: 100,
			}}
		/>
	);
}

interface FirstObjectivePromptProps {
	show: boolean;
	nearLZ: boolean;
	playerPos: [number, number, number];
}

export function FirstObjectivePrompt({ show, nearLZ, playerPos }: FirstObjectivePromptProps) {
	if (!show) return null;

	return (
		<div
			className="first-objective-prompt"
			style={{
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				background: "rgba(0, 0, 0, 0.85)",
				border: "2px solid var(--primary, #ffa500)",
				borderRadius: "8px",
				padding: "20px 30px",
				textAlign: "center",
				zIndex: 50,
			}}
		>
			<div
				style={{
					color: "var(--primary, #ffa500)",
					fontSize: "1.2rem",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				FIRST OBJECTIVE
			</div>
			<div style={{ color: "#fff", fontSize: "1rem" }}>SECURE YOUR LZ</div>
			<div style={{ color: "#888", fontSize: "0.8rem", marginTop: "8px" }}>
				Return to coordinates (0, 0) and build a WATCHTOWER
			</div>
			{!nearLZ && (
				<div style={{ color: "var(--accent, #00ccff)", fontSize: "0.9rem", marginTop: "10px" }}>
					LZ DISTANCE: {Math.round(Math.sqrt(playerPos[0] ** 2 + playerPos[2] ** 2))}m
				</div>
			)}
			<div style={{ color: "#aaa", fontSize: "0.7rem", marginTop: "4px" }}>
				Defeat enemies to collect resources
			</div>
		</div>
	);
}

interface FallWarningProps {
	show: boolean;
}

export function FallWarning({ show }: FallWarningProps) {
	if (!show) return null;

	return (
		<div
			className="fall-warning"
			style={{
				position: "absolute",
				top: "25%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				background: "rgba(100, 0, 0, 0.6)",
				backdropFilter: "blur(4px)",
				border: "2px solid #ff0000",
				borderRadius: "8px",
				padding: "15px 25px",
				textAlign: "center",
				zIndex: 55,
				boxShadow: "0 0 20px rgba(255, 0, 0, 0.4)",
				animation: "pulse 1s infinite",
			}}
		>
			<div
				style={{
					color: "#fff",
					fontSize: "1.4rem",
					fontWeight: "bold",
					letterSpacing: "2px",
				}}
			>
				THE FALL
			</div>
			<div style={{ color: "#fff", fontSize: "0.9rem", marginTop: "5px" }}>
				CRITICAL INTEGRITY - RETURN TO LZ (0, 0)
			</div>
		</div>
	);
}
