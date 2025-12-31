/**
 * Victory Scene
 * Displayed after a successful mission extraction
 * Spectacular celebration with multi-stage fireworks
 */

import { Sky } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PlayerRig } from "../Entities/PlayerRig";
import { CHARACTERS, useGameStore } from "../stores/gameStore";

const PARTICLE_COUNT = 80;
const TRAIL_LENGTH = 5;

interface FireworkParticle {
	pos: THREE.Vector3;
	vel: THREE.Vector3;
	life: number;
	maxLife: number;
	trail: THREE.Vector3[];
}

function Firework({
	position,
	color,
	delay = 0,
}: {
	position: [number, number, number];
	color: string;
	delay?: number;
}) {
	const ref = useRef<THREE.Points>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const [phase, setPhase] = useState<"rising" | "exploding" | "fading">("rising");
	const timeRef = useRef(0);
	const risePos = useRef(new THREE.Vector3(position[0], -2, position[2]));

	const particles = useRef<FireworkParticle[]>([]);
	const positionArray = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
	const colorArray = useMemo(() => {
		const arr = new Float32Array(PARTICLE_COUNT * 3);
		const baseColor = new THREE.Color(color);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			// Slight color variation for sparkle
			const variation = 0.8 + Math.random() * 0.4;
			arr[i * 3] = baseColor.r * variation;
			arr[i * 3 + 1] = baseColor.g * variation;
			arr[i * 3 + 2] = baseColor.b * variation;
		}
		return arr;
	}, [color]);
	const sizeArray = useMemo(() => {
		const arr = new Float32Array(PARTICLE_COUNT);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			arr[i] = 0.1 + Math.random() * 0.15;
		}
		return arr;
	}, []);

	useFrame((_state, delta) => {
		timeRef.current += delta;

		// Delay before starting
		if (timeRef.current < delay) return;
		const localTime = timeRef.current - delay;

		if (phase === "rising") {
			// Rocket rises up
			risePos.current.y += delta * 8;

			if (glowRef.current) {
				glowRef.current.position.copy(risePos.current);
				glowRef.current.scale.setScalar(0.8 + Math.sin(localTime * 30) * 0.2);
			}

			// Explode when reaching target height
			if (risePos.current.y >= position[1]) {
				setPhase("exploding");

				// Initialize explosion particles - spherical burst
				for (let i = 0; i < PARTICLE_COUNT; i++) {
					const theta = Math.random() * Math.PI * 2;
					const phi = Math.acos(2 * Math.random() - 1);
					const speed = 4 + Math.random() * 6;

					particles.current.push({
						pos: new THREE.Vector3(0, 0, 0),
						vel: new THREE.Vector3(
							Math.sin(phi) * Math.cos(theta) * speed,
							Math.sin(phi) * Math.sin(theta) * speed + 2, // Slight upward bias
							Math.cos(phi) * speed,
						),
						life: 2 + Math.random() * 1.5,
						maxLife: 2 + Math.random() * 1.5,
						trail: [],
					});
				}
			}
		} else if (phase === "exploding" || phase === "fading") {
			if (!ref.current) return;

			const positions = ref.current.geometry.attributes.position.array as Float32Array;
			let allDead = true;

			for (let i = 0; i < particles.current.length; i++) {
				const p = particles.current[i];

				// Store trail position
				if (p.trail.length >= TRAIL_LENGTH) p.trail.shift();
				p.trail.push(p.pos.clone());

				// Physics update
				p.pos.add(p.vel.clone().multiplyScalar(delta));
				p.vel.y -= 3 * delta; // Gravity
				p.vel.multiplyScalar(0.98); // Air resistance
				p.life -= delta;

				if (p.life > 0) allDead = false;

				// Update buffer
				positions[i * 3] = p.pos.x;
				positions[i * 3 + 1] = p.pos.y;
				positions[i * 3 + 2] = p.pos.z;

				// Fade out size based on life
				const lifeRatio = Math.max(0, p.life / p.maxLife);
				sizeArray[i] = (0.1 + Math.random() * 0.1) * lifeRatio;
			}

			ref.current.geometry.attributes.position.needsUpdate = true;

			// Update size attribute if it exists
			const sizeAttr = ref.current.geometry.getAttribute("size");
			if (sizeAttr) {
				(sizeAttr.array as Float32Array).set(sizeArray);
				sizeAttr.needsUpdate = true;
			}

			if (allDead) {
				setPhase("fading");
			}
		}
	});

	return (
		<group position={phase === "rising" ? [0, 0, 0] : position}>
			{/* Rising rocket glow */}
			{phase === "rising" && (
				<mesh ref={glowRef}>
					<sphereGeometry args={[0.2, 8, 8]} />
					<meshBasicMaterial color={color} transparent opacity={0.9} />
				</mesh>
			)}

			{/* Explosion particles */}
			{(phase === "exploding" || phase === "fading") && (
				<points ref={ref}>
					<bufferGeometry>
						<bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
						<bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
					</bufferGeometry>
					<pointsMaterial
						vertexColors
						size={0.2}
						transparent
						opacity={0.9}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
					/>
				</points>
			)}

			{/* Central flash on explosion */}
			{phase === "exploding" && timeRef.current - delay < 0.3 && (
				<mesh>
					<sphereGeometry args={[1, 8, 8]} />
					<meshBasicMaterial
						color={color}
						transparent
						opacity={0.5 - (timeRef.current - delay) * 1.5}
					/>
				</mesh>
			)}
		</group>
	);
}

// Confetti for extra celebration
function Confetti() {
	const ref = useRef<THREE.InstancedMesh>(null);
	const count = 100;
	const dummy = useMemo(() => new THREE.Object3D(), []);

	const particles = useMemo(
		() =>
			[...Array(count)].map(() => ({
				pos: new THREE.Vector3(
					(Math.random() - 0.5) * 20,
					5 + Math.random() * 10,
					(Math.random() - 0.5) * 20,
				),
				vel: new THREE.Vector3(
					(Math.random() - 0.5) * 2,
					-1 - Math.random() * 2,
					(Math.random() - 0.5) * 2,
				),
				rot: new THREE.Vector3(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI,
				),
				rotSpeed: new THREE.Vector3(
					(Math.random() - 0.5) * 5,
					(Math.random() - 0.5) * 5,
					(Math.random() - 0.5) * 5,
				),
			})),
		[],
	);

	useFrame((_, delta) => {
		if (!ref.current) return;

		for (let i = 0; i < count; i++) {
			const p = particles[i];
			p.pos.add(p.vel.clone().multiplyScalar(delta));
			p.rot.add(p.rotSpeed.clone().multiplyScalar(delta));

			// Reset when below ground
			if (p.pos.y < -1) {
				p.pos.y = 10 + Math.random() * 5;
				p.pos.x = (Math.random() - 0.5) * 20;
				p.pos.z = (Math.random() - 0.5) * 20;
			}

			// Wobble in wind
			p.vel.x = Math.sin(p.pos.y * 0.5) * 0.5;

			dummy.position.copy(p.pos);
			dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
			dummy.scale.setScalar(0.1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, count]}>
			<planeGeometry args={[1, 0.5]} />
			<meshBasicMaterial color="#ffcc00" side={THREE.DoubleSide} transparent opacity={0.9} />
		</instancedMesh>
	);
}

export function Victory() {
	const { setMode, kills, saveData, selectedCharacterId } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;

	return (
		<div className="screen active victory-screen">
			<div className="victory-3d">
				<Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
					<ambientLight intensity={0.4} />
					<directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
					<Sky sunPosition={[100, 5, 100]} /> {/* Lower sun for dramatic lighting */}
					{/* Victorious otter */}
					<PlayerRig
						traits={character.traits}
						gear={character.gear}
						position={[0, 0, 0]}
						rotation={0}
					/>
					{/* Spectacular staggered fireworks display */}
					<Firework position={[-4, 8, -6]} color="#ff3333" delay={0} />
					<Firework position={[4, 7, -8]} color="#33ff33" delay={0.5} />
					<Firework position={[0, 9, -10]} color="#ffff33" delay={1} />
					<Firework position={[-6, 6, -4]} color="#ff33ff" delay={1.5} />
					<Firework position={[6, 8, -6]} color="#33ffff" delay={2} />
					<Firework position={[-2, 10, -12]} color="#ff6633" delay={2.5} />
					<Firework position={[2, 7, -5]} color="#3366ff" delay={3} />
					<Firework position={[0, 11, -15]} color="#ffffff" delay={3.5} />
					{/* Falling confetti */}
					<Confetti />
					{/* Ground */}
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
						<planeGeometry args={[100, 100]} />
						<meshStandardMaterial color="#2d5016" />
					</mesh>
					{/* Victory platform */}
					<mesh position={[0, -0.1, 0]} receiveShadow castShadow>
						<cylinderGeometry args={[1.5, 1.8, 0.2, 16]} />
						<meshStandardMaterial color="#4a3a2a" metalness={0.3} />
					</mesh>
				</Canvas>
			</div>

			<div className="victory-ui">
				<h1>MISSION SUCCESSFUL</h1>
				<div className="stats-box">
					<div className="stat-row">
						<span>ELIMINATIONS:</span>
						<span>{kills}</span>
					</div>
					<div className="stat-row">
						<span>SUPPLY CREDITS EARNED:</span>
						<span>{saveData.spoilsOfWar.creditsEarned}</span>
					</div>
					<div className="stat-row">
						<span>CLAMS HARVESTED:</span>
						<span>{saveData.spoilsOfWar.clamsHarvested}</span>
					</div>
					<div className="stat-row">
						<span>PEACEKEEPING SCORE:</span>
						<span>{saveData.peacekeepingScore}</span>
					</div>
				</div>

				<button type="button" onClick={() => setMode("CANTEEN")}>
					PROCEED TO FOB
				</button>
			</div>
		</div>
	);
}
