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
    $.widget("jui.jdatepicker", $.jui.jtextbox, {
        options: {
            inputType: 'text',
            dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: 'c-100:c+50'
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this._super();

            this.element.addClass('jdatepicker');

            this.$inputWrapper.addClass('input-group');

            this.$icon = $('<div class="input-group-addon"><i class="fa fa-calendar" /></div>').appendTo(this.$inputWrapper);
            opts.onSelect = function () {
                that.onValueChanged();
            };
            opts.onClose = function () {
                try {
                    var _date = $.datepicker.parseDate(opts.dateFormat, that.$input.val());
                    that.$input.val($.datepicker.formatDate(opts.dateFormat, _date));
                } catch (ex) {
                    that.$input.val($.datepicker.formatDate(opts.dateFormat, that.$input.datepicker("getDate")));
                }

                that._trigger('closed', null, null);
            }
            this.$input.datepicker(opts);

            this._on(this.$icon, {
                'click': function (e) {
                    e && e.preventDefault ? e.preventDefault() : e.returnValue = !1
                    this.$input.attr('disabled', 'disabled');
                    this.$input.datepicker("show");
                    this.$input.removeAttr('disabled')
                }
            })

        },
        getValue: function () {
            return this.$input.val();
        },
        _setValue: function (value) {
            this.$input.datepicker("setDate", value);
        },
        openPicker: function () {
            this.$input.datepicker('show')
        }
    });
}));