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

define('notification_model', ['backbone', 'underscore'], function (Backbone, _) {
    return Backbone.Model.extend({
        defaults: {
            id: null,
            type: 'basic',
            iconUrl: Skyload.getLink('images/skyload-logo-80.png'),
            title: null,
            message: null,
            url: null,
            show: false,
            history: 'local',
            actionType: 'url'
        },
        idAttribute: 'id',
        initialize: function initialize() {
            var notifications = this.getNotifications();

            if (_.include(notifications, this.get('id'))) {
                this.set('show', true);
            }
        },
        show: function show() {
            var _this = this;

            if (!_.isUndefined(chrome.notifications) && !this.get('show')) {
                chrome.notifications.create(this.get('id'), {
                    type: this.get('type'),
                    iconUrl: this.get('iconUrl'),
                    title: Skyload.getLocale(this.get('title')) || this.get('title'),
                    message: Skyload.getLocale(this.get('message')) || this.get('message')
                }, function (id) {
                    _this.set('id', id).setShow();
                    Skyload.Notifications.trigger('show_notification', id);
                });
            }

            return this;
        },
        close: function close() {
            chrome.notifications.clear(this.get('id'));
            return this;
        },
        action: function action() {
            var _this2 = this;

            switch (this.get('actionType')) {
                case Skyload.NOTIFICATION_TYPE_URL:
                    if (!_.isNull(this.get('url'))) {
                        Skyload.OpenTab(this.get('url')).then(function () {
                            Skyload.setAnalytics('Notifications', 'Action', _this2.get('id'));
                        });
                    }

                    break;
                case Skyload.NOTIFICATION_TYPE_DOWNLOADS:
                    chrome.downloads.showDefaultFolder();

                    break;
            }

            this.close();

            return this;
        },
        getNotifications: function getNotifications() {
            var message = [];

            switch (this.get('history')) {
                case 'local':
                    message = localStorage.getItem('notifications');
                    break;
                case 'session':
                    message = sessionStorage.getItem('notifications');
                    break;
            }

            return _.isNull(message) ? [] : message.split(',');
        },
        setNotifications: function setNotifications(array) {
            if (_.isArray(array)) {
                array = array.join(',');
            }

            switch (this.get('history')) {
                case 'local':
                    localStorage.setItem('notifications', array);
                    break;
                case 'session':
                    sessionStorage.setItem('notifications', array);
                    break;
            }

            return this;
        },
        setShow: function setShow() {
            var notifications = this.getNotifications();

            if (!_.include(notifications, this.get('id'))) {
                notifications.push(this.get('id'));
            }

            this.set('show', true);

            return this.setNotifications(notifications);
        }
    });
});