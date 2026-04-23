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

define('SC', ['APP', 'backbone', 'underscore', 'jquery', 'soundcloud'], function (Skyload, Backbone, _, $) {
    Skyload.Custodian.Require('SC', function () {
        var SC = _.extend({
            SELECTOR_SOUND_BADGE: 'sound_badge',
            SELECTOR_BADGE: 'badge',
            SELECTOR_SOUND_LIST: 'sound_list',
            SELECTOR_TRACK_LIST: 'track_list',
            SELECTOR_TRACK_LIST_SYSTEM: 'track_list_system',
            SELECTOR_CHART_TRACKS: 'chart_tracks',
            SELECTOR_ENGAGEMENT: 'engagement',
            SELECTOR_LISTEN: 'listen',
            SELECTOR_SEARCH: 'search',
            SELECTOR_PANEL: 'panel',
            SELECTOR_SINGLE: 'single',
            SELECTOR_DISCOVER: 'discover',
            SELECTOR_DISCOVER_WAVE: 'discover_wave',
            SELECTOR_HISTORY: 'history',
            SELECTOR_COVER_FLOW: 'cover_flow'
        }, SkyloadDefaultComponents);

        SC.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_SOUNDCLOUD,
                delay: 500,
                selectors: {}
            },
            initialize: function initialize() {
                var selectors = {};
                selectors[SC.SELECTOR_SOUND_LIST] = 'soundList__item';
                selectors[SC.SELECTOR_CHART_TRACKS] = 'chartTracks__item';
                selectors[SC.SELECTOR_SOUND_BADGE] = 'soundBadgeList__item';
                selectors[SC.SELECTOR_BADGE] = 'badgeList__item';
                selectors[SC.SELECTOR_TRACK_LIST] = 'trackList__item';
                selectors[SC.SELECTOR_TRACK_LIST_SYSTEM] = 'systemPlaylistTrackList__item';
                selectors[SC.SELECTOR_ENGAGEMENT] = 'listenEngagement__actions';
                selectors[SC.SELECTOR_LISTEN] = 'listenContent__sound';
                selectors[SC.SELECTOR_SEARCH] = 'searchItem__trackItem';
                selectors[SC.SELECTOR_PANEL] = 'playbackSoundBadge__avatar';
                selectors[SC.SELECTOR_SINGLE] = 'singleSound';
                selectors[SC.SELECTOR_DISCOVER] = 'tileGallery__sliderPanelSlide';
                selectors[SC.SELECTOR_DISCOVER_WAVE] = 'seedSound__waveform';
                selectors[SC.SELECTOR_HISTORY] = 'historicalPlays__item';
                selectors[SC.SELECTOR_COVER_FLOW] = 'coverFlow__item';

                this.set('selectors', selectors);
            },
            getSelectors: function getSelectors() {
                return _.chain(this.get('selectors'));
            },
            getSelectorIndexByElem: function getSelectorIndexByElem($elem) {
                return this.getSelectors().map(function (selector, index) {
                    if ($elem.hasClass(selector)) {
                        return index;
                    }
                }).compact().first().value();
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new SC.Settings();
        var SoundCollection = Skyload.Instance.GetInstance(Skyload.TYPE_SOUND, Settings.get('sig'));

        SC.Views.DownloadButton = Skyload.SoundView.extend({
            tagName: 'button',
            className: 'sc__download-button sc-button-download sc-button',
            move: false,
            tooltip: null,
            index: null,
            events: {
                'click': 'downloadSound',
                'mouseenter': 'setTooltip',
                'mouseleave': 'setTooltip'
            },
            render: function render() {
                this.$el.attr(attrId, this.model.get('index')).text(Skyload.getLocale('download'));

                return this;
            },
            setIndex: function setIndex(index) {
                this.index = index;
                return this;
            },
            setTooltip: function setTooltip(e) {
                var open = e.type === 'mouseenter';

                if (open && this.model.get('size') > 0) {
                    if (!(this.tooltip instanceof Backbone.View)) {
                        this.tooltip = new SC.Views.Tooltip();
                        this.tooltip.setIndex(this.index).setElem(this.$el).setText(this.getTitle()).render();

                        if (this.index === SC.SELECTOR_SINGLE) {
                            this.tooltip.$el.addClass('g-overlay').removeClass('g-z-index-overlay g-opacity-transition');
                            this.tooltip.$el.find('.js-arrow').addClass('g-arrow g-arrow-top');
                        }

                        $('body').append(this.tooltip.el);
                    }

                    this.tooltip.show();
                } else {
                    if (this.tooltip instanceof Backbone.View) {
                        this.tooltip.hide();
                    }
                }

                return this;
            },
            downloadSound: function downloadSound() {
                return this.download('SoundCloud');
            }
        });

        SC.Views.Tooltip = Backbone.View.extend({
            tagName: 'div',
            className: 'sc__tooltip',
            visibleClassName: 'm-is-visible',
            template: _.template('<div class="sc__tooltip__arrow js-arrow"></div><div class="sc__tooltip__content"><%= text %></div>'),
            text: null,
            $elem: null,
            timeout: null,
            index: null,
            setIndex: function setIndex(index) {
                this.index = index;
                return this;
            },
            setText: function setText(text) {
                this.text = text;
                return this;
            },
            setElem: function setElem($elem) {
                this.$elem = $elem;
                return this;
            },
            render: function render() {
                this.$el.html(this.template({ text: this.text }));

                if (this.index === SC.SELECTOR_SINGLE) {
                    this.visibleClassName = 'visible';
                }

                return this;
            },
            show: function show() {
                if (!_.isNull(this.$elem) && this.$elem.length) {
                    clearTimeout(this.timeout);

                    var $arrow = this.$el.find('.js-arrow').removeAttr('style');

                    if (this.index === SC.SELECTOR_SINGLE) {
                        this.$el.css('padding', '3px 7px');
                    }

                    var tip_width = this.$el.outerWidth();
                    var tip_height = this.$el.outerHeight();

                    var elem_offset = this.$elem.offset();
                    var elem_width = this.$elem.outerWidth();
                    var elem_height = this.$elem.outerHeight();

                    var arrow_width = $arrow.outerWidth();

                    var top = tip_height / 2 + elem_height + elem_offset.top;
                    var left = tip_width > elem_width ? elem_offset.left - (tip_width - elem_width) / 2 : elem_offset.left + (elem_width - tip_width) / 2;

                    var width = $(window).width();
                    var is_top = top + tip_height > $(document).scrollTop() + $(window).height();

                    this.$el[is_top ? 'addClass' : 'removeClass']('m-is-top');

                    if (is_top) {
                        top = elem_offset.top - tip_height * 1.5;
                    }

                    if (left + tip_width > width) {
                        left = tip_width > elem_width ? elem_offset.left - (tip_width - elem_width) : elem_offset.left + (elem_width - tip_width);

                        if (tip_width > elem_width) {
                            $arrow.css({
                                left: 'auto',
                                right: elem_width / 2 - arrow_width / 2
                            });

                            if (this.index === SC.SELECTOR_SINGLE) {
                                $arrow.css('top', '-7px');
                            }
                        }
                    }

                    this.$el.css({ top: top, left: left }).show().addClass(this.visibleClassName);
                }

                return this;
            },
            hide: function hide() {
                var _this = this;

                clearTimeout(this.timeout);
                this.$el.removeClass(this.visibleClassName);

                this.timeout = setTimeout(function () {
                    _this.$el.hide();
                }, 1000);

                return this;
            }
        });

        return Skyload.AppView.extend({
            initialize: function initialize() {
                var _this2 = this;

                this.init();
                this.selector = function (suffix) {
                    return Settings.getSelectors().map(function (selector) {
                        return '.' + selector + suffix;
                    }).value().join(',');
                };

                this.parse = true;
                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                this.$el.delegate(this.selector('[' + attrId + '=mod]:not([' + attrId + '-size])'), 'mouseenter', function (e) {
                    if (_this2.isCanInsert(Skyload.TYPE_SOUND)) {
                        var $item = $(e.currentTarget);
                        var index = $item.attr(_this2.parseElemAttr);

                        var model = SoundCollection.get(index);

                        if (model instanceof Backbone.Model) {
                            model.getSize().catch(function (e) {
                                Skyload.setLog('SC', 'Get size on hover', e);
                            });

                            $item.attr(attrId + '-size', 'mod');
                        }
                    }
                });

                var ready = _.after(2, function () {
                    _this2.render();
                });

                this.listenToOnce(SoundCollection, 'reset', function () {
                    return ready();
                });
                this.parseElem('[' + this.parseTypeAttr + '=' + Skyload.TYPE_SOUND + ']', SoundCollection);

                this.checkAccess();

                Skyload.SoundCloud.FetchClientId().then(function (id) {
                    Skyload.SoundCloud.SetClientId(id);

                    Skyload.SendMessageFromContentToBackground({
                        method: 'set_libs_default',
                        source: Settings.get('sig'),
                        id: id
                    });

                    ready();
                }).catch(function (e) {
                    Skyload.setLog('SC', 'Fetch client id error', e);
                    ready();
                });

                Skyload.SoundCloud.SetSchema(location.protocol, location.host);
            },
            render: function render() {
                var _this3 = this;

                setInterval(function () {
                    try {
                        if (!_this3.isActive()) {
                            return;
                        }

                        var $elem = _this3.$el.find(_this3.selector(':not([' + attrId + '])'));

                        if ($elem.length) {
                            $elem.each(function (i, elem) {
                                var link = void 0,
                                    model = void 0,
                                    ignoreError = false;

                                var $item = $(elem);
                                var index = Settings.getSelectorIndexByElem($item);

                                if (_.isString(index)) {
                                    switch (index) {
                                        case SC.SELECTOR_SOUND_BADGE:
                                        case SC.SELECTOR_SOUND_LIST:
                                        case SC.SELECTOR_SEARCH:
                                        case SC.SELECTOR_DISCOVER_WAVE:
                                        case SC.SELECTOR_HISTORY:
                                            link = $item.find('a.soundTitle__title[href]').attr('href');

                                            if (index === SC.SELECTOR_SOUND_LIST) {
                                                ignoreError = true;
                                            }

                                            break;

                                        case SC.SELECTOR_TRACK_LIST:
                                        case SC.SELECTOR_TRACK_LIST_SYSTEM:
                                            ignoreError = true;
                                            link = $item.find('a.trackItem__trackTitle[href]').attr('href');

                                            break;

                                        case SC.SELECTOR_BADGE:
                                        case SC.SELECTOR_DISCOVER:
                                            link = $item.find('a.audibleTile__artworkLink[href]').attr('href');

                                            break;

                                        case SC.SELECTOR_CHART_TRACKS:
                                            link = $item.find('.chartTrack__title > a[href]').attr('href');

                                            break;

                                        case SC.SELECTOR_PANEL:
                                            link = $item.attr('href');

                                            break;

                                        case SC.SELECTOR_ENGAGEMENT:
                                        case SC.SELECTOR_LISTEN:
                                            link = location.href;

                                            break;

                                        case SC.SELECTOR_SINGLE:
                                            link = $item.find('.soundHeader__title a[href]:last-child').attr('href');

                                            break;

                                        case SC.SELECTOR_COVER_FLOW:
                                            ignoreError = true;
                                            link = $item.find('a.audibleTile__artworkLink[href]').attr('href');

                                            break;

                                        default:
                                            return;
                                    }
                                } else {
                                    $item.attr(attrId, 'error').attr(attrId + '-error-type', 1);
                                    return;
                                }

                                if (_.isString(link)) {
                                    $item.attr(attrId, 'get');

                                    link = Skyload.SoundCloud.GetNormalURL(link);

                                    model = SoundCollection.chain().filter(function (model) {
                                        return model.get('data').link === link;
                                    }).first().value();

                                    var mark = function mark(model) {
                                        if (model.get('size') > 0) {
                                            $item.attr(attrId + '-size', 'mod');
                                        }

                                        _this3.markElem($item, model);
                                    };

                                    if (model instanceof Backbone.Model && model.isCached()) {
                                        mark(model);
                                    } else {
                                        Skyload.SoundCloud.Get(link).then(function (model) {
                                            return SoundCollection.save(model);
                                        }).then(function (model) {
                                            return mark(model);
                                        }).catch(function (e) {
                                            $item.attr(attrId, 'error').attr(attrId + '-error-type', 2);
                                            Skyload.setLog('SC', 'Get sound model error', e);
                                        });
                                    }
                                } else {
                                    if (!ignoreError) {
                                        $item.attr(attrId, 'error').attr(attrId + '-error-type', 3);
                                    }

                                    return;
                                }
                            });
                        }

                        _this3.renderTemplate(_this3.selector('[' + attrId + '=set]'), SoundCollection);
                    } catch (e) {
                        Skyload.setLog('SC', 'Render sound', e);
                    }
                }, Settings.get('delay'));

                return this;
            },
            setSoundTemplate: function setSoundTemplate(model) {
                var $item = model.get('view');

                var $container = void 0;

                if ($item.length) {
                    var index = Settings.getSelectorIndexByElem($item);
                    var view = new SC.Views.DownloadButton({ model: model });

                    switch (index) {
                        case SC.SELECTOR_SOUND_BADGE:
                        case SC.SELECTOR_SOUND_LIST:
                        case SC.SELECTOR_TRACK_LIST:
                        case SC.SELECTOR_TRACK_LIST_SYSTEM:
                        case SC.SELECTOR_CHART_TRACKS:
                        case SC.SELECTOR_ENGAGEMENT:
                        case SC.SELECTOR_LISTEN:
                        case SC.SELECTOR_SEARCH:
                        case SC.SELECTOR_DISCOVER_WAVE:
                        case SC.SELECTOR_HISTORY:
                            $container = $item.find('.sc-button-group:first-child');

                            if (_.include([SC.SELECTOR_ENGAGEMENT, SC.SELECTOR_LISTEN], index)) {
                                view.$el.addClass('sc-button-medium');
                            } else {
                                view.$el.addClass('sc-button-small');
                            }

                            break;
                        case SC.SELECTOR_PANEL:
                            $container = $item.parent().find('.playbackSoundBadge__actions');
                            view.$el.addClass('sc-button-small sc-button-responsive sc-button-icon');

                            model.getSize().catch(function (e) {
                                Skyload.setLog('SC', 'Set sound template error', e);
                            });

                            break;

                        case SC.SELECTOR_SINGLE:
                            $container = $item.find('.soundHeader__actions .sc-button-group:first-child');
                            view.$el.addClass('sc-button-small sc-button-visual');

                            break;

                        case SC.SELECTOR_BADGE:
                        case SC.SELECTOR_DISCOVER:
                        case SC.SELECTOR_COVER_FLOW:
                            $item.attr(attrId, 'mod');

                            return this;

                        default:
                            return this;
                    }

                    if ($container.length) {
                        view.setIndex(index);

                        $container.append(view.render().el);
                        $item.attr(attrId, 'mod');
                    }
                }

                return this;
            }
        });
    });
});