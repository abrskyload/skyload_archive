/**
 * Skyload - Download manager for media content
 * @link http://skyload.io
 *
 * @version v7.3.1
 *
 * License Agreement:
 * http://skyload.io/eula
 *
 * Privacy Policy:
 * http://skyload.io/privacy-policy
 *
 * Support and FAQ:
 * http://skyload.io/help
 * skyload.extension@gmail.com
 */

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('methods', ['jquery', 'underscore', 'common'], function ($, _) {
    var Methods = function () {
        function Methods() {
            _classCallCheck(this, Methods);
        }

        _createClass(Methods, [{
            key: 'TimeToSecond',
            value: function TimeToSecond(time) {
                var count = void 0;

                time = time.split(':');
                count = time.length;

                if (count === 3) {
                    return parseInt(time[0]) * 60 * 60 + parseInt(time[1]) * 60 + parseInt(time[2]);
                } else {
                    return parseInt(time[0]) * 60 + parseInt(time[1]);
                }
            }
        }, {
            key: 'Fetch',
            value: function Fetch(url, type) {
                return new Promise(function (resolve, reject) {
                    Skyload.SendMessageFromContentToBackground({
                        method: 'fetch',
                        url: url,
                        type: type || 'text'
                    }, function (response) {
                        if (response.code === 0) {
                            resolve(response.data);
                        } else {
                            reject(new Error(response.message));
                        }
                    });
                });
            }
        }, {
            key: 'XHR',
            value: function XHR(url, callback, method, referer, post, cookie, header, type) {
                Skyload.SendMessageFromContentToBackground({
                    method: 'xhr',
                    url: url,
                    xhrMethod: method,
                    referer: referer,
                    post: post,
                    cookie: cookie,
                    header: header,
                    type: type
                }, callback);
            }
        }, {
            key: 'GetFileSize',
            value: function GetFileSize(url, callback, referer, cookie, header) {
                this.XHR(url, function (req) {
                    var response = {
                        fileSize: 0,
                        fileType: '',
                        status: 500
                    };

                    if (!_.isObject(req)) {
                        return callback(response);
                    } else {
                        response.status = req.response.status;
                    }

                    if (req.response.status === 200 || req.response.status === 206) {
                        var s = req.header.length;

                        if (s) {
                            s = parseInt(s);
                            if (!isNaN(s)) response.fileSize = s;
                        }

                        var t = req.header.type;

                        if (t) response.fileType = t;
                    }

                    callback(response);
                }, 'HEAD', referer, null, cookie, header);
            }
        }, {
            key: 'FetchBuffer',
            value: function FetchBuffer(url, onProgress, onStart) {
                if (Skyload.Environment !== Skyload.ENVIRONMENT_BACKGROUND) {
                    return Promise.reject(new Error('Can ran only from background'));
                }

                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';

                    xhr.onload = function () {
                        if (xhr.status < 200 || xhr.status > 400 || xhr.status === 204) {
                            reject(new Error(xhr.statusText));
                        }

                        if (xhr.response) {
                            resolve({
                                buffer: xhr.response,
                                size: parseInt(xhr.getResponseHeader("Content-Length"))
                            });

                            xhr = null;
                        } else {
                            reject(new Error('Empty result'));
                        }
                    };

                    xhr.onerror = function () {
                        return reject(new Error('Network error'));
                    };

                    xhr.onprogress = onProgress;

                    xhr.send();

                    if (_.isFunction(onStart)) {
                        onStart(xhr);
                    }
                });
            }
        }, {
            key: 'ConvertMediaInfo',
            value: function ConvertMediaInfo(size, duration) {
                var bitrate = 0,
                    value = 'kb',
                    _size = 0,
                    _gb = 1073741824,
                    _mb = 1048576,
                    _kb = 1024;

                size = parseInt(size, 10);
                duration = parseInt(duration);

                if (size >= _gb) {
                    _size = parseFloat((size / _gb).toFixed(2));
                    value = 'gb';
                } else if (size >= _mb) {
                    _size = parseFloat((size / _mb).toFixed(2));
                    value = 'mb';
                } else {
                    _size = parseFloat((size / _kb).toFixed(1));
                    value = 'kb';
                }

                if (_.isNumber(duration) && duration > 0) {
                    bitrate = Math.round(size * 8 / 1000 / duration.toFixed(1));
                }

                return {
                    size: _size,
                    value: value,
                    bitrate: bitrate
                };
            }
        }, {
            key: 'TimeFormat',
            value: function TimeFormat(time) {
                var sec_num = parseInt(time, 10);
                var hours = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - hours * 3600) / 60);
                var seconds = sec_num - hours * 3600 - minutes * 60;

                var return_string = [];

                if (hours > 0) {
                    if (hours < 10) {
                        hours = '0' + hours;
                    }

                    return_string.push(hours);
                }

                if (minutes < 10) {
                    minutes = '0' + minutes;
                }

                if (seconds < 10) {
                    seconds = '0' + seconds;
                }

                return_string.push(minutes);
                return_string.push(seconds);

                return return_string.join(':');
            }
        }, {
            key: 'ParseURL',
            value: function ParseURL(str) {
                return Skyload.parseURL(str);
            }
        }, {
            key: 'ParseQuery',
            value: function ParseQuery(query) {
                var k = {},
                    m = void 0;
                var re = /[?&]?([^=]+)(?:=([^&]*))?/g;

                while (m = re.exec(query)) {
                    if (m[1] && m[2]) k[m[1]] = m[2];else if (m[1]) k[m[1]] = '';
                }

                return k;
            }
        }, {
            key: 'GetQueryVariable',
            value: function GetQueryVariable(query, variable) {
                var vars = query.split('&');

                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split('=');
                    if (decodeURIComponent(pair[0]) == variable) {
                        return decodeURIComponent(pair[1]);
                    }
                }

                return null;
            }
        }, {
            key: 'GetCopyrightFileName',
            value: function GetCopyrightFileName(name, format) {
                name = name.replace(/[`~!@#%^*|+\=?;:'"<>\{\}\\\/]/gi, ' ').replace(/\s{2,}/g, ' ');

                return [name + Skyload.DOWNLOAD_FILE_SIG, format.toLowerCase()].join('.');
            }
        }, {
            key: 'FirstUpperCase',
            value: function FirstUpperCase(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
        }, {
            key: 'GetRandStr',
            value: function GetRandStr() {
                var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;

                var result = '';

                var characters = 'abcdefghijklmnopqrstuvwxyz';
                var charactersLength = characters.length;

                for (var i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }

                return result;
            }
        }, {
            key: 'GetClearFileName',
            value: function GetClearFileName(name, isDir) {
                var unsafeChars = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200b-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

                name = name.replace(/^\./, '_').replace(/\s{2,}/g, ' ').replace(/\t/g, ' ').replace(unsafeChars, '').replace(/[`~!@#%^*|+\=?;:'"<>\{\}\\\/]/gi, ' ').trim();

                if (isDir) {
                    name = name.replace(/(\.| )$/, '_');
                }

                return name;
            }
        }, {
            key: 'StripTags',
            value: function StripTags(str) {
                return str.replace(/<\/?[^>]+>/gi, '');
            }
        }, {
            key: 'CallChromeMethod',
            value: function CallChromeMethod(group, method, callback, type, params) {
                Skyload.SendMessageFromContentToBackground({
                    method: 'chrome',
                    group: group,
                    function: method,
                    params: params,
                    type: type || 1
                }, callback);

                return this;
            }
        }, {
            key: 'GetSender',
            value: function GetSender() {
                return new Promise(function (resolve, reject) {
                    Skyload.SendMessageFromContentToBackground({ method: 'sender' }, function (response) {
                        try {
                            if (response.code == 0) {
                                if (_.isObject(response.sender)) {
                                    resolve(response.sender);
                                } else {
                                    throw new Error('Sender not object');
                                }
                            } else {
                                throw new Error(response.message);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
        }, {
            key: 'Download',
            value: function Download(namespace, index, params, callback) {
                Skyload.SendMessageFromContentToBackground({
                    method: 'download',
                    action: 'download',
                    namespace: namespace,
                    index: index,
                    params: _.isObject(params) ? params : {}
                }, callback);

                return this;
            }
        }, {
            key: 'DecodeUnicodeEscapeSequence',
            value: function DecodeUnicodeEscapeSequence(str) {
                return JSON.parse(JSON.stringify(str).replace(/\\(\\u[0-9a-f]{4})/g, '$1'));
            }
        }, {
            key: 'GetFileExt',
            value: function GetFileExt(url) {
                var uri = this.ParseURL(url.toLowerCase());
                var path = uri.path || '';
                var ext = _.last(path.split('.'));

                return ext;
            }
        }, {
            key: 'Bridge',
            value: function Bridge(code, timeout) {
                if (_.isUndefined(timeout)) {
                    timeout = 10000;
                }

                return new Promise(function (resolve, reject) {
                    var rollback = setTimeout(function () {
                        reject(new Error('Bridge timeout'));
                    }, timeout);

                    var $img = $('<img />').attr({
                        'style': 'display:none; width:0; height:0;',
                        'class': 'skyload-content-image',
                        'src': Skyload.getLink('images/skyload-logo-128.png'),
                        'onload': code
                    }).on('load', function () {
                        clearTimeout(rollback);

                        var $this = $(this);

                        try {
                            var data = $this.attr('data');

                            if (data) {
                                resolve(data);
                            } else {
                                throw new Error('Empty data');
                            }
                        } catch (e) {
                            reject(e);
                        }

                        $this.remove();
                    });

                    $('body').append($img);
                });
            }
        }, {
            key: 'B',
            value: function B(code, timeout) {
                return new Promise(function (resolve, reject) {
                    var eventName = "skyload-event-" + parseInt(1e3 * Math.random()) + "-" + Date.now();

                    var callback = function callback(e) {
                        window.removeEventListener(eventName, callback);

                        resolve(e.detail);

                        script && script.parentNode.removeChild(script);
                    };

                    window.addEventListener(eventName, callback);

                    var cmd = '(function(callback, eventName, timeout) {' + '  if (typeof window.CustomEvent !== "function") {' + '    const CustomEvent = function(event, params) {' + '      params = params || {' + '        bubbles: false,' + '        cancelable: false,' + '        detail: null' + '      };' + '      var evt = document.createEvent(\'CustomEvent\');' + '      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);' + '      return evt;' + '    };' + '' + '    CustomEvent.prototype = window.Event.prototype;' + '' + '    window.CustomEvent = CustomEvent;' + '  }' + '' + '  let run = false;' + '' + '  const handle = function() {' + '    if (run) {' + '      return;' + '    }' + '' + '    run = true;' + '' + '    const e = new CustomEvent(eventName, {' + '      detail: JSON.stringify(callback())' + '    });' + '' + '    window.dispatchEvent(e);' + '  };' + '  ' + '  if(timeout) {' + '   setTimeout(handle, timeout);' + '  } else {' + '   handle();' + '  }' + '})(' + [code.toString(), JSON.stringify(eventName), JSON.stringify(timeout || undefined)].join(',') + ');';

                    var script = document.createElement("script");
                    script.innerHTML = cmd;

                    document.body.appendChild(script);
                });
            }
        }, {
            key: 'String',
            value: function (_String) {
                function String(_x) {
                    return _String.apply(this, arguments);
                }

                String.toString = function () {
                    return _String.toString();
                };

                return String;
            }(function (str) {
                var methods = this;
                var string = function string(_str) {
                    this.str = _str;

                    this.maxLength = 80;
                    this.rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
                    this.illegalRe = /[\/\?<>\\:\*\|":]/g;
                    this.controlRe = /[\x00-\x1f\x80-\x9f]/g;
                    this.reservedRe = /^\.+$/;
                    this.partsRe = /^(.+)\.([a-z0-9]{1,4})$/i;

                    this.specialChars = ('nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2' + ',sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml' + ',Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml' + ',times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil' + ',egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash' + ',ugrave,uacute,ucirc,uuml,yacute,thorn,yuml').split(',');

                    this.specialCharsList = [['amp', 'quot', 'lt', 'gt'], [38, 34, 60, 62]];
                    this.specialCharsRe = /&([^;]{2,6});/g;
                    this.rnRe = /\r?\n/g;
                    this.re1 = /[\*\?"]/g;
                    this.re2 = /</g;
                    this.re3 = />/g;
                    this.spaceRe = /[\s\t\uFEFF\xA0]+/g;
                    this.dblRe = /(\.|\!|\?|_|,|\-|\:|\+){2,}/g;
                    this.re4 = /[\.,:;\/\-_\+=']$/g;
                };

                string.prototype.trim = function () {
                    return this.str.replace(this.rtrim);
                };

                string.prototype.getParts = function () {
                    return this.str.match(this.partsRe);
                };

                string.prototype.decodeSpecialChars = function () {
                    var _this = this;

                    return this.str.replace(this.specialCharsRe, function (text, word) {
                        var code = void 0;
                        if (word[0] === '#') {
                            code = parseInt(word.substr(1));
                            if (isNaN(code)) return '';
                            return String.fromCharCode(code);
                        }
                        var pos = _this.specialCharsList[0].indexOf(word);
                        if (pos !== -1) {
                            code = _this.specialCharsList[1][pos];
                        }
                        pos = _this.specialChars.indexOf(word);
                        if (pos !== -1) {
                            code = pos + 160;
                        }
                        if (code !== undefined) {
                            return String.fromCharCode(code);
                        }
                        return '';
                    });
                };

                string.prototype.modify = function () {
                    if (!this.str) {
                        return '';
                    }

                    this.str = methods.DecodeUnicodeEscapeSequence(this.str);

                    try {
                        this.str = decodeURIComponent(this.str);
                    } catch (err) {
                        this.str = unescape(this.str);
                    }

                    this.str = this.decodeSpecialChars();
                    this.str = this.str.replace(this.rnRe, ' ');
                    this.str = this.trim();

                    this.str = this.str.replace(this.re1, '').replace(this.re2, '(').replace(this.re3, ')').replace(this.spaceRe, ' ').replace(this.dblRe, '$1').replace(this.illegalRe, '_').replace(this.controlRe, '').replace(this.reservedRe, '').replace(this.re4, '');

                    if (this.str.length <= this.maxLength) {
                        return this.str;
                    }

                    var parts = this.getParts();
                    if (parts && parts.length == 3) {
                        parts[1] = parts[1].substr(0, this.maxLength);
                        return parts[1] + '.' + parts[2];
                    }

                    return this.str;
                };

                return new string(str);
            })
        }, {
            key: 'GetPageScript',
            value: function GetPageScript(html, match) {
                "use strict";

                if (match && !Array.isArray(match)) {
                    match = [match];
                }
                var scriptList = [];

                html.replace(/<script(?:|\s[^>]+[^\/])>/g, function (text, offset) {
                    offset += text.length;
                    var endPos = html.indexOf('<\/script>', offset);
                    if (endPos !== -1) {
                        var content = html.substr(offset, endPos - offset);
                        if (match) {
                            match.every(function (r) {
                                return r.test(content);
                            }) && scriptList.push(content);
                        } else {
                            scriptList.push(content);
                        }
                    }
                });

                return scriptList;
            }
        }, {
            key: 'FindJson',
            value: function FindJson(html, match) {
                "use strict";

                if (match && !Array.isArray(match)) {
                    match = [match];
                }
                var rawJson = [];
                var obj = {
                    '{': 0,
                    '[': 0
                };
                var map = { '}': '{', ']': '[' };
                var jsonSymbols = /[{}\]\[":0-9.,]/;
                var whiteSpace = /\r\n\s\t/;
                var jsonText = '';
                for (var i = 0, symbol; symbol = html[i]; i++) {
                    if (symbol === '"') {
                        var end = i;
                        while (end !== -1 && (end === i || html[end - 1] === '\\')) {
                            end = html.indexOf('"', end + 1);
                        }
                        if (end === -1) {
                            end = html.length - 1;
                        }
                        jsonText += html.substr(i, end - i + 1);
                        i = end;
                        continue;
                    }

                    if (!jsonSymbols.test(symbol)) {
                        if (symbol === 't' && html.substr(i, 4) === 'true') {
                            jsonText += 'true';
                            i += 3;
                        } else if (symbol === 'f' && html.substr(i, 5) === 'false') {
                            jsonText += 'false';
                            i += 4;
                        } else if (symbol === 'n' && html.substr(i, 4) === 'null') {
                            jsonText += 'null';
                            i += 3;
                        } else if (!whiteSpace.test(symbol)) {
                            obj['{'] = 0;
                            obj['['] = 0;
                            jsonText = '';
                        }
                        continue;
                    }

                    jsonText += symbol;

                    if (symbol === '{' || symbol === '[') {
                        if (!obj['{'] && !obj['[']) {
                            jsonText = symbol;
                        }
                        obj[symbol]++;
                    } else if (symbol === '}' || symbol === ']') {
                        obj[map[symbol]]--;
                        if (!obj['{'] && !obj['[']) {
                            rawJson.push(jsonText);
                        }
                    }
                }
                var jsonList = [];

                var _loop = function _loop(item, _i) {
                    if (item === '{}' || item === '[]') {
                        return 'continue';
                    }
                    try {
                        if (match) {
                            match.every(function (r) {
                                return r.test(item);
                            }) && jsonList.push(JSON.parse(item));
                        } else {
                            jsonList.push(JSON.parse(item));
                        }
                    } catch (e) {}
                };

                for (var _i = 0, item; item = rawJson[_i]; _i++) {
                    var _ret = _loop(item, _i);

                    if (_ret === 'continue') continue;
                }
                return jsonList;
            }
        }]);

        return Methods;
    }();

    if (!('Methods' in Skyload)) {
        Skyload.Methods = new Methods();
    }

    return Methods;
});