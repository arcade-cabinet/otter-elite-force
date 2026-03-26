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
		subVectors(a: Vector3, b: Vector3): this;
		multiplyScalar(s: number): this;
		divideScalar(s: number): this;
		clone(): Vector3;
		length(): number;
		squaredDistanceTo(v: Vector3): number;
		distanceTo(v: Vector3): number;
		manhattanDistanceTo(v: Vector3): number;
		normalize(): this;
		fromArray(array: number[]): this;
		toArray(array: number[]): number[];
	}

	export class Quaternion {
		x: number;
		y: number;
		z: number;
		w: number;
		constructor(x?: number, y?: number, z?: number, w?: number);
		set(x: number, y: number, z: number, w: number): this;
		copy(q: Quaternion): this;
		clone(): Quaternion;
	}

	// Graph core
	export class Node {
		index: number;
		constructor(index?: number);
		toJSON(): object;
		fromJSON(json: object): this;
	}

	export class NavNode extends Node {
		position: Vector3;
		userData: Record<string, unknown>;
		constructor(index?: number, position?: Vector3, userData?: Record<string, unknown>);
	}

	export class Edge {
		from: number;
		to: number;
		cost: number;
		constructor(from?: number, to?: number, cost?: number);
		copy(edge: Edge): this;
		clone(): Edge;
		toJSON(): object;
		fromJSON(json: object): this;
	}

	export class NavEdge extends Edge {
		constructor(from?: number, to?: number, cost?: number);
	}

	export class Graph {
		digraph: boolean;
		addNode(node: Node): this;
		addEdge(edge: Edge): this;
		getNode(index: number): Node | null;
		getEdge(from: number, to: number): Edge | null;
		getNodes(result: Node[]): Node[];
		getEdgesOfNode(index: number, result: Edge[]): Edge[];
		getNodeCount(): number;
		getEdgeCount(): number;
		removeNode(node: Node): this;
		removeEdge(edge: Edge): this;
		hasNode(index: number): boolean;
		hasEdge(from: number, to: number): boolean;
		clear(): this;
		toJSON(): object;
		fromJSON(json: object): this;
	}

	// Graph search
	export class AStar {
		graph: Graph | null;
		source: number;
		target: number;
		found: boolean;
		heuristic: HeuristicPolicy;
		constructor(graph?: Graph | null, source?: number, target?: number);
		search(): this;
		getPath(): number[];
		getSearchTree(): Edge[];
		clear(): this;
	}

	// Heuristic policies
	interface HeuristicPolicy {
		calculate(graph: Graph, source: number, target: number): number;
	}

	export const HeuristicPolicyEuclid: HeuristicPolicy;
	export const HeuristicPolicyEuclidSquared: HeuristicPolicy;
	export const HeuristicPolicyManhattan: HeuristicPolicy;
	export const HeuristicPolicyDijkstra: HeuristicPolicy;

	// Game entities
	export class GameEntity {
		uuid: string;
		position: Vector3;
		rotation: Quaternion;
		velocity: Vector3;
		boundingRadius: number;
		active: boolean;
		neighbors: GameEntity[];
		update(delta: number): this;
	}

	export class MovingEntity extends GameEntity {
		maxSpeed: number;
		updateOrientation: boolean;
		getSpeed(): number;
		getSpeedSquared(): number;
	}

	export class Vehicle extends MovingEntity {
		mass: number;
		maxForce: number;
		steering: SteeringManager;
		smoother: Smoother | null;
		constructor();
		update(delta: number): this;
	}

	export class Smoother {
		constructor(count: number);
	}

	// Steering
	export class SteeringManager {
		add(behavior: SteeringBehavior): this;
		remove(behavior: SteeringBehavior): this;
		clear(): this;
		calculate(delta: number, force: Vector3): Vector3;
	}

	export class SteeringBehavior {
		active: boolean;
		weight: number;
	}

	export class Path {
		loop: boolean;
		constructor();
		add(waypoint: Vector3): this;
		clear(): this;
		current(): Vector3;
		finished(): boolean;
		advance(): this;
		toJSON(): object;
		fromJSON(json: object): this;
	}

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
		constructor(target?: Vector3, deceleration?: number);
	}

	export class WanderBehavior extends SteeringBehavior {
		radius: number;
		distance: number;
		jitter: number;
		constructor(radius?: number, distance?: number, jitter?: number);
	}

	export class PursuitBehavior extends SteeringBehavior {
		evader: MovingEntity | null;
		constructor(evader?: MovingEntity);
	}

	export class EvadeBehavior extends SteeringBehavior {
		pursuer: MovingEntity | null;
		panicDistance: number;
		constructor(pursuer?: MovingEntity, panicDistance?: number);
	}

	export class FollowPathBehavior extends SteeringBehavior {
		path: Path;
		nextWaypointDistance: number;
		constructor(path?: Path, nextWaypointDistance?: number);
	}

	export class SeparationBehavior extends SteeringBehavior {
		constructor();
	}

	export class ObstacleAvoidanceBehavior extends SteeringBehavior {
		obstacles: GameEntity[];
		brakingWeight: number;
		dBoxMinLength: number;
		constructor(obstacles?: GameEntity[]);
	}

	// State machine
	export class StateMachine<T = GameEntity> {
		owner: T;
		currentState: State<T> | null;
		globalState: State<T> | null;
		constructor(owner: T);
		add(name: string, state: State<T>): this;
		changeTo(name: string): void;
		update(): void;
		handleMessage(message: Telegram): boolean;
	}

	export class State<T = GameEntity> {
		enter(owner: T): void;
		execute(owner: T): void;
		exit(owner: T): void;
		onMessage(owner: T, telegram: Telegram): boolean;
	}

	export class Telegram {
		sender: GameEntity;
		receiver: GameEntity;
		message: string;
		data: unknown;
		delay: number;
	}

	// Entity manager
	export class EntityManager {
		entities: GameEntity[];
		add(entity: GameEntity): this;
		remove(entity: GameEntity): this;
		clear(): this;
		update(delta: number): this;
	}

	export namespace Time {
		let delta: number;
		let elapsed: number;
		function update(): void;
	}
}
