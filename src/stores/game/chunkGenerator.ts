import { GAME_CONFIG } from "../../utils/constants";
import type { ChunkData } from "../types";

const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;

export function generateChunk(x: number, z: number): ChunkData {
	const id = `${x},${z}`;
	const seed = Math.abs(x * 31 + z * 17);

	const pseudoRandom = () => {
		let s = seed;
		return () => {
			s = (s * 9301 + 49297) % 233280;
			return s / 233280;
		};
	};
	const rand = pseudoRandom();

	const terrainTypes: ChunkData["terrainType"][] = ["RIVER", "MARSH", "DENSE_JUNGLE"];
	const terrainType = terrainTypes[Math.floor(rand() * terrainTypes.length)];

	const entities: ChunkData["entities"] = [];

	// Add Predators
	const entityCount = Math.floor(rand() * 5) + 2;
	for (let i = 0; i < entityCount; i++) {
		const type = rand() > 0.7 ? (rand() > 0.5 ? "SNAPPER" : "SNAKE") : "GATOR";
		entities.push({
			id: `e-${id}-${i}`,
			type,
			position: [
				(rand() - 0.5) * CHUNK_SIZE,
				type === "SNAKE" ? 5 : 0,
				(rand() - 0.5) * CHUNK_SIZE,
			],
			isHeavy: rand() > 0.8,
			hp: type === "SNAPPER" ? 20 : type === "GATOR" ? 10 : 2,
			suppression: 0,
		});
	}

	// Add Platforms
	const platformCount = Math.floor(rand() * 3) + 1;
	for (let i = 0; i < platformCount; i++) {
		entities.push({
			id: `p-${id}-${i}`,
			type: "PLATFORM",
			position: [(rand() - 0.5) * (CHUNK_SIZE - 20), 0.5, (rand() - 0.5) * (CHUNK_SIZE - 20)],
		});
	}

	// Add Climbables
	const climbableCount = Math.floor(rand() * 2) + 1;
	for (let i = 0; i < climbableCount; i++) {
		entities.push({
			id: `c-${id}-${i}`,
			type: "CLIMBABLE",
			position: [(rand() - 0.5) * (CHUNK_SIZE - 30), 5, (rand() - 0.5) * (CHUNK_SIZE - 30)],
		});
	}

	// Add Siphons
	if (rand() > 0.8) {
		entities.push({
			id: `siphon-${id}`,
			type: "SIPHON",
			position: [(rand() - 0.5) * 40, 0, (rand() - 0.5) * 40],
			hp: 50,
		});
	}

	// Add Gas Stockpiles (Strategic Objectives)
	if (rand() > 0.85) {
		entities.push({
			id: `gas-${id}`,
			type: "GAS_STOCKPILE",
			position: [(rand() - 0.5) * 40, 0.5, (rand() - 0.5) * 40],
			hp: 30,
		});
	}

	// Add Clam Baskets (Spoils / Booby Traps)
	if (rand() > 0.75) {
		entities.push({
			id: `basket-${id}`,
			type: "CLAM_BASKET",
			position: [(rand() - 0.5) * 35, 0.2, (rand() - 0.5) * 35],
			isHeavy: rand() > 0.5, // 50% chance to be a booby trap
		});
	}

	// Add Villagers/Huts
	if (rand() > 0.7) {
		const isHealerVillage = rand() > 0.8;
		const villageX = (rand() - 0.5) * 30;
		const villageZ = (rand() - 0.5) * 30;
		entities.push({ id: `hut-${id}`, type: "HUT", position: [villageX, 0, villageZ] });
		entities.push({
			id: `vil-${id}`,
			type: isHealerVillage ? "HEALER" : "VILLAGER",
			position: [villageX + 3, 0, villageZ + 2],
		});
	}

	// Add Hazards
	const hazardCount = Math.floor(rand() * 2) + 1;
	for (let i = 0; i < hazardCount; i++) {
		entities.push({
			id: `h-${id}-${i}`,
			type: rand() > 0.5 ? "OIL_SLICK" : "MUD_PIT",
			position: [(rand() - 0.5) * (CHUNK_SIZE - 20), 0.05, (rand() - 0.5) * (CHUNK_SIZE - 20)],
		});
	}

	// Extraction Point at 0,0 or rare
	if (id === "0,0" || rand() > 0.98) {
		entities.push({ id: `extract-${id}`, type: "EXTRACTION_POINT", position: [0, 0, 0] });
	}

	// Add Prison Cages (Character Unlocks)
	if (x === 5 && z === 5) {
		entities.push({
			id: "cage-whiskers",
			type: "PRISON_CAGE",
			position: [0, 0, 0],
			objectiveId: "whiskers",
		});
	}
	if (terrainType === "RIVER" && rand() > 0.8) {
		entities.push({
			id: `raft-${id}`,
			type: "RAFT",
			position: [(rand() - 0.5) * 40, 0.2, (rand() - 0.5) * 40],
		});
	}

	return {
		id,
		x,
		z,
		seed,
		terrainType,
		secured: false,
		entities,
		decorations: [
			{ id: `${id}-dec-0`, type: "REED", count: Math.floor(rand() * 20) + 10 },
			{ id: `${id}-dec-1`, type: "LILYPAD", count: Math.floor(rand() * 15) + 5 },
			{ id: `${id}-dec-2`, type: "DEBRIS", count: Math.floor(rand() * 5) },
			{ id: `${id}-dec-3`, type: "BURNT_TREE", count: terrainType === "DENSE_JUNGLE" ? 15 : 5 },
			{ id: `${id}-dec-4`, type: "MANGROVE", count: terrainType === "DENSE_JUNGLE" ? 20 : 10 },
			{ id: `${id}-dec-5`, type: "DRUM", count: Math.floor(rand() * 3) },
		],
	};
}
