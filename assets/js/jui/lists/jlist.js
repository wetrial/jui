(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../jcomponent",
            "../utils",
            "../misc/jpager",
            "../mixins/dataMixin"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jlist", $.jui.jcomponent, $.extend(true, {}, $.jui.dataMixin, {
        options: {
            autoBind: true,
            delayLoad: false,
            type: 'normal',
            fields: {
                key: 'Id',
                total: 'Total',
                items: 'Items'
            },
            templates: {
                layout: null,
                item: null,
                itemWrapper: null,
                edit: null,
                empty: null,
                firstAddOn: null,
                lastAddOn: null,
                tree: {
                    subitem: null,
                    children: null
                }
            },
            styleClasses: {
                itemSelected: "active",
            },
            cssClasses: {
                itemContainer: "jlist-items",
                item: "jlist-item",
                itemWrapper: "jlist-item-wrapper",
                itemSelected: "jlist-item-selected",
                itemPartSelected: "jlist-item-partselected",
                checkerAllChecked: "jlist-checker-all-checked",
                emptyItem: "jlist-empty",
                firstAddOn: "jlist-item-firstaddon",
                lastAddOn: "jlist-item-lastaddon"
            },
            selectors: {
                widget: '.jlist',
                itemContainer: ".jlist-items",
                item: ".jlist-item",
                itemWrapper: ".jlist-item-wrapper",
                itemSelected: ".jlist-item-selected",
                itemPartSelected: ".jlist-item-partselected",
                itemChecker: ".jlist-item-checker",
                checkerAll: ".jlist-checker-all",
                cCheckerAllChecked: ".jlist-checker-all-checked",
                emptyItem: ".jlist-empty",
                pager: ".jlist-pager",
                firstAddOn: ".jlist-item-firstaddon",
                lastAddOn: ".jlist-item-lastaddon"
            },
            pageable: false,
            selectable: {
                multiple: false,
                cascade: true,
                cascadeCancelParent: true,
                onlyleaf: true,
                selectOnClick: true,
                singleSelectCanRevert: false,
                checkAllElem: false
            },
            tree: {
                isListData: true,
                indent: 16,
                initCollapseLevel: false,
                fields: {
                    key: 'Id',
                    children: 'Children',
                    parentKey: 'ParentId'
                },
                toggleOnClick: false,
                popChildren: false,
                popTriggerType: 'click',
                popAppendTo: 'body',
                cssClasses: {
                    children: "jlist-children",
                    childrenItemContainer: "jlist-children-items",
                    toggle: "jlist-item-toggle",
                    leaf: "jlist-item-leaf",
                    collapsed: "jlist-item-collapsed"
                },
                selectors: {
                    children: ".jlist-children",
                    childrenItemContainer: ".jlist-children-items",
                    toggle: '.jlist-item-toggle',
                    leaf: ".jlist-item-leaf"
                }
            },
            group: {
                cssClasses: {
                    group: "jlist-group",
                    children: "jlist-children",
                    childrenItemContainer: "jlist-children-items"
                },
                selectors: {
                    group: ".jlist-group",
                    children: ".jlist-children",
                    childrenItems: ".jlist-children-items"
                },
                groupsFiled: "Groups",
                childrenField: 'Children',
                cssClass: "jlist-group",
                selector: ".jlist-group",
                templates: null
            },
            initEdit: false,
            bindExtra: false,

            buildItemData: $.noop,
            itemConverter: null,

            loading: {},

            itemClick: function () { },
            selected: function () { }
        },

        _$itemContainer: null,
        _$pager: null,
        _context: null,
        _total: 0,

        _render: function () {
            var that = this, opts = that.options;

            this.itemelems = [];
            this.removedItemDatas = [];
            this.removedItemElems = [];

            var nodeName = this.element[0].nodeName.toLowerCase();
            /*if (nodeName != 'div') {
                throw "jlist 插件元素必须是 div";
            }*/

            this.element.addClass('jlist');

            this._getTemplates();

            if (opts.templates.layout) {
                this.element.html(opts.templates.layout);
            }
            if (this.element.is(opts.selectors.itemContainer)) {
                this._$itemContainer = this.element;
            }
            else {
                this._$itemContainer = this.element.find(opts.selectors.itemContainer);
                if (!this._$itemContainer.length) {
                    this._$itemContainer = this.element.addClass(opts.cssClasses.itemContainer);
                }
            }

            this._$itemContainer.addClass(opts.styleClasses.itemContainer);

            if (opts.pageable) {
                if (opts.pageable.el) {
                    this._$pager = opts.pageable.el;
                }
                else {
                    this._$pager = this.element.find(opts.selectors.pager);
                }
                if (!this._$pager.length) {
                    this._$pager = $("<div>").appendTo(this.element);
                }
                var pagerOpts = $.extend({
                }, opts.pageable, {
                        pageChanged: function (e, data) {
                            // 注意这里，opts的引用不能变，闭包的坑。或者改用 that.options。
                            opts.pageable.pageIndex = data.pageIndex;
                            opts.pageable.pageSize = data.pageSize;
                            that.bind();
                        }
                    });
                this._$pager.jpager(pagerOpts);
                opts.pageable = this._$pager.jpager("option");
            }

            if (opts.selectable && opts.selectable.multiple) {
                this._$checkerAll = this.element.find(opts.selectors.checkerAll);
                if (this._$checkerAll.length) {
                    bindCheckAllEvent(this._$checkerAll);
                }

                if (opts.selectable.checkAllElem) {
                    this._$checkerAll = $(opts.selectable.checkAllElem);
                    bindCheckAllEvent($(opts.selectable.checkAllElem));
                }
            }

            function bindCheckAllEvent($checkerAll) {
                $checkerAll.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if ($checkerAll.hasClass(opts.cssClasses.checkerAllChecked)) {
                        that.deselectAll();
                        $checkerAll.removeClass(opts.cssClasses.checkerAllChecked);
                    }
                    else {
                        that.selectAll();
                        $checkerAll.addClass(opts.cssClasses.checkerAllChecked);
                    }
                });
            }
        },
        _init: function () {
            if (this.options.autoBind) {
                this.bind();
            }
        },
        refresh: function (options) {
            //this.options = $.extend(true, {}, this.options, options); 这种用法会改变原来 options 的引用，造成上面 pager 回调的坑。
            this.options = $.extend(true, this.options, options);
            if (this.options.pageable) {
                this.options.pageable.pageIndex = 1;
            }
            this.bind();
        },
        bind: function () {
            var that = this;
            var opts = this.options;
            var params = {};
            if (opts.pageable) {
                params[opts.pageable.fields.pageIndex] = opts.pageable.pageIndex;
                params[opts.pageable.fields.pageSize] = opts.pageable.pageSize;
            }
            if (opts.dataUrl && opts.loading) {
                if (that.$loading) {
                    that.$loading.close();
                }
                opts.loading.appendTo = that.element;
                that.$loadding = $.jui.tip.loading(opts.loading)
            }
            this._getData(function () {
                if (that.$loadding) {
                    that.$loadding.close();
                }

                that.bindData(that.data);
            }, params);

        },
        bindData: function (data) {
            var that = this, opts = this.options;

            /*if (!data) {
                that._$itemContainer.empty();
                this._total = 0;
                this._addEmpty();
                that._trigger("dataBound", null, { data: data });
                return;
            }*/

            if (!data) {
                data = [];
            }

            that._$itemContainer.empty();
            var items;
            if ($.isArray(data)) {
                items = data;
            }
            else {
                items = data[opts.fields.items];
            }
            if (!$.isArray(items)) {
                items = [];
            }
            that._total = items.length;
            if (!(items.length > 0)) {
                this._addEmpty();
            }

            if (opts.templates.firstAddOn) {
                var itemHtml = $.jui.tmpl(opts.templates.firstAddOn, {});
                var $firstAddOn = $(itemHtml).addClass(opts.cssClasses.firstAddOn);
                this._$itemContainer.append($firstAddOn);

                $firstAddOn.find("[data-command]").on("click", function (e) {
                    var $target = $(e.currentTarget);
                    var command = $target.attr('data-command');
                    if (command) {
                        e.preventDefault();
                        e.stopPropagation();
                        that._trigger('itemCommand', e, { command: command });
                        return;
                    }
                });
            }

            if (opts.type == 'group') {
                for (var i = 0; i < data[opts.group.groupsField].length; i++) {
                    var group = data[opts.group.groupsField][i];
                    that._bindGroup(group);
                }
            }
            else if (opts.type == 'tree') {
                var treeItems = items;
                if (opts.tree.isListData) {
                    treeItems = that._toTreeData(items);
                }
                if (opts.delayLoad) {
                    that.element.data("data", treeItems);
                }
                for (var i = 0; i < treeItems.length; i++) {
                    var item = treeItems[i];
                    that.bindItem(item, null, true);
                }
            }
            else {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var first = false;
                    var last = false;
                    if (i == 0) {
                        first = true;
                    }
                    if (i == items.length - 1) {
                        last = true;
                    }
                    that.bindItem(item, { index: i, first: first, last: last, items: items }, true);
                }
            }

            if (opts.pageable) {
                that._total = data[opts.fields.total];
                this._$pager.jpager("bind", { total: that._total, pageIndex: opts.pageable.pageIndex });
            }

            if (opts.templates.lastAddOn) {
                var itemHtml = $.jui.tmpl(opts.templates.lastAddOn, {});
                var $lastAddOn = $(itemHtml).addClass(opts.cssClasses.lastAddOn);
                this._$itemContainer.append($lastAddOn);

                $lastAddOn.find("[data-command]").on("click", function (e) {
                    var $target = $(e.currentTarget);
                    var command = $target.attr('data-command');
                    if (command) {
                        e.preventDefault();
                        e.stopPropagation();
                        that._trigger('itemCommand', e, { command: command });
                        return;
                    }
                });
            }

            that._trigger("dataBound", null, { data: data });
        },
        _getTemplates: function () {
            var opts = this.options;

            var tmplScripts = this._find('script[type="text/html"]');
            tmplScripts.each(function (index, elem) {
                var tmpl = $(this);
                var role = tmpl.attr('data-role');
                if (role.indexOf('.') > 0) {
                    var roleArr = role.split('.');
                    opts.templates[roleArr[0]][roleArr[1]] = tmpl.html();
                } else {
                    opts.templates[role] = tmpl.html();
                }
            });
        },
        _bindEvents: function ($item) {
            var that = this;
            var opts = this.options;
            var itemData = $item.data('itemData');
            var $commands = $item.find("[data-command]");
            if ($item.is("[data-command]")) {
                $commands = $commands.add($item);
            }
            $commands.on("click", function (e) {
                var $target = $(e.currentTarget);
                var command = $target.attr('data-command');
                if (command) {
                    e.preventDefault();
                    e.stopPropagation();
                    that._trigger('itemCommand', e, { command: command, itemData: itemData, itemElem: $item });
                    return;
                }
            });
            if (opts.tree.popChildren) {
                var $children = that._getChildren($item);
                $item.data('children', $children);
                if (!that.popChildrenElems) {
                    that.popChildrenElems = [];
                }
                that.popChildrenElems.push($children);

                if ($children) {
                    $item.jpop({
                        layerElem: $children,
                        triggerType: opts.tree.popTriggerType,
                        layer: { appendTo: opts.tree.popAppendTo }
                    });
                }
            }

            $item.on("click", function (e) {
                var $target = $(e.target);
                if (opts.type == 'tree') {
                    var isFolder = !$item.is(opts.tree.selectors.leaf);

                    if (!opts.tree.popChildren) {
                        if ($target.is(opts.tree.selectors.toggle) || (isFolder && opts.tree.toggleOnClick)) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (opts.delayLoad) {
                                if (!$item.data('isLoadedChildren')) {
                                    $item.data('isLoadedChildren', true);
                                    var children = itemData[opts.tree.fields.children];
                                    if (children && children.length)
                                        $item.toggleClass(opts.tree.cssClasses.collapsed);
                                    $.each(children, function (idx, subItem) {
                                        var subOptions = { isShowForDelayLoad: true, relativeItem: $item };
                                        that.bindItem(subItem, subOptions);
                                    });
                                    return;
                                }
                            }
                            var $children = that._getChildren($item);
                            if ($children != null) {
                                $children.toggleClass("hide");
                                $item.toggleClass(opts.tree.cssClasses.collapsed);

                            }

                            return;
                        }
                    }
                }
                if ($item.is('.jlist-item-disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                if (opts.selectable && $target.is(opts.selectors.itemChecker)) {
                    e.preventDefault();
                    e.stopPropagation();

                    //that._selectItemElem($item);
                    that.select($item);
                    return;
                }

                //if ($item.attr("isnew") == "false") {
                if (opts.selectable && opts.selectable.selectOnClick) {
                    that.select($item);
                }
                //}

                
                that._trigger('itemClick', e, { itemElem: $item, itemData: itemData, inst: that });

            });
        },
        _parse: function () {
            var that = this;
            that._$itemContainer.find(that.options.selectors.item).each(function () {
                var item = {};
                var itemStr = $(this).attr("data-item");
                if (itemStr) {
                    if (itemStr.substring(0, 1) != '{') {
                        itemStr = '{' + itemStr + '}';
                    }
                    item = (new Function('return ' + itemStr))();
                }
                $(this).data('item', item);
            });
        },
        _createItem: function (itemData, options) {
            var that = this;
            var opts = this.options;
            options = $.extend({
                level: 0,
                isNew: false,
                isEdit: false
            }, options);
            if (this._context) {
                itemData.context = this._context;
            }

            if (opts.itemConverter && $.isFunction(opts.itemConverter)) {
                itemData = opts.itemConverter.call(that, itemData);
            }
            var itemTmpl = this.options.templates.item;
            if (options.isEdit) {
                itemTmpl = this.options.templates.edit;
            }
            if (opts.type == 'tree' && options.level > 0 && opts.templates.tree.subitem) {
                itemTmpl = opts.templates.tree.subitem;
            }

            var bindData = itemData;
            if (opts.bindExtra) {
                bindData = $.extend({
                    item: itemData
                }, options);
            }
            var itemHtml = $.jui.tmpl(itemTmpl, bindData);

            var $item = $(itemHtml)
                .addClass(this.options.cssClasses.item).addClass(this.options.styleClasses.item)
                .attr('data-item-key', itemData[this.options.fields.key])
                .data('itemData', itemData)
                .attr('isnew', options.isNew)
                .attr('isedit', options.isEdit);

            if (this.options.type == 'tree') {
                $item.data("level", options.level);
                var $jlistIndent = $item.find(".jlist-indent");
                if (!$jlistIndent.length) {
                    $jlistIndent = $item;
                }
                if (options.level > 0 && this.options.tree.indent) {
                    if (!opts.tree.popChildren) {
                        $jlistIndent.css("padding-left", options.level * this.options.tree.indent);
                    }
                }

                if (opts.tree.initCollapseLevel != false && opts.tree.initCollapseLevel - 1 <= options.level) {
                    $item.addClass(opts.tree.cssClasses.collapsed);
                }
            }

            this._trigger("itemCreated", null, { itemElem: $item, itemData: itemData, createOptions: options })

            return $item;
        },
        bindItem: function (itemData, options, isInit) {
            var that = this;
            var opts = that.options;
            var isNew = true;
            if (isInit) {
                isNew = false;
            }
            if (itemData === undefined || itemData == null) {
                itemData = {};
            }

            var isEdit = false;
            if (isInit && opts.initEdit) {
                isEdit = true;
            }

            //Set defaults
            options = $.extend({
                relativeItem: null,
                target: null,
                isEdit: isEdit,
                position: 'append'
            }, options);

            var $target = options.target;
            if (options.target == null) {
                $target = this._$itemContainer;
            }

            if (!options.target && options.relativeItem) {
                $target = options.relativeItem;
            }

            var createItemOptions = {
                isNew: isNew, isEdit: options.isEdit,
                first: options.first, last: options.last,
                index: options.index
            };
            if (that.options.type == 'tree') {
                if (options.position == "append" || options.position == "prepend") {
                    if (options.relativeItem) {
                        $target = that._getChildrenItemContainer(options.relativeItem);
                        createItemOptions.level = options.relativeItem.data("level") + 1;
                        if (!opts.tree.popChildren && (opts.tree.initCollapseLevel != false && opts.tree.initCollapseLevel <= createItemOptions.level) && !options.isShowForDelayLoad) {
                            $target.addClass("hide");
                        }
                        if (opts.tree.popChildren) {
                            $target.css('display', 'none');
                        }
                    }
                }
                else {
                    if (opts.templates.itemWrapper && options.relativeItem) {
                        $target = that._getItemWrapper(options.relativeItem);
                    }

                    if (options.relativeItem) {
                        createItemOptions.level = options.relativeItem.data("level");
                    }
                    if (options.position == "after") {
                        var $children = that._getChildren(options.relativeItem);
                        if ($children != null) {
                            $target = $children;
                        }
                    }
                }
            }
            else {
                if (opts.templates.itemWrapper && options.relativeItem) {
                    $target = that._getItemWrapper(options.relativeItem);
                }
            }

            if (options.position == 'replace') {
                createItemOptions.isNew = options.relativeItem.attr("isNew");
            }

            // create item
            var $item = this._createItem(itemData, createItemOptions);

            if (options.position == 'replace') {
                $item.data("itemInitData", options.relativeItem.data("itemInitData"));
            }
            else {
                $item.data("itemInitData", itemData);
            }
            $item.data("itemData", itemData);
            if (that.options.type == 'tree') {
                var children = itemData[that.options.tree.fields.children];
                if (!$.isArray(children) || !children.length > 0) {
                    $item.addClass(that.options.tree.cssClasses.leaf);
                }
            }

            var toBound = $item;

            if (opts.templates.itemWrapper) {
                var itemWrapperHtml = $.jui.tmpl(opts.templates.itemWrapper, itemData);
                var $itemWrapper = $(itemWrapperHtml);
                $itemWrapper.wrapInner($item).addClass(opts.cssClasses.itemWrapper).addClass(opts.styleClasses.itemWrapper);
                toBound = $itemWrapper;
            }

            if (options.position == 'prepend') {
                toBound.prependTo($target);
            }
            else if (options.position == 'append') {
                var $lastAddOn = $target.children(opts.selectors.lastAddOn);
                if ($lastAddOn.length) {
                    toBound.insertBefore($lastAddOn);
                }
                else {
                    toBound.appendTo($target);
                }
            }
            else if (options.position == 'after') {
                toBound.insertAfter($target);
            }
            else if (options.position == 'replace') {
                $item.replaceAll($target);
            }

            if (!isInit && options.position != 'replace') {
                that._total++;
                if (that.options.pageable) {
                    that._$pager.jpager('bind', { total: that._total });
                }
            }

            if (that.options.type == 'tree') {
                var children = itemData[this.options.tree.fields.children];
                if (options.position != 'replace' && $.isArray(children) && children.length > 0) {

                    var subOptions = $.extend(options, { relativeItem: $item })
                    if (opts.delayLoad) {

                        if (opts.tree.initCollapseLevel > $item.data("level") + 1) {
                            $item.data('isLoadedChildren', true);
                            $.each(children, function (index, subItem) {
                                that.bindItem(subItem, subOptions, isInit);
                            });
                        }

                    } else {
                        $.each(children, function (index, subItem) {
                            that.bindItem(subItem, subOptions, isInit);
                        });
                    }
                }
            }

            this._removeEmpty();

            this._bindEvents($item);

            this._trigger("itemDataBound", null, { itemData: itemData, itemElem: $item, isEdit: options.isEdit, isInit: isInit });

            return $item;
        },
        _createGroup: function (groupData) {
            var groupHtml = $.jui.tmpl(this.options.group.template, groupData);
            var $group = $(groupHtml)
                .addClass(this.options.group.cssClasses.group)
                .data('groupData', groupData);

            return $group;
        },
        _bindGroup: function (groupData) {
            var that = this;
            var $group = this._createGroup(groupData);
            this._$itemContainer.append($group);
            var $groupChildren = $group.find(this.options.group.selectors.children);
            var children = groupData[this.options.group.childrenField];
            if (children && children.length) {
                for (var i = 0; i < children.length; i++) {
                    var item = children[i];
                    that.bindItem(item, { target: $groupChildren }, true);
                }
            }
        },
        _getItemWrapper: function ($item) {
            return $item.closest(this.options.selectors.itemWrapper);
        },
        _getParent: function ($item) {
            var $itemContainer = $item.closest(this.options.tree.selectors.children);
            if ($itemContainer && $itemContainer.length != 0) {
                return $itemContainer.prev();
            }
            else {
                return null;
            }
        },
        _getChildren: function ($item) {
            var $next = $item.next();
            if ($next.is(this.options.tree.selectors.children)) {
                return $next;
            }
            return null;
        },
        _getChildrenItemContainer: function ($item, addIfNotFound) {
            if ($item.data('children')) {
                return $item.data('children');
            }
            var $next = $item.next();
            if (!$next.is(this.options.tree.selectors.children)) {
                $next = $($.jui.tmpl(this.options.templates.tree.children, {})).insertAfter($item);
                $next.addClass(this.options.tree.cssClasses.children);
            }
            if ($next.is(this.options.tree.selectors.childrenItemContainer)) {
                return $next;
            }
            var $childrenItemContainer = $next.findUntil(this.options.tree.selectors.childrenItemContainer, this.options.tree.selectors.childrenItemContainer);
            if (!$childrenItemContainer.length) {
                $childrenItemContainer = $next.addClass(this.options.tree.cssClasses.childrenItemContainer);
            }

            return $childrenItemContainer;
        },

        _getChildItemElems: function (parentItemElem) {
            if (!parentItemElem) {
                return this._$itemContainer.findUntil(this.options.selectors.item, [this.options.selectors.widget, this.options.tree.selectors.children]);
            }
            else {
                var subItemContainer = this._getChildrenItemContainer(parentItemElem);

                return subItemContainer.findUntil(this.options.selectors.item, [this.options.selectors.widget, this.options.tree.selectors.children]);
            }
        },

        getShortSelected: function (parentItemElem, result) {
            var that = this, opts = this.options;

            result = typeof result !== 'undefined' ? result : [];

            var itemElems = this._getChildItemElems(parentItemElem);

            itemElems.each(function (index, itemElem) {
                if ($(itemElem).is(opts.selectors.itemSelected)) {
                    result.push(that.getItemData($(itemElem)));
                }
                else {
                    that.getShortSelected($(itemElem), result);
                }
            });

            return result;
        },

        select: function (param, notFireEvent, notCascade, notRevert, callback) {
            var that = this;
            var selectionChanged = false;
            var selectOptions = notFireEvent;
            if (!notFireEvent || !$.isPlainObject(notFireEvent)) {
                selectOptions = {
                    notFireEvent: notFireEvent,
                    notCascade: notCascade,
                    notRevert: notRevert,
                    callback: callback
                }
            }
            (function () {
                if (!that.gettingData) {
                    if ($.jui.utils.isJqObj(param) && param.length > 1) {
                        param.each(function () {
                            selectionChanged = that._selectSingle($(this), selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                        });
                    }
                    else if ($.isArray(param)) {
                        $.each(param, function (index, value) {
                            selectionChanged = that._selectSingle(value, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                        });
                    }
                    else {
                        selectionChanged = that._selectSingle(param, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                    }

                    if (!selectOptions.notFireEvent && selectionChanged) {
                        that._trigger('selectionChanged', null, {})
                    }

                    that._refreshCheckerAllState();

                    if (selectOptions.callback && $.isFunction(selectOptions.callback)) {
                        selectOptions.callback.call(that);
                    }
                }
                else {
                    setTimeout(arguments.callee, 200);
                }
            })();
        },
        selectIndex: function (index, selectOptions) {
            var $item = getAllItemElems().eq(index);

            var selectionChanged = this._selectSingle($item, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert);

            if (!selectOptions.notFireEvent && selectionChanged) {
                this._trigger('selectionChanged', null, {})
            }
        },
        selectAll: function () {
            var allItemElems = this.getAllItemElems();
            this.select(allItemElems, true, true, true);
        },

        deselect: function (param, notFireEvent) {
            var that = this;

            (function () {
                if (!that.gettingData) {
                    var selectionChanged;
                    if ($.jui.utils.isJqObj(param) && param.length > 1) {
                        param.each(function () {
                            selectionChanged = that._deselectSingle($(this), notFireEvent) || selectionChanged;
                        });
                    }
                    else if ($.isArray(param)) {
                        $.each(param, function (index, value) {
                            selectionChanged = that._deselectSingle(value, notFireEvent) || selectionChanged;
                        });
                    }
                    else {
                        selectionChanged = that._deselectSingle(param, notFireEvent) || selectionChanged;
                    }

                    if (!notFireEvent && selectionChanged) {
                        that._trigger('selectionChanged', null, {})
                    }

                    that._refreshCheckerAllState();
                }
                else {
                    setTimeout(arguments.callee, 200);
                }
            })();
        },

        deselectAll: function () {
            var allItemElems = this.getAllItemElems();
            this.deselect(allItemElems, true);
        },

        _selectItemElem: function ($item, notFireEvent, notCascade, notRevert) {
            var selectionChanged = false;

            var that = this;
            var opts = this.options;
            if (notCascade === undefined) {
                notCascade = !opts.selectable.cascade;
            }
            if (opts.selectable.onlyleaf && opts.type == "tree") {
                if (!$item.is(opts.tree.selectors.leaf)) {
                    return;
                }
            }
            var alreadySelected = !!$item.hasClass(opts.cssClasses.itemSelected);
            if (alreadySelected) {
                if (!notRevert) {
                    if (!(opts.selectable.singleSelectCanRevert || opts.selectable.multiple)) {
                        return;
                    }
                    else {
                        selectionChanged = this._deselectItemElems($item) || selectionChanged;
                    }
                }
            }
            else {
                if (!opts.selectable.multiple) {
                    this._deselectItemElems(this._getSelectedItemElems());
                }

                $item.removeClass(opts.cssClasses.itemPartSelected)
                    .addClass(that.options.cssClasses.itemSelected).addClass(that.options.styleClasses.itemSelected);

                if (!(notFireEvent != undefined && notFireEvent == true)) {
                    this._trigger("itemSelected", null, { itemElem: $item, itemData: this.getItemData($item) });

                    selectionChanged = true;
                }
            }

            if (opts.type == "tree" && !notCascade) {
                setParentCheckbox($item);
                setChildCheckbox($item);
            }
            function setChildCheckbox($pitem) {
                var $children = that._getChildren($pitem);
                if ($children) {
                    var $childrenItems = $children.findUntil(opts.selectors.item, opts.selectors.widget);
                    $childrenItems.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);

                    if ($pitem.hasClass(opts.cssClasses.itemSelected)) {
                        $childrenItems.addClass(opts.cssClasses.itemSelected).addClass(opts.styleClasses.itemSelected);
                    }
                }
            }

            function setParentCheckbox(node) {
                var pnode = that._getParent(node);
                if (pnode) {
                    var $children = that._getChildren(pnode);
                    $children.removeClass("hide");
                    pnode.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);

                    if (isAllSelected(node, pnode)) {
                        pnode.addClass(opts.cssClasses.itemSelected).addClass(opts.styleClasses.itemSelected);
                    }
                    else {
                        if (!isAllNull(node, pnode)) {
                            pnode.addClass(opts.cssClasses.itemPartSelected);
                        }
                        else {
                            if (!opts.cascadeCancelParent) {
                                pnode.addClass(opts.cssClasses.itemPartSelected);
                            }
                        }
                    }
                    setParentCheckbox(pnode);
                }

                function isAllSelected(node, pnode) {
                    if (!node.hasClass(opts.cssClasses.itemSelected)) return false;
                    var b = true;
                    var $children = that._getChildren(pnode);
                    var $childrenItems = $children.find(opts.selectors.item);
                    $childrenItems.each(function () {
                        if (!$(this).hasClass(opts.cssClasses.itemSelected)) {
                            b = false;
                            return false;
                        }
                    });
                    return b;
                }
                function isAllNull(node, pnode) {
                    if (node, pnode.hasClass(opts.cssClasses.itemSelected) || node, pnode.hasClass(opts.cssClasses.itemPartSelected)) return false;
                    var b = true;
                    var $children = that._getChildren(pnode);
                    var $childrenItems = $children.find(opts.selectors.item);
                    $childrenItems.each(function () {
                        if ($(this).hasClass(opts.cssClasses.itemSelected) || $(this).hasClass(opts.cssClasses.itemPartSelected)) {
                            b = false;
                            return false;
                        }
                    });
                    return b;
                }
            }

            return selectionChanged;
        },
        selectTo: function (single) {//选中指定节点，并向上展开父节点，如果父节点已展开 则不继续往上查找
            var that = this;
            var opts = that.options;
            var $item = this.getItemElem(single);
            var nodeArry = [];
            if ($item.length) {
                this._selectItemElem($item);
                expandTo($item);
                if (!$item.is(that.options.tree.cssClasses.leaf)) {
                    var $children = that._getChildren($item);
                    if (!$children) {
                        if (that.options.delayLoad && !$item.data('isLoadedChildren')) {
                            $item.data('isLoadedChildren', true);
                            var itemData = $item.data('itemData');
                            var children = itemData[opts.tree.fields.children];
                            $.each(children, function (idx, subItem) {
                                var subOptions = { isShowForDelayLoad: true, relativeItem: $item };
                                that.bindItem(subItem, subOptions);
                            });
                        }
                    }
                    else if ($children.hasClass("hide")) {
                        $children.removeClass("hide");
                    }
                    $item.removeClass(opts.tree.cssClasses.collapsed);
                }
                scrollToView($item.get(0));
            }
            else if (that.options.delayLoad) {//如果这个节点没有加载，则从根节点加载下来
                var treeData = that.element.data('data');
                fromParentTo(treeData, single);//从父节点查找到当前节点
                for (var i = nodeArry.length - 1; i >= 0; i--) {
                    var $item = that.getItemElem(nodeArry[i][opts.fields.key]);
                    if (!$item.length) {
                        $.each(nodeArry[i + 1][opts.tree.fields.children], function (idx, subItem) {
                            var $parentItem = that.getItemElem(nodeArry[i + 1][opts.fields.key]);
                            var subOptions = { isShowForDelayLoad: true, relativeItem: $parentItem };
                            that.bindItem(subItem, subOptions);
                            $parentItem.data('isLoadedChildren', true);
                            $parentItem.removeClass(opts.tree.cssClasses.collapsed);
                        });
                    }
                }
                if (nodeArry.length > 0) {
                    $item = that.getItemElem(nodeArry[0][opts.fields.key]);
                    that._selectItemElem($item);
                    scrollToView($item.get(0));
                }
            }
            function expandTo($currentNode) {//从子节点展开到父节点
                var $pnode = that._getParent($currentNode);
                if ($pnode) {
                    var $children = that._getChildren($pnode);
                    if ($children.hasClass("hide")) {
                        $children.removeClass("hide");
                        expandTo($pnode);
                        $pnode.removeClass(opts.tree.cssClasses.collapsed);
                    }
                }
            }
            function fromParentTo(treeData, id) {//从父节点查找到当前节点
                $.each(treeData, function (idx, item) {
                    if (item[opts.fields.key] == id) {
                        nodeArry.push(item);
                        return false;
                    }
                    else if (item[opts.tree.fields.children] && item[opts.tree.fields.children].length) {
                        fromParentTo(item[opts.tree.fields.children], id);
                        if (nodeArry.length > 0) {
                            nodeArry.push(item);
                            return false;
                        }
                    }
                });
            }
            function scrollToView(target) {
                var isInView = (target.offsetTop > that.element.scrollTop() && (target.offsetTop < (that.element.scrollTop() + that.element.height())));
                //是否在可视区域内，如果isInView=false，不在可视区域
                if (!isInView && target.scrollIntoView)
                    target.scrollIntoView(false);
            }
        },
        _deselectItemElems: function ($items, notFireEvent) {
            var that = this;
            var opts = this.options;

            var selectionChanged = false;

            $items.each(function (index, item) {
                var $item = $(this);

                var alreadySelected = !!$item.hasClass(opts.cssClasses.itemSelected);
                if (alreadySelected) {
                    $item.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);
                    if (!(notFireEvent != undefined && notFireEvent == true)) {
                        that._trigger("itemDeselected", null, { itemElem: $item, itemData: that.getItemData($item) });

                        selectionChanged = true;
                    }
                }
            });

            return selectionChanged;
        },
        _getSelectedItemElems: function (withPartParent) {
            var selectors = this.options.selectors.itemSelected;
            if (withPartParent) {
                selectors += "," + this.options.selectors.itemPartSelected;
            }
            return this.element.findUntil(selectors, this.options.selectors.widget);
        },
        _selectSingle: function (single, notFireEvent, notCascade, notRevert) {
            var selectionChanged = false;
            var $item = this.getItemElem(single);
            if ($item.length) {
                selectionChanged = this._selectItemElem($item, notFireEvent, notCascade, notRevert) || selectionChanged;
            }

            return selectionChanged;
        },
        _deselectSingle: function (single, notFireEvent) {
            var $item = this.getItemElem(single);
            return this._deselectItemElems($item, notFireEvent);
        },
        append: function (itemData, isEdit, parentItem) {
            var that = this;

            var options = { position: 'append', isEdit: isEdit, relativeItem: parentItem };
            var $item = null;
            if ($.isArray(itemData)) {
                $.each(itemData, function (index, value) {
                    $item = that.bindItem(value, options);
                    if (parentItem) {
                        parentItem.removeClass(that.options.tree.cssClasses.leaf);
                    }
                });
            }
            else {
                $item = that.bindItem(itemData, options);
                if (parentItem) {
                    parentItem.removeClass(that.options.tree.cssClasses.leaf);
                }
            }

            return $item;
        },
        prepend: function (itemData, isEdit, parentItem) {
            var options = { position: 'prepend', isEdit: isEdit, relativeItem: parentItem };

            this.bindItem(itemData, options);
        },
        insert: function (itemData, isEdit, targetItem) {
            this.bindItem(itemData, { position: 'after', relativeItem: targetItem, isEdit: isEdit });
        },
        update: function (newItemData, $item) {
            this.bindItem(newItemData, { position: 'replace', relativeItem: $item, isEdit: false });
        },
        remove: function (removeData, notFireEvent) {
            var that = this;
            if ($.isArray(removeData)) {
                $.each(removeData, function (index, value) {
                    that._removeSingle(value, notFireEvent);
                });
            }
            else {
                that._removeSingle(removeData, notFireEvent);
            }
        },
        _removeSingle: function (single) {
            var $item = this.getItemElem(single);
            this._removeItem($item);
        },
        _removeItem: function ($item) {
            var that = this;
            that._trigger("beforeItemRemove", null, { itemElem: $item });
            if (!($item.attr("isnew") == "true")) {
                this.removedItemElems.push($item);
                this.removedItemDatas.push($item.data("itemInitData"));
            }
            if (that.options.type == 'tree') {
                var childrenItem = that._getChildren($item);
                if (childrenItem) {
                    childrenItem.remove();
                }
            }
            $item.remove();
            that._trigger("itemRemoved", null, { itemElem: $item });
            that._total--;
            if (that.options.pageable) {
                that._$pager.jpager('bind', { total: that._total });
            }
            that._addEmpty();
        },
        editItem: function ($item) {
            var alreadyInEdit = $item.attr("isedit") == true;
            if (alreadyInEdit) {
                return;
            }
            var itemData = $item.data("itemData");

            var $editedItem = this.bindItem(itemData, { position: "replace", isEdit: true, relativeItem: $item });
            $editedItem.data("inEdit", true);
        },
        cancelItem: function ($item) {
            var notInEdit = !($item.attr("isedit") == "true");
            if (notInEdit) {
                return;
            }
            if (!$item.data("inEdit")) {
                this._removeItem($item);
                return;
            }
            var newItemData = $item.data("itemData");

            this.bindItem(newItemData, { position: "replace", isEdit: false, relativeItem: $item });
        },
        saveItem: function ($item) {
            var notInEdit = !($item.attr("isedit") == "true");
            if (notInEdit) {
                return;
            }
            var newItemData = this.getItemData($item);
            this.updateItem($item, newItemData);
            return newItemData;
        },
        getItemData: function ($item, build, notDeep) {
            if (build) {
                return $.extend(!notDeep, {}, $item.data("itemInitData"), this.options.buildItemData($item));
            }
            var isEdit = $item.attr("isedit") == "true";
            if (isEdit) {
                return $.extend(!notDeep, {}, $item.data("itemInitData"), this.options.buildItemData($item));
            }
            else {
                return $item.data("itemData");
            }
        },
        getAll: function () {
            var that = this;
            var allItemElems = this._$itemContainer.findUntil(that.options.selectors.item, that.options.selectors.widget);
            var allItemDatas = [];
            allItemElems.each(function () {
                allItemDatas.push(that.getItemData($(this)));
            });

            return allItemDatas;

        },
        getSelected: function (withPartParent) {
            var that = this;

            var selectedItemDatas = [];
            var selectedItems = this._getSelectedItemElems(withPartParent);
            selectedItems.each(function () {
                selectedItemDatas.push(that.getItemData($(this)));
            });

            return selectedItemDatas;
        },
        getChanges: function (notDeep) {
            var that = this;
            var addedItemDataArray = [];
            var updatedItemDataArray = [];
            var newItemElems = this.getNewItems();
            newItemElems.each(function () {
                addedItemDataArray.push(that.getItemData($(this), undefined, notDeep));
            });
            var initItemElems = this.getInitItems();
            initItemElems.each(function () {
                var initData = $(this).data("itemInitData");
                var newData = that.getItemData($(this), undefined, notDeep);
                if (!$.jui.utils.jsonEqual(initData, newData)) {
                    updatedItemDataArray.push(newData);
                }
            });
            return {
                added: addedItemDataArray,
                updated: updatedItemDataArray,
                removed: that.removedItemDatas
            };
        },
        getItemElem: function (single) {
            var that = this, opts = that.options;
            var $item;
            if ($.jui.utils.isJqObj(single)) {
                $item = single;
            }
            else {
                var id = single;
                if ($.isPlainObject(single)) {
                    id = single[this.options.fields.key];
                }
                $item = $(that.options.selectors.item + '[data-item-key="' + id + '"]', that.element);

                if ($item.length == 0) {
                    if ($.isArray(that.popChildrenElems)) {
                        for (var i = 0; i < that.popChildrenElems.length; i++) {
                            $item = $(that.options.selectors.item + '[data-item-key="' + id + '"]', that.popChildrenElems[i]);
                            if ($item.length > 0) {
                                break;
                            }
                        }
                    }
                }
            }
            return $item;
        },
        getFirstLeaf: function () {
            var itemElem = this._$itemContainer.findUntil(this.options.tree.selectors.leaf, this.options.selectors.widget).first();
            var itemData = itemElem.data('itemData');

            return {
                itemElem: itemElem,
                itemData: itemData
            }
        },
        getAllItemElems: function () {
            var allItems = this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget);
            if ($.isArray(this.popChildrenElems)) {
                for (var i = 0; i < this.popChildrenElems.length; i++) {
                    allItems.add(this.popChildrenElems[i].findUntil(this.options.selectors.item, this.options.selectors.widget));
                }
            }

            return allItems;
        },
        getNewItems: function () {
            return this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget).filter('[isnew="true"]');
        },
        getInitItems: function () {
            return this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget).filter('[isnew="false"]');
        },
        getAllPrevItemElems: function ($item) {
            var that = this, opts = this.options;
            if (this.options.selectors.itemWrapper) {
                var $itemWrapper = this._getItemWrapper($item);
                var prevItemWrappers = $itemWrapper.prevAll();
                return prevItemWrappers.find(opts.selectors.item);
            }
            else {
                return $item.prevAll();
            }
        },
        getAllNextItemElems: function ($item) {
            var that = this, opts = this.options;
            if (this.options.selectors.itemWrapper) {
                var $itemWrapper = this._getItemWrapper($item);
                var prevItemWrappers = $itemWrapper.nextAll();
                return prevItemWrappers.find(opts.selectors.item);
            }
            else {
                return $item.nextAll();
            }
        },
        _toTreeData: function (sNodes) {
            var that = this;
            var opts = this.options;
            var i, l,
                key = opts.tree.fields.key,
                parentKey = opts.tree.fields.parentKey,
                childKey = opts.tree.fields.children;
            if (!key || key == "" || !sNodes) return [];

            if ($.isArray(sNodes)) {
                var r = [];
                var tmpMap = [];
                for (i = 0, l = sNodes.length; i < l; i++) {
                    tmpMap[sNodes[i][key]] = sNodes[i];
                }
                for (i = 0, l = sNodes.length; i < l; i++) {
                    if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
                        if (!tmpMap[sNodes[i][parentKey]][childKey])
                            tmpMap[sNodes[i][parentKey]][childKey] = [];
                        tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
                    } else {
                        r.push(sNodes[i]);
                    }
                }
                return r;
            } else {
                return [sNodes];
            }
        },
        _addEmpty: function () {
            var opts = this.options;
            if (!opts.templates.empty) {
                return;
            }
            if (this._total > 0) {
                return;
            }

            $($.jui.tmpl(opts.templates.empty, {})).appendTo(this._$itemContainer).addClass(opts.cssClasses.emptyItem);
        },
        _removeEmpty: function () {
            var opts = this.options;
            this._$itemContainer.find(opts.selectors.emptyItem).remove();
        },
        _refreshCheckerAllState: function () {
            if (this._$checkerAll === undefined) {
                return;
            }
            var allItemElems = this.getAllItemElems();
            var selectedItemElems = this._getSelectedItemElems();
            var allChecked = selectedItemElems.length == allItemElems.length;

            if (allChecked) {
                this._$checkerAll.addClass(this.options.cssClasses.checkerAllChecked);
            }
            else {
                this._$checkerAll.removeClass(this.options.cssClasses.checkerAllChecked);
            }
        },
        disableItem: function (single) {
            var $item = this.getItemElem(single);
            $item.addClass('jlist-item-disabled');
        },
        enableItem: function (single) {
            var $item = this.getItemElem(single);
            $item.removeClass('jlist-item-disabled');
        },
        disable: function () {
            var allItems = this.getAllItemElems();
            allItems.each(function(index, el){
                $(this).addClass('jlist-item-disabled');
            });
        },
        enable: function () {
            var allItems = this.getAllItemElems();
            allItems.each(function(index, el){
                $(this).removeClass('jlist-item-disabled');
            });
        }
    }));

}));