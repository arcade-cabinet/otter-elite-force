import { compileMissionScenario } from "@/entities/missions/compileMissionScenario";
import { getHero, getUnit } from "@/entities/registry";
import type { MissionDef } from "@/entities/types";
import { ScenarioEngine, type ScenarioWorldQuery } from "@/scenarios/engine";
import type { TriggerAction } from "@/scenarios/types";
import { recordDiagnosticEvent } from "../diagnostics/runtimeDiagnostics";
import { Faction, Flags, Health, Position } from "../world/components";
import type { GameWorld } from "../world/gameWorld";
import { spawnUnit } from "../world/gameWorld";

export interface RuntimeMissionFlow {
	step(): void;
	dispose(): void;
}

function updateObjectiveStatus(world: GameWorld, objectiveId: string, status: string): void {
	world.session.objectives = world.session.objectives.map((objective) =>
		objective.id === objectiveId ? { ...objective, status } : objective,
	);
}

function ensureObjective(world: GameWorld, id: string, description: string, bonus: boolean): void {
	if (world.session.objectives.some((objective) => objective.id === id)) return;
	world.session.objectives = [
		...world.session.objectives,
		{
			id,
			description,
			status: "active",
			bonus,
		},
	];
}

function pushRuntimeEvent(world: GameWorld, type: string, payload?: Record<string, unknown>): void {
	world.events.push({ type, payload });
	recordDiagnosticEvent(world.diagnostics, type, payload);
}

function createRuntimeWorldQuery(world: GameWorld, mission: MissionDef): ScenarioWorldQuery {
	return {
		elapsedTime: 0,
		countUnits: (faction, unitType) =>
			[...world.runtime.alive].filter((eid) => {
				const matchesFaction =
					(faction === "ura" && Faction.id[eid] === 1) ||
					(faction === "scale_guard" && Faction.id[eid] === 2) ||
					(faction === "neutral" && Faction.id[eid] === 0);
				if (!matchesFaction) return false;
				if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) return false;
				// "all" means count all units of this faction (no type filter)
				if (unitType && unitType !== "all" && world.runtime.entityTypeIndex.get(eid) !== unitType)
					return false;
				return true;
			}).length,
		countBuildings: (faction, buildingType) =>
			[...world.runtime.alive].filter((eid) => {
				if (Flags.isBuilding[eid] !== 1) return false;
				const matchesFaction =
					(faction === "ura" && Faction.id[eid] === 1) ||
					(faction === "scale_guard" && Faction.id[eid] === 2) ||
					(faction === "neutral" && Faction.id[eid] === 0);
				if (!matchesFaction) return false;
				if (buildingType && world.runtime.entityTypeIndex.get(eid) !== buildingType) return false;
				return true;
			}).length,
		countUnitsInArea: (faction, area, unitType) => {
			const minX = area.x * 32;
			const minY = area.y * 32;
			const maxX = (area.x + area.width) * 32;
			const maxY = (area.y + area.height) * 32;
			return [...world.runtime.alive].filter((eid) => {
				if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) return false;
				const matchesFaction =
					(faction === "ura" && Faction.id[eid] === 1) ||
					(faction === "scale_guard" && Faction.id[eid] === 2) ||
					(faction === "neutral" && Faction.id[eid] === 0);
				if (!matchesFaction) return false;
				if (unitType && world.runtime.entityTypeIndex.get(eid) !== unitType) return false;
				return (
					Position.x[eid] >= minX &&
					Position.x[eid] <= maxX &&
					Position.y[eid] >= minY &&
					Position.y[eid] <= maxY
				);
			}).length;
		},
		isBuildingDestroyed: (buildingTag) => {
			const taggedEid = world.runtime.scriptTagIndex.get(buildingTag);
			if (taggedEid != null) {
				return !world.runtime.alive.has(taggedEid);
			}
			return ![...world.runtime.alive].some(
				(eid) =>
					Flags.isBuilding[eid] === 1 && world.runtime.entityTypeIndex.get(eid) === buildingTag,
			);
		},
		getEntityHealthPercent: (entityTag) => {
			const taggedEid = world.runtime.scriptTagIndex.get(entityTag);
			if (taggedEid != null && world.runtime.alive.has(taggedEid)) {
				return Health.max[taggedEid] > 0
					? (Health.current[taggedEid] / Health.max[taggedEid]) * 100
					: 100;
			}
			const fallbackEid = [...world.runtime.alive].find(
				(eid) => world.runtime.entityTypeIndex.get(eid) === entityTag,
			);
			if (fallbackEid == null) return null;
			return Health.max[fallbackEid] > 0
				? (Health.current[fallbackEid] / Health.max[fallbackEid]) * 100
				: 100;
		},
		getResourceAmount: (resource) => world.session.resources[resource],
		countEnemiesInZone: (zoneId, operatorContext) => {
			const zone = mission.zones[zoneId];
			if (!zone) return 0;
			const playerFaction = operatorContext?.faction === "scale_guard" ? 2 : 1;
			const enemyFaction = playerFaction === 1 ? 2 : 1;
			const minX = zone.x * 32;
			const minY = zone.y * 32;
			const maxX = (zone.x + zone.width) * 32;
			const maxY = (zone.y + zone.height) * 32;
			return [...world.runtime.alive].filter((eid) => {
				if (Faction.id[eid] !== enemyFaction) return false;
				return (
					Position.x[eid] >= minX &&
					Position.x[eid] <= maxX &&
					Position.y[eid] >= minY &&
					Position.y[eid] <= maxY
				);
			}).length;
		},
		countBuildingsInZone: (faction, zoneId, buildingType) => {
			const zone = mission.zones[zoneId];
			if (!zone) return 0;
			const factionId = faction === "ura" ? 1 : faction === "scale_guard" ? 2 : 0;
			const minX = zone.x * 32;
			const minY = zone.y * 32;
			const maxX = (zone.x + zone.width) * 32;
			const maxY = (zone.y + zone.height) * 32;
			return [...world.runtime.alive].filter((eid) => {
				if (Flags.isBuilding[eid] !== 1 || Faction.id[eid] !== factionId) return false;
				if (buildingType && world.runtime.entityTypeIndex.get(eid) !== buildingType) return false;
				return (
					Position.x[eid] >= minX &&
					Position.x[eid] <= maxX &&
					Position.y[eid] >= minY &&
					Position.y[eid] <= maxY
				);
			}).length;
		},
		isEntityDestroyed: (entityTag, match) => {
			const taggedEid = world.runtime.scriptTagIndex.get(entityTag);
			if (taggedEid != null) return !world.runtime.alive.has(taggedEid);
			const matchMode = match ?? "first";
			const aliveMatches = [...world.runtime.alive].filter(
				(eid) => world.runtime.entityTypeIndex.get(eid) === entityTag,
			);
			const placedMatches = mission.placements.filter(
				(p) => p.type === entityTag || p.scriptId === entityTag,
			);
			if (matchMode === "all") {
				// All placed entities of this type must be dead
				return placedMatches.length > 0 && aliveMatches.length === 0;
			}
			if (matchMode === "any") {
				// At least one entity of this type was destroyed
				return placedMatches.length > aliveMatches.length;
			}
			// "first" — no living entity of this type exists
			return aliveMatches.length === 0;
		},
		getDestroyedEntityCount: (entityTag) => {
			const aliveMatches = [...world.runtime.alive].filter(
				(eid) => world.runtime.entityTypeIndex.get(eid) === entityTag,
			).length;
			const placedMatches = mission.placements.filter(
				(placement) => placement.type === entityTag || placement.scriptId === entityTag,
			).length;
			return Math.max(0, placedMatches - aliveMatches);
		},
		getWaveCounter: () => world.runtime.waveCounter,
		hasConvoyEnteredZone: (zoneId, convoyTag) => {
			const zone = mission.zones[zoneId];
			if (!zone) return false;
			const minX = zone.x * 32;
			const minY = zone.y * 32;
			const maxX = (zone.x + zone.width) * 32;
			const maxY = (zone.y + zone.height) * 32;
			const tag = convoyTag ?? "convoy";
			return [...world.runtime.alive].some((eid) => {
				const entityType = world.runtime.entityTypeIndex.get(eid);
				const scriptTag = world.runtime.scriptTagIndex.get(tag);
				const matchesTag =
					(scriptTag != null && scriptTag === eid) ||
					(entityType != null && entityType.includes(tag));
				if (!matchesTag) return false;
				return (
					Position.x[eid] >= minX &&
					Position.x[eid] <= maxX &&
					Position.y[eid] >= minY &&
					Position.y[eid] <= maxY
				);
			});
		},
	};
}

function createRuntimeActionHandler(world: GameWorld): (action: TriggerAction) => void {
	return (action) => {
		recordDiagnosticEvent(world.diagnostics, `action:${action.type}`);

		if (action.type === "showDialogue") {
			world.session.dialogue = {
				active: true,
				expiresAtMs:
					action.duration != null && action.duration > 0
						? world.time.elapsedMs + action.duration * 1000
						: null,
				lines: [{ speaker: action.speaker, text: action.text }],
			};
			return;
		}

		if (action.type === "showDialogueExchange") {
			world.session.dialogue = {
				active: true,
				expiresAtMs: null,
				lines: action.lines.map((line) => ({ speaker: line.speaker, text: line.text })),
			};
			return;
		}

		if (action.type === "changeWeather") {
			world.runtime.weather = action.weather;
			pushRuntimeEvent(world, "weather-changed", {
				weather: action.weather,
				transitionTime: action.transitionTime ?? 0,
			});
			return;
		}

		if (action.type === "grantResource") {
			world.session.resources = {
				...world.session.resources,
				[action.resource]: world.session.resources[action.resource] + action.amount,
			};
			return;
		}

		if (action.type === "spawnReinforcements") {
			for (const unit of action.units) {
				const unitDef = getUnit(unit.unitType) ?? getHero(unit.unitType);
				if (!unitDef) continue;
				for (let index = 0; index < unit.count; index += 1) {
					spawnUnit(world, {
						x: unit.position.x * 32 + 16 + index * 10,
						y: unit.position.y * 32 + 16,
						faction: action.faction,
						unitType: unit.unitType,
						health: { current: unitDef.hp, max: unitDef.hp },
						scriptId: `${unit.unitType}_reinforcement_${world.time.tick}_${index}`,
					});
				}
			}
			if (action.dialogue) {
				world.session.dialogue = {
					active: true,
					expiresAtMs: world.time.elapsedMs + 4_000,
					lines: [{ speaker: action.dialogue.speaker, text: action.dialogue.text }],
				};
			}
			pushRuntimeEvent(world, "reinforcements-arrived", {
				faction: action.faction,
				count: action.units.reduce((total, unit) => total + unit.count, 0),
			});
			return;
		}

		if (action.type === "addObjective") {
			ensureObjective(world, action.id, action.description, action.objectiveType === "bonus");
			return;
		}

		if (action.type === "completeObjective") {
			updateObjectiveStatus(world, action.objectiveId, "completed");
			return;
		}

		if (action.type === "startPhase") {
			world.runtime.scenarioPhase = action.phase;
			pushRuntimeEvent(world, "phase-started", { phase: action.phase });
			return;
		}

		if (action.type === "setWaveCounter") {
			world.runtime.waveCounter = action.value;
			return;
		}

		if (action.type === "incrementWaveCounter") {
			world.runtime.waveCounter += action.amount ?? 1;
			return;
		}

		if (action.type === "victory") {
			world.session.phase = "victory";
			return;
		}

		if (action.type === "failMission") {
			world.session.phase = "defeat";
			return;
		}

		if (action.type === "spawnUnits") {
			const unitDef = getUnit(action.unitType) ?? getHero(action.unitType);
			if (!unitDef) return;
			for (let index = 0; index < action.count; index += 1) {
				spawnUnit(world, {
					x: action.position.x * 32 + 16 + index * 10,
					y: action.position.y * 32 + 16,
					faction: action.faction,
					unitType: action.unitType,
					health: { current: unitDef.hp, max: unitDef.hp },
					scriptId: action.tag ? `${action.tag}_${index}` : undefined,
				});
			}
			pushRuntimeEvent(world, "units-spawned", {
				unitType: action.unitType,
				faction: action.faction,
				count: action.count,
			});
			return;
		}

		if (action.type === "spawnBossUnit") {
			const unitDef = getUnit(action.unitType) ?? getHero(action.unitType);
			const health = action.hp > 0 ? action.hp : (unitDef?.hp ?? 1);
			const bossEid = spawnUnit(world, {
				x: action.position.x * 32 + 16,
				y: action.position.y * 32 + 16,
				faction: action.faction,
				unitType: action.unitType,
				health: { current: health, max: health },
				scriptId: action.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
			});
			world.runtime.bossConfigs.set(bossEid, {
				name: action.name,
				armor: action.armor,
				damage: action.damage,
				range: action.range,
				attackCooldown: action.attackCooldown,
				speed: action.speed,
				visionRadius: action.visionRadius,
				phases: action.phases,
			});
			pushRuntimeEvent(world, "boss-spawned", {
				name: action.name,
				unitType: action.unitType,
			});
			return;
		}

		if (action.type === "revealZone") {
			world.runtime.revealedZones.add(action.zoneId);
			pushRuntimeEvent(world, "zone-revealed", { zoneId: action.zoneId });
			return;
		}

		if (action.type === "lockZone") {
			world.runtime.lockedZones.add(action.zoneId);
			pushRuntimeEvent(world, "zone-locked", { zoneId: action.zoneId });
			return;
		}

		if (action.type === "unlockZone") {
			world.runtime.lockedZones.delete(action.zoneId);
			pushRuntimeEvent(world, "zone-unlocked", { zoneId: action.zoneId });
			return;
		}

		if (action.type === "camera" || action.type === "panCamera") {
			pushRuntimeEvent(world, "camera-focus", {
				x: action.target.x,
				y: action.target.y,
				duration: action.duration,
			});
			return;
		}

		if (action.type === "playSFX") {
			pushRuntimeEvent(world, "play-sfx", { sfx: action.sfx });
			return;
		}

		if (action.type === "activateEntity") {
			const eid = world.runtime.scriptTagIndex.get(action.entityTag);
			if (eid != null) {
				Faction.id[eid] = Math.max(Faction.id[eid], 1);
			}
			pushRuntimeEvent(world, "entity-activated", {
				entityTag: action.entityTag,
				mode: action.mode ?? "default",
			});
			return;
		}

		if (action.type === "deactivateEntity") {
			const eid = world.runtime.scriptTagIndex.get(action.entityTag);
			if (eid != null) {
				Faction.id[eid] = 0;
			}
			pushRuntimeEvent(world, "entity-deactivated", { entityTag: action.entityTag });
			return;
		}
	};
}

export function createRuntimeMissionFlow(params: {
	world: GameWorld;
	mission: MissionDef;
}): RuntimeMissionFlow {
	const scenario = compileMissionScenario(params.mission);
	const engine = new ScenarioEngine(scenario, createRuntimeActionHandler(params.world));
	const worldQuery = createRuntimeWorldQuery(params.world, params.mission);
	const unsubscribe = engine.on((event) => {
		if (event.type === "objectiveCompleted") {
			updateObjectiveStatus(params.world, event.objectiveId, "completed");
			return;
		}
		if (event.type === "objectiveFailed") {
			updateObjectiveStatus(params.world, event.objectiveId, "failed");
			return;
		}
		if (event.type === "missionFailed") {
			params.world.session.phase = "defeat";
		}
	});

	return {
		step(): void {
			worldQuery.elapsedTime = params.world.time.elapsedMs / 1000;
			engine.evaluate(worldQuery);
		},
		dispose(): void {
			unsubscribe();
		},
	};
}
