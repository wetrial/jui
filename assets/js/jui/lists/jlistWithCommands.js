/************************************************************************
* commands extension for jlist                                        *
*************************************************************************/
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jlist",
            "./jlistMenu",
            "./jlistCommands"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    //Reference to base object members
    var base = {
        _jlistCreate: $.jui.jlist.prototype._render,
        _jlistMenuCreate: $.jui.jlistMenu.prototype._render
    };

    var extention = function (base) {
        return {

            options: {
                commands: null
            },

            _render: function () {
                var that = this, opts = this.options;

                if (opts.commands) {
                    this.element.bind((this.widgetEventPrefix + 'itemDataBound').toLowerCase(), function (event, ui) {
                        var itemElem = ui.itemElem;
                        var itemData = ui.itemData;
                        var $commands = itemElem.find('.commands');
                        opts.commands.target = ui;
                        $commands.jlistCommands(opts.commands);
                    });
                }

                //Call base method
                base.apply(this, arguments);
            }
        }
    };
    //extension members
    $.extend(true, $.jui.jlist.prototype, extention(base._jlistCreate));
    $.extend(true, $.jui.jlistMenu.prototype, extention(base._jlistMenuCreate));

}));