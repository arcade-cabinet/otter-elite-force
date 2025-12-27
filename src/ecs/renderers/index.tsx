/**
 * ECS Renderers
 *
 * React Three Fiber components that render ECS entities.
 * Each renderer subscribes to entity data and updates visuals accordingly.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Entity } from "../world";

// =============================================================================
// HEALTH BAR COMPONENT
// =============================================================================

interface HealthBarProps {
	current: number;
	max: number;
	width?: number;
	height?: number;
	yOffset?: number;
	color?: string;
}

export function HealthBar({
	current,
	max,
	width = 1.4,
	height = 0.08,
	yOffset = 2,
	color = "#ff4400",
}: HealthBarProps) {
	const percentage = current / max;

	return (
		<group position={[0, yOffset, 0]}>
			{/* Background */}
			<mesh>
				<planeGeometry args={[width, height]} />
				<meshBasicMaterial color="#000" transparent opacity={0.5} side={THREE.DoubleSide} />
			</mesh>
			{/* Fill */}
			<mesh position={[-(1 - percentage) * (width / 2), 0, 0.01]} scale-x={percentage}>
				<planeGeometry args={[width, height]} />
				<meshBasicMaterial color={color} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

// =============================================================================
// GATOR RENDERER
// =============================================================================

interface GatorRendererProps {
	entity: Entity;
}

export function GatorRenderer({ entity }: GatorRendererProps) {
	const groupRef = useRef<THREE.Group>(null);
	const bodyRef = useRef<THREE.Group>(null);

	const scale = entity.enemy?.tier === "heavy" ? 1.6 : 1.1;
	const bodyColor = entity.enemy?.tier === "heavy" ? "#1a241a" : "#2d3d2d";
	const isAmbushing = entity.aiBrain?.currentState === "ambush";

	useFrame((state) => {
		if (!groupRef.current || !bodyRef.current || !entity.transform) return;

		// Sync position from ECS
		groupRef.current.position.copy(entity.transform.position);
		groupRef.current.rotation.copy(entity.transform.rotation);

		// Animate body Y position based on state
		const targetY = isAmbushing ? 0.8 : entity.gator?.isSubmerged ? -0.2 : 0.15;
		bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetY, 0.1);

		// Tilt when ambushing
		const targetRotX = isAmbushing ? -0.4 : 0;
		bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetRotX, 0.1);

		// Swim animation
		const t = state.clock.elapsedTime;
		const swimSpeed = isAmbushing ? 2 : 6;
		const swimAmount = isAmbushing ? 0.05 : 0.25;

		bodyRef.current.children.forEach((child, i) => {
			if (child.name.startsWith("segment")) {
				child.rotation.y = Math.sin(t * swimSpeed - i * 0.4) * swimAmount;
			}
		});
	});

	if (!entity.health) return null;

	return (
		<group ref={groupRef}>
			<group ref={bodyRef}>
				{/* Head/Chest */}
				<group position={[0, 0.1, 1.2 * scale]} name="segment-0">
					<mesh castShadow receiveShadow>
						<boxGeometry args={[0.6 * scale, 0.3 * scale, 1.1 * scale]} />
						<meshStandardMaterial color={bodyColor} roughness={0.9} />
					</mesh>
					{/* Armor plate */}
					<mesh position={[0, 0.2 * scale, 0]}>
						<boxGeometry args={[0.7 * scale, 0.15 * scale, 0.8 * scale]} />
						<meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
					</mesh>
					{/* Eyes */}
					{[-1, 1].map((side) => (
						<mesh key={`eye-${side}`} position={[side * 0.22 * scale, 0.12 * scale, 0.35 * scale]}>
							<sphereGeometry args={[0.05 * scale, 8, 8]} />
							<meshBasicMaterial color="#ffaa00" />
						</mesh>
					))}
				</group>

				{/* Body segments */}
				{[...Array(5)].map((_, i) => (
					<group
						key={`segment-${i}`}
						position={[0, 0.1, (0.4 - i * 0.75) * scale]}
						name={`segment-${i + 1}`}
					>
						<mesh castShadow receiveShadow>
							<boxGeometry args={[(0.85 - i * 0.1) * scale, 0.5 * scale, 0.85 * scale]} />
							<meshStandardMaterial color={bodyColor} roughness={0.9} />
						</mesh>
					</group>
				))}

				{/* Tail */}
				<group position={[0, 0.1, -3.2 * scale]} name="segment-6">
					<mesh castShadow>
						<boxGeometry args={[0.2 * scale, 0.2 * scale, 1.5 * scale]} />
						<meshStandardMaterial color={bodyColor} />
					</mesh>
				</group>
			</group>

			{/* Health bar */}
			<HealthBar current={entity.health.current} max={entity.health.max} yOffset={2 * scale} />
		</group>
	);
}

// =============================================================================
// SCOUT RENDERER
// =============================================================================

interface ScoutRendererProps {
	entity: Entity;
}

export function ScoutRenderer({ entity }: ScoutRendererProps) {
	const groupRef = useRef<THREE.Group>(null);
	const bodyRef = useRef<THREE.Group>(null);
	const antennaRef = useRef<THREE.Mesh>(null);

	const bodyColor = "#4a5a3a";
	const isSignaling = entity.scout?.isSignaling ?? false;
	const hasSpotted = entity.scout?.hasSpottedPlayer ?? false;

	useFrame((state) => {
		if (!groupRef.current || !bodyRef.current || !entity.transform) return;

		const t = state.clock.elapsedTime;

		// Sync position
		groupRef.current.position.copy(entity.transform.position);
		groupRef.current.rotation.copy(entity.transform.rotation);

		// Darting animation
		bodyRef.current.position.y = Math.sin(t * 15) * 0.03 + 0.4;
		bodyRef.current.rotation.z = Math.sin(t * 8) * 0.1;

		// Antenna pulse when signaling
		if (antennaRef.current) {
			antennaRef.current.scale.y = isSignaling ? 1 + Math.sin(t * 30) * 0.3 : 1;
		}
	});

	if (!entity.health) return null;

	return (
		<group ref={groupRef}>
			<group ref={bodyRef}>
				{/* Body */}
				<mesh castShadow receiveShadow>
					<capsuleGeometry args={[0.25, 0.8, 8, 12]} />
					<meshStandardMaterial color={bodyColor} roughness={0.85} />
				</mesh>

				{/* Head */}
				<group position={[0, 0.1, 0.6]}>
					<mesh castShadow>
						<sphereGeometry args={[0.18, 12, 12]} />
						<meshStandardMaterial color={bodyColor} roughness={0.85} />
					</mesh>
					{/* Eyes */}
					{[-1, 1].map((side) => (
						<mesh key={`eye-${side}`} position={[side * 0.1, 0.08, 0.1]}>
							<sphereGeometry args={[0.04, 8, 8]} />
							<meshBasicMaterial color={hasSpotted ? "#ff6600" : "#ffcc00"} />
						</mesh>
					))}
				</group>

				{/* Radio pack */}
				<group position={[0, 0.25, -0.1]}>
					<mesh castShadow>
						<boxGeometry args={[0.25, 0.15, 0.2]} />
						<meshStandardMaterial color="#2a2a1a" roughness={0.7} />
					</mesh>
					{/* Antenna */}
					<mesh ref={antennaRef} position={[0.08, 0.2, 0]}>
						<cylinderGeometry args={[0.01, 0.008, 0.4, 6]} />
						<meshStandardMaterial
							color={isSignaling ? "#ff4400" : "#333"}
							emissive={isSignaling ? "#ff2200" : "#000"}
							emissiveIntensity={isSignaling ? 0.5 : 0}
						/>
					</mesh>
				</group>
			</group>

			{/* Signal effect */}
			{isSignaling && (
				<group position={[0, 0.6, 0]}>
					{[0, 1, 2].map((i) => (
						<mesh
							key={`wave-${i}`}
							rotation-x={-Math.PI / 2}
							scale={1 + i * 0.5}
							position={[0, i * 0.1, 0]}
						>
							<torusGeometry args={[0.3, 0.02, 8, 24]} />
							<meshBasicMaterial color="#ff4400" transparent opacity={0.6 - i * 0.2} />
						</mesh>
					))}
					<pointLight color="#ff4400" intensity={2} distance={8} />
				</group>
			)}

			{/* Health bar */}
			<HealthBar
				current={entity.health.current}
				max={entity.health.max}
				yOffset={1.2}
				color="#88ff88"
			/>
		</group>
	);
}

// =============================================================================
// HAZARD RENDERERS
// =============================================================================

interface HazardRendererProps {
	entity: Entity;
}

export function MudPitRenderer({ entity }: HazardRendererProps) {
	if (!entity.transform) return null;

	const size = entity.transform.scale.x;

	return (
		<group position={entity.transform.position}>
			<mesh rotation-x={-Math.PI / 2} receiveShadow>
				<circleGeometry args={[size, 24]} />
				<meshStandardMaterial color="#3d2b1f" roughness={1} transparent opacity={0.9} />
			</mesh>
			{/* Bubbles */}
			{[...Array(5)].map((_, i) => (
				<mesh
					key={`bubble-${i}`}
					position={[Math.cos(i * 1.3) * size * 0.5, 0.05, Math.sin(i * 1.3) * size * 0.5]}
				>
					<sphereGeometry args={[0.1, 8, 8]} />
					<meshBasicMaterial color="#5d4037" transparent opacity={0.6} />
				</mesh>
			))}
		</group>
	);
}

export function ToxicSludgeRenderer({ entity }: HazardRendererProps) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!groupRef.current) return;
		const t = state.clock.elapsedTime;

		// Animate bubbles
		groupRef.current.children.forEach((child, i) => {
			if (child.name === "bubble") {
				child.position.y = 0.1 + Math.sin(t * 2 + i) * 0.05;
				child.scale.setScalar(0.8 + Math.sin(t * 3 + i * 0.5) * 0.2);
			}
		});
	});

	if (!entity.transform) return null;

	const size = entity.transform.scale.x;

	return (
		<group ref={groupRef} position={entity.transform.position}>
			<mesh rotation-x={-Math.PI / 2} receiveShadow>
				<circleGeometry args={[size, 24]} />
				<meshStandardMaterial
					color="#2d4a1f"
					roughness={0.3}
					metalness={0.2}
					transparent
					opacity={0.85}
				/>
			</mesh>
			{/* Toxic bubbles */}
			{[...Array(8)].map((_, i) => (
				<mesh
					key={`bubble-${i}`}
					name="bubble"
					position={[Math.cos(i * 0.8) * size * 0.6, 0.1, Math.sin(i * 0.8) * size * 0.6]}
				>
					<sphereGeometry args={[0.15, 8, 8]} />
					<meshBasicMaterial color="#7fff00" transparent opacity={0.5} />
				</mesh>
			))}
			{/* Toxic glow */}
			<pointLight color="#7fff00" intensity={0.5} distance={size * 2} />
		</group>
	);
}

// =============================================================================
// EXTRACTION POINT RENDERER
// =============================================================================

export function ExtractionPointRenderer({ entity }: { entity: Entity }) {
	const ringRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!ringRef.current) return;
		ringRef.current.rotation.y = state.clock.elapsedTime * 0.5;
	});

	if (!entity.transform) return null;

	return (
		<group position={entity.transform.position}>
			{/* Landing pad */}
			<mesh rotation-x={-Math.PI / 2} receiveShadow>
				<circleGeometry args={[5, 32]} />
				<meshStandardMaterial color="#2a3a2a" roughness={0.8} />
			</mesh>

			{/* H marking */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
				<ringGeometry args={[3.5, 4, 32]} />
				<meshBasicMaterial color="#ffaa00" />
			</mesh>

			{/* Rotating beacon rings */}
			<group ref={ringRef} position={[0, 0.5, 0]}>
				{[0, 1, 2].map((i) => (
					<mesh key={`ring-${i}`} rotation-x={-Math.PI / 2} position={[0, i * 0.3, 0]}>
						<torusGeometry args={[4 - i * 0.5, 0.05, 8, 32]} />
						<meshBasicMaterial color="#00ff00" transparent opacity={0.5 - i * 0.15} />
					</mesh>
				))}
			</group>

			{/* Beacon light */}
			<pointLight color="#00ff00" intensity={2} distance={15} position={[0, 2, 0]} />
		</group>
	);
}
