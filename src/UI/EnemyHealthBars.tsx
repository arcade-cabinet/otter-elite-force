/**
 * Enemy Health Bars
 * 3D health bars using strata HealthBar component.
 *
 * Features:
 * - 3D positioning above enemies
 * - Color coding: Green > Yellow > Red
 * - Fade after 3 seconds of no damage
 * - Distance-based fading
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { HealthBar } from "../lib/strata/core";
import { enemies } from "../ecs/world";

interface HealthBarData {
	entityId: string;
	position: [number, number, number];
	health: number;
	maxHealth: number;
	lastDamageTime: number;
}

interface EnemyHealthBarsProps {
	showNumericHP?: boolean;
}

/**
 * Get health bar color based on percentage.
 */
function getHealthColor(healthPercent: number): string {
	if (healthPercent > 0.6) return "#4caf50"; // Green
	if (healthPercent > 0.3) return "#ffeb3b"; // Yellow
	return "#f44336"; // Red
}

/**
 * Component that renders health bars for all enemies using strata HealthBar.
 */
export function EnemyHealthBars({ showNumericHP = false }: EnemyHealthBarsProps) {
	const [healthBars, setHealthBars] = useState<Map<string, HealthBarData>>(new Map());

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
				newHealthBars.set(entity.id, {
					entityId: entity.id,
					position: [
						entity.transform.position.x,
						entity.transform.position.y + 2, // Above enemy
						entity.transform.position.z,
					],
					health: entity.health.current,
					maxHealth: entity.health.max,
					lastDamageTime: entity.health.lastDamageTime,
				});
			}
		}

		setHealthBars(newHealthBars);
	});

	return (
		<>
			{Array.from(healthBars.values()).map((data) => {
				const healthPercent = data.health / data.maxHealth;
				const color = getHealthColor(healthPercent);

				return (
					<HealthBar
						key={data.entityId}
						position={data.position}
						value={data.health}
						maxValue={data.maxHealth}
						width={50}
						height={6}
						fillColor={color}
						backgroundColor="rgba(0, 0, 0, 0.6)"
						borderColor="rgba(255, 255, 255, 0.3)"
						borderWidth={1}
						borderRadius={3}
						showText={showNumericHP}
						textFormat="value"
						animationDuration={200}
						glowColor={color}
						glowIntensity={0.3}
						distanceFade={{
							start: 15,
							end: 30,
						}}
					/>
				);
			})}
		</>
	);
}

/**
 * Fallback 2D overlay version for when 3D rendering isn't suitable.
 * Uses HTML overlay instead of strata 3D HealthBar.
 */
export function EnemyHealthBars2D({ showNumericHP = false }: EnemyHealthBarsProps) {
	const { camera, size } = useThree();
	const [healthBars, setHealthBars] = useState<Map<string, HealthBarData>>(new Map());

	useFrame(() => {
		const now = Date.now();
		const newHealthBars = new Map<string, HealthBarData>();

		for (const entity of enemies) {
			if (!entity.health || !entity.transform) continue;
			if (entity.isDead) continue;

			const timeSinceDamage = (now - entity.health.lastDamageTime) / 1000;
			if (timeSinceDamage < 3) {
				newHealthBars.set(entity.id, {
					entityId: entity.id,
					position: [
						entity.transform.position.x,
						entity.transform.position.y + 2,
						entity.transform.position.z,
					],
					health: entity.health.current,
					maxHealth: entity.health.max,
					lastDamageTime: entity.health.lastDamageTime,
				});
			}
		}
		setHealthBars(newHealthBars);
	});

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
				const healthPercent = data.health / data.maxHealth;
				const color = getHealthColor(healthPercent);
				const timeSinceDamage = (Date.now() - data.lastDamageTime) / 1000;
				const opacity = Math.max(0, 1 - timeSinceDamage / 3);

				// Project to screen
				const vec = new THREE.Vector3(...data.position);
				vec.project(camera);
				if (vec.z > 1) return null;

				const x = (vec.x * 0.5 + 0.5) * size.width;
				const y = (vec.y * -0.5 + 0.5) * size.height;

				return (
					<div
						key={data.entityId}
						style={{
							position: "absolute",
							left: x - 25,
							top: y - 20,
							width: "50px",
							opacity,
						}}
					>
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
							<div
								style={{
									width: `${healthPercent * 100}%`,
									height: "100%",
									backgroundColor: color,
									boxShadow: `0 0 3px ${color}`,
								}}
							/>
						</div>
						{showNumericHP && (
							<div
								style={{
									fontSize: "10px",
									color: "#fff",
									textAlign: "center",
									marginTop: "2px",
									textShadow: "0 0 3px #000",
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
