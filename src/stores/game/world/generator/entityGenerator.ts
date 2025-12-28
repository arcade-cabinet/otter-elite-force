import { CHUNK_SIZE } from "../../../gameStore";
import type {
	Entity,
	EnvironmentEntity,
	InteractionEntity,
	ObjectiveEntity,
	PredatorEntity,
} from "../../../types";
import type { WorldPoint } from "../../../worldLayout";

// Efficient seeded random function
export const getSeededRandom = (x: number, z: number, index: number = 0) => {
	const seed = x * 374761393 + z * 668265263 + index * 1664525;
	const t = (seed ^ (seed << 13)) >>> 0;
	return ((t ^ (t >>> 17) ^ (t << 5)) & 0x7fffffff) / 0x7fffffff;
};

export function generateChunkEntities(
	x: number,
	z: number,
	id: string,
	difficulty: number,
	terrainType: string,
	isPOI: boolean,
	keyCoord: WorldPoint | null,
): Entity[] {
	let randIndex = 0;
	const nextRand = () => getSeededRandom(x, z, randIndex++);
	const entities: Entity[] = [];

	// Add Predators - count and type based on difficulty
	const baseEnemyCount = Math.floor(difficulty * 4) + 2;
	const entityCount = Math.floor(nextRand() * 3) + baseEnemyCount;
	for (let i = 0; i < entityCount; i++) {
		const r = nextRand();
		const typeRoll = r + difficulty * 0.3;
		const type: "SNAPPER" | "SNAKE" | "GATOR" | "SCOUT" =
			typeRoll > 0.9 ? "SNAPPER" : typeRoll > 0.75 ? "SNAKE" : typeRoll > 0.6 ? "SCOUT" : "GATOR";

		const isHeavy = nextRand() < difficulty * 0.4;

		const predator: PredatorEntity = {
			id: `e-${id}-${i}`,
			type,
			position: [
				(nextRand() - 0.5) * CHUNK_SIZE,
				type === "SNAKE" ? 5 : 0,
				(nextRand() - 0.5) * CHUNK_SIZE,
			],
			isHeavy,
			hp:
				type === "SNAPPER"
					? isHeavy
						? 40
						: 20
					: type === "GATOR"
						? isHeavy
							? 20
							: 10
						: type === "SCOUT"
							? 3
							: 2,
			suppression: 0,
		};
		entities.push(predator);
	}

	// Add terrain-specific environment elements
	if (terrainType === "DENSE_JUNGLE") {
		const platformCount = Math.floor(nextRand() * 2) + (isPOI ? 0 : 1);
		for (let i = 0; i < platformCount; i++) {
			entities.push({
				id: `p-${id}-${i}`,
				type: "PLATFORM",
				position: [
					(nextRand() - 0.5) * (CHUNK_SIZE - 20),
					0.5 + nextRand() * 2,
					(nextRand() - 0.5) * (CHUNK_SIZE - 20),
				],
			} as EnvironmentEntity);
		}

		const climbableCount = Math.floor(nextRand() * 2) + 1;
		for (let i = 0; i < climbableCount; i++) {
			entities.push({
				id: `c-${id}-${i}`,
				type: "CLIMBABLE",
				position: [
					(nextRand() - 0.5) * (CHUNK_SIZE - 30),
					5,
					(nextRand() - 0.5) * (CHUNK_SIZE - 30),
				],
			} as EnvironmentEntity);
		}
	}

	if (terrainType === "MARSH") {
		if (nextRand() > 0.5) {
			entities.push({
				id: `mud-${id}`,
				type: "MUD_PIT",
				position: [(nextRand() - 0.5) * 40, 0.05, (nextRand() - 0.5) * 40],
			} as EnvironmentEntity);
		}
		if (nextRand() > 0.7) {
			entities.push({
				id: `sludge-env-${id}`,
				type: "TOXIC_SLUDGE",
				position: [(nextRand() - 0.5) * 40, 0.05, (nextRand() - 0.5) * 40],
			} as EnvironmentEntity);
		}
	}

	if (terrainType === "RIVER") {
		if (nextRand() > 0.6) {
			entities.push({
				id: `oil-${id}`,
				type: "OIL_SLICK",
				position: [(nextRand() - 0.5) * 30, 0.02, (nextRand() - 0.5) * 30],
			} as EnvironmentEntity);
		}
		if (nextRand() > 0.75 && !isPOI) {
			entities.push({
				id: `raft-env-${id}`,
				type: "RAFT",
				position: [(nextRand() - 0.5) * 40, 0.2, (nextRand() - 0.5) * 40],
			} as InteractionEntity);
		}
	}

	if (!isPOI) {
		if (nextRand() > 0.8 - difficulty * 0.2) {
			entities.push({
				id: `siphon-${id}`,
				type: "SIPHON",
				position: [(nextRand() - 0.5) * 40, 0, (nextRand() - 0.5) * 40],
				hp: 40 + difficulty * 20,
			} as ObjectiveEntity);
		}

		if (nextRand() > 0.85) {
			entities.push({
				id: `gas-${id}`,
				type: "GAS_STOCKPILE",
				position: [(nextRand() - 0.5) * 40, 0.5, (nextRand() - 0.5) * 40],
				hp: 30,
			} as ObjectiveEntity);
		}

		if (nextRand() > 0.75) {
			entities.push({
				id: `basket-${id}`,
				type: "CLAM_BASKET",
				position: [(nextRand() - 0.5) * 35, 0.2, (nextRand() - 0.5) * 35],
				isHeavy: nextRand() > 0.5,
			} as InteractionEntity);
		}

		if (difficulty < 0.5 && nextRand() > 0.7) {
			const isHealerVillage = nextRand() > 0.85;
			const villageX = (nextRand() - 0.5) * 30;
			const villageZ = (nextRand() - 0.5) * 30;
			entities.push({
				id: `hut-${id}`,
				type: "HUT",
				position: [villageX, 0, villageZ],
			} as InteractionEntity);
			entities.push({
				id: `vil-${id}`,
				type: isHealerVillage ? "HEALER" : "VILLAGER",
				position: [villageX + 3, 0, villageZ + 2],
			} as InteractionEntity);
		}
	}

	if (keyCoord) {
		switch (keyCoord.type) {
			case "LZ":
				entities.push({
					id: `extract-${id}`,
					type: "EXTRACTION_POINT",
					position: [0, 0, 0],
				} as InteractionEntity);
				break;
			case "VILLAGE":
				entities.push({
					id: `hut-${id}-main`,
					type: "HUT",
					position: [0, 0, 0],
				} as InteractionEntity);
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `villager-${id}-${i}`,
						type: "VILLAGER",
						position: [Math.cos(angle) * 5, 0, Math.sin(angle) * 5],
					} as InteractionEntity);
				}
				break;
			case "HEALER_HUB":
				entities.push({
					id: `healer-${id}`,
					type: "HEALER",
					position: [0, 0, 0],
				} as InteractionEntity);
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [8, 0, 0],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				break;
			case "PRISON_CAMP":
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [0, 0, 0],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				for (let i = 0; i < 4; i++) {
					const angle = (i / 4) * Math.PI * 2;
					entities.push({
						id: `guard-${id}-${i}`,
						type: "SNAPPER",
						position: [Math.cos(angle) * 12, 0, Math.sin(angle) * 12],
						hp: 30,
						suppression: 0,
					} as PredatorEntity);
				}
				entities.push({
					id: `scout-${id}`,
					type: "SCOUT",
					position: [0, 5, 15],
					hp: 3,
					suppression: 0,
				} as PredatorEntity);
				break;
			case "ENEMY_OUTPOST":
				entities.push({
					id: `outpost-hut-${id}`,
					type: "HUT",
					position: [0, 0, 0],
				} as InteractionEntity);
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `outpost-enemy-${id}-${i}`,
						type: nextRand() > 0.5 ? "GATOR" : "SNAPPER",
						position: [Math.cos(angle) * 10, 0, Math.sin(angle) * 10],
						hp: 15,
						suppression: 0,
						isHeavy: nextRand() > 0.7,
					} as PredatorEntity);
				}
				break;
			case "SIPHON_CLUSTER":
				for (let i = 0; i < 3; i++) {
					const angle = (i / 3) * Math.PI * 2;
					entities.push({
						id: `siphon-${id}-${i}`,
						type: "SIPHON",
						position: [Math.cos(angle) * 15, 0, Math.sin(angle) * 15],
						hp: 50,
					} as ObjectiveEntity);
				}
				entities.push({
					id: `sludge-${id}`,
					type: "TOXIC_SLUDGE",
					position: [0, 0.05, 0],
				} as EnvironmentEntity);
				break;
			case "GAS_DEPOT":
				for (let i = 0; i < 4; i++) {
					entities.push({
						id: `gas-${id}-${i}`,
						type: "GAS_STOCKPILE",
						position: [(nextRand() - 0.5) * 20, 0, (nextRand() - 0.5) * 20],
						hp: 30,
					} as ObjectiveEntity);
				}
				if (keyCoord.rescueCharacter) {
					entities.push({
						id: `cage-${keyCoord.rescueCharacter}`,
						type: "PRISON_CAGE",
						position: [0, 0, -15],
						objectiveId: keyCoord.rescueCharacter,
					} as ObjectiveEntity);
				}
				break;
			case "BOSS_ARENA":
				entities.push({
					id: `boss-siphon-${id}`,
					type: "SIPHON",
					position: [0, 0, 0],
					hp: 200,
				} as ObjectiveEntity);
				for (let i = 0; i < 4; i++) {
					const angle = (i / 4) * Math.PI * 2;
					entities.push({
						id: `siphon-${id}-${i}`,
						type: "SIPHON",
						position: [Math.cos(angle) * 25, 0, Math.sin(angle) * 25],
						hp: 75,
					} as ObjectiveEntity);
				}
				for (let i = 0; i < 5; i++) {
					const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
					entities.push({
						id: `boss-gator-${id}-${i}`,
						type: "GATOR",
						position: [Math.cos(angle) * 35, 0, Math.sin(angle) * 35],
						hp: 40,
						suppression: 0,
						isHeavy: true,
					} as PredatorEntity);
				}
				for (let i = 0; i < 2; i++) {
					entities.push({
						id: `elite-snapper-${id}-${i}`,
						type: "SNAPPER",
						position: [i === 0 ? -15 : 15, 0, 20],
						hp: 50,
						suppression: 0,
					} as PredatorEntity);
				}
				break;
			case "RAFT_DOCK":
				entities.push({
					id: `raft-${id}`,
					type: "RAFT",
					position: [0, 0.2, 0],
				} as InteractionEntity);
				entities.push({
					id: `platform-${id}`,
					type: "PLATFORM",
					position: [5, 0.5, 0],
				} as EnvironmentEntity);
				break;
		}
	}

	if (id === "0,0" && !entities.some((e) => e.type === "EXTRACTION_POINT")) {
		entities.push({
			id: `extract-${id}`,
			type: "EXTRACTION_POINT",
			position: [0, 0, 0],
		} as InteractionEntity);
	}

	return entities;
}
