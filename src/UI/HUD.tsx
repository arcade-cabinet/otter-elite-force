/**
 * HUD (Heads-Up Display)
 * In-game UI overlay
 *
 * Mobile-first design with:
 * - 48px minimum touch targets
 * - Visible joystick zones
 * - First-objective prompts
 * - Directional damage indicators
 */

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { audioEngine } from "../Core/AudioEngine";
import { inputSystem } from "../Core/InputSystem";
import { useGameStore } from "../stores/gameStore";
import { BUILDABLE_TEMPLATES, canAffordBuildable } from "../ecs/data/buildableTemplates";
import { CHUNK_SIZE } from "../utils/constants";

export function HUD() {
	const {
		health,
		maxHealth,
		kills,
		mudAmount,
		playerPos,
		saveData,
		isBuildMode,
		selectedComponentType,
		lastDamageDirection,
		resources,
		spendResources,
	} = useGameStore(
	const chunkRadius = typeof CHUNK_SIZE === "number" ? CHUNK_SIZE * 2 : 0;
		useShallow((state) => ({
			health: state.health,
			maxHealth: state.maxHealth,
			kills: state.kills,
			mudAmount: state.mudAmount,
			playerPos: state.playerPos,
			saveData: state.saveData,
			isBuildMode: state.isBuildMode,
			selectedComponentType: state.selectedComponentType,
			lastDamageDirection: state.lastDamageDirection,
			resources: state.saveData.resources,
			spendResources: state.spendResources,
		})),
	);

	const toggleZoom = useGameStore((state) => state.toggleZoom);
	const requestSupplyDrop = useGameStore((state) => state.requestSupplyDrop);
	const setBuildMode = useGameStore((state) => state.setBuildMode);
	const setSelectedComponentType = useGameStore((state) => state.setSelectedComponentType);
	const placeComponent = useGameStore((state) => state.placeComponent);
	const setHudReady = useGameStore((state) => state.setHudReady);

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

	const handlePlace = useCallback(
		(templateId: string) => {
			const template = BUILDABLE_TEMPLATES.find((t) => t.id === templateId);
			if (!template) return;

			if (!canAffordBuildable(template, resources)) {
				audioEngine.playSFX("error");
				return;
			}

			const pos: [number, number, number] = [
				Math.round(playerPos[0] / 4) * 4,
				Math.round(playerPos[1]),
				Math.round(playerPos[2] / 4) * 4,
			];

			// Simple offset logic based on template category
			if (template.category === "ROOF") pos[1] += 2.5;
			if (template.category === "WALLS") pos[1] += 1;

			spendResources(template.cost);
			placeComponent({
				type: (template.category === "FOUNDATION"
					? "FLOOR"
					: template.category === "WALLS"
						? "WALL"
						: template.category === "ROOF"
							? "ROOF"
							: "STILT") as any,
				position: pos,
				rotation: [0, 0, 0],
			});

			// If first build, secure LZ
			if (!saveData.isLZSecured) {
				useGameStore.getState().secureLZ();
			}

			audioEngine.playSFX("pickup");
		},
		[playerPos, placeComponent, resources, spendResources, saveData.isLZSecured],
	);

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
						animation: "pulse 2s infinite",
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
						Return to coordinates (0, 0) and establish your base
					</div>
					{/* Directional Arrow to LZ (0,0) */}
					<div
						style={{
							marginTop: "15px",
							fontSize: "2rem",
							transform: `rotate(${Math.atan2(-playerPos[0], -playerPos[2])}rad)`,
							display: "inline-block",
							color: "var(--primary)",
							textShadow: "0 0 10px var(--primary)",
						}}
					>
						↑
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
					{(() => {
						const chunkX = Math.floor(playerPos[0] / 100);
						const chunkZ = Math.floor(playerPos[2] / 100);
						const chunkId = `${chunkX},${chunkZ}`;
						const currentChunk = saveData.discoveredChunks[chunkId];
						const territoryState = currentChunk?.territoryState || "NEUTRAL";
						const statusColor =
							territoryState === "SECURED"
								? "#00ff00"
								: territoryState === "HOSTILE"
									? "#ff0000"
									: "#ffaa00";
						return (
							<div className="hud-chunk-status" style={{ color: statusColor }}>
								CHUNK: [{chunkX}, {chunkZ}] • {territoryState}
							</div>
						);
					})()}
					{saveData.territoryScore > 0 && (
						<div className="hud-territory">
							TERRITORY: {saveData.territoryScore} / {Object.keys(saveData.discoveredChunks).length}
						</div>
					)}
					{saveData.peacekeepingScore > 0 && (
						<div className="hud-peacekeeping">PEACEKEEPING: {saveData.peacekeepingScore}</div>
					)}
					<div
						className="hud-resources"
						style={{ marginTop: "10px", fontSize: "0.7rem", color: "#aaa" }}
					>
						<span style={{ color: "#8b4513" }}>WOOD: {resources.wood}</span> |{" "}
						<span style={{ color: "#b0c4de" }}>METAL: {resources.metal}</span> |{" "}
						<span style={{ color: "#ff8c00" }}>SUPPLIES: {resources.supplies}</span>
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
				{(saveData.isLZSecured ||
					(Math.abs(playerPos[0]) < chunkRadius &&
						Math.abs(playerPos[2]) < chunkRadius)) && (
					<button
						type="button"
						className={`action-btn build ${isBuildMode ? "active" : ""}`}
						onClick={() => setBuildMode(!isBuildMode)}
					>
						BUILD
					</button>
				)}
				{(saveData.difficultyMode === "SUPPORT" ||
					(Math.abs(playerPos[0]) < 20 && Math.abs(playerPos[2]) < 20)) && (
					<button type="button" className="action-btn support" onClick={requestSupplyDrop}>
						DROP
					</button>
				)}
			</div>

			{/* BUILD UI (Bottom Center) */}
			{isBuildMode && (
				<div
					className="build-ui"
					style={{
						position: "absolute",
						bottom: "200px",
						left: "50%",
						transform: "translateX(-50%)",
						background: "rgba(0, 0, 0, 0.9)",
						border: "2px solid var(--primary)",
						borderRadius: "8px",
						padding: "15px",
						width: "90%",
						maxWidth: "600px",
						zIndex: 200,
						pointerEvents: "auto",
					}}
				>
					<div
						className="build-header"
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: "15px",
							color: "var(--primary)",
							fontWeight: "bold",
						}}
					>
						<span>COMPONENT REQUISITION</span>
						<button
							type="button"
							onClick={() => setBuildMode(false)}
							style={{
								width: "auto",
								margin: 0,
								padding: "2px 10px",
								fontSize: "0.8rem",
								background: "#444",
							}}
						>
							CLOSE
						</button>
					</div>
					<div
						className="build-palette"
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
							gap: "10px",
							maxHeight: "300px",
							overflowY: "auto",
						}}
					>
						{BUILDABLE_TEMPLATES.map((template) => {
							const affordable = canAffordBuildable(template, resources);
							return (
								<button
									key={template.id}
									type="button"
									className={selectedComponentType === template.id ? "selected" : ""}
									onClick={() => handlePlace(template.id)}
									disabled={!affordable}
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										padding: "10px",
										fontSize: "0.7rem",
										margin: 0,
										opacity: affordable ? 1 : 0.5,
										background: affordable ? "rgba(255, 170, 0, 0.1)" : "#222",
										border: "1px solid #444",
									}}
								>
									<div style={{ fontWeight: "bold", marginBottom: "5px" }}>{template.name}</div>
									<div style={{ fontSize: "0.6rem", color: "#aaa" }}>
										W:{template.cost.wood} M:{template.cost.metal} S:{template.cost.supplies}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

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
