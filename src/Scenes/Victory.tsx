/**
 * Victory Scene
 * Displayed after a successful mission extraction
 */

import { Environment, Sky } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PlayerRig } from "../Entities/PlayerRig";
import { CHARACTERS, useGameStore } from "../stores/gameStore";

function Firework({ position, color }: { position: [number, number, number]; color: string }) {
	const ref = useRef<THREE.Points>(null);
	const particles = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3 }[]>([]);
	
	// Create buffer attribute once to avoid recreation on every render
	const positionArray = useMemo(() => new Float32Array(150), []);

	if (particles.current.length === 0) {
		for (let i = 0; i < 50; i++) {
			particles.current.push({
				pos: new THREE.Vector3(0, 0, 0),
				vel: new THREE.Vector3(
					(Math.random() - 0.5) * 10,
					(Math.random() - 0.5) * 10,
					(Math.random() - 0.5) * 10,
				),
			});
		}
	}

	useFrame((_state, delta) => {
		if (!ref.current) return;
		const positions = ref.current.geometry.attributes.position.array as Float32Array;
		for (let i = 0; i < particles.current.length; i++) {
			const p = particles.current[i];
			p.pos.add(p.vel.clone().multiplyScalar(delta));
			p.vel.y -= 2 * delta; // Low gravity fireworks
			positions[i * 3] = p.pos.x;
			positions[i * 3 + 1] = p.pos.y;
			positions[i * 3 + 2] = p.pos.z;
		}
		ref.current.geometry.attributes.position.needsUpdate = true;
		ref.current.rotation.y += delta;
	});

	return (
		<points ref={ref} position={position}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[positionArray, 3]}
				/>
			</bufferGeometry>
			<pointsMaterial color={color} size={0.2} transparent opacity={0.8} />
		</points>
	);
}

export function Victory() {
	const { setMode, kills, saveData, selectedCharacterId } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;

	return (
		<div className="screen active victory-screen">
			<div className="victory-3d">
				<Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1} castShadow />
					<Sky sunPosition={[100, 10, 100]} />
					<Environment preset="sunset" />

					<PlayerRig
						traits={character.traits}
						gear={character.gear}
						position={[0, 0, 0]}
						rotation={0}
					/>

					<Firework position={[-3, 5, -2]} color="#ff0000" />
					<Firework position={[3, 6, -5]} color="#00ff00" />
					<Firework position={[0, 7, -8]} color="#ffff00" />

					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
						<planeGeometry args={[100, 100]} />
						<meshStandardMaterial color="#2d5016" />
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
