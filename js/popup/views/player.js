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

define('player_view', ['content_item_model', 'backbone', 'underscore', 'jquery', 'common'], function (ContentItemModel, Backbone, _, $) {
    return Backbone.View.extend({
        model: ContentItemModel,
        nextModel: null,
        prevModel: null,

        tabName: 'div',

        className: 'b-player',
        playClassName: 'm-player-play',
        openClassName: 'm-player-open',
        loadingClassName: 'm-player-loading',
        errorClassName: 'm-player-error',
        emptyPosterClassName: 'm-player-empty-poster',
        disabledNavigationClassName: 'm-player-disabled',
        downloadingClassName: 'm-player-downloading',
        downloadPendingClassName: 'm-player-download-pending',
        downloadPauseClassName: 'm-player-download-pause',
        downloadBufferClassName: 'm-player-download-buffer',
        downloadExistClassName: 'm-player-download-exist',

        template: _.template($('#template-player').html()),

        ready: false,
        play: true,
        timeDrag: false,

        bufferTimer: null,

        events: {
            'click .js-logo': 'goToSite',

            'click .js-driver': 'togglePlayPause',
            'click .js-toggle': 'togglePlayPause',

            'click .js-close': 'close',

            'click .js-prev:not(.m-player-disabled)': 'prev',
            'click .js-next:not(.m-player-disabled)': 'next',

            'click .js-open-file': 'openFile',
            'click .js-download': 'downloadFile',
            'click .js-show-download': 'showDownloadFile',
            'click .js-cancel-download': 'cancelDownloadFile',

            'mousedown .js-progress-bar': 'startDrag',
            'mouseup': 'stopDrag',
            'mousemove': 'changeDrag'
        },
        initialize: function initialize() {
            var _this = this;

            this.$el.addClass([this.playClassName, this.loadingClassName].join(' ')).html(this.template());

            this.$status = this.$el.find('.js-status');

            this.$wrapper = this.$el.find('.js-wrapper');
            this.$bg = this.$el.find('.js-bg');
            this.$media = this.$el.find('.js-media');

            this.$poster = this.$el.find('.js-poster');
            this.$name = this.$el.find('.js-name');
            this.$details = this.$el.find('.js-details');

            this.$prevButton = this.$el.find('.js-prev');
            this.$nextButton = this.$el.find('.js-next');

            this.$progressBar = this.$el.find('.js-progress-bar');
            this.$bufferBar = this.$el.find('.js-buffer-bar');
            this.$timeBar = this.$el.find('.js-time-bar');
            this.$currentTime = this.$el.find('.js-current-time');
            this.$durationTime = this.$el.find('.js-duration-time');

            this.$downloadProgress = this.$el.find('.js-download-progress');

            this.on('close', function () {
                setTimeout(function () {
                    return _this.clear();
                }, 500);
            });

            this.on('playback_error', function () {
                _this.$el.addClass(_this.errorClassName);
            });
        },
        open: function open() {
            return this.displayOpenClose(true);
        },
        close: function close() {
            return this.displayOpenClose(false);
        },
        clear: function clear() {
            this.ready = false;
            this.play = true;

            this.stopListening(this.model);

            this.$el.addClass(this.playClassName).removeClass(this.errorClassName);
            this.$el.find('audio, video, source').off().remove();

            this.$bufferBar.css('width', 0);
            this.$timeBar.css('width', 0);
            this.$downloadProgress.css('width', 0).show();
            this.$poster.removeAttr('style');
            this.$bg.removeAttr('style');

            clearTimeout(this.bufferTimer);

            return this;
        },
        prev: function prev() {
            if (this.prevModel instanceof ContentItemModel) {
                this.setModel(this.prevModel);

                Skyload.Analytics('Player', 'Prev');
            }

            return this;
        },
        next: function next() {
            if (this.nextModel instanceof ContentItemModel) {
                this.setModel(this.nextModel);

                Skyload.Analytics('Player', 'Next');
            }

            return this;
        },
        openFile: function openFile() {
            Skyload.Analytics('Player', 'Open file');

            return this.model.open().catch(function (e) {
                Skyload.setLog('Player view', 'Open error', e);
            });
        },
        downloadFile: function downloadFile() {
            Skyload.Analytics('Player', 'Download file');

            return this.model.set('download_group', null).download().catch(function (e) {
                Skyload.setLog('Player view', 'Download error', e);
            });
        },
        showDownloadFile: function showDownloadFile() {
            Skyload.Analytics('Player', 'Show file');

            return this.model.show().catch(function (e) {
                Skyload.setLog('Player view', 'Show download file error', e);
            });
        },
        cancelDownloadFile: function cancelDownloadFile() {
            Skyload.Analytics('Player', 'Cancel download');

            return this.model.cancelDownload(true).catch(function (e) {
                Skyload.setLog('Player view', 'Cancel download file error', e);
            });
        },
        render: function render() {
            var _this2 = this;

            this.listenTo(this.model, 'change:download_progress', this.setDownloadProgress);
            this.listenTo(this.model, 'change:download_state', this.setState);
            this.listenTo(this.model, 'change:download_pause', this.setPause);
            this.listenTo(this.model, 'change:size change:duration change:stream_create', this.setDescription);
            this.listenTo(this.model, 'change:download_from', this.setDownloadFrom);
            this.listenTo(this.model, 'change:download_id', this.setDownloadId);

            var type = this.model.get('type');
            var typeClassName = _.map(Skyload.AvailableTypes.concat(Skyload.AvailableSource), function (type) {
                return 'm-player-' + type;
            });

            this.$el.removeClass(typeClassName.concat([this.errorClassName, this.downloadingClassName, this.downloadPendingClassName, this.downloadPauseClassName, this.downloadBufferClassName, this.downloadExistClassName]).join(' ')).addClass(this.loadingClassName).addClass('m-player-' + type).addClass('m-player-' + this.model.get('source'));

            if (_.include([Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PENDING], this.model.get('download_state'))) {
                this.setState(this.model, this.model.get('download_state'));
            }

            if (this.model.get('download_pause') === true) {
                this.setPause(this.model, this.model.get('download_pause'));
            }

            if (_.isNumber(this.model.get('download_id'))) {
                this.setDownloadId(this.model, this.model.get('download_id'));
            }

            if (this.model.isStream()) {
                this.$el.addClass('m-content-item-stream');
            }

            this.$status.text([this.model.getIndex() + 1, '/', this.model.collection.length].join(''));

            this.$name.html(this.model.get('name')).attr('title', this.model.get('name'));
            this.setDescription();

            if (_.isNull(this.model.get('cover'))) {
                this.$el.addClass(this.emptyPosterClassName);
            } else {
                this.$el.removeClass(this.emptyPosterClassName);
                this.$poster.css('background-image', 'url(' + this.model.get('cover') + ')');
                this.$bg.css('background-image', 'url(' + this.model.get('cover') + ')');
            }

            if (this.prevModel instanceof ContentItemModel) {
                this.$prevButton.removeClass(this.disabledNavigationClassName).attr('title', this.prevModel.get('name'));
            } else {
                this.$prevButton.addClass(this.disabledNavigationClassName).removeAttr('title');
            }

            if (this.nextModel instanceof ContentItemModel) {
                this.$nextButton.removeClass(this.disabledNavigationClassName).attr('title', this.nextModel.get('name'));
            } else {
                this.$nextButton.addClass(this.disabledNavigationClassName).removeAttr('title');
            }

            this.model.getFreshModel().then(function () {
                var tag = Skyload.AvailableMediaTypesByType[type];

                _this2.$player = $('<' + tag + ' />').addClass('b-player__' + type + ' js-driver').attr({ preload: 'auto', autoplay: 'autoplay' });

                _this2.$source = $('<source />').attr({
                    src: _this2.model.get('file'),
                    type: _this2.model.getMimeType()
                });

                _this2.$player.html(_this2.$source);
                _this2.$media.html(_this2.$player);

                _this2.$player.on('error', function (e) {
                    _this2.trigger('playback_error', e);
                });

                _this2.$source.on('error', function (e) {
                    _this2.trigger('playback_error', e);
                });

                _this2.$player.on('loadedmetadata', function () {
                    var player = _this2.$player.get(0);

                    _this2.ready = true;
                    _this2.$durationTime.text(Skyload.Methods.TimeFormat(player.duration));

                    setTimeout(function () {
                        _this2.startBufferWatch();
                        _this2.$el.removeClass(_this2.loadingClassName);
                    }, 150);
                });

                _this2.$player.on('timeupdate', _.debounce(function () {
                    var player = _this2.$player.get(0);

                    var time = player.currentTime;
                    var percent = 100 * time / player.duration;

                    _this2.$currentTime.text(Skyload.Methods.TimeFormat(time));

                    if (!_this2.timeDrag) {
                        _this2.$timeBar.css('width', percent + '%');
                    }

                    _this2.trigger('time_update', percent, _this2.$player, _this2.model);
                }, 100));

                _this2.$player.on('ended', function () {
                    _this2.play = false;
                    _this2.$el.removeClass(_this2.playClassName);

                    _this2.trigger('ended', _this2.$player, _this2.model);
                });

                if (_this2.model.get('type') == Skyload.TYPE_SOUND && !_.isNull(_this2.model.get('cover'))) {
                    _this2.$poster.css('background-image', 'url(' + _this2.model.get('cover') + ')');
                }
            }).catch(function (e) {
                Skyload.setLog('Player view', 'Get fresh model error', e);
            });

            return this;
        },
        getDescription: function getDescription() {
            var data = this.model.get('data'),
                size = parseInt(this.model.get('size')),
                duration = parseInt(this.model.get('duration')),
                info = Skyload.Methods.ConvertMediaInfo(size, duration);

            var elem = _.template('<span class="i-player-title__details-elem"><%= text %></span>');
            var label = _.template('<span class="b-text-label i-player-title__details-elem"><%= text %></span>');
            var icon = _.template('<span class="b-player-icon i-player-title__details-elem"<% if(_.isString(icon)) { %> style="background-image: url(<%= icon %>);"<% } %>><%= text %></span>');

            var description = [elem({ text: Skyload.getLocale(this.model.get('type'), Skyload.LOCALE_STYLE_UPPER_CASE) })];

            if (_.include([Skyload.SOURCE_WORLD_WIDE, Skyload.SOURCE_GOOGLE_MUSIC], this.model.get('source'))) {
                description.push(icon({
                    icon: data.icon,
                    text: this.model.get('source') == Skyload.SOURCE_GOOGLE_MUSIC ? Skyload.getLocale('source_name_' + this.model.get('source')) : data.site_name
                }));
            } else {
                description.push(icon({
                    icon: false,
                    text: Skyload.getLocale('source_name_' + this.model.get('source'))
                }));
            }

            if (this.model.get('type') == Skyload.TYPE_VIDEO || this.model.get('source') == Skyload.SOURCE_WORLD_WIDE) {
                description.push(elem({ text: data.format.toUpperCase() }));
            } else {
                description.push(elem({ text: Skyload.AUDIO_FORMAT_MP3.toUpperCase() }));
            }

            switch (this.model.get('type')) {
                case Skyload.TYPE_SOUND:
                    if (_.isNumber(info.bitrate) && info.bitrate > 0) {
                        description.push(label({ text: info.bitrate + Skyload.getLocale('kbs') }));
                    } else if (this.model.get('source') == Skyload.SOURCE_WORLD_WIDE) {
                        description.push(elem({ text: '-' }));
                    }

                    break;
                case Skyload.TYPE_VIDEO:
                    if (data.quality) {
                        description.push(label({ text: data.quality }));
                    }

                    break;
            }

            if (info.size) {
                description.push(elem({ text: info.size + Skyload.getLocale(info.value) }));
            }

            return description.join('');
        },
        setDescription: function setDescription() {
            this.$details.html(this.getDescription());
            return this;
        },
        setModel: function setModel(model) {
            if (model instanceof ContentItemModel) {
                this.clear();

                this.model = model;
                this.nextModel = this.model.getNextModel();
                this.prevModel = this.model.getPrevModel();

                this.render();
            }

            return this;
        },
        startBufferWatch: function startBufferWatch() {
            var _this3 = this;

            var player = this.$player.get(0);
            var repeat = function repeat() {
                clearTimeout(_this3.bufferTimer);
                _this3.bufferTimer = setTimeout(function () {
                    return _this3.startBufferWatch();
                }, 500);
            };

            try {
                var buffer = player.buffered.end(0);
                var duration = player.duration;
                var percent = 100 * buffer / duration;

                this.$bufferBar.css('width', percent + '%');

                this.trigger('buffer', percent, this.$player, this.model);

                if (buffer < duration) {
                    repeat();
                }
            } catch (e) {
                Skyload.setLog('PlayerView', 'Buffer error', e);

                repeat();
            }

            return this;
        },
        startDrag: function startDrag() {
            if (!this.ready) {
                return this;
            }

            this.timeDrag = true;
            return this;
        },
        stopDrag: function stopDrag(e) {
            if (!this.ready) {
                return this;
            }

            if (this.timeDrag) {
                this.timeDrag = false;
                this.updateTimeBar(e.pageX);
            }

            return this;
        },
        changeDrag: function changeDrag(e) {
            if (!this.ready) {
                return this;
            }

            if (this.timeDrag) {
                this.updateTimeBar(e.pageX, false);
            }

            return this;
        },
        updateTimeBar: function updateTimeBar(x, update) {
            var player = this.$player.get(0);

            var duration = player.duration;
            var position = x - this.$progressBar.offset().left;
            var percentage = 100 * position / this.$progressBar.width();

            if (percentage > 100) {
                percentage = 100;
            }

            if (percentage < 0) {
                percentage = 0;
            }

            if (!_.isBoolean(update) || update === true) {
                player.currentTime = duration * percentage / 100;
            }

            this.$timeBar.css('width', percentage + '%');

            return this;
        },
        displayOpenClose: function displayOpenClose(value) {
            this.trigger(value ? 'open' : 'close', value, this.model);
            this.$el[value ? 'addClass' : 'removeClass'](this.openClassName);

            Skyload.Analytics('Player', value ? 'Open' : 'Close');

            return this;
        },
        togglePlayPause: function togglePlayPause() {
            if (!this.ready) {
                return this;
            }

            this.$el[this.play ? 'removeClass' : 'addClass'](this.playClassName);
            this.trigger('toggle', !this.play, this.$player, this.model);

            this.$player.get(0)[this.play ? 'pause' : 'play']();
            this.play = !this.play;

            Skyload.Analytics('Player', !this.play ? 'Pause' : 'Play');

            return this;
        },
        setDownloadProgress: function setDownloadProgress(model, percentage) {
            if (this.$downloadProgress) {
                if (_.isNull(percentage)) {
                    percentage = 0;
                }

                this.$downloadProgress.css({ width: percentage + '%' });

                if (percentage >= 100) {
                    this.$downloadProgress.fadeOut(1000);
                }
            }

            return this;
        },
        setState: function setState(model, state) {
            this.$el[state == Skyload.DOWNLOAD_STATE_IN_PROGRESS ? 'addClass' : 'removeClass'](this.downloadingClassName);
            this.$el[state == Skyload.DOWNLOAD_STATE_PENDING ? 'addClass' : 'removeClass'](this.downloadPendingClassName);

            if (_.isNull(state)) {
                this.setDownloadFrom(model, false);
            }

            if (state == Skyload.DOWNLOAD_STATE_COMPLETE) {
                this.setDownloadProgress(this.model, 100);
                this.$el.removeClass([this.downloadingClassName, this.downloadPendingClassName].join(' '));
            }

            return this;
        },
        setPause: function setPause(model, pause) {
            this.$el[pause ? 'addClass' : 'removeClass'](this.downloadPauseClassName);
            return this;
        },
        setDownloadFrom: function setDownloadFrom(model, from) {
            this.$el[from == Skyload.DOWNLOAD_FROM_BUFFER ? 'addClass' : 'removeClass'](this.downloadBufferClassName);
            return this;
        },
        setDownloadId: function setDownloadId(model, id) {
            this.$el[_.isNumber(id) && id > 0 ? 'addClass' : 'removeClass'](this.downloadExistClassName);
            return this;
        },
        goToSite: function goToSite() {
            Skyload.App.getMenu().goToSite();
        }
    });
});