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

define('APP', ['jquery', 'underscore', 'backbone', 'common', 'lang', 'models', 'collections', 'views', 'methods', 'custodian'], function ($, _, Backbone, Skyload, Lang, Models, Collections, Views) {
    window.SkyloadDefaultComponents = {
        Models: {},
        Collections: {},
        Views: {},
        Methods: {}
    };

    Skyload.Lang = new Lang();

    Skyload.Models = new Models();
    Skyload.Collections = new Collections();

    Skyload.Views = new Views();
    Skyload.SoundView = Skyload.Views.SoundView;
    Skyload.VideoView = Skyload.Views.VideoView;
    Skyload.AppView = Skyload.Views.AppView;

    Skyload.MessageListener = {
        reload: function reload(request, sender, callback) {
            callback({ code: 0 });
            location.reload();
        },
        refresh_lang: function refresh_lang(request, sender, callback) {
            Skyload.Lang = new Lang();
        },
        access: function access(request, sender, callback) {
            Skyload.Custodian.SetAccess(request.access);
            callback({ code: 0, complete: true });
        },
        has_instance: function has_instance(request, sender, callback) {
            callback({ code: 0, has: Skyload.Custodian.HasInstance(request.name.toUpperCase()) });
        },
        has_content: function has_content(request, sender, callback) {
            callback({ code: 0, count: Skyload.Custodian.GetContentCount() });
        },
        get_content: function get_content(request, sender, callback) {
            if (Skyload.Custodian.HasParse()) {
                Skyload.Custodian.GetContent().then(function (collection) {
                    callback({
                        code: 0,
                        collection: collection
                    });
                });
            } else {
                callback({
                    code: 1,
                    message: 'None instance for parse'
                });
            }
        },
        find_content_info: function find_content_info(request, sender, callback) {
            try {
                var type = request.type;
                var name = request.name.toUpperCase();
                var instance = Skyload.Custodian.GetInstance(name);

                if (Skyload.AvailableTypes.indexOf(type) < 0) {
                    throw new Error('Wrong type');
                }

                if (_.isNull(instance)) {
                    throw new Error('None instance to find video info');
                }

                var handler = null;

                switch (type) {
                    case Skyload.TYPE_SOUND:
                        handler = instance.findSoundInfo();

                        break;
                    case Skyload.TYPE_VIDEO:
                        handler = instance.findVideoInfo();

                        break;
                }

                handler.then(function (model) {
                    callback({ code: 0, model: model });
                }).catch(function (e) {
                    callback({ code: 2, message: e.message });
                });
            } catch (e) {
                callback({ code: 1, message: e.message });
            }
        }
    };

    Skyload.OnContentMessageListener(function (request, sender, callback) {
        var method = Skyload.MessageListener[request.method];

        if (!_.isUndefined(method)) {
            method(request, sender, callback);
        }
    });

    Backbone.sync = function (method, model, options) {
        options = _.extend({
            success: function success() {},
            error: function error() {}
        }, options);

        try {
            if (model instanceof Backbone.Model) {
                var namespace = model.getType();
                var json = model.getJSON();

                Skyload.SendMessageFromContentToBackground({
                    method: 'cache',
                    action: 'set',
                    namespace: namespace,
                    json: json
                }, function (response) {
                    if (response.code === 0) {
                        model.set('sync', true);
                        options.success(model);
                    } else {
                        Skyload.setLog('App sync background error', response.message);
                        options.error(new Error(response.message));
                    }
                });
            } else {
                throw new Error('Param model must be instance of Backbone.Model');
            }
        } catch (e) {
            options.error(e);
        }
    };

    return Skyload;
});