({
	baseUrl: "../",
	paths: {
		jquery: "jquery-1.11.3",
		jqueryui: "jquery-ui"
	},
	preserveLicenseComments: false,
	optimize: "none",
	findNestedDependencies: true,
	skipModuleInsertion: true,
	exclude: ["jquery", "jqueryui", "text"],
	include: ["jui/juiall"],
	out: "jui.js"
})