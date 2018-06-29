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
    $.widget("jui.jtextbox", $.jui.jinput, {
        options: {
            inputType: 'text',
            iconClass: null,
            iconAlign: 'left',
            placeHolder: null,
            button: null,
            suffix: null
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jtextbox');
            if (opts.iconClass) {
                this.$icon = $('<i></i>').addClass(opts.iconClass).appendTo(this.$inputWrapper);
                this.element.addClass('with-icon').addClass('icon-' + opts.iconAlign);
            }

            this.$input = $('<input class="form-control" />').appendTo(this.$inputWrapper);

            this.$input.attr('type', opts.inputType);

            if (opts.placeHolder) {
                this.$input.attr('placeholder', opts.placeHolder);
            }

            if (opts.inputType == 'password') {
                this.$input.attr('autocomplete', 'new-password');
            }
            else {
                this.$input.attr('autocomplete', 'off');
            }

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
                    that._trigger("blur", null, { inst: that });
                }
            });

            if (opts.button) {
                opts.button = $.extend({
                    type: 'button', align: 'after'
                }, opts.button);
                this.$inputWrapper.addClass('input-group');

                this.$button = $('<button class="btn"></button>')
                    .addClass(opts.button.styleClass)
                    .attr('type', opts.button.type)
                    .text(opts.button.text);
                var $inputGroupBtn = $('<span class="input-group-btn"></span>').append(this.$button);
                if (opts.button.align == 'before') {
                    $inputGroupBtn.prependTo(this.$inputWrapper);
                }
                else {
                    $inputGroupBtn.appendTo(this.$inputWrapper);
                }

                this._on(this.$button, {
                    click: function () {
                        opts.button.click.call(that);
                    }
                });
            }

            if (opts.suffix) {
                this.$inputWrapper.addClass('input-group');

                this.$suffix = $('<span class="input-group-addon"></span>')
                    .html(opts.suffix)
                    .appendTo(this.$inputWrapper)
            }
        },
        getValue: function () {
            var value = this.$input.val();
            return value;
        },
        _getRawValue: function () {
            return this.$input.val();
        },
        _setValue: function (value, isInit) {
            this.currentValue = this.$input.val();
            this.$input.val(value);

            if (!isInit) {
                if (value != this.currentValue) {
                    this.onValueChanged();
                }
            }
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