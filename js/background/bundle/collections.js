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

define('collections', ['config', 'backbone', 'underscore'], function (Config, Backbone, _) {
    var Collections = function () {
        function Collections() {
            var _this4 = this;

            _classCallCheck(this, Collections);

            _.each(Skyload.CacheNamespace, function (key, namespace) {
                var nameCollection = [key, 'CacheCollection'].join('');
                var nameModel = [key, 'Cache'].join('');

                var collection = {
                    model: Skyload.Models[nameModel],
                    database: Config.DataBase,
                    storeName: namespace,
                    ready: false,
                    initialize: function initialize() {
                        var _this = this;

                        this.fetch({ reset: true });

                        this.on('reset', function () {
                            _this.ready = true;

                            switch (key) {
                                case Skyload.CacheNamespace.download:
                                    _this.each(function (model) {
                                        model.isExist().catch(function () {
                                            model.destroy();
                                        });
                                    });

                                    break;
                            }
                        });

                        setInterval(function () {
                            var isDownload = !!Skyload.Cache.Download.filter(function (model) {
                                return _.include([Skyload.DOWNLOAD_STATE_PENDING, Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PRE], model.get('state'));
                            }).length;

                            if (!isDownload) {
                                _.each(_this.where({ cache: false }), function (model) {
                                    return model.save({ cache: true });
                                });

                                if (_this.length > 20000) {
                                    var _collection = _this.first(50);

                                    _.each(_collection, function (model) {
                                        return model.destroy();
                                    });
                                }
                            }
                        }, 30000);
                    },
                    getKeyIndexModel: function getKeyIndexModel(value) {
                        var type = value instanceof Backbone.Model ? value.get('type') : value;

                        switch (type) {
                            case 'download':
                                return 'id';

                            default:
                                return 'index';

                        }
                    },
                    destroy: function destroy(identifier) {
                        var _this2 = this;

                        return this.each(function (model) {
                            if (_.isArray(identifier)) {
                                var index = _this2.getKeyIndexModel(model);
                                if (_.include(identifier, model.get(index))) {
                                    model.destroy();
                                }
                            } else {
                                model.destroy();
                            }
                        });
                    },
                    save: function save(collection) {
                        var _this3 = this;

                        if (_.isArray(collection)) {
                            _.each(collection, function (json) {
                                var model = _this3.get(_this3.getKeyIndexModel(json.type));

                                if (_.isUndefined(model)) {
                                    _this3.create(json);
                                } else {
                                    model.save(json);
                                }
                            });
                        }

                        return this;
                    },
                    isReady: function isReady() {
                        return this.ready;
                    }
                };

                switch (key) {
                    case Skyload.CacheNamespace.download:
                        collection = _.extend(collection, {
                            completeDownload: function completeDownload(model) {
                                var list = this.filter(function (model) {
                                    return _.include([Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PENDING], model.get('state'));
                                });

                                if (!list.length) {
                                    this.trigger('complete_download', model);
                                }

                                return this;
                            },
                            downloadQueue: function downloadQueue() {
                                var collection = this.where({ state: Skyload.DOWNLOAD_STATE_IN_PROGRESS });
                                var download_at_time = Skyload.DOWNLOAD_AT_TIME;

                                if (collection.length < download_at_time) {
                                    var queue_collection = this.chain().filter(function (model) {
                                        return model.get('state') === Skyload.DOWNLOAD_STATE_PENDING && !_.isNull(model.get('group'));
                                    });

                                    var pre_collection = this.where({ state: Skyload.DOWNLOAD_STATE_PRE });

                                    if (queue_collection.value().length && !pre_collection.length) {
                                        var limit = download_at_time - collection.length;

                                        queue_collection.slice(0, limit).each(function (model) {
                                            model.set('state', Skyload.DOWNLOAD_STATE_PRE).save();

                                            model.download().then(function (json) {
                                                Skyload.SendMessageFromBackgroundToPopupAction(_.extend({
                                                    action: 'set_download_id'
                                                }, json));
                                            }).catch(function (e) {
                                                model.trigger('download_queue_error', e);
                                                model.stopWatchProgress();
                                                model.destroy();

                                                Skyload.setLog('Background', 'Download queue error', e);
                                            });
                                        });
                                    }
                                }

                                return this;
                            }
                        });

                        break;
                }

                _this4[nameCollection] = Backbone.Collection.extend(collection);
                Skyload.Cache[key] = new _this4[nameCollection]();
            });
        }

        _createClass(Collections, [{
            key: 'Notifications',
            get: function get() {
                return Backbone.Collection.extend({
                    model: Skyload.Models.NotificationModel,
                    initialize: function initialize() {
                        var _this5 = this;

                        this.on('add', function (model) {
                            if (!model.get('history')) {
                                _.delay(function () {
                                    if (model.get('complete') == false) {
                                        model.send();
                                    }

                                    _this5.remove(model.get('id'));
                                }, model.get('delay'));
                            }
                        }, this);

                        this.on('show_notification', function (id) {
                            _this5.chain().filter(function (model) {
                                return model.get('id') != id;
                            }).each(function (model) {
                                return model.close();
                            });
                        });
                    }
                });
            }
        }, {
            key: 'VideoItemCollection',
            get: function get() {
                return Backbone.Collection.extend({
                    model: Skyload.Models.VideoItemModel
                });
            }
        }]);

        return Collections;
    }();

    return Collections;
});