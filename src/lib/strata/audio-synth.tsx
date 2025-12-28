/**
 * Strata Audio Synth Stubs
 * Local implementations matching @strata-game-library/audio-synth API.
 * Uses Tone.js for procedural audio synthesis.
 */

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import * as Tone from "tone";

// ============================================================================
// Types
// ============================================================================

export interface SFXPreset {
	id: string;
	name: string;
	oscillator: { type: string };
	envelope: { attack: number; decay: number; sustain: number; release: number };
	frequency?: number | { start: number; end: number; curve?: string; duration?: number };
	duration?: string;
	volume?: number;
	noise?: { type: string; envelope: { attack: number; decay: number; sustain: number; release: number }; volume?: number };
}

export interface ISynthManager {
	init(): Promise<void>;
	isReady(): boolean;
	playSFX(preset: SFXPreset | string): void;
	playMusic(patternId: string): void;
	stopMusic(): void;
	setMasterVolume(volume: number): void;
	stopAll(): void;
	dispose(): void;
}

export interface AudioSynthContextValue {
	manager: ISynthManager | null;
	isReady: boolean;
	playSFX: (preset: SFXPreset | string) => void;
	playMusic: (patternId: string) => void;
	stopMusic: () => void;
	setMasterVolume: (volume: number) => void;
}

// ============================================================================
// SFX Presets
// ============================================================================

export const SFX_PRESETS: Record<string, SFXPreset> = {
	gunshot: {
		id: "gunshot",
		name: "Gunshot",
		oscillator: { type: "sawtooth" },
		envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
		frequency: { start: 150, end: 50, curve: "exponential", duration: 0.1 },
		duration: "16n",
	},
	shoot: {
		id: "shoot",
		name: "Shoot",
		oscillator: { type: "sawtooth" },
		envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
		frequency: { start: 150, end: 50, curve: "exponential", duration: 0.1 },
		duration: "16n",
	},
	impact: {
		id: "impact",
		name: "Impact",
		oscillator: { type: "square" },
		envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
		frequency: { start: 200, end: 80, curve: "exponential", duration: 0.05 },
		duration: "32n",
	},
	hit: {
		id: "hit",
		name: "Hit",
		oscillator: { type: "square" },
		envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
		frequency: { start: 200, end: 80, curve: "exponential", duration: 0.05 },
		duration: "32n",
	},
	pickup: {
		id: "pickup",
		name: "Pickup",
		oscillator: { type: "sine" },
		envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
		frequency: { start: 523, end: 1047, curve: "exponential", duration: 0.2 },
		duration: "8n",
	},
	explosion: {
		id: "explosion",
		name: "Explosion",
		oscillator: { type: "sine" },
		envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
		frequency: 40,
		duration: "4n",
	},
	select: {
		id: "select",
		name: "Select",
		oscillator: { type: "sine" },
		envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
		frequency: 800,
		duration: "32n",
	},
};

// ============================================================================
// Music Patterns
// ============================================================================

interface MusicPatternDef {
	id: string;
	notes: string[];
	interval: string;
	oscillator: { type: string };
	envelope: { attack: number; decay: number; sustain: number; release: number };
}

export const MUSIC_PATTERNS: Record<string, MusicPatternDef> = {
	menu: {
		id: "menu",
		notes: ["C4", "E4", "G4", "B4", "A4", "G4", "E4", "D4"],
		interval: "4n",
		oscillator: { type: "sine" },
		envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 },
	},
	combat: {
		id: "combat",
		notes: ["C2", "C2", "G2", "C2", "F2", "C2", "G2", "B1"],
		interval: "8n",
		oscillator: { type: "sawtooth" },
		envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.1 },
	},
	shop: {
		id: "shop",
		notes: ["C4", "D4", "E4", "G4", "A4", "G4", "E4", "D4"],
		interval: "8n",
		oscillator: { type: "triangle" },
		envelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.2 },
	},
	victory: {
		id: "victory",
		notes: ["C4", "E4", "G4", "C5", "G4", "C5", "E5", "C5"],
		interval: "8n",
		oscillator: { type: "triangle" },
		envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.3 },
	},
};

// ============================================================================
// SynthManager Class
// ============================================================================

class SynthManager implements ISynthManager {
	private initialized = false;
	private noiseSynth: Tone.NoiseSynth | null = null;
	private musicPattern: Tone.Pattern<string> | null = null;
	private musicSynth: Tone.MonoSynth | null = null;
	private currentMusicId: string | null = null;

	async init(): Promise<void> {
		if (this.initialized) return;

		await Tone.start();
		this.noiseSynth = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
		}).toDestination();
		this.initialized = true;
	}

	isReady(): boolean {
		return this.initialized;
	}

	playSFX(presetOrId: SFXPreset | string): void {
		if (!this.initialized) return;

		const preset: SFXPreset | undefined = typeof presetOrId === "string" 
			? SFX_PRESETS[presetOrId] 
			: presetOrId;
		if (!preset) return;

		const now = Tone.now();
		const synth = new Tone.Synth({
			oscillator: { type: preset.oscillator.type as Tone.ToneOscillatorType },
			envelope: preset.envelope,
		}).toDestination();

		if (preset.volume !== undefined) {
			synth.volume.value = preset.volume;
		}

		let frequency: Tone.Unit.Frequency = "A4";
		if (typeof preset.frequency === "number") {
			frequency = preset.frequency;
		} else if (preset.frequency?.start) {
			frequency = preset.frequency.start;
			if (preset.frequency.end) {
				const duration = preset.frequency.duration ?? 0.1;
				synth.frequency.setValueAtTime(preset.frequency.start, now);
				synth.frequency.exponentialRampToValueAtTime(preset.frequency.end, now + duration);
			}
		}

		const duration = preset.duration ?? "16n";
		synth.triggerAttackRelease(frequency, duration, now);

		setTimeout(() => synth.dispose(), 2000);
	}

	playMusic(patternId: string): void {
		if (!this.initialized) return;
		if (this.currentMusicId === patternId) return;

		this.stopMusic();

		const pattern = MUSIC_PATTERNS[patternId];
		if (!pattern) return;

		this.musicSynth = new Tone.MonoSynth({
			oscillator: { type: pattern.oscillator.type as Tone.ToneOscillatorType },
			envelope: pattern.envelope,
		}).toDestination();

		this.musicPattern = new Tone.Pattern(
			(time, note) => {
				this.musicSynth?.triggerAttackRelease(note, "16n", time);
			},
			pattern.notes,
			"upDown",
		);

		this.musicPattern.interval = pattern.interval as Tone.Unit.Time;
		this.musicPattern.start(0);
		Tone.getTransport().start();
		this.currentMusicId = patternId;
	}

	stopMusic(): void {
		Tone.getTransport().stop();
		Tone.getTransport().cancel();

		if (this.musicPattern) {
			this.musicPattern.dispose();
			this.musicPattern = null;
		}

		if (this.musicSynth) {
			this.musicSynth.dispose();
			this.musicSynth = null;
		}

		this.currentMusicId = null;
	}

	setMasterVolume(volume: number): void {
		Tone.getDestination().volume.value = Tone.gainToDb(volume);
	}

	stopAll(): void {
		this.stopMusic();
	}

	dispose(): void {
		this.stopAll();
		if (this.noiseSynth) {
			this.noiseSynth.dispose();
			this.noiseSynth = null;
		}
		this.initialized = false;
	}
}

export function createSynthManager(): ISynthManager {
	return new SynthManager();
}

// ============================================================================
// React Context
// ============================================================================

const AudioSynthContext = createContext<AudioSynthContextValue | null>(null);

export interface AudioSynthProviderProps {
	children: ReactNode;
	masterVolume?: number;
	debug?: boolean;
	autoInit?: boolean;
}

export function AudioSynthProvider({
	children,
	masterVolume = 1,
	autoInit = true,
}: AudioSynthProviderProps) {
	const [isReady, setIsReady] = useState(false);
	const managerRef = useRef<ISynthManager | null>(null);

	useEffect(() => {
		managerRef.current = new SynthManager();

		if (autoInit) {
			const handleInteraction = async () => {
				if (!managerRef.current || isReady) return;
				await managerRef.current.init();
				setIsReady(true);
				document.removeEventListener("click", handleInteraction);
				document.removeEventListener("touchstart", handleInteraction);
			};

			document.addEventListener("click", handleInteraction);
			document.addEventListener("touchstart", handleInteraction);

			return () => {
				document.removeEventListener("click", handleInteraction);
				document.removeEventListener("touchstart", handleInteraction);
				managerRef.current?.dispose();
			};
		}

		return () => {
			managerRef.current?.dispose();
		};
	}, [autoInit, isReady]);

	useEffect(() => {
		if (isReady && managerRef.current) {
			managerRef.current.setMasterVolume(masterVolume);
		}
	}, [masterVolume, isReady]);

	const playSFX = useCallback((preset: SFXPreset | string) => {
		managerRef.current?.playSFX(preset);
	}, []);

	const playMusic = useCallback((patternId: string) => {
		managerRef.current?.playMusic(patternId);
	}, []);

	const stopMusic = useCallback(() => {
		managerRef.current?.stopMusic();
	}, []);

	const setMasterVolumeCallback = useCallback((volume: number) => {
		managerRef.current?.setMasterVolume(volume);
	}, []);

	const value = useMemo<AudioSynthContextValue>(
		() => ({
			manager: managerRef.current,
			isReady,
			playSFX,
			playMusic,
			stopMusic,
			setMasterVolume: setMasterVolumeCallback,
		}),
		[isReady, playSFX, playMusic, stopMusic, setMasterVolumeCallback],
	);

	return <AudioSynthContext.Provider value={value}>{children}</AudioSynthContext.Provider>;
}

export function useAudioSynth(): AudioSynthContextValue {
	const context = useContext(AudioSynthContext);
	if (!context) {
		throw new Error("useAudioSynth must be used within an AudioSynthProvider");
	}
	return context;
}

export function usePlaySFX(): (preset: SFXPreset | string) => void {
	const context = useContext(AudioSynthContext);
	return context?.playSFX ?? (() => {});
}

export function usePlayMusic(): (patternId: string) => void {
	const context = useContext(AudioSynthContext);
	return context?.playMusic ?? (() => {});
}
