import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/ui/lib/utils";
import {
	resolveBriefingShellLayout,
	resolveCommandShellLayout,
	resolveTacticalHudLayout,
	type ShellLayout,
	type TacticalHudLayout,
	useViewportProfile,
} from "./viewport";

interface ShellProps {
	className?: string;
	eyebrow?: string;
	title: string;
	subtitle?: string;
	children: ReactNode;
	aside?: ReactNode;
	footer?: ReactNode;
	meta?: ReactNode;
	layout?: ShellLayout;
}

export function CommandPostShell({
	className,
	eyebrow = "Campaign Command Interface",
	title,
	subtitle,
	children,
	aside,
	footer,
	meta,
	layout,
}: ShellProps) {
	const profile = useViewportProfile();
	const resolvedLayout = layout ?? resolveCommandShellLayout(profile);
	const contentLayout = !aside
		? "grid-cols-1"
		: resolvedLayout === "wide"
			? "xl:grid-cols-[minmax(0,1fr)_20rem]"
			: resolvedLayout === "split"
				? "lg:grid-cols-[minmax(0,1fr)_18rem]"
				: "grid-cols-1";

	return (
		<div
			data-shell-layout={resolvedLayout}
			className={cn(
				"command-post-shell relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-5 sm:py-5 lg:px-8 lg:py-6",
				className,
			)}
		>
			<div className="screen-noise absolute inset-0 opacity-60" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,226,138,0.12),transparent_38%),linear-gradient(180deg,rgba(10,8,6,0.15),rgba(10,8,6,0.45))]" />
			<div className="command-post-shell-detail absolute inset-x-6 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,165,116,0.45),transparent)]" />
			<div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4 sm:min-h-[calc(100vh-2.5rem)] sm:gap-5 lg:min-h-[calc(100vh-3rem)] lg:gap-6">
				<CommandHeader
					eyebrow={eyebrow}
					title={title}
					subtitle={subtitle}
					meta={meta}
					layout={resolvedLayout}
				/>
				<div className={cn("grid flex-1 gap-4 sm:gap-5 lg:gap-6", contentLayout)}>
					{children}
					{aside}
				</div>
				{footer}
			</div>
		</div>
	);
}

export function BriefingShell({
	className,
	eyebrow = "Mission Briefing",
	title,
	subtitle,
	children,
	aside,
	footer,
	meta,
	layout,
}: ShellProps) {
	const profile = useViewportProfile();
	const resolvedLayout = layout ?? resolveBriefingShellLayout(profile);
	const contentLayout = !aside
		? "grid-cols-1"
		: resolvedLayout === "split"
			? "xl:grid-cols-[18rem_minmax(0,1fr)]"
			: "grid-cols-1";

	return (
		<div
			data-shell-layout={resolvedLayout}
			className={cn(
				"briefing-shell relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-5 sm:py-5 lg:px-8 lg:py-6",
				className,
			)}
		>
			<div className="screen-noise absolute inset-0 opacity-50" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,230,200,0.08),transparent_28%),radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.62))]" />
			<div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4 sm:min-h-[calc(100vh-2.5rem)] sm:gap-5 lg:min-h-[calc(100vh-3rem)] lg:gap-6">
				<CommandHeader
					eyebrow={eyebrow}
					title={title}
					subtitle={subtitle}
					meta={meta}
					compact
					layout={resolvedLayout}
				/>
				<div className={cn("grid flex-1 items-stretch gap-4 sm:gap-5 lg:gap-6", contentLayout)}>
					{aside}
					{children}
				</div>
				{footer}
			</div>
		</div>
	);
}

interface TacticalShellProps {
	className?: string;
	children: ReactNode;
	hudTop?: ReactNode;
	alerts?: ReactNode;
	leftDock?: ReactNode;
	centerDock?: ReactNode;
	rightDock?: ReactNode;
	hudLayout?: TacticalHudLayout;
}

export function TacticalShell({
	className,
	children,
	hudTop,
	alerts,
	leftDock,
	centerDock,
	rightDock,
	hudLayout,
}: TacticalShellProps) {
	const profile = useViewportProfile();
	const resolvedHudLayout = hudLayout ?? resolveTacticalHudLayout(profile);
	const dockGridClass =
		resolvedHudLayout === "desktop"
			? "grid-cols-[11rem_minmax(0,1fr)_16rem]"
			: resolvedHudLayout === "tablet"
				? "grid-cols-[10rem_minmax(0,1fr)]"
				: "grid-cols-[9rem_minmax(0,1fr)]";
	const leftDockClass =
		resolvedHudLayout === "desktop"
			? "order-1 max-w-38 sm:max-w-44"
			: resolvedHudLayout === "tablet"
				? "order-1 max-w-40"
				: "order-1 max-w-36";
	const centerDockClass =
		resolvedHudLayout === "desktop"
			? "order-2 min-w-0"
			: resolvedHudLayout === "tablet"
				? "order-2 min-w-0"
				: "order-3 col-span-2";
	const rightDockClass =
		resolvedHudLayout === "desktop"
			? "order-3 min-w-0"
			: resolvedHudLayout === "tablet"
				? "order-3 col-span-2 w-full"
				: "order-2 min-w-0";

	return (
		<div
			data-hud-layout={resolvedHudLayout}
			className={cn(
				"tactical-shell relative h-screen w-screen overflow-hidden bg-background text-foreground",
				className,
			)}
		>
			<div className="screen-noise absolute inset-0 opacity-45" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,65,0.12),transparent_25%),linear-gradient(180deg,rgba(3,12,7,0.08),rgba(3,12,7,0.38))]" />
			<div className="tactical-shell-scanline absolute inset-x-0 top-3 h-px bg-[linear-gradient(90deg,transparent,rgba(138,255,156,0.75),transparent)]" />
			<div className="relative z-0 h-full w-full">{children}</div>
			<div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2 sm:gap-3 sm:p-3 lg:p-4">
				<div data-hud-region="hud-top" className="pointer-events-auto">
					{hudTop}
				</div>
				<div className="pointer-events-none flex-1">
					<div
						data-hud-region="alerts"
						className="pointer-events-auto ml-0 flex w-full justify-end sm:ml-auto"
					>
						{alerts}
					</div>
				</div>
				<div
					className={cn("pointer-events-none mt-auto grid items-end gap-2 sm:gap-3", dockGridClass)}
				>
					<div data-hud-region="left-dock" className={cn("pointer-events-auto", leftDockClass)}>
						{leftDock}
					</div>
					<div data-hud-region="center-dock" className={cn("pointer-events-auto", centerDockClass)}>
						{centerDock}
					</div>
					<div data-hud-region="right-dock" className={cn("pointer-events-auto", rightDockClass)}>
						{rightDock}
					</div>
				</div>
			</div>
		</div>
	);
}

function CommandHeader({
	eyebrow,
	title,
	subtitle,
	meta,
	compact = false,
	layout = "wide",
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	meta?: ReactNode;
	compact?: boolean;
	layout?: ShellLayout;
}) {
	return (
		<Card className="overflow-hidden border-primary/25 bg-card/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_rgba(0,0,0,0.26)]">
			<CardContent
				className={cn(
					"grid gap-3 p-3 sm:gap-4 sm:p-5",
					(compact || layout !== "stacked") && "lg:grid-cols-[minmax(0,1fr)_auto]",
				)}
			>
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="primary" className="w-fit">
							{eyebrow}
						</Badge>
						<Badge className="w-fit">RTS FIELD KIT</Badge>
					</div>
					<div>
						<h1
							className={cn(
								"font-heading uppercase text-primary",
								layout === "stacked"
									? "text-xl tracking-[0.2em] sm:text-3xl sm:tracking-[0.24em]"
									: "text-2xl tracking-[0.22em] sm:text-4xl sm:tracking-[0.28em]",
							)}
						>
							{title}
						</h1>
						{subtitle ? (
							<p className="mt-2 max-w-3xl font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:text-sm sm:tracking-[0.16em]">
								{subtitle}
							</p>
						) : null}
					</div>
				</div>
				{meta ? (
					<div
						className={cn(
							"flex items-start justify-start",
							layout !== "stacked" && "lg:justify-end",
						)}
					>
						{meta}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

export function ShellPanel({
	title,
	description,
	children,
	className,
}: {
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("overflow-hidden border-border/80 bg-card/88", className)}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
