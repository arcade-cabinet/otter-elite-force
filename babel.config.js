module.exports = (api) => {
	// Use env-keyed caching so cache invalidates when NODE_ENV changes
	api.cache.using(() => process.env.NODE_ENV);
	const isTest = process.env.NODE_ENV === "test";
	return {
		presets: ["babel-preset-expo"],
		// nativewind/babel returns a preset-format object { plugins: [...] }
		// which fails Babel's plugin validation during Jest runs.
		// Skip it in test environment since CSS transforms aren't needed for unit tests.
		plugins: isTest ? [] : ["nativewind/babel"],
	};
};
