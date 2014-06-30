/**
 * 依赖文件
 * @author robert zeng
 */
(function (window, undefined) {

    "use strict";

    var core = (function () {

        /**
         * 初始化建立对象
         * @param selector
         * @param dom
         * @param isSingle
         * @returns {e.init}
         */
        var core = function (selector, dom, isSingle) {
            return new core.fn.init(selector, dom, isSingle);
        };

        /**
         * 建立原型链别名
         * @type {Object|Function|core}
         */
        core.fn = core.prototype;

        /**
         * 选择器初始化
         * @param selector
         * @param dom
         * @param isSingle
         * @returns {core.fn}
         */
        core.fn.init = function (selector, dom, isSingle) {

            var obj = (dom ) ? dom : document, nodeList;
            if (selector.nodeType === 1 || selector === window || selector === document) {
                nodeList = [selector];
            } else if (typeof selector === "string") {
                nodeList = (isSingle) ? obj.querySelector(selector) : obj.querySelectorAll(selector);
            } else if (typeof selector === "function") {
                return core(document, undefined, undefined).ready(selector);
            }
            this.selector = this[0] = ( isSingle ) ? [nodeList] : core._node2arr(nodeList);
            this.length = this.size();
            return this;
        };

        //事件绑定及删除
        /**
         * 模拟DOMContentLoaded
         * @param callback
         */
        core.fn.ready = function (callback) {
            var readyInterval;
            if (core.browser.isIe()) {
                readyInterval = setInterval(
                    function () {
                        document.documentElement.doScroll("left");
                        clearInterval(readyInterval);
                        readyInterval = null;
                        callback();
                    }, 50);
            } else if (!navigator.taintEnabled && !document.querySelector) {
                readyInterval = setInterval(
                    function () {
                        if (document.readyState === "complete" || document.readyState === "loaded") {
                            clearInterval(readyInterval);
                            readyInterval = null;
                            callback();
                        }
                    }, 50);
            } else {
                this.bind("DOMContentLoaded", callback);
            }
        };


        /**
         * 触发选择器中绑定event
         * @param event
         * @returns {core.fn}
         */
        core.fn.trigger = function (event) {
            core.each(this.selector, function (key, ele) {
                core.each(ele.events[event], function (k) {
                    ele.events[event][k]();
                });
            });
            return this;
        };


        /**
         * 向选择器中节点绑定事件
         * @param event
         * @param callback
         */
        core.fn.bind = function (event, callback) {
            core.each(this.selector, function (key, ele) {
                if (!ele.events) {
                    ele.events = {};
                }
                ele.events[event] = (ele.events[event]) ? ele.events[event] : [];
                var handlers = ele.events[event],
                    todo = handlers[handlers.length] = callback;
                if (ele.attachEvent) {
                    ele["e" + event + todo] = todo;
                    ele[event + todo] = function () {
                        ele["e" + event + todo](window.event);
                    };
                    ele.attachEvent("on" + event, ele[event + todo]);
                } else {
                    ele.addEventListener(event, todo, false);

                }
            });
            return this;
        };

        /**
         * 删除选择器中节点事件
         * @param event
         * @param callback
         */
        core.fn.unbind = function (event, callback) {
            core.each(this.selector, function (key, ele) {
                var todo, i = 0;
                if (callback) {
                    todo = callback;
                    delete ele.events[event][0];
                    if (ele.detachEvent) {
                        ele.detachEvent("on" + event, ele[event + todo]);
                        ele[event + todo] = null;
                    } else {
                        ele.removeEventListener(event, todo, false);
                    }
                } else {
                    for (; i < ele.events[event].length; i++) {
                        todo = ele.events[event][i];
                        delete ele.events[ event][i];
                        if (ele.detachEvent) {
                            ele.detachEvent("on" + event, ele[event + todo]);
                            ele[event + todo] = null;
                        } else {
                            ele.removeEventListener(event, todo, false);
                        }
                    }
                }
            });
            return this;
        };

        /**
         * 事件委派
         * @param selector
         * @param event
         * @param callback
         */
        core.fn.delegate = function (selector, event, callback) {
            core.each(this.selector, function (key, ele) {
                if (!ele.delegate) {
                    ele.delegate = {};
                }
                ele.delegate[event + selector] = (ele.delegate[event + selector]) ? ele.delegate[event + selector] : [];

                var handlers = ele.delegate[event + selector],
                    todo = handlers[handlers.length] = function (e) {
                        e = e || window.event;
                        var target = e.srcElement || e.target;
                        if (e.type === event && target.tagName === selector.toUpperCase()) {
                            callback.apply(target, arguments);
                        }
                    };
                if (ele.attachEvent) {
                    ele["e" + event + selector + callback] = todo;
                    ele[ event + selector + todo + handlers.length] = function () {
                        ele["e" + event + selector + callback](window.event);
                    };
                    ele.attachEvent("on" + event, ele[ event + selector + todo + handlers.length]);
                } else {
                    ele.addEventListener(event, todo, false);
                }
            });
            return this;
        };


        /**
         * 取消事件委派
         * @param selector
         * @param event
         * @param callback
         * @returns {core.fn}
         */
        core.fn.undelegate = function (selector, event) {
            core.each(this.selector, function (key, ele) {
                var todo, i = 0;
                for (; i < ele.delegate[event + selector].length; i++) {
                    todo = ele.delegate[event + selector][i];
                    delete ele.delegate[ event + selector][i];
                    if (ele.detachEvent) {
                        ele.detachEvent("on" + event, ele[event + selector + todo + (i+1)]);
                        ele[event + selector + todo] = null;
                    } else {
                        ele.removeEventListener(event, todo, false);
                    }
                }
            });
            return this;
        };


        /**
         * 只被执行一次的事件
         * @param event
         * @param callback
         */
        core.fn.one = function (event, callback) {
            var _this = this,
                todo = function () {
                    callback.apply(this, arguments);
                    _this.unbind(event, todo);
                };
            _this.bind(event, todo);
        };

        /**
         * 设置或者读取一组attr
         * @param key
         * @param val
         * @returns {*}
         */
        core.fn.attr = function (key, val) {
            if (val) {
                core.each(this.selector, function (k, ele) {
                    ele.setAttribute(key, val);
                });
                return this;
            } else {
                return  this.selector[0].getAttribute(key);
            }
        };

        /**
         * 删除一组attr
         * @param key
         * @returns {core.fn}
         */
        core.fn.removeAttr = function (key) {
            core.each(this.selector, function (k, ele) {
                ele.removeAttribute(key);
            });
            return this;
        };

        //CSS样式表操作
        /**
         * 对选择器中节点应用或获得CSS设置
         * @param css
         * @param val
         * @returns {*}
         */
        core.fn.css = function (css, val) {
            if (val) {
                core.each(this.selector, function (key, ele) {
                    ele.style[css] = val;
                });
                return this;
            } else {
                if (typeof css === "string") {
                    return this.selector[0].style[css];
                } else {
                    core.each(this.selector, function (key, ele) {
                        core.each(css, function (k, val) {
                            ele.style[k] = val;
                        });
                    });
                    return this;
                }
            }

        };

        /**
         * 添加一组ClassName属性
         * @param classname
         */
        core.fn.addClass = function (classname) {
            core.each(this.selector, function (key, ele) {
                ele.className = (ele.className) ? ele.className + " " + classname : classname;
            });
            return this;
        };

        /**
         * 删除一组CLass属性
         * @param classname
         */
        core.fn.removeClass = function (classname) {
            var regExp = new RegExp("(^|\\s)" + classname + "($|\\s)"), _this = this;
            core.each(this.selector, function (key, ele) {
                ele.className = core.trim(ele.className.replace(regExp, " "));
                if (!ele.className) {
                    _this.removeAttr("class");
                }
            });
            return this;
        };

        /**
         * 对选择器中节点隐藏
         * @returns {core.fn}
         */
        core.fn.hide = function () {
            core.each(this.selector, function (key, ele) {
                ele.style.display = "none";
            });
            return this;
        };

        /**
         * 对选择器中节点显示
         * @returns {core.fn}
         */
        core.fn.show = function () {
            core.each(this.selector, function (key, ele) {
                ele.style.display = "block";
            });
            return this;
        };

        //测试尺寸
        /**
         * 可见区域宽度不包含border的高度
         * @returns {number}
         */
        core.fn.height = function () {
            return this.selector[0].clientHeight;
        };

        /**
         * 可见区域宽度不包含border的宽度
         * @returns {number}
         */
        core.fn.weight = function () {
            return this.selector[0].clientWidth;
        };

        //选择器Dom操作
        /**
         * 将NodeList对象转为Array对象
         * @param nodeList
         * @returns {Array}
         */
        core._node2arr = function (nodeList) {
            if (core.browser.isIe()) {
                var i = 0, nodeArr = [];
                for (; i < nodeList.length; i++) {
                    nodeArr.push(nodeList[i]);
                }
                return nodeArr;
            } else {
                return Array.prototype.slice.call(nodeList);
            }

        };

        /**
         * 将html转为Node
         * @param html
         * @returns {DocumentFragment}
         * @private
         */
        core._html2nodeList = function (html) {
            var temp = document.createElement("div"),
                frag = document.createDocumentFragment();
            temp.innerHTML = html;
            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }
            return frag;
        };

        /**
         * 返回选择器原始nodeList对象
         * @param index
         * @returns {*}
         */
        core.fn.get = function (index) {
            return  ( !isNaN(index) ) ? this.selector[index] : this.selector;
        };

        /**
         * 获取索引的节点或全部节点
         * @param index
         * @returns {core.fn}
         */
        core.fn.eq = function (index) {
            this.selector = this[0] = [this.selector[index]];
            return this;
        };

        /**
         * 获取下一个节点对象
         * @returns {core.fn}
         */
        core.fn.next = function () {
            var endBrother = this.selector[0].nextSibling;
            while (endBrother.nodeType !== 1) {
                endBrother = endBrother.nextSibling;
            }
            this.selector = this[0] = [endBrother];
            return this;
        };

        /**
         * 获取上一个节点对象
         * @returns {core.fn}
         */
        core.fn.previous = function () {
            var endBrother = this.selector[0].previousSibling;
            while (endBrother.nodeType !== 1) {
                endBrother = endBrother.previousSibling;
            }
            this.selector = this[0] = [endBrother];
            return this;
        };

        /**
         * 获取取得的节点数
         */
        core.fn.size = function () {
            return  this.selector.length;
        };

        /**
         * 向对象内尾部插入元素
         * @param html
         */
        core.fn.append = function (html) {
            var frag = core._html2nodeList(html);
            core.each(this.selector, function (key, ele) {
                ele.appendChild(frag.cloneNode(true));
            });
            return this;
        };

        /**
         * 向对象头部插入元素
         * @param html
         */
        core.fn.prepend = function (html) {
            var frag = core._html2nodeList(html);
            core.each(this.selector, function (key, ele) {
                var htmlNode = frag.cloneNode(true);
                if (ele.children.length === 0) {
                    ele.appendChild(htmlNode);
                } else {
                    ele.insertBefore(htmlNode, ele.children[0]);
                }
            });
            return this;
        };

        /**
         * 删除选择器中全部节点
         */
        core.fn.remove = function () {
            core.each(this.selector, function (key, ele) {
                ele.parentNode.removeChild(ele);
            });
            return this;
        };

        /**
         * 向选选择器中的节点传入或获得数据
         * @param string
         */
        core.fn.html = function (string) {
            if (string) {
                core.each(this.selector, function (key, ele) {
                    ele.innerHTML = string;
                });
                return this;
            } else {
                return  this.selector[0].innerHTML;
            }

        };

        //循环管理
        /**
         * 处理循环
         * @param object
         * @param callback
         */
        core.each = function (object, callback) {
            for (var key in object) {
                callback(key, object[key]);
            }
        };


        //浏览器兼容判断
        core.browser = {
            isIe: function () {
//                return  ( !-[1,] ) ? true:false;
                return ( 0/*@cc_on+1@*/ ) ? true : false;
            },
            isOpera: function () {
                return   (window.opera) ? true : false;
            },
            isWebkit: function () {
                return (window.WebKitPoint) ? true : false;
            },
            isGecko: function () {
                return  (window.netscape && navigator.product === "Gecko") ? true : false;
            },
            kernel: function () {
                if (core.browser.isIe()) {
                    return "IE";
                } else if (core.browser.isOpera()) {
                    return "OPERA";
                } else if (core.browser.isWebkit()) {
                    return "WEBKIT";
                } else if (core.browser.isGecko()) {
                    return "GECKO";
                } else {
                    return "UNKONW";
                }
            },
            brand: {
                isSafari: function () {
                    return  (  core.browser.isWebkit() && /^apple\s+/i.test(navigator.vendor) ) ? true : false;
                },
                isChrome: function () {
                    return  (  core.browser.isWebkit() && window.google ) ? true : false;
                },
                isFirefox: function () {
                    return  (core.browser.isGecko()) ? true : false;
                },
                name: function () {
                    if (core.browser.isIe()) {
                        var IE6 = (!-[1, ] && !window.XMLHttpRequest);
                        if (IE6) {
                            return "IE6";
                        } else if (!IE6 && (!document.documentMode || document.documentMode === 7)) { //ie7
                            return "IE7";
                        } else { //ie8-10
                            return "IE" + document.documentMode;
                        }
                    } else if (core.browser.brand.isSafari()) {
                        return "SAFARI";
                    } else if (core.browser.brand.isChrome()) {
                        return "CHROME";
                    } else if (core.browser.brand.isFirefox()) {
                        return "FIREFOX";
                    } else {
                        return "UNKONW";
                    }
                }

            }
        };


        //Json数据操作
        core.json = {
            toString: function (json) {
                return JSON.stringify(json);
            },
            toObject: function (string) {
                return JSON.parse(string);
            }
        };

        //Cache模块
        core.cache = {
            val: function (key, val, expires) {
                return ( val ) ? core.cache.set(key, val, expires) : core.cache.get(key);
            },
            get: function (key) {
                if (window.localStorage) {
                    var expires, json;
                    json = core.json.toObject(localStorage.getItem(key));
                    if (json) {
                        expires = (+new Date()) - json.create_at;
                        if (expires < json.expires || json.expires === 0) {
                            return json.val;
                        }
                        core.cache.remove(key);
                    }
                }
            },
            /**
             *
             * @param key
             * @param val
             * @param expires 单位分
             * @returns {boolean}
             */
            set: function (key, val, expires) {
                if (window.localStorage) {
                    localStorage.setItem(
                        key,
                        core.json.toString({
                            expires: (expires) ? parseInt(expires) * 1000 * 60 : 0,
                            create_at: +new Date(),
                            val: val
                        }));
                    return true;
                }
            },
            remove: function (key) {

                if (window.localStorage) {
                    localStorage.removeItem(key);
                    return true;
                }
            },
            clear: function () {
                if (window.localStorage) {
                    localStorage.clear();
                }
            }
        };

        //ajax方法
        core.ajax = (function (obj) {
            var e = {init: function () {
                if (obj.ActiveXObject) {
                    return  new ActiveXObject("Microsoft.XMLHTTP");
                } else if (obj.XMLHttpRequest) {
                    return  new XMLHttpRequest();
                }
            },
                todo: function (params) {

                    params.sync = ( typeof(params.sync) === "boolean" ) ? params.sync : true;
                    var xmlHttp = e.init(), param = e.parseBuild(params.json);
                    xmlHttp.onreadystatechange = todo;
                    if (params.method === "post") {
                        xmlHttp.open(params.method.toLowerCase(), params.url, true);
                        xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    } else if (params.method.toLowerCase() === "get") {
                        params.url += e._link(params.url) + param;
                        param = null;
                        //是否异步
                        xmlHttp.open(params.method.toLowerCase(), params.url, params.sync);
                    }
                    (param != null) ? xmlHttp.send(param) : xmlHttp.send();
                    function todo() {

                        if (params.callback !== undefined && xmlHttp.readyState === 4) {
                            if (xmlHttp.status === 200) {
                                var data = xmlHttp.responseText;
                                data = ( params.isEval === true) ? eval("(" + data + ")") : data;
                                params.callback(data);
                            } else if (params.errback !== undefined) {
                                params.errback();
                            }
                        }
                    }
                },
                jsonp: function (url, json, callback, server) {
                    json.callback = server = (server) ? server + Math.ceil(Math.random() * 10000) : "callback" + Math.ceil(Math.random() * 10000);
                    eval("obj." + server + "=function(data){callback(data);}");
                    url = (url + e._link(url) + e.parseBuild(json));
                    addheader(url);
                    function addheader(url) {
                        var header, script;
                        header = document.getElementsByTagName("head")[0];
                        script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = url;
                        header.appendChild(script);
                        script.onload = script.onreadystatechange = function () {
                            if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
                                header.removeChild(script);
                            }
                        };
                    }
                },
                _link: function (url) {
                    var regExp = /\?/;
                    return (regExp.test(url)) ? "&" : "?";
                },
                parseBuild: function (json) {
                    function random() {
                        var date = new Date();
                        return "rid=" + date.getTime();
                    }

                    var key, str = "";
                    if (typeof(json) !== "object") {
                        return random();
                    }
                    for (key in json) {
                        str += key + "=" + encodeURIComponent(json[key]) + "&";
                    }
                    return str += random();
                }
            };
            return {
                /**
                 * AJAX基础方法
                 * @param params
                 */
                todo: function (params) {
                    // {  url: url, json: json, callback: callback, errback: errback, method: method,  isEval: isEval, sync: sync  }
                    e.todo(params);
                },
                get: function (url, json, callback, errback) {
                    e.todo({
                        url: url,
                        json: json,
                        callback: callback,
                        errback: errback,
                        method: "get"
                    });
                },
                post: function (url, json, callback, errback) {
                    e.todo({
                        url: url,
                        json: json,
                        callback: callback,
                        errback: errback,
                        method: "post"
                    });
                },
                getJson: function (url, json, callback, errback) {
                    e.todo({
                        url: url,
                        json: json,
                        callback: callback,
                        errback: errback,
                        method: "post",
                        isEval: true
                    });
                },
                jsonp: function (url, json, callback, server) {
                    e.jsonp(url, json, callback, server);
                }
            };

        }(window));

        core.cookies = (function () {
            var cookies = {

                //cookies接口
                opt: function (key, value, parm) {
                    return ( value === undefined ) ? cookies.getCookies(key) : cookies.setCookies(key, value, parm);
                },

                //获取cookies
                getCookies: function (key) {
                    var cookies, result, regExp;
                    cookies = document.cookie.toString();
//                  regExp = eval("/" + key + "=(.*?)([;]|$)/");
                    regExp = new RegExp("\\s?" + key + "=(.*?)([;]|$)");
                    result = regExp.exec(cookies);
                    return (result != null) ? unescape(result[1]) : undefined;
                },

                //设置cookies
                setCookies: function (key, value, parm) {
                    var str = key + "=" + escape(value);
                    str += cookies.parseParam(parm);
                    document.cookie = str;
                    return true;
                },

                //删除cookies
                del: function (key, parm) {

                    var str = key + "=";
                    if (parm !== undefined) {
                        parm.expires = -100000;
                    } else {
                        parm = { expires: -100000 };
                    }
                    str += cookies.parseParam(parm);
                    document.cookie = str;
                    return true;
                },


                /**
                 * 解析cookies字串
                 * @param parm  parm.expires 单位分
                 * @returns {string}
                 */
                parseParam: function (parm) {

                    var date, str = "";
                    if (parm !== undefined) {
                        if (parm.expires !== undefined) { //设置过期时间
                            date = new Date();
                            date.setTime(date.getTime() + parseInt(parm.expires) * 1000 * 60);
                            str += "; expires=" + date.toGMTString();
                        }
                        if (parm.path !== undefined) {
                            str += "; path=" + parm.path;
                        } //设置作用路径
                        if (parm.domain !== undefined) {
                            str += "; domain=" + parm.domain;
                        }//设置作用域
                    }
                    return str;
                }


            };
            return {
                opt: function (key, value, parm) {
                    return cookies.opt(key, value, parm);
                },
                del: function (key, parm) {
                    return cookies.del(key, parm);
                }
            };
        })();


        core.trim = function (string) {
            return string.replace(/(^(\s|  )*)|((\s|  )*$)/g, "");
        };
        core.len = function (value) {
            return value.replace(/[^\x00-\xff]/g, "^^").length;
        };

        core.inArray = function (val, arr) {
            var ret = false, i = 0, len = arr.length;
            for (; i < len; i++) {
                if (arr[i] === val) {
                    ret = true;
                    break;
                }
            }
            return ret;
        };
        /**
         * 对选择器中节点应用并实现CSS3 Transition动画绑定
         * @param params
         * @param time
         * @param callback
         */
        core.fn.transition = function (params, time, callback) {


            function string2hump(str) {
                return str.replace(/\-(\w)/g, function (all, letter) {
                    return letter.toUpperCase();
                });
            }

            function _transition(dom, params, time, callback) {

                var effect, style, key;
                for (key in params) {
                    dom.style[string2hump(key)] = params[key][0];
                    effect = params[key][2];
                }
                effect = ( effect ) ? effect : "linear";
                // style = style.join(',');
                style = "all " + time + "ms " + effect;

                dom.style.WebkitTransition = style;
                dom.style.transition = style;
//                dom.style.mozTransition = style;
//                dom.style.msTransition = style;

                dom.focus();
                for (key in params) {
                    dom.style[string2hump(key)] = params[key][1];
                }
                setTimeout(function () {

                    dom.style.WebkitTransition = "none";
                    dom.style.transition = "none";
//                    dom.style.mozTransition = "none";
//                    dom.style.msTransition = "none";

                    if (callback) {
                        callback();
                    }
                }, time + 20);

            }

            core.each(this.selector, function (k, dom) {
                _transition(dom, params, time, callback);
            });
            return this;
        };

        //动画函数
        core.animate = (function () {
            var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
                setTimeout(callback, 60);
            };

            function cpu(fun, time, callback) {
                var start_time = +new Date();

                function todo(fun, time, callback) {
                    var loop_time, pos;
                    loop_time = +new Date() - start_time;
                    pos = loop_time / time;
                    if (loop_time >= time) {
                        fun(1);
                        if (callback) {
                            callback();
                        }
                        return;
                    }
                    fun(pos);
                    requestAnimationFrame(function () {
                        todo(fun, time, callback);
                    });

                }

                requestAnimationFrame(function () {
                    todo(fun, time, callback);
                });
            }

            return {
                play: function (fun, time, callback) {
                    cpu(fun, time, callback);
                }
            };

        })();


        core.fn.debug = function(){

        };

        core.fn.init.prototype = core.fn;
        return core;

    }());


    window.core = window.S = core;

}(window) );

