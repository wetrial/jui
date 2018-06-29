(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jlistMenu"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistTabs", $.jui.jlistMenu, {
        options: {
            mode: 'h',
            styleClass: 'jlistMenu-line',
            activeKey: null
        },
        _render: function () {
            var that = this, opts = this.options;

            this.element.addClass('jlistTabs');

            this._super();

            var eventPrefix = this.widgetEventPrefix.toLowerCase()

            this.element.bind(eventPrefix + "itemdeselected", function (event, ui) {
                var itemData = ui.itemData;
                var $selector = $('#' + itemData[opts.fields.key]);
                $selector.addClass('hide');
            });
            this.element.bind(eventPrefix + "itemselected", function (event, ui) {
                var itemData = ui.itemData;
                var $selector = $('#' + itemData[opts.fields.key]);
                if (itemData.route) {
                    var router = $selector.data('router');
                    if (!router) {
                        var routerOpts = itemData.route;
                        if (!$.isPlainObject(routerOpts)) {
                            routerOpts = { url: itemData.route };
                        }
                        router = $selector.jrouter(routerOpts).jrouter('instance');
                        $selector.data('router', router);
                    }
                    else {
                        if (itemData.cache == false) {
                            router.refresh();
                        }
                    }
                }
                $selector.removeClass('hide');
            });

            if (opts.activeKey) {
                this.element.bind(eventPrefix + "itemdatabound", function (event, ui) {
                    that.select(opts.activeKey);
                });
            }
        }
    });
}));