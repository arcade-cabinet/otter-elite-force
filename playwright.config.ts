import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for OTTER: ELITE FORCE
 *
 * Tests across multiple device viewports to ensure responsive design:
 * - Latest & older iPhones
 * - Android phones (Pixel 8a)
 * - Foldable (OnePlus Open)
 * - Tablets (iPad, Pixel Tablet)
 * - Desktop browsers
 *
 * Both portrait and landscape orientations tested.
 */

const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";
const isCI = !!process.env.CI;

/**
 * Custom device configurations for comprehensive mobile testing
 */
const customDevices = {
	// Latest flagship iPhone (2024)
	"iPhone 15 Pro": {
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		viewport: { width: 393, height: 852 },
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},
	"iPhone 15 Pro Landscape": {
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		viewport: { width: 852, height: 393 },
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},

	// Budget iPhone (older model)
	"iPhone SE (3rd gen)": {
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
		viewport: { width: 375, height: 667 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	"iPhone SE Landscape": {
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
		viewport: { width: 667, height: 375 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},

	// Google Pixel 8a (mid-range Android)
	"Pixel 8a": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
		viewport: { width: 412, height: 915 },
		deviceScaleFactor: 2.625,
		isMobile: true,
		hasTouch: true,
	},
	"Pixel 8a Landscape": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
		viewport: { width: 915, height: 412 },
		deviceScaleFactor: 2.625,
		isMobile: true,
		hasTouch: true,
	},

	// OnePlus Open (foldable) - Folded (cover screen)
	"OnePlus Open Folded": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; OnePlus Open) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
		viewport: { width: 387, height: 812 },
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},
	"OnePlus Open Folded Landscape": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; OnePlus Open) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
		viewport: { width: 812, height: 387 },
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},

	// OnePlus Open - Unfolded (tablet mode)
	"OnePlus Open Unfolded": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; OnePlus Open) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		viewport: { width: 1080, height: 2268 },
		deviceScaleFactor: 2.5,
		isMobile: true,
		hasTouch: true,
	},
	"OnePlus Open Unfolded Landscape": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; OnePlus Open) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		viewport: { width: 2268, height: 1080 },
		deviceScaleFactor: 2.5,
		isMobile: true,
		hasTouch: true,
	},

	// Pixel Tablet (Android tablet)
	"Pixel Tablet": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		viewport: { width: 1600, height: 2560 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	"Pixel Tablet Landscape": {
		userAgent:
			"Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		viewport: { width: 2560, height: 1600 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
};

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	timeout: hasMcpSupport ? 60000 : 30000,
	reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

	use: {
		baseURL: "http://localhost:8081",
		trace: "on-first-retry",
		screenshot: "on",
		headless: !hasMcpSupport,
		video: hasMcpSupport ? "on-first-retry" : "off",
		actionTimeout: 10000,
		launchOptions: hasMcpSupport
			? {
					args: ["--enable-webgl", "--ignore-gpu-blocklist"],
				}
			: {
					args: [
						"--use-gl=swiftshader",
						"--enable-webgl",
						"--ignore-gpu-blocklist",
						"--disable-gpu-sandbox",
					],
				},
	},

	expect: {
		timeout: 10000,
		toHaveScreenshot: {
			maxDiffPixels: 100,
			animations: "disabled",
			caret: "hide",
		},
	},

	projects: [
		// ==========================================
		// DESKTOP BROWSERS
		// ==========================================
		{
			name: "Desktop Chrome",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1920, height: 1080 },
			},
		},

		// ==========================================
		// iOS DEVICES
		// ==========================================
		{
			name: "iPhone 15 Pro (Portrait)",
			use: customDevices["iPhone 15 Pro"],
		},
		{
			name: "iPhone 15 Pro (Landscape)",
			use: customDevices["iPhone 15 Pro Landscape"],
		},
		{
			name: "iPhone SE (Portrait)",
			use: customDevices["iPhone SE (3rd gen)"],
		},
		{
			name: "iPhone SE (Landscape)",
			use: customDevices["iPhone SE Landscape"],
		},

		// ==========================================
		// ANDROID PHONES
		// ==========================================
		{
			name: "Pixel 8a (Portrait)",
			use: customDevices["Pixel 8a"],
		},
		{
			name: "Pixel 8a (Landscape)",
			use: customDevices["Pixel 8a Landscape"],
		},

		// ==========================================
		// FOLDABLE DEVICES
		// ==========================================
		{
			name: "OnePlus Open Folded (Portrait)",
			use: customDevices["OnePlus Open Folded"],
		},
		{
			name: "OnePlus Open Folded (Landscape)",
			use: customDevices["OnePlus Open Folded Landscape"],
		},
		{
			name: "OnePlus Open Unfolded (Portrait)",
			use: customDevices["OnePlus Open Unfolded"],
		},
		{
			name: "OnePlus Open Unfolded (Landscape)",
			use: customDevices["OnePlus Open Unfolded Landscape"],
		},

		// ==========================================
		// TABLETS
		// ==========================================
		{
			name: "iPad Pro 12.9 (Portrait)",
			use: devices["iPad Pro 12.9"],
		},
		{
			name: "iPad Pro 12.9 (Landscape)",
			use: devices["iPad Pro 12.9 landscape"],
		},
		{
			name: "Pixel Tablet (Portrait)",
			use: customDevices["Pixel Tablet"],
		},
		{
			name: "Pixel Tablet (Landscape)",
			use: customDevices["Pixel Tablet Landscape"],
		},
	],

	webServer: {
		command: "pnpm web",
		url: "http://localhost:8081",
		reuseExistingServer: !isCI,
		stdout: "pipe",
		stderr: "pipe",
		timeout: 120_000,
	},
});
