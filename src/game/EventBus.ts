import Phaser from "phaser";

/**
 * EventBus — shared Phaser EventEmitter for scene lifecycle signals.
 *
 * Events:
 *   - "current-scene-ready" (scene: Phaser.Scene)
 *   - "boot-complete"
 *   - "scene-ready"
 *   - "mission-complete" (data: { missionId, stars, stats })
 *   - "mission-failed"  (data: { reason })
 */
export const EventBus = new Phaser.Events.EventEmitter();
