/**
 * Entity Component Export Tests
 *
 * Verifies all entity components export correctly.
 */

describe("Entity Module Exports", () => {
	describe("BaseBuilding", () => {
		it("should export BaseFloor component", () => {
			const { BaseFloor } = require("../BaseBuilding");
			expect(BaseFloor).toBeDefined();
			expect(typeof BaseFloor).toBe("function");
		});

		it("should export BaseWall component", () => {
			const { BaseWall } = require("../BaseBuilding");
			expect(BaseWall).toBeDefined();
			expect(typeof BaseWall).toBe("function");
		});

		it("should export BaseRoof component", () => {
			const { BaseRoof } = require("../BaseBuilding");
			expect(BaseRoof).toBeDefined();
			expect(typeof BaseRoof).toBe("function");
		});

		it("should export BaseStilt component", () => {
			const { BaseStilt } = require("../BaseBuilding");
			expect(BaseStilt).toBeDefined();
			expect(typeof BaseStilt).toBe("function");
		});
	});

	describe("ModularHut", () => {
		it("should export ModularHut component", () => {
			const { ModularHut } = require("../ModularHut");
			expect(ModularHut).toBeDefined();
			expect(typeof ModularHut).toBe("function");
		});
	});

	describe("Particles", () => {
		it("should export Particles component", () => {
			const { Particles } = require("../Particles");
			expect(Particles).toBeDefined();
			expect(typeof Particles).toBe("function");
		});

		it("should export ParticleData interface type", () => {
			const module = require("../Particles");
			// Just verify the module loads without error
			expect(module).toBeDefined();
		});
	});

	describe("PlayerRig", () => {
		it("should export PlayerRig component", () => {
			const { PlayerRig } = require("../PlayerRig");
			expect(PlayerRig).toBeDefined();
			// forwardRef components are objects with render function
			expect(typeof PlayerRig).toBe("object");
		});
	});

	describe("Projectiles", () => {
		it("should export Projectiles component", () => {
			const { Projectiles } = require("../Projectiles");
			expect(Projectiles).toBeDefined();
			// forwardRef components are objects
			expect(typeof Projectiles).toBe("object");
		});

		it("should export Projectile interface", () => {
			const module = require("../Projectiles");
			expect(module).toBeDefined();
		});
	});

	describe("Raft", () => {
		it("should export Raft component", () => {
			const { Raft } = require("../Raft");
			expect(Raft).toBeDefined();
			// forwardRef returns object
			expect(typeof Raft).toBe("object");
		});
	});

	describe("Villager", () => {
		it("should export Villager component", () => {
			const { Villager } = require("../Villager");
			expect(Villager).toBeDefined();
			expect(typeof Villager).toBe("function");
		});

		it("should export Hut component", () => {
			const { Hut } = require("../Villager");
			expect(Hut).toBeDefined();
			expect(typeof Hut).toBe("function");
		});
	});

	describe("Weapon", () => {
		it("should export Weapon component", () => {
			const { Weapon } = require("../Weapon");
			expect(Weapon).toBeDefined();
			expect(typeof Weapon).toBe("function");
		});
	});

	describe("SimpleHut", () => {
		it("should export SimpleHut component", () => {
			const { SimpleHut } = require("../SimpleHut");
			expect(SimpleHut).toBeDefined();
			expect(typeof SimpleHut).toBe("function");
		});
	});

	describe("Healer", () => {
		it("should export Healer component", () => {
			const { Healer } = require("../Healer");
			expect(Healer).toBeDefined();
			expect(typeof Healer).toBe("function");
		});
	});

	describe("ExtractionPoint", () => {
		it("should export ExtractionPoint component", () => {
			const { ExtractionPoint } = require("../ExtractionPoint");
			expect(ExtractionPoint).toBeDefined();
			expect(typeof ExtractionPoint).toBe("function");
		});
	});

	describe("PrisonCage", () => {
		it("should export PrisonCage component", () => {
			const { PrisonCage } = require("../PrisonCage");
			expect(PrisonCage).toBeDefined();
			expect(typeof PrisonCage).toBe("function");
		});
	});
});
