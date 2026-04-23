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

define('download_model', ['data_base_model', 'id3writer', 'deezer_decoder', 'stream', 'backbone', 'underscore', 'jquery'], function (DataBaseModel, Writer, DeezerDecoder, Stream, Backbone, _, $) {
    return DataBaseModel.extend({
        storeName: 'download',
        defaults: {
            id: null,
            type: null,
            index: null,
            data: {},
            environment: Skyload.ENVIRONMENT_CONTENT,
            params: {},
            origin_url: null,
            url: null,
            filename: null,
            source: null,
            state: Skyload.DOWNLOAD_STATE_IN_PROGRESS,
            progress: 0,
            progress_interval: null,
            from: Skyload.DOWNLOAD_FROM_URL,

            x_buffer: null,
            x_writer: null,
            x_stream: null,

            stream: false,

            pause: false,
            group: null,
            size: 0,
            dt: _.now()
        },
        idAttribute: 'index',
        check_interval: null,
        initialize: function initialize() {
            var _this = this;

            var startCheck = function startCheck() {
                clearInterval(_this.check_interval);

                _this.check_interval = setInterval(function () {
                    if (_this.get('state') === Skyload.DOWNLOAD_STATE_COMPLETE) {
                        return clearInterval(_this.check_interval);
                    }

                    _this.getDownloadItemById().then(function (item) {
                        if (item.state === Skyload.DOWNLOAD_STATE_COMPLETE && _this.get('state') !== Skyload.DOWNLOAD_STATE_COMPLETE) {
                            _this.set('state', item.state).save();
                        }
                    }).catch(function () {});
                }, 1000);
            };

            this.set('origin_url', this.get('url'));

            this.listenTo(this, 'change:state', function (model, state) {
                if (state === Skyload.DOWNLOAD_STATE_IN_PROGRESS) {
                    startCheck();
                } else if (_.include([Skyload.DOWNLOAD_STATE_INTERRUPTED, Skyload.DOWNLOAD_STATE_COMPLETE], state)) {
                    clearInterval(_this.check_interval);
                    setTimeout(function () {
                        return _this.clear();
                    }, 1000);
                }
            });

            this.listenTo(this, 'destroy', function () {
                clearInterval(_this.check_interval);

                _this.stopWatchProgress();
                _this.clear();
            });

            startCheck();
        },
        toJSON: function toJSON() {
            var json = _.clone(this.attributes);

            delete json['progress_interval'];
            delete json['x_buffer'];
            delete json['x_writer'];
            delete json['x_stream'];

            return json;
        },
        getId: function getId() {
            return this.get('id');
        },
        getIndex: function getIndex() {
            switch (this.get('type')) {
                case Skyload.TYPE_SOUND:
                    return this.get('index');

                case Skyload.TYPE_VIDEO:
                    if (this.isStream()) {
                        return this.get('index');
                    }

                    return [this.get('data').index, this.get('data').id].join('_');
            }

            return null;
        },
        getFileBuffer: function getFileBuffer() {
            var _this2 = this;

            if (this.get('source') === Skyload.SOURCE_GOOGLE_MUSIC) {
                return new Promise(function (resolve, reject) {
                    var resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

                    resolveLocalFileSystemURL(_this2.get('url'), function (fileEntry) {
                        fileEntry.file(function (file) {
                            var fileReader = new FileReader();

                            fileReader.onerror = function (e) {
                                reject(new Error(e.currentTarget.error.message));
                            };

                            fileReader.onload = function () {
                                var buffer = fileReader.result;

                                resolve({
                                    buffer: buffer,
                                    size: buffer.length
                                });
                            };

                            fileReader.readAsArrayBuffer(file);
                        });
                    });
                });
            } else {
                return Skyload.Methods.FetchBuffer(this.get('url'), function (progress) {
                    progress = (progress.loaded / (progress.total / 100)).toFixed(2);
                    _this2.set('progress', progress);
                }, function (xhr) {
                    _this2.setBuffer(xhr);
                });
            }
        },
        getURL: function getURL() {
            var _this3 = this;

            try {
                var model = this.getContentModel();

                if (!(model instanceof Backbone.Model)) {
                    throw new Error('Not found content model');
                }

                if (this.get('type') === Skyload.TYPE_SOUND && this.isStream() && this.get('source') !== Skyload.SOURCE_GOOGLE_MUSIC || this.get('type') === Skyload.TYPE_VIDEO && !this.isStream() || this.get('type') === Skyload.TYPE_SOUND && !_.include([Skyload.AUDIO_MIME_TYPE_MP3, Skyload.AUDIO_MIME_TYPE_MPEG], model.get('mime_type'))) {
                    return Promise.resolve(this.get('url'));
                }

                switch (this.get('type')) {
                    case Skyload.TYPE_SOUND:
                        var cover = new Promise(function (resolve) {
                            if (!_.isNull(model.getCover())) {
                                Skyload.Methods.FetchBuffer(model.getCover()).then(function (response) {
                                    resolve(response.buffer);
                                }).catch(function (e) {
                                    resolve(null);
                                    Skyload.setLog('Download model', 'Error fetch cover buffer', e);
                                });
                            } else {
                                resolve(null);
                            }
                        }).catch(function (e) {
                            Skyload.setLog('Download model', 'Error fetch cover', e);

                            return null;
                        });

                        this.set('state', Skyload.DOWNLOAD_STATE_IN_PROGRESS).set('from', Skyload.DOWNLOAD_FROM_BUFFER).save();

                        return this.getFileBuffer().then(function (response) {
                            var buffer = response.buffer;

                            if (_this3.get('source') === Skyload.SOURCE_DEEZER) {
                                buffer = DeezerDecoder(buffer, model.get('id'));
                            }

                            var writer = new Writer(buffer);

                            writer.setFrame(Skyload.ID3_WRITER_NAME, model.get('name')).setFrame(Skyload.ID3_WRITER_AUTHOR, model.get('author'));

                            writer.setFrame(Skyload.ID3_WRITER_ARTISTS, _.isArray(model.get('artists')) && model.get('artists').length ? model.get('artists') : [model.get('author')]);

                            if (!_.isNull(model.get('album'))) {
                                writer.setFrame(Skyload.ID3_WRITER_ALBUM, model.get('album'));
                            }

                            if (!_.isNull(model.get('genre'))) {
                                writer.setFrame(Skyload.ID3_WRITER_GENRE, model.get('genre').split(';'));
                            }

                            if (!_.isNull(model.get('position'))) {
                                writer.setFrame(Skyload.ID3_WRITER_POSITION, parseInt(model.get('position')));
                            }

                            if (!_.isNull(model.get('year'))) {
                                writer.setFrame(Skyload.ID3_WRITER_YEAR, parseInt(model.get('year')));
                            }

                            if (model.get('duration') > 0) {
                                writer.setFrame(Skyload.ID3_WRITER_DURATION, parseInt(model.get('duration') * 1000));
                            }

                            return cover.then(function (cover) {
                                if (!_.isNull(cover)) {
                                    writer.setFrame(Skyload.ID3_WRITER_COVER, {
                                        type: 3,
                                        data: cover,
                                        description: model.get('album') || model.get('name')
                                    });
                                }

                                writer.addTag();

                                _this3.setWriter(writer);
                                _this3.set('url', writer.getURL()).save();

                                cover = null;
                                buffer = null;

                                return _this3.get('url');
                            });
                        }).catch(function (e) {
                            Skyload.setLog('Download model', 'Fetch buffer error', e);

                            _this3.clear();

                            _this3.set('url', _this3.get('origin_url')).set('from', Skyload.DOWNLOAD_FROM_URL).save();

                            return _this3.get('url');
                        });

                    case Skyload.TYPE_VIDEO:
                        if (this.isStream()) {
                            var playlist = model.getVideo().map(function (video) {
                                return video.get('url');
                            });
                            var stream = new Stream(playlist, Skyload.VIDEO_MIME_TYPE_MP4, model.get('size') * 2.5, Skyload.VIDEO_FORMAT_MP4);

                            stream.onProgress(function (percent) {
                                _this3.set('state', Skyload.DOWNLOAD_STATE_IN_PROGRESS).set('progress', percent);
                            }).onUpdateSize(function (size) {
                                _this3.set('size', size);
                                model.set('size', size);
                            });

                            this.set('from', Skyload.DOWNLOAD_FROM_BUFFER).set('state', Skyload.DOWNLOAD_STATE_IN_PROGRESS);

                            this.setStream(stream);

                            return stream.getURL().then(function (url) {
                                _this3.set('url', url).save();

                                return _this3.get('url');
                            });
                        }

                        break;
                }
            } catch (e) {
                Skyload.setLog('Download model', 'Get url error', e);
            }

            return Promise.resolve(this.get('url'));
        },
        startWatchProgress: function startWatchProgress() {
            var _this4 = this;

            return this.stopWatchProgress().getDownloadItem().then(function (item) {
                if (_this4.get('from') === Skyload.DOWNLOAD_FROM_URL) {
                    var delay = item.totalBytes / 100 / 1000;

                    if (delay < 500) {
                        delay = 500;
                    } else if (delay > 10000) {
                        delay = 10000;
                    }

                    var interval = setInterval(function () {
                        _this4.getDownloadItem().then(function (item) {
                            if (item.state === Skyload.DOWNLOAD_STATE_IN_PROGRESS) {
                                var progress = (item.bytesReceived / (item.totalBytes / 100)).toFixed(2);

                                _this4.set('progress', progress).save();
                            }
                        }).catch(function (e) {
                            _this4.stopWatchProgress();
                            Skyload.setLog('Download', 'Progress interval error', e);
                        });
                    }, delay);

                    _this4.set('progress_interval', interval);
                }
            });
        },
        stopWatchProgress: function stopWatchProgress() {
            clearInterval(this.get('progress_interval'));
            this.set('progress_interval', null);

            return this;
        },
        isExist: function isExist() {
            var _this5 = this;

            return this.getDownloadItem().then(function (item) {
                var remove = !item.exists;

                if (remove) {
                    _this5.destroy();
                }

                return !remove;
            });
        },
        searchDownloadItems: function searchDownloadItems(params) {
            return new Promise(function (resolve, reject) {
                chrome.downloads.search(params, function (list) {
                    if (_.size(list) >= 1) {
                        resolve(list);
                    } else {
                        reject();
                    }
                });
            });
        },
        getDownloadItem: function getDownloadItem() {
            var _this6 = this;

            if (this.getId() <= 0 || !this.get('url') || !this.get('origin_url')) {
                return Promise.reject(new Error('Bad params to search'));
            }

            return this.searchDownloadItems({ id: this.getId() }).catch(function () {
                return _this6.searchDownloadItems({ url: _this6.get('url') });
            }).catch(function () {
                return _this6.searchDownloadItems({ url: _this6.get('origin_url') });
            }).then(function (list) {
                return _.chain(list).filter(function (item) {
                    return _.include([Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_COMPLETE], item.state);
                }).last().value();
            }).then(function (item) {
                if (!_.isObject(item)) {
                    throw new Error('Not found download item');
                }

                return item;
            }).then(function (item) {
                _this6.set('id', item.id).set('state', item.state).save();

                return item;
            });
        },
        getDownloadItemById: function getDownloadItemById() {
            if (_.isNull(this.getId()) || this.getId() < 1) {
                return Promise.reject(new Error('Id is not valid'));
            }

            return this.searchDownloadItems({ id: this.getId() }).then(function (list) {
                return _.last(list);
            });
        },
        isCompleted: function isCompleted() {
            return this.get('state') === Skyload.DOWNLOAD_STATE_COMPLETE && this.getId() > 0;
        },
        download: function download() {
            var _this7 = this;

            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(_this7.getDownloadItem().then(function (item) {
                        if (_this7.isStream()) {
                            throw new Error('Item is stream');
                        }

                        if (_this7.get('source') === Skyload.SOURCE_WORLD_WIDE) {
                            throw new Error('World wide file');
                        }

                        if (!item.exists) {
                            throw new Error('Item not exist');
                        }

                        if (item.filename.indexOf(_this7.get('filename')) < 0) {
                            throw new Error('Wrong filename');
                        }

                        if (_.isNull(_this7.get('group'))) {
                            _this7.show();
                        }

                        return _.extend(_this7.toJSON(), {
                            index: _this7.getIndex()
                        });
                    }).catch(function () {
                        var model = _this7.getContentModel();

                        if (_this7.get('type') == Skyload.TYPE_SOUND && model instanceof Backbone.Model) {
                            return model.getFreshModel().then(function (model) {
                                _this7.set('url', model.get('play')).save();

                                return _this7.get('url');
                            });
                        }

                        return _this7.get('url');
                    }).then(function () {
                        return _this7.getURL();
                    }).then(function (url) {
                        return new Promise(function (resolve, reject) {
                            var data = _this7.getDataModel();
                            var model = _this7.getContentModel();

                            chrome.downloads.download({
                                url: url,
                                filename: _this7.get('filename'),
                                conflictAction: 'uniquify',
                                method: 'GET'
                            }, function (id) {
                                try {
                                    if ('lastError' in chrome.runtime && chrome.runtime.lastError) {
                                        throw new Error(chrome.runtime.lastError.message, Skyload.ERROR_CHROME_LAST_ERROR);
                                    }

                                    if (!_.isNumber(id)) {
                                        throw new Error('ID not a number (' + $.type(id) + ')');
                                    }

                                    model.setDownloadId(id, data.get('id'));

                                    _this7.set('id', id).set('state', Skyload.DOWNLOAD_STATE_IN_PROGRESS).save();

                                    resolve(_.extend(_this7.toJSON(), {
                                        index: _this7.getIndex()
                                    }));
                                } catch (e) {
                                    Skyload.setLog('Download model', 'Download error', e);

                                    reject(e);
                                }
                            });
                        });
                    }).catch(function (e) {
                        Skyload.Analytics('Download', 'Error', e.message);

                        _this7.destroy();
                        _this7.clear();

                        return Promise.reject(e);
                    }));
                }, 300);
            });
        },
        pause: function pause() {
            var _this8 = this;

            return new Promise(function (resolve, reject) {
                try {
                    if (_this8.getId() > 0) {
                        chrome.downloads.pause(_this8.getId(), function () {
                            _this8.set('pause', true);

                            resolve(_this8);
                        });
                    } else {
                        throw new Error('');
                    }
                } catch (e) {
                    reject(e);
                }
            });
        },
        resume: function resume() {
            var _this9 = this;

            return new Promise(function (resolve) {
                chrome.downloads.resume(_this9.getId(), function () {
                    _this9.setPause(false);

                    resolve(_this9);
                });
            });
        },
        cancel: function cancel() {
            var _this10 = this;

            this.setState(Skyload.DOWNLOAD_STATE_USER_CANCELED);

            return new Promise(function (resolve) {
                var model = _this10.getContentModel();
                var data = _this10.getDataModel();

                if (model instanceof Backbone.Model) {
                    model.setDownloadId(null, data.get('id'));
                }

                if (_this10.getId() > 0) {
                    chrome.downloads.cancel(_this10.getId());
                }

                _this10.clear();
                _this10.stopWatchProgress();

                _this10.destroy({
                    success: function success() {
                        resolve(_this10);
                    }
                });
            });
        },
        clear: function clear() {
            var writer = this.getWriter(),
                stream = this.getStream(),
                buffer = this.getBuffer();

            if (writer instanceof Writer) {
                writer.revokeURL();
            }

            if (stream instanceof Stream) {
                stream.stop();
            }

            if (buffer instanceof XMLHttpRequest) {
                buffer.abort();
            }

            this.setWriter(null);
            this.setStream(null);
            this.setBuffer(null);

            this._previousAttributes = this.attributes;

            return this;
        },
        show: function show() {
            if (this.isCompleted()) {
                chrome.downloads.show(this.getId());
            }

            return this;
        },
        setState: function setState(state) {
            return this.set('state', state).save();
        },
        setPause: function setPause(pause) {
            return this.set('pause', pause).save();
        },
        setBuffer: function setBuffer(buffer) {
            return this.set('x_buffer', buffer);
        },
        setWriter: function setWriter(writer) {
            return this.set('x_writer', writer);
        },
        setStream: function setStream(stream) {
            return this.set('x_stream', stream);
        },
        getBuffer: function getBuffer() {
            return this.get('x_buffer');
        },
        getWriter: function getWriter() {
            return this.get('x_writer');
        },
        getStream: function getStream() {
            return this.get('x_stream');
        },
        getContentModel: function getContentModel() {
            var model = null;

            switch (this.get('type')) {
                case Skyload.TYPE_SOUND:
                    model = Skyload.Cache.Sound.get(this.get('index'));

                    break;
                case Skyload.TYPE_VIDEO:
                    var index = this.get('data').index || this.get('index');
                    model = Skyload.Cache.Video.get(index);

                    break;
            }

            return model;
        },
        getContent: function getContent() {
            try {
                var data = this.get('data');
                var model = this.getContentModel();

                if (model instanceof Backbone.Model) {
                    var item = model.getContentModel();

                    if (model.get('type') === Skyload.TYPE_VIDEO && !model.isStream()) {
                        var id = [data.index, data.id].join('_');

                        item = _.findWhere(item, { id: id });
                    }

                    if (!item || _.isEmpty(item)) {
                        throw new Error('Empty content');
                    }

                    return _.extend(item, {
                        download_id: this.getId(),
                        download_pause: this.get('pause'),
                        download_state: this.get('state'),
                        download_group: this.get('group')
                    });
                }

                throw new Error('Not found model');
            } catch (e) {
                Skyload.setLog('Download model', 'Get content error', e);
            }

            return [];
        }
    });
});