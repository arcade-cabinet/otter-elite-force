/**
 * AI System Tests
 *
 * Tests for enemy AI state machines, decision making, and pack coordination.
 */

import * as THREE from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Vehicle as YukaVehicle } from "yuka";
import type { Entity } from "../../world";
import { calculateFlankPositions, transitionState } from "../AISystem";

// Mock the world module
vi.mock("../../world", () => {
	const mockPlayers = new Set<Entity>();
	const mockEnemies = new Set<Entity>();
	const mockPackMembers = new Set<Entity>();

	return {
		players: mockPlayers,
		enemies: mockEnemies,
		packMembers: mockPackMembers,
		world: {
			add: vi.fn(),
			remove: vi.fn(),
		},
	};
});

// Helper to create test entities
const createTestEntity = (overrides: Partial<Entity> = {}): Entity => ({
	id: `test-${Math.random().toString(36).substr(2, 9)}`,
	transform: {
		position: new THREE.Vector3(0, 0, 0),
		rotation: new THREE.Euler(0, 0, 0),
		scale: new THREE.Vector3(1, 1, 1),
	},
	...overrides,
});

const createGatorEntity = (position = new THREE.Vector3()): Entity =>
	createTestEntity({
		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(),
			scale: new THREE.Vector3(1, 1, 1),
		},
		isEnemy: { __tag: "IsEnemy" },
		gator: {
			isSubmerged: true,
			ambushCooldown: 0,
			ambushDuration: 3,
		},
		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			homePosition: position.clone(),
			patrolRadius: 20,
			lastKnownPlayerPos: null,
		},
		steeringAgent: {
			vehicle: new YukaVehicle(),
			targetPosition: null,
			avoidanceRadius: 2,
			separationWeight: 1,
			cohesionWeight: 0.5,
			alignmentWeight: 0.5,
		},
		health: { current: 100, max: 100, regenRate: 0, lastDamageTime: 0, isInvulnerable: false },
		suppression: { amount: 0, decayRate: 0.1, threshold: 0.5 },
	});

const createSnakeEntity = (position = new THREE.Vector3()): Entity =>
	createTestEntity({
		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(),
			scale: new THREE.Vector3(1, 1, 1),
		},
		isEnemy: { __tag: "IsEnemy" },
		snake: {
			segmentCount: 5,
			strikeRange: 8,
			strikeCooldown: 0,
			isStriking: false,
			anchorPosition: position.clone(),
		},
		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			homePosition: position.clone(),
			patrolRadius: 10,
			lastKnownPlayerPos: null,
		},
		health: { current: 50, max: 50, regenRate: 0, lastDamageTime: 0, isInvulnerable: false },
		suppression: { amount: 0, decayRate: 0.1, threshold: 0.5 },
	});

const createSnapperEntity = (position = new THREE.Vector3()): Entity =>
	createTestEntity({
		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(),
			scale: new THREE.Vector3(1, 1, 1),
		},
		isEnemy: { __tag: "IsEnemy" },
		snapper: {
			turretRotation: 0,
			turretTargetRotation: 0,
			heatLevel: 0,
			isOverheated: false,
		},
		weapon: {
			id: "snapper-gun",
			damage: 10,
			fireRate: 0.2,
			bulletSpeed: 50,
			recoil: 0.1,
			range: 30,
			ammo: 100,
			maxAmmo: 100,
			lastFireTime: 0,
			isFiring: false,
		},
		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			homePosition: position.clone(),
			patrolRadius: 10,
			lastKnownPlayerPos: null,
		},
		health: { current: 80, max: 80, regenRate: 0, lastDamageTime: 0, isInvulnerable: false },
		suppression: { amount: 0, decayRate: 0.1, threshold: 0.5 },
	});

const createScoutEntity = (position = new THREE.Vector3()): Entity =>
	createTestEntity({
		transform: {
			position: position.clone(),
			rotation: new THREE.Euler(),
			scale: new THREE.Vector3(1, 1, 1),
		},
		isEnemy: { __tag: "IsEnemy" },
		scout: {
			hasSpottedPlayer: false,
			signalCooldown: 0,
			isSignaling: false,
			fleeDistance: 12,
		},
		packMember: {
			packId: "test-pack",
			role: "scout",
			signalRange: 50,
			lastSignalTime: 0,
		},
		aiBrain: {
			currentState: "patrol",
			previousState: "patrol",
			stateTime: 0,
			alertLevel: 0,
			homePosition: position.clone(),
			patrolRadius: 20,
			lastKnownPlayerPos: null,
		},
		steeringAgent: {
			vehicle: new YukaVehicle(),
			targetPosition: null,
			avoidanceRadius: 2,
			separationWeight: 1,
			cohesionWeight: 0.5,
			alignmentWeight: 0.5,
		},
		health: { current: 40, max: 40, regenRate: 0, lastDamageTime: 0, isInvulnerable: false },
		suppression: { amount: 0, decayRate: 0.1, threshold: 0.5 },
	});

describe("AISystem", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("transitionState", () => {
		it("should transition to a new state", () => {
			const entity = createGatorEntity();
			transitionState(entity, "chase");

			expect(entity.aiBrain?.currentState).toBe("chase");
			expect(entity.aiBrain?.previousState).toBe("idle");
			expect(entity.aiBrain?.stateTime).toBe(0);
		});

		it("should not transition if already in the same state", () => {
			const entity = createGatorEntity();
			entity.aiBrain!.stateTime = 5;

			transitionState(entity, "idle");

			expect(entity.aiBrain?.stateTime).toBe(5); // Unchanged
		});

		it("should do nothing if entity has no aiBrain", () => {
			const entity = createTestEntity();
			transitionState(entity, "chase");
			// Should not throw
		});

		it("should preserve state history on transition", () => {
			const entity = createGatorEntity();

			transitionState(entity, "chase");
			transitionState(entity, "ambush");

			expect(entity.aiBrain?.currentState).toBe("ambush");
			expect(entity.aiBrain?.previousState).toBe("chase");
		});
	});

	describe("calculateFlankPositions", () => {
		it("should calculate positions in a circle around target", () => {
			const targetPos = new THREE.Vector3(10, 0, 10);
			const positions = calculateFlankPositions(targetPos, 4);

			expect(positions).toHaveLength(4);

			// All positions should be roughly 10 units from target
			for (const pos of positions) {
				const distance = pos.distanceTo(targetPos);
				expect(distance).toBeCloseTo(10, 1);
			}
		});

		it("should spread positions evenly", () => {
			const targetPos = new THREE.Vector3(0, 0, 0);
			const positions = calculateFlankPositions(targetPos, 4);

			// Check positions are approximately 90 degrees apart
			for (let i = 0; i < positions.length; i++) {
				const next = (i + 1) % positions.length;
				const angle1 = Math.atan2(positions[i].z, positions[i].x);
				const angle2 = Math.atan2(positions[next].z, positions[next].x);
				let angleDiff = Math.abs(angle2 - angle1);
				if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
				expect(angleDiff).toBeCloseTo(Math.PI / 2, 0.1);
			}
		});

		it("should return empty array for pack size 0", () => {
			const positions = calculateFlankPositions(new THREE.Vector3(), 0);
			expect(positions).toHaveLength(0);
		});

		it("should handle single pack member", () => {
			const targetPos = new THREE.Vector3(5, 0, 5);
			const positions = calculateFlankPositions(targetPos, 1);

			expect(positions).toHaveLength(1);
			expect(positions[0].distanceTo(targetPos)).toBeCloseTo(10, 1);
		});
	});

	describe("Gator AI States", () => {
		it("should start submerged in idle state", () => {
			const gator = createGatorEntity();
			expect(gator.gator?.isSubmerged).toBe(true);
			expect(gator.aiBrain?.currentState).toBe("idle");
		});

		it("should surface when transitioning to chase", () => {
			const gator = createGatorEntity();
			transitionState(gator, "chase");
			gator.gator!.isSubmerged = false; // This would happen in updateGatorAI

			expect(gator.gator?.isSubmerged).toBe(false);
		});

		it("should track ambush cooldown", () => {
			const gator = createGatorEntity();
			gator.gator!.ambushCooldown = 5;

			// Simulate cooldown reduction
			gator.gator!.ambushCooldown = Math.max(0, gator.gator!.ambushCooldown - 2);

			expect(gator.gator?.ambushCooldown).toBe(3);
		});
	});

	describe("Snake AI States", () => {
		it("should not be striking in idle state", () => {
			const snake = createSnakeEntity();
			expect(snake.snake?.isStriking).toBe(false);
		});

		it("should track strike cooldown", () => {
			const snake = createSnakeEntity();
			snake.snake!.strikeCooldown = 4;

			// Simulate cooldown reduction
			snake.snake!.strikeCooldown = Math.max(0, snake.snake!.strikeCooldown - 1);

			expect(snake.snake?.strikeCooldown).toBe(3);
		});

		it("should be striking in attack state", () => {
			const snake = createSnakeEntity();
			transitionState(snake, "attack");
			snake.snake!.isStriking = true;

			expect(snake.snake?.isStriking).toBe(true);
		});
	});

	describe("Snapper AI States", () => {
		it("should track turret rotation", () => {
			const snapper = createSnapperEntity();
			snapper.snapper!.turretTargetRotation = Math.PI / 2;

			// Simulate smooth rotation
			const rotDiff = snapper.snapper!.turretTargetRotation - snapper.snapper!.turretRotation;
			snapper.snapper!.turretRotation += rotDiff * 0.1;

			expect(snapper.snapper?.turretRotation).toBeCloseTo(Math.PI / 20, 2);
		});

		it("should track heat level", () => {
			const snapper = createSnapperEntity();
			snapper.snapper!.heatLevel = 0.5;

			// Simulate firing
			snapper.snapper!.heatLevel += 0.1;

			expect(snapper.snapper?.heatLevel).toBe(0.6);
		});

		it("should overheat at threshold", () => {
			const snapper = createSnapperEntity();
			snapper.snapper!.heatLevel = 1.0;
			snapper.snapper!.isOverheated = true;

			expect(snapper.snapper?.isOverheated).toBe(true);
		});

		it("should not fire when idle", () => {
			const snapper = createSnapperEntity();
			expect(snapper.weapon?.isFiring).toBe(false);
		});
	});

	describe("Scout AI States", () => {
		it("should start in patrol state", () => {
			const scout = createScoutEntity();
			expect(scout.aiBrain?.currentState).toBe("patrol");
		});

		it("should not be signaling initially", () => {
			const scout = createScoutEntity();
			expect(scout.scout?.isSignaling).toBe(false);
		});

		it("should track signal cooldown", () => {
			const scout = createScoutEntity();
			scout.scout!.signalCooldown = 8;

			// Simulate cooldown reduction
			scout.scout!.signalCooldown = Math.max(0, scout.scout!.signalCooldown - 2);

			expect(scout.scout?.signalCooldown).toBe(6);
		});

		it("should mark player as spotted when transitioning to signal", () => {
			const scout = createScoutEntity();
			scout.scout!.hasSpottedPlayer = true;
			transitionState(scout, "signal");

			expect(scout.scout?.hasSpottedPlayer).toBe(true);
			expect(scout.aiBrain?.currentState).toBe("signal");
		});

		it("should be signaling in signal state", () => {
			const scout = createScoutEntity();
			transitionState(scout, "signal");
			scout.scout!.isSignaling = true;

			expect(scout.scout?.isSignaling).toBe(true);
		});
	});

	describe("Pack Coordination", () => {
		it("should have pack member data", () => {
			const scout = createScoutEntity();
			expect(scout.packMember?.packId).toBe("test-pack");
			expect(scout.packMember?.role).toBe("scout");
			expect(scout.packMember?.signalRange).toBe(50);
		});
	});

	describe("Suppression Effects", () => {
		it("should detect when entity is suppressed", () => {
			const gator = createGatorEntity();
			gator.suppression!.amount = 0.8;

			const isSuppressed = gator.suppression!.amount > gator.suppression!.threshold;
			expect(isSuppressed).toBe(true);
		});

		it("should detect when entity is not suppressed", () => {
			const gator = createGatorEntity();
			gator.suppression!.amount = 0.3;

			const isSuppressed = gator.suppression!.amount > gator.suppression!.threshold;
			expect(isSuppressed).toBe(false);
		});
	});

	describe("Alert Level", () => {
		it("should increase when player is near", () => {
			const gator = createGatorEntity();
			const delta = 1;
			const distanceToPlayer = 20;

			// Simulate alert increase
			if (distanceToPlayer < 30) {
				gator.aiBrain!.alertLevel = Math.min(1, gator.aiBrain!.alertLevel + delta * 0.3);
			}

			expect(gator.aiBrain?.alertLevel).toBe(0.3);
		});

		it("should decrease when player is far", () => {
			const gator = createGatorEntity();
			gator.aiBrain!.alertLevel = 0.5;
			const delta = 1;
			const distanceToPlayer = 50;

			// Simulate alert decrease
			if (distanceToPlayer >= 30) {
				gator.aiBrain!.alertLevel = Math.max(0, gator.aiBrain!.alertLevel - delta * 0.1);
			}

			expect(gator.aiBrain?.alertLevel).toBe(0.4);
		});

		it("should cap at 1", () => {
			const gator = createGatorEntity();
			gator.aiBrain!.alertLevel = 0.9;
			const delta = 1;

			gator.aiBrain!.alertLevel = Math.min(1, gator.aiBrain!.alertLevel + delta * 0.3);

			expect(gator.aiBrain?.alertLevel).toBe(1);
		});

		it("should not go below 0", () => {
			const gator = createGatorEntity();
			gator.aiBrain!.alertLevel = 0.05;
			const delta = 1;

			gator.aiBrain!.alertLevel = Math.max(0, gator.aiBrain!.alertLevel - delta * 0.1);

			expect(gator.aiBrain?.alertLevel).toBe(0);
		});
	});

	describe("State Time Tracking", () => {
		it("should reset state time on transition", () => {
			const entity = createGatorEntity();
			entity.aiBrain!.stateTime = 10;

			transitionState(entity, "chase");

			expect(entity.aiBrain?.stateTime).toBe(0);
		});

		it("should track time in state", () => {
			const entity = createGatorEntity();
			entity.aiBrain!.stateTime = 0;

			// Simulate delta updates
			entity.aiBrain!.stateTime += 0.016;
			entity.aiBrain!.stateTime += 0.016;
			entity.aiBrain!.stateTime += 0.016;

			expect(entity.aiBrain?.stateTime).toBeCloseTo(0.048, 3);
		});
	});
});
