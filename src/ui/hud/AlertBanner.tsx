/**
 * AlertBanner — Top-right alert notifications for gameplay events.
 *
 * Displays ephemeral alert messages for key game events:
 * - "Under Attack!" when player units take damage from enemies
 * - "Building Complete" when construction finishes
 * - "Training Complete" when unit production finishes
 * - "Enemy Spotted" when fog reveals enemy units
 * - "Objective Complete" when mission objectives are achieved
 *
 * Alerts auto-dismiss after 3 seconds. Maximum 3 visible simultaneously.
 * Clicking an alert dispatches camera-center to the event location.
 *
 * US-016: AlertBanner event wiring
 */
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/ui/lib/utils";

const MAX_VISIBLE_ALERTS = 3;
const ALERT_DISMISS_MS = 3000;

export interface Alert {
	id: string;
	message: string;
	severity: "info" | "warning" | "critical";
	/** World position to center camera on when clicked */
	worldX?: number;
	worldY?: number;
}

export type AlertPayload = Omit<Alert, "id">;

/** Emit a HUD alert from any system or component. */
export function emitHudAlert(alert: AlertPayload) {
	EventBus.emit("hud-alert", alert);
}

export function AlertBanner() {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const push = useCallback((alert: AlertPayload) => {
		const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		setAlerts((prev) => {
			// Keep only the last (MAX - 1) alerts + new one
			const trimmed = prev.slice(-(MAX_VISIBLE_ALERTS - 1));
			return [...trimmed, { ...alert, id }];
		});
		window.setTimeout(() => {
			setAlerts((prev) => prev.filter((a) => a.id !== id));
		}, ALERT_DISMISS_MS);
	}, []);

	useEffect(() => {
		const onHudAlert = (alert: AlertPayload) => push(alert);

		// Wire standard game events to alerts
		const onUnderAttack = (data?: { x?: number; y?: number }) =>
			push({
				message: "Under Attack!",
				severity: "critical",
				worldX: data?.x,
				worldY: data?.y,
			});

		const onBuildingComplete = (data?: { name?: string; x?: number; y?: number }) =>
			push({
				message: data?.name ? `${data.name} Complete` : "Building Complete",
				severity: "info",
				worldX: data?.x,
				worldY: data?.y,
			});

		const onTrainingComplete = (data?: { name?: string; x?: number; y?: number }) =>
			push({
				message: data?.name ? `${data.name} Ready` : "Training Complete",
				severity: "info",
				worldX: data?.x,
				worldY: data?.y,
			});

		const onEnemySpotted = (data?: { x?: number; y?: number }) =>
			push({
				message: "Enemy Spotted",
				severity: "warning",
				worldX: data?.x,
				worldY: data?.y,
			});

		const onObjectiveComplete = (data?: { description?: string }) =>
			push({
				message: data?.description ? `Objective: ${data.description}` : "Objective Complete",
				severity: "info",
			});

		const onSceneReady = () => {
			// Scene ready — no alert needed (was debug noise)
		};

		const onMissionFailed = () =>
			push({ message: "Mission pressure spiking", severity: "critical" });

		EventBus.on("hud-alert", onHudAlert);
		EventBus.on("under-attack", onUnderAttack);
		EventBus.on("building-complete", onBuildingComplete);
		EventBus.on("training-complete", onTrainingComplete);
		EventBus.on("enemy-spotted", onEnemySpotted);
		EventBus.on("objective-completed", onObjectiveComplete);
		EventBus.on("current-scene-ready", onSceneReady);
		EventBus.on("mission-failed", onMissionFailed);

		return () => {
			EventBus.off("hud-alert", onHudAlert);
			EventBus.off("under-attack", onUnderAttack);
			EventBus.off("building-complete", onBuildingComplete);
			EventBus.off("training-complete", onTrainingComplete);
			EventBus.off("enemy-spotted", onEnemySpotted);
			EventBus.off("objective-completed", onObjectiveComplete);
			EventBus.off("current-scene-ready", onSceneReady);
			EventBus.off("mission-failed", onMissionFailed);
		};
	}, [push]);

	const handleAlertClick = useCallback((alert: Alert) => {
		if (alert.worldX !== undefined && alert.worldY !== undefined) {
			EventBus.emit("camera-center", { x: alert.worldX, y: alert.worldY });
		}
		setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
	}, []);

	if (alerts.length === 0) {
		return (
			<Card
				data-testid="alert-banner"
				className="canvas-grain w-full border-accent/12 bg-card/75 shadow-[0_16px_32px_rgba(0,0,0,0.28)] sm:ml-auto sm:max-w-sm"
			>
				<CardContent className="flex items-center justify-between gap-2 p-3">
					<Badge variant="accent">CLEAR</Badge>
					<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
						No active alerts
					</span>
				</CardContent>
			</Card>
		);
	}

	return (
		<div data-testid="alert-banner" className="flex w-full flex-col gap-2 sm:ml-auto sm:max-w-sm">
			{alerts.map((alert) => (
				<Card
					key={alert.id}
					className={cn(
						"canvas-grain cursor-pointer font-heading text-xs uppercase tracking-wider shadow-[0_18px_36px_rgba(0,0,0,0.3)] transition-opacity hover:opacity-90",
						alert.severity === "critical" &&
							"border-destructive bg-destructive/20 text-destructive",
						alert.severity === "warning" && "border-accent bg-accent/10 text-accent",
						alert.severity === "info" && "border-border bg-card text-card-foreground",
					)}
					onClick={() => handleAlertClick(alert)}
				>
					<CardContent className="flex items-center gap-2 p-3">
						<Badge
							variant={
								alert.severity === "critical"
									? "danger"
									: alert.severity === "warning"
										? "accent"
										: "default"
							}
						>
							{alert.severity}
						</Badge>
						<span>{alert.message}</span>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
