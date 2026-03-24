import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/ui/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em]",
	{
		variants: {
			variant: {
				default: "border-border bg-card/70 text-muted-foreground",
				accent: "border-accent/40 bg-accent/12 text-accent",
				primary: "border-primary/40 bg-primary/12 text-primary",
				danger: "border-destructive/40 bg-destructive/12 text-destructive",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}