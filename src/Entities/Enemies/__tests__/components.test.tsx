/**
 * Enemy Component Export Verification Tests
 *
 * Verifies that enemy components are exported and are functions.
 * Babylon.js components cannot be rendered in jsdom, so we only
 * check that exports exist and are callable.
 */

jest.mock("reactylon");

describe("Enemy Component Exports", () => {
	describe("Snapper", () => {
		it("should export Snapper component", () => {
			const { Snapper } = require("../Snapper");
			expect(Snapper).toBeDefined();
			expect(typeof Snapper).toBe("function");
		});
	});

	describe("Gator", () => {
		it("should export Gator component", () => {
			const { Gator } = require("../Gator");
			expect(Gator).toBeDefined();
			expect(typeof Gator).toBe("function");
		});
	});

	describe("Scout", () => {
		it("should export Scout component", () => {
			const { Scout } = require("../Scout");
			expect(Scout).toBeDefined();
			expect(typeof Scout).toBe("function");
		});
	});

	describe("Snake", () => {
		it("should export Snake component", () => {
			const { Snake } = require("../Snake");
			expect(Snake).toBeDefined();
			expect(typeof Snake).toBe("function");
		});
	});
});
