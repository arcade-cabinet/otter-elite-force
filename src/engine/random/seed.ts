const ADJECTIVES = [
	"amber",
	"brisk",
	"cinder",
	"deep",
	"ember",
	"frozen",
	"golden",
	"hollow",
	"iron",
	"jagged",
	"lively",
	"mossy",
	"narrow",
	"opal",
	"quiet",
	"rapid",
	"silent",
	"tidal",
	"verdant",
	"wild",
] as const;

const NOUNS = [
	"badger",
	"beacon",
	"delta",
	"drum",
	"falcon",
	"harbor",
	"heron",
	"lodge",
	"marsh",
	"otter",
	"outpost",
	"rapids",
	"reed",
	"signal",
	"spire",
	"watch",
] as const;

export interface SeedBundle {
	phrase: string;
	source: "mission" | "skirmish" | "manual";
	numericSeed: number;
	designSeed: number;
	gameplaySeeds: Record<string, number>;
}

export interface Rng {
	next(): number;
	nextInt(maxExclusive: number): number;
	pick<T>(values: readonly T[]): T;
}

function xmur3(input: string): () => number {
	let h = 1779033703 ^ input.length;
	for (let i = 0; i < input.length; i++) {
		h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return () => {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		return (h ^= h >>> 16) >>> 0;
	};
}

function mulberry32(seed: number): () => number {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), t | 1);
		r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export function normalizeSeedPhrase(phrase: string): string {
	return phrase
		.trim()
		.toLowerCase()
		.replace(/[^a-z-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function seedPhraseToNumber(phrase: string): number {
	const normalized = normalizeSeedPhrase(phrase);
	return xmur3(normalized)();
}

export function createRng(seed: number): Rng {
	const random = mulberry32(seed);
	return {
		next(): number {
			return random();
		},
		nextInt(maxExclusive: number): number {
			if (maxExclusive <= 0) return 0;
			return Math.floor(random() * maxExclusive);
		},
		pick<T>(values: readonly T[]): T {
			if (values.length === 0) {
				throw new Error("Cannot pick from an empty collection");
			}
			return values[Math.floor(random() * values.length)];
		},
	};
}

export function deriveGameplaySeed(baseSeed: number, namespace: string): number {
	return seedPhraseToNumber(`${baseSeed}:${namespace}`);
}

export function createSeedBundle(options: {
	phrase: string;
	source: SeedBundle["source"];
	gameplayNamespaces?: string[];
}): SeedBundle {
	const numericSeed = seedPhraseToNumber(options.phrase);
	const designSeed = deriveGameplaySeed(numericSeed, "design");
	const gameplaySeeds = Object.fromEntries(
		(options.gameplayNamespaces ?? ["loot", "encounter", "waves", "ai"]).map((namespace) => [
			namespace,
			deriveGameplaySeed(numericSeed, namespace),
		]),
	);

	return {
		phrase: normalizeSeedPhrase(options.phrase),
		source: options.source,
		numericSeed,
		designSeed,
		gameplaySeeds,
	};
}

function pickWord(seed: number, words: readonly string[]): string {
	return words[seed % words.length] ?? words[0];
}

export function deriveMissionSeedPhrase(missionId: string): string {
	const hash = xmur3(`mission:${missionId}`);
	return [
		pickWord(hash(), ADJECTIVES),
		pickWord(hash(), ADJECTIVES),
		pickWord(hash(), NOUNS),
	].join("-");
}

export function createMissionSeedBundle(missionId: string): SeedBundle {
	return createSeedBundle({
		phrase: deriveMissionSeedPhrase(missionId),
		source: "mission",
	});
}

export function createSkirmishSeedPhrase(entropy = Date.now()): string {
	return [
		pickWord(entropy, ADJECTIVES),
		pickWord(entropy >>> 2, ADJECTIVES),
		pickWord(entropy >>> 5, NOUNS),
	].join("-");
}

export function shuffleSkirmishSeedBundle(entropy = Date.now()): SeedBundle {
	return createSeedBundle({
		phrase: createSkirmishSeedPhrase(entropy),
		source: "skirmish",
	});
}
