import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx — standard shadcn utility. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
