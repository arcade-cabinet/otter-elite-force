/**
 * AlertBanner — Top-right alert notifications (incoming transmission, reinforcements, etc.).
 *
 * Displays ephemeral alert messages with blood-orange styling.
 * Alerts are driven by a simple state array; Koota systems push alerts,
 * and a timer auto-dismisses them.
 */
import { useState, useCallback } from "react";
import { cn } from "@/ui/lib/utils";

export interface Alert {
	id: string;
	message: string;
	severity: "info" | "warning" | "critical";
}

export function AlertBanner() {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const dismiss = useCallback((id: string) => {
		setAlerts((prev) => prev.filter((a) => a.id !== id));
	}, []);

	if (alerts.length === 0) {
		return <div data-testid="alert-banner" />;
	}

	return (
		<div data-testid="alert-banner" className="fixed right-4 top-14 z-50 flex flex-col gap-2">
			{alerts.map((alert) => (
				<div
					key={alert.id}
					className={cn(
						"flex items-center gap-2 px-4 py-2",
						"border-2 font-heading text-xs uppercase tracking-wider",
						alert.severity === "critical" &&
							"border-destructive bg-destructive/20 text-destructive",
						alert.severity === "warning" && "border-accent bg-accent/10 text-accent",
						alert.severity === "info" && "border-border bg-card text-card-foreground",
					)}
				>
					<span>{alert.message}</span>
					<button
						type="button"
						onClick={() => dismiss(alert.id)}
						className="ml-2 text-muted-foreground hover:text-foreground"
					>
						X
					</button>
				</div>
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
