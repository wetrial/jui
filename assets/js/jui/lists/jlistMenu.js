(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jlist"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistMenu", $.jui.jlist, {
        options: {
            templates: {                
                itemWrapper: '<li></li>',
                tree: {
                    children: '<ul></ul>'
                }
            },
            mode: "v",
            fields: {
                key: "id",
                text: "text",
                icon: "icon",
                url: "url"
            },
            cssClasses: {
                menu: "jlistMenu",
                menuv: "menu",
                menuh: "menu-row"
            },
            selectable: {
                multiple: false,
                cascade: true,
                onlyleaf: false,
                selectOnClick: false
            },
            tree: {
                isListData: false,
                indent: 30,
                initCollapseLevel: false,
                fields: {
                    children: 'children',
                    parentKey: 'pid'
                },
                toggleOnClick: true
            },
            itemConverter: function (itemData) {
                itemData.text = itemData[this.options.fields.text];
                itemData.key = itemData[this.options.fields.key];

                return itemData;
            }
        },
        _render: function () {
            var opts = this.options;

            //this.element.addClass(opts.cssClasses.menu);
            if (opts.type == 'tree') {
                if (opts.mode == 'h') {
                    opts.templates.item = opts.templates.item ||
                        '<a class="{{if disabled}}jlist-item-disabled{{/if}}" href="{{if url}}{{url}}{{else}}javascript:void(0);{{/if}}">' +
                        '<span>{{if icon}}<i class="{{icon}}"></i> {{/if}}{{text}}</span> ' +
                        '{{if !notoggle}}<span class="jlist-item-toggle"></span>{{/if}}</a>';

                    this.options = opts = $.extend(true, {}, opts, {
                        templates: {
                            tree: {
                                children: '<ul class="box popbox menu tight"></ul>'
                            }
                        },
                        tree: {
                            initCollapseLevel: 1,
                            popChildren: true,
                            popTriggerType: 'click',
                            popAppendTo: 'body'
                        }
                    });

                }
                else {
                    opts.templates.item = opts.templates.item ||
                        '<a class="hcard {{if disabled}}jlist-item-disabled{{/if}}" href="{{if url}}{{url}}{{else}}javascript:void(0);{{/if}}">' +
                        '{{if icon}}<span class="hcard-hd"><i class="{{icon}}"></i></span>{{/if}}<span class="hcard-bd">{{text}}</span>' +
                        '{{if !notoggle}}<span class="hcard-ft"><span class="jlist-item-toggle"></span></span>{{/if}}</a>';
                }
            }
            else {
                opts.templates.item = opts.templates.item ||
                    '<a class="{{if disabled}}jlist-item-disabled{{/if}}" href="{{if url}}{{url}}{{else}}javascript:void(0);{{/if}}">' +
                    '<span>{{if icon}}<i class="{{icon}}"></i>{{/if}}{{text}}</span>' +
                    '</a>';
            }
            if (opts.mode == 'h') {
                this.element.addClass(opts.cssClasses.menuh);
            }
            else if (opts.mode == "v") {
                this.element.addClass(opts.cssClasses.menuv);
            }
            this.element.bind("jlistmenuitemcreated", function (event, ui) {
                if (ui.itemData.disabled) {
                    ui.itemElem.addClass("ui-state-disabled");
                }
            });

            this._super();
        }
    });

}));