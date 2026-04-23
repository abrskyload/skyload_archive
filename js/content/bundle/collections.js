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

define('collections', ['backbone', 'underscore', 'methods', 'models'], function (Backbone, _) {
    var Collections = function () {
        function Collections() {
            var _this5 = this;

            _classCallCheck(this, Collections);

            _.chain(Skyload.AvailableTypes).each(function (type) {
                var namespace = Skyload.Methods.FirstUpperCase(type);
                var nameCollection = [namespace, 'Collection'].join('');
                var nameModel = [namespace, 'Model'].join('');

                var defaults = {
                    model: Skyload.Models[nameModel],
                    type: type,
                    source: false,
                    ready: false,
                    initialize: function initialize() {
                        var _this = this;

                        this.on('reset', function () {
                            _this.ready = true;
                        });
                    },
                    update: function update(limit) {
                        var _this2 = this;

                        if (_.isUndefined(limit)) {
                            limit = 0;
                        }

                        Skyload.SendMessageFromContentToBackground({
                            method: 'cache',
                            action: 'get',
                            namespace: namespace,
                            source: this.source,
                            limit: limit
                        }, function (response) {
                            try {
                                if (response.code === 0) {
                                    limit = response.meta.length;

                                    if (!_.isUndefined(response.collection)) {
                                        _this2.set(response.collection, { remove: false });

                                        if (response.meta.count >= 1) {
                                            if (limit < response.meta.count) {
                                                _this2.update(limit);
                                            } else {
                                                _this2.trigger('reset');
                                            }
                                        } else {
                                            _this2.trigger('reset');
                                        }
                                    } else {
                                        _this2.trigger('reset');
                                    }
                                } else {
                                    throw new Error(response.message);
                                }
                            } catch (e) {
                                Skyload.setLog('Have to reload the page. The problem is in the update collection', e);
                            }
                        });

                        return this;
                    },
                    save: function save(attributes, mode) {
                        var _this3 = this;

                        return new Promise(function (resolve, reject) {
                            try {
                                if (!_.isObject(attributes)) {
                                    throw new Error('Param attributes must be object');
                                }

                                if (!attributes.index) {
                                    throw new Error('Index not found');
                                }

                                if (!attributes.play && !_.include([Skyload.SOURCE_YANDEX, Skyload.SOURCE_VK], attributes.source)) {
                                    throw new Error('Param attributes.play must be set');
                                }

                                var model = _this3.get(attributes.index);

                                if (model instanceof Backbone.Model) {
                                    if (!model.isCached()) {
                                        switch (_this3.getType()) {
                                            case Skyload.TYPE_SOUND:
                                                if (!_.isString(attributes.play) || !attributes.play.length) {
                                                    throw new Error('For sound params attributes.play must be string, length > 0');
                                                }

                                                if ('size' in attributes && attributes.size > 0) {
                                                    model.set('size', attributes.size);
                                                }

                                                model.set('play', attributes.play).save();

                                                resolve(model);

                                                break;
                                            case Skyload.TYPE_VIDEO:
                                                if (!_.isArray(attributes.play) || !attributes.play.length) {
                                                    throw new Error('For video params attributes.play must be array');
                                                }

                                                if (mode === Skyload.COLLECTION_MODE_IGNORE_SIZE) {
                                                    model.setVideoSize();
                                                    resolve(model);
                                                } else {
                                                    model.setVideoSize().then(resolve, reject);
                                                }

                                                break;
                                            default:
                                                throw new Error('Wrong type');
                                        }
                                    } else {
                                        if (_this3.getType() === Skyload.TYPE_SOUND && mode === Skyload.COLLECTION_MODE_SAVE_PLAY) {
                                            if (!_.isString(attributes.play) || !attributes.play.length) {
                                                throw new Error('[Mode] For sound params attributes.play must be string, length > 0');
                                            }

                                            model.set('play', attributes.play).save();
                                        }

                                        resolve(model);
                                    }
                                } else {
                                    model = _this3.create(attributes);

                                    if (_this3.getType() === Skyload.TYPE_VIDEO) {
                                        if (mode === Skyload.COLLECTION_MODE_IGNORE_SIZE) {
                                            model.setVideoSize();
                                            resolve(model);
                                        } else {
                                            model.setVideoSize().then(resolve, reject);
                                        }
                                    } else {
                                        resolve(model);
                                    }
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    },
                    autoSave: function autoSave() {
                        var _this4 = this;

                        setInterval(function () {
                            var collection = _this4.where({ sync: false });

                            if (collection.length) {
                                collection = collection.slice(0, 50);
                                collection.map(function (model) {
                                    return model.save();
                                });
                            }
                        }, 3000);

                        return this;
                    },
                    setSource: function setSource(source) {
                        this.source = source;
                        return this;
                    },
                    isReady: function isReady() {
                        return this.ready;
                    },
                    getType: function getType() {
                        return this.type;
                    }
                };

                _this5[nameCollection] = Backbone.Collection.extend(defaults);
            });
        }

        _createClass(Collections, [{
            key: 'VideoItemCollection',
            get: function get() {
                return Backbone.Collection.extend({
                    model: Skyload.Models.VideoItemModel,
                    index: 'format',
                    comparator: function comparator(item) {
                        return item.get(this.index);
                    },
                    sortByField: function sortByField(index) {
                        this.index = index;
                        this.sort();

                        return this;
                    }
                });
            }
        }]);

        return Collections;
    }();

    return Collections;
});