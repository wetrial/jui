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
    $.jui.tip = function (options) {
        var tipInst = null;

        options = $.extend(true, {}, {
            appendTo: 'body',
            follow: null,
            type: null,
            icon: null,
            message: null,
            duration: 2,
            showClose: false,
            tipElem: null,
            position: {
                my: "center center",
                at: "center center",
                of: window
            },
            closeToHide: false,
            template: '<div class="jtip-inner">'
            + '{{if icon}}<div class="jtip-icon"><i class="{{icon}}"></i></div>{{/if}}'
            + '{{if message}}<div class="jtip-message" name="message"></div>{{/if}}'
            + '{{if commands}}<ul class="jtip-commands" name="commands"></ul>{{/if}}'
            + '</div>',
            data: {
                message: options.message,
                description: options.description,
                icon: options.icon,
                showClose: options.showClose,
                commands: options.commands
            }
        }, options, {
                modal: false
            });



        var components = [];
        var messageComp = { name: 'message', widget: 'jtmpl' };
        if (typeof options.message === 'string') {
            messageComp.template = options.message;
        }
        else {
            messageComp = $.extend(true, {}, messageComp, options.message);
        }

        components.push(messageComp);

        var commandsComp = null;

        if (options.showClose) {
            var closeBtn = {
                icon: 'fa fa-remove', styleClass: 'btn-link',
                command: function (target) { options.closeToHide ? target.hide() : target.close(); }
            };
            if (options.commands) {
                options.commands.data.push(closeBtn);
            }
            else {
                options.commands = { data: [closeBtn] };
            }
        }

        var commandsComp = null
        if (options.commands) {
            commandsComp = { name: 'commands', widget: 'jlistCommands', itemStyleClass: 'btn-link' };

            commandsComp = $.extend(true, {}, commandsComp, options.commands);

            components.push(commandsComp);
        }

        options.data.commands = options.commands;

        options.components = components;

        var $tip = $('<div class="jtip">');

        if (options.tipElem) {
            $tip = $(options.tipElem).addClass('jtip');
            options.appendTo = null;
            options.insertAfter = null;
            options.position = null;
        }

        if (options.type) {
            $tip.addClass('jtip-' + options.type);
        }

        $tip.jlayer(options);

        tipInst = $tip.jlayer('instance');

        commandsComp != null && (tipInst.$commands.options.target = tipInst);

        if (options.duration) {
            setTimeout(function () {
                tipInst.close();
            }, 1000 * options.duration);
        }

        tipInst.message = function (options) {
            var jtmplOpts = options;
            if (typeof options === 'string') {
                jtmplOpts = { template: options };
            }
            this.$message.refresh(jtmplOpts);
            this.setPosition();
        }

        return tipInst;
    }

    $.jui.tip.info = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'info',
            icon: 'fa fa-info-circle'
        }, options);

        return $.jui.tip(options);
    }

    $.jui.tip.success = function (options) {
        options = options || {};
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options.icon = options.icon || 'fa fa-check-circle fa-2x';

        if (!options.message) {
            options.styleClass = 'jtip-nobg';
        }

        options = $.extend(true, {}, {
            type: 'success',
            hideAnimate: 'fadeOutUp',
            duration: 0.5
        }, options);

        return $.jui.tip(options);
    }

    $.jui.tip.warning = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'warning',
            icon: 'fa fa-exclamation-circle',
            duration: false,
            showClose: true
        }, options);

        return $.jui.tip(options);
    }

    $.jui.tip.error = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'error',
            icon: 'fa fa-times-circle',
            duration: false,
            showClose: true
        }, options);

        return $.jui.tip(options);
    }

    $.jui.tip.loading = function (loadingOptions) {
        loadingOptions = loadingOptions || {};
        var options = null;
        if (typeof loadingOptions === 'string') {
            options = {
                message: loadingOptions
            }
        }
        else{
            options = $.extend(true, {}, loadingOptions);
        }

        if (!options.icon) {
            var img = options.img || '<img src="/assets/img/loading.gif"></img>';
            if (options.message) {
                options.message = img + ' ' + options.message;
            }
            else {
                options.message = img;
            }
        }

        options = $.extend(true, {}, {
            type: 'loading',
            styleClass: 'jtip-nobg',
            backdrop: true,
            backdropBackground: '#ccc',
            backdropOpacity: 0.3,
            duration: false
        }, options);

        return $.jui.tip(options);
    }
}));