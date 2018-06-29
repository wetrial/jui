(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jinput",
            "./jinputgroup",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinputrepeat", $.jui.jinput, {
        options: {
            itemComponents: [],
            getDataMode: "getChanges",
            layoutMode: 'table',
            keyField: 'Id'
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.removeItemData = [];
            var layout = (opts.templates && opts.templates.layout) || '';
            var item = (opts.templates && opts.templates.item) || '';
            var edit = (opts.templates && opts.templates.edit) || '';

            if (opts.layoutMode == 'table') {
                layout = '<table class="jlist-table table table-bordered"><thead><tr>';
                item = '<tr>';

                for (var i = 0; i < opts.itemComponents.length; i++) {
                    var component = opts.itemComponents[i];
                    layout += '<td>' + component.label + '</td>';

                    item += $.jui.utils.format('<td><div name="{0}"></div></td>', component.name);

                    component.showLabel = false;
                }

                layout += '<td></td>';

                item += '<td><button class="btn btn-xs" data-command="remove"><i class="fa fa-close"></i></button></td>';

                layout += '</tr></thead><tbody class="jlist-items"></tbody></table>';

                item += '</tr>';

                layout += '<button class="btn" type="button" data-role="AddBtn">添加</button>';

                edit = item;
            }
            else if (opts.layoutMode == 'flow') {
                layout = '<div class="jlist-items"></div><div><button class="btn" type="button" data-role="AddBtn">添加</button></div>';

                item = '<div class="m-y-md b-b">';
                for (var i = 0; i < opts.itemComponents.length; i++) {
                    var component = opts.itemComponents[i];

                    item += $.jui.utils.format('<div name="{0}"></div>', component.name);
                }
                item += '</div>';

                edit = item;
            }

            this.list = this.$inputWrapper.jlist({
                initEdit: true,
                templates: {
                    layout: layout,
                    item: item,
                    edit: edit
                },
                itemDataBound: function (e, edata) {
                    var itemElem = edata.itemElem;
                    var itemComponents = $.extend(true, [], opts.itemComponents);
                    var itemGroupComp = itemElem.jinputgroup({
                        components: itemComponents,
                        data: edata.itemData,
                        isRepeatInit: edata.isInit
                    }).jinputgroup('instance');

                    itemGroupComp.parent = that;
                },
                beforeItemRemove: function (event, ui) {
                    var itemData = {};
                    var $item = ui.itemElem;
                    var itemInputGroup = $item.jinputgroup('instance');
                    for (var i = 0; i < opts.itemComponents.length; i++) {
                        var component = opts.itemComponents[i];
                        var itemCmpt = itemInputGroup['$' + component.name];
                        if (itemCmpt.getValueText) {
                            itemData[component.name] = itemCmpt.getValueText();
                        }
                        else {
                            itemData[component.name] = itemCmpt.getValue();
                        }
                    }

                    that.removeItemData.push(itemData);
                },
                buildItemData: function ($item) {
                    return $item.jinputgroup("getValue");
                },
                itemCommand: function (event, eventData) {
                    var cmd = eventData.command;
                    if (cmd == 'remove') {
                        $(this).jlist('remove', eventData.itemElem);

                        that.onValueChanged();
                    }
                }
            }).jlist('instance');

            this._on(this._find('[data-role="AddBtn"]'), {
                'click': function () {
                    that.$inputWrapper.jlist('append', {}, true);

                    that.onValueChanged();
                }
            });
        },
        validate: function () {
            var invalid = [];

            var itemElems = this.$inputWrapper.jlist("getAllItemElems");
            for (var i = 0; i < itemElems.length; i++) {
                var itemElem = itemElems[i];

                if (!$(itemElem).jinputgroup("validate")) {
                    invalid.push($(itemElem).jinputgroup("getInvalids"));
                }
            }
            return invalid.length == 0;
        },
        getValue: function () {
            var data = {};
            if (this.options.getDataMode == "getChanges") {
                data = this.$inputWrapper.jlist("getChanges");
            }
            else {
                data = this.$inputWrapper.jlist("getAll");
            }
            return data;
        },
        _setValue: function (value, isInit) {
            this.$inputWrapper.jlist("bindData", value);
        },
        getChanged: function () {
            var opts = this.options;

            var change = {
                widget: this.widgetName, name: this.name, label: opts.label,
                added: [], updated: [], removed: this.removeItemData
            };
            var newItems = this.list.getNewItems();
            if (newItems.length > 0) {
                for (var i = 0; i < newItems.length; i++) {
                    var $newItem = $(newItems[i]);
                    var addedObj = { id: null };
                    addedObj.changed = $newItem.jinputgroup('getChanged', true);

                    change.added.push(addedObj);
                }
            }

            var initItems = this.list.getInitItems();
            if (initItems.length > 0) {
                for (var i = 0; i < initItems.length; i++) {
                    var $initItem = $(initItems[i]);
                    var changed = $initItem.jinputgroup('getChanged');
                    if (changed.length > 0) {
                        var itemData = this.list.getItemData($initItem);
                        var changedObj = {};
                        changedObj.key = itemData[opts.keyField];
                        changedObj.changed = changed;
                        change.updated.push(changedObj);
                    }
                }
            }

            if (change.added.length > 0 || change.updated.length > 0 || change.removed.length > 0) {
                return change;
            }
            else {
                return false;
            }
        }
    });
}));