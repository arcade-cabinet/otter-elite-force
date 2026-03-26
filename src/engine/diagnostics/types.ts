export interface DiagnosticEvent {
	tick: number;
	type: string;
	payload?: Record<string, unknown>;
}

export interface PerformanceCounters {
	fps: number;
	frameTimeMs: number;
	systemTimeMs: number;
}

export interface PathfindingDiagnostics {
	navWarnings: string[];
	stuckEntities: number[];
	boundaryViolations: number[];
}

export interface DiagnosticSnapshot {
	runId: string;
	mode: "campaign" | "skirmish";
	missionId: string | null;
	skirmishPresetId: string | null;
	seedPhrase: string;
	designSeed: number;
	gameplaySeeds: Record<string, number>;
	tick: number;
	objectives: Array<{
		id: string;
		status: string;
	}>;
	events: DiagnosticEvent[];
	performance: PerformanceCounters;
	pathfinding: PathfindingDiagnostics;
	fogVisibleTiles: number;
	minimapVisibleEntities: number;
	failures: string[];
}

export function createEmptyDiagnosticsSnapshot(): DiagnosticSnapshot {
	return {
		runId: "pending-run",
		mode: "campaign",
		missionId: null,
		skirmishPresetId: null,
		seedPhrase: "silent-ember-heron",
		designSeed: 0,
		gameplaySeeds: {},
		tick: 0,
		objectives: [],
		events: [],
		performance: {
			fps: 0,
			frameTimeMs: 0,
			systemTimeMs: 0,
		},
		pathfinding: {
			navWarnings: [],
			stuckEntities: [],
			boundaryViolations: [],
		},
		fogVisibleTiles: 0,
		minimapVisibleEntities: 0,
		failures: [],
	};
}
