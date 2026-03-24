import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld } from "koota";
import type { World, Entity } from "koota";
import { Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { Faction, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { AIState } from "@/ecs/traits/ai";
import { Concealed, Crouching, DetectionRadius } from "@/ecs/traits/stealth";
import { Targeting } from "@/ecs/relations";
import {
	effectiveDetectionRadius,
	detectionSystem,
	crouchToggle,
	alertCascadeSystem,
	CONCEALMENT_FACTOR,
	CROUCH_FACTOR,
	ALERT_CASCADE_RANGE,
} from "@/systems/stealthSystem";

describe("Stealth System", () => {
	let world: World;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	function spawnDetector(x: number, y: number, detectionRadius = 6): Entity {
		return world.spawn(
			UnitType({ type: "gator" }),
			Faction({ id: "scale_guard" }),
			Position({ x, y }),
			Health({ current: 120, max: 120 }),
			DetectionRadius({ radius: detectionRadius }),
			AIState,
			Attack({ damage: 18, range: 1, cooldown: 1.0, timer: 0 }),
			VisionRadius({ radius: detectionRadius }),
		);
	}

	function spawnTarget(
		x: number,
		y: number,
		opts: { concealed?: boolean; crouching?: boolean } = {},
	): Entity {
		const entity = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x, y }),
			Health({ current: 80, max: 80 }),
		);
		if (opts.concealed) entity.add(Concealed);
		if (opts.crouching) entity.add(Crouching);
		return entity;
	}

	// -----------------------------------------------------------------------
	// effectiveDetectionRadius
	// -----------------------------------------------------------------------

	describe("effectiveDetectionRadius", () => {
		it("returns full radius for unhidden targets", () => {
			expect(effectiveDetectionRadius(6, false, false)).toBe(6);
		});

		it("reduces radius by 75% when target is concealed", () => {
			expect(effectiveDetectionRadius(6, true, false)).toBe(6 * CONCEALMENT_FACTOR);
		});

		it("reduces radius by 50% when target is crouching", () => {
			expect(effectiveDetectionRadius(6, false, true)).toBe(6 * CROUCH_FACTOR);
		});

		it("stacks concealment and crouching multiplicatively", () => {
			const expected = 6 * CONCEALMENT_FACTOR * CROUCH_FACTOR;
			expect(effectiveDetectionRadius(6, true, true)).toBe(expected);
		});
	});

	// -----------------------------------------------------------------------
	// Detection System
	// -----------------------------------------------------------------------

	describe("detectionSystem", () => {
		it("detector spots unhidden enemy within detection radius", () => {
			const detector = spawnDetector(0, 0, 6);
			spawnTarget(3, 0);

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(1);
			// Detector should have acquired targeting
			expect(detector.has(Targeting("*"))).toBe(true);
		});

		it("detector does NOT spot enemy outside detection radius", () => {
			const detector = spawnDetector(0, 0, 6);
			spawnTarget(10, 0);

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(0);
			expect(detector.has(Targeting("*"))).toBe(false);
		});

		it("detector does NOT spot allies", () => {
			const detector = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 120, max: 120 }),
				DetectionRadius({ radius: 10 }),
				AIState,
			);
			// Another Scale-Guard within range
			world.spawn(
				UnitType({ type: "skink" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 30, max: 30 }),
			);

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(0);
			expect(detector.has(Targeting("*"))).toBe(false);
		});

		it("concealed target is harder to detect — effective radius reduced 75%", () => {
			// Detection radius 6, concealment factor 0.25 → effective radius 1.5
			const detector = spawnDetector(0, 0, 6);
			// Place at distance 3 — outside effective 1.5 radius
			spawnTarget(3, 0, { concealed: true });

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(0);
			expect(detector.has(Targeting("*"))).toBe(false);
		});

		it("concealed target IS detected when very close", () => {
			// Detection radius 6, effective 1.5 with concealment
			spawnDetector(0, 0, 6);
			spawnTarget(1, 0, { concealed: true });

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(1);
		});

		it("crouching target reduces detection radius by 50%", () => {
			// Detection radius 6, crouching factor 0.5 → effective radius 3
			const detector = spawnDetector(0, 0, 6);
			// Place at distance 4 — outside effective 3.0 radius
			spawnTarget(4, 0, { crouching: true });

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(0);
			expect(detector.has(Targeting("*"))).toBe(false);
		});

		it("crouching target IS detected when within reduced radius", () => {
			// Detection radius 6, effective 3.0 with crouching
			spawnDetector(0, 0, 6);
			spawnTarget(2, 0, { crouching: true });

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(1);
		});

		it("concealed + crouching stacks — very short detection range", () => {
			// Detection radius 8, concealed * crouch = 0.25 * 0.5 = 0.125 → effective 1.0
			const detector = spawnDetector(0, 0, 8);
			// Place at distance 2 — outside effective 1.0 radius
			spawnTarget(2, 0, { concealed: true, crouching: true });

			const spotted = detectionSystem(world);

			expect(spotted.length).toBe(0);
			expect(detector.has(Targeting("*"))).toBe(false);
		});

		it("detector already targeting does NOT re-detect", () => {
			const detector = spawnDetector(0, 0, 6);
			const target1 = spawnTarget(3, 0);
			spawnTarget(2, 0); // closer target

			// Manually set existing target
			detector.add(Targeting(target1));

			const spotted = detectionSystem(world);

			// Should not have produced any new spot events since detector already has a target
			expect(spotted.length).toBe(0);
		});

		it("sets AIState to alert on detection", () => {
			const detector = spawnDetector(0, 0, 6);
			spawnTarget(3, 0);

			detectionSystem(world);

			const ai = detector.get(AIState);
			expect(ai.state).toBe("alert");
		});
	});

	// -----------------------------------------------------------------------
	// Crouch Toggle
	// -----------------------------------------------------------------------

	describe("crouchToggle", () => {
		it("adds Crouching tag to entity", () => {
			const entity = spawnTarget(0, 0);
			expect(entity.has(Crouching)).toBe(false);

			crouchToggle(entity, true);

			expect(entity.has(Crouching)).toBe(true);
		});

		it("removes Crouching tag from entity", () => {
			const entity = spawnTarget(0, 0, { crouching: true });
			expect(entity.has(Crouching)).toBe(true);

			crouchToggle(entity, false);

			expect(entity.has(Crouching)).toBe(false);
		});

		it("is idempotent — adding when already crouching does nothing bad", () => {
			const entity = spawnTarget(0, 0, { crouching: true });
			crouchToggle(entity, true);
			expect(entity.has(Crouching)).toBe(true);
		});
	});

	// -----------------------------------------------------------------------
	// Alert Cascade
	// -----------------------------------------------------------------------

	describe("alertCascadeSystem", () => {
		it("nearby enemies within cascade range transition to alert", () => {
			// Alerted detector
			const detector = spawnDetector(0, 0, 6);
			const ai = detector.get(AIState);
			ai.state = "alert";
			ai.alertLevel = 1;

			// Nearby idle enemy within 10 tiles
			const nearby = spawnDetector(5, 0, 6);

			alertCascadeSystem(world);

			const nearbyAi = nearby.get(AIState);
			expect(nearbyAi.state).toBe("alert");
		});

		it("enemies outside cascade range stay idle", () => {
			const detector = spawnDetector(0, 0, 6);
			const ai = detector.get(AIState);
			ai.state = "alert";
			ai.alertLevel = 1;

			// Far idle enemy beyond 10 tiles
			const far = spawnDetector(15, 0, 6);

			alertCascadeSystem(world);

			const farAi = far.get(AIState);
			expect(farAi.state).toBe("idle");
		});

		it("does NOT cascade across factions", () => {
			// Alerted URA unit (not a detector — uses URA faction)
			const uraUnit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				AIState,
			);
			const uraAi = uraUnit.get(AIState);
			uraAi.state = "alert";

			// Nearby enemy
			const enemy = spawnDetector(3, 0, 6);

			alertCascadeSystem(world);

			// Enemy should NOT be alerted by URA unit's alert state
			const enemyAi = enemy.get(AIState);
			expect(enemyAi.state).toBe("idle");
		});

		it("alert cascade range constant is 10", () => {
			expect(ALERT_CASCADE_RANGE).toBe(10);
		});

		it("already alerted enemies are not double-processed", () => {
			const detector = spawnDetector(0, 0, 6);
			const ai = detector.get(AIState);
			ai.state = "alert";
			ai.alertLevel = 1;

			const nearby = spawnDetector(5, 0, 6);
			const nearbyAi = nearby.get(AIState);
			nearbyAi.state = "alert";
			nearbyAi.alertLevel = 1;

			// Should not crash or change anything
			alertCascadeSystem(world);

			expect(nearby.get(AIState).state).toBe("alert");
		});
	});
});
