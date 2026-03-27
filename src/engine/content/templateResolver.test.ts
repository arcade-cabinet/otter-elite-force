import { describe, expect, it } from "vitest";
import { deepMerge, resolveAllTemplates, resolveTemplate } from "./templateResolver";

describe("deepMerge", () => {
	it("merges flat objects", () => {
		const parent = { a: 1, b: 2 };
		const child = { b: 3, c: 4 };
		const result = deepMerge(parent, child);
		expect(result).toEqual({ a: 1, b: 3, c: 4 });
	});

	it("merges nested objects recursively", () => {
		const parent = { stats: { hp: 100, armor: 2 }, name: "Base" };
		const child = { stats: { hp: 200 } };
		const result = deepMerge(parent, child as Partial<typeof parent>);
		expect(result).toEqual({ stats: { hp: 200, armor: 2 }, name: "Base" });
	});

	it("arrays replace entirely — no concat", () => {
		const parent = { abilities: ["swim", "gather"] };
		const child = { abilities: ["stealth"] };
		const result = deepMerge(parent, child);
		expect(result.abilities).toEqual(["stealth"]);
	});

	it("explicit null overrides parent", () => {
		const parent = { tint: "#ff0000" as string | null };
		const child = { tint: null };
		const result = deepMerge(parent, child);
		expect(result.tint).toBeNull();
	});

	it("undefined in child keeps parent value", () => {
		const parent = { a: 1, b: 2 };
		const child = { a: undefined, b: 3 };
		const result = deepMerge(parent, child);
		expect(result.a).toBe(1);
		expect(result.b).toBe(3);
	});
});

describe("resolveTemplate", () => {
	it("resolves a template with no extends", () => {
		const raw = {
			base_unit: { name: "Base", hp: 100 },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const result = resolveTemplate("base_unit", raw, resolved);
		expect(result).toEqual({ name: "Base", hp: 100 });
	});

	it("resolves single-level extends", () => {
		const raw = {
			parent: { name: "Parent", stats: { hp: 100, armor: 0 }, abilities: ["swim"] },
			child: { extends: "parent", name: "Child", stats: { hp: 200 } },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const result = resolveTemplate("child", raw, resolved);
		expect(result).toEqual({
			name: "Child",
			stats: { hp: 200, armor: 0 },
			abilities: ["swim"],
		});
	});

	it("resolves multi-level extends", () => {
		const raw = {
			grandparent: { a: 1, b: 2, c: 3 },
			parent: { extends: "grandparent", b: 20, d: 4 },
			child: { extends: "parent", c: 30, e: 5 },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const result = resolveTemplate("child", raw, resolved);
		expect(result).toEqual({ a: 1, b: 20, c: 30, d: 4, e: 5 });
	});

	it("child arrays replace parent arrays", () => {
		const raw = {
			parent: { abilities: ["swim", "gather"] },
			child: { extends: "parent", abilities: ["stealth"] },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const result = resolveTemplate("child", raw, resolved);
		expect(result.abilities).toEqual(["stealth"]);
	});

	it("throws on unknown template ID", () => {
		const raw = {};
		const resolved = new Map<string, Record<string, unknown>>();
		expect(() => resolveTemplate("missing", raw, resolved)).toThrow("unknown template ID");
	});

	it("throws on circular extends", () => {
		const raw = {
			a: { extends: "b", name: "A" },
			b: { extends: "a", name: "B" },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		expect(() => resolveTemplate("a", raw, resolved)).toThrow("circular extends");
	});

	it("caches resolved templates", () => {
		const raw = {
			parent: { name: "Parent" },
			child: { extends: "parent", extra: true },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const first = resolveTemplate("child", raw, resolved);
		const second = resolveTemplate("child", raw, resolved);
		expect(first).toBe(second); // same reference
	});

	it("strips extends from resolved output", () => {
		const raw = {
			parent: { name: "Parent" },
			child: { extends: "parent", extra: true },
		};
		const resolved = new Map<string, Record<string, unknown>>();
		const result = resolveTemplate("child", raw, resolved);
		expect(result).not.toHaveProperty("extends");
	});
});

describe("resolveAllTemplates", () => {
	it("resolves all templates in a record", () => {
		const raw = {
			base: { name: "Base", hp: 100 },
			derived: { extends: "base", name: "Derived", hp: 200 },
			standalone: { name: "Solo", hp: 50 },
		};
		const result = resolveAllTemplates(raw);
		expect(result.size).toBe(3);
		expect(result.get("derived")).toEqual({ name: "Derived", hp: 200 });
		expect(result.get("standalone")).toEqual({ name: "Solo", hp: 50 });
	});
});
