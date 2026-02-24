/**
 * Entity Component Export Verification Tests
 *
 * Verifies that components are exported and are functions.
 * Babylon.js components cannot be rendered in jsdom, so we only
 * check that exports exist and are callable.
 */

jest.mock("reactylon");

describe("Entity Components Exports", () => {
	describe("BaseBuilding components", () => {
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

	describe("SimpleHut component", () => {
		it("should export SimpleHut component", () => {
			const { SimpleHut } = require("../SimpleHut");
			expect(SimpleHut).toBeDefined();
			expect(typeof SimpleHut).toBe("function");
		});
	});

	describe("Healer component", () => {
		it("should export Healer component", () => {
			const { Healer } = require("../Healer");
			expect(Healer).toBeDefined();
			expect(typeof Healer).toBe("function");
		});
	});

	describe("PrisonCage component", () => {
		it("should export PrisonCage component", () => {
			const { PrisonCage } = require("../PrisonCage");
			expect(PrisonCage).toBeDefined();
			expect(typeof PrisonCage).toBe("function");
		});
	});
});

describe("Environment Components Exports", () => {
	it("should export Platform component", () => {
		const { Platform } = require("../Environment/Platform");
		expect(Platform).toBeDefined();
		expect(typeof Platform).toBe("function");
	});

	it("should export MudPit component", () => {
		const { MudPit } = require("../Environment/MudPit");
		expect(MudPit).toBeDefined();
		expect(typeof MudPit).toBe("function");
	});

	it("should export ToxicSludge component", () => {
		const { ToxicSludge } = require("../Environment/ToxicSludge");
		expect(ToxicSludge).toBeDefined();
		expect(typeof ToxicSludge).toBe("function");
	});

	it("should export OilSlick component", () => {
		const { OilSlick } = require("../Environment/OilSlick");
		expect(OilSlick).toBeDefined();
		expect(typeof OilSlick).toBe("function");
	});
});

describe("Objective Components Exports", () => {
	it("should export Clam component", () => {
		const { Clam } = require("../Objectives/Clam");
		expect(Clam).toBeDefined();
		expect(typeof Clam).toBe("function");
	});

	it("should export Siphon component", () => {
		const { Siphon } = require("../Objectives/Siphon");
		expect(Siphon).toBeDefined();
		expect(typeof Siphon).toBe("function");
	});
});

describe("Villager Component Exports", () => {
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

describe("Weapon Component Exports", () => {
	it("should export Weapon component", () => {
		const { Weapon } = require("../Weapon");
		expect(Weapon).toBeDefined();
		expect(typeof Weapon).toBe("function");
	});
});

describe("ExtractionPoint Component Exports", () => {
	it("should export ExtractionPoint component", () => {
		const { ExtractionPoint } = require("../ExtractionPoint");
		expect(ExtractionPoint).toBeDefined();
		expect(typeof ExtractionPoint).toBe("function");
	});
});

describe("ModularHut Component Exports", () => {
	it("should export ModularHut component", () => {
		const { ModularHut } = require("../ModularHut");
		expect(ModularHut).toBeDefined();
		expect(typeof ModularHut).toBe("function");
	});
});
