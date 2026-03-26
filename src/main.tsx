import { render } from "solid-js/web";
import { AppShell } from "./solid/AppShell";
import "./app/globals.css";

render(() => <AppShell />, document.getElementById("root")!);
