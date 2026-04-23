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

define('sound_model', ['content_model', 'underscore'], function (ContentModel, _) {
    return ContentModel.extend({
        storeName: Skyload.TYPE_SOUND,
        defaults: {
            index: null,
            id: 0,
            download_id: null,
            source: null,
            play: null,
            album: null,
            author: 'Author',
            artists: [],
            name: 'Name',
            genre: null,
            version: null,
            year: null,
            position: null,
            label: null,
            duration: 0,
            cover: null,
            sync: true,
            size: 0,
            data: {},
            cache: false,
            import: false,
            mime_type: null,
            stream: false,
            stream_create: false,
            x_stream: null,
            dt: _.now(),
            type: Skyload.TYPE_SOUND
        },
        getName: function getName() {
            var name = [this.get('author'), this.get('name')].join(' - ');

            if (!_.isNull(this.get('version'))) {
                name += ' (' + this.get('version') + ')';
            }

            return name;
        },
        getContentModel: function getContentModel() {
            return {
                id: this.get('index'),
                index: this.get('index'),
                type: this.get('type'),
                source: this.get('source'),
                cover: this.get('cover'),
                stream: this.get('stream'),
                stream_create: this.get('stream_create'),
                title: [this.get('author'), this.get('name')].join(' - '),
                file: this.get('play'),
                mime_type: this.get('mime_type'),
                download_id: this.get('download_id'),
                size: this.get('size'),
                duration: this.get('duration'),
                data: this.get('data')
            };
        },
        getDownloadModel: function getDownloadModel() {
            var model = {
                index: this.get('index'),
                url: this.get('play'),
                size: this.get('size'),
                type: this.get('type'),
                source: this.get('source'),
                stream: this.get('stream')
            };

            var data = this.getDataModel();
            var format = Skyload.AUDIO_FORMAT_MP3;

            if (this.get('source') === Skyload.SOURCE_WORLD_WIDE && data.hasFormat()) {
                format = data.get('format');
            }

            model.filename = Skyload.Methods.GetClearFileName(this.getName()) + '.' + format;
            model.data = data.toJSON();

            return model;
        },
        getFreshModel: function getFreshModel() {
            var _this = this;

            var sources = [Skyload.SOURCE_YANDEX, Skyload.SOURCE_ODNOKLASSNIKI, Skyload.SOURCE_SOUNDCLOUD];

            sources.push(Skyload.SOURCE_VK);

            if (_.include(sources, this.get('source'))) {
                var data = this.getDataModel();

                var params = [this.get('id')];

                switch (this.get('source')) {
                    case Skyload.SOURCE_SOUNDCLOUD:
                        params = [data.get('link')];

                        break;
                    case Skyload.SOURCE_VK:
                        params = [data.get('download_id')];

                        break;
                }

                return Skyload.CallProcedure(this.get('source'), params).then(function (model) {
                    _this.set('play', model.play).set('dt', _.now());

                    if ('position' in model) {
                        _this.set('position', model.position);
                    }

                    if ('year' in model) {
                        _this.set('year', model.year);
                    }

                    return _this;
                }).catch(function (e) {
                    Skyload.setLog('Sound model', 'Get fresh model error', e);

                    return _this;
                });
            }

            return Promise.resolve(this);
        }
    });
});