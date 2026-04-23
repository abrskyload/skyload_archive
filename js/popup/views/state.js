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

define('state_view', ['profile_view', 'backbone', 'underscore', 'jquery', 'common'], function (ProfileView, Backbone, _, $) {
    return Backbone.View.extend({
        tagName: 'div',
        className: 'l-state',
        template: _.template($('#template-state').html()),
        state: Skyload.POPUP_STATE_EMPTY,
        $content: null,
        profile: null,
        events: {
            'click .js-logo': 'goToSite',
            'click .js-menu-open': 'openMenu'
        },
        initialize: function initialize() {
            var _this = this;

            Skyload.App.on('profile_updated', function () {
                if (_this.state === Skyload.POPUP_STATE_SKYLOAD) {
                    _this.render();
                }
            });
        },
        render: function render(state) {
            var profile = Skyload.App.getProfile();

            if (!_.isUndefined(state)) {
                this.state = state;
            }

            this.$el.addClass('m-state-' + this.state).html(this.template());

            this.$content = this.$el.find('.js-state-content');
            this.$content.append(this.getTemplate()({ profile: profile }));

            if (this.state === Skyload.POPUP_STATE_SKYLOAD && profile.isLogin()) {
                this.profile = new ProfileView({ model: profile });

                this.$content.append(this.profile.render().el);
                this.$content.find('.js-profile-button').addClass('b-button b-button-blue b-button-selected b-button-long b-state__button');
            }

            return this;
        },
        getTemplate: function getTemplate() {
            return _.template($('#template-state-' + this.state).html());
        },
        openMenu: function openMenu() {
            Skyload.App.getMenu().open();
            return this;
        },
        goToSite: function goToSite() {
            Skyload.App.getMenu().goToSite();
        }
    });
});