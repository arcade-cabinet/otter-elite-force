/**
 * Level Scene
 * Main gameplay scene with 3D world
 */

import { Environment, Sky } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
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
import { inputSystem } from "../Core/InputSystem";
import { BaseFloor, BaseRoof, BaseStilt, BaseWall } from "../Entities/BaseBuilding";
import { Gator } from "../Entities/Enemies/Gator";
import { Snake } from "../Entities/Enemies/Snake";
import { Snapper } from "../Entities/Enemies/Snapper";
import {
	BurntTrees,
	Debris,
	FloatingDrums,
	Lilypads,
	Mangroves,
	Reeds,
} from "../Entities/Environment";
import { ModularHut } from "../Entities/ModularHut";
import { Clam, ExtractionPoint } from "../Entities/Objectives/Clam";
import { Siphon } from "../Entities/Objectives/Siphon";
import { type ParticleData, Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import { Raft } from "../Entities/Raft";
import { Villager } from "../Entities/Villager";
import {
	CHARACTERS,
	CHUNK_SIZE,
	type CharacterGear,
	type CharacterTraits,
	type ChunkData,
	useGameStore,
} from "../stores/gameStore";
import { CharacterUnlockedNotification } from "../UI/CharacterUnlockedNotification";
import { InteractionPrompt } from "../UI/InteractionPrompt";
import { GAME_CONFIG } from "../utils/constants";
import { WATER_FRAG, WATER_VERT } from "../utils/shaders";

// Placeholder for missing components to ensure build
function GasStockpile({
	position,
	secured = false,
}: {
	position: THREE.Vector3;
	secured?: boolean;
}) {
	return (
		<group position={position}>
			{[
				[-0.5, 0, 0],
				[0.5, 0, 0],
				[0, 0, 0.5],
			].map((pos, i) => (
				<mesh key={i} position={pos as [number, number, number]} castShadow receiveShadow>
					<cylinderGeometry args={[0.4, 0.4, 1.2, 8]} />
					<meshStandardMaterial color={secured ? "#2d3d19" : "#d32f2f"} metalness={0.5} />
				</mesh>
			))}
			<mesh position={[0, -0.5, 0]} receiveShadow>
				<boxGeometry args={[2, 0.2, 2]} />
				<meshStandardMaterial color="#3d2b1f" />
			</mesh>
		</group>
	);
}

function ClamBasket({ position, isTrap = false }: { position: THREE.Vector3; isTrap?: boolean }) {
	return (
		<group position={position}>
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[0.6, 0.5, 0.5, 8]} />
				<meshStandardMaterial color="#5d4037" />
			</mesh>
			{isTrap && <pointLight color="#ff0000" intensity={0.2} distance={2} />}
		</group>
	);
}

function PrisonCage({
	position,
	rescued = false,
}: {
	position: THREE.Vector3;
	rescued?: boolean;
	characterId?: string;
}) {
	return (
		<group position={position}>
			{!rescued && (
				<>
					{/* Cage bars */}
					<mesh castShadow>
						<boxGeometry args={[2, 3, 2]} />
						<meshStandardMaterial color="#222" wireframe />
					</mesh>
					{/* Solid top and bottom */}
					<mesh position={[0, 1.5, 0]} castShadow>
						<boxGeometry args={[2, 0.1, 2]} />
						<meshStandardMaterial color="#111" metalness={0.7} />
					</mesh>
					<mesh position={[0, -1.5, 0]} castShadow receiveShadow>
						<boxGeometry args={[2, 0.1, 2]} />
						<meshStandardMaterial color="#111" metalness={0.7} />
					</mesh>
					{/* Character silhouette inside */}
					<mesh position={[0, -0.5, 0]} castShadow>
						<capsuleGeometry args={[0.3, 0.8, 4, 8]} />
						<meshStandardMaterial
							color="#333"
							transparent
							opacity={0.6}
							emissive="#4d4233"
							emissiveIntensity={0.3}
						/>
					</mesh>
					{/* Indicator light */}
					<pointLight color="#ff8800" intensity={0.5} distance={5} position={[0, 1.8, 0]} />
				</>
			)}
			{rescued && (
				/* Empty cage broken open */
				<>
					<mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
						<boxGeometry args={[0.1, 3, 2]} />
						<meshStandardMaterial color="#222" />
					</mesh>
					<mesh position={[-1, 0, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
						<boxGeometry args={[0.1, 3, 2]} />
						<meshStandardMaterial color="#222" />
					</mesh>
				</>
			)}
			<mesh position={[0, -0.1, 0]} receiveShadow>
				<boxGeometry args={[2.5, 0.2, 2.5]} />
				<meshStandardMaterial color="#111" />
			</mesh>
		</group>
	);
}

// Flag component for extraction points - URA banner waving in wind

function Chunk({ data, playerPos }: { data: ChunkData; playerPos: THREE.Vector3 }) {
	const waterUniforms = useRef({
		time: { value: 0 },
		waterColor: { value: new THREE.Color("#4d4233") },
	});
	useFrame((state) => {
		waterUniforms.current.time.value = state.clock.elapsedTime;
	});
	const chunkX = data.x * CHUNK_SIZE;
	const chunkZ = data.z * CHUNK_SIZE;

	return (
		<group position={[chunkX, 0, chunkZ]}>
			<mesh position={[0, -2.5, 0]} receiveShadow>
				<boxGeometry args={[CHUNK_SIZE, 5, CHUNK_SIZE]} />
				<meshStandardMaterial color="#1a1208" />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
				<meshStandardMaterial color="#2d5016" />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
				<planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
				<shaderMaterial
					vertexShader={WATER_VERT}
					fragmentShader={WATER_FRAG}
					uniforms={waterUniforms.current}
					transparent
					opacity={0.7}
				/>
			</mesh>
			{data.decorations.map((dec) => {
				const key = dec.id;
				if (dec.type === "REED") return <Reeds key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "LILYPAD")
					return <Lilypads key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "MANGROVE")
					return <Mangroves key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "BURNT_TREE")
					return <BurntTrees key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "DRUM")
					return <FloatingDrums key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "DEBRIS") return <Debris key={key} count={dec.count} seed={data.seed} />;
				return null;
			})}
			{data.entities.map((entity) => {
				const worldPos = new THREE.Vector3(
					chunkX + entity.position[0],
					entity.position[1],
					chunkZ + entity.position[2],
				);
				if (entity.type === "GATOR")
					return (
						<Gator
							key={entity.id}
							data={{
								id: entity.id,
								position: worldPos,
								hp: entity.hp || 10,
								maxHp: 10,
								state: "IDLE",
								suppression: entity.suppression || 0,
								isHeavy: entity.isHeavy ?? false,
							}}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAKE")
					return (
						<Snake
							key={entity.id}
							data={{ id: entity.id, position: worldPos, hp: 2, maxHp: 2, suppression: 0 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAPPER")
					return (
						<Snapper
							key={entity.id}
							data={{ id: entity.id, position: worldPos, hp: 20, maxHp: 20, suppression: 0 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "PLATFORM")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow>
							<boxGeometry args={[5, 1, 5]} />
							<meshStandardMaterial color="#3d2b1f" />
						</mesh>
					);
				if (entity.type === "CLIMBABLE")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow>
							<cylinderGeometry args={[0.8, 1, 10, 8]} />
							<meshStandardMaterial color="#2d1f15" />
						</mesh>
					);
				if (entity.type === "SIPHON")
					return <Siphon key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "GAS_STOCKPILE")
					return <GasStockpile key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "CLAM_BASKET")
					return <ClamBasket key={entity.id} position={worldPos} isTrap={entity.isHeavy} />;
				if (entity.type === "EXTRACTION_POINT")
					return <ExtractionPoint key={entity.id} position={worldPos} />;
				if (entity.type === "VILLAGER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HEALER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HUT")
					return <ModularHut key={entity.id} position={worldPos} seed={data.seed} />;
				if (entity.type === "PRISON_CAGE")
					return (
						<PrisonCage
							key={entity.id}
							position={worldPos}
							rescued={entity.rescued}
							characterId={entity.objectiveId}
						/>
					);
				if (entity.type === "RAFT") {
					const isThisRaft = useGameStore.getState().raftId === entity.id;
					return (
						<Raft
							key={entity.id}
							position={isThisRaft ? [0, 0, 0] : [worldPos.x, worldPos.y, worldPos.z]}
							isPiloted={isThisRaft}
						/>
					);
				}
				return null;
			})}
		</group>
	);
}

// Game loop component that must be inside Canvas
function GameLogic({
	playerRef,
	projectilesRef,
	setPlayerVelY,
	setIsPlayerMoving,
	setActiveChunks,
	activeChunks,
	character,
	handleImpact,
	setInteractionPrompt,
	setInteractionProgress,
	setIsInteracting,
	setInteractingEntity,
	setRecentlyRescuedCharacter,
	interactionPrompt,
	interactionProgress,
	isInteracting,
	interactingEntity,
	lastDamageTime,
}: {
	playerRef: React.RefObject<THREE.Group | null>;
	projectilesRef: React.RefObject<ProjectilesHandle | null>;
	setPlayerVelY: (val: number) => void;
	setIsPlayerMoving: (val: boolean) => void;
	setActiveChunks: (chunks: ChunkData[]) => void;
	activeChunks: ChunkData[];
	character: { traits: CharacterTraits; gear: CharacterGear };
	handleImpact: (pos: THREE.Vector3, type: "blood" | "shell") => void;
	setInteractionPrompt: (prompt: string | null) => void;
	setInteractionProgress: (progress: number) => void;
	setIsInteracting: (isInteracting: boolean) => void;
	setInteractingEntity: (
		entity: { entity: ChunkData["entities"][0]; chunk: ChunkData } | null,
	) => void;
	setRecentlyRescuedCharacter: (characterId: string | null) => void;
	interactionPrompt: string | null;
	interactionProgress: number;
	isInteracting: boolean;
	interactingEntity: { entity: ChunkData["entities"][0]; chunk: ChunkData } | null;
	lastDamageTime: React.RefObject<number>;
}) {
	const {
		isZoomed,
		getNearbyChunks,
		setPlayerPos,
		isCarryingClam,
		setCarryingClam,
		addCoins,
		isPilotingRaft,
		setPilotingRaft,
		rescueCharacter,
		collectSpoils,
		takeDamage,
		saveData,
		secureLZ,
	} = useGameStore();
	const [playerVelY, setPlayerVelYLocal] = useState(0);
	const [isGrounded, setIsGrounded] = useState(true);
	const lastFireTime = useRef(0);

	useFrame((state, delta) => {
		if (!playerRef.current) return;
		const cx = Math.floor(playerRef.current.position.x / CHUNK_SIZE);
		const cz = Math.floor(playerRef.current.position.z / CHUNK_SIZE);
		const nearby = getNearbyChunks(cx, cz);
		if (nearby.length !== activeChunks.length || nearby[0]?.id !== activeChunks[0]?.id)
			setActiveChunks(nearby);

		const input = inputSystem.getState();
		const cam = state.camera;
		const camDir = new THREE.Vector3();
		cam.getWorldDirection(camDir);
		camDir.y = 0;
		camDir.normalize();
		const camSide = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0));
		const moveVec = new THREE.Vector3();
		if (Math.abs(input.move.y) > 0.1) moveVec.add(camDir.clone().multiplyScalar(-input.move.y));
		if (Math.abs(input.move.x) > 0.1) moveVec.add(camSide.clone().multiplyScalar(input.move.x));

		const isAiming = input.look.active;
		let moveSpeed = isAiming ? character.traits.baseSpeed * 0.6 : character.traits.baseSpeed;
		if (isCarryingClam) moveSpeed *= 0.7;
		if (isPilotingRaft) moveSpeed *= 2.0;

		let newVelY = playerVelY;
		if (!isGrounded) newVelY -= 30 * delta;
		if (input.jump && isGrounded) {
			if (isPilotingRaft) {
				setPilotingRaft(false);
				newVelY = 8;
			} else {
				newVelY = 12;
			}
			setIsGrounded(false);
			audioEngine.playSFX("pickup");
		}
		playerRef.current.position.y += newVelY * delta;
		if (playerRef.current.position.y <= 0) {
			playerRef.current.position.y = 0;
			newVelY = 0;
			setIsGrounded(true);
		}

		activeChunks.forEach((chunk) => {
			chunk.entities.forEach((entity) => {
				const worldPos = new THREE.Vector3(
					chunk.x * CHUNK_SIZE + entity.position[0],
					entity.position[1],
					chunk.z * CHUNK_SIZE + entity.position[2],
				);
				const dist = playerRef.current!.position.distanceTo(worldPos);
				if (
					entity.type === "PLATFORM" &&
					Math.abs(playerRef.current!.position.x - worldPos.x) < 2.5 &&
					Math.abs(playerRef.current!.position.z - worldPos.z) < 2.5
				) {
					const top = worldPos.y + 0.5;
					if (
						playerRef.current!.position.y >= top - 0.2 &&
						playerRef.current!.position.y <= top + 0.5 &&
						newVelY <= 0
					) {
						playerRef.current!.position.y = top;
						newVelY = 0;
						setIsGrounded(true);
					}
				}
				if (entity.type === "CLAM_BASKET" && dist < 2 && !entity.interacted) {
					entity.interacted = true;
					if (entity.isHeavy) {
						takeDamage(30);
						lastDamageTime.current = Date.now();
						audioEngine.playSFX("explode");
						handleImpact(worldPos, "shell");
					} else {
						addCoins(100);
						collectSpoils("credit");
						audioEngine.playSFX("pickup");
					}
				}
				if (entity.type === "EXTRACTION_POINT" && dist < 3) {
					if (!saveData.isLZSecured && chunk.x === 0 && chunk.z === 0) {
						secureLZ();
						audioEngine.playSFX("pickup");
					} else if (isCarryingClam) {
						setCarryingClam(false);
						addCoins(500);
						collectSpoils("clam");
					}
				}
				if (entity.type === "PRISON_CAGE" && dist < 3 && !entity.rescued) {
					// Check if action button is being held
					if (input.shoot && !isAiming) {
						// Start or continue interaction
						if (!isInteracting || interactingEntity?.entity.id !== entity.id) {
							setIsInteracting(true);
							setInteractingEntity({ entity, chunk });
							setInteractionProgress(0);
							setInteractionPrompt("RESCUE");
						} else if (interactingEntity?.entity.id === entity.id) {
							// Continue interaction - progress over 3 seconds
							const newProgress = interactionProgress + delta / 3.0;
							setInteractionProgress(newProgress);

							// Check if interrupted by damage
							if (Date.now() - lastDamageTime.current < 100) {
								// Recently damaged, interrupt
								setIsInteracting(false);
								setInteractingEntity(null);
								setInteractionProgress(0);
								setInteractionPrompt(null);
							} else if (newProgress >= 1.0) {
								// Interaction complete!
								entity.rescued = true;
								if (entity.objectiveId) {
									rescueCharacter(entity.objectiveId);
									setRecentlyRescuedCharacter(entity.objectiveId);
									audioEngine.playSFX("pickup");
								}
								setIsInteracting(false);
								setInteractingEntity(null);
								setInteractionProgress(0);
								setInteractionPrompt(null);
							}
						}
					} else {
						// Show prompt but not interacting
						if (!isInteracting) {
							setInteractionPrompt("RESCUE");
						} else if (interactingEntity?.entity.id === entity.id) {
							// Button released, cancel interaction
							setIsInteracting(false);
							setInteractingEntity(null);
							setInteractionProgress(0);
							setInteractionPrompt("RESCUE");
						}
					}
				} else if (isInteracting && interactingEntity?.entity.id === entity.id) {
					// Moved out of range
					setIsInteracting(false);
					setInteractingEntity(null);
					setInteractionProgress(0);
					setInteractionPrompt(null);
				}
				if (entity.type === "RAFT" && dist < 2 && !isPilotingRaft) {
					setPilotingRaft(true, entity.id);
					audioEngine.playSFX("pickup");
				}
			});
		});

		if (isAiming) {
			playerRef.current.rotation.y -= input.look.x * 3 * delta;
			if (moveVec.lengthSq() > 0.01)
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			if (state.clock.elapsedTime - lastFireTime.current > GAME_CONFIG.FIRE_RATE) {
				const shootDir = new THREE.Vector3(0, 0, 1).applyQuaternion(playerRef.current.quaternion);
				const muzzlePos = playerRef.current.position
					.clone()
					.add(new THREE.Vector3(0, 1, 0))
					.add(shootDir.clone().multiplyScalar(1.5));
				projectilesRef.current?.spawn(muzzlePos, shootDir);
				audioEngine.playSFX("shoot");
				lastFireTime.current = state.clock.elapsedTime;
				playerRef.current.rotation.y += (Math.random() - 0.5) * 0.05;
			}
		} else if (moveVec.lengthSq() > 0.01) {
			const targetAngle = Math.atan2(moveVec.x, moveVec.z);
			let diff = targetAngle - playerRef.current.rotation.y;
			diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
			playerRef.current.rotation.y += diff * 5 * delta;
			playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
		}

		setPlayerVelYLocal(newVelY);
		setPlayerVelY(newVelY);
		setIsPlayerMoving(moveVec.lengthSq() > 0.01);
		setPlayerPos([
			playerRef.current.position.x,
			playerRef.current.position.y,
			playerRef.current.position.z,
		]);

		// Clear interaction prompt if no longer near any prison cages
		const nearAnyCage = activeChunks.some((chunk) =>
			chunk.entities.some((entity) => {
				if (entity.type !== "PRISON_CAGE" || entity.rescued) return false;
				const worldPos = new THREE.Vector3(
					chunk.x * CHUNK_SIZE + entity.position[0],
					entity.position[1],
					chunk.z * CHUNK_SIZE + entity.position[2],
				);
				return playerRef.current!.position.distanceTo(worldPos) < 3;
			}),
		);
		if (!nearAnyCage && interactionPrompt) {
			setInteractionPrompt(null);
			setIsInteracting(false);
			setInteractingEntity(null);
			setInteractionProgress(0);
		}

		const targetDist = isZoomed ? 6 : 12;
		const cameraOffset = new THREE.Vector3(1.5, 4, targetDist).applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			playerRef.current.rotation.y,
		);
		state.camera.position.lerp(playerRef.current.position.clone().add(cameraOffset), 0.08);
		state.camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
	});

	return null;
}

export function Level() {
	const { selectedCharacterId, saveData, isCarryingClam, isPilotingRaft } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;
	const [playerPos] = useState(() => new THREE.Vector3(0, 0, 0));
	const [, setPlayerVelY] = useState(0);
	const [isClimbing] = useState(false);
	const [playerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);
	const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
	const [interactionProgress, setInteractionProgress] = useState(0);
	const [isInteracting, setIsInteracting] = useState(false);
	const [interactingEntity, setInteractingEntity] = useState<{
		entity: ChunkData["entities"][0];
		chunk: ChunkData;
	} | null>(null);
	const [recentlyRescuedCharacter, setRecentlyRescuedCharacter] = useState<string | null>(null);
	const playerRef = useRef<THREE.Group | null>(null);
	const projectilesRef = useRef<ProjectilesHandle | null>(null);
	const lastDamageTime = useRef(0);

	const handleImpact = useCallback((pos: THREE.Vector3, type: "blood" | "shell") => {
		audioEngine.playSFX("hit");
		const newParticles = [...Array(5)].map(() => ({
			id: `${type}-${Math.random()}`,
			position: pos.clone(),
			velocity: new THREE.Vector3(
				(Math.random() - 0.5) * 5,
				Math.random() * 5,
				(Math.random() - 0.5) * 5,
			),
			lifetime: 0.5 + Math.random() * 0.5,
			type,
		}));
		setParticles((prev) => [...prev, ...newParticles]);
	}, []);

	return (
		<>
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
					setInteractionPrompt={setInteractionPrompt}
					setInteractionProgress={setInteractionProgress}
					setIsInteracting={setIsInteracting}
					setInteractingEntity={setInteractingEntity}
					setRecentlyRescuedCharacter={setRecentlyRescuedCharacter}
					interactionPrompt={interactionPrompt}
					interactionProgress={interactionProgress}
					isInteracting={isInteracting}
					interactingEntity={interactingEntity}
					lastDamageTime={lastDamageTime}
				/>
				<ambientLight intensity={0.3} />
				<directionalLight position={[50, 50, 25]} intensity={1.5} castShadow />
				<Sky sunPosition={[100, 20, 100]} />
				<fogExp2 attach="fog" args={["#d4c4a8", 0.015]} />
				<Environment preset="sunset" />
				{activeChunks.map((chunk) => (
					<Chunk key={chunk.id} data={chunk} playerPos={playerPos} />
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
			{/* UI overlays outside Canvas */}
			<InteractionPrompt
				promptText={interactionPrompt}
				progress={interactionProgress}
				isInteracting={isInteracting}
			/>
			<CharacterUnlockedNotification
				characterId={recentlyRescuedCharacter}
				onComplete={() => setRecentlyRescuedCharacter(null)}
			/>
		</>
	);
}
