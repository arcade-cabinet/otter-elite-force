import { trait } from "koota";

/** Tag: entity is in a concealment zone */
export const Concealed = trait();

/** Tag: entity is voluntarily crouching/stealthed */
export const Crouching = trait();

/** Detection radius for spotting hidden units */
export const DetectionRadius = trait({ radius: 6 });

/** Directional detection cone for enemy sentries / patrols */
export const DetectionCone = trait(() => ({
	range: 6,
	halfAngle: 45,
	alertState: "idle" as "idle" | "suspicious" | "alert",
	suspicionTimer: 0,
	suspicionThreshold: 2,
}));

/** World-level alarm singleton — attached to a scenario entity */
export const AlarmState = trait(() => ({
	active: false,
	triggeredAt: 0,
	reinforcementWaves: 0,
}));

/** Tag: unit is in stealth mode (invisible to detection cones) */
export const Stealthed = trait();
