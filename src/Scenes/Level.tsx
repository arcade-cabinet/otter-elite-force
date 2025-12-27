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
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { audioEngine } from "../Core/AudioEngine";
import { GameLoop } from "../Core/GameLoop";
import { inputSystem } from "../Core/InputSystem";
import { Enemy } from "../Entities/Enemies";
import { type ParticleData, Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import { Snake } from "../Entities/SnakePredator";
import { Snapper } from "../Entities/SnapperBunker";
import { randomRange } from "../utils/math";

import { FLAG_FRAG, FLAG_VERT, WATER_FRAG, WATER_VERT } from "../utils/shaders";

function _Flag({ position }: { position: [number, number, number] }) {
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
					vertexShader={FLAG_VERT}
					fragmentShader={FLAG_FRAG}
					uniforms={flagUniforms.current}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}

function Lilypads({ count = 20 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(10, 60);
			dummy.position.set(Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist);
			const size = randomRange(0.5, 1.2);
			dummy.scale.set(size, 0.05, size);
			dummy.rotation.y = Math.random() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
			<cylinderGeometry args={[1, 1, 1, 12]} />
			<meshStandardMaterial color="#2a4d1a" roughness={0.9} />
		</instancedMesh>
	);
}

function Reeds({ count = 40 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(20, 80);
			dummy.position.set(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist);
			dummy.scale.set(0.2, randomRange(1, 3), 0.2);
			dummy.rotation.y = Math.random() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 8]} />
			<meshStandardMaterial color="#4d7a2b" roughness={0.9} />
		</instancedMesh>
	);
}

import { CHARACTERS } from "../stores/gameStore";

function _Debris({ count = 10, color = "#444" }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(10, 70);
			dummy.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
			dummy.scale.set(randomRange(0.5, 2), randomRange(0.5, 1), randomRange(0.5, 2));
			dummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
		</instancedMesh>
	);
}

function BurntTrees({ count = 15 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(30, 90);
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(randomRange(0.5, 1), randomRange(4, 10), randomRange(0.5, 1));
			dummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.3, 0.5, 1, 6]} />
			<meshStandardMaterial color="#1a1a1a" roughness={1} />
		</instancedMesh>
	);
}

function Mangroves({ count = 30 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(25, 80);
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(randomRange(0.8, 1.5), randomRange(5, 12), randomRange(0.8, 1.5));
			dummy.rotation.set(randomRange(-0.1, 0.1), Math.random() * Math.PI, randomRange(-0.1, 0.1));
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.4, 0.8, 1, 8]} />
			<meshStandardMaterial color="#2d3d19" roughness={1} />
		</instancedMesh>
	);
}

function FloatingDrums({ count = 10 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(15, 60);
			dummy.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
			dummy.scale.set(0.6, 0.9, 0.6);
			dummy.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 12]} />
			<meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
		</instancedMesh>
	);
}

import { CHUNK_SIZE, GAME_CONFIG, useGameStore } from "../stores/gameStore";

function Siphon({ position }: { position: THREE.Vector3 }) {
	const smokeRef = useRef<THREE.Group>(null);
	
	useFrame((state) => {
		if (smokeRef.current) {
			const t = state.clock.elapsedTime;
			smokeRef.current.children.forEach((child, i) => {
				child.position.y += 0.05;
				child.scale.setScalar(child.scale.x + 0.01);
				if (child.position.y > 5) {
					child.position.y = 0;
					child.scale.setScalar(0.2);
				}
			});
		}
	});

	return (
		<group position={position}>
			{/* Main Siphon Structure */}
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[1.5, 2, 4, 8]} />
				<meshStandardMaterial color="#111" metalness={0.8} />
			</mesh>
			{/* Pumping Pipes */}
			{[0, 1, 2].map(i => (
				<mesh key={i} rotation-y={(i * Math.PI * 2) / 3} position={[0, -1, 0]}>
					<cylinderGeometry args={[0.3, 0.3, 5]} rotation-z={Math.PI / 2.5} />
					<meshStandardMaterial color="#222" />
				</mesh>
			))}
			{/* Dirty Smoke Effect */}
			<group ref={smokeRef} position={[0, 2, 0]}>
				{[...Array(5)].map((_, i) => (
					<mesh key={i} position={[0, i * 1, 0]}>
						<sphereGeometry args={[0.5, 8, 8]} />
						<meshBasicMaterial color="#333" transparent opacity={0.4} />
					</mesh>
				))}
			</group>
			{/* Objective Light */}
			<pointLight color="#ff0000" intensity={2} distance={10} />
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

			{data.decorations.map((dec, i) => {
				if (dec.type === "REED") return <Reeds key={`${data.id}-r-${i}`} count={dec.count} />;
				if (dec.type === "LILYPAD") return <Lilypads key={`${data.id}-l-${i}`} count={dec.count} />;
				if (dec.type === "MANGROVE")
					return <Mangroves key={`${data.id}-m-${i}`} count={dec.count} />;
				if (dec.type === "BURNT_TREE")
					return <BurntTrees key={`${data.id}-b-${i}`} count={dec.count} />;
				if (dec.type === "DRUM")
					return <FloatingDrums key={`${data.id}-d-${i}`} count={dec.count} />;
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
							data={{ ...entity, position: worldPos, hp: 10, maxHp: 10 }}
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
				if (entity.type === "SIPHON")
					return (
						<Siphon key={entity.id} position={worldPos} />
					);
				return null;
			})}
		</group>
	);
}

export function Level() {
	const { isZoomed, selectedCharacterId, getNearbyChunks, setPlayerPos, setMud } = useGameStore();
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;

	const [playerPos] = useState(new THREE.Vector3(0, 0, 0));
	const [playerVelY, setPlayerVelY] = useState(0);
	const [isGrounded, setIsGrounded] = useState(true);
	const [isClimbing, setIsClimbing] = useState(false);
	const [playerRot, setPlayerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [_playerVelocity, setPlayerVelocity] = useState(0);

	const [activeChunks, setActiveChunks] = useState<ChunkData[]>([]);
	const [particles, _setParticles] = useState<ParticleData[]>([]);

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
		// Update if needed (simple check)
		if (nearby.length !== activeChunks.length || nearby[0].id !== activeChunks[0]?.id) {
			setActiveChunks(nearby);
		}
	});

	useFrame((state, delta) => {
		const currentTime = state.clock.elapsedTime;

		if (!playerRef.current) return;

		const input = inputSystem.getState();
		const cam = state.camera;

		// Movement logic (same as before)
		const camDir = new THREE.Vector3();
		cam.getWorldDirection(camDir);
		camDir.y = 0;
		camDir.normalize();

		const camSide = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0));
		const moveVec = new THREE.Vector3();

		if (Math.abs(input.move.y) > 0.1) moveVec.add(camDir.clone().multiplyScalar(-input.move.y));
		if (Math.abs(input.move.x) > 0.1) moveVec.add(camSide.clone().multiplyScalar(input.move.x));

		const isAiming = input.look.active;
		const moveSpeed = isAiming ? GAME_CONFIG.PLAYER_STRAFE_SPEED : GAME_CONFIG.PLAYER_SPEED;

		// --- 3D PHYSICS: JUMP & GRAVITY ---
		let newVelY = playerVelY;

		// Gravity
		if (!isGrounded) {
			newVelY -= 30 * delta; // Gravity constant
		}

		// Jump
		if (input.jump && isGrounded) {
			newVelY = 12; // Jump impulse
			setIsGrounded(false);
			audioEngine.playSFX("pickup"); // Use pickup sound as temp jump sound
		}

		// Apply vertical movement
		playerRef.current.position.y += newVelY * delta;

		// Floor Collision (Simplified)
		if (playerRef.current.position.y <= 0) {
			playerRef.current.position.y = 0;
			newVelY = 0;
			setIsGrounded(true);
		}

		// Platform Collision (AABB check against nearby chunks)
		let _onPlatform = false;
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
							_onPlatform = true;
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
			// Vertical movement from right stick (look input)
			newVelY = -input.look.y * 10;
		} else {
			if (isClimbing) {
				setIsClimbing(false);
				// Small jump away if desired, but for now just fall
			}
		}

		setPlayerVelY(newVelY);

		if (isClimbing) {
			// Update state for animation
			setIsPlayerMoving(Math.abs(newVelY) > 0.1);
			playerPos.copy(playerRef.current.position);
			// Face the climbable? For now just stay as is.
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

		// Update state
		const velocity = moveVec.length();
		setIsPlayerMoving(velocity > 0.01);
		setPlayerVelocity(velocity);
		setPlayerRot(playerRef.current.rotation.y);
		playerPos.copy(playerRef.current.position);
		setPlayerPos([playerPos.x, playerPos.y, playerPos.z]);

		// Update mud based on current chunk
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

	return (
		<Canvas shadows camera={{ position: [0, 12, 20], fov: 60 }} gl={{ antialias: true }}>
			<ambientLight intensity={0.4} />
			<directionalLight
				position={[50, 50, 25]}
				intensity={1}
				castShadow
				shadow-mapSize={[2048, 2048]}
			/>
			<Sky sunPosition={[100, 20, 100]} />
			<fog attach="fog" args={["#d4c4a8", 20, 150]} />
			<Environment preset="sunset" />

			{/* Render Chunks */}
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
			/>

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
