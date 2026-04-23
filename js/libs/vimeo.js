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

define('vimeo', ['underscore', 'methods'], function (_) {
    var Vimeo = function () {
        function Vimeo() {
            _classCallCheck(this, Vimeo);

            this.sig = Skyload.SOURCE_VIMEO;
        }

        _createClass(Vimeo, [{
            key: 'Call',
            value: function Call(id, callback) {
                this.Get(id).then(callback, function (e) {
                    Skyload.setLog('Vimeo Libs', 'Get error', e);
                    Skyload.Analytics('Vimeo', 'Error', 'Get model', e.message);
                    callback(null);
                });

                return this;
            }
        }, {
            key: 'Get',
            value: function Get(id) {
                return this.GetModel(id);
            }
        }, {
            key: 'GetModel',
            value: function GetModel(id) {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    _this.GetModelNoEmbed(id).then(resolve).catch(function () {
                        _this.GetModelEmbed(id).then(resolve).catch(reject);
                    });
                });
            }
        }, {
            key: 'GetModelNoEmbed',
            value: function GetModelNoEmbed(id) {
                var _this2 = this;

                return new Promise(function (resolve, reject) {
                    var url = 'https://vimeo.com/' + id;

                    Skyload.Methods.XHR(url, function (r) {
                        try {
                            r = r.response;

                            if (r.status == 200 && r.responseText) {
                                var data = r.responseText;
                                var configUrl = data.match(/data-config-url=["']([^\s"'<>]+)/i);
                                configUrl = configUrl && configUrl[1].replace(/&amp;/ig, '&');

                                if (configUrl) {
                                    _this2.GetConfigModel(configUrl).then(resolve, reject);
                                } else {
                                    _this2.GetClipPageConfig(data).then(resolve, reject);
                                }
                            } else {
                                throw new Error('Empty response text or bad status');
                            }
                        } catch (e) {
                            reject(e);
                            Skyload.setLog('Vimeo Libs', 'Get model no embed error', e);
                        }
                    });
                });
            }
        }, {
            key: 'GetModelEmbed',
            value: function GetModelEmbed(id) {
                var _this3 = this;

                return new Promise(function (resolve, reject) {
                    var url = 'https://player.vimeo.com/video/' + id;

                    Skyload.Methods.XHR(url, function (r) {
                        try {
                            r = r.response;

                            if (r.status == 200 && r.responseText) {
                                var data = r.responseText;
                                var jsonList = Skyload.Methods.FindJson(data, [/"files":/]);
                                var config = null;

                                jsonList.some(function (obj) {
                                    if (!obj.video || !obj.request || !obj.request.files) {
                                        return;
                                    }

                                    config = obj;
                                    return true;
                                });

                                resolve(_this3._GetModelFromConfig(config));
                            } else {
                                throw new Error('Empty response text or bad status');
                            }
                        } catch (e) {
                            reject(e);
                            Skyload.setLog('Vimeo Libs', 'Get model embed error', e);
                        }
                    });
                });
            }
        }, {
            key: 'GetConfigModel',
            value: function GetConfigModel(url) {
                var _this4 = this;

                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (r) {
                        try {
                            r = r.response;

                            if (r.status == 200 && r.responseText) {
                                resolve(_this4.GetModelFromConfig(r.responseText));
                            } else {
                                throw new Error('Empty response text or bad status');
                            }
                        } catch (e) {
                            reject(e);
                            Skyload.setLog('Vimeo Libs', 'Get config model error', e);
                        }
                    });
                });
            }
        }, {
            key: 'GetClipPageConfig',
            value: function GetClipPageConfig(data) {
                var _this5 = this;

                return new Promise(function (resolve, reject) {
                    var configUrl = null;
                    var scriptList = Skyload.Methods.GetPageScript(data, /['"]config_url['"]\s*:\s*/);

                    scriptList.some(function (script) {
                        var configList = Skyload.Methods.FindJson(script, /['"]config_url['"]\s*:\s*/);

                        return configList.some(function (config) {
                            if (config.player) {
                                configUrl = config.player.config_url;
                                if (configUrl) {
                                    return true;
                                }
                            }
                        });
                    });

                    if (configUrl) {
                        _this5.GetConfigModel(configUrl).then(resolve, reject);
                    } else {
                        reject(new Error('Empty config url'));
                    }
                });
            }
        }, {
            key: 'GetModelFromConfig',
            value: function GetModelFromConfig(config) {
                config = config.replace(/(\{|,)\s*(\w+)\s*:/ig, '$1"$2":').replace(/(:\s+)\'/g, '$1"').replace(/\'([,\]\}])/g, '"$1');

                try {
                    config = JSON.parse(config);
                } catch (err) {
                    return null;
                }

                return this._GetModelFromConfig(config);
            }
        }, {
            key: '_GetModelFromConfig',
            value: function _GetModelFromConfig(config) {
                if (!config || !config.video || !config.request || !config.request.files) {
                    return null;
                }

                var video = config.video;
                var files = config.request.files;

                var model = {
                    index: [this.sig, video.id].join('_'),
                    id: video.id,
                    source: this.sig,
                    name: video.title || '',
                    duration: parseInt(video.duration),
                    play: []
                };

                var maxSize = null;
                for (var size in video.thumbs) {
                    if (maxSize === null || maxSize < size) {
                        maxSize = size;
                        model.cover = video.thumbs[size];
                    }
                }

                for (var type in files) {
                    if (!Array.isArray(files[type])) {
                        continue;
                    }

                    files[type].forEach(function (item) {
                        if (!item || !item.url || !item.mime) {
                            return;
                        }

                        var ext = item.mime.split('/')[1];
                        if (!ext) {
                            ext = item.url.match(/\.(\w{2,4})(?:\?|#|$)/i);
                            ext = ext && ext[1] || 'mp4';
                        }

                        model.play.push({
                            id: video.id,
                            name: model.name,
                            url: item.url,
                            quality: item.quality,
                            format: ext.toUpperCase(),
                            index: item.height,
                            duration: model.duration,
                            mime_type: ['video', ext.toLowerCase()].join('/')
                        });
                    });
                }

                if (!model.play.length) {
                    model = null;
                }

                return model;
            }
        }]);

        return Vimeo;
    }();

    if (!(Skyload.LIB_VIMEO in Skyload)) {
        Skyload[Skyload.LIB_VIMEO] = new Vimeo();
    }

    return Vimeo;
});