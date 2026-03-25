import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IsProjectile } from "@/ecs/traits/identity";
import { Position, Velocity } from "@/ecs/traits/spatial";
import { ProjectileTrailSystem } from "@/rendering/ProjectileTrails";

function createMockGraphics() {
	return {
		fillStyle: vi.fn(),
		fillCircle: vi.fn(),
	};
}

describe("ProjectileTrailSystem (US-027)", () => {
	let world: ReturnType<typeof createWorld>;
	let system: ProjectileTrailSystem;
	let graphics: ReturnType<typeof createMockGraphics>;

	beforeEach(() => {
		world = createWorld();
		system = new ProjectileTrailSystem();
		graphics = createMockGraphics();
	});

	afterEach(() => {
		system.reset();
		world.destroy();
	});

	it("should pre-allocate pool of 100 particles", () => {
		expect(system.poolSize).toBe(100);
		expect(system.activeCount).toBe(0);
	});

	it("should spawn particles for projectiles each frame", () => {
		world.spawn(IsProjectile, Position({ x: 5, y: 5 }), Velocity({ x: 1, y: 0 }));

		system.update(world, 0.016);

		// 2 particles per projectile per frame
		expect(system.activeCount).toBe(2);
	});

	it("should spawn particles for multiple projectiles", () => {
		world.spawn(IsProjectile, Position({ x: 5, y: 5 }), Velocity({ x: 1, y: 0 }));
		world.spawn(IsProjectile, Position({ x: 10, y: 10 }), Velocity({ x: 0, y: 1 }));

		system.update(world, 0.016);

		// 2 particles per projectile × 2 projectiles = 4
		expect(system.activeCount).toBe(4);
	});

	it("should deactivate particles after lifetime (0.3s)", () => {
		world.spawn(IsProjectile, Position({ x: 5, y: 5 }), Velocity({ x: 1, y: 0 }));

		system.update(world, 0.016);
		expect(system.activeCount).toBe(2);

		// Destroy the projectile so no new particles are spawned
		for (const e of world.query(IsProjectile)) e.destroy();

		// Age past lifetime
		system.update(world, 0.35);
		expect(system.activeCount).toBe(0);
	});

	it("should render active particles with fading alpha and shrinking radius", () => {
		world.spawn(IsProjectile, Position({ x: 5, y: 5 }), Velocity({ x: 1, y: 0 }));

		system.update(world, 0.016);
		system.render(graphics as any);

		// Should have drawn circles for each active particle
		expect(graphics.fillCircle.mock.calls.length).toBe(2);
		// Should have set fill style with some alpha
		expect(graphics.fillStyle).toHaveBeenCalled();
	});

	it("should not exceed 100 particles (pool recycles oldest)", () => {
		// Spawn many projectiles to generate lots of particles
		for (let i = 0; i < 60; i++) {
			world.spawn(IsProjectile, Position({ x: i, y: 0 }), Velocity({ x: 1, y: 0 }));
		}

		// 60 projectiles × 2 particles = 120, but capped at 100
		system.update(world, 0.016);

		expect(system.activeCount).toBeLessThanOrEqual(100);
	});

	it("should reset all particles", () => {
		world.spawn(IsProjectile, Position({ x: 5, y: 5 }), Velocity({ x: 1, y: 0 }));

		system.update(world, 0.016);
		expect(system.activeCount).toBe(2);

		system.reset();
		expect(system.activeCount).toBe(0);
	});

	it("should not spawn particles for non-projectile entities", () => {
		world.spawn(Position({ x: 5, y: 5 }));

		system.update(world, 0.016);

		expect(system.activeCount).toBe(0);
	});
});
