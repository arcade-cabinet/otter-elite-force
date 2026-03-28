import { render } from "solid-js/web";
import { initDatabase } from "./persistence/database";
import { AppShell } from "./solid/AppShell";
import "./app/globals.css";

// Initialize the database singleton before rendering.
// This ensures getDatabase() never throws "not initialized" during app lifecycle.
void initDatabase().then(() => {
	render(() => <AppShell />, document.getElementById("root")!);
});
