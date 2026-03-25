import Phaser from "phaser";

/**
 * EventBus — shared Phaser EventEmitter for scene lifecycle signals.
 *
 * Events:
 *   - "current-scene-ready" (scene: Phaser.Scene)
 *   - "boot-complete"
 *   - "scene-ready"
 *   - "command-transmission" ({ missionId, speaker, text, portrait?, duration? })
 *   - "hud-alert" ({ message, severity })
 *   - "start-build-placement" ({ workerEntityId, buildingId })
 *   - "objective-completed" ({ objectiveId, description })
 *   - "mission-complete" (data: { missionId, stars, stats })
 *   - "mission-failed"  (data: { reason })
 */
export const EventBus = new Phaser.Events.EventEmitter();
