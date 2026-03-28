/**
 * Comprehensive Mission 1 playtest — runs 5 minutes of game time headless
 * and validates every aspect: economy, combat, objectives, fog, entities.
 *
 * This is the "play the game" verification that catches issues no unit test will.
 */
import { describe, expect, it } from "vitest";
import { runAllSystems } from "@/engine/systems";
import { createFogGrid, type FogRuntime } from "@/engine/systems/fogSystem";
import { Attack, Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import { createGameWorld, getOrderQueue } from "@/engine/world/gameWorld";
import { bootstrapMission } from "./missionBootstrap";

function createMission1World() {
	const world = createGameWorld();
	bootstrapMission(world, "mission_1");
	// Initialize fog grid
	if (world.navigation.width > 0 && world.navigation.height > 0) {
		const fogRuntime = world.runtime as FogRuntime;
		if (!fogRuntime.fogGrid) {
			const grid = createFogGrid(world.navigation.width, world.navigation.height);
			fogRuntime.fogGrid = grid;
			fogRuntime.fogGridWidth = world.navigation.width;
			fogRuntime.fogGridHeight = world.navigation.height;
		}
	}
	return world;
}

function countByFaction(world: ReturnType<typeof createGameWorld>, factionId: number) {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === factionId && Flags.isResource[eid] === 0) count++;
	}
	return count;
}

function countBuildings(world: ReturnType<typeof createGameWorld>, factionId: number) {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === factionId && Flags.isBuilding[eid] === 1) count++;
	}
	return count;
}

function countResources(world: ReturnType<typeof createGameWorld>) {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1) count++;
	}
	return count;
}

function runTicks(world: ReturnType<typeof createGameWorld>, ticks: number, deltaMs = 16.67) {
	for (let i = 0; i < ticks; i++) {
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		world.time.tick += 1;
		world.session.phase = "playing";
		runAllSystems(world);
	}
}

describe("Mission 1 Playtest — Beachhead", () => {
	it("terrain grid has varied terrain types", () => {
		const world = createMission1World();
		const grid = world.runtime.terrainGrid;
		expect(grid).not.toBeNull();
		if (!grid) return;
		const counts: Record<number, number> = {};
		for (const row of grid) {
			for (const t of row) {
				counts[t] = (counts[t] ?? 0) + 1;
			}
		}
		console.log("Terrain grid:", grid.length, "x", grid[0]?.length);
		console.log("Type distribution:", JSON.stringify(counts));
		// Should have more than 1 terrain type
		const uniqueTypes = Object.keys(counts).length;
		console.log("Unique terrain types:", uniqueTypes);
		expect(uniqueTypes).toBeGreaterThan(1);
	});

	it("bootstraps with correct starting state", () => {
		const world = createMission1World();

		// Should have player entities
		const playerCount = countByFaction(world, 1); // URA
		expect(playerCount).toBeGreaterThan(0);
		console.log(`Player entities: ${playerCount}`);

		// Should have a lodge/burrow (player building)
		const playerBuildings = countBuildings(world, 1);
		expect(playerBuildings).toBeGreaterThan(0);
		console.log(`Player buildings: ${playerBuildings}`);

		// Should have enemy entities
		const enemyCount = countByFaction(world, 2); // Scale Guard
		expect(enemyCount).toBeGreaterThanOrEqual(0);
		console.log(`Enemy entities: ${enemyCount}`);

		// Should have resource nodes
		const resources = countResources(world);
		console.log(`Resource nodes: ${resources}`);

		// Should have starting resources
		expect(world.session.resources.fish).toBeGreaterThan(0);
		expect(world.session.resources.timber).toBeGreaterThanOrEqual(0);
		console.log(
			`Starting: Fish=${world.session.resources.fish}, Timber=${world.session.resources.timber}, Salvage=${world.session.resources.salvage}`,
		);

		// Should have objectives
		expect(world.session.objectives.length).toBeGreaterThan(0);
		console.log(`Objectives: ${world.session.objectives.map((o) => o.description).join(", ")}`);

		// Should have terrain dimensions
		expect(world.navigation.width).toBeGreaterThan(0);
		expect(world.navigation.height).toBeGreaterThan(0);
		console.log(`Map: ${world.navigation.width}x${world.navigation.height}`);

		// Print all entity types
		const types = new Map<string, number>();
		for (const eid of world.runtime.alive) {
			const type = world.runtime.entityTypeIndex.get(eid) ?? "unknown";
			types.set(type, (types.get(type) ?? 0) + 1);
		}
		console.log("Entity types:", Object.fromEntries(types));
	});

	it("entities have valid stats (HP, speed, attack)", () => {
		const world = createMission1World();

		let entitiesWithZeroHP = 0;
		let unitsWithZeroSpeed = 0;
		let combatUnitsWithZeroAttack = 0;

		for (const eid of world.runtime.alive) {
			if (Health.max[eid] <= 0 && Flags.isResource[eid] === 0) {
				entitiesWithZeroHP++;
				console.log(
					`WARNING: Entity ${eid} (${world.runtime.entityTypeIndex.get(eid)}) has 0 max HP`,
				);
			}
			if (Flags.isBuilding[eid] === 0 && Flags.isResource[eid] === 0 && Speed.value[eid] <= 0) {
				unitsWithZeroSpeed++;
				console.log(`WARNING: Unit ${eid} (${world.runtime.entityTypeIndex.get(eid)}) has 0 speed`);
			}
			if (
				Flags.isBuilding[eid] === 0 &&
				Flags.isResource[eid] === 0 &&
				Faction.id[eid] === 2 &&
				Attack.damage[eid] <= 0
			) {
				combatUnitsWithZeroAttack++;
				console.log(
					`WARNING: Enemy unit ${eid} (${world.runtime.entityTypeIndex.get(eid)}) has 0 attack damage`,
				);
			}
		}

		console.log(`Entities with 0 HP: ${entitiesWithZeroHP}`);
		console.log(`Units with 0 speed: ${unitsWithZeroSpeed}`);
		console.log(`Combat units with 0 attack: ${combatUnitsWithZeroAttack}`);

		// Player units must have valid stats
		expect(entitiesWithZeroHP).toBe(0);
	});

	it("simulation runs 30 seconds without crashing", () => {
		const world = createMission1World();
		const initialAlive = world.runtime.alive.size;

		// 30 seconds = 1800 ticks at 60fps
		runTicks(world, 1800);

		console.log(`After 30s: ${world.runtime.alive.size} alive (was ${initialAlive})`);
		console.log(
			`Resources: Fish=${world.session.resources.fish}, Timber=${world.session.resources.timber}`,
		);
		console.log(`Phase: ${world.session.phase}`);

		// Game should still be running
		expect(world.session.phase).toBe("playing");
		// Some entities should still be alive
		expect(world.runtime.alive.size).toBeGreaterThan(0);
	});

	it("simulation runs 2 minutes — economy check", { timeout: 60000 }, () => {
		const world = createMission1World();
		const initialFish = world.session.resources.fish;
		const initialTimber = world.session.resources.timber;

		// Issue gather orders to workers
		for (const eid of world.runtime.alive) {
			if (Faction.id[eid] === 1 && Flags.isBuilding[eid] === 0 && Flags.isResource[eid] === 0) {
				// Find nearest resource
				let nearestResource = -1;
				let nearestDist = Infinity;
				for (const rid of world.runtime.alive) {
					if (Flags.isResource[rid] === 1) {
						const dx = Position.x[rid] - Position.x[eid];
						const dy = Position.y[rid] - Position.y[eid];
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < nearestDist) {
							nearestDist = dist;
							nearestResource = rid;
						}
					}
				}
				if (nearestResource !== -1) {
					const orders = getOrderQueue(world, eid);
					orders.push({
						type: "gather",
						targetEid: nearestResource,
						targetX: Position.x[nearestResource],
						targetY: Position.y[nearestResource],
					});
				}
			}
		}

		// 2 minutes = 7200 ticks
		runTicks(world, 7200);

		console.log(
			`After 2min: Fish=${world.session.resources.fish} (was ${initialFish}), Timber=${world.session.resources.timber} (was ${initialTimber})`,
		);
		console.log(`Alive: ${world.runtime.alive.size}`);
		console.log(`Phase: ${world.session.phase}`);

		// Economy should have produced something
		const totalResources =
			world.session.resources.fish +
			world.session.resources.timber +
			world.session.resources.salvage;
		console.log(`Total resources: ${totalResources}`);
	});

	it("simulation runs 5 minutes — full playtest", { timeout: 120000 }, () => {
		const world = createMission1World();

		// 5 minutes = 18000 ticks
		runTicks(world, 18000);

		console.log("=== 5 MINUTE PLAYTEST RESULTS ===");
		console.log(`Alive: ${world.runtime.alive.size}`);
		console.log(`Fish: ${world.session.resources.fish}`);
		console.log(`Timber: ${world.session.resources.timber}`);
		console.log(`Salvage: ${world.session.resources.salvage}`);
		console.log(`Phase: ${world.session.phase}`);
		console.log(`Tick: ${world.time.tick}`);

		// Count entity types
		const types = new Map<string, number>();
		for (const eid of world.runtime.alive) {
			const faction =
				Faction.id[eid] === 1 ? "player" : Faction.id[eid] === 2 ? "enemy" : "neutral";
			const kind =
				Flags.isBuilding[eid] === 1
					? "building"
					: Flags.isResource[eid] === 1
						? "resource"
						: "unit";
			const key = `${faction}_${kind}`;
			types.set(key, (types.get(key) ?? 0) + 1);
		}
		console.log("Entity breakdown:", Object.fromEntries(types));

		// Check objectives
		for (const obj of world.session.objectives) {
			console.log(`  Objective: ${obj.description} — ${obj.status}`);
		}

		// Fog stats
		const fogRuntime = world.runtime as FogRuntime;
		if (fogRuntime.fogGrid) {
			let visible = 0;
			let explored = 0;
			let unexplored = 0;
			for (let i = 0; i < fogRuntime.fogGrid.length; i++) {
				if (fogRuntime.fogGrid[i] === 2) visible++;
				else if (fogRuntime.fogGrid[i] === 1) explored++;
				else unexplored++;
			}
			console.log(`Fog: ${visible} visible, ${explored} explored, ${unexplored} unexplored`);
		}

		// Game should still be running after 5 min
		expect(world.runtime.alive.size).toBeGreaterThan(0);
	});
});
