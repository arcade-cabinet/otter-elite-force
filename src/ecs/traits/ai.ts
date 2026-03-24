import { trait } from "koota";

/** AI state — AoS for complex object data */
export const AIState = trait(() => ({
	state: "idle" as string,
	target: null as number | null,
	alertLevel: 0,
}));

/** Yuka Vehicle reference — AoS callback, null until assigned */
export const SteeringAgent = trait(() => null as unknown);
