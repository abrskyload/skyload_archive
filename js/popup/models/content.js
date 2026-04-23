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

define('content_model', ['content_collection', 'content_item_model', 'backbone', 'underscore', 'common'], function (ContentCollection, ContentItemModel, Backbone, _) {
    return Backbone.Model.extend({
        default_slice_value: 50,
        defaults: {
            collection: new ContentCollection(),
            count: 0,
            sound: 0,
            video: 0,

            downloading: false,
            download_percent: -1,
            download_count: -1,
            download_type: null,
            download_queue_count: -1,
            download_queue_type: null,

            access_sound: null,
            access_video: null,
            access_domain: null,

            separate_directory: false
        },
        collection: null,
        initialize: function initialize() {
            var _this = this;

            this.on('update_collection', function () {
                _this.collection = _this.get('collection');

                _this.collection.chain().groupBy(function (model) {
                    return model.get('type');
                }).each(function (list, type) {
                    return _this.set(type, list.length);
                });

                _this.set('count', _this.collection.length);
            });

            this.on(_.chain(Skyload.AvailableTypes).map(function (type) {
                return 'change:access_' + type;
            }).value().join(' '), function () {
                return _this.trigger('update_access');
            });

            setInterval(function () {
                _this.getDownloadState().then(function (data) {
                    if (data.count) {
                        _this.set('downloading', true).set('download_count', data.count).set('download_type', data.type).set('download_queue_count', data.queue_count).set('download_queue_type', data.queue_type).set('download_percent', data.percent);
                    } else if (_this.get('downloading')) {
                        _this.trigger('complete_download');
                        _this.set('downloading', false);
                    }
                }).catch(function (e) {
                    Skyload.setLog('Content model', 'Update download info', e);
                });
            }, 1000);
        },
        getCollection: function getCollection() {
            return this.get('collection');
        },
        getCollectionCount: function getCollectionCount() {
            return this.get('count');
        },
        getCurrentCollection: function getCurrentCollection() {
            return this.collection;
        },
        getSoundCount: function getSoundCount() {
            return this.get('sound');
        },
        getVideoCount: function getVideoCount() {
            return this.get('video');
        },
        getDomain: function getDomain() {
            return this.get('access_domain');
        },
        toSeparateDirectory: function toSeparateDirectory() {
            return this.get('separate_directory');
        },
        setSeparateDirectory: function setSeparateDirectory(value) {
            return this.set('separate_directory', value);
        },
        getAvailableTypes: function getAvailableTypes() {
            var _this2 = this;

            return _.chain(Skyload.AvailableTypes).filter(function (type) {
                return _this2.get(type) > 0;
            }).value();
        },
        setAccess: function setAccess(access) {
            var _this3 = this;

            if (_.isObject(access)) {
                _.each(access, function (value, type) {
                    var index = ['access', type].join('_');
                    if ((_.isNull(_this3.get(index)) || _.isBoolean(_this3.get(index))) && value !== _this3.get(index)) {
                        _this3.set(index, value);
                    }
                });
            }

            return this;
        },

        setCollection: function setCollection(collection) {
            if (_.isArray(collection)) {
                collection = new ContentCollection(collection);
            }

            if (collection instanceof ContentCollection) {
                if (this.getCollection().length !== collection.length) {
                    collection = collection.toJSON();
                    collection = new ContentCollection(collection, { parse: true });

                    this.set('collection', collection);
                    this.trigger('set_new_collection').trigger('update_collection');
                } else {
                    this.getCollection().each(function (model) {
                        var _model = collection.get(model.get('id'));

                        if (_model instanceof ContentItemModel) {
                            if (_.isNull(model.get('download_id')) && _model.get('download_id')) {
                                model.set('download_id', _model.get('download_id'));
                            }

                            if (model.get('size') === 0 && _model.get('size') > 0 || model.get('size') > 0 && _model.get('size') > 0 && model.get('size') !== _model.get('size')) {
                                model.set('size', _model.get('size'));
                            }

                            if (model.get('duration') === 0 && _model.get('duration') > 0 || model.get('duration') > 0 && _model.get('duration') > 0 && model.get('duration') !== _model.get('duration')) {
                                model.set('duration', _model.get('duration'));
                            }

                            model.set({
                                stream: _model.get('stream'),
                                stream_create: _model.get('stream_create'),
                                data: _.extend(model.get('data'), _model.get('data'))
                            });

                            collection.remove(model.get('id'));
                        }
                    });

                    collection = collection.toJSON();

                    if (collection.length >= this.getCollection().length / 2) {
                        this.set('collection', new ContentCollection(collection, { parse: true }));
                        this.trigger('update_new_collection').trigger('update_collection');
                    } else if (collection.length) {
                        this.getCollection().add(collection, { parse: true });
                        this.trigger('append_to_collection').trigger('update_collection');
                    }
                }
            }

            return this.getCollection();
        },
        getSearchCollection: function getSearchCollection(term, start, end) {
            if (!_.isNumber(start)) {
                start = 0;
            }

            if (_.isString(term) && term.length > 0) {
                var collection = this.getCollection().chain().filter(function (model) {
                    return model.get('name').toString().toLowerCase().indexOf(term) >= 0;
                });

                this.collection = new ContentCollection(collection.value());

                if (_.isNumber(end)) {
                    collection = collection.slice(start, end);
                    return new ContentCollection(collection.value());
                }

                return this.collection;
            } else {
                if (!_.isNumber(end)) {
                    end = this.default_slice_value;
                }
            }

            return this.getSliceCollection(start, end);
        },
        getSliceCollection: function getSliceCollection(start, end) {
            var collection = this.getCollection();
            this.collection = collection;

            return new ContentCollection(collection.slice(start, end));
        },
        setDownloadCollection: function setDownloadCollection(start, end) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                if (!_.isNumber(start)) {
                    start = 0;
                }

                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'popup',
                    action: 'get_downloads'
                }, function (response) {
                    try {
                        if (response.code == 0) {
                            var collection = response.collection;

                            if (!_.isArray(response.collection)) {
                                collection = _.values(response.collection);
                            }

                            if (!collection.length) {
                                throw new Error('Empty collection');
                            }

                            if (_.isNumber(end)) {
                                collection = collection.slice(start, end);
                            }

                            collection = new ContentCollection(collection, { parse: true });

                            _this4.set('collection', collection);
                            _this4.trigger('set_download_collection').trigger('update_collection');

                            resolve(collection);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        },
        getDownloadState: function getDownloadState() {
            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'popup',
                    action: 'get_download_state'
                }, function (response) {
                    try {
                        if (response.code === 0) {
                            resolve(response);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        },
        cancelDownload: function cancelDownload() {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'popup',
                    action: 'cancel_download'
                }, function (response) {
                    try {
                        if (response.code === 0) {
                            resolve();
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });

                _this5.getCollection().each(function (model) {
                    return model.cancelDownload(false).catch(function (e) {
                        return Skyload.setLog('Content model', 'Cancel download', e);
                    });
                });
                _this5.trigger('cancel_download');
            });
        },

        downloadSelected: function downloadSelected() {
            var group = _.now();

            var count = this.getCollection().chain().filter(function (model) {
                return model.get('selected');
            }).each(function (model) {
                return model.set('download_group', group).set('state', Skyload.DOWNLOAD_STATE_PENDING).download().catch(function (e) {
                    Skyload.setLog('Content model', 'Download selected error', e);
                });
            }).value().length;

            Skyload.Analytics('Multiupload', count);

            return this.trigger('download_selected');
        }
    });
});