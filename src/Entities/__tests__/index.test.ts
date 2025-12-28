/**
 * Entity Component Export Tests
 *
 * Verifies all entity components export correctly.
 */

import { describe, expect, it, vi } from "vitest";

// Mock React Three Fiber to avoid WebGL context issues
vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn(),
	useThree: vi.fn(() => ({ camera: {}, scene: {} })),
}));

describe("Entity Module Exports", () => {
	describe("BaseBuilding", () => {
		it("should export BaseFloor component", async () => {
			const { BaseFloor } = await import("../BaseBuilding");
			expect(BaseFloor).toBeDefined();
			expect(typeof BaseFloor).toBe("function");
		});

		it("should export BaseWall component", async () => {
			const { BaseWall } = await import("../BaseBuilding");
			expect(BaseWall).toBeDefined();
			expect(typeof BaseWall).toBe("function");
		});

		it("should export BaseRoof component", async () => {
			const { BaseRoof } = await import("../BaseBuilding");
			expect(BaseRoof).toBeDefined();
			expect(typeof BaseRoof).toBe("function");
		});

		it("should export BaseStilt component", async () => {
			const { BaseStilt } = await import("../BaseBuilding");
			expect(BaseStilt).toBeDefined();
			expect(typeof BaseStilt).toBe("function");
		});
	});

	describe("ModularHut", () => {
		it("should export ModularHut component", async () => {
			const { ModularHut } = await import("../ModularHut");
			expect(ModularHut).toBeDefined();
			expect(typeof ModularHut).toBe("function");
		});
	});

	describe("Particles", () => {
		it("should export Particles component", async () => {
			const { Particles } = await import("../Particles");
			expect(Particles).toBeDefined();
			expect(typeof Particles).toBe("function");
		});

		it("should export ParticleData interface type", async () => {
			const module = await import("../Particles");
			// Just verify the module loads without error
			expect(module).toBeDefined();
		});
	});

	describe("PlayerRig", () => {
		it("should export PlayerRig component", async () => {
			const { PlayerRig } = await import("../PlayerRig");
			expect(PlayerRig).toBeDefined();
			// forwardRef components are objects with render function
			expect(typeof PlayerRig).toBe("object");
		});
	});

	describe("Projectiles", () => {
		it("should export Projectiles component", async () => {
			const { Projectiles } = await import("../Projectiles");
			expect(Projectiles).toBeDefined();
			// forwardRef components are objects
			expect(typeof Projectiles).toBe("object");
		});

		it("should export Projectile interface", async () => {
			const module = await import("../Projectiles");
			expect(module).toBeDefined();
		});
	});

	describe("Raft", () => {
		it("should export Raft component", async () => {
			const { Raft } = await import("../Raft");
			expect(Raft).toBeDefined();
			// forwardRef returns object
			expect(typeof Raft).toBe("object");
		});
	});

	describe("Villager", () => {
		it("should export Villager component", async () => {
			const { Villager } = await import("../Villager");
			expect(Villager).toBeDefined();
			expect(typeof Villager).toBe("function");
		});

		it("should export Hut component", async () => {
			const { Hut } = await import("../Villager");
			expect(Hut).toBeDefined();
			expect(typeof Hut).toBe("function");
		});
	});

	describe("Weapon", () => {
		it("should export Weapon component", async () => {
			const { Weapon } = await import("../Weapon");
			expect(Weapon).toBeDefined();
			expect(typeof Weapon).toBe("function");
		});
	});

	describe("SimpleHut", () => {
		it("should export SimpleHut component", async () => {
			const { SimpleHut } = await import("../SimpleHut");
			expect(SimpleHut).toBeDefined();
			expect(typeof SimpleHut).toBe("function");
		});
	});

	describe("Healer", () => {
		it("should export Healer component", async () => {
			const { Healer } = await import("../Healer");
			expect(Healer).toBeDefined();
			expect(typeof Healer).toBe("function");
		});
	});

	describe("ExtractionPoint", () => {
		it("should export ExtractionPoint component", async () => {
			const { ExtractionPoint } = await import("../ExtractionPoint");
			expect(ExtractionPoint).toBeDefined();
			expect(typeof ExtractionPoint).toBe("function");
		});
	});

	describe("PrisonCage", () => {
		it("should export PrisonCage component", async () => {
			const { PrisonCage } = await import("../PrisonCage");
			expect(PrisonCage).toBeDefined();
			expect(typeof PrisonCage).toBe("function");
		});
	});
});
