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

define('stream', ['backbone', 'md5', 'underscore'], function (Backbone, md5, _) {
    var Stream = function () {
        function Stream(playlist, type, size, format) {
            var _this = this;

            _classCallCheck(this, Stream);

            this.playlist = playlist;
            this.type = type;
            this.format = format;

            this.blob = null;
            this.url = null;
            this.size = 0;

            this.events = _.extend({}, Backbone.Events);
            this.onUpdateSize(function (size) {
                return _this.size = size;
            });

            this.worker = new Worker(Skyload.getLink('js/background/workers/stream.js'));

            this.worker.postMessage({
                cmd: 'init',
                msg: {
                    type: this.type,
                    playlist: this.playlist,
                    size: size || 1 * 1024 * 1024 * 1024,
                    name: md5(this.type + this.playlist.length + _.now()) + '.' + this.format
                }
            });

            this.worker.onmessage = function (e) {
                try {
                    _this.events.trigger(e.data.cmd, e.data.msg);
                } catch (e) {
                    _this.events.trigger('error', e.message);
                }
            };

            this.worker.onerror = function (e) {
                Skyload.setLog('Stream', 'Worker error', e);
                _this.events.trigger('error', 'Some error in worker');
            };
        }

        _createClass(Stream, [{
            key: 'getSize',
            value: function getSize() {
                return this.size;
            }
        }, {
            key: 'start',
            value: function start() {
                this.worker.postMessage({ cmd: 'start' });
                return this;
            }
        }, {
            key: 'stop',
            value: function stop() {
                this.worker.postMessage({ cmd: 'stop' });
                return this;
            }
        }, {
            key: 'onProgress',
            value: function onProgress(callback) {
                this.events.on('progress', callback);
                return this;
            }
        }, {
            key: 'onUpdateSize',
            value: function onUpdateSize(callback) {
                this.events.on('update_size', callback);
                return this;
            }
        }, {
            key: 'getURL',
            value: function getURL() {
                var _this2 = this;

                if (!_.isNull(this.url)) {
                    return Promise.resolve(this.url);
                }

                return new Promise(function (resolve, reject) {
                    _this2.start();

                    _this2.events.on('url', function (url) {
                        _this2.url = url;
                        resolve(_this2.url);
                    });

                    _this2.events.on('error', function (message) {
                        reject(new Error(message));
                    });
                });
            }
        }]);

        return Stream;
    }();

    return Stream;
});