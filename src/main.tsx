import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useGameStore } from "./stores/gameStore";
import "./styles/main.css";

// Expose game store for E2E testing
if (typeof window !== "undefined") {
	// biome-ignore lint/suspicious/noExplicitAny: E2E testing
	(window as any).useGameStore = useGameStore;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
