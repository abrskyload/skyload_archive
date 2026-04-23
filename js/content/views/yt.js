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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define('YT', ['APP', 'backbone', 'underscore', 'jquery', 'url_video_parser', 'youtube'], function (Skyload, Backbone, _, $, urlVideoParser) {
    Skyload.Custodian.Require('YT', function () {
        var YT = _.extend({
            THEME_CLASSIC: 'classic',
            THEME_MATERIAL: 'material'
        }, SkyloadDefaultComponents);

        YT.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_YOUTUBE,
                delay: 1000
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new YT.Settings();
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO, Settings.get('sig'));

        YT.Views.MenuButton = Backbone.View.extend({
            tagName: 'span',
            open: false,
            template: _.template('\
                <button id="<%= id %>" type="button" class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip" onclick="return false;" title="<%= download_title %>" data-button-toggle="true" data-trigger-for="action-panel-download" data-upsell="download" role="button">\
                    <span class="yt-uix-button-icon-wrapper">\
                        <img class="yt-uix-button-icon yt-uix-button-icon-action-panel-report" src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" />\
                    </span>\
                    <span class="yt-uix-button-content"><%= download %></span>\
                </button>\
            '),
            events: {
                'click button': 'controlTab'
            },
            render: function render() {
                this.$el.html(this.template({
                    id: 'action-button-download',
                    download_title: Skyload.getLocale('download_video_sc'),
                    download: Skyload.getLocale('download')
                }));

                return this;
            },
            controlTab: function controlTab() {
                this.open = !this.open;

                Skyload.Analytics('Youtube', (this.open ? 'Open' : 'Close') + ' download tab', this.model.get('id'));

                return this;
            },
            isOpen: function isOpen() {
                return this.open;
            }
        });

        YT.Views.Container = Backbone.View.extend({
            tagName: 'div',
            className: 'action-panel-content action-panel-download watch-action-panels yt-action-panel js-yt-action-panel',
            template: _.template('\
                <div class="yt-action-panel__wrap js-action-wrap">\
                    <h2 class="yt-action-panel__title js-title"><%= acceptable_formats_locale %></h2>\
                    <div class="yt-action-panel__disclaimer"><%= disclaimer %></div>\
                </div>\
                <div class="yt-action-panel__background" style="background-image: url(<%= cover %>)"></div>\
                <div class="x-clearfix"></div>\
            '),
            render: function render() {
                var view = new YT.Views.LinksContainer({ model: this.model });

                var link = Skyload.getDetails().homepage_url + '?' + $.param({
                    lang: Skyload.getCurrentLocale(),
                    utm_source: 'youtube',
                    utm_medium: 'cpc',
                    utm_content: this.model.get('id'),
                    utm_campaign: 'skyload_extension'
                });

                this.$el.html(this.template({
                    id: this.model.get('id'),
                    cover: this.model.get('cover'),
                    acceptable_formats_locale: Skyload.getLocale('acceptable_formats'),
                    disclaimer: _.template(Skyload.getLocale('disclaimer'))({ link: link })
                })).attr({
                    'id': 'action-panel-download',
                    'data-panel-loaded': true,
                    'data-panel-id': this.model.get('id')
                }).css('display', 'none').find('.js-action-wrap .js-title').after(view.render().el);

                return this;
            }
        });

        YT.Views.LinksContainer = Backbone.View.extend({
            tagName: 'div',
            className: 'yt-action-panel__links',
            template: _.template('' + '<div class="yt-action-panel__links__box yt-action-panel__links__box-left js-action-box-left"></div>' + '<div class="yt-action-panel__links__box yt-action-panel__links__box-right js-action-box-right"></div>' + '<div class="x-clearfix"></div>'),
            render: function render() {
                var _this = this;

                this.$el.html($('<div>').addClass('yt-action-panel__loading'));

                this.model.setVideoSize().then(function (model) {
                    _this.$el.html(_this.template());

                    var $left = _this.$el.find('.js-action-box-left');
                    var $right = _this.$el.find('.js-action-box-right');
                    var blocks = [0, 0];

                    _.each(Skyload.YouTube.GetTypesGroup(), function (item, format) {
                        var $box = void 0,
                            collection = model.getVideo().where({ format: format });
                        var length = collection.length + 2;

                        if (_.first(blocks) > _.last(blocks)) {
                            $box = $right;
                            blocks[1] += length;
                        } else {
                            $box = $left;
                            blocks[0] += length;
                        }

                        var GroupContainer = new YT.Views.LinksGroupContainer({
                            collection: collection,
                            model: model
                        });

                        $box.append(GroupContainer.render(format, item).el);
                    });
                });

                return this;
            }
        });

        YT.Views.LinksGroupContainer = Backbone.View.extend({
            tagName: 'div',
            className: 'yt-action-panel__group',
            template: _.template('<h3 class="yt-action-panel__group__title"><%= format %></h3>'),
            format: null,
            render: function render(format, group) {
                var _this2 = this;

                this.format = format == 'Audio.MP4' ? Skyload.getLocale('mp4_audio') : format;

                if (!_.isUndefined(this.collection) && this.collection.length >= 1) {
                    this.$el.html(this.template({
                        format: this.format
                    }));

                    _.each(this.collection, function (model) {
                        model.set('id', _this2.model.get('id'));

                        var LinkView = new YT.Views.LinksDownload({
                            model: _this2.model
                        });

                        _this2.$el.append(LinkView.render(model, group).el);
                    });
                }

                return this;
            }
        });

        YT.Views.LinksDownload = Skyload.VideoView.extend({
            tagName: 'div',
            className: 'yt-action-panel__item',
            template: _.template('<a href="javascript:void(0);" onclick="return false;" class="yt-action-panel__link"><b><%= format %></b> (<%= quality %>)</a><span class="yt-action-panel__info"><%= info %></span>'),
            events: {
                'click a': 'downloadVideo'
            },
            render: function render(model, group) {
                this.specialModel = model;

                var item = group[model.get('index')] || {};
                var info = [this.specialModel.getSizeTitle()];

                if ('3d' in item) {
                    info.push('3D');
                }

                if ('size' in item) {
                    info.push(item.size);
                }

                if ('noAudio' in item) {
                    info.push(Skyload.getLocale('no_audio'));
                }

                this.$el.html(this.template({
                    format: this.specialModel.get('format'),
                    quality: this.specialModel.get('quality'),
                    info: info.join(', ')
                }));

                return this;
            },
            downloadVideo: function downloadVideo(e) {
                e.preventDefault();
                this.download('Youtube');
            }
        });

        YT.Views.MaterialButton = Backbone.View.extend({
            tagName: 'div',
            className: 'yt-download-container',
            template: _.template('<div role="button" class="yt-download-button">\n' + '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" class="yt-download-button__svg">\n' + '<g>\n' + '<rect fill="none" height="24" width="24" />\n' + '</g>\n' + '<g>\n' + '<path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z" />\n' + '</g>\n' + '</svg>\n' + '</div>\n'),
            events: {
                'click [role=button]': 'menu'
            },
            render: function render() {
                var _$el$css$attr;

                this.$el.css({
                    'margin-left': '6px'
                }).attr((_$el$css$attr = {}, _defineProperty(_$el$css$attr, attrId, 'button'), _defineProperty(_$el$css$attr, attrId + '-index', this.model.get('index')), _defineProperty(_$el$css$attr, 'is-icon-button', ''), _$el$css$attr)).html(this.template({
                    tooltip: Skyload.getLocale('download_video')
                }));

                return this;
            },
            menu: function menu(e) {
                e.stopPropagation();

                var openClassName = 'yt-download-container--open';

                var $menu = this.$el.find('[role=menu]');

                if (!$menu.length) {
                    var menu = new YT.Views.MaterialMenu({ model: this.model });

                    this.$el.append(menu.el);

                    menu.render();
                }

                this.$el.toggleClass(openClassName);

                Skyload.Analytics('Youtube', (this.$el.hasClass(openClassName) ? 'Open' : 'Close') + ' menu', this.model.get('id'));
            }
        });

        YT.Views.MaterialMenu = Backbone.View.extend({
            tagName: 'div',
            className: 'yt-download-popup',
            template: _.template('<ul role="list" class="yt-download-menu"></ul>'),
            initialize: function initialize() {
                var _this3 = this;

                this.model.setVideoSize().then(function () {
                    return _this3.render();
                }).catch(function (e) {
                    Skyload.setLog('YT', 'Material', 'Set video size error', e);
                });
            },
            render: function render() {
                var _this4 = this;

                this.$el.attr('role', 'menu').html(this.template());

                var $menu = this.$el.find('ul[role=list]');

                var collection = this.model.getVideo();

                collection.chain().sortBy(function (model) {
                    return model.get('format');
                }).each(function (model) {
                    var item = new YT.Views.MaterialMenuItem({ model: _this4.model });

                    $menu.append(item.el);
                    item.render(model);
                });

                return this;
            }
        });

        YT.Views.MaterialMenuItem = Skyload.VideoView.extend({
            tagName: 'li',
            className: 'yt-download-menu__item',
            template: _.template('<b><%= format %></b> (<%= quality %>) ~ <%= info %>'),
            events: {
                'click': 'downloadVideo'
            },
            render: function render(model) {
                this.specialModel = model;

                var item = Skyload.YouTube.GetGroupByIndex(this.specialModel.get('format'), this.specialModel.get('index'));

                var info = [this.specialModel.getSizeTitle()];

                if ('3d' in item) {
                    info.push('3D');
                }

                if ('size' in item) {
                    info.push(item.size);
                }

                if ('noAudio' in item) {
                    info.push(Skyload.getLocale('no_audio'));
                }

                info = _.compact(info);

                this.$el.attr({
                    'role': 'listitem'
                }).html(this.template({
                    format: this.specialModel.get('format'),
                    quality: this.specialModel.get('quality'),
                    info: info.join(', ')
                }));

                return this;
            },
            downloadVideo: function downloadVideo() {
                this.download('Youtube');

                return this;
            }
        });

        return Skyload.AppView.extend({
            theme: YT.THEME_CLASSIC,
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
                this.parseElem('[' + this.parseTypeAttr + '=' + Skyload.TYPE_VIDEO + ']', VideoCollection);

                this.on('change_access', function (access) {
                    if (!access.video) {
                        _this5.$el.find('#action-button-download.yt-uix-button-toggled').trigger('click');
                        _this5.$el.find('ytd-app').trigger('click');
                    }
                });

                this.$el.delegate('ytd-app', 'click', function () {
                    var $container = _this5.$el.find('.yt-download-container[' + attrId + ']');

                    if ($container.length && $container.hasClass('yt-download-container--open')) {
                        $container.find('[role=button]').trigger('click');
                    }
                });

                this.checkAccess();
            },
            render: function render() {
                var _this6 = this;

                setInterval(function () {
                    try {
                        if (!_this6.isActive()) {
                            return;
                        }

                        var parse = urlVideoParser.parse(location.href);

                        if (!_.isObject(parse) || parse.provider !== 'youtube') {
                            return;
                        }

                        var id = parse.id;

                        var index = [Settings.get('sig'), id].join('_');

                        var $elem = _this6.$el.find('.watch-secondary-actions:not([' + attrId + '])');

                        if (!$elem.length) {
                            $elem = _this6.$el.find('ytd-video-primary-info-renderer[' + attrId + '-index!="' + index + '"]');

                            if ($elem.length) {
                                _this6.theme = YT.THEME_MATERIAL;
                            }
                        } else {
                            _this6.theme = YT.THEME_CLASSIC;
                        }

                        if ($elem.length) {
                            var model = VideoCollection.get(index);

                            _this6.markElem($elem, [Skyload.TYPE_VIDEO, index]);

                            if (model instanceof Backbone.Model && model.isCached()) {
                                model.set('view', $elem);

                                _this6.setVideoPreload(false).setVideoTemplate(model);
                            } else {
                                _this6.setVideoPreload(true);

                                Skyload.YouTube.Get(id).then(function (model) {
                                    return VideoCollection.save(model, Skyload.COLLECTION_MODE_IGNORE_SIZE);
                                }).then(function (model) {
                                    model.set('view', $elem);

                                    _this6.setVideoPreload(false).setVideoTemplate(model);
                                }).catch(function (e) {
                                    _this6.setVideoPreload(false);

                                    _this6.$el.find('[' + attrId + '=button]').remove();

                                    Skyload.setLog('YouTube', 'Error', e);
                                    Skyload.Analytics('Youtube', 'Error', 'ID : ' + id + ', ' + e.message);
                                });
                            }
                        }
                    } catch (e) {
                        Skyload.setLog('YouTube', 'Parse video error', e);
                    }
                }, Settings.get('delay'));

                return this;
            },
            setVideoTemplate: function setVideoTemplate(model) {
                var $elem = model.get('view'),
                    button = void 0,
                    container = void 0;

                switch (this.theme) {
                    case YT.THEME_MATERIAL:
                        button = new YT.Views.MaterialButton({ model: model });

                        $elem.find('[' + attrId + '=button]').remove();
                        $elem.find('ytd-menu-renderer').append(button.el);

                        button.render();

                        break;
                    case YT.THEME_CLASSIC:
                    default:
                        button = new YT.Views.MenuButton({ model: model }).render();
                        container = new YT.Views.Container({ model: model }).render(this);

                        this.$el.find('.watch-secondary-actions').append(button.el).attr(attrId, 'mod');
                        this.$el.find('#watch-action-panels').append(container.el);

                        break;
                }

                this.markElem($elem, model);
                $elem.attr(attrId, 'mod');

                Skyload.Analytics('Youtube', 'View', model.get('id'));

                return this;
            }
        });
    });
});