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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('lang', ['config', 'backbone', 'underscore', 'common'], function (Config, Backbone, _) {
    var Lang = function () {
        function Lang() {
            var _this = this;

            _classCallCheck(this, Lang);

            this.key = 'lang';
            this.messages = {};
            this.fallback_messages = {};

            this.events = _.extend({}, Backbone.Events);

            this.cache_messages = {};

            var details = Skyload.getDetails();

            this.fallback_locale = details.default_locale || 'en';

            this.locale = details.current_locale || details.default_locale || 'en';

            this.locales = _.clone(Config.Locales);

            Skyload.Storage(this.key, null, 'get', 'local').then(function (locale) {
                if (locale in _this.locales) {
                    _this.locale = locale;
                }

                if (_this.locale !== _this.fallback_locale) {
                    _this.getMessages(_this.fallback_locale).then(function (messages) {
                        return _this.fallback_messages = messages;
                    }).catch(function (e) {
                        _this.events.trigger('error', e);

                        Skyload.setLog('Lang', 'Get fallback locale error', e);
                    });
                }

                if (Skyload.Environment === Skyload.ENVIRONMENT_BACKGROUND) {
                    _this.setLocale(_this.locale);
                }

                return _this.getMessages(_this.locale);
            }).then(function (messages) {
                _this.messages = messages;
                _this.events.trigger('ready', _this.locale);
            }).catch(function (e) {
                _this.events.trigger('ready', _this.locale);
                _this.events.trigger('error', e);

                Skyload.setLog('Lang', 'Get current locale error', e);
            });
        }

        _createClass(Lang, [{
            key: 'onReady',
            value: function onReady(callback) {
                this.events.once('ready', callback);
                return this;
            }
        }, {
            key: 'get',
            value: function get(key) {
                if (key in this.messages) {
                    return this.messages[key];
                } else if (key in this.fallback_messages) {
                    return this.fallback_messages[key];
                } else {
                    try {
                        return chrome.i18n.getMessage(key) || key;
                    } catch (e) {
                        return key;
                    }
                }
            }
        }, {
            key: 'getMessages',
            value: function getMessages(locale) {
                var _this2 = this;

                if (!(locale in this.locales)) {
                    locale = this.locale;
                }

                if (locale in this.cache_messages) {
                    return Promise.resolve(this.cache_messages[locale]);
                }

                return this.fetch(locale).then(function (messages) {
                    _this2.cache_messages[locale] = messages;

                    return messages;
                });
            }
        }, {
            key: 'getLocales',
            value: function getLocales() {
                return this.locales;
            }
        }, {
            key: 'getNameLocale',
            value: function getNameLocale(locale) {
                return this.hasLocale(locale) ? this.locales[locale] : '';
            }
        }, {
            key: 'hasLocale',
            value: function hasLocale(locale) {
                return locale in this.locales;
            }
        }, {
            key: 'getLocale',
            value: function getLocale() {
                return this.locale;
            }
        }, {
            key: 'setLocale',
            value: function setLocale(locale) {
                var _this3 = this;

                if (Skyload.Environment === Skyload.ENVIRONMENT_BACKGROUND) {
                    return this.getMessages(locale).then(function (messages) {
                        _this3.locale = locale;
                        _this3.messages = messages;

                        return _this3.locale;
                    }).then(function (locale) {
                        return Skyload.Storage(_this3.key, locale, 'set', 'local');
                    }).then(function (locale) {
                        _this3.events.on('change', locale);
                        return locale;
                    });
                } else {
                    return new Promise(function (resolve, reject) {
                        Skyload.SendMessageFromPopupActionToBackground({
                            method: 'lang',
                            action: 'set_locale',
                            locale: locale
                        }, function (response) {
                            try {
                                if (response.code !== 0) {
                                    throw new Error(response.message);
                                }

                                resolve(response.data);
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                }
            }
        }, {
            key: 'link',
            value: function link(locale) {
                return Skyload.getLink('_locales/' + locale + '/messages.json');
            }
        }, {
            key: 'fetch',
            value: function fetch(locale) {
                if (Skyload.Environment === Skyload.ENVIRONMENT_BACKGROUND) {
                    return $.getJSON(this.link(locale)).then(function (messages) {
                        return _.chain(messages).each(function (message, key, list) {
                            list[key] = message.message;
                        }).value();
                    });
                } else {
                    return new Promise(function (resolve, reject) {
                        var method = Skyload[Skyload.Environment === Skyload.ENVIRONMENT_POPUP ? 'SendMessageFromPopupActionToBackground' : 'SendMessageFromContentToBackground'];

                        method.call(Skyload, {
                            method: 'lang',
                            action: 'get_messages',
                            locale: locale
                        }, function (response) {
                            if (response.code === 0) {
                                resolve(response.data);
                            } else {
                                reject(new Error(response.message));
                            }
                        });
                    });
                }
            }
        }]);

        return Lang;
    }();

    return Lang;
});