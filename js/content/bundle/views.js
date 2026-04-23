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

define('views', ['backbone', 'underscore', 'jquery', 'methods'], function (Backbone, _, $) {
    var Views = function () {
        function Views() {
            _classCallCheck(this, Views);
        }

        _createClass(Views, [{
            key: 'SoundView',
            get: function get() {
                return Backbone.View.extend({
                    getFileName: function getFileName() {
                        return this.model.getFileName();
                    },
                    download: function download(category) {
                        if (_.isUndefined(category)) {
                            Skyload.setLog('Sound', 'Download', 'Undefined category');
                            return;
                        }

                        Skyload.Download(this.model).catch(function (e) {
                            Skyload.setLog('Sound view', 'Download error', e);
                        });

                        Skyload.Analytics(category, 'Download', 'id = ' + this.model.get('id') + ', author = ' + this.model.get('author') + ', name = ' + this.model.get('name')).Analytics('Sound', 'Download', 'author = ' + this.model.get('author') + ', name = ' + this.model.get('name'));
                    },
                    getTitle: function getTitle() {
                        var title = Skyload.getLocale('download_sound');
                        var info = this.model.getTitle();

                        if (info.length) {
                            title += ' - ' + info;
                        }

                        return title;
                    }
                });
            }
        }, {
            key: 'VideoView',
            get: function get() {
                return Backbone.View.extend({
                    specialModel: null,
                    getModel: function getModel() {
                        return this.model;
                    },
                    getSpecialModel: function getSpecialModel() {
                        return this.specialModel;
                    },
                    download: function download(category, as) {
                        if (_.isUndefined(category) || !(this.specialModel instanceof Backbone.Model)) {
                            Skyload.setLog('Video', 'Download', 'Undefined category or model');
                            return;
                        }

                        Skyload.Download(this.model, {
                            id: this.specialModel.get('index'),
                            source: this.model.get('source'),
                            index: [this.model.get('index'), this.specialModel.get('index')].join('_')
                        }).catch(function (e) {
                            Skyload.setLog('Video view', 'Download error', e);
                        });

                        Skyload.Analytics(category, _.isUndefined(as) ? 'Download' : as, 'id = ' + this.model.get('id') + ', format = ' + this.specialModel.get('format') + ', quality = ' + this.specialModel.get('quality')).Analytics('Video', 'Download', this.model.get('name'));
                    },
                    getFileName: function getFileName() {
                        if (!(this.specialModel instanceof Backbone.Model)) return;

                        return Skyload.Methods.GetCopyrightFileName(this.model.get('name'), this.specialModel.get('format'));
                    },
                    getTitle: function getTitle() {
                        if (!(this.specialModel instanceof Backbone.Model)) return '';

                        return this.specialModel.getTitle();
                    },
                    getSizeTitle: function getSizeTitle() {
                        if (!(this.specialModel instanceof Backbone.Model)) return '';

                        return this.specialModel.getSizeTitle();
                    }
                });
            }
        }, {
            key: 'AppView',
            get: function get() {
                return Backbone.View.extend({
                    el: $('body'),
                    active: true,

                    isActive: function isActive() {
                        return this.active;
                    },

                    access: {},

                    $parseElem: null,
                    parseSelector: null,
                    parseCollections: null,
                    parseMainAttr: 'skyload',
                    parseElemAttr: 'skyload-index',
                    parseTypeAttr: 'skyload-type',
                    parseCountAttr: 'skyload-count',
                    parseIgnoreAttr: 'skyload-ignore',
                    parseDelay: 1000,
                    parse: false,

                    init: function init() {
                        var _this = this;

                        $(window).on('mousemove scroll focus', function () {
                            _this.active = true;
                        }).blur(function () {
                            _this.active = false;
                        });

                        return this;
                    },

                    setSoundTemplate: function setSoundTemplate(model) {
                        Skyload.setLog('AppView', 'Not implemented method', 'Sound');
                    },
                    setVideoTemplate: function setVideoTemplate(model) {
                        Skyload.setLog('AppView', 'Not implemented method', 'Video');
                    },

                    findSoundInfo: function findSoundInfo() {
                        return Promise.reject(new Error('Not implemented yet'));
                    },
                    findVideoInfo: function findVideoInfo() {
                        return Promise.reject(new Error('Not implemented yet'));
                    },

                    checkAccess: function checkAccess() {
                        var _this2 = this;

                        return new Promise(function (resolve) {
                            Skyload.Methods.GetSender().then(function (sender) {
                                var domain = Skyload.Methods.ParseURL(sender.tab.url).host;

                                Skyload.SendMessageFromContentToBackground({
                                    method: 'access',
                                    action: 'get',
                                    domain: domain
                                }, function (model) {
                                    _this2.setAccess(model);

                                    resolve(model);
                                });
                            }, function (e) {
                                Skyload.setLog('App view', 'Check Access error', e);
                            });
                        });
                    },
                    setAccess: function setAccess(access) {
                        this.access = access;
                        return this.changeAccess(access);
                    },
                    changeAccess: function changeAccess(access) {
                        var $html = $('html');
                        var classes = $html.attr('class');

                        if (_.isString(classes)) {
                            classes = _.filter(classes.split(' '), function (name) {
                                return name.indexOf('skyload') >= 0;
                            });
                            $html.removeClass(classes.join(' '));
                        }

                        classes = _.chain(access).map(function (available, type) {
                            if (available === true) {
                                return 'skyload-' + type + '__available';
                            }
                        }).compact().value().join(' ');

                        $html.addClass(classes);

                        return this.trigger('change_access', access);
                    },
                    setVideoPreload: function setVideoPreload(value) {
                        this.$el[value ? 'addClass' : 'removeClass']('skyload-video__preloader');
                        return this;
                    },
                    isCanInsert: function isCanInsert(type) {
                        var access = this.access;

                        if (type in access) {
                            return access[type];
                        }

                        return true;
                    },
                    isRendered: function isRendered($elem) {
                        if ($elem && $elem.length) {
                            var docViewTop = $(window).scrollTop(),
                                docViewBottom = docViewTop + $(window).height(),
                                elemTop = $elem.offset().top,
                                elemBottom = elemTop + $elem.height();

                            return elemBottom <= docViewBottom && elemTop >= docViewTop;
                        }

                        return false;
                    },
                    markElem: function markElem($elem, model) {
                        var type = void 0,
                            index = void 0,
                            count = void 0;

                        if (model instanceof Backbone.Model) {
                            type = model.getType();
                            index = model.get('index');

                            if (type === Skyload.TYPE_VIDEO) {
                                count = model.getVideo().filter(function (video) {
                                    return !video.get('without_audio');
                                }).length;
                            }
                        } else if (_.isArray(model)) {
                            type = _.first(model);
                            index = _.last(model);
                        }

                        $elem.attr(this.parseMainAttr, 'set').attr(this.parseTypeAttr, type).attr(this.parseElemAttr, index);

                        if (count) {
                            $elem.attr(this.parseCountAttr, count);
                        }

                        return this;
                    },
                    isParse: function isParse() {
                        return this.parse;
                    },
                    parseElem: function parseElem(selector, collection) {
                        var _this3 = this;

                        this.parseSelector = selector;
                        this.parseCollections = {};

                        if (!_.isArray(collection)) {
                            collection = [collection];
                        }

                        _.each(collection, function (_collection) {
                            if (_collection instanceof Backbone.Collection) {
                                _this3.parseCollections[_collection.getType()] = _collection;
                            }
                        });

                        if (!_.size(this.parseCollections)) {
                            this.parseCollections = null;
                        }

                        return this;
                    },
                    renderTemplate: function renderTemplate(selector, collection, limit) {
                        var _this4 = this;

                        if (this.isCanInsert(collection.getType())) {
                            var $elem = this.$el.find(selector);

                            if (_.isNumber(limit)) {
                                $elem = $elem.slice(0, limit);
                            }

                            if ($elem.length) {
                                $elem.each(function (i, elem) {
                                    var $this = $(elem);

                                    if (_this4.isRendered($this)) {
                                        var index = $this.attr(_this4.parseElemAttr);

                                        if (!_.isUndefined(index)) {
                                            var model = collection.get(index);

                                            if (model instanceof Backbone.Model) {
                                                var name = _.chain([collection.getType(), 'template']).map(function (label) {
                                                    return Skyload.Methods.FirstUpperCase(label);
                                                }).value();

                                                name.unshift('set');
                                                name = name.join('');

                                                var callback = _this4[name];

                                                model.set('view', $this);
                                                callback.call(_this4, model);
                                            }
                                        }
                                    }
                                });
                            }
                        }

                        return this;
                    },
                    getContent: function getContent() {
                        var _this5 = this;

                        return new Promise(function (resolve, reject) {
                            try {
                                if (!_this5.isParse() || _.isNull(_this5.parseCollections) || _.isNull(_this5.parseSelector)) {
                                    throw new Error('Brake');
                                }

                                var $elem = $(_this5.parseSelector);
                                var collections = _this5.parseCollections;

                                if ($elem.length) {
                                    var data = _.compact($elem.map(function (i, elem) {
                                        var $this = $(elem);
                                        var index = $this.attr(_this5.parseElemAttr);
                                        var type = $this.attr(_this5.parseTypeAttr);

                                        if (_.include(Skyload.AvailableTypes, type) && !_.isUndefined(index)) {
                                            var collection = collections[type];

                                            if (collection instanceof Backbone.Collection) {
                                                var model = collection.get(index);

                                                if (model instanceof Backbone.Model) {
                                                    return model;
                                                }
                                            }
                                        }
                                    }));

                                    if (data.length) {
                                        data = _.groupBy(data, function (model) {
                                            return model.getType();
                                        });

                                        var list = [],
                                            single_type = null;
                                        var send = _.after(_.size(data), function () {
                                            resolve({
                                                collection: list,
                                                single_type: single_type
                                            });
                                        });

                                        var callback = function callback(collection, type) {
                                            list = list.concat(collection);

                                            if (_.size(data) == 1) {
                                                single_type = type;
                                            }

                                            send();
                                        };

                                        _.each(data, function (list, type) {
                                            switch (type) {
                                                case Skyload.TYPE_SOUND:
                                                    _this5.setActionSound(list).then(function (data) {
                                                        return callback(data.collection, data.type);
                                                    }).catch(function () {
                                                        return callback([], type);
                                                    });

                                                    break;
                                                case Skyload.TYPE_VIDEO:
                                                    _this5.setActionVideo(list).then(function (data) {
                                                        return callback(data.collection, data.type);
                                                    }).catch(function () {
                                                        return callback([], type);
                                                    });

                                                    break;
                                            }
                                        });
                                    } else {
                                        throw new Error('Not element to create');
                                    }
                                } else {
                                    throw new Error('Not element to parse');
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    },
                    getContentCount: function getContentCount(type) {
                        var _this6 = this;

                        if (_.isNull(this.parseCollections) || _.isNull(this.parseSelector)) {
                            return 0;
                        }

                        var $elem = this.$el.find(this.parseSelector).not('[' + this.parseIgnoreAttr + ']').map(function (i, elem) {
                            var $elem = $(elem),
                                type = $elem.attr(_this6.parseTypeAttr),
                                index = $elem.attr(_this6.parseElemAttr),
                                key = [type, index].join(':'),
                                value = $elem.attr(_this6.parseCountAttr) || 1;

                            return { key: key, value: value, type: type };
                        });

                        return _.chain($.makeArray($elem)).reduce(function (memo, item) {
                            if (Skyload.AvailableTypes.indexOf(type) >= 0 && item.type == type || !type) {
                                memo[item.key] = parseInt(item.value);
                            }

                            return memo;
                        }, {}).values().reduce(function (memo, count) {
                            return memo + count;
                        }, 0).value();
                    },
                    setActionSound: function setActionSound(collection) {
                        return new Promise(function (resolve) {
                            var j = 0,
                                callback = _.after(collection.length, function () {
                                resolve({
                                    collection: collection,
                                    type: Skyload.TYPE_SOUND
                                });
                            });

                            _.each(collection, function (model, i, list) {
                                list[i] = {
                                    id: model.get('index'),
                                    download_id: model.get('download_id'),
                                    index: model.get('index'),
                                    source: model.get('source'),
                                    type: model.getType(),
                                    cover: model.get('cover'),
                                    title: model.getName(),
                                    file: model.get('play'),
                                    mime_type: model.get('mime_type'),
                                    duration: model.get('duration'),
                                    data: model.get('data')
                                };

                                if (model.get('size') > 0) {
                                    list[i].size = model.get('size');
                                } else if (j <= 10) {
                                    model.getSize().catch(function () {});
                                    j++;
                                }

                                callback();
                            });
                        });
                    },
                    setActionVideo: function setActionVideo(collection) {
                        return new Promise(function (resolve, reject) {
                            var lock = null;

                            if (!(collection instanceof Backbone.Collection)) {
                                if (_.isArray(collection) && collection.length) {
                                    collection = new Skyload.Collections.VideoCollection(collection);
                                } else {
                                    return reject(new Error('Empty collection'));
                                }
                            }

                            var list = collection.chain().map(function (model) {
                                var videos = model.getVideo();

                                if (videos instanceof Backbone.Collection) {
                                    return videos.chain().map(function (video) {
                                        if (video.get('without_audio')) {
                                            return;
                                        }

                                        var id = [model.get('index'), video.get('index')].join('_');

                                        if (_.isNumber(video.get('download_id'))) {
                                            lock = false;
                                        }

                                        return {
                                            id: id,
                                            download_id: video.get('download_id'),
                                            index: model.get('index'),
                                            source: model.get('source'),
                                            type: model.getType(),
                                            cover: model.get('cover'),
                                            title: model.get('name'),
                                            file: video.get('url'),
                                            mime_type: video.get('mime_type'),
                                            size: video.get('size'),
                                            duration: model.get('duration'),
                                            data: {
                                                id: video.get('index'),
                                                quality: video.get('quality'),
                                                format: video.get('format')
                                            }
                                        };
                                    }).compact().value();
                                }
                            }).compact().reduce(function (memo, item) {
                                return memo.concat(item);
                            }, []).value();

                            resolve({
                                collection: list,
                                type: Skyload.TYPE_VIDEO
                            });
                        });
                    },
                    clearParseContent: function clearParseContent() {
                        return new Promise(function (resolve, reject) {
                            Skyload.SendMessageFromContentToBackground({ method: 'clear_parse_content' }, function (response) {
                                try {
                                    if (response.code != 0) {
                                        throw new Error(response.message);
                                    }

                                    resolve();
                                } catch (e) {
                                    reject(e);
                                }
                            });
                        });
                    }
                });
            }
        }]);

        return Views;
    }();

    return Views;
});