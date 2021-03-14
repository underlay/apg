export default {
	testEnvironment: "node",
	transformIgnorePatterns: [
		"node_modules/(?!(@underlay/namespaces|@underlay/apg)/)",
	],
	transform: {
		"node_modules/@underlay/namespaces/*\\.js$": [
			"babel-jest",
			{
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		],
		"node_modules/@underlay/apg/*\\.js$": [
			"babel-jest",
			{
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		],
		"\\.(j|t)s$": [
			"babel-jest",
			{
				presets: ["@babel/preset-typescript"],
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		],
	},
}
