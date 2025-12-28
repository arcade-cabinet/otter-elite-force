/**
 * Enemy Health Bars
 * HTML overlay showing enemy health with:
 * - Color coding: Green > Yellow > Red
 * - Fade after 3 seconds of no damage
 * - Optional numeric HP display
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { enemies } from "../ecs/world";

interface HealthBarData {
	entityId: string;
	position: THREE.Vector3;
	health: number;
	maxHealth: number;
	lastDamageTime: number;
	visible: boolean;
}

interface EnemyHealthBarsProps {
	showNumericHP?: boolean;
}

export function EnemyHealthBars({ showNumericHP = false }: EnemyHealthBarsProps) {
	const { camera, size } = useThree();
	const [healthBars, setHealthBars] = useState<Map<string, HealthBarData>>(new Map());
	const tempVector = useRef(new THREE.Vector3());
	const tempVector2 = useRef(new THREE.Vector3());

	// Update health bar data from ECS
	useFrame(() => {
		const now = Date.now();
		const newHealthBars = new Map<string, HealthBarData>();

		for (const entity of enemies) {
			if (!entity.health || !entity.transform) continue;
			if (entity.isDead) continue;

			const timeSinceDamage = (now - entity.health.lastDamageTime) / 1000;
			const wasRecentlyDamaged = timeSinceDamage < 3;

			// Only show if recently damaged
			if (wasRecentlyDamaged) {
				// Calculate position above enemy
				const worldPos = tempVector.current;
				worldPos.copy(entity.transform.position);
				worldPos.y += 2; // Position above enemy

				newHealthBars.set(entity.id, {
					entityId: entity.id,
					position: worldPos.clone(),
					health: entity.health.current,
					maxHealth: entity.health.max,
					lastDamageTime: entity.health.lastDamageTime,
					visible: true,
				});
			}
		}

		setHealthBars(newHealthBars);
	});

	// Convert 3D position to 2D screen position
	const get2DPosition = (worldPos: THREE.Vector3): { x: number; y: number; visible: boolean } => {
		const screenPos = tempVector2.current.copy(worldPos);
		screenPos.project(camera);

		// Check if behind camera
		if (screenPos.z > 1) {
			return { x: 0, y: 0, visible: false };
		}

		const x = (screenPos.x * 0.5 + 0.5) * size.width;
		const y = (screenPos.y * -0.5 + 0.5) * size.height;

		return { x, y, visible: true };
	};

	// Get color based on health percentage
	const getHealthColor = (healthPercent: number): string => {
		if (healthPercent > 0.6) return "#4caf50"; // Green
		if (healthPercent > 0.3) return "#ffeb3b"; // Yellow
		return "#f44336"; // Red
	};

	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				zIndex: 10,
			}}
		>
			{Array.from(healthBars.values()).map((data) => {
				const screenPos = get2DPosition(data.position);
				if (!screenPos.visible) return null;

				const healthPercent = data.health / data.maxHealth;
				const color = getHealthColor(healthPercent);
				const timeSinceDamage = (Date.now() - data.lastDamageTime) / 1000;
				const opacity = Math.max(0, 1 - timeSinceDamage / 3); // Fade over 3 seconds

				return (
					<div
						key={data.entityId}
						style={{
							position: "absolute",
							left: screenPos.x - 25,
							top: screenPos.y - 20,
							width: "50px",
							opacity,
							transition: "opacity 0.3s ease-out",
						}}
					>
						{/* Health bar background */}
						<div
							style={{
								width: "100%",
								height: "6px",
								backgroundColor: "rgba(0, 0, 0, 0.6)",
								borderRadius: "3px",
								overflow: "hidden",
								border: "1px solid rgba(255, 255, 255, 0.3)",
							}}
						>
							{/* Health bar fill */}
							<div
								style={{
									width: `${healthPercent * 100}%`,
									height: "100%",
									backgroundColor: color,
									transition: "width 0.2s ease-out",
									boxShadow: `0 0 3px ${color}`,
								}}
							/>
						</div>

						{/* Optional numeric HP display */}
						{showNumericHP && (
							<div
								style={{
									fontSize: "10px",
									color: "#fff",
									textAlign: "center",
									marginTop: "2px",
									textShadow: "0 0 3px #000, 0 0 5px #000",
									fontWeight: "bold",
								}}
							>
								{Math.ceil(data.health)}/{data.maxHealth}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
