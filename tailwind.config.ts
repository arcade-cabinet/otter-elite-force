import type { Config } from "tailwindcss";

/** Shared color palette across all three visual themes (Tactical HUD, Command Post, Briefing). */
export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				"jungle-depth": "#0f2f1c",
				khaki: "#c2b28a",
				rust: "#3a2f1e",
				gunmetal: "#6b4e3a",
				phosphor: "#00ff41",
				"blood-orange": "#ff4500",
				"faded-yellow": "#d4a574",
				parchment: "#f5e6c8",
			},
		},
	},
	plugins: [],
} satisfies Config;
