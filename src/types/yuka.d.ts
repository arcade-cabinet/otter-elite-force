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
		clone(): Vector3;
		length(): number;
		distanceTo(v: Vector3): number;
		normalize(): this;
	}

	export class Vehicle {
		position: Vector3;
		velocity: Vector3;
		rotation: any;
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

	export class WanderBehavior extends SteeringBehavior {
		radius: number;
		distance: number;
		jitter: number;
		constructor(radius?: number, distance?: number, jitter?: number);
	}

	export class EntityManager {
		entities: Vehicle[];
		add(entity: Vehicle): this;
		remove(entity: Vehicle): this;
		clear(): this;
		update(delta: number): this;
	}
}
