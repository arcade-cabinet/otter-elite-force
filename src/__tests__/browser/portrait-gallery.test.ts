/**
 * Portrait Gallery — VISUAL browser test for character portrait rendering.
 *
 * This test renders ALL character portraits side by side in the browser
 * for manual visual inspection. Run with:
 *
 *   pnpm test:browser -- portrait-gallery
 *
 * It creates a gallery grid showing each portrait at 2x scale (128x128)
 * with the character name and faction label underneath.
 *
 * There is no automated assertion beyond basic existence checks —
 * this is a manual validation tool for visual quality.
 */

import { describe, expect, it } from "vitest";
import {
	getPortraitCanvas,
	getPortraitIds,
	initPortraits,
} from "../../canvas/portraitRenderer";

describe("Portrait Gallery (visual)", () => {
	it("renders all portraits in a gallery grid", () => {
		initPortraits();
		const ids = getPortraitIds();

		// Create gallery container
		const gallery = document.createElement("div");
		gallery.id = "portrait-gallery";
		Object.assign(gallery.style, {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
			gap: "16px",
			padding: "24px",
			background: "#0f172a",
			fontFamily: "'Courier New', monospace",
			minHeight: "100vh",
		});

		const title = document.createElement("h1");
		title.textContent = "OTTER: ELITE FORCE — Character Portraits";
		Object.assign(title.style, {
			gridColumn: "1 / -1",
			color: "#fbbf24",
			fontSize: "20px",
			textTransform: "uppercase",
			letterSpacing: "0.2em",
			marginBottom: "8px",
		});
		gallery.appendChild(title);

		// OEF section
		const oefHeader = document.createElement("h2");
		oefHeader.textContent = "OTTER ELITE FORCE";
		Object.assign(oefHeader.style, {
			gridColumn: "1 / -1",
			color: "#3b82f6",
			fontSize: "14px",
			textTransform: "uppercase",
			letterSpacing: "0.3em",
			borderBottom: "2px solid #1e3a5f",
			paddingBottom: "4px",
		});
		gallery.appendChild(oefHeader);

		const oefIds = ["foxhound", "sgt_bubbles", "gen_whiskers", "cpl_splash", "sgt_fang", "medic_marina", "pvt_muskrat"];
		const sgIds = ["ironjaw", "scalebreak", "fangrot", "venom", "broodmother"];

		for (const id of oefIds) {
			gallery.appendChild(createPortraitCard(id, "OEF"));
		}

		// Scale-Guard section
		const sgHeader = document.createElement("h2");
		sgHeader.textContent = "SCALE-GUARD MILITIA";
		Object.assign(sgHeader.style, {
			gridColumn: "1 / -1",
			color: "#ef4444",
			fontSize: "14px",
			textTransform: "uppercase",
			letterSpacing: "0.3em",
			borderBottom: "2px solid #7f1d1d",
			paddingBottom: "4px",
			marginTop: "16px",
		});
		gallery.appendChild(sgHeader);

		for (const id of sgIds) {
			gallery.appendChild(createPortraitCard(id, "SG"));
		}

		// Clear body and mount gallery
		while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
		document.body.style.margin = "0";
		document.body.style.background = "#0f172a";
		document.body.appendChild(gallery);

		// Verify all portraits rendered
		expect(ids.length).toBeGreaterThanOrEqual(12);

		for (const id of [...oefIds, ...sgIds]) {
			const canvas = getPortraitCanvas(id);
			expect(canvas).not.toBeNull();
			expect(canvas!.width).toBe(128);
			expect(canvas!.height).toBe(128);
		}
	});
});

function createPortraitCard(id: string, faction: "OEF" | "SG"): HTMLDivElement {
	const card = document.createElement("div");
	Object.assign(card.style, {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "4px",
	});

	const frame = document.createElement("div");
	Object.assign(frame.style, {
		border: `2px solid ${faction === "OEF" ? "#1e3a5f" : "#7f1d1d"}`,
		background: "#1e293b",
		padding: "2px",
	});

	const canvas = getPortraitCanvas(id);
	if (canvas) {
		Object.assign(canvas.style, {
			display: "block",
			imageRendering: "pixelated",
		});
		frame.appendChild(canvas);
	}

	const label = document.createElement("div");
	label.textContent = id.replace(/_/g, " ").toUpperCase();
	Object.assign(label.style, {
		color: faction === "OEF" ? "#38bdf8" : "#f87171",
		fontSize: "10px",
		textTransform: "uppercase",
		letterSpacing: "0.2em",
	});

	const factionLabel = document.createElement("div");
	factionLabel.textContent = faction;
	Object.assign(factionLabel.style, {
		color: "#64748b",
		fontSize: "8px",
		textTransform: "uppercase",
		letterSpacing: "0.3em",
	});

	card.appendChild(frame);
	card.appendChild(label);
	card.appendChild(factionLabel);

	return card;
}
