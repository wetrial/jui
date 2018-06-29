(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./utils",
            './jcomponent',
            './mixins/templateMixin',
            './mixins/dataMixin',
            './mixins/compositMixin'
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jtmpl", $.jui.jcomponent, $.extend(true, {}, $.jui.templateMixin, $.jui.compositMixin, $.jui.dataMixin, {
        options: {
            asHtml: true
        },
        _render: function () {
            this.refresh();
        },
        refresh: function (options) {
            var that = this;
            this.options = $.extend(true, this.options, options);
            var opts = this.options;

            that._getTemplate(function () {
                that.element.html('');
                that._getData(function () {

                    that.__beforeRender();

                    var content = that.template;
                    if (that.template && that.data) {
                        content = $.jui.tmpl(that.template, that.data);
                    }

                    if (opts.asHtml) {
                        that.element.html(content);
                    }
                    else {
                        that.element.text(content);
                    }

                    that._renderChildren();

                    that.__afterRender();
                });
            });
        }
    }));
}));