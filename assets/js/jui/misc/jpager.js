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

    $.widget("jui.jpager", {
        options: {
            pageIndex: 1,
            pageSize: 10,
            total: 0,

            fields: {
                pageIndex: "pageIndex",
                pageSize: "pageSize"
            },

            displayItemCount: 5,
            edgeItemCount: 1,
            linkTo: "#",
            prevShowAlways: true,
            nextShowAlways: true,

            styleClass: "pagination",

            cssClasses: {
                widget: "jpager",
                itemContainer: "jpager-items",
                item: "jpager-item",
                itemSelected: "jpager-item-selected",
                info: "jpager-info",
            },
            selectors: {
                widget: ".jpager",
                itemContainer: ".jpager-items",
                item: ".jpager-item",
                info: ".jpager-info"
            },

            templates: {
                layout: '<div class="cell"><ul class="jpager-items"></ul></div><div class="jpager-info cell"></div><div class="cell-fit"></div>',
                item: '<li><a href="javascript:;">{{text}}</a></li>'
            },

            //Events
            pageChanged: function (event, data) { },

            //localization
            texts: {
                info: '每页{{pageSize}}条，共{{total}}条',
                prev: "上一页",
                next: "下一页",
                ellipse: "..."
            }
        },

        _$itemContainer: null,
        _$pagerInfo: null,
        _bound: false,

        _create: function () {
            var that = this;
            var opts = this.options;
            this.element.addClass(opts.cssClasses.widget);
            if (opts.templates.layout) {
                this.element.append(opts.templates.layout);
            }

            this._$itemContainer = this.element.find(opts.selectors.itemContainer);
            if (!this._$itemContainer.length) {
                this._$itemContainer = this.element.addClass(opts.cssClasses.itemContainer);
            }
            this._$pagerInfo = this.element.find(opts.selectors.info);
        },
        /*
        data:{ total, pageIndex, pageSize }
        */
        bind: function (data) {
            var pagerParams = $.extend({}, {
                total: this.options.total,
                pageIndex: this.options.pageIndex,
                pageSize: this.options.pageSize
            }, data);
            if (!this._bound) {
                this._bindData(pagerParams);
                this._bound = true;
            }
            else {
                if (pagerParams.total != this.options.total
                    || pagerParams.pageIndex != this.options.pageIndex
                    || pagerParams.pageSize != this.options.pageSize) {

                    this._bindData(pagerParams);
                }
            }
        },
        _bindData: function (pagerParams) {
            this.options = $.extend(this.options, pagerParams);
            this._createPageItems();
            this._createPagerInfo();
        },
        _createPageItems: function () {
            this._$itemContainer.empty();
            var that = this;
            var opts = this.options;
            var pageIndex = opts.pageIndex;
            var interval = this._getInterval();
            var pageCount = this._getPageCount();
            // 这个辅助函数返回一个处理函数调用有着正确page_id的pageSelected。
            var getClickHandler = function (page_id) {
                return function (evt) { return that._pageSelected(page_id, evt); }
            }
            var appendItem = function (page_id, appendOpts) {
                page_id = page_id < 1 ? 1 : (page_id < pageCount ? page_id : pageCount);
                appendOpts = jQuery.extend({ text: page_id, classes: "" }, appendOpts || {});
                var lnk = $($.jui.tmpl(opts.templates.item, { text: appendOpts.text }))
                    .addClass(opts.cssClasses.item);
                if (!appendOpts.space) {
                    if (page_id == pageIndex) {
                        lnk.addClass("active");
                        lnk.addClass(opts.cssClasses.itemSelected);
                    } else {
                        lnk.bind("click", getClickHandler(page_id))
                        //						.attr('href', opts.linkTo.replace(/__id__/, page_id));
                    }
                }
                if (appendOpts.classes) { lnk.addClass(appendOpts.classes); }
                that._$itemContainer.append(lnk);
            }
            // 产生"Previous"-链接
            if (opts.texts.prev && (pageIndex > 1 || opts.prevShowAlways)) {
                appendItem(pageIndex - 1, { text: opts.texts.prev, classes: "prev" });
            }
            // 产生起始点
            if (interval[0] > 1 && opts.edgeItemCount > 0) {
                var end = Math.min(opts.edgeItemCount, interval[0] - 1);
                for (var i = 1; i <= end; i++) {
                    appendItem(i);
                }
                if (opts.edgeItemCount < interval[0] - 1 && opts.texts.ellipse) {
                    appendItem(null, { text: opts.texts.ellipse, classes: "space", space: true });
                }
            }
            // 产生内部的那些链接
            for (var i = interval[0]; i <= interval[1]; i++) {
                appendItem(i);
            }
            // 产生结束点
            if (interval[1] < pageCount && opts.edgeItemCount > 0) {
                if (pageCount - opts.edgeItemCount > interval[1] && opts.texts.ellipse) {
                    appendItem(null, { text: opts.texts.ellipse, classes: "space", space: true });
                }
                var begin = Math.max(pageCount - opts.edgeItemCount + 1, interval[1]);
                for (var i = begin; i <= pageCount; i++) {
                    appendItem(i);
                }

            }
            // 产生 "Next"-链接
            if (opts.texts.next && (pageIndex < pageCount || opts.nextShowAlways)) {
                appendItem(pageIndex + 1, { text: opts.texts.next, classes: "next" });
            }
        },
        _createPagerInfo: function () {
            if (this._$pagerInfo.length) {
                var pagerInfo = $.jui.tmpl(this.options.texts.info, { total: this.options.total, pageSize: this.options.pageSize });
                this._$pagerInfo.html(pagerInfo);
            }
        },
        /**
        * 极端分页的起始和结束点，取决于pageIndex 和 displayItemCount.
        * @返回 {数组(Array)}
        */
        _getInterval: function () {
            var opts = this.options;
            var pageIndex = opts.pageIndex;
            var displayItemHalf = Math.floor(opts.displayItemCount / 2);
            var pageCount = this._getPageCount();
            var upper_limit = pageCount - opts.displayItemCount;
            var start = pageIndex > displayItemHalf ? Math.max(Math.min(pageIndex - displayItemHalf, upper_limit), 1) : 1;
            var end = pageIndex > displayItemHalf ? Math.min(pageIndex + displayItemHalf, pageCount) : Math.min(opts.displayItemCount, pageCount);
            return [start, end];
        },
        _getPageCount: function () {
            return Math.ceil(this.options.total / this.options.pageSize);
        },
        _pageSelected: function (page_id) {
            this.options.pageIndex = page_id;
            this._createPageItems();
            var continuePropagation = this._trigger("pageChanged", null, { pageIndex: this.options.pageIndex, pageSize: this.options.pageSize });
            if (!continuePropagation) {
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                else {
                    evt.cancelBubble = true;
                }
            }
            return continuePropagation;
        }
    });

}));