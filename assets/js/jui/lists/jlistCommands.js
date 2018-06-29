(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jlist"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistCommands", $.jui.jlist, {
        options: {
            fields: {
                key: "id",
                text: "text",
                icon: "icon",
                url: "url"
            },
            type: 'tree',
            target: null,
            mode: 'button',
            templates: {
                itemWrapper: '<li></li>',
                tree: {
                    children: '<ul class="box popbox menu tight"></ul>'
                }
            },
            selectable: {
                multiple: false,
                cascade: false,
                cascadeCancelParent: true,
                onlyleaf: false,
                selectOnClick: false,
                singleSelectCanRevert: false,
                checkAllElem: false
            },
            tree: {
                initCollapseLevel: 1,
                popChildren: true,
                popTriggerType: 'click',
                popAppendTo: 'body',
                isListData: false,
                fields: {
                    children: 'children',
                    parentKey: 'pid'
                },
                toggleOnClick: true
            },
            itemClick: function (event, ui) {
                event.preventDefault();
                event.stopPropagation();

                var itemData = ui.itemData;
                if (itemData.command && $.isFunction(itemData.command)) {
                    itemData.command.call(ui.inst, ui.inst.options.target);
                }
            }
        },
        _render: function () {
            var that = this, opts = this.options;

            this.element.addClass('jlistCommands');

            if (opts.mode == 'button') {
                this.element.addClass('list-inline');
                opts.styleClass = opts.styleClass || 'space tighter';
                this.element.addClass(opts.styleClass);
                opts.templates.item = opts.templates.item ||
                    '<button class="btn {{styleClass}} {{if disabled}}jlist-item-disabled{{/if}}"{{if disabled}} disabled="disabled"{{/if}}>{{if icon}}<i class="{{icon}}"></i>{{/if}} {{text}} {{if !notoggle}}<span class="jlist-item-toggle"></span>{{/if}}</button>';
                opts.templates.tree.subitem = opts.templates.tree.subitem ||
                    '<a class="{{if disabled}}jlist-item-disabled{{/if}}" href="{{if url}}{{url}}{{else}}javascript:void(0);{{/if}}">\
                        <span>{{if icon}}<i class="{{icon}}"></i> {{/if}}{{text}}</span>\
                    {{if !notoggle}}<span class="jlist-item-toggle"></span>{{/if}}</a>';
            }
            else if (opts.mode == 'menu-row') {
                this.element.addClass('menu-row');
                opts.styleClass = opts.styleClass || 'tight';
                this.element.addClass(opts.styleClass);
                opts.templates.item = opts.templates.item ||
                    '<a class="{{styleClass}}{{if disabled}} jlist-item-disabled{{/if}}"{{if onlyIcon}} title="{{text}}"{{/if}}>{{if icon}}<i class="{{icon}}"></i>{{/if}}{{if !onlyIcon}} {{text}}{{/if}}</a>';
            }

            this._super();
        }
    });
}));