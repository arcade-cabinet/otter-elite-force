/**
 * Assembly utilities and seeded random
 */

export class AssemblyRandom {
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

	chance(probability: number): boolean {
		return this.next() < probability;
	}
}
