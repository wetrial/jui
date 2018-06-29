(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jinput",
            "../mixins/compositMixin"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinputgroup", $.jui.jinput, $.extend(true, {}, $.jui.compositMixin, {
        options: {
            transmitData: true,
            flatData: false,
            isGroup: true
        },
        _beforeCreate: function () {
            this.options.label = null;
        },
        _inputRender: function () {
            this._renderChildren();
        },
        _getValue: function () {
            if (this.components && this.components.length) {
                var data = {};
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];
                    var $component = this["$" + component.name];

                    if (!$component) {
                        continue;
                    }

                    if (!$component.options.isInput) {
                        continue;
                    }

                    if ($component.options.flatData) {
                        $.extend(data, $component.getValue());
                    }
                    else {
                        data[component.name] = $component.getValue();
                    }
                }

                return data;
            }
        },
        _setValue: function (data, isInit) {
            var that = this, opts = this.options;

            if (that.components && that.components.length) {
                for (var i = 0; i < that.components.length; i++) {
                    var component = that.components[i];

                    var $component = that["$" + component.name];

                    if (!$component) {
                        continue;
                    }

                    if (!$component.options.isInput) {
                        continue;
                    }

                    var componentOpts = $component.options;
                    if (data.hasOwnProperty(componentOpts.name)) {
                        if (componentOpts.flatData) {
                            $component.setValue(data, isInit);
                        }
                        else {
                            $component.setValue(data[componentOpts.name], isInit);
                        }
                    }
                }
            }
        },
        validate: function () {
            var invalid = this.invalid = [];

            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];

                var $component = this["$" + component.name];
                if (!$component) {
                    continue;
                }
                if (!$component.options.isInput) {
                    continue;
                }
                if ($component.isHidden()) {
                    continue;
                }
                if (!$component.validate()) {
                    invalid.push($component);
                }
            }

            if (invalid.length > 0) {
                invalid[0].focus();
            }

            return invalid.length == 0;
        },
        getChild: function (childName) {
            return this["$" + childName];
        },
        getInvalids: function () {
            return this.invalid;
        },
        getChanged: function (createMode) {
            var data = [];
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($component.isHidden()) {
                    continue;
                }

                if (!$component.options.isInput) {
                    continue;
                }

                var changed = $component.getChanged(createMode);
                if (changed) {
                    data.push(changed);
                }
            }

            return data;
        },
        disable:function(){
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($.isFunction($component.disable)) {
                    $component.disable();
                }
            }
        },
        enable:function(){
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($.isFunction($component.enable)) {
                    $component.enable();
                }
            }
        }
    }));
}));