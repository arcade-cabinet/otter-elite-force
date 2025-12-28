/**
   726| * Seeded Random utility for settlement generation
   727| */
   728|
   729|export class SettlementRandom {
   730|	private seed: number;
   731|
   732|	constructor(seed: number) {
   733|		this.seed = seed;
   734|	}
   735|
   736|	next(): number {
   737|		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
   738|		return this.seed / 0x7fffffff;
   739|	}
   740|
   741|	range(min: number, max: number): number {
   742|		return min + this.next() * (max - min);
   743|	}
   744|
   745|	int(min: number, max: number): number {
   746|		return Math.floor(this.range(min, max + 1));
   747|	}
   748|
   749|	pick<T>(array: T[]): T {
   750|		return array[this.int(0, array.length - 1)];
   751|	}
   752|
   753|	chance(probability: number): boolean {
   754|		return this.next() < probability;
   755|	}
   756|
   757|	shuffle<T>(array: T[]): T[] {
   758|		const result = [...array];
   759|		for (let i = result.length - 1; i > 0; i--) {
   760|			const j = this.int(0, i);
   761|			[result[i], result[j]] = [result[j], result[i]];
   762|		}
   763|		return result;
   764|	}
   765|}
   766|