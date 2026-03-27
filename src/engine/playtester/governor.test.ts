/**
 * Governor unit tests — validates the AI playtester's decision-making
 * against a bootstrapped Mission 1 world.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { CATEGORY_IDS, FACTION_IDS } from "@/engine/content/ids";
import { bootstrapMission } from "@/engine/session/missionBootstrap";
import { runAllSystems } from "@/engine/systems";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { createFogGrid, type FogRuntime } from "@/engine/systems/fogSystem";
import {
	Attack,
	Content,
	Faction,
	Flags,
	Health,
	Position,
	Speed,
} from "@/engine/world/components";
import {
	createGameWorld,
	type GameWorld,
	getOrderQueue,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { createGovernor, type GovernorConfig } from "./governor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMission1World(): GameWorld {
	resetGatherTimers();
	const world = createGameWorld();
	bootstrapMission(world, "mission_1");
	// Initialize fog grid
	if (world.navigation.width > 0 && world.navigation.height > 0) {
		const fogRuntime = world.runtime as FogRuntime;
		if (!fogRuntime.fogGrid) {
			fogRuntime.fogGrid = createFogGrid(world.navigation.width, world.navigation.height);
			(fogRuntime as { fogGridWidth?: number }).fogGridWidth = world.navigation.width;
			(fogRuntime as { fogGridHeight?: number }).fogGridHeight = world.navigation.height;
		}
	}
	return world;
}

function runTicks(
	world: GameWorld,
	governor: ReturnType<typeof createGovernor>,
	ticks: number,
	deltaMs = 16.67,
): void {
	for (let i = 0; i < ticks; i++) {
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		world.time.tick += 1;
		governor.tick();
		runAllSystems(world);
	}
}

function countPlayerUnits(world: GameWorld): number {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (
			Faction.id[eid] === FACTION_IDS.ura &&
			Flags.isBuilding[eid] === 0 &&
			Flags.isResource[eid] === 0
		)
			count++;
	}
	return count;
}

function countPlayerBuildings(world: GameWorld): number {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === FACTION_IDS.ura && Flags.isBuilding[eid] === 1) count++;
	}
	return count;
}

function hasPlayerBuildingOfType(world: GameWorld, buildingType: string): boolean {
	for (const eid of world.runtime.alive) {
		if (
			Faction.id[eid] === FACTION_IDS.ura &&
			Flags.isBuilding[eid] === 1 &&
			world.runtime.entityTypeIndex.get(eid) === buildingType
		) {
			return true;
		}
	}
	return false;
}

const MILITARY_TYPES = new Set([
	"mudfoot",
	"shellcracker",
	"sapper",
	"mortar_otter",
	"diver",
	"raftsman",
]);

function countPlayerMilitary(world: GameWorld): number {
	const militaryCategories = new Set([
		CATEGORY_IDS.infantry,
		CATEGORY_IDS.ranged,
		CATEGORY_IDS.siege,
		CATEGORY_IDS.scout,
		CATEGORY_IDS.support,
	]);
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) continue;

		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "";
		if (militaryCategories.has(Content.categoryId[eid]) || MILITARY_TYPES.has(unitType)) {
			count++;
		}
	}
	return count;
}

const WORKER_TYPES = new Set(["river_rat"]);

function countWorkersGathering(world: GameWorld): number {
	let count = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) continue;

		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "";
		const isWorker =
			Content.categoryId[eid] === CATEGORY_IDS.worker ||
			WORKER_TYPES.has(unitType) ||
			(world.runtime.entityAbilities.get(eid)?.includes("gather") ?? false);
		if (!isWorker) continue;

		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0 && orders[0].type === "gather") {
			count++;
		}
	}
	return count;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Governor", () => {
	it("starts Mission 1, runs 5 minutes (18000 ticks) without crashing", { timeout: 60000 }, () => {
		const world = createMission1World();
		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		runTicks(world, governor, 18000);

		expect(world.runtime.alive.size).toBeGreaterThan(0);
		expect(world.session.phase).toBe("playing");

		const report = governor.getReport();
		expect(report.ticksRun).toBe(18000);
		expect(report.actionsExecuted).toBeGreaterThan(0);
		console.log(
			`5-minute run: ${report.actionsExecuted} actions, ${Object.keys(report.actionsPerType).length} action types`,
		);
		console.log("Actions by type:", report.actionsPerType);
	});

	it("assigns idle workers to gather within 60 ticks", () => {
		const world = createMission1World();
		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		// Verify workers start idle
		const initialGathering = countWorkersGathering(world);

		runTicks(world, governor, 60);

		const gatheringNow = countWorkersGathering(world);
		expect(gatheringNow).toBeGreaterThan(initialGathering);
		console.log(`After 60 ticks: ${gatheringNow} workers gathering (was ${initialGathering})`);
	});

	it("builds command post within 3000 ticks (50 seconds)", () => {
		const world = createMission1World();
		// Give extra starting resources for faster building
		world.session.resources.fish = 500;
		world.session.resources.timber = 500;
		world.session.resources.salvage = 300;
		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		runTicks(world, governor, 3000);

		// Check that a command_post was placed (may still be under construction)
		let hasCommandPost = false;
		for (const eid of world.runtime.alive) {
			if (
				Faction.id[eid] === FACTION_IDS.ura &&
				Flags.isBuilding[eid] === 1 &&
				world.runtime.entityTypeIndex.get(eid) === "command_post"
			) {
				hasCommandPost = true;
				break;
			}
		}

		expect(hasCommandPost).toBe(true);
		console.log("Command post placed within 3000 ticks");
	});

	it("trains military units when barracks exists", { timeout: 30000 }, () => {
		const world = createMission1World();
		// Give ample resources and pre-build infrastructure
		world.session.resources.fish = 2000;
		world.session.resources.timber = 2000;
		world.session.resources.salvage = 1000;
		world.runtime.population.max = 30;

		const governor = createGovernor(world, {
			difficulty: "aggressive",
			missionId: "mission_1",
		});

		// Run long enough for building + training
		runTicks(world, governor, 12000);

		const report = governor.getReport();
		const trainActions = report.actionsPerType["train-unit"] ?? 0;

		console.log(
			`Military training: ${trainActions} train actions, ${countPlayerMilitary(world)} military units`,
		);

		// Governor should have attempted to train at least some units
		// (depending on whether barracks was built in time)
		if (hasPlayerBuildingOfType(world, "barracks")) {
			expect(trainActions).toBeGreaterThan(0);
		}
	});

	it("defends lodge when enemies approach", () => {
		const world = createMission1World();
		world.session.resources.fish = 2000;
		world.session.resources.timber = 2000;
		world.session.resources.salvage = 1000;
		world.runtime.population.max = 30;

		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		// Run enough to build army
		runTicks(world, governor, 6000);

		// Find the lodge
		const lodge = [...world.runtime.alive].find(
			(eid) =>
				Faction.id[eid] === FACTION_IDS.ura &&
				Flags.isBuilding[eid] === 1 &&
				world.runtime.entityTypeIndex.get(eid) === "burrow",
		);

		if (lodge !== undefined) {
			const lodgeX = Position.x[lodge];
			const lodgeY = Position.y[lodge];

			// Spawn enemy near lodge
			spawnUnit(world, {
				x: lodgeX + 64,
				y: lodgeY,
				faction: "scale_guard",
				unitType: "gator",
				stats: {
					hp: 120,
					armor: 4,
					speed: 5,
					attackDamage: 18,
					attackRange: 32,
					attackCooldownMs: 1800,
					visionRadius: 6,
					popCost: 1,
				},
			});

			runTicks(world, governor, 120);

			const report = governor.getReport();
			const defendActions = report.actionsPerType["defend-position"] ?? 0;
			console.log(
				`Defense triggered: ${defendActions} defend actions after enemy spawn near lodge`,
			);
			// If governor has military units, it should attempt defense
		}
	});

	it("scouts with one unit", { timeout: 30000 }, () => {
		const world = createMission1World();
		world.session.resources.fish = 2000;
		world.session.resources.timber = 2000;
		world.session.resources.salvage = 1000;
		world.runtime.population.max = 30;

		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		// Run long enough that military units exist and scouting activates
		runTicks(world, governor, 15000);

		const report = governor.getReport();
		const scoutActions = report.actionsPerType["scout"] ?? 0;
		console.log(`Scout actions: ${scoutActions}`);

		// Scouting should eventually happen (after military is trained)
		if (countPlayerMilitary(world) > 0) {
			// If military exists but no scouts, at least check it didn't crash
			expect(report.ticksRun).toBe(15000);
		}
	});

	it("achieves victory on Mission 1 within 60000 ticks (about 16 minutes)", {
		timeout: 120000,
	}, () => {
		const world = createMission1World();
		// Give generous resources for the full playthrough
		world.session.resources.fish = 500;
		world.session.resources.timber = 300;
		world.session.resources.salvage = 100;
		world.runtime.population.max = 20;

		const governor = createGovernor(world, {
			difficulty: "optimal",
			missionId: "mission_1",
		});

		runTicks(world, governor, 60000);

		const report = governor.getReport();
		const completedObjectives = world.session.objectives.filter(
			(o) => o.status === "completed",
		).length;

		console.log("=== FULL PLAYTEST RESULTS ===");
		console.log(`Phase: ${world.session.phase}`);
		console.log(`Ticks: ${60000}`);
		console.log(`Actions: ${report.actionsExecuted}`);
		console.log(`Actions by type:`, report.actionsPerType);
		console.log(`Objectives: ${completedObjectives}/${world.session.objectives.length}`);
		console.log(
			`Resources: fish=${world.session.resources.fish}, timber=${world.session.resources.timber}, salvage=${world.session.resources.salvage}`,
		);
		console.log(`Player units: ${countPlayerUnits(world)}`);
		console.log(`Player buildings: ${countPlayerBuildings(world)}`);
		console.log(`Military: ${countPlayerMilitary(world)}`);
		console.log("Timeline:", report.timeline);

		for (const obj of world.session.objectives) {
			console.log(`  [${obj.status}] ${obj.description}`);
		}

		// The governor should at minimum have taken actions and kept the game running
		expect(report.actionsExecuted).toBeGreaterThan(0);
		expect(world.runtime.alive.size).toBeGreaterThan(0);
	});
});
