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
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { audioEngine } from "../Core/AudioEngine";
import { GameLoop } from "../Core/GameLoop";
import { inputSystem } from "../Core/InputSystem";
import {
	BurntTrees,
	Debris,
	FloatingDrums,
	Lilypads,
	Mangroves,
	Reeds,
} from "../Entities/Environment";
import { Clam, ExtractionPoint } from "../Entities/Objectives/Clam";
import { Siphon } from "../Entities/Objectives/Siphon";
import { Hut, Villager } from "../Entities/Villager";
import { type ParticleData, Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import {
	CHARACTERS,
	CHUNK_SIZE,
	type ChunkData,
	GAME_CONFIG,
	useGameStore,
} from "../stores/gameStore";
import { WATER_FRAG, WATER_VERT } from "../utils/shaders";
import { Enemy } from "./Enemies/Gator";
import { Snake } from "./Enemies/Snake";
import { Snapper } from "./Enemies/Snapper";

function Flag({ position }: { position: [number, number, number] }) {
	const flagUniforms = useRef({
		time: { value: 0 },
	});

	useFrame((state) => {
		flagUniforms.current.time.value = state.clock.elapsedTime;
	});

	return (
		<group position={position}>
			{/* Flagpole */}
			<mesh position={[0, 2, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 4, 8]} />
				<meshStandardMaterial color="#333" />
			</mesh>
			{/* Flag cloth */}
			<mesh position={[0.75, 3.3, 0]}>
				<planeGeometry args={[1.5, 1, 20, 20]} />
				<shaderMaterial
					vertexShader={WATER_VERT} // Reusing wave math for flag
					fragmentShader={WATER_FRAG} // Placeholder
					uniforms={flagUniforms.current}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}

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
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
				<meshStandardMaterial color="#2d5016" roughness={0.9} />
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
						<Enemy
							key={entity.id}
							data={{
								...entity,
								position: worldPos,
								hp: 10,
								maxHp: 10,
								state: "IDLE",
								suppression: 0,
							}}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAKE")
					return (
						<Snake
							key={entity.id}
							data={{ ...entity, position: worldPos, hp: 2, maxHp: 2 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAPPER")
					return (
						<Snapper
							key={entity.id}
							data={{ ...entity, position: worldPos, hp: 20, maxHp: 20 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "PLATFORM")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow name="platform">
							<boxGeometry args={[5, 1, 5]} />
							<meshStandardMaterial color="#3d2b1f" roughness={1} />
						</mesh>
					);
				if (entity.type === "CLIMBABLE")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow name="climbable">
							<cylinderGeometry args={[0.8, 1, 10, 8]} />
							<meshStandardMaterial color="#2d1f15" roughness={1} />
						</mesh>
					);
				if (entity.type === "SIPHON") return <Siphon key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "CLAM" && !entity.captured) return <Clam key={entity.id} position={worldPos} />;
				if (entity.type === "EXTRACTION_POINT") return <ExtractionPoint key={entity.id} position={worldPos} />;
				if (entity.type === "VILLAGER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HUT") return <Hut key={entity.id} position={worldPos} />;
				if (entity.type === "OIL_SLICK")
					return (
						<mesh
							key={entity.id}
							position={worldPos}
							rotation={[-Math.PI / 2, 0, 0]}
							receiveShadow
						>
							<circleGeometry args={[4, 16]} />
							<meshStandardMaterial
								color="#1a1a1a"
								roughness={0.1}
								metalness={0.8}
								transparent
								opacity={0.8}
							/>
						</mesh>
					);
				if (entity.type === "MUD_PIT")
					return (
						<mesh
							key={entity.id}
							position={worldPos}
							rotation={[-Math.PI / 2, 0, 0]}
							receiveShadow
						>
							<circleGeometry args={[5, 16]} />
							<meshStandardMaterial color="#3d2b1f" roughness={1} />
						</mesh>
					);
				return null;
			})}
		</group>
	);
}

export function Level() {
	const { isZoomed, selectedCharacterId, getNearbyChunks, setPlayerPos, setMud, secureChunk, isCarryingClam, setCarryingClam, addCoins } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;

	const [playerPos] = useState(new THREE.Vector3(0, 0, 0));
	const [playerVelY, setPlayerVelY] = useState(0);
	const [isGrounded, setIsGrounded] = useState(true);
	const [isClimbing, setIsClimbing] = useState(false);
	const [playerRot, setPlayerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [_playerVelocity, setPlayerVelocity] = useState(0);

	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);

	// Impact helper
	const handleImpact = useCallback((pos: THREE.Vector3, type: "blood" | "shell") => {
		audioEngine.playSFX("hit");
		const particleCount = 5;
		const newParticles: ParticleData[] = [];
		for (let j = 0; j < particleCount; j++) {
			newParticles.push({
				id: `${type}-${Math.random()}`,
				position: pos.clone(),
				velocity: new THREE.Vector3(
					(Math.random() - 0.5) * 5,
					Math.random() * 5,
					(Math.random() - 0.5) * 5,
				),
				lifetime: 0.5 + Math.random() * 0.5,
				type: type,
			});
		}
		setParticles((prev) => [...prev, ...newParticles]);
	}, []);

	// Refs for imperative updates
	const playerRef = useRef<THREE.Group>(null);
	const projectilesRef = useRef<ProjectilesHandle>(null);
	const lastFireTime = useRef(0);

	// Update active chunks based on player position
	useFrame(() => {
		if (!playerRef.current) return;
		const cx = Math.floor(playerRef.current.position.x / CHUNK_SIZE);
		const cz = Math.floor(playerRef.current.position.z / CHUNK_SIZE);

		const nearby = getNearbyChunks(cx, cz);
		if (nearby.length !== activeChunks.length || nearby[0].id !== activeChunks[0]?.id) {
			setActiveChunks(nearby);
		}
	});

	useFrame((state, delta) => {
		const currentTime = state.clock.elapsedTime;

		if (!playerRef.current) return;

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

		// --- HAZARD DETECTION ---
		let onSlick = false;
		let inMud = false;

		activeChunks.forEach((chunk) => {
			chunk.entities.forEach((entity) => {
				if (entity.type === "OIL_SLICK" || entity.type === "MUD_PIT") {
					const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
					const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
					const dist = new THREE.Vector2(
						playerRef.current!.position.x,
						playerRef.current!.position.z,
					).distanceTo(new THREE.Vector2(worldX, worldZ));

					if (dist < (entity.type === "OIL_SLICK" ? 4 : 5)) {
						if (entity.type === "OIL_SLICK") onSlick = true;
						if (entity.type === "MUD_PIT") inMud = true;
					}
				}
			});
		});

		if (inMud) moveSpeed *= 0.4;
		if (onSlick) moveSpeed *= 1.5;
		if (isCarryingClam) moveSpeed *= 0.7; // Clam is heavy!

		// --- 3D PHYSICS: JUMP & GRAVITY ---
		let newVelY = playerVelY;
		if (!isGrounded) {
			newVelY -= 30 * delta;
		}
		if (input.jump && isGrounded) {
			newVelY = 12;
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
				if (entity.type === "PLATFORM") {
					const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
					const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
					const platformTop = entity.position[1] + 0.5;
					const dx = Math.abs(playerRef.current!.position.x - worldX);
					const dz = Math.abs(playerRef.current!.position.z - worldZ);
					if (dx < 2.5 && dz < 2.5) {
						const footLevel = playerRef.current!.position.y;
						if (footLevel >= platformTop - 0.2 && footLevel <= platformTop + 0.5 && newVelY <= 0) {
							playerRef.current!.position.y = platformTop;
							newVelY = 0;
							setIsGrounded(true);
						}
					}
				}
			});
		});

		// --- CLIMBING LOGIC ---
		let nearClimbable = false;
		activeChunks.forEach((chunk) => {
			chunk.entities.forEach((entity) => {
				if (entity.type === "CLIMBABLE") {
					const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
					const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
					const dist = new THREE.Vector2(
						playerRef.current!.position.x,
						playerRef.current!.position.z,
					).distanceTo(new THREE.Vector2(worldX, worldZ));
					if (dist < 2.5) {
						nearClimbable = true;
					}
				}
			});
		});

		if (input.grip && nearClimbable) {
			if (!isClimbing) {
				setIsClimbing(true);
				setIsGrounded(false);
				newVelY = 0;
			}
			newVelY = -input.look.y * character.traits.climbSpeed;
		} else {
			if (isClimbing) {
				setIsClimbing(false);
			}
		}

		setPlayerVelY(newVelY);

		if (isClimbing) {
			setIsPlayerMoving(Math.abs(newVelY) > 0.1);
			playerPos.copy(playerRef.current.position);
		} else if (isAiming) {
			playerRef.current.rotation.y -= input.look.x * 3 * delta;
			if (moveVec.lengthSq() > 0.01) {
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			}

			if (currentTime - lastFireTime.current > GAME_CONFIG.FIRE_RATE) {
				const shootDir = new THREE.Vector3(0, 0, 1);
				shootDir.applyQuaternion(playerRef.current.quaternion);
				const muzzlePos = playerRef.current.position.clone().add(new THREE.Vector3(0, 1, 0));
				muzzlePos.add(shootDir.clone().multiplyScalar(1.5));
				projectilesRef.current?.spawn(muzzlePos, shootDir);
				audioEngine.playSFX("shoot");
				lastFireTime.current = currentTime;

				const recoilAmount = character.gear.weapon === "fish-cannon" ? 0.05 : 0.02;
				playerRef.current.rotation.y += (Math.random() - 0.5) * recoilAmount;

				activeChunks.forEach(chunk => {
					chunk.entities.forEach(entity => {
						if (entity.type === "GATOR") {
							const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
							const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
							const dist = new THREE.Vector3(worldX, 0, worldZ).distanceTo(playerRef.current!.position);
							if (dist < 15) {
								entity.suppression = Math.min(1, (entity.suppression || 0) + 0.15);
							}
						}
					});
				});

				state.camera.position.add(new THREE.Vector3(Math.random() * 0.1 - 0.05, 0, 0));
			}
		} else {
			if (moveVec.lengthSq() > 0.01) {
				const targetAngle = Math.atan2(moveVec.x, moveVec.z);
				const currentAngle = playerRef.current.rotation.y;
				let diff = targetAngle - currentAngle;
				diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
				playerRef.current.rotation.y += diff * 5 * delta;
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			}
		}

		// --- COLLISION DETECTION ---
		activeChunks.forEach(chunk => {
			chunk.entities.forEach(entity => {
				const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
				const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
				const worldPos = new THREE.Vector3(worldX, entity.position[1], worldZ);
				const dist = playerRef.current!.position.distanceTo(worldPos);

				if (entity.type === "CLAM" && !isCarryingClam && !entity.captured && dist < 2) {
					setCarryingClam(true);
					audioEngine.playSFX("pickup");
				} else if (entity.type === "EXTRACTION_POINT" && isCarryingClam && dist < 3) {
					setCarryingClam(false);
					addCoins(500); // Massive reward for capturing clam
					// Mark clam as captured in its chunk
					const clamChunkId = Object.keys(useGameStore.getState().saveData.discoveredChunks).find(id => {
						return useGameStore.getState().saveData.discoveredChunks[id].entities.some(e => e.type === "CLAM" && !e.captured);
					});
					if (clamChunkId) {
						const chunk = useGameStore.getState().saveData.discoveredChunks[clamChunkId];
						const clam = chunk.entities.find(e => e.type === "CLAM" && !e.captured);
						if (clam) clam.captured = true;
					}
					audioEngine.playSFX("pickup");
				} else if (entity.type === "VILLAGER" && dist < 2) {
					// Interaction with villager (e.g. credits or intel)
					// For now just small coin reward
					if (!(entity as any).rescued) {
						(entity as any).rescued = true;
						addCoins(50);
						audioEngine.playSFX("pickup");
					}
				}
			});
		});

		const currentProjectiles = projectilesRef.current?.getProjectiles() || [];
		for (const projectile of currentProjectiles) {
			activeChunks.forEach((chunk) => {
				chunk.entities.forEach((entity) => {
					const worldX = chunk.x * CHUNK_SIZE + entity.position[0];
					const worldY = entity.position[1];
					const worldZ = chunk.z * CHUNK_SIZE + entity.position[2];
					const worldPos = new THREE.Vector3(worldX, worldY, worldZ);
					const dist = projectile.position.distanceTo(worldPos);
					let hit = false;
					let hitType: "blood" | "shell" = "blood";

					if (entity.type === "GATOR" && dist < 1.5) { hit = true; hitType = "blood"; }
					else if (entity.type === "SNAKE" && dist < 1.0) { hit = true; hitType = "blood"; }
					else if (entity.type === "SNAPPER" && dist < 2.0) { hit = true; hitType = "shell"; }
					else if (entity.type === "SIPHON" && dist < 2.0 && !chunk.secured) { hit = true; hitType = "shell"; }

					if (hit) {
						entity.hp = (entity.hp || 10) - GAME_CONFIG.BULLET_DAMAGE;
						handleImpact(projectile.position, hitType);
						projectilesRef.current?.remove(projectile.id);
						if (entity.hp <= 0) {
							if (entity.type === "SIPHON") {
								secureChunk(chunk.id);
							} else {
								chunk.entities = chunk.entities.filter((e) => e.id !== entity.id);
								useGameStore.getState().addCoins(10);
							}
						}
					}
				});
			});
		}

		const velocity = moveVec.length();
		setIsPlayerMoving(velocity > 0.01);
		setPlayerVelocity(velocity);
		setPlayerRot(playerRef.current.rotation.y);
		playerPos.copy(playerRef.current.position);
		setPlayerPos([playerPos.x, playerPos.y, playerPos.z]);

		const cx = Math.floor(playerPos.x / CHUNK_SIZE);
		const cz = Math.floor(playerPos.z / CHUNK_SIZE);
		const currentChunk = activeChunks.find((c) => c.x === cx && c.z === cz);
		if (currentChunk) {
			const targetMud = currentChunk.terrainType === "MARSH" ? 0.4 : 0;
			setMud(targetMud);
		}
		const targetDist = isZoomed ? GAME_CONFIG.CAMERA_DISTANCE_ZOOM : GAME_CONFIG.CAMERA_DISTANCE;
		const cameraOffset = new THREE.Vector3(0, GAME_CONFIG.CAMERA_HEIGHT, targetDist).applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			playerRef.current.rotation.y,
		);
		state.camera.position.lerp(playerRef.current.position.clone().add(cameraOffset), 0.1);
		state.camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 2, 0)));
	});

	const handleParticleExpire = useCallback((id: string) => {
		setParticles((prev) => prev.filter((p) => p.id !== id));
	}, []);

	return (
		<Canvas shadows camera={{ position: [0, 12, 20], fov: 60 }} gl={{ antialias: true }}>
			<ambientLight intensity={0.4} />
			<directionalLight position={[50, 50, 25]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
			<Sky sunPosition={[100, 20, 100]} />
			<fog attach="fog" args={["#d4c4a8", 20, 150]} />
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
				{isCarryingClam && <Clam position={[0, 1.5, 0]} isCarried />}
			</PlayerRig>

			<Projectiles ref={projectilesRef} />
			<Particles particles={particles} onExpire={handleParticleExpire} />
			<GameLoop />

			<EffectComposer>
				<Bloom intensity={0.5} />
				<Noise opacity={0.05} />
				<Vignette eskil={false} offset={0.1} darkness={1.2} />
				<BrightnessContrast brightness={0.05} contrast={0.2} />
				<HueSaturation saturation={-0.2} />
			</EffectComposer>
		</Canvas>
	);
}
