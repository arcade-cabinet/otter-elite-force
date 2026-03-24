import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border-2 border-transparent bg-clip-padding font-heading text-[11px] uppercase tracking-[0.18em] whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 active:not-disabled:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-border bg-[linear-gradient(180deg,rgba(77,42,27,0.96),rgba(58,31,20,0.96))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_26px_rgba(0,0,0,0.24)] hover:border-accent/70 hover:text-accent hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,226,138,0.2),0_16px_30px_rgba(0,0,0,0.28)] active:shadow-[inset_0_3px_0_rgba(0,0,0,0.28)]",
				outline:
					"border-border bg-background/20 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-accent/60 hover:bg-background/35 hover:text-accent",
				secondary:
					"border-secondary bg-secondary/85 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-primary/60 hover:bg-secondary hover:text-foreground",
				ghost:
					"border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/15 hover:text-foreground",
				destructive:
					"border-destructive/50 bg-destructive/12 text-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-destructive hover:bg-destructive/20 hover:text-destructive-foreground",
				link: "border-transparent bg-transparent px-0 text-primary underline-offset-4 hover:text-accent hover:underline",
				accent:
					"border-accent/80 bg-[linear-gradient(180deg,rgba(255,226,138,0.96),rgba(212,165,116,0.96))] text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_30px_rgba(0,0,0,0.2)] hover:border-accent hover:brightness-105 active:shadow-[inset_0_3px_0_rgba(58,31,20,0.2)]",
				command:
					"border-primary/30 bg-[linear-gradient(180deg,rgba(77,42,27,0.98),rgba(58,31,20,0.96))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.26)] hover:border-accent/70 hover:text-accent hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,226,138,0.2),0_18px_36px_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.32)]",
				hud: "border-accent/25 bg-background/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.24)] hover:border-accent/60 hover:bg-background/85 hover:text-accent",
			},
			size: {
				default: "h-10 px-4",
				xs: "h-7 px-2.5 text-[10px] tracking-[0.16em]",
				sm: "h-8 px-3 text-[10px]",
				lg: "h-12 px-5 text-xs",
				icon: "size-10 p-0",
				"icon-xs": "size-7 p-0",
				"icon-sm": "size-8 p-0",
				"icon-lg": "size-12 p-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
