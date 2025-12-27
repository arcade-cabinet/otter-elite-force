/**
 * ECS Components - Pure Data Definitions
 *
 * Components are pure data containers with no logic.
 * Each component represents a single aspect of an entity.
 */

import type * as THREE from "three";
import type { Vehicle as YukaVehicle } from "yuka";

// =============================================================================
// TRANSFORM COMPONENTS
// =============================================================================

export interface Transform {
	position: THREE.Vector3;
	rotation: THREE.Euler;
	scale: THREE.Vector3;
}

export interface Velocity {
	linear: THREE.Vector3;
	angular: THREE.Vector3;
	maxSpeed: number;
}

// =============================================================================
// PHYSICS COMPONENTS
// =============================================================================

export interface Collider {
	radius: number;
	height: number;
	offset: THREE.Vector3;
	layer: "player" | "enemy" | "projectile" | "environment" | "trigger";
}

export interface RigidBody {
	mass: number;
	friction: number;
	isGrounded: boolean;
	isInWater: boolean;
}

// =============================================================================
// COMBAT COMPONENTS
// =============================================================================

export interface Health {
	current: number;
	max: number;
	regenRate: number;
	lastDamageTime: number;
	isInvulnerable: boolean;
}

export interface Damage {
	amount: number;
	type: "kinetic" | "explosive" | "fire" | "toxic";
	knockback: number;
	source?: string; // Entity ID of attacker
}

export interface Weapon {
	id: string;
	damage: number;
	fireRate: number;
	bulletSpeed: number;
	recoil: number;
	range: number;
	ammo: number;
	maxAmmo: number;
	lastFireTime: number;
	isFiring: boolean;
}

export interface Suppression {
	amount: number; // 0-1, how suppressed the entity is
	decayRate: number;
	threshold: number; // At what level behavior changes
}

// =============================================================================
// AI COMPONENTS
// =============================================================================

export type AIState =
	| "idle"
	| "patrol"
	| "alert"
	| "chase"
	| "attack"
	| "flee"
	| "ambush"
	| "signal"
	| "dead";

export interface AIBrain {
	currentState: AIState;
	previousState: AIState;
	stateTime: number;
	alertLevel: number; // 0-1
	lastKnownPlayerPos: THREE.Vector3 | null;
	homePosition: THREE.Vector3;
	patrolRadius: number;
}

export interface SteeringAgent {
	vehicle: YukaVehicle;
	targetPosition: THREE.Vector3 | null;
	avoidanceRadius: number;
	separationWeight: number;
	cohesionWeight: number;
	alignmentWeight: number;
}

export interface PackMember {
	packId: string;
	role: "alpha" | "scout" | "flanker" | "support";
	signalRange: number;
	lastSignalTime: number;
}

// =============================================================================
// CHARACTER COMPONENTS
// =============================================================================

export interface CharacterStats {
	id: string;
	name: string;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
}

export interface CharacterAppearance {
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
}

export interface CharacterGear {
	headgear: "bandana" | "beret" | "helmet" | "none";
	vest: "tactical" | "heavy" | "none";
	backgear: "radio" | "scuba" | "none";
	weaponId: string;
}

// =============================================================================
// ENEMY COMPONENTS
// =============================================================================

export type EnemyType = "gator" | "snake" | "snapper" | "scout";

export interface Enemy {
	type: EnemyType;
	tier: "light" | "heavy" | "elite";
	xpValue: number;
	lootTable: string[];
}

export interface Gator {
	isSubmerged: boolean;
	ambushCooldown: number;
	ambushDuration: number;
}

export interface Snake {
	segmentCount: number;
	strikeRange: number;
	strikeCooldown: number;
	isStriking: boolean;
	anchorPosition: THREE.Vector3;
}

export interface Snapper {
	turretRotation: number;
	turretTargetRotation: number;
	isOverheated: boolean;
	heatLevel: number;
}

export interface Scout {
	hasSpottedPlayer: boolean;
	signalCooldown: number;
	isSignaling: boolean;
	fleeDistance: number;
}

// =============================================================================
// OBJECTIVE COMPONENTS
// =============================================================================

export interface Objective {
	type: "siphon" | "gas_stockpile" | "prison_cage" | "clam_basket" | "extraction_point";
	isCompleted: boolean;
	isActive: boolean;
	progressRequired: number;
	currentProgress: number;
}

export interface Rescuable {
	characterId: string;
	isRescued: boolean;
	dialogueId: string;
}

export interface Destructible {
	hp: number;
	maxHp: number;
	isDestroyed: boolean;
	debrisType: string;
}

// =============================================================================
// ENVIRONMENT COMPONENTS
// =============================================================================

export interface Hazard {
	type: "oil_slick" | "mud_pit" | "toxic_sludge";
	damagePerSecond: number;
	slowFactor: number;
	isActive: boolean;
}

export interface OilSlick {
	isIgnited: boolean;
	burnTime: number;
	burnDuration: number;
	size: number;
}

export interface Climbable {
	height: number;
	climbSpeed: number;
	topPosition: THREE.Vector3;
}

export interface Platform {
	width: number;
	depth: number;
	isMoving: boolean;
	moveSpeed: number;
	waypoints: THREE.Vector3[];
}

// =============================================================================
// INTERACTION COMPONENTS
// =============================================================================

export interface Interactable {
	type: "talk" | "pickup" | "use" | "mount" | "rescue";
	range: number;
	promptText: string;
	isInteracting: boolean;
	cooldown: number;
}

export interface Villager {
	type: "civilian" | "healer" | "merchant";
	dialogueId: string;
	isLiberated: boolean;
	healAmount?: number;
}

export interface VehicleComponent {
	type: "raft";
	maxSpeed: number;
	acceleration: number;
	turnRate: number;
	isPiloted: boolean;
	pilotId: string | null;
}

// =============================================================================
// VISUAL COMPONENTS
// =============================================================================

export type RenderType =
	| "player_otter"
	| "gator"
	| "snake"
	| "snapper"
	| "scout"
	| "villager"
	| "healer"
	| "hut"
	| "siphon"
	| "gas_stockpile"
	| "prison_cage"
	| "raft"
	| "platform"
	| "oil_slick"
	| "mud_pit"
	| "toxic_sludge"
	| "extraction_point"
	| "clam_basket"
	| "projectile";

export interface Renderable {
	type: RenderType;
	visible: boolean;
	castShadow: boolean;
	receiveShadow: boolean;
}

export interface Animated {
	currentAnimation: string;
	animationSpeed: number;
	isPlaying: boolean;
	loop: boolean;
}

export interface ParticleEmitter {
	type: "muzzle_flash" | "blood" | "water_splash" | "smoke" | "fire" | "signal";
	rate: number;
	lifetime: number;
	isEmitting: boolean;
}

// =============================================================================
// AUDIO COMPONENTS
// =============================================================================

export interface AudioSource {
	soundId: string;
	volume: number;
	pitch: number;
	loop: boolean;
	spatialize: boolean;
	maxDistance: number;
}

// =============================================================================
// TAG COMPONENTS (Marker components with no data)
// =============================================================================

export interface IsPlayer {
	readonly __tag: "IsPlayer";
}

export interface IsEnemy {
	readonly __tag: "IsEnemy";
}

export interface IsProjectile {
	readonly __tag: "IsProjectile";
}

export interface IsEnvironment {
	readonly __tag: "IsEnvironment";
}

export interface IsObjective {
	readonly __tag: "IsObjective";
}

export interface IsInteractable {
	readonly __tag: "IsInteractable";
}

export interface IsDead {
	readonly __tag: "IsDead";
}

export interface IsInvulnerable {
	readonly __tag: "IsInvulnerable";
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

export interface Lifetime {
	remaining: number;
	onExpire: "destroy" | "deactivate" | "pool";
}

export interface Poolable {
	poolId: string;
	isActive: boolean;
}

export interface ChunkReference {
	chunkId: string;
	localPosition: THREE.Vector3;
}
