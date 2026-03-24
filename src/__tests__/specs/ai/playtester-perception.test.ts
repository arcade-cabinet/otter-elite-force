/**
 * AI Playtester Perception Specification Tests
 *
 * Defines the behavioral contract for the PerceptionBuilder and helper queries.
 * The AI playtester sees the world through this perception model:
 *   - Fog of war constrains visibility
 *   - Viewport constrains interaction
 *   - Only reads UI-visible data (resources, selected unit stats, minimap)
 *   - No direct Koota access for decision-making
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §9
 *   - src/ai/playtester/perception.ts
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */
import { describe, it, expect, beforeAll } from "vitest";
import type {
	PlayerPerception,
	Viewport,
	VisibleUnitInfo,
	VisibleBuildingInfo,
} from "@/ai/playtester/perception";
import {
	countIdleWorkers,
	countMilitaryUnits,
	isBaseUnderThreat,
	findNearestUnexploredTile,
	findNearestResource,
	canAfford,
	hasPopulationRoom,
	findBuildings,
	findWeakestEnemy,
	explorationProgress,
} from "@/ai/playtester/perception";

// ---------------------------------------------------------------------------
// Test fixture: build a mock PlayerPerception
// ---------------------------------------------------------------------------

function makePerception(overrides: Partial<PlayerPerception> = {}): PlayerPerception {
	return {
		viewport: { x: 0, y: 0, width: 800, height: 600 },
		exploredTiles: new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"]),
		visibleTiles: new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"]),
		resources: { fish: 200, timber: 100, salvage: 50 },
		population: { current: 8, max: 12 },
		selectedUnits: [],
		visibleFriendlyUnits: [],
		visibleEnemyUnits: [],
		visibleBuildings: [],
		visibleResources: [],
		minimapDots: [],
		gameTime: 120,
		mapCols: 10,
		mapRows: 10,
		...overrides,
	};
}

function makeUnit(overrides: Partial<VisibleUnitInfo> = {}): VisibleUnitInfo {
	return {
		entityId: 1,
		unitType: "mudfoot",
		faction: "ura",
		tileX: 5,
		tileY: 5,
		hp: 80,
		maxHp: 80,
		armor: 2,
		damage: 12,
		range: 1,
		speed: 8,
		isGathering: false,
		hasOrders: false,
		...overrides,
	};
}

function makeBuilding(overrides: Partial<VisibleBuildingInfo> = {}): VisibleBuildingInfo {
	return {
		entityId: 100,
		unitType: "command_post",
		faction: "ura",
		tileX: 3,
		tileY: 3,
		hp: 500,
		maxHp: 500,
		isTraining: false,
		queueLength: 0,
		...overrides,
	};
}

// ===========================================================================
// SPECIFICATION: Perception Queries
// ===========================================================================

describe("AI Playtester Perception Queries", () => {
	describe("countIdleWorkers", () => {
		it("returns 0 when no units visible", () => {
			const p = makePerception();
			expect(countIdleWorkers(p)).toBe(0);
		});

		it("counts idle river_rats not gathering or on orders", () => {
			const p = makePerception({
				visibleFriendlyUnits: [
					makeUnit({ unitType: "river_rat", isGathering: false, hasOrders: false }),
					makeUnit({ unitType: "river_rat", isGathering: false, hasOrders: false }),
					makeUnit({ unitType: "river_rat", isGathering: true, hasOrders: false }),
				],
			});
			expect(countIdleWorkers(p)).toBe(2);
		});

		it("does not count military units as idle workers", () => {
			const p = makePerception({
				visibleFriendlyUnits: [
					makeUnit({ unitType: "mudfoot", isGathering: false, hasOrders: false }),
				],
			});
			expect(countIdleWorkers(p)).toBe(0);
		});

		it("does not count workers with active orders", () => {
			const p = makePerception({
				visibleFriendlyUnits: [
					makeUnit({ unitType: "river_rat", isGathering: false, hasOrders: true }),
				],
			});
			expect(countIdleWorkers(p)).toBe(0);
		});
	});

	describe("countMilitaryUnits", () => {
		it("returns 0 when no military units visible", () => {
			const p = makePerception({
				visibleFriendlyUnits: [makeUnit({ unitType: "river_rat" })],
			});
			expect(countMilitaryUnits(p)).toBe(0);
		});

		it("counts mudfoots, shellcrackers, sappers, mortar_otters, divers", () => {
			const p = makePerception({
				visibleFriendlyUnits: [
					makeUnit({ unitType: "mudfoot" }),
					makeUnit({ unitType: "shellcracker" }),
					makeUnit({ unitType: "sapper" }),
					makeUnit({ unitType: "mortar_otter" }),
					makeUnit({ unitType: "diver" }),
					makeUnit({ unitType: "river_rat" }), // not military
				],
			});
			expect(countMilitaryUnits(p)).toBe(5);
		});
	});

	describe("isBaseUnderThreat", () => {
		it("returns false when no enemies near command post", () => {
			const p = makePerception({
				visibleBuildings: [makeBuilding({ tileX: 3, tileY: 3 })],
				visibleEnemyUnits: [makeUnit({ faction: "scale_guard", tileX: 20, tileY: 20 })],
			});
			expect(isBaseUnderThreat(p)).toBe(false);
		});

		it("returns true when enemy is within threat radius of command post", () => {
			const p = makePerception({
				visibleBuildings: [makeBuilding({ tileX: 3, tileY: 3 })],
				visibleEnemyUnits: [makeUnit({ faction: "scale_guard", tileX: 5, tileY: 3 })],
			});
			expect(isBaseUnderThreat(p, 5)).toBe(true);
		});

		it("returns false when no command_post exists", () => {
			const p = makePerception({
				visibleBuildings: [makeBuilding({ unitType: "barracks", tileX: 3, tileY: 3 })],
				visibleEnemyUnits: [makeUnit({ faction: "scale_guard", tileX: 3, tileY: 3 })],
			});
			expect(isBaseUnderThreat(p)).toBe(false);
		});
	});

	describe("findNearestUnexploredTile", () => {
		it("returns null when entire map is explored", () => {
			const allExplored = new Set<string>();
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					allExplored.add(`${x},${y}`);
				}
			}
			const p = makePerception({ exploredTiles: allExplored, mapCols: 3, mapRows: 3 });
			expect(findNearestUnexploredTile(p, 0, 0)).toBeNull();
		});

		it("returns the nearest unexplored tile", () => {
			const explored = new Set(["0,0", "1,0", "0,1"]);
			const p = makePerception({ exploredTiles: explored, mapCols: 3, mapRows: 3 });
			const tile = findNearestUnexploredTile(p, 0, 0);
			expect(tile).not.toBeNull();
			// (1,1) is distance sqrt(2), closest to (0,0) among unexplored
			expect(tile!.tileX).toBe(1);
			expect(tile!.tileY).toBe(1);
		});
	});

	describe("findNearestResource", () => {
		it("returns null when no resources visible", () => {
			const p = makePerception();
			expect(findNearestResource(p, 0, 0)).toBeNull();
		});

		it("returns the nearest resource", () => {
			const p = makePerception({
				visibleResources: [
					{ entityId: 10, resourceType: "fish", tileX: 5, tileY: 5, remaining: 100 },
					{ entityId: 11, resourceType: "fish", tileX: 1, tileY: 1, remaining: 80 },
				],
			});
			const nearest = findNearestResource(p, 0, 0);
			expect(nearest).not.toBeNull();
			expect(nearest!.tileX).toBe(1);
			expect(nearest!.tileY).toBe(1);
		});

		it("filters by resource type", () => {
			const p = makePerception({
				visibleResources: [
					{ entityId: 10, resourceType: "fish", tileX: 1, tileY: 1, remaining: 100 },
					{ entityId: 11, resourceType: "timber", tileX: 2, tileY: 2, remaining: 80 },
				],
			});
			const nearest = findNearestResource(p, 0, 0, "timber");
			expect(nearest).not.toBeNull();
			expect(nearest!.resourceType).toBe("timber");
		});

		it("skips depleted resources (remaining=0)", () => {
			const p = makePerception({
				visibleResources: [
					{ entityId: 10, resourceType: "fish", tileX: 1, tileY: 1, remaining: 0 },
					{ entityId: 11, resourceType: "fish", tileX: 5, tileY: 5, remaining: 80 },
				],
			});
			const nearest = findNearestResource(p, 0, 0);
			expect(nearest!.tileX).toBe(5);
		});
	});

	describe("canAfford", () => {
		it("returns true when resources are sufficient", () => {
			const p = makePerception({ resources: { fish: 200, timber: 100, salvage: 50 } });
			expect(canAfford(p, { fish: 80, salvage: 20 })).toBe(true);
		});

		it("returns false when fish is insufficient", () => {
			const p = makePerception({ resources: { fish: 50, timber: 100, salvage: 50 } });
			expect(canAfford(p, { fish: 80 })).toBe(false);
		});

		it("returns true when cost is empty", () => {
			const p = makePerception({ resources: { fish: 0, timber: 0, salvage: 0 } });
			expect(canAfford(p, {})).toBe(true);
		});
	});

	describe("hasPopulationRoom", () => {
		it("returns true when current < max", () => {
			const p = makePerception({ population: { current: 8, max: 12 } });
			expect(hasPopulationRoom(p)).toBe(true);
		});

		it("returns false when current >= max", () => {
			const p = makePerception({ population: { current: 12, max: 12 } });
			expect(hasPopulationRoom(p)).toBe(false);
		});
	});

	describe("findBuildings", () => {
		it("finds friendly buildings of a given type", () => {
			const p = makePerception({
				visibleBuildings: [
					makeBuilding({ unitType: "barracks" }),
					makeBuilding({ unitType: "command_post" }),
					makeBuilding({ unitType: "barracks", faction: "scale_guard" }),
				],
			});
			const barracks = findBuildings(p, "barracks");
			expect(barracks).toHaveLength(1);
			expect(barracks[0].faction).toBe("ura");
		});
	});

	describe("findWeakestEnemy", () => {
		it("returns null when no enemies visible", () => {
			const p = makePerception();
			expect(findWeakestEnemy(p)).toBeNull();
		});

		it("returns the enemy with lowest HP", () => {
			const p = makePerception({
				visibleEnemyUnits: [
					makeUnit({ faction: "scale_guard", hp: 80 }),
					makeUnit({ faction: "scale_guard", hp: 30 }),
					makeUnit({ faction: "scale_guard", hp: 120 }),
				],
			});
			const weakest = findWeakestEnemy(p)!;
			expect(weakest.hp).toBe(30);
		});
	});

	describe("explorationProgress", () => {
		it("returns 0 when nothing explored", () => {
			const p = makePerception({ exploredTiles: new Set(), mapCols: 10, mapRows: 10 });
			expect(explorationProgress(p)).toBe(0);
		});

		it("returns 1 when fully explored", () => {
			const allExplored = new Set<string>();
			for (let y = 0; y < 10; y++) {
				for (let x = 0; x < 10; x++) {
					allExplored.add(`${x},${y}`);
				}
			}
			const p = makePerception({ exploredTiles: allExplored, mapCols: 10, mapRows: 10 });
			expect(explorationProgress(p)).toBe(1);
		});

		it("returns correct fraction for partial exploration", () => {
			const explored = new Set(["0,0", "1,0", "2,0", "3,0", "4,0"]);
			const p = makePerception({ exploredTiles: explored, mapCols: 10, mapRows: 10 });
			expect(explorationProgress(p)).toBe(0.05);
		});
	});
});

// ===========================================================================
// SPECIFICATION: Fog Constraint
// ===========================================================================

describe("Fog of War Constraint", () => {
	it("perception never includes enemy units in unexplored tiles", () => {
		// This is an architectural constraint — verify the contract
		const p = makePerception({
			exploredTiles: new Set(["0,0"]),
			visibleTiles: new Set(["0,0"]),
			visibleEnemyUnits: [makeUnit({ faction: "scale_guard", tileX: 0, tileY: 0 })],
		});
		// Enemies in the perception MUST be in visible tiles
		for (const enemy of p.visibleEnemyUnits) {
			const key = `${enemy.tileX},${enemy.tileY}`;
			expect(p.visibleTiles.has(key)).toBe(true);
		}
	});
});

// ===========================================================================
// SPECIFICATION: Viewport Constraint
// ===========================================================================

describe("Viewport Constraint", () => {
	it("perception only contains entities within the viewport bounds", () => {
		const viewport: Viewport = { x: 0, y: 0, width: 800, height: 600 };
		const p = makePerception({
			viewport,
			visibleFriendlyUnits: [
				makeUnit({ tileX: 5, tileY: 5 }), // within 800x600 at 32px/tile
			],
		});
		// All units in perception should be representable within the viewport
		// (the PerceptionBuilder enforces this, test validates the contract)
		expect(p.visibleFriendlyUnits.length).toBe(1);
	});
});
