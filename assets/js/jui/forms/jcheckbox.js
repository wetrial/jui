(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcheckbox", $.jui.jinput, {
        options: {
            labelFollow: false
        },
        _beforeCreate: function () {
            if (this.options.labelFollow) {
                this.options.showLabel = false;
            }
        },
        _inputRender: function () {
            this.element.addClass('jcheckbox');
            this.$label = $('<label></label>').appendTo(this.$inputWrapper);
            this.$input = $('<input type="checkbox" />').appendTo(this.$label);
            if (this.options.labelFollow) {
                this.$label.append(this.options.label);
            }
            if (this.options.disabled) {
                this.disable();
            }
        },
        getValue: function () {
            return this.$input.prop('checked');
        },
        _setValue: function (value) {
            this.$input.prop('checked', value);
        },
        disable: function () {
            this.$input.prop('disabled', true);
            this.options.disabled = true;
        },
        enable: function () {
            this.$input.prop('disabled', false);
            this.options.disabled = false;
        },
        focus: function () {
            this.$input.focus();
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                this.$input.prop('disabled', !!value);
            }
        }
    });
}));