/**
 * GameWorld Scene
 * Main gameplay scene with 3D world
 */

import { Sky } from "@react-three/drei";
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
import { BUILDABLE_TEMPLATES } from "../ecs/data/buildableTemplates";
import { CHARACTERS, type ChunkData, useGameStore } from "../stores/gameStore";
import { ChunkRenderer } from "./GameWorld/components/ChunkRenderer";
import { GameLogic } from "./GameWorld/components/GameLogic";

// Mapping template IDs to components
const ComponentRenderer = ({
	type,
	position,
	ghost = false,
}: {
	type: string;
	position: [number, number, number];
	ghost?: boolean;
}) => {
	// Base primitive mapping for existing components
	if (type === "floor-section" || type === "FLOOR")
		return <BaseFloor position={position} ghost={ghost} />;
	if (type === "bamboo-wall" || type === "thatch-wall" || type === "WALL")
		return <BaseWall position={position} ghost={ghost} />;
	if (type === "thatch-roof" || type === "tin-roof" || type === "ROOF")
		return <BaseRoof position={position} ghost={ghost} />;
	if (type === "stilt-support" || type === "STILT")
		return <BaseStilt position={position} ghost={ghost} />;

	// Fallback to floor if unknown
	return <BaseFloor position={position} ghost={ghost} />;
};

export function GameWorld() {
	const {
		selectedCharacterId,
		saveData,
		isCarryingClam,
		isPilotingRaft,
		isBuildMode,
		selectedComponentType,
	} = useGameStore();
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

	// Ghost preview position logic
	const ghostPos: [number, number, number] | null = isBuildMode
		? [
				Math.round(saveData.lastPlayerPosition[0] / 4) * 4,
				Math.round(saveData.lastPlayerPosition[1]),
				Math.round(saveData.lastPlayerPosition[2] / 4) * 4,
			]
		: null;

	if (ghostPos) {
		const template = BUILDABLE_TEMPLATES.find((t) => t.id === selectedComponentType);
		if (template?.category === "ROOF") ghostPos[1] += 2.5;
		if (template?.category === "WALLS") ghostPos[1] += 1;
	}

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
				{isCarryingClam && <Clam position={new THREE.Vector3(0, 0.8, 0)} isCarried />}
				{isPilotingRaft && <Raft position={[0, -0.5, 0]} isPiloted />}
			</PlayerRig>

			{/* Render Ghost Preview */}
			{isBuildMode && ghostPos && (
				<ComponentRenderer type={selectedComponentType} position={ghostPos} ghost />
			)}

			{saveData.baseComponents.map((comp) => (
				<ComponentRenderer key={comp.id} type={comp.type} position={comp.position} />
			))}
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
				<Vignette darkness={0.4} offset={0.3} />
				<BrightnessContrast brightness={0.05} contrast={0.2} />
				<HueSaturation saturation={-0.2} />
			</EffectComposer>
		</Canvas>
	);
}
