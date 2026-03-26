import { trait } from "koota";
import type { SteeringVehicle } from "@/ai/steeringFactory";

/** AI state — AoS for complex object data */
export const AIState = trait(() => ({
	state: "idle" as string,
	target: null as number | null,
	alertLevel: 0,
}));

/**
 * Yuka Vehicle reference — AoS callback, null until assigned.
 *
 * Koota's AoS factory signature requires `() => Record<string, any>` but
 * SteeringAgent stores a nullable SteeringVehicle directly. The runtime
 * handles this fine; we bridge the type gap with `as unknown as` (not `as any`).
 */
const steeringFactory: () => SteeringVehicle | null = () => null;
export const SteeringAgent = trait(steeringFactory as unknown as () => SteeringVehicle);
