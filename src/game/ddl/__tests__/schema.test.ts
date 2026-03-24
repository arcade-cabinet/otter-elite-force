/**
 * Tests for DDL Zod schemas
 */

import { describe, expect, it } from "vitest";
import {
	ChunkDDLSchema,
	EntityDDLSchema,
	HazardDDLSchema,
	ObjectiveDDLSchema,
	WorldDDLSchema,
	crossValidateChunkDDL,
	safeValidateChunkDDL,
	safeValidateWorldDDL,
	validateChunkDDL,
	validateChunkDriverConfigs,
	validateChunkEntityIds,
	validateChunkObjectiveTargets,
	validateEntityDDL,
	validateWorldDDL,
} from "../schema";
import type { ChunkDDL, EntityDDL, WorldDDL } from "../types";

describe("DDL Schema Validation", () => {
	describe("EntityDDLSchema", () => {
		it("validates a minimal entity", () => {
			const entity = {
				type: "GATOR",
				position: [0, 0, 0],
			};
			const result = EntityDDLSchema.safeParse(entity);
			expect(result.success).toBe(true);
		});

		it("validates a full entity with all optional fields", () => {
			const entity: EntityDDL = {
				id: "gator-1",
				type: "GATOR",
				position: [10, 0, -5],
				rotation: [0, Math.PI, 0],
				scale: [1.5, 1.5, 1.5],
				faction: "SCALE_GUARD",
				tier: "heavy",
				health: 200,
				active: true,
				characterId: undefined,
				lootTable: "enemy_drops",
				customData: { patrolRoute: "north" },
			};
			const result = EntityDDLSchema.safeParse(entity);
			expect(result.success).toBe(true);
		});

		it("rejects invalid entity type", () => {
			const entity = {
				type: "INVALID_TYPE",
				position: [0, 0, 0],
			};
			const result = EntityDDLSchema.safeParse(entity);
			expect(result.success).toBe(false);
		});

		it("rejects invalid position (wrong tuple length)", () => {
			const entity = {
				type: "GATOR",
				position: [0, 0], // Missing z
			};
			const result = EntityDDLSchema.safeParse(entity);
			expect(result.success).toBe(false);
		});

		it("validates scalar scale value", () => {
			const entity = {
				type: "GATOR",
				position: [0, 0, 0],
				scale: 2.0,
			};
			const result = EntityDDLSchema.safeParse(entity);
			expect(result.success).toBe(true);
		});
	});

	describe("HazardDDLSchema", () => {
		it("validates a minimal hazard", () => {
			const hazard = {
				type: "MUD_PIT",
				position: [5, 0, 5],
			};
			const result = HazardDDLSchema.safeParse(hazard);
			expect(result.success).toBe(true);
		});

		it("validates a hazard with all optional fields", () => {
			const hazard = {
				type: "TOXIC_SLUDGE",
				position: [10, 0, 10],
				radius: 3,
				damagePerSecond: 5,
				speedMultiplier: 0.5,
				intensity: 0.8,
			};
			const result = HazardDDLSchema.safeParse(hazard);
			expect(result.success).toBe(true);
		});

		it("rejects invalid speed multiplier (> 1)", () => {
			const hazard = {
				type: "MUD_PIT",
				position: [0, 0, 0],
				speedMultiplier: 1.5,
			};
			const result = HazardDDLSchema.safeParse(hazard);
			expect(result.success).toBe(false);
		});
	});

	describe("ObjectiveDDLSchema", () => {
		it("validates a minimal objective", () => {
			const objective = {
				id: "destroy-siphon",
				type: "destroy",
				text: "Destroy the Scale-Guard siphon",
			};
			const result = ObjectiveDDLSchema.safeParse(objective);
			expect(result.success).toBe(true);
		});

		it("validates an objective with rewards", () => {
			const objective = {
				id: "rescue-general",
				type: "rescue",
				text: "Rescue Gen. Whiskers",
				target: "prison-cage-1",
				optional: false,
				reward: {
					coins: 100,
					xp: 500,
					peacekeeping: 50,
				},
			};
			const result = ObjectiveDDLSchema.safeParse(objective);
			expect(result.success).toBe(true);
		});
	});

	describe("ChunkDDLSchema", () => {
		it("validates a minimal chunk", () => {
			const chunk: ChunkDDL = {
				coordinates: [5, 5],
				terrain: {
					type: "MARSH",
				},
				entities: [],
			};
			const result = ChunkDDLSchema.safeParse(chunk);
			expect(result.success).toBe(true);
		});

		it("validates a full POI chunk", () => {
			const chunk: ChunkDDL = {
				coordinates: [5, 5],
				name: "Prison Camp Alpha",
				subtitle: "Gen. Whiskers is held here",
				poiType: "PRISON_CAMP",
				difficulty: 7,
				terrain: {
					type: "SWAMP",
					seed: 12345,
					waterLevel: 0.2,
				},
				territoryState: "HOSTILE",
				entities: [
					{ type: "PRISON_CAGE", position: [0, 0, 0], id: "cage-1" },
					{ type: "GATOR", position: [5, 0, 5], tier: "heavy" },
					{ type: "SCOUT", position: [-5, 0, 5] },
				],
				hazards: [{ type: "TOXIC_SLUDGE", position: [10, 0, 10], radius: 3 }],
				decorations: [{ type: "BURNT_TREES", position: [8, 0, 8] }],
				objectives: [
					{
						id: "rescue-whiskers",
						type: "rescue",
						text: "Rescue Gen. Whiskers",
						target: "cage-1",
					},
				],
				drivers: [
					{
						id: "prison-rescue",
						config: { characterId: "whiskers" },
					},
				],
			};
			const result = ChunkDDLSchema.safeParse(chunk);
			expect(result.success).toBe(true);
		});

		it("rejects chunk with invalid coordinates", () => {
			const chunk = {
				coordinates: [5.5, 5], // Non-integer coordinate
				terrain: { type: "MARSH" },
				entities: [],
			};
			const result = ChunkDDLSchema.safeParse(chunk);
			expect(result.success).toBe(false);
		});

		it("rejects chunk with difficulty out of range", () => {
			const chunk = {
				coordinates: [0, 0],
				difficulty: 15, // Max is 10
				terrain: { type: "MARSH" },
				entities: [],
			};
			const result = ChunkDDLSchema.safeParse(chunk);
			expect(result.success).toBe(false);
		});
	});

	describe("WorldDDLSchema", () => {
		it("validates a minimal world", () => {
			const world: WorldDDL = {
				worldId: "copper-silt-reach",
				name: "The Copper-Silt Reach",
				seed: 42,
				radius: 50,
				keyCoordinates: [{ coordinates: [0, 0], type: "STARTING_LZ", difficulty: 0 }],
				defaultTerrain: "MARSH",
			};
			const result = WorldDDLSchema.safeParse(world);
			expect(result.success).toBe(true);
		});

		it("validates a full world with difficulty scaling", () => {
			const world: WorldDDL = {
				worldId: "copper-silt-reach",
				name: "The Copper-Silt Reach",
				description: "A humid riverine warzone",
				seed: 12345,
				radius: 100,
				keyCoordinates: [
					{ coordinates: [0, 0], type: "STARTING_LZ", difficulty: 0 },
					{ coordinates: [5, 5], type: "PRISON_CAMP", difficulty: 7, rescueTarget: "whiskers" },
					{
						coordinates: [10, -10],
						type: "BOSS_ARENA",
						difficulty: 10,
						chunkFile: "boss-arena.json",
					},
				],
				defaultTerrain: "MARSH",
				difficultyScaling: {
					startDistance: 5,
					maxDifficulty: 10,
					exponent: 1.5,
				},
			};
			const result = WorldDDLSchema.safeParse(world);
			expect(result.success).toBe(true);
		});

		it("rejects world with empty key coordinates", () => {
			const world = {
				worldId: "test",
				name: "Test",
				seed: 0,
				radius: 10,
				keyCoordinates: [],
				defaultTerrain: "MARSH",
			};
			const result = WorldDDLSchema.safeParse(world);
			expect(result.success).toBe(false);
		});
	});
});

describe("DDL Validation Functions", () => {
	describe("validateChunkDDL", () => {
		it("returns validated chunk on success", () => {
			const chunk = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
			};
			const result = validateChunkDDL(chunk);
			expect(result.coordinates).toEqual([0, 0]);
		});

		it("throws on invalid chunk", () => {
			const chunk = {
				coordinates: "invalid",
				terrain: { type: "MARSH" },
				entities: [],
			};
			expect(() => validateChunkDDL(chunk)).toThrow();
		});
	});

	describe("safeValidateChunkDDL", () => {
		it("returns success result for valid chunk", () => {
			const chunk = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
			};
			const result = safeValidateChunkDDL(chunk);
			expect(result.success).toBe(true);
		});

		it("returns error result for invalid chunk", () => {
			const chunk = {
				coordinates: "invalid",
				terrain: { type: "MARSH" },
				entities: [],
			};
			const result = safeValidateChunkDDL(chunk);
			expect(result.success).toBe(false);
		});
	});

	describe("validateEntityDDL", () => {
		it("returns validated entity on success", () => {
			const entity = {
				type: "GATOR",
				position: [0, 0, 0],
			};
			const result = validateEntityDDL(entity);
			expect(result.type).toBe("GATOR");
		});
	});
});

describe("DDL Cross-Validation", () => {
	describe("validateChunkEntityIds", () => {
		it("returns empty array for unique IDs", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [
					{ type: "GATOR", position: [0, 0, 0], id: "gator-1" },
					{ type: "GATOR", position: [5, 0, 5], id: "gator-2" },
				],
			};
			const errors = validateChunkEntityIds(chunk);
			expect(errors).toHaveLength(0);
		});

		it("returns error for duplicate IDs", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [
					{ type: "GATOR", position: [0, 0, 0], id: "gator-1" },
					{ type: "GATOR", position: [5, 0, 5], id: "gator-1" }, // Duplicate
				],
			};
			const errors = validateChunkEntityIds(chunk);
			expect(errors).toHaveLength(1);
			expect(errors[0]).toContain("Duplicate entity ID");
		});
	});

	describe("validateChunkObjectiveTargets", () => {
		it("returns empty array when targets reference valid entities", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [{ type: "PRISON_CAGE", position: [0, 0, 0], id: "cage-1" }],
				objectives: [{ id: "rescue", type: "rescue", text: "Rescue", target: "cage-1" }],
			};
			const errors = validateChunkObjectiveTargets(chunk);
			expect(errors).toHaveLength(0);
		});

		it("allows entity type as target", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [{ type: "GATOR", position: [0, 0, 0] }],
				objectives: [{ id: "kill-all", type: "destroy", text: "Kill gators", target: "GATOR" }],
			};
			const errors = validateChunkObjectiveTargets(chunk);
			expect(errors).toHaveLength(0);
		});

		it("returns error for unknown target", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
				objectives: [{ id: "rescue", type: "rescue", text: "Rescue", target: "unknown-entity" }],
			};
			const errors = validateChunkObjectiveTargets(chunk);
			expect(errors).toHaveLength(1);
			expect(errors[0]).toContain("unknown target");
		});
	});

	describe("validateChunkDriverConfigs", () => {
		it("returns error when prison-rescue driver lacks characterId", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
				drivers: [{ id: "prison-rescue", config: {} }],
			};
			const errors = validateChunkDriverConfigs(chunk);
			expect(errors).toHaveLength(1);
			expect(errors[0]).toContain("characterId");
		});

		it("returns error when boss-arena driver lacks bossType", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
				drivers: [{ id: "boss-arena", config: {} }],
			};
			const errors = validateChunkDriverConfigs(chunk);
			expect(errors).toHaveLength(1);
			expect(errors[0]).toContain("bossType");
		});

		it("returns empty array for valid driver configs", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [],
				drivers: [{ id: "prison-rescue", config: { characterId: "whiskers" } }],
			};
			const errors = validateChunkDriverConfigs(chunk);
			expect(errors).toHaveLength(0);
		});
	});

	describe("crossValidateChunkDDL", () => {
		it("runs all cross-validation checks", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [
					{ type: "GATOR", position: [0, 0, 0], id: "gator-1" },
					{ type: "GATOR", position: [5, 0, 5], id: "gator-1" }, // Duplicate
				],
				objectives: [{ id: "rescue", type: "rescue", text: "Rescue", target: "unknown" }],
				drivers: [{ id: "prison-rescue", config: {} }],
			};
			const errors = crossValidateChunkDDL(chunk);
			expect(errors.length).toBeGreaterThan(0);
		});

		it("returns empty array for valid chunk", () => {
			const chunk: ChunkDDL = {
				coordinates: [0, 0],
				terrain: { type: "MARSH" },
				entities: [{ type: "PRISON_CAGE", position: [0, 0, 0], id: "cage-1" }],
				objectives: [{ id: "rescue", type: "rescue", text: "Rescue", target: "cage-1" }],
				drivers: [{ id: "prison-rescue", config: { characterId: "whiskers" } }],
			};
			const errors = crossValidateChunkDDL(chunk);
			expect(errors).toHaveLength(0);
		});
	});
});
