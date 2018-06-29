(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jlayer"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.modal = function (options) {
        options = $.extend(true, {}, options, {
            modal: true,
            hideAnimate: 'fadeOutUp',
            showAnimate: 'fadeInDown',
            size: {
                maxHeight: 'fit'
            },
            fitElem: '.modal-bd',
            closeOnClickBackdrop: true
        });

        $layer = $("<div>");

        $layer.jlayer(options);

        return $layer;
    }
}));