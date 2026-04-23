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

define('MYA', ['APP', 'backbone', 'underscore', 'jquery', 'yandex'], function (Skyload, Backbone, _, $) {
    Skyload.Custodian.Require('MYA', function () {
        var MYA = _.extend({
            TYPE_ROUTE: 'route'
        }, SkyloadDefaultComponents);

        MYA.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_YANDEX,
                delay: 500
            },
            checkPlus: function checkPlus() {
                var handle = false;

                handle = Skyload.Methods.B('function(){try {return Mu.authData.user.plus.hasPlus ? 1 : 0;} catch(e) {return 0;}}');

                return handle.then(function (hasPlus) {
                    hasPlus = !!parseInt(hasPlus);

                    if (hasPlus) {
                        Skyload.Yandex.ApplyPlus();
                    }
                });
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new MYA.Settings();
        var SoundCollection = Skyload.Instance.GetInstance(Skyload.TYPE_SOUND, Settings.get('sig'));

        MYA.Views.DownloadButton = Skyload.SoundView.extend({
            tagName: 'span',
            className: 'd-like d-like_theme-track deco-track-like mya__download-button mya__loading',
            template: _.template('<span class="d-like__icon-wrapper deco-track-like-icon-wrapper">' + '<span class="d-icon deco-icon d-icon_download d-like__icon deco-buttonish-like-icon-bright"></span>' + '<span class="d-icon deco-icon d-icon_download d-like__icon deco-buttonish-like-icon-pale"></span>' + '</span>'),
            id: null,
            events: {
                'click': 'downloadSound'
            },
            initialize: function initialize() {
                this.listenTo(this.model, 'change:size', this.setTitle);

                this.$el.html(this.template()).attr('title', Skyload.getLocale('loading'));
            },
            setTitle: function setTitle() {
                this.$el.attr('title', this.getTitle());

                return this;
            },
            render: function render() {
                this.$el.removeClass('mya__loading').attr(attrId + '-index', this.model.get('index'));

                this.setTitle();

                return this;
            },
            playerRender: function playerRender() {
                this.$el.addClass('player-controls__btn').addClass('deco-player-controls__button').html('<span class="d-icon d-icon_download"></span>');

                return this;
            },
            downloadSound: function downloadSound() {
                if (!this.$el.is('.mya__loading')) {
                    this.download('Yandex.Music');
                }

                return this;
            }
        });

        MYA.Models.Route = Backbone.Model.extend({
            defaults: {
                type: null,
                username: null,
                id: null,
                tab: null
            },
            validate: function validate(attrs) {
                if (!_.include([Skyload.Yandex.CACHE_TYPE_ALBUM, Skyload.Yandex.CACHE_TYPE_ARTIST, Skyload.Yandex.CACHE_TYPE_PLAYLIST, Skyload.Yandex.CACHE_TYPE_USER], attrs.type)) {
                    return 'Wrong type';
                }

                if (_.include([Skyload.Yandex.CACHE_TYPE_ALBUM, Skyload.Yandex.CACHE_TYPE_ARTIST, Skyload.Yandex.CACHE_TYPE_PLAYLIST], attrs.type) && !attrs.id) {
                    return 'Not found id for case ' + attrs.type;
                }

                if (_.include([Skyload.Yandex.CACHE_TYPE_PLAYLIST, Skyload.Yandex.CACHE_TYPE_USER], attrs.type) && !attrs.username) {
                    return 'Not found username for case ' + attrs.type;
                }
            },
            getCacheKey: function getCacheKey() {
                var index = null;

                switch (this.get('type')) {
                    case Skyload.Yandex.CACHE_TYPE_ALBUM:
                        index = [this.get('type'), this.get('id')].join('_');

                        break;
                    case Skyload.Yandex.CACHE_TYPE_ARTIST:
                        index = [this.get('type'), this.get('id'), Skyload.Yandex.TAB_ARTIST_TRACKS].join('_');

                        break;
                    case Skyload.Yandex.CACHE_TYPE_PLAYLIST:
                        index = [this.get('type'), this.get('username'), this.get('id')].join('_');

                        break;
                    case Skyload.Yandex.CACHE_TYPE_USER:
                        index = [this.get('type'), this.get('username')].join('_');

                        break;
                }

                return index;
            },
            getCache: function getCache() {
                return Skyload.Yandex.GetCache(this.getCacheKey());
            },
            getCollection: function getCollection() {
                switch (this.get('type')) {
                    case Skyload.Yandex.CACHE_TYPE_ARTIST:
                        return Skyload.Yandex.GetArtist(this.get('id'), this.get('tab'));

                    case Skyload.Yandex.CACHE_TYPE_PLAYLIST:
                        return Skyload.Yandex.GetPlaylist(this.get('username'), this.get('id'));

                    case Skyload.Yandex.CACHE_TYPE_ALBUM:
                        return Skyload.Yandex.GetAlbum(this.get('id'));

                    case Skyload.Yandex.CACHE_TYPE_USER:
                        return Skyload.Yandex.GetUserTracks(this.get('username'));

                }
            }
        });

        MYA.Route = Backbone.Router.extend({
            model: new MYA.Models.Route(),
            routes: {
                'users/:username/tracks': 'setUserTracks',
                'users/:username/playlists/:id': 'setUserPlaylist',
                'artist/:id(/:tab)': 'setArtist',
                'album/:id': 'setAlbum',
                '*path': 'setEmptyModel'
            },
            getModel: function getModel(state) {
                Backbone.history.loadUrl(state);
                return this.model;
            },
            setEmptyModel: function setEmptyModel() {
                this.model = new MYA.Models.Route();
            },
            setUserTracks: function setUserTracks(username) {
                this.model = new MYA.Models.Route({
                    type: Skyload.Yandex.CACHE_TYPE_USER,
                    username: username
                });
            },
            setUserPlaylist: function setUserPlaylist(username, id) {
                this.model = new MYA.Models.Route({
                    type: Skyload.Yandex.CACHE_TYPE_PLAYLIST,
                    username: username,
                    id: id
                });
            },
            setArtist: function setArtist(id, tab) {
                if (tab === Skyload.Yandex.TAB_ARTIST_TRACKS || !tab) {
                    this.model = new MYA.Models.Route({
                        type: Skyload.Yandex.CACHE_TYPE_ARTIST,
                        id: id,
                        tab: tab
                    });
                } else {
                    this.setEmptyModel();
                }
            },
            setAlbum: function setAlbum(id) {
                this.model = new MYA.Models.Route({
                    type: Skyload.Yandex.CACHE_TYPE_ALBUM,
                    id: id
                });
            }
        });

        MYA.AppRoute = new MYA.Route();

        try {
            Backbone.history.start({ pushState: true });
        } catch (e) {
            Skyload.setLog('Yandex', 'Backbone history start', e);
        }

        Settings.checkPlus().catch(function (e) {
            Skyload.setLog('Yandex', 'Check error', e);
        });

        return Skyload.AppView.extend({
            initialize: function initialize() {
                this.init();

                this.parse = true;
                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';
                this.parseRouteAttr = attrId + '-route';

                SoundCollection.autoSave();

                this.listenToOnce(SoundCollection, 'reset', this.render);
                this.parseElem('.track[' + attrId + ']:not(.track_error), .d-track[' + attrId + ']', SoundCollection);

                this.checkAccess();

                Skyload.Yandex.SetDomain(location.host);
                Skyload.SendMessageFromContentToBackground({
                    method: 'set_libs_default',
                    source: Settings.get('sig')
                });
            },
            getParseCollection: function getParseCollection() {
                var _this = this;

                var $elem = this.$el.find('[' + this.parseTypeAttr + ']');

                if ($elem.length) {
                    var data = $elem.map(function (i, elem) {
                        var $elem = $(elem);

                        return {
                            type: $elem.attr(_this.parseTypeAttr),
                            index: $elem.attr(_this.parseElemAttr),
                            route: $elem.attr(_this.parseRouteAttr)
                        };
                    });

                    return _.chain($.makeArray(data)).reduce(function (collection, item) {
                        var type = item.type,
                            index = item.index,
                            route = item.route;

                        switch (type) {
                            case MYA.TYPE_ROUTE:
                                route = MYA.AppRoute.getModel(route);

                                if (route.isValid()) {
                                    var cache = route.getCache();

                                    if (_.isArray(cache) && cache.length) {
                                        collection = collection.concat(new Skyload.Collections.SoundCollection(cache).models);
                                    }
                                } else {
                                    Skyload.setLog('Yandex', 'Parse elem collection error', route.validationError);
                                }

                                break;
                            case Skyload.TYPE_SOUND:
                                collection.push(SoundCollection.get(index));

                                break;
                        }

                        return collection;
                    }, []).compact().uniq(function (model) {
                        return model.get('index');
                    }).value();
                }

                return [];
            },
            getContentCount: function getContentCount() {
                return this.getParseCollection().length;
            },
            getContent: function getContent() {
                if (!this.isParse() || _.isNull(this.parseCollections) || _.isNull(this.parseSelector)) {
                    return Promise.reject(new Error('Brake'));
                }

                return this.setActionSound(this.getParseCollection()).then(function (data) {
                    return {
                        collection: data.collection,
                        single_type: data.type
                    };
                });
            },
            render: function render() {
                var _this2 = this;

                var collect = function collect(route) {
                    return route.getCollection().then(function (collection) {
                        SoundCollection.set(collection, { remove: false });
                    }).catch(function (e) {
                        Skyload.setLog('Yandex', 'Get collection from route error', e);
                    });
                };

                setInterval(function () {
                    if (_this2.isActive()) {
                        try {
                            var pathname = location.pathname;

                            var route = MYA.AppRoute.getModel(pathname);

                            var $elem = _this2.$el.find('.d-track.d-track_selectable:not(.d-track_error):not([' + attrId + ']),.track.track_type_player:not([' + attrId + ']),.sidebar .d-track:not([' + attrId + ']),.popup-sequence__tracks .d-track:not([' + attrId + '])');

                            if ($elem.length) {
                                $elem.each(function (i, elem) {
                                    if (i >= 25) {
                                        return false;
                                    }

                                    var $this = $(elem);
                                    var $title = $this.find('.d-track__title, .track__title').first();

                                    if ($title.length) {
                                        var url = $title.attr('href');

                                        if (_.isString(url)) {
                                            var id = parseInt(_.last(url.toString().split('/')));

                                            if (_.isNumber(id)) {
                                                var index = [Settings.get('sig'), id].join('_');
                                                var model = SoundCollection.get(index);

                                                if (!(model instanceof Backbone.Model) && !route.isValid()) {
                                                    Skyload.Yandex.Get(id, false).then(function (model) {
                                                        return SoundCollection.save(model);
                                                    }).catch(function (e) {
                                                        Skyload.setLog('Yandex', 'Get/Save sound model error', e);
                                                    });
                                                }

                                                _this2.markElem($this, [Skyload.TYPE_SOUND, index]);
                                            }
                                        }
                                    }
                                });
                            }

                            $elem = _this2.$el.find('.page-artist:not([' + attrId + ']),.page-album:not([' + attrId + ']),.page-playlist:not([' + attrId + ']),.page-users:not([' + attrId + '])');

                            if ($elem.length && route.isValid()) {
                                $elem.attr(_this2.parseMainAttr, 'set').attr(_this2.parseTypeAttr, MYA.TYPE_ROUTE).attr(_this2.parseRouteAttr, pathname);

                                collect(route);
                            }

                            $elem = _this2.$el.find('.sidebar-album:not([' + attrId + ']),.sidebar-playlist:not([' + attrId + '])');

                            if ($elem.length) {
                                $elem.each(function (i, elem) {
                                    var $sidebar = $(elem);

                                    try {
                                        var url = $sidebar.find('.sidebar-album__title > a[href]').attr('href') || $sidebar.find('.sidebar-playlist__title > a[href]').attr('href');

                                        if (_.isString(url) && url.length) {
                                            route = MYA.AppRoute.getModel(url);

                                            if (route.isValid()) {
                                                collect(route);

                                                $sidebar.attr(_this2.parseMainAttr, 'set').attr(_this2.parseTypeAttr, MYA.TYPE_ROUTE).attr(_this2.parseRouteAttr, url);
                                            } else {
                                                throw new Error(route.validationError);
                                            }
                                        } else {
                                            throw new Error('Bad url');
                                        }
                                    } catch (e) {
                                        $sidebar.attr(_this2.parseMainAttr, 'error');
                                        Skyload.setLog('Yandex', 'Parse sidebar error', e);
                                    }
                                });
                            }

                            _this2.renderTemplate('.d-track[' + attrId + '=set]:not(.d-track_error),.track[' + attrId + '=set]', SoundCollection);
                        } catch (e) {
                            Skyload.setLog('Yandex', 'Parse error', e);
                        }
                    }
                }, Settings.get('delay'));

                return this;
            },
            setSoundTemplate: function setSoundTemplate(model) {
                var $item = model.get('view');
                var $actions = $item.find('.d-track__actions');

                var view = new MYA.Views.DownloadButton({
                    model: model
                }).render();

                if (!$actions.length) {
                    $actions = $('.player-controls__track-controls');

                    if ($actions.length) {
                        view.playerRender();
                    }
                }

                $actions.prepend(view.$el);
                $item.attr(this.parseMainAttr, 'mod');

                return this;
            }
        });
    });
});