export const FACTION_IDS = {
	neutral: 0,
	ura: 1,
	scale_guard: 2,
} as const;

export type FactionName = keyof typeof FACTION_IDS;
export type FactionId = (typeof FACTION_IDS)[FactionName];

export const CATEGORY_IDS = {
	unknown: 0,
	worker: 1,
	infantry: 2,
	ranged: 3,
	siege: 4,
	transport: 5,
	scout: 6,
	support: 7,
	production: 8,
	defense: 9,
	economy: 10,
	wall: 11,
	special: 12,
	resource: 13,
	projectile: 14,
} as const;

export type CategoryName = keyof typeof CATEGORY_IDS;
export type CategoryId = (typeof CATEGORY_IDS)[CategoryName];

export function resolveFactionId(name: string | undefined): FactionId {
	if (!name) return FACTION_IDS.neutral;
	return FACTION_IDS[name as FactionName] ?? FACTION_IDS.neutral;
}

export function resolveCategoryId(name: string | undefined): CategoryId {
	if (!name) return CATEGORY_IDS.unknown;
	return CATEGORY_IDS[name as CategoryName] ?? CATEGORY_IDS.unknown;
}
