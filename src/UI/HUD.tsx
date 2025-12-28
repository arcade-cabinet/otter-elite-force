/**
 * HUD (Heads-Up Display)
 * In-game UI overlay
 *
 * Mobile-first design with:
 * - 48px minimum touch targets
 * - Visible joystick zones
 * - First-objective prompts
 * - Directional damage indicators
 * - Build mode with palette UI
 */

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { audioEngine } from "../Core/AudioEngine";
import { inputSystem } from "../Core/InputSystem";
import type { BuildableTemplate } from "../ecs/data/buildableTemplates";
import { useGameStore } from "../stores/gameStore";
import { BuildPalette } from "./BuildPalette";

export function HUD() {
	const {
		health,
		maxHealth,
		kills,
		mudAmount,
		playerPos,
		saveData,
		isBuildMode,
		lastDamageDirection,
	} = useGameStore(
		useShallow((state) => ({
			health: state.health,
			maxHealth: state.maxHealth,
			kills: state.kills,
			mudAmount: state.mudAmount,
			playerPos: state.playerPos,
			saveData: state.saveData,
			isBuildMode: state.isBuildMode,
			lastDamageDirection: state.lastDamageDirection,
		})),
	);

	const toggleZoom = useGameStore((state) => state.toggleZoom);
	const setBuildMode = useGameStore((state) => state.setBuildMode);
	const placeComponent = useGameStore((state) => state.placeComponent);
const setHudReady = useGameStore((state) => state.setHudReady);
	const spendResources = useGameStore((state) => state.spendResources);
	const isNearLZ = useGameStore((state) => state.isNearLZ);
	const secureLZ = useGameStore((state) => state.secureLZ);

	const [_selectedBuildItem, setSelectedBuildItem] = useState<BuildableTemplate | null>(null);

	// Signal HUD mount/unmount for input system initialization
	useEffect(() => {
		setHudReady(true);
		return () => setHudReady(false);
	}, [setHudReady]);

	// Track damage flash for directional indicator
	const [showDamageFlash, setShowDamageFlash] = useState(false);
	const [prevHealth, setPrevHealth] = useState(health);

	useEffect(() => {
		if (health < prevHealth) {
			setShowDamageFlash(true);
			// Haptic feedback on damage
			if (navigator.vibrate) {
				navigator.vibrate(100);
			}
			const timer = setTimeout(() => setShowDamageFlash(false), 300);
			return () => clearTimeout(timer);
		}
		setPrevHealth(health);
	}, [health, prevHealth]);

	// First objective prompt for new players
	const showFirstObjective =
		!saveData.isLZSecured && Object.keys(saveData.discoveredChunks).length < 3;

	// The Fall mechanic for TACTICAL mode
	const showTheFall = saveData.difficultyMode === "TACTICAL" && saveData.isFallTriggered;

	const nearLZ = isNearLZ();

	const handleSelectItem = useCallback(
		(item: BuildableTemplate) => {
			setSelectedBuildItem(item);
			// In a full implementation, this would enter placement mode
			// For now, we'll just place it at player position
			const pos: [number, number, number] = [
				Math.round(playerPos[0] / 4) * 4,
				Math.round(playerPos[1]),
				Math.round(playerPos[2] / 4) * 4,
			];

			// Check if can afford and spend resources
			if (spendResources(item.cost.wood, item.cost.metal, item.cost.supplies)) {
				placeComponent({
					type: "FLOOR", // Simplified - would map from item
					position: pos,
					rotation: [0, 0, 0],
				});
				audioEngine.playSFX("pickup");

				// First build completes the tutorial
				if (!saveData.isLZSecured && item.id === "watchtower-kit") {
					secureLZ();
				}
			}
		},
		[playerPos, placeComponent, spendResources, saveData.isLZSecured, secureLZ],
	);

	const handleClosePalette = useCallback(() => {
		setBuildMode(false);
		setSelectedBuildItem(null);
	}, [setBuildMode]);

	return (
		<div className="hud-container">
			{/* Mud Overlay */}
			<div className="mud-overlay" style={{ opacity: mudAmount }} />

			{/* Directional Damage Indicator */}
			{showDamageFlash && lastDamageDirection && (
				<div
					className="damage-indicator"
					style={{
						position: "absolute",
						top: lastDamageDirection.y < 0 ? "0" : "auto",
						bottom: lastDamageDirection.y > 0 ? "0" : "auto",
						left: lastDamageDirection.x < 0 ? "0" : "auto",
						right: lastDamageDirection.x > 0 ? "0" : "auto",
						width:
							Math.abs(lastDamageDirection.x) > Math.abs(lastDamageDirection.y) ? "30%" : "100%",
						height:
							Math.abs(lastDamageDirection.y) > Math.abs(lastDamageDirection.x) ? "30%" : "100%",
						background: "linear-gradient(to center, rgba(255,0,0,0.6), transparent)",
						pointerEvents: "none",
						zIndex: 100,
					}}
				/>
			)}

			{/* First Objective Prompt */}
			{showFirstObjective && (
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
					<div style={{ color: "#aaa", fontSize: "0.7rem", marginTop: "4px" }}>
						Defeat enemies to collect resources
					</div>
				</div>
			)}

			{/* The Fall Warning (TACTICAL mode) */}
			{showTheFall && (
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
			)}

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
					{saveData.territoryScore > 0 && (
						<div className="hud-territory">TERRITORY: {saveData.territoryScore}</div>
					)}
					{saveData.peacekeepingScore > 0 && (
						<div className="hud-peacekeeping">PEACEKEEPING: {saveData.peacekeepingScore}</div>
					)}
					{/* Resource Display */}
					<div className="hud-resources">
						<span className="resource-mini">🪵 {saveData.resources.wood}</span>
						<span className="resource-mini">⚙️ {saveData.resources.metal}</span>
						<span className="resource-mini">📦 {saveData.resources.supplies}</span>
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
				<button type="button" className="action-btn scope" onClick={toggleZoom}>
					SCOPE
				</button>
				{nearLZ && (
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

			{/* BUILD UI (Component Palette) */}
			{isBuildMode && <BuildPalette onSelectItem={handleSelectItem} onClose={handleClosePalette} />}

			{/* Joystick zones - visible indicators for mobile players */}
			<div
				id="joystick-move"
				className="joystick-zone left"
				style={{
					position: "absolute",
					left: "20px",
					bottom: "20px",
					width: "150px",
					height: "150px",
					borderRadius: "50%",
					border: "2px dashed rgba(255, 170, 0, 0.3)",
					background: "radial-gradient(circle, rgba(255, 170, 0, 0.1) 0%, transparent 70%)",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: "rgba(255, 170, 0, 0.4)",
						fontSize: "0.7rem",
						textAlign: "center",
						pointerEvents: "none",
					}}
				>
					MOVE
				</div>
			</div>
			<div
				id="joystick-look"
				className="joystick-zone drag-area"
				style={{
					position: "absolute",
					right: "20px",
					bottom: "180px",
					width: "150px",
					height: "150px",
					borderRadius: "8px",
					border: "2px dashed rgba(255, 170, 0, 0.2)",
					background: "rgba(255, 170, 0, 0.05)",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: "rgba(255, 170, 0, 0.3)",
						fontSize: "0.7rem",
						textAlign: "center",
						pointerEvents: "none",
					}}
				>
					DRAG TO
					<br />
					AIM
				</div>
			</div>
		</div>
	);
}
