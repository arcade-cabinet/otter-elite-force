/**
 * ECS World - Miniplex Entity World
 *
 * This is the central world that holds all entities.
 * Entities are just bags of components - any combination is valid.
 */

import { World } from "miniplex";
import type * as THREE from "three";
import type * as Components from "./components";

// =============================================================================
// ENTITY TYPE
// =============================================================================

/**
 * Entity type - all components are optional.
 * Entities can have any combination of components.
 */
export interface Entity {
	// Core identity
	id: string;

	// Transform
	transform?: Components.Transform;
	velocity?: Components.Velocity;

	// Physics
	collider?: Components.Collider;
	rigidBody?: Components.RigidBody;

	// Combat
	health?: Components.Health;
	damage?: Components.Damage;
	weapon?: Components.Weapon;
	weaponMeta?: Components.WeaponMeta;
	suppression?: Components.Suppression;

	// AI
	aiBrain?: Components.AIBrain;
	steeringAgent?: Components.SteeringAgent;
	packMember?: Components.PackMember;

	// Character (player/allies)
	characterStats?: Components.CharacterStats;
	characterAppearance?: Components.CharacterAppearance;
	characterGear?: Components.CharacterGear;

	// Enemy specifics
	enemy?: Components.Enemy;
	gator?: Components.Gator;
	snake?: Components.Snake;
	snapper?: Components.Snapper;
	scout?: Components.Scout;

	// Objectives
	objective?: Components.Objective;
	rescuable?: Components.Rescuable;
	destructible?: Components.Destructible;

	// Environment
	hazard?: Components.Hazard;
	oilSlick?: Components.OilSlick;
	climbable?: Components.Climbable;
	platform?: Components.Platform;

	// Interaction
	interactable?: Components.Interactable;
	villager?: Components.Villager;
	vehicle?: Components.VehicleComponent;

	// Visual
	renderable?: Components.Renderable;
	animated?: Components.Animated;
	particleEmitter?: Components.ParticleEmitter;

	// Audio
	audioSource?: Components.AudioSource;

	// Structure (Assembly System)
	structure?: Components.Structure;
	path?: Components.Path;
	healer?: Components.Healer;

	// Equipment (ECS-integrated)
	equipmentMeta?: Components.EquipmentMeta;

	// Tags (marker components)
	isPlayer?: Components.IsPlayer;
	isEnemy?: Components.IsEnemy;
	isProjectile?: Components.IsProjectile;
	isEnvironment?: Components.IsEnvironment;
	isObjective?: Components.IsObjective;
	isInteractable?: Components.IsInteractable;
	isDead?: Components.IsDead;
	isInvulnerable?: Components.IsInvulnerable;
	isStructure?: Components.IsStructure;
	isPlayerOwned?: Components.IsPlayerOwned;
	isEnemyOwned?: Components.IsEnemyOwned;
	isNeutral?: Components.IsNeutral;

	// Utility
	lifetime?: Components.Lifetime;
	poolable?: Components.Poolable;
	chunkReference?: Components.ChunkReference;

	// R3F Integration - reference to the Three.js object
	three?: {
		ref: React.RefObject<THREE.Group>;
		meshRef?: React.RefObject<THREE.Mesh>;
	};
}

// =============================================================================
// WORLD INSTANCE
// =============================================================================

/**
 * The global ECS world instance.
 * All game entities live here.
 */
export const world = new World<Entity>();

// =============================================================================
// ARCHETYPES (Query shortcuts for common entity types)
// =============================================================================

/** All entities with transform and velocity (movable) */
export const movables = world.with("transform", "velocity");

/** All entities with health (damageable) */
export const damageables = world.with("health");

/** All player entities */
export const players = world.with("isPlayer", "transform", "health");

/** All enemy entities */
export const enemies = world.with("isEnemy", "transform", "health", "aiBrain");

/** All Gator enemies */
export const gators = world.with("isEnemy", "gator", "transform");

/** All Snake enemies */
export const snakes = world.with("isEnemy", "snake", "transform");

/** All Snapper enemies */
export const snappers = world.with("isEnemy", "snapper", "transform");

/** All Scout enemies */
export const scouts = world.with("isEnemy", "scout", "transform");

/** All projectiles */
export const projectiles = world.with("isProjectile", "transform", "velocity", "damage");

/** All objectives */
export const objectives = world.with("isObjective", "objective", "transform");

/** All hazards */
export const hazards = world.with("hazard", "transform");

/** All interactables */
export const interactables = world.with("isInteractable", "interactable", "transform");

/** All villagers */
export const villagers = world.with("villager", "transform");

/** All vehicles */
export const vehicles = world.with("vehicle", "transform");

/** All climbables */
export const climbables = world.with("climbable", "transform");

/** All platforms */
export const platforms = world.with("platform", "transform");

/** All structures */
export const structures = world.with("isStructure", "structure", "transform");

/** All player-owned structures */
export const playerStructures = world.with("isPlayerOwned", "structure", "transform");

/** All enemy-owned structures */
export const enemyStructures = world.with("isEnemyOwned", "structure", "transform");

/** All healers */
export const healers = world.with("healer", "transform");

/** All paths */
export const paths = world.with("path", "transform");

/** All entities with AI */
export const aiEntities = world.with("aiBrain", "transform");

/** All entities with steering */
export const steeringEntities = world.with("steeringAgent", "transform", "velocity");

/** All pack members */
export const packMembers = world.with("packMember", "transform");

/** All renderable entities */
export const renderables = world.with("renderable", "transform");

/** All animated entities */
export const animatedEntities = world.with("animated");

/** All dead entities */
export const deadEntities = world.with("isDead");

/** All entities with lifetime (will be destroyed) */
export const temporaryEntities = world.with("lifetime");

/** All poolable entities */
export const poolableEntities = world.with("poolable");

/** All weapon entities */
export const weaponEntities = world.with("weapon", "weaponMeta");

/** All equipment entities */
export const equipmentEntities = world.with("equipmentMeta");

/** All dropped items (weapons/equipment not owned) */
export const droppedItems = world.with("transform", "renderable").without("isPlayer", "isEnemy");

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique entity ID
 */
export const generateId = (): string => {
	return `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get entity by ID
 */
export const getEntityById = (id: string): Entity | undefined => {
	return world.entities.find((e) => e.id === id);
};

/**
 * Destroy an entity and clean up
 */
export const destroyEntity = (entity: Entity): void => {
	world.remove(entity);
};

/**
 * Mark entity as dead (for deferred destruction)
 */
export const markDead = (entity: Entity): void => {
	world.addComponent(entity, "isDead", { __tag: "IsDead" });
};

/**
 * Get all entities in a radius
 */
export const getEntitiesInRadius = (
	position: THREE.Vector3,
	radius: number,
	archetype = renderables,
): Entity[] => {
	return [...archetype].filter((entity) => {
		if (!entity.transform) return false;
		return entity.transform.position.distanceTo(position) <= radius;
	});
};
