(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jlistTabs"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistSteps", $.jui.jlistTabs, {
        options: {
            mode: 'h',
            styleClass: 'jlistMenu-line',
            activeKey: null
        },
        _render: function () {
            var that = this, opts = this.options;

            this.element.addClass('jlistSteps');

            this._super();

            var eventPrefix = this.widgetEventPrefix.toLowerCase()

            this.element.bind(eventPrefix + "itemselected", function (event, ui) {
                var itemElem = ui.itemElem;
                var allItems = that.getAllItemElems();
                var prevItems = that.getAllPrevItemElems(itemElem);
                allItems.removeClass('jlistSteps-success');
                prevItems.addClass('jlistSteps-success');
            });
        }
    });
}));