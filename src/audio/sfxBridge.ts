/**
 * SFX Event Bridge — wires EventBus gameplay events to AudioEngine.playSFX().
 *
 * US-030: Every gameplay action emits an EventBus event, and the bridge
 * translates it into the correct SFX call. This keeps game systems
 * decoupled from audio implementation.
 *
 * Events wired:
 *   - unit-selected        -> unitSelect (click/chirp)
 *   - move-command          -> unitMove (confirmation beep)
 *   - attack-command        -> unitAttack (aggressive chirp)
 *   - melee-hit             -> meleeHit (thud/impact)
 *   - ranged-fire           -> rangedFire (twang/thwip)
 *   - gather-command        -> resourceGather | gatherWood | gatherFish | gatherSalvage
 *   - resource-deposited    -> resourceDeposit (register/ding)
 *   - building-placed       -> buildStart (stamp/thunk)
 *   - building-complete     -> buildComplete (fanfare)
 *   - training-complete     -> trainingComplete (horn/bugle)
 *   - research-complete     -> researchComplete (discovery chime)
 *   - error-action          -> errorAction (buzz/error tone)
 *   - unit-died             -> unitDeath (brief death sound)
 */

import { EventBus } from "@/game/EventBus";
import type { AudioEngine } from "./engine";
import type { SFXType } from "./sfx";

/** Map of resource types to specialized gather SFX. */
const GATHER_SFX: Record<string, SFXType> = {
	timber: "gatherWood",
	fish: "gatherFish",
	salvage: "gatherSalvage",
};

/**
 * Install EventBus listeners that route gameplay events to AudioEngine.playSFX().
 * Returns a teardown function to remove all listeners.
 */
export function installSFXBridge(engine: AudioEngine): () => void {
	const play = (type: SFXType) => engine.playSFX(type);

	const onUnitSelected = () => play("unitSelect");
	const onMoveCommand = () => play("unitMove");
	const onAttackCommand = () => play("unitAttack");
	const onMeleeHit = () => play("meleeHit");
	const onRangedFire = () => play("rangedFire");
	const onGatherCommand = (data?: { resourceType?: string }) => {
		const sfx = (data?.resourceType && GATHER_SFX[data.resourceType]) || "resourceGather";
		play(sfx);
	};
	const onResourceDeposited = () => play("resourceDeposit");
	const onBuildingPlaced = () => play("buildStart");
	const onBuildingComplete = () => play("buildComplete");
	const onTrainingComplete = () => play("trainingComplete");
	const onResearchComplete = () => play("researchComplete");
	const onErrorAction = () => play("errorAction");
	const onUnitDied = () => play("unitDeath");
	const onHudAlert = (data?: { severity?: string }) => {
		if (data?.severity === "warning" || data?.severity === "critical") {
			play("errorAction");
		}
	};

	EventBus.on("unit-selected", onUnitSelected);
	EventBus.on("move-command", onMoveCommand);
	EventBus.on("attack-command", onAttackCommand);
	EventBus.on("melee-hit", onMeleeHit);
	EventBus.on("ranged-fire", onRangedFire);
	EventBus.on("gather-command", onGatherCommand);
	EventBus.on("resource-deposited", onResourceDeposited);
	EventBus.on("building-placed", onBuildingPlaced);
	EventBus.on("building-complete", onBuildingComplete);
	EventBus.on("training-complete", onTrainingComplete);
	EventBus.on("research-complete", onResearchComplete);
	EventBus.on("error-action", onErrorAction);
	EventBus.on("unit-died", onUnitDied);
	EventBus.on("hud-alert", onHudAlert);

	return () => {
		EventBus.off("unit-selected", onUnitSelected);
		EventBus.off("move-command", onMoveCommand);
		EventBus.off("attack-command", onAttackCommand);
		EventBus.off("melee-hit", onMeleeHit);
		EventBus.off("ranged-fire", onRangedFire);
		EventBus.off("gather-command", onGatherCommand);
		EventBus.off("resource-deposited", onResourceDeposited);
		EventBus.off("building-placed", onBuildingPlaced);
		EventBus.off("building-complete", onBuildingComplete);
		EventBus.off("training-complete", onTrainingComplete);
		EventBus.off("research-complete", onResearchComplete);
		EventBus.off("error-action", onErrorAction);
		EventBus.off("unit-died", onUnitDied);
		EventBus.off("hud-alert", onHudAlert);
	};
}
