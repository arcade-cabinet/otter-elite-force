/**
 * Damage Feedback UI
 * Shows:
 * - Hit markers on successful enemy hits
 * - Critical hit indicators
 * - Kill confirmations with XP/credit rewards
 * - Combo counter for rapid kills
 */

import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useGameStore } from "../stores/gameStore";

interface HitMarker {
	id: string;
	x: number;
	y: number;
	isCritical: boolean;
	timestamp: number;
}

interface KillNotification {
	id: string;
	enemyType: string;
	xp: number;
	credits: number;
	timestamp: number;
}

export function DamageFeedback() {
	const { comboCount, comboTimer, lastHit } = useGameStore(
		useShallow((state) => ({
			comboCount: state.comboCount,
			comboTimer: state.comboTimer,
			lastHit: state.lastHit,
		})),
	);

	const [hitMarkers, setHitMarkers] = useState<HitMarker[]>([]);
	const [killNotifications, setKillNotifications] = useState<KillNotification[]>([]);

	// Show combo when active
	const showCombo = comboCount > 1 && comboTimer > 0;

	// Clean up expired markers and notifications
	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			setHitMarkers((prev) => prev.filter((marker) => now - marker.timestamp < 500));
			setKillNotifications((prev) => prev.filter((notif) => now - notif.timestamp < 2000));
		}, 100);

		return () => clearInterval(interval);
	}, []);

	// Listen for new hits
	useEffect(() => {
		if (!lastHit) return;

		const newMarker: HitMarker = {
			id: `hit-${Date.now()}-${Math.random()}`,
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
			isCritical: lastHit.isCritical || false,
			timestamp: Date.now(),
		};

		setHitMarkers((prev) => [...prev, newMarker]);

		// Add kill notification if this was a kill
		if (lastHit.isKill) {
			const newKill: KillNotification = {
				id: `kill-${Date.now()}-${Math.random()}`,
				enemyType: lastHit.enemyType || "Enemy",
				xp: lastHit.xp || 0,
				credits: lastHit.credits || 0,
				timestamp: Date.now(),
			};

			setKillNotifications((prev) => [...prev, newKill]);
		}
	}, [lastHit]);

	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				zIndex: 15,
			}}
		>
			{/* Hit Markers */}
			{hitMarkers.map((marker) => {
				const age = Date.now() - marker.timestamp;
				const opacity = 1 - age / 500;
				const scale = 1 + age / 1000;

				return (
					<div
						key={marker.id}
						style={{
							position: "absolute",
							left: marker.x - 15,
							top: marker.y - 15,
							width: "30px",
							height: "30px",
							opacity,
							transform: `scale(${scale})`,
							transition: "all 0.1s ease-out",
						}}
					>
						{marker.isCritical ? (
							// Critical hit marker (X)
							<svg
								width="30"
								height="30"
								viewBox="0 0 30 30"
								aria-hidden="true"
								style={{
									filter: "drop-shadow(0 0 3px #ff0)",
								}}
							>
								<line
									x1="5"
									y1="5"
									x2="25"
									y2="25"
									stroke="#ff0"
									strokeWidth="3"
									strokeLinecap="round"
								/>
								<line
									x1="25"
									y1="5"
									x2="5"
									y2="25"
									stroke="#ff0"
									strokeWidth="3"
									strokeLinecap="round"
								/>
								<circle cx="15" cy="15" r="12" stroke="#ff0" strokeWidth="2" fill="none" />
							</svg>
						) : (
							// Regular hit marker
							<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
								<line
									x1="15"
									y1="5"
									x2="15"
									y2="12"
									stroke="#fff"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<line
									x1="15"
									y1="18"
									x2="15"
									y2="25"
									stroke="#fff"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<line
									x1="5"
									y1="15"
									x2="12"
									y2="15"
									stroke="#fff"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<line
									x1="18"
									y1="15"
									x2="25"
									y2="15"
									stroke="#fff"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						)}
					</div>
				);
			})}

			{/* Kill Notifications */}
			<div
				style={{
					position: "absolute",
					right: "20px",
					top: "100px",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					alignItems: "flex-end",
				}}
			>
				{killNotifications.map((notif) => {
					const age = Date.now() - notif.timestamp;
					const opacity = age < 1500 ? 1 : 1 - (age - 1500) / 500;

					return (
						<div
							key={notif.id}
							style={{
								background: "rgba(0, 0, 0, 0.8)",
								border: "2px solid #ffa500",
								borderRadius: "8px",
								padding: "12px 16px",
								opacity,
								transform: `translateY(${age < 100 ? -10 : 0}px)`,
								transition: "all 0.3s ease-out",
								minWidth: "150px",
							}}
						>
							<div
								style={{
									color: "#ffa500",
									fontSize: "1rem",
									fontWeight: "bold",
									marginBottom: "4px",
								}}
							>
								{notif.enemyType.toUpperCase()} ELIMINATED
							</div>
							<div
								style={{
									color: "#4caf50",
									fontSize: "0.9rem",
								}}
							>
								+{notif.xp} XP
							</div>
							{notif.credits > 0 && (
								<div
									style={{
										color: "#ffeb3b",
										fontSize: "0.9rem",
									}}
								>
									+{notif.credits} CREDITS
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Combo Counter */}
			{showCombo && (
				<div
					style={{
						position: "absolute",
						top: "20%",
						left: "50%",
						transform: "translateX(-50%)",
						textAlign: "center",
						animation: "pulse 0.5s ease-in-out infinite",
					}}
				>
					<div
						style={{
							fontSize: "3rem",
							fontWeight: "bold",
							color: "#ff0",
							textShadow:
								"0 0 10px #ff0, 0 0 20px #ff0, 0 0 30px #ff0, 2px 2px 4px rgba(0,0,0,0.8)",
							letterSpacing: "0.1em",
						}}
					>
						{comboCount}X
					</div>
					<div
						style={{
							fontSize: "1.2rem",
							color: "#fff",
							textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
							marginTop: "8px",
						}}
					>
						COMBO
					</div>
					{/* Combo timer bar */}
					<div
						style={{
							width: "200px",
							height: "4px",
							background: "rgba(0,0,0,0.6)",
							borderRadius: "2px",
							margin: "8px auto 0",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								width: `${(comboTimer / 3) * 100}%`,
								height: "100%",
								background: "linear-gradient(90deg, #ff0, #ffa500)",
								transition: "width 0.1s linear",
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
