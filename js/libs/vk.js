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

define('vk', ['jquery', 'underscore', 'methods'], function ($, _) {
    var VK = function () {
        function VK() {
            _classCallCheck(this, VK);

            this.sig = Skyload.SOURCE_VK;
            this.get_audio_url = 'https://vk.com/al_audio.php';
            this.get_video_url = 'https://vk.com/al_video.php';

            this.user_id = null;

            this.audio_utils = {
                AUDIO_ITEM_CAN_ADD_BIT: 2,
                AUDIO_ITEM_CLAIMED_BIT: 4,
                AUDIO_ITEM_EXPLICIT_BIT: 1024,
                AUDIO_ITEM_HAS_LYRICS_BIT: 1,
                AUDIO_ITEM_HQ_BIT: 16,
                AUDIO_ITEM_INDEX_ADS: 15,
                AUDIO_ITEM_INDEX_ALBUM: 19,
                AUDIO_ITEM_INDEX_ALBUM_ID: 6,
                AUDIO_ITEM_INDEX_AUTHOR_LINK: 8,
                AUDIO_ITEM_INDEX_CONTEXT: 11,
                AUDIO_ITEM_INDEX_COVER_URL: 14,
                AUDIO_ITEM_INDEX_DURATION: 5,
                AUDIO_ITEM_INDEX_EXTRA: 12,
                AUDIO_ITEM_INDEX_FEAT_ARTISTS: 18,
                AUDIO_ITEM_INDEX_FLAGS: 10,
                AUDIO_ITEM_INDEX_HASHES: 13,
                AUDIO_ITEM_INDEX_ID: 0,
                AUDIO_ITEM_INDEX_LYRICS: 9,
                AUDIO_ITEM_INDEX_MAIN_ARTISTS: 17,
                AUDIO_ITEM_INDEX_OWNER_ID: 1,
                AUDIO_ITEM_INDEX_PERFORMER: 4,
                AUDIO_ITEM_INDEX_SUBTITLE: 16,
                AUDIO_ITEM_INDEX_TITLE: 3,
                AUDIO_ITEM_INDEX_TRACK_CODE: 20,
                AUDIO_ITEM_INDEX_URL: 2,
                AUDIO_ITEM_LONG_PERFORMER_BIT: 32,
                AUDIO_ITEM_REPLACEABLE: 512,
                AUDIO_ITEM_UMA_BIT: 128
            };
        }

        _createClass(VK, [{
            key: 'Clear',
            value: function Clear(str) {
                return $('<div />').html(str).text().trim();
            }
        }, {
            key: 'Get',
            value: function Get(id) {
                return this.GetModel(id);
            }
        }, {
            key: 'Call',
            value: function Call(id, callback) {
                return this.Get(id).then(callback, function (e) {
                    Skyload.setLog('VK Libs', 'Get sound error', e);
                    Skyload.Analytics('VK', 'Error', 'Get sound model', e.message);
                    callback(null);
                });
            }
        }, {
            key: 'GetModel',
            value: function GetModel(id) {
                var _this = this;

                return this.GetUserId().then(function () {
                    return _this.FetchSound([id]);
                }).then(function (collection) {
                    return _.first(collection);
                }).then(function (data) {
                    return _this.GetModelFromData(data);
                });
            }
        }, {
            key: 'GetVideoModel',
            value: function GetVideoModel(id, list, playlist_id) {
                var _this2 = this;

                return this.FetchVideo(id, list, playlist_id).then(function (data) {
                    return _this2.GetVideoModelFromData(data);
                });
            }
        }, {
            key: 'GetCollection',
            value: function GetCollection(ids) {
                var _this3 = this;

                return this.GetUserId().then(function () {
                    return _this3.FetchSound(ids);
                }).then(function (json) {
                    return _.chain(json).map(function (data) {
                        return _this3.GetModelFromData(data);
                    }).uniq(function (item) {
                        return item.id;
                    }).value();
                });
            }
        }, {
            key: 'GetModelFromData',
            value: function GetModelFromData(data) {
                var audio = this.ConvertAudioData(data);

                if (_.isNull(audio)) {
                    console.log(data);

                    throw new Error('Audio is null');
                }

                var id = audio.fullId,
                    index = [this.sig, id].join('_'),
                    author = this.Clear(audio.performer) || audio.performer,
                    name = this.Clear(audio.title) || audio.title,
                    duration = audio.duration,
                    cover = audio.coverUrl_p;

                var play = audio.url || null;

                if (!author.length || !name.length || !_.isNumber(duration)) {
                    throw new Error('Invalid params');
                }

                if (_.isString(play)) {
                    play = this.GetSoundDecryptUrl(play);

                    if (/\.m3u8\?/.test(play)) {
                        var a = (play = play.replace("/index.m3u8", ".mp3")).split("/");
                        a.splice(a.length - 2, 1);

                        play = a.join("/");
                    }
                }

                return {
                    index: index,
                    play: play,
                    source: this.sig,
                    id: id,
                    author: author,
                    name: name,
                    duration: duration,
                    cover: _.isString(cover) && cover.length ? cover : null,
                    mime_type: Skyload.AUDIO_MIME_TYPE_MP3,
                    data: {
                        download_id: audio.fullId + "_" + audio.actionHash + "_" + audio.urlHash
                    }
                };
            }
        }, {
            key: 'ConvertAudioData',
            value: function ConvertAudioData(data) {
                if (!_.isArray(data)) return null;

                var intval = function intval(e) {
                    return !0 === e ? 1 : parseInt(e) || 0;
                };

                var e = (data[this.audio_utils.AUDIO_ITEM_INDEX_HASHES] || "").split("/"),
                    i = (data[this.audio_utils.AUDIO_ITEM_INDEX_COVER_URL] || "").split(",");

                return {
                    id: intval(data[this.audio_utils.AUDIO_ITEM_INDEX_ID]),
                    owner_id: intval(data[this.audio_utils.AUDIO_ITEM_INDEX_OWNER_ID]),
                    ownerId: data[this.audio_utils.AUDIO_ITEM_INDEX_OWNER_ID],
                    fullId: data[this.audio_utils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + data[this.audio_utils.AUDIO_ITEM_INDEX_ID],
                    title: data[this.audio_utils.AUDIO_ITEM_INDEX_TITLE],
                    subTitle: data[this.audio_utils.AUDIO_ITEM_INDEX_SUBTITLE],
                    performer: data[this.audio_utils.AUDIO_ITEM_CLAIMED_BIT] || "",
                    duration: intval(data[this.audio_utils.AUDIO_ITEM_INDEX_DURATION]),
                    lyrics: intval(data[this.audio_utils.AUDIO_ITEM_INDEX_LYRICS]),
                    url: data[this.audio_utils.AUDIO_ITEM_INDEX_URL],
                    flags: data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS],
                    context: data[this.audio_utils.AUDIO_ITEM_INDEX_CONTEXT],
                    extra: data[this.audio_utils.AUDIO_ITEM_INDEX_EXTRA],
                    addHash: e[0] || "",
                    editHash: e[1] || "",
                    actionHash: e[2] || "",
                    deleteHash: e[3] || "",
                    replaceHash: e[4] || "",
                    urlHash: e[5] || "",
                    canEdit: !!e[1],
                    canDelete: !!e[3],
                    isLongPerformer: data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_LONG_PERFORMER_BIT,
                    canAdd: !!(data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_CAN_ADD_BIT),
                    coverUrl_s: i[0],
                    coverUrl_p: i[1],
                    isClaimed: !!(data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_CLAIMED_BIT),
                    isExplicit: !!(data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_EXPLICIT_BIT),
                    isUMA: !!(data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_UMA_BIT),
                    isReplaceable: !!(data[this.audio_utils.AUDIO_ITEM_INDEX_FLAGS] & this.audio_utils.AUDIO_ITEM_REPLACEABLE),
                    ads: data[this.audio_utils.AUDIO_ITEM_INDEX_ADS],
                    album: data[this.audio_utils.AUDIO_ITEM_INDEX_ALBUM],
                    albumId: intval(data[this.audio_utils.AUDIO_ITEM_INDEX_ALBUM_ID]),
                    trackCode: data[this.audio_utils.AUDIO_ITEM_INDEX_TRACK_CODE]
                };
            }
        }, {
            key: 'GetUserId',
            value: function GetUserId() {
                var _this4 = this;

                if (this.user_id) {
                    return Promise.resolve(this.user_id);
                }

                var code = 'function(){return vk.id}';

                return Skyload.Methods.B(code).then(function (id) {
                    var userId = parseInt(id, 10);

                    if (_.isNaN(userId)) {
                        throw new Error('VK ID is NaN');
                    }

                    _this4.user_id = userId;
                    return _this4.user_id;
                });
            }
        }, {
            key: 'SetUserId',
            value: function SetUserId(userId) {
                this.user_id = userId;

                return this;
            }
        }, {
            key: 'GetSoundDecryptUrl',
            value: function GetSoundDecryptUrl(url) {
                var userId = this.user_id;

                var i = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
                    n = {
                    v: function v(t) {
                        return t.split("").reverse().join("");
                    }, r: function r(t, e) {
                        var r;
                        t = t.split("");
                        for (var n = i + i, s = t.length; s--;) {
                            ~(r = n.indexOf(t[s])) && (t[s] = n.substr(r - e, 1));
                        }return t.join("");
                    }, s: function s(t, e) {
                        var r = t.length;
                        if (r) {
                            var i = function (t, e) {
                                var r = t.length,
                                    i = [];
                                if (r) {
                                    var n = r;
                                    for (e = Math.abs(e); n--;) {
                                        e = (r * (n + 1) ^ e + n) % r, i[n] = e;
                                    }
                                }
                                return i;
                            }(t, e),
                                n = 0;
                            for (t = t.split(""); ++n < r;) {
                                t[n] = t.splice(i[r - 1 - n], 1, t[n])[0];
                            }t = t.join("");
                        }
                        return t;
                    }, i: function i(t, e) {
                        return n.s(t, e ^ userId);
                    }, x: function x(t, e) {
                        var r = [];
                        return e = e.charCodeAt(0), each(t.split(""), function (t, i) {
                            r.push(String.fromCharCode(i.charCodeAt(0) ^ e));
                        }), r.join("");
                    }
                };

                function s(t) {
                    if ((!window.wbopen || !~(window.open + "").indexOf("wbopen")) && ~t.indexOf("audio_api_unavailable")) {
                        var e,
                            r,
                            i = t.split("?extra=")[1].split("#"),
                            s = "" === i[1] ? "" : o(i[1]);
                        if (i = o(i[0]), "string" != typeof s || !i) return t;
                        for (var a = (s = s ? s.split(String.fromCharCode(9)) : []).length; a--;) {
                            if (e = (r = s[a].split(String.fromCharCode(11))).splice(0, 1, i)[0], !n[e]) return t;
                            i = n[e].apply(null, r);
                        }
                        if (i && "http" === i.substr(0, 4)) return i;
                    }
                    return t;
                }

                function o(t) {
                    if (!t || t.length % 4 == 1) return !1;
                    for (var e, r, n = 0, s = 0, o = ""; r = t.charAt(s++);) {
                        ~(r = i.indexOf(r)) && (e = n % 4 ? 64 * e + r : r, n++ % 4) && (o += String.fromCharCode(255 & e >> (-2 * n & 6)));
                    }return o;
                }

                return s(url);
            }
        }, {
            key: 'GetVideoModelFromData',
            value: function GetVideoModelFromData(data) {
                var meta = _.first(data.player.params);

                if (!_.isObject(meta)) {
                    throw new Error('Not found params player in data');
                }

                var id = meta.vid;
                var index = [this.sig, id].join('_');
                var name = this.Clear(meta.md_title);

                var model = {
                    id: id,
                    source: this.sig,
                    index: index,
                    name: name || 'VK Video',
                    cover: meta.jpg,
                    duration: parseInt(meta.duration)
                };

                model.play = _.chain(meta).map(function (value, key) {
                    if (key.substr(0, 3) === 'url') {
                        var _index = key.replace('url', '');
                        var format = Skyload.VIDEO_FORMAT_MP4.toUpperCase();

                        return {
                            id: id,
                            index: _index,
                            quality: _index + 'p',
                            url: value,
                            format: format,
                            duration: model.duration,
                            mime_type: Skyload.VIDEO_MIME_TYPE_MP4
                        };
                    }
                }).compact().value();

                if (!model.play.length) {
                    throw new Error('Not found video in data');
                }

                return model;
            }
        }, {
            key: 'GetStreamVideoFromData',
            value: function GetStreamVideoFromData(data) {
                var meta = _.first(data.player.params);

                if (!_.isObject(meta)) {
                    throw new Error('Not found params player in data for stream');
                }

                var parse = function parse(schema) {
                    var data = schema.split(/\r\n|\r|\n/);

                    var videos = _.reduce(data, function (list, item, i) {
                        if (item.indexOf('#EXT-X-STREAM-INF') >= 0) {
                            var url = data[i + 1];
                            var query = item.toLowerCase().replace(new RegExp(',', 'g'), '&');
                            var quality = Skyload.Methods.GetQueryVariable(query, 'resolution');

                            if (url && Skyload.isURL(url)) {
                                list.push({
                                    url: url,
                                    quality: quality
                                });
                            }
                        }

                        return list;
                    }, []);

                    if (!videos.length) {
                        throw new Error('Empty stream');
                    }

                    return videos;
                };

                if ('hls_raw' in meta) {
                    return Promise.resolve(parse(meta.hls_raw));
                } else if ('hls' in meta) {
                    return this.Fetch(meta.hls, { json: false }).then(parse);
                }

                return Promise.reject(new Error('Not found needs param for parse stream video'));
            }
        }, {
            key: 'FetchSound',
            value: function FetchSound(ids) {
                var limit = 9;
                var count = ids.length;

                if (count > limit) {
                    var chunk = ids.reduce(function (res, item, index) {
                        if (index % limit === 0) {
                            res.push([]);
                        }

                        res[res.length - 1].push(item);

                        return res;
                    }, []);

                    return Promise.all(chunk.map(this.FetchSound.bind(this))).then(function (values) {
                        return _.flatten(values, true);
                    });
                } else {
                    return this.Fetch(this.get_audio_url, {
                        method: 'POST',
                        json: false,
                        data: {
                            act: 'reload_audio',
                            al: 1,
                            ids: ids.join(',')
                        },
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        referer: location.href
                    }).then(function (response) {
                        if (!_.isObject(response)) {
                            if (!_.isString(response) || !response.length) {
                                throw new Error('Response is empty');
                            }

                            var json = response.replace('<!--', '');

                            if (!_.isString(response) || !response.length) {
                                throw new Error('Not found JSON');
                            }

                            response = JSON.parse(json);
                        }

                        return response.payload[1][0];
                    });
                }
            }
        }, {
            key: 'FetchVideo',
            value: function FetchVideo(id, list, playlist_id) {
                return this.Fetch(this.get_video_url, {
                    method: 'POST',
                    data: {
                        act: 'show',
                        al: 1,
                        list: list || null,
                        module: 'videocat',
                        playlist_id: playlist_id || 'cat_featured',
                        video: id
                    },
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    referer: location.href
                }).then(function (data) {
                    return data.payload[1][4];
                });
            }
        }, {
            key: 'Fetch',
            value: function Fetch(url) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                var handle = null;

                var _options$method = options.method,
                    method = _options$method === undefined ? 'GET' : _options$method,
                    data = options.data,
                    headers = options.headers,
                    referer = options.referer,
                    _options$json = options.json,
                    json = _options$json === undefined ? true : _options$json;


                handle = new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (response) {
                        try {
                            response = response.response;

                            if (response.status !== 200) {
                                throw new Error('Bad response status in fetch video');
                            }

                            if (!response.responseText.toString().length) {
                                throw new Error('Response text is empty in fetch video');
                            }

                            if (json) {
                                resolve(JSON.parse(response.responseText));
                            } else {
                                resolve(response.responseText);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }, method, referer, _.isObject(data) && $.param(data), null, _.isObject(headers) && headers);
                });

                return handle;
            }
        }]);

        return VK;
    }();

    if (!(Skyload.LIB_VK in Skyload)) {
        Skyload[Skyload.LIB_VK] = new VK();
    }

    return VK;
});