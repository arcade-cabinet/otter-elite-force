/**
 * Enemy AI FSM profiles — per-unit-type configurations.
 *
 * Each profile defines which FSM states a unit type uses, its initial state,
 * and the allowed state transitions. The FSM runner uses these profiles to
 * constrain which transitions are valid for each enemy type.
 *
 * Spec reference: §10 Yuka AI Integration — Enemy AI Profiles
 *
 * | Enemy          | FSM States                                        |
 * |----------------|---------------------------------------------------|
 * | Gator          | idle → patrol → alert → ambush → chase → attack   |
 * | Viper          | idle → patrol → snipe → flee                      |
 * | Scout Lizard   | patrol → spot → signal → flee                     |
 * | Croc Champion  | patrol → engage → berserk                         |
 * | Siphon Drone   | approach → drain → retreat                        |
 * | Snapper        | idle → attack (stationary turret)                 |
 * | Skink          | idle → patrol → flee (worker)                     |
 */

import { STATE, type StateName } from "./states";

export interface AIProfile {
	/** Unit type id (matches data/units.ts) */
	unitType: string;
	/** State the FSM starts in */
	initialState: StateName;
	/** All states this unit type can be in */
	allowedStates: StateName[];
	/** Override transitions: state → allowed next states.
	 *  If a state returns a transition not in this map, it falls back to allowedStates membership. */
	transitions: Partial<Record<StateName, StateName[]>>;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const GATOR_PROFILE: AIProfile = {
	unitType: "gator",
	initialState: STATE.IDLE,
	allowedStates: [
		STATE.IDLE,
		STATE.PATROL,
		STATE.ALERT,
		STATE.AMBUSH,
		STATE.CHASE,
		STATE.ATTACK,
		STATE.FLEE,
	],
	transitions: {
		[STATE.IDLE]: [STATE.PATROL, STATE.ALERT],
		[STATE.PATROL]: [STATE.ALERT, STATE.AMBUSH],
		[STATE.ALERT]: [STATE.CHASE, STATE.AMBUSH, STATE.ATTACK, STATE.PATROL],
		[STATE.AMBUSH]: [STATE.ATTACK, STATE.PATROL],
		[STATE.CHASE]: [STATE.ATTACK, STATE.ALERT, STATE.PATROL],
		[STATE.ATTACK]: [STATE.CHASE, STATE.ALERT, STATE.FLEE],
		[STATE.FLEE]: [STATE.IDLE],
	},
};

export const VIPER_PROFILE: AIProfile = {
	unitType: "viper",
	initialState: STATE.IDLE,
	allowedStates: [STATE.IDLE, STATE.PATROL, STATE.ALERT, STATE.SNIPE, STATE.CHASE, STATE.FLEE],
	transitions: {
		[STATE.IDLE]: [STATE.PATROL, STATE.ALERT],
		[STATE.PATROL]: [STATE.ALERT, STATE.SNIPE],
		[STATE.ALERT]: [STATE.SNIPE, STATE.PATROL],
		[STATE.SNIPE]: [STATE.FLEE, STATE.CHASE, STATE.PATROL],
		[STATE.CHASE]: [STATE.SNIPE, STATE.ALERT, STATE.PATROL],
		[STATE.FLEE]: [STATE.IDLE],
	},
};

export const SCOUT_LIZARD_PROFILE: AIProfile = {
	unitType: "scout_lizard",
	initialState: STATE.PATROL,
	allowedStates: [STATE.PATROL, STATE.SPOT, STATE.SIGNAL, STATE.FLEE, STATE.IDLE, STATE.ALERT],
	transitions: {
		[STATE.PATROL]: [STATE.ALERT, STATE.SPOT],
		[STATE.ALERT]: [STATE.SPOT, STATE.PATROL],
		[STATE.SPOT]: [STATE.SIGNAL, STATE.PATROL],
		[STATE.SIGNAL]: [STATE.FLEE],
		[STATE.FLEE]: [STATE.IDLE, STATE.PATROL],
		[STATE.IDLE]: [STATE.PATROL],
	},
};

export const CROC_CHAMPION_PROFILE: AIProfile = {
	unitType: "croc_champion",
	initialState: STATE.PATROL,
	allowedStates: [
		STATE.PATROL,
		STATE.ALERT,
		STATE.ENGAGE,
		STATE.BERSERK,
		STATE.ATTACK,
		STATE.CHASE,
	],
	transitions: {
		[STATE.PATROL]: [STATE.ALERT, STATE.ENGAGE],
		[STATE.ALERT]: [STATE.ENGAGE, STATE.PATROL],
		[STATE.ENGAGE]: [STATE.BERSERK, STATE.PATROL, STATE.ATTACK, STATE.CHASE],
		[STATE.BERSERK]: [STATE.PATROL],
		[STATE.CHASE]: [STATE.ENGAGE, STATE.ATTACK, STATE.PATROL],
		[STATE.ATTACK]: [STATE.CHASE, STATE.ENGAGE],
	},
};

export const SIPHON_DRONE_PROFILE: AIProfile = {
	unitType: "siphon_drone",
	initialState: STATE.APPROACH,
	allowedStates: [STATE.APPROACH, STATE.DRAIN, STATE.RETREAT, STATE.IDLE],
	transitions: {
		[STATE.APPROACH]: [STATE.DRAIN, STATE.RETREAT, STATE.IDLE],
		[STATE.DRAIN]: [STATE.APPROACH, STATE.RETREAT],
		[STATE.RETREAT]: [STATE.APPROACH, STATE.IDLE],
		[STATE.IDLE]: [STATE.APPROACH],
	},
};

export const SNAPPER_PROFILE: AIProfile = {
	unitType: "snapper",
	initialState: STATE.IDLE,
	allowedStates: [STATE.IDLE, STATE.ATTACK, STATE.ALERT],
	transitions: {
		[STATE.IDLE]: [STATE.ALERT, STATE.ATTACK],
		[STATE.ALERT]: [STATE.ATTACK, STATE.IDLE],
		[STATE.ATTACK]: [STATE.ALERT, STATE.IDLE],
	},
};

export const SKINK_PROFILE: AIProfile = {
	unitType: "skink",
	initialState: STATE.IDLE,
	allowedStates: [STATE.IDLE, STATE.PATROL, STATE.ALERT, STATE.FLEE],
	transitions: {
		[STATE.IDLE]: [STATE.PATROL, STATE.ALERT],
		[STATE.PATROL]: [STATE.ALERT, STATE.IDLE],
		[STATE.ALERT]: [STATE.FLEE, STATE.PATROL],
		[STATE.FLEE]: [STATE.IDLE, STATE.PATROL],
	},
};

// ---------------------------------------------------------------------------
// Profile registry
// ---------------------------------------------------------------------------

export const AI_PROFILES: Record<string, AIProfile> = {
	gator: GATOR_PROFILE,
	viper: VIPER_PROFILE,
	scout_lizard: SCOUT_LIZARD_PROFILE,
	croc_champion: CROC_CHAMPION_PROFILE,
	siphon_drone: SIPHON_DRONE_PROFILE,
	snapper: SNAPPER_PROFILE,
	skink: SKINK_PROFILE,
};

/** Get profile for a unit type. Returns undefined for player units or unknown types. */
export function getAIProfile(unitType: string): AIProfile | undefined {
	return AI_PROFILES[unitType];
}
