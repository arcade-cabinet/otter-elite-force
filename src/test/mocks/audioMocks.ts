import { vi } from "vitest";

/**
 * Setup Tone.js global mocks
 */
export function setupAudioMocks() {
	vi.mock("tone", () => {
		const mockParam = {
			value: 0,
			rampTo: vi.fn(),
			setValueAtTime: vi.fn(),
			linearRampToValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		};

		const synthMock = {
			toDestination: vi.fn().mockReturnThis(),
			connect: vi.fn().mockReturnThis(),
			disconnect: vi.fn(),
			triggerAttack: vi.fn(),
			triggerRelease: vi.fn(),
			triggerAttackRelease: vi.fn(),
			dispose: vi.fn(),
			volume: mockParam,
			frequency: mockParam,
		};

		function MockSynth() {
			return { ...synthMock };
		}
		function MockPolySynth() {
			return { ...synthMock };
		}
		function MockFMSynth() {
			return { ...synthMock };
		}
		function MockAMSynth() {
			return { ...synthMock };
		}
		function MockNoiseSynth() {
			return { ...synthMock };
		}
		function MockMembraneSynth() {
			return { ...synthMock };
		}
		function MockMetalSynth() {
			return { ...synthMock };
		}
		function MockPluckSynth() {
			return { ...synthMock };
		}

		const effectMock = {
			toDestination: vi.fn().mockReturnThis(),
			connect: vi.fn().mockReturnThis(),
			disconnect: vi.fn(),
			dispose: vi.fn(),
			wet: mockParam,
		};

		function MockFilter() {
			return { ...effectMock, frequency: mockParam, Q: mockParam };
		}
		function MockReverb() {
			return { ...effectMock, decay: 1.5 };
		}
		function MockDelay() {
			return { ...effectMock, delayTime: mockParam, feedback: mockParam };
		}
		function MockDistortion() {
			return { ...effectMock, distortion: 0.5 };
		}
		function MockGain() {
			return { ...effectMock, gain: mockParam };
		}

		return {
			start: vi.fn().mockResolvedValue(undefined),
			now: vi.fn().mockReturnValue(0),
			gainToDb: vi.fn((gain: number) => 20 * Math.log10(gain)),
			dbToGain: vi.fn((db: number) => 10 ** (db / 20)),
			getDestination: vi.fn().mockReturnValue({ volume: mockParam }),
			getTransport: vi.fn().mockReturnValue({
				start: vi.fn(),
				stop: vi.fn(),
				pause: vi.fn(),
				bpm: mockParam,
				position: 0,
				seconds: 0,
				schedule: vi.fn(),
				scheduleRepeat: vi.fn(),
				cancel: vi.fn(),
			}),
			getContext: vi.fn().mockReturnValue({
				state: "running",
				sampleRate: 44100,
				currentTime: 0,
				resume: vi.fn().mockResolvedValue(undefined),
			}),
			Synth: MockSynth,
			PolySynth: MockPolySynth,
			FMSynth: MockFMSynth,
			AMSynth: MockAMSynth,
			NoiseSynth: MockNoiseSynth,
			MembraneSynth: MockMembraneSynth,
			MetalSynth: MockMetalSynth,
			PluckSynth: MockPluckSynth,
			Filter: MockFilter,
			Reverb: MockReverb,
			Delay: MockDelay,
			Distortion: MockDistortion,
			Gain: MockGain,
			Noise: class {
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				connect = vi.fn().mockReturnThis();
				toDestination = vi.fn().mockReturnThis();
				dispose = vi.fn();
				type = "white";
			},
			Oscillator: class {
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				connect = vi.fn().mockReturnThis();
				toDestination = vi.fn().mockReturnThis();
				dispose = vi.fn();
				frequency = mockParam;
				type = "sine";
			},
			Player: class {
				load = vi.fn().mockResolvedValue(undefined);
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				connect = vi.fn().mockReturnThis();
				toDestination = vi.fn().mockReturnThis();
				dispose = vi.fn();
				loaded = true;
			},
			Loop: class {
				callback: (time: number) => void;
				constructor(callback: (time: number) => void) {
					this.callback = callback;
				}
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				dispose = vi.fn().mockReturnThis();
			},
			Sequence: class {
				events: unknown[];
				callback: (time: number, note: unknown) => void;
				constructor(callback: (time: number, note: unknown) => void, events: unknown[]) {
					this.callback = callback;
					this.events = events;
				}
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				dispose = vi.fn().mockReturnThis();
			},
			Pattern: class {
				start = vi.fn().mockReturnThis();
				stop = vi.fn().mockReturnThis();
				dispose = vi.fn().mockReturnThis();
			},
			context: {
				state: "running",
				sampleRate: 44100,
				resume: vi.fn().mockResolvedValue(undefined),
			},
			Destination: { volume: mockParam },
			Transport: {
				start: vi.fn(),
				stop: vi.fn(),
				bpm: mockParam,
			},
		};
	});
}
