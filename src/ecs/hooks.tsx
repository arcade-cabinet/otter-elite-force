/**
 * ECS React Hooks
 *
 * Integration layer between Miniplex ECS and Babylon.js via Reactylon.
 * Provides hooks for querying entities and syncing with React components.
 */

import { Vector3 } from "@babylonjs/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
import {
	createExtractionPoint,
	createGator,
	createMudPit,
	createOilSlick,
	createPlatform,
	createPlayer,
	createPrisonCage,
	createRaft,
	createScout,
	createSiphon,
	createSnake,
	createSnapper,
	createToxicSludge,
	createVillager,
} from "./archetypes";
import {
	applyFriction,
	cleanupDead,
	updateAI,
	updateHealthRegen,
	updateMovement,
	updateProjectileCollisions,
	updateSteering,
	updateSuppression,
} from "./systems";
import type { Entity } from "./world";
import {
	damageables,
	enemies,
	hazards,
	interactables,
	objectives,
	players,
	projectiles,
	renderables,
	world,
} from "./world";

// =============================================================================
// ENTITY QUERY HOOKS
// =============================================================================

/**
 * Simple hook to get entities from a Miniplex query/archetype
 * Re-renders when the archetype changes
 */
function useArchetype<T extends Entity>(archetype: Iterable<T>): T[] {
	const [, forceUpdate] = useState(0);

	// Force re-render periodically to pick up entity changes
	// In production, you'd use Miniplex's event system
	useEffect(() => {
		const interval = setInterval(() => forceUpdate((n) => n + 1), 100);
		return () => clearInterval(interval);
	}, []);

	return [...archetype];
}

/**
 * Hook to get all player entities
 */
export const usePlayers = () => useArchetype(players);

/**
 * Hook to get all enemy entities
 */
export const useEnemies = () => useArchetype(enemies);

/**
 * Hook to get all projectile entities
 */
export const useProjectiles = () => useArchetype(projectiles);

/**
 * Hook to get all objective entities
 */
export const useObjectives = () => useArchetype(objectives);

/**
 * Hook to get all hazard entities
 */
export const useHazards = () => useArchetype(hazards);

/**
 * Hook to get all interactable entities
 */
export const useInteractables = () => useArchetype(interactables);

/**
 * Hook to get all renderable entities
 */
export const useRenderables = () => useArchetype(renderables);

/**
 * Hook to get all damageable entities
 */
export const useDamageables = () => useArchetype(damageables);

// =============================================================================
// GAME LOOP HOOK
// =============================================================================

/**
 * Main ECS game loop hook - updates all systems each frame
 * Uses Babylon.js scene.onBeforeRenderObservable instead of useFrame
 */
export const useECSGameLoop = (isPaused: boolean = false) => {
	const scene = useScene();
	const isPausedRef = useRef(isPaused);
	isPausedRef.current = isPaused;

	useEffect(() => {
		if (!scene) return;

		let lastTime = performance.now();

		const observer = scene.onBeforeRenderObservable.add(() => {
			if (isPausedRef.current) return;

			const now = performance.now();
			const rawDelta = (now - lastTime) / 1000;
			lastTime = now;

			// Clamp delta to prevent physics explosions
			const clampedDelta = Math.min(rawDelta, 0.1);

			// Update AI (decision making)
			updateAI(clampedDelta);

			// Update steering behaviors (Yuka)
			updateSteering(clampedDelta);

			// Update movement
			updateMovement(clampedDelta);

			// Apply friction
			applyFriction(clampedDelta);

			// Update combat
			updateProjectileCollisions();
			updateSuppression(clampedDelta);
			updateHealthRegen(clampedDelta);

			// Cleanup dead entities
			cleanupDead();
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene]);
};

// =============================================================================
// ENTITY SPAWNING HOOKS
// =============================================================================

/**
 * Hook to spawn entities from chunk data
 */
export const useChunkEntitySpawner = () => {
	const spawnEntitiesForChunk = useCallback(
		(
			chunkId: string,
			entities: Array<{
				id: string;
				type: string;
				position: [number, number, number];
				isHeavy?: boolean;
				objectiveId?: string;
			}>,
		) => {
			const spawnedEntities: Entity[] = [];

			for (const entityData of entities) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const position = new Vector3(...entityData.position) as any;

				let entity: Entity | null = null;

				switch (entityData.type) {
					case "GATOR":
						entity = createGator({
							position,
							isHeavy: entityData.isHeavy ?? false,
							chunkId,
						});
						break;

					case "SNAKE":
						entity = createSnake({
							position,
							anchorHeight: position.y + 5,
							chunkId,
						});
						break;

					case "SNAPPER":
						entity = createSnapper({
							position,
							chunkId,
						});
						break;

					case "SCOUT":
						entity = createScout({
							position,
							chunkId,
						});
						break;

					case "SIPHON":
						entity = createSiphon({
							position,
							chunkId,
						});
						break;

					case "PRISON_CAGE":
						entity = createPrisonCage({
							position,
							characterId: entityData.objectiveId ?? "unknown",
							chunkId,
						});
						break;

					case "OIL_SLICK":
						entity = createOilSlick({
							position,
							chunkId,
						});
						break;

					case "MUD_PIT":
						entity = createMudPit({
							position,
							chunkId,
						});
						break;

					case "TOXIC_SLUDGE":
						entity = createToxicSludge({
							position,
							chunkId,
						});
						break;

					case "VILLAGER":
						entity = createVillager({
							position,
							type: "civilian",
							chunkId,
						});
						break;

					case "HEALER":
						entity = createVillager({
							position,
							type: "healer",
							chunkId,
						});
						break;

					case "EXTRACTION_POINT":
						entity = createExtractionPoint({
							position,
							chunkId,
						});
						break;

					case "RAFT":
						entity = createRaft({
							position,
							chunkId,
						});
						break;

					case "PLATFORM":
						entity = createPlatform({
							position,
							chunkId,
						});
						break;

					default:
						console.warn(`Unknown entity type: ${entityData.type}`);
				}

				if (entity) {
					spawnedEntities.push(entity);
				}
			}

			return spawnedEntities;
		},
		[],
	);

	const despawnChunkEntities = useCallback((chunkId: string) => {
		const entitiesToRemove = world.entities.filter((e) => e.chunkReference?.chunkId === chunkId);
		for (const entity of entitiesToRemove) {
			world.remove(entity);
		}
	}, []);

	return { spawnEntitiesForChunk, despawnChunkEntities };
};

// =============================================================================
// PLAYER HOOKS
// =============================================================================

/**
 * Hook to spawn and manage the player entity
 */
export const usePlayerEntity = (characterConfig: {
	id: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
	headgear: "bandana" | "beret" | "helmet" | "none";
	vest: "tactical" | "heavy" | "none";
	backgear: "radio" | "scuba" | "none";
	weaponId: string;
}) => {
	// Create player entity on mount
	useEffect(() => {
		// Check if player already exists
		const existingPlayer = [...players][0];
		if (existingPlayer) return;

		createPlayer({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			position: new Vector3(0, 0, 0) as any,
			characterId: characterConfig.id,
			...characterConfig,
		});

		return () => {
			// Remove player on unmount
			const player = [...players][0];
			if (player) {
				world.remove(player);
			}
		};
	}, [characterConfig]);

	// Return the player entity
	const playerEntities = usePlayers();
	return playerEntities[0] ?? null;
};

// =============================================================================
// ENTITY SYNC HOOKS
// =============================================================================

/**
 * Hook to sync an ECS entity's transform with a Babylon.js TransformNode
 * Uses scene.onBeforeRenderObservable instead of useFrame
 */
export const useSyncTransform = (
	entity: Entity | null,
	nodeRef: React.RefObject<{
		position: Vector3;
		rotation: { x: number; y: number; z: number };
		scaling: Vector3;
	} | null>,
) => {
	const scene = useScene();
	const entityRef = useRef(entity);
	entityRef.current = entity;

	useEffect(() => {
		if (!scene) return;

		const observer = scene.onBeforeRenderObservable.add(() => {
			const ent = entityRef.current;
			if (!ent?.transform || !nodeRef.current) return;

			nodeRef.current.position.copyFrom(ent.transform.position as unknown as Vector3);
			nodeRef.current.scaling.copyFrom(ent.transform.scale as unknown as Vector3);
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene, nodeRef]);
};

/**
 * Hook to sync player input to entity velocity
 * Uses scene.onBeforeRenderObservable instead of useFrame
 */
export const usePlayerInput = (entity: Entity | null, input: { x: number; y: number }) => {
	const scene = useScene();
	const entityRef = useRef(entity);
	const inputRef = useRef(input);
	entityRef.current = entity;
	inputRef.current = input;

	useEffect(() => {
		if (!scene) return;

		const observer = scene.onBeforeRenderObservable.add(() => {
			const ent = entityRef.current;
			if (!ent?.velocity || !ent?.characterStats) return;

			const speed = ent.characterStats.baseSpeed;
			ent.velocity.linear.x = inputRef.current.x * speed;
			ent.velocity.linear.z = inputRef.current.y * speed;
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene]);
};
