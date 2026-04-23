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

define('profile_view', ['profile_model', 'backbone', 'underscore', 'jquery', 'common'], function (ProfileModel, Backbone, _, $) {
    return Backbone.View.extend({
        model: ProfileModel,
        tagName: 'div',
        className: 'b-profile',
        template: _.template($('#template-profile').html()),
        profile: null,
        events: {
            'click .js-login': 'login',
            'click .js-donate': 'donate'
        },
        login: function login() {
            return Skyload.App.getMenu().login();
        },
        donate: function donate() {
            return Skyload.App.getMenu().donate();
        },
        getModel: function getModel() {
            return this.model;
        },
        initialize: function initialize() {
            var _this = this;

            Skyload.App.on('profile_updated', function () {
                return _this.render();
            });
        },
        render: function render() {
            if (this.model.isLogin()) {
                this.$el.addClass('m-profile-login');
            }

            this.$el.html(this.template({
                profile: this.model
            }));

            return this;
        }
    });
});