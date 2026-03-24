/**
 * Scenario System
 *
 * Runs ScenarioEngine.evaluate() each frame, bridging the
 * scenario engine with the game's ECS world state.
 */

import type { ScenarioEngine, ScenarioWorldQuery } from "../scenarios/engine";

/**
 * Tick the scenario engine with current world state.
 * Call this once per frame from the game loop.
 *
 * @param engine - The active ScenarioEngine for the current mission
 * @param worldQuery - Adapter that reads ECS world state for the engine
 */
export function scenarioSystem(engine: ScenarioEngine, worldQuery: ScenarioWorldQuery): void {
	engine.evaluate(worldQuery);
}
