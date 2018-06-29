'use strict';

(function (win) {
    requirejs.config({
        baseUrl: "/assets/js",
        paths: {
            "jquery": "jquery-1.11.3",
            "jqueryui": "jquery-ui",
            "juiall": "jui/jui",
            "jquerydatepicker": "i18n/datepicker-zh-CN",
            "slimscroll": "jquery.slimscroll.min",
            "mock": "mock"
        },
        "shim": {
            "slimscroll": ["jquery"]
        },
        urlArgs: "v=2.1.2"// + (new Date()).getTime()
    });

    require(['jquery', 'mock', 'jqueryui', 'juiall', 'jquerydatepicker', 'slimscroll'], function ($, Mock) {
        win.Mock = Mock;

        var config = {
            viewsDir: 'views'
        };

        $.router.start(config);

    });
})(window);
