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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _gaId = 'UA-44998106-1';

var _gaq = _gaq || [];
_gaq.push(['_setAccount', _gaId]);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

window.onerror = function (message, file, line, col, error) {
    _gaq.push(['_trackEvent', 'Background', 'Window Error', message + ', line: ' + line]);
    Skyload.setLog('Window', 'Error', message);
};

define(['config', 'common', 'profile', 'tabs', 'lang', 'models', 'collections', 'extension_listener', 'backbone', 'underscore', 'jquery'], function (Config, Skyload, Profile, Tabs, Lang, Models, Collections, ExtensionListener, Backbone, _, $) {
    window.Skyload = Skyload = _.extend(Skyload, {
        Cache: {},
        Environment: Skyload.ENVIRONMENT_BACKGROUND,
        CacheNamespace: {
            sound: Skyload.COLLECTION_TYPE_SOUND,
            video: Skyload.COLLECTION_TYPE_VIDEO,
            download: Skyload.COLLECTION_TYPE_DOWNLOAD,
            access: Skyload.COLLECTION_TYPE_ACCESS
        },
        CacheAction: ['get', 'set'],
        MessageHandler: function MessageHandler(request, sender) {
            return new Promise(function (resolve, reject) {
                try {
                    var method = Skyload.ExtensionListener[request.method];

                    if (_.isUndefined(method)) {
                        throw new Error('Undefined method (' + request.method + ')');
                    }

                    method(request, sender, resolve);
                } catch (e) {
                    reject(e);
                }
            });
        },
        SendMessageFromContentToBackground: function SendMessageFromContentToBackground(request, callback) {
            this.MessageHandler(request, {}).then(callback, callback);
            return this;
        },
        setAnalytics: function setAnalytics(category, action, label, value) {
            return _gaq.push(['_trackEvent', category, action, label, value]);
        },
        Analytics: function Analytics(category, action, label, value) {
            return this.setAnalytics(category, action, label, value);
        },
        getUrlParam: function getUrlParam() {
            return $.param({
                lang: Skyload.getCurrentLocale(),
                utm_source: 'background',
                utm_medium: 'cpc',
                utm_content: Skyload.getVersion(),
                utm_campaign: 'skyload_extension'
            });
        },
        getWelcomePageUrl: function getWelcomePageUrl() {
            var url = this.getDetails().homepage_url;
            var param = this.getUrlParam();

            return url + '/welcome?' + param;
        },
        getUninstallUrl: function getUninstallUrl() {
            var url = this.getDetails().homepage_url;
            var param = this.getUrlParam();

            return url + '/uninstall?' + param;
        },
        getExternalWelcomePageUrl: function getExternalWelcomePageUrl() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var url = _this.getDetails().homepage_url;

                url += '/api/get-welcome-url?' + $.param({
                    'lang': Skyload.getCurrentLocale()
                });

                Skyload.Methods.XHR(url, function (_ref) {
                    var response = _ref.response;

                    try {
                        var json = JSON.parse(response.response);

                        if (!json || !json.data || !json.data.url) {
                            throw new Error('Welcome url not set');
                        }

                        resolve(json.data.url);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    });

    indexedDB.deleteDatabase(Config.DataBase.id);

    Skyload.Profile = new Profile();
    Skyload.Tabs = new Tabs();
    Skyload.Models = new Models();
    Skyload.Collections = new Collections();
    Skyload.ExtensionListener = new ExtensionListener();
    Skyload.Lang = new Lang();
    Skyload.Notifications = new Skyload.Collections.Notifications();

    Skyload.Notifications.on('clicked', function (model) {
        if (model.get('actionType') === Skyload.NOTIFICATION_TYPE_DOWNLOADING) {
            Skyload.Cache.Download.off('start_downloading');
        }
    }).on('donate_notification_group', function () {
        Skyload.Notifications.trigger('show_donate_notification');
    }).on('donate_notification_several', _.after(2, function () {
        Skyload.Notifications.trigger('show_donate_notification');
    })).once('show_donate_notification', function () {
        Skyload.Profile.hasSubscription().then(function (has) {
            if (!has) {
                var messages = _.chain([1, 2, 3]).map(function (item) {
                    return {
                        title: 'donate_notification_title_' + item,
                        message: 'donate_notification_message_' + item
                    };
                }).value();

                var message = messages[_.random(0, messages.length - 1)];
                var url = Skyload.getDetails().homepage_url + '/donate?' + $.param({
                    lang: Skyload.getCurrentLocale(),
                    utm_source: 'background',
                    utm_medium: 'cpc',
                    utm_content: 'donate',
                    utm_campaign: 'skyload_extension',
                    utm_term: [Skyload.getLocale(messages.title), Skyload.getLocale(message.message), Skyload.getCurrentLocale()].join(',')
                });

                var notification = Skyload.Notifications.add({
                    id: 'donate',
                    title: message.title,
                    message: message.message,
                    history: 'session',
                    url: url
                });

                setTimeout(function () {
                    return notification.show();
                }, 15000);
            }
        }).catch(function (e) {
            return Skyload.setLog('Background', 'Donate notification', e);
        });
    });

    Skyload.Cache.Download.on('destroy', function (model) {
        Skyload.Cache.Download.remove(model);
    }).on('download_error', function (model, e) {
        Skyload.Notifications.add({
            title: 'notification_error_title',
            message: 'notification_error_message',
            history: 'session',
            actionType: null
        }).show();

        Skyload.setLog('Background', 'Download error', e);
    }).on('add', function (model) {
        if (model.get('environment') === Skyload.ENVIRONMENT_CONTENT) {
            Skyload.Cache.Download.trigger('start_downloading', model);
        }
    }).once('start_downloading', function (model) {
        if (model.get('type') === Skyload.TYPE_SOUND) {
            Skyload.Notifications.add({
                id: model.get('index'),
                title: 'download_notification_title',
                message: 'download_notification_message',
                history: 'session',
                actionType: Skyload.NOTIFICATION_TYPE_DOWNLOADING
            }).show();
        }
    }).on('complete_download', function (model) {
        Skyload.Notifications.add({
            id: model.get('group').toString(),
            title: 'app_name',
            message: 'g_d_complete',
            history: 'session',
            actionType: Skyload.NOTIFICATION_TYPE_DOWNLOADS
        }).show();

        Skyload.Notifications.trigger('donate_notification_group');
    }).on('already_loaded', function () {
        Skyload.Notifications.add({
            title: 'in_the_queue_3',
            message: 'push_to_icon',
            history: 'session',
            actionType: null
        }).show();
    }).on('change:state', function (model, state) {
        if (state === Skyload.DOWNLOAD_STATE_COMPLETE && _.isNull(model.get('group'))) {
            Skyload.Notifications.trigger('donate_notification_several');
        }

        if (state === Skyload.DOWNLOAD_STATE_COMPLETE && !_.isNull(model.get('group'))) {
            Skyload.Cache.Download.completeDownload(model);
        }

        if (state === Skyload.DOWNLOAD_STATE_COMPLETE || state === Skyload.DOWNLOAD_STATE_INTERRUPTED) {
            model.stopWatchProgress();
        }
    }).on('change:pause', function (model, pause) {
        if (!pause) {
            Skyload.Notifications.add({
                title: 'the_file_is_loaded',
                message: 'resume_message',
                history: 'session',
                actionType: null
            }).show();
        }
    }).on('change:progress', _.throttle(function (model, progress) {
        Skyload.SendMessageFromBackgroundToPopupAction({
            action: 'set_download_progress',
            index: model.getIndex(),
            progress: progress,
            download_from: model.get('from')
        });
    }, 300)).on('change:id change:pause change:state change:from change:data', function (model) {
        Skyload.SendMessageFromBackgroundToPopupAction({
            action: 'update_download',
            index: model.getIndex(),
            model: model.toJSON()
        });
    });

    Skyload.Cache.Sound.on('change:size change:play change:stream change:stream_create change:duration change:data', function (model) {
        Skyload.SendMessageFromBackgroundToPopupAction({
            action: 'update_model',
            index: model.getId(),
            model: model.toJSON()
        });
    });

    Skyload.Cache.Video.on('change:stream change:stream_create change:data', function (model) {
        Skyload.SendMessageFromBackgroundToPopupAction({
            action: 'update_model',
            index: model.getId(),
            model: model.toJSON()
        });
    }).on('change:size', _.throttle(function (model) {
        Skyload.SendMessageFromBackgroundToPopupAction({
            action: 'update_model',
            index: model.getId(),
            model: model.toJSON()
        });
    }), 300);

    setInterval(function () {
        Skyload.Cache.Download.downloadQueue();
        Skyload.Tabs.Trigger();
    }, 1000);

    Skyload.OnInstalledListener(function (details) {
        var clear = function clear() {
            Skyload.Storage('version', Skyload.getVersion(), 'set', 'local').catch(function (e) {
                Skyload.setLog('Background', 'Set version error', e);
            });

            sessionStorage.clear();
        };

        Skyload.SetUninstallURL(Skyload.getUninstallUrl());

        if (details.reason === 'update' && details.previousVersion !== Skyload.getVersion()) {
            Skyload.setAnalytics('Background', 'Update', Skyload.getVersion());
            clear();
        } else if (details.reason === 'install') {
            Skyload.setAnalytics('Background', 'Install', Skyload.getVersion());
            Skyload.OpenTab(Skyload.getWelcomePageUrl());

            Skyload.getExternalWelcomePageUrl().then(function (url) {
                Skyload.OpenTab(url, false);
            }).catch(function (e) {});

            clear();
        }
    }).OnHeadersReceivedListener(function (details) {
        if (details.tabId === -1) {
            if (details.initiator.includes('deezer.com')) {
                Skyload.FindFirstTab({ url: '*://*.deezer.com/*' }).then(function (tab) {
                    if (!_.isObject(tab)) {
                        return;
                    }

                    Skyload.Tabs.ParseRequest(_extends({}, details, {
                        frameId: 0,
                        tabId: tab.id
                    }));
                }).catch(function (e) {
                    Skyload.setLog('Fist first tab for Deezer', e);
                });
            }

            return;
        }

        if (details.statusCode < 200 || details.statusCode > 400 || details.statusCode === 204) {
            return;
        }

        Skyload.Tabs.ParseRequest(details);
    }).OnBackgroundMessageListener(function (request, sender, callback) {
        Skyload.MessageHandler(request, sender).then(callback, callback);
    }).OnCreatedDownloadListener(function (downloadDelta) {
        var id = downloadDelta.id;


        setTimeout(function () {
            var model = Skyload.Cache.Download.findWhere({ id: id });

            if (model instanceof Backbone.Model) {
                model.startWatchProgress().catch(function (e) {
                    Skyload.setLog('Background', 'Model download start watch progress error on create', e);
                });
            }
        }, 1000);
    }).OnChangedDownloadListener(function (downloadDelta) {
        var model = Skyload.Cache.Download.findWhere({ id: downloadDelta.id });

        if (model instanceof Backbone.Model) {
            if ('state' in downloadDelta) {
                model.setState(downloadDelta.state.current);
            } else if ('paused' in downloadDelta) {
                model.setPause(downloadDelta.paused.current);
            } else if ('exists' in downloadDelta) {
                if (downloadDelta.exists.current === false) {
                    model.cancel().catch(function () {
                        Skyload.Cache.Download.remove(model);
                    });
                }
            } else if ('error' in downloadDelta) {
                model.cancel().catch(function () {
                    Skyload.Cache.Download.remove(model);
                });
            } else {
                model.startWatchProgress().catch(function (e) {
                    Skyload.setLog('Background', 'Model download start watch progress error', e);
                });
            }
        }
    }).OnClickedNotificationsListener(function (notificationId) {
        var notifications = Skyload.Notifications;

        if (notifications instanceof Backbone.Collection) {
            var notification = notifications.get(notificationId);

            if (!_.isUndefined(notification)) {
                notifications.trigger('clicked', notification);
                notification.action();
            }
        }
    }).OnButtonClickedNotificationsListener(function (notificationId) {
        Skyload.setAnalytics('Notifications', 'Button Clicked', notificationId);
    }).OnClosedNotificationsListener(function (notificationId) {
        Skyload.setAnalytics('Notifications', 'Closed', notificationId);
    });
});