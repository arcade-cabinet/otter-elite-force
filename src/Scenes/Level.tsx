/**
 * Level Scene
 * Main gameplay scene with 3D world
 */

import { Environment, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { audioEngine } from "../Core/AudioEngine";
import { GameLoop } from "../Core/GameLoop";
import { inputSystem } from "../Core/InputSystem";
import { Enemy, type EnemyData } from "../Entities/Enemies";
import { type ParticleData, Particles } from "../Entities/Particles";
import { PlayerRig } from "../Entities/PlayerRig";
import { Projectiles, type ProjectilesHandle } from "../Entities/Projectiles";
import { useGameStore } from "../stores/gameStore";
import { GAME_CONFIG, LEVELS } from "../utils/constants";
import { randomRange } from "../utils/math";

import { FLAG_FRAG, FLAG_VERT, WATER_FRAG, WATER_VERT } from "../utils/shaders";

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
	}, [count, meshRef]);

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
	}, [count, meshRef]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 8]} />
			<meshStandardMaterial color="#4d7a2b" roughness={0.9} />
		</instancedMesh>
	);
}

export function Level() {
	const { currentLevel, addKill, isZoomed } = useGameStore();
	const level = LEVELS[currentLevel];

	const [playerPos] = useState(new THREE.Vector3(0, 0, 0));
	const [playerRot, setPlayerRot] = useState(0);
	const [isPlayerMoving, setIsPlayerMoving] = useState(false);
	const [playerVelocity, setPlayerVelocity] = useState(0);

	const [enemies, setEnemies] = useState<EnemyData[]>([]);
	const [particles, setParticles] = useState<ParticleData[]>([]);

	// Refs for imperative updates
	const playerRef = useRef<THREE.Group>(null);
	const projectilesRef = useRef<ProjectilesHandle>(null);
	const lastFireTime = useRef(0);

	// Water shader uniforms
	const waterUniforms = useRef({
		time: { value: 0 },
		waterColor: { value: new THREE.Color("#1e3a5f") },
	});

	useFrame((state, delta) => {
		const currentTime = state.clock.elapsedTime;
		waterUniforms.current.time.value = currentTime;

		if (!playerRef.current) return;

		const input = inputSystem.getState();
		const cam = state.camera;

		// Movement logic
		const camDir = new THREE.Vector3();
		cam.getWorldDirection(camDir);
		camDir.y = 0;
		camDir.normalize();

		const camSide = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0));
		const moveVec = new THREE.Vector3();

		if (Math.abs(input.move.y) > 0.1) {
			moveVec.add(camDir.clone().multiplyScalar(-input.move.y));
		}
		if (Math.abs(input.move.x) > 0.1) {
			moveVec.add(camSide.clone().multiplyScalar(input.move.x));
		}

		const isAiming = input.look.active;
		const moveSpeed = isAiming ? GAME_CONFIG.PLAYER_STRAFE_SPEED : GAME_CONFIG.PLAYER_SPEED;

		if (isAiming) {
			// Aiming mode: rotate based on look input
			playerRef.current.rotation.y -= input.look.x * 3 * delta;
			if (moveVec.lengthSq() > 0.01) {
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			}

			// Shooting logic
			if (currentTime - lastFireTime.current > GAME_CONFIG.FIRE_RATE) {
				const shootDir = new THREE.Vector3(0, 0, 1);
				shootDir.applyQuaternion(playerRef.current.quaternion);

				const muzzlePos = playerRef.current.position.clone().add(new THREE.Vector3(0, 1, 0));
				muzzlePos.add(shootDir.clone().multiplyScalar(1.5));

				projectilesRef.current?.spawn(muzzlePos, shootDir);
				audioEngine.playSFX("shoot");
				lastFireTime.current = currentTime;

				// Recoil/shake effect
				state.camera.position.add(new THREE.Vector3(Math.random() * 0.1 - 0.05, 0, 0));
			}
		} else {
			// Normal mode: rotate towards movement direction
			if (moveVec.lengthSq() > 0.01) {
				const targetAngle = Math.atan2(moveVec.x, moveVec.z);
				const currentAngle = playerRef.current.rotation.y;
				let diff = targetAngle - currentAngle;
				diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

				playerRef.current.rotation.y += diff * 5 * delta;
				playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
			}
		}

		// Collision Detection
		const currentProjectiles = projectilesRef.current?.getProjectiles() || [];
		for (const projectile of currentProjectiles) {
			for (let i = 0; i < enemies.length; i++) {
				const enemy = enemies[i];
				const dist = projectile.position.distanceTo(enemy.position);

				if (dist < 1.5) {
					// Hit detected
					enemy.hp -= GAME_CONFIG.BULLET_DAMAGE;
					projectilesRef.current?.remove(projectile.id);
					audioEngine.playSFX("hit");

					// Impact particles
					const particleCount = 5;
					for (let j = 0; j < particleCount; j++) {
						const particleId = `blood-${Math.random()}`;
						setParticles((prev) => [
							...prev,
							{
								id: particleId,
								position: projectile.position.clone(),
								velocity: new THREE.Vector3(
									(Math.random() - 0.5) * 5,
									Math.random() * 5,
									(Math.random() - 0.5) * 5,
								),
								lifetime: 0.5 + Math.random() * 0.5,
								type: "blood",
							},
						]);
					}

					// Trigger death logic if needed
					if (enemy.hp <= 0) {
						handleEnemyDeath(enemy.id);
					}
					break;
				}
			}
		}

		// Update state for animation props
		const velocity = moveVec.length();
		setIsPlayerMoving(velocity > 0.01);
		setPlayerVelocity(velocity);
		setPlayerRot(playerRef.current.rotation.y);
		playerPos.copy(playerRef.current.position);

		// Camera follow logic
		const targetDist = isZoomed ? GAME_CONFIG.CAMERA_DISTANCE_ZOOM : GAME_CONFIG.CAMERA_DISTANCE;
		const cameraOffset = new THREE.Vector3(0, GAME_CONFIG.CAMERA_HEIGHT, targetDist).applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			playerRef.current.rotation.y,
		);

		const targetCameraPos = playerRef.current.position.clone().add(cameraOffset);
		state.camera.position.lerp(targetCameraPos, 0.1);
		state.camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 2, 0)));
	});

	// Spawn initial enemies
	const spawnEnemies = useCallback(() => {
		const newEnemies: EnemyData[] = [];
		for (let i = 0; i < level.enemies; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = randomRange(50, 80);
			const isHeavy = Math.random() > 0.8;

			newEnemies.push({
				id: `enemy-${crypto.randomUUID()}`,
				position: new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist),
				hp: isHeavy ? 8 : 3,
				maxHp: isHeavy ? 8 : 3,
				isHeavy,
			});
		}
		setEnemies(newEnemies);
	}, [level.enemies]);

	// Spawn enemies on mount
	useEffect(() => {
		spawnEnemies();
	}, [spawnEnemies]);

	// Handle enemy death
	const handleEnemyDeath = useCallback(
		(id: string) => {
			setEnemies((prev) => prev.filter((e) => e.id !== id));
			addKill();
		},
		[addKill],
	);

	// Handle particle expiration
	const handleParticleExpire = useCallback((id: string) => {
		setParticles((prev) => prev.filter((p) => p.id !== id));
	}, []);

	// Game update loop
	const handleUpdate = useCallback((_delta: number, _elapsed: number) => {
		// Update game logic here
	}, []);

	return (
		<Canvas shadows camera={{ position: [0, 12, 20], fov: 60 }} gl={{ antialias: true }}>
			{/* Lighting */}
			<ambientLight intensity={0.4} />
			<directionalLight
				position={[50, 50, 25]}
				intensity={1}
				castShadow
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-camera-far={200}
				shadow-camera-left={-50}
				shadow-camera-right={50}
				shadow-camera-top={50}
				shadow-camera-bottom={-50}
			/>

			{/* Sky */}
			<Sky
				sunPosition={[100, 20, 100]}
				turbidity={8}
				rayleigh={6}
				mieCoefficient={0.005}
				mieDirectionalG={0.8}
			/>

			<fog attach="fog" args={[level.fog, 50, 150]} />
			<color attach="background" args={[level.sky]} />

			{/* Environment */}
			<Environment preset="sunset" />

			{/* Ground */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
				<planeGeometry args={[200, 200, 50, 50]} />
				<meshStandardMaterial color="#2d5016" roughness={0.8} />
			</mesh>

			{/* Water plane with custom shader */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
				<planeGeometry args={[200, 200, 50, 50]} />
				<shaderMaterial
					vertexShader={WATER_VERT}
					fragmentShader={WATER_FRAG}
					uniforms={waterUniforms.current}
					transparent
					opacity={0.7}
				/>
			</mesh>

			{/* Environment decoration */}
			<Flag position={[5, 0, 5]} />
			<Flag position={[-10, 0, -15]} />
			<Reeds count={60} />
			<Lilypads count={30} />

			{/* Player */}
			<PlayerRig
				ref={playerRef}
				position={[playerPos.x, playerPos.y, playerPos.z]}
				rotation={playerRot}
				isMoving={isPlayerMoving}
				velocity={playerVelocity}
			/>

			{/* Enemies */}
			{enemies.map((enemy) => (
				<Enemy key={enemy.id} data={enemy} targetPosition={playerPos} onDeath={handleEnemyDeath} />
			))}

			{/* Projectiles */}
			<Projectiles ref={projectilesRef} />

			{/* Particles */}
			<Particles particles={particles} onExpire={handleParticleExpire} />

			{/* Game Loop */}
			<GameLoop onUpdate={handleUpdate} />

			{/* Post-processing */}
			<EffectComposer>
				<Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} />
				<Noise opacity={0.02} />
				<Vignette eskil={false} offset={0.1} darkness={1.1} />
			</EffectComposer>
		</Canvas>
	);
}
