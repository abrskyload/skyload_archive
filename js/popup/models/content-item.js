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

define('content_item_model', ['backbone', 'underscore', 'methods', 'common'], function (Backbone, _) {
    return Backbone.Model.extend({
        defaults: {
            id: null,
            index: null,
            source: null,
            type: null,
            cover: null,
            name: null,
            title: null,
            description: null,
            file: null,
            mime_type: null,

            selected: false,
            user_selected: false,

            download_id: null,
            download_progress: 0,
            download_pause: false,
            download_state: null,
            download_group: null,
            download_from: Skyload.DOWNLOAD_FROM_URL,

            stream: false,
            stream_create: false,

            fresh: false,

            size: 0,
            duration: 0,
            data: {}
        },
        idAttribute: 'id',
        lock: false,
        initialize: function initialize() {
            var _this = this;

            this._set = this.set;
            this.set = function (attributes, options) {
                if (_this.lock === false) {
                    _this._set(attributes, options);
                }

                return _this;
            };

            this.listenTo(this, 'change:selected', function (model, selected) {
                Skyload.App.getModel().trigger('select_model', model, selected);
            });
        },
        parse: function parse(attr) {
            try {
                attr.type = attr.type.toLowerCase();

                _.each(['title', 'description'], function (row) {
                    if (!_.isNull(attr[row])) {
                        attr[row] = _.escape(attr[row]);
                    }
                });

                if (_.isNull(attr.name) || !attr.name) {
                    attr.name = attr.title;
                }

                if (_.isString(attr.mime_type) && attr.mime_type.length) {
                    var type = Skyload.AvailableTypesByMimeType[attr.mime_type];

                    if (type && type !== attr.mime_type) {
                        attr.type = type;
                    }
                } else if (_.isString(attr.file) && attr.file.length) {
                    var ext = _.chain(Skyload.Methods.ParseURL(attr.file).path.split('.')).compact().last().value().toLowerCase();
                    var mime_type = [Skyload.AvailableMediaTypesByType[attr.type], ext].join('/');

                    switch (attr.type) {
                        case Skyload.TYPE_SOUND:
                            if (Skyload.AvailableAudioMimeTypes.indexOf(mime_type) < 0) {
                                mime_type = Skyload.AUDIO_MIME_TYPE_MP3;
                            }

                            break;
                        case Skyload.TYPE_VIDEO:
                            if (Skyload.AvailableVideoMimeTypes.indexOf(mime_type) < 0) {
                                mime_type = Skyload.VIDEO_MIME_TYPE_MPEG;
                            }

                            break;
                    }

                    attr.mime_type = mime_type;
                }
            } catch (e) {
                Skyload.setLog('Content Item View', 'Parse error', attr, e);
            }

            return attr;
        },
        validate: function validate(attr) {
            if (!_.isNull(attr.download_id) && !_.isNumber(attr.download_id)) {
                return 'Wrong download_id value';
            }

            if (!_.isString(attr.type) || _.indexOf(Skyload.AvailableTypes, attr.type.toString().toLowerCase()) < 0) {
                return 'Wrong type';
            }

            if (_.indexOf(Skyload.AvailableSource, attr.source.toString().toLowerCase()) < 0) {
                return 'Wrong source';
            }

            if (_.isNull(attr.mime_type) || !_.isString(attr.mime_type)) {
                return 'Wrong mime type';
            }
        },
        getIndex: function getIndex() {
            return this.collection.indexOf(this);
        },
        isStream: function isStream() {
            return this.get('stream');
        },
        isStreamCreate: function isStreamCreate() {
            return this.get('stream_create');
        },
        getTypeLocale: function getTypeLocale() {
            var types = Skyload.AvailableTypes;
            var type = this.get('type').toLowerCase();

            if (types.indexOf(type) >= 0) {
                return Skyload.getLocale(type);
            }

            return this.get('type');
        },
        getMimeType: function getMimeType() {
            return this.get('mime_type');
        },
        getFreshModel: function getFreshModel() {
            var _this2 = this;

            if (this.get('type') === Skyload.TYPE_VIDEO || this.get('source') === Skyload.SOURCE_WORLD_WIDE || this.get('fresh')) {
                return Promise.resolve(this);
            }

            return new Promise(function (resolve) {
                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'get_fresh_model',
                    type: _this2.get('type'),
                    index: _this2.get('index')
                }, function (response) {
                    try {
                        if (response.code === 1) {
                            throw new Error(response.message);
                        }

                        if (!('model' in response)) {
                            throw new Error('Response not have model');
                        }

                        var model = response.model;

                        _this2.set('file', model.play).set('cover', model.cover).set('fresh', true);

                        resolve(_this2);
                    } catch (e) {
                        resolve(_this2);
                    }
                });
            });
        },
        getNextModel: function getNextModel() {
            return this.collection.at(this.getIndex() + 1);
        },
        getPrevModel: function getPrevModel() {
            var index = this.getIndex();

            if (index === 0) {
                return null;
            }

            return this.collection.at(index - 1);
        },
        open: function open() {
            var _this3 = this;

            if (this.isStream()) {
                return Promise.reject(new Error('Is Stream'));
            }

            return this.getFreshModel().then(function (model) {
                return Skyload.OpenTab(model.get('file'));
            }).catch(function () {
                Skyload.OpenTab(_this3.get('file'));
            });
        },
        show: function show() {
            return this.download();
        },
        download: function download() {
            var _this4 = this;

            if (this.isStreamCreate()) {
                return Promise.reject(new Error('Stream create'));
            }

            return new Promise(function (resolve, reject) {
                try {
                    var type = _this4.get('type');

                    if (_this4.get('source') === Skyload.SOURCE_YOUTUBE) {
                        type = Skyload.TYPE_VIDEO;
                    }

                    var params = {
                        group: _this4.get('download_group'),
                        index: _this4.get('id'),
                        source: _this4.get('source')
                    };

                    switch (type) {
                        case Skyload.TYPE_SOUND:
                            if (Skyload.App.isSelectedMode()) {
                                if (Skyload.App.getModel().toSeparateDirectory()) {
                                    params = _.extend(params, { separate: true });
                                }
                            }

                            break;
                        case Skyload.TYPE_VIDEO:
                            params = _.extend(params, { id: _this4.get('data').id });
                            break;
                    }

                    Skyload.Download(type, _this4.get('index'), params).then(function (response) {
                        if (response.state === Skyload.DOWNLOAD_STATE_IN_PROGRESS && 'id' in response) {
                            _this4.set('download_id', response.id).set('download_group', null);
                        }

                        _this4.set('download_state', response.state);

                        resolve(_this4);
                        Skyload.Analytics('Download', _this4.get('type'));
                    }, reject);
                } catch (e) {
                    reject(e);
                }
            });
        },
        cancelDownload: function cancelDownload(send) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                if (_.isUndefined(send)) {
                    send = true;
                }

                var clear = function clear() {
                    _this5.set('download_progress', 0);
                    _this5.set('download_state', null);
                    _this5.set('download_pause', false);
                    _this5.set('download_id', null);
                    _this5.set('download_group', null);

                    _this5.lock = true;
                    setTimeout(function () {
                        return _this5.lock = false;
                    }, 1000);
                };

                if (send) {
                    Skyload.SendMessageFromPopupActionToBackground({
                        method: 'popup',
                        action: 'cancel_download_once',
                        index: _this5.get('id'),
                        type: _this5.get('type'),
                        id: _this5.get('download_id')
                    }, function (response) {
                        clear();

                        if (response.code === 0) {
                            resolve(_this5);
                        } else {
                            reject(new Error(response.message));
                        }
                    });
                } else {
                    clear();
                }
            });
        },
        pauseDownload: function pauseDownload() {
            var _this6 = this;

            if (this.isStream()) {
                return Promise.reject(new Error('Is Stream'));
            }

            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'popup',
                    action: 'pause_download',
                    index: _this6.get('id'),
                    type: _this6.get('type'),
                    id: _this6.get('download_id')
                }, function (response) {
                    if (response.code === 0) {
                        resolve(_this6);
                    } else {
                        reject(new Error(response.message));
                    }
                });
            });
        }
    });
});