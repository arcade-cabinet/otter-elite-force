/**
 * Skirmish Game Adapter -- bridges SkirmishAI's GameAdapter interface to GameWorld.
 *
 * Translates the abstract AI interface into concrete bitECS queries and
 * GameWorld mutations. Used when a skirmish session starts to give the
 * AI opponent access to the game state.
 */

import { CATEGORY_IDS, FACTION_IDS, resolveCategoryId } from "@/engine/content/ids";
import { Content, Faction, Flags, Position } from "@/engine/world/components";
import { type GameWorld, getOrderQueue, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import { getBuilding, getUnit } from "@/entities/registry";
import type { GameAdapter } from "./skirmishAI";

/** Faction ID the AI controls ("scale_guard" = 2). */
const AI_FACTION = FACTION_IDS.scale_guard;
const PLAYER_FACTION = FACTION_IDS.ura;

/** Worker unit type for Scale-Guard. */
const WORKER_TYPE = "skink";
const MELEE_TYPE = "gator";
const RANGED_TYPE = "viper";

const MILITARY_CATEGORIES = new Set<number>([
	CATEGORY_IDS.infantry,
	CATEGORY_IDS.ranged,
	CATEGORY_IDS.siege,
	CATEGORY_IDS.scout,
	CATEGORY_IDS.support,
]);

export function createSkirmishGameAdapter(world: GameWorld): GameAdapter {
	function aiFactionUnits(): number[] {
		return [...world.runtime.alive].filter(
			(eid) =>
				Faction.id[eid] === AI_FACTION &&
				Flags.isBuilding[eid] === 0 &&
				Flags.isResource[eid] === 0 &&
				Flags.isProjectile[eid] === 0,
		);
	}

	function aiFactionBuildings(): number[] {
		return [...world.runtime.alive].filter(
			(eid) => Faction.id[eid] === AI_FACTION && Flags.isBuilding[eid] === 1,
		);
	}

	return {
		getWorkerCount(): number {
			return aiFactionUnits().filter(
				(eid) => world.runtime.entityTypeIndex.get(eid) === WORKER_TYPE,
			).length;
		},

		getArmyCount(): number {
			return aiFactionUnits().filter((eid) => {
				const type = world.runtime.entityTypeIndex.get(eid);
				return type !== WORKER_TYPE;
			}).length;
		},

		getArmyComposition(): { melee: number; ranged: number } {
			let melee = 0;
			let ranged = 0;
			for (const eid of aiFactionUnits()) {
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type === MELEE_TYPE) melee++;
				else if (type === RANGED_TYPE) ranged++;
				else if (type !== WORKER_TYPE) {
					// Default non-worker, non-ranged to melee
					const catId = Content.categoryId[eid];
					if (catId === CATEGORY_IDS.ranged) ranged++;
					else if (MILITARY_CATEGORIES.has(catId)) melee++;
				}
			}
			return { melee, ranged };
		},

		getBuildingCount(buildingType: string): number {
			return aiFactionBuildings().filter(
				(eid) => world.runtime.entityTypeIndex.get(eid) === buildingType,
			).length;
		},

		hasBuilding(buildingType: string): boolean {
			return aiFactionBuildings().some(
				(eid) => world.runtime.entityTypeIndex.get(eid) === buildingType,
			);
		},

		getResources(): { fish: number; timber: number; salvage: number } {
			// AI uses a separate resource pool from the player. For the skirmish AI,
			// we track resources on world.runtime. If not available, assume infinite.
			const aiRes = (
				world.runtime as { aiResources?: { fish: number; timber: number; salvage: number } }
			).aiResources;
			return aiRes ?? { fish: 9999, timber: 9999, salvage: 9999 };
		},

		getPopulation(): { current: number; max: number } {
			const units = aiFactionUnits().length;
			// AI pop cap based on number of bases
			const bases = aiFactionBuildings().filter((eid) => {
				const type = world.runtime.entityTypeIndex.get(eid);
				return type === "sludge_pit" || type === "command_post";
			}).length;
			return { current: units, max: Math.max(20, bases * 15) };
		},

		trainUnit(unitType: string): boolean {
			const def = getUnit(unitType);
			if (!def) return false;
			// Find an AI building that trains this unit type
			const trainer = aiFactionBuildings().find((eid) => {
				const type = world.runtime.entityTypeIndex.get(eid);
				return type === def.trainedAt || type === "sludge_pit" || type === "spawning_pool";
			});
			if (!trainer) return false;
			// Spawn the unit near the training building
			const x = Position.x[trainer] + (Math.random() * 64 - 32);
			const y = Position.y[trainer] + 48;
			spawnUnit(world, {
				x,
				y,
				faction: "scale_guard",
				unitType,
				categoryId: resolveCategoryId(def.category),
				health: { current: def.hp, max: def.hp },
				stats: {
					hp: def.hp,
					armor: def.armor,
					speed: def.speed,
					attackDamage: def.damage,
					attackRange: def.range,
					attackCooldownMs: def.attackCooldown,
					visionRadius: def.visionRadius,
					popCost: def.populationCost,
				},
			});
			return true;
		},

		placeBuilding(buildingType: string, x: number, y: number): boolean {
			const def = getBuilding(buildingType);
			if (!def) return false;
			spawnBuilding(world, {
				x: x * 32 + 16,
				y: y * 32 + 16,
				faction: "scale_guard",
				buildingType,
				health: { current: def.hp, max: def.hp },
				stats: {
					hp: def.hp,
					armor: def.armor ?? 0,
					visionRadius: 5,
					attackDamage: def.attackDamage ?? 0,
					attackRange: def.attackRange ?? 0,
					attackCooldownMs: def.attackCooldown ?? 0,
					populationCapacity: def.populationCapacity ?? 0,
				},
			});
			return true;
		},

		sendAttack(x: number, y: number): void {
			for (const eid of aiFactionUnits()) {
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type === WORKER_TYPE) continue;
				const orders = getOrderQueue(world, eid);
				// Clear existing orders and attack-move
				orders.length = 0;
				orders.push({
					type: "attack",
					targetX: x * 32 + 16,
					targetY: y * 32 + 16,
				});
			}
		},

		sendGather(): void {
			// Order idle workers to move toward nearest resource
			for (const eid of aiFactionUnits()) {
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type !== WORKER_TYPE) continue;
				const orders = getOrderQueue(world, eid);
				if (orders.length > 0) continue; // not idle
				// Find nearest resource
				let nearestRid = -1;
				let nearestDist = Infinity;
				for (const rid of world.runtime.alive) {
					if (Flags.isResource[rid] !== 1) continue;
					const dx = Position.x[rid] - Position.x[eid];
					const dy = Position.y[rid] - Position.y[eid];
					const dist = dx * dx + dy * dy;
					if (dist < nearestDist) {
						nearestDist = dist;
						nearestRid = rid;
					}
				}
				if (nearestRid !== -1) {
					orders.push({
						type: "gather",
						targetEid: nearestRid,
						targetX: Position.x[nearestRid],
						targetY: Position.y[nearestRid],
					});
				}
			}
		},

		sendScout(x: number, y: number): void {
			// Send one military unit to scout
			const scout = aiFactionUnits().find((eid) => {
				const type = world.runtime.entityTypeIndex.get(eid);
				return type !== WORKER_TYPE;
			});
			if (!scout) return;
			const orders = getOrderQueue(world, scout);
			orders.length = 0;
			orders.push({
				type: "move",
				targetX: x * 32 + 16,
				targetY: y * 32 + 16,
			});
		},

		getEnemyBasePosition(): { x: number; y: number } {
			// Find player's command post or first building
			for (const eid of world.runtime.alive) {
				if (Faction.id[eid] !== PLAYER_FACTION || Flags.isBuilding[eid] !== 1) continue;
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type === "command_post" || type === "burrow") {
					return { x: Position.x[eid] / 32, y: Position.y[eid] / 32 };
				}
			}
			// Fallback: first player entity
			for (const eid of world.runtime.alive) {
				if (Faction.id[eid] === PLAYER_FACTION) {
					return { x: Position.x[eid] / 32, y: Position.y[eid] / 32 };
				}
			}
			return { x: 0, y: 0 };
		},

		getBuildPosition(_buildingType?: string): { x: number; y: number } {
			// Place near AI base
			const bases = aiFactionBuildings();
			if (bases.length > 0) {
				const base = bases[0];
				const offset = bases.length * 3;
				return {
					x: Position.x[base] / 32 + (offset % 6) - 3,
					y: Position.y[base] / 32 + Math.floor(offset / 6) + 2,
				};
			}
			return { x: world.navigation.width / 2, y: world.navigation.height / 2 };
		},

		isEnemyCommandPostDestroyed(): boolean {
			for (const eid of world.runtime.alive) {
				if (Faction.id[eid] !== PLAYER_FACTION || Flags.isBuilding[eid] !== 1) continue;
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type === "command_post" || type === "burrow") return false;
			}
			return true;
		},

		isOwnCommandPostDestroyed(): boolean {
			for (const eid of world.runtime.alive) {
				if (Faction.id[eid] !== AI_FACTION || Flags.isBuilding[eid] !== 1) continue;
				const type = world.runtime.entityTypeIndex.get(eid);
				if (type === "sludge_pit" || type === "command_post" || type === "flag_post") return false;
			}
			return true;
		},
	};
}
