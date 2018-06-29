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
    $.jui.alert = function (options) {
        var alertInst = null;

        options = $.extend(true, {}, {
            appendTo: 'body',
            follow: null,
            type: null,
            icon: null,
            message: null,
            description: null,
            showClose: true,
            backdrop: true,
            size: {
                maxWidth: 416
            },
            position: {
                my: "center center",
                at: "center center",
                of: window
            },
            template: '<div class="jalert jalert-{{type}}">'
            + '<div class="jalert-content-wrapper">'
            + '<div class="jalert-icon"><i class="{{icon}}"></i></div>'
            + '<div class="jalert-content">'
            + '{{if message}}<div class="jalert-message" name="message"></div>{{/if}}'
            + '{{if description}}<div class="jalert-description" name="description">{{#description}}</div>{{/if}}'
            + '</div>'
            + '</div>'
            + '{{if commands}}<ul class="jalert-commands" name="commands"></ul>{{/if}}'
            + '</div>'
            + '{{if showClose}}<div class="jalert-close"><span class="jlayer-close" data-dismiss="jlayer" style="display: block;"></span></div>{{/if}}',

        }, options, {
                modal: false
            });

        options.data = {
            type: options.type,
            message: options.message,
            description: options.description,
            icon: options.icon,
            showClose: options.showClose,
            commands: options.commands
        }

        var components = [];
        if (options.message) {
            var messageComp = { name: 'message', widget: 'jtmpl' };
            if (typeof options.message === 'string') {
                messageComp.template = options.message;
            }
            else {
                messageComp = $.extend(true, {}, messageComp, options.message);
            }

            components.push(messageComp);
        }

        if (options.description) {
            var descriptionComp = { name: 'description', widget: 'jtmpl' };
            if (typeof options.description === 'string') {
                descriptionComp.template = options.description;
            }
            else {
                descriptionComp = $.extend(true, {}, descriptionComp, options.description);
            }

            components.push(descriptionComp);
        }

        var commandsComp = null;
        if (options.commands) {
            commandsComp = { name: 'commands', widget: 'jlistCommands' };

            commandsComp = $.extend(true, {}, commandsComp, options.commands);
            components.push(commandsComp);
        }

        options.components = components;

        alertInst = $('<div>').jlayer(options).jlayer('instance');

        commandsComp != null && (alertInst.$commands.options.target = alertInst);

        return alertInst;
    }

    $.jui.alert.info = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'info',
            icon: 'fa fa-info-circle',
            commands: {
                data: [
                    { text: '确定', styleClass: 'bg-primary', command: function (target) { target.close(); } }
                ]
            }
        }, options);

        return $.jui.alert(options);
    }

    $.jui.alert.success = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'success',
            icon: 'fa fa-check-circle',
            commands: {
                data: [
                    { text: '确定', styleClass: 'bg-primary', command: function (target) { target.close(); } }
                ]
            }
        }, options);

        return $.jui.alert(options);
    }

    $.jui.alert.warning = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, options, {
            type: 'warning',
            icon: 'fa fa-exclamation-circle',
            commands: {
                data: [
                    { text: '确定', styleClass: 'bg-primary', command: function (target) { target.close(); } }
                ]
            }
        });

        return $.jui.alert(options);
    }

    $.jui.alert.error = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, options, {
            type: 'error',
            icon: 'fa fa-times-circle',
            duration: false,
            showClose: true,
            commands: {
                data: [
                    { text: '确定', styleClass: 'bg-primary', command: function (target) { target.close(); } }
                ]
            }
        });

        return $.jui.alert(options);
    }

    $.jui.alert.confirm = function (options) {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }

        options = $.extend(true, {}, {
            type: 'confirm',
            icon: 'fa fa-question-circle',
            showClose: true,
            onOk: null,
            commands: {
                data: [
                    {
                        text: '确定', styleClass: 'bg-primary',
                        command: function (target) {
                            target.close();
                            if (target && $.isFunction(target.options.onOk)) {
                                target.options.onOk();
                            }
                        }
                    },
                    { text: '取消', command: function (target) { target.close(); } }
                ]
            }
        }, options);


        return $.jui.alert(options);
    }
}));