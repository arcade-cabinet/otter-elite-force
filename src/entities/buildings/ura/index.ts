export { commandPost } from "./command-post";
export { barracks } from "./barracks";
export { armory } from "./armory";
export { watchtower } from "./watchtower";
export { fishTrap } from "./fish-trap";
export { burrow } from "./burrow";
export { dock } from "./dock";
export { fieldHospital } from "./field-hospital";
export { sandbagWall } from "./sandbag-wall";
export { stoneWall } from "./stone-wall";
export { gunTower } from "./gun-tower";
export { minefield } from "./minefield";

import { commandPost } from "./command-post";
import { barracks } from "./barracks";
import { armory } from "./armory";
import { watchtower } from "./watchtower";
import { fishTrap } from "./fish-trap";
import { burrow } from "./burrow";
import { dock } from "./dock";
import { fieldHospital } from "./field-hospital";
import { sandbagWall } from "./sandbag-wall";
import { stoneWall } from "./stone-wall";
import { gunTower } from "./gun-tower";
import { minefield } from "./minefield";

import type { BuildingDef } from "../../types";

/** All 12 URA building definitions keyed by id. */
export const URA_BUILDING_ENTITIES: Record<string, BuildingDef> = {
	command_post: commandPost,
	barracks,
	armory,
	watchtower,
	fish_trap: fishTrap,
	burrow,
	dock,
	field_hospital: fieldHospital,
	sandbag_wall: sandbagWall,
	stone_wall: stoneWall,
	gun_tower: gunTower,
	minefield,
};
