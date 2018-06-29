(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "text",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.templateMixin = {
        options: {
            template: null,
            templateUrl: null
        },
        _getTemplate: function (callback) {
            var that = this, opts = this.options;

            this._fetchTemplate().done(function (tpl) {
                that.template = tpl;
                if (opts.templateProcessor) {
                    that.template = opts.templateProcessor.call(that, tpl);
                }
                callback.call(that);
            });
        },
        _fetchTemplate: function (callback) {
            var that = this, opts = this.options;

            return $.Deferred(function ($dfd) {
                if (opts.templateUrl) {
                    require(['text!/' + opts.templateUrl], function (tpl) {
                        $dfd.resolve(tpl);
                    });
                }
                else if (opts.template) {
                    $dfd.resolve(opts.template);
                }
                else {
                    if (!that.elemTmpl) {
                        var scriptElem = that._find('script');
                        if (scriptElem.length) {
                            that.elemTmpl = scriptElem.html();
                        }
                    }
                    $dfd.resolve(that.elemTmpl);
                }
            });
        }
    }
}));