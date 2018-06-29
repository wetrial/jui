(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../utils",
            "../lists/jlist",
            "../forms/jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jradiolist", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value"
            },
            sourceList: {
                fields: {
                    key: 'value'
                }
            },
            mode: null
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jradiolist');

            var layoutTmpl = '<ul class="jlist-items"></ul>';
            var itemTmpl = '<li><label><input type="radio" value="{{value}}"> {{text}}</label></li>';
            if (opts.mode == 'button') {
                layoutTmpl = '<div class="btn-group jlist-items" role="group">';
                itemTmpl = '<button class="btn">{{text}}</button>'
            }
            opts.sourceList = $.extend(true, {
                styleClasses: { itemContainer: 'list-inline tight' },
                fields: {
                    key: opts.fields.value
                },
                templates: {
                    layout: layoutTmpl,
                    item: itemTmpl
                }
            }, opts.sourceList, {
                    itemConverter: function (item) {
                        return that._itemConverter(item);
                    },
                    itemSelected: function (e, eventData) {
                        that._renderSelected(eventData.itemData);
                    },
                    selectionChanged: function () {
                        that.onValueChanged();
                    }
                });

            this.$inputWrapper.jlist(this.options.sourceList);
        },
        refresh: function (param) {
            this.$inputWrapper.jlist("bind", param);
        },
        _renderSelected: function (itemDatas) {
            var that = this, opts = this.options;

            if (!itemDatas) {
                this.$inputWrapper.find("input").prop("checked", false);

                return;
            }

            if ($.isArray(itemDatas)) {
                $.each(itemDatas, function (index, value) {
                    render(value);
                });
            }
            else {
                render(itemDatas);
            }

            function render(itemData) {
                itemData = that._itemConverter(itemData);

                that.$inputWrapper.find("input").val([itemData.value]);
            }
        },
        getSelected: function () {
            return this.$inputWrapper.jlist("getSelected");
        },
        getValue: function () {
            var that = this, opts = this.options;

            var selected = this.getSelected();
            if (selected.length) {
                return selected[0][opts.fields.value];
            }
            else {
                return null;
            }
        },
        getValueText: function () {
            var that = this, opts = this.options;

            var selected = this.getSelected();
            if (selected.length) {
                return selected[0][opts.fields.text];
            }
            else {
                return null;
            }
        },
        _setValue: function (value, isInit) {
            var that = this;

            if (!value) {
                this.$inputWrapper.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            this.$inputWrapper.jlist("select", value, {
                notFireEvent: isInit,
                callback: function () {
                    if (!isInit) {
                        return;
                    }
                    if (!$.isPlainObject(value)) {
                        value = that.$inputWrapper.jlist("getSelected");
                    }
                    that._renderSelected(value);
                }
            });
        },
        _itemConverter: function (item) {
            var fields = this.options.fields;
            !('text' in item) && (item.text = item[fields.text]);
            !('value' in item) && (item.value = item[fields.value]);
            return item;
        },
        disable: function () {
            this.$inputWrapper.jlist('disable');
            this.$inputWrapper.find("input").prop('disabled', true);
            this.options.disabled = true;
        },
        enable: function () {
            this.$inputWrapper.jlist('enable');
            this.$inputWrapper.find("input").prop('disabled', false);
            this.options.disabled = false;
        }
    });
}));