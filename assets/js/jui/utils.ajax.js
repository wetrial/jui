(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./utils",
            "./layers/jlayer.tip",
            "./layers/jlayer.modal"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.jui = $.jui || {};

    $.jui.loginPath = "";
    $.jui.accessDeniedPath = "/admin/#liteaf.membership/spa/auth/accessDenied";

    $.jui.ajax = function (userOptions) {
        userOptions = userOptions || {};

        var $loading = null;
        var $success = null;

        var options = $.extend(true, {
            loadingTip: {

            },
            successTip: {

            },
            errorTip: {
                tipMode: false,
                tipElem: null
            }
        }, userOptions);

        options.beforeSend = function () {
            if (options.loadingTip) {
                $loading = $.jui.tip.loading(options.loadingTip);
            }

            if (options.errorTip.tipElem != null) {
                options.errorTip.closeToHide = true;
                var errorTipInst = $(options.errorTip.tipElem).jlayer("instance");
                if (errorTipInst != undefined) {
                    errorTipInst.hide();
                }
            }

            userOptions.beforeSend && userOptions.beforeSend.apply(this, arguments);
        }

        options.success = function (ar) {
            $loading && $loading.close();

            if (ar && ar.Success == false) {
                if (options.errorTip) {
                    var tipOpts = $.extend(true, {}, options.errorTip);

                    var description;
                    if ($.isArray(ar.Errors) && ar.Errors.length) {
                        description = {
                            template: '<ul>{{each Errors as value}}<li>{{value}}</li>{{/each}}</ul>',
                            data: { Errors: ar.Errors }
                        };
                    }
                    tipOpts.message = ar.Message;
                    tipOpts.description = description;

                    if (ar.UnLogined) {
                        tipOpts.closed = function (e, edata) {
                            location.href = $.jui.loginPath;
                        }
                    }
                    if (ar.UnAuthed) {
                        tipOpts.closed = function (e, edata) {
                            location.href = $.jui.accessDeniedPath;
                        }
                    }
                    if (tipOpts.tipMode || !!tipOpts.tipElem) {
                        $.jui.tip.error(tipOpts);
                    }
                    else {
                        $.jui.alert.error(tipOpts);
                    }
                    return;
                }
            }
            else {
                if (options.successTip) {
                    $success = $.jui.tip.success(options.successTip);
                }
            }
            userOptions.success && userOptions.success.apply(this, arguments);

            if (ar && ar != null && ar.RedirectUrl) {
                top.location = ar.RedirectUrl;
            }
        }

        options.complete = function () {
            $loading && $loading.close();

            userOptions.complete && userOptions.complete.apply(this, arguments);
        };

        options.__responseHandled = true;

        return jQuery.ajax(options);
    };

    $.jui.postJson = function (userOptions) {
        userOptions = $.extend({}, userOptions, {
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            loading: {},
            notifySuccess: {}
        });

        if (userOptions.data && $.isPlainObject(userOptions.data) && userOptions.contentType == 'application/json') {
            userOptions.data = JSON.stringify(userOptions.data);
        }

        return $.jui.ajax(userOptions);
    }

    $.jui.getJson = function (userOptions) {
        userOptions = $.extend({}, userOptions, {
            type: 'GET',
            dataType: 'json'
        });

        return $.jui.ajax(userOptions);
    }

    $(document).ajaxComplete(function (e, xhr, settings) {

        try {
            var ar = $.parseJSON(xhr.responseText);
        }
        catch (e) {
            return;
        }

        if (ar && ar != null) {
            if (ar.UnLogined) {
                location.href = $.jui.loginPath;
            }
            if (ar.UnAuthed) {
                location.href = $.jui.accessDeniedPath;
            }
        }
    });

    $(document).ajaxError(function (e, xhr, settings) {

        try {
            var ar = $.parseJSON(xhr.responseText);
        }
        catch (e) {
            return;
        }

        if (ar && ar != null && ar.RedirectUrl) {
            top.location = ar.RedirectUrl;
        }

        if (ar && ar != null && ar.Message) {
            var msg = $.jui.utils.htmlEncode(ar.Message);
            msg = msg.replace(/\n/g, "<br>");

            var template = '<div class="modal">' +
                '<div class="modal-hd">' +
                '<div class="navbar">' +
                '<div class="navbar-hd"><h4>系统错误</h4></div>' +
                '<div class="navbar-ft"><span data-dismiss="jlayer" class="jlayer-close" id="btnClose"></span></div>' +
                '</div>' +
                '</div>' +
                '<div class="modal-bd">' +
                '<p>{{#msg}}</p>' +
                '</div>' +
                '<div class="modal-ft">' +
                '<button type="button" class="btn" data-role="cancel" data-dismiss="jlayer">关闭</button>' +
                '</div>' +
                '</div>';

            $.jui.modal({
                data: {
                    msg: msg
                },
                template: template
            });
        }
    });
}));