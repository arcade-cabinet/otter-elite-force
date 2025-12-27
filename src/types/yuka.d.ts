// Type definitions for yuka library
declare module "yuka" {
	export class Vector3 {
		x: number;
		y: number;
		z: number;
		constructor(x?: number, y?: number, z?: number);
		set(x: number, y: number, z: number): this;
		copy(v: Vector3): this;
		add(v: Vector3): this;
		sub(v: Vector3): this;
		multiplyScalar(s: number): this;
		clone(): Vector3;
		length(): number;
		distanceTo(v: Vector3): number;
		normalize(): this;
	}

	export class Quaternion {
		x: number;
		y: number;
		z: number;
		w: number;
		constructor(x?: number, y?: number, z?: number, w?: number);
		set(x: number, y: number, z: number, w: number): this;
		copy(q: Quaternion): this;
	}

	export class Vehicle {
		position: Vector3;
		velocity: Vector3;
		rotation: Quaternion;
		maxSpeed: number;
		steering: SteeringManager;
		constructor();
		update(delta: number): this;
	}

	export class SteeringManager {
		add(behavior: SteeringBehavior): this;
		clear(): this;
	}

	export class SteeringBehavior {}

	export class SeekBehavior extends SteeringBehavior {
		target: Vector3;
		constructor(target?: Vector3);
	}

	export class FleeBehavior extends SteeringBehavior {
		target: Vector3;
		panicDistance: number;
		constructor(target?: Vector3, panicDistance?: number);
	}

	export class ArriveBehavior extends SteeringBehavior {
		target: Vector3;
		deceleration: number;
		tolerance: number;
		constructor(target?: Vector3, deceleration?: number, tolerance?: number);
	}

	export class WanderBehavior extends SteeringBehavior {
		radius: number;
		distance: number;
		jitter: number;
		constructor(radius?: number, distance?: number, jitter?: number);
	}

	export class ObstacleAvoidanceBehavior extends SteeringBehavior {
		constructor();
	}

	export class StateMachine<T> {
		owner: T;
		currentState: State<T>;
		previousState: State<T>;
		globalState: State<T>;
		constructor(owner: T);
		update(): this;
		changeTo(state: State<T>): this;
		revert(): this;
		inState(state: State<T>): boolean;
	}

	export class State<T> {
		enter(entity: T): void;
		execute(entity: T): void;
		exit(entity: T): void;
	}

	export class Path {
		loop: boolean;
		constructor();
		add(waypoint: Vector3): this;
		clear(): this;
	}

	export class NavMesh {
		constructor();
		fromJSON(json: object): this;
		findPath(start: Vector3, end: Vector3): Vector3[];
	}

	export class EntityManager {
		entities: Vehicle[];
		add(entity: Vehicle): this;
		remove(entity: Vehicle): this;
		clear(): this;
		update(delta: number): this;
	}
}
