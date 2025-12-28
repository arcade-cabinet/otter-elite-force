/**
 * Interaction System - Handle hold-to-interact mechanics
 *
 * Manages player interactions with objects in the world:
 * - Prison cage rescues
 * - Extraction points
 * - Other interactable objects
 */

import type * as THREE from "three";
import type { Entity } from "../world";
import { interactables } from "../world";

export interface InteractionState {
	targetEntity: Entity | null;
	progress: number; // 0-1
	isInteracting: boolean;
	interruptedByDamage: boolean;
}

export const interactionState: InteractionState = {
	targetEntity: null,
	progress: 0,
	isInteracting: false,
	interruptedByDamage: false,
};

/**
 * Update interaction system
 * @param delta - Time since last frame in seconds
 * @param playerPosition - Current player position
 * @param isActionPressed - Whether action button is held
 * @param onComplete - Callback when interaction completes
 */
export function updateInteractions(
	delta: number,
	playerPosition: THREE.Vector3,
	isActionPressed: boolean,
	onComplete?: (entity: Entity) => void,
): void {
	// Find nearby interactable entities
	let closestInteractable: Entity | null = null;
	let closestDistance = Number.POSITIVE_INFINITY;

	for (const entity of interactables) {
		if (!entity.transform || !entity.interactable) continue;

		// Skip if already completed
		if (entity.rescuable?.isRescued) continue;
		if (entity.objective?.isCompleted) continue;

		const distance = playerPosition.distanceTo(entity.transform.position);
		const range = entity.interactable.range ?? 3;

		if (distance < range && distance < closestDistance) {
			closestInteractable = entity;
			closestDistance = distance;
		}
	}

	// Update interaction state
	if (closestInteractable && isActionPressed) {
		// Start or continue interaction
		if (!interactionState.isInteracting) {
			interactionState.isInteracting = true;
			interactionState.targetEntity = closestInteractable;
			interactionState.progress = 0;
			interactionState.interruptedByDamage = false;
		}

		if (
			interactionState.targetEntity === closestInteractable &&
			!interactionState.interruptedByDamage
		) {
			// Update progress (3 second interaction)
			const interactionTime = 3.0;
			interactionState.progress += delta / interactionTime;

			// Clamp progress
			if (interactionState.progress >= 1.0) {
				interactionState.progress = 1.0;

				// Interaction complete!
				if (onComplete) {
					onComplete(closestInteractable);
				}

				// Reset state
				resetInteraction();
			}
		}
	} else {
		// Not interacting or out of range
		if (interactionState.isInteracting) {
			resetInteraction();
		}
		interactionState.targetEntity = closestInteractable;
	}
}

/**
 * Interrupt current interaction (e.g., when player takes damage)
 */
export function interruptInteraction(): void {
	if (interactionState.isInteracting) {
		interactionState.interruptedByDamage = true;
		interactionState.progress = 0;
		interactionState.isInteracting = false;
	}
}

/**
 * Reset interaction state
 */
export function resetInteraction(): void {
	interactionState.targetEntity = null;
	interactionState.progress = 0;
	interactionState.isInteracting = false;
	interactionState.interruptedByDamage = false;
}

/**
 * Get the current interaction prompt text
 */
export function getInteractionPrompt(): string | null {
	if (!interactionState.targetEntity?.interactable) return null;

	const { promptText } = interactionState.targetEntity.interactable;

	if (interactionState.isInteracting) {
		const percent = Math.floor(interactionState.progress * 100);
		return `${promptText}... ${percent}%`;
	}

	return `HOLD [ACTION] TO ${promptText}`;
}
