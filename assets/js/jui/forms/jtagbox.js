(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jtagbox", $.jui.jinput, {
        options: {

        },
        _changeToContent: function(data) {
            var that = this;
            var $span = $('<span>×</span>').css({
                'color': '#999',
                'cursor': 'pointer',
                'display': 'inline-block',
                'font-weight': 'bold',
                'margin-right': '2px'
            })
            .on('click', function() {
                $(this).parent().remove();
                that.onValueChanged();
            });
            $('<li>').text(data).prepend($span).insertBefore(this.$inputArea).css({
                'list-style': 'none',
                'padding': 0,
                'margin': 0,
                'float': 'left',
                // 'height': '25px',
                // 'line-height': '25px',
                'background-color': '#e4e4e4',
                'border': '1px solid #aaa',
                'border-radius': '4px',
                'cursor': 'default',
                'margin-right': '5px',
                'margin-top': '5px',
                'padding': '0 5px'
            })
            .addClass('inputContent');
        },
        _getValue: function() {
            var valueList = [];
            this.$inputList.find('.inputContent').each(function() {
                var $this = $(this),
                    text = $this.text(),
                    value = text.substr(1,text.length - 1);
                valueList.push(value);   
            });
            return valueList.length > 0 ? valueList : null;
        },
        _bindEvents: function() {
            var that = this;
            this._on(this.$container, {
                click: function(e) {
                    that.$inputList.last().find('input').focus();
                },
                focusin: function (e) {
                    // that.$container.css('border-color', '#66AFE9');
                },
                focusout: function (e) {
                    // that.$container.css('border-color', '#ccc');
                },
            });
            this._on(this.$input, {
                'input': that.inputEvent = function(e) {
                    var $this = $(e.target);
                    $this.css('width', ( $this.val().length * 1 > 1 ? $this.val().length * 1 : 1 ) + 'em');
                },
                'keydown': that.keydownEvent = function(e) {
                    if ( e.keyCode == 13 ) {
                        var $this = $(e.target);
                        that._changeToContent($this.val());
                        var $cloneInput = this.$baseInput.clone();
                        $this.replaceWith($cloneInput);
                        that._on($cloneInput, {
                            'input': that.inputEvent,
                            'keydown': that.keydownEvent
                        });
                        $cloneInput.focus();
                        that.onValueChanged();
                    } else if ( e.keyCode == 8 ) {
                        var $this = $(e.target);
                        if ($this.val() === '') {
                            e.preventDefault();
                            var text = $this.parent().prev().text();
                            $this.parent().prev().remove();
                            $this.val(text.substr(1,text.length - 1));
                            $this.css('width', ( $this.val().length * 1 > 1 ? $this.val().length * 1 : 1 ) + 'em');
                            that.onValueChanged();
                        }
                    }
                }   
            });
        },
        _domConstructor: function() {
            this.$container = $('<span>').css({
                'width': '100%',
                // 'border': '1px solid #ccc',
                'border-radius': '4px',
                'display': 'block',
                'padding': 0
                // 'height': '34px',
                // 'cursor': 'text',
                // 'font-size': '14px',
                // 'color': '#555'
            }).addClass('form-control').appendTo(this.$inputWrapper);

            this.$inputList = $('<ul>').addClass('inputList').appendTo(this.$container).css({
                'list-style': 'none',
                'padding': 0,
                'margin': 0,
                'display': 'inline-block',
                'width': '100%',
                'padding': '0 0 0 5px'
            });
            this.$input = $('<input>').css({
                'background': 'transparent',
                'border': 'none',
                'outline': 0,
                'box-shadow': 'none',
                '-webkit-appearance': 'textfield',
                'width': '1.5em'
            });
            this.$baseInput = this.$input.clone();
            this.$inputArea = $('<li>').append(this.$input).appendTo(this.$inputList).css({
                'list-style': 'none',
                // 'padding': 0,
                // 'margin': 0,
                'float': 'left',
                'padding-top': '6px'
            });
        },
        _setValue: function(value) {
            if (value && value.length > 0) {
                $.each(value, $.proxy(function(index, value) {
                    this._changeToContent(value);
                }, this));
            }
        },
        focus: function() {
            this.$inputList.children().last().find('input').focus();
        },
        _inputRender: function() {
            this._domConstructor();
            this._bindEvents();
        }
    });
}));
