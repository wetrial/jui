(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jcollapse", {
        options: {
            trigger: '.jcollapse-trigger',
            target: '.jcollapse-target',
            triggerType: 'click',
            icons: {
                on: 'fa fa-angle-up',
                off: 'fa fa-angle-down'
            },
            multiple: false,
            active: false
        },

        _init: function () {
            var that = this, opts = this.options;

            this.$trigger = this.element.find(this.options.trigger);
            this.$target = this.element.find(this.options.target);

            this.$trigger.each(function (index, item) {
                var $triggerItem = $(item);
                var $targetItem = that.$target.eq(index);
                var $icon = $triggerItem.find('.jcollapse-icon');
                $icon.addClass(opts.icons.off);
                var events = {};
                events[opts.triggerType] = function (e) {
                    var currentOn = $triggerItem.is('.jcollapse-trigger-on');
                    if (currentOn) {
                        $triggerItem.removeClass('jcollapse-trigger-on');
                        $targetItem.removeClass('jcollapse-on');
                        $icon.removeClass(opts.icons.on).addClass(opts.icons.off);
                    }
                    else {
                        if (!opts.multiple) {
                            that.$trigger.filter('.jcollapse-trigger-on').each(function () {
                                $(this).removeClass('jcollapse-trigger-on');
                                $(this).find('.jcollapse-icon').removeClass(opts.icons.on).addClass(opts.icons.off);
                            });
                            that.$target.removeClass('jcollapse-on');
                        }
                        $triggerItem.addClass('jcollapse-trigger-on');
                        $targetItem.addClass('jcollapse-on');
                        that._trigger('beforeShow', e, { trigger: $triggerItem, target: $targetItem });
                        $icon.removeClass(opts.icons.off).addClass(opts.icons.on);
                    }
                }
                that._off($triggerItem, opts.triggerType);
                that._on($triggerItem, events);
            });

            if (opts.active !== false) {
                this.$trigger.eq(opts.active).trigger(opts.triggerType);
            }
        }
    });
}));