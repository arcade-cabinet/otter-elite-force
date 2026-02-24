import type { Config } from "jest";

/**
 * Jest Configuration for OTTER: ELITE FORCE
 *
 * Uses jest-expo/web preset which handles:
 * - React Native module resolution (Flow syntax via babel-jest)
 * - Babel transforms (TypeScript, JSX, React Native + Expo)
 * - Native module auto-mocking
 */
const config: Config = {
	preset: "jest-expo/web",
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
	testMatch: [
		"<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
		"<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
	],
	testPathIgnorePatterns: ["/node_modules/", "/dist/", "/e2e/"],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/test/**",
		"!src/**/*.d.ts",
		"!src/**/*.{test,spec}.{ts,tsx}",
		"!src/**/__tests__/**",
	],
	coverageThreshold: {
		global: {
			lines: 55,
			functions: 60,
			branches: 44,
			statements: 54,
		},
	},
	coverageDirectory: "./coverage",
	// Transform reactylon, babylonjs, and other ESM packages via babel-jest
	transformIgnorePatterns: [
		"/node_modules/(?!(.pnpm/|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|reactylon|@babylonjs|@strata-game-library|lodash-es|its-fine|suspend-react|yuka|tone|miniplex|@miniplex|nativewind|zustand|nipplejs|gsap))",
	],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.css$": "<rootDir>/src/test/__mocks__/fileMock.ts",
		// Stub out reactylon/web Engine to prevent Babylon.js engine initialization in tests
		"^reactylon/web$": "<rootDir>/src/test/__mocks__/reactylonWeb.ts",
		// Stub out reactylon main module to prevent SceneContext.Provider missing errors
		"^reactylon$": "<rootDir>/src/test/__mocks__/reactylon.ts",
		// Stub out @babylonjs/react-native to prevent react-native native module issues
		"^@babylonjs/react-native$": "<rootDir>/src/test/__mocks__/babylonsReactNative.ts",
		// Stub out @strata-game-library/audio-synth (ESM-only, no CJS export)
		"^@strata-game-library/audio-synth$": "<rootDir>/src/test/__mocks__/strataAudioSynth.ts",
	},
};

export default config;
