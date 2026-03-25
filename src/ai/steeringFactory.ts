/**
 * Factory for creating Yuka steering vehicles with standard behavior sets.
 *
 * Each vehicle gets:
 * - FollowPathBehavior for A* waypoint following
 * - SeparationBehavior for unit-to-unit collision avoidance
 * - ObstacleAvoidanceBehavior for building avoidance
 *
 * Spec reference: §8.3 Pathfinding, §10 Yuka AI Integration
 */

import {
	FollowPathBehavior,
	type GameEntity,
	ObstacleAvoidanceBehavior,
	Path,
	SeparationBehavior,
	type Vector3,
	Vehicle,
} from "yuka";

export interface SteeringConfig {
	maxSpeed?: number;
	maxForce?: number;
	mass?: number;
	/** Distance at which vehicle seeks next waypoint (default: 0.5) */
	nextWaypointDistance?: number;
	/** Weight for path following behavior (default: 1) */
	followPathWeight?: number;
	/** Weight for separation behavior (default: 0.5) */
	separationWeight?: number;
	/** Weight for obstacle avoidance (default: 1) */
	obstacleAvoidanceWeight?: number;
	/** Static obstacles (buildings) for avoidance */
	obstacles?: GameEntity[];
}

export interface SteeringVehicle {
	vehicle: Vehicle;
	followPath: FollowPathBehavior;
	separation: SeparationBehavior;
	obstacleAvoidance: ObstacleAvoidanceBehavior;
}

/**
 * Create a Yuka Vehicle with standard RTS steering behaviors.
 */
export function createSteeringVehicle(config: SteeringConfig = {}): SteeringVehicle {
	const {
		maxSpeed = 2,
		maxForce = 10,
		mass = 1,
		nextWaypointDistance = 0.5,
		followPathWeight = 1,
		separationWeight = 0.5,
		obstacleAvoidanceWeight = 1,
		obstacles = [],
	} = config;

	const vehicle = new Vehicle();
	vehicle.maxSpeed = maxSpeed;
	vehicle.maxForce = maxForce;
	vehicle.mass = mass;
	vehicle.boundingRadius = 0.4;

	const followPath = new FollowPathBehavior(new Path(), nextWaypointDistance);
	followPath.weight = followPathWeight;
	vehicle.steering.add(followPath);

	const separation = new SeparationBehavior();
	separation.weight = separationWeight;
	vehicle.steering.add(separation);

	const obstacleAvoidance = new ObstacleAvoidanceBehavior(obstacles);
	obstacleAvoidance.weight = obstacleAvoidanceWeight;
	vehicle.steering.add(obstacleAvoidance);

	return { vehicle, followPath, separation, obstacleAvoidance };
}

/**
 * Set a new path on a steering vehicle from A* waypoints.
 */
export function setVehiclePath(steeringVehicle: SteeringVehicle, waypoints: Vector3[]): void {
	const path = steeringVehicle.followPath.path;
	path.clear();
	for (const wp of waypoints) {
		path.add(wp);
	}
}

/**
 * Check if a vehicle has finished following its current path.
 */
export function isPathComplete(steeringVehicle: SteeringVehicle): boolean {
	const path = steeringVehicle.followPath.path;
	return path.finished();
}
