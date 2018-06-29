(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jtextbox"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jnumberbox", $.jui.jtextbox, {
        options: {
            min: null,
            max: null,
            precision: 0,
            decimalSeparator: '.',
            groupSeparator: '',
            prefix: '',
            suffix: ''
        },
        _inputRender: function () {
            var that = this;
            var rules = [];
            
            this.element.addClass('jnumberbox');

            if (this.options.precision == 0) {
                rules.push({
                    type: 'regex',
                    param: {
                        pattern: '^(\\-|\\+)?(0|[1-9][0-9]*)$'
                    },
                    message: '请输入整数'
                });
            }
            if (this.options.precision > 0) {
                rules.push({
                    type: 'regex',
                    param: {
                        pattern: '^(\\-|\\+)?(0|[1-9][0-9]*)(\\.\\d{' + this.options.precision + '})$'
                    },
                    message: '请输入 ' + this.options.precision + ' 位小数'
                });
            }
            if (this.options.min) {
                rules.push({
                    type: 'min',
                    param: this.options.min
                });
            }
            if (this.options.max) {
                rules.push({
                    type: 'max',
                    param: this.options.max
                });
            }

            this.options = $.extend(true, {}, this.options, { rules: rules });

            this._super();

            this.$input.on('blur', function(){
                that._trigger("blur", null, { inst: that });
            });
        },
        getValue: function () {
            var value = this.$input.val();
            value = parseFloat(value).toFixed(this.options.precision);
            if (isNaN(value)) {
                value = null;
            }
            return value;
        }
    });
}));