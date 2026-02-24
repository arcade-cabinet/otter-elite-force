/**
 * AI Navigation System with Recast Navmesh
 */

import { type Mesh, type Scene, TransformNode, type Vector3 } from "@babylonjs/core";
import { RecastJSPlugin } from "@babylonjs/core/Navigation/Plugins/recastJSPlugin";

// Type definitions for Recast navigation
interface NavMeshParams {
	cs?: number;
	ch?: number;
	walkableSlopeAngle?: number;
	walkableHeight?: number;
	walkableClimb?: number;
	walkableRadius?: number;
	maxEdgeLen?: number;
	maxSimplificationError?: number;
	minRegionArea?: number;
	mergeRegionArea?: number;
	maxVertsPerPoly?: number;
	detailSampleDist?: number;
	detailSampleMaxError?: number;
}

interface AgentParams {
	radius?: number;
	height?: number;
	maxAcceleration?: number;
	maxSpeed?: number;
}

interface RecastNavMesh {
	computePath(start: Vector3, end: Vector3): Vector3[] | null;
}

interface RecastCrowd {
	addAgent(position: Vector3, params: AgentParams, transform: TransformNode): number;
	getAgentPosition(idx: number): Vector3;
	setAgentTarget(idx: number, target: Vector3): void;
	update(delta: number): void;
}

export class NavigationSystem {
	private scene: Scene;
	private navigationPlugin: RecastJSPlugin | null = null;
	private navMesh: RecastNavMesh | null = null;
	private crowd: RecastCrowd | null = null;

	constructor(scene: Scene) {
		this.scene = scene;
	}

	async initialize(): Promise<void> {
		const Recast = await import("recast-detour");
		this.navigationPlugin = new RecastJSPlugin(Recast);
		console.log("✅ Navigation system initialized with Recast");
	}

	async createNavMesh(meshes: Mesh[], parameters?: NavMeshParams): Promise<void> {
		if (!this.navigationPlugin) {
			throw new Error("Navigation plugin not initialized");
		}

		const navParams = {
			cs: parameters?.cs ?? 0.2,
			ch: parameters?.ch ?? 0.2,
			walkableSlopeAngle: parameters?.walkableSlopeAngle ?? 35,
			walkableHeight: parameters?.walkableHeight ?? 1,
			walkableClimb: parameters?.walkableClimb ?? 1,
			walkableRadius: parameters?.walkableRadius ?? 1,
			maxEdgeLen: parameters?.maxEdgeLen ?? 12,
			maxSimplificationError: parameters?.maxSimplificationError ?? 1.3,
			minRegionArea: parameters?.minRegionArea ?? 8,
			mergeRegionArea: parameters?.mergeRegionArea ?? 20,
			maxVertsPerPoly: parameters?.maxVertsPerPoly ?? 6,
			detailSampleDist: parameters?.detailSampleDist ?? 6,
			detailSampleMaxError: parameters?.detailSampleMaxError ?? 1,
		};

		this.navMesh = this.navigationPlugin.createNavMesh(meshes, navParams);
		this.crowd = this.navigationPlugin.createCrowd(100, 0.5, this.scene);
		console.log("✅ Navigation mesh created");
	}

	findPath(start: Vector3, end: Vector3): Vector3[] | null {
		if (!this.navigationPlugin || !this.navMesh) {
			return null;
		}
		return this.navigationPlugin.computePath(start, end);
	}

	addAgent(position: Vector3, parameters?: AgentParams): number {
		if (!this.crowd) {
			throw new Error("Crowd not initialized");
		}

		const agentParams = {
			radius: parameters?.radius ?? 0.5,
			height: parameters?.height ?? 2.0,
			maxAcceleration: parameters?.maxAcceleration ?? 4.0,
			maxSpeed: parameters?.maxSpeed ?? 1.0,
		};

		return this.crowd.addAgent(position, agentParams, new TransformNode("agent", this.scene));
	}

	setAgentTarget(agentIndex: number, target: Vector3): void {
		if (this.crowd) {
			this.crowd.agentGoto(agentIndex, target);
		}
	}

	update(deltaTime: number): void {
		if (this.crowd) {
			this.crowd.update(deltaTime);
		}
	}

	dispose(): void {
		if (this.navigationPlugin) {
			this.navigationPlugin.dispose();
		}
	}
}
