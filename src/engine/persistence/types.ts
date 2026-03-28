import type { DiagnosticSnapshot } from "../diagnostics/types";
import type { SeedBundle } from "../random/seed";

export interface CampaignProgressRecord {
	currentMissionId: string | null;
	difficulty: "support" | "tactical" | "elite";
	missions: Record<
		string,
		{
			status: "locked" | "available" | "completed";
			stars: number;
			bestTimeMs: number | null;
		}
	>;
}

export interface UserSettingsRecord {
	masterVolume: number;
	musicVolume: number;
	sfxVolume: number;
	showSubtitles: boolean;
	reduceMotion: boolean;
}

export interface SkirmishSetupRecord {
	mapPreset: string;
	seed: SeedBundle;
	startingResources: {
		fish: number;
		timber: number;
		salvage: number;
	};
}

export interface MissionSaveRecord {
	slot: number;
	missionId: string;
	seed: SeedBundle;
	savedAt: number;
	playTimeMs: number;
	snapshot: string;
}

export interface PersistenceStore {
	initialize(): Promise<void>;
	saveCampaign(progress: CampaignProgressRecord): Promise<void>;
	loadCampaign(): Promise<CampaignProgressRecord | null>;
	saveSettings(settings: UserSettingsRecord): Promise<void>;
	loadSettings(): Promise<UserSettingsRecord | null>;
	saveSkirmishSetup(setup: SkirmishSetupRecord): Promise<void>;
	loadSkirmishSetup(): Promise<SkirmishSetupRecord | null>;
	saveMission(record: MissionSaveRecord): Promise<void>;
	loadMission(slot: number): Promise<MissionSaveRecord | null>;
	saveDiagnostics(snapshot: DiagnosticSnapshot): Promise<void>;
	listDiagnostics(): Promise<DiagnosticSnapshot[]>;
}
