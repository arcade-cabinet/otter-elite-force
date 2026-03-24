/**
 * AlertBanner — Top-right alert notifications (incoming transmission, reinforcements, etc.).
 *
 * Displays ephemeral alert messages with blood-orange styling.
 * Alerts are driven by a simple state array; Koota systems push alerts,
 * and a timer auto-dismisses them.
 */
import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/ui/lib/utils";

export interface Alert {
	id: string;
	message: string;
	severity: "info" | "warning" | "critical";
}

type AlertPayload = Omit<Alert, "id">;

export function emitHudAlert(alert: AlertPayload) {
	EventBus.emit("hud-alert", alert);
}

export function AlertBanner() {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const push = useCallback((alert: AlertPayload) => {
		const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		setAlerts((prev) => [...prev.slice(-2), { ...alert, id }]);
		window.setTimeout(() => {
			setAlerts((prev) => prev.filter((a) => a.id !== id));
		}, 5000);
	}, []);

	useEffect(() => {
		const onHudAlert = (alert: AlertPayload) => push(alert);
		const onSceneReady = () => push({ message: "Scene sync green", severity: "info" });
		const onMissionFailed = () => push({ message: "Mission pressure spiking", severity: "critical" });

		EventBus.on("hud-alert", onHudAlert);
		EventBus.on("current-scene-ready", onSceneReady);
		EventBus.on("mission-failed", onMissionFailed);

		return () => {
			EventBus.off("hud-alert", onHudAlert);
			EventBus.off("current-scene-ready", onSceneReady);
			EventBus.off("mission-failed", onMissionFailed);
		};
	}, [push]);

	const dismiss = useCallback((id: string) => {
		setAlerts((prev) => prev.filter((a) => a.id !== id));
	}, []);

	if (alerts.length === 0) {
		return (
			<Card data-testid="alert-banner" className="w-full border-accent/12 bg-card/75 shadow-[0_16px_32px_rgba(0,0,0,0.28)] sm:ml-auto sm:max-w-sm">
				<CardContent className="flex items-center justify-between gap-2 p-3">
					<Badge variant="accent">CLEAR</Badge>
					<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">No active alerts</span>
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
							"font-heading text-xs uppercase tracking-wider shadow-[0_18px_36px_rgba(0,0,0,0.3)]",
						alert.severity === "critical" &&
							"border-destructive bg-destructive/20 text-destructive",
						alert.severity === "warning" && "border-accent bg-accent/10 text-accent",
						alert.severity === "info" && "border-border bg-card text-card-foreground",
					)}
				>
					<CardContent className="flex items-center gap-2 p-3">
							<Badge variant={alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "accent" : "default"}>
								{alert.severity}
							</Badge>
						<span>{alert.message}</span>
						<button type="button" onClick={() => dismiss(alert.id)} className="ml-2 text-muted-foreground hover:text-foreground">
							X
						</button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

/**
 * Push an alert to the banner. Call from Koota systems or event handlers.
 * This is a placeholder — will be replaced with a Koota-driven alert trait.
 */
export function useAlerts() {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const push = useCallback((alert: Omit<Alert, "id">) => {
		const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		setAlerts((prev) => [...prev, { ...alert, id }]);
		setTimeout(() => {
			setAlerts((prev) => prev.filter((a) => a.id !== id));
		}, 5000);
	}, []);

	return { alerts, push };
}
