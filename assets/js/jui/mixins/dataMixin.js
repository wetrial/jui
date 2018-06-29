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
    $.jui.dataMixin = {
        options: {
            data: null,
            dataUrl: null,
            dataParams: {},
            dataAjax: {
                type: "GET",
                dataType: 'json'
            },
            dataProcessor: null
        },
        _getData: function (callback, params) {
            var that = this, opts = this.options;

            this.gettingData = true;

            this._fetchData(params).done(function (data) {
                that.data = data;

                if (that.data && that.data.__laf) {
                    that.data = that.data.Data;
                }

                if ($.isFunction(opts.dataProcessor)) {
                    that.data = opts.dataProcessor.call(this, data);
                }
                that.gettingData = false;
                callback.call(that);
            });
        },
        _fetchData: function (params) {
            var that = this, opts = this.options;

            return $.Deferred(function (dfd) {
                if (opts.data != undefined && opts.data != null) {
                    if ($.isFunction(opts.data)) {
                        var dataFuncRet = opts.data.call(that);
                        if (dataFuncRet.done) {
                            dataFuncRet.done(function (data) {
                                return dfd.resolve(data);
                            });
                        }
                        else {
                            return dfd.resolve(dataFuncRet);
                        }
                    }
                    else {
                        return dfd.resolve(opts.data);
                    }
                }
                else {
                    if (opts.dataUrl) {
                        if ($.isFunction(opts.dataUrl)) {
                            opts.dataAjax.url = opts.dataUrl.call(that);
                        }
                        else {
                            opts.dataAjax.url = opts.dataUrl;
                        }
                        var dataParams = opts.dataParams;
                        if ($.isFunction(opts.dataParams)) {
                            dataParams = opts.dataParams.call(that);
                        }

                        if(params != undefined){
                            dataParams = $.extend({}, dataParams, params);
                        }

                        if (opts.dataAjax.url) {
                            if (dataParams != null && opts.dataAjax.contentType == 'application/json' && !($.isPlainObject(dataParams) && $.isEmptyObject(dataParams))) {
                                opts.dataAjax.data = JSON.stringify(dataParams);
                            }
                            else {
                                opts.dataAjax.data = dataParams;
                            }

                            $.ajax(opts.dataAjax).done(function (data) {
                                return dfd.resolve(data);
                            });
                        }
                        else {
                            return dfd.resolve(null);
                        }
                    }
                    else {
                        return dfd.resolve(null);
                    }
                }
            });
        }
    }
}));