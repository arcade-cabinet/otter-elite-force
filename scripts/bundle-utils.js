/**
 * Shared utility functions for bundle size analysis
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Format bytes to human readable format
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";
	if (!Number.isFinite(bytes) || bytes < 0) return "Invalid Size";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format bytes difference with sign
 * @param {number} bytes - The number of bytes (can be negative)
 * @returns {string} Formatted string with sign (e.g., "+1.5 MB" or "-500 KB")
 */
export function formatDiff(bytes) {
	const sign = bytes >= 0 ? "+" : "";
	return `${sign}${formatBytes(Math.abs(bytes))}`;
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} File size in bytes
 */
export function getFileSize(filePath) {
	const stats = fs.statSync(filePath);
	return stats.size;
}

/**
 * Recursively get all files in directory
 * @param {string} dirPath - Directory path
 * @param {string[]} arrayOfFiles - Accumulator for recursive calls
 * @returns {string[]} Array of file paths
 */
export function getAllFiles(dirPath, arrayOfFiles = []) {
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
