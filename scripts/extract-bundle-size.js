#!/usr/bin/env node

/**
 * Extract bundle size information from Vite build output
 * This script analyzes the dist folder and generates a JSON report
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "..", "dist");
const outputPath = path.join(__dirname, "..", "bundle-size.json");

/**
 * Get file size in bytes and format it
 */
function getFileSize(filePath) {
	const stats = fs.statSync(filePath);
	return stats.size;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
	const files = fs.readdirSync(dirPath);

	for (const file of files) {
		const filePath = path.join(dirPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
		} else {
			arrayOfFiles.push(filePath);
		}
	}

	return arrayOfFiles;
}

/**
 * Analyze bundle and generate report
 */
function analyzeBundleSize() {
	if (!fs.existsSync(distPath)) {
		console.error("Error: dist folder not found. Run 'pnpm build' first.");
		process.exit(1);
	}

	const files = getAllFiles(distPath);

	const jsFiles = files.filter((f) => f.endsWith(".js"));
	const cssFiles = files.filter((f) => f.endsWith(".css"));
	const assetFiles = files.filter(
		(f) => !f.endsWith(".js") && !f.endsWith(".css") && !f.endsWith(".html"),
	);

	const totalJS = jsFiles.reduce((sum, f) => sum + getFileSize(f), 0);
	const totalCSS = cssFiles.reduce((sum, f) => sum + getFileSize(f), 0);
	const totalAssets = assetFiles.reduce((sum, f) => sum + getFileSize(f), 0);
	const totalSize = totalJS + totalCSS + totalAssets;

	const report = {
		timestamp: new Date().toISOString(),
		total: {
			bytes: totalSize,
			formatted: formatBytes(totalSize),
		},
		breakdown: {
			javascript: {
				bytes: totalJS,
				formatted: formatBytes(totalJS),
				files: jsFiles.length,
			},
			css: {
				bytes: totalCSS,
				formatted: formatBytes(totalCSS),
				files: cssFiles.length,
			},
			assets: {
				bytes: totalAssets,
				formatted: formatBytes(totalAssets),
				files: assetFiles.length,
			},
		},
		largestFiles: files
			.map((f) => ({
				path: path.relative(distPath, f),
				size: getFileSize(f),
				formatted: formatBytes(getFileSize(f)),
			}))
			.sort((a, b) => b.size - a.size)
			.slice(0, 10),
	};

	// Write report to file
	fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

	// Print summary to console
	console.log("\n📦 Bundle Size Report");
	console.log("═".repeat(50));
	console.log(`Total Size: ${report.total.formatted}`);
	console.log(`JavaScript: ${report.breakdown.javascript.formatted} (${report.breakdown.javascript.files} files)`);
	console.log(`CSS: ${report.breakdown.css.formatted} (${report.breakdown.css.files} files)`);
	console.log(`Assets: ${report.breakdown.assets.formatted} (${report.breakdown.assets.files} files)`);
	console.log("\n📊 Largest Files:");

	for (const file of report.largestFiles.slice(0, 5)) {
		console.log(`  ${file.formatted.padStart(10)} - ${file.path}`);
	}

	console.log("\n✅ Full report saved to: bundle-size.json\n");

	return report;
}

// Run the analysis
try {
	analyzeBundleSize();
} catch (error) {
	console.error("Error analyzing bundle:", error);
	process.exit(1);
}
