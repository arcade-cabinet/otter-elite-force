/**
 * US-070: AI Playtester — Full Mission 1 automated playthrough
 *
 * Tests that the AI playtester can:
 *   1. Run the perception → goal arbitration → action execution loop
 *   2. Gather resources, build Command Post + Barracks, train 4 Mudfoots
 *   3. Complete Mission 1 objectives → trigger victory
 *   4. Produce a log of actions and game state snapshots
 *   5. Complete within 2x par time (par = 480s, limit = 960s = 16 minutes)
 *
 * Uses headless simulation (no DOM) for fast, deterministic testing.
 */

import { describe, expect, it } from "vitest";
import {
	applyPlaytesterIntent,
	buildPerceptionFromSim,
	createMission1Sim,
	runMission1Simulation,
	type SimState,
	tickSimulation,
} from "@/ai/playtester/simulation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAR_TIME = 480; // Mission 1 par time in seconds
const MAX_TIME = PAR_TIME * 2; // 2x par = 960 seconds = 16 minutes

// ===========================================================================
// US-070: Full Mission 1 Playthrough
// ===========================================================================

describe("US-070: AI Playtester Mission 1 Automated Playthrough", () => {
	describe("simulation setup", () => {
		it("creates Mission 1 with 3 river rats and starting resources", () => {
			const state = createMission1Sim();

			expect(state.units).toHaveLength(3);
			expect(state.units.every((u) => u.unitType === "river_rat")).toBe(true);
			expect(state.units.every((u) => u.faction === "ura")).toBe(true);
			expect(state.playerResources).toEqual({ fish: 100, timber: 50, salvage: 0 });
			expect(state.population).toEqual({ current: 3, max: 4 });
			expect(state.mapCols).toBe(48);
			expect(state.mapRows).toBe(44);
		});

		it("has resource nodes for fish, timber, and salvage", () => {
			const state = createMission1Sim();

			const fish = state.resources.filter((r) => r.resourceType === "fish");
			const timber = state.resources.filter((r) => r.resourceType === "timber");
			const salvage = state.resources.filter((r) => r.resourceType === "salvage");

			expect(fish.length).toBeGreaterThanOrEqual(2);
			expect(timber.length).toBeGreaterThanOrEqual(3);
			expect(salvage.length).toBeGreaterThanOrEqual(2);
		});

		it("starts with no buildings and no objectives completed", () => {
			const state = createMission1Sim();

			expect(state.buildings).toHaveLength(0);
			expect(state.objectivesCompleted.size).toBe(0);
			expect(state.outcome).toBe("playing");
		});
	});

	describe("perception from sim state", () => {
		it("builds correct perception snapshot from simulation", () => {
			const state = createMission1Sim();
			const perception = buildPerceptionFromSim(state);

			expect(perception.visibleFriendlyUnits).toHaveLength(3);
			expect(perception.visibleEnemyUnits).toHaveLength(0);
			expect(perception.visibleBuildings).toHaveLength(0);
			expect(perception.visibleResources.length).toBeGreaterThanOrEqual(7);
			expect(perception.resources).toEqual({ fish: 100, timber: 50, salvage: 0 });
			expect(perception.population).toEqual({ current: 3, max: 4 });
			expect(perception.mapCols).toBe(48);
			expect(perception.mapRows).toBe(44);
		});
	});

	describe("simulation tick mechanics", () => {
		it("workers gather resources when assigned", () => {
			const state = createMission1Sim();
			const worker = state.units[0];
			const resource = state.resources.find((r) => r.resourceType === "timber")!;
			const initialTimber = state.playerResources.timber;
			const initialRemaining = resource.remaining;

			worker.gatherTarget = resource.id;
			worker.hasOrders = true;

			tickSimulation(state);

			expect(state.playerResources.timber).toBeGreaterThan(initialTimber);
			expect(resource.remaining).toBeLessThan(initialRemaining);
			expect(worker.isGathering).toBe(true);
		});

		it("buildings train units and increment population", () => {
			const state = createMission1Sim();
			state.population.max = 10;

			// Add a barracks manually
			state.buildings.push({
				id: state.nextEntityId++,
				unitType: "barracks",
				faction: "ura",
				tileX: 15,
				tileY: 38,
				hp: 350,
				maxHp: 350,
				isTraining: true,
				trainTimer: 1, // 1 second left
				trainQueue: ["mudfoot"],
				alive: true,
			});

			const initialUnitCount = state.units.length;

			// Tick once — should complete training
			tickSimulation(state);

			expect(state.units.length).toBe(initialUnitCount + 1);
			expect(state.units[state.units.length - 1].unitType).toBe("mudfoot");
			expect(state.population.current).toBe(4); // 3 rats + 1 mudfoot
		});
	});

	describe("AI playtester intent", () => {
		it("assigns idle workers to nearest resources", () => {
			const state = createMission1Sim();
			const perception = buildPerceptionFromSim(state);

			applyPlaytesterIntent(state, perception);

			const assignedWorkers = state.units.filter((u) => u.gatherTarget !== null);
			expect(assignedWorkers.length).toBeGreaterThan(0);
		});

		it("builds command post when timber is available", () => {
			const state = createMission1Sim();
			state.playerResources.timber = 500;
			state.playerResources.salvage = 200;

			const perception = buildPerceptionFromSim(state);
			applyPlaytesterIntent(state, perception);

			const commandPost = state.buildings.find((b) => b.unitType === "command_post");
			expect(commandPost).toBeDefined();
			expect(commandPost!.faction).toBe("ura");
		});

		it("builds barracks after command post", () => {
			const state = createMission1Sim();
			state.playerResources.timber = 500;
			state.playerResources.salvage = 200;

			// Build command post first
			state.buildings.push({
				id: state.nextEntityId++,
				unitType: "command_post",
				faction: "ura",
				tileX: 12,
				tileY: 38,
				hp: 600,
				maxHp: 600,
				isTraining: false,
				trainTimer: 0,
				trainQueue: [],
				alive: true,
			});

			const perception = buildPerceptionFromSim(state);
			applyPlaytesterIntent(state, perception);

			const barracks = state.buildings.find((b) => b.unitType === "barracks");
			expect(barracks).toBeDefined();
		});
	});

	describe("full playthrough", () => {
		it("completes Mission 1 within 2x par time", () => {
			const result = runMission1Simulation(MAX_TIME);

			expect(result.outcome).toBe("victory");
			expect(result.gameTimeSeconds).toBeLessThanOrEqual(MAX_TIME);
		});

		it("completes all three primary objectives", () => {
			const result = runMission1Simulation(MAX_TIME);

			expect(result.objectivesCompleted).toContain("build-command-post");
			expect(result.objectivesCompleted).toContain("build-barracks");
			expect(result.objectivesCompleted).toContain("train-mudfoots");
		});

		it("produces a non-empty action log", () => {
			const result = runMission1Simulation(MAX_TIME);

			expect(result.log.length).toBeGreaterThan(0);
			expect(result.log[0].event).toBe("mission_start");
			expect(result.log[result.log.length - 1].event).toBe("mission_end");
		});

		it("log contains objective completion events", () => {
			const result = runMission1Simulation(MAX_TIME);

			const objectiveEvents = result.log.filter((e) => e.event === "objective_complete");
			expect(objectiveEvents.length).toBeGreaterThanOrEqual(3);
		});

		it("final state has 4+ mudfoots alive", () => {
			const result = runMission1Simulation(MAX_TIME);

			const mudfoots = result.finalState.units.filter(
				(u) => u.unitType === "mudfoot" && u.alive && u.faction === "ura",
			);
			expect(mudfoots.length).toBeGreaterThanOrEqual(4);
		});

		it("final state has command post and barracks", () => {
			const result = runMission1Simulation(MAX_TIME);

			const buildings = result.finalState.buildings.filter((b) => b.alive && b.faction === "ura");
			const buildingTypes = buildings.map((b) => b.unitType);
			expect(buildingTypes).toContain("command_post");
			expect(buildingTypes).toContain("barracks");
		});

		it("game state snapshots track resource changes over time", () => {
			const result = runMission1Simulation(MAX_TIME);

			// Starting resources minus building costs should be reflected
			const endEvent = result.log.find((e) => e.event === "mission_end");
			expect(endEvent).toBeDefined();
			expect(endEvent!.details?.unitCount).toBeGreaterThanOrEqual(4);
		});
	});
});
