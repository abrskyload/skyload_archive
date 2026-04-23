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

define('profile_model', ['backbone', 'underscore', 'common'], function (Backbone, _) {

    return Backbone.Model.extend({
        defaults: {
            login: false,
            type: null,
            first_name: null,
            last_name: null,
            full_name: null,
            picture: null,
            subscription: false
        },
        initialize: function initialize() {
            var subscription = this.get('subscription');

            if (_.isObject(subscription)) {
                this.set('subscription', new (Backbone.Model.extend({
                    defaults: {
                        plan: null,
                        name: null,
                        expired: null
                    }
                }))(subscription));
            }
        },
        logout: function logout() {
            return new Promise(function (resolve, reject) {
                Skyload.SendMessageFromPopupActionToBackground({
                    method: 'logout_profile'
                }, function (response) {
                    if (response.code == 0) {
                        resolve();
                    } else {
                        reject(new Error(response.message));
                    }
                });
            });
        },
        isLogin: function isLogin() {
            return this.get('login');
        },
        hasSubscription: function hasSubscription() {
            return this.get('subscription') instanceof Backbone.Model;
        },
        getFullName: function getFullName() {
            return this.get('full_name');
        },
        getPicture: function getPicture() {
            return this.get('picture');
        },
        getSubscription: function getSubscription() {
            return this.get('subscription');
        }
    });
});