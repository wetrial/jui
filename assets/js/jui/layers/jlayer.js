(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            '../jcomponent',
            '../mixins/templateMixin',
            '../mixins/dataMixin',
            '../mixins/compositMixin',
            "../spa"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    var Popup = {};
    Popup.zIndex = 2009;

    $.widget("jui.jlayer", $.jui.jcomponent, $.extend(true, {}, $.jui.templateMixin, $.jui.compositMixin, $.jui.dataMixin, {
        options: {
            appendTo: 'body',
            insertAfter: null,

            modal: false,

            asHtml: true,

            backdrop: false,
            closeOnClickBackdrop: false,
            backdropBackground: '#000',
            backdropOpacity: 0.5,

            hideOnClickDoc: false,
            closeOnClickDoc: false,

            autoRender: true,
            autoShow: true,

            showAnimate: null,
            hideAnimate: null,

            fitElem: '',

            follow: null,
            align: null,

            position: null,
            size: {
                width: null,
                height: null,
                minWidth: 'none',
                minHeight: 'none',
                maxWidth: 'none',
                maxHeight: 'none'
            },

            attachElem: null
        },
        _render: function () {
            var that = this, opts = this.options;

            this._rendered = false;

            this.$body = $('body');
            this.dismiss = '[data-dismiss="jlayer"]';


            this.element.addClass("jlayer");

            this.$wrapper = this.element;

            if (opts.modal) {
                this.$wrapper = $('<div class="jlayer-modal"></div>').hide();
                this.element.appendTo(this.$wrapper);
                this.$wrapper.appendTo('body');
            }
            else {
                this.element.hide();
                if (opts.align) {
                    opts.position = {
                        of: window, collision: "flipfit",
                        using: function (pos) {
                            var topOffset = $(this).css(pos).offset().top;
                            if (topOffset < 0) {
                                $(this).css("top", pos.top - topOffset);
                            }
                        }
                    };


                    var arr = opts.align.split(' ');
                    if (arr.length === 1) {
                        arr[1] = 'center';
                    }
                    if (opts.follow && !opts.followInner) {
                        opts.position.of = $(opts.follow);

                        var myArr = ['center', 'center'];
                        var atArr = ['center', 'center'];

                        if (arr[1] == 'left') {
                            myArr[0] = 'left';
                            atArr[0] = 'left';
                        }
                        else if (arr[1] == 'right') {
                            myArr[0] = 'right';
                            atArr[0] = 'right';
                        }
                        else if (arr[1] == 'top') {
                            myArr[1] = 'top';
                            atArr[1] = 'top';
                        }
                        else if (arr[1] == 'bottom') {
                            myArr[1] = 'bottom';
                            atArr[1] = 'bottom';
                        }

                        if (arr[0] == 'top') {
                            myArr[1] = 'bottom';
                            atArr[1] = 'top';
                        }
                        else if (arr[0] == 'bottom') {
                            myArr[1] = 'top';
                            atArr[1] = 'bottom';
                        }
                        else if (arr[0] == 'left') {
                            myArr[0] = 'right';
                            atArr[0] = 'left';
                        }
                        else if (arr[0] == 'right') {
                            myArr[0] = 'left';
                            atArr[0] = 'right';
                        }

                        opts.position.my = myArr[0] + ' ' + myArr[1];
                        opts.position.at = atArr[0] + ' ' + atArr[1];
                    }
                    else {
                        var rhorizontal = /left|center|right/;
                        var rvertical = /top|center|bottom/;
                        var pos = opts.align.split(' ');
                        if (pos.length === 1) {
                            pos = rhorizontal.test(pos[0]) ?
                                pos.concat(["center"]) :
                                rvertical.test(pos[0]) ?
                                    ["center"].concat(pos) :
                                    ["center", "center"];
                        }
                        pos[0] = rhorizontal.test(pos[0]) ? pos[0] : "center";
                        pos[1] = rvertical.test(pos[1]) ? pos[1] : "center";

                        opts.position.my = pos[0] + ' ' + pos[1];
                        if (opts.follow) {
                            opts.position.of = $(opts.follow);
                        }
                        else {
                            opts.position.at = pos[0] + ' ' + pos[1];
                        }

                        opts.position.my = pos[0] + ' ' + pos[1];
                        opts.position.at = pos[0] + ' ' + pos[1];
                    }
                }

                if (opts.position) {
                    this.element.css('position', opts.fixed ? 'fixed' : 'absolute');
                    if (opts.follow) {
                        opts.position.of = $(opts.follow);
                    }
                    else {
                        if (opts.appendTo && opts.appendTo != 'body') {
                            opts.position.of = opts.appendTo;
                        }
                        else {
                            opts.position.of = window;
                        }
                    }
                }

                this.$appendTo = $(opts.appendTo);
                this.appendToIsBody = this.$appendTo.is("body");
                this.$backdrop = $('<div class="jlayer-backdrop" style="display:none;" />');

                this._isShown = false;

                if (opts.appendTo) {
                    this._on(true, $(opts.appendTo), {
                        remove: function (event) {
                            if (event.target === $(opts.appendTo)[0]) {
                                if (that) {
                                    that.close();
                                }
                            }
                        }
                    });
                }

                if (opts.insertAfter) {
                    this.element.insertAfter(opts.insertAfter);
                }
                else if (opts.appendTo) {
                    this.element.appendTo(opts.appendTo);
                }

                if (opts.backdrop) {
                    this.setBackdrop();
                }

                this.element.find(that.dismiss).on('click', function () {
                    if (that.options.modal) {
                        that.close()
                    }
                    else {
                        that.hide();
                    }
                });
            }

            if (opts.attachElem) {
                this._on(true, $(opts.attachElem), {
                    remove: function (event) {
                        if (event.target === $(opts.attachElem)[0]) {
                            if (that) {
                                that.close();
                            }
                        }
                    }
                });
            }
        },
        _init: function () {
            if (this.options.autoRender) {
                this.refresh(null, this.options.autoShow);
            }
        },
        refresh: function (options, show) {
            if (options) {
                this.options = $.extend(this.options, options);
            }
            var that = this, opts = this.options;

            if (opts.url) {
                this.element.jrouter({
                    url: opts.url,
                    data: opts.data,
                    viewOptions: {
                        properties: {
                            layer: that
                        },
                        afterRender: function (event, eventData) {
                            that.element.find(that.dismiss).on('click', function () {
                                if (that.options.modal) {
                                    that.close()
                                }
                                else {
                                    that.hide();
                                }
                            });

                            that._rendered = true;

                            if (show) {
                                that.show();
                            }
                        }
                    }
                });
            }
            else {
                that._getTemplate(function () {
                    that._getData(function () {
                        that.__beforeRender();

                        var content = this.template;
                        if (this.template && this.data) {
                            content = $.jui.tmpl(this.template, this.data);
                        }

                        if (opts.asHtml) {
                            that.element.html(content);
                        }
                        else {
                            that.element.text(content);
                        }

                        that.element.find(that.dismiss).on('click', function () {
                            if (that.options.modal) {
                                that.close()
                            }
                            else {
                                that.hide();
                            }
                        });

                        that._renderChildren();

                        that._rendered = true;

                        if (show) {
                            that.show();
                        }

                        that.__afterRender();
                    });
                });
            }
        },
        show: function () {
            var that = this;
            if (!this._rendered) {
                this.refresh(null, true);

                return;
            }

            this._trigger('showing', null, null);
            this.setSize();
            this.setPosition();
            this.__show();
            this._focus();

            if (this.options.position || this.options.modal) {
                that._off(that.window, 'resize');
                that._on(that.window, {
                    'resize': function () {
                        if (that._isShown) {
                            that.setSize();
                            that.setPosition();
                        }
                    }
                });
            }
        },
        __show: function () {
            var that = this;
            if (!this._isShown) {
                this.setzIndex();
                if (this.options.backdrop) {
                    this.$backdrop.show();
                }

                if (this.options.modal) {
                    this.checkScrollbar();
                    this.setScrollbar();
                }

                if (this.options.showAnimate) {
                    this.$wrapper.addClass(this.options.showAnimate + ' animated');
                }

                this._show(this.$wrapper, this.options.show, function () {
                    that.$wrapper.removeClass(that.options.showAnimate + ' animated');

                    that._trigger("shown", null);

                    that._docClickHandler();
                });
            }
            this._isShown = true;
        },
        hide: function (result) {
            var that = this;
            if (result !== undefined) {
                that.returnValue = result;
            }

            this.$backdrop.hide();
            if (this.$appendTo.data("container.static")) {
                this.$appendTo.css("position", "");
            }
            this._isShown = false;

            this._hide(this.$wrapper, this.options.hide, function () {
                that._trigger('hidden', null, result);
            });

            that._off(that.window, 'resize');
        },
        isShown: function () {
            return this._isShown;
        },
        close: function (result) {
            var that = this;
            if (result !== undefined) {
                that.returnValue = result;
            }

            var transition = $.support.transition && this.options.hideAnimate != null;

            if (transition) {
                this.element.addClass(this.options.hideAnimate + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                    that._close(result);
                });
            }
            else {
                this._close(result);
            }
        },
        _close: function (result) {
            this._trigger('closed', null, { result: result });
            this._off(this.window, 'resize');

            this.$wrapper.remove();

            if (this.options.modal) {
                var modalCount = this.$body.data('modalCount');
                if (modalCount) {
                    modalCount--;
                    this.$body.data('modalCount', modalCount);
                    if (modalCount == 0) {
                        this.resetScrollbar();
                    }
                }
            }

            if (this.options.backdrop) {
                this.$backdrop.remove();
                if (this.$appendTo.data("container.static")) {
                    this.$appendTo.css("position", null);
                }
            }
        },
        setSize: function () {
            var that = this, opts = this.options;

            this.$fitElem = this.element.find(opts.fitElem);

            this.hasFitElem = this.$fitElem.length > 0;

            var size = opts.size;
            var height = size.height;

            if (this.hasFitElem) {
                height = 'auto';

                this.$fitElem.show().css({
                    width: "auto",
                    minHeight: 0,
                    maxHeight: "none",
                    height: 0,
                    boxSizing: 'content-box'
                });

                var nonContentHeight = this.element.css({
                    height: "auto",
                    width: size.width
                }).outerHeight();

                var parentHeight;

                if (typeof size.height === 'number') {
                    parentHeight = size.height;
                } else {
                    parentHeight = opts.modal || that.$appendTo.is('body') ? $(window).height() : that.$appendTo.height();
                }

                this.$fitElem.css('maxHeight', parentHeight - nonContentHeight);

                this.$fitElem.css('height', 'auto');
            }


            if (typeof size.maxWidth === 'number' && typeof size.minWidth === 'number') {
                size.maxWidth = Math.max(size.maxWidth, size.minWidth);
            }

            if (typeof size.width === 'number') {
                size.minWidth = 'none';

                if (typeof size.maxWidth === 'number') {
                    if (size.maxWidth > size.width) {
                        size.maxWidth = size.width;
                    }
                }
            }

            this.element.css({
                'maxWidth': size.maxWidth,
                'minWidth': size.minWidth,
                'maxHeight': size.maxHeight,
                'minHeight': size.minHeight,
                'width': size.width,
                'height': size.height
            });

            this._trigger('sized', null, null);
        },
        setPosition: function () {
            if (!this.options.modal) {
                if (this.options.position) {
                    // Need to show the dialog to get the actual offset in the position plugin
                    var isVisible = this.element.is(":visible");
                    if (!isVisible) {
                        this.element.show();
                    }

                    this.element.position(this.options.position);

                    if (!isVisible) {
                        this.element.hide();
                    }

                    if (!this.appendToIsBody) {
                        this.$backdrop.css({
                            position: 'absolute',
                            width: this.$appendTo.width() + 'px',
                            height: this.$appendTo.height() + 'px'
                        });
                    }
                }
            }
        },
        setzIndex: function () {
            var index = Popup.zIndex++;
            this.$wrapper.css('zIndex', index);
            if (this.options.backdrop) {
                this.$backdrop.css('zIndex', index - 1);
            }
            this.zIndex = index;
        },
        setBackdrop: function () {
            var that = this;
            var opts = this.options;

            var backdrop = this.$backdrop;
            var backdropCss = {
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                userSelect: 'none',
                opacity: 0,
                background: this.options.backdropBackground
            };
            if (!this.appendToIsBody) {
                $.extend(backdropCss, {
                    position: 'absolute',
                    width: this.$appendTo.width() + 'px',
                    height: this.$appendTo.height() + 'px'
                });

                if (this.$appendTo.css("position") == 'static') {
                    this.$appendTo.css("position", "relative");
                    this.$appendTo.data('container.static', true);
                }
            }
            backdrop.css(backdropCss)
                .animate({ opacity: this.options.backdropOpacity }, 150)
                .insertAfter(this.element)

                // 锁住模态对话框的 tab 简单办法
                // 甚至可以避免焦点落入对话框外的 iframe 中
                .attr({ tabindex: '0' });

            if (opts.closeOnClickBackdrop) {
                that._on(backdrop, {
                    'click': function (e) {
                        if (e.target !== e.currentTarget) return
                        that.close();
                    }
                })
            }
        },
        _focus: function () {
            var $focus = this.element.find("[autofocus]");
            $focus.focus();
            $focus.eq(0).trigger("focus");
        },
        getBackdrop: function () {
            return this.$backdrop;
        },
        _docClickHandler: function () {
            var that = this;
            if (that.options.closeOnClickDoc) {
                that._on(that.document, {
                    'mousedown': function (e) {
                        var $closestLayer = $(e.target).closest('.jlayer');
                        if ($closestLayer.length) {
                            var idx = $closestLayer.jlayer('instance').zIndex;
                            if (idx < that.zIndex) {
                                that.close();

                                that._off(that.document, 'mousedown touchstart');
                            }
                        }
                        else {
                            that.close();

                            that._off(that.document, 'mousedown touchstart');
                        }
                    }
                });
            }
            if (this.options.hideOnClickDoc) {
                this._on(this.document, {
                    'mousedown': function (e) {
                        var $closestLayer = $(e.target).closest('.jlayer');
                        if ($closestLayer.length) {
                            var idx = $closestLayer.jlayer('instance').zIndex;
                            if (idx < that.zIndex) {
                                that.hide();

                                that._off(that.document, 'mousedown touchstart');
                            }
                        }
                        else {
                            that.hide();

                            that._off(that.document, 'mousedown touchstart');
                        }
                    }
                });
            }
        },
        _destroy: function () {
            if (this.options.modal) {
                this.$backdrop.remove();
                if (this.$appendTo.data("container.static")) {
                    this.$appendTo.css("position", "static");
                }
            }
        },
        checkScrollbar: function () {
            var fullWindowWidth = window.innerWidth
            if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
                var documentElementRect = document.documentElement.getBoundingClientRect()
                fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
            }
            this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
            this.scrollbarWidth = $.position.scrollbarWidth();
        },
        setScrollbar: function () {
            var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
            this.originalBodyPad = document.body.style.paddingRight || '';
            this.originalBodyOverflow = document.body.style.overflow || '';
            if (this.bodyIsOverflowing) {
                this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
            }
            this.$body.css("overflow", "hidden");
            var modalCount = this.$body.data('modalCount');
            if (modalCount) {
                modalCount++;
                this.$body.data('modalCount', modalCount);
            }
            else {
                this.$body.data('modalCount', 1);
            }
        },
        resetScrollbar: function () {
            this.$body.css('padding-right', this.originalBodyPad);
            this.$body.css('overflow', this.originalBodyOverflow);
            this.$body.removeData('modalCount');
        },
    }));
}));