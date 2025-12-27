import type {
	ChunkData,
	Entity,
	EnvironmentEntity,
	InteractionEntity,
	ObjectiveEntity,
	PredatorEntity,
} from "./types";

export const CHUNK_SIZE = 100;

// Efficient seeded random function
export const getSeededRandom = (x: number, z: number, index: number = 0) => {
	const seed = x * 374761393 + z * 668265263 + index * 1664525;
	const t = (seed ^ (seed << 13)) >>> 0;
	return ((t ^ (t >>> 17) ^ (t << 5)) & 0x7fffffff) / 0x7fffffff;
};

export const generateChunk = (x: number, z: number): ChunkData => {
	const id = `${x},${z}`;
	const seed = Math.abs(x * 31 + z * 17);
	let randIndex = 0;

	const nextRand = () => getSeededRandom(x, z, randIndex++);

	const terrainTypes: ChunkData["terrainType"][] = [
		"RIVER",
		"MARSH",
		"DENSE_JUNGLE",
	];
	const terrainType =
		terrainTypes[Math.floor(nextRand() * terrainTypes.length)];

	const entities: Entity[] = [];

	// Add Predators
	const entityCount = Math.floor(nextRand() * 5) + 2;
	for (let i = 0; i < entityCount; i++) {
		const r = nextRand();
		const type = r > 0.7 ? (nextRand() > 0.5 ? "SNAPPER" : "SNAKE") : "GATOR";
		const predator: PredatorEntity = {
			id: `e-${id}-${i}`,
			type: type as "SNAPPER" | "SNAKE" | "GATOR",
			position: [
				(nextRand() - 0.5) * CHUNK_SIZE,
				type === "SNAKE" ? 5 : 0,
				(nextRand() - 0.5) * CHUNK_SIZE,
			],
			isHeavy: nextRand() > 0.8,
			hp: type === "SNAPPER" ? 20 : type === "GATOR" ? 10 : 2,
			suppression: 0,
		};
		entities.push(predator);
	}

	// Add Platforms
	const platformCount = Math.floor(nextRand() * 3) + 1;
	for (let i = 0; i < platformCount; i++) {
		const platform: EnvironmentEntity = {
			id: `p-${id}-${i}`,
			type: "PLATFORM",
			position: [
				(nextRand() - 0.5) * (CHUNK_SIZE - 20),
				0.5,
				(nextRand() - 0.5) * (CHUNK_SIZE - 20),
			],
		};
		entities.push(platform);
	}

	// Add Climbables
	const climbableCount = Math.floor(nextRand() * 2) + 1;
	for (let i = 0; i < climbableCount; i++) {
		const climbable: EnvironmentEntity = {
			id: `c-${id}-${i}`,
			type: "CLIMBABLE",
			position: [
				(nextRand() - 0.5) * (CHUNK_SIZE - 30),
				5,
				(nextRand() - 0.5) * (CHUNK_SIZE - 30),
			],
		};
		entities.push(climbable);
	}

	// Add Siphons
	if (nextRand() > 0.8) {
		const siphon: ObjectiveEntity = {
			id: `siphon-${id}`,
			type: "SIPHON",
			position: [(nextRand() - 0.5) * 40, 0, (nextRand() - 0.5) * 40],
			hp: 50,
		};
		entities.push(siphon);
	}

	// Add Gas Stockpiles (Strategic Objectives)
	if (nextRand() > 0.85) {
		const gas: ObjectiveEntity = {
			id: `gas-${id}`,
			type: "GAS_STOCKPILE",
			position: [(nextRand() - 0.5) * 40, 0.5, (nextRand() - 0.5) * 40],
			hp: 30,
		};
		entities.push(gas);
	}

	// Add Clam Baskets (Spoils / Booby Traps)
	if (nextRand() > 0.75) {
		const basket: InteractionEntity = {
			id: `basket-${id}`,
			type: "CLAM_BASKET",
			position: [(nextRand() - 0.5) * 35, 0.2, (nextRand() - 0.5) * 35],
			isHeavy: nextRand() > 0.5,
		};
		entities.push(basket);
	}

	// Add Enemy Outposts
	if (nextRand() > 0.9 && id !== "0,0") {
		const outpostX = (nextRand() - 0.5) * 60;
		const outpostZ = (nextRand() - 0.5) * 60;

		const hut: InteractionEntity = {
			id: `outpost-hut-${id}`,
			type: "HUT",
			position: [outpostX, 0, outpostZ],
		};
		entities.push(hut);

		for (let i = 0; i < 3; i++) {
			const angle = (i / 3) * Math.PI * 2;
			const snapper: PredatorEntity = {
				id: `outpost-snapper-${id}-${i}`,
				type: "SNAPPER",
				position: [
					outpostX + Math.cos(angle) * 8,
					0,
					outpostZ + Math.sin(angle) * 8,
				],
				hp: 30,
				suppression: 0,
			};
			entities.push(snapper);
		}

		const gas: ObjectiveEntity = {
			id: `outpost-gas-${id}`,
			type: "GAS_STOCKPILE",
			position: [outpostX + 2, 0, outpostZ + 2],
		};
		entities.push(gas);
	}

	// Add Villagers/Huts
	if (nextRand() > 0.7) {
		const isHealerVillage = nextRand() > 0.8;
		const villageX = (nextRand() - 0.5) * 30;
		const villageZ = (nextRand() - 0.5) * 30;
		const hut: InteractionEntity = {
			id: `hut-${id}`,
			type: "HUT",
			position: [villageX, 0, villageZ],
		};
		const villager: InteractionEntity = {
			id: `vil-${id}`,
			type: isHealerVillage ? "HEALER" : "VILLAGER",
			position: [villageX + 3, 0, villageZ + 2],
		};
		entities.push(hut);
		entities.push(villager);
	}

	// Add Hazards
	const hazardCount = Math.floor(nextRand() * 2) + 1;
	for (let i = 0; i < hazardCount; i++) {
		const type = nextRand() > 0.5 ? "OIL_SLICK" : "MUD_PIT";
		const hazard: EnvironmentEntity = {
			id: `h-${id}-${i}`,
			type: type as "OIL_SLICK" | "MUD_PIT",
			position: [
				(nextRand() - 0.5) * (CHUNK_SIZE - 20),
				0.05,
				(nextRand() - 0.5) * (CHUNK_SIZE - 20),
			],
		};
		entities.push(hazard);
	}

	// Extraction Point
	if (id === "0,0" || nextRand() > 0.98) {
		const extract: InteractionEntity = {
			id: `extract-${id}`,
			type: "EXTRACTION_POINT",
			position: [0, 0, 0],
		};
		entities.push(extract);
	}

	// Prison Cages
	if (x === 5 && z === 5) {
		const cage: ObjectiveEntity = {
			id: "cage-whiskers",
			type: "PRISON_CAGE",
			position: [0, 0, 0],
			objectiveId: "whiskers",
		};
		entities.push(cage);
	}

	if (terrainType === "RIVER" && nextRand() > 0.8) {
		const raft: InteractionEntity = {
			id: `raft-${id}`,
			type: "RAFT",
			position: [(nextRand() - 0.5) * 40, 0.2, (nextRand() - 0.5) * 40],
		};
		entities.push(raft);
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
			{
				id: `${id}-dec-0`,
				type: "REED",
				count: Math.floor(nextRand() * 20) + 10,
			},
			{
				id: `${id}-dec-1`,
				type: "LILYPAD",
				count: Math.floor(nextRand() * 15) + 5,
			},
			{ id: `${id}-dec-2`, type: "DEBRIS", count: Math.floor(nextRand() * 5) },
			{
				id: `${id}-dec-3`,
				type: "BURNT_TREE",
				count: terrainType === "DENSE_JUNGLE" ? 15 : 5,
			},
			{
				id: `${id}-dec-4`,
				type: "MANGROVE",
				count: terrainType === "DENSE_JUNGLE" ? 20 : 10,
			},
			{ id: `${id}-dec-5`, type: "DRUM", count: Math.floor(nextRand() * 3) },
		],
	};
};
