/**
 * EventBus — lightweight pub/sub event emitter for scene lifecycle signals.
 *
 * Replaces the previous Phaser.Events.EventEmitter to avoid pulling Phaser
 * into the initial bundle. The API surface matches what the codebase uses:
 *   .on(event, fn, context?)
 *   .off(event, fn, context?)
 *   .emit(event, ...args)
 *   .once(event, fn, context?)
 *
 * Events:
 *   - "current-scene-ready" (scene: Phaser.Scene)
 *   - "boot-complete"
 *   - "scene-ready"
 *   - "command-transmission" ({ missionId, speaker, text, portrait?, duration? })
 *   - "hud-alert" ({ message, severity })
 *   - "start-build-placement" ({ workerEntityId, buildingId })
 *   - "objective-completed" ({ objectiveId, description })
 *   - "mission-complete" (data: { missionId, stars, stats })
 *   - "mission-failed"  (data: { reason })
 *   - "game-paused"
 */

// biome-ignore lint/suspicious/noExplicitAny: event bus callbacks have varied signatures
type Listener = (...args: any[]) => void;

interface ListenerEntry {
	fn: Listener;
	context: unknown;
	once: boolean;
}

class LightEventEmitter {
	private listeners = new Map<string, ListenerEntry[]>();

	on(event: string, fn: Listener, context?: unknown): this {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push({ fn, context: context ?? null, once: false });
		return this;
	}

	once(event: string, fn: Listener, context?: unknown): this {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push({ fn, context: context ?? null, once: true });
		return this;
	}

	off(event: string, fn?: Listener, context?: unknown): this {
		const entries = this.listeners.get(event);
		if (!entries) return this;

		if (!fn) {
			this.listeners.delete(event);
			return this;
		}

		const ctx = context ?? null;
		const filtered = entries.filter(
			(entry) => entry.fn !== fn || entry.context !== ctx,
		);

		if (filtered.length > 0) {
			this.listeners.set(event, filtered);
		} else {
			this.listeners.delete(event);
		}

		return this;
	}

	emit(event: string, ...args: unknown[]): this {
		const entries = this.listeners.get(event);
		if (!entries) return this;

		// Iterate over a copy in case listeners modify the array
		const snapshot = [...entries];
		for (const entry of snapshot) {
			entry.fn.apply(entry.context, args);
		}

		// Remove once listeners
		const remaining = entries.filter((e) => !e.once);
		if (remaining.length > 0) {
			this.listeners.set(event, remaining);
		} else {
			this.listeners.delete(event);
		}

		return this;
	}

	removeAllListeners(): this {
		this.listeners.clear();
		return this;
	}
}

export const EventBus = new LightEventEmitter();
