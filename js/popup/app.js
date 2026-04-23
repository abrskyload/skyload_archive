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

require.config({
    baseUrl: '/js',
    paths: {
        'backbone': 'vendor/backbone/backbone-min',
        'underscore': 'vendor/underscore/underscore-min',
        'jquery': 'vendor/jquery/dist/jquery.min',
        'scrollbar': 'vendor/scroll-bar/src/jquery.scroll-bar',
        'chart': 'vendor/draw-doughnut-chart/src/jquery.draw-doughnut-chart',
        'progress': 'vendor/jquery.easy-pie-chart/dist/jquery.easypiechart.min',
        'ripple': 'vendor/ripple-effect/src/jquery.ripple-effect',
        'browser': 'vendor/jquery.browser/dist/jquery.browser.min',
        'url_parser': 'utils/urlParse/parser',

        'content_collection': 'popup/collections/content',
        'content_item_model': 'popup/models/content-item',
        'content_view': 'popup/views/content',
        'content_model': 'popup/models/content',
        'content_item_view': 'popup/views/content-item',
        'sidebar_view': 'popup/views/sidebar',
        'menu_view': 'popup/views/menu',
        'profile_model': 'popup/models/profile',
        'profile_view': 'popup/views/profile',
        'state_view': 'popup/views/state',
        'player_view': 'popup/views/player',

        'checkbox_view': 'popup/views/checkboxes/checkbox',
        'checkbox_group_view': 'popup/views/checkboxes/checkbox-group',
        'checkbox_interface_view': 'popup/views/checkboxes/checkbox-interface',

        'config': 'core/config',
        'common': 'core/common',
        'methods': 'components/methods',
        'lang': 'components/lang'
    }
});

define(['config', 'common', 'lang', 'content_model', 'profile_model', 'sidebar_view', 'content_view', 'menu_view', 'state_view', 'player_view', 'backbone', 'browser', 'url_parser', 'underscore', 'jquery', 'ripple'], function (Config, Skyload, Lang, ContentModel, ProfileModel, SideBarView, ContentView, MenuView, StateView, PlayerView, Backbone, Browser, urlParser, _, $) {
    Skyload = _.extend(Skyload, {
        Tab: {},
        Environment: Skyload.ENVIRONMENT_POPUP,
        SendRequest: function SendRequest(request, callback) {
            if ('id' in this.Tab) {
                this.SendMessageFromPopupActionToContent(this.Tab.id, request, callback);
            }

            return this;
        },
        Analytics: function Analytics(action, label) {
            return this.SendMessageFromPopupActionToBackground({
                method: 'analytics',
                category: 'PopupAction',
                action: action,
                label: label
            });
        },
        Download: function Download(namespace, index, params) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                params = _.extend(params, { environment: Skyload.Environment });

                _this.SendMessageFromPopupActionToBackground({
                    method: 'download',
                    namespace: namespace,
                    index: index,
                    params: params
                }, function (response) {
                    try {
                        if (response.code === 0) {
                            resolve(response.model);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    });

    Skyload.Lang = new Lang();

    Skyload.Router = Backbone.Router.extend({
        routes: {
            'download': 'downloadTemplate',
            'empty': 'emptyTemplate',
            'youtube': 'youtubeTemplate',
            'skyload': 'skyloadTemplate',
            '*path': 'defaultTemplate'
        },
        downloadTemplate: function downloadTemplate() {
            App.renderDownloadTemplate();
        },
        emptyTemplate: function emptyTemplate() {
            App.renderStateTemplate(Skyload.POPUP_STATE_EMPTY);
        },
        youtubeTemplate: function youtubeTemplate() {
            App.renderStateTemplate(Skyload.POPUP_STATE_YOUTUBE);
        },
        skyloadTemplate: function skyloadTemplate() {
            App.renderStateTemplate(Skyload.POPUP_STATE_SKYLOAD);
        },
        defaultTemplate: function defaultTemplate() {
            App.renderDefaultTemplate();
        }
    });

    Skyload.App = Backbone.View.extend({
        model: new ContentModel(),
        el: $('body'),
        template: _.template($('#template-layout').html()),
        profile: null,
        bar: null,
        content: null,
        menu: null,
        state: null,
        router: null,
        player: null,
        download_template: false,
        download_mode: false,
        selected_mode: false,
        content_ready: false,
        receiving: true,
        receiving_timeout: null,
        getModel: function getModel() {
            return this.model;
        },
        getContent: function getContent() {
            return this.content;
        },
        getBar: function getBar() {
            return this.bar;
        },
        getMenu: function getMenu() {
            return this.menu;
        },
        getProfile: function getProfile() {
            return this.profile;
        },
        getPlayer: function getPlayer() {
            return this.player;
        },
        initialize: function initialize() {
            var _this2 = this;

            this.listenTo(this.model, 'cancel_download complete_download', function () {
                if (_this2.isDownloadMode() && !_this2.isDownloadTemplate()) {
                    _this2.setDownloadMode(false);
                }
            });

            this.$el.delegate('.js-blanket', 'click', function () {
                _this2.trigger('blanket');
            });

            Skyload.Analytics('Open');
        },
        init: function init() {
            var _this3 = this;

            this.bar = new SideBarView({ model: this.model });
            this.content = new ContentView({ model: this.model });
            this.menu = new MenuView({ model: this.model });
            this.profile = new ProfileModel();
            this.player = new PlayerView();

            this.fetchProfile().then(function (profile) {
                return _this3.trigger('profile_fetch', profile);
            }).catch(function (e) {
                return Skyload.setLog('App', 'Fetch profile', e);
            });

            return this;
        },
        render: function render() {
            this.$el.prepend(this.template());

            this.$workspace = this.$el.find('.js-workspace');
            this.$workspace.before(this.menu.render().el);

            this.router = new Skyload.Router();

            this.$el.ripple('.js-ripple-effect', {
                elem_class: 'b-ripple-effect',
                effect_name: 'm-ripple-effect-animate'
            });

            this.$el.addClass(['m-browser-' + Browser.name, 'm-platform-' + Browser.platform, 'm-lang-' + Skyload.Lang.getLocale()].join(' '));

            Backbone.history.start();

            return this;
        },
        renderCommonTemplate: function renderCommonTemplate() {
            this.bar.render();
            this.content.render();

            this.$workspace.append(this.bar.el).append(this.content.el);

            this.$el.find('.js-player').html(this.player.el);

            return this;
        },
        renderDefaultTemplate: function renderDefaultTemplate() {
            return this.renderCommonTemplate().receivingContent();
        },
        renderDownloadTemplate: function renderDownloadTemplate() {
            var _this4 = this;

            this.download_template = true;
            this.$workspace.addClass('m-download-template');

            this.renderCommonTemplate();
            this.setDownloadMode(true);
            this.getContent().setDownloadTitle();

            Skyload.GetSelectedTab().then(function (tab) {
                if ('url' in tab) {
                    var url = tab.url;

                    if (Skyload.isURL(url)) {
                        Skyload.SendMessageFromPopupActionToBackground({
                            method: 'access',
                            action: 'get',
                            domain: Skyload.parseURL(url).host
                        }, function (model) {
                            _this4.model.setAccess(model);
                        });
                    }
                }
            }).catch(function (e) {
                Skyload.setLog('App', 'Set download template error', e);
            });

            this.loadingComplete().trigger('set_download_template');

            return this;
        },
        renderStateTemplate: function renderStateTemplate(state) {
            if (!_.include(Skyload.AvailablePopupStates, state)) {
                state = Skyload.POPUP_STATE_DEFAULT;
            }

            this.state = new StateView();
            this.$workspace.html(this.state.render(state).el);

            return this.loadingComplete();
        },
        receivingContent: function receivingContent() {
            var _this5 = this;

            setInterval(function () {
                if (!_this5.getContent().isLocked() && _this5.receiving) {
                    _this5.receiving = false;

                    clearTimeout(_this5.receiving_timeout);
                    _this5.receiving_timeout = setTimeout(function () {
                        _this5.receiving = true;
                    }, 10000);

                    Skyload.GetSelectedTab().then(function (tab) {
                        Skyload.Tab = tab;

                        return Skyload.GetAllFramesOnTab(tab.id, true);
                    }).then(function (frames) {
                        var collection = [],
                            access = null;

                        var async = _.after(frames.length + 1, function () {
                            if (!_this5.getContent().isLocked()) {
                                if (collection.length) {
                                    _this5.model.setCollection(collection);
                                }

                                if (_.isNull(access) || !_.size(access)) {
                                    Skyload.SendMessageFromPopupActionToBackground({
                                        method: 'access',
                                        action: 'get',
                                        domain: urlParser(Skyload.Tab.url).host
                                    }, function (model) {
                                        _this5.model.setAccess(model);
                                    });
                                } else {
                                    _this5.model.setAccess(access);
                                }

                                _this5.loadingComplete();
                            }

                            _this5.receiving = true;

                            clearTimeout(_this5.receiving_timeout);
                        });

                        Skyload.SendMessageFromPopupActionToBackground({ method: 'get_parse_content' }, function (response) {
                            if (_.isObject(response) && 'code' in response && response.code === 0) {
                                collection = collection.concat(response.collection);
                            }

                            async();
                        });

                        frames.forEach(function (_ref) {
                            var frameId = _ref.frameId;

                            Skyload.SendMessageFromBackgroundToContentFrame(Skyload.Tab.id, frameId, {
                                method: 'get_content'
                            }, function (response) {
                                if (_.isObject(response) && 'code' in response && response.code === 0) {
                                    collection = collection.concat(response.collection);

                                    if (frameId === 0) {
                                        access = response.access;
                                    }
                                }

                                async();
                            });
                        });
                    }).catch(function (e) {
                        Skyload.setLog('Get all frames error', e);
                    });
                }
            }, 1000);

            return this;
        },
        fetchProfile: function fetchProfile() {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromPopupActionToBackground({ method: 'profile' }, function (response) {
                    try {
                        if (response.code !== 0) {
                            throw new Error(response.message);
                        }

                        if (!_.isObject(response.data)) {
                            throw new Error('Data profile must be object');
                        }

                        var profile = new ProfileModel(_.extend(response.data, {
                            login: true
                        }));

                        resolve(profile);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).then(function (profile) {
                _this6.profile = profile;
                _this6.trigger('profile_login', _this6.profile);
                _this6.trigger('profile_updated', _this6.profile);
            }).catch(function () {
                _this6.profile = new ProfileModel();
                _this6.trigger('profile_updated', _this6.profile);
            });
        },
        isSelectedMode: function isSelectedMode() {
            return this.selected_mode;
        },
        isDownloadMode: function isDownloadMode() {
            return this.download_mode;
        },
        isDownloadTemplate: function isDownloadTemplate() {
            return this.download_template;
        },
        setSelectedMode: function setSelectedMode(value) {
            this.selected_mode = !!value;
            this.$workspace[this.selected_mode ? 'addClass' : 'removeClass']('m-selected-mode');

            if (!value) {
                this.model.setSeparateDirectory(false);

                this.model.getCollection().each(function (model) {
                    return model.set('selected', false).set('user_selected', false);
                });
            }

            this.getContent().setLock(this.selected_mode);

            return this;
        },
        setDownloadMode: function setDownloadMode(value) {
            var _this7 = this;

            this.download_mode = !!value;
            this.$workspace[this.download_mode ? 'addClass' : 'removeClass']('m-download-mode');

            if (this.download_mode) {
                if (this.isSelectedMode()) {
                    this.setSelectedMode(false);
                }

                this.getContent().setLock(true);

                this.model.setDownloadCollection().then(function () {
                    _this7.getContent().setDownloadTitle();
                }).catch(function (e) {
                    Skyload.setLog('App', 'Set download collection error', e);
                });
            } else {
                if (!this.isSelectedMode()) {
                    this.getContent().setLock(false);
                }
            }

            return this.trigger('change_download_mode', this.download_mode);
        },
        loadingComplete: function loadingComplete() {
            var _this8 = this;

            setTimeout(function () {
                return _this8.$el.removeClass('m-body-preloader');
            }, 500);

            return this;
        },
        reload: function reload() {
            return location.reload();
        }
    });

    var App = Skyload.App = new Skyload.App();

    Skyload.Lang.onReady(function () {
        return App.init().render();
    });

    Skyload.OnRuntimeMessageListener(function (request, sender, callback) {
        var run = request.from === Skyload.ENVIRONMENT_BACKGROUND ? true : 'tab' in sender ? sender.tab.selected : false;

        if (request.to === Skyload.ENVIRONMENT_POPUP && run) {
            if ('index' in request) {
                var index = request.index;
                var model = App.getModel().getCollection().get(index);

                if (model instanceof Backbone.Model) {
                    switch (request.action) {
                        case 'set_download_id':
                            model.set('download_id', request.id);

                            break;
                        case 'set_download_progress':
                            model.set({
                                download_state: Skyload.DOWNLOAD_STATE_IN_PROGRESS,
                                download_progress: request.progress,
                                download_from: request.download_from
                            });

                            break;

                        case 'update_download':
                            model.set({
                                download_id: request.model.id,
                                download_state: request.model.state,
                                download_from: request.model.from,
                                download_pause: request.model.pause,
                                data: _.extend(model.get('data'), request.model.data)
                            });

                            break;
                        case 'update_model':
                            if (request.model.size) {
                                model.set('size', request.model.size);
                            }

                            if (request.model.duration) {
                                model.set('duration', request.model.duration);
                            }

                            if (model.get('type') === Skyload.TYPE_SOUND && 'play' in request.model && _.isString(request.model.play)) {
                                model.set('file', request.model.play);
                            }

                            model.set({
                                stream: request.model.stream,
                                stream_create: request.model.stream_create,
                                data: _.extend(model.get('data'), request.model.data)
                            });

                            break;

                    }
                }
            }

            callback(sender);
        }
    });
});