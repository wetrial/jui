({
	baseUrl: "../",
	paths: {
		jquery: "assets/js/jquery-1.11.3",
    jqueryui: "assets/js/jquery-ui"
	},
	preserveLicenseComments: false,
	optimize: "none",
	findNestedDependencies: true,
	skipModuleInsertion: true,
  exclude: ["assets/js/jquery", "assets/js/jqueryui", "assets/js/text"],
  include: ["assets/js/jui/juiall"],
	out: "dist/assets/js/jui/jui.js"
})
