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

define('models', ['backbone', 'underscore'], function (Backbone, _) {
    var CommonModel = Backbone.Model.extend({
        getJSON: function getJSON() {
            var _this = this;

            return _.chain(this.defaults).keys().filter(function (key) {
                return !_.include(['elem', 'group', 'model', 'insert', 'view', 'sync'], key);
            }).reduce(function (memo, key) {
                var value = _this.get(key);

                if (value instanceof Backbone.Collection) {
                    value = value.models.map(function (model) {
                        return model.getJSON();
                    });
                }

                memo[key] = value;

                return memo;
            }, {}).value();
        }
    });

    var CacheModel = CommonModel.extend({
        _save: null,
        initialize: function initialize() {
            var _this2 = this;

            this._save = this.save;

            this.save = function (attributes, options) {
                _this2.set('dt', _.now());
                return _this2._save(attributes, options);
            };
        },
        isCached: function isCached(ctl) {
            if (_.isUndefined(ctl)) {
                ctl = 10 * 60 * 1000;
            }

            return parseInt(this.get('dt')) + ctl > _.now();
        },
        getType: function getType() {
            return this.get('type');
        }
    });

    var Models = function () {
        function Models() {
            _classCallCheck(this, Models);
        }

        _createClass(Models, [{
            key: 'SoundModel',
            get: function get() {
                return CacheModel.extend({
                    defaults: {
                        index: null,
                        id: 0,
                        download_id: null,
                        source: null,
                        group: null,
                        elem: null,
                        insert: true,
                        sync: false,
                        view: null,
                        cover: null,
                        play: null,
                        album: null,
                        author: null,
                        name: null,
                        version: null,
                        year: null,
                        position: null,
                        label: null,
                        duration: 0,
                        size: 0,
                        mime_type: null,
                        stream: false,
                        stream_create: false,
                        data: {},
                        dt: _.now(),
                        type: Skyload.TYPE_SOUND
                    },
                    idAttribute: 'index',
                    getSize: function getSize() {
                        var _this3 = this;

                        if (this.get('size') > 0) {
                            return Promise.resolve(this.get('size'));
                        }

                        if (!Skyload.isURL(this.get('play'))) {
                            return Promise.reject(new Error('Invalid sound url'));
                        }

                        return new Promise(function (resolve, reject) {
                            Skyload.Methods.GetFileSize(_this3.get('play'), function (response) {
                                if (!_.isNull(response)) {
                                    _this3.set('size', response.fileSize).save();

                                    resolve(response.fileSize);
                                } else {
                                    reject(new Error('Response is null'));
                                }
                            });
                        });
                    },
                    setDownloadId: function setDownloadId(id) {
                        return this.set('download_id', id);
                    },
                    getName: function getName() {
                        var name = [this.get('author'), this.get('name')].join(' - ');

                        if (!_.isNull(this.get('version'))) {
                            name += ' (' + this.get('version') + ')';
                        }

                        return name;
                    },
                    getFileName: function getFileName() {
                        return Skyload.Methods.GetCopyrightFileName(this.getName(), 'mp3');
                    },
                    getTitle: function getTitle() {
                        if (this.get('size')) {
                            var info = Skyload.Methods.ConvertMediaInfo(this.get('size'), this.get('duration'));
                            return info.size + Skyload.getLocale(info.value) + ' ~ ' + info.bitrate + Skyload.getLocale('kbs');
                        }

                        return '';
                    }
                });
            }
        }, {
            key: 'VideoModel',
            get: function get() {
                return CacheModel.extend({
                    defaults: {
                        index: null,
                        id: 0,
                        download_id: null,
                        source: null,
                        play: {},
                        name: null,
                        des: null,
                        cover: null,
                        duration: 0,
                        sync: false,
                        size: 0,
                        stream: false,
                        stream_create: false,
                        dt: _.now(),
                        type: Skyload.TYPE_VIDEO
                    },
                    idAttribute: 'index',
                    getVideo: function getVideo() {
                        var videos = this.get('play');

                        if (!(videos instanceof Backbone.Collection)) {
                            videos = new Skyload.Collections.VideoItemCollection(videos);
                            this.set('play', videos);
                        }

                        return videos;
                    },
                    setVideoSize: function setVideoSize() {
                        var _this4 = this;

                        return new Promise(function (resolve, reject) {
                            var collection = _this4.getVideo();
                            var callback = _.after(collection.length, function () {
                                _this4.save();
                                resolve(_this4);
                            });

                            collection.each(function (model) {
                                model.getSize().then(callback, callback);
                            });
                        });
                    },
                    setDownloadId: function setDownloadId(downloadId, id) {
                        var collection = this.getVideo();
                        var model = collection.get(id);

                        if (model instanceof Backbone.Model) {
                            model.set('download_id', downloadId);
                            collection.set(model.toJSON(), { remove: false });

                            this.set('play', collection.toJSON()).save();
                        }
                    }
                });
            }
        }, {
            key: 'VideoItemModel',
            get: function get() {
                return CommonModel.extend({
                    defaults: {
                        id: null,
                        download_id: null,
                        name: null,
                        url: null,
                        quality: null,
                        format: null,
                        index: null,
                        duration: null,
                        size: 0,
                        mime_type: null,
                        without_audio: false
                    },
                    idAttribute: 'index',
                    getTitle: function getTitle() {
                        var title = this.getSizeTitle();

                        return this.get('format') + ' (' + this.get('quality') + ')' + (title.length ? ' ~ ' + title : '');
                    },
                    getSizeTitle: function getSizeTitle() {
                        var title = '',
                            info = void 0;

                        if (this.get('size') >= 1) {
                            info = Skyload.Methods.ConvertMediaInfo(this.get('size'), this.get('duration'));
                            title = info.size + ' ' + Skyload.getLocale(info.value);
                        }

                        return title;
                    },
                    getFileName: function getFileName() {
                        return Skyload.Methods.GetCopyrightFileName(this.get('name'), this.get('format'));
                    },
                    getSize: function getSize() {
                        var _this5 = this;

                        if (this.get('size')) {
                            return Promise.resolve(this.get('size'));
                        }

                        if (!Skyload.isURL(this.get('url'))) {
                            return Promise.reject(new Error('Invalid video url'));
                        }

                        return new Promise(function (resolve, reject) {
                            Skyload.Methods.GetFileSize(_this5.get('url'), function (response) {
                                if (response.status === 200) {
                                    var size = response.fileSize;

                                    if (size) {
                                        _this5.set('size', size);
                                        resolve(size);
                                    } else {
                                        reject(new Error('Size is 0'));
                                    }
                                } else {
                                    reject(new Error('Bed response status'));
                                }
                            });
                        });
                    }
                });
            }
        }]);

        return Models;
    }();

    return Models;
});