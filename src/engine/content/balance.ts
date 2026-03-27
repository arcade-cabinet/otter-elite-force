/**
 * Resource Balance — gathering rates, starting resources, population caps,
 * and combat rules that define the economic game.
 *
 * These numbers are a first pass. They should create meaningful economic
 * tension relative to unit costs and gathering rates.
 *
 * At current rates:
 *   - 1 River Rat produces ~12 fish/min (8 fish per 4s trip, minus travel)
 *   - 1 River Rat produces ~9 timber/min (6 timber per 4s trip)
 *   - A Mudfoot costs 80 fish + 20 salvage and trains in 20s
 *   - A Barracks costs 150 fish + 200 timber (~3-4 min of 2-worker gathering)
 *   - Fish Trap passive: 3 fish / 10s = 18 fish/min (good supplement)
 */

export const BALANCE = {
	gathering: {
		/** Fish yielded per completed gathering trip. */
		fishPerTrip: 8,
		/** Timber yielded per completed gathering trip. */
		timberPerTrip: 6,
		/** Salvage yielded per completed gathering trip. */
		salvagePerTrip: 4,
		/** Time in ms for a worker to fill one load at a resource node. */
		tripDurationMs: 4000,
		/** Speed multiplier when carrying resources back to lodge. */
		returnSpeedMultiplier: 0.8,
		/** Maximum distance (px) a worker will auto-search for resources. */
		autoSearchRadius: 320,
	},
	startingResources: {
		/** Default starting resources for story missions (overridden per mission). */
		mission1: { fish: 100, timber: 50, salvage: 0 },
		/** Starting resources for skirmish mode. */
		skirmish: { fish: 200, timber: 100, salvage: 50 },
		/** Starting resources for commando missions (no base). */
		commando: { fish: 0, timber: 0, salvage: 0 },
	},
	population: {
		/** Population capacity provided by a Lodge (burrow). */
		lodgeCap: 10,
		/** Population capacity provided by a Command Post. */
		commandPostCap: 20,
		/** Absolute maximum population cap. */
		maxCap: 50,
	},
	combat: {
		/** Units auto-retreat to lodge when HP falls below this percent. */
		retreatHealthPercent: 25,
		/** If all HQ buildings (lodge/command_post) are destroyed, the mission fails. */
		lodgeDestroyedDefeat: true,
		/** Damage reduction formula: finalDamage = max(1, damage - armor). */
		armorReduction: "flat" as const,
		/** Minimum damage any attack can deal (even vs heavy armor). */
		minimumDamage: 1,
	},
	economy: {
		/** Fish Trap passive income: amount per interval. */
		fishTrapIncome: 3,
		/** Fish Trap passive income: interval in ms. */
		fishTrapIntervalMs: 10000,
	},
	difficulty: {
		support: {
			enemyDamageMultiplier: 0.75,
			enemyHpMultiplier: 0.8,
			resourceMultiplier: 1.25,
			xpMultiplier: 0.75,
		},
		tactical: {
			enemyDamageMultiplier: 1.0,
			enemyHpMultiplier: 1.0,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.0,
		},
		elite: {
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.25,
			resourceMultiplier: 0.8,
			xpMultiplier: 1.5,
		},
	},
} as const;

export type DifficultyLevel = keyof typeof BALANCE.difficulty;
