/*!
 * artTemplate - Template Engine
 * https://github.com/aui/artTemplate
 * Released under the MIT, BSD, and GPL Licenses
 */
 
!(function () {


/**
 * 模板引擎
 * @name    template
 * @param   {String}            模板名
 * @param   {Object, String}    数据。如果为字符串则编译并缓存编译结果
 * @return  {String, Function}  渲染好的HTML字符串或者渲染方法
 */
var template = function (filename, content) {
    return typeof content === 'string'
    ?   compile(content, {
            filename: filename
        })
    :   renderFile(filename, content);
};


template.version = '3.0.0';


/**
 * 设置全局配置
 * @name    template.config
 * @param   {String}    名称
 * @param   {Any}       值
 */
template.config = function (name, value) {
    defaults[name] = value;
};



var defaults = template.defaults = {
    openTag: '<%',    // 逻辑语法开始标签
    closeTag: '%>',   // 逻辑语法结束标签
    escape: true,     // 是否编码输出变量的 HTML 字符
    cache: true,      // 是否开启缓存（依赖 options 的 filename 字段）
    compress: false,  // 是否压缩输出
    parser: null      // 自定义语法格式器 @see: template-syntax.js
};


var cacheStore = template.cache = {};


/**
 * 渲染模板
 * @name    template.render
 * @param   {String}    模板
 * @param   {Object}    数据
 * @return  {String}    渲染好的字符串
 */
template.render = function (source, options) {
    return compile(source, options);
};


/**
 * 渲染模板(根据模板名)
 * @name    template.render
 * @param   {String}    模板名
 * @param   {Object}    数据
 * @return  {String}    渲染好的字符串
 */
var renderFile = template.renderFile = function (filename, data) {
    var fn = template.get(filename) || showDebugInfo({
        filename: filename,
        name: 'Render Error',
        message: 'Template not found'
    });
    return data ? fn(data) : fn;
};


/**
 * 获取编译缓存（可由外部重写此方法）
 * @param   {String}    模板名
 * @param   {Function}  编译好的函数
 */
template.get = function (filename) {

    var cache;
    
    if (cacheStore[filename]) {
        // 使用内存缓存
        cache = cacheStore[filename];
    } else if (typeof document === 'object') {
        // 加载模板并编译
        var elem = document.getElementById(filename);
        
        if (elem) {
            var source = (elem.value || elem.innerHTML)
            .replace(/^\s*|\s*$/g, '');
            cache = compile(source, {
                filename: filename
            });
        }
    }

    return cache;
};


var toString = function (value, type) {

    if (typeof value !== 'string') {

        type = typeof value;
        if (type === 'number') {
            value += '';
        } else if (type === 'function') {
            value = toString(value.call(value));
        } else {
            value = '';
        }
    }

    return value;

};


var escapeMap = {
    "<": "&#60;",
    ">": "&#62;",
    '"': "&#34;",
    "'": "&#39;",
    "&": "&#38;"
};


var escapeFn = function (s) {
    return escapeMap[s];
};

var escapeHTML = function (content) {
    return toString(content)
    .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
};


var isArray = Array.isArray || function (obj) {
    return ({}).toString.call(obj) === '[object Array]';
};


var each = function (data, callback) {
    var i, len;        
    if (isArray(data)) {
        for (i = 0, len = data.length; i < len; i++) {
            callback.call(data, data[i], i, data);
        }
    } else {
        for (i in data) {
            callback.call(data, data[i], i);
        }
    }
};


var utils = template.utils = {

	$helpers: {},

    $include: renderFile,

    $string: toString,

    $escape: escapeHTML,

    $each: each
    
};/**
 * 添加模板辅助方法
 * @name    template.helper
 * @param   {String}    名称
 * @param   {Function}  方法
 */
template.helper = function (name, helper) {
    helpers[name] = helper;
};

var helpers = template.helpers = utils.$helpers;




/**
 * 模板错误事件（可由外部重写此方法）
 * @name    template.onerror
 * @event
 */
template.onerror = function (e) {
    var message = 'Template Error\n\n';
    for (var name in e) {
        message += '<' + name + '>\n' + e[name] + '\n\n';
    }
    
    if (typeof console === 'object') {
        console.error(message);
    }
};


// 模板调试器
var showDebugInfo = function (e) {

    template.onerror(e);
    
    return function () {
        return '{Template Error}';
    };
};


/**
 * 编译模板
 * 2012-6-6 @TooBug: define 方法名改为 compile，与 Node Express 保持一致
 * @name    template.compile
 * @param   {String}    模板字符串
 * @param   {Object}    编译选项
 *
 *      - openTag       {String}
 *      - closeTag      {String}
 *      - filename      {String}
 *      - escape        {Boolean}
 *      - compress      {Boolean}
 *      - debug         {Boolean}
 *      - cache         {Boolean}
 *      - parser        {Function}
 *
 * @return  {Function}  渲染方法
 */
var compile = template.compile = function (source, options) {
    
    // 合并默认配置
    options = options || {};
    for (var name in defaults) {
        if (options[name] === undefined) {
            options[name] = defaults[name];
        }
    }


    var filename = options.filename;


    try {
        
        var Render = compiler(source, options);
        
    } catch (e) {
    
        e.filename = filename || 'anonymous';
        e.name = 'Syntax Error';

        return showDebugInfo(e);
        
    }
    
    
    // 对编译结果进行一次包装

    function render (data) {
        
        try {
            
            return new Render(data, filename) + '';
            
        } catch (e) {
            
            // 运行时出错后自动开启调试模式重新编译
            if (!options.debug) {
                options.debug = true;
                return compile(source, options)(data);
            }
            
            return showDebugInfo(e)();
            
        }
        
    }
    

    render.prototype = Render.prototype;
    render.toString = function () {
        return Render.toString();
    };


    if (filename && options.cache) {
        cacheStore[filename] = render;
    }

    
    return render;

};




// 数组迭代
var forEach = utils.$each;


// 静态分析模板变量
var KEYWORDS =
    // 关键字
    'break,case,catch,continue,debugger,default,delete,do,else,false'
    + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
    + ',throw,true,try,typeof,var,void,while,with'

    // 保留字
    + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
    + ',final,float,goto,implements,import,int,interface,long,native'
    + ',package,private,protected,public,short,static,super,synchronized'
    + ',throws,transient,volatile'

    // ECMA 5 - use strict
    + ',arguments,let,yield'

    + ',undefined';

var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
var SPLIT_RE = /[^\w$]+/g;
var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
var BOUNDARY_RE = /^,+|,+$/g;
var SPLIT2_RE = /^$|,+/;


// 获取变量
function getVariable (code) {
    return code
    .replace(REMOVE_RE, '')
    .replace(SPLIT_RE, ',')
    .replace(KEYWORDS_RE, '')
    .replace(NUMBER_RE, '')
    .replace(BOUNDARY_RE, '')
    .split(SPLIT2_RE);
};


// 字符串转义
function stringify (code) {
    return "'" + code
    // 单引号与反斜杠转义
    .replace(/('|\\)/g, '\\$1')
    // 换行符转义(windows + linux)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n') + "'";
}


function compiler (source, options) {
    
    var debug = options.debug;
    var openTag = options.openTag;
    var closeTag = options.closeTag;
    var parser = options.parser;
    var compress = options.compress;
    var escape = options.escape;
    

    
    var line = 1;
    var uniq = {$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1};
    


    var isNewEngine = ''.trim;// '__proto__' in {}
    var replaces = isNewEngine
    ? ["$out='';", "$out+=", ";", "$out"]
    : ["$out=[];", "$out.push(", ");", "$out.join('')"];

    var concat = isNewEngine
        ? "$out+=text;return $out;"
        : "$out.push(text);";
          
    var print = "function(){"
    +      "var text=''.concat.apply('',arguments);"
    +       concat
    +  "}";

    var include = "function(filename,data){"
    +      "data=data||$data;"
    +      "var text=$utils.$include(filename,data,$filename);"
    +       concat
    +   "}";

    var headerCode = "'use strict';"
    + "var $utils=this,$helpers=$utils.$helpers,"
    + (debug ? "$line=0," : "");
    
    var mainCode = replaces[0];

    var footerCode = "return new String(" + replaces[3] + ");"
    
    // html与逻辑语法分离
    forEach(source.split(openTag), function (code) {
        code = code.split(closeTag);
        
        var $0 = code[0];
        var $1 = code[1];
        
        // code: [html]
        if (code.length === 1) {
            
            mainCode += html($0);
         
        // code: [logic, html]
        } else {
            
            mainCode += logic($0);
            
            if ($1) {
                mainCode += html($1);
            }
        }
        

    });
    
    var code = headerCode + mainCode + footerCode;
    
    // 调试语句
    if (debug) {
        code = "try{" + code + "}catch(e){"
        +       "throw {"
        +           "filename:$filename,"
        +           "name:'Render Error',"
        +           "message:e.message,"
        +           "line:$line,"
        +           "source:" + stringify(source)
        +           ".split(/\\n/)[$line-1].replace(/^\\s+/,'')"
        +       "};"
        + "}";
    }
    
    
    
    try {
        
        
        var Render = new Function("$data", "$filename", code);
        Render.prototype = utils;

        return Render;
        
    } catch (e) {
        e.temp = "function anonymous($data,$filename) {" + code + "}";
        throw e;
    }



    
    // 处理 HTML 语句
    function html (code) {
        
        // 记录行号
        line += code.split(/\n/).length - 1;

        // 压缩多余空白与注释
        if (compress) {
            code = code
            .replace(/\s+/g, ' ')
            .replace(/<!--[\w\W]*?-->/g, '');
        }
        
        if (code) {
            code = replaces[1] + stringify(code) + replaces[2] + "\n";
        }

        return code;
    }
    
    
    // 处理逻辑语句
    function logic (code) {

        var thisLine = line;
       
        if (parser) {
        
             // 语法转换插件钩子
            code = parser(code, options);
            
        } else if (debug) {
        
            // 记录行号
            code = code.replace(/\n/g, function () {
                line ++;
                return "$line=" + line +  ";";
            });
            
        }
        
        
        // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
        // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
        if (code.indexOf('=') === 0) {

            var escapeSyntax = escape && !/^=[=#]/.test(code);

            code = code.replace(/^=[=#]?|[\s;]*$/g, '');

            // 对内容编码
            if (escapeSyntax) {

                var name = code.replace(/\s*\([^\)]+\)/, '');

                // 排除 utils.* | include | print
                
                if (!utils[name] && !/^(include|print)$/.test(name)) {
                    code = "$escape(" + code + ")";
                }

            // 不编码
            } else {
                code = "$string(" + code + ")";
            }
            

            code = replaces[1] + code + replaces[2];

        }
        
        if (debug) {
            code = "$line=" + thisLine + ";" + code;
        }
        
        // 提取模板中的变量名
        forEach(getVariable(code), function (name) {
            
            // name 值可能为空，在安卓低版本浏览器下
            if (!name || uniq[name]) {
                return;
            }

            var value;

            // 声明模板变量
            // 赋值优先级:
            // [include, print] > utils > helpers > data
            if (name === 'print') {

                value = print;

            } else if (name === 'include') {
                
                value = include;
                
            } else if (utils[name]) {

                value = "$utils." + name;

            } else if (helpers[name]) {

                value = "$helpers." + name;

            } else {

                value = "$data." + name;
            }
            
            headerCode += name + "=" + value + ",";
            uniq[name] = true;
            
            
        });
        
        return code + "\n";
    }
    
    
};



// 定义模板引擎的语法


defaults.openTag = '{{';
defaults.closeTag = '}}';


var filtered = function (js, filter) {
    var parts = filter.split(':');
    var name = parts.shift();
    var args = parts.join(':') || '';

    if (args) {
        args = ', ' + args;
    }

    return '$helpers.' + name + '(' + js + args + ')';
}


defaults.parser = function (code, options) {

    // var match = code.match(/([\w\$]*)(\b.*)/);
    // var key = match[1];
    // var args = match[2];
    // var split = args.split(' ');
    // split.shift();

    code = code.replace(/^\s/, '');

    var split = code.split(' ');
    var key = split.shift();
    var args = split.join(' ');

    

    switch (key) {

        case 'if':

            code = 'if(' + args + '){';
            break;

        case 'else':
            
            if (split.shift() === 'if') {
                split = ' if(' + split.join(' ') + ')';
            } else {
                split = '';
            }

            code = '}else' + split + '{';
            break;

        case '/if':

            code = '}';
            break;

        case 'each':
            
            var object = split[0] || '$data';
            var as     = split[1] || 'as';
            var value  = split[2] || '$value';
            var index  = split[3] || '$index';
            
            var param   = value + ',' + index;
            
            if (as !== 'as') {
                object = '[]';
            }
            
            code =  '$each(' + object + ',function(' + param + '){';
            break;

        case '/each':

            code = '});';
            break;

        case 'echo':

            code = 'print(' + args + ');';
            break;

        case 'print':
        case 'include':

            code = key + '(' + split.join(',') + ');';
            break;

        default:

            // 过滤器（辅助方法）
            // {{value | filterA:'abcd' | filterB}}
            // >>> $helpers.filterB($helpers.filterA(value, 'abcd'))
            // TODO: {{ddd||aaa}} 不包含空格
            if (/^\s*\|\s*[\w\$]/.test(args)) {

                var escape = true;

                // {{#value | link}}
                if (code.indexOf('#') === 0) {
                    code = code.substr(1);
                    escape = false;
                }

                var i = 0;
                var array = code.split('|');
                var len = array.length;
                var val = array[i++];

                for (; i < len; i ++) {
                    val = filtered(val, array[i]);
                }

                code = (escape ? '=' : '=#') + val;

            // 即将弃用 {{helperName value}}
            } else if (template.helpers[key]) {
                
                code = '=#' + key + '(' + split.join(',') + ');';
            
            // 内容直接输出 {{value}}
            } else {

                code = '=' + code;
            }

            break;
    }
    
    
    return code;
};



// RequireJS && SeaJS
if (typeof define === 'function') {
    define('jui/template',[],function() {
        return template;
    });

// NodeJS
} else if (typeof exports !== 'undefined') {
    module.exports = template;
} else {
    this.template = template;
}

})();
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/utils',[
            "jquery", "jui/template"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery, template);
    }
}(function ($, template) {

    String.prototype.trim = function (characters) {
        return this.replace(new RegExp('^' + characters + '+|' + characters + '+$', 'g'), '');
    }

    String.prototype.prepend = function (character) {
        if (this[0] != character) {
            return (character + this).toString();
        }
        else {
            return this.toString();
        }
    }

    $.jui = $.jui || {};

    $.jui.template = template;

    $.jui.tmpl = function (idOrContent, data) {
        var ret = idOrContent;
        if (!/[^\w\-\.:]/.test(idOrContent)) {
            ret = template(idOrContent, data);
        }
        else {
            var render = template.compile(idOrContent);
            ret = render(data);
        }

        return ret;
    };

    /* UTILS ***************************************************/

    $.jui.utils = $.jui.utils || {};

    // 检测是否是 jquery 对象 
    $.jui.utils.isJqObj = function (o) {
        return (o && o.length && (typeof jQuery === "function" || typeof jQuery === "object") && o instanceof jQuery) ? true : false;
    };

    $.jui.utils.pathCombine = function () {
        var path = '';
        var args = $.makeArray(arguments);

        $.each(args, function (index, item) {
            if (index > 0) {
                path += '/' + item.trim('/');
            }
            else {
                path += item.trim('/');
            }
        });

        return path;
    }

    $.jui.utils.parseUrl = function (url) {
        var query = {};
        var path = '';
        var queryIndex = url.indexOf('?');
        var queryStr = '';

        if (url != '') {
            if (queryIndex > -1) {
                path = url.substring(0, queryIndex);
                var paramStr = url.substring(queryIndex + 1);
                queryStr = paramStr
                var paramArr = paramStr.split('&');

                $.each(paramArr, function (i, e) {
                    var item = e.split('='),
                        key,
                        val;
                    key = item[0];
                    val = item[1];
                    if (key !== '') {
                        query[key] = decodeURIComponent(val);
                    }
                });
            }
            else {
                path = url;
            }
        }

        return {
            url: url,
            path: path,
            query: query,
            queryStr: queryStr
        }
    }

    $.jui.utils.format = function (source, params) {
        if (arguments.length == 1)
            return function () {
                var args = $.makeArray(arguments);
                args.unshift(source);
                return $.format.apply(this, args);
            };
        if (arguments.length > 2 && params.constructor != Array) {
            params = $.makeArray(arguments).slice(1);
        }
        if (params.constructor != Array) {
            params = [params];
        }
        $.each(params, function (i, n) {
            source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
        });
        return source;
    };

    $.jui.utils.formatDate = function () {
        var dFormat = "yyyy-MM-dd hh:mm:ss",//default date format
            utc = true,
            str = arguments[0],
            format = arguments[1] || dFormat;
        if (typeof str === "boolean") {
            utc = str;
            str = arguments[1];
            format = arguments[2] || dFormat;
        }
        if (!str) return;
        //if (!format) format = "dd/MM/yyyy hh:mm:ss";
        var curDate = new Date();
        //base on server's time zone, -480:Beijing,-240:dubai.
        var timeoffset = -480;//curDate.getTimezoneOffset();
        var myDate
        if (str instanceof Date) {
            myDate = str;
        } else if (typeof str == "number") {
            myDate = new Date(str);
        } else if ($.type(str) == "object") {
            var _format = str.format; //str format
            str = str.date;
        } else if (typeof str == "string") {
            if (/Date/.test(str) || !isNaN(str)) {
                str = str.replace(/(^\/Date\()|(\)\/$)/g, "");
                str = parseInt(str);
                //UTC to Local time
                if (utc) str = str - (timeoffset * 60000);
                myDate = new Date(str);
            }
            else if (/\d{4}.\d{2}.\d{2}/.test(str)) {
                var regDate = /(\d{4}).(\d{2}).(\d{2}).*/;
                var regTime = /.*?(\d{1,2}):(\d{1,2}):(\d{1,2})/;
                var arrDate = str.replace(regDate, "$1,$2,$3").split(',');
                var arrTime = [];
                if (regTime.test(str)) {
                    arrTime = str.replace(regTime, "$1,$2,$3").split(',');
                }
                myDate = new Date(arrDate[0], arrDate[1] - 1, arrDate[2], arrTime[0] || 0, arrTime[1] || 0, arrTime[2] || 0);
            }
            else if (/\:/.test(str)) {
                var _reg1 = /(\d{1,2})([\s\/])(\d{1,2})\2(\d{2,4})/;
                var _reg2 = /(\d{2,4})([\s\/\-])(\d{1,2})\2(\d{1,2})/;
                var _format = str.split(":")[1]; //str format
                str = str.split(":")[0];
                if (_format == "dmy") {
                    str = str.replace(_reg1, "$3$2$1$2$4");
                } else if (_format == "ydm") {
                    str = str.replace(_reg2, "$1$2$4$2$3");
                }
                myDate = new Date(str);
                if (!utc) {
                    str = myDate.getTime() + (timeoffset * 60000);
                    myDate = new Date(str);
                }
            }
            else {
                return str;
            }
        } else {
            return;
        }
        var weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        var opts = {
            "M+": myDate.getMonth() + 1,                    //Month 
            "d+": myDate.getDate(),                         //Day   
            "W+": weeks[myDate.getDay()],                         //Day   
            "h+": myDate.getHours(),                        //Hours   
            "m+": myDate.getMinutes(),                      //Minute   
            "s+": myDate.getSeconds(),                      //Second   
            "q+": Math.floor((myDate.getMonth() + 3) / 3),  //Quarter   
            "S": myDate.getMilliseconds()                   //Millisecond   
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (myDate.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in opts) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (opts[k]) : (("00" + opts[k]).substr(("" + opts[k]).length)));
            }
        }
        return format;
    };

    $.jui.utils.jsonEqual = function (obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    };

    $.jui.utils.htmlEncode = function (value) {
        return $('<div/>').text(value).html();
    };

    $.jui.utils.htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };

    $.jui.utils.getFirstLeaf = function (treeNodes, childrenField) {
        childrenField = childrenField || 'children';
        var first = null;
        if (treeNodes.length > 0) {
            first = treeNodes[0];
            var children = treeNodes[0][childrenField];
            if (children && children.length > 0) {
                first = $.jui.utils.getFirstLeaf.getFirstLeaf(children);
            }
        }

        return first;
    }

    /* template helper ***************************************************/

    $.jui.template.helper('formatDate', function (v, format) {
        format = format || 'yyyy-MM-dd';
        return $.jui.utils.formatDate(false, v, format);
    });

    /* jquery plugin ***************************************************/

    $.fn.findByName = function (name) {
        return this.find('[name="' + name + '"]');
    };

    $.fn.findUntil = function (selector, mask, result) {
        result = typeof result !== 'undefined' ? result : new jQuery();
        this.children().each(function () {
            var thisObject = jQuery(this);
            if (thisObject.is(selector))
                result.push(this);
            var meet = false;
            if ($.isArray(mask)) {
                $.each(mask, function (index, item) {
                    if (thisObject.is(item)) {
                        meet = true;
                        return false;
                    }
                });
            }
            else if (thisObject.is(mask)) {
                meet = true;
            }
            if (!meet) {
                thisObject.findUntil(selector, mask, result);
            }
        });
        return result;
    }

    $.fn.equalHeights = function () {
        var maxHeight = 0,
            $this = $(this);

        $this.each(function () {
            var height = $(this).outerHeight();

            if (height > maxHeight) { maxHeight = height; }
        });

        return $this.css('height', maxHeight);
    };

    /* SIMPLE EVENT BUS *****************************************/

    $.jui.event = (function () {

        var _callbacks = {};

        var on = function (eventName, callback) {
            if (!_callbacks[eventName]) {
                _callbacks[eventName] = [];
            }

            _callbacks[eventName].push(callback);
        };

        var off = function (eventName, callback) {
            var callbacks = _callbacks[eventName];
            if (!callbacks) {
                return;
            }

            var index = -1;
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i] === callback) {
                    index = i;
                    break;
                }
            }

            if (index < 0) {
                return;
            }

            _callbacks[eventName].splice(index, 1);
        };

        var trigger = function (eventName) {
            var callbacks = _callbacks[eventName];
            if (!callbacks || !callbacks.length) {
                return;
            }

            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i].apply(this, args);
            }
        };

        // Public interface ///////////////////////////////////////////////////

        return {
            on: on,
            off: off,
            trigger: trigger
        };
    })();

    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    function transitionEnd() {
        var el = document.createElement('bootstrap')

        var transEndEventNames = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd otransitionend',
            transition: 'transitionend'
        }

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return { end: transEndEventNames[name] }
            }
        }

        return false // explicit for ie8 (  ._.)
    }

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false
        var $el = this
        $(this).one('bsTransitionEnd', function () { called = true })
        var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
        setTimeout(callback, duration)
        return this
    }

    $.support.transition = transitionEnd()

    if ($.support.transition) {

        $.event.special.bsTransitionEnd = {
            bindType: $.support.transition.end,
            delegateType: $.support.transition.end,
            handle: function (e) {
                if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
            }
        }
    }

    // END CSS TRANSITION SUPPORT


    /* jshint browser:true
    *
    * window-location-origin - version 0.0.1
    * Add support for browsers that don't natively support window.location.origin
    *
    * Authror: Kyle Welsby <kyle@mekyle.com>
    * License: MIT
    */
    (function (location) {
        'use strict';
        if (!location.origin) {
            var origin = location.protocol + "//" + location.hostname + (location.port && ":" + location.port);

            try {
                // Make it non editable
                Object.defineProperty(location, "origin", {
                    enumerable: true,
                    value: origin
                });
            } catch (e) {
                // IE < 8
                location.origin = origin;
            }
        }
    })(window.location);
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/mixins/compositMixin',[
            "jquery",
            "jqueryui",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.compositMixin = {
        options: {
            components: [],
            transmitOptions: null
        },
        _getComponents: function () {
            if ($.isFunction(this.options.components)) {
                this.components = this.options.components.call(this);
            }
            else {
                this.components = this.options.components;
            }
            if (!this.components) {
                this.compoents = [];
            }
        },
        _renderChildren: function () {
            var that = this, opts = this.options;

            this._getComponents();

            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];

                    /*var renderIf = component.renderIf;
                    if (renderIf && $.isFunction(component.renderIf)) {
                        renderIf = component.renderIf.call(this);
                    }
                    if (renderIf == false) {
                        continue;
                    }*/

                    var componentElem = this._findByIdOrName(component.name);
                    if (componentElem.length) {
                        /*if (!component.widget) {
                            component.widget = 'jcomponent';
                        }*/
                        if (component.widget) {
                            if (opts.transmitOptions) {
                                component = $.extend(true, {}, opts.transmitOptions, component);
                            }
                            var data = null;
                            if (opts.transmitData) {
                                if (that.data && !$.isEmptyObject(that.data)) {
                                    if (component.flatData) {
                                        data = this.data;
                                    }
                                    else {
                                        if (this.data.hasOwnProperty(component.name)) {
                                            data = this.data[component.name];
                                        }
                                    }
                                    //if (data) {
                                        //component = $.extend(true, {}, component, { data: data });
                                    //}

                                    if(component.data === undefined){
                                        component.data = data;
                                    }
                                }
                            }

                            component = $.extend(true, {}, component, { properties: { name: component.name, parent: that } });

                            var widget;
                            if (component.widget.indexOf('.') > 0) {
                                var widgetArr = component.widget.split('.');
                                widget = $[widgetArr[0]][widgetArr[1]];
                            } else {
                                widget = $.jui[component.widget];
                            }

                            if (widget) {
                                this["$" + component.name] = widget(component, componentElem);
                            }
                        }
                        else {
                            that["_$" + component.name] = componentElem;
                        }
                    }
                }
            }
        },
        findChild: function (childName) {
            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];
                    if (component.name == childName) {
                        var $component = this["$" + childName];
                        return $component;
                    }
                }
            }

            return null;
        }
    }
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/mixins/dataMixin',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/mixins/templateMixin',[
            "jquery",
            "jqueryui",
            "text",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.templateMixin = {
        options: {
            template: null,
            templateUrl: null
        },
        _getTemplate: function (callback) {
            var that = this, opts = this.options;

            this._fetchTemplate().done(function (tpl) {
                that.template = tpl;
                if (opts.templateProcessor) {
                    that.template = opts.templateProcessor.call(that, tpl);
                }
                callback.call(that);
            });
        },
        _fetchTemplate: function (callback) {
            var that = this, opts = this.options;

            return $.Deferred(function ($dfd) {
                if (opts.templateUrl) {
                    require(['text!/' + opts.templateUrl], function (tpl) {
                        $dfd.resolve(tpl);
                    });
                }
                else if (opts.template) {
                    $dfd.resolve(opts.template);
                }
                else {
                    if (!that.elemTmpl) {
                        var scriptElem = that._find('script');
                        if (scriptElem.length) {
                            that.elemTmpl = scriptElem.html();
                        }
                    }
                    $dfd.resolve(that.elemTmpl);
                }
            });
        }
    }
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/jcomponent',[
            "jquery",
            "jqueryui",
            "./utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcomponent", {
        options: {
            renderIf: true,
            showIf: true,
            properties: null
        },

        _beforeCreate: $.noop,
        _beforeRender: $.noop,
        _afterRender: $.noop,
        _render: $.noop,
        _refresh: $.noop,

        _create: function () {
            var that = this, opts = this.options;

            if (opts.properties) {
                $.each(opts.properties, function (key, value) {
                    that[key] = value;
                });
            }

            this.__beforeCreate();

            this.showIf = opts.showIf;
            if ($.isFunction(opts.showIf)) {
                this.showIf = opts.showIf.call(that);
            }

            if (this.showIf == false) {
                this.element.hide();
            }

            this.renderIf = opts.showIf;
            if ($.isFunction(opts.renderIf)) {
                this.renderIf = opts.renderIf.call(that);
            }

            if (opts.renderIf) {
                this.__render();
            }
        },

        show: function () {
            this._show(this.widget());
        },

        hide: function () {
            this._hide(this.widget());
        },

        __render: function () {
            var that = this, opts = this.options;

            if (this.rendered == true) {
                return;
            }
            else {
                this.rendered = true;
            }

            if (opts.styleClass != null) {
                that.element.addClass(opts.styleClass);
            }

            if (opts.style != null) {
                that.element.css(opts.style);
            }

            this._render();

            if (this.options.disabled) {
                this.disable();
            }

            if (opts.events) {
                that._on(opts.events);
            }
        },

        refresh: function (options) {
            this.options = $.extend(true, this.options, options);

            if (!this.rendered) {
                this.__render();
            }
            else {
                this._refresh();
            }
        },

        _refresh: function () {
            this.element.html('');
            this.rendered = false;
            this.__render();
        },

        _findByIdOrName: function (idOrName) {
            var jq = this.widget().find("#" + idOrName);
            if (!jq.length) {
                jq = this.widget().findByName(idOrName);
            }

            return jq;
        },

        _find: function (selector) {
            return this.widget().find(selector)
        },

        _getCreateEventData: function () {
            return { inst: this }
        },

        __beforeCreate: function () {
            if ($.isFunction(this.options.beforeCreate)) {
                this.options.beforeCreate.call(this);
            }

            this._beforeCreate();
        },
        __beforeRender: function () {
            if ($.isFunction(this.options.beforeRender)) {
                this.options.beforeRender.call(this);
            }

            this._beforeRender();
        },
        __afterRender: function () {
            if ($.isFunction(this.options.afterRender)) {
                this.options.afterRender.call(this);
            }

            this._afterRender();
        },

        isHidden: function () {
            return this.widget().is(':hidden');
        },

        isDisabled: function(){
            return this.options.disabled;
        },

        on: function (event, callback) {
            var that = this;
            var eventPrefix = this.widgetEventPrefix.toLowerCase();
            event = event.toLowerCase();

            this.element.bind(eventPrefix + event, function (event, ui) {
                callback.call(that, event, ui);
            });
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/jtmpl',[
            "jquery",
            "jqueryui",
            "./utils",
            './jcomponent',
            './mixins/templateMixin',
            './mixins/dataMixin',
            './mixins/compositMixin'
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jtmpl", $.jui.jcomponent, $.extend(true, {}, $.jui.templateMixin, $.jui.compositMixin, $.jui.dataMixin, {
        options: {
            asHtml: true
        },
        _render: function () {
            this.refresh();
        },
        refresh: function (options) {
            var that = this;
            this.options = $.extend(true, this.options, options);
            var opts = this.options;

            that._getTemplate(function () {
                that.element.html('');
                that._getData(function () {

                    that.__beforeRender();

                    var content = that.template;
                    if (that.template && that.data) {
                        content = $.jui.tmpl(that.template, that.data);
                    }

                    if (opts.asHtml) {
                        that.element.html(content);
                    }
                    else {
                        that.element.text(content);
                    }

                    that._renderChildren();

                    that.__afterRender();
                });
            });
        }
    }));
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/misc/jpager',[
            "jquery",
            "jqueryui",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jpager", {
        options: {
            pageIndex: 1,
            pageSize: 10,
            total: 0,

            fields: {
                pageIndex: "pageIndex",
                pageSize: "pageSize"
            },

            displayItemCount: 5,
            edgeItemCount: 1,
            linkTo: "#",
            prevShowAlways: true,
            nextShowAlways: true,

            styleClass: "pagination",

            cssClasses: {
                widget: "jpager",
                itemContainer: "jpager-items",
                item: "jpager-item",
                itemSelected: "jpager-item-selected",
                info: "jpager-info",
            },
            selectors: {
                widget: ".jpager",
                itemContainer: ".jpager-items",
                item: ".jpager-item",
                info: ".jpager-info"
            },

            templates: {
                layout: '<div class="cell"><ul class="jpager-items"></ul></div><div class="jpager-info cell"></div><div class="cell-fit"></div>',
                item: '<li><a href="javascript:;">{{text}}</a></li>'
            },

            //Events
            pageChanged: function (event, data) { },

            //localization
            texts: {
                info: '每页{{pageSize}}条，共{{total}}条',
                prev: "上一页",
                next: "下一页",
                ellipse: "..."
            }
        },

        _$itemContainer: null,
        _$pagerInfo: null,
        _bound: false,

        _create: function () {
            var that = this;
            var opts = this.options;
            this.element.addClass(opts.cssClasses.widget);
            if (opts.templates.layout) {
                this.element.append(opts.templates.layout);
            }

            this._$itemContainer = this.element.find(opts.selectors.itemContainer);
            if (!this._$itemContainer.length) {
                this._$itemContainer = this.element.addClass(opts.cssClasses.itemContainer);
            }
            this._$pagerInfo = this.element.find(opts.selectors.info);
        },
        /*
        data:{ total, pageIndex, pageSize }
        */
        bind: function (data) {
            var pagerParams = $.extend({}, {
                total: this.options.total,
                pageIndex: this.options.pageIndex,
                pageSize: this.options.pageSize
            }, data);
            if (!this._bound) {
                this._bindData(pagerParams);
                this._bound = true;
            }
            else {
                if (pagerParams.total != this.options.total
                    || pagerParams.pageIndex != this.options.pageIndex
                    || pagerParams.pageSize != this.options.pageSize) {

                    this._bindData(pagerParams);
                }
            }
        },
        _bindData: function (pagerParams) {
            this.options = $.extend(this.options, pagerParams);
            this._createPageItems();
            this._createPagerInfo();
        },
        _createPageItems: function () {
            this._$itemContainer.empty();
            var that = this;
            var opts = this.options;
            var pageIndex = opts.pageIndex;
            var interval = this._getInterval();
            var pageCount = this._getPageCount();
            // 这个辅助函数返回一个处理函数调用有着正确page_id的pageSelected。
            var getClickHandler = function (page_id) {
                return function (evt) { return that._pageSelected(page_id, evt); }
            }
            var appendItem = function (page_id, appendOpts) {
                page_id = page_id < 1 ? 1 : (page_id < pageCount ? page_id : pageCount);
                appendOpts = jQuery.extend({ text: page_id, classes: "" }, appendOpts || {});
                var lnk = $($.jui.tmpl(opts.templates.item, { text: appendOpts.text }))
                    .addClass(opts.cssClasses.item);
                if (!appendOpts.space) {
                    if (page_id == pageIndex) {
                        lnk.addClass("active");
                        lnk.addClass(opts.cssClasses.itemSelected);
                    } else {
                        lnk.bind("click", getClickHandler(page_id))
                        //						.attr('href', opts.linkTo.replace(/__id__/, page_id));
                    }
                }
                if (appendOpts.classes) { lnk.addClass(appendOpts.classes); }
                that._$itemContainer.append(lnk);
            }
            // 产生"Previous"-链接
            if (opts.texts.prev && (pageIndex > 1 || opts.prevShowAlways)) {
                appendItem(pageIndex - 1, { text: opts.texts.prev, classes: "prev" });
            }
            // 产生起始点
            if (interval[0] > 1 && opts.edgeItemCount > 0) {
                var end = Math.min(opts.edgeItemCount, interval[0] - 1);
                for (var i = 1; i <= end; i++) {
                    appendItem(i);
                }
                if (opts.edgeItemCount < interval[0] - 1 && opts.texts.ellipse) {
                    appendItem(null, { text: opts.texts.ellipse, classes: "space", space: true });
                }
            }
            // 产生内部的那些链接
            for (var i = interval[0]; i <= interval[1]; i++) {
                appendItem(i);
            }
            // 产生结束点
            if (interval[1] < pageCount && opts.edgeItemCount > 0) {
                if (pageCount - opts.edgeItemCount > interval[1] && opts.texts.ellipse) {
                    appendItem(null, { text: opts.texts.ellipse, classes: "space", space: true });
                }
                var begin = Math.max(pageCount - opts.edgeItemCount + 1, interval[1]);
                for (var i = begin; i <= pageCount; i++) {
                    appendItem(i);
                }

            }
            // 产生 "Next"-链接
            if (opts.texts.next && (pageIndex < pageCount || opts.nextShowAlways)) {
                appendItem(pageIndex + 1, { text: opts.texts.next, classes: "next" });
            }
        },
        _createPagerInfo: function () {
            if (this._$pagerInfo.length) {
                var pagerInfo = $.jui.tmpl(this.options.texts.info, { total: this.options.total, pageSize: this.options.pageSize });
                this._$pagerInfo.html(pagerInfo);
            }
        },
        /**
        * 极端分页的起始和结束点，取决于pageIndex 和 displayItemCount.
        * @返回 {数组(Array)}
        */
        _getInterval: function () {
            var opts = this.options;
            var pageIndex = opts.pageIndex;
            var displayItemHalf = Math.floor(opts.displayItemCount / 2);
            var pageCount = this._getPageCount();
            var upper_limit = pageCount - opts.displayItemCount;
            var start = pageIndex > displayItemHalf ? Math.max(Math.min(pageIndex - displayItemHalf, upper_limit), 1) : 1;
            var end = pageIndex > displayItemHalf ? Math.min(pageIndex + displayItemHalf, pageCount) : Math.min(opts.displayItemCount, pageCount);
            return [start, end];
        },
        _getPageCount: function () {
            return Math.ceil(this.options.total / this.options.pageSize);
        },
        _pageSelected: function (page_id) {
            this.options.pageIndex = page_id;
            this._createPageItems();
            var continuePropagation = this._trigger("pageChanged", null, { pageIndex: this.options.pageIndex, pageSize: this.options.pageSize });
            if (!continuePropagation) {
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                else {
                    evt.cancelBubble = true;
                }
            }
            return continuePropagation;
        }
    });

}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/misc/jcollapse',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/spa',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/layers/jlayer',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/layers/jpop',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/layers/jlayer.modal',[
            "jquery",
            "./jlayer"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.jui.modal = function (options) {
        options = $.extend(true, {}, options, {
            modal: true,
            hideAnimate: 'fadeOutUp',
            showAnimate: 'fadeInDown',
            size: {
                maxHeight: 'fit'
            },
            fitElem: '.modal-bd',
            closeOnClickBackdrop: true
        });

        $layer = $("<div>");

        $layer.jlayer(options);

        return $layer;
    }
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/layers/jlayer.alert',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/layers/jlayer.tip',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/utils.ajax',[
            "jquery",
            "./utils",
            "./layers/jlayer.tip",
            "./layers/jlayer.modal"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.jui = $.jui || {};

    $.jui.loginPath = "";
    $.jui.accessDeniedPath = "/admin/#liteaf.membership/spa/auth/accessDenied";

    $.jui.ajax = function (userOptions) {
        userOptions = userOptions || {};

        var $loading = null;
        var $success = null;

        var options = $.extend(true, {
            loadingTip: {

            },
            successTip: {

            },
            errorTip: {
                tipMode: false,
                tipElem: null
            }
        }, userOptions);

        options.beforeSend = function () {
            if (options.loadingTip) {
                $loading = $.jui.tip.loading(options.loadingTip);
            }

            if (options.errorTip.tipElem != null) {
                options.errorTip.closeToHide = true;
                var errorTipInst = $(options.errorTip.tipElem).jlayer("instance");
                if (errorTipInst != undefined) {
                    errorTipInst.hide();
                }
            }

            userOptions.beforeSend && userOptions.beforeSend.apply(this, arguments);
        }

        options.success = function (ar) {
            $loading && $loading.close();

            if (ar && ar.Success == false) {
                if (options.errorTip) {
                    var tipOpts = $.extend(true, {}, options.errorTip);

                    var description;
                    if ($.isArray(ar.Errors) && ar.Errors.length) {
                        description = {
                            template: '<ul>{{each Errors as value}}<li>{{value}}</li>{{/each}}</ul>',
                            data: { Errors: ar.Errors }
                        };
                    }
                    tipOpts.message = ar.Message;
                    tipOpts.description = description;

                    if (ar.UnLogined) {
                        tipOpts.closed = function (e, edata) {
                            location.href = $.jui.loginPath;
                        }
                    }
                    if (ar.UnAuthed) {
                        tipOpts.closed = function (e, edata) {
                            location.href = $.jui.accessDeniedPath;
                        }
                    }
                    if (tipOpts.tipMode || !!tipOpts.tipElem) {
                        $.jui.tip.error(tipOpts);
                    }
                    else {
                        $.jui.alert.error(tipOpts);
                    }
                    return;
                }
            }
            else {
                if (options.successTip) {
                    $success = $.jui.tip.success(options.successTip);
                }
            }
            userOptions.success && userOptions.success.apply(this, arguments);

            if (ar && ar != null && ar.RedirectUrl) {
                top.location = ar.RedirectUrl;
            }
        }

        options.complete = function () {
            $loading && $loading.close();

            userOptions.complete && userOptions.complete.apply(this, arguments);
        };

        options.__responseHandled = true;

        return jQuery.ajax(options);
    };

    $.jui.postJson = function (userOptions) {
        userOptions = $.extend({}, userOptions, {
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            loading: {},
            notifySuccess: {}
        });

        if (userOptions.data && $.isPlainObject(userOptions.data) && userOptions.contentType == 'application/json') {
            userOptions.data = JSON.stringify(userOptions.data);
        }

        return $.jui.ajax(userOptions);
    }

    $.jui.getJson = function (userOptions) {
        userOptions = $.extend({}, userOptions, {
            type: 'GET',
            dataType: 'json'
        });

        return $.jui.ajax(userOptions);
    }

    $(document).ajaxComplete(function (e, xhr, settings) {

        try {
            var ar = $.parseJSON(xhr.responseText);
        }
        catch (e) {
            return;
        }

        if (ar && ar != null) {
            if (ar.UnLogined) {
                location.href = $.jui.loginPath;
            }
            if (ar.UnAuthed) {
                location.href = $.jui.accessDeniedPath;
            }
        }
    });

    $(document).ajaxError(function (e, xhr, settings) {

        try {
            var ar = $.parseJSON(xhr.responseText);
        }
        catch (e) {
            return;
        }

        if (ar && ar != null && ar.RedirectUrl) {
            top.location = ar.RedirectUrl;
        }

        if (ar && ar != null && ar.Message) {
            var msg = $.jui.utils.htmlEncode(ar.Message);
            msg = msg.replace(/\n/g, "<br>");

            var template = '<div class="modal">' +
                '<div class="modal-hd">' +
                '<div class="navbar">' +
                '<div class="navbar-hd"><h4>系统错误</h4></div>' +
                '<div class="navbar-ft"><span data-dismiss="jlayer" class="jlayer-close" id="btnClose"></span></div>' +
                '</div>' +
                '</div>' +
                '<div class="modal-bd">' +
                '<p>{{#msg}}</p>' +
                '</div>' +
                '<div class="modal-ft">' +
                '<button type="button" class="btn" data-role="cancel" data-dismiss="jlayer">关闭</button>' +
                '</div>' +
                '</div>';

            $.jui.modal({
                data: {
                    msg: msg
                },
                template: template
            });
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlist',[
            "jquery",
            "jqueryui",
            "../jcomponent",
            "../utils",
            "../misc/jpager",
            "../mixins/dataMixin"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jlist", $.jui.jcomponent, $.extend(true, {}, $.jui.dataMixin, {
        options: {
            autoBind: true,
            delayLoad: false,
            type: 'normal',
            fields: {
                key: 'Id',
                total: 'Total',
                items: 'Items'
            },
            templates: {
                layout: null,
                item: null,
                itemWrapper: null,
                edit: null,
                empty: null,
                firstAddOn: null,
                lastAddOn: null,
                tree: {
                    subitem: null,
                    children: null
                }
            },
            styleClasses: {
                itemSelected: "active",
            },
            cssClasses: {
                itemContainer: "jlist-items",
                item: "jlist-item",
                itemWrapper: "jlist-item-wrapper",
                itemSelected: "jlist-item-selected",
                itemPartSelected: "jlist-item-partselected",
                checkerAllChecked: "jlist-checker-all-checked",
                emptyItem: "jlist-empty",
                firstAddOn: "jlist-item-firstaddon",
                lastAddOn: "jlist-item-lastaddon"
            },
            selectors: {
                widget: '.jlist',
                itemContainer: ".jlist-items",
                item: ".jlist-item",
                itemWrapper: ".jlist-item-wrapper",
                itemSelected: ".jlist-item-selected",
                itemPartSelected: ".jlist-item-partselected",
                itemChecker: ".jlist-item-checker",
                checkerAll: ".jlist-checker-all",
                cCheckerAllChecked: ".jlist-checker-all-checked",
                emptyItem: ".jlist-empty",
                pager: ".jlist-pager",
                firstAddOn: ".jlist-item-firstaddon",
                lastAddOn: ".jlist-item-lastaddon"
            },
            pageable: false,
            selectable: {
                multiple: false,
                cascade: true,
                cascadeCancelParent: true,
                onlyleaf: true,
                selectOnClick: true,
                singleSelectCanRevert: false,
                checkAllElem: false
            },
            tree: {
                isListData: true,
                indent: 16,
                initCollapseLevel: false,
                fields: {
                    key: 'Id',
                    children: 'Children',
                    parentKey: 'ParentId'
                },
                toggleOnClick: false,
                popChildren: false,
                popTriggerType: 'click',
                popAppendTo: 'body',
                cssClasses: {
                    children: "jlist-children",
                    childrenItemContainer: "jlist-children-items",
                    toggle: "jlist-item-toggle",
                    leaf: "jlist-item-leaf",
                    collapsed: "jlist-item-collapsed"
                },
                selectors: {
                    children: ".jlist-children",
                    childrenItemContainer: ".jlist-children-items",
                    toggle: '.jlist-item-toggle',
                    leaf: ".jlist-item-leaf"
                }
            },
            group: {
                cssClasses: {
                    group: "jlist-group",
                    children: "jlist-children",
                    childrenItemContainer: "jlist-children-items"
                },
                selectors: {
                    group: ".jlist-group",
                    children: ".jlist-children",
                    childrenItems: ".jlist-children-items"
                },
                groupsFiled: "Groups",
                childrenField: 'Children',
                cssClass: "jlist-group",
                selector: ".jlist-group",
                templates: null
            },
            initEdit: false,
            bindExtra: false,

            buildItemData: $.noop,
            itemConverter: null,

            loading: {},

            itemClick: function () { },
            selected: function () { }
        },

        _$itemContainer: null,
        _$pager: null,
        _context: null,
        _total: 0,

        _render: function () {
            var that = this, opts = that.options;

            this.itemelems = [];
            this.removedItemDatas = [];
            this.removedItemElems = [];

            var nodeName = this.element[0].nodeName.toLowerCase();
            /*if (nodeName != 'div') {
                throw "jlist 插件元素必须是 div";
            }*/

            this.element.addClass('jlist');

            this._getTemplates();

            if (opts.templates.layout) {
                this.element.html(opts.templates.layout);
            }
            if (this.element.is(opts.selectors.itemContainer)) {
                this._$itemContainer = this.element;
            }
            else {
                this._$itemContainer = this.element.find(opts.selectors.itemContainer);
                if (!this._$itemContainer.length) {
                    this._$itemContainer = this.element.addClass(opts.cssClasses.itemContainer);
                }
            }

            this._$itemContainer.addClass(opts.styleClasses.itemContainer);

            if (opts.pageable) {
                if (opts.pageable.el) {
                    this._$pager = opts.pageable.el;
                }
                else {
                    this._$pager = this.element.find(opts.selectors.pager);
                }
                if (!this._$pager.length) {
                    this._$pager = $("<div>").appendTo(this.element);
                }
                var pagerOpts = $.extend({
                }, opts.pageable, {
                        pageChanged: function (e, data) {
                            // 注意这里，opts的引用不能变，闭包的坑。或者改用 that.options。
                            opts.pageable.pageIndex = data.pageIndex;
                            opts.pageable.pageSize = data.pageSize;
                            that.bind();
                        }
                    });
                this._$pager.jpager(pagerOpts);
                opts.pageable = this._$pager.jpager("option");
            }

            if (opts.selectable && opts.selectable.multiple) {
                this._$checkerAll = this.element.find(opts.selectors.checkerAll);
                if (this._$checkerAll.length) {
                    bindCheckAllEvent(this._$checkerAll);
                }

                if (opts.selectable.checkAllElem) {
                    this._$checkerAll = $(opts.selectable.checkAllElem);
                    bindCheckAllEvent($(opts.selectable.checkAllElem));
                }
            }

            function bindCheckAllEvent($checkerAll) {
                $checkerAll.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if ($checkerAll.hasClass(opts.cssClasses.checkerAllChecked)) {
                        that.deselectAll();
                        $checkerAll.removeClass(opts.cssClasses.checkerAllChecked);
                    }
                    else {
                        that.selectAll();
                        $checkerAll.addClass(opts.cssClasses.checkerAllChecked);
                    }
                });
            }
        },
        _init: function () {
            if (this.options.autoBind) {
                this.bind();
            }
        },
        refresh: function (options) {
            //this.options = $.extend(true, {}, this.options, options); 这种用法会改变原来 options 的引用，造成上面 pager 回调的坑。
            this.options = $.extend(true, this.options, options);
            if (this.options.pageable) {
                this.options.pageable.pageIndex = 1;
            }
            this.bind();
        },
        bind: function () {
            var that = this;
            var opts = this.options;
            var params = {};
            if (opts.pageable) {
                params[opts.pageable.fields.pageIndex] = opts.pageable.pageIndex;
                params[opts.pageable.fields.pageSize] = opts.pageable.pageSize;
            }
            if (opts.dataUrl && opts.loading) {
                if (that.$loading) {
                    that.$loading.close();
                }
                opts.loading.appendTo = that.element;
                that.$loadding = $.jui.tip.loading(opts.loading)
            }
            this._getData(function () {
                if (that.$loadding) {
                    that.$loadding.close();
                }

                that.bindData(that.data);
            }, params);

        },
        bindData: function (data) {
            var that = this, opts = this.options;

            /*if (!data) {
                that._$itemContainer.empty();
                this._total = 0;
                this._addEmpty();
                that._trigger("dataBound", null, { data: data });
                return;
            }*/

            if (!data) {
                data = [];
            }

            that._$itemContainer.empty();
            var items;
            if ($.isArray(data)) {
                items = data;
            }
            else {
                items = data[opts.fields.items];
            }
            if (!$.isArray(items)) {
                items = [];
            }
            that._total = items.length;
            if (!(items.length > 0)) {
                this._addEmpty();
            }

            if (opts.templates.firstAddOn) {
                var itemHtml = $.jui.tmpl(opts.templates.firstAddOn, {});
                var $firstAddOn = $(itemHtml).addClass(opts.cssClasses.firstAddOn);
                this._$itemContainer.append($firstAddOn);

                $firstAddOn.find("[data-command]").on("click", function (e) {
                    var $target = $(e.currentTarget);
                    var command = $target.attr('data-command');
                    if (command) {
                        e.preventDefault();
                        e.stopPropagation();
                        that._trigger('itemCommand', e, { command: command });
                        return;
                    }
                });
            }

            if (opts.type == 'group') {
                for (var i = 0; i < data[opts.group.groupsField].length; i++) {
                    var group = data[opts.group.groupsField][i];
                    that._bindGroup(group);
                }
            }
            else if (opts.type == 'tree') {
                var treeItems = items;
                if (opts.tree.isListData) {
                    treeItems = that._toTreeData(items);
                }
                if (opts.delayLoad) {
                    that.element.data("data", treeItems);
                }
                for (var i = 0; i < treeItems.length; i++) {
                    var item = treeItems[i];
                    that.bindItem(item, null, true);
                }
            }
            else {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var first = false;
                    var last = false;
                    if (i == 0) {
                        first = true;
                    }
                    if (i == items.length - 1) {
                        last = true;
                    }
                    that.bindItem(item, { index: i, first: first, last: last, items: items }, true);
                }
            }

            if (opts.pageable) {
                that._total = data[opts.fields.total];
                this._$pager.jpager("bind", { total: that._total, pageIndex: opts.pageable.pageIndex });
            }

            if (opts.templates.lastAddOn) {
                var itemHtml = $.jui.tmpl(opts.templates.lastAddOn, {});
                var $lastAddOn = $(itemHtml).addClass(opts.cssClasses.lastAddOn);
                this._$itemContainer.append($lastAddOn);

                $lastAddOn.find("[data-command]").on("click", function (e) {
                    var $target = $(e.currentTarget);
                    var command = $target.attr('data-command');
                    if (command) {
                        e.preventDefault();
                        e.stopPropagation();
                        that._trigger('itemCommand', e, { command: command });
                        return;
                    }
                });
            }

            that._trigger("dataBound", null, { data: data });
        },
        _getTemplates: function () {
            var opts = this.options;

            var tmplScripts = this._find('script[type="text/html"]');
            tmplScripts.each(function (index, elem) {
                var tmpl = $(this);
                var role = tmpl.attr('data-role');
                if (role.indexOf('.') > 0) {
                    var roleArr = role.split('.');
                    opts.templates[roleArr[0]][roleArr[1]] = tmpl.html();
                } else {
                    opts.templates[role] = tmpl.html();
                }
            });
        },
        _bindEvents: function ($item) {
            var that = this;
            var opts = this.options;
            var itemData = $item.data('itemData');
            var $commands = $item.find("[data-command]");
            if ($item.is("[data-command]")) {
                $commands = $commands.add($item);
            }
            $commands.on("click", function (e) {
                var $target = $(e.currentTarget);
                var command = $target.attr('data-command');
                if (command) {
                    e.preventDefault();
                    e.stopPropagation();
                    that._trigger('itemCommand', e, { command: command, itemData: itemData, itemElem: $item });
                    return;
                }
            });
            if (opts.tree.popChildren) {
                var $children = that._getChildren($item);
                $item.data('children', $children);
                if (!that.popChildrenElems) {
                    that.popChildrenElems = [];
                }
                that.popChildrenElems.push($children);

                if ($children) {
                    $item.jpop({
                        layerElem: $children,
                        triggerType: opts.tree.popTriggerType,
                        layer: { appendTo: opts.tree.popAppendTo }
                    });
                }
            }

            $item.on("click", function (e) {
                var $target = $(e.target);
                if (opts.type == 'tree') {
                    var isFolder = !$item.is(opts.tree.selectors.leaf);

                    if (!opts.tree.popChildren) {
                        if ($target.is(opts.tree.selectors.toggle) || (isFolder && opts.tree.toggleOnClick)) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (opts.delayLoad) {
                                if (!$item.data('isLoadedChildren')) {
                                    $item.data('isLoadedChildren', true);
                                    var children = itemData[opts.tree.fields.children];
                                    if (children && children.length)
                                        $item.toggleClass(opts.tree.cssClasses.collapsed);
                                    $.each(children, function (idx, subItem) {
                                        var subOptions = { isShowForDelayLoad: true, relativeItem: $item };
                                        that.bindItem(subItem, subOptions);
                                    });
                                    return;
                                }
                            }
                            var $children = that._getChildren($item);
                            if ($children != null) {
                                $children.toggleClass("hide");
                                $item.toggleClass(opts.tree.cssClasses.collapsed);

                            }

                            return;
                        }
                    }
                }
                if ($item.is('.jlist-item-disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                if (opts.selectable && $target.is(opts.selectors.itemChecker)) {
                    e.preventDefault();
                    e.stopPropagation();

                    //that._selectItemElem($item);
                    that.select($item);
                    return;
                }

                //if ($item.attr("isnew") == "false") {
                if (opts.selectable && opts.selectable.selectOnClick) {
                    that.select($item);
                }
                //}

                
                that._trigger('itemClick', e, { itemElem: $item, itemData: itemData, inst: that });

            });
        },
        _parse: function () {
            var that = this;
            that._$itemContainer.find(that.options.selectors.item).each(function () {
                var item = {};
                var itemStr = $(this).attr("data-item");
                if (itemStr) {
                    if (itemStr.substring(0, 1) != '{') {
                        itemStr = '{' + itemStr + '}';
                    }
                    item = (new Function('return ' + itemStr))();
                }
                $(this).data('item', item);
            });
        },
        _createItem: function (itemData, options) {
            var that = this;
            var opts = this.options;
            options = $.extend({
                level: 0,
                isNew: false,
                isEdit: false
            }, options);
            if (this._context) {
                itemData.context = this._context;
            }

            if (opts.itemConverter && $.isFunction(opts.itemConverter)) {
                itemData = opts.itemConverter.call(that, itemData);
            }
            var itemTmpl = this.options.templates.item;
            if (options.isEdit) {
                itemTmpl = this.options.templates.edit;
            }
            if (opts.type == 'tree' && options.level > 0 && opts.templates.tree.subitem) {
                itemTmpl = opts.templates.tree.subitem;
            }

            var bindData = itemData;
            if (opts.bindExtra) {
                bindData = $.extend({
                    item: itemData
                }, options);
            }
            var itemHtml = $.jui.tmpl(itemTmpl, bindData);

            var $item = $(itemHtml)
                .addClass(this.options.cssClasses.item).addClass(this.options.styleClasses.item)
                .attr('data-item-key', itemData[this.options.fields.key])
                .data('itemData', itemData)
                .attr('isnew', options.isNew)
                .attr('isedit', options.isEdit);

            if (this.options.type == 'tree') {
                $item.data("level", options.level);
                var $jlistIndent = $item.find(".jlist-indent");
                if (!$jlistIndent.length) {
                    $jlistIndent = $item;
                }
                if (options.level > 0 && this.options.tree.indent) {
                    if (!opts.tree.popChildren) {
                        $jlistIndent.css("padding-left", options.level * this.options.tree.indent);
                    }
                }

                if (opts.tree.initCollapseLevel != false && opts.tree.initCollapseLevel - 1 <= options.level) {
                    $item.addClass(opts.tree.cssClasses.collapsed);
                }
            }

            this._trigger("itemCreated", null, { itemElem: $item, itemData: itemData, createOptions: options })

            return $item;
        },
        bindItem: function (itemData, options, isInit) {
            var that = this;
            var opts = that.options;
            var isNew = true;
            if (isInit) {
                isNew = false;
            }
            if (itemData === undefined || itemData == null) {
                itemData = {};
            }

            var isEdit = false;
            if (isInit && opts.initEdit) {
                isEdit = true;
            }

            //Set defaults
            options = $.extend({
                relativeItem: null,
                target: null,
                isEdit: isEdit,
                position: 'append'
            }, options);

            var $target = options.target;
            if (options.target == null) {
                $target = this._$itemContainer;
            }

            if (!options.target && options.relativeItem) {
                $target = options.relativeItem;
            }

            var createItemOptions = {
                isNew: isNew, isEdit: options.isEdit,
                first: options.first, last: options.last,
                index: options.index
            };
            if (that.options.type == 'tree') {
                if (options.position == "append" || options.position == "prepend") {
                    if (options.relativeItem) {
                        $target = that._getChildrenItemContainer(options.relativeItem);
                        createItemOptions.level = options.relativeItem.data("level") + 1;
                        if (!opts.tree.popChildren && (opts.tree.initCollapseLevel != false && opts.tree.initCollapseLevel <= createItemOptions.level) && !options.isShowForDelayLoad) {
                            $target.addClass("hide");
                        }
                        if (opts.tree.popChildren) {
                            $target.css('display', 'none');
                        }
                    }
                }
                else {
                    if (opts.templates.itemWrapper && options.relativeItem) {
                        $target = that._getItemWrapper(options.relativeItem);
                    }

                    if (options.relativeItem) {
                        createItemOptions.level = options.relativeItem.data("level");
                    }
                    if (options.position == "after") {
                        var $children = that._getChildren(options.relativeItem);
                        if ($children != null) {
                            $target = $children;
                        }
                    }
                }
            }
            else {
                if (opts.templates.itemWrapper && options.relativeItem) {
                    $target = that._getItemWrapper(options.relativeItem);
                }
            }

            if (options.position == 'replace') {
                createItemOptions.isNew = options.relativeItem.attr("isNew");
            }

            // create item
            var $item = this._createItem(itemData, createItemOptions);

            if (options.position == 'replace') {
                $item.data("itemInitData", options.relativeItem.data("itemInitData"));
            }
            else {
                $item.data("itemInitData", itemData);
            }
            $item.data("itemData", itemData);
            if (that.options.type == 'tree') {
                var children = itemData[that.options.tree.fields.children];
                if (!$.isArray(children) || !children.length > 0) {
                    $item.addClass(that.options.tree.cssClasses.leaf);
                }
            }

            var toBound = $item;

            if (opts.templates.itemWrapper) {
                var itemWrapperHtml = $.jui.tmpl(opts.templates.itemWrapper, itemData);
                var $itemWrapper = $(itemWrapperHtml);
                $itemWrapper.wrapInner($item).addClass(opts.cssClasses.itemWrapper).addClass(opts.styleClasses.itemWrapper);
                toBound = $itemWrapper;
            }

            if (options.position == 'prepend') {
                toBound.prependTo($target);
            }
            else if (options.position == 'append') {
                var $lastAddOn = $target.children(opts.selectors.lastAddOn);
                if ($lastAddOn.length) {
                    toBound.insertBefore($lastAddOn);
                }
                else {
                    toBound.appendTo($target);
                }
            }
            else if (options.position == 'after') {
                toBound.insertAfter($target);
            }
            else if (options.position == 'replace') {
                $item.replaceAll($target);
            }

            if (!isInit && options.position != 'replace') {
                that._total++;
                if (that.options.pageable) {
                    that._$pager.jpager('bind', { total: that._total });
                }
            }

            if (that.options.type == 'tree') {
                var children = itemData[this.options.tree.fields.children];
                if (options.position != 'replace' && $.isArray(children) && children.length > 0) {

                    var subOptions = $.extend(options, { relativeItem: $item })
                    if (opts.delayLoad) {

                        if (opts.tree.initCollapseLevel > $item.data("level") + 1) {
                            $item.data('isLoadedChildren', true);
                            $.each(children, function (index, subItem) {
                                that.bindItem(subItem, subOptions, isInit);
                            });
                        }

                    } else {
                        $.each(children, function (index, subItem) {
                            that.bindItem(subItem, subOptions, isInit);
                        });
                    }
                }
            }

            this._removeEmpty();

            this._bindEvents($item);

            this._trigger("itemDataBound", null, { itemData: itemData, itemElem: $item, isEdit: options.isEdit, isInit: isInit });

            return $item;
        },
        _createGroup: function (groupData) {
            var groupHtml = $.jui.tmpl(this.options.group.template, groupData);
            var $group = $(groupHtml)
                .addClass(this.options.group.cssClasses.group)
                .data('groupData', groupData);

            return $group;
        },
        _bindGroup: function (groupData) {
            var that = this;
            var $group = this._createGroup(groupData);
            this._$itemContainer.append($group);
            var $groupChildren = $group.find(this.options.group.selectors.children);
            var children = groupData[this.options.group.childrenField];
            if (children && children.length) {
                for (var i = 0; i < children.length; i++) {
                    var item = children[i];
                    that.bindItem(item, { target: $groupChildren }, true);
                }
            }
        },
        _getItemWrapper: function ($item) {
            return $item.closest(this.options.selectors.itemWrapper);
        },
        _getParent: function ($item) {
            var $itemContainer = $item.closest(this.options.tree.selectors.children);
            if ($itemContainer && $itemContainer.length != 0) {
                return $itemContainer.prev();
            }
            else {
                return null;
            }
        },
        _getChildren: function ($item) {
            var $next = $item.next();
            if ($next.is(this.options.tree.selectors.children)) {
                return $next;
            }
            return null;
        },
        _getChildrenItemContainer: function ($item, addIfNotFound) {
            if ($item.data('children')) {
                return $item.data('children');
            }
            var $next = $item.next();
            if (!$next.is(this.options.tree.selectors.children)) {
                $next = $($.jui.tmpl(this.options.templates.tree.children, {})).insertAfter($item);
                $next.addClass(this.options.tree.cssClasses.children);
            }
            if ($next.is(this.options.tree.selectors.childrenItemContainer)) {
                return $next;
            }
            var $childrenItemContainer = $next.findUntil(this.options.tree.selectors.childrenItemContainer, this.options.tree.selectors.childrenItemContainer);
            if (!$childrenItemContainer.length) {
                $childrenItemContainer = $next.addClass(this.options.tree.cssClasses.childrenItemContainer);
            }

            return $childrenItemContainer;
        },

        _getChildItemElems: function (parentItemElem) {
            if (!parentItemElem) {
                return this._$itemContainer.findUntil(this.options.selectors.item, [this.options.selectors.widget, this.options.tree.selectors.children]);
            }
            else {
                var subItemContainer = this._getChildrenItemContainer(parentItemElem);

                return subItemContainer.findUntil(this.options.selectors.item, [this.options.selectors.widget, this.options.tree.selectors.children]);
            }
        },

        getShortSelected: function (parentItemElem, result) {
            var that = this, opts = this.options;

            result = typeof result !== 'undefined' ? result : [];

            var itemElems = this._getChildItemElems(parentItemElem);

            itemElems.each(function (index, itemElem) {
                if ($(itemElem).is(opts.selectors.itemSelected)) {
                    result.push(that.getItemData($(itemElem)));
                }
                else {
                    that.getShortSelected($(itemElem), result);
                }
            });

            return result;
        },

        select: function (param, notFireEvent, notCascade, notRevert, callback) {
            var that = this;
            var selectionChanged = false;
            var selectOptions = notFireEvent;
            if (!notFireEvent || !$.isPlainObject(notFireEvent)) {
                selectOptions = {
                    notFireEvent: notFireEvent,
                    notCascade: notCascade,
                    notRevert: notRevert,
                    callback: callback
                }
            }
            (function () {
                if (!that.gettingData) {
                    if ($.jui.utils.isJqObj(param) && param.length > 1) {
                        param.each(function () {
                            selectionChanged = that._selectSingle($(this), selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                        });
                    }
                    else if ($.isArray(param)) {
                        $.each(param, function (index, value) {
                            selectionChanged = that._selectSingle(value, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                        });
                    }
                    else {
                        selectionChanged = that._selectSingle(param, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert) || selectionChanged;
                    }

                    if (!selectOptions.notFireEvent && selectionChanged) {
                        that._trigger('selectionChanged', null, {})
                    }

                    that._refreshCheckerAllState();

                    if (selectOptions.callback && $.isFunction(selectOptions.callback)) {
                        selectOptions.callback.call(that);
                    }
                }
                else {
                    setTimeout(arguments.callee, 200);
                }
            })();
        },
        selectIndex: function (index, selectOptions) {
            var $item = getAllItemElems().eq(index);

            var selectionChanged = this._selectSingle($item, selectOptions.notFireEvent, selectOptions.notCascade, selectOptions.notRevert);

            if (!selectOptions.notFireEvent && selectionChanged) {
                this._trigger('selectionChanged', null, {})
            }
        },
        selectAll: function () {
            var allItemElems = this.getAllItemElems();
            this.select(allItemElems, true, true, true);
        },

        deselect: function (param, notFireEvent) {
            var that = this;

            (function () {
                if (!that.gettingData) {
                    var selectionChanged;
                    if ($.jui.utils.isJqObj(param) && param.length > 1) {
                        param.each(function () {
                            selectionChanged = that._deselectSingle($(this), notFireEvent) || selectionChanged;
                        });
                    }
                    else if ($.isArray(param)) {
                        $.each(param, function (index, value) {
                            selectionChanged = that._deselectSingle(value, notFireEvent) || selectionChanged;
                        });
                    }
                    else {
                        selectionChanged = that._deselectSingle(param, notFireEvent) || selectionChanged;
                    }

                    if (!notFireEvent && selectionChanged) {
                        that._trigger('selectionChanged', null, {})
                    }

                    that._refreshCheckerAllState();
                }
                else {
                    setTimeout(arguments.callee, 200);
                }
            })();
        },

        deselectAll: function () {
            var allItemElems = this.getAllItemElems();
            this.deselect(allItemElems, true);
        },

        _selectItemElem: function ($item, notFireEvent, notCascade, notRevert) {
            var selectionChanged = false;

            var that = this;
            var opts = this.options;
            if (notCascade === undefined) {
                notCascade = !opts.selectable.cascade;
            }
            if (opts.selectable.onlyleaf && opts.type == "tree") {
                if (!$item.is(opts.tree.selectors.leaf)) {
                    return;
                }
            }
            var alreadySelected = !!$item.hasClass(opts.cssClasses.itemSelected);
            if (alreadySelected) {
                if (!notRevert) {
                    if (!(opts.selectable.singleSelectCanRevert || opts.selectable.multiple)) {
                        return;
                    }
                    else {
                        selectionChanged = this._deselectItemElems($item) || selectionChanged;
                    }
                }
            }
            else {
                if (!opts.selectable.multiple) {
                    this._deselectItemElems(this._getSelectedItemElems());
                }

                $item.removeClass(opts.cssClasses.itemPartSelected)
                    .addClass(that.options.cssClasses.itemSelected).addClass(that.options.styleClasses.itemSelected);

                if (!(notFireEvent != undefined && notFireEvent == true)) {
                    this._trigger("itemSelected", null, { itemElem: $item, itemData: this.getItemData($item) });

                    selectionChanged = true;
                }
            }

            if (opts.type == "tree" && !notCascade) {
                setParentCheckbox($item);
                setChildCheckbox($item);
            }
            function setChildCheckbox($pitem) {
                var $children = that._getChildren($pitem);
                if ($children) {
                    var $childrenItems = $children.findUntil(opts.selectors.item, opts.selectors.widget);
                    $childrenItems.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);

                    if ($pitem.hasClass(opts.cssClasses.itemSelected)) {
                        $childrenItems.addClass(opts.cssClasses.itemSelected).addClass(opts.styleClasses.itemSelected);
                    }
                }
            }

            function setParentCheckbox(node) {
                var pnode = that._getParent(node);
                if (pnode) {
                    var $children = that._getChildren(pnode);
                    $children.removeClass("hide");
                    pnode.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);

                    if (isAllSelected(node, pnode)) {
                        pnode.addClass(opts.cssClasses.itemSelected).addClass(opts.styleClasses.itemSelected);
                    }
                    else {
                        if (!isAllNull(node, pnode)) {
                            pnode.addClass(opts.cssClasses.itemPartSelected);
                        }
                        else {
                            if (!opts.cascadeCancelParent) {
                                pnode.addClass(opts.cssClasses.itemPartSelected);
                            }
                        }
                    }
                    setParentCheckbox(pnode);
                }

                function isAllSelected(node, pnode) {
                    if (!node.hasClass(opts.cssClasses.itemSelected)) return false;
                    var b = true;
                    var $children = that._getChildren(pnode);
                    var $childrenItems = $children.find(opts.selectors.item);
                    $childrenItems.each(function () {
                        if (!$(this).hasClass(opts.cssClasses.itemSelected)) {
                            b = false;
                            return false;
                        }
                    });
                    return b;
                }
                function isAllNull(node, pnode) {
                    if (node, pnode.hasClass(opts.cssClasses.itemSelected) || node, pnode.hasClass(opts.cssClasses.itemPartSelected)) return false;
                    var b = true;
                    var $children = that._getChildren(pnode);
                    var $childrenItems = $children.find(opts.selectors.item);
                    $childrenItems.each(function () {
                        if ($(this).hasClass(opts.cssClasses.itemSelected) || $(this).hasClass(opts.cssClasses.itemPartSelected)) {
                            b = false;
                            return false;
                        }
                    });
                    return b;
                }
            }

            return selectionChanged;
        },
        selectTo: function (single) {//选中指定节点，并向上展开父节点，如果父节点已展开 则不继续往上查找
            var that = this;
            var opts = that.options;
            var $item = this.getItemElem(single);
            var nodeArry = [];
            if ($item.length) {
                this._selectItemElem($item);
                expandTo($item);
                if (!$item.is(that.options.tree.cssClasses.leaf)) {
                    var $children = that._getChildren($item);
                    if (!$children) {
                        if (that.options.delayLoad && !$item.data('isLoadedChildren')) {
                            $item.data('isLoadedChildren', true);
                            var itemData = $item.data('itemData');
                            var children = itemData[opts.tree.fields.children];
                            $.each(children, function (idx, subItem) {
                                var subOptions = { isShowForDelayLoad: true, relativeItem: $item };
                                that.bindItem(subItem, subOptions);
                            });
                        }
                    }
                    else if ($children.hasClass("hide")) {
                        $children.removeClass("hide");
                    }
                    $item.removeClass(opts.tree.cssClasses.collapsed);
                }
                scrollToView($item.get(0));
            }
            else if (that.options.delayLoad) {//如果这个节点没有加载，则从根节点加载下来
                var treeData = that.element.data('data');
                fromParentTo(treeData, single);//从父节点查找到当前节点
                for (var i = nodeArry.length - 1; i >= 0; i--) {
                    var $item = that.getItemElem(nodeArry[i][opts.fields.key]);
                    if (!$item.length) {
                        $.each(nodeArry[i + 1][opts.tree.fields.children], function (idx, subItem) {
                            var $parentItem = that.getItemElem(nodeArry[i + 1][opts.fields.key]);
                            var subOptions = { isShowForDelayLoad: true, relativeItem: $parentItem };
                            that.bindItem(subItem, subOptions);
                            $parentItem.data('isLoadedChildren', true);
                            $parentItem.removeClass(opts.tree.cssClasses.collapsed);
                        });
                    }
                }
                if (nodeArry.length > 0) {
                    $item = that.getItemElem(nodeArry[0][opts.fields.key]);
                    that._selectItemElem($item);
                    scrollToView($item.get(0));
                }
            }
            function expandTo($currentNode) {//从子节点展开到父节点
                var $pnode = that._getParent($currentNode);
                if ($pnode) {
                    var $children = that._getChildren($pnode);
                    if ($children.hasClass("hide")) {
                        $children.removeClass("hide");
                        expandTo($pnode);
                        $pnode.removeClass(opts.tree.cssClasses.collapsed);
                    }
                }
            }
            function fromParentTo(treeData, id) {//从父节点查找到当前节点
                $.each(treeData, function (idx, item) {
                    if (item[opts.fields.key] == id) {
                        nodeArry.push(item);
                        return false;
                    }
                    else if (item[opts.tree.fields.children] && item[opts.tree.fields.children].length) {
                        fromParentTo(item[opts.tree.fields.children], id);
                        if (nodeArry.length > 0) {
                            nodeArry.push(item);
                            return false;
                        }
                    }
                });
            }
            function scrollToView(target) {
                var isInView = (target.offsetTop > that.element.scrollTop() && (target.offsetTop < (that.element.scrollTop() + that.element.height())));
                //是否在可视区域内，如果isInView=false，不在可视区域
                if (!isInView && target.scrollIntoView)
                    target.scrollIntoView(false);
            }
        },
        _deselectItemElems: function ($items, notFireEvent) {
            var that = this;
            var opts = this.options;

            var selectionChanged = false;

            $items.each(function (index, item) {
                var $item = $(this);

                var alreadySelected = !!$item.hasClass(opts.cssClasses.itemSelected);
                if (alreadySelected) {
                    $item.removeClass(opts.cssClasses.itemSelected).removeClass(opts.styleClasses.itemSelected)
                        .removeClass(opts.cssClasses.itemPartSelected);
                    if (!(notFireEvent != undefined && notFireEvent == true)) {
                        that._trigger("itemDeselected", null, { itemElem: $item, itemData: that.getItemData($item) });

                        selectionChanged = true;
                    }
                }
            });

            return selectionChanged;
        },
        _getSelectedItemElems: function (withPartParent) {
            var selectors = this.options.selectors.itemSelected;
            if (withPartParent) {
                selectors += "," + this.options.selectors.itemPartSelected;
            }
            return this.element.findUntil(selectors, this.options.selectors.widget);
        },
        _selectSingle: function (single, notFireEvent, notCascade, notRevert) {
            var selectionChanged = false;
            var $item = this.getItemElem(single);
            if ($item.length) {
                selectionChanged = this._selectItemElem($item, notFireEvent, notCascade, notRevert) || selectionChanged;
            }

            return selectionChanged;
        },
        _deselectSingle: function (single, notFireEvent) {
            var $item = this.getItemElem(single);
            return this._deselectItemElems($item, notFireEvent);
        },
        append: function (itemData, isEdit, parentItem) {
            var that = this;

            var options = { position: 'append', isEdit: isEdit, relativeItem: parentItem };
            var $item = null;
            if ($.isArray(itemData)) {
                $.each(itemData, function (index, value) {
                    $item = that.bindItem(value, options);
                    if (parentItem) {
                        parentItem.removeClass(that.options.tree.cssClasses.leaf);
                    }
                });
            }
            else {
                $item = that.bindItem(itemData, options);
                if (parentItem) {
                    parentItem.removeClass(that.options.tree.cssClasses.leaf);
                }
            }

            return $item;
        },
        prepend: function (itemData, isEdit, parentItem) {
            var options = { position: 'prepend', isEdit: isEdit, relativeItem: parentItem };

            this.bindItem(itemData, options);
        },
        insert: function (itemData, isEdit, targetItem) {
            this.bindItem(itemData, { position: 'after', relativeItem: targetItem, isEdit: isEdit });
        },
        update: function (newItemData, $item) {
            this.bindItem(newItemData, { position: 'replace', relativeItem: $item, isEdit: false });
        },
        remove: function (removeData, notFireEvent) {
            var that = this;
            if ($.isArray(removeData)) {
                $.each(removeData, function (index, value) {
                    that._removeSingle(value, notFireEvent);
                });
            }
            else {
                that._removeSingle(removeData, notFireEvent);
            }
        },
        _removeSingle: function (single) {
            var $item = this.getItemElem(single);
            this._removeItem($item);
        },
        _removeItem: function ($item) {
            var that = this;
            that._trigger("beforeItemRemove", null, { itemElem: $item });
            if (!($item.attr("isnew") == "true")) {
                this.removedItemElems.push($item);
                this.removedItemDatas.push($item.data("itemInitData"));
            }
            if (that.options.type == 'tree') {
                var childrenItem = that._getChildren($item);
                if (childrenItem) {
                    childrenItem.remove();
                }
            }
            $item.remove();
            that._trigger("itemRemoved", null, { itemElem: $item });
            that._total--;
            if (that.options.pageable) {
                that._$pager.jpager('bind', { total: that._total });
            }
            that._addEmpty();
        },
        editItem: function ($item) {
            var alreadyInEdit = $item.attr("isedit") == true;
            if (alreadyInEdit) {
                return;
            }
            var itemData = $item.data("itemData");

            var $editedItem = this.bindItem(itemData, { position: "replace", isEdit: true, relativeItem: $item });
            $editedItem.data("inEdit", true);
        },
        cancelItem: function ($item) {
            var notInEdit = !($item.attr("isedit") == "true");
            if (notInEdit) {
                return;
            }
            if (!$item.data("inEdit")) {
                this._removeItem($item);
                return;
            }
            var newItemData = $item.data("itemData");

            this.bindItem(newItemData, { position: "replace", isEdit: false, relativeItem: $item });
        },
        saveItem: function ($item) {
            var notInEdit = !($item.attr("isedit") == "true");
            if (notInEdit) {
                return;
            }
            var newItemData = this.getItemData($item);
            this.updateItem($item, newItemData);
            return newItemData;
        },
        getItemData: function ($item, build, notDeep) {
            if (build) {
                return $.extend(!notDeep, {}, $item.data("itemInitData"), this.options.buildItemData($item));
            }
            var isEdit = $item.attr("isedit") == "true";
            if (isEdit) {
                return $.extend(!notDeep, {}, $item.data("itemInitData"), this.options.buildItemData($item));
            }
            else {
                return $item.data("itemData");
            }
        },
        getAll: function () {
            var that = this;
            var allItemElems = this._$itemContainer.findUntil(that.options.selectors.item, that.options.selectors.widget);
            var allItemDatas = [];
            allItemElems.each(function () {
                allItemDatas.push(that.getItemData($(this)));
            });

            return allItemDatas;

        },
        getSelected: function (withPartParent) {
            var that = this;

            var selectedItemDatas = [];
            var selectedItems = this._getSelectedItemElems(withPartParent);
            selectedItems.each(function () {
                selectedItemDatas.push(that.getItemData($(this)));
            });

            return selectedItemDatas;
        },
        getChanges: function (notDeep) {
            var that = this;
            var addedItemDataArray = [];
            var updatedItemDataArray = [];
            var newItemElems = this.getNewItems();
            newItemElems.each(function () {
                addedItemDataArray.push(that.getItemData($(this), undefined, notDeep));
            });
            var initItemElems = this.getInitItems();
            initItemElems.each(function () {
                var initData = $(this).data("itemInitData");
                var newData = that.getItemData($(this), undefined, notDeep);
                if (!$.jui.utils.jsonEqual(initData, newData)) {
                    updatedItemDataArray.push(newData);
                }
            });
            return {
                added: addedItemDataArray,
                updated: updatedItemDataArray,
                removed: that.removedItemDatas
            };
        },
        getItemElem: function (single) {
            var that = this, opts = that.options;
            var $item;
            if ($.jui.utils.isJqObj(single)) {
                $item = single;
            }
            else {
                var id = single;
                if ($.isPlainObject(single)) {
                    id = single[this.options.fields.key];
                }
                $item = $(that.options.selectors.item + '[data-item-key="' + id + '"]', that.element);

                if ($item.length == 0) {
                    if ($.isArray(that.popChildrenElems)) {
                        for (var i = 0; i < that.popChildrenElems.length; i++) {
                            $item = $(that.options.selectors.item + '[data-item-key="' + id + '"]', that.popChildrenElems[i]);
                            if ($item.length > 0) {
                                break;
                            }
                        }
                    }
                }
            }
            return $item;
        },
        getFirstLeaf: function () {
            var itemElem = this._$itemContainer.findUntil(this.options.tree.selectors.leaf, this.options.selectors.widget).first();
            var itemData = itemElem.data('itemData');

            return {
                itemElem: itemElem,
                itemData: itemData
            }
        },
        getAllItemElems: function () {
            var allItems = this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget);
            if ($.isArray(this.popChildrenElems)) {
                for (var i = 0; i < this.popChildrenElems.length; i++) {
                    allItems.add(this.popChildrenElems[i].findUntil(this.options.selectors.item, this.options.selectors.widget));
                }
            }

            return allItems;
        },
        getNewItems: function () {
            return this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget).filter('[isnew="true"]');
        },
        getInitItems: function () {
            return this._$itemContainer.findUntil(this.options.selectors.item, this.options.selectors.widget).filter('[isnew="false"]');
        },
        getAllPrevItemElems: function ($item) {
            var that = this, opts = this.options;
            if (this.options.selectors.itemWrapper) {
                var $itemWrapper = this._getItemWrapper($item);
                var prevItemWrappers = $itemWrapper.prevAll();
                return prevItemWrappers.find(opts.selectors.item);
            }
            else {
                return $item.prevAll();
            }
        },
        getAllNextItemElems: function ($item) {
            var that = this, opts = this.options;
            if (this.options.selectors.itemWrapper) {
                var $itemWrapper = this._getItemWrapper($item);
                var prevItemWrappers = $itemWrapper.nextAll();
                return prevItemWrappers.find(opts.selectors.item);
            }
            else {
                return $item.nextAll();
            }
        },
        _toTreeData: function (sNodes) {
            var that = this;
            var opts = this.options;
            var i, l,
                key = opts.tree.fields.key,
                parentKey = opts.tree.fields.parentKey,
                childKey = opts.tree.fields.children;
            if (!key || key == "" || !sNodes) return [];

            if ($.isArray(sNodes)) {
                var r = [];
                var tmpMap = [];
                for (i = 0, l = sNodes.length; i < l; i++) {
                    tmpMap[sNodes[i][key]] = sNodes[i];
                }
                for (i = 0, l = sNodes.length; i < l; i++) {
                    if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
                        if (!tmpMap[sNodes[i][parentKey]][childKey])
                            tmpMap[sNodes[i][parentKey]][childKey] = [];
                        tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
                    } else {
                        r.push(sNodes[i]);
                    }
                }
                return r;
            } else {
                return [sNodes];
            }
        },
        _addEmpty: function () {
            var opts = this.options;
            if (!opts.templates.empty) {
                return;
            }
            if (this._total > 0) {
                return;
            }

            $($.jui.tmpl(opts.templates.empty, {})).appendTo(this._$itemContainer).addClass(opts.cssClasses.emptyItem);
        },
        _removeEmpty: function () {
            var opts = this.options;
            this._$itemContainer.find(opts.selectors.emptyItem).remove();
        },
        _refreshCheckerAllState: function () {
            if (this._$checkerAll === undefined) {
                return;
            }
            var allItemElems = this.getAllItemElems();
            var selectedItemElems = this._getSelectedItemElems();
            var allChecked = selectedItemElems.length == allItemElems.length;

            if (allChecked) {
                this._$checkerAll.addClass(this.options.cssClasses.checkerAllChecked);
            }
            else {
                this._$checkerAll.removeClass(this.options.cssClasses.checkerAllChecked);
            }
        },
        disableItem: function (single) {
            var $item = this.getItemElem(single);
            $item.addClass('jlist-item-disabled');
        },
        enableItem: function (single) {
            var $item = this.getItemElem(single);
            $item.removeClass('jlist-item-disabled');
        },
        disable: function () {
            var allItems = this.getAllItemElems();
            allItems.each(function(index, el){
                $(this).addClass('jlist-item-disabled');
            });
        },
        enable: function () {
            var allItems = this.getAllItemElems();
            allItems.each(function(index, el){
                $(this).removeClass('jlist-item-disabled');
            });
        }
    }));

}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistMenu',[
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
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistTabs',[
            "jquery",
            "./jlistMenu"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistTabs", $.jui.jlistMenu, {
        options: {
            mode: 'h',
            styleClass: 'jlistMenu-line',
            activeKey: null
        },
        _render: function () {
            var that = this, opts = this.options;

            this.element.addClass('jlistTabs');

            this._super();

            var eventPrefix = this.widgetEventPrefix.toLowerCase()

            this.element.bind(eventPrefix + "itemdeselected", function (event, ui) {
                var itemData = ui.itemData;
                var $selector = $('#' + itemData[opts.fields.key]);
                $selector.addClass('hide');
            });
            this.element.bind(eventPrefix + "itemselected", function (event, ui) {
                var itemData = ui.itemData;
                var $selector = $('#' + itemData[opts.fields.key]);
                if (itemData.route) {
                    var router = $selector.data('router');
                    if (!router) {
                        var routerOpts = itemData.route;
                        if (!$.isPlainObject(routerOpts)) {
                            routerOpts = { url: itemData.route };
                        }
                        router = $selector.jrouter(routerOpts).jrouter('instance');
                        $selector.data('router', router);
                    }
                    else {
                        if (itemData.cache == false) {
                            router.refresh();
                        }
                    }
                }
                $selector.removeClass('hide');
            });

            if (opts.activeKey) {
                this.element.bind(eventPrefix + "itemdatabound", function (event, ui) {
                    that.select(opts.activeKey);
                });
            }
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistSteps',[
            "jquery",
            "./jlistTabs"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jlistSteps", $.jui.jlistTabs, {
        options: {
            mode: 'h',
            styleClass: 'jlistMenu-line',
            activeKey: null
        },
        _render: function () {
            var that = this, opts = this.options;

            this.element.addClass('jlistSteps');

            this._super();

            var eventPrefix = this.widgetEventPrefix.toLowerCase()

            this.element.bind(eventPrefix + "itemselected", function (event, ui) {
                var itemElem = ui.itemElem;
                var allItems = that.getAllItemElems();
                var prevItems = that.getAllPrevItemElems(itemElem);
                allItems.removeClass('jlistSteps-success');
                prevItems.addClass('jlistSteps-success');
            });
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistGrid',[
			"jquery",
            "jqueryui",
            "./jlist",
            "../utils",
            "../misc/jpager",
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    $.widget("jui.jlistGrid", $.jui.jlist, {
        options: {
            templates: {
                colgroup: null,
                thead: null
            },
            height: null,
            tableStyle: null
        },
        _create: function () {
            var that = this;
            var opts = this.options;
            this.element.addClass("jlist-grid");
            this.$header = $("<div>").addClass("jlist-grid-header").appendTo(this.element);
            this.$body = $("<div>").addClass("jlist-grid-body").appendTo(this.element);
            this.$footer = $("<div>").addClass("jlist-grid-footer").appendTo(this.element);

            this.$headerTable = $('<table class="table"></table>').appendTo(this.$header);
            this.$bodyTable = $("<table></table>").appendTo(this.$body)
                .addClass("table");

            var colgroup = $.jui.tmpl(opts.templates.colgroup, {});
            var $colgroup = $(colgroup).appendTo(this.$headerTable);

            var tableHeader = $.jui.tmpl(opts.templates.thead, {});
            var $tableHeader = $(tableHeader).appendTo(this.$headerTable);

            $(colgroup).appendTo(this.$bodyTable);
            $('<tbody class="jlist-items")></tbody>').appendTo(this.$bodyTable);

            if (opts.templates.footer) {
                $($.jui.tmpl(opts.templates.footer, {})).appendTo(this.$footer);
            }

            if (opts.tableStyle) {
                this.$headerTable.addClass(opts.tableStyle);
                this.$bodyTable.addClass(opts.tableStyle);
            }
            if (opts.pageable) {
                if (this.$footer.find(opts.selectors.pager).length == 0) {
                    $('<div class="jlist-pager"></div>').appendTo(this.$footer);
                }
            }

            if (opts.height) {
                that._setBodyHeight(opts.height);
                that.element.bind("jlistgriddatabound", function () {
                    that._setBodyHeight(opts.height);
                });

                $(window).on("resize", function () {
                    that._setBodyHeight(opts.height);
                });
            }

            that._scrollBody();
            this._super();
        },

        _setBodyHeight: function (height) {
            var p = this.element.parent();
            if (height == "fit") {
                var pMarginTop = parseFloat(p.css("margin-top"));
                if (!pMarginTop) {
                    pMarginTop = 0;
                }
                var pMarginBottom = parseFloat(p.css("margin-bottom"));
                if (!pMarginBottom) {
                    pMarginBottom = 0;
                }
                height = $(window).height() - p.offset().top - pMarginTop - pMarginBottom;
            }
            if (height < 100) {
                height = 100;
            }
            p.outerHeight(height);
            this.element.outerHeight(p.height());

            var headerHeight = this.$header.outerHeight(true);
            var footerHeight = this.$footer.outerHeight(true);

            var bodyHeight = this.element.height() - headerHeight - footerHeight;

            this.$body.innerHeight(bodyHeight, true);
        },

        _scrollBody: function () {
            var that = this;
            this.$body.on("scroll", function () {
                var n = that.$body.scrollLeft();
                that.$headerTable.css('left', -n);
            });
        }
    });

}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistCommands',[
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
/************************************************************************
* commands extension for jlist                                        *
*************************************************************************/
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/lists/jlistWithCommands',[
            "jquery",
            "./jlist",
            "./jlistMenu",
            "./jlistCommands"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    //Reference to base object members
    var base = {
        _jlistCreate: $.jui.jlist.prototype._render,
        _jlistMenuCreate: $.jui.jlistMenu.prototype._render
    };

    var extention = function (base) {
        return {

            options: {
                commands: null
            },

            _render: function () {
                var that = this, opts = this.options;

                if (opts.commands) {
                    this.element.bind((this.widgetEventPrefix + 'itemDataBound').toLowerCase(), function (event, ui) {
                        var itemElem = ui.itemElem;
                        var itemData = ui.itemData;
                        var $commands = itemElem.find('.commands');
                        opts.commands.target = ui;
                        $commands.jlistCommands(opts.commands);
                    });
                }

                //Call base method
                base.apply(this, arguments);
            }
        }
    };
    //extension members
    $.extend(true, $.jui.jlist.prototype, extention(base._jlistCreate));
    $.extend(true, $.jui.jlistMenu.prototype, extention(base._jlistMenuCreate));

}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jinput',[
            "jquery",
            "jqueryui",
            "../jcomponent",
            "../mixins/dataMixin",
            "../layers/jlayer",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinput", $.jui.jcomponent, $.extend(true, {}, $.jui.dataMixin, {
        options: {
            isInput: true,
            hasValue: true,
            label: false,
            labelAlign: 'right',
            labelClass: null,
            wrapperClass: null,
            required: false,
            requiredMessage: "必填",
            viewMode: true,
            asyncSetInitValue: false,
            invalidTipAlign: 'top right',
            ruleTypes: {
                number: {
                    validator: function (value) {
                        return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
                    },
                    message: "请输入有效的数字"
                },
                digits: {
                    validator: function (value) {
                        return /^\d+$/.test(value);
                    },
                    message: "只能输入数字"
                },
                regex: {
                    validator: function (value, param) {
                        return new RegExp(param.pattern, param.attributes).test(value);
                    }
                },
                email: {
                    validator: function (value) {
                        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
                    },
                    message: "请输入有效的 Email 地址"
                },
                url: {
                    validator: function (value) {
                        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
                    },
                    message: "请输入有效的 URL"
                },
                min: {
                    validator: function (value, param) {
                        value = Number(value);
                        return value >= param;
                    },
                    message: '输入值不能小于 {0}'
                },
                max: {
                    validator: function (value, param) {
                        value = Number(value);
                        return value <= param;
                    },
                    message: '输入值不能大于 {0}'
                },
                range: {
                    validator: function (value, params) {
                        value = Number(value);
                        return value >= params[0] && value <= params[1];
                    },
                    message: "输入值必须介于 {0} 和 {1} 之间"
                },
                minlength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return length >= param;
                    },
                    message: '不能少于 {0} 个字'
                },
                maxlength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return length <= param;
                    },
                    message: '不能多于 {0} 个字'
                },
                rangelength: {
                    validator: function (value, param) {
                        var length = 0;
                        if ($.isArray(value)) {
                            length = value.length;
                        }
                        else {
                            length = $.trim(value).length;
                        }

                        return param[0] <= length && length <= param[1];
                    },
                    message: '输入字数在 {0} 个到 {1} 个之间'
                },
                remote: {
                    validator: function (value, params) {
                        var data = {};
                        data[params[1]] = value;
                        var response = $.ajax({ url: params[0], dataType: "json", data: data, async: false, cache: false, type: "post" }).responseText;
                        return response == "true";
                    }, message: "Please fix this field"
                },
                date: {
                    validator: function (value, params) {
                        var dateFormat = this.options.dateFormat;
                        if (params && params.length > 0) {
                            dateFormat = params[0];
                        }
                        var u = !1;
                        try {
                            $.datepicker.parseDate(dateFormat, value);
                            u = !0
                        } catch (f) {
                            u = !1
                        }
                        return u
                    },
                    message: "请输入有效的日期格式."
                },
                identifier: {
                    validator: function (value, params) {
                        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value);
                    },
                    message: '只能输入字母、数字、下划线且必须以字母开头'
                },
                phoneNumber: {
                    validator: function (value, params) {
                        return /^1[3|4|5|7|8][0-9]{9}$/.test(value);
                    },
                    message: '请输入正确的手机号'
                }
            },
            rules: []
        },
        _render: function () {
            var that = this, opts = this.options;

            if (!opts.labelAlign) {
                opts.labelAlign = 'right';
            }
            if (!opts.labelClass) {
                opts.labelClass = 'col-sm-2';
            }
            if (!opts.wrapperClass) {
                opts.wrapperClass = 'col-sm-10';
            }

            this.element.addClass('jinput');

            that._getData(function () {

                that.__beforeRender();

                if (!opts.isGroup) {
                    this.$children = this.element.children().remove();
                }

                if (opts.showLabel == true || (!!opts.label && opts.showLabel != false)) {

                    this.element.addClass('form-group').addClass('label-' + opts.labelAlign);
                    this.$controlLabel = $('<label class="control-label"></label>').html(opts.label).appendTo(this.element);
                    this.$controlWrapper = $('<div class="control-wrapper"></div>').appendTo(this.element);
                    this.$inputWrapper = $('<div class="input-wrapper"></div>').appendTo(this.$controlWrapper);

                    if (opts.required) {
                        var fn = opts.labelAlign == 'right' ? 'prepend' : 'append';
                        this.$controlLabel[fn]('<span class="required" aria-required="true"> * </span>');
                    }

                    if (opts.labelAlign != 'top') {
                        if (opts.labelClass) {
                            this.$controlLabel.addClass(opts.labelClass);
                        }

                        if (opts.wrapperClass) {
                            this.$controlWrapper.addClass(opts.wrapperClass);
                        }
                    }
                }
                else {
                    if (!opts.isGroup) {
                        this.$inputWrapper = $('<div class="input-wrapper"></div>').appendTo(this.element);
                    }
                }

                if (!opts.isGroup) {
                    if (this.$children && this.$children.length > 0) {
                        this.$children.appendTo(this.$inputWrapper);
                    }
                }

                if (opts.inputWrapperStyleClass != null) {
                    that.$inputWrapper.addClass(opts.inputWrapperStyleClass);
                }

                if (opts.inputWrapperStyle != null) {
                    that.$inputWrapper.css(opts.inputWrapperStyle);
                }

                $.isFunction(that._inputRender) && that._inputRender();

                if (!opts.asyncSetInitValue) {
                    if (!opts.transmitData) {
                        this.setValue(this.data, true);
                    }
                }

                this.validateTriggered = false;
                this.errorMessage = "";

                this._on(this.widget(), {
                    focusin: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.show();
                        }
                    },
                    focusout: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.hide();
                        }
                    },
                    mouseenter: function (event) {
                        if (that.invalidTip) {
                            that.invalidTip.show();
                        }
                    },
                    mouseleave: function (event) {
                        if (that.invalidTip) {
                            if (event.target !== that.document[0].activeElement && !$.contains(event.target, that.document[0].activeElement)) {
                                that.invalidTip.hide();
                            }
                        }
                    }
                });

                that.__afterRender();
            });
        },
        _getValue: $.noop,
        _setValue: $.noop,
        _parseValue: $.noop,
        getValue: function () {
            return this._getValue();
        },
        setValue: function (data, isInit) {
            if (!(data === undefined || ($.isPlainObject(data) && $.isEmptyObject(data)))) {
                this._setValue(data, isInit);
            }

            if (isInit) {
                this.initValue = this.getValue();
                if (this.getValueText) {
                    this.initValueText = this.getValueText();
                }
                else {
                    this.initValueText = null;
                }
                this.currentValue = this.initValue;
            }
        },
        focus: function () {
            this.widget().focus();
        },
        validate: function () {
            if(this.isDisabled() == true){
                return true;
            }

            this.validateTriggered = true;
            var valid = this._validate();
            valid ? this.element.removeClass("jinput-invalid") : this.element.addClass("jinput-invalid");

            if (!valid) {
                if (!this.invalidTip) {
                    this.invalidTip = $.jui.tip.warning({
                        message: this.errorMessage,
                        appendTo: this.element,
                        follow: this.$inputWrapper,
                        align: this.options.invalidTipAlign,
                        attachElem: this.element,
                        autoShow: false,
                        showClose: false,
                        style: { margin: 0 },
                        styleClass: 'val-tip'
                    });
                }
                else {
                    this.invalidTip.message(this.errorMessage);
                }

                if (this.element.is(":hover") || this.$inputWrapper.is(':focus')) {
                    this.invalidTip.show();
                }
            }
            else {
                if (this.invalidTip) {
                    this.invalidTip.close();
                    this.invalidTip = null;
                }
            }

            return valid;
        },
        getInvalids: function () {
            return this.invalid;
        },
        _validate: function () {
            var options = this.options;
            this.setMessage("");
            var value = this._getRawValue ? this._getRawValue() : this.getValue();
            var hasValue = value != undefined && value != null && value != '';

            if (options.required) {
                if (value === undefined || value === null || value === "" || ($.isArray(value) && value.length < 1)) {
                    this.setMessage(options.requiredMessage);
                    return false;
                }
            }

            if (hasValue) {
                if (options.rules && $.isArray(options.rules)) {
                    for (var i = 0; i < options.rules.length; i++) {
                        if (!this._checkRule(options.rules[i], value)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        _checkRule: function (ruleSettings, value) {
            var that = this, options = this.options;
            var rule = null;
            if (ruleSettings.type) {
                rule = options.ruleTypes[ruleSettings.type];
            }
            else if (ruleSettings.validator) {
                rule = ruleSettings;
            }

            if (rule) {
                var param = ruleSettings.param || null;
                if (!rule["validator"].call(that, value, param)) {
                    var message = ruleSettings.message || rule["message"];
                    if (param) {
                        if (!$.isArray(param)) {
                            param = [param];
                        }
                        for (var i = 0; i < param.length; i++) {
                            message = message.replace(new RegExp("\\{" + i + "\\}", "g"), param[i]);
                        }
                    }
                    this.setMessage(options.invalidMessage || message);
                    return false;
                }
            }
            return true;
        },
        setMessage: function (msg) {
            this.errorMessage = msg;
        },
        onValueChanged: function () {
            var oldValue = this.currentValue;
            this.currentValue = this.getValue();
            this._trigger("valueChanged", null, { oldValue: oldValue, newValue: this.currentValue, inst: this });
            if (this.parent && this.parent.onValueChanged) {
                this.parent.onValueChanged();
            }
            if (this.validateTriggered) {
                this.validate();
            }
        },
        getChanged: function (createMode) {
            if (this.options.trackChange != undefined && this.options.trackChange == false) {
                return false;
            }

            var value = this.getValue();
            var changed = {
                widget: this.widgetName,
                name: this.name,
                label: this.options.label,
                field: this.name,
                fieldName: this.options.label,
                newValue: value
            };
            if (this.getValueText) {
                changed.newValueText = this.getValueText();
            }
            if (createMode) {
                if (value) {
                    changed.oldValue = null;
                    changed.oldValueText = null;
                    return changed;
                }
                else {
                    return false;
                }
            }
            else {
                if (!$.jui.utils.jsonEqual(value, this.initValue)) {
                    changed.oldValue = this.initValue;
                    changed.oldValueText = this.initValueText;
                    return changed;
                }
                else {
                    return false;
                }
            }
        }
    }));
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jtextbox',[
            "jquery",
            "jqueryui",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jtextbox", $.jui.jinput, {
        options: {
            inputType: 'text',
            iconClass: null,
            iconAlign: 'left',
            placeHolder: null,
            button: null,
            suffix: null
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jtextbox');
            if (opts.iconClass) {
                this.$icon = $('<i></i>').addClass(opts.iconClass).appendTo(this.$inputWrapper);
                this.element.addClass('with-icon').addClass('icon-' + opts.iconAlign);
            }

            this.$input = $('<input class="form-control" />').appendTo(this.$inputWrapper);

            this.$input.attr('type', opts.inputType);

            if (opts.placeHolder) {
                this.$input.attr('placeholder', opts.placeHolder);
            }

            if (opts.inputType == 'password') {
                this.$input.attr('autocomplete', 'new-password');
            }
            else {
                this.$input.attr('autocomplete', 'off');
            }

            if (opts.disabled) {
                this.disable();
            }

            this._on(this.$input, {
                'focus': function () {
                    that.validating = true;
                    that.value = that._getRawValue();
                    (function () {
                        if (that.validating) {
                            if (that.value != that._getRawValue()) {	// when box value changed, validate it
                                that.value = that._getRawValue();
                                that.onValueChanged();
                            }
                            setTimeout(arguments.callee, 200);
                        }
                    })();
                },
                'blur': function () {
                    that.validating = false;
                    that._trigger("blur", null, { inst: that });
                }
            });

            if (opts.button) {
                opts.button = $.extend({
                    type: 'button', align: 'after'
                }, opts.button);
                this.$inputWrapper.addClass('input-group');

                this.$button = $('<button class="btn"></button>')
                    .addClass(opts.button.styleClass)
                    .attr('type', opts.button.type)
                    .text(opts.button.text);
                var $inputGroupBtn = $('<span class="input-group-btn"></span>').append(this.$button);
                if (opts.button.align == 'before') {
                    $inputGroupBtn.prependTo(this.$inputWrapper);
                }
                else {
                    $inputGroupBtn.appendTo(this.$inputWrapper);
                }

                this._on(this.$button, {
                    click: function () {
                        opts.button.click.call(that);
                    }
                });
            }

            if (opts.suffix) {
                this.$inputWrapper.addClass('input-group');

                this.$suffix = $('<span class="input-group-addon"></span>')
                    .html(opts.suffix)
                    .appendTo(this.$inputWrapper)
            }
        },
        getValue: function () {
            var value = this.$input.val();
            return value;
        },
        _getRawValue: function () {
            return this.$input.val();
        },
        _setValue: function (value, isInit) {
            this.currentValue = this.$input.val();
            this.$input.val(value);

            if (!isInit) {
                if (value != this.currentValue) {
                    this.onValueChanged();
                }
            }
        },
        focus: function () {
            this.$input.focus();
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                this.$input.prop("disabled", !!value);
            }

            this._super(key, value);
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jtextarea',[
            "jquery",
            "jqueryui",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jtextarea", $.jui.jinput, {
        options: {
            placeHolder: null,
            rows: 3
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jtextarea');

            this.$input = $('<textarea class="form-control"></textarea>').appendTo(this.$inputWrapper);

            if (opts.placeHolder) {
                this.$input.attr('placeholder', opts.placeHolder);
            }
            if (opts.rows) {
                this.$input.attr('rows', opts.rows);
            }

            this.$input.attr('autocomplete', 'off');

            if (opts.disabled) {
                this.disable();
            }

            this._on(this.$input, {
                'focus': function () {
                    that.validating = true;
                    that.value = that._getRawValue();
                    (function () {
                        if (that.validating) {
                            if (that.value != that._getRawValue()) {	// when box value changed, validate it
                                that.value = that._getRawValue();
                                that.onValueChanged();
                            }
                            setTimeout(arguments.callee, 200);
                        }
                    })();
                },
                'blur': function () {
                    that.validating = false;
                }
            });
        },
        getValue: function () {
            var value = this.$input.val();
            return value;
        },
        _getRawValue: function () {
            return this.$input.val();
        },
        _setValue: function (value) {
            this.$input.val(value);
        },
        focus: function () {
            this.$input.focus();
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                this.$input.prop("disabled", !!value);
            }

            this._super(key, value);
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jnumberbox',[
            "jquery",
            "jqueryui",
            "./jtextbox"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jnumberbox", $.jui.jtextbox, {
        options: {
            min: null,
            max: null,
            precision: 0,
            decimalSeparator: '.',
            groupSeparator: '',
            prefix: '',
            suffix: ''
        },
        _inputRender: function () {
            var that = this;
            var rules = [];
            
            this.element.addClass('jnumberbox');

            if (this.options.precision == 0) {
                rules.push({
                    type: 'regex',
                    param: {
                        pattern: '^(\\-|\\+)?(0|[1-9][0-9]*)$'
                    },
                    message: '请输入整数'
                });
            }
            if (this.options.precision > 0) {
                rules.push({
                    type: 'regex',
                    param: {
                        pattern: '^(\\-|\\+)?(0|[1-9][0-9]*)(\\.\\d{' + this.options.precision + '})$'
                    },
                    message: '请输入 ' + this.options.precision + ' 位小数'
                });
            }
            if (this.options.min) {
                rules.push({
                    type: 'min',
                    param: this.options.min
                });
            }
            if (this.options.max) {
                rules.push({
                    type: 'max',
                    param: this.options.max
                });
            }

            this.options = $.extend(true, {}, this.options, { rules: rules });

            this._super();

            this.$input.on('blur', function(){
                that._trigger("blur", null, { inst: that });
            });
        },
        getValue: function () {
            var value = this.$input.val();
            value = parseFloat(value).toFixed(this.options.precision);
            if (isNaN(value)) {
                value = null;
            }
            return value;
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jcheckbox',[
            "jquery",
            "jqueryui",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcheckbox", $.jui.jinput, {
        options: {
            labelFollow: false
        },
        _beforeCreate: function () {
            if (this.options.labelFollow) {
                this.options.showLabel = false;
            }
        },
        _inputRender: function () {
            this.element.addClass('jcheckbox');
            this.$label = $('<label></label>').appendTo(this.$inputWrapper);
            this.$input = $('<input type="checkbox" />').appendTo(this.$label);
            if (this.options.labelFollow) {
                this.$label.append(this.options.label);
            }
            if (this.options.disabled) {
                this.disable();
            }
        },
        getValue: function () {
            return this.$input.prop('checked');
        },
        _setValue: function (value) {
            this.$input.prop('checked', value);
        },
        disable: function () {
            this.$input.prop('disabled', true);
            this.options.disabled = true;
        },
        enable: function () {
            this.$input.prop('disabled', false);
            this.options.disabled = false;
        },
        focus: function () {
            this.$input.focus();
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                this.$input.prop('disabled', !!value);
            }
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jradiolist',[
            "jquery",
            "jqueryui",
            "../utils",
            "../lists/jlist",
            "../forms/jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jradiolist", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value"
            },
            sourceList: {
                fields: {
                    key: 'value'
                }
            },
            mode: null
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jradiolist');

            var layoutTmpl = '<ul class="jlist-items"></ul>';
            var itemTmpl = '<li><label><input type="radio" value="{{value}}"> {{text}}</label></li>';
            if (opts.mode == 'button') {
                layoutTmpl = '<div class="btn-group jlist-items" role="group">';
                itemTmpl = '<button class="btn">{{text}}</button>'
            }
            opts.sourceList = $.extend(true, {
                styleClasses: { itemContainer: 'list-inline tight' },
                fields: {
                    key: opts.fields.value
                },
                templates: {
                    layout: layoutTmpl,
                    item: itemTmpl
                }
            }, opts.sourceList, {
                    itemConverter: function (item) {
                        return that._itemConverter(item);
                    },
                    itemSelected: function (e, eventData) {
                        that._renderSelected(eventData.itemData);
                    },
                    selectionChanged: function () {
                        that.onValueChanged();
                    }
                });

            this.$inputWrapper.jlist(this.options.sourceList);
        },
        refresh: function (param) {
            this.$inputWrapper.jlist("bind", param);
        },
        _renderSelected: function (itemDatas) {
            var that = this, opts = this.options;

            if (!itemDatas) {
                this.$inputWrapper.find("input").prop("checked", false);

                return;
            }

            if ($.isArray(itemDatas)) {
                $.each(itemDatas, function (index, value) {
                    render(value);
                });
            }
            else {
                render(itemDatas);
            }

            function render(itemData) {
                itemData = that._itemConverter(itemData);

                that.$inputWrapper.find("input").val([itemData.value]);
            }
        },
        getSelected: function () {
            return this.$inputWrapper.jlist("getSelected");
        },
        getValue: function () {
            var that = this, opts = this.options;

            var selected = this.getSelected();
            if (selected.length) {
                return selected[0][opts.fields.value];
            }
            else {
                return null;
            }
        },
        getValueText: function () {
            var that = this, opts = this.options;

            var selected = this.getSelected();
            if (selected.length) {
                return selected[0][opts.fields.text];
            }
            else {
                return null;
            }
        },
        _setValue: function (value, isInit) {
            var that = this;

            if (!value) {
                this.$inputWrapper.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            this.$inputWrapper.jlist("select", value, {
                notFireEvent: isInit,
                callback: function () {
                    if (!isInit) {
                        return;
                    }
                    if (!$.isPlainObject(value)) {
                        value = that.$inputWrapper.jlist("getSelected");
                    }
                    that._renderSelected(value);
                }
            });
        },
        _itemConverter: function (item) {
            var fields = this.options.fields;
            !('text' in item) && (item.text = item[fields.text]);
            !('value' in item) && (item.value = item[fields.value]);
            return item;
        },
        disable: function () {
            this.$inputWrapper.jlist('disable');
            this.$inputWrapper.find("input").prop('disabled', true);
            this.options.disabled = true;
        },
        enable: function () {
            this.$inputWrapper.jlist('enable');
            this.$inputWrapper.find("input").prop('disabled', false);
            this.options.disabled = false;
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jcheckboxlist',[
            "jquery",
            "jqueryui",
            "../utils",
            "../lists/jlist",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jcheckboxlist", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value"
            },
            sourceList: {
                styleClasses: { itemContainer: 'list-inline tight' },
                selectable: {
                    multiple: true,
                    onlyleaf: false,
                    cascade: true
                },
                tree: {
                    indent: 20,
                    fields: {
                        children: 'children',
                        parentKey: 'pid'
                    },
                    valueIncludePart: true
                },
                method: 'GET',
                templates: {
                    layout: '<ul class="jlist-items list tight"></ul>',
                    tree: {
                        children: '<ul class="list tight"></ul>'
                    }
                }
            }
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.element.addClass('jcheckboxlist');

            var itemTmpl = opts.sourceList.templates.item ||
                '<li><input type="checkbox" value="{{value}}"> <label>{{text}}</label></li>';

            if (opts.sourceList.type == 'tree') {
                opts.sourceList.styleClasses = { itemContainer: 'tight' }
            }

            opts.sourceList = $.extend(true, {}, opts.sourceList, {
                fields: {
                    key: opts.fields.value
                },
                templates: {
                    item: itemTmpl
                },
                selectable: {
                    cascadeCancelParent: false
                },
                itemConverter: function (item) {
                    return that._itemConverter(item);
                },
                itemSelected: function (e, eventData) {
                    that._renderSelected(eventData.itemData);
                },
                itemDeselected: function (e, edata) {
                    edata.itemElem.find("input").prop("checked", false);
                },
                selectionChanged: function () {
                    that.onValueChanged();
                }
            });

            this.cascade = opts.sourceList.selectable.cascade;

            this.$inputWrapper.jlist(this.options.sourceList);

            this.sourceList = this.$inputWrapper.jlist('instance');
        },
        refresh: function (param) {
            this.$inputWrapper.jlist("bind", param);
        },
        _renderSelected: function (itemDatas) {
            var that = this;
            var opts = this.options;

            if (itemDatas === undefined || itemDatas == null || itemDatas == '') {
                this.$inputWrapper.find("input").prop("checked", false);

                return;
            }

            if ($.isArray(itemDatas)) {
                $.each(itemDatas, function (index, value) {
                    render(value);
                });
            }
            else {
                render(itemDatas);
            }

            function render(itemData) {
                itemData = that._itemConverter(itemData);

                that.$inputWrapper.find('input[value="' + itemData.value + '"]').prop("checked", true);
            }
        },
        _deselect: function (itemData) {
            var that = this;
            var opts = this.options;
            if (this.options.multiple) {
                this.$multipleDisplay.jlist("remove", itemData);
            }
        },
        getSelected: function () {
            var withPart = this.sourceList.options.type == 'tree' && this.sourceList.options.tree.valueIncludePart == true;
            return this.sourceList.getSelected(withPart);
        },
        getValue: function () {
            var that = this;
            var opts = this.options;

            var selected = this.getSelected();

            var vals = $.map(selected, function (item, index) {
                return item[opts.fields.value];
            })

            return vals;
        },
        getValueText: function () {
            var that = this;
            var opts = this.options;

            var selected = this.getSelected();

            var texts = $.map(selected, function (item, index) {
                return item[opts.fields.text];
            })

            return texts.toString();
        },
        _setValue: function (value, isInit) {
            var that = this;

            if (!value) {
                this.$inputWrapper.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            if (isInit) {
                this.$inputWrapper.jlist("option", "selectable.cascade", false);
            }

            this.$inputWrapper.jlist("select", value, {
                notFireEvent: isInit,
                callback: function () {
                    if (!isInit) {
                        return;
                    }
                    else {
                        that.$inputWrapper.jlist("option", "selectable.cascade", that.cascade);
                    }
                    if (!$.isPlainObject(value)) {
                        value = that.$inputWrapper.jlist("getSelected");
                    }
                    that._renderSelected(value);
                }
            });
        },
        _itemConverter: function (item) {
            var fields = this.options.fields;
            !('text' in item) && (item.text = item[fields.text]);
            !('value' in item) && (item.value = item[fields.value]);
            return item;
        },
        disable: function () {
            this.$inputWrapper.jlist('disable');
            this.$inputWrapper.find("input").prop('disabled', true);
            this.options.disabled = true;
        },
        enable: function () {
            this.$inputWrapper.jlist('enable');
            this.$inputWrapper.find("input").prop('disabled', false);
            this.options.disabled = false;
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jselect',[
            "jquery",
            "jqueryui",
            "../utils",
            "../lists/jlist",
            "./jinput"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jselect", $.jui.jinput, {
        options: {
            fields: {
                text: "text",
                value: "value",
                filter: "q"
            },
            value: null,
            styleClass: 'jselect-default',
            emptyData: null,
            sourceList: {
                method: 'GET',
                templates: {
                    itemWrapper: '<li></li>',
                    item: '<a href="javascript:;">{{text}}</a>'
                },
                styleClasses: { itemContainer: 'menu active-highlight' }
            },
            selectedList: {
                templates: {
                    item: '<li>{{text}}</li>'
                }
            },
            singleTemplate: '{{text}}',
            multiple: false,
            showArrow: true,

            pop: {
                trigger: null,
                layer: {
                    fitElem: '.jselect-list',
                    size: {
                        maxHeight: 'fit'
                    }
                }
            },
            searchPlaceholder: '',
            remoteSearch: false,
            autocomplete: true,
            minItemsForSearch: 20,
            filterConverter: null,

            delay: 300
        },
        _inputRender: function () {
            var that = this, opts = this.options;
            this.element.addClass('jselect');
            this.$selectInput = $('<select class="jselect-select"><option value=""></option></select>').appendTo(this.$inputWrapper);
            this.$wrapper = this.$inputWrapper;
            /*if (opts.width) {
                this.$inputWrapper.css("width", opts.width);
            }*/
            this.$display = $('<div class="jselect-display"></div>').appendTo(this.$wrapper);

            if (opts.multiple) {
                this.$selectInput.attr("multiple", "multiple");
                this.$multipleDisplay = $('<div class="jselect-display-multiple"><ul class="jlist-items"></ul></div>').appendTo(this.$display);
                opts.selectedList = $.extend({}, {
                    fields: {
                        key: opts.fields.value
                    }
                }, opts.selectedList);
                this.$multipleDisplay.jlist(opts.selectedList);
            }
            else {
                this.$singleDisplay = $('<div class="jselect-display-single"></div>').appendTo(this.$display);
            }

            if (opts.showArrow) {
                this.$displayArrow = $('<span class="jselect-display-arrow"><i class="fa fa-angle-down"></i></span>').appendTo(this.$display);
            }

            this.$popLayer = $('<div class="jselect-pop">' +
                '<div class="jselect-search"></div>' +
                '<div class="jselect-list"><ul class="jlist-items"></ul></div></div>').appendTo(this.$wrapper);
            this.$sourceList = this.$popLayer.find('.jselect-list');
            this.$search = this.$popLayer.find('.jselect-search');
            var searchBoxOpts = { placeholder: opts.searchPlaceholder };
            if (opts.pageable) {
                this.$pager = $('<div></div>').addClass('jselect-pager').insertAfter(this.$sourceList);
            }

            if (!opts.autocomplete) {
                searchBoxOpts.button = { text: 'search' };
            }

            this.popMinWidth = that.$display.outerWidth();

            this.$pop = this.$display;

            if (this.options.disabled) {
                this.disable();
            }

            var popOpts = $.extend(true, {}, opts.pop, {
                layerElem: that.$popLayer,
                layer: {
                    size: {
                        maxHeight: 'fit', width: Math.max(220, that.popMinWidth)
                    }
                },
                disabled: opts.disabled
            });

            /*if (!(typeof popOpts.layer.size.maxWidth === 'number')) {
                popOpts.layer.size.maxWidth = popOpts.layer.size.minWidth;
            }*/

            if (opts.remoteSearch) {
                that.$search.show();

                /*opts.sourceList.autoBind = false;
                popOpts.layer.showing = function () {
                    that.$searchInput.val('');
                    that.$sourceList.jlist('bindData', null);
                }*/
            }

            this.$pop.jpop(popOpts);

            if (opts.autocomplete) {
                searchBoxOpts.valueChanged = function (event, ui) {
                    that._search(ui.newValue);
                }
            }
            else {
                searchBoxOpts.button.click = function () {
                    that._search(this.getValue());
                }
            }

            this.$search.jtextbox(searchBoxOpts);

            opts.sourceList = $.extend(true, {}, {
                fields: {
                    key: opts.fields.value
                }
            }, opts.sourceList, {
                    selectable: {
                        multiple: opts.multiple
                    },
                    pageable: opts.pageable ? $.extend(true, opts.pageable, {
                        el: this.$pager,
                        displayItemCount: 0,
                        edgeItemCount: 0,
                        texts: {
                            info: ' ',
                        },
                    }) : false,
                    dataBound: function (e, edata) {
                        that.$popLayer.jlayer('setSize');
                        that.$popLayer.jlayer('setPosition');

                        var data = edata.data;
                        if (opts.emptyData) {
                            that.$sourceList.jlist("prepend", opts.emptyData).jlist("select", opts.emptyData);
                            //data.Items.unshift(opts.emptyData);
                        }
                        var items;
                        if ($.isArray(data)) {
                            items = data;
                        }
                        else if (data) {
                            items = data[$(this).jlist('option').fields.items];
                        }
                        if (!$.isArray(items)) {
                            items = [];
                        }

                        if (!opts.remoteSearch) {
                            if (opts.minItemsForSearch != -1 && items.length > opts.minItemsForSearch) {
                                that.$search.show();
                            }
                            else {
                                that.$search.hide();
                            }
                        }

                        that._renderOptions(items);

                        if (opts.pageable) {//分页的时候切换页的时候，重新选中
                            if (opts.multiple) {//针对多行的选中的情况
                                $.each(that.$multipleDisplay.jlist('getAll'), function (idx, item) {
                                    that.$sourceList.jlist("select", item, true);
                                });
                            }
                        }
                    },
                    itemSelected: function (e, data) {
                        that._renderSelected(data.itemData);
                        that._setSelectInputValue();

                        if (!opts.multiple) {
                            that.$pop.jpop('hide');
                        }

                        that._trigger('select', e, data);
                    },
                    itemDeselected: function (e, data) {
                        that._deselect(data.itemData);
                        that._setSelectInputValue();

                        that._trigger('deselect', e, data);
                    },
                    selectionChanged: function () {
                        that.onValueChanged();
                    },
                    itemConverter: function (item) {
                        return that._itemConverter(item);
                    }
                });

            if (opts.sourceList.type == "tree") {
                var treeDefaultOpsts = {
                    cssClasses: {
                        styleClass: "jlist-tree"
                    }
                };

                opts.sourceList = $.extend({}, opts.sourceList, treeDefaultOpsts);
            }

            this.$sourceList.jlist(opts.sourceList);
        },
        _itemConverter: function (item) {
            var fields = this.options.fields;
            !('text' in item) && (item.text = item[fields.text]);
            !('value' in item) && (item.value = item[fields.value]);
            return item;
        },
        _renderSelected: function (itemDatas) {
            var that = this, opts = this.options;

            if (!itemDatas) {
                if (opts.multiple) {
                    that.$multipleDisplay.jlist("bind", null);
                }
                else {
                    that.$singleDisplay.html('');
                    that.$singleDisplay.data('itemData', itemDatas);
                }

                return;
            }

            if ($.isArray(itemDatas)) {
                $.each(itemDatas, function (index, value) {
                    render(value);
                });
            }
            else {
                render(itemDatas);
            }

            function render(itemData) {
                itemData = that._itemConverter(itemData);

                if (opts.multiple) {
                    that.$multipleDisplay.jlist("append", itemData);
                }
                else {
                    that.$singleDisplay.html($.jui.tmpl(opts.singleTemplate, itemData)).attr('title', itemData.text);
                    that.$singleDisplay.data('itemData', itemData);
                }
            }
        },
        /*_renderSelected: function (itemData) {
            var that = this, opts = this.options;

            itemData = this._itemConverter(itemData);

            if (opts.multiple) {
                that.$multipleDisplay.jlist("append", itemData);
            }
            else {
                this.$singleDisplay.html($.jui.tmpl(opts.singleTemplate, itemData));
                this.$singleDisplay.data('itemData', itemData);
            }
        },*/
        _renderOptions: function (items) {
            if (!$.isArray(items)) {
                items = [items];
            }
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var text = item[this.options.fields.text];
                if ($.type(text) !== "string") {
                    text = JSON.stringify(text);
                }
                var value = item[this.options.fields.value];
                if ($.type(value) !== "string") {
                    value = JSON.stringify(value);
                }
                var showstr = $("<option value=\"" + value + "\"></option>");

                showstr.text(text);

                this.$selectInput.append(showstr);
            };
        },
        _deselect: function (itemData) {
            if (this.options.multiple) {
                this.$multipleDisplay.jlist("remove", itemData);
            }
        },
        deselect: function (itemData) {
            if (this.options.remoteSearch) {
                this._deselect(itemData);
                this._setSelectInputValue();

                this._trigger('deselect', null, { itemData: itemData });
            }
            else {
                this.$sourceList.jlist("deselect", itemData);
            }
        },
        getSelected: function () {
            if (this.options.multiple) {
                return this.$multipleDisplay.jlist("getAll");
            }
            else {
                var itemData = this.$singleDisplay.data('itemData');
                if (itemData) {
                    return [itemData];
                }
                else {
                    return [];
                }
            }
        },
        _setValue: function (valueData, isInit) {
            var that = this;

            if (valueData === undefined || valueData == null) {
                this.$sourceList.jlist("deselectAll");
                this._renderSelected(null);
                return;
            }

            if (this.options.remoteSearch) {
                this._renderOptions(valueData);
                this._renderSelected(valueData);
                this._setSelectInputValue();
            }
            else {
                this.$sourceList.jlist("select", valueData, {
                    notFireEvent: isInit,
                    callback: function () {
                        if (!isInit) {
                            return;
                        }
                        if (!$.isPlainObject(valueData)) {
                            valueData = that.$sourceList.jlist("getSelected");
                        }
                        that._renderSelected(valueData);
                        that._setSelectInputValue();
                    }
                });

            }
        },
        getValue: function () {
            var that = this, opts = this.options;
            var selected = that.getSelected();
            var vals = $.map(selected, function (item, index) {
                return item[opts.fields.value];
            })
            if (!vals.length) { return null }
            if (opts.multiple) {
                return vals;
            }
            else {
                return vals[0];
            }
        },
        getValueText: function () {
            var that = this, opts = this.options;
            var selected = that.getSelected();
            var texts = $.map(selected, function (item, index) {
                return item[opts.fields.text];
            })
            if (!texts.length) { return null }
            if (opts.multiple) {
                return texts.toString();
            }
            else {
                return texts[0];
            }
        },
        _setSelectInputValue: function () {
            var val = this.getValue();
            this.$selectInput.val(val);
        },
        _searchTimeout: function (query) {
            clearTimeout(this.searching);
            this.searching = this._delay(function () {
                var filter = {};
                filter[this.options.fields.filter] = query;
                this.$sourceList.jlist('bind', { filter: filter });
            }, this.options.delay);
        },
        _search: function (query) {
            var that = this;
            var opts = this.options;

            if (opts.remoteSearch) {
                /*if (!query) {
                    that.$sourceList.jlist('bindData', null);
                }
                else {
                    that._searchTimeout(query);
                }*/
                this._searchTimeout(query);
            }
            else {
                var reg = new RegExp(query, "i");
                var itemElems = this.$sourceList.jlist('getAllItemElems');
                itemElems.each(function (index, itemElem) {
                    var itemData = that.$sourceList.jlist('getItemData', $(itemElem));
                    if (reg.test(itemData.text)) {
                        $(itemElem).show();
                    }
                    else {
                        $(itemElem).hide();
                    }
                });
            }
        },
        getSourceList: function () {
            return this.$sourceList;
        },
        widget: function () {
            return this.$wrapper;
        },
        _setOption: function (key, value) {
            if (key === "disabled") {
                //this.widget().toggleClass("ui-state-disabled", !!value);
                this.$display.toggleClass("ui-state-disabled", !!value);
            }
            
            this._super(key, value);
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jdatepicker',[
            "jquery",
            "jqueryui",
            "./jtextbox"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jdatepicker", $.jui.jtextbox, {
        options: {
            inputType: 'text',
            dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: 'c-100:c+50'
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this._super();

            this.element.addClass('jdatepicker');

            this.$inputWrapper.addClass('input-group');

            this.$icon = $('<div class="input-group-addon"><i class="fa fa-calendar" /></div>').appendTo(this.$inputWrapper);
            opts.onSelect = function () {
                that.onValueChanged();
            };
            opts.onClose = function () {
                try {
                    var _date = $.datepicker.parseDate(opts.dateFormat, that.$input.val());
                    that.$input.val($.datepicker.formatDate(opts.dateFormat, _date));
                } catch (ex) {
                    that.$input.val($.datepicker.formatDate(opts.dateFormat, that.$input.datepicker("getDate")));
                }

                that._trigger('closed', null, null);
            }
            this.$input.datepicker(opts);

            this._on(this.$icon, {
                'click': function (e) {
                    e && e.preventDefault ? e.preventDefault() : e.returnValue = !1
                    this.$input.attr('disabled', 'disabled');
                    this.$input.datepicker("show");
                    this.$input.removeAttr('disabled')
                }
            })

        },
        getValue: function () {
            return this.$input.val();
        },
        _setValue: function (value) {
            this.$input.datepicker("setDate", value);
        },
        openPicker: function () {
            this.$input.datepicker('show')
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jinputgroup',[
            "jquery",
            "jqueryui",
            "./jinput",
            "../mixins/compositMixin"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinputgroup", $.jui.jinput, $.extend(true, {}, $.jui.compositMixin, {
        options: {
            transmitData: true,
            flatData: false,
            isGroup: true
        },
        _beforeCreate: function () {
            this.options.label = null;
        },
        _inputRender: function () {
            this._renderChildren();
        },
        _getValue: function () {
            if (this.components && this.components.length) {
                var data = {};
                for (var i = 0; i < this.components.length; i++) {
                    var component = this.components[i];
                    var $component = this["$" + component.name];

                    if (!$component) {
                        continue;
                    }

                    if (!$component.options.isInput) {
                        continue;
                    }

                    if ($component.options.flatData) {
                        $.extend(data, $component.getValue());
                    }
                    else {
                        data[component.name] = $component.getValue();
                    }
                }

                return data;
            }
        },
        _setValue: function (data, isInit) {
            var that = this, opts = this.options;

            if (that.components && that.components.length) {
                for (var i = 0; i < that.components.length; i++) {
                    var component = that.components[i];

                    var $component = that["$" + component.name];

                    if (!$component) {
                        continue;
                    }

                    if (!$component.options.isInput) {
                        continue;
                    }

                    var componentOpts = $component.options;
                    if (data.hasOwnProperty(componentOpts.name)) {
                        if (componentOpts.flatData) {
                            $component.setValue(data, isInit);
                        }
                        else {
                            $component.setValue(data[componentOpts.name], isInit);
                        }
                    }
                }
            }
        },
        validate: function () {
            var invalid = this.invalid = [];

            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];

                var $component = this["$" + component.name];
                if (!$component) {
                    continue;
                }
                if (!$component.options.isInput) {
                    continue;
                }
                if ($component.isHidden()) {
                    continue;
                }
                if (!$component.validate()) {
                    invalid.push($component);
                }
            }

            if (invalid.length > 0) {
                invalid[0].focus();
            }

            return invalid.length == 0;
        },
        getChild: function (childName) {
            return this["$" + childName];
        },
        getInvalids: function () {
            return this.invalid;
        },
        getChanged: function (createMode) {
            var data = [];
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($component.isHidden()) {
                    continue;
                }

                if (!$component.options.isInput) {
                    continue;
                }

                var changed = $component.getChanged(createMode);
                if (changed) {
                    data.push(changed);
                }
            }

            return data;
        },
        disable:function(){
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($.isFunction($component.disable)) {
                    $component.disable();
                }
            }
        },
        enable:function(){
            for (var i = 0; i < this.components.length; i++) {
                var component = this.components[i];
                var $component = this["$" + component.name];

                if (!$component) {
                    continue;
                }

                if ($.isFunction($component.enable)) {
                    $component.enable();
                }
            }
        }
    }));
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jinputrepeat',[
            "jquery",
            "jqueryui",
            "./jinput",
            "./jinputgroup",
            "../utils"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jinputrepeat", $.jui.jinput, {
        options: {
            itemComponents: [],
            getDataMode: "getChanges",
            layoutMode: 'table',
            keyField: 'Id'
        },
        _inputRender: function () {
            var that = this, opts = this.options;

            this.removeItemData = [];
            var layout = (opts.templates && opts.templates.layout) || '';
            var item = (opts.templates && opts.templates.item) || '';
            var edit = (opts.templates && opts.templates.edit) || '';

            if (opts.layoutMode == 'table') {
                layout = '<table class="jlist-table table table-bordered"><thead><tr>';
                item = '<tr>';

                for (var i = 0; i < opts.itemComponents.length; i++) {
                    var component = opts.itemComponents[i];
                    layout += '<td>' + component.label + '</td>';

                    item += $.jui.utils.format('<td><div name="{0}"></div></td>', component.name);

                    component.showLabel = false;
                }

                layout += '<td></td>';

                item += '<td><button class="btn btn-xs" data-command="remove"><i class="fa fa-close"></i></button></td>';

                layout += '</tr></thead><tbody class="jlist-items"></tbody></table>';

                item += '</tr>';

                layout += '<button class="btn" type="button" data-role="AddBtn">添加</button>';

                edit = item;
            }
            else if (opts.layoutMode == 'flow') {
                layout = '<div class="jlist-items"></div><div><button class="btn" type="button" data-role="AddBtn">添加</button></div>';

                item = '<div class="m-y-md b-b">';
                for (var i = 0; i < opts.itemComponents.length; i++) {
                    var component = opts.itemComponents[i];

                    item += $.jui.utils.format('<div name="{0}"></div>', component.name);
                }
                item += '</div>';

                edit = item;
            }

            this.list = this.$inputWrapper.jlist({
                initEdit: true,
                templates: {
                    layout: layout,
                    item: item,
                    edit: edit
                },
                itemDataBound: function (e, edata) {
                    var itemElem = edata.itemElem;
                    var itemComponents = $.extend(true, [], opts.itemComponents);
                    var itemGroupComp = itemElem.jinputgroup({
                        components: itemComponents,
                        data: edata.itemData,
                        isRepeatInit: edata.isInit
                    }).jinputgroup('instance');

                    itemGroupComp.parent = that;
                },
                beforeItemRemove: function (event, ui) {
                    var itemData = {};
                    var $item = ui.itemElem;
                    var itemInputGroup = $item.jinputgroup('instance');
                    for (var i = 0; i < opts.itemComponents.length; i++) {
                        var component = opts.itemComponents[i];
                        var itemCmpt = itemInputGroup['$' + component.name];
                        if (itemCmpt.getValueText) {
                            itemData[component.name] = itemCmpt.getValueText();
                        }
                        else {
                            itemData[component.name] = itemCmpt.getValue();
                        }
                    }

                    that.removeItemData.push(itemData);
                },
                buildItemData: function ($item) {
                    return $item.jinputgroup("getValue");
                },
                itemCommand: function (event, eventData) {
                    var cmd = eventData.command;
                    if (cmd == 'remove') {
                        $(this).jlist('remove', eventData.itemElem);

                        that.onValueChanged();
                    }
                }
            }).jlist('instance');

            this._on(this._find('[data-role="AddBtn"]'), {
                'click': function () {
                    that.$inputWrapper.jlist('append', {}, true);

                    that.onValueChanged();
                }
            });
        },
        validate: function () {
            var invalid = [];

            var itemElems = this.$inputWrapper.jlist("getAllItemElems");
            for (var i = 0; i < itemElems.length; i++) {
                var itemElem = itemElems[i];

                if (!$(itemElem).jinputgroup("validate")) {
                    invalid.push($(itemElem).jinputgroup("getInvalids"));
                }
            }
            return invalid.length == 0;
        },
        getValue: function () {
            var data = {};
            if (this.options.getDataMode == "getChanges") {
                data = this.$inputWrapper.jlist("getChanges");
            }
            else {
                data = this.$inputWrapper.jlist("getAll");
            }
            return data;
        },
        _setValue: function (value, isInit) {
            this.$inputWrapper.jlist("bindData", value);
        },
        getChanged: function () {
            var opts = this.options;

            var change = {
                widget: this.widgetName, name: this.name, label: opts.label,
                added: [], updated: [], removed: this.removeItemData
            };
            var newItems = this.list.getNewItems();
            if (newItems.length > 0) {
                for (var i = 0; i < newItems.length; i++) {
                    var $newItem = $(newItems[i]);
                    var addedObj = { id: null };
                    addedObj.changed = $newItem.jinputgroup('getChanged', true);

                    change.added.push(addedObj);
                }
            }

            var initItems = this.list.getInitItems();
            if (initItems.length > 0) {
                for (var i = 0; i < initItems.length; i++) {
                    var $initItem = $(initItems[i]);
                    var changed = $initItem.jinputgroup('getChanged');
                    if (changed.length > 0) {
                        var itemData = this.list.getItemData($initItem);
                        var changedObj = {};
                        changedObj.key = itemData[opts.keyField];
                        changedObj.changed = changed;
                        change.updated.push(changedObj);
                    }
                }
            }

            if (change.added.length > 0 || change.updated.length > 0 || change.removed.length > 0) {
                return change;
            }
            else {
                return false;
            }
        }
    });
}));
(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jtagbox',[
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

(function (factory) {
    if (typeof define === "function" && define.amd) {

        // AMD. Register as an anonymous module.
        define('jui/forms/jformCommands',[
            "jquery",
            "jqueryui",
            "./jinput",
            "../lists/jlistCommands"
        ], factory);
    } else {

        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.widget("jui.jformCommands", $.jui.jinput, {
        options: {
            isInput: false,
            commands: {}
        },
        _inputRender: function () {
            var that = this, opts = this.options;
            this.$inputWrapper.jlistCommands(opts.commands);
        }
    });
}));
(function () {
    if (typeof define === 'function') {
        define([
            "jui/utils",
            "jui/mixins/compositMixin",
            "jui/mixins/dataMixin",
            "jui/mixins/templateMixin",
            "jui/jcomponent",
            "jui/jtmpl",
            "jui/misc/jpager",
            "jui/misc/jcollapse",

            "jui/layers/jlayer",
            "jui/layers/jpop",
            "jui/layers/jlayer.modal",
            "jui/layers/jlayer.alert",
            "jui/layers/jlayer.tip",

            "jui/utils.ajax",

            "jui/spa",

            "jui/lists/jlist",
            "jui/lists/jlistMenu",
            "jui/lists/jlistTabs",
            "jui/lists/jlistSteps",
            "jui/lists/jlistGrid",
            "jui/lists/jlistCommands",
            "jui/lists/jlistWithCommands",

            "jui/forms/jinput",
            "jui/forms/jtextbox",
            "jui/forms/jtextarea",
            "jui/forms/jnumberbox",
            "jui/forms/jcheckbox",
            "jui/forms/jradiolist",
            "jui/forms/jcheckboxlist",
            "jui/forms/jselect",
            "jui/forms/jdatepicker",
            "jui/forms/jinputrepeat",
            "jui/forms/jinputgroup",
            "jui/forms/jtagbox",
            "jui/forms/jformCommands"
        ]);
    }
})();
