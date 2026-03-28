/**
 * Game Object Barrel Exports
 *
 * LittleJS EngineObject subclasses for all entity types.
 * Each class is created via a factory that receives the runtime-loaded LittleJS API.
 */

export {
	createFloatingTextClass,
	type FloatingTextColor,
	type FloatingTextObj,
	type FloatingTextOptions,
	initFloatingTextLjs,
} from "./FloatingText";
export {
	createGameBuildingClass,
	type GameBuilding,
	type GameBuildingOptions,
	initGameBuildingLjs,
} from "./GameBuilding";
export {
	createGameProjectileClass,
	type GameProjectile,
	type GameProjectileOptions,
	initGameProjectileLjs,
} from "./GameProjectile";
export {
	createGameResourceClass,
	type GameResource,
	type GameResourceOptions,
	initGameResourceLjs,
} from "./GameResource";
export {
	createGameUnitClass,
	type GameUnit,
	type GameUnitOptions,
	initGameUnitLjs,
	type LjsApi,
} from "./GameUnit";
