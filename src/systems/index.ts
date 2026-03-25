/**
 * Systems Module - Game Systems and Procedural Generation
 *
 * This module contains:
 * - Procedural Assembly System (structures, settlements, weapons)
 * - AI System (enemy FSM decision loop)
 * - Game Loop (master system orchestrator)
 */

export * from "./assembly";
export { aiSystem, cleanupAIRunners, resetAIRunners } from "./aiSystem";
export { tickAllSystems } from "./gameLoop";
