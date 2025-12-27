/**
 * Entity Archetypes - Barrel Export
 *
 * All entity factory functions consolidated for easy importing.
 * Each archetype file contains focused factory functions for a specific category.
 */

// Player
export { createPlayer, type CreatePlayerOptions } from "./player";

// Enemies
export {
	createGator,
	createScout,
	createSnake,
	createSnapper,
	type CreateGatorOptions,
	type CreateScoutOptions,
	type CreateSnakeOptions,
	type CreateSnapperOptions,
} from "./enemies";

// Projectiles
export { createProjectile, type CreateProjectileOptions } from "./projectiles";

// Objectives
export {
	createExtractionPoint,
	createPrisonCage,
	createSiphon,
	type CreateExtractionPointOptions,
	type CreatePrisonCageOptions,
	type CreateSiphonOptions,
} from "./objectives";

// Environment
export {
	createMudPit,
	createOilSlick,
	createPlatform,
	createToxicSludge,
	type CreateMudPitOptions,
	type CreateOilSlickOptions,
	type CreatePlatformOptions,
	type CreateToxicSludgeOptions,
} from "./environment";

// Interactions
export {
	createRaft,
	createVillager,
	type CreateRaftOptions,
	type CreateVillagerOptions,
} from "./interactions";
