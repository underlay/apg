export default {
	testEnvironment: "node",
	transformIgnorePatterns: ["node_modules/(?!(@underlay/namespaces)/)"],
	transform: {
		"node_modules/@underlay/namespaces/*\\.js$": [
			"babel-jest",
			{
				plugins: ["@babel/plugin-proposal-export-namespace-from"],
			},
		],
		"\\.(j|t)s$": [
			"babel-jest",
			{
				presets: ["@babel/preset-typescript"],
				plugins: [
					"@babel/plugin-proposal-export-namespace-from",
					"@babel/plugin-transform-modules-commonjs",
				],
			},
		],
	},
}
