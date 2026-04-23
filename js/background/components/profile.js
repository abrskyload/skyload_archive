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

define('profile', ['backbone', 'underscore', 'methods'], function (Backbone, _) {
    var Profile = function () {
        function Profile() {
            _classCallCheck(this, Profile);

            this.url = 'http://skyload.io/api/';

            this.token = null;
            this.profile = null;

            this.events = _.extend({}, Backbone.Events);
        }

        _createClass(Profile, [{
            key: 'onUpdate',
            value: function onUpdate(callback) {
                this.events.on('update_profile', callback);
                return this;
            }
        }, {
            key: 'onReset',
            value: function onReset(callback) {
                this.events.on('reset_profile', callback);
                return this;
            }
        }, {
            key: 'get',
            value: function get() {
                return this.getProfile();
            }
        }, {
            key: 'getToken',
            value: function getToken() {
                var _this = this;

                if (!_.isNull(this.token)) {
                    return Promise.resolve(this.token);
                }

                return this.fetchToken().then(function (token) {
                    _this.token = token;

                    return _this.token;
                });
            }
        }, {
            key: 'getProfile',
            value: function getProfile() {
                var _this2 = this;

                if (!_.isNull(this.profile)) {
                    return Promise.resolve(this.profile);
                } else if (this.profile === false) {
                    return Promise.reject(new Error('Empty profile'));
                }

                return this.fetchProfile().then(function (profile) {
                    _this2.profile = profile;
                    _this2.events.trigger('update_profile', profile);

                    return _this2.profile;
                }).catch(function () {
                    _this2.events.trigger('reset_profile');
                    return _this2.profile = false;
                });
            }
        }, {
            key: 'hasSubscription',
            value: function hasSubscription() {
                return this.getProfile().then(function (profile) {
                    return _.isObject(profile) && 'subscription' in profile && _.isObject(profile.subscription);
                }).catch(function () {
                    return false;
                });
            }
        }, {
            key: 'resetProfile',
            value: function resetProfile() {
                this.token = null;
                this.profile = null;

                this.events.trigger('reset_profile');

                return this.getProfile();
            }
        }, {
            key: 'fetch',
            value: function fetch(url, method, headers) {
                return new Promise(function (resolve, reject) {
                    if (!_.isObject(headers)) {
                        headers = {};
                    }

                    headers['X-Requested-With'] = 'XMLHttpRequest';

                    Skyload.Methods.XHR(url, function (response) {
                        try {
                            resolve(JSON.parse(response.response.responseText));
                        } catch (e) {
                            reject(e);
                        }
                    }, method, null, null, null, headers);
                });
            }
        }, {
            key: 'fetchToken',
            value: function fetchToken() {
                return this.fetch(this.apiTokenUrl, 'post').then(function (json) {
                    if (json.meta.code == 0) {
                        return json.data;
                    }

                    throw new Error('Token - ' + json.meta.message);
                });
            }
        }, {
            key: 'fetchProfile',
            value: function fetchProfile() {
                var _this3 = this;

                return this.getToken().then(function (token) {
                    return _this3.fetch(_this3.apiProfileUrl, 'post', { 'X-CSRF-TOKEN': token });
                }).then(function (json) {
                    if (json.meta.code == 0) {
                        return json.data;
                    }

                    throw new Error(json.meta.message);
                });
            }
        }, {
            key: 'logout',
            value: function logout() {
                var _this4 = this;

                return this.getToken().then(function (token) {
                    return _this4.fetch(_this4.apiLogoutUrl, 'post', { 'X-CSRF-TOKEN': token });
                }).then(function (json) {
                    if (json.meta.code == 0) {
                        _this4.token = null;
                        _this4.profile = null;

                        _this4.events.trigger('reset_profile');
                    } else {
                        throw new Error(json.meta.message);
                    }
                });
            }
        }, {
            key: 'apiTokenUrl',
            get: function get() {
                return this.url + 'token';
            }
        }, {
            key: 'apiProfileUrl',
            get: function get() {
                return this.url + 'user/profile';
            }
        }, {
            key: 'apiLogoutUrl',
            get: function get() {
                return this.url + 'user/logout';
            }
        }]);

        return Profile;
    }();

    return Profile;
});