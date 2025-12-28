/**
 * Strata Core Stubs
 * Local implementations matching @strata-game-library/core API.
 * These serve as stubs until the actual package is properly installed.
 */

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// ============================================================================
// Virtual Joystick
// ============================================================================

export interface VirtualJoystickProps {
	onMove?: (x: number, y: number) => void;
	onStart?: () => void;
	onEnd?: () => void;
	size?: number;
	color?: string;
	opacity?: number;
	containerStyle?: React.CSSProperties;
}

export function VirtualJoystick({
	onMove,
	onStart,
	onEnd,
	size = 100,
	color = "rgba(255, 255, 255, 0.5)",
	opacity = 0.3,
	containerStyle,
}: VirtualJoystickProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const knobRef = useRef<HTMLDivElement>(null);
	const activeTouch = useRef<number | null>(null);
	const center = useRef({ x: 0, y: 0 });

	const handleStart = useCallback(
		(e: React.TouchEvent | React.MouseEvent) => {
			if (activeTouch.current !== null) return;

			const touch = "touches" in e ? e.touches[0] : e;
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			activeTouch.current = "identifier" in touch ? touch.identifier : 0;
			center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
			onStart?.();
		},
		[onStart],
	);

	const handleMove = useCallback(
		(e: TouchEvent | MouseEvent) => {
			if (activeTouch.current === null) return;

			const touch =
				"touches" in e
					? Array.from(e.touches).find((t) => t.identifier === activeTouch.current)
					: e;
			if (!touch) return;

			const dx = ("clientX" in touch ? touch.clientX : 0) - center.current.x;
			const dy = ("clientY" in touch ? touch.clientY : 0) - center.current.y;

			const maxDist = size / 2;
			const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
			const angle = Math.atan2(dy, dx);

			const clampedX = Math.cos(angle) * dist;
			const clampedY = Math.sin(angle) * dist;

			if (knobRef.current) {
				knobRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
			}

			onMove?.(clampedX / maxDist, clampedY / maxDist);
		},
		[size, onMove],
	);

	const handleEnd = useCallback(() => {
		if (activeTouch.current === null) return;
		activeTouch.current = null;

		if (knobRef.current) {
			knobRef.current.style.transform = "translate(0, 0)";
		}

		onMove?.(0, 0);
		onEnd?.();
	}, [onMove, onEnd]);

	useEffect(() => {
		document.addEventListener("mousemove", handleMove);
		document.addEventListener("mouseup", handleEnd);
		document.addEventListener("touchmove", handleMove);
		document.addEventListener("touchend", handleEnd);

		return () => {
			document.removeEventListener("mousemove", handleMove);
			document.removeEventListener("mouseup", handleEnd);
			document.removeEventListener("touchmove", handleMove);
			document.removeEventListener("touchend", handleEnd);
		};
	}, [handleMove, handleEnd]);

	return (
		<div
			ref={containerRef}
			style={{
				...containerStyle,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
			onTouchStart={handleStart}
			onMouseDown={handleStart}
		>
			<div
				style={{
					width: size,
					height: size,
					borderRadius: "50%",
					backgroundColor: color,
					opacity,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					touchAction: "none",
				}}
			>
				<div
					ref={knobRef}
					style={{
						width: size * 0.4,
						height: size * 0.4,
						borderRadius: "50%",
						backgroundColor: color,
						transition: "transform 0.05s ease-out",
					}}
				/>
			</div>
		</div>
	);
}

// ============================================================================
// Water
// ============================================================================

export interface WaterProps {
	position?: [number, number, number];
	size?: number;
	segments?: number;
	color?: number;
	opacity?: number;
	waveSpeed?: number;
	waveHeight?: number;
}

export function Water({
	position = [0, 0, 0],
	size = 100,
	segments = 32,
	color = 0x4d4233,
	opacity = 0.7,
	waveSpeed = 0.5,
	waveHeight = 0.1,
}: WaterProps) {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!meshRef.current) return;
		const time = state.clock.elapsedTime * waveSpeed;
		meshRef.current.position.y = position[1] + Math.sin(time) * waveHeight * 0.5;
	});

	return (
		<mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[size, size, segments, segments]} />
			<meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
		</mesh>
	);
}

// ============================================================================
// Weather System
// ============================================================================

export interface WeatherState {
	type: "clear" | "rain" | "snow" | "storm";
	intensity: number;
	windDirection: THREE.Vector3;
	windIntensity: number;
	temperature: number;
	visibility: number;
	cloudCoverage: number;
	precipitationRate: number;
}

export interface WeatherSystemProps {
	weather: WeatherState;
	rainCount?: number;
	snowCount?: number;
	areaSize?: number;
	height?: number;
	enableLightning?: boolean;
}

export function WeatherSystem({
	weather,
}: WeatherSystemProps) {
	// Simple implementation - just fog based on weather
	const { scene } = useThree();

	useEffect(() => {
		if (weather.type === "rain" || weather.type === "storm") {
			scene.fog = new THREE.FogExp2(0x888888, 0.02 * weather.intensity);
		} else {
			scene.fog = new THREE.FogExp2(0xd4c4a8, 0.015);
		}
	}, [weather, scene]);

	// For now just return null - full rain/snow particles would be added here
	return null;
}

// ============================================================================
// Follow Camera
// ============================================================================

export interface FollowCameraProps {
	target: RefObject<THREE.Object3D | null>;
	offset?: [number, number, number];
	smoothTime?: number;
	lookAheadDistance?: number;
	lookAheadSmoothing?: number;
	fov?: number;
	makeDefault?: boolean;
}

export function FollowCamera({
	target,
	offset = [0, 5, 10],
	smoothTime = 0.3,
	makeDefault = false,
}: FollowCameraProps) {
	const { camera, set } = useThree();
	const currentPos = useRef(new THREE.Vector3(...offset));

	useEffect(() => {
		if (makeDefault) {
			set({ camera: camera as THREE.PerspectiveCamera });
		}
	}, [makeDefault, camera, set]);

	useFrame((_, delta) => {
		if (!target.current) return;

		const targetPos = new THREE.Vector3().copy(target.current.position);
		targetPos.add(new THREE.Vector3(...offset));

		// Smooth damp towards target
		const dampFactor = Math.min(1, delta / smoothTime);
		currentPos.current.lerp(targetPos, dampFactor);

		camera.position.copy(currentPos.current);
		camera.lookAt(target.current.position);
	});

	return null;
}

// ============================================================================
// Health Bar
// ============================================================================

export interface HealthBarProps {
	position: [number, number, number];
	value: number;
	maxValue: number;
	width?: number;
	height?: number;
	fillColor?: string;
	backgroundColor?: string;
	borderColor?: string;
	borderWidth?: number;
	borderRadius?: number;
	showText?: boolean;
	textFormat?: "value" | "percent";
	animationDuration?: number;
	glowColor?: string;
	glowIntensity?: number;
	distanceFade?: { start: number; end: number };
}

export function HealthBar({
	position,
	value,
	maxValue,
	width = 50,
	height = 6,
	fillColor = "#4caf50",
	backgroundColor = "rgba(0, 0, 0, 0.6)",
	borderColor = "rgba(255, 255, 255, 0.3)",
	borderWidth = 1,
	borderRadius = 3,
	showText = false,
	animationDuration = 200,
	glowColor,
	distanceFade,
}: HealthBarProps) {
	const { camera } = useThree();
	const percent = Math.max(0, Math.min(1, value / maxValue));

	// Calculate opacity based on distance
	let opacity = 1;
	if (distanceFade) {
		const dist = camera.position.distanceTo(new THREE.Vector3(...position));
		if (dist > distanceFade.end) {
			opacity = 0;
		} else if (dist > distanceFade.start) {
			opacity = 1 - (dist - distanceFade.start) / (distanceFade.end - distanceFade.start);
		}
	}

	if (opacity === 0) return null;

	return (
		<Html position={position} center style={{ pointerEvents: "none", opacity }}>
			<div
				style={{
					width,
					height,
					backgroundColor,
					borderRadius,
					border: `${borderWidth}px solid ${borderColor}`,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${percent * 100}%`,
						height: "100%",
						backgroundColor: fillColor,
						transition: `width ${animationDuration}ms ease-out`,
						boxShadow: glowColor ? `0 0 3px ${glowColor}` : undefined,
					}}
				/>
			</div>
			{showText && (
				<div
					style={{
						fontSize: "10px",
						color: "#fff",
						textAlign: "center",
						marginTop: "2px",
						textShadow: "0 0 3px #000",
					}}
				>
					{Math.ceil(value)}/{maxValue}
				</div>
			)}
		</Html>
	);
}

// ============================================================================
// Particle Emitter
// ============================================================================

export interface ParticleEmitterRef {
	burst: (count: number) => void;
	reset: () => void;
}

export interface ParticleEmitterProps {
	position?: [number, number, number];
	velocity?: [number, number, number];
	velocityVariance?: [number, number, number];
	maxParticles?: number;
	emissionRate?: number;
	lifetime?: number;
	lifetimeVariance?: number;
	startColor?: number;
	endColor?: number;
	startSize?: number;
	endSize?: number;
	startOpacity?: number;
	endOpacity?: number;
	forces?: { gravity?: THREE.Vector3 };
	blending?: THREE.Blending;
	depthWrite?: boolean;
}

export const ParticleEmitter = forwardRef<ParticleEmitterRef, ParticleEmitterProps>(
	function ParticleEmitter(
		{
			position = [0, 0, 0],
			velocity = [0, 1, 0],
			velocityVariance = [1, 1, 1],
			maxParticles = 100,
			lifetime = 1,
			startColor = 0xffffff,
			startSize = 0.1,
			forces,
			blending = THREE.AdditiveBlending,
		},
		ref,
	) {
		const pointsRef = useRef<THREE.Points>(null);
		const particles = useRef<
			Array<{
				position: THREE.Vector3;
				velocity: THREE.Vector3;
				life: number;
				maxLife: number;
			}>
		>([]);

		useImperativeHandle(ref, () => ({
			burst: (count: number) => {
				for (let i = 0; i < count; i++) {
					particles.current.push({
						position: new THREE.Vector3(...position),
						velocity: new THREE.Vector3(
							velocity[0] + (Math.random() - 0.5) * velocityVariance[0] * 2,
							velocity[1] + (Math.random() - 0.5) * velocityVariance[1] * 2,
							velocity[2] + (Math.random() - 0.5) * velocityVariance[2] * 2,
						),
						life: lifetime + (Math.random() - 0.5) * 0.4,
						maxLife: lifetime,
					});
				}
			},
			reset: () => {
				particles.current = [];
			},
		}));

		useFrame((_, delta) => {
			// Update particles
			particles.current = particles.current.filter((p) => {
				p.life -= delta;
				if (p.life <= 0) return false;

				// Apply gravity
				if (forces?.gravity) {
					p.velocity.add(forces.gravity.clone().multiplyScalar(delta));
				}

				p.position.add(p.velocity.clone().multiplyScalar(delta));
				return true;
			});

			// Update geometry
			if (pointsRef.current) {
				const positions = new Float32Array(maxParticles * 3);
				particles.current.forEach((p, i) => {
					if (i < maxParticles) {
						positions[i * 3] = p.position.x;
						positions[i * 3 + 1] = p.position.y;
						positions[i * 3 + 2] = p.position.z;
					}
				});
				const positionAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
				positionAttr.array.set(positions);
				positionAttr.needsUpdate = true;
				pointsRef.current.geometry.setDrawRange(0, particles.current.length);
			}
		});

		// Create geometry with position attribute
		const geometry = useRef<THREE.BufferGeometry>(() => {
			const geo = new THREE.BufferGeometry();
			const positions = new Float32Array(maxParticles * 3);
			geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
			return geo;
		});

		return (
			<points ref={pointsRef}>
				<bufferGeometry attach="geometry" ref={geometry as unknown as React.Ref<THREE.BufferGeometry>}>
					<bufferAttribute
						attach="attributes-position"
						args={[new Float32Array(maxParticles * 3), 3]}
					/>
				</bufferGeometry>
				<pointsMaterial
					size={startSize}
					color={startColor}
					transparent
					blending={blending}
					depthWrite={false}
				/>
			</points>
		);
	},
);
