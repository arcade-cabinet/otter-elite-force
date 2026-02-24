/**
 * GameWorld Scene
 * Main gameplay scene with 3D world - Babylon.js / Reactylon
 */

import type { Scene as BabylonScene, TransformNode } from "@babylonjs/core";
import { Color3, Color4, Vector3 } from "@babylonjs/core";
import { useCallback, useRef, useState } from "react";
import { Scene } from "reactylon";
import { Engine } from "reactylon/web";
import { audioEngine } from "../Core/AudioEngine";
import { GameLoop } from "../Core/GameLoop";
import { BaseFloor, BaseRoof, BaseStilt, BaseWall } from "../Entities/BaseBuilding";
import { Clam } from "../Entities/Objectives/Clam";
import type { ParticleData } from "../Entities/Particles";
import { Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import { Raft } from "../Entities/Raft";
import { CHARACTERS, type ChunkData, useGameStore } from "../stores/gameStore";
import { ChunkRenderer } from "./GameWorld/components/ChunkRenderer";
import { GameLogic } from "./GameWorld/components/GameLogic";

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
	const [playerPos] = useState(() => new Vector3(0, 0, 0));
	const [, setPlayerVelY] = useState(0);
	const [isClimbing] = useState(false);
	const [playerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);

	// PlayerRig expects a TransformNode ref in Babylon.js
	const playerRef = useRef<TransformNode | null>(null);
	const projectilesRef = useRef<ProjectilesHandle | null>(null);

	const handleImpact = useCallback((pos: Vector3, type: "blood" | "shell") => {
		audioEngine.playSFX("hit");
		const newParticles = [...Array(5)].map(() => ({
			id: `${type}-${Math.random()}`, // NOSONAR: Non-critical visual ID
			position: pos.clone(),
			velocity: new Vector3(
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
		if (selectedComponentType === "ROOF") ghostPos[1] += 2.5;
		if (selectedComponentType === "WALL") ghostPos[1] += 1;
	}

	const onSceneReady = useCallback((scene: BabylonScene) => {
		// Warm, humid jungle atmosphere
		scene.clearColor = new Color4(0.53, 0.65, 0.47, 1);
		scene.fogMode = 3; // FOGMODE_EXP2
		scene.fogColor = new Color3(0.83, 0.77, 0.66);
		scene.fogDensity = 0.015;
	}, []);

	return (
		<Engine canvasId="game-canvas">
			<Scene onSceneReady={onSceneReady}>
				{/* Follow camera - position managed by GameLogic observer */}
				<arcRotateCamera
					name="gameCamera"
					alpha={Math.PI / 2}
					beta={Math.PI / 3}
					radius={12}
					target={new Vector3(0, 0.8, 0)}
				/>

				{/* Lighting */}
				<hemisphericLight
					name="ambient"
					direction={new Vector3(0, 1, 0)}
					intensity={0.3}
					groundColor={new Color3(0.1, 0.08, 0.04)}
				/>
				<directionalLight
					name="sun"
					direction={new Vector3(-0.5, -1, -0.5)}
					position={new Vector3(50, 50, 25)}
					intensity={1.5}
				/>

				{/* Game logic (input + physics + chunk streaming) */}
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

				{/* Active world chunks */}
				{activeChunks.map((chunk) => (
					<ChunkRenderer key={chunk.id} data={chunk} playerPos={playerPos} />
				))}

				{/* Player */}
				<PlayerRig
					ref={playerRef as React.Ref<TransformNode>}
					traits={character.traits}
					gear={character.gear}
					position={[0, 0, 0]}
					rotation={playerRot}
					isMoving={isPlayerMoving}
					isClimbing={isClimbing}
				>
					{isCarryingClam && <Clam position={[0, 0.8, 0]} isCarried />}
					{isPilotingRaft && <Raft position={[0, -0.5, 0]} isPiloted />}
				</PlayerRig>

				{/* Ghost preview for build mode */}
				{isBuildMode && ghostPos && (
					<>
						{selectedComponentType === "FLOOR" && <BaseFloor position={ghostPos} ghost />}
						{selectedComponentType === "WALL" && <BaseWall position={ghostPos} ghost />}
						{selectedComponentType === "ROOF" && <BaseRoof position={ghostPos} ghost />}
						{selectedComponentType === "STILT" && <BaseStilt position={ghostPos} ghost />}
					</>
				)}

				{/* Placed base components */}
				{saveData.baseComponents.map((comp) => {
					if (comp.type === "FLOOR") return <BaseFloor key={comp.id} position={comp.position} />;
					if (comp.type === "WALL") return <BaseWall key={comp.id} position={comp.position} />;
					if (comp.type === "ROOF") return <BaseRoof key={comp.id} position={comp.position} />;
					if (comp.type === "STILT") return <BaseStilt key={comp.id} position={comp.position} />;
					return null;
				})}

				{/* Projectiles & particles */}
				<Projectiles ref={projectilesRef} />
				<Particles
					particles={particles}
					onExpire={useCallback(
						(id: string) => setParticles((prev) => prev.filter((p) => p.id !== id)),
						[],
					)}
				/>

				{/* Game loop */}
				<GameLoop />
			</Scene>
		</Engine>
	);
}
