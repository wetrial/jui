(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../utils",
            "../lists/jlist",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcheckboxlist", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value"
            },
            sourceList: {
                styleClasses: { itemContainer: 'list-inline tight' },
                selectable: {
                    multiple: true,
                    onlyleaf: false,
                    cascade: true
                },
                tree: {
                    indent: 20,
                    fields: {
                        children: 'children',
                        parentKey: 'pid'
                    },
                    valueIncludePart: true
                },
                method: 'GET',
                templates: {
                    layout: '<ul class="jlist-items list tight"></ul>',
                    tree: {
                        children: '<ul class="list tight"></ul>'
                    }
                }
            }
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jcheckboxlist');

            var itemTmpl = opts.sourceList.templates.item ||
                '<li><input type="checkbox" value="{{value}}"> <label>{{text}}</label></li>';

            if (opts.sourceList.type == 'tree') {
                opts.sourceList.styleClasses = { itemContainer: 'tight' }
            }

            opts.sourceList = $.extend(true, {}, opts.sourceList, {
                fields: {
                    key: opts.fields.value
                },
                templates: {
                    item: itemTmpl
                },
                selectable: {
                    cascadeCancelParent: false
                },
                itemConverter: function (item) {
                    return that._itemConverter(item);
                },
                itemSelected: function (e, eventData) {
                    that._renderSelected(eventData.itemData);
                },
                itemDeselected: function (e, edata) {
                    edata.itemElem.find("input").prop("checked", false);
                },
                selectionChanged: function () {
                    that.onValueChanged();
                }
            });

            this.cascade = opts.sourceList.selectable.cascade;

            this.$inputWrapper.jlist(this.options.sourceList);

            this.sourceList = this.$inputWrapper.jlist('instance');
        },
        refresh: function (param) {
            this.$inputWrapper.jlist("bind", param);
        },
        _renderSelected: function (itemDatas) {
            var that = this;
            var opts = this.options;

            if (itemDatas === undefined || itemDatas == null || itemDatas == '') {
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

                that.$inputWrapper.find('input[value="' + itemData.value + '"]').prop("checked", true);
            }
        },
        _deselect: function (itemData) {
            var that = this;
            var opts = this.options;
            if (this.options.multiple) {
                this.$multipleDisplay.jlist("remove", itemData);
            }
        },
        getSelected: function () {
            var withPart = this.sourceList.options.type == 'tree' && this.sourceList.options.tree.valueIncludePart == true;
            return this.sourceList.getSelected(withPart);
        },
        getValue: function () {
            var that = this;
            var opts = this.options;

            var selected = this.getSelected();

            var vals = $.map(selected, function (item, index) {
                return item[opts.fields.value];
            })

            return vals;
        },
        getValueText: function () {
            var that = this;
            var opts = this.options;

            var selected = this.getSelected();

            var texts = $.map(selected, function (item, index) {
                return item[opts.fields.text];
            })

            return texts.toString();
        },
        _setValue: function (value, isInit) {
            var that = this;

            if (!value) {
                this.$inputWrapper.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            if (isInit) {
                this.$inputWrapper.jlist("option", "selectable.cascade", false);
            }

            this.$inputWrapper.jlist("select", value, {
                notFireEvent: isInit,
                callback: function () {
                    if (!isInit) {
                        return;
                    }
                    else {
                        that.$inputWrapper.jlist("option", "selectable.cascade", that.cascade);
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