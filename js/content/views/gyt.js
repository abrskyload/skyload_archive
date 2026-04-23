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

define('GYT', ['APP', 'backbone', 'underscore', 'jquery', 'url_video_parser', 'youtube'], function (Skyload, Backbone, _, $, urlVideoParser) {
    Skyload.Custodian.Require('GYT', function () {
        var GYT = _.extend({}, SkyloadDefaultComponents);

        GYT.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_YOUTUBE,
                delay: 1000
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new GYT.Settings();
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO, Settings.get('sig'));

        GYT.Views.Button = Backbone.View.extend({
            app: null,
            tagName: 'button',
            className: 'ytp-button ytp-download-button',
            template: _.template('<div class="ytp-download-button__icon"></div>'),
            events: {
                'mouseenter': 'control',
                'mouseleave': 'control',
                'click': 'openPanel'
            },
            render: function render(app) {
                this.app = app;

                this.$el.attr({
                    'tabindex': '100',
                    'aria-haspopup': 'true',
                    'aria-owns': 'yt-download-panel'
                }).html(this.template());

                this.app.markElem(this.$el, this.model);

                return this;
            },
            control: function control(e) {
                var show = e.type === 'mouseenter';
                var left = this.$el.offset().left;
                var $tooltip = this.app.$el.find('.ytp-top');

                $tooltip.removeAttr('style').removeAttr('class').addClass('ytp-tooltip ytp-top').css('left', left).find('.ytp-tooltip-text').text(Skyload.getLocale('download_video'));

                if (!show) {
                    $tooltip.hide();
                }
            },
            openPanel: function openPanel() {
                this.app.panel.open();
                return this;
            }
        });

        GYT.Views.Panel = Backbone.View.extend({
            tagName: 'div',
            className: 'ytp-download-panel',
            timeout: null,
            _open: false,
            template: _.template('<button class="ytp-button ytp-download-panel__button-close js-close">' + '<svg height="100%" viewBox="0 0 24 24" width="100%"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#fff"></path></svg>' + '</button>' + '<div class="ytp-download-panel__disclaimer"><%= disclaimer %></div>'),
            events: {
                'click .js-close': 'close'
            },
            render: function render() {
                var link = Skyload.getDetails().homepage_url + '?' + $.param({
                    lang: Skyload.getCurrentLocale(),
                    utm_source: 'youtube_embed',
                    utm_medium: 'cpc',
                    utm_content: this.model.get('id'),
                    utm_campaign: 'skyload_extension'
                });

                this.$el.attr({
                    'id': this.className,
                    'role': 'dialog'
                }).html(this.template({
                    disclaimer: _.template(Skyload.getLocale('disclaimer'))({ link: link })
                }));

                this.$el.append(new GYT.Views.Content({ model: this.model }).render().el);

                return this;
            },
            open: function open() {
                var _this = this;

                this.clear().$el.show();
                this.timeout = setTimeout(function () {
                    _this.$el.css('opacity', 1);
                }, 10);

                this._open = true;

                return this;
            },
            close: function close() {
                var _this2 = this;

                this.$el.css('opacity', 0);
                this.timeout = setTimeout(function () {
                    _this2.$el.hide();
                }, 250);

                this._open = false;

                return this;
            },
            clear: function clear() {
                clearTimeout(this.timeout);
                this.timeout = null;

                return this;
            },
            isOpen: function isOpen() {
                return this._open;
            }
        });

        GYT.Views.Content = Backbone.View.extend({
            tagName: 'div',
            className: 'ytp-download-panel__content',
            template: _.template('<div class="ytp-download-panel__content__wrapper">' + '<div class="ytp-download-panel__title"><%= title %></div>' + '<div class="ytp-download-panel__content__box ytp-download-panel__content-box-left js-action-box-left"></div>' + '<div class="ytp-download-panel__content__box ytp-download-panel__content-box-right js-action-box-right"></div>' + '<div class="x-clearfix"></div>' + '</div>'),
            render: function render() {
                var _this3 = this;

                this.$el.html($('<div>').addClass('ytp-download-panel__loading'));

                this.model.setVideoSize().then(function (model) {
                    _this3.$el.html(_this3.template({
                        title: Skyload.getLocale('acceptable_formats')
                    }));

                    var $left = _this3.$el.find('.js-action-box-left');
                    var $right = _this3.$el.find('.js-action-box-right');
                    var blocks = [0, 0];

                    _.each(Skyload.YouTube.GetTypesGroup(), function (item, format) {
                        var $box = void 0,
                            collection = _this3.model.getVideo().where({ format: format, without_audio: false });
                        var length = collection.length + 2;

                        if (_.first(blocks) > _.last(blocks)) {
                            $box = $right;
                            blocks[1] += length;
                        } else {
                            $box = $left;
                            blocks[0] += length;
                        }

                        var GroupContainer = new GYT.Views.Group({
                            collection: collection,
                            model: model
                        });

                        $box.append(GroupContainer.render(format, item).el);
                    });
                });

                return this;
            }
        });

        GYT.Views.Group = Backbone.View.extend({
            tagName: 'div',
            className: 'ytp-download-panel__group',
            template: _.template('<h3 class="ytp-download-panel__group__title"><%= format %></h3>'),
            format: null,
            render: function render(format, group) {
                var _this4 = this;

                this.format = format == 'Audio.MP4' ? Skyload.getLocale('mp4_audio') : format;

                if (!_.isUndefined(this.collection) && this.collection.length >= 1) {
                    this.$el.html(this.template({
                        format: this.format
                    }));

                    _.each(this.collection, function (model) {
                        model.set('id', _this4.model.get('id'));

                        var LinkView = new GYT.Views.Links({
                            model: _this4.model
                        });

                        _this4.$el.append(LinkView.render(model, group).el);
                    });
                }

                return this;
            }
        });

        GYT.Views.Links = Skyload.VideoView.extend({
            tagName: 'div',
            className: 'ytp-download-panel__item',
            template: _.template('<a href="javascript:void(0);" onclick="return false;" class="ytp-download-panel__link"><b><%= format %></b> (<%= quality %>)</a><span class="ytp-download-panel__info"><%= info %></span>'),
            events: {
                'click a': 'downloadVideo'
            },
            render: function render(model) {
                this.specialModel = model;

                this.$el.html(this.template({
                    format: this.specialModel.get('format'),
                    quality: this.specialModel.get('quality'),
                    info: this.specialModel.getSizeTitle()
                }));

                return this;
            },
            downloadVideo: function downloadVideo(e) {
                e.preventDefault();
                e.stopPropagation();

                this.download('GlobalYoutube');
            }
        });

        return Skyload.AppView.extend({
            button: null,
            panel: null,
            id: null,
            initialize: function initialize() {
                var _this5 = this;

                this.init();

                this.parse = true;
                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                this.listenToOnce(VideoCollection, 'reset', this.render);
                this.parseElem('button.ytp-download-button,body[' + attrId + ']', VideoCollection);

                this.on('change_access', function (access) {
                    if (!access.video) {
                        if (_this5.panel instanceof Backbone.View) {
                            if (_this5.panel.isOpen()) {
                                _this5.panel.close();
                            }
                        }
                    }
                });

                this.checkAccess();
            },
            render: function render() {
                var _this6 = this;

                setInterval(function () {
                    try {
                        if (!_.isNull(_this6.id) || !_this6.isActive()) {
                            return;
                        }

                        var parse = urlVideoParser.parse(location.href);

                        if (!_.isObject(parse) || parse.provider !== 'youtube') {
                            return;
                        }

                        _this6.id = parse.id;

                        if (_this6.id) {
                            var index = [Settings.get('sig'), _this6.id].join('_');
                            var model = VideoCollection.get(index);

                            if (model instanceof Backbone.Model && model.isCached()) {
                                _this6.setVideoTemplate(model);
                            } else {
                                Skyload.YouTube.Get(_this6.id).then(function (model) {
                                    return VideoCollection.save(model);
                                }).then(function (model) {
                                    return _this6.setVideoTemplate(model);
                                }).catch(function (e) {
                                    Skyload.setLog('Global YouTube', 'Error', e);

                                    _this6.id = null;
                                });
                            }
                        }
                    } catch (e) {
                        Skyload.setLog('Global YouTube', 'Parse error', e);
                    }
                }, Settings.get('delay'));

                return this;
            },
            setVideoTemplate: function setVideoTemplate(model) {
                var _this7 = this;

                this.button = new GYT.Views.Button({ model: model }).render(this);
                this.panel = new GYT.Views.Panel({ model: model }).render();

                var $player = this.$el.find('.html5-video-player');

                if ($player.hasClass('ytp-hide-info-bar')) {
                    if ($player.children('button').length) {
                        $player.children('button').last().after(this.button.el);
                    } else {
                        $player.append(this.button.el);
                    }
                } else {
                    this.$el.find('.ytp-chrome-top-buttons > button').last().after(this.button.el);
                }

                $player.append(this.panel.el);

                _.defer(function () {
                    if (!_this7.$el.find('[' + attrId + ']').length) {
                        _this7.markElem(_this7.$el, model);
                    }
                });

                Skyload.Analytics('Global Youtube', 'View', model.get('id'));

                return this;
            }
        });
    });
});