/**
 * Save/Load System — Koota world serialization for mid-mission save/load.
 *
 * Serializes all ECS entities, their SoA/AoS trait values, tag traits, and
 * relations into a JSON-safe structure. Non-serializable runtime traits
 * (PhaserSprite, SteeringAgent) are skipped — they are recreated by the
 * syncSystem and movement system on load.
 *
 * Architecture:
 * - Registry-based: explicit list of traits we know how to serialize
 * - Relations stored as { type, targetEntityIndex } referencing the
 *   serialized entity array (not raw Entity IDs, which change on reload)
 * - saveMission/loadMission integrate with the saveRepo persistence layer
 * - CompletedResearch (Set) uses custom serialization (Set → Array → Set)
 *
 * Spec reference: §11 Persistence, §14 Save/Load
 */

import type { Entity, Trait, World } from "koota";
// -- Relations ---
import {
	BelongsToSquad,
	ConstructingAt,
	GarrisonedIn,
	GatheringFrom,
	OwnedBy,
	Targeting,
} from "../ecs/relations";
import { AIState, SteeringAgent } from "../ecs/traits/ai";
// -- SoA traits (snapshot-based, read via .get()) ---
import { Armor, Attack, Health, VisionRadius } from "../ecs/traits/combat";
import { ConstructionProgress, Gatherer, ResourceNode } from "../ecs/traits/economy";
import {
	Faction,
	IsBuilding,
	IsHero,
	IsProjectile,
	IsResource,
	IsSiphon,
	IsVillage,
	Selected,
	UnitType,
} from "../ecs/traits/identity";
import { OrderQueue } from "../ecs/traits/orders";
// -- Non-serializable traits (skipped) ---
import { PhaserSprite } from "../ecs/traits/phaser";
import { FacingDirection, Position, Velocity } from "../ecs/traits/spatial";
import {
	CompletedResearch,
	CurrentMission,
	GameClock,
	GamePhase,
	Objectives,
	PopulationState,
	ResourcePool,
	TerritoryState,
	WeatherCondition,
} from "../ecs/traits/state";
import { Concealed, Crouching, DetectionRadius } from "../ecs/traits/stealth";
import { CanSwim, Submerged } from "../ecs/traits/water";

// ---------------------------------------------------------------------------
// Trait Registry
// ---------------------------------------------------------------------------

/**
 * SoA traits: .get() returns a plain object snapshot. We serialize the snapshot.
 * Map from name -> Trait reference.
 */
const SOA_TRAITS: Record<string, Trait> = {
	Position,
	Velocity,
	FacingDirection,
	Health,
	Attack,
	Armor,
	VisionRadius,
	Faction,
	UnitType,
	Gatherer,
	ResourceNode,
	ConstructionProgress,
	DetectionRadius,
};

/**
 * AoS traits: .get() returns a live reference. We deep-copy the value.
 * Map from name -> Trait reference.
 */
const AOS_TRAITS: Record<string, Trait> = {
	AIState,
	OrderQueue,
};

/**
 * Tag traits: no data, just presence/absence.
 * Map from name -> Trait reference.
 */
const TAG_TRAITS: Record<string, Trait> = {
	IsBuilding,
	IsHero,
	IsProjectile,
	IsResource,
	IsSiphon,
	IsVillage,
	Selected,
	Concealed,
	Crouching,
	CanSwim,
	Submerged,
};

/**
 * Traits to NEVER serialize (runtime-only, recreated on load).
 * Used by serializeWorld to skip traits like PhaserSprite and SteeringAgent.
 */
/**
 * Non-serializable traits (runtime-only, recreated on load):
 * - PhaserSprite — recreated by syncSystem
 * - SteeringAgent — recreated by movement system
 */
void PhaserSprite;
void SteeringAgent;

/**
 * Relations we know how to serialize.
 */
const RELATIONS = {
	Targeting,
	GatheringFrom,
	OwnedBy,
	GarrisonedIn,
	ConstructingAt,
	BelongsToSquad,
} as const;

// ---------------------------------------------------------------------------
// Serialized Data Types
// ---------------------------------------------------------------------------

export interface SerializedEntity {
	/** SoA and AoS trait data, keyed by trait name */
	traits: Record<string, unknown>;
	/** Tag trait names */
	tags: string[];
	/** Relation pairs: type + index into the serialized entity array */
	relations: Array<{
		type: string;
		targetEntityIndex: number;
	}>;
}

export interface SerializedWorld {
	version: 1 | 2;
	singletons?: Record<string, unknown>;
	entities: SerializedEntity[];
}

/** Standard singletons — plain JSON-serializable via cloneSerializable. */
const SINGLETON_TRAITS: Record<string, Trait> = {
	ResourcePool,
	PopulationState,
	GamePhase,
	GameClock,
	CurrentMission,
	Objectives,
	TerritoryState,
	WeatherCondition,
};

function cloneSerializable<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

/**
 * Serialize the entire Koota world into a JSON-safe structure.
 */
export function serializeWorld(world: World): SerializedWorld {
	const singletons: Record<string, unknown> = Object.fromEntries(
		Object.entries(SINGLETON_TRAITS)
			.filter(([, trait]) => world.has(trait))
			.map(([name, trait]) => [name, cloneSerializable(world.get(trait))]),
	);

	// Custom: CompletedResearch uses Set — serialize as array
	if (world.has(CompletedResearch)) {
		const research = world.get(CompletedResearch);
		if (research) {
			singletons.CompletedResearch = { ids: [...research.ids] };
		}
	}

	// Filter out entity 0 (Koota's internal world entity)
	const allEntities = world.entities.filter((e) => e.id() !== 0);

	// Build a map from Entity -> index for relation target resolution
	const entityToIndex = new Map<number, number>();
	for (let i = 0; i < allEntities.length; i++) {
		entityToIndex.set(allEntities[i].id(), i);
	}

	const serializedEntities: SerializedEntity[] = [];

	for (const entity of allEntities) {
		const traits: Record<string, unknown> = {};
		const tags: string[] = [];
		const relations: SerializedEntity["relations"] = [];

		// Serialize SoA traits
		for (const [name, trait] of Object.entries(SOA_TRAITS)) {
			if (entity.has(trait)) {
				const value = entity.get(trait);
				if (value !== undefined) {
					// SoA .get() returns a snapshot — safe to store directly
					traits[name] = { ...value };
				}
			}
		}

		// Serialize AoS traits
		for (const [name, trait] of Object.entries(AOS_TRAITS)) {
			if (entity.has(trait)) {
				const value = entity.get(trait);
				if (value !== undefined) {
					// AoS returns a live reference — deep copy it
					traits[name] = cloneSerializable(value);
				}
			}
		}

		// Serialize tag traits
		for (const [name, trait] of Object.entries(TAG_TRAITS)) {
			if (entity.has(trait)) {
				tags.push(name);
			}
		}

		// Serialize relations
		for (const [name, relation] of Object.entries(RELATIONS)) {
			const targets = entity.targetsFor(relation);
			for (const target of targets) {
				const targetIndex = entityToIndex.get(target.id());
				if (targetIndex !== undefined) {
					relations.push({
						type: name,
						targetEntityIndex: targetIndex,
					});
				}
			}
		}

		serializedEntities.push({ traits, tags, relations });
	}

	return { version: 2, singletons, entities: serializedEntities };
}

// ---------------------------------------------------------------------------
// Deserialize
// ---------------------------------------------------------------------------

/**
 * Recreate all entities from serialized data into the given world.
 * Relations are restored after all entities are spawned.
 */
export function deserializeWorld(world: World, data: SerializedWorld): void {
	if (data.singletons) {
		// Standard singletons
		for (const [name, trait] of Object.entries(SINGLETON_TRAITS)) {
			const singletonData = data.singletons[name];
			if (singletonData === undefined) continue;
			if (!world.has(trait)) {
				world.add(trait);
			}
			world.set(trait, cloneSerializable(singletonData));
		}

		// Custom: CompletedResearch — array back to Set
		const researchData = data.singletons.CompletedResearch as
			| { ids: string[] }
			| undefined;
		if (researchData) {
			if (!world.has(CompletedResearch)) {
				world.add(CompletedResearch);
			}
			const research = world.get(CompletedResearch);
			if (research) {
				research.ids.clear();
				for (const id of researchData.ids) {
					research.ids.add(id);
				}
			}
		}
	}

	const spawnedEntities: Entity[] = [];

	// Phase 1: Spawn entities with traits (no relations yet)
	for (const entityData of data.entities) {
		const traitArgs: Array<Trait | [Trait, unknown]> = [];

		// Restore SoA traits
		for (const [name, trait] of Object.entries(SOA_TRAITS)) {
			if (name in entityData.traits) {
				traitArgs.push(trait(entityData.traits[name]));
			}
		}

		// Restore tag traits
		for (const [name, trait] of Object.entries(TAG_TRAITS)) {
			if (entityData.tags.includes(name)) {
				traitArgs.push(trait);
			}
		}

		// Restore AoS traits — spawn first, then set value
		const aosToRestore: Array<{ name: string; trait: Trait; value: unknown }> = [];
		for (const [name, trait] of Object.entries(AOS_TRAITS)) {
			if (name in entityData.traits) {
				traitArgs.push(trait);
				aosToRestore.push({ name, trait, value: entityData.traits[name] });
			}
		}

		const entity = world.spawn(...traitArgs);

		// Phase 1b: Restore AoS trait values via direct mutation
		for (const { name, trait, value } of aosToRestore) {
			if (name === "OrderQueue") {
				// OrderQueue is trait(() => []) — get the live array and populate it
				const queue = entity.get(trait);
				if (Array.isArray(queue) && Array.isArray(value)) {
					queue.push(...value);
				}
			} else if (name === "AIState") {
				// AIState is trait(() => ({...})) — use .set() to be safe
				entity.set(trait, value as Record<string, unknown>);
			}
		}

		spawnedEntities.push(entity);
	}

	// Phase 2: Restore relations (now all entities exist)
	for (let i = 0; i < data.entities.length; i++) {
		const entityData = data.entities[i];
		const entity = spawnedEntities[i];

		for (const rel of entityData.relations) {
			const targetEntity = spawnedEntities[rel.targetEntityIndex];
			if (!targetEntity) continue;

			const relationFactory = RELATIONS[rel.type as keyof typeof RELATIONS];
			if (relationFactory) {
				entity.add(relationFactory(targetEntity));
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Save/Load integration with saveRepo
// ---------------------------------------------------------------------------

/**
 * Save the current mission state to a save slot.
 * Serializes the Koota world + writes to SQLite via saveRepo.
 */
export async function saveMission(world: World, slot: number, missionId: string): Promise<void> {
	const { saveGame } = await import("../persistence/repos/saveRepo");
	const data = serializeWorld(world);
	const json = JSON.stringify(data);
	await saveGame(slot, missionId, json);
}

/**
 * Load a mission from a save slot.
 * Reads from saveRepo + deserializes into the world.
 * Returns the mission ID, or null if slot is empty.
 */
export async function loadMission(world: World, slot: number): Promise<string | null> {
	const { loadGame } = await import("../persistence/repos/saveRepo");
	const save = await loadGame(slot);
	if (!save) return null;

	const data = JSON.parse(save.snapshot_json) as SerializedWorld;
	deserializeWorld(world, data);
	return save.mission_id;
}
