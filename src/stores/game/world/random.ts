/**
 * Seeded Random utility for world layout
 */
export class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	next(): number {
		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
		return this.seed / 0x7fffffff;
	}

	range(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	int(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	pick<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}

	shuffle<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.int(0, i);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}
}
