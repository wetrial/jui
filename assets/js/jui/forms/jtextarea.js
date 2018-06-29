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
    $.widget("jui.jtextarea", $.jui.jinput, {
        options: {
            placeHolder: null,
            rows: 3
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jtextarea');

            this.$input = $('<textarea class="form-control"></textarea>').appendTo(this.$inputWrapper);

            if (opts.placeHolder) {
                this.$input.attr('placeholder', opts.placeHolder);
            }
            if (opts.rows) {
                this.$input.attr('rows', opts.rows);
            }

            this.$input.attr('autocomplete', 'off');

            if (opts.disabled) {
                this.disable();
            }

            this._on(this.$input, {
                'focus': function () {
                    that.validating = true;
                    that.value = that._getRawValue();
                    (function () {
                        if (that.validating) {
                            if (that.value != that._getRawValue()) {	// when box value changed, validate it
                                that.value = that._getRawValue();
                                that.onValueChanged();
                            }
                            setTimeout(arguments.callee, 200);
                        }
                    })();
                },
                'blur': function () {
                    that.validating = false;
                }
            });
        },
        getValue: function () {
            var value = this.$input.val();
            return value;
        },
        _getRawValue: function () {
            return this.$input.val();
        },
        _setValue: function (value) {
            this.$input.val(value);
        },
        focus: function () {
            this.$input.focus();
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                this.$input.prop("disabled", !!value);
            }

            this._super(key, value);
        }
    });
}));