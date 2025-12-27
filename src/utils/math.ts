/**
 * Utility functions for game logic
 */

import type * as THREE from "three";

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
 * Calculate distance between two Vector3 positions or objects with x,y,z
 */
export function distance(
	a: THREE.Vector3 | { x: number; y: number; z: number },
	b: THREE.Vector3 | { x: number; y: number; z: number },
): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const dz = a.z - b.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize angle to -PI to PI range using modulo for performance
 */
export function normalizeAngle(angle: number): number {
	const twoPi = Math.PI * 2;
	return ((((angle + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
}

/**
 * Get shortest angular difference between two angles
 */
export function angleDifference(from: number, to: number): number {
	return normalizeAngle(to - from);
}

/**
 * Smoothly interpolate between two angles
 */
export function lerpAngle(start: number, end: number, t: number): number {
	const diff = angleDifference(start, end);
	return start + diff * t;
}
