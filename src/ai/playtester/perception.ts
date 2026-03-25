/**
 * AI Playtester Perception Model
 *
 * Builds a PlayerPerception snapshot from the game world, constrained by:
 * 1. Fog of War — only sees tiles the player has explored/visible
 * 2. Viewport — only interacts with entities currently on screen
 * 3. UI-visible data — resources, population, selected unit/building stats
 *
 * The AI playtester CANNOT read Koota directly for decision-making.
 * It must build all knowledge from this perception model, just like
 * a human reads the screen.
 */

import type { Entity, World } from "koota";
import { Armor, Attack, Health } from "@/ecs/traits/combat";
import { Gatherer, ProductionQueue, ResourceNode } from "@/ecs/traits/economy";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { GameClock, PopulationState, ResourcePool } from "@/ecs/traits/state";
import { TILE_SIZE } from "@/maps/constants";
import type { FogOfWarSystem } from "@/systems/fogSystem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Rectangle in pixel coordinates representing the camera viewport. */
export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Minimal info about a unit visible on screen. */
export interface VisibleUnitInfo {
	entityId: number;
	unitType: string;
	faction: string;
	tileX: number;
	tileY: number;
	hp: number;
	maxHp: number;
	armor: number;
	damage: number;
	range: number;
	speed: number;
	isGathering: boolean;
	hasOrders: boolean;
}

/** Minimal info about a building visible on screen. */
export interface VisibleBuildingInfo {
	entityId: number;
	unitType: string;
	faction: string;
	tileX: number;
	tileY: number;
	hp: number;
	maxHp: number;
	isTraining: boolean;
	queueLength: number;
}

/** Minimal info about a resource node visible on screen. */
export interface VisibleResourceInfo {
	entityId: number;
	resourceType: string;
	tileX: number;
	tileY: number;
	remaining: number;
}

/** A dot on the minimap — faction-colored, no detail. */
export interface MinimapDot {
	tileX: number;
	tileY: number;
	faction: string;
	isBuilding: boolean;
}

/** Complete perception snapshot — everything the AI "sees" at one moment. */
export interface PlayerPerception {
	/** Current camera viewport in pixel coordinates. */
	viewport: Viewport;
	/** Set of "tileX,tileY" keys for tiles that have been explored. */
	exploredTiles: Set<string>;
	/** Set of "tileX,tileY" keys for tiles currently visible (in unit vision). */
	visibleTiles: Set<string>;
	/** Resource counts as shown in the HUD. */
	resources: { fish: number; timber: number; salvage: number };
	/** Population as shown in the HUD. */
	population: { current: number; max: number };
	/** Units currently selected by the player. */
	selectedUnits: VisibleUnitInfo[];
	/** Buildings currently selected by the player and shown in the command UI. */
	selectedBuildings: VisibleBuildingInfo[];
	/** Friendly units visible in the viewport. */
	visibleFriendlyUnits: VisibleUnitInfo[];
	/** Enemy units visible in the viewport AND in fog-visible tiles. */
	visibleEnemyUnits: VisibleUnitInfo[];
	/** Buildings visible in the viewport. */
	visibleBuildings: VisibleBuildingInfo[];
	/** Resource nodes visible in the viewport. */
	visibleResources: VisibleResourceInfo[];
	/** Minimap dots — all explored friendly + currently visible enemies. */
	minimapDots: MinimapDot[];
	/** Game elapsed time in seconds. */
	gameTime: number;
	/** Map dimensions in tiles. */
	mapCols: number;
	mapRows: number;
}

// ---------------------------------------------------------------------------
// Resource state reader
// ---------------------------------------------------------------------------

/**
 * Reads resource/population totals from the game state.
 * The default production path reads Koota singleton traits, but the playtester
 * still accepts an injected reader so tests and alternate harnesses can supply
 * a different state layer when needed.
 */
export interface GameStateReader {
	getResources(): { fish: number; timber: number; salvage: number };
	getPopulation(): { current: number; max: number };
	getGameTime(): number;
}

/**
 * Build a GameStateReader directly from Koota singleton traits.
 * Keeps the playtester aligned with the canonical in-game chronometer.
 */
export function createKootaGameStateReader(world: World): GameStateReader {
	return {
		getResources() {
			const pool = world.get(ResourcePool);
			return {
				fish: pool?.fish ?? 0,
				timber: pool?.timber ?? 0,
				salvage: pool?.salvage ?? 0,
			};
		},
		getPopulation() {
			const pop = world.get(PopulationState);
			return {
				current: pop?.current ?? 0,
				max: pop?.max ?? 0,
			};
		},
		getGameTime() {
			return (world.get(GameClock)?.elapsedMs ?? 0) / 1000;
		},
	};
}

// ---------------------------------------------------------------------------
// Perception Builder
// ---------------------------------------------------------------------------

export class PerceptionBuilder {
	private world: World;
	private fog: FogOfWarSystem;
	private stateReader: GameStateReader;
	private playerFaction: string;
	private mapCols: number;
	private mapRows: number;

	constructor(
		world: World,
		fog: FogOfWarSystem,
		stateReader: GameStateReader,
		mapCols: number,
		mapRows: number,
		playerFaction = "ura",
	) {
		this.world = world;
		this.fog = fog;
		this.stateReader = stateReader;
		this.mapCols = mapCols;
		this.mapRows = mapRows;
		this.playerFaction = playerFaction;
	}

	/**
	 * Build a complete perception snapshot for the given viewport.
	 * This is called once per AI decision tick (not every frame).
	 */
	build(viewport: Viewport): PlayerPerception {
		const exploredTiles = new Set<string>();
		const visibleTiles = new Set<string>();

		// Scan the fog grid to build explored/visible tile sets
		for (let y = 0; y < this.mapRows; y++) {
			for (let x = 0; x < this.mapCols; x++) {
				const state = this.fog.getFogState(x, y);
				if (state >= 1) {
					// Explored or Visible
					exploredTiles.add(`${x},${y}`);
				}
				if (state === 2) {
					// Currently visible (FogState.Visible)
					visibleTiles.add(`${x},${y}`);
				}
			}
		}

		const selectedUnits: VisibleUnitInfo[] = [];
		const selectedBuildings: VisibleBuildingInfo[] = [];
		const visibleFriendlyUnits: VisibleUnitInfo[] = [];
		const visibleEnemyUnits: VisibleUnitInfo[] = [];
		const visibleBuildings: VisibleBuildingInfo[] = [];
		const visibleResources: VisibleResourceInfo[] = [];
		const minimapDots: MinimapDot[] = [];

		// Scan all positioned, typed entities
		this.world.query(UnitType, Position, Faction).forEach((entity) => {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			const unitType = entity.get(UnitType);
			if (!pos || !faction || !unitType) return;

			const tileX = Math.floor(pos.x);
			const tileY = Math.floor(pos.y);
			const tileKey = `${tileX},${tileY}`;
			const isFriendly = faction.id === this.playerFaction;
			const isBuildingEntity = entity.has(IsBuilding);
			const isResourceEntity = entity.has(IsResource);

			// Minimap: show all friendly in explored tiles, enemies only in visible tiles
			if (isFriendly && exploredTiles.has(tileKey)) {
				minimapDots.push({
					tileX,
					tileY,
					faction: faction.id,
					isBuilding: isBuildingEntity,
				});
			} else if (!isFriendly && visibleTiles.has(tileKey)) {
				minimapDots.push({
					tileX,
					tileY,
					faction: faction.id,
					isBuilding: isBuildingEntity,
				});
			}

			// Viewport check — entity must be on screen for detailed info
			const inViewport = this.isInViewport(tileX, tileY, viewport);

			// Selected units are always visible (they're in the HUD panel)
			const isSelected = entity.has(Selected);

			if (isResourceEntity && inViewport && visibleTiles.has(tileKey)) {
				visibleResources.push(this.readResource(entity, tileX, tileY));
				return;
			}

			if (isBuildingEntity) {
				if (isFriendly && isSelected) {
					selectedBuildings.push(
						this.readBuilding(entity, unitType.type, faction.id, tileX, tileY),
					);
				}

				// Buildings: friendly always visible if in viewport + explored,
				// enemy only if in viewport + fog-visible
				const canSee = isFriendly
					? inViewport && exploredTiles.has(tileKey)
					: inViewport && visibleTiles.has(tileKey);

				if (canSee) {
					visibleBuildings.push(this.readBuilding(entity, unitType.type, faction.id, tileX, tileY));
				}
				return;
			}

			// Regular units
			if (isFriendly) {
				if (isSelected) {
					selectedUnits.push(this.readUnit(entity, unitType.type, faction.id, tileX, tileY));
				}
				if (inViewport) {
					visibleFriendlyUnits.push(this.readUnit(entity, unitType.type, faction.id, tileX, tileY));
				}
			} else {
				// Enemy: must be on a fog-visible tile AND in viewport
				if (inViewport && visibleTiles.has(tileKey)) {
					visibleEnemyUnits.push(this.readUnit(entity, unitType.type, faction.id, tileX, tileY));
				}
			}
		});

		return {
			viewport,
			exploredTiles,
			visibleTiles,
			resources: this.stateReader.getResources(),
			population: this.stateReader.getPopulation(),
			selectedUnits,
			selectedBuildings,
			visibleFriendlyUnits,
			visibleEnemyUnits,
			visibleBuildings,
			visibleResources,
			minimapDots,
			gameTime: this.stateReader.getGameTime(),
			mapCols: this.mapCols,
			mapRows: this.mapRows,
		};
	}

	/** Check if a tile position falls within the pixel viewport. */
	private isInViewport(tileX: number, tileY: number, viewport: Viewport): boolean {
		const px = tileX * TILE_SIZE;
		const py = tileY * TILE_SIZE;
		return (
			px + TILE_SIZE > viewport.x &&
			px < viewport.x + viewport.width &&
			py + TILE_SIZE > viewport.y &&
			py < viewport.y + viewport.height
		);
	}

	/** Extract visible unit info from an entity. */
	private readUnit(
		entity: Entity,
		unitType: string,
		faction: string,
		tileX: number,
		tileY: number,
	): VisibleUnitInfo {
		const health = entity.get(Health);
		const attack = entity.get(Attack);
		const armor = entity.get(Armor);
		const gatherer = entity.get(Gatherer);
		const orders = entity.get(OrderQueue);

		return {
			entityId: entity.id(),
			unitType,
			faction,
			tileX,
			tileY,
			hp: health?.current ?? 0,
			maxHp: health?.max ?? 0,
			armor: armor?.value ?? 0,
			damage: attack?.damage ?? 0,
			range: attack?.range ?? 0,
			speed: 0, // speed is in unit defs, not a trait
			isGathering: gatherer != null && gatherer.carrying !== "",
			hasOrders: orders != null && (orders as unknown as unknown[]).length > 0,
		};
	}

	/** Extract visible building info from an entity. */
	private readBuilding(
		entity: Entity,
		unitType: string,
		faction: string,
		tileX: number,
		tileY: number,
	): VisibleBuildingInfo {
		const health = entity.get(Health);
		const queue = entity.get(ProductionQueue);
		const queueArr = queue as unknown as unknown[] | null;

		return {
			entityId: entity.id(),
			unitType,
			faction,
			tileX,
			tileY,
			hp: health?.current ?? 0,
			maxHp: health?.max ?? 0,
			isTraining: queueArr != null && queueArr.length > 0,
			queueLength: queueArr != null ? queueArr.length : 0,
		};
	}

	/** Extract visible resource info from an entity. */
	private readResource(entity: Entity, tileX: number, tileY: number): VisibleResourceInfo {
		const node = entity.get(ResourceNode);
		return {
			entityId: entity.id(),
			resourceType: node?.type ?? "unknown",
			tileX,
			tileY,
			remaining: node?.remaining ?? 0,
		};
	}
}

// ---------------------------------------------------------------------------
// Perception Queries — helper functions for goal evaluators
// ---------------------------------------------------------------------------

/** Count idle friendly units (not gathering, no orders) in perception. */
export function countIdleWorkers(perception: PlayerPerception): number {
	return perception.visibleFriendlyUnits.filter(
		(u) => u.unitType === "river_rat" && !u.isGathering && !u.hasOrders,
	).length;
}

/** Count military units in perception. */
export function countMilitaryUnits(perception: PlayerPerception): number {
	const militaryTypes = new Set(["mudfoot", "shellcracker", "sapper", "mortar_otter", "diver"]);
	return perception.visibleFriendlyUnits.filter((u) => militaryTypes.has(u.unitType)).length;
}

/** Check if the base (command_post) is under attack — enemies near our buildings. */
export function isBaseUnderThreat(perception: PlayerPerception, threatRadius = 5): boolean {
	const commandPosts = perception.visibleBuildings.filter(
		(b) => b.unitType === "command_post" && b.faction === "ura",
	);

	for (const cp of commandPosts) {
		for (const enemy of perception.visibleEnemyUnits) {
			const dx = enemy.tileX - cp.tileX;
			const dy = enemy.tileY - cp.tileY;
			if (dx * dx + dy * dy <= threatRadius * threatRadius) {
				return true;
			}
		}
	}

	return false;
}

/** Find the nearest unexplored tile from a given position. */
export function findNearestUnexploredTile(
	perception: PlayerPerception,
	fromTileX: number,
	fromTileY: number,
): { tileX: number; tileY: number } | null {
	let bestDist = Number.POSITIVE_INFINITY;
	let bestTile: { tileX: number; tileY: number } | null = null;

	for (let y = 0; y < perception.mapRows; y++) {
		for (let x = 0; x < perception.mapCols; x++) {
			if (!perception.exploredTiles.has(`${x},${y}`)) {
				const dx = x - fromTileX;
				const dy = y - fromTileY;
				const dist = dx * dx + dy * dy;
				if (dist < bestDist) {
					bestDist = dist;
					bestTile = { tileX: x, tileY: y };
				}
			}
		}
	}

	return bestTile;
}

/** Find the nearest visible resource of a given type. */
export function findNearestResource(
	perception: PlayerPerception,
	fromTileX: number,
	fromTileY: number,
	resourceType?: string,
): VisibleResourceInfo | null {
	let bestDist = Number.POSITIVE_INFINITY;
	let bestResource: VisibleResourceInfo | null = null;

	for (const res of perception.visibleResources) {
		if (resourceType && res.resourceType !== resourceType) continue;
		if (res.remaining <= 0) continue;

		const dx = res.tileX - fromTileX;
		const dy = res.tileY - fromTileY;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			bestResource = res;
		}
	}

	return bestResource;
}

/** Check if we can afford a cost given current resources. */
export function canAfford(
	perception: PlayerPerception,
	cost: { fish?: number; timber?: number; salvage?: number },
): boolean {
	const r = perception.resources;
	if (cost.fish && r.fish < cost.fish) return false;
	if (cost.timber && r.timber < cost.timber) return false;
	if (cost.salvage && r.salvage < cost.salvage) return false;
	return true;
}

/** Check if population has room for more units. */
export function hasPopulationRoom(perception: PlayerPerception): boolean {
	return perception.population.current < perception.population.max;
}

/** Find friendly buildings of a specific type. */
export function findBuildings(
	perception: PlayerPerception,
	buildingType: string,
): VisibleBuildingInfo[] {
	return perception.visibleBuildings.filter(
		(b) => b.unitType === buildingType && b.faction === "ura",
	);
}

/** Get the weakest enemy unit in perception (lowest HP). */
export function findWeakestEnemy(perception: PlayerPerception): VisibleUnitInfo | null {
	if (perception.visibleEnemyUnits.length === 0) return null;
	return perception.visibleEnemyUnits.reduce((weakest, unit) =>
		unit.hp < weakest.hp ? unit : weakest,
	);
}

/** Estimate unexplored percentage of the map. */
export function explorationProgress(perception: PlayerPerception): number {
	const totalTiles = perception.mapCols * perception.mapRows;
	if (totalTiles === 0) return 1;
	return perception.exploredTiles.size / totalTiles;
}
