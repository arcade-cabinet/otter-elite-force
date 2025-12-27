/**
 * ECS Module - Entity Component System
 *
 * This is the main entry point for the Miniplex ECS architecture.
 * Import everything you need from here.
 */

// Archetypes (factory functions)
export {
	createExtractionPoint,
	createGator,
	createMudPit,
	createOilSlick,
	createPlatform,
	createPlayer,
	createPrisonCage,
	createProjectile,
	createRaft,
	createScout,
	createSiphon,
	createSnake,
	createSnapper,
	createToxicSludge,
	createVillager,
} from "./archetypes";
// Components
export * from "./components";
// React Hooks
export {
	useChunkEntitySpawner,
	useDamageables,
	useECSGameLoop,
	useEnemies,
	useHazards,
	useInteractables,
	useObjectives,
	usePlayerEntity,
	usePlayerInput,
	usePlayers,
	useProjectiles,
	useRenderables,
	useSyncTransform,
} from "./hooks";
// Assembly Integration
export {
	createMeshForEntity,
	createSettlementEntities,
	createStructureEntity,
	spawnHut,
	spawnPlatform,
	spawnSettlement,
	spawnWatchtower,
} from "./integration/assemblyBridge";
// Systems
export {
	applyDamage,
	applyExplosionDamage,
	applyFriction,
	calculateFlankPositions,
	cleanupDead,
	fireWeapon,
	healEntity,
	transitionState,
	updateAI,
	updateHealthRegen,
	updateMovement,
	updateProjectileCollisions,
	updateSteering,
	updateSuppression,
} from "./systems";
// Entity type
export type { Entity } from "./world";
// World and entity management
// Archetypes (entity query shortcuts)
export {
	aiEntities,
	animatedEntities,
	climbables,
	damageables,
	deadEntities,
	destroyEntity,
	enemies,
	enemyStructures,
	gators,
	generateId,
	getEntitiesInRadius,
	getEntityById,
	hazards,
	healers,
	interactables,
	markDead,
	movables,
	objectives,
	packMembers,
	paths,
	platforms,
	playerStructures,
	players,
	poolableEntities,
	projectiles,
	renderables,
	scouts,
	snakes,
	snappers,
	steeringEntities,
	structures,
	temporaryEntities,
	vehicles,
	villagers,
	world,
} from "./world";
