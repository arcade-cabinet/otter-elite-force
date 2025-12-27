/**
 * Gator AI Brain
 * Finite State Machine for pack hunting behavior
 */

import type * as THREE from "three";
import * as YUKA from "yuka";

export type GatorState = "IDLE" | "STALK" | "AMBUSH" | "RETREAT" | "SUPPRESSED";

export class GatorAI {
	private vehicle: YUKA.Vehicle;
	private state: GatorState = "IDLE";
	private target: YUKA.Vector3;

	private seekBehavior: YUKA.SeekBehavior;
	private fleeBehavior: YUKA.FleeBehavior;
	private wanderBehavior: YUKA.WanderBehavior;
	private stateTimer = 0;

	constructor(vehicle: YUKA.Vehicle, _entityManager: YUKA.EntityManager) {
		this.vehicle = vehicle;
		this.target = new YUKA.Vector3();

		this.seekBehavior = new YUKA.SeekBehavior(this.target);
		this.fleeBehavior = new YUKA.FleeBehavior(this.target);
		this.wanderBehavior = new YUKA.WanderBehavior();

		// Start with wander
		this.vehicle.steering.add(this.wanderBehavior);
	}

	update(delta: number, playerPos: THREE.Vector3, health: number, suppression: number) {
		this.target.set(playerPos.x, playerPos.y, playerPos.z);
		const distance = this.vehicle.position.distanceTo(this.target);
		this.stateTimer -= delta;

		// State Transitions
		if (suppression > 0.7) {
			this.changeState("SUPPRESSED");
		} else if (health < 3 && this.state !== "RETREAT") {
			this.changeState("RETREAT");
		} else if (this.state === "AMBUSH" && this.stateTimer <= 0) {
			this.changeState("IDLE"); // Retreat to stalking after firing
		} else if (distance < 15 && this.state === "IDLE") {
			this.changeState("STALK");
		} else if (distance < 8 && (this.state === "STALK" || this.state === "IDLE")) {
			this.changeState("AMBUSH");
		} else if (distance > 20 && this.state !== "IDLE" && this.state !== "RETREAT") {
			this.changeState("IDLE");
		}

		this.vehicle.update(delta);
	}

	private changeState(newState: GatorState) {
		if (this.state === newState) return;
		this.state = newState;

		this.vehicle.steering.clear();

		switch (newState) {
			case "IDLE":
				this.vehicle.maxSpeed = 2;
				this.vehicle.steering.add(this.wanderBehavior);
				break;
			case "STALK":
				this.vehicle.maxSpeed = 4;
				this.vehicle.steering.add(this.seekBehavior);
				break;
			case "AMBUSH":
				this.vehicle.maxSpeed = 0;
				this.stateTimer = 3; // Stay in ambush for 3s
				break;
			case "RETREAT":
				this.vehicle.maxSpeed = 8;
				this.vehicle.steering.add(this.fleeBehavior);
				this.stateTimer = 5; // Retreat for 5s
				break;
			case "SUPPRESSED":
				this.vehicle.maxSpeed = 1;
				this.vehicle.steering.add(this.wanderBehavior);
				this.stateTimer = 2; // Suppress for 2s
				break;
		}
	}

	getState() {
		return this.state;
	}
}
