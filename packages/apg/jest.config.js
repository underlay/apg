export default {
	testEnvironment: "node",
	transform: {
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
