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

define('content_item_view', ['content_item_model', 'backbone', 'underscore', 'jquery', 'common'], function (ContentItemModel, Backbone, _, $) {
    return Backbone.View.extend({
        model: ContentItemModel,

        tagName: 'div',

        className: 'b-content-item',
        selectedClassName: 'm-content-item-selected',
        emptyCoverClassName: 'm-content-item-cover-empty',
        streamClassName: 'm-content-item-stream',
        downloadingClassName: 'm-content-item-downloading',
        downloadPendingClassName: 'm-content-item-download-pending',
        downloadPauseClassName: 'm-content-item-download-pause',
        downloadBufferClassName: 'm-content-item-download-buffer',
        downloadExistClassName: 'm-content-item-download-exist',

        template: _.template($('#template-content-item').html()),

        mouseMoves: false,
        mouseMovesTimeout: null,

        events: {
            'click .js-body': 'select',
            'dblclick .js-body': 'open',

            'click .js-cover': 'play',

            'click .js-menu-select': 'select',
            'click .js-menu-open': 'open',
            'click .js-menu-show': 'show',
            'click .js-menu-play': 'play',

            'click .js-download-resume': 'select',
            'click .js-download-pause': 'pause',
            'click .js-download-cancel': 'cancel',

            'contextmenu': 'openMenu',
            'click .js-menu-button': 'openMenu',

            'mousemove': 'mouseMove',
            'mouseleave': 'mouseLeave'
        },
        initialize: function initialize() {
            this.listenTo(this.model, 'change:download_progress', this.setDownloadProgress);
            this.listenTo(this.model, 'change:download_state', this.setState);
            this.listenTo(this.model, 'change:download_pause', this.setPause);
            this.listenTo(this.model, 'change:selected', this.setSelected);
            this.listenTo(this.model, 'change:size change:duration change:stream_create', this.setDescription);
            this.listenTo(this.model, 'change:download_from', this.setDownloadFrom);
            this.listenTo(this.model, 'change:download_id', this.setDownloadId);
            this.listenTo(this.model, 'change:stream', this.setStream);

            if (_.isNull(this.model.get('cover'))) {
                this.$el.addClass(this.emptyCoverClassName);
            } else {
                this.$el.find('.js-poster').css('background-image', 'url(' + this.model.get('cover') + ')');
            }

            this.setSelected(this.model, this.model.get('selected'));

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
                this.setStream(this.model, this.model.isStream());
            }

            this.$el.addClass('m-content-item-' + this.model.get('type').toLowerCase()).addClass('m-content-item-' + this.model.get('source').toLowerCase()).data({ click: 0, click_timer: null });

            this.model.set('title', this.model.get('name'));

            if (this.model.get('download_progress') === 100) {
                this.model.set('download_progress', null);
            }
        },
        setTerm: function setTerm(term) {
            if (_.isString(term) && term.length) {
                this.model.set('title', this.model.get('name').replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<span class='b-text-highlight'>$1</span>"));
            }

            return this;
        },
        render: function render() {
            var data = this.model.get('data');

            this.$el.html(this.template(_.extend(this.model.toJSON(), {
                description_title: this.getDescription(Skyload.POPUP_CONTENT_ITEM_DES_SHORT_TITLE),
                description: this.getDescription(),
                type: this.model.getTypeLocale()
            })));

            if ('icon' in data && _.isString(data.icon) && data.icon.length) {
                this.$el.find('.js-icon').css('background-image', 'url(' + data.icon + ')');
            }

            this.$menu = this.$el.find('.js-menu');

            this.$progressBar = this.$el.find('.js-progress-bar');

            return this;
        },
        getDescription: function getDescription(version) {
            var description = [],
                data = this.model.get('data'),
                size = parseInt(this.model.get('size')),
                duration = parseInt(this.model.get('duration')),
                info = Skyload.Methods.ConvertMediaInfo(size, duration),
                label = _.template('- <%= text %>');

            if (_.isUndefined(version)) {
                version = Skyload.POPUP_CONTENT_ITEM_DES_SHORT;
            }

            if (version === Skyload.POPUP_CONTENT_ITEM_DES_SHORT) {
                label = _.template('<span class="b-text-label"><%= text %></span>');
            }

            if (!this.model.isStreamCreate()) {
                if (info.size) {
                    description.push(info.size + Skyload.getLocale(info.value));
                }

                switch (this.model.get('type')) {
                    case Skyload.TYPE_SOUND:
                        if (_.isNumber(info.bitrate) && info.bitrate > 0) {
                            description.push(label({ text: info.bitrate + Skyload.getLocale('kbs') }));
                        } else if (this.model.get('source') === Skyload.SOURCE_WORLD_WIDE) {
                            description.push('-');
                        }

                        if (this.model.get('source') === Skyload.SOURCE_WORLD_WIDE) {
                            description.push(data.format.toUpperCase());
                        }

                        break;
                    case Skyload.TYPE_VIDEO:
                        if (_.isString(data.format)) {
                            description.push('-');
                            description.push(data.format.toUpperCase());
                        }

                        if (data.quality) {
                            description.push(label({ text: data.quality }));
                        }

                        break;
                }
            }

            if (this.model.isStreamCreate()) {
                description.push(label({ text: Skyload.getLocale('stream_create', Skyload.LOCALE_STYLE_UPPER_CASE) }));
            } else if (this.model.isStream()) {
                description.push(label({ text: Skyload.getLocale('stream', Skyload.LOCALE_STYLE_UPPER_CASE) }));
            }

            return description.join(' ');
        },
        openMenu: function openMenu(e) {
            e.stopPropagation();

            var $elem = $(e.currentTarget);
            var $menu = this.$menu;

            if (!$elem || !$menu) {
                return false;
            }

            var isButton = $elem.data('menu') === 'button';

            var wh = Skyload.App.$el.height(),
                o = $elem.offset(),
                iw = this.$el.outerWidth(),
                ih = this.$el.outerHeight(),
                w = $menu.outerWidth(),
                h = $menu.outerHeight(),
                x = e.pageX - o.left,
                y = e.pageY - o.top,
                t = e.pageY,
                p = 10;

            var top = 6,
                left = iw - w - p;

            if (!isButton) {
                if (y) {
                    top = y;
                }

                left = x;

                if (left < p) {
                    left = p;
                } else if (left + w > iw - p) {
                    left = iw - w - p;
                }
            }

            if (t + h > wh) {
                top = -(ih - top) - h / 2;
            }

            $menu.css({ top: top, left: left }).fadeIn(100);

            return false;
        },
        closeMenu: function closeMenu() {
            if (this.$menu) {
                this.$menu.fadeOut(100);
            }

            return this;
        },
        mouseMove: function mouseMove(e) {
            this.mouseMoves = true;
        },
        mouseLeave: function mouseLeave() {
            var _this = this;

            this.mouseMoves = false;

            clearInterval(this.mouseMovesTimeout);

            this.mouseMovesTimeout = setTimeout(function () {
                if (!_this.mouseMoves) {
                    _this.closeMenu();
                }
            }, 500);
        },
        select: function select() {
            var _this2 = this;

            if (Skyload.App.isSelectedMode()) {
                var selected = !this.model.get('selected');

                this.model.set('selected', selected);
                this.model.set('user_selected', selected);

                Skyload.Analytics('Select', this.model.get('type'));
            } else {
                var data = this.$el.data();

                data.click++;

                if (data.click === 1) {
                    data.click_timer = setTimeout(function () {
                        _this2.model.set('download_group', null).download().catch(function (e) {
                            Skyload.setLog('Content item view', 'Download error', e);
                        });
                    }, 400);
                } else {
                    clearInterval(data.click_timer);
                    data.click = 0;
                    data.click_timer = null;

                    this.$el.data(data);
                }
            }

            this.closeMenu();

            return this;
        },
        open: function open(e) {
            e.preventDefault();
            e.stopPropagation();

            if (Skyload.App.isSelectedMode()) {
                this.$el.data('click', 0);
                this.select();
            } else {
                this.model.open().catch(function (e) {
                    Skyload.setLog('Content item view', 'Open file error', e);
                });
            }

            return this.closeMenu();
        },
        show: function show() {
            return this.select().closeMenu();
        },
        play: function play(e) {
            e.stopPropagation();

            if (!this.model.isStreamCreate()) {
                Skyload.Analytics('Play', this.model.get('type'));
                Skyload.App.getPlayer().setModel(this.model).open();
            }

            return this.closeMenu();
        },
        pause: function pause() {
            this.model.pauseDownload().catch(function (e) {
                Skyload.setLog('Content item view', 'Pause download error', e);
            });

            Skyload.Analytics('Pause', this.model.get('type'));

            this.closeMenu();

            return this;
        },
        cancel: function cancel() {
            this.model.cancelDownload().catch(function (e) {
                Skyload.setLog('Content item view', 'Cancel download error', e);
            });

            Skyload.Analytics('Cancel', this.model.get('type'));

            this.closeMenu();

            return this;
        },
        setDescription: function setDescription() {
            this.$el.find('.js-description').html(this.getDescription()).attr('title', this.getDescription(Skyload.POPUP_CONTENT_ITEM_DES_SHORT_TITLE));

            return this;
        },
        setDownloadProgress: function setDownloadProgress(model, percentage) {
            if (this.$progressBar) {
                if (_.isNull(percentage)) {
                    percentage = 0;
                }

                this.$progressBar.css({ width: percentage + '%' });

                if (percentage >= 100) {
                    this.$progressBar.fadeOut(1000);
                }
            }

            return this;
        },
        setState: function setState(model, state) {
            this.$el[state === Skyload.DOWNLOAD_STATE_IN_PROGRESS ? 'addClass' : 'removeClass'](this.downloadingClassName);
            this.$el[state === Skyload.DOWNLOAD_STATE_PENDING ? 'addClass' : 'removeClass'](this.downloadPendingClassName);

            if (_.isNull(state)) {
                this.setDownloadFrom(model, false);
            }

            if (state === Skyload.DOWNLOAD_STATE_COMPLETE) {
                this.setDownloadProgress(this.model, 100);
                this.$el.removeClass([this.downloadingClassName, this.downloadPendingClassName].join(' '));
            }

            return this;
        },
        setSelected: function setSelected(model, selected) {
            this.$el[selected ? 'addClass' : 'removeClass'](this.selectedClassName);
            return this;
        },
        setPause: function setPause(model, pause) {
            this.$el[pause ? 'addClass' : 'removeClass'](this.downloadPauseClassName);
            return this;
        },
        setDownloadFrom: function setDownloadFrom(model, from) {
            this.$el[from === Skyload.DOWNLOAD_FROM_BUFFER ? 'addClass' : 'removeClass'](this.downloadBufferClassName);
            return this;
        },
        setDownloadId: function setDownloadId(model, id) {
            this.$el[_.isNumber(id) ? 'addClass' : 'removeClass'](this.downloadExistClassName);
            return this;
        },
        setStream: function setStream(model, stream) {
            this.$el[stream ? 'addClass' : 'removeClass'](this.streamClassName);
            return this;
        }
    });
});