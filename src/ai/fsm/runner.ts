/**
 * FSM runner — executes state logic and manages transitions for an AI entity.
 *
 * This is our game-level FSM that wraps the state objects and profile constraints.
 * It does NOT extend Yuka's StateMachine directly because our states use
 * AIContext rather than Yuka's GameEntity. The Koota↔Yuka sync layer
 * populates AIContext each frame, then calls runner.update().
 */

import type { AIContext } from "./context";
import type { AIProfile } from "./profiles";
import { ALL_STATES, type AIState, type StateName } from "./states";

export class FSMRunner {
	private profile: AIProfile;
	private currentStateName: StateName;
	private currentState: AIState;
	private previousStateName: StateName | null = null;

	constructor(profile: AIProfile) {
		this.profile = profile;
		this.currentStateName = profile.initialState;
		this.currentState = ALL_STATES[profile.initialState];
	}

	/** Get the current state name. */
	get state(): StateName {
		return this.currentStateName;
	}

	/** Get the previous state name. */
	get previous(): StateName | null {
		return this.previousStateName;
	}

	/**
	 * Enter the initial state. Call once when the entity is first created.
	 */
	start(ctx: AIContext): void {
		this.currentState.enter(ctx);
	}

	/**
	 * Execute one tick of the FSM. Handles transitions returned by execute().
	 *
	 * If the state requests a transition that the profile blocks, the runner
	 * falls back to the first allowed transition from the current state's
	 * transition table. This lets generic states (e.g. AlertState returning
	 * CHASE) be remapped per-profile (e.g. Scout → SPOT, Viper → SNIPE).
	 */
	update(ctx: AIContext): void {
		const nextState = this.currentState.execute(ctx);
		if (nextState !== null && nextState !== this.currentStateName) {
			if (!this.transitionTo(nextState, ctx)) {
				// Fallback: try the first allowed transition from the profile
				const allowed = this.profile.transitions[this.currentStateName];
				if (allowed) {
					for (const fallback of allowed) {
						if (fallback !== this.currentStateName && this.transitionTo(fallback, ctx)) {
							break;
						}
					}
				}
			}
		}
	}

	/**
	 * Force a transition to a specific state (if allowed by profile).
	 * Returns true if the transition was applied.
	 */
	transitionTo(target: StateName, ctx: AIContext): boolean {
		if (!this.isTransitionAllowed(target)) {
			return false;
		}

		this.currentState.exit(ctx);
		this.previousStateName = this.currentStateName;
		this.currentStateName = target;
		this.currentState = ALL_STATES[target];
		this.currentState.enter(ctx);
		return true;
	}

	/** Check if a transition from current state to target is allowed. */
	isTransitionAllowed(target: StateName): boolean {
		if (!this.profile.allowedStates.includes(target)) {
			return false;
		}
		const allowed = this.profile.transitions[this.currentStateName];
		if (allowed && !allowed.includes(target)) {
			return false;
		}
		return true;
	}
}
