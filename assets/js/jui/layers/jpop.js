(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "./jlayer"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jpop", {
        options: {
            trigger: null,
            triggerType: 'click',
            layerElem: null,
            layer: {
                autoShow: false,
                align: 'bottom left',
                position: {
                    my: "left top",
                    at: "left bottom",
                    collision: "flipfit",
                    using: function (pos) {
                        var topOffset = $(this).css(pos).offset().top;
                        if (topOffset < 0) {
                            $(this).css("top", pos.top - topOffset);
                        }
                    }
                }
            },
            hideOnClickAnywhere: false
        },
        _create: function () {
            var that = this;
            var opts = this.options;

            if (opts.layerElem) {
                this.$layer = $(opts.layerElem);
            }
            if (!this.$layer || !this.$layer.length) {
                this.$layer = $("<div>");
            }

            if (this.options.trigger) {
                this.$trigger = $(this.options.trigger);
            }
            if (!this.$trigger || !this.$trigger.length) {
                this.$trigger = this.element;
            }

            this.$trigger.addClass('jpop-trigger');

            this.element.addClass("jpop");

            this.$layer.addClass("jpop-layer");

            opts.layer.follow = this.element;
            opts.relEl = this.$trigger;

            this.$layer.jlayer(opts.layer);
        },
        _init: function () {
            this._bindTrigger();
        },
        _bindTrigger: function () {
            var triggerType = this.options.triggerType;
            if (triggerType === 'click') {
                this._bindClick();
            } else {
                this._bindHover();
            }
        },
        _bindClick: function () {
            var that = this;
            var opts = this.options;
            this._on(this.$trigger, {
                click: function (e) {
                    if (that.$layer.jlayer('isShown')) {
                        that.$layer.jlayer('hide');
                        that._off(that.document, 'mousedown touchstart');
                    }
                    else {
                        that.$layer.jlayer('show');
                        that._on(that.document, {
                            'mousedown': $.proxy(docClickHandler, that)
                        })
                    }

                    function docClickHandler(e) {
                        if (opts.hideOnClickAnywhere || (!(e.target === $(that.options.relEl)[0]) && !$(e.target).closest(that.options.relEl).length && !($(e.target).closest(that.$layer).length))) {
                            that.$layer.jlayer('hide');

                            that._off(that.document, 'mousedown touchstart');
                        }
                    }
                }
            });
        },
        _bindHover: function () {
            var delay = 100;

            var showTimer, hideTimer;
            var that = this;
            this._on(this.$trigger, {
                mouseenter: function (e) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                    showTimer = setTimeout(function () {
                        that.$layer.jlayer('show');
                    }, delay);
                },
                mouseleave: leaveHandler
            });
            that.$layer.on("mouseenter", function () {
                clearTimeout(hideTimer);
            });
            that.$layer.on('mouseleave', leaveHandler);

            function leaveHandler(e) {
                clearTimeout(showTimer);
                showTimer = null;

                if (that.$layer.jlayer('isShown')) {
                    hideTimer = setTimeout(function () {
                        that.$layer.jlayer('hide');
                    }, delay);
                }
            }
        },
        _destroy: function () {
            this.$layer.jlayer('close');
        },
        hide: function () {
            this.$layer.jlayer('hide');
        },
        getLayer: function () {
            return this.$layer;
        }
    });
}));