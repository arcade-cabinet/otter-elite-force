/**
 * Utility functions for game logic
 */

import * as THREE from "three";

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

/**
 * Get random value between min and max
 */
export function randomRange(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
	return Math.floor(randomRange(min, max + 1));
}

/**
 * Calculate distance between two Vector3 positions
 */
export function distance(a: THREE.Vector3, b: THREE.Vector3): number {
	return a.distanceTo(b);
}

/**
 * Normalize angle to -PI to PI range
 */
export function normalizeAngle(angle: number): number {
	while (angle > Math.PI) angle -= Math.PI * 2;
	while (angle < -Math.PI) angle += Math.PI * 2;
	return angle;
}

/**
 * Get shortest angular difference between two angles
 */
export function angleDifference(from: number, to: number): number {
	const diff = to - from;
	return normalizeAngle(diff);
}
