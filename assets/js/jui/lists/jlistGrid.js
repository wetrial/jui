(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
			"jquery",
            "jqueryui",
            "./jlist",
            "../utils",
            "../misc/jpager",
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jlistGrid", $.jui.jlist, {
        options: {
            templates: {
                colgroup: null,
                thead: null
            },
            height: null,
            tableStyle: null
        },
        _create: function () {
            var that = this;
            var opts = this.options;
            this.element.addClass("jlist-grid");
            this.$header = $("<div>").addClass("jlist-grid-header").appendTo(this.element);
            this.$body = $("<div>").addClass("jlist-grid-body").appendTo(this.element);
            this.$footer = $("<div>").addClass("jlist-grid-footer").appendTo(this.element);

            this.$headerTable = $('<table class="table"></table>').appendTo(this.$header);
            this.$bodyTable = $("<table></table>").appendTo(this.$body)
                .addClass("table");

            var colgroup = $.jui.tmpl(opts.templates.colgroup, {});
            var $colgroup = $(colgroup).appendTo(this.$headerTable);

            var tableHeader = $.jui.tmpl(opts.templates.thead, {});
            var $tableHeader = $(tableHeader).appendTo(this.$headerTable);

            $(colgroup).appendTo(this.$bodyTable);
            $('<tbody class="jlist-items")></tbody>').appendTo(this.$bodyTable);

            if (opts.templates.footer) {
                $($.jui.tmpl(opts.templates.footer, {})).appendTo(this.$footer);
            }

            if (opts.tableStyle) {
                this.$headerTable.addClass(opts.tableStyle);
                this.$bodyTable.addClass(opts.tableStyle);
            }
            if (opts.pageable) {
                if (this.$footer.find(opts.selectors.pager).length == 0) {
                    $('<div class="jlist-pager"></div>').appendTo(this.$footer);
                }
            }

            if (opts.height) {
                that._setBodyHeight(opts.height);
                that.element.bind("jlistgriddatabound", function () {
                    that._setBodyHeight(opts.height);
                });

                $(window).on("resize", function () {
                    that._setBodyHeight(opts.height);
                });
            }

            that._scrollBody();
            this._super();
        },

        _setBodyHeight: function (height) {
            var p = this.element.parent();
            if (height == "fit") {
                var pMarginTop = parseFloat(p.css("margin-top"));
                if (!pMarginTop) {
                    pMarginTop = 0;
                }
                var pMarginBottom = parseFloat(p.css("margin-bottom"));
                if (!pMarginBottom) {
                    pMarginBottom = 0;
                }
                height = $(window).height() - p.offset().top - pMarginTop - pMarginBottom;
            }
            if (height < 100) {
                height = 100;
            }
            p.outerHeight(height);
            this.element.outerHeight(p.height());

            var headerHeight = this.$header.outerHeight(true);
            var footerHeight = this.$footer.outerHeight(true);

            var bodyHeight = this.element.height() - headerHeight - footerHeight;

            this.$body.innerHeight(bodyHeight, true);
        },

        _scrollBody: function () {
            var that = this;
            this.$body.on("scroll", function () {
                var n = that.$body.scrollLeft();
                that.$headerTable.css('left', -n);
            });
        }
    });

}));