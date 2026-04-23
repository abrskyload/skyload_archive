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

define('tabs', ['stream', 'backbone', 'md5', 'underscore', 'jquery', 'url_parser'], function (Stream, Backbone, md5, _, $, urlParser) {

    var TabModel = Backbone.Model.extend({
        defaults: {
            title: 'Title',
            id: null,
            url: null,
            icon: null,
            download_count: 0,
            found_count: 0,
            popup_state: Skyload.POPUP_STATE_DEFAULT,
            parse_sound: '',
            parse_video: ''
        },
        idAttribute: 'id',
        isCompareFoundCount: true,
        isComparePopupState: true,
        validate: function validate(attrs) {
            if (!_.isNumber(attrs.id)) {
                return 'ID not number';
            }
        },
        compare: function compare() {
            this.isCompareFoundCount = true;
            this.isComparePopupState = true;
            return this;
        },
        getId: function getId() {
            return this.get(this.idAttribute);
        },
        setPopupState: function setPopupState(state) {
            var _this = this;

            this.set('popup_state', state);

            if (this.isComparePopupState) {
                Skyload.GetPopupState(this.getId()).then(function (_state) {
                    if (state !== _state) {
                        _this.trigger('change:popup_state', _this, state);
                    }

                    _this.isComparePopupState = false;
                }).catch(function (e) {
                    Skyload.setLog('Profile', 'Error', e);
                });
            }

            return this;
        },
        setDownloadCount: function setDownloadCount(count) {
            if (count > 0) {
                this.set('found_count', 0);
            }

            return this.set('download_count', count);
        },
        setFoundCount: function setFoundCount(count) {
            var _this2 = this;

            this.set('found_count', count);

            if (this.isCompareFoundCount === true && this.get('download_count') === 0) {
                Skyload.GetBadgeText(this.getId()).then(function (text) {
                    var _count = parseInt(text);

                    if (_.isNumber(_count) && !_.isNaN(_count)) {
                        if (_count !== count) {
                            _this2.trigger('change:found_count', _this2, count);
                        }
                    }

                    _this2.isCompareFoundCount = false;
                }).catch(function (e) {
                    Skyload.setLog('Profile', 'Error', e);
                });
            }

            return this;
        },
        addParseIndex: function addParseIndex(type, index) {
            var collection = this.getParseIndexes(type);

            if (collection.indexOf(index) < 0) {
                var key = 'parse_' + type;

                collection.push(index);
                this.set(key, collection.join(','));
            }

            return this;
        },
        removeParseIndex: function removeParseIndex(type, index) {
            var collection = _.clone(this.getParseIndexes(type));
            var position = collection.indexOf(index);

            if (position >= 0) {
                var key = 'parse_' + type;
                delete collection[position];

                this.set(key, collection.join(','));
            }

            return this;
        },
        getParseIndexes: function getParseIndexes(type) {
            var key = 'parse_' + type;
            var collection = this.get(key) || [];

            if (_.isString(collection) && collection.length) {
                collection = collection.split(',');
            } else {
                collection = [];
            }

            return collection;
        },
        getParseCount: function getParseCount() {
            var _this3 = this;

            return _.chain(Skyload.AvailableTypes).map(function (type) {
                var indexes = _this3.getParseIndexes(type);

                if (indexes.length) {
                    var collectionName = Skyload.Methods.FirstUpperCase(type);
                    var collection = Skyload.Cache[collectionName];

                    if (collection instanceof Backbone.Collection) {
                        return _.chain(indexes).reduce(function (list, index) {
                            var model = collection.get(index);

                            if (model instanceof Backbone.Model) {
                                var item = model.getContentModel();

                                if (_.isArray(item)) {
                                    list = list.concat(item);
                                } else if (_.isObject(item)) {
                                    list.push(item);
                                }
                            }

                            return list;
                        }, []).compact().value();
                    }
                }

                return [];
            }).reduce(function (list, items) {
                return list.concat(items);
            }, []).uniq(false, function (model) {
                return model.stream ? model.id : model.file;
            }).value().length;
        },
        clearParseIndexes: function clearParseIndexes(clearStreamCreate) {
            var _this4 = this;

            if (_.isUndefined(clearStreamCreate)) {
                clearStreamCreate = true;
            }

            var soundIndexes = _.filter(this.getParseIndexes(Skyload.TYPE_SOUND), function (index) {
                var model = Skyload.Cache.Sound.get(index);

                if (model instanceof Backbone.Model) {
                    if (model.isStreamCreate() && clearStreamCreate === false) {
                        return true;
                    } else {
                        var url = model.get('play');
                        var stream = model.getStream();

                        if (stream instanceof Stream) {
                            stream.stop();
                        } else if (_.isString(url) && url.substr(0, 4) === 'blob') {
                            URL.revokeObjectURL(url);
                        }
                    }
                }

                return false;
            });

            this.set('parse_sound', '').set('parse_video', '');

            if (soundIndexes.length) {
                _.each(soundIndexes, function (index) {
                    return _this4.addParseIndex(Skyload.TYPE_SOUND, index);
                });
            }

            return this.compare();
        }
    });

    var TabCollection = Backbone.Collection.extend({
        model: TabModel
    });

    var ParsePageModel = Backbone.Model.extend({
        defaults: {
            'id': null,

            'url': null,
            'icon': null,
            'title': null,
            'site_name': null,
            'image': null,

            'audio_duration': 0,

            'videos': null,
            'video_width': null,
            'video_height': null,
            'video_duration': 0,

            'wait': true,
            'wait_iteration': 0,

            'dt': _.now(),
            'new': true
        },
        idAttribute: 'id',
        getImageUrl: function getImageUrl(row) {
            var url = this.parseUrl();
            var image = this.get(row);

            if (_.isString(image) && image.length) {
                if (image.indexOf('//:') === 0) {
                    image = url.scheme + image;
                } else if (image.indexOf(url) < 0 && image.indexOf('http') < 0) {
                    if (image.indexOf('/') !== 0) {
                        image = '/' + image;
                    }

                    image = url.scheme + '://' + url.host + image;
                }
            }

            if (!Skyload.isURL(image)) {
                return null;
            }

            return image;
        },
        getVideoQuality: function getVideoQuality() {
            if (this.get('video_width') && this.get('video_height')) {
                return [this.get('video_width'), this.get('video_height')].join('x');
            }

            return null;
        },
        parseUrl: function parseUrl() {
            return Skyload.parseURL(this.get('url'));
        },
        isNew: function isNew() {
            return this.get('new');
        },
        isAwait: function isAwait() {
            return this.get('wait');
        },
        addAwaitIteration: function addAwaitIteration() {
            return this.set('wait_iteration', this.get('wait_iteration') + 1);
        },
        expiredAwaitTime: function expiredAwaitTime() {
            return this.get('wait_iteration') >= 5;
        },
        expiredLifeTime: function expiredLifeTime() {
            return _.now() > this.get('dt') + 5 * 60000;
        }
    });

    var ParsePageCollection = Backbone.Collection.extend({
        model: ParsePageModel
    });

    var FileModel = Backbone.Model.extend({
        defaults: {
            tab_id: 0,
            frame_id: 0,
            initiator: null,

            id: null,
            url: null,
            size: 0,
            type: null,
            name: null,
            format: null,
            mime_type: null,
            duration: 0,
            quality: null,

            source: Skyload.SOURCE_WORLD_WIDE,
            stream: false,
            check_content: false
        },
        idAttribute: 'id',
        parse: function parse(attr) {
            if ('url' in attr) {
                attr.id = md5(attr.url);

                var fileNameParse = Skyload.parseURL(attr.url);

                if ('path' in fileNameParse && fileNameParse.path !== '/') {
                    var name = _.last(fileNameParse.path.split('/'));

                    if (name.includes('.')) {
                        var pies = name.split('.');

                        attr.name = _.first(pies);
                        attr.format = _.last(pies);

                        if (_.isString(attr.format) && attr.format.length) {
                            attr.format = attr.format.toLowerCase();
                        }
                    } else {
                        attr.name = name;
                    }
                } else {
                    attr.name = attr.id;
                }
            }

            if (_.isEmpty(attr.name)) {
                attr.name = Math.random().toString(36).substring(7);
            }

            if ('mime_type' in attr) {
                if (_.isArray(attr.mime_type) && attr.mime_type.length) {
                    attr.mime_type = _.first(attr.mime_type);
                }

                if (_.isString(attr.mime_type)) {
                    if (_.include([Skyload.VIDEO_MIME_TYPE_OCTET_STREAM], attr.mime_type) && _.include(['mp3'], attr.format)) {
                        attr.type = Skyload.TYPE_SOUND;
                        attr.mime_type = Skyload.AUDIO_MIME_TYPE_MP3;
                        attr.format = Skyload.AUDIO_FORMAT_MP3;
                    } else if (_.include([Skyload.VIDEO_MIME_TYPE_STREAM_APPLE, Skyload.VIDEO_MIME_TYPE_STREAM_MPEG, Skyload.VIDEO_MIME_TYPE_STREAM_DASH, Skyload.VIDEO_MIME_TYPE_OCTET_STREAM], attr.mime_type)) {
                        attr.type = Skyload.TYPE_VIDEO;
                        attr.mime_type = Skyload.VIDEO_MIME_TYPE_MP4;
                        attr.format = Skyload.VIDEO_FORMAT_MP4;
                        attr.stream = true;
                        attr.name = attr.name || 'video';
                    } else {
                        var mediaTypesByType = _.invert(Skyload.AvailableMediaTypesByType);
                        var type = Skyload.AvailableTypesByMimeType[attr.mime_type];

                        if (_.isUndefined(type)) {
                            type = _.first(attr.mime_type.split('/'));
                            type = type in mediaTypesByType ? mediaTypesByType[type] : null;
                        }

                        attr.type = type;
                    }

                    if (attr.mime_type === Skyload.AUDIO_MIME_TYPE_MPEG && (!attr.format || attr.format.length > 5)) {
                        attr.format = Skyload.AUDIO_FORMAT_MP3;
                    }
                }
            }

            if (_.isNull(attr.quality) && 'url' in attr && _.isString(attr.url) && 'type' in attr && attr.type === Skyload.TYPE_VIDEO) {
                attr.quality = _.find({
                    'sd': 'SD',
                    'hq': 'HQ',
                    'hd': 'HD'
                }, function (value, key) {
                    return attr.url.indexOf(key) >= 0;
                });
            }

            if (_.isEmpty(attr.format)) {
                switch (attr.mime_type) {
                    case Skyload.VIDEO_MIME_TYPE_MP4:
                        attr.format = Skyload.VIDEO_FORMAT_MP4;

                        break;
                }
            }

            if ('url' in attr && 'mime_type' in attr && _.isString(attr.url) && attr.mime_type === Skyload.APP_MIME_TYPE_JSON && attr.url.indexOf('play.google.com/music/mplay') >= 0) {
                attr.type = Skyload.TYPE_SOUND;
                attr.format = Skyload.AUDIO_FORMAT_MP3;
                attr.mime_type = Skyload.AUDIO_MIME_TYPE_MP3;
                attr.source = Skyload.SOURCE_GOOGLE_MUSIC;
                attr.stream = true;
                attr.check_content = true;
            }

            if ('url' in attr && 'mime_type' in attr && _.isString(attr.url) && attr.mime_type === Skyload.AUDIO_MIME_TYPE_MPEG && (attr.url.indexOf('.deezer.com/') >= 0 || attr.url.indexOf('.dzcdn.net/') >= 0)) {
                attr.type = Skyload.TYPE_SOUND;
                attr.format = Skyload.AUDIO_FORMAT_MP3;
                attr.mime_type = Skyload.AUDIO_MIME_TYPE_MP3;
                attr.source = Skyload.SOURCE_DEEZER;
                attr.check_content = true;
            }

            if ('url' in attr && 'format' in attr && _.isString(attr.url) && attr.format === Skyload.STREAM_PLAYLIST_FORMAT_M3U8 && attr.url.indexOf('media.sndcdn.com') >= 0) {
                attr.type = Skyload.TYPE_SOUND;
                attr.format = Skyload.AUDIO_FORMAT_MP3;
                attr.mime_type = Skyload.AUDIO_MIME_TYPE_MP3;
                attr.source = Skyload.SOURCE_SOUNDCLOUD;
                attr.check_content = true;
                attr.stream = true;
            }

            return attr;
        },
        validate: function validate(attr) {
            if (!attr.url) {
                return 'Wrong url';
            }

            if (!/^(video|audio)\//.test(attr.mime_type)) {
                return 'Wrong mime type';
            }

            if (/^[^/]+\/\/([^/]+\.)?googlevideo\.|^[^/]+\/\/([^/]+\.)?youtube\./.test(attr.url)) {
                return 'Google video';
            }

            if (attr.url.includes('akamaized.net') && _.isString(attr.initiator) && attr.initiator.includes('vimeo.com')) {
                return 'Vimeo video';
            }

            if (attr.url.includes('fbcdn.net') && _.isString(attr.initiator) && attr.initiator.includes('facebook.com')) {
                return 'Facebook video';
            }

            if (attr.url.includes('mycdn.me') && _.isString(attr.initiator) && attr.initiator.includes('ok.ru')) {
                return 'OK CDN';
            }

            if (attr.url.includes('storage.yandex.net') && _.isString(attr.initiator) && attr.initiator.includes('music.yandex')) {
                return 'Yandex music';
            }

            if (attr.url.includes('media.sndcdn.com') && attr.stream !== true) {
                return 'SoundCloud sound';
            }

            if (/vkuservideo.net|vkuseraudio.net|vk.com/.test(attr.url) && _.isString(attr.initiator) && attr.initiator.includes('vk.com')) {
                return 'VK audio or video';
            }

            if (attr.mime_type === Skyload.VIDEO_MIME_TYPE_XF4F) {
                return 'Piece of flash video';
            }

            if (Skyload.AvailableTypes.indexOf(attr.type) < 0) {
                return 'Wrong type';
            }

            if (!attr.name) {
                return 'Empty name';
            }

            if (!attr.format) {
                return 'Empty format';
            }

            if (attr.name && attr.format && attr.name.toLowerCase() === attr.format.toLowerCase()) {
                return 'Wrong format';
            }

            if (_.include([Skyload.VIDEO_FORMAT_DASH, Skyload.VIDEO_FORMAT_TS], attr.format)) {
                return 'Piece of video stream';
            }
        },
        getPageUrl: function getPageUrl() {
            var _this5 = this;

            var tab = null;

            if (this.get('frame_id') > 0) {
                tab = Skyload.GetFrame(this.get('tab_id'), this.get('frame_id')).catch(function () {
                    return Skyload.GetTab(_this5.get('tab_id'));
                });
            } else {
                tab = Skyload.GetTab(this.get('tab_id'));
            }

            return tab.then(function (details) {
                if (!_.isObject(details)) {
                    throw new Error('Tab must be object');
                }

                var url = details.url;


                if (!Skyload.isURL(url)) {
                    throw new Error('Wrong url ' + url);
                }

                if (_this5.get('url').indexOf('googleusercontent.com/videoplayback') >= 0 && url.indexOf('play.google.com/music') >= 0) {
                    throw new Error('Have parser for Google Music');
                }

                if (url.indexOf('vk.com') >= 0 && _this5.isStream()) {
                    _this5.set('source', Skyload.SOURCE_VK).set('check_content', true);
                }

                if (_this5.get('url').indexOf('tidal.com') >= 0 && url.indexOf('wimpmusic.com') >= 0) {
                    _this5.set('source', Skyload.SOURCE_WIMP).set('check_content', true);
                }

                return url;
            });
        },
        isStream: function isStream() {
            return this.get('stream');
        },
        checkContent: function checkContent() {
            return this.get('check_content');
        },
        getStreamPlaylist: function getStreamPlaylist() {
            var _this6 = this;

            if (!this.isStream()) {
                return Promise.reject(new Error('File not stream playlist'));
            }

            return new Promise(function (resolve, reject) {
                Skyload.Methods.XHR(_this6.get('url'), function (response) {
                    try {
                        response = response.response;

                        if (response.status < 200 || response.status > 400 || response.status === 204) {
                            throw new Error(response.statusText);
                        }

                        resolve(response.responseText);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).then(function (text) {
                var fileURL = _this6.get('url');

                if (!(_.isString(text) && text.length)) {
                    throw new Error('Response text not valid');
                }

                switch (_this6.get('source')) {
                    case Skyload.SOURCE_GOOGLE_MUSIC:
                        var json = JSON.parse(text);

                        if ('trackDurationMs' in json) {
                            _this6.set('duration', json.trackDurationMs);
                        }

                        if ('urls' in json && _.isArray(json.urls)) {
                            return json.urls;
                        }

                        throw new Error('Empty Google Music playlist');

                    default:
                        var ext = Skyload.Methods.GetFileExt(fileURL);

                        if (ext === Skyload.STREAM_PLAYLIST_FORMAT_MPD) {
                            throw new Error('Not support playlist yet');
                        } else {
                            text = text.split(/\r\n|\r|\n/);

                            if (_.first(text) !== '#EXTM3U') {
                                throw new Error('Bad response for parse playlist');
                            }

                            var url = urlParser(_this6.get('url'));

                            var path = url.pathname;

                            if (!_.isString(path)) {
                                throw new Error('Empty path to create playlist item link');
                            }

                            path = path.split('/').slice(0, -1).join('/');

                            return _.chain(text).map(function (item) {
                                if (item.indexOf('.' + Skyload.VIDEO_FORMAT_TS) >= 0 || item.indexOf('.' + Skyload.AUDIO_FORMAT_MP3) >= 0) {
                                    if (item.substr(0, 1) === '/') {
                                        return url.protocol + '//' + url.host + item;
                                    } else if (item.substr(0, 4) === 'http') {
                                        return item;
                                    } else {
                                        return url.protocol + '//' + url.host + path + '/' + item;
                                    }
                                }
                            }).compact().value();
                        }
                }
            }).then(function (playlist) {
                if (!playlist.length) {
                    throw new Error('Empty playlist');
                }

                return playlist;
            });
        },
        findContentInfo: function findContentInfo() {
            var _this7 = this;

            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromBackgroundToContentFrame(_this7.get('tab_id'), _this7.get('frame_id'), {
                    method: 'find_content_info',
                    type: _this7.get('type'),
                    name: _this7.get('source')
                }, function (response) {
                    try {
                        if (response.code !== 0) {
                            throw new Error(response.message);
                        }

                        resolve(response.model);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    });

    var Tabs = function () {
        function Tabs() {
            var _this8 = this;

            _classCallCheck(this, Tabs);

            this.collection = new TabCollection();
            this.parsePageCollection = new ParsePageCollection();

            this.collection.on('remove', function (model) {
                model.clearParseIndexes();
            }).on('change:popup_state', function (model, state) {
                try {
                    if (_.include(Skyload.AvailablePopupStates, state)) {
                        Skyload.SetPopup(model.getId(), state);
                    } else {
                        Skyload.SetPopupAsEmpty(model.getId());
                    }

                    model.compare();
                } catch (e) {
                    Skyload.setLog('Tabs', 'On change popup state error', e);
                }
            }).on('change:download_count change:found_count', function (model) {
                try {
                    var download_count = model.get('download_count');
                    var found_count = model.get('found_count');

                    var title = Skyload.getLocale('no_files');
                    var count = '',
                        color = [0, 0, 0, 0];

                    if (download_count >= 1) {
                        title = _.template(Skyload.getLocale('popup_title_queue'))({
                            count: download_count,
                            label: Skyload.getCountLocaleByType(download_count, Skyload.TYPE_MIXED, Skyload.LOCALE_STYLE_LOWER_CASE)
                        });

                        count = download_count;
                        color = '#c90000';
                    } else if (found_count >= 1) {
                        title = Skyload.getLocale('found') + ' ' + found_count + ' ' + Skyload.getCountLocaleByType(found_count, Skyload.TYPE_MIXED, Skyload.LOCALE_STYLE_LOWER_CASE);

                        count = found_count;
                        color = [0, 181, 78, 255];
                    }

                    title = Skyload.getLocale('app_name') + ' - ' + title;

                    Skyload.SetPopupTitle(model.getId(), title).SetBadgeText(model.getId(), count).SetBadgeBackgroundColor(model.getId(), color);

                    model.compare();
                } catch (e) {
                    Skyload.setLog('Tabs', 'On change download/found count error', e);
                }
            });

            Skyload.OnTabRemovedListener(function (id) {
                _this8.collection.remove(id);
            }).OnTabUpdateListener(function (id, details) {
                var model = _this8.collection.get(id);

                if (model instanceof TabModel) {
                    if ('title' in details) {
                        model.set('title', $.trim(details.title.replace(/ +(?= )/g, '')));
                    }

                    if ('favIconUrl' in details) {
                        model.set('icon', details.favIconUrl);
                    }

                    if ('status' in details) {
                        switch (details.status) {
                            case Skyload.TAB_STATE_LOADING:
                                Skyload.GetTab(id).then(function (tab) {
                                    var realTabHost = Skyload.parseURL(tab.url).host;
                                    var modelTabHost = Skyload.parseURL(model.get('url')).host;

                                    if (realTabHost !== modelTabHost) {
                                        model.clearParseIndexes();
                                    }

                                    model.set('url', tab.url);
                                }).catch(function (e) {
                                    Skyload.setLog('Tab', 'On update tab', e);
                                });

                                break;
                        }
                    }

                    model.compare();
                    _this8.collection.trigger('change:download_count change:found_count', model);
                }
            });
        }

        _createClass(Tabs, [{
            key: 'Get',
            value: function Get(tab) {
                var _this9 = this;

                var callback = function callback(tab) {
                    var model = _this9.collection.get(tab.id);

                    if (!(model instanceof TabModel)) {
                        model = _this9.collection.add({
                            id: tab.id,
                            url: tab.url
                        });

                        if ('title' in tab) {
                            model.set('title', tab.title);
                        }
                    }

                    if (!model.isValid()) {
                        throw new Error(model.validationError);
                    }

                    return model;
                };

                if (_.isObject(tab) && 'id' in tab && 'url' in tab) {
                    return Promise.resolve(callback(tab));
                } else if (_.isNumber(tab) && tab >= 1) {
                    return Skyload.GetTab(tab).then(callback);
                }

                return Skyload.GetSelectedTab().then(callback);
            }
        }, {
            key: 'ParseRequest',
            value: function ParseRequest(request) {
                var _this10 = this;

                try {
                    var nameHeaderContentType = 'content-type';
                    var nameHeaderContentLength = 'content-length';

                    var headers = _.reduce(request.responseHeaders, function (list, item) {
                        var key = item.name.toLowerCase();
                        var value = item.value.toLowerCase();

                        if (value.indexOf(';') >= 0) {
                            value = value.split(';').map(function (v) {
                                return v.trim();
                            });
                        }

                        list[key] = value;

                        return list;
                    }, {});

                    var fileModel = new FileModel({
                        tab_id: request.tabId,
                        frame_id: request.frameId,
                        initiator: request.initiator || request.originUrl,

                        quality: 'quality' in request ? request.quality : null,

                        url: request.url,
                        size: nameHeaderContentLength in headers ? parseInt(headers[nameHeaderContentLength]) : 0,
                        mime_type: nameHeaderContentType in headers ? headers[nameHeaderContentType] : null
                    }, {
                        parse: true
                    });

                    if (fileModel.isValid()) {
                        var id = fileModel.get('id');
                        var type = fileModel.get('type');
                        var index = [Skyload.SOURCE_WORLD_WIDE, id].join('_');

                        var collectionName = Skyload.Methods.FirstUpperCase(type);
                        var collection = Skyload.Cache[collectionName];

                        if (collection instanceof Backbone.Collection) {
                            var model = collection.get(index);

                            this.Get(fileModel.get('tab_id')).then(function (tabModel) {
                                if (model instanceof Backbone.Model && !model.expiredLifeTime()) {
                                    if (!fileModel.isStream()) {
                                        switch (type) {
                                            case Skyload.TYPE_SOUND:
                                                if (fileModel.get('size') > 0) {
                                                    model.set('size', fileModel.get('size'));
                                                }

                                                model.set('play', fileModel.get('url'));

                                                break;
                                            case Skyload.TYPE_VIDEO:
                                                var videos = model.getVideo();
                                                var video = videos.get(Skyload.DEFAULT_NAME_VIDEO_ITEM);

                                                if (video instanceof Backbone.Model) {
                                                    if (fileModel.get('size') > 0) {
                                                        video.set('size', fileModel.get('size'));
                                                    }

                                                    video.set('url', fileModel.get('url'));
                                                    videos.set(video, { remove: false });

                                                    model.set('play', videos.toJSON());
                                                }

                                                break;
                                        }
                                    }

                                    tabModel.addParseIndex(type, index);
                                } else {
                                    model = {
                                        id: id,
                                        index: index,
                                        source: fileModel.get('source'),
                                        dt: _.now()
                                    };

                                    fileModel.getPageUrl().then(function (url) {
                                        return _this10.ParsePage(url);
                                    }).then(function (parsePageModel) {
                                        parsePageModel.set('title', tabModel.get('title'));

                                        if (!parsePageModel.getImageUrl('icon')) {
                                            parsePageModel.set('icon', tabModel.get('icon'));
                                        }

                                        return parsePageModel;
                                    }).then(function (parsePageModel) {
                                        var parseLimit = 20;

                                        if (fileModel.get('source') === Skyload.SOURCE_FACEBOOK) {
                                            parseLimit = 100;
                                        }

                                        if (tabModel.getParseCount() >= parseLimit) {
                                            tabModel.clearParseIndexes(false);
                                        }

                                        model = _.extend(model, {
                                            cover: parsePageModel.getImageUrl('image'),
                                            stream: fileModel.isStream(),
                                            data: {
                                                icon: parsePageModel.getImageUrl('icon'),
                                                site_name: parsePageModel.get('site_name'),
                                                format: fileModel.get('format'),
                                                stream: fileModel.isStream(),
                                                file_source: fileModel.get('source')
                                            }
                                        });

                                        switch (type) {
                                            case Skyload.TYPE_SOUND:
                                                model = _.extend(model, {
                                                    play: fileModel.get('url'),
                                                    author: parsePageModel.get('title'),
                                                    name: parsePageModel.get('site_name') + ' (' + fileModel.get('name') + ')',
                                                    size: fileModel.get('size'),
                                                    duration: parsePageModel.get('audio_duration'),
                                                    mime_type: fileModel.get('mime_type')
                                                });

                                                return new Promise(function (resolve) {
                                                    if (fileModel.checkContent()) {
                                                        return fileModel.findContentInfo().then(function (info) {
                                                            return resolve(_.extend(model, info));
                                                        }).catch(function () {
                                                            return resolve(model);
                                                        });
                                                    }

                                                    resolve(model);
                                                }).then(function (model) {
                                                    if (fileModel.isStream()) {
                                                        model.stream_create = true;

                                                        fileModel.getStreamPlaylist().then(function (playlist) {
                                                            var stream = new Stream(playlist, Skyload.AUDIO_MIME_TYPE_MP4, 50 * 1024 * 1024, Skyload.VIDEO_FORMAT_MP4);
                                                            var sound = collection.get(model.index);

                                                            if (sound instanceof Backbone.Model) {
                                                                return stream.getURL().then(function (url) {
                                                                    sound.setStream(stream);

                                                                    sound.set('play', url).set('size', stream.getSize()).set('stream', false).set('stream_create', false);

                                                                    if (fileModel.get('duration')) {
                                                                        var duration = Math.round(parseInt(fileModel.get('duration')) / 1000);

                                                                        if (_.isNumber(duration)) {
                                                                            sound.set('duration', duration);
                                                                        }
                                                                    }
                                                                }).catch(function (e) {
                                                                    Skyload.Analytics('Tab', 'Parse sound playlist error', e.message);

                                                                    stream.stop();
                                                                    sound.destroy();
                                                                    tabModel.removeParseIndex(type, model.index);
                                                                });
                                                            } else {
                                                                stream.stop();
                                                            }

                                                            throw new Error('Not found sound model for set stream url');
                                                        });
                                                    }

                                                    return model;
                                                });

                                            case Skyload.TYPE_VIDEO:
                                                if (fileModel.isStream()) {
                                                    return fileModel.getStreamPlaylist().then(function (playlist) {
                                                        return _.map(playlist, function (url, index) {
                                                            return {
                                                                url: url,
                                                                index: index,
                                                                format: Skyload.VIDEO_FORMAT_TS,
                                                                mime_type: Skyload.VIDEO_MIME_TYPE_MP2T
                                                            };
                                                        });
                                                    }).then(function (videos) {
                                                        model = _.extend(model, {
                                                            name: parsePageModel.get('title') + ' ' + parsePageModel.get('site_name') + ' ' + '(' + fileModel.get('name') + ')',
                                                            duration: parsePageModel.get('video_duration'),
                                                            quality: fileModel.get('quality'),
                                                            play: videos
                                                        });

                                                        if (fileModel.checkContent()) {
                                                            return fileModel.findContentInfo().then(function (_model) {
                                                                if ('name' in _model && _model.name.length) {
                                                                    model.name = _model.name;
                                                                }

                                                                if ('cover' in _model && _model.cover.length) {
                                                                    model.cover = _model.cover;
                                                                }

                                                                if ('source' in _model && Skyload.AvailableSource.indexOf(_model.source) >= 0) {
                                                                    model.source = _model.source;
                                                                }

                                                                return model;
                                                            }).catch(function () {
                                                                return model;
                                                            });
                                                        }

                                                        return model;
                                                    });
                                                } else {
                                                    var play = {
                                                        url: fileModel.get('url'),
                                                        quality: parsePageModel.getVideoQuality() || fileModel.get('quality'),
                                                        format: fileModel.get('format'),
                                                        index: Skyload.DEFAULT_NAME_VIDEO_ITEM,
                                                        mime_type: fileModel.get('mime_type')
                                                    };

                                                    var _videos = parsePageModel.get('videos');

                                                    if (_.isArray(_videos) && _videos.length) {
                                                        _videos = _.map(_videos, function (video) {
                                                            return _.defaults(video, play);
                                                        });
                                                    } else {
                                                        _videos = [];
                                                    }

                                                    _videos.unshift(_.extend(play, { size: fileModel.get('size') }));

                                                    _videos = _.uniq(_videos, true, function (video) {
                                                        return video.url;
                                                    });

                                                    model = _.extend(model, {
                                                        name: parsePageModel.get('title') + ' ' + '[' + [parsePageModel.get('site_name'), fileModel.get('name')].join(' - ') + ']',
                                                        duration: parsePageModel.get('video_duration'),
                                                        play: _videos
                                                    });
                                                }

                                                break;
                                            default:
                                                throw new Error('Wrong type');
                                        }

                                        return model;
                                    }).then(function (model) {
                                        tabModel.addParseIndex(type, 'index' in model ? model.index : index);

                                        return collection.add(model, { merge: true });
                                    }).then(function (model) {
                                        if (model.get('type') === Skyload.TYPE_VIDEO) {
                                            return model.setVideoSize();
                                        }
                                    }).catch(function (e) {
                                        Skyload.setLog('Tab', 'Parse request', 'Parse page', e);
                                    });
                                }
                            });
                        }
                    }
                } catch (e) {
                    Skyload.setLog('Tabs', 'Parse request', e);
                }

                return this;
            }
        }, {
            key: 'ParsePage',
            value: function ParsePage(url) {
                var _this11 = this;

                var id = md5(url);
                var maxPageCount = 5000;

                var parsePageModel = this.parsePageCollection.get(id);

                if (parsePageModel instanceof ParsePageModel && !parsePageModel.expiredLifeTime()) {
                    if (parsePageModel.isAwait()) {
                        if (!parsePageModel.expiredAwaitTime()) {
                            parsePageModel.addAwaitIteration();

                            return new Promise(function (resolve) {
                                setTimeout(function () {
                                    resolve(_this11.ParsePage(url));
                                }, 1000);
                            });
                        }
                    } else {
                        return Promise.resolve(parsePageModel.set('new', false));
                    }
                } else if (this.parsePageCollection.length >= maxPageCount) {
                    this.parsePageCollection.reset();
                }

                if (parsePageModel instanceof ParsePageModel) {
                    parsePageModel.set('dt', _.now());
                } else {
                    parsePageModel = this.parsePageCollection.add({ id: id });
                }

                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (response) {
                        try {
                            parsePageModel.set('url', url);

                            var link = parsePageModel.parseUrl();
                            var html = response.response.responseText || '';
                            var content = html.substr(html.indexOf('<head'), html.indexOf('</head>'));

                            if (!content.length || link.host.indexOf('coub.com') >= 0) {
                                content = $.parseHTML(html);
                            }

                            var $output = $('<output>').append(content);

                            var icon = $('link[rel="shortcut icon"]', $output).attr('href');

                            var title = $.trim($('meta[name="og:title"],meta[property="og:title"]', $output).first().attr('content') || $('title', $output).text()).replace(/ +(?= )/g, '');

                            var siteName = $.trim($('meta[name="og:site_name"],meta[property="og:site_name"]', $output).first().attr('content') || link.host).replace(/ +(?= )/g, '');

                            var image = $.trim($('meta[name="og:image"],meta[property="og:image"],meta[name="og:image:url"],meta[property="og:image:url"]', $output).first().attr('content') || $('link[rel="thumbnail"]', $output).first().attr('href'));

                            parsePageModel.set('title', title).set('icon', icon).set('image', image).set('site_name', siteName);

                            parsePageModel.set('audio_duration', $('meta[name="og:audio:duration"],meta[property="og:audio:duration"]', $output).first().attr('content') || 0);

                            parsePageModel.set('video_duration', $('meta[name="og:video:duration"],meta[property="og:video:duration"]', $output).first().attr('content') || 0).set('video_width', $('meta[name="og:video:width"],meta[property="og:video:width"]', $output).first().attr('content')).set('video_height', $('meta[name="og:video:height"],meta[property="og:video:height"]', $output).first().attr('content'));

                            var videos = $.makeArray($('meta[name*="video:url"],meta[property*="video:url"]', $output).map(function (i, elem) {
                                var $meta = $(elem);

                                var index = $meta.attr('name') || $meta.attr('property');
                                var file = $meta.attr('content');

                                if (!Skyload.isURL(file)) {
                                    return;
                                }

                                var item = { url: file };
                                var parseFile = Skyload.parseURL(file);

                                if ('path' in parseFile) {
                                    var path = parseFile.path;
                                    var format = _.last(path.split('.'));

                                    if (!format) {
                                        return;
                                    }

                                    item.format = format.toLowerCase();
                                    item.mime_type = [Skyload.MEDIA_TYPE_VIDEO, item.format].join('/');
                                } else {
                                    return;
                                }

                                if (index) {
                                    index = _.first(index.split(':', 1));

                                    if (index) {
                                        item.index = index;

                                        var width = $('meta[name="' + [index, 'video', 'width'].join(':') + '"]', $output).attr('content');
                                        var height = $('meta[name="' + [index, 'video', 'height'].join(':') + '"]', $output).attr('content');

                                        if (width && height) {
                                            item.quality = [width, height].join('x');
                                        }
                                    }
                                }

                                return item;
                            }));

                            if (videos.length) {
                                parsePageModel.set('videos', _.compact(videos));
                            } else {
                                videos = [];

                                try {
                                    if (link.host.indexOf('coub.com') >= 0) {
                                        var $script = $('script#coubPageCoubJson,script#coubJson', $output).first();

                                        if ($script.length) {
                                            var json = JSON.parse($script.html());

                                            if ('file_versions' in json && _.isObject(json.file_versions)) {
                                                var fileVersions = json.file_versions;

                                                if ('integrations' in fileVersions && _.isObject(fileVersions.integrations)) {
                                                    _.each(fileVersions.integrations, function (url, service) {
                                                        videos.push({
                                                            index: service,
                                                            url: url,
                                                            quality: Skyload.VIDEO_QUALITY_SD
                                                        });
                                                    });
                                                }
                                            }
                                        }
                                    }
                                } catch (e) {
                                    Skyload.setLog('Tabs', 'Parse page', 'Find video error', e);
                                }
                            }

                            if (videos.length) {
                                parsePageModel.set('videos', _.compact(videos));
                            }

                            parsePageModel.set('wait', false).set('wait_iteration', 0);

                            resolve(parsePageModel);

                            $output.remove();
                        } catch (e) {
                            _this11.parsePageCollection.remove(id);

                            reject(e);
                        }
                    });
                });
            }
        }, {
            key: 'GetParseContent',
            value: function GetParseContent(tab) {
                return this.Get(tab).then(function (tab) {
                    return _.chain(Skyload.AvailableTypes).map(function (type) {
                        var indexes = tab.getParseIndexes(type);

                        if (indexes.length) {
                            var collectionName = Skyload.Methods.FirstUpperCase(type);
                            var collection = Skyload.Cache[collectionName];

                            if (collection instanceof Backbone.Collection) {
                                return _.chain(indexes).reduce(function (list, index) {
                                    var model = collection.get(index);

                                    if (model instanceof Backbone.Model) {
                                        var item = model.getContentModel();

                                        if (_.isArray(item)) {
                                            list = list.concat(item);
                                        } else if (_.isObject(item)) {
                                            list.push(item);
                                        }
                                    }

                                    return list;
                                }, []).compact().value();
                            }
                        }

                        return [];
                    }).reduce(function (list, items) {
                        return list.concat(items);
                    }, []).uniq(false, function (model) {
                        return model.stream ? model.id : model.file;
                    }).value();
                });
            }
        }, {
            key: 'HasContent',
            value: function HasContent() {
                var _this12 = this;

                var handle = function handle(_ref) {
                    var tab = _ref.tab,
                        frames = _ref.frames;

                    var framesCount = _.size(frames);

                    var tabModel = _this12.collection.get(tab.id);

                    if (framesCount > 0) {
                        return new Promise(function (resolve) {
                            var count = 0;

                            var async = _.after(framesCount, function () {
                                if (tabModel instanceof TabModel) {
                                    count = count + tabModel.getParseCount();
                                }

                                resolve({ tab: tab, count: count });
                            });

                            _.each(frames, function (frame) {
                                Skyload.SendMessageFromBackgroundToContentFrame(tab.id, frame.frameId, {
                                    method: 'has_content'
                                }, function (response) {
                                    if (_.isObject(response) && 'code' in response && response.code === 0) {
                                        count += response.count;
                                    }

                                    async();
                                });
                            });
                        });
                    }

                    return Promise.resolve({ tab: tab, count: tabModel instanceof TabModel ? tabModel.getParseCount() : 0 });
                };

                return Skyload.GetAllFramesOnSelectedTab(true).then(handle);
            }
        }, {
            key: 'Trigger',
            value: function Trigger() {
                var _this13 = this;

                try {
                    var collection = Skyload.Cache.Download.filter(function (model) {
                        return _.contains([Skyload.DOWNLOAD_STATE_PENDING, Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PRE], model.get('state'));
                    });

                    var download_count = collection.length;

                    this.HasContent().then(function (data) {
                        var tab = data.tab,
                            foundCount = data.count,
                            has = foundCount > 0;

                        _this13.Get(tab).then(function (model) {
                            if (download_count > 0) {
                                model.setDownloadCount(download_count).setPopupState(has ? Skyload.POPUP_STATE_DEFAULT : Skyload.POPUP_STATE_DOWNLOAD);
                            } else {
                                model.setDownloadCount(0).setFoundCount(foundCount);

                                if (has) {
                                    model.setPopupState(Skyload.POPUP_STATE_DEFAULT);
                                } else {
                                    var host = Skyload.parseURL(model.get('url')).host;

                                    if (_.isString(host) && host.includes('youtube.com') && !Skyload.IsAvailableResource(Skyload.SOURCE_YOUTUBE)) {
                                        model.setPopupState(Skyload.POPUP_STATE_YOUTUBE);
                                    } else if (host.indexOf('skyload.io') >= 0) {
                                        model.setPopupState(Skyload.POPUP_STATE_SKYLOAD);
                                    } else {
                                        model.setPopupState(Skyload.POPUP_STATE_EMPTY);
                                    }
                                }
                            }
                        }).catch(function (e) {
                            Skyload.setLog('Tabs', 'Get error', e);
                        });
                    }).catch(function (e) {});
                } catch (e) {
                    Skyload.setLog('Tabs', 'Trigger error', e);
                }

                return this;
            }
        }]);

        return Tabs;
    }();

    return Tabs;
});