(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jinput",
            "../lists/jlistCommands"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jformCommands", $.jui.jinput, {
        options: {
            isInput: false,
            commands: {}
        },
        _inputRender: function () {
            var that = this, opts = this.options;
            this.$inputWrapper.jlistCommands(opts.commands);
        }
    });
}));