export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER" | "CANTEEN" | "VICTORY";
export type DifficultyMode = "ELITE" | "TACTICAL" | "SUPPORT";

export interface CharacterTraits {
	id: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
	unlockRequirement?: string;
}

export interface CharacterGear {
	headgear?: "bandana" | "beret" | "helmet" | "none";
	vest?: "tactical" | "heavy" | "none";
	backgear?: "radio" | "scuba" | "none";
	weaponId: string;
}

export interface WeaponData {
	id: string;
	name: string;
	type: "PISTOL" | "RIFLE" | "MACHINE_GUN" | "SHOTGUN";
	damage: number;
	fireRate: number;
	bulletSpeed: number;
	recoil: number;
	range: number;
	visualType: "FISH_CANNON" | "BUBBLE_GUN" | "PISTOL_GRIP";
}

export type BaseEntity = {
	id: string;
	position: [number, number, number];
};

export type PredatorEntity = BaseEntity & {
	type: "GATOR" | "SNAKE" | "SNAPPER";
	hp: number;
	suppression: number;
	isHeavy?: boolean;
};

export type ObjectiveEntity = BaseEntity & {
	type: "GAS_STOCKPILE" | "SIPHON" | "PRISON_CAGE";
	hp?: number;
	objectiveId?: string;
	captured?: boolean;
	rescued?: boolean;
};

export type InteractionEntity = BaseEntity & {
	type: "VILLAGER" | "HEALER" | "HUT" | "EXTRACTION_POINT" | "RAFT" | "CLAM_BASKET";
	interacted?: boolean;
	isHeavy?: boolean;
};

export type EnvironmentEntity = BaseEntity & {
	type: "PLATFORM" | "CLIMBABLE" | "OIL_SLICK" | "MUD_PIT";
};

export type Entity = PredatorEntity | ObjectiveEntity | InteractionEntity | EnvironmentEntity;

export interface ChunkData {
	id: string; // "x,z"
	x: number;
	z: number;
	seed: number;
	terrainType: "RIVER" | "MARSH" | "DENSE_JUNGLE";
	secured: boolean;
	entities: Entity[];
	decorations: {
		id: string;
		type: "REED" | "LILYPAD" | "DEBRIS" | "BURNT_TREE" | "MANGROVE" | "DRUM";
		count: number;
	}[];
}

export interface PlacedComponent {
	id: string;
	type: "FLOOR" | "WALL" | "ROOF" | "STILT";
	position: [number, number, number];
	rotation: [number, number, number];
}

export interface SaveData {
	version: number;
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
	unlockedCharacters: string[];
	unlockedWeapons: string[];
	coins: number;
	discoveredChunks: Record<string, ChunkData>;
	territoryScore: number;
	difficultyMode: DifficultyMode;
	isFallTriggered: boolean;
	strategicObjectives: {
		siphonsDismantled: number;
		villagesLiberated: number;
		gasStockpilesCaptured: number;
		healersProtected: number;
		alliesRescued: number;
	};
	spoilsOfWar: {
		creditsEarned: number;
		clamsHarvested: number;
		upgradesUnlocked: number;
	};
	peacekeepingScore: number;
	upgrades: {
		speedBoost: number;
		healthBoost: number;
		damageBoost: number;
		weaponLvl: Record<string, number>;
	};
	isLZSecured: boolean;
	baseComponents: PlacedComponent[];
}
