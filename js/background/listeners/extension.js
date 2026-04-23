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

define('extension_listener', ['collections', 'backbone', 'underscore'], function (Collections, Backbone, _) {
    var Listener = function () {
        function Listener() {
            _classCallCheck(this, Listener);
        }

        _createClass(Listener, [{
            key: 'cache',
            value: function cache(request, sender, callback) {
                try {
                    var response = { code: 0, message: 'Success' };
                    var namespace = Skyload.Methods.FirstUpperCase(request.namespace);
                    var collection = Skyload.Cache[namespace];
                    var action = request.action;

                    if (collection instanceof Backbone.Collection) {
                        if (collection.isReady()) {
                            switch (action) {
                                case 'get':
                                    var cache = [];
                                    var limit = request.limit || 0;
                                    var length = limit + 10000;

                                    collection = collection.chain();

                                    if ('source' in request && _.include(Skyload.AvailableSource, request.source)) {
                                        collection = collection.filter(function (model) {
                                            return model.get('source') == request.source;
                                        });
                                    }

                                    if (collection.value().length) {
                                        cache = collection.slice(limit, length).map(function (model) {
                                            return model.toJSON();
                                        }).value();
                                    }

                                    response.collection = cache;
                                    response.meta = {
                                        limit: limit,
                                        length: length,
                                        count: collection.length
                                    };

                                    break;
                                case 'set':
                                    request.json.cache = false;
                                    collection.set(request.json, { remove: false }).save();

                                    break;
                                default:
                                    throw new Error('Wrong action name - ' + action);

                                    break;
                            }

                            callback(response);
                        } else {
                            _.delay(function () {
                                Skyload.ExtensionListener.cache(request, sender, callback);
                            }, 1000);
                        }
                    } else {
                        throw new Error('Wrong collection namespace');
                    }
                } catch (e) {
                    callback({
                        code: 1,
                        message: e.message
                    });

                    Skyload.setLog('Cache', 'Error', e);
                }
            }
        }, {
            key: 'download',
            value: function download(request, sender, callback) {
                try {
                    var namespace = Skyload.Methods.FirstUpperCase(request.namespace);
                    var collection = Skyload.Cache[namespace];

                    if (collection instanceof Backbone.Collection) {
                        var model = collection.get(request.index);

                        if (!(model instanceof Backbone.Model)) {
                            if (request.from == Skyload.ENVIRONMENT_CONTENT) {
                                model = collection.create(request.model);
                            } else {
                                throw new Error('Model not found by id = ' + request.index);
                            }
                        }

                        var index = request.params.index || request.index;

                        var download = Skyload.Cache.Download.chain().filter(function (model) {
                            return model.get('index') == index && _.include([Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PENDING, Skyload.DOWNLOAD_STATE_PRE], model.get('state'));
                        }).first().value();

                        if (download instanceof Backbone.Model && download.get('pause') !== true) {
                            download.trigger('already_loaded');
                        } else {
                            model.download(request.params).then(function (response) {
                                callback({ code: 0, model: response });
                            }).catch(function (e) {
                                Skyload.Cache.Download.trigger('download_error', model, e);

                                callback({ code: 1, message: e.message });
                            });
                        }
                    } else {
                        throw new Error('Collection must be instance of Backbone.Collection');
                    }
                } catch (e) {
                    Skyload.setLog('Download error', request, e);
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'access',
            value: function access(request, sender, callback) {
                try {
                    var model;
                    switch (request.action) {
                        case 'get':
                            model = Skyload.Cache.Access.findWhere({ domain: request.domain });

                            if (model instanceof Backbone.Model) {
                                callback(model.toJSON());
                            } else {
                                throw new Error('Not found');
                            }
                            break;
                        case 'set':
                            Skyload.Cache.Access.set(request.model, { remove: false });
                            break;
                    }
                } catch (e) {
                    model = new Skyload.Models.AccessCache({ domain: request.domain });
                    callback(model.toJSON());
                }
            }
        }, {
            key: 'lang',
            value: function lang(request, sender, callback) {
                switch (request.action) {
                    case 'get_messages':
                        Skyload.Lang.getMessages(request.locale).then(function (messages) {
                            callback({ code: 0, data: messages });
                        }).catch(function (e) {
                            callback({ code: e.code || 1, message: e.message });
                        });

                        break;
                    case 'set_locale':
                        Skyload.Lang.setLocale(request.locale).then(function (locale) {
                            callback({ code: 0, data: locale });

                            Skyload.GetAllFramesOnSelectedTab(true).then(function (_ref) {
                                var tab = _ref.tab,
                                    frames = _ref.frames;

                                Skyload.Tab = tab;

                                _.each(frames, function (frame) {
                                    Skyload.SendMessageFromBackgroundToContentFrame(tab.id, frame.frameId, {
                                        method: 'refresh_lang'
                                    }, function (response) {});
                                });
                            }).catch(function (e) {
                                Skyload.setLog('Extension listener refresh content locale error', e);
                            });
                        }).catch(function (e) {
                            callback({ code: e.code || 1, message: e.message });
                        });

                        break;
                    default:
                        callback({ code: 1, message: 'Wrong lang action' });

                        break;
                }
            }
        }, {
            key: 'profile',
            value: function profile(request, sender, callback) {
                Skyload.Profile.getProfile().then(function (profile) {
                    callback({ code: 0, data: profile });
                }).catch(function (e) {
                    callback({ code: e.code || 2, message: e.message });
                });
            }
        }, {
            key: 'reset_profile',
            value: function reset_profile(request, sender, callback) {
                Skyload.Profile.resetProfile().then(function (profile) {
                    callback({ code: 0, data: profile });
                }).catch(function (e) {
                    callback({ code: e.code || 2, message: e.message });
                });
            }
        }, {
            key: 'logout_profile',
            value: function logout_profile(request, sender, callback) {
                Skyload.Profile.logout().then(function () {
                    callback({ code: 0 });
                }).catch(function (e) {
                    callback({ code: e.code || 2, message: e.message });
                });
            }
        }, {
            key: 'xhr',
            value: function xhr(request, sender, callback) {
                var req = new XMLHttpRequest(),
                    res = {};

                var url = request.url,
                    method = request.xhrMethod || 'GET',
                    post = request.post,
                    header = request.header;

                if (!req) return;

                method = method ? method : post ? 'POST' : 'GET';
                req.open(method, url, true);

                if ('type' in request && _.isString(request.type)) {
                    req.responseType = request.type;
                }

                if (post) {
                    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                }

                if (_.isObject(header) && _.size(header)) {
                    _.each(header, function (value, key) {
                        req.setRequestHeader(key, value);
                    });
                }

                req.onreadystatechange = function () {
                    if (req.readyState !== 4) return;

                    res = {
                        readyState: req.readyState,
                        response: req.response,
                        responseText: req.responseText,
                        responseType: req.responseType,
                        status: req.status,
                        statusText: req.statusText
                    };

                    callback({
                        response: res,
                        header: {
                            'length': req.getResponseHeader('Content-Length'),
                            'type': req.getResponseHeader('Content-Type')
                        }
                    });
                };

                if (req.readyState === 4) {
                    return;
                }

                if (post) req.send(post);else req.send();
            }
        }, {
            key: 'fetch',
            value: function (_fetch) {
                function fetch(_x, _x2, _x3) {
                    return _fetch.apply(this, arguments);
                }

                fetch.toString = function () {
                    return _fetch.toString();
                };

                return fetch;
            }(function (request, sender, callback) {
                fetch(request.url).then(function (response) {
                    switch (request.type) {
                        case 'json':
                            return response.json();

                        case 'text':
                        default:
                            return response.text();

                    }
                }).then(function (response) {
                    callback({ code: 0, data: response });
                }).catch(function (e) {
                    callback({ code: 1, message: e.message });
                });
            })
        }, {
            key: 'popup',
            value: function popup(request, sender, callback) {
                try {
                    var model = void 0,
                        collection = Skyload.Cache.Download.chain().filter(function (model) {
                        return _.include([Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PENDING], model.get('state'));
                    });

                    var count = collection.value().length;

                    switch (request.action) {
                        case 'get_download_state':
                            var queue = 0,
                                queue_count = 0,
                                queue_type = Skyload.TYPE_MIXED,
                                percent = 0,
                                type = Skyload.TYPE_MIXED;

                            if (count) {
                                type = collection.groupBy(function (model) {
                                    return model.get('type');
                                }).keys().value();
                                type = type.length === 1 ? _.first(type) : Skyload.TYPE_MIXED;

                                queue = collection.filter(function (model) {
                                    return model.get('state') === Skyload.DOWNLOAD_STATE_PENDING;
                                });

                                queue_count = queue.value().length;
                                queue_type = queue.groupBy(function (model) {
                                    return model.get('type');
                                }).keys().value();
                                queue_type = queue_type.length === 1 ? _.first(queue_type) : Skyload.TYPE_MIXED;

                                collection = Skyload.Cache.Download.chain();

                                var groups = collection.filter(function (model) {
                                    return !_.include([Skyload.DOWNLOAD_STATE_COMPLETE, Skyload.DOWNLOAD_STATE_INTERRUPTED], model.get('state'));
                                }).map(function (model) {
                                    return model.get('group');
                                }).uniq().compact().value();

                                var progress = collection.map(function (model) {
                                    var received = 0;

                                    var downloading_state = _.include([Skyload.DOWNLOAD_STATE_PENDING, Skyload.DOWNLOAD_STATE_IN_PROGRESS, Skyload.DOWNLOAD_STATE_PRE], model.get('state'));

                                    if (_.include(groups, model.get('group')) || downloading_state) {
                                        if (model.get('state') === Skyload.DOWNLOAD_STATE_COMPLETE) {
                                            received += model.get('size');
                                        } else if (downloading_state) {
                                            received += model.get('size') / 100 * model.get('progress');
                                        }

                                        return { total: model.get('size'), received: received };
                                    }
                                }).compact();

                                var total = progress.reduce(function (memo, item) {
                                    return memo + item.total;
                                }, 0).value();
                                var received = progress.reduce(function (memo, item) {
                                    return memo + item.received;
                                }, 0).value();

                                percent = parseFloat((received / (total / 100)).toFixed(2));

                                if (_.isNaN(percent) || !_.isNumber(percent)) {
                                    percent = 0;
                                }
                            }

                            callback({
                                count: count,
                                type: type,
                                queue_count: queue_count,
                                queue_type: queue_type,
                                percent: percent,
                                code: 0
                            });

                            break;
                        case 'pause_download':
                            model = Skyload.Cache.Download.get(request.index);

                            if (!(model instanceof Backbone.Model) && request.id > 0) {
                                model = Skyload.Cache.Download.findWhere({ id: request.id });
                            }

                            if (model instanceof Backbone.Model) {
                                model.pause().then(function () {
                                    return callback({ code: 0 });
                                }).catch(function (e) {
                                    return callback({ code: 1, message: e.message });
                                });
                            } else {
                                throw new Error('Model not found: index = ' + request.index + ', id = ' + request.id);
                            }

                            break;
                        case 'cancel_download':
                            var done = _.after(count, function () {
                                return callback({ code: 0 });
                            });

                            if (count) {
                                collection.each(function (model) {
                                    model.cancel().then(function () {
                                        return done();
                                    }).catch(function () {
                                        return done();
                                    });
                                });
                            }

                            break;
                        case 'cancel_download_once':
                            model = Skyload.Cache.Download.get(request.index);

                            if (!(model instanceof Backbone.Model) && request.id > 0) {
                                model = Skyload.Cache.Download.findWhere({ id: request.id });
                            }

                            if (model instanceof Backbone.Model) {
                                model.cancel().then(function () {
                                    return callback({ code: 0 });
                                }).catch(function (e) {
                                    return callback({ code: 1, message: e.message });
                                });
                            } else {
                                throw new Error('Model not found: index = ' + request.index + ', id = ' + request.id);
                            }

                            break;
                        case 'get_downloads':
                            collection = collection.map(function (model) {
                                return model.getContent();
                            }).value();

                            callback({
                                code: 0,
                                collection: collection
                            });

                            break;
                    }
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'get_parse_content',
            value: function get_parse_content(request, sender, callback) {
                Skyload.Tabs.GetParseContent(request.tab).then(function (collection) {
                    return callback({ code: 0, collection: collection });
                }).catch(function (e) {
                    callback({ code: 1, message: e.message });
                });
            }
        }, {
            key: 'clear_parse_content',
            value: function clear_parse_content(request, sender, callback) {
                try {
                    var id = request.id || sender.tab.id;

                    if (!_.isNumber(id)) {
                        throw new Error('Id is not number');
                    }

                    Skyload.Tabs.Get(id).then(function (tabModel) {
                        tabModel.clearParseIndexes();
                        callback({ code: 0 });
                    }).catch(function (e) {
                        callback({ code: 2, message: e.message });
                    });
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'parse_request',
            value: function parse_request(request, sender, callback) {
                try {
                    var file = _.extend(request.file, {
                        tabId: sender.tab.id,
                        frameId: sender.frameId
                    });

                    Skyload.Tabs.ParseRequest(file);

                    callback({ code: 0 });
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'get_fresh_model',
            value: function get_fresh_model(request, sender, callback) {
                try {
                    var collection = Skyload.Cache[Skyload.Methods.FirstUpperCase(request.type)];

                    if (!(collection instanceof Backbone.Collection)) {
                        throw new Error('Collection must be instance of Backbone.Collection, wrong type - ' + request.type);
                    }

                    var model = collection.get(request.index);

                    if (!(model instanceof Backbone.Model)) {
                        throw new Error('Model not found, index - ' + request.index);
                    }

                    var cover = model.getCover();
                    var json = _.extend(model.toJSON(), { cover: cover });

                    if (model.get('type') == Skyload.TYPE_SOUND) {
                        model.getFreshModel().then(function (model) {
                            callback({ code: 0, model: _.extend(model.toJSON(), { cover: cover }) });
                        }).catch(function () {
                            callback({ code: 2, model: json });
                        });
                    } else {
                        callback({ code: 3, model: json });
                    }
                } catch (e) {
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'analytics',
            value: function analytics(request, sender, callback) {
                callback(Skyload.setAnalytics(request.category, request.action, request.label, request.value));
            }
        }, {
            key: 'chrome',
            value: function (_chrome) {
                function chrome(_x4, _x5, _x6) {
                    return _chrome.apply(this, arguments);
                }

                chrome.toString = function () {
                    return _chrome.toString();
                };

                return chrome;
            }(function (request, sender, callback) {
                var method = request.group;
                var fn = request.function;
                var params = request.params || {};
                var type = request.type || 1;

                try {
                    var handler = undefined;

                    if (method in chrome && fn in chrome[method]) {
                        handler = chrome[method][fn];
                    }

                    if (!_.isFunction(handler)) {
                        throw new Error('Function "' + fn + '" not found in "' + method + '" chrome object');
                    }

                    switch (type) {
                        case 1:
                            callback(_.isObject(params) && !_.isEmpty(params) ? handler(params) : handler());

                            break;
                        case 2:
                            handler(params, callback);

                            break;
                        case 3:
                            handler.apply(false, params);

                            break;
                        case 4:
                            if (!_.isArray(params)) {
                                params = [];
                            }

                            params.push(callback);
                            handler.apply(false, params);

                            break;

                        case 5:
                        default:
                            handler(params);

                            break;
                    }
                } catch (e) {
                    Skyload.setLog('Extension listener method chrome', e);
                    callback(null);

                    console.log('!!!', request);

                    throw e;
                }
            })
        }, {
            key: 'sender',
            value: function sender(request, _sender, callback) {
                callback({ code: 0, sender: _sender });
            }
        }, {
            key: 'storage',
            value: function storage(request, sender, callback) {
                try {
                    var key = request.key;
                    var data = request.data || null;
                    var storage = null;

                    if (_.isObject(data)) {
                        data = JSON.stringify(data);
                    } else if (_.isNull(data)) {
                        data = 0;
                    }

                    data = data.toString();

                    switch (request.type) {
                        case 'local':
                            storage = localStorage;
                            break;
                        case 'session':
                            storage = sessionStorage;
                            break;
                        default:
                            throw new Error('Wrong type');
                    }

                    var response = storage[request.action](key, data);

                    callback({ code: 0, data: request.action == 'getItem' ? response : data });
                } catch (e) {
                    Skyload.setLog('Some error in storage', e);
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'set_libs_default',
            value: function set_libs_default(request, sender, callback) {
                try {
                    var params = Skyload.Methods.ParseURL(sender.tab.url);

                    switch (request.source) {
                        case Skyload.SOURCE_ODNOKLASSNIKI:
                            Skyload.Odnoklassniki.SetParams(params.scheme + ':', params.host, true);

                            break;
                        case Skyload.SOURCE_YANDEX:
                            Skyload.Yandex.SetDomain(params.host);

                            break;
                        case Skyload.SOURCE_SOUNDCLOUD:
                            Skyload.SoundCloud.SetClientId(request.id).SetSchema(params.scheme, params.host);

                            break;
                        case Skyload.SOURCE_VK:
                            Skyload.VK.SetUserId(request.user_id);

                            break;
                        default:
                            throw new Error('Wrong source');

                    }
                } catch (e) {
                    Skyload.setLog('Error in set libs default', e);
                    callback({ code: 1, message: e.message });
                }
            }
        }, {
            key: 'get_details',
            value: function get_details(request, sender, callback) {
                callback(Skyload.getDetails());
            }
        }]);

        return Listener;
    }();

    return Listener;
});