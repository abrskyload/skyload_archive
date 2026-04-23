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

define('soundcloud', ['underscore', 'jquery', 'methods'], function (_, $) {
    var SoundCloud = function () {
        function SoundCloud() {
            _classCallCheck(this, SoundCloud);

            this.sig = Skyload.SOURCE_SOUNDCLOUD;
            this.client_id = '02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea';

            this.protocol = 'https';
            this.host = 'soundcloud.com';
        }

        _createClass(SoundCloud, [{
            key: 'SetSchema',
            value: function SetSchema(protocol, host) {
                this.protocol = protocol;
                this.host = host;

                return this;
            }
        }, {
            key: 'SetClientId',
            value: function SetClientId(id) {
                this.client_id = id;

                return this;
            }
        }, {
            key: 'FetchClientId',
            value: function FetchClientId() {
                var _this = this;

                var url = this.protocol + '://' + this.host;

                return this.Fetch(url, false).then(function (html) {
                    var tags = html.match(/<script[\s\S]*?>[\s\S]*?<\/script>/gi);

                    if (!_.isArray(tags) || !tags.length) {
                        throw new Error('Tags must be array');
                    }

                    var findClientId = function findClientId(content) {
                        var matches = content.match(/client_id:\s*\"([^\"]+)\"/);

                        var clientId = null;

                        if (matches) {
                            clientId = matches[1];
                        }

                        return Promise.resolve(clientId);
                    };

                    var fetchClientId = function fetchClientId(url) {
                        return _this.Fetch(url, false).then(findClientId);
                    };

                    var map = tags.map(function (script) {
                        var $tag = $(script);
                        var src = $tag.attr('src');

                        if (_.isString(src) && src.length) {
                            return fetchClientId(src);
                        }

                        return findClientId($tag.text());
                    });

                    return Promise.all(map);
                }).then(function (results) {
                    var clientId = _.chain(results).compact().first().value();

                    if (!_.isString(clientId) || !clientId.length) {
                        throw new Error('Client id must be string');
                    }

                    _this.client_id = clientId;

                    return clientId;
                });
            }
        }, {
            key: 'GetNormalURL',
            value: function GetNormalURL(url) {
                url = url.replace(/#.*$/i, '');

                if (url.search(/^\/\/(?:[\w-]+\.)?soundcloud\.com(?:\d+)?\//i) > -1) {
                    url = this.protocol + url;
                } else if (url.search(/https?:\/\//i) === -1) {
                    if (url.charAt(0) !== '/') {
                        url = '/' + url;
                    }

                    url = this.protocol + '//' + this.host + url;
                }

                url = Skyload.parseURL(url);
                url = url.scheme + '://' + url.host + url.path.replace(/\/sets\//gi, '/');

                return url;
            }
        }, {
            key: 'Call',
            value: function Call(url, callback) {
                return this.Get(url).then(callback, function (e) {
                    Skyload.setLog('SoundCloud Libs', 'Get error', e);
                    Skyload.Analytics('SoundCloud', 'Error', 'Get model', e.message);
                    callback(null);
                });
            }
        }, {
            key: 'Get',
            value: function Get(url) {
                return this.GetModel(url);
            }
        }, {
            key: 'GetModel',
            value: function GetModel(url) {
                var _this2 = this;

                var api = this.GetNormalURL(url);

                return this.GetConfigByUrl(api).then(function (json) {
                    var model = {
                        index: [_this2.sig, json.id].join('_'),
                        id: parseInt(json.id),
                        source: _this2.sig,
                        cover: json.artwork_url || json.user.avatar_url,
                        author: json.user.username,
                        name: json.title,
                        genre: json.genre,
                        duration: Math.round(parseInt(json.duration) / 1000),
                        mime_type: Skyload.AUDIO_MIME_TYPE_MP3,
                        data: { link: url }
                    };

                    var play = json.media.transcodings.find(function (_ref) {
                        var format = _ref.format;

                        return format.protocol === 'progressive' && format.mime_type === Skyload.AUDIO_MIME_TYPE_MPEG;
                    });

                    if (!_.isObject(play)) {
                        throw new Error('Play not found');
                    }

                    play = play.url + '?client_id=' + _this2.client_id;

                    return _this2.Fetch(play).then(function (_ref2) {
                        var url = _ref2.url;
                        return _extends({}, model, { play: url });
                    });
                });
            }
        }, {
            key: 'GetConfigByUrl',
            value: function GetConfigByUrl(url) {
                return this.Fetch(url, false).then(function (html) {
                    var tags = html.match(/<script>[\s\S]*?<\/script>/gi);

                    if (!_.isArray(tags) || !tags.length) {
                        throw new Error('Tags not found');
                    }

                    var json = null;

                    for (var i in tags) {
                        try {
                            json = tags[i];

                            var startIndex = json.indexOf('},[{');

                            if (startIndex < 0) {
                                continue;
                            }

                            json = json.substr(startIndex + 2);
                            json = json.substr(0, json.length - 11);

                            json = JSON.parse(json);

                            break;
                        } catch (e) {}
                    }

                    if (!_.isArray(json)) {
                        throw new Error('JSON must be array');
                    }

                    json = json.reduce(function (collection, _ref3) {
                        var data = _ref3.data;

                        var items = data.filter(function (item) {
                            return item.hasOwnProperty('id') && item.hasOwnProperty('media') && item.hasOwnProperty('kind') && item.kind === 'track';
                        });

                        if (items.length) {
                            return collection.concat(items);
                        }

                        return collection;
                    }, []);

                    if (!json.length) {
                        throw new Error('Data not found');
                    }

                    json = _.first(json);

                    if (!_.isObject(json)) {
                        throw new Error('JSON must be object to return');
                    }

                    return json;
                });
            }
        }, {
            key: 'Fetch',
            value: function Fetch(url, toJson) {
                if (_.isUndefined(toJson)) {
                    toJson = true;
                }

                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (response) {
                        try {
                            response = response.response;

                            if (response.status === 200) {
                                resolve(toJson ? JSON.parse(response.responseText) : response.responseText);
                            } else {
                                throw new Error('Response bad status (' + response.status + ')');
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
        }]);

        return SoundCloud;
    }();

    if (!(Skyload.LIB_SOUNDCLOUD in Skyload)) {
        Skyload[Skyload.LIB_SOUNDCLOUD] = new SoundCloud();
    }

    return SoundCloud;
});