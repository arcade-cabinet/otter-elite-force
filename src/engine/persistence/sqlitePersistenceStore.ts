import { getDatabase, type DatabaseAdapter } from "@/persistence/database";
import type { DiagnosticSnapshot } from "../diagnostics/types";
import type {
	CampaignProgressRecord,
	MissionSaveRecord,
	PersistenceStore,
	SkirmishSetupRecord,
	UserSettingsRecord,
} from "./types";

function toJson(value: unknown): string {
	return JSON.stringify(value);
}

function fromJson<T>(value: string | null | undefined): T | null {
	if (!value) return null;
	return JSON.parse(value) as T;
}

export class SqlitePersistenceStore implements PersistenceStore {
	readonly #db: DatabaseAdapter;

	constructor(db: DatabaseAdapter = getDatabase()) {
		this.#db = db;
	}

	async initialize(): Promise<void> {
		await this.#db.execute(`
			CREATE TABLE IF NOT EXISTS app_state (
				scope TEXT PRIMARY KEY,
				payload_json TEXT NOT NULL,
				updated_at INTEGER NOT NULL
			)
		`);
		await this.#db.execute(`
			CREATE TABLE IF NOT EXISTS mission_save (
				slot INTEGER PRIMARY KEY,
				mission_id TEXT NOT NULL,
				seed_json TEXT NOT NULL,
				snapshot_json TEXT NOT NULL,
				play_time_ms INTEGER NOT NULL,
				saved_at INTEGER NOT NULL
			)
		`);
		await this.#db.execute(`
			CREATE TABLE IF NOT EXISTS diagnostic_snapshot (
				run_id TEXT PRIMARY KEY,
				payload_json TEXT NOT NULL,
				created_at INTEGER NOT NULL
			)
		`);
	}

	async saveCampaign(progress: CampaignProgressRecord): Promise<void> {
		await this.#writeScope("campaign", progress);
	}

	async loadCampaign(): Promise<CampaignProgressRecord | null> {
		return this.#readScope<CampaignProgressRecord>("campaign");
	}

	async saveSettings(settings: UserSettingsRecord): Promise<void> {
		await this.#writeScope("settings", settings);
	}

	async loadSettings(): Promise<UserSettingsRecord | null> {
		return this.#readScope<UserSettingsRecord>("settings");
	}

	async saveSkirmishSetup(setup: SkirmishSetupRecord): Promise<void> {
		await this.#writeScope("skirmish_setup", setup);
	}

	async loadSkirmishSetup(): Promise<SkirmishSetupRecord | null> {
		return this.#readScope<SkirmishSetupRecord>("skirmish_setup");
	}

	async saveMission(record: MissionSaveRecord): Promise<void> {
		await this.#db.execute(
			`INSERT OR REPLACE INTO mission_save (
				slot, mission_id, seed_json, snapshot_json, play_time_ms, saved_at
			) VALUES (?, ?, ?, ?, ?, ?)`,
			[
				record.slot,
				record.missionId,
				toJson(record.seed),
				record.snapshot,
				record.playTimeMs,
				record.savedAt,
			],
		);
	}

	async loadMission(slot: number): Promise<MissionSaveRecord | null> {
		const rows = await this.#db.query<{
			slot: number;
			mission_id: string;
			seed_json: string;
			snapshot_json: string;
			play_time_ms: number;
			saved_at: number;
		}>(
			`SELECT slot, mission_id, seed_json, snapshot_json, play_time_ms, saved_at
			 FROM mission_save
			 WHERE slot = ?`,
			[slot],
		);
		const row = rows[0];
		if (!row) return null;
		return {
			slot: row.slot,
			missionId: row.mission_id,
			seed: fromJson(row.seed_json) ?? {
				phrase: "silent-ember-heron",
				source: "manual",
				numericSeed: 0,
				designSeed: 0,
				gameplaySeeds: {},
			},
			snapshot: row.snapshot_json,
			playTimeMs: row.play_time_ms,
			savedAt: row.saved_at,
		};
	}

	async saveDiagnostics(snapshot: DiagnosticSnapshot): Promise<void> {
		await this.#db.execute(
			"INSERT OR REPLACE INTO diagnostic_snapshot (run_id, payload_json, created_at) VALUES (?, ?, ?)",
			[snapshot.runId, toJson(snapshot), Date.now()],
		);
	}

	async listDiagnostics(): Promise<DiagnosticSnapshot[]> {
		const rows = await this.#db.query<{ payload_json: string }>(
			"SELECT payload_json FROM diagnostic_snapshot ORDER BY created_at DESC",
		);
		return rows
			.map((row) => fromJson<DiagnosticSnapshot>(row.payload_json))
			.filter((snapshot): snapshot is DiagnosticSnapshot => snapshot !== null);
	}

	async #writeScope(scope: string, payload: unknown): Promise<void> {
		await this.#db.execute(
			"INSERT OR REPLACE INTO app_state (scope, payload_json, updated_at) VALUES (?, ?, ?)",
			[scope, toJson(payload), Date.now()],
		);
	}

	async #readScope<T>(scope: string): Promise<T | null> {
		const rows = await this.#db.query<{ payload_json: string }>(
			"SELECT payload_json FROM app_state WHERE scope = ?",
			[scope],
		);
		return fromJson<T>(rows[0]?.payload_json);
	}
}
