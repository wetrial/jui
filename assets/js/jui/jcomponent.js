(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcomponent", {
        options: {
            renderIf: true,
            showIf: true,
            properties: null
        },

        _beforeCreate: $.noop,
        _beforeRender: $.noop,
        _afterRender: $.noop,
        _render: $.noop,
        _refresh: $.noop,

        _create: function () {
            var that = this, opts = this.options;

            if (opts.properties) {
                $.each(opts.properties, function (key, value) {
                    that[key] = value;
                });
            }

            this.__beforeCreate();

            this.showIf = opts.showIf;
            if ($.isFunction(opts.showIf)) {
                this.showIf = opts.showIf.call(that);
            }

            if (this.showIf == false) {
                this.element.hide();
            }

            this.renderIf = opts.showIf;
            if ($.isFunction(opts.renderIf)) {
                this.renderIf = opts.renderIf.call(that);
            }

            if (opts.renderIf) {
                this.__render();
            }
        },

        show: function () {
            this._show(this.widget());
        },

        hide: function () {
            this._hide(this.widget());
        },

        __render: function () {
            var that = this, opts = this.options;

            if (this.rendered == true) {
                return;
            }
            else {
                this.rendered = true;
            }

            if (opts.styleClass != null) {
                that.element.addClass(opts.styleClass);
            }

            if (opts.style != null) {
                that.element.css(opts.style);
            }

            this._render();

            if (this.options.disabled) {
                this.disable();
            }

            if (opts.events) {
                that._on(opts.events);
            }
        },

        refresh: function (options) {
            this.options = $.extend(true, this.options, options);

            if (!this.rendered) {
                this.__render();
            }
            else {
                this._refresh();
            }
        },

        _refresh: function () {
            this.element.html('');
            this.rendered = false;
            this.__render();
        },

        _findByIdOrName: function (idOrName) {
            var jq = this.widget().find("#" + idOrName);
            if (!jq.length) {
                jq = this.widget().findByName(idOrName);
            }

            return jq;
        },

        _find: function (selector) {
            return this.widget().find(selector)
        },

        _getCreateEventData: function () {
            return { inst: this }
        },

        __beforeCreate: function () {
            if ($.isFunction(this.options.beforeCreate)) {
                this.options.beforeCreate.call(this);
            }

            this._beforeCreate();
        },
        __beforeRender: function () {
            if ($.isFunction(this.options.beforeRender)) {
                this.options.beforeRender.call(this);
            }

            this._beforeRender();
        },
        __afterRender: function () {
            if ($.isFunction(this.options.afterRender)) {
                this.options.afterRender.call(this);
            }

            this._afterRender();
        },

        isHidden: function () {
            return this.widget().is(':hidden');
        },

        isDisabled: function(){
            return this.options.disabled;
        },

        on: function (event, callback) {
            var that = this;
            var eventPrefix = this.widgetEventPrefix.toLowerCase();
            event = event.toLowerCase();

            this.element.bind(eventPrefix + event, function (event, ui) {
                callback.call(that, event, ui);
            });
        }
    });
}));