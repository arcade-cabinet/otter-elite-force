export interface ResourceViewModel {
	fish: number;
	timber: number;
	salvage: number;
}

export interface PopulationViewModel {
	current: number;
	max: number;
}

export interface SelectionViewModel {
	entityIds: number[];
	primaryLabel: string;
	unitBreakdown: string;
}

export interface ObjectiveViewModel {
	id: string;
	description: string;
	status: string;
}

export interface AlertViewModel {
	id: string;
	severity: "info" | "warning" | "critical";
	message: string;
}

export interface DialogueViewModel {
	lines: Array<{ speaker: string; text: string }>;
}

export interface BossViewModel {
	name: string;
	currentHp: number;
	maxHp: number;
}

export interface GameBridgeState {
	screen: string;
	resources: ResourceViewModel;
	population: PopulationViewModel;
	selection: SelectionViewModel | null;
	objectives: ObjectiveViewModel[];
	alerts: AlertViewModel[];
	dialogue: DialogueViewModel | null;
	weather: "clear" | "rain" | "monsoon" | null;
	boss: BossViewModel | null;
}

export interface GameBridge {
	readonly state: GameBridgeState;
	pause(): void;
	resume(): void;
	saveGame(): void;
	startBuild(buildingId: string): void;
	queueUnit(unitId: string): void;
	issueResearch(researchId: string): void;
	startSkirmish(): void;
	setSkirmishSeed(seedPhrase: string): void;
	shuffleSkirmishSeed(): void;
}

export function createGameBridge(initialState?: Partial<GameBridgeState>): GameBridge {
	const state: GameBridgeState = {
		screen: initialState?.screen ?? "menu",
		resources: initialState?.resources ?? { fish: 0, timber: 0, salvage: 0 },
		population: initialState?.population ?? { current: 0, max: 0 },
		selection: initialState?.selection ?? null,
		objectives: initialState?.objectives ?? [],
		alerts: initialState?.alerts ?? [],
		dialogue: initialState?.dialogue ?? null,
		weather: initialState?.weather ?? null,
		boss: initialState?.boss ?? null,
	};

	return {
		state,
		pause(): void {
			state.screen = "paused";
		},
		resume(): void {
			state.screen = "game";
		},
		saveGame(): void {},
		startBuild(_buildingId: string): void {},
		queueUnit(_unitId: string): void {},
		issueResearch(_researchId: string): void {},
		startSkirmish(): void {
			state.screen = "skirmish";
		},
		setSkirmishSeed(_seedPhrase: string): void {},
		shuffleSkirmishSeed(): void {},
	};
}
