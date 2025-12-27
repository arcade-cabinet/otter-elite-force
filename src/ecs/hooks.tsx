/**
 * ECS React Hooks
 *
 * Integration layer between Miniplex ECS and React Three Fiber.
 * Provides hooks for querying entities and syncing with React components.
 */

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
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
 */
export const useECSGameLoop = (isPaused: boolean = false) => {
	useFrame((_, delta) => {
		if (isPaused) return;

		// Clamp delta to prevent physics explosions
		const clampedDelta = Math.min(delta, 0.1);

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
				const position = new THREE.Vector3(...entityData.position);

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
			position: new THREE.Vector3(0, 0, 0),
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
 * Hook to sync an ECS entity's transform with a Three.js object
 */
export const useSyncTransform = (entity: Entity | null, ref: React.RefObject<THREE.Group>) => {
	useFrame(() => {
		if (!entity?.transform || !ref.current) return;

		ref.current.position.copy(entity.transform.position);
		ref.current.rotation.copy(entity.transform.rotation);
		ref.current.scale.copy(entity.transform.scale);
	});
};

/**
 * Hook to sync player input to entity velocity
 */
export const usePlayerInput = (entity: Entity | null, input: { x: number; y: number }) => {
	useFrame(() => {
		if (!entity?.velocity || !entity?.characterStats) return;

		const speed = entity.characterStats.baseSpeed;
		entity.velocity.linear.x = input.x * speed;
		entity.velocity.linear.z = input.y * speed;
	});
};
