import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { audioEngine } from "../../../Core/AudioEngine";
import { inputSystem } from "../../../Core/InputSystem";
import type { ProjectilesHandle } from "../../../Entities/Projectiles";
import {
	CHUNK_SIZE,
	type CharacterGear,
	type CharacterTraits,
	type ChunkData,
	useGameStore,
} from "../../../stores/gameStore";
import { GAME_CONFIG } from "../../../utils/constants";

export function GameLogic({
	playerRef,
	projectilesRef,
	setPlayerVelY,
	setIsPlayerMoving,
	setActiveChunks,
	activeChunks,
	character,
	handleImpact,
}: {
	playerRef: React.RefObject<THREE.Group | null>;
	projectilesRef: React.RefObject<ProjectilesHandle | null>;
	setPlayerVelY: (val: number) => void;
	setIsPlayerMoving: (val: boolean) => void;
	setActiveChunks: (chunks: ChunkData[]) => void;
	activeChunks: ChunkData[];
	character: { traits: CharacterTraits; gear: CharacterGear };
	handleImpact: (pos: THREE.Vector3, type: "blood" | "shell") => void;
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
				if (entity.type === "PRISON_CAGE" && dist < 2 && !entity.rescued) {
					entity.rescued = true;
					if (entity.objectiveId) {
						rescueCharacter(entity.objectiveId);
						audioEngine.playSFX("pickup");
					}
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
					.add(new THREE.Vector3(0, 0.45, 0))
					.add(shootDir.clone().multiplyScalar(1.5));
				projectilesRef.current?.spawn(muzzlePos, shootDir);
				audioEngine.playSFX("shoot");
				lastFireTime.current = state.clock.elapsedTime;
				playerRef.current.rotation.y += (Math.random() - 0.5) * 0.05; // NOSONAR: Game visual randomness
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

		const targetDist = isZoomed ? 6 : 12;
		const cameraOffset = new THREE.Vector3(1.5, 4, targetDist).applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			playerRef.current.rotation.y,
		);
		state.camera.position.lerp(playerRef.current.position.clone().add(cameraOffset), 0.08);
		state.camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
	});

	return null;
}
