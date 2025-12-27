/**
 * ECS-Assembly Integration Bridge
 *
 * Connects the procedural assembly system with the ECS:
 * 1. Creates ECS entities from assembled structures
 * 2. Creates ECS entities from settlements
 * 3. Syncs component library meshes with ECS renderables
 */

import * as THREE from "three";
import {
	assembleHut,
	assemblePlatform,
	assembleSettlement,
	assembleWatchtower,
	type Faction,
	instantiateMesh,
	type MeshId,
	type Settlement,
	type SettlementType,
	type StructureTemplate,
} from "../../systems/assembly";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// STRUCTURE -> ECS ENTITY
// =============================================================================

/**
 * Creates an ECS entity from an assembled structure
 */
export function createStructureEntity(
	template: StructureTemplate,
	position: THREE.Vector3,
	rotation: number,
	faction: Faction,
): Entity {
	const destructibleComponents = template.components.filter((c) => c.isDestructible);
	const hasLadder = template.components.some((c) => c.type === "LADDER");

	const entity: Entity = {
		id: generateId(),

		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(0, rotation, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		// Structure-specific components
		structure: {
			archetype: template.archetype,
			componentCount: template.components.length,
			footprint: template.footprint,
			height: template.height,
		},

		// Destructible if any component is destructible
		destructible:
			destructibleComponents.length > 0
				? {
						hp: destructibleComponents.length * 20,
						maxHp: destructibleComponents.length * 20,
						isDestroyed: false,
						debrisType: "WOOD",
					}
				: undefined,

		// Interaction points
		interactable:
			template.interactionPoints.length > 0
				? {
						type: "use",
						range: template.interactionPoints[0].radius,
						promptText: "Enter",
						isInteracting: false,
						cooldown: 0,
					}
				: undefined,

		// Climbable if has ladder
		climbable: hasLadder
			? {
					climbSpeed: 3,
					height: template.height,
					topPosition: position.clone().setY(position.y + template.height),
				}
			: undefined,

		// Renderable
		renderable: {
			type: "STRUCTURE",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		// Tags
		isStructure: { __tag: "IsStructure" },
	};

	// Add faction-specific tags
	if (faction === "URA") {
		entity.isPlayerOwned = { __tag: "IsPlayerOwned" };
	} else if (faction === "SCALE_GUARD") {
		entity.isEnemyOwned = { __tag: "IsEnemyOwned" };
	}

	world.add(entity);
	return entity;
}

// =============================================================================
// SETTLEMENT -> ECS ENTITIES
// =============================================================================

/**
 * Creates ECS entities for an entire settlement
 */
export function createSettlementEntities(settlement: Settlement): {
	structureEntities: Entity[];
	inhabitantEntities: Entity[];
	pathEntities: Entity[];
} {
	const structureEntities: Entity[] = [];
	const inhabitantEntities: Entity[] = [];
	const pathEntities: Entity[] = [];

	// Create structure entities
	for (const structure of settlement.structures) {
		const entity = createStructureEntity(
			structure.template,
			structure.worldPosition,
			structure.worldRotation,
			structure.faction,
		);
		structureEntities.push(entity);
	}

	// Create inhabitant entities
	for (const inhabitant of settlement.inhabitants) {
		const entity = createInhabitantEntity(inhabitant);
		inhabitantEntities.push(entity);
	}

	// Create path entities (for visual rendering)
	for (const path of settlement.paths) {
		const entity = createPathEntity(path);
		pathEntities.push(entity);
	}

	return { structureEntities, inhabitantEntities, pathEntities };
}

/**
 * Creates an inhabitant ECS entity
 */
function createInhabitantEntity(inhabitant: Settlement["inhabitants"][0]): Entity {
	const entity: Entity = {
		id: generateId(),

		transform: {
			position: inhabitant.position.clone(),
			rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		health: {
			current: inhabitant.type === "GUARD" ? 30 : 10,
			max: inhabitant.type === "GUARD" ? 30 : 10,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		renderable: {
			type: "VILLAGER",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},
	};

	// Add type-specific components
	switch (inhabitant.type) {
		case "VILLAGER":
			entity.villager = {
				type: "civilian",
				dialogueId: "villager_greeting",
				isLiberated: false,
			};
			entity.isNeutral = { __tag: "IsNeutral" };
			break;

		case "HEALER":
			entity.villager = {
				type: "healer",
				dialogueId: "healer_greeting",
				isLiberated: false,
				healAmount: 25,
			};
			entity.healer = {
				healRate: 5,
				healRadius: 3,
				isHealing: false,
			};
			entity.isNeutral = { __tag: "IsNeutral" };
			break;

		case "GUARD":
			entity.aiBrain = {
				currentState: "patrol",
				previousState: "idle",
				stateTime: 0,
				alertLevel: 0,
				homePosition: inhabitant.position.clone(),
				lastKnownPlayerPos: null,
				patrolRadius: 10,
			};
			entity.snapper = {
				turretRotation: 0,
				turretTargetRotation: 0,
				isOverheated: false,
				heatLevel: 0,
			};
			entity.isEnemy = { __tag: "IsEnemy" };
			break;

		case "PRISONER":
			entity.rescuable = {
				characterId: "unknown",
				isRescued: false,
				dialogueId: "prisoner_help",
			};
			entity.isPlayer = { __tag: "IsPlayer" }; // Prisoners are URA faction
			break;
	}

	world.add(entity);
	return entity;
}

/**
 * Creates a path ECS entity for visual rendering
 */
function createPathEntity(path: Settlement["paths"][0]): Entity {
	const midpoint = path.start.clone().add(path.end).multiplyScalar(0.5);
	const direction = path.end.clone().sub(path.start);
	const length = direction.length();
	const angle = Math.atan2(direction.x, direction.z);

	const entity: Entity = {
		id: generateId(),

		transform: {
			position: midpoint,
			rotation: new THREE.Euler(0, angle, 0),
			scale: new THREE.Vector3(path.width, 0.1, length),
		},

		path: {
			start: path.start.clone(),
			end: path.end.clone(),
			width: path.width,
			style: path.style,
		},

		renderable: {
			type: "ENVIRONMENT",
			visible: true,
			castShadow: false,
			receiveShadow: true,
		},
	};

	world.add(entity);
	return entity;
}

// =============================================================================
// QUICK SPAWN HELPERS
// =============================================================================

/**
 * Spawns a complete settlement at a position
 */
export function spawnSettlement(
	seed: number,
	type: SettlementType,
	center: THREE.Vector3,
	faction: Faction,
): {
	settlement: Settlement;
	entities: ReturnType<typeof createSettlementEntities>;
} {
	const settlement = assembleSettlement(seed, type, center, faction);
	const entities = createSettlementEntities(settlement);
	return { settlement, entities };
}

/**
 * Spawns a single hut at a position
 */
export function spawnHut(
	seed: number,
	position: THREE.Vector3,
	rotation: number,
	faction: Faction,
	variant: "BASIC" | "LONGHOUSE" | "HEALER" = "BASIC",
): Entity {
	const template = assembleHut(seed);
	return createStructureEntity(
		{
			...template,
			archetype:
				variant === "LONGHOUSE" ? "LONGHOUSE" : variant === "HEALER" ? "MEDICAL_POST" : "BASIC_HUT",
		},
		position,
		rotation,
		faction,
	);
}

/**
 * Spawns a watchtower at a position
 */
export function spawnWatchtower(
	seed: number,
	position: THREE.Vector3,
	rotation: number,
	faction: Faction,
): Entity {
	const template = assembleWatchtower(seed);
	return createStructureEntity(template, position, rotation, faction);
}

/**
 * Spawns an elevated platform
 */
export function spawnPlatform(
	seed: number,
	position: THREE.Vector3,
	size: { width: number; depth: number },
	height: number,
	faction: Faction,
): Entity {
	const platform = assemblePlatform(seed, size, height);

	const entity: Entity = {
		id: generateId(),

		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		platform: {
			width: size.width,
			depth: size.depth,
			isMoving: false,
			moveSpeed: 0,
			waypoints: [],
		},

		climbable: platform.hasLadder
			? {
					climbSpeed: 3,
					height,
					topPosition: position.clone().setY(position.y + height),
				}
			: undefined,

		renderable: {
			type: "PLATFORM",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		isStructure: { __tag: "IsStructure" },
	};

	if (faction === "URA") {
		entity.isPlayerOwned = { __tag: "IsPlayerOwned" };
	}

	world.add(entity);
	return entity;
}

// =============================================================================
// MESH INSTANTIATION FOR ECS RENDERERS
// =============================================================================

/**
 * Creates a Three.js mesh for an ECS entity using the component library
 */
export function createMeshForEntity(
	meshId: MeshId,
	faction: Faction,
	materialType: "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY" = "PRIMARY",
): THREE.Mesh {
	return instantiateMesh(meshId, faction, materialType);
}
