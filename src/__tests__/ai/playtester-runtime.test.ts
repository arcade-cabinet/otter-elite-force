import { createWorld } from "koota";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AIPlaytester,
	createKootaGameStateReader,
	createScenePlaytester,
	type PlayerPerception,
	runUntilComplete,
} from "@/ai/playtester";
import { pressKey } from "@/ai/playtester/input";
import { initSingletons } from "@/ecs/singletons";
import { GameClock, PopulationState, ResourcePool } from "@/ecs/traits/state";

const executeActionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/ai/playtester/input", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/ai/playtester/input")>();
	return {
		...actual,
		executeAction: executeActionMock,
	};
});

function makeCanvas(): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 800;
	canvas.height = 600;
	canvas.getBoundingClientRect = () => ({
		left: 0,
		top: 0,
		right: 800,
		bottom: 600,
		width: 800,
		height: 600,
		x: 0,
		y: 0,
		toJSON: () => {},
	});
	return canvas;
}

function makeFog() {
	return {
		getFogState: () => ({ explored: true, visible: true }),
	};
}

describe("playtester runtime", () => {
	beforeEach(() => {
		executeActionMock.mockClear();
	});

	it("createKootaGameStateReader reads singleton resource, population, and game clock state", () => {
		const world = createWorld();
		initSingletons(world);
		world.set(ResourcePool, { fish: 120, timber: 45, salvage: 30 });
		world.set(PopulationState, { current: 7, max: 18 });
		world.set(GameClock, { elapsedMs: 6543, lastDeltaMs: 16, tick: 20, paused: false });

		const reader = createKootaGameStateReader(world);

		expect(reader.getResources()).toEqual({ fish: 120, timber: 45, salvage: 30 });
		expect(reader.getPopulation()).toEqual({ current: 7, max: 18 });
		expect(reader.getGameTime()).toBeCloseTo(6.543, 3);

		world.destroy();
	});

	it("AIPlaytester.tick uses game-state time when no explicit timestamp is supplied", async () => {
		const world = createWorld();
		initSingletons(world);
		world.set(GameClock, { elapsedMs: 2500, lastDeltaMs: 16, tick: 150, paused: false });

		const stateReader = createKootaGameStateReader(world);
		const ai = new AIPlaytester(makeCanvas(), world, makeFog() as never, stateReader, 4, 4, {
			apm: 120,
			minActionGap: 2000,
			errorRate: 0,
			maxMisclickOffset: 0,
		});

		ai.brain.arbitrate = vi.fn();
		ai.brain.execute = vi.fn(() => [pressKey("1")]);

		await ai.tick();
		expect(executeActionMock).toHaveBeenCalledTimes(1);

		world.set(GameClock, { elapsedMs: 3000, lastDeltaMs: 16, tick: 181, paused: false });
		await ai.tick();
		expect(executeActionMock).toHaveBeenCalledTimes(1);

		world.set(GameClock, { elapsedMs: 5001, lastDeltaMs: 16, tick: 312, paused: false });
		await ai.tick();
		expect(executeActionMock).toHaveBeenCalledTimes(2);

		world.destroy();
	});

	it("runUntilComplete supports injected runner timing for deterministic harnesses", async () => {
		let now = 100;
		let ticks = 0;
		let lastPerception: PlayerPerception | null = null;
		const tickArgs: Array<number | undefined> = [];

		const ai = {
			tick: vi.fn(async (currentNow?: number) => {
				tickArgs.push(currentNow);
				ticks += 1;
				lastPerception = {
					viewport: { x: 0, y: 0, width: 1, height: 1 },
					exploredTiles: new Set(),
					visibleTiles: new Set(),
					resources: { fish: 0, timber: 0, salvage: 0 },
					population: { current: 0, max: 0 },
					selectedUnits: [],
					selectedBuildings: [],
					visibleFriendlyUnits: [],
					visibleEnemyUnits: [],
					visibleBuildings: [],
					visibleResources: [],
					minimapDots: [],
					gameTime: currentNow ? currentNow / 1000 : 0,
					mapCols: 1,
					mapRows: 1,
				};
			}),
			getLastPerception: () => lastPerception,
			getStats: () => ({ ticks, actions: 3 }),
		} as unknown as AIPlaytester;

		const result = await runUntilComplete(ai, () => (ticks >= 2 ? "victory" : null), {
			maxTicks: 5,
			tickInterval: 50,
			now: () => now,
			sleep: async (ms) => {
				now += ms;
			},
		});

		expect(tickArgs).toEqual([100, 150]);
		expect(result.outcome).toBe("victory");
		expect(result.ticks).toBe(2);
		expect(result.actionsPerformed).toBe(3);
	});

	it("createScenePlaytester builds a playtester from a scene host and Koota singleton state", () => {
		const world = createWorld();
		initSingletons(world);
		const host = {
			getFogSystem: () => makeFog() as never,
			getMapDimensions: () => ({ cols: 48, rows: 40 }),
			getSceneCanvas: () => makeCanvas(),
			scale: { width: 1280, height: 720 },
		};

		const ai = createScenePlaytester(host, world, { rearbitrateInterval: 5 });

		ai.scrollTo(12, 8);
		const perception = (
			ai as unknown as { getViewport(): { x: number; y: number; width: number; height: number } }
		).getViewport();
		expect(perception.width).toBe(1280);
		expect(perception.height).toBe(720);
		expect(perception.x).toBe(12 * 32 - 640);
		expect(perception.y).toBe(8 * 32 - 360);

		world.destroy();
	});
});
