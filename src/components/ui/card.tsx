import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/ui/lib/utils";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	return (
		<div
			className={cn(
				"rounded-none border border-border/90 bg-card/92 text-card-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_36px_rgba(0,0,0,0.22)] backdrop-blur-sm",
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	return <div className={cn("flex flex-col gap-2 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
	return (
		<h3
			className={cn("font-heading text-lg uppercase tracking-[0.22em] text-foreground", className)}
			{...props}
		/>
	);
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
	return (
		<p
			className={cn(
				"font-body text-xs uppercase tracking-[0.18em] text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	return <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />;
}
