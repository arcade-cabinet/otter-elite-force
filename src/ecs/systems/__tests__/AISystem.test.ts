
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
	calculateFlankPositions,
	getSuppressionSpeedModifier,
	transitionState,
	updateAI,
} from "../AISystem";
import { enemies, packMembers, players } from "../../world";

// Mock the world entities
vi.mock("../../world", () => ({
	enemies: [] as any[],
	players: [] as any[],
	packMembers: [] as any[],
}));

describe("AISystem", () => {
	describe("getSuppressionSpeedModifier", () => {
		it("should return 1.0 for low suppression", () => {
			expect(getSuppressionSpeedModifier(0)).toBe(1.0);
			expect(getSuppressionSpeedModifier(49)).toBe(1.0);
		});

		it("should return reduced speed for high suppression", () => {
			// At 50%, speed is 0.7
			expect(getSuppressionSpeedModifier(50)).toBeCloseTo(0.7);
			// At 100%, speed is 0.4
			expect(getSuppressionSpeedModifier(100)).toBe(0.4);
		});
	});

	describe("transitionState", () => {
		it("should transition to new state", () => {
			const entity = {
				aiBrain: {
					currentState: "idle",
					previousState: "none",
					stateTime: 10,
				},
			};
			// @ts-ignore
			transitionState(entity, "chase");
			expect(entity.aiBrain.currentState).toBe("chase");
			expect(entity.aiBrain.previousState).toBe("idle");
			expect(entity.aiBrain.stateTime).toBe(0);
		});

		it("should not transition if state is same", () => {
			const entity = {
				aiBrain: {
					currentState: "idle",
					previousState: "none",
					stateTime: 10,
				},
			};
			// @ts-ignore
			transitionState(entity, "idle");
			expect(entity.aiBrain.currentState).toBe("idle");
			expect(entity.aiBrain.stateTime).toBe(10);
		});

        it("should do nothing if aiBrain is missing", () => {
            const entity = {};
            // @ts-ignore
            transitionState(entity, "chase");
            expect(entity).toEqual({});
        });
	});

	describe("calculateFlankPositions", () => {
		it("should calculate correct flank positions", () => {
			const target = new THREE.Vector3(0, 0, 0);
			const positions = calculateFlankPositions(target, 4);
			expect(positions.length).toBe(4);
            // Verify positions are around the target
            positions.forEach(pos => {
                expect(pos.distanceTo(target)).toBeCloseTo(10);
            });
		});
	});

	describe("updateAI", () => {
		it("should update alert level when close to player", () => {
            // Setup mocks
            const player = { transform: { position: new THREE.Vector3(0, 0, 0) } };
            // @ts-ignore
            players.push(player);

            const entity = {
                id: 1,
                transform: { position: new THREE.Vector3(5, 0, 0) },
                aiBrain: {
                    currentState: "idle",
                    alertLevel: 0,
                    stateTime: 0,
                },
                gator: {}, // make it a gator
                steeringAgent: {},
            };
            // @ts-ignore
            enemies.push(entity);

            updateAI(1);

            expect(entity.aiBrain.alertLevel).toBeGreaterThan(0);

            // Cleanup
            players.length = 0;
            enemies.length = 0;
		});

        it("should reduce alert level when far from player", () => {
             // Setup mocks
             const player = { transform: { position: new THREE.Vector3(0, 0, 0) } };
             // @ts-ignore
             players.push(player);

             const entity = {
                 id: 1,
                 transform: { position: new THREE.Vector3(40, 0, 0) },
                 aiBrain: {
                     currentState: "idle",
                     alertLevel: 0.5,
                     stateTime: 0,
                 },
                 gator: {}, // make it a gator
                 steeringAgent: {},
             };
             // @ts-ignore
             enemies.push(entity);

             updateAI(1);

             expect(entity.aiBrain.alertLevel).toBeLessThan(0.5);

             // Cleanup
             players.length = 0;
             enemies.length = 0;
        });

        it("should not update distant entities (hibernation)", () => {
            const player = { transform: { position: new THREE.Vector3(0, 0, 0) } };
            // @ts-ignore
            players.push(player);

            const entity = {
                id: 1,
                transform: { position: new THREE.Vector3(100, 0, 0) },
                aiBrain: { stateTime: 0 },
            };
            // @ts-ignore
            enemies.push(entity);

            updateAI(1);

            expect(entity.aiBrain.stateTime).toBe(0); // Should not increase

            // Cleanup
            players.length = 0;
            enemies.length = 0;
        });
	});

    describe("Specific AI Logic", () => {
        // Shared player mock
        const player = { transform: { position: new THREE.Vector3(0, 0, 0) } };

        beforeEach(() => {
             // @ts-ignore
             players.push(player);
        });

        afterEach(() => {
            players.length = 0;
            enemies.length = 0;
        });

        it("Gator AI: should transition to chase when close", () => {
            const entity = {
                id: 1,
                transform: { position: new THREE.Vector3(10, 0, 0) },
                aiBrain: { currentState: "idle", stateTime: 0 },
                gator: { isSubmerged: true, ambushCooldown: 0 },
                steeringAgent: {},
            };
            // @ts-ignore
            enemies.push(entity);

            updateAI(1);

            expect(entity.aiBrain.currentState).toBe("chase");
        });

        it("Snake AI: should strike when in range", () => {
             const entity = {
                id: 2,
                transform: { position: new THREE.Vector3(5, 0, 0) },
                aiBrain: { currentState: "idle", stateTime: 0 },
                snake: { strikeCooldown: 0, isStriking: false },
            };
            // @ts-ignore
            enemies.push(entity);

            updateAI(1);

            expect(entity.aiBrain.currentState).toBe("attack");
        });

         it("Snapper AI: should aim and fire", () => {
             const entity = {
                id: 3,
                transform: { position: new THREE.Vector3(10, 0, 0) },
                aiBrain: { currentState: "idle", stateTime: 0 },
                snapper: {
                    heatLevel: 0,
                    turretTargetRotation: 0,
                    turretRotation: 0
                },
                weapon: { isFiring: false },
            };
            // @ts-ignore
            enemies.push(entity);

            // updateAI relies on delta to update heat.
            // Also transition to attack happens if distance < SNAPPER_ENGAGE_RANGE (25)
            // But if it was idle, it sets isFiring = false first.
            // It needs two frames to start firing: 1. Idle -> Attack, 2. Attack -> Fire

            updateAI(1);
            expect(entity.aiBrain.currentState).toBe("attack");

            updateAI(1);
            expect(entity.weapon.isFiring).toBe(true);
        });

        it("Scout AI: should detect player and signal", () => {
            const entity = {
               id: 4,
               transform: { position: new THREE.Vector3(10, 0, 0) },
               aiBrain: { currentState: "patrol", stateTime: 0, homePosition: new THREE.Vector3(10, 0, 0) },
               scout: { hasSpottedPlayer: false, isSignaling: false, signalCooldown: 0 },
               steeringAgent: { targetPosition: null },
               packMember: { packId: 1, signalRange: 20 },
           };
           // @ts-ignore
           enemies.push(entity);
           // @ts-ignore
           packMembers.push(entity);

           updateAI(1);

           expect(entity.scout.hasSpottedPlayer).toBe(true);
           expect(entity.aiBrain.currentState).toBe("signal");
       });
    });
});
