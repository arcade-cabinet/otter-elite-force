import { trait } from "koota";

/** Waypoint-based pathing for scripted convoy/escort entities */
export const ConvoyWaypoints = trait(() => ({
	waypoints: [] as Array<{ x: number; y: number }>,
	currentWaypoint: 0,
	speed: 3, // tiles per second
	stopped: false,
	detectionRadius: 5, // tiles — stops when enemies within this
}));

/** Vehicle type and cargo metadata for convoy entities */
export const ConvoyVehicle = trait(() => ({
	vehicleType: "truck" as "truck" | "barge" | "cart",
	cargoType: "" as string,
}));
