import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for OTTER: ELITE FORCE
 *
 * Supports two modes:
 * 1. PLAYWRIGHT_MCP=true - Full Playwright MCP with headed browser and WebGL
 * 2. Default - Headless mode with WebGL workarounds for CI/limited environments
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Check if running with full Playwright MCP capabilities
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";
const isCI = !!process.env.CI;

export default defineConfig({
	testDir: "./e2e",
	// Run tests in files in parallel
	fullyParallel: true,
	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: isCI,
	// Retry on CI only (not needed with MCP)
	retries: hasMcpSupport ? 0 : isCI ? 2 : 0,
	// Parallel workers - more with MCP, fewer in CI
	workers: hasMcpSupport ? undefined : isCI ? 2 : undefined,
	// Longer timeout for WebGL rendering with MCP
	timeout: hasMcpSupport ? 60000 : 30000,
	// Reporter to use
	reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
	// Shared settings for all the projects below
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: "http://localhost:4173",
		// Collect trace when retrying the failed test
		trace: "on-first-retry",
		// Take screenshot on failure (always capture for visual analysis)
		screenshot: "on",
		// Headed mode when MCP is available
		headless: !hasMcpSupport,
		// Video recording with MCP for debugging
		video: hasMcpSupport ? "on-first-retry" : "off",
		// Increased action timeout for WebGL rendering
		actionTimeout: 10000,
	},
	// Expect options for visual regression
	expect: {
		// Timeout for expect() calls
		timeout: 10000,
		// Screenshot comparison settings
		toHaveScreenshot: {
			// Maximum number of pixels that can differ
			maxDiffPixels: 100,
			// Animation handling
			animations: "disabled",
			// CSS media features
			caret: "hide",
		},
	},
	// Configure projects - focus on Chromium for WebGL
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Different launch options based on environment
				launchOptions: hasMcpSupport
					? {
							// MCP mode - headed with full GPU
							args: ["--enable-webgl", "--ignore-gpu-blocklist"],
						}
					: {
							// Headless mode - software rendering
							args: [
								"--use-gl=swiftshader",
								"--enable-webgl",
								"--ignore-gpu-blocklist",
								"--disable-gpu-sandbox",
							],
						},
			},
		},
		// Mobile testing with touch controls
		{
			name: "mobile",
			use: {
				...devices["Pixel 5"],
				launchOptions: {
					args: [
						"--use-gl=swiftshader",
						"--enable-webgl",
						"--ignore-gpu-blocklist",
						"--disable-gpu-sandbox",
					],
				},
			},
		},
	],
	// Run your local dev server before starting the tests
	webServer: {
		command: "pnpm preview",
		url: "http://localhost:4173",
		reuseExistingServer: !isCI,
		timeout: 120000,
	},
});
