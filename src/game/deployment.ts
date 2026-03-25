export type DifficultyMode = "support" | "tactical" | "elite";

export interface DeploymentData {
	missionId: string | number;
	difficulty: DifficultyMode;
}

let pendingDeployment: DeploymentData | null = null;

export function queueDeployment(data?: DeploymentData): void {
	pendingDeployment = data ?? null;
}

export function consumeDeployment(): DeploymentData | null {
	const deployment = pendingDeployment;
	pendingDeployment = null;
	return deployment;
}
