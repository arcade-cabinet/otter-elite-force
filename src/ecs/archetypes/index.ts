/**
 * Entity Archetypes - Barrel Export
 *
 * All entity factory functions consolidated for easy importing.
 * Each archetype file contains focused factory functions for a specific category.
 */

// Enemies
export {
	type CreateGatorOptions,
	type CreateScoutOptions,
	type CreateSnakeOptions,
	type CreateSnapperOptions,
	createGator,
	createScout,
	createSnake,
	createSnapper,
} from "./enemies";
// Environment
export {
	type CreateMudPitOptions,
	type CreateOilSlickOptions,
	type CreatePlatformOptions,
	type CreateToxicSludgeOptions,
	createMudPit,
	createOilSlick,
	createPlatform,
	createToxicSludge,
} from "./environment";
// Interactions
export {
	type CreateRaftOptions,
	type CreateVillagerOptions,
	createRaft,
	createVillager,
} from "./interactions";

// Objectives
export {
	type CreateExtractionPointOptions,
	type CreatePrisonCageOptions,
	type CreateSiphonOptions,
	createExtractionPoint,
	createPrisonCage,
	createSiphon,
} from "./objectives";
// Player
export { type CreatePlayerOptions, createPlayer } from "./player";
// Projectiles
export { type CreateProjectileOptions, createProjectile } from "./projectiles";
