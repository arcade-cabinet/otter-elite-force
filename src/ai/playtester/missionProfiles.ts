/**
 * US-101: Per-Mission GOAP Behavioral/Steering Profiles
 *
 * Composable GOAP goal graphs for each of the 16 campaign missions.
 * Each mission profile wires mission-specific evaluators and goals
 * into a PlaytesterBrain, producing different playtester behavior
 * per mission type (escort, stealth, wave defense, siege, etc.).
 *
 * Every profile uses the existing PlaytesterBrain / PlaytesterGoalEvaluator /
 * PlaytesterGoal class hierarchy. Mission-specific behavior comes from
 * custom evaluators that read PlayerPerception and produce desirability
 * scores tuned to each mission's objectives.
 *
 * Factory:
 *   const brain = createMissionPlaytesterBrain("mission_1");
 */

import {
	AttackNearestEnemyGoal,
	BuildEconomyGoal,
	CompositePlaytesterGoal,
	DefendBaseGoal,
	EconomyEvaluator,
	ExplorationEvaluator,
	GoalStatus,
	MilitaryEvaluator,
	ObjectiveEvaluator,
	OpenBuildMenuGoal,
	PlaceBuildingGoal,
	PlaytesterBrain,
	PlaytesterGoal,
	PlaytesterGoalEvaluator,
	ScoutMapGoal,
	SelectIdleWorkerGoal,
	SelectMilitaryUnitsGoal,
	SurviveEvaluator,
} from "./goals";
import type { PlayerAction } from "./input";
import { clickAtTile, rightClickAtTile } from "./input";
import type { PlayerPerception } from "./perception";
import {
	canAfford,
	countIdleWorkers,
	countMilitaryUnits,
	explorationProgress,
	findBuildings,
	isBaseUnderThreat,
} from "./perception";

// ============================================================================
// MISSION-SPECIFIC LEAF GOALS
// ============================================================================

/**
 * Move selected units toward a specific tile position.
 * Used for escort, zone capture, flag carry, and retreat behaviors.
 */
export class MoveToPositionGoal extends PlaytesterGoal {
	constructor(
		private targetX: number,
		private targetY: number,
	) {
		super();
	}

	execute(perception: PlayerPerception): PlayerAction[] {
		this.status = GoalStatus.COMPLETED;
		return [
			rightClickAtTile(this.targetX, this.targetY, perception.viewport.x, perception.viewport.y),
		];
	}
}

/**
 * Select a specific hero unit by type name.
 */
export class SelectHeroGoal extends PlaytesterGoal {
	constructor(private heroType: string) {
		super();
	}

	execute(perception: PlayerPerception): PlayerAction[] {
		const hero = perception.visibleFriendlyUnits.find((u) => u.unitType === this.heroType);
		if (!hero) {
			this.status = GoalStatus.FAILED;
			return [];
		}
		this.status = GoalStatus.COMPLETED;
		return [clickAtTile(hero.tileX, hero.tileY, perception.viewport.x, perception.viewport.y)];
	}
}

/**
 * Move units toward a convoy/escort target, staying within a leash radius.
 */
export class EscortConvoyGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		// Move toward the center of the map (convoy path midpoint)
		this.addSubgoal(new MoveToPositionGoal(24, 15));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Capture and hold a zone by moving squads to the zone center.
 */
export class CaptureZoneGoal extends CompositePlaytesterGoal {
	constructor(
		private zoneX: number,
		private zoneY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new MoveToPositionGoal(this.zoneX, this.zoneY));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Stealth movement: select hero and path around detection radii.
 * Moves toward a target while avoiding enemy buildings (detection towers).
 */
export class StealthMoveGoal extends CompositePlaytesterGoal {
	constructor(
		private heroType: string,
		private targetX: number,
		private targetY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectHeroGoal(this.heroType));
		this.addSubgoal(new MoveToPositionGoal(this.targetX, this.targetY));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Destroy a priority target — select military and attack enemies near a zone.
 */
export class DestroyTargetGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Fortify position: build defensive structures near base.
 */
export class FortifyBaseGoal extends CompositePlaytesterGoal {
	override activate(perception: PlayerPerception): void {
		this.clearSubgoals();
		const cp = findBuildings(perception, "command_post");
		if (cp.length > 0 && canAfford(perception, { timber: 120 })) {
			this.addSubgoal(new SelectIdleWorkerGoal());
			this.addSubgoal(new OpenBuildMenuGoal());
			this.addSubgoal(new PlaceBuildingGoal("t", cp[0].tileX + 3, cp[0].tileY));
		} else {
			this.status = GoalStatus.COMPLETED;
		}
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Retreat toward a safe position.
 */
export class RetreatGoal extends CompositePlaytesterGoal {
	constructor(
		private safeX: number,
		private safeY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new MoveToPositionGoal(this.safeX, this.safeY));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Carry a flag/item back to base — select unit near flag, move to base.
 */
export class FlagCarryGoal extends CompositePlaytesterGoal {
	constructor(
		private flagX: number,
		private flagY: number,
		private baseX: number,
		private baseY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		// Sequence: select -> grab flag -> return to base
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new MoveToPositionGoal(this.flagX, this.flagY));
		this.addSubgoal(new MoveToPositionGoal(this.baseX, this.baseY));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Cautious advance — scout then move military in explored territory.
 */
export class CautiousAdvanceGoal extends CompositePlaytesterGoal {
	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new ScoutMapGoal());
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Visit multiple map locations (liberation sweep).
 */
export class VisitLocationsGoal extends CompositePlaytesterGoal {
	constructor(private locations: Array<{ x: number; y: number }>) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		// Queue all locations in reverse (addSubgoal uses unshift)
		for (let i = this.locations.length - 1; i >= 0; i--) {
			this.addSubgoal(new MoveToPositionGoal(this.locations[i].x, this.locations[i].y));
		}
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Siege assault — breach walls and focus fire on buildings.
 */
export class SiegeAssaultGoal extends CompositePlaytesterGoal {
	constructor(
		private targetX: number,
		private targetY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new MoveToPositionGoal(this.targetX, this.targetY));
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Hero demolition — select sapper, move to target, place charges.
 */
export class HeroDemolitionGoal extends CompositePlaytesterGoal {
	constructor(
		private targetX: number,
		private targetY: number,
	) {
		super();
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		this.addSubgoal(new SelectHeroGoal("sapper"));
		this.addSubgoal(new MoveToPositionGoal(this.targetX, this.targetY));
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

/**
 * Phase-aware boss target switching — attack a specific boss target.
 */
export class BossPhaseGoal extends CompositePlaytesterGoal {
	readonly phase: number;

	constructor(phase: number) {
		super();
		this.phase = phase;
	}

	override activate(_perception: PlayerPerception): void {
		this.clearSubgoals();
		// All phases select military and attack, but phase determines priority weighting
		// Phase 1: focus fire on boss shields; Phase 2: minions; Phase 3: boss core
		this.addSubgoal(new SelectMilitaryUnitsGoal());
		this.addSubgoal(new AttackNearestEnemyGoal());
	}

	override execute(perception: PlayerPerception): PlayerAction[] {
		this.activateIfInactive(perception);
		const { status, actions } = this.executeSubgoals(perception);
		this.status = status;
		return actions;
	}
}

// ============================================================================
// MISSION-SPECIFIC EVALUATORS
// ============================================================================

/**
 * Escort evaluator: highest priority when convoy wagons need protection.
 * Keeps units near the convoy path.
 */
export class EscortEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.1) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		// Check for supply_wagon allies
		const wagons = perception.visibleFriendlyUnits.filter((u) => u.unitType === "supply_wagon");
		if (wagons.length > 0) return 0.9;
		// Even without visible wagons, escort is the primary mission
		return 0.5;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof EscortConvoyGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new EscortConvoyGoal());
		}
	}
}

/**
 * Zone capture evaluator: move squads to capture and hold zones.
 */
export class CaptureZoneEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private zoneX: number,
		private zoneY: number,
		bias = 1.0,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		if (militaryCount >= 3) return 0.8;
		if (militaryCount >= 1) return 0.5;
		return 0.2;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof CaptureZoneGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new CaptureZoneGoal(this.zoneX, this.zoneY));
		}
	}
}

/**
 * Stealth evaluator: highest priority in stealth missions.
 * Prefers avoidance over combat.
 */
export class StealthEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private heroType: string,
		private targetX: number,
		private targetY: number,
		bias = 1.2,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const hero = perception.visibleFriendlyUnits.find((u) => u.unitType === this.heroType);
		if (!hero) return 0;
		// High priority to move hero toward the objective
		const enemiesNear = perception.visibleEnemyUnits.length;
		if (enemiesNear === 0) return 0.9;
		// If enemies visible, still prioritize stealth movement
		return 0.7;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof StealthMoveGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new StealthMoveGoal(this.heroType, this.targetX, this.targetY));
		}
	}
}

/**
 * Multi-objective destroy evaluator: prioritize target destruction.
 */
export class DestroyTargetsEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.0) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		const enemies = perception.visibleEnemyUnits.length;
		if (militaryCount >= 3 && enemies > 0) return 0.85;
		if (militaryCount >= 2) return 0.6;
		return 0.3;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof DestroyTargetGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new DestroyTargetGoal());
		}
	}
}

/**
 * Wave defense evaluator: prioritize fortification and triage.
 */
export class WaveDefenseEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.1) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		if (isBaseUnderThreat(perception)) return 1.0;
		const enemies = perception.visibleEnemyUnits.length;
		if (enemies > 0) return 0.8;
		// Between waves — fortify
		return 0.6;
	}

	setGoal(brain: PlaytesterBrain): void {
		// When this evaluator wins arbitration during wave attacks,
		// the high desirability means enemies are present — defend.
		// Between waves, fortify. Since setGoal lacks perception,
		// default to DefendBase (SurviveEvaluator handles the overlap).
		const current = brain.currentSubgoal();
		if (!(current instanceof DefendBaseGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new DefendBaseGoal());
		}
	}
}

/**
 * Weather-aware defense evaluator: adjusts priority during storms.
 */
export class WeatherAwareDefenseEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.1) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		if (isBaseUnderThreat(perception)) return 1.0;
		const enemies = perception.visibleEnemyUnits.length;
		if (enemies > 0) return 0.85;
		// Fortify between waves
		return 0.5;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof DefendBaseGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new DefendBaseGoal());
		}
	}
}

/**
 * Flag carry evaluator: grab and return CTF-style objective.
 */
export class FlagCarryEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private flagX: number,
		private flagY: number,
		private baseX: number,
		private baseY: number,
		bias = 1.1,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		if (militaryCount >= 2) return 0.85;
		return 0.4;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof FlagCarryGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new FlagCarryGoal(this.flagX, this.flagY, this.baseX, this.baseY));
		}
	}
}

/**
 * Submerged stealth evaluator: CanSwim pathfinding with underwater movement.
 */
export class SubmergedStealthEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private targetX: number,
		private targetY: number,
		bias = 1.2,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const divers = perception.visibleFriendlyUnits.filter((u) => u.unitType === "diver");
		if (divers.length > 0) return 0.9;
		return 0.4;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof StealthMoveGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new StealthMoveGoal("diver", this.targetX, this.targetY));
		}
	}
}

/**
 * Fog-of-war skirmish evaluator: cautious advance with heavy scouting.
 */
export class FogSkirmishEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.0) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const explored = explorationProgress(perception);
		if (explored < 0.3) return 0.8;
		if (explored < 0.6) return 0.6;
		return 0.3;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof CautiousAdvanceGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new CautiousAdvanceGoal());
		}
	}
}

/**
 * Liberation sweep evaluator: visit all villages/locations.
 */
export class LiberationSweepEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private locations: Array<{ x: number; y: number }>,
		bias = 1.0,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		if (militaryCount >= 3) return 0.8;
		if (militaryCount >= 1) return 0.5;
		return 0.2;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof VisitLocationsGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new VisitLocationsGoal(this.locations));
		}
	}
}

/**
 * Fortify-and-hold evaluator: heavy defense posture for wave missions.
 */
export class FortifyHoldEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.2) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		if (isBaseUnderThreat(perception)) return 1.0;
		const enemies = perception.visibleEnemyUnits.length;
		if (enemies > 0) return 0.9;
		return 0.7;
	}

	setGoal(brain: PlaytesterBrain): void {
		// Fortify between waves; SurviveEvaluator handles active threats
		const current = brain.currentSubgoal();
		if (!(current instanceof FortifyBaseGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new FortifyBaseGoal());
		}
	}
}

/**
 * Siege assault evaluator: breach and destroy an enemy base.
 */
export class SiegeAssaultEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private targetX: number,
		private targetY: number,
		bias = 1.0,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const militaryCount = countMilitaryUnits(perception);
		if (militaryCount >= 6) return 0.9;
		if (militaryCount >= 4) return 0.6;
		return 0.2;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof SiegeAssaultGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new SiegeAssaultGoal(this.targetX, this.targetY));
		}
	}
}

/**
 * Multi-base logistics evaluator: split economy across bases.
 */
export class MultiBaseLogisticsEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.0) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const idleWorkers = countIdleWorkers(perception);
		const { fish, timber } = perception.resources;
		if (idleWorkers > 0) return 0.85;
		if (fish < 150 || timber < 150) return 0.7;
		return 0.4;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof BuildEconomyGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new BuildEconomyGoal());
		}
	}
}

/**
 * Hero demolition evaluator: Sapper-focused pathfinding and placement.
 */
export class HeroDemolitionEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private targetX: number,
		private targetY: number,
		bias = 1.2,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const sapper = perception.visibleFriendlyUnits.find((u) => u.unitType === "sapper");
		if (sapper) return 0.95;
		return 0.3;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof HeroDemolitionGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new HeroDemolitionGoal(this.targetX, this.targetY));
		}
	}
}

/**
 * Evacuation evaluator: retreat as hazard (sludge) rises.
 */
export class EvacuationEvaluator extends PlaytesterGoalEvaluator {
	constructor(
		private safeX: number,
		private safeY: number,
		bias = 1.3,
	) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		// Later in the mission, sludge makes retreat more urgent
		if (perception.gameTime > 300) return 1.0;
		if (perception.gameTime > 180) return 0.8;
		return 0.4;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		if (!(current instanceof RetreatGoal)) {
			brain.clearSubgoals();
			brain.addSubgoal(new RetreatGoal(this.safeX, this.safeY));
		}
	}
}

/**
 * Boss phase evaluator: phase-aware target switching.
 */
export class BossPhaseEvaluator extends PlaytesterGoalEvaluator {
	constructor(bias = 1.3) {
		super(bias);
	}

	calculateDesirability(perception: PlayerPerception): number {
		const enemies = perception.visibleEnemyUnits.length;
		if (enemies > 0) return 0.95;
		return 0.5;
	}

	setGoal(brain: PlaytesterBrain): void {
		const current = brain.currentSubgoal();
		// Determine phase based on game time
		const phase = 1;
		// Phase transitions at approximate times
		if (current instanceof BossPhaseGoal) return;
		brain.clearSubgoals();
		brain.addSubgoal(new BossPhaseGoal(phase));
	}
}

// ============================================================================
// MISSION PROFILE REGISTRY
// ============================================================================

/**
 * Mission profile: defines which evaluators and their biases form
 * the playtester brain for a specific mission.
 */
export interface MissionProfile {
	missionId: string;
	name: string;
	description: string;
	/** Build the brain for this mission profile. */
	buildBrain(): PlaytesterBrain;
}

// ---------------------------------------------------------------------------
// Profile builders (one per mission)
// ---------------------------------------------------------------------------

function buildMission1Brain(): PlaytesterBrain {
	// Beachhead: basic gather/build/attack
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = 1.1; // Economy-first tutorial
	brain.addEvaluator(economy);

	const military = new MilitaryEvaluator();
	military.characterBias = 0.8;
	brain.addEvaluator(military);

	const objective = new ObjectiveEvaluator();
	objective.characterBias = 0.6;
	brain.addEvaluator(objective);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.4;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission2Brain(): PlaytesterBrain {
	// Causeway: escort-protect steering — keep units near convoy
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new EscortEvaluator(1.2));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.7;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.4;
	brain.addEvaluator(economy);

	return brain;
}

function buildMission3Brain(): PlaytesterBrain {
	// Firebase Delta: capture-zone occupation
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new CaptureZoneEvaluator(16, 10, 1.1));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.9;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.7;
	brain.addEvaluator(economy);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.3;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission4Brain(): PlaytesterBrain {
	// Prison Break: stealth avoidance — path around detection radii
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new StealthEvaluator("sgt_bubbles", 15, 9, 1.3));

	const survive = new SurviveEvaluator();
	survive.characterBias = 0.8;
	brain.addEvaluator(survive);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.5;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission5Brain(): PlaytesterBrain {
	// Siphon Valley: multi-objective destroy — prioritize targets, split forces
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new DestroyTargetsEvaluator(1.1));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.9;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.6;
	brain.addEvaluator(economy);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.4;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission6Brain(): PlaytesterBrain {
	// Monsoon Ambush: wave defense with weather awareness
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new WeatherAwareDefenseEvaluator(1.2));

	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.8;
	brain.addEvaluator(economy);

	const military = new MilitaryEvaluator();
	military.characterBias = 0.9;
	brain.addEvaluator(military);

	return brain;
}

function buildMission7Brain(): PlaytesterBrain {
	// River Rats: CTF flag-carry steering
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new FlagCarryEvaluator(30, 5, 5, 25, 1.2));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.8;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.5;
	brain.addEvaluator(economy);

	return brain;
}

function buildMission8Brain(): PlaytesterBrain {
	// Underwater Cache: submerged stealth — CanSwim pathfinding
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new SubmergedStealthEvaluator(16, 10, 1.3));

	const survive = new SurviveEvaluator();
	survive.characterBias = 0.8;
	brain.addEvaluator(survive);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.6;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission9Brain(): PlaytesterBrain {
	// Dense Canopy: fog-of-war skirmish — cautious advance
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new FogSkirmishEvaluator(1.1));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.8;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.7;
	brain.addEvaluator(economy);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.9;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission10Brain(): PlaytesterBrain {
	// Healer's Grove: liberation sweep — visit all villages
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(
		new LiberationSweepEvaluator(
			[
				{ x: 8, y: 8 },
				{ x: 24, y: 8 },
				{ x: 8, y: 24 },
				{ x: 24, y: 24 },
				{ x: 16, y: 16 },
			],
			1.1,
		),
	);

	const military = new MilitaryEvaluator();
	military.characterBias = 0.8;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.6;
	brain.addEvaluator(economy);

	return brain;
}

function buildMission11Brain(): PlaytesterBrain {
	// Entrenchment: 12-wave defense — fortify, repair, triage
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new FortifyHoldEvaluator(1.3));

	const survive = new SurviveEvaluator();
	survive.characterBias = 1.1;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.9;
	brain.addEvaluator(economy);

	const military = new MilitaryEvaluator();
	military.characterBias = 1.0;
	brain.addEvaluator(military);

	return brain;
}

function buildMission12Brain(): PlaytesterBrain {
	// The Stronghold: siege assault — breach walls, focus fire
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new SiegeAssaultEvaluator(32, 8, 1.2));

	const military = new MilitaryEvaluator();
	military.characterBias = 1.0;
	brain.addEvaluator(military);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.7;
	brain.addEvaluator(economy);

	return brain;
}

function buildMission13Brain(): PlaytesterBrain {
	// Supply Lines: multi-base logistics — split economy
	const brain = new PlaytesterBrain();
	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	brain.addEvaluator(new MultiBaseLogisticsEvaluator(1.2));

	const military = new MilitaryEvaluator();
	military.characterBias = 0.7;
	brain.addEvaluator(military);

	const objective = new ObjectiveEvaluator();
	objective.characterBias = 0.6;
	brain.addEvaluator(objective);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.5;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission14Brain(): PlaytesterBrain {
	// Gas Depot: hero demolition — Sapper pathfinding
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new HeroDemolitionEvaluator(20, 8, 1.3));

	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	const military = new MilitaryEvaluator();
	military.characterBias = 0.6;
	brain.addEvaluator(military);

	const exploration = new ExplorationEvaluator();
	exploration.characterBias = 0.4;
	brain.addEvaluator(exploration);

	return brain;
}

function buildMission15Brain(): PlaytesterBrain {
	// Serpent's Lair: evacuation — retreat as sludge rises
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new EvacuationEvaluator(5, 5, 1.4));

	const survive = new SurviveEvaluator();
	survive.characterBias = 1.0;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.3;
	brain.addEvaluator(economy);

	return brain;
}

function buildMission16Brain(): PlaytesterBrain {
	// The Reckoning: 3-phase boss — phase-aware target switching
	const brain = new PlaytesterBrain();
	brain.addEvaluator(new BossPhaseEvaluator(1.3));

	const survive = new SurviveEvaluator();
	survive.characterBias = 1.1;
	brain.addEvaluator(survive);

	const economy = new EconomyEvaluator();
	economy.characterBias = 0.8;
	brain.addEvaluator(economy);

	const military = new MilitaryEvaluator();
	military.characterBias = 1.0;
	brain.addEvaluator(military);

	const objective = new ObjectiveEvaluator();
	objective.characterBias = 0.9;
	brain.addEvaluator(objective);

	return brain;
}

// ---------------------------------------------------------------------------
// Profile registry
// ---------------------------------------------------------------------------

export const MISSION_PROFILES: Record<string, MissionProfile> = {
	mission_1: {
		missionId: "mission_1",
		name: "Beachhead",
		description: "Basic gather/build/attack tutorial profile",
		buildBrain: buildMission1Brain,
	},
	mission_2: {
		missionId: "mission_2",
		name: "The Causeway",
		description: "Escort-protect steering — keep units near convoy",
		buildBrain: buildMission2Brain,
	},
	mission_3: {
		missionId: "mission_3",
		name: "Firebase Delta",
		description: "Capture-zone occupation — move squads to zones, hold position",
		buildBrain: buildMission3Brain,
	},
	mission_4: {
		missionId: "mission_4",
		name: "Prison Break",
		description: "Stealth avoidance — path around detection radii, hero solo",
		buildBrain: buildMission4Brain,
	},
	mission_5: {
		missionId: "mission_5",
		name: "Siphon Valley",
		description: "Multi-objective destroy — prioritize targets, split forces",
		buildBrain: buildMission5Brain,
	},
	mission_6: {
		missionId: "mission_6",
		name: "Monsoon Ambush",
		description: "Wave defense with weather awareness",
		buildBrain: buildMission6Brain,
	},
	mission_7: {
		missionId: "mission_7",
		name: "River Rats",
		description: "CTF flag-carry steering — grab and return with water traversal",
		buildBrain: buildMission7Brain,
	},
	mission_8: {
		missionId: "mission_8",
		name: "Underwater Cache",
		description: "Submerged stealth — CanSwim pathfinding",
		buildBrain: buildMission8Brain,
	},
	mission_9: {
		missionId: "mission_9",
		name: "Dense Canopy",
		description: "Fog-of-war skirmish — cautious advance",
		buildBrain: buildMission9Brain,
	},
	mission_10: {
		missionId: "mission_10",
		name: "Healer's Grove",
		description: "Liberation sweep — visit all villages",
		buildBrain: buildMission10Brain,
	},
	mission_11: {
		missionId: "mission_11",
		name: "Entrenchment",
		description: "12-wave defense — fortify, repair, triage",
		buildBrain: buildMission11Brain,
	},
	mission_12: {
		missionId: "mission_12",
		name: "The Stronghold",
		description: "Siege assault — breach walls, focus fire",
		buildBrain: buildMission12Brain,
	},
	mission_13: {
		missionId: "mission_13",
		name: "Supply Lines",
		description: "Multi-base logistics — split economy",
		buildBrain: buildMission13Brain,
	},
	mission_14: {
		missionId: "mission_14",
		name: "Gas Depot",
		description: "Hero demolition — Sapper pathfinding",
		buildBrain: buildMission14Brain,
	},
	mission_15: {
		missionId: "mission_15",
		name: "Serpent's Lair",
		description: "Evacuation — retreat as sludge rises",
		buildBrain: buildMission15Brain,
	},
	mission_16: {
		missionId: "mission_16",
		name: "The Reckoning",
		description: "3-phase boss — phase-aware target switching",
		buildBrain: buildMission16Brain,
	},
};

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a PlaytesterBrain configured for a specific mission.
 *
 * Each mission has a custom GOAP evaluator composition that biases
 * the AI playtester toward the mission's intended playstyle
 * (escort, stealth, defense, siege, etc.).
 *
 * Falls back to a standard balanced brain if the mission ID is unknown.
 */
export function createMissionPlaytesterBrain(missionId: string): PlaytesterBrain {
	const profile = MISSION_PROFILES[missionId];
	if (!profile) {
		// Fallback: standard balanced brain
		const brain = new PlaytesterBrain();
		brain.addEvaluator(new SurviveEvaluator());
		brain.addEvaluator(new EconomyEvaluator());
		brain.addEvaluator(new MilitaryEvaluator());
		brain.addEvaluator(new ObjectiveEvaluator());
		brain.addEvaluator(new ExplorationEvaluator());
		return brain;
	}
	return profile.buildBrain();
}
