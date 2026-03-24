import type { BuildingDef } from "../../types";

/**
 * Barracks — URA infantry training facility.
 * Flat stone battlements roof. Trains Mudfoots and Shellcrackers.
 */
export const barracks: BuildingDef = {
	id: "barracks",
	name: "Barracks",
	faction: "ura",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"............########............",
					"..........##cccccccc##..........",
					".........#cCCCCCCCCCCc#.........",
					"........#cCCCCCCCCCCCCc#........",
					".......#cCCCCCCCCCCCCCCc#.......",
					"......####################......",
					"......#cccccccccccccccccc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCbbbbbbbbbbbbbbCc#......",
					"......#cCbbbbbbbbbbbbbbCc#......",
					"......#cCbbbbbbbbbbbbbbCc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cccccccccccccccccc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCCCCCCCCCCCCCCCCc#......",
					"......#cCCCCCCC####CCCCCc#......",
					"......#cCCCCCCC#MM#CCCCCc#......",
					"......#cCCCCCCC#MM#CCCCCc#......",
					"......#cCCCCCCC#MM#CCCCCc#......",
					"......#cCCCCCCC#MM#CCCCCc#......",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcccccccccccccccccccCc....",
					"......CcccccccccccccccccccCc....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......##########################",
					"......##########################",
					"......##########################",
					"................................",
				],
			],
		},
	},

	hp: 350,
	armor: 0,
	buildTime: 30,

	cost: { timber: 200 },
	unlockedAt: "mission_1",

	trains: ["mudfoot", "shellcracker"],

	tags: ["building", "production", "ura"],
};
