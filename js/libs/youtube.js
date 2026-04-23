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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('youtube', ['backbone', 'underscore'], function (Backbone, _) {
    var getJsScriptContent = function getJsScriptContent(js) {
        var getUrl = function getUrl() {
            var protocol = 'https';
            var host = 'youtube.com';

            if (js.indexOf('//') < 0) {
                js = protocol + '://' + host + (js.indexOf('/') == 0 ? '' : '/') + js;
            } else if (js.indexOf('//') == 0) {
                js = protocol + ':' + js;
            }

            return js;
        };

        return new Promise(function (resolve, reject) {
            Skyload.Methods.XHR(getUrl(), function (data) {
                try {
                    var response = data.response;

                    if (response.status !== 200) {
                        throw new Error('Bad status');
                    }

                    resolve(response.responseText);
                } catch (e) {
                    reject(e);
                }
            });
        });
    };

    var YouTubeConfigModel = Backbone.Model.extend({
        defaults: {
            id: null,
            url: null,
            title: '',
            duration: 0,
            video_formats: '',
            video_adapt_formats: '',
            video_manifest_url: '',
            script_url: '',
            code: []
        },
        validate: function validate(attrs) {
            try {
                if (!attrs.title || !attrs.title.length) {
                    throw new Error('Empty title');
                }

                if (!attrs.video_formats || !attrs.video_formats.length) {
                    throw new Error('Empty video formats');
                }

                if (!attrs.script_url || !attrs.script_url.length) {
                    throw new Error('Empty script url');
                }
            } catch (e) {
                return e.message;
            }
        },
        getLinks: function getLinks() {
            var _this = this;

            return this.fetchSignatureScript().then(function (code) {
                _this.set('code', code);

                var videoFormats = _this.get('video_formats');
                var videoAdaptFormats = _this.get('video_adapt_formats');
                var videoURL = {};
                var videoSignature = [];

                if (_.isArray(videoFormats)) {
                    var videos = videoFormats.slice();

                    if (_.isArray(videoAdaptFormats)) {
                        videos = videos.concat(videoAdaptFormats);
                    }

                    videoURL = videos.reduce(function (urls, video) {
                        var itag = video.itag;


                        var cipher = video.cipher || video.signatureCipher;

                        if ('url' in video) {
                            urls[itag] = video.url;

                            return urls;
                        }

                        if (!cipher) {
                            return urls;
                        }

                        var cipherInfo = Skyload.Methods.ParseQuery(cipher);

                        var url = decodeURIComponent(cipherInfo.url);

                        if (!url) {
                            return urls;
                        }

                        var sig = cipherInfo['sig'] || cipherInfo['signature'];

                        if (sig) {
                            url = url + '&sig=' + sig + '&=signature=' + sig;
                        } else if (cipherInfo['s']) {
                            sig = decodeURIComponent(cipherInfo['s']);

                            sig = _this.decryptSignature(sig);

                            url = url + '&sig=' + sig + '&=signature=' + sig;
                        }

                        if (url.toLowerCase().indexOf('ratebypass') === -1) {
                            url = url + '&ratebypass=yes';
                        }

                        if (url.toLowerCase().indexOf('http') === 0) {
                            url = url + '&title=' + _this.getTitleParam();
                        }

                        urls[itag] = url;

                        return urls;
                    }, {});

                    if (_.size(videoURL) > 0) {
                        return videoURL;
                    }
                }

                var sep1 = ',',
                    sep2 = '&',
                    sep3 = '=';

                if (videoAdaptFormats) {
                    videoFormats = videoFormats + sep1 + videoAdaptFormats;
                }

                var videoFormatsGroup = videoFormats.split(sep1);

                for (var i = 0; i < videoFormatsGroup.length; i++) {
                    var videoFormatsElem = videoFormatsGroup[i].split(sep2);
                    var videoFormatsPair = [];

                    for (var j = 0; j < videoFormatsElem.length; j++) {
                        var pair = videoFormatsElem[j].split(sep3);

                        if (pair.length == 2) {
                            videoFormatsPair[pair[0]] = pair[1];
                        }
                    }

                    if (videoFormatsPair['url'] == null) continue;

                    var url = unescape(unescape(videoFormatsPair['url'])).replace(/\\\//g, '/').replace(/\\u0026/g, '&');

                    if (videoFormatsPair['itag'] == null) continue;

                    var itag = videoFormatsPair['itag'];
                    var sig = videoFormatsPair['sig'] || videoFormatsPair['signature'];

                    if (sig) {
                        url = url + '&sig=' + sig + '&=signature=' + sig;
                        videoSignature[itag] = null;
                    } else if (videoFormatsPair['s']) {
                        sig = decodeURIComponent(videoFormatsPair['s']);

                        sig = _this.decryptSignature(sig);

                        url = url + '&sig=' + sig + '&=signature=' + sig;
                        videoSignature[itag] = videoFormatsPair['s'];
                    }

                    if (url.toLowerCase().indexOf('ratebypass') == -1) {
                        url = url + '&ratebypass=yes';
                    }
                    if (url.toLowerCase().indexOf('http') == 0) {
                        videoURL[itag] = url + '&title=' + _this.getTitleParam();
                    }
                }

                return videoURL;
            });
        },
        getCollection: function getCollection() {
            var _this2 = this;

            return this.getLinks().then(function (links) {
                var group = Skyload.YouTube.GetTypeGroupSortByTag();

                var collection = _.chain(links).map(function (url, tag) {
                    if (!url || !url.length) {
                        return;
                    }

                    var details = group[tag];

                    if (details) {
                        var format = details.format.toLowerCase();

                        return {
                            url: url,
                            quality: details.quality,
                            format: format.toUpperCase(),
                            index: tag,
                            id: _this2.get('id'),
                            mime_type: format == 'audio.mp4' ? Skyload.AUDIO_MIME_TYPE_MP4 : ['video', format].join('/'),
                            without_audio: 'noAudio' in details
                        };
                    }
                }).compact().value();

                if (collection.length === 0) {
                    throw new Error('Collection links is empty');
                }

                return collection;
            });
        },
        decryptSignature: function decryptSignature(sig) {
            function swap(a, b) {
                var c = a[0];
                a[0] = a[b % a.length];
                a[b] = c;

                return a;
            };

            function decode(sig, arr) {
                if (!_.isString(sig)) return null;

                var sigA = sig.split('');

                for (var i = 0; i < arr.length; i++) {
                    var act = arr[i];

                    if (!_.isNumber(act)) return null;

                    sigA = act > 0 ? swap(sigA, act) : act == 0 ? sigA.reverse() : sigA.slice(-act);
                }

                return sigA.join('');
            };

            if (sig == null) return '';

            var arr = this.get('code');

            if (arr) {
                var _sig = decode(sig, arr);

                if (_sig) return _sig;
            } else {
                Skyload.setLog('YT Libs', 'Code error');
            }

            return sig;
        },
        getTitle: function getTitle() {
            var title = this.get('title').replace(/\+/g, '%20');

            title = decodeURIComponent(title).replace(/[\x2F\x5C\x3A\x7C]/g, '-').replace(/[\x2A\x3F]/g, '').replace(/\x22/g, '\'').replace(/\x3C/g, '(').replace(/\x3E/g, ')').replace(/(?:^\s+)|(?:\s+$)/g, '');

            return title;
        },
        getTitleParam: function getTitleParam() {
            var title = this.get('title').replace(/\+/g, '%20');
            title = Skyload.Methods.DecodeUnicodeEscapeSequence(title);

            return encodeURIComponent(Skyload.Methods.String(title).modify());
        },
        fetchSignatureScript: function fetchSignatureScript() {
            var _this3 = this;

            var key = 'youtube-settings';
            var now = _.now();

            return Skyload.Storage(key).then(function (settings) {
                if (_.isObject(settings) && settings.expire > now) {
                    return settings.code;
                } else {
                    return getJsScriptContent(_this3.get('script_url')).then(function (content) {
                        var code = _this3.findSignatureCode(content);

                        if (!_.isArray(code)) {
                            throw new Error('Code not array');
                        }

                        Skyload.Storage(key, {
                            expire: now + 1000 * 60 * 10,
                            code: code
                        });

                        return code;
                    });
                }
            });
        },
        findSignatureCode: function findSignatureCode(sourceCode) {
            try {
                var findMatch = function findMatch(text, regexp) {
                    var matches = text.match(regexp);
                    return matches ? matches[1] : null;
                };

                var signatureFunctionName = findMatch(sourceCode, /\.sig\s*\|\|\s*([a-zA-Z0-9_$][\w$]*)\(/) || findMatch(sourceCode, /signature.*\.set\([^,],\s*([a-zA-Z0-9_$]*)\(/) || findMatch(sourceCode, /\.set\s*\("signature"\s*,\s*([a-zA-Z0-9_$][\w$]*)\(/) || findMatch(sourceCode, /\.signature\s*=\s*([a-zA-Z_$][\w$]*)\([a-zA-Z_$][\w$]*\)/) || findMatch(sourceCode, /([^\s};]*)\s*=\s*function\s*\([^,]\)[^}]*\.split\(["']{2}\)[^}]*\.join\(['"]{2}\)/);

                if (signatureFunctionName == null) {
                    throw new Error('Error #6');
                }

                signatureFunctionName = signatureFunctionName.replace('$', '\\$');

                var regCode = new RegExp(signatureFunctionName + '\\s*=\\s*function' + '\\s*\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);\n*(.+);return [\\w$]*\\.join');
                var regCode2 = new RegExp('function \\s*' + signatureFunctionName + '\\s*\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);\n*(.+);return [\\w$]*\\.join');

                var functionCode = findMatch(sourceCode, regCode) || findMatch(sourceCode, regCode2);

                if (functionCode == null) {
                    throw new Error('Error #5');
                }

                var reverseFunctionName = findMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.reverse\s*\(\s*\)\s*}/);

                if (reverseFunctionName) {
                    reverseFunctionName = reverseFunctionName.replace('$', '\\$');
                }

                var sliceFunctionName = findMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*,\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.(?:slice|splice)\(.+\)\s*}/);

                if (sliceFunctionName) {
                    sliceFunctionName = sliceFunctionName.replace('$', '\\$');
                }

                var regSlice = new RegExp('\\.(?:' + 'slice' + (sliceFunctionName ? '|' + sliceFunctionName : '') + ')\\s*\\(\\s*(?:[a-zA-Z_$][\\w$]*\\s*,)?\\s*([0-9]+)\\s*\\)');
                var regReverse = new RegExp('\\.(?:' + 'reverse' + (reverseFunctionName ? '|' + reverseFunctionName : '') + ')\\s*\\([^\\)]*\\)');
                var regSwap = new RegExp('[\\w$]+\\s*\\(\\s*[\\w$]+\\s*,\\s*([0-9]+)\\s*\\)');
                var regInline = new RegExp('[\\w$]+\\[0\\]\\s*=\\s*[\\w$]+\\[([0-9]+)\\s*%\\s*[\\w$]+\\.length\\]');
                var functionCodePieces = functionCode.split(';');

                var decodeArray = [];
                for (var i = 0; i < functionCodePieces.length; i++) {
                    functionCodePieces[i] = functionCodePieces[i].trim();

                    var codeLine = functionCodePieces[i];

                    if (codeLine.length > 0) {
                        var arrSlice = codeLine.match(regSlice);
                        var arrReverse = codeLine.match(regReverse);

                        if (arrSlice && arrSlice.length >= 2) {
                            var slice = parseInt(arrSlice[1], 10);
                            if (_.isNumber(slice)) {
                                decodeArray.push(-slice);
                            } else {
                                throw new Error('Error #4');
                            }
                        } else if (arrReverse && arrReverse.length >= 1) {
                            decodeArray.push(0);
                        } else if (codeLine.indexOf('[0]') >= 0) {
                            if (i + 2 < functionCodePieces.length && functionCodePieces[i + 1].indexOf('.length') >= 0 && functionCodePieces[i + 1].indexOf('[0]') >= 0) {
                                var inline = findMatch(functionCodePieces[i + 1], regInline);
                                inline = parseInt(inline, 10);
                                decodeArray.push(inline);
                                i += 2;
                            } else {
                                throw new Error('Error #3');
                            }
                        } else if (codeLine.indexOf(',') >= 0) {
                            var swap = findMatch(codeLine, regSwap);
                            swap = parseInt(swap, 10);

                            if (_.isNumber(swap) && swap > 0) {
                                decodeArray.push(swap);
                            } else {
                                throw new Error('Error #2');
                            }
                        } else {
                            throw new Error('Error #1');
                        }
                    }
                }

                return decodeArray;
            } catch (e) {
                Skyload.setLog('YT Libs', 'FindRouteByUrl signature', 'Parse error', e);
            }

            return null;
        }
    });

    var YouTube = function () {
        function YouTube() {
            _classCallCheck(this, YouTube);

            this.sig = Skyload.SOURCE_YOUTUBE;

            this.cover_img = _.template('https://img.youtube.com/vi/<%= id %>/hqdefault.jpg');
            this.types_group = {
                'FLV': {
                    '5': { quality: '240p', size: '320×240' },
                    '34': { quality: '360p', size: '640×360' },
                    '35': { quality: '480p', size: '640×480' },
                    '83': { quality: '480p', '3d': true, size: '640×480' }
                },
                'MP4': {
                    '18': { quality: '360p', size: '640×360' },
                    '22': { quality: '720p', size: '1280×720' },
                    '37': { quality: '1080p', size: '1920×1080' },
                    '38': { quality: '4k', size: '4096×2160' },
                    '82': { quality: '360p', '3d': true, size: '640×360' },
                    '84': { quality: '720p', '3d': true, size: '1280×720' },
                    '85': { quality: '1080p', '3d': true, size: '1920×1080' },
                    '134': { quality: '360p', 'noAudio': true, size: '640×360' },
                    '135': { quality: '480p', 'noAudio': true, size: '640×480' },
                    '136': { quality: '720p', 'noAudio': true, size: '1280×720' },
                    '137': { quality: '1080p', 'noAudio': true, size: '1920×1080' },
                    '138': { quality: '4K', 'noAudio': true, size: '4096×2160' }
                },
                'WebM': {
                    '43': { quality: '360p', size: '640×360' },
                    '44': { quality: '480p', size: '640×480' },
                    '45': { quality: '720p', size: '1280×720' },
                    '46': { quality: '1080p', size: '1920×1080' },
                    '100': { quality: '360p', '3d': true, size: '640×360' },
                    '101': { quality: '480p', '3d': true, size: '640×480' },
                    '102': { quality: '720p', '3d': true, size: '1280×720' }
                },
                '3GP': {
                    '17': { quality: '144p', size: '176×144' },
                    '36': { quality: '240p', size: '320×240' }
                },
                'Audio.MP4': {
                    '139': { quality: '48 kbit/s' },
                    '140': { quality: '128 kbit/s' },
                    '141': { quality: '256 kbit/s' }
                }
            };
        }

        _createClass(YouTube, [{
            key: 'Call',
            value: function Call(id, callback) {
                this.Get(id).then(callback, function (e) {
                    Skyload.setLog('YT Libs', 'Get error', e);
                    Skyload.Analytics('Youtube', 'Error', 'Get model', e.message);
                    callback(null);
                });

                return this;
            }
        }, {
            key: 'Get',
            value: function Get(id) {
                return this.GetModel(id);
            }
        }, {
            key: 'GetTypesGroup',
            value: function GetTypesGroup() {
                return this.types_group;
            }
        }, {
            key: 'GetTypeGroupSortByTag',
            value: function GetTypeGroupSortByTag() {
                var group = _.extend({}, this.GetTypesGroup());

                return _.chain(group).each(function (tags, format, list) {
                    _.each(tags, function (tags_details) {
                        tags_details.format = format;
                    });

                    list = _.extend(list, tags);
                    delete list[format];
                }).value();
            }
        }, {
            key: 'GetGroupByIndex',
            value: function GetGroupByIndex(format, tag) {
                var group = this.GetTypesGroup();

                return format in group && tag in group[format] ? group[format][tag] : {};
            }
        }, {
            key: 'GetCover',
            value: function GetCover(id) {
                return this.cover_img({ id: id });
            }
        }, {
            key: 'GetModel',
            value: function GetModel(id) {
                var _this4 = this;

                return this.GetConfig(id).then(function (config) {
                    return config.getCollection().then(function (collection) {
                        return {
                            id: id,
                            source: _this4.sig,
                            index: [_this4.sig, id].join('_'),
                            play: collection,
                            name: config.getTitle(),
                            cover: _this4.GetCover(id),
                            duration: config.get('duration')
                        };
                    });
                });
            }
        }, {
            key: 'GetConfig',
            value: function GetConfig(id) {
                var _this5 = this;

                return Skyload.Methods.GetSender().then(function (sender) {
                    var url = Skyload.parseURL(sender.url);
                    var set = function set(model) {
                        return model.set('url', sender.url);
                    };

                    if (sender.frameId === 0 && url.host.indexOf('youtube.com') >= 0) {
                        return _this5.GetConfigFromHTML().then(function (config) {
                            if (config.get('id') === id) {
                                return set(config);
                            }

                            return _this5.FetchConfigFromContent(id).then(set);
                        }).catch(function () {
                            return _this5.FetchConfigFromContent(id).then(set);
                        });
                    } else {
                        return _this5.FetchConfigFromContent(id).then(set);
                    }
                }).then(function (config) {
                    if (config.get('id') === id) {
                        return config;
                    }

                    throw new Error('Get config wrong id');
                });
            }
        }, {
            key: 'GetConfigFromHTML',
            value: function GetConfigFromHTML() {
                var code = 'function(){return window.ytplayer}';

                return Skyload.Methods.B(code).then(function (data) {
                    data = JSON.parse(data);

                    var context = data.bootstrapWebPlayerContextConfig;
                    var player = data.config.args.raw_player_response;

                    var config = new YouTubeConfigModel({
                        id: player.videoDetails.videoId,
                        title: player.videoDetails.title,
                        duration: parseInt(player.videoDetails.lengthSeconds),
                        video_formats: player.streamingData.formats,
                        video_adapt_formats: player.streamingData.adaptiveFormats,
                        video_manifest_url: data.config.args.dashmpd,
                        script_url: context.jsUrl
                    });

                    if (!config.isValid()) {
                        throw new Error(config.validationError);
                    }

                    return config;
                });
            }
        }, {
            key: 'FetchConfigFromContent',
            value: function FetchConfigFromContent(id) {
                var _this6 = this;

                return this.FetchDetailFromContent(id).then(function (detail) {
                    if (detail.config) {
                        return detail.config;
                    }

                    return _this6.FetchConfigFromInfo(id);
                });
            }
        }, {
            key: 'FetchDetailFromContent',
            value: function FetchDetailFromContent(id) {
                var findMatch = function findMatch(text, regexp) {
                    var matches = text.match(regexp);
                    return matches ? matches[1] : null;
                };

                var getStsFromContent = function getStsFromContent(content) {
                    try {
                        var find = Skyload.Methods.FindJson(content, [/"sts":/]);

                        if (!_.isArray(find)) {
                            throw new Error('find json not array');
                        }

                        var first = _.first(find);

                        if (!_.isObject(first) || !first.hasOwnProperty('sts')) {
                            throw new Error('Empty sts');
                        }

                        return first.sts;
                    } catch (e) {

                        return null;
                    }
                };

                var getConfigFromContent = function getConfigFromContent(content) {
                    try {
                        var startStr = 'ytInitialPlayerResponse = ';
                        var endStr = '};';

                        var $output = $('<output>').append(content);

                        var script = $('script:not([src])', $output).filter(function (_, script) {
                            return $(script).text().indexOf(startStr) >= 0;
                        });

                        var json = script.length && script.first().text();

                        if (!json.length) {
                            throw new Error('Not found');
                        }

                        var start = json.indexOf(startStr) + startStr.length;
                        var end = json.lastIndexOf(endStr) - startStr.length - endStr.length - 1;

                        json = json.substr(start, end);
                        json = JSON.parse(json);

                        return new YouTubeConfigModel({
                            id: json.videoDetails.videoId,
                            title: json.videoDetails.title,
                            duration: parseInt(json.videoDetails.lengthSeconds),
                            video_formats: json.streamingData.formats,
                            video_adapt_formats: json.streamingData.adaptiveFormats
                        });
                    } catch (e) {
                        Skyload.setLog('Youtube lib: getConfigFromContent error', e);
                    }

                    return null;
                };

                var getDetails = function getDetails() {
                    return new Promise(function (resolve, reject) {
                        Skyload.Methods.XHR('https://www.youtube.com/watch?v=' + id, function (data) {
                            try {
                                var response = data.response;

                                if (response.status !== 200) {
                                    throw new Error('Bad response for video page');
                                }

                                var content = response.responseText;

                                var js = findMatch(content, /\"jsUrl\":\s*\"([^\"]+)\"/).replace(/\\/g, "");

                                var config = getConfigFromContent(content);

                                if (!_.isNull(config)) {
                                    config.set('script_url', js);

                                    if (!config.isValid()) {
                                        config = undefined;
                                    }
                                }

                                resolve({
                                    sts: getStsFromContent(content),
                                    title: findMatch(content, /\"title\":\s*\"([^\"]+)\"/),
                                    js: js,
                                    config: config
                                });
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                };

                return getDetails().then(function (detail) {
                    if (_.isNull(detail.sts)) {
                        return getJsScriptContent(detail.js).then(function (content) {
                            var regex = /sts:\d+/;
                            var m = regex.exec(content);

                            if (_.isArray(m) && m.length > 0) {
                                var sts = m[0].split(':')[1];

                                if (!sts) {
                                    throw new Error('Sts is empty');
                                }

                                return _extends({}, detail, {
                                    sts: sts
                                });
                            }

                            return detail;
                        });
                    }

                    return detail;
                });
            }
        }, {
            key: 'GetVideoInfo',
            value: function GetVideoInfo(id, domain, el) {
                return this.FetchDetailFromContent(id).then(function (detail) {
                    var url = 'https://' + domain + '/get_video_info?' + $.param({
                        html5: 1,
                        video_id: id,
                        eurl: 'https://www.youtube.com/watch?v=' + id,
                        el: el,
                        sts: detail.sts
                    });

                    return new Promise(function (resolve, reject) {
                        Skyload.Methods.XHR(url, function (data) {
                            try {
                                var response = data.response;

                                if (response.status !== 200) {
                                    throw new Error('Bad response for video info');
                                }

                                resolve(_extends({}, detail, {
                                    info: response.responseText
                                }));
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                });
            }
        }, {
            key: 'FetchConfigFromInfo',
            value: function FetchConfigFromInfo(id) {
                var _this7 = this;

                var handler = function handler(detail) {
                    var info = decodeURIComponent(detail.info).split('&').reduce(function (res, value) {
                        return _.extend(res, Skyload.Methods.ParseQuery(value));
                    }, {});

                    var playerResponse = JSON.parse(info.player_response);

                    var attr = {
                        id: playerResponse.videoDetails.videoId || id,
                        title: decodeURIComponent(_.isString(detail.title) ? detail.title : playerResponse.videoDetails.title),
                        duration: playerResponse.videoDetails.lengthSeconds,
                        video_formats: playerResponse.streamingData.formats,
                        video_adapt_formats: playerResponse.streamingData.adaptiveFormats,
                        script_url: detail.js
                    };

                    var config = new YouTubeConfigModel(attr);

                    if (!config.isValid()) {
                        throw new Error(config.validationError);
                    }

                    return config;
                };

                return this.GetVideoInfo(id, 'www.youtube-nocookie.com', 'detailpage').then(handler).catch(function () {
                    return _this7.GetVideoInfo(id, 'www.youtube.com', 'detailpage').then(handler);
                }).catch(function () {
                    return _this7.GetVideoInfo(id, 'www.youtube-nocookie.com', 'embedded').then(handler);
                }).catch(function () {
                    return _this7.GetVideoInfo(id, 'www.youtube.com', 'embedded').then(handler);
                });
            }
        }]);

        return YouTube;
    }();

    if (!(Skyload.LIB_YOUTUBE in Skyload)) {
        Skyload[Skyload.LIB_YOUTUBE] = new YouTube();
    }

    return YouTube;
});