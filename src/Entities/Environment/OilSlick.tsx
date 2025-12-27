import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface OilSlickProps {
	position: [number, number, number] | THREE.Vector3;
	size?: number;
	isIgnited?: boolean;
	onIgnite?: () => void;
	onBurnOut?: () => void;
}

const BURN_DURATION = 15; // seconds before fire burns out
const EMBER_COUNT = 12;
const FLAME_COUNT = 8;

/**
 * OilSlick - Environmental hazard that can be ignited
 * Realistic fire with layered flames, rising embers, and dynamic lighting
 * Burns for a duration then extinguishes, leaving charred residue
 */
export function OilSlick({
	position,
	size = 3,
	isIgnited = false,
	onIgnite,
	onBurnOut,
}: OilSlickProps) {
	const [isLit, setIsLit] = useState(isIgnited);
	const [isBurntOut, setIsBurntOut] = useState(false);
	const fireRef = useRef<THREE.Group>(null);
	const embersRef = useRef<THREE.Group>(null);
	const lightRef = useRef<THREE.PointLight>(null);
	const burnTimeRef = useRef(0);

	// Generate random ember positions
	const emberData = useMemo(
		() =>
			[...Array(EMBER_COUNT)].map((_, i) => ({
				angle: (i / EMBER_COUNT) * Math.PI * 2,
				radius: 0.3 + Math.random() * (size * 0.6),
				speed: 1 + Math.random() * 2,
				phase: Math.random() * Math.PI * 2,
			})),
		[size],
	);

	// Sync with external ignition state
	useEffect(() => {
		if (isIgnited && !isLit && !isBurntOut) {
			setIsLit(true);
			burnTimeRef.current = 0;
		}
	}, [isIgnited, isLit, isBurntOut]);

	// Handle player/projectile ignition
	const handlePointerDown = () => {
		if (!isLit && !isBurntOut) {
			setIsLit(true);
			burnTimeRef.current = 0;
			onIgnite?.();
		}
	};

	useFrame((state, delta) => {
		const t = state.clock.elapsedTime;

		if (isLit && !isBurntOut) {
			burnTimeRef.current += delta;
			const burnProgress = burnTimeRef.current / BURN_DURATION;
			const intensity = Math.max(0, 1 - burnProgress * 0.5); // Fade as it burns

			// Check if burned out
			if (burnTimeRef.current >= BURN_DURATION) {
				setIsLit(false);
				setIsBurntOut(true);
				onBurnOut?.();
				return;
			}

			// Animate flame bodies - organic pulsing
			if (fireRef.current) {
				fireRef.current.children.forEach((child, i) => {
					const offset = i * 0.7;
					const flicker = Math.sin(t * 12 + offset) * 0.15 + Math.sin(t * 7 + offset * 2) * 0.1;
					child.position.y = 0.3 + flicker + Math.sin(t * 3 + offset) * 0.2;
					child.scale.y = (0.8 + Math.sin(t * 8 + offset) * 0.3) * intensity;
					child.scale.x = child.scale.z = (0.6 + Math.sin(t * 6 + offset) * 0.2) * intensity;
				});
			}

			// Animate rising embers
			if (embersRef.current) {
				embersRef.current.children.forEach((child, i) => {
					const data = emberData[i];
					const emberY = (t * data.speed + data.phase) % 3;
					child.position.x = Math.cos(data.angle + t * 0.5) * data.radius;
					child.position.z = Math.sin(data.angle + t * 0.5) * data.radius;
					child.position.y = emberY * 1.5;
					// Fade out as they rise
					const opacity = Math.max(0, 1 - emberY / 3) * intensity;
					(child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
						color: `hsl(${20 + emberY * 10}, 100%, ${50 + emberY * 10}%)`,
						transparent: true,
						opacity,
					});
				});
			}

			// Dynamic flickering light
			if (lightRef.current) {
				const flicker = Math.sin(t * 15) * 0.3 + Math.sin(t * 23) * 0.2 + Math.sin(t * 31) * 0.1;
				lightRef.current.intensity = (2.5 + flicker) * intensity;
				lightRef.current.distance = 8 + size * 2;
			}
		}
	});

	return (
		<group position={position} onPointerDown={handlePointerDown}>
			{/* The Oil Slick Surface */}
			<mesh rotation-x={-Math.PI / 2} receiveShadow>
				<circleGeometry args={[size, 24]} />
				<meshStandardMaterial
					color={isBurntOut ? "#1a1a1a" : isLit ? "#331100" : "#0a0a0a"}
					roughness={isBurntOut ? 0.9 : 0.05}
					metalness={isBurntOut ? 0.1 : 0.9}
					transparent
					opacity={isBurntOut ? 0.95 : 0.85}
				/>
			</mesh>

			{/* Iridescent oil sheen when unlit */}
			{!isLit && !isBurntOut && (
				<mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
					<ringGeometry args={[size * 0.3, size * 0.9, 24]} />
					<meshStandardMaterial
						color="#4a2c7a"
						roughness={0.0}
						metalness={1.0}
						transparent
						opacity={0.15}
					/>
				</mesh>
			)}

			{/* Fire Visual Effect - Layered flames */}
			{isLit && !isBurntOut && (
				<group position={[0, 0, 0]}>
					{/* Core flames - bright orange/yellow */}
					<group ref={fireRef}>
						{[...Array(FLAME_COUNT)].map((_, i) => {
							const angle = (i / FLAME_COUNT) * Math.PI * 2;
							const radius = size * 0.4 * (0.5 + Math.random() * 0.5);
							return (
								<mesh
									key={`flame-${i}`}
									position={[Math.cos(angle) * radius, 0.3, Math.sin(angle) * radius]}
								>
									<coneGeometry args={[0.3, 1.2, 6]} />
									<meshBasicMaterial
										color={i % 2 === 0 ? "#ff6600" : "#ffaa00"}
										transparent
										opacity={0.7}
									/>
								</mesh>
							);
						})}
					</group>

					{/* Inner hot core */}
					<mesh position={[0, 0.2, 0]}>
						<sphereGeometry args={[size * 0.3, 12, 12]} />
						<meshBasicMaterial color="#ffdd44" transparent opacity={0.4} />
					</mesh>

					{/* Rising embers/sparks */}
					<group ref={embersRef}>
						{emberData.map((_, i) => (
							<mesh key={`ember-${i}`} scale={0.05}>
								<sphereGeometry args={[1, 4, 4]} />
								<meshBasicMaterial color="#ff8800" transparent opacity={0.8} />
							</mesh>
						))}
					</group>

					{/* Smoke layer */}
					<mesh position={[0, 2, 0]}>
						<sphereGeometry args={[size * 0.5, 8, 8]} />
						<meshBasicMaterial color="#222" transparent opacity={0.2} />
					</mesh>

					{/* Dynamic point light */}
					<pointLight
						ref={lightRef}
						color="#ff6622"
						intensity={3}
						distance={10 + size * 2}
						castShadow
					/>
				</group>
			)}

			{/* Burnt out residue - charred marks */}
			{isBurntOut && (
				<group position={[0, 0.02, 0]}>
					{[...Array(5)].map((_, i) => (
						<mesh
							key={`char-${i}`}
							rotation-x={-Math.PI / 2}
							position={[Math.cos(i * 1.3) * size * 0.4, 0, Math.sin(i * 1.3) * size * 0.4]}
						>
							<circleGeometry args={[0.3 + Math.random() * 0.3, 6]} />
							<meshBasicMaterial color="#000" transparent opacity={0.5} />
						</mesh>
					))}
				</group>
			)}
		</group>
	);
}
