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

define('menu_view', ['profile_view', 'backbone', 'browser', 'underscore', 'jquery', 'scrollbar', 'common'], function (ProfileView, Backbone, Browser, _, $) {

    return Backbone.View.extend({
        tagName: 'aside',
        className: 'l-menu m-menu',
        template: _.template($('#template-menu').html()),
        isOpen: false,
        $scrollBar: null,
        $profile: null,
        site: Skyload.getDetails().homepage_url,
        events: {
            'click .js-logo': 'goToSite',
            'click .js-close': 'close',
            'click .js-menu-item-navigation': 'navigation',
            'click .js-menu-item-lang:not(.m-menu-item-active)': 'locale'
        },
        url: function url(path, term) {
            if (!_.isArray(term)) {
                term = _.isString(term) ? [term] : [];
            }

            term.concat([Browser.platform, Browser.name, Skyload.getCurrentLocale()]);

            var params = $.param({
                lang: Skyload.getCurrentLocale(),
                utm_source: Browser.name,
                utm_medium: 'menu',
                utm_content: path,
                utm_term: term.join(','),
                utm_campaign: 'skyload_extension'
            });

            return this.site + '/' + (path || '') + '?' + params;
        },
        get siteUrl() {
            return this.url();
        },
        get loginUrl() {
            return this.url('login');
        },
        get loginSiteStateUrl() {
            return this.url('login', 'site_state');
        },
        get donateUrl() {
            return this.url('donate');
        },
        get helpUrl() {
            return this.url('help');
        },
        get helpEmptyStateUrl() {
            return this.url('help', 'empty_state');
        },
        get privacyPolicyUrl() {
            return this.url('privacy-policy');
        },
        get userAgreementUrl() {
            return this.url('user-agreement');
        },
        get vkSupportPageUrl() {
            return this.url('link/vk-support');
        },
        get vkUrl() {
            return this.url('link/vk');
        },
        get facebookUrl() {
            return this.url('link/facebook');
        },
        get downloadYouTubeUrl() {
            return this.helpUrl + '#how-to-download-from-youtube';
        },
        get hashtapUrl() {
            return this.url('link/hashtap');
        },
        goToSite: function goToSite() {
            return Skyload.OpenTab(this.siteUrl);
        },
        initialize: function initialize() {
            var _this = this;

            Skyload.App.on('profile_updated', function () {
                return _this.render();
            });
        },
        render: function render() {
            var _this2 = this;

            this.$el.html(this.template({
                menu: {
                    site: Skyload.getLocale('menu_site'),
                    donate: Skyload.getLocale('menu_donate'),
                    help: Skyload.getLocale('menu_help'),
                    vk: Skyload.getLocale('menu_help_vk'),
                    eula: Skyload.getLocale('menu_user_agreement'),
                    pp: Skyload.getLocale('menu_privacy_policy'),
                    login: Skyload.getLocale('menu_login'),
                    logout: Skyload.getLocale('menu_logout')
                },
                social_networks: {
                    ht: Skyload.getLocale('source_name_hashtap'),
                    vk: Skyload.getLocale('source_name_vk'),
                    fb: Skyload.getLocale('source_name_fb')
                },
                hashtap_url: this.hashtapUrl
            }));

            this.$scrollBar = this.$el.find('.js-menu-scroll-bar');
            this.$profile = this.$el.find('.js-menu-profile');

            this.$scrollBar.scrollBar({
                class_container: 'b-scroll-bar',
                class_scrollbar: 'b-scroll-bar__rail',
                class_track: 'b-scroll-bar__track',
                class_thumb: 'b-scroll-bar__track__thumb',
                class_view_port: 'b-scroll-view-port',
                class_overview: 'b-scroll-view-port__overview',
                class_disable: 'm-scroll-disable',
                class_move: 'm-scroll-move'
            });

            var profile = new ProfileView({ model: Skyload.App.getProfile() });

            this.$profile.html(profile.render().el);
            this.$profile.find('.js-profile-button').addClass('b-panel__button');

            this.$scrollBar.scrollBarUpdate(0);

            Skyload.App.on('blanket', function () {
                if (_this2.isOpen) {
                    _this2.close();
                }
            });

            if (Skyload.App.getProfile().isLogin()) {
                this.$el.addClass('m-menu-profile-login');
            }

            return this;
        },
        openTab: function openTab(url) {
            Skyload.OpenTab(url).catch(function (e) {
                Skyload.setLog('Menu', 'Error', e);
            });

            return this;
        },
        control: function control(value) {
            this.isOpen = value;
            Skyload.App.$el[value ? 'addClass' : 'removeClass']('m-menu-open');

            if (value) {
                this.$scrollBar.scrollBarUpdate(0);
            }

            return this;
        },
        open: function open() {
            Skyload.Analytics('Menu', 'Open');
            return this.control(true);
        },
        close: function close() {
            return this.control(false);
        },
        login: function login() {
            Skyload.Analytics('Menu', 'Login');
            return this.openTab(this.loginUrl);
        },
        donate: function donate() {
            Skyload.Analytics('Menu', 'Donate');
            return this.openTab(this.donateUrl);
        },
        navigation: function navigation(e) {
            var $item = $(e.currentTarget);
            var item = $item.data('item');
            var profile = Skyload.App.getProfile();

            var data = {
                site: this.site,
                donate: this.donateUrl,
                help: this.helpUrl,
                vk: this.vkSupportPageUrl,
                eula: this.userAgreementUrl,
                pp: this.privacyPolicyUrl,
                login: this.loginUrl,
                vk_page: this.vkUrl,
                fb_page: this.facebookUrl,
                ht_page: this.hashtapUrl
            };

            if (item == 'logout' && profile.isLogin()) {
                Skyload.Analytics('Menu', 'Logout');

                profile.logout().then(function () {
                    Skyload.GetSelectedTab().then(function (tab) {
                        return new Promise(function (resolve) {
                            var host = Skyload.parseURL(tab.url).host;

                            if (host.indexOf('skyload.io') >= 0) {
                                Skyload.SendMessageFromPopupActionToContent(tab.id, {
                                    method: 'reload'
                                }, function () {
                                    resolve(tab);
                                });
                            } else {
                                resolve(tab);
                            }
                        });
                    }).then(function () {
                        Skyload.App.reload();
                    }).catch(function (e) {
                        Skyload.setLog('Menu', 'Reload content page', e);
                        Skyload.App.reload();
                    });
                }).catch(function (e) {
                    Skyload.setLog('Menu', 'Logout error', e);
                });
            } else if (item in data) {
                Skyload.Analytics('Menu navigation', item);
                this.openTab(data[item]);
            }

            return this;
        },
        locale: function locale(e) {
            var $item = $(e.currentTarget);
            var locale = $item.data('locale');

            if (Skyload.Lang.hasLocale(locale)) {
                Skyload.Analytics('Locale', locale);

                Skyload.Lang.setLocale(locale).then(function () {
                    Skyload.App.reload();
                }).catch(function (e) {
                    Skyload.setLog('Menu', 'Change locale error', e);
                });
            }

            return this;
        }
    });
});