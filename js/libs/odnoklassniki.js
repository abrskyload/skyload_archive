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

define('odnoklassniki', ['underscore', 'jquery', 'md5', 'methods'], function (_, $, md5) {
    var Odnoklassniki = function () {
        function Odnoklassniki() {
            _classCallCheck(this, Odnoklassniki);

            this.sig = Skyload.SOURCE_ODNOKLASSNIKI;
            this.get_sound_url = 'http://wmf1.odnoklassniki.ru/play;';
            this.jsessionid = null;
            this.jsessionid_proces = false;
            this.jsessionid_callbacks = [];

            this.protocol = 'http:';
            this.domain = 'ok.ru';
            this.sound_check = false;
        }

        _createClass(Odnoklassniki, [{
            key: 'Call',
            value: function Call(id, callback) {
                return this.GetSoundModel(id).then(callback, function (e) {
                    Skyload.setLog('OK Libs', 'Get error', e);
                    Skyload.Analytics('OK', 'Error', 'Get sound model', e.message);
                    callback(null);
                });
            }
        }, {
            key: 'SetParams',
            value: function SetParams(protocol, domain, sound_check) {
                this.protocol = protocol;
                this.domain = domain;
                this.sound_check = sound_check || false;

                return this;
            }
        }, {
            key: 'GetSoundModel',
            value: function GetSoundModel(id, i) {
                var _this = this;

                if (_.isUndefined(i)) {
                    i = 0;
                }

                var getModel = function getModel(data) {
                    return new Promise(function (resolve, reject) {
                        try {
                            var _callback = function _callback() {
                                var model = {
                                    index: [_this.sig, id].join('_'),
                                    id: id,
                                    source: _this.sig,
                                    play: data.play,
                                    author: data.track.ensemble,
                                    name: data.track.name,
                                    duration: data.track.duration,
                                    size: data.track.size,
                                    mime_type: Skyload.AUDIO_MIME_TYPE_MP3
                                };

                                if ('imageUrl' in data.track) {
                                    model.cover = data.track.imageUrl.replace('type=2', 'type=1');
                                } else if ('image' in data) {
                                    model.cover = data.image;
                                }

                                resolve(model);
                            };

                            if (_this.sound_check) {
                                Skyload.Methods.GetFileSize(data.play, function (response) {
                                    var size = parseInt(response.fileSize);

                                    if (size > 0 || i >= 10) {
                                        _callback();
                                    } else {
                                        _this.jsessionid = null;
                                        _this.GetSoundModel(id, i + 1).then(resolve, reject);
                                    }
                                });
                            } else {
                                _callback();
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                };

                return this.GetSound(id).then(function (data) {
                    if (!_.isObject(data)) {
                        throw new Error('Invalid response');
                    }

                    return getModel(data);
                });
            }
        }, {
            key: 'GetSound',
            value: function GetSound(id) {
                var _this2 = this;

                var fetchSound = function fetchSound(url) {
                    return new Promise(function (resolve, reject) {
                        Skyload.Methods.XHR(url, function (r) {
                            try {
                                var json = $.parseJSON(r.response.responseText);

                                if (json.error) {
                                    throw new Error(json.error);
                                }

                                var hash = _this2.GetHash(md5(Skyload.Methods.ParseQuery(Skyload.Methods.ParseURL(json.play).query).md5 + 'secret'));

                                json.play = json.play + '&clientHash=' + hash;

                                resolve(json);
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                };

                return this.GetJSessionId().then(function (jsessionid) {
                    var url = _this2.get_sound_url + 'jsessionid=' + jsessionid + '?tid=' + id;

                    return fetchSound(url);
                });
            }
        }, {
            key: 'GetHash',
            value: function GetHash(src, magic) {
                if (!magic) magic = [4, 3, 5, 6, 1, 2, 8, 7, 2, 9, 3, 5, 7, 1, 4, 8, 8, 3, 4, 3, 1, 7, 3, 5, 9, 8, 1, 4, 3, 7, 2, 8];

                var a = [];
                for (var _i = 0; _i < src.length; _i++) {
                    a.push(parseInt('0x0' + src.charAt(_i)));
                }

                src = a;

                var res = [];
                src = src.slice(0);
                src[32] = src[31];
                var sum = 0;
                var i = 32;
                while (i-- > 0) {
                    sum += src[i];
                }for (var x = 0; x < 32; x++) {
                    res[x] = Math.abs(sum - src[x + 1] * src[x] * magic[x]);
                }return res.join('');
            }
        }, {
            key: 'GetJSessionId',
            value: function GetJSessionId() {
                var _this3 = this;

                return new Promise(function (resolve, reject) {
                    var __callback = function __callback() {
                        if (_this3.jsessionid_callbacks.length) {
                            _.each(_this3.jsessionid_callbacks, function (_callback) {
                                if (_.isFunction(_callback)) {
                                    _callback(_this3.jsessionid);
                                }
                            });
                        }

                        _this3.jsessionid_callbacks = [];
                    };

                    _this3.jsessionid_callbacks.push(resolve);

                    if (_.isNull(_this3.jsessionid)) {
                        if (!_this3.jsessionid_proces) {
                            _this3.jsessionid_proces = true;

                            var url = _this3.protocol + '//' + _this3.domain + '/web-api/music/conf';

                            Skyload.Methods.XHR(url, function (response) {
                                _this3.jsessionid_proces = false;

                                try {
                                    var json = JSON.parse(response.response.responseText);

                                    if (json.sid) {
                                        _this3.jsessionid = json.sid;
                                    } else {
                                        throw new Error('Can not get id');
                                    }
                                } catch (e) {
                                    reject(e);
                                    Skyload.setLog('OK Libs', 'Get JSessionID error', e);
                                } finally {
                                    __callback();
                                }
                            }, 'POST');
                        }
                    } else {
                        __callback();
                    }
                });
            }
        }, {
            key: 'GetVideoModel',
            value: function GetVideoModel(data) {
                var _this4 = this;

                return this.GetIndexFromData(data).then(function (data) {
                    switch (data.source) {
                        case Skyload.SOURCE_YOUTUBE:
                        case Skyload.SOURCE_VIMEO:
                            var params = [data.id];

                            return Skyload.CallProcedure(data.source, params);

                        case Skyload.SOURCE_ODNOKLASSNIKI:
                            return _this4.GetVideoFromMetadata(data.data);

                        default:
                            throw new Error('Wrong source');
                    }
                });
            }
        }, {
            key: 'GetIndexFromData',
            value: function GetIndexFromData(data) {
                var _this5 = this;

                return new Promise(function (resolve, reject) {
                    var callback = function callback(data) {
                        try {
                            if (!('movie' in data)) {
                                throw new Error('Param movie not found');
                            }

                            var movie = data.movie,
                                provider = data.provider;
                            var content = movie.contentId;


                            console.log('fuck', data);

                            var options = void 0,
                                source = void 0,
                                id = void 0;

                            if (!('provider' in data)) {
                                throw new Error('Param provider not found');
                            }

                            switch (provider) {
                                case 'USER_YOUTUBE':
                                    id = content;
                                    source = Skyload.SOURCE_YOUTUBE;

                                    break;
                                case 'OPEN_GRAPH':
                                    if (content.indexOf('vimeo.com') >= 0) {
                                        options = Skyload.Methods.ParseQuery(Skyload.parseURL(content).query);

                                        if (options.clip_id) {
                                            id = options.clip_id;
                                            source = Skyload.SOURCE_VIMEO;
                                        } else {
                                            throw new Error('Provider [open graph] not vimeo');
                                        }
                                    } else {
                                        throw new Error('Provider [open graph] wrong content id');
                                    }

                                    break;
                                case 'UPLOADED_ODKL':
                                case 'YKL':
                                case 'PARTNER':
                                case 'LIVE_TV_ODKL':
                                case 'LIVE_TV_APP':
                                    id = movie.movieId;
                                    source = Skyload.SOURCE_ODNOKLASSNIKI;

                                    break;
                                default:
                                    throw new Error('Provider not available');

                            }

                            resolve({
                                id: id,
                                source: source,
                                index: [source, id].join('_'),
                                data: data,
                                options: options
                            });
                        } catch (e) {
                            reject(e);
                        }
                    };

                    try {
                        if (!_.isObject(data)) {
                            throw new Error('Data must be object');
                        }

                        if ('metadata' in data) {
                            callback(JSON.parse(data.metadata));
                        } else if ('metadataUrl' in data) {
                            _this5.GetMetadata(decodeURIComponent(data.metadataUrl)).then(function (metadata) {
                                return callback(metadata);
                            }, reject);
                        } else {
                            throw new Error('Metadata or metadataUrl not found');
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        }, {
            key: 'GetMetadata',
            value: function GetMetadata(url) {
                var fetchMetadata = function fetchMetadata(token) {
                    if (!token) {
                        return Promise.reject(new Error('Token filed'));
                    }

                    return new Promise(function (resolve, reject) {
                        Skyload.Methods.XHR(url, function (r) {
                            try {
                                resolve(JSON.parse(r.response.responseText));
                            } catch (e) {
                                reject(e);
                            }
                        }, 'POST', null, null, null, { 'tkn': token });
                    });
                };

                var code = function code() {
                    try {
                        return window.OK.tkn.token;
                    } catch (e) {
                        return null;
                    }
                };

                return Skyload.Methods.B(code).then(function (token) {
                    return fetchMetadata(token);
                });
            }
        }, {
            key: 'GetVideoFromMetadata',
            value: function GetVideoFromMetadata(data) {
                var _this6 = this;

                var callback = function callback(videos) {
                    data = data.movie;

                    var id = data.movieId;
                    var index = [_this6.sig, id].join('_');

                    return {
                        index: index,
                        id: id,
                        source: _this6.sig,
                        name: data.title,
                        cover: data.poster,
                        duration: parseInt(data.duration),
                        play: _.map(videos, function (video) {
                            return _.extend(video, {
                                id: id,
                                name: data.title,
                                duration: parseInt(data.duration)
                            });
                        })
                    };
                };

                if ('metadataEmbedded' in data) {
                    return Promise.resolve(callback(this.GetVideosFromMetadataXML($.parseXML(data.metadataEmbedded))));
                } else if ('metadataUrl' in data) {
                    return this.GetVideoMetadataXML(data.metadataUrl).then(function (video) {
                        return callback(video);
                    });
                }

                return Promise.reject(new Error('Bad data'));
            }
        }, {
            key: 'GetVideoMetadataXML',
            value: function GetVideoMetadataXML(url) {
                var _this7 = this;

                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (r) {
                        if (r.response.status === 200) {
                            resolve(_this7.GetVideosFromMetadataXML($.parseXML(r.response.responseText)));
                        } else {
                            reject(new Error('GetVideoMetadataXML bad status'));
                        }
                    });
                });
            }
        }, {
            key: 'GetVideosFromMetadataXML',
            value: function GetVideosFromMetadataXML($xml) {
                return $.makeArray($($xml).find('Representation').map(function (i, video) {
                    var $video = $(video);

                    return {
                        index: i,
                        url: $video.find('BaseURL').text() + '&bytes=0-99999999',
                        quality: $video.attr('height') + 'p',
                        format: 'MP4'
                    };
                }));
            }
        }]);

        return Odnoklassniki;
    }();

    if (!(Skyload.LIB_ODNIKLASSNIKI in Skyload)) {
        Skyload[Skyload.LIB_ODNIKLASSNIKI] = new Odnoklassniki();
    }

    return Odnoklassniki;
});