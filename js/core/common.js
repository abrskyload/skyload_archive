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

define('common', ['underscore', 'url_parser'], function (_, urlParser) {

    window.Skyload = {
        LIB_VIMEO: 'Vimeo',
        LIB_YOUTUBE: 'YouTube',
        LIB_YANDEX: 'Yandex',
        LIB_ODNIKLASSNIKI: 'Odnoklassniki',
        LIB_PLADFORM: 'Pladform',
        LIB_SOUNDCLOUD: 'SoundCloud',
        LIB_VK: 'VK',
        LIB_FACEBOOK: 'Facebook',
        LIB_TIKTOK: 'Tiktok',

        SOURCE_VIMEO: 'vimeo',
        SOURCE_YOUTUBE: 'yt',
        SOURCE_YANDEX: 'ya',
        SOURCE_ODNOKLASSNIKI: 'ok',
        SOURCE_PLADFORM: 'pladform',
        SOURCE_SOUNDCLOUD: 'sc',
        SOURCE_VK: 'vk',
        SOURCE_FACEBOOK: 'fb',
        SOURCE_TIKTOK: 'tiktok',
        SOURCE_GOOGLE_MUSIC: 'gm',
        SOURCE_WIMP: 'wimp',
        SOURCE_DEEZER: 'dz',
        SOURCE_WORLD_WIDE: 'www',

        ENVIRONMENT_CONTENT: 'content',
        ENVIRONMENT_BACKGROUND: 'background',
        ENVIRONMENT_POPUP: 'popup',

        TYPE_SOUND: 'sound',
        TYPE_VIDEO: 'video',
        TYPE_MIXED: 'mixed',

        MEDIA_TYPE_AUDIO: 'audio',
        MEDIA_TYPE_VIDEO: 'video',

        COLLECTION_TYPE_SOUND: 'Sound',
        COLLECTION_TYPE_VIDEO: 'Video',
        COLLECTION_TYPE_DOWNLOAD: 'Download',
        COLLECTION_TYPE_ACCESS: 'Access',

        COLLECTION_MODE_SAVE_PLAY: 1,
        COLLECTION_MODE_IGNORE_SIZE: 2,

        ID3_WRITER_NAME: 'TIT2',
        ID3_WRITER_AUTHOR: 'TPE2',
        ID3_WRITER_ARTISTS: 'TPE1',
        ID3_WRITER_ALBUM: 'TALB',
        ID3_WRITER_GENRE: 'TCON',
        ID3_WRITER_COVER: 'APIC',
        ID3_WRITER_DURATION: 'TLEN',
        ID3_WRITER_YEAR: 'TYER',
        ID3_WRITER_POSITION: 'TRCK',

        DOWNLOAD_STATE_PENDING: 'pending',
        DOWNLOAD_STATE_IN_PROGRESS: 'in_progress',
        DOWNLOAD_STATE_COMPLETE: 'complete',
        DOWNLOAD_STATE_INTERRUPTED: 'interrupted',
        DOWNLOAD_STATE_PRE: 'pre_download',
        DOWNLOAD_STATE_USER_CANCELED: 'user_canceled',

        DOWNLOAD_FROM_URL: 'url',
        DOWNLOAD_FROM_BUFFER: 'buffer',

        DOWNLOAD_AT_TIME: 3,
        DOWNLOAD_FILE_SIG: ' (via Skyload)',

        TAB_STATE_LOADING: 'loading',
        TAB_STATE_COMPLETE: 'complete',

        NOTIFICATION_TYPE_URL: 'url',
        NOTIFICATION_TYPE_DOWNLOADS: 'downloads',
        NOTIFICATION_TYPE_DOWNLOADING: 'downloading',

        LOCALE_STYLE_UPPER_CASE: 1,
        LOCALE_STYLE_LOWER_CASE: 2,
        LOCALE_STYLE_FIRST_UPPER_CASE: 3,

        ICON_POPUP_BLACK: 'black',
        ICON_POPUP_BLACK_TRANSPARENT: 'black_transparent',
        ICON_POPUP_DOWNLOAD: 'download',
        ICON_TYPE_VALUE: 'value',
        ICON_TYPE_PATH: 'path',

        POPUP_STATE_DEFAULT: 'default',
        POPUP_STATE_DOWNLOAD: 'download',
        POPUP_STATE_EMPTY: 'empty',
        POPUP_STATE_YOUTUBE: 'youtube',
        POPUP_STATE_SKYLOAD: 'skyload',

        PLAN_MONTH: 'month',
        PLAN_HALF_YEAR: 'half-year',
        PLAN_YEAR: 'year',
        PLAN_FOREVER: 'forever',

        AUDIO_MIME_TYPE_BASIC: 'audio/basic',
        AUDIO_MIME_TYPE_L24: 'audio/L24',
        AUDIO_MIME_TYPE_MP4: 'audio/mp4',
        AUDIO_MIME_TYPE_AAC: 'audio/aac',
        AUDIO_MIME_TYPE_MPEG: 'audio/mpeg',
        AUDIO_MIME_TYPE_MP3: 'audio/mp3',
        AUDIO_MIME_TYPE_OGG: 'audio/ogg',
        AUDIO_MIME_TYPE_VORBIS: 'audio/vorbis',
        AUDIO_MIME_TYPE_XMSWMA: 'audio/x-ms-wma',
        AUDIO_MIME_TYPE_XMSWAX: 'audio/x-ms-wax',
        AUDIO_MIME_TYPE_REAL_RADIO: 'audio/vnd.rn-realaudio',
        AUDIO_MIME_TYPE_VND_WAVE: 'audio/vnd.wave',
        AUDIO_MIME_TYPE_WEBM: 'audio/webm',

        VIDEO_MIME_TYPE_MPEG: 'video/mpeg',
        VIDEO_MIME_TYPE_MP4: 'video/mp4',
        VIDEO_MIME_TYPE_OGG: 'video/ogg',
        VIDEO_MIME_TYPE_QUICKTIME: 'video/quicktime',
        VIDEO_MIME_TYPE_WEBM: 'video/webm',
        VIDEO_MIME_TYPE_XMSWMV: 'video/x-ms-wmv',
        VIDEO_MIME_TYPE_FLV: 'video/flv',
        VIDEO_MIME_TYPE_XFLV: 'video/x-flv',
        VIDEO_MIME_TYPE_XF4F: 'video/x-f4f',
        VIDEO_MIME_TYPE_3GP: 'video/3gp',
        VIDEO_MIME_TYPE_3GPP: 'video/3gpp',
        VIDEO_MIME_TYPE_3GPP2: 'video/3gpp2',
        VIDEO_MIME_TYPE_MP2T: 'video/mp2t',

        VIDEO_MIME_TYPE_STREAM_APPLE: 'application/vnd.apple.mpegurl',
        VIDEO_MIME_TYPE_STREAM_MPEG: 'application/x-mpegurl',
        VIDEO_MIME_TYPE_STREAM_DASH: 'application/dash+xml',
        VIDEO_MIME_TYPE_OCTET_STREAM: 'application/octet-stream',

        APP_MIME_TYPE_JSON: 'application/json',

        AUDIO_FORMAT_MP3: 'mp3',
        VIDEO_FORMAT_MP4: 'mp4',
        VIDEO_FORMAT_TS: 'ts',
        VIDEO_FORMAT_DASH: 'dash',
        STREAM_PLAYLIST_FORMAT_M3U8: 'm3u8',
        STREAM_PLAYLIST_FORMAT_MPD: 'mpd',

        DEFAULT_NAME_VIDEO_ITEM: 'default',
        VIDEO_QUALITY_SD: 'SD',

        POPUP_CONTENT_ITEM_DES_SHORT: 'short',
        POPUP_CONTENT_ITEM_DES_SHORT_TITLE: 'short_title',
        POPUP_CONTENT_ITEM_DES_PLAYER: 'player',

        ERROR_CHROME_LAST_ERROR: 100,
        ERROR_ID_MUST_BE_THEN_ZERO: 200,

        get AvailableTypes() {
            return [this.TYPE_SOUND, this.TYPE_VIDEO];
        },

        get AvailableMediaTypes() {
            return [this.MEDIA_TYPE_AUDIO, this.MEDIA_TYPE_VIDEO];
        },

        get AvailableMediaTypesByType() {
            return _.object(this.AvailableTypes, this.AvailableMediaTypes);
        },

        get AvailableAudioMimeTypes() {
            return [this.AUDIO_MIME_TYPE_BASIC, this.AUDIO_MIME_TYPE_L24, this.AUDIO_MIME_TYPE_MP4, this.AUDIO_MIME_TYPE_MP3, this.AUDIO_MIME_TYPE_AAC, this.AUDIO_MIME_TYPE_MPEG, this.AUDIO_MIME_TYPE_OGG, this.AUDIO_MIME_TYPE_VORBIS, this.AUDIO_MIME_TYPE_XMSWMA, this.AUDIO_MIME_TYPE_XMSWAX, this.AUDIO_MIME_TYPE_REAL_RADIO, this.AUDIO_MIME_TYPE_VND_WAVE, this.AUDIO_MIME_TYPE_WEBM];
        },

        get AvailableVideoMimeTypes() {
            return [this.VIDEO_MIME_TYPE_MPEG, this.VIDEO_MIME_TYPE_MP4, this.VIDEO_MIME_TYPE_OGG, this.VIDEO_MIME_TYPE_QUICKTIME, this.VIDEO_MIME_TYPE_WEBM, this.VIDEO_MIME_TYPE_XMSWMV, this.VIDEO_MIME_TYPE_FLV, this.VIDEO_MIME_TYPE_XFLV, this.VIDEO_MIME_TYPE_3GP, this.VIDEO_MIME_TYPE_3GPP, this.VIDEO_MIME_TYPE_3GPP2];
        },

        get AvailableMediaTypesByMimeType() {
            var _this = this;

            var types = this.AvailableAudioMimeTypes.concat(this.AvailableVideoMimeTypes);

            return _.reduce(types, function (list, mime) {
                var type = mime.split('/')[0].trim();

                if (type && _this.AvailableMediaTypes.indexOf(type) >= 0) {
                    list[mime] = type;
                }

                return list;
            }, {});
        },

        get AvailableTypesByMimeType() {
            var types = _.invert(Skyload.AvailableMediaTypesByType);

            return _.reduce(this.AvailableMediaTypesByMimeType, function (list, mediaType, mimeType) {
                list[mimeType] = types[mediaType];

                return list;
            }, {});
        },

        get AvailableSource() {
            return [this.SOURCE_VIMEO, this.SOURCE_YOUTUBE, this.SOURCE_YANDEX, this.SOURCE_PLADFORM, this.SOURCE_SOUNDCLOUD, this.SOURCE_ODNOKLASSNIKI, this.SOURCE_VK, this.SOURCE_FACEBOOK, this.SOURCE_TIKTOK];
        },

        get AvailableLibs() {
            var libs = {};

            libs[this.SOURCE_VIMEO] = this.LIB_VIMEO;
            libs[this.SOURCE_YOUTUBE] = this.LIB_YOUTUBE;
            libs[this.SOURCE_YANDEX] = this.LIB_YANDEX;
            libs[this.SOURCE_PLADFORM] = this.LIB_PLADFORM;
            libs[this.SOURCE_SOUNDCLOUD] = this.LIB_SOUNDCLOUD;
            libs[this.SOURCE_ODNOKLASSNIKI] = this.LIB_ODNIKLASSNIKI;
            libs[this.SOURCE_VK] = this.LIB_VK;
            libs[this.SOURCE_FACEBOOK] = this.LIB_FACEBOOK;
            libs[this.SOURCE_TIKTOK] = this.LIB_TIKTOK;

            return libs;
        },

        get AvailablePopupStates() {
            return [this.POPUP_STATE_DEFAULT, this.POPUP_STATE_DOWNLOAD, this.POPUP_STATE_EMPTY, this.POPUP_STATE_YOUTUBE, this.POPUP_STATE_SKYLOAD];
        },

        IsAvailableResource: function IsAvailableResource(source) {
            return source in this.AvailableLibs && this.AvailableLibs[source] in this;
        },

        CallProcedure: function CallProcedure(source, params) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                if (_this2.IsAvailableResource(source)) {
                    if (!_.isArray(params)) {
                        params = _.values(params) || [];
                    }

                    var method = _this2[_this2.AvailableLibs[source]];
                    var callback = function callback(model) {
                        if (_.isObject(model)) {
                            resolve(model);
                        } else {
                            reject(new Error('Callback model is not object'));
                        }
                    };

                    if (method) {
                        params.push(callback);
                        method.Call.apply(method, params);
                    } else {
                        throw new Error('Method not found');
                    }
                } else {
                    throw new Error('Resource is not available');
                }
            });
        },

        Download: function Download(model, params) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                params = _.extend({
                    index: model.get('index'),
                    source: model.get('source')
                }, params || {});

                _this3.SendMessageFromContentToBackground({
                    method: 'download',
                    namespace: model.getType(),
                    index: model.get('index'),
                    model: model.getJSON(),
                    params: params
                }, function (response) {
                    try {
                        if (response.code === 0) {
                            var download = response.model;

                            if ('id' in response) {
                                model.setDownloadId(download.id, 'id' in params ? params.id : null);
                            }

                            resolve(download);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        },

        Models: {},
        Collections: {},
        Views: {},
        Environment: null,

        getLocale: function getLocale(key, style) {
            var locale = '';

            try {
                locale = chrome.i18n.getMessage(key) || '';
            } catch (e) {
                locale = '';
            }

            if ('Lang' in this) {
                locale = Skyload.Lang.get(key) || locale;
            }

            switch (style) {
                case this.LOCALE_STYLE_UPPER_CASE:
                    locale = locale.toUpperCase();

                    break;
                case this.LOCALE_STYLE_LOWER_CASE:
                    locale = locale.toLowerCase();

                    break;
                case this.LOCALE_STYLE_FIRST_UPPER_CASE:
                    locale = Skyload.Methods.FirstUpperCase(locale);

                    break;
            }

            return locale;
        },
        getCountLocale: function getCountLocale(num, dep, style) {
            num = parseInt(num);

            if (!_.isArray(dep) || !dep.length) {
                return '';
            }

            var key = void 0,
                i = parseInt(_.last(num.toString().split('')));

            if (i == 1 && (num < 10 || num >= 20) && i == 1) {
                key = dep[0];
            } else if (i >= 2 && i <= 4 && (num < 10 || num >= 20)) {
                key = dep[1] || dep[0];
            } else {
                key = dep[2] || dep[1] || dep[0];
            }

            return this.getLocale(key, style);
        },
        getCountLocaleByType: function getCountLocaleByType(count, type, style) {
            switch (type) {
                case this.TYPE_SOUND:
                    type = this.getCountLocale(count, ['audio_1', 'audio_2', 'audio_3'], style);

                    break;
                case this.TYPE_VIDEO:
                    type = this.getCountLocale(count, ['video', 'video_1'], style);

                    break;
                case this.TYPE_MIXED:
                default:
                    type = this.getCountLocale(count, ['file', 'file_2', 'files'], style);

                    break;
            }

            return type;
        },
        getLink: function getLink(path) {
            return chrome.extension.getURL(path);
        },
        getDetails: function getDetails() {
            var details = undefined;

            details = chrome.app.getDetails();

            return details || {
                id: null,
                version: 0,
                current_locale: 'en',
                default_locale: 'en',
                content_scripts: [],
                homepage_url: 'http://skyload.io'
            };
        },
        getID: function getID() {
            return this.getDetails().id;
        },
        getVersion: function getVersion() {
            return this.getDetails().version;
        },
        getCurrentLocale: function getCurrentLocale() {
            var locale = localStorage.getItem('lang') || this.getDetails().current_locale;

            if ('Lang' in this) {
                locale = Skyload.Lang.getLocale() || locale;
            }

            return locale;
        },
        setLog: function setLog() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var params = ['Skyload'].concat(_.reduce(args, function (memo, item) {
                return memo.concat(['->', item]);
            }, []));

            console.info.apply(console, params);

            return undefined;
        },
        isURL: function isURL(string) {
            if (typeof string !== 'string') {
                return false;
            }

            var protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

            var localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
            var nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

            var match = string.match(protocolAndDomainRE);

            if (!match) {
                return false;
            }

            var everythingAfterProtocol = match[1];

            if (!everythingAfterProtocol) {
                return false;
            }

            if (localhostDomainRE.test(everythingAfterProtocol) || nonLocalhostDomainRE.test(everythingAfterProtocol)) {
                return true;
            }

            return false;
        },
        isAvailableURL: function isAvailableURL(url) {
            if (!this.isURL(url)) {
                return false;
            }

            var parse = urlParser(url);

            return _.isString(parse.protocol) && parse.protocol.indexOf('http') === 0;
        },
        parseURL: function parseURL(str) {
            var o = {
                strictMode: false,
                key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
                q: {
                    name: "queryKey",
                    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
                },
                parser: {
                    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
                }
            };

            var m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
                uri = {},
                i = 14;
            while (i--) {
                uri[o.key[i]] = m[i] || "";
            }var retArr = {};
            if (uri.protocol !== '') retArr.scheme = uri.protocol;
            if (uri.host !== '') retArr.host = uri.host;
            if (uri.port !== '') retArr.port = uri.port;
            if (uri.user !== '') retArr.user = uri.user;
            if (uri.password !== '') retArr.pass = uri.password;
            if (uri.path !== '') retArr.path = uri.path;
            if (uri.query !== '') retArr.query = uri.query;
            if (uri.anchor !== '') retArr.fragment = uri.anchor;
            return retArr;
        },

        OpenTab: function OpenTab(url) {
            var active = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            return new Promise(function (resolve, reject) {
                try {
                    chrome.tabs.create({ url: url, active: active }, resolve);
                } catch (e) {
                    reject(e);
                }
            });
        },
        GetTab: function GetTab(id) {
            return new Promise(function (resolve, reject) {
                try {
                    chrome.tabs.get(id, function (details) {
                        if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                            reject(new Error('Get tab id = ' + id + ' error: ' + chrome.runtime.lastError.message));
                        } else {
                            resolve(details);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        },
        FindTabs: function FindTabs(query) {
            return new Promise(function (resolve, reject) {
                try {
                    chrome.tabs.query(query, function (tabs) {
                        if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                            reject(new Error('Find tab error: ' + chrome.runtime.lastError.message));
                        } else {
                            resolve(tabs);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        },
        FindFirstTab: function FindFirstTab(query) {
            return this.FindTabs(query).then(function (tabs) {
                var tab = tabs[0];

                if (_.isEmpty(tab)) {
                    return null;
                }

                return tab;
            });
        },
        GetFrame: function GetFrame(tabId, frameId) {
            return new Promise(function (resolve, reject) {
                try {
                    chrome.webNavigation.getFrame({
                        tabId: tabId,
                        frameId: frameId
                    }, function (details) {
                        if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                            reject(new Error('Get frame tab id = ' + tabId + ' and frame id = ' + frameId + ' error: ' + chrome.runtime.lastError.message));
                        } else {
                            resolve(details);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        },
        GetSelectedTab: function GetSelectedTab() {
            return new Promise(function (resolve, reject) {
                try {
                    chrome.tabs.getSelected(null, function (details) {
                        if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                            reject(new Error('Get selected tab error: ' + chrome.runtime.lastError.message));
                        } else {
                            resolve(details);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        },
        GetAllFramesOnTab: function GetAllFramesOnTab(id) {
            var _this4 = this;

            var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (id < 0) {
                return Promise.reject(new Error('Id must be >= 0'));
            }

            var getAllFrames = function getAllFrames() {
                return new Promise(function (resolve, reject) {
                    try {
                        chrome.webNavigation.getAllFrames({ tabId: id }, function (frames) {
                            if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                                reject(new Error('Get all frames on tab id = ' + id + ' error: ' + chrome.runtime.lastError.message));
                            } else {
                                resolve(frames);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            };

            return getAllFrames().then(function (frames) {
                if (_.isNull(frames)) {
                    return _this4.GetTab(id).then(function (tab) {
                        return [{
                            id: tab.id,
                            url: tab.url,
                            frameId: tab.frameId || 0
                        }];
                    });
                } else if (_.isArray(frames)) {
                    return frames;
                }

                throw new Error('Get all frames error');
            }).then(function (frames) {
                if (strict) {
                    var hosts = ['player.vimeo.com', 'w.soundcloud.com', 'youtube.com'];

                    return frames.filter(function (_ref) {
                        var frameId = _ref.frameId,
                            url = _ref.url;

                        if (!_this4.isURL(url)) {
                            return false;
                        }

                        if (frameId === 0) {
                            return true;
                        }

                        var parse = urlParser(url);

                        if (!_.isString(parse.host) || parse.host.length === 0) {
                            return false;
                        }

                        var hasHost = _.some(hosts, function (host) {
                            return parse.host.indexOf(host) >= 0;
                        });

                        return _.isString(parse.protocol) && parse.protocol.indexOf('http') === 0 && hasHost;
                    });
                }

                return frames;
            });
        },
        GetAllFramesOnSelectedTab: function GetAllFramesOnSelectedTab() {
            var _this5 = this;

            var strict = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            return this.GetSelectedTab().then(function (tab) {
                if (_.isObject(tab) && 'id' in tab) {
                    return _this5.GetAllFramesOnTab(tab.id, strict).then(function (frames) {
                        return { tab: tab, frames: frames };
                    });
                }

                throw new Error('Tab must me object and has id');
            });
        },

        SetUninstallURL: function SetUninstallURL(url, callback) {
            chrome.runtime.setUninstallURL(url, callback);
        },

        SendMessageFromContentToBackground: function SendMessageFromContentToBackground(request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_BACKGROUND,
                from: this.ENVIRONMENT_CONTENT
            }, _.isObject(request) ? request : {});

            return this.SendMessage(request, callback);
        },
        SendMessageFromBackgroundToPopupAction: function SendMessageFromBackgroundToPopupAction(request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_POPUP,
                from: this.ENVIRONMENT_BACKGROUND
            }, _.isObject(request) ? request : {});

            return this.SendRuntimeMessage(request, callback);
        },
        SendRuntimeMessageFromBackgroundToContent: function SendRuntimeMessageFromBackgroundToContent(request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_CONTENT,
                from: this.ENVIRONMENT_BACKGROUND
            }, _.isObject(request) ? request : {});

            return this.SendRuntimeMessage(request, callback);
        },
        SendMessageFromBackgroundToContentFrame: function SendMessageFromBackgroundToContentFrame(tab_id, frame_id, request, callback, options) {
            request = _.extend({
                to: this.ENVIRONMENT_CONTENT,
                from: this.ENVIRONMENT_BACKGROUND
            }, _.isObject(request) ? request : {});

            return this.SendContentFrameMessage(tab_id, frame_id, request, callback, options);
        },
        SendMessageFromBackgroundToContent: function SendMessageFromBackgroundToContent(id, request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_CONTENT,
                from: this.ENVIRONMENT_BACKGROUND
            }, _.isObject(request) ? request : {});

            this.SendContentMessage(id, request, callback);

            return this;
        },
        SendMessageFromPopupActionToContent: function SendMessageFromPopupActionToContent(id, request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_CONTENT,
                from: this.ENVIRONMENT_POPUP
            }, _.isObject(request) ? request : {});

            this.SendContentMessage(id, request, callback);

            return this;
        },
        SendMessageFromPopupActionToBackground: function SendMessageFromPopupActionToBackground(request, callback) {
            request = _.extend({
                to: this.ENVIRONMENT_BACKGROUND,
                from: this.ENVIRONMENT_POPUP
            }, _.isObject(request) ? request : {});

            return this.SendMessage(request, callback);
        },
        SendRuntimeMessage: function SendRuntimeMessage(request, callback) {
            chrome.runtime.sendMessage(request, callback);

            return this;
        },
        SendMessage: function SendMessage(request, callback) {
            var complete = false;

            chrome.extension.sendMessage(request, callback);

            complete = true;

            return this;
        },
        SendContentMessage: function SendContentMessage(id, request, callback) {
            var complete = false;

            chrome.tabs.sendMessage(id, request, callback);

            complete = true;

            return this;
        },
        SendContentFrameMessage: function SendContentFrameMessage(tabId, frameId, request, callback) {
            var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
            var _options$onError = options.onError,
                onError = _options$onError === undefined ? function () {} : _options$onError;


            var complete = false;

            chrome.tabs.sendMessage(tabId, request, { frameId: frameId }, function () {
                if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                    onError();

                    Skyload.setLog('SendContentFrameMessage error', chrome.runtime.lastError.message);
                }

                callback.apply(undefined, arguments);
            });

            complete = true;

            return this;
        },

        ExecuteScript: function ExecuteScript(id, details) {
            return new Promise(function (resolve, reject) {
                chrome.tabs.executeScript(id, details, function () {
                    if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                        reject(new Error(JSON.stringify(details) + ' - ' + chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        },
        InsertCSS: function InsertCSS(id, details) {
            return new Promise(function (resolve, reject) {
                chrome.tabs.insertCSS(id, details, function () {
                    if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                        reject(new Error(JSON.stringify(details) + ' - ' + chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        },

        OnMessageListener: function OnMessageListener(callback) {
            var complete = false;

            chrome.extension.onMessage.addListener(callback);

            complete = true;

            return this;
        },
        OnRuntimeMessageListener: function OnRuntimeMessageListener(callback) {
            chrome.runtime.onMessage.addListener(callback);
            return this;
        },
        OnContentMessageListener: function OnContentMessageListener(_callback) {
            var _this6 = this;

            return this.OnMessageListener(function (request, sender, callback) {
                try {
                    if (_.isObject(request)) {
                        if (request.to === _this6.ENVIRONMENT_CONTENT) {
                            _callback(request, sender, callback);
                        } else {
                            throw new Error('Request not to content');
                        }
                    } else {
                        throw new Error('Request to content must be object');
                    }
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }

                return true;
            });
        },
        OnBackgroundMessageListener: function OnBackgroundMessageListener(_callback) {
            var _this7 = this;

            return this.OnMessageListener(function (request, sender, callback) {
                try {
                    if (_.isObject(request)) {
                        if (request.to === _this7.ENVIRONMENT_BACKGROUND) {
                            _callback(request, sender, callback);
                        } else {}
                    } else {
                        throw new Error('Request to background must be object');
                    }
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }

                return true;
            });
        },
        OnRuntimeConnectListener: function OnRuntimeConnectListener(callback) {
            chrome.runtime.onConnect.addListener(callback);
            return this;
        },
        OnRequestListener: function OnRequestListener(callback) {
            chrome.webNavigation.onCompleted.addListener(callback);
            return this;
        },
        OnInstalledListener: function OnInstalledListener(callback) {
            chrome.runtime.onInstalled.addListener(callback);
            return this;
        },
        OnTabUpdateListener: function OnTabUpdateListener(callback) {
            chrome.tabs.onUpdated.addListener(callback);
            return this;
        },
        OnTabRemovedListener: function OnTabRemovedListener(callback) {
            chrome.tabs.onRemoved.addListener(callback);
            return this;
        },
        OnTabReplacedListener: function OnTabReplacedListener(callback) {
            chrome.tabs.onReplaced.addListener(callback);
            return this;
        },
        OnTabDetachedListener: function OnTabDetachedListener(callback) {
            chrome.tabs.onDetached.addListener(callback);
            return this;
        },
        OnTabAttachedListener: function OnTabAttachedListener(callback) {
            chrome.tabs.onAttached.addListener(callback);
            return this;
        },
        OnTabSomeChangedListener: function OnTabSomeChangedListener(callback) {
            return this.OnTabUpdateListener(callback).OnTabRemovedListener(callback).OnTabReplacedListener(callback).OnTabDetachedListener(callback).OnTabAttachedListener(callback);
        },

        OnHeadersReceivedListener: function OnHeadersReceivedListener(callback) {
            chrome.webRequest.onHeadersReceived.addListener(callback, {
                urls: ['<all_urls>']
            }, ['responseHeaders']);

            return this;
        },
        OnCommittedWebNavigationListener: function OnCommittedWebNavigationListener(callback) {
            chrome.webNavigation.onCommitted.addListener(callback);
            return this;
        },

        OnCreatedDownloadListener: function OnCreatedDownloadListener(callback) {
            chrome.downloads.onCreated.addListener(callback);
            return this;
        },
        OnChangedDownloadListener: function OnChangedDownloadListener(callback) {
            chrome.downloads.onChanged.addListener(callback);
            return this;
        },
        OnClickedNotificationsListener: function OnClickedNotificationsListener(callback) {
            chrome.notifications.onClicked.addListener(callback);
            return this;
        },
        OnButtonClickedNotificationsListener: function OnButtonClickedNotificationsListener(callback) {
            chrome.notifications.onButtonClicked.addListener(callback);
            return this;
        },
        OnClosedNotificationsListener: function OnClosedNotificationsListener(callback) {
            chrome.notifications.onClosed.addListener(callback);
            return this;
        },

        SetPopup: function SetPopup(id, popup) {
            if (id <= 0) {
                return this;
            }

            if (_.isString(popup) && popup.length) {
                popup = '#' + popup;
            } else {
                popup = '';
            }

            chrome.browserAction.setPopup({
                tabId: id,
                popup: 'popup/app.html' + popup
            });

            return this;
        },
        GetPopupState: function GetPopupState(id) {
            var _this8 = this;

            return new Promise(function (resolve, reject) {
                chrome.browserAction.getPopup({ tabId: id }, function (url) {
                    if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message, _this8.ERROR_CHROME_LAST_ERROR));
                    } else {
                        var state = _this8.parseURL(url).fragment;

                        if (_.include(_this8.AvailablePopupStates, state)) {
                            resolve(state);
                        } else {
                            resolve(_this8.POPUP_STATE_DEFAULT);
                        }
                    }
                });
            });
        },
        SetPopupTitle: function SetPopupTitle(id, title) {
            chrome.browserAction.setTitle({
                tabId: id,
                title: title
            });

            return this;
        },
        SetDefaultPopup: function SetDefaultPopup(id) {
            return this.SetPopup(id);
        },
        SetPopupAsDownload: function SetPopupAsDownload(id) {
            return this.SetPopup(id, this.POPUP_STATE_DOWNLOAD);
        },
        SetPopupAsEmpty: function SetPopupAsEmpty(id) {
            return this.SetPopup(id, this.POPUP_STATE_EMPTY);
        },
        SetBadgeText: function SetBadgeText(id, text) {
            if (_.isNumber(text)) {
                text = parseInt(text);

                if (text >= 1000) {
                    text = '999+';
                } else if (text <= 0) {
                    text = '';
                }
            }

            chrome.browserAction.setBadgeText({
                text: text.toString(),
                tabId: id
            });

            return this;
        },
        SetBadgeBackgroundColor: function SetBadgeBackgroundColor(id, color) {
            chrome.browserAction.setBadgeBackgroundColor({
                tabId: id,
                color: color
            });

            return this;
        },
        GetBadgeText: function GetBadgeText(id) {
            var _this9 = this;

            return new Promise(function (resolve, reject) {
                chrome.browserAction.getBadgeText({ tabId: id }, function (text) {
                    if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message, _this9.ERROR_CHROME_LAST_ERROR));
                    } else {
                        resolve(text);
                    }
                });
            });
        },

        Analytics: function Analytics(category, action, label, value) {
            return this.SendMessageFromContentToBackground({
                method: 'analytics',
                category: category,
                action: action,
                label: label,
                value: value
            });
        },
        Storage: function Storage(key, value, action, type) {
            var _this10 = this;

            return new Promise(function (resolve, reject) {
                try {
                    if (_.isUndefined(action)) {
                        action = value ? 'set' : 'get';
                    }

                    if (_.isUndefined(type)) {
                        type = 'session';
                    }

                    if (!key || !key.length) {
                        throw new Error('Empty key');
                    }

                    if (['get', 'set', 'remove'].indexOf(action) < 0) {
                        throw new Error('Wrong action');
                    }

                    if (['session', 'local'].indexOf(type) < 0) {
                        throw new Error('Wrong type');
                    }

                    if (action === 'set' && !value) {
                        throw new Error('Value must be set');
                    }

                    if (action === 'set') {
                        if (_.isObject(value) || _.isArray(value)) {
                            value = JSON.stringify(value);
                        }
                    }

                    _this10.SendMessageFromContentToBackground({
                        method: 'storage',
                        type: type,
                        key: key,
                        data: value,
                        action: action + 'Item'
                    }, function (response) {
                        if (response.code === 0) {
                            try {
                                resolve(JSON.parse(response.data));
                            } catch (e) {
                                resolve(response.data);
                            }
                        } else {
                            reject(new Error('Response error - ' + response.message));
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }
    };

    return Skyload;
});