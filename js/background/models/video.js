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

define('video_model', ['content_model', 'backbone', 'underscore'], function (ContentModel, Backbone, _) {
    return ContentModel.extend({
        storeName: Skyload.TYPE_VIDEO,
        defaults: {
            index: null,
            id: 0,
            download_id: null,
            source: null,
            play: null,
            name: null,
            des: null,
            cover: null,
            duration: 0,
            genre: null,
            cache: false,
            sync: true,
            import: false,
            size: 0,
            quality: null,
            stream: false,
            stream_create: false,
            x_stream: null,
            data: {},
            dt: _.now(),
            type: Skyload.TYPE_VIDEO
        },
        getVideo: function getVideo() {
            var videos = this.get('play');

            if (!(videos instanceof Backbone.Collection)) {
                if (_.isArray(videos)) {
                    videos = new Skyload.Collections.VideoItemCollection(videos);
                }
            }

            return videos;
        },
        setDownloadId: function setDownloadId(downloadId, id) {
            var collection = this.getVideo();
            var model = collection.get(id);

            if (model instanceof Backbone.Model) {
                model.set('download_id', downloadId);
                this.set('play', collection.toJSON()).save();
            }
        },
        setVideoSize: function setVideoSize() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var collection = _this.getVideo();

                if (_this.isStream()) {
                    var first = collection.at(1);

                    if (!(first instanceof Backbone.Model)) {
                        first = collection.first();
                    }

                    if (first instanceof Backbone.Model) {
                        first.getSize().then(function (size) {
                            size = size * collection.length;

                            _this.set('size', size);
                            resolve(_this);
                        }).catch(function () {
                            return Skyload.Methods.FetchBuffer(first.get('url'));
                        }).then(function (response) {
                            var size = 0;

                            if (response.size > 0) {
                                size = response.size;
                            } else {
                                var buffer = new Uint8Array(response.buffer);
                                var blob = new Blob([buffer], { type: Skyload.VIDEO_MIME_TYPE_MP4 });

                                if (blob.size) {
                                    size = blob.size;
                                }
                            }

                            if (!size) {
                                throw new Error('Unable to determine the size of the file');
                            } else {
                                size = size * collection.length;
                            }

                            _this.set('size', size);
                            resolve(_this);
                        }).catch(function (e) {
                            reject(e);
                        });
                    } else {
                        reject(new Error('Not found first video item model to get stream size'));
                    }
                } else {
                    var callback = _.after(collection.length, function () {
                        _this.save();
                        resolve(_this);
                    });

                    collection.each(function (model) {
                        model.getSize().then(callback, callback);
                    });
                }
            });
        },
        getContentModel: function getContentModel() {
            var _this2 = this;

            var data = this.getDataModel();

            var model = {
                id: this.get('index'),
                index: this.get('index'),
                type: this.get('type'),
                source: this.get('source'),
                cover: this.get('cover'),
                stream: this.get('stream'),
                stream_create: this.get('stream_create')
            };

            if (this.isStream()) {
                model = _.extend(model, {
                    title: this.get('name'),
                    file: data.get('file'),
                    mime_type: this.get('mime_type'),
                    size: this.get('size'),
                    data: _.extend(data.toJSON(), {
                        id: this.get('index'),
                        format: Skyload.VIDEO_FORMAT_MP4,
                        quality: this.get('quality')
                    })
                });
            } else {
                var videos = this.getVideo();

                if (videos instanceof Backbone.Collection) {
                    var size = 0,
                        quality = null;

                    var defaultVideoModel = videos.get(Skyload.DEFAULT_NAME_VIDEO_ITEM);

                    if (defaultVideoModel instanceof Backbone.Model) {
                        size = defaultVideoModel.get('size');
                        quality = defaultVideoModel.get('quality');
                    }

                    var defaultModel = _.extend(model, {
                        index: this.get('index'),
                        title: this.get('name')
                    });

                    var defaultData = _.extend(data.toJSON(), {
                        duration: this.get('duration')
                    });

                    model = videos.map(function (video) {
                        return _.extend(_.clone(defaultModel), {
                            id: [_this2.get('index'), video.get('index')].join('_'),

                            file: video.get('url'),
                            size: video.get('size') || size,
                            duration: _this2.get('duration'),

                            download_id: video.get('download_id'),

                            data: _.extend(_.clone(defaultData), {
                                id: video.get('index'),
                                quality: video.get('quality') || quality,
                                format: video.get('format')
                            })
                        });
                    });
                } else {
                    return [];
                }
            }

            return model;
        },
        getDownloadModel: function getDownloadModel(id) {
            var model = {
                index: this.get('index'),
                type: this.get('type'),
                source: this.get('source'),
                stream: this.get('stream')
            };

            var data = this.getDataModel();

            if (this.isStream()) {
                model.size = this.get('size');
                model.filename = Skyload.Methods.GetClearFileName(this.get('name') + Skyload.DOWNLOAD_FILE_SIG + '.' + Skyload.VIDEO_FORMAT_MP4);
            } else {
                var videos = this.getVideo();

                if (videos instanceof Backbone.Collection) {
                    var vid = id;
                    var video = videos.get(vid);

                    if (video instanceof Backbone.Model) {
                        model.index = [this.get('index'), vid].join('_');

                        model.url = video.get('url');
                        model.size = video.get('size');

                        model.filename = Skyload.Methods.GetClearFileName(this.get('name') + ' (' + video.get('quality') + ')') + Skyload.DOWNLOAD_FILE_SIG + '.' + video.get('format').toLowerCase();

                        data.set('index', this.get('index')).set('id', video.get('index'));
                    } else {
                        return null;
                    }
                }
            }

            model.data = data.toJSON();

            return model;
        }
    });
});