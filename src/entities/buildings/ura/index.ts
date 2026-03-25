export { armory } from "./armory";
export { barracks } from "./barracks";
export { burrow } from "./burrow";
export { commandPost } from "./command-post";
export { dock } from "./dock";
export { fieldHospital } from "./field-hospital";
export { fishTrap } from "./fish-trap";
export { gunTower } from "./gun-tower";
export { minefield } from "./minefield";
export { sandbagWall } from "./sandbag-wall";
export { stoneWall } from "./stone-wall";
export { watchtower } from "./watchtower";

import type { BuildingDef } from "../../types";
import { armory } from "./armory";
import { barracks } from "./barracks";
import { burrow } from "./burrow";
import { commandPost } from "./command-post";
import { dock } from "./dock";
import { fieldHospital } from "./field-hospital";
import { fishTrap } from "./fish-trap";
import { gunTower } from "./gun-tower";
import { minefield } from "./minefield";
import { sandbagWall } from "./sandbag-wall";
import { stoneWall } from "./stone-wall";
import { watchtower } from "./watchtower";

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
