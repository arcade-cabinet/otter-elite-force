/**
 * Shared Enemy Types
 */

import type * as THREE from "three";

export interface EnemyBaseData {
	id: string;
	position: THREE.Vector3;
	hp: number;
	maxHp: number;
	isHeavy?: boolean;
	suppression: number;
	objectiveId?: string;
}

export interface GatorData extends EnemyBaseData {
	state: "IDLE" | "STALK" | "AMBUSH" | "RETREAT";
	suppression: number;
	isHeavy: boolean;
}

export interface SnakeData extends EnemyBaseData {}

export interface SnapperData extends EnemyBaseData {}

export interface EnemyProps<T> {
	data: T;
	targetPosition: THREE.Vector3;
	onDeath?: (id: string) => void;
	onHit?: (id: string, damage: number, position: THREE.Vector3) => void;
}
