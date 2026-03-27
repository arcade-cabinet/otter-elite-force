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
	/** World X position to center camera on when clicked. */
	worldX?: number;
	/** World Y position to center camera on when clicked. */
	worldY?: number;
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
	issueMove(targetX: number, targetY: number): void;
	issueAttack(targetX: number, targetY: number, targetEid?: number): void;
	issueStop(): void;
	issuePatrol(targetX: number, targetY: number): void;
	startSkirmish(): void;
	setSkirmishSeed(seedPhrase: string): void;
	shuffleSkirmishSeed(): void;
	/** Drain the command queue — returns all pending commands and clears the queue. */
	drainCommands(): Array<{ type: string; payload?: Record<string, unknown> }>;
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

	const commandQueue: Array<{ type: string; payload?: Record<string, unknown> }> = [];

	function enqueueCommand(type: string, payload?: Record<string, unknown>): void {
		commandQueue.push({ type, payload });
	}

	return {
		state,
		pause(): void {
			enqueueCommand("pause");
		},
		resume(): void {
			enqueueCommand("resume");
		},
		saveGame(): void {
			enqueueCommand("save");
		},
		startBuild(buildingId: string): void {
			enqueueCommand("startBuild", { buildingId });
		},
		queueUnit(unitId: string): void {
			enqueueCommand("queueUnit", { unitId });
		},
		issueResearch(researchId: string): void {
			enqueueCommand("issueResearch", { researchId });
		},
		issueMove(targetX: number, targetY: number): void {
			enqueueCommand("move", { targetX, targetY });
		},
		issueAttack(targetX: number, targetY: number, targetEid?: number): void {
			enqueueCommand("attack", { targetX, targetY, targetEid });
		},
		issueStop(): void {
			enqueueCommand("stop");
		},
		issuePatrol(targetX: number, targetY: number): void {
			enqueueCommand("patrol", { targetX, targetY });
		},
		startSkirmish(): void {
			state.screen = "skirmish";
		},
		setSkirmishSeed(_seedPhrase: string): void {},
		shuffleSkirmishSeed(): void {},
		drainCommands(): Array<{ type: string; payload?: Record<string, unknown> }> {
			return commandQueue.splice(0, commandQueue.length);
		},
	};
}
