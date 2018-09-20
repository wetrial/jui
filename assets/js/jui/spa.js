(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jqueryui",
            "text",
            "./utils",
            "./jcomponent",
            "./mixins/compositMixin",
            './mixins/dataMixin'
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    var Route = function (routeHash) {
        var that = this;

        this.hash = typeof routeHash === 'undefined' ? location.hash : routeHash;
        if (!this.hash) {
            this.hash = "#" + $.router.defaults.path;
        }
        this.path = this.hash.substring(1);
        this.paths = [null, null, null];
        this.query = {};
        this.queryStr = '';
        var queryIndex = this.hash.indexOf('?');

        if (this.hash.length > 1) {
            if (queryIndex > -1) {
                this.path = this.hash.substring(1, queryIndex);

                var paramStr = this.queryStr = this.hash.substring(queryIndex + 1);
                var paramArr = paramStr.split('&');

                $.each(paramArr, function (i, e) {
                    var item = e.split('='),
                        key,
                        val;
                    key = item[0];
                    val = item[1];
                    if (key !== '') {
                        that.query[key] = decodeURIComponent(val);
                    }
                });
            }
        }

        var pathArr = this.path.split('!');

        this.maxLevel = pathArr.length - 1;

        if (pathArr.length <= 3) {
            $.each(pathArr, function (index, path) {
                that.paths[index] = path;
            });
        }
    };

    $.router = {
        defaults: {
            viewsDir: 'app/views',
            routerElem: '#App',
            path: '!'
        },
        routes: {
            current: null,
            previous: null
        },
        routePathMap: {}
    };

    $.router.start = function (config) {
        if (config) {
            $.router.defaults = $.extend($.router.defaults, config);
        }

        listen();

        function listen() {
            $(window).bind('hashchange', function () {
                var route = new Route();
                //console.info(JSON.stringify(route));

                var changedLevel = null;
                var queryChanged = false;

                $.router.routes.previous = $.router.routes.current;
                $.router.routes.current = route;

                if ($.router.routes.previous != null) {
                    var currentPaths = $.router.routes.current.paths;
                    var previousPaths = $.router.routes.previous.paths;

                    if (currentPaths[0] != previousPaths[0]) {
                        changedLevel = 0;
                    }
                    else if (currentPaths[1] != previousPaths[1]) {
                        changedLevel = 1;
                    }
                    else if (currentPaths[2] != previousPaths[2]) {
                        changedLevel = 2;
                    }
                    else if (($.router.routes.previous.queryStr || '') != $.router.routes.current.queryStr) {
                        queryChanged = true;
                    }
                }

                $.jui.event.trigger("hashChange", {
                    route: route,
                    changedLevel: changedLevel,
                    queryChanged: queryChanged
                });
            });

            $(window).trigger('hashchange');

            $($.router.defaults.routerElem).jrouter({ level: 0 });
        }
    };

    $.router.go = function (route) {
        route = $.extend(true, {}, $.router.routes.current, route);
        var url = '';
        for (var i = 0; i <= route.maxLevel; i++) {
            url += route.paths[i];
            if (i < route.maxLevel) {
                url += '!';
            }
        }
        //var url = route.paths.join('!');
        if (route.query) {
            url += "?" + $.param(route.query);
        }

        window.location.hash = "#" + url;
    }

    $.widget("jui.jrouter", $.jui.jcomponent, {
        options: {
            url: null,
            level: null, //路由等级，支持3级。            
            viewOptions: null
        },
        _render: function () {
            var that = this, opts = this.options;
            this.element.attr('level', opts.level);
            this.element.addClass('jrouter');

            if (opts.level != null) {
                this.go(this._getRouteUrl());
                $.jui.event.on("hashChange", that.__hashChange = function (param) { that._hashChange(param); });
            }
            else if (opts.url) {
                this.go(opts.url);
            }
        },
        go: function (url) {
            var that = this, opts = this.options;
            var rawUrl = url;
            if (!this.options.level) {
                this.options.url = url;
            }

            if (url[0] == '$') {
                if (url[1] == '/') {
                    url = url.substring(2);
                }
                else {
                    url = url.substring(1);
                    var urls = url.split('/');
                    var prefix = $.router.routePathMap[urls[0]];
                    url = $.jui.utils.pathCombine(prefix, url.substring(urls[0].length));
                }
            }
            else {
                url = $.jui.utils.pathCombine($.router.defaults.viewsDir, url);
            }

            var urlData = $.jui.utils.parseUrl(url);
            var viewWidgetName = urlData.path.replace(/\./g, "_");
            var viewFile = urlData.path + '.html';
            if (urlData.queryStr) {
                viewFile = viewFile + '?' + urlData.queryStr;
            }
            var viewModelFile = urlData.path + '.js';
            viewFile = viewFile.prepend('/');
            viewModelFile = viewModelFile.prepend('/');

            require(['text!' + viewFile], function (tpl) {
                //如果有配置多语言的格式化方法 则处理多语言的格式
                if($.jui.template.helpers._formatLanguage){
                    tpl=tpl.replace(/\{\{'.+?'\s+\|\s*_formatLanguage.*?\}\}/gi,function(match){
                        var key="";
                        var local=undefined;
                        if(/'(.+?)'\s*\|/.test(match)){
                            key=RegExp.$1;
                        }
                        if(/_formatLanguage:'(.+?)'/.test(match)) 
                        {
                            local=RegExp.$1;
                        }
                        return $.jui.template.helpers._formatLanguage(key,local);
                        //模板编译的时候 会以空格去split 导致编译的内容有问题 这里只能手动处理
                        //return $.jui.tmpl(match);
                    })
                }
                                
                var $tpl = $(tpl);
                $tpl.attr('view', rawUrl);
                that.element.html($tpl);

                require([viewModelFile], function (proto) {
                    if (!$.views[viewWidgetName]) {
                        $.widget("views." + viewWidgetName, $.jui.jview, proto);
                    }

                    var widgetOptions = {
                        properties: {
                            urlData: urlData,
                            route: $.router.routes.current,
                            router: that,
                            routerData: that.options.data
                        }
                    };

                    widgetOptions = $.extend(true, {}, widgetOptions, opts.viewOptions);

                    that.view = $.views[viewWidgetName](widgetOptions, $tpl);
                });
            });
        },
        _refresh: function () {
            if ($.isNumeric(this.options.level)) {
                this.go(this._getRouteUrl());
            }
            else if (this.options.url) {
                this.go(this.options.url);
            }
        },
        _getRouteUrl: function () {
            var level = this.options.level;
            var paths = $.router.routes.current.paths;
            var maxLevel = $.router.routes.current.maxLevel;
            var path = paths[level];

            if (level < maxLevel) {
                path = $.jui.utils.pathCombine(path, '_layout');
            }

            path = prefix(path, level);

            function prefix(path, level) {
                if (level == 0) {
                    return path;
                }
                if (path[0] != '/' && path[0] != '$') {
                    path = $.jui.utils.pathCombine(paths[level - 1], path);
                    return prefix(path, level - 1);
                }
                else {
                    return path;
                }
            }

            if ($.router.routes.current.queryStr.length > 0) {
                path = path + '?' + $.router.routes.current.queryStr;
            }

            return path;
        },
        _hashChange: function (param) {
            if (param.changedLevel == this.options.level) {
                this.refresh();
            }
        },
        _destroy: function () {
            $.jui.event.off("hashChange", this.__hashChange);
        }
    });

    $.views = {};

    $.widget("jui.jview", $.jui.jcomponent, $.extend(true, {}, $.jui.compositMixin, $.jui.dataMixin, {
        options: {
            pageTitle: null,
            defaultSubpath: null,
            subviewOptions: null
        },

        _subpathChanged: $.noop,
        _queryChanged: $.noop,
        _hashChanged: $.noop,


        _afterRender: $.noop,

        _render: function () {
            var that = this, opts = this.options;
            this.element.addClass('jview');
            this._getData(function () {
                this.__beforeRender();

                if (opts.pageTitle) {
                    document.title = opts.pageTitle;
                }

                this.subLevel = this.router.options.level + 1;

                this._renderChildren();

                $.jui.event.on("hashChange", that.__hashChange = function (param) { that._hashChange(param); });

                if (opts.defaultSubpath) {
                    this.subRouterElem = this._find('.jrouter');
                    if (!this.route.paths[this.subLevel]) {
                        this.route.paths[this.subLevel] = $.isFunction(opts.defaultSubpath) ? opts.defaultSubpath.call(that) : opts.defaultSubpath;
                    }
                    this.subRouterElem.jrouter({ level: this.subLevel, viewOptions: opts.subviewOptions });

                    this._subpathChanged();
                }

                this.__afterRender();
            });
        },
        _hashChange: function (param) {
            this.route = $.router.routes.current;
            var that = this, opts = that.options;

            this._hashChanged();

            if (opts.defaultSubpath) {
                if (param.changedLevel == this.subLevel) {
                    this._subpathChanged();
                }
            }
            if (param.queryChanged) {
                this._queryChanged();
            }
        },
        queryChanged: function (q) {
            return !$.router.routes.previous.query || ($.router.routes.previous.query[q] != $.router.routes.current.query[q]);
        },
        _destroy: function () {
            $.jui.event.off("hashChange", this.__hashChange);
        }
    }));
}));