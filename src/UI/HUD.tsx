/**
 * HUD (Heads-Up Display)
 * In-game UI overlay using strata components.
 *
 * Mobile-first design with:
 * - Strata VirtualJoystick for touch controls
 * - First-objective prompts
 * - Directional damage indicators
 */

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { VirtualJoystick } from "../lib/strata/core";
import { usePlaySFX } from "../lib/strata/audio-synth";
import { inputSystem } from "../Core/InputSystem";
import { useGameStore } from "../stores/gameStore";

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
	} = useGameStore(
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
		})),
	);

	const toggleZoom = useGameStore((state) => state.toggleZoom);
	const requestSupplyDrop = useGameStore((state) => state.requestSupplyDrop);
	const setBuildMode = useGameStore((state) => state.setBuildMode);
	const setSelectedComponentType = useGameStore((state) => state.setSelectedComponentType);
	const placeComponent = useGameStore((state) => state.placeComponent);
	const setHudReady = useGameStore((state) => state.setHudReady);

	// Use strata audio-synth hook
	const playSFX = usePlaySFX();

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
			playSFX("pickup");
		},
		[playerPos, placeComponent, playSFX],
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
				{(saveData.difficultyMode === "SUPPORT" ||
					(Math.abs(playerPos[0]) < 20 && Math.abs(playerPos[2]) < 20)) && (
					<button type="button" className="action-btn support" onClick={requestSupplyDrop}>
						DROP
					</button>
				)}
			</div>

			{/* BUILD UI (Bottom Center) */}
			{isBuildMode && (
				<div className="build-ui">
					<div className="build-palette">
						{(["FLOOR", "WALL", "ROOF", "STILT"] as const).map((type) => (
							<button
								key={type}
								type="button"
								className={selectedComponentType === type ? "selected" : ""}
								onClick={() => setSelectedComponentType(type)}
							>
								{type}
							</button>
						))}
					</div>
					<button
						type="button"
						className="place-btn"
						onClick={() => handlePlace(selectedComponentType)}
					>
						PLACE {selectedComponentType}
					</button>
				</div>
			)}

			{/* Strata VirtualJoystick for Movement (Left Side) */}
			<VirtualJoystick
				onMove={inputSystem.onMoveJoystick}
				onStart={inputSystem.onMoveStart}
				onEnd={inputSystem.onMoveEnd}
				size={120}
				color="rgba(255, 170, 0, 0.6)"
				opacity={0.3}
				containerStyle={{
					position: "fixed",
					left: "20px",
					bottom: "20px",
					width: "150px",
					height: "150px",
					zIndex: 999,
				}}
			/>

			{/* Strata VirtualJoystick for Look/Aim (Right Side) */}
			<VirtualJoystick
				onMove={inputSystem.onLookJoystick}
				onStart={inputSystem.onLookStart}
				onEnd={inputSystem.onLookEnd}
				size={120}
				color="rgba(255, 170, 0, 0.4)"
				opacity={0.2}
				containerStyle={{
					position: "fixed",
					right: "20px",
					bottom: "180px",
					width: "150px",
					height: "150px",
					zIndex: 999,
				}}
			/>
		</div>
	);
}
