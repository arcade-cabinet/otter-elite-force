/**
 * GameWorld Scene
 * Main gameplay scene with 3D world
 */

import { Environment, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
	Bloom,
	BrightnessContrast,
	EffectComposer,
	HueSaturation,
	Noise,
	Vignette,
} from "@react-three/postprocessing";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { audioEngine } from "../Core/AudioEngine";
import { GameLoop } from "../Core/GameLoop";
import { BaseFloor, BaseRoof, BaseStilt, BaseWall } from "../Entities/BaseBuilding";
import { Clam } from "../Entities/Objectives/Clam";
import { type ParticleData, Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import { Raft } from "../Entities/Raft";
import {
	CHARACTERS,
	type ChunkData,
	useGameStore,
} from "../stores/gameStore";
import { ChunkRenderer } from "./GameWorld/components/ChunkRenderer";
import { GameLogic } from "./GameWorld/components/GameLogic";

export function GameWorld() {
	const { selectedCharacterId, saveData, isCarryingClam, isPilotingRaft } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;
	const [playerPos] = useState(() => new THREE.Vector3(0, 0, 0));
	const [, setPlayerVelY] = useState(0);
	const [isClimbing] = useState(false);
	const [playerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);
	const playerRef = useRef<THREE.Group | null>(null);
	const projectilesRef = useRef<ProjectilesHandle | null>(null);

	const handleImpact = useCallback((pos: THREE.Vector3, type: "blood" | "shell") => {
		audioEngine.playSFX("hit");
		const newParticles = [...Array(5)].map(() => ({
			id: `${type}-${Math.random()}`, // NOSONAR: Non-critical visual ID
			position: pos.clone(),
			velocity: new THREE.Vector3(
				(Math.random() - 0.5) * 5, // NOSONAR: Visual randomness
				Math.random() * 5, // NOSONAR: Visual randomness
				(Math.random() - 0.5) * 5, // NOSONAR: Visual randomness
			),
			lifetime: 0.5 + Math.random() * 0.5, // NOSONAR: Visual randomness
			type,
		}));
		setParticles((prev) => [...prev, ...newParticles]);
	}, []);

	return (
		<Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
			<GameLogic
				playerRef={playerRef}
				projectilesRef={projectilesRef}
				setPlayerVelY={setPlayerVelY}
				setIsPlayerMoving={setIsPlayerMoving}
				setActiveChunks={setActiveChunks}
				activeChunks={activeChunks}
				character={character}
				handleImpact={handleImpact}
			/>
			<ambientLight intensity={0.3} />
			<directionalLight position={[50, 50, 25]} intensity={1.5} castShadow />
			<Sky sunPosition={[100, 20, 100]} />
			<fogExp2 attach="fog" args={["#d4c4a8", 0.015]} />
			<Environment preset="sunset" />
			{activeChunks.map((chunk) => (
				<ChunkRenderer key={chunk.id} data={chunk} playerPos={playerPos} />
			))}
			<PlayerRig
				ref={playerRef}
				traits={character.traits}
				gear={character.gear}
				position={[0, 0, 0]}
				rotation={playerRot}
				isMoving={isPlayerMoving}
				isClimbing={isClimbing}
			>
				{isCarryingClam && <Clam position={new THREE.Vector3(0, 1.5, 0)} isCarried />}
				{isPilotingRaft && <Raft position={[0, -0.5, 0]} isPiloted />}
			</PlayerRig>
			{saveData.baseComponents.map((comp) => {
				if (comp.type === "FLOOR") return <BaseFloor key={comp.id} position={comp.position} />;
				if (comp.type === "WALL") return <BaseWall key={comp.id} position={comp.position} />;
				if (comp.type === "ROOF") return <BaseRoof key={comp.id} position={comp.position} />;
				if (comp.type === "STILT") return <BaseStilt key={comp.id} position={comp.position} />;
				return null;
			})}
			<Projectiles ref={projectilesRef} />
			<Particles
				particles={particles}
				onExpire={useCallback(
					(id: string) => setParticles((prev) => prev.filter((p) => p.id !== id)),
					[],
				)}
			/>
			<GameLoop />
			<EffectComposer>
				<Bloom intensity={0.5} />
				<Noise opacity={0.05} />
				<Vignette darkness={1.2} />
				<BrightnessContrast brightness={0.05} contrast={0.2} />
				<HueSaturation saturation={-0.2} />
			</EffectComposer>
		</Canvas>
	);
}
