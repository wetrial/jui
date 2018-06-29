(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../jcomponent",
            "../mixins/dataMixin",
            "../layers/jlayer",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinput", $.jui.jcomponent, $.extend(true, {}, $.jui.dataMixin, {
        options: {
            isInput: true,
            hasValue: true,
            label: false,
            labelAlign: 'right',
            labelClass: null,
            wrapperClass: null,
            required: false,
            requiredMessage: "必填",
            viewMode: true,
            asyncSetInitValue: false,
            invalidTipAlign: 'top right',
            ruleTypes: {
                number: {
                    validator: function (value) {
                        return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
                    },
                    message: "请输入有效的数字"
                },
                digits: {
                    validator: function (value) {
                        return /^\d+$/.test(value);
                    },
                    message: "只能输入数字"
                },
                regex: {
                    validator: function (value, param) {
                        return new RegExp(param.pattern, param.attributes).test(value);
                    }
                },
                email: {
                    validator: function (value) {
                        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
                    },
                    message: "请输入有效的 Email 地址"
                },
                url: {
                    validator: function (value) {
                        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
                    },
                    message: "请输入有效的 URL"
                },
                min: {
                    validator: function (value, param) {
                        value = Number(value);
                        return value >= param;
                    },
                    message: '输入值不能小于 {0}'
                },
                max: {
                    validator: function (value, param) {
                        value = Number(value);
                        return value <= param;
                    },
                    message: '输入值不能大于 {0}'
                },
                range: {
                    validator: function (value, params) {
                        value = Number(value);
                        return value >= params[0] && value <= params[1];
                    },
                    message: "输入值必须介于 {0} 和 {1} 之间"
                },
                minlength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return length >= param;
                    },
                    message: '不能少于 {0} 个字'
                },
                maxlength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return length <= param;
                    },
                    message: '不能多于 {0} 个字'
                },
                rangelength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return param[0] <= length && length <= param[1];
                    },
                    message: '输入字数在 {0} 个到 {1} 个之间'
                },
                remote: {
                    validator: function (value, params) {
                        var data = {};
                        data[params[1]] = value;
                        var response = $.ajax({ url: params[0], dataType: "json", data: data, async: false, cache: false, type: "post" }).responseText;
                        return response == "true";
                    }, message: "Please fix this field"
                },
                date: {
                    validator: function (value, params) {
                        var dateFormat = this.options.dateFormat;
                        if (params && params.length > 0) {
                            dateFormat = params[0];
                        }
                        var u = !1;
                        try {
                            $.datepicker.parseDate(dateFormat, value);
                            u = !0
                        } catch (f) {
                            u = !1
                        }
                        return u
                    },
                    message: "请输入有效的日期格式."
                },
                identifier: {
                    validator: function (value, params) {
                        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value);
                    },
                    message: '只能输入字母、数字、下划线且必须以字母开头'
                },
                phoneNumber: {
                    validator: function (value, params) {
                        return /^1[3|4|5|7|8][0-9]{9}$/.test(value);
                    },
                    message: '请输入正确的手机号'
                }
            },
            rules: []
        },
        _render: function () {
            var that = this, opts = this.options;

            if (!opts.labelAlign) {
                opts.labelAlign = 'right';
            }
            if (!opts.labelClass) {
                opts.labelClass = 'col-sm-2';
            }
            if (!opts.wrapperClass) {
                opts.wrapperClass = 'col-sm-10';
            }

            this.element.addClass('jinput');

            that._getData(function () {

                that.__beforeRender();

                if (!opts.isGroup) {
                    this.$children = this.element.children().remove();
                }

                if (opts.showLabel == true || (!!opts.label && opts.showLabel != false)) {

                    this.element.addClass('form-group').addClass('label-' + opts.labelAlign);
                    this.$controlLabel = $('<label class="control-label"></label>').html(opts.label).appendTo(this.element);
                    this.$controlWrapper = $('<div class="control-wrapper"></div>').appendTo(this.element);
                    this.$inputWrapper = $('<div class="input-wrapper"></div>').appendTo(this.$controlWrapper);

                    if (opts.required) {
                        var fn = opts.labelAlign == 'right' ? 'prepend' : 'append';
                        this.$controlLabel[fn]('<span class="required" aria-required="true"> * </span>');
                    }

                    if (opts.labelAlign != 'top') {
                        if (opts.labelClass) {
                            this.$controlLabel.addClass(opts.labelClass);
                        }

                        if (opts.wrapperClass) {
                            this.$controlWrapper.addClass(opts.wrapperClass);
                        }
                    }
                }
                else {
                    if (!opts.isGroup) {
                        this.$inputWrapper = $('<div class="input-wrapper"></div>').appendTo(this.element);
                    }
                }

                if (!opts.isGroup) {
                    if (this.$children && this.$children.length > 0) {
                        this.$children.appendTo(this.$inputWrapper);
                    }
                }

                if (opts.inputWrapperStyleClass != null) {
                    that.$inputWrapper.addClass(opts.inputWrapperStyleClass);
                }

                if (opts.inputWrapperStyle != null) {
                    that.$inputWrapper.css(opts.inputWrapperStyle);
                }

                $.isFunction(that._inputRender) && that._inputRender();

                if (!opts.asyncSetInitValue) {
                    if (!opts.transmitData) {
                        this.setValue(this.data, true);
                    }
                }

                this.validateTriggered = false;
                this.errorMessage = "";

                this._on(this.widget(), {
                    focusin: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.show();
                        }
                    },
                    focusout: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.hide();
                        }
                    },
                    mouseenter: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.show();
                        }
                    },
                    mouseleave: function (event) {
                        if (that.invalidTip) {
                            if (event.target !== that.document[0].activeElement && !$.contains(event.target, that.document[0].activeElement)) {
                                that.invalidTip.hide();
                            }
                        }
                    }
                });

                that.__afterRender();
            });
        },
        _getValue: $.noop,
        _setValue: $.noop,
        _parseValue: $.noop,
        getValue: function () {
            return this._getValue();
        },
        setValue: function (data, isInit) {
            if (!(data === undefined || ($.isPlainObject(data) && $.isEmptyObject(data)))) {
                this._setValue(data, isInit);
            }

            if (isInit) {
                this.initValue = this.getValue();
                if (this.getValueText) {
                    this.initValueText = this.getValueText();
                }
                else {
                    this.initValueText = null;
                }
                this.currentValue = this.initValue;
            }
        },
        focus: function () {
            this.widget().focus();
        },
        validate: function () {
            if(this.isDisabled() == true){
                return true;
            }

            this.validateTriggered = true;
            var valid = this._validate();
            valid ? this.element.removeClass("jinput-invalid") : this.element.addClass("jinput-invalid");

            if (!valid) {
                if (!this.invalidTip) {
                    this.invalidTip = $.jui.tip.warning({
                        message: this.errorMessage,
                        appendTo: this.element,
                        follow: this.$inputWrapper,
                        align: this.options.invalidTipAlign,
                        attachElem: this.element,
                        autoShow: false,
                        showClose: false,
                        style: { margin: 0 },
                        styleClass: 'val-tip'
                    });
                }
                else {
                    this.invalidTip.message(this.errorMessage);
                }

                if (this.element.is(":hover") || this.$inputWrapper.is(':focus')) {
                    this.invalidTip.show();
                }
            }
            else {
                if (this.invalidTip) {
                    this.invalidTip.close();
                    this.invalidTip = null;
                }
            }

            return valid;
        },
        getInvalids: function () {
            return this.invalid;
        },
        _validate: function () {
            var options = this.options;
            this.setMessage("");
            var value = this._getRawValue ? this._getRawValue() : this.getValue();
            var hasValue = value != undefined && value != null && value != '';

            if (options.required) {
                if (value === undefined || value === null || value === "" || ($.isArray(value) && value.length < 1)) {
                    this.setMessage(options.requiredMessage);
                    return false;
                }
            }

            if (hasValue) {
                if (options.rules && $.isArray(options.rules)) {
                    for (var i = 0; i < options.rules.length; i++) {
                        if (!this._checkRule(options.rules[i], value)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        _checkRule: function (ruleSettings, value) {
            var that = this, options = this.options;
            var rule = null;
            if (ruleSettings.type) {
                rule = options.ruleTypes[ruleSettings.type];
            }
            else if (ruleSettings.validator) {
                rule = ruleSettings;
            }

            if (rule) {
                var param = ruleSettings.param || null;
                if (!rule["validator"].call(that, value, param)) {
                    var message = ruleSettings.message || rule["message"];
                    if (param) {
                        if (!$.isArray(param)) {
                            param = [param];
                        }
                        for (var i = 0; i < param.length; i++) {
                            message = message.replace(new RegExp("\\{" + i + "\\}", "g"), param[i]);
                        }
                    }
                    this.setMessage(options.invalidMessage || message);
                    return false;
                }
            }
            return true;
        },
        setMessage: function (msg) {
            this.errorMessage = msg;
        },
        onValueChanged: function () {
            var oldValue = this.currentValue;
            this.currentValue = this.getValue();
            this._trigger("valueChanged", null, { oldValue: oldValue, newValue: this.currentValue, inst: this });
            if (this.parent && this.parent.onValueChanged) {
                this.parent.onValueChanged();
            }
            if (this.validateTriggered) {
                this.validate();
            }
        },
        getChanged: function (createMode) {
            if (this.options.trackChange != undefined && this.options.trackChange == false) {
                return false;
            }

            var value = this.getValue();
            var changed = {
                widget: this.widgetName,
                name: this.name,
                label: this.options.label,
                field: this.name,
                fieldName: this.options.label,
                newValue: value
            };
            if (this.getValueText) {
                changed.newValueText = this.getValueText();
            }
            if (createMode) {
                if (value) {
                    changed.oldValue = null;
                    changed.oldValueText = null;
                    return changed;
                }
                else {
                    return false;
                }
            }
            else {
                if (!$.jui.utils.jsonEqual(value, this.initValue)) {
                    changed.oldValue = this.initValue;
                    changed.oldValueText = this.initValueText;
                    return changed;
                }
                else {
                    return false;
                }
            }
        }
    }));
}));