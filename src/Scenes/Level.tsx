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
import { Enemy } from "../Entities/Enemies/Gator";
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
	type ChunkData,
	GAME_CONFIG,
	useGameStore,
} from "../stores/gameStore";
import { WATER_FRAG, WATER_VERT } from "../utils/shaders";

// Placeholder for missing components to ensure build
function _GasStockpile({
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
				<mesh key={`gas-${i}`} position={pos as [number, number, number]} castShadow receiveShadow>
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

function _ClamBasket({ position, isTrap = false }: { position: THREE.Vector3; isTrap?: boolean }) {
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

function _PrisonCage({
	position,
	rescued = false,
}: {
	position: THREE.Vector3;
	rescued?: boolean;
}) {
	return (
		<group position={position}>
			{!rescued && (
				<mesh castShadow>
					<boxGeometry args={[2, 3, 2]} />
					<meshStandardMaterial color="#222" wireframe />
				</mesh>
			)}
			<mesh position={[0, -0.1, 0]} receiveShadow>
				<boxGeometry args={[2.5, 0.2, 2.5]} />
				<meshStandardMaterial color="#111" />
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
						<Enemy
							key={entity.id}
							data={{
								...entity,
								position: worldPos,
								hp: entity.hp || 10,
								maxHp: 10,
								state: "IDLE",
								suppression: entity.suppression || 0,
							}}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAKE")
					return (
						<Snake
							key={entity.id}
							data={{
								...entity,
								position: worldPos,
								hp: entity.hp || 2,
								maxHp: 2,
								suppression: entity.suppression || 0,
							}}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAPPER")
					return (
						<Snapper
							key={entity.id}
							data={{
								...entity,
								position: worldPos,
								hp: entity.hp || 20,
								maxHp: 20,
								suppression: entity.suppression || 0,
							}}
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
					return <_GasStockpile key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "CLAM_BASKET")
					return <_ClamBasket key={entity.id} position={worldPos} isTrap={entity.isHeavy} />;
				if (entity.type === "EXTRACTION_POINT")
					return <ExtractionPoint key={entity.id} position={worldPos} />;
				if (entity.type === "VILLAGER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HEALER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HUT")
					return <ModularHut key={entity.id} position={worldPos} seed={data.seed} />;
				if (entity.type === "PRISON_CAGE")
					return <_PrisonCage key={entity.id} position={worldPos} rescued={entity.rescued} />;
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

function World() {
	const {
		isZoomed,
		selectedCharacterId,
		getNearbyChunks,
		setPlayerPos,
		setMud,
		secureChunk,
		isCarryingClam,
		setCarryingClam,
		isEscortingVillager,
		setEscortingVillager,
		addCoins,
		isPilotingRaft,
		setPilotingRaft,
		rescueCharacter,
		collectSpoils,
		completeStrategic,
		takeDamage,
		saveData,
		secureLZ,
	} = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;
	const [playerPos] = useState(new THREE.Vector3(0, 0, 0));
	const [playerVelY, setPlayerVelY] = useState(0);
	const [isGrounded, setIsGrounded] = useState(true);
	const [isClimbing, _setIsClimbing] = useState(false);
	const [playerRot, _setPlayerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [isFiring, setIsFiring] = useState(false);
	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);
	const playerRef = useRef<THREE.Group>(null);
	const projectilesRef = useRef<ProjectilesHandle>(null);
	const lastFireTime = useRef(0);

	const handleImpact = useCallback((pos: THREE.Vector3, type: "blood" | "shell" | "explosion") => {
		if (type === "explosion") {
			audioEngine.playSFX("explode");
		} else {
			audioEngine.playSFX("hit");
		}
		const newParticles = [...Array(type === "explosion" ? 20 : 5)].map(() => ({
			id: `${type}-${Math.random()}`,
			position: pos.clone(),
			velocity: new THREE.Vector3(
				(Math.random() - 0.5) * (type === "explosion" ? 10 : 5),
				Math.random() * (type === "explosion" ? 10 : 5),
				(Math.random() - 0.5) * (type === "explosion" ? 10 : 5),
			),
			lifetime: 0.5 + Math.random() * 0.5,
			type: type === "explosion" ? "explosion" : type,
		}));
		setParticles((prev) => [...prev, ...newParticles]);
	}, []);

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
		if (mudAmount > 0.1) moveSpeed *= 1.0 - mudAmount * 0.5; // Slow down up to 50% based on mud

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

		let nearMud = false;
		activeChunks.forEach((chunk) => {
			chunk.entities.forEach((entity) => {
				const worldPos = new THREE.Vector3(
					chunk.x * CHUNK_SIZE + entity.position[0],
					entity.position[1],
					chunk.z * CHUNK_SIZE + entity.position[2],
				);
				const dist = playerRef.current?.position.distanceTo(worldPos);

				if (dist !== undefined && entity.type === "MUD_PIT" && dist < 5) {
					nearMud = true;
				}

				if (
					playerRef.current &&
					entity.type === "PLATFORM" &&
					Math.abs(playerRef.current.position.x - worldPos.x) < 2.5 &&
					Math.abs(playerRef.current.position.z - worldPos.z) < 2.5
				) {
					const top = worldPos.y + 0.5;
					if (
						playerRef.current.position.y >= top - 0.2 &&
						playerRef.current.position.y <= top + 0.5 &&
						newVelY <= 0
					) {
						playerRef.current.position.y = top;
						newVelY = 0;
						setIsGrounded(true);
					}
				}
				if (dist !== undefined && entity.type === "CLAM_BASKET" && dist < 2 && !entity.interacted) {
					entity.interacted = true;
					if (entity.isHeavy) {
						takeDamage(30);
						audioEngine.playSFX("explode");
						handleImpact(worldPos, "shell");
					} else {
						addCoins(100);
						collectSpoils("credit");
						audioEngine.playSFX("pickup");
					}
				}
				if (dist !== undefined && entity.type === "EXTRACTION_POINT" && dist < 3) {
					if (!saveData.isLZSecured && chunk.x === 0 && chunk.z === 0) {
						secureLZ();
						audioEngine.playSFX("pickup");
					} else if (saveData.isLZSecured) {
						// Extract if LZ is already secured and we return to it
						setMode("VICTORY");
					} else if (isCarryingClam) {
						setCarryingClam(false);
						addCoins(500);
						collectSpoils("clam");
					} else if (isEscortingVillager) {
						setEscortingVillager(false);
						addCoins(300);
						gainXP(100);
						audioEngine.playSFX("pickup");
					}
				}
				if (dist !== undefined && entity.type === "VILLAGER" && dist < 2 && !isEscortingVillager) {
					setEscortingVillager(true);
					entity.type = "DEBRIS"; // Remove from world, attached to player
					audioEngine.playSFX("pickup");
				}
				if (dist !== undefined && entity.type === "PRISON_CAGE" && dist < 2 && !entity.rescued) {
					entity.rescued = true;
					if (entity.objectiveId) {
						rescueCharacter(entity.objectiveId);
						audioEngine.playSFX("pickup");
					}
				}
				if (dist !== undefined && entity.type === "RAFT" && dist < 2 && !isPilotingRaft) {
					setPilotingRaft(true, entity.id);
					audioEngine.playSFX("pickup");
				}
			});
		});

		if (nearMud) {
			setMud(Math.min(0.8, mudAmount + delta * 0.4));
		} else {
			setMud(Math.max(0, mudAmount - delta * 0.1));
		}

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
				setIsFiring(true);
			} else {
				setIsFiring(false);
			}
		} else {
			setIsFiring(false);
			if (moveVec.lengthSq() > 0.01) {
				const targetAngle = Math.atan2(moveVec.x, moveVec.z);
				let diff = targetAngle - playerRef.current.rotation.y;
				diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
				playerRef.current.rotation.y += diff * 5 * delta;
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			}
		}

		// Projectile collisions
		const currentProjectiles = projectilesRef.current?.getProjectiles() || [];
		for (const p of currentProjectiles) {
			let hit = false;
			activeChunks.forEach((chunk) => {
				if (hit) return;
				chunk.entities.forEach((entity) => {
					if (hit) return;
					if (
						entity.type === "GATOR" ||
						entity.type === "SNAPPER" ||
						entity.type === "SNAKE" ||
						entity.type === "SIPHON" ||
						entity.type === "GAS_STOCKPILE" ||
						entity.type === "OIL_SLICK"
					) {
						const worldPos = new THREE.Vector3(
							chunk.x * CHUNK_SIZE + entity.position[0],
							entity.position[1],
							chunk.z * CHUNK_SIZE + entity.position[2],
						);
						const hitDist =
							entity.type === "SNAPPER"
								? 3
								: entity.type === "GATOR"
									? 2
									: entity.type === "OIL_SLICK"
										? 4
										: 1.5;

						if (p.position.distanceTo(worldPos) < hitDist) {
							const damage = character.gear.weaponId.includes("sniper") ? 5 : 2;
							entity.hp = (entity.hp || 10) - damage;
							handleImpact(p.position, entity.type === "SIPHON" ? "shell" : "blood");
							projectilesRef.current?.remove(p.id);
							hit = true;

							if (entity.type === "OIL_SLICK") {
								handleImpact(worldPos, "explosion");
								// Damage nearby
								activeChunks.forEach((c) => {
									c.entities.forEach((e) => {
										const ePos = new THREE.Vector3(
											c.x * CHUNK_SIZE + e.position[0],
											e.position[1],
											c.z * CHUNK_SIZE + e.position[2],
										);
										if (ePos.distanceTo(worldPos) < 6) {
											e.hp = (e.hp || 10) - 20;
										}
									});
								});
								if (playerRef.current && playerRef.current.position.distanceTo(worldPos) < 6) {
									takeDamage(40);
								}
								entity.type = "DEBRIS"; // Oil is gone, replaced by debris
							}

							if (entity.hp <= 0) {
								if (
									entity.type === "GATOR" ||
									entity.type === "SNAPPER" ||
									entity.type === "SNAKE"
								) {
									addKill();
									gainXP(50);
									addCoins(25);
								} else if (entity.type === "SIPHON") {
									secureChunk(chunk.id);
								} else if (entity.type === "GAS_STOCKPILE") {
									completeStrategic("gas");
								}
							}
						}
					}
				});
			});
		}

		setPlayerVelY(newVelY);
		setIsPlayerMoving(moveVec.lengthSq() > 0.01);
		setPlayerPos([
			playerRef.current.position.x,
			playerRef.current.position.y,
			playerRef.current.position.z,
		]);

		const targetDist = isZoomed ? 6 : 12;
		const cameraOffset = new THREE.Vector3(1.5, 4, targetDist).applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			playerRef.current.rotation.y,
		);
		state.camera.position.lerp(playerRef.current.position.clone().add(cameraOffset), 0.08);
		state.camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
	});

	return (
		<>
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
				isFiring={isFiring}
			>
				{isCarryingClam && <Clam position={[0, 1.5, 0]} isCarried />}
				{isEscortingVillager && (
					<group position={[0, 0, -1.5]}>
						<Villager position={new THREE.Vector3(0, 0, 0)} />
					</group>
				)}
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
		</>
	);
}

export function Level() {
	return (
		<Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }} gl={{ antialias: true }}>
			<ambientLight intensity={0.3} />
			<directionalLight position={[50, 50, 25]} intensity={1.5} castShadow />
			<Sky sunPosition={[100, 20, 100]} />
			<fogExp2 attach="fog" args={["#d4c4a8", 0.015]} />
			<Environment preset="sunset" />
			<World />
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
