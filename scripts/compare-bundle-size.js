#!/usr/bin/env node

/**
 * Compare bundle sizes between base and PR
 * Generates a markdown comment for GitHub PR
 */

import fs from "node:fs";
import { formatBytes, formatDiff } from "./bundle-utils.js";

const PR_BUNDLE_PATH = "pr-bundle-size.json";
const BASE_BUNDLE_PATH = "base-bundle-size.json";
const OUTPUT_PATH = "bundle-comment.md";

/**
 * Compare two bundle reports and generate markdown comment
 */
function compareBundleSizes() {
	// Load bundle reports
	if (!fs.existsSync(PR_BUNDLE_PATH) || !fs.existsSync(BASE_BUNDLE_PATH)) {
		console.error("Error: Bundle size reports not found");
		process.exit(1);
	}

	const prBundle = JSON.parse(fs.readFileSync(PR_BUNDLE_PATH, "utf8"));
	const baseBundle = JSON.parse(fs.readFileSync(BASE_BUNDLE_PATH, "utf8"));

	// Calculate differences
	const prSize = prBundle.total.bytes;
	const baseSize = baseBundle.total.bytes;
	const diff = prSize - baseSize;
	const diffPercent = ((diff / baseSize) * 100).toFixed(2);

	// Determine status
	const emoji = diff > 0 ? "📈" : diff < 0 ? "📉" : "✅";
	const status =
		Math.abs(diff) < 10000
			? "acceptable"
			: diff > 0
				? "increased"
				: "decreased";

	// Build markdown comment
	let comment = `## ${emoji} Bundle Size Report\n\n`;
	comment += "| Metric | Base | PR | Diff |\n";
	comment += "|--------|------|-----|------|\n";
	comment += `| **Total** | ${baseBundle.total.formatted} | ${prBundle.total.formatted} | ${formatDiff(diff)} (${diffPercent}%) |\n`;
	comment += `| JavaScript | ${baseBundle.breakdown.javascript.formatted} | ${prBundle.breakdown.javascript.formatted} | ${formatDiff(prBundle.breakdown.javascript.bytes - baseBundle.breakdown.javascript.bytes)} |\n`;
	comment += `| CSS | ${baseBundle.breakdown.css.formatted} | ${prBundle.breakdown.css.formatted} | ${formatDiff(prBundle.breakdown.css.bytes - baseBundle.breakdown.css.bytes)} |\n`;
	comment += `| Assets | ${baseBundle.breakdown.assets.formatted} | ${prBundle.breakdown.assets.formatted} | ${formatDiff(prBundle.breakdown.assets.bytes - baseBundle.breakdown.assets.bytes)} |\n\n`;

	// Add warning for significant changes
	if (Math.abs(Number.parseFloat(diffPercent)) >= 5) {
		comment += `> ⚠️ **Warning**: Bundle size changed by ${Math.abs(Number.parseFloat(diffPercent))}%\n\n`;
	}

	// Add largest files
	comment += "### 📊 Largest Files (PR)\n\n";
	for (const file of prBundle.largestFiles.slice(0, 5)) {
		comment += `- \`${file.path}\` - ${file.formatted}\n`;
	}

	comment +=
		"\n*Bundle size tracking helps monitor application performance and load times.*";

	// Write comment to file
	fs.writeFileSync(OUTPUT_PATH, comment);

	// Print summary
	console.log("Bundle Size Comparison:");
	console.log(`Status: ${status}`);
	console.log(`Diff: ${formatDiff(diff)} (${diffPercent}%)`);
	console.log(`\nComment saved to: ${OUTPUT_PATH}`);
}

// Run the comparison
try {
	compareBundleSizes();
} catch (error) {
	console.error("Error comparing bundles:", error);
	process.exit(1);
}
