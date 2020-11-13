module.exports = {
	testEnvironment: "node",
	transform: {
		"\\.(j|t)s$": [
			"babel-jest",
			{
				presets: ["@babel/preset-typescript"],
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		],
	},
}
