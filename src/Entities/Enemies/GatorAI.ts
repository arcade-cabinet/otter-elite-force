/**
 * Gator AI Brain
 * Finite State Machine for pack hunting behavior
 */

import type * as THREE from "three";
import * as YUKA from "yuka";

export type GatorState = "IDLE" | "STALK" | "AMBUSH" | "RETREAT" | "SUPPRESSED";

const GATOR_CONFIG = {
	DETECTION_RANGE: 15,
	AMBUSH_RANGE: 8,
	DISENGAGE_RANGE: 20,
	STALK_RADIUS: 10,
	STALK_SPEED: 4,
	WANDER_SPEED: 2,
	RETREAT_SPEED: 8,
	SUPPRESSED_SPEED: 1,
	RETREAT_HEALTH_THRESHOLD: 3,
	SUPPRESSION_THRESHOLD: 0.7,
	AMBUSH_DURATION: 3,
	RETREAT_DURATION: 5,
	SUPPRESSED_DURATION: 2,
};

export class GatorAI {
	private vehicle: YUKA.Vehicle;
	private state: GatorState = "IDLE";
	private target: YUKA.Vector3;
	private stalkOffset = new YUKA.Vector3();
	private stalkAngle = Math.random() * Math.PI * 2;

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
		if (suppression > GATOR_CONFIG.SUPPRESSION_THRESHOLD) {
			this.changeState("SUPPRESSED");
		} else if (health < GATOR_CONFIG.RETREAT_HEALTH_THRESHOLD && this.state !== "RETREAT") {
			this.changeState("RETREAT");
		} else if (this.state === "AMBUSH" && (this.stateTimer <= 0 || health < 2)) {
			// Emergency retreat from ambush if health is very low
			if (health < 2) {
				this.changeState("RETREAT");
			} else {
				this.changeState("STALK"); // Go back to stalking after ambush
			}
		} else if (this.state === "RETREAT" && this.stateTimer <= 0) {
			if (distance > GATOR_CONFIG.DISENGAGE_RANGE) {
				this.changeState("IDLE");
			}
		} else if (this.state === "SUPPRESSED" && this.stateTimer <= 0) {
			this.changeState("STALK");
		} else if (distance < GATOR_CONFIG.DETECTION_RANGE && this.state === "IDLE") {
			this.changeState("STALK");
		} else if (distance < GATOR_CONFIG.AMBUSH_RANGE && (this.state === "STALK" || this.state === "IDLE")) {
			this.changeState("AMBUSH");
		} else if (distance > GATOR_CONFIG.DISENGAGE_RANGE && this.state !== "IDLE" && this.state !== "RETREAT") {
			this.changeState("IDLE");
		}

		// Custom behavior for STALK (Circling)
		if (this.state === "STALK") {
			this.stalkAngle += delta * 0.5; // Rotate around player
			this.stalkOffset.set(
				Math.cos(this.stalkAngle) * GATOR_CONFIG.STALK_RADIUS,
				0,
				Math.sin(this.stalkAngle) * GATOR_CONFIG.STALK_RADIUS
			);
			const targetPos = new YUKA.Vector3().copy(this.target).add(this.stalkOffset);
			this.seekBehavior.target.copy(targetPos);
		} else {
			this.seekBehavior.target.copy(this.target);
		}

		this.vehicle.update(delta);
	}

	private changeState(newState: GatorState) {
		if (this.state === newState) return;
		this.state = newState;

		this.vehicle.steering.clear();

		switch (newState) {
			case "IDLE":
				this.vehicle.maxSpeed = GATOR_CONFIG.WANDER_SPEED;
				this.vehicle.steering.add(this.wanderBehavior);
				break;
			case "STALK":
				this.vehicle.maxSpeed = GATOR_CONFIG.STALK_SPEED;
				this.vehicle.steering.add(this.seekBehavior);
				break;
			case "AMBUSH":
				this.vehicle.maxSpeed = 0;
				this.stateTimer = GATOR_CONFIG.AMBUSH_DURATION;
				break;
			case "RETREAT":
				this.vehicle.maxSpeed = GATOR_CONFIG.RETREAT_SPEED;
				this.vehicle.steering.add(this.fleeBehavior);
				this.stateTimer = GATOR_CONFIG.RETREAT_DURATION;
				break;
			case "SUPPRESSED":
				this.vehicle.maxSpeed = GATOR_CONFIG.SUPPRESSED_SPEED;
				this.vehicle.steering.add(this.wanderBehavior);
				this.stateTimer = GATOR_CONFIG.SUPPRESSED_DURATION;
				break;
		}
	}

	getState() {
		return this.state;
	}
}
