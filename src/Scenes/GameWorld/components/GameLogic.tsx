import type { TransformNode } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
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
	playerRef: React.RefObject<TransformNode | null>;
	projectilesRef: React.RefObject<ProjectilesHandle | null>;
	setPlayerVelY: (val: number) => void;
	setIsPlayerMoving: (val: boolean) => void;
	setActiveChunks: (chunks: ChunkData[]) => void;
	activeChunks: ChunkData[];
	character: { traits: CharacterTraits; gear: CharacterGear };
	handleImpact: (pos: Vector3, type: "blood" | "shell") => void;
}) {
	const scene = useScene();
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
		removeComponent,
	} = useGameStore();

	const [playerVelY, setPlayerVelYLocal] = useState(0);
	const [isGrounded, setIsGrounded] = useState(true);
	const lastFireTime = useRef(0);
	// Smart auto-aim: tracks nearest enemy for combat stance logic
	// Prefixed with _ because getter is unused (reserved for future UI: reticle, damage indicators)
	const [_currentTarget, setCurrentTarget] = useState<Vector3 | null>(null);

	// Reusable vectors to avoid garbage collection in the render loop
	const vecCache = useRef({
		camDir: new Vector3(),
		camSide: new Vector3(),
		up: new Vector3(0, 1, 0),
		moveVec: new Vector3(),
		worldPos: new Vector3(),
		shootDir: new Vector3(),
		muzzlePos: new Vector3(),
		offset: new Vector3(),
	}).current;

	// Keep mutable refs for state values used inside observer (avoid stale closures)
	const playerVelYRef = useRef(playerVelY);
	playerVelYRef.current = playerVelY;
	const isGroundedRef = useRef(isGrounded);
	isGroundedRef.current = isGrounded;
	const activeChunksRef = useRef(activeChunks);
	activeChunksRef.current = activeChunks;
	const isCarryingClamRef = useRef(isCarryingClam);
	isCarryingClamRef.current = isCarryingClam;
	const isPilotingRaftRef = useRef(isPilotingRaft);
	isPilotingRaftRef.current = isPilotingRaft;
	const isZoomedRef = useRef(isZoomed);
	isZoomedRef.current = isZoomed;

	const lastTimeRef = useRef(performance.now());
	const elapsedRef = useRef(0);

	useEffect(() => {
		if (!scene) return;

		const observer = scene.onBeforeRenderObservable.add(() => {
			if (!playerRef.current) return;

			const now = performance.now();
			const rawDelta = (now - lastTimeRef.current) / 1000;
			lastTimeRef.current = now;
			const delta = Math.min(rawDelta, 0.1);
			elapsedRef.current += delta;

			const px = playerRef.current.position.x;
			const pz = playerRef.current.position.z;
			const cx = Math.floor(px / CHUNK_SIZE);
			const cz = Math.floor(pz / CHUNK_SIZE);
			const nearby = getNearbyChunks(cx, cz);
			const chunks = activeChunksRef.current;
			if (nearby.length !== chunks.length || nearby[0]?.id !== chunks[0]?.id)
				setActiveChunks(nearby);

			const input = inputSystem.getState();

			const { camDir, camSide, up, moveVec, worldPos, shootDir, muzzlePos, offset } = vecCache;

			// Derive camera-relative directions from player facing (no camera object in BJS component)
			camDir.set(Math.sin(playerRef.current.rotation.y), 0, Math.cos(playerRef.current.rotation.y));
			camDir.normalize();
			Vector3.CrossToRef(camDir, up, camSide);

			moveVec.set(0, 0, 0);
			if (Math.abs(input.move.y) > 0.1) {
				offset.copyFrom(camDir).scaleInPlace(-input.move.y);
				moveVec.addInPlace(offset);
			}
			if (Math.abs(input.move.x) > 0.1) {
				offset.copyFrom(camSide).scaleInPlace(input.move.x);
				moveVec.addInPlace(offset);
			}

			const isAiming = input.look.active;

			// === SMART AUTO-AIM ===
			let nearestEnemy: Vector3 | null = null;
			let minDist = 40;
			if (isAiming) {
				activeChunksRef.current.forEach((chunk) => {
					chunk.entities.forEach((entity) => {
						if (["GATOR", "SNAKE", "SNAPPER"].includes(entity.type)) {
							worldPos.set(
								chunk.x * CHUNK_SIZE + entity.position[0],
								entity.position[1],
								chunk.z * CHUNK_SIZE + entity.position[2],
							);
							const dist = Vector3.Distance(playerRef.current!.position, worldPos);
							if (dist < minDist) {
								minDist = dist;
								nearestEnemy = worldPos.clone();
							}
						}
					});
				});
			}
			setCurrentTarget(nearestEnemy);

			// === COMBAT STANCE SYSTEM ===
			const hasTarget = nearestEnemy !== null && isAiming;
			const currentIsCarryingClam = isCarryingClamRef.current;
			const currentIsPilotingRaft = isPilotingRaftRef.current;
			let moveSpeed = hasTarget ? 6 : character.traits.baseSpeed;

			if (currentIsCarryingClam) moveSpeed *= 0.7;
			if (currentIsPilotingRaft) moveSpeed *= 2.0;
			if (saveData.isFallTriggered) moveSpeed *= 0.5;

			// Base damage logic during The Fall
			if (
				saveData.isFallTriggered &&
				Math.random() < delta * 0.05 && // NOSONAR: Game visual randomness
				saveData.baseComponents.length > 0
			) {
				const randomIndex = Math.floor(Math.random() * saveData.baseComponents.length); // NOSONAR: Visual randomness
				const componentToDestroy = saveData.baseComponents[randomIndex];
				removeComponent(componentToDestroy.id);
				audioEngine.playSFX("explode");
			}

			let newVelY = playerVelYRef.current;
			if (!isGroundedRef.current) newVelY -= 30 * delta;
			if (input.jump && isGroundedRef.current) {
				if (currentIsPilotingRaft) {
					setPilotingRaft(false);
					newVelY = 8;
				} else {
					newVelY = 12;
				}
				setIsGrounded(false);
				isGroundedRef.current = false;
				audioEngine.playSFX("pickup");
			}
			playerRef.current.position.y += newVelY * delta;
			if (playerRef.current.position.y <= 0) {
				playerRef.current.position.y = 0;
				newVelY = 0;
				setIsGrounded(true);
				isGroundedRef.current = true;
			}

			activeChunksRef.current.forEach((chunk) => {
				chunk.entities.forEach((entity) => {
					worldPos.set(
						chunk.x * CHUNK_SIZE + entity.position[0],
						entity.position[1],
						chunk.z * CHUNK_SIZE + entity.position[2],
					);

					const dist = Vector3.Distance(playerRef.current!.position, worldPos);

					// Predator contact damage to player
					if (["GATOR", "SNAKE", "SNAPPER"].includes(entity.type) && dist < 2.5) {
						const baseDamage =
							entity.type === "SNAPPER" ? 1.5 : entity.type === "GATOR" ? 1.0 : 0.5;
						takeDamage(baseDamage * delta * 15, {
							x: playerRef.current!.position.x - worldPos.x,
							y: playerRef.current!.position.z - worldPos.z,
						});
					}

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
							isGroundedRef.current = true;
						}
					}
					if (entity.type === "CLAM_BASKET" && dist < 2 && !entity.interacted) {
						entity.interacted = true;
						if (entity.isHeavy) {
							takeDamage(30);
							audioEngine.playSFX("explode");
							handleImpact(worldPos.clone(), "shell");
						} else {
							addCoins(100);
							collectSpoils("credit");
							audioEngine.playSFX("pickup");
						}
					}
					if (entity.type === "EXTRACTION_POINT" && dist < 3) {
						const isLZ = chunk.x === 0 && chunk.z === 0;
						const canExtract = saveData.difficultyMode === "SUPPORT" || isLZ;

						if (canExtract) {
							if (!saveData.isLZSecured && isLZ) {
								secureLZ();
								audioEngine.playSFX("pickup");
							} else if (currentIsCarryingClam) {
								setCarryingClam(false);
								addCoins(500);
								collectSpoils("clam");
							}

							if (saveData.isFallTriggered && isLZ) {
								useGameStore.getState().setFallTriggered(false);
								useGameStore.getState().heal(50);
								audioEngine.playSFX("pickup");
							}
						}
					}
					if (entity.type === "PRISON_CAGE" && dist < 2 && !entity.rescued) {
						entity.rescued = true;
						if (entity.objectiveId) {
							rescueCharacter(entity.objectiveId);
							audioEngine.playSFX("pickup");
						}
					}
					if (entity.type === "RAFT" && dist < 2 && !currentIsPilotingRaft) {
						setPilotingRaft(true, entity.id);
						audioEngine.playSFX("pickup");
					}
				});
			});

			const moveLenSq = moveVec.lengthSquared();

			if (isAiming) {
				const rotSpeed = hasTarget ? 15 : 10;
				playerRef.current.rotation.y -= input.look.x * rotSpeed * delta;
				if (moveLenSq > 0.01)
					playerRef.current.position.addInPlace(
						moveVec.normalize().scaleInPlace(moveSpeed * delta),
					);
				const elapsed = elapsedRef.current;
				if (elapsed - lastFireTime.current > GAME_CONFIG.FIRE_RATE) {
					// Compute shoot direction from player rotation
					shootDir.set(
						Math.sin(playerRef.current.rotation.y),
						0,
						Math.cos(playerRef.current.rotation.y),
					);

					muzzlePos
						.copyFrom(playerRef.current.position)
						.addInPlace(new Vector3(0, 0.45, 0))
						.addInPlace(shootDir.scale(1.5));

					projectilesRef.current?.spawn(muzzlePos, shootDir);
					audioEngine.playSFX("shoot");
					lastFireTime.current = elapsed;
					const swayMultiplier = saveData.isFallTriggered ? 3.0 : 1.0;
					playerRef.current.rotation.y += (Math.random() - 0.5) * 0.05 * swayMultiplier; // NOSONAR: Game visual randomness
				}
			} else if (moveLenSq > 0.01) {
				const targetAngle = Math.atan2(moveVec.x, moveVec.z);
				let diff = targetAngle - playerRef.current.rotation.y;
				diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
				playerRef.current.rotation.y += diff * 5 * delta;
				playerRef.current.position.addInPlace(moveVec.normalize().scaleInPlace(moveSpeed * delta));
			}

			setPlayerVelYLocal(newVelY);
			playerVelYRef.current = newVelY;
			setPlayerVelY(newVelY);
			setIsPlayerMoving(moveLenSq > 0.01);
			setPlayerPos([
				playerRef.current.position.x,
				playerRef.current.position.y,
				playerRef.current.position.z,
			]);

			// Camera follow: position camera behind and above player
			const targetDist = isZoomedRef.current ? 6 : 12;
			const camOffsetAngle = playerRef.current.rotation.y;
			const camX = playerRef.current.position.x + Math.sin(camOffsetAngle) * targetDist + 1.5;
			const camY = playerRef.current.position.y + 4;
			const camZ = playerRef.current.position.z + Math.cos(camOffsetAngle) * targetDist;

			// Update camera via scene's active camera if it supports setTarget
			const cam = scene?.activeCamera as {
				position?: Vector3;
				setTarget?: (v: Vector3) => void;
			} | null;
			if (cam?.position) {
				cam.position.x += (camX - cam.position.x) * 0.08;
				cam.position.y += (camY - cam.position.y) * 0.08;
				cam.position.z += (camZ - cam.position.z) * 0.08;
				cam.setTarget?.(
					new Vector3(
						playerRef.current.position.x,
						playerRef.current.position.y + 0.8,
						playerRef.current.position.z,
					),
				);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [
		scene,
		character,
		saveData,
		setActiveChunks,
		setPlayerVelY,
		setIsPlayerMoving,
		getNearbyChunks,
		setPlayerPos,
		setCarryingClam,
		addCoins,
		setPilotingRaft,
		rescueCharacter,
		collectSpoils,
		takeDamage,
		secureLZ,
		removeComponent,
		handleImpact,
		playerRef,
		projectilesRef,
		vecCache,
	]);

	return null;
}
