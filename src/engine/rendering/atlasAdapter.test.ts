import { describe, expect, it } from "vitest";
import { getEntityAnimal, getEntityAnimationNames, getEntityDrawSize } from "./atlasAdapter";

describe("engine/rendering/atlasAdapter", () => {
	describe("getEntityAnimal", () => {
		it("maps OEF units to otter", () => {
			expect(getEntityAnimal("river_rat")).toBe("otter");
			expect(getEntityAnimal("mudfoot")).toBe("otter");
			expect(getEntityAnimal("shellcracker")).toBe("otter");
			expect(getEntityAnimal("sapper")).toBe("otter");
			expect(getEntityAnimal("mortar_otter")).toBe("otter");
			expect(getEntityAnimal("diver")).toBe("otter");
		});

		it("maps OEF heroes to otter", () => {
			expect(getEntityAnimal("col_bubbles")).toBe("otter");
			expect(getEntityAnimal("gen_whiskers")).toBe("otter");
			expect(getEntityAnimal("medic_marina")).toBe("otter");
		});

		it("maps Scale-Guard units to reptile atlases", () => {
			expect(getEntityAnimal("gator")).toBe("crocodile");
			expect(getEntityAnimal("croc_champion")).toBe("crocodile");
			expect(getEntityAnimal("viper")).toBe("snake");
			expect(getEntityAnimal("scout_lizard")).toBe("cobra");
			expect(getEntityAnimal("serpent_king")).toBe("cobra");
		});

		it("returns null for unmapped entity types", () => {
			expect(getEntityAnimal("command_post")).toBeNull();
			expect(getEntityAnimal("fish_spot")).toBeNull();
			expect(getEntityAnimal("nonexistent")).toBeNull();
		});
	});

	describe("getEntityDrawSize", () => {
		// Before initialization, atlas data is empty so sizes return null
		it("returns null for unmapped entities", () => {
			expect(getEntityDrawSize("command_post")).toBeNull();
		});

		it("returns null before initialization", () => {
			// atlasDataMap is empty before initAtlasAdapter() is called
			expect(getEntityDrawSize("mudfoot")).toBeNull();
		});
	});

	describe("getEntityAnimationNames", () => {
		it("returns empty array for unmapped entities", () => {
			expect(getEntityAnimationNames("command_post")).toEqual([]);
		});

		it("returns empty array before initialization", () => {
			expect(getEntityAnimationNames("mudfoot")).toEqual([]);
		});
	});
});
