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
    $.widget("jui.jselect", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value",
                filter: "q"
            },
            value: null,
            styleClass: 'jselect-default',
            emptyData: null,
            sourceList: {
                method: 'GET',
                templates: {
                    itemWrapper: '<li></li>',
                    item: '<a href="javascript:;">{{text}}</a>'
                },
                styleClasses: { itemContainer: 'menu active-highlight' }
            },
            selectedList: {
                templates: {
                    item: '<li>{{text}}</li>'
                }
            },
            singleTemplate: '{{text}}',
            multiple: false,
            showArrow: true,

            pop: {
                trigger: null,
                layer: {
                    fitElem: '.jselect-list',
                    size: {
                        maxHeight: 'fit'
                    }
                }
            },
            searchPlaceholder: '',
            remoteSearch: false,
            autocomplete: true,
            minItemsForSearch: 20,
            filterConverter: null,

            delay: 300
        },
        _inputRender: function () {
            var that = this, opts = this.options;
            this.element.addClass('jselect');
            this.$selectInput = $('<select class="jselect-select"><option value=""></option></select>').appendTo(this.$inputWrapper);
            this.$wrapper = this.$inputWrapper;
            /*if (opts.width) {
                this.$inputWrapper.css("width", opts.width);
            }*/
            this.$display = $('<div class="jselect-display"></div>').appendTo(this.$wrapper);

            if (opts.multiple) {
                this.$selectInput.attr("multiple", "multiple");
                this.$multipleDisplay = $('<div class="jselect-display-multiple"><ul class="jlist-items"></ul></div>').appendTo(this.$display);
                opts.selectedList = $.extend({}, {
                    fields: {
                        key: opts.fields.value
                    }
                }, opts.selectedList);
                this.$multipleDisplay.jlist(opts.selectedList);
            }
            else {
                this.$singleDisplay = $('<div class="jselect-display-single"></div>').appendTo(this.$display);
            }

            if (opts.showArrow) {
                this.$displayArrow = $('<span class="jselect-display-arrow"><i class="fa fa-angle-down"></i></span>').appendTo(this.$display);
            }

            this.$popLayer = $('<div class="jselect-pop">' +
                '<div class="jselect-search"></div>' +
                '<div class="jselect-list"><ul class="jlist-items"></ul></div></div>').appendTo(this.$wrapper);
            this.$sourceList = this.$popLayer.find('.jselect-list');
            this.$search = this.$popLayer.find('.jselect-search');
            var searchBoxOpts = { placeholder: opts.searchPlaceholder };
            if (opts.pageable) {
                this.$pager = $('<div></div>').addClass('jselect-pager').insertAfter(this.$sourceList);
            }

            if (!opts.autocomplete) {
                searchBoxOpts.button = { text: 'search' };
            }

            this.popMinWidth = that.$display.outerWidth();

            this.$pop = this.$display;

            if (this.options.disabled) {
                this.disable();
            }

            var popOpts = $.extend(true, {}, opts.pop, {
                layerElem: that.$popLayer,
                layer: {
                    size: {
                        maxHeight: 'fit', width: Math.max(220, that.popMinWidth)
                    }
                },
                disabled: opts.disabled
            });

            /*if (!(typeof popOpts.layer.size.maxWidth === 'number')) {
                popOpts.layer.size.maxWidth = popOpts.layer.size.minWidth;
            }*/

            if (opts.remoteSearch) {
                that.$search.show();

                /*opts.sourceList.autoBind = false;
                popOpts.layer.showing = function () {
                    that.$searchInput.val('');
                    that.$sourceList.jlist('bindData', null);
                }*/
            }

            this.$pop.jpop(popOpts);

            if (opts.autocomplete) {
                searchBoxOpts.valueChanged = function (event, ui) {
                    that._search(ui.newValue);
                }
            }
            else {
                searchBoxOpts.button.click = function () {
                    that._search(this.getValue());
                }
            }

            this.$search.jtextbox(searchBoxOpts);

            opts.sourceList = $.extend(true, {}, {
                fields: {
                    key: opts.fields.value
                }
            }, opts.sourceList, {
                    selectable: {
                        multiple: opts.multiple
                    },
                    pageable: opts.pageable ? $.extend(true, opts.pageable, {
                        el: this.$pager,
                        displayItemCount: 0,
                        edgeItemCount: 0,
                        texts: {
                            info: ' ',
                        },
                    }) : false,
                    dataBound: function (e, edata) {
                        that.$popLayer.jlayer('setSize');
                        that.$popLayer.jlayer('setPosition');

                        var data = edata.data;
                        if (opts.emptyData) {
                            that.$sourceList.jlist("prepend", opts.emptyData).jlist("select", opts.emptyData);
                            //data.Items.unshift(opts.emptyData);
                        }
                        var items;
                        if ($.isArray(data)) {
                            items = data;
                        }
                        else if (data) {
                            items = data[$(this).jlist('option').fields.items];
                        }
                        if (!$.isArray(items)) {
                            items = [];
                        }

                        if (!opts.remoteSearch) {
                            if (opts.minItemsForSearch != -1 && items.length > opts.minItemsForSearch) {
                                that.$search.show();
                            }
                            else {
                                that.$search.hide();
                            }
                        }

                        that._renderOptions(items);

                        if (opts.pageable) {//分页的时候切换页的时候，重新选中
                            if (opts.multiple) {//针对多行的选中的情况
                                $.each(that.$multipleDisplay.jlist('getAll'), function (idx, item) {
                                    that.$sourceList.jlist("select", item, true);
                                });
                            }
                        }
                    },
                    itemSelected: function (e, data) {
                        that._renderSelected(data.itemData);
                        that._setSelectInputValue();

                        if (!opts.multiple) {
                            that.$pop.jpop('hide');
                        }

                        that._trigger('select', e, data);
                    },
                    itemDeselected: function (e, data) {
                        that._deselect(data.itemData);
                        that._setSelectInputValue();

                        that._trigger('deselect', e, data);
                    },
                    selectionChanged: function () {
                        that.onValueChanged();
                    },
                    itemConverter: function (item) {
                        return that._itemConverter(item);
                    }
                });

            if (opts.sourceList.type == "tree") {
                var treeDefaultOpsts = {
                    cssClasses: {
                        styleClass: "jlist-tree"
                    }
                };

                opts.sourceList = $.extend({}, opts.sourceList, treeDefaultOpsts);
            }

            this.$sourceList.jlist(opts.sourceList);
        },
        _itemConverter: function (item) {
            var fields = this.options.fields;
            !('text' in item) && (item.text = item[fields.text]);
            !('value' in item) && (item.value = item[fields.value]);
            return item;
        },
        _renderSelected: function (itemDatas) {
            var that = this, opts = this.options;

            if (!itemDatas) {
                if (opts.multiple) {
                    that.$multipleDisplay.jlist("bind", null);
                }
                else {
                    that.$singleDisplay.html('');
                    that.$singleDisplay.data('itemData', itemDatas);
                }

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

                if (opts.multiple) {
                    that.$multipleDisplay.jlist("append", itemData);
                }
                else {
                    that.$singleDisplay.html($.jui.tmpl(opts.singleTemplate, itemData)).attr('title', itemData.text);
                    that.$singleDisplay.data('itemData', itemData);
                }
            }
        },
        /*_renderSelected: function (itemData) {
            var that = this, opts = this.options;

            itemData = this._itemConverter(itemData);

            if (opts.multiple) {
                that.$multipleDisplay.jlist("append", itemData);
            }
            else {
                this.$singleDisplay.html($.jui.tmpl(opts.singleTemplate, itemData));
                this.$singleDisplay.data('itemData', itemData);
            }
        },*/
        _renderOptions: function (items) {
            if (!$.isArray(items)) {
                items = [items];
            }
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var text = item[this.options.fields.text];
                if ($.type(text) !== "string") {
                    text = JSON.stringify(text);
                }
                var value = item[this.options.fields.value];
                if ($.type(value) !== "string") {
                    value = JSON.stringify(value);
                }
                var showstr = $("<option value=\"" + value + "\"></option>");

                showstr.text(text);

                this.$selectInput.append(showstr);
            };
        },
        _deselect: function (itemData) {
            if (this.options.multiple) {
                this.$multipleDisplay.jlist("remove", itemData);
            }
        },
        deselect: function (itemData) {
            if (this.options.remoteSearch) {
                this._deselect(itemData);
                this._setSelectInputValue();

                this._trigger('deselect', null, { itemData: itemData });
            }
            else {
                this.$sourceList.jlist("deselect", itemData);
            }
        },
        getSelected: function () {
            if (this.options.multiple) {
                return this.$multipleDisplay.jlist("getAll");
            }
            else {
                var itemData = this.$singleDisplay.data('itemData');
                if (itemData) {
                    return [itemData];
                }
                else {
                    return [];
                }
            }
        },
        _setValue: function (valueData, isInit) {
            var that = this;

            if (valueData === undefined || valueData == null) {
                this.$sourceList.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            if (this.options.remoteSearch) {
                this._renderOptions(valueData);
                this._renderSelected(valueData);
                this._setSelectInputValue();
            }
            else {
                this.$sourceList.jlist("select", valueData, {
                    notFireEvent: isInit,
                    callback: function () {
                        if (!isInit) {
                            return;
                        }
                        if (!$.isPlainObject(valueData)) {
                            valueData = that.$sourceList.jlist("getSelected");
                        }
                        that._renderSelected(valueData);
                        that._setSelectInputValue();
                    }
                });

            }
        },
        getValue: function () {
            var that = this, opts = this.options;
            var selected = that.getSelected();
            var vals = $.map(selected, function (item, index) {
                return item[opts.fields.value];
            })
            if (!vals.length) { return null }
            if (opts.multiple) {
                return vals;
            }
            else {
                return vals[0];
            }
        },
        getValueText: function () {
            var that = this, opts = this.options;
            var selected = that.getSelected();
            var texts = $.map(selected, function (item, index) {
                return item[opts.fields.text];
            })
            if (!texts.length) { return null }
            if (opts.multiple) {
                return texts.toString();
            }
            else {
                return texts[0];
            }
        },
        _setSelectInputValue: function () {
            var val = this.getValue();
            this.$selectInput.val(val);
        },
        _searchTimeout: function (query) {
            clearTimeout(this.searching);
            this.searching = this._delay(function () {
                var filter = {};
                filter[this.options.fields.filter] = query;
                this.$sourceList.jlist('bind', { filter: filter });
            }, this.options.delay);
        },
        _search: function (query) {
            var that = this;
            var opts = this.options;

            if (opts.remoteSearch) {
                /*if (!query) {
                    that.$sourceList.jlist('bindData', null);
                }
                else {
                    that._searchTimeout(query);
                }*/
                this._searchTimeout(query);
            }
            else {
                var reg = new RegExp(query, "i");
                var itemElems = this.$sourceList.jlist('getAllItemElems');
                itemElems.each(function (index, itemElem) {
                    var itemData = that.$sourceList.jlist('getItemData', $(itemElem));
                    if (reg.test(itemData.text)) {
                        $(itemElem).show();
                    }
                    else {
                        $(itemElem).hide();
                    }
                });
            }
        },
        getSourceList: function () {
            return this.$sourceList;
        },
        widget: function () {
            return this.$wrapper;
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                //this.widget().toggleClass("ui-state-disabled", !!value);
                this.$display.toggleClass("ui-state-disabled", !!value);
            }
            
            this._super(key, value);
        }
    });
}));