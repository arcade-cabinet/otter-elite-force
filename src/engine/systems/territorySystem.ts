/**
 * Territory / Village Liberation System
 *
 * Handles the village lifecycle:
 * 1. Occupied villages have faction 'scale_guard' + a garrison set of enemy entity IDs
 * 2. When all garrison units are dead -> village flips to 'ura' (liberated)
 * 3. Liberated villages provide:
 *    - Trickle fish income: +1 fish per 10s per liberated village
 *    - Fog reveal: 5-tile radius marked as explored
 *    - Healing zone: +1 HP/s to friendly units within 3 tiles
 * 4. Enemy recapture: if enemy unit reaches liberated village
 *    with no friendly units within 5 tiles -> flips back to 'scale_guard'
 *
 * Also tracks zone control by faction count (original stub behavior).
 *
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { setFaction } from "@/engine/world/gameWorld";
import { revealArea } from "./fogSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fish income per liberated village per income tick. */
const VILLAGE_FISH_INCOME = 1;

/** Passive income interval in seconds. */
const VILLAGE_INCOME_INTERVAL = 10;

/** Healing per second for friendly units in healing zone. */
const VILLAGE_HEAL_RATE = 1;

/** Radius (tiles) within which friendly units are healed. */
const HEALING_RADIUS = 3;

/** Radius (tiles) for fog reveal around liberated village. */
export const FOG_REVEAL_RADIUS = 5;

/** Radius (tiles) for recapture defense check. */
const DEFENSE_RADIUS = 5;

// ---------------------------------------------------------------------------
// Types & Runtime augmentation
// ---------------------------------------------------------------------------

export interface VillageEntry {
	/** Entity ID of the village building. */
	eid: number;
	/** IDs of garrison entities assigned to protect this village. */
	garrisonEids: Set<number>;
	/** Whether this village has been liberated (flipped to ura). */
	liberated: boolean;
	/** Whether fog has been revealed around this village after liberation. */
	fogRevealed: boolean;
}

export interface TerritoryRuntime {
	/** Village entries for the territory system. */
	villages?: VillageEntry[];
	/** Accumulated income timer (seconds). */
	villageIncomeTimer?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Village registration
// ---------------------------------------------------------------------------

/**
 * Register a village building with its garrison.
 * Call during mission bootstrap when villages are placed.
 */
export function registerVillage(
	world: GameWorld,
	villageEid: number,
	garrisonEids: number[],
): void {
	const runtime = world.runtime as unknown as TerritoryRuntime;
	if (!runtime.villages) {
		runtime.villages = [];
	}

	runtime.villages.push({
		eid: villageEid,
		garrisonEids: new Set(garrisonEids),
		liberated: false,
		fogRevealed: false,
	});
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the territory system.
 * Processes village liberation/recapture, healing, income, fog, and zone control.
 */
export function runTerritorySystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	processVillages(world, deltaSec);
	processZoneControl(world);
}

// ---------------------------------------------------------------------------
// Village processing
// ---------------------------------------------------------------------------

function processVillages(world: GameWorld, deltaSec: number): void {
	const runtime = world.runtime as unknown as TerritoryRuntime & GameWorld["runtime"];
	const villages = runtime.villages;
	if (!villages || villages.length === 0) return;

	let liberatedCount = 0;

	for (const village of villages) {
		// Skip destroyed villages
		if (!world.runtime.alive.has(village.eid)) continue;

		if (!village.liberated) {
			// Check if garrison is cleared
			if (isGarrisonCleared(world, village)) {
				liberateVillage(world, village);
			}
		} else {
			liberatedCount++;

			// Check recapture
			if (isVillageUndefended(world, village)) {
				recaptureVillage(world, village);
				continue;
			}

			// Healing zone
			applyVillageHealing(world, village, deltaSec);

			// Fog reveal (one-time on liberation)
			if (!village.fogRevealed) {
				revealVillageFog(world, village);
				village.fogRevealed = true;
			}
		}
	}

	// Passive income
	applyVillageIncome(world, runtime, liberatedCount, deltaSec);
}

/**
 * Check if a village's garrison has been fully eliminated.
 */
function isGarrisonCleared(world: GameWorld, village: VillageEntry): boolean {
	if (village.garrisonEids.size === 0) return true;

	for (const eid of village.garrisonEids) {
		if (world.runtime.alive.has(eid)) {
			return false;
		}
	}
	return true;
}

/**
 * Liberate a village: flip faction to 'ura'.
 */
function liberateVillage(world: GameWorld, village: VillageEntry): void {
	village.liberated = true;
	setFaction(world, village.eid, "ura");

	world.events.push({
		type: "village-liberated",
		payload: {
			eid: village.eid,
			x: Position.x[village.eid],
			y: Position.y[village.eid],
		},
	});
}

/**
 * Check if a liberated village is undefended and an enemy is nearby.
 */
function isVillageUndefended(world: GameWorld, village: VillageEntry): boolean {
	const vx = Position.x[village.eid];
	const vy = Position.y[village.eid];

	let hasFriendlyNearby = false;
	let hasEnemyNearby = false;

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Health.current[eid] <= 0) continue;

		const dist = tileDistance(Position.x[eid], Position.y[eid], vx, vy);
		if (dist > DEFENSE_RADIUS) continue;

		const factionId = Faction.id[eid];
		if (factionId === FACTION_IDS.ura) {
			hasFriendlyNearby = true;
		} else if (factionId === FACTION_IDS.scale_guard) {
			hasEnemyNearby = true;
		}
	}

	return hasEnemyNearby && !hasFriendlyNearby;
}

/**
 * Recapture a village: flip faction back to 'scale_guard'.
 */
function recaptureVillage(world: GameWorld, village: VillageEntry): void {
	village.liberated = false;
	village.fogRevealed = false;
	setFaction(world, village.eid, "scale_guard");

	world.events.push({
		type: "village-recaptured",
		payload: {
			eid: village.eid,
			x: Position.x[village.eid],
			y: Position.y[village.eid],
		},
	});
}

/**
 * Apply healing zone: heal friendly units within HEALING_RADIUS tiles of liberated village.
 */
function applyVillageHealing(world: GameWorld, village: VillageEntry, deltaSec: number): void {
	const healAmount = VILLAGE_HEAL_RATE * deltaSec;
	const vx = Position.x[village.eid];
	const vy = Position.y[village.eid];

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;

		const dist = tileDistance(Position.x[eid], Position.y[eid], vx, vy);
		if (dist > HEALING_RADIUS) continue;

		const current = Health.current[eid];
		const max = Health.max[eid];
		if (current < max && current > 0) {
			Health.current[eid] = Math.min(current + healAmount, max);
		}
	}
}

/**
 * Reveal fog around a liberated village.
 */
function revealVillageFog(world: GameWorld, village: VillageEntry): void {
	const vx = Math.floor(Position.x[village.eid]);
	const vy = Math.floor(Position.y[village.eid]);
	const r = FOG_REVEAL_RADIUS;

	revealArea(world, vx - r, vy - r, r * 2 + 1, r * 2 + 1);
}

/**
 * Apply passive fish income from liberated villages.
 */
function applyVillageIncome(
	world: GameWorld,
	runtime: TerritoryRuntime,
	liberatedCount: number,
	deltaSec: number,
): void {
	if (liberatedCount === 0) return;

	runtime.villageIncomeTimer = (runtime.villageIncomeTimer ?? 0) + deltaSec;

	if (runtime.villageIncomeTimer >= VILLAGE_INCOME_INTERVAL) {
		runtime.villageIncomeTimer -= VILLAGE_INCOME_INTERVAL;

		const income = VILLAGE_FISH_INCOME * liberatedCount;
		world.session.resources.fish += income;

		world.events.push({
			type: "passive-income",
			payload: { resource: "fish", amount: income, source: "village" },
		});
	}
}

// ---------------------------------------------------------------------------
// Zone control (original stub behavior)
// ---------------------------------------------------------------------------

function processZoneControl(world: GameWorld): void {
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		let uraCount = 0;
		let scaleCount = 0;

		for (const eid of world.runtime.alive) {
			const x = Position.x[eid];
			const y = Position.y[eid];
			if (x < rect.x || x >= rect.x + rect.width || y < rect.y || y >= rect.y + rect.height) {
				continue;
			}
			if (Faction.id[eid] === FACTION_IDS.ura) uraCount++;
			else if (Faction.id[eid] === FACTION_IDS.scale_guard) scaleCount++;
		}

		const controller =
			uraCount > scaleCount ? "ura" : scaleCount > uraCount ? "scale_guard" : "contested";
		world.events.push({
			type: "zone-control",
			payload: { zoneId, controller, uraCount, scaleCount },
		});
	}
}

// ---------------------------------------------------------------------------
// Reset (for tests and new missions)
// ---------------------------------------------------------------------------

/** Reset territory state on the runtime. */
export function resetTerritoryState(world: GameWorld): void {
	const runtime = world.runtime as unknown as TerritoryRuntime;
	runtime.villages = undefined;
	runtime.villageIncomeTimer = undefined;
}
