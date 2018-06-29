(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.compositMixin = {
        options: {
            components: [],
            transmitOptions: null
        },
        _getComponents: function () {
            if ($.isFunction(this.options.components)) {
                this.components = this.options.components.call(this);
            }
            else {
                this.components = this.options.components;
            }
            if (!this.components) {
                this.compoents = [];
            }
        },
        _renderChildren: function () {
            var that = this, opts = this.options;

            this._getComponents();

            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];

                    /*var renderIf = component.renderIf;
                    if (renderIf && $.isFunction(component.renderIf)) {
                        renderIf = component.renderIf.call(this);
                    }
                    if (renderIf == false) {
                        continue;
                    }*/

                    var componentElem = this._findByIdOrName(component.name);
                    if (componentElem.length) {
                        /*if (!component.widget) {
                            component.widget = 'jcomponent';
                        }*/
                        if (component.widget) {
                            if (opts.transmitOptions) {
                                component = $.extend(true, {}, opts.transmitOptions, component);
                            }
                            var data = null;
                            if (opts.transmitData) {
                                if (that.data && !$.isEmptyObject(that.data)) {
                                    if (component.flatData) {
                                        data = this.data;
                                    }
                                    else {
                                        if (this.data.hasOwnProperty(component.name)) {
                                            data = this.data[component.name];
                                        }
                                    }
                                    //if (data) {
                                        //component = $.extend(true, {}, component, { data: data });
                                    //}

                                    if(component.data === undefined){
                                        component.data = data;
                                    }
                                }
                            }

                            component = $.extend(true, {}, component, { properties: { name: component.name, parent: that } });

                            var widget;
                            if (component.widget.indexOf('.') > 0) {
                                var widgetArr = component.widget.split('.');
                                widget = $[widgetArr[0]][widgetArr[1]];
                            } else {
                                widget = $.jui[component.widget];
                            }

                            if (widget) {
                                this["$" + component.name] = widget(component, componentElem);
                            }
                        }
                        else {
                            that["_$" + component.name] = componentElem;
                        }
                    }
                }
            }
        },
        findChild: function (childName) {
            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];
                    if (component.name == childName) {
                        var $component = this["$" + childName];
                        return $component;
                    }
                }
            }

            return null;
        }
    }
}));